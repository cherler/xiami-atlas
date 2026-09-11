import { Fragment } from "react";
import Link from "next/link";
import Mark from "./Mark";
import { Rich } from "./Fact";
import { atlas, capsOf, cell, label, modelsOf, orgOf, STATUS, type Klass } from "@/lib/atlas";
import { capHref, modelHref } from "@/lib/slug";

/**
 * 真值表 —— 全站主图语言（docs/视觉方案_V1.md 第四节）。
 *
 * ## 为什么是它做首屏
 *
 * 上一版首屏是「能力横条图」：一根横条 + 一个日期 + 一个 4/9，**通篇不出现一个模型的名字**。
 * 首屏可核验的具体事实只有 18 个，读者得先读三行说明才知道这站是干嘛的。
 * 真值表首屏是 147 个。差八倍 —— 这就是「一眼看不懂」的真实原因，跟审美无关。
 *
 * 横条图本身不是废的，它错在**不配单独占一屏**。现在它是行头的一部分，
 * 横条与格子共用一行：这项能力多少家做到了、最早什么时候出现的、具体是哪几家，一次读完。
 *
 * ## 三件必须做对的事
 *
 * 1. **⬜ 用整格斜线纹理，不画符号。** 用浅灰画它它就消失了（我连着三版稿子栽在这儿）。
 *    铺成纹理之后空白会自己连成片 —— Wan 3.0 整列几乎全是斜线，
 *    「阿里几乎什么都没公开说过」这个结论一个字没写就浮出来了。
 * 2. **强调色（蓝）标的是「有出处」，不是「支持」。** 我们不评判谁强，只记录谁说过。
 *    所以「厂商明确说不支持」是黑叉不是红叉 —— 那是一条事实，不是差评。
 * 3. **脚注编号。** 可追溯不该是 hover 弹窗，规格书本来就自带这套东西：
 *    每个 ✅ 右上角一个编号，页脚就是那句厂商原文。
 */

/** 表头那行公司名要短。「稀宇科技 MiniMax」在 64px 的列里会折成三行。 */
const shortOrg = (s: string) => s.replace("稀宇科技 ", "").replace(" DeepMind", "").replace("科技", "");

/**
 * 分组顺序从数据里读，**不在这里硬编码组名**。
 * 上一版我写死了「生成/控制/参考/音频/叙事」五个，结果「获取」和「实时」
 * 两个真实分组掉进了兜底的「其他」—— 又造了第二份口径。
 * 顺序 = 它们在 capabilities 里首次出现的顺序，加新组不用动代码。
 */
const groupsOf = (cs: { group?: string }[]) => {
  const seen: string[] = [];
  for (const c of cs) if (c.group && !seen.includes(c.group)) seen.push(c.group);
  return seen;
};

export default function TruthTable({ k }: { k: Klass }) {
  const cs = capsOf(k);
  // 列按「谁最全」排：✅ 数从多到少。蓝块会自然堆成左密右疏的阶梯 ——
  // 「谁能力最全」不用数就看出来。原来是录入顺序，随机的，看不出任何结构。
  const yesCount = (mId: string) => cs.filter((c) => cell(mId, c.id).state === "yes").length;
  const ms = [...modelsOf(k)].sort((a, b) => yesCount(b.id) - yesCount(a.id));
  const notes: { n: number; m: string; c: string; note?: string; src?: string }[] = [];
  let fn = 0;

  const names = groupsOf(cs);
  const groups = names.map((g) => [g, cs.filter((c) => c.group === g)] as const);
  const ungrouped = cs.filter((c) => !c.group);
  if (ungrouped.length) groups.push(["未分组", ungrouped] as const);

  return (
    <div className="hidden md:block bg-card border border-rule rounded-xl rounded-xl px-5 pt-4 pb-1">
      <div className="overflow-x-auto">
        {/* table-fixed + 能力列固定 320px：其余列均分剩余、紧贴能力列。
            此前 w-full auto-layout 把能力列拉到近半宽，能力名右边空一大片。 */}
        <table className="w-full border-collapse table-fixed">
          <colgroup>
            <col style={{ width: 320 }} />
            {ms.map((m) => <col key={m.id} />)}
          </colgroup>
          <thead>
            <tr>
              <th className="text-left align-bottom pb-2 pr-4 font-normal text-[12px] text-muted border-b-[1.5px] border-ink">
                能力
              </th>
              {ms.map((m) => {
                const st = m.status && m.status !== "active" ? STATUS[m.status] : null;
                return (
                  <th
                    key={m.id}
                    className="align-bottom pb-2 px-1 font-normal border-b-[1.5px] border-l-[.5px] border-l-rule border-ink"
                  >
                    <Link href={modelHref(m)} className="block hover:text-yes-ink">
                      <span className="block font-semibold text-[13px] leading-[1.25]">{label(m)}</span>
                    </Link>
                    <span className="block text-[10px] leading-[1.3] text-muted mt-1">{shortOrg(orgOf(m)?.zh ?? "")}</span>
                    <span className="block text-[9.5px] leading-none text-muted mt-0.5 tnum">{m.version_as_of}</span>
                    {st && <span className="block text-[9.5px] leading-none mt-0.5 text-no">{st.tag}</span>}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {groups.map(([g, list]) => (
              <Fragment key={g}>
                <tr className="border-b-[1.5px] border-ink">
                  <td
                    colSpan={ms.length + 1}
                    className="pt-3.5 pb-1 text-[12px] tracking-[.2em] text-muted"
                  >
                    {g}
                  </td>
                </tr>
                {list.map((c) => {
                  const y = ms.filter((m) => cell(m.id, c.id).state === "yes").length;
                  return (
                    <tr key={c.id}>
                      <td className="h-9 pr-4 whitespace-nowrap border-b-[.5px] border-rule">
                        <Link href={capHref(c)} className="font-semibold text-[15px] hover:text-yes-ink">
                          {c.zh}
                        </Link>
                        {c.ubiquity && <span className="text-[11px] text-muted ml-2">{c.ubiquity}</span>}
                        <span className="text-[11px] text-muted ml-3">
                          {c.since ? `${c.since} 起` : "早于可追溯范围"}
                        </span>
                        <span className="text-[11px] text-muted ml-3 tnum">
                          {y}/{ms.length}
                        </span>
                      </td>
                      {ms.map((m) => {
                        const f = cell(m.id, c.id);
                        if (f.state === "yes") notes.push({ n: ++fn, m: m.id, c: c.id, note: f.note, src: f.src });
                        return (
                          <td key={m.id} className="text-center border-b-[.5px] border-l-[.5px] border-rule" title={f.note ?? ""}>
                            {/* 绿勾 / 红叉 / 灰块 —— 三态一目了然（负责人拍板，2026-08-09）。
                                此前用「蓝块=有出处、斜线=没说」，立场纯粹但一眼看不出三态，弃。 */}
                            {/* 画出来的标记，不用 emoji —— 理由见 components/Mark.tsx */}
                            <Mark state={f.state} size={15} />
                            {f.state === "yes" && f.via === "separate-task" && (
                              <sup className="text-[10px] text-unknown ml-px">*</sup>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* signature：脚注栏。可追溯不是弹窗，是规格书自带的东西。
          **默认折叠** —— 原文摊开会把表压到看不见，而人是先看表才想追某一条的。
          每条前面标「模型 · 能力」，对应表里那个 ✅。 */}
      <details className="mt-7 border-t-[2.5px] border-ink">
        <summary className="cursor-pointer py-2.5 text-[13px] text-muted hover:text-ink select-none">
          {notes.length} 条厂商原文 —— 每个 <Mark state="yes" /> 都能在这儿查到出处
        </summary>
      <div data-quote className="pt-1 pb-3 [column-count:2] [column-gap:34px] [column-rule:.5px_solid_var(--color-rule)]">
        {notes.map((n) => {
          const s = n.src ? atlas.sources[n.src] : null;
          const mm = atlas.models.find((m) => m.id === n.m);
          const cc = cs.find((c) => c.id === n.c);
          return (
            <p key={`${n.m}-${n.c}`} className="text-[11px] leading-[1.62] text-muted mb-1.5 [break-inside:avoid]">
              <b className="font-normal text-yes-ink">{mm ? label(mm) : n.m} · {cc?.zh ?? n.c}：</b>
              <Rich text={n.note ?? "已核"} />
              {s && (
                <a href={s.url} target="_blank" rel="noreferrer" className="underline ml-1 hover:text-ink">
                  {s.name}
                </a>
              )}
            </p>
          );
        })}
      </div>
      </details>
    </div>
  );
}

/**
 * 图例块。**全站口径只有这一份**，也是除 /method 外唯一允许出现成段解释文字的地方。
 * 这个 signature 来自被砍掉的「图幅」方向 —— 制图学里图例是一等公民，
 * 它把散落各页的说明收成一个固定的框。
 */
export function Legend() {
  return (
    <div className="hidden md:flex flex-wrap items-center gap-x-6 gap-y-1.5 mt-5 pt-3 border-t-[.5px] border-rule text-[12px] text-muted">
      <span className="flex items-center gap-1.5"><Mark state="yes" />厂商官方文档写明支持</span>
      <span className="flex items-center gap-1.5"><Mark state="no" />厂商明确说不支持</span>
      <span className="flex items-center gap-1.5"><Mark state="unknown" />厂商没说过 —— 和「不支持」不是一回事</span>
      <span className="flex items-center gap-1.5"><i className="not-italic text-unknown">*</i>平台另一个接口，不是生成时一步</span>
      <Link href="/method#states" className="underline hover:text-ink">
        口径 →
      </Link>
    </div>
  );
}
