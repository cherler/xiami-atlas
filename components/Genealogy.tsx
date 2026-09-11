"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { atlas, label, orgOf } from "@/lib/atlas";
import { modelHref } from "@/lib/slug";

/**
 * 模型演化树（谱系图）。
 *
 * ## 为什么是树，不是泳道
 *
 * 上一版画的是泳道：一行一个模型，版本沿着行往右排。**平的，没有分叉。**
 * 但真实的演进是有父子关系的：Wan2.1 这个底座上同时长出 FLF2V（首尾帧）和
 * VACE（统一编辑）两个变体，Wan2.2 是换代接在 2.1 后面，Animate-2 又接在 Animate 后面。
 * **平铺会把「分叉」这件事整个抹掉** —— 而分叉正是谱系的意义。
 *
 * 参照的是 LLM 演化树那类图：时间做一根轴，分支按血缘劈开，
 * 模型作为叶子在各自发布的时刻长出来。
 *
 * ## 动画为什么允许存在（§7.3）
 *
 * §7.3 只准三类动画，其中一类是 **Temporal Motion —— 用于解释 2024 → 2026 的变化**。
 * 「按时间推进，模型一个个冒出来」正是这一类：
 * 去掉它，读者就得自己在脑子里按日期重排 19 个节点。**它承担理解，不是装饰。**
 *
 * 其余交互同样过了「去掉会少理解什么」这一关：
 *  · 点一项能力 → 纵向切一刀，看各家谁先谁后（去掉就看不出谁领先）
 *  · 点节点 → 钉住明细（**手机上没有 hover**，§12）
 * 不做的：按公司筛选（现在就 6 棵树，筛完还是 6 棵）、缩放平移（不增加理解）。
 *
 * ## 覆盖不全是明说的
 *
 * 万相和可灵能长成树，Runway/Vidu/Seedance 只有孤零零几个点。
 * **画一个孤点却不说明，读者会以为这家两年只发过一次** —— 所以孤根单独标出来。
 */
const W = 1120;
const PAD = { l: 56, r: 150, t: 52, b: 40 };
const LANE = 46; // 每个叶子占的高度

const MS = (d: string) => new Date(`${d.length === 7 ? `${d}-01` : d}T00:00:00Z`).getTime();
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);

type Node = { id: string; parent?: string; m: string; date: string; added: string; version: string; cap?: string; src: string; quote: string };

export default function Genealogy() {
  const [pin, setPin] = useState<string | null>(null);
  const [cap, setCap] = useState<string | null>(null);
  const [cut, setCut] = useState(100);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number>(0);

  const nodes = atlas.versions as unknown as Node[];
  const all = nodes.map((n) => MS(n.date));
  const t0 = Math.min(...all), t1 = Math.max(...all);
  const cutMs = t0 + ((t1 - t0) * cut) / 100;

  /**
   * 树布局：**每个节点占自己的一槽，按「先根后子、子按时间」的顺序排**。
   *
   * 第一版用的是经典 tidy tree（父节点取子节点中位）。结果单子链上父与子落在同一槽，
   * 标签直接压成一团（Runway 的「换代 Gen-4.5」和「首帧图输入」叠在一起）。
   * 这里节点少、每个都要带一行文字标签，**「一节点一槽」比「树看起来更居中」重要得多**。
   * 分叉靠连线表达，不靠纵向对齐表达。
   *
   * 不引入布局库：19 个节点，引一个 ELK 是给一件能算出来的事加一个依赖。
   */
  const { pos, roots } = useMemo(() => {
    const kids = new Map<string, Node[]>();
    const rootList: Node[] = [];
    for (const n of [...nodes].sort((a, b) => MS(a.date) - MS(b.date))) {
      if (n.parent) kids.set(n.parent, [...(kids.get(n.parent) ?? []), n]);
      else rootList.push(n);
    }
    const p = new Map<string, number>();
    let slot = 0;
    const walk = (n: Node) => {
      p.set(n.id, slot++);
      for (const c of kids.get(n.id) ?? []) walk(c);
    };
    for (const r of rootList) { walk(r); slot += 0.5; } // 树与树之间留条缝
    return { pos: p, roots: new Set(rootList.map((r) => r.id)) };
  }, [nodes]);

  const maxSlot = Math.max(...[...pos.values()]) + 1;
  const H = PAD.t + maxSlot * LANE + PAD.b;
  const x = (d: string) => PAD.l + ((MS(d) - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
  const y = (id: string) => PAD.t + (pos.get(id) ?? 0) * LANE + LANE / 2;

  // 播放：把游标从头推到尾。**推完就停**，不循环 —— 循环的动画会一直抢注意力。
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const d = (now - last) / 1000; last = now;
      setCut((c) => { const n = c + d * 22; if (n >= 100) { setPlaying(false); return 100; } return n; });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const capsHere = useMemo(() => {
    const ids = new Set(nodes.map((n) => n.cap).filter(Boolean) as string[]);
    return atlas.capabilities.filter((c) => ids.has(c.id));
  }, [nodes]);

  /** 选中某能力时，谁第几个拿到 —— 这就是「纵向一刀」的全部产出。 */
  const order = useMemo(() => {
    if (!cap) return new Map<string, number>();
    const first = new Map<string, string>();
    for (const n of [...nodes].sort((a, b) => MS(a.date) - MS(b.date)))
      if (n.cap === cap && !first.has(n.m)) first.set(n.m, n.date);
    return new Map([...first.entries()].sort((a, b) => MS(a[1]) - MS(b[1])).map(([m], i) => [m, i + 1]));
  }, [cap, nodes]);

  const years: number[] = [];
  for (let yr = new Date(t0).getUTCFullYear(); yr <= new Date(t1).getUTCFullYear(); yr++) years.push(yr);
  const hot = pin ? nodes.find((n) => n.id === pin) : null;
  const ORG_HUE: Record<string, string> = {
    wan: "var(--color-yes)", kling: "#7a5cc4", runway: "#b06a2c", seedance: "#2c6bb0", "vidu-q": "#b03a7a",
  };
  const hue = (m: string) => ORG_HUE[m] ?? "var(--color-muted)";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <button onClick={() => { if (cut >= 100) setCut(0); setPlaying(!playing); }}
          className="px-3 py-1 rounded border border-yes text-yes hover:bg-yes hover:text-paper">
          {playing ? "⏸ 暂停" : "▶ 按时间长出来"}
        </button>
        <input type="range" min={0} max={100} value={cut}
          onChange={(e) => { setPlaying(false); setCut(+e.target.value); }}
          className="flex-1 min-w-[180px] max-w-[380px] accent-[var(--color-yes)]" aria-label="时间游标" />
        <b className="text-ink tabular-nums">{ymd(cutMs).slice(0, 7)}</b>
        <span className="text-muted tabular-nums">
          {nodes.filter((n) => MS(n.date) <= cutMs).length}/{nodes.length}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-2 text-[13px]">
        <span className="text-muted">谁先谁后：</span>
        <button onClick={() => setCap(null)}
          className={`px-2 py-0.5 rounded border ${!cap ? "border-yes text-yes" : "border-rule text-muted hover:text-ink"}`}>全部</button>
        {capsHere.map((c) => (
          <button key={c.id} onClick={() => setCap(cap === c.id ? null : c.id)}
            className={`px-2 py-0.5 rounded border ${cap === c.id ? "border-yes text-yes" : "border-rule text-muted hover:text-ink"}`}>
            {c.zh}
          </button>
        ))}
      </div>

      {cap && (
        <p className="text-[15px] border border-yes/40 bg-yes/6 rounded-lg px-3 py-2">
          <b className="text-ink">
            {[...order.entries()].map(([m, i]) => (
              <span key={m}>{i > 1 && " → "}{i}. {atlas.models.find((x) => x.id === m)?.family}</span>
            ))}
          </b>
        </p>
      )}

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[880px]" style={{ height: H }}>
          {years.map((yr) => {
            const at = Date.UTC(yr, 0, 1) >= t0 ? `${yr}-01-01` : ymd(t0);
            return (
              <g key={yr}>
                <line x1={x(at)} x2={x(at)} y1={PAD.t - 26} y2={H - PAD.b} stroke="var(--color-rule)" />
                <text x={x(at) + 5} y={PAD.t - 31} fontSize="12" fill="var(--color-muted)">{yr}</text>
              </g>
            );
          })}

          {/* 树枝：先画边，节点压在上面 */}
          {nodes.filter((n) => n.parent).map((n) => {
            const p = nodes.find((z) => z.id === n.parent)!;
            const x1 = x(p.date), y1 = y(p.id), x2 = x(n.date), y2 = y(n.id);
            const mx = x1 + Math.max(18, (x2 - x1) * 0.45);
            const on = MS(n.date) <= cutMs;
            const lit = !cap || n.cap === cap;
            return (
              <path key={`e-${n.id}`} d={`M${x1},${y1} H${mx} Q${mx + 10},${y1} ${mx + 10},${y1 + Math.sign(y2 - y1) * 8} V${y2 - Math.sign(y2 - y1) * 8} Q${mx + 10},${y2} ${mx + 20},${y2} H${x2}`}
                fill="none" stroke={hue(n.m)} strokeWidth={n.parent && p.version !== n.version ? 2.5 : 1.5}
                opacity={on ? (lit ? 0.55 : 0.14) : 0.05}
                style={{ transition: "opacity .35s" }} />
            );
          })}

          {[...nodes].sort((a, b) => MS(a.date) - MS(b.date)).map((n) => {
            const on = MS(n.date) <= cutMs;
            const lit = !cap || n.cap === cap;
            const isRoot = roots.has(n.id);
            const rank = cap ? order.get(n.m) : undefined;
            const px = x(n.date), py = y(n.id);
            const solo = isRoot && !nodes.some((z) => z.parent === n.id);
            return (
              <g key={n.id} style={{ cursor: "pointer", transition: "opacity .35s" }}
                opacity={on ? (lit ? 1 : 0.22) : 0}
                onClick={() => setPin(pin === n.id ? null : n.id)}>
                <circle cx={px} cy={py} r={isRoot ? 7 : 4.5}
                  fill={isRoot ? hue(n.m) : "var(--color-paper)"} stroke={hue(n.m)} strokeWidth="2" />
                {pin === n.id && <circle cx={px} cy={py} r="12" fill="none" stroke={hue(n.m)} strokeWidth="1.5" />}
                <text x={px + 11} y={py - 4} fontSize="11.5" fontWeight={isRoot ? 700 : 500} fill="var(--color-ink)">
                  {/* version 里已经带了产品名就别再拼一遍：Aleph 2.0 不该显示成「Runway Gen Aleph 2.0」 */}
                  {isRoot
                    ? (/[A-Za-z\u4e00-\u9fa5]{3,}/.test(n.version)
                        ? n.version
                        : `${atlas.models.find((x) => x.id === n.m)?.family} ${n.version}`)
                    : n.added}
                </text>
                <text x={px + 11} y={py + 8} fontSize="9.5" fill="var(--color-muted)">
                  {n.date.slice(0, 7)}{isRoot ? ` · ${n.added}` : ""}
                </text>
                {rank && isRoot && (
                  <>
                    <circle cx={px - 15} cy={py} r="8.5" fill={hue(n.m)} />
                    <text x={px - 15} y={py + 3.5} textAnchor="middle" fontSize="10.5" fontWeight="700"
                      fill="var(--color-paper)">{rank}</text>
                  </>
                )}
              </g>
            );
          })}

          {cut < 100 && (
            <line x1={x(ymd(cutMs))} x2={x(ymd(cutMs))} y1={PAD.t - 26} y2={H - PAD.b}
              stroke="var(--color-unknown)" strokeWidth="1.5" />
          )}
        </svg>
      </div>

      {/* 图例只画，不写句子。**解释一律去 /method** —— 前端不放我们的旁白。 */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14"><circle cx="7" cy="7" r="5.5" fill="var(--color-yes)" /></svg>底座 / 换代
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="14" height="14"><circle cx="7" cy="7" r="4" fill="var(--color-paper)" stroke="var(--color-yes)" strokeWidth="2" /></svg>变体
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="26" height="10"><path d="M1,5 H25" stroke="var(--color-yes)" strokeWidth="2" fill="none" /></svg>血缘
        </span>
        <Link href="/method#genealogy" className="underline hover:text-ink">这张图怎么读、数据哪来的 →</Link>
      </div>

      {hot && (
        <div className="border border-rule rounded-lg bg-card p-3 max-w-[900px] flex flex-col gap-1">
          <p className="text-[15px]">
            <b className="text-ink">{atlas.models.find((m) => m.id === hot.m)?.family} {hot.version}</b>
            <span className="text-muted text-[13px] ml-2">{orgOf(hot.m)?.zh} · {hot.date}</span>
          </p>
          <p className="text-[14px]">新增：<b className="text-ink">{hot.added}</b></p>
          {/* 孤点有两种成因：「我们没采到」和「它本来就没有历史」。**这两件事对读者完全不同。** */}
          {atlas.models.find((m) => m.id === hot.m)?.lineage_note && (
            <p className="text-[13px] text-unknown leading-relaxed">
              {atlas.models.find((m) => m.id === hot.m)!.lineage_note}
            </p>
          )}
          <p className="text-muted text-[12px] leading-relaxed">
            原文：「{hot.quote}」
            <a href={atlas.sources[hot.src]?.url} target="_blank" rel="noreferrer" className="underline ml-1.5 hover:text-yes">
              {atlas.sources[hot.src]?.name}
            </a>
          </p>
          <Link href={modelHref(hot.m)} className="text-[13px] underline hover:text-yes self-start mt-1">
            {label(atlas.models.find((m) => m.id === hot.m)!)} 的完整能力 →
          </Link>
        </div>
      )}
    </div>
  );
}
