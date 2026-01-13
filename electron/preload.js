/**
 * Portable WBS Tool - Electron Preload Script
 * Electronプリロードスクリプト（レンダラーとメインプロセスの橋渡し）
 */

const { contextBridge, ipcRenderer } = require('electron');

// レンダラープロセスに公開するAPI
contextBridge.exposeInMainWorld('electronAPI', {
  // システム情報取得
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),

  // データ読み込み
  loadData: () => ipcRenderer.invoke('load-data'),

  // データ保存
  saveData: (data, expectedVersion) => ipcRenderer.invoke('save-data', { data, expectedVersion }),

  // データファイルパス選択
  selectDataPath: () => ipcRenderer.invoke('select-data-path'),

  // バッチファイル生成
  generateBatch: (userId, userName, osType) =>
    ipcRenderer.invoke('generate-batch', { userId, userName, osType }),

  // 認証
  authenticate: (password) => ipcRenderer.invoke('authenticate', { password }),

  // プラットフォーム判定
  isElectron: true
});
