"use client";

import { useState } from "react";
import { atlas, cell, label, vendorName } from "@/lib/atlas";

/**
 * 一键报错（方案 §46 Suggest Correction）。
 *
 * **这不是加分项，是必需品。** §59.3 主动把精准度交易掉换维护成本 ——
 * 读者没有同意接受不精准，只有我们同意了。可纠错是那笔交易的另一半。
 *
 * ## 2026-08-15 改：从「发邮件 / 自己粘走」改成就地提交
 *
 * 原来这里只有两条路：写一封预填好的邮件，或者**「把下面这段贴到任何地方给我们」**。
 * 负责人指出后一句说不通 —— **它给了你一段文字，却没给目的地**。
 * 那是当初的偷懒：不想为一个每周一两条的表单起后端，就把最后一步甩给了用户。
 *
 * ## 为什么现在不用起后端也能提交
 *
 * **主站早就有一个，而且和 `/atlas` 同域。** 实测：
 * `POST https://xiamimate.com/v1/feedback` 免登录可提（游客走 IP 哈希 + 每日 30 条限流），
 * 字段里的 `scope` 是 ≤40 字符的自由串 —— 那正是「哪一格」该放的位置。
 * 管理端 `GET /admin/feedback`（按状态筛、改状态、管理员备注、审计留痕）也已经在了。
 *
 * 于是这里只要一个相对路径的 `fetch("/v1/feedback")`：
 * **不用 CORS、不用新服务、不用新库表、不用重做防刷。**
 * `/atlas` 仍然是纯静态产物 —— 它只是在浏览器里调了主站的接口。
 *
 * ⚠️ **开发时要从 `:3000` 打开**（主站把 `/atlas/*` 与 `/v1/*` 都反代了）。
 * 直连 `:3400` 时 `/v1` 是 404 —— 下面对这种情况有专门的提示，不让它静默失败。
 *
 * ## 预填仍然是关键
 *
 * 把「哪一格、我们现在写的是什么、引的哪条来源、数据版本」都替他填好，
 * 报错的人只需要补一句「实际是什么 + 你在哪看到的」。
 * **让对方少打字，比给他一个漂亮表单有用。**
 */
const MAILTO = "atlas@xiamimate.com";
/** 后端 `scope` 字段上限 40 字符（见 tools-backend/app/routes/feedback.py）。 */
const SCOPE_MAX = 40;

type State = { k: "idle" | "sending" | "ok" } | { k: "err"; msg: string };

export default function ReportIssue({ m, c }: { m?: string; c?: string }) {
  const [open, setOpen] = useState(false);
  const [what, setWhat] = useState("");
  const [where_, setWhere] = useState("");
  const [contact, setContact] = useState("");
  const [st, setSt] = useState<State>({ k: "idle" });

  const md = m ? atlas.models.find((x) => x.id === m) : null;
  const cp = c ? atlas.capabilities.find((x) => x.id === c) : null;
  const f = m && c ? cell(m, c) : null;
  const src = f?.src ? atlas.sources[f.src] : null;

  const where = md && cp ? `${label(md)} × ${cp.zh}` : md ? label(md) : cp ? cp.zh : "整站";
  /** `atlas:` 前缀是给管理端筛的 —— 纠错和普通站点反馈要能分开看。 */
  const scope = `atlas:${m ?? "-"}×${c ?? "-"}`.slice(0, SCOPE_MAX);

  /** 我们替他填好的那一半。人只补最后两行。 */
  const context = [
    `【报错位置】${where}`,
    md && `模型：${label(md)}（${vendorName(md)}，该版本 ${md.version_as_of}）`,
    cp && `能力：${cp.zh} / ${cp.name}`,
    f && `我们现在写的是：${{ yes: "支持", no: "不支持", unknown: "官方没说" }[f.state]}`,
    f?.note && `说明：${f.note}`,
    src && `我们引的来源：${src.name} ${src.url}`,
    `数据版本：${atlas.version}，数据截至 ${atlas.generated_at}`,
    typeof window !== "undefined" && `页面：${window.location.href}`,
  ]
    .filter(Boolean)
    .join("\n");

  const mailBody = `${context}\n\n────────  以下请填  ────────\n实际应该是：\n你在哪看到的（链接最好）：\n`;
  const href = `mailto:${MAILTO}?subject=${encodeURIComponent(`纠错：${where}`)}&body=${encodeURIComponent(mailBody)}`;

  const submit = async () => {
    if (!what.trim()) return setSt({ k: "err", msg: "先写一句「实际应该是什么」吧 —— 只有这句我们替不了你。" });
    setSt({ k: "sending" });
    try {
      const res = await fetch("/v1/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "bug",
          scope,
          title: `纠错：${where}`.slice(0, 120),
          detail: [context, "", "实际应该是：" + what.trim(), where_.trim() && "在哪看到的：" + where_.trim()]
            .filter(Boolean).join("\n").slice(0, 4000),
          contact: contact.trim() || null,
        }),
      });
      if (res.ok) return setSt({ k: "ok" });
      if (res.status === 429)
        return setSt({ k: "err", msg: "今天提交得有点多了，明天再来 —— 或者直接发邮件给我们。" });
      if (res.status === 404)
        return setSt({
          k: "err",
          msg: "提交接口没找到。本地开发要从 :3000 打开（直连 :3400 时 /v1 不通）；如果你是在线上看到这句，那是我们的问题，请改用下面的邮件。",
        });
      setSt({ k: "err", msg: `提交没成功（HTTP ${res.status}）。用下面的邮件那条路吧，内容已经填好了。` });
    } catch {
      setSt({ k: "err", msg: "网络没通，提交失败。用下面的邮件那条路吧，内容已经填好了。" });
    }
  };

  const box = "w-full p-2 rounded border border-rule bg-paper text-[13px] leading-relaxed";

  return (
    <div className="text-[13px]">
      <button onClick={() => setOpen(!open)} className="text-muted underline hover:text-ink">
        这一条不对？
      </button>

      {open && (
        <div className="mt-2 border border-rule rounded-lg p-3 bg-card flex flex-col gap-2.5">
          {st.k === "ok" ? (
            <p className="leading-relaxed">
              <b className="text-yes-ink">收到了。</b>
              我们改完会记进<b className="text-ink">「变了什么」</b> ——
              那一页专门留着<b className="text-ink">「我们记错了」</b>这一侧，改了什么、为什么改，都写在那儿。
            </p>
          ) : (
            <>
              <p className="text-muted leading-relaxed">
                我们主动用<b className="text-ink">「不那么精准」换了维护成本</b>（数据由 Agent 机器录入）。
                <b className="text-ink">那笔交易的另一半就是可纠错</b> ——
                位置和来源我们已经替你填好了，<b className="text-ink">你只需要补一句实际是什么</b>。
              </p>

              <label className="flex flex-col gap-1">
                <span className="text-muted">实际应该是什么？<span className="text-no">（必填）</span></span>
                <textarea
                  value={what} onChange={(e) => setWhat(e.target.value)} rows={2}
                  placeholder="例：这一格该是「支持」，官方文档里有这个参数"
                  className={box}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-muted">你在哪看到的？<b className="text-ink">给个链接最有用</b></span>
                <input
                  value={where_} onChange={(e) => setWhere(e.target.value)}
                  placeholder="厂商文档 / 更新日志的链接"
                  className={box}
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-muted">怎么联系你？（选填，只在需要问清楚时用）</span>
                <input
                  value={contact} onChange={(e) => setContact(e.target.value)}
                  placeholder="邮箱或微信，不填也能提"
                  className={box}
                />
              </label>

              {st.k === "err" && (
                <p className="text-no leading-relaxed border-l-2 border-no pl-2">{st.msg}</p>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={submit} disabled={st.k === "sending"}
                  className="px-3 py-1.5 rounded border border-yes text-yes hover:bg-yes hover:text-paper disabled:opacity-50"
                >
                  {st.k === "sending" ? "提交中…" : "提交"}
                </button>
                <a href={href} className="text-muted underline hover:text-ink">
                  或者写一封已填好上下文的邮件 →
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
