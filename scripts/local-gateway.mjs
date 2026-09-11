/**
 * 本机复现线上的单域名分流。
 *
 * ## 为什么需要它
 *
 * 线上只有 `xiamimate.com` 一个域名，主站与 `/atlas` 是**同源**的：
 * 主站在根上，能力地图在 `/atlas/*`，平台页眉制品在 `/chrome/*`。
 * 而本机是两个各跑各的 dev server（主站 :3000、本仓 :3400），
 * **`:3000/atlas` 必然 404，`:3400` 又拿不到 `/chrome`** ——
 * 于是「并入」这件事在本地根本看不见，只有部署后才暴露，
 * 而暴露的方式通常是「点进去一片空白」。
 *
 * 这个网关把线上那套规则原样搬到 :8080，规则与 `deploy/caddy-snippet.conf`
 * 一一对应。**改一边要改另一边。**
 *
 * ## 用法
 *
 *   node scripts/local-gateway.mjs                     # 主站与本仓都用 dev server
 *   node scripts/local-gateway.mjs --atlas=static      # 本仓改用 out/（测将来跑的东西）
 *   node scripts/local-gateway.mjs --main=static       # 主站改用它的 out/
 *
 * 然后开 http://127.0.0.1:8080 —— 首页点「显示规划中」能看到虾米看AI，
 * 点进去是带平台页眉的 /atlas。
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = `${dirname(fileURLToPath(import.meta.url))}/..`;
const MAIN_REPO = join(ROOT, "..", "xiamimate-tools-frontend");

const arg = (k, d) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const PORT = Number(arg("port", 8080));
const ATLAS_MODE = arg("atlas", "dev");
const MAIN_MODE = arg("main", "dev");
const ATLAS_DEV = arg("atlas-dev", "http://127.0.0.1:3400");
const MAIN_DEV = arg("main-dev", "http://127.0.0.1:3000");

const ATLAS_OUT = join(ROOT, "out");
const MAIN_OUT = join(MAIN_REPO, "out");
const CHROME_DIR = join(MAIN_OUT, "chrome");

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".webp": "image/webp", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml" };

/** 静态目录。**带扩展名的资源不回退 index.html** —— 回退等于把 404 谎报成 200。 */
async function serveStatic(res, root, p, spa) {
  const asset = /\.[a-z0-9]+$/i.test(p) && !p.endsWith(".html");
  const cands = asset ? [p] : [p, `${p}/index.html`, `${p}.html`, spa];
  for (const c of cands) {
    if (!c) continue;
    const f = join(root, c);
    if (!f.startsWith(root) || !existsSync(f) || !extname(f)) continue;
    res.writeHead(200, { "content-type": MIME[extname(f)] ?? "application/octet-stream" });
    return res.end(await readFile(f));
  }
  res.writeHead(404).end("not found");
}

/** 透传到 dev server。**原样转发 path**：本仓 dev 自己带 basePath /atlas。 */
async function proxy(req, res, base, path) {
  try {
    const r = await fetch(base + path, {
      method: req.method,
      headers: { ...req.headers, host: new URL(base).host },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req,
      duplex: "half",
      redirect: "manual",
    });
    const h = Object.fromEntries(r.headers);
    delete h["content-encoding"];
    delete h["content-length"];
    res.writeHead(r.status, h);
    res.end(Buffer.from(await r.arrayBuffer()));
  } catch (e) {
    // 上游没起时说清楚是哪一条 —— 「一片空白」最难查的就是不知道谁没起
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(`gateway: upstream ${base} unreachable (${e.message})`);
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const p = decodeURIComponent(url.pathname);

  // ① /chrome/* —— 平台页眉制品，线上与主站同源。只有主站构建过才有。
  if (p.startsWith("/chrome/")) {
    if (!existsSync(CHROME_DIR)) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      return res.end("gateway: 主站还没构建，/chrome 制品不存在 —— 先在 xiamimate-tools-frontend 跑 npm run build");
    }
    return serveStatic(res, CHROME_DIR, p.slice("/chrome".length), null);
  }

  /**
   * ② /atlas → 308 /atlas/（caddy-snippet 的 @atlasRoot）。
   *
   * **只在静态模式下做。** dev 模式里 Next 自己拥有 basePath，会把 `/atlas/`
   * 规范化回 `/atlas` —— 两边各转一次就是无限循环，浏览器报
   * ERR_TOO_MANY_REDIRECTS，而两条规则单看都"对"。
   * 线上是静态文件、没有这一步规范化，所以那条 redir 是必要的。
   * **照搬线上规则到 dev 会造出线上没有的 bug。**
   */
  if (p === "/atlas" && ATLAS_MODE === "static") { res.writeHead(308, { location: "/atlas/" }); return res.end(); }
  if (p === "/atlas" && ATLAS_MODE === "dev") return proxy(req, res, ATLAS_DEV, req.url);

  // ③ 尾斜杠先重定向掉（@atlasTrail）。**不能交给 try_files** ——
  //    静态导出产出的是 out/model/wan.html 而不是目录，会被兜底成首页：200 但内容是错的。
  const trail = p.match(/^\/atlas\/(.+)\/$/);
  if (trail) { res.writeHead(308, { location: `/atlas/${trail[1]}${url.search}` }); return res.end(); }

  // ④ /atlas/* → 能力地图
  if (p === "/atlas/" || p.startsWith("/atlas/")) {
    if (ATLAS_MODE === "dev") return proxy(req, res, ATLAS_DEV, req.url);
    // 静态模式才剥前缀：handle_path 的行为，产物按根目录摆
    return serveStatic(res, ATLAS_OUT, p.slice("/atlas".length) || "/", "/index.html");
  }

  // ⑤ 其余全归主站
  if (MAIN_MODE === "dev") return proxy(req, res, MAIN_DEV, req.url);
  return serveStatic(res, MAIN_OUT, p, "/index.html");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`本地网关 http://127.0.0.1:${PORT}`);
  console.log(`  /atlas/*  → ${ATLAS_MODE === "dev" ? ATLAS_DEV : ATLAS_OUT}`);
  console.log(`  /chrome/* → ${existsSync(CHROME_DIR) ? CHROME_DIR : "（主站未构建，会 404）"}`);
  console.log(`  其余      → ${MAIN_MODE === "dev" ? MAIN_DEV : MAIN_OUT}`);
  console.log(`\n规则与 deploy/caddy-snippet.conf 一一对应 —— 改一边要改另一边。`);
});
