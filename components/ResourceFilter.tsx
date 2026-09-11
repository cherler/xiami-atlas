"use client";

import { useState, type ReactNode } from "react";

/**
 * 场景页里那排「项目 8 · Skill 8 · 课程 1 · 文档 4」——**让它能点**。
 *
 * ## 为什么之前不能点
 *
 * 那排标签一直只是个计数，长得像筛选器（有边框、有底色、四个并排），
 * 于是负责人 2026-08-12 直接去点了 —— 没反应。
 * **一个长得像按钮的东西不响应点击，比没有它更糟**：读者会以为站坏了，
 * 而不是以为「这里本来就没这个功能」。
 *
 * 146 条公开资源分在 9 个应用里，最多的一个有二十几条并排 ——
 * 「我只想看课程」这个需求是真实的，不是锦上添花。
 *
 * ## 为什么是这个形状
 *
 * `ScenarioBoard` 是服务端组件，`ResourceCard` 也在那边渲染（它要读 atlas.sources）。
 * 所以这里**不重新渲染卡片**，而是把已经渲染好的节点连同它的 kind 一起收进来，
 * 只负责显示哪些、隐藏哪些。这样交互是客户端的、内容仍然是服务端渲染的，
 * 不必把整块搬进客户端，也不必把 atlas 打包进前端 bundle。
 *
 * ## 两条不能省的规矩
 *
 * 1. **数量为 0 的档不给点。** 有的应用一条课程都没有，那个标签点下去会得到一片空白 ——
 *    看起来像加载失败。置灰并 `disabled`，让「没有」这件事看得出来。
 * 2. **选中之后要能退回来。** 再点一次同一个标签＝取消筛选；另外「全部」永远在最左边。
 */
export type FilterItem = { kind: string; node: ReactNode };

export default function ResourceFilter({
  counts, items, label,
}: {
  counts: { kind: string; label: string; n: number }[];
  items: FilterItem[];
  label: string;
}) {
  const [on, setOn] = useState<string | null>(null);
  const shown = on ? items.filter((x) => x.kind === on) : items;
  const total = items.length;

  const chip = (active: boolean, dead = false) =>
    `text-[11px] border px-2 py-1 transition-colors ${
      dead
        ? "border-rule/60 text-muted/45 cursor-not-allowed"
        : active
          ? "border-yes text-yes-ink bg-yes/8"
          : "border-rule text-muted hover:border-yes hover:text-ink"
    }`;

  return (
    <>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${label}按类型筛选`}>
        <button type="button" onClick={() => setOn(null)} aria-pressed={!on} className={chip(!on)}>
          全部 <b className={on ? "text-ink" : "text-yes-ink"}>{total}</b>
        </button>
        {counts.map(({ kind, label: zh, n }) => (
          <button
            key={kind}
            type="button"
            disabled={n === 0}
            aria-pressed={on === kind}
            /* 再点一次取消 —— 否则选进去就出不来，只能刷新页面 */
            onClick={() => setOn((v) => (v === kind ? null : kind))}
            className={chip(on === kind, n === 0)}
          >
            {zh} <b className={n === 0 ? "" : on === kind ? "text-yes-ink" : "text-ink"}>{n}</b>
          </button>
        ))}
      </div>

      <div
        className="mt-3 h-[500px] md:h-[560px] overflow-y-auto overscroll-contain border border-rule bg-paper/35 p-2.5"
        tabIndex={0}
        role="region"
        aria-label={label}
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          {shown.map((x, i) => (
            <div key={i} className="contents">{x.node}</div>
          ))}
        </div>
        {/* 理论上到不了这里（0 的档不给点），但真到了要说人话，不能是一片空白 */}
        {shown.length === 0 && (
          <p className="text-[13px] text-muted p-4">这一类下面暂时没有收录到东西。</p>
        )}
      </div>
    </>
  );
}
