/** Shared review policy. Read-only routing; writing a capability always needs an explicit review. */
import { queue, groupQueue } from './review.mjs';
const apply = process.argv.includes('--apply');
const items = queue();
const green = items.filter(x => x.action === 'fill' && x.landable && x.kind === 'capability');
const groups = groupQueue(items);
console.log(`待审 ${items.length} 组证据 · ${groups.length} 个问题 · 可补空白 ${green.length} 条`);
for (const action of ['conflict', 'fill', 'evidence', 'duplicate', 'metadata', 'mapping', 'identity']) {
  const rows = items.filter(x => x.action === action);
  console.log(`${action}: ${rows.length} 条 / ${groups.filter(x => x.action === action).length} 个问题`);
}
console.log('不因积压放宽证据条件；非能力事件、不同型号、转售来源及无法回查的引文都不能写成支持。');
if (!apply) {
  console.log('只读分级，未写任何文件。');
} else {
  console.error('自动写入已停用：逐字回查不能证明能力分类正确。请在审阅台核对能力定义后逐项确认。');
  process.exitCode = 2;
}
