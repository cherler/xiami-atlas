/**
 * 从**魔搭 ModelScope** 的官方组织采模型发布记录。
 *
 * 负责人 2026-08-13：「modelscope 是 AI 模型源，类似于 huggingface，
 * 你把它加进数据收集的源里。」
 *
 * ## 为什么值得单开一支，而不是「HF 有就够了」
 *
 * 这一站的采集一直只走 Hugging Face。**中文这边有一整类东西 HF 那一路看不见**：
 * 有的先发魔搭后发 HF、有的只发魔搭、有的两边模型名不一样。
 * 所以这支的产出里专门标一列 **`only_ms`** —— 「HF 那一路没看到的」，
 * 那才是加这个源换来的真东西；其余部分只是交叉印证。
 *
 * ## 三条和 HF 那支一样的纪律
 *
 * 1. **用 `CreatedTime`，不用 `LastUpdatedTime`。** 仓库发布后还会被反复更新，
 *    「最后修改」不是「什么时候发布」。HF 那支当初就栽在这，整条时间线歪了两个月。
 * 2. **不写 `atlas.json`** —— 只产候选，人工过一遍再入库。
 * 3. **判据和 HF 那支共用** `lib/model-filters.mjs`：复制一份的结果一定是两边漂。
 *
 * ## 接口是抓出来的，不是文档里查的
 *
 * 魔搭没有公开的列表 API 文档：`GET /api/v1/models` 回 404，
 * `POST /api/v1/dolphin/models` 回 404，`POST /api/v1/models` 回
 * 「user not logged in」。**真正能用的是网页自己调的那个** ——
 * 用浏览器拦请求拿到：`PUT /api/v1/dolphin/models`，带
 * `Criterion: [{category:"organizations", ...}]`，免登录。
 * ⚠️ **动词是 PUT 不是 POST**（我先用 POST 试，得到 404 差点判定「没有这个接口」）。
 *
 *   node scripts/modelscope.mjs            # 打候选
 *   node scripts/modelscope.mjs --json     # 写 data/modelscope-candidates.json
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pick, NOISE, genKey, foldGenerations } from "./lib/model-filters.mjs";

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";
if (PROXY && !process.env.NODE_USE_ENV_PROXY) {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, [process.argv[1], ...process.argv.slice(2)],
    { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });
  process.exit(r.status ?? 1);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://modelscope.cn/api/v1/dolphin/models";

/**
 * 官方组织 → 我们库里的模型 id（`null` = 还没进库的新面孔）。
 * 每一条都在 2026-08-13 实测过组织存在、能拿到模型数。
 *
 * ⚠️ **`AI-ModelScope` 故意不收。** 它有 1,979 个模型，但那是**搬运组织** ——
 * 把 HF 上别人的权重镜像过来。收它会让「中文侧独占」这一列全是假的，
 * 而那一列正是这支脚本存在的理由。
 *
 * ## `hf` 这一列：**能不能判「只有魔搭有」，取决于我们在 HF 侧扫没扫过这家**
 *
 * 第一版没有这一列，跑出来 262 代里 172 代标成「HF 那一路没看到」—— **那是假的**：
 * 面壁、阶跃、上海 AI 实验室这三家，我们的 HF 扫描清单里**根本没有**，
 * 于是「HF 没看到」变成了必然，而不是发现。
 * **一个恒为真的判据不是判据。** 所以每家显式写出 HF 侧的对应组织：
 * 没有对应的，`only_ms` 一律记 `null`（判不了），并在报告里单独列出来 ——
 * 「我们的 HF 扫描少了这几家」本身就是这一轮最该报的发现。
 */
const ORGS = [
  { org: "Wan-AI", hf: "Wan-AI", m: "wan", zh: "阿里 · 万相", d: "video" },
  { org: "Tencent-Hunyuan", hf: "tencent", m: null, zh: "腾讯 · 混元（视频）", d: "video" },
  { org: "Tencent-Hunyuan", hf: "tencent", m: "hunyuan-image", zh: "腾讯 · 混元（图像）", d: "image" },
  { org: "Tencent-Hunyuan", hf: "tencent", m: "hunyuan3d", zh: "腾讯 · 混元（3D）", d: "threed" },
  { org: "Qwen", hf: "Qwen", m: "qwen-image", zh: "阿里 · 通义千问（图像）", d: "image" },
  { org: "Qwen", hf: "Qwen", m: "qwen-text", zh: "阿里 · 通义千问（文本）", d: "text" },
  { org: "Qwen", hf: "Qwen", m: "qwen-omni", zh: "阿里 · 通义千问（语音）", d: "sound" },
  { org: "FunAudioLLM", hf: "FunAudioLLM", m: null, zh: "阿里 · FunAudio（CosyVoice）", d: "sound" },
  { org: "ZhipuAI", hf: "zai-org", m: "glm", zh: "智谱 · GLM", d: "text" },
  { org: "deepseek-ai", hf: "deepseek-ai", m: "deepseek", zh: "深度求索 · DeepSeek", d: "text" },
  { org: "Kwai-Kolors", hf: "Kwai-Kolors", m: "kolors", zh: "快手 · 可图", d: "image" },
  // ↓ 2026-08-13 这三家已经补进 hf-lineage 的 ORGS（就是被这支脚本照出来的），现在能判了
  { org: "stepfun-ai", hf: "stepfun-ai", m: null, zh: "阶跃星辰 · Step", d: "text" },
  { org: "OpenBMB", hf: "openbmb", m: null, zh: "面壁 · MiniCPM", d: "text" },
  { org: "Shanghai_AI_Laboratory", hf: "internlm", m: null, zh: "上海 AI 实验室 · InternLM", d: "text" },
  /**
   * ⚠️ **达摩院的 `iic` 在 Hugging Face 上根本没有组织**（2026-08-13 实测：
   * `iic` 与 `damo-vilab` 两个名字查回来都是 0 条）。
   * 这是**真·魔搭独有的一整个组织**，1,083 个模型 —— 也是加这个源最硬的那条理由。
   * `hf: null` 在这里不是「还没扫」，是「那边没有」，所以单独标一句。
   */
  { org: "iic", hf: null, hf_absent: true, m: null, zh: "阿里达摩院 · iic（HF 上没有这个组织）", d: "sound" },
];

/** 一次翻一页。魔搭默认只回 30 条，`PageSize` 拉满也不会更多 —— 所以必须翻页。 */
async function page(org, n) {
  const r = await fetch(API, {
    method: "PUT",   // ⚠️ PUT，不是 POST（见文件头）
    headers: { "content-type": "application/json", "user-agent": "xiamimate-ai-atlas/0.1 (capability atlas)" },
    body: JSON.stringify({
      PageSize: 100, PageNumber: n, SortBy: "GmtCreated", Name: "", IncludePrePublish: true,
      Criterion: [{ category: "organizations", predicate: "contains", values: [org] }],
    }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  return j?.Data?.Model?.Models ?? [];
}

/** HF 那一路这次看到了什么 —— 用来判「只有魔搭有」。没有这份文件就不判，**不猜**。 */
const HF_PATH = join(ROOT, "data/lineage-candidates.json");
const hfKeys = existsSync(HF_PATH)
  ? new Set(JSON.parse(readFileSync(HF_PATH, "utf8")).rows.map((r) => genKey(r.repo)))
  : null;
if (!hfKeys) console.log("⚠️ 没有 data/lineage-candidates.json —— 这一轮不判「只有魔搭有」，先跑一次 hf-lineage.mjs");

const rows = [];
for (const t of ORGS) {
  let all = [];
  try {
    for (let n = 1; n <= 12; n++) {
      const got = await page(t.org, n);
      all = all.concat(got);
      if (got.length < 30) break;   // 回不满一页就是到底了
    }
  } catch (e) {
    console.log(`${t.zh.padEnd(26)} ✗ ${e.message}`);
    continue;
  }
  const hit = pick(t.d);
  const raw = all.filter((x) => hit(`${t.org}/${x.Name}`) && !NOISE.test(x.Name));

  // 折代际 + 地板过滤：判据与 HF 那支共用（**热度看整代最大值，不是代表的值** —— 见 lib 里那段注释）
  const { keep: kept, folded, thin } = foldGenerations(raw, {
    id: (x) => x.Name, created: (x) => x.CreatedTime ?? 0,
    downloads: (x) => x.Downloads ?? 0, likes: (x) => x.Stars ?? 0,
    freshMs: (x) => (x.CreatedTime ?? 0) * 1000,
  });
  const keep = kept.map((g) => ({ ...g.rep, _n: g.n, _top: g.top }));

  const judgeable = Boolean(hfKeys && t.hf);
  const onlyMs = judgeable ? keep.filter((x) => !hfKeys.has(genKey(x.Name))).length : 0;
  console.log(`\n══ ${t.zh}（${t.org}）—— ${keep.length} 代`
    + `（由 ${raw.length} 个仓库折成：省掉 ${folded} 个尺寸/精度档、`
    + `${thin} 个没人关注的）/ 组织下共看到 ${all.length} 个`
    + (judgeable ? ` · **HF 那一路没看到的 ${onlyMs} 代**` : " · ⚠️ HF 侧没扫这家，判不了「只有魔搭有」"));

  for (const x of keep) {
    const key = genKey(x.Name);
    const only = judgeable ? !hfKeys.has(key) : null;   // 判不了就是 null，**不是 false**
    rows.push({
      org: t.org, m: t.m, repo: `${t.org}/${x.Name}`, domain: t.d,
      // **CreatedTime，不是 LastUpdatedTime** —— 见文件头
      date: new Date((x.CreatedTime ?? 0) * 1000).toISOString().slice(0, 10),
      downloads: x.Downloads ?? 0, stars: x.Stars ?? 0,
      license: x.License || null,
      zh_name: x.ChineseName || null,
      folded: x._n ?? 1,
      // **这一代里指标最高的那个 SKU** —— 代表是最早的那个（日期纪律），
      // 但人审时该看的是它：冷门小档当代表会让人以为这一代没人用
      top: x._top ?? null,
      only_ms: only,
      url: `https://modelscope.cn/models/${t.org}/${x.Name}`,
    });
    console.log(`  ${only ? "🔵" : "  "} ${x.Name.padEnd(38)} ${new Date((x.CreatedTime ?? 0) * 1000).toISOString().slice(0, 10)}`
      + ` ↓${String(x.Downloads ?? 0).padStart(9)} ♥${String(x.Stars ?? 0).padStart(5)} ${x.License || "无许可"}`
      + (x._n > 1 ? `  （折了 ${x._n} 个档）` : ""));
  }
}

const only = rows.filter((r) => r.only_ms === true).length;
const blind = rows.filter((r) => r.only_ms === null).length;
const noHf = [...new Set(ORGS.filter((t) => !t.hf && !t.hf_absent).map((t) => `${t.zh}（${t.org}）`))];
const absent = [...new Set(ORGS.filter((t) => t.hf_absent).map((t) => `${t.zh}（${t.org}）`))];
console.log(`\n共 ${rows.length} 代。`);
console.log(`  · **${only} 代在 HF 那一路的候选里没出现**（🔵）—— 加这个源换来的就是这些。`);
console.log(`    ⚠️ 「没出现」有两种：真的只发了魔搭，或者 HF 那边名字不一样 —— **人工看一眼才算数**。`);
console.log(`  · ${blind} 代判不了：来自 HF 侧没扫过的组织。`);
if (absent.length) {
  console.log(`\n🔷 **这几家在 Hugging Face 上根本没有组织** —— 真·魔搭独有，加这个源最硬的理由：`);
  for (const n of absent) console.log(`     ${n}`);
}
if (noHf.length) {
  console.log(`\n⚠️ **这几家我们的 HF 扫描清单里根本没有** —— 这本身是个发现，比上面那些候选更该先处理：`);
  for (const n of noHf) console.log(`     ${n}`);
  console.log(`   要么在 hf-lineage.mjs 的 ORGS 里补上它们，要么写明为什么不收。`);
}

if (process.argv.includes("--json")) {
  writeFileSync(join(ROOT, "data/modelscope-candidates.json"),
    JSON.stringify({
      note: "魔搭 ModelScope 官方组织的发布候选。**只产候选，不写 atlas.json。**"
        + " `only_ms` = 这一代在 HF 那一路的候选里没出现 —— 可能只发了魔搭，也可能只是名字不同，人工核。"
        + " 日期取 CreatedTime（不是 LastUpdatedTime）。判据与 HF 那支共用 scripts/lib/model-filters.mjs。",
      generated_at: new Date().toISOString().slice(0, 10),
      rows,
    }, null, 1) + "\n");
  console.log("→ data/modelscope-candidates.json（没有写 atlas.json）");
}
