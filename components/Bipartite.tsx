"use client";

import { atlas, capsOf, cell, compare, label, modelsOf, modelsWith, type State, orgOf } from "@/lib/atlas";

/** 生命周期在图上必须看得见 —— 一个已停服的模型和在售的并排站着，是有害的。 */
const STATUS = {
  discontinued: { tag: "已停服", color: "var(--color-no)", strike: true },
  superseded: { tag: "非主力", color: "var(--color-muted)", strike: false },
} as const;

/**
 * 模型 ↔ 能力 二部图。
 *
 * 为什么是二部图而不是 §9.1 原稿那棵 `公司 → 团队 → 模型 → 版本` 树：
 * 那棵树画不出 Kling 和 Seedance 的关系 —— 它们分属两家公司，
 * 在组织维度上永远是两座孤岛。**要它们相连，枢纽必须是能力。**（§59.1）
 *
 * 布局是手写的两列，没有用 ELK。原稿建议 React Flow + ELK layered，
 * 但 8 + 9 个节点的固定二部图，布局是确定的两列，自动布局在这里只增加依赖不增加信息。
 * 等节点数到几十个、或出现不规则子图时再换。
 */

const W = 1160;
const H = 690;
const TOP = 56;
// 留出底部那行「已折叠」说明的高度 —— 否则最后一个模型节点会被文字压住
const BOT = 598;
const MX = 44; // 模型列左边界
const MW = 218;
const CX = 700; // 能力列左边界
const CW = 250;

const YES = "var(--color-yes)";
const UNK = "var(--color-unknown)";
const NO = "var(--color-no)";

export type Sel = { kind: "none" } | { kind: "cap"; id: string } | { kind: "models"; ids: string[] };

const stateColor = (s: State) => (s === "yes" ? YES : s === "no" ? NO : UNK);

export default function Bipartite({ sel, onSel }: { sel: Sel; onSel: (s: Sel) => void }) {
  // 已普及的能力不进图：它连向所有模型，画出来是一团噪音而不是信息。
  // 这正是 §59.1 提前防的「超级节点」问题。
  const caps = capsOf("clip").filter((c) => c.ubiquity !== "已普及");
  const folded = capsOf("clip").filter((c) => c.ubiquity === "已普及");
  const models = modelsOf("clip");

  const my = (i: number) => TOP + ((BOT - TOP) * i) / (models.length - 1);
  const cy = (i: number) => TOP + ((BOT - TOP) * i) / (caps.length - 1);

  const picked = sel.kind === "models" ? sel.ids : [];
  const cmp = picked.length === 2 ? compare(picked[0], picked[1]) : null;

  /**
   * 一条边该画成什么样。返回 null 表示不画。
   *
   * 三种线型对应三件不同的事：
   *   实线 = 模型原生（同一次调用出结果）
   *   点线 = 平台另一个接口（能做，但要再调一次）
   *   虚线 = 官方没说
   * **点线和实线的区别不是装饰** —— 它是「一步做完」和「两步做完」的区别。
   */
  function edge(mId: string, cId: string) {
    const f = cell(mId, cId);
    const st = f.state;
    if (st === "no") return null;
    const sep = f.via === "separate-task";
    const solid = sep ? "4 3" : "";

    if (sel.kind === "none") {
      return st === "yes" ? { color: YES, w: 1.1, op: 0.13, dash: solid } : null;
    }
    if (sel.kind === "cap") {
      if (cId !== sel.id) return null;
      return st === "yes"
        ? { color: YES, w: 2.4, op: 0.9, dash: solid }
        : { color: UNK, w: 1.8, op: 0.75, dash: "7 5" };
    }
    if (!picked.includes(mId)) return null;
    if (cmp) {
      const shared = cmp.both.includes(cId);
      if (st === "yes")
        return { color: shared ? YES : "#1f4d8f", w: shared ? 2.6 : 2.2, op: 0.9, dash: solid };
      return { color: UNK, w: 1.5, op: 0.5, dash: "7 5" };
    }
    return st === "yes"
      ? { color: YES, w: 2.4, op: 0.88, dash: solid }
      : { color: UNK, w: 1.6, op: 0.6, dash: "7 5" };
  }

  const dim = (on: boolean) => (sel.kind === "none" || on ? 1 : 0.22);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img">
      <g>
        {models.map((m, i) =>
          caps.map((c) => {
            const e = edge(m.id, c.id);
            if (!e) return null;
            const y1 = my(i);
            const y2 = cy(caps.indexOf(c));
            const x1 = MX + MW;
            const x2 = CX;
            const mid = (x1 + x2) / 2;
            return (
              <path
                key={`${m.id}-${c.id}`}
                d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`}
                fill="none"
                stroke={e.color}
                strokeWidth={e.w}
                strokeOpacity={e.op}
                strokeDasharray={e.dash}
              />
            );
          }),
        )}
      </g>

      {models.map((m, i) => {
        const on =
          (sel.kind === "cap" && modelsWith(sel.id).includes(m.id)) ||
          (sel.kind === "models" && picked.includes(m.id));
        const sole = picked.length === 1 && picked[0] === m.id;
        const st = m.status && m.status !== "active" ? STATUS[m.status] : null;
        return (
          <g
            key={m.id}
            opacity={dim(on)}
            className="cursor-pointer"
            onClick={() => {
              const next = picked.includes(m.id)
                ? picked.filter((x) => x !== m.id)
                : [...picked, m.id].slice(-2);
              onSel(next.length ? { kind: "models", ids: next } : { kind: "none" });
            }}
          >
            <rect
              x={MX}
              y={my(i) - 25}
              width={MW}
              height={50}
              rx={7}
              fill={on || sole ? "var(--color-ink)" : "var(--color-paper)"}
              stroke={on || sole ? "var(--color-ink)" : "var(--color-rule)"}
              strokeWidth={1.4}
            />
            <text
              x={MX + 16}
              y={my(i) - 3}
              fontSize={19}
              fontWeight={600}
              fill={on ? "var(--color-paper)" : st ? st.color : "var(--color-ink)"}
              textDecoration={st?.strike ? "line-through" : undefined}
            >
              {label(m)}
            </text>
            <text x={MX + 16} y={my(i) + 16} fontSize={13} fill={on ? "var(--color-muted)" : "var(--color-muted)"}>
              {m.version_as_of}
              {st ? ` · ${st.tag}` : ` · ${orgOf(m)?.zh ?? "?"}`}
            </text>
          </g>
        );
      })}

      {caps.map((c, i) => {
        const on = sel.kind === "cap" && sel.id === c.id;
        const inCmp = cmp ? cmp.both.includes(c.id) || cmp.onlyA.includes(c.id) || cmp.onlyB.includes(c.id) : false;
        // 只数本轨 —— openweights 是跨轨能力，不限定的话会把 realtime 的模型也数进来
        const inTrack = new Set(models.map((x) => x.id));
        const n = modelsWith(c.id).filter((id) => inTrack.has(id)).length;
        const unk = models.filter((m) => cell(m.id, c.id).state === "unknown").length;
        return (
          <g
            key={c.id}
            opacity={dim(on || inCmp)}
            className="cursor-pointer"
            onClick={() => onSel(on ? { kind: "none" } : { kind: "cap", id: c.id })}
          >
            <rect
              x={CX}
              y={cy(i) - 23}
              width={CW}
              height={46}
              rx={7}
              fill={on ? "var(--color-yes)" : "var(--color-paper)"}
              stroke={on ? "var(--color-yes)" : "var(--color-rule)"}
              strokeWidth={1.4}
            />
            <text x={CX + 15} y={cy(i) - 2} fontSize={18} fontWeight={600} fill={on ? "var(--color-paper)" : "var(--color-ink)"}>
              {c.zh}
            </text>
            <text x={CX + 15} y={cy(i) + 15} fontSize={12} fill={on ? "#b7ded9" : "var(--color-muted)"}>
              {c.name} · {c.ubiquity}
            </text>
            <text
              x={CX + CW + 14}
              y={cy(i) + 1}
              fontSize={16}
              fill={YES}
              fontWeight={700}
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {n}
            </text>
            {unk > 0 && (
              <text
                x={CX + CW + 38}
                y={cy(i) + 1}
                fontSize={15}
                fill={UNK}
                fontWeight={600}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {unk} 没说
              </text>
            )}
          </g>
        );
      })}

      <text x={MX} y={26} fontSize={13} fill="var(--color-muted)" letterSpacing="0.14em">
        模型 · 点两个可对比
      </text>
      <text x={CX} y={26} fontSize={13} fill="var(--color-muted)" letterSpacing="0.14em">
        能力 · 点一个看谁实现了
      </text>
      <text x={CX + CW + 8} y={26} fontSize={11} fill="var(--color-muted)">
        支持数 / 没说
      </text>

      <g transform={`translate(${MX}, ${H - 30})`} fontSize={12} fill="var(--color-muted)">
        <line x1={0} y1={-4} x2={26} y2={-4} stroke={YES} strokeWidth={2.2} />
        <text x={32} y={0}>原生（一步做完）</text>
        <line x1={150} y1={-4} x2={176} y2={-4} stroke={YES} strokeWidth={2.2} strokeDasharray="4 3" />
        <text x={182} y={0}>另一个接口 *（要再调一次）</text>
        <line x1={360} y1={-4} x2={386} y2={-4} stroke={UNK} strokeWidth={1.8} strokeDasharray="7 5" />
        <text x={392} y={0}>官方没说</text>
      </g>

      <g opacity={0.85}>
        <text x={MX} y={H - 8} fontSize={13} fill="var(--color-muted)">
          已普及、不再有区分度，已折叠：
          {folded.map((f) => `${f.zh}（${f.name}）`).join("、")}
        </text>
      </g>
    </svg>
  );
}

export { stateColor };
