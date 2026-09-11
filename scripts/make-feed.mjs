/**
 * 生成 RSS（订阅 · 批次 E5）。
 *
 * ## 为什么是 RSS，不是邮件订阅
 *
 * 站是静态导出的，**没有后端**。做邮件订阅要起一个服务、一个数据库、
 * 一套退订和反垃圾 —— 换来的是一个要长期守着的东西，
 * 而它解决的问题一个静态 XML 文件就够了。
 *
 * RSS 还有一个更要紧的好处：**读者不用把邮箱交给我们**。
 * 一个刚上线、连读者都没有的站，先收集邮箱是本末倒置。
 *
 * ## 一个源，用分类区分
 *
 * 「只订阅某个模型」用 `<category>` 标出来，阅读器自己能过滤。
 * 给每个模型各生成一个 feed 是 18 个文件、18 份要同步的东西 ——
 * **多出来的维护量换不来相应的价值**。
 *
 *   node scripts/make-feed.mjs   →  public/changes.xml
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const a = JSON.parse(readFileSync(join(ROOT, "data/atlas.json"), "utf8"));
const ch = JSON.parse(readFileSync(join(ROOT, "data/changes.json"), "utf8"));
const SITE = "https://xiamimate.com/atlas";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
/**
 * 站上的正文用 `**` 标重点（`components/Fact.tsx` 的 `Rich` 认它）。
 * **RSS 这一路一直没认** —— 阅读器里出来的是一串裸星号，41 条全是这样。
 * 转成 `<b>` 必须在转义之后：先转义会把尖括号变成实体，再替换就替换不到了。
 */
const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
const rfc = (d) => new Date(`${d}T08:00:00+08:00`).toUTCString();

/**
 * **快讯排在最前，而且不新开一个 feed。**
 *
 * 这支脚本开头那条立场原样成立：「一个源，用分类区分」——
 * 给快讯单出一份 `alerts.xml` 是第二个要同步的东西，
 * 而它解决的问题一个 `<category>快讯</category>` 就够了，阅读器自己能过滤。
 *
 * 排序上给它插队：同一天的普通变更和快讯混在一起，快讯就白标了。
 * 过期的快讯不再插队 —— 它就是一条普通历史记录了。
 */
const TODAY = new Date().toISOString().slice(0, 10);
/** 这一层叫什么写在数据里（`changes.json` 的 `$alert_label`）—— 四个出口共用一个名字。 */
const LABEL = ch.$alert_label ?? "快讯";
const hot = (e) => Boolean(e.alert && String(e.alert.until) >= TODAY);

const items = [...ch.events]
  .sort((x, y) => (hot(y) - hot(x)) || y.date.localeCompare(x.date))
  .slice(0, 50)
  .map((e) => {
    const src = e.src ? a.sources[e.src] : null;
    // Change + So What 三段都进摘要 —— **只有 after 的那是新闻，不是变更事件**
    const body = [
      hot(e) ? `<p><b>${esc(LABEL)}</b>（挂到 ${esc(e.alert.until)}）：${esc(e.alert.headline)}</p>` : "",
      `<p><b>${esc(e.subject)}</b> · ${esc(e.kind)}${e.side === "ours" ? "（这一条是我们记错了）" : ""}</p>`,
      `<p>此前：${rich(e.before)}</p>`,
      `<p>现在：${rich(e.after)}</p>`,
      `<p><b>为什么重要：</b>${rich(e.why)}</p>`,
      e.impact?.length ? `<p>影响：${e.impact.map(esc).join("；")}</p>` : "",
      src ? `<p>来源：<a href="${esc(src.url)}">${esc(src.name)}</a></p>` : "",
    ].join("");
    return `    <item>
      <title>${esc(hot(e) ? `【${LABEL}】${e.subject}：${e.after}` : `${e.subject}：${e.after}`)}</title>
      <link>${SITE}/changes#${esc(e.id)}</link>
      <guid isPermaLink="false">${esc(e.id)}</guid>
      <pubDate>${rfc(e.date)}</pubDate>
${[...(hot(e) ? [LABEL] : []), ...(e.models ?? [])].map((m) => `      <category>${esc(m)}</category>`).join("\n")}
      <description>${esc(body)}</description>
    </item>`;
  });

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>虾米看AI · 变了什么</title>
    <link>${SITE}/changes</link>
    <atom:link href="${SITE}/changes.xml" rel="self" type="application/rss+xml"/>
    <description>AI 视频模型的版本、停服、价格与能力变化。每条带 Before / After / 为什么重要，以及厂商官方来源。</description>
    <language>zh-CN</language>
    <lastBuildDate>${rfc(a.generated_at)}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>
`;
mkdirSync(join(ROOT, "public"), { recursive: true });
writeFileSync(join(ROOT, "public/changes.xml"), xml);
const hots = ch.events.filter(hot).length;
console.log(`RSS 写好：public/changes.xml（${items.length} 条${hots ? `，其中 ${hots} 条在架${LABEL}排在最前` : ""}）`);
