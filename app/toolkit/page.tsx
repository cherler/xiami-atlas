import type { Metadata } from "next";
import Link from "next/link";
import { Rich } from "@/components/Fact";
import glossary from "@/data/glossary.json";
import { atlas } from "@/lib/atlas";
import DomainFilter from "@/components/DomainFilter";
import BackLink from "@/components/BackLink";

/**
 * 资源导航（方案 §16）。原话：**「不要做一排 Logo 的 hao123」，要「导航 + 判断」。**
 *
 * 所以每一条的主体是**我们的判断**，链接只是附带。
 * 而 `caveat`（负面结论）是校验强制必填的那一栏 ——
 * **「Epoch AI 不收视频模型」这种我们真查过才知道的话，才是这一页的价值。**
 * 一个只有链接和好话的导航页，别处到处都是。
 */
export const metadata: Metadata = {
  title: "想查一件事，该去哪个站 —— 附我们踩过的坑",
  description: "按任务导航，每条带我们自己的判断和负面结论：Epoch AI 不收视频模型；AA 量的是画质不是能力；HF 的「权重公开」不等于开源协议。",
  openGraph: { images: [{ url: "/atlas/og/index-16x9.png", width: 1200, height: 675 }] },
};

export default function ToolkitPage() {
  return (
    <main className="max-w-[900px] mx-auto px-5 pt-5 pb-8 flex flex-col gap-6">
      <BackLink />
      <header className="flex flex-col gap-2 border-b-[2.5px] border-ink pb-4">
        <h1 className="text-[38px] font-bold leading-tight tracking-[-.01em]">想查一件事，该去哪个站</h1>
        <p className="text-muted text-[15px]">
          {atlas.toolkit.length} 条 · 每条带我们自己的判断，<b className="text-ink">包括「别去」的那部分</b>
        </p>
      </header>

      {/* **完全没有基础的人，来这一页是走错门了。** 这页答的是「查一件事去哪个站」，
          而负责人 2026-08-12 的问题是「FP8 是什么意思，我完全搞不懂」——
          那是另一件事，得先有个地方从头讲起。所以在最前面给一条明路。 */}
      <Link href="/basics"
        className="border border-yes/50 bg-yes/6 px-4 py-3 hover:bg-yes/10 transition-colors">
        <p className="text-[15px] font-semibold">还不知道 FP8 / GGUF / LoRA 是什么？先看这一页 →</p>
        <p className="text-[13px] text-muted mt-1">
          {glossary.tutorials.reduce((n, g) => n + g.items.length, 0)} 个公开教程（从「什么是大模型」讲起）+ 本地部署要懂的词。<b className="text-ink">教程不是我们写的</b>，
          我们只核实它还活着、说清许可、标出适合谁。
        </p>
      </Link>

      {/**
        * 按方向筛，形状和 /changes、场景页那两排一致。
        * 负责人 2026-08-13：「toolkit 页 也应该添加一个同样的方式快速导航才是」。
        *
        * 这一页只有一大节，所以 `sections` 只传一条；
        * 复用 `DomainFilter` 而不是另写一个 —— **同一个站里三个筛选器长得不一样，用户要学三次**。
        */}
      <DomainFilter
        label="按方向筛选工具站"
        domains={atlas.domains.map((d) => ({ id: d.id, name: d.name }))}
        sections={[{
          key: "toolkit",
          title: <span className="sr-only">按方向</span>,
          items: atlas.toolkit.map((t, i) => ({
            domain: (t as { domain?: string }).domain ?? "video",
            node: (
              <section key={t.site + t.task} className="border-t border-rule py-4 flex gap-4">
                <span className="text-[15px] text-muted tabular-nums shrink-0 w-7 pt-1">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <p className="text-[13px] text-muted">{t.task}</p>
                  <p className="text-[18px] font-semibold">
                    <a href={t.url} target="_blank" rel="noreferrer" className="underline hover:text-yes-ink">{t.site} →</a>
                  </p>
                  <Rich text={t.verdict} className="text-[15px] leading-relaxed" />
                  {/* 负面结论单独描出来 —— 它是这一页真正值钱的部分 */}
                  <div className="border-l-2 border-no pl-3 mt-1">
                    <Rich text={t.caveat} className="text-[14px] leading-relaxed text-muted" />
                  </div>
                  <p className="text-muted text-[12px]">核验于 {t.checked_at}</p>
                </div>
              </section>
            ),
          })),
        }]}
      />

      <p className="text-muted text-[13px]">
        我们自己的口径在
        <Link href="/method" className="underline mx-1 hover:text-ink">方法</Link>
        那一页。
      </p>
    </main>
  );
}
