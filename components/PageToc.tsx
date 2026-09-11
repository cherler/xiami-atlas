"use client";

import { useEffect, useState } from "react";

/**
 * 页内目录。**负责人 2026-08-13：「我在想有没有可能在 basics 页左侧做一个目录出来」。**
 *
 * ## 为什么这一页需要它，而别的页不需要
 *
 * `/basics` 是站上最长的一页（7,500px+），而且**三部分是递进的**：
 * 先找教程 → 看懂那些词 → 去哪儿。读者常常读到一半想回去看某一节，
 * 顶部那排横向导航一滚就看不见了。侧栏目录一直在，还能告诉你「现在在哪一节」。
 *
 * `/changes` 与 `/toolkit` 不需要：那两页是并列内容，已经有方向筛选把长度砍掉了。
 * **不要因为这一页做了就给每页都加** —— 目录对短页是纯噪音。
 *
 * ## 两条实现上的选择
 *
 * 1. **标题从 DOM 里现读，不在页面上手写一份。** 手写的目录会和内容漂移：
 *    加一节忘了加目录项，读者就找不到它。这一页的 h2/h3 本来就有稳定的文字，
 *    直接扫。⚠️ 只扫 h2 与 h3 —— h4 是术语的四个小类，列进来目录比正文还长。
 * 2. **当前位置用 IntersectionObserver，不用 scroll 事件。** 后者每帧都要算位置，
 *    在这个长度的页面上是白白烧主线程；而这一站刚查过「长任务 0 个」，不该由我破功。
 */
type Item = { id: string; text: string; level: number };

export default function PageToc() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const hs = [...document.querySelectorAll("main h2, main h3")] as HTMLElement[];
    const list: Item[] = [];
    for (const h of hs) {
      // 没有 id 的补一个 —— 目录要能跳过去，而手写 id 会漏
      if (!h.id) h.id = `toc-${list.length}`;
      /**
       * ⚠️ **跳过去要给吸顶导航让位。**
       * 负责人 2026-08-13 截图：点目录里的小标题，落点把标题本身顶到了视口外，
       * 屏幕最上面直接是卡片 —— 读者以为跳错了地方。
       * 浏览器把锚点元素的顶边对齐视口顶边，而顶上压着 68px 的吸顶导航。
       * `scroll-margin-top` 就是为这件事存在的；写在这里而不是各页 class 上，
       * **因为需要让位的正好是目录会跳的那些标题**，两者不该分开维护。
       */
      h.style.scrollMarginTop = "88px";
      /**
       * ⚠️ **只取标题本身，不要标题旁边那些计数与说明。**
       * `innerText` 的第一行会把同一行的 `<span>21 个</span>` 一起带进来 ——
       * 目录里就成了「一、去读哪些公开教程21 个」。
       * 所以先把标记为附注的子节点摘掉（`[data-note]`），再取文字。
       */
      const clone = h.cloneNode(true) as HTMLElement;
      for (const n of clone.querySelectorAll("[data-note], .sr-only")) n.remove();
      const text = (clone.textContent || "").split("\n")[0].trim();
      if (!text) continue;
      list.push({ id: h.id, text, level: h.tagName === "H2" ? 2 : 3 });
    }
    setItems(list);

    const io = new IntersectionObserver(
      (es) => {
        // 取最靠上的那个可见标题；都不可见时保持上一个，避免来回跳
        const vis = es.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-72px 0px -70% 0px" },
    );
    for (const h of hs) io.observe(h);
    return () => io.disconnect();
  }, []);

  if (items.length < 3) return null;   // 短页不画目录

  return (
    <nav aria-label="页内目录" className="text-[13px] leading-relaxed">
      <p className="text-[12px] text-muted mb-2">这一页有什么</p>
      <ul className="flex flex-col gap-0.5 border-l border-rule">
        {items.map((it) => (
          <li key={it.id}>
            <a
              href={`#${it.id}`}
              aria-current={active === it.id ? "true" : undefined}
              className={`block py-1 border-l-2 -ml-px transition-colors ${
                it.level === 2 ? "pl-3 font-semibold" : "pl-5"
              } ${
                active === it.id
                  ? "border-yes text-yes-ink"
                  : "border-transparent text-muted hover:text-ink hover:border-rule"
              }`}
            >
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
