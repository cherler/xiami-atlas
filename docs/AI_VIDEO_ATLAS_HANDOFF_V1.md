# AI 能力地图（首期：AI 视频能力地图）完整产品方案 / 交接文档

> 文档用途：给其他大模型、开发助手、设计助手、研究助手继续讨论或直接进入开发。  
> 当前状态：经过四轮方案审查与迭代，产品定义已基本稳定；下一阶段应进入原型与实践验证，不建议继续无限扩展纸面方案。  
> 核心原则：**数据库负责保存事实，Agent 负责研究与提取，人负责压缩与判断，前端负责制造认知。**

> ## ⚠️ 先读 [§59 修订记录 V1.1](#59-修订记录-v112026-08-07)
>
> §1~§58 写于产品定义阶段。**§59 效力高于前文**，锁定了三个方向决定
> （能力做枢纽的关系图 / 中文站并入 xiamimate.com / Agent 自主 + 人力每周 3 小时上限），
> 并覆盖了其中 13 处条目。§59.7 是覆盖对照表。
>
> 上面那条"核心原则"里的**"人负责压缩与判断"已按 §59.3 收窄**为：
> 人只负责「我们实测过」这一层和每周一篇周报，其余交给 Agent 自动发布。

---

# 0. 项目背景与起因

最初的问题并不是“我要做一个 AI 百科”，而是：

- 不清楚当前 AI 模型研发到了哪一步；
- 不清楚主流 AI 公司、团队、模型、平台、应用之间的关系；
- 不清楚同一个“能力”到底属于模型原生能力、平台功能、Skill 还是 Workflow；
- 不清楚哪些平台可以使用某个模型、是否有 API、是否开源；
- AI 视频领域尤其混乱：Kling、Seedance、Veo、Wan、Hailuo、Sora、Higgsfield、Pika、Picsart、CapCut、LibTV、MiniMax Hub、ComfyUI Workflow 等分散在不同层级；
- 现有信息源很多，但彼此割裂：
  - AI Wiki：百科；
  - Epoch AI：模型与历史数据；
  - Artificial Analysis：Benchmark；
  - Hugging Face：开源模型生态；
  - Futurepedia：AI 应用导航；
  - fal / Replicate：模型 API 市场；
  - Higgsfield / Pika / Vidu / Picsart / CapCut：Effects / Templates / Skills；
  - GitHub / arXiv / ComfyUI：开源项目、论文、Workflow。

因此项目目标不是再做一个“大而全 AI 工具导航”，而是：

> **把 AI 世界整理成可查询、可追溯、可视化的“能力地图”，先从 AI 视频开始。**

---

# 1. 产品定位

## 1.1 产品暂定名

内部暂定：

**AI Video Atlas / AI 视频能力地图**

长期可扩展为：

**AI Atlas / AI 能力地图**

第一阶段只做 AI Video，不要同时做 Image / Audio / Agent / Robotics。

## 1.2 一句话定义

> **帮助用户在 10 秒内看懂一个 AI 模型、能力、平台或 Skill 在整个生态中的位置，并知道“它能做什么、谁做的、在哪里用、如何实现、依据是什么”。**

## 1.3 产品不是

不要把它做成：

- AI Wiki 的中文复制版；
- Futurepedia 式“大量工具卡片”；
- Hugging Face 镜像；
- Artificial Analysis 排行榜复制；
- 一个单纯知识图谱“蜘蛛网”；
- 一个 AI 新闻 Feed；
- 一个“漂亮但看完就走”的数字展览；
- 一个自动抓互联网然后让 Agent 自由写百科的系统；
- 一个追求“全球最全”的数据库。

## 1.4 产品真正要解决的用户问题

典型问题：

- Kling 到底是谁家的？
- Kling 3.x 和 Kling Motion Control 是什么关系？
- Motion Control 是模型能力还是平台包装？
- Seedance 是字节哪个团队做的？
- Seedance 2.0 在哪些平台可以使用？
- Higgsfield 自己是不是模型？
- Higgsfield 为什么能同时提供 Kling / Seedance / Veo 等？
- 我想做“人物动作复刻”，有哪些模型 / Skill / Workflow？
- 哪些视频模型支持首尾帧？
- 哪些支持原生音频？
- 哪些有开源实现？
- Kling vs Seedance 有什么共同能力、不同能力？
- 最近一周 AI 视频领域真正发生了什么变化？
- 这个变化为什么重要？

---

# 2. 核心用户

第一阶段不要同时服务所有人。

## 2.1 核心用户

> **想跟上 AI 创作技术，但没有精力自己追踪全部模型、平台与更新的创作者 / 产品人 / 技术从业者。**

特征：

- 对 AI 有一定认知；
- 不是纯小白；
- 但无法持续追踪几十个平台；
- 关心“能做什么”和“去哪里用”；
- 比较讨厌长篇 Wiki 文字；
- 希望快速形成生态认知；
- 经常需要比较模型或寻找实现路径。

## 2.2 次级用户

- 开发者：关心 API、价格、输入输出、开源；
- 研究人员：关心发展历史、论文、公司团队；
- 投资/产业研究：关心公司、融资、市场格局。

这些信息可以存在，但不要主导首页。

---

# 3. 产品价值的四层结构

最终产品应形成四层：

## 第一层：Hook —— 让第一次用户停下来

首页首屏不是工具卡，而是一件视觉作品：

> **《AI 视频已经发展到了哪一步？》**

目标：
- 用户第一眼就理解产品是什么；
- 页面截图本身也有传播价值。

## 第二层：Explore —— 让用户愿意继续探索

核心内容：
- AI 视频模型地图；
- AI 视频能力演进；
- 公司 / 团队 / 模型关系；
- Skill / Workflow；
- 代表性 Demo。

## 第三层：Utility —— 让用户第二次回来

必须有实际查询价值：

- 搜索；
- Compare；
- 平台 × 模型关系；
- “这个能力去哪用”；
- 开源 Workflow；
- 官方入口；
- Skill / Capability 查询；
- 实现路径。

## 第四层：Freshness —— 让产品长期存在

- What Changed；
- Last Verified；
- Change + So What；
- 来源；
- Staleness；
- 用户纠错；
- Agent 持续监控。

---

# 4. 信息架构

第一阶段建议 5 个核心模块：

1. **AI 视频模型地图**
2. **AI 视频能力演进图**
3. **平台 × 模型关系表**
4. **Skill / Workflow 库**
5. **AI Research Toolkit / 重要资源导航**

后续再增加：

6. Search / Answer View  
7. Compare  
8. What Changed  
9. Entity Focus  
10. Visual Stories

---

# 5. 核心概念：不要把所有东西都叫“AI 工具”

必须先冻结 Ontology V0.1。

## 5.1 第一等实体类型

建议至少：

- `Company`
- `Team / Lab`
- `Model Family`
- `Model Version`
- `Platform`
- `Application`
- `Capability`
- `Skill / Effect`
- `Workflow`
- `Use Case`
- `Benchmark`
- `Open Source Project`
- `API Provider`
- `Research Paper`
- `Resource`

## 5.2 最重要的层级关系

特别要区分：

### Native Capability
模型原生能力。

例：
- Kling Motion Control；
- First / Last Frame；
- Character Reference。

### Platform Feature
平台封装的产品功能。

例：
- 某平台的 AI Dance；
- 某平台的 Product Ad；
- 某平台的 Cinematic Character Scene。

### Workflow
多个步骤 / 模型组合形成的流程。

例：
- ComfyUI Wan Animate Workflow；
- Image → Keyframe → I2V → Lip Sync。

### Skill / Effect
用户感知的“我要做什么”。

例：
- 让照片跳舞；
- 人物动作复刻；
- 商品巨大化；
- 角色进入动漫世界。

### Use Case
更高层的使用目的。

例：
- AI Dance；
- IP Character Animation；
- Product Advertising；
- Birthday Video。

## 5.3 推荐关系链

例如：

```text
用户需求
“让照片跳舞”
      ↓
Skill
AI Dance
      ↓
Implementation
Motion Control
      ↓
Model
Kling
```

另一个：

```text
Product Ad
   ↓
Skill: Giant Product
   ↓
Workflow: I2I Keyframe → I2V
   ↓
Model: Seedance / Kling
   ↓
Platform: Higgsfield / fal / 官方
```

这条抽象是整个数据库未来最重要的资产之一。

---

# 6. Capability Ontology V0.1

在 Agent 开始采集前先人工定义，不允许 Agent 随意创造同义标签。

## Generation

- Text-to-Video
- Image-to-Video
- Video-to-Video

## Reference

- Character Reference
- Image Reference
- Video Reference
- Audio Reference
- Multi-reference

## Control

- First Frame
- Last Frame
- First/Last Frame
- Motion Control
- Camera Control
- Pose Control

## Narrative

- Multi-shot
- Storyboard
- Video Extension

## Audio

- Native Audio
- Dialogue
- Music
- Lip Sync

## Editing

- Video Editing
- Object Edit
- Character Edit
- Style Transfer

如果 Agent 发现未知概念：

```text
candidate_new_capability
```

进入人工审核，而不是自动创建。

---

# 7. 前端表现原则

## 7.1 最高原则

> **不是“做好看”，而是“做好认知体验”。**

最终验收标准：

> 即使删掉大部分正文，只留下 Logo、节点、线、日期、图标和关键词，用户仍然能大致理解这张图在说什么。

## 7.2 视觉风格

建议：

**Editorial Tech**

方向：
- 科技杂志；
- 数据地图；
- Apple 式克制动画；
- 高信息密度但不压迫。

不要：
- 满屏 Cyberpunk；
- 霓虹光污染；
- 粒子背景；
- 卡片无意义漂浮；
- 所有元素一起动；
- 纯“AI 网站感”。

## 7.3 动画原则

任何动画上线前问：

> 去掉这个动画，用户会少理解什么？

如果答案是“不会，只是不够酷”，删掉。

只保留三类动画：

1. **Relationship Motion**
   - 用于解释 A 与 B 的关系。

2. **Temporal Motion**
   - 用于解释 2024 → 2026 的变化。

3. **Capability Demo**
   - 用于证明某能力实际能做什么。

---

# 8. 首页设计

首页不要像传统门户站堆很多模块。

## 8.1 第一屏

主题：

> **AI 视频走到了哪里？**

例如：

```text
               AI VIDEO — 2026

           生成             控制
            │                │
Text → Video ━━━━━━━
Image → Video ━━━━━━━
Character Ref ━━━━━━━━━━━━━━━
First/Last Frame ━━━━━━━━━━━━━
Motion Control ━━━━━━━━━━━━━━━
Multi-shot ━━━━━━━━━━━━━━━━━━━
Native Audio ━━━━━━━━━━━━━━━━━
Unified Editing ━━━━━━━━━◐
```

旁边只出现代表模型：

- Kling
- Seedance
- Veo
- Wan
- Hailuo
- Sora
- Runway

鼠标移动到 `Motion Control`：

- 其他内容降低透明度；
- 展示输入 → 输出；
- 代表模型亮起；
- 右侧展示 3~5 秒能力 Demo；
- 简短一句“它解决了什么”。

## 8.2 首页不要展示全部数据库

例如后台有 280 个模型：

首页主地图只展示 12~20 个代表性模型。

明确标记：

> Curated View / 代表性视图，并非完整列表。

提供：

> 查看全部模型 →

---

# 9. 三个核心可视化

## 9.1 AI 视频模型地图

目标：

> 回答“谁是谁家的、谁和谁有关系、能做什么”。

推荐布局：

```text
ByteDance
    ↓
Seed
    ↓
Seedance
   ↙     ↘
1.5      2.0
          ↓
  ┌───────┼────────┐
 I2V   Multi-ref   Audio
          ↓
     Dreamina / API
```

另一侧：

```text
Kuaishou
   ↓
Kling
   ↓
Kling 3.x
   ↓
Motion Control
First/Last Frame
Elements
...
```

### Focus Mode

点击一个实体后：
- 其他节点 opacity ≈ 0.05~0.1；
- 只保留一跳 / 两跳关系；
- 逐层展开：
  - 谁做的；
  - 能做什么；
  - 去哪用；
  - 有哪些 Skill。

避免知识图谱变成蜘蛛网。

### 技术建议

第一阶段：

- React Flow
- ELK 自动布局
- 重点节点允许人工固定位置

理由：
- 节点可以做成完整 React Component；
- 更适合产品化视觉；
- 数据量第一阶段很小。

后期几千节点再考虑：
- Cytoscape.js
- Sigma.js

## 9.2 AI 视频能力演进图

目标：

> 回答“AI 视频到底发展到哪一步了”。

不是排行榜，而是能力演进。

建议做成 Swimlane / 时间轴：

```text
               2023      2024      2025      2026

Generation
Text→Video     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Image→Video        ●━━━━━━━━━━━━━━━━━━━━━━━━━━

Control
First/Last              ●━━━━━━━━━━━━━━━━━━━━━
Character Ref              ●━━━━━━━━━━━━━━━━━━
Multi-ref                      ●━━━━━━━━━━━━━━━
Motion Control                    ●━━━━━━━━━━━━

Narrative
Multi-shot                      ●━━━━━━━━━━━━━━
Video Editing                        ●━━━━━━━━━━

Audio
Lip Sync                     ●━━━━━━━━━━━━━━━━━
Native Audio                          ●━━━━━━━━━
```

用户点击能力后：
- 解释“它解决了上一代什么问题”；
- 显示代表模型；
- 显示相关 Skill；
- 显示来源。

### 注意

每张 Visual View 最好有一个明确观点，不只是 topic。

例如不要只叫：

> AI 视频能力演进

更好的 Visual Story：

> **AI 视频这两年最大的进步，其实不是画质，而是控制能力。**

视觉内容用数据证明这个 Thesis。

### 技术

- React
- D3
- SVG

这里不建议用通用 graph 组件。

## 9.3 平台 × 模型关系表

目标：

> 回答“我去哪用”。

例：

| 平台 | Kling | Seedance | Veo | Wan | Hailuo |
|---|---|---|---|---|---|
| 官方 | ✓ | ✓ | ✓ | ✓ | ✓ |
| Higgsfield | ✓ | ✓ | ✓ | ? | ? |
| fal | ✓ | ✓ | ✓ | ✓ | ? |
| Replicate | ? | ✓ | ? | ✓ | ? |

但 `✓` 不能只是布尔值。

真实数据至少包含：

```text
Platform
Model Version
Access Type
Region
Plan
Status
Valid From
Valid To
Verified At
Source
```

点击格子：

```text
Seedance 2.0 @ fal

API：✓
Web：—
Region：Global
Plan：Paid
Status：Active
Last Verified：2026-xx-xx
Source：官方链接
```

### 技术

- TanStack Table

表格这里应该“克制、高效率”，不要追求炫。

---

# 10. Skill / Workflow 页面

Skill 必须是第一等公民。

示例：

# Motion Control

首屏：

```text
┌───────────────┐     ┌───────────────┐
│ 输入人物图     │  +  │ 参考动作视频   │
│    🧍          │     │      ▶        │
└───────────────┘     └───────────────┘

                   ↓

          ┌─────────────────┐
          │   结果视频 ▶    │
          └─────────────────┘
```

下面：

- Native implementation：
  - Kling
- Open-source implementation：
  - Wan / ComfyUI Workflow（如可核实）
- Platform feature：
  - AI Dance 等
- Related use cases：
  - AI Dance
  - Anime Character Animation
  - IP Character Motion
- 输入要求
- 限制
- 官方文档
- GitHub / Workflow
- Last Verified

---

# 11. 图片与视频的角色

原则：

> **图负责解释结构，视频负责证明能力。**

## 图片

大量使用：
- Logo；
- 架构图；
- Input → Output；
- 时间线；
- 版本树；
- 关系图；
- Before / After；
- 静态关键帧。

## 视频

只用于：
- Skill Demo；
- Capability Demo；
- 模型代表性能力；
- Visual Story 自动演绎。

不要：
- 首页同时播放大量视频；
- 自动下载 / 镜像别人全部 Demo。

## 视频交互

桌面：
- Hover 3~5 秒静音循环 Preview；
- 移走恢复关键帧。

移动端：
- 点击播放。

---

# 12. 移动端不是“桌面端缩小”

这是重要设计原则。

桌面适合完整关系图：

```text
ByteDance → Seed → Seedance → Capability → Platform
```

移动端应该改成 Narrative Stack：

```text
Seedance

ByteDance / Seed

能力
● I2V
● Multi-reference
● Native Audio

↓

在哪使用
Dreamina
Volcano Engine
...

↓

相关 Skill
...
```

每个 VisualView 必须考虑：

- Desktop View
- Mobile Narrative View

---

# 13. 搜索与 Answer View

不要停留在：

> 搜 Kling → Kling 页面。

用户应该能搜自然问题：

- 哪个视频模型支持动作控制？
- Seedance 在哪里用？
- 有哪些开源视频编辑模型？
- Kling 和 Wan 有哪些共同能力？
- 什么能让角色复刻参考动作？

结果可以生成一个小型 Visual Answer：

```text
       Motion Control
          │
 ┌────────┼────────┐
 Kling    Wan      ...
 原生      开源
```

再给：
- 来源；
- 链接；
- Last Verified。

第一阶段无需聊天机器人。

---

# 14. Compare Mode

用户选择两个模型：

```text
               Kling     Seedance

I2V              ●           ●
Character Ref    ●           ●
Motion Control   ●           ?
First/Last       ●           ●
Multi-ref        ●           ●
Native Audio     ●           ●
Open Weights     —           —
```

然后展开：
- 发布日期；
- 所属公司；
- API；
- 平台；
- Skill；
- 价格（如来源允许）；
- 来源；
- Last Verified。

Compare 是重要的“复访功能”。

---

# 15. What Changed

不要做普通 AI 新闻。

应该做：

> **Change + So What**

例：

```text
Aug xx

Kling 新增某能力

Before:
只能 A

After:
可以 B

为什么重要:
这使得 XXX 工作流不再需要 YYY

影响:
→ AI Dance
→ Character Animation
→ ...
```

目标：

> 不只告诉用户“发生了什么”，还帮助理解“意味着什么”。

---

# 16. 重要资源导航：AI Research Toolkit

不要做一排 Logo 的 hao123。

应该做“按任务导航”：

## 想知道哪个模型更强
→ Artificial Analysis

## 想查模型历史、训练规模与研究数据
→ Epoch AI

## 想找开源模型
→ Hugging Face

## 想直接调用模型 API
→ fal  
→ Replicate

## 想快速了解一个 AI 概念
→ AI Wiki

## 想找 AI 应用
→ Futurepedia

## 想找代码和 Workflow
→ GitHub  
→ Hugging Face  
→ ComfyUI 生态

核心：
> 导航 + 判断，而不是链接堆砌。

---

# 17. 视觉 View 与底层数据必须分离

不要让数据库结构直接决定页面。

新增：

```text
VisualView
```

示例字段：

```text
id
name
type
title
subtitle

included_entities[]
included_relations[]

layout
  x/y
  group
  order
  size
  emphasis

camera
  initial_position
  zoom
  focus_sequence

annotations[]
source_notes[]
updated_at
```

同一数据库可以生成：

- 2026 AI 视频主流格局；
- 中国 AI 视频模型；
- 人物控制能力图；
- 开源视频模型地图；
- AI 视频原生音频发展；
- AI 视频控制能力进化。

数据库负责事实；
VisualView 负责“怎么讲”。

---

# 18. Editorial Insight

数据不等于认知。

新增：

```text
EditorialInsight
```

示例：

```text
title:
2025–2026 最大变化不是画质，而是控制能力

related_entities:
Motion Control
Reference Video
Character Reference
Video Editing
```

前端表现为：

> 一个判断 + 一张图 + 证据

而不是一篇很长文章。

---

# 19. 分享机制

每个重要状态都应该有唯一 URL：

```text
/video/compare/kling-vs-seedance
/video/capability/motion-control
/video/model/seedance
/video/evolution?year=2026&focus=motion-control
```

每个页面可自动生成：

- 16:9 分享图；
- 1:1；
- 3:4；
- 9:16。

网站本身的知识图应该是可分享内容，而不是只能分享 URL。

---

# 20. SEO

从第一天设计，不要上线后补。

适合长尾：

- Kling Motion Control 是什么
- Seedance 在哪里用
- Kling vs Seedance
- AI 视频模型有哪些
- AI 视频动作控制
- 哪些模型支持首尾帧
- AI 视频原生音频模型
- AI 视频 Workflow
- Seedance API
- Kling API

每个：
- Entity
- Capability
- Skill
- Compare
- VisualView

都应有稳定 URL / title / description。

---

# 21. 后台核心原则：不要直接保存“真相”

第四轮方案的重要修正：

> 互联网原始信息不是直接变成 Fact，而是先保存“某来源声称了什么”。

建议结构：

```text
Source Snapshot
       ↓
     Claim
       ↓
 Evidence
       ↓
 Resolution
       ↓
Canonical Fact
```

原因：
- 不同来源可能使用不同名称；
- 平台可能宣传性表述；
- 官方页面可能后续修改；
- 同一个模型有不同 Provider Variant；
- AI 很容易“聪明过头”做错误推断。

---

# 22. 数据实体层建议

基础实体：

```text
Entity
Relation
Claim
Evidence
CanonicalFact
Source
SourceSnapshot
Media
Alias
Revision
ChangeEvent
Verification
VisualView
EditorialInsight
```

---

# 23. Entity 基础结构

```text
entity
────────────────────
id
type
canonical_name
slug
summary
logo
status
released_at

aliases[]
vendor_model_ids[]
provider_aliases[]

metadata JSONB

created_at
updated_at
```

---

# 24. Relation

```text
relation
────────────────────
id
source_entity_id
relation_type
target_entity_id

valid_from
valid_to

verified_at
source_id
```

示例：

```text
ByteDance Seed
    develops
Seedance

Seedance 2.0
    version_of
Seedance

Seedance 2.0
    supports
Image-to-Video

Seedance 2.0
    available_on
Dreamina

Motion Control
    implemented_by
Kling
```

---

# 25. Claim + Evidence

示例：

```text
Claim

subject:
Kling Video 3.x

predicate:
supports

object:
Motion Control

source:
Kling Official

evidence:
官方页面明确说明

observed_at:
2026-xx-xx
```

然后系统 / 人工产生：

```text
Canonical Fact

Kling Video 3.x
supports
Motion Control
```

---

# 26. 禁止过度推理

原则：

> **Explicit Evidence > AI Inference**

例如：

来源写：
> 某平台支持 Motion Control。

不能自动推导：
> 该平台使用 Kling。

如果无证据：

```text
Unknown
```

不要补全。

---

# 27. 数据质量评分

不要采用：

```text
LLM confidence = 0.93
```

这类看似科学的数字。

真正的数据可信度来自：

```text
Source Authority
+
Evidence Explicitness
+
Cross-source Agreement
+
Freshness
+
Human Verification
```

---

# 28. Source Registry

每个数据源都应登记：

```text
source_name
source_type
authority_level
official_or_third_party
update_method
api_available
rss_available
webhook_available
crawl_policy
license
redistribution_policy
refresh_interval
last_checked_at
```

---

# 29. 数据源等级

不是简单“S 永远对”，而是“对不同 Claim 类型选择正确来源”。

## S｜Primary
- 官方 Docs
- 官方 Blog
- 官方 API
- Paper
- 官方 GitHub

适合：
- Capability
- 发布时间
- API
- 模型版本
- 官方产品关系

## A｜Independent Data
- Epoch AI
- Artificial Analysis
- 高质量 Benchmark

适合：
- 独立 Benchmark
- 历史数据
- 研究型数据

## B｜Secondary
- 高质量媒体
- 采访
- AI Wiki

适合：
- Discovery
- 补充背景
- 寻找原始来源

## C｜Community
- Reddit
- X
- B站
- YouTube
- 博客

适合：
- 发现 Skill
- 发现 Workflow
- 社区玩法

一般不直接作为核心事实的唯一证据。

---

# 30. 第一批重点数据源

建议先建立 30~50 个 Source，不要让 Agent 漫游整个互联网。

重点：

## 官方模型 / 公司
- ByteDance Seed / Seedance
- Kling / Kuaishou
- Google DeepMind / Veo
- OpenAI / Sora
- Alibaba / Wan
- MiniMax / Hailuo
- Runway
- Luma
- Vidu
- Pika
- Higgsfield（平台 / 产品）

## 结构化研究
- Epoch AI

## Benchmark
- Artificial Analysis

## 开源
- Hugging Face
- GitHub

## API Provider
- fal
- Replicate

## 百科 / Discovery
- AI Wiki
- Futurepedia

## 论文
- arXiv

## Skill / Workflow
- Higgsfield Effects
- Pika
- Vidu Templates
- Picsart Effects
- CapCut Templates
- LibTV Skills
- MiniMax Hub Skills
- ComfyUI Community

---

# 31. 数据授权注意事项

## Epoch AI
可作为重要 Bootstrap 来源；其公开数据需按实际许可要求署名。

## Artificial Analysis
重点用于：
- 引用当前 Benchmark；
- 给用户跳转；
- 保存有限的、带时间的引用事实。

不要默认：
- 全量抓榜单；
- 复制成自己的 Benchmark 数据库；
- 对外重新分发。

实施前必须重新核验其当前授权条款。

## AI Wiki
建议作为：
- Discovery Source；
- 找实体；
- 找原始引用。

不要镜像文章库。

---

# 32. Agent 数据流水线

核心原则：

> **Agent 做研究员，不做主编。**

不要：

```text
给 Agent 浏览器
→ 自由搜索互联网
→ 自己判断
→ 自己改数据库
→ 自动发布
```

建议：

```text
Source Registry
      ↓
Scheduler
      ↓
Fetcher
      ↓
Snapshot
      ↓
Change Detector
      ↓
LLM Extractor
      ↓
Entity Resolver
      ↓
Claim Validator
      ↓
Conflict Detector
      ↓
Impact Analyzer
      ↓
Review Queue
      ↓
Publish
```

这是：

> **AI-assisted Knowledge ETL**

而不是“自动 Wiki Agent”。

---

# 33. Agent 与程序职责划分

| 环节 | 方式 |
|---|---|
| 定时检查 | 程序 |
| 拉取 API / 页面 | 程序 |
| 页面变化检测 | Hash / ETag / Diff |
| 发现新模型 / 新能力 | LLM |
| 提取结构化 Claim | LLM + Schema |
| Entity 去重 | 规则 + LLM |
| 判断冲突 | LLM + 规则 |
| 判断更新重要性 | LLM |
| 写“为什么重要” | LLM |
| 修改 Canonical Fact | 第一阶段人工 / 规则 |
| 发布前台 | 第一阶段人工批准 |

---

# 34. Diff-first

不要每天把所有页面重新丢给模型。

流程：

```text
GET / API
↓
ETag / Last-Modified / Content Hash
↓
无变化
结束

有变化
↓
DOM Diff
↓
提取 Changed Section
↓
LLM 只分析变化
```

优势：
- 低成本；
- 低噪音；
- 易于追踪；
- 未来可扩展到大量 Source。

---

# 35. 数据入口优先级

推荐：

> **API > RSS / Webhook > Sitemap > HTML > Search**

Search 的主要职责：
- Discovery

而不是：
- Evidence

例如：
- GitHub Releases API 适合版本监控；
- Hugging Face API / Webhook 适合 Repo 更新；
- 官方 API Catalog 适合模型可用性；
- 网页抓取只在没有结构化入口时使用。

---

# 36. Entity Resolution

这是未来数据库最容易坏掉的地方。

例如：

```text
Seedance 2
Seedance 2.0
Dreamina Seedance 2.0
Doubao-Seedance-2.0
seedance-2.0
```

可能相关，但不一定是完全同一部署 Variant。

因此至少需要：

```text
canonical_name
aliases[]
vendor_model_ids[]
family
version
provider_aliases[]
variant
```

LLM 可以输出：

```text
possible_same_entity = true
```

但第一阶段禁止自动 Merge。

---

# 37. Freshness / Staleness

不能只有一个 `verified_at`。

不同字段保鲜期不同。

示意：

| 数据 | 建议复核周期 |
|---|---:|
| API 价格 | 7~14 天 |
| 平台是否提供模型 | 14 天 |
| Capability | 30 天 |
| 模型版本 | 30 天 |
| 开源状态 | 60 天 |
| 公司归属 | 180 天 |

状态：

```text
Fresh
↓
Needs Review
↓
Stale
```

前端可显示：

> Verified 6 days ago

这将成为产品可信度的重要部分。

---

# 38. Change Event

不要覆盖旧数据，保留时间历史。

例如：

```text
Previous Claim:
Seedance API Status = Coming Soon

New Claim:
Seedance API Status = Available
```

生成：

```text
Change Event

Seedance API 正式开放

Before:
Coming Soon

After:
Available

Impact:
开发者现在可正式接入生产工作流

Source:
Official
```

这就是 What Changed 的结构化来源。

---

# 39. Inclusion Policy

必须限制 Agent 收集规模。

否则：
- 今天 20 个模型；
- 明天 100；
- 半年 3000 个 Variant；
- 最后变成维护灾难。

建议三个层级：

## Core
普通用户值得知道，进入主地图。

## Extended
有明显特色 / 产业意义，进入搜索与 Compare。

## Catalog
数据库存在，但不进入主要视觉。

例如：

```text
数据库：280 模型
主地图：15
重点 Compare：30
完整搜索：280
```

---

# 40. 数据库建议

第一阶段：

**PostgreSQL**

暂时不要 Neo4j。

原因：
- 数据量小；
- 大量事实本质是关系数据；
- Postgres 够用；
- 避免两套数据库同步与复杂查询系统。

后续真的需要复杂图分析再引入图数据库。

---

# 41. 搜索技术

## 第一阶段
PostgreSQL Full Text Search

## 第二阶段
Meilisearch

用于：
- typo tolerance；
- 别名；
- facet；
- 快速检索。

## 第三阶段
pgvector

用于：
- 语义查找；
- 类似能力；
- “找和 Motion Control 类似的东西”。

不要第一版就做 RAG。

---

# 42. CMS / 管理后台

不要自己造 CRUD。

可选：

## Payload CMS
适合：
- Next.js 同栈；
- 内建 Admin；
- relationship；
- version / draft。

## Directus
适合：
- 数据库独立；
- SQL-first；
- 快速 Data Studio。

建议：

如果独立新项目：
> Next.js + PostgreSQL + Payload

如果挂在现有后端：
> 现有后端 + PostgreSQL + Directus

---

# 43. 前端技术建议

```text
Next.js
React
Tailwind / Design System

模型关系地图：
React Flow + ELK

能力演进：
D3 + SVG

平台矩阵：
TanStack Table

Skill：
React Card + Native Video / HLS
Lazy Load + Hover Preview

动画：
Motion

媒体：
S3 / R2
```

后期：
- Cytoscape / Sigma：大规模图；
- React Flow：Workflow 展示器 / 编辑器；
- Remotion：自动生成科普视频。

---

# 44. 内容与视频生产闭环

数据库结构天然可以变成视频脚本。

例如：

```text
VisualView
+
EditorialInsight
+
Entity
+
Relation
+
Media
```

生成：

> 《30 秒看懂 Kling》

或者：

> 《AI 视频 2023 → 2026 发生了什么》

甚至：

> 《为什么 2026 AI 视频最大的变化不是画质，而是控制》

内容链：

```text
研究 AI
   ↓
录入知识库
   ↓
生成能力地图
   ↓
生成图 / 视频
   ↓
抖音 / B站 / 小红书
   ↓
用户回网站查
```

网站和内容生产形成闭环。

---

# 45. 媒体版权原则

Skill / Capability 页需要视频，但要谨慎。

优先：
- 官方 Embed；
- 官方页面链接；
- 官方 YouTube；
- GitHub / Hugging Face Demo。

不要默认：
- 下载别人视频重新托管；
- 镜像商业平台 Demo。

自己的：
- 知识图；
- Input → Output 图；
- 动画解释；
- Remotion 讲解视频；

全部自制。

---

# 46. 开放贡献机制

未来一个人维护整个 AI 世界会困难。

不要直接开放 Wiki 编辑。

建议：

## Suggest Correction

用户提交：
- 哪里错了；
- 新来源 URL；
- 一句说明。

进入 Draft / Review Queue。

厂商也可以：
- Submit official update；
- Claim page（后期）。

所有外部提交都需要审核。

---

# 47. 护城河

漂亮前端会被复制；
模型列表会被复制；
AI 链接导航也会被复制。

真正的长期资产可能是：

## 1. Ontology
你如何区分：
- Model
- Capability
- Skill
- Workflow
- Platform Feature

以及它们如何连接。

## 2. Temporal Knowledge
不仅知道现在，还知道：
- 什么时候变化；
- 原来是什么；
- 现在是什么。

## 3. Editorial Views
同样的数据，你持续做出：
- 为什么重要；
- 这一代解决了上一代什么问题；
- 今年真正变化的是什么。

## 4. Knowledge Supply Chain
自动把混乱的 AI 世界转成：
- Source
- Claim
- Evidence
- Canonical Fact

这套数据流水线可能比前端本身更有长期价值。

---

# 48. 开发顺序：不要先做“大系统”

经过多轮审查后的推荐顺序：

## Phase 0：视觉原型

完全用手工 JSON。

做两张真正优秀的视觉作品：

1. **《AI 视频现在已经发展到哪一步？》**
2. **《Kling / Seedance 到底是什么关系？》**

目标：

> 页面截图 / 录屏单独发出去，本身就有传播力。

如果不好看、看不懂：
- 先改视觉；
- 不进入数据库开发。

## Phase 1：数据管线原型

只研究：

- Kling
- Seedance

跑通：

```text
Source Registry
→ Fetch
→ Snapshot
→ Diff
→ LLM Extract
→ Claim
→ Evidence
→ Review
→ Canonical Fact
```

目标：
- 验证 Agent 是否真的能降低维护成本；
- 找出 Entity Resolution / Capability 分类问题。

## Phase 2：连接前端与数据

替换手工 JSON。

增加：

- Entity Focus；
- Search；
- Source；
- Last Verified。

## Phase 3：实用功能

增加：

- Compare；
- Platform × Model；
- What Changed；
- Skill / Workflow；
- Mobile Narrative View。

## Phase 4：扩充数据

再扩展到核心模型：

- Veo
- Wan
- Hailuo
- Sora
- Runway
- Luma
- Vidu
- Pika
- Higgsfield 等

不要一开始全部抓。

---

# 49. MVP 内容规模

第一版建议：

- 8 家核心公司 / 团队
- 12 个视频模型家族
- 20 个重要版本
- 15 个核心 Capability
- 10 个平台
- 20 个 Skill / Workflow
- 约 100~300 个经过证据链验证的 Claim

不要追求 1000 个条目。

---

# 50. 验证标准

产品不能只看“用户觉得漂亮”。

最关键三个信号：

## 1. 用户会不会继续探索
是否点击第二个、第三个页面。

## 2. Utility 是否被使用
- Search
- Compare
- 去哪用
- Skill
- 官方入口

是否真的有人点。

## 3. 是否形成传播
- VisualView 被保存；
- 比较图被分享；
- 从视频回到网站；
- 搜索引擎进入。

---

# 51. 4~6 周否决标准

不要因为数据库越来越大产生沉没成本。

如果上线后用户反馈主要是：

> “网站挺漂亮。”

但：
- 不搜索；
- 不 Compare；
- 不查来源；
- 不回来；
- 不分享；

说明产品仍然是“展览”。

真正成立的信号：

> “以后我想查 AI 视频，就来这里。”

---

# 52. 五个核心产品原则

最终建议固定成下面五条，后续其他模型讨论时不要轻易推翻。

## 原则一

> **不是最全，而是最重要。**

后台可以多，前台永远克制。

## 原则二

> **不是知识图谱，而是认知地图。**

Graph 只是表现方式之一。

## 原则三

> **Agent 做研究员，人做主编。**

第一阶段禁止 Agent 自动修改关键 Canonical Fact 并直接发布。

## 原则四

> **事实必须可追溯。**

每条重要关系都有：
- 来源；
- Evidence；
- Last Verified；
- 时间有效性。

## 原则五

> **前端的任务不是炫技，而是让用户突然看懂。**

---

# 53. 最终系统架构概览

```text
                  AI VIDEO ATLAS
                        │
──────────────── FRONTEND ────────────────
                        │
       ┌────────────────┼────────────────┐
       │                │                │
    Visual           Utility         Freshness
    Story            Search          What Changed
    Atlas            Compare         So What
    Evolution        Where to Use    Verified
    Skill Demo       Answer View     Staleness
       │                │                │
──────────────── PRESENTATION ────────────
                        │
               VisualView
               EditorialInsight
               Annotation
               Media
                        │
──────────────── KNOWLEDGE ───────────────
                        │
        Entity — Relation — Capability
                        │
                 Canonical Fact
                        │
──────────────── RESEARCH ────────────────
                        │
                 Claim + Evidence
                        │
                 Source Snapshot
                        │
──────────────── INGESTION ───────────────
                        │
 API / RSS / Webhook / GitHub / HF / Web / Search
                        │
              AI-assisted ETL Pipeline
```

---

# 54. 推荐第一轮实现任务

如果另一个大模型接手开发，请优先完成下面这些，而不是继续重新发散方案。

## Task A｜冻结 Ontology V0.1

输出：
- Entity Types
- Relation Types
- Capability Tree
- Skill / Workflow / Feature 区分规则

## Task B｜做 Visual Prototype

只用假数据完成：
- AI 视频能力演进
- Kling / Seedance 关系图

要求：
- Desktop
- Mobile
- Focus Mode
- 视觉风格

## Task C｜设计数据库 Schema

至少：
- Entity
- Alias
- Relation
- Source
- Snapshot
- Claim
- Evidence
- CanonicalFact
- Verification
- ChangeEvent
- VisualView
- EditorialInsight

## Task D｜Agent ETL 原型

选择：
- Seedance 官方
- Kling 官方

跑通：
- Fetch
- Diff
- Structured Extract
- Entity Resolution Candidate
- Claim
- Evidence
- Review

## Task E｜正式前端 P0

必须有：
- 首页 Visual Story
- Search
- Entity Focus
- Source / Last Verified
- Compare 两模型

---

# 55. 后续可以扩展，但当前不要做

暂缓：

- 全 AI 百科；
- AI Image；
- AI Audio；
- AI Agent；
- Robotics；
- Neo4j；
- 全量 RAG；
- 自动写长文章；
- 社区开放编辑；
- 大规模 Benchmark 抓取；
- 自己测试全部模型；
- 1000+ Skill 收录；
- 自建 AI 视频生成平台。

第一阶段必须守住：

> **AI Video Atlas。**

---

# 56. 参考信息源（实施时需重新核验）

以下资源是讨论阶段的重要参考，正式抓取、引用、授权前需重新检查最新状态与许可：

- AI Wiki  
  https://aiwiki.ai/

- Artificial Analysis  
  https://artificialanalysis.ai/

- Epoch AI  
  https://epoch.ai/

- Hugging Face  
  https://huggingface.co/

- Futurepedia  
  https://www.futurepedia.io/

- fal  
  https://fal.ai/

- Replicate  
  https://replicate.com/

- GitHub  
  https://github.com/

- arXiv  
  https://arxiv.org/

- Kling AI  
  https://klingai.com/  
  （实际官方文档入口实施时再核验）

- ByteDance Seed  
  https://seed.bytedance.com/

- Higgsfield  
  https://higgsfield.ai/

- Pika  
  https://pika.art/

- Vidu  
  https://www.vidu.com/

- Picsart  
  https://picsart.com/

- CapCut  
  https://www.capcut.com/

---

# 57. 给后续大模型的工作要求

后续继续讨论 / 开发时，请遵守：

1. 不要因为看到“知识图谱”就自动推荐 Neo4j。
2. 不要把产品重新定义成“大而全 AI 百科”。
3. 不要把所有能力都混成 `supports_x = true`。
4. 必须区分：
   - Native Capability
   - Platform Feature
   - Workflow
   - Skill / Effect
   - Use Case
5. 不要让 Agent 直接当“真相生成器”。
6. 必须保留 Source → Claim → Evidence → Canonical Fact。
7. 不要为了视觉炫酷堆无意义动效。
8. 移动端不能只是桌面端缩小。
9. 数据更新必须设计 Freshness / Staleness。
10. 所有重要可视化要回答一个 Question 或 Thesis。
11. 优先验证“是否让用户看懂”和“是否值得回来”，不是条目数量。
12. 新建议应优先指出现方案的具体问题，再说明为什么值得修改，避免无边界扩张。

---

# 58. 最终一句话

> **AI Video Atlas 不是一个“收集所有 AI 视频资料”的网站，而是一套持续更新、带证据链的 AI 视频认知系统：Agent 帮助追踪世界，人负责判断什么重要，数据库保存事实与时间，前端把复杂关系变成用户一眼能懂、用完还会回来的知识地图。**

---

# 59. 修订记录 V1.1（2026-08-07）

> **本章效力高于前文。** 前 58 节写于产品定义阶段，本章是与项目负责人（一人项目）
> 对齐后的方向决定与配套修正。凡有冲突，以本章为准；被覆盖的条目在 §59.7 列表标出。
>
> 本章要解决的，不是"方案设计得好不好"（前 58 节质量是够的），
> 而是前 58 节完全没有回答的三个问题：
> **谁来维护、给谁看、维护得起吗。**

## 59.0 三个已锁定的决定

| # | 决定 | 覆盖 |
|---|---|---|
| 一 | **保留模型关系图，但把中心从"公司/版本树"换成"模型 ↔ 能力"** | §9.1 |
| 二 | **做中文站，并入 xiamimate.com；有余力再双语** | §20 语言未定、§45 媒体策略 |
| 三 | **引入 Agent 自主判断，人力上限每周 3 小时；宁可不那么精准** | §33、§48 Phase 1、§57.5 |

这三条不是偏好，是**约束**。后续任何方案如果导致人力超过每周 3 小时，
或导致受众漂移到英文世界，或让关系图退化成组织架构图，都应被否决。

---

## 59.1 决定一：关系图必须留，但原来的画法是错的

### 项目负责人的原话

> "砍掉模型关系图这不好。需要的是直观展示一个结果。不仅是模型，还有模型与模型之间的关系，
> 它可能描述的是 Kling 是谁家的，但也有 Kling 通过视频模型这条线关联了 Seedance 等等。
> 我们要做的就是能力地图，没有了关系图，就去掉了最重要的锚点。"

**这个判断是对的，前面建议砍图的意见撤回。** 但撤回的过程暴露了一个真问题：

### §9.1 画的其实不是能力地图

回看 §9.1 的示意图：

```text
ByteDance → Seed → Seedance → 1.5 / 2.0 → I2V / Multi-ref / Audio
```

这是一棵**公司 / 版本树**。它能回答"Kling 是谁家的"，
但**回答不了"Kling 和 Seedance 什么关系"** —— 因为这两棵树根本不连通，
它们分属两个厂商，在组织维度上永远是两个孤岛。

而负责人要的正是那条连线：**Kling 和 Seedance 通过「共有能力」相连。**

所以问题不在于要不要图，在于**图的中心放什么**。

### 修正：能力做枢纽节点，图是「模型 ↔ 能力」二部图

```text
      模型                能力(按出现年份纵向排序)              模型

    Kling 3.x ──────────┬── Text-to-Video ──────────────── Seedance 2.0
                        │
              ┌─────────┼── Image-to-Video ───────────────┤
              │         │
              └─────────┼── First/Last Frame ─────────────┤
                        │
                        ├── Character Reference ──────────┤
                        │
                        ├── Motion Control ─────────────── ？(未公示)
                        │
                        └── Native Audio ─────────────────┤
```

规则：

- **`Capability` 是第一等节点**，不是模型的属性标签。这是整张图的枢纽。
- **`Company` / `Team` 降级为模型节点上的徽标**，不再占一个节点。
  "谁家的"是一行字，不值得一个节点和一条边。
- **版本树（1.5 / 2.0）不进主图**，收进实体详情页的内嵌小视图。
  版本关系是纵深，主图要的是横向对比。
- **`Platform` 不进主图**，它属于 §9.3 的矩阵。主图只回答"能做什么"，
  矩阵回答"去哪用"。两张视图不要互相入侵。

### 一个白赚的结构性好处：三个功能坍缩成一个组件

改成二部图之后：

- **选中一个能力节点** → 高亮所有实现它的模型 = §8.1 首页 hover 交互 + "这个能力去哪用"；
- **选中两个模型节点** → 高亮共有能力 / 各自独有能力 = **§14 Compare Mode，不必单独做页面**；
- **能力列按出现年份纵向排序** → 和 §9.2 能力演进图**共用同一根时间脊柱**，
  两张图不再是两套数据、两套布局，是同一份关系的两种投影。

原方案里 §9.1 图 + §9.2 演进 + §9.3 矩阵 + §14 Compare 是四个独立工程；
换中心之后是**一个数据结构 + 三种视图**。这抵掉了保留关系图的工程量，还有富余。

### 布局技术修正

- 仍用 **React Flow + ELK**，但布局模式定为 **layered（分层）**，不是 force。
  二部图天然分层，力导向只会得到一团毛线（正是 §9.1 自己警告的"蜘蛛网"）。
- **能力列的顺序人工固定**（按年份），不交给自动布局。这是全图唯一需要人工调位的地方。
- Focus Mode 保留 §9.1 的写法（其他节点 opacity 0.05~0.1），但**焦点默认落在能力上**，
  不是落在公司上。

### 一个必须提前想清楚的边界

二部图有一个失效模式：**当某个能力被所有模型支持时，它会变成一个连了 20 条边的超级节点**，
视觉上毫无信息量（例如 Text-to-Video）。

处理办法：**能力节点带"普及度"状态** —— `前沿 / 主流 / 已普及`。
"已普及"的能力默认折叠成一行灰色横条，不画边。

这同时也是 §18 EditorialInsight 的自动素材：
**一个能力从"前沿"走到"已普及"的那一刻，就是一条值得写的变化。**

---

## 59.2 决定二：中文站，并入 xiamimate.com

### 项目负责人的原话

> "中文源、英文站 —— 这一点我也不是很赞同，我是打算合并到虾米伙伴 xiamimate.com 这个网站下的。
> 而且不仅外网上有人问，我自己不知道，内部很多人也不知道的。
> 如果有能力做成双语，没能力就还是中文。"

### 诚实记账：这个选择放弃了什么

前一轮建议"中文源 → 英文站"的理由是：AI 视频第一梯队大半是中国模型
（Kling / Seedance / Hailuo / Wan / Vidu），它们的能力更新走公众号、官方群、B 站，
英文世界只能看到 fal / Replicate 上的一行 model card。
**能读中文源，就是一道竞品雇不到人就翻不过去的墙。**

选中文站，等于**放弃这道墙**。中文世界里，读中文源不是优势，是起点。

但换回来的是三样更要紧的东西：

1. **一个够得着的受众。** 这条和项目自身的历史结论一致：**真瓶颈是分发不是产品**
   （见 `videolab-consumer-vs-seller`）。英文站的墙再高，如果没有 X / Reddit 的分发能力，
   墙内是空的。中文站的受众"内部很多人也不知道"—— 这是负责人**能直接触达**的人。
2. **已有的域名、备案、账号体系、后台。** 不必再建一套。
3. **和 video-lab 的内部协同**（见 §59.4.f）。

**这是一次用护城河换分发的交易，是划算的，但必须是睁着眼做的。**
记在这里，是为了半年后不要忘了它曾是一个选择。

### 留一扇门：实体名不翻译，只有编辑层是多语言

"有能力就双语"要成立，**取决于现在的 schema 怎么设计**，不取决于将来的决心。

规则（现在就锁进 §23 Entity 结构）：

- **实体名一律保留英文原名，不译**：`Kling`、`Seedance`、`Motion Control`、`First/Last Frame`。
  从业者本来就这么说话，硬翻成"运动控制"反而增加认知成本，还破坏搜索匹配。
  → 结论：**实体层是语言中立的，天然双语。**
- **只有编辑层需要多语言**，且只有三个字段：
  ```text
  summary_i18n     { zh, en }
  insight_i18n     { zh, en }   -- §18 EditorialInsight
  so_what_i18n     { zh, en }   -- §15 What Changed
  ```
  其余（关系、来源、日期、能力标签、平台矩阵）**没有语言**。

这样"加个英文站"的成本 = 翻译几百条编辑文案，
而不是 = 重做一遍数据库。**现在多写三个字段，将来省一个季度。**

（对应修正 §23：`summary` 改为 `summary_i18n JSONB`。第一版只填 `zh`。）

### 落位：子路径（2026-08-07 修订：原建议子域，被推翻）

定为 **`xiamimate.com/atlas`**。

原稿建议子域（`atlas.xiamimate.com`），理由是话题域不同、便于将来分拆。
**项目负责人推翻了这条**：先前各仓一律走路由线路，为一个还没验证的产品线
新开一套子域的部署与证书，是拿运维成本换一个还不存在的将来。

保留原论证里仍然成立的一半：子路径继承域名权重这条好处，在主域权重本来
接近零时**并不成立** —— 也就是说两种选法在 SEO 上没有实质差别，
那就该按运维成本选，而运维成本明显是路由更低。

将来真要分拆或单出英文版，再迁子域也不迟；实体层是语言中立的（见上），
迁移代价只有 URL。

### 大陆托管带来的一条硬约束（原 §45 需修正）

按既有部署决定（`deployment-region-decision`：守大陆单点），站点在大陆。
于是 §45"优先用官方 Embed / 官方 YouTube"**在这里基本不可用** ——
海外 embed 在大陆要么慢，要么不通。

修正后的媒体策略：

| 优先级 | 形式 | 说明 |
|---|---|---|
| 1 | **自制静态图**（Input → Output 关系图、能力示意、时间线） | 主力。可控、可缓存、无版权风险、无网络风险 |
| 2 | **自制短演示**（自己跑一次模型录屏，见 §59.4.d 实测层） | 有版权、有说服力、也是护城河 |
| 3 | **官方页面外链**（不 embed） | 点了跳出去，通不通是对方的事 |
| 4 | 官方 Embed | 仅当来源在大陆可达（B 站、国内官网）时使用 |

**不要下载别人的 Demo 重新托管** —— 原 §45 这一条继续有效，
而且大陆托管让侵权后果更直接。

---

## 59.3 决定三：Agent 自主 + 人力硬上限每周 3 小时

### 项目负责人的原话

> "每周几个小时可以接受，但再多我会疯的！我不可能把自己绑在这件事上。
> 我宁愿让它没那么精准，引入 Agent 自身判断。"

### 这条直接推翻了原 §33

原 §33 的分工表里有两行：

```text
修改 Canonical Fact  →  第一阶段人工 / 规则
发布前台            →  第一阶段人工批准
```

这两行意味着：**人的工作量正比于数据库规模**。
100 条 claim 时每周半小时，1000 条时每周五小时，3000 条时这个项目就死了 ——
而 §39 Inclusion Policy 明说数据库要往 280 个模型走。

**原方案在设计上就注定会把维护者压垮，只是把爆炸时间推迟到了半年后。**

### 核心修正：让人的工作量与数据库规模解耦

唯一的办法是**分层**，把事实分成两类，人只碰其中一类：

| 层 | 内容 | 谁负责 | 规模增长 | 错了怎么办 |
|---|---|---|---|---|
| **转述层**<br/>"官方声称" | 官方文档 / changelog / API catalog 里明确写了的 | **Agent 全权，自动发布** | 快，正比于世界的变化 | 错了是转述错，**注明来源即可自证**，改一行就完事 |
| **核验层**<br/>"我们实测" | 自己花钱跑一次得出的结论（见 §59.4.d） | **人**（也只有人能花钱） | 慢，一周加两三条 | 错了才是真丢人，所以人只管这层 |

关键点：**转述层的责任在来源，不在我们。**
只要前台老老实实写着「来源：Kling 官方文档，2026-08-05 抓取」，
即使官方自己写错了，我们也没有说谎 —— 我们只是**准确地转述了一个不准确的来源**。
这正是原 §21「不要直接保存真相，先保存某来源声称了什么」的架构在这里兑现的红利：
**因为一开始就没把 claim 当真相，所以现在才敢放手让 Agent 写。**

人的工作量因此挂在核验层上，而核验层是慢变量。**这就是解耦。**

### 三色通道：Agent 自主的具体分级

不是"全自动"也不是"全人工"，按 `字段风险 × 来源等级` 分三档：

| 通道 | 条件 | 处理 | 例子 |
|---|---|---|---|
| 🟢 **绿** | 低风险字段 + S 级来源 + 显式证据 | **Agent 直接发布，人不看** | 官方 changelog 出现新版本号；GitHub 新 release tag；官方 API catalog 增删模型；价格从官方 API 拉取 |
| 🟡 **黄** | 中风险 + 有明确来源 | **Agent 发布，前台标「机器录入 · 未经人工核验」**，同时进周报待办 | 新增一条 capability；某平台上架某模型；能力普及度状态变化 |
| 🔴 **红** | 高风险 / 不可逆 / 需要推断 | **必须人工，Agent 只能提 candidate** | Entity 合并与拆分；删除任何实体；公司归属变更；"这个平台底层用的是谁"这类推断 |

红色三类的共同点：**错了会污染整张图，且难以回滚。**
其余的错误都是局部的、可改的、有来源可指的。

### 一条负反馈，防止黄色队列悄悄膨胀

光分级不够 —— 黄色条目会随数据库变大而变多，人力又被吃回去。所以：

> **系统指标：人每周需要看的条目数 ≤ 20。**
> 连续两周超过 20，系统**自动收紧**：把最吵的那类黄色规则降为绿色（放手），
> 或提高触发阈值（只报重要变化）。

这条要写进系统，不是写进自觉。**精准度是这里主动交易掉的变量** ——
负责人已经明确同意这笔交易，所以系统有权替他做这个降级。

### 放弃精准之后，必须补上的四件事

既然接受"没那么精准"，可信度就得靠别的东西撑住。这四条从"加分项"升级为**必需品**：

1. **每条事实前台必须显示来源 + Verified 日期 + 一键报错。**
   读者没有同意接受不精准，只有我们同意了。透明是代价。
2. **必须显式区分「机器录入」和「人工核验」。**
   前台给出可见标记。这不是示弱，是**产品的诚实度本身成为一个特征**
   —— 没有任何一个 AI 工具站敢标这个。
3. **Agent 的每次写入必须可回滚。**
   写入是一次带作者标记的 revision / commit，不是 in-place update。
   人一周扫一次时能一键 revert 一批。
4. **只降级，不猜。** 原 §26「Explicit Evidence > AI Inference」**继续有效，不放宽。**
   放开的是"要不要人批准"，不是"能不能瞎编"。
   Agent 拿不准 → 标 `Unknown` / `Stale`，永远不补全。

### 每周三小时怎么花（这是预算，不是建议）

| 占比 | 事情 | 说明 |
|---|---|---|
| ~60% | **写周报**（§59.4.a） | 这是分发，是这个项目唯一的增长动作，不是运维 |
| ~30% | **扫黄色队列**（≤20 条） | 只处理"看着不对"的，看着对的一律放过 |
| ~10% | **实测一两条**（§59.4.d） | 挑最有争议的那条，花几块钱跑一次 |

注意：**60% 花在写作上，不是花在数据上。**
如果某一周变成了 80% 在修数据，说明绿色通道太窄，该放手了。

---

## 59.4 其余修订

### a. What Changed 从 Phase 3 提到 Phase 0，而且**先做成周报，网站后建**

原 §48 把 What Changed 排在 Phase 3。这是排错了，三个理由叠加：

1. **复访只可能来自新鲜度。** Compare 是一次性需求，地图看一遍就够了，
   只有"这周变了什么"能让人回来。把唯一的复访引擎排在最后，等于前三个 Phase 都在做一次性内容。
2. **它是分发的原料。** §44 的内容闭环没有起点 —— 周报就是起点。
3. **它最便宜。** 是一个列表，不需要可视化，不需要图数据库。
4. **它同时是负责人每周的主要工作**（§59.3 的 60%），所以它必须先存在。

具体动作：**先写六周周报，再决定要不要建站。**

- 形式：`本周 AI 视频变了什么 + 为什么重要`，按 §15 的 Change + So What 结构；
- 周报的副产品就是数据库内容 —— 每条变更天然带 before / after / source / date，
  正是 §38 ChangeEvent 的结构，**写周报就是在录入数据**；
- **如果六周写不下去，这个项目本来也不成立。**
  这个测试花六周就知道答案；先建站那个版本要花三个月才知道同一件事。

### b. Phase 0 的验收标准不可执行，换掉

原 §48 Phase 0 写"如果不好看、看不懂，先改视觉"。**谁判断？**
作者永远觉得自己的图看得懂，因为脑子里已经有那套模型了。

换成一个外部测试：

> 把能力演进图做成**一张静态图**，发出去（小红书 / 即刻 / 微信群 / X）。
> 看有没有人问"这图哪来的"。

一天，测的是整个 Hook 假设。比做两周交互原型再自我评估靠谱得多。

### c. Phase 0~1 不上 Postgres / Payload，数据放 git 里的 JSON

100~300 条 claim（§49 自己定的规模），**用不着数据库**。

而且 §22 那 13 张表里，**git 免费送三张**：

| 表 | git 里对应什么 |
|---|---|
| `Revision` | commit |
| `ChangeEvent` | diff |
| `SourceSnapshot` | 把抓到的原文一起 commit |

外加：审核队列 = PR，回滚 = revert，作者标记 = commit author
（正好用来区分 §59.3 的「机器录入」和「人工核验」）。

**Agent 的写入变成"提一个 PR"，这比任何自建审核后台都省事。**

等黄色队列真的疼了、或者需要全文检索了，再上 Postgres。
现在上 Payload，会花两周配 CMS —— 那两周本该用来写前六期周报。

（对应修正 §42：CMS 选型推迟到 Phase 2。）

### d. 把"自己测试模型"从 §55 排除项里**部分收回**

原 §55 把"自己测试全部模型"列为暂缓。**关键词是"全部"，这条应该改成分级。**

理由：官方文档并不是 capability 的可靠来源。
"支不支持首尾帧 / 多参考图 / 原生音频"这类问题，官方页面常常语焉不详，
**只有跑一次才知道**。

要区分两件事：

| | 做不做 | 说明 |
|---|---|---|
| **Benchmark**（画质、一致性打分） | ❌ 不做 | 贵、主观、Artificial Analysis 已经占了 |
| **Capability 核验**（这个功能到底能不能用） | ✅ 做 | 一次几块钱，答案是二值的，不需要主观判断 |

一条核验事实长这样：

```text
Seedance 2.0 @ fal · First/Last Frame
状态：✅ 实测可用
测试时间：2026-08-07
测试方式：首帧 + 尾帧各一张，10s，默认参数
产出：（自制录屏，可直接当 Skill 页的 Demo，无版权问题）
```

这条**比任何官方引用都硬，而且竞品抄不走** —— 他们得自己花钱跑一遍。
这也正是 §47 缺的那条真护城河：前面列的 Ontology / 时间维度 / 编辑观点 / 数据流水线，
四条都是"谁认真做都能做出来"的。**实测不是。**

而且负责人本来就是已经有一堆 key、真跑过 Kling / 即梦 / 百炼 / MiniMax 的那个人。
**这个能力已经在手上了，只是之前没算成资产。**

顺带解决 §59.2 的媒体问题：自制录屏没有版权风险，也不怕大陆访问不了。

### e. 把「不透明」做成一等数据：平台透明度评级

§5.2 里最有价值的区分是 **Native Capability vs Platform Feature**
—— 而这恰恰是**公开信息里查不到的**。Higgsfield 的 AI Dance 底下是不是 Kling，
他们不会说。按 §26 只能标 `Unknown`，于是最值钱那一列大面积空白。

反过来用：

> **把"这家平台公不公示底层模型"本身做成一个可见字段。**
>
> - 🟢 明确公示（fal / Replicate：model card 写得清清楚楚）
> - 🟡 部分公示
> - 🔴 只字不提

这是一个真实存在、有人关心、没人做的编辑角度，**完全合规**（我们只陈述"他们没说"），
而且**不需要精准** —— 正好匹配 §59.3 放弃精准的前提。

`Unknown` 从此不是数据缺口，是数据本身。

### f. 变现：诚实地承认现在没有，并据此改否决标准

原文 58 节没有一节谈钱。诚实的结论是：**这个产品短期内没有直接变现路径。**

- 联盟链接（fal / Replicate / Higgsfield 有 referral）在英文站成立，
  **中文站基本不成立** —— 国内用户到不了、也不走这些入口。§59.2 的选择顺带砍掉了这条。
- 订阅：没人为一个 wiki 付费。
- 卖数据：买方是投研，市场太小，且要求的精度远高于 §59.3 愿意提供的。

所以**明确定位为引流 / 影响力资产**，而不是收入项目。它唯一现实的商业价值是：

```text
Atlas（知道该用什么）  →  video-lab（真的做出来）
```

这两者受众重合，且 video-lab 已经存在（配方库、实验记录、素材库）。
**Atlas 是 video-lab 缺的那个入口** ——
video-lab 之前的问题正是"东西做好了但没人知道要用它"。

据此修正 §51 的否决标准。原来的否决线是"用户只说好看但不回来"，
那是产品问题。真正该问的是：

> **六周后，有没有拿到一条不依赖每周手动发帖的流量来源？**
> （自然搜索、被转载、别人主动引用、从 Atlas 走到 video-lab 的点击）

如果六周后所有流量都还是自己发出来的，那这就是一份周报，不是一个产品 ——
**周报本身可能仍然值得写，但不该再往里投工程。**

### g. 动手前的半天：确认这个位置没被占

原文 58 节没有一节做竞品存在性检查。开工前先花半天看：

- `aimodels.fyi`、`llm-stats`、Artificial Analysis 的 video arena
- **fal / Replicate 自己的 model catalog** —— 它们已经部分回答了"去哪用"
- Higgsfield 自己的站点已经列了它托管哪些模型
- 中文侧：量子位 / 机器之心 / 各类 AI 周报是否已经在做 §59.4.a 那件事

**要确认的不是"有没有人做 AI 视频信息站"（一定有），而是：
有没有人做「跨平台 + 带时间 + 带证据 + 有实测」的那个交集。**
如果有，看它更新频率 —— 大概率是断更的，那反而是好消息。

---

## 59.5 修订后的第一周（不是三个月）

| 天 | 做什么 | 产出 |
|---|---|---|
| 0.5 | §59.4.g 竞品核查 | 一段结论，写进本文档 |
| 1 | 画一张能力演进图（手工 JSON，静态，中文） | 一张 PNG |
| 0.5 | 发出去（§59.4.b） | 看有没有人问"这图哪来的" |
| 2 | 写第一期周报（§59.4.a） | 一篇 + 一份 `changes.json` |
| 1 | 搭二部图原型（§59.1，React Flow + ELK layered，假数据） | 一个能点的页面 |

第六周再决定要不要碰数据库、CMS、ETL 流水线。

**在此之前，一行 Postgres 都不要写。**

---

## 59.6 给后续大模型的追加要求（接 §57）

13. **不要把关系图画成公司组织树。** 枢纽是 `Capability`，
    `Company` 是徽标不是节点（§59.1）。
14. **不要提议全站 i18n 框架。** 实体层语言中立，只有三个编辑字段是多语言（§59.2）。
15. **不要在方案里增加任何"需要人工逐条审核"的环节。**
    人力硬上限每周 3 小时，且 60% 必须留给写作（§59.3）。
16. **不要因为放开了 Agent 自主，就放宽 §26。**
    放开的是审批，不是推理。拿不准一律 `Unknown`（§59.3）。
17. **不要在 Phase 0~1 引入数据库、CMS 或 ETL 框架。** git + JSON（§59.4.c）。
18. **不要把"实测"当成 benchmark。** 只做二值的能力核验，不做画质评分（§59.4.d）。
19. **默认海外 embed 在大陆不可用。** 媒体优先级见 §59.2（§45 已修正）。

---

## 59.7 覆盖对照表

| 原条目 | 状态 | 去看 |
|---|---|---|
| §9.1 模型关系图（公司/版本树） | **重写** | §59.1 |
| §9.3 平台矩阵 / §14 Compare | **收敛为同一组件的视图** | §59.1 |
| §20 语言（未定） | **定为中文，双语留门** | §59.2 |
| §23 Entity `summary` | **改为 `summary_i18n`** | §59.2 |
| §33 分工表后两行（人工批准） | **推翻** | §59.3 |
| §42 CMS 选型 | **推迟到 Phase 2** | §59.4.c |
| §45 媒体优先级（官方 Embed 优先） | **修正**（大陆托管） | §59.2 |
| §47 护城河四条 | **补第五条：实测** | §59.4.d |
| §48 Phase 排序 | **What Changed 提到 Phase 0** | §59.4.a |
| §48 Phase 0 验收标准 | **换成外部测试** | §59.4.b |
| §51 否决标准 | **换成分发标准** | §59.4.f |
| §55 排除"自己测试模型" | **部分收回** | §59.4.d |
| §57 工作要求 1~12 | 有效，追加 13~19 | §59.6 |

未在表中出现的条目，**继续有效**。
尤其 §21（Source→Claim→Evidence→Fact）、§26（禁止过度推理）、
§36（禁自动 merge）、§39（Inclusion Policy）四条是本次修订的**前提**，
不是被修订的对象 —— 正因为有它们，§59.3 才敢放手给 Agent。

---

## 59.8 最后一句（替换 §58）

> AI Video Atlas 是一张以**能力**为枢纽的地图：模型之间不靠出身相连，靠能做什么相连。
> 它由 Agent 自己维护"官方声称"，由人只负责"我们实测过"和每周一篇"这周变了什么"。
> 它宁可有错，也不能说不出错在哪 —— 每条事实都带着来源、日期，和一个"这是机器写的"的标记。
> 它的第一个用户是作者本人：**因为他自己也不知道现在能用什么。**

---

# 60. 竞品存在性核查结论（2026-08-07 执行 §59.4.g）

> 方法：8 轮网络检索 + 1 次页面核实，覆盖英文与中文侧。
> **局限：检索工具限定美国区**，中文侧（尤其微信公众号生态）覆盖不完整，
> 结论中涉及中文侧的部分置信度较低，建议自行补一次微信搜一搜 / 小红书。

## 60.1 一句话结论

> **「跨平台 + 带时间 + 带证据 + 有实测」这个交集,确实没有人在做。
> 但它空着不是因为没人想到 —— 是因为它对任何有商业动机的人都不划算。**

这既是好消息（位置真空），也是坏消息（**真空本身就是变现难的证据**，
和 §59.4.f 那条"没有直接变现路径"的诚实判断互相印证）。

## 60.2 周边五个位置全被占满了，而且是被利益相关方占的

### ① 平台自营 SEO 内容农场 —— 最拥挤，且直接杀死原 §20

搜"Kling vs Seedance vs Veo"，前排结果几乎清一色：

WaveSpeed、Atlas Cloud、Hailuo、Higgsfield、Hedra、Runware、Leonardo、
teamday、magicshot、opencreator、seavidgen、buildfastwithai、
kling2-6.com、kling35.org……

**这些全部是卖模型访问的平台自己写的。**

后果：**原 §20 的 SEO 长尾计划基本不成立。**
那批词的前排是有域名权重、有商业动机、且会持续更新的平台，
新域名硬碰没有胜算。§20 需要重写（见 §60.5）。

但同时暴露了一个结构性弱点，见 §60.4。

### ② 聚合器回答"去哪用"，但每家只答自己那一格

- **Kie.ai**：一个 key、30+ 视频模型
- **Atlas Cloud**：统一 API，300+ 模型（含 ComfyUI 集成）
- **Envato VideoGen**：集成 11 个模型（Veo 3.1、三个 Kling 变体、Hailuo 02/2.3、Wan 2.5、Luma Ray 3、PixVerse 5、Seedance 1.0 Pro）
- **Hailuo**：统一平台 + 统一额度

**关键观察：没有任何一家提供跨平台的那张表。**
因为对每一家来说，做那张表 = 给对手引流。

> **§9.3「平台 × 模型矩阵」是本次核查确认的、最干净的一个空位。
> 而且它结构上只可能由非平台方来做。**

### ③ Benchmark 层已被占死 —— 但它答的是另一个问题

- **Artificial Analysis Video Arena**：text-to-video / image-to-video × 有音 / 无音，
  四个 Elo 榜，盲测投票
- **llm-stats**、**HuggingFace Space** 镜像同一份数据

它们只回答**"谁生成得更好看"**，
完全不回答**"谁支持首尾帧 / 多参考图 / 原生音频"**。

> **这条确认了 §59.4.d 的分级是对的：benchmark 不碰（已被占死且贵），
> capability 核验没人做（因为没法自动打分，不 scalable —— 对他们是缺点，对一人项目是护城河）。**

### ④ Landscape 图已经烂大街 —— 但全是公司图

The Map of AI（2026-03）、AI Systems Landscape 2026、
AI Agents Landscape（号称日更）、valueaddvc「200+ 公司 / 7 层技术栈」、CB Insights……

**全部是公司 / 赛道 / 融资维度的图，没有一张是能力维度的。**

> **这反向验证了 §59.1 的改法。**
> 如果按原 §9.1 画公司→团队→模型的树，就是一头扎进这个红海，
> 而且我们的数据量还打不过 CB Insights。
> 换成「模型 ↔ 能力」二部图，才是没人占的那个位置。

### ⑤ 能力矩阵这个形式已被验证，但只在 LLM 侧

**LMMarketCap 的 capability matrix**：绿/红双色标注六项能力
（Vision、Function Calling、Streaming、JSON Mode、Reasoning、Web Search、Image Output）。

实地核实结果：

- ❌ **不覆盖视频模型**，纯 LLM
- ❌ **没有 last verified / last updated**
- ❌ **没有来源链接、没有证据**
- ❌ **不显示哪个平台托管**

> **这几乎是本方案的 LLM 版预演：形式被市场验证过有人看，
> 视频侧完全空着，而且连 LLM 侧都没做时间与证据。**

## 60.3 中文侧：实测文化很成熟，但全是一次性的

搜到的代表：

- 腾讯新闻 / 搜狐《AI 生成视频首尾帧哪家强？实测可灵、即梦、通义万相》
- 知乎《可灵、即梦、海螺、Vidu 哪家强？4 大 AI 视频神器深度测评》
- 知乎《2026 年国内外最火的 19 款 AI 视频生成工具（持续更新）》
- CSDN《5 个具备首尾帧的 AI 视频生成工具汇总》
- CocoLoop AI 视频模型排行榜

**这里有一条对我们不利的发现：中文侧已经有成熟的"实测"文化，
而且实测的正是首尾帧这类能力项。**
所以 §59.4.d 那条"实测是护城河"，**在中文语境里没有想象中稀缺**，需要下调预期。

但这批内容有三条共同缺陷，且条条致命：

| 缺陷 | 具体表现 |
|---|---|
| **没有日期意识** | 那篇首尾帧实测是 2025-05 的，测的是可灵 1.x 时代，今天已完全过期 —— **但页面上不会告诉你** |
| **一次性** | 发完就不再维护；标"持续更新"的知乎贴，实际更新频率不明 |
| **不结构化** | 是文章不是数据，查不了、比不了、组合不了、拼不成图 |

> **这三条正好就是本方案的三个设计点（Freshness / ChangeEvent / Entity-Relation）。
> 换句话说：中文侧的竞争不在"有没有人做过"，在"有没有人一直做"。**

## 60.4 核查中撞出来的一个新机会：裁判都是运动员

§60.2 ①最值钱的不是"SEO 打不过"，而是这个事实本身：

> **今天在互联网上回答"哪个 AI 视频模型最好"的前十条结果里，
> 至少七条是卖模型访问的平台自己写的。**

这是一条**零成本、有传播力、且只有非平台方才敢发**的内容。

建议做成一张图，作为 §59.4.b 那张"发出去测水温"的图：

```text
  「谁在告诉你哪个 AI 视频模型最好？」

  搜索结果前 20 条，按作者身份上色

  🔴 卖模型访问的平台自营内容    ██████████████  14
  🟡 AI 工具站 / 导航 / 内容农场  ████            4
  🟢 中立第三方                  ██              2
```

理由：

1. **数据一次搜索就能拿到**（搜索结果 + 每条的域名归属），
   不像能力演进图要先核实每个能力的出现年份（那是几天的活）；
2. **自带争议性**，正好测 §59.4.b 那个判据"有没有人问这图哪来的"；
3. **它是整个项目的立场声明** —— 直接说清楚我们为什么存在；
4. 和 §59.4.e 的平台透明度评级是同一路数，可以并成一个系列。

**建议把 §59.5 第一周的第 2 项（画能力演进图）换成这张。**
能力演进图往后放一周，等第一期周报把数据攒出来。

## 60.5 §20 SEO 策略需要重写

原 §20 列的长尾词（"Kling vs Seedance"、"AI 视频模型有哪些"、"Seedance API"……）
**全部落在 §60.2 ① 那片红海里**，且对手是有钱的平台方。

改成三类实际还能打的词：

| 类型 | 例子 | 为什么能打 |
|---|---|---|
| **时效词** | `Seedance 2.5 首尾帧`、`Kling 3.0 Omni 支持什么` | 平台的对比文章是季度更新的，我们是周更；新版本发布后有一段真空期 |
| **否定词 / 边界词** | `Kling 不支持什么`、`Seedance 没有哪些能力`、`XX 平台底层用的什么模型` | **平台永远不会写自己的短板**，这批词结构性地属于第三方 |
| **组合词** | `既支持首尾帧又有原生音频的模型`、`哪些视频模型有开源实现` | 需要跨厂商数据才答得了，单个平台答不了 |

> 共同点：**这三类词都要求作者"不卖模型"才写得出来。**
> 这是这个项目在 SEO 上唯一站得住的立足点 —— 不是比谁勤快，是比谁能说真话。

## 60.6 一条顺带的观察：世界变得比文档还快

核查中撞到的当期实体：**Seedance 2.5**（2026-06-23）、**Kling 3.0 Omni**、
**Gemini Omni Flash**（当前 Elo 榜首）、**HappyHorse-1.0**（阿里，2026-04 上榜）。

而本文档 §1~§58 写的还是 Seedance 2.0 / Kling 3.x。**文档写完不到一个月就有实体过期了。**

这不是文档的问题，是这个领域的性质 ——
**它同时验证了 Freshness 是核心价值，也验证了 §59.3 那个"人力必须与数据规模解耦"的判断：
靠人手工追，追不上。**

## 60.7 对三条锁定约束的影响

| 约束 | 核查后 | 说明 |
|---|---|---|
| **一 · 能力做枢纽** | ✅ **加强** | §60.2 ④ 显示公司维度的图已经红海，能力维度空着 |
| **二 · 中文站** | ⚠️ **需要注意** | §60.3 显示中文侧实测文化成熟，"实测"的稀缺性要下调；差异化要更靠"一直做"而不是"做过" |
| **三 · Agent 自主 / 每周 3 小时** | ✅ **加强** | §60.6 显示手工追不上；§60.3 三条缺陷全是"没人有精力一直做"造成的 |

## 60.8 是否继续的判断

**建议继续，但把项目的自我认知调整为：**

> 不是"做一个别人没做过的东西"，
> 而是**"做一件别人做过但没人愿意一直做的事"**。

差异化不在创意，在**耐力 + 中立**这两件事上，而这两件恰好是：

- **耐力** → §59.3 的 Agent 自主设计要负责（人只出 3 小时）
- **中立** → §60.4 / §60.5 的立场，是唯一平台方结构性无法跟进的位置

如果这两件有任何一件做不到，这个项目就退化成 §60.3 那批一次性测评文章中的一篇。

---

## 60.9 A3 补充核查：微信侧（2026-08-07，由项目负责人执行）

§60 开头标注的局限「检索工具限定美国区，中文侧尤其公众号生态覆盖不完整」，
由项目负责人用微信搜一搜「问一问」补了一屏。搜的词：**「哪个Ai视频模型最好」**。

### 看到了什么

| 结果 | 作者 | 时间 |
|---|---|---|
| 码住码住！即梦 Seedance2.5 电影级提示词高级手法技巧 | 尤道子 | **2 小时前** |
| 现在的 AI 形势如何？每种旗舰模型的强项和不足是什么 | 个人账号 | **9 小时前**（讲的是 LLM，不是视频） |
| 推荐几个比较好用的 AI 生成视频的工具给大家 | 耳东AI工具箱 | 4 个月前，**阅读 5万+** |
| 有问必答｜AIGC 领域创作者，分享真实 AI 经验干货 | 个人账号 | — |

### 四条结论

1. **中文侧确实没有厂商自营对比内容。**
   §60.2① 那个「回答者是卖模型的一方」是**英文侧现象**，不是普遍现象。
   原文里标的「中文侧的 0 可能是检索工具的偏差」——这一屏说明它更可能是真的。

2. **微信侧不存在「SEO 长期占位」这回事。**
   前排是 2 小时前、9 小时前的内容。这里靠的是**持续发**，不是发一篇好的然后占着。
   → 直接影响策略：**「做一张好图一劳永逸」在这个生态里不成立**，
   反过来强化了 §59.4.a 的周报路线。

3. **中文用户搜这个词，想要的是「推荐用哪个」，不是「能力矩阵」。**
   阅读 5万+ 的那篇是工具推荐帖。这是一条**对本项目不利**的信号，要正视：
   能力表回答的是「它能不能做我要做的事」，而多数人问的是「你替我选一个」。
   两者不是一回事。将来前台可能需要一层「按用途给建议」的入口，
   但那层必须建在能力表之上，不能取代它 —— 否则就变成第五个推荐帖。

4. **未见有人在周更「AI 视频本周变了什么」。** 这个位置仍然空着。

### 这一屏不能证明什么

只搜了一个词、只看了「问一问」一个 tab、只有一屏。
**它足以推翻「中文侧也是厂商压场」这个假设，但不足以证明「没人做周报」** ——
公众号的深层内容不一定出现在这个 tab。这条留在这里，
等 B1 建 Source 清单时顺带再确认一次。

---

# 61. 方法论修正：先落地架构，别先去换反馈（2026-08-07）

> **本章推翻 §59.4.a、§59.4.b 与任务清单「阶段 0 六周不写代码」。**

## 61.1 项目负责人的原话

> 「不把事情做好、总想着先获取反馈再开始新项目，那是旧时代的做法，当时项目落地
> 成本大。而我们现在先把项目架构落地，看看自己是否有没有想明白产品形态才是前提。
> 为啥？因为现在实现项目落地成本低、而在渠道获得反馈的成本（特别是时间成本）高了。」

## 61.2 我错在哪

§59.4.a 我写的是「先写六周周报，网站后建」，§59.4.b 是「先发一张图测水温」。
那套推理的前提是**造东西贵、试错便宜** —— 精益创业的默认假设。

对一个有 AI 协助的一人项目，这个假设**已经反过来**：

| | 旧假设 | 实际 |
|---|---|---|
| 把能跑的东西建出来 | 几个月 | **几天** |
| 从渠道拿到有效反馈 | 几天 | **几周，且压缩不了** |

还有更要命的第三条：**半成品测不出任何东西。**
发一张图没人理，你分不清是图不好、渠道不对、时机不对，还是它压根不是产品。
**一个测不出结论的测试，不是便宜，是白花。**

## 61.3 更强的一层：建架构本身就是在检验想没想明白

当天的实证 —— 这三个决定性问题，**没有一条是纸面推演出来的**：

| 问题 | 怎么暴露的 |
|---|---|
| `clip` 与 `realtime` 必须分轨（规则二） | 真去给 Vidu S1 填能力格，发现「视频延长」对它没有意义 |
| 版本升级不许沿用旧结论（规则三之一） | 真去把 Seedance 2.0 改成 2.5，发现旧结论会被静默继承 |
| 模型要有生命周期状态（规则五） | 真去核 Sora，发现所有格子都对、整张表却把人带沟里 |

六周周报**一个都发现不了**，因为周报不需要回答「这一格该填什么」。
**是「建」这个动作在逼问，不是「想」。**

## 61.4 修正后的顺序

```text
落地架构（数据模型 + 采集 + 前台骨架）
        ↓
在建的过程中暴露产品形态问题 ← 主要的判断依据在这里
        ↓
数据可靠了，再谈分发（图 / 片 / 周报）
```

**判断「要不要继续」的首要依据，是架构落地过程中暴露的问题，而不是外部反馈。**

## 61.5 什么没有变

- **花钱的事仍然先确认**（付费 API、投放）。省掉的是「先做个小东西试水」，不是省确认。
- **不可逆的事仍然先确认。**
- §59.3 的每周 3 小时上限仍然成立 —— 那是**稳态运营**预算，与建设期无关。

## 61.6 连带作废

- §59.4.a「先写六周周报，网站后建」→ 作废。周报仍要写，但不是前置关卡。
- §59.4.b「先发一张图测水温」→ 作废。图是产物，不是关卡。
- §59.5 与任务清单的「阶段 0 · 六周耐力测试（不写代码）」→ 作废。
  耐力问题真实存在，但它由 §59.3 的 Agent 自主设计来解决，不该用六周空转去测。

---

# 62. 范围扩到整个 AI 领域 + 公司升为一等实体（2026-08-08）

## 62.1 项目负责人的话

> 你想的数据太小了点：不是 10 家公司、5 个国家那么简单。
>
> 1、每家公司的上游的投资公司、下游的运营商、终端的用户分布；产业链地图能不能抓住（这是理想状态）
> 2、这是 AI 视频模型，还有 AI 文本模型、具身智能、世界模型、物理模型等等。因为我想做整个 AI 领域的能力地图，现在是先实现一方面的 AI 视频模型；后续我想补上所有方面的模块。这样一个 3D 地图的数据和节点就会上来。3D 地图 + 时间轴 + 地球分布，就是一个很好的可视化交互方式。

这两句话把项目的边界改了。**§1 到 §61 全都是按「AI 视频能力地图」写的，
从这里开始，那是第一个模块，不是全部。**

## 62.2 §7 数据模型的修订：公司是一等实体

原方案里 vendor 是模型上的一个字符串字段。这个决定当时看着无害，
今天照出了后果 —— 校验脚本打印出来的第一行就是：

```
vendor 取值：['Alibaba-ATH', ..., '阿里 Alibaba']
```

**阿里在库里是两家公司。** 不是数据录错了，是数据结构没给「同一家公司」
留位置：两个字符串不相等，系统就没有任何办法知道它们是一个东西。

产业链地图、地球分布、投资关系 —— 负责人要的这三样**全部挂在公司这一层上**。
这一层是字符串，上面就什么都建不起来。

已落地：

- `models.vendor` → `models.org`（指向新的 `orgs`）+ `models.team`
- `orgs` 带 `hq{city,country,iso,lat,lon}`、`kind`、`parent`
- 校验 R20（模型必须挂到存在的公司）、R22（parent 必须存在）、R23（缺经纬度=地球上画不出来）

**合并阿里的时候，把内部团队保留在了模型上**（Seed / 通义 / ATH / Skywork）。
理由见 §59.3 的三色通道：实体合并是红色动作，因为**错了会污染整张图且难回滚**。
合并本身可以做，但不能借着合并把信息丢掉 —— 「阿里的通义团队」和
「阿里的 ATH 团队」是真实存在的区别，合成一个 `alibaba` 之后那个区别必须还在。

## 62.3 产业链三层的可得性差得很远，不能当成一件事

负责人自己标了「这是理想状态」，那就按理想和现实分开说。
**按能不能拿到证据分级，不是按重不重要分级：**

| 层 | 状态 | 说明 |
|---|---|---|
| 下游运营商 | ✅ **已经有了** | 就是 §9.3 的 `platforms` + `availability`，13 条，官方源核过 |
| 公司归属 / 总部 | ⚠️ 可查可证，但**现在还没证** | 官网 About / 备案主体 / 上市公告，S~A 级 |
| 上游投资 | ⚠️ 上限只有 B/C 级 | 轮次能从 Crunchbase / IT桔子 / 新闻稿拿到，**金额多半核不实** |
| 终端用户分布 | ❌ **不做** | 见下 |

### 终端用户分布：明确不做

**没有一家厂商公开用户地理分布。** 在地球上点一片用户热力，
数据只能来自估算、类比或者干脆编。而这个产品的全部本钱写在 §26 和 §21 里：
没有来源的结论就是猜的。**画一张编出来的热力图，是自己拆自己的台。**

替代口径（已在库里，不用新采）：

- `models.reach_cn` —— 大陆不走代理直连厂商官方站的实测结果
- `platforms.region` —— 平台的服务区域

合起来回答的是**「你在哪，能不能用上」**。这个可验证，
而且比「有多少用户在哪」对读者有用得多 —— 后者是投资人关心的，前者才是使用者关心的。

### 总部：现在全是常识填的，零来源

11 家公司的 hq 都是我按公开常识填的，**一条 `hq_src` 都没有**。
我没有随手指一个厂商官网糊过去 —— 那正是 §60.4 之后犯过一次的错
（引用了一个从没读过的来源）。

处理方式：校验 R21 对每一家没有 `hq_src` 的公司**持续报警告**，
前台也必须标出来。**不许因为「大家都知道」就当成核过了** ——
那正是我们批评别人的那件事。清掉这 11 条警告是一个独立任务（H2）。

## 62.4 §7 的第二处修订：能力轴按方向隔离

Ontology 规则二说 clip 轨和 realtime 轨不能共用能力轴。
**扩到多方向之后，这条要往上推一层。**

原来 `capabilities` 只有 `class`，没有 `domain`。如果就这么加进文本模型，
「首尾帧」「运镜控制」会和文本能力躺在同一个数组里，
笛卡尔积一乘 —— **凭空造出一整片假的 ⬜**。而 ⬜ 在这个产品里是有含义的
（「查了公开渠道找不到」），造假 ⬜ 等于造假陈述。

已落地：`capabilities` 补 `domain`，校验 R26 拦跨方向的格子。

**结论：加一个方向 = 往 `domains` 加一条 + 给模型和能力标 `domain`，不动代码。**

## 62.5 扩方向的真实成本，不在代码

数据结构已经就位，但**那是最便宜的一部分**。

真成本是：**每个方向都要重新做一遍 §C1（冻结 Ontology）** ——
收谁不收谁、能力轴怎么切、什么叫「支持」、什么叫「同一个能力的不同叫法」。

视频这一轮的教训摆在那里：用厂商官方文档重核前两家、共 22 格，
**8 格是错的，其中 5 格是假阴性**（Kling 叫 Element、LTX 叫 Ingredients，
我们按自己的词去搜，搜不到就记成不支持）。这活儿偷不了懒。

所以选第二个方向的时候，**先回答一个问题就够了：它的能力轴是什么？**
答不上来就还不能开工。

## 62.6 3D 地球：等数据量，现在不做

负责人的判断是对的 —— **3D 地图 + 时间轴 + 地球分布，节点多了才成立**。
反过来说也成立：**节点少的时候它不成立**。

现在是 11 家公司、4 个国家。给 4 个国家做一个 3D 地球，
就是负责人说的「数据太小了点」，只不过是从另一头小。

而且这个项目已经犯过一次同类错误，原话记在 §61：

> 你搞错了优先级啊；不把信息搞准，做什么做？

**在数据到位之前先做可视化，是同一个错的第二次。**

所以 3D 地球写成一个带**先决条件**的任务（H4），条件不满足不动手：

1. 至少 2 个方向上线（当前 1）
2. 公司数 ≳ 40（当前 11）
3. 总部有来源，即 H2 做完（当前 0/11）

引擎不用新造 —— keepsake 那套抽象地球可以直接接上，
这也是不着急的另一个理由：**它不是瓶颈，数据才是。**

## 62.7 对前面章节的影响

- **§1 标题**：项目叫「AI 能力地图」，AI 视频是第一个模块。文档名 `AI_VIDEO_ATLAS` 是历史。
- **§7 数据模型**：新增 `orgs` / `investments` 两个实体；`capabilities` 新增 `domain`。
- **§9 视图**：新增「公司 / 地理」视图一类，但**排在数据之后**。
- **§29 来源分级**：投资类来源的等级上限是 B —— 这不是懒，是那类信息本身就没有 S 级出处。
- **§59.3 三色通道**：公司实体的合并/拆分归红色，已在执行（阿里那次由人来做）。
- **不变**：三条锁定约束（关系图是锚点 / 走 /atlas 路由 / 每周 ≤3 小时）一条没动。
  多方向扩展**不增加人力占用** —— 靠的是 §59.3 那套「精准度换维护成本」，不是靠加班。
