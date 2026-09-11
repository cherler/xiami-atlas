import type { Metadata } from "next";
import Mark, { Dot } from "@/components/Mark";
import Link from "next/link";
import { atlas } from "@/lib/atlas";
import BackLink from "@/components/BackLink";

/**
 * 方法与口径。**这一页是其余所有页面的旁白收容所。**
 *
 * 之前每个版块都自带一段「⬜ 不是没查是查了找不到」「🔴 的门槛是读过整页」
 * 「价格根本不可比」——纪律没错，但那是**我们的话**，重复七遍堵在用户和信息中间。
 *
 * 规矩：别处只留一个角标链到这里，正文里不再解释自己。
 */
export const metadata: Metadata = {
  title: "方法与口径 —— 这些数据是怎么来的",
  description: "⬜ 是什么意思、来源怎么分级、价格为什么不换算、哪些是机器录入的、怎么报错。",
};

const CN = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

// 层级要一眼看得出：粗顶线分节 + 大号中文序号。原来 8 个 h2 一样大，滚动时分不清
// 到了第几节。序号用青绿，和正文拉开。
// `t` 收 ReactNode 而不是 string —— 标题里要放画出来的三态标记，不再是纯文字
const S = ({ id, n, t, children }: { id: string; n: number; t: React.ReactNode; children: React.ReactNode }) => (
  <section id={id} className="border-t-[2.5px] border-ink pt-4 scroll-mt-6">
    <h2 className="text-[23px] font-bold leading-tight flex items-baseline gap-3">
      <span className="text-[18px] text-yes-ink font-bold shrink-0">{CN[n - 1]}</span>
      {t}
    </h2>
    <div className="text-[15px] leading-[1.75] flex flex-col gap-2 max-w-[760px] mt-3">{children}</div>
  </section>
);

export default function Method() {
  const src = Object.values(atlas.sources);
  const off = src.filter((s) => s.tier === "official").length;

  return (
    <main className="max-w-[880px] mx-auto px-5 pt-5 pb-10 flex flex-col gap-9">
      <header className="flex flex-col gap-2">
        <BackLink />
        <h1 className="text-[30px] font-semibold leading-tight">这些数据是怎么来的</h1>
        <p className="text-muted text-[15px] leading-relaxed">
          数据 {atlas.version} · 能力格数据截至 {atlas.generated_at} · 共 {src.length} 条来源，其中官方 {off} 条。
        </p>
      </header>

      <S id="states" n={1} t={<span className="inline-flex items-center gap-1.5"><Mark state="yes" /><Mark state="no" /><Mark state="unknown" /> 三种状态</span>}>
        <p><b><Mark state="yes" /></b> 厂商官方文档明确写了支持，并且我们摘得出那句原文。</p>
        <p><b><Mark state="no" /></b> 厂商官方明确写了不支持。这一档比 <Mark state="yes" /> 少见得多 —— 没人爱写自己不能做什么。</p>
        <p>
          <b><Mark state="unknown" /> 是「官方没说」，不是「不支持」。</b>
          我们查了公开渠道，没找到明确说法，就记 <Mark state="unknown" />。它可能支持只是没写，也可能确实不支持。
        </p>
        <p className="text-muted">
          <Mark state="unknown" /> 的分布比总数有用得多：万相 10/11 项没说，Vidu 只有 1 项。
          <b className="text-ink">总数告诉你「有多少不确定」，分布告诉你「哪家不爱写文档」。</b>
        </p>
      </S>

      <S id="aliases" n={2} t="为什么要收各家的叫法">
        <p>
          同一件事，Kling 叫 Element、LTX 叫 Ingredients、有人叫 Omni Reference、有人叫 cameo ——
          它们都是<b>角色参考</b>。
        </p>
        <p>
          我们吃过亏：用自己的词去九家文档站搜，搜不到就记成了不支持。
          重核前两家共 22 格，<b>8 格是错的，其中 5 格是这么来的假阴性</b>。
          所以每项能力都带一整组别名，搜索也认全部别名。
        </p>
      </S>

      <S id="transparency" n={3} t={<span className="inline-flex items-center gap-1">平台透明度：<Dot tone="unknown" /> 和 <Dot tone="no" /> 是两回事</span>}>
        <p><b><Dot tone="yes" /></b> 读到了页面，它点名了底层模型（必须有原文）。</p>
        <p><b><Dot tone="no" /></b> <b className="text-ink">读完了整页，它确实没提。</b>这一档的门槛是「读过」。</p>
        <p>
          <b><Dot tone="unknown" /> 我们没看到</b> —— 采集器没拿到页面（限流、超时、站点打不开）。
          <b className="text-ink">这一格空着是我们的缺口，不是它在藏。</b>
        </p>
        <p className="text-muted">
          目前 <Dot tone="no" /> 是 0 家 —— 我们怀疑的那几家，恰好就是读不到的那几家。
        </p>
      </S>

      <S id="pricing" n={4} t="价格为什么不换算、不合计">
        <p>
          七家有七种计价方式：按秒标美元、按秒标人民币、按点数扣、只卖订阅、官方页上查不到。
          <b>把它们并成一列「每秒多少钱」，那一列一定是编的。</b>
        </p>
        <p>
          人民币和美元也不换算 —— <b>汇率是我们加的假设，不是厂商说的</b>。
        </p>
        <p>
          同一个模型在不同平台不是一个价：万相在百炼 720P ¥0.6/秒，在 Replicate 720P $0.25/秒，
          而且 Replicate 卖的还是 2.1。<b className="text-ink">「多少钱」这个问题，不指定平台就没有答案。</b>
        </p>
      </S>

      <S id="genealogy" n={5} t="演化树怎么读">
        <p>横轴是厂商自己发布的日期。实心大点是一条线的起点（底座或换代），空心小点是从它长出来的变体。</p>
        <p>
          <b>分叉是真的</b>：Wan2.1 这个底座上同时长出 FLF2V（首尾帧）和 VACE（统一编辑）两个模型。
        </p>
        {/* 写死的名单会过期 —— 这句话上一版就已经错了（列的四家其实都补齐了）。算出来。 */}
        <p>
          <b className="text-ink">孤点有两种成因，我们把它们分开写。</b>
          {(() => {
            const thin = atlas.models.filter(
              (m) => m.class === "clip" && (m.tier ?? "core") === "core"
                && atlas.versions.filter((v) => v.m === m.id).length < 3,
            );
            return thin.length
              ? <> 目前节点不足三个的是 {thin.map((m) => m.family).join("、")} —— 点开节点能看到具体原因。</>
              : <> 目前每个核心模型都有三个以上节点。</>;
          })()}
        </p>
        <p className="text-muted">
          节点上的能力标记只在<b className="text-ink">明确对得上</b>时才挂 ——
          Wan 的 S2V 是「语音驱动」，不等于「对口型」，两件事不合并。
        </p>
      </S>

      <S id="sources" n={6} t="来源怎么分级">
        <p><b>官方</b>：厂商自己的文档、更新日志、价格页、官方 Hugging Face 组织。</p>
        <p><b>第三方</b>：评测站、聚合平台、媒体。只用来交叉校验，不当唯一依据。</p>
        <p>
          <b>「支持」这一档必须有来源。</b>没有来源的「支持」就是猜的，校验会直接拦下。
        </p>
      </S>

      <S id="agent" n={7} t="哪些是机器录入的">
        <p>
          绝大部分格子由 Agent 从官方页面抽取，页面上标着「机器录入」。
          Agent <b>只补空白格，从不覆盖已经核过的结论</b> —— 覆盖必须人工。
        </p>
        <p>
          每次自动写入都是一次带 <code>atlas-triage[bot]</code> 署名的提交，
          <b className="text-ink">审核就是看那次改动，回滚就是撤销它</b>。
        </p>
        <p className="text-muted">
          我们主动用「不那么精准」换了维护成本。
          <b className="text-ink">那笔交易的另一半是可纠错</b> —— 每条事实旁边都有报错入口。
        </p>
      </S>

      <S id="gaps" n={8} t="我们自己没做到的">
        <p>· {atlas.orgs.filter((o) => !o.hq_src).length} 家公司的总部还没有来源，是按常识填的。</p>
        <p>· 有来源的那几家里，ICP 备案<b>只证到省</b>，没证到城市。</p>
        <p>· {atlas.platforms.filter((p) => p.discloses === "blocked").length} 个平台的页面我们读不到。</p>
        <p>
          · 4 个模型没拿到官方价格，各有各的原因：
          <b>LTX</b> 权重公开但 Lightricks 没有自营定价页；
          <b>Lucy</b> 官网未见价目；
          <b>Sora</b> 的定价页对我们的采集器返回 403，且 API 已公告 2026-09-24 停服。
          <b className="text-ink">「空着」和「我们查了查不到」是两回事。</b>
        </p>
        <p>
          · <b>SkyReels V4 已经存在，我们库里最新只到 V3</b> —— 从第三方榜单上看见的，
          <b className="text-ink">这是我们的采集缺口，不是它的问题</b>。
        </p>
        <p>· 投资关系只录了 {atlas.investments.length} 条。</p>
      </S>
    </main>
  );
}
