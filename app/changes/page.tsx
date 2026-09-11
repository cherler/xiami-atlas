import type { Metadata } from "next";
import Link from "next/link";
import { Rich } from "@/components/Fact";
import { atlas, label } from "@/lib/atlas";
import { modelHref } from "@/lib/slug";
import changes from "@/data/changes.json";
import BackLink from "@/components/BackLink";
import DomainFilter from "@/components/DomainFilter";

/**
 * 最近有什么变化（方案 §15 What Changed）。
 *
 * §15 的要求是 **Change + So What** —— 不只说发生了什么，还要说明它意味着什么。
 * 一个只列「某某发布了某某」的页面，和厂商的 changelog 没有区别，谁都能看。
 *
 * 这里比 §15 多做一件事：**把「我们记错了」和「厂商那边变了」并排放。**
 * 一个只报别人变化、从不报自己出错的变更页，是营销稿不是变更记录。
 *
 * ## 层级
 *
 * 名字原来叫「变了什么」—— 看不懂。改成「最近有什么变化」。
 * 两大类各配一个大号中文序号 + 粗顶线分节；每条事件配 01/02 序号，
 * 一眼数得清、看得出先后。原来一堆卡片只用细线隔开，扫过去乱糟糟。
 */
type Ev = {
  id: string; date: string; side: "world" | "ours"; kind: string;
  subject: string; before: string; after: string; why: string;
  impact: string[]; src: string | null; models: string[]; domain?: string;
};
const KIND: Record<string, string> = {
  version: "版本更迭", status: "生命周期", capability: "能力面",
  availability: "去哪用", scope: "收录范围",
};

export const metadata: Metadata = {
  title: "最近有什么变化 —— 各方向的版本、停服与能力变动",
  description: "不只列发生了什么，还说明它意味着什么。同时公开我们自己记错又改正的地方。",
};

export default function ChangesPage() {
  const evs = (changes.events as Ev[]).slice().sort((a, b) => b.date.localeCompare(a.date));
  const world = evs.filter((e) => e.side === "world");
  const ours = evs.filter((e) => e.side === "ours");

  const Card = ({ e, n }: { e: Ev; n: number }) => (
    <article className="border-t border-rule py-4 flex gap-4">
      <span className="text-[15px] text-muted tabular-nums shrink-0 w-7 pt-0.5">{String(n).padStart(2, "0")}</span>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h3 className="text-[18px] font-semibold">{e.subject}</h3>
          <span className="text-muted text-[13px] tabular-nums">{e.date}</span>
          <span className="px-1.5 py-px bg-rule/60 text-muted text-[11px]">{KIND[e.kind] ?? e.kind}</span>
        </div>
        {/* 之前 → 之后：用一条箭头把对比串起来，比两个并列 div 更像「变化」 */}
        <div className="grid md:grid-cols-[1fr_auto_1fr] gap-x-4 gap-y-1 items-start text-[14px] bg-paper/60 border border-rule p-3">
          <div>
            <span className="text-muted text-[11px] block mb-0.5">之前</span>
            <Rich text={e.before} className="text-muted leading-relaxed block" />
          </div>
          <span className="hidden md:block text-muted text-[18px] self-center">→</span>
          <div>
            <span className="text-yes-ink text-[11px] block mb-0.5">之后</span>
            <Rich text={e.after} className="text-ink leading-relaxed block" />
          </div>
        </div>
        <div className="text-[15px]">
          <span className="text-no text-[12px] font-medium mr-1.5">为什么重要</span>
          <Rich text={e.why} className="leading-relaxed" />
        </div>
        <p className="text-[13px] flex flex-wrap gap-x-3 gap-y-1 items-center text-muted">
          {e.models.map((id) => {
            const m = atlas.models.find((x) => x.id === id);
            return m ? (
              <Link key={id} href={modelHref(m)} className="underline hover:text-ink">{label(m)}</Link>
            ) : null;
          })}
          {e.src && atlas.sources[e.src] ? (
            <a href={atlas.sources[e.src].url} target="_blank" rel="noreferrer" className="underline hover:text-ink">
              来源：{atlas.sources[e.src].name}
            </a>
          ) : (
            <span className="italic">无外部来源 —— 这条是我们自己的更正</span>
          )}
        </p>
      </div>
    </article>
  );

  return (
    <main className="max-w-[980px] mx-auto px-8 pt-5 pb-10 flex flex-col gap-8">
      <BackLink />

      <header className="flex flex-col gap-3 border-b-[2.5px] border-ink pb-4">
        <h1 className="text-[38px] leading-tight font-bold tracking-[-.01em]">最近有什么变化</h1>
        <p className="text-muted text-[15px] leading-relaxed max-w-[880px]">
          <b className="text-ink">不只列发生了什么，还说明它意味着什么</b> ——
          只列「某某发布了某某」，和厂商自己的 changelog 没区别，那个谁都能看。
        </p>
        <p className="text-muted text-[13px]">
          <a href="/atlas/changes.xml" className="underline hover:text-ink">用 RSS 订阅这一页 →</a>
          <span className="ml-2">阅读器里可以按模型过滤</span>
        </p>
      </header>

      {/**
        * 两大节交给 `DomainFilter`：**顶上一排方向按钮，点了两节一起筛。**
        *
        * 负责人 2026-08-13：「应该在上面有个基于四个方向的快捷导航，
        * 现在只能一直往下拉才能看到具体内容。」
        *
        * 没做锚点跳转 —— 同一个方向在两节里各出现一次，
        * **锚点只能带你到其中一处，另一处还得接着往下拉**。
        *
        * 卡片仍在这里（服务端）渲染好再传过去，不把 atlas 打包进前端；
        * 每一节的计数由客户端按筛选后的条数算，**筛完还显示总数就是在骗人**。
        */}
      <DomainFilter
        label="按方向筛选变化"
        domains={atlas.domains.map((d) => ({ id: d.id, name: d.name }))}
        sections={[
          {
            key: "world",
            title: (
              <>
                <span className="text-[18px] text-yes-ink font-bold">一</span>
                厂商那边变了什么
              </>
            ),
            items: world.map((e, i) => ({ domain: e.domain ?? "video", node: <Card key={e.id} e={e} n={i + 1} /> })),
          },
          {
            key: "ours",
            title: (
              <>
                <span className="text-[18px] text-yes-ink font-bold">二</span>
                我们记错了，又改了
              </>
            ),
            intro: (
              <p className="text-muted text-[14px] mt-2 max-w-[880px] leading-relaxed">
                <b className="text-ink">一个只报别人变化、从不报自己出错的变更页，是营销稿不是变更记录。</b>
                这个产品唯一的本钱是可信，承认错误比列举别人的新版本更能换来它。
              </p>
            ),
            items: ours.map((e, i) => ({ domain: e.domain ?? "video", node: <Card key={e.id} e={e} n={i + 1} /> })),
          },
        ]}
      />

      <footer className="border-t border-rule pt-5 text-[13px] text-muted leading-relaxed">
        数据版本 {atlas.version} · 数据截至 {atlas.generated_at} ·
        <b className="text-unknown"> 全部为机器录入</b>
      </footer>
    </main>
  );
}
