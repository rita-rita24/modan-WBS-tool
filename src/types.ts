/**
 * Portable WBS Tool - Type Definitions
 * 型定義ファイル
 */

/** タスク */
export interface Task {
  id: string;
  name: string;
  start: string;
  end: string;
  assignee_id: string | null;
  parent_id: string | null;
  progress: number;
  is_milestone: boolean;
  dependencies: string[];
}

/** ユーザー */
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'member';
}

/** メタデータ */
export interface Meta {
  version: string;
  last_updated: number;
}

/** 設定 */
export interface Config {
  admin_password_hash: string;
}

/** アプリケーションデータ */
export interface AppData {
  config: Config;
  meta: Meta;
  tasks: Task[];
  users: User[];
}

/** システム情報 */
export interface SystemInfo {
  mode: 'admin' | 'user';
  user_id: string;
  server_time: number;
  data_path: string;
}

/** API レスポンス */
export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  code?: string;
  data?: T;
}

/** モード */
export type AppMode = 'admin' | 'user';
