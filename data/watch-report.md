# 信息源监视报告 · 2026-09-11

本次检查 103 个到期源（共 449 个）：变化 30 · 首次 0 · 无变化 68 · **抓不到 5**

> 这份报告是给人看的那 20 条待办的来源（§59.3 的负反馈：人每周要看的条目 ≤ 20）。
> 「抓不到」不是失败，是**信息本身** —— 一个长期抓不到的官方源，说明那家厂商没有可 diff 的公开更新入口，
> 而那正好解释了为什么它名下的格子质量最差。

## 抓到了但没内容（比抓不到更危险 —— 它不会喊）

（无）

## 抓不到（要处理）

- **kling-site**（S/spa）Kling AI 官网 — 还是壳：渲染后正文只有 232 个字符
  https://klingai.com/
- **aa-t2i**（A/spa）Artificial Analysis · 文生图竞技场 — 还是壳：渲染后正文只有 321 个字符
  https://artificialanalysis.ai/text-to-image/arena
- **tripo-site**（S/spa）Tripo 官网 — 被人机验证挡住（页面标题「Just a moment...」）—— 这条源只能人工核，别再换抓法
  https://www.tripo3d.ai/
- **sora-eol-search**（B/html）OpenAI Sora 停服说明（⚠️ 页面反爬，我们抓不到，内容来自搜索摘要转述） — HTTP 403
  https://help.openai.com/en/articles/20001152-what-to-know-about-the-sora-discontinuation
- **sora-2**（A/html）OpenAI · Sora 2 发布页（⚠️ 对我们的采集器返回 403，本轮未能一手复核） — HTTP 403
  https://openai.com/index/sora-2/

## 有变化

- **hf-t2v** Hugging Face · text-to-video 按下载量
  新增 2 条：Jojocodex/minimax-h3-spatial-physics-lora、QuantStack/Wan2.1_14B_VACE-GGUF
- **hf-i2v** Hugging Face · image-to-video 按下载量
  新增 3 条：ChrisColeTech/minimax-h3-turbo-GGUF、abakanai/Minimax_h3_hybrid、realrebelai/Wan-Animate-2_GGUFs
- **aiwiki** AI Wiki
- **futurepedia** Futurepedia
- **capcut-templates** CapCut 模板
- **techcrunch-ai** TechCrunch · AI（RSS）
  新增 19 条：Jensen Huang explains why Nvidia will grow an astounding 70% next year、Mark Wahlberg is coming to TechCrunch Disrupt 2026, and he wants to talk about your work, not his、OpenAI puts Pro subscriptions on hold due to Astra demand、Anthropic details distillation campaigns from Alibaba, Moonshot AI, and DeepSeek、Meta&#8217;s AI agent Muse is now the No. 2 app in the US、Anthropic reveals rogue AI agents hate CAPTCHAs, just like you、India&#8217;s Pocket FM doubles revenue run rate to $500M as AI powers 93% of audio content、AI agents are flooding public services with new requests、Maven Robotics wants to steal your robot deployment deal、AI research startup Listen Labs scrubbed a $1.5B funding round for Salesforce talks、OpenAI adds a prominent AI doomer to its board of directors、Massachusetts hits data centers with new clean power rules …
- **ltx-hf-org** Hugging Face · Lightricks 组织全部仓库
  新增 3 条：Lightricks/LTX-2.5-22b-IC-LoRA-Clean-Plate、Lightricks/LTX-2.5-22b-IC-LoRA-Day-To-Night、Lightricks/LTX-2.5-22b-IC-LoRA-Water-Simulation
- **picsart-video** Picsart AI 视频
- **volcengine-ark-price** 火山引擎方舟 · 模型计费
- **google-ai-price** Google AI · Gemini API 定价
- **bailian-price** 阿里云百炼 · 模型计费
- **runway-price** Runway · 定价
- **kling-price** 可灵开放平台 · 计费
- **vidu-price** Vidu 平台 · 价格
- **fal-ltx-price** fal · 平台定价
- **replicate-price** Replicate · 定价
- **mm-blog** MiniMax · H3 官方发布
- **azure-foundry-blog** Microsoft Azure AI Foundry 博客
- **recraft-blog** Recraft 官方博客
- **kolors-gh** Kolors 官方 GitHub（含发布日志）
- **hf-t2i** Hugging Face · text-to-image 按下载量
  新增 3 条：black-forest-labs/FLUX.1-Krea-dev、nunchaku-ai/nunchaku-qwen-image-edit、qujincheng/Z-Image-Lora
- **hf-i2i** Hugging Face · image-to-image 按下载量
  新增 2 条：InstantX/Qwen-Image-ControlNet-Union、black-forest-labs/FLUX.2-dev-NVFP4
- **hf-kokoro** Hugging Face · hexgrad/Kokoro-82M
- **hf-cosyvoice2** Hugging Face · FunAudioLLM/CosyVoice2-0.5B
- **hf-glmtts** Hugging Face · zai-org/GLM-TTS
- **hf-glm4voice** Hugging Face · zai-org/glm-4-voice-9b
- **hf-qwen3omni** Hugging Face · Qwen/Qwen3-Omni-30B-A3B-Instruct
- **hf-org-minimax** Hugging Face · MiniMaxAI 官方组织（全量仓库清单）
  新增 1 条：MiniMaxAI/MiniMax-Music3
- **hf-org-elevenlabs** Hugging Face · elevenlabs 官方组织（全量仓库清单）
- **ideogram-layerize** Ideogram 官方 API 参考 · Layerize Text

## 全部

| 源 | 权威 | 类型 | 状态 |
|---|---|---|---|
| seed-blog | S | html | 未到期（上次 2026-09-09） |
| seed-models | S | html | 未到期（上次 2026-09-09） |
| kling-api-updates | S | spa | 未到期（上次 2026-09-09） |
| kling-site | S | spa | 抓不到（还是壳：渲染后正文只有 232 个字符） |
| google-video-docs | S | html | 未到期（上次 2026-09-09） |
| deepmind-veo | S | html | 未到期（上次 2026-09-09） |
| vertex-video-ref | S | html | 未到期（上次 2026-09-09） |
| openai-sora-eol | S | spa | 未到期（上次 2026-08-12） |
| openai-sora-2 | S | spa | 从未抓过 |
| wan-gh-releases | S | json | 未到期（上次 2026-09-09） |
| wan-hf | S | json | 未到期（上次 2026-09-09） |
| minimax-blog | S | html | 未到期（上次 2026-09-09） |
| minimax-hf | S | json | 未到期（上次 2026-09-09） |
| runway-research | S | html | 未到期（上次 2026-09-09） |
| luma-site | S | html | 未到期（上次 2026-09-09） |
| vidu-changelog | S | spa | 未到期（上次 2026-09-09） |
| vidu-model-map | S | spa | 未到期（上次 2026-09-09） |
| vidu-function-list | S | spa | 未到期（上次 2026-09-09） |
| vidu-site | S | html | 未到期（上次 2026-09-09） |
| vidu-s1-gh | S | json | 未到期（上次 2026-09-09） |
| pika-site | S | html | 未到期（上次 2026-09-09） |
| higgsfield-site | S | html | 未到期（上次 2026-09-09） |
| decart-research | S | html | 未到期（上次 2026-09-09） |
| arxiv-video | S | atom | 未到期（上次 2026-09-06） |
| epoch-notable | A | csv | 未到期（上次 2026-09-09） |
| aa-t2v | A | spa | 未到期（上次 2026-09-09） |
| aa-i2v | A | spa | 未到期（上次 2026-09-09） |
| hf-t2v | A | json | 变了 |
| hf-i2v | A | json | 变了 |
| hf-v2v | A | json | 未到期（上次 2026-09-09） |
| fal-video | S | spa | 未到期（上次 2026-09-10） |
| replicate-t2v | S | html | 未到期（上次 2026-09-09） |
| aiwiki | B | spa | 变了 |
| futurepedia | B | html | 变了 |
| comfyui-releases | C | json | 未到期（上次 2026-09-09） |
| capcut-templates | C | html | 变了 |
| picsart-effects | C | html | 无变化 |
| runway-changelog | S | spa | 未到期（上次 2026-09-09） |
| runway-models | S | spa | 未到期（上次 2026-09-09） |
| luma-changelog | S | spa | 未到期（上次 2026-08-07） |
| google-models | S | html | 未到期（上次 2026-09-09） |
| seed-models-hub | S | html | 未到期（上次 2026-09-09） |
| apiyi-models | S | spa | 未到期（上次 2026-09-09） |
| arxiv-worldmodel | S | atom | 未到期（上次 2026-09-06） |
| techcrunch-ai | B | atom | 变了 |
| decart-blog | S | spa | 未到期（上次 2026-09-09） |
| ltx-gh | S | json | 未到期（上次 2026-09-09） |
| ltx-hf-org | S | json | 变了 |
| decart-site | S | spa | 未到期（上次 2026-09-05） |
| picsart-video | C | html | 变了 |
| libtv | C | spa | 从未抓过 |
| dreamina | S | html | 未到期（上次 2026-09-09） |
| hailuo-video | S | html | 未到期（上次 2026-09-09） |
| volcengine-ark-price | S | spa | 变了 |
| minimax-price | S | spa | 无变化 |
| google-ai-price | S | html | 变了 |
| bailian-price | S | spa | 变了 |
| runway-price | S | spa | 变了 |
| kling-price | S | spa | 变了 |
| vidu-price | S | spa | 变了 |
| fal-ltx-price | S | spa | 变了 |
| replicate-price | A | html | 变了 |
| hf-course | S | html | 未到期（上次 2026-08-12） |
| comfy-docs | S | spa | 未到期（上次 2026-09-09） |
| h3-card | S | html | 未到期（上次 2026-09-09） |
| hf-lineage | S | json | 未到期（上次 2026-09-09） |
| vacetools-gh | C | json | 未到期（上次 2026-09-09） |
| framepack-gh | S | json | 未到期（上次 2026-09-09） |
| fpwrapper-gh | C | json | 未到期（上次 2026-09-09） |
| latentsync-gh | S | json | 未到期（上次 2026-09-09） |
| lswrapper-gh | C | json | 未到期（上次 2026-09-09） |
| float-gh | C | json | 未到期（上次 2026-09-09） |
| sviflf-gh | C | json | 未到期（上次 2026-09-09） |
| flflatent-gh | C | json | 未到期（上次 2026-09-09） |
| mm-blog | S | html | 变了 |
| wanwrapper-gh | C | json | 未到期（上次 2026-09-09） |
| comfy-org-hf | S | json | 未到期（上次 2026-09-09） |
| ltx-comfy-gh | S | json | 未到期（上次 2026-09-09） |
| mpt-gh | C | json | 未到期（上次 2026-09-09） |
| manim-gh | C | json | 未到期（上次 2026-09-09） |
| pyvideotrans-gh | C | json | 未到期（上次 2026-09-09） |
| duix-gh | C | json | 未到期（上次 2026-09-09） |
| fay-gh | C | json | 未到期（上次 2026-09-09） |
| narrato-gh | C | json | 未到期（上次 2026-09-09） |
| zho-wf-gh | C | json | 未到期（上次 2026-09-09） |
| echomimic-gh | C | json | 未到期（上次 2026-09-09） |
| linly-talker-gh | C | json | 未到期（上次 2026-09-09） |
| animate-anything-gh | C | json | 未到期（上次 2026-09-09） |
| huobao-gh | C | json | 未到期（上次 2026-09-09） |
| awesome-vd-gh | C | json | 未到期（上次 2026-09-09） |
| seedream-page | S | html | 未到期（上次 2026-09-09） |
| openai-models | S | html | 未到期（上次 2026-09-10） |
| gemini-models | S | html | 未到期（上次 2026-09-10） |
| google-gemini-blog | S | html | 未到期（上次 2026-09-09） |
| azure-foundry-blog | B | html | 变了 |
| recraft-blog | S | html | 变了 |
| kolors-gh | S | html | 变了 |
| krea-blog | S | html | 未到期（上次 2026-09-09） |
| wiki-midjourney | B | html | 未到期（上次 2026-08-12） |
| comfyui-gh | S | json | 无变化 |
| sdwebui-gh | S | json | 无变化 |
| fooocus-gh | S | json | 无变化 |
| invokeai-gh | S | json | 无变化 |
| iopaint-gh | S | json | 无变化 |
| rembg-gh | S | json | 无变化 |
| realesrgan-gh | S | json | 无变化 |
| gfpgan-gh | S | json | 无变化 |
| codeformer-gh | S | json | 无变化 |
| oldphoto-gh | S | json | 无变化 |
| controlnet-gh | S | json | 无变化 |
| ipadapter-gh | S | json | 无变化 |
| instantid-gh | S | json | 无变化 |
| photomaker-gh | S | json | 无变化 |
| iclight-gh | S | json | 无变化 |
| idmvton-gh | S | json | 无变化 |
| ootd-gh | S | json | 无变化 |
| catvton-gh | S | json | 无变化 |
| kritaai-gh | S | json | 无变化 |
| omnigen-gh | S | json | 无变化 |
| step1x-gh | S | json | 无变化 |
| qwenimage-gh | S | json | 无变化 |
| anytext-gh | S | json | 无变化 |
| incontextlora-gh | S | json | 无变化 |
| comictrans-gh | S | json | 无变化 |
| manganinjia-gh | S | json | 无变化 |
| starvector-gh | S | json | 无变化 |
| svgdreamer-gh | S | json | 无变化 |
| easyphoto-gh | S | json | 无变化 |
| ipadapter-plus-gh | S | json | 无变化 |
| controlnet-aux-gh | S | json | 无变化 |
| ultimate-upscale-gh | S | json | 无变化 |
| comfy-manager-gh | S | json | 无变化 |
| comfy-examples-gh | S | json | 无变化 |
| comfy-templates-gh | S | json | 无变化 |
| hf-diffusion-class-gh | S | json | 无变化 |
| fastai-course | S | html | 未到期（上次 2026-08-12） |
| dreamtextures-gh | S | json | 无变化 |
| char2d-gh | S | json | 无变化 |
| hf-pixelart-lora | S | json | 未到期（上次 2026-08-12） |
| google-nb-blog | S | html | 未到期（上次 2026-09-09） |
| ms-foundry-blog | B | html | 无变化 |
| hf-image-org | S | json | 未到期（上次 2026-09-09） |
| mj-updates | S | html | 未到期（上次 2026-09-09） |
| aa-t2i | A | spa | 抓不到（还是壳：渲染后正文只有 321 个字符） |
| hf-t2i | A | json | 变了 |
| hf-i2i | A | json | 变了 |
| anthropic-models | S | html | 未到期（上次 2026-09-10） |
| deepseek-docs | S | html | 未到期（上次 2026-09-10） |
| xai-docs | S | html | 未到期（上次 2026-09-10） |
| doubao-force-2026 | B | html | 未到期（上次 2026-08-12） |
| hf-text-org | S | json | 未到期（上次 2026-09-10） |
| wan3-qbitai | B | spa | 从未抓过 |
| kimi-api | S | html | 未到期（上次 2026-09-09） |
| glm-api | S | html | 未到期（上次 2026-09-09） |
| minimax-platform | S | html | 未到期（上次 2026-09-09） |
| langchain-gh | S | json | 无变化 |
| langgraph-gh | S | json | 无变化 |
| llamaindex-gh | S | json | 无变化 |
| vllm-gh | S | json | 无变化 |
| llamacpp-gh | S | json | 无变化 |
| ollama-gh | S | json | 无变化 |
| ragflow-gh | S | json | 无变化 |
| dify-gh | S | json | 无变化 |
| n8n-gh | S | json | 无变化 |
| openwebui-gh | S | json | 无变化 |
| autogen-gh | S | json | 无变化 |
| crewai-gh | S | json | 无变化 |
| litellm-gh | S | json | 无变化 |
| transformers-gh | S | json | 无变化 |
| unsloth-gh | S | json | 无变化 |
| llamafactory-gh | S | json | 无变化 |
| aider-gh | S | json | 无变化 |
| cline-gh | S | json | 无变化 |
| continue-gh | S | json | 无变化 |
| openhands-gh | S | json | 无变化 |
| browseruse-gh | S | json | 无变化 |
| markitdown-gh | S | json | 无变化 |
| unstructured-gh | S | json | 无变化 |
| mineru-gh | S | json | 无变化 |
| mcpservers-gh | S | json | 无变化 |
| anthropic-features | S | html | 未到期（上次 2026-09-10） |
| openai-docs | S | html | 未到期（上次 2026-09-10） |
| deepseek-pricing | S | html | 未到期（上次 2026-09-10） |
| deepseek-updates | S | html | 未到期（上次 2026-09-10） |
| bailian-models | S | html | 未到期（上次 2026-09-09） |
| kimi-pricing | S | html | 未到期（上次 2026-09-09） |
| glm-52-doc | S | html | 未到期（上次 2026-09-09） |
| kimi-websearch | S | html | 未到期（上次 2026-09-09） |
| kimi-chat-api | S | html | 未到期（上次 2026-09-09） |
| bailian-websearch | S | html | 未到期（上次 2026-09-09） |
| glm-websearch | S | html | 未到期（上次 2026-09-09） |
| bailian-coder | S | html | 未到期（上次 2026-09-09） |
| ark-models | S | spa | 未到期（上次 2026-09-09） |
| minimax-api-overview | S | spa | 未到期（上次 2026-09-09） |
| claude-models | S | html | 未到期（上次 2026-09-10） |
| openai-caching | S | html | 未到期（上次 2026-09-10） |
| openai-structured | S | html | 未到期（上次 2026-09-10） |
| deepseek-chat-api | S | html | 未到期（上次 2026-09-10） |
| gemini-audio | S | spa | 未到期（上次 2026-09-10） |
| gemini-vision | S | spa | 未到期（上次 2026-09-10） |
| minimax-anthropic-api | S | spa | 未到期（上次 2026-09-09） |
| minimax-openai-api | S | spa | 未到期（上次 2026-09-09） |
| minimax-server-tools | S | spa | 未到期（上次 2026-09-09） |
| minimax-caching | S | spa | 未到期（上次 2026-09-09） |
| minimax-openapi | S | json | 未到期（上次 2026-09-09） |
| gemini-computer-use | S | spa | 未到期（上次 2026-09-10） |
| ark-pricing | S | spa | 未到期（上次 2026-09-09） |
| bailian-models-zh | S | spa | 未到期（上次 2026-09-09） |
| glm-batch | S | html | 未到期（上次 2026-09-09） |
| glm-chat-api | S | html | 未到期（上次 2026-09-09） |
| claude-deprecations | S | html | 未到期（上次 2026-09-10） |
| openai-changelog | S | spa | 未到期（上次 2026-09-10） |
| gemini-changelog | S | spa | 未到期（上次 2026-09-10） |
| xai-release-notes | S | html | 未到期（上次 2026-09-10） |
| aa-llm | B | spa | 未到期（上次 2026-09-09） |
| ideogram-api | S | html | 未到期（上次 2026-09-09） |
| elevenlabs-models | S | html | 未到期（上次 2026-09-09） |
| openai-realtime | S | html | 未到期（上次 2026-09-09） |
| gemini-tts | S | html | 未到期（上次 2026-09-09） |
| elevenlabs-tts | S | html | 未到期（上次 2026-09-09） |
| bailian-omni | S | html | 未到期（上次 2026-09-10） |
| elevenlabs-remix | S | html | 未到期（上次 2026-09-09） |
| openai-tts | S | html | 未到期（上次 2026-09-09） |
| gemini-music | S | html | 未到期（上次 2026-09-10） |
| glm-tts-doc | S | html | 未到期（上次 2026-09-09） |
| glm-tts-clone-doc | S | html | 未到期（上次 2026-09-09） |
| glm-voice-doc | S | html | 未到期（上次 2026-09-09） |
| xai-voice | S | html | 未到期（上次 2026-09-09） |
| hf-sound-org | S | json | 未到期（上次 2026-09-09） |
| kokoro-card | S | html | 未到期（上次 2026-09-09） |
| xai-models | S | html | 未到期（上次 2026-09-10） |
| mistral-models | S | html | 未到期（上次 2026-09-09） |
| mistral-tools | S | html | 未到期（上次 2026-09-09） |
| mistral-vision | S | html | 未到期（上次 2026-09-09） |
| fish-s2pro-card | S | html | 未到期（上次 2026-09-09） |
| cosyvoice-card | S | html | 未到期（上次 2026-09-09） |
| llama-card | S | html | 未到期（上次 2026-09-09） |
| elevenlabs-voices | S | html | 未到期（上次 2026-09-09） |
| wan-t2v-card | S | html | 未到期（上次 2026-09-09） |
| minimax-release | S | spa | 未到期（上次 2026-09-09） |
| s-e2ab-gh | C | json | 未到期（上次 2026-09-09） |
| s-abogen-gh | C | json | 未到期（上次 2026-09-09） |
| s-epub2tts-gh | C | json | 未到期（上次 2026-09-09） |
| s-abcreator-gh | C | json | 未到期（上次 2026-09-09） |
| s-pvt-gh | C | json | 未到期（上次 2026-09-09） |
| s-smartsub-gh | C | json | 未到期（上次 2026-09-09） |
| s-youdub-gh | C | json | 未到期（上次 2026-09-09） |
| s-pipecat-gh | C | json | 未到期（上次 2026-09-09） |
| s-livekit-gh | C | json | 未到期（上次 2026-09-09） |
| s-hfs2s-gh | C | json | 未到期（上次 2026-09-09） |
| s-moshi-gh | C | json | 未到期（上次 2026-09-09） |
| s-acestep15-gh | C | json | 未到期（上次 2026-09-09） |
| s-acestep-gh | C | json | 未到期（上次 2026-09-09） |
| s-yue-gh | C | json | 未到期（上次 2026-09-09） |
| s-audiocraft-gh | C | json | 未到期（上次 2026-09-09） |
| s-gptsovits-gh | C | json | 未到期（上次 2026-09-09） |
| s-rvc-gh | C | json | 未到期（上次 2026-09-09） |
| s-fishspeech-gh | C | json | 未到期（上次 2026-09-09） |
| s-indextts-gh | C | json | 未到期（上次 2026-09-09） |
| s-cosyvoice-gh | C | json | 未到期（上次 2026-09-09） |
| s-f5tts-gh | C | json | 未到期（上次 2026-09-09） |
| s-qwen3omni-gh | C | json | 未到期（上次 2026-09-09） |
| ideogram-overview | A | html | 未到期（上次 2026-09-09） |
| ideogram-v4-remix | A | html | 未到期（上次 2026-09-09） |
| ideogram-v3-inpaint | A | html | 未到期（上次 2026-09-09） |
| ideogram-v3-reframe | A | html | 未到期（上次 2026-09-09） |
| ideogram-v3-generate | A | html | 未到期（上次 2026-09-09） |
| ideogram-edit | A | html | 未到期（上次 2026-09-09） |
| ideogram-upscale | A | html | 未到期（上次 2026-09-09） |
| ideogram-hf | A | html | 未到期（上次 2026-09-09） |
| bailian-qimg3 | A | html | 未到期（上次 2026-09-09） |
| bailian-qimg | A | html | 未到期（上次 2026-09-09） |
| bailian-textgen-zh | A | html | 未到期（上次 2026-09-09） |
| bailian-thinking-zh | A | html | 未到期（上次 2026-09-09） |
| bailian-cache-zh | A | html | 未到期（上次 2026-09-09） |
| bailian-batch-zh | A | html | 未到期（上次 2026-09-09） |
| bailian-websearch-zh | A | html | 未到期（上次 2026-09-10） |
| hf-kokoro | A | json | 变了 |
| hf-cosyvoice2 | A | json | 变了 |
| hf-glmtts | A | json | 变了 |
| hf-glm4voice | A | json | 变了 |
| hf-fishspeech15 | A | html | 未到期（上次 2026-08-15） |
| hf-qwen3omni | A | json | 变了 |
| hf-qwen-layered | A | html | 未到期（上次 2026-08-15） |
| hf-org-minimax | A | json | 变了 |
| hf-org-xai | A | json | 无变化 |
| hf-org-elevenlabs | A | json | 变了 |
| hf-org-openai | A | json | 无变化 |
| ideogram-layerize | A | html | 变了 |
| recraft-endpoints | A | html | 未到期（上次 2026-09-03） |
| recraft-nl-edit | A | html | 未到期（上次 2026-09-03） |
| hunyuan-image-hf | A | json | 未到期（上次 2026-09-03） |
| bfl-flux2-overview | A | html | 未到期（上次 2026-09-03） |
| bfl-flux2-multiref | A | html | 未到期（上次 2026-09-05） |
| ark-seedream-api | A | spa | 未到期（上次 2026-09-10） |
| arxiv-fp8 | A | html | 未到期（上次 2026-08-13） |
| arxiv-int8 | A | html | 未到期（上次 2026-08-13） |
| arxiv-qlora | A | html | 未到期（上次 2026-08-13） |
| arxiv-gptq | A | html | 未到期（上次 2026-08-13） |
| arxiv-awq | A | html | 未到期（上次 2026-08-13） |
| arxiv-lora | A | html | 未到期（上次 2026-08-13） |
| hf-gguf-doc | A | html | 未到期（上次 2026-08-13） |
| hf-diffusers-memory | A | html | 未到期（上次 2026-08-13） |
| zimage-gh | A | html | 未到期（上次 2026-09-05） |
| hunyuan-image-gh | A | html | 未到期（上次 2026-09-05） |
| skyreels-gh | A | html | 未到期（上次 2026-08-29） |
| bfl-flux3 | A | html | 未到期（上次 2026-08-29） |
| anthropic-privacy | A | html | 未到期（上次 2026-08-14） |
| stability-terms | A | html | 未到期（上次 2026-08-14） |
| recraft-blog-b | A | html | 未到期（上次 2026-08-14） |
| gh-llm-universe | C | json | 未到期（上次 2026-08-14） |
| gh-all-in-rag | C | json | 未到期（上次 2026-08-14） |
| gh-handy-multi-agent | C | json | 未到期（上次 2026-08-14） |
| gh-llm-action | C | json | 未到期（上次 2026-08-14） |
| gh-self-llm | C | json | 未到期（上次 2026-08-14） |
| gh-langchain-zh | C | json | 未到期（上次 2026-08-14） |
| gh-llamafactory | C | json | 未到期（上次 2026-08-14） |
| gh-gptsovits-cn | C | json | 未到期（上次 2026-08-14） |
| gh-cosyvoice-doc | C | json | 未到期（上次 2026-08-14） |
| gh-chattts-cn | C | json | 未到期（上次 2026-08-14） |
| gh-pyvideotrans-doc | C | json | 未到期（上次 2026-08-14） |
| gh-comfy-zho | C | json | 未到期（上次 2026-08-14） |
| gh-comfyui | C | json | 未到期（上次 2026-08-14） |
| gh-sdbook | C | json | 未到期（上次 2026-08-14） |
| waytoagi-wiki | C | spa | 从未抓过 |
| hf-hunyuan3d-21 | S | html | 未到期（上次 2026-08-29） |
| tripo-docs-generation | S | spa | 未到期（上次 2026-08-29） |
| meshy-docs-api | S | spa | 未到期（上次 2026-08-29） |
| meshy-site | S | spa | 未到期（上次 2026-08-29） |
| rodin-api-docs | S | html | 未到期（上次 2026-08-29） |
| gh-trellis | S | html | 未到期（上次 2026-08-29） |
| seed3d-page | S | spa | 从未抓过 |
| stability-spar3d | S | html | 未到期（上次 2026-08-29） |
| tripo-site | S | spa | 抓不到（被人机验证挡住（页面标题「Just a moment...」）—— 这条源只能人工核，别再换抓法） |
| rodin-site | S | spa | 未到期（上次 2026-08-29） |
| tripo-docs-animation | S | spa | 未到期（上次 2026-08-29） |
| gh-hunyuan3d-buffalo | S | html | 未到期（上次 2026-08-29） |
| replicate-hunyuan3d-31 | A | spa | 未到期（上次 2026-08-29） |
| replicate-3d | A | spa | 未到期（上次 2026-09-04） |
| hf-image-to-3d | A | spa | 未到期（上次 2026-09-04） |
| comfy-3d-hunyuan | S | html | 未到期（上次 2026-09-04） |
| gh-hunyuan3d-21 | S | html | 未到期（上次 2026-09-04） |
| gh-hunyuan3d-part | S | html | 未到期（上次 2026-09-04） |
| gh-spar3d | S | html | 未到期（上次 2026-09-04） |
| gh-triposg | S | html | 未到期（上次 2026-09-04） |
| gh-instantmesh | S | html | 未到期（上次 2026-09-04） |
| modelscope-orgs | S | json | 从未抓过 |
| hf-wan-vace | S | html | 未到期（上次 2026-08-29） |
| hf-ltx-25 | S | html | 未到期（上次 2026-08-29） |
| meshy-changelog | S | spa | 未到期（上次 2026-08-29） |
| hf-instantmesh | S | html | 未到期（上次 2026-09-04） |
| hf-apple-sharp | S | html | 未到期（上次 2026-09-04） |
| gh-hunyuan3d-api | S | html | 未到期（上次 2026-09-04） |
| hf-anysplat | S | html | 未到期（上次 2026-09-04） |
| arxiv-seed3d-20 | S | html | 未到期（上次 2026-08-14） |
| arxiv-seed3d-10 | S | html | 未到期（上次 2026-08-14） |
| hf-trellis2 | S | html | 未到期（上次 2026-09-04） |
| pixverse-caps | S | html | 未到期（上次 2026-08-29） |
| pixverse-v6 | S | html | 未到期（上次 2026-08-29） |
| pixverse-fusion | S | html | 未到期（上次 2026-08-29） |
| hf-cogvideox | S | html | 未到期（上次 2026-09-05） |
| hf-i2vgen | S | html | 未到期（上次 2026-09-05） |
| hf-longcat-edit | S | html | 未到期（上次 2026-09-05） |
| hf-magi | S | html | 未到期（上次 2026-09-05） |
| heygen-docs | S | spa | 未到期（上次 2026-08-29） |
| synthesia-docs | S | spa | 未到期（上次 2026-08-29） |
| hf-longcat-avatar | S | html | 未到期（上次 2026-08-29） |
| hf-hunyuan-avatar | S | html | 未到期（上次 2026-08-29） |
| hf-liveportrait | S | html | 未到期（上次 2026-08-29） |
| hf-musetalk | S | html | 未到期（上次 2026-08-29） |
| hf-hallo2 | S | html | 未到期（上次 2026-08-29） |
| replicate-lipsync | A | spa | 未到期（上次 2026-09-05） |
| comfy-s2v | S | html | 未到期（上次 2026-09-05） |
| heygen-translate | S | html | 未到期（上次 2026-09-05） |
| heygen-live | S | html | 未到期（上次 2026-09-05） |
| heygen-photo | S | html | 未到期（上次 2026-09-05） |
| heygen-training | S | html | 未到期（上次 2026-09-05） |
| heygen-changelog | S | html | 未到期（上次 2026-08-29） |
| hf-hallo-live | S | html | 未到期（上次 2026-08-29） |
| hf-longcat-avatar-10 | S | html | 未到期（上次 2026-08-29） |
| gh-video-retalking | S | html | 未到期（上次 2026-09-05） |
| elevenlabs-changelog | S | html | 未到期（上次 2026-08-29） |
| hf-glm-voice | S | html | 未到期（上次 2026-08-29） |
| hf-glm-tts | S | html | 未到期（上次 2026-08-29） |
| openai-model-tts | S | spa | 未到期（上次 2026-08-29） |
| openai-model-realtime | S | spa | 未到期（上次 2026-08-29） |
| elevenlabs-docs | S | html | 未到期（上次 2026-09-10） |
| gemini-robotics-er | S | html | 未到期（上次 2026-09-05） |
| figure-helix | A | html | 未到期（上次 2026-08-29） |
| pi-pi05-blog | A | html | 未到期（上次 2026-08-29） |
| pi-openpi-gh | A | html | 未到期（上次 2026-09-05） |
| nvidia-groot-gh | A | html | 未到期（上次 2026-09-05） |
| openvla-gh | A | html | 未到期（上次 2026-08-29） |
| openvla-repo | A | html | 未到期（上次 2026-08-29） |
| hf-robotics | B | json | 未到期（上次 2026-09-05） |
| lerobot-gh | A | json | 未到期（上次 2026-09-05） |
| groot-policy-doc | A | html | 未到期（上次 2026-09-05） |
| rynnbrain-card | A | html | 未到期（上次 2026-08-29） |
| maniskill-gh | B | json | 未到期（上次 2026-08-14） |
| cosmos3-card | S | html | 未到期（上次 2026-09-05） |
| genie3-blog | A | html | 未到期（上次 2026-08-29） |
| odyssey-site | A | html | 未到期（上次 2026-08-29） |
| worldlabs-marble | A | html | 未到期（上次 2026-08-29） |
| matrixgame-card | A | html | 未到期（上次 2026-08-29） |
| hunyuanworld-gh | A | html | 未到期（上次 2026-08-29） |
| wham-card | A | html | 未到期（上次 2026-08-14） |
| vjepa2-blog | A | html | 未到期（上次 2026-08-14） |
| vjepa2-card | B | html | 未到期（上次 2026-08-14） |
| sci-boltz-gh | A | html | 未到期（上次 2026-08-29） |
| sci-af3-blog | A | html | 未到期（上次 2026-08-15） |
| sci-esm2-card | B | html | 未到期（上次 2026-08-15） |
| sci-wn-gh | A | html | 未到期（上次 2026-08-29） |
| sci-aurora-gh | A | html | 未到期（上次 2026-08-29） |
| sci-neuralgcm-gh | A | html | 未到期（上次 2026-08-29） |
| sci-mattergen-gh | A | html | 未到期（上次 2026-08-29） |
| sci-mace-gh | A | html | 未到期（上次 2026-08-29） |
| sci-gnome-gh | A | html | 未到期（上次 2026-08-29） |
| kling-api | A | html | 未到期（上次 2026-08-29） |
| seed-25 | A | html | 未到期（上次 2026-08-29） |
| veo-doc | A | html | 未到期（上次 2026-09-10） |
| sora-eol-search | B | html | 抓不到（HTTP 403） |
| sora-api | A | html | 未到期（上次 2026-08-29） |
| sora-2 | A | html | 抓不到（HTTP 403） |
| wan-site | A | html | 未到期（上次 2026-08-29） |
| mm-hf-api | A | json | 未到期（上次 2026-08-29） |
| vidu-fl | A | html | 未到期（上次 2026-08-29） |
| vidu-up | A | html | 未到期（上次 2026-08-29） |
| vidu-mm | A | html | 未到期（上次 2026-08-29） |
| rw-changelog | A | html | 未到期（上次 2026-08-29） |
| vidu-s1-paper | A | html | 未到期（上次 2026-08-15） |
| omni-doc | A | html | 未到期（上次 2026-08-29） |
| g-video | A | html | 未到期（上次 2026-08-29） |
| ltx-hf-23 | A | html | 未到期（上次 2026-08-29） |
| aa-board | B | html | 未到期（上次 2026-08-29） |
| gemini-image-docs | A | html | 未到期（上次 2026-09-10） |
| openai-image-docs | A | html | 未到期（上次 2026-09-10） |
| recraft-docs | A | html | 未到期（上次 2026-08-29） |
| bfl-docs | A | html | 未到期（上次 2026-08-29） |
| zimage-card | A | html | 未到期（上次 2026-08-29） |
| hunyuan-image-card | A | html | 未到期（上次 2026-08-29） |
| smolvla-card | A | html | 未到期（上次 2026-08-29） |
| molmoact-card | A | html | 未到期（上次 2026-08-29） |
| hf-whisper | A | html | 未到期（上次 2026-09-10） |
| hf-sensevoice | A | html | 未到期（上次 2026-08-29） |
| hf-qwen3-asr | A | html | 未到期（上次 2026-08-29） |
| minimax-release-notes | A | html | 未到期（上次 2026-08-29） |
| seed-blog-1_5 | A | html | 未到期（上次 2026-08-29） |
| seed-blog-2_0 | A | html | 未到期（上次 2026-08-29） |
| ideogram-x | A | html | 未到期（上次 2026-08-29） |
