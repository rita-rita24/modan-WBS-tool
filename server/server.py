"""
Portable WBS Tool - Flask Backend Server
=========================================
共有ファイル対応・楽観的ロック実装
"""

import os
import sys
import json
import hashlib
import uuid
from datetime import datetime
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import threading
import time

# =============================================================================
# 設定
# =============================================================================

# 環境変数からデータパスを取得（デフォルト: ./data/wbs_data.json）
DATA_PATH = Path(os.environ.get('WBS_DATA_PATH', './data/wbs_data.json'))

# ポート番号
PORT = int(os.environ.get('WBS_PORT', '8080'))

# モード（admin / user）
MODE = os.environ.get('WBS_MODE', 'admin')

# ユーザーID（userモード時）
USER_ID = os.environ.get('WBS_USER_ID', '')

# ベースディレクトリ
BASE_DIR = Path(__file__).parent.parent

# 静的ファイルディレクトリ
WEB_DIR = BASE_DIR / 'web'

# =============================================================================
# データ操作
# =============================================================================

def get_lock_path() -> Path:
    """ロックファイルパスを取得"""
    return DATA_PATH.with_suffix('.lock')


def acquire_lock(timeout: float = 10.0) -> bool:
    """ファイルロックを取得"""
    lock_path = get_lock_path()
    start_time = time.time()

    while time.time() - start_time < timeout:
        try:
            # ロックファイルを排他的に作成
            fd = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, str(os.getpid()).encode())
            os.close(fd)
            return True
        except FileExistsError:
            # ロックファイルが存在する場合、古いロックかチェック
            try:
                mtime = lock_path.stat().st_mtime
                if time.time() - mtime > 30:  # 30秒以上古いロックは削除
                    lock_path.unlink()
                    continue
            except Exception:
                pass
            time.sleep(0.1)
        except Exception:
            time.sleep(0.1)

    return False


def release_lock():
    """ファイルロックを解放"""
    try:
        get_lock_path().unlink()
    except Exception:
        pass


def load_data() -> dict | None:
    """データを読み込む"""
    if not DATA_PATH.exists():
        return None

    try:
        with open(DATA_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to load data: {e}")
        return None


def save_data(data: dict, expected_version: str | None = None) -> tuple[bool, str]:
    """
    データを保存する（楽観的ロック付き）

    Returns:
        tuple: (成功フラグ, 新バージョン or エラーメッセージ)
    """
    if not acquire_lock():
        return False, 'LOCKED'

    try:
        # 現在のデータを読み込み
        if DATA_PATH.exists():
            with open(DATA_PATH, 'r', encoding='utf-8') as f:
                current_data = json.load(f)
            current_version = current_data.get('meta', {}).get('version', '')

            # バージョンチェック（楽観的ロック）
            if expected_version and current_version != expected_version:
                return False, 'CONFLICT'

        # 新しいバージョンを生成
        new_version = str(uuid.uuid4())
        data['meta'] = data.get('meta', {})
        data['meta']['version'] = new_version
        data['meta']['last_updated'] = int(datetime.now().timestamp())

        # 親ディレクトリを作成
        DATA_PATH.parent.mkdir(parents=True, exist_ok=True)

        # ファイルに書き込み
        with open(DATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        return True, new_version

    except Exception as e:
        return False, str(e)

    finally:
        release_lock()


def init_default_data():
    """デフォルトデータを初期化"""
    if DATA_PATH.exists():
        return

    today = datetime.now()

    default_data = {
        "config": {
            "admin_password_hash": hashlib.sha256("admin".encode()).hexdigest()
        },
        "meta": {
            "version": str(uuid.uuid4()),
            "last_updated": int(today.timestamp())
        },
        "tasks": [
            {
                "id": "t-001",
                "name": "サンプルプロジェクト",
                "start": today.strftime("%Y-%m-%d"),
                "end": (today.replace(day=today.day + 7) if today.day <= 24 else today.replace(month=today.month + 1, day=7)).strftime("%Y-%m-%d"),
                "assignee_id": "u1",
                "parent_id": None,
                "progress": 0,
                "is_milestone": False,
                "dependencies": []
            }
        ],
        "users": [
            {"id": "u1", "name": "管理者", "role": "admin"}
        ]
    }

    save_data(default_data)


# =============================================================================
# HTTP ハンドラー
# =============================================================================

class WBSHandler(SimpleHTTPRequestHandler):
    """WBS Tool用HTTPハンドラー"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB_DIR), **kwargs)

    def do_GET(self):
        """GETリクエスト処理"""
        parsed = urlparse(self.path)
        path = parsed.path

        if path == '/api/data':
            self.handle_get_data()
        elif path == '/api/system':
            self.handle_get_system()
        elif path == '/':
            self.path = '/index.html'
            super().do_GET()
        else:
            super().do_GET()

    def do_POST(self):
        """POSTリクエスト処理"""
        parsed = urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'

        try:
            payload = json.loads(body) if body else {}
        except json.JSONDecodeError:
            self.send_json_response({'error': 'Invalid JSON'}, 400)
            return

        if path == '/api/data':
            self.handle_post_data(payload)
        elif path == '/api/auth':
            self.handle_auth(payload)
        elif path == '/api/users':
            self.handle_add_user(payload)
        elif path == '/api/generate-batch':
            self.handle_generate_batch(payload)
        else:
            self.send_json_response({'error': 'Not Found'}, 404)

    def send_json_response(self, data: dict, status: int = 200):
        """JSONレスポンスを送信"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def do_OPTIONS(self):
        """OPTIONSリクエスト（CORS）"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def handle_get_data(self):
        """データ取得API"""
        data = load_data()
        if data is None:
            init_default_data()
            data = load_data()

        if data is None:
            self.send_json_response({'error': 'データファイルが見つかりません'}, 404)
            return

        self.send_json_response(data)

    def handle_get_system(self):
        """システム情報取得API"""
        self.send_json_response({
            'mode': MODE,
            'user_id': USER_ID,
            'server_time': int(datetime.now().timestamp()),
            'data_path': str(DATA_PATH)
        })

    def handle_post_data(self, payload: dict):
        """データ保存API"""
        data = payload.get('data')
        expected_version = payload.get('expected_version')

        if not data:
            self.send_json_response({'error': 'データが指定されていません'}, 400)
            return

        success, result = save_data(data, expected_version)

        if not success:
            if result == 'CONFLICT':
                self.send_json_response({
                    'error': '競合が検出されました。他のユーザーがデータを更新しています。',
                    'code': 'CONFLICT'
                }, 409)
            elif result == 'LOCKED':
                self.send_json_response({
                    'error': 'ファイルがロックされています。しばらくしてから再試行してください。',
                    'code': 'LOCKED'
                }, 423)
            else:
                self.send_json_response({'error': result}, 500)
            return

        self.send_json_response({'success': True, 'new_version': result})

    def handle_auth(self, payload: dict):
        """管理者認証API"""
        password = payload.get('password', '')

        data = load_data()
        if data is None:
            self.send_json_response({'error': 'データファイルが見つかりません'}, 404)
            return

        stored_hash = data.get('config', {}).get('admin_password_hash', '')
        input_hash = hashlib.sha256(password.encode()).hexdigest()

        if input_hash == stored_hash:
            self.send_json_response({'success': True, 'role': 'admin'})
        else:
            self.send_json_response({'success': False, 'error': 'パスワードが正しくありません'}, 401)

    def handle_add_user(self, payload: dict):
        """ユーザー追加API"""
        name = payload.get('name')
        expected_version = payload.get('expected_version')

        if not name:
            self.send_json_response({'error': 'ユーザー名が指定されていません'}, 400)
            return

        data = load_data()
        if data is None:
            self.send_json_response({'error': 'データファイルが見つかりません'}, 404)
            return

        # 新しいユーザーIDを生成
        new_id = f"u{int(datetime.now().timestamp() * 1000)}"
        new_user = {
            'id': new_id,
            'name': name,
            'role': 'member'
        }

        data['users'] = data.get('users', [])
        data['users'].append(new_user)

        success, result = save_data(data, expected_version)

        if not success:
            if result == 'CONFLICT':
                self.send_json_response({'error': '競合が検出されました', 'code': 'CONFLICT'}, 409)
            else:
                self.send_json_response({'error': result}, 500)
            return

        self.send_json_response({'success': True, 'user': new_user, 'new_version': result})

    def handle_generate_batch(self, payload: dict):
        """ユーザー用バッチファイル生成API"""
        user_id = payload.get('user_id')
        user_name = payload.get('user_name')
        os_type = payload.get('os_type', 'windows')  # windows or mac

        if not user_id or not user_name:
            self.send_json_response({'error': 'ユーザー情報が不足しています'}, 400)
            return

        # データパスを取得
        data_path = str(DATA_PATH.resolve())

        if os_type == 'windows':
            batch_content = f'''@echo off
chcp 65001 > nul
cd /d %~dp0

echo ================================
echo  Portable WBS Tool [{user_name}]
echo ================================
echo.

set WBS_DATA_PATH={data_path}
set WBS_MODE=user
set WBS_USER_ID={user_id}
set WBS_PORT=8080

echo データファイル: %WBS_DATA_PATH%
echo ユーザー: {user_name}
echo.

python\\python.exe server\\server.py

pause
'''
        else:
            batch_content = f'''#!/bin/bash
cd "$(dirname "$0")"

echo "================================"
echo " Portable WBS Tool [{user_name}]"
echo "================================"
echo ""

export WBS_DATA_PATH="{data_path}"
export WBS_MODE="user"
export WBS_USER_ID="{user_id}"
export WBS_PORT="8080"

echo "データファイル: $WBS_DATA_PATH"
echo "ユーザー: {user_name}"
echo ""

./python/python server/server.py
'''

        self.send_json_response({
            'success': True,
            'content': batch_content,
            'filename': f'start_{user_name}.{"bat" if os_type == "windows" else "command"}'
        })

    def log_message(self, format, *args):
        """ログ出力"""
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {args[0]}")


# =============================================================================
# メイン
# =============================================================================

def main():
    """メイン関数"""
    print("=" * 50)
    print(" Portable WBS Tool - Server")
    print("=" * 50)
    print(f" モード: {MODE}")
    print(f" ユーザーID: {USER_ID or '(admin)'}")
    print(f" データパス: {DATA_PATH}")
    print(f" Webディレクトリ: {WEB_DIR}")
    print(f" ポート: {PORT}")
    print("=" * 50)

    # デフォルトデータを初期化
    init_default_data()

    # サーバー起動
    server = HTTPServer(('127.0.0.1', PORT), WBSHandler)

    print(f"\n サーバー起動: http://127.0.0.1:{PORT}")
    print(" 終了するには Ctrl+C を押してください\n")

    # ブラウザを開く
    import webbrowser
    webbrowser.open(f'http://127.0.0.1:{PORT}')

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n サーバーを停止しました")
        server.shutdown()


if __name__ == '__main__':
    main()
