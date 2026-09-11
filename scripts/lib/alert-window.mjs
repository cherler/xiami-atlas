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
