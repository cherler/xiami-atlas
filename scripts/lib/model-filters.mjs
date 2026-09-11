/**
 * 模型仓库的**方向过滤器与代际键**。两支采集共用：`hf-lineage.mjs`（Hugging Face）
 * 与 `modelscope.mjs`（魔搭 ModelScope）。
 *
 * ## 为什么抽出来
 *
 * 2026-08-13 加魔搭那一支时，本可以把这一大坨正则复制一份过去 ——
 * **那样两边一定会漂**：以后在 HF 那边补一条排除规则（这一年里补过四次），
 * 魔搭这边就悄悄漏掉同一类噪音，而日志上照样打「N 代」，看起来像结论。
 *
 * 这些正则不是通用知识，是**一年里被真实噪音打磨出来的**：
 * 每一条排除词后面都有一次误收。改它之前先读注释里记的那次误收。
 */
const VIDEO = /video|t2v|i2v|ti2v|s2v|flf|vace|animate|dance|mochi|cogvideo|allegro|hunyuanvideo|skyreels|ltx|wan\d/i;
/**
 * 出图那一卷的匹配。**不能只写 `image`** —— 那会把 HunyuanVideo 的
 * image-to-video 也捞进来；也不能只列型号名，新面孔就是要靠它发现的。
 * 做法：先要求像出图模型（型号名或 image/t2i 之类），再用下面的 NOT_IMAGE 把
 * 明显是视频/3D/理解类的剔掉 —— **宁可多捞一点让人去看，也别静默漏掉一代**。
 */
/**
 * 文本那一卷。**主要靠排除**：这些组织下绝大多数就是语言模型，
 * 真正要滤掉的是出图/视频/语音/嵌入这些**产出物不是文本**的旁支，
 * 以及 base/instruct 之外的量化与端口档（交给 NOISE）。
 */
const TEXT = /.*/;
const NOT_TEXT = new RegExp([
  "image", "video", "audio", "speech", "tts", "asr", "voice", "vl$", "-vl-", "vision",
  "embedding", "rerank", "guard", "omni", "diffusion", "t2i", "t2v",
  /**
   * ⚠️ 2026-08-11 收口。开文本方向那天 `NOT_TEXT` 只有上面一行，
   * 结果候选一次涌出 696 条 —— **一个人审不完的清单等于没有清单**（§59.3）。
   * 逐条看过之后，混进来的是这几类，它们的共同点是**产出物不是文本**或**根本不是模型**：
   */
  "cogview", "kaleido", "-s2v", "cogagent",   // 出图 / 视频 / GUI 智能体，挂在同一个组织下
  "ocr", "-math$", "-math-",                  // 单任务衍生，不是这一代的发布本体
  "^esft-", "sae-", "-sae", "probe", "reward", // 研究产物：专家微调、稀疏自编码器、探针、奖励模型
  /**
   * ⚠️ 2026-08-12 第二次收口。上面那批只挡住了名字里明写 image/video/vision 的，
   * 可各家给跨模态支线起的**是产品名，不是功能名** —— 光看名字看不出它产出什么：
   */
  "janus",                                    // DeepSeek 的图像生成线（Janus / JanusFlow / Janus-Pro）
  "pixtral", "voxtral",                        // Mistral 的视觉线与音频线
  "visualglm", "cogvlm", "vlm", "vl\\d",        // 智谱的视觉线；vl\d 收的是 deepseek-vl2 那种「vl+代号」
  "\\d+\\.?\\d*v(-|$)", "-v-flash",            // glm-4v / GLM-4.5V / GLM-4.6V-Flash：**版本号后面那个 v 就是 vision**
  "qvq",                                       // 通义的视觉推理线
  "autoglm", "scail",                          // GUI 智能体 / 未公开说明的研究预览
  "forcedaligner",                             // 音频对齐
  "minimax-h3",                                // **它是视频模型**，只是挂在 MiniMax 同一个组织下
].join("|"), "i");

/**
 * 声音那一卷。**收产出物是音频的**：TTS、音色克隆、音乐、端到端语音对话。
 * ⚠️ **ASR 明确不收**（ontology 规则十一）—— 它产出的是文本，
 * 而且文本卷的 `t-audio` 已经记了同一件事。所以 whisper / asr / stt / paraformer
 * 这些全在 NOT_SOUND 里，**这是边界不是漏采**。
 */
const SOUND = /voice|speech|tts|audio|cosy|sensevoice|kokoro|fish|music|sing|song|vocal|omni/i;
const NOT_SOUND = /asr|whisper|-stt|paraformer|transcri|vad$|punc|denoise|separat|embedding|rerank|image|video|-vl-|vl$/i;

const IMAGE = /image|t2i|text-to-image|flux|stable-diffusion|sd3|sdxl|kolors|ideogram|hidream|ernie-image|ovis-image|pixeldit|anima|boogu|newbie|lens|mage-flow|krea/i;
/**
 * 剔掉的：视频、**图生 3D**（TRELLIS 那一支产出的是网格不是图，已记在
 * `excluded` 里当作另一个方向）、以及理解类模型。
 * TRELLIS 名字里带 image 却是 3D —— **按名字收必然要有一张这样的例外表**。
 */
const NOT_IMAGE = /video|t2v|i2v|animate|3d|mesh|splat|audio|speech|vl-|-vl|reranker|embedding|trellis|triposr|dreamfusion|hunyuan3d/i;
/**
 * 噪音过滤：端口与配件不是新模型。
 *
 * ⚠️ **不能按 `-dev` / `distilled` 过滤。** LTX 的 0.9.7 和 0.9.8 只发过
 * `-dev` 和 `-distilled` 版本 —— 那就是那一代的发布本体，滤掉就等于说这两代不存在。
 * 真正该滤的只有：格式端口（-diffusers）、量化（-fp8/-nvfp4）、外挂（LoRA/upscaler）。
 * 代际去重交给下游按**版本号**归组，不靠名字后缀猜。
 */
const NOISE = new RegExp([
  "-diffusers$", "-Diffusers$", "LoRA", "lora", "upscaler", "PromptRewrite",
  "-fp8$", "-nvfp4$", "-hf$", "tokenizer", "Tokenizer",
  // ── 出图那一卷的端口与配件（2026-08-11 补）。**判据和上面一样：
  //    它是不是「这一代的发布本体」**。下面这些都不是 ——
  //    换推理后端（onnx / tensorrt / amdgpu / ryzen-ai / -kv）、
  //    拆出来的部件（vae / refiner / controlnet / decoder）。
  //    ⚠️ `-turbo`、`-distilled`、`-dev`、`-klein-4B` 一律**不滤** ——
  //    sdxl-turbo、FLUX.2-klein-4B 就是那一代的发布本体。
  "-onnx$", "tensorrt", "_amdgpu$", "ryzen-ai", "-kv$",
  "vae$", "-refiner", "controlnet", "decoder$",
  // ── 文本那一卷的量化与格式档（2026-08-11 补）。同一个判据：**换个精度不是新模型**。
  //    文本模型的量化衍生比视频多一个数量级 —— 光这一类就占了 704 条里的 242 条。
  "gguf", "gptq", "awq", "-mlx", "mlx-", "bnb-", "-4bit", "-8bit", "nf4",
  "int4", "int8", "fp4", "mxfp", "-w4a", "-w8a", "-quant", "-bf16", "-tgi",
  //    推测解码的草稿模型（eagle / dspark / dflash）**是给某一代提速的配件**，
  //    和 vae、controlnet 同一类：它不是新的一代，没有它那一代照样存在。
  "eagle", "dspark", "dflash",
].join("|"), "i");

/**
 * **冷门产物地板。** 收口到这一步还剩一堆研究产物：ESFT、SAE、LongWriter、webrl、
 * MathGLM、SCAIL、MSAGPT…… 一条条列黑名单是没有尽头的活，下次换个名字又漏。
 * 换成看热度指标 —— 一代正经发布不可能没人关注。
 *
 * ⚠️ **只看下载量会系统性杀掉旗舰。** 第一版设了 ↓5000 的地板，
 * 结果把 `Mistral-Large-3-675B`（↓1177）滤掉了 —— 它是 Mistral 当时的旗舰。
 * 原因不是它不重要，是**没人在自己机器上跑 675B**：
 * **下载量量的是「跑不跑得动」，不是「重不重要」。** 这个假设正好反了。
 *
 * likes 量的才是关注度，实测分得干净：
 *   该留 —— Mistral-Large-3 ♥242、Shieldstral ♥227、DeepSeek-V4-Pro ♥326、GLM-5.2 ♥4926
 *   该滤 —— MathGLM ♥8、MSAGPT ♥2、webrl ♥8、ESFT ♥20、UI2Code ♥24
 * 所以两条地板**过一条就留**，再加一条豁免：
 * `NEW_DAYS` 天内新建的一律留下 —— **刚发布的那一代还没来得及攒任何指标，
 * 而它恰恰是这张表最该抓住的东西**。
 */
const FLOOR_DL = 5000;
const FLOOR_LIKE = 150;
const NEW_DAYS = 120;
const FRESH = Date.now() - NEW_DAYS * 86400000;

/**
 * **代际键：把同一代的一堆 SKU 折成一个。**
 *
 * 这是这支脚本真正缺的那一步 —— 文件头写着「代际去重交给下游按版本号归组」，
 * 可下游根本没有这一步，于是 Qwen3 的 8 个尺寸 × 4 种量化 = 32 行全躺在候选里。
 * **谱系树的一个节点是「一个产品线的一代」，不是一个 SKU。**
 *
 * 只剥三类**不改变身份**的后缀：参数量、精度/格式、base/instruct/chat。
 * **能力后缀一个都不能剥** —— Wan2.1-FLF2V（首尾帧）和 Wan2.1-I2V（图生视频）
 * 是两项不同能力，折在一起就把演化树最有信息量的那部分抹掉了。
 */
const genKey = (repo) =>
  repo
    .replace(/^[^/]+\//, "")
    .replace(/[-_]?\d+(\.\d+)?[BbMm](?![a-z])/g, "")   // 7B / 1.5B / 235B / 80m
    .replace(/[-_]?A\d+(\.\d+)?B/gi, "")               // MoE 激活量 A22B / A3B
    .replace(/[-_](base|instruct|chat|it|hf)$/i, "")
    .replace(/[-_]\d{4}(-\d{2})?$/, "")                // 尾部日期戳 2507 / 2026-03
    .replace(/[-_]{2,}/g, "-").replace(/[-_]+$/, "")
    .toLowerCase();

export { VIDEO, NOT_TEXT, TEXT, SOUND, NOT_SOUND, IMAGE, NOT_IMAGE, NOISE, FLOOR_DL, FLOOR_LIKE, NEW_DAYS, FRESH, genKey };

/** 按方向挑过滤函数。**两支采集必须用同一套判据**，否则同一个仓库两边结论不同。 */
export const pick = (d) =>
  d === "image" ? (id) => IMAGE.test(id) && !NOT_IMAGE.test(id)
  : d === "text" ? (id) => TEXT.test(id) && !NOT_TEXT.test(id)
  : d === "sound" ? (id) => SOUND.test(id) && !NOT_SOUND.test(id)
  : d === "threed" ? (id) => THREED.test(id) && !NOT_THREED.test(id)
  : (id) => VIDEO.test(id);

/**
 * AI 3D 那一卷（2026-08-13 新增）。收产出物是**网格 / 3D 资产**的；
 * ⚠️ 排除 world / motion —— 世界模型与动作生成的产出物不是资产，按规则十二不属于这一卷。
 */
export const THREED = /3d|mesh|trellis|tripo|hunyuan3d|rodin|meshy|spar3d|instantmesh|craftsman|shape|texgen|uv|rig/i;
export const NOT_THREED = /world|motion|video|t2v|i2v|animate-|dance|audio|speech|vl-|-vl|embedding|rerank/i;

/**
 * **把同一代的一堆 SKU 折成一条，再按热度地板过滤。**
 *
 * ## 这个函数是为一个真 bug 建的（2026-08-13）
 *
 * 原来两支脚本各自内联这段逻辑，做法是「折叠取最早的那个当代表，然后**按代表的
 * 下载/收藏判地板**」。`Wan-AI/Wan2.1-VACE-14B`（↓19,433 ♥501，万相的统一编辑线）
 * 就这么被整代误杀了 —— 同一天还发了个 `Wan2.1-VACE-1.3B`（↓4,348 ♥143），
 * 它更早一点点，于是成了代表，而它两个门槛都差一口气。
 *
 * **代表是最早的那个（日期纪律不能动），但热度必须看整代的最大值** ——
 * 一代里有一个 SKU 火了，这一代就该留下。
 *
 * 顺带修了另一半：日期相同时按下载量高的当代表，
 * 否则「代表」会随 API 返回顺序漂，而那个顺序不是我们能控制的。
 *
 * ⚠️ 这个 bug 是加魔搭那条源**照出来**的：魔搭那边把 VACE 报成「HF 没有」，
 * 一查 HF 明明有 —— **交叉源的第一份价值不是发现新模型，是照出自己的漏**。
 */
export function foldGenerations(items, get) {
  const groups = new Map();
  for (const x of items) {
    const k = genKey(get.id(x));
    const g = groups.get(k);
    const older = !g || get.created(x) < get.created(g.rep)
      || (get.created(x) === get.created(g.rep) && get.downloads(x) > get.downloads(g.rep));
    groups.set(k, {
      rep: older ? x : g.rep,
      n: (g?.n ?? 0) + 1,
      // **整代的最大值**，不是代表的值
      maxDl: Math.max(g?.maxDl ?? 0, get.downloads(x)),
      maxLike: Math.max(g?.maxLike ?? 0, get.likes(x)),
      // 这一代里指标最高的那个 SKU 叫什么 —— 人审时要看的是它，不是那个冷门小档
      top: (g && g.maxDl >= get.downloads(x)) ? g.top : get.id(x),
    });
  }
  const all = [...groups.values()].sort((a, b) => String(get.created(a.rep)).localeCompare(String(get.created(b.rep))));
  const keep = all.filter((g) => g.maxDl >= FLOOR_DL || g.maxLike >= FLOOR_LIKE || get.freshMs(g.rep) >= FRESH);
  return { all, keep, folded: items.length - all.length, thin: all.length - keep.length };
}
