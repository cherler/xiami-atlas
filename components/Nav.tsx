"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { atlas } from "@/lib/atlas";
import { modelBySlug, capBySlug } from "@/lib/slug";
import DomainSwitch from "./DomainSwitch";
import NavSearch from "./NavSearch";
import { BRAND } from "@/lib/brand";

/**
 * 全站导航。挂在 layout 上，**每一页都有** —— 否则总有页面是死路。
 *
 * 顺序按三条动线的入口排：先「我要做什么」（首页），
 * 再「现在到什么程度」（演化树、地图、能力），最后「我在追踪」（变化）。
 * `方法` 单独放右边 —— 它是口径收容所，不是内容。
 *
 * `data-nav="global"` 是给检查器认的记号：**用通用的 `<nav>` 标签查会假阳性** ——
 * 详情页里的面包屑也是 `<nav>`，把全站导航整个拆掉，检查照样绿。
 * 这个假阳性是「拿一条已知是错的喂进去看它响不响」抓出来的。
 *
 * **没建好的页不放进导航。** 一个点进去发现「还在建」的入口，
 * 比没有入口更糟 —— 它把人引进死路。
 */
/**
 * 四张图 = 全部主线（docs/北极星.md 第三节 + 场景）。导航就是这四个词。
 *
 *   现在 → /       AI 视频研发到哪一步了、谁能做什么（首页真值表）
 *   演变 → /tree   谁在什么时候长出了什么
 *   关系 → /map      谁和谁有关系（公司→模型→能力，能力是枢纽）
 *   场景 → /scenario 我想做这件事，谁能做（方案 §10 Skill 第一等公民）
 *
 * 用户只要这四个问题的答案。**其余一切都是它们的下级或废案**，不占导航：
 * `/models` `/compare` `/capability` `/model` 从图里点进去；
 * `/changes` `/toolkit` `/caveats` 是复访/长尾层，从首页页脚的次级入口进；
 * 「场景」页（/scenario）已经涵盖六件事的做法，原 /skill 索引删掉，只留 /skill/[id] 详情。
 *
 * 上一版挂到过九项、砍到六项、又砍到四项 —— **每一次「砍」都还留着不服务三张图的词**。
 * 这一次对着北极星砍到底：不服务三张图的，一个都不上导航。
 * `方法` 单独放右边，它是口径收容所不是内容。
 *
 * `data-nav="global"` 是给检查器认的记号：用通用 `<nav>` 查会假阳性（面包屑也是 nav）。
 */
/**
 * 四张图。**路径带方向前缀** —— `/atlas/video/tree`、`/atlas/image/tree`。
 * 这里只写后缀，前缀由当前所在的方向决定（见下面 `dom`）。
 */
const MAIN = [
  { seg: "", zh: "现在" },
  { seg: "/tree", zh: "演变" },
  { seg: "/map", zh: "关系" },
  { seg: "/scenario", zh: "场景" },
];

export default function Nav() {
  const p = usePathname() ?? "/";
  /**
   * 当前在哪个方向。从路径第一段取；取不到（根页、/method 这类全局页）
   * 就退回 live 的那个 —— **导航不能因为你在全局页就失去入口**。
   */
  const parts = p.replace(/^\/atlas/, "").split("/").filter(Boolean);
  const seg = parts[0] ?? "";
  /**
   * `/skill/[id]` 这类页不带方向前缀，但它**本身是属于某个方向的**。
   * 只按路径退回 live 方向的话，「虚拟试穿」这个图像 Skill 会顶着
   * 「AI 视频」的导航显示 —— 和之前 /atlas/image/map 显示视频是同一类错。
   * 实体自己知道自己属于谁，就问它。
   */
  /**
   * ⚠️ **同样的道理对 `/model/[id]` 与 `/capability/[id]` 也成立，之前只修了 skill。**
   *
   * 2026-08-12 给能力页加方向隔离检查时一次性照出来：`/capability/s-openweights`、
   * `/capability/t-think`、`/model/qwen-image`、`/model/kokoro` —— **全都顶着「AI 视频」**。
   * 四卷合计 60 多个能力页、50 多个模型页，除了视频那部分全错。
   *
   * 这一处的教训不是「又漏了一个路由」，是**修 bug 时只修了报出来的那一个**：
   * 当时 skill 页被发现顶错方向，改法是给 skill 加一条特判，
   * 而没问「还有哪些页也是不带方向前缀、却属于某个方向的」。
   */
  /**
   * ⚠️ **第三次了：`/topic/[id]` 也不带方向前缀。**
   *
   * 2026-08-17 负责人截图：站在 `/atlas/topic/game` 上，左上角写着「AI 视频」。
   * 上面那段注释刚写完「修 bug 时只修了报出来的那一个」，加专项路由时又漏了。
   *
   * 所以这一版把判据挪到数据上：**专项自己声明属于哪一卷，声明不了就说横跨**。
   * 游戏专项没有 `domain`（站里没有「游戏」这一卷），于是走 cross 显示「全站」——
   * 那是实话，比挂到任意一卷强。
   *
   * 另加了一条守门的检查（verify.mjs「路由家族归类」）：
   * **产物里出现没归类的顶层路由段就红**。这次漏掉正是因为
   * 原来那条方向隔离检查只走 `/{方向}/…`，`/topic/…` 它一次都没访问过。
   */
  const topic = seg === "topic" ? atlas.topics.find((t) => t.id === parts[1]) : undefined;
  const owner =
    seg === "skill" ? atlas.skills.find((k) => k.id === parts[1])?.domain
    : seg === "model" ? modelBySlug(parts[1] ?? "")?.domain
    : seg === "capability" ? capBySlug(parts[1] ?? "")?.domain
    : seg === "topic" ? topic?.domain
    : undefined;
  /**
   * **有些页本来就不属于任何一个方向**：变更记录、方法、工具站、注意事项 ——
   * 它们讲的是整个站。之前这些页会退回 live 方向，于是从 AI 图像点「最近有什么变化」
   * 过去，顶上突然写着「AI 视频」—— 用户读成「它自动跳到视频去了」。
   *
   * **不属于谁就别声称属于谁。** 切换器在这些页显示「全站」，菜单里两个方向都不实心。
   * （四个主链接仍要有落点，用 live 方向；这是导航选择，不是身份声明。）
   */
  const CROSS = ["changes", "method", "toolkit", "caveats", "basics", "claims"];
  /**
   * **根页 `/` 也不属于任何方向** —— 它就是方向选择页（「先选一个方向」）。
   * 2026-08-12 负责人截图指出：站在 /atlas 上，左上角却写着「AI 视频」。
   * 原因是 `seg` 为空串，既不在 CROSS 里、也不是方向 id，于是退回了第一个 live 方向。
   * **一个让你选方向的页面，自己顶着某个方向的名字，是在骗人。**
   */
  /**
   * 专项没声明归属 = 横跨多卷，按跨方向页处理。
   * **「查不到归属」和「归属是第一个 live 方向」是两件事** —— 后者是猜，而且会猜错。
   */
  const cross = CROSS.includes(seg) || seg === "" || (seg === "topic" && !topic?.domain);
  const dom = atlas.domains.some((d) => d.id === seg)
    ? seg
    : owner && atlas.domains.some((d) => d.id === owner)
      ? owner
      : (atlas.domains.find((d) => d.state === "live") ?? atlas.domains[0]).id;
  const base = `/${dom}`;
  const here = (h: string) => (h === base ? p.endsWith(base) : p.includes(h));

  // 返回不放在导航条里 —— 塞进菜单栏太丑、和菜单项挤在一起。
  // 改用 <BackLink/> 放各下级页内容区顶部（像旧 /method 的「回地图」那样）。
  return (
    <nav data-nav="global" className="border-b border-rule bg-paper sticky top-0 z-20">
      {/**
       * 品牌块在 `overflow-x-auto` **之外**。
       * 放进去的话，那个 overflow 会建立裁剪上下文，把绝对定位的下拉整个切掉 ——
       * 面板照样存在于 DOM 里、`aria-expanded` 也照样是 true，
       * 只是**一个字都看不见**。又一个「查 DOM 查不出来」的坑。
       */}
      <div className="max-w-[1240px] mx-auto px-5 h-12 flex items-center gap-1">
        <DomainSwitch brand={BRAND.short} current={cross ? undefined : dom} neutral={cross} home={seg === ""} />
        <div className="flex items-center gap-1 min-w-0 flex-1 overflow-x-auto">
          {MAIN.map((m) => {
            const href = `${base}${m.seg}`;
            return (
              <Link key={href} href={href}
                className={`text-[14px] px-2.5 py-1 shrink-0 whitespace-nowrap ${
                  here(href) ? "text-ink font-semibold" : "text-muted hover:text-ink"
                }`}>
                {m.zh}
              </Link>
            );
          })}
          <Link href="/method"
            className={`text-[13px] px-2.5 py-1 ml-auto shrink-0 whitespace-nowrap underline ${
              here("/method") ? "text-ink" : "text-muted hover:text-ink"
            }`}>
            方法
          </Link>
        </div>
        {/**
          * **搜索栏挂在这里，不在上面那个 `overflow-x-auto` 里。**
          * 负责人 2026-08-13：「搜索能力直接在右上角那里做一个搜索栏，不需要一个搜索页。」
          * ⚠️ 放进那个可横滚的容器会建立裁剪上下文，把绝对定位的结果面板整个切掉 ——
          * 面板在 DOM 里、状态也对，就是一个字都看不见（品牌块踩过同一个坑）。
          */}
        <NavSearch />
      </div>
    </nav>
  );
}
