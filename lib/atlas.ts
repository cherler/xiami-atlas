import raw from "@/data/atlas.json";

/**
 * 三态。**`unknown` 不是缺口，是一条事实**：我们查了，公开渠道没说。
 * 见 §59.4.e —— 把「不透明」做成一等数据，而不是留白。
 */
export type State = "yes" | "no" | "unknown";

/**
 * 品类。**两轨不共用一张表**（data/ontology.md 规则二）：
 * 对实时模型「视频延长」没有意义（它没有终点），对离线模型「延迟」没有意义。
 * 硬并成一张表，既没信息量，又会让人以为它们在同一条赛道上分了胜负。
 */
export type Klass = string;

export type Capability = {
  id: string;
  class: Klass | "both";
  /** 属于哪个方向。缺省按 video 兜底（第一批数据写在只有一个方向的年代）。 */
  domain?: string;
  name: string;
  zh: string;
  group: string;
  /**
   * tab 内的小节。**2026-08-17 把七个 tab 并成「模型与组件」时，
   * 原来的七类降级成了这里** —— 分类信息一点没丢，只是不再占顶栏。
   * 顶栏留给现在真正在动的那两类（一站式、Agent 与 Skill）。
   */
  sub?: string;
  /** 已普及的能力默认折叠：它连向所有模型，画出来只是噪音（§59.1 的超级节点问题） */
  ubiquity: "前沿" | "主流" | "已普及";
  /** 我们手上的日志能证明的最早时间（不是业界首次出现）。见 atlas.json 的 $since。 */
  since?: string;
  since_src?: string;
  since_quote?: string;
  since_note?: string;
  aliases?: string[];
};

/** 一等实体是 Family，version 是会过期的挂件（ontology 规则三）。 */
/**
 * ⚠️ `zh` 与 `zh_none` 是一对：
 * - `zh` 有值 = 这家有官方中文名（「即梦 Seedance」「海螺」）
 * - `zh_none: true` = **查过，官方没有中文名**（品牌在中文语境里就用原名：ElevenLabs、TRELLIS、Meshy…）
 * - 两个都没有 = **还没查** —— R73 报警告，因为「中文关键词搜不到它」这件事要看得见
 *
 * 和 R21a（总部「查过拿不到」vs「还没查」）同一条纪律：
 * **不许把「查过、确实没有」和「压根没查」显示成同一个样子**，
 * 否则这条警告永远不会收敛，久了就没人看。
 */
/** 生命周期（ontology 规则五）。**能力对不代表能用** —— Sora 每一格都对，整张表却把人带沟里。 */
export type Status = "active" | "superseded" | "discontinued";

export type Model = {
  /** 官方没有中文名（查过）。见上面那段注释。 */
  zh_none?: boolean;
  id: string;
  class: Klass;
  family: string;
  zh: string;
  /** 指向 orgs 的实体 id。**不再是自由字符串** —— 那让阿里在库里成了两家。 */
  org: string;
  /** 公司内部团队（Seed / 通义 / ATH / Skywork）。合并公司时信息不能丢在合并里。 */
  team?: string;
  version: string;
  /** 属于哪个方向。缺省按 video 兜底（第一批数据写在只有一个方向的年代）。 */
  domain?: string;
  version_as_of: string;
  /**
   * 版本号是**从哪看到的**。
   *
   * 视频侧的版本靠 `versions[]` 谱系带来源，但闭源图像这几家的官方页
   * **只写当前版本、不写发布日期** —— 进不了谱系（谱系的 date 是发布日，
   * 不是我们的核验日，硬填就是造一个假日期）。所以单开这一栏：
   * 版本这个断言本身有出处，日期缺就缺着、在 status_note 里说明白。
   */
  version_src?: string;
  status?: Status;
  /** 给用户看的一句话：什么时候停。**status_note 里混着我们的工作过程，不上前端。** */
  status_short?: string;
  status_until?: string;
  status_note?: string;
  /** core 进主图与主表（每轨 ≤10）；extended 只在库里 —— 停服的降到这里而不是删掉。 */
  tier?: "core" | "extended";
  /**
   * 大陆网络**不走代理**直连厂商官方站/文档的实测结果（不是 API 端点 —— 两件事不能混）。
   * 地理这条线真正有用的不是「公司在哪」，是**「你在哪，能不能用上」**。
   */
  reach_cn?: "ok" | "blocked" | "unknown";
  reach_note?: string;
  /** 谱系节点少于 3 个时必须写明为什么（R58）。**「没采到」和「本来就没有」是两回事。** */
  lineage_note?: string;
  /**
   * 产品线级别的开闭源归属，用来分演化树的两条主干。
   * **`mixed` 不是含糊，是真实情况**：万相 2.1/2.2 有权重、2.5 之后没有；
   * 海螺反过来只有最新的 H3 放了权重。**同一条线前半开后半闭，硬分哪边都是错的。**
   */
  weights?: "open" | "closed" | "mixed";
  weights_note?: string;
};

export type Source = { url: string; tier: "official" | "third-party"; name: string };

/**
 * 公司 —— **一等实体**（此前只是模型上的一个字符串，结果同一家公司出现两次）。
 *
 * 产业链地图、地球分布、投资关系全都挂在这一层。现在只有 11 家，
 * 拆开是十分钟的活；等五个方向两百个模型再拆就是一次迁移。
 *
 * ## hq 现在没有来源
 *
 * 都是公开常识，但我们自己的规矩是**「没有来源的结论就是猜的」**。
 * 所以 `hq_src` 缺失时校验 R21 会一直警告、前台必须标出来 ——
 * **不许因为「大家都知道」就当成核过了**，那正是我们批评别人的那件事。
 */
export type Org = {
  id: string;
  zh: string;
  name: string;
  kind: "bigtech" | "startup" | "lab";
  parent?: string;
  /**
   * **可选。** 查不到有来源的总部就不填 —— R21 会一直警告，但**编一个城市比空着更糟**。
   * 类型里原来写成必填，而数据早就允许缺（新收的几家小厂就没有），
   * 于是「schema 说可选、类型说必填、代码当必填」，统计那行直接 `o.hq.country` 崩了。
   */
  hq?: { city: string; country: string; iso: string; lat: number; lon: number };
  /** 有来源才算核过。没有就是「按常识填的」。 */
  hq_src?: string;
  /** 定位精度：exact / province / ambiguous / null。10 家仍未定到城市级（待办 H2）。 */
  hq_precision?: string;
  /**
   * 投资方录全了没：full = 官方披露里点名的都录了；partial = 还有没点名/没录的。
   * **partial 必须在图上画出来**（⋯ 节点）—— 只画已知的那几条，
   * 读者会以为「就这几个投资方」，那比不画更误导。和 ⬜「官方没说」同一条纪律。
   */
  investors_coverage?: "full" | "partial";
  investors_note?: string;
  ir_url?: string;
  ir_src?: string;
  note?: string;
};

/**
 * 价格（G5）。**unit 是一等字段，不是备注。**
 *
 * 七家七种计价方式：按秒标美元 / 按秒标人民币 / 按点数扣 / 只卖订阅 / 官方页上查不到。
 * 把它们并成一列「每秒多少钱」，**那一列一定是编的**。
 *
 * `tiers` 是数组不是标量：同一个模型 720P 和 4K 能差 5 倍（Kling ¥0.6 vs ¥3.0），
 * 有声无声再差 50%。**记成一个数字必然是错的。**
 */
export type Price = {
  /** 平台。**主键是 (p, m)** —— 不指定平台，「多少钱」就没有答案。 */
  p: string;
  m: string;
  unit: "per-second" | "points" | "subscription" | "credits" | "unavailable";
  currency?: "USD" | "CNY" | null;
  listed_as?: string;
  tiers?: { label: string; v: number }[];
  src: string;
  quote: string;
  /** 价格比能力过期得快得多，所以核验日期是必填。 */
  as_of: string;
  note?: string;
};

/**
 * 版本谱系（演进图的数据）。**演进的主体是模型，不是能力。**
 *
 * `added` 是必填且是这条数据的全部价值所在：**只有版本号没有 added 的节点没有意义**——
 * 「Kling 出了 3.0」不涨知识，「Kling 3.0 加了动作复刻」才涨。
 */
export type Version = {
  /** 树节点 id。 */
  id: string;
  /** 父节点。**没有父节点的就当根，不许为了让树好看硬接一条边** —— Aleph 不是 Gen 的后代。 */
  parent?: string;
  m: string;
  version: string;
  date: string;
  added: string;
  /** 挂到能力轴上，「点一项能力看谁先谁后」靠它。**对不上就留空**，硬凑会把那一刀切错。 */
  cap?: string;
  cap_skip?: string;
  src: string;
  quote: string;
  note?: string;
  /**
   * 这一代覆盖了哪些仓库（同一代的不同尺寸/精度档算同一个节点）。
   * 有它之后，每周待办才不会把「树上早就有、只是从别的源录进来的」永远算成缺口。
   */
  repos?: string[];
};

/**
 * Skill / Workflow。方案 §10 原话：**「Skill 必须是第一等公民。」**
 * Skill 回答「这件事怎么做」，能力格回答「谁能做」—— 两个问题。
 * `limits` 为空要报警告（R45）：**没有「已知限制」的 Skill 页是在卖广告。**
 */
export type Skill = {
  id: string; zh: string; en: string; cap?: string;
  /** 属于哪个方向。缺省按 video 兜底。 */
  domain?: string;
  io?: { in: string[]; out: string };
  native?: string[];
  /**
   * `license` 走三态，和 `ApplicationResource` 同一套：字符串 = 查到的原名，
   * `null` = 查过、作者确实没放，字段缺失 = 我们还没采。
   * **这两个字段以前没写进类型**，于是采到的许可证在汇总到场景页时被整个丢掉 ——
   * PhotoMaker 明明是 Apache-2.0，卡片上却印着「许可证未采」。
   * 类型漏一个字段，数据就静悄悄地少一截。
   */
  opensource?: { name: string; url?: string; src: string; quote: string; license?: string | null; note?: string }[];
  /** 能直接跑起来的 workflow / 官方插件。**方案 §10 要的「拿什么做」就是这一栏。** */
  workflow?: { name: string; url: string; kind: "official" | "community"; src: string; quote: string; license?: string | null; note?: string }[];
  platform_feature?: { p: string; name: string; src: string; quote: string; discloses?: string }[];
  limits?: string[]; cases?: string[];
  src?: string; quote?: string; verified_at: string;
};

/**
 * 应用资源不是另一套散乱的导航页，而是从「我想做什么」往下接的公开路线。
 * 项目 / Skill / 课程 / 文档四种标签故意分开：能下载、能运行、能学习、能查证是四件不同的事。
 */
export type ApplicationResourceKind = "project" | "skill" | "course" | "docs";

/**
 * 一条证据 = 哪个 Skill 因为什么原文把这个资源认下来。
 *
 * **同一个 URL 会被多个 Skill 认领**：MiniMaxAI/MiniMax-H3 一个链接同时挂在
 * 角色一致（Ref2VA）、首尾帧（FL2VA）、口播对口型（官方案例）、动作复刻（V2V）四处，
 * 四条原文各不相同。按 URL 去重是对的（同一个仓库不该在一页里出现四次），
 * 但**只留第一条就是在静默丢证据** —— 口播剧原来显示的是「角色一致」的
 * Omni-reference 原文，而它最需要的那条「让画面里的人说指定台词」被丢了。
 * 所以去重保留卡片，证据整组留下。
 */
export type ApplicationResourceEvidence = { skill_id: string; skill_zh: string; quote: string };

export type ApplicationResource = {
  kind: ApplicationResourceKind;
  name: string;
  url: string;
  src: string;
  quote: string;
  note?: string;
  /**
   * 许可证。**三态，不是两态** —— 这是本项目栽过的同一个坑：
   *
   *   `"MIT"` 等字符串 = 查过，就是这个许可（自定义社区许可按原名写，不写「开源」）
   *   `null`           = **查过，作者确实没放 LICENSE**
   *   字段缺失          = **我们还没采**
   *
   * 后两者长得像，含义完全相反。混成一个「有没有」的布尔，
   * 界面就会把 HunyuanVideo、Wan 这些明明有许可证的仓库标成「未授权使用」——
   * 那不是谨慎，是造谣。和 ⬜「官方没说」/ ❌「官方说了不支持」的区分同一条纪律。
   */
  license?: string | null;
  /** 认领它的每一个 Skill 及其原文。应用自己填的课程/文档没有 Skill，这里是空数组。 */
  evidence: ApplicationResourceEvidence[];
};

export type Application = {
  id: string;
  zh: string;
  en: string;
  /** 属于哪个方向。缺省按 video 兜底。 */
  domain?: string;
  /**
   * 同一件事在行业里的别名。**这一栏是给搜的人用的** ——
   * 我们叫「数字人口播」，别人可能搜「AI口播」「口播视频」；叫「AI漫剧」的
   * 也有人叫「动画微短剧」「网文漫改」。和 capabilities.aliases 一个道理：
   * 按自己的词去搜会搜不到。
   */
  aliases?: string[];
  intro: string;
  inputs: string[];
  output: string;
  skills: string[];
  resources?: ApplicationResource[];
};

/** Change + So What（§15）。**只有 after 的那是新闻，不是 ChangeEvent。** */
export type ChangeEvent = {
  date: string; entity: string; kind?: string;
  before: string; after: string; why: string;
  affects?: string[]; src: string; quote: string;
};

/** 资源导航（§16）。**只有链接没有判断的就是 hao123** —— `caveat` 是负面结论，必填。 */
export type Toolkit = { task: string; site: string; url: string; verdict: string; caveat: string; checked_at: string };

/** 效果。**我们不打分，只转述并标明是谁说的。** */
export type Effect = {
  m: string; kind: "third-party" | "vendor-claim";
  who: string; value: string; url?: string; quote: string; as_of: string;
};

/** 折扣。此前埋在 pricing.note 里，结构化出来才能在对比表里并排看。 */
export type Discount = { p: string; m: string; rule: string; off: string; src: string; quote: string };

/** 上游投资关系。结构先建好 —— 但**可得性上限只有 B/C 级**，见 atlas.json 的 $investments。 */
export type Investment = { from: string; to: string; round?: string; date?: string; src: string; quote: string };

/**
 * 怎么个能法（ontology 规则七）。对「能不能做」两者都是能；
 * 对**「用的是原生模型还是它的变体」**差很多。**别把它概括成一句通用解释** ——
 * 动作复刻的变体照样直接收驱动视频，口播对口型的变体才是「只能作用于已生成的视频」，
 * 两者都在 separate-task 里，一句话套过去必有一头是编的。看每一格的 note。
 */
export type Via = "native" | "separate-task";

export type Cell = {
  m: string;
  c: string;
  state: State;
  via?: Via;
  /** 这条结论核验的是哪个版本。与模型当前 version 不符时校验脚本报错（规则三之一）。 */
  verified_for?: string;
  /**
   * **能力不在旗舰上，在同门另一支型号上** —— 填那支型号的名字。
   *
   * 和「版本对不上」是两回事，不能混：
   * 「Kimi 当前是 K3，这格核的是 K2」是**腐烂**（旧结论挂到新版名下，R9 必须拦）；
   * 「视觉在 K2.6 上、旗舰 K3 的文档没写」是**产品线的形状**，本来如此，拦它没有意义。
   *
   * 但读者要看到区别：一格 ✅ 若不加说明，会被当成旗舰就能做。
   * 所以填了这个字段的格子，前台必须把型号名印出来。
   */
  sibling?: string;
  /**
   * **当前版本已经是这个了，而这一格还是上一版核的。** 填当前 version。
   *
   * R9 说「升级后必须重新核验或退回 unknown」，但这两条路都不诚实：
   * 厂商的能力页往往还没跟着主力版本更新（Qwen 的模型清单已到 3.8-max，
   * 缓存/批量/联网搜索三页仍只列到 3.7-max）——
   * 改 `verified_for` 是编，退回 ⬜ 是把真证据扔了，两种都在骗读者。
   *
   * 所以留第三条：**照实说「核的是上一版」**，前台把两个版本并排印出来，
   * 同时进 TODO 的待重核那一摞。**它必须是一件待办，不能是一个静音键。**
   */
  recheck?: string;
  /**
   * **这一格是哪天核的。** 缺省时前台退回数据集日期，并把措辞从「核验于」换成「数据截至」——
   * 全站一个日期套在几十天里陆续核的格子上，两个方向都不对：
   * 对刚核的格子说旧了，对半年前的格子谎称是新的。**后者更糟，它不会喊。**
   */
  as_of?: string;
  /** 指向 sources 表。**没有 src 的 yes 是不允许的**，校验脚本会拦。 */
  src?: string;
  /**
   * 厂商原文。**这个字段数据里一直有、`validate.mjs` 也一直在读，类型里却漏了** ——
   * 2026-08-12 写 /basics 页时才因为编译报错暴露出来。
   *
   * 之所以能漏这么久：读它的都是 `.mjs` 脚本（没有类型检查），
   * 而前台一直是通过 `Fact` 组件间接渲染的。**类型与数据的漂移不会自己喊**，
   * 它只在有人第一次用 TS 直接读这个字段时才炸。
   */
  quote?: string;
  note?: string;
};

/**
 * 方向。**现在只有 AI 视频一个。**
 *
 * 留这个结构是为了「加一个方向 = 改数据，不是改代码」。
 * 但**界面上不做占位 tab 假装有别的** —— 那是骗人，而这个产品的全部本钱就是不骗人。
 */
/** 一条轨。**轨是方向自己的属性**，见 Domain 的注释。 */
export type Track = { id: string; zh: string; short: string; volume?: string; note?: string };

export type Domain = {
  id: string;
  name: string;
  state: "live" | "planned";
  note?: string;
  volume?: string;
  /** 这个方向的入口路由。有 href 就说明它已经有页面可看，哪怕 state 还是 planned。 */
  href?: string;
  /**
   * 这个方向分几条轨。
   *
   * **轨不是全局枚举，是方向的属性。** AI 视频分两轨（离线出片 / 实时交互）
   * 是它自己的事 —— 因为「渲染一段成片」和「边生成边看」根本不在同一条赛道上，
   * 硬并成一张表既没信息量、又像在分胜负（ontology 规则二）。
   * **AI 图像没有这个分法，AI 编程更没有。**
   *
   * 所以扩方向时，前端不该出现 `k === "clip" ? "离线出片轨" : "实时交互轨"`
   * 这种写法 —— 那是把一个方向的分类刻进了架子里。轨名一律从这里查。
   */
  tracks?: Track[];
};

/** 被明确排除的东西。「为什么不收」和「它没了」一样，是有用的信息。 */
export type Excluded = {
  name: string;
  /** 属于哪个方向的排除留档。缺省 video。 */
  domain?: string;
  vendor: string;
  kind: string;
  date: string;
  why: string;
  same_bucket?: string[];
  revisit?: string;
};

/** 平台（去哪用）。**厂商与平台是两个身份** —— Runway 两样都是。 */
export type Platform = {
  id: string;
  name: string;
  kind: string;
  /** 三类：厂商自有 / API 市场 / 第三方产品。第三方那类的关键问题是**公不公示底层模型**。 */
  kind2?: "vendor-own" | "api" | "third-party";
  /**
   * 公不公示底层模型（§59.4.e）。**四档不是三档** ——
   * `no`（读完了确实没提）和 `blocked`（我们没读到）是两件事，混在一起就是我们在编。
   * `no` 的门槛是「读过」：校验 R30 要求它必须拿得出 `discloses_src`。
   */
  discloses: "yes" | "partial" | "no" | "blocked" | "n/a";
  discloses_src?: string;
  discloses_quote?: string;
  discloses_why?: string;
  region: string;
  url: string;
  note?: string;
};

/**
 * 可用性。§9.3 明确要求「✓ 不能只是布尔值」。
 * **最有用的一列是 match** —— 平台上架的常常不是当前主力版本，
 * 只答「有没有」会让人以为能用上当前版本的能力。
 */
export type Availability = {
  /** §9.3 要求的五个字段。**推不出来的一律 unknown，不许猜。** */
  access_type?: "api" | "web" | "both" | "unknown";
  region?: string;
  plan?: "free" | "paid" | "trial" | "unknown";
  valid_from?: string;
  valid_to?: string;
  p: string;
  m: string;
  listed: string;
  status: "available" | "coming-soon" | "gone";
  match: "same" | "older" | "newer" | "unknown";
  src: string;
  quote: string;
  note?: string;
};

/**
 * 专项：横着切的上手评估（2026-08-16 立）。
 *
 * 九卷是按「模型产出什么」纵切的，专项是按「人要做成一件什么事」横切的 ——
 * 两者交叉才有信息。一件事需要的能力天然不在同一卷里。
 *
 * ## 为什么不是教程
 *
 * 第一版写成了「从零开始的六步」，负责人一句话否掉：
 * **「就像『把大象关进冰箱需要几步』一样，正确却是废话。」** 他是对的 ——
 * **教程的骨架是顺序，而顺序人人都知道**，所以只能写成那样。
 * 改成岔口之后废话就没地方待了：**岔口的骨架是取舍，而取舍必须有依据**，
 * 依据就是我们攒了三个月的真值表。
 *
 * ## 只存骨架（方案 C）
 *
 * `route.cap` 引能力 id，覆盖度由 `support[]` **现算**，不落库；
 * `route.app` + `route.res` 引某个应用里的一条资源，许可证与来源仍只维护一份。
 * 好处是应用页改了资源，专项页下次构建自动跟上。
 *
 * `cap` 为 null 表示**这条路根本不是一项能力** —— 比如「把长相写进提示词」，
 * 真值表里没有这一格，**那本身就是结论**：没有任何厂商承诺它有效。
 */
/** 一个决定当前归谁。partial = 平台给了参数但不完全交出控制。 */
export type DecisionOwner = "user" | "partial" | "platform";

/**
 * 这一步更该走哪边。**不是打分，是「什么时候用哪边」的归类。**
 *
 * `both` 和 `neither` 不是中间档，是两种相反的处境：
 * 前者两边都成熟、随你挑，后者两边都还没做成、挑不挑都一样。
 */
export type DecisionLean = "self" | "platform" | "both" | "neither" | "none";

export type Decision = {
  id: string; zh: string; owner: DecisionOwner;
  /** 引能力 id，覆盖度由 support[] 现算；null = 这条不是一项能力 */
  cap: string | null;
  handle: string; note?: string;
  /**
   * 适用性判断。**判断，不是厂商说法** —— 页面必须标出来。
   *
   * 负责人 2026-08-16 定的主线：「按做视频的几个步骤，分别对比项目下
   * 自持、平台的适应性。」在此之前这一页的骨架是「这一步归谁」，
   * 而那个分法**本身没什么用** ——「自持 vs 官网各有优点，
   * 主要是物美价廉四个字，而且看适用场景」。
   *
   * 所以判断里**不写死数字**：两侧的数字就在同一行显示，
   * 写进句子只会和图打架，而且数据一更新句子就成了错的。
   */
  fit?: string;
  /**
   * 场景 → 用什么。**答案按场景给，不按「谁拥有它」分组。**
   * 负责人否掉了两栏对比之后定的形式：读者要的是「我这种情况该用什么」。
   */
  scenarios?: { when: string; use: string }[];
  /**
   * **说「这一格是空的」时，搜过哪些词。**
   *
   * 2026-08-17 这一天，我在同一个错上栽了五次：Godot 侧、自动开发游戏、
   * 2D 精灵图、骨骼动画、音效 —— **全是搜得太窄就下了能力断言**，
   * 五条后来全被推翻。负责人问「后边这几个断点没有 AI 可实现吗」时才查出来。
   *
   * 错的形状很固定：**把「没有专门为这个场景做的工具」写成了「AI 做不到」**。
   * 骨骼那一格最典型 —— 搜 `game rigging` 几乎什么都没有，
   * 搜 `auto rigging 3d` 立刻冒出 SIGGRAPH 论文项目，因为它服务的是整个 3D 行业。
   *
   * 所以「空」这个结论要付出代价：**列出搜过的词，写上日期**。
   * 好处有两层 —— 逼自己搜够（少于十二组根本不该下结论），
   * 以及下次复查时有据可依，不用从零再搜一遍。
   *
   * 由 R89 强制：`fit` 里出现「没有 / 没人做 / 一个都没有」这类断言而缺这个字段，校验红。
   */
  searched?: { terms: string[]; at: string; note?: string };
};
/** 图种。四类各自回答一类问题：东西怎么摆 / 数据怎么走 / 谁先谁后 / 怎么搭起来。 */
export type DiagramKind = "架构图" | "流程图" | "时序图" | "工程图";

export type TopicProject = {
  id: string; zh: string; url: string; stars: number;
  license: string;
  /**
   * 仓库活跃度。**星数绝对值在新领域里不是名气，是年龄的函数** ——
   * 负责人 2026-08-16：「有 660 个星也可能跟它刚开源有关，要结合开源时间看，不然不公平。」
   *
   * 所以看两个轴，缺一不可：
   * - `stars_per_month` 增速 —— 公平的「有多少人在意」
   * - `stale_months` 停更月数 —— 活不活。**增速低不等于死**（kohya 164/月但一直在维护），
   *   **星数高也不等于活**（ControlNet 3.4 万星，停更 30 个月）
   */
  created_at?: string; pushed_at?: string;
  stars_per_month?: number; stale_months?: number;
  /**
   * permissive 可商用 · copyleft 传染性 · noncommercial 不可商用
   * · restricted **有条件商用**
   *
   * `restricted` 是 2026-08-16 为 MiniMax H3 加的第四档：它允许商用，
   * 但**把使用地区和营收规模写进了许可证**（H3 排除欧盟 / 英国 / 韩国 / 美国，
   * 年营收超两千万美元要另行书面授权）。塞进前三档哪一档都是错的 ——
   * 说它「可商用」漏掉了硬门槛，说它「不可商用」是假的。
   * **限制条件本身要写在 `license` 字段里，读者得看得见具体是什么条件。**
   */
  license_class: "permissive" | "copyleft" | "noncommercial" | "restricted";
  /**
   * 许可证的附加条件（地区排除、营收门槛、署名要求、权重与代码不同许可…）。
   *
   * **和 `license` 分开存**：卡上的小圆标只放许可证名字，
   * 把整句条件塞进圆标里，那一行会拉成一条横幅，还把后面的标签挤到看不见。
   * 条件不是不重要 —— 它单独一行显示在卡里，字小但读得到。
   */
  license_note?: string;
  /**
   * 特点标签。**只回答一件事：它凭什么跟别人不一样。**
   *
   * 许可证、还活不活、星数一律不做标签 —— 那些已经有专门的圆标，
   * 重复一遍只会把卡挤满。写不出三个就写两个：硬凑第三个必然凑出
   * 「功能全」「易上手」这种谁都能贴的话，那不是信息是噪音。
   */
  tags?: string[];
  /** 这个项目管哪几个决定 */
  decisions: string[];
  /**
   * 它属于哪一类项目 —— 引 `Topic.groups` 的 id。**专项页的分 tab 就按这个。**
   *
   * 和 `role` 不是一回事：`role` 说的是它在页面上怎么摆（底座 / 工具 / 整包），
   * `group` 说的是**它干什么活**。负责人 2026-08-16 定的分法：
   * 「就按开源项目的类型，做不同的 tab 页」——不按片型、不按步骤、不做两侧对比。
   */
  group: string;
  /**
   * tab 内的小节。**2026-08-17 把七个 tab 并成「模型与组件」时，
   * 原来的七类降级成了这里** —— 分类信息一点没丢，只是不再占顶栏。
   * 顶栏留给现在真正在动的那两类（一站式、Agent 与 Skill）。
   */
  sub?: string;
  /**
   * base 底座（横跨多个决定，只出现一次）· tool 单点工具（挂在决定下面）
   * · allinone 整包（**它替你做决定，所以要单独一篇**）
   */
  role: "base" | "tool" | "allinone";
  /** 整包专用：它替你做掉了哪几个决定 / 还留给你哪几个 */
  takes_over?: string[]; leaves?: string[];
  /**
   * 整包专用：**画面到底从哪来** —— 这是整包篇的分水岭。
   * stock 检索素材库 · yours 你自己的素材 · cloud 云端 API · local 本地权重
   */
  engine?: "stock" | "yours" | "cloud" | "local";
  scope: string; control: string; hw: string; arch?: string;
  /** ⚠️ 判断，不是厂商说过的话 */
  good: string[]; bad: string[]; unfit: string;
  src: string; verified_at: string;
  /**
   * 图：mermaid 源存在数据里，构建时渲染成 public/diagrams/<id>.svg。
   * `kind` 是图种（架构图 / 流程图 / 时序图 / 工程图）—— 读者得知道这张图在回答哪一类问题。
   */
  diagrams?: { id: string; title: string; kind: DiagramKind; src: string; verified_at: string; mermaid: string }[];
  /**
   * **DeepWiki 没有索引这个仓库时的明写豁免。**
   *
   * 项目页的图一律来自 DeepWiki（由源码生成），R81 因此要求每个项目至少两张。
   * 但确实有仓库 DeepWiki 没收 —— 这时候只有两条路：把项目整个漏掉，
   * 或者**把「为什么没图」写在页面上**。前者是静默丢内容，所以选后者。
   *
   * `wiki: "none"` 时 R81 放行，但 `wiki_note` 变成必填，且页面必须显示它。
   * **豁免要看得见，不能悄悄生效。**
   */
  wiki?: "none";
  wiki_note?: string;
  /**
   * 用这个项目的教程。
   *
   * 负责人 2026-08-16：「也可以在开源项目里，配一些使用此项目的教程。」
   *
   * **只收官方口径**：仓库 README 里链出去的、官方文档站、作者本人的视频，
   * 以及 ComfyUI 官方文档给的原生工作流示例（这些项目绝大多数人就是在 ComfyUI 里用的）。
   * 三方博客不收 —— 它们烂得比我们回查得动的速度快，而一条 404 的教程比没有教程更伤。
   *
   * `page_title` 存的是**页面自己报的标题**，不是我们起的名字：
   * 下次回查时链接还在、内容换了，靠它才发现得了。
   */
  tutorials?: {
    title: string; page_title?: string; url: string;
    kind: "官方" | "社区"; lang: "zh" | "en"; verified_at: string;
  }[];
  /**
   * 自持能力三问。**「自己把握制作能力」必须落成能查的东西，否则永远是形容词。**
   * weights 权重在不在本地 · seed 种子能不能填 · swap 换掉它要动几处。
   */
  autonomy?: {
    weights: "local" | "api" | "na";
    seed: "yes" | "partial" | "no" | "na";
    swap: "1" | "few" | "many";
    note: string;
  };
  /**
   * 动手层：装它要过哪几关 · 改哪个文件能改什么 · 坑在代码哪一处。
   *
   * ⚠️ `layers` 必填，写**实际做到了哪几层**，不是打算做到哪几层：
   * - `docs`  README 与官方文档
   * - `wiki`  DeepWiki 的全部章节（由源码生成，等于二手的源码层）
   * - `issue` 高频 issue 与维护者回复
   * - `bench` 自己真跑过
   *
   * 2026-08-16 我把六个项目写成 docs 层却没标出来，页面上看着和读过源码的一样。
   * 负责人当场问「你不是说一个项目要一两小时吗，六分钟就做完了？」
   * **这个字段就是为了让这种事下次自己露出来。**
   *
   * ## 为什么没有 source 这一档
   *
   * 不是读不动，是**它腐坏得比我们能维护的速度快**：代码一改，
   * 「源码某处有个坑」这种断言就悄悄失效，而采集链盯不住它
   * （watch 抓的是网页、requote 回查的是引文）。
   *
   * 而且方法上也不对：**「坑」是经验事实，不是代码事实。**
   * 源码告诉你代码在做什么，**issue 才告诉你人在哪儿摔了** ——
   * 后者有编号、有日期、有维护者回复，可回查可标核验日期，正好合这个站的纪律。
   */
  hands?: {
    layers: ("docs" | "wiki" | "issue" | "bench")[];
    install: { step: string; gate: string }[];
    modify: { path: string; effect: string }[];
    pitfalls: { where: string; note: string }[];
    /** issue 层的出处（编号在各条 note 里，这里记检索口径与核验日） */
    issue_src?: string;
  };
};
export type TopicChapter = {
  id: string; zh: string;
  /** entry 入口篇 · axis 自持程度轴上的一档 · evidence 证据层，不排在轴上 */
  kind: "entry" | "axis" | "evidence";
  state: "live" | "planned";
  axis_pos?: number; intro: string;
  /** 片型篇专用：应用 id → 决定 id → 权重 3 命门 / 2 重要 / 1 次要 / 0 不适用 */
  matrix?: Record<string, Record<string, number>>;
};
/**
 * 项目类型。**专项页的骨架就是这一份清单。**
 *
 * 分类轴换过三次，前两次都被否：先是「这一步归谁」（自持 / 一半 / 平台），
 * 再是「做视频的九道工序」。第三次负责人说到底：
 * 「不要对比、不要片型、步骤。就按开源项目的类型，做不同的 tab 页。」
 *
 * 判分类对不对只有一条：**这一类里的项目彼此可替换吗。**
 * 能替换才是一类 —— 三个声音项目里挑一个是真选择，
 * 「都归自持」里挑一个不是。
 */
export type TopicGroup = {
  id: string; zh: string; intro: string;
  /**
   * 这个 tab 里摆的是什么。默认 `projects`。
   * 负责人 2026-08-16 的原话是「按类别划分开源项目**或内容**」—— 作品就是那个「内容」。
   */
  kind?: "projects" | "works" | "basics";
};

/**
 * 作品：这条路做出过什么。
 *
 * **收录规矩：只收制作方自己公开说明过管线的作品** —— 查不到用了什么就不收。
 * 这条规矩现在咬到了一个结论：公开写明过管线的中文 AI 影视作品，
 * 用的全是闭源平台模型；**开源侧一部都没有**。不缺模型也不缺教程，
 * 缺的是有人把一部完整作品的管线公开出来。
 *
 * `open` 记的是那条管线的性质：closed 全闭源平台 · open 全开源 · mixed 混着用。
 */
export type TopicWork = {
  id: string; zh: string; year: string; maker: string; stack: string;
  open: "closed" | "open" | "mixed";
  note: string;
  src: { title: string; url: string }[];
  verified_at: string;
};

/**
 * 查过、按规矩没收的作品。**「我们查了，没查到」和「我们没查」是两件事** ——
 * 不写下来，下次还会有人把同一条重新查一遍，而且会误以为是遗漏。
 */
export type TopicWorkSkipped = { zh: string; why: string; verified_at: string };

/**
 * 视频常识：给不做视频的人的入门读物清单。
 *
 * 负责人 2026-08-16：「AI 视频模型把制作视频的门槛降得很低，谁都可以制作，
 * 但其实对于视频的相关知识是不知道的……可以不局限在 AI 视频制作。」
 *
 * **我们不写教材，只做索引。** 这些知识有一百年的积累，自己重写一版
 * 既没有出处、又必然按记忆填数据 —— 那正是这个站最忌讳的事。
 *
 * 收录标准和项目教程不同（视频常识没有「官方」），换成两条：
 * **词条型**（定义稳定、可回查）与**成体系的免费指南**（有主体、成系列）。
 * 个人博客与聚合站转载一概不收 —— 代价是中文侧偏少，这一点要在页面上直说。
 *
 * `note` 是**我们的判断**：这一条解决你哪个困惑。`page_title` 用来发现「链接还在、内容换了」。
 */
/**
 * 三大段。**编号不是装饰，是真的有先后**：
 * 先会说话（基本功）→ 再谈风格（点名要的那些）→ 最后管合规。
 * 十四组一个重量摆在一起就是一堵墙，负责人 2026-08-17：「好乱……标题和内容要层次分明」。
 */
export type TopicBasicPart = { id: string; no: string; zh: string; intro: string };

export type TopicBasic = {
  id: string; zh: string; intro: string;
  /** 属于哪一大段，引 `TopicBasicPart.id`。 */
  part?: string;
  items: {
    title: string; url: string; site: string; lang: "zh" | "en";
    note: string; page_title?: string; verified_at: string;
    /**
     * **为什么这么拍好看。** 负责人 2026-08-17：
     * 「你只说了『韦斯·安德森的对称正面平移』，谁知道是什么呢？」
     *
     * `note` 说的是「这一条解决你哪个困惑」（冲着 AI 视频说），
     * `why` 说的是**通识**：这么拍观众会有什么感觉。两句都是我们的判断。
     */
    why?: string;
    /**
     * 一部代表作 + 百科条目。**看一眼就懂，不用信我们的话** ——
     * 这是三样里唯一不靠我们的：链接指向别人写的条目。
     */
    example?: { zh: string; url: string; page_title?: string; verified_at: string };
  }[];
};

export type Topic = {
  id: string; zh: string; en: string; intro: string;
  /**
   * 这个专项属于哪一卷（引 `Domain.id`）。**可以没有 —— 没有就是「横跨多卷」。**
   *
   * 导航最左边那块要靠它。2026-08-17 负责人截图指出：站在
   * `/atlas/topic/game` 上，左上角写着「AI 视频」。原因是 `topic` 既不是方向 id、
   * 也不在跨方向页的名单里，于是 Nav 退回了第一个 live 方向。
   *
   * **这是同一个错第三次犯**（先 skill 页、再 model / capability 页），
   * 三次的根都一样：**新加一类路由，没人问它「属于谁」。**
   *
   * 视频专项 `domain: "video"` —— 它讲的确实是视频卷的事。
   * 游戏专项**不填** —— 做游戏横跨 3D、声音与代码，站里根本没有「游戏」这一卷，
   * 硬挂到任何一卷都是假的。不填时导航显示「全站」，那是实话。
   */
  domain?: string;
  groups: TopicGroup[];
  /** tab 内的小节定义。项目靠 `sub` 引它。 */
  subgroups?: TopicGroup[];
  /**
   * README 原文存在哪、什么时候抓的。
   * 正文按 `data/readme/<项目 id>.md` 一个项目一个文件存 —— **不塞进这个 JSON**：
   * 40 多份加起来上兆，塞进来这个文件的 diff 就没法看了。
   */
  readme_src?: { dir: string; note: string; fetched_at: string };
  works?: TopicWork[];
  works_skipped?: TopicWorkSkipped[];
  basics?: TopicBasic[];
  basic_parts?: TopicBasicPart[];
  decisions: Decision[]; chapters: TopicChapter[]; projects: TopicProject[];
  /**
   * **自述与实测打架的地方。** 见 `lib/claims.ts` 与 `/claims` 页。
   *
   * 这一类和许可证那几类不一样：**算不出来**。
   * 它是两段文字的矛盾（README 说 A、issue 说 B），得有人读过两边才判得了。
   * 所以它手写 —— 但**两侧都必须带出处**，少了出处就退回成传闻，
   * 而传闻正是这一页要挡的东西。
   *
   * `project` 引 `projects[].id`。由 R90 强制查出处与引用。
   */
  conflicts?: {
    project: string; what: string; said: string; hit: string;
    src: { title: string; url: string }[]; verified_at: string;
  }[];
};

export const atlas = raw as unknown as {
  platforms: Platform[];
  availability: Availability[];
  domains: Domain[];
  excluded: Excluded[];
  version: string;
  generated_at: string;
  note: string;
  changelog: string[];
  states: Record<State, string>;
  tiers: Record<string, string>;
  capabilities: Capability[];
  models: Model[];
  orgs: Org[];
  pricing: Price[];
  versions: Version[];
  skills: Skill[];
  applications: Application[];
  topics: Topic[];
  toolkit: Toolkit[];
  effect: Effect[];
  discount: Discount[];
  investments: Investment[];
  sources: Record<string, Source>;
  support: Cell[];
};

/** 当前方向（现在只有一个）。加第二个方向时这里改成按路由/切换器取。 */
export const currentDomain = (): Domain =>
  atlas.domains.find((d) => d.state === "live") ?? atlas.domains[0];

/** 这个方向的全部轨，按数据顺序。 */
export const tracksOf = (d: Domain = currentDomain()): Track[] => d.tracks ?? [];

/**
 * 轨的显示名。**不许再写三元表达式。**
 * `long` 要「离线出片轨」，`short` 要「离线出片」——
 * 两种都在页面上用过，所以都从数据里取，不在调用处拼。
 */
export function trackName(id: Klass, form: "long" | "short" = "long"): string {
  const t = tracksOf().find((x) => x.id === id);
  if (!t) return id;                 // 数据里没登记就照实显示 id，不编一个名字
  return form === "short" ? t.short : t.zh;
}

const index = new Map(atlas.support.map((s) => [`${s.m}::${s.c}`, s]));

export function cell(modelId: string, capId: string): Cell {
  return index.get(`${modelId}::${capId}`) ?? { m: modelId, c: capId, state: "unknown" };
}

export const isYes = (m: string, c: string) => cell(m, c).state === "yes";

/**
 * 模型显示名 = Family + 当前版本。版本会变，Family 不会。
 *
 * 有些 Family 名的末词本身就是版本号的前缀（Vidu **Q** / Q2、Runway **Gen** / Gen-4.5、
 * Decart **Lucy** / Lucy 2），直接拼会拼出「Vidu Q Q2」。这里把重复的末词吃掉。
 * 「MiniMax Hailuo」+「H3」不受影响 —— H3 不以 Hailuo 开头，两个词都得留。
 */
export function label(m: Model) {
  const last = m.family.split(" ").pop() ?? "";
  if (last && m.version.startsWith(last)) return `${m.family.slice(0, -last.length).trim()} ${m.version}`.trim();
  return `${m.family} ${m.version}`;
}

const isCore = (m: Model) => (m.tier ?? "core") === "core";

/** 主图与主表只吃 core。extended 单独一节列，不混进统计（否则会污染对外的 ⬜ 占比）。 */
/**
 * **当前方向的模型。** 加了 AI 图像之后，`atlas.models` 里同时装着两个方向的东西 ——
 * 直接遍历它就会把图像模型混进视频的地图里。
 *
 * 这不是假设：2026-08-11 加完图像花名册后在浏览器里实测，`/models` 与 `/map`
 * **两页都把 13 条图像产品线渲染出来了**，而 validate 全绿 ——
 * **校验管的是数据自洽，管不了「这条数据该不该出现在这一页」。**
 */
export const domainModels = (d: string = currentDomain().id) =>
  atlas.models.filter((m) => (m.domain ?? "video") === d);

/**
 * 主表 / extended 都按**轨 + 方向**过滤。
 * 只按 class 过滤现在没出事，只是因为 clip/realtime/still 三个值恰好不撞 ——
 * **那是运气不是设计**，下个方向随便起一个同名轨就串了。
 */
export const modelsOf = (k: Klass, d: string = domainOfTrack(k)) =>
  atlas.models.filter((m) => (m.domain ?? "video") === d && m.class === k && isCore(m));
export const extendedOf = (k: Klass, d: string = domainOfTrack(k)) =>
  atlas.models.filter((m) => (m.domain ?? "video") === d && m.class === k && !isCore(m));
/**
 * 某一条轨的能力轴。**必须同时按方向过滤。**
 *
 * `class: "both"` 的本意是「这个方向的两条轨都算」（视频的开源权重就是），
 * 但它**只说了轨、没说方向** —— 于是加上 AI 图像之后，视频的「开源权重」
 * 漏进了图像的表，还显示 0/7（图像模型当然没有视频那个能力 id 的格子）。
 *
 * 实测抓到的：/atlas/image 的表里「开源权重」出现了两行。
 * 和 domainModels 那次是同一类洞 —— **加了第二个方向之后，
 * 任何只按 class 过滤的地方都会串方向。**
 */
/**
 * 由轨反查它属于哪个方向。
 *
 * **比默认取 currentDomain 稳。** 组件（TruthTable）手上有的是轨，不是方向；
 * 默认成「当前方向」的话，从 /atlas/image 调用 `capsOf("still")` 会拿 video
 * 去过滤，结果是空表 —— 而空表在页面上看起来只是「还没数据」，不像 bug。
 * 轨 id 在全局唯一属于一个方向，让它自己说。
 */
/**
 * 按方向分组。**三个公共页（变更 / 注意事项 / 工具站）共用这一个。**
 *
 * 负责人 2026-08-11：这三页做成公共的没问题，「不管视频、图像、3D、世界模型等后续
 * AI 方向，都可以往这里放内容。但也应该在对应页面做一定的分类才是。**混在一起还是不够好**」。
 *
 * 顺序照 `atlas.domains` 走，没有归属的落到最后一组 ——
 * **加一个方向不用改任何页面**，这正是分组要泛化的原因。
 */
export function groupByDomain<T>(items: T[], of: (x: T) => string | undefined) {
  const bag = new Map<string, T[]>();
  for (const it of items) {
    const k = of(it) ?? "";
    bag.set(k, [...(bag.get(k) ?? []), it]);
  }
  const out = atlas.domains
    .map((d) => ({ id: d.id, name: d.name, items: bag.get(d.id) ?? [] }))
    .filter((g) => g.items.length);
  const rest = [...bag.entries()].filter(([k]) => !atlas.domains.some((d) => d.id === k));
  for (const [, v] of rest) out.push({ id: "", name: "不限方向", items: v });
  return out;
}

export const domainName = (id: string) =>
  atlas.domains.find((d) => d.id === id)?.name ?? id;

export const domainOfModel = (id: string) =>
  atlas.models.find((m) => m.id === id)?.domain ?? "video";

export const domainOfTrack = (k: Klass): string =>
  atlas.domains.find((d) => (d.tracks ?? []).some((t) => t.id === k))?.id ?? currentDomain().id;

export const capsOf = (k: Klass, d: string = domainOfTrack(k)) =>
  atlas.capabilities.filter(
    (c) => (c.domain ?? "video") === d && (c.class === k || c.class === "both"),
  );

/** 实现了某能力的模型 —— 点一个能力节点时高亮的就是这批（= 「这个能力去哪用」） */
export const modelsWith = (capId: string) =>
  atlas.models.filter((m) => isYes(m.id, capId)).map((m) => m.id);

/**
 * 一个 Skill 能用哪些模型做 —— 并且**分成两堆**。
 *
 * `support[].via` 早就记着这件事了：`native` 是**原生模型**就能做，
 * `separate-task` 是得用**它的变体** —— Kling 官方 API 清单里
 * Kling 3.0 与 Kling 3.0 Motion Control 是并列的两个模型，不是同一个模型的一个开关。
 * 那个变体具体叫什么，看那一格的 note。
 * 以前这个事实只以一句散文躺在 limits 里（「这几家是另一个接口…」），
 * 于是六个 Skill 页看上去都是一模一样的一排模型名。现在它是结构。
 */
export function skillModels(skill: { cap?: string; native?: string[] }) {
  const ids = skill.native ?? [];
  const ms = ids.map((id) => atlas.models.find((m) => m.id === id)).filter(Boolean) as Model[];
  const viaOf = (m: Model) => (skill.cap ? cell(m.id, skill.cap).via : undefined);
  return {
    direct: ms.filter((m) => viaOf(m) !== "separate-task"),
    separate: ms.filter((m) => viaOf(m) === "separate-task"),
  };
}

const resourceKindForWorkflow = (url: string): ApplicationResourceKind =>
  url.includes("docs.comfy.org") ? "docs" : "skill";

/**
 * 场景页资源排序（docs/应用开源资源治理.md）。
 *
 * 先把「能不能继续做」排在「去哪里学」前面，再看来源层级；不把 Star
 * 或一条主观推荐语压成可信度分数。最后用名称和 URL 做稳定兜底，避免
 * 上游抓取顺序变化导致页面每次刷新都跳动。
 */
const RESOURCE_KIND_ORDER: Record<ApplicationResourceKind, number> = {
  project: 0,
  skill: 1,
  docs: 2,
  course: 3,
};

const resourceSourceOrder = (resource: ApplicationResource) =>
  atlas.sources[resource.src]?.tier === "official" ? 0 : 1;

const compareApplicationResources = (a: ApplicationResource, b: ApplicationResource) =>
  RESOURCE_KIND_ORDER[a.kind] - RESOURCE_KIND_ORDER[b.kind]
  || resourceSourceOrder(a) - resourceSourceOrder(b)
  || a.name.localeCompare(b.name, "zh-Hans")
  || a.url.localeCompare(b.url);

/**
 * 应用页的资源由两部分组成：应用额外推荐的课程/文档 + 关联 Skill 已核过的公开项目/工作流。
 * 这样资源只维护一次，动作复刻的仓库不会在「短剧」「漫剧」「特效」三处各抄一份。
 */
export function applicationResources(app: Application): ApplicationResource[] {
  const byUrl = new Map<string, ApplicationResource>();
  for (const r of app.resources ?? []) byUrl.set(r.url, { ...r, evidence: r.evidence ?? [] });

  /** 已有同 URL 的卡就只追加证据，不再丢弃 —— 见 ApplicationResourceEvidence 的注释。 */
  const take = (url: string, make: () => ApplicationResource, ev: ApplicationResourceEvidence) => {
    const hit = byUrl.get(url);
    if (hit) {
      if (!hit.evidence.some((e) => e.skill_id === ev.skill_id && e.quote === ev.quote)) hit.evidence.push(ev);
      return;
    }
    byUrl.set(url, { ...make(), evidence: [ev] });
  };

  for (const skillId of app.skills) {
    const s = atlas.skills.find((x) => x.id === skillId);
    if (!s) continue;
    for (const o of s.opensource ?? []) {
      if (!o.url) continue;
      take(o.url,
        () => ({
          kind: "project", name: o.name, url: o.url!, src: o.src, quote: o.quote,
          // `license` 必须**逐字段判断有没有写**，不能用 `o.license ?? undefined` ——
          // 那会把「查过、确实没有」的 null 压成「还没采」，三态又塌回两态。
          ...("license" in o ? { license: o.license } : {}),
          ...(o.note ? { note: o.note } : {}),
          evidence: [],
        }),
        { skill_id: s.id, skill_zh: s.zh, quote: o.quote });
    }
    for (const w of s.workflow ?? []) {
      take(w.url,
        () => ({
          kind: resourceKindForWorkflow(w.url),
          name: w.name,
          url: w.url,
          src: w.src,
          quote: w.quote,
          // 官方那句原来写的是「官方公开教程或工作流」—— **「文档」那个标签已经说了同一件事**，
          // 而它会在每一张官方卡上重复一遍。复述不是强调，是噪音；社区那句留着，
          // 因为「先看依赖和显存」是能照着做的事。
          note: w.note ?? (w.kind === "community" ? "社区维护；先看依赖和显存要求" : undefined),
          ...("license" in w ? { license: w.license } : {}),
          evidence: [],
        }),
        { skill_id: s.id, skill_zh: s.zh, quote: w.quote });
    }
  }

  return [...byUrl.values()].sort(compareApplicationResources);
}

/**
 * 两个模型的能力对比。§59.1 的红利：选中两个模型就是 Compare，
 * **不需要单独做一个 Compare 页面**。只在同轨内有意义。
 */
export function compare(a: string, b: string) {
  const ma = atlas.models.find((m) => m.id === a)!;
  const both: string[] = [];
  const onlyA: string[] = [];
  const onlyB: string[] = [];
  for (const c of capsOf(ma.class)) {
    const x = isYes(a, c.id);
    const y = isYes(b, c.id);
    if (x && y) both.push(c.id);
    else if (x) onlyA.push(c.id);
    else if (y) onlyB.push(c.id);
  }
  return { both, onlyA, onlyB };
}

/**
 * 透明度 = ⬜ 的多少。
 *
 * **不用我们主观打分**（§59.4.e 原来设想的是人工评 🟢🟡🔴）——
 * 九家都用官方文档逐格核过之后，剩下的 ⬜ 就是这家厂商没公开说的部分，
 * 是从公开事实算出来的、可复核的数。
 *
 * 而且它**必须按家看，不能报总数**：35 格里 Wan 一家占 10 格、
 * 前三家占 60%，报总数会让人以为厂商普遍不透明。
 */
export function transparency(k: Klass = "clip") {
  const caps = capsOf(k).length;
  return modelsOf(k)
    .map((m) => {
      const unknown = capsOf(k).filter((c) => cell(m.id, c.id).state === "unknown").length;
      return { model: m, unknown, caps, rate: unknown / caps };
    })
    .sort((a, b) => b.unknown - a.unknown);
}

export const avail = (p: string, m: string) => atlas.availability.find((v) => v.p === p && v.m === m);

export function tally(k?: Klass) {
  const ms = k ? modelsOf(k) : atlas.models;
  const ids = new Set(ms.map((m) => m.id));
  const t = { yes: 0, no: 0, unknown: 0, total: 0 };
  for (const s of atlas.support)
    if (ids.has(s.m)) {
      t[s.state] += 1;
      t.total += 1;
    }
  return t;
}


/** 公司实体查找。前台一律走这个，不要再直接读模型上的字符串。 */
export const orgOf = (m: Model | string): Org | undefined => {
  const id = typeof m === "string" ? atlas.models.find((x) => x.id === m)?.org : m.org;
  return atlas.orgs.find((o) => o.id === id);
};

/** 显示用的厂商名：公司 + 团队（「字节跳动 · Seed」）—— 团队是真实信息，不该被合并吞掉。 */
export const vendorName = (m: Model): string => {
  const o = orgOf(m);
  if (!o) return "?";
  return m.team ? `${o.zh} · ${m.team}` : o.zh;
};

/**
 * 生命周期标签的展示口径。**只此一份。**
 * 刚才 `Sel` 在两个文件里各写了一份，类型立刻对不上 —— 同一个口径不许有第二份。
 */
export const STATUS: Record<string, { tag: string; cls: string }> = {
  discontinued: { tag: "已停服", cls: "text-no line-through" },
  superseded: { tag: "非主力", cls: "text-muted" },
  maintained: { tag: "只维护，无新代", cls: "text-muted" },
};

/**
 * **这张表必须覆盖 `active` 之外的每一种 status。**
 *
 * 2026-08-14 具身智能卷收 OpenVLA 时炸出来的：它是全站第一个 `maintained`
 * 的模型（主仓停在 2024-06，之后两年只有基准微调），而这张表当时只有两项。
 * `/compare` 那一页写的是 `STATUS[m.status].cls` —— **没有 `?.`**，
 * 于是整个构建挂在 `/compare/molmoact-vs-openvla` 上，报
 * `Cannot read properties of undefined (reading 'cls')`。
 *
 * 三件事同时是错的，缺一不会炸：
 * 1. 数据里出现了一个新 status；
 * 2. 这张表没跟上；
 * 3. **`validate.mjs` 当时根本不校验 `model.status`** —— 写成 `maintaned`
 *    也一样静默通过，然后在构建时才炸。
 *
 * 第 3 条才是根因，已补 R74。这里留 `STATUSES` 供人对照。
 */
export const STATUSES = ["active", "maintained", "superseded", "discontinued"] as const;

/** 出现在 availability 表里的模型：core 全收 + extended 里真有上架记录的。 */
export const availModels = () => [
  ...modelsOf("clip"),
  ...atlas.models.filter((m) => (m.tier ?? "core") !== "core" && atlas.availability.some((v) => v.m === m.id)),
];

/**
 * 一条路的覆盖度：这项能力上，有几家给了官方说法。
 *
 * **现算，不落库。** 落库就会和真值表漂开 —— 而这一页卖的就是「和真值表对得上」。
 *
 * 口径两条，都要和全站一致，否则同一件事在两页上是两个数：
 * - 只数**成片类**（`clip`）：实时类那几个不做成片，数进来会稀释分母
 * - 只数**核心模型**（`modelsOf` 已经在做）：真值表展示的就是这一批，
 *   拿全部 21 个成片模型去数会得到另一套数字 —— 我起草时正是这么算的，
 *   页面一跑出来就和真值表对不上。**分母必须跟着数字一起显示**，
 *   「5 家支持」不写清是 5/10 还是 5/21，就是一句没头没尾的话。
 */
/**
 * 一步的**能力拆解**：有这项能力的十家逐一列出，各自带官方原文。
 *
 * 这是专项页的重心（负责人 2026-08-16：「你就把每一步有对应能力的项目、平台
 * 做详细拆解就好，重心是这个能力拆解」）。所以返回的不是一个统计数字，
 * 而是**每一家各自是什么状态、原文怎么说、出处在哪**。
 *
 * 排序：说了能做的在前、明确说不行的其次、没说的最后 ——
 * **⬜「官方没说」不是缺口，是一条事实**，所以它照样列出来，不省略。
 */
export function capBreakdown(capId: string) {
  const RANK = { yes: 0, no: 1, unknown: 2 } as const;
  return modelsOf("clip")
    .map((m) => {
      const c = cell(m.id, capId);
      return { id: m.id, zh: label(m), state: c.state, note: c.note ?? null, src: c.src ?? null };
    })
    .sort((x, y) => RANK[x.state] - RANK[y.state] || x.zh.localeCompare(y.zh, "zh"));
}

export function forkCoverage(capId: string) {
  const models = modelsOf("clip");
  let yes = 0, no = 0, unknown = 0;
  for (const m of models) {
    const s = cell(m.id, capId).state;
    if (s === "yes") yes++;
    else if (s === "no") no++;
    else unknown++;
  }
  return { yes, no, unknown, total: models.length };
}

/** 片型篇：应用 id → 中文名。片型就是视频卷的应用层，不另立一套分类。 */
export const topicAppName = (id: string) =>
  atlas.applications.find((x) => x.id === id)?.zh ?? id;
