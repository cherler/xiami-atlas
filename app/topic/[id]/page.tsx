import type { Metadata } from "next";
import { atlas } from "@/lib/atlas";
import BackLink from "@/components/BackLink";
import ReportIssue from "@/components/ReportIssue";
import TopicView from "@/components/TopicView";

/**
 * 专项页外壳。**内容逐层展开，交互层在 `components/TopicView.tsx`。**
 *
 * 这一页的分类轴被否过三次，每次根因不同，都记在 TopicView 的文件头里：
 * 「写成了教程」→「所有信息摆给所有人」→「不要对比、不要片型、步骤」。
 * 现在按开源项目的类型分 tab，页面只干一件事：把人送进项目拆解页。
 */
export function generateStaticParams() {
  return atlas.topics.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const t = atlas.topics.find((x) => x.id === id);
  return t ? { title: t.zh, description: t.intro.replace(/\*\*/g, "").slice(0, 110) } : {};
}

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = atlas.topics.find((x) => x.id === id);
  if (!t) return null;
  return (
    <main className="max-w-[1240px] mx-auto px-5 pb-16">
      {/*
        * **专项页的「返回」必须写死回首页，不能用 `router.back()`。**
        *
        * 专项只在首页那一栏列出（跨卷，挂不进任何一个方向）。而它有下级 ——
        * 项目拆解页。从下级点「← AI 游戏制作」走上来之后，若这里还按历史返回，
        * 就正好弹回刚才那个项目页：两页之间来回转，出不去。
        * 负责人 2026-08-17 撞到并截图。
        */}
      <BackLink href="/" zh="首页" />
      <TopicView t={t} />
      <div className="border-t border-rule pt-5 mt-6 text-[12px] text-muted max-w-[96ch]">
        <p className="mb-2">
          许可证、星数增速、停更月数、门槛来自仓库原文，点得开核对；
          <b className="text-ink">优势 / 局限 / 不适用是判断</b>。
        </p>
        <ReportIssue />
      </div>
    </main>
  );
}
