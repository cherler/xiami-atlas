/**
 * 给产品片配音、配乐、混音。**照搬 promo-hf 那条线用血换来的几条规矩。**
 *
 * ## 一、时间轴由配音决定，不能反过来
 *
 * 先画面后配音，必然出现「话没说完画面就切了」或者「说完干等两秒」——
 * 旁白长度是唯一你控制不了的量，同一句话 speed 差 0.05 就差半秒。
 * 所以顺序是：**写稿 → 配音 → 拿真实毫秒排轴 → 才重切画面**。
 * MiniMax 的 `extra_info.audio_length` 直接给毫秒，省一次 ffprobe。
 *
 * ## 二、`vol` 必须是 1
 *
 * 那边实测过：vol=3.5 时波形**在 MiniMax 那一端就已经切顶**
 * （削平采样 915 个），后面无论怎么归一化都只是把一段削烂的波形调小声，
 * 听感就是「音量不大但破音感还在」。响度的杠杆在混音那一步，不在这里。
 *
 * ## 三、44.1kHz WAV，不要 32k mp3
 *
 * 32k 采样的奈奎斯特只有 16kHz，齿音和空气感全没，听着发闷。这一层本来就能要无损。
 *
 * ## 四、旁白不许念字幕
 *
 * 字幕是给静音看的人（85%），旁白要补字幕说不了的东西。
 * 两边一模一样的话，那条线被使用者一眼看穿：「几乎就是在读截图内容」。
 *
 * ## 五、music 接口返回的是 hex 不是 base64
 *
 * `{ data: { audio: "<hex>" } }` —— 当 base64 解会得到一堆噪音（那边踩过）。
 *
 *   MINIMAX_API_KEY=<key> node scripts/film-audio.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const KEY = (process.env.MINIMAX_API_KEY || "").trim();
if (!KEY) { console.error("缺 MINIMAX_API_KEY"); process.exit(1); }

const DIR = "assets/film-audio";
mkdirSync(DIR, { recursive: true });

/**
 * 旁白。**每一句都在推进「这是什么产品」**，而不是复述字幕。
 *
 * ⚠️ 砍过两句：「四百二十六格官方没说」与「该用哪个坑在哪」。
 * 它们都对，但都是**补充不是主线** —— 抖音那支 skill 的第一条是
 * 「一个片子只有一个 payoff，第二个想法就该做成第二支片」。
 * 42 秒收到 34 秒，中段就不平了。
 */
const VO = [
  "别再问哪个 AI 最强。",
  "该问的是：它能不能做我要做的这件事。",
  "虾米看AI，把这个问题拆成一千零一十二格，一格一个答案。",
  "每一格，都点得开厂商官方的原话。",
  "五百二十格说能——五百二十格，全都带得出出处。",
  "而官方说了，也未必是实情。",
  "文档写着支持打断，用的人在 issue 里说，最快也要三秒。",
  "一百零三个开源项目，我们读到 issue 那一层。",
  "不替你下判断。把每一格的出处摆出来。",
];

const VOICE = { model: "speech-2.8-hd", voice_id: "male-qn-jingying", speed: 1.06 };

/** 取过的音存下来 —— 同一句话每次合成都是新的一条，重跑会让口气变。 */
const key = (t) => createHash("sha1")
  .update([VOICE.model, VOICE.voice_id, String(VOICE.speed), t].join("|")).digest("hex").slice(0, 16);

async function say(text) {
  const f = `${DIR}/vo-${key(text)}.wav`;
  if (existsSync(f)) return f;
  const res = await fetch("https://api.minimaxi.com/v1/t2a_v2", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: VOICE.model, text, stream: false,
      /** vol 必须是 1 —— 见文件头第二条。 */
      voice_setting: { voice_id: VOICE.voice_id, speed: VOICE.speed, vol: 1, pitch: 0 },
      audio_setting: { sample_rate: 44100, format: "wav", channel: 1 },
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 180)}`);
  const j = await res.json();
  const hex = j?.data?.audio;
  if (!hex) throw new Error(`TTS 没返回音频：${JSON.stringify(j).slice(0, 200)}`);
  writeFileSync(f, Buffer.from(hex, "hex"));
  return f;
}

console.log("配音…");
const lens = [];
for (let i = 0; i < VO.length; i++) {
  const f = await say(VO[i]);
  const d = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "csv=p=0", f], { encoding: "utf8" }).trim());
  lens.push({ i, f, d });
  console.log(`  ${String(i).padStart(2)} ${d.toFixed(2)}s  ${VO[i].slice(0, 26)}`);
}
/** 把真实时长交给切片脚本 —— **画面跟着声音走**。 */
writeFileSync(`${DIR}/vo-lens.json`, JSON.stringify(lens.map((x) => x.d), null, 1));
console.log(`旁白共 ${lens.reduce((a, b) => a + b.d, 0).toFixed(1)} 秒 → ${DIR}/vo-lens.json`);

/* ── 配乐 ────────────────────────────────────────────────────────── */
/**
 * 调性：**不燃，但要有推动力。**
 *
 * 负责人这次的要求是「要直接、要秀、要吸引注意力」，所以不能像
 * 虾米看股那支那样「有人在安静地干活」。但也不能变成预告片 ——
 * 这个产品卖的是「每一格都能核对」，喊单感会把性格改掉。
 * 要的是：稳定的八分音符脉冲、干净的合成低音、明确的节拍，能被听见但不抢旁白。
 */
const MUSIC_PROMPT = [
  "Instrumental background music for a punchy product demo film about an AI capability fact-checking site.",
  "Confident and modern, clearly audible under narration: a steady eighth-note pulse on plucked synth or marimba,",
  "a clean warm synth bass, crisp light percussion with a defined backbeat, subtle bright arpeggios.",
  "Mid-tempo around 100 BPM, forward-moving and precise.",
  "Absolutely no vocals. No epic trailer build-ups, no risers, no big drop, no orchestral swells, no cinematic braams.",
].join(" ");

const musicRaw = `${DIR}/music-raw.mp3`;
if (!existsSync(musicRaw)) {
  console.log("配乐…");
  const body = JSON.stringify({
    model: "music-1.5", prompt: MUSIC_PROMPT,
    lyrics: "##\n(instrumental)\n##",
    audio_setting: { sample_rate: 44100, bitrate: 256000, format: "mp3" },
  });
  const out = execFileSync("curl", ["-s", "-X", "POST", "https://api.minimaxi.com/v1/music_generation",
    "-H", `authorization: Bearer ${KEY}`, "-H", "content-type: application/json", "-d", body],
    { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const j = JSON.parse(out);
  const hex = j?.data?.audio;
  /** hex 不是 base64 —— 当 base64 解会得到噪音。 */
  if (!hex) { console.error("配乐没拿到：", JSON.stringify(j).slice(0, 300)); process.exit(1); }
  writeFileSync(musicRaw, Buffer.from(hex, "hex"));
}
console.log(`配乐 ${musicRaw}`);
console.log("\n下一步：node scripts/film-cut.mjs（它会读 vo-lens.json 按真实旁白排轴），再 node scripts/film-mix.mjs");
