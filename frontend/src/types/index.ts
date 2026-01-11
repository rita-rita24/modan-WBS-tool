/**
 * Portable WBS Tool - TypeScript Type Definitions
 */

// ユーザー
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'member';
}

// タスク
export interface Task {
  id: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  progress: number; // 0-100
  assignee_id: string | null;
  parent_id: string | null;
  dependencies: string[];
  is_milestone: boolean;
}

// メタデータ
export interface Meta {
  version: string;
  last_updated: number;
  updated_by: string;
}

// 設定
export interface Config {
  admin_password_hash: string;
  polling_interval: number;
}

// データ全体
export interface ProjectData {
  meta: Meta;
  config: Config;
  users: User[];
  tasks: Task[];
}

// 認証情報
export interface AuthState {
  isAuthenticated: boolean;
  role: 'admin' | 'member' | null;
  currentUser: User | null;
}

// APIレスポンス
export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  code?: string;
  data?: T;
}

export interface SaveDataResponse {
  success: boolean;
  new_version?: string;
  error?: string;
  code?: string;
}

export interface AuthResponse {
  success: boolean;
  role?: 'admin' | 'member';
  error?: string;
  user?: User;
}

export const ViewMode = {
  Day: 'Day',
  Week: 'Week',
  Month: 'Month',
} as const;

export type ViewMode = typeof ViewMode[keyof typeof ViewMode];

// Gantt Chart用の型
export interface GanttTask {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  type: 'task' | 'milestone' | 'project';
  project?: string;
  dependencies?: string[];
  hideChildren?: boolean;
  styles?: {
    backgroundColor?: string;
    backgroundSelectedColor?: string;
    progressColor?: string;
    progressSelectedColor?: string;
  };
}
