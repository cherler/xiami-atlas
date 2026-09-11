/**
 * 量每张图里每个标签与它脚下底色的对比度，深浅两套外观各量一遍。
 *
 * ## 为什么要有这个脚本
 *
 * 图是用哨兵色渲染、事后替换成令牌的。哨兵能骗过「颜色」，
 * **骗不过「从颜色反推出来的颜色」** —— mermaid 会拿 `tertiaryColor` 反推
 * 一个「在它上面看得清」的 subgraph 标题色。我们给的是近黑哨兵，
 * 它就推出近白，最后落在浅色页面上是白底白字。
 *
 * 这个错渲染不报、校验不报、构建不报，肉眼扫一遍图也未必注意到 ——
 * 因为看不见的东西本来就看不见。只有量才知道。
 *
 * ## 判据
 *
 * 拿产物里真实的 CSS 令牌值算，不是拿设计稿的名义值。
 * 底色取「标签往上找到的第一个有填充的图形」，找不到就用图的容器底色。
 *
 * 用法：npm run diagrams:check   （要先有 out/ 与 public/diagrams/）
 */
import { chromium } from "playwright";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const FLOOR = 2.5;   // 低于这个数就是「基本看不见」，不是「浅了点」

const DIA = "public/diagrams";
const CSSDIR = "out/_next/static/css";
if (!existsSync(DIA)) { console.error(`没有 ${DIA}，先跑 npm run diagrams`); process.exit(1); }
if (!existsSync(CSSDIR)) { console.error(`没有 ${CSSDIR}，先跑 npm run build`); process.exit(1); }

const css = readdirSync(CSSDIR).filter((f) => f.endsWith(".css"))
  .map((f) => readFileSync(`${CSSDIR}/${f}`, "utf8")).join("\n");
const files = readdirSync(DIA).filter((f) => f.endsWith(".svg")).sort();

const lum = (r, g, b) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const parse = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
const ratio = (a, b) => {
  const [L1, L2] = [lum(...parse(a)), lum(...parse(b))].sort((x, y) => y - x);
  return (L1 + 0.05) / (L2 + 0.05);
};

const br = await chromium.launch();
let worst = { r: 99 }, fails = 0, measured = 0;

for (const theme of ["light", "dark"]) {
  const ctx = await br.newContext({ viewport: { width: 1100, height: 800 }, colorScheme: theme });
  const page = await ctx.newPage();
  for (const f of files) {
    const svg = readFileSync(`${DIA}/${f}`, "utf8");
    await page.setContent(
      `<style>${css}</style><div id="wrap" class="bg-paper text-ink" style="padding:12px">` +
      `<div id="box" class="border border-rule rounded-lg p-3">${svg}</div></div>`);
    const rows = await page.evaluate(() => {
      const out = [];
      const clear = (c) => !c || c === "none" || /rgba\(.*,\s*0\)$/.test(c);
      /**
       * 标签脚下真正的底色。
       *
       * **透明不是一种底色，是「继续往上找」。** 连线标签、时序图的消息文字
       * 本来就浮在画布上，它们所在的元素填充就是透明的 —— 把透明当成 rgb(0,0,0)
       * 去算，量出来的全是假的低对比度（这个脚本第一版就是这么错的）。
       */
      const backdrop = (el) => {
        for (let n = el; n; n = n.parentElement) {
          const shape = n.querySelector?.(":scope > rect, :scope > polygon, :scope > circle");
          if (shape && !clear(getComputedStyle(shape).fill)) return getComputedStyle(shape).fill;
          const bg = getComputedStyle(n).backgroundColor;
          if (!clear(bg)) return bg;
          if (n.id === "wrap") break;
        }
        return getComputedStyle(document.getElementById("wrap")).backgroundColor;
      };
      document.querySelectorAll("#box text, #box span.nodeLabel, #box span.edgeLabel").forEach((t) => {
        const txt = (t.textContent || "").trim();
        if (!txt || t.querySelector("text,span,div")) return;   // 只量叶子节点
        const cs = getComputedStyle(t);
        const fg = cs.color && cs.color !== "rgb(0, 0, 0)" ? cs.color : getComputedStyle(t).fill;
        out.push({ txt: txt.slice(0, 20), fg, bg: backdrop(t) });
      });
      return out;
    });
    for (const r of rows) {
      if (!r.fg || !r.bg) continue;
      measured++;
      const c = ratio(r.fg, r.bg);
      if (c < worst.r) worst = { r: c, f, theme, ...r };
      if (c < FLOOR) {
        fails++;
        console.error(`  ❌ ${theme} ${f} 「${r.txt}」对比度 ${c.toFixed(2)}　字 ${r.fg} 底 ${r.bg}`);
      }
    }
  }
  await ctx.close();
}
await br.close();

console.log(`量了 ${measured} 个标签（${files.length} 张图 × 两套外观）· 低于 ${FLOOR} 的 ${fails} 个`);
console.log(`最低对比度 ${worst.r.toFixed(2)}　${worst.theme} ${worst.f} 「${worst.txt}」`);
if (fails) process.exit(1);
