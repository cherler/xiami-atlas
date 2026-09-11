import type { Metadata } from "next";
/**
 * **和主站同一份 Geist**（`geist` 官方包把 woff2 随 npm 本地分发，构建不请求外网）。
 *
 * 为什么要专门加：平台令牌 `--xm-font-sans` 里**根本没有 Geist**，它是
 * `"PingFang SC", "Microsoft YaHei", system-ui…`；主站是在 `<body>` 上另外套了
 * next/font 的 Geist。于是**照着令牌做的子应用，字体和主站不一样** ——
 * 拉丁字母和数字全变样，而这一站满屏是型号名和日期。
 * 令牌文件自己写着「一处不同，用户切模块时就会觉得跳到别的网站了」，这就是那一处。
 */
import { GeistSans } from "geist/font/sans";
import { BRAND } from "@/lib/brand";
import "./globals.css";
import Nav from "@/components/Nav";
import Flash from "@/components/Flash";
import { ChromeFooter, ChromeHeader } from "@/components/PlatformChrome";
import NextSteps from "@/components/NextSteps";
import AnchorHistory from "@/components/AnchorHistory";

const DESC =
  "模型之间不靠出身相连，靠能做什么相连。每条事实都带来源、核验日期，和一个「这是机器写的」标记。";

/**
 * 分享图（§19 · G4）。图由 scripts/make-share.mjs 从 data/atlas.json 生成，
 * **不是手做的** —— 手做的图迟早和数据对不上，而这个项目卖的就是「对得上」。
 *
 * metadataBase 必须写死成线上域名：OG 抓取方要的是绝对地址，
 * 相对路径在微信/Twitter 那边一律抓不到。
 * 路径里的 /atlas 是 basePath —— public/og/x.png 部署后就在 /atlas/og/x.png。
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://xiamimate.com"),
  /**
   * `template` 让每个子页都自动带上站名 —— 否则分享出去的是一个孤零零的
   * 「谁和谁有关系」，看不出是谁家的。首页用 default，与姊妹站同格式。
   */
  title: { default: BRAND.tab, template: `%s｜${BRAND.short}` },
  icons: { icon: BRAND.icon, shortcut: BRAND.icon, apple: BRAND.icon },
  description: DESC,
  openGraph: {
    title: "9 个 AI 视频模型 × 11 项能力，谁能做什么",
    description: DESC,
    url: "/atlas/",
    siteName: BRAND.full,
    locale: "zh_CN",
    type: "website",
    images: [{ url: "/atlas/og/index-16x9.png", width: 1200, height: 675 }],
  },
  twitter: { card: "summary_large_image", images: ["/atlas/og/index-16x9.png"] },
  // RSS 自动发现：**静态站没有后端，订阅只能是一个静态文件** ——
  // 好处是读者不用把邮箱交给我们。
  alternates: { types: { "application/rss+xml": [{ url: "/atlas/changes.xml", title: `${BRAND.full} · 变了什么` }] } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /**
      * `suppressHydrationWarning` 只作用在 <html> 这一个元素的属性上,不影响任何子节点。
      *
      * 这里有两段**必须在 hydrate 之前跑**的同步脚本:主题(给 <html> 加 data-theme)
      * 与快讯收起状态(给 <html> 加 .flash-closed)。它们改的正是 React 也会对账的那些属性,
      * 于是服务端 HTML 和客户端对不上,控制台报「A tree hydrated but some attributes …」。
      *
      * 这两段脚本都不能挪到 React 里 —— 挪进去就会先按默认样子画一帧再改,
      * 「每翻一页闪一下白」「横幅先展开再收起」正是它们要躲的东西。
      * 所以对账要放过 <html> 的属性,这也是 Next 官方对预加载主题脚本给的做法。
      *
      * (2026-08-19 使用者在 /atlas 报的:收起过快讯或选过主题之后每次刷新都报。
      *  没设过任何一项时不报 —— 因为那时脚本什么都没加。)
      */
    <html lang="zh-CN" className={GeistSans.variable} suppressHydrationWarning>
      {/**
        * `min-h-screen` + 纵向 flex：**内容不够一屏时，把空白留在页脚之上**。
        *
        * 2026-08-12 负责人在 /atlas 首页上问「页脚怎么会突然变那么高了，只有首页有」——
        * 量下来页脚一直是 65px，和别的页一样。真相是首页内容只有 654px，
        * 页脚画到 860px 就结束了，而视口有 1000px：**下面那 140px 白**紧贴着页脚的底色，
        * 看起来就像页脚被撑高了。别的页内容长过一屏，所以看不出来。
        *
        * `flex-1` 给的是内容区（children 与它后面的 NextSteps 一起），
        * 让它吃掉多余高度，页脚自然沉到底。
        */}
      <body className="min-h-screen flex flex-col">
        {/**
          * **外观偏好：控件在主站账户中心，本站只负责读和响应。**
          *
          * 负责人 2026-08-15 定的形态：这是**平台级设置**（账户中心 › 设置 › 外观，
          * 随系统 / 白天 / 黑夜），不是本站自己的开关 —— 所以这里没有切换按钮。
          * 主站和 `/atlas` 在**同一个源**上（子应用走路径不走子域），
          * localStorage 天然共用，一处设置到处生效，不需要任何同步机制。
          * 键名与真源见 `xiamimate-tools-frontend/lib/theme.ts`。
          *
          * 这一段必须同步、必须在 body 最前面、必须不走 React：
          * 系统深色由 CSS 的 `prefers-color-scheme` 直接管住不需要 JS，但**手动选过**
          * 的那份存在 localStorage 里，等 React 挂载才读的话，浏览器已经按系统外观
          * 画完一帧了 —— 系统浅色而人选了黑夜，每翻一页都要先被闪一下白，
          * **正好是他开这个功能要躲的东西**。
          *
          * ⚠️ 这是主站那份脚本的**拷贝**，不是引用：构建时跨仓库拿不到对方的模块。
          * 改一边要改两边（对面文件里也写了同一句话）。
          * try/catch 是因为隐私模式下读 localStorage 会直接抛。
          */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("xm-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}',
          }}
        />
        {/* 平台页眉页脚：加载主站 /chrome 制品。取不到就整个不渲染（本地 dev 即如此）。 */}
        <ChromeHeader />
        {/* Nav 和 NextSteps 挂在 layout 上 —— **每一页都有，否则总有页面是死路**。 */}
        <Nav />
        {/**
          * 突发横幅：**站上唯一一个会主动打断阅读的东西**，所以挂在 Nav 之下、内容之上，
          * 每一页都有。没有在架的突发时它整个不渲染（`alerts.items` 为空 → 返回 null），
          * 所以平时它一个像素都不占。
          *
          * 位置是有讲究的：放在 Nav **上面**会把站名挤下去，读者第一眼看到的是一条通知
          * 而不是「这是哪儿」；放进各页正文里则要每页各挂一次，早晚漏。
          */}
        <Flash />
        {/* 页内锚点不进历史 —— 否则「← 返回」退的是上一次目录跳转，不是上一个页面 */}
        <AnchorHistory />
        <div className="flex-1">
          {children}
          <div className="max-w-[1240px] mx-auto px-5 pb-10">
            <NextSteps />
          </div>
        </div>
        <ChromeFooter />
      </body>
    </html>
  );
}
