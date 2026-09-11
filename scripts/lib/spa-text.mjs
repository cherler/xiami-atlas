/**
 * SPA 页面 → 正文文字。**采集与人工核验共用同一份抽取逻辑。**
 *
 * 为什么要单独一份：`watch.mjs`（每天盯变化）和 `fetch-spa.mjs`（人工读文档）
 * 抓的是同一批页面。两边各写一套的话，watch 说「无变化」而人打开发现改了一大片，
 * 谁也说不清是页面没动还是两边抽的东西不一样 —— **口径不能有第二份**。
 *
 * 三条都是踩出来的：
 *
 * 1. **去掉导航。** 侧边栏和目录每次都一样，混进来会淹掉真正的变化。
 * 2. **图标要留痕。** 火山方舟的能力支持表用图标画勾，`innerText` 取出来是空白 ——
 *    而空白既可能是「不支持」也可能是「勾是个 svg」，两种含义相反。
 *    替换成 `[图标]`，让下游看见「这里有东西，只是读不出是什么」。
 * 3. **壳要报错，不能返回空串。** 上游会把空串当成「这页确实没内容」，
 *    可事实是我们够不着。这两件事在站上长得一样，含义相反。
 */

/** 正文优先级从窄到宽 —— 命中越窄的，混进来的导航越少。 */
export const SELECTORS = ["article", "main", "[class*=markdown]", "[class*=content]", "body"];

/** 判定「还是壳」的下限（去空白后的字符数）。 */
export const SHELL_FLOOR = 400;

/** 在浏览器里跑的那一段。传给 page.$eval。 */
export function extractFrom(el) {
  for (const n of el.querySelectorAll(
    "nav, aside, footer, header, script, style, [class*=sidebar], [class*=menu], [class*=toc]",
  ))
    n.remove();
  for (const n of el.querySelectorAll("svg, img, i[class*=icon], span[class*=icon]")) {
    const label = n.getAttribute("alt") || n.getAttribute("aria-label") || n.getAttribute("title");
    n.replaceWith(document.createTextNode(label ? `[${label}]` : "[图标]"));
  }
  return el.innerText;
}

/**
 * 从一个已经 goto 过的 Playwright page 上取正文。
 * 拿不到就抛 —— **绝不返回空串**。
 */
export async function spaText(page, { wait = 3500, sel } = {}) {
  await page.waitForTimeout(wait);
  // 文档站常把正文折叠起来，展开再取 —— 折叠的内容 innerText 拿不到
  await page.evaluate(() => { for (const d of document.querySelectorAll("details")) d.open = true; }).catch(() => {});

  for (const s of [sel, ...SELECTORS].filter(Boolean)) {
    const t = await page.$eval(s, extractFrom).catch(() => "");
    if (t && t.replace(/\s/g, "").length > SHELL_FLOOR) return { text: t, used: s };
  }
  /**
   * **「被人机验证挡住」和「这页是个壳」必须分开报。**
   *
   * 2026-08-12：OpenAI 帮助中心那条源长期报「还是壳：渲染后正文只有 4 个字符」，
   * 读起来像是**厂商那页没内容**。插桩到失败现场才看见 `title: "Just a moment..."` ——
   * 那是 Cloudflare 的人机验证页，我们根本没进到内容页。
   *
   * 两件事在下游的处置完全相反：壳要换 URL 或换抓法；
   * 被验证挡住则是**这条源只能人工核**，换多少种抓法都一样，
   * 而且我们不该去绕它 —— 那是反爬在正常工作。
   */
  const st = await page.evaluate(() => ({
    title: document.title || "",
    body: (document.body?.innerText || "").replace(/\s/g, "").length,
  })).catch(() => ({ title: "", body: 0 }));
  if (/just a moment|checking your browser|attention required|verify you are human|请稍候|人机验证/i.test(st.title))
    throw new Error(`被人机验证挡住（页面标题「${st.title.slice(0, 30)}」）—— 这条源只能人工核，别再换抓法`);
  throw new Error(`还是壳：渲染后正文只有 ${st.body} 个字符`);
}
