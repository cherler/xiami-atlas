/**
 * 从 DeepWiki 捞一个仓库的 mermaid 图源。
 *
 * ## 为什么要它
 *
 * 项目页的图**不是我们照着 README 画的示意图**，是 DeepWiki 由源码生成的那批 ——
 * 它读的是真实的调用关系，画错了能追回代码。手画的示意图没有这个性质：
 * 它只反映画的人当时怎么理解，代码一改就悄悄成了假话。
 *
 * ## 抓法的两个坑
 *
 * 1. **正文在 Next 的 flight 负载里，且是双重转义的**（`\\n` 而不是 `\n`）。
 *    只 unescape 一次，围栏切出来的块中间全是字面量的反斜杠 n。
 * 2. **不能按行首匹配 `graph TD` 来切**。节点标签里也会出现这类词，
 *    正则一到标签里就断，捞出来的图是半截 —— 而半截的 mermaid **渲染得出来**，
 *    只是少了一半节点，肉眼不看源码根本发现不了。所以只认 ```mermaid 围栏。
 *
 *   node scripts/deepwiki.mjs <owner/repo> [--page 1-4-xxx] [--out 文件]
 */
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const repo = args.find((x) => x.includes("/") && !x.startsWith("--"));
const opt = (k) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : null; };
if (!repo) { console.error("用法：node scripts/deepwiki.mjs <owner/repo> [--page 子页] [--out 文件]"); process.exit(2); }

const page = opt("page");
const url = `https://deepwiki.com/${repo}${page ? `/${page}` : ""}`;
const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(40000) });
if (!res.ok) { console.error(`HTTP ${res.status} ${url}`); process.exit(1); }
const html = await res.text();

/** 转义要脱两层：flight 负载里是 `\\n`，脱一次得到 `\n` 的字面量，再脱一次才是换行。 */
const unesc = (s) => s
  .replace(/\\\\n/g, "\n").replace(/\\n/g, "\n")
  .replace(/\\\\t/g, "\t").replace(/\\t/g, "\t")
  .replace(/\\"/g, '"').replace(/\\u003c/g, "<").replace(/\\u003e/g, ">").replace(/\\u0026/g, "&")
  .replace(/\\\\/g, "\\");

const text = unesc(html);
/** 只认围栏。按 `graph TD` 之类的关键词切会切进节点标签里，捞出半截图。 */
const blocks = [...text.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1].trim());

/**
 * **DeepWiki 自己也会生成语法坏掉的 mermaid。**
 *
 * 见过三种，本质是同一个错：**语句开头不是节点 id。**
 *   `[HV] ["HunyuanVideo…"]`                ← 2026-08-16 撞的
 *   `[web/src/services/api/image.ts] --> C`  ← 2026-08-17 撞的
 *   `"McpServer" --> "WebSocketServer"`      ← 2026-08-17 又撞的
 *
 * 三次都是同一个剧本：**判据比根因窄一格，下一种变体就漏过去。**
 * 第一版只认 `] [` 挨着，第二版扩到「以 `[` 开头」，
 * 结果引号开头的第三种照样一路带到 `make-diagrams` 才炸。
 *
 * 所以这一版按根因写死：语句只能以标识符（字母或下划线）起头。
 * 中括号、引号、数字开头一律判坏 —— **宁可少挑几张，不要放坏图进去**，
 * 因为坏图在页面上是「静默少一张」，没人会来报错。
 */
const broken = (b) => /(^|\n)[ \t]*["'[\d]/.test(
  /** 先剥掉图类型声明与方向行，它们本来就不是语句。 */
  b.replace(/^\s*(flowchart|graph|sequenceDiagram|stateDiagram\S*|classDiagram|erDiagram)[^\n]*\n/, "")
    .replace(/(^|\n)[ \t]*direction[^\n]*/g, ""),
);

const uniq = [...new Set(blocks)];
const bad = uniq.filter(broken).length;
console.log(`${url}\n围栏 ${blocks.length} 块 · 去重后 ${uniq.length} 块${bad ? ` · 其中 ${bad} 块语法是坏的（别挑）` : ""}\n`);
uniq.forEach((b, i) => {
  const head = b.split("\n")[0];
  console.log(`── #${i}${broken(b) ? " ✗坏" : ""} · ${b.split("\n").length} 行 · ${head.slice(0, 60)}`);
});

const out = opt("out");
if (out) { writeFileSync(out, JSON.stringify(uniq, null, 2) + "\n"); console.log(`\n写入 ${out}`); }
else uniq.forEach((b, i) => console.log(`\n===== #${i} =====\n${b}`));
