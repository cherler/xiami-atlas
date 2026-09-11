/**
 * 分享图自动生成（方案 §19 · 任务 G4）。
 *
 * §19 的原话是「网站本身的知识图应该是可分享内容，而不是只能分享 URL」。
 * 一张纯文字的 OG 卡片做不到这件事 —— 得**把这一页的结论画进图里**。
 *
 * ## 数据只有一份
 *
 * 和 make-matrix.mjs 同一条纪律：图里每一格、每一个计数都是从 atlas.json 算的，
 * 不是手抄的。手抄的图迟早和数据对不上，而这个项目卖的就是「对得上」。
 *
 * ## 为什么不是「每页 ×4 个比例」
 *
 * §19 列了 16:9 / 1:1 / 3:4 / 9:16 四个比例。33 个页面全乘四是 132 张图，
 * 其中一百多张**永远不会有人看**：1:1 / 3:4 / 9:16 是给人手动发社交媒体用的，
 * 没有人会手动把「首尾帧能力详情页」发到小红书。
 *
 * 所以按用途分：
 *   - **16:9 每页都出** —— 微信/Twitter/Slack 抓的 OG 图是这个比例，这是刚需
 *   - **四个比例只出首页和总表** —— 那才是真会被手动转发的东西
 *
 * §19 写的是「可自动生成」，不是「必须全生成」。生成一百多张没人看的图，
 * 正是这个项目该避免的那种活。要给某一页补别的比例，命令行点名即可。
 *
 *   node scripts/make-share.mjs              # 按上面的默认策略出图
 *   node scripts/make-share.mjs --all-ratios # 每页都出四个比例
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const a = JSON.parse(readFileSync(join(ROOT, "data/atlas.json"), "utf8"));
const OUT = join(ROOT, "public/og");
const ALL = process.argv.includes("--all-ratios");

const RATIOS = {
  "16x9": [1200, 675],
  "1x1": [1080, 1080],
  "3x4": [1080, 1440],
  "9x16": [1080, 1920],
};

const C = { paper: "#eff0ec", card: "#f7f8f5", ink: "#171b18", muted: "#6b716c",
  rule: "#d3d6ce", yes: "#2c6b5a", no: "#b03a2c", unknown: "#ad8324" };

const cell = (m, c) => a.support.find((s) => s.m === m && s.c === c) ?? { state: "unknown" };
const org = (m) => a.orgs.find((o) => o.id === m.org);
const label = (m) => {
  const last = m.family.split(" ").pop();
  return m.version.startsWith(last) ? `${m.family.slice(0, -last.length).trim()} ${m.version}` : `${m.family} ${m.version}`;
};
/**
 * **一卷一张卡，不是全站一张。**
 *
 * 原来 capsOf 和 matrixCard 都写死了 `domain === "video"` / `class === "clip"` ——
 * 那是只有一卷时的写法。图像与文本上线后没人回头改它，后果是
 * **把 /atlas/text 分享出去，别人看到的是一张 AI 视频的表**，
 * 标题还写着「9 个 AI 视频模型」。和 R68 拦的是同一类问题：
 * 做完一卷就以为收工，跨方向的东西没人记得回来补。
 */
/**
 * **判据是「有没有数据」，不是「上没上线」。**
 * 原来按 `state === "live"` 筛 —— 可 planned 的方向页照样能打开、照样声明
 * 自己的 og:image（页面代码是通用的），于是新立的声音卷一进来就缺两张图，
 * 被出站检查逮个正着。页面存在，它的卡就该存在。
 */
const DOMAINS = a.domains.filter((d) => a.models.some((m) => (m.domain ?? "video") === d.id));
const domName = (dom) => a.domains.find((d) => d.id === dom)?.name ?? dom;
/** 一卷的主轨：视频有两轨，取离线出片那条（另一条模型太少，画出来是张空表）。 */
/**
 * 一卷的主轨 = 它 tracks 里的第一条。**别再写死映射表** ——
 * 原来是 `{video:"clip", image:"still", text:"chat"}`，加声音卷时它落到兜底的 "clip"，
 * 于是 modelsOfDom 返回空数组，notes() 里 `unk[0].m` 直接崩。
 * 加一卷就要回来改一次的表，迟早会漏改；从 domains 里读就不会。
 */
const mainClass = (dom) => a.domains.find((d) => d.id === dom)?.tracks?.[0]?.id ?? "clip";
const capsOf = (cls, dom = "video") =>
  a.capabilities.filter((c) => (c.domain ?? "video") === dom && (c.class === "both" || c.class === cls));
const modelsOfDom = (dom) =>
  a.models.filter((m) => (m.domain ?? "video") === dom && m.class === mainClass(dom) && (m.tier ?? "core") === "core");
const esc = (s) => String(s).replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch]);

/**
 * 卡片骨架。**页脚那三样是全站口径，每张图都必须带** ——
 * 数据版本、核验日期、以及「机器录入」这句话。图会脱离网站单独流传，
 * 图上不写清楚，转发出去就变成了没有出处的断言。
 */
const shell = (w, h, body, foot) => `<!doctype html><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${w}px;height:${h}px;background:${C.paper};color:${C.ink};
    font:400 16px/1.5 "PingFang SC","Hiragino Sans GB","Microsoft YaHei",-apple-system,sans-serif;
    display:flex;flex-direction:column;padding:${Math.round(w * 0.045)}px;overflow:hidden;position:relative}
  /**
   * 水印。**页脚那行地址会被裁掉** —— 转发的人截图、二次裁剪，第一个没的就是页脚，
   * 于是图脱离了出处继续流传，而「带出处」正是这个产品的全部价值。
   * 所以在内容区里再留一处，**独立于页脚**：淡、小、贴着上边缘，
   * 不抢内容（负责人 2026-08-12：「不要太明显」），但裁掉页脚它还在。
   */
  .wm{position:absolute;top:${Math.round(h * 0.016)}px;right:${Math.round(w * 0.02)}px;
    font-size:${Math.round(w * 0.0115)}px;letter-spacing:.06em;color:${C.muted};opacity:.42;
    font-weight:500;pointer-events:none}
  .grow{flex:1;min-height:0}  /* 不设 overflow:hidden —— 那会**悄悄裁掉内容**，
     结果就是标题写「11 项能力」、表里只画 7 行，图自己跟自己打架。
     宁可让它溢出被下面的自适应循环量出来，也不要被静静剪掉。 */
  .foot{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;
    border-top:1px solid ${C.rule};padding-top:${Math.round(w * 0.018)}px;margin-top:${Math.round(w * 0.02)}px;
    font-size:${Math.round(w * 0.0135)}px;color:${C.muted};line-height:1.45}
  .brand{font-weight:600;color:${C.ink};white-space:nowrap}
  b{font-weight:600}
  .yes{color:${C.yes}} .no{color:${C.no}} .unk{color:${C.unknown}} .mut{color:${C.muted}}
</style>
<div class="wm">xiamimate.com/atlas</div>
<div class="grow">${body}</div>
<div class="foot">
  <div>${foot}</div>
  <div style="text-align:right">
    <div class="brand">虾米看AI · xiamimate.com/atlas</div>
    <div>数据 ${a.version} · 核验于 ${a.generated_at} · 机器录入，每格带官方来源</div>
  </div>
</div>`;

/**
 * 竖版底下那块「表里看不出来的四件事」。
 *
 * 竖版把模型放行、能力放列之后，表本身只占上面三分之一，
 * 下面空掉六成 —— 一张空掉六成的分享图，读者第一反应是「没加载出来」。
 *
 * 但**不能拿装饰去填**。填的必须是这张表本身讲不出、而读者真该知道的事，
 * 而且和表里的数字一样，全部从 atlas.json 算出来 —— 一个手写数字都不许有。
 */
function notes(w, dom = "video") {
  const caps = capsOf(mainClass(dom), dom);
  const models = modelsOfDom(dom);
  // 新立的卷可能还没有模型/能力 —— **空数据要让位，不是崩掉整批出图**
  if (!models.length || !caps.length) return "";
  // ⬜ 的分布：只报总数会骗人 —— 集中在一两家和平摊到九家，是完全不同的两件事
  const unk = models
    .map((m) => ({ m, n: caps.filter((c) => cell(m.id, c.id).state === "unknown").length }))
    .sort((x, y) => y.n - x.n);
  // **不靠「谁的别名多」来挑** —— 「首尾帧」也有 8 条，但全是 start/end frame 的描述性变体，
  // 谁都猜得到；真坑人的是 Element / Ingredients 这种厂商自造词。这个区分启发式挑不出来，
  // 所以由数据里的 alias_bit_us 直接指认（见 atlas.json 的 $aliases_why）。
  const alias = a.capabilities.find((c) => c.alias_bit_us) ?? a.capabilities.find((c) => (c.aliases ?? []).length >= 5);
  const older = (a.availability ?? []).filter((v) => v.match === "older").length;
  const geo = {};
  for (const m of models) { const o = org(m); if (o?.hq) geo[o.hq.country] = (geo[o.hq.country] ?? 0) + 1; }   // 同上

  const items = [
    [`⬜ 不是平摊的`,
     `${unk[0].m.family} 有 ${unk[0].n}/${caps.length} 项官方没说，${unk[unk.length - 1].m.family} 只有 ${unk[unk.length - 1].n} 项。` +
     `**只报总数会骗人 —— 要看分布。**`],
    alias && [`同一个能力，各家叫法不同`,
     `${alias.zh}：Kling 叫 Element、LTX 叫 Ingredients、还有人叫 Omni Reference、cameo。` +
     `**我们按自己的词去搜，就是这么把「支持」记成了「不支持」。**`],
    older && [`平台上架的，未必是当前主力版本`,
     `${(a.availability ?? []).length} 条上架记录里有 ${older} 条挂的是旧版本。「能力对」不等于「你用得上」。`],
    [`这些模型来自哪里`,
     Object.entries(geo).sort((x, y) => y[1] - x[1]).map(([k, v]) => `${k} ${v}`).join(" · ")],
  ].filter(Boolean);

  return `<div style="margin-top:${Math.round(w * 0.045)}px;border-top:1px solid ${C.rule};padding-top:${Math.round(w * 0.03)}px">
    <div style="font-size:${Math.round(w * 0.026)}px;font-weight:700;margin-bottom:${Math.round(w * 0.022)}px">
      表里看不出来的四件事
    </div>
    ${items.map(([t, d]) => `<div style="margin-bottom:${Math.round(w * 0.022)}px">
      <div style="font-size:${Math.round(w * 0.0195)}px;font-weight:600;margin-bottom:3px">${t}</div>
      <div style="font-size:${Math.round(w * 0.018)}px;color:${C.muted};line-height:1.55">${
        d.replace(/\*\*(.+?)\*\*/g, `<b style="color:${C.ink}">$1</b>`)}</div>
    </div>`).join("")}
  </div>`;
}

/** 首页/总表卡：整张能力矩阵。这是唯一真会被人手动转发的一张。 */
function matrixCard(w, h, dom = "video") {
  const models = modelsOfDom(dom);
  const caps = capsOf(mainClass(dom), dom);
  const tall = h / w > 1.1; // 竖版：转置，模型作行 —— 硬缩会把字压没
  const t = { yes: 0, no: 0, unknown: 0 };
  for (const m of models) for (const c of caps) t[cell(m.id, c.id).state] += 1;
  const M = { yes: "✅", no: "❌", unknown: "⬜" };
  const rows = tall ? models : caps;
  const cols = tall ? caps : models;
  /**
   * 行高**从可用高度反算**，不是拍一个比例。
   * 拍比例的后果已经见过了：16:9 装不下 11 行，靠 zoom 硬缩到 68% 才塞进去 ——
   * 图能出，但字小得没法看，而且底下空一大片。行数会变（能力随时加），
   * 所以尺寸必须是行数的函数。
   */
  const pad = Math.round(w * 0.045);
  const avail = h - pad * 2 - Math.round(w * 0.135); // 减掉页脚与标题块的实测占位
  const rowH = Math.max(20, Math.floor(avail / (rows.length + 1.6))); // +1.6 给表头那行
  const fs = Math.min(Math.round(w * (tall ? 0.016 : 0.0145)), Math.floor(rowH / 1.75));
  const vpad = Math.max(2, Math.round((rowH - fs * 1.2) / 2));
  const head = (x) => (tall ? x.zh : label(x));
  const rowName = (r) => (tall ? label(r) : r.zh);

  return shell(w, h, `
    <div style="font-size:${Math.round(w * 0.033)}px;font-weight:700;line-height:1.25;margin-bottom:${Math.round(w * 0.012)}px">
      ${models.length} 个${esc(domName(dom))}模型 × ${caps.length} 项能力，谁能做什么
    </div>
    <div style="font-size:${Math.round(w * 0.0155)}px;color:${C.muted};margin-bottom:${Math.round(w * 0.022)}px">
      ✅ ${t.yes} 项有官方依据 · ❌ ${t.no} 项官方明说不支持 ·
      <b class="unk">⬜ ${t.unknown} 项官方没说 —— 那是「没说」，不是「不支持」</b>
    </div>
    <table class="fit" style="border-collapse:collapse;font-size:${fs}px;width:100%;table-layout:fixed">
      <tr><th style="width:${tall ? 22 : 18}%"></th>${cols.map((x) => `
        <th style="padding:${vpad}px 2px;font-weight:600;font-size:${fs * 0.92}px;line-height:1.15;
          border-bottom:1px solid ${C.rule};word-break:break-word">${esc(head(x))}</th>`).join("")}</tr>
      ${rows.map((r) => `<tr>
        <td style="padding:${vpad}px 6px ${vpad}px 0;font-weight:600;font-size:${fs * 0.95}px;
          border-bottom:1px solid ${C.rule};line-height:1.2">${esc(rowName(r))}</td>
        ${cols.map((x) => {
          const s = tall ? cell(r.id, x.id) : cell(x.id, r.id);
          return `<td style="text-align:center;padding:${vpad}px 0;border-bottom:1px solid ${C.rule};
            font-size:${fs * 1.05}px">${M[s.state]}${s.via === "separate-task" ? '<sup style="font-size:.6em;color:' + C.muted + '">*</sup>' : ""}</td>`;
        }).join("")}
      </tr>`).join("")}
    </table>
    <div style="font-size:${Math.round(w * 0.0125)}px;color:${C.muted};margin-top:${Math.round(w * 0.014)}px">
      * = 平台的另一个接口，不是生成时的一步
    </div>
    ${tall ? notes(w, dom) : ""}`,
    `每一格都能点开看厂商官方原文与核验日期`);
}

/**
 * 演化树卡：**分发引擎的那一张。**
 * 不画完整的树（67 个节点缩到 1200 宽会糊成一团），画它的**结论**：
 * 哪几条线在开源侧、哪几条在闭源侧、各自迭代了多少次、谁在中间换了向。
 */
function treeCard(w, h, dom = "video") {
  /**
   * ⚠️ 只画这一卷。原来 `for (const v of a.versions)` 是**全站**的产品线 ——
   * 从 9 条涨到 30 多条之后，16:9 怎么缩都装不下，
   * 于是 `tree-16x9.png` **一直没生成出来**（跑批时那句「1 张装不下，没出」说的就是它），
   * 而线上引用它的地方返回 200 + 首页 HTML（那个坑已另行修掉）。
   * 按方向切开之后每卷十几条，自然装得下。
   */
  const inDom = new Set(a.models.filter((m) => (m.domain ?? "video") === dom).map((m) => m.id));
  const by = new Map();
  for (const v of a.versions) if (inDom.has(v.m)) by.set(v.m, (by.get(v.m) ?? 0) + 1);
  const rows = [...by.entries()].map(([m, n]) => {
    const mm = a.models.find((x) => x.id === m);
    const ds = a.versions.filter((v) => v.m === m).map((v) => v.date).sort();
    return { m, n, model: mm, first: ds[0], last: ds[ds.length - 1], w: mm?.weights };
  }).filter((r) => r.model).sort((x, y) => y.n - x.n);
  /**
   * **一张卡放不下的时候，砍掉尾巴 —— 但要把砍了多少说出来。**
   *
   * 图像卷有 22 条产品线，16:9 怎么缩都装不下（`tree-image-16x9` 就是这么丢的：
   * 跑批时那句「1 张装不下，没出」）。而**静默截断是这个项目最忌讳的事** ——
   * 读者看到 12 条，会以为这一卷只有 12 条。
   * 所以按发布次数保留前 N 条，并在图的脚注里写明还有多少条没画。
   * 和 hf-lineage 那条纪律一样：砍了就要报出来。
   */
  const CAP = 12;
  const cut = Math.max(0, rows.length - CAP);
  const shown = rows.slice(0, CAP);
  const open = shown.filter((r) => r.w === "open" || r.m === "wan");
  const closed = shown.filter((r) => !(r.w === "open" || r.m === "wan"));
  const span = `${rows.map((r) => r.first).sort()[0]} → ${rows.map((r) => r.last).sort().pop()}`;
  const maxN = Math.max(...rows.map((r) => r.n));
  // 条的**长度**才是发布次数。第一版把 n 映射到了高度，10 次和 1 次几乎一样长 ——
  // **形状要能一眼比大小，那才叫「不靠文字」。**
  const col = (list, title, hue) => `
    <div style="flex:1">
      <div style="font-size:${Math.round(w * 0.019)}px;font-weight:700;color:${hue};margin-bottom:${Math.round(w * 0.012)}px">${title}</div>
      ${list.map((r) => `<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:${Math.round(w * 0.008)}px">
        <span style="font-size:${Math.round(w * 0.019)}px;font-weight:600;min-width:${Math.round(w * 0.115)}px">${esc(r.model.family)}</span>
        <span style="flex:1;display:block;height:${Math.round(w * 0.009)}px;background:${C.rule};border-radius:99px;opacity:.5">
          <span style="display:block;width:${Math.round((r.n / maxN) * 100)}%;height:100%;background:${hue};border-radius:99px"></span>
        </span>
        <span style="font-size:${Math.round(w * 0.016)}px;color:${C.muted};font-variant-numeric:tabular-nums">${r.n} 次</span>
      </div>`).join("")}
    </div>`;
  return shell(w, h, `
    <div style="font-size:${Math.round(w * 0.033)}px;font-weight:700;line-height:1.25">
      ${a.versions.length} 次发布，${rows.length} 条产品线
    </div>
    <div style="font-size:${Math.round(w * 0.0155)}px;color:${C.muted};margin:6px 0 ${Math.round(w * 0.026)}px">
      ${span} · 日期取自厂商官方发布记录
    </div>
    <div style="display:flex;gap:${Math.round(w * 0.035)}px">
      ${col(open, "开源权重", C.yes)}
      ${col(closed, "闭源", "#7a5cc4")}
    </div>
    <div style="margin-top:${Math.round(w * 0.028)}px;font-size:${Math.round(w * 0.0185)}px;line-height:1.6">
      <b>两条主干中间是交叉的。</b>万相 2.1/2.2 在官方 HF 上有权重、2.5 之后没有；
      海螺反过来，只有最新的 H3 放了权重。
    </div>`,
    `每次发布都写明这一代新增了什么${cut ? ` · 图上按发布次数取前 ${CAP} 条，另有 ${cut} 条没画` : ""}`);
}

/** 「别踩坑」卡：这个产品最值钱的那一页，压成一张图。 */
function caveatCard(w, h) {
  const older = (a.availability ?? []).filter((v) => v.match === "older");
  const gone = (a.availability ?? []).filter((v) => {
    const m = a.models.find((x) => x.id === v.m);
    return m?.status === "discontinued" && v.status !== "gone";
  });
  const soon = (a.availability ?? []).filter((v) => v.status === "coming-soon");
  const blocked = a.models.filter((m) => m.reach_cn === "blocked" && (m.tier ?? "core") === "core");
  const pn = (id) => a.platforms.find((x) => x.id === id)?.name ?? id;
  const item = (t, list, mark) => list.length ? `
    <div style="margin-bottom:${Math.round(w * 0.022)}px">
      <div style="font-size:${Math.round(w * 0.021)}px;font-weight:700">${mark} ${t}<span style="color:${C.muted};font-weight:400"> ${list.length} 条</span></div>
      <div style="font-size:${Math.round(w * 0.0175)}px;color:${C.muted};line-height:1.55;margin-top:2px">${list.slice(0, 3).join("；")}</div>
    </div>` : "";
  return shell(w, h, `
    <div style="font-size:${Math.round(w * 0.036)}px;font-weight:700;line-height:1.22">能力对了，你未必用得上</div>
    <div style="font-size:${Math.round(w * 0.0155)}px;color:${C.muted};margin:6px 0 ${Math.round(w * 0.026)}px">
      每条都从厂商官方页面核过，带原文
    </div>
    ${item("上游停服了，平台还在卖", gone.map((v) => `${pn(v.p)} 还挂着 ${label(a.models.find((x) => x.id === v.m))}`), "⚠️")}
    ${item("上架的不是当前版本", older.map((v) => `${pn(v.p)}：${v.listed}`), "⚠️")}
    ${item("标着有，其实还不能用", soon.map((v) => `${pn(v.p)}：${v.listed}`), "🕐")}
    ${item("大陆直连不通", blocked.map((m) => label(m)), "🚫")}`,
    `下单之前先看这几条`);
}

/** 模型卡：这个模型能做什么、不能做什么、官方没说什么。 */
function modelCard(m, w, h) {
  const caps = capsOf(m.class);
  const g = { yes: [], no: [], unknown: [] };
  for (const c of caps) g[cell(m.id, c.id).state].push(c.zh);
  const o = org(m);
  const big = Math.round(w * 0.042);
  const line = (k, mark, cls, zh) => g[k].length ? `
    <div style="margin-bottom:${Math.round(w * 0.016)}px">
      <div style="font-size:${Math.round(w * 0.019)}px;font-weight:600;margin-bottom:4px" class="${cls}">
        ${mark} ${zh}（${g[k].length}）</div>
      <div style="font-size:${Math.round(w * 0.0215)}px;line-height:1.5">${g[k].map(esc).join(" · ")}</div>
    </div>` : "";

  return shell(w, h, `
    <div style="font-size:${big}px;font-weight:700;line-height:1.2">${esc(label(m))}</div>
    <div style="font-size:${Math.round(w * 0.0175)}px;color:${C.muted};margin:6px 0 ${Math.round(w * 0.028)}px">
      ${esc(o ? (m.team ? `${o.zh} · ${m.team}` : o.zh) : "?")} ·
      该版本核验于 ${m.version_as_of}${m.status && m.status !== "active" ? ` · <b class="no">${m.status === "discontinued" ? "已停服" : "非主力"}</b>` : ""}${m.reach_cn === "blocked" ? ' · <b class="no">大陆直连不通</b>' : ""}
    </div>
    ${line("yes", "✅", "yes", "官方明确支持")}
    ${line("no", "❌", "no", "官方明说不支持")}
    ${line("unknown", "⬜", "unk", "官方没说 —— 是「没说」，不是「不支持」")}`,
    `${esc(label(m))} 的逐项能力与出处`);
}

/** 能力卡：这一项谁做到了，最早什么时候出现的。 */
function capCard(c, w, h) {
  /**
   * **按方向 + 按轨，两维都要过。**
   *
   * 2026-08-14 具身智能卷上线时炸出来的：`capability-openweights-16x9` 与
   * `capability-s-openweights-16x9` 两张突然「缩到 0.62 仍装不下」。
   * 表面看是新卷把图撑爆了，**真相是这两张一直画错**——
   * 这里原来只按 `class` 过滤，而这两项能力的 `class` 是 `"both"`
   * （本意是「本方向的两条轨都算」）。少了 domain 这一维，
   * `"both"` 就变成了「全站所有 core 模型」：**视频卷的「开源权重」分享图里
   * 混着图像、文本、声音、3D、数字人六卷的模型，横跨 70 个。**
   *
   * 从第二卷上线那天起它就是错的，只是当时还塞得下、没人看得出来。
   * **是尺寸限制替我们发现了内容错误** —— 那条「宁可不出图，也不出一张
   * 裁掉了内容的图」的纪律，这次顺带兜住了另一种错。
   */
  const dom = c.domain ?? "video";
  const ms = a.models.filter((m) => (m.tier ?? "core") === "core"
    && (m.domain ?? "video") === dom
    && (c.class === "both" || c.class === m.class));
  const st = (s) => ({ yes: ["✅", "yes"], no: ["❌", "no"], unknown: ["⬜", "unk"] })[s];
  return shell(w, h, `
    <div style="font-size:${Math.round(w * 0.04)}px;font-weight:700;line-height:1.2">${esc(c.zh)}</div>
    <div style="font-size:${Math.round(w * 0.0175)}px;color:${C.muted};margin:6px 0 ${Math.round(w * 0.024)}px">
      ${esc(c.name)}${c.aliases?.length ? ` · 各家的叫法：${c.aliases.slice(0, 5).map(esc).join(" / ")}` : ""}
    </div>
    ${c.since ? `<div style="font-size:${Math.round(w * 0.0175)}px;margin-bottom:${Math.round(w * 0.022)}px">
      最早可证 <b>${c.since}</b>${c.since_quote ? ` —— 「${esc(c.since_quote.slice(0, 90))}」` : ""}</div>` : ""}
    <div style="display:flex;flex-wrap:wrap;gap:${Math.round(w * 0.008)}px ${Math.round(w * 0.018)}px;
      font-size:${Math.round(w * 0.022)}px;line-height:1.5">
      ${ms.map((m) => { const [mk, cls] = st(cell(m.id, c.id).state);
        return `<span class="${cls}">${mk} ${esc(label(m))}</span>`; }).join("")}
    </div>`,
    `「${esc(c.zh)}」这一项，谁做到了`);
}

// ── 出图 ────────────────────────────────────────────────────────────
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const jobs = [];
const add = (name, fn, ratios) => { for (const r of ratios) jobs.push({ name: `${name}-${r}`, fn, r }); };
const EVERY = ALL ? Object.keys(RATIOS) : ["16x9"];

/**
 * **每一卷都要有自己的三张**：能力总表、演化树、以及站上对应的页面。
 * 这是 2026-08-12 补的 —— 此前只有视频那一卷，图像与文本分享出去
 * 拿到的是视频的表（见文件上方 DOMAINS 那段注释）。
 */
for (const d of DOMAINS) {
  const dom = d.id;
  add(`domain-${dom}`, (w, h) => matrixCard(w, h, dom), Object.keys(RATIOS));
  add(`tree-${dom}`, (w, h) => treeCard(w, h, dom), Object.keys(RATIOS));
}
// 站首页仍用视频那张当默认（它是第一卷、也是最完整的一卷）——
// **但这是一个选择，不是遗留**：首页要的是「这站是干什么的」，
// 而三卷里视频的格子填得最满，最能说明白那件事。
add("index", (w, h) => matrixCard(w, h, "video"), Object.keys(RATIOS));
// 「别踩坑」是跨方向的，本来就该是一张
add("caveats", caveatCard, Object.keys(RATIOS));
for (const m of a.models) add(`model-${m.id}`, (w, h) => modelCard(m, w, h), EVERY);
for (const c of a.capabilities) add(`capability-${c.id}`, (w, h) => capCard(c, w, h), EVERY);

const { chromium } = await import("playwright");
const browser = await chromium.launch();
/**
 * **让浏览器告诉我合不合适，而不是我算。**
 *
 * 第一版是照着比例硬算字号的，结果 16:9 的总表标题写着「11 项能力」、
 * 表里只画出 7 行 —— 剩下 4 行被 overflow:hidden 静静剪掉了。
 * 图片文件正常生成、大小正常，**但内容自相矛盾**。
 *
 * 所以这里改成：渲染 → 量 scrollHeight → 溢出就整体缩一档 → 重来。
 * 最多缩到 0.62，再不行就报错退出 —— **宁可不出图，也不出一张裁掉了内容的图。**
 */
let clipped = 0;
let done = 0;
for (const j of jobs) {
  process.stderr.write(`[${++done}/${jobs.length}] ${j.name}\n`);
  const [w, h] = RATIOS[j.r];
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(j.fn(w, h), { waitUntil: "load" });

  /**
   * **第一步永远是量，不是算。**
   *
   * 上一版我按 `w * 0.135` 拍了个标题块高度去反推行距，连缩两轮都没缩对 ——
   * 因为标题会折行、副标题长度会变，那个常数从一开始就是猜的。
   * 现在改成：渲染一遍，问浏览器表格实际从哪开始、还剩多少高，再按行数分。
   * 行数以后会变（能力随时加），所以尺寸必须是量出来的，不能是常数。
   */
  await page.evaluate(`(() => {
    const t = document.querySelector("table.fit");
    if (!t) return;
    const g = document.querySelector(".grow");
    const after = [...g.children].filter((e) => e.compareDocumentPosition(t) & Node.DOCUMENT_POSITION_PRECEDING)
      .reduce((n, e) => n + e.getBoundingClientRect().height, 0);
    const avail = g.clientHeight - (t.getBoundingClientRect().top - g.getBoundingClientRect().top) - after - 4;
    const n = t.rows.length;
    // 上限：剩余空间不要全摊进行距。9:16 上不封顶会摊出 160px 的行高、
    // 中间是一颗 20px 的对勾 —— 内容是全的，但读起来像一张排版事故。
    const rowH = Math.min(Math.floor(avail / n), Math.round(parseFloat(getComputedStyle(t).fontSize) * 3.2));
    const fs = Math.min(parseFloat(getComputedStyle(t).fontSize), Math.floor(rowH / 1.7));
    const vpad = Math.max(1, Math.floor((rowH - fs * 1.25) / 2));
    t.style.fontSize = fs + "px";
    for (const c of t.querySelectorAll("td,th")) {
      c.style.paddingTop = vpad + "px";
      c.style.paddingBottom = vpad + "px";
    }
  })()`);

  // 量完还溢出（长文本卡片没有表格可调），才动用 zoom 兜底
  let k = 1;
  while (k >= 0.62) {
    const fits = await page.evaluate(`(() => {
      const g = document.querySelector(".grow");
      return g.scrollHeight <= g.clientHeight + 1 && document.body.scrollWidth <= window.innerWidth + 1;
    })()`);
    if (fits) break;
    k -= 0.04;
    await page.addStyleTag({ content: `.grow{zoom:${k}}` });
  }
  if (k < 0.62) {
    // **宁可不出图，也不出一张裁掉了内容的图** —— 标题写「11 项」表里只画 7 行，
    // 那种图比没有图更糟：它看起来是对的。
    console.error(`✗ ${j.name} 缩到 0.62 仍装不下 —— 不出这张`);
    clipped += 1;
  } else {
    await page.screenshot({ path: join(OUT, `${j.name}.png`) });
    if (k < 1) console.log(`  ${j.name} 另缩到 ${Math.round(k * 100)}%`);
  }
  await page.close();
}

// ⚠️ 必须关。不关的话脚本干完活会**挂在这里不退出** ——
// 图全出齐了、日志也打完了，但进程还在，看上去就像「卡住了」。
// 我为此误判过一次，怪到了管道缓冲头上。
await browser.close();

writeFileSync(join(OUT, "MANIFEST.json"), JSON.stringify({
  generated_for: a.version, generated_at: a.generated_at,
  note: "由 scripts/make-share.mjs 从 data/atlas.json 生成 —— 不要手改。数据变了重跑。",
  files: jobs.map((j) => `${j.name}.png`),
}, null, 2) + "\n");

if (clipped) { console.error(`\n${clipped} 张装不下，没出。`); process.exit(1); }
console.log(`出图 ${jobs.length} 张 → public/og/（首页四个比例，其余 ${EVERY.join("/")}）`);
