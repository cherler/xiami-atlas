/** Read-only, escaped and paginated audit view. Inbox text is untrusted. */
const esc = x => String(x ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const verdictNames = {adopted:'采纳',corrected:'修正引文或结论',verified:'引文核实',repointed:'修正来源',downgraded:'撤回支持结论，改为未知','historical-unverified':'历史引文未核实，已标注归档',derivative:'量化/二次分发归档',duplicate:'重复',covered:'已有证据覆盖','event-archived':'事件归档','out-of-scope':'不纳入当前图谱','not-adopted':'证据不足或口径不符，本轮不采纳'};
export function reviewReport(audit, params) {
  const query = (params.get('q') ?? '').slice(0, 200), decision = params.get('decision') ?? '';
  const all = (audit.rows ?? []).filter(r => (!decision || r.decision === decision) &&
    (!query || [r.model_hint,r.claim,r.reason,r.source].join(' ').toLowerCase().includes(query.toLowerCase())));
  const requested = Number(params.get('page') ?? 0);
  const page = Math.min(Math.max(0, Number.isFinite(requested) ? Math.floor(requested) : 0), Math.max(0, Math.ceil(all.length / 30) - 1));
  const link = n => '?' + new URLSearchParams({q:query,decision,page:String(n)});
  return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>自动审阅记录 · 虾米看AI</title>
  <style>body{font:16px/1.7 system-ui;margin:32px auto;padding:0 20px;max-width:1000px;color:#20313d;background:#f6f8f9}article{background:white;padding:18px 24px;margin:16px 0;border:1px solid #d7dfe5;border-radius:10px}blockquote{margin:10px 0;padding:8px 16px;border-left:3px solid #88a8b9;white-space:pre-wrap;overflow-wrap:anywhere}input,select,button{font:inherit;padding:7px;max-width:95%}small{color:#526574}a{color:#145a7a}</style>
  <a href="/">← 回审阅台</a><h1>自动审阅记录</h1>
  <p>${esc(audit.at)} · 已处理 ${esc(audit.total ?? 0)} 条 · 更新 ${esc(audit.changed_cells ?? 0)} 个能力格</p>
  <p>${esc(audit.meaning ?? '暂无自动审阅记录。')}</p>
  <p>${Object.entries(audit.summary ?? {}).map(([k,v]) => `${esc(verdictNames[k] ?? k)} ${esc(v)}`).join(' · ')}</p>
  <form><input name="q" aria-label="搜索记录" placeholder="搜索模型、来源或理由" value="${esc(query)}"><select name="decision" aria-label="处理结果"><option value="">全部处理结果</option>${Object.entries(verdictNames).map(([k,v])=>`<option value="${k}" ${decision===k?'selected':''}>${esc(v)}</option>`).join('')}</select><button>筛选</button></form>
  <p>匹配 ${all.length} 条 · 第 ${page+1} / ${Math.max(1,Math.ceil(all.length/30))} 页　<a href="${esc(link(Math.max(0,page-1)))}">上一页</a>　<a href="${esc(link(page+1))}">下一页</a></p>
  ${all.slice(page*30,page*30+30).map(r => `<article><b>${esc(r.model_hint)} · ${esc(verdictNames[r.decision] ?? r.decision)}</b><p>${esc(r.claim)}</p><blockquote>${esc(r.quote)}</blockquote><p>${esc(r.reason)}</p><small>${esc(r.source)} · ${esc(r.capability || r.kind)} · ${esc(r.day)}</small>${/^https?:\/\//i.test(r.url ?? '')?` · <a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">查看来源</a>`:''}</article>`).join('')}</html>`;
}
