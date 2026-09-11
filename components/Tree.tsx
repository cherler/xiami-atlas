"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { atlas, label, orgOf } from "@/lib/atlas";
import { modelHref } from "@/lib/slug";

/**
 * 模型演化树。**时间是纵轴，树从下往上长；14 条产品线横向平铺。**
 *
 * ## 为什么是这个形态
 *
 * 上一版是横向泳道，一节点一槽，67 个节点拉了 4000px —— 那不是树，是清单。
 * 参照 LLM 演化树那一类图：**时间做一根轴，血缘分叉横向铺开，
 * 模型在各自发布的时刻长出来。** 分叉是真的（Wan2.1 底座上同时长出
 * FLF2V 和 VACE），平铺会把分叉整个抹掉。
 *
 * ## 开不开源只由「实心/空心」逐代表示，颜色只用来区分线
 *
 * 上一版把宽度硬切两半（左开源右闭源），万相/海螺这种换过向的被挤在交界，
 * 逼出一句文字补救。改成颜色分之后又踩了第二个坑：图例写「绿系=开源家族、
 * 彩色=闭源家族」，同时写「实心=权重公开」—— **两套都叫开源/闭源，结论还相反**
 * （MiniMax 是紫色「闭源家族」，但 H3 实心「权重公开」）。负责人当场问
 * 「公开权重不就是开源吗」。**是分类有毛病，不是他没看懂。**
 *
 * 真相：**开不开源是逐代变的**（万相开源起家、3.0 转闭源；海螺闭源起家、H3 才放权重），
 * 按「家族」贴死标签本身就错。所以现在：开不开源**只看节点实心/空心**，
 * 颜色退回只做一件事 —— 把 14 条产品线彼此区分开，不承载开源语义。
 *
 * ## 文字为什么少
 *
 * §7.1 的验收：删掉正文只留节点、线、日期、关键词，仍要看得懂。
 * 所以图上只有**产品线名 + 时间轴**，每个节点具体加了什么在点开之后 ——
 * 67 个标签同时铺在图上，只会变成一团噪音。
 */
const W = 1240;
const PAD = { t: 56, b: 76, l: 78, r: 120 };  // b 加大：起点公司名改画在起点下方，轴底要留出一栏  // r 加大：末节点标签写在右侧，别溢出画布

const MS = (d: string) => new Date(`${d.length === 7 ? `${d}-01` : d}T00:00:00Z`).getTime();
const ymd = (ms: number) => new Date(ms).toISOString().slice(0, 10);

type Node = {
  id: string; parent?: string; m: string; version: string; date: string;
  added: string; cap?: string; src: string; quote: string;
};

/**
 * **按公司着色**（负责人 2026-08-09：同色同大小分不出谁是谁）。
 *
 * 走过两个极端：先是 14 条线 14 种随机色（一团花），再是全青绿单色（分不清谁是谁）。
 * 正解是**颜色承载信息**：一家公司一个色，同一家的两条线（Google 的 Veo 与
 * Gemini Omni）同色 —— 这本身就是要传达的事实。
 *
 * 色板是**低饱和、明度接近**的一组，放在纸底上不打架；顺序按色相环排开，
 * 相邻的线拿到的色相差足够大，扫视时分得开。
 */
const ORG_HUE: Record<string, string> = {
  alibaba: "#2f7d5e",      // 阿里 · 绿
  kuaishou: "#c2703a",     // 快手 · 橙
  bytedance: "#2b6fb0",    // 字节 · 蓝
  tencent: "#3f8f86",      // 腾讯 · 青
  kunlun: "#7a5cc4",       // 昆仑万维 · 紫
  shengshu: "#b04a72",     // 生数 · 洋红
  minimax: "#8a7a2e",      // MiniMax · 橄榄
  google: "#4a5fa8",       // Google · 靛
  lightricks: "#1f8a7a",   // Lightricks · 蓝绿
  runway: "#a8563a",       // Runway · 砖
  rhymes: "#6b8f3a",       // Rhymes · 黄绿
  genmo: "#7d6ba8",        // Genmo · 淡紫
  hpcai: "#3d7fa0",        // 潞晨 · 天蓝
  // ── AI 图像方向的公司。**加方向就得加这两张表** ——
  //    缺了不会报错，只会让新公司全落到同一个兜底灰，图上分不出谁是谁。
  bfl: "#b0532b",          // Black Forest Labs · 赭
  stability: "#6a6f8c",    // Stability AI · 石板
  krea: "#2f8f5e",         // Krea · 翠
  midjourney: "#8f4a8f",   // Midjourney · 紫红
  ideogram: "#3a7fa8",     // Ideogram · 湖蓝
  recraft: "#a88a2e",      // Recraft · 芥黄
};
const FALLBACK = "#5c6a78";

/**
 * 长名简称（负责人：模型名太长就用简称）。
 * 只砍**冗余前后缀**，不砍能区分版本的部分 —— 砍错了就分不出谁是谁。
 */
/**
 * 公司简称 —— **起点节点写公司，不写模型名**（负责人定）。
 *
 * 树是按产品线画的，线尾已经标着产品线名（Kling / Wan …），起点再写一遍模型名
 * 就是复述。写公司才补上一条新信息：**这条线是谁家的**。
 * 取的是 orgs[].zh 的可辨认前缀，不是自由发挥 —— 对不上就退回 orgs[].name。
 */
/** 公司的中文名。**从 orgs 表查，不从 model 上取** —— model 上没有 zh 这个字段。 */
const orgZh = (id: string) => atlas.orgs.find((o) => o.id === id)?.zh ?? id;

const ORG_SHORT: Record<string, string> = {
  bytedance: "字节", alibaba: "阿里", kuaishou: "快手", tencent: "腾讯",
  kunlun: "昆仑万维", shengshu: "生数", minimax: "MiniMax", hpcai: "潞晨",
  google: "Google", openai: "OpenAI", runway: "Runway", decart: "Decart",
  lightricks: "Lightricks", genmo: "Genmo", rhymes: "Rhymes AI",
  bfl: "BFL", stability: "Stability", krea: "Krea",
  midjourney: "Midjourney", ideogram: "Ideogram", recraft: "Recraft",
};

const SHORT_RAW = (t: string) =>
  (t || "")
    .replace(/^MiniMax Hailuo/, "MiniMax")
    .replace(/^OpenSora-STDiT-v(\d)/, "STDiT-v$1")
    .replace(/^Open-Sora-v(\d)/, "v$1")
    .replace(/^HunyuanVideo/, "HY")
    .replace(/^LongAnimateDiff/, "LongAnimDiff")
    .replace(/^OpenSora-/, "OS-")
    .replace(/^Open-Sora/, "Open-Sora")
    .replace(/^SkyReels-/, "SR-")
    .replace(/^Allegro-/, "Alg-")
    .replace(/^换代[:：]?\s*/, "")
    .replace(/\s*补充发布$/, "")
    .replace(/-v\?$/, "")
    // 通义这条线的版本号是日期戳（2511 / 2512），前缀太长会被截掉尾巴 ——
    // 而尾巴正是唯一能区分两代的东西。先缩前缀，别缩后缀。
    .replace(/^Qwen-Image-Edit-/, "QI-Edit-")
    .replace(/^Qwen-Image-/, "QI-");

/**
 * **截断要看得出来是截断。**
 *
 * 原来直接 `slice(0, 12)`：`Qwen-Image-2512` 变成 `Qwen-Image-2` ——
 * 那不是省略，是**凭空造了一个不存在的版本号**，而且看着完全合理。
 * 同理 `Stable Diffusion` 变成 `Stable Diffu`，像个错别字。
 * 加省略号之后，读者至少知道这里还有字。
 */
const CUT = (t: string) => (t.length > 12 ? `${t.slice(0, 12)}…` : t);
const SHORT = (t: string) => CUT(SHORT_RAW(t));

/**
 * 产品线名（画在线顶）的宽度与靠边方向。**布局占位和实际绘制各算一遍必然算歪**，
 * 所以做成一个函数两处调用 —— 和 `labelText` 同一条纪律。
 *
 * 靠左会伸进左侧刻度尺栏时就翻到右边：最左那条线左边只有尺子，
 * 硬靠左就是压在「10月」上面。
 */
/**
 * 估一块字有多宽。**必须带字号** —— 原来一个系数 5.2 套了 10.5 / 9.5 / 8.5 三种字号，
 * 最大那档被估窄了约 1px/字：12 个字就差 12px，于是「产品线名」和邻线的顶端标签
 * **只差 2px 地压在一起**，而避让算法看自己的估算值以为没事。
 * 0.58 是按渲染实测反推的（"HunyuanImage" 12 字 @10.5px 实测 74px），末尾再留一点余量。
 */
const textW = (t: string, fs: number) =>
  t.replace(/[^\x00-\xff]/g, "aa").length * fs * 0.58 + 10;
const lineNameW = (family: string) => textW(SHORT(family), 9.5);
const lineNameLeft = (x: number, family: string) => x - lineNameW(family) >= PAD.l;

/** 一个节点该显示什么字。**只此一处** —— 布局与渲染各算一遍必然会算歪。 */
const labelText = (
  n: { version?: string; added?: string },
  org: string,
  orgName: string,
  isTop: boolean,
  isBot: boolean,
) => {
  /**
   * ⚠️ **兜底不能落到 undefined。** 这里原来是 `ORG_SHORT[org] ?? orgName`，
   * 而调用方传的是 `l.model.zh` —— **模型上根本没有 `zh` 字段**。
   * 一直不崩只是因为 ORG_SHORT 恰好收全了所有公司；
   * 2026-08-12 声音卷新收 hexgrad 与 fishaudio 两家，它当场返回 undefined，
   * 一路传到 `textW()` 的 `t.replace(...)` 上 —— 声音卷那张树的预渲染**直接失败**。
   * 加一家公司就会崩的表，等于一颗定时炸弹。
   */
  if (isBot) return ORG_SHORT[org] ?? orgName ?? org;
  if (isTop) return SHORT(n.version || n.added || "");
  return SHORT(n.added || n.version || "");
};

/**
 * @param domain 画哪个方向的谱系。**必须传** ——
 * 之前直接读全局 `atlas.versions`，于是 /atlas/image/tree 画的是**两个方向混在一起**
 * 的 82 个节点：页头写着「5 条产品线」，图上却是 16 条。
 * 而且混进来之后视频树的标签重叠从 0 涨到 36 —— **一次数据扩容同时坏了两个方向的图**。
 */
export default function Tree({ domain }: { domain: string }) {
  const [pin, setPin] = useState<string | null>(null);
  const [cap, setCap] = useState<string | null>(null);
  const [cut, setCut] = useState(100);
  /** 轴外「更早的发布」是否展开。 */
  const [early, setEarly] = useState(false);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);

  const mine = new Set(atlas.models.filter((m) => (m.domain ?? "video") === domain).map((m) => m.id));
  const nodes = (atlas.versions as unknown as Node[]).filter((v) => mine.has(v.m));
  const all = nodes.map((n) => MS(n.date)).sort((a, b) => a - b);
  /**
   * 轴的起点不取最早那一条。**2024-10 之前只有一个节点**（Lightricks 的
   * LongAnimateDiff，2023-12），线性铺开会让整张图底部空掉四成。
   * 取第二早的做起点，更早的那些贴在轴底单独标出来 —— **不删数据，只是不让它撑空版面**。
   */
  const t0 = all[1] ?? all[0], t1 = all[all.length - 1];
  /**
   * **轴高按节点数给**（负责人 2026-08-11：图像那张「卡片稍微压缩一下高度」）。
   *
   * 原来两个方向都写死 560。视频 69 个节点撑得满，图像只有 25 个 ——
   * 同样的高度落到图像上就是**一屏里三分之一在放空**；纵轴本来就按密度调过间距，
   * 再撑高也不会多出信息。算下来图像 395、视频 562（封顶 560，那棵不变形）。
   *
   * 下限 360 是安全网，不是调出来的效果值。**压缩这件事真正的代价在标签避让上** ——
   * 轴一短，相邻线的顶端就挤到一起，实测在 380 以下逼出了三处重叠，
   * 而那三处全是既有避让逻辑本来就漏的（见下面 textW / 产品线名避让 / 刻度压制）。
   */
  const AXIS_H = Math.max(360, Math.min(560, Math.round(300 + nodes.length * 3.8)));
  const earlier = nodes.filter((n) => MS(n.date) < t0);
  const cutMs = t0 + ((t1 - t0) * cut) / 100;

  /**
   * 时间越晚越靠上 —— 树是往上长的。
   *
   * ## 纯线性刻度会把稀疏的方向画得很空
   *
   * AI 图像 14 个节点里 11 个挤在最后 6 个月，纯线性铺开时**下面三分之二是空的**，
   * 整张图看着像没做完。AI 视频没这个问题（前半段占 53%），
   * 所以这不是「换个好看的画法」，是**同一套线性刻度对两种分布效果差很多**。
   *
   * 做法：线性位置与**经验分位**（这个时刻之前占了多少比例的节点）按权混合。
   * 空白期被压缩、密集期被拉开，**先后顺序完全不变**。
   * 年份网格线用同一个函数算，所以「2025」还是落在 2025-01-01 真正的位置上 ——
   * 刻度没有说谎，只是尺子不均匀，图例里写明了。
   */
  const stamps = useMemo(() => nodes.map((n) => MS(n.date)).sort((a, b) => a - b), [nodes]);
  const quantile = (t: number) => {
    let lo = 0, hi = stamps.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (stamps[mid] < t) lo = mid + 1; else hi = mid; }
    return stamps.length ? lo / stamps.length : 0;
  };
  /** 0 = 纯线性；1 = 纯分位。0.45 是实测：图像不再空，视频几乎不变形。 */
  const MIX = 0.45;
  const frac = (ms: number) => {
    const lin = (Math.max(0, ms - t0)) / (t1 - t0 || 1);
    return MIX * quantile(ms) + (1 - MIX) * lin;
  };
  const y = (d: string) => PAD.t + AXIS_H - Math.min(1, frac(MS(d))) * AXIS_H;

  const lines = useMemo(() => {
    const by = new Map<string, Node[]>();
    for (const n of nodes) by.set(n.m, [...(by.get(n.m) ?? []), n]);
    const arr = [...by.entries()].map(([m, ns]) => {
      const model = atlas.models.find((x) => x.id === m)!;
      const sorted = [...ns].sort((a, b) => MS(a.date) - MS(b.date));
      return { m, model, ns: sorted, first: sorted[0].date };
    }).filter((l) => l.model).sort((a, b) => a.first.localeCompare(b.first));

    /**
     * **横向就是首次出现的先后，没有例外**（负责人 2026-08-11：
     * 「把右侧的 stability 放在最左侧」）。
     *
     * 上一版有条「早夭的短线挪到队尾」的规则，是为了补 AI 视频右下角的空白。
     * 但它把 AI 图像里最老的 Stable Diffusion（2022）扔到了最右边 ——
     * **左到右不再是时间顺序，图就没法读了**。补空白是次要的，
     * 轴的语义是首要的：一条规则要么两个方向都成立，要么不要。
     *
     * 实时交互轨仍排队尾 —— 那不是「排得晚」，是**另一套坐标系**
     * （边生成边看 vs 出片再看），混在中间会被当成同一类比。
     */
    const rt = (l: (typeof arr)[number]) => l.model.class === "realtime";
    const ordered = [...arr.filter((l) => !rt(l)), ...arr.filter(rt)];

    /**
     * **横向均匀铺开**：每条线占等宽的一格，格宽 = 可用宽度 / 条数。
     * 上一版按「老枝伸得远」排，首发早的全挤左、晚的全挤右，疏密极不均。
     */
    /**
     * 格宽**封顶**。原来是「可用宽 / 条数」—— 6 条线摊 1200px，
     * 每格 200px，线与线之间全是空隙，一个孤零零的点飘在最右。
     * 封到 150 之后整组居中，稀疏的方向不再被拉散；
     * 条数多时仍按可用宽平分（视频 16 条算下来 75px，不受影响）。
     */
    const usable = W - PAD.l - PAD.r;
    const slotW = Math.min(150, usable / ordered.length);
    const offset = (usable - slotW * ordered.length) / 2;
    return ordered.map((l, i) => ({
      ...l,
      idx: i,
      slotW,
      cx: PAD.l + offset + slotW * (i + 0.5),
      band: slotW * 0.72,           // 带内分叉铺开的宽度，留 28% 做间隙
      color: ORG_HUE[l.model.org] ?? FALLBACK,
    }));
  }, [nodes]);

  /**
   * 带内的横向布局：**这才是「树」的部分**。
   *
   * 上一版把一条产品线压成一根竖线，Wan2.1 上长出的 FLF2V 和 VACE
   * 全落在同一个 x 上 —— **分叉被整个抹掉了，而分叉正是谱系的意义。**
   *
   * 做法是经典 tidy tree 的横向版：叶子按顺序占槽，父节点取子节点中位。
   */
  const posOf = useMemo(() => {
    const p = new Map<string, { x: number; y: number; color: string }>();
    for (const l of lines) {
      const kids = new Map<string, Node[]>();
      const roots: Node[] = [];
      for (const n of l.ns) (n.parent && l.ns.some((z) => z.id === n.parent) ? kids.set(n.parent, [...(kids.get(n.parent) ?? []), n]) : roots.push(n));
      const slot = new Map<string, number>();
      let next = 0;
      const walk = (n: Node): number => {
        const cs = kids.get(n.id) ?? [];
        if (!cs.length) { const s = next++; slot.set(n.id, s); return s; }
        const ss = cs.map(walk);
        const s = (Math.min(...ss) + Math.max(...ss)) / 2;
        slot.set(n.id, s);
        return s;
      };
      for (const r of roots) walk(r);
      const maxS = Math.max(1, ...[...slot.values()]);
      const usedY: number[] = [];
      for (const n of l.ns) {
        let yy = y(n.date);
        while (usedY.some((u) => Math.abs(u - yy) < 8)) yy -= 8; // 同月发布不叠成一点
        usedY.push(yy);
        const s = slot.get(n.id) ?? 0;
        const x = l.cx + (maxS ? (s / maxS - 0.5) : 0) * l.band;
        p.set(n.id, { x, y: yy, color: l.color });
      }
    }
    return p;
  }, [lines]);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const tick = (now: number) => {
      const d = (now - last) / 1000; last = now;
      // 速度 20→7：跑完从 5 秒变约 14 秒，看得清每一代是怎么长出来的
      setCut((c) => { const n = c + d * 7; if (n >= 100) { setPlaying(false); return 100; } return n; });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  const capsHere = useMemo(() => {
    const ids = new Set(nodes.map((n) => n.cap).filter(Boolean) as string[]);
    return atlas.capabilities.filter((c) => ids.has(c.id));
  }, [nodes]);

  const order = useMemo(() => {
    if (!cap) return new Map<string, number>();
    const first = new Map<string, string>();
    for (const n of [...nodes].sort((a, b) => MS(a.date) - MS(b.date)))
      if (n.cap === cap && !first.has(n.m)) first.set(n.m, n.date);
    return new Map([...first.entries()].sort((a, b) => MS(a[1]) - MS(b[1])).map(([m], i) => [m, i + 1]));
  }, [cap, nodes]);

  const H = PAD.t + AXIS_H + PAD.b;
  const years: number[] = [];
  for (let yr = new Date(t0).getUTCFullYear(); yr <= new Date(t1).getUTCFullYear(); yr++) years.push(yr);
  // 从 t0 那个月的月初起，逐月到 t1 —— 左侧月份刻度用它。
  const months: number[] = [];
  for (let d = Date.UTC(new Date(t0).getUTCFullYear(), new Date(t0).getUTCMonth(), 1); d <= t1; ) {
    if (d >= t0) months.push(d);
    const nx = new Date(d);
    nx.setUTCMonth(nx.getUTCMonth() + 1);
    d = nx.getTime();
  }
  /**
   * 哪些月份刻度**标数字**。季度（4/7/10 月）标，但**离年份标签太近的不标** ——
   * 轴一压缩，「4月」就和「2024」挤在同一行上。
   * 占位与绘制共用这一个判断，两边各写一次必然对不上。
   */
  /**
   * 两个标签**不是画在各自那条线上的**：年份在线上方（基线 `y-3`，12px 字），
   * 月份在线下方（基线 `y+3`，8px 字）。所以拿两条线的 y 相减比的不是字框 ——
   * 实测线距 18.6px 时，两个字框只差 11.6px，照样叠着。
   * **先把基线偏移和字框中心算出来再比**，阈值才有意义。
   */
  const YEAR_C = (yy: number) => yy - 3 - 3.5;   // 基线 -3；12px 字的框中心再高 3.5
  const MONTH_C = (yy: number) => yy + 3 - 2.5;  // 基线 +3；8px 字的框中心再高 2.5
  const GAP = 8.5 + 5.5;                         // 两块字框的半高之和
  const yearYs = years.map((yr) => y(new Date(Date.UTC(yr, 0, 1)).toISOString().slice(0, 10)));
  const tickLabeled = (ms: number) => {
    const mo = new Date(ms).getUTCMonth() + 1;
    if (!(mo % 3 === 1 && mo !== 1)) return false;      // 1 月不标，年份标签已经在那儿
    const c = MONTH_C(y(ymd(ms)));
    return !yearYs.some((v) => Math.abs(YEAR_C(v) - c) < GAP);
  };

  /**
   * **下粗上细**（负责人：既然是树，有分支的该下粗上细）。
   * 一个节点的粗细 = 它下面还挂着多少后代 —— 底座托着整条线所以最粗，
   * 末梢没有后代所以最细。这是真实树干的力学，也是谱系的信息量。
   */
  const weight = useMemo(() => {
    const kids = new Map<string, string[]>();
    for (const n of nodes) if (n.parent) kids.set(n.parent, [...(kids.get(n.parent) ?? []), n.id]);
    const memo = new Map<string, number>();
    const count = (id: string): number => {
      if (memo.has(id)) return memo.get(id)!;
      const c = (kids.get(id) ?? []).reduce((sum, k) => sum + 1 + count(k), 0);
      memo.set(id, c);
      return c;
    };
    const w = new Map<string, number>();
    for (const n of nodes) w.set(n.id, count(n.id));
    return w;
  }, [nodes]);

  /**
   * **标签位置一次性算完**（跨枝防重叠）。
   * 上一版在渲染过程里往数组 push，React 重渲时数组不清空、顺序也不保证 ——
   * 结果仍有 10 对重叠。**布局不能靠渲染副作用**，这里用 useMemo 算成纯数据。
   */
  const { out: labelAt, nameAt } = useMemo(() => {
    const out = new Map<string, { x: number; y: number; side: 1 | -1 | 0 }>();
    const nameAt = new Map<string, number>();   // 产品线名让到哪一行，绘制处要用同一个数
    /**
     * `h` = 这块东西的**半高**。判定用「两块半高之和」，
     * 上抬步长另有其数 —— **一个常量身兼两职，调它必然按下葫芦浮起瓢**
     * （实测：把统一带宽从 9.5 调到 14，视频树重叠从 0 涨到 17）。
     */
    const placed: { x0: number; x1: number; y: number; h: number }[] = [];

    /**
     * **先把「不是节点标签、但也占地方」的东西占上位。**
     *
     * 上一版只算节点标签彼此之间 —— 于是节点标签照样压住
     * ① 左侧的年份刻度、② 每条线顶上的产品线名。
     * 视频方向节点密、这两类被挤开了看不出来；换到只有 13 个节点的 AI 图像
     * 立刻现形：「2026」被 FLUX.2-klein 压住、「Stability」和「Stable Diffu」叠在一起。
     * **稀疏的数据比密集的数据更能暴露布局 bug。**
     */
    for (const yr of years) {
      const yy = y(new Date(Date.UTC(yr, 0, 1)).toISOString().slice(0, 10));
      placed.push({ x0: -9999, x1: PAD.l - 4, y: yy, h: 8 });   // 年份刻度：11px 字
    }
    /**
     * **月份刻度也要占位。** 上一版只占了年份 —— 于是 AI 图像左下角
     * 「SDXL 1.0」「Stable Diffu」两个标签压在「10月」上面。
     * 同一类漏法犯第二次了：**凡是画在图上的字都得进这个数组**，
     * 不能只想着「主要的那些」。
     */
    for (const ms of months) {
      if (!tickLabeled(ms)) continue;   // 没标数字的刻度是根短线，不占字的地方
      placed.push({ x0: -9999, x1: PAD.l - 4, y: y(ymd(ms)), h: 6 });
    }
    /**
     * **产品线名也要避让，不能只占位。**
     *
     * 它一直是「算个框塞进 placed 就完事」—— 别人躲它，它不躲别人。
     * 轴高写死 560 时相邻线的顶端隔得开，看不出问题；一旦按节点数把轴压短，
     * 右侧三条线的顶端挤到一起，「Nano Banana」「HunyuanImage」「Z-Image-Turb」
     * 就直接叠上了。**只占位不避让 = 只在稀疏的数据下成立。**
     */
    for (const l of lines) {
      const top = l.ns[l.ns.length - 1];
      const pt = posOf.get(top.id);
      if (!pt) continue;
      const w = lineNameW(l.model.family);
      const left = lineNameLeft(pt.x, l.model.family);
      const x0 = left ? pt.x - w : pt.x;
      let ny = pt.y - 20;
      /**
       * **这个循环也要有天花板。** 节点标签那边加过了，这边漏了 ——
       * 22 条线时最右那条的产品线名一路让到画布上方 18px，顶端被切掉，
       * 而重叠检查照样是 0（它量相交，量不到「已经不在画面里」）。
       * **同一个错，两个循环** —— 修一处不等于修完。
       */
      let dirN = -1;              // 先往上让；上面到顶了就掉头往下
      for (let g = 0; g < 48; g++) {
        if (!placed.some((q) => Math.abs(ny - q.y) < q.h + 12 && x0 < q.x1 && q.x0 < x0 + w)) break;
        if (ny + dirN * 9.5 < 14) dirN = 1;   // 撞天花板：掉头，别原地落下
        ny += dirN * 9.5;
      }
      nameAt.set(l.m, ny);
      placed.push({ x0, x1: x0 + w, y: ny, h: 12 }); // 产品线名：9.5px 粗体
      // h 从 9 提到 12：占位框的中心按基线算，实际字框中心还要再高 3px 左右 ——
      // 差这 3px，视频树的「Lightricks」就贴着「Allegro」擦过去了。**h 只做判定带，
      // 不是上抬步长**（步长是 BAND），所以调它不会引发上一次那种连锁反弹。
    }
    /**
     * **左边不是无限宽的。**
     *
     * 首末标签原本写死「一律靠左」。最左那条产品线（AI 图像里是 Stability）
     * 左边只有刻度尺栏，标签整个伸进去压住「10月」；而它想上抬避让时，
     * 上面又被第二条线（Midjourney）的左侧标签占满 —— **两个标签为同一块
     * 根本不存在的空地打架**。
     *
     * 判据不是「第几条线」，是**这块字放下去会不会越过刻度栏的右缘**。
     * 越过就翻到节点右侧 —— 最左那条线右侧一定是空的（它右边隔着一整格）。
     */
    /**
     * 轴底那一栏也有东西：**「更早的发布」虚点**（画在轴下 14px）和**脚注**。
     * 起点公司名改到起点下方之后正好落进这一栏 —— 不占位就直接压上去。
     */
    for (const l of lines) {
      const p0 = posOf.get(l.ns[0].id);
      if (p0 && nodes.some((n) => n.m === l.m && MS(n.date) < t0))
        placed.push({ x0: p0.x - 7, x1: p0.x + 7, y: PAD.t + AXIS_H + 14, h: 7 });
    }
    if (earlier.length) placed.push({ x0: -9999, x1: 9999, y: PAD.t + AXIS_H + 56, h: 8 });

    const gutter = PAD.l;   // 左侧刻度尺栏的右缘
    const roomOnLeft = (x: number, w: number) => x - 7 - w >= gutter;
    /**
     * **左边不只有画布边界，还有隔壁那条线。**
     *
     * 顶端标签一律靠左是 16 条线时定的规矩（右边紧挨着产品线名，放右会压住它）。
     * 但 `roomOnLeft` 量的是**画布左边界** —— 于是文本卷里
     * Gemini 的「Gemini 3.6」向左伸了 54px，直接落在 Claude 那一列上；
     * 豆包的「Seed 2.1」同样压住 Kimi。负责人 2026-08-12 圈出的就是这两处。
     *
     * 注意它和 `narrow` 那条交替规则**互补**：交替只在「格子比标签还窄」时才启动，
     * 而这两个标签都比格子窄，于是从来没轮到交替，一路走「靠左」。
     * **窄标签同样会撞邻居，只是撞的是线不是字** —— 0 重叠的检查照不出来。
     *
     * 所以左侧要留到**上一条线的中轴**为止，不是留到画布边。
     */
    const laneL = new Map(lines.map((l, i) => [l.m, i === 0 ? gutter : lines[i - 1].cx + 8]));
    const roomOnLeftOfLane = (m: string, x: number, w: number) => x - 7 - w >= (laneL.get(m) ?? gutter);
    /**
     * **右边也是有边的。** 左边界当时做了，右边界漏了 ——
     * 22 条线里最右那条（Mage-Flow）被「窄格交替」规则派到右侧，
     * 直接伸出画布，顶端被切掉。上一次是上抬越界，这次是横向越界：
     * **凡是「往某个方向让」的逻辑，都要问一句那个方向到哪儿为止。**
     */
    const roomOnRight = (x: number, w: number) => x + 7 + w <= W - 8;
    // 按 y 从上到下排，先来先占 —— 顺序稳定，结果才可复现
    const all = [...nodes].filter((n) => posOf.has(n.id))
      .sort((a, b) => (posOf.get(a.id)!.y - posOf.get(b.id)!.y));
    for (const n of all) {
      const p = posOf.get(n.id)!;
      const l = lines.find((x) => x.m === n.m);
      const isTop = l ? n.id === l.ns[l.ns.length - 1].id : false;
      const isBot = l ? n.id === l.ns[0].id && l.ns.length > 1 : false;
      // 宽度必须按**渲染时那一份文字**算 —— 两处各算一遍，避让就是算歪的
      const txt = l ? labelText(n, l.model.org, orgZh(l.model.org), isTop, isBot) : "";
      // 字号和下面绘制处**必须是同一套**：估宽用错字号，避让就是照着假尺寸算的
      const w = textW(txt, isTop ? 10.5 : isBot || pin === n.id ? 9.5 : 8.5);
      // **首末标签一律放左侧**（负责人：LongAnimDiff 和 HY-Video 放节点左侧）。
      // 末标签右边正好是产品线名，放右侧会压住它；首标签在最左那条线上会顶出画布。
      /**
       * **起点的公司名画在起点下方、居中**（负责人 2026-08-11：「看着更顺眼」）。
       *
       * 顺带解决一个实打实的布局故障：起点在图的最下沿，它左右两侧同时挤着
       * 左邻线的产品线名和左侧刻度尺 —— 视频树里「Lightricks」试满 16 个位置
       * 都没找到空地，于是**原地落下、直接压在「Allegro」上**。
       * 起点下方是整张图唯一空着的地方，挪过去这类争抢就不存在了。
       */
      const below = isBot;
      /**
       * **格子比标签还窄时，顶端标签要左右交替。**
       *
       * 末标签一律靠左的规矩是 16 条线时定的（每格 75px）。图像方向收到 22 条之后
       * 每格只剩 47px，而标签宽七十来像素 —— **每一个都伸进左邻居家里**，
       * 于是相邻两条线的顶端标签必然抢同一块地（Ovis-Image ⨯ NewBie-image）。
       * 按序号奇偶分左右，相邻两条就朝相反方向让开。
       */
      const narrow = (l?.slotW ?? 999) < w;
      const forceLeft =
        isTop && roomOnLeft(p.x, w) &&
        // 左边够不到上一条线才准靠左；够得到就翻到右边去（右边是自己那条线的空档）
        (roomOnLeftOfLane(n.m, p.x, w) || !roomOnRight(p.x, w)) &&
        (!roomOnRight(p.x, w) || !(narrow && (l?.idx ?? 0) % 2 === 1));
      let side: 1 | -1 | 0 = below ? 0 : forceLeft ? -1 : 1;
      let ny = below ? p.y + 15 : p.y;
      /**
       * 碰撞判定带 = 真实字高，不是拍脑袋的数。
       * 原来 ±9.5 判不到「顶端节点标签 vs 产品线名」那一对 ——
       * 它们垂直只差 12px，而 9.5 的带宽刚好漏过去，**字框却是叠的**。
       * 判定带比字框窄，等于给自己发了一张「没有重叠」的假通行证。
       *
       * ⚠️ **但把这个数调大是错的解法**：BAND 同时被用作「碰撞判定带」和
       * 「找不到位置时的上抬步长」。调到 14 之后视频树的重叠从 0 涨到 17 ——
       * 带宽一大，16 次尝试里找不到空位的标签就原地落下，反而全撞在一起。
       * **一个常量身兼两职，调它必然按下葫芦浮起瓢。**
       *
       * 所以带宽退回 9.5（视频侧实测 0 重叠的那个值），
       * 真正的间距问题改到源头解决：产品线名从 -12 挪到 -20（见下方绘制处）。
       */
      const BAND = 9.5;      // 上抬步长
      const MINE = 7;        // 节点标签自己的半高（8.5~10.5px 字，含升降部）
      const hit = (x0: number, x1: number, yy: number) =>
        placed.some((q) => Math.abs(yy - q.y) < q.h + MINE && x0 < q.x1 && q.x0 < x1);
      const xOf = () => (side === 0 ? p.x - w / 2 : side === 1 ? p.x + 7 : p.x - 7 - w);
      /**
       * **上抬有天花板。** 22 条产品线时「Boogu-Image」一路让到 y = -8，
       * 顶端被画布切掉一半 —— 而重叠检查照样是 0：**它量的是矩形有没有相交，
       * 量不到「这块字已经不在画面里了」**。
       * 撞到天花板就改成往下让；下方是自己那条线，挤但不至于看不见。
       */
      const TOP = 12;
      let dir = -1;
      /**
       * 试的次数从 16 提到 48。**16 次不是「够用」，是「放弃得早」** ——
       * 试满之后这个循环会带着最后一个（仍然撞着的）位置退出，**标签就原地落下、
       * 直接压在别人身上**。视频树的 Lightricks、轴压到 460 后图像树右侧那三个
       * 顶端标签，都是这么撞上的：不是避让算错，是根本没试够。
       * 一次 hit 判定只是几十次数组比较，多试三十几轮的代价可以忽略。
       *
       * ⚠️ 2026-08-12 又提到 96：文本卷谱系从 73 个节点补到 128 个之后，
       * Mistral 的「675B 总参 /…」和 DeepSeek 的「V4-Flash-073…」压在了一起 ——
       * 两块字的 y 只差 8.9px，**远小于 14 的碰撞带宽，也就是说避让循环知道它们撞了，
       * 却还是把标签落在了那儿**：48 次试满，带着最后一个仍然撞着的位置退出。
       * 这个失败是静默的 —— 图照画，只是叠着。**节点变密，这个数就得跟着涨。**
       */
      for (let g = 0; g < 96; g++) {
        const x0 = xOf();
        if (!hit(x0, x0 + w, ny)) break;
        if (ny + dir * BAND < TOP) dir = 1;              // 抬到头了，掉头往下让
        if (below) ny += BAND;                           // 起点标签往下让，那边是空的
        else if (forceLeft) ny += dir * BAND;            // 末标签不翻到右边，只上下让
        else if (side === 1) side = -1;
        else { side = roomOnRight(p.x, w) ? 1 : -1; ny += dir * BAND; }
      }
      const fx0 = xOf();
      placed.push({ x0: fx0, x1: fx0 + w, y: ny, h: MINE });
      out.set(n.id, { x: p.x, y: ny, side });
    }
    return { out, nameAt };
  }, [nodes, posOf, lines, t0, earlier.length, AXIS_H]);   // years/months 由 t0/t1 决定，t0/t1 又由 nodes 决定，不必单列

  const hot = pin ? nodes.find((n) => n.id === pin) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <button onClick={() => { if (cut >= 100) setCut(0); setPlaying(!playing); }}
          className="px-3 py-1 rounded border border-yes text-yes hover:bg-yes hover:text-paper">
          {playing ? "⏸ 暂停" : "▶ 按时间长出来"}
        </button>
        <input type="range" min={0} max={100} value={cut}
          onChange={(e) => { setPlaying(false); setCut(+e.target.value); }}
          className="flex-1 min-w-[160px] max-w-[340px] accent-[var(--color-yes)]" aria-label="时间游标" />
        <b className="text-ink tabular-nums">{ymd(cutMs).slice(0, 7)}</b>
        <span className="text-muted tabular-nums">{nodes.filter((n) => MS(n.date) <= cutMs).length}/{nodes.length}</span>
        <span className="text-muted ml-auto">谁先谁后：</span>
        <button onClick={() => setCap(null)}
          className={`px-2 py-0.5 rounded border ${!cap ? "border-yes text-yes" : "border-rule text-muted hover:text-ink"}`}>全部</button>
        {capsHere.map((c) => (
          <button key={c.id} onClick={() => setCap(cap === c.id ? null : c.id)}
            className={`px-2 py-0.5 rounded border ${cap === c.id ? "border-yes text-yes" : "border-rule text-muted hover:text-ink"}`}>
            {c.zh}
          </button>
        ))}
      </div>

      {cap && (
        <p className="text-[15px] border border-yes/40 bg-yes/6 rounded-lg px-3 py-2">
          <b className="text-ink">
            {[...order.entries()].map(([m, i]) => (
              <span key={m}>{i > 1 && " → "}{i}. {atlas.models.find((x) => x.id === m)?.family}</span>
            ))}
          </b>
        </p>
      )}

      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[900px]" style={{ height: H }}>
          {/* 月份刻度：左侧一把「尺子」—— 每月一个短刻度，季度（1/4/7/10 月）标月份数字。
              原来只有 2025/2026 两条年线，太粗，看不出一条线上两个节点隔了几个月。 */}
          {months.map((ms) => {
            const yy = y(ymd(ms));
            const mo = new Date(ms).getUTCMonth() + 1;
            const quarter = tickLabeled(ms);
            return (
              <g key={`mo-${ms}`}>
                <line x1={PAD.l - 34} x2={PAD.l - (quarter ? 26 : 30)} y1={yy} y2={yy} stroke="var(--color-rule)" />
                {quarter && (
                  <text x={PAD.l - 38} y={yy + 3} textAnchor="end" fontSize="8" fill="var(--color-muted)" opacity={0.75}>
                    {mo}月
                  </text>
                )}
              </g>
            );
          })}
          {/* 年份横线：全宽虚线，比月份刻度显眼，做粗分隔 */}
          {years.map((yr) => {
            const ms = Date.UTC(yr, 0, 1);
            if (ms < t0 || ms > t1) return null;
            const yy = y(ymd(ms));
            return (
              <g key={yr}>
                <line x1={PAD.l - 34} x2={W - 20} y1={yy} y2={yy} stroke="var(--color-rule)" strokeDasharray="3 5" />
                <text x={PAD.l - 40} y={yy - 3} textAnchor="end" fontSize="12" fontWeight="700" fill="var(--color-ink)">{yr}</text>
              </g>
            );
          })}

          {/*
            **树根与主干**（负责人 2026-08-09）：那张 LLM 演化树之所以是「一棵树」，
            是因为所有分支汇到一个共同的根 —— 不是权重派生，是 **Transformer 架构**。
            视频这边同理：**扩散模型是共同的根**，DiT / 混合 / 自回归是从根上分出的主干。
            我们原来是 14 根各自从底部冒出来的独立竖线，看着像草不像树 —— 这里补上。
          */}
          {/* 起点下方那截「根须」已删（负责人：每个起点下面带个小尾巴是为什么）。
              它本来想表示「这条线在这一刻出现」，但既然不做树根，它就只是装饰 ——
              节点本身的位置已经说明了出现时间。 */}

          {/* 血缘的边：先画，节点压在上面 */}
          {/* **同一条线按时间顺序全连上**（负责人：Runway 断掉了，管它有没有关系，
              它就是 Runway，连起来）。原来只连有 parent 的节点，Runway 的 Aleph 2.0
              没登记 parent 就成了孤点。既然这张图不讲血缘，连的就该是「同一条产品线
              的先后」—— parent 有就用 parent，没有就接上这条线里时间上的前一个。 */}
          {nodes.filter((n) => posOf.has(n.id)).map((n) => {
            const line = lines.find((l) => l.m === n.m);
            const seq = line?.ns ?? [];
            const idx = seq.findIndex((x) => x.id === n.id);
            const prevId = (n.parent && posOf.has(n.parent)) ? n.parent
              : idx > 0 ? seq[idx - 1].id : null;
            if (!prevId || !posOf.has(prevId)) return null;
            const a = posOf.get(prevId)!, b = posOf.get(n.id)!;
            const on = MS(n.date) <= cutMs;
            const lit = !cap || n.cap === cap;
            const dim = pin && nodes.find((x) => x.id === pin)?.m !== n.m;
            // 有机曲线：从父节点向上弯到子节点，不用直角折线
            const my = (a.y + b.y) / 2;
            return (
              <path key={`e-${n.id}`}
                d={`M${a.x},${a.y} C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`}
                fill="none" stroke={b.color} strokeLinecap="round"
                // 后代越多越粗：底座 ~4px，末梢 ~1.2px
                strokeWidth={1.2 + Math.min(3, (weight.get(prevId) ?? 0) * 0.45)}
                opacity={on ? (lit && !dim ? 0.6 : 0.12) : 0}
                style={{ transition: "opacity .35s" }} />
            );
          })}

          {/* 每条线标首末两个节点 —— 上一版只标最新一个，67 个点里 53 个是哑点，
              「看不出是什么」的最直接原因。末节点标产品线名（它长成了什么），
              首节点标它出道时叫什么（这条线从哪来）。 */}
          {/*
            **每个节点都带名字**（负责人 2026-08-09）。参考图 100+ 个叶子全是带名方块，
            我们原来 67 个点只有 14 个顶端有名、53 个是哑点 —— 那是「看着差」最直接的一条。
            做法：标签写在节点右侧，同一条线内按 y 排序做避让（挤不下就左右交替），
            末节点仍加粗并配公司名。
          */}
          {/* **占位表是全图共用的**（负责人：不同树枝节点之间不要遮挡重叠）。
              上一版每条线各算各的，同一条线内不撞，**邻线之间照撞**。
              现在记下已占用的矩形（x 范围 + y），谁都得躲开谁。 */}
          {lines.map((l) => {
            const sorted = [...l.ns].sort((a, b) => (posOf.get(a.id)?.y ?? 0) - (posOf.get(b.id)?.y ?? 0));
            const top = l.ns[l.ns.length - 1];
            return (
              <g key={`lbl-${l.m}`}>
                {sorted.map((n) => {
                  const p = posOf.get(n.id);
                  if (!p) return null;
                  const isTop = n.id === top.id;
                  const isBot = n.id === l.ns[0].id && l.ns.length > 1;
                  const on = MS(n.date) <= cutMs;
                  /**
                   * **中间节点的标签默认全隐**（负责人：67 个标签把整幅图污染了）。
                   * 只在三种时候露出来：
                   *   ① 末节点 —— 那是产品线名与当前版本，图的骨架，常驻
                   *   ② 正在「长出来」—— 播放或拖动时间轴时，刚长到的那一批亮起
                   *   ③ 被点中 —— 读者主动要看这一条
                   * 平时图上只有 14 个末标签 + 节点，干净。
                   */
                  const scrubbing = playing || cut < 99.5;
                  const justGrown = scrubbing && MS(n.date) > cutMs - (t1 - t0) * 0.05;
                  // **首末两端常驻**（负责人要求），中间的仍默认隐藏
                  const showLabel = on && (isTop || isBot || pin === n.id || justGrown);
                  // **起点写公司简称**（负责人定），末端写当前版本，中间写这一代新增了什么。
                  // 起点原来写的是首版本名，而 HY / Veo 的首版本名就等于产品线名 ——
                  // 线尾已经标着产品线名，起点再写一遍是复述；写公司才是新信息。
                  const txt = labelText(n, l.model.org, orgZh(l.model.org), isTop, isBot);
                  const lp = labelAt.get(n.id) ?? { x: p.x, y: p.y, side: 1 as 1 | -1 };
                  const side = lp.side, ny = lp.y;
                  // **不用 version** —— 同一条线里它大量重复（HunyuanVideo 出现 5 次、
                  // Wan2.2 出现 4 次），重复的标签等于没有标签。用「这一代新增了什么」。
                  // 末节点例外：那里要的是产品线当前版本号。
                  return (
                    <g key={`n-${n.id}`} opacity={showLabel ? 1 : 0} style={{ transition: "opacity .3s" }}>
                      <text x={p.x + side * 8} y={ny + 3}
                        textAnchor={side === 0 ? "middle" : side === 1 ? "start" : "end"}
                        fontSize={isTop ? 10.5 : isBot || pin === n.id ? 9.5 : 8.5}
                        fontWeight={isTop || isBot || pin === n.id ? 700 : 400}
                        fill={isTop || isBot || pin === n.id ? l.color : "var(--color-muted)"}
                        opacity={isTop || isBot || pin === n.id ? 1 : 0.85}>
                        {txt}
                      </text>
                    </g>
                  );
                })}
                {/* 公司名压在这条线最新节点的上方 */}
                {(() => {
                  const pt = posOf.get(top.id)!;
                  const on = MS(top.date) <= cutMs;
                  return (
                    /* -20 而不是 -12：与顶端节点标签拉开真实间距。
                       12px 的间距在两个字框（10.5px + 9.5px 字号，含升降部）下是叠的，
                       靠调碰撞带宽去救会连累整张图 —— 源头拉开才对。 */
                    <text x={pt.x} y={nameAt.get(l.m) ?? pt.y - 20}
                      textAnchor={lineNameLeft(pt.x, l.model.family) ? "end" : "start"}
                      fontSize="9.5" fontWeight="700"
                      fill={l.color} opacity={on ? 1 : 0.15} style={{ transition: "opacity .35s" }}>
                      {SHORT(l.model.family)}
                    </text>
                  );
                })()}
              </g>
            );
          })}

          {/* 靠左对齐，不能用 end —— end 会把「2023-12 起」推出画布左边（刚才裁成了「3-12 起」）。
              另：JSX 注释不能和元素并列当兄弟，这个错今天犯了第三次。 */}
          {/**
            * **轴外的更早节点做成虚点，钉在轴底、点得开。**
            *
            * 之前只在角落写一行「更早还有 N 条」—— 那等于告诉你有东西但不给你看。
            * AI 图像这边尤其明显：SD 1.4 是 2022-08，比轴起点早了快一年，
            * 线性铺开会让整张图空掉一半，可它又是这条线的起点、不能不画。
            * 折中：在它所属那条线的 x 上画一个**虚线空心点**贴着轴底，
            * 点一下把这些更早的发布列出来（日期 + 这一代加了什么）。
            */}
          {earlier.map((n) => {
            const l = lines.find((x) => x.m === n.m);
            const p = l ? posOf.get(l.ns.find((k) => MS(k.date) >= t0)?.id ?? "") : null;
            if (!l || !p) return null;
            return (
              <g key={`early-${n.id}`} style={{ cursor: "pointer" }}
                onClick={() => setEarly((v) => !v)}>
                {/**
                  * **命中区要单独给。** 上面那个虚点是 `fill="none"` ——
                  * SVG 里没有填充的图形**内部不接收点击**，只有描边那一圈能点到。
                  * 实测：Playwright 点圆心毫无反应，点旁边的文字却好使；
                  * 真人点圆心同样点不中。铺一个透明的大圆当热区。
                  */}
                <circle cx={p.x} cy={PAD.t + AXIS_H + 14} r={11} fill="transparent" />
                <circle cx={p.x} cy={PAD.t + AXIS_H + 14} r={4.5} pointerEvents="none"
                  fill="none" stroke={l.color} strokeWidth={1.4} strokeDasharray="2.5 2" />
                <line x1={p.x} y1={PAD.t + AXIS_H + 9} x2={p.x} y2={y(ymd(t0))}
                  stroke={l.color} strokeWidth={1} strokeDasharray="2 3" opacity={0.45} />
              </g>
            );
          })}
          {earlier.length > 0 && (
            <text x={6} y={PAD.t + AXIS_H + 56} fontSize="11" fill="var(--color-muted)"
              style={{ cursor: "pointer" }} onClick={() => setEarly((v) => !v)}>
              轴起于 {ymd(t0).slice(0, 7)}；更早还有 {earlier.length} 条（{ymd(Math.min(...earlier.map((n) => MS(n.date)))).slice(0, 7)}）
              {" "}—— 点虚点{early ? "收起" : "展开"}
            </text>
          )}

          {nodes.map((n) => {
            const p = posOf.get(n.id);
            if (!p) return null;
            const on = MS(n.date) <= cutMs;
            const lit = !cap || n.cap === cap;
            const dim = pin && nodes.find((x) => x.id === pin)?.m !== n.m;
            const m = atlas.models.find((x) => x.id === n.m);
            // 实心＝这一代权重是公开的；空心＝闭源。**换向的节点会一眼看出来。**
            const openHere = m?.weights === "open" || (m?.id === "hailuo" && n.version === "H3")
              || (m?.id === "wan" && ["2.1", "2.2", "Wan2.1", "Wan2.2"].includes(n.version));
            const rank = cap ? order.get(n.m) : undefined;
            return (
              <g key={n.id} style={{ cursor: "pointer", transition: "opacity .35s" }}
                opacity={on ? (lit && !dim ? 1 : 0.18) : 0}
                onClick={() => setPin(pin === n.id ? null : n.id)}>
                <circle cx={p.x} cy={p.y} r={pin === n.id ? 6.5 : 4.5}
                  fill={openHere ? p.color : "var(--color-paper)"} stroke={p.color} strokeWidth="2" />
                {rank && (
                  <>
                    <circle cx={p.x + 13} cy={p.y} r="7.5" fill={p.color} />
                    <text x={p.x + 13} y={p.y + 3} textAnchor="middle" fontSize="10" fontWeight="700"
                      fill="var(--color-paper)">{rank}</text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* 虚点点开后的清单。**不做弹窗** —— 弹窗会盖住图，而这些条目本来就是图的一部分，
          就近展开、能同时看到图和清单更合适。 */}
      {early && earlier.length > 0 && (
        <div className="border border-rule rounded-xl bg-card px-4 py-3 mb-3 text-[13px] leading-relaxed">
          <p className="font-semibold mb-1.5">
            轴外更早的发布（{earlier.length} 条）
            <span className="font-normal text-muted ml-2">
              早于 {ymd(t0).slice(0, 7)}，铺进主轴会让整张图空掉一半，所以单列
            </span>
          </p>
          {[...earlier].sort((a, b) => MS(a.date) - MS(b.date)).map((n) => {
            const l = lines.find((x) => x.m === n.m);
            return (
              <p key={n.id} className="flex flex-wrap items-baseline gap-x-2 border-t border-rule pt-1.5 mt-1.5">
                <span className="tabular-nums text-muted text-[12px] w-[80px]">{n.date}</span>
                <b style={{ color: l?.color }}>{SHORT(l?.model.family ?? n.m)}</b>
                <span>{n.version}</span>
                <span className="text-muted">{n.added}</span>
              </p>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-muted">
        {/*
          **开不开源只看实心/空心，不看颜色。**
          之前图例写「绿系=开源家族、彩色=闭源家族」，同时又写「实心=权重公开」——
          两套都叫开源/闭源，结论还能相反（MiniMax 紫色=闭源家族，但 H3 是实心=权重公开），
          负责人当场问「公开权重不就是开源吗」。**是分类有毛病，不是他没看懂。**
          真相：开不开源是**逐代变**的（万相开源起家、3.0 转闭源；海螺闭源起家、H3 放权重），
          按「家族」贴死标签本身就错。所以颜色退回只做一件事：区分各条产品线。
        */}
        <span>
          <b className="text-ink">实心</b> = 这一代权重公开，<b className="text-ink">空心</b> = 没公开。
          <b className="text-ink">开不开源看点，不看颜色</b> —— 颜色只用来区分这 {lines.length} 条产品线。
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="34" height="13">
            <circle cx="5" cy="6.5" r="4.5" fill="#1f6f5c" />
            <circle cx="16" cy="6.5" r="4" fill="var(--color-paper)" stroke="#7a5cc4" strokeWidth="2" />
            <circle cx="28" cy="6.5" r="4.5" fill="#b06a2c" />
          </svg>
          同一条线上实空混着 = 它中途换过向
          {domain === "video" && "（万相开源起家、3.0 转闭源；海螺相反，H3 才放权重）"}
        </span>
        {/* **改了刻度就要说。** 年份线仍落在真实日期上，只是间距按节点密度调过 ——
            不写出来就是偷偷改尺子。 */}
        <span>
          纵轴间距按节点密度调过（空白期压缩、密集期拉开），<b className="text-ink">先后顺序不变</b>
        </span>
        <span>产品线名旁是公司名 · <b className="text-ink">拖时间轴</b>看每一代长出来 · <b className="text-ink">点任一节点</b>看它加了什么</span>
        <Link href="/method#genealogy" className="underline hover:text-ink">这张图怎么读 →</Link>
      </div>

      {hot && (
        <div className="border border-rule rounded-lg bg-card p-3 flex flex-col gap-1">
          <p className="text-[15px]">
            <b className="text-ink">{atlas.models.find((m) => m.id === hot.m)?.family} {hot.version}</b>
            <span className="text-muted text-[13px] ml-2">{orgOf(hot.m)?.zh} · {hot.date}</span>
          </p>
          <p className="text-[14px]">新增：<b className="text-ink">{hot.added}</b></p>
          <p className="text-muted text-[12px] leading-relaxed">
            原文：「{hot.quote}」
            <a href={atlas.sources[hot.src]?.url} target="_blank" rel="noreferrer" className="underline ml-1.5 hover:text-yes">
              {atlas.sources[hot.src]?.name}
            </a>
          </p>
          {/**
            * **点开的这一代，要有自己的去处。** 负责人 2026-08-13：
            *「很明显我们需要为演进树里已经不是最新的模型也建立档案？」
            * 在这之前，浮层里读完就断了 —— 唯一的出口是产品线页，
            * 而那里显示的是**当前版本**，点开的却是历史那一代。
            */}
          <Link href={`/release/${hot.id}`} className="text-[13px] underline hover:text-yes self-start">
            这次发布的档案（来源原文、前后代）→
          </Link>
          <Link href={modelHref(hot.m)} className="text-[13px] underline hover:text-yes self-start">
            {label(atlas.models.find((m) => m.id === hot.m)!)} 的完整能力 →
          </Link>
        </div>
      )}
    </div>
  );
}
