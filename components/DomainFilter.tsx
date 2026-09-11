"use client";

import { useState, type ReactNode } from "react";

/**
 * 按方向筛内容。**给「最近有什么变化」这类分两大节的页面用。**
 *
 * ## 为什么是筛选而不是锚点
 *
 * 负责人 2026-08-13：「最近有什么变化 页，应该在上面有个基于 AI 视频、AI 图像、
 * AI 文本、AI 声音 的快捷导航，现在只能一直往下拉才能看到具体内容。」
 *
 * 第一反应是做锚点跳转。但这一页有**两大节**（「厂商那边变了什么」「我们记错了又改了」），
 * 同一个方向在两处各出现一次 —— **锚点只能把你带到其中一处，另一处还得接着往下拉**。
 * 筛选没有这个问题：点「AI 声音」，两节里不是声音的都消失，页面直接短下来。
 *
 * ## 计数跟着筛选走
 *
 * 每一节标题旁边那个「13 条」也要跟着变 —— 筛完还显示总数，
 * 那个数就成了骗人的：**页面上明明只剩 3 条**。所以节标题的计数由这里算，
 * 不在服务端写死。
 *
 * ## 形状和场景页那排一致
 *
 * 同一个站里两个筛选器长得不一样，用户要学两次。所以按钮样式、
 *「再点一次取消」、「0 条的档置灰不可点」三条规矩都照搬 `ResourceFilter`。
 */
export type DomainItem = { domain: string; node: ReactNode };
export type Section = { key: string; title: ReactNode; intro?: ReactNode; items: DomainItem[] };

export default function DomainFilter({
  domains, sections, label = "按方向筛选",
}: {
  domains: { id: string; name: string }[];
  sections: Section[];
  /** 屏幕阅读器听到的名字。**别写死** —— 这个组件同时给 /changes 与 /toolkit 用，
   *  写死成「按方向筛选变化」，在 /toolkit 上就是错的。 */
  label?: string;
}) {
  const [on, setOn] = useState<string | null>(null);
  const all = sections.flatMap((s) => s.items);
  const countOf = (id: string) => all.filter((x) => x.domain === id).length;

  const chip = (active: boolean, dead = false) =>
    `text-[12.5px] border px-2.5 py-1 transition-colors ${
      dead
        ? "border-rule/60 text-muted/45 cursor-not-allowed"
        : active
          ? "border-yes text-yes-ink bg-yes/8"
          : "border-rule text-muted hover:border-yes hover:text-ink"
    }`;

  return (
    <>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
        <button type="button" onClick={() => setOn(null)} aria-pressed={!on} className={chip(!on)}>
          全部 <b className={on ? "text-ink" : "text-yes-ink"}>{all.length}</b>
        </button>
        {domains.map((d) => {
          const n = countOf(d.id);
          return (
            <button
              key={d.id}
              type="button"
              disabled={n === 0}
              aria-pressed={on === d.id}
              onClick={() => setOn((v) => (v === d.id ? null : d.id))}
              className={chip(on === d.id, n === 0)}
            >
              {d.name} <b className={n === 0 ? "" : on === d.id ? "text-yes-ink" : "text-ink"}>{n}</b>
            </button>
          );
        })}
      </div>

      {sections.map((s, si) => {
        const shown = on ? s.items.filter((x) => x.domain === on) : s.items;
        return (
          <section key={s.key} className={si === 0 ? "pt-1" : "border-t-[2.5px] border-ink pt-4"}>
            <h2 className="text-[23px] font-bold leading-tight flex items-baseline gap-3">
              {s.title}
              <span className="text-muted text-[14px] font-normal tabular-nums">{shown.length} 条</span>
            </h2>
            {s.intro}
            {shown.length ? (
              /**
               * **选「全部」时仍按方向分小标题，筛过之后才铺平。**
               *
               * 08-11 负责人定过：「也应该在对应页面做一定的分类才是。混在一起还是不够好」。
               * 加筛选器时我一度把这层分组删了 —— 那是把上一条要求推翻了。
               * 两者不冲突：**筛选管「只看一个方向」，分组管「全都看时别糊成一片」**。
               * 已经筛到单一方向时不再画小标题 —— 那时候标题是噪音（页面上只剩这一个方向）。
               */
              <div className="mt-2 flex flex-col gap-5">
                {on
                  ? shown.map((x, i) => <div key={i} className="contents">{x.node}</div>)
                  : domains
                      .map((d) => ({ d, list: shown.filter((x) => x.domain === d.id) }))
                      .filter((g) => g.list.length)
                      .map((g) => (
                        <div key={g.d.id}>
                          <p className="text-[13px] text-muted flex items-baseline gap-2 border-b border-rule pb-1.5">
                            <b className="text-ink text-[14px]">{g.d.name}</b>
                            <span className="tabular-nums">{g.list.length} 条</span>
                          </p>
                          {g.list.map((x, i) => <div key={i} className="contents">{x.node}</div>)}
                        </div>
                      ))}
              </div>
            ) : (
              /* **空状态要说清是筛掉的，不是没有。** 否则读者会以为这一节坏了。 */
              <p className="mt-3 text-[13.5px] text-muted">
                这一节里没有该方向的记录 —— 点上面的「全部」看其余的。
              </p>
            )}
          </section>
        );
      })}
    </>
  );
}
