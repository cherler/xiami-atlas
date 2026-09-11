/**
 * 把录屏剪成一支**产品片**。
 *
 * ## 这一版推翻了上一版的全部形状
 *
 * 上一版是纯图形，一路列数字，**从头到尾没说这产品是干什么的**。
 * 负责人：「哪怕你直接录屏都比这个文艺片好」「不能太文艺、要直接、要秀、要吸引注意力」。
 *
 * 所以：**主体是录屏，图形只做字幕与标注**。
 *
 * ## 遵的是 motion-skills 里那支抖音 skill 的留存语法
 *
 * `short-form-video` 的硬规矩，逐条对上：
 *
 * - **一个片子只有一个 payoff**。这里是：「AI 能不能做你要的那件事 ——
 *   这里一格一个答案，每格点得开官方原文。」第二个想法就该做成第二支片。
 * - **最有冲击的画面必须是第一帧，绝不从黑场淡入**。所以第 0 帧直接是真值表。
 * - **第 1 帧就要有字**（85% 的人静音看）。字幕全程烧在画面上。
 * - **每 2–4 秒一个 pattern interrupt**。这里靠硬切 + 字幕换行 + 高亮框。
 * - **没有死气**：不留慢起、不留渐入、不留「大家好」。
 *
 * ## 字幕为什么渲成 PNG 再叠，而不用 drawtext
 *
 * `drawtext` 要指定字体文件，中文字重与标点在不同机器上会掉；
 * 而这一层本来就是排版活 —— 用浏览器渲一次透明底 PNG，
 * 字体、字重、标点、行距全都和站上一套，还能用同一份品牌令牌。
 *
 *   node scripts/film-cut.mjs        # → assets/atlas-film.mp4
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const A = JSON.parse(readFileSync("data/atlas.json", "utf8"));
const S = A.support ?? [];
const N = {
  cells: S.length,
  yes: S.filter((x) => x.state === "yes").length,
  yesSrc: S.filter((x) => x.state === "yes" && x.src).length,
  unknown: S.filter((x) => x.state === "unknown").length,
  models: A.models.length,
  domains: A.domains.length,
  projects: A.topics.reduce((n, t) => n + (t.projects?.length ?? 0), 0),
  conflicts: A.topics.reduce((n, t) => n + (t.conflicts?.length ?? 0), 0),
};
/** 「每个能都点得开官方原文」这句话出片前当场验 —— 片子比页面难改，不能让它撒谎。 */
if (N.yesSrc !== N.yes) { console.error(`❌ ${N.yes} 格说能，只有 ${N.yesSrc} 格有出处`); process.exit(1); }

const SHOT = "assets/film-shots";
const TMP = "assets/film-cut";
for (const s of ["table", "quote", "claims", "topic"])
  if (!existsSync(`${SHOT}/${s}.mp4`)) { console.error(`缺 ${s}.mp4，先跑 film-capture`); process.exit(1); }
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

/**
 * 分镜。`src` = 用哪段录屏、从第几秒起、切多长；`cap` = 这一段烧什么字。
 *
 * **时长是按「读得完」定的**，不是按素材长度：一行 12~16 个中文字，
 * 静音看的人需要约 1.6~2.2 秒。低于这个数就是白烧。
 */
/**
 * **镜长优先跟着旁白走**（promo-hf 那条线的硬经验：时间轴由配音决定，不能反过来）。
 * 没有旁白时才用这里写的 `dur` —— 它是「读得完」的下限：
 * 一行 12~16 个中文字，静音看的人需要 1.6~2.2 秒。
 */
const VOLENS = existsSync("assets/film-audio/vo-lens.json")
  ? JSON.parse(readFileSync("assets/film-audio/vo-lens.json", "utf8")) : null;
/** 镜与镜之间留的呼吸。**不是 0** —— 一句压着一句听起来像机器念稿。 */
const GAP = 0.28;

/**
 * **镜头起点由录屏那一侧的标记决定，不写死秒数。**
 *
 * 上一版这里是九个写死的 `ss: 2.6 / 4.2 / 6.6 …`。
 * 站一改版、录屏内容位移，这些偏移就指向别的画面 ——
 * 而片子照样能播、照样有字幕，只是画面对不上旁白。
 * 典型的「坏了不报错」，2026-08-18 评审时点出来的。
 *
 * 现在 `at` 引 `marks.json` 里的名字（谁最清楚「表滚到位是第几秒」？录它的人）。
 * `+n` 是在那个标记之后再等 n 秒 —— 让动作落定再开切。
 */
const MARKS = JSON.parse(readFileSync(`${SHOT}/marks.json`, "utf8"));
const at = (src, name, plus = 0) => {
  const t = MARKS[src]?.[name];
  if (t == null) {
    console.error(`❌ ${src} 里没有标记「${name}」—— 录屏那边改了名字或删了这一步，` +
      `先去 film-capture.mjs 对一下。**不猜一个秒数顶上**，那正是这次要修掉的毛病。`);
    process.exit(1);
  }
  return Number((t + plus).toFixed(2));
};

const CUTS = [
  { src: "table",  ss: at("table", "表到位", 0.2),   dur: 1.6, cap: { k: "hook", t: "别再问「哪个 AI 最强」" } },
  { src: "table",  ss: at("table", "开始划格", 0.3), dur: 2.2, cap: { k: "line", t: "要问的是：**它能不能做我要做的这件事**" } },
  { src: "table",  ss: at("table", "划完", -1.2),    dur: 2.2, cap: { k: "line", t: `虾米看AI · ${N.cells} 格，一格一个答案` } },
  { src: "quote",  ss: at("quote", "原文展开", 0.3), dur: 2.6, cap: { k: "line", t: "每一格，点得开**官方原文**" } },
  { src: "quote",  ss: at("quote", "原文滚过一屏", -1.0), dur: 2.4, cap: { k: "big", t: `${N.yes} 格说「能」`, s: `${N.yesSrc} 格都带得出出处` } },
  { src: "claims", ss: at("claims", "首屏", 0.2),    dur: 2.4, cap: { k: "line", t: "而官方说了，**也未必是实情**" } },
  { src: "claims", ss: at("claims", "第一组对照", 0.2), dur: 2.6, cap: { k: "two", t: "README 说支持打断", s: "issue 说最快 3 秒" } },
  { src: "topic",  ss: at("topic", "项目卡", 0.2),   dur: 2.2, cap: { k: "line", t: `${N.projects} 个开源项目，**拆到 issue 那一层**` } },
  { src: "table",  ss: at("table", "表到位", 0.6),   dur: 2.8, cap: { k: "end", t: "不替你下判断。**把每一格的出处摆出来。**", s: "xiamimate.com/atlas" } },
];

/** 有旁白就按旁白排轴：镜长 = 旁白时长 + 呼吸，且不短于「读得完」那个下限。 */
if (VOLENS) {
  if (VOLENS.length !== CUTS.length) {
    console.error(`❌ 旁白 ${VOLENS.length} 句、镜头 ${CUTS.length} 个 —— 对不上就会串轨，先改稿`);
    process.exit(1);
  }
  CUTS.forEach((c, i) => { c.dur = Math.max(c.dur, VOLENS[i] + GAP); });
  console.log(`按旁白排轴：${CUTS.reduce((a, c) => a + c.dur, 0).toFixed(1)} 秒`);
}

/* ── 字幕层：一段一张透明 PNG ─────────────────────────────────────── */
const CAP_HTML = (c) => `<!doctype html><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1920px;height:1080px;background:transparent;overflow:hidden;
  font-family:"PingFang SC","Hiragino Sans GB",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
/* 底部安全区：抖音那支 skill 的要求 —— 关键内容留在安全边距内。 */
.box{position:absolute;left:96px;right:96px;bottom:104px}
/* 半透明深底 + 品牌色左边条：静音看的人要一眼分得清「这是字幕不是页面内容」。 */
.card{background:rgba(8,13,18,.90);border-left:8px solid #0c9488;border-radius:10px;
  padding:30px 40px;box-shadow:0 24px 70px rgba(0,0,0,.5);display:inline-block;max-width:1640px}
.t{font-size:56px;line-height:1.28;font-weight:600;color:#fff;letter-spacing:-.005em}
.t b{color:#4fd6c4}
.s{font-size:38px;line-height:1.4;color:#c3ccd6;margin-top:14px}
.s b{color:#4fd6c4}
/* hook：第一帧就要抓住，所以它更大、居中偏上，不走底部字幕位。 */
.hook{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.hook .card{padding:44px 64px;border-left-width:10px}
.hook .t{font-size:88px;font-weight:700}
.big .t{font-size:104px;font-weight:700;letter-spacing:-.02em}
.big .s{font-size:44px;color:#4fd6c4;font-weight:600}
.two{display:flex;gap:0;align-items:stretch}
.two .half{padding:26px 40px;flex:1}
.two .l{background:rgba(8,13,18,.90);border-left:8px solid #5a697a;border-radius:10px 0 0 10px}
.two .r{background:rgba(30,12,10,.92);border-left:8px solid #c0392b;border-radius:0 10px 10px 0}
.two h5{font-size:24px;letter-spacing:.16em;margin-bottom:12px;font-weight:700}
.two .l h5{color:#8b98a6}.two .r h5{color:#e2695c}
.two p{font-size:42px;line-height:1.3;font-weight:600;color:#fff}
.end .card{border-left-color:#0c9488}
.end .s{font-size:52px;color:#4fd6c4;font-weight:700;letter-spacing:.01em;margin-top:20px}
</style><body>${
  c.k === "hook"
    ? `<div class="hook"><div class="card"><div class="t">${mark(c.t)}</div></div></div>`
  : c.k === "two"
    ? `<div class="box"><div class="two"><div class="half l"><h5>它自己说</h5><p>${c.t}</p></div>
       <div class="half r"><h5>实际撞到的</h5><p>${c.s}</p></div></div></div>`
  : `<div class="box ${c.k === "big" ? "big" : c.k === "end" ? "end" : ""}"><div class="card">
       <div class="t">${mark(c.t)}</div>${c.s ? `<div class="s">${mark(c.s)}</div>` : ""}</div></div>`
}</body>`;
function mark(s) { return s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"); }

const br = await chromium.launch();
const page = await br.newPage({ viewport: { width: 1920, height: 1080 } });
for (let i = 0; i < CUTS.length; i++) {
  await page.setContent(CAP_HTML(CUTS[i].cap), { waitUntil: "load" });
  await page.screenshot({ path: `${TMP}/cap${i}.png`, omitBackground: true });
}
await br.close();
console.log(`字幕层 ${CUTS.length} 张`);

/* ── 每段：切片 + 叠字幕 ──────────────────────────────────────────── */
for (let i = 0; i < CUTS.length; i++) {
  const c = CUTS[i];
  /**
   * `-stream_loop -1`：**素材必须比镜头长**，短了镜头尾巴会卡死在最后一帧。
   * 旁白排轴之后镜长会变，写死的 ss/dur 很容易撞上这个 —— 循环兜底最省事。
   */
  execFileSync("ffmpeg", ["-y", "-stream_loop", "-1", "-ss", String(c.ss), "-t", String(c.dur),
    "-i", `${SHOT}/${c.src}.mp4`,
    "-i", `${TMP}/cap${i}.png`,
    /* 字幕最后 6 帧淡出一点点 —— 硬切之间完全不给缓冲会显得跳。 */
    "-filter_complex", "[0:v]scale=1920:1080,fps=30[v];[v][1:v]overlay=0:0[o]",
    "-map", "[o]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18",
    `${TMP}/seg${String(i).padStart(2, "0")}.mp4`], { stdio: ["ignore", "ignore", "pipe"] });
  process.stdout.write(`\r  合成 ${i + 1}/${CUTS.length} 段`);
}
console.log("");

writeFileSync(`${TMP}/list.txt`,
  CUTS.map((_, i) => `file 'seg${String(i).padStart(2, "0")}.mp4'`).join("\n") + "\n");
execFileSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", `${TMP}/list.txt`,
  "-c", "copy", "assets/atlas-film.mp4"], { stdio: ["ignore", "ignore", "pipe"] });

const dur = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
  "-of", "csv=p=0", "assets/atlas-film.mp4"], { encoding: "utf8" }).trim();
console.log(`✅ assets/atlas-film.mp4 · ${Number(dur).toFixed(1)} 秒 · ${CUTS.length} 个镜头 ` +
  `（平均 ${(Number(dur) / CUTS.length).toFixed(1)} 秒一切，抖音那支要求 2–4 秒一个 interrupt）`);
