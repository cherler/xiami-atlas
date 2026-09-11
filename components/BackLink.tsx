"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * 下级页的返回链接。**放各页内容区顶部**（不塞进导航条 —— 塞菜单栏里太丑）。
 * 位置贴近导航条下沿，间距小；样式和旧 /method 的「回地图」一致。
 *
 * ## 默认「回上一页」，但有上级的页要明写上级
 *
 * 不给 `href` 时走 `router.back()` —— 从哪来回哪去（从场景页点进 skill，
 * 返回的就是场景页）。没有历史时浏览器兜底到首页。
 *
 * **但这个默认在「有下级的页」上会转圈。** 负责人 2026-08-17 撞到：
 * 专项页 → 点进项目拆解页 → 点它的「← AI 游戏制作」回到专项页 →
 * 再点专项页的「← 返回」→ **又回到项目页**，两页之间来回弹，出不去。
 *
 * 根因是**「返回」这两个字被当成了两种意思**：
 * 在项目页上它是「上一层」（回专项），在专项页上却成了「上一页」（回项目）。
 * 前者是结构，后者是历史 —— 从下级走上来时，两者正好相反。
 *
 * 所以：**结构上有明确上级的页，把上级写死**（`href` + `zh`），不看历史。
 * 只有那些「从哪都可能来」的页（skill / model / capability）才继续用 back()。
 */
export default function BackLink({ href, zh }: { href?: string; zh?: string }) {
  const r = useRouter();
  const cls = "text-muted text-[13px] underline hover:text-ink self-start";

  /**
   * ⚠️ **站内链接必须用 `<Link>`。** 这个站挂在 `/atlas` 下（basePath），
   * `<Link>` 自动补前缀，原生 `<a>` 不会 —— 那个坑全站死过 73 处链接。
   */
  if (href) return <Link href={href} className={cls}>← {zh ?? "返回"}</Link>;

  return (
    <button onClick={() => r.back()} className={cls}>
      ← 返回
    </button>
  );
}
