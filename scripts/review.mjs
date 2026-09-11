/**
 * 人审的**处理流程** —— 不只是看，是「通过之后发生什么、不通过之后发生什么」。
 *
 * 负责人 2026-08-11：「不能只是通知、查看，得有处理的流程。
 * 如果人工审阅通过了怎么办、未通过怎么办这是一条路。」
 *
 * ## 三种去向，不是两种
 *
 * 「通过」不等于「自动写库」。红色那批之所以是红色，正是因为**收件箱里的信息
 * 不够建一个实体** —— 一条 claim 只有「模型名 + 能力 + 原文」，
 * 而新建一条产品线还要公司、轨、层级、架构依据。
 * 半填的实体比没有更糟：它会挂到关系图和演化树上，错得很自信。
 *
 * 所以「通过」按能不能落到具体格子分两路：
 *
 *   ✅ 通过 · 已落格   → 直接写进 atlas.json（只补 ⬜，不覆盖已有结论），
 *                      记 `by: "human"` 和审阅人。这一条马上生效。
 *   📋 通过 · 待补全   → 认了这件事是真的，但缺字段建不了实体。
 *                      写进 `data/review-pending.json`，**带上还缺什么**，
 *                      不进 atlas.json —— 它是一张明确的采集单，不是半成品数据。
 *   ❌ 不通过         → 写进 `data/review-rejected.json`，带理由。
 *                      **是记下来不是删掉**：同一条再被抓到时能认出「看过、否了」，
 *                      也才说得清为什么没收它。
 *
 * 三种都追加进 `data/review-log.json`（只增不改）并提交 —— §59.4.c
 * 用 git 当数据库：commit 是 Revision，作者区分人和 bot，diff 就是 ChangeEvent。
 *
 *   node scripts/review.mjs                       # 列队列
 *   node scripts/review.mjs --id X --pass  --who 名字
 *   node scripts/review.mjs --id X --reject --why "理由" --who 名字
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const P = (f) => join(ROOT, f);
const readJSON = (f, d) => (existsSync(P(f)) ? JSON.parse(readFileSync(P(f), "utf8")) : d);
const writeJSON = (f, v) => writeFileSync(P(f), `${JSON.stringify(v, null, 2)}\n`);
const NOW = () => new Date().toISOString().slice(0, 19).replace("T", " ");

/** 稳定 id：同一条 claim 无论跑几遍都是同一个 id，否则「否决过」就记不住。 */
const idOf = (f, day) =>
  /**
   * ⚠️ 用 `||` 不是 `??`。**空能力是 `""` 不是 `null`**，`??` 不会兜底，
   * 于是同一个模型下所有「没落到能力上」的 finding 都塌成同一个 id ——
   * 端到端一测：处理一条，队列少了两条。**又一次「没有值和取不到值混在一起」。**
   * 加 kind 与 claim 前缀，同源同模型的多条也分得开。
   */
  `${day}::${f.source}::${(f.model_hint || "").toLowerCase()}::${f.capability || f.kind}::${(f.claim || "").slice(0, 24)}`;

export function queue() {
  const rejected = new Set((readJSON("data/review-rejected.json", { rows: [] }).rows ?? []).map((r) => r.id));
  const pending = new Set((readJSON("data/review-pending.json", { rows: [] }).rows ?? []).map((r) => r.id));
  const done = new Set((readJSON("data/review-log.json", { rows: [] }).rows ?? []).map((r) => r.id));
  const atlas = readJSON("data/atlas.json", {});
  const reg = readJSON("data/sources.json", { sources: [] });
  const tierOf = (id) => reg.sources.find((s) => s.id === id)?.tier ?? "?";
  const capIds = new Set((atlas.capabilities ?? []).map((c) => c.id));

  const out = [];
  for (const day of readdirSync(P("data/inbox")).filter((f) => f.endsWith(".json")).sort()) {
    const box = readJSON(`data/inbox/${day}`, {});
    /**
     * 收件箱是**两层**：`results`（每个源一条）里再套 `findings`。
     * 第一版我按 `box.facts` 读，跑出来「待审 0 条」—— 而 triage 明明有 17 条。
     * **零很像结论，实际是字段名猜错了** —— 又一次「静默出错值」。
     * 源信息（source / tier / url）在外层，抽取出来的事实在内层，两边都要带上。
     */
    for (const r of box.results ?? []) {
      for (const raw of r.findings ?? []) {
      const f = { ...raw, source: r.source, url: r.url };
      const id = idOf(f, day.replace(".json", ""));
      if (rejected.has(id) || pending.has(id) || done.has(id)) continue;
      // 能不能落到一个具体格子 —— 这决定「通过」之后走哪一路
      const m = (atlas.models ?? []).find(
        (x) =>
          (f.model_hint ?? "").toLowerCase().includes(x.family.toLowerCase()) ||
          (f.model_hint ?? "").toLowerCase().includes(x.id),
      );
      const landable = !!m && !!f.capability && capIds.has(f.capability);
      out.push({
        id, day: day.replace(".json", ""), source: f.source, tier: tierOf(f.source),
        kind: f.kind, model_hint: f.model_hint, model: m?.id ?? null,
        capability: f.capability ?? null, claim: f.claim, quote: f.quote,
        confidence: f.confidence, landable,
        missing: landable ? [] : [
          !m && "库里没有这条产品线（要先建实体：公司 / 轨 / 层级 / 架构依据）",
          m && !f.capability && "没落到具体能力上",
          m && f.capability && !capIds.has(f.capability) && `能力 id 「${f.capability}」不在本体里`,
        ].filter(Boolean),
      });
      }
    }
  }
  return out;
}

function log(row) {
  const l = readJSON("data/review-log.json", {
    $note: "人审流水，**只增不改**。git commit 是 Revision，diff 是 ChangeEvent（§59.4.c）。",
    rows: [],
  });
  l.rows.push(row);
  writeJSON("data/review-log.json", l);
}

function commit(msg, files) {
  try {
    execFileSync("node", [P("scripts/validate.mjs")], { stdio: "pipe" });
  } catch (e) {
    throw new Error(`校验没过，不提交：${String(e.stdout ?? e).slice(-400)}`);
  }
  /**
   * **先 add 再 commit。** `git commit <路径>` 对**尚未被跟踪的新文件**会直接失败
   * （pathspec did not match any file known to git）—— 而这几本账第一次写的时候
   * 正好都是新文件。端到端一测才发现：数据写了、提交没成，
   * **而「git 当数据库」正是这套的根基**，不提交等于这条决定没发生过。
   */
  execFileSync("git", ["add", ...files], { cwd: ROOT });
  execFileSync("git", ["-c", "user.name=atlas-review", "-c", "user.email=review@xiamimate.local",
    "commit", "-q", "-m", msg], { cwd: ROOT });
}

export function decide({ id, verdict, why = "", who = "unknown" }) {
  const item = queue().find((x) => x.id === id);
  if (!item) throw new Error(`队列里没有这一条：${id}`);
  const at = NOW();

  if (verdict === "reject") {
    const r = readJSON("data/review-rejected.json", {
      $note: "人审否决的 claim。**是记下来不是删掉** —— 同一条再被抓到时要能认出「看过、否了」。",
      rows: [],
    });
    r.rows.push({ id, at, who, why, claim: item.claim, source: item.source });
    writeJSON("data/review-rejected.json", r);
    log({ id, at, who, verdict: "reject", why, claim: item.claim });
    commit(`review: 否决 1 条（${who}）\n\n${item.claim}\n理由：${why || "（未填）"}`,
      ["data/review-rejected.json", "data/review-log.json"]);
    return { ok: true, kind: "reject" };
  }

  if (!item.landable) {
    // 认了这件事是真的，但缺字段建不了实体 —— 出一张采集单，不写半成品进库
    const p = readJSON("data/review-pending.json", {
      $note: "人审认可、但**信息不够落库**的条目。它是采集单，不是数据 —— 不要读进前端。",
      rows: [],
    });
    p.rows.push({ id, at, who, claim: item.claim, quote: item.quote, source: item.source, missing: item.missing });
    writeJSON("data/review-pending.json", p);
    log({ id, at, who, verdict: "pass-pending", why, claim: item.claim, missing: item.missing });
    commit(`review: 通过但待补全 1 条（${who}）\n\n${item.claim}\n还缺：${item.missing.join("；")}`,
      ["data/review-pending.json", "data/review-log.json"]);
    return { ok: true, kind: "pending", missing: item.missing };
  }

  // 能落格：写进 atlas.json。**只补 ⬜，不覆盖已有结论** —— 覆盖是另一件事，得单独讨论。
  const atlas = readJSON("data/atlas.json", {});
  const cell = atlas.support.find((s) => s.m === item.model && s.c === item.capability);
  if (!cell) throw new Error("找不到这一格（模型 × 能力）");
  /**
   * **格子已经有结论时，不能只报错了事。**
   *
   * 第一版这里直接 `return {ok:false}`：既不写库、也不落账、更不出队 ——
   * 于是这几条永远卡在待审里，「通过」按不动，而按「不通过」又是错的
   * （那些结论是**真的**，只是我们早就记着了）。负责人 2026-08-11 截图报的就是这个。
   *
   * 拆成两种，判据是**新结论和已有结论一不一致**：
   *
   *   ⊙ 一致 → **重复**。认可它为真，库里已有同样结论，落一条流水、出队、不动 atlas.json。
   *   ⚠ 不一致 → **冲突**。这是真问题：同一格两个方向相反的官方说法。
   *     进冲突台账，必须人定 —— 但也要出队，否则它会一直占着「待审」的位置，
   *     让人以为还没看过。**「看过了、结论是有冲突」和「还没看」不是一回事。**
   */
  const claimsYes = true;   // 收件箱里的 claim 都是「支持」型断言；将来有否定型再分
  if (cell.state === "yes" && claimsYes) {
    log({ id, at, who, verdict: "duplicate", why, claim: item.claim,
          cell: `${item.model}×${item.capability}`,
          note: `已有结论一致（yes）。这条的核验版本是 ${item.verified_for ?? item.day}，库里那条是 ${cell.verified_for ?? "—"}` });
    commit(`review: 重复 1 条（${who}）\n\n${item.claim}\n` +
      `${item.model} × ${item.capability} 已经是 yes，结论一致 —— **没有改动 atlas.json**。`,
      ["data/review-log.json"]);
    return { ok: true, kind: "duplicate", cell: `${item.model}×${item.capability}` };
  }
  if (cell.state !== "unknown") {
    const cf = readJSON("data/review-conflicts.json", {
      $note: "**同一格上，新证据与已有结论相反。** 这不是待审，是待裁决 —— 两边都带官方原文，得人去看哪边说的是哪一代。",
      rows: [],
    });
    cf.rows.push({ id, at, who, cell: `${item.model}×${item.capability}`,
      existing: { state: cell.state, note: cell.note ?? "", src: cell.src ?? "", verified_for: cell.verified_for ?? "" },
      incoming: { claim: item.claim, quote: item.quote, src: item.source, tier: item.tier } });
    writeJSON("data/review-conflicts.json", cf);
    log({ id, at, who, verdict: "conflict", why, claim: item.claim, cell: `${item.model}×${item.capability}` });
    commit(`review: 冲突 1 条（${who}）\n\n${item.model} × ${item.capability}\n` +
      `已有：${cell.state}\n新证据：${item.claim}\n\n**没有改动 atlas.json** —— 进冲突台账等人裁决。`,
      ["data/review-conflicts.json", "data/review-log.json"]);
    return { ok: true, kind: "conflict", cell: `${item.model}×${item.capability}`, existing: cell.state };
  }
  cell.state = "yes";
  cell.src = item.source;
  cell.note = `${item.claim}｜原文：「${item.quote}」`;
  cell.by = "human";
  cell.reviewed_by = who;
  cell.reviewed_at = at;
  writeJSON("data/atlas.json", atlas);
  log({ id, at, who, verdict: "pass", why, claim: item.claim, wrote: `${item.model}×${item.capability}` });
  commit(`review: 人审通过并写入 ${item.model} × ${item.capability}（${who}）\n\n` +
    `${item.claim}\n原文：「${item.quote}」\n来源：${item.source}（${item.tier} 级）\n\n` +
    `**只补 ⬜，没有覆盖已有结论。**`,
    ["data/atlas.json", "data/review-log.json"]);
  return { ok: true, kind: "wrote", cell: `${item.model}×${item.capability}` };
}

// ── CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
  const id = arg("--id");
  if (!id) {
    const q = queue();
    console.log(`待审 ${q.length} 条（能直接落格的 ${q.filter((x) => x.landable).length} 条）\n`);
    for (const x of q.slice(0, 30))
      console.log(`${x.landable ? "▣" : "▢"} ${x.id}\n   ${x.claim}\n   ${x.landable ? `→ ${x.model} × ${x.capability}` : `缺：${x.missing.join("；")}`}\n`);
  } else {
    const verdict = process.argv.includes("--reject") ? "reject" : "pass";
    console.log(JSON.stringify(decide({ id, verdict, why: arg("--why") ?? "", who: arg("--who") ?? "cli" }), null, 1));
  }
}

/* ══════════════════════════════════════════════════════════════════
 * 引文回查的人审（2026-08-15 加）
 *
 * 起因：负责人「我在审阅界面无法审查。到底要怎么做？」——
 * **不是操作问题**。上面那个 `queue()` 只读 `data/inbox`（抽取器的产物），
 * requote 的结果它根本不认识。我把 requote 挂进了 tick、让它进了待办，
 * **却没让它进能处理待办的地方**。
 *
 * ## 为什么不能塞进同一个队列
 *
 * 收件箱那一摞的判断是「**这条事实对不对**」，二选一（通过 / 驳回）。
 * 这一摞的判断是「**这句引文该归到哪**」，而且落点在三个不同文件上：
 *
 * | 结论 | 动作 | 改哪个文件 |
 * |---|---|---|
 * | 真署错页了 | 把格子的 `src` 改成另一个源 | `data/atlas.json` |
 * | 这一页的快照是残的 | 换这个源的抓法（URL / kind） | `data/sources.json` |
 * | 当初记的就不是逐字原文 | 认了，别再报 | `data/requote-decisions.json` |
 *
 * 硬塞进 `decide()` 会让那个函数同时对三个文件负责 —— 那是把两件事揉成一件。
 * ══════════════════════════════════════════════════════════════════ */

const RQ_DECISIONS = "data/requote-decisions.json";

/** 一条回查结果的稳定 id：源 + 位置。**不含锚**（锚会随引文微调而变，id 不能跟着变）。 */
export const rqId = (src, at) => `${src}|${at}`;

/**
 * 从 `data/requote-report.md` 读出待人审的条目。
 *
 * ⚠️ **只收「真要人判断」的三摞**：`本页没有·别处有` / `找不到` / `快照无正文`。
 * 「无快照」那一摞不进来 —— 那是源没登记，跑一次 watch 就没了，**不该占人的注意力**。
 */
export function requoteQueue() {
  const decided = new Set((readJSON(RQ_DECISIONS, { rows: [] }).rows ?? []).map((r) => r.id));
  const md = existsSync(P("data/requote-report.md")) ? readFileSync(P("data/requote-report.md"), "utf8") : "";
  const KINDS = ["本页没有·别处有", "找不到", "快照无正文"];
  const out = [];
  for (const kind of KINDS) {
    const sec = md.split(`### ${kind}（`)[1];
    if (!sec) continue;
    for (const line of sec.split("\n### ")[0].split("\n")) {
      const m = line.match(/^- `([a-z0-9-]+)` (.+?)(?: —— 锚「(.*?)」)?(?:（这句在 (.+?)）)?$/);
      if (!m) continue;
      const [, src, at, anchor, elsewhere] = m;
      const id = rqId(src, at);
      if (decided.has(id)) continue;
      out.push({ id, kind, src, at, anchor: anchor ?? null,
        elsewhere: elsewhere ? elsewhere.split("、") : [] });
    }
  }
  return out;
}

/**
 * 落一条回查判断。三种动作各自只碰自己该碰的文件。
 *
 * ⚠️ **`repoint` 会改 atlas.json 里的格子**，所以它和 `decide()` 一样要提交 git ——
 * 数据改动必须留痕，这是「git 当数据库」的前提（§59.4.c）。
 */
export function requoteDecide({ id, action, to = "", why = "", who = "unknown" }) {
  const item = requoteQueue().find((x) => x.id === id);
  if (!item) throw new Error(`回查队列里没有这一条：${id}`);
  const at = NOW();
  const files = [RQ_DECISIONS];
  const rec = { id, at, who, action, why, src: item.src, at_label: item.at, kind: item.kind };

  if (action === "repoint") {
    if (!to) throw new Error("改署名要给新的源 id");
    const a = readJSON("data/atlas.json", {});
    if (!a.sources?.[to]) throw new Error(`引用表里没有这个源：${to}`);
    const [mid, cid] = String(item.at).split(" × ");
    const cell = (a.support ?? []).find((s) => s.m === mid && s.c === cid);
    if (!cell) throw new Error(`找不到格子：${item.at}（只有「模型 × 能力」这种位置能自动改署名）`);
    rec.from = cell.src;
    cell.src = to;
    cell.note = (cell.note ?? "") + ` 🔧 **${at.slice(0, 10)} 改了署名的源**：原署 \`${rec.from}\`，实际这句话在 \`${to}\` 里。${why ? "人审备注：" + why : ""}`;
    writeJSON("data/atlas.json", a);
    files.push("data/atlas.json");
  } else if (action === "refetch") {
    if (!to) throw new Error("换抓法要给新的 URL");
    const reg = readJSON("data/sources.json", { sources: [] });
    const s = reg.sources.find((x) => x.id === item.src);
    if (!s) throw new Error(`监视清单里没有这个源：${item.src}`);
    rec.from = s.url;
    s.url = to;
    s.note = (s.note ?? "") + ` 🔧 **${at.slice(0, 10)} 换了盯的地址**（原 \`${rec.from}\`）：引文回查发现抓回来的页面里没有我们引的那句话。${why ? "人审备注：" + why : ""}`;
    writeJSON("data/sources.json", reg);
    files.push("data/sources.json");
  } else if (action !== "accept") {
    throw new Error(`未知动作：${action}`);
  }

  const d = readJSON(RQ_DECISIONS, {
    $note: "引文回查的人审流水。**accept 是「认了这条引文不是逐字原文」不是「它错了」** —— 记下来是为了别再报，不是为了掩盖。",
    rows: [],
  });
  d.rows.push(rec);
  writeJSON(RQ_DECISIONS, d);
  const LABEL = { repoint: "改署名", refetch: "换抓法", accept: "认了非逐字" };
  commit(`requote: ${LABEL[action]} 1 条（${who}）\n\n${item.src} · ${item.at}\n${rec.from ? `原 ${rec.from} → ${to}\n` : ""}理由：${why || "（未填）"}`, files);
  return { ok: true, action };
}
