/**
 * 教程链接回查。**一条 404 的教程比没有教程更伤** —— 它把读者送出去撞墙，
 * 而页面上看起来一切正常。所以这条得定期跑，不能只在录入那天验一次。
 *
 * 判据比「状态码 200」严一点：还要看**页面标题有没有变**。
 * 链接活着、内容换了，是教程数据最常见的腐坏方式，状态码看不出来。
 * `page_title` 存的就是录入当天页面自己报的标题。
 *
 * ⚠️ 用 curl 不用 fetch：本机 node 的 fetch 连 GitHub 会 `fetch failed`，
 * 同一条 curl 拿得到 200 —— **那是我们的网络，不是链接死了**，
 * 用 fetch 会把好链接误杀掉。
 *
 *   npm run tutorials:check
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const a = JSON.parse(readFileSync("data/atlas.json", "utf8"));
const rows = [];
for (const t of a.topics ?? []) {
  for (const p of t.projects ?? [])
    for (const tu of p.tutorials ?? []) rows.push({ project: p.zh, ...tu });
  /** 视频常识那一栏烂起来和教程一模一样，所以一起查 —— 分两个脚本迟早只跑一个。 */
  for (const b of t.basics ?? [])
    for (const it of b.items ?? []) {
      rows.push({ project: `知识 · ${b.zh}`, ...it });
      /** 代表作的百科条目一样会烂 —— **它才是「看一眼就懂」那一步的落点**，更不能死。 */
      if (it.example?.url) rows.push({ project: `代表作 · ${b.zh}`, title: it.example.zh, ...it.example });
    }
  /**
   * **作品的出处也要查，而且它是最该查的一类。**
   *
   * 2026-08-17 加游戏专项的作品栏时发现：这支脚本一直漏着 `works[].src` ——
   * 教程和常识都查了，唯独作品的出处没查过。
   *
   * 而作品栏的立身之本就是那几条出处：收录规矩是「只收制作方自己公开说明过管线的」，
   * **出处一死，这一条就退回成传闻** —— 正是这一栏当初要挡的东西。
   * 何况它们比教程更容易烂：个人站、论坛帖、itch.io 页，没人维护。
   */
  for (const w of t.works ?? [])
    for (const s of w.src ?? []) rows.push({ project: `作品 · ${w.zh}`, ...s });
  /** 「自述与实测」的出处同理 —— **出处一死，那条对照就退回成传闻**。 */
  for (const c of t.conflicts ?? [])
    for (const s of c.src ?? []) rows.push({ project: `对照 · ${c.project}`, ...s });
}

if (!rows.length) { console.log("没有教程可查。"); process.exit(0); }
console.log(`回查 ${rows.length} 条外链（教程 + 常识 + 作品出处）\n`);

/**
 * **限流不是死链。**
 *
 * 429（请求太密）与 503（暂时不可用）说的是「现在拿不到」，
 * 不是「这个东西没了」—— 服务器正在正常响应，只是把我们挡了一下。
 * 2026-08-17 连着敲了几次 itch.io 就吃到 429；
 * 要是把它算进死链，下一步就是去改一条本来好好的出处。
 *
 * 这个项目在「取不到 vs 不存在」上栽过好几次（GitHub 限流被报成「仓库没了」、
 * 匿名接口限流被报成「这些仓库没有 README」）。**同一个错，这里不再犯。**
 * 所以单独归一类：报出来提醒人，但不判失败。
 */
const RETRYABLE = new Set(["429", "503", "502", "504"]);

/**
 * **GitHub 的 issue 页对未登录请求回 404，而那个 issue 明明活着。**
 *
 * 2026-08-18 撞到：`chongdashu/unreal-mcp/issues/12` 匿名 curl 一律 404，
 * 而 `gh api` 看得清清楚楚 —— open、8 条回复；同仓库主页 curl 又是 200。
 * 这是反爬，不是链接死了。
 *
 * **要命的是它回的是 404，不是 429** —— 上面那套「限流不算死链」按状态码分，
 * 在这里完全失效。判成死链的下一步就是去删一条本来好好的出处。
 *
 * 所以 github.com 的链接在判死前**必须用 `gh api` 复核一次**（已登录，5000/小时）。
 * 站上有二十多条 issue 出处，这条会反复咬。
 */
const ghAlive = (url) => {
  const iss = url.match(/github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/);
  const rep = url.match(/github\.com\/([^/]+)\/([^/]+)\/?$/);
  const path = iss ? `repos/${iss[1]}/${iss[2]}/issues/${iss[3]}`
    : rep ? `repos/${rep[1]}/${rep[2]}` : null;
  if (!path) return null;          // 不是能用 api 复核的形状，交回给状态码判
  try { execFileSync("gh", ["api", path], { stdio: ["ignore", "ignore", "pipe"] }); return true; }
  catch (e) { return /404|Not Found/i.test(String(e.stderr ?? e)) ? false : null; }
};
const dead = [], drift = [], throttled = [];

/**
 * 拉一次页面。**超时不等于死链。**
 *
 * 上面那段 `ghAlive` 已经把「够不着」和「不存在」分开了 —— 但只分了**有状态码**的那一半。
 * curl 这个进程本身失败（连不上、超时、代理抽风）走的是 catch，原来直接判死链，
 * 于是 2026-09-19 那天 `docs.ollama.com/quickstart` 与 DiffSynth-Studio 的中文文档目录
 * 双双被报成「打不开」，而两条手工复核都是 200。
 * 照着报告「要么换链接、要么删掉」做下去，删的是两条活着的出处。
 *
 * 所以：**失败先重试一次（放宽超时），再失败才交给 gh api 复核，两关都过不去才算够不着。**
 * 而且够不着归 throttled 那一摞（不判失败、不催人改数据），只有真 404 才进 dead。
 */
const pull = (url, maxTime) => execFileSync("curl", [
  "-sL", "--max-time", String(maxTime), "-w", "\n__STATUS__%{http_code}",
  "-A", "Mozilla/5.0 (compatible; xiamimate-ai-atlas)", url,
], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });

for (const r of rows) {
  let out = "";
  try {
    out = pull(r.url, 25);
  } catch {
    try { out = pull(r.url, 45); }            // 一次抖动不定案
    catch {
      const alive = ghAlive(r.url);
      if (alive === false) {
        dead.push({ ...r, why: "curl 起不来 / 超时（gh api 也说没了）" });
        console.log(`  ✗ ${r.project} · ${r.title}`);
      } else {
        throttled.push({ ...r, why: "curl 两次都起不来 —— 够不着，不等于死链" });
        console.log(`  ⏳ ${r.project} · ${r.title}（两次都没拉到，算够不着）`);
      }
      continue;
    }
  }

  const code = out.match(/__STATUS__(\d+)\s*$/)?.[1] ?? "?";
  const title = (out.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
  if (RETRYABLE.has(code)) {
    throttled.push({ ...r, why: `HTTP ${code}` });
    console.log(`  ⏳ ${code} ${r.project} · ${r.title}（限流，不算死链）`);
    continue;
  }
  if (code !== "200") {
    /** 判死之前先问一次 api —— **「够不着」和「不存在」不能靠一个状态码定案**。 */
    const alive = ghAlive(r.url);
    if (alive === true) {
      throttled.push({ ...r, why: `HTTP ${code}（gh api 说它活着，是反爬）` });
      console.log(`  ⏳ ${code} ${r.project} · ${r.title}（GitHub 反爬，不算死链）`);
      continue;
    }
    dead.push({ ...r, why: `HTTP ${code}${alive === false ? "（gh api 也说没了）" : ""}` });
    console.log(`  ✗ ${code} ${r.project} · ${r.title}`); continue;
  }
  /**
   * **人机验证页也会回 200，还带一个像模像样的 <title>。**
   * 2026-09-19：gameprogrammingpatterns.com 回的是「One moment, please...」，
   * 被报成「标题变了」—— 照报告去更新 `page_title`，等于把一堵机器人墙的标题
   * 当成这本书的书名写进库里。和上面「超时不等于死链」同一类错：
   * **够不着的证据不许拿来改结论。**
   */
  const WALL = /^(one moment|just a moment|checking your browser|attention required|please wait|verifying you are human|security check)\b/i;
  if (WALL.test(title)) {
    throttled.push({ ...r, why: `人机验证页（标题「${title}」）—— 够不着，不是标题变了` });
    console.log(`  ⏳ ${r.project} · ${r.title}（人机验证页，不判漂移）`);
    continue;
  }
  /** 标题拿不到多半是前端渲染的页面（飞书这类），不算变 —— 只在两边都有标题时才比。 */
  if (r.page_title && title && title !== r.page_title) {
    drift.push({ ...r, now: title });
    console.log(`  ⚠ 标题变了 ${r.project} · ${r.title}\n      录入：${r.page_title}\n      现在：${title}`);
    continue;
  }
  console.log(`  ✓ ${r.project} · ${r.title}`);
}

console.log(`\n${rows.length} 条：通过 ${rows.length - dead.length - drift.length - throttled.length}` +
  ` · 打不开 ${dead.length} · 标题变了 ${drift.length} · 限流或够不着 ${throttled.length}`);
if (dead.length) console.log("打不开的要么换链接、要么删掉，别留着：\n  " + dead.map((d) => `${d.why} ${d.url}`).join("\n  "));
if (drift.length) console.log("标题变了的要人看一眼内容还对不对，对就更新 page_title 与 verified_at。");
if (throttled.length) {
  console.log("被限流 / 够不着的**不是死链**，隔一会儿单独再跑一次就行：\n  " +
    throttled.map((d) => `${d.why} ${d.url}`).join("\n  "));
}
/** 只有真死链才判失败 —— 限流判失败会逼人去改本来好好的数据。 */
process.exit(dead.length ? 1 : 0);
