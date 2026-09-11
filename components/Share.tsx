"use client";

import { useEffect, useState } from "react";

/**
 * 分享。**这一页的结论要能带走，而不只是一个 URL。**
 *
 * ## 为什么之前没有这个按钮
 *
 * 分享图早就在生成（`scripts/make-share.mjs`，107 张），但它们只出现在
 * `<meta property="og:image">` 里 —— 也就是**别人粘贴链接时才用得上**。
 * 负责人 2026-08-12 问「分享按钮在哪」，答案是站上根本没有：
 * 那几张给人手动发社交媒体的竖版图，**只能靠知道 URL 直接访问**。
 * 生成了却没有入口，等于没生成。
 *
 * ## 三件事，按「能不能用得上」排
 *
 * 1. **系统分享**（`navigator.share`）—— 手机上这一条才是真的能发到微信。
 *    微信不读 OG 协议，粘链接不出卡片；但走系统分享面板发过去，
 *    带的是页面标题，比一条裸 URL 强得多。**桌面浏览器大多没有这个 API，
 *    所以它必须能优雅缺席**，不能占着位置点不动。
 * 2. **存图** —— 把这一页的分享图下载下来，手动发到小红书/朋友圈。
 *    这是那几张竖版图**唯一的入口**。
 * 3. **复制链接** —— 最朴素、永远可用的兜底。
 *
 * ## 一条纪律
 *
 * 图的文件名由调用方传进来，**这里不猜**。猜的话就会出现
 * 「按钮在、图 404」——而线上刚刚才修掉一个「404 返回 200 首页」的坑，
 * 那种错一旦发生，用户下载到的是一个后缀叫 .png 的 HTML。
 */
export default function Share({ og, title }: { og?: string; title?: string }) {
  const [open, setOpen] = useState(false);
  const [said, setSaid] = useState("");
  const [canNative, setCanNative] = useState(false);

  // navigator.share 只在部分浏览器（主要是手机）上有 —— 服务端渲染时必然没有，
  // 所以只能在挂载后问，否则静态导出的 HTML 会把「有」硬编进去。
  useEffect(() => { setCanNative(typeof navigator !== "undefined" && !!navigator.share); }, []);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const flash = (s: string) => { setSaid(s); setTimeout(() => setSaid(""), 2200); };

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); flash("链接已复制"); }
    catch { flash("复制不了，手动选地址栏吧"); }
  };

  const native = async () => {
    try { await navigator.share({ title: title ?? document.title, url }); }
    catch { /* 用户自己取消了，不该报错 */ }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="text-[13px] text-muted underline underline-offset-2 hover:text-yes"
      >
        分享这一页
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1.5 w-[212px] rounded-xl border border-rule bg-card p-1.5 shadow-lg">
          {canNative && (
            <button onClick={native} className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[13.5px] hover:bg-rule/40">
              发送到…
              <span className="block text-[11.5px] text-muted">微信、备忘录等（走系统分享面板）</span>
            </button>
          )}
          <button onClick={copy} className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[13.5px] hover:bg-rule/40">
            复制链接
          </button>
          {og && (
            /* 直接给 <a download>，不走 JS 取 blob —— 静态站没必要，
               而且 download 属性对同源文件本来就好使 */
            <a
              href={og}
              download
              onClick={() => flash("图在下载了")}
              className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[13.5px] hover:bg-rule/40"
            >
              存这一页的图
              <span className="block text-[11.5px] text-muted">1200×675，图上带来源与核验日</span>
            </a>
          )}
          {said && <div className="px-2.5 pb-1 pt-1.5 text-[12px] text-yes">{said}</div>}
        </div>
      )}
    </div>
  );
}
