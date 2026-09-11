"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import flows from "@/data/flows.json";

/**
 * 页脚的「接下来」。**从 data/flows.json 渲染，不在每页手写链接** ——
 * 手写的迟早和动线对不上，而且改动线就得改十二个文件。
 *
 * 出口文案写的是**问题**，不是页面名：
 * 「去哪用、多少钱 →」而不是「前往 where 页」。
 * 读者关心的是自己的下一个问题，不是我们的信息架构。
 */
type Step = { page: string; q: string; exits: string[] };
type Flow = { id: string; name: string; steps: Step[] };

const LABEL: Record<string, string> = {
  "/": "从一个任务开始",
  "/tree": "谁在什么时候长出了什么",
  "/map": "谁和谁有关系",
  "/models": "看全部模型",
  "/changes": "最近变了什么",
  "/toolkit": "该去哪个站查",
  "/caveats": "下单前先看这几条",
  "/basics": "看不懂那些词",
};

export default function NextSteps() {
  const p = usePathname() ?? "/";
  const F = (flows as { flows: Flow[] }).flows;

  // 当前页在哪几条动线上出现过，各自的下一步是什么
  const out = new Map<string, string>();
  for (const f of F)
    for (const s of f.steps)
      if (s.page === p)
        for (const e of s.exits) {
          const nextQ = F.flatMap((x) => x.steps).find((x) => x.page === e)?.q;
          out.set(e, LABEL[e] ?? nextQ ?? e);
        }

  if (!out.size) return null;

  return (
    <section className="border-t border-rule mt-10 pt-5">
      <p className="text-muted text-[13px] mb-2">接下来</p>
      <div className="flex flex-wrap gap-2">
        {[...out.entries()].map(([href, zh]) => (
          <Link key={href} href={href}
            className="text-[15px] px-3 py-1.5 rounded-lg border border-rule hover:border-yes hover:text-yes">
            {zh} →
          </Link>
        ))}
      </div>
    </section>
  );
}
