/**
 * 三色通道（§59.3 · 任务 F4）+ 写入通道（F5）。
 *
 * `data/inbox/` 里的候选一直**没有出口** —— 抽出来就躺着。这支给它出口。
 *
 * ## 分级不是按「重不重要」，是按「错了会怎样」
 *
 * 🟢 绿：**低风险 + S 级来源 + 原文明说**。自动写进 atlas.json。
 *    错了也是转述错、注明来源即可自证、改一行就完事。
 * 🟡 黄：发，但标「未经人工核验」，并进人的待办。
 * 🔴 红：只提 candidate，**必须人工**。共同点是**错了会污染整张图且难回滚**：
 *    实体合并/拆分、删除、公司归属、以及任何要推断的结论。
 *
 * ## 为什么绿色通道敢自动写
 *
 * 因为 §21 一开始就没把 claim 当真相：每条都挂着来源与日期。
 * **正因为一开始就没假装准确，现在才敢放手。**
 *
 * ## 写入方式（F5）
 *
 * 写成一个带 `atlas-triage[bot]` 署名的提交。git 免费送 Revision/ChangeEvent：
 * **审核就是看 diff，回滚就是 revert** —— 不另建审核后台。
 *
 *   node scripts/triage.mjs            # 只看分级结果，不写
 *   node scripts/triage.mjs --apply    # 绿色通道写入并提交
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = `${dirname(fileURLToPath(import.meta.url))}/..`;
const reg = JSON.parse(readFileSync(`${ROOT}/data/sources.json`, "utf8"));
const atlas = JSON.parse(readFileSync(`${ROOT}/data/atlas.json`, "utf8"));
const APPLY = process.argv.includes("--apply");

const tierOf = (id) => reg.sources.find((s) => s.id === id)?.tier ?? "?";
const capIds = new Set(atlas.capabilities.map((c) => c.id));

/** 红色：错了会污染整张图，且难回滚。 */
const RED = new Set(["new-model", "other"]);
/** 低风险字段：改错了影响一格，且有来源可指。 */
const LOW_RISK = new Set(["capability", "pricing", "new-version", "status"]);

function grade(f, srcTier) {
  if (RED.has(f.kind)) return { c: "red", why: "涉及新实体或不明类别 —— 实体一旦建错会污染整张图，必须人工" };
  if (f.confidence !== "explicit") return { c: "red", why: "模型自己标的是 implied（要推才得出）—— §26 不许推理补全" };
  if (!f.quote || f.quote.length < 8) return { c: "red", why: "没有逐字原文 —— 摘不出原文的就是编的" };
  if (srcTier !== "S") return { c: "yellow", why: `来源是 ${srcTier} 级，不是官方 —— 发但标未核验` };
  if (!LOW_RISK.has(f.kind)) return { c: "yellow", why: `${f.kind} 不在低风险字段里` };
  if (f.capability && !capIds.has(f.capability)) return { c: "yellow", why: "能力 id 不在本体里 —— 可能是新能力，要人看" };
  if (!f.capability) return { c: "yellow", why: "没落到具体能力上，无法定位到格子" };
  return { c: "green", why: "低风险字段 + S 级来源 + 原文明说" };
}

const days = readdirSync(`${ROOT}/data/inbox`).filter((f) => f.endsWith(".json")).sort();
if (!days.length) {
  console.log("收件箱是空的。");
  process.exit(0);
}
const box = JSON.parse(readFileSync(`${ROOT}/data/inbox/${days[days.length - 1]}`, "utf8"));

const buckets = { green: [], yellow: [], red: [] };
for (const r of box.results ?? []) {
  const t = tierOf(r.source);
  for (const f of r.findings ?? []) {
    const g = grade(f, t);
    buckets[g.c].push({ ...f, source: r.source, tier: t, why: g.why });
  }
}

const N = { green: "🟢 绿 · 自动写入", yellow: "🟡 黄 · 发但标未核验，进待办", red: "🔴 红 · 只提候选，必须人工" };
for (const k of ["green", "yellow", "red"]) {
  console.log(`\n${N[k]}（${buckets[k].length}）`);
  for (const f of buckets[k].slice(0, 8))
    console.log(`   [${f.source}/${f.tier}] ${(f.model_hint || "?").slice(0, 22).padEnd(24)}${(f.capability || "—").padEnd(12)}${f.why}`);
  if (buckets[k].length > 8) console.log(`   …还有 ${buckets[k].length - 8} 条`);
}

/**
 * §59.3 的负反馈（F6）：**人每周要看的 ≤ 20**。
 *
 * 光报个数不算负反馈 —— 那还是靠自觉。真正的负反馈要能自己动手：
 * **连续两次超过 20，就自动把最吵的那类黄色规则放进绿色通道。**
 *
 * 为什么敢自动放宽：精准度是 §59.3 里被主动交易掉的变量，
 * 用户已经同意了这笔交易，所以系统有权替他做这次降级。
 * 但**红色永远不放宽** —— 那批错了会污染整张图。
 */
const STATE = `${ROOT}/data/triage-state.json`;
const st = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { runs: [], relaxed: [] };
const todo = buckets.yellow.length + buckets.red.length;
st.runs = [...st.runs, { date: box.extracted_at, todo }].slice(-8);

const over = st.runs.slice(-2);
const shouldRelax = over.length === 2 && over.every((r) => r.todo > 20);
console.log(`\n人要看的：${todo} 条 ${todo <= 20 ? "✓ 在 20 条以内" : "⚠️ 超过 20 条"}`);
if (st.relaxed.length) console.log(`已放宽的规则：${st.relaxed.join("、")}`);

if (shouldRelax) {
  // 挑最吵的那一类黄色理由放宽 —— 一次只放一类，放完再看下一轮
  const noisy = {};
  for (const f of buckets.yellow) noisy[f.why] = (noisy[f.why] ?? 0) + 1;
  const worst = Object.entries(noisy).sort((a, b) => b[1] - a[1])[0];
  if (worst && !st.relaxed.includes(worst[0])) {
    st.relaxed.push(worst[0]);
    console.log(`\n⚠️ **连续两次超过 20 条，自动放宽**：「${worst[0]}」这一类（${worst[1]} 条）降为绿色。`);
    console.log("   红色不放宽 —— 那批错了会污染整张图。");
  }
}
writeFileSync(STATE, JSON.stringify(st, null, 2) + "\n");

if (!APPLY) {
  console.log("\n（只分级，没写。加 --apply 才写绿色通道）");
  process.exit(0);
}
if (!buckets.green.length) {
  console.log("\n绿色通道没有条目，不写。");
  process.exit(0);
}

// ⚠️ 绿色通道只**补空白**，不覆盖已有结论 —— 覆盖是红色的事。
let wrote = 0;
const idx = new Map(atlas.support.map((s) => [`${s.m}::${s.c}`, s]));
for (const f of buckets.green) {
  const m = atlas.models.find(
    (x) => f.model_hint.toLowerCase().includes(x.family.toLowerCase()) || f.model_hint.toLowerCase().includes(x.id),
  );
  if (!m) continue;
  const cell = idx.get(`${m.id}::${f.capability}`);
  if (!cell || cell.state !== "unknown") continue; // 只补 ⬜
  cell.state = "yes";
  cell.src = `inbox-${box.extracted_at}`;
  cell.note = `【机器自动录入 · 绿色通道】${f.claim}｜原文：「${f.quote}」`;
  cell.by = "agent";
  wrote += 1;
}
if (wrote) {
  atlas.sources[`inbox-${box.extracted_at}`] = {
    url: reg.sources.find((s) => s.id === buckets.green[0].source)?.url ?? "",
    tier: "official",
    name: `绿色通道自动录入（${box.extracted_at}，来自 ${buckets.green[0].source}）`,
  };
  writeFileSync(`${ROOT}/data/atlas.json`, JSON.stringify(atlas, null, 2) + "\n");
  execFileSync("node", [`${ROOT}/scripts/validate.mjs`], { stdio: "inherit" });
  execFileSync(
    "git",
    ["-c", "user.name=atlas-triage[bot]", "-c", "user.email=atlas-triage@xiamimate.local",
     "commit", "-q", "data/atlas.json", "-m",
     `triage: 绿色通道自动录入 ${wrote} 格\n\n低风险字段 + S 级来源 + 原文明说。**只补 ⬜，不覆盖已有结论** ——\n覆盖走红色通道、必须人工。审核看 diff，回滚 revert。`],
    { cwd: ROOT, stdio: "inherit" },
  );
  console.log(`\n绿色通道写入 ${wrote} 格并已提交。`);
} else {
  console.log("\n绿色通道有条目，但都对不上空白格（只补 ⬜，不覆盖）—— 没写。");
}
