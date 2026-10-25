#!/usr/bin/env bash
# 写给自己 · Linux / WSL 一键启动
#
# 首次运行会自动安装依赖并构建，之后直接启动。
# 用法：
#   ./start-diary.sh                # 启动并尝试打开浏览器
#   ./start-diary.sh --no-open      # 只启动，不打开浏览器（WSL 推荐）
#   ./start-diary.sh --port 4300    # 换端口（换端口等于换站点，看不到原来的笔记）
set -euo pipefail

cd -- "$(dirname -- "$(readlink -f "${BASH_SOURCE[0]}")")"

info() { printf '\n  %s\n' "$1"; }
fail() { printf '\n  ✗ %s\n\n' "$1" >&2; exit 1; }

command -v node >/dev/null 2>&1 ||
  fail "没有找到 Node.js。请先安装 20.19+ 或 22.12+：https://nodejs.org/"

node -e '
const [major, minor] = process.versions.node.split(".").map(Number);
const ok =
  (major === 20 && minor >= 19) || (major >= 22 && (major > 22 || minor >= 12));
process.exit(ok ? 0 : 1);
' || fail "当前 Node.js $(node -v) 版本太旧，需要 20.19+ 或 22.12+：https://nodejs.org/"

command -v npm >/dev/null 2>&1 ||
  fail "没有找到 npm（通常随 Node.js 一起安装）。"

if [ ! -f node_modules/react/package.json ]; then
  info "首次运行，正在安装依赖，请稍候……"
  npm install --no-audit --no-fund || fail "依赖安装失败，请检查网络后重试。"
fi

info "正在启动（按 Ctrl+C 停止）……"
exec node scripts/serve-dist.mjs "$@"