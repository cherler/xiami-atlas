import type { Metadata } from "next";
import Link from "next/link";
import { Fact, Rich } from "@/components/Fact";
import { atlas, capsOf, cell, label, vendorName , trackName} from "@/lib/atlas";
import { capHref } from "@/lib/slug";
import BackLink from "@/components/BackLink";
import Share from "@/components/Share";

/**
 * 模型页。**每个模型一个稳定 URL**（§19 分享 / §20 SEO 都建在这上面）。
 *
 * slug 用 id 不用版本号：`Wan 2.5 → 2.7 → 3.0` 一路改，而 `/model/wan` 不变。
 * 地址被人存下来、被搜索引擎收录之后，改一次就断一次。
 */
export function generateStaticParams() {
  return atlas.models.map((m) => ({ id: m.id }));
}

// Next 15 起 params 是 Promise，必须 await —— 直接当对象用会在 build 时类型报错
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const m = atlas.models.find((x) => x.id === id);
  if (!m) return {};
  const t = label(m);
  const yes = capsOf(m.class).filter((c) => cell(m.id, c.id).state === "yes").length;
  return {
    // §20 的长尾词就长这样：「Kling 3.0 支持什么 / 能做什么」
    title: `${t} 能做什么 —— 逐项能力与官方来源`,
    description:
      `${t}（${vendorName(m)}，${m.version_as_of}）在 ${capsOf(m.class).length} 项能力里支持 ${yes} 项。` +
      `每一格都带厂商官方来源与核验日期。`,
    // 这一页自己的分享图（§19）。§19 要的是「知识图可分享」，不是只分享 URL ——
    // 图里画的就是这一页的结论，从同一份数据生成。
    openGraph: { images: [{ url: `/atlas/og/model-${id}-16x9.png`, width: 1200, height: 675 }] },
    twitter: { card: "summary_large_image", images: [`/atlas/og/model-${id}-16x9.png`] },
  };
}

const STATUS: Record<string, { tag: string; cls: string }> = {
  discontinued: { tag: "已停服", cls: "text-no" },
  superseded: { tag: "非主力", cls: "text-muted" },
};

export default async function ModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const m = atlas.models.find((x) => x.id === id);
  if (!m) return null;
  const caps = capsOf(m.class);
  const st = m.status && m.status !== "active" ? STATUS[m.status] : null;
  const t = { yes: 0, no: 0, unknown: 0 };
  for (const c of caps) t[cell(m.id, c.id).state] += 1;

  return (
    <main className="max-w-[980px] mx-auto px-8 pt-5 pb-10 flex flex-col gap-8">
      {/* 分享和「返回」同一行、一左一右。**放页脚等于没有** ——
          负责人 2026-08-12：「放在右下角谁也看不到咧」。 */}
      <div className="flex items-baseline justify-between gap-3">
        <BackLink />
        <Share og={`/atlas/og/model-${id}-16x9.png`} title={label(m)} />
      </div>

      <header className="flex flex-col gap-2">
        <h1 className="text-[40px] leading-tight font-semibold">
          <span className={st?.cls ?? ""}>{label(m)}</span>
          {st && <span className={`ml-3 text-[18px] font-medium ${st.cls}`}>{st.tag}</span>}
        </h1>
        <p className="text-muted text-[16px]">
          {vendorName(m)} · 该版本 {m.version_as_of} · {trackName(m.class, "short")}轨
          {(m.tier ?? "core") !== "core" && " · Extended（只保证存在，不保证逐格核过）"}
        </p>
        {m.status_note && <Rich text={m.status_note} className="text-ink text-[15px] leading-relaxed" />}
        <p className="text-muted text-[15px]">
          {caps.length} 项能力里 <b className="text-yes">{t.yes} 项支持</b>、
          <b className="text-no">{t.no} 项不支持</b>、<b className="text-unknown">{t.unknown} 项官方没说</b>
        </p>
      </header>

      <section>
        <h2 className="text-[22px] font-semibold mb-3">逐项能力</h2>
        {caps.map((c) => (
          <div key={c.id}>
            <Link href={capHref(c)} className="text-[13px] text-muted underline hover:text-ink">
              {c.name}
            </Link>
            <Fact m={m.id} c={c.id} label={c.zh} />
          </div>
        ))}
      </section>

      {/* 「去哪用」模块已删（负责人 2026-08-09）：那一页整体砍掉了 —— 不给
          Replicate / fal / APIYI 这些第三方 API 货架做免费曝光。数据层保留，
          只用来撑「上游停服了平台还在卖」那类警告（/caveats）。 */}

      <footer className="border-t border-rule pt-5 text-[13px] text-muted leading-relaxed">
        数据版本 {atlas.version} · 数据截至 {atlas.generated_at} ·
        <b className="text-unknown"> 全部为机器录入</b>
      </footer>
    </main>
  );
}
