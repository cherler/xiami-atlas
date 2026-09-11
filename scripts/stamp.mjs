/**
 * 记一步管线的执行状态 —— **让「跳过」有地方留痕**。
 *
 * 起因（2026-09-10）：`tick.sh` 里的抽取那一步从 2026-08-07 起就没跑过，
 * 因为 `.env` 里没有 MINIMAX_API_KEY。脚本处理得很「体面」——
 * 打一行「没有 MINIMAX_API_KEY，跳过抽取」进日志，然后照常往下走、退出码 0。
 *
 * 于是一个月里：快照天天更新、待办表天天生成、飞书天天送达，
 * **而那条把「页面变了」翻译成「这意味着出了新版」的链路，一天都没跑过**，没有任何人知道。
 *
 * 一个报告成功却什么都没做的定时任务，比一个明着失败的更糟 —— 这句话
 * `watch.mjs` 的注释里已经写过一次了（那次是 `--only` 的 -1 下标 bug）。
 * 同一个错犯第二次，就该把它变成过不去的校验，而不是再写一行注释。
 *
 *   node scripts/stamp.mjs <步骤 id> <ok|skip|fail> [原因]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const F = join(ROOT, "data/pipeline.json");
const [id, status, ...why] = process.argv.slice(2);
if (!id || !["ok", "skip", "fail"].includes(status ?? "")) {
  console.error("用法：node scripts/stamp.mjs <步骤 id> <ok|skip|fail> [原因]");
  process.exit(2);
}

const db = existsSync(F) ? JSON.parse(readFileSync(F, "utf8")) : { steps: {} };
const TODAY = new Date().toISOString().slice(0, 10);
const prev = db.steps[id] ?? {};
db.steps[id] = {
  status,
  at: TODAY,
  why: why.join(" ") || undefined,
  // **最后一次真跑成的日子要单独记。** 只记「今天什么状态」的话，
  // 一个连续跳了 34 天的步骤，看起来和昨天刚跳过一次的一模一样。
  last_ok: status === "ok" ? TODAY : prev.last_ok,
  skipped_since: status === "ok" ? undefined : (prev.skipped_since ?? TODAY),
};
db.generated_at = TODAY;
writeFileSync(F, JSON.stringify(db, null, 2) + "\n");
