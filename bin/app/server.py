"""
Portable WBS Tool - Flask Backend Server
=========================================
ローカル環境で動作するWBS/ガントチャート管理ツールのバックエンドサーバー
"""

import os
import sys
import json
import uuid
import hashlib
import shutil
import configparser
from datetime import datetime
from pathlib import Path

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import portalocker

# =============================================================================
# 初期設定
# =============================================================================

# プロジェクトルートディレクトリの取得
if getattr(sys, 'frozen', False):
    # PyInstallerでビルドされた場合
    BASE_DIR = Path(sys.executable).parent.parent.parent
else:
    # 通常実行時
    BASE_DIR = Path(__file__).parent.parent.parent

# 設定ファイルの読み込み
config = configparser.ConfigParser()
config_path = BASE_DIR / 'config.ini'

if config_path.exists():
    config.read(config_path, encoding='utf-8')
else:
    print(f"[警告] 設定ファイルが見つかりません: {config_path}")
    config['server'] = {'host': '127.0.0.1', 'port': '5000'}
    config['data'] = {'path': './bin/data/data.json'}
    config['backup'] = {'enabled': 'true', 'directory': './backup'}

# サーバー設定
HOST = config.get('server', 'host', fallback='127.0.0.1')
PORT = config.getint('server', 'port', fallback=5000)

# データファイルパス
DATA_PATH_STR = config.get('data', 'path', fallback='./bin/data/data.json')
DATA_PATH = Path(DATA_PATH_STR)
if not DATA_PATH.is_absolute():
    DATA_PATH = BASE_DIR / DATA_PATH

# バックアップ設定
BACKUP_ENABLED = config.getboolean('backup', 'enabled', fallback=True)
BACKUP_DIR_STR = config.get('backup', 'directory', fallback='./backup')
BACKUP_DIR = Path(BACKUP_DIR_STR)
if not BACKUP_DIR.is_absolute():
    BACKUP_DIR = BASE_DIR / BACKUP_DIR

# 起動モード（環境変数から取得）
# admin: 管理者モード, user: 一般ユーザーモード
APP_MODE = os.environ.get('WBS_MODE', 'user')

# =============================================================================
# Flask アプリケーション
# =============================================================================

app = Flask(__name__, static_folder='web', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# =============================================================================
# ユーティリティ関数
# =============================================================================

def load_data():
    """データファイルを読み込む"""
    if not DATA_PATH.exists():
        return None

    with portalocker.Lock(DATA_PATH, 'r', encoding='utf-8', timeout=10) as f:
        return json.load(f)


def save_data(data, expected_version=None):
    """
    データファイルを保存する（排他制御付き）

    Args:
        data: 保存するデータ
        expected_version: 期待するバージョン（楽観的ロック用）

    Returns:
        tuple: (成功フラグ, エラーメッセージ or 新バージョン)
    """
    try:
        with portalocker.Lock(DATA_PATH, 'r+', encoding='utf-8', timeout=10) as f:
            # 現在のデータを読み込み
            current_data = json.load(f)
            current_version = current_data.get('meta', {}).get('version')

            # バージョンチェック（楽観的ロック）
            if expected_version and current_version != expected_version:
                return False, 'CONFLICT'

            # 新しいバージョンを生成
            new_version = str(uuid.uuid4())
            data['meta']['version'] = new_version
            data['meta']['last_updated'] = int(datetime.now().timestamp())

            # ファイルを上書き
            f.seek(0)
            f.truncate()
            json.dump(data, f, ensure_ascii=False, indent=2)

            return True, new_version

    except portalocker.exceptions.LockException:
        return False, 'LOCKED'
    except Exception as e:
        return False, str(e)


def create_backup():
    """バックアップを作成する"""
    if not BACKUP_ENABLED or not DATA_PATH.exists():
        return None

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f"data_backup_{timestamp}.json"
    backup_path = BACKUP_DIR / backup_filename

    shutil.copy2(DATA_PATH, backup_path)

    return backup_path


def hash_password(password):
    """パスワードをSHA256でハッシュ化"""
    return hashlib.sha256(password.encode()).hexdigest()


# =============================================================================
# APIエンドポイント
# =============================================================================

@app.route('/api/data', methods=['GET'])
def get_data():
    """データ取得API"""
    data = load_data()
    if data is None:
        return jsonify({'error': 'データファイルが見つかりません'}), 404
    return jsonify(data)


@app.route('/api/system', methods=['GET'])
def get_system_info():
    """システム情報取得API"""
    auto_login_user = os.environ.get('WBS_AUTO_LOGIN_USER', None)
    return jsonify({
        'mode': APP_MODE,
        'server_time': int(datetime.now().timestamp()),
        'auto_login_user_id': auto_login_user
    })


@app.route('/api/data', methods=['POST'])
def post_data():
    """データ保存API（排他制御付き）"""
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({'error': '無効なリクエストです'}), 400

        data = payload.get('data')
        expected_version = payload.get('expected_version')
        updated_by = payload.get('updated_by', '不明')

        if not data:
            return jsonify({'error': 'データが指定されていません'}), 400

        # 更新者情報を設定
        data['meta']['updated_by'] = updated_by

        success, result = save_data(data, expected_version)

        if not success:
            if result == 'CONFLICT':
                return jsonify({
                    'error': '競合が検出されました。他のユーザーがデータを更新しています。',
                    'code': 'CONFLICT'
                }), 409
            elif result == 'LOCKED':
                return jsonify({
                    'error': 'ファイルがロックされています。しばらくしてから再試行してください。',
                    'code': 'LOCKED'
                }), 423
            else:
                return jsonify({'error': result}), 500

        return jsonify({'success': True, 'new_version': result})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/auth', methods=['POST'])
def authenticate():
    """管理者認証API"""
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({'error': '無効なリクエストです'}), 400

        password = payload.get('password', '')

        data = load_data()
        if data is None:
            return jsonify({'error': 'データファイルが見つかりません'}), 404

        stored_hash = data.get('config', {}).get('admin_password_hash', '')
        input_hash = hash_password(password)

        if input_hash == stored_hash:
            return jsonify({'success': True, 'role': 'admin'})
        else:
            return jsonify({'success': False, 'error': 'パスワードが正しくありません'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/backup', methods=['POST'])
def backup():
    """手動バックアップAPI"""
    try:
        backup_path = create_backup()
        if backup_path:
            return jsonify({'success': True, 'path': str(backup_path)})
        else:
            return jsonify({'success': False, 'error': 'バックアップが無効か、データファイルが存在しません'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/users', methods=['POST'])
def add_user():
    """ユーザー追加API"""
    try:
        payload = request.get_json()
        if not payload:
            return jsonify({'error': '無効なリクエストです'}), 400

        name = payload.get('name')
        expected_version = payload.get('expected_version')

        if not name:
            return jsonify({'error': 'ユーザー名が指定されていません'}), 400

        data = load_data()
        if data is None:
            return jsonify({'error': 'データファイルが見つかりません'}), 404

        # 新しいユーザーIDを生成
        existing_ids = [u['id'] for u in data.get('users', [])]
        new_id = f"u{len(existing_ids) + 1}"
        while new_id in existing_ids:
            new_id = f"u{int(new_id[1:]) + 1}"

        new_user = {
            'id': new_id,
            'name': name,
            'role': 'member'
        }
        data['users'].append(new_user)

        success, result = save_data(data, expected_version)

        if not success:
            if result == 'CONFLICT':
                return jsonify({'error': '競合が検出されました', 'code': 'CONFLICT'}), 409
            else:
                return jsonify({'error': result}), 500

        return jsonify({'success': True, 'user': new_user, 'new_version': result})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# =============================================================================
# 静的ファイル配信（フロントエンド）
# =============================================================================

@app.route('/')
def serve_index():
    """フロントエンドのindex.htmlを配信"""
    return send_from_directory(app.static_folder, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    """静的ファイルを配信"""
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


# =============================================================================
# メイン
# =============================================================================

if __name__ == '__main__':
    print("=" * 50)
    print(" Portable WBS Tool - バックエンドサーバー")
    print("=" * 50)
    print(f" ベースディレクトリ: {BASE_DIR}")
    print(f" データファイル: {DATA_PATH}")
    print(f" バックアップ: {BACKUP_DIR if BACKUP_ENABLED else '無効'}")
    print(f" サーバー: http://{HOST}:{PORT}")
    print("=" * 50)

    # 起動時バックアップ
    if BACKUP_ENABLED and DATA_PATH.exists():
        backup_path = create_backup()
        if backup_path:
            print(f" [起動時バックアップ] {backup_path}")

    print()
    print(" ブラウザを開いています...")

    # ブラウザを自動で開く
    import webbrowser
    webbrowser.open(f'http://{HOST}:{PORT}')

    # サーバー起動
    app.run(host=HOST, port=PORT, debug=False, threaded=True)
