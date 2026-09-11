/**
 * 出站前的回归验证。
 *
 * ## 规矩一：量到用户能感知的那一层为止
 *
 * 这个项目在「验证」上栽过三次，**每次都是量错了东西却以为量对了**：
 *
 * 1. 本地服务器没配 `{path}.html`，每个详情页都返回 200 —— 但渲染的是首页。
 *    「200 就算通过」量的是 HTTP，不是页面。
 * 2. 用 `locator('svg').count()` 判断移动端有没有画图，但 `hidden md:block`
 *    的元素**仍然在 DOM 里**。数 DOM 量的是标签，不是「用户看不看得见」。
 * 3. 页面看着完全正常、内容全对，却每次打开都在报 hydration 错误 ——
 *    查内容查不出来，只有听控制台才听得见。
 *
 * 所以：查页面独有字符串而不是状态码；查 `getClientRects` 有没有面积而不是元素在不在；
 * 收控制台报错。
 *
 * ## 规矩二：全绿只是入场券，不是通过
 *
 * 每个批次收尾要走一遍对抗性复查（见 docs/任务与验收标准.md 开头五问）。
 * 最要紧的一问：**这条检查能不能在功能坏掉的情况下照样通过？**
 * 能，就说明它量的不是那件事。
 *
 *   node scripts/verify.mjs            # 查构建产物 out/（默认，测的是将来跑的东西）
 *   node scripts/verify.mjs --dev      # 查 dev server（改代码时快速回归）
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = `${dirname(fileURLToPath(import.meta.url))}/..`;
const OUT = join(ROOT, "out");
/**
 * 平台页眉制品的真身在主站仓。**线上 `/chrome/*` 与 `/atlas/*` 同源**，
 * 所以这里也照着挂 —— 不挂的话，本仓探测 manifest 会 404，
 * 而那不是产品的问题，是**验证环境没长得像线上**。
 * 主站没构建过就跳过，并如实说一声，不假装测过。
 */
const CHROME_DIR = join(ROOT, "..", "xiamimate-tools-frontend", "out", "chrome");
const HAS_CHROME = existsSync(CHROME_DIR);
const PORT = 4319;
const BASE = "/atlas";
const DEV = process.argv.includes("--dev");

/**
 * **断言跟着数据走，别钉死一句会过期的文案。**
 *
 * 「这个方向还在建」这一栏只在**有 planned 方向**时才该出现。
 * 2026-08-11 把 AI 图像与 AI 文本从 planned 改成 live（它们早就全站上线了，
 * 字段还停在立项时的值），这一栏随之消失，而写死的断言立刻报错 ——
 * **它断言的是我们的数据状态，不是页面对不对。**
 * 这类断言比没有断言更糟：它会在正确的改动上报警，久了人就开始忽略红色。
 */
const PLANNED = JSON.parse(readFileSync(join(ROOT, "data/atlas.json"), "utf8"))
  .domains.filter((d) => d.state !== "live" && !d.href).length > 0;
const ORIGIN = DEV ? "http://127.0.0.1:3400" : `http://127.0.0.1:${PORT}`;

/**
 * 路由表。`must` 是**这一页独有**的字符串 —— 用它判断「渲染的是不是自己」，
 * 不用状态码（状态码骗过我们一次）。
 *
 * `zh` 是这一页允许的中文字符上限：**把「前端不放旁白」变成一个能自动查的数**，
 * 否则它只是口号，下次又会悄悄涨回去。/method 是口径收容所，它本来就该长。
 */
const ROUTES = [
  // 根路径 = 方向选择页（不再是视频首页）
  /**
   * ⚠️ **首页的字数改成按「每张方向卡」量，不再量整页。**
   *
   * 整页 200 字这个上限是**四个方向**时定的。每加一卷就多一张卡（约 24 个中文字），
   * 于是 2026-08-13 加 AI 3D 时超了 4 字、08-14 加 AI 数字人时超了 11 字 ——
   * **两次都不是页面变啰嗦，是方向变多了**。继续用整页上限，等于「每开一卷就要去别处删字」，
   * 那是在惩罚真内容（和 /changes、/caveats、/basics 当初栽的是同一个错，这已经是第四次）。
   *
   * 改成按卡量：**一张方向卡不许超过 40 个中文字** —— 这才是这一页真正的纪律
   *（进站第一屏，每卷只给一句话）。卡外的那段脚注仍受 `also` 与人眼盯着。
   */
  { path: "/", must: "先选一个方向", zh: 40, per: "[data-domain-card]", built: true, also: ["AI 视频", "AI 图像"] },
  // ── 两个方向各一套。**同一份代码渲染，路由表也照抄一遍** ——
  // 抄一遍才能证明「换方向不改前端」；只测一个方向等于没测这件事。
  { path: "/video", must: "AI 视频", zh: 900, built: true },
  { path: "/video/tree", must: "长出了什么", zh: 800, built: true },
  { path: "/video/map", must: "谁和谁有关系", zh: 2400, built: true },
  /**
   * ⚠️ `per` 从 `article`（一个应用一条）改成资源卡。**分母原来是错的。**
   *
   * 场景页的结构是「应用 → 它的一堆资源卡」，而资源卡在 article **里面**。
   * 按 article 均摊，等于**每给一个应用多收一条教程，这一页的「每条字数」就涨一次** ——
   * 2026-08-13 给 16 个原本一条教程都没有的应用补上中文材料，棘轮立刻报红。
   *
   * 那是**在惩罚补真内容**，和 /changes、/caveats 当初栽的是同一个错
   * （「多记真内容反而算退步」是错的度量）。这已经是第三次了，所以这次不抬基线、改分母。
   */
  { path: "/video/scenario", must: "我想做什么", zh: 120, per: "article .grid > div", built: true, also: ["公开路线", "需要的能力", "输入 → 输出"] },
  { path: "/video/models", must: "全部模型", zh: 1200, built: true },
  /**
   * ⚠️ **「这个方向还在建」这一栏只出现在那个 planned 方向自己的页面上**，不是全站。
   * 2026-08-11 图像卷转 live 时把这条断言改成了跟着 `PLANNED` 走 —— 但 `PLANNED` 是个
   * **全局**开关：2026-08-13 AI 3D 立项（planned），它就又要求 /image 上出现这句话，
   * 而 /image 早就是 live 的。**跟着数据走还不够，得跟着「哪一份数据」走。**
   * 这一栏的断言挪到下面 /threed 那一行去了。
   */
  { path: "/image", must: "AI 图像", zh: 900, built: true, also: ["出图轨", "文字渲染"] },
  // 断言跟着数据走：图像谱系已经采了 13 条，「还没采谱系」那句空状态不该再出现。
  // 钉一个只有图像树才有的产品线名，比钉空状态文案稳。
  { path: "/image/tree", must: "长出了什么", zh: 800, built: true, also: ["FLUX", "Z-Image"] },
  { path: "/image/map", must: "谁和谁有关系", zh: 2400, built: true },
  // 应用已经定了 8 个，「还没定应用」那句空状态不该再出现；改钉真实应用名。
  // **字数按 per: "article" 量** —— 和 /video/scenario 同一把尺子。
  // 之前这条写的是整页 900：两个方向量的根本不是同一个东西，比出来的数没有意义。
  { path: "/image/scenario", must: "我想做什么", zh: 120, per: "article .grid > div", built: true,
    also: ["公开路线", "需要的能力", "输入 → 输出", "虚拟试穿"] },
  { path: "/image/models", must: "全部模型", zh: 1200, built: true },
  { path: "/method", must: "这些数据是怎么来的", zh: 4000, built: true },
  // 列表页量**每条的字数**，不量总字数 —— 变更日志天生随事件累积变长，
  // 对它用「不许涨」是错的度量：那样一来，多记一条真实变更反而算退步。
  { path: "/changes", must: "最近有什么变化", zh: 130, per: "article, section > div", built: true },
  { path: "/model/wan", must: "阿里巴巴", zh: 1200, built: true },
  /**
   * 发布档案页（2026-08-13 新增，345 个）。**新页型必须进这张表** ——
   * 否则它的中文字数没人量、跨方向混入没人扫，坏了也不会红。
   * 钉一个**历史版本**（不是当前版本）：这一类的价值正在于「旧的一代也有地址」，
   * 而「⚠️ 这不是当前版本」那句提示只在历史版本上出现。
   */
  { path: "/release/hy3d-2mv", must: "多视图输入档", zh: 900, built: true,
    also: ["凭什么这么说", "这不是这条产品线的当前版本", "它在这条线上的位置"] },
  { path: "/capability/flf", must: "首尾帧", zh: 1200, built: true },
  /**
   * ⚠️ `per` 从 `section > div`（一种坑一段）改成 `section > div > div`（一条一格）。
   * 前者量的是**每种坑的总字数**，而坑的种类是固定的六类 ——
   * 于是每加一卷，同一段里塞进更多条，数字必然涨：
   * 2026-08-12 加声音卷之后从 84 涨到 107，**页面一个字没改**。
   * 「多记真内容反而算退步」是错的度量，和 /changes 当初那个错同一类。
   */
  { path: "/caveats", must: "你未必用得上", zh: 90, per: "section > div > div", built: true },
  /**
   * `/claims`（2026-08-17 新增）。**字数按每条均摊** —— 和 /changes、/caveats 同一个理由：
   * 多核出一条对不上的地方不该算退步。`also` 钉三样最容易掉的：
   * 两侧对照的栏名、以及「现算」这件事本身（它是这一页可信的根据）。
   */
  { path: "/claims", must: "自述与实测", zh: 150, per: "article", built: true,
    also: ["它自己说", "实际撞到的", "从数据现算"] },
  { path: "/compare/kling-vs-seedance", must: "还是", zh: 800, built: true },
  { path: "/skill/motion", must: "动作复刻", zh: 1400, built: true, also: ["拿什么跑", "原生模型就能做", "得用它的变体", "自己部署", "Motion Control 是独立模型"] },
  { path: "/skill/openweights", must: "开源自部署", zh: 1600, built: true, also: ["拿什么跑", "家能做这件事"] },
  // /scenario 现在是应用目录：字数随「收了几个应用、每个应用挂几条资源」长。
  // 对它用整页上限，等于「多收一个真实应用算退步」—— 和 /changes 当初那个错一样。
  // 所以按条均摊（每条 = 一个应用卡）。
  { path: "/toolkit", must: "该去哪个站", zh: 300, per: "main > div > section", built: true },
  /**
   * `/basics` 是教程导航 + 术语速查。**字数按「每条教程」均摊**，
   * 和 /changes、/caveats 同一个道理：多收一条真教程不该算退步。
   * `also` 钉的是三样最容易掉的东西：教程标题、许可提醒、那个真实的反面例子。
   */
  { path: "/basics", must: "去读哪些公开教程", zh: 260, per: "section > div > div > a", built: true,
    also: ["无 LICENSE 文件", "ConvRot", "术语速查"] },
  // 第二个方向。**用的是和首页同一个 TruthTable**，只换了轨 ——
  // 这一条红了，说明「轨是方向的属性」那次重构又被人破坏了。
];

const FLOWS = existsSync(join(ROOT, "data/flows.json"))
  ? JSON.parse(readFileSync(join(ROOT, "data/flows.json"), "utf8"))
  : null;

const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon", ".txt": "text/plain" };

let server = null;
if (!DEV) {
  if (!existsSync(OUT)) { console.error("out/ 不存在 —— 先跑 npx next build"); process.exit(1); }
  /** 和 deploy/caddy-snippet.conf 同一套顺序 —— **测的必须是将来跑的东西**。 */
  server = createServer(async (req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    // 尾斜杠 308，与 @atlasTrail 同规则。少了它 /model/wan/ 会被兜底成首页：200 但内容是错的。
    const m = p.match(new RegExp(`^${BASE}/(.+)/$`));
    if (m) { res.writeHead(308, { location: `${BASE}/${m[1]}` }); return res.end(); }
    // /chrome/* 从主站产物直供，和线上同源同路径
    if (p.startsWith("/chrome/")) {
      const f = join(CHROME_DIR, p.slice("/chrome/".length));
      if (HAS_CHROME && f.startsWith(CHROME_DIR) && existsSync(f)) {
        res.writeHead(200, { "content-type": MIME[extname(f)] ?? "application/octet-stream" });
        return res.end(await readFile(f));
      }
      return res.writeHead(404).end("no chrome");
    }
    /**
     * **前缀剥离要精确匹配边界。** 原来是裸的 `startsWith`，
     * `/atlas.txt` 会被剥成 `.txt` —— 那不是「去掉 basePath」，是切错了字符串。
     *
     * 而 `/atlas.txt` 是真实存在的请求：App Router 对根路由做 RSC 预取时就发它，
     * 静态导出把内容写在 `out/index.txt`。**这一条以前被「什么都回 index.html」
     * 盖了整整一轮**——回的是 200 + HTML，Next 拿到解析不了但静默吞掉，
     * 所以谁也没发现。线上 Caddy 若也用通配回退，同样是这个情形。
     */
    if (p === `${BASE}.txt`) p = "/index.txt";
    else if (p === BASE) p = "/";
    else if (p.startsWith(`${BASE}/`)) p = p.slice(BASE.length);
    /**
     * **带扩展名的资源不回退 index.html。**
     *
     * 原来任何未命中的路径都兜到首页，于是 `/chrome/chrome.js` 回的是
     * 200 + 一坨 HTML，浏览器把它当 JS 解析报 `SyntaxError: Unexpected token '<'`。
     * 这条兜底本是给 SPA 路由用的，用在资源上就成了「谎报成功」——
     * 和当初「200 就算通过」是同一个错，只是换到了服务器这一侧。
     */
    const asset = /\.[a-z0-9]+$/i.test(p) && !p.endsWith(".html");
    const cands = asset ? [p] : [p, `${p}/index.html`, `${p}.html`, "/index.html"];
    for (const cand of cands) {
      const f = join(OUT, cand);
      if (!f.startsWith(OUT) || !existsSync(f) || !extname(f)) continue;
      res.writeHead(200, { "content-type": MIME[extname(f)] ?? "application/octet-stream" });
      return res.end(await readFile(f));
    }
    res.writeHead(404).end("nope");
  });
  await new Promise((r) => server.listen(PORT, r));
}

console.log(HAS_CHROME
  ? "平台页眉制品：从 ../xiamimate-tools-frontend/out/chrome 直供（与线上同源）"
  : "平台页眉制品：主站未构建，本轮跳过 —— **没测过就是没测过**，别当成通过");

const { chromium } = await import("playwright");
const browser = await chromium.launch();
const fails = [];
const todo = new Set();
const ok = (c, msg) => { console.log(`  ${c ? "✓" : "✗"} ${msg}`); if (!c) fails.push(msg); };

/** 真·可见：有面积、没被 display:none / visibility:hidden / opacity:0。数 DOM 是数不出来的。 */
const VISIBLE = (sel) => `(() => [...document.querySelectorAll(${JSON.stringify(sel)})].filter((e) => {
  const s = getComputedStyle(e);
  if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return false;
  return [...e.getClientRects()].some((r) => r.width > 0 && r.height > 0);
}).length)()`;

/** 站内链接图，用来算动线可达性。只取**可见**的链接 —— 藏起来的链接点不到。 */
const LINKS = `(() => [...document.querySelectorAll("a[href]")].filter((a) => {
  const s = getComputedStyle(a);
  if (s.display === "none" || s.visibility === "hidden") return false;
  return [...a.getClientRects()].some((r) => r.width > 0 && r.height > 0);
}).map((a) => new URL(a.getAttribute("href"), location.href).pathname))()`;

/** 中文字数基线：只许降不许升。写在 data/ 里，跟着 git 走，回退看得见。 */
const BASE_PATH = join(ROOT, "data/verify-baseline.json");
const BASE_ZH = existsSync(BASE_PATH) ? JSON.parse(readFileSync(BASE_PATH, "utf8")).zh ?? {} : {};
const NEW_ZH = {};

const graph = new Map();


for (const [vp, w, h] of [["桌面", 1440, 900], ["手机", 390, 844]]) {
  console.log(`\n══════ ${vp} ${w}×${h} ══════`);
  for (const r of ROUTES) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errs = [];
    page.on("pageerror", (e) => errs.push(String(e).split("\n")[0].slice(0, 90)));
    page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().split("\n")[0].slice(0, 90)); });

    let body = "";
    let mainText = "";
    let quoted = "";
    let fellBack = false;
    try {
      await page.goto(`${ORIGIN}${BASE}${r.path === "/" ? "" : r.path}`,
        { waitUntil: DEV ? "domcontentloaded" : "networkidle", timeout: 45000 });
      await page.waitForTimeout(DEV ? 2500 : 900);
      // ⚠️ 用 innerText 不用 textContent。
      // textContent **把隐藏元素的文字也算进来** —— 移动端叙事版在桌面上是 hidden，
      // 文字却照样计入，首页因此虚高一倍多。**这正是「量错了东西」的又一例**。
      body = await page.evaluate("document.body.innerText");
      // 中文字数只量 <main> —— **导航和页脚是 chrome，不是「我们的解释说明」**。
      // 量 body 的后果：加一个导航项，十二个页面的预算同时被扣，
      // 而那和「前端放不放旁白」毫无关系。度量要对准它想管的那件事。
      mainText = await page.evaluate('document.querySelector("main")?.innerText ?? document.body.innerText');
      // 引用不算我们的旁白。**这条预算量的是「我们自己说了多少话」**，
      // 而脚注里那 57 条是厂商官方文档的原文 —— 它越多越好，不该被扣分。
      // 首页因此从 230 涨到 2116 而报红，红的是尺子不是页面：**量对了再谈调参。**
      // ⚠️ 只减**可见**的引用块。`display:none` 的元素上 innerText 会退化成 textContent，
      // 手机端真值表整块隐藏，它里面的 59 条脚注照样被当成引用减掉，
      // 结果首页中文字符被减成负数、夹到 0 —— **和当初 textContent 那个坑是同一类**。
      // **导航标签也不算旁白。** 跳转条上的九个词就是九张卡的标题本身，
      // 算两遍只会让数字虚高，而这条尺子量的是「我们自己额外说了多少话」。
      // 判据是语义标签 `<nav>`，不是某个组件 —— 面包屑、「接下来」同理。
      quoted = await page.evaluate(
        '[...document.querySelectorAll("main [data-quote], main nav")]' +
        '.filter(e=>e.getClientRects().length>0).map(e=>e.innerText).join("")');
      // 兜底判断靠 data-page="home" 这个**稳定记号**，不靠首页的文案 ——
      // 文案一改判断就失效（刚才就失效了）。
      fellBack = r.path !== "/" && (await page.evaluate('!!document.querySelector(\'[data-page="home"]\')'));
    } catch { body = ""; }

    const self = body.includes(r.must) && !fellBack;
    // 还没建的页单独列成待办，不混进失败 —— 整片红看不出真问题
    if (!r.built && !self) { todo.add(r.path); await page.close(); continue; }

    console.log(`\n── ${r.path}`);
    ok(self, `渲染的是自己（含「${r.must}」，没回退到首页）`);
    // `also` 钉的是**这一页的结构**，不是它的身份。改版把某一栏做没了，`must`
    // 照样过（标题还在），只有这里能拦住 —— 上一次「加了栏位但四个页面看不出区别」
    // 就是因为没有任何检查在盯「这一栏到底有没有渲染出来」。
    for (const m of r.also ?? []) ok(body.includes(m), `有「${m}」这一栏`);
    ok((await page.evaluate(VISIBLE("h1, h2"))) > 0, "有可见标题");
    ok(errs.length === 0, `控制台没有报错${errs.length ? `：${errs[0]}` : ""}`);
    ok(await page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), "不横向滚动");

    /**
     * **中文字符数：棘轮，不是一刀切。**
     *
     * `zh` 是目标值，但有些页要等后面的批次重做才能到（首页要等 A4）。
     * 让检查永远飘红，它就失去闸门作用了；直接把阈值调松，又正是
     * 「悄悄涨回去」那件事本身。
     *
     * 所以：**只许降不许升** —— 超过上次记录的基线就失败，
     * 同时把「离目标还差多少」打出来，让欠账一直可见。
     */
    /**
     * 列表页量**条目自己的字数**，不拿整页除以条数。
     *
     * ⚠️ 原来是 `整页中文 ÷ 条数`，2026-08-11 撞到了它的毛病：
     * /caveats 按负责人要求去掉转售商那两家，条目 11 → 4，
     * **页面一个字没改，每条却从 35 涨到 96** —— 因为开场白和口径说明
     * 这些固定文案被摊到了越来越少的条目头上。
     *
     * 这条预算想管的是「每条里我们自己说了多少话」，
     * 那就该只量条目内部。**页面固定文案不是任何一条的旁白。**
     */
    const zhOf = (t) => (t.match(/[一-龥]/g) ?? []).length;
    let items = 1, zhAll;
    if (r.per) {
      const texts = await page.evaluate(
        `(function () {
           var all = [...document.querySelectorAll(${JSON.stringify(r.per)})];
           // **父子都命中就会把同一段文字数两遍。** /changes 的选择器是
           // "article, section > div"，外层 div 里裹着 article，两个都匹配 ——
           // 于是每条 78 一下子变成 152，**页面一个字没动**。
           // 只留**最内层**（真正的条目）：还包着别的命中元素的，是容器不是条目，丢掉。
           // ⚠️ 反过来留最外层是错的 —— /changes 会塌成 3 个大容器，每条变成 690 字。
           var top = all.filter(function (e) { return !all.some(function (o) { return o !== e && e.contains(o) }) });
           return top.map(function (e) {
             var c = e.cloneNode(true);
             c.querySelectorAll("[data-quote]").forEach(function (q) { q.remove() });
             return c.textContent || "";
           });
         })()`);
      items = texts.length;
      zhAll = texts.reduce((n, t) => n + zhOf(t), 0);
    } else {
      zhAll = Math.max(0, zhOf(mainText) - zhOf(quoted));
    }
    const zh = r.per ? Math.round(zhAll / Math.max(1, items)) : zhAll;
    const key = `${r.path}|${vp}`;
    const base = BASE_ZH[key] ?? Infinity;
    const pass = zh <= Math.max(r.zh, base);
    ok(pass, `中文字符 ${zh}${r.per ? `/条（共 ${items} 条 ${zhAll} 字）` : ""}（基线 ${base === Infinity ? "首次" : base} · 目标 ${r.zh}）` +
      (zh > r.zh ? ` —— 还差 ${zh - r.zh} 字` : ""));
    if (pass) NEW_ZH[key] = Math.min(zh, base === Infinity ? zh : base);

    // 查 [data-nav=global]，**不查通用的 <nav>** —— 详情页的面包屑也是 <nav>，
    // 用通用标签查会在全站导航被拆掉时照样通过（对抗性复查抓到的假阳性）。
    ok((await page.evaluate(VISIBLE("[data-nav=global]"))) > 0, "全站导航可见");

    if (vp === "桌面") graph.set(r.path, [...new Set(await page.evaluate(LINKS))]);
    await page.close();
  }
}

/**
 * 一个名字有没有**作为一个词**出现在文本里。
 *
 * 直接 `includes` 会误报：新收的图像产品线叫 **Anima**，而视频侧到处是
 * `AnimateDiff`、`Wan2.2-Animate` —— 子串一撞，就报「视频页混入了图像模型」。
 * **名字是真的，该改的是匹配方式。**
 *
 * 拉丁名要求两侧不是字母数字；中文名没有词边界，仍用包含判断（实测没出过误报）。
 */
const mentions = (txt, name) => {
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return /^[\x00-\x7f]+$/.test(name)
    ? new RegExp(`(?<![A-Za-z0-9])${esc}(?![A-Za-z0-9])`).test(txt)
    : txt.includes(name);
};

// ── 新页不许是孤儿 ────────────────────────────────────────────────
/**
 * **一个没人链到的页面，等于没做。**
 *
 * 2026-08-12 `/basics` 上线当天只有 `/toolkit` 一处链它 —— 而 /toolkit 自己
 * 还在方向首页的次级入口里，等于埋了两层。负责人当场就问「入口在哪里」。
 * 对照同类跨方向页：/changes 被 961 页链、/method 481、/caveats 32、/toolkit 7，
 * **它 1**。这个差距肉眼看不出来，只有数一遍才知道。
 *
 * 所以：路由表里的每一页，**必须至少被另外一页链到**。
 * 阈值定 1 而不是更高 —— 这条要拦的是「彻底没人链」，不是替页面排名。
 */
{
  console.log("\n══════ 新页不许是孤儿 ══════");
  const files = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const f = join(d, e.name);
      if (e.isDirectory()) walk(f);
      else if (e.name.endsWith(".html")) files.push(f);
    }
  };
  if (existsSync(OUT)) walk(OUT);
  const html = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));
  /**
   * 顺便查标题里的站名重复。
   * `layout.tsx` 用 `template: "%s｜虾米看AI"` 自动补站名，页面自己再写一遍就重了 ——
   * 2026-08-12 `/basics` 上线当天的标题就是「…｜虾米看AI｜虾米看AI」。
   * 这种错只出现在 `<title>` 里，页面上一个字都看不出来，**只有查才发现**。
   */
  for (const [f, t] of html) {
    const title = (t.match(/<title>([^<]*)<\/title>/) || [])[1] ?? "";
    const n = title.split("虾米看AI").length - 1;
    if (n > 1) ok(false, `${f.replace(OUT, "")} 的标题里站名出现 ${n} 次：${title.slice(0, 60)}`);
  }

  for (const r of ROUTES) {
    if (r.path === "/") continue;                       // 根页是入口，没人链它是正常的
    const self = join(OUT, `${r.path.slice(1)}.html`);
    let n = 0;
    for (const [f, t] of html) {
      if (f === self) continue;
      if (t.includes(`${BASE}${r.path}"`) || t.includes(`${BASE}${r.path}#`)) n++;
    }
    ok(n > 0, `${r.path} 有页面链到它（${n} 处）`);
  }
}

// ── 方向隔离：别的方向的模型不许出现在当前方向的页面上 ─────────────────
/**
 * **这条是实测抓出来的，不是想出来的。**
 *
 * 2026-08-11 加完 AI 图像花名册（13 条产品线）后，validate 全绿、类型全过，
 * 但在浏览器里一看：`/models` 与 `/map` **两页都把图像产品线渲染出来了** ——
 * 因为那两处直接遍历 `atlas.models`，而它现在装着两个方向的东西。
 *
 * **校验管的是数据自洽，管不了「这条数据该不该出现在这一页」。**
 * 所以这一条必须在浏览器里查，而且要一直查下去：下次再加方向，
 * 任何一处漏了过滤，这里立刻红。
 */
{
  console.log("\n══════ 方向隔离 ══════");
  const raw = JSON.parse(readFileSync(join(ROOT, "data/atlas.json"), "utf8"));
  const live = (raw.domains ?? []).find((d) => d.state === "live")?.id ?? "video";
  const alien = (raw.models ?? []).filter((m) => (m.domain ?? "video") !== live);
  if (raw.domains.length <= 1) {
    ok(true, `只有一个方向，暂无可漏的（当前 ${live}）`);
  } else {
    const names = alien.map((m) => m.family);
    /**
     * **每个方向的每一页都要查，不能只查一组固定路径。**
     * 上一版写死了 ["/", "/models", "/map", …]，那是方向化之前的路由 ——
     * 方向化之后它一页都没真正覆盖到，于是 /atlas/image/map 画着 AI 视频的关系图
     * 却全绿。**测试跟着重构一起改，否则它保护的是上一版的代码。**
     */
    const pages = raw.domains.flatMap((d) =>
      ["", "/tree", "/map", "/scenario", "/models"].map((seg) => ({ path: `/${d.id}${seg}`, mine: d.id })));
    /**
     * **能力页也要查，而且它的方向不在 URL 里。**
     *
     * 2026-08-12 给声音卷加「开源权重」（`class: "both"`）时炸出来：
     * `/capability/s-openweights` 整页列的是 Seedance、Hailuo、Wan、Runway、Kling、Vidu、Veo ——
     * 七个**视频**模型，每格 ⬜。页面把 `both` 写死展开成了视频那两条轨。
     * 看着像「声音的开源权重没人做」，其实是列错了一批模型 —— **最坏的一种错：它有结论的样子。**
     *
     * 这一页的 URL 是 `/capability/<id>`，方向得从数据里查，所以 `mine` 必须显式带上，
     * 不能再靠 `path.split("/")[1]` 猜。每个方向抽两个能力，够覆盖 `both` 与单轨两种展开。
     */
    for (const d of raw.domains) {
      const cs = (raw.capabilities ?? []).filter((c) => (c.domain ?? "video") === d.id);
      for (const c of [cs.find((x) => x.class === "both") ?? cs[0], cs.at(-1)].filter(Boolean))
        pages.push({ path: `/capability/${c.id}`, mine: d.id });
    }
    for (const { path, mine } of pages) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      let txt = "";
      try {
        await page.goto(`${ORIGIN}${BASE}${path === "/" ? "" : path}`,
          { waitUntil: DEV ? "domcontentloaded" : "networkidle", timeout: 45000 });
        await page.waitForTimeout(DEV ? 1800 : 900);
        /**
         * **扫描前先摘掉原文引用。**
         *
         * 一条上游项目的英文标语里出现别家模型的名字是**正常的** ——
         * LatentSync 的自述就是「Taming Stable Diffusion for Lip Sync」，
         * 这句话出现在 AI 视频的场景页上，不代表 Stable Diffusion 这条
         * 图像产品线漏进来了，它就是引用本身。
         *
         * 引用是证据，**不能为了让检查变绿去改它**（改原文比放宽检查更糟）。
         * 而 `[data-quote]` 这个记号已经存在 —— 中文字数那条棘轮减的就是它，
         * 因为「不放旁白」管的也只是我们自己写的字。同一条边界，两处共用。
         */
        /**
         * ⚠️ 别用 `cloneNode` 再取 `innerText`：克隆出来的节点**不在文档里**，
         * `innerText` 会退化成 `textContent` —— 连 `display:none` 的内容一起算进来。
         * 第一版就是这么写的，结果 /image 立刻「混入」了九条视频产品线
         * （它们在移动端那一份里是隐藏的）。**读文本也要读「看得见的那一份」**，
         * 和量标签重叠时只量可见矩形是同一条纪律。
         */
        txt = await page.evaluate(`(() => {
          const m = document.querySelector("main");
          if (!m) return "";
          const q = [...m.querySelectorAll("[data-quote], [data-prose]")];
          const keep = q.map((e) => e.style.display);
          q.forEach((e) => { e.style.display = "none"; });
          const t = m.innerText;
          q.forEach((e, i) => { e.style.display = keep[i]; });
          return t;
        })()`);
      } catch { txt = ""; }
      /**
       * **先把本方向合法出现的名字抠掉，再在剩下的里找外来名。**
       *
       * 加了 AI 文本之后，新方向的产品线名正好是旧方向的前缀：
       * `Gemini` ⊂「Gemini Omni Flash」、`MiniMax` ⊂「MiniMax Hailuo」、
       * `GPT` ⊂「GPT Image」、`Qwen` ⊂「Qwen-Image」。词边界救不了这一类 ——
       * 「Gemini」后面跟的是空格，边界成立，于是每个视频页都被报「混入 Gemini」。
       *
       * 判据得升一级：**这次出现，是不是本页某个更长的名字的一部分**。
       * 按长度从长到短抠掉本方向的名字，剩下的文本里再出现外来名，才是真漏。
       */
      /**
       * 要抠掉的不只是产品线名，还有**本方向的版本号和公司名** ——
       * 「GPT-image-2」里含 GPT、「MiniMax Hailuo」那一列下面写着公司「MiniMax」，
       * 而 GPT / MiniMax 又正好是文本那一卷的产品线名。
       * 公司是跨方向共用的实体，它出现在任何一页都合法。
       */
      const own = [
        ...(raw.models ?? []).filter((m) => (m.domain ?? "video") === mine)
          .flatMap((m) => [m.family, m.version].filter(Boolean)),
        ...(raw.orgs ?? []).flatMap((o) => [o.name, o.zh].filter(Boolean)),
        /**
         * **`team` 也是页面上印出来的名字。**
         * `vendorName()` 拼的是 `${org.zh} · ${model.team}` —— 于是 Qwen-Image 那一行
         * 显示成「阿里巴巴 · **通义 Qwen**」。org 名抠掉了、family 抠掉了，
         * 唯独这个中间名没人抠，剩下一个裸的 `Qwen` 命中文本卷的产品线名。
         * 只抠本方向的 team，别把别的方向的一起抠掉 —— 那会把真漏也一起放过。
         */
        ...(raw.models ?? []).filter((m) => (m.domain ?? "video") === mine)
          .map((m) => m.team).filter(Boolean),
        ...(raw.versions ?? []).filter((v) =>
          (raw.models ?? []).some((m) => m.id === v.m && (m.domain ?? "video") === mine))
          .map((v) => v.version),
        /**
         * **我们引用的第三方开源项目名，也要先抠掉。**
         *
         * 2026-08-12 给声音卷补开源资源时栽的第三次：`/sound/scenario` 上出现
         * `GPT-SoVITS`（一个声音复刻项目），而 `GPT` 是文本卷的产品线名 ——
         * 词边界拦不住，因为 GPT 后面跟的是连字符。
         *
         * 不能靠「把连字符也算进边界」来躲：那样真漏进来的 `GPT-5.6` 也一起放过了。
         * 正确的判据还是同一条 —— **这次出现是不是某个更长的已知名字的一部分**。
         * 仓库名从数据里的 GitHub 链接现取，所以以后再引哪个项目都不用回来改。
         */
        ...[...JSON.stringify(raw).matchAll(/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/g)]
          .flatMap((m) => [`${m[1]}/${m[2]}`, m[2]]),
        /**
         * **来源名也要先抠掉 —— 它是别人文档的标题，不是我们的主张。**
         *
         * 2026-08-12 能力页纳入扫描后炸出来的最后一类：
         * `/capability/s-openweights`（声音）上引的来源叫
         * 「Gemini API · Speech generation」、「Hugging Face · Qwen/Qwen3-Omni-30B-A3B-Instruct」——
         * 里面的 Gemini 与 Qwen 是**这条声音能力的真实出处**，不是文本卷漏进来了。
         *
         * 顺带把 HF 仓库路径也收进来：上一版只抠了 github.com 的，
         * 而声音与图像两卷的权重证据大多挂在 huggingface.co 上。
         */
        /**
         * **「我们明说了不收它」的名字，出现在这一卷的页面上是对的。**
         *
         * 2026-08-13 AI 3D 立项当天炸出来的：`/image/models` 上有一条 08-11 写的排除说明
         *「图生 3D（TRELLIS / Hunyuan3D-2 / TripoSR）…… 它们的产出是网格和材质，不是图」——
         * 那正是这一页该说的话。3D 成为独立方向的那一刻，这段正确的文字突然变成了「跨方向混入」。
         *
         * 所以把本方向 `excluded` 条目里的名字先抠掉。范围很窄：**只有我们自己声明过
         * 「这一卷不收它」的名字**，别的方向的模型漏进来照样会被抓到。
         */
        ...(raw.excluded ?? []).filter((e) => (e.domain ?? "video") === mine)
          .flatMap((e) => [e.name, e.why, e.revisit, ...(e.same_bucket ?? [])]).filter(Boolean)
          // ⚠️ **先去掉 `**` 再比。** 数据里的重点标记渲染时会被 `Rich` 吃掉，
          // 带着标记去匹配页面文字，一个字都对不上 —— 第一版就是这么白写的。
          .map((x) => x.replace(/\*\*/g, "")),
        ...Object.values(raw.sources ?? {}).map((s) => s.name).filter(Boolean),
        ...[...JSON.stringify(raw).matchAll(/huggingface\.co\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)/g)]
          .flatMap((m) => [`${m[1]}/${m[2]}`, m[2]]),
      ].sort((a, b) => b.length - a.length);
      let rest = txt;
      /**
       * **剥自家名字要忽略大小写。** 2026-08-12 声音卷栽在这：
       * 页面上写的是 `GLM-4-Voice`，而我们记的 version 是小写 `glm-4-voice`，
       * `split()` 大小写敏感就没剥掉，接着「GLM」（文本卷）作为子串命中，
       * 报出一条**假的跨方向混入**。
       * 假警告的代价是真警告没人看 —— 这个检查已经因为前缀问题误报过一次了。
       */
      const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      for (const n of own) {
        rest = rest.replace(new RegExp(esc(n), "gi"), "§");
        /**
         * **截断过的名字也要剥。** 2026-08-14 具身智能卷栽在这：
         * 演化树的 SVG 标签放不下就省略，页面上写的是 `Gemini Robot…`。
         * 按全名 `Gemini Robotics ER` 去剥剥不掉，剩下的 `Gemini` 立刻
         * 撞上文本卷的 `Gemini` —— **报了一条假的跨方向混入**。
         *
         * 和上面那条大小写的坑是同一类：**这个检查比的是页面上的字，
         * 而页面会对字做加工**（大小写、省略号，将来可能还有换行）。
         * 所以自家名字的每一个「前缀 + …」也要一起剥掉。
         *
         * 假警告的代价不是多看一行，是**真警告没人看** ——
         * 这个检查已经因为类似问题误报过两次了。
         */
        for (let k = n.length - 1; k >= 4; k--)
          rest = rest.replace(new RegExp(esc(n.slice(0, k)) + "…", "gi"), "§");
      }
      const foreign = (raw.models ?? [])
        .filter((m) => (m.domain ?? "video") !== mine).map((m) => m.family);
      const hit = foreign.filter((n) => mentions(rest, n));
      ok(hit.length === 0, `${path} 没有混入别的方向的模型${hit.length ? `：${hit.join("、")}` : ""}`);

      /**
       * **能力也要查，不只是模型。** 这一条是补上来的：
       * 能力串方向已经漏过两次 —— capsOf 一次（图像表里冒出「开源权重」两行）、
       * 关系图一次（左边挂 FLUX / Seedream，右边列「文生视频 / 运镜控制 / 对口型」）。
       * **半边对、半边错，比整页错更难发现。**
       *
       * 注意去掉同名的：两个方向都有一条叫「开源权重」的能力，
       * 按名字判断会报假阳性 —— 只算「本方向没有的名字」。
       */
      const mineCaps = new Set((raw.capabilities ?? [])
        .filter((c) => (c.domain ?? "video") === mine).map((c) => c.zh));
      const alienCaps = (raw.capabilities ?? [])
        .filter((c) => (c.domain ?? "video") !== mine).map((c) => c.zh)
        .filter((n) => !mineCaps.has(n));
      /**
       * **页面上不许出现裸的 `**`。**
       *
       * 全库都用 `**` 在数据里标重点，渲染时要过 `Rich`。漏用的地方不会报错，
       * 只会把星号原样印出来 —— 一眼看去像排版坏了。手机端截图才发现
       * 「**直接对得上这件事**」就这么印在卡片上。
       * 三处漏用（场景页 note、models 页 revisit）都是这么找出来的，钉住。
       */
      // 变量别叫 raw —— 外层的 `raw` 是解析好的 atlas.json，同名会把它遮住
      const starred = txt.match(/\*\*[^*\n]{1,40}\*\*/g) ?? [];
      ok(starred.length === 0,
        `${path} 没有把 ** 原样印出来${starred.length ? `：${starred.slice(0, 3).join("、")}` : ""}`);

      const mineCapNames = [...mineCaps].sort((a, b) => b.length - a.length);
      /**
       * ⚠️ **从 `rest` 起，不是从 `txt` 起。** 上面已经把「本方向合法出现的名字」
       * （含我们自己声明过不收的那些）抠掉了 —— 能力这一遍从原文重来，
       * 等于把那份豁免作废。2026-08-13 就是这样：模型那一遍过了，
       * 能力那一遍还在报同一段排除说明里的「图生 3D」。
       */
      let restCap = rest;
      for (const n of mineCapNames) restCap = restCap.split(n).join("§");
      const capHit = alienCaps.filter((n) => mentions(restCap, n));
      ok(capHit.length === 0, `${path} 没有混入别的方向的能力${capHit.length ? `：${capHit.join("、")}` : ""}`);

      /**
       * **应用也要查。** 同一个错法第三次了：/atlas/image/scenario 把「AI短剧」
       * 「数字人口播」这些视频应用整页列了出来 —— 方向页明明算好了 `apps`，
       * 组件内部又自己取了一遍全局 `atlas.applications`。
       * **一个值算两遍，第二遍必然被漏掉**（模型一次、能力一次、现在应用一次）。
       */
      const mineApps = new Set((raw.applications ?? [])
        .filter((x) => (x.domain ?? "video") === mine).map((x) => x.zh));
      const alienApps = (raw.applications ?? [])
        .filter((x) => (x.domain ?? "video") !== mine).map((x) => x.zh)
        .filter((n) => !mineApps.has(n));
      const appHit = alienApps.filter((n) => mentions(txt, n));
      ok(appHit.length === 0, `${path} 没有混入别的方向的应用${appHit.length ? `：${appHit.join("、")}` : ""}`);
      // **切换器标签必须跟着路由走。** 它自己去找 live 方向的话，
      // 站在 /atlas/image/* 上照样显示「AI 视频」—— 路由对、内容对，只有这块标签骗人。
      const chip = await page.evaluate(
        'document.querySelector("nav[data-nav=global] button[aria-haspopup=menu]")?.innerText ?? ""');
      const want = raw.domains.find((d) => d.id === mine)?.name ?? "";
      ok(chip.includes(want), `${path} 切换器显示的是本方向（要「${want}」，实为「${chip.replace(/\s+/g, " ").trim()}」）`);
      await page.close();
    }
  }
}

// ── 演化树：标签不许重叠 ────────────────────────────────────────────
/**
 * **这条只能在浏览器里量。** 标签避让是纯几何，validate 看不见，
 * 而它坏起来是「图还在、就是看不清」—— 最容易被当成「这样也还行」。
 *
 * 量的时候只数**真正可见**的：opacity 0 的标签也有矩形，混进来会虚报。
 * 2026-08-11 加图像谱系时，光是量法不同就把 0 报成了 6。
 */
{
  console.log("\n══════ 演化树标签 ══════");
  const raw2 = JSON.parse(readFileSync(join(ROOT, "data/atlas.json"), "utf8"));
  for (const d of raw2.domains ?? []) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
    let r = { n: 0, ov: 0, eg: [] };
    try {
      await page.goto(`${ORIGIN}${BASE}/${d.id}/tree`,
        { waitUntil: DEV ? "domcontentloaded" : "networkidle", timeout: 45000 });
      await page.waitForTimeout(DEV ? 2200 : 1200);
      r = await page.evaluate(`(()=>{
        const t=[...document.querySelectorAll('main svg text')]
          .filter(e=>+getComputedStyle(e.closest('g')||e).opacity>0.5 && e.getClientRects().length);
        const rs=t.map(e=>e.getBoundingClientRect()); let ov=0; const eg=[];
        for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++){const a=rs[i],b=rs[j];
          if(a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom){ov++;
            if(eg.length<3)eg.push(t[i].textContent+' ⨯ '+t[j].textContent);}}
        return {n:t.length, ov, eg};
      })()`);
    } catch { /* 页面打不开由别处的断言负责报 */ }
    /**
     * **没有谱系的方向不该判失败。** 新开一个方向时谱系一定是空的（AI 文本就是），
     * 那时候树画的是空状态，标签为 0 是**正确行为**。
     * 把「还没采」判成「坏了」，只会逼人去糊一个假的谱系上去。
     */
    // 这一节用的是 raw2（本块自己读的那份），别拿方向隔离那块的 raw —— 不在作用域里
    const hasVers = (raw2.versions ?? []).some((v) =>
      (raw2.models ?? []).some((m) => m.id === v.m && (m.domain ?? "video") === d.id));
    if (!hasVers) {
      ok(true, `${d.id} 还没有谱系，树是空状态（不是故障）`);
    } else {
    ok(r.n > 0, `${d.id} 的树画出来了（可见标签 ${r.n} 个）`);
    ok(r.ov === 0, `${d.id} 的树标签零重叠${r.ov ? `：${r.ov} 对，例 ${r.eg.join("、")}` : ""}`);
    /**
     * **零重叠不代表没坏。** 标签一路上抬可以让到画布外面 —— 矩形不再相交，
     * 这条检查全绿，而那块字**在画面里根本看不见**（22 条产品线时
     * 「Boogu-Image」实测让到了 y = -8，顶端被切掉一半）。
     * 所以必须再问一句：每块字是不是都还在画布里。
     */
    let outside = [];
    try {
      outside = await page.evaluate(`(() => {
        const svg = document.querySelector("svg"); if (!svg) return [];
        const sb = svg.getBoundingClientRect();
        return [...svg.querySelectorAll("text")].filter((t) => {
          if (+getComputedStyle(t).opacity <= 0.5) return false;
          const r = t.getBoundingClientRect(); if (!r.width) return false;
          return r.top < sb.top - 0.5 || r.bottom > sb.bottom + 0.5
              || r.left < sb.left - 0.5 || r.right > sb.right + 0.5;
        }).map((t) => t.textContent.trim());
      })()`);
    } catch { /* 同上 */ }
    ok(outside.length === 0,
      `${d.id} 的树标签都在画布里${outside.length ? `：${outside.slice(0, 3).join("、")} 溢出` : ""}`);
    }
    await page.close();
  }
}

/**
 * ── 分享图必须真的存在 ────────────────────────────────────────────
 *
 * **这条是被线上咬出来的（2026-08-12）。**
 * `tree-16x9.png` 一直没生成成功（跑批时那句「1 张装不下，没出」），
 * 而线上 Caddy 当时还带着 SPA 兜底 —— 于是请求它返回 **200 + 首页 HTML**，
 * content-type 是 text/html。图挂了，可谁都看不出来：
 * 状态码是绿的、监控是绿的、点开还有内容。
 *
 * 两头都修了（去掉兜底、按方向出卡），但**修完还得有人一直盯着**：
 * 页面声明的 og:image 与 <a download> 指向的图，必须在产物里真的躺着。
 * 少一张就报错 —— 否则下一次又会变成「按钮在、下载下来是个 HTML」。
 */
{
  const ogDir = join(OUT, "og");
  const have = new Set(existsSync(ogDir) ? readdirSync(ogDir) : []);
  const missing = new Map();
  const walk = (dir) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, f.name);
      if (f.isDirectory()) { if (f.name !== "og" && f.name !== "_next") walk(full); continue; }
      if (!f.name.endsWith(".html")) continue;
      const html = readFileSync(full, "utf8");
      for (const m of html.matchAll(/\/atlas\/og\/([A-Za-z0-9._-]+\.png)/g))
        if (!have.has(m[1])) missing.set(m[1], (missing.get(m[1]) ?? 0) + 1);
    }
  };
  walk(OUT);
  ok(missing.size === 0,
    `页面引用的分享图都在（${have.size} 张）` +
    (missing.size ? ` —— **缺 ${missing.size} 张**：${[...missing.keys()].slice(0, 4).join("、")}` : ""));
}

// ── 跨方向筛选条：上线一卷，公共页的快捷导航必须跟着长出来 ──────────
/**
 * 负责人 2026-08-13：「后续添加新的 AI 工具方向的**跨方向导航**与内容，
 * 要在做具体方向时一起更新。」
 *
 * 内容那半边由 R68 在 validate 里管（四个公共页每卷都要有东西）。
 * 导航这半边只有在浏览器里才看得见 —— `DomainFilter` 的按钮是客户端渲染的，
 * 数据对了但组件没接上，静态校验一点都察觉不到。所以在这里数按钮。
 *
 * ⚠️ 数的是**上线**的方向（`state === "live"`）。立项未上线的不该出现在筛选条上，
 * 点进去是空页面比没有这个按钮更糟。
 */
{
  console.log("\n══════ 公共页的方向筛选条 ══════");
  const live = JSON.parse(readFileSync(join(ROOT, "data/atlas.json"), "utf8"))
    .domains.filter((d) => d.state === "live");
  for (const path of ["/changes", "/toolkit"]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(ORIGIN + BASE + path, { waitUntil: "networkidle" });
    const labels = await page.locator("[role=group] button").allInnerTexts();
    await page.close();
    const miss = live.filter((d) => !labels.some((t) => t.includes(d.name)));
    ok(miss.length === 0,
      `${path} 的筛选条覆盖 ${live.length} 个上线方向` +
      (miss.length ? ` —— **少了 ${miss.map((d) => d.name).join("、")}**` : `（${live.map((d) => d.name).join("、")}）`));
  }
}

// ── 动线可达性：从任意页出发，≤2 次点击能到三条动线的起点 ─────────────
if (FLOWS) {
  console.log("\n══════ 动线可达性 ══════");
  const norm = (p) => (p.startsWith(BASE) ? p.slice(BASE.length) || "/" : p);
  const starts = FLOWS.flows.map((f) => f.steps[0].page);
  for (const from of [...graph.keys()]) {
    const seen = new Set([from]);
    let frontier = [from];
    for (let d = 0; d < 2; d++) {
      const next = [];
      for (const p of frontier) for (const l of graph.get(p) ?? []) {
        const n = norm(l);
        if (!seen.has(n)) { seen.add(n); next.push(n); }
      }
      frontier = next;
    }
    const miss = starts.filter((s) => !seen.has(s));
    ok(miss.length === 0, `${from} 两步内可达三条动线起点${miss.length ? `（差 ${miss.join("、")}）` : ""}`);
  }
} else {
  console.log("\n（还没有 data/flows.json，动线可达性没查 —— A1 会补上）");
}

// ── 路由家族归类：新加一类路由，必须先说它属于哪一卷 ──────────────────
/**
 * **这条是被同一个错第三次咬出来才加的。**
 *
 * 导航最左边那块显示「你在哪一卷」。它按路径第一段判断，
 * 判不出来就**退回第一个 live 方向** —— 于是每加一类不带方向前缀的路由，
 * 那一类的页面就默认顶着「AI 视频」：
 *
 * - 2026-08-12 `/skill/[id]`：图像 Skill 顶着「AI 视频」
 * - 2026-08-12 `/model/[id]`、`/capability/[id]`：四卷一百多页，除视频外全错
 * - 2026-08-17 `/topic/[id]`：负责人截图，游戏专项顶着「AI 视频」
 *
 * 三次的修法都是「给这一类加个特判」，**于是下一类照样漏**。
 * 上面那条方向隔离检查也帮不上忙 —— 它只走 `/{方向}/…`，
 * `/topic/…` 这种在所有方向之外的路径，它一次都没访问过。
 *
 * 所以这一版换个判据：**产物里出现没归类的顶层路由段，就红。**
 * 加新路由时会被逼着回答「它属于哪一卷」，而不是等用户截图。
 */
{
  console.log("\n══════ 路由家族归类 ══════");
  const raw3 = JSON.parse(readFileSync(join(ROOT, "data/atlas.json"), "utf8"));
  /** 每一类各是怎么定归属的 —— 改 Nav 的判断逻辑时，这张表要跟着改。 */
  const KNOWN = {
    ...Object.fromEntries((raw3.domains ?? []).map((d) => [d.id, "方向自己"])),
    skill: "问实体的 domain", model: "问实体的 domain", capability: "问实体的 domain",
    topic: "问专项的 domain（可为空 = 横跨，显示「全站」）",
    changes: "跨方向", method: "跨方向", toolkit: "跨方向", caveats: "跨方向", basics: "跨方向",
    compare: "跨方向", release: "跨方向", where: "跨方向", search: "跨方向", map: "跨方向",
    claims: "跨方向（自述与实测，横跨所有专项）",
  };
  /** 不是页面的东西不算路由家族。 */
  const SKIP = /^(_next|og|diagrams|assets|images|fonts|favicon|robots|sitemap|changes\.xml|404|index)/;

  const outDir = join(ROOT, "out");
  let fams = [];
  try {
    fams = readdirSync(outDir)
      .map((f) => f.replace(/\.html$/, ""))
      .filter((f) => !SKIP.test(f) && !f.includes("."));
  } catch { /* 没有 out/ 时这条不判 —— dev 模式下本来就没有产物 */ }

  if (!fams.length) {
    ok(true, "没有构建产物，这条跳过（先 npm run build）");
  } else {
    const unknown = fams.filter((f) => !(f in KNOWN));
    ok(unknown.length === 0,
      `${fams.length} 个顶层路由家族全部归过类` +
      (unknown.length ? ` —— **没归类的：${unknown.join("、")}**。` +
        "导航会让它们默认顶着第一个 live 方向的名字，页面不报错但标签在骗人。" +
        "去 components/Nav.tsx 说清楚它属于哪一卷，并把它加进这张表" : ""));
    /** 归了类还不够，**得真的显示对** —— 抽查专项页：有归属显示那一卷，没归属显示「全站」。 */
    for (const t of raw3.topics ?? []) {
      const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
      await page.goto(`${ORIGIN}${BASE}/topic/${t.id}`,
        { waitUntil: DEV ? "domcontentloaded" : "networkidle", timeout: 45000 });
      const chip = (await page.evaluate(
        'document.querySelector("nav[data-nav=global] button[aria-haspopup=menu]")?.innerText ?? ""'))
        .replace(/\s+/g, " ").trim();
      const want = t.domain
        ? (raw3.domains.find((d) => d.id === t.domain)?.name ?? t.domain)
        : "全站";
      ok(chip.includes(want),
        `专项「${t.zh}」的方向标签是「${chip}」，应含「${want}」` +
        (t.domain ? "" : "（没声明归属 = 横跨多卷）"));
      await page.close();
    }
  }
}

await browser.close();
server?.close();

// 基线只在全绿时更新 —— 失败的那一轮不该把坏数字写成新基线
if (!fails.length) {
  const merged = { ...BASE_ZH, ...NEW_ZH };
  writeFileSync(BASE_PATH, JSON.stringify({ note: "中文字符数基线，只许降不许升。verify 全绿时自动更新。", zh: merged }, null, 2) + "\n");
}

if (todo.size) console.log(`\n待建（不算失败）：${[...todo].join("  ")}`);
console.log(fails.length ? `\n${fails.length} 项没过。` : "\n全部通过。");
process.exit(fails.length ? 1 : 0);
