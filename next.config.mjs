/**
 * 静态导出，挂在 xiamimate.com/atlas 下。
 *
 * 为什么是静态而不是跑 Node：**这个站没有任何服务端逻辑** ——
 * 所有数据在构建时从 data/*.json 读进来，前端纯渲染。
 * 跑一个 Node 进程只是多一个要守着的东西，换不来任何动态能力。
 *
 * 和 tools-frontend、stocks 同一套形态：`next build` 出 out/，
 * 传到 /srv/<your-app>/current，Caddy 用 handle_path 剥掉前缀（见 deploy/）。
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: "export",
  // Caddy 的 handle_path 会剥掉 /atlas 前缀，所以静态文件按根目录摆；
  // 但 HTML 里的资源链接必须带 /atlas —— 那正是 basePath 干的事。两者配套，缺一不可。
  basePath: "/atlas",
  images: { unoptimized: true },
  // Next dev 默认只放行 localhost 来源；用 127.0.0.1 打开会被拒，
  // 而且是**静默失败**（HMR / hydration 不工作，页面点不动）。抄自 tools-frontend 踩过的坑。
  allowedDevOrigins: ["127.0.0.1"],
  /**
   * **dev 与 build 各用各的中间目录。**
   *
   * 2026-08-14 负责人报「本地服务出错了」。表现很迷惑：页面 HTTP 200、
   * 标题正确、正文也在，**但样式和脚本全没了** —— 浏览器控制台里
   * `/atlas/_next/static/chunks/main-app.js` 与 `layout.css` 全是 404。
   *
   * 原因不在代码里：`next dev` 和 `next build` **默认共用 `.next`**。
   * 那天为了验收，dev server 一直开着，我又跑了五次 `npx next build` ——
   * 每一次都把开发态的 chunk（`main-app.js`、`polyfills.js` 这些没有哈希的）
   * 换成了生产态的哈希文件（`255-9a9e56334e101fed.js`）。
   * dev server 还按老名字去要，自然全 404。
   *
   * **这不是偶发，是必然**：这个项目的纪律就是「做完就测」+「构建前先跑 validate」，
   * 也就是说**每改一次数据都会 build 一次**，而 dev server 是常开的（见 dev-up.sh）。
   * 两者共用一个目录，就注定每天都要撞几回。
   *
   * 分开之后：dev 写 `.next-dev`，build 仍写 `.next`（部署脚本、`out/` 都不受影响）。
   */
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
};

export default nextConfig;
