/**
 * **引文回查器：署的那个来源，今天还找得到这句话吗？**
 *
 * 2026-08-15 起因：自动监视那天一次性建了 31 个「首次」快照 ——
 * 全是**早就被格子引用、却从没进过监视快照**的源（heygen-* 六个、
 * hf-hallo2、pixverse-* …）。也就是说在那天之前，
 * **那些页变了也没人会发现**，「这个站会自己发现自己错了」在它们身上是假的。
 *
 * 快照一落地就该做一次真正的核对，于是有了这个脚本。它只回答一个问题：
 * **一格引文里的原句，在它署名的那份快照里还在不在。**
 *
 * ## 三种结果，含义完全不同
 *
 * - `对得上` —— 引文与今天抓到的内容一致。
 * - `本页没有·别处有` —— 这句话在**别的快照**里找得到。⚠️ **不要直接判成「署错源」。**
 *   2026-08-15 验第一条（`ideogram-v3-reframe`）就发现标签把责任判错了：
 *   那份快照只有 5k，正文开头全是侧边导航（「API Overview / API Setup / Webhooks…」），
 *   **根本没抓到端点正文** —— 那句话确实在那一页上，是我们抓得不全。
 *   所以这一摞有两种成因，**要人来分**：
 *   （a）真的署错了页；（b）**这一页的快照是残的**，别处那份只是碰巧完整。
 *   Ideogram 的文档站每页都有 `.md` 版（快照正文自己写着「Append .md for the
 *   markdown version of any page」）—— 属于（b）的，改抓 `.md` 比改 src 更对。
 * - `找不到` —— 全站快照都没有。可能是页面改了、也可能当初记的就不是逐字原文。
 *   **这两种要人来分**，脚本不猜。
 *
 * ## 为什么用「最长英文串」当锚
 *
 * 引文里混着我们自己写的中文说明与 `**` 标记，整句比对必然全红。
 * 取其中最长的一段英文（≥15 字符）作锚 —— 那基本只能来自厂商原文。
 * ⚠️ **锚提取会误伤**：`--pose_weight --face_weight` 这种带前缀的会被切坏，
 * 所以脚本对每条都打印锚，让人一眼看出是不是锚的问题（2026-08-15 就误报过一次）。
 *
 *   node scripts/requote.mjs           # 全站
 *   node scripts/requote.mjs --src heygen-docs
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = `${dirname(fileURLToPath(import.meta.url))}/..`;
const a = JSON.parse(readFileSync(`${ROOT}/data/atlas.json`, "utf8"));
const only = process.argv.includes("--src") ? process.argv[process.argv.indexOf("--src") + 1] : null;

const cache = new Map();
const hasText = new Map();
const truncated = new Map();
const textOf = (id) => {
  if (cache.has(id)) return cache.get(id);
  const f = `${ROOT}/data/snapshots/${id}.json`;
  let t = null;
  if (existsSync(f)) {
    const j = JSON.parse(readFileSync(f, "utf8"));
    hasText.set(id, (j.text ?? "").length > 200);
    // **被截断的快照上，「找不到」是判不了，不是不成立。** 见 watch.mjs 里 CAP 那段注释。
    truncated.set(id, !!j.truncated);
    t = ((j.text ?? "") + " " + JSON.stringify(j.items ?? [])).replace(/\s+/g, " ");
  }
  cache.set(id, t);
  return t;
};
const ALL = readdirSync(`${ROOT}/data/snapshots`).filter((f) => f.endsWith(".json")).map((f) => f.slice(0, -5));

/**
 * 取引文里最长的一段英文当锚 —— 中文说明与 `**` 标记不参与比对。
 *
 * ⚠️ **第一版把数字跑成了 184「找不到」，其中绝大多数是假的。** 两个来源：
 *
 * 1. **我们自己写的参数罗列**（`extend / continuation / prolong`、
 *    `text_prompt / json_prompt / resolution`）—— 那是我们的速记，
 *    本来就不是厂商原句，拿它去页面里找当然找不到。**排除掉带 ` / ` 的串。**
 * 2. **快照根本没有正文**（`zimage-gh` 这类是 GitHub release 接口，
 *    只有 `items` 没有 `text`）—— 引文来自 README，而监视的是发布接口。
 *    那不是「引文错了」，是**源登记得不对**，要单独一摞。
 *
 * 一个会吓人的假数字，比没有数字更糟 —— 它会让人连真的那几条也不看。
 */
const anchor = (s) => {
  const m = (s.replace(/[`*]/g, "").match(/[A-Za-z][A-Za-z0-9 ,._:'’-]{14,}/g) ?? [])
    .map((x) => x.trim())
    .filter((x) => x.split(" ").length >= 4 && !/\s\/\s/.test(x));
  return m.sort((x, y) => y.length - x.length)[0] ?? null;
};

const rows = [];
const push = (src, quote, at) => {
  if (!src || (only && src !== only)) return;
  const t = textOf(src);
  if (t === null) return rows.push({ at, src, kind: "无快照", anchor: null });
  const k = anchor(quote ?? "");
  if (!k) return rows.push({ at, src, kind: "无英文锚", anchor: null });
  // **先查再归类。** 上一版把「快照无正文」的提前返回放在了检查前面，
  // 结果 `hf-lineage` 这类**正常引用 items 数据**的谱系条目（「官方 HF 仓库 X
  // （createdAt …）」）全被误归成问题 —— 一次跑出 339 条假货。
  // 同一天里第三次栽在「量错了却不自知」上。
  if (t.includes(k)) return rows.push({ at, src, kind: "对得上", anchor: k });
  // 找不到，且这个源的快照压根没有正文（GitHub release 接口那类）：
  // **是源登记得不对，不是引文错** —— 单独一摞。
  if (!hasText.get(src)) return rows.push({ at, src, kind: "快照无正文", anchor: k });
  /**
   * **快照被截断时不许判「找不到」。**
   *
   * 2026-09-10 查出来的：正文上限原来是 8 万字，全站 10 份快照正好卡在这个数上。
   * 这份报告里排第一的热源 `openai-image-docs`（9 条）就是这么来的 ——
   * 上限抬到 20 万字重抓之后，那一页 9.6 万字，那些「找不到」的句子好好地在页上。
   * 一个把「没抓到」说成「不成立」的检查，会让人去改本来是对的引文。
   */
  if (truncated.get(src)) return rows.push({ at, src, kind: "快照被截断·判不了", anchor: k });
  const elsewhere = ALL.filter((id) => id !== src && (textOf(id) ?? "").includes(k));
  rows.push({ at, src, kind: elsewhere.length ? "本页没有·别处有" : "找不到", anchor: k, elsewhere });
};

for (const s of a.support) push(s.src, `${s.quote ?? ""} ${s.note ?? ""}`, `${s.m} × ${s.c}`);
for (const m of a.models) push(m.version_src, m.version_quote ?? "", `模型 ${m.id} 版本`);
for (const v of a.versions) push(v.src, `${v.quote ?? ""} ${v.note ?? ""}`, `发布 ${v.id}`);

const by = {};
for (const r of rows) (by[r.kind] ??= []).push(r);
const head = `回查 ${rows.length} 条：` + Object.entries(by).map(([k, v]) => `${k} ${v.length}`).join(" · ");
console.log(head);

/**
 * **报告要写文件，但待办只收「能动手的那几条」。**
 *
 * 全站有 57 个源存在回查失败。**直接把 57 丢进待办是错的**：§59.3 那条
 * 「人每周看的 ≤20」是个负反馈闸门，超了会自动放宽采集规则 ——
 * 让一份报告的口径去松动采集纪律，是拿尾巴摇狗。
 *
 * 所以按**失败 ≥3 条的源**收口。挑这个阈值不是因为好看：
 * 单条失败多半是那一格的引文写得不够逐字（人写的，难免），
 * **同一个源上连挂三条，说明问题在源不在格** —— 十有八九是抓法不对
 * （抓回来的是侧边导航不是正文），改一次 URL 或选择器能一次性解决一片。
 */
const bad = {};
// **「快照无正文」不进 hot。** 它按上面的定义就是「源登记得不对，不是引文错」——
// 那些源（hf-text-org / hf-lineage 这类 `kind:json` 的目录 API）压根没有正文可比，
// 引文的锚是模型卡的散文，本就不该在目录里找到。把它算进「≥3=抓法不对」是把一类
// 结构性错配当成能一次改 URL 修好的东西，只会让人工待办里堆一摞永远动不了的。
// 它仍在下面「## 全部」里照列，只是不再上浮成待办。
for (const r of rows) if (["本页没有·别处有", "找不到"].includes(r.kind)) (bad[r.src] ??= []).push(r);
const hot = Object.entries(bad).filter(([, v]) => v.length >= 3).sort((x, y) => y[1].length - x[1].length);

if (process.argv.includes("--report")) {
  const md = [`# 引文回查 · ${new Date().toISOString().slice(0, 10)}`, "",
    head, "",
    "> 这份报告回答一件事：**一格引文里的原句，在它署名的那份快照里还在不在。**",
    "> ⚠️ **失败不等于引文错。** 三种成因要分开：真署错了页 / 这一页的快照是残的（抓回来的是导航不是正文）/ 当初记的就不是逐字原文。**脚本不猜。**", "",
    `## 失败 ≥3 条的源（${hot.length} 个）—— 这几个大概率是抓法不对`, "",
    ...hot.map(([src, v]) => `- **${src}**（${v.length} 条）：${v.slice(0, 3).map((r) => r.at).join("、")}${v.length > 3 ? " …" : ""}`),
    "", "## 全部", "",
    ...["本页没有·别处有", "找不到", "快照被截断·判不了", "快照无正文", "无快照"].flatMap((k) =>
      (by[k] ?? []).length ? [`### ${k}（${(by[k] ?? []).length}）`, "",
        ...(by[k] ?? []).map((r) => `- \`${r.src}\` ${r.at}${r.anchor ? ` —— 锚「${r.anchor.slice(0, 70)}」` : ""}${r.elsewhere?.length ? `（这句在 ${r.elsewhere.slice(0, 2).join("、")}）` : ""}`), ""] : []),
  ].join("\n");
  writeFileSync(`${ROOT}/data/requote-report.md`, md);
  console.log(`\n报告写在 data/requote-report.md · 失败 ≥3 条的源 ${hot.length} 个`);
}
for (const kind of ["本页没有·别处有", "找不到", "快照被截断·判不了", "快照无正文", "无快照"]) {
  const list = by[kind] ?? [];
  if (!list.length) continue;
  console.log(`\n## ${kind}（${list.length}）`);
  for (const r of list.slice(0, 40)) {
    console.log(`  [${r.src}] ${r.at}`);
    if (r.anchor) console.log(`     锚：「${r.anchor.slice(0, 88)}」`);
    if (r.elsewhere?.length) console.log(`     这句话其实在：${r.elsewhere.slice(0, 3).join(", ")}`);
  }
  if (list.length > 40) console.log(`  …还有 ${list.length - 40} 条`);
}
