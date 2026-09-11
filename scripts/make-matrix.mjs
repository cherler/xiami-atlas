/**
 * 从 data/atlas.json 生成能力矩阵静态图的 HTML。
 *
 * **数据只有一份。** 图里的每一格、每一个计数、每一条脚注都是算出来的，
 * 不是手抄的 —— 手抄的图迟早会和数据对不上，而这个项目卖的就是「对得上」。
 *
 *   node scripts/make-matrix.mjs   →  assets/matrix-<generated_at>.html
 */
import { readFileSync, writeFileSync } from "node:fs";

const a = JSON.parse(readFileSync(new URL("../data/atlas.json", import.meta.url), "utf8"));
const at = (m, c) => a.support.find((s) => s.m === m && s.c === c) ?? { state: "unknown" };

// 只出 clip 轨。realtime 的能力轴与之不通用（data/ontology.md 规则二），
// 混进同一张图会把两边都讲错 —— 那一轨要出图得单独做一张。
// 只画 core。extended 是「保证存在、不保证核过」，混进来会让整张表的可信度打折。
const models = a.models.filter((m) => m.class === "clip" && (m.tier ?? "core") === "core");
const capabilities = a.capabilities.filter((c) => c.class === "clip" || c.class === "both");
const inClip = new Set(models.map((m) => m.id));
const label = (m) => {
  const last = m.family.split(" ").pop();
  return m.version.startsWith(last) ? `${m.family.slice(0, -last.length).trim()} ${m.version}` : `${m.family} ${m.version}`;
};

const MARK = { yes: "✅", no: "❌", unknown: "" };
const t = { yes: 0, no: 0, unknown: 0 };
for (const s of a.support) if (inClip.has(s.m)) t[s.state] += 1;

// 下次复核：能力类字段 30 天一轮（§37）
const next = new Date(`${a.generated_at}T00:00:00Z`);
next.setUTCDate(next.getUTCDate() + 30);
const nextStr = next.toISOString().slice(0, 10);

// 脚注只挑带 ⚠️ 的格子 —— 那些是**平台自己不会写**的边界与否定事实（§60.5）
// 脚注：挑带 ⚠️ 的格子，但**每家最多一条、总共最多 6 条**。
// 全表现在有 35 条 ⚠️，全印上去版面就废了 —— 而且读者也读不完。
// 优先级：明确「不支持」的 > 其它边界。否定事实最难在别处看到，最该占版面。
const starPool = a.support
  .filter((s) => s.note?.includes("⚠️") && inClip.has(s.m))
  .sort((x, y) => (x.state === "no" ? -1 : 1) - (y.state === "no" ? -1 : 1));
const usedModel = new Set();
const stars = [];
for (const s of starPool) {
  if (usedModel.has(s.m) || stars.length >= 6) continue;
  usedModel.add(s.m);
  const m = label(a.models.find((x) => x.id === s.m));
  const c = a.capabilities.find((x) => x.id === s.c).zh;
  // 只取 ⚠️ 后的第一句，长注释在网站上看，图上放不下
  const text = s.note.replace(/⚠️\s*/, "").replace(/\*\*/g, "").split(/[；。]/)[0];
  stars.push({ m, c, text });
}

const officialCount = Object.values(a.sources).filter((s) => s.tier === "official").length;

const STATUS = {
  discontinued: { cls: "dead", tag: "已停服", color: "var(--no)" },
  superseded: { cls: "old", tag: "非主力", color: "var(--muted)" },
  active: { cls: "", tag: "", color: "" },
};
const head = models
  .map((m) => {
    const st = STATUS[m.status] ?? STATUS.active;
    return `<th><span class="mn ${st.cls}">${label(m)}</span><span class="mv">${m.version_as_of}</span>` +
      (st.tag ? `<span class="st" style="color:${st.color}">${st.tag}</span>` : "") + `</th>`;
  })
  .join("");
// ⬜ 按模型分布。**「N 格官方没说」这句话会让人以为厂商普遍不透明，
// 而实际上它高度集中在少数几家** —— 有官方能力文档的那几家只有 1~3 格。
// 这也让「透明度」从主观打分变成算出来的数：⬜ 的多少就是透明度。
const unkBy = models
  .map((m) => ({ m, n: a.support.filter((s) => s.m === m.id && s.state === "unknown").length }))
  .sort((x, y) => y.n - x.n);
const topUnknown = unkBy.slice(0, 3).map((x) => `${label(x.m)} ${x.n} 格`).join(" · ")
  + `，三家占 ${Math.round((unkBy.slice(0, 3).reduce((s, x) => s + x.n, 0) / t.unknown) * 100)}%`;
const dead = models.filter((m) => m.status && m.status !== "active");
const rt = a.models.filter((m) => m.class === "realtime");

const rows = capabilities
  .map((c) => {
    const cells = models
      .map((m) => {
        const s = at(m.id, c.id);
        const cls = s.state === "unknown" ? "unk" : s.state;
        return `<td class="${cls}">${MARK[s.state] || "<i></i>"}</td>`;
      })
      .join("");
    return `<tr><th class="cap"><b>${c.zh}</b><span>${c.name}</span></th>${cells}</tr>`;
  })
  .join("");

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8" /><title>${a.generated_at} AI 视频模型能力矩阵</title><style>
  :root{--paper:#EFF0EC;--ink:#171B18;--muted:#6B716C;--rule:#D3D6CE;--yes:#2C6B5A;--no:#B03A2C;--unk:#AD8324}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1440px;background:var(--paper);color:var(--ink);padding:52px 48px 40px;
       font-family:"PingFang SC","Hiragino Sans GB",system-ui,sans-serif;display:flex;flex-direction:column;gap:15px;
       -webkit-font-smoothing:antialiased}
  .eyebrow{font-size:18px;letter-spacing:.16em;color:var(--muted);display:flex;align-items:center;gap:14px}
  .eyebrow::after{content:"";flex:1;height:1px;background:var(--rule)}
  h1{font-size:42px;line-height:1.16;font-weight:600;letter-spacing:-.01em}
  .sub{font-size:19px;color:var(--muted);line-height:1.55}
  .sub b{color:var(--ink);font-variant-numeric:tabular-nums}
  table{border-collapse:collapse;width:100%;table-layout:fixed}
  th.cap{width:158px;text-align:left;padding:0 10px 0 2px}
  th.cap b{display:block;font-size:18px;font-weight:600;line-height:1.2}
  th.cap span{display:block;font-size:12px;color:var(--muted);font-weight:400}
  thead th{padding-bottom:12px;vertical-align:bottom}
  .mn{display:block;font-size:11.5px;font-weight:600;line-height:1.2}
  .mn.dead{color:var(--no);text-decoration:line-through;text-decoration-thickness:1.5px}
  .mn.old{color:var(--muted)}
  .st{display:block;font-size:10px;font-weight:600;margin-top:2px}
  .mv{display:block;font-size:11px;color:var(--muted);font-weight:400}
  tbody tr{border-top:1px solid var(--rule)}
  tbody td{text-align:center;height:52px;font-size:23px}
  td.unk i{display:inline-block;width:19px;height:19px;border:2px dashed var(--unk);border-radius:4px;opacity:.85}
  .band{display:flex;gap:14px;align-items:stretch}
  .big{background:#F7F8F5;border:1px solid var(--rule);border-radius:10px;padding:13px 18px;flex:1}
  .big .n{font-size:36px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
  .big .l{font-size:14px;color:var(--muted);margin-top:5px;line-height:1.35}
  .notes{border-top:1px solid var(--rule);padding-top:14px;display:flex;flex-direction:column;gap:7px;flex:1}
  .notes p{font-size:13.5px;line-height:1.45;color:var(--ink)}
  .notes b{color:var(--no)}
  .notes span{color:var(--muted)}
  footer{margin-top:auto;border-top:1px solid var(--rule);padding-top:14px;display:flex;justify-content:space-between;
         gap:24px;font-size:14px;color:var(--muted);line-height:1.6}
  footer .who{text-align:right;flex:none;color:var(--ink);font-weight:600}
  footer .who span{display:block;color:var(--muted);font-weight:400;margin-top:2px}
</style></head><body>
  <div class="eyebrow">AI 视频能力地图 · 数据版本 ${a.version}</div>
  <h1>${a.generated_at.slice(0, 4)} 年 ${Number(a.generated_at.slice(5, 7))} 月，<br />这些 AI 视频模型分别能做什么</h1>
  <p class="sub"><b>${models.length}</b> 个模型 × <b>${capabilities.length}</b> 项能力 ·
     核验于 <b>${a.generated_at}</b> · 下次复核 <b>${nextStr}</b> · 来源 <b>${Object.keys(a.sources).length}</b> 条（官方 ${officialCount} 条）</p>
  <table><thead><tr><th class="cap"></th>${head}</tr></thead><tbody>${rows}</tbody></table>
  <div class="band">
    <div class="big"><div class="n" style="color:var(--yes)">${t.yes}</div><div class="l">支持<br />有明确来源</div></div>
    <div class="big"><div class="n" style="color:var(--no)">${t.no}</div><div class="l">不支持<br />或查无支持迹象</div></div>
    <div class="big" style="flex:2.1;border-color:var(--unk)">
      <div class="n" style="color:var(--unk)">${t.unknown}</div>
      <div class="l"><b style="color:var(--ink)">官方没说</b> —— 九家都已用厂商官方文档逐格核过，仍然查不到的。<br />
      <b style="color:var(--ink)">而且高度集中：${topUnknown}</b> —— 不透明是分化的，不是普遍的。</div>
    </div>
  </div>
  <div class="notes">
    ${dead.map((m) => `<p><b>${label(m)}</b> <span>${m.status_note ?? ""}</span></p>`).join("")}
    ${stars.map((s) => `<p><b>${s.m} · ${s.c}</b> <span>${s.text}</span></p>`).join("")}
    <p style="color:var(--muted)"><b style="color:var(--ink)">另有实时交互轨</b>
      <span>${rt.map((m) => label(m)).join("、")} —— 边生成边看、可干预、时长不预设。
      它们和这张表不共用能力轴（「视频延长」对没有终点的东西没有意义），所以单列一张，不混在这里。</span></p>
  </div>
  <footer>
    <div>每一格的来源、原文链接与判定说明全部公开可复核。<br />
      <b style="color:var(--unk)">本批数据全部为机器录入</b> —— 我们把这件事印在脸上，而不是藏起来。</div>
    <div class="who">AI 视频能力地图<span>xiamimate.com/atlas（建设中）</span></div>
  </footer>
</body></html>`;

const out = new URL(`../assets/matrix-${a.generated_at}.html`, import.meta.url);
writeFileSync(out, html);
console.log(`写出 ${out.pathname}`);
console.log(`  ✅${t.yes} ❌${t.no} ⬜${t.unknown} · 脚注 ${stars.length} 条 · 下次复核 ${nextStr}`);
