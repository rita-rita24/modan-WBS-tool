#!/bin/bash
cd "$(dirname "$0")"

# 仮想環境の確認（基本的には管理者がセットアップ済みのはずだが念のため）
if [ ! -d ".venv" ]; then
    echo "Virtual environment not found. Please ask admin or run start_admin.command first."
    exit 1
fi

source .venv/bin/activate

# 一般ユーザーモードで起動
export WBS_MODE=user
python bin/app/server.py
