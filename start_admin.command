#!/bin/bash
cd "$(dirname "$0")"

# 仮想環境の確認と作成
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
    source .venv/bin/activate
    echo "Installing dependencies..."
    pip install -r bin/app/requirements.txt
else
    source .venv/bin/activate
fi

# 管理者モードで起動
export WBS_MODE=admin
python bin/app/server.py
