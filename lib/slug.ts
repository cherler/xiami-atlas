import { atlas, type Capability, type Model } from "./atlas";

/**
 * URL 用的 slug。
 *
 * **必须稳定** —— §19 的分享机制与 §20 的 SEO 都建在 URL 上：
 * 一个被人存下来、被搜索引擎收录的地址，改一次就断一次。
 *
 * 所以 slug 从 **id** 生成，不从 family 或 version 生成 ——
 * `Wan 2.5 → 2.7 → 3.0` 一路改，而 id 始终是 `wan`。
 * 版本变了，`/model/wan` 这个地址不变，页面内容跟着变。**那正是我们要的。**
 */
export const modelSlug = (m: Model) => m.id;
export const capSlug = (c: Capability) => c.id;

export const modelBySlug = (s: string) => atlas.models.find((m) => m.id === s);
export const capBySlug = (s: string) => atlas.capabilities.find((c) => c.id === s);

export const modelHref = (m: Model | string) => `/model/${typeof m === "string" ? m : m.id}`;
export const capHref = (c: Capability | string) => `/capability/${typeof c === "string" ? c : c.id}`;

/** 专项里的项目页。项目是主角，有自己的地址；专项页是把它们连起来的网。 */
export const topicProjectHref = (topic: string, project: string) => `/topic/${topic}/${project}`;
