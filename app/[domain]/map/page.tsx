import type { Metadata } from "next";
import RelationGraph from "@/components/RelationGraph";
import { atlas, domainModels } from "@/lib/atlas";
import { domainOf } from "../dom";

export async function generateMetadata(
  { params }: { params: Promise<{ domain: string }> },
): Promise<Metadata> {
  const d = domainOf((await params).domain);
  return {
    title: `${d.name} · 谁和谁有关系`,
    description: "公司 → 模型 → 能力。点任一节点只留与它直接相连的边。",
  };
}

/**
 * 「关系」这张图（docs/北极星.md 第三节）。
 *
 * 现在只画 org → model 的归属（谁是谁家的）。模型↔模型血缘、公司↔公司投资、
 * 公司↔地点这三类边还是数据洞，采到之前不画 —— 见 OrgPanorama 顶部注释。
 */
export default async function MapPage({ params }: { params: Promise<{ domain: string }> }) {
  const d = domainOf((await params).domain);
  const ms = domainModels(d.id);
  const n = atlas.orgs.filter((o) => ms.some((m) => m.org === o.id)).length;
  const lines = ms.length;

  return (
    <main className="max-w-[1400px] mx-auto px-6 py-8">
      <header className="flex items-end gap-4 border-b-[2.5px] border-ink pb-2.5">
        <h1 className="text-[38px] leading-[1.05] font-bold tracking-[-.01em]">
          {d.name} · 谁和谁有关系
          <span className="block text-[15px] leading-[1.3] font-normal text-muted mt-2">
            公司 → 模型 → 能力
          </span>
        </h1>
        <div className="ml-auto text-right text-[12px] leading-[1.7] text-muted whitespace-nowrap">
          数据截至 {atlas.generated_at}
          <br />
          公司 {n} 家 · 产品线 {lines} 条
          <br />
          投资关系 {atlas.investments.length} 条
        </div>
      </header>

      <div className="mt-6">
        <RelationGraph domain={d.id} />
      </div>

      <p className="mt-6 text-[12px] text-muted">
        图上只有真边：公司拥有产品线 {lines} 条、模型实现能力 {atlas.support.filter((s) => s.state === "yes" && ms.some((m) => m.id === s.m)).length} 格、
        投资 {atlas.investments.length} 条。<b className="text-ink font-normal">谁基于谁的训练血缘我们还没采到，没采到就不画。</b>
      </p>
    </main>
  );
}
