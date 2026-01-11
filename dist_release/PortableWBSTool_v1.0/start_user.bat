@echo off
chcp 65001 > nul
cd /d %~dp0

echo ================================
echo  Portable WBS Tool [一般ユーザー]
echo ================================
echo.

REM 設定ファイルの存在確認
if not exist config.ini (
    echo [エラー] config.ini が見つかりません。
    pause
    exit /b 1
)

REM Python実行環境の確認
if exist bin\python-embed\python.exe (
    set PYTHON_EXE=bin\python-embed\python.exe
) else (
    where python >nul 2>&1
    if %errorlevel%==0 (
        set PYTHON_EXE=python
    ) else (
        echo [エラー] Python が見つかりません。
        pause
        exit /b 1
    )
)

echo Python: %PYTHON_EXE%
echo モード: 一般ユーザー
echo.

REM 一般ユーザーモードでサーバー起動
set WBS_MODE=user
%PYTHON_EXE% bin\app\server.py

pause
