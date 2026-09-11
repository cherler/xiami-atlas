/**
 * 本机审阅台 —— 和采集 agent 配套的那一半。
 *
 * ## 为什么是本机、为什么单独一个
 *
 * 一度想放进运营台，负责人 2026-08-11 叫停：「这个审阅这么复杂的话，就不要放运营台了」。
 * 症结不是界面难做，是**架构错配**：atlas 的数据在 git 仓库里，前端是静态导出的
 * （`lib/atlas.ts` 直接 import `data/atlas.json`，数据即构建产物）——
 * 线上运营台点「通过」写不到任何地方，硬接就要先改部署。
 * **为一个只能在本机闭环的流程去改线上，不划算。**
 *
 * 所以它跟着采集 agent 走：agent 在哪台机器上跑，审阅台就在那台机器上开。
 *
 * ## 一个文件，零依赖，零构建
 *
 * 页面和 API 都在这里。判断与写入全部转发给 `review.mjs` ——
 * **口径不能有第二份**：命令行和界面必须走同一条路径，否则两边迟早给出不同结果。
 *
 *   node scripts/review-ui.mjs      →  http://127.0.0.1:8230
 */
import { createServer } from "node:http";
import { spawn, execFile, execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { queue, decide, requoteQueue, requoteDecide } from "./review.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.ATLAS_REVIEW_PORT ?? 8230);
/** **只听 127.0.0.1。** 这支能写 atlas.json 并提交 git —— 绑到 0.0.0.0 等于把写库权限挂到局域网上。 */
const HOST = "127.0.0.1";

const json = (res, code, body) => {
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
};

/* ── 从这里能跑的活 ──────────────────────────────────────────────────
 *
 * 负责人 2026-08-18：「所有的操作，我只从本地审阅台一个地方处理。」
 *
 * 在那之前，待办通知里每一摞后面跟着一条不同的命令 —— 七摞七条，
 * 意味着每天要开七次终端、记七个脚本名。**人不会那么做**，
 * 于是通知照发、待办照攒，而这正是当初建 todo.mjs 想解决的毛病。
 *
 * 所以这里给出**白名单**里的活，点一下就跑。三条规矩：
 *
 *  1. **白名单，不是任意命令。** 这支服务能写 atlas.json、能提交 git，
 *     留一个「跑任意命令」的口子等于把整台机器挂上去，哪怕只听 127.0.0.1。
 *  2. **会写库的单独标出来**（`writes`），前端要二次确认。
 *     「机器不碰 atlas.json」那条纪律管的是无人值守的 tick，
 *     人在这里点写回是人自己的判断 —— 但必须点得明明白白，不能顺手点掉。
 *  3. **后台跑 + 轮询**，不是同步等。教程外链那一支要查两百多条，
 *     同步请求会挂住浏览器，人只会以为审阅台坏了。
 */
const JOBS = {
  todo: { zh: "重算待办", cmd: ["node", "scripts/todo.mjs"], hint: "几秒" },
  fresh: {
    zh: "重跑保鲜巡检", cmd: ["node", "scripts/fresh.mjs"],
    hint: "十几分钟，要查两百多条外链", why: "仓库数字 / README 口径 / 外链，三样一起查",
  },
  "fresh:repos": { zh: "只查仓库数字", cmd: ["node", "scripts/fresh.mjs", "repos"], hint: "一两分钟" },
  "fresh:readme": { zh: "只查 README 漂移", cmd: ["node", "scripts/fresh.mjs", "readme"], hint: "几分钟" },
  "fresh:links": { zh: "只查外链", cmd: ["node", "scripts/fresh.mjs", "links"], hint: "十几分钟" },
  watch: { zh: "抓到期的源", cmd: ["node", "scripts/watch.mjs", "--due"], hint: "看当天到期几个" },
  requote: { zh: "重算引文回查", cmd: ["node", "scripts/requote.mjs", "--report"], hint: "一两分钟" },
  lineage: { zh: "重扫谱系候选", cmd: ["node", "scripts/hf-lineage.mjs", "--json"], hint: "一两分钟" },
  candidates: { zh: "重算收录候选", cmd: ["node", "scripts/candidates.mjs"], hint: "一两分钟" },
  validate: { zh: "跑一遍数据校验", cmd: ["node", "scripts/validate.mjs"], hint: "几秒" },
  alert: {
    zh: "重算快讯横幅", cmd: ["node", "scripts/alert.mjs"], hint: "几秒",
    why: "按 `alert.until` 重新挑一遍在架的快讯，写 `data/alerts.json`。**过期的会自己下架** —— " +
      "这一支不推送，只算横幅。",
  },
  "alert:push": {
    zh: "把快讯推到飞书", cmd: ["node", "scripts/alert.mjs", "--push"],
    writes: true, hint: "几秒",
    why: "**这一支会往群里发消息，发出去收不回。** 只推没推过的（台账在 `data/alert-sent.json`），" +
      "所以重复点不会重复发；但一条内容写错的快讯推出去就是错的。先在「重算快讯横幅」里看一眼文案。",
  },
  "repos:write": {
    zh: "把仓库数字写回 atlas.json", cmd: ["node", "scripts/refresh-repos.mjs"],
    writes: true, hint: "一两分钟",
    why: "**这一支会改 atlas.json。** 先看过保鲜巡检里「会改变结论的变化」那几条再点 —— " +
      "星数变了只是数字，「停更 12 个月」跨线会让卡上的标签和判断一起变成假话。",
  },
};

/** 报告类文件：只读、白名单。**不接受任意路径** —— 这支进程读得到整个仓库。 */
const DOCS = {
  "TODO.md": "data/TODO.md",
  "fresh-report.md": "data/fresh-report.md",
  "watch-report.md": "data/watch-report.md",
  "requote-report.md": "data/requote-report.md",
  "candidates.md": "data/candidates.md",
};

/**
 * 子进程的环境。**照抄 `tick.sh` 的三件事**：代理、PATH、`.env`。
 *
 * 手动开的审阅台继承的是登录 shell，看着好像什么都有 —— 但 `.env` 里的密钥
 * 从来不在 shell 环境里（那是 tick.sh 每次 source 进来的）。不补这一段，
 * 从审阅台点出去的活会和定时跑的**行为不一样**，而且是静默地不一样。
 *
 * ⚠️ 解析出来的值只往子进程传，**任何情况下不打印**。
 */
function childEnv() {
  const env = { ...process.env };
  env.HTTPS_PROXY ??= "http://127.0.0.1:7890";
  env.HTTP_PROXY ??= env.HTTPS_PROXY;
  env.PATH = `/opt/homebrew/bin:/usr/local/bin:${env.PATH ?? ""}`;
  const f = join(ROOT, ".env");
  if (existsSync(f))
    for (const line of readFileSync(f, "utf8").split("\n")) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (m) env[m[1]] = m[2].trim().replace(/^(['"])(.*)\1$/, "$2");
    }
  return env;
}

/** 跑过的活。**留在内存里就够** —— 关掉审阅台等于这一轮结束，结论都在报告文件里。 */
const runs = new Map();
let runSeq = 0;

function startJob(key) {
  const j = JOBS[key];
  if (!j) return { error: "没有这个活" };
  /** 同一个活不许并行 —— 两个 fresh 一起跑会互相覆盖报告文件。 */
  for (const r of runs.values()) if (r.key === key && r.running) return { error: `「${j.zh}」正在跑`, id: r.id };
  const id = `r${++runSeq}`;
  const rec = { id, key, zh: j.zh, running: true, out: "", exit: null, at: new Date().toISOString().slice(11, 16) };
  runs.set(id, rec);
  const ch = spawn(j.cmd[0], j.cmd.slice(1), { cwd: ROOT, env: childEnv() });
  const push = (b) => {
    rec.out += b.toString();
    /** 输出可能很长（外链那支两百多行），只留尾部够看结论。 */
    if (rec.out.length > 200_000) rec.out = `…（前面省略）\n${rec.out.slice(-160_000)}`;
  };
  ch.stdout.on("data", push);
  ch.stderr.on("data", push);
  ch.on("close", (code) => { rec.running = false; rec.exit = code; });
  ch.on("error", (e) => { rec.running = false; rec.exit = -1; rec.out += `\n跑不起来：${e.code ?? e.message}\n`; });
  return { id };
}

/**
 * ⚠️ **页面脚本里不要拼 onclick 字符串。**
 *
 * 2026-08-15 加引文回查标签页时，第一版把 `rqDo('id','action')` 拼进 onclick 属性，
 * 而 id 形如 `vidu-up|vidu-q × flf` —— 嵌套引号一层套一层，浏览器直接
 * `missing ) after argument list`，**整段脚本没跑起来**：卡片数显示 0、连标签切换都失效。
 * **「0 条」看起来很像「没数据」** —— 又一次静默出错值。改成 data 属性 + 事件委托。
 *
 * ⚠️ 而且这一段是写在模板字符串 `PAGE` 里的：**注释里带反引号会把模板提前结束**，
 * 我紧接着又栽了一次（`node --check` 一跑就现形）。**改完这个文件必过 `node --check`。**
 */
const PAGE = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>虾米看AI · 本机审阅台</title>
<style>
 :root{--ink:#16212c;--muted:#647587;--rule:#e2e6ec;--brand:#0c9488;--brand-ink:#097067;--no:#c0392b;--card:#fff;--paper:#fff}
 *{box-sizing:border-box}
 body{margin:0;background:var(--paper);color:var(--ink);
   font:15px/1.6 -apple-system,"PingFang SC","Microsoft YaHei",system-ui,sans-serif}
 header{border-bottom:2.5px solid var(--ink);padding:18px 24px 12px;position:sticky;top:0;background:var(--paper);z-index:2}
 h1{font-size:24px;margin:0 0 4px;letter-spacing:-.01em}
 .sub{color:var(--muted);font-size:13px}
 main{padding:16px 24px 60px;max-width:1080px}
 .todo{border:1px solid var(--rule);border-radius:12px;padding:12px 14px;margin:14px 0;font-size:13.5px;color:var(--muted)}
 .todo b{color:var(--ink)}
 .item{border:1px solid var(--rule);border-radius:12px;padding:14px;margin:10px 0;background:var(--card)}
 .row{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}
 .tag{font-size:11px;padding:2px 7px;border-radius:6px}
 .land{background:rgba(12,148,136,.1);color:var(--brand-ink)}
 .miss{background:rgba(192,57,43,.08);color:var(--no)}
 .claim{font-size:15.5px;font-weight:600;margin:8px 0 4px}
 .quote{color:var(--muted);font-size:13px;border-left:2px solid var(--rule);padding-left:10px;margin:6px 0}
 .meta{color:var(--muted);font-size:12.5px}
 .acts{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center}
 button{font:inherit;font-size:13.5px;border:1px solid var(--rule);background:#fff;color:var(--ink);
   border-radius:8px;padding:6px 13px;cursor:pointer}
 button.pass{border-color:var(--brand);color:var(--brand-ink);font-weight:600}
 button.rej{border-color:var(--no);color:var(--no)}
 button:disabled{opacity:.45;cursor:default}
 input{font:inherit;font-size:13.5px;border:1px solid var(--rule);border-radius:8px;padding:6px 10px;flex:1;min-width:200px}
 .done{color:var(--brand-ink);font-size:13px}
 .empty{color:var(--muted);padding:30px 0}
 .pile{border:1px solid var(--rule);border-left:3px solid var(--brand);border-radius:10px;padding:12px 14px;margin:10px 0;background:var(--card)}
 .pile h3{font-size:15px;margin:0 0 6px}
 .pile .why{color:var(--muted);font-size:13px;margin:0 0 6px}
 .pile .how{font-size:12.5px;color:#4a5866;background:#f6f7f8;padding:6px 9px;border-radius:6px}
 .n{display:inline-block;min-width:22px;text-align:center;background:var(--ink);color:#fff;
   border-radius:6px;font-size:12px;padding:1px 6px;margin-right:7px;font-variant-numeric:tabular-nums}
 .runs{border:1px solid var(--rule);border-radius:10px;padding:12px 14px;margin:16px 0;background:var(--card)}
 .runs h3{font-size:14px;margin:0 0 8px}
 button.warn{border-color:#b0670a;color:#8a5108}
 pre.log{background:#11181f;color:#d6e0ea;border-radius:8px;padding:10px 12px;overflow:auto;
   max-height:340px;font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;margin:8px 0 0;white-space:pre-wrap}
 .spin{color:var(--brand-ink);font-size:12.5px}
 details.doc{border:1px solid var(--rule);border-radius:10px;padding:8px 12px;margin:8px 0;background:var(--card)}
 details.doc summary{cursor:pointer;font-size:13.5px}
 details.doc pre{white-space:pre-wrap;font:12.5px/1.6 ui-monospace,Menlo,monospace;color:#33404d;
   max-height:460px;overflow:auto;margin:8px 0 0}
</style></head><body>
<header>
  <h1>虾米看AI · 本机审阅台</h1>
  <div class="sub" id="sub">读取中…</div>
</header>
<main>
  <div id="tabs" style="display:flex;gap:8px;margin-bottom:16px">
    <button id="tab-todo" class="pass">待办 <span id="td-n"></span></button>
    <button id="tab-inbox">收件箱 <span id="ib-n"></span></button>
    <button id="tab-rq">引文回查 <span id="rq-n"></span></button>
    <button id="tab-git">改了什么 <span id="gt-n"></span></button>
  </div>
  <div id="pane-todo">
    <div id="td-body" class="empty">算待办中…</div>
    <!-- 跑起来的活单独放在这儿：上面那块会随刷新整片重画，日志不能跟着没。 -->
    <div class="runs" id="runbox" hidden>
      <h3 id="run-h"></h3>
      <pre class="log" id="run-out"></pre>
    </div>
  </div>
  <div id="pane-inbox" hidden>
    <div class="todo" id="todo"></div>
    <div id="list"></div>
  </div>
  <div id="pane-rq" hidden></div>
  <div id="pane-git" hidden>
    <p class="hint">改动是台上这些活攒出来的。<b>勾上要提交的，写一句话，一次提交。</b>
      逐个勾，<b>没有「全选」</b> —— 这一页的纪律是绝不提交不是自己改的东西，而全选按钮天生和它对着干。
      <b>只提交，不推送</b>：上线是另一件事，不该藏在这个按钮后面。</p>
    <div id="gt-body" class="empty">读取中…</div>
    <div id="gt-form" hidden style="margin-top:14px">
      <textarea id="gt-msg" rows="4" placeholder="这次改了什么、为什么" style="width:100%;font:inherit;padding:8px"></textarea>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
        <button id="gt-do" class="warn">提交勾中的 <span id="gt-k">0</span> 个</button>
        <button id="gt-reload">重新读一遍</button>
      </div>
    </div>
    <pre class="log" id="gt-out" hidden></pre>
  </div>
</main>
<script>
const $=s=>document.querySelector(s);
let who=localStorage.getItem('atlas-who')||'';
if(!who){who=prompt('你是谁？（会记进人审流水，用于日后追溯）')||'unknown';localStorage.setItem('atlas-who',who);}

function esc(s){return String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));}

/* ── 引文回查那一摞 ────────────────────────────────────────────
 * 和收件箱**不共用一套按钮**：那边是「这条事实对不对」二选一，
 * 这边是「这句引文该归到哪」三选一，而且落点在三个不同文件上。
 * 每条都把**锚**印出来 —— 多数「找不到」其实是锚提取误伤
 * （我们自己写的参数罗列被当成了厂商原句），一眼就能认出来。
 */
const RQ_KIND_HELP={
 '本页没有·别处有':'这句话在别的快照里找得到。<b>两种成因要分</b>：真署错了页 / 这一页的快照是残的（抓回来的是导航不是正文）。',
 '找不到':'全站快照都没这句。<b>先看锚像不像厂商原句</b> —— 如果是我们自己写的参数罗列（带斜杠那种），那不是错，选「认了」。',
 '快照无正文':'这个源盯的是元数据接口（只有 items 没正文），引文来自模型卡/README。<b>该换抓法</b>，不是改署名。',
};
let RQ=[];
async function loadRq(){
  RQ=await fetch('/api/requote').then(r=>r.json());
  $('#rq-n').textContent=RQ.total?'('+RQ.total+')':'';
  const byKind={};for(const it of RQ.items)(byKind[it.kind]??=[]).push(it);
  $('#pane-rq').innerHTML = !RQ.total
    ? '<div class="empty"><b>回查没有待判的。</b>这一摞由 <code>requote.mjs</code> 每天随 tick 重算。</div>'
    : Object.entries(byKind).map(([k,v])=>
        '<h2 style="font-size:15px;margin:18px 0 6px">'+esc(k)+' <span style="color:#888;font-weight:400">'+v.length+' 条</span></h2>'
        +'<div class="todo" style="margin-bottom:10px">'+RQ_KIND_HELP[k]+'</div>'
        +v.map(rqCard).join('')
      ).join('');
}
function rqCard(it){
  const alt=it.elsewhere.map(e=>
    '<button data-act="repoint" data-to="'+esc(e)+'">改署名到 '+esc(e)+'</button>').join(' ');
  return '<article data-rq="'+esc(it.id)+'">'
    +'<div style="font-size:12px;color:#888">'+esc(it.src)+'</div>'
    +'<div style="font-weight:600;margin:2px 0 6px">'+esc(it.at)+'</div>'
    +(it.anchor?'<div class="anchor" style="font-size:12.5px;color:#555;background:#f6f7f8;padding:6px 9px;border-radius:6px;margin-bottom:8px">锚：'+esc(it.anchor)+'</div>':'')
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">'
    + alt
    +'<button data-act="refetch">换这个源的抓法…</button>'
    +'<button data-act="accept">认了：不是逐字原文</button>'
    +'</div><div class="done" hidden></div></article>';
}
$('#pane-rq').addEventListener('click',async e=>{
  const btn=e.target.closest('button[data-act]'); if(!btn) return;
  const card=btn.closest('[data-rq]'), id=card.dataset.rq, action=btn.dataset.act;
  let to=btn.dataset.to||'';
  if(action==='refetch'){ to=prompt('新的抓取地址（要能抓到我们引的那句话）')||''; if(!to) return; }
  const why=prompt('为什么这么判？（会记进人审流水）')??'';
  card.querySelectorAll('button').forEach(b=>b.disabled=true);
  const r=await fetch('/api/requote/decide',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({id,action,to,why,who})}).then(r=>r.json());
  const d=card.querySelector('.done'); d.hidden=false;
  d.textContent=r.ok?'已处理并提交':'失败：'+(r.error||'');
  if(!r.ok) card.querySelectorAll('button').forEach(b=>b.disabled=false);
  else setTimeout(loadRq,600);
});

/* ── 待办总览：这一页就是那「一个地方」 ──────────────────────────
 *
 * 负责人 2026-08-18：「所有的操作，我只从本地审阅台一个地方处理。」
 *
 * 在那之前，待办通知里每摞后面跟一条不同的命令 —— 七摞七条。
 * 人不会每天开七次终端，于是通知照发、待办照攒。
 * 所以这一页要同时干三件事：**看见每一摞、点得动每一支脚本、翻得开每一份报告**。
 *
 * 注意这段是写在服务端的模板字符串里的：**反斜杠要写两遍**
 * （源码里的 \\* 到了页面上才是 \*），反引号一律用 \\x60 绕开。
 * 文件头那条「改完必过 node --check」在这儿还不够 —— 转义错了语法照样是对的，
 * 只是正则悄悄变成另一个意思，所以这一页必须真在浏览器里打开看过。
 */
function md(s){return esc(s)
  .replace(/\\*\\*(.+?)\\*\\*/g,'<b>$1</b>')
  .replace(/\\x60([^\\x60]+)\\x60/g,'<code>$1</code>');}

let TD=null;
async function loadTodo(){
  const r=await fetch('/api/todo').then(x=>x.json()).catch(e=>({error:String(e)}));
  if(r.error){$('#td-body').innerHTML='<div class="empty"><b>待办算不出来。</b><br>'+esc(r.error)+'</div>';return;}
  TD=r;
  $('#td-n').textContent=r.total?'('+r.total+')':'';
  const piles=r.groups.length
    ? r.groups.map(g=>'<div class="pile"><h3><span class="n">'+g.n+'</span>'+esc(g.t)+'</h3>'
        +'<p class="why">'+md(g.why||'')+'</p><div class="how">→ '+md(g.how||'')+'</div></div>').join('')
    : '<div class="empty"><b>没有待办。</b>这和「今天没跑」不是一回事 —— 这一摞是 '+esc(r.at)+' 现算的。</div>';
  const jobs=r.jobs.map(j=>'<button data-job="'+esc(j.key)+'"'+(j.writes?' class="warn"':'')+'>'
      +esc(j.zh)+(j.hint?'<span style="color:#8a97a5;font-weight:400"> · '+esc(j.hint)+'</span>':'')+'</button>').join(' ');
  const docs=r.docs.map(d=>'<details class="doc" data-doc="'+esc(d)+'"><summary>'+esc(d)+'</summary><pre>点开读取…</pre></details>').join('');
  $('#td-body').innerHTML=piles
    +'<div class="runs"><h3>在这儿跑</h3>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap">'+jobs+'</div>'
    +'<p class="why" style="margin:10px 0 0;color:#647587;font-size:12.5px">'
    +'橙色那个会改 <code>atlas.json</code>，点了要确认。其余只出报告，不动数据。</p></div>'
    +'<h2 style="font-size:15px;margin:20px 0 6px">报告原文</h2>'+docs;
}

/* 报告点开才读 —— 有几份是几千行，一进页面全拉回来会卡住。 */
$('#pane-todo').addEventListener('click',async e=>{
  const s=e.target.closest('summary');
  if(s&&s.parentElement.classList.contains('doc')){
    const d=s.parentElement;
    if(d.dataset.loaded) return;
    d.dataset.loaded='1';
    const j=await fetch('/api/doc?name='+encodeURIComponent(d.dataset.doc)).then(x=>x.json());
    d.querySelector('pre').textContent=j.missing?'（还没有这份报告 —— 跑一次上面对应的活就有了）':(j.text||j.error||'');
    return;
  }
  const b=e.target.closest('button[data-job]');
  if(!b) return;
  const j=TD.jobs.find(x=>x.key===b.dataset.job);
  /**
   * 会写库的必须二次确认。「机器不碰 atlas.json」那条纪律管的是无人值守的定时跑；
   * 人在这里点写回是人自己的判断 —— 但要点得明明白白，不能和「出份报告」混在一排里顺手点掉。
   */
  if(j&&j.writes&&!confirm('「'+j.zh+'」会改 atlas.json（改完记得看 git diff 再上线）。确定跑？')) return;
  document.querySelectorAll('#td-body button[data-job]').forEach(x=>x.disabled=true);
  const r=await fetch('/api/run',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({job:b.dataset.job})}).then(x=>x.json());
  if(!r.id){alert(r.error||'起不来');document.querySelectorAll('#td-body button[data-job]').forEach(x=>x.disabled=false);return;}
  $('#runbox').hidden=false;
  poll(r.id);
});

async function poll(id){
  const r=await fetch('/api/run?id='+id).then(x=>x.json());
  $('#run-h').textContent=r.zh+(r.running?'　跑着…（'+r.at+' 起）':'　结束，退出码 '+r.exit);
  const pre=$('#run-out'), 贴底=pre.scrollHeight-pre.scrollTop-pre.clientHeight<40;
  pre.textContent=r.out||'（还没有输出）';
  if(贴底) pre.scrollTop=pre.scrollHeight;
  if(r.running){setTimeout(()=>poll(id),1200);return;}
  document.querySelectorAll('#td-body button[data-job]').forEach(x=>x.disabled=false);
  /** 跑完把摞重算一遍 —— 不然刚处理掉的东西还在页面上挂着。 */
  loadTodo();
}

function show(name){
  for(const k of ['todo','inbox','rq','git']){
    $('#pane-'+k).hidden = k!==name;
    $('#tab-'+k).className = k===name?'pass':'';
  }
  if(name==='rq') loadRq();
  if(name==='todo') loadTodo();
  if(name==='git') loadGit();
}
$('#tab-todo').onclick=()=>show('todo');
$('#tab-inbox').onclick=()=>show('inbox');
$('#tab-rq').onclick=()=>show('rq');
$('#tab-git').onclick=()=>show('git');

/* ── 改了什么 ─────────────────────────────────────────────────
 * 审阅台原来没有提交的出口：台上的活都会改文件，而唯一会提交的是 tick.sh，
 * 且它只提交自己那几份。于是点完一圈，工作区就一直脏着。
 * 这一栏补的就是最后一步 —— 多选、一次提交、只提交、不推送。 */
async function loadGit(){
  const r=await fetch('/api/changed').then(x=>x.json()).catch(e=>({error:String(e)}));
  const box=$('#gt-body');
  if(r.error){ box.className=''; box.innerHTML='<p>读不到：'+esc(r.error)+'</p>'; return; }
  $('#gt-n').textContent=r.files.length?r.files.length:'';
  if(!r.files.length){ box.className='empty'; box.textContent='工作区是干净的，没有要提交的。'; $('#gt-form').hidden=true; return; }
  box.className='';
  box.innerHTML=r.files.map(function(f){
    var num = f.untracked ? '新文件' : (f.add===null?'':('+'+f.add+' -'+f.del));
    return '<label style="display:flex;gap:8px;align-items:baseline;padding:5px 0;border-bottom:1px solid #e6e1d8">'
      +'<input type="checkbox" class="gt-c" data-p="'+esc(f.path)+'">'
      +'<code style="flex:1">'+esc(f.path)+'</code>'
      +'<span class="tag">'+esc(f.code)+'</span>'
      +'<span style="min-width:92px;text-align:right;opacity:.65">'+esc(num)+'</span></label>';
  }).join('');
  $('#gt-form').hidden=false;
  for(const c of document.querySelectorAll('.gt-c')) c.onchange=countGit;
  countGit();
}
function countGit(){
  var n=document.querySelectorAll('.gt-c:checked').length;
  $('#gt-k').textContent=n;
  $('#gt-do').disabled = n===0;
}
$('#gt-reload').onclick=loadGit;
$('#gt-do').onclick=async function(){
  var files=Array.from(document.querySelectorAll('.gt-c:checked')).map(function(c){return c.dataset.p});
  var msg=$('#gt-msg').value.trim();
  if(!files.length) return;
  if(!msg){ alert('要写提交信息'); return; }
  if(!confirm('提交这 '+files.length+' 个文件？' + String.fromCharCode(10,10) + files.join(String.fromCharCode(10)))) return;
  $('#gt-do').disabled=true;
  const r=await fetch('/api/commit',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({files:files,message:msg})}).then(x=>x.json()).catch(e=>({error:String(e)}));
  const out=$('#gt-out'); out.hidden=false;
  out.textContent = r.error ? ('提交失败：' + String.fromCharCode(10) + r.error)
    : ('已提交 '+r.n+' 个文件' + String.fromCharCode(10) + r.head + String.fromCharCode(10,10) + (r.out||''));
  if(!r.error){ $('#gt-msg').value=''; loadGit(); }
  $('#gt-do').disabled=false;
};

async function load(){
  const r=await fetch('/api/queue').then(r=>r.json());
  $('#ib-n').textContent=r.total?'('+r.total+')':'';
  $('#sub').textContent=\`收件箱待审 \${r.total} 条 · 能直接落格 \${r.landable} 条 · 审阅人 \${who}\`;
  /**
   * 这里原来印的是「下面这几摞不在这里审」。**那句话现在过时了** ——
   * 它们全在「待办」页上，连带那一页还能直接把对应的脚本跑起来。
   * 留着会把人又推回终端，正是这一版要消掉的东西。
   */
  $('#todo').innerHTML=(r.others&&r.others.length)
    ? '这一页只判收件箱。其余 <b>'+r.others.length+' 摞</b>在「待办」页上，那边能看能跑。'
    : '';
  if(!r.items.length){
    $('#list').innerHTML='<div class="empty">'
      +'<b>收件箱里没有待审的。</b>注意这和「今天没跑」不是一回事。<br>'
      +((r.others&&r.others.length)
        ? '通知里那几十条<b>不是这一摞</b> —— 去「待办」页，它们在那儿，能看也能跑。'
        : '')
      +'</div>';
    return;
  }
  $('#list').innerHTML=r.items.map(it=>\`
    <div class="item" id="i-\${btoa(unescape(encodeURIComponent(it.id))).replace(/=/g,'')}">
      <div class="row">
        \${it.landable
          ? '<span class="tag land">能直接落格 → '+esc(it.model)+' × '+esc(it.capability)+'</span>'
          : '<span class="tag miss">缺：'+esc(it.missing.join('；'))+'</span>'}
        <span class="meta">\${esc(it.source)}（\${esc(it.tier)} 级）· \${esc(it.day)} · \${esc(it.kind)}</span>
      </div>
      <div class="claim">\${esc(it.claim)}</div>
      <div class="quote">原文：\${esc(it.quote)}</div>
      <div class="acts">
        <button class="pass" data-id="\${esc(it.id)}" data-v="pass">\${it.landable?'通过':'通过 · 记成采集单'}</button>
        <button class="rej"  data-id="\${esc(it.id)}" data-v="reject">不通过</button>
        <input placeholder="不通过必须写理由" data-why="\${esc(it.id)}">
      </div>
    </div>\`).join('');
}

document.addEventListener('click',async e=>{
  const b=e.target.closest('button[data-v]'); if(!b)return;
  const id=b.dataset.id, verdict=b.dataset.v;
  const why=document.querySelector(\`input[data-why="\${CSS.escape(id)}"]\`)?.value||'';
  if(verdict==='reject'&&!why.trim()){alert('不通过必须写理由 —— 一条没有理由的否决等于没记');return;}
  b.closest('.acts').querySelectorAll('button').forEach(x=>x.disabled=true);
  const r=await fetch('/api/decide',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({id,verdict,why,who})}).then(r=>r.json());
  const box=b.closest('.item');
  if(r.error||r.ok===false){
    box.querySelector('.acts').insertAdjacentHTML('beforeend','<span class="meta">'+esc(r.error||r.msg)+'</span>');
    b.closest('.acts').querySelectorAll('button').forEach(x=>x.disabled=false);
    return;
  }
  const said={
    wrote:'已写入 '+r.cell+'，并提交',
    pending:'已记成采集单：还缺 '+(r.missing||[]).join('；'),
    reject:'已记进否决账',
    duplicate:'库里已有同样结论（'+r.cell+'）—— 记为重复，没动数据',
    conflict:'⚠ 与已有结论相反（库里是「'+r.existing+'」）—— 进冲突台账，等人裁决',
  }[r.kind]||'已处理';
  box.querySelector('.acts').outerHTML='<div class="done">✓ '+esc(said)+'</div>';
});

loadTodo();load();loadRq();
</script></body></html>`;

createServer(async (req, res) => {
  const path = req.url.split("?")[0];

  if (path === "/" || path === "/index.html") {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    return res.end(PAGE);
  }

  /**
   * 待办总览。**每次现算，不吃模块缓存** —— 所以是另起进程跑 `todo.mjs --json`，
   * 不是 `import`。刚在这个页面上跑完一支巡检、点刷新却看见旧数，
   * 比不刷新更能骗人。
   */
  if (path === "/api/todo") {
    return execFile("node", ["scripts/todo.mjs", "--json"], { cwd: ROOT, env: childEnv(), maxBuffer: 8 << 20 },
      (err, stdout) => {
        if (err) return json(res, 500, { error: `待办算不出来：${String(err.message).slice(0, 300)}` });
        try {
          /** `--json` 是最后一行 —— 前面可能有子模块打的进度。 */
          const t = JSON.parse(stdout.trim().split("\n").pop());
          const docs = Object.keys(DOCS).filter((k) => existsSync(join(ROOT, DOCS[k])));
          const jobs = Object.entries(JOBS).map(([k, v]) => ({ key: k, ...v, cmd: v.cmd.join(" ") }));
          return json(res, 200, { ...t, docs, jobs });
        } catch (e) { return json(res, 500, { error: `待办输出读不动：${String(e.message)}` }); }
      });
  }

  if (path === "/api/run" && req.method === "POST") {
    let raw = "";
    for await (const c of req) raw += c;
    try {
      const { job } = JSON.parse(raw || "{}");
      const r = startJob(job);
      return json(res, r.error && !r.id ? 400 : 200, r);
    } catch (e) { return json(res, 400, { error: String(e.message) }); }
  }

  if (path === "/api/run") {
    const id = new URL(req.url, "http://x").searchParams.get("id");
    const r = runs.get(id);
    if (!r) return json(res, 404, { error: "没有这次运行" });
    return json(res, 200, r);
  }

  if (path === "/api/doc") {
    const name = new URL(req.url, "http://x").searchParams.get("name");
    const rel = DOCS[name];
    if (!rel) return json(res, 400, { error: "不在白名单里" });
    const f = join(ROOT, rel);
    if (!existsSync(f)) return json(res, 200, { name, text: "", missing: true });
    return json(res, 200, { name, path: rel, text: readFileSync(f, "utf8") });
  }

  if (path === "/api/queue") {
    try {
      const q = queue();
      /**
       * 另外几摞待办也带上。**但光带标题不够 —— 那正是这一版要修的。**
       *
       * 负责人 2026-08-13 收到通知说「46 条待办 …… 必须人工」，
       * 打开审阅台看到的是空的：那 46 条是谱系候选与收录候选，
       * **审阅台压根不管这两摞**（它只读 `data/inbox`）。
       * 页面上原来只印了一行标题、没说去哪儿办 ——
       * 于是人到了一个空页面，只能怀疑是不是站坏了。
       *
       * 这个文件顶上写着「审阅台就是本机唯一的入口」，**那是它自己许下却没兑现的承诺**。
       * 现在把 TODO.md 里每一摞的「→ 下一步该跑什么」一起读出来，成对给前端。
       */
      const todoFile = join(ROOT, "data/TODO.md");
      const others = [];
      if (existsSync(todoFile)) {
        const lines = readFileSync(todoFile, "utf8").split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (!lines[i].startsWith("## ") || lines[i].includes("收件箱")) continue;
          const title = lines[i].replace(/^##\s*/, "");
          // 下一步就在这一节里以 `→ ` 打头的那一行
          let how = "";
          for (let j = i + 1; j < lines.length && !lines[j].startsWith("## "); j++)
            if (lines[j].startsWith("→ ")) { how = lines[j].slice(2).trim(); break; }
          others.push({ title, how });
        }
      }
      return json(res, 200, {
        total: q.length, landable: q.filter((x) => x.landable).length, items: q,
        todo: others.map((o) => o.title).join("；"),   // 兼容旧字段
        others,
      });
    } catch (e) { return json(res, 500, { error: String(e.message) }); }
  }

  if (path === "/api/requote") {
    const items = requoteQueue();
    return json(res, 200, { total: items.length, items });
  }

  if (path === "/api/requote/decide" && req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try { json(res, 200, requoteDecide(JSON.parse(body))); }
      catch (e) { json(res, 200, { ok: false, error: String(e.message) }); }
    });
    return;
  }

  if (path === "/api/decide" && req.method === "POST") {
    let raw = "";
    for await (const c of req) raw += c;
    try {
      const { id, verdict, why, who } = JSON.parse(raw || "{}");
      if (!id || !["pass", "reject"].includes(verdict))
        return json(res, 400, { error: "要有 id，verdict 只能是 pass 或 reject" });
      // 否决必须写理由 —— **一条没有理由的否决，等于没记**
      if (verdict === "reject" && !String(why ?? "").trim())
        return json(res, 400, { error: "否决必须写理由" });
      return json(res, 200, decide({ id, verdict, why: why ?? "", who: who ?? "local" }));
    } catch (e) { return json(res, 500, { error: String(e.message) }); }
  }

  /**
   * 改了什么 —— **审阅台原来没有提交的出口。**
   *
   * 台上那些活（写回仓库数字、重算待办、重跑巡检）都会改文件，
   * 而唯一会提交的是 `tick.sh` 里那两处，且**只提交它自己那几份**。
   * 于是人在台上点了一圈之后，工作区就一直脏着 ——
   * 2026-08-19 就是这样：`atlas.json`、`fresh.json`、`fresh-report.md` 三份挂了一天。
   * 这不是用的人做错了，是这一页少了最后一步。
   */
  if (path === "/api/changed") {
    try {
      const raw = execFileSync("git", ["-c", "core.quotepath=false", "status", "--porcelain"],
        { cwd: ROOT, encoding: "utf8" });
      const files = raw.split("\n").filter(Boolean).map((line) => {
        const code = line.slice(0, 2);
        const f = line.slice(3);
        /** 数字是给人做判断用的：改了三行还是三百行，决定要不要先看一眼 diff。 */
        let add = null, del = null;
        if (code !== "??") {
          const st = execFileSync("git", ["diff", "HEAD", "--numstat", "--", f],
            { cwd: ROOT, encoding: "utf8" }).trim().split("\t");
          if (st.length >= 2) { add = Number(st[0]); del = Number(st[1]); }
        }
        return { path: f, code: code.trim() || "?", untracked: code === "??", add, del };
      });
      return json(res, 200, { files });
    } catch (e) { return json(res, 500, { error: String(e.message) }); }
  }

  if (path === "/api/commit" && req.method === "POST") {
    let raw = "";
    for await (const c of req) raw += c;
    try {
      const { files, message } = JSON.parse(raw || "{}");
      if (!Array.isArray(files) || !files.length) return json(res, 400, { error: "一个文件都没选" });
      if (!String(message ?? "").trim()) return json(res, 400, { error: "要写提交信息" });
      /**
       * ⚠️ **只允许提交此刻真的有改动的路径。**
       *
       * 这支进程读写得到整个仓库。不校验的话，前端传什么就 `git add` 什么 ——
       * 那等于开了一个「把任意路径加进暂存区」的口子，哪怕它只听 127.0.0.1。
       * 校验的另一半好处：前端拿到列表之后有人在别处改了文件，这里会当场拦下来，
       * 而不是把一份没人看过的改动一起提交上去。
       */
      const now = new Set(execFileSync("git", ["-c", "core.quotepath=false", "status", "--porcelain"],
        { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean).map((l) => l.slice(3)));
      const bad = files.filter((f) => !now.has(f));
      if (bad.length) return json(res, 409, { error: `这几个现在没有改动（列表旧了，刷新一下）：${bad.join("、")}` });

      /**
       * **逐路径 `git add`，永远不用 `-A`。**
       * 「绝不提交不是我改的代码」这条纪律，只有在这里落成代码才算数。
       */
      execFileSync("git", ["add", "--", ...files], { cwd: ROOT });
      /**
       * **不覆盖 author。** `tick.sh` 里那两处署的是 `atlas-watch[bot]`，
       * 为的就是在 `git log` 里和人工提交一眼分得开 —— 人在台上点的这一次是人工提交，
       * 署名就该是仓库默认的那个人。
       */
      const out = execFileSync("git", ["commit", "-m", String(message).trim()],
        { cwd: ROOT, encoding: "utf8" });
      const head = execFileSync("git", ["log", "-1", "--pretty=%h %s"], { cwd: ROOT, encoding: "utf8" }).trim();
      /** **不 push。** 上线是另一件事，不该藏在「提交」这个按钮后面。 */
      return json(res, 200, { ok: true, head, out: out.slice(-1500), n: files.length });
    } catch (e) {
      const msg = `${e.stdout ?? ""}${e.stderr ?? ""}` || String(e.message);
      return json(res, 500, { error: msg.slice(-1500) });
    }
  }

  json(res, 404, { error: "没有这个接口" });
})
  /**
   * 端口被占**多半是它自己已经开着**（launchd 那支，或者另一个终端里跑的）。
   * 默认的 EADDRINUSE 会甩一整段 node 堆栈出来，读起来像「审阅台坏了」——
   * 而正确的反应恰恰是「不用开了，直接去那个地址」。
   */
  .on("error", (e) => {
    if (e.code !== "EADDRINUSE") throw e;
    console.error(`${PORT} 端口已经有人在听了 —— 多半审阅台本来就开着。`);
    console.error(`直接去 http://${HOST}:${PORT}`);
    console.error(`要确认是谁：lsof -nP -iTCP:${PORT} | grep LISTEN`);
    console.error(`要重开一个：launchctl kickstart -k gui/$(id -u)/com.xiamimate.atlas-station`);
    process.exit(1);
  })
  .listen(PORT, HOST, () => {
    console.log(`本机审阅台：http://${HOST}:${PORT}`);
    console.log("只听 127.0.0.1 —— 它能写 atlas.json 并提交 git。");
  });
