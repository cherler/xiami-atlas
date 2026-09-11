import type { Metadata } from "next";
import Link from "next/link";
import { atlas, domainModels, tracksOf } from "@/lib/atlas";
import Share from "@/components/Share";

/**
 * `/atlas` 根路径 = **方向选择页**。
 *
 * 每个方向都带自己的前缀（`/atlas/video`、`/atlas/image`），包括第一个 ——
 * 负责人 2026-08-11 定。**不让第一个方向霸占根路径**：那会让它看起来是「主体」、
 * 后来的都是附属品，加第三个方向时这个不对称立刻变成负担（根到底属于谁？）。
 *
 * 静态导出没有服务端重定向，所以这里不是跳转，是一页真正的入口 ——
 * 它顺带回答了一个之前没地方回答的问题：**这个站到底covers 几个方向、各自做到哪一步了。**
 */
export const metadata: Metadata = {
  title: "AI 能力核验 —— 谁能做什么，每一格都带官方原文",
  description: "按方向分卷：AI 视频、AI 图像。能力矩阵、演化谱系、公司关系、应用路线，每条事实都带厂商官方来源与核验日期。",
};

export default function Pick() {
  return (
    <main data-page="home" className="max-w-[1000px] mx-auto px-6 py-12">
      <header className="flex items-end gap-4 border-b-[2.5px] border-ink pb-3">
        <h1 className="text-[38px] leading-[1.05] font-bold tracking-[-.01em]">
          先选一个方向
          <span className="block text-[15px] leading-[1.3] font-normal text-muted mt-2">
            每个方向一套独立的能力轴 —— 硬并成一张表会把两边都讲错
          </span>
        </h1>
        {/* 右上角，和其余各页同一个位置 —— 一个每页都在别处的按钮，等于每页都要重新找 */}
        <div className="ml-auto whitespace-nowrap">
          <Share og="/atlas/og/index-16x9.png" title="虾米看AI · AI 能力核验" />
        </div>
      </header>

      {/**
        * **九张卡要一屏放得下。** 负责人 2026-08-15：「首页现在 9 个方向一页
        * 已经无法完全展示了。」
        *
        * 原来是单列 `flex-col` + `py-5` + 26px 标题 —— 四个方向时刚好，
        * 九个就顶到两屏半。**这不是审美问题**：首页第一句话是「先选一个方向」，
        * 而选择项要滚动才能看全，那句话就落空了。
        *
        * 改成栅格：手机两列、桌面三列 —— 桌面九张正好三行，实测 1440×900 与
        * 1280×800 都是 9/9 在首屏内（最后一张底部 553px）。
        *
        * ⚠️ **手机上没有硬凑一屏。** 单列时只放得下 5 张，但要九张全进一屏，
        * 字号得压到读不动 —— **「一屏看完」是为了让人好选，不是目的本身**。
        * 两列是折中：一屏 6 张，再滚一点点就看全。
        * 卡内从「一行挤下所有东西 + flex-wrap」改成上下两段：
        * 窄列里 flex-wrap 会让每张卡高度不一，栅格就参差不齐了。
        */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {atlas.domains.map((d) => {
          const ms = domainModels(d.id);
          const core = ms.filter((m) => (m.tier ?? "core") === "core").length;
          const cells = atlas.support.filter((s) => ms.some((m) => m.id === s.m));
          const yes = cells.filter((s) => s.state === "yes").length;
          return (
            <Link key={d.id} data-domain-card href={`/${d.id}`}
              className="border border-rule rounded-xl bg-card px-4 py-3 hover:border-yes hover:bg-yes/5 flex flex-col gap-1">
              <span className="flex items-baseline gap-2">
                <span className="text-[19px] leading-tight font-bold">{d.name}</span>
                {d.state !== "live" && (
                  <span className="text-[10.5px] px-1 py-px bg-unknown/20 text-unknown">建设中</span>
                )}
              </span>
              <span className="text-[12px] leading-snug text-muted line-clamp-1">
                {tracksOf(d).map((t) => t.zh).join(" · ")}
              </span>
              <span className="text-[11.5px] text-muted tabular-nums">
                产品线 {ms.length} · 进表 {core} · 已核 {yes} 格
              </span>
            </Link>
          );
        })}
      </div>

      <p className="mt-8 text-[12.5px] text-muted leading-relaxed">
        <b className="text-ink">「已核」只数带官方原文的那些。</b>
        ⬜ 不是缺口，是一条事实：我们查了、公开渠道没说。各卷 ⬜ 密度不同，
        密的那卷是我们还没读完文档 —— 方向页里写着。
        <Link href="/method" className="underline ml-1 hover:text-ink">口径 →</Link>
      </p>

      {/**
        * 专项入口：**横着切的那一层，站在九卷之上**。
        *
        * 九卷是按「模型产出什么」纵切的，专项是按「人要做成一件什么事」横切的 ——
        * 做一条视频要跨图像（分镜）、声音（配音）、数字人、视频四卷。
        * **正因为它跨卷，它不能挂在任何一卷下面**，只能和方向卡并列。
        *
        * 放在方向卡之后而不是之前：进站第一句话仍然是「先选一个方向」。
        * 已经知道自己要做什么的人才需要专项，那是第二个问题。
        */}
      {atlas.topics.length > 0 && (
        <section className="mt-9">
          <h2 className="text-[13px] tracking-[0.14em] text-muted font-bold mb-2.5">
            专项研究
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {atlas.topics.map((t) => (
              <Link key={t.id} href={`/topic/${t.id}`}
                className="border border-rule rounded-xl px-4 py-3 bg-card hover:border-yes block">
                <b className="text-[15px]">{t.zh}</b>
                <span className="block text-[12.5px] text-muted mt-1 leading-relaxed">
                  {/*
                    * ⚠️ 这一行**跟着专项页的骨架走**。原来写「横跨 N 项决定 · N/N 篇已建」——
                    * 那是「九道工序 + 五篇」那一版的结构，2026-08-17 专项页早就不是那个形状了，
                    * 而这行字还在首页上照写不误。**卡片描述是最容易被忘掉的过期点**：
                    * 它离改动的地方很远，改结构时不会顺手看到它。
                    */}
                  {t.projects.length} 个开源项目逐个拆解：架构、上手门槛、许可证附加条件
                  {" · "}{t.projects.reduce((n, p) => n + (p.tutorials?.length ?? 0), 0)} 条官方教程
                  {" · "}{(t.basics ?? []).reduce((n, b) => n + b.items.length, 0)} 条视频入门读物
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/**
        * 公共页入口。**和四个方向首页那一排完全一样、顺序也一样** ——
        * 负责人 2026-08-12 提：这几条应该在首页也能看到。
        *
        * 为什么值得在这里再放一遍：这一页是**进站第一屏**，而它原来只有四个方向卡片，
        * 一个还没决定看哪个方向的人，从这里出不去别的地方。
        * 顺序不变（/basics 打头）：连 FP8 是什么都不知道的人，后面三条对他都用不上。
        */}
      <nav className="mt-10 border-t-[.5px] border-rule pt-3 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
        {[
          ["/basics", "看不懂那些词？先看这里"],
          ["/changes", "最近有什么变化"],
          ["/caveats", "能力对了，未必用得上"],
          /* 专项那一百多张卡里最值钱的是「什么是假的」，但它散在各卡的「局限」里 ——
             这里给它一个入口，否则一个只想问「我该当心什么」的人凑不齐。 */
          ["/claims", "项目说的，和用的人撞到的"],
          ["/toolkit", "想查一件事，去哪个站"],
        ].map(([href, zh]) => (
          <Link key={href} href={href} className="hover:text-ink underline">{zh} →</Link>
        ))}
      </nav>
    </main>
  );
}
