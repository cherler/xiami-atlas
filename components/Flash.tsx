import Link from "next/link";
import { Rich } from "@/components/Fact";
import alerts from "@/data/alerts.json";

/**
 * 快讯条。**站上唯一一个会主动打断阅读的东西，所以门槛必须高。**
 *
 * ## 它跟 `/changes` 页的区别
 *
 * `/changes` 是「读者主动来才看得到」；这一条是「你没找它，它也拦你一下」。
 * 一个站里能这么做的东西只该有一样，多了就没人看了。
 * 所以判据不是「有新变化」，是**「知道与不知道，做法会不一样」** ——
 * 由写那条变更事件的人在 `alert` 里明说，脚本不替他判断。
 *
 * ## 到期自己下架
 *
 * `data/alerts.json` 是 `scripts/alert.mjs` 按一期（7 天）过滤后的产物，
 * 过期的根本不会出现在这里。**一个要靠人记得删的横幅，就是会挂一年的横幅** ——
 * 而挂着的旧快讯比没有横幅更伤：它告诉读者这个站没人管。
 *
 * ## 折叠为什么不走 React
 *
 * 和 `app/layout.tsx` 里主题那一段同一个理由：**这段必须在首屏绘制之前同步跑完**。
 * 走 React 的话，静态导出的 HTML 里横幅是展开的，等 hydrate 完才收起来 ——
 * 每进一页都先闪一下。所以两种形态都渲染进 HTML，**由 `<html>` 上的一个类决定显示哪个**，
 * 类由下面这段同步脚本从 localStorage 读出来设上。React 从头到尾没参与，
 * 也就不存在 hydration 不一致。
 *
 * ## 关掉一次，不等于永远闭嘴
 *
 * 存的是**当前这批快讯的签名**（各条 id 拼起来），不是一个布尔值。
 * 换了新快讯签名就变了，横幅自己重新展开 ——
 * 否则读者随手点一次 ×，这条通道就对他永久失效了，而他并不知道。
 */
/**
 * 快讯条目的形状（由 scripts/alert.mjs 单点写出）。
 * **显式标出来是必需的**：alerts.json 一到「本期无快讯」就写成 items:[]，
 * 而 TS 从空 JSON 数组推出的元素类型是 never —— items.map(a => a.id) 于是编不过，
 * 整站构建失败（2026-08-27 一次真部署撞到，跟本次加模型无关）。
 * 标了类型，空数组也当作 FlashItem[]，构建不再随「这周有没有快讯」时好时坏。
 */
type FlashItem = {
  id: string;
  headline: string;
  date: string;
  why: string;
  src?: { url: string; name: string; tier: string };
};

export default function Flash() {
  const items = (alerts.items ?? []) as FlashItem[];
  const more = (alerts as { more?: number }).more ?? 0;
  if (!items.length) return null;
  const label = alerts.label ?? "快讯";
  const sig = items.map((a) => a.id).join("|");

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html:
            `(function(){try{var s=${JSON.stringify(sig)};` +
            `if(localStorage.getItem('atlas:flash:closed')===s)` +
            `document.documentElement.classList.add('flash-closed');}catch(e){}})();`,
        }}
      />
      <div id="flashbar" className="border-b border-rule bg-chip-warm/50" data-sig={sig}>
        {/* 收起后的那一条：只留标签、条数和一个展开按钮，一行高。 */}
        <div className="fl-min mx-auto max-w-[1240px] px-4 py-1.5 flex items-center gap-3">
          <span className="shrink-0 px-1.5 py-px bg-chip-warm-ink text-paper text-[11px] tracking-[0.18em]">
            {label}
          </span>
          <span className="text-[13px] text-muted">{items.length + more} 条</span>
          <button type="button" data-flash="open"
            className="ml-auto text-[13px] text-muted underline underline-offset-2">
            展开
          </button>
        </div>

        <div className="fl-full mx-auto max-w-[1240px] px-4 py-3">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="shrink-0 px-1.5 py-px bg-chip-warm-ink text-paper text-[11px] tracking-[0.18em]">
              {label}
            </span>
            {/* 多于一条才报数：只有一条时「1 条」是废话。 */}
            {items.length > 1 && <span className="text-[12px] text-muted">{items.length} 条 · 可滚动</span>}
            <button type="button" data-flash="close" aria-label="收起快讯"
              className="ml-auto text-muted leading-none px-1.5 py-0.5 text-[18px]">
              ×
            </button>
          </div>

          {/**
            * 多条时纵向滚动，**不做自动轮播**。
            * 轮播看着热闹，代价是读者读到一半被换走 —— 而这一条里全是要读完才有意义的判断。
            * 高度按「大约两条」定：露出下一条的头，人才知道下面还有。
            */}
          <div className={items.length > 1 ? "max-h-[228px] overflow-y-auto pr-1" : ""}>
            {items.map((a, i) => (
              <div key={a.id} className={i ? "mt-3 pt-3 border-t border-rule" : ""}>
                <div className="flex items-baseline gap-3 flex-wrap">
                  <Link href="/changes" className="text-[16px] font-semibold underline-offset-4 hover:underline">
                    {a.headline}
                  </Link>
                  <span className="text-muted text-[12px] tabular-nums">{a.date}</span>
                </div>
                <Rich text={a.why} className="text-[13.5px] text-muted leading-relaxed block mt-1" />
                {a.src ? (
                  <p className="text-[12px] text-muted mt-1">
                    出处：
                    <a href={a.src.url} className="underline underline-offset-2" target="_blank" rel="noreferrer">
                      {a.src.name}
                    </a>
                    <span className="ml-2">{a.src.tier === "official" ? "官方" : "第三方"}</span>
                  </p>
                ) : (
                  /* 没有出处的快讯不该存在。真出现了就明写在页面上，别悄悄少一行。 */
                  <p className="text-[12px] text-no mt-1">这一条没有出处 —— 请去 data/changes.json 补。</p>
                )}
              </div>
            ))}
            {/**
              * **被 3 条上限截掉的那几条，要说出来。**
              * 横幅只放得下 3 条（再多读者就学会忽略这一整块了），但
              * 「今天其实新增了 5 条、这里只显示 3 条」如果不写，剩下两条就等于没发生 ——
              * 静静少一条和没有台账是一回事。数字由 alert.mjs 交出来，组件不自己算。
              */}
            {more > 0 && (
              <div className="mt-3 pt-3 border-t border-rule">
                <Link href="/changes" className="text-[13px] text-muted underline underline-offset-2">
                  还有 {more} 条今天够格上头条的，横幅放不下 —— 去「最近有什么变化」看全部 →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html:
            `(function(){var b=document.getElementById('flashbar');if(!b)return;` +
            `b.addEventListener('click',function(e){var t=e.target.closest('[data-flash]');if(!t)return;` +
            `var on=t.dataset.flash==='close';` +
            `document.documentElement.classList.toggle('flash-closed',on);` +
            `try{on?localStorage.setItem('atlas:flash:closed',b.dataset.sig)` +
            `:localStorage.removeItem('atlas:flash:closed');}catch(err){}});})();`,
        }}
      />
    </>
  );
}
