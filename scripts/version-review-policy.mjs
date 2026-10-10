const key = s => String(s).toLowerCase().replace(/[\s_-]+/g, '');
/** Match only the reviewed variant. A preview acknowledgement must not hide its later stable release. */
export function acknowledged(rows, model, raw, following = '') {
  return rows.some(r => r.m === model && key(r.found) === key(raw) &&
    (!r.suffix || key(following).startsWith(key(r.suffix))));
}
