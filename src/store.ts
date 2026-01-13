/**
 * Portable WBS Tool - State Management
 * アプリケーション状態管理
 */

import type { AppData, Task, User, SystemInfo, AppMode } from './types';
import { fetchData, fetchSystemInfo, saveData as apiSaveData, ApiError } from './api';

/** アプリケーション状態 */
interface AppState {
  data: AppData | null;
  systemInfo: SystemInfo | null;
  selectedTaskId: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

/** 状態変更リスナー */
type StateListener = (state: AppState) => void;

/** 状態管理クラス */
class Store {
  private state: AppState = {
    data: null,
    systemInfo: null,
    selectedTaskId: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  };

  private listeners: Set<StateListener> = new Set();
  private pollingInterval: number | null = null;

  /** 状態取得 */
  getState(): AppState {
    return this.state;
  }

  /** 状態更新 */
  setState(partial: Partial<AppState>): void {
    this.state = { ...this.state, ...partial };
    this.notifyListeners();
  }

  /** リスナー追加 */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** リスナー通知 */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /** 初期化 */
  async initialize(): Promise<void> {
    this.setState({ isLoading: true, error: null });

    try {
      const [data, systemInfo] = await Promise.all([
        fetchData(),
        fetchSystemInfo(),
      ]);

      this.setState({
        data,
        systemInfo,
        isLoading: false,
        isAuthenticated: systemInfo.mode === 'user' || false,
      });

      // ポーリング開始
      this.startPolling();
    } catch (err) {
      const message = err instanceof Error ? err.message : '初期化に失敗しました';
      this.setState({ isLoading: false, error: message });
    }
  }

  /** ポーリング開始 */
  startPolling(): void {
    if (this.pollingInterval) return;

    this.pollingInterval = window.setInterval(async () => {
      try {
        const data = await fetchData();
        const currentVersion = this.state.data?.meta.version;

        if (data.meta.version !== currentVersion) {
          this.setState({ data });
          console.log('[INFO] データが更新されました');
        }
      } catch {
        // ポーリングエラーは無視
      }
    }, 5000);
  }

  /** ポーリング停止 */
  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /** 認証状態設定 */
  setAuthenticated(value: boolean): void {
    this.setState({ isAuthenticated: value });
  }

  /** モード取得 */
  getMode(): AppMode {
    return this.state.systemInfo?.mode ?? 'user';
  }

  /** 現在のユーザーID取得 */
  getCurrentUserId(): string | null {
    return this.state.systemInfo?.user_id ?? null;
  }

  /** タスク選択 */
  selectTask(taskId: string | null): void {
    this.setState({ selectedTaskId: taskId });
  }

  /** データ保存 */
  async saveData(updater: (data: AppData) => AppData): Promise<boolean> {
    const { data } = this.state;
    if (!data) return false;

    const updatedData = updater(data);

    try {
      const result = await apiSaveData(updatedData, data.meta.version);

      // バージョンを更新
      updatedData.meta.version = result.new_version;
      this.setState({ data: updatedData });

      return true;
    } catch (err) {
      if (err instanceof ApiError && err.code === 'CONFLICT') {
        // 競合発生時はリロード
        this.setState({ error: '他のユーザーがデータを更新しました。再読み込みしてください。' });
        await this.initialize();
      } else {
        const message = err instanceof Error ? err.message : '保存に失敗しました';
        this.setState({ error: message });
      }
      return false;
    }
  }

  /** タスク追加 */
  async addTask(task: Omit<Task, 'id'>): Promise<boolean> {
    const newId = `t-${Date.now().toString(36)}`;
    const newTask: Task = { ...task, id: newId };

    return this.saveData(data => ({
      ...data,
      tasks: [...data.tasks, newTask],
    }));
  }

  /** タスク更新 */
  async updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
    return this.saveData(data => ({
      ...data,
      tasks: data.tasks.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));
  }

  /** タスク削除 */
  async deleteTask(taskId: string): Promise<boolean> {
    return this.saveData(data => ({
      ...data,
      tasks: data.tasks
        .filter(t => t.id !== taskId)
        .map(t => t.parent_id === taskId ? { ...t, parent_id: null } : t),
    }));
  }

  /** ユーザー追加 */
  async addUserToData(name: string): Promise<boolean> {
    const newId = `u${Date.now()}`;
    const newUser: User = { id: newId, name, role: 'member' };

    return this.saveData(data => ({
      ...data,
      users: [...data.users, newUser],
    }));
  }

  /** ユーザー削除 */
  async deleteUser(userId: string): Promise<boolean> {
    return this.saveData(data => ({
      ...data,
      users: data.users.filter(u => u.id !== userId),
      tasks: data.tasks.map(t =>
        t.assignee_id === userId ? { ...t, assignee_id: null } : t
      ),
    }));
  }

  /** 編集可能かチェック */
  canEditTask(task: Task): boolean {
    const mode = this.getMode();
    if (mode === 'admin') return true;

    const userId = this.getCurrentUserId();
    return task.assignee_id === userId;
  }

  /** エラークリア */
  clearError(): void {
    this.setState({ error: null });
  }
}

/** シングルトンインスタンス */
export const store = new Store();
