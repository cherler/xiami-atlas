/**
 * 保鲜巡检 —— 把「页面上写的还成不成立」这三支散脚本收进一次跑、一份报告。
 *
 * ## 为什么要有这一层
 *
 * `refresh-repos --dry`、`readme-drift`、`tutorials-check` 三支都在，
 * 但它们**只打到标准输出、用退出码表态**，谁也不落文件。于是：
 *
 * - 只有 repos 那支被 `tick.sh` 调着，另外两支**没有任何调度**，靠人想起来才跑；
 * - 三支的产出全躺在 `data/watch.log` 里，而人不会每天打开日志 ——
 *   这正是当初建 `todo.mjs` 要解决的毛病，在这三支身上又犯了一遍。
 *
 * ## 退出码不够用，所以要解析条数
 *
 * `readme-drift` 的「上游改过话」**不改退出码**（故意的：判成失败会让它天天红，
 * 然后就没人看了）。也就是说光看退出码，最需要人看的那一类恰好是静音的。
 * 所以这里按行取数。
 *
 * 但**解析别人的人话输出是会烂的** —— 上游改一句 `console.log` 这里就静静地数成 0，
 * 而「0 条待办」和「没解析出来」在待办表上长得一模一样。所以每支都带自检：
 * **退出码说有事、却一条都没解析到 → 明着报「解析规则该修了」**，不装作没事。
 *
 * ## 它只报，不改
 *
 * 和 `watch.mjs` 同一条纪律：**机器不碰 `atlas.json`**。三支里只有
 * `refresh-repos` 能写回，这里固定跑 `--dry`。真要写回是人在审阅台上点。
 *
 *   node scripts/fresh.mjs          → data/fresh-report.md + data/fresh.json
 *   node scripts/fresh.mjs repos    → 只跑其中一支
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * 每支一条。`picks` 是「人要看的条数」从哪一行取 ——
 * **一支可以有多类**（README 那支的「改过话」和「仓库没了」是两回事，
 * 前者要人核判断，后者是链接会死）。
 */
export const JOBS = [
  {
    id: "repos",
    zh: "开源项目仓库数字",
    cmd: ["node", "scripts/refresh-repos.mjs", "--dry"],
    picks: [{ re: /要人看一眼的 (\d+) 条/, label: "会改变结论的变化" }],
    why: "星数、停更月数是**会过期的事实**。「在维护」变成「停更 12 个月」之后，卡上的标签、"
      + "`unfit` 里的判断、要不要继续收录，全都得跟着重想 —— 页面却照写不误。",
    how: "确认后跑 `npm run repos` 写回（审阅台上有按钮），再上线。",
  },
  {
    id: "readme",
    zh: "README 漂移",
    cmd: ["node", "scripts/readme-drift.mjs"],
    picks: [
      { re: /上游改过话的 (\d+) 个/, label: "上游改过话" },
      { re: /仓库 404 \/ 改名 (\d+) 个/, label: "仓库没了或改名" },
    ],
    why: "我们对开源项目的判断是从**当时那一版 README** 读出来的。上游改了口径，"
      + "页面上那句引用就成了假话，而没有任何人会收到通知。",
    how: "逐条核页面上引它的判断；核完 `node scripts/fetch-readme.mjs <项目 id>` 更新快照。",
  },
  {
    id: "links",
    zh: "教程与作品链接",
    cmd: ["node", "scripts/tutorials-check.mjs"],
    picks: [{ re: /· 打不开 (\d+) ·/, label: "打不开" }],
    why: "外链是我们唯一给不了兜底的东西。**限流不算死链** —— 那支脚本已经分开了，"
      + "这里取的只有真打不开的那一类。",
    how: "换链接或删掉，别留着。改 `data/atlas.json` 里对应的 `tutorials` / `works` / `basics`。",
  },
];

const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const jobs = only.length ? JOBS.filter((j) => only.includes(j.id)) : JOBS;
if (!jobs.length) {
  console.error(`没有这一支。可选：${JOBS.map((j) => j.id).join(" / ")}`);
  process.exit(2);
}

const TODAY = new Date().toISOString().slice(0, 10);
const AT = new Date().toISOString().slice(0, 16).replace("T", " ");
const out = [];

for (const j of jobs) {
  process.stderr.write(`── ${j.zh}…\n`);
  const r = spawnSync(j.cmd[0], j.cmd.slice(1), {
    cwd: ROOT,
    encoding: "utf8",
    /** 巡检本身可能很慢（教程那支要查两百多条外链），给足时间但必须有上限。 */
    timeout: 20 * 60 * 1000,
    maxBuffer: 32 * 1024 * 1024,
  });
  const text = `${r.stdout ?? ""}${r.stderr ?? ""}`.trimEnd();
  const hits = [];
  for (const p of j.picks) {
    const m = text.match(p.re);
    if (m && Number(m[1]) > 0) hits.push({ label: p.label, n: Number(m[1]) });
  }
  const n = hits.reduce((s, h) => s + h.n, 0);

  /**
   * 自检：**退出码说有事，却一条都没数出来。**
   * 十有八九是上游改了输出措辞，而不是真的没事 —— 这种时候必须吵，
   * 因为「没解析出来」在待办表上长得和「没有待办」一模一样。
   */
  const 跑不起来 = r.error ? `跑不起来：${r.error.code ?? r.error.name}` : null;
  const 数没对上 = !跑不起来 && r.status !== 0 && n === 0
    ? `退出码 ${r.status} 说有问题，但一条都没解析到 —— **解析规则该修了**（scripts/fresh.mjs 的 picks）`
    : null;

  out.push({ ...j, n, hits, exit: r.status, text, 跑不起来, 数没对上, day: TODAY, at: AT });
  process.stderr.write(`   ${跑不起来 ?? 数没对上 ?? (n ? `${n} 条要人看` : "没有要人看的")}\n`);
}

/**
 * ⚠️ **只跑一支时，另外两支的结果要留着。**
 *
 * 审阅台上有「只查仓库数字 / 只查 README / 只查外链」三个按钮，
 * `tick.sh` 也可能只带其中几支跑。要是每次都整份覆写，
 * 点一下「只查仓库数字」，外链那一摞待办就**凭空消失了** ——
 * 看起来像「处理完了」，其实只是没查。所以按 id 合并，各带各的日子。
 */
const prev = existsSync(join(ROOT, "data/fresh.json"))
  ? JSON.parse(readFileSync(join(ROOT, "data/fresh.json"), "utf8") || "{}")
  : {};
const merged = JOBS.map((j) => out.find((o) => o.id === j.id) ?? (prev.jobs ?? []).find((o) => o.id === j.id))
  .filter(Boolean);

/* ── 人看的那一份 ─────────────────────────────────────────────────── */
const md = [
  `# 保鲜巡检 · ${AT}`,
  ``,
  `页面上写的**还成不成立**。三支各查一类，**只报不改** —— 写回由人在审阅台上点。`,
  ``,
  ...merged.flatMap((o) => [
    `## ${o.zh}　${o.跑不起来 ?? o.数没对上 ?? (o.n ? o.hits.map((h) => `${h.label} ${h.n}`).join(" · ") : "没有要人看的")}`,
    ``,
    `查于 ${o.at}${o.day === TODAY ? "" : "（这一支这次没跑，下面是上回的结果）"}`,
    ``,
    o.why,
    ``,
    `→ ${o.how}`,
    ``,
    "```",
    /** 没跑的那几支手上没有原文（`text` 不进 json），只留结论。 */
    o.text ?? "（这次没跑；结论见上，原文要重跑才有）",
    "```",
    ``,
  ]),
].join("\n");
writeFileSync(join(ROOT, "data/fresh-report.md"), `${md}\n`);

/**
 * 机器读的那一份。**待办表不去重新解析上面那篇人话** ——
 * 一个口径解析两遍，迟早两边给出不同的数。
 *
 * `text` 不进这一份：原文动辄几百行，而待办表只要结论；
 * 要看原文去 `fresh-report.md`（审阅台上点得开）。
 */
writeFileSync(
  join(ROOT, "data/fresh.json"),
  `${JSON.stringify({ at: AT, day: TODAY, jobs: merged.map(({ text, ...o }) => o) }, null, 1)}\n`,
);

/**
 * ⚠️ **报的是合并之后的数，不是这次跑出来的数。**
 *
 * 只跑一支时，这一行原来会说「0 条要人看」—— 而报告里另外两支还挂着 6 条。
 * 那句话本身没说谎（这次确实没查出新的），但人读到的是「现在没事」。
 * 屏幕上的结论必须和报告里的一致，否则下次就得靠人记得「这个数只算一半」。
 */
const total = merged.reduce((s, o) => s + o.n, 0);
const 这次 = out.reduce((s, o) => s + o.n, 0);
const broken = merged.filter((o) => o.跑不起来 || o.数没对上);
console.log(
  `保鲜巡检：${total} 条要人看`
  + (merged.length === out.length ? "" : `（这次跑的 ${jobs.length} 支贡献 ${这次} 条，其余是上回的结论）`)
  + (broken.length ? `，${broken.length} 支自己有问题` : "")
  + " → data/fresh-report.md",
);
/** 有要人看的就非零 —— `tick.sh` 拿它决定要不要写进当天的待办。 */
process.exit(total || broken.length ? 1 : 0);
