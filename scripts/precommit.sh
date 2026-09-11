#!/bin/bash
# 提交前必须全过。**上一次我在构建失败的情况下提交了** ——
# 因为 `tsc | head` 让退出码永远是 0，`&&` 链断在 build，
# 而 git commit 是下一条命令，照样跑。
#
# 这支把顺序钉死：类型 → 数据校验 → 规则自测 → 构建 → 出站验证。
# 任何一步不过就退出，不给「顺手提交」留缝。
set -euo pipefail
cd "$(dirname "$0")/.."
echo "── 1/5 类型";     npx tsc --noEmit
echo "── 2/5 数据校验"; node scripts/validate.mjs
echo "── 3/5 规则自测"; node scripts/test-rules.mjs
echo "── 4/5 构建";     npx next build > /tmp/atlas-build.log 2>&1 || { tail -20 /tmp/atlas-build.log; exit 1; }
echo "── 5/5 出站验证"; node scripts/verify.mjs
# **构建会把 .next 写成生产形态，正在跑的 next dev 复用它就对不上** ——
# 表现是页面能开、但 _next/static/* 全 404，整页无样式无交互。
# 跑完清掉，下次 dev 从零编译。**别让「跑一次验证」把开发环境弄坏。**
#
# ⚠️ 但光清不够。2026-08-11 这一条自己咬了三次：
# dev 服务器正开着的时候清掉 .next，那个进程会一直去读已经不存在的
# page_client-reference-manifest.js，**整站 500，而且它自己不会恢复**；
# 再起一个还会跟它抢端口，变成两个进程都半死。
# 所以：**发现 dev 在跑，就连它一起重启** —— 清完再拉起来，别把人扔在 500 上。
DEV_PORT="${ATLAS_DEV_PORT:-3400}"
DEV_PIDS="$(lsof -ti:"$DEV_PORT" 2>/dev/null || true)"
# **顺序要紧：先停 dev，再删 .next。** 反过来 rm 会撞上它开着的文件描述符，
# 报一串 "Directory not empty" 然后留下一个删了一半的 .next —— 比不删更糟。
if [ -n "$DEV_PIDS" ]; then
  echo "检测到 :$DEV_PORT 上有 dev 服务器，先停它再清 .next（否则删不干净，而且它会一直 500）"
  kill $DEV_PIDS 2>/dev/null || true
  sleep 2
  kill -9 $(lsof -ti:"$DEV_PORT" 2>/dev/null) 2>/dev/null || true
fi
rm -rf .next
if [ -n "$DEV_PIDS" ]; then
  nohup npm run dev > /tmp/atlas-dev.log 2>&1 < /dev/null &
  disown 2>/dev/null || true
  for _ in $(seq 1 40); do
    [ "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "http://127.0.0.1:$DEV_PORT/atlas" 2>/dev/null)" = "200" ] \
      && { echo "   dev 已恢复：http://127.0.0.1:$DEV_PORT/atlas"; break; }
    sleep 2
  done
else
  echo "已清 .next（构建产物会让 next dev 拿到对不上的 chunk）"
fi
echo "全部通过，可以提交。"
