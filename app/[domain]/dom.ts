import { notFound } from "next/navigation";
import { atlas, type Domain } from "@/lib/atlas";

/**
 * 取路由段对应的方向。**不存在就 404，不要兜底成第一个** ——
 * 兜底会让 `/atlas/typo` 渲染出视频的内容，200 + 错内容比 404 难查得多
 * （这个项目在「200 但内容是错的」上栽过不止一次）。
 */
export function domainOf(id: string): Domain {
  const d = atlas.domains.find((x) => x.id === id);
  if (!d) notFound();
  return d;
}
