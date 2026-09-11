/**
 * 把每个项目的 README 原文抓下来存进 `data/readme/<id>.md`。
 *
 * ## 为什么要存下来，而不是构建时去抓
 *
 * 服务器上构建时**没有出网这一说**（也不该有）：构建必须是确定的 ——
 * 同一个 commit 构建两次要出同样的页。去网上抓意味着页面内容取决于
 * 「构建那一刻 GitHub 返回了什么」，那不是构建产物，是快照。
 *
 * ## 为什么不塞进 atlas.json
 *
 * 40 多份 README 加起来上兆，塞进去会把那个文件顶成一个没法看 diff 的东西。
 * **一个项目一个文件**，改了哪份一眼看得见。
 *
 * ## 页面上只放开头一段
 *
 * README 是别人的文字。整篇搬过来既不礼貌也没必要 —— 读者要的是
 * 「这项目自己怎么介绍自己」，那句话永远在开头。所以页面上折叠着放前面一截，
 * 明写出处与抓取日期，并给原文链接。
 *
 *   node scripts/fetch-readme.mjs            # 抓全部
 *   node scripts/fetch-readme.mjs wan22      # 只抓一个
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const DIR = "data/readme";
mkdirSync(DIR, { recursive: true });
const a = JSON.parse(readFileSync("data/atlas.json", "utf8"));
const only = process.argv.slice(2).filter((x) => !x.startsWith("--"));

/** node 的 fetch 在这台机器上连 GitHub 会 `fetch failed`，curl 同一条 200 —— 用 curl。 */
const curl = (u, raw) => execFileSync("curl", ["-sL", "--max-time", "40", "-A", "xiamimate-ai-atlas",
  ...(raw ? ["-H", "Accept: application/vnd.github.raw"] : []), u], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/**
 * **走 `gh api`（已登录，5000 次/小时），匿名 curl 只做兜底。**
 *
 * 2026-08-17 加第二个专项后，仓库总数过了 75 —— 匿名接口 60 次/小时的额度
 * 从第 62 个开始整批失败，而失败信息是「失败 14 个」这么一句。
 * **它看起来和「这 14 个仓库没有 README」一模一样。**
 *
 * `refresh-repos.mjs` 上个月为同一个原因改成了 `gh api`，这支漏了 ——
 * 所以现在把限流单独认出来：撞限流立刻停，并说清楚是够不着，不是不存在。
 */
const HAS_GH = (() => {
  try { execFileSync("gh", ["auth", "status"], { stdio: "ignore" }); return true; } catch { return false; }
})();

class RateLimited extends Error {}

const readme = (owner, repo) => {
  if (HAS_GH) {
    try {
      return execFileSync("gh", ["api", `repos/${owner}/${repo}/readme`, "-H", "Accept: application/vnd.github.raw"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
    } catch (e) {
      if (/rate limit/i.test(String(e.stderr ?? e))) throw new RateLimited();
      throw e;
    }
  }
  const md = curl(`https://api.github.com/repos/${owner}/${repo}/readme`, true);
  /** 匿名接口把限流也回成 JSON —— 不认出来就会当成「这个仓库没 README」。 */
  if (md.trim().startsWith("{") && /rate limit/i.test(md)) throw new RateLimited();
  if (!md || md.trim().startsWith("{")) throw new Error("返回的不是 README");
  return md;
};

let ok = 0, skip = 0, fail = [];
for (const t of a.topics ?? []) {
  for (const p of t.projects ?? []) {
    if (only.length && !only.includes(p.id)) continue;
    const m = p.url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!m) { skip++; continue; }
    let md;
    try { md = readme(m[1], m[2]); }
    catch (e) {
      if (e instanceof RateLimited) {
        console.error(`\n❌ GitHub 限流，停在 ${p.id}。` +
          `${HAS_GH ? "gh 也被限了，等一小时再跑。" : "装 gh 并 gh auth login 可把额度从 60/小时提到 5000/小时。"}\n` +
          `   **这是够不着，不是仓库没有 README** —— 已抓到的 ${ok} 份留着，没抓的下次补。`);
        process.exit(2);
      }
      fail.push(p.id); continue;
    }
    writeFileSync(`${DIR}/${p.id}.md`, md);
    ok++;
    console.log(`  ✓ ${p.id.padEnd(22)} ${Math.round(md.length / 1024)}KB`);
  }
}
console.log(`\n抓到 ${ok} 份 · 跳过 ${skip} · 失败 ${fail.length}${fail.length ? `：${fail.join(" ")}` : ""}`);
if (fail.length) process.exit(1);
