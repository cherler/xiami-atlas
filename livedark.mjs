/** 线上深色扫描（走手动黑夜，和用户当前状态一致）。⚠️ --proxy-server=direct，见 livetheme.mjs。 */
import { chromium } from "playwright";
const PAGES = process.argv.slice(2).length ? process.argv.slice(2)
  : ["/", "/crossborder", "/crossborder/tools", "/crossborder/my", "/crossborder/wiki",
     "/crossborder/research", "/crossborder/report", "/account", "/feedback", "/extension", "/about"];
const br = await chromium.launch({ args: ["--proxy-server=direct://", "--proxy-bypass-list=*"] });
const ctx = await br.newContext({ colorScheme: "light", viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("https://xiamimate.com/", { waitUntil: "load", timeout: 60000 });
await page.evaluate(() => localStorage.setItem("xm-theme", "dark"));

const SCAN = () => {
  const lum=(r,g,b)=>{const f=v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4};return .2126*f(r)+.7152*f(g)+.0722*f(b)};
  const P=s=>(s.match(/[\d.]+/g)||[]).map(Number);
  const ratio=(a,b)=>{const[x,y]=[a,b].sort((m,n)=>n-m);return (x+.05)/(y+.05)};
  const bgOf=el=>{let n=el;while(n){const p=P(getComputedStyle(n).backgroundColor);if(p.length>=3&&(p[3]===undefined||p[3]>.5))return p;n=n.parentElement}return[255,255,255]};
  const sel=el=>{const c=(el.className||"").toString().trim().split(/\s+/).filter(Boolean).slice(0,2).join(".");return el.tagName.toLowerCase()+(c?"."+c:"")};
  const isl=new Map(), low=new Map(), inv=new Map();
  for(const el of document.querySelectorAll("body *")){
    const r=el.getBoundingClientRect(); if(r.width<8||r.height<8) continue;
    const cs=getComputedStyle(el);
    if(cs.visibility==="hidden"||cs.display==="none"||+cs.opacity===0) continue;
    const own=P(cs.backgroundColor);
    if(own.length>=3&&(own[3]===undefined||own[3]>.25)){
      const L=lum(own[0],own[1],own[2]);
      if(L>.5&&r.width*r.height>2000) isl.set(`${sel(el)} rgba(${own.join(",")})`,(isl.get(`${sel(el)} rgba(${own.join(",")})`)??0)+1);
    }
    const hasText=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
    if(!hasText) continue;
    const fg=P(cs.color); if(fg.length<3||(fg[3]!==undefined&&fg[3]<.5)) continue;
    const bg=bgOf(el); const rr=ratio(lum(...fg.slice(0,3)),lum(...bg.slice(0,3)));
    const k=`${sel(el)} 字rgb(${fg.slice(0,3)}) 底rgb(${bg.slice(0,3)}) ${rr.toFixed(2)}:1`;
    if(rr<1.6) inv.set(k,(inv.get(k)??0)+1); else if(rr<3) low.set(k,(low.get(k)??0)+1);
  }
  return {isl:[...isl],low:[...low],inv:[...inv]};
};
const A=new Map(),B=new Map(),C=new Map();
for(const p of PAGES){
  const res=await page.goto("https://xiamimate.com"+p,{waitUntil:"load",timeout:60000});
  if(!res?.ok()){console.log(`${p.padEnd(24)} ✗ HTTP ${res?.status()}`);continue}
  await page.waitForTimeout(1400);
  const {isl,low,inv}=await page.evaluate(SCAN);
  console.log(`${p.padEnd(24)} 亮岛 ${String(isl.length).padStart(2)} · 几乎看不见 ${String(inv.length).padStart(2)} · 偏低 ${String(low.length).padStart(2)}`);
  for(const[k,n]of isl)A.set(k,(A.get(k)??0)+n);
  for(const[k,n]of low)B.set(k,(B.get(k)??0)+n);
  for(const[k,n]of inv)C.set(k,(C.get(k)??0)+n);
}
const show=(t,m,l)=>{const r=[...m].sort((a,b)=>b[1]-a[1]);if(!r.length)return console.log(`\n═══ ${t}：无 ═══`);
  console.log(`\n═══ ${t}（${r.length} 种）═══`);r.slice(0,l).forEach(([k,n])=>console.log(`  ×${String(n).padStart(3)} ${k}`));};
show("⚠️ 几乎看不见（<1.6:1）",C,14); show("亮岛",A,12); show("对比偏低（1.6~3）",B,10);
await br.close();
