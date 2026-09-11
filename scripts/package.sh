#!/bin/bash
# 打包上线产物。**校验在最前面** —— 数据坏了就不该有产物，
# 而不是先做出一个错的站再去发现。
set -euo pipefail
cd "$(dirname "$0")/.."

echo "── 1/6 校验数据"
node scripts/validate.mjs

# **规则自测：拿一条已知是错的数据喂进去，看规则响不响。**
#
# 2026-08-17 体检发现：114 条规则里只有 20 条被证明过会响，而这支自测
# **既没挂进 npm 也不在这份出站清单里** —— 于是它和规则脱节到 82% 都没人发现。
# 补样本那天就当场抓到一条摆设规则（R89 的判据被自己的豁免绕开了）。
#
# 所以它必须跑在 validate 之后：validate 说「数据是对的」，
# 这支说「说数据不对的那些规则，真的会说话」。
echo "── 2/6 规则自测（说数据不对的那些规则，自己会不会说话）"
node scripts/test-rules.mjs

echo "── 3/6 重出矩阵图（数据一变，图就得跟着变）"
node scripts/make-matrix.mjs

# 分享图不进 git —— 它是数据的产物，不是源码。
# 每次打包重出，才保证图上写的和站上写的是同一份数据。
echo "── 4/6 重出分享图与 RSS"
node scripts/make-share.mjs
node scripts/make-feed.mjs

echo "── 5/6 构建静态站"
rm -rf out
npm run build >/dev/null

# 出站前的最后一道：**量到用户能感知那一层**（详见 scripts/verify.mjs 开头）
echo "── 6/6 出站前验证"
node scripts/verify.mjs

echo "── 打包"
STAMP=$(date '+%Y%m%d-%H%M')
TAR="dist/atlas-${STAMP}.tar.gz"
mkdir -p dist
tar -czf "$TAR" -C out .
echo
echo "产物：${TAR}（$(du -h "$TAR" | cut -f1)）"
echo
# ⚠️ 这段原来写的是「current 是软链，回滚改指向」—— **和现场不符**。
# 实际上 current 是实目录，回滚靠 backup-<时间戳>，切产物用 scripts/swap.sh。
# 现在的做法是在服务器上构建（见 deploy/README.md），这个 tar 只作离线备份。
echo "上线看 deploy/README.md（服务器上构建 → 三道闸 → scripts/swap.sh 切产物）。"
echo "这个 tar 是离线备份，不是上线路径。"
