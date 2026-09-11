import type { Metadata } from "next";
import Link from "next/link";
import { atlas, label, groupByDomain, domainOfModel } from "@/lib/atlas";
import { caveats, CAVEAT_ZH, type Caveat } from "@/lib/caveats";
import { modelHref } from "@/lib/slug";
import BackLink from "@/components/BackLink";
import Share from "@/components/Share";

/**
 * 「能力对了 ≠ 你用得上」。**这一页是三条动线的交汇点，也是这个产品最值钱的内容。**
 *
 * 每一条都是现算的（见 lib/caveats.ts）—— 数据变了清单跟着变，
 * 某天某条不再成立，它自己就消失了。**不手写一条。**
 */
export const metadata: Metadata = {
  title: "能力对了，你未必用得上 —— 下单前先看这几条",
  description: "上架的常常不是当前版本；上游停服了平台还在卖；同一个模型各平台不同价；大陆直连不通。每条带厂商官方原文。",
  openGraph: {
    title: "能力对了，你未必用得上 —— 下单前先看这几条",
    description: "上游停服了平台还在卖；上架的常常不是当前版本；同一模型各平台不同价；大陆直连不通。每条带厂商官方原文。",
    images: [{ url: "/atlas/og/caveats-16x9.png", width: 1200, height: 675 }],
  },
  twitter: { card: "summary_large_image", images: ["/atlas/og/caveats-16x9.png"] },
};

export default function CaveatsPage() {
  const all = caveats();
  const byKind = new Map<Caveat["kind"], Caveat[]>();
  for (const c of all) byKind.set(c.kind, [...(byKind.get(c.kind) ?? []), c]);
  const order: Caveat["kind"][] = ["upstream-gone", "stale-version", "coming-soon", "discount-trap", "price-varies", "blocked"];

  const CN = ["一", "二", "三", "四", "五", "六", "七", "八"];
  const kinds = order.filter((k) => byKind.get(k)?.length);

  return (
    <main className="max-w-[900px] mx-auto px-5 pt-5 pb-8 flex flex-col gap-8">
      {/* 分享和「返回」同一行、一左一右。**放页脚等于没有** ——
          负责人 2026-08-12：「放在右下角谁也看不到咧」。 */}
      <div className="flex items-baseline justify-between gap-3">
        <BackLink />
        <Share og="/atlas/og/caveats-16x9.png" title="能力对了，你未必用得上 —— 下单前先看这几条" />
      </div>
      <header className="flex flex-col gap-2 border-b-[2.5px] border-ink pb-4">
        <h1 className="text-[38px] font-bold leading-tight tracking-[-.01em]">能力对了，你未必用得上</h1>
        <p className="text-muted text-[15px]">
          {all.length} 条，全部从数据现算 · 每条带厂商官方原文
          <Link href="/method#states" className="underline ml-2 hover:text-ink">口径 →</Link>
        </p>
      </header>

      {/**
        * 每一类里**再按方向分一层**。caveat 自己不带 domain —— 它是从模型现算出来的，
        * 所以方向也从模型问：`domainOfModel(c.m)`。**别为此在数据里加一个会和模型对不上的字段。**
        */}
      {kinds.map((k, ki) => (
        <section key={k} className={ki === 0 ? "flex flex-col gap-2 pt-1" : "flex flex-col gap-2 border-t-[2.5px] border-ink pt-4"}>
          <h2 className="text-[22px] font-bold leading-tight flex items-baseline gap-3">
            <span className="text-[17px] text-yes-ink font-bold">{CN[ki]}</span>
            {CAVEAT_ZH[k]}
            <span className="text-muted text-[14px] font-normal">{byKind.get(k)!.length} 条</span>
          </h2>
          {groupByDomain(byKind.get(k)!, (c) => (c.m ? domainOfModel(c.m) : undefined)).map((g, _gi, gs) => (
          <div key={g.id || "rest"} className="flex flex-col gap-2">
            {/* 只有一个方向时不画小标题 —— 那时候分组是噪音 */}
            {gs.length > 1 && (
              <p className="text-[13px] text-muted flex items-baseline gap-2">
                <b className="text-ink text-[14px]">{g.name}</b>
                <span className="tabular-nums">{g.items.length} 条</span>
              </p>
            )}
          {g.items.map((c, i) => {
            const src = c.src ? atlas.sources[c.src] : null;
            return (
              <div key={i} className="border border-rule rounded-xl bg-card p-3 flex flex-col gap-1">
                <p className="text-[15px]">
                  {c.m ? (
                    <Link href={modelHref(c.m)} className="underline hover:text-yes">{c.what}</Link>
                  ) : c.what}
                </p>
                {c.quote && (
                  <p className="text-muted text-[12px] leading-relaxed">
                    原文：「{c.quote}」
                    {src && (
                      <a href={src.url} target="_blank" rel="noreferrer" className="underline ml-1.5 hover:text-yes">
                        {src.name}
                      </a>
                    )}
                  </p>
                )}
              </div>
            );
          })}
          </div>
          ))}
        </section>
      ))}
    </main>
  );
}
