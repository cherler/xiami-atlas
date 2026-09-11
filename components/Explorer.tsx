"use client";

import { useState } from "react";
import Link from "next/link";
import Bipartite, { type Sel } from "./Bipartite";
import { Fact } from "./Fact";
import { atlas, capsOf, compare, label, modelsOf, vendorName } from "@/lib/atlas";
import { capHref } from "@/lib/slug";

/**
 * 二部图 + 它的详情面板（负责人 2026-08-09 要求把图 3 加回「你想做什么」）。
 *
 * 二部图和详情**必须同居一个组件**：图里选中什么，下面就展开什么。
 * 拆开就得把 sel 提到页面上，每个想用这张图的页面都要重抄一遍面板。
 */
export default function Explorer() {
  const [sel, setSel] = useState<Sel>({ kind: "none" });
  const picked = sel.kind === "models" ? sel.ids : [];
  const cmp = picked.length === 2 ? compare(picked[0], picked[1]) : null;
  const nameOf = (id: string) => label(atlas.models.find((m) => m.id === id)!);
  const clipCaps = capsOf("clip");
  const capOf = (id: string) => atlas.capabilities.find((x) => x.id === id)!;

  return (
    <div className="hidden md:flex flex-col gap-4">
      {/* 二部图是 SVG，字号在自己的坐标系里（模型名 19、能力名 18），比真值表 13~15px
          大一圈，SVG 又按容器宽放大显示，于是看着明显更大、和上面两张表不协调。
          外框保持满宽（与真值表框对齐），把 SVG 收窄居中等比缩小 —— 不动内部比例，
          字号视觉就落回真值表量级。 */}
      <div className="bg-card border border-rule rounded-xl rounded-xl p-4">
        <div className="max-w-[900px] mx-auto">
          <Bipartite sel={sel} onSel={setSel} />
        </div>
      </div>

      <section className="min-h-[110px]">
        {sel.kind === "none" && (
          <p className="text-muted text-[15px]">
            点右边一个<b className="text-ink">能力</b>，看谁实现了它；
            点左边<b className="text-ink">两个模型</b>，看它们的共有与独有。
          </p>
        )}

        {sel.kind === "cap" && (() => {
          const c = capOf(sel.id);
          return (
            <div>
              <h3 className="text-[22px] font-semibold mb-1">
                {c.zh}
                <span className="text-muted text-[15px] font-normal ml-3">{c.name}</span>
              </h3>
              <Link href={capHref(sel.id)} className="text-muted text-[14px] underline hover:text-ink">
                打开这一项的独立页面 →
              </Link>
              {modelsOf("clip").map((m) => (
                <div key={m.id} className="border-t border-rule pt-3 pb-1 mt-2">
                  <p className="font-semibold text-[16px]">
                    {label(m)} <span className="text-muted font-normal text-[13px]">{vendorName(m)}</span>
                  </p>
                  <Fact m={m.id} c={sel.id} label={c.zh} />
                </div>
              ))}
            </div>
          );
        })()}

        {sel.kind === "models" && picked.length === 1 && (
          <div>
            <h3 className="text-[22px] font-semibold mb-1">{nameOf(picked[0])}</h3>
            <p className="text-muted text-[14px] mb-2">再点一个模型即可对比。</p>
            {clipCaps.map((c) => (
              <Fact key={c.id} m={picked[0]} c={c.id} label={c.zh} />
            ))}
          </div>
        )}

        {cmp && (
          <div>
            <h3 className="text-[22px] font-semibold mb-3">
              {nameOf(picked[0])} <span className="text-muted font-normal">vs</span> {nameOf(picked[1])}
            </h3>
            <div className="grid grid-cols-3 gap-5 text-[15px]">
              {[
                { t: `共有 ${cmp.both.length} 项`, cls: "text-yes-ink", ids: cmp.both },
                { t: `只有 ${nameOf(picked[0])}`, cls: "text-ink", ids: cmp.onlyA },
                { t: `只有 ${nameOf(picked[1])}`, cls: "text-ink", ids: cmp.onlyB },
              ].map((col) => (
                <div key={col.t}>
                  <p className={`font-semibold mb-2 ${col.cls}`}>{col.t}</p>
                  <ul className="text-muted leading-relaxed">
                    {col.ids.length ? col.ids.map((c) => <li key={c}>{capOf(c).zh}</li>) : <li>—</li>}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
