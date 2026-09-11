import type { Metadata } from "next";
import Link from "next/link";
import { Fact, MARK, TONE } from "@/components/Fact";
import Mark from "@/components/Mark";
import { atlas, capsOf, cell, label, modelsOf, orgOf, STATUS } from "@/lib/atlas";
import { modelHref } from "@/lib/slug";
import BackLink from "@/components/BackLink";

/**
 * 对比台（§14 + §19）。URL 稳定可分享：`/compare/kling-vs-seedance`。
 *
 * 负责人拍板的三条口径，都钉在这一页上：
 *  · 效果**我们不打分**，只转述并标明是谁说的
 *  · 价格**只列原始单价，不换算、不合计**，币种原样标注
 *  · 同一模型多平台**并排列出，不合并** —— 不指定平台，「多少钱」就没有答案
 */
const CORE = () => atlas.models.filter((m) => (m.tier ?? "core") === "core");

/**
 * **两种顺序都生成。** 只生成一种的话，`/compare/kling-vs-seedance` 就不存在，
 * 静态站会兜底到首页 —— 返回 200、渲染首页、外加一个 hydration 报错。
 * 这个坑刚踩过：我在 flows.json 里写的顺序和生成的顺序正好相反。
 * **用户不会记得我们按什么顺序排的模型。**
 */
export function generateStaticParams() {
  const ms = CORE();
  const out: { pair: string }[] = [];
  for (const x of ms)
    for (const y of ms)
      if (x.id !== y.id && x.class === y.class) out.push({ pair: `${x.id}-vs-${y.id}` });
  return out;
}

const parse = (pair: string) => {
  const [a, b] = pair.split("-vs-");
  return [atlas.models.find((m) => m.id === a), atlas.models.find((m) => m.id === b)] as const;
};

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const { pair } = await params;
  const [a, b] = parse(pair);
  if (!a || !b) return {};
  return {
    title: `${label(a)} 还是 ${label(b)}？逐项对比`,
    // **描述要跟着表走。** 价格与折扣已封存、只有视频卷有，
    // 描述里却一直写着「价格、折扣」—— 对图像和文本两卷是在承诺表里没有的东西。
    description: `能力、效果、上架平台、大陆可达性放在同一张表里。每一格带厂商官方来源。`,
    openGraph: { images: [{ url: `/atlas/og/model-${a.id}-16x9.png`, width: 1200, height: 675 }] },
  };
}

const SYM: Record<string, string> = { USD: "$", CNY: "¥" };

export default async function ComparePage({ params }: { params: Promise<{ pair: string }> }) {
  const { pair } = await params;
  const [a, b] = parse(pair);
  if (!a || !b) return <main className="p-10">没有这两个模型。</main>;
  const caps = capsOf(a.class);

  const priceOf = (id: string) => atlas.pricing.filter((q) => q.m === id);
  const availOf = (id: string) => atlas.availability.filter((v) => v.m === id);
  const effectOf = (id: string) => atlas.effect.filter((e) => e.m === id);
  const discOf = (id: string) => atlas.discount.filter((d) => d.m === id);

  const Row = ({ t, l, r }: { t: string; l: React.ReactNode; r: React.ReactNode }) => (
    <tr className="border-b border-rule/60 align-top">
      <th className="text-left py-2.5 pr-4 font-medium text-muted text-[13px] w-[110px]">{t}</th>
      <td className="py-2.5 pr-4 text-[14px]">{l}</td>
      <td className="py-2.5 text-[14px]">{r}</td>
    </tr>
  );

  const Price = ({ id }: { id: string }) => {
    const qs = priceOf(id);
    if (!qs.length) return <span className="text-unknown">这一类已封存，没有采</span>;
    return (
      <div className="flex flex-col gap-1.5">
        {/* 封存的数据必须自己说出来 —— 读者没义务去猜哪一栏还在维护 */}
        <span className="text-[11.5px] text-unknown">
          一次性快照，不再维护（价格实时变动，无法自动核验）
        </span>
        {qs.map((q) => (
          <div key={q.p}>
            <span className="text-muted text-[12px]">
              {atlas.platforms.find((x) => x.id === q.p)?.name ?? q.p}
            </span>
            <br />
            {q.tiers?.length ? q.tiers.map((t) => (
              <span key={t.label} className="mr-3">
                <span className="text-muted text-[12px]">{t.label}</span>{" "}
                <b className="tabular-nums">{q.currency ? `${SYM[q.currency] ?? ""}${t.v}` : t.v}</b>
                {q.unit === "per-second" && <span className="text-muted text-[12px]">/秒</span>}
              </span>
            )) : <span className="text-unknown">—</span>}
          </div>
        ))}
      </div>
    );
  };

  const Effect = ({ id }: { id: string }) => {
    const es = effectOf(id);
    if (!es.length) return <span className="text-unknown">还没采</span>;
    return (
      <div className="flex flex-col gap-1">
        {es.map((e, i) => (
          <span key={i}>
            <b>{e.value}</b>
            <span className="text-muted text-[12px] ml-1.5">
              {e.kind === "vendor-claim" ? "厂商自己说的" : e.who}
            </span>
          </span>
        ))}
      </div>
    );
  };

  const Where = ({ id }: { id: string }) => {
    const vs = availOf(id);
    if (!vs.length) return <span className="text-unknown">没找到上架记录</span>;
    return (
      <div className="flex flex-col gap-0.5">
        {vs.map((v) => (
          <span key={v.p} className="text-[13px]">
            {atlas.platforms.find((x) => x.id === v.p)?.name}
            <span className="text-muted"> · {v.listed}</span>
            {v.match === "older" && <b className="text-unknown"> ⚠️ 旧版本</b>}
            {v.status === "coming-soon" && <span className="text-muted"> · 还不能用</span>}
          </span>
        ))}
      </div>
    );
  };

  const Disc = ({ id }: { id: string }) => {
    const ds = discOf(id);
    if (!ds.length) return <span className="text-muted">—</span>;
    return <>{ds.map((d, i) => <span key={i}>{d.rule} {d.off}</span>)}</>;
  };

  return (
    <main className="max-w-[1000px] mx-auto px-5 pt-5 pb-8 flex flex-col gap-6">
      <BackLink />
      <h1 className="text-[28px] font-semibold leading-tight">
        {label(a)} 还是 {label(b)}？
      </h1>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[560px]">
          <thead>
            <tr className="border-b-2 border-rule">
              <th />
              {[a, b].map((m) => (
                <th key={m.id} className="text-left py-2 pr-4">
                  <Link href={modelHref(m)} className="text-[17px] font-semibold underline hover:text-yes">
                    {label(m)}
                  </Link>
                  {m.status && m.status !== "active" && (
                    <span className={`block text-[12px] ${STATUS[m.status]?.cls ?? "text-muted"}`}>{STATUS[m.status]?.tag ?? m.status}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row t="公司 / 发布"
              l={<>{orgOf(a)?.zh}<span className="text-muted"> · {a.version_as_of}</span></>}
              r={<>{orgOf(b)?.zh}<span className="text-muted"> · {b.version_as_of}</span></>} />
            <Row t="效果" l={<Effect id={a.id} />} r={<Effect id={b.id} />} />
            {/**
              * **价格与折扣这两栏，两边都没有就整行不出。**
              *
              * 这一类已封存不再采（ontology 规则十），只有视频卷留着当年的快照。
              * 图像和文本两卷永远是空的 —— 留着一行「没有采」，
              * 读者会以为是我们漏了，而事实是**我们决定不做**。
              * 空栏不该占地方；真要解释「为什么没有」，那是 /method 的活。
              */}
            {(priceOf(a.id).length || priceOf(b.id).length) ? (
              <Row t="价格" l={<Price id={a.id} />} r={<Price id={b.id} />} />
            ) : null}
            {(discOf(a.id).length || discOf(b.id).length) ? (
              <Row t="折扣" l={<Disc id={a.id} />} r={<Disc id={b.id} />} />
            ) : null}
            <Row t="去哪用" l={<Where id={a.id} />} r={<Where id={b.id} />} />
            <Row t="大陆直连"
              l={a.reach_cn === "blocked" ? <b className="text-no">不通</b> : a.reach_cn === "ok" ? "通" : "没测"}
              r={b.reach_cn === "blocked" ? <b className="text-no">不通</b> : b.reach_cn === "ok" ? "通" : "没测"} />
            {caps.map((c) => {
              const fa = cell(a.id, c.id), fb = cell(b.id, c.id);
              const same = fa.state === fb.state;
              return (
                <tr key={c.id} className={`border-b border-rule/60 ${same ? "opacity-55" : ""}`}>
                  <th className="text-left py-1.5 pr-4 font-medium text-[13px] text-muted">{c.zh}</th>
                  {[fa, fb].map((f, i) => (
                    <td key={i} className={`py-1.5 pr-4 text-[14px] ${TONE[f.state]}`}>
                      <Mark state={f.state} />
                      {f.via === "separate-task" && <span className="text-unknown text-[11px] align-super">*</span>}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-muted text-[13px]">
        相同的行已淡化，<b className="text-ink">留下的差异才是要看的</b>。
        <Link href="/method#pricing" className="underline ml-2 hover:text-ink">价格口径 →</Link>
      </p>

      <section>
        <p className="text-muted text-[13px] mb-2">换一组比</p>
        <div className="flex flex-wrap gap-2">
          {modelsOf(a.class).filter((m) => m.id !== a.id && m.id !== b.id).slice(0, 6).map((m) => (
            <Link key={m.id} href={`/compare/${a.id}-vs-${m.id}`}
              className="text-[13px] px-2.5 py-1 rounded border border-rule hover:border-yes hover:text-yes">
              {label(a)} vs {label(m)}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
