/**
 * Portable WBS Tool - Electron Main Process
 * Electronメインプロセス（config.json対応）
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// 開発モードかどうか
const isDev = !app.isPackaged;

// 設定
let config = {
  data_path: './data/wbs_data.json',
  mode: 'admin',
  user_id: '',
  port: 8080
};

// ベースディレクトリ
function getBaseDir() {
  if (isDev) {
    return path.join(__dirname, '..');
  } else {
    return path.dirname(app.getPath('exe'));
  }
}

// config.json を読み込む
function loadConfig() {
  const configPaths = [
    path.join(getBaseDir(), 'config.json'),
    path.join(__dirname, '..', 'config.json')
  ];

  for (const configPath of configPaths) {
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf-8');
        const loadedConfig = JSON.parse(content);
        config = { ...config, ...loadedConfig };
        console.log(`[INFO] Config loaded from: ${configPath}`);
        console.log(`[INFO] Config:`, config);
        return;
      }
    } catch (error) {
      console.error(`[ERROR] Failed to load config from ${configPath}:`, error);
    }
  }

  console.log('[INFO] No config.json found, using defaults');
}

// コマンドライン引数を解析（config.jsonより優先）
function parseArgs() {
  const args = process.argv.slice(2);

  for (const arg of args) {
    if (arg.startsWith('--mode=')) {
      config.mode = arg.split('=')[1];
    }
    if (arg.startsWith('--user-id=')) {
      config.user_id = arg.split('=')[1];
    }
    if (arg.startsWith('--data-path=')) {
      config.data_path = arg.split('=')[1];
    }
  }
}

// データファイルパスを解決
function resolveDataPath() {
  let dataPath = config.data_path;

  // 相対パスの場合はベースディレクトリからの相対パスとして解決
  if (!path.isAbsolute(dataPath)) {
    dataPath = path.join(getBaseDir(), dataPath);
  }

  return dataPath;
}

// デフォルトデータを生成
function getDefaultData() {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return {
    config: {
      admin_password_hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' // 'admin'
    },
    meta: {
      version: Date.now().toString(),
      last_updated: Date.now()
    },
    tasks: [
      {
        id: 't-sample',
        name: 'サンプルプロジェクト',
        start: today.toISOString().split('T')[0],
        end: nextWeek.toISOString().split('T')[0],
        assignee_id: 'u1',
        parent_id: null,
        progress: 0,
        is_milestone: false,
        dependencies: []
      }
    ],
    users: [
      { id: 'u1', name: '管理者', role: 'admin' }
    ]
  };
}

// メインウィンドウ作成
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Portable WBS Tool',
    show: false
  });

  // ウィンドウ準備完了時に表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // HTMLをロード
  mainWindow.loadFile(path.join(__dirname, '..', 'web', 'index.html'));

  // メニューを非表示
  mainWindow.setMenuBarVisibility(false);
}

// IPC ハンドラー設定
function setupIPC() {
  // システム情報取得
  ipcMain.handle('get-system-info', () => {
    return {
      mode: config.mode,
      user_id: config.user_id,
      server_time: Date.now(),
      data_path: resolveDataPath()
    };
  });

  // データ読み込み
  ipcMain.handle('load-data', () => {
    const filePath = resolveDataPath();

    try {
      // ディレクトリが存在しなければ作成
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // ファイルが存在しなければデフォルトデータを作成
      if (!fs.existsSync(filePath)) {
        const defaultData = getDefaultData();
        fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
        return defaultData;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to load data:', error);
      return getDefaultData();
    }
  });

  // データ保存
  ipcMain.handle('save-data', (event, { data, expectedVersion }) => {
    const filePath = resolveDataPath();

    try {
      // 現在のデータを読み込んでバージョンチェック
      if (fs.existsSync(filePath)) {
        const currentContent = fs.readFileSync(filePath, 'utf-8');
        const currentData = JSON.parse(currentContent);

        if (expectedVersion && currentData.meta.version !== expectedVersion) {
          return { success: false, error: 'CONFLICT' };
        }
      }

      // 新しいバージョンを生成
      const newVersion = Date.now().toString();
      data.meta = data.meta || {};
      data.meta.version = newVersion;
      data.meta.last_updated = Date.now();

      // ディレクトリが存在しなければ作成
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 保存
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

      return { success: true, new_version: newVersion };
    } catch (error) {
      console.error('Failed to save data:', error);
      return { success: false, error: error.message };
    }
  });

  // 設定取得
  ipcMain.handle('get-config', () => {
    return config;
  });

  // 設定保存
  ipcMain.handle('save-config', (event, newConfig) => {
    const configPath = path.join(getBaseDir(), 'config.json');

    try {
      config = { ...config, ...newConfig };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
      return { success: true };
    } catch (error) {
      console.error('Failed to save config:', error);
      return { success: false, error: error.message };
    }
  });

  // データファイルパス選択ダイアログ
  ipcMain.handle('select-data-path', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // ユーザー用バッチファイル生成
  ipcMain.handle('generate-batch', (event, { userId, userName, osType }) => {
    const dataPath = resolveDataPath();
    const exePath = app.getPath('exe');

    let content = '';
    let filename = '';

    if (osType === 'windows') {
      content = `@echo off
chcp 65001 > nul
echo ================================
echo  Portable WBS Tool [${userName}]
echo ================================
"${exePath}" --mode=user --user-id=${userId} --data-path="${dataPath}"
`;
      filename = `start_${userName}.bat`;
    } else {
      content = `#!/bin/bash
echo "================================"
echo " Portable WBS Tool [${userName}]"
echo "================================"
"${exePath}" --mode=user --user-id=${userId} --data-path="${dataPath}"
`;
      filename = `start_${userName}.command`;
    }

    return { success: true, content, filename };
  });

  // 管理者認証
  ipcMain.handle('authenticate', (event, { password }) => {
    if (password === 'admin') {
      return { success: true, role: 'admin' };
    }
    return { success: false, error: 'パスワードが正しくありません' };
  });
}

// アプリ起動時
app.whenReady().then(() => {
  loadConfig();
  parseArgs();
  setupIPC();
  createWindow();

  console.log('======================================');
  console.log(' Portable WBS Tool');
  console.log('======================================');
  console.log(` Mode: ${config.mode}`);
  console.log(` User ID: ${config.user_id || '(admin)'}`);
  console.log(` Data Path: ${resolveDataPath()}`);
  console.log('======================================');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 全ウィンドウ閉じたら終了
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
