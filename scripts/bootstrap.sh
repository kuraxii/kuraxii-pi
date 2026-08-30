#!/usr/bin/env bash
#
# 引导脚本：检测 bun，没有则自动下载到项目 .bun/，然后编译脚本
#
# 用法: bash scripts/bootstrap.sh
#       或 bun run bootstrap

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BUN_DIR="$ROOT/.bun"
BUN_BIN="$BUN_DIR/bin/bun"

# 1. 检测 bun
if command -v bun &>/dev/null; then
  BUN="bun"
  echo "✓ 检测到系统 bun: $(bun --version)"
elif [ -f "$BUN_BIN" ]; then
  BUN="$BUN_BIN"
  echo "✓ 检测到项目 bun: $($BUN_BIN --version)"
else
  echo "→ 未找到 bun，下载到 $BUN_DIR ..."
  mkdir -p "$BUN_DIR"
  curl -fsSL https://bun.sh/install | bash -s -- --install-dir "$BUN_DIR" 2>&1
  BUN="$BUN_BIN"
  echo "✓ bun 已下载: $($BUN --version)"
fi

# 2. 编译脚本
echo "→ 编译脚本..."
cd "$ROOT"
$BUN build --compile scripts/install.ts --outfile scripts/install
$BUN build --compile scripts/build.ts --outfile scripts/build
echo "✓ 编译完成:"
echo "    scripts/install  ($(du -h scripts/install | cut -f1))"
echo "    scripts/build    ($(du -h scripts/build | cut -f1))"