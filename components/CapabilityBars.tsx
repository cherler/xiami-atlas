"use client";

import { useState } from "react";
import Link from "next/link";
import { atlas, capsOf, cell, label, modelsOf } from "@/lib/atlas";
import { capHref, modelHref } from "@/lib/slug";

/**
 * 首屏：**AI 视频走到了哪一步**（方案 §8.1）。
 *
 * §8.1 画的样例就是横条：一行一项能力，从它最早可证的时间起画到今天，
 * 右侧固定一列代表模型。**不是关系图** —— 关系图回答「谁和谁有关」，
 * 这里回答的是「这个领域走到哪了」，是两个问题。
 *
 * 验收按 §7.1 的原话：**把页面上所有句子删掉，只留标题、条、数字**，
 * 仍然要能看出「哪些能力已成熟、哪些还早」。所以：
 *  · 条的**起点**＝最早可证时间（不是业界首次，那条口径在 /method）
 *  · 条的**粗细**＝当前有多少模型做到
 *  · 右侧数字＝支持数 / 总数
 * 三样都是形状和数字，不靠文字。
 */
const GROUP = ["生成", "控制", "参考", "音频", "叙事"];
const W = 1000;
const PAD = { l: 116, r: 96 };

const MS = (d: string) => new Date(`${d.length === 7 ? `${d}-01` : d}T00:00:00Z`).getTime();

export default function CapabilityBars() {
  const [hot, setHot] = useState<string | null>(null);
  const ms = modelsOf("clip");
  const caps = capsOf("clip").filter((c) => c.since);

  const t0 = Math.min(...caps.map((c) => MS(c.since!)));
  const t1 = Date.now();
  const x = (d: string) => PAD.l + ((MS(d) - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);

  const rows = [...caps].sort(
    (a, b) => GROUP.indexOf(a.group ?? "") - GROUP.indexOf(b.group ?? "") || MS(a.since!) - MS(b.since!),
  );
  const H = 34 + rows.length * 30 + 14;
  const yes = (id: string) => ms.filter((m) => cell(m.id, id).state === "yes");

  const years: number[] = [];
  for (let y = new Date(t0).getUTCFullYear(); y <= new Date(t1).getUTCFullYear(); y++) years.push(y);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[680px]" style={{ height: H }}>
          {years.map((y) => {
            const at = Date.UTC(y, 0, 1) >= t0 ? `${y}-01-01` : new Date(t0).toISOString().slice(0, 10);
            return (
              <g key={y}>
                <line x1={x(at)} x2={x(at)} y1={16} y2={H - 10} stroke="var(--color-rule)" />
                <text x={x(at) + 4} y={12} fontSize="11" fill="var(--color-muted)">{y}</text>
              </g>
            );
          })}

          {rows.map((c, i) => {
            const y = 34 + i * 30;
            const n = yes(c.id).length;
            const dim = hot && hot !== c.id;
            const newGroup = i === 0 || rows[i - 1].group !== c.group;
            return (
              <g key={c.id} opacity={dim ? 0.13 : 1} style={{ cursor: "pointer", transition: "opacity .2s" }}
                onMouseEnter={() => setHot(c.id)} onMouseLeave={() => setHot(null)}
                onClick={() => setHot(hot === c.id ? null : c.id)}>
                {newGroup && (
                  <text x={4} y={y + 4} fontSize="11" fill="var(--color-muted)">{c.group}</text>
                )}
                <text x={PAD.l - 10} y={y + 4} textAnchor="end" fontSize="13.5" fontWeight="600" fill="var(--color-ink)">
                  {c.zh}
                </text>
                {/* 粗细就是支持数 —— 不靠文字，靠形状 */}
                <line x1={x(c.since!)} x2={W - PAD.r} y1={y} y2={y}
                  stroke="var(--color-yes)" strokeWidth={Math.max(1.5, (n / ms.length) * 11)}
                  strokeLinecap="round" opacity={0.42 + (n / ms.length) * 0.5} />
                <circle cx={x(c.since!)} cy={y} r="4" fill="var(--color-yes)" />
                {/* 起点贴最左时，日期标签往右放 —— 否则压在能力名上（对口型 2024-01 就压了） */}
                <text x={x(c.since!) + (x(c.since!) < PAD.l + 26 ? 9 : -8)} y={y + 4}
                  textAnchor={x(c.since!) < PAD.l + 26 ? "start" : "end"} fontSize="10" fill="var(--color-muted)">
                  {c.since}
                </text>
                <text x={W - PAD.r + 10} y={y + 4} fontSize="13" fontWeight="700"
                  fill={n === ms.length ? "var(--color-muted)" : "var(--color-yes)"}>
                  {n}
                  <tspan fill="var(--color-muted)" fontWeight="400">/{ms.length}</tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hot && (
        <div className="border border-rule rounded-lg bg-card p-3 flex flex-col gap-1.5">
          <p className="text-[15px]">
            <Link href={capHref(hot)} className="font-semibold underline hover:text-yes">
              {atlas.capabilities.find((c) => c.id === hot)!.zh}
            </Link>
            <span className="text-muted text-[13px] ml-2">
              {atlas.capabilities.find((c) => c.id === hot)!.name}
            </span>
          </p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-[14px]">
            {yes(hot).map((m) => (
              <Link key={m.id} href={modelHref(m)} className="text-yes underline hover:text-ink">{label(m)}</Link>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}
