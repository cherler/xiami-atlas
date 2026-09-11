/**
 * README 原文漂移检查：**上游把话改了，我们写的判断就可能变成假话。**
 *
 * ## 为什么非要这一支
 *
 * `refresh-repos.mjs` 刷的是机器算得出的数：星数、停更月数、许可证标签。
 * 但页面上真正值钱的是**人写的判断** —— scope / control / good / bad / tags，
 * 一百多份。它们没有任何保鲜机制。
 *
 * 而这些判断大量引用的是 README 的原话，比如：
 * - 「README 自己写着『实验性、不建议用于生产』」
 * - 「README 明写只在 Linux 上测过」
 * - 「作者自述约 95% 的代码由 AI 写成」
 *
 * **上游哪天把那句删了，页面上这句就成了假话，而没有任何东西会响。**
 * 星数会变、停更会变，这些都有人看着；唯独「他当初是怎么说的」没人看着。
 *
 * ## 判据：和 data/readme/ 里那份比
 *
 * 那个目录本来就是构建时用的原文快照（构建不出网，见 fetch-readme.mjs）。
 * 既然快照在，diff 就是白捡的 —— 重抓一遍，逐字比，变了就报。
 *
 * ## 三件事必须分开报，混一起就没用了
 *
 * 1. **变了** —— 要人看一眼判断还成不成立
 * 2. **抓不到** —— 我们够不着，不是上游改了（限流、网络、仓库私有化）
 * 3. **没了** —— 仓库 404 / 改名，链接会死
 *
 * 这个项目在「取不到 vs 不存在」上栽过好几次（GitHub 限流被报成「仓库没了」、
 * 匿名接口限流被报成「这些仓库没有 README」）。**这里从一开始就分开。**
 *
 * ## 它不写数据
 *
 * 和 `watch.mjs` 一样只报不改：判断是人写的，改不改由人定。
 * 快照要更新的话，看完之后跑 `node scripts/fetch-readme.mjs <id>`。
 *
 *   node scripts/readme-drift.mjs              # 全查
 *   node scripts/readme-drift.mjs unity-mcp    # 只查一个
 *   node scripts/readme-drift.mjs --quote      # 连带核对页面里引了 README 的那些判断
 */
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";

const a = JSON.parse(readFileSync("data/atlas.json", "utf8"));
const only = process.argv.slice(2).filter((x) => !x.startsWith("--"));
const QUOTE = process.argv.includes("--quote");

const HAS_GH = (() => {
  try { execFileSync("gh", ["auth", "status"], { stdio: "ignore" }); return true; } catch { return false; }
})();
class RateLimited extends Error {}

/** 走 `gh api`（5000/小时）。匿名接口 60/小时，仓库过 75 个必撞 —— 那个坑踩过。 */
const fetchReadme = (owner, repo) => {
  if (HAS_GH) {
    try {
      return execFileSync("gh", ["api", `repos/${owner}/${repo}/readme`, "-H", "Accept: application/vnd.github.raw"],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
    } catch (e) {
      const s = String(e.stderr ?? e);
      if (/rate limit/i.test(s)) throw new RateLimited();
      if (/404|Not Found/i.test(s)) throw new Error("404");
      throw e;
    }
  }
  const md = execFileSync("curl", ["-sL", "--max-time", "40", "-A", "xiamimate-ai-atlas",
    "-H", "Accept: application/vnd.github.raw", `https://api.github.com/repos/${owner}/${repo}/readme`],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (md.trim().startsWith("{") && /rate limit/i.test(md)) throw new RateLimited();
  if (md.trim().startsWith("{") && /Not Found/i.test(md)) throw new Error("404");
  if (!md || md.trim().startsWith("{")) throw new Error("返回的不是 README");
  return md;
};

/**
 * 只比**有意义的改动**。
 *
 * README 里天天在动的东西：星数徽章、下载量、CI 状态、最近更新列表。
 * 那些一变就报，等于每次都报 —— **而一个每次都响的警报等于没有警报**
 * （watch.mjs 的第二条硬约束）。所以先把这些噪音剥掉再比。
 */
const denoise = (s) => s
  .replace(/!?\[[^\]]*\]\((https?:\/\/(img\.shields\.io|badgen\.net|badge\.fury\.io|static\.pepy\.tech|codecov\.io)[^)]*)\)/g, "")
  .replace(/<img[^>]*(shields\.io|badgen|codecov)[^>]*>/g, "")
  .replace(/\b\d[\d,.]*\s*(stars?|forks?|downloads?|★)\b/gi, "")
  .replace(/<!--\s*recent-updates:start\s*-->[\s\S]*?<!--\s*recent-updates:end\s*-->/g, "")
  // 机器自动生成的 README 里那句「Last updated: <时间戳>」每隔几小时自己重写一次，
  // 内容一字没动也会算成漂移 —— 又一个「每次都响=等于没响」的源（awesome-seedance2 就是）。
  .replace(/Last updated:\s*\d{4}-\d\d-\d\d[T \d:.Z]*/gi, "")
  .replace(/\s+/g, " ")
  .trim();

/** 改了多少 —— 只给个粗粒度的量，让人判断值不值得看。 */
const diffSize = (was, now) => {
  const A = was.split(/(?<=[。.!?])/).map((x) => x.trim()).filter(Boolean);
  const B = now.split(/(?<=[。.!?])/).map((x) => x.trim()).filter(Boolean);
  const sa = new Set(A), sb = new Set(B);
  return { 删: A.filter((x) => !sb.has(x)).length, 增: B.filter((x) => !sa.has(x)).length };
};

/**
 * 页面上哪些判断是**引了 README 原话**的。
 *
 * 这些是漂移风险最高的 —— 别的判断是我们自己的观察，上游改了也还成立；
 * 引原话的那些，上游一改就直接变成假话。
 */
const QUOTED = /README|自述|作者自己|官方明说|明写|原话/;
const quotedBits = (p) => [
  ...(p.good ?? []).map((x) => ["优势", x]),
  ...(p.bad ?? []).map((x) => ["局限", x]),
  ...(p.hands?.pitfalls ?? []).map((x) => ["坑", `${x.where}：${x.note}`]),
  ["范围", p.scope ?? ""], ["靠什么做到", p.control ?? ""], ["门槛", p.hw ?? ""],
].filter(([, x]) => QUOTED.test(x));

const changed = [], same = [], missSnap = [], gone = [], failed = [];
let stopped = false;

for (const t of a.topics ?? []) {
  for (const p of t.projects ?? []) {
    if (stopped) break;
    if (only.length && !only.includes(p.id)) continue;
    const m = p.url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!m) continue;
    const snap = `data/readme/${p.id}.md`;
    if (!existsSync(snap)) { missSnap.push(p); continue; }

    let now;
    try { now = fetchReadme(m[1], m[2]); }
    catch (e) {
      if (e instanceof RateLimited) {
        console.error(`\n⏳ GitHub 限流，停在 ${p.zh}。` +
          `${HAS_GH ? "gh 也被限了，等一小时再跑。" : "装 gh 并 gh auth login 可提到 5000/小时。"}\n` +
          `   **这是够不着，不是上游改了** —— 已比过的结果照常报，剩下的下次补。`);
        stopped = true; break;
      }
      if (String(e.message) === "404") { gone.push(p); continue; }
      failed.push(p); continue;
    }

    const was = denoise(readFileSync(snap, "utf8"));
    const cur = denoise(now);
    if (was === cur) { same.push(p); continue; }
    changed.push({ p, topic: t.zh, ...diffSize(was, cur), quotes: quotedBits(p) });
  }
}

// ────────────────────────── 报告 ──────────────────────────
const n = changed.length + same.length;
console.log(`比了 ${n} 份 README${stopped ? "（中途被限流，没比完）" : ""}\n`);

if (changed.length) {
  console.log(`${"─".repeat(64)}\n上游改过话的 ${changed.length} 个：\n`);
  for (const c of changed) {
    console.log(`  ❗ ${c.topic} › ${c.p.zh}   删 ${c.删} 句 · 增 ${c.增} 句`);
    console.log(`     ${c.p.url}`);
    if (c.quotes.length) {
      console.log(`     **页面上有 ${c.quotes.length} 处引了 README 的判断，逐条核：**`);
      for (const [k, v] of c.quotes.slice(0, 4)) console.log(`       · ${k}：${v.replace(/\*\*/g, "").slice(0, 78)}`);
    } else {
      console.log(`     （页面上没有引原话的判断，风险低）`);
    }
    console.log(`     核完更新快照：node scripts/fetch-readme.mjs ${c.p.id}\n`);
  }
  console.log(`${"─".repeat(64)}`);
}

if (gone.length) console.log(`\n❗ 仓库 404 / 改名 ${gone.length} 个（链接会死）：${gone.map((p) => p.zh).join(" · ")}`);
if (missSnap.length) console.log(`\n没有快照 ${missSnap.length} 个，先跑 fetch-readme：${missSnap.map((p) => p.id).join(" ")}`);
if (failed.length) console.log(`\n抓不到 ${failed.length} 个（**是够不着，不是没了**）：${failed.map((p) => p.zh).join(" · ")}`);
if (!changed.length && !gone.length) console.log("✅ 没有一份 README 改过话，页面上的引用照旧成立。");

/**
 * **只有「仓库没了」才判失败。**
 * 「改过话」是要人看，不是错 —— 判成失败会让这支脚本天天红，
 * 然后就没人看了。
 */
process.exit(gone.length ? 1 : 0);
