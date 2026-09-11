#!/bin/bash
# 定时一跳：抓到期的源 → 写快照 → 提交 → 记日志。
#
# **这一段必须是纯程序**（§33）：抓取、指纹、比对都是确定性的，不需要也不该
# 让模型参与。模型只在下一步「这段变化意味着什么」时进来。
#
# 由 launchd 调度（ops/com.xiamimate.atlas-watch.plist），不是 CronCreate ——
# CronCreate 只活在一个 Claude 会话里、7 天过期，而这条管线要长期跑。
#
# 三条纪律：
#   1. **只提交 data/snapshots 与 data/watch-report.md。** 绝不碰 atlas.json ——
#      「世界变了」和「我们认定它变了」是两件事，后者要走人审（§59.3 的黄/红通道）。
#   2. **提交者署名 atlas-watch[bot]**，和人工提交在 git log 里一眼分得开。
#      这正是 §59.4.c 说的「commit author 免费当录入身份用」。
#   3. **失败不静默**：抓不到、没内容都进日志，日志本身就是「哪家没有公开入口」的证据。
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
LOG=data/watch.log
mkdir -p data

# 这台机器上的代理。launchd 不继承登录 shell 的环境变量，所以要显式给。
# 代理没开也不致命 —— 一部分源直连可达，抓不到的会如实记进报告。
export HTTPS_PROXY="${HTTPS_PROXY:-http://127.0.0.1:7890}"
export HTTP_PROXY="${HTTP_PROXY:-$HTTPS_PROXY}"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

# 密钥从仓库根的 .env 读（已在 .gitignore 里）。
# **不写进 plist** —— plist 是要进 git 的，密钥进 git 就废了。
[ -f .env ] && set -a && . ./.env && set +a

STAMP=$(date '+%Y-%m-%d %H:%M')
echo "── ${STAMP} 开跑" >> "$LOG"

if ! node scripts/watch.mjs --due >> "$LOG" 2>&1; then
  echo "   watch.mjs 退出码非零，见上方输出" >> "$LOG"
fi

# 只有快照或报告真的变了才提交 —— 空提交会把 git log 冲成噪音，
# 而 git log 是我们的 ChangeEvent 表。
# **判据是快照变没变，不是报告变没变。** 报告每跑一次都会带上新时间戳，
# 拿它当判据的话每天都会产生一次空提交，把 git log（我们的 ChangeEvent 表）冲成噪音。
if [ -n "$(git status --porcelain data/snapshots)" ]; then
  git add data/snapshots data/watch-report.md
  CHANGED=$(git diff --cached --name-only | grep -c 'data/snapshots/' || true)
  git -c user.name='atlas-watch[bot]' -c user.email='atlas-watch@xiamimate.local' \
      commit -q -m "watch: ${STAMP}，${CHANGED} 个源的快照有变动

由 scripts/tick.sh 自动提交。只动快照与报告，**没有碰 atlas.json** ——
「世界变了」不等于「我们认定它变了」，后者要走人审。
待办见 data/watch-report.md。" \
    && echo "   已提交：${CHANGED} 个源有变动" >> "$LOG"
else
  echo "   无变动，不提交" >> "$LOG"
fi

# 有变化才调模型。**这是管线里唯一花钱的一步**，没变化时一分不花。
# 抽出来的是候选，落在 data/inbox/，**不进 atlas.json** —— 那要走人审。
#
# ⚠️ **跳过必须留痕。** 2026-08-08 起这一步因为缺 MINIMAX_API_KEY 连跳了一个月，
# 而当时唯一的痕迹是下面那行 echo —— 日志里的一行字，没人会看。
# 后果：「页面变了 → 这意味着出了新版」这条链路整月没跑，
# GPT-6 Astra 和 Claude Fable 5.1 就是在这段时间里抓到了却没人知道。
# 现在状态写进 data/pipeline.json，`todo.mjs` 会把连跳的天数摆到人面前。
if [ -n "${MINIMAX_API_KEY:-}" ] && [ "${CHANGED:-0}" != "0" ]; then
  if node scripts/extract.mjs >> "$LOG" 2>&1; then
    node scripts/stamp.mjs extract ok
  else
    echo "   extract.mjs 失败，见上方" >> "$LOG"
    node scripts/stamp.mjs extract fail "extract.mjs 退出码非零，见 data/watch.log"
  fi
elif [ -z "${MINIMAX_API_KEY:-}" ]; then
  echo "   没有 MINIMAX_API_KEY，跳过抽取（采集本身不需要模型）" >> "$LOG"
  node scripts/stamp.mjs extract skip "没有 MINIMAX_API_KEY —— 密钥要写进仓库根的 .env"
else
  # 没变化不算跳过：这一步本来就只在有变化时才该跑
  node scripts/stamp.mjs extract ok
fi

# ── 保鲜巡检：页面上写的还成不成立
#
# 三支：开源项目的仓库数字 / README 上游改没改口径 / 教程与作品的外链。
#
# **原来只有第一支挂在这儿，另外两支没有任何调度** —— 靠人想起来才跑，
# 于是「上游把 README 改了、我们页面上那句引用成了假话」这件事，
# 从来没有人会收到通知。2026-08-18 收进 `fresh.mjs` 一起跑。
#
# 三支都**只报不改**（仓库那支固定 `--dry`）：上面第 1 条纪律说得很清楚，
# 机器不碰 atlas.json。星数虽然是机器算得出来的，可「停更 12 个月」这条线一跨，
# 卡上的标签、`unfit` 里的判断、甚至要不要继续收录都得跟着重想 ——
# 那是认定，不是抓取。真正写回由人在审阅台上点。
#
# 结果落 `data/fresh.json`，下一步的 `todo.mjs` 会把它并进当天的待办 ——
# **不再往 watch-report.md 里塞一段**：那份是盯梢报告，混进别的东西
# 会让「快照变没变」这个判据读起来越来越费劲。
node scripts/fresh.mjs >> "$LOG" 2>&1
echo "   保鲜巡检跑完（退出码 $? ，明细 data/fresh-report.md）" >> "$LOG"

# ── 引文回查：署的那个来源，今天还找得到这句话吗？
#
# **必须放在 watch 之后**：它比对的是刚落地的快照。
# 2026-08-15 加的，起因是那天 watch 一口气建了 31 个「首次」快照 ——
# 全是早就被格子引用、却从没进过监视的源。也就是说在那之前，
# **那些页变了也没人会发现**，「这个站会自己发现自己错了」在它们身上是假的。
#
# 它只写报告，**不改 atlas.json**，和 watch 同一条纪律。
node scripts/requote.mjs --report >> "$LOG" 2>&1 || echo "   requote.mjs 失败，见上方" >> "$LOG"

# ── 版本哨兵：快照里已经出现、我们却还没写回的版本号。
#
# **必须放在 watch 之后**，它比对的是刚落地的快照。
# 2026-09-10 加的，起因是负责人报了三条我们「不知道」的更新，
# 而其中两条（GPT-6 Astra、Claude Fable 5.1）**早就躺在我们自己的快照里** ——
# 抓到了，只是管线里没有任何一步会说「这条变了要写回」。
# 退出码 1 表示「有更新的一代」，这里不当失败处理：它写报告，不改 atlas.json。
node scripts/version-sentry.mjs --json >> "$LOG" 2>&1
echo "   版本哨兵跑完（明细 data/version-sentry.md）" >> "$LOG"
node scripts/stamp.mjs sentry ok

# ── 待办：汇成一个文件，并且主动叫人。
#
# **管线会攒待办，但在这之前它不会叫人** —— 收件箱里 17 条从 08-07 躺到 08-11，
# 四天没人知道，因为唯一的出口是这个日志文件，而人不会每天打开日志。
# 现在收敛到一个 data/TODO.md，并发一条本机通知（零成本、不需要任何凭据）。
# 要邮件/微信是另一件事，得先定渠道 —— 那是花钱和对外的决定。
node scripts/todo.mjs --notify >> "$LOG" 2>&1 || echo "   todo.mjs 失败，见上方" >> "$LOG"

# ── 突发：等不到周报的那几条，当天送出去。
#
# 待办报的是**我们自己要干的活**，突发报的是**世界变了、而且读者今天就该知道**。
# 两件事，两条线：待办进飞书给自己看，突发同时上站内横幅、RSS，并推一条飞书。
#
# 它**只读 changes.json**，不碰 atlas.json —— 和 watch / fresh 同一条纪律。
# 挂多久由 `breaking.until` 带着，**过期自己下架，不需要人记得撤**。
# 推过的记在 data/alert-sent.json，不会天天重推。
node scripts/alert.mjs --push >> "$LOG" 2>&1 || echo "   alert.mjs 失败，见上方" >> "$LOG"

# 待办表变了就提交 —— 它和快照一样是「这一天的事实」，要能回溯。
# 保鲜巡检的两份也一起：「那天上游 README 改了什么」以后要查得回来。
PAPER="data/TODO.md data/requote-report.md data/fresh-report.md data/fresh.json data/alerts.json data/alert-sent.json data/version-sentry.md data/version-sentry.json data/pipeline.json"
if [ -n "$(git status --porcelain $PAPER)" ]; then
  git add $PAPER
  git -c user.name='atlas-watch[bot]' -c user.email='atlas-watch@xiamimate.local' \
      commit -q -m "watch: ${STAMP} 待办表更新" && echo "   待办表已提交" >> "$LOG"
fi

echo "" >> "$LOG"
