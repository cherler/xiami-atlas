/**
 * 混音：旁白 + 配乐 + 画面 → 成片。
 *
 * ## 响度的杠杆在这里，不在 TTS 的 vol
 *
 * promo-hf 那条线为「配音像破喇叭」查了好几轮，病因是 TTS 的 `vol=3.5`
 * 在合成器内部就把波形切顶了。**那一层必须是 1**，
 * 真正该调响度的地方是这里 —— 干净的波形再统一归一化。
 *
 * ## 配乐要能听见，但不许抢旁白
 *
 * 用 `sidechaincompress`：旁白一出声，配乐自动让路（duck），
 * 旁白一停配乐回来。比写死一个固定音量好得多 ——
 * 固定音量要么盖住旁白，要么整段像没有配乐。
 *
 *   node scripts/film-mix.mjs   # → assets/atlas-film.mp4（覆盖无声那版）
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";

const DIR = "assets/film-audio";
const VID = "assets/film-cut/silent.mp4";
const OUT = "assets/atlas-film.mp4";

if (!existsSync(`${DIR}/vo-lens.json`)) { console.error("先跑 film-audio.mjs"); process.exit(1); }
/** 无声版由 film-cut 产出；这里先把它挪开，免得混音结果被下一次切片覆盖后混淆。 */
if (!existsSync(VID)) execFileSync("cp", [OUT, VID]);

const lens = JSON.parse(readFileSync(`${DIR}/vo-lens.json`, "utf8"));
const GAP = 0.28;

/** 每一句旁白在成片里的起点 = 前面所有镜头的时长之和。**镜长就是旁白长 + 呼吸**。 */
const starts = [];
let t = 0;
for (const d of lens) { starts.push(t); t += d + GAP; }

/** 找到每句对应的 wav（按 film-audio 的命名规则，取目录里的顺序不可靠，所以按时长配）。 */
const wavs = readdirSync(DIR).filter((f) => f.startsWith("vo-") && f.endsWith(".wav"))
  .map((f) => ({ f: `${DIR}/${f}`, d: Number(execFileSync("ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `${DIR}/${f}`],
    { encoding: "utf8" }).trim()) }));
const pick = lens.map((d) => {
  const hit = wavs.find((w) => Math.abs(w.d - d) < 0.02);
  if (!hit) { console.error(`❌ 找不到时长 ${d}s 的那句旁白`); process.exit(1); }
  return hit.f;
});

/* 旁白拼成一条：每句按 starts 延迟后叠加。 */
const voIn = pick.flatMap((f) => ["-i", f]);
const voDelay = pick.map((_, i) =>
  `[${i}:a]adelay=${Math.round(starts[i] * 1000)}|${Math.round(starts[i] * 1000)}[v${i}]`).join(";");
const voMix = pick.map((_, i) => `[v${i}]`).join("") + `amix=inputs=${pick.length}:normalize=0[vo]`;

execFileSync("ffmpeg", ["-y", ...voIn, "-filter_complex", `${voDelay};${voMix}`,
  "-map", "[vo]", "-ar", "44100", "-ac", "1", `${DIR}/vo-track.wav`],
  { stdio: ["ignore", "ignore", "pipe"] });

const total = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
  "-of", "csv=p=0", VID], { encoding: "utf8" }).trim());
console.log(`画面 ${total.toFixed(1)}s · 旁白 ${pick.length} 句`);

/**
 * 合成。三步在一条 filter 里：
 * 1. 配乐裁到片长、两头各留 0.6s 淡入淡出（硬起硬收听着像事故）
 * 2. `sidechaincompress` 让配乐给旁白让路
 * 3. `loudnorm` 统一到播客/短视频常用的 −16 LUFS
 */
execFileSync("ffmpeg", ["-y",
  "-i", VID, "-stream_loop", "-1", "-i", `${DIR}/music-raw.mp3`, "-i", `${DIR}/vo-track.wav`,
  "-filter_complex",
  `[1:a]atrim=0:${total},afade=t=in:st=0:d=0.6,afade=t=out:st=${(total - 0.8).toFixed(2)}:d=0.8,volume=0.34[bg];` +
  /* ⚠️ **一个滤镜输出只能被消费一次。** 旁白既要当 sidechain 的触发源、
     又要混进成品，所以先 `asplit` 成两路 —— 直接用两次会报
     「Error binding filtergraph inputs/outputs」，而那句报错完全不提是哪一路。 */
  `[2:a]volume=1.0,apad=whole_dur=${total},asplit=2[voa][vob];` +
  `[bg][voa]sidechaincompress=threshold=0.045:ratio=9:attack=8:release=320[duck];` +
  `[duck][vob]amix=inputs=2:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]`,
  "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
  "-shortest", OUT], { stdio: ["ignore", "ignore", "pipe"] });

const d = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
  "-of", "csv=p=0", OUT], { encoding: "utf8" }).trim();
/** 报一下真实响度 —— 「我放很大音量才轻微听到」那种事要能提前看见。 */
/** ⚠️ ffmpeg 把这些数写在 **stderr**，而 execFileSync 的返回值是 stdout。
    上一版 stdout 设成 ignore 又去 match 返回值 —— 那是 null，直接抛。
    所以这里读 `e.stderr`／`spawnSync` 的 stderr，不读返回值。 */
const probe = (() => {
  const r = spawnSync("ffmpeg", ["-i", OUT, "-af", "volumedetect", "-f", "null", "-"],
    { encoding: "utf8" });
  return `${r.stderr ?? ""}`;
})();
const mean = probe.match(/mean_volume: (\S+)/)?.[1];
const peak = probe.match(/max_volume: (\S+)/)?.[1];
console.log(`✅ ${OUT} · ${Number(d).toFixed(1)} 秒 · 平均 ${mean} dB · 峰值 ${peak} dB`);
