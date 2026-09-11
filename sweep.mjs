/** 外观全面体检：静止态 + 交互态 + 移动端 × 两种外观。
 *  ⚠️ 之前只扫静止态，漏掉了下拉、弹窗这些「打开才存在」的面。 */
import { chromium } from "playwright";
const BASE = "https://xiamimate.com";
const PAGES = ["/", "/crossborder", "/crossborder/my", "/crossborder/wiki", "/crossborder/research",
  "/crossborder/report", "/account", "/feedback", "/extension", "/about", "/privacy", "/terms",
  "/atlas/", "/atlas/video", "/atlas/video/tree", "/atlas/science", "/atlas/method", "/atlas/changes"];

const SCAN = () => {
  const lum=(r,g,b)=>{const f=v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
  const P=s=>(s.match(/[\d.]+/g)||[]).map(Number);
  const rat=(a,b)=>{const[x,y]=[a,b].sort((m,n)=>n-m);return (x+.05)/(y+.05)};
  const bgOf=el=>{let n=el;while(n){const p=P(getComputedStyle(n).backgroundColor);if(p.length>=3&&(p[3]===undefined||p[3]>.5))return p;n=n.parentElement}return[255,255,255]};
  const sel=el=>{const c=(el.className||"").toString().trim().split(/\s+/).filter(Boolean).slice(0,2).join(".");return el.tagName.toLowerCase()+(c?"."+c:"")};
  const dark = lum(...bgOf(document.body).slice(0,3)) < .2;
  const bad=[];
  for(const el of document.querySelectorAll("body *")){
    const r=el.getBoundingClientRect(); if(r.width<8||r.height<8) continue;
    const cs=getComputedStyle(el);
    if(cs.visibility==="hidden"||cs.display==="none"||+cs.opacity===0) continue;
    // 底图里的亮色（渐变白幕布那一类）
    if(cs.backgroundImage!=="none"&&r.width*r.height>20000){
      for(const m of cs.backgroundImage.matchAll(/rgba?\(([^)]+)\)/g)){
        const p=m[1].split(",").map(Number);
        if(p.length>=3&&(p[3]===undefined||p[3]>.5)&&(lum(p[0],p[1],p[2])>.55)===dark){bad.push(`底图亮色 ${sel(el)} rgb(${p.slice(0,3)})`);break}}
    }
    const own=P(cs.backgroundColor);
    if(own.length>=3&&(own[3]===undefined||own[3]>.4)&&r.width*r.height>2000){
      if((lum(own[0],own[1],own[2])>.5)===dark) bad.push(`亮岛 ${sel(el)} rgb(${own.slice(0,3)})`);
    }
    const hasText=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
    if(!hasText) continue;
    const fg=P(cs.color); if(fg.length<3||(fg[3]!==undefined&&fg[3]<.5)) continue;
    const rr=rat(lum(...fg.slice(0,3)),lum(...bgOf(el).slice(0,3)));
    if(rr<2.2) bad.push(`低对比 ${sel(el)} ${rr.toFixed(2)}:1 字rgb(${fg.slice(0,3)})`);
  }
  return [...new Set(bad)];
};

const br = await chromium.launch({ args: ["--proxy-server=direct://","--proxy-bypass-list=*"] });
const all = new Map();
for (const [theme, w] of [["dark",1440],["light",1440],["dark",390]]) {
  const ctx = await br.newContext({ colorScheme: "light", viewport: { width: w, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "load", timeout: 60000 });
  await page.evaluate((t) => localStorage.setItem("xm-theme", t), theme);
  let n = 0;
  for (const p of PAGES) {
    // 网络偶尔抽一下，重试两次；失败就跳过并记一笔，不让整轮体检断在半路
    let res = null;
    for (let i = 0; i < 3 && !res?.ok(); i++) {
      res = await page.goto(BASE + p, { waitUntil: "load", timeout: 60000 }).catch(() => null);
      if (!res?.ok()) await page.waitForTimeout(1500);
    }
    if (!res?.ok()) { console.log(`  ⚠️ ${p} 取不到，跳过`); continue; }
    await page.waitForTimeout(900);
    for (const b of await page.evaluate(SCAN)) { all.set(`[${theme} ${w}] ${p} ${b}`, 1); n++; }
    // 交互态：把能点开的都点开再扫一遍
    for (const s of [".switch", ".acct-btn", "[data-nav] button", ".pm-cta a"]) {
      const el = page.locator(s).first();
      if (await el.count() && await el.isVisible().catch(()=>false)) {
        await el.click({ timeout: 2000 }).catch(()=>{});
        await page.waitForTimeout(400);
        for (const b of await page.evaluate(SCAN)) { all.set(`[${theme} ${w} 展开] ${p} ${b}`, 1); n++; }
        await page.keyboard.press("Escape").catch(()=>{});
      }
    }
  }
  console.log(`${theme} ${w}px → ${n} 处可疑`);
  await ctx.close();
}
console.log(`\n═══ 汇总 ${all.size} 条 ═══`);
[...all.keys()].slice(0, 30).forEach(k => console.log("  " + k));
if (all.size > 30) console.log(`  …还有 ${all.size - 30} 条`);
await br.close();
