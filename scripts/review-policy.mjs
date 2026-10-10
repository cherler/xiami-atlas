/** Shared, side-effect-free review policy. A routable record is not an approved fact. */
import { createHash } from 'node:crypto';

export const norm = s => String(s ?? '').toLowerCase().normalize('NFKC')
  .replace(/([a-z])(?=\d)/g, '$1 ').replace(/[\s_·()（）-]+/g, ' ').trim();
const familyKey = s => norm(s).replace(/\bv?\d+(?:\.\d+)*\b/g, ' ').replace(/\s+/g, ' ').trim();
const contains = (h, n) => n && (` ${h} `).includes(` ${n} `);

export function matchModel(atlas, hint) {
  const h = norm(hint), hf = familyKey(hint);
  if (!h) return null;
  const hits = [];
  for (const m of atlas.models ?? []) {
    let score = 0;
    for (const name of [m.family, m.id, m.zh, ...(m.aliases ?? [])]) {
      const n = norm(name), nf = familyKey(name);
      if (!n) continue;
      if (h === n) score = Math.max(score, 10000 + n.length);
      else if (contains(h, n)) score = Math.max(score, n.length * 10);
      else if (nf.length >= 4 && contains(hf, nf)) score = Math.max(score, nf.length * 10 - 1);
    }
    if (score) hits.push({ m, score });
  }
  hits.sort((a, b) => b.score - a.score);
  if (!hits.length || (hits[1] && hits[0].score === hits[1].score)) return null;
  return hits[0].m;
}

export const negated = f => /不支持|未支持|没有支持|不可用|已退役|已下线|不再|not supported|no tool calls|does not support|not available|deprecated|deprecation|shut down|retired|discontinued|except|excluding/i.test(`${f.claim ?? ''} ${f.quote ?? ''}`);
const compact = s => String(s ?? '').normalize('NFKC').toLowerCase().replace(/[\s*_`]+/g, '');
export const quotePresent = (quote, text) => compact(quote).length >= 8 && compact(text).includes(compact(quote));

// Version evidence must identify the full variant. A bare family name proves no version.
export function matchesVersion(m, hint) {
  const h = norm(hint);
  const variants = [m.version, ...(m.version_aliases ?? [])];
  return variants.some(v => {
    const n = norm(v);
    if (!n || !/\d/.test(n)) return false;
    // The complete hint must match; 'Veo 3.1 Lite' is not the 'Veo 3.1' variant.
    return [n, ...[m.family, m.id, ...(m.aliases ?? [])].map(name => norm(`${name} ${v}`))].includes(h);
  });
}

export function assess(f, m, cell, source, snapshotText = '') {
  const blockers = [];
  if (f.kind !== 'capability') blockers.push(`这是 ${f.kind} 事件，不能当作支持能力写入`);
  if (f.confidence !== 'explicit') blockers.push('需要推断的结论，须补直接证据');
  if (negated(f)) blockers.push('含否定、退役或例外条件，须单独裁决');
  if (!quotePresent(f.quote, snapshotText)) blockers.push('逐字引文未在当前来源快照中核到');
  if (/^(video-to-video|structured outputs|web search|code execution|batch api|prompt caching)$/i.test(String(f.quote).trim()))
    blockers.push('只有任务标签或导航标题，需补型号正文说明');
  if (f.capability === 'i-4k' && !/\b4k\b|3840|4096/i.test(f.quote ?? ''))
    blockers.push('原文未证明 4K；2K 或 4MP 不等于 4K');
  if (m && !matchesVersion(m, f.model_hint)) blockers.push(`尚未明确对应当前完整型号 ${m.version}`);
  if (source?.tier !== 'S') blockers.push('尚未确认是一手官方来源');
  if (source?.resells && m && source.own_org !== m.org) blockers.push('转售或聚合来源须回到厂商原文');
  const action = !m ? 'identity' : f.kind !== 'capability' ? 'metadata'
    : !cell ? 'mapping' : blockers.length ? 'evidence'
    : cell.state === 'no' ? 'conflict' : cell.state === 'yes' ? 'duplicate' : 'fill';
  return { blockers, action, landable: !!cell && blockers.length === 0,
    negated: negated(f), verified_for: m?.version ?? null };
}

// Date is deliberately absent. Source, version hint, polarity and conditions remain in the identity.
export const factKey = f => createHash('sha256').update(JSON.stringify([
  f.source, norm(f.model_hint), f.kind, f.capability, f.confidence,
  compact(f.claim), compact(f.quote),
])).digest('hex');

export function groupQueue(items) {
  const groups = new Map();
  for (const item of items) {
    // Keep candidate families separate; never aggregate all unmatched records into one decision.
    const key = [item.action, item.model ?? norm(item.model_hint), item.capability ?? item.kind].join('::');
    if (!groups.has(key)) groups.set(key, { key, action: item.action, model: item.model,
      capability: item.capability, items: [] });
    groups.get(key).items.push(item);
  }
  const order = ['conflict', 'fill', 'evidence', 'duplicate', 'metadata', 'mapping', 'identity'];
  return [...groups.values()].sort((a, b) => order.indexOf(a.action) - order.indexOf(b.action) || a.key.localeCompare(b.key));
}
