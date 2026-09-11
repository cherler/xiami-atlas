#!/bin/bash
# 切产物：备份当前版本 → 换上新构建 → 清垃圾文件 → 只留最近三份备份。
#
# ## 为什么要有这个脚本
#
# 这四步以前是**每次上线手打的四行命令**。手打的问题不是麻烦，是
# **总有一步会被忘掉**：2026-08-17 发现备份攒了 27 份共 2.5G，
# 就是因为「清旧备份」那一步从来没人记得。写进运维文档也没用 ——
# **文档不是自动化，它只是把「记得做」这件事换了个地方存。**
#
# ## 三道闸门在外面
#
# 这个脚本**只管切**，不管构建对不对。构建是否真的跑过（DONE_0 / 日志行数 /
# 页数对得上）由调用方先验 —— 那三条见 deploy/README.md，
# 它们拦住过一次「把上一版当新产物切上去」的静默回滚。
#
# 用法（在服务器上跑）：
#   sudo bash scripts/swap.sh /srv/<your-app>/out /srv/<your-app>
set -euo pipefail

SRC="${1:?要给构建产物目录，例如 /srv/<your-app>/out}"
DST="${2:?要给站点根目录，例如 /srv/<your-app>}"
KEEP="${KEEP:-3}"

[ -d "$SRC" ] || { echo "❌ 产物目录不存在：$SRC"; exit 1; }
PAGES=$(find "$SRC" -name '*.html' | wc -l | tr -d ' ')
[ "$PAGES" -gt 0 ] || { echo "❌ 产物里一个 html 都没有，不切"; exit 1; }

TS=$(date +%Y%m%d-%H%M%S)
if [ -d "$DST/current" ]; then
  mv "$DST/current" "$DST/backup-$TS"
  echo "备份 → backup-$TS"
fi
cp -r "$SRC" "$DST/current"

# macOS 打包偶尔会混进 AppleDouble 垃圾（成因见 deploy/README.md 的「未解之谜」）。
# **这条检查不依赖成因**，所以比猜成因可靠。
JUNK=$(find "$DST/current" -name '._*' | wc -l | tr -d ' ')
find "$DST/current" -name '._*' -delete
[ "$JUNK" -gt 0 ] && echo "清掉 $JUNK 个 ._ 垃圾文件"

# 只留最近 KEEP 份。**这一步就是以前总被忘掉的那一步。**
#
# ⚠️ **按名字排，不按 mtime 排。** 第一版写的是 `ls -dt`（按修改时间），
# 自检时立刻翻车：它把刚 mv 出来的那份当成最旧的删了 ——
# 因为 `mv` 保留的是原目录的 mtime，而旧备份被别的操作碰过反而更新。
# 备份名里本来就带时间戳，**名字倒序就是时间倒序**，不依赖文件系统的元数据。
cd "$DST"
OLD=$(ls -d backup-* 2>/dev/null | sort -r | tail -n +$((KEEP + 1)) || true)
if [ -n "$OLD" ]; then
  echo "$OLD" | xargs rm -rf
  echo "清掉 $(echo "$OLD" | wc -l | tr -d ' ') 份旧备份"
fi

echo "切完：$PAGES 页 · 备份 $(ls -d backup-* 2>/dev/null | wc -l | tr -d ' ') 份 · 占用 $(du -sh "$DST" | cut -f1)"
