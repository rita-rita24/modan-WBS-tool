/**
 * Portable WBS Tool - API Layer
 * API通信モジュール（Electron対応）
 */

import type { AppData, SystemInfo } from './types';

// Electron APIの型定義
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      getSystemInfo: () => Promise<SystemInfo>;
      loadData: () => Promise<AppData>;
      saveData: (data: AppData, expectedVersion: string) => Promise<{ success: boolean; new_version?: string; error?: string }>;
      selectDataPath: () => Promise<string | null>;
      generateBatch: (userId: string, userName: string, osType: string) => Promise<{ success: boolean; content: string; filename: string }>;
      authenticate: (password: string) => Promise<{ success: boolean; role?: string; error?: string }>;
    };
  }
}

/** Electronモードかどうか */
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
};

/** HTTPエラー */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** データ取得 */
export const fetchData = async (): Promise<AppData> => {
  if (isElectron()) {
    return window.electronAPI!.loadData();
  }

  // HTTP API（ブラウザ用）
  const response = await fetch('/api/data');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(error.error || 'データの取得に失敗しました', response.status);
  }

  return response.json();
};

/** システム情報取得 */
export const fetchSystemInfo = async (): Promise<SystemInfo> => {
  if (isElectron()) {
    return window.electronAPI!.getSystemInfo();
  }

  // HTTP API（ブラウザ用）
  const response = await fetch('/api/system');

  if (!response.ok) {
    throw new ApiError('システム情報の取得に失敗しました', response.status);
  }

  return response.json();
};

/** データ保存 */
export const saveData = async (
  data: AppData,
  expectedVersion: string
): Promise<{ success: boolean; new_version: string }> => {
  if (isElectron()) {
    const result = await window.electronAPI!.saveData(data, expectedVersion);
    if (!result.success) {
      throw new ApiError(result.error || '保存に失敗しました', 500, result.error === 'CONFLICT' ? 'CONFLICT' : undefined);
    }
    return { success: true, new_version: result.new_version! };
  }

  // HTTP API（ブラウザ用）
  const response = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data, expected_version: expectedVersion }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.error || 'データの保存に失敗しました',
      response.status,
      error.code
    );
  }

  return response.json();
};

/** ユーザー追加 */
export const addUser = async (
  name: string,
  expectedVersion: string
): Promise<{ success: boolean; user: { id: string; name: string }; new_version: string }> => {
  // HTTP API（ブラウザ用）
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, expected_version: expectedVersion }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(error.error || 'ユーザーの追加に失敗しました', response.status);
  }

  return response.json();
};

/** 管理者認証 */
export const authenticate = async (
  password: string
): Promise<{ success: boolean; role?: string; error?: string }> => {
  if (isElectron()) {
    return window.electronAPI!.authenticate(password);
  }

  // HTTP API（ブラウザ用）
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  return response.json();
};

/** バッチファイル生成 */
export const generateBatch = async (
  userId: string,
  userName: string,
  osType: 'windows' | 'mac'
): Promise<{ success: boolean; content: string; filename: string }> => {
  if (isElectron()) {
    return window.electronAPI!.generateBatch(userId, userName, osType);
  }

  // HTTP API（ブラウザ用）
  const response = await fetch('/api/generate-batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, user_name: userName, os_type: osType }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(error.error || 'バッチファイルの生成に失敗しました', response.status);
  }

  return response.json();
};
