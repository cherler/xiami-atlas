import type { Metadata } from "next";
import Link from "next/link";
import { claims, CLAIM_ZH, type Claim } from "@/lib/claims";
import { topicProjectHref } from "@/lib/slug";
import BackLink from "@/components/BackLink";
import { Rich } from "@/components/Fact";

/**
 * 「自述与实测」—— **项目说的，和用的人撞到的，对不对得上。**
 *
 * ## 这一页存在的理由
 *
 * 两个专项一百多张卡里，最有信息量的从来不是「有什么」，是**「什么是假的」**：
 * 星速全场最高的项目，它自己的 issue 区在追问「有人真做出来过吗」；
 * README 写着「支持被打断」，issue 里写「最快三秒，没法用」。
 *
 * 这些结论**别处查不到**（要同时读完 README、文档、DeepWiki、issue 才拼得出来），
 * 但它们散在几十张卡片的「局限」里。一个只想问「我该当心什么」的人，
 * 得把一百多张卡翻一遍才凑得齐 —— **等于没有。**
 *
 * ## 排版按「能不能算出来」分，不按项目分
 *
 * 许可证那几类全部现算（见 lib/claims.ts）：作者哪天补了 LICENSE，那条自己消失。
 * 只有「自述与实测打架」是手写的 —— 它是两段文字的矛盾，算不出来，
 * 所以每条都必须摆出两侧原文与出处。**没有出处的不收。**
 */
export const metadata: Metadata = {
  title: "自述与实测 —— 项目说的，和用的人撞到的",
  description:
    "README 说支持被打断，issue 说最快三秒；星速第一的项目社区在问「有人真做出来过吗」；挂着开源名头却没有许可证文件。每条带两侧出处。",
};

/** 「说的」和「撞到的」并排，中间一道竖线 —— **两侧要一眼看出是对着的**。 */
function Row({ c }: { c: Claim }) {
  return (
    <article data-count-item className="border border-rule rounded-xl px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-baseline gap-2.5 flex-wrap mb-2">
        <h3 className="text-[16px] tracking-tight">
          <Link href={topicProjectHref(c.topicId, c.projectId)} className="hover:text-yes-ink">
            {c.project}
          </Link>
        </h3>
        <span className="text-[11px] text-hatch">{c.topic}</span>
      </div>
      <p className="text-[13.5px] leading-relaxed mb-3 max-w-[84ch]">
        <Rich text={c.what} />
      </p>
      {(c.said || c.hit) && (
        /* 手机上竖排 —— 两列挤在 390px 里谁也读不了。 */
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3 border-t border-rule pt-3">
          {c.said && (
            <div>
              <div className="text-[11px] text-hatch tracking-wider mb-1">它自己说</div>
              <p className="text-[12.5px] text-muted leading-relaxed"><Rich text={c.said} /></p>
            </div>
          )}
          {c.hit && (
            <div className="sm:border-l sm:border-rule sm:pl-6">
              <div className="text-[11px] text-no tracking-wider mb-1">实际撞到的</div>
              <p className="text-[12.5px] leading-relaxed"><Rich text={c.hit} /></p>
            </div>
          )}
        </div>
      )}
      {!!c.src?.length && (
        <div className="mt-3 pt-2.5 border-t border-rule flex flex-wrap gap-x-4 gap-y-1">
          {c.src.map((s) => (
            /* 站外链接用原生 a（basePath 不该加），并按站里的规矩开新标签。 */
            <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
              className="text-[12px] text-muted underline hover:text-yes-ink">
              {s.title} ↗
            </a>
          ))}
        </div>
      )}
    </article>
  );
}

export default function ClaimsPage() {
  const all = claims();
  const kinds = (Object.keys(CLAIM_ZH) as Claim["kind"][]).filter((k) => all.some((c) => c.kind === k));
  const CN = ["一", "二", "三", "四", "五", "六"];

  return (
    <main className="max-w-[1000px] mx-auto px-5 pt-5 pb-16">
      <BackLink href="/" zh="首页" />

      <header className="pt-10 pb-7">
        <div className="text-[12px] tracking-[0.16em] text-yes-ink font-bold mb-2.5">交叉核对</div>
        <h1 className="text-[34px] sm:text-[40px] leading-[1.14] tracking-tight mb-4">自述与实测</h1>
        <p className="text-[14px] leading-relaxed max-w-[84ch] text-muted">
          <Rich text={
            "**项目说的，和用的人撞到的，不总是一回事。** " +
            "这一页把两个专项里对不上的地方收在一起 —— " +
            "许可证那几类是从数据现算的，**作者哪天补上文件，那条自己就消失**；" +
            "「自述与实测打架」算不出来，所以每条都摆出两侧原文与出处。"
          } />
        </p>
        <p className="text-[12px] text-hatch mt-3 tnum">
          {all.length} 条 · 现算 {all.filter((c) => c.kind !== "said-vs-hit").length} 条 ·
          手写并附出处 {all.filter((c) => c.kind === "said-vs-hit").length} 条
        </p>
      </header>

      <nav className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 border-y border-rule py-2.5 mb-8">
        <span className="text-[11px] text-hatch tracking-wider">跳到</span>
        {kinds.map((k) => (
          <a key={k} href={`#k-${k}`} className="text-[12px] text-muted hover:text-yes-ink whitespace-nowrap">
            {CLAIM_ZH[k].zh}
            <span className="text-hatch tnum ml-1">{all.filter((c) => c.kind === k).length}</span>
          </a>
        ))}
      </nav>

      <div className="space-y-12">
        {kinds.map((k, i) => (
          <section key={k} id={`k-${k}`} className="scroll-mt-28">
            <div className="border-b border-rule pb-2.5 mb-4">
              <div className="flex items-baseline gap-3">
                <span className="text-[13px] text-hatch">{CN[i]}</span>
                <h2 className="text-[19px] tracking-tight">{CLAIM_ZH[k].zh}</h2>
                <span className="text-[11px] text-hatch tnum">{all.filter((c) => c.kind === k).length} 条</span>
              </div>
              <p className="text-[12.5px] text-muted leading-relaxed max-w-[84ch] mt-1.5">
                <Rich text={CLAIM_ZH[k].why} />
              </p>
            </div>
            <div className="space-y-3">
              {all.filter((c) => c.kind === k).map((c) => <Row key={`${c.projectId}-${c.what.slice(0, 12)}`} c={c} />)}
            </div>
          </section>
        ))}
      </div>

      <div className="border-t border-rule pt-5 mt-12 text-[12px] text-muted max-w-[84ch]">
        <p>
          <Rich text={
            "**这一页不是在挑刺。** 收进这两个专项的项目都是我们认为值得看的 —— " +
            "正因为值得看，才要把「它没说的那一半」摆出来。" +
            "许可证与停更是硬事实，从数据现算；自述与实测的矛盾是判断，每条都带得出两侧原文。"
          } />
        </p>
      </div>
    </main>
  );
}
