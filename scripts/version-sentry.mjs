/**
 * 版本哨兵 —— **快照里已经出现、我们却还没写回的版本号。**
 *
 * ## 它为什么存在
 *
 * 2026-09-10 负责人报了三条我们「不知道」的更新：GPT-6 Astra、Claude Fable 5.1、
 * DeepSeek V4.1 Flash。查下来最难堪的不是漏抓，是**前两条早就躺在我们自己的快照里**：
 *
 *   · `anthropic-models` 09-02 那次抓取就写着 Claude Fable 5.1，atlas 记的还是 Fable 5（06-09）
 *   · `openai-models`    09-09 那次抓取就写着 gpt-6-astra，atlas 记的还是 GPT-5.6（08-11）
 *
 * 定时任务每天 09:23 照跑、退出码 0、快照按时提交。**它抓到了，只是没有任何一步会说「这条变了要写回」。**
 * 现有三条检查各自都够不着这件事：
 *
 *   · `watch.mjs` 只报「这个源变了」。一天几十个源都在变，变了本身不含信息。
 *   · `extract.mjs` 本该把「变化 → 这意味着什么」翻出来，但它 08-07 起因为
 *     缺 MINIMAX_API_KEY 一直被跳过，而跳过只是日志里一行 echo，没人会看日志。
 *   · `requote.mjs` 确实发现了「Claude Fable 5 is generally available」这句在页上没了 ——
 *     然后它被归进 `todo.mjs` 里标着 `machine: true` 的那一摞，
 *     摞名叫「机器状态 · 不用你判断」。**一次真的换代，被归成了机器噪音。**
 *     归错的理由写在 todo.mjs 里：「时序页滚动窗口，引的是已过去的版本公告」——
 *     那对 changelog 成立，对 `anthropic-models` 这种**目录页**不成立：
 *     目录页上的一句话消失，恰恰说明目录本身改了。
 *
 * 所以补这一支。它只回答一个问题，判据落在根因上：
 * **一格署的那个源，今天有没有出现比我们记的更新的版本号？**
 *
 * ## 三条纪律
 *
 * 1. **纯程序，不用 LLM**（§33）。版本号比大小是确定性的。
 * 2. **只报不改。** 和 watch / fresh / requote 同一条：机器不碰 atlas.json。
 * 3. **报出来的必须进「该你拍板」那一摞，不许进「机器状态」。**
 *    换代是这张图最贵的事实，`machine: true` 对它就是静音键。
 *
 *   node scripts/version-sentry.mjs            # 打报告
 *   node scripts/version-sentry.mjs --json     # 顺手写 data/version-sentry.json
 *   node scripts/version-sentry.mjs --at HEAD~5   # 拿历史快照跑（自检用）
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const WRITE = argv.includes("--json");
/**
 * `--at <ref>`：快照从某个 git commit 读，atlas 仍读工作区的。
 * **这是自检用的**：一支新检查必须能在「当初炸过的那份数据」上真的炸，
 * 否则它只是今天恰好没报错而已。见文件末尾的 --selftest。
 */
const atIdx = argv.indexOf("--at");
const AT = atIdx >= 0 ? argv[atIdx + 1] : null;

/**
 * `--at` 要把 atlas 和快照**一起**倒回去。
 * 只倒快照的话，自检等于拿今天已经修好的库去比昨天的页面 —— 它当然不报，
 * 而那正是「新检查在自己该炸的数据上没炸」这个经典陷阱。
 */
const 源表 = JSON.parse(readFileSync(join(ROOT, "data/sources.json"), "utf8")).sources ?? [];
/**
 * **别只盯这一格署的那个源。**
 *
 * 2026-09-10 第一版就是只看 `version_src`，于是 Gemini 那一格没报出来 ——
 * 它署的是 `gemini-37-blog`，**一篇讲 3.7 的博客**。一篇讲 3.7 的文章永远不会提 3.8，
 * 所以这个哨兵在它身上是瞎的，而且瞎得毫无迹象。
 *
 * 修法：`data/sources.json` 里每个源都带 `vendor`（存的其实是模型 id）和 `good_for`。
 * 那就把「这家自己的、标了 good_for: version 的源」全都扫一遍 ——
 * 目录页和更新日志本来就是版本的一手来源，博客不是。
 */
const 版本源 = (mid) => {
  const out = new Set();
  for (const s of 源表)
    if ((s.good_for ?? []).includes("version") &&
        String(s.vendor ?? "").split(",").map((x) => x.trim()).includes(mid))
      out.add(s.id);
  return out;
};

const atlas = JSON.parse(
  AT
    ? execFileSync("git", ["show", `${AT}:data/atlas.json`], { cwd: ROOT, maxBuffer: 64e6 }).toString()
    : readFileSync(join(ROOT, "data/atlas.json"), "utf8"),
);
const ACK_FILE = join(ROOT, "data/version-sentry-ack.json");
/**
 * 看过并否掉的，记下来别再报 —— **一摞不收敛的待办，人看两次就不看了**。
 * 记的是「哪个模型 + 发现的哪个版本号」，所以下次真出新版还会再报。
 */
const ack = existsSync(ACK_FILE) ? JSON.parse(readFileSync(ACK_FILE, "utf8")) : { rows: [] };
const acked = new Set((ack.rows ?? []).map((r) => `${r.m}\t${r.found}`));

const snapText = (id) => {
  try {
    const raw = AT
      // stderr 吞掉：那个 ref 上没有这份快照是常态，不是错误
      ? execFileSync("git", ["show", `${AT}:data/snapshots/${id}.json`], { cwd: ROOT, maxBuffer: 64e6, stdio: ["ignore", "pipe", "ignore"] }).toString()
      : readFileSync(join(ROOT, `data/snapshots/${id}.json`), "utf8");
    const j = JSON.parse(raw);
    return { text: String(j.text ?? "").replace(/\s+/g, " "), at: j.fetched_at, truncated: !!j.truncated };
  } catch {
    return null;
  }
};

/** "5.6" → [5,6]；比大小按段比，段数不同时短的补 0（5 与 5.0 相等） */
const nums = (s) => s.split(".").map(Number);
const cmp = (a, b) => {
  const A = nums(a), B = nums(b);
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const d = (A[i] ?? 0) - (B[i] ?? 0);
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
};

/**
 * **同一个版本号，两种读法能读出相反的大小。**
 *
 * 2026-09-10 栽的：哨兵报「Grok 4.6 → grok-4.20」，看着像漏了一代。
 * 去 docs.x.ai 一看，整页都在说 4.6 是旗舰（「Meet grok-4.6」「Chat Grok 4.6」
 * 「The knowledge cut-off date of Grok 4.6 is February 1, 2026」），
 * 而 `grok-4.20` 只出现在一句注意事项里：「logprobs … are not supported by models
 * grok-4.20 and newer」。**那句话只有在 4.20 比 4.6 老的时候才讲得通** ——
 * 也就是说 xAI 这里的 `.20` 读作小数点后的 20（＝4.2），不是分段整数的第 20 个小版本。
 *
 * 按分段整数读：4.20 > 4.6。按小数读：4.20 < 4.6。**两种读法结论相反。**
 * 哪种对取决于厂商自己的习惯，脚本判不了 —— 那就别装作判得了。
 *
 * 所以：两种读法不一致时，不进「有更新的一代」，另起一摞叫「口径存疑」，
 * 把两种读法都印出来让人一眼定。**一个会喊错的哨兵，喊两次就没人听了。**
 */
const cmpDecimal = (a, b) => {
  const A = a.split("."), B = b.split(".");
  for (let i = 0; i < Math.max(A.length, B.length); i++) {
    const x = A[i] ?? "0", y = B[i] ?? "0";
    // 小数读法：段内右侧补零对齐再比（"20" vs "6" → "20" vs "60"）
    const w = Math.max(x.length, y.length);
    const d = Number(x.padEnd(w, "0")) - Number(y.padEnd(w, "0"));
    if (d) return d > 0 ? 1 : -1;
  }
  return 0;
};
/** 两种读法给出不同答案 → 这一条判不了，交给人 */
const 口径存疑 = (found, cur) => cmp(found, cur) !== cmpDecimal(found, cur);

/**
 * 从版本串上拆出「探针」：前缀 + 当前数字。
 *
 * 一个模型可能有两种写法，两种都试：
 *   · 版本串自己的前缀 —— "Fable 5.1" → Fable / 5.1；"GPT-6 Astra" → GPT / 6
 *   · 家族名 —— 版本串以数字打头时（"2.5（sunburst / flare）"）只能靠它：GPT Image / 2.5
 *
 * **前缀里的空格与连字符一律当同一个东西**：官网写 GPT Image，模型 id 写 gpt-image。
 */
const words = (s) => s.split(/[\s_-]+/).filter(Boolean).length;
const probes = (m) => {
  const out = [];
  const v = String(m.version ?? "");
  const cur = (v.match(/\d+(?:\.\d+)*/) ?? [])[0];
  if (!cur) return out;
  const own = v.slice(0, v.indexOf(cur)).replace(/[\s\-—·]+$/, "").trim();
  /**
   * **前缀要挑更具体的那个。** GPT TTS 的版本串是「GPT-4o mini TTS」，
   * 拆出来的自带前缀只有「GPT」—— 拿它去扫 openai-models，
   * 侧栏那句「Using GPT-6 Astra」就会被当成 TTS 出了新版。
   * 家族名（GPT TTS）比它多一个词，那就只用家族名。
   */
  /**
   * ⚠️ **2026-09-19 补：短前缀不能直接丢掉，只能降级。**
   *
   * 上一版在家族名更长时**整个跳过**自带前缀，于是官网上不写全名的那些模型
   * 对这支哨兵是全盲的：Decart 的页上写「LUCY 2.5 IS LIVE」，而我们只拿
   * 「Decart Lucy」去扫，一个都匹配不到 —— 结果不是「没新版」，是
   * **每天报一条「牌子摘了」，而真出了 Lucy 3 也照样看不见**。
   * 这正是 Fable 5.1 那次的形状：噪音把真换代盖住了。
   *
   * 所以短前缀带着 `guard` 进来：命中时**要求自家名字就在附近**才算数。
   * 这条守卫本来就有（前缀短到 V / v 那种时才开），这里把它的适用面扩大 ——
   * 「GPT TTS 的版本串只拆得出 GPT」那个老毛病照样拦得住：
   * 侧栏那句「Using GPT-6 Astra」附近没有 tts / gpt tts / openai-tts，过不了守卫。
   */
  const ownKey = own.replace(/[\s_-]/g, "");
  // 只有**像名字**的短前缀才降级保留（Lucy / Oasis / Cosmos3）。
  // 「v2」拆出来的 own 是 `v`，那不是名字，是记法 —— 放它进来会把同一页上
  // 别家的型号算成自己的新版（实测：Scribe 的版本串是 `v2`，而 elevenlabs-models
  // 页上紧挨着 `scribe_v2` 就印着 **Eleven v3**，那是合成模型不是转写模型）。
  if (ownKey.length >= 3) out.push({ prefix: own, cur, guard: !!(m.family && words(m.family) > words(own)) });
  else if (own && !(m.family && words(m.family) > words(own))) out.push({ prefix: own, cur });
  if (m.family && m.family.toLowerCase() !== own.toLowerCase()) out.push({ prefix: m.family, cur });
  return out;
};

const rx = (prefix) => {
  const body = prefix
    .split(/[\s_-]+/)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("[\\s_-]*");
  // 前缀前面必须是词边界（不然 `damo2026rynnbrain11` 里的 rynnbrain 也算），
  // 前缀 → 可选分隔 → 可选的 v/V → 版本号，后面不许再接字母数字（免得把 5.6 从 5.64 里抠出来）
  return new RegExp(`(?<![\\w])${body}[\\s_-]*v?(\\d+(?:\\.\\d+)*)(?![\\d.\\w])`, "gi");
};

/**
 * **一个只会喊的哨兵，和一个不喊的哨兵一样没用。**
 *
 * 第一版扫出 16 条「有更新的一代」，逐条看下来只有 3 条是真的，其余全是同一批噪音 ——
 * 而 13 条假的足够让人第二次就不看这份报告了。四类噪音，四条判据：
 *
 *   · **HF 页上的计数**：「Spaces using TencentARC/InstantMesh 100」里的 100 是空间数
 *   · **年份**：`@article{MatterGen2025}`、「Latest update December 2025」
 *   · **同一个号去掉小数点**：`ltx-25` 就是 LTX 2.5、`groot-n17` 就是 N1.7
 *   · **别家的型号**：SkyReels 的对比表里写着「PixVerse V5」，那不是 SkyReels 出了 V5
 *
 * 最后一条只在前缀短到没有区分度时才会犯（V / v 这种），所以判据也只在那时才收紧：
 * **要求自家名字出现在附近**。
 */
const 计数措辞 = /(spaces?\s+using|model\s+tree\s+for|finetunes|quantizations|adapters|datasets\s+using|\+\s*\d+\s*spaces)/i;
const 像版本号 = (found, cur, before, m) => {
  if (/^\d{4}$/.test(found) && Number(found) >= 1990 && Number(found) <= 2099) return false; // 年份
  if (!found.includes(".") && cur.includes(".") && found === cur.replace(/\./g, "")) return false; // 同一个号去掉点
  if (!found.includes(".") && found.length >= 3) return false; // 三位以上的整数版本号，现实里基本不存在
  if (计数措辞.test(before)) return false;
  return true;
};

const rows = [];
const skipped = [];

for (const m of atlas.models ?? []) {
  /**
   * **署名的源没快照，不等于这个模型没法查。**
   *
   * gemini-text 署的是 `gemini-37-blog` —— 一篇讲 3.7 的博客，而且**全站压根没有它的快照**。
   * 第一版在这里直接 `continue`，于是 Gemini 3.8 Flash（09-02 GA）连被看一眼的机会都没有。
   * 一个「没抓到就当没问题」的哨兵，正是这次要修的那个毛病本身。
   * 所以：署名的源照旧优先，但只要这家还有别的版本源有正文，就接着查。
   */
  const 要扫 = [...new Set([m.version_src, ...版本源(m.id)].filter(Boolean))];
  if (!要扫.length) { skipped.push({ m: m.id, why: "没署 version_src，这家也没有标 good_for: version 的源" }); continue; }
  const snap = m.version_src ? snapText(m.version_src) : null;
  const 有正文 = 要扫.filter((id) => snapText(id)?.text);
  if (!有正文.length) {
    skipped.push({ m: m.id, why: `${要扫.join(" / ")} 都没有可比对的正文（没快照，或只有 json/atom 的 items）` });
    continue;
  }

  const ps = probes(m);
  if (!ps.length) { skipped.push({ m: m.id, why: `版本串「${m.version}」里没有数字，比不了` }); continue; }

  let best = null, seenCur = false;
  const 自家名字 = [m.family, m.id, m.zh, m.team].filter(Boolean).map((x) => String(x).toLowerCase());
  for (const sid of 要扫) {
    const sn = sid === m.version_src ? snap : snapText(sid);
    if (!sn?.text) continue;
    for (const p of ps) {
      for (const hit of sn.text.matchAll(rx(p.prefix))) {
        const found = hit[1];
        const before = sn.text.slice(Math.max(0, hit.index - 60), hit.index);
        // **只有署名的那个源才算「见过当前版本」** —— 牌子摘没摘是对它一个源的判断
        const 近旁 = (before + hit[0]).toLowerCase();
        const 过守卫 = !(p.guard || p.prefix.replace(/[\s_-]/g, "").length < 3) || 自家名字.some((n) => 近旁.includes(n));
        if (sid === m.version_src && cmp(found, p.cur) === 0 && 过守卫) seenCur = true;
        if (cmp(found, p.cur) <= 0) continue;
        if (!像版本号(found, p.cur, before, m)) continue;
        // 前缀短到没有区分度（V / v）时，要求自家名字就在附近 —— 否则那是别家的型号
        if (!过守卫) continue;
        if (!best || cmp(found, best.found) > 0)
          best = { found, prefix: p.prefix, cur: p.cur, idx: hit.index, raw: hit[0],
            存疑: 口径存疑(found, p.cur), src: sid, src_at: sn.at,
            evidence: sn.text.slice(Math.max(0, hit.index - 120), hit.index + 200).trim() };
      }
    }
  }

  if (best && !acked.has(`${m.id}\t${best.raw}`)) {
    rows.push({
      kind: best.存疑 ? "口径存疑" : "有更新的一代",
      m: m.id, family: m.family, zh: m.zh,
      cur: m.version, cur_as_of: m.version_as_of,
      found: best.raw, found_num: best.found,
      src: best.src, src_at: best.src_at,
      // 发现它的源不是这一格署的那个，本身就是要说的话：说明署名署在了看不见新版的地方
      via_other_src: best.src !== m.version_src ? m.version_src : undefined,
      evidence: best.evidence,
    });
  } else if (!seenCur && !best && snap?.text) {
    /**
     * **「牌子摘了」和「有更新的一代」是两件事。**
     * 前者常见于目录页改版、或那一档被下架；它不一定意味着有新版，
     * 但一定意味着**我们署的那个源已经不再支持我们写的那句话**。
     */
    if (!acked.has(`${m.id}\t(牌子摘了)`))
      rows.push({
        kind: "牌子摘了",
        m: m.id, family: m.family, zh: m.zh,
        cur: m.version, cur_as_of: m.version_as_of,
        found: null, src: m.version_src, src_at: snap.at,
        evidence: snap.truncated ? "⚠️ 这份快照被截断过，也可能是版本号落在截断之外" : "",
      });
  }
}

rows.sort((a, b) => (a.kind === b.kind ? a.m.localeCompare(b.m) : a.kind < b.kind ? -1 : 1));

const TODAY = new Date().toISOString().slice(0, 10);
const 更新 = rows.filter((r) => r.kind === "有更新的一代");
const 存疑 = rows.filter((r) => r.kind === "口径存疑");
const 摘牌 = rows.filter((r) => r.kind === "牌子摘了");

const md = [
  `# 版本哨兵 · ${TODAY}${AT ? `（快照取自 ${AT}）` : ""}`,
  ``,
  `扫 ${atlas.models.length} 个模型：**有更新的一代 ${更新.length}** · 口径存疑 ${存疑.length} · 牌子摘了 ${摘牌.length} · 比不了 ${skipped.length}`,
  ``,
  `> 这份只回答一件事：**一格署的那个源上，今天有没有出现比我们记的更新的版本号？**`,
  `> 报出来的不是「世界变了」，是「**我们抓到了但没写回**」—— 这两件事的严重程度不一样。`,
  ``,
];
if (更新.length) {
  md.push(`## 有更新的一代（${更新.length}）—— 这一摞要写回 atlas.json`, ``);
  for (const r of 更新)
    md.push(
      `- **${r.family ?? r.m}**（${r.m}）库里记 \`${r.cur}\`（核于 ${r.cur_as_of ?? "?"}），` +
      `而 \`${r.src}\` 的快照（${r.src_at}）上写着 **${r.found}**` +
      (r.via_other_src ? `　⚠️ 这一格署的是 \`${r.via_other_src}\`，**那个源上看不见新版**` : ""),
      `  > ${r.evidence.replace(/\n/g, " ")}`,
      ``,
    );
}
if (存疑.length) {
  md.push(
    `## 口径存疑（${存疑.length}）—— 两种读法结论相反，**得你定**`,
    ``,
    `> \`4.20\` 按分段整数读是 4 之后的第 20 个小版本（比 4.6 新），按小数读就是 4.2（比 4.6 老）。`,
    `> 哪种对取决于厂商自己的习惯，脚本判不了。定完把结论记进 \`data/version-sentry-ack.json\`。`,
    ``,
  );
  for (const r of 存疑)
    md.push(
      `- **${r.family ?? r.m}**（${r.m}）库里记 \`${r.cur}\`，\`${r.src}\`（${r.src_at}）上出现 **${r.found}**`,
      `  分段整数读：${r.found_num} 比 ${r.cur} **新**；小数读：比 ${r.cur} **老**`,
      `  > ${r.evidence.replace(/\n/g, " ")}`,
      ``,
    );
}
if (摘牌.length) {
  md.push(
    `## 机器自查 · 牌子摘了（${摘牌.length}）—— **不用你拍板**`,
    ``,
    `> 「在这个源上找不到我们记的版本号」有两种成因，脚本分不开：`,
    `> **版本串本来就不是数字型号**（\`650M\` / \`7B\` / \`2b/5b\` / \`glm-4-voice\` 这类，占绝大多数），`,
    `> 或者**页面改版把它挪走了**。前者是这支脚本够不着，后者才是问题。`,
    `> 所以这一摞只存不催 —— 真出了新一代，上面那一摞会喊。`,
    ``,
  );
  for (const r of 摘牌)
    md.push(`- **${r.family ?? r.m}**（${r.m}）记的是 \`${r.cur}\`，\`${r.src}\`（${r.src_at}）上没有这个号${r.evidence ? ` ${r.evidence}` : ""}`);
  md.push(``);
}
md.push(
  `## 比不了（${skipped.length}）`,
  ``,
  `> **比不了不等于没问题**，只等于这支脚本够不着。列出来是为了不假装全站都盯住了。`,
  ``,
  ...skipped.map((s) => `- ${s.m} —— ${s.why}`),
  ``,
);

const out = md.join("\n");
console.log(out);

if (WRITE && !AT) {
  writeFileSync(join(ROOT, "data/version-sentry.json"),
    JSON.stringify({ generated_at: TODAY, n: 更新.length, n_unclear: 存疑.length, n_missing: 摘牌.length, n_skipped: skipped.length, rows, skipped }, null, 2) + "\n");
  writeFileSync(join(ROOT, "data/version-sentry.md"), out);
}

// 有「更新的一代」时退出码非零：想拿它当 CI 闸门的话直接可用
process.exit(更新.length ? 1 : 0);
