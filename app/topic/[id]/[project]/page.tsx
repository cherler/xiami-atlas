import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import Link from "next/link";
import { Rich } from "@/components/Fact";
import { atlas, forkCoverage, type TopicProject } from "@/lib/atlas";
import { capHref, topicProjectHref } from "@/lib/slug";
import ReportIssue from "@/components/ReportIssue";

/**
 * 项目页。**项目是主角，一个项目一页。**
 *
 * ## 为什么从卡片改成独立页
 *
 * 上一版把项目做成专项页里的折叠卡：许可证、显存、几条优劣、一张架构图。
 * 负责人：「开源项目的拆解跟我想象中不太一样。」
 *
 * 诊断下来是**我把重心做成了索引** —— 那张卡回答的是「这几个里选哪个」，
 * 而定下来的重心是「它是怎么工作的、凭什么能把控制权还给我、我能改哪里」。
 * 后者是一份要读十几分钟的东西，塞不进一张卡，也不该被片型筛掉。
 *
 * ## 三层，缺一层就写缺
 *
 * 读懂层（架构 / 数据流 / 关键机制）→ 动手层（装它过哪几关 · 改哪个文件 ·
 * 坑在代码哪一处）→ 判断层（优势 / 局限 / 不适用）。
 * 前两层每条都要能指回文档或源码，第三层是我们的判断、可报错。
 *
 * ## 项目之间靠专项结网
 *
 * 每页顶上写它管哪几个决定、底下给同管这些决定的其它项目 ——
 * **单独看是一份解析，连起来是一张网**。
 */
export function generateStaticParams() {
  return atlas.topics.flatMap((t) => t.projects.map((p) => ({ id: t.id, project: p.id })));
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string; project: string }> },
): Promise<Metadata> {
  const { id, project } = await params;
  const p = atlas.topics.find((x) => x.id === id)?.projects.find((x) => x.id === project);
  return p ? { title: `${p.zh}｜开源项目解析`, description: p.scope.slice(0, 110) } : {};
}

const AUT_W = { local: { zh: "可下载到本地", ok: true }, api: { zh: "只能调接口", ok: false }, na: { zh: "不涉及模型权重", ok: null } };
const AUT_S = { yes: { zh: "可填", ok: true }, partial: { zh: "部分路径可填", ok: null }, no: { zh: "不可填", ok: false }, na: { zh: "不涉及", ok: null } };
const AUT_C = { "1": { zh: "一处", ok: true }, few: { zh: "几处", ok: null }, many: { zh: "牵一发动全身", ok: false } };

function AutonomyBox({ p }: { p: TopicProject }) {
  const a = p.autonomy;
  if (!a) return null;
  const rows = [
    { q: "权重在不在本地", ...AUT_W[a.weights] },
    { q: "种子能不能填", ...AUT_S[a.seed] },
    { q: "换掉它要动几处", ...AUT_C[a.swap] },
  ];
  return (
    <div className="border border-rule rounded-lg divide-y divide-rule">
      {rows.map((r) => (
        <div key={r.q} className="flex items-baseline gap-3 px-4 py-2.5">
          <span className="text-[12.5px] text-muted w-[9.5em] shrink-0">{r.q}</span>
          <b className={`text-[13px] ${r.ok === true ? "text-yes-ink" : r.ok === false ? "text-no" : "text-ink"}`}>
            {r.zh}
          </b>
        </div>
      ))}
      <p className="px-4 py-2 text-[12px] text-muted">{a.note}</p>
    </div>
  );
}

/** 四层取材，做到哪几层就亮哪几个 —— 没做到的画成斜纹，与真值表的 ⬜ 同一条语言。 */
const LAYERS = [
  { k: "docs", zh: "文档", note: "README 与官方文档" },
  { k: "wiki", zh: "代码结构", note: "DeepWiki 全部章节，由源码生成" },
  { k: "issue", zh: "踩过的坑", note: "高频 issue 与维护者回复" },
  { k: "bench", zh: "实测", note: "自己真跑过" },
] as const;

function LayerBadges({ layers }: { layers: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-5">
      {LAYERS.map((l) => {
        const on = layers.includes(l.k);
        return (
          <span key={l.k} title={l.note}
            className={`text-[11px] rounded-full px-2.5 py-0.5 border ${
              on ? "border-yes text-yes-ink" : "border-rule text-muted hatch"}`}>
            {l.zh}{on ? "" : " 未做"}
          </span>
        );
      })}
    </div>
  );
}

/**
 * 六节固定，目录与小节共用这份清单 —— 各写一份迟早漂开。
 *
 * **图排在最前面。** 这一页存在的理由是把一个开源项目讲清楚，
 * 而讲清楚一个项目最快的方式是先看它长什么样、数据怎么走，不是先读三段字。
 */
const SECS = [
  { id: "read", zh: "读懂层" },
  { id: "decisions", zh: "它管哪几个决定" },
  { id: "autonomy", zh: "自持能力" },
  { id: "hands", zh: "动手层" },
  { id: "tutorials", zh: "教程" },
  { id: "readme", zh: "项目自述" },
  /** 摆在「判断」之前 —— 它比判断硬：两侧都是原文，读者可以自己判。
   *  只有真记过对照的项目才有这一节，由 Toc 的 ids 过滤。 */
  { id: "conflict", zh: "自述与实测" },
  { id: "judge", zh: "判断" },
  { id: "siblings", zh: "相关项目" },
] as const;

/** 图种的配色。四类各自回答一类问题，颜色只用来区分，不表态好坏。 */
const KIND_CLS: Record<string, string> = {
  架构图: "border-yes text-yes-ink",
  流程图: "border-rule text-ink",
  时序图: "border-chip-warm-ink text-chip-warm-ink",
  工程图: "border-rule text-muted",
};

function Toc({ ids }: { ids: string[] }) {
  return (
    <nav className="hidden lg:block sticky top-16 self-start w-[132px] shrink-0 pt-24">
      <p className="text-[10.5px] tracking-[0.16em] text-muted font-bold mb-2.5">目录</p>
      <ul className="space-y-1.5 border-l border-rule">
        {SECS.filter((x) => ids.includes(x.id)).map((x) => (
          <li key={x.id}>
            <a href={`#${x.id}`}
              className="block text-[12.5px] text-muted hover:text-ink border-l-2 border-transparent hover:border-yes -ml-px pl-3 py-0.5">
              {x.zh}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * 星数怎么说。**「星/月」对一个刚开源两周的仓库是假精确** —— 把冷启动的爆发外推成了常态。
 * 不满两个月就直说「多少星 · 开源多少天」，判断留给读者。基准日取数据自己的口径日。
 */
function starsLabel(p: TopicProject) {
  const days = p.created_at
    ? Math.floor((Date.parse(atlas.generated_at) - Date.parse(p.created_at)) / 86400000) : null;
  if (days != null && days < 60) return `${p.stars} 星 · 开源 ${days} 天`;
  const k = `${(p.stars / 1000).toFixed(1)}k`;
  return p.stars_per_month ? `${k}　${p.stars_per_month} 星/月` : k;
}

/**
 * README 摘出可读的一截。
 *
 * 原文直接贴上来是不能看的：开头永远是一坨 `<p align="center">`、徽章图片和
 * 一行行的链接语法 —— **那部分是给 GitHub 页面看的装饰，不是给读者的信息。**
 * 所以先把装饰剥掉，再取前面一截。
 *
 * 剥的是**呈现层**（标签、徽章、图片、锚点语法），留的是句子本身。
 * 不做 markdown 渲染 —— 渲染意味着要处理别人 README 里的任意 HTML，
 * 那是安全面，也没必要：读者要的只是「它自己怎么介绍自己」。
 */
function readmeExcerpt(raw: string, limit = 3200): string | null {
  const text = raw
    .replace(/<!--[\s\S]*?-->/g, "")                     // 注释
    .replace(/<[^>]+>/g, "")                              // HTML 标签
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")                 // 图片
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")              // 链接留文字
    .replace(/^\s*[-*]\s*$/gm, "")                        // 空列表项
    .replace(/^#{1,6}\s+/gm, "")                           // 标题的井号（层级在这里没意义）
    .replace(/\*\*([^*]+)\*\*/g, "$1")                     // 加粗标记
    .replace(/`{1,3}/g, "")                                // 反引号
    .split("\n")
    .filter((l) => !/^\s*[|:\-\s]+$/.test(l))              // 表格分隔线
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (text.length < 40) return null;                      // 剥完什么都不剩：不如不显示
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}\n\n……（后略，见原文）` : text;
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="py-10 border-t border-rule scroll-mt-16">
      <h2 className="text-[19px] tracking-tight mb-5">{title}</h2>
      {children}
    </section>
  );
}

const LIC = {
  permissive: { zh: "可商用", cls: "border-yes text-yes-ink" },
  copyleft: { zh: "传染性许可", cls: "border-chip-warm-ink text-chip-warm-ink" },
  noncommercial: { zh: "不可商用", cls: "border-no text-no" },
  /** 允许商用，但许可证里写了地区或规模门槛 —— 具体条件写在 `license` 字段里。 */
  restricted: { zh: "有条件商用", cls: "border-chip-warm-ink text-chip-warm-ink" },
} as const;

export default async function ProjectPage({ params }: { params: Promise<{ id: string; project: string }> }) {
  const { id, project } = await params;
  const t = atlas.topics.find((x) => x.id === id);
  const p = t?.projects.find((x) => x.id === project);
  if (!t || !p) return null;

  /**
   * README 从 `data/readme/` 读，**不在构建时联网** ——
   * 联网会让「同一个 commit 构建两次出同样的页」这条不再成立。
   */
  let readme: string | null = null;
  try {
    readme = readmeExcerpt(readFileSync(`data/readme/${p.id}.md`, "utf8"));
  } catch { /* 没抓到就不显示这一节 */ }

  const svgs: Record<string, string> = {};
  for (const d of p.diagrams ?? []) {
    try { svgs[d.id] = readFileSync(`public/diagrams/${d.id}.svg`, "utf8"); } catch { /* 少一张图，不挂页 */ }
  }
  const mine = p.decisions.map((did) => t.decisions.find((d) => d.id === did)).filter(Boolean);
  /** 结网：同样管这些决定的其它项目。 */
  const siblings = t.projects.filter((x) => x.id !== p.id && x.decisions.some((d) => p.decisions.includes(d)));
  /** 这个项目有没有被记过一条「自述与实测」的对照（见 lib/claims.ts 与 /claims 页）。 */
  const conflict = (t.conflicts ?? []).find((c) => c.project === p.id);

  return (
    <main className="max-w-[1240px] mx-auto px-5 pb-16 lg:flex lg:gap-9">
      <Toc ids={[
        "decisions", "autonomy",
        ...(p.diagrams?.length || p.arch ? ["read"] : []),
        "hands", "tutorials", "readme",
        ...(conflict ? ["conflict"] : []),
        "judge",
        ...(siblings.length ? ["siblings"] : []),
      ]} />
      <div className="min-w-0 flex-1">
      <nav className="pt-5 text-[12.5px] text-muted">
        <Link href={`/topic/${t.id}`} className="hover:text-ink underline">← {t.zh}</Link>
      </nav>

      <header className="pt-8 pb-9">
        <p className="text-[11px] tracking-[0.2em] text-yes-ink font-bold mb-3">开源项目解析</p>
        <h1 className="text-[32px] leading-tight tracking-tight mb-3">{p.zh}</h1>
        <p className="text-[14.5px] text-muted leading-relaxed max-w-[84ch] mb-4">{p.scope}</p>
        {/*
          * 特点标签。**摆在许可证那一排之上** —— 读者先想知道「它特别在哪」，
          * 再去关心能不能商用。这一排里没有任何一条和下面的圆标重复。
          */}
        {!!p.tags?.length && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {p.tags.map((t) => (
              <span key={t} className="text-[12px] bg-card border border-rule rounded-md px-2 py-1">{t}</span>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2 items-center text-[11.5px]">
          <span className={`border rounded-full px-2.5 py-0.5 ${LIC[p.license_class].cls}`}>
            {p.license}　{LIC[p.license_class].zh}
          </span>
          <span className="border border-rule rounded-full px-2.5 py-0.5 text-muted tnum">★ {starsLabel(p)}</span>
          {p.stale_months != null && (
            <span className={`border rounded-full px-2.5 py-0.5 tnum ${
              p.stale_months >= 12 ? "border-no text-no" : "border-yes text-yes-ink"}`}>
              {p.stale_months >= 12 ? `停更 ${p.stale_months} 个月` : "在维护"}
            </span>
          )}
          <a href={p.url} target="_blank" rel="noopener noreferrer"
            className="border border-rule rounded-full px-2.5 py-0.5 text-yes-ink hover:border-yes">仓库 ↗</a>
        </div>
        {/* 附加条件不进圆标 —— 圆标放得下名字，放不下一整句条件。 */}
        {p.license_note && (
          <p className="mt-3 text-[12px] text-chip-warm-ink leading-relaxed max-w-[84ch]">
            许可证附加条件：<Rich text={p.license_note} />
          </p>
        )}
      </header>

      {(p.diagrams?.length || p.arch || p.wiki === "none") && (
        <Section id="read" title="读懂层">
          {/* 没图不是漏了，是 DeepWiki 没收这个仓库 —— 这条要写在页面上，不能悄悄少一节。 */}
          {p.wiki === "none" && (
            <p className="text-[12.5px] text-muted border border-rule rounded-lg px-4 py-3 hatch mb-5">
              <b className="text-ink">没有由源码生成的图。</b>　{p.wiki_note}
            </p>
          )}
          {p.diagrams && p.diagrams.length > 1 && (
            <p className="text-[11.5px] text-muted mb-4">
              {p.diagrams.length} 张 · {[...new Set(p.diagrams.map((d) => d.kind))].join(" / ")}
            </p>
          )}
          {p.diagrams?.map((d) => svgs[d.id] && (
            <figure key={d.id} className="mb-6">
              <figcaption className="flex items-center gap-2 mb-2">
                <span className={`border rounded-full px-2 py-0.5 text-[10.5px] shrink-0 ${KIND_CLS[d.kind] ?? "border-rule text-muted"}`}>
                  {d.kind}
                </span>
                <b className="text-[13.5px]">{d.title}</b>
              </figcaption>
              <div className="border border-rule rounded-lg p-3 overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
                dangerouslySetInnerHTML={{ __html: svgs[d.id] }} />
              <p className="text-[10.5px] text-muted mt-1 border-l-2 border-rule pl-2">{d.src} · 核验 {d.verified_at}</p>
            </figure>
          ))}
          {p.arch && <p className="text-[13px] text-muted leading-relaxed max-w-[100ch]">{p.arch}</p>}
        </Section>
      )}

      <Section id="decisions" title="它管哪几个决定">
        <div className="border border-rule rounded-lg divide-y divide-rule">
          {mine.map((d) => {
            const c = d!.cap ? forkCoverage(d!.cap) : null;
            return (
              <div key={d!.id} className="grid grid-cols-[1fr_auto] gap-4 items-center px-4 py-2.5">
                <div>
                  <b className="text-[13.5px]">{d!.zh}</b>
                  <span className="block text-[12px] text-muted mt-0.5">{d!.handle}</span>
                </div>
                {c && (
                  /*
                   * ⚠️ **站内链接必须用 `<Link>`，不能用 `<a>`。**
                   * 这个站挂在 `/atlas` 下（`basePath`），`<Link>` 会自动补前缀，
                   * 原生 `<a>` 不会 —— 于是这条链接一直指向 `/capability/i2v`，
                   * 线上 404。**它长得完全正常、点了才知道**，
                   * 所以从上线那天起没人发现，直到 2026-08-17 负责人点了一下。
                   * 全站因此有 73 处死链，全出自这一行。
                   */
                  <Link href={capHref(d!.cap!)} className="text-right group">
                    <span className="flex h-2.5 w-[110px] border border-rule group-hover:border-yes">
                      <i style={{ width: `${(c.yes / c.total) * 100}%` }} className="bg-yes" />
                      <i style={{ width: `${(c.no / c.total) * 100}%` }} className="bg-no" />
                      <i style={{ width: `${(c.unknown / c.total) * 100}%` }} className="hatch" />
                    </span>
                    <span className="text-[10.5px] text-muted tnum">{c.yes}/{c.total} 家有官方说法</span>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section id="autonomy" title="自持能力">
        <AutonomyBox p={p} />
      </Section>

      {p.hands ? (
        <Section id="hands" title="动手层">
          {/* 做到了哪几层必须明写 —— 否则只读 README 的看起来和真跑过的一样。 */}
          <LayerBadges layers={p.hands.layers} />
          <h3 className="text-[12px] tracking-wider text-muted font-bold mb-2">装它要过哪几关</h3>
          <ol className="border border-rule rounded-lg divide-y divide-rule mb-7">
            {p.hands.install.map((s, i) => (
              <li key={s.step} className="px-4 py-2.5">
                <b className="text-[13px]"><span className="text-hatch tnum mr-2">{i + 1}</span>{s.step}</b>
                <span className="block text-[12px] text-muted mt-1 leading-relaxed pl-5"><Rich text={s.gate} /></span>
              </li>
            ))}
          </ol>

          <h3 className="text-[12px] tracking-wider text-muted font-bold mb-2">改哪个文件能改什么</h3>
          <div className="border border-rule rounded-lg divide-y divide-rule mb-7">
            {p.hands.modify.map((m) => (
              <div key={m.path} className="px-4 py-2.5">
                <code className="text-[12px] bg-card border border-rule rounded px-1.5 py-0.5">{m.path}</code>
                <span className="block text-[12px] text-muted mt-1 leading-relaxed">{m.effect}</span>
              </div>
            ))}
          </div>

          <h3 className="text-[12px] tracking-wider text-muted font-bold mb-2">坑在哪一处</h3>
          {p.hands.issue_src && (
            <p className="text-[11px] text-muted mb-2">带 issue 编号的来自：{p.hands.issue_src}</p>
          )}
          <div className="border border-no/40 rounded-lg divide-y divide-rule">
            {p.hands.pitfalls.map((f) => (
              <div key={f.where} className="px-4 py-2.5">
                <b className="text-[13px] text-no">{f.where}</b>
                <span className="block text-[12px] text-muted mt-1 leading-relaxed"><Rich text={f.note} /></span>
              </div>
            ))}
          </div>
        </Section>
      ) : (
        <Section id="hands" title="动手层">
          <p className="text-[13px] text-muted border border-rule rounded-lg px-4 py-3 hatch">
            还没做。装它要过哪几关、改哪个文件能改什么、坑在代码哪一处 —— 这三项要读源码，尚未完成。
          </p>
        </Section>
      )}

      <Section id="tutorials" title="教程">
        {p.tutorials?.length ? (
          <>
            {/*
              * 只收官方口径的教程。三方博客不收 —— 它们烂得比我们回查得动的速度快，
              * 而**一条 404 的教程比没有教程更伤**。
              */}
            <p className="text-[11.5px] text-muted mb-3">
              官方文档、作者本人的视频，以及 ComfyUI 官方给的原生工作流示例。每条都验过还打得开。
            </p>
            <ul className="border border-rule rounded-lg divide-y divide-rule">
              {p.tutorials.map((tu) => (
                <li key={tu.url}>
                  <a href={tu.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-baseline gap-2.5 flex-wrap px-4 py-3 hover:text-yes-ink">
                    <b className="text-[13.5px]">{tu.title}</b>
                    <span className="text-[10.5px] border border-yes rounded-full px-1.5 text-yes-ink">{tu.kind}</span>
                    <span className="text-[10.5px] border border-rule rounded-full px-1.5 text-muted">
                      {tu.lang === "zh" ? "中文" : "英文"}
                    </span>
                    <span className="ml-auto text-[11px] text-muted">核验 {tu.verified_at}　↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[13px] text-muted border border-rule rounded-lg px-4 py-3 hatch">
            没找到官方口径的教程 —— 官方只给了 README。
          </p>
        )}
      </Section>

      {readme && (
        <Section id="readme" title="项目自述">
          {/*
            * README 是别人的文字。**整篇搬过来既不礼貌也没必要** ——
            * 读者要的是「这项目自己怎么介绍自己」，那句话永远在开头。
            * 所以只放前面一截，标明出处与抓取日期，并给原文链接。
            */}
          <p className="text-[11.5px] text-muted mb-3">
            以下是仓库 README 的开头部分（原文引用，抓取 {atlas.topics[0].readme_src?.fetched_at}）。
            <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-yes-ink hover:underline ml-1">
              读全文 ↗
            </a>
          </p>
          <div className="border border-rule rounded-lg px-4 py-3.5 max-h-[420px] overflow-y-auto">
            <pre className="text-[12px] text-muted leading-relaxed whitespace-pre-wrap break-words font-sans">{readme}</pre>
          </div>
        </Section>
      )}

      {/*
        * **自述与实测的对照，摆在「判断」前面。**
        *
        * 这一条此前只活在 `/claims` 页上 —— 而一个人从专项点进这个项目页时，
        * **完全不知道我们记过它一条对照**。那是这个站最锋利的一类信息，
        * 却卡在一个他到不了的地方：内容在，分发不在。
        *
        * 放在判断之前是因为它比判断硬：判断是我们说的，
        * 这里两侧都是原文，读者可以自己判。
        */}
      {conflict && (
        <Section id="conflict" title="自述与实测">
          <div className="border border-no rounded-lg px-4 py-4">
            <p className="text-[13.5px] leading-relaxed mb-3"><Rich text={conflict.what} /></p>
            <div className="grid sm:grid-cols-2 gap-x-7 gap-y-3 border-t border-rule pt-3">
              <div>
                <h3 className="text-[11px] tracking-wider text-muted font-bold mb-1.5">它自己说</h3>
                <p className="text-[12.5px] text-muted leading-relaxed"><Rich text={conflict.said} /></p>
              </div>
              <div className="sm:border-l sm:border-rule sm:pl-7">
                <h3 className="text-[11px] tracking-wider text-no font-bold mb-1.5">实际撞到的</h3>
                <p className="text-[12.5px] leading-relaxed"><Rich text={conflict.hit} /></p>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-rule flex flex-wrap gap-x-4 gap-y-1 items-baseline">
              {conflict.src.map((x) => (
                <a key={x.url} href={x.url} target="_blank" rel="noopener noreferrer"
                  className="text-[12px] text-muted underline hover:text-yes-ink">{x.title} ↗</a>
              ))}
              <Link href="/claims" className="text-[12px] text-yes-ink underline ml-auto">
                全部对照 →
              </Link>
            </div>
          </div>
        </Section>
      )}

      <Section id="judge" title="判断">
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5 border-l-2 border-chip-warm-ink pl-4">
          <div>
            <h3 className="text-[11px] tracking-wider text-yes-ink font-bold mb-2">优势</h3>
            <ul className="text-[12.5px] text-muted list-disc pl-4 space-y-1.5">
              {p.good.map((g) => <li key={g}><Rich text={g} /></li>)}
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] tracking-wider text-no font-bold mb-2">局限</h3>
            <ul className="text-[12.5px] text-muted list-disc pl-4 space-y-1.5">
              {p.bad.map((b) => <li key={b}><Rich text={b} /></li>)}
            </ul>
          </div>
          <div className="sm:col-span-2">
            <h3 className="text-[11px] tracking-wider text-muted font-bold mb-1.5">不适用</h3>
            <p className="text-[12.5px] text-muted">{p.unfit}</p>
          </div>
        </div>
      </Section>

      {siblings.length > 0 && (
        <Section id="siblings" title="同管这些决定的其它项目">
          <div className="grid sm:grid-cols-2 gap-2">
            {siblings.map((s) => (
              <Link key={s.id} href={topicProjectHref(t.id, s.id)}
                className="border border-rule rounded-lg px-3.5 py-2.5 hover:border-yes block">
                <b className="text-[13.5px]">{s.zh}</b>
                <span className="block text-[11.5px] text-muted mt-1 leading-snug">{s.scope.slice(0, 42)}…</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <div className="border-t border-rule pt-5 mt-2 text-[11.5px] text-muted">
        <p className="mb-2">{p.src} · 核验 {p.verified_at}　|　判断栏可报错。</p>
        <ReportIssue />
      </div>
      </div>
    </main>
  );
}
