import type { Metadata } from "next";
import Link from "next/link";
import ScenarioBoard from "@/components/ScenarioBoard";
import AppJump from "@/components/AppJump";
import { applicationResources, atlas } from "@/lib/atlas";
import { domainOf } from "../dom";

export async function generateMetadata(
  { params }: { params: Promise<{ domain: string }> },
): Promise<Metadata> {
  const d = domainOf((await params).domain);
  return { title: `${d.name} · 我想做什么`, description: "从真实应用出发，找到关联的公开项目、Skill、课程和文档。" };
}

/**
 * 「场景」这张图（docs/北极星.md，方案 §10 Skill 第一等公民）。
 *
 * 能力术语（首尾帧/角色参考…）是给我们对齐数据用的；场景（能做什么事）才是给
 * 用户看的。这一页回答的就是那句「我这事儿谁能干」。数据全部现成，零点击。
 */
export default async function ScenarioPage({ params }: { params: Promise<{ domain: string }> }) {
  const d = domainOf((await params).domain);
  const apps = atlas.applications.filter((x) => (x.domain ?? "video") === d.id);
  const n = apps.length;
  const resourceCount = apps.reduce((sum, app) => sum + applicationResources(app).length, 0);
  const skillCount = new Set(apps.flatMap((app) => app.skills)).size;
  return (
    <main className="max-w-[1400px] mx-auto px-6 py-8">
      <header className="flex flex-col gap-4 border-b-[2.5px] border-ink pb-2.5 md:flex-row md:items-end">
        <h1 className="text-[38px] leading-[1.05] font-bold tracking-[-.01em]">
          {d.name} · 我想做什么
          <span className="block text-[15px] leading-[1.3] font-normal text-muted mt-2">
            {n} 个真实应用 —— 先看成品，再看它对应的公开项目、Skill、课程与文档
          </span>
        </h1>
        <div className="text-left text-[12px] leading-[1.7] text-muted md:ml-auto md:text-right md:whitespace-nowrap">
          数据截至 {atlas.generated_at}
          <br />
          关联能力 {skillCount} 项
          <br />
          公开资源关联 {resourceCount} 条
        </div>
      </header>

      {n ? (
        <>
          {/* 跳转条紧贴页头之下、内容之上 —— 它是这一页的目录，不是卡片的一部分 */}
          <AppJump apps={apps.map((x) => ({ id: x.id, zh: x.zh }))} />
          <div className="mt-4">
            <ScenarioBoard domain={d.id} />
          </div>
        </>
      ) : (
        /* 应用层是逐个人工定的，图像方向还一个都没定 —— 说清楚，不摆空板子 */
        <div className="mt-6 border border-unknown/40 bg-unknown/6 p-5 text-[14px] leading-relaxed">
          <b>这个方向还没定应用。</b>
          {/* 别在这儿举别的方向的应用名当例子 —— 方向隔离检查会（正确地）判成串味。
              这是我们自己的措辞，改词就好，不该去放宽检查。 */}
          {" "}应用是「用户要交付的东西」，不是能力名的同义改写；
          得逐个从行业用词里核出来 —— {d.name}这边还一个都没定。
          <b className="text-ink"> 空着，不摆一块空板子装样子。</b>
        </div>
      )}

      <p className="mt-6 text-[12px] text-muted">
        这里的「应用」是用户要交付的东西，不是能力名的同义改写；应用层不下效果或适用性结论，限制与核验日期请进入关联 Skill 查看。
        <Link href="/method#states" className="underline ml-1 hover:text-ink">口径 →</Link>
      </p>
    </main>
  );
}
