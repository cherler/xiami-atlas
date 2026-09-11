"use client";

import { atlas, capsOf, cell, modelsOf, type Capability } from "@/lib/atlas";

/**
 * 能力演进图（方案 §9.2）。
 *
 * §9.2 有一条要求容易被忽略：**每张图要有一个明确的观点，不只是一个题目。**
 * 「AI 视频能力演进」是题目；数据给出的观点是：
 *
 *   **控制类能力 2024 年就位，参考与音频类全挤在 2025 下半年之后。**
 *
 * 所以泳道按 group 排，并把这条观点直接写在图上 —— 而不是让读者自己去数。
 *
 * 时间轴的**左端不是 0，是「我们能追溯到的最早」**（2024-01）。
 * 画成从 0 开始会暗示「在此之前没有」，那是我们证明不了的事。
 */

const W = 1160;
const ROW = 52;
const LEFT = 236;   // 左边要装下「分组竖线 + 组名 + 能力名 + 起始日期」四层，176 会把组名切掉
const RIGHT = 96;
const TOP = 64;

/** 时间窗：起点是可追溯窗口的左端，终点是当前数据日期。 */
const START = "2024-01";
const ym = (s: string) => Number(s.slice(0, 4)) * 12 + Number(s.slice(5, 7)) - 1;

export default function Evolution({ onPick }: { onPick?: (id: string) => void }) {
  /**
   * **泳道图要求同组连续。** 能力在 atlas.json 里是按录入顺序排的（控制、参考、控制…），
   * 直接画会让「参考」和「控制」两条组线在纵向上互相穿插、标签叠在一起。
   * 先按组归拢，组内再按时间排 —— 这样一眼能看出「哪一组整体更早」，
   * 而那正是这张图要说的话。
   */
  const GROUP_ORDER = ["控制", "参考", "音频", "叙事"];
  const caps = capsOf("clip")
    .filter((c) => c.since)
    .sort(
      (a, b) =>
        GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.since!.localeCompare(b.since!),
    );
  const noDate = capsOf("clip").filter((c) => !c.since);
  const end = ym(atlas.generated_at.slice(0, 7));
  const start = ym(START);
  const span = end - start;
  const H = TOP + caps.length * ROW + 92;
  const x = (m: string) => LEFT + ((ym(m) - start) / span) * (W - LEFT - RIGHT);

  // 年份刻度
  const years: number[] = [];
  for (let y = Number(START.slice(0, 4)); y <= Number(atlas.generated_at.slice(0, 4)); y += 1) years.push(y);

  const groups = [...new Set(caps.map((c) => c.group))];
  const rowOf = (c: Capability) => caps.findIndex((x) => x.id === c.id);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img">
      {years.map((y) => (
        <g key={y}>
          <line x1={x(`${y}-01`)} y1={TOP - 22} x2={x(`${y}-01`)} y2={H - 76} stroke="var(--color-rule)" strokeWidth={1} />
          <text x={x(`${y}-01`) + 6} y={TOP - 28} fontSize={13} fill="var(--color-muted)">
            {y}
          </text>
        </g>
      ))}

      {groups.map((g) => {
        const rows = caps.filter((c) => c.group === g).map(rowOf);
        const y0 = TOP + Math.min(...rows) * ROW - 16;
        const y1 = TOP + Math.max(...rows) * ROW + 20;
        return (
          <g key={g}>
            <line x1={LEFT - 200} y1={y0} x2={LEFT - 200} y2={y1} stroke="var(--color-yes)" strokeWidth={2.5} opacity={0.5} />
            <text x={LEFT - 210} y={(y0 + y1) / 2 + 4} fontSize={13} fill="var(--color-muted)" textAnchor="end">
              {g}
            </text>
          </g>
        );
      })}

      {caps.map((c) => {
        const i = rowOf(c);
        const y = TOP + i * ROW;
        // 有多少个模型实现了它 —— 线的粗细表示「铺开程度」，不是随便画的装饰
        const n = modelsOf("clip").filter((m) => cell(m.id, c.id).state === "yes").length;
        const total = modelsOf("clip").length;
        return (
          <g key={c.id} className="cursor-pointer" onClick={() => onPick?.(c.id)}>
            <text x={LEFT - 190} y={y + 5} fontSize={15} fontWeight={600} fill="var(--color-ink)">
              {c.zh}
            </text>
            <line
              x1={x(c.since!)}
              y1={y}
              x2={W - RIGHT}
              y2={y}
              stroke="var(--color-yes)"
              strokeWidth={2 + (n / total) * 6}
              strokeOpacity={0.22 + (n / total) * 0.55}
              strokeLinecap="round"
            />
            <circle cx={x(c.since!)} cy={y} r={6} fill="var(--color-yes)" />
            <text x={x(c.since!) - 10} y={y + 5} fontSize={12} fill="var(--color-muted)" textAnchor="end">
              {c.since}
            </text>
            <text x={W - RIGHT + 10} y={y + 5} fontSize={13} fill="var(--color-yes)" fontWeight={700}>
              {n}/{total}
            </text>
          </g>
        );
      })}

      <text x={LEFT - 190} y={H - 46} fontSize={13} fill="var(--color-muted)">
        {`线越粗＝实现它的模型越多。左端＝我们能证明的最早时间，不是业界首次出现` +
          (noDate.length ? `；${noDate.map((c) => c.zh).join("、")}早于可追溯窗口或不随时间演进，未列入` : "")}
      </text>
      <text x={LEFT - 190} y={H - 24} fontSize={13} fill="var(--color-muted)">
        可追溯窗口起于 {START}（Runway changelog）与 2024-09（Kling API 日志）
      </text>
    </svg>
  );
}
