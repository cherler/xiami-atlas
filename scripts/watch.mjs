/**
 * 信息源监视器（任务 F2：Fetcher + Snapshot + Diff）。
 *
 * **这一步本该在录第一条数据之前就有。** 没有它，采集退化成即席搜索 ——
 * 而即席搜索在 9 个 Family 上错了 6 个：三个版本过期、一个已停服还当在售列着、
 * 一个厂商换了主力产品线没跟上、一个官方更新日志压根没读（Vidu 2026-04-13）。
 *
 * 设计的三条硬约束：
 *
 * 1. **纯程序，不用 LLM。** 抓取、指纹、比对都是确定性的（原方案 §33）。
 *    LLM 只该在「这段变化意味着什么」那一步进来，而那是下一支脚本的事。
 * 2. **只报变化，不报全文**（§34 Diff-first）。省成本，也省注意力 ——
 *    一个每次都刷屏的监视器，等于没有监视器。
 * 3. **快照进 git。** commit 就是 SourceSnapshot，diff 就是 ChangeEvent，
 *    history 就是 Revision（§59.4.c）。不另建三张表。
 *
 *   node scripts/watch.mjs          # 抓一轮，写快照，报变化
 *   node scripts/watch.mjs --due    # 只抓到期的（按 refresh_days）
 *   node scripts/watch.mjs --only hf-t2v,vidu-changelog
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spaText } from "./lib/spa-text.mjs";

/**
 * **先把量测对。**
 *
 * 第一轮跑出来 16 个源「抓不到」，差点就写进报告，变成
 * 「这些厂商没有可 diff 的公开入口」这种彻底错误的结论。
 *
 * 真相：这台机器上配了代理（HTTPS_PROXY=127.0.0.1:7890）。
 * curl 认这个环境变量，**Node 的全局 fetch 默认不认** ——
 * 于是 huggingface.co、ai.google.dev 这些 curl 一秒就 200 的站，
 * 在 undici 里一路卡到 10 秒连接超时，只报一句毫无信息量的 "fetch failed"。
 *
 * 排查顺序也值得记：先怀疑 IPv6（错了，DNS 只解析出 IPv4），
 * 再对比 curl 与 node（这一步才定位到代理）。**对比两个工具比盯着一个猜快得多。**
 *
 * 错的测量比没有测量更糟：没有测量时，你至少知道自己不知道。
 */
if ((process.env.HTTPS_PROXY || process.env.HTTP_PROXY) && !process.env.NODE_USE_ENV_PROXY) {
  // NODE_USE_ENV_PROXY 在进程启动时读取，运行中改 process.env 不生效 —— 只能重启自己
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, [process.argv[1], ...process.argv.slice(2)], {
    stdio: "inherit",
    env: { ...process.env, NODE_USE_ENV_PROXY: "1" },
  });
  process.exit(r.status ?? 1);
}

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = `${HERE}/..`;
const SNAP = `${ROOT}/data/snapshots`;
mkdirSync(SNAP, { recursive: true });

const reg = JSON.parse(readFileSync(`${ROOT}/data/sources.json`, "utf8"));
const argv = process.argv.slice(2);
/**
 * ⚠️ 这里出过一个**四天没人发现**的 bug（2026-08-11 修）。
 *
 * 原来写的是：
 *   `argv.find(a => a.startsWith("--only"))?.split("=")[1] ?? argv[argv.indexOf("--only") + 1]`
 *
 * 跑 `--due` 时没有 `--only`，`indexOf` 返回 **-1**，`-1 + 1 = 0`，
 * 于是 `only` 被赋成了 `argv[0]`，也就是 `"--due"` 自己 ——
 * 接着拿它去匹配源 id，**一个都匹配不上，选中 0 个源**。
 *
 * `-1` 是「没找到」，不是一个合法下标。**「没有值」和「取不到值」混在一起**，
 * 而 JS 不会为此报错，只会安安静静地给你一个 0。
 *
 * 后果：launchd 每天 09:23 照常跑、退出码 0、日志干干净净，
 * 但 213 个源里 149 个从来没被抓过，快照停在 08-08。
 * **一个报告成功却什么都没做的定时任务，比一个明着失败的更糟。**
 */
const onlyIdx = argv.indexOf("--only");
const only = argv.find((a) => a.startsWith("--only="))?.split("=")[1]
  ?? (onlyIdx >= 0 ? argv[onlyIdx + 1] : undefined);
const dueOnly = argv.includes("--due");
const TODAY = process.env.WATCH_DATE || new Date().toISOString().slice(0, 10);

const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);
const daysBetween = (a, b) => Math.round((Date.parse(a) - Date.parse(b)) / 86400000);

/**
 * 把抓到的东西压成一个**稳定指纹**。
 *
 * 稳定是关键：页面上的访问计数、随机排序、时间戳每次都变，
 * 不压掉的话每次都报「变了」，两周后就没人看这个报告了。
 */
function fingerprint(kind, body) {
  if (kind === "json") {
    const j = JSON.parse(body);
    // HF 列表 / GitHub releases 都是数组；取「身份 + 最后改动」两列就够判断有没有动
    if (Array.isArray(j)) {
      const items = j.map((x) => {
        const id = x.id ?? x.modelId ?? x.tag_name ?? x.name ?? "?";
        const at = x.lastModified ?? x.published_at ?? x.created_at ?? "";
        return `${id}\t${at}`;
      });
      items.sort();
      return { items, digest: sha(items.join("\n")) };
    }
    const flat = JSON.stringify(j, Object.keys(j).sort());
    return { items: [], digest: sha(flat) };
  }
  if (kind === "csv") {
    const lines = body.split(/\r?\n/).filter(Boolean);
    // 只取首列（模型名）—— 算力等数值列会被修订，那不是我们要盯的
    const names = lines.slice(1).map((l) => l.split(",")[0]);
    names.sort();
    return { items: [`${lines.length - 1} 行`], digest: sha(names.join("\n")) };
  }
  if (kind === "atom") {
    const titles = [...body.matchAll(/<title>([\s\S]*?)<\/title>/g)].map((m) => m[1].trim()).slice(1);
    return { items: titles.slice(0, 40), digest: sha(titles.join("\n")) };
  }
  // html：剥掉脚本样式与标签，留正文。**不留原始 HTML** —— 类名一改就误报。
  // spa 走浏览器取的 innerText，本来就是正文，下面这串替换对它是无害的空转。
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  /**
   * **快照的 text 有两个用途，长度得按更贪的那个定。**
   *
   * 变更检测只需要 digest（算的是全文），4000 字够了；
   * 但快照同时是**取证据的语料** —— 从 Kling 的更新日志里找「首尾帧最早哪天出现」，
   * 就得有全文。4000 字把那份 3.2 万字的日志砍掉了 87%，
   * 于是「最早可证时间」这件事直接做不了。
   *
   * 存 20 万字：git 里几十 KB 的文本，和它换来的可追溯性不成比例。
   *
   * ⚠️ **截断必须记下来，不然它会伪装成「这句话没了」。** 2026-09-10 发现：
   * 上限原来是 8 万字，全站有 10 份快照正好卡在这个数上 —— 而 `requote.mjs`
   * 在这些页上报的「找不到」，有一批根本不是引文错，是那句话落在 8 万字之外。
   * 引文回查报告里排第一的 `openai-image-docs`（9 条）就是这么来的。
   * **一个把「没抓到」说成「不成立」的检查，比没有检查更糟。**
   * 所以：上限抬到 20 万，并且把 `full_len` / `truncated` 一起存进快照，
   * 让下游能把「判不了」和「对不上」分开说。
   */
  const CAP = 200000;
  return {
    items: [],
    digest: sha(text),
    text: text.slice(0, CAP),
    full_len: text.length,
    truncated: text.length > CAP,
  };
}

/**
 * SPA 文档站（Vidu 的 changelog 就是）。
 *
 * 纯 HTTP 抓只能拿到导航壳 —— 我第一版就是这么把「Document not found」
 * 当成正文存下来的，而真正的 2026-04-13「新增 viduq3 / mix / turbo」那条，
 * 一直在浏览器里好好待着。**厂商有更新日志，只是我抓的方式不对。**
 *
 * 用无头浏览器渲染再取正文。慢，但这类源本来就一周才看一次。
 */
async function fetchSpa(s) {
  const { chromium } = await import("playwright");
  const b = await chromium.launch({ proxy: PROXY ? { server: PROXY } : undefined });
  try {
    /**
     * **必须钉死语言。** Google 的定价页按出口 IP 本地化 ——
     * 我们抓回来的那份 59% 是俄文（「Нет в наличии」＝不可用）。
     * 页面看着「抓到了」，但抽取器读到的是另一种语言的标签，
     * **这不是显示问题，是会毒到数据的 bug**。
     *
     * 默认要英文原版；中文厂商站（火山方舟、MiniMax）在源表里写 `lang: "zh-CN"` ——
     * 硬给它们塞 en-US，抓回来的会是另一份译文，diff 全是噪音。
     */
    const lang = s.lang ?? "en-US";
    /**
     * **浏览器这一路不设自定义 UA —— 用 Playwright 的默认值。**
     *
     * 2026-08-12 一度以为 fal / aiwiki 的 429 是「缺浏览器指纹」，给这里加了条真实 Chrome UA。
     * 实测把三种 UA 摆在一起才看清楚：
     *
     * | UA | fal.ai | aiwiki |
     * |---|---|---|
     * | 我们裸抓用的诚实标识 `xiamimate-ai-atlas/0.1 (…)` | 429「Vercel Security Checkpoint」| 429 同上 |
     * | Playwright 默认（含 HeadlessChrome）| 200，82,857 字 | 200，6,150 字 |
     *
     * **也就是说问题不是「要不要伪装成浏览器」，是我们那串自定义 UA 本身被 Vercel 的 bot 墙拦了。**
     * 默认值就够用，那就别自己编一个 —— 裸抓那条路的注释写着「不伪装成别人」，
     * 这里没有理由走反方向。
     */
    const p = await b.newPage({
      locale: lang,
      extraHTTPHeaders: { "accept-language": `${lang},${lang.split("-")[0]};q=0.9` },
    });
    /**
     * **`networkidle` 等不到的站，不等于抓不到。**
     *
     * 2026-08-12：OpenAI 的帮助页与 Sora 2 发布页在 watch 里一直报
     * `page.goto: Timeout 45000ms exceeded`，写在报告里就成了「抓不到（要处理）」。
     * 但同一个 URL 用 `domcontentloaded` 打开、等 2.5 秒，正文分别是 2,251 与 11,564 字 ——
     * **它们只是永远不会「网络空闲」**（埋点、长轮询、第三方脚本一直在跑）。
     *
     * 所以：先按原样等 networkidle（多数 SPA 靠它才渲染完），
     * **超时就退回 domcontentloaded 再试一次**，而不是把整条源判死。
     * 退回这一路仍然要过 `spaText` 的壳判定 —— 拿到壳照样算抓不到，不会因此放水。
     */
    try {
      await p.goto(s.url, { waitUntil: "networkidle", timeout: 45000 });
    } catch (e) {
      if (!/Timeout/i.test(String(e.message))) throw e;
      await p.goto(s.url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await p.waitForTimeout(2500);
    }
    // Cookie 同意墙。不点掉的话抓回来的是隐私政策，而不是更新日志 ——
    // Runway 就是这么让我抓到一整页「Consent Selection」的。
    for (const t of ["Allow all", "Accept all", "同意", "接受全部", "Agree", "Got it"]) {
      const b = p.getByRole("button", { name: t, exact: false }).first();
      if (await b.count().catch(() => 0)) { await b.click({ timeout: 3000 }).catch(() => {}); break; }
    }
    /**
     * 走共用抽取（去导航、图标留痕、壳直接抛）。**不再用 body.innerText** ——
     * 那样抓回来的一半是侧边栏，图标画的勾读成空白，
     * 而 MiniMax 那种整页是壳的还会被记成「抓到了、没内容」，
     * 听起来像厂商没写，其实是我们够不着。抛出去才会进「抓不到」那一摞。
     */
    return (await spaText(p, { wait: 1500, sel: s.sel })).text;
  } finally {
    await b.close();
  }
}

async function fetchOne(s) {
  if (s.kind === "spa") return await fetchSpa(s);
  const ctl = AbortSignal.timeout(30000);
  const res = await fetch(s.url, {
    signal: ctl,
    headers: {
      // 不伪装成别人；说清楚我们是谁、来干什么，方便对方要联系时找得到人
      "user-agent": "xiamimate-ai-atlas/0.1 (capability atlas; contact via xiamimate.com)",
      accept: s.kind === "json" ? "application/json" : "*/*",
      // 同上：不钉语言，同一个 URL 换个出口 IP 就换一种语言，diff 全是噪音
      "accept-language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

const prevOf = (id) => {
  const f = `${SNAP}/${id}.json`;
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
};

/**
 * **退役的源跳过，但要如实报出来。**
 *
 * 2026-08-12 `libtv` 三个观测点（本机直连 / 本机走代理 / 大陆服务器）全部失败，
 * **连 TCP 443 都不通** —— 站没了。删掉它最省事，但那样一来
 * 「我们曾经收过这个源」这件事就消失了，它哪天活过来也没人认得出。
 *
 * 所以标 `retired` 而不删：不抓、不进待办、**但每次跑都在开头报一声还有几条退役的**。
 * 静默跳过和删掉没区别 —— 都是让人忘掉它。
 */
const retired = reg.sources.filter((s) => s.retired);
if (retired.length)
  console.log(`退役源 ${retired.length} 条，本轮跳过：` +
    retired.map((s) => `${s.id}（${s.retired.at}：${String(s.retired.why).replace(/\*/g, "").slice(0, 40)}…）`).join("；"));

/**
 * **人工核的源同样跳过，同样要报出来。**
 *
 * 有些源不是「抓不到」，是**不该再让机器去撞**：
 * OpenAI 那两页在 Cloudflare 人机验证后面（换抓法救不了，也不该去绕）；
 * 量子位那条本机 DNS 被劫持、且拒我们的诚实 UA。
 *
 * 它们留在册子上、留在报告里，只是不再每天进「抓不到（要处理）」那一摞 ——
 * 一摞永远红着又无从下手的待办，会让人连真的那几条也不看了（§59.3 的负反馈）。
 */
const manual = reg.sources.filter((s) => s.manual && !s.retired);
if (manual.length)
  console.log(`人工核的源 ${manual.length} 条，本轮跳过：${manual.map((s) => s.id).join("、")}（原因见 data/sources.json 各自的 note）`);

const list = reg.sources.filter((s) => {
  if (s.retired || s.manual) return false;
  if (only) return only.split(",").includes(s.id);
  if (!dueOnly) return true;
  const p = prevOf(s.id);
  return !p || daysBetween(TODAY, p.fetched_at) >= (s.refresh_days ?? 7);
});

/**
 * **选中 0 个源必须是一件响的事。**
 *
 * 上面那个 bug 之所以能躺四天，不是因为它藏得深，是因为它**长得像成功**：
 * 「监视 0/213」印出来了，退出码 0，launchd 心满意足。
 * 所以这里把三种 0 分开 —— 只有「全都还新鲜」那一种是正常的。
 */
if (list.length === 0) {
  if (only) {
    console.error(`--only "${only}" 一个源都没匹配上。是不是把 id 写错了？（登记了 ${reg.sources.length} 个源）`);
    process.exit(2);
  }
  if (!dueOnly) { console.error(`源表是空的：data/sources.json 里一个源都没有`); process.exit(2); }
  const never = reg.sources.filter((s) => !s.retired && !s.manual && !prevOf(s.id)).length;
  if (never > 0) {
    // 「到期 0 个」和「有 149 个从来没抓过」不可能同时成立 —— 同时出现就是选择逻辑坏了
    console.error(`选出 0 个到期源，但有 ${never} 个源从来没抓过 —— **这两件事不可能同时成立**，选择逻辑坏了`);
    process.exit(2);
  }
  console.log(`没有到期的源（${reg.sources.length} 个全都还在各自的 refresh_days 之内）· ${TODAY}`);
}

console.log(`监视 ${list.length}/${reg.sources.length} 个源 · ${TODAY}\n`);

const rows = [];
for (const s of list) {
  const prev = prevOf(s.id);
  let row;
  try {
    const body = await fetchOne(s);
    const fp = fingerprint(s.kind, body);
    const changed = prev && prev.digest !== fp.digest;
    // **抓到了但没内容**：HTTP 200、指纹稳定、报「无变化」，可正文里一个该有的词都没有。
    // SPA 的导航壳就长这样。失败会喊，静默的成功不会 —— 所以要专门喊一声。
    // 大小写要统一：arxiv 的条目里是 "World"，我拿小写 "world" 去 includes，永远不命中。
    // 一个会误报的自检，比没有自检更糟 —— 它会让人开始忽略警告。
    const hay = ((fp.text ?? "") + fp.items.join(" ")).toLowerCase();
    const hollow = s.expect?.length ? !s.expect.some((w) => hay.includes(w.toLowerCase())) : false;
    // 列表型的源能算出「新增了哪些条目」—— 这才是能直接写进周报的东西
    const added = prev?.items && fp.items.length
      ? fp.items.filter((i) => !prev.items.includes(i)).map((i) => i.split("\t")[0])
      : [];
    row = {
      id: s.id, tier: s.tier, kind: s.kind, name: s.name, url: s.url,
      status: hollow ? "没内容" : !prev ? "首次" : changed ? "变了" : "无变化",
      digest: fp.digest, items: fp.items, added, fetched_at: TODAY,
    };
    writeFileSync(`${SNAP}/${s.id}.json`,
      // full_len / truncated 一起写：下游要能分清「这句话不在页上」和「这句话在 20 万字之外」
      JSON.stringify({ url: s.url, kind: s.kind, fetched_at: TODAY, digest: fp.digest,
        items: fp.items, text: fp.text, full_len: fp.full_len, truncated: fp.truncated }, null, 2) + "\n");
  } catch (e) {
    const why = e.cause?.code || e.cause?.message || "";
    row = { id: s.id, tier: s.tier, kind: s.kind, name: s.name, url: s.url, status: "抓不到", error: `${e.message}${why ? " / " + why : ""}`.slice(0, 90), added: [] };
  }
  rows.push(row);
  const mark = { 首次: "·", 变了: "★", 无变化: " ", 抓不到: "✗", 没内容: "!" }[row.status];
  console.log(`${mark} [${row.tier}/${row.kind}] ${row.id.padEnd(20)} ${row.status}${row.added?.length ? ` +${row.added.length}` : ""}${row.error ? "  " + row.error : ""}`);
}

// 本次没查的源，从快照里补它上次的状态 —— **报告必须覆盖全部源**。
// 第一次跑 --due 就踩了这个坑：那天没有源到期，报告被一份空清单覆盖，
// 把前一天的真结果冲没了。增量抓取 ≠ 增量报告。
const checked = new Set(rows.map((r) => r.id));
for (const s2 of reg.sources) {
  if (checked.has(s2.id)) continue;
  const p = prevOf(s2.id);
  rows.push({
    id: s2.id, tier: s2.tier, kind: s2.kind, name: s2.name, url: s2.url,
    status: p ? `未到期（上次 ${p.fetched_at}）` : "从未抓过", added: [],
  });
}
rows.sort((a, b) => reg.sources.findIndex((x) => x.id === a.id) - reg.sources.findIndex((x) => x.id === b.id));

const byStatus = (st) => rows.filter((r) => r.status === st);
const md = [
  `# 信息源监视报告 · ${TODAY}`,
  ``,
  `本次检查 ${checked.size} 个到期源（共 ${rows.length} 个）：变化 ${byStatus("变了").length} · 首次 ${byStatus("首次").length} · 无变化 ${byStatus("无变化").length} · **抓不到 ${byStatus("抓不到").length}**`,
  ``,
  `> 这份报告是给人看的那 20 条待办的来源（§59.3 的负反馈：人每周要看的条目 ≤ 20）。`,
  `> 「抓不到」不是失败，是**信息本身** —— 一个长期抓不到的官方源，说明那家厂商没有可 diff 的公开更新入口，`,
  `> 而那正好解释了为什么它名下的格子质量最差。`,
  ``,
  `## 抓到了但没内容（比抓不到更危险 —— 它不会喊）`,
  ``,
  ...(byStatus("没内容").length
    ? byStatus("没内容").map((r) => `- **${r.id}** ${r.name} — 正文里找不到任何一个期望关键词（${r.url}）`)
    : ["（无）"]),
  ``,
  `## 抓不到（要处理）`,
  ``,
  ...(byStatus("抓不到").length
    ? byStatus("抓不到").map((r) => `- **${r.id}**（${r.tier}/${r.kind}）${r.name} — ${r.error}\n  ${r.url}`)
    : ["（无）"]),
  ``,
  `## 有变化`,
  ``,
  ...(byStatus("变了").length
    ? byStatus("变了").flatMap((r) => [
        `- **${r.id}** ${r.name}`,
        ...(r.added.length ? [`  新增 ${r.added.length} 条：${r.added.slice(0, 12).join("、")}${r.added.length > 12 ? " …" : ""}`] : []),
      ])
    : ["（首轮无基线可比）"]),
  ``,
  `## 全部`,
  ``,
  `| 源 | 权威 | 类型 | 状态 |`,
  `|---|---|---|---|`,
  ...rows.map((r) => `| ${r.id} | ${r.tier} | ${r.kind} | ${r.status}${r.error ? `（${r.error}）` : ""} |`),
  ``,
].join("\n");
/**
 * **`--only` 不许覆盖全量报告。**
 *
 * 2026-08-12 栽在这：修完一批源后用 `--only` 单点验证了 12 条、又单点验证了 1 条，
 * 于是 `data/watch-report.md` 变成「本次检查 1 个到期源……**抓不到 0**」，
 * 而 `todo.mjs` 是读这份报告的 —— 待办里「抓不到」那一摞**整个消失了**。
 *
 * 看上去像刚才那轮修复大获全胜，实际上只是**把体温计换成了一支只量一根手指的**。
 * 和「serve -s 对任何路径都回 200」「curl 报错却去 grep 上一轮的残留文件」同一类错：
 * **量的东西换了，读数却还当成原来那个用。**
 *
 * 所以 `--only` 写到单独的 partial 文件，主报告只由全量跑更新。
 */
const partial = Boolean(only);
const reportPath = partial ? "data/watch-report.partial.md" : "data/watch-report.md";
writeFileSync(`${ROOT}/${reportPath}`,
  partial
    ? `> ⚠️ **这是 \`--only\` 的局部结果，不是全量。** 全量报告在 data/watch-report.md，` +
      `\`todo.mjs\` 只读那一份。本次只查了：${only}\n\n${md}`
    : md);

console.log(`\n变化 ${byStatus("变了").length} · 首次 ${byStatus("首次").length} · 无变化 ${byStatus("无变化").length} · 抓不到 ${byStatus("抓不到").length}`);
console.log(`报告写在 ${reportPath}${partial ? "（局部结果，未动全量报告）" : ""}`);
