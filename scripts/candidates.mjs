/**
 * 候选名单：**从抓到的数据里筛该收谁，而不是我拍脑袋。**
 *
 * 现在 clip 轨那 9 个 Family 是我从交接文档里抄的。抄来的名单有两个毛病：
 * ① 它是某个时点的快照，会过期（Sora 已停服还在里面）；
 * ② 它反映的是写文档那个人的视野，不是世界的实际分布 ——
 *    AA 榜第 5、第 6 的 HappyHorse 我压根没听说过。
 *
 * 两路证据，对应两种「重要」：
 *   · Artificial Analysis 榜 —— 有人真的在用、且质量排得上号（闭源侧的信号）
 *   · Hugging Face 下载量   —— 开源侧的实际采用度（闭源模型在这里是隐形的）
 *
 * 两路都只是**发现**，不是收录。收不收按 ontology 规则一（是不是模型）
 * 与规则四（Core 每轨 ≤10，加第 11 个前先踢一个）人工定。
 *
 *   node scripts/candidates.mjs   →  data/candidates.md
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { NOISE } from "./lib/model-filters.mjs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = `${dirname(fileURLToPath(import.meta.url))}/..`;
const atlas = JSON.parse(readFileSync(`${ROOT}/data/atlas.json`, "utf8"));
const snap = (id) =>
  existsSync(`${ROOT}/data/snapshots/${id}.json`)
    ? JSON.parse(readFileSync(`${ROOT}/data/snapshots/${id}.json`, "utf8"))
    : null;

/**
 * 已收录的 Family 名，用来判断候选是不是新面孔。
 *
 * **只放模型名，不放厂商名。** 第一版把厂商也放进来了，结果 AA 榜第 5 的
 * HappyHorse 被判成「已收录」—— 因为它的厂商 Alibaba-ATH 含「Alibaba」，
 * 而 Wan 的厂商字段里有「阿里 Alibaba」。
 * **同一家公司完全可以有互不相关的 Family**（Google 有 Veo 和 Gemini Omni，
 * 阿里有 Wan 和 HappyHorse）—— 按厂商去重会把整条产品线漏掉。
 */
const known = new Set();
for (const m of atlas.models) {
  known.add(m.family.toLowerCase());
  known.add(m.version.toLowerCase());
  for (const w of `${m.family} ${m.zh}`.toLowerCase().split(/[\s（）()·]+/)) if (w.length > 2) known.add(w);
}
/**
 * ⚠️ **机构名也要算「已知」。** 2026-08-14 抓到的误判：`Lightricks` ——
 * LTX 的厂商，我们早就收了，却因为 `known` 里只有**模型名**而被当成新面孔，
 * 接着又被新加的「量化/搬运号」判据误伤（它那 18 个仓库里多数是 GGUF 与 diffusers 端口）。
 * **两个 bug 叠在一起，把一家真厂商判成了二次分发号。**
 */
for (const o of atlas.orgs ?? []) {
  for (const w of [o.id, o.name, o.en]) {
    const k = String(w ?? "").toLowerCase().trim();
    if (k.length >= 3) known.add(k);
  }
}

/**
 * ⚠️ **比之前先把连字符、下划线、空格抹平。** 2026-08-14 上午刚修过一次
 * （`known` 里只有模型名、没有机构名，于是 Lightricks 被当成新面孔），
 * 下午又撞见同一类的第二只：**`black-forest-labs`** —— FLUX 的厂商，
 * 我们库里记的是 `Black Forest Labs`（带空格），两个字符串**互相都不是子串**。
 *
 * **同一个 bug 的第二种写法，说明修的位置不对**：判据不该是「字符串包含」，
 * 而该是「抹平分隔符之后包含」。HF 的组织名用连字符，我们的字段用空格，
 * 这个差异会一直在。
 */
const flat = (x) => String(x).toLowerCase().replace(/[\s\-_.]/g, "");

/**
 * ⚠️ **看过并写下理由的，不该下周再报一遍。**
 *
 * 2026-08-14：按新默认动作把候选逐条判完 —— 该收的收进扩展层，不收的**写进 `excluded`
 * 并说明它该在哪一层**（微调档属于 Skill、超分属于「放大与修复」、ControlNet 属于控制件…）。
 * 然后重跑候选：**一条没少**。因为这支脚本只认「库里有没有这个模型」，
 * 根本不读排除清单 —— 于是「已经判过」和「还没看」在这张表上长得一模一样。
 *
 * **这就是那摞候选永远不收敛的根**（§59.3：不收敛的清单等于没有清单）。
 * 排除条目的 `name` 与 `same_bucket` 一并算作「看过了」。
 */
/**
 * ⚠️ **我们引用过的仓库路径，其组织名也算「已知」。**
 * 2026-08-14：刚把 CogVideoX 与 I2VGen-XL 收进库，候选里 `zai-org`、`ali-vilab`
 * 还是照报 —— 因为我们的机构 id 是 `zhipu`、`alibaba`，**和 HF 的组织名对不上**。
 * 判据应该是「这个组织的仓库有没有出现在我们的证据里」，而不是「名字像不像」。
 */
for (const m of String(JSON.stringify(atlas)).matchAll(/(?:huggingface\.co\/|["「（(\s])([A-Za-z0-9][\w.-]{2,30})\/[\w.-]{2,60}/g)) {
  const k = flat(m[1]);
  if (k.length >= 3) known.add(k);
}

const passed = new Set();
for (const e of atlas.excluded ?? []) {
  for (const w of [e.name, ...(e.same_bucket ?? [])]) {
    const k = flat(String(w).split("/")[0]);   // 组织名就够了：`John6666/xxx` 与 `John6666` 是同一件事
    if (k.length >= 3) passed.add(k);
  }
}
const knownFlat = new Set([...known].map(flat));
const isNew = (s) => {
  const low = flat(s);
  if ([...passed].some((k) => low.includes(k) || k.includes(low))) return false;   // 判过了
  return ![...knownFlat].some((k) => k.length >= 3 && (low.includes(k) || k.includes(low)));
};

/**
 * **两个方向各有自己的两路证据。**
 *
 * 原来这里写死了 `aa-t2v` / `hf-t2v` 这几个视频快照 —— 图像方向立起来之后，
 * 这支脚本对它是全空的：跑出来永远「没有新面孔」，而那**不是结论，是没看**。
 * 加方向只要在这张表里加一行。
 */
const DOMAINS = [
  { id: "video", zh: "AI 视频", boards: ["aa-t2v", "aa-i2v"], hf: ["hf-t2v", "hf-i2v", "hf-v2v"] },
  { id: "image", zh: "AI 图像", boards: ["aa-t2i"], hf: ["hf-t2i", "hf-i2i"] },
];

/** 只数进主表的那些 —— extended 不占规则四的名额。 */
const core = (klass) => atlas.models.filter((m) => m.class === klass && (m.tier ?? "core") === "core").length;

const out = [];
for (const D of DOMAINS) {

// ── 一路：AA 榜。行格式是「名次 区间 厂商 模型名 Elo …… 发布月 价格/min」
const rows = [];
for (const id of D.boards) {
  const t = snap(id)?.text ?? "";
  // 抓「厂商 模型名 …… 四位 Elo」这一段；Elo 是唯一稳定的锚点
  for (const m of t.matchAll(/([A-Z][\w.\- ]{2,28}?)\s+([A-Z][\w.\- ]{2,34}?)\s+(1,\d{3})\s/g)) {
    const vendor = m[1].trim(), model = m[2].trim();
    /**
     * ⚠️ **表头会被当成一行数据。** 2026-08-14 的候选清单里赫然写着
     *「厂商 Open · 模型 Weights · Elo 1237」—— 那是 AA 榜的列标题「Open Weights」，
     * 后面跟着的 1237 是它下面第一行的 Elo。**Elo 是稳定的锚点，但锚点前面未必是数据。**
     * 挡掉已知的列标题词；这类脏数据比漏一行更贵：人会真的去查一个不存在的模型。
     */
    if (/^(open|model|creator|arena|rank|quality|price|speed|elo|score)$/i.test(vendor)) continue;
    if (/^(weights|name|elo|score|rank|price|creator)$/i.test(model)) continue;
    rows.push({ vendor, model, elo: Number(m[3].replace(",", "")), board: id });
  }
}
const byModel = new Map();
for (const r of rows) {
  const k = r.model.toLowerCase();
  if (!byModel.has(k) || byModel.get(k).elo < r.elo) byModel.set(k, r);
}
const aaNew = [...byModel.values()].filter((r) => isNew(r.model)).sort((a, b) => b.elo - a.elo);

// ── 另一路：HF 下载量。组织名就是厂商，仓库数是它在开源侧的投入
const orgs = new Map();
for (const id of D.hf) {
  for (const it of snap(id)?.items ?? []) {
    const repo = it.split("\t")[0];
    if (!repo.includes("/")) continue;
    const org = repo.split("/")[0];
    if (!orgs.has(org)) orgs.set(org, new Set());
    orgs.get(org).add(repo);
  }
}
/**
 * 个人搬运/量化号会刷屏。原来的注释写着「按仓库数过滤治标不治本，真正的判据是
 * 这个组织自己训模型还是在搬别人的，那要人看一眼」——**说得对，但结果是这一摞
 * 每周都在、永远不收敛**（§59.3：人每周看的必须 ≤20，不收敛的清单等于没有清单）。
 *
 * 2026-08-14 补一条能自动判的：**一个组织的仓库如果全是量化档 / 端口档**
 * （GGUF、AWQ、GPTQ、mlx、fp8、diffusers 端口…），那它做的是二次分发不是发布模型。
 * 判据用的是两支采集共用的 `NOISE` 正则，和「折代际时省掉哪些档」同一把尺子。
 *
 * ⚠️ **略过多少要报出来**，不能静默：静默的过滤和静默的截断一样危险 ——
 * 人看到「新面孔 12 个」时，得知道背后还有 9 个被判成了搬运号。
 */
const isMirror = (repos) => {
  const arr = [...repos];
  const noisy = arr.filter((r) => NOISE.test(r)).length;
  return arr.length >= 2 && noisy / arr.length >= 0.8;
};
const orgRows = [...orgs.entries()].map(([org, repos]) => ({ org, n: repos.size, sample: [...repos][0], mirror: isMirror(repos) }));
const mirrors = orgRows.filter((x) => x.mirror && isNew(x.org));
const hfNew = orgRows
  .filter((x) => x.n >= 2 && isNew(x.org) && !x.mirror)
  .sort((a, b) => b.n - a.n);

out.push([
  `## 【${D.zh}】`,
  ``,
  `### 一、Artificial Analysis 榜上、我们没收的（闭源侧的「有人真在用」）`,
  ``,
  aaNew.length ? `| 厂商 | 模型 | Elo |\n|---|---|---:|` : "（无）",
  ...aaNew.slice(0, 20).map((r) => `| ${r.vendor} | ${r.model} | ${r.elo} |`),
  ``,
  `### 二、Hugging Face 下载量前列、我们没收的组织（开源侧的实际采用度）`,
  ``,
  mirrors.length
    ? `> ⚠️ 另有 **${mirrors.length} 个组织被判成量化 / 搬运号**（仓库八成以上是 GGUF、AWQ、mlx 这类二次分发档），`
      + `已从下表略过：${mirrors.slice(0, 6).map((x) => `\`${x.org}\``).join("、")}${mirrors.length > 6 ? " 等" : ""}。`
      + `**判据是仓库名，不是人品** —— 它们里面若有自训模型，会因为名字不带量化后缀而照常出现在上表。`
    : `> （这一轮没有组织被判成量化 / 搬运号。）`,
  ``,
  hfNew.length ? `| 组织 | 仓库数 | 示例 |\n|---|---:|---|` : "（无）",
  ...hfNew.slice(0, 20).map((x) => `| ${x.org} | ${x.n} | \`${x.sample}\` |`),
  ``,
  `> ⚠️ HF 这一路混着个人搬运号与量化号（QuantStack、city96、calcuis 之类）。`,
  `> **脚本分不出「自己训模型」和「搬别人的」** —— 那要人看一眼组织主页。`,
  `> 不要照单全收，也不要因为混了噪音就整路丢掉：Lightricks、nvidia、zai-org`,
  `> 都是这一路捞出来的，而它们在闭源榜上完全隐形。`,
  ``,
  /**
   * ⚠️ **只数 core，不数 extended。** 2026-08-14 发现这一行一直在报
   *「clip 轨 17/10」—— 看起来我们早就破了规则四的上限，实际 core 只有 9 个，
   * 另外 8 个是 extended（规则四明写：extended 是「库里有、不进主要视觉」，**不占名额**）。
   * **一个报表把自己报成违规**，比不报还糟：要么让人去删不该删的，要么让人开始无视这行数字。
   */
  `### 当前 Core（clip 轨 ${core("clip")}/10，realtime 轨 ${core("realtime")}/10；括号里是含扩展层的总数 ${atlas.models.filter((m) => m.class === "clip").length} / ${atlas.models.filter((m) => m.class === "realtime").length}）`,
  ``,
  ...atlas.models.map((m) => `- \`${m.class}\` ${m.family} ${m.version}（${m.version_as_of}）${m.status && m.status !== "active" ? ` — **${m.status}**` : ""}`),
  ``,
  `> clip 轨只剩 1 个空位。按规则四，再进新的就必须先踢一个 ——`,
  `> 最该出去的是 **Sora 2**（已公告停服）。但**停服的模型不该从库里删**：`,
  `> 「它没了」本身是有用的信息，应降到 Extended 层，而不是消失。`,
].join("\n"));

console.log(`${D.zh}：AA 榜新面孔 ${aaNew.length} 个，HF 新组织 ${hfNew.length} 个`);
for (const r of aaNew.slice(0, 6)) console.log(`  [AA ${r.elo}] ${r.vendor} · ${r.model}`);
}   // ← 方向循环到此为止

/**
 * **人工发现的候选也要有落脚处。**
 *
 * 两条自动路各有盲区：AA 榜只收上了竞技场的闭源模型，HF 那一路只看开源权重。
 * 2026-08-13 撞上一个两边都看不见的 —— Black Forest Labs 的 FLUX 3 从图像跨进了视频，
 * 而它是闭源 API、不在文生图榜上。**这类只能人看见。**
 *
 * 之前这种发现无处可写：`data/candidates.md` 是这支脚本每次重跑覆盖的，
 * 手写进去等于没写。所以另立 `data/candidates-manual.json`，在这里并进来。
 */
const manual = existsSync(`${ROOT}/data/candidates-manual.json`)
  ? JSON.parse(readFileSync(`${ROOT}/data/candidates-manual.json`, "utf8")).rows ?? []
  : [];
const manualMd = manual.length
  ? [
      `## 人工发现的（自动那两路看不见的）`,
      ``,
      `> 两条自动路各有盲区：AA 榜只收上了竞技场的闭源模型，HF 那一路只看开源权重。`,
      `> **落在两边之外的，只能人看见** —— 写在 \`data/candidates-manual.json\` 里，不会被重跑冲掉。`,
      ``,
      ...manual.flatMap((r) => [
        `### \`${r.domain}\` ${r.org} · ${r.family}（${r.found_at} 发现）`,
        ``,
        `**为什么两路都捞不到**：${r.why}`,
        ``,
        `**怎么撞见的**：${r.how}`,
        ``,
        ...(r.evidence ?? []).map((e) => `- ${e}`),
        ``,
        `来源：${r.src}`,
        ``,
        `**${r.decision}**`,
        ...(r.note ? ["", `> ${r.note}`] : []),
        ``,
      ]),
    ].join("\n")
  : "";

const md = [
  `# 收录候选 · ${atlas.generated_at}`,
  ``,
  `> **这份名单是筛出来的，不是抄来的。**`,
  `> 两路都只是**发现**。收不收按 ontology 规则一（是不是模型）`,
  `> 与规则四（Core 每轨 ≤10，**加第 11 个之前先踢掉一个**）人工定。`,
  `>`,
  `> **按方向分开列** —— 混在一起时，图像那一半永远是空的，`,
  `> 而空看起来像「没有新面孔」，其实是「没看」。`,
  ``,
  ...out,
  ...(manualMd ? [manualMd] : []),
].join("\n\n");

writeFileSync(`${ROOT}/data/candidates.md`, md);
console.log(`→ data/candidates.md`);
