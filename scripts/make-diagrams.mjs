/**
 * 把 `topics[].projects[].diagrams[].mermaid` 渲染成内联 SVG。
 *
 * ## 为什么在构建时渲染，而不是运行时加载 mermaid
 *
 * 这是个静态导出站。运行时加载 mermaid 意味着每个读者都下载一份图形库，
 * 只为画一张不会变的图 —— 而图的内容在构建那一刻就定死了。
 *
 * ## 颜色：哨兵色 → 令牌
 *
 * mermaid 不接受 `var(--color-x)` 当主题色（它要解析颜色去算派生色，
 * 直接报 `Unsupported color format`）。所以先用一组不会撞的假色渲染，
 * 再把它们替换回令牌 —— **一张图同时服务深浅两种外观，不用出两份**。
 * 连 mermaid 自己派生的箭头填充与连线标签底也一并映射，产物里不留写死的颜色。
 *
 * ⚠️ **这一步只能在本机跑，不能挂进 prebuild。**
 * 它要 Playwright 浏览器，而生产机上没装 —— 和分享图（make-share）同一个原因，
 * 也走同一条路：**本机出图，随部署包传过去**。
 * 挂进 prebuild 的话服务器构建会直接失败，而失败点看着像是「校验挂了」。
 *
 * 用法：npm run diagrams   → public/diagrams/<id>.svg
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const atlas = JSON.parse(readFileSync("data/atlas.json", "utf8"));
const jobs = [];
for (const t of atlas.topics ?? [])
  for (const p of t.projects ?? [])
    for (const d of p.diagrams ?? []) jobs.push({ ...d, project: p.zh });

if (!jobs.length) { console.log("没有要渲染的图"); process.exit(0); }
mkdirSync("public/diagrams", { recursive: true });

/** 哨兵 → 令牌。前七个是我们指定的主题色，后四个是 mermaid 自己派生出来的。 */
const MAP = {
  "#010101": "--color-paper", "#020202": "--color-card", "#030303": "--color-ink",
  "#040404": "--color-rule", "#050505": "--color-muted", "#060606": "--color-card",
  "#070707": "--color-paper",
  "#000000": "--color-ink", "#000": "--color-ink",
  "#fefefe": "--color-paper", "#f8f8f8": "--color-card",
  // 时序图不吃上面那组变量，它自己另有一套（actor / signal / note / loop）。
  // 下面这些是它在哨兵之外还会自己塞进来的写死色 —— 不映射就会在深色下露白底。
  "#fafafa": "--color-card", "#eaeaea": "--color-card",
  "#333": "--color-ink", "#666": "--color-muted", "#999": "--color-muted",
  // 注释框的底色是 mermaid 直接写在元素上的 fill=，`noteBkgColor` 根本不管用。
  "#EDF2AE": "--color-card",
};

/** 不是十六进制、但同样写死的颜色。箭头描边写的是 `black`，深色下会直接消失。 */
const NAMED = { 'stroke="black"': 'stroke="var(--color-ink)"' };

/**
 * subgraph 的标题色必须自己指定。
 *
 * 不指定的话，mermaid 会拿 `tertiaryColor` 去**反推**一个「在它上面看得清」的文字色 ——
 * 而我们给的 tertiaryColor 是近黑哨兵 `#070707`，于是它推出近白 `#f8f8f8`，
 * 最后落在浅色页面上就是**白底白字**。哨兵色骗过了颜色，骗不过从颜色反推的逻辑。
 */
const CLUSTER_VARS = {
  clusterBkg: "#060606", clusterBorder: "#040404",
  titleColor: "#030303", tertiaryTextColor: "#030303",
  nodeTextColor: "#030303", edgeLabelBackground: "#010101",
};

/** 时序图专用哨兵。值复用上面同一批哨兵色，最终落到同一批令牌。 */
const SEQ_VARS = {
  actorBkg: "#020202", actorBorder: "#040404", actorTextColor: "#030303", actorLineColor: "#040404",
  signalColor: "#050505", signalTextColor: "#050505",
  labelBoxBkgColor: "#060606", labelBoxBorderColor: "#040404", labelTextColor: "#030303",
  loopTextColor: "#030303", sequenceNumberColor: "#010101",
  noteBkgColor: "#060606", noteBorderColor: "#040404", noteTextColor: "#030303",
  activationBkgColor: "#060606", activationBorderColor: "#040404",
};

let leaks = 0;
const mermaidJs = readFileSync("node_modules/mermaid/dist/mermaid.min.js", "utf8");
const br = await chromium.launch();
const page = await br.newPage();
await page.setContent("<!doctype html><body><div id=o></div>");
await page.addScriptTag({ content: mermaidJs });

for (const j of jobs) {
  const svg = await page.evaluate(async ([code, id, seq, cluster]) => {
    // @ts-ignore
    mermaid.initialize({
      startOnLoad: false, theme: "base", securityLevel: "loose", flowchart: { htmlLabels: true, curve: "basis" },
      sequence: { useMaxWidth: true, mirrorActors: false, actorMargin: 42, boxMargin: 8 },
      themeVariables: {
        background: "#010101", primaryColor: "#020202", primaryTextColor: "#030303",
        primaryBorderColor: "#040404", lineColor: "#050505",
        secondaryColor: "#060606", tertiaryColor: "#070707",
        fontFamily: '"PingFang SC","Microsoft YaHei",system-ui,sans-serif', fontSize: "13px",
        ...seq,
        ...cluster,
      },
    });
    // @ts-ignore
    const { svg } = await mermaid.render("m_" + id.replace(/[^a-z0-9]/gi, ""), code);
    return svg;
  }, [j.mermaid, j.id, SEQ_VARS, CLUSTER_VARS]);

  let out = svg;
  // 长的先替换：`#000000` 必须先于 `#000`，否则前者会被后者切成 `var(--color-ink)000`。
  for (const hex of Object.keys(MAP).sort((a, b) => b.length - a.length)) out = out.split(hex).join(`var(${MAP[hex]})`);
  for (const [from, to] of Object.entries(NAMED)) out = out.split(from).join(to);
  const left = [...new Set(out.match(/#[0-9a-fA-F]{3,6}\b/g) || [])];
  if (left.length) { console.warn(`  ⚠️ ${j.id} 还留着写死的颜色：${left.join(" ")}`); leaks++; }
  writeFileSync(`public/diagrams/${j.id}.svg`, out);
  console.log(`  ${j.project} · ${j.title} → public/diagrams/${j.id}.svg（${out.length} 字节）`);
}
await br.close();
console.log(`共 ${jobs.length} 张` + (leaks ? `，其中 ${leaks} 张漏色` : "，零漏色"));
if (leaks) process.exit(1);   // 漏色的图在深色下会露白，必须挡住
