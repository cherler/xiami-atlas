/**
 * 快讯挂多久 —— **这个口径只有这一份。**
 *
 * `alert.mjs` 按它挑在架的，`validate.mjs` 按它数条数、判上限。
 * 2026-08-19 这两处各算各的，一处认默认值一处不认：
 * 同一批数据，alert 说「在架 3 条」，validate 说「在架 4 条」并触发上限报错。
 * 症状是构建被拦下，**而被拦的原因是假的** —— 比不拦更费时间。
 */

/**
 * 一期 = 7 天。
 *
 * 上一版是 30 天，负责人 08-19 判太久：挂满一个月的快讯第二周起就是背景板，
 * 而横幅一旦被学会忽略，下一条真要紧的也一起没人看。
 *
 * 为什么是 7：源的 `refresh_days` 里 7 天那一档最多（448 个源里 105 个），
 * **一周之内这条事实多半已经被下一轮采集重新核过一遍** —— 到那时它要么进了正文，要么该下架。
 */
export const CYCLE_DAYS = 7;

const plusDays = (d, n) => new Date(Date.parse(d) + n * 864e5).toISOString().slice(0, 10);

/** 这条快讯挂到哪天。**不写 `until` 就是 date + 一期**；写了就按写的（上限仍是一期，R97 管）。 */
export const untilOf = (e) => String(e.alert?.until ?? plusDays(e.date, CYCLE_DAYS));

/** 今天还在架吗。 */
export const isLive = (e, today = new Date().toISOString().slice(0, 10)) =>
  Boolean(e.alert) && untilOf(e) >= today;

/**
 * **新增与换代自动上头条 —— 不靠人记得写 `alert`。**
 *
 * 负责人 2026-09-23：「新增或者新更新的内容，要保持头条展示新增。」
 * 查下来这条一直没兑现：`changes.json` 里 57 条事件，**只有 1 条手写过 `alert`**，
 * 而它 2026-08-24 就过期了 —— 横幅已经空了整整一个月。
 * 同一份文档开头写着「一个要靠人记得删的横幅，就是会挂一年的横幅」；
 * 反过来也成立：**一个要靠人记得加的头条，就是永远空着的头条。**
 *
 * 所以「新模型 / 版本更迭」在一期之内自动上架，`subject` 当标题。
 * 手写的 `alert.headline` 仍然优先 —— 那是编辑的声音，自动的只是兜底。
 *
 * ⚠️ **门槛没有降低**：只有这两类会自动上，生命周期 / 价格 / 口径这些都不会；
 * 未来日期的不算（预告停服不是「新增」）；同时在架仍然是 3 条上限。
 */
export const AUTO_KINDS = new Set(["新模型", "版本更迭", "version"]);

/** 这一条够不够自动上头条。**不改 `isLive`** —— 手写的那套判据一个字没动。 */
export const isAutoLive = (e, today = new Date().toISOString().slice(0, 10)) =>
  !e.alert &&
  AUTO_KINDS.has(String(e.kind)) &&
  String(e.date) <= today &&
  String(e.date) >= plusDays(today, -CYCLE_DAYS);

/** 自动那条的标题：就用 `subject`，不另造一句话。 */
export const headlineOf = (e) => String(e.alert?.headline ?? e.subject ?? e.id);

/**
 * **在架的那几条，只有这一个算法。**
 *
 * `alert.mjs` 按它出横幅，`validate.mjs` 按它数条数 —— 两处各算各的后果这份文件开头写着。
 * 手写的排在前（编辑挑过的优先），其余按日期倒序，**截到 3 条**；
 * 被截掉的条数由 `more` 交出去，**不许悄悄少一条**。
 */
export const MAX_LIVE = 3;
export const liveAlerts = (events, today = new Date().toISOString().slice(0, 10)) => {
  const hand = events.filter((e) => isLive(e, today));
  const auto = events.filter((e) => isAutoLive(e, today));
  const byDate = (x, y) => String(y.date).localeCompare(String(x.date));
  const all = [...hand.sort(byDate), ...auto.sort(byDate)];
  return { items: all.slice(0, MAX_LIVE), more: Math.max(0, all.length - MAX_LIVE), hand, auto };
};
