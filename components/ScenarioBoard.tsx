import Link from "next/link";
import {
  applicationResources,
  atlas,
  type Application,
  type ApplicationResource,
  type ApplicationResourceKind,
} from "@/lib/atlas";
// `Rich` 把数据里的 `**重点**` 渲染成 <b>。**全库都这么写重点**，
// 漏用不会报错，只会把星号原样印在页面上（手机端截图才发现「**直接对得上这件事**」）。
import { Rich } from "./Fact";
import ResourceFilter from "./ResourceFilter";

const KIND: Record<ApplicationResourceKind, { label: string; className: string }> = {
  project: { label: "项目", className: "bg-yes/10 text-yes-ink" },
  skill: { label: "Skill", className: "bg-ink/8 text-ink" },
  // 课程那枚是全站唯一的暖色标 —— 深色下写死的米黄会变成一块发光的方块，
  // 所以走令牌（globals.css 里有对应的深色值），不写死十六进制。
  course: { label: "课程", className: "bg-chip-warm text-chip-warm-ink" },
  docs: { label: "文档", className: "bg-chip-cool text-muted" },
};

function ResourceCard({ resource }: { resource: ApplicationResource }) {
  const kind = KIND[resource.kind];
  const source = atlas.sources[resource.src]?.name ?? resource.src;

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noreferrer"
      className="group block min-w-0 border border-rule bg-paper/60 px-3.5 py-3 hover:border-yes hover:bg-yes/5"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-[11px] px-1.5 py-0.5 ${kind.className}`}>{kind.label}</span>
        {/* 多条证据时每一行自己就带着 Skill 名，这里再列一遍是重复 —— 只报个数。 */}
        {resource.evidence.length === 1 && (
          <span className="text-[11px] text-muted truncate">来自 {resource.evidence[0].skill_zh}</span>
        )}
        {resource.evidence.length > 1 && (
          <span className="text-[11px] text-muted shrink-0">{resource.evidence.length} 项能力</span>
        )}
      </div>
      <p className="text-[14px] font-medium leading-snug group-hover:text-yes-ink">{resource.name} ↗</p>
      {/* 原文摘录与来源名是**引用**，不计入「我们自己说了多少话」的预算 ——
          和首页脚注同一条纪律（scripts/verify.mjs 里减的就是 [data-quote]）。
          多个 Skill 认领同一个仓库时，**每条原文都留着**：H3 一个链接同时是
          角色一致的 Ref2VA、首尾帧的 FL2VA、口播对口型的官方案例，
          只显示第一条会让口播剧看不到它真正需要的那句。 */}
      {resource.evidence.length > 1 ? (
        <ul data-quote className="text-[12px] text-muted leading-relaxed mt-1.5 flex flex-col gap-1">
          {resource.evidence.map((e) => (
            <li key={`${e.skill_id}-${e.quote}`} className="line-clamp-2">
              <span className="text-ink">{e.skill_zh}</span>：{e.quote}
            </li>
          ))}
        </ul>
      ) : (
        <p data-quote className="text-[12px] text-muted leading-relaxed mt-1.5 line-clamp-2">
          <Rich text={resource.note ?? resource.quote} />
        </p>
      )}
      {/**
        * 许可证三态：有原名就写原名；`null` 是「查过、作者确实没放」，红标并写清后果；
        * 字段缺失是「我们还没采」，走 ⬜ 那一档的灰。**后两者绝不能混** ——
        * 混了就会把 HunyuanVideo、Wan 这些有许可证的仓库标成「未授权使用」。
        *
        * **「传到 GitHub 上」不等于开源。** 没有 LICENSE 文件时默认保留全部版权，
        * GitHub 服务条款只授予查看与站内 fork，不授予使用、修改、再分发。
        * 但也**不能因此把项目藏起来** —— 那和留白一样是在假装没这东西。
        * 和 ⬜「官方没说」同一条纪律：标出来，别抹掉。
        */}
      <p className="text-[10.5px] leading-snug mt-2 flex items-center gap-1.5">
        {/**
          * **许可证只对「能拿走跑的东西」才是一个问题。**
          * 一篇官方教程页、一门公开课程没有「许可证」这回事 —— 在它们下面印
          * 「许可证未采」是把字段的缺席当成了一条缺口，属于分类错用；
          * 而且这几个字会在每一张文档卡上重复一遍，纯噪音。
          * 所以只有 project / skill 这两类才显示这一栏。
          */}
        {resource.kind === "project" || resource.kind === "skill" ? (
          resource.license ? (
            <span className="text-yes-ink shrink-0">{resource.license}</span>
          ) : resource.license === null ? (
            // 查过，作者确实没放 —— 这是一条事实，红着标
            <span className="shrink-0 px-1 bg-no/10 text-no font-medium">无许可证 · 未授权使用</span>
          ) : (
            // 我们还没采 —— 这是我们的缺口，不是对方的问题，用 ⬜ 那一档的灰
            <span className="shrink-0 text-unknown">许可证未采</span>
          )
        ) : null}
        <span data-quote className="text-muted truncate">{source}</span>
      </p>
    </a>
  );
}

function counts(resources: ApplicationResource[]) {
  return (Object.keys(KIND) as ApplicationResourceKind[]).map((kind) => ({
    kind,
    n: resources.filter((r) => r.kind === kind).length,
  }));
}

function ApplicationRow({ app }: { app: Application }) {
  const resources = applicationResources(app);
  const skillItems = app.skills
    .map((id) => atlas.skills.find((s) => s.id === id))
    .filter(Boolean);

  // `id` 供顶部跳转条用；`scroll-mt` = 全站导航 48 + 跳转条 40，
  // 少了它锚点会把标题正好停在两条吸顶栏底下 —— 跳过去看不见自己要找的那行。
  return (
    <article
      id={`app-${app.id}`}
      className="scroll-mt-[92px] border-t border-rule px-4 py-6 md:grid md:grid-cols-[280px_1fr] md:gap-8"
    >
      <div className="mb-6 md:mb-0">
        <p className="text-[11px] tracking-[.14em] uppercase text-yes-ink mb-2">应用 / {app.en}</p>
        <h2 className="text-[27px] font-bold leading-tight tracking-[-.02em]">{app.zh}</h2>
        <p className="text-[14px] text-muted leading-relaxed mt-2.5">{app.intro}</p>
        {!!app.aliases?.length && (
          <p className="text-[11.5px] text-muted mt-1.5">行业里也叫：{app.aliases.join(" / ")}</p>
        )}

        <div className="border border-rule bg-paper mt-5">
          <div className="px-3 py-2 border-b border-rule text-[11px] text-muted">输入 → 输出</div>
          <div className="px-3 py-3">
            <div className="flex flex-wrap gap-1.5">
              {app.inputs.map((input) => (
                <span key={input} className="text-[12px] border border-rule px-2 py-1 bg-card">
                  {input}
                </span>
              ))}
            </div>
            <div className="text-[16px] text-muted my-2">↓</div>
            <div className="text-[13px] text-yes-ink border-l-2 border-yes pl-2.5">{app.output}</div>
          </div>
        </div>

        {/**
          * ⚠️ **一个 Skill 都没有时，别只留一个光标题。**
          * 2026-08-13 AI 3D 上线当天看到的：标题「需要的能力」下面整片空白 ——
          * 读者分不清是**这个应用不需要能力**还是**页面坏了**。
          * 这一卷确实还没定 Skill，那就把这句话说出来。
          */}
        <div className="mt-5">
          <p className="text-[11px] text-muted mb-2">需要的能力</p>
          {skillItems.length === 0 && (
            <p className="text-[12px] text-muted leading-relaxed">
              这个方向还没定 Skill —— <b className="text-ink">是我们还没拆</b>，不是这件事不需要能力。
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {skillItems.map((skill) => (
              <Link
                key={skill!.id}
                href={`/skill/${skill!.id}`}
                className="text-[12px] px-2 py-1 bg-yes/8 text-yes-ink hover:bg-yes/15"
              >
                {skill!.zh} →
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-3 pb-3 border-b border-rule">
          <p className="text-[16px] font-semibold">公开路线</p>
          {/* 这排标签原来只是计数，长得像筛选器却点不动 —— 负责人 2026-08-12 直接去点了。
              **一个长得像按钮的东西不响应点击，比没有它更糟。** 现在交给客户端组件，
              卡片仍在这里（服务端）渲染好再传过去，不把 atlas 打包进前端。 */}
        </div>

        <ResourceFilter
          label={`${app.zh}公开资源列表`}
          counts={counts(resources).map(({ kind, n }) => ({ kind, label: KIND[kind].label, n }))}
          items={resources.map((resource) => ({
            kind: resource.kind,
            node: <ResourceCard key={resource.url} resource={resource} />,
          }))}
        />

      </div>
    </article>
  );
}

/**
 * 场景页现在以「应用」为入口：先问用户想做什么，再把公开实现路线接上。
 * 能力详情仍然保留在 /skill/[id]，但不再把能力换个词伪装成应用。
 */
/**
 * @param domain 只列这个方向的应用。**必须传** —— 之前直接读全局
 * `atlas.applications`，于是 /atlas/image/scenario 把 AI 短剧、数字人口播
 * 这些视频方向的应用一起列了出来。方向页算好了 `apps` 却没往下传，
 * 组件自己又取了一遍全局 —— **同一个值算两遍，第二遍必然被漏掉**，
 * 和之前 RelationGraph 能力列那次是同一个错法。
 */
export default function ScenarioBoard({ domain }: { domain: string }) {
  return (
    <div className="bg-card border border-rule rounded-xl rounded-xl rounded-xl">
      <div className="px-4 py-4 bg-yes/5 border-b border-rule flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-[11px] tracking-[.14em] uppercase text-yes-ink">Application Atlas</p>
          <p className="text-[18px] font-semibold mt-1">从一个真实产出，找到能走的公开路线</p>
        </div>
        {/* 排序与收录规则**全页只说一次**。原来它在六个应用下各印一遍 ——
            同一句话重复六遍不是强调，是噪音，出站验证的字数棘轮正是拿它报的红。 */}
        <p className="text-[12px] text-muted leading-relaxed max-w-[520px]">
          项目、Skill、课程、文档从关联能力自动汇总，按「项目 → Skill → 文档 → 课程」排，
          同类官方来源优先，不按 Star 做推荐结论。不导流收费平台；公开访问 ≠ 自动允许商用。
        </p>
      </div>
      {atlas.applications.filter((x) => (x.domain ?? "video") === domain).map((app) => <ApplicationRow key={app.id} app={app} />)}
    </div>
  );
}
