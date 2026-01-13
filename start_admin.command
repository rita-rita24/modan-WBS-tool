#!/bin/bash
cd "$(dirname "$0")"

echo "================================"
echo " Portable WBS Tool [管理者モード]"
echo "================================"
echo ""

# 環境変数設定
export WBS_DATA_PATH="$(pwd)/data/wbs_data.json"
export WBS_MODE="admin"
export WBS_PORT="8080"

echo "データファイル: $WBS_DATA_PATH"
echo "モード: 管理者"
echo "ポート: $WBS_PORT"
echo ""

# Pythonの実行
if [ -f "python/python" ]; then
    echo "Python: 同梱版を使用"
    ./python/python server/server.py
else
    echo "Python: システムPythonを使用"
    python3 server/server.py
fi
