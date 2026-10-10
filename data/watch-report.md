# 信息源监视报告 · 2026-10-10

本次检查 83 个到期源（共 429 个）：变化 46 · 首次 0 · 无变化 30 · **抓不到 7**

> 这份报告是给人看的那 20 条待办的来源（§59.3 的负反馈：人每周要看的条目 ≤ 20）。
> 「抓不到」不是失败，是**信息本身** —— 一个长期抓不到的官方源，说明那家厂商没有可 diff 的公开更新入口，
> 而那正好解释了为什么它名下的格子质量最差。

## 抓到了但没内容（比抓不到更危险 —— 它不会喊）

（无）

## 抓不到（要处理）

- **decart-site**（S/spa）Decart 官网首屏（当前版本） — 还是壳：渲染后正文只有 0 个字符
  https://decart.ai/
- **aa-t2i**（A/spa）Artificial Analysis · 文生图竞技场 — 还是壳：渲染后正文只有 281 个字符
  https://artificialanalysis.ai/text-to-image/arena
- **bfl-flux2-multiref**（A/html）Black Forest Labs 官方文档 · FLUX.2 多图参考编辑指南 — fetch failed / ECONNRESET
  https://docs.bfl.ml/guides/prompting_editing_multi_reference.md
- **rodin-api-docs**（S/html）Rodin / Hyper3D · API 文档索引 — fetch failed / ECONNRESET
  https://developer.hyper3d.ai/llms.txt
- **tripo-site**（S/spa）Tripo 官网 — 被人机验证挡住（页面标题「Just a moment...」）—— 这条源只能人工核，别再换抓法
  https://www.tripo3d.ai/
- **pi-pi05-blog**（A/html）Physical Intelligence 官方博客 · π₀.₅ — HTTP 429
  https://www.physicalintelligence.company/blog/pi05
- **omni-doc**（A/html）Google · Gemini Omni Flash 官方文档 — fetch failed / ECONNRESET
  https://ai.google.dev/gemini-api/docs/omni

## 有变化

- **bfl-flux3** Black Forest Labs 官方文档 · FLUX 3 概览
- **hf-hunyuan3d-21** 腾讯混元3D 2.1 · HF 模型卡
- **meshy-docs-api** Meshy · API 文档
- **meshy-site** Meshy 官网
- **gh-trellis** microsoft/TRELLIS 仓库
- **rodin-site** Rodin / Hyper3D 官网
- **tripo-docs-animation** Tripo · Animation 端点文档
- **gh-hunyuan3d-buffalo** Tencent-Hunyuan/Hunyuan3D-Buffalo1.0 仓库
- **replicate-hunyuan3d-31** Replicate · 腾讯官方账号 tencent/hunyuan-3d-3.1
- **hf-wan-vace** Hugging Face · Wan2.1-VACE-14B 模型卡
- **hf-ltx-25** Hugging Face · LTX-2.5 模型卡
- **meshy-changelog** Meshy · API 更新日志
- **heygen-docs** HeyGen · 开发者文档索引
- **synthesia-docs** Synthesia · API 文档
- **hf-longcat-avatar** HF · 美团 LongCat-Video-Avatar-1.5
- **hf-hunyuan-avatar** HF · 腾讯 HunyuanVideo-Avatar
- **hf-liveportrait** HF · 快手 LivePortrait
- **hf-musetalk** HF · 腾讯音乐 MuseTalk
- **hf-hallo2** HF · 复旦 Hallo2
- **heygen-changelog** HeyGen · API 更新日志
- **hf-hallo-live** HF · 复旦 Hallo-Live
- **hf-longcat-avatar-10** HF · 美团 LongCat-Video-Avatar（1.0）
- **elevenlabs-changelog** ElevenLabs · 更新日志索引
- **hf-glm-voice** HF · 智谱 glm-4-voice-9b
- **hf-glm-tts** HF · 智谱 GLM-TTS
- **openai-model-tts** OpenAI · GPT-4o mini TTS 模型页
- **openai-model-realtime** OpenAI · GPT-Realtime 模型页
- **gemini-robotics-er** Google 官方文档 · Gemini Robotics ER（能力表 / 端点 / 定价）
- **hf-robotics** Hugging Face · robotics 榜（按下载）
  新增 11 条：autotrust/JEV-9B、black-forest-labs/flux-3-action-droid、black-forest-labs/flux-3-action-so101、lerobot/xvla-widowx、mradermacher/JEV-9B-GGUF、mradermacher/Pelican1.0-VL-235B-A22B-FC-i1-GGUF、mradermacher/RoboInter-VLM-i1-GGUF、mradermacher/RynnBrain-8B-i1-GGUF、mradermacher/RynnBrain-CoP-8B-i1-GGUF、npow/servo-groot-yam-v3、zuoxingdong/evo1_libero
- **lerobot-gh** Hugging Face 官方 · LeRobot 仓库
- **odyssey-site** Odyssey 官网（产品线自述）
- **worldlabs-marble** World Labs 官方博客 · Marble
- **sora-api** OpenAI API · sora-2 模型页（⚠️ 同上，403）
- **mm-hf-api** HF API · MiniMaxAI/MiniMax-H3 元数据（许可与文件清单）
- **ltx-hf-23** Hugging Face · Lightricks/LTX-2.3（当前主力）
- **recraft-docs** Recraft · 官方文档
- **bfl-docs** Black Forest Labs · 官方文档索引
- **zimage-card** Z-Image 官方模型卡（Hugging Face）
- **hunyuan-image-card** HunyuanImage-3.0 官方模型卡（Hugging Face）
- **smolvla-card** Hugging Face 官方 · SmolVLA 模型卡
- **molmoact-card** Ai2 官方 · MolmoAct2 模型卡
- **hf-sensevoice** 阿里 FunAudioLLM 官方 · SenseVoiceSmall 模型卡
- **hf-qwen3-asr** 阿里官方 · Qwen3-ASR 模型卡
- **minimax-release-notes** MiniMax 开放平台 · 模型发布日志
- **ideogram-x** Ideogram 官方账号发布公告（@ideogram_ai）
- **hf-org** Hugging Face 官方组织目录（模型接口）
  新增 257 条：0xSojalSec/Qwen-Image-2.1-Uncensored-GGUF、AKinvox/kokoro-cloning-v1、APRIL-AIGC/T3-Video、Aalto-Speech-Synthesis/smelp、Abiray/Qwen-Image-2.1-Turbo-GGUF、Adahm/PE-Heretic-INT8-ConvRot-for-Qwen-Image-2.1、Andycurrent/Gemma-3-4B-VL-it-Gemini-Pro-Heretic-Uncensored-Thinking_GGUF、ApolloRaines/LTX-2.5-22b-OmniGen-v12、Asirus/minimax_h3_ref2va_pruned_int8_convrot_taomate_8_step、AtomicChat/Qwen-Image-2.1-Turbo-GGUF、AtomicChat/d1-3B-GGUF、BAAI/bge-large-en-v1.5 …

## 全部

| 源 | 权威 | 类型 | 状态 |
|---|---|---|---|
| seed-blog | S | html | 未到期（上次 2026-10-07） |
| seed-models | S | html | 未到期（上次 2026-10-07） |
| kling-api-updates | S | spa | 未到期（上次 2026-10-07） |
| kling-site | S | spa | 未到期（上次 2026-09-29） |
| google-video-docs | S | html | 未到期（上次 2026-10-07） |
| deepmind-veo | S | html | 未到期（上次 2026-10-07） |
| vertex-video-ref | S | html | 未到期（上次 2026-10-07） |
| openai-sora-eol | S | spa | 未到期（上次 2026-08-12） |
| openai-sora-2 | S | spa | 从未抓过 |
| wan-gh-releases | S | json | 未到期（上次 2026-10-07） |
| wan-hf | S | json | 未到期（上次 2026-10-07） |
| minimax-blog | S | html | 未到期（上次 2026-10-07） |
| minimax-hf | S | json | 未到期（上次 2026-10-07） |
| runway-research | S | html | 未到期（上次 2026-10-07） |
| luma-site | S | html | 未到期（上次 2026-10-07） |
| vidu-changelog | S | spa | 未到期（上次 2026-10-07） |
| vidu-model-map | S | spa | 未到期（上次 2026-10-07） |
| vidu-function-list | S | spa | 未到期（上次 2026-10-07） |
| vidu-site | S | html | 未到期（上次 2026-10-07） |
| vidu-s1-gh | S | json | 未到期（上次 2026-10-07） |
| pika-site | S | html | 未到期（上次 2026-10-08） |
| higgsfield-site | S | html | 未到期（上次 2026-10-07） |
| decart-research | S | html | 未到期（上次 2026-10-07） |
| arxiv-video | S | atom | 未到期（上次 2026-10-07） |
| epoch-notable | A | csv | 未到期（上次 2026-10-07） |
| aa-t2v | A | spa | 未到期（上次 2026-10-07） |
| aa-i2v | A | spa | 未到期（上次 2026-10-07） |
| hf-t2v | A | json | 未到期（上次 2026-10-08） |
| hf-i2v | A | json | 未到期（上次 2026-10-08） |
| hf-v2v | A | json | 未到期（上次 2026-10-07） |
| fal-video | S | spa | 未到期（上次 2026-10-08） |
| replicate-t2v | S | html | 未到期（上次 2026-10-07） |
| aiwiki | B | spa | 未到期（上次 2026-09-11） |
| futurepedia | B | html | 未到期（上次 2026-09-11） |
| comfyui-releases | C | json | 未到期（上次 2026-10-07） |
| capcut-templates | C | html | 未到期（上次 2026-09-11） |
| picsart-effects | C | html | 未到期（上次 2026-09-11） |
| runway-changelog | S | spa | 未到期（上次 2026-10-07） |
| runway-models | S | spa | 未到期（上次 2026-10-07） |
| luma-changelog | S | spa | 未到期（上次 2026-08-07） |
| seed-models-hub | S | html | 未到期（上次 2026-10-07） |
| apiyi-models | S | spa | 未到期（上次 2026-10-07） |
| arxiv-worldmodel | S | atom | 未到期（上次 2026-10-07） |
| techcrunch-ai | B | atom | 未到期（上次 2026-10-08） |
| ltx-gh | S | json | 未到期（上次 2026-10-07） |
| ltx-hf-org | S | json | 未到期（上次 2026-10-08） |
| decart-site | S | spa | 抓不到（还是壳：渲染后正文只有 0 个字符） |
| picsart-video | C | html | 未到期（上次 2026-09-11） |
| libtv | C | spa | 从未抓过 |
| dreamina | S | html | 未到期（上次 2026-10-07） |
| hailuo-video | S | html | 未到期（上次 2026-10-07） |
| volcengine-ark-price | S | spa | 未到期（上次 2026-09-11） |
| minimax-price | S | spa | 未到期（上次 2026-09-11） |
| google-ai-price | S | html | 未到期（上次 2026-09-11） |
| bailian-price | S | spa | 未到期（上次 2026-09-11） |
| runway-price | S | spa | 未到期（上次 2026-09-11） |
| kling-price | S | spa | 未到期（上次 2026-09-11） |
| vidu-price | S | spa | 未到期（上次 2026-09-11） |
| fal-ltx-price | S | spa | 未到期（上次 2026-09-11） |
| replicate-price | A | html | 未到期（上次 2026-09-11） |
| hf-course | S | html | 未到期（上次 2026-08-12） |
| comfy-docs | S | spa | 未到期（上次 2026-10-07） |
| h3-card | S | html | 未到期（上次 2026-10-07） |
| hf-lineage | S | json | 未到期（上次 2026-10-07） |
| vacetools-gh | C | json | 未到期（上次 2026-10-07） |
| framepack-gh | S | json | 未到期（上次 2026-10-07） |
| fpwrapper-gh | C | json | 未到期（上次 2026-10-07） |
| latentsync-gh | S | json | 未到期（上次 2026-10-07） |
| lswrapper-gh | C | json | 未到期（上次 2026-10-07） |
| float-gh | C | json | 未到期（上次 2026-10-07） |
| sviflf-gh | C | json | 未到期（上次 2026-10-07） |
| flflatent-gh | C | json | 未到期（上次 2026-10-07） |
| mm-blog | S | html | 未到期（上次 2026-09-11） |
| wanwrapper-gh | C | json | 未到期（上次 2026-10-07） |
| comfy-org-hf | S | json | 未到期（上次 2026-10-07） |
| ltx-comfy-gh | S | json | 未到期（上次 2026-10-07） |
| mpt-gh | C | json | 未到期（上次 2026-10-07） |
| manim-gh | C | json | 未到期（上次 2026-10-07） |
| pyvideotrans-gh | C | json | 未到期（上次 2026-10-07） |
| duix-gh | C | json | 未到期（上次 2026-10-07） |
| fay-gh | C | json | 未到期（上次 2026-10-07） |
| narrato-gh | C | json | 未到期（上次 2026-10-07） |
| zho-wf-gh | C | json | 未到期（上次 2026-10-07） |
| echomimic-gh | C | json | 未到期（上次 2026-10-07） |
| linly-talker-gh | C | json | 未到期（上次 2026-10-07） |
| animate-anything-gh | C | json | 未到期（上次 2026-10-07） |
| huobao-gh | C | json | 未到期（上次 2026-10-07） |
| awesome-vd-gh | C | json | 未到期（上次 2026-10-07） |
| seedream-page | S | html | 未到期（上次 2026-10-07） |
| openai-models | S | html | 未到期（上次 2026-10-08） |
| gemini-models | S | html | 未到期（上次 2026-10-08） |
| google-gemini-blog | S | html | 未到期（上次 2026-10-07） |
| azure-foundry-blog | B | html | 未到期（上次 2026-09-11） |
| recraft-blog | S | html | 未到期（上次 2026-09-11） |
| kolors-gh | S | html | 未到期（上次 2026-09-11） |
| krea-blog | S | html | 未到期（上次 2026-10-07） |
| wiki-midjourney | B | html | 未到期（上次 2026-08-12） |
| comfyui-gh | S | json | 未到期（上次 2026-09-11） |
| sdwebui-gh | S | json | 未到期（上次 2026-09-11） |
| fooocus-gh | S | json | 未到期（上次 2026-09-11） |
| invokeai-gh | S | json | 未到期（上次 2026-09-11） |
| iopaint-gh | S | json | 未到期（上次 2026-09-11） |
| rembg-gh | S | json | 未到期（上次 2026-09-11） |
| realesrgan-gh | S | json | 未到期（上次 2026-09-11） |
| gfpgan-gh | S | json | 未到期（上次 2026-09-11） |
| codeformer-gh | S | json | 未到期（上次 2026-09-11） |
| oldphoto-gh | S | json | 未到期（上次 2026-09-11） |
| controlnet-gh | S | json | 未到期（上次 2026-09-11） |
| ipadapter-gh | S | json | 未到期（上次 2026-09-11） |
| instantid-gh | S | json | 未到期（上次 2026-09-11） |
| photomaker-gh | S | json | 未到期（上次 2026-09-11） |
| iclight-gh | S | json | 未到期（上次 2026-09-11） |
| idmvton-gh | S | json | 未到期（上次 2026-09-11） |
| ootd-gh | S | json | 未到期（上次 2026-09-11） |
| catvton-gh | S | json | 未到期（上次 2026-09-11） |
| kritaai-gh | S | json | 未到期（上次 2026-09-11） |
| omnigen-gh | S | json | 未到期（上次 2026-09-11） |
| step1x-gh | S | json | 未到期（上次 2026-09-11） |
| qwenimage-gh | S | json | 未到期（上次 2026-09-11） |
| anytext-gh | S | json | 未到期（上次 2026-09-11） |
| incontextlora-gh | S | json | 未到期（上次 2026-09-11） |
| comictrans-gh | S | json | 未到期（上次 2026-09-11） |
| manganinjia-gh | S | json | 未到期（上次 2026-09-11） |
| starvector-gh | S | json | 未到期（上次 2026-09-11） |
| svgdreamer-gh | S | json | 未到期（上次 2026-09-11） |
| easyphoto-gh | S | json | 未到期（上次 2026-09-11） |
| ipadapter-plus-gh | S | json | 未到期（上次 2026-09-11） |
| controlnet-aux-gh | S | json | 未到期（上次 2026-09-11） |
| ultimate-upscale-gh | S | json | 未到期（上次 2026-09-11） |
| comfy-manager-gh | S | json | 未到期（上次 2026-09-11） |
| comfy-examples-gh | S | json | 未到期（上次 2026-09-11） |
| comfy-templates-gh | S | json | 未到期（上次 2026-09-11） |
| hf-diffusion-class-gh | S | json | 未到期（上次 2026-09-11） |
| fastai-course | S | html | 未到期（上次 2026-08-12） |
| dreamtextures-gh | S | json | 未到期（上次 2026-09-11） |
| char2d-gh | S | json | 未到期（上次 2026-09-11） |
| hf-pixelart-lora | S | json | 未到期（上次 2026-08-12） |
| google-nb-blog | S | html | 未到期（上次 2026-10-07） |
| ms-foundry-blog | B | html | 未到期（上次 2026-09-11） |
| mj-updates | S | html | 未到期（上次 2026-10-07） |
| aa-t2i | A | spa | 抓不到（还是壳：渲染后正文只有 281 个字符） |
| hf-t2i | A | json | 未到期（上次 2026-10-08） |
| hf-i2i | A | json | 未到期（上次 2026-10-08） |
| anthropic-models | S | html | 未到期（上次 2026-10-08） |
| deepseek-docs | S | html | 未到期（上次 2026-10-08） |
| xai-docs | S | html | 未到期（上次 2026-10-08） |
| doubao-force-2026 | B | html | 未到期（上次 2026-08-12） |
| wan3-qbitai | B | spa | 从未抓过 |
| kimi-api | S | html | 未到期（上次 2026-10-07） |
| glm-api | S | html | 未到期（上次 2026-10-07） |
| minimax-platform | S | html | 未到期（上次 2026-10-07） |
| langchain-gh | S | json | 未到期（上次 2026-09-11） |
| langgraph-gh | S | json | 未到期（上次 2026-09-11） |
| llamaindex-gh | S | json | 未到期（上次 2026-09-11） |
| vllm-gh | S | json | 未到期（上次 2026-09-11） |
| llamacpp-gh | S | json | 未到期（上次 2026-09-11） |
| ollama-gh | S | json | 未到期（上次 2026-09-11） |
| ragflow-gh | S | json | 未到期（上次 2026-09-11） |
| dify-gh | S | json | 未到期（上次 2026-09-11） |
| n8n-gh | S | json | 未到期（上次 2026-09-11） |
| openwebui-gh | S | json | 未到期（上次 2026-09-11） |
| autogen-gh | S | json | 未到期（上次 2026-09-11） |
| crewai-gh | S | json | 未到期（上次 2026-09-11） |
| litellm-gh | S | json | 未到期（上次 2026-09-11） |
| transformers-gh | S | json | 未到期（上次 2026-09-11） |
| unsloth-gh | S | json | 未到期（上次 2026-09-11） |
| llamafactory-gh | S | json | 未到期（上次 2026-09-11） |
| aider-gh | S | json | 未到期（上次 2026-09-11） |
| cline-gh | S | json | 未到期（上次 2026-09-11） |
| continue-gh | S | json | 未到期（上次 2026-09-11） |
| openhands-gh | S | json | 未到期（上次 2026-09-11） |
| browseruse-gh | S | json | 未到期（上次 2026-09-11） |
| markitdown-gh | S | json | 未到期（上次 2026-09-11） |
| unstructured-gh | S | json | 未到期（上次 2026-09-11） |
| mineru-gh | S | json | 未到期（上次 2026-09-11） |
| mcpservers-gh | S | json | 未到期（上次 2026-09-11） |
| anthropic-features | S | html | 未到期（上次 2026-10-08） |
| openai-docs | S | html | 未到期（上次 2026-10-08） |
| deepseek-pricing | S | html | 无变化 |
| deepseek-updates | S | html | 无变化 |
| bailian-models | S | html | 未到期（上次 2026-10-07） |
| kimi-pricing | S | html | 未到期（上次 2026-10-07） |
| glm-52-doc | S | html | 未到期（上次 2026-10-07） |
| kimi-websearch | S | html | 未到期（上次 2026-10-07） |
| bailian-websearch | S | html | 未到期（上次 2026-10-07） |
| glm-websearch | S | html | 未到期（上次 2026-10-07） |
| bailian-coder | S | html | 未到期（上次 2026-10-07） |
| ark-models | S | spa | 未到期（上次 2026-10-07） |
| minimax-api-overview | S | spa | 未到期（上次 2026-10-07） |
| openai-caching | S | html | 未到期（上次 2026-10-08） |
| openai-structured | S | html | 未到期（上次 2026-10-08） |
| deepseek-chat-api | S | html | 未到期（上次 2026-10-08） |
| gemini-audio | S | spa | 未到期（上次 2026-10-08） |
| gemini-vision | S | spa | 未到期（上次 2026-10-08） |
| minimax-anthropic-api | S | spa | 未到期（上次 2026-10-07） |
| minimax-openai-api | S | spa | 未到期（上次 2026-10-07） |
| minimax-server-tools | S | spa | 未到期（上次 2026-10-07） |
| minimax-caching | S | spa | 未到期（上次 2026-10-07） |
| minimax-openapi | S | json | 未到期（上次 2026-10-07） |
| gemini-computer-use | S | spa | 未到期（上次 2026-10-08） |
| ark-pricing | S | spa | 未到期（上次 2026-10-07） |
| bailian-models-zh | S | spa | 未到期（上次 2026-10-07） |
| glm-batch | S | html | 未到期（上次 2026-10-07） |
| glm-chat-api | S | html | 未到期（上次 2026-10-07） |
| claude-deprecations | S | html | 未到期（上次 2026-10-08） |
| openai-changelog | S | spa | 未到期（上次 2026-10-08） |
| gemini-changelog | S | spa | 未到期（上次 2026-10-08） |
| xai-release-notes | S | html | 未到期（上次 2026-10-08） |
| aa-llm | B | spa | 未到期（上次 2026-10-07） |
| ideogram-api | S | html | 未到期（上次 2026-10-07） |
| elevenlabs-models | S | html | 未到期（上次 2026-10-07） |
| openai-realtime | S | html | 未到期（上次 2026-10-07） |
| gemini-tts | S | html | 未到期（上次 2026-10-07） |
| elevenlabs-tts | S | html | 未到期（上次 2026-10-07） |
| bailian-omni | S | html | 未到期（上次 2026-10-08） |
| elevenlabs-remix | S | html | 未到期（上次 2026-10-07） |
| openai-tts | S | html | 未到期（上次 2026-10-07） |
| gemini-music | S | html | 未到期（上次 2026-10-08） |
| glm-tts-doc | S | html | 未到期（上次 2026-10-07） |
| glm-tts-clone-doc | S | html | 未到期（上次 2026-10-07） |
| glm-voice-doc | S | html | 未到期（上次 2026-10-07） |
| xai-voice | S | html | 未到期（上次 2026-10-07） |
| kokoro-card | S | html | 未到期（上次 2026-10-07） |
| mistral-models | S | html | 未到期（上次 2026-10-07） |
| mistral-tools | S | html | 未到期（上次 2026-10-07） |
| mistral-vision | S | html | 未到期（上次 2026-10-07） |
| fish-s2pro-card | S | html | 未到期（上次 2026-10-07） |
| cosyvoice-card | S | html | 未到期（上次 2026-10-07） |
| llama-card | S | html | 未到期（上次 2026-10-07） |
| elevenlabs-voices | S | html | 未到期（上次 2026-10-07） |
| wan-t2v-card | S | html | 未到期（上次 2026-10-07） |
| minimax-release | S | spa | 未到期（上次 2026-10-07） |
| s-e2ab-gh | C | json | 未到期（上次 2026-10-07） |
| s-abogen-gh | C | json | 未到期（上次 2026-10-07） |
| s-epub2tts-gh | C | json | 未到期（上次 2026-10-07） |
| s-abcreator-gh | C | json | 未到期（上次 2026-10-07） |
| s-smartsub-gh | C | json | 未到期（上次 2026-10-07） |
| s-youdub-gh | C | json | 未到期（上次 2026-10-07） |
| s-pipecat-gh | C | json | 未到期（上次 2026-10-07） |
| s-livekit-gh | C | json | 未到期（上次 2026-10-07） |
| s-hfs2s-gh | C | json | 未到期（上次 2026-10-07） |
| s-moshi-gh | C | json | 未到期（上次 2026-10-07） |
| s-acestep15-gh | C | json | 未到期（上次 2026-10-07） |
| s-acestep-gh | C | json | 未到期（上次 2026-10-07） |
| s-yue-gh | C | json | 未到期（上次 2026-10-07） |
| s-audiocraft-gh | C | json | 未到期（上次 2026-10-07） |
| s-gptsovits-gh | C | json | 未到期（上次 2026-10-07） |
| s-rvc-gh | C | json | 未到期（上次 2026-10-07） |
| s-fishspeech-gh | C | json | 未到期（上次 2026-10-07） |
| s-indextts-gh | C | json | 未到期（上次 2026-10-07） |
| s-cosyvoice-gh | C | json | 未到期（上次 2026-10-07） |
| s-f5tts-gh | C | json | 未到期（上次 2026-10-07） |
| s-qwen3omni-gh | C | json | 未到期（上次 2026-10-07） |
| ideogram-overview | A | html | 未到期（上次 2026-10-07） |
| ideogram-v4-remix | A | html | 未到期（上次 2026-10-07） |
| ideogram-v3-inpaint | A | html | 未到期（上次 2026-10-07） |
| ideogram-v3-reframe | A | html | 未到期（上次 2026-10-07） |
| ideogram-v3-generate | A | html | 未到期（上次 2026-10-07） |
| ideogram-edit | A | html | 未到期（上次 2026-10-07） |
| ideogram-upscale | A | html | 未到期（上次 2026-10-07） |
| ideogram-hf | A | html | 未到期（上次 2026-10-07） |
| bailian-qimg3 | A | html | 未到期（上次 2026-10-07） |
| bailian-qimg | A | html | 未到期（上次 2026-10-07） |
| bailian-textgen-zh | A | html | 未到期（上次 2026-10-07） |
| bailian-thinking-zh | A | html | 未到期（上次 2026-10-07） |
| bailian-cache-zh | A | html | 未到期（上次 2026-10-07） |
| bailian-batch-zh | A | html | 未到期（上次 2026-10-07） |
| bailian-websearch-zh | A | html | 未到期（上次 2026-10-08） |
| hf-kokoro | A | json | 未到期（上次 2026-09-11） |
| hf-cosyvoice2 | A | json | 未到期（上次 2026-09-11） |
| hf-glmtts | A | json | 未到期（上次 2026-09-11） |
| hf-glm4voice | A | json | 未到期（上次 2026-09-11） |
| hf-fishspeech15 | A | html | 未到期（上次 2026-09-14） |
| hf-qwen3omni | A | json | 未到期（上次 2026-09-11） |
| hf-qwen-layered | A | html | 未到期（上次 2026-09-14） |
| hf-org-minimax | A | json | 未到期（上次 2026-09-11） |
| hf-org-xai | A | json | 未到期（上次 2026-09-11） |
| hf-org-elevenlabs | A | json | 未到期（上次 2026-09-11） |
| hf-org-openai | A | json | 未到期（上次 2026-09-11） |
| ideogram-layerize | A | html | 未到期（上次 2026-09-11） |
| recraft-endpoints | A | html | 未到期（上次 2026-09-24） |
| recraft-nl-edit | A | html | 未到期（上次 2026-09-24） |
| hunyuan-image-hf | A | json | 未到期（上次 2026-09-24） |
| bfl-flux2-overview | A | html | 未到期（上次 2026-09-24） |
| bfl-flux2-multiref | A | html | 抓不到（fetch failed / ECONNRESET） |
| ark-seedream-api | A | spa | 未到期（上次 2026-10-08） |
| arxiv-fp8 | A | html | 未到期（上次 2026-08-13） |
| arxiv-int8 | A | html | 未到期（上次 2026-08-13） |
| arxiv-qlora | A | html | 未到期（上次 2026-08-13） |
| arxiv-gptq | A | html | 未到期（上次 2026-08-13） |
| arxiv-awq | A | html | 未到期（上次 2026-08-13） |
| arxiv-lora | A | html | 未到期（上次 2026-08-13） |
| hf-gguf-doc | A | html | 未到期（上次 2026-08-13） |
| hf-diffusers-memory | A | html | 未到期（上次 2026-08-13） |
| zimage-gh | A | html | 未到期（上次 2026-09-26） |
| hunyuan-image-gh | A | html | 未到期（上次 2026-09-26） |
| skyreels-gh | A | html | 无变化 |
| bfl-flux3 | A | html | 变了 |
| anthropic-privacy | A | html | 未到期（上次 2026-08-14） |
| stability-terms | A | html | 未到期（上次 2026-08-14） |
| gh-llm-universe | C | json | 未到期（上次 2026-09-13） |
| gh-all-in-rag | C | json | 未到期（上次 2026-09-13） |
| gh-handy-multi-agent | C | json | 未到期（上次 2026-09-13） |
| gh-llm-action | C | json | 未到期（上次 2026-09-13） |
| gh-self-llm | C | json | 未到期（上次 2026-09-13） |
| gh-langchain-zh | C | json | 未到期（上次 2026-09-13） |
| gh-llamafactory | C | json | 未到期（上次 2026-09-13） |
| gh-chattts-cn | C | json | 未到期（上次 2026-09-13） |
| gh-comfyui | C | json | 未到期（上次 2026-09-13） |
| gh-sdbook | C | json | 未到期（上次 2026-09-13） |
| waytoagi-wiki | C | spa | 从未抓过 |
| hf-hunyuan3d-21 | S | html | 变了 |
| tripo-docs-generation | S | spa | 无变化 |
| meshy-docs-api | S | spa | 变了 |
| meshy-site | S | spa | 变了 |
| rodin-api-docs | S | html | 抓不到（fetch failed / ECONNRESET） |
| gh-trellis | S | html | 变了 |
| seed3d-page | S | spa | 从未抓过 |
| stability-spar3d | S | html | 无变化 |
| tripo-site | S | spa | 抓不到（被人机验证挡住（页面标题「Just a moment...」）—— 这条源只能人工核，别再换抓法） |
| rodin-site | S | spa | 变了 |
| tripo-docs-animation | S | spa | 变了 |
| gh-hunyuan3d-buffalo | S | html | 变了 |
| replicate-hunyuan3d-31 | A | spa | 变了 |
| replicate-3d | A | spa | 未到期（上次 2026-09-25） |
| hf-image-to-3d | A | spa | 未到期（上次 2026-09-25） |
| comfy-3d-hunyuan | S | html | 未到期（上次 2026-09-25） |
| gh-hunyuan3d-21 | S | html | 未到期（上次 2026-09-25） |
| gh-hunyuan3d-part | S | html | 未到期（上次 2026-09-25） |
| gh-spar3d | S | html | 未到期（上次 2026-09-25） |
| gh-triposg | S | html | 未到期（上次 2026-09-25） |
| gh-instantmesh | S | html | 未到期（上次 2026-09-25） |
| modelscope-orgs | S | json | 从未抓过 |
| hf-wan-vace | S | html | 变了 |
| hf-ltx-25 | S | html | 变了 |
| meshy-changelog | S | spa | 变了 |
| hf-instantmesh | S | html | 未到期（上次 2026-09-25） |
| hf-apple-sharp | S | html | 未到期（上次 2026-09-25） |
| gh-hunyuan3d-api | S | html | 未到期（上次 2026-09-25） |
| hf-anysplat | S | html | 未到期（上次 2026-09-25） |
| arxiv-seed3d-20 | S | html | 未到期（上次 2026-09-13） |
| arxiv-seed3d-10 | S | html | 未到期（上次 2026-09-13） |
| hf-trellis2 | S | html | 未到期（上次 2026-09-25） |
| pixverse-caps | S | html | 无变化 |
| pixverse-v6 | S | html | 无变化 |
| pixverse-fusion | S | html | 无变化 |
| hf-cogvideox | S | html | 未到期（上次 2026-09-26） |
| hf-i2vgen | S | html | 未到期（上次 2026-09-26） |
| hf-longcat-edit | S | html | 未到期（上次 2026-09-26） |
| hf-magi | S | html | 未到期（上次 2026-09-26） |
| heygen-docs | S | spa | 变了 |
| synthesia-docs | S | spa | 变了 |
| hf-longcat-avatar | S | html | 变了 |
| hf-hunyuan-avatar | S | html | 变了 |
| hf-liveportrait | S | html | 变了 |
| hf-musetalk | S | html | 变了 |
| hf-hallo2 | S | html | 变了 |
| replicate-lipsync | A | spa | 未到期（上次 2026-09-26） |
| comfy-s2v | S | html | 未到期（上次 2026-09-26） |
| heygen-translate | S | html | 未到期（上次 2026-09-26） |
| heygen-live | S | html | 未到期（上次 2026-09-26） |
| heygen-photo | S | html | 未到期（上次 2026-09-26） |
| heygen-training | S | html | 未到期（上次 2026-09-26） |
| heygen-changelog | S | html | 变了 |
| hf-hallo-live | S | html | 变了 |
| hf-longcat-avatar-10 | S | html | 变了 |
| gh-video-retalking | S | html | 未到期（上次 2026-09-26） |
| elevenlabs-changelog | S | html | 变了 |
| hf-glm-voice | S | html | 变了 |
| hf-glm-tts | S | html | 变了 |
| openai-model-tts | S | spa | 变了 |
| openai-model-realtime | S | spa | 变了 |
| elevenlabs-docs | S | html | 未到期（上次 2026-10-08） |
| gemini-robotics-er | S | html | 变了 |
| figure-helix | A | html | 无变化 |
| pi-pi05-blog | A | html | 抓不到（HTTP 429） |
| pi-openpi-gh | A | html | 无变化 |
| nvidia-groot-gh | A | html | 无变化 |
| openvla-gh | A | html | 无变化 |
| openvla-repo | A | html | 无变化 |
| hf-robotics | B | json | 变了 |
| lerobot-gh | A | json | 变了 |
| groot-policy-doc | A | html | 无变化 |
| rynnbrain-card | A | html | 无变化 |
| maniskill-gh | B | json | 未到期（上次 2026-09-13） |
| cosmos3-card | S | html | 无变化 |
| genie3-blog | A | html | 无变化 |
| odyssey-site | A | html | 变了 |
| worldlabs-marble | A | html | 变了 |
| matrixgame-card | A | html | 无变化 |
| hunyuanworld-gh | A | html | 无变化 |
| wham-card | A | html | 未到期（上次 2026-09-13） |
| vjepa2-blog | A | html | 未到期（上次 2026-09-13） |
| vjepa2-card | B | html | 未到期（上次 2026-09-13） |
| sci-boltz-gh | A | html | 无变化 |
| sci-af3-blog | A | html | 未到期（上次 2026-09-14） |
| sci-esm2-card | B | html | 未到期（上次 2026-09-14） |
| sci-wn-gh | A | html | 无变化 |
| sci-aurora-gh | A | html | 无变化 |
| sci-neuralgcm-gh | A | html | 无变化 |
| sci-mattergen-gh | A | html | 无变化 |
| sci-mace-gh | A | html | 无变化 |
| sci-gnome-gh | A | html | 无变化 |
| seed-25 | A | html | 无变化 |
| veo-doc | A | html | 未到期（上次 2026-10-08） |
| sora-api | A | html | 变了 |
| wan-site | A | html | 无变化 |
| mm-hf-api | A | json | 变了 |
| vidu-s1-paper | A | html | 未到期（上次 2026-08-15） |
| omni-doc | A | html | 抓不到（fetch failed / ECONNRESET） |
| ltx-hf-23 | A | html | 变了 |
| gemini-image-docs | A | html | 未到期（上次 2026-10-08） |
| openai-image-docs | A | html | 未到期（上次 2026-10-08） |
| recraft-docs | A | html | 变了 |
| bfl-docs | A | html | 变了 |
| zimage-card | A | html | 变了 |
| hunyuan-image-card | A | html | 变了 |
| smolvla-card | A | html | 变了 |
| molmoact-card | A | html | 变了 |
| hf-whisper | A | html | 未到期（上次 2026-10-08） |
| hf-sensevoice | A | html | 变了 |
| hf-qwen3-asr | A | html | 变了 |
| minimax-release-notes | A | html | 变了 |
| seed-blog-1_5 | A | html | 无变化 |
| seed-blog-2_0 | A | html | 无变化 |
| ideogram-x | A | html | 变了 |
| hf-funcineforge | S | html | 未到期（上次 2026-10-04） |
| hf-org | S | json | 变了 |
| gh-gptsovits-cn | C | json | 未到期（上次 2026-10-04） |
