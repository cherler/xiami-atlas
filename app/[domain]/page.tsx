import type { Metadata } from "next";
import Link from "next/link";
import TruthTable, { Legend } from "@/components/TruthTable";
import MobileStack from "@/components/MobileStack";
import Explorer from "@/components/Explorer";
import TaskPicker from "@/components/TaskPicker";
import Search from "@/components/Search";
import { Rich } from "@/components/Fact";
import { atlas, domainModels, tracksOf } from "@/lib/atlas";
import { domainOf } from "./dom";
import Share from "@/components/Share";

/**
 * 方向首页 = 那个方向的能力核验规格书。
 *
 * **一份代码渲染所有方向。** 视频有两轨（离线出片 / 实时交互），图像只有一轨；
 * 这里按 `domains[].tracks` 循环，卷名、轨名、说明全从数据取 ——
 * 没有任何 `k === "clip" ? … : …` 这种写法。加第三个方向不改这个文件。
 */
export async function generateMetadata(
  { params }: { params: Promise<{ domain: string }> },
): Promise<Metadata> {
  const { domain } = await params;
  const d = domainOf(domain);
  return {
    title: `${d.name} · 能力核验规格书`,
    description: `${d.name}：谁能做什么、什么时候长出来的、拿什么跑。每一格都带厂商官方原文与核验日期。`,
    /**
     * **每一卷用自己的卡。** 在这之前三卷都没写 openGraph，全继承根 layout ——
     * 于是把 /atlas/text 分享出去，别人看到的是 og:url 指向站首页、
     * 标题写着「9 个 AI 视频模型」、图是一张 AI 视频的表。
     */
    openGraph: {
      title: `${d.name} · 能力核验规格书`,
      url: `https://xiamimate.com/atlas/${domain}`,
      images: [{ url: `/atlas/og/domain-${domain}-16x9.png`, width: 1200, height: 675 }],
    },
    twitter: { card: "summary_large_image", images: [`/atlas/og/domain-${domain}-16x9.png`] },
  };
}

export default async function DomainHome({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const d = domainOf(domain);
  const tracks = tracksOf(d);
  const models = domainModels(d.id);
  /** 第三卷那套交互目前只服务视频（Explorer / TaskPicker 的能力轴钉在 clip 上）。 */
  const hasExplorer = d.id === "video";

  /**
   * **不要带 `data-page="home"`。** 那个记号是出站验证判断
   * 「这一页是不是兜底成了根页」的唯一稳定锚点（不能用文案，文案会改）。
   * 方向首页也带上的话，`/video` 会被判成「回退到根页」而报红 ——
   * 第一次改路由就撞上了。记号只属于根路径那一页。
   */
  return (
    <main data-page="domain" className="max-w-[1400px] mx-auto px-6 py-8">
      {/**
       * **页面标题和分卷标题是两件事，之前挤在同一个 `<h1>` 里。**
       *
       * 原来第一卷没有自己的标题 —— 它的位置被「AI 视频 · 能力核验规格书」占了，
       * 「第一卷 · 离线出片轨」被挤成一行 15px 的副标题；而第二卷因为不用带页面标题，
       * 拿到的是一个 38px 的 `<h1>`。**同一层级的两卷，一个 15px 一个 38px**，
       * 而且一页上出现了两个 `<h1>`。负责人 2026-08-11 一眼看出来。
       *
       * 现在页面标题独立成唯一的 `<h1>`，三个区块（第一卷 / 第二卷 / 自己上手查）
       * 统一用 26px 的 `<h2>` —— 它们本来就是平级的。
       */}
      <header className="flex items-end gap-4 border-b-[2.5px] border-ink pb-2.5">
        <h1 className="text-[38px] leading-[1.05] font-bold tracking-[-.01em]">
          {d.name} · 能力核验规格书
        </h1>
        {/**
          * **两行，不是四行。** 页头是 `items-end` 对齐 ——
          * 右边这块比标题高多少，标题上方就空出多少。
          * 加了分享按钮之后它从三行变四行，于是每一页顶上都多出一片空白
          * （负责人 2026-08-12 截图指出）。三项统计合并成两行，分享按钮同排。
          */}
        <div className="ml-auto text-right text-[12px] leading-[1.7] text-muted whitespace-nowrap">
          数据截至 {atlas.generated_at} · 产品线 {models.length} 条
          <br />
          引用官方来源 {Object.keys(atlas.sources).length} 处
          <span className="mx-1.5 text-rule">|</span>
          <Share og={`/atlas/og/domain-${domain}-16x9.png`} title={`${d.name} · 能力核验规格书`} />
        </div>
      </header>

      {/**
        * **这一卷的边界与口径。**
        *
        * 2026-08-15 才发现：`domains[].note` **从来没有被渲染过**。
        * 八卷积累下来的判据、边界、特例说明 —— 「3D 资产包括高斯泼溅」
        * 「数字人是唯一一个不按产出物收的」「Cosmos 整支不拆」——
        * 全都只躺在 JSON 里，**读者一个字都看不到**。
        *
        * 这不是小遗漏：这个站卖的就是「每条判断都说得出理由」，
        * 而卷级的理由恰恰是最难自己想明白、也最值得给人看的一层。
        *
        * 用 `<details>` 收起来而不是直接摊开：**要看得见，但不能挡路**。
        *
        * ⚠️ **2026-08-15 又收了一次。** 负责人：「是不是说太多了？你解释的东西
        * 太多是不是不太好。」量了一下他是对的 —— 最早写的视频卷 32 字，
        * 后加的数字人卷 758 字、6 个 ⚠️、3 处写死的日期，**这个字段变成了工作日志**
        * （每次往后追加而不是改写）。九条全部改写成「一句定位 + 每条边界一句」，
        * 共减 2292 字；流程记录进 ontology.md，写死的统计一律不写 ——
        * **页面本来就在实时算，写死一份必然变成错的**（数字人那句「98 格里 60 格 ⬜」
        * 当时已经过期成 84 格了）。见规则十七。
        *
        * 标题也从「我们凭什么这么划」改成「这一卷收什么、不收什么」——
        * 前者像在辩解，后者是读者真正想知道的那个问题。
        */}
      {d.note && (
        <details className="mt-5 border border-rule rounded-lg bg-card">
          <summary className="cursor-pointer px-3.5 py-2.5 text-[14px] font-semibold hover:bg-paper/50">
            这一卷收什么、不收什么
          </summary>
          <div className="px-3.5 pb-3.5 text-[13.5px] leading-[1.85] text-muted">
            <Rich text={d.note} />
          </div>
        </details>
      )}

      {tracks.map((t, i) => (
        <section key={t.id} className={i ? "mt-14" : "mt-8"}>
          <header className="border-b border-ink/45 pb-2">
            <h2 className="text-[26px] leading-[1.15] font-bold tracking-[-.01em]">
              {[t.volume, t.zh].filter(Boolean).join(" · ")}
              {t.note && (
                <span className="block text-[14px] leading-[1.4] font-normal text-muted mt-1.5">
                  {t.note}
                </span>
              )}
            </h2>
          </header>
          <div className="mt-4">
            <TruthTable k={t.id} />
          </div>
          {i === 0 && (
            <>
              <Legend />
              <MobileStack k={t.id} />
            </>
          )}
        </section>
      ))}

      <p className="mt-5 text-[13px] text-muted">
        代表性视图，不是完整列表 ——
        <Link href={`/${d.id}/models`} className="underline ml-1 hover:text-ink">
          查看全部 {models.length} 个模型 →
        </Link>
      </p>

      {hasExplorer && (
        <section className="mt-14">
          <header className="border-b border-ink/45 pb-2">
            {/* 和上面两卷同一号字 —— 它们是平级的三个区块 */}
            <h2 className="text-[26px] leading-[1.15] font-bold tracking-[-.01em]">
              自己上手查
              <span className="block text-[14px] leading-[1.4] font-normal text-muted mt-1.5">
                点右边一项能力看谁实现了它，点左边两个模型比一比 —— 或者直接搜一个问题
              </span>
            </h2>
          </header>
          <div className="mt-4"><Explorer /></div>
          <div className="mt-4"><TaskPicker /></div>
          <div className="mt-5"><Search /></div>
        </section>
      )}

      {/* **这个方向缺什么就说什么。** 半成品最忌讳装成成品。 */}
      {d.state !== "live" && (
        <section className="mt-10 border border-unknown/40 bg-unknown/6 p-4 text-[13.5px] leading-relaxed">
          <b>这个方向还在建。</b>
          {" "}库里 {models.length} 条产品线，{models.filter((m) => (m.tier ?? "core") === "core").length} 条已逐格核过、进上表。
          <b className="text-ink"> ⬜ 比 AI 视频那边多得多，原因是我们还没读完那些官方文档，不是厂商不透明。</b>
          {!hasExplorer && " 「自己上手查」那一节还没接到这个方向。"}
        </section>
      )}

      <nav className="mt-12 border-t-[.5px] border-rule pt-3 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
        {[
          /**
           * **`/basics` 排在第一位，因为它服务的是「还没入门」的人。**
           *
           * 2026-08-12 这一页刚上线时只有 `/toolkit` 一处链它 —— 而 /toolkit 自己
           * 也在这排次级入口里，等于埋了两层，负责人当天就问「入口在哪里」。
           * 对照：/changes 被 961 页链、/method 481 页、/caveats 32 页、/toolkit 7 页，
           * **它只有 1 页。**
           *
           * 顺序不是随手排的：一个连 FP8 是什么都不知道的人，
           * 「最近有什么变化」「去哪个站查」对他全都用不上。
           */
          ["/basics", "看不懂那些词？先看这里"],
          ["/changes", "最近有什么变化"],
          ["/caveats", "能力对了，未必用得上"],
          ["/toolkit", "想查一件事，去哪个站"],
          [`/${d.id}/models`, `全部 ${models.length} 个模型`],
        ].map(([href, zh]) => (
          <Link key={href} href={href} className="hover:text-ink underline">{zh} →</Link>
        ))}
      </nav>

      <footer className="mt-6 border-t-[.5px] border-rule pt-3 text-[12px] leading-[1.6] text-muted">
        数据 {atlas.version} · 数据截至 {atlas.generated_at} ·{" "}
        <Link href="/method#agent" className="underline hover:text-ink">机器录入</Link>
      </footer>
    </main>
  );
}
