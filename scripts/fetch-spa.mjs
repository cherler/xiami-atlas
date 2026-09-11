/**
 * 把 SPA 文档页渲染成文字 —— 人工核验时用的那一半。
 *
 * ## 为什么非要它不可
 *
 * 火山方舟（豆包）和 MiniMax 的开放平台文档都是前端渲染的：
 * 直接抓 HTML 只拿到一个导航壳，正文一个字都没有。后果分两层 ——
 *
 * 1. **能力格填不了。** 九个核心文本模型里这两家的 27 个格子全是 ⬜，
 *    而它不是「厂商没说」，是**我们够不着**。这两件事在站上长得一模一样，
 *    但含义相反，混着记就是在骗读者。
 * 2. **更糟的是 watch 不会喊。** 拿到的壳每次都一样，比对永远「无变化」，
 *    于是这两家看起来「很稳定」—— 沉默的错。
 *
 * 抽取逻辑在 `lib/spa-text.mjs`，和 `watch.mjs` 共用同一份。
 *
 *   node scripts/fetch-spa.mjs <url> [--sel 主选择器] [--wait 毫秒] [--out 文件]
 */
import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { spaText } from "./lib/spa-text.mjs";

const args = process.argv.slice(2);
const url = args.find((x) => x.startsWith("http"));
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
if (!url) { console.error("要给一个 url"); process.exit(2); }

const OUT = opt("out");
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 2000 } });
  await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {});
  const { text, used } = await spaText(page, { wait: Number(opt("wait", 3500)), sel: opt("sel") });
  const dense = text.replace(/\s/g, "").length;
  const body = `# ${url}\n（渲染取自 ${used}，${dense} 字）\n\n${text.replace(/\n{3,}/g, "\n\n")}`;
  if (OUT) { writeFileSync(OUT, `${body}\n`); console.log(`${dense} 字 → ${OUT}`); }
  else console.log(body);
} catch (e) {
  // **不打印空内容。** 空输出会被当成「这页确实没东西」，而事实是我们够不着。
  console.error(`${e.message}  ${url}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}
