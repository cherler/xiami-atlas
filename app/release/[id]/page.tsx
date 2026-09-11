import type { Metadata } from "next";
import Link from "next/link";
import BackLink from "@/components/BackLink";
import Share from "@/components/Share";
import { Rich } from "@/components/Fact";
import { atlas, label } from "@/lib/atlas";
import { capHref, modelHref } from "@/lib/slug";

/**
 * 一次发布的档案页。**负责人 2026-08-13：「很明显我们需要为演进树里
 * 已经不是最新的模型也建立档案？」**
 *
 * ## 为什么之前没有，以及为什么这是个真缺口
 *
 * 站上原本只有两种实体页：`/model/{id}`（一条产品线，显示**当前版本**）
 * 与 `/capability/{id}`（一项能力）。而演进树上有 345 次发布 ——
 * **它们全都没有自己的地址**。后果有三层：
 *
 * 1. 搜「TripoSplat」只能落到「Tripo P1」那一页，**看到的是另一代**；
 * 2. 每次发布挂着的官方原文与来源，只在树的悬浮里露一下，**没法被引用**；
 * 3. 「这一代新增了什么」是这个站最有信息量的一句话，却没有一个地方能收藏它。
 *
 * ## 这一页只回答一件事：**这一代加了什么，凭什么这么说**
 *
 * 不重复产品线页的内容（能力矩阵、可用性、价格都在那边）。
 * 这里给的是：日期、新增了什么、**官方原文 + 来源链接**、它在这条线上的位置、
 * 以及我们采集时留下的警告（日期是估的、只有论文没有权重…）。
 */
export function generateStaticParams() {
  return atlas.versions.map((v) => ({ id: v.id }));
}

const find = (id: string) => atlas.versions.find((v) => v.id === decodeURIComponent(id));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const v = find((await params).id);
  if (!v) return { title: "找不到这次发布" };
  const m = atlas.models.find((x) => x.id === v.m);
  return {
    title: `${m?.family ?? v.m} ${v.version} · ${v.added}`,
    description: `${v.date} 发布。这一代新增：${v.added}。带官方原文与来源链接。`,
    openGraph: { images: [{ url: "/atlas/og/index-16x9.png", width: 1200, height: 675 }] },
  };
}

export default async function ReleasePage({ params }: { params: Promise<{ id: string }> }) {
  const v = find((await params).id);
  if (!v) return <main className="mx-auto max-w-[900px] px-8 py-16">找不到这次发布。</main>;

  const m = atlas.models.find((x) => x.id === v.m)!;
  const dom = atlas.domains.find((d) => d.id === (m.domain ?? "video"));
  const src = (atlas.sources as Record<string, { name: string; url: string; tier?: string }>)[v.src];
  const cap = v.cap ? atlas.capabilities.find((c) => c.id === v.cap) : null;
  const parent = v.parent ? atlas.versions.find((x) => x.id === v.parent) : null;
  const kids = atlas.versions.filter((x) => x.parent === v.id);
  /** 同一条产品线的其余发布，按时间排 —— 读者常常是来看「它前后是什么」的。 */
  const siblings = atlas.versions.filter((x) => x.m === v.m).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <main className="mx-auto max-w-[900px] px-8 pt-5 pb-16 flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <BackLink />
        <Share og="/atlas/og/index-16x9.png" title={`${m.family} ${v.version} · ${v.added}`} />
      </div>

      <header className="flex flex-col gap-3 border-b border-rule pb-5">
        <p className="text-[13px] text-muted flex flex-wrap gap-x-2 gap-y-1 items-center">
          <Link href={dom?.href ?? `/${m.domain}`} className="underline hover:text-ink">{dom?.name}</Link>
          <span>·</span>
          <Link href={modelHref(m)} className="underline hover:text-ink">{m.family}</Link>
          <span>·</span>
          <span className="tabular-nums">{v.date}</span>
        </p>
        <h1 className="text-[38px] leading-tight font-semibold">
          {m.family} {v.version}
        </h1>
        {/* 这一句是全站最有信息量的一句：**这一代加了什么**，不是版本号 */}
        <p className="text-[19px] leading-snug border-l-[3px] border-yes pl-3">
          <Rich text={v.added} />
        </p>
        {v.version !== m.version && (
          <p className="text-[13px] text-muted">
            ⚠️ 这不是这条产品线的当前版本 —— 当前是
            <Link href={modelHref(m)} className="underline hover:text-ink mx-1">{label(m)}</Link>
            （截至 {m.version_as_of}）。<b className="text-ink">旧版本的页面照样留着</b>：地址被人存过、被引用过，改一次就断一次。
          </p>
        )}
      </header>

      {/* ── 凭什么这么说 ───────────────────────────────── */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[15px] font-semibold">凭什么这么说</h2>
        <p data-quote className="text-[15px] leading-relaxed border-l-2 border-yes/50 pl-3 text-muted">
          <Rich text={v.quote} />
        </p>
        <p className="text-[13px] text-muted">
          来源：
          {src ? (
            <a href={src.url} target="_blank" rel="noreferrer" className="underline hover:text-ink ml-1">{src.name}</a>
          ) : (
            <span className="text-unknown ml-1">{v.src}（这条来源没登记，属于我们的疏漏）</span>
          )}
        </p>
        {v.note && (
          <p className="text-[13.5px] leading-relaxed text-muted border-l-2 border-unknown pl-3">
            <Rich text={v.note} />
          </p>
        )}
      </section>

      {/* ── 挂到哪项能力 ───────────────────────────────── */}
      <section className="flex flex-col gap-2 border-t border-rule pt-5">
        <h2 className="text-[15px] font-semibold">这一代对应哪项能力</h2>
        {cap ? (
          <p className="text-[15px]">
            <Link href={capHref(cap)} className="underline hover:text-yes">{cap.zh}</Link>
            <span className="text-muted text-[13px] ml-2">{cap.name}</span>
          </p>
        ) : (
          <p className="text-[14px] leading-relaxed text-muted">
            <b className="text-ink">没挂能力，理由记在这里：</b>
            <Rich text={v.cap_skip ?? "（缺理由 —— 按 R71 这条不该存在，请补）"} />
          </p>
        )}
      </section>

      {(v.repos ?? []).length > 0 && (
        <section className="flex flex-col gap-2 border-t border-rule pt-5">
          <h2 className="text-[15px] font-semibold">这一代覆盖的仓库</h2>
          <p className="text-[13.5px] text-muted leading-relaxed">
            同一代的不同尺寸档 / 精度档算同一次发布，不另开节点。
          </p>
          <ul className="flex flex-col gap-1 text-[14px]">
            {(v.repos ?? []).map((r) => (
              <li key={r}>
                <a href={r.includes("/") ? `https://huggingface.co/${r}` : "#"} target="_blank" rel="noreferrer"
                  className="underline hover:text-ink font-mono text-[13px]">{r}</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── 它在这条线上的位置 ─────────────────────────── */}
      <section className="flex flex-col gap-2 border-t border-rule pt-5">
        <h2 className="text-[15px] font-semibold">它在这条线上的位置</h2>
        <p className="text-[13.5px] text-muted">
          {parent ? <>上一代：<Link href={`/release/${parent.id}`} className="underline hover:text-ink">{m.family} {parent.version} · {parent.added}</Link></> : "这是这条线的根 —— 没有上一代（不为了让树好看硬接一条边）。"}
        </p>
        {kids.length > 0 && (
          <p className="text-[13.5px] text-muted">
            下一代：
            {kids.map((k, i) => (
              <span key={k.id}>
                {i > 0 && "、"}
                <Link href={`/release/${k.id}`} className="underline hover:text-ink">{k.version} · {k.added}</Link>
              </span>
            ))}
          </p>
        )}
        <ol className="mt-2 flex flex-col gap-1.5 text-[13.5px]">
          {siblings.map((x) => (
            <li key={x.id} className={x.id === v.id ? "text-ink" : "text-muted"}>
              <span className="tabular-nums mr-2">{x.date}</span>
              {x.id === v.id ? (
                <b>{x.version} · {x.added}（就是这一条）</b>
              ) : (
                <Link href={`/release/${x.id}`} className="underline hover:text-ink">{x.version} · {x.added}</Link>
              )}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[13px]">
          <Link href={`${dom?.href ?? ""}/tree`} className="underline hover:text-ink">在演进树上看这条线 →</Link>
        </p>
      </section>
    </main>
  );
}
