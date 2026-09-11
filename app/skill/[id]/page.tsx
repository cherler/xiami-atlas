import type { Metadata } from "next";
import Link from "next/link";
import { Rich } from "@/components/Fact";
import { atlas, cell, label, skillModels, type Model } from "@/lib/atlas";
import { capHref, modelHref } from "@/lib/slug";
import BackLink from "@/components/BackLink";

/**
 * Skill 页（方案 §10）。原话：**「Skill 必须是第一等公民。」**
 *
 * Skill 回答的是「**这件事怎么做**」，能力格回答的是「谁能做」—— 两个问题。
 *
 * ## 这一页曾经的毛病
 *
 * 六个 Skill 页长得一模一样：一排模型名、一行开源链接、几条限制。看完不知道
 * 拿什么跑，也不知道那一排模型名里哪些是**原生模型就能做**、哪些**得用它的变体**。
 * 差别是实的 —— Kling 的 Motion Control 与 Kling 3.0 在官方 API 清单里是
 * 并列的两个模型，不是同一个模型的一个开关。
 *
 * 现在这一页只答四件事，每件都落到可核验的东西上：
 * **多少家能做**（分「原生模型」/「变体」，每条附这一格的官方原话）
 * → **拿什么跑**（官方工作流 + 社区仓库带星标）
 * → **能不能自己部署**（权重链接）→ **有什么坑**。
 *
 * 「已知限制」是必填的（校验 R45）：一个没有限制的 Skill 页是在卖广告，不是在帮人。
 */
export function generateStaticParams() {
  return atlas.skills.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const s = atlas.skills.find((x) => x.id === id);
  if (!s) return {};
  const { direct, separate } = skillModels(s);
  return {
    title: `${s.zh}怎么做 —— 谁能做、拿什么跑、有什么坑`,
    description: `${s.zh}（${s.en}）：${direct.length} 家原生模型就能做，${separate.length} 家得用它的变体，${s.workflow?.length ?? 0} 个能跑起来的 workflow。含已知限制与官方来源。`,
    openGraph: { images: [{ url: `/atlas/og/capability-${s.cap ?? "t2v"}-16x9.png`, width: 1200, height: 675 }] },
  };
}

const Box = ({ t, sub, children }: { t: string; sub?: string; children: React.ReactNode }) => (
  <section className="flex flex-col gap-2">
    <h2 className="text-[13px] font-semibold tracking-[.04em] text-muted border-b border-rule pb-1.5">
      {t}
      {sub && <span className="font-normal ml-2 text-[12px]">{sub}</span>}
    </h2>
    <div className="text-[15px] leading-relaxed">{children}</div>
  </section>
);

/**
 * 一列模型。带 `capId` 时把这一格的原始 note 一起摆出来。
 *
 * **「那个变体到底叫什么」只能由数据回答，不能由我们概括。**
 * 上一版我写了一句通用解释（「先生成一条普通片子，再喂进去改一遍」），
 * 对口播对口型勉强成立，对动作复刻完全是错的 —— 动作复刻你本来就直接给驱动视频。
 * **一句话套六件事，必然有几件是编的。** 每一格的 note 里有变体的真名
 * （Kling 3.0 Motion Control / Vidu Motion Sync / Runway Act-Two /
 * LTX-2.3-22b-IC-LoRA-Motion-Track-Control），且都带来源，直接显示它。
 */
const Models = ({ ms, empty, capId }: { ms: Model[]; empty: string; capId?: string }) =>
  ms.length ? (
    <ul className="flex flex-col gap-2.5">
      {ms.map((m) => {
        const note = capId ? cell(m.id, capId).note : undefined;
        return (
          <li key={m.id}>
            <Link href={modelHref(m)} className="hover:text-yes-ink hover:underline">
              {label(m)}
              <span className="text-muted text-[12px] ml-1.5">{atlas.orgs.find((o) => o.id === m.org)?.name}</span>
            </Link>
            {note && <Rich text={note} className="block text-[11.5px] text-muted leading-snug mt-1" />}
          </li>
        );
      })}
    </ul>
  ) : (
    <p className="text-unknown text-[13px]">{empty}</p>
  );

export default async function SkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = atlas.skills.find((x) => x.id === id);
  if (!s) return <main className="p-10">没有这个 Skill。</main>;
  const cap = s.cap ? atlas.capabilities.find((c) => c.id === s.cap) : null;
  const { direct, separate } = skillModels(s);
  const wf = s.workflow ?? [];
  const official = wf.filter((w) => w.kind === "official").length;

  // 「开源自部署」这类事没有原生/变体之分 —— 分法不适用时就不硬套。
  const split = separate.length > 0;

  /** 首屏几个数字。全是从数据算出来的，不是形容词 —— 「删字测试」里这一行删不掉。 */
  const stats: { n: number; t: string; hint: string }[] = [
    split
      ? { n: direct.length, t: "家原生模型就能做", hint: "用的就是这个模型本身" }
      : { n: direct.length, t: "家能做这件事", hint: "厂商官方文档写明支持" },
    ...(split
      ? [{ n: separate.length, t: "家得用它的变体", hint: "厂商为这件事单出了一个变体模型" }]
      : []),
    { n: s.opensource?.length ?? 0, t: "处权重可自部署", hint: "自己的 GPU 上跑，不受平台限制" },
    { n: wf.length, t: "个能跑起来的 workflow", hint: `其中官方 ${official} 个` },
  ];

  return (
    <main className="max-w-[900px] mx-auto px-5 pt-5 pb-10 flex flex-col gap-7">
      <BackLink />

      <header className="flex flex-col gap-1 border-b-[2.5px] border-ink pb-3">
        <h1 className="text-[32px] font-bold leading-tight tracking-[-.01em]">{s.zh}</h1>
        <p className="text-muted text-[14px]">
          {s.en}
          {cap?.aliases?.length ? ` · 各家还叫它：${cap.aliases.slice(0, 5).join(" / ")}` : ""}
        </p>
      </header>

      {/* §10 的首屏就是输入 → 输出。**先让人看懂这件事长什么样**，再谈谁能做。 */}
      {s.io && (
        <div className="border border-rule rounded-xl bg-card p-4 flex flex-wrap items-center justify-center gap-3 text-[15px]">
          {s.io.in.map((x, i) => (
            <span key={x} className="flex items-center gap-3">
              {i > 0 && <span className="text-muted">+</span>}
              <span className="border border-rule px-3.5 py-2 bg-paper">{x}</span>
            </span>
          ))}
          <span className="text-muted text-[18px]">→</span>
          <span className="border border-yes px-3.5 py-2 text-yes-ink font-medium">{s.io.out}</span>
        </div>
      )}

      <div
        className={`grid grid-cols-2 border-t border-l border-rule ${
          stats.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"
        }`}
      >
        {stats.map((x) => (
          <div key={x.t} className="border-r border-b border-rule px-3.5 py-3">
            <div className="text-[27px] leading-none font-bold tabular-nums">{x.n}</div>
            <div className="text-[12.5px] mt-1.5">{x.t}</div>
            <div className="text-[11px] text-muted leading-snug mt-0.5">{x.hint}</div>
          </div>
        ))}
      </div>

      {/* 原生模型 / 变体。support[].via 里一直存着、却从没画出来的那个区别。 */}
      <Box t="谁能做" sub={split ? "同一件事，有的家原生模型就能做，有的家要用它的变体" : undefined}>
        {split ? (
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <p className="text-[13px] text-yes-ink font-medium">✅ 原生模型就能做</p>
              <p className="text-[11.5px] text-muted mb-2.5 leading-snug">用的就是这个模型本身</p>
              <Models ms={direct} empty="还没有原生模型做到" capId={s.cap} />
            </div>
            <div>
              <p className="text-[13px] text-muted font-medium">↺ 得用它的变体</p>
              <p className="text-[11.5px] text-muted mb-2.5 leading-snug">
                厂商为这件事单出了一个变体模型，和主力模型在官方清单里是并列的两个
              </p>
              <Models ms={separate} empty="没有" capId={s.cap} />
            </div>
          </div>
        ) : (
          <div className="columns-2 md:columns-3">
            <Models ms={direct} empty="还没有模型有明确的官方依据" />
          </div>
        )}
      </Box>

      {/* **拿什么跑**（方案 §10 明确要求的一栏）：能直接跑起来的 workflow / 官方插件。
          原来这一页只说「谁能做」，不说「用什么跑」—— 那是把最实用的一半略掉了。 */}
      {!!wf.length && (
        <Box t="拿什么跑" sub="官方工作流优先；社区仓库标星标，星标是它有没有人真在用的唯一硬指标">
          <ol className="flex flex-col">
            {wf.map((w) => (
              <li key={w.url} className="flex gap-3 py-2 border-b border-rule last:border-0">
                <span
                  className={`shrink-0 text-[11px] px-1.5 py-0.5 h-fit ${
                    w.kind === "official" ? "bg-yes text-paper" : "bg-rule text-muted"
                  }`}
                >
                  {w.kind === "official" ? "官方" : "社区"}
                </span>
                <span className="flex flex-col gap-0.5 min-w-0">
                  <a href={w.url} target="_blank" rel="noreferrer" className="font-medium underline hover:text-yes-ink">
                    {w.name} →
                  </a>
                  <span className="text-muted text-[12px] leading-snug">{w.quote}</span>
                </span>
              </li>
            ))}
          </ol>
        </Box>
      )}

      {!!s.opensource?.length && (
        <Box t="自己部署" sub="权重公开的，拿去自己 GPU 上跑">
          <div className="flex flex-col gap-1.5">
            {s.opensource.map((o) => (
              <p key={o.name} className="flex flex-wrap items-baseline gap-x-2">
                <a href={o.url} target="_blank" rel="noreferrer" className="underline hover:text-yes-ink">
                  {o.name}
                </a>
                <span className="text-muted text-[12px]">
                  {o.quote} · {atlas.sources[o.src]?.name}
                </span>
              </p>
            ))}
          </div>
        </Box>
      )}

      {!!s.platform_feature?.length && (
        <Box t="平台上的成品功能" sub="不用自己搭，平台已经封成一个按钮">
          {s.platform_feature.map((f) => (
            <p key={f.p}>
              {atlas.platforms.find((x) => x.id === f.p)?.name} · {f.name}
              <span className="text-muted text-[12px] ml-2">原文：「{f.quote}」</span>
            </p>
          ))}
        </Box>
      )}

      {/* **这一栏是这一页最值钱的部分。** 厂商不会写自己做不好什么。 */}
      <section className="border border-unknown/40 bg-unknown/6 p-4 flex flex-col gap-1.5">
        <h2 className="text-[13px] font-semibold tracking-[.04em]">已知限制</h2>
        {s.limits?.map((l, i) => (
          <Rich key={i} text={`· ${l}`} className="text-[14.5px] leading-relaxed" />
        ))}
      </section>

      {!!s.cases?.length && (
        <Box t="典型用例">
          <p className="text-muted">{s.cases.join(" · ")}</p>
        </Box>
      )}

      <footer className="border-t border-rule pt-4 flex flex-wrap gap-3 text-[14px]">
        {cap && (
          <Link href={capHref(cap)} className="underline hover:text-yes-ink">
            这一项谁支持 →
          </Link>
        )}
        <Link href="/caveats" className="underline hover:text-yes-ink">
          下单前先看这几条 →
        </Link>
        <span className="text-muted ml-auto">核验于 {s.verified_at}</span>
      </footer>
    </main>
  );
}
