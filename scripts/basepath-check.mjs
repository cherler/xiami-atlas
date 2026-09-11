/**
 * 扫构建产物里**少了 basePath 的站内链接**。
 *
 * ## 为什么非要一条专门的检查
 *
 * 这个站挂在 `/atlas` 下。Next 的 `<Link>` 会自动补这个前缀，**原生 `<a>` 不会**。
 * 于是一个写成 `<a href="/capability/i2v">` 的链接：
 *
 * - 本地 `next dev`（没有 basePath 时）看着是对的
 * - 构建不报错、类型检查不报错、页面渲染完全正常
 * - **只有真的点下去才 404**
 *
 * 2026-08-17 负责人在项目页点了一下能力条，才发现全站有 73 处这样的死链 ——
 * 全部出自同一行代码，而它从上线那天就在那儿。
 * **看不出来的错要靠扫，不能靠看。**
 *
 * ## 判据
 *
 * 产物里任何 `href="/xxx"`，只要不是以 basePath 开头、也不是站外协议，就是错的。
 * 锚点（`#`）、协议（`http:` `mailto:` `data:`）、以及 basePath 自己都放过。
 *
 *   npm run basepath   （要先 npm run build）
 */
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = "out";
const BASE = "/atlas";
if (!existsSync(OUT)) { console.error("没有 out/，先跑 npm run build"); process.exit(1); }

const html = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith(".html")) html.push(p);
  }
})(OUT);

/** `/_next/` 是构建产物自己的资源路径，Next 已经按 basePath 处理过，不在这条规矩里。 */
const SKIP = /^(\/_next\/|\/atlas(\/|$)|\/\/)/;

const bad = new Map();
for (const f of html) {
  const s = readFileSync(f, "utf8");
  for (const m of s.matchAll(/href="(\/[^"]*)"/g)) {
    const href = m[1];
    if (SKIP.test(href)) continue;
    if (!bad.has(href)) bad.set(href, []);
    bad.get(href).push(f);
  }
}

console.log(`扫了 ${html.length} 个页面`);
if (!bad.size) { console.log(`✅ 没有缺 ${BASE} 前缀的站内链接`); process.exit(0); }

let total = 0;
for (const [href, files] of [...bad].sort((a, b) => b[1].length - a[1].length)) {
  total += files.length;
  console.log(`  ✗ ${href}  出现 ${files.length} 次，例如 ${files[0]}`);
}
console.log(`\n❌ ${bad.size} 个链接、共 ${total} 处缺 ${BASE} 前缀 —— ` +
  `多半是某处用了原生 <a> 而不是 <Link>。站内链接一律用 <Link>。`);
process.exit(1);
