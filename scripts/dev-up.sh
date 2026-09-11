#!/usr/bin/env bash
#
# 起本地开发的两条链路，并且**让它们活过启动它们的那个终端**。
#
# ## 为什么要这个脚本
#
# `nohup npm run dev &` 起的进程，反复在会话结束时被带走 ——
# 日志末尾总是 `^[[?25h`（恢复光标），那是**被信号终止**的样子，不是崩溃。
# 加 `disown` 也没用：它只是让 shell 不再管这个作业，
# **挡不住发给整个进程组的信号**。要的是「新建一个会话」——
# 也就是 `setsid`，但 **macOS 上没有这个命令**（第二版就是这么炸的：
# `setsid: command not found`）。所以用 python 做同一件事：
# `os.setsid()` 之后再 `Popen`，父进程随即退出，子进程被过继给 init，
# 从此和这个终端、这个进程组都没关系。
#
# 负责人 2026-08-12 与 08-13 各问过一次「3000 端口死掉了」，
# 两次的日志尾巴一模一样。**同一个现象出现两次，就该修工具而不是再手起一遍。**
#
# ## 用法
#
#   bash scripts/dev-up.sh          # 两条都起
#   bash scripts/dev-up.sh atlas    # 只起 :3400（能力地图自己）
#   bash scripts/dev-up.sh main     # 只起 :3000（主站，/atlas 由它反代到 3400）
#
# ⚠️ 变量一律写成 `${name}` 而不是 `$name`：这个脚本的提示语里有全角括号，
# `$name（` 会让 bash 把变量名读串（第一版就是这么炸的，报
# `name?: unbound variable`）。
set -u

ROOT="${HOME}/projects/xiamimate"

# up <名字> <目录> <端口> <探活路径>
up() {
  local name="$1" dir="$2" port="$3" path="$4"
  local url="http://127.0.0.1:${port}${path}"

  if curl -sf -o /dev/null --max-time 3 "${url}"; then
    echo "  ${name}(:${port}) 已经在跑，跳过"
    return
  fi
  if [ ! -d "${dir}" ]; then
    echo "  ${name} 跳过：目录不存在 ${dir}"
    return
  fi

  # 脱到新会话。子 shell 里 cd，不影响调用者的工作目录。
  ( cd "${dir}" && python3 -c '
import os, sys, subprocess
os.setsid()                      # 新会话：终端关了、进程组被信号了，都波及不到
log = open(sys.argv[1], "w")
subprocess.Popen(sys.argv[2:], stdout=log, stderr=subprocess.STDOUT,
                 stdin=subprocess.DEVNULL)
' "/tmp/xm-${name}-dev.log" npm run dev )

  local i
  for i in $(seq 1 60); do
    curl -sf -o /dev/null --max-time 3 "${url}" && break
    sleep 2
  done

  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${url}")
  if [ "${code}" = "200" ]; then
    echo "  ${name}(:${port}${path}) -> ${code}   日志 /tmp/xm-${name}-dev.log"
  else
    # **起不来要说清楚，别只回一个数字。** 日志尾巴通常一眼能看出原因。
    echo "  ${name}(:${port}${path}) -> ${code}  ⚠️ 没起来，日志末尾："
    tail -5 "/tmp/xm-${name}-dev.log" 2>/dev/null | sed 's/^/      /'
  fi
}

case "${1:-all}" in
  atlas) up atlas "${ROOT}/xiamimate-ai-atlas" 3400 /atlas ;;
  main)  up frontend "${ROOT}/xiamimate-tools-frontend" 3000 / ;;
  *)
    up atlas "${ROOT}/xiamimate-ai-atlas" 3400 /atlas
    up frontend "${ROOT}/xiamimate-tools-frontend" 3000 /
    ;;
esac
