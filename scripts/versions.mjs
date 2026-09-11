/**
 * 从已有 changelog 快照里挖**版本谱系**候选（任务 P0）。
 *
 * ## 为什么要有这支
 *
 * 原来的「能力演进图」每行是一项能力，横轴是**我们能证明的最早时间**，
 * 粗细是几家支持。读者看完只得到「动作复刻 2025-12 出现、6/9 支持」——
 * 那是一次数据库查询的可视化，不是知识。而且它得靠图注免责
 * （「不是业界首次出现」）：**一张需要图注免责的图，说明它量错了东西。**
 *
 * 演进的主体是**模型**：Kling 从 1.0 到 3.0 每一代加了什么、谁停了、
 * 同一项能力谁先谁后。这些画的是厂商自己发布的版本和日期，**不需要免责**。
 *
 * ## 这支只产候选，不写 atlas.json
 *
 * 版本号是最容易被正则挖错的东西（「Seedance 2.0」出现在 Runway 的日志里，
 * 讲的是 Runway 上架了别家模型，不是 Runway 自己的版本）。
 * 所以这里只做三件纯程序的事（§33）：切条目、抓日期、抓版本号，
 * 然后**逐条打上「是不是这家自己的模型」的判断依据**，交给人过一遍。
 *
 *   node scripts/versions.mjs            # 打候选
 *   node scripts/versions.mjs --json     # 写 data/version-candidates.json
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const atlas = JSON.parse(readFileSync(join(ROOT, "data/atlas.json"), "utf8"));

/**
 * 每家的 changelog 快照，以及**这家自己的产品线叫什么**。
 * 后者是关键：Runway 的日志里满是别家模型（Seedance / Gemini / Nano Banana），
 * 那些是「Runway 上架了谁」，不是「Runway 出了什么版本」——
 * **两件事混在一张演进图里，图就废了。**
 */
/**
 * `resells` 是关键区分，不是可有可无的标记。
 *
 * **厂商自己的文档站上，默认每一条都是它自己的** —— 可灵的更新日志里
 * 写「V2.6 model launched」不写「Kling」，那也是可灵的。
 * 第一版我对所有源都要求正文里出现自家名字，结果把可灵 23 条真更新判成了「别家」。
 *
 * 只有**同时也在转售别家模型的平台**（Runway）才需要反过来过滤：
 * 它的日志里满是 Seedance / Gemini / Nano Banana，那些是「Runway 上架了谁」，
 * 不是「Runway 出了什么版本」——**两件事混进同一张演进图，图就废了。**
 */
const OTHERS = /\b(seedance|seedream|gemini|nano banana|veo|kling|hailuo|minimax|wan|vidu|sora|ltx|luma|flux|seed audio|seed3d|seed-\d)\b/i;
/**
 * 每条 = 一份 changelog 快照 → 一条产品线。`d` 是方向。
 *
 * ⚠️ 原来这张表只有 7 条视频的。图像方向立起来之后这支脚本对它全空 ——
 * **跑出来「没有新版本」不是结论，是没看**。2026-08-11 补上图像那批。
 * 快照还没抓到的会被下面的 existsSync 跳过，日志里如实说一句。
 */
const SRC = [
  // ── AI 视频
  { snap: "runway-changelog", m: "runway", d: "video", resells: true, own: /\b(Gen-\d|Aleph|Act-One|Frames|Runway)\b/i, src: "rw-changelog" },
  { snap: "kling-api-updates", m: "kling", d: "video", resells: false, src: "kling-api-updates" },
  { snap: "vidu-changelog", m: "vidu-q", d: "video", resells: false, src: "vidu-changelog" },
  { snap: "minimax-blog", m: "hailuo", d: "video", resells: false, src: "minimax-blog" },
  { snap: "seed-blog", m: "seedance", d: "video", resells: true, own: /\b(seedance)\b/i, src: "seed-blog" },
  { snap: "wan-gh-releases", m: "wan", d: "video", resells: false, src: "wan-gh-releases" },
  { snap: "ltx-gh", m: "ltx", d: "video", resells: false, src: "ltx-gh" },
  // ── AI 图像
  { snap: "seed-blog", m: "seedream", d: "image", resells: true, own: /\b(seedream)\b/i, src: "seed-blog" },
  // ⚠️ `resells + own` 一定要写。第一版我漏了，结果从
  //    「Recraft V4 Pro vs **GPT Image 1.5**」里抽出 v1.5 当成了 Recraft 的版本 ——
  //    正是本文件开头警告的那种张冠李戴。
  { snap: "recraft-blog", m: "recraft", d: "image", resells: true, own: /\brecraft\b/i, src: "recraft-blog" },
  { snap: "mj-updates", m: "midjourney", d: "image", resells: false, src: "mj-updates" },
  // Krea 的博客里大半在讲它转售的别家模型（Seedance / Seedream / FLUX），
  // 不写 own 的话那些版本号会全记到 Krea 头上。
  { snap: "krea-blog", m: "krea-img", d: "image", resells: true, own: /\bkrea\b/i, src: "krea-blog" },
  { snap: "google-nb-blog", m: "gemini-image", d: "image", resells: false, src: "google-nb-blog" },
  { snap: "kolors-gh", m: "kolors", d: "image", resells: false, src: "kolors-gh" },
];

/** 英文月 + 中文日期两种写法都要认 —— 各家格式不统一，认一种就漏一半。 */
const MON = "Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec";
// 三种写法都得认：Jul 2, 2026 ／ 2026-07-02 ／ 07/02/2026。
// 只认一种就漏一半 —— Kling 那份 31k 字符里有 170 条 MM/DD/YYYY，
// 第一版正则只捞到 2 条，差点就得出「可灵没有可用的更新日志」这种错结论。
const DATE = new RegExp(
  `((?:${MON})[a-z]* \\d{1,2},? 20\\d\\d)|(20\\d\\d[-/年]\\d{1,2}(?:[-/月]\\d{1,2})?)|(\\d{1,2}/\\d{1,2}/20\\d\\d)`,
  "gi",
);
const VER = /\b(?:Gen-|v|V)?(\d+\.\d+(?:\.\d+)?)\b|\b(Q\d|S\d)\b/;

const norm = (s) => {
  const m = s.match(new RegExp(`(${MON})[a-z]* (\\d{1,2}),? (20\\d\\d)`, "i"));
  if (m) {
    const i = "jan feb mar apr may jun jul aug sep oct nov dec".split(" ").indexOf(m[1].toLowerCase().slice(0, 3)) + 1;
    return `${m[3]}-${String(i).padStart(2, "0")}-${String(m[2]).padStart(2, "0")}`;
  }
  const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(20\d\d)$/); // 美式 MM/DD/YYYY
  if (us) return `${us[3]}-${String(us[1]).padStart(2, "0")}-${String(us[2]).padStart(2, "0")}`;
  const c = s.match(/(20\d\d)[-/年](\d{1,2})(?:[-/月](\d{1,2}))?/);
  return c ? `${c[1]}-${String(c[2]).padStart(2, "0")}${c[3] ? `-${String(c[3]).padStart(2, "0")}` : ""}` : s;
};

const out = [];
for (const s of SRC) {
  const f = join(ROOT, `data/snapshots/${s.snap}.json`);
  if (!existsSync(f)) { console.log(`\n══ ${s.snap} —— 没有快照`); continue; }
  const text = JSON.parse(readFileSync(f, "utf8")).text ?? "";
  if (!text.trim()) { console.log(`\n══ ${s.snap} —— 快照是空的`); continue; }

  // 按日期切条目：日期在前，正文跟在后面，直到下一个日期
  const marks = [...text.matchAll(DATE)];
  const items = marks.map((mk, i) => ({
    date: norm(mk[0]),
    body: text.slice(mk.index + mk[0].length, i + 1 < marks.length ? marks[i + 1].index : mk.index + 400).trim(),
  }));

  const rows = items
    .map((it) => {
      const v = it.body.match(VER);
      return {
        m: s.m, src: s.src, date: it.date,
        version: v ? (v[1] ?? v[2]) : null,
        // **是不是这家自己的东西** —— 这一栏决定它进不进演进图。
        // 非转售源默认为真；转售源必须点到自家名字，且不能是在讲别家。
        own: s.resells ? s.own.test(it.body) && !OTHERS.test(it.body.replace(s.own, "")) : true,
        quote: it.body.replace(/\s+/g, " ").slice(0, 150),
      };
    })
    .filter((r) => r.version && r.date.length >= 7);

  console.log(`\n══ ${s.snap} → ${s.m}（${items.length} 条带日期，${rows.length} 条带版本号）`);
  for (const r of rows.slice(0, 10))
    console.log(`  ${r.own ? "★自家" : " 别家"} ${r.date}  v${String(r.version).padEnd(7)} ${r.quote.slice(0, 88)}`);
  const own = rows.filter((r) => r.own).length;
  console.log(`  —— 自家 ${own} 条 / 别家 ${rows.length - own} 条`);
  out.push(...rows);
}

if (process.argv.includes("--json")) {
  writeFileSync(join(ROOT, "data/version-candidates.json"),
    JSON.stringify({ generated: atlas.generated_at, note: "候选，未经人工核。★own=这家自己的产品线", rows: out }, null, 2) + "\n");
  console.log(`\n候选 ${out.length} 条 → data/version-candidates.json（**没有写 atlas.json**）`);
}
