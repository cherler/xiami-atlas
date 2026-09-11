"use client";

import { useEffect } from "react";

/**
 * 页内锚点跳转**不进浏览历史**。挂在根 layout 上，全站一份。
 *
 * ## 为什么
 *
 * 负责人 2026-08-13：「basics 的返回功能，应该是返回跳转来这一页之前的页面。
 * 现在是它记住了点击左侧目录的页，结果返回只是返回点击目录前的一刻。」
 *
 * 默认行为里，点 `#reading` 这种链接会**往历史里压一条**。
 * 于是「← 返回」（`router.back()`）退的是上一次锚点跳转，而不是上一个页面 ——
 * 目录点了五下，就要按五次才出得去。
 *
 * 站上有三处会产生页内锚点：左侧目录 `PageToc`、场景页的应用跳转条 `AppJump`、
 * `/basics` 顶部那排「一 / 二 / 三」。**修在这里而不是各修一遍** ——
 * 分开修的结果一定是下次新加一处又漏。
 *
 * ## 怎么修
 *
 * 自己滚过去，然后用 `replaceState` 把地址栏的 `#` 换掉（**换，不是压**）。
 * 地址仍然可复制可分享，历史里却只剩真正的页面跳转。
 *
 * 代价说清楚：**浏览器的「后退」不再能在页内退回上一节**。
 * 这一站有「← 返回」这个明确的出口，而页内退回一节是几乎没人用的功能 ——
 * 拿它换「返回按钮说话算数」是划算的。
 *
 * ⚠️ 带修饰键的点击（Cmd / Ctrl / Shift / 中键）一律放过 ——
 * 那是「在新标签打开」，拦下来就把这个功能弄坏了。
 */
export default function AnchorHistory() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")?.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;   // 找不到目标就别拦，交给浏览器

      e.preventDefault();
      target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      /**
       * 键盘与读屏用户要跟着走到这一节，否则焦点还留在目录上，
       * 再按 Tab 是从目录往下继续，而不是从落点开始读。
       * `tabIndex = -1` 是让本来不可聚焦的标题能接住焦点。
       */
      if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
      target.focus({ preventScroll: true });
      history.replaceState(history.state, "", `#${id}`);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
