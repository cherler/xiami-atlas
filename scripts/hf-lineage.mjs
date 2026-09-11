/**
 * 从官方 Hugging Face 组织采**开源视频模型的发布谱系**。
 *
 * ## 为什么这是最好的来源
 *
 * 模型名本身就编码了代际和能力：`Wan2.1-FLF2V`＝首尾帧、`Wan2.2-S2V`＝语音驱动、
 * `SkyReels-V2-I2V`＝图生视频。发布时间由 API 给出，**比任何新闻稿都准**。
 * 而且它能一路回溯到 2023 年 —— 那正是演化树需要的纵深。
 *
 * ## 必须用 createdAt，不能用 lastModified
 *
 * 第一版我读的是 `lastModified`，把它当成了发布日期。结果 Wan2.2 记成 2025-08-07
 * （实际 2025-07-18）、Animate 记成 2025-11-05（实际 2025-09-11）——**差了两个月**。
 * 仓库发布之后还会被反复更新，**「最后修改」和「什么时候发布」根本不是一回事**。
 * 这类错最阴：日期看着合理，图也画得出来，但整条时间线是歪的。
 *
 * ## 三件事这支不做
 *
 * 1. **不写 atlas.json** —— 只产候选，人工过一遍再入库
 * 2. **不收 -Diffusers / -diffusers 端口** —— 那是同一个模型的另一种格式，不是新模型
 * 3. **不收 LoRA / upscaler / 工具** —— 除非它本身代表一项新能力
 *
 *   node scripts/hf-lineage.mjs           # 打候选
 *   node scripts/hf-lineage.mjs --json    # 写 data/lineage-candidates.json
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || "";
if (PROXY && !process.env.NODE_USE_ENV_PROXY) {
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync(process.execPath, [process.argv[1], ...process.argv.slice(2)],
    { stdio: "inherit", env: { ...process.env, NODE_USE_ENV_PROXY: "1" } });
  process.exit(r.status ?? 1);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** 官方组织 → 我们库里的模型 id（没有对应的先留 null，说明是候选新面孔）。 */
/**
 * 官方组织 → 我们库里的模型 id（没有对应的先留 null，说明是候选新面孔）。
 *
 * `d` = 这一条扫的是哪个方向。**同一个组织可以出现两次** —— 腾讯的 HF 组织下
 * 既有 HunyuanVideo 又有 HunyuanImage，它们属于两卷，得分别过滤。
 *
 * ⚠️ 加了 AI 图像那一批（2026-08-11）。此前这张表只有 10 家视频公司、
 * 过滤器也只有一个写死的 VIDEO 正则 —— **图像那 53 个谱系节点全是手工补的，
 * 这条自动化线对图像是空的**。负责人问「图像的采集 agent 做好了吗」才发现。
 */
const ORGS = [
  // ── AI 视频
  { org: "Wan-AI", m: "wan", zh: "阿里 · 万相", d: "video" },
  { org: "Lightricks", m: "ltx", zh: "Lightricks · LTX", d: "video" },
  { org: "tencent", m: null, zh: "腾讯 · 混元视频", d: "video" },
  { org: "Skywork", m: "skyreels", zh: "昆仑万维 · SkyReels", d: "video" },
  { org: "genmo", m: null, zh: "Genmo · Mochi", d: "video" },
  { org: "hpcai-tech", m: null, zh: "Open-Sora", d: "video" },
  { org: "rhymes-ai", m: null, zh: "Rhymes · Allegro", d: "video" },
  { org: "THUDM", m: null, zh: "智谱 · CogVideo", d: "video" },
  { org: "MiniMaxAI", m: "hailuo", zh: "MiniMax · 海螺", d: "video" },
  { org: "Alibaba-Research-Intelligence-Computing", m: null, zh: "阿里 · ATH", d: "video" },
  // ── AI 图像
  { org: "black-forest-labs", m: "flux", zh: "BFL · FLUX", d: "image" },
  { org: "stabilityai", m: "sd", zh: "Stability · SD", d: "image" },
  { org: "Qwen", m: "qwen-image", zh: "阿里 · 通义千问图像", d: "image" },
  { org: "Tongyi-MAI", m: "z-image", zh: "阿里 · Z-Image", d: "image" },
  { org: "tencent", m: "hunyuan-image", zh: "腾讯 · 混元图像", d: "image" },
  { org: "Kwai-Kolors", m: "kolors", zh: "快手 · 可图", d: "image" },
  { org: "HiDream-ai", m: "hidream", zh: "智象未来 · HiDream", d: "image" },
  { org: "baidu", m: "ernie-image", zh: "百度 · 文心图像", d: "image" },
  { org: "ATH-MaaS", m: "ovis-image", zh: "阿里 · Ovis（原 AIDC-AI，组织已搬家）", d: "image" },
  { org: "nvidia", m: "pixeldit", zh: "NVIDIA · PixelDiT", d: "image" },
  { org: "ideogram-ai", m: "ideogram", zh: "Ideogram", d: "image" },
  { org: "Boogu", m: "boogu-image", zh: "Boogu", d: "image" },
  { org: "NewBie-AI", m: "newbie-image", zh: "NewBie AI", d: "image" },
  { org: "circlestone-labs", m: "anima", zh: "Circlestone · Anima", d: "image" },
  { org: "microsoft", m: "lens", zh: "微软 · Lens / Mage-Flow", d: "image" },
  // ── AI 文本（2026-08-11 开）。闭源那几家（Claude / GPT / Gemini / 豆包 / Grok）
  //    HF 上没有权重，谱系走各家官方文档，不在这张表里。
  { org: "Qwen", m: "qwen-text", zh: "阿里 · 通义千问", d: "text" },
  { org: "deepseek-ai", m: "deepseek", zh: "深度求索 · DeepSeek", d: "text" },
  { org: "moonshotai", m: "kimi", zh: "月之暗面 · Kimi", d: "text" },
  { org: "zai-org", m: "glm", zh: "智谱 · GLM", d: "text" },
  { org: "MiniMaxAI", m: "minimax-text", zh: "MiniMax · 文本", d: "text" },
  { org: "meta-llama", m: "llama", zh: "Meta · Llama", d: "text" },
  { org: "mistralai", m: "mistral-text", zh: "Mistral", d: "text" },
  /**
   * ⚠️ 这三家是 **2026-08-13 被魔搭那一支照出来的漏**：加魔搭时它报出
   *「面壁 / 阶跃 / 上海 AI 实验室 —— 我们的 HF 扫描清单里根本没有」。
   * 三家在 HF 上都有官方组织、都有百万级下载的模型，**只是我们一直没扫**。
   * 交叉源的第一份价值不是新模型，是**照出自己漏了什么**。
   */
  { org: "openbmb", m: null, zh: "面壁 · MiniCPM", d: "text" },
  { org: "internlm", m: null, zh: "上海 AI 实验室 · InternLM", d: "text" },
  { org: "stepfun-ai", m: null, zh: "阶跃星辰 · Step", d: "text" },
  { org: "stepfun-ai", m: null, zh: "阶跃星辰 · Step（语音）", d: "sound" },
  // ── AI 声音（2026-08-12 开）。闭源那几家（ElevenLabs / OpenAI / Gemini TTS /
  //    Lyria / Grok Voice）HF 上没有权重，谱系走各家官方文档。
  { org: "zai-org", m: "glm-voice", zh: "智谱 · 语音", d: "sound" },
  { org: "Qwen", m: "qwen-omni", zh: "阿里 · Qwen 语音", d: "sound" },
  { org: "FunAudioLLM", m: null, zh: "阿里 · FunAudio（CosyVoice）", d: "sound" },
  { org: "fishaudio", m: null, zh: "Fish Audio", d: "sound" },
  { org: "hexgrad", m: null, zh: "Kokoro", d: "sound" },
];

/**
 * ⚠️ **方向过滤器与代际键已经搬到 `lib/model-filters.mjs`**（2026-08-13）。
 * 魔搭那一支要用同一套判据 —— 复制一份的结果一定是两边漂，
 * 而日志照样打「N 代」，看起来像结论。改判据请去那个文件，两支一起生效。
 */
import { pick, NOISE, genKey, foldGenerations } from "./lib/model-filters.mjs";


const rows = [];
for (const t of ORGS) {
  try {
    const r = await fetch(
      /**
       * **降序 + 拉满。** 原来是 `direction=1&limit=200`（最老的 200 条）——
       * 对小组织没差别，对 Qwen / NVIDIA / 微软这种上千个仓库的，
       * 拿到的全是几年前的 LLM，出图模型一个都看不见，
       * 而日志上打的是「出图模型 0 / 全部 200」—— **看起来是结论，其实是截断**。
       * 实测 HF 对 limit 有上限（给 1000 也只回 458），所以顺带记下真实回了多少条。
       */
      `https://huggingface.co/api/models?author=${t.org}&sort=createdAt&direction=-1&limit=1000`,
      { headers: { accept: "application/json", "user-agent": "xiamimate-ai-atlas/0.1 (capability atlas)" } });
    if (!r.ok) { console.log(`${t.zh.padEnd(22)} HTTP ${r.status}`); continue; }
    const j = await r.json();
    const hit = pick(t.d);   // 判据在 lib/model-filters.mjs，和魔搭那一支共用
    const raw = j.filter((x) => hit(x.id) && !NOISE.test(x.id));
    /**
     * **折代际。** 每个代际键只留一条，代表选**最早的那个仓库** ——
     * 那是这一代的首发；后来补的尺寸档和 -Instruct 都晚于它。
     * 折掉多少条要**报出来**：静默的合并和静默的截断一样危险，
     * 人看到「1 条」时得知道背后是 1 个还是 32 个。
     */
    const { keep: kept, folded, thin } = foldGenerations(raw, {
      id: (x) => x.id, created: (x) => x.createdAt ?? "",
      downloads: (x) => x.downloads ?? 0, likes: (x) => x.likes ?? 0,
      freshMs: (x) => Date.parse(x.createdAt ?? 0),
    });
    const keep = kept.map((g) => ({ ...g.rep, _n: g.n, _top: g.top, _maxDl: g.maxDl, _maxLike: g.maxLike }));
    const capped = j.length >= 450 ? "（**已到 API 上限，可能还有没看到的**）" : "";
    console.log(`\n══ ${t.zh}（${t.org}）—— ${{ image: "出图", text: "文本", video: "视频", sound: "声音" }[t.d]}模型 ${keep.length} 代`
      + `（由 ${raw.length} 个仓库折成：省掉 ${folded} 个尺寸/精度档、`
      + `${thin} 个没人关注的冷门产物）/ 看到 ${j.length}${capped}`);
    for (const x of keep) {
      const row = {
        org: t.org, m: t.m, repo: x.id,
        // **方向要跟着行走。** 下游要按方向分开看候选；不带的话
        // 图像新面孔会混进视频那一摞，人审时第一眼就分不清。
        domain: t.d,
        // **createdAt，不是 lastModified** —— 见文件头
        date: (x.createdAt ?? "").slice(0, 10),
        top: x._top ?? null,
        downloads: x.downloads ?? 0, likes: x.likes ?? 0,
        // 这一代折进来多少个仓库。**1 和 32 对人审的意义完全不同** ——
        // 只发过一个仓库的多半是实验品，几十个 SKU 的才是正经一代
        skus: x._n ?? 1,
      };
      rows.push(row);
      console.log(`  ${row.date}  ${row.repo.padEnd(46)} ↓${row.downloads}${row.skus > 1 ? `  ×${row.skus} 档` : ""}`);
    }
  } catch (e) {
    console.log(`${t.zh.padEnd(22)} 抓不到：${String(e.message).slice(0, 60)}`);
  }
}

rows.sort((a, b) => a.date.localeCompare(b.date));
console.log(`\n共 ${rows.length} 条，最早 ${rows[0]?.date}，最新 ${rows[rows.length - 1]?.date}`);

if (process.argv.includes("--json")) {
  writeFileSync(join(ROOT, "data/lineage-candidates.json"),
    JSON.stringify({ note: "HF createdAt 采集的开源模型候选（每行带 domain 与 skus=这一代折进来几个仓库），**未经人工核**，不要直接当数据用", rows }, null, 2) + "\n");
  console.log("→ data/lineage-candidates.json（没有写 atlas.json）");
}
