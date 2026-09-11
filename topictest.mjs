/** 专项页验收：页面上的数字必须等于真值表现算的数字，不是「看着差不多」。 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
const a = JSON.parse(readFileSync("data/atlas.json", "utf8"));
const t = a.topics[0];
// 口径必须和页面一致：**核心模型**（tier core）里的成片类。
const core = a.models.filter((m) => (m.domain ?? "video") === "video" && m.class === "clip" && m.tier === "core");
const S = {}; for (const s of a.support) S[s.m + "|" + s.c] = s;
const truth = (cap) => { let y=0,n=0,u=0; for (const m of core) { const s=S[m.id+"|"+cap]?.state; s==="yes"?y++:s==="no"?n++:u++; } return {y,n,u}; };

const br = await chromium.launch({ args: ["--proxy-server=direct://", "--proxy-bypass-list=*"] });
let bad = 0;
for (const scheme of ["light", "dark"]) {
  const ctx = await br.newContext({ colorScheme: scheme, viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on("pageerror", (e) => errs.push(String(e)));
  await page.goto("http://127.0.0.1:3400/atlas/topic/video", { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(800);
  const got = await page.evaluate(() => ({
    cov: [...document.querySelectorAll('a[title*="支持"]')].map((a) => ({ title: a.getAttribute("title"), txt: a.innerText.trim() })),
    matrixRows: document.querySelectorAll("tbody tr").length,
    matrixCols: document.querySelectorAll("thead th").length - 1,
    projects: document.querySelectorAll("article").length,
    axis: [...document.querySelectorAll("h2")].some((h) => h.innerText.includes("自持程度")),
    planned: [...document.querySelectorAll("span")].filter((s) => s.innerText === "在建").length,
    bodyBg: getComputedStyle(document.body).backgroundColor,
  }));
  if (scheme === "light") {
    console.log(`骨架覆盖度条 ${got.cov.length} 条 · 矩阵 ${got.matrixRows}×${got.matrixCols} · 项目卡 ${got.projects} · 自持程度轴 ${got.axis ? "✓" : "✗"} · 在建标记 ${got.planned}`);
    const want = { i2v: 1, charref: 1, flf: 1, camera: 1, audio: 1, openweights: 1 };
    for (const cap of Object.keys(want)) {
      const w = truth(cap);
      const hit = got.cov.find((c) => c.title === `${w.y} 支持 / ${w.n} 明确不支持 / ${w.u} 没说`);
      console.log(`  ${cap.padEnd(12)} 真值表 ${w.y}/${w.n}/${w.u}  ${hit ? "✓ 页面对得上" : "✗ 页面没有这一条"}`);
      if (!hit) bad++;
    }
    if (got.matrixRows !== 9 || got.matrixCols !== 8) { console.log("  ✗ 矩阵尺寸应为 9×8"); bad++; }
    if (got.projects !== t.projects.length) { console.log("  ✗ 项目卡数不对"); bad++; }
    if (got.planned !== 2) { console.log("  ✗ 在建标记应为 2（平台篇 + 整包篇）"); bad++; }
  } else {
    console.log(`深色 body=${got.bodyBg} ${got.bodyBg === "rgb(16, 21, 26)" ? "✓" : "✗"}`);
    if (got.bodyBg !== "rgb(16, 21, 26)") bad++;
  }
  if (errs.length) { console.log("  控制台报错:", errs.slice(0, 2)); bad++; }
  await ctx.close();
}
await br.close();
console.log(bad ? `\n有 ${bad} 处不对` : "\n全部通过。");
process.exit(bad ? 1 : 0);
