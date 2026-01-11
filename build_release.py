import os
import shutil
import json
import time
from datetime import datetime
from pathlib import Path

# 設定
PROJECT_ROOT = Path('.').resolve()
DIST_DIR = PROJECT_ROOT / 'dist_release'
RELEASE_NAME = 'PortableWBSTool_v1.0'
RELEASE_DIR = DIST_DIR / RELEASE_NAME

def main():
    print(f"Creating release package: {RELEASE_NAME}")

    # 1. 準備: ディレクトリ作成
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    RELEASE_DIR.mkdir(parents=True)

    print(" - Directories created.")

    # 2. ファイルコピー
    # bin/app (ソースコード)
    # webディレクトリも含む (フロントエンドビルド済みファイル)
    shutil.copytree(PROJECT_ROOT / 'bin' / 'app', RELEASE_DIR / 'bin' / 'app',
                    ignore=shutil.ignore_patterns('__pycache__', '.DS_Store', '*.pyc'))

    # バッチファイル
    for f in ['start_admin.bat', 'start_user.bat', 'start_admin.command', 'start_user.command', 'README.md', 'config.ini']:
        src = PROJECT_ROOT / f
        if src.exists():
            shutil.copy2(src, RELEASE_DIR / f)
        else:
            print(f"Warning: {f} not found.")

    # backupディレクトリ (空で作成)
    (RELEASE_DIR / 'backup').mkdir()

    # dataディレクトリ (空で作成, data.jsonは後で)
    (RELEASE_DIR / 'bin' / 'data').mkdir(parents=True, exist_ok=True)

    print(" - Files copied.")

    # 3. 初期データ作成 (data.json)
    initial_data = {
        "users": [],
        "tasks": [],
        "meta": {
            "version": "1.0.0",
            "last_updated": int(time.time()),
            "created_at": datetime.now().isoformat()
        },
        "config": {
            # 初期パスワード: admin
            "admin_password_hash": "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918"
        }
    }

    with open(RELEASE_DIR / 'bin' / 'data' / 'data.json', 'w', encoding='utf-8') as f:
        json.dump(initial_data, f, indent=2, ensure_ascii=False)

    print(" - Initial data.json created.")

    # 4. ZIP圧縮
    shutil.make_archive(DIST_DIR / RELEASE_NAME, 'zip', DIST_DIR, RELEASE_NAME)

    print(f"Successfully created: {DIST_DIR / (RELEASE_NAME + '.zip')}")

if __name__ == '__main__':
    main()
