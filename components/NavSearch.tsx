"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { answer, search, type Hit } from "@/lib/search";
import { atlas } from "@/lib/atlas";
import { capHref } from "@/lib/slug";

/**
 * 导航条右上角的搜索栏。**负责人 2026-08-13：「搜索能力直接在右上角那里做一个搜索栏，
 * 不需要一个搜索页。」**
 *
 * ## 我之前反对过，理由是错的
 *
 * 上一版我把搜索做成独立页 `/search`，导航里只放一个链接，写的理由是
 *「导航在每页渲染，把搜索组件塞进去会把整份图谱数据带进每一页的包」。
 * **那个理由站不住**：`Nav` 本来就 `import { atlas }`（它要靠 domains 判断当前在哪一卷），
 * 数据早就在每一页里了。多的只是 `lib/search` 那几十行与术语表。
 *
 * **一个基于错误前提的设计决策，比没有决策更贵** —— 它让用户多点一次，
 * 还让「搜索」这件事看起来像个附属页面。
 *
 * ## 三条实现约束
 *
 * 1. **结果面板绝不能放进 `overflow-x-auto` 里。** 导航条中间那段是横向可滚的，
 *    绝对定位的面板会被裁掉 —— DOM 里在、`aria-expanded` 也对，就是一个字都看不见。
 *    这个坑品牌块踩过一次（见 `Nav.tsx` 里的注释），所以这里挂在最外层。
 * 2. **窄屏只留放大镜。** 48px 高的导航塞不下输入框 + 五个菜单项；
 *    点一下再展开，展开时盖住菜单项（这时用户要的是搜，不是逛）。
 * 3. **Answer View 不在这里展开。** 「哪些模型支持动作复刻」的答案是一个清单，
 *    塞进下拉面板会挤成一团；面板只给一句「N 个模型支持 X」并直接链到那项能力页。
 */
const KIND_ZH: Record<string, string> = {
  model: "模型", capability: "能力", platform: "平台", domain: "方向",
  application: "应用", skill: "怎么做", toolkit: "去哪查", term: "术语",
  tutorial: "教程", release: "发布",
};

export default function NavSearch() {
  const r = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  const hits: Hit[] = q.trim() ? search(q).slice(0, 8) : [];
  const a = q.trim() ? answer(q) : null;
  const cap = a?.kind === "capability" ? atlas.capabilities.find((c) => c.id === a.capId) : null;

  /** 点外面收起；`/` 直接聚焦（**输入框里按 `/` 不算** —— 那是在打字）。 */
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (e.key === "/" && !typing) { e.preventDefault(); setOpen(true); setTimeout(() => box.current?.focus(), 0); }
      if (e.key === "Escape") { setOpen(false); box.current?.blur(); }
    };
    document.addEventListener("click", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onDoc); document.removeEventListener("keydown", onKey); };
  }, []);

  const go = (href: string) => { setOpen(false); setQ(""); r.push(href); };

  return (
    <div ref={wrap} className="relative shrink-0 ml-auto">
      <div className="flex items-center gap-1">
        {/* 窄屏：先只显示放大镜，点开才有输入框 */}
        <button
          type="button" aria-label="搜索"
          onClick={() => { setOpen(true); setTimeout(() => box.current?.focus(), 0); }}
          className={`text-[13px] px-1.5 py-1 text-muted hover:text-ink ${open ? "sm:hidden" : "sm:hidden"}`}
        >🔍</button>
        <input
          ref={box}
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (a?.kind === "capability" && cap) go(capHref(cap));
              else if (hits[0]) go(hits[0].href);
            }
          }}
          placeholder="搜模型 / 能力 / 应用 / 术语…"
          className={`${open ? "block w-[240px]" : "hidden sm:block w-[190px] focus:w-[240px]"} transition-[width]
            text-[13px] px-2.5 py-1 border border-rule bg-card text-ink placeholder:text-muted/70
            outline-none focus:border-yes`}
        />
      </div>

      {open && q.trim() && (
        <div className="absolute right-0 top-[34px] w-[340px] max-w-[86vw] z-30 border border-rule bg-paper shadow-lg p-2 flex flex-col gap-1">
          {/* 有确切答案时给一句，并直接链过去 —— 清单本身在能力页上 */}
          {a?.kind === "capability" && cap && (
            <button onClick={() => go(capHref(cap))}
              className="text-left text-[13px] border border-yes/40 bg-yes/6 px-2.5 py-2 hover:bg-yes/12">
              <b className="text-ink">{a.models.length} 个模型</b>支持
              <b className="text-yes-ink mx-1">{cap.zh}</b>
              <span className="text-muted">— 看清单 →</span>
            </button>
          )}
          {a?.kind === "openweights" && (
            <div className="text-[13px] border border-yes/40 bg-yes/6 px-2.5 py-2">
              <b className="text-ink">{a.models.length} 个模型</b>公开了权重
              <span className="text-muted">（下面逐个点开看许可）</span>
            </div>
          )}

          {hits.length === 0 ? (
            <p className="text-[12.5px] text-muted px-1.5 py-2 leading-relaxed">
              没找到。<b className="text-ink">这不代表没有</b> —— 能力有各家不同的叫法，
              换个说法试试（「元素」「Ingredients」都指角色参考）。
            </p>
          ) : (
            hits.map((h) => (
              <Link key={`${h.kind}-${h.id}`} href={h.href} onClick={() => { setOpen(false); setQ(""); }}
                className="flex items-baseline gap-2 px-1.5 py-1 text-[13.5px] hover:bg-card">
                <span className="text-muted text-[11px] w-[30px] shrink-0">{KIND_ZH[h.kind]}</span>
                <span className="text-ink truncate">{h.title}</span>
                <span className="text-muted text-[11.5px] truncate">{h.sub}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
