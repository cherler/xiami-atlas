/**
 * 深色长尾扫描：把每一页每一个可见元素的**实际渲染颜色**量出来，
 * 找两类漏网的：
 *
 *   ① 亮岛 —— 页面已经转暗，但某块底色还是亮的（没令牌化的 #fff / #f6f8fb）
 *   ② 低对比 —— 文字压在它自己那层底上不足 3:1（多半是颜色只翻了一半）
 *
 * **为什么必须用机器扫**：32 个页面 × 若干弹窗态，靠翻页看一定漏，
 * 而且「差一点点看不清」正是眼睛最容易放过、用户最难受的那一档。
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:3000";
const PAGES = (process.argv[3] ?? "/,/about,/crossborder,/feedback,/privacy,/terms,/extension,/account,/shared").split(",");

const br = await chromium.launch({ args: ["--proxy-server=direct://", "--proxy-bypass-list=*"] });
const ctx = await br.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
const page = await ctx.newPage();

const SCAN = () => {
  const lum = (r, g, b) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const parse = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const ratio = (a, b) => { const [l1, l2] = [a, b].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05); };
  const bgOf = (el) => {
    let n = el;
    while (n) {
      const c = getComputedStyle(n).backgroundColor;
      const p = parse(c);
      if (p.length >= 3 && (p[3] === undefined || p[3] > 0.5)) return { rgb: p, el: n };
      n = n.parentElement;
    }
    return { rgb: [255, 255, 255], el: document.body };
  };
  const sel = (el) => {
    const c = (el.className || "").toString().trim().split(/\s+/).filter(Boolean).slice(0, 2).join(".");
    return el.tagName.toLowerCase() + (c ? "." + c : "");
  };
  const islands = new Map(), lows = new Map();
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) continue;

    // ①b 渐变里的亮色 —— **这是最狠的一个盲点**（2026-08-16 栽的）。
    // 主站首页有一条 `linear-gradient(180deg,#fff,#fff 72%,#fff)`：
    // 一张从白到白的渐变，等于一块纯白幕布盖在深色 body 上。
    // 而 backgroundColor 报的是 transparent —— **扫描器当时报了「全站干净」，
    // 而整个首页是白的**。只查底色不查底图，等于漏掉了半个 CSS。
    if (cs.backgroundImage && cs.backgroundImage !== "none" && r.width * r.height > 20000) {
      for (const m of cs.backgroundImage.matchAll(/rgba?\(([^)]+)\)/g)) {
        const p = m[1].split(",").map(Number);
        if (p.length >= 3 && (p[3] === undefined || p[3] > 0.5) && lum(p[0], p[1], p[2]) > 0.55) {
          const k = `${sel(el)}  渐变里的亮色 rgb(${p.slice(0, 3)})`;
          islands.set(k, (islands.get(k) ?? 0) + 1);
          break;
        }
      }
    }
    // ① 亮岛：这个元素自己画了一块亮底
    const own = parse(cs.backgroundColor);
    if (own.length >= 3 && (own[3] === undefined || own[3] > 0.5)) {
      const L = lum(own[0], own[1], own[2]);
      if (L > 0.55 && r.width * r.height > 2500) {
        const k = `${sel(el)}  rgb(${own.slice(0, 3)})`;
        islands.set(k, (islands.get(k) ?? 0) + 1);
      }
    }
    // ② 低对比：只看直接含文字的元素
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    const fg = parse(cs.color);
    if (fg.length < 3) continue;
    if (fg[3] !== undefined && fg[3] < 0.5) continue;
    const bg = bgOf(el);
    const rr = ratio(lum(fg[0], fg[1], fg[2]), lum(bg.rgb[0], bg.rgb[1], bg.rgb[2]));
    if (rr < 3) {
      const k = `${sel(el)}  字 rgb(${fg.slice(0, 3)}) 底 rgb(${bg.rgb.slice(0, 3)})  ${rr.toFixed(2)}:1`;
      lows.set(k, (lows.get(k) ?? 0) + 1);
    }
  }
  return { islands: [...islands.entries()], lows: [...lows.entries()] };
};

const allIslands = new Map(), allLows = new Map();
for (const p of PAGES) {
  const res = await page.goto(BASE + p, { waitUntil: "load", timeout: 60000 });
  if (!res?.ok()) { console.log(`${p}  ✗ HTTP ${res?.status()}`); continue; }
  await page.waitForTimeout(900);
  const { islands, lows } = await page.evaluate(SCAN);
  console.log(`${p.padEnd(14)} 亮岛 ${String(islands.length).padStart(3)} 种 · 低对比 ${String(lows.length).padStart(3)} 种`);
  for (const [k, n] of islands) allIslands.set(k, (allIslands.get(k) ?? 0) + n);
  for (const [k, n] of lows) allLows.set(k, (allLows.get(k) ?? 0) + n);
}

const show = (title, m, limit) => {
  const rows = [...m.entries()].sort((a, b) => b[1] - a[1]);
  console.log(`\n═══ ${title}（${rows.length} 种，共 ${rows.reduce((s, r) => s + r[1], 0)} 处）═══`);
  for (const [k, n] of rows.slice(0, limit)) console.log(`  ×${String(n).padStart(3)}  ${k}`);
  if (rows.length > limit) console.log(`  …还有 ${rows.length - limit} 种`);
};
show("亮岛：页面转暗了，这块底色没跟上", allIslands, 25);
show("低对比：文字压在自己那层底上不足 3:1", allLows, 25);

await br.close();
