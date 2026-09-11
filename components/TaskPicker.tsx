"use client";

import { useState } from "react";
import Link from "next/link";
import { atlas, capsOf, cell, label, modelsOf, orgOf } from "@/lib/atlas";
import { modelHref } from "@/lib/slug";

/**
 * 任务入口 —— 动线 A 的起点（「我要做一件事，用谁？」）。
 *
 * 用户不会用我们的词想问题。他想的是「我要让角色前后一致」，
 * 不是「我要查 charref 这一格」。所以按钮上写的是**任务**，
 * 点下去直接给能做这件事的模型，**并且立刻带上价格、平台、大陆通不通** ——
 * 这三样正是他下一秒要问的。
 *
 * 排序：**大陆能直连的排前面**。这是国内读者的第一约束，
 * 一个用不上的模型排第一是在浪费他的时间。
 */
const SYM: Record<string, string> = { USD: "$", CNY: "¥" };
const REACH = { ok: 0, unknown: 1, blocked: 2 } as const;

export default function TaskPicker() {
  const [pick, setPick] = useState<string | null>(null);
  const caps = capsOf("clip").filter((c) => c.ubiquity !== "已普及");
  const ms = modelsOf("clip");

  const hits = pick ? ms.filter((m) => cell(m.id, pick).state === "yes") : [];
  const sorted = [...hits].sort(
    (a, b) => (REACH[a.reach_cn ?? "unknown"] ?? 1) - (REACH[b.reach_cn ?? "unknown"] ?? 1),
  );

  const price = (id: string) => {
    const q = atlas.pricing.find((x) => x.m === id && x.unit === "per-second" && x.tiers?.length);
    if (!q) return null;
    const t = q.tiers!.find((x) => x.label.includes("1080")) ?? q.tiers![0];
    // **带上核验日**。价格这一类已封存不再维护（ontology 规则十），
    // 不写日期就等于宣称它是今天的价 —— 那是我们最不该犯的错。
    return `${SYM[q.currency ?? ""] ?? ""}${t.v}/秒 · ${t.label} · ${q.as_of} 快照`;
  };
  const where = (id: string) => {
    const v = atlas.availability.filter((x) => x.m === id);
    return v.length ? atlas.platforms.find((p) => p.id === v[0].p)?.name : null;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {caps.map((c) => (
          <button key={c.id} onClick={() => setPick(pick === c.id ? null : c.id)}
            className={`text-[15px] px-3 py-1.5 rounded-lg border ${
              pick === c.id ? "border-yes text-yes bg-yes/6" : "border-rule hover:border-yes hover:text-yes"
            }`}>
            {c.zh}
          </button>
        ))}
      </div>

      {pick && (
        <div className="flex flex-col gap-1.5">
          {sorted.map((m) => (
            <div key={m.id} className="border border-rule rounded-lg bg-card p-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <Link href={modelHref(m)} className="font-semibold text-[16px] underline hover:text-yes">
                {label(m)}
              </Link>
              <span className="text-muted text-[13px]">{orgOf(m)?.zh}</span>
              <span className="text-[13px] tabular-nums">{price(m.id) ?? <span className="text-unknown">价格未取到</span>}</span>
              <span className="text-muted text-[13px]">{where(m.id) ?? "上架未知"}</span>
              {m.reach_cn === "blocked" ? <b className="text-no text-[13px]">大陆直连不通</b>
                : m.reach_cn === "ok" ? <span className="text-yes text-[13px]">大陆可直连</span> : null}
              <Link href={`/compare/${m.id}-vs-${(sorted.find((x) => x.id !== m.id) ?? m).id}`}
                className="ml-auto text-[13px] underline text-muted hover:text-yes">
                和别的比 →
              </Link>
            </div>
          ))}
          {!sorted.length && <p className="text-muted text-[14px]">这一项还没有模型有明确的官方依据。</p>}
        </div>
      )}
    </div>
  );
}
