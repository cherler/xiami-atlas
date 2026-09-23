/**
 * 快讯通知：把「刚发生、而且等不到周报」的那几条，当天送出去。
 *
 * ## 为什么需要这一层
 *
 * 这个站原来有三条出口，各有各的节奏：
 *
 * - `/changes` 页与 `changes.xml`：**读者主动来才看得到**；
 * - 周报：一周一次，而且它是增长动作，不是通知；
 * - 飞书（`todo.mjs`）：报的是**我们自己的待办**，不是世界的变化。
 *
 * 三条都不覆盖「今天有一件事改变了做法，而下周一才说就晚了」。
 * 2026-08-17 的白模预演就是这种：它不是某个模型涨了个参数，
 * 是**多了一条控制轴**，看到与没看到的人，做法会完全不同。
 *
 * ## 快讯条目不另建一份数据
 *
 * `changes.json` 的开头写着：「**变更事件只有这一份。** 我一度在 atlas.json 里
 * 另建了 change_events，那是同一个口径的第二份 —— 两份迟早对不上。」
 * 所以快讯不是新表，是变更事件上的一个 `alert` 字段。
 * 同一条事实，页面、RSS、横幅、飞书四个出口全都从它出来。
 *
 * ## 有效期由数据带，不靠人记得撤
 *
 * `alert.until` 是硬性的：过了那天横幅自己下架。
 * **一个要靠人记得删的横幅，就是会挂一年的横幅** —— 而挂着的旧快讯
 * 比没有横幅更伤：它告诉读者这个站没人管。
 *
 * ## 只报不改
 *
 * 和 `watch.mjs` / `fresh.mjs` 同一条纪律：这支不碰 `atlas.json`。
 * 它只读 `changes.json`，产出 `data/alerts.json`（给前端）与一条飞书消息。
 *
 *   node scripts/alert.mjs          # 挑 + 写 alerts.json + 没推过的推飞书
 *   node scripts/alert.mjs --dry    # 只看，不写不推
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
/** 挂多久的口径**只有一份**，validate 也读它 —— 见 scripts/lib/alert-window.mjs 文件头。 */
import { untilOf, isLive, liveAlerts, headlineOf } from "./lib/alert-window.mjs";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
/**
 * **推送要显式要，不能顺带发生。**
 *
 * 这支挂在两处：`prebuild`（每次构建都跑，为的是把过期的快讯从横幅上摘掉）
 * 和 `tick.sh`（每天一跳）。要是默认就推飞书，那**每构建一次就发一条通知** ——
 * 本地跑一次 `npm run build` 群里就响一下，而那条消息的内容一模一样。
 * 所以：算横幅是默认动作，推送必须写 `--push`。
 */
const PUSH = process.argv.includes("--push");
const TODAY = new Date().toISOString().slice(0, 10);

const changes = JSON.parse(readFileSync(join(ROOT, "data/changes.json"), "utf8"));
/**
 * 这一层叫什么，**写在数据里，不写在代码里**。
 *
 * 它出现在四个地方：横幅上的小方块、RSS 的 `<category>`、飞书标题、命令行输出。
 * 分散写死的话改个名字要动四处，而漏掉一处不会报错 —— 只是站上两个名字并存。
 * 2026-08-19 就改过一次名（「突发」→「快讯」：那一层不是新闻，
 * 是「知道与不知道，做法会不一样」，而「突发」太像标题党，与这个站的口气不合）。
 */
const LABEL = changes.$alert_label ?? "快讯";
const atlas = JSON.parse(readFileSync(join(ROOT, "data/atlas.json"), "utf8"));

/**
 * **在架的那几条由 `liveAlerts` 算** —— 手写的 `alert` 在前，
 * 「新模型 / 版本更迭」一期之内自动上架兜底（负责人 2026-09-23：
 * 「新增或者新更新的内容，要保持头条展示新增」）。
 * 算法只有这一份，validate 用的是同一个函数 —— 两处各算各的后果见 lib/alert-window.mjs 开头。
 */
const { items: live, more } = liveAlerts(changes.events, TODAY);

/** 过期的也数出来 —— 「今天下架了一条」是要能看见的，静静消失等于没有台账。 */
const expired = changes.events.filter((e) => e.alert && !isLive(e, TODAY));

/**
 * 给前端的那一份。**字段是抄出来的，不是引用** ——
 * 前端只 import 这一个小文件，不用把整份 changes.json 打进包里。
 */
const alerts = {
  at: TODAY,
  /** 标签一起带给前端 —— 组件里不再出现中文常量。 */
  label: LABEL,
  /** 被 3 条上限截掉的条数。**不许悄悄少一条** —— 前端据此给一条「还有 N 条」。 */
  more,
  items: live.map((e) => {
    const src = e.src ? atlas.sources[e.src] : null;
    return {
      id: e.id,
      date: e.date,
      until: untilOf(e),
      headline: headlineOf(e),
      /** 自动上架的标一下 —— 横幅上不显示，但排查时要分得清是编辑挑的还是兜底上的。 */
      auto: e.alert ? undefined : true,
      why: e.why,
      domain: e.domain ?? null,
      /** 出处直接带上：横幅上没有出处，就成了广告条。 */
      src: src ? { name: src.name, url: src.url, tier: src.tier } : null,
    };
  }),
};

if (!DRY) writeFileSync(join(ROOT, "data/alerts.json"), `${JSON.stringify(alerts, null, 1)}\n`);

console.log(`${LABEL}：在架 ${live.length} 条${more ? `（另有 ${more} 条被 3 条上限截掉）` : ""}${expired.length ? `，已下架 ${expired.length} 条` : ""}`);
for (const e of live) console.log(`  · ${e.date} → ${untilOf(e)}　${headlineOf(e)}${e.alert ? "" : "　[自动]"}`);
for (const e of expired) console.log(`  （已下架）${e.date} → ${untilOf(e)}　${headlineOf(e)}`);

/* ── 飞书：只推没推过的 ─────────────────────────────────────────── */
/**
 * 台账进 git。**不进 git 的话，换一台机器跑就会把所有快讯重推一遍** ——
 * 而重复通知比不通知更快让人关掉通知。
 */
const LEDGER = join(ROOT, "data/alert-sent.json");
const sent = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, "utf8")) : { sent: [] };
const todo = live.filter((e) => !sent.sent.some((s) => s.id === e.id));

const HOOK = (process.env.ATLAS_FEISHU_WEBHOOK_URL || "").trim();
if (!todo.length) {
  if (live.length) console.log("没有要推的（都推过了）");
} else if (!PUSH) {
  console.log(`${todo.length} 条还没推 —— 要推加 --push（构建时故意不推，见文件头）`);
} else if (DRY) {
  console.log(`--dry：${todo.length} 条本来要推飞书`);
} else if (!HOOK) {
  console.log(`⚠ ${todo.length} 条没推 —— 缺 ATLAS_FEISHU_WEBHOOK_URL（横幅与 RSS 不受影响）`);
} else {
  for (const e of todo) {
    const src = e.src ? atlas.sources[e.src] : null;
    const lines = [
      e.alert.headline,
      "",
      `之前：${strip(e.before)}`,
      `现在：${strip(e.after)}`,
      "",
      `为什么重要：${strip(e.why)}`,
      src ? `出处：${src.name}　${src.url}` : "（这条没有出处 —— 不该发出来，去 changes.json 补）",
      "",
      `站上：https://xiamimate.com/atlas/changes　挂到 ${untilOf(e)}`,
    ];
    const res = await fetch(HOOK, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        msg_type: "post",
        content: { post: { zh_cn: {
          title: `虾米看AI · ${LABEL}｜${e.subject}`,
          content: lines.map((t) => [{ tag: "text", text: t }]),
        } } },
      }),
      signal: AbortSignal.timeout(20_000),
    }).catch((err) => ({ ok: false, statusText: String(err) }));
    if (!res.ok) { console.error(`✗ 推送失败：${e.id} ${res.statusText ?? ""}`); continue; }
    sent.sent.push({ id: e.id, at: new Date().toISOString().slice(0, 16).replace("T", " ") });
    console.log(`✓ 已推飞书：${e.id}`);
  }
  writeFileSync(LEDGER, `${JSON.stringify(sent, null, 1)}\n`);
}

/** 飞书那条是纯文本，`**` 只会原样显示成两个星号。 */
function strip(s) { return String(s ?? "").replace(/\*\*/g, "").replace(/「|」/g, '"'); }
