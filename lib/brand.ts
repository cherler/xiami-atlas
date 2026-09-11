/**
 * 站名与图标只此一处。
 *
 * 改名是一件常发生的事，而站名会渗进导航、页脚、metadata、分享图、README。
 * 散在各处 = 改一次漏三处。**要改就改这一个文件。**
 *
 * 「虾米看AI」（负责人定，2026-08-09）。原来叫「AI 能力地图」——
 * 「地图」这个词已经被站内一个页面（/map 关系图）占着，同名两义，撞。
 *
 * 浏览器标签页跟姊妹站对齐：`虾米看股｜虾米伙伴` → `虾米看AI｜虾米伙伴`。
 * 图标也用同一份虾米君（与 tools-frontend / stock-lab 逐字节相同，
 * **不另画一版** —— 三个站的头像不一样，读者会以为不是一家的）。
 */
export const BRAND = {
  /** 导航左上角那块。后面并排显示当前方向名，所以要短。 */
  short: "虾米看AI",
  /** 完整称呼，用在 metadata 与页脚。 */
  full: "虾米看AI",
  /** 产品家族名，跟在标签页标题后面。 */
  suite: "虾米伙伴",
  /** 浏览器标签页标题（首页）。 */
  tab: "虾米看AI｜虾米伙伴",
  /**
   * favicon。**要带 basePath** —— public/favicon.svg 部署后在 /atlas/favicon.svg，
   * Next 不会替 metadata.icons 自动补 basePath（OG 图那几条也是手写全路径）。
   */
  icon: "/atlas/favicon.svg",
};
