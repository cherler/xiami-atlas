# 收录候选 · 2026-08-14



> **这份名单是筛出来的，不是抄来的。**

> 两路都只是**发现**。收不收按 ontology 规则一（是不是模型）

> 与规则四（Core 每轨 ≤10，**加第 11 个之前先踢掉一个**）人工定。

>

> **按方向分开列** —— 混在一起时，图像那一半永远是空的，

> 而空看起来像「没有新面孔」，其实是「没看」。



## 【AI 视频】

### 一、Artificial Analysis 榜上、我们没收的（闭源侧的「有人真在用」）

（无）

### 二、Hugging Face 下载量前列、我们没收的组织（开源侧的实际采用度）

> ⚠️ 另有 **8 个组织被判成量化 / 搬运号**（仓库八成以上是 GGUF、AWQ、mlx 这类二次分发档），已从下表略过：`Abiray`、`QuantStack`、`bullerwins`、`calcuis`、`city96`、`joeygambino` 等。**判据是仓库名，不是人品** —— 它们里面若有自训模型，会因为名字不带量化后缀而照常出现在上表。

（无）

> ⚠️ HF 这一路混着个人搬运号与量化号（QuantStack、city96、calcuis 之类）。
> **脚本分不出「自己训模型」和「搬别人的」** —— 那要人看一眼组织主页。
> 不要照单全收，也不要因为混了噪音就整路丢掉：Lightricks、nvidia、zai-org
> 都是这一路捞出来的，而它们在闭源榜上完全隐形。

### 当前 Core（clip 轨 10/10，realtime 轨 2/10；括号里是含扩展层的总数 21 / 2）

- `clip` Seedance 2.5（2026-07-31）
- `clip` MiniMax Hailuo H3（2026-07-31）
- `clip` Gemini Omni Flash（2026-05-19）
- `clip` Wan 3.0（2026-08-07）
- `clip` Runway Gen Gen-4.5（2025-12-11）
- `clip` Kling 3.0（2026-02-04）
- `clip` Vidu Q Q3（2026-04-13）
- `clip` Veo 3.1（2025-10） — **superseded**
- `clip` Sora 2（2025-09） — **discontinued**
- `realtime` Vidu S S1（2026-07-03）
- `realtime` Decart Lucy Lucy 2.5（2026-08-07）
- `clip` LTX 2.5（2026-08-13）
- `clip` HappyHorse 1.1（2026-06）
- `clip` SkyReels V3（2026-03）
- `clip` HunyuanVideo 1.5（2025-11-18）
- `clip` Mochi 1（2024-10-22）
- `clip` Allegro T2V（2024-12-17）
- `clip` Open-Sora v2（2025-03-10）
- `still` FLUX 2-dev（2025-11-22）
- `still` Qwen-Image 3.0-pro（2026-08-12）
- `still` Z-Image Turbo（2025-11-25）
- `still` HunyuanImage 3.0（2025-09-25）
- `still` Stable Diffusion XL 1.0（2023-07-25）
- `still` Krea 2-Raw（2026-06-18）
- `still` Seedream 5.0 Pro（2026-08-11）
- `still` Nano Banana 2（gemini-3.1-flash-image）（2026-08-11）
- `still` GPT Image 2（gpt-image-2）（2026-08-11）
- `still` Kolors 待核（2026-08-11）
- `still` Midjourney 待核（2026-08-11）
- `still` Ideogram 4.0（2026-08-12）
- `still` Recraft V4.1（2026-08-11）
- `still` HiDream-I1 O1-Image（2026-05-08）
- `still` ERNIE-Image Aes（2026-05-18）
- `still` Ovis-Image 7B（2025-11-28）
- `still` Lens Lens（2026-05-23）
- `still` Mage-Flow Mage-Flow（2026-07-24）
- `still` PixelDiT 1300M-1024px（2026-03-30）
- `still` Anima Anima（2026-01-29）
- `still` Boogu-Image 0.1-Turbo（2026-06-16）
- `still` NewBie-image Exp0.1（2025-11-30）
- `chat` Claude Fable 5（2026-06-09）
- `chat` GPT GPT-5.6（2026-08-11）
- `chat` Gemini Gemini 3.6 Flash（2026-08-11）
- `chat` Qwen 3.8-max（2026-08-11）
- `chat` DeepSeek V4（2026-07-31）
- `chat` Kimi K3（2026-06-13）
- `chat` GLM GLM-5.2（2026-06-16）
- `chat` MiniMax M3（2026-06-02）
- `chat` Doubao Seed-2.1 Pro（2026-06-23）
- `chat` Llama 4（2025-04-05）
- `chat` Grok 4.5（2026-08-11）
- `chat` Mistral Medium 3.5（2026-03-31）
- `tts` MiniMax Speech speech-2.8-hd（2026-08-12）
- `tts` ElevenLabs Eleven v3（2026-08-12）
- `tts` Gemini TTS 3.1 Flash TTS Preview（2026-08-12）
- `tts` GPT TTS GPT-4o mini TTS（2026-08-12）
- `voice-rt` GLM Voice glm-4-voice（2026-08-12）
- `tts` Qwen Omni 3.5-omni-plus（2026-08-12）
- `music` MiniMax Music music-3.0（2026-08-12）
- `music` Eleven Music v2（2026-08-12）
- `music` Lyria 3 Pro Preview（2026-08-12）
- `voice-rt` GPT Realtime 2.1（2026-08-12）
- `voice-rt` Grok Voice think-fast-2.0（2026-08-12）
- `tts` GLM-TTS GLM-TTS（2026-08-12）
- `tts` CosyVoice Fun-CosyVoice3-0.5B-2512（2025-12-11）
- `tts` Fish Speech s2-pro（2026-03-09）
- `tts` Kokoro 82M v1.1-zh（2025-02-27）
- `clip` FLUX 3 3（2026-08）
- `asset` Hunyuan3D 3.1（2026-08-13）
- `asset` Tripo P1-20260311（2026-08-13）
- `asset` Meshy 7（2026-08-13）
- `asset` Rodin Gen-2.5（2026-08-13）
- `asset` TRELLIS TRELLIS.2-4B（2026-08-13）
- `asset` Seed3D 2.0（2026-08-14）
- `asset` SPAR3D Stable Point Aware 3D（2026-08-13）
- `asset` InstantMesh v1（2026-08-13）
- `asset` Sharp Sharp（2026-08-13）
- `asset` AnySplat v1（2026-08-14）
- `clip` PixVerse V6（2026-08-14）
- `clip` MAGI 2 Preview（2026-08-14）
- `clip` CogVideoX 2b/5b（2026-08-14）
- `clip` I2VGen-XL XL（2026-08-14）
- `still` LongCat Image Edit（2026-08-14）

> clip 轨只剩 1 个空位。按规则四，再进新的就必须先踢一个 ——
> 最该出去的是 **Sora 2**（已公告停服）。但**停服的模型不该从库里删**：
> 「它没了」本身是有用的信息，应降到 Extended 层，而不是消失。

## 【AI 图像】

### 一、Artificial Analysis 榜上、我们没收的（闭源侧的「有人真在用」）

（无）

### 二、Hugging Face 下载量前列、我们没收的组织（开源侧的实际采用度）

> ⚠️ 另有 **3 个组织被判成量化 / 搬运号**（仓库八成以上是 GGUF、AWQ、mlx 这类二次分发档），已从下表略过：`city96`、`xinsir`、`QuantStack`。**判据是仓库名，不是人品** —— 它们里面若有自训模型，会因为名字不带量化后缀而照常出现在上表。

（无）

> ⚠️ HF 这一路混着个人搬运号与量化号（QuantStack、city96、calcuis 之类）。
> **脚本分不出「自己训模型」和「搬别人的」** —— 那要人看一眼组织主页。
> 不要照单全收，也不要因为混了噪音就整路丢掉：Lightricks、nvidia、zai-org
> 都是这一路捞出来的，而它们在闭源榜上完全隐形。

### 当前 Core（clip 轨 10/10，realtime 轨 2/10；括号里是含扩展层的总数 21 / 2）

- `clip` Seedance 2.5（2026-07-31）
- `clip` MiniMax Hailuo H3（2026-07-31）
- `clip` Gemini Omni Flash（2026-05-19）
- `clip` Wan 3.0（2026-08-07）
- `clip` Runway Gen Gen-4.5（2025-12-11）
- `clip` Kling 3.0（2026-02-04）
- `clip` Vidu Q Q3（2026-04-13）
- `clip` Veo 3.1（2025-10） — **superseded**
- `clip` Sora 2（2025-09） — **discontinued**
- `realtime` Vidu S S1（2026-07-03）
- `realtime` Decart Lucy Lucy 2.5（2026-08-07）
- `clip` LTX 2.5（2026-08-13）
- `clip` HappyHorse 1.1（2026-06）
- `clip` SkyReels V3（2026-03）
- `clip` HunyuanVideo 1.5（2025-11-18）
- `clip` Mochi 1（2024-10-22）
- `clip` Allegro T2V（2024-12-17）
- `clip` Open-Sora v2（2025-03-10）
- `still` FLUX 2-dev（2025-11-22）
- `still` Qwen-Image 3.0-pro（2026-08-12）
- `still` Z-Image Turbo（2025-11-25）
- `still` HunyuanImage 3.0（2025-09-25）
- `still` Stable Diffusion XL 1.0（2023-07-25）
- `still` Krea 2-Raw（2026-06-18）
- `still` Seedream 5.0 Pro（2026-08-11）
- `still` Nano Banana 2（gemini-3.1-flash-image）（2026-08-11）
- `still` GPT Image 2（gpt-image-2）（2026-08-11）
- `still` Kolors 待核（2026-08-11）
- `still` Midjourney 待核（2026-08-11）
- `still` Ideogram 4.0（2026-08-12）
- `still` Recraft V4.1（2026-08-11）
- `still` HiDream-I1 O1-Image（2026-05-08）
- `still` ERNIE-Image Aes（2026-05-18）
- `still` Ovis-Image 7B（2025-11-28）
- `still` Lens Lens（2026-05-23）
- `still` Mage-Flow Mage-Flow（2026-07-24）
- `still` PixelDiT 1300M-1024px（2026-03-30）
- `still` Anima Anima（2026-01-29）
- `still` Boogu-Image 0.1-Turbo（2026-06-16）
- `still` NewBie-image Exp0.1（2025-11-30）
- `chat` Claude Fable 5（2026-06-09）
- `chat` GPT GPT-5.6（2026-08-11）
- `chat` Gemini Gemini 3.6 Flash（2026-08-11）
- `chat` Qwen 3.8-max（2026-08-11）
- `chat` DeepSeek V4（2026-07-31）
- `chat` Kimi K3（2026-06-13）
- `chat` GLM GLM-5.2（2026-06-16）
- `chat` MiniMax M3（2026-06-02）
- `chat` Doubao Seed-2.1 Pro（2026-06-23）
- `chat` Llama 4（2025-04-05）
- `chat` Grok 4.5（2026-08-11）
- `chat` Mistral Medium 3.5（2026-03-31）
- `tts` MiniMax Speech speech-2.8-hd（2026-08-12）
- `tts` ElevenLabs Eleven v3（2026-08-12）
- `tts` Gemini TTS 3.1 Flash TTS Preview（2026-08-12）
- `tts` GPT TTS GPT-4o mini TTS（2026-08-12）
- `voice-rt` GLM Voice glm-4-voice（2026-08-12）
- `tts` Qwen Omni 3.5-omni-plus（2026-08-12）
- `music` MiniMax Music music-3.0（2026-08-12）
- `music` Eleven Music v2（2026-08-12）
- `music` Lyria 3 Pro Preview（2026-08-12）
- `voice-rt` GPT Realtime 2.1（2026-08-12）
- `voice-rt` Grok Voice think-fast-2.0（2026-08-12）
- `tts` GLM-TTS GLM-TTS（2026-08-12）
- `tts` CosyVoice Fun-CosyVoice3-0.5B-2512（2025-12-11）
- `tts` Fish Speech s2-pro（2026-03-09）
- `tts` Kokoro 82M v1.1-zh（2025-02-27）
- `clip` FLUX 3 3（2026-08）
- `asset` Hunyuan3D 3.1（2026-08-13）
- `asset` Tripo P1-20260311（2026-08-13）
- `asset` Meshy 7（2026-08-13）
- `asset` Rodin Gen-2.5（2026-08-13）
- `asset` TRELLIS TRELLIS.2-4B（2026-08-13）
- `asset` Seed3D 2.0（2026-08-14）
- `asset` SPAR3D Stable Point Aware 3D（2026-08-13）
- `asset` InstantMesh v1（2026-08-13）
- `asset` Sharp Sharp（2026-08-13）
- `asset` AnySplat v1（2026-08-14）
- `clip` PixVerse V6（2026-08-14）
- `clip` MAGI 2 Preview（2026-08-14）
- `clip` CogVideoX 2b/5b（2026-08-14）
- `clip` I2VGen-XL XL（2026-08-14）
- `still` LongCat Image Edit（2026-08-14）

> clip 轨只剩 1 个空位。按规则四，再进新的就必须先踢一个 ——
> 最该出去的是 **Sora 2**（已公告停服）。但**停服的模型不该从库里删**：
> 「它没了」本身是有用的信息，应降到 Extended 层，而不是消失。

## 人工发现的（自动那两路看不见的）

> 两条自动路各有盲区：AA 榜只收上了竞技场的闭源模型，HF 那一路只看开源权重。
> **落在两边之外的，只能人看见** —— 写在 `data/candidates-manual.json` 里，不会被重跑冲掉。

### `video` Black Forest Labs · FLUX 3（2026-08-13 发现）

**为什么两路都捞不到**：**BFL 从图像跨进了视频**，而两条自动路都看不见这件事：AA 的文生图榜不收视频模型，HF 那一路只看开源权重而 FLUX 3 是闭源 API。

**怎么撞见的**：给图像卷的 FLUX 补 ⬜ 时，从官方文档索引 docs.bfl.ai/llms.txt 里看到有一整组 flux_3 文档

- 「FLUX 3 is one multimodal model. Video with synchronized audio, one request shape keyed by mode.」
- 「One model trained across image, video, and audio.」
- 三种模式：`t2v`（纯提示词）、`i2v`（1–10 张图，可用 `[seconds, image]` 把关键帧钉到时间轴上）、Video Continuation（给一段 clip 接着往下生成）
- 「More images, more control: two pin the start and end frames, up to ten storyboard the clip」—— **首尾帧与多关键帧**
- 「Audio is on by default: multilingual speech with lipsync, effects, and ambience rendered scene-aware alongside the frames. No second model, no second pass.」—— **原生音频 + 对口型**
- 规格：5–20 秒、24fps、`hd` 或 `fhd`；宽高比 21:9 / 2:1 / 16:9 等
- 价格表（官方）：t2v / i2v $0.17/s hd、$0.29/s fhd；Video Continuation $0.43/s hd、$0.54/s fhd；draft 档 $0.06/s
- ⚠️ 官方自述「FLUX 3 is a **preview** model. **Video editing** and **Omni Reference with images and videos** will be available soon.」—— 视频编辑还没有

来源：https://docs.bfl.ml/flux_3/flux3_overview.md

****待人工定。** 按规则四，clip 轨已经 9/10（见 candidates.md 末尾那句「只剩 1 个空位」），进它就要先安排一个出去。证据够厚（t2v/i2v/首尾帧/原生音频/对口型/视频续写全有官方原文），但**收不收是范围决定，不是采集决定**。**

> ⚠️ 我在 2026-08-12 的提交里把这条写成了「BFL 已经出到 FLUX 3，我们库里最新还是 FLUX 2-dev」，**那句话是错的**：FLUX 3 不是 FLUX 2 的新版本，它是另一个模态。图像卷的 flux 停在 FLUX 2-dev 是对的，不该跟着改版本号。

### `sound` 阿里 · FunAudioLLM · Fun-CineForge（2026-08-13 发现）

**为什么两路都捞不到**：**是条新产品线，不是 CosyVoice 的新版本** —— 官方模型卡：「A Unified Dataset Pipeline and Model for **Zero-Shot Movie Dubbing** in Diverse Cinematic Scenes」，自述包含一条端到端的配音数据集流水线 + 一个基于 MLLM 的配音模型。**声音卷已经有「配音」这个应用**，缺的正是能对上的模型。

**怎么撞见的**：加魔搭那条源之后第一轮扫描捞到（FunAudioLLM 组织，↓6,567，Apache-2.0）

- 模型卡标题：「🎬 Fun-CineForge: A Unified Dataset Pipeline and Model for Zero-Shot Movie Dubbing in Diverse Cinematic Scenes」
- 任务标签 Text-to-Speech；许可 Apache License 2.0；13.61GB；更新于 2026-03-24
- ⚠️ 魔搭页面上没看到 HF 对应仓库 —— FunAudioLLM 在 HF 有组织，但这一支没在那边出现

来源：https://modelscope.cn/models/FunAudioLLM/Fun-CineForge

****待人工定**：按规则四要看声音卷还收不收新产品线；它填的是「配音」这个应用的空。**收不收是范围决定，不是采集决定。****
