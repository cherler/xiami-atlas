import { atlas, label, type Model } from "./atlas";

/**
 * 「能力对了 ≠ 你用得上」—— **这个产品最值钱、别处最难拼的一类事实。**
 *
 * 它值钱有两个原因：**反直觉**，而且**能防止真金白银的损失**。
 * 一个人查完能力表以为可以了，下单才发现平台上架的是旧版本、
 * 或者上游已经公告停服、或者他在大陆根本连不上。
 *
 * ## 全部算出来，一条都不手写
 *
 * 手写的清单必然过期：数据一改，清单还停在旧事实上。
 * 这里的每一条都是从 `availability` / `models` / `pricing` 现算的 ——
 * **数据变了，清单跟着变；某天不再成立，它就自己消失。**
 */
export type Caveat = {
  kind: "stale-version" | "upstream-gone" | "coming-soon" | "price-varies" | "blocked" | "discount-trap";
  /** 一句话说清楚坑在哪。 */
  what: string;
  /** 具体是哪个模型/平台，让读者能点过去。 */
  m?: string;
  p?: string;
  src?: string;
  quote?: string;
};

const pf = (id: string) => atlas.platforms.find((x) => x.id === id)?.name ?? id;
const md = (id: string) => atlas.models.find((x) => x.id === id);
const nm = (id: string) => { const m = md(id); return m ? label(m) : id; };

/**
 * **这一页不讲转售商。**（负责人 2026-08-11 定：把 Replicate 与 APIYI 从这页去掉）
 *
 * 它们是 API 市场与聚合商，不是模型的来源。把「Replicate 还挂着已停服的 Sora 2」
 * 写成一条告诫，实际效果是**告诉读者去哪儿还能买到停服的模型** ——
 * 那不是这一页要干的事。这一页要回答的是「厂商这边有什么坑」。
 *
 * ⚠️ **只在这一页过滤，不删数据。** `availability` 里那 12 条照旧留着，
 * `/where` 仍然照实告诉你哪些平台上架了什么 —— **少一条事实和换个地方说，是两回事**。
 *
 * 判据用平台的 `kind` 而不是写死 id：以后再接一家聚合商，不用回来改这里。
 */
const MIDDLEMAN = /市场|聚合/;
const isMiddleman = (pid?: string) =>
  !!pid && MIDDLEMAN.test(atlas.platforms.find((x) => x.id === pid)?.kind ?? "");

export function caveats(): Caveat[] {
  const out: Caveat[] = [];

  /**
   * **在入口就把转售商滤掉，不在出口筛。**
   * 出口筛漏得掉「各平台不同价」那一类 —— 它没有 `p` 字段，
   * 平台名藏在拼出来的 quote 里，按 `p` 过滤根本碰不到它。
   * 从输入滤，比价时那一边就只剩厂商渠道，只剩一家自然也就不成其为「不同价」。
   */
  const availability = atlas.availability.filter((v) => !isMiddleman(v.p));
  const pricing = atlas.pricing.filter((q) => !isMiddleman(q.p));
  const discount = atlas.discount.filter((d) => !isMiddleman(d.p));

  // ① 上架的不是当前主力版本 —— 能力表说「支持」，你买到的却是上一代
  for (const v of availability.filter((x) => x.match === "older"))
    out.push({
      kind: "stale-version", m: v.m, p: v.p, src: v.src, quote: v.quote,
      what: `${pf(v.p)} 上架的是「${v.listed}」，不是当前的 ${nm(v.m)}`,
    });

  // ② 上游已经停服，平台还在卖 —— 这一条最能造成实际损失
  for (const v of availability) {
    const m = md(v.m);
    if (m?.status === "discontinued" && v.status !== "gone")
      out.push({
        kind: "upstream-gone", m: v.m, p: v.p, src: v.src, quote: v.quote,
        // ⚠️ **不要把 status_note 整段倒出来** —— 那里面混着我们的工作过程
        // （「采集器返回 403」「按规则四降到 Extended」），那是我们的话，不是用户要的事实。
        // 用户要的是：什么时候停、现在还能不能买到。用 status_short 这个短字段。
        what: `${nm(v.m)} 上游已公告停服${m.status_short ? `（${m.status_short}）` : ""}，${pf(v.p)} 还挂着`,
      });
  }

  // ③ 标着 coming soon，还不能用
  for (const v of availability.filter((x) => x.status === "coming-soon"))
    out.push({
      kind: "coming-soon", m: v.m, p: v.p, src: v.src, quote: v.quote,
      what: `${pf(v.p)} 的 ${nm(v.m)} 标着 coming soon，现在还调不了`,
    });

  // ④ 同一个模型，不同平台不是一个价 —— 不指定平台，「多少钱」就没有答案
  const byModel = new Map<string, typeof atlas.pricing>();
  for (const q of pricing.filter((x) => x.unit === "per-second"))
    byModel.set(q.m, [...(byModel.get(q.m) ?? []), q]);
  for (const [m, qs] of byModel)
    if (qs.length > 1)
      out.push({
        kind: "price-varies", m,
        what: `${nm(m)} 在 ${qs.map((q) => pf(q.p)).join(" / ")} 上不是一个价`,
        src: qs[0].src, quote: qs.map((q) => `${pf(q.p)}：${q.tiers?.[0]?.label} ${q.currency === "CNY" ? "¥" : "$"}${q.tiers?.[0]?.v}/秒`).join("；"),
      });

  // ⑤ 大陆直连不通 —— 对国内读者，这一条排在能力之前
  for (const m of atlas.models.filter((x) => x.reach_cn === "blocked" && (x.tier ?? "core") === "core"))
    out.push({
      kind: "blocked", m: m.id,
      what: `${label(m)} 的官方站在大陆不走代理连不上`,
      quote: m.reach_note,
    });

  // ⑥ 折扣陷阱：有折扣，但不覆盖它自己的主力
  for (const d of discount)
    if (/不支持|暂不/.test(d.off + d.rule))
      out.push({
        kind: "discount-trap", m: d.m, p: d.p, src: d.src, quote: d.quote,
        what: `${pf(d.p)} 的优惠不覆盖 ${nm(d.m)}`,
      });

  return out;
}

export const CAVEAT_ZH: Record<Caveat["kind"], string> = {
  "stale-version": "上架的不是当前版本",
  "upstream-gone": "上游停服了，平台还在卖",
  "coming-soon": "标着有，其实还不能用",
  "price-varies": "同一个模型，各平台不同价",
  blocked: "大陆直连不通",
  "discount-trap": "优惠不覆盖主力型号",
};
