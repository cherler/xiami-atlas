/**
 * 数据校验。**「git 当数据库」能撑住的前提**（§59.4.c）：
 * 手写 JSON 坏掉时要有人喊一声，否则前台只会静默地少画一条边。
 *
 * 两条核心规则：
 *   R4 —— `yes` 必须有来源。没有来源的「支持」就是猜的（§26）。
 *   R9 —— 格子记的 `verified_for` 必须等于该模型当前 `version`。
 *          这条拦的是**最阴的一种腐烂**：版本升了，旧结论被悄悄挂到新版本名下。
 *          见 data/ontology.md 规则三之一。
 *          例外只有一种：能力本来就长在同门另一支型号上（Kimi 的视觉在 K2.6、
 *          Qwen 的 FIM 在 coder 那支）。那不是腐烂，是产品线的形状 ——
 *          填 `sibling` 明说是哪一支，R9c/d/e 接手，前台把型号名印出来。
 */
import { readFileSync, existsSync } from "node:fs";
/** 快讯挂多久的口径和 alert.mjs 共用一份 —— 各算各的会得出不同的条数。 */
import { untilOf, isLive, CYCLE_DAYS, liveAlerts } from "./lib/alert-window.mjs";

const a = JSON.parse(readFileSync(new URL("../data/atlas.json", import.meta.url), "utf8"));
const watchRegistry = JSON.parse(readFileSync(new URL("../data/sources.json", import.meta.url), "utf8"));
const errs = [];
const warns = [];

const caps = new Map(a.capabilities.map((c) => [c.id, c]));
const models = new Map(a.models.map((m) => [m.id, m]));
const srcIds = new Set(Object.keys(a.sources));
const watchSources = new Map((watchRegistry.sources ?? []).map((s) => [s.id, s]));
const seen = new Set();

/** 某个模型该不该有某项能力的格子 —— 分轨之后不再是全笛卡尔积（ontology 规则二）。 */
const applies = (m, c) =>
  (c.domain ?? "video") === (m.domain ?? "video") && (c.class === "both" || c.class === m.class);

/**
 * **只有 core 要求填满。**
 * Extended 是「库里有、不进主要视觉」（规则四）—— 它只保证「这东西存在」，
 * 不保证逐格核过。硬要求它填满，只会逼出一堆假的 ⬜。
 */
const isCore = (m) => (m.tier ?? "core") === "core";

for (const s of a.support) {
  const at = `${s.m} × ${s.c}`;
  const m = models.get(s.m);
  const c = caps.get(s.c);
  if (!m) { errs.push(`R1 未知模型：${s.m}`); continue; }
  if (!c) { errs.push(`R2 未知能力：${s.c}`); continue; }
  if (seen.has(`${s.m}::${s.c}`)) errs.push(`R3 重复格子：${at}`);
  seen.add(`${s.m}::${s.c}`);
  if (!["yes", "no", "unknown"].includes(s.state)) errs.push(`R0 非法状态 ${s.state}：${at}`);
  if (s.state === "yes" && !s.src) errs.push(`R4 「支持」但没有来源 —— 不许猜：${at}`);
  if (s.src && !srcIds.has(s.src)) errs.push(`R5 来源 id 不存在：${s.src}（${at}）`);
  if (s.state === "no" && !s.src && !s.note) warns.push(`R6 「不支持」既无来源也无说明：${at}`);
  if (m.tier && !["core", "extended"].includes(m.tier)) errs.push(`R12 非法 tier：${m.tier}（${m.id}）`);
  if ((c.domain ?? "video") !== (m.domain ?? "video"))
    errs.push(`R26 跨方向格子：${m.domain} 的模型不该有 ${c.domain} 的能力（${at}）—— 方向之间不共用能力轴`);
  else if (!applies(m, c)) errs.push(`R8 跨轨格子：${m.class} 的模型不该有 ${c.class} 的能力（${at}）`);
  if (!s.verified_for) errs.push(`R9a 缺 verified_for：${at}`);
  else if (s.sibling) {
    // 同门别支：**放行，但要求说清楚**。见 lib/atlas.ts 的 Cell.sibling 注释。
    if (s.verified_for !== s.sibling)
      errs.push(`R9c sibling 与 verified_for 对不上：${at} 说核在 ${s.sibling}，verified_for 却写 ${s.verified_for}`);
    if (s.sibling === m.version)
      errs.push(`R9d ${at} 的 sibling 填的就是当前版本 ${m.version} —— 那它不是别支，去掉这个字段`);
    if (!s.note) errs.push(`R9e 挂在同门别支却没写明白：${at} —— ✅ 不加说明会被当成旗舰就能做`);
  } else if (s.verified_for !== m.version) {
    if (s.recheck === m.version) {
      // 认了「核的是上一版」。**放行但记成待办** —— todo.mjs 会把它捞进待重核那一摞。
      if (!s.note) errs.push(`R9f 标了待重核却没写说明：${at} —— 读者要知道旧结论为什么还留着`);
    } else
      errs.push(`R9 版本对不上：${at} 记的是 ${s.verified_for}，但 ${m.family} 当前是 ${m.version}。` +
        `升级后必须重新核验或退回 unknown，不许沿用旧版结论。` +
        `（本来就长在同门另一支型号上 → 填 sibling；` +
        `厂商能力页还没跟上新版、暂时只能沿用旧版证据 → 填 recheck: "${m.version}"，它会进待办）`);
  }
}

/**
 * R73 —— **中文别名没填的模型，中文搜不到它。**
 *
 * 2026-08-13 全站搜索上线当天炸出来的：`m.zh` 是可选字段，22 个模型是空的
 * （声音卷 15 个、AI 3D 7 个）。后果有两层：
 * 一是搜索代码 `undefined.toLowerCase()` 直接白屏（已在 lib/search.ts 里兜底），
 * 二是**就算不崩，中文关键词也搜不到这些模型** —— 而这是个中文站。
 *
 * 记警告不记错误：**外国品牌本来就没有官方中文名**，硬编一个比空着更糟
 * （站上的规矩是不自己造名字）。但空着这件事要一直看得见。
 */
{
  // **标了 `zh_none`（查过、官方没有中文名）的不算** —— 否则这条警告永远不收敛
  const noZh = a.models.filter((m) => !m.zh && !m.zh_none);
  if (noZh.length) {
    const by = {};
    for (const m of noZh) by[m.domain ?? "video"] = (by[m.domain ?? "video"] ?? 0) + 1;
    warns.push(`R73 ${noZh.length} 个模型没填中文别名（${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(" · ")}）—— ` +
      `中文关键词搜不到它们。**有官方中文名的补上；查过确实没有的标 \`zh_none: true\`** —— ` +
      `别自己造名字，也别让「查过」和「没查」看起来一样（同 R21a）`);
  }
}

/**
 * R74 —— **模型的 `status` 必须是已知的那几种。**
 *
 * 2026-08-14 具身智能卷收 OpenVLA 时炸出来的。它是全站第一个 `maintained`
 * 的模型，而 `lib/atlas.ts` 的 `STATUS` 展示表当时只登记了 `discontinued`
 * 与 `superseded` 两项 —— `/compare` 那一页写的是 `STATUS[m.status].cls`，
 * 没有 `?.`，**整个构建挂在 `/compare/molmoact-vs-openvla` 上**。
 *
 * 展示表已经补齐，但那只是治标：**这条校验之前根本不看 `model.status`**，
 * 写成 `maintaned` 也一样静默通过，然后在构建时才炸。
 * 校验的职责就是让这种错在提交前红，而不是在出产物时红。
 *
 * ⚠️ 加新状态要动两个地方：这里的清单，和 `lib/atlas.ts` 的 `STATUS`
 * （`active` 不进展示表 —— 它是默认，不打标）。
 */
const STATUSES = ["active", "maintained", "superseded", "discontinued"];
for (const m of a.models) {
  if (m.status && !STATUSES.includes(m.status))
    errs.push(`R74 非法模型状态 ${m.status}：${m.family}（${m.id}）—— ` +
      `只认 ${STATUSES.join(" / ")}。加新状态要同时改 lib/atlas.ts 的 STATUS 展示表，` +
      `否则 /compare 会在构建时炸（2026-08-14 就是这么挂的）`);
}

/**
 * R75 —— **专项骨架引的能力 id 必须真实存在。**
 *
 * 「几家支持 / 几家明确不支持 / 几家没说」是从 `support[]` **现算**的。
 * 引一个不存在的能力 id，`forkCoverage()` 会老老实实数出「全部没说」——
 * **一个看起来很有信息量、其实全错的结论**，页面不报任何错。
 *
 * ⚠️ `cap: null` 合法且有意义：表示这条决定不是一项能力（如「画面构图」靠图像侧
 * 的结构信号），真值表里没有这一格 —— **那本身就是结论**。
 */
for (const t of a.topics ?? []) {
  for (const d of t.decisions ?? []) {
    if (d.cap === null || d.cap === undefined) continue;
    if (!a.capabilities.some((c) => c.id === d.cap))
      errs.push(`R75 专项「${t.zh}」的决定「${d.zh}」引了不存在的能力 ${d.cap} —— ` +
        `覆盖度会算成「全部没说」，页面不报错但结论是假的`);
  }
}

/**
 * R76 —— **片型矩阵的两个维度都必须对得上真源。**
 *
 * 行是视频卷的**应用层**（片型不另立一套分类），列是本专项的**决定**。
 * 任一侧写错，矩阵会静默少一格或多一格 —— 而矩阵是整篇的入口，
 * 读者按它决定「我该先夺回哪几个决定」。
 */
for (const t of a.topics ?? []) {
  for (const c of t.chapters ?? []) {
    if (!c.matrix) continue;
    for (const [appId, row] of Object.entries(c.matrix)) {
      if (!a.applications.some((x) => x.id === appId))
        errs.push(`R76 专项「${t.zh}」› ${c.zh} 的矩阵里有不存在的应用 ${appId}`);
      for (const dId of Object.keys(row)) {
        if (!(t.decisions ?? []).some((d) => d.id === dId))
          errs.push(`R76 专项「${t.zh}」› ${c.zh} 的矩阵里有不存在的决定 ${dId}`);
      }
    }
  }
}

/**
 * R77 —— **每个开源项目都必须同时有 good 和 bad，并且归到真实存在的决定上。**
 *
 * 只写好处的一栏是广告不是评估（同 Skill 页「已知限制必填」R45 的道理）。
 * `decisions[]` 引错则该项目在骨架上挂空，读者不知道它管哪一段。
 */
for (const t of a.topics ?? []) {
  for (const p of t.projects ?? []) {
    if (!p.good?.length || !p.bad?.length)
      errs.push(`R77 专项「${t.zh}」› ${p.zh} 缺 ${!p.good?.length ? "good" : "bad"} —— 只写好处的一栏是广告不是评估`);
    if (!p.unfit?.trim())
      errs.push(`R77 专项「${t.zh}」› ${p.zh} 缺「不适用」—— 没有错误使用场景的项目，说明我们没查够`);
    for (const dId of p.decisions ?? []) {
      if (!(t.decisions ?? []).some((d) => d.id === dId))
        errs.push(`R77 专项「${t.zh}」› ${p.zh} 引了不存在的决定 ${dId}`);
    }
  }
}

/**
 * R78 —— **声明了架构图，就必须真的渲染得出来。**
 *
 * 图的 SVG 由 `scripts/make-diagrams.mjs` 在构建前生成到 `public/diagrams/`。
 * 渲染失败时页面的处理是「少一张图而不是整页挂掉」—— 这个降级是对的，
 * **但它也意味着图没出来不会有任何人知道**。所以在这里拦。
 *
 * ⚠️ 这条只在产物存在时才严格判：干净 clone 上还没跑过生成脚本，
 * 不该因此让校验红。判据是「跑过了但缺这一张」。
 */
{
  const fs = await import("node:fs");
  const dir = "public/diagrams";
  const rendered = fs.existsSync(dir) ? new Set(fs.readdirSync(dir)) : null;
  if (rendered && rendered.size > 0) {
    for (const t of a.topics ?? [])
      for (const p of t.projects ?? [])
        for (const d of p.diagrams ?? [])
          if (!rendered.has(`${d.id}.svg`))
            errs.push(`R78 专项「${t.zh}」› ${p.zh} 的图「${d.title}」没有渲染产物 ` +
              `（${dir}/${d.id}.svg）—— 页面会静默少一张图，跑 node scripts/make-diagrams.mjs`);
  }
}

/**
 * R82 —— **每一步都要有适用性判断。**
 *
 * ⚠️ 2026-08-16 起专项页改按项目类型分 tab，**`fit` / `scenarios` 暂时没有页面在渲染**。
 * 九步本身仍然活着（项目页的「它管哪几个决定」和能力页靠它结网），
 * 这条规则继续守着那份判断不烂掉；但它现在守的是库存，不是在线的东西 ——
 * 哪天确定不再用，连字段带规则一起删，别留着当装饰。
 */
{
  for (const t of a.topics ?? [])
    for (const d of t.decisions ?? []) {
      if (!d.fit) errs.push(`R82 专项「${t.zh}」› 步骤「${d.zh}」没写结论（fit）`);
      if (!(d.scenarios ?? []).length)
        errs.push(`R82 专项「${t.zh}」› 步骤「${d.zh}」没写场景答案（scenarios）—— ` +
          `没有「什么场景用什么」，这一步就只剩一堆枚举`);
      if (d.lean !== undefined)
        errs.push(`R82 专项「${t.zh}」› 步骤「${d.zh}」还留着 lean —— ` +
          `「自持更合适 / 平台更合适」这套标签已被否掉，不要再加回来`);
      // 判断里写死数字，数据一更新就和图打架
      if (d.fit && /\d+\s*(家|个)/.test(d.fit))
        errs.push(`R82 专项「${t.zh}」› 步骤「${d.zh}」的判断里写死了数字 —— 数字交给图，句子只下结论`);
    }
}

/**
 * R91 —— **缺逐格核验日的只许少、不许多。**
 *
 * 早期录入的 302 格没有 `as_of`（集中在最早采的视频 / 文本 / 图像 / 声音四卷），
 * 而后来采的 710 格全都有。**这批不回填** —— 我们不知道当时是哪天核的，
 * 编一个日期比空着糟得多（[[never-fill-data-from-memory]] 那条纪律）。
 *
 * 但新加的格没有理由再缺：所以上一道棘轮，把当前数字钉死当上限。
 * 补了旧格就把这个数调小，**只许降不许升**。
 *
 * 页面那边如实显示「未单独记核验日」，不拿数据集日期冒充逐格核验日。
 */
{
  const MAX_NO_ASOF = 302;   // 2026-08-18 的实况。补了旧格就把它调小。
  const miss = (a.support ?? []).filter((x) => !x.as_of).length;
  if (miss > MAX_NO_ASOF)
    errs.push(`R91 有 ${miss} 格没有逐格核验日（上限 ${MAX_NO_ASOF}）—— ` +
      `新加的格必须写 as_of；旧格不回填，但这个数只许降不许升`);
}

/**
 * R90 —— **「自述与实测打架」每条都要引得到项目、带得出出处。**
 *
 * 这一类是 `/claims` 页上唯一手写的部分（许可证那几类全是现算的）。
 * 手写就意味着它可能腐坏：项目改了 id 就挂空，出处没了就退回成传闻 ——
 * **而传闻正是这一页要挡的东西。**
 *
 * 「它自己说」和「实际撞到的」两侧都必须有：只有一侧的叫抱怨，不叫对照。
 */
{
  for (const t of a.topics ?? []) {
    const ids = new Set((t.projects ?? []).map((p) => p.id));
    for (const c of t.conflicts ?? []) {
      const at = `R90 专项「${t.zh}」› 对照「${c.project ?? "无名"}」`;
      if (!ids.has(c.project))
        errs.push(`${at} 引了不存在的项目 —— 它会从 /claims 页上整个消失，页面不报错`);
      if (!c.what?.trim()) errs.push(`${at} 没写差在哪（what）`);
      if (!c.said?.trim() || !c.hit?.trim())
        errs.push(`${at} 缺「${!c.said?.trim() ? "它自己说" : "实际撞到的"}」—— 只有一侧的是抱怨不是对照`);
      if (!(c.src ?? []).length)
        errs.push(`${at} 没有出处 —— 没出处的对照就是传闻，而这一页正是要挡传闻`);
      for (const s of c.src ?? [])
        if (!/^https?:\/\//.test(s.url ?? "")) errs.push(`${at} 的出处不是链接：${s.url}`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(c.verified_at ?? "")) errs.push(`${at} 没写核验日`);
    }
  }
}

/**
 * R89 —— **说「这一格是空的」，就得交代搜过哪些词。**
 *
 * 2026-08-17 同一天在这上面栽了五次：Godot 侧、自动开发游戏、2D 精灵图、
 * 骨骼动画、音效 —— 全是搜得太窄就下能力断言，五条后来全被推翻。
 *
 * 错的形状很固定：**把「没有专门为这个场景做的工具」写成了「AI 做不到」。**
 * 搜 `game rigging` 几乎什么都没有，搜 `auto rigging 3d` 立刻冒出 SIGGRAPH
 * 论文项目 —— 因为它服务的是整个 3D 行业，不挂「游戏」的招牌。
 *
 * 所以「空」这个结论要付代价：列出搜过的词、写上日期。
 * **十二组是下限** —— 少于这个数，那句话说的其实是「我没找到」。
 *
 * ⚠️ 只查「断定没有」的句子。「上一轮我判错了」这种**认错的句子放过** ——
 * 它们含「没有」二字，但说的正好相反。
 */
{
  const CLAIM = /(没有人?做|没人做|一个都没有|基本是空的|真的空|开源侧没有|整支是空的|没有现成方案|没有(任何)?一个)/;
  const FIXED = /(判错|错在|我错了|不成立|上一轮)/;
  const MIN = 12;
  for (const t of a.topics ?? [])
    for (const d of t.decisions ?? []) {
      const txt = `${d.fit ?? ""}${(d.scenarios ?? []).map((s) => s.use).join("")}`;
      if (!CLAIM.test(txt) || FIXED.test(txt)) continue;
      const q = d.searched;
      if (!q) {
        errs.push(`R89 专项「${t.zh}」› 决定「${d.zh}」断定这一格没有东西，却没写搜过哪些词（searched）—— ` +
          `**「我没搜到」和「它不存在」是两句话**，这个错 2026-08-17 一天犯了五次`);
        continue;
      }
      if (!Array.isArray(q.terms) || q.terms.length < MIN)
        errs.push(`R89 专项「${t.zh}」› 决定「${d.zh}」只搜了 ${q.terms?.length ?? 0} 组关键词（要 ${MIN} 组以上）—— ` +
          `搜得不够就只能说「我搜到的都很小」，不能说「没有」`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(q.at ?? ""))
        errs.push(`R89 专项「${t.zh}」› 决定「${d.zh}」的搜索没写日期 —— 这类结论会过期，没有日期就没法复查`);
    }
}

/**
 * R88 —— **星速与停更月数必须和公式对得上。**
 *
 * 这两个数是从 `stars / created_at / pushed_at` 算出来的，不是独立事实。
 * 手写录入时算错了，页面照样显示得好好的 —— 2026-08-17 一次性查出两处：
 * waoowaoo 少报三倍（704 而不是 2003）、motion-skills 多报三倍（198 而不是 56）。
 * **而「星速」正是我们判断「有名」的判据**，判据本身错了，结论就全歪。
 *
 * 容差 25%：数据是按某个口径日算的，跑校验时已经过了几天，允许这点漂移；
 * 超过就说明不是漂移，是算错了。修法：`npm run repos`。
 */
{
  const MONTH = 1000 * 86400 * 30.44;
  const asOf = Date.parse(a.generated_at ?? new Date().toISOString().slice(0, 10));
  for (const t of a.topics ?? [])
    for (const p of t.projects ?? []) {
      if (!p.created_at || p.stars == null) continue;
      const want = Math.round(p.stars / ((asOf - Date.parse(p.created_at)) / MONTH));
      if (p.stars_per_month != null && Math.abs(want - p.stars_per_month) > p.stars_per_month * 0.25)
        errs.push(`R88 专项「${t.zh}」› ${p.zh} 的星速对不上：库里 ${p.stars_per_month}，` +
          `按 ${p.stars} 星 / ${p.created_at} 起算应为 ${want} —— 跑 npm run repos`);
      if (p.pushed_at) {
        const stale = Math.max(0, Math.round((asOf - Date.parse(p.pushed_at)) / MONTH));
        if (p.stale_months != null && Math.abs(stale - p.stale_months) > 1)
          errs.push(`R88 专项「${t.zh}」› ${p.zh} 的停更月数对不上：库里 ${p.stale_months}，` +
            `按最后提交 ${p.pushed_at} 应为 ${stale} —— 跑 npm run repos`);
      }
    }
}

/**
 * R87 —— **特点标签不许和圆标重复，也不许写成谁都能贴的话。**
 *
 * 标签存在的意义是「它凭什么跟别人不一样」。一旦写成「功能全」「易上手」，
 * 或者把许可证、还活不活抄一遍，它就从信息退化成噪音 ——
 * **而噪音标签的坏处是它看起来很像在提供信息。**
 * README 原文也必须真的在库里，缺文件时页面会静默少一节。
 */
{
  const BAN = ["功能全", "易上手", "简单易用", "开源", "免费", "强大", "好用", "值得一试"];
  for (const t of a.topics ?? [])
    for (const p of t.projects ?? []) {
      const tg = p.tags ?? [];
      if (!tg.length) { errs.push(`R87 专项「${t.zh}」› ${p.zh} 没写特点标签`); continue; }
      if (tg.length > 4) errs.push(`R87 专项「${t.zh}」› ${p.zh} 标签 ${tg.length} 个 —— 超过 4 个就没人看了`);
      for (const x of tg) {
        if (x.length > 22) errs.push(`R87 专项「${t.zh}」› ${p.zh} 的标签太长：「${x}」`);
        if (BAN.some((b) => x === b)) errs.push(`R87 专项「${t.zh}」› ${p.zh} 的标签「${x}」谁都能贴，不提供信息`);
      }
      if (!existsSync(`data/readme/${p.id}.md`))
        errs.push(`R87 专项「${t.zh}」› ${p.zh} 没有 README 原文（data/readme/${p.id}.md）—— 跑 node scripts/fetch-readme.mjs`);
    }
}

/**
 * R84 —— **教程每条都要能回查。**
 *
 * 教程是这一站里最容易腐坏的一类数据：链接死了、页面换了内容，
 * 而**页面上照样显示得好好的**。所以三样必填 —— 出处（url）、口径（kind）、核验日 ——
 * 少一样这条就回查不了，等于没记。三方博客不收：`kind` 只有官方 / 社区两档，
 * 而「社区」也必须是生态里事实上的官方口径（比如 ComfyUI 官方文档）。
 */
{
  const KIND = new Set(["官方", "社区"]);
  const LANG = new Set(["zh", "en"]);
  for (const t of a.topics ?? [])
    for (const p of t.projects ?? [])
      for (const tu of p.tutorials ?? []) {
        const at = `R84 专项「${t.zh}」› ${p.zh} 的教程「${tu.title ?? "无题"}」`;
        if (!tu.title) errs.push(`${at} 没有标题`);
        if (!/^https?:\/\//.test(tu.url ?? "")) errs.push(`${at} 的 url 不是链接：${tu.url}`);
        if (!KIND.has(tu.kind)) errs.push(`${at} 的口径是「${tu.kind ?? "空"}」，只能是 ${[...KIND].join(" / ")}`);
        if (!LANG.has(tu.lang)) errs.push(`${at} 的语言是「${tu.lang ?? "空"}」，只能是 ${[...LANG].join(" / ")}`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(tu.verified_at ?? "")) errs.push(`${at} 没写核验日`);
      }
}

/**
 * R83 —— **每个项目都要归到一个真实存在的类型，且没有空类型。**
 *
 * 专项页的骨架就是这份类型清单（`topic.groups`）：漏归一个项目，
 * 它在页面上**不是显示错，是整个消失** —— 没人会来报错。
 * 空类型同理：tab 点进去一片空白，比不列这一类还糟。
 */
{
  for (const t of a.topics ?? []) {
    const gs = t.groups ?? [];
    if (!gs.length) { errs.push(`R83 专项「${t.zh}」没有类型清单（groups）—— 页面按类型分 tab，缺它整页没东西可摆`); continue; }
    const ids = new Set(gs.map((g) => g.id));
    for (const g of gs)
      if (!g.zh || !g.intro) errs.push(`R83 专项「${t.zh}」› 类型 ${g.id} 缺 ${!g.zh ? "中文名" : "一句说明"}`);
    for (const p of t.projects ?? []) {
      if (!p.group) errs.push(`R83 专项「${t.zh}」› ${p.zh} 没归类（group）—— 它会从页面上整个消失`);
      else if (!ids.has(p.group)) errs.push(`R83 专项「${t.zh}」› ${p.zh} 归到了不存在的类型 ${p.group}`);
    }
    for (const g of gs) {
      /** 作品这一类摆的是 `topic.works`，不是项目 —— 拿项目去数它永远是空。 */
      const n = g.kind === "works" ? (t.works ?? []).length
        : g.kind === "basics" ? (t.basics ?? []).reduce((k, b) => k + (b.items ?? []).length, 0)
          : (t.projects ?? []).filter((p) => p.group === g.id).length;
      if (!n) errs.push(`R83 专项「${t.zh}」› 类型「${g.zh}」一条都没有 —— 点进去是空白 tab，要么补内容要么删这一类`);
    }
    /**
     * 小节（`sub`）也要引得到、也不许空。
     * 漏归小节的项目**不会报错，只会从那个 tab 里消失** —— 和漏归 group 是同一个坑。
     */
    const subs = new Set((t.subgroups ?? []).map((x) => x.id));
    for (const p of t.projects ?? [])
      if (p.sub && !subs.has(p.sub)) errs.push(`R83 专项「${t.zh}」› ${p.zh} 的小节 ${p.sub} 不存在`);
    for (const sg of t.subgroups ?? [])
      if (!(t.projects ?? []).some((p) => p.sub === sg.id))
        errs.push(`R83 专项「${t.zh}」› 小节「${sg.zh}」一个项目都没有`);
    /** 有小节的 tab 里，**不许有项目不属于任何小节** —— 那种项目会被分节渲染整个跳过。 */
    for (const g of gs) {
      const inTab = (t.projects ?? []).filter((p) => p.group === g.id);
      if (inTab.some((p) => p.sub) && inTab.some((p) => !p.sub))
        errs.push(`R83 专项「${t.zh}」› 类型「${g.zh}」里有项目没归小节：` +
          `${inTab.filter((p) => !p.sub).map((p) => p.zh).join(" ")} —— 分节渲染会把它们整个跳过`);
    }
  }
}

/**
 * R86 —— **入门读物每条都要能回查。**
 *
 * 这一栏是索引不是教材：**我们没写内容，全部价值在于链接指得对**。
 * 所以出处（url）、来源主体（site）、核验日必填，`note` 也必填 ——
 * 少了 note 这一条就退回成一个裸链接，读者不知道为什么要点它。
 */
{
  const LANG = new Set(["zh", "en"]);
  /** 这几组讲的是「可以点名要的风格」—— 它们比别的组多两样必填。 */
  const STYLE = new Set(["director", "anime", "actor", "genre"]);
  for (const t of a.topics ?? [])
    for (const b of t.basics ?? []) {
      if (!b.zh || !b.intro) errs.push(`R86 专项「${t.zh}」› 常识组 ${b.id} 缺中文名或说明`);
      if (!(b.items ?? []).length) errs.push(`R86 专项「${t.zh}」› 常识组「${b.zh}」一条读物都没有`);
      for (const it of b.items ?? []) {
        const at = `R86 专项「${t.zh}」› 常识「${it.title ?? "无题"}」`;
        if (!/^https?:\/\//.test(it.url ?? "")) errs.push(`${at} 的 url 不是链接：${it.url}`);
        if (!it.site) errs.push(`${at} 没写来源主体 —— 「谁说的」和「说了什么」一样重要`);
        if (!LANG.has(it.lang)) errs.push(`${at} 的语言是「${it.lang ?? "空"}」，只能是 zh / en`);
        if (!it.note) errs.push(`${at} 没写「它解决你哪个困惑」—— 没有这句就只是个裸链接`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(it.verified_at ?? "")) errs.push(`${at} 没写核验日`);
        /**
         * **风格类条目光有名字没用。** 负责人 2026-08-17：
         * 「你只说了『韦斯·安德森的对称正面平移』，谁知道是什么呢？」
         * 所以这几组里每条都要有「为什么好看」和一部代表作。
         */
        if (STYLE.has(b.id)) {
          if (!it.why) errs.push(`${at} 没写「为什么好看」—— 光给名字等于没说`);
          if (!it.example?.url || !/^https?:\/\//.test(it.example.url))
            errs.push(`${at} 没给代表作链接 —— 看一眼就懂那一步不能省`);
        }
      }
    }
}

/**
 * R85 —— **作品必须带出处。**
 *
 * 作品篇的收录规矩是「只收制作方自己公开说明过管线的作品」。
 * 少了出处，这一条就退回成传闻 —— 而传闻正是这一篇立项时要挡的东西。
 */
{
  const OPEN = new Set(["closed", "open", "mixed"]);
  for (const t of a.topics ?? [])
    for (const w of t.works ?? []) {
      const at = `R85 专项「${t.zh}」› 作品「${w.zh ?? "无名"}」`;
      if (!w.zh || !w.maker || !w.stack) errs.push(`${at} 缺片名 / 制作方 / 用了什么`);
      if (!OPEN.has(w.open)) errs.push(`${at} 的管线性质是「${w.open ?? "空"}」，只能是 ${[...OPEN].join(" / ")}`);
      if (!(w.src ?? []).length) errs.push(`${at} 没有出处 —— 查不到用了什么就不该收`);
      for (const s of w.src ?? [])
        if (!/^https?:\/\//.test(s.url ?? "")) errs.push(`${at} 的出处不是链接：${s.url}`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(w.verified_at ?? "")) errs.push(`${at} 没写核验日`);
    }
}

/**
 * R81 —— **每个项目至少两张图，且图种必须是那四类之一。**
 *
 * 这条是被打回来才加的：项目解析一度退化成「一张图 + 八百字」，
 * 而八百字里绝大部分本来就是结构化数据，只是被渲染成了列表。
 * 门槛定在两张（怎么摆 + 怎么走），比一张能挡住的退化多得多。
 */
{
  const KINDS = new Set(["架构图", "流程图", "时序图", "工程图"]);
  for (const t of a.topics ?? [])
    for (const p of t.projects ?? []) {
      const ds = p.diagrams ?? [];
      /** DeepWiki 没收这个仓库 —— 放行，但必须写明为什么，而且页面要显示出来。 */
      if (p.wiki === "none") {
        if (!p.wiki_note) errs.push(`R81 专项「${t.zh}」› ${p.zh} 声明了 wiki:none 却没写 wiki_note —— 豁免必须看得见`);
        continue;
      }
      if (ds.length < 2)
        errs.push(`R81 专项「${t.zh}」› ${p.zh} 只有 ${ds.length} 张图 —— 至少要「怎么摆」和「怎么走」各一张`);
      for (const d of ds)
        if (!KINDS.has(d.kind))
          errs.push(`R81 专项「${t.zh}」› ${p.zh} 的图「${d.title}」图种是「${d.kind ?? "空"}」，` +
            `只能是 ${[...KINDS].join(" / ")}`);
    }
}

/**
 * R79 —— **每个开源项目都必须有至少一个片型能引到它。**
 *
 * 页面按片型的命门决定筛项目。一个项目如果不在任何片型的命门决定上，
 * **读者永远翻不到它** —— 收了等于没收，而且没人会发现，
 * 因为页面只是「少显示一张卡」，不报错。
 *
 * 底座（role: base）不受此限：它对所有片型都显示。
 */
for (const t of a.topics ?? []) {
  const m = (t.chapters ?? []).find((c) => c.matrix)?.matrix;
  if (!m) continue;
  const reach = new Set();
  for (const app of Object.keys(m)) {
    const key = (t.decisions ?? [])
      .filter((d) => (m[app][d.id] ?? 0) >= 3 && d.owner !== "user").map((d) => d.id);
    for (const p of t.projects ?? [])
      if (p.decisions?.some((d) => key.includes(d))) reach.add(p.id);
  }
  for (const p of t.projects ?? []) {
    if (p.role === "base" || reach.has(p.id)) continue;
    errs.push(`R79 专项「${t.zh}」› ${p.zh} 没有任何片型引得到 —— ` +
      `它不在任何片型的命门决定上，读者永远翻不到；` +
      `要么调片型矩阵的权重，要么它本就不该收`);
  }
}

/**
 * R80 —— **动手层三块要么齐、要么整块没有，不许只有一半。**
 *
 * 动手层是这个专项的重心（负责人：深度＝读懂层 + 动手层）。
 * 只有安装步骤没有坑，等于把最难的那部分省了 ——
 * **而读者恰恰是为了避坑才读它的**。
 *
 * 没做完的项目页面会明写「还没做，要读源码」，那是诚实的空白；
 * 半截的动手层不是空白，是**看起来做完了其实没有**。
 */
for (const t of a.topics ?? []) {
  for (const p of t.projects ?? []) {
    const h = p.hands;
    if (!h) continue;
    const OK = ["docs", "wiki", "issue", "bench"];
    if (!Array.isArray(h.layers) || !h.layers.length || h.layers.some((x) => !OK.includes(x)))
      errs.push(`R80 专项「${t.zh}」› ${p.zh} 的动手层没声明 layers —— ` +
        `要写**实际做到了哪几层**（${OK.join(" / ")}），页面上必须分得出来；` +
        `只读 README 的不能看起来和真跑过的一样`);
    const miss = ["install", "modify", "pitfalls"].filter((k) => !(h[k] ?? []).length);
    if (miss.length)
      errs.push(`R80 专项「${t.zh}」› ${p.zh} 的动手层缺 ${miss.join(" / ")} —— ` +
        `三块要么齐、要么整块别写；只有安装没有坑等于把最难的那部分省了`);
    for (const f of h.pitfalls ?? [])
      if (!f.where?.trim() || !f.note?.trim())
        errs.push(`R80 专项「${t.zh}」› ${p.zh} 有一条坑没写清位置或内容`);
  }
}

/**
 * R67 —— 数据集日期不能早于任何一格的核验日。
 * 页脚印的「数据截至 X」是给读者的新鲜度承诺；有格子比它还新，那句话就是错的。
 */
{
  const dated = a.support.filter((s) => s.as_of);
  const newest = dated.map((s) => s.as_of).sort().at(-1);
  if (newest && newest > a.generated_at)
    errs.push(`R67 数据集日期 ${a.generated_at} 早于最新核验的格子 ${newest} —— 页脚那句「数据截至」会是错的`);
  for (const s of dated)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.as_of)) errs.push(`R67a as_of 不是日期：${s.m} × ${s.c} = ${s.as_of}`);
}

/**
 * R68 —— **四个公共页必须覆盖每一个已上线的方向。**
 *
 * `/caveats`（能力对了未必用得上）、`/changes`（最近有什么变化）、`/toolkit`（去哪个站）、
 * `/basics`（去读哪些公开教程）——
 * 这四页是跨方向的：加一卷 AI 工具，内容就得跟着进这四页。
 * 但它们和「某一卷自己的页面」不一样 —— 做完一卷的现在页/演进树，
 * 人会很自然地以为收工了，**没人会记得回头补这三页**。
 * 负责人 2026-08-11 指出时，图像卷在 /caveats 上是空的、文本卷在三页上全是空的。
 *
 * 所以把「记得」这件事从人的脑子里挪出来，变成一条过不去的规则。
 *
 * 允许有缺口，**但缺口必须写明理由**（`domains[].gaps`）——
 * 和 R58「少于 3 个谱系节点要写原因」同一条纪律：
 * **「还没做」和「本来就没有」是两回事**，不许都表现成一片空白然后不解释。
 *
 * ## 2026-08-13 把 /basics 也纳进来
 *
 * 负责人：「后续添加新的 AI 工具方向（AI 3D、具身智能、世界模型？）的
 * 跨方向导航与内容，要在做具体方向时一起更新。」原来这条只管三页 ——
 * 而 /basics 那 21 个教程几乎全是大模型（文本卷），视频 / 图像 / 声音
 * 只靠 WaytoAGI 一条撑着。加新方向时同样会忘。
 *
 * ⚠️ **通用基础课（`domains: []`）不计入覆盖。** 「动手学深度学习」这类
 * 对哪一卷都算沾边 —— 认它就等于任何新方向自动过关，这条规则就白写了。
 * 要的是**明确讲了那个方向**的教程或文档。
 *
 * 只有一条覆盖时给警告：一卷的入门读物全压在同一个来源上（现在是社区共建的
 * WaytoAGI），那个来源改版或下线，这一卷的入口就断了。
 */
{
  const changes = existsSync(new URL("../data/changes.json", import.meta.url))
    ? JSON.parse(readFileSync(new URL("../data/changes.json", import.meta.url), "utf8"))
    : { events: [] };
  const domOf = new Map(a.models.map((m) => [m.id, m.domain ?? "video"]));
  const glossary = existsSync(new URL("../data/glossary.json", import.meta.url))
    ? JSON.parse(readFileSync(new URL("../data/glossary.json", import.meta.url), "utf8"))
    : { tutorials: [] };
  const tutorials = (glossary.tutorials ?? []).flatMap((g) => g.items ?? []);
  const tutorialCover = (d) => tutorials.filter((t) => (t.domains ?? []).includes(d)).length;
  const has = {
    // caveats 是现算的，没法在这里跑 —— 查它的**输入**：这一卷有没有可用性/价格/可达性数据
    caveats: (d) =>
      (a.availability ?? []).some((v) => domOf.get(v.m) === d) ||
      (a.pricing ?? []).some((q) => domOf.get(q.m) === d) ||
      a.models.some((m) => (m.domain ?? "video") === d && m.reach_cn === "blocked" && (m.tier ?? "core") === "core"),
    changes: (d) => (changes.events ?? []).some((e) => e.domain === d),
    toolkit: (d) => (a.toolkit ?? []).some((t) => t.domain === d),
    basics: (d) => tutorialCover(d) > 0,
  };
  for (const d of a.domains.filter((x) => x.state === "live")) {
    for (const [page, ok] of Object.entries(has)) {
      if (ok(d.id)) continue;
      const why = d.gaps?.[page];
      if (!why) errs.push(`R68 ${d.name} 在 /${page} 上没有任何内容 —— 四个公共页要覆盖每一卷。补内容，或在 domains[${d.id}].gaps.${page} 写明为什么没有`);
      else warns.push(`R68 ${d.name} 在 /${page} 上是空的（已写明原因：${String(why).slice(0, 46)}…）`);
    }
    // 教程只有一条时点名 —— 那一卷的入门入口是单点，来源一改版就断了
    if (tutorialCover(d.id) === 1)
      warns.push(`R68a ${d.name} 在 /basics 上只有 1 条明确覆盖它的教程 —— 入口是单点，那个来源一改版这一卷就没入门读物了`);
  }
  // 每条教程都要表态：讲的是哪几卷，还是通用基础。**在方向循环外面** ——
  // 放里面会按方向数重复报同一条，一个漏标的教程刷四行。
  for (const t of tutorials)
    if (!Array.isArray(t.domains))
      errs.push(`R68b 教程没标方向：${t.name} —— 讲哪几卷就写哪几卷，通用基础课写空数组（不计入覆盖）`);
}

/**
 * R69 —— **价格与折扣封存，不许再长。**
 *
 * 负责人 2026-08-12 拍板不再采价格与折扣（ontology 规则十）：
 * 它是唯一一类**必然过期又没法自动核**的数据，挂在一个卖「每条事实都对得上」的站上
 * 是负债不是资产；而且 `/caveats` 的「各平台不同价」是从它算的 —— 价格一旧，
 * 那条告诫就成了错的告诫。
 *
 * 光写进 ontology 不够 —— **一句写在文档里的决定，挡不住下一次「顺手补两条」**。
 * 所以钉成数字：现有 11 条价格、2 条折扣封存，多一条就报错。
 * 真要重开这一类，改这里的数字并同时改 ontology 规则十，让两处一起动。
 */
{
  const FROZEN = { pricing: 11, discount: 2 };
  for (const [k, n] of Object.entries(FROZEN)) {
    const cur = (a[k] ?? []).length;
    if (cur > n)
      errs.push(`R69 ${k} 从 ${n} 条长到 ${cur} 条 —— 这一类**已封存不再采**（ontology 规则十）。` +
        `真要重开，改 validate 里的 FROZEN 并同步改 ontology，别只加数据`);
    for (const r of a[k] ?? [])
      if (!r.frozen) errs.push(`R69a ${k} 有一条没标 frozen：${r.m} × ${r.p} —— 封存的数据要让读者看得出来`);
  }
}

/**
 * R70 —— **同一次发布被两个源各录了一遍。**
 *
 * 2026-08-12 在树上抓到：`Qwen-Image-Edit-2511` 有两个节点，同版本号、同日期，
 * 一个来自 `hf-lineage`、一个来自 `hf-image-org`，而且后录的被挂成先录的**子节点** ——
 * 于是树上画出一条 `2511 → 2511` 的边，看上去像「这一代迭代了两次」。
 *
 * 判据必须精确到「来源不同」这一条：同型号同日发多个能力变体是**合法的**
 * （SkyReels V2 当天出 I2V / T2V / DF 三支，SkyReels V3 出 V2V / 参考 / 音频驱动三支），
 * 那几组都同版本同日期，但同出一源、`added` 各不相同。
 * 只有**两个源各说了一次同一件事**，才是重录。
 *
 * 是警告不是错误：偶尔确有同日双发，人看一眼就能判。但它必须出现在眼前。
 */
{
  const byKey = new Map();
  for (const v of a.versions ?? []) {
    const k = `${v.m}|${(v.version ?? "").toLowerCase()}|${v.date ?? ""}`;
    byKey.set(k, [...(byKey.get(k) ?? []), v]);
  }
  for (const [k, g] of byKey) {
    if (g.length < 2) continue;
    if (new Set(g.map((v) => v.src)).size < 2) continue;   // 同源同日 = 合法的变体群
    warns.push(
      `R70 同一次发布疑似录了两遍：${k.split("|").slice(0, 2).join(" ")} —— ` +
      `${g.length} 个节点、来源 ${[...new Set(g.map((v) => v.src))].join(" / ")}。` +
      `合成一个（repos 合并、另一条的引文并进 note），别让树上出现自己指向自己的边`,
    );
  }
}

/**
 * R71 —— **谱系节点既没挂能力、也没写为什么不挂。**
 *
 * 树上那排「谁先谁后」的筛选按钮是从节点的 `cap` 现算的：
 * 挂了 cap 的能力才会出现一个按钮。所以一个方向如果没有任何节点挂 cap，
 * **那一排按钮整个不出现** —— 负责人 2026-08-12 就是这样发现图像/文本/声音三卷都没有的。
 *
 * 光有 `cap` 不够，还要有 `cap_skip`：
 * 「这一代确实没新增能力轴上的东西」和「还没人判过」必须分得开。
 * 只看空不空，前者会被永远当成待办；只看 cap，后者会永远没人发现。
 *
 * 是警告不是错误 —— 判一个节点算不算某项能力的首现要读原文，堵不住提交；
 * 但它必须进 todo.mjs，一直摆在眼前。
 */
{
  const bare = (a.versions ?? []).filter((v) => !v.cap && !v.cap_skip);
  const by = {};
  for (const v of bare) {
    const d = a.models.find((m) => m.id === v.m)?.domain ?? "video";
    by[d] = (by[d] ?? 0) + 1;
  }
  if (bare.length)
    warns.push(
      `R71 谱系节点没判能力：${bare.length} 条（${Object.entries(by).map(([k, v]) => `${k} ${v}`).join(" · ")}）—— ` +
      `挂 \`cap\` 或写 \`cap_skip\` 说明为什么不挂。**判据是 added 自己有没有声明「这一代新增了 X」**，` +
      `别拿「这一代的 API 发布」硬凑 —— 树上的「谁先谁后」取每条线最早带该 cap 的节点，挂错一个整条排错`,
    );
}

/**
 * R72 —— **登记成 json 的源，URL 却指着网页版。**
 *
 * 抓回来是 HTML，`JSON.parse` 报 `Unexpected token '<', "<!doctype "…`，
 * 而这句报错在 watch 报告里长得和「这个源坏了」一模一样 —— `hf-pixelart-lora`
 * 就这么在「抓不到（要处理）」里躺了很久，其实是**我们自己把网页地址填进了 json 源**。
 *
 * 2026-08-12 查清并修好它之后，我在同一天新加的 12 条 HF 源上**又犯了一遍** ——
 * 所以这条不能靠自觉，得是一条过不去的规则。
 *
 * ⚠️ **判据只认 Hugging Face，不认 GitHub** —— 这一条是差点写错的地方。
 * 规则第一版把两家一起卡，一上来报 63 个错，而那 63 条**全都在正常工作**。
 * 实测原因：**GitHub 会做内容协商**，带 `Accept: application/json` 请求
 * `github.com/<org>/<repo>` 返回的就是 JSON（92KB，`content-type: application/json`）；
 * 而 Hugging Face 不管你要什么都给 HTML。
 *
 * 所以：HF 必须显式走 `huggingface.co/api/models/<org>/<repo>`；GitHub 网页地址本身就能用。
 *
 * **一条一上来报 63 个错的规则，只会被人无视 —— 那比没有规则更糟。**
 */
{
  const reg = watchRegistry.sources ?? [];
  for (const s of reg) {
    if (s.kind !== "json") continue;
    let u;
    try { u = new URL(s.url); } catch { errs.push(`R72 源的 URL 不合法：${s.id} → ${s.url}`); continue; }
    if (u.hostname === "huggingface.co" && !u.pathname.startsWith("/api/"))
      errs.push(
        `R72 ${s.id} 登记成 kind=json，URL 却是 Hugging Face 的网页版：${s.url} —— ` +
        `HF 不做内容协商，抓回来必是 HTML，会报「Unexpected token '<'」，` +
        `而那句话在报告里长得和「源坏了」一模一样。改成 huggingface.co/api/models/<org>/<repo>`,
      );
  }
}

// 缺格会被前台静默当成 unknown，那是**沉默的错**。
for (const m of a.models)
  for (const c of a.capabilities)
    if (isCore(m) && applies(m, c) && !seen.has(`${m.id}::${c.id}`)) errs.push(`R7 缺格：${m.id} × ${c.id}`);

// ── 平台可用性（E5）。规矩和能力格一样：**没有原文就不算证据**。
const pids = new Set((a.platforms ?? []).map((p) => p.id));
const mids = new Set(a.models.map((m) => m.id));
for (const v of a.availability ?? []) {
  const at = `${v.p} × ${v.m}`;
  if (!pids.has(v.p)) errs.push(`R13 未知平台：${v.p}`);
  if (!mids.has(v.m)) errs.push(`R14 未知模型：${v.m}（${at}）`);
  if (!srcIds.has(v.src)) errs.push(`R15 来源 id 不存在：${v.src}（${at}）`);
  if (!v.quote) errs.push(`R16 可用性没有原文引用 —— 不算证据：${at}`);
  if (!["available", "coming-soon", "gone"].includes(v.status)) errs.push(`R17 非法状态 ${v.status}：${at}`);
  if (!["same", "older", "newer", "unknown"].includes(v.match)) errs.push(`R18 非法 match：${at}`);
  // 上架的是旧版本，却没写清楚 —— 那正是这张表最该说的话
  if (!["api", "web", "both", "unknown"].includes(v.access_type)) errs.push(`R53 非法 access_type：${at}`);
  if (!["free", "paid", "trial", "unknown"].includes(v.plan)) errs.push(`R53 非法 plan：${at}`);
  // 有效期过了却还标着 available —— 那是过期的断言
  if (v.valid_to && v.valid_to !== "unknown" && v.valid_to < a.generated_at && v.status !== "gone")
    errs.push(`R54 有效期已过（${v.valid_to}）却不是 gone：${at}`);
  if (v.match === "older" && !v.note) warns.push(`R19 上架版本比当前主力旧，却没写说明：${at}`);
}

// ── 公司实体层。**产业链图全挂在这层上，这层烂了上面全烂。**
const orgIds = new Set((a.orgs ?? []).map((o) => o.id));
if (orgIds.size !== (a.orgs ?? []).length) errs.push("R20a orgs 里有重复 id");
for (const o of a.orgs ?? []) {
  if (o.parent && !orgIds.has(o.parent) && o.parent !== "alphabet") errs.push(`R22 parent 指向不存在的公司：${o.id} → ${o.parent}`);
  /**
   * **「不知道它在哪」和「填了但填不全」是两回事。**
   *
   * 新收的几家小厂（HiDream / Boogu / NewBie / Circlestone）公开渠道查不到可靠总部 ——
   * HiDream 的报道里合肥与北京都出现过。**与其钉一个可能错的城市，不如承认不知道**，
   * 和 ⬜「官方没说」同一条纪律。所以整块 `hq` 缺失只警告，地球上先不画它；
   * 填了却缺经纬度仍是错误，那是数据自己不自洽。
   */
  if (!o.hq) warns.push(`R23 总部未知，地球上先不画：${o.zh}`);
  else if (!o.hq.lat || !o.hq.lon) errs.push(`R23 填了总部却缺经纬度，地球上画不出来：${o.id}`);
  // **不许因为「大家都知道」就当成核过了** —— 那正是我们批评别人的那件事。
  /**
   * **「试过但没拿到」和「压根没查过」必须分得开** —— 和 ⬜「官方没说」是同一条纪律。
   *
   * 2026-08-13 为了清这一摞警告，逐个去厂商官网找能摘原文的地址：
   * 16 次尝试只落地 2 家（Anthropic 的隐私政策、Stability 的服务条款，两家都是法务页）。
   * 其余的要么 403、要么 404、要么是前端渲染的壳、要么正文里根本没有地址。
   *
   * **那不是没查，是拿不到** —— 而这两件事对读者的意义不同：
   * 前者是「这家不公开」，后者是「我们偷懒」。所以查过没拿到的填 `hq_note` 写明试了什么，
   * 警告文案也跟着变，让报告一眼能分出还剩几家是真没动过。
   */
  if (!o.hq_src)
    warns.push(
      o.hq_note
        ? `R21a 总部查过但拿不到官方出处（已留痕）：${o.zh}`
        : `R21 总部没有来源，只是常识 —— **还没查过**：${o.zh}`,
    );
  // 有来源不等于证到位：ICP 备案只证到省，招聘页可能同时列两个城市。
  // **不许把 province 当 exact 用** —— 我们批评厂商「说了半句」时，自己不能也说半句。
  else if (o.hq_precision && o.hq_precision !== "exact")
    warns.push(`R21b 总部有来源但只证到 ${o.hq_precision}，城市这一级仍是常识：${o.zh}`);
  if (o.hq_src && !srcIds.has(o.hq_src)) errs.push(`R21c 总部来源 id 不存在：${o.hq_src}（${o.zh}）`);
}
for (const m of a.models) if (!orgIds.has(m.org)) errs.push(`R20 模型挂到不存在的公司：${m.id} → ${m.org}`);

/**
 * 架构族（R59~R62）—— 演化树能不能从**一个根**长出来，全靠这一栏。
 *
 * 那张 LLM 演化树的根不是「谁用了谁的权重」（BERT 和 GPT 没有权重关系），
 * 是 **Transformer 架构**；三条主干是架构族。**架构闭源也公开**，写在技术报告里。
 * 所以这一栏对闭源模型同样可采 —— 采不到就留 null，不猜。
 *
 * 规矩和能力格完全一致：**填了架构就必须给得出官方原文和来源**。
 */
const ARCH = Object.keys(a.$arch ?? {});
/**
 * R66：**核心模型的版本号必须有来源。**
 *
 * 2026-08-11 负责人指出 AI 文本那一卷「GPT-5.6 了，你才找到 GPT-5.2」——
 * 一查全线落后：GLM 记 4.5 实际 5.2、DeepSeek 记 V3 实际 V4、Kimi 记 K2 实际 K3。
 * 根因不是采集难，是**我按记忆填了版本号**，而按记忆填 = 编。
 * 这个产品唯一的本钱是「对得上」，所以这条不能靠自觉，得是一条过不去的规则。
 *
 * 只卡 core：extended 是「收了但没逐格核」，版本号可以先空着。
 * `version_quote` 也要有 —— 只给一个来源 id 而摘不出原文，和没有来源一样。
 */
for (const m of a.models) {
  if ((m.tier ?? "core") !== "core") continue;
  const at = `${m.family}（${m.id}）`;
  if (!m.version_src) errs.push(`R66 核心模型的版本号没有来源：${at} = ${m.version} —— **按记忆填版本号就是编**`);
  else if (!srcIds.has(m.version_src)) errs.push(`R66 版本来源 id 不存在：${m.version_src}（${at}）`);
  if (m.version_src && !m.version_quote) errs.push(`R66 有来源却摘不出原文：${at}`);
}

for (const m of a.models) {
  if (m.arch == null) { warns.push(`R59 架构未采：${m.id}（树上只能挂在「未标注」）`); continue; }
  if (!ARCH.includes(m.arch)) errs.push(`R60 非法架构族 ${m.arch}：${m.id} —— 只能是 ${ARCH.join("/")}`);
  // **依据必须标明**：official = 有厂商技术报告原文；common = 领域常识判断，没有厂商确证。
  // 负责人 2026-08-09 拍板：架构族是领域常识（Sora 之后基本全转 DiT），不必逐条考据，
  // 但**站上不能假称厂商确认过** —— 所以用 basis 分档，和总部定位「精确/省市级/未定」一个做法。
  if (!["official", "common"].includes(m.arch_basis ?? ""))
    errs.push(`R61 架构没标依据（official / common）：${m.id}`);
  if (m.arch_basis === "official") {
    if (!m.arch_quote) errs.push(`R62 标了 official 却没有原文 —— 和能力格一个规矩：${m.id}`);
    if (!m.arch_src) errs.push(`R62 标了 official 却没有来源 id：${m.id}`);
    else if (!srcIds.has(m.arch_src)) errs.push(`R62 架构来源 id 不存在：${m.arch_src}（${m.id}）`);
  }
}
for (const v of a.investments ?? []) {
  if (!orgIds.has(v.to)) errs.push(`R24 投资的接收方不是库里的公司：${v.to}`);
  if (!v.src || !v.quote) errs.push(`R25 投资关系没有来源或原文 —— 和能力格一个规矩：${v.from} → ${v.to}`);
}

// ── 平台透明度（G3 · §59.4.e）。**🔴 的门槛是「读过」** ——
// 没读到页面只能记 blocked，那是我们的缺口，不是对方的问题。
const DISC = ["yes", "partial", "no", "blocked", "n/a"];
for (const pf of a.platforms ?? []) {
  if (!DISC.includes(pf.discloses)) { errs.push(`R27 非法透明度取值 ${pf.discloses}：${pf.id}`); continue; }
  if (["yes", "partial"].includes(pf.discloses)) {
    if (!pf.discloses_quote) errs.push(`R28 说人家公示了，却没有原文 —— 不算证据：${pf.id}`);
    if (!srcIds.has(pf.discloses_src)) errs.push(`R29 透明度来源 id 不存在：${pf.discloses_src}（${pf.id}）`);
  }
  // 「只字不提」是对人家的负面判断，必须先证明我们真的读过整页。
  if (pf.discloses === "no" && !srcIds.has(pf.discloses_src))
    errs.push(`R30 判 ${pf.id}「只字不提」却拿不出读过的证据 —— 没读到只能记 blocked`);
  if (!pf.discloses_why) warns.push(`R31 透明度没写理由：${pf.id}`);
}

// ── 价格（G5）。**unit 是一等字段** —— 七家七种计价方式，
// 把它们并成一列数字，那一列一定是编的。
const seenPrice = new Set();
const UNITS = ["per-second", "points", "subscription", "credits", "unavailable"];
for (const q of a.pricing ?? []) {
  const at = `价格 ${q.p} × ${q.m}`;
  if (!mids.has(q.m)) errs.push(`R32 未知模型：${at}`);
  // **主键是 (平台, 模型)** —— 同一个模型在不同平台不是一个价，
  // 不写平台的价等于没写：万相在百炼 ¥0.6/秒，在 Replicate $0.25/秒。
  if (!pids.has(q.p)) errs.push(`R39 未知平台：${at}`);
  if (seenPrice.has(`${q.p}::${q.m}`)) errs.push(`R40 重复的价格条目：${at}`);
  seenPrice.add(`${q.p}::${q.m}`);
  if (!UNITS.includes(q.unit)) errs.push(`R33 非法计价单位 ${q.unit}：${at}`);
  if (!srcIds.has(q.src)) errs.push(`R34 来源 id 不存在：${q.src}（${at}）`);
  if (!q.quote) errs.push(`R35 价格没有原文 —— 和能力格一个规矩：${at}`);
  if (q.unit === "per-second" && !q.currency) errs.push(`R36 按秒计价却没写币种 —— 那就没法比：${at}`);
  // 有价必须有维度：同一个模型 720P 和 4K 能差 5 倍，记成一个标量必然是错的
  if (q.unit !== "unavailable" && !(q.tiers ?? []).length) errs.push(`R37 有价但没写档位（分辨率/时长/有无声）：${at}`);
  if (!q.as_of) errs.push(`R38 价格没写核验日期 —— 价格比能力更容易过期：${at}`);
}

// ── 版本谱系（B1）。树的边错了，整张演化图就是错的。
const vids = new Set((a.versions ?? []).map((v) => v.id));
for (const v of a.versions ?? []) {
  const at = `版本 ${v.id}`;
  if (!mids.has(v.m)) errs.push(`R55a 版本挂到不存在的模型：${at} → ${v.m}`);
  if (!v.added) errs.push(`R55b 版本没写「这一代新增了什么」—— 只有版本号的节点没有价值：${at}`);
  if (v.parent) {
    if (!vids.has(v.parent)) errs.push(`R56a parent 指向不存在的节点：${at} → ${v.parent}`);
    else {
      const p = a.versions.find((x) => x.id === v.parent);
      // **时间倒流的血缘是错的** —— 父节点不可能晚于子节点发布
      if (p.date > v.date) errs.push(`R56 血缘时间倒流：${at}（${v.date}）的父节点 ${p.id} 是 ${p.date}`);
    }
  }
}
// 环：顺着 parent 往上走，走不到根就是有环
for (const v of a.versions ?? []) {
  const seen = new Set([v.id]);
  let cur = v;
  while (cur?.parent) {
    if (seen.has(cur.parent)) { errs.push(`R57 血缘成环：${v.id}`); break; }
    seen.add(cur.parent);
    cur = a.versions.find((x) => x.id === cur.parent);
  }
}

/**
 * R58：**核心模型少于 3 个谱系节点，必须写明为什么。**
 *
 * 少于 3 个的模型在演化树上是孤点。孤点有两种成因：
 * 「我们没采到」和「它本来就没有历史」—— **这两件事对读者完全不同**，
 * 不许都画成一样的孤点然后不解释。写不出理由，就说明是前一种，那就去采。
 */
for (const m of a.models) {
  if (m.class !== "clip" || (m.tier ?? "core") !== "core") continue;
  const n = (a.versions ?? []).filter((v) => v.m === m.id).length;
  if (n < 3 && !m.lineage_note)
    errs.push(`R58 ${m.family} 只有 ${n} 个谱系节点却没写原因 —— 「没采到」和「本来就没有」是两回事`);
}

// ── 新实体（A2）。**结构先立、校验先行**：结构定错了，填进去的数据全要返工。
// 五个都可以是空数组 —— 不能因为还没填数据就报错。
const skillIds = new Set((a.skills ?? []).map((k) => k.id));
for (const k of a.skills ?? []) {
  const at = `Skill ${k.id}`;
  if (k.cap && !caps.has(k.cap)) errs.push(`R43 Skill 的 cap 不在能力轴内：${at} → ${k.cap}`);
  for (const m of k.native ?? []) if (!models.has(m)) errs.push(`R43 Skill 的原生实现指向不存在的模型：${at} → ${m}`);
  for (const o of [...(k.opensource ?? []), ...(k.platform_feature ?? [])])
    if (!o.src || !o.quote) errs.push(`R44 Skill 的实现条目缺来源或原文：${at} → ${o.name ?? o.p}`);
  // **一个没有「已知限制」的 Skill 页是在卖广告，不是在帮人。**
  if (!(k.limits ?? []).length) warns.push(`R45 Skill 没写已知限制：${at}`);
  if (!k.verified_at) errs.push(`R45a Skill 没写核验日期：${at}`);
}

for (const app of a.applications ?? []) {
  const at = `应用 ${app.id}`;
  for (const skillId of app.skills ?? [])
    if (!skillIds.has(skillId)) errs.push(`R43 应用关联了不存在的 Skill：${at} → ${skillId}`);
  for (const r of app.resources ?? []) {
    if (!["project", "skill", "course", "docs"].includes(r.kind))
      errs.push(`R43 应用资源类型不合法：${at} → ${r.name}`);
    if (!r.url || !r.src || !r.quote)
      errs.push(`R44 应用公开资源缺链接、来源或原文：${at} → ${r.name}`);
    if (r.src && !watchSources.has(r.src))
      errs.push(`R63 应用资源来源没有进入自动监视清单：${at} → ${r.src}`);
  }
}

// 应用会从关联 Skill 自动汇总项目 / Workflow；这些来源也必须有刷新周期，
// 否则页面看起来在更新，真正的开源内容却永远不会进入 watch --due。
//
// **查全部 Skill，不只查被应用引用到的那些。** 原来按应用往下遍历，
// 一个还没进任何应用的 Skill（比如「开源自部署」被从应用层拿掉之后）
// 就悄悄脱离监视 —— 而它的资源照样显示在 /skill 页上。
for (const skill of a.skills ?? []) {
  for (const item of [...(skill.opensource ?? []), ...(skill.workflow ?? [])]) {
    if (item.src && !watchSources.has(item.src))
      errs.push(`R63 Skill 资源来源没有进入自动监视清单：${skill.id} → ${item.src}`);
  }
}

const CHANGES = existsSync(new URL("../data/changes.json", import.meta.url))
  ? JSON.parse(readFileSync(new URL("../data/changes.json", import.meta.url), "utf8")).events
  : [];
for (const e of CHANGES) {
  const at = `变化 ${e.date} ${e.subject ?? e.entity}`;
  // **只有 after 的那是新闻，不是 ChangeEvent。**
  for (const f of ["before", "after", "why"])
    if (!e[f]) errs.push(`R46 变化事件缺 ${f} —— 只有 after 的是新闻不是 ChangeEvent：${at}`);
  for (const x of e.impact ?? []) {
    if (!x.includes(":")) continue;   // 影响可以是一句自然语言，不强求是 id
    const [kind, id] = x.includes(":") ? x.split(":") : ["model", x];
    const okRef = kind === "skill" ? skillIds.has(id) : kind === "capability" ? caps.has(id) : models.has(id);
    if (!okRef) errs.push(`R47 变化事件的影响对象解析不到：${at} → ${x}`);
  }
  // changes.json 里「我们记错了」那一侧不必有外部来源 —— 来源就是我们自己的提交
  if (!e.src && e.side !== "ours") errs.push(`R48 变化事件缺来源：${at}`);
}

/**
 * R92 —— **同一个页面不许在采集簿里登记两次，也不许在引用簿里标两种等级。**
 *
 * 2026-09-19 查出 20 组「同一个 URL 登记了两三次」，根因是 2026-08-15 那一轮
 * 批量补登记**没有按 URL 查重**。后果不是浪费抓取：
 * `kling-api-updates` 是 S、`kling-api` 是 A，**同一份证据的权威度取决于格子恰好引了哪个 id**。
 * 最离谱的是 `hf-image-org` / `hf-text-org` / `hf-sound-org` —— url 完全相同、
 * 没有任何 query 参数，名字里的「文本 / 出图 / 声音」是假的，同一个接口一天抓三遍。
 *
 * 引用簿（atlas.sources）允许同一页有两个 id —— 一个盯 HTML 正文、一个盯 JSON 元数据
 * 是有用的分工；**但它们必须标同一个等级**，否则页面上的出处等级就成了掷骰子。
 */
{
  const byUrl = {};
  for (const s of watchRegistry.sources ?? []) (byUrl[s.url] ??= []).push(s);
  for (const [url, v] of Object.entries(byUrl))
    if (v.length > 1)
      errs.push(`R92 同一个 URL 在采集簿里登记了 ${v.length} 次：${url} —— ` +
        `${v.map((s) => `${s.id}(${s.tier})`).join(" / ")}。合成一个，引用一起改`);
  const cite = {};
  for (const [id, s] of Object.entries(a.sources ?? {})) (cite[s.url] ??= []).push({ id, tier: s.tier });
  for (const [url, v] of Object.entries(cite)) {
    const tiers = [...new Set(v.map((x) => x.tier))];
    if (tiers.length > 1)
      errs.push(`R92b 引用簿里同一页标了 ${tiers.length} 种出处等级：${url} —— ` +
        `${v.map((x) => `${x.id}=${x.tier}`).join(" / ")}。读者看到的等级不该取决于引了哪个 id`);
  }
}

for (const t of a.toolkit ?? []) {
  // **只有链接没有判断的就是 hao123**（§16 原话：不要做一排 Logo 的 hao123）。
  if (!t.verdict) errs.push(`R49 工具箱条目没有我们的判断：${t.site}`);
  if (!t.caveat) errs.push(`R49 工具箱条目没有负面结论 —— 那正是这一页的价值：${t.site}`);
  if (!t.url || !t.checked_at) errs.push(`R49a 工具箱条目缺链接或核验日期：${t.site}`);
}

for (const e of a.effect ?? []) {
  const at = `效果 ${e.m}`;
  if (!mids.has(e.m)) errs.push(`R50a 未知模型：${at}`);
  // **我们不打分，只转述并标明是谁说的。**
  if (!e.who) errs.push(`R50 效果没写是谁说的 —— 我们不打分，只转述：${at}`);
  if (!["third-party", "vendor-claim"].includes(e.kind)) errs.push(`R50b 非法 kind：${at}`);
  if (e.kind === "third-party" && !e.url) errs.push(`R51 第三方效果没有回源链接：${at}`);
  if (!e.quote || !e.as_of) errs.push(`R51a 效果缺原文或核验日期：${at}`);
}

for (const d of a.discount ?? []) {
  if (!pids.has(d.p) || !mids.has(d.m)) errs.push(`R52a 折扣挂到不存在的平台或模型：${d.p} × ${d.m}`);
  if (!d.src || !d.quote) errs.push(`R52 折扣缺来源或原文：${d.p} × ${d.m}`);
}

// ── 动线（A1）。**没有动线，拆页只是把一堆页面摆开。**
const flows = existsSync(new URL("../data/flows.json", import.meta.url))
  ? JSON.parse(readFileSync(new URL("../data/flows.json", import.meta.url), "utf8")).flows
  : null;
if (flows) {
  /**
   * 路由表：全局页 + 方向页 + 动态段样板。
   *
   * **方向页要按 domains 展开。** 路由方向化之后（/atlas/video/tree），
   * 这张表还写着旧的 /tree，于是动线一改就报「引用了不存在的页」——
   * 而真正不存在的恰恰是表里那几个旧路径。**校验表要跟着路由一起改。**
   */
  const GLOBAL = ["/", "/caveats", "/toolkit", "/changes", "/method"];
  const DOMAIN_PAGES = ["", "/tree", "/map", "/scenario", "/models"];
  const ROUTES = [
    ...GLOBAL,
    ...(a.domains ?? []).flatMap((d) => DOMAIN_PAGES.map((seg) => `/${d.id}${seg}`)),
  ];
  const DYN = ["/model/", "/capability/", "/skill/", "/compare/"];
  const known = (p) => ROUTES.includes(p) || DYN.some((d) => p.startsWith(d));
  for (const f of flows) {
    if (!f.steps?.length) errs.push(`R41a 动线没有步骤：${f.id}`);
    f.steps.forEach((s, i) => {
      if (!known(s.page)) errs.push(`R41 动线引用了不存在的页：${f.id} → ${s.page}`);
      for (const e of s.exits ?? []) if (!known(e)) errs.push(`R41 动线出口指向不存在的页：${f.id} → ${e}`);
      // 除末步外必须有出口 —— **没有出口的中间步就是死路**
      if (i < f.steps.length - 1 && !(s.exits ?? []).length)
        errs.push(`R42 动线中间步没有出口（死路）：${f.id} 第 ${i + 1} 步 ${s.page}`);
      if (!s.q) errs.push(`R42a 动线步骤没写它回答的问题：${f.id} → ${s.page}`);
    });
  }
}

/**
 * 方向与轨（H5 扩方向的地基）。
 *
 * **轨是方向的属性，不是全局枚举。** AI 视频分两轨（离线出片 / 实时交互）是它
 * 自己的事；AI 图像只有一轨，AI 编程更没有这个分法。所以：
 *   - 每个方向自己声明 tracks；
 *   - model.class 必须是**它所属方向**声明过的轨；
 *   - skills / applications 也要有 domain —— 少了这一栏，扩方向时它们会
 *     **同时出现在每个方向下**，而且没有任何一处会报错。
 */
const domainIds = new Set((a.domains ?? []).map((d) => d.id));
if (!domainIds.size) errs.push("R64 一个方向都没有 —— domains 是空的");
for (const d of a.domains ?? []) {
  if (!(d.tracks ?? []).length) warns.push(`R64 方向没声明 tracks：${d.id}（前端只能拿 id 当名字显示）`);
  const seenTrack = new Set();
  for (const t of d.tracks ?? []) {
    if (!t.id || !t.zh || !t.short) errs.push(`R65 轨缺 id/zh/short：${d.id} → ${JSON.stringify(t)}`);
    if (seenTrack.has(t.id)) errs.push(`R65 同一方向里轨 id 重复：${d.id} → ${t.id}`);
    seenTrack.add(t.id);
  }
}
const tracksOfDomain = (dom) =>
  new Set(((a.domains ?? []).find((d) => d.id === dom)?.tracks ?? []).map((t) => t.id));
for (const m of a.models) {
  const dom = m.domain ?? "video";
  if (!domainIds.has(dom)) errs.push(`R64 模型挂到不存在的方向：${m.id} → ${dom}`);
  else if (!tracksOfDomain(dom).has(m.class))
    errs.push(`R65 模型的轨没在它的方向里登记：${m.id} 是 ${m.class}，但方向 ${dom} 只有 ${[...tracksOfDomain(dom)].join("/") || "（无）"}`);
}
for (const k of ["capabilities", "skills", "applications"]) {
  for (const x of a[k] ?? []) {
    const dom = x.domain ?? "video";
    if (!domainIds.has(dom)) errs.push(`R64 ${k} 挂到不存在的方向：${x.id} → ${dom}`);
    if (!x.domain) warns.push(`R64 ${k} 没写 domain，按 video 兜底：${x.id} —— 扩方向前必须补齐`);
  }
}

const used = new Set([
  ...a.support.map((s) => s.src),
  ...(a.availability ?? []).map((v) => v.src),
  ...(a.platforms ?? []).map((p) => p.discloses_src), // 透明度也是引用，漏了会误报 R10
  ...(a.investments ?? []).map((v) => v.src),         // 投资关系也是引用
  ...(a.skills ?? []).flatMap((k) => (k.workflow ?? []).map((w) => w.src)),   // workflow 来源
  ...(a.skills ?? []).flatMap((k) => (k.opensource ?? []).map((o) => o.src)), // 开源实现的来源，漏了会误报 R10
  ...(a.skills ?? []).flatMap((k) => (k.platform_feature ?? []).map((f) => f.src)),
  ...(a.applications ?? []).flatMap((app) => (app.resources ?? []).map((r) => r.src)), // 应用的课程与文档来源
  ...a.models.map((m) => m.arch_src),                 // 架构标注也是引用
  ...a.models.map((m) => m.version_src),              // 版本号的出处（闭源图像几家只有这一栏能挂）
  // 谱系节点的来源。**漏了这一条会误报** —— 闭源那五家（Claude / GPT / Gemini /
  // 豆包 / Grok）的官方弃用表与更新日志**只被谱系引用**，不挂在任何能力格上。
  ...(a.versions ?? []).map((v) => v.src),
  /**
   * 效果值的来源。**这个 `used` 集合已经漏过三次**（平台透明度、谱系、效果值），
   * 每次都表现成「某个源登记了却没人引用」的假警告 ——
   * 而假警告的代价是：真的没人引用时，没人再当回事。
   * 加新的一类带 src 的数据时，**记得回到这里加一行**。
   */
  ...(a.effect ?? []).map((e) => e.src),
  ...(a.pricing ?? []).map((q) => q.src),
].filter(Boolean));
for (const id of srcIds) if (!used.has(id)) warns.push(`R10 来源登记了但没被引用：${id}`);

// Core 每轨 ≤10（ontology 规则四）。加第 11 个之前必须先踢掉一个。
for (const cls of ["clip", "realtime"]) {
  const n = a.models.filter((m) => m.class === cls && isCore(m)).length;
  if (n > 10) errs.push(`R11 ${cls} 轨 Core 收了 ${n} 个 Family，超过上限 10 —— 加第 11 个之前必须先踢掉一个`);
}

const by = { yes: 0, no: 0, unknown: 0 };
const perClass = {};
for (const s of a.support) {
  const mm = models.get(s.m);
  if (mm && !isCore(mm)) continue; // extended 不进对外统计
  by[s.state] += 1;
  const cls = mm?.class ?? "?";
  perClass[cls] ??= { yes: 0, no: 0, unknown: 0 };
  perClass[cls][s.state] += 1;
}

/**
 * ── 快讯（`alert`）────────────────────────────────────────────
 *
 * 快讯是**站上唯一会主动打断阅读的东西**，门槛得由机器守住，不能靠自觉。
 * 下面几条都是「错了不会有任何物理症状」的那类：横幅照样渲染、RSS 照样生成，
 * 只是内容站不住脚 —— 和违禁词一样，必须自动查。
 *
 * 用上面已经读好的 `CHANGES`，**不再单独读一遍 changes.json** ——
 * 同一份数据在同一支脚本里读两遍，迟早两处用的不是同一份。
 */
{
  const today = new Date().toISOString().slice(0, 10);
  const hot = CHANGES.filter((e) => e.alert);
  for (const e of hot) {
    const at = `快讯 ${e.id ?? e.date}`;
    if (!e.alert.headline) errs.push(`R92 ${at} 没有 headline —— 横幅上要显示的就是它`);
    /** `until` 现在可以不写：不写就是 date + 7 天（alert.mjs 的 CYCLE_DAYS）。 */
    /** 出处这条最要紧：横幅上没有出处，它就是一条广告，而这一站全部说服力都建立在出处上。 */
    if (!e.src) errs.push(`R94 ${at} 没有 src —— 最显眼的位置更不能没有出处`);
    if (!e.why) errs.push(`R96 ${at} 没有 why —— 只说发生了什么，那是厂商的 changelog`);
    /**
     * 挂多久可以由写的人定，但**上限是一期（7 天）**。
     * 原来是 30 天，负责人 08-19 判太久：挂满一个月的快讯第二周起就是背景板，
     * 而横幅一旦被学会忽略，下一条真要紧的也一起没人看。
     */
    const span = (Date.parse(untilOf(e)) - Date.parse(e.date)) / 864e5;
    if (Number.isFinite(span) && span > CYCLE_DAYS)
      errs.push(`R97 ${at} 挂 ${Math.round(span)} 天，超过一期（${CYCLE_DAYS} 天）—— 挂这么久的事该写进正文，不该当横幅`);
    if (e.alert.until && Number.isFinite(span) && span < 0) errs.push(`R98 ${at} 的 until 早于 date`);
  }
  /**
   * **同时在架不超过 3 条。** 横幅一多就没人看了 —— 那时它比没有更糟，
   * 因为读者会学会忽略页面顶部那一整块。
   */
  /**
   * **R99 只管手写的那批。** 自动上架（新模型 / 版本更迭）由 `liveAlerts` 截到 3 条，
   * 截不掉的不会发生 —— 拿它去报错等于自己罚自己。手写超了才是真的作者失误。
   * 两处用同一个函数算，不再各算各的（2026-08-19 那次两边差一条的根因）。
   */
  const { hand, items: shown, more } = liveAlerts(CHANGES, today);
  if (hand.length > 3) errs.push(`R99 手写在架的快讯 ${hand.length} 条，上限 3 条 —— 横幅一多就没人看了`);
  const live = shown;
  if (more) warns.push(`R99b 今天有 ${shown.length + more} 条够格上头条，横幅只放得下 ${shown.length} 条 —— 截掉的 ${more} 条靠「还有 N 条 →/changes」那行兜底`);
  if (hot.length) console.log(`快讯 ${hot.length} 条（在架 ${live.length}）`);
}

console.log(`Core 格子 ${by.yes + by.no + by.unknown}（库内共 ${a.support.length}） · ✅${by.yes} ❌${by.no} ⬜${by.unknown}（⬜ 占 ${Math.round((by.unknown / (by.yes + by.no + by.unknown)) * 100)}%）`);
for (const [cls, t] of Object.entries(perClass))
  console.log(`  ${cls}：✅${t.yes} ❌${t.no} ⬜${t.unknown}`);
const older = (a.availability ?? []).filter((v) => v.match === "older").length;
console.log(`平台 ${(a.platforms ?? []).length} 个 · 可用性 ${(a.availability ?? []).length} 条（其中 ${older} 条上架的不是当前主力版本）`);
const geo = {};
for (const m of a.models) { const o = (a.orgs ?? []).find((x) => x.id === m.org); if (o?.hq) geo[o.hq.country] = (geo[o.hq.country] ?? 0) + 1; }   // hq 可缺 —— 缺就不进地理统计，别崩
const d = {};
for (const pf of a.platforms ?? []) d[pf.discloses] = (d[pf.discloses] ?? 0) + 1;
console.log(`平台透明度：🟢公示 ${d.yes ?? 0} · 🟡部分 ${d.partial ?? 0} · 🔴不提 ${d.no ?? 0} · ⬜我们没看到 ${d.blocked ?? 0} · 不适用 ${d["n/a"] ?? 0}`);
const pu = {};
for (const q of a.pricing ?? []) pu[q.unit] = (pu[q.unit] ?? 0) + 1;
console.log(`价格 ${(a.pricing ?? []).length} 条 · 计价单位：${Object.entries(pu).map(([k, v]) => `${k} ${v}`).join(" / ")}` +
  `（**能横向比的只有 per-second 那几条**）`);
console.log(`公司 ${(a.orgs ?? []).length} 家 · 模型按总部：${Object.entries(geo).map(([k, v]) => `${k} ${v}`).join(" / ")} · 投资关系 ${(a.investments ?? []).length} 条`);
if (flows) console.log(`动线 ${flows.length} 条，共 ${flows.reduce((n, f) => n + f.steps.length, 0)} 步`);
console.log(`来源 ${srcIds.size} 条，官方 ${Object.values(a.sources).filter((s) => s.tier === "official").length} 条`);
for (const w of warns) console.log(`  警告 ${w}`);
if (errs.length) {
  for (const e of errs) console.error(`  错误 ${e}`);
  console.error(`\n${errs.length} 个错误。`);
  process.exit(1);
}
console.log("校验通过。");
