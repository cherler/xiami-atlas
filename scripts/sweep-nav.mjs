/**
 * 厂商导航扫描：**把每家文档站的链接列出来，找官方的能力清单与更新日志。**
 *
 * 为什么要有这支：Vidu 的 `/docs/function-list`（官方按模型逐项列能力）
 * 是我沿着导航一个个点出来的，不是搜出来的 —— 而且它的路径按常识永远猜不到
 * （导航文字写「Api Reference」，href 却是 `/docs/update`）。
 *
 * **路径要从页面里读出来，不能凭常识拼。** 这支就是把那次手工过程固化。
 *
 *   node scripts/sweep-nav.mjs            # 扫全部
 *   node scripts/sweep-nav.mjs kling      # 只扫一家
 */
import { writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";
const ROOT = `${dirname(fileURLToPath(import.meta.url))}/..`;

/** 值得点进去看的链接长什么样。宁可宽一点 —— 漏一个官方能力页的代价比多看几条高。 */
const WORTH = /(function|feature|capab|model|changelog|change-log|update|release|note|version|doc|api|price|pricing|能力|功能|模型|更新|发布|版本|价格)/i;

const TARGETS = [
  { vendor: "kling",       name: "快手 可灵",        roots: ["https://app.klingai.com/global/dev/document-api/quickStart/productIntroduction", "https://kling.ai/document-api/updates/api"] },
  { vendor: "seedance",    name: "字节 Seed",        roots: ["https://seed.bytedance.com/en/models", "https://seed.bytedance.com/en/blog"] },
  { vendor: "google",      name: "Google",           roots: ["https://ai.google.dev/gemini-api/docs/video"] },
  { vendor: "minimax",     name: "MiniMax 海螺",     roots: ["https://platform.minimaxi.com/document/introduction", "https://www.minimax.io/blog"] },
  { vendor: "runway",      name: "Runway",           roots: ["https://docs.dev.runwayml.com/", "https://runwayml.com/research"] },
  { vendor: "luma",        name: "Luma",             roots: ["https://docs.lumalabs.ai/docs/welcome-to-luma-ai"] },
  { vendor: "pika",        name: "Pika",             roots: ["https://pika.art/"] },
  { vendor: "higgsfield",  name: "Higgsfield（平台）", roots: ["https://higgsfield.ai/"] },
  { vendor: "decart",      name: "Decart",           roots: ["https://decart.ai/research"] },
  { vendor: "lightricks",  name: "Lightricks（LTX，开源侧最大）", roots: ["https://huggingface.co/Lightricks"] },
  { vendor: "skywork",     name: "Skywork（SkyReels）", roots: ["https://www.skyreels.ai/"] },
  { vendor: "alibaba-ath", name: "Alibaba-ATH（HappyHorse）", roots: ["https://huggingface.co/models?search=HappyHorse"] },
  { vendor: "wan",         name: "阿里 通义万相",     roots: ["https://wan.video/"] },
  { vendor: "vidu",        name: "生数 Vidu（已找到 function-list）", roots: ["https://platform.vidu.com/docs"] },
];

const want = process.argv[2];
const list = want ? TARGETS.filter((t) => t.vendor === want) : TARGETS;

const { chromium } = await import("playwright");
const browser = await chromium.launch({ proxy: PROXY ? { server: PROXY } : undefined });
const out = [`# 厂商导航扫描 · ${new Date().toISOString().slice(0, 10)}`, "",
  "> 目的：找**厂商自己发布的能力清单 / 更新日志**。",
  "> 它们比任何第三方评测都可靠，而且路径按常识猜不到 —— 必须从页面里读。", ""];

for (const t of list) {
  out.push(`## ${t.name}（\`${t.vendor}\`）`, "");
  for (const root of t.roots) {
    let links = [];
    let err = null;
    try {
      const page = await browser.newPage();
      await page.goto(root, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(2500); // SPA 要等一拍，否则只拿到骨架
      links = await page.evaluate(() =>
        [...document.querySelectorAll("a[href]")].map((a) => ({
          href: new URL(a.getAttribute("href"), location.href).href,
          text: (a.innerText || "").trim().replace(/\s+/g, " ").slice(0, 44),
        })),
      );
      await page.close();
    } catch (e) {
      err = String(e.message).slice(0, 80);
    }
    if (err) { out.push(`- \`${root}\` — **打不开**：${err}`, ""); continue; }

    const seen = new Set();
    const hits = links.filter((l) => {
      if (seen.has(l.href) || !l.href.startsWith("http")) return false;
      seen.add(l.href);
      // **同时看 href 和文字** —— Vidu 那次就是文字骗人、href 才对
      return WORTH.test(l.href) || WORTH.test(l.text);
    });
    out.push(`\`${root}\` — 共 ${links.length} 个链接，命中 ${hits.length} 个`, "");
    for (const h of hits.slice(0, 45)) out.push(`- [${h.text || "(无文字)"}](${h.href})`);
    out.push("");
    console.log(`${t.vendor.padEnd(12)} ${root.slice(0, 52).padEnd(54)} 链接 ${String(links.length).padStart(3)} → 命中 ${hits.length}`);
  }
}
await browser.close();
writeFileSync(`${ROOT}/data/vendor-nav-sweep.md`, out.join("\n"));
console.log(`\n写在 data/vendor-nav-sweep.md`);
