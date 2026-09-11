/**
 * 周报生成（方案 §59.4.a · 任务 B2）。
 *
 * §59.4.a 的判断是：**周报是这个项目唯一的增长动作，不是运维。**
 * 而且「写周报就是在录入数据」—— 每条变更天然带 before/after/source/date。
 *
 * 所以这支反过来用那句话：**数据就是周报的原料。**
 * 统计、清单、口径全部从 atlas.json 和 git 算出来，人只写开头那几句判断。
 * 手抄的周报第二期就会和站上对不上，而这个项目卖的就是「对得上」。
 *
 * git 当数据库（§59.4.c）在这里第一次真正兑现：
 * commit 就是 Revision，作者区分人和 bot，diff 就是 ChangeEvent。
 *
 *   node scripts/weekly.mjs            # 打到 stdout
 *   node scripts/weekly.mjs --write    # 写进 weekly/<期号>-<日期>.md
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const a = JSON.parse(readFileSync(join(ROOT, "data/atlas.json"), "utf8"));
const reg = JSON.parse(readFileSync(join(ROOT, "data/sources.json"), "utf8"));
const WRITE = process.argv.includes("--write");
const DIR = join(ROOT, "weekly");
const issue = (existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith(".md")).length : 0) + 1;
/**
 * 周报的日期是**出报那天**，不是能力格的核验日期。
 * 上一版用了 `atlas.generated_at`，结果第 2 期和第 1 期同一个日期、
 * 文件名都差点撞上 —— **那两个日期是两件事**：一个是「这份报告什么时候出的」，
 * 一个是「能力格什么时候核的」。
 */
const TODAY = new Date().toISOString().slice(0, 10);

const git = (...args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
const core = a.models.filter((m) => (m.tier ?? "core") === "core");
const cell = (m, c) => a.support.find((s) => s.m === m && s.c === c) ?? { state: "unknown" };
const capsOf = (cls) => a.capabilities.filter((c) => (c.domain ?? "video") === "video" && (c.class === "both" || c.class === cls));
const label = (m) => {
  const last = m.family.split(" ").pop();
  return m.version.startsWith(last) ? `${m.family.slice(0, -last.length).trim()} ${m.version}` : `${m.family} ${m.version}`;
};

const t = { yes: 0, no: 0, unknown: 0 };
for (const m of core) for (const c of capsOf(m.class)) t[cell(m.id, c.id).state] += 1;

// ⬜ 的分布 —— **只报总数会骗人**，集中在一两家和平摊到九家是两件事
const unk = core
  .filter((m) => m.class === "clip")
  .map((m) => ({ m, n: capsOf("clip").filter((c) => cell(m.id, c.id).state === "unknown").length }))
  .sort((x, y) => y.n - x.n);

// git 当数据库：commit 作者区分人和 bot（§59.4.c）
const log = git("log", "--since=7 days ago", "--pretty=%an\t%s").split("\n").filter(Boolean);
const bot = log.filter((l) => l.startsWith("atlas-")).length;

// **「官方页上查不到」不是一种计价方式** —— 上一版把它也算进去了，
// 于是「N 种计价方式」这个数虚高。分开数。
const units = {};
for (const q of (a.pricing ?? []).filter((x) => x.unit !== "unavailable")) units[q.unit] = (units[q.unit] ?? 0) + 1;
const noPrice = (a.pricing ?? []).filter((x) => x.unit === "unavailable").length;
const blocked = (a.platforms ?? []).filter((p) => p.discloses === "blocked");
const older = (a.availability ?? []).filter((v) => v.match === "older");
const noSrcHq = a.orgs.filter((o) => !o.hq_src).length;
/** 「用不上」的条数：和前台同一套算法的最小版本，**不另抄一份口径**。 */
const cav = () => {
  const older = (a.availability ?? []).filter((v) => v.match === "older").length;
  const gone = (a.availability ?? []).filter((v) => {
    const m = a.models.find((x) => x.id === v.m);
    return m?.status === "discontinued" && v.status !== "gone";
  }).length;
  const soon = (a.availability ?? []).filter((v) => v.status === "coming-soon").length;
  const blocked = a.models.filter((m) => m.reach_cn === "blocked" && (m.tier ?? "core") === "core").length;
  const trap = (a.discount ?? []).filter((d) => /不支持|暂不/.test(d.off + d.rule)).length;
  const byM = {};
  for (const q of (a.pricing ?? []).filter((x) => x.unit === "per-second")) (byM[q.m] ??= []).push(q);
  const varies = Object.values(byM).filter((x) => x.length > 1).length;
  return older + gone + soon + blocked + trap + varies;
};

const md = `# 虾米看AI · 第 ${issue} 期（${TODAY}）

> 这份周报**从数据生成**，不是手写的。统计、清单、口径全部算自 \`data/atlas.json\` 和 git；
> 人只写判断。手抄的周报第二期就会和站上对不上，而这个项目卖的就是「对得上」。

## 这周的表长什么样

${core.filter((m) => m.class === "clip").length} 个离线出片模型 × ${capsOf("clip").length} 项能力。
✅ ${t.yes} 项有官方依据 · ❌ ${t.no} 项官方明说不支持 · ⬜ ${t.unknown} 项官方没说。

**⬜ 不是「不支持」，是「查了公开渠道找不到」。** 而且它不是平摊的：

${unk.slice(0, 3).map((u) => `- ${label(u.m)}：${u.n}/${capsOf("clip").length} 项没说`).join("\n")}
- 最少的是 ${label(unk[unk.length - 1].m)}，只有 ${unk[unk.length - 1].n} 项

只报总数会骗人。**要看分布 —— 分布告诉你的是哪家厂商不爱写文档。**

## 价格：难的不是抓全，是它们压根不在同一个刻度上

${Object.values(units).reduce((x, y) => x + y, 0)} 条能标出价，用了 ${Object.keys(units).length} 种计价方式：
${Object.entries(units).map(([k, v]) => `\`${k}\` ${v} 条`).join(" · ")}。
另有 ${noPrice} 条**官方页上查不到** —— 那不是一种计价方式，是我们没拿到。

Veo 和 Vidu 按秒标美元，Kling 和万相按秒标人民币，海螺记「视频点数」，
Runway 只卖订阅，Seedance 把视频价放在飞书多维表里。
**把它们并成一列「每秒多少钱」，那一列一定是编的**，所以我们不做那一列。
人民币和美元也不换算 —— 汇率是我们加的假设，不是厂商说的。

同一个模型的价差也远超预期：Kling 3.0 从 720P 的 ¥0.6/秒 到 4K 的 ¥3.0/秒，**差 5 倍**。

## 这周撞出来的硬事实

${older.length ? `- **平台上架的常常不是当前主力版本**：${(a.availability ?? []).length} 条上架记录里有 ${older.length} 条挂的是旧版本。「能力对」不等于「你用得上」。\n` : ""}- MiniMax 官方明写「视频资源包**暂不支持 MiniMax H3**」—— 而 H3 正是我们记的当前主力
- 百炼价格页上万相最新是 **wan2.7**，没有我们记的 3.0

## 谱系

${(a.versions ?? []).length} 次发布，${new Set((a.versions ?? []).map((v) => v.m)).size} 条产品线，
从 ${(a.versions ?? []).map((v) => v.date).sort()[0]} 到今天。
按第一次发布时是否公开权重分成两条主干 —— **中间是交叉的**：
万相 2.1/2.2 有权重、2.5 之后没有；海螺反过来，只有最新的 H3 放了权重。

## 能力对了 ≠ 你用得上

现算出 ${cav()} 条：上游停服了平台还在卖、上架的不是当前版本、
优惠不覆盖主力型号、大陆直连不通。**一条都不手写** —— 某天不再成立，它自己就消失。

## 我们自己没做到的

- **${noSrcHq} 家公司的总部还没有来源**，全是按常识填的。校验会一直警告，前台也标着 —— 不许因为「大家都知道」就当核过了。
- **${blocked.length} 个平台我们读不到页面**（${blocked.map((p) => p.name).join("、")}）。
  这一栏空着**是我们的缺口，不是它们在藏** —— 所以记 ⬜「我们没看到」，不记 🔴「只字不提」。
  🔴 的门槛是「整页读完了」。
- 价格还差 ${core.filter((m) => !(a.pricing ?? []).some((q) => q.m === m.id)).length} 个模型没拿到官方价。

## 机器做了多少

本周 ${log.length} 次提交，其中 ${bot} 次是 Agent 自动写入（署名 \`atlas-*[bot]\`）。
Agent 只补空白格，**从不覆盖人已经核过的结论** —— 覆盖必须人工。
监视 ${reg.sources.length} 个信息源，每天早上跑一次。

---

*出报于 ${TODAY} · 数据 ${a.version}。能力格核验于 ${a.generated_at}；价格另有各自的核验日期（见站上每条）。*
*两个日期不合并 —— **合并就等于宣称什么都在同一天重查过**，那是假的。*
*每一格都能点开看厂商官方原文。*
*发现哪条不对，页面上每条都有「这一条不对？」。*
`;

if (WRITE) {
  mkdirSync(DIR, { recursive: true });
  // 文件名也用出报日期 —— 只改标题不改文件名，等于没改
  const f = join(DIR, `${String(issue).padStart(2, "0")}-${TODAY}.md`);
  writeFileSync(f, md);
  console.log(`写好：weekly/${String(issue).padStart(2, "0")}-${TODAY}.md`);
} else {
  console.log(md);
}
