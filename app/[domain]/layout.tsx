import { atlas } from "@/lib/atlas";

/**
 * 方向路由段。`/atlas/video/*` 与 `/atlas/image/*`。
 *
 * **为什么每个方向都要有前缀，包括第一个。**
 * 之前是「视频在根上、图像在 /image」—— 那等于把第一个方向当成默认、
 * 后来的都是附属品。加第三个方向时这个不对称会立刻变成负担：
 * 根到底属于谁？所以负责人定：**两个都带前缀**，根路径改成方向选择页。
 *
 * 静态导出下每个方向都会被预渲染成一套独立页面（见各页的 generateStaticParams）。
 */
export function generateStaticParams() {
  return atlas.domains.map((d) => ({ domain: d.id }));
}

export default function DomainLayout({ children }: { children: React.ReactNode }) {
  return children;
}
