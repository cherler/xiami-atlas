/**
 * 把专项里每个开源项目的仓库数字刷新一遍：星数、开源日、最后提交、许可证。
 *
 * ## 为什么不挂进 watch.mjs
 *
 * `watch.mjs` 是**内容 diff**：抓一页、算指纹、变了就报。
 * 而这里要刷的是**数字**，星数天天在动 —— 扔进 diff 只会天天刷屏，
 * 而「一个每次都刷屏的监视器等于没有监视器」（watch.mjs 自己的第二条硬约束）。
 *
 * 所以这支脚本反过来：**默默把数字写回去，只在「结论会变」的时候喊。**
 *
 * ## 什么才值得喊
 *
 * 星数从 5141 涨到 5163 —— 不喊，页面自己更新就好。
 * 但下面这些会让**页面上的判断变成假话**，必须喊：
 *
 * - 跨过 12 个月停更线：卡上的「在维护」要变成「停更 N 个月」
 * - 许可证变了：`license_class` 是我们手写的判断，上游一改它就可能错
 * - 仓库改名 / 404：链接会死，而死链看起来和好链接一模一样
 * - 星速掉了一半以上：`stars_per_month` 是「有名」的判据之一
 *
 * ## 它只碰机器算得出来的字段
 *
 * stars / created_at / pushed_at / stars_per_month / stale_months / verified_at。
 * scope、control、good、bad、tags、license_class 这些是**人写的判断**，
 * 脚本一个都不动 —— 上游变了它只提醒，改不改由人定。
 *
 *   node scripts/refresh-repos.mjs           # 刷新并写回
 *   node scripts/refresh-repos.mjs --dry     # 只看会变什么，不写
 */
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const F = "data/atlas.json";
const DRY = process.argv.includes("--dry");
const a = JSON.parse(readFileSync(F, "utf8"));

/** 口径日 = 今天。**「开源多少天」「停更几个月」都从它算起**，所以先定死再算，别边算边取。 */
const TODAY = new Date().toISOString().slice(0, 10);
const MONTH = 1000 * 86400 * 30.44;
const months = (from, to) => (Date.parse(to) - Date.parse(from)) / MONTH;

/**
 * 走 `gh api`（已登录，5000 次/小时）。
 *
 * 第一版直接 curl 匿名接口 —— **42 个仓库两轮就撞上 60 次/小时的限流**，
 * 而当时脚本把限流的返回当成「仓库改名或没了」报了出来。
 * **「取不到」和「不存在」混成一句话**，正是这个项目栽过好几次的那个错：
 * 前者是我们够不着，后者是世界变了，含义相反。
 *
 * 没装 gh 就退回 curl，但一旦读到限流字样立刻停 —— 不猜、不半途而废地写。
 */
const HAS_GH = (() => {
  try { execFileSync("gh", ["auth", "status"], { stdio: "ignore" }); return true; } catch { return false; }
})();

class RateLimited extends Error {}

const api = (repo) => {
  const out = HAS_GH
    ? execFileSync("gh", ["api", `repos/${repo}`], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })
    : execFileSync("curl", ["-sL", "--max-time", "25", "-A", "xiamimate-ai-atlas",
      `https://api.github.com/repos/${repo}`], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const j = JSON.parse(out);
  if (typeof j.message === "string" && /rate limit/i.test(j.message)) throw new RateLimited(j.message);
  return j;
};

const loud = [], quiet = [], failed = [];

for (const t of a.topics ?? []) {
  for (const p of t.projects ?? []) {
    const m = p.url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!m) continue;
    const repo = `${m[1]}/${m[2]}`;
    let j;
    try { j = api(repo); }
    catch (e) {
      if (e instanceof RateLimited) {
        console.error(`\n❌ GitHub 限流，停在 ${p.zh}。\n` +
          `   ${HAS_GH ? "gh 也被限了，等一小时再跑" : "装 gh 并 gh auth login 可把额度提到 5000/小时"}\n` +
          `   **一个字都没写** —— 半份新数据配一个统一的核验日，那是在撒谎。`);
        process.exit(2);
      }
      failed.push(`${p.zh}（请求失败）`); continue;
    }

    if (j.message) { loud.push(`❗ ${p.zh}：GitHub 返回「${j.message}」—— 仓库可能改名或没了，链接会死`); continue; }
    /** GitHub 会把改名后的仓库自动重定向，**但我们库里的 URL 就此变成旧名** —— 这条要喊。 */
    if (j.full_name && j.full_name.toLowerCase() !== repo.toLowerCase())
      loud.push(`❗ ${p.zh}：仓库已改名 ${repo} → ${j.full_name}，data 里的 url 要跟着改`);

    const created = j.created_at.slice(0, 10);
    const pushed = j.pushed_at.slice(0, 10);
    const rate = Math.round(j.stargazers_count / months(created, TODAY));
    const stale = Math.max(0, Math.round(months(pushed, TODAY)));

    // ── 只有「结论会变」的才进 loud ──
    const wasStale = (p.stale_months ?? 0) >= 12, nowStale = stale >= 12;
    if (wasStale !== nowStale)
      loud.push(`❗ ${p.zh}：${wasStale ? "停更 → 又活了" : `在维护 → 停更 ${stale} 个月`}（卡上的标签会跟着变）`);

    const spdx = j.license?.spdx_id ?? null;
    if (spdx && p.license && !p.license.includes(spdx) && spdx !== "NOASSERTION")
      loud.push(`❗ ${p.zh}：上游许可证标成 ${spdx}，库里写的是「${p.license}」—— license_class 是人写的判断，去核一下`);

    if (p.stars_per_month && rate < p.stars_per_month * 0.5)
      loud.push(`❗ ${p.zh}：星速 ${p.stars_per_month} → ${rate}/月，掉了一半以上（「有名」的判据之一）`);

    const dStar = j.stargazers_count - (p.stars ?? 0);
    if (dStar || pushed !== p.pushed_at)
      quiet.push(`  ${p.zh.padEnd(24)} ★${String(j.stargazers_count).padStart(6)}` +
        `${dStar ? ` (${dStar > 0 ? "+" : ""}${dStar})` : "       "} · ${rate}/月 · 停更 ${stale}`);

    if (!DRY) {
      p.stars = j.stargazers_count;
      p.created_at = created;
      p.pushed_at = pushed;
      p.stars_per_month = rate;
      p.stale_months = stale;
      p.verified_at = TODAY;
    }
  }
}

/**
 * **要么全写，要么全不写。**
 *
 * `verified_at` 是对「这一份数据」的承诺。如果有几个仓库没抓到，
 * 却把口径日整体推到今天，那些没刷新的项目就顶着一个假的核验日 ——
 * 而页面上看不出哪几个是假的。
 */
if (!DRY) {
  if (failed.length) {
    console.error(`\n❌ ${failed.length} 个没抓到，**一个字都没写**：${failed.join(" · ")}\n` +
      `   核验日是对整份数据的承诺，不能有一半是旧的。`);
    process.exit(2);
  }
  /**
   * **落盘前重新读一遍，只把自己那几个字段贴回去。**
   *
   * 2026-09-10 被这条咬了一口：这支脚本在开头 `readFileSync` 了整份 atlas.json，
   * 中间跑 40 多个仓库的网络请求（几十分钟），结束时把**开头那份内存副本整个写回**。
   * 那几十分钟里有人（我）改了六处引文，全被这一下悄悄冲掉了 ——
   * 校验通过、页面正常，只有引文回查那份报告多了四条「对不上」，
   * 而那四条看起来就像我引文写得不好。**读一次、算很久、整份写回，就是在赌没人碰它。**
   *
   * 上面注释里已经写明这支脚本「只碰机器算得出来的字段」——
   * 那就真的只写这几个字段，别把整份文档当自己的。
   */
  const 现盘 = JSON.parse(readFileSync(F, "utf8"));
  const 我的字段 = ["stars", "created_at", "pushed_at", "stars_per_month", "stale_months", "verified_at"];
  let 贴回 = 0;
  for (const t of a.topics ?? []) {
    const t2 = (现盘.topics ?? []).find((x) => x.zh === t.zh);
    if (!t2) continue;
    for (const p of t.projects ?? []) {
      const p2 = (t2.projects ?? []).find((x) => x.zh === p.zh);
      if (!p2) continue;
      for (const k of 我的字段) if (p[k] !== undefined) p2[k] = p[k];
      贴回++;
    }
  }
  现盘.generated_at = TODAY;
  writeFileSync(F, JSON.stringify(现盘, null, 2) + "\n");
  console.log(`（写回 ${贴回} 个项目的机器字段，其余内容以落盘那一刻的 atlas.json 为准）`);
}

console.log(`口径日 ${TODAY}${DRY ? "（试跑，没写）" : ""}\n`);
if (quiet.length) { console.log(`数字有变动的 ${quiet.length} 个：`); quiet.forEach((x) => console.log(x)); }
else console.log("数字一个都没变。");
if (failed.length) console.log(`\n抓不到 ${failed.length} 个：${failed.join(" · ")}`);
if (loud.length) {
  console.log(`\n${"─".repeat(60)}\n要人看一眼的 ${loud.length} 条：`);
  loud.forEach((x) => console.log(x));
  console.log(`${"─".repeat(60)}\n**这些会让页面上的判断变成假话**，改完再上线。`);
} else console.log("\n✅ 没有会改变结论的变化。");
process.exit(loud.length ? 1 : 0);
