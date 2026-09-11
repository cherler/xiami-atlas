/** 线上三条外观路径的验收。⚠️ 必须 --proxy-server=direct：本机 http_proxy 指着 7890，
 *  不绕开的话拿不到 xiamimate.com，会误判成「站挂了」（我误判过一次）。 */
import { chromium } from "playwright";
const br = await chromium.launch({ args: ["--proxy-server=direct://", "--proxy-bypass-list=*"] });
const PAGES = ["/", "/crossborder", "/atlas/", "/account"];
for (const [name, scheme, manual] of [
  ["跟随系统（系统深色）", "dark",  null],
  ["系统浅色 + 手动黑夜", "light", "dark"],
  ["系统深色 + 手动白天", "dark",  "light"],
]) {
  const ctx = await br.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("https://xiamimate.com/", { waitUntil: "load", timeout: 60000 });
  if (manual) await page.evaluate((m) => localStorage.setItem("xm-theme", m), manual);
  const out = [];
  for (const p of PAGES) {
    await page.goto("https://xiamimate.com" + p, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(1000);
    const r = await page.evaluate(() => {
      const bar = document.querySelector(".topbar");
      const px = (c) => { const m = c.match(/\d+/g); return m ? +m[0] : 255; };
      return { body: px(getComputedStyle(document.body).backgroundColor),
               bar: bar ? px(getComputedStyle(bar).backgroundColor) : null };
    });
    const want = manual ?? (scheme === "dark" ? "dark" : "light");
    const bodyOk = want === "dark" ? r.body < 80 : r.body > 200;
    const barOk = r.bar === null || (want === "dark" ? r.bar < 80 : r.bar > 200);
    out.push(`${p} ${bodyOk && barOk ? "✓" : "✗ body=" + r.body + " 页眉=" + r.bar}`);
  }
  console.log(`${name.padEnd(20)} ${out.join("  ")}`);
  await ctx.close();
}
await br.close();
