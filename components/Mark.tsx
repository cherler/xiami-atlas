import type { State } from "@/lib/atlas";

/**
 * 三态标记：✅ / ❌ / ⬜ 的画出来的版本。
 *
 * ## 为什么不用 emoji
 *
 * 上一版直接写 `✅`。它在 macOS 上是苹果那个**亮绿圆角方块 #34C759** ——
 * 整张真值表几百格全是它，是全站最响的颜色，而**它不在品牌色系里**
 * （品牌青绿 #0c9488）。切到虾米跨境那种青绿+白的页面，第一眼就是两个产品。
 *
 * 还有一层更硬的理由：**emoji 的字形由操作系统决定**。同一份「规格书」
 * 在 Windows 上是另一套勾叉、在 Android 上又是一套 —— 一个卖「对得上」的站，
 * 不该让最核心的符号长成什么样取决于读者用什么电脑。
 *
 * ## 三个状态共用一个方形轮廓
 *
 * 用同一块 12px 见方的地方装三种状态，扫视时对齐、也数得清：
 *   ✅ 实心品牌青绿 + 白勾
 *   ❌ 实心红 + 白叉（红是**醒目**不是评判 —— 见 globals.css 里 --color-no 的说明）
 *   ⬜ 淡灰实心，不画符号（浅灰画符号等于消失，这一条是踩过三版的结论）
 */
const BOX = { yes: "var(--color-yes)", no: "var(--color-no)", unknown: "var(--color-unknown)" } as const;

export default function Mark({
  state,
  size = 13,
  className = "",
}: {
  state: State;
  size?: number;
  className?: string;
}) {
  const label = state === "yes" ? "支持" : state === "no" ? "不支持" : "官方没说";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      role="img"
      aria-label={label}
      className={`inline-block shrink-0 align-[-0.14em] ${className}`}
    >
      <rect
        x="0.5"
        y="0.5"
        width="15"
        height="15"
        rx="3"
        fill={BOX[state]}
        /* ⬜ 用淡填充，不描边 —— 描边会让它看起来像个待勾选的框，那是另一个意思 */
        opacity={state === "unknown" ? 0.26 : 1}
      />
      {state === "yes" && (
        <path
          d="M4 8.4l2.7 2.7L12 5.6"
          fill="none"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {state === "no" && (
        <path d="M5 5l6 6M11 5l-6 6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

/**
 * 平台透明度那一档的圆点。
 *
 * 和三态方块**刻意不同形**：方块说的是「厂商对这项能力怎么说」，
 * 圆点说的是「这个平台肯不肯讲清楚它底下用的是谁」—— 两把尺子，
 * 长一样会被当成同一件事。方 vs 圆是最省事也最不会认错的区分。
 *
 * 之前这三档在 /method 里写的是 🟢🔴 加一个画出来的 ⬜ ——
 * **同一个清单里两套画法**，emoji 那两个还随系统变形。
 */
export function Dot({ tone, size = 11 }: { tone: "yes" | "no" | "unknown"; size?: number }) {
  const label = tone === "yes" ? "点名了" : tone === "no" ? "读完整页也没提" : "我们没读到";
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" role="img" aria-label={label}
      className="inline-block shrink-0 align-[-0.08em]">
      <circle cx="6" cy="6" r="5" fill={BOX[tone]} opacity={tone === "unknown" ? 0.26 : 1} />
    </svg>
  );
}
