# Portable WBS Tool

環境構築不要で動作するデスクトップWBS（Work Breakdown Structure）管理ツールです。

## ダウンロード

| OS | ファイル | 備考 |
|----|----------|------|
| **Windows (64bit)** | `Portable-WBS-Tool-win.zip` | Windows 10/11 |
| **Mac (Apple Silicon)** | `Portable-WBS-Tool-arm64-mac.zip` | M1/M2/M3 Mac |
| **Mac (Intel)** | `Portable-WBS-Tool-mac.zip` | Intel Mac |

## インストール方法

1. ZIPファイルをダウンロード
2. 任意のフォルダに解凍
3. アプリを起動（Windows: `Portable WBS Tool.exe` / Mac: `Portable WBS Tool.app`）

## 初回起動

1. アプリを起動
2. パスワード「**admin**」でログイン
3. タスクとユーザーを設定

## 機能

- **タスク管理**: 追加・編集・削除、階層構造対応
- **ガントチャート**: 日付グリッド表示
- **ユーザー管理**: 担当者を設定して権限制御
- **データ共有**: 共有フォルダのJSONファイルを参照可能
- **同時編集**: 楽観的ロックで競合を防止

## 共有フォルダでデータ共有する方法

### config.json で設定

アプリと同じフォルダにある `config.json` を編集してください：

```json
{
  "data_path": "\\\\server\\shared\\wbs_data.json",
  "mode": "admin",
  "user_id": "",
  "port": 8080
}
```

| 設定項目 | 説明 |
|---------|------|
| `data_path` | データファイルのパス（共有フォルダ可） |
| `mode` | `admin` または `user` |
| `user_id` | ユーザーモード時のユーザーID |

### ユーザー用起動ファイル

1. Admin画面で「ユーザー管理」を開く
2. ユーザーを追加
3. 「バッチ生成」ボタンでユーザー専用起動ファイルを作成
4. ユーザーに配布

## 権限

| モード | できること |
|--------|-----------|
| **Admin** | 全タスクの追加・編集・削除、ユーザー管理 |
| **User** | 自分の担当タスクの**進捗率のみ**編集可能 |

## 技術仕様

- フロントエンド: TypeScript + Vite
- デスクトップ: Electron
- データ保存: ローカルJSONファイル

## ビルド方法（開発者向け）

```bash
# 依存パッケージをインストール
npm install

# 開発モードで起動
npm run electron:dev

# Windows/Mac両方のパッケージを生成
npm run dist:all
```

## ライセンス

MIT License
