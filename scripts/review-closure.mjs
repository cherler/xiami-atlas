/** An automatic disposition is valid only for the evidence and atlas context reviewed. */
import { createHash } from 'node:crypto';
import { matchModel } from './review-policy.mjs';
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function closureContext(atlas, snapshot) {
  const sources = new Map(), contexts = new Map();
  const identities = hash((atlas.models ?? []).map(m => [m.id, m.family, m.zh, m.aliases, m.version]));
  return item => {
    if (!sources.has(item.source)) sources.set(item.source, hash(snapshot(item.source)));
    const key = JSON.stringify([item.model_hint, item.capability]);
    if (!contexts.has(key)) {
      const m = matchModel(atlas, item.model_hint);
      const cell = (atlas.support ?? []).find(c => c.m === m?.id && c.c === item.capability);
      const cap = (atlas.capabilities ?? []).find(c => c.id === item.capability);
      contexts.set(key, hash([m ?? identities, cell ?? null, cap ?? null]));
    }
    return { source: sources.get(item.source), atlas: contexts.get(key) };
  };
}
export const closureActive = (row, context) => !!row.context &&
  row.context.source === context.source && row.context.atlas === context.atlas;
