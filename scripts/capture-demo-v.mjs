/**
 * 竖屏录屏。**不是把横屏裁一刀** —— 那样两侧内容全丢。
 * 这里是在 1080×1920 的视口里真跑一遍页面，让它按窄屏自己排版。
 *
 *   node scripts/capture-demo-v.mjs   → assets/atlas-demo-v.mp4
 */
import { chromium } from "playwright";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";

const W = 1080, H = 1920;
const BASE = process.env.ATLAS_URL ?? "http://127.0.0.1:3400/atlas";
const RAW = new URL("../assets/demo-raw-v/", import.meta.url).pathname;
const CURSOR = `
(() => {
  const dot = document.createElement('div');
  Object.assign(dot.style, { position:'fixed', width:'34px', height:'34px', borderRadius:'50%',
    background:'rgba(44,107,90,0.85)', boxShadow:'0 0 0 9px rgba(44,107,90,0.22)', zIndex:2147483647,
    pointerEvents:'none', transform:'translate(-50%,-50%)', left:'-100px', top:'-100px' });
  const put = () => document.body && document.body.appendChild(dot);
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', put) : put();
  addEventListener('mousemove', e => { dot.style.left = e.clientX+'px'; dot.style.top = e.clientY+'px'; });
  addEventListener('mousedown', e => {
    const r = document.createElement('div');
    Object.assign(r.style, { position:'fixed', left:e.clientX+'px', top:e.clientY+'px', width:'14px', height:'14px',
      borderRadius:'50%', border:'4px solid rgba(44,107,90,0.9)', transform:'translate(-50%,-50%)',
      zIndex:2147483646, pointerEvents:'none' });
    document.body.appendChild(r);
    r.animate([{ width:'14px', height:'14px', opacity:1 }, { width:'130px', height:'130px', opacity:0 }],
      { duration:650, easing:'ease-out' }).onfinish = () => r.remove();
  });
})();`;

rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1,
  recordVideo: { dir: RAW, size: { width: W, height: H } } });
await ctx.addInitScript(CURSOR);
const page = await ctx.newPage();
async function moveClick(loc, hold = 900) {
  const b = await loc.boundingBox();
  if (!b) throw new Error("目标不可见");
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 24 });
  await page.waitForTimeout(240);
  await page.mouse.down(); await page.waitForTimeout(70); await page.mouse.up();
  await page.waitForTimeout(hold);
}
await page.goto(BASE, { waitUntil: "networkidle" });
// 竖屏里图在首屏下方一点，先滚到图上
await page.evaluate(() => document.querySelector("svg")?.scrollIntoView({ block: "center" }));
await page.waitForTimeout(2200);
const svg = page.locator("svg").first();
await moveClick(svg.locator("text", { hasText: "动作复刻" }).first(), 3000);
await moveClick(svg.locator("text", { hasText: "开源权重" }).first(), 3400);
await moveClick(svg.locator("text", { hasText: "开源权重" }).first(), 600);
await moveClick(svg.locator("text", { hasText: "Kling 3.0" }).first(), 800);
await moveClick(svg.locator("text", { hasText: "LTX 2.3" }).first(), 3200);
await ctx.close(); await browser.close();
const webm = readdirSync(RAW).find((f) => f.endsWith(".webm"));
renameSync(RAW + webm, RAW + "v.webm");
const out = new URL("../assets/atlas-demo-v.mp4", import.meta.url).pathname;
execFileSync("ffmpeg", ["-y", "-i", RAW + "v.webm", "-vf", `scale=${W}:${H},fps=30,format=yuv420p`,
  "-c:v", "libx264", "-crf", "18", "-an", out], { stdio: "pipe" });
console.log("竖屏录屏 assets/atlas-demo-v.mp4");
