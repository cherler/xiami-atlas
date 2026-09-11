"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Rich } from "./Fact";
import { atlas, type Topic, type TopicBasic, type TopicBasicPart, type TopicProject, type TopicWork } from "@/lib/atlas";
import { topicProjectHref } from "@/lib/slug";

/**
 * 专项页的交互层。**这一页是一份按类型分好的开源项目名册，重心在项目拆解。**
 *
 * ## 分类轴换了三次，前两次都被否
 *
 * 1. 「这一步归谁」（自持 / 一半 / 平台）——「其实那个不是很重要」
 * 2. 「做视频的九道工序」——「不要对比、不要片型、步骤」
 * 3. 现在：**按开源项目的类型**（负责人 2026-08-16）
 *
 * > 「一页内容太长太多了，在制作页的最上面，加几个 tab 页，按类别划分开源项目或内容。」
 * > 「就按开源项目的类型，做不同的 tab 页，然后再跳转项目拆解页、教程等。」
 * > 「重心还是在项目拆解。」
 *
 * 前两个轴共同的毛病是**它们回答的不是读者的问题**。按归属分，读者得先认领一种身份；
 * 按工序分，读者得先把自己的活拆成九步。按类型分不用 —— 想配音就点声音，
 * 三个项目摆在那儿，挑一个点进去。
 *
 * ## 一页只干一件事：把人送进项目页
 *
 * 那些条状图（片型 × 步骤、九步逐步比、整包篇、四张属性图）全撤了。
 * 它们回答的是「这一堆里选哪个」，而定下来的重心是「它是怎么工作的、我能改哪里」——
 * 后者是一份要读十几分钟的东西，只能在项目页里给。这一页负责把人准确地送到那一页。
 *
 * 九步与片型矩阵的**数据仍在** `atlas.json` 里，项目页靠 `decisions` 结网；
 * 只是不再当这一页的骨架。
 *
 * ## 分 tab 但不藏内容
 *
 * 七类全部渲染进 DOM，切换只是 `hidden`。静态导出的页面如果只吐当前 tab，
 * 另外六类在源码里就不存在了 —— 搜索引擎和不跑 JS 的读者会看到一页残页。
 */

/** 可点的东西只有这一种长相。加 `→`、hover 变色，此外一律不可点。 */
function Go({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) {
  const cls = `inline-flex items-center gap-1 hover:text-yes-ink ${className}`;
  const inner = <>{children}<span className="text-hatch shrink-0">→</span></>;
  return href.startsWith("http")
    ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
    : <Link href={href} className={cls}>{inner}</Link>;
}

const LIC = {
  permissive: { zh: "可商用", cls: "border-yes text-yes-ink" },
  copyleft: { zh: "传染性许可", cls: "border-chip-warm-ink text-chip-warm-ink" },
  noncommercial: { zh: "不可商用", cls: "border-no text-no" },
  restricted: { zh: "有条件商用", cls: "border-chip-warm-ink text-chip-warm-ink" },
} as const;

/**
 * 星数怎么显示。**「星/月」对一个刚开源两周的仓库是假精确** ——
 * 6233 星除以 0.56 个月得一万一，那不是速度，是把冷启动的爆发外推成了常态。
 * 负责人 2026-08-16：「要把 star 和发布时间结合起来看。」
 * 所以不满两个月的仓库改说「多少星 · 开源多少天」，把判断留给读者。
 */
const YOUNG_DAYS = 60;
function stars(p: TopicProject) {
  /** 基准日取数据自己的口径日，不取 `Date.now()` —— 客户端组件里读当前时间会和预渲染对不上。 */
  const days = p.created_at
    ? Math.floor((Date.parse(atlas.generated_at) - Date.parse(p.created_at)) / 86400000) : null;
  if (days != null && days < YOUNG_DAYS) return `${p.stars} 星 · 开源 ${days} 天`;
  return p.stars_per_month != null ? `${p.stars_per_month} 星/月` : `${p.stars} 星`;
}

/** 一站式专用：画面到底从哪来。**这是整包这一类的分水岭**，不是可有可无的标签。 */
const ENGINE = {
  stock: "画面来自检索素材库",
  yours: "画面来自你自己的素材",
  cloud: "画面来自云端 API",
  local: "画面来自本地权重",
} as const;

function Chip({ cls = "border-rule text-muted", children }: { cls?: string; children: React.ReactNode }) {
  return <span className={`text-[11px] border rounded-full px-2 py-0.5 whitespace-nowrap ${cls}`}>{children}</span>;
}

/**
 * 一个项目一张卡。**卡是拆解页的引子，不是拆解页的替代品。**
 *
 * 所以卡上只放决定「点不点进去」的东西：它干什么、能不能商用、还活着吗、
 * 我的显卡跑不跑得动、它靠什么做到的。剩下的全在拆解页。
 */
function ProjectCard({ p, topic }: { p: TopicProject; topic: string }) {
  const stale = (p.stale_months ?? 0) >= 12;
  return (
    /*
     * `scroll-mt` 是给跳转条留的：不留这一截，锚点落位会被顶栏盖住半张卡。
     *
     * **停更超一年的整卡降一档**：底色压暗一点、内容稍微退后。
     * 不是隐藏 —— 它还得读得清（ControlNet 那种量级的东西不能藏），
     * 只是扫过去时不该和在维护的项目一样跳出来。
     */
    <article id={`c-${p.id}`} data-count-item
      className={`border rounded-xl px-4 py-4 sm:px-5 sm:py-5 scroll-mt-28 ${
        stale ? "border-rule/60 bg-card/40" : "border-rule"
      }`}>
      <div className="flex items-baseline gap-2.5 flex-wrap mb-2">
        <h3 className="text-[17px] tracking-tight">
          <Link href={topicProjectHref(topic, p.id)} className="hover:text-yes-ink">{p.zh}</Link>
        </h3>
        <Chip cls={LIC[p.license_class].cls}>{p.license}　{LIC[p.license_class].zh}</Chip>
        <Chip cls={stale ? "border-no text-no" : "border-yes text-yes-ink"}>
          {stale ? `停更 ${p.stale_months} 个月 · 存量` : "在维护"}
        </Chip>
        <Chip>{stars(p)}</Chip>
        {p.engine && <Chip cls="border-chip-warm-ink text-chip-warm-ink">{ENGINE[p.engine]}</Chip>}
      </div>

      {/* 许可证的附加条件单独一行 —— 塞进圆标会把那一行拉成横幅。 */}
      {p.license_note && (
        <p className="text-[11.5px] text-chip-warm-ink leading-relaxed max-w-[88ch] -mt-1 mb-2">
          许可证附加条件：<Rich text={p.license_note} />
        </p>
      )}
      <p className="text-[13.5px] text-ink leading-relaxed max-w-[88ch]">{p.scope}</p>
      {/* 特点标签：**只写「它凭什么不一样」**，和上面那排圆标（许可证/活不活/星数）不重复。 */}
      {!!p.tags?.length && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {p.tags.map((x) => (
            <span key={x} className="text-[11.5px] bg-card border border-rule rounded-md px-2 py-0.5">{x}</span>
          ))}
        </div>
      )}

      {/* 宽屏上「靠什么做到」和「门槛」并排 —— 竖着排会让卡里空出一大片右侧。 */}
      <dl className="mt-3.5 space-y-1.5 xl:space-y-0 xl:grid xl:grid-cols-2 xl:gap-x-9">
        <div className="sm:flex sm:gap-3">
          <dt className="text-[11.5px] text-muted sm:w-[6em] sm:shrink-0 sm:text-right">靠什么做到</dt>
          <dd className="text-[12.5px] text-muted leading-relaxed max-w-[84ch]"><Rich text={p.control} /></dd>
        </div>
        <div className="sm:flex sm:gap-3">
          <dt className="text-[11.5px] text-muted sm:w-[6em] sm:shrink-0 sm:text-right xl:w-[3.5em]">门槛</dt>
          <dd className="text-[12.5px] text-muted leading-relaxed max-w-[84ch]"><Rich text={p.hw} /></dd>
        </div>
      </dl>

      <div className="mt-4 pt-3 border-t border-rule flex items-center gap-4 flex-wrap text-[12.5px]">
        <Go href={topicProjectHref(topic, p.id)} className="text-ink font-bold">项目拆解</Go>
        <Go href={`${topicProjectHref(topic, p.id)}#hands`} className="text-muted">上手步骤</Go>
        {/* 教程数写在链接上 —— **没有教程就不给这条路**，比点进去看空页面诚实。 */}
        {!!p.tutorials?.length && (
          <Go href={`${topicProjectHref(topic, p.id)}#tutorials`} className="text-muted">
            教程 {p.tutorials.length}
          </Go>
        )}
        <Go href={p.url} className="text-muted">仓库</Go>
        {!!p.diagrams?.length && (
          <span className="ml-auto text-[11px] text-hatch tnum">{p.diagrams.length} 张图</span>
        )}
      </div>
    </article>
  );
}

/**
 * 一部作品。**这一栏的价值全在「管线是公开的」这一点上** ——
 * 所以卡上最显眼的不是片名，是它用了什么、以及那个说法出自哪里。
 * 没有出处的作品不收，所以每张卡底下一定有链接。
 */
const OPEN = {
  closed: { zh: "闭源平台", cls: "border-no text-no" },
  open: { zh: "全开源", cls: "border-yes text-yes-ink" },
  mixed: { zh: "开源 + 平台", cls: "border-chip-warm-ink text-chip-warm-ink" },
} as const;

function WorkCard({ w }: { w: TopicWork }) {
  return (
    <article data-count-item className="border border-rule rounded-xl px-4 py-4 sm:px-5 sm:py-5">
      <div className="flex items-baseline gap-2.5 flex-wrap mb-2">
        <h3 className="text-[17px] tracking-tight">{w.zh}</h3>
        <Chip>{w.year}</Chip>
        <Chip cls={OPEN[w.open].cls}>{OPEN[w.open].zh}</Chip>
      </div>
      {/* 宽屏并排 —— 两条都短，竖着排等于白白空掉右半张卡。 */}
      <dl className="space-y-1.5 mb-3 xl:space-y-0 xl:grid xl:grid-cols-2 xl:gap-x-9">
        <div className="sm:flex sm:gap-3">
          <dt className="text-[11.5px] text-muted sm:w-[4em] sm:shrink-0 sm:text-right">制作方</dt>
          <dd className="text-[12.5px] text-ink leading-relaxed max-w-[84ch]">{w.maker}</dd>
        </div>
        <div className="sm:flex sm:gap-3">
          <dt className="text-[11.5px] text-muted sm:w-[4em] sm:shrink-0 sm:text-right">用了什么</dt>
          <dd className="text-[12.5px] text-ink leading-relaxed max-w-[84ch]">{w.stack}</dd>
        </div>
      </dl>
      <p className="text-[12.5px] text-muted leading-relaxed max-w-[88ch]"><Rich text={w.note} /></p>
      <div className="mt-4 pt-3 border-t border-rule flex items-center gap-4 flex-wrap text-[12px]">
        {w.src.map((s) => <Go key={s.url} href={s.url} className="text-muted">{s.title}</Go>)}
        <span className="ml-auto text-[11px] text-hatch">核验 {w.verified_at}</span>
      </div>
    </article>
  );
}

/**
 * 一组入门读物。**这一栏是索引不是教材** —— 每条只回答「它解决你哪个困惑」，
 * 剩下的交给原文。
 *
 * ## 层级是这一版重做的重点
 *
 * 上一版把十四组塞进三列，结果是**一堵字墙**：13 条的组和 3 条的组挤在一起、
 * 组标题被截成两行、每条里标题/说明/为什么/代表作四段一个粗细。
 * 负责人 2026-08-17：「很混乱、没用层级、且全是文字。」
 *
 * 现在：**一组占满一行**（标题横贯，一眼看得出分组），组内的条目再分列。
 * 条目内部三档分明 —— 标题（粗）→ 为什么好看（正文色，这是主角）→
 * 它解决什么困惑（小、灰）→ 代表作（一枚可点的片名）。
 */
function BasicGroup({ b, no }: { b: TopicBasic; no: number }) {
  return (
    <section id={`b-${b.id}`} className="scroll-mt-28">
      <div className="flex items-baseline gap-2 mb-0.5">
        {/* 组编号只做定位用，所以细、小、不抢戏 —— 抢戏的是段编号。 */}
        <span className="text-[11px] text-hatch tnum shrink-0">{no}</span>
        <h4 className="text-[15px] tracking-tight">{b.zh}</h4>
        <span className="text-[10.5px] text-hatch tnum">{b.items.length}</span>
      </div>
      <p className="text-[11.5px] text-muted leading-relaxed max-w-[88ch] mb-3 pl-[1.6em]">
        <Rich text={b.intro} />
      </p>
      {/*
        * **一条一张卡。** 上一版是两列纯文字流 —— 层级对了、也不长了，
        * 但每条没有边界，眼睛还是把它们糊成一片。负责人 2026-08-17：
        * 「你可以用列表、卡片等方式来布局那些知识点吗。」
        *
        * 卡是这一页别处已经在用的语言（项目卡、作品卡），这里沿用同一种 ——
        * 而且这一层现在**不套框**：组只有一条标题横线，卡是唯一的边框。
        */}
      <ul className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 pl-[1.6em]">
        {b.items.map((it) => (
          <li key={it.url} data-count-item
            className="border border-rule rounded-lg px-3.5 py-3 flex flex-col">
            <a href={it.url} target="_blank" rel="noopener noreferrer"
              className="text-[13px] font-bold leading-snug hover:text-yes-ink">
              {it.title}<span className="text-hatch ml-1">↗</span>
            </a>
            <p className="text-[10.5px] text-hatch mt-0.5">{it.site}·{it.lang === "zh" ? "中文" : "英文"}</p>
            <p className="text-[12px] text-ink leading-relaxed mt-2 flex-1"><Rich text={it.note} /></p>
            {(it.example || it.why) && (
              <div className="mt-2.5 pt-2 border-t border-rule flex items-baseline gap-3 flex-wrap">
                {/* 标签得留着 —— 光一个绿色片名，读者不一定知道那是「代表作」。 */}
                {it.example && (
                  <span className="text-[11.5px]">
                    <span className="text-hatch mr-1.5">代表作</span>
                    <Go href={it.example.url} className="text-yes-ink">{it.example.zh}</Go>
                  </span>
                )}
                {it.why && (
                  <details className="group text-[11.5px] w-full">
                    <summary className="cursor-pointer text-muted hover:text-yes-ink list-none marker:content-['']">
                      为什么好看<span className="ml-1 group-open:hidden">▾</span>
                      <span className="ml-1 hidden group-open:inline">▴</span>
                    </summary>
                    <p className="text-[12px] text-muted leading-relaxed mt-1.5"><Rich text={it.why} /></p>
                  </details>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * 一大段。**这一层是这次重做加出来的** ——
 * 原来十四组一个重量并排，读者没有任何落脚点。
 * 现在段号（一/二/三）够大、够粗，一眼能把整栏切成三块。
 */
function BasicPart({ part, groups }: { part: TopicBasicPart; groups: TopicBasic[] }) {
  return (
    <section id={`p-${part.id}`} className="scroll-mt-28">
      <div className="border-b-2 border-ink pb-2 mb-6">
        <div className="flex items-baseline gap-3">
          <span className="text-[26px] leading-none font-bold tracking-tight">{part.no}</span>
          <h3 className="text-[21px] tracking-tight">{part.zh}</h3>
          <span className="text-[11px] text-hatch tnum ml-auto">
            {groups.length} 组 · {groups.reduce((n, g) => n + g.items.length, 0)} 条
          </span>
        </div>
        <p className="text-[12.5px] text-muted leading-relaxed max-w-[92ch] mt-1.5">
          <Rich text={part.intro} />
        </p>
      </div>
      <div className="space-y-8">
        {groups.map((b, i) => <BasicGroup key={b.id} b={b} no={i + 1} />)}
      </div>
    </section>
  );
}

/**
 * tab 内的快捷跳转条。
 *
 * 负责人 2026-08-17：「整个专项页不同 tab 下，好像都没有快捷访问通道？」
 * 确实没有 —— 顶上那排 tab 只能换类，换进来之后要找「法与权」得滚到底。
 * 组多的 tab（视听语言 14 组、模型与组件 7 节）必须给一排锚点。
 *
 * **同一天第二次被指出来**：「一站式 tab 页里，没有快捷导航」。
 * 上一版只给**有小节**的 tab 发锚点条，而一站式与 Agent 那两个 tab 是平铺的 ——
 * 于是修的那次它们一个都没拿到。**「有小节」不是「需要导航」的判据，条数才是。**
 * 平铺的 tab 就直接跳到项目卡本身（`#c-<id>`）。
 *
 * `n` 可以不给：小节跳转带个数有意义，跳到某一张卡带个数是噪音。
 */
function Jump({ items, label, href }: {
  items: { id: string; zh: string; n?: number }[]; label?: string; href?: string;
}) {
  if (!label && items.length < 3) return null;
  return (
    <nav className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5 mb-2 last:mb-6">
      {label && href
        /* 段名不许折行 —— 折了就和后面那排组名混成一团，跳转条本身反倒成了噪音。 */
        ? <a href={href} className="text-[12px] font-bold w-[12em] shrink-0 whitespace-nowrap hover:text-yes-ink">{label}</a>
        : <span className="text-[11px] text-hatch tracking-wider">跳到</span>}
      {items.map((x) => (
        <a key={x.id} href={`#${x.id}`}
          className="text-[12px] text-muted hover:text-yes-ink whitespace-nowrap">
          {x.zh}{x.n !== undefined && <span className="text-hatch tnum ml-1">{x.n}</span>}
        </a>
      ))}
    </nav>
  );
}

export default function TopicView({ t }: { t: Topic }) {
  const groups = t.groups;
  const [tab, setTab] = useState(groups[0].id);

  /** 深链：`#g-sound` 直接落到声音那一类。分享一个 tab 得能分享得出去。 */
  useEffect(() => {
    const read = () => {
      const g = location.hash.replace(/^#g-/, "");
      if (g && groups.some((x) => x.id === g)) setTab(g);
    };
    read();
    addEventListener("hashchange", read);
    return () => removeEventListener("hashchange", read);
  }, [groups]);

  const pick = (id: string) => {
    setTab(id);
    history.replaceState(null, "", `#g-${id}`);
  };

  /**
   * **停更超一年的沉到本节最后。**
   *
   * 负责人 2026-08-18：「这个要降级」。理由很直接 ——
   * 一个 34068 星、停更 30 个月的项目（ControlNet）排在第一位，
   * 读者会把它当成现在该用的东西。**星数是存量，停更才是现状。**
   *
   * 但不删：这类项目有历史地位，而且很多现存工作流还挂在它们上面。
   * 所以是**降级不是移除** —— 沉到底、卡片降一档，一眼看出它是存量。
   *
   * ⚠️ 组内保持原有相对顺序（`stable sort`），别顺手把人工排的次序打乱。
   */
  const STALE = 12;
  const of = (g: string, sub?: string) =>
    t.projects
      .filter((p) => p.group === g && (sub === undefined || p.sub === sub))
      .slice()
      .sort((a, b) => Number((a.stale_months ?? 0) >= STALE) - Number((b.stale_months ?? 0) >= STALE));
  /** 这个 tab 里有没有小节。有就分节渲染，没有就平铺。 */
  const subsOf = (g: string) =>
    (t.subgroups ?? []).filter((sg) => t.projects.some((p) => p.group === g && p.sub === sg.id));
  /** 一个 tab 里有几条 —— 项目类数项目，作品类数作品。 */
  const countOf = (g: { id: string; kind?: string }) =>
    g.kind === "works" ? (t.works?.length ?? 0)
      : g.kind === "basics" ? (t.basics ?? []).reduce((n, b) => n + b.items.length, 0)
        : of(g.id).length;
  const diagrams = t.projects.reduce((n, p) => n + (p.diagrams?.length ?? 0), 0);

  return (
    <div>
      <header className="pt-12 pb-8 sm:pt-16">
        <p className="text-[11px] tracking-[0.2em] text-yes-ink font-bold mb-4">专项研究</p>
        <h1 className="text-[30px] sm:text-[40px] leading-[1.15] tracking-tight mb-4 max-w-[18ch]">{t.zh}</h1>
        <p className="text-[15px] text-muted leading-relaxed max-w-[84ch] mb-3">
          <Rich text={t.intro} />
        </p>
        {/* 规模从数据现算。写进 intro 的句子里，数据一涨它就成了错的。 */}
        <p className="text-[12px] text-hatch tnum">
          {groups.length} 类 · {t.projects.length} 个项目 · {diagrams} 张图
        </p>

      </header>

      {/*
        * 分类条。**它是这一页的导航，所以钉在顶上** ——
        * 页面本身还是很长（七类摊开十六个项目），滚下去还能换类才叫 tab。
        */}
      <div role="tablist" aria-label="项目类型"
        /* 只有下边框：粘住之后上边框正好压在导航条自己的下边框底下，画两条等于没画。 */
        className="sticky top-12 z-10 -mx-5 px-5 py-2.5 bg-paper border-b border-rule overflow-x-auto">
        <div className="flex gap-1.5 w-max">
          {groups.map((g) => {
            const on = g.id === tab;
            return (
              <button key={g.id} role="tab" aria-selected={on} onClick={() => pick(g.id)}
                className={`text-[13px] rounded-full px-3.5 py-1.5 border whitespace-nowrap ${
                  on ? "border-yes text-yes-ink bg-card font-bold" : "border-rule text-muted hover:text-ink"}`}>
                {g.zh}
                <span className="ml-1.5 text-[11px] tnum opacity-70">{countOf(g)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {groups.map((g) => (
        <section key={g.id} role="tabpanel" hidden={g.id !== tab} className="py-9">
          <h2 className="text-[22px] tracking-tight mb-1.5">{g.zh}</h2>
          {/* 一句话说完。**说明写长了不是啰嗦，是把内容顶到了第二屏。** */}
          <p className="text-[13px] text-muted leading-relaxed max-w-[92ch] mb-5"><Rich text={g.intro} /></p>
          {/* 换进这一类之后还得找得到东西 —— 组多的 tab 给一排锚点。 */}
          {g.kind === "basics"
            ? (t.basic_parts ?? []).map((pt) => (
              <Jump key={pt.id} label={`${pt.no}　${pt.zh}`} href={`#p-${pt.id}`}
                items={(t.basics ?? []).filter((b) => b.part === pt.id)
                  .map((b) => ({ id: `b-${b.id}`, zh: b.zh, n: b.items.length }))} />
            ))
            : (() => {
              /*
               * **跳哪一层，由「跳得动几下」决定，不由「有没有小节」决定。**
               *
               * 只有两个小节时，跳转条被 `Jump` 的「少于三条不显示」吞掉，
               * 于是「自动开发游戏」那个八张卡的 tab 一个锚点都没有 ——
               * 而它看起来只是「没有那一行」，不像出错。浏览器检查抓到的就是这个。
               *
               * 所以小节少于三个就退回跳卡片本身：读者要的是跳得过去，
               * 至于跳到的是小节标题还是卡，无所谓。
               */
              const subs = subsOf(g.id);
              return subs.length >= 3
                ? <Jump items={subs.map((sg) => ({ id: `s-${sg.id}`, zh: sg.zh, n: of(g.id, sg.id).length }))} />
                : <Jump items={of(g.id).map((p) => ({ id: `c-${p.id}`, zh: p.zh }))} />;
            })()}
          {/*
            * ⚠️ **`ch` 是按「0」这个字形量的，而一个汉字大约占 2ch。**
            *
            * 这一页的正文上限原来照拉丁文的习惯写成 46~52ch，落到中文上
            * **一行只剩二十几个字** —— 于是每段都被挤成一条窄带，右边空一大片。
            * 负责人 2026-08-16：「有没有觉得红框外围很空啊。为什么一定要挤在一起呢。」
            *
            * 所以中文正文的上限一律按「目标字数 × 2」来设：想要一行 40 字左右就写 84ch。
            * 卡本身不再另设宽度，跟着容器铺满。
            */}
          <div className="space-y-3">
            {g.kind === "works" ? (t.works ?? []).map((w) => <WorkCard key={w.id} w={w} />)
              : g.kind === "basics" ? null
                : subsOf(g.id).length
                  /*
                   * 24 个项目摊在一个 tab 里不分节就是一堵墙。
                   * 小节标题只做锚，不再重复一遍 tab 的说明。
                   */
                  ? subsOf(g.id).map((sg) => (
                    <section key={sg.id} id={`s-${sg.id}`} className="pt-2 scroll-mt-28">
                      <div className="border-b border-rule pb-2 mb-3">
                        <div className="flex items-baseline gap-2.5">
                          <h3 className="text-[17px] tracking-tight">{sg.zh}</h3>
                          <span className="text-[11px] text-hatch tnum">{of(g.id, sg.id).length} 个</span>
                        </div>
                        {/* 说明单独一行 —— 和标题挤在一起就得截断，截断等于没写。 */}
                        <p className="text-[12px] text-muted leading-relaxed max-w-[92ch] mt-1"><Rich text={sg.intro} /></p>
                      </div>
                      <div className="space-y-3">
                        {of(g.id, sg.id).map((p) => <ProjectCard key={p.id} p={p} topic={t.id} />)}
                      </div>
                    </section>
                  ))
                  : of(g.id).map((p) => <ProjectCard key={p.id} p={p} topic={t.id} />)}
          </div>
          {/* 常识五组两列并排 —— 每组本身不长，竖着排要滚很久才看得完。 */}
          {g.kind === "basics" && (
            <div className="space-y-14">
              {(t.basic_parts ?? []).map((pt) => (
                <BasicPart key={pt.id} part={pt}
                  groups={(t.basics ?? []).filter((b) => b.part === pt.id)} />
              ))}
            </div>
          )}
          {/* 「它解决你哪个困惑」是我们的判断，整组标一次，别每条都啰嗦。 */}
          {g.kind === "basics" && (
            <p className="mt-4 text-[11.5px] text-muted border-l-2 border-chip-warm-ink pl-2.5">
              每条下面的「它解决你哪个困惑」与「为什么这么拍好看」都是我们的判断；
              链接指向的原文和代表作条目才是出处。
            </p>
          )}
          {/* 查过没收的也要露面 —— 否则读者会以为我们漏了。 */}
          {g.kind === "works" && !!t.works_skipped?.length && (
            <div className="mt-6 border border-rule rounded-lg px-4 py-3.5 hatch">
              <p className="text-[11px] tracking-wider text-muted font-bold mb-2">查过，按规矩没收</p>
              <ul className="space-y-1.5">
                {t.works_skipped.map((w) => (
                  <li key={w.zh} className="text-[12.5px] text-muted leading-relaxed">
                    <b className="text-ink">{w.zh}</b>　{w.why}
                    <span className="text-hatch">　核验 {w.verified_at}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
