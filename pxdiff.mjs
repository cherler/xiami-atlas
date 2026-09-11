/**
 * 像素级回归：令牌化这一轮**不许改变任何渲染结果**。
 *
 * 做法是把同一批页面截两次（换 CSS 前 / 换 CSS 后），比字节。
 * 同一个浏览器构建下，像素相同 → PNG 字节相同，所以 md5 相等就是「一个像素都没变」。
 *
 * 用法：node pxdiff.mjs <输出目录>
 */
import { chromium } from "playwright";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

const BASE = "http://127.0.0.1:3000";
const PAGES = ["/", "/about", "/crossborder", "/feedback", "/privacy", "/terms", "/extension", "/account"];

const br = await chromium.launch({ args: ["--proxy-server=direct://", "--proxy-bypass-list=*"] });
const ctx = await br.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
const page = await ctx.newPage();

for (const p of PAGES) {
  await page.goto(BASE + p, { waitUntil: "load", timeout: 60000 });
  // 关掉动画与光标闪烁，否则两次截图必然不同 —— 那会淹没真正的差异
  await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}"
      + ".pet,.pet-canvas,.pet-bubble,.pet-ball,.pet-recall,.pet-snore,.pet-zzz{display:none!important}" });
  await page.waitForTimeout(700);
  const buf = await page.screenshot({ fullPage: true, animations: "disabled" });
  const name = (p === "/" ? "index" : p.slice(1).replace(/\//g, "_")) + ".png";
  writeFileSync(`${OUT}/${name}`, buf);
  console.log(`${name.padEnd(16)} ${createHash("md5").update(buf).digest("hex").slice(0, 16)}  ${buf.length}B`);
}
await br.close();
