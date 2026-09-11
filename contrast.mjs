/** WCAG 对比度计算器 —— 配色不靠眼睛拍，靠数字定（「调参前先确认量对了」）。 */
const hex = (h) => {
  h = h.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
};
const lum = (h) => {
  const [r, g, b] = hex(h).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const PAIRS = process.argv.slice(2);
if (PAIRS.length) {
  for (const p of PAIRS) {
    const [fg, bg, label = ""] = p.split(",");
    const r = ratio(fg, bg);
    console.log(`${label.padEnd(22)} ${fg} on ${bg} = ${r.toFixed(2)}:1  ${r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA大字" : "✗"}`);
  }
}
