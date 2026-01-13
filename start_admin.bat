@echo off
chcp 65001 > nul
cd /d %~dp0

echo ================================
echo  Portable WBS Tool [管理者モード]
echo ================================
echo.

REM 環境変数設定
set WBS_DATA_PATH=%~dp0data\wbs_data.json
set WBS_MODE=admin
set WBS_PORT=8080

echo データファイル: %WBS_DATA_PATH%
echo モード: 管理者
echo ポート: %WBS_PORT%
echo.

REM Pythonの実行
if exist python\python.exe (
    echo Python: 同梱版を使用
    python\python.exe server\server.py
) else (
    echo Python: システムPythonを使用
    python server\server.py
)

pause
