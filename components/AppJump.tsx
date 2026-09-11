"use client";

import { useEffect, useState } from "react";

/**
 * 场景页的应用跳转条。
 *
 * ## 为什么要有
 *
 * 九个应用竖着排，一屏放不下两个。负责人 2026-08-11：
 * 「要拉到很下面才知道是哪个应用，找自己那个方向还得滚整页」。
 * 这一页的用法是**先认领「我要做的是哪件事」，再看路线** ——
 * 认领这一步却要靠滚动去试，等于把目录藏在正文里。
 *
 * ## 为什么是吸顶条，不是侧边栏
 *
 * - **必须吸顶**：不吸顶就只在页首有用，而「找不到自己那个」恰恰发生在滚下去之后。
 * - **不做左侧栏**：卡片本身左边已经有一列 280px 的「输入 → 输出 / 需要的能力」，
 *   再塞一列会把公开路线挤扁；而且窄屏下侧边栏一般直接收起来，
 *   **等于在最需要它的屏幕上没有**。
 * - **不做浮动按钮**：多一次点击才看到清单，而这里的信息量（九个词）本来就该一次看全。
 *
 * `top-12` 对齐全站导航的高度（`h-12`）—— 两条一起吸顶，不互相盖。
 */
export default function AppJump({ apps }: { apps: { id: string; zh: string }[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    /**
     * 高亮当前那一个。**判据是「哪一块占住了视口上部」**，不是「哪一块可见」——
     * 长卡片同时可见两三块是常态，按可见判会来回跳。
     * `rootMargin` 上边减掉两条吸顶栏的高度，让被盖住的部分不算数。
     */
    const secs = apps
      .map((a) => document.getElementById(`app-${a.id}`))
      .filter((el): el is HTMLElement => !!el);
    if (!secs.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id.replace(/^app-/, ""));
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );
    secs.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [apps]);

  /**
   * 窄屏下这一条要横着滚，高亮的那个很可能在视野外 ——
   * **看不到高亮 = 这条的「你在这儿」等于没有**。跟着滚过去。
   * 只滚这条自己（`block: "nearest"`），别把整页也带着动。
   */
  useEffect(() => {
    if (!active) return;
    document
      .querySelector(`[data-app-jump] a[href="#app-${active}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  return (
    <nav
      data-app-jump
      aria-label="按应用跳转"
      className="sticky top-12 z-10 -mx-6 px-6 bg-paper/95 backdrop-blur-sm border-b border-rule"
    >
      <div className="flex items-center gap-1 overflow-x-auto py-2">
        <span className="text-[11px] text-muted shrink-0 mr-1.5 whitespace-nowrap">目录</span>
        {apps.map((a) => (
          <a
            key={a.id}
            href={`#app-${a.id}`}
            aria-current={active === a.id ? "true" : undefined}
            className={`text-[12.5px] px-2 py-1 shrink-0 whitespace-nowrap border ${
              active === a.id
                ? "border-ink bg-ink text-paper font-medium"
                : "border-rule text-muted hover:text-ink hover:border-ink/50"
            }`}
          >
            {a.zh}
          </a>
        ))}
      </div>
    </nav>
  );
}
