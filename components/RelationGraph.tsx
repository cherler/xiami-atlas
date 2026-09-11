"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { atlas, capsOf, cell, label, modelsOf, orgOf , domainModels} from "@/lib/atlas";
import { capHref, modelHref } from "@/lib/slug";

/**
 * 关系图：**公司 → 模型 → 能力**，外加投资边。
 *
 * ## 为什么是这个形状
 *
 * 方案 §59.1 原话：**「模型之间不靠出身相连，靠能做什么相连。」**
 * `公司→团队→模型` 那棵树画不出 Kling 和 Seedance 的关系 —— 它们分属快手与字节，
 * 在组织维度上永远是两座孤岛。**要它们相连，枢纽必须是能力。**
 *
 * 上一版 /map 我做成了「公司列表 + 产品线条形 + 能力平铺」，负责人一句话点破：
 * **那些内容首页和演化树都说过了，重复一遍没有意义。** 他是对的 ——
 * 列表展示的是**点**，而关系页的全部价值在**边**。
 *
 * 所以这一版画的是边：
 *   公司 —拥有→ 模型     11 条
 *   模型 —实现→ 能力     66 条（最富的一层，也正是那个枢纽）
 *   公司 —投资→ 公司      5 条（全部指向生数科技）
 *
 * 点任一节点做 Focus：只留与它直接相连的边，其余压到极淡 —— 这是 §9.1 要的
 * Focus Mode，也是唯一能在 82 条边里看清「谁和谁有关」的办法。
 */
const W = 1180;
const PAD = { t: 44, b: 28, l: 20, r: 20 };
/**
 * **四列**：投资方 → 公司 → 模型 → 能力。
 * 上一版把投资方和公司挤在同一列，投资边只能向左弯回去、横穿所有公司标签 ——
 * 采到 8 条就已经乱了，越采越糟。分成独立一列后全部左到右流动，没有回头弯。
 */
const COL = { inv: 24, org: 246, model: 620, cap: W - 205 };
/**
 * 画布左边留白：投资方标签靠右对齐写在节点左侧，最长的「视觉中国 Visual China Group」
 * 约 190px。viewBox 从 0 起会把它整段裁掉 —— 所以让 viewBox 从负值开始。
 */
const LEFT = 100;  // 投资方字号缩到 8px 后，最长的名字约 95px

const ORG_HUE: Record<string, string> = {
  alibaba: "#2f7d5e", kuaishou: "#c2703a", bytedance: "#2b6fb0", tencent: "#3f8f86",
  kunlun: "#7a5cc4", shengshu: "#b04a72", minimax: "#8a7a2e", google: "#4a5fa8",
  lightricks: "#1f8a7a", runway: "#a8563a", rhymes: "#6b8f3a", genmo: "#7d6ba8",
  hpcai: "#3d7fa0", decart: "#5c6a78", openai: "#4a7d6b",
};
const HUE = (id?: string) => ORG_HUE[id ?? ""] ?? "var(--color-unknown)";

type Sel = { kind: "none" } | { kind: "org" | "model" | "cap"; id: string };

/**
 * @param domain 画哪个方向。**必须由页面传进来** ——
 * 默认取 currentDomain() 的话，/atlas/image/map 会画出 AI 视频的关系图：
 * 路由是 image、内容是 video，**页面不报任何错**。
 */
export default function RelationGraph({ domain }: { domain: string }) {
  const [sel, setSel] = useState<Sel>({ kind: "none" });

  /**
   * 这个方向的能力轴。**提到组件级** —— 图里画一次、点开模型时还要用一次，
   * 放在 useMemo 里面第二处就取不到，只能又写一遍 `capsOf("clip")`，
   * 而那正是这个 bug 的来源：**同一份东西算两遍，迟早有一遍是旧的。**
   */
  const domainCaps = useMemo(() => {
    const trackIds = new Set(
      (atlas.domains.find((x) => x.id === domain)?.tracks ?? []).map((t) => t.id),
    );
    return atlas.capabilities.filter(
      (c) => (c.domain ?? "video") === domain && (trackIds.has(c.class) || c.class === "both"),
    );
  }, [domain]);

  const g = useMemo(() => {
    /**
     * **全部模型都进图，不只主表 clip**（负责人：Decart 没出现）。
     * 上一版用 modelsOf("clip")（只要 core），一下筛掉 7 家公司：
     * Decart 是实时轨；昆仑万维 / 腾讯 / OpenAI / Genmo / Rhymes / 潞晨 是 Extended 层。
     * **公司之间有没有关系，跟我们把它放主表还是 Extended 无关** —— 那是我们的分层，
     * 不是它们的事实。关系图收全部。
     */
    // **只画当前方向的模型** —— 混着画会把 AI 图像的产品线接到 AI 视频的能力上
    const models = domainModels(domain);
    /**
     * 能力按方向过滤。**上一轮我只改了模型，把这一列漏了** ——
     * 于是 /atlas/image/map 右侧列的是「文生视频 / 首尾帧 / 运镜控制 / 对口型」，
     * 而左边挂的是 FLUX、Seedream。**半边对、半边错，比整页错更难发现。**
     */
    const caps = domainCaps;
    /**
     * 公司列 = 有模型的公司 + **投资方**。
     * ⚠️ investments.from 存的是**公司中文名字符串**，不是 org id —— 上一版按 id 过滤，
     * 5 条投资边一条都画不出来。这里给投资方单独建节点，id 用 `inv:名字`。
     */
    const orgs = atlas.orgs.filter((o) => models.some((m) => m.org === o.id));
    // 投资方按「投给谁」排序聚拢 —— 同一家的投资方挨在一起，边才不会互相穿插
    const orgIdx = new Map(orgs.map((o, i) => [o.id, i]));
    /**
     * **没录全的要画出来**（负责人：OpenAI 只找到微软，不全）。
     * 只画已知的那一条，读者会以为「OpenAI 就微软一个投资方」—— 那比不画更误导。
     * 给标了 investors_coverage: "partial" 的公司挂一个 ⋯ 占位节点，
     * 明说「还有没录进来的」。这和 ⬜「官方没说」是同一条纪律。
     */
    const partial = atlas.orgs.filter((o) => o.investors_coverage === "partial");
    const invNames = [...new Set(atlas.investments.map((v) => v.from))].sort((x, y) => {
      const tx = atlas.investments.find((v) => v.from === x)!.to;
      const ty = atlas.investments.find((v) => v.from === y)!.to;
      return (orgIdx.get(tx) ?? 99) - (orgIdx.get(ty) ?? 99);
    });
    const step = (h: number, n: number) => (i: number) => PAD.t + (n > 1 ? (h * i) / (n - 1) : h / 2);
    const H = 620;
    const oy = step(H, orgs.length), my = step(H * 0.86, models.length), cy = step(H * 0.86, caps.length);
    const iy = step(H * 0.42, invNames.length);
    return {
      H,
      investors: [
        ...invNames.map((n, i) => ({ id: `inv:${n}`, zh: n, x: COL.inv, y: iy(i) + H * 0.29, more: false })),
        ...partial.map((o, k) => ({
          id: `more:${o.id}`, zh: "⋯ 还有未录", x: COL.inv,
          y: iy(invNames.length + k) + H * 0.29, more: true,
        })),
      ],
      orgs: orgs.map((o, i) => ({ ...o, x: COL.org, y: oy(i) })),
      models: models.map((m, i) => ({ ...m, x: COL.model, y: my(i) + H * 0.07 })),
      caps: caps.map((c, i) => ({ ...c, x: COL.cap, y: cy(i) + H * 0.07 })),
    };
  }, []);

  const P = useMemo(() => {
    const p = new Map<string, { x: number; y: number }>();
    for (const v of g.investors) p.set(`o:${v.id}`, v);
    for (const o of g.orgs) p.set(`o:${o.id}`, o);
    for (const m of g.models) p.set(`m:${m.id}`, m);
    for (const c of g.caps) p.set(`c:${c.id}`, c);
    return p;
  }, [g]);

  /** 三类边合成一张表，Focus 判定只需要看两端。 */
  const edges = useMemo(() => {
    const out: { a: string; b: string; kind: "own" | "impl" | "invest"; color: string }[] = [];
    for (const m of g.models)
      out.push({ a: `o:${m.org}`, b: `m:${m.id}`, kind: "own", color: HUE(m.org) });
    for (const m of g.models)
      for (const c of g.caps)
        if (cell(m.id, c.id).state === "yes")
          out.push({ a: `m:${m.id}`, b: `c:${c.id}`, kind: "impl", color: HUE(m.org) });
    for (const v of atlas.investments)
      out.push({ a: `o:inv:${v.from}`, b: `o:${v.to}`, kind: "invest", color: "#b04a72" });
    for (const o of atlas.orgs)
      if (o.investors_coverage === "partial")
        out.push({ a: `o:more:${o.id}`, b: `o:${o.id}`, kind: "invest", color: "#b04a72" });
    return out;
  }, [g]);

  const key = sel.kind === "none" ? null : `${sel.kind === "org" ? "o" : sel.kind === "model" ? "m" : "c"}:${sel.id}`;
  /**
   * **整条链路全亮**，但只沿**方向**走（负责人要求全链路，同时不能失去 Focus）。
   *
   * 第一版做成无向广度优先，结果点 Sequoia 亮了全图 69 个节点、一个不暗 ——
   * 因为**能力是共享枢纽**：Sequoia → Decart → Lucy →「文生视频」→ 所有模型 →
   * 所有公司，无向遍历必然扩散到全图，Focus 当场失效。
   *
   * 正解是分两个方向各走到底，**不在枢纽上横向跳**：
   *   顺流（下游）投资方 → 公司 → 模型 → 能力
   *   逆流（上游）能力 → 模型 → 公司 → 投资方
   * 点「文生视频」看谁实现了它，点 Sequoia 看这笔钱最终支撑了哪些能力，
   * 两条链路都完整，但不会溢到无关的分支。
   */
  const reach = useMemo(() => {
    if (!key) return null;
    const nodes = new Set<string>([key]);
    const eids = new Set<number>();
    const fwd = new Map<string, { to: string; i: number }[]>();
    const bwd = new Map<string, { to: string; i: number }[]>();
    edges.forEach((e, i) => {
      if (!fwd.has(e.a)) fwd.set(e.a, []);
      if (!bwd.has(e.b)) bwd.set(e.b, []);
      fwd.get(e.a)!.push({ to: e.b, i });
      bwd.get(e.b)!.push({ to: e.a, i });
    });
    const walk = (m: Map<string, { to: string; i: number }[]>) => {
      const q = [key];
      const seen = new Set([key]);
      while (q.length) {
        const cur = q.shift()!;
        for (const { to, i } of m.get(cur) ?? []) {
          eids.add(i);
          nodes.add(to);
          if (!seen.has(to)) { seen.add(to); q.push(to); }
        }
      }
    };
    walk(fwd);
    walk(bwd);
    return { nodes, eids };
  }, [key, edges]);

  const lit = (id: string) => !reach || reach.nodes.has(id);
  const litEdge = (_e: { a: string; b: string }, i: number) => !reach || reach.eids.has(i);

  const Node = ({
    id, x, y, text, sub, color, onClick, href, anchor, small,
  }: {
    id: string; x: number; y: number; text: string; sub?: string; color: string;
    onClick: () => void; href?: string; anchor: "start" | "end"; small?: boolean;
  }) => (
    <g opacity={lit(id) ? 1 : 0.13} style={{ transition: "opacity .3s", cursor: "pointer" }} onClick={onClick}>
      <circle cx={x} cy={y} r={key === id ? 5.5 : small ? 2.5 : 4} fill={color} />
      <text x={anchor === "end" ? x - (small ? 7 : 9) : x + 9} y={y + 3.5} textAnchor={anchor}
        fontSize={small ? 8 : 11.5} fontWeight={key === id ? 700 : small ? 400 : 500}
        fill={small ? "var(--color-muted)" : "var(--color-ink)"}>
        {text}
        {sub && <tspan fontSize="9.5" fontWeight="400" fill="var(--color-muted)">{"  " + sub}</tspan>}
      </text>
      {href && <title>{text} —— 点开看详情</title>}
    </g>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-muted">
        <span><b className="text-ink">点任一节点</b>，只留和它直接相连的边</span>
        <span className="flex items-center gap-1.5">
          <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#2f7d5e" strokeWidth="1.6" /></svg>
          公司拥有这条产品线
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#2f7d5e" strokeWidth="1" opacity=".45" /></svg>
          这个模型实现了这项能力
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="22" height="8"><line x1="0" y1="4" x2="22" y2="4" stroke="#b04a72" strokeWidth="1.6" strokeDasharray="4 3" /></svg>
          投资
        </span>
        {sel.kind !== "none" && (
          <button onClick={() => setSel({ kind: "none" })} className="underline hover:text-ink">
            看全部 →
          </button>
        )}
      </div>

      <div className="bg-card border border-rule rounded-xl rounded-xl overflow-x-auto">
        <svg viewBox={`${-LEFT} 0 ${W + LEFT} ${g.H + PAD.t + PAD.b}`} className="w-full min-w-[980px]">
          <text x={COL.inv} y={20} textAnchor="end" fontSize="8.5" fontWeight="700" fill="#b04a72">投资方</text>
          <text x={COL.org} y={20} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--color-muted)">公司</text>
          <text x={COL.model} y={20} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-muted)">模型</text>
          <text x={COL.cap} y={20} textAnchor="start" fontSize="11" fontWeight="700" fill="var(--color-muted)">能力 · 枢纽</text>

          {edges.map((e, i) => {
            const a = P.get(e.a), b = P.get(e.b);
            if (!a || !b) return null;
            const on = litEdge(e, i);
            const mx = (a.x + b.x) / 2;
            return (
              <path key={i}
                d={`M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`}
                fill="none" stroke={e.color}
                strokeWidth={e.kind === "own" ? 1.6 : e.kind === "invest" ? 1.4 : 1}
                strokeDasharray={e.kind === "invest" ? "4 3" : undefined}
                // 投资边默认压淡：采得越多越糊，点中投资方或那家公司才亮起来
                opacity={on ? (e.kind === "impl" ? 0.38 : e.kind === "invest" ? (key ? 0.85 : 0.22) : 0.7) : 0.05}
                style={{ transition: "opacity .3s" }} />
            );
          })}

          {g.investors.map((v) => (
            <Node key={v.id} id={`o:${v.id}`} x={v.x} y={v.y} anchor="end" small
              text={v.zh} color={v.more ? "#d9a8ba" : "#b04a72"}
              onClick={() => setSel(key === `o:${v.id}` ? { kind: "none" } : { kind: "org", id: v.id })} />
          ))}
          {g.orgs.map((o) => (
            <Node key={o.id} id={`o:${o.id}`} x={o.x} y={o.y} anchor="end"
              text={o.zh.replace("稀宇科技 ", "").replace(" DeepMind", "").replace("科技", "")}
              color={HUE(o.id)}
              onClick={() => setSel(key === `o:${o.id}` ? { kind: "none" } : { kind: "org", id: o.id })} />
          ))}
          {g.models.map((m) => (
            <Node key={m.id} id={`m:${m.id}`} x={m.x} y={m.y} anchor="start"
              text={label(m)} color={HUE(m.org)}
              onClick={() => setSel(key === `m:${m.id}` ? { kind: "none" } : { kind: "model", id: m.id })} />
          ))}
          {g.caps.map((c) => (
            <Node key={c.id} id={`c:${c.id}`} x={c.x} y={c.y} anchor="start"
              text={c.zh} sub={c.ubiquity} color="var(--color-muted)"
              onClick={() => setSel(key === `c:${c.id}` ? { kind: "none" } : { kind: "cap", id: c.id })} />
          ))}
        </svg>
      </div>

      {/* 选中后的说明：把「谁和谁相连」写成一句人话 */}
      {sel.kind === "cap" && (() => {
        const c = atlas.capabilities.find((x) => x.id === sel.id)!;
        const who = modelsOf("clip").filter((m) => cell(m.id, c.id).state === "yes");
        const orgN = new Set(who.map((m) => m.org)).size;
        return (
          <p className="text-[15px] leading-relaxed">
            <Link href={capHref(c)} className="font-semibold underline hover:text-yes-ink">{c.zh}</Link>
            {" "}把 <b className="text-ink">{orgN} 家公司</b>的 {who.length} 个模型连在一起：
            {who.map((m, i) => (
              <span key={m.id}>
                {i > 0 && "、"}
                <Link href={modelHref(m)} className="underline hover:text-yes-ink">{label(m)}</Link>
                <span className="text-muted text-[13px]">（{orgOf(m)?.zh}）</span>
              </span>
            ))}
            。<b className="text-ink">它们分属不同公司，在组织上毫无关系 —— 是这项能力让它们成为同类。</b>
          </p>
        );
      })()}
      {sel.kind === "org" && (() => {
        // 投资方节点的 id 是 `inv:名字`，orgs 表里查不到 —— 分开处理，别让它崩成空白
        if (sel.id.startsWith("inv:")) {
          const name = sel.id.slice(4);
          const to = atlas.investments.filter((v) => v.from === name);
          return (
            <p className="text-[15px] leading-relaxed">
              <b className="text-ink">{name}</b> 是投资方，库里没有它的模型。
              它投了：{to.map((v, i) => (
                <span key={i}>{i > 0 && "、"}{atlas.orgs.find((x) => x.id === v.to)?.zh}
                  {v.round && <span className="text-muted text-[13px]">（{v.round}）</span>}
                </span>))}。
            </p>
          );
        }
        const o = atlas.orgs.find((x) => x.id === sel.id)!;
        const ms = modelsOf("clip").filter((m) => m.org === o.id);
        const inv = atlas.investments.filter((v) => v.to === o.id);
        return (
          <p className="text-[15px] leading-relaxed">
            <b className="text-ink">{o.zh}</b>
            {o.hq?.city && <span className="text-muted text-[13px]">（{o.hq.city}）</span>}
            {ms.length ? <> 有 {ms.length} 条产品线：{ms.map((m, i) => (
              <span key={m.id}>{i > 0 && "、"}
                <Link href={modelHref(m)} className="underline hover:text-yes-ink">{label(m)}</Link>
              </span>))}。</> : null}
            {!!inv.length && (
              <> 已录得 <b className="text-ink">{inv.length} 家投资方</b>：
                {inv.map((v, i) => <span key={i} className="text-muted">{i > 0 && "、"}{v.from}</span>)}。</>
            )}
          </p>
        );
      })()}
      {sel.kind === "model" && (() => {
        const m = atlas.models.find((x) => x.id === sel.id)!;
        // 同上：这里也不能写死 clip —— 点开一个图像模型会列出它「支持」的视频能力
        const cs = domainCaps.filter((c) => cell(m.id, c.id).state === "yes");
        return (
          <p className="text-[15px] leading-relaxed">
            <Link href={modelHref(m)} className="font-semibold underline hover:text-yes-ink">{label(m)}</Link>
            <span className="text-muted text-[13px]">（{orgOf(m)?.zh}）</span>
            {" "}已核验 {cs.length} 项能力：{cs.map((c, i) => (
              <span key={c.id}>{i > 0 && "、"}
                <Link href={capHref(c)} className="underline hover:text-yes-ink">{c.zh}</Link>
              </span>))}。
          </p>
        );
      })()}
    </div>
  );
}
