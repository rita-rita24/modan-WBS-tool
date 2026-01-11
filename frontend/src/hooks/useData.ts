/**
 * Portable WBS Tool - Data Hook
 * SWRを使用したデータ取得・ポーリング
 */

import useSWR from 'swr';
import type { ProjectData, SaveDataResponse, AuthResponse } from '../types';

const API_BASE = '/api';

// フェッチャー関数
const fetcher = async (url: string): Promise<any> => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'データの取得に失敗しました');
  }
  return res.json();
};

// データ取得フック
export function useData(pollingInterval: number = 5000) {
  const { data, error, isLoading, mutate } = useSWR<ProjectData>(
    `${API_BASE}/data`,
    fetcher,
    {
      refreshInterval: pollingInterval,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
  };
}

// システム情報取得フック
export function useSystemInfo() {
  const { data, error, isLoading } = useSWR<{
    mode: 'admin' | 'user';
    server_time: number;
    auto_login_user_id?: string;
  }>(
    `${API_BASE}/system`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    mode: data?.mode,
    autoLoginUserId: data?.auto_login_user_id,
    serverTime: data?.server_time,
    error,
    isLoading,
  };
}

// データ保存
export async function saveData(
  data: ProjectData,
  expectedVersion: string,
  updatedBy: string
): Promise<SaveDataResponse> {
  const res = await fetch(`${API_BASE}/data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data,
      expected_version: expectedVersion,
      updated_by: updatedBy,
    }),
  });

  return res.json();
}

// 管理者認証
export async function authenticateAdmin(password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  return res.json();
}

// バックアップ作成
export async function createBackup(): Promise<{ success: boolean; path?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/backup`, {
    method: 'POST',
  });

  return res.json();
}
