#!/bin/bash
# Git Hooksセットアップスクリプト

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_HOOKS_DIR="$(git rev-parse --git-dir)/hooks"

echo "🔧 Git Hooksをセットアップしています..."

# pre-commit フックをコピー
if [ -f "$SCRIPT_DIR/pre-commit" ]; then
  cp "$SCRIPT_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit"
  chmod +x "$GIT_HOOKS_DIR/pre-commit"
  echo "✅ pre-commit フックをインストールしました"
else
  echo "❌ エラー: scripts/pre-commit が見つかりません"
  exit 1
fi

echo "✅ Git Hooksのセットアップが完了しました"
echo ""
echo "📝 インストールされたフック:"
echo "  - pre-commit: センシティブ情報チェック"
