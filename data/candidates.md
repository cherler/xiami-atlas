# 收录候选 · 2026-09-19



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

> ⚠️ 另有 **9 个组织被判成量化 / 搬运号**（仓库八成以上是 GGUF、AWQ、mlx 这类二次分发档），已从下表略过：`ChrisColeTech`、`QuantStack`、`city96`、`drbaph`、`joeygambino`、`molbal` 等。**判据是仓库名，不是人品** —— 它们里面若有自训模型，会因为名字不带量化后缀而照常出现在上表。

（无）

> ⚠️ HF 这一路混着个人搬运号与量化号（QuantStack、city96、calcuis 之类）。
> **脚本分不出「自己训模型」和「搬别人的」** —— 那要人看一眼组织主页。
> 不要照单全收，也不要因为混了噪音就整路丢掉：Lightricks、nvidia、zai-org
> 都是这一路捞出来的，而它们在闭源榜上完全隐形。

### 当前 Core（clip 轨 10/10，realtime 轨 2/10；括号里是含扩展层的总数 23 / 2）

- `still` Grok Imagine Image Image 2.0（2026-08-27）
- `clip` Grok Imagine Video Video 1.5（2026-08-27）
- `clip` Luma Ray Ray3.2（2026-08-27）
- `chat` Muse Spark Muse Spark 1.2（2026-08-27）
- `asset` Lux3D Lux3D（2026-08-27）
- `er` LocateAnything LocateAnything-3B（2026-08-27）
- `clip` Seedance 2.5（2026-07-31）
- `clip` MiniMax Hailuo H3（2026-07-31）
- `clip` Gemini Omni Flash（2026-05-19）
- `clip` Wan 3.0（2026-08-07）
- `clip` Runway Gen Gen-4.5（2025-12-11）
- `clip` Kling 3.0（2026-02-04）
- `clip` Vidu Q Q3（2026-04-13）
- `clip` Veo 3.1（2025-10） — **superseded**
- `clip` Sora 2（2025-09） — **discontinued**
- `realtime` Vidu S S2（2026-09-19）
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
- `still` GPT Image 2.5（sunburst / flare）（2026-09-10）
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
- `chat` Claude Fable 5.1（2026-09-10）
- `chat` GPT GPT-6 Astra（2026-09-10）
- `chat` Gemini Gemini 3.8 Flash（2026-09-10）
- `chat` Qwen 3.8-max（2026-08-11）
- `chat` DeepSeek V4.1（2026-09-19）
- `chat` Kimi K3（2026-06-13）
- `chat` GLM GLM-5.3（2026-08-29）
- `chat` MiniMax M3（2026-06-02）
- `chat` Doubao Seed-2.1 Pro（2026-06-23）
- `chat` Llama 4（2025-04-05）
- `chat` Grok 4.6（2026-08-29）
- `chat` Mistral Medium 3.5（2026-03-31）
- `tts` MiniMax Speech speech-2.8-hd（2026-08-12）
- `tts` ElevenLabs Eleven v3（2026-08-12）
- `tts` Gemini TTS 3.1 Flash TTS Preview（2026-08-12）
- `tts` GPT TTS GPT-4o mini TTS（2026-08-12）
- `voice-rt` GLM Voice glm-4-voice（2026-08-12）
- `tts` Qwen Omni 3.5-omni-plus（2026-08-12）
- `music` MiniMax Music music-3.0（2026-08-12）
- `music` Eleven Music v2（2026-08-12）
- `music` Lyria 3.5（2026-09-10）
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
- `avatar` HeyGen Avatar V（2026-08-14）
- `avatar` LongCat Video Avatar 1.5（2026-08-14）
- `avatar` HunyuanVideo-Avatar 1.0（2026-08-14）
- `avatar` LivePortrait 1.0（2026-08-14）
- `avatar` MuseTalk 1.0（2026-08-14）
- `avatar` Hallo2 Hallo-Live（2026-08-14）
- `er` Gemini Robotics ER ER 2 Preview（2026-08-14）
- `vla` MolmoAct MolmoAct2（2026-08-14）
- `vla` π（Physical Intelligence） π₀.₅（2026-08-14）
- `vla` NVIDIA Isaac GR00T N N1.7（2026-08-14）
- `vla` OpenVLA 7B（2026-08-14） — **maintained**
- `vla` SmolVLA base（2026-08-14）
- `vla` Helix Helix（2026-08-14）
- `vla` X-VLA 0.9B（2026-08-14）
- `er` RynnBrain 1.1（2026-08-14）
- `vla` InternVLA A1.5（2026-08-14）
- `vla` 混元具身 0.5（2026-08-14）
- `vla` Xiaomi Robotics 1（2026-08-14）
- `vla` Galaxea G0 G0-VLA（2026-08-14）
- `vla` lingbot-vla v2-6b（2026-08-14）
- `world` NVIDIA Cosmos Cosmos3（2026-08-14）
- `world` Google Genie Genie 3（2026-08-14）
- `world` World Labs Marble Marble（2026-08-14）
- `world` Odyssey Odyssey-2（2026-08-14）
- `world` Matrix-Game 3.0（2026-08-14）
- `world` 混元世界 HY-World 2.0（2026-08-14）
- `world` Microsoft WHAM WHAM（2026-08-14）
- `world` Meta V-JEPA V-JEPA 2（2026-08-14）
- `world` Decart Oasis Oasis 3（2026-08-14）
- `world` Etched Oasis-500M 500M（2026-08-14）
- `asr` ElevenLabs Scribe v2（2026-08-15）
- `asr` Whisper large-v3（2026-08-15） — **maintained**
- `asr` SenseVoice Small（2026-08-15）
- `asr` Qwen3-ASR 1.7B（2026-08-15）
- `bio` AlphaFold 3（2026-08-15）
- `bio` Boltz 2（2026-08-15）
- `bio` ESM-2 650M（2026-08-15） — **maintained**
- `weather` WeatherNext 2（2026-08-15）
- `weather` Aurora 1（2026-08-15）
- `weather` NeuralGCM 1（2026-08-15）
- `material` MatterGen 1（2026-08-15）
- `material` MACE MP（2026-08-15）
- `material` GNoME 1（2026-08-15） — **maintained**
- `tts` Fun-CineForge Fun-CineForge（2026-09-19）

> clip 轨只剩 1 个空位。按规则四，再进新的就必须先踢一个 ——
> 最该出去的是 **Sora 2**（已公告停服）。但**停服的模型不该从库里删**：
> 「它没了」本身是有用的信息，应降到 Extended 层，而不是消失。

## 【AI 图像】

### 一、Artificial Analysis 榜上、我们没收的（闭源侧的「有人真在用」）

（无）

### 二、Hugging Face 下载量前列、我们没收的组织（开源侧的实际采用度）

> ⚠️ 另有 **4 个组织被判成量化 / 搬运号**（仓库八成以上是 GGUF、AWQ、mlx 这类二次分发档），已从下表略过：`city96`、`xinsir`、`ChrisColeTech`、`QuantStack`。**判据是仓库名，不是人品** —— 它们里面若有自训模型，会因为名字不带量化后缀而照常出现在上表。

（无）

> ⚠️ HF 这一路混着个人搬运号与量化号（QuantStack、city96、calcuis 之类）。
> **脚本分不出「自己训模型」和「搬别人的」** —— 那要人看一眼组织主页。
> 不要照单全收，也不要因为混了噪音就整路丢掉：Lightricks、nvidia、zai-org
> 都是这一路捞出来的，而它们在闭源榜上完全隐形。

### 当前 Core（clip 轨 10/10，realtime 轨 2/10；括号里是含扩展层的总数 23 / 2）

- `still` Grok Imagine Image Image 2.0（2026-08-27）
- `clip` Grok Imagine Video Video 1.5（2026-08-27）
- `clip` Luma Ray Ray3.2（2026-08-27）
- `chat` Muse Spark Muse Spark 1.2（2026-08-27）
- `asset` Lux3D Lux3D（2026-08-27）
- `er` LocateAnything LocateAnything-3B（2026-08-27）
- `clip` Seedance 2.5（2026-07-31）
- `clip` MiniMax Hailuo H3（2026-07-31）
- `clip` Gemini Omni Flash（2026-05-19）
- `clip` Wan 3.0（2026-08-07）
- `clip` Runway Gen Gen-4.5（2025-12-11）
- `clip` Kling 3.0（2026-02-04）
- `clip` Vidu Q Q3（2026-04-13）
- `clip` Veo 3.1（2025-10） — **superseded**
- `clip` Sora 2（2025-09） — **discontinued**
- `realtime` Vidu S S2（2026-09-19）
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
- `still` GPT Image 2.5（sunburst / flare）（2026-09-10）
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
- `chat` Claude Fable 5.1（2026-09-10）
- `chat` GPT GPT-6 Astra（2026-09-10）
- `chat` Gemini Gemini 3.8 Flash（2026-09-10）
- `chat` Qwen 3.8-max（2026-08-11）
- `chat` DeepSeek V4.1（2026-09-19）
- `chat` Kimi K3（2026-06-13）
- `chat` GLM GLM-5.3（2026-08-29）
- `chat` MiniMax M3（2026-06-02）
- `chat` Doubao Seed-2.1 Pro（2026-06-23）
- `chat` Llama 4（2025-04-05）
- `chat` Grok 4.6（2026-08-29）
- `chat` Mistral Medium 3.5（2026-03-31）
- `tts` MiniMax Speech speech-2.8-hd（2026-08-12）
- `tts` ElevenLabs Eleven v3（2026-08-12）
- `tts` Gemini TTS 3.1 Flash TTS Preview（2026-08-12）
- `tts` GPT TTS GPT-4o mini TTS（2026-08-12）
- `voice-rt` GLM Voice glm-4-voice（2026-08-12）
- `tts` Qwen Omni 3.5-omni-plus（2026-08-12）
- `music` MiniMax Music music-3.0（2026-08-12）
- `music` Eleven Music v2（2026-08-12）
- `music` Lyria 3.5（2026-09-10）
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
- `avatar` HeyGen Avatar V（2026-08-14）
- `avatar` LongCat Video Avatar 1.5（2026-08-14）
- `avatar` HunyuanVideo-Avatar 1.0（2026-08-14）
- `avatar` LivePortrait 1.0（2026-08-14）
- `avatar` MuseTalk 1.0（2026-08-14）
- `avatar` Hallo2 Hallo-Live（2026-08-14）
- `er` Gemini Robotics ER ER 2 Preview（2026-08-14）
- `vla` MolmoAct MolmoAct2（2026-08-14）
- `vla` π（Physical Intelligence） π₀.₅（2026-08-14）
- `vla` NVIDIA Isaac GR00T N N1.7（2026-08-14）
- `vla` OpenVLA 7B（2026-08-14） — **maintained**
- `vla` SmolVLA base（2026-08-14）
- `vla` Helix Helix（2026-08-14）
- `vla` X-VLA 0.9B（2026-08-14）
- `er` RynnBrain 1.1（2026-08-14）
- `vla` InternVLA A1.5（2026-08-14）
- `vla` 混元具身 0.5（2026-08-14）
- `vla` Xiaomi Robotics 1（2026-08-14）
- `vla` Galaxea G0 G0-VLA（2026-08-14）
- `vla` lingbot-vla v2-6b（2026-08-14）
- `world` NVIDIA Cosmos Cosmos3（2026-08-14）
- `world` Google Genie Genie 3（2026-08-14）
- `world` World Labs Marble Marble（2026-08-14）
- `world` Odyssey Odyssey-2（2026-08-14）
- `world` Matrix-Game 3.0（2026-08-14）
- `world` 混元世界 HY-World 2.0（2026-08-14）
- `world` Microsoft WHAM WHAM（2026-08-14）
- `world` Meta V-JEPA V-JEPA 2（2026-08-14）
- `world` Decart Oasis Oasis 3（2026-08-14）
- `world` Etched Oasis-500M 500M（2026-08-14）
- `asr` ElevenLabs Scribe v2（2026-08-15）
- `asr` Whisper large-v3（2026-08-15） — **maintained**
- `asr` SenseVoice Small（2026-08-15）
- `asr` Qwen3-ASR 1.7B（2026-08-15）
- `bio` AlphaFold 3（2026-08-15）
- `bio` Boltz 2（2026-08-15）
- `bio` ESM-2 650M（2026-08-15） — **maintained**
- `weather` WeatherNext 2（2026-08-15）
- `weather` Aurora 1（2026-08-15）
- `weather` NeuralGCM 1（2026-08-15）
- `material` MatterGen 1（2026-08-15）
- `material` MACE MP（2026-08-15）
- `material` GNoME 1（2026-08-15） — **maintained**
- `tts` Fun-CineForge Fun-CineForge（2026-09-19）

> clip 轨只剩 1 个空位。按规则四，再进新的就必须先踢一个 ——
> 最该出去的是 **Sora 2**（已公告停服）。但**停服的模型不该从库里删**：
> 「它没了」本身是有用的信息，应降到 Extended 层，而不是消失。


## 已处置的人工候选（2）—— 不用再看

- `video` Black Forest Labs · FLUX 3 —— 2026-08-13 收进**扩展层** `flux-video`（clip 轨 10/10，不为收新的踢老的）。轨满就进折叠列表，是负责人定的做法。
- `sound` 阿里 · FunAudioLLM · Fun-CineForge —— 2026-09-19 收进**扩展层** `funcineforge`（声音卷 tts 轨 9/10，有位置，但进 Core 要先把 27 条声音能力轴逐格核一遍 —— 那是另一件事）。同日核实：**HF 上有同一份** `FunAudioLLM/Fun-CineForge`（apache-2.0），此前「魔搭页面上没看到 HF 对应仓库」那句不成立了。
