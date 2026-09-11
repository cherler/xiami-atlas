/**
 * 录 MVP 的交互演示，给宣传片当素材。
 *
 * 为什么不用 product-promo/capture/capture.ts：那支脚本按 capture-plan.json 走，
 * 且带 `session.cookieName` 的登录态假设；本站没有登录，交互目标又都在 SVG 里
 * （`getByText` 会同时命中 SVG 文本和表格里的同名文字，撞 strict mode）。
 * 与其把通用脚本改出一堆分支，不如在本仓写一支只服务本站的。
 * 光标可视化沿用它那套（Playwright 原生不录鼠标）。
 *
 *   node scripts/capture-demo.mjs        # 需要 dev server 跑在 3400
 *   → assets/demo-raw/*.webm → assets/atlas-demo.mp4（需要 ffmpeg）
 */
import { chromium } from "playwright";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const W = 1920;
const H = 1080;
const BASE = process.env.ATLAS_URL ?? "http://127.0.0.1:3400/atlas";
const RAW = new URL("../assets/demo-raw/", import.meta.url).pathname;

const CURSOR = `
(() => {
  const dot = document.createElement('div');
  Object.assign(dot.style, { position:'fixed', width:'28px', height:'28px', borderRadius:'50%',
    background:'rgba(44,107,90,0.85)', boxShadow:'0 0 0 7px rgba(44,107,90,0.22)', zIndex:2147483647,
    pointerEvents:'none', transform:'translate(-50%,-50%)', left:'-100px', top:'-100px' });
  const put = () => document.body && document.body.appendChild(dot);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', put) : put();
  addEventListener('mousemove', e => { dot.style.left = e.clientX+'px'; dot.style.top = e.clientY+'px'; });
  addEventListener('mousedown', e => {
    const r = document.createElement('div');
    Object.assign(r.style, { position:'fixed', left:e.clientX+'px', top:e.clientY+'px', width:'12px', height:'12px',
      borderRadius:'50%', border:'3px solid rgba(44,107,90,0.9)', transform:'translate(-50%,-50%)',
      zIndex:2147483646, pointerEvents:'none' });
    document.body.appendChild(r);
    r.animate([{ width:'12px', height:'12px', opacity:1 }, { width:'110px', height:'110px', opacity:0 }],
      { duration:650, easing:'ease-out' }).onfinish = () => r.remove();
  });
})();`;

rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: W, height: H },
  deviceScaleFactor: 1,
  recordVideo: { dir: RAW, size: { width: W, height: H } },
});
await ctx.addInitScript(CURSOR);
const page = await ctx.newPage();

/** 把鼠标平移过去再点 —— 瞬移的光标在成片里看着像 bug。 */
async function moveClick(loc, hold = 900) {
  const box = await loc.boundingBox();
  if (!box) throw new Error("目标不可见");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 26 });
  await page.waitForTimeout(260);
  await page.mouse.down();
  await page.waitForTimeout(70);
  await page.mouse.up();
  await page.waitForTimeout(hold);
}

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(2200); // 停一拍，让人看清默认态（淡边＝全图关系）

const svg = page.locator("svg").first();
const capText = (zh) => svg.locator("text", { hasText: zh }).first();
const modelText = (name) => svg.locator("text", { hasText: name }).first();

// 一、点一个能力 → 谁实现了它（＝「这个能力去哪用」）
await moveClick(capText("动作复刻"), 2600);

// 二、点另一个能力 → 「官方没说」的虚线是主角
await moveClick(capText("开源权重"), 2800);

// 三、退出选中，点两个模型 → Compare（挑 Kling 与 LTX：一闭源一开源，差异最大）
await moveClick(capText("开源权重"), 500);
await moveClick(modelText("Kling 3.0"), 900);
await moveClick(modelText("LTX 2.3"), 2600);

// 四、滚到证据：来源 + 官方角标 + 核验日期 + 「机器录入」
await page.mouse.wheel(0, 700);
await page.waitForTimeout(2400);
await page.mouse.wheel(0, 900);
await page.waitForTimeout(2200);

// 五、滚到透明度分布 —— 这一版最值钱的一屏。
// **滚到元素上，不要算像素**：算出来的滚动量在内容一改就失准，
// 而 #transparency 这个锚点是我在页面里留的，改版也跟着走。
await page.evaluate(() => document.querySelector("#transparency")?.scrollIntoView({ behavior: "smooth", block: "start" }));
// 停够 9 秒：这一段要配 8.5 秒旁白。**素材必须比镜头长**，
// 否则镜头尾巴会停在最后一帧上 —— 上一版就是沿用旧 startSec 撞上这个。
await page.waitForTimeout(9000);

await ctx.close();
await browser.close();

const webm = readdirSync(RAW).find((f) => f.endsWith(".webm"));
if (!webm) throw new Error("没录到");
renameSync(RAW + webm, RAW + "atlas-demo.webm");
console.log(`原始录像 assets/demo-raw/atlas-demo.webm`);

// 归一化成 H.264，Remotion 的 OffthreadVideo 吃这个
const out = new URL("../assets/atlas-demo.mp4", import.meta.url).pathname;
try {
  execFileSync(
    "ffmpeg",
    ["-y", "-i", RAW + "atlas-demo.webm", "-vf", `scale=${W}:${H},fps=30,format=yuv420p`,
     "-c:v", "libx264", "-crf", "18", "-an", out],
    { stdio: "pipe" },
  );
  console.log(`成片素材 assets/atlas-demo.mp4`);
} catch {
  console.log("没找到 ffmpeg —— webm 已留在 demo-raw/，装了 ffmpeg 再跑一次即可");
}
