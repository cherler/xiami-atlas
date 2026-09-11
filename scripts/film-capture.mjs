/**
 * 录产品本身。**这支片子的主体是录屏，动效只做标注。**
 *
 * ## 为什么推翻上一版
 *
 * 上一版是纯图形的「文艺片」：一路在列数字，**从头到尾没说这产品是干什么的**。
 * 负责人原话：「哪怕你直接录屏都比这个文艺片好」。他是对的 ——
 * **产品本身就是内容**，真站、真点击、真弹出出处，比任何抽象蒙太奇都有说服力。
 *
 * ## 分镜头录，不是录一条长的
 *
 * 抖音那支 `short-form-video` 的硬规矩：**每 2–4 秒一个 pattern interrupt**，
 * 中段一平就被划走。一条长录像剪不出这个密度 —— 里面全是鼠标在路上走的时间。
 * 所以一个镜头一段录像，各自录完再硬切拼起来。
 *
 * 另两条也照办：
 * - **最有冲击的画面必须是第一帧**，绝不从黑场淡入 → 每段都先 `waitFor` 到位再开录。
 * - **素材必须比镜头长**：留够余量，剪的时候才有得挑。
 *
 *   node scripts/film-capture.mjs        # 需要 out/ 已构建
 *   → assets/film-shots/<id>.mp4
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdirSync, rmSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { extname, join } from "node:path";
import { execFileSync } from "node:child_process";

/**
 * ⚠️ **视口小、缩放高 —— 这是这支片子最要紧的一个数。**
 *
 * 上一版用 1920×1080、dSF 1 全屏录，成片在手机上（约 390px 宽）
 * **除了字幕卡一个字都读不出来**：模型名、能力名、日期全糊成灰点。
 * 画面里 95% 的像素是读不了的小字 —— 那才是「不够秀」的真正原因，
 * 不是动效不够花。
 *
 * 改成**视口 960×540**：同一屏只装得下一半内容，而那一半在手机上读得清。
 * 实测对比：能力名、「2024-10 起 5/10」这类元数据都认得出来。
 *
 * ⚠️ **`recordVideo` 按视口的 CSS 尺寸录，不吃 `deviceScaleFactor`。**
 * 第一次改的时候把视口设成 960×540、录像尺寸却写 1920×1080 ——
 * 结果内容缩在左上角四分之一，其余全是灰的。
 * 所以录像尺寸必须等于视口，放大交给 ffmpeg：
 * 放大会软一点，但**内容的相对尺寸翻倍了**，那才是手机上读不读得清的关键。
 */
const VW = 960, VH = 540;      // 录像尺寸 = 视口尺寸
const W = 1920, H = 1080;      // 成片尺寸，由 ffmpeg 放大得到
const OUT = "assets/film-shots";
const RAW = "assets/film-shots/raw";
const BASE = "/atlas";
const PORT = 4477;
const O = `http://127.0.0.1:${PORT}${BASE}`;

if (!existsSync("out")) { console.error("没有 out/，先 npm run build"); process.exit(1); }
rmSync(OUT, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml" };
const srv = createServer(async (req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === BASE || p === `${BASE}/`) p = "/index.html";
  else if (p.startsWith(`${BASE}/`)) p = p.slice(BASE.length);
  for (const f of [join("out", p), join("out", `${p}.html`), join("out", p, "index.html")])
    if (existsSync(f) && !f.endsWith("/")) {
      const s = await readFile(f).catch(() => null);
      if (s) { res.writeHead(200, { "content-type": MIME[extname(f)] ?? "application/octet-stream" }); return res.end(s); }
    }
  res.writeHead(404).end("x");
});
await new Promise((r) => srv.listen(PORT, "127.0.0.1", r));

/** 光标要看得见 —— Playwright 不录鼠标。沿用 capture-demo 那套。 */
const CURSOR = `
(() => {
  const dot = document.createElement('div');
  Object.assign(dot.style, { position:'fixed', width:'26px', height:'26px', borderRadius:'50%',
    background:'rgba(12,148,136,0.9)', boxShadow:'0 0 0 8px rgba(12,148,136,0.20)', zIndex:2147483647,
    pointerEvents:'none', transform:'translate(-50%,-50%)', left:'-100px', top:'-100px' });
  const put = () => document.body && document.body.appendChild(dot);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', put) : put();
  addEventListener('mousemove', e => { dot.style.left = e.clientX+'px'; dot.style.top = e.clientY+'px'; });
  addEventListener('mousedown', e => {
    const r = document.createElement('div');
    Object.assign(r.style, { position:'fixed', left:e.clientX+'px', top:e.clientY+'px', width:'12px', height:'12px',
      borderRadius:'50%', border:'3px solid rgba(12,148,136,0.95)', transform:'translate(-50%,-50%)',
      zIndex:2147483646, pointerEvents:'none' });
    document.body.appendChild(r);
    r.animate([{ width:'12px', height:'12px', opacity:1 }, { width:'120px', height:'120px', opacity:0 }],
      { duration:620, easing:'ease-out' }).onfinish = () => r.remove();
  });
})();`;

const br = await chromium.launch();

/**
 * 每段录像里**关键时刻的时间戳**，写进 `marks.json` 给切片脚本用。
 *
 * ## 为什么必须有
 *
 * 上一版切片脚本里是九个写死的秒数（`ss: 2.6 / 4.2 / 6.6 …`）。
 * **站一改版、录屏内容位移，这些偏移就指向别的画面** ——
 * 而出来的片子照样能播、照样有字幕，只是画面对不上旁白。
 * 典型的「坏了不报错」，2026-08-18 评审时点出来的。
 *
 * 现在由录屏这一侧说话：谁最清楚「表滚到位是第几秒」？是录它的人。
 */
const MARKS = {};

/** 一个镜头一段录像。`prep` 先把画面摆好**再开录** —— 第一帧就得是有冲击的那一帧。 */
async function shot(id, url, act, { pre = 900 } = {}) {
  const dir = join(RAW, id);
  mkdirSync(dir, { recursive: true });
  const ctx = await br.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2,
    recordVideo: { dir, size: { width: VW, height: VH } } });
  await ctx.addInitScript(CURSOR);
  const page = await ctx.newPage();
  page.mouseTo = async (loc) => {
    const b = await loc.boundingBox();
    if (!b) throw new Error(`${id}: 目标不可见`);
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 22 });
    await page.waitForTimeout(220);
  };
  page.clickAt = async (loc, hold = 1100) => {
    await page.mouseTo(loc);
    await page.mouse.down(); await page.waitForTimeout(70); await page.mouse.up();
    await page.waitForTimeout(hold);
  };
  await page.goto(`${O}${url}`, { waitUntil: "networkidle" });
  /**
   * **录像的时间零点是 context 建好那一刻，不是 goto 之后。**
   * 所以起点在这里取，导航与首屏等待都算进去 —— 少算这一段，
   * 后面所有标记会整体前移，比写死还糟（因为它看起来是「算出来的」）。
   */
  const t0 = Date.now();
  MARKS[id] = {};
  /** 在这一刻打一个标记：`mark("表到位")` → 记下相对录像起点的秒数。 */
  page.mark = (name) => { MARKS[id][name] = Number(((Date.now() - t0) / 1000).toFixed(2)); };
  await page.waitForTimeout(pre);
  await act(page);
  await ctx.close();
  const f = readdirSync(dir).find((x) => x.endsWith(".webm"));
  if (!f) throw new Error(`${id}: 没录到`);
  renameSync(join(dir, f), join(OUT, `${id}.webm`));
  /** 转 H.264 —— 后面要和图形层合成，webm 在 ffmpeg 里叠图麻烦。 */
  /** 放大到成片尺寸。`lanczos` 比默认的双线性锐一些，小字放大时差别看得出来。 */
  execFileSync("ffmpeg", ["-y", "-i", join(OUT, `${id}.webm`),
    "-vf", `scale=${W}:${H}:flags=lanczos`, "-c:v", "libx264",
    "-pix_fmt", "yuv420p", "-crf", "17", "-r", "30", join(OUT, `${id}.mp4`)],
    { stdio: ["ignore", "ignore", "pipe"] });
  console.log(`  ✓ ${id}.mp4`);
}

/* ① 真值表：一屏格子。**这是第一帧，必须一眼看出「这是一张核对表」。** */
await shot("table", "/video", async (p) => {
  await p.evaluate(() => document.querySelector("table")?.scrollIntoView({ block: "center" }));
  await p.waitForTimeout(2600);
  p.mark("表到位");
  /** 划过几格 —— 让人看见每一格是可以问的。 */
  const tds = p.locator("td[title]");
  const n = Math.min(await tds.count(), 5);
  p.mark("开始划格");
  for (let i = 0; i < n; i++) { await p.mouseTo(tds.nth(i * 3)); await p.waitForTimeout(520); }
  p.mark("划完");
  await p.waitForTimeout(900);
});

/* ② 出处：点开「都能在这儿查到出处」，两栏官方原文涌出来。**全片最值钱的一镜。** */
await shot("quote", "/video", async (p) => {
  const sum = p.locator("summary", { hasText: "查到出处" }).first();
  await sum.scrollIntoViewIfNeeded();
  await p.waitForTimeout(1100);
  p.mark("点开之前");
  await p.clickAt(sum, 2800);
  p.mark("原文展开");
  await p.mouse.wheel(0, 240); await p.waitForTimeout(2400);
  p.mark("原文滚过一屏");
});

/* ③ 自述与实测：两栏对照。**「说的 vs 撞到的」是这个站独有的东西。** */
await shot("claims", "/claims", async (p) => {
  await p.waitForTimeout(1800);
  p.mark("首屏");
  await p.mouse.wheel(0, 340); await p.waitForTimeout(2600);
  p.mark("第一组对照");
  await p.mouse.wheel(0, 320); await p.waitForTimeout(2600);
  p.mark("第二组对照");
});

/* ④ 专项：项目卡一张张。**证明这站不止一张表。** */
await shot("topic", "/topic/game", async (p) => {
  await p.waitForTimeout(1500);
  const tabs = p.locator('[role="tab"]');
  await p.clickAt(tabs.nth(1), 1600);
  p.mark("换到第二类");
  await p.mouse.wheel(0, 300); await p.waitForTimeout(2000);
  p.mark("项目卡");
  await p.clickAt(tabs.nth(2), 1800);
  p.mark("换到第三类");
  await p.waitForTimeout(1400);
});

await br.close(); srv.close();
rmSync(RAW, { recursive: true, force: true });
writeFileSync(join(OUT, "marks.json"), JSON.stringify(MARKS, null, 1));
console.log(`\n时间标记 → ${OUT}/marks.json`);
for (const [k, v] of Object.entries(MARKS))
  console.log(`  ${k.padEnd(8)} ${Object.entries(v).map(([n, t]) => `${n} ${t}s`).join(" · ")}`);
console.log(`\n录完 → ${OUT}/`);
for (const f of readdirSync(OUT).filter((x) => x.endsWith(".mp4"))) {
  const d = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "csv=p=0", join(OUT, f)], { encoding: "utf8" }).trim();
  console.log(`  ${f.padEnd(14)} ${Number(d).toFixed(1)} 秒`);
}
