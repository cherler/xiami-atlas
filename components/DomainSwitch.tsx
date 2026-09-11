"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { atlas } from "@/lib/atlas";

/**
 * 方向切换器 —— 导航最左边那块。
 *
 * ## 为什么不是一排 tab
 *
 * 数据里 domains 现在只有一条（AI 视频，state=live）。做成一排 tab、把「AI 编程」
 * 「AI 音乐」也摆上去灰着，是**假装有别的**，而这个产品的全部本钱就是不骗人
 * （lib/atlas.ts 的 Domain 注释原话）。所以这里是一个下拉：
 * 收起时只显示当前这一卷，展开时**如实说还有几卷、都是什么状态**。
 *
 * 加第二个方向 = 往 data/atlas.json 的 domains 里加一条，不动这个文件。
 */
/**
 * @param current 当前所在的方向 id。**由 Nav 从路由算好传进来。**
 *   之前这里自己 `find(d => d.state === "live")` —— 于是站在 /atlas/image/* 上，
 *   切换器照样显示「AI 视频」：**路由对、内容对、只有这块标签在骗人**。
 */
/**
 * @param home 当前就在根页（`/atlas`，那张「先选一个方向」）。
 *   **和 `neutral` 不是一回事**：`/changes`、`/toolkit` 也不属于任何方向（neutral），
 *   但你并不在首页 —— 那里写「首页」是错的。所以按钮上：根页写「首页」、其余跨方向页写「全站」。
 */
export default function DomainSwitch({
  brand, current, neutral = false, home = false,
}: { brand: string; current?: string; neutral?: boolean; home?: boolean }) {
  const [open, setOpen] = useState(false);
  /**
   * 平台页眉挂上时收起品牌字样。
   *
   * 挂上之后上面那条已经写着「虾米伙伴 › 虾米看AI」，这里再写一遍
   * 就是同一个名字在两行里各说一遍。挂不上（本地 dev、干净 clone）时照旧显示 ——
   * **降级后不能连自己是谁都没了。**
   */
  const [chrome, setChrome] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setChrome(el.dataset.chrome === "on");
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["data-chrome"] });
    return () => mo.disconnect();
  }, []);
  const box = useRef<HTMLDivElement>(null);
  const now =
    atlas.domains.find((d) => d.id === current) ??
    atlas.domains.find((d) => d.state === "live") ??
    atlas.domains[0];

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const planned = atlas.domains.filter((d) => d.state !== "live" && !d.href);

  return (
    <div ref={box} className="relative shrink-0 mr-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 text-[13px] font-semibold bg-ink text-paper px-2 py-1 hover:opacity-90"
      >
        {!chrome && (
          <>
            <span>{brand}</span>
            <span className="opacity-55">·</span>
          </>
        )}
        <span className={chrome ? "" : "font-normal"}>{home ? "首页" : neutral ? "全站" : now?.name}</span>
        <span className={`text-[9px] transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-1 min-w-[230px] bg-paper border border-ink shadow-[3px_3px_0_var(--color-rule)] py-1 z-30"
        >
          {/**
            * 有 href 的就是**真能点进去**，没有的才是「还没开始」。
            * 之前无差别标「还没开始」，是因为那时确实只有一个方向；
            * 现在 AI 图像已经有页面了 —— 还标「还没开始」就是骗人。
            */}
          {/**
            * **回首页的那一条 —— 之前整个菜单里没有。**
            *
            * 负责人 2026-08-12：「我找不到切换回首页的『全站』」。
            * 确实找不到：菜单里只列四个方向，而「先选一个方向」那张页
            * （`/atlas`）没有任何入口指回去 —— 点进某个方向之后就出不来了，
            * 只能改地址栏。**一个切换器不能只让你换台、不让你回台标。**
            *
            * 放在最上面并用一条分隔线和方向们隔开：它不是第五个方向。
            */}
          <Link href="/" role="menuitem" onClick={() => setOpen(false)}
            className={`px-3 py-1.5 text-[13px] flex items-center gap-2 border-b border-rule mb-1 hover:bg-rule/30 ${
              home ? "font-semibold" : "text-muted"
            }`}>
            <span className={home ? "text-yes-ink" : "text-unknown"}>{home ? "●" : "○"}</span>
            首页
            <span className="ml-auto text-[11px] text-muted">先选一个方向</span>
          </Link>

          {atlas.domains.map((d) => {
            /**
             * **实心点 = 你现在在这里，不是「这个方向是 live」。**
             *
             * 原来两件事挤在同一个点上：`d.state === "live"` 既画实心又加粗。
             * 于是站在 /atlas/image/* 上打开菜单，选中态显示的是「AI 视频」——
             * 顶上的按钮明明写着「AI 图像」。负责人 2026-08-11 截图报的就是这个。
             *
             * 成熟度另有其位（右侧的「建设中 / 还没开始」），**它跟你在哪儿无关**。
             */
            const here = d.id === current;
            const live = d.state === "live";
            const inner = (
              <>
                <span className={here ? "text-yes-ink" : "text-unknown"}>{here ? "●" : "○"}</span>
                {d.name}
                {!live && (
                  <span className="ml-auto text-[11px]">{d.href ? "建设中" : "还没开始"}</span>
                )}
              </>
            );
            const cls = `px-3 py-1.5 text-[13px] flex items-center gap-2 ${
              here ? "font-semibold" : "text-muted"
            }`;
            return d.href ? (
              <Link key={d.id} href={d.href} role="menuitem" onClick={() => setOpen(false)}
                className={`${cls} hover:bg-yes/8`}>
                {inner}
              </Link>
            ) : (
              <div key={d.id} role="menuitem" className={cls}>{inner}</div>
            );
          })}
          {/**
            * **「建设中」那条脚注删掉了**（负责人 2026-08-12：「建设中根本不会上线」）。
            *
            * 它解释的是一个不会发生的状态：四个方向现在全是 live，
            * 而按负责人的做法，一卷没核完就不会挂上去 —— 那条脚注是在给一个空集写注释。
            * 下拉菜单是导航，不是说明书；每多一行都在挤真正要点的那几条。
            *
            * ⚠️ **右侧那个「建设中 / 还没开始」的角标本身留着**：它是从 `d.state` 现算的，
            * 真出现非 live 的方向时仍会显示。删的是那句解释，不是那个事实。
            *
            * 「目前只有这一卷」那句也一并去掉 —— 现在四卷，它永远不会出现。
            */}
        </div>
      )}
    </div>
  );
}
