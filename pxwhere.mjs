/**
 * 两张截图差在哪 —— md5 不同只说明「有差异」，不说明差异是不是我造成的。
 * 页眉里有个会走动的像素虾米君，两次截图必然不同；那和令牌化无关。
 * 所以要**定位**：差异有多少像素、集中在哪个矩形、色差有多大。
 */
import { chromium } from "playwright";
import { readFileSync, readdirSync } from "node:fs";

const [A, B] = process.argv.slice(2);
const br = await chromium.launch();
const page = await br.newPage();

for (const f of readdirSync(A).filter((x) => x.endsWith(".png"))) {
  const a = readFileSync(`${A}/${f}`).toString("base64");
  const b = readFileSync(`${B}/${f}`).toString("base64");
  const r = await page.evaluate(async ([a, b]) => {
    const load = (d) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = "data:image/png;base64," + d; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { size: [ia.width, ia.height, ib.width, ib.height] };
    const c = (im) => { const cv = document.createElement("canvas"); cv.width = im.width; cv.height = im.height;
      const x = cv.getContext("2d", { willReadFrequently: true }); x.drawImage(im, 0, 0);
      return x.getImageData(0, 0, im.width, im.height).data; };
    const [da, db] = [c(ia), c(ib)];
    let n = 0, maxd = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let i = 0; i < da.length; i += 4) {
      const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
      if (d > 6) {                       // 阈值 6：躲开 PNG/抗锯齿的 ±1 抖动
        n++; if (d > maxd) maxd = d;
        const px = (i / 4) % ia.width, py = Math.floor(i / 4 / ia.width);
        if (px < x0) x0 = px; if (px > x1) x1 = px;
        if (py < y0) y0 = py; if (py > y1) y1 = py;
      }
    }
    return { n, total: ia.width * ia.height, maxd, box: x1 < 0 ? null : [x0, y0, x1 - x0 + 1, y1 - y0 + 1], h: ia.height };
  }, [a, b]);
  if (r.size) { console.log(`${f.padEnd(16)} ✗ 尺寸都不同 ${r.size}`); continue; }
  if (!r.n) { console.log(`${f.padEnd(16)} ✓ 完全相同`); continue; }
  const pct = ((r.n / r.total) * 100).toFixed(4);
  console.log(`${f.padEnd(16)} 差 ${String(r.n).padStart(7)} 像素 (${pct}%) 最大色差 ${r.maxd}  区域 x=${r.box[0]} y=${r.box[1]} ${r.box[2]}×${r.box[3]}  页高 ${r.h}`);
}
await br.close();
