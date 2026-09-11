"use client";

import Link from "next/link";
import { atlas, capsOf, cell, label, modelsOf, transparency, vendorName , type Klass} from "@/lib/atlas";
import { capHref, modelHref } from "@/lib/slug";
import { MARK, TONE } from "./Fact";
import Mark from "./Mark";

/**
 * 移动端叙事版（方案 §12）。
 *
 * §12 是硬要求：**移动端不是桌面端缩小。**
 * 二部图在手机上不可用 —— 九个模型 × 九项能力的连线，缩到 390 宽只剩一团毛，
 * 而且它靠的是「点一个节点、看它连去哪」，手指点不准 20px 的圆点。
 *
 * 所以换成 Narrative Stack：**一屏回答一个问题，往下滑是下一个问题。**
 *   1. 现在有哪些模型 → 一张卡一个，带最要紧的一句
 *   2. 每项能力谁支持 → 折叠列表，展开看名字
 *   3. 谁最不透明 → 条形
 *
 * 桌面端那些「点两个模型比一比」的交互不往这儿搬 ——
 * **在手机上做对比是错的场景**，人在手机上是「刷着看」，不是「坐下来查」。
 * 要比就点进模型页。
 */
/**
 * 手机端的叙事版。**轨从外面传进来，别写死。**
 *
 * 原来硬编码 `"clip"` —— 于是 /atlas/image 在手机上**整页没有表**：
 * 桌面表是 `hidden md:block`，手机靠这个组件兜底，而它只会画视频那一轨。
 * 出站验证的桌面端全绿、手机端才报出来 —— **一个视口测不出另一个视口的事**。
 */
export default function MobileStack({ k = "clip" }: { k?: Klass }) {
  const models = modelsOf(k);
  const caps = capsOf(k).filter((c) => c.ubiquity !== "已普及");

  return (
    <div className="flex flex-col gap-8 md:hidden">
      <section className="flex flex-col gap-3">
        <h2 className="text-[20px] font-semibold">现在有这些</h2>
        <p className="text-muted text-[13px] leading-relaxed">
          {models.length} 个模型，按当前版本日期排。<b className="text-ink">越靠前越新。</b>
        </p>
        {models.map((m) => {
          const yes = caps.filter((c) => cell(m.id, c.id).state === "yes").length;
          const st = m.status && m.status !== "active";
          return (
            <Link
              key={m.id}
              href={modelHref(m)}
              className="border border-rule rounded-lg p-3 bg-card flex flex-col gap-1"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className={`font-semibold text-[17px] ${st ? "text-muted line-through" : ""}`}>{label(m)}</span>
                <span className="text-muted text-[12px] shrink-0">{m.version_as_of}</span>
              </div>
              <div className="text-muted text-[12px]">
                {vendorName(m)} · {caps.length} 项里支持 {yes} 项
                {m.reach_cn === "blocked" && <b className="text-no"> · 大陆直连不通</b>}
              </div>
            </Link>
          );
        })}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[20px] font-semibold">每项能力，谁做到了</h2>
        <p className="text-muted text-[13px] leading-relaxed">
          点开看名字。<b className="text-ink"><Mark state="unknown" /> 是「官方没说」，不是「不支持」</b> —— 两回事。
        </p>
        {caps.map((c) => {
          const yes = models.filter((m) => cell(m.id, c.id).state === "yes");
          const unk = models.filter((m) => cell(m.id, c.id).state === "unknown");
          return (
            <details key={c.id} className="border border-rule rounded-lg bg-card">
              <summary className="p-3 cursor-pointer flex items-baseline justify-between gap-2">
                <span className="font-medium text-[16px]">{c.zh}</span>
                <span className="text-[13px] shrink-0">
                  <b className="text-yes">{yes.length}</b>
                  <span className="text-muted"> / {models.length}</span>
                  {unk.length > 0 && <span className="text-unknown"> · {unk.length} 没说</span>}
                </span>
              </summary>
              <div className="px-3 pb-3 flex flex-col gap-2 text-[14px]">
                {c.since && (
                  <p className="text-muted text-[12px]">
                    最早可证 {c.since} —— 「{c.since_quote}」
                  </p>
                )}
                <p className="flex flex-wrap gap-x-3 gap-y-1">
                  {models.map((m) => {
                    const f = cell(m.id, c.id);
                    return (
                      <Link key={m.id} href={modelHref(m)} className={TONE[f.state]}>
                        <Mark state={f.state} /> {label(m)}
                      </Link>
                    );
                  })}
                </p>
                <Link href={capHref(c)} className="text-muted text-[12px] underline">
                  打开这一项的独立页面 →
                </Link>
              </div>
            </details>
          );
        })}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[20px] font-semibold">谁最不透明</h2>
        <p className="text-muted text-[13px] leading-relaxed">
          九家都用厂商官方文档逐格核过之后，<b className="text-ink">剩下的 <Mark state="unknown" /> 就是这家没公开说的部分</b>。
          别看总数，看分布。
        </p>
        {transparency("clip").map(({ model, unknown, caps: n }) => (
          <div key={model.id} className="flex items-center gap-2 text-[13px]">
            <span className="w-[128px] shrink-0 truncate">{label(model)}</span>
            <span className="w-[38px] shrink-0 text-right text-muted tabular-nums">
              {unknown}/{n}
            </span>
            <span className="flex-1 h-[12px] bg-rule/50 rounded-sm overflow-hidden">
              <span className="block h-full bg-unknown/80" style={{ width: `${(unknown / n) * 100}%` }} />
            </span>
          </div>
        ))}
      </section>
    </div>
  );
}
