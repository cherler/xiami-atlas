import {createHash} from 'node:crypto';
export const quoteNorm = s => String(s ?? '').normalize('NFKC').toLowerCase()
  .replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/<[^>]+>/g,' ')
  .replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/[\s*`_]+/g,'');
export const quoteMatches = (quote,text) => quoteNorm(quote).length >= 12 && quoteNorm(text).includes(quoteNorm(quote));
export function quoteEntity(a,at) {
  if(at.includes(' × '))return a.support.find(c=>`${c.m} × ${c.c}`===at);
  if(at.startsWith('模型 '))return a.models.find(m=>`模型 ${m.id} 版本`===at);
  return a.versions.find(v=>`发布 ${v.id}`===at);
}
export const quoteFingerprint = (entity,snapshot) => createHash('sha256').update(JSON.stringify([entity ?? null,snapshot?.text ?? '',snapshot?.items ?? []])).digest('hex');
