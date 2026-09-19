/**
 * 校验规则的自测：**拿一条已知是错的数据喂进去，看规则响不响。**
 *
 * ## 为什么必须有这支
 *
 * 「写了校验规则」和「校验规则真的会拦住错」是两件事。
 * 这一轮已经抓到过一个活的反例：verify 里查全站导航用的是通用的 `<nav>` 标签，
 * 而详情页的面包屑**也是** `<nav>` —— 把全站导航整个拆掉，检查照样绿。
 * **那条规则存在，但它拦不住它该拦的东西。**
 *
 * 所以每加一条规则，就在这里加一个「故意写错」的样例。
 * 规则号没被报出来，就当它不存在。
 *
 *   node scripts/test-rules.mjs
 */
import { readFileSync, writeFileSync, copyFileSync, unlinkSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = join(ROOT, "data/atlas.json");
const BAK = join(ROOT, "data/.atlas.test-backup.json");

/** 每条：改坏一处 → 期望这些规则号被报出来。 */
const CASES = [
  /**
   * 2026-09-19 加。当天查出 20 组「同一个 URL 登记了两三次」，
   * 而**没有任何检查会说这件事** —— 20 组在库里躺着，是人一条条数出来的。
   */
  { name: "同一页登记两次 / 同一页标两种出处等级",
    want: ["R92", "R92b"],
    mut: (a, flows, changes, sources) => {
      sources.sources.push({ ...sources.sources.find((s) => s.id === "vidu-changelog"), id: "__dup__" });
      a.sources["__dup_cite__"] = { ...a.sources["vidu-changelog"], tier: "third-party" };
    } },

  { name: "Skill：cap 不存在 / 原生实现是假模型 / 没写限制 / 没核验日期",
    want: ["R43", "R44", "R45", "R45a"],
    mut: (a) => { a.skills = [{ id: "bad", zh: "坏", en: "bad", cap: "不存在", native: ["查无此模型"],
      opensource: [{ name: "x" }], limits: [], verified_at: "" }]; } },

  { name: "变化事件：只有 after（那是新闻不是 ChangeEvent）/ 影响对象查无此人 / 没来源",
    want: ["R46", "R47", "R48"],
    // 变更事件的真源是 data/changes.json，不是 atlas.json —— **同一个口径只有一份**
    mut: (a, flows, changes) => { changes.events = [{ id: "bad", date: "2026-01-01", side: "world",
      subject: "坏", after: "变好了", impact: ["skill:查无此技能"] }]; } },

  { name: "工具箱：只有链接没有判断（那就是 hao123）",
    want: ["R49"],
    mut: (a) => { a.toolkit = [{ task: "x", site: "某站", url: "https://x", checked_at: "2026-08-09" }]; } },

  { name: "效果：没写是谁说的 / 第三方却没有回源链接",
    want: ["R50", "R51", "R51a"],
    mut: (a) => { a.effect = [{ m: "kling", kind: "third-party", value: "第一名" }]; } },

  { name: "折扣：挂到不存在的平台 / 没有原文",
    want: ["R52", "R52a"],
    mut: (a) => { a.discount = [{ p: "查无此平台", m: "kling", rule: "买多了", off: "5 折" }]; } },

  { name: "可用性：非法 access_type / 有效期已过却还标 available",
    want: ["R53", "R54"],
    mut: (a) => { a.availability[0] = { ...a.availability[0], access_type: "瞎写", valid_to: "2020-01-01", status: "available" }; } },

  { name: "能力格：说「支持」却没有来源（不许猜）",
    want: ["R4"],
    mut: (a) => { a.support[0] = { ...a.support[0], state: "yes", src: undefined }; } },

  { name: "版本谱系：parent 的日期晚于自己（时间倒流的血缘）",
    want: ["R56"],
    mut: (a) => { const c = a.versions.find((v) => v.parent); c.date = "2020-01-01"; } },

  { name: "谱系：核心模型只有 1 个节点却不写原因（孤点有两种成因，不许混）",
    want: ["R58"],
    mut: (a) => { a.versions = a.versions.filter((v) => v.m !== "kling"); 
      const m = a.models.find((x) => x.id === "kling"); delete m.lineage_note; } },

  { name: "动线：中间步没有出口（死路）/ 引用了不存在的页",
    want: ["R41", "R42"],
    mut: (a, flows) => { flows.flows[0].steps[0].exits = []; flows.flows[0].steps[1].page = "/查无此页"; } },
  /* ── 专项子系统（R77–R90）。**这一整族此前一条样本都没有** ──
   *
   * 2026-08-17 体检查出来：114 条规则只有 20 条被证明会响。
   * 而专项那一族是最近半年长出来的、改动最频繁的一块 —— 恰恰全裸奔。
   * 这里一次补上十条，把「专项页的骨架」这条线焊死。
   */
  { name: "专项项目：只写好处没写局限（那是广告不是评估）/ 引了不存在的决定",
    want: ["R77"],
    mut: (a) => { const p = a.topics[0].projects[0];
      p.good = []; p.bad = []; p.unfit = ""; p.decisions = ["查无此决定"]; } },

  { name: "专项项目：只有一张图、也没写 wiki:none 豁免",
    want: ["R81"],
    mut: (a) => { const p = a.topics[0].projects.find((x) => x.diagrams?.length >= 2);
      p.diagrams = [p.diagrams[0]]; delete p.wiki; } },

  { name: "专项：项目归到不存在的类型（它会从页面上整个消失，不报错）",
    want: ["R83"],
    mut: (a) => { a.topics[0].projects[0].group = "查无此类型"; } },

  { name: "专项教程：缺链接与核验日（一条 404 的教程比没有教程更伤）",
    want: ["R84"],
    mut: (a) => { const p = a.topics[0].projects.find((x) => x.tutorials?.length);
      p.tutorials = [{ title: "坏教程" }]; } },

  { name: "作品：没有出处（少了出处它就退回成传闻）",
    want: ["R85"],
    mut: (a) => { const t = a.topics.find((x) => x.works?.length);
      t.works[0] = { ...t.works[0], src: [], verified_at: "" }; } },

  { name: "入门读物：缺链接与核验日",
    want: ["R86"],
    mut: (a) => { const t = a.topics.find((x) => x.basics?.length);
      t.basics[0].items = [{ title: "坏条目" }]; } },

  { name: "特点标签：空着 / 写成谁都能贴的话",
    want: ["R87"],
    mut: (a) => { a.topics[0].projects[0].tags = ["功能全"];
      a.topics[0].projects[1].tags = []; } },

  { name: "仓库数字：星速和公式对不上（数字是算出来的，不是独立事实）",
    want: ["R88"],
    mut: (a) => { const p = a.topics[0].projects.find((x) => x.stars_per_month);
      p.stars_per_month = 99999; } },

  /* 这两条是 2026-08-17 加的，加的当天就该有样本 —— 补上。 */
  /**
   * ⚠️ 这条样本第一版是错的，而**自测当场把它照出来了**：
   * 我用 `find(x => x.searched)` 随手取了第一条带 searched 的决定，
   * 结果取到的是视频专项「选题与钩子」—— 它的 fit 以「上一轮我判错了」开头，
   * 正好落进 R89 的「认错句放过」豁免里，删掉 searched 也不会报。
   *
   * **样本必须挑真正会被判据命中的那一条**，否则它测的是豁免不是规则。
   * 所以这里直接构造一条断定「没有」的决定，不去数据里碰运气。
   */
  { name: "「这一格是空的」却不交代搜过哪些词（我没搜到 ≠ 它不存在）",
    want: ["R89"],
    mut: (a) => { a.topics[0].decisions.push({
      id: "test-empty", zh: "测试用的空格", owner: "user", cap: null, handle: "—",
      fit: "开源侧没有做这件事的项目，一个都没有。",
      scenarios: [{ when: "要做这件事", use: "没有现成方案" }],
      /* 故意不给 searched —— 规则该在这里红 */ }); } },

  { name: "自述与实测：引了不存在的项目 / 没有出处（没出处的对照就是传闻）",
    want: ["R90"],
    mut: (a) => { const t = a.topics.find((x) => x.conflicts?.length);
      t.conflicts[0] = { ...t.conflicts[0], project: "查无此项目", src: [], verified_at: "" }; } },
];

copyFileSync(LIVE, BAK);
const FLOWS = join(ROOT, "data/flows.json");
const FBAK = join(ROOT, "data/.flows.test-backup.json");
copyFileSync(FLOWS, FBAK);
const CH = join(ROOT, "data/changes.json");
const CBAK = join(ROOT, "data/.changes.test-backup.json");
copyFileSync(CH, CBAK);
// **采集簿也要能改坏。** R92 查的是 data/sources.json 里的同 URL 重复，
// 而这支自测原来只会改 atlas / flows / changes —— 规则考不到的地方，等于没考。
const SRC = join(ROOT, "data/sources.json");
const SBAK = join(ROOT, "data/.sources.test-backup.json");
copyFileSync(SRC, SBAK);

let bad = 0;
for (const c of CASES) {
  const a = JSON.parse(readFileSync(BAK, "utf8"));
  const f = JSON.parse(readFileSync(FBAK, "utf8"));
  const ch = JSON.parse(readFileSync(CBAK, "utf8"));
  const sr = JSON.parse(readFileSync(SBAK, "utf8"));
  c.mut(a, f, ch, sr);
  writeFileSync(LIVE, JSON.stringify(a, null, 2));
  writeFileSync(FLOWS, JSON.stringify(f, null, 2));
  writeFileSync(CH, JSON.stringify(ch, null, 2));
  writeFileSync(SRC, JSON.stringify(sr, null, 2));

  let out = "";
  try { out = execFileSync("node", [join(ROOT, "scripts/validate.mjs")], { encoding: "utf8" }); }
  catch (e) { out = `${e.stdout ?? ""}${e.stderr ?? ""}`; }

  const miss = c.want.filter((r) => !new RegExp(`\\b${r}\\b`).test(out));
  if (miss.length) { bad += 1; console.log(`✗ ${c.name}\n   没报出：${miss.join(" ")}`); }
  else console.log(`✓ ${c.name}`);
}

copyFileSync(BAK, LIVE); unlinkSync(BAK);
copyFileSync(FBAK, FLOWS); unlinkSync(FBAK);
copyFileSync(CBAK, CH); unlinkSync(CBAK);
copyFileSync(SBAK, SRC); unlinkSync(SBAK);

console.log(bad ? `\n${bad} 条规则是摆设 —— 它存在，但拦不住它该拦的东西。` : `\n${CASES.length} 条规则全部会响。`);
process.exit(bad ? 1 : 0);
