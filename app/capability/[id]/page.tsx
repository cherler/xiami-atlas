import type { Metadata } from "next";
import Link from "next/link";
import { Fact, Rich } from "@/components/Fact";
import { atlas, cell, label, modelsOf, vendorName, type Klass , trackName} from "@/lib/atlas";
import { modelHref } from "@/lib/slug";
import BackLink from "@/components/BackLink";
import Share from "@/components/Share";

/**
 * 能力页。回答 §1.4 里最常被问的那类问题：「我想做人物动作复刻，有哪些模型？」
 *
 * 这一页比模型页多两样东西，而它们正是这个项目吃过亏换来的：
 *  · **各家叫法（aliases）** —— Kling 管角色参考叫 Element、LTX 叫 Ingredients。
 *    不列出来，别人和我一样会因为搜不到而以为「没有」。
 *  · **最早可证时间与那句原文** —— 而不是一个没出处的年份。
 */
/** 能力属于哪个方向 —— 取 domains 表里的名字，别在这里再写一份中文名。 */
const domainName = (d?: string) =>
  atlas.domains.find((x) => x.id === (d ?? "video"))?.name ?? "AI 视频";

export function generateStaticParams() {
  return atlas.capabilities.map((c) => ({ id: c.id }));
}

// Next 15 起 params 是 Promise，必须 await —— 直接当对象用会在 build 时类型报错
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = atlas.capabilities.find((x) => x.id === id);
  if (!c) return {};
  // 数也要按方向数。现在跨方向的格子压根不存在、`cell()` 会回 unknown，所以不加过滤也碰巧对；
  // 但「碰巧对」不是对 —— 哪天能力 id 在两个方向重名，这个数就无声地错了。
  const n = atlas.models.filter(
    (m) => (m.domain ?? "video") === (c.domain ?? "video") && cell(m.id, c.id).state === "yes",
  ).length;
  return {
    /**
     * **方向名要跟着能力走，不能写死「AI 视频」。**
     * 2026-08-12 补新轴时发现：`/capability/t-think`（文本）、`/capability/s-clone`（声音）
     * 的标题全写着「哪些 AI 视频模型支持」—— 四卷共 66 个能力页，除了视频那 18 个全错。
     * 这是**加第二个方向时漏改的一处**，一年多没人发现，因为它只出现在 <title> 和分享描述里。
     */
    title: `${c.zh}（${c.name}）—— 哪些${domainName(c.domain)}模型支持`,
    description:
      `${n} 个模型支持${c.zh}。${c.aliases?.length ? `各家叫法：${c.aliases.slice(0, 5).join("、")}。` : ""}` +
      `每一格都带厂商官方来源与核验日期。`,
    // 这一页自己的分享图（§19）。§19 要的是「知识图可分享」，不是只分享 URL ——
    // 图里画的就是这一页的结论，从同一份数据生成。
    openGraph: { images: [{ url: `/atlas/og/capability-${id}-16x9.png`, width: 1200, height: 675 }] },
    twitter: { card: "summary_large_image", images: [`/atlas/og/capability-${id}-16x9.png`] },
  };
}

export default async function CapabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = atlas.capabilities.find((x) => x.id === id);
  if (!c) return null;
  /**
   * **`both` 要展开成「这条能力自己那个方向」的轨，不是写死视频那两条。**
   *
   * 原来这里是 `["clip", "realtime"]` —— 视频的离线出片轨与实时交互轨。
   * 2026-08-12 给声音卷补「开源权重」（`class: "both"`，因为 TTS / 音乐 / 实时语音三轨都算）时炸出来：
   * `/capability/s-openweights` 整页列的是 **Seedance、Hailuo、Wan、Runway、Kling、Vidu、Veo** ——
   * 七个视频模型，每一格都是 ⬜。看着像「声音的开源权重没人做」，其实是列错了一批模型。
   *
   * `lib/atlas.ts` 里给能力轴那个函数写过一模一样的教训
   * （「`class: "both"` 的本意是「这个方向的两条轨都算」，但它只说了轨、没说方向」），
   * 这一处没跟上。`modelsOf` 本来就收第二个参数，把方向传进去即可。
   */
  const dom = c.domain ?? "video";
  const tracks: Klass[] =
    c.class === "both"
      ? ((atlas.domains.find((x) => x.id === dom)?.tracks ?? []).map((t) => t.id) as Klass[])
      : [c.class as Klass];
  const src = c.since_src ? atlas.sources[c.since_src] : null;

  return (
    <main className="max-w-[980px] mx-auto px-8 pt-5 pb-10 flex flex-col gap-8">
      {/* 分享和「返回」同一行、一左一右。**放页脚等于没有** ——
          负责人 2026-08-12：「放在右下角谁也看不到咧」。 */}
      <div className="flex items-baseline justify-between gap-3">
        <BackLink />
        <Share og={`/atlas/og/capability-${id}-16x9.png`} title={c.zh} />
      </div>

      <header className="flex flex-col gap-3">
        <h1 className="text-[40px] leading-tight font-semibold">
          {c.zh}
          <span className="text-muted text-[20px] font-normal ml-3">{c.name}</span>
        </h1>
        <p className="text-muted text-[15px]">
          {c.group} · {c.ubiquity}
        </p>

        {c.since ? (
          <p className="text-[15px] leading-relaxed">
            <b className="text-ink">最早可证 {c.since}</b>
            <span className="text-muted">
              {" "}—— 「{c.since_quote}」
              {src && (
                <>
                  {" "}
                  <a href={src.url} target="_blank" rel="noreferrer" className="underline hover:text-ink">
                    {src.name}
                  </a>
                </>
              )}
            </span>
            <span className="block text-muted text-[13px] mt-1">
              这是<b className="text-ink">我们手上的日志能证明的最早时间</b>，不是业界首次出现 ——
              可追溯窗口起于 2024-01。
            </span>
          </p>
        ) : (
          /**
           * **`since_note` 里是写了 `**` 的，得当富文本渲染。**
           * 原来直接当纯文本印，于是 `**产出的不是一张平图**` 这种星号原样出现在页面上。
           * 站上早就有 `<Rich>`（Fact.tsx），只是这一处没接 —— 补一次这一类就不会再犯，
           * 因为 verify 的「没有把 ** 原样印出来」这条现在也覆盖能力页了。
           */
          c.since_note && <Rich text={c.since_note} data-prose className="block text-muted text-[15px]" />
        )}

        {c.aliases?.length ? (
          <div className="text-[15px] leading-relaxed">
            <b className="text-ink">各家叫法</b>
            <span className="text-muted">：{c.aliases.join(" · ")}</span>
            {/* 这段自述里点名了 Kling / LTX / 角色参考 —— 它出现在**每一个**能力页上，
                包括图像、文本、声音卷的。那不是方向漏了，是我们在讲自己踩过的坑，
                所以标成 data-prose 让方向隔离扫描跳过。 */}
            <span data-prose className="block text-muted text-[13px] mt-1">
              同一件事，各家名字不同。<b className="text-ink">我们自己就因为按字面去搜而误判过</b> ——
              Kling 管角色参考叫 Element、LTX 叫 Ingredients，按 Character Reference 去找会一无所获，
              然后把「没找到」写成「官方没说」。
            </span>
          </div>
        ) : null}
      </header>

      {tracks.map((k) => (
        <section key={k}>
          <h2 className="text-[22px] font-semibold mb-3">
            {trackName(k)}：谁实现了
          </h2>
          {/* 方向必须显式传 —— `modelsOf` 不传时按轨反查方向，而 `both` 展开出来的轨
              可能在多个方向里重名（以后再加方向就会撞）。这里我们明明知道方向，就别让它猜。 */}
          {modelsOf(k, dom).map((m) => (
            <div key={m.id}>
              <Link href={modelHref(m)} className="text-[13px] text-muted underline hover:text-ink">
                {vendorName(m)}
              </Link>
              <Fact m={m.id} c={c.id} label={label(m)} />
            </div>
          ))}
        </section>
      ))}

      <footer className="border-t border-rule pt-5 text-[13px] text-muted leading-relaxed">
        数据版本 {atlas.version} · 数据截至 {atlas.generated_at} ·
        <b className="text-unknown"> 全部为机器录入</b>
      </footer>
    </main>
  );
}
