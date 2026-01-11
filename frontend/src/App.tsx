import { useState, useCallback, useMemo, useEffect } from 'react';
import { useData, useSystemInfo, saveData } from './hooks/useData';
import { type AuthState, type Task, type ProjectData, ViewMode, type User } from './types';

import LoginPage from './components/LoginPage';
import Header from './components/Header';
import TaskGrid from './components/TaskGrid';
import GanttChart from './components/GanttChart';
import TaskEditPanel from './components/TaskEditPanel';
import Toast, { type ToastType } from './components/Toast';
import UserManagementModal from './components/UserManagementModal';
import AdminHelpModal from './components/AdminHelpModal';

import './index.css';

function App() {
  // 認証状態
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    currentUser: null,
  });

  // UI状態
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Week);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // トースト通知
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // データ取得
  const { data, error, isLoading, mutate } = useData();
  const { mode, autoLoginUserId, isLoading: isSystemLoading } = useSystemInfo();

  // ポーリング間隔を取得
  const pollingInterval = data?.config?.polling_interval || 5000;

  // 自動ログイン処理
  useEffect(() => {
    if (autoLoginUserId && data?.users && !authState.isAuthenticated) {
      const user = data.users.find(u => u.id === autoLoginUserId);
      if (user) {
        setAuthState({
          isAuthenticated: true,
          role: 'member',
          currentUser: user
        });
        console.log('Auto logged in as:', user.name);
      }
    }
  }, [autoLoginUserId, data?.users, authState.isAuthenticated]);

  // フィルタリングされたタスク
  const filteredTasks = useMemo(() => {
    if (!data?.tasks) return [];
    if (!selectedUserId) return data.tasks;
    return data.tasks.filter((task) => task.assignee_id === selectedUserId);
  }, [data?.tasks, selectedUserId]);

  // 選択中のタスク
  const selectedTask = useMemo(() => {
    if (!selectedTaskId || !data?.tasks) return null;
    return data.tasks.find((t) => t.id === selectedTaskId) || null;
  }, [selectedTaskId, data?.tasks]);

  // 最終更新日時
  const lastUpdated = useMemo(() => {
    if (!data?.meta?.last_updated) return null;
    return new Date(data.meta.last_updated * 1000);
  }, [data?.meta?.last_updated]);

  // トースト表示
  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  // データ保存処理
  const handleSaveData = useCallback(
    async (newData: ProjectData) => {
      if (!data) return;

      const updatedBy = authState.role === 'admin'
        ? '管理者'
        : authState.currentUser?.name || '不明';

      try {
        const result = await saveData(newData, data.meta.version, updatedBy);

        if (result.success) {
          await mutate();
          showToast('保存しました', 'success');
        } else if (result.code === 'CONFLICT') {
          showToast('競合が発生しました。データを再読み込みします。', 'warning');
          await mutate();
        } else {
          showToast(result.error || '保存に失敗しました', 'error');
        }
      } catch (err) {
        showToast('保存に失敗しました', 'error');
      }
    },
    [data, authState, mutate, showToast]
  );

  // ユーザー追加
  const handleAddUser = useCallback(async (name: string) => {
    if (!data) return;

    const newId = `u${Date.now()}`;
    const newUser: User = {
      id: newId,
      name: name,
      role: 'member'
    };

    const newData = {
      ...data,
      users: [...data.users, newUser]
    };

    await handleSaveData(newData);
  }, [data, handleSaveData]);

  // 進捗率更新
  const handleProgressChange = useCallback(
    async (taskId: string, progress: number) => {
      if (!data) return;

      const newData = {
        ...data,
        tasks: data.tasks.map((task) =>
          task.id === taskId ? { ...task, progress } : task
        ),
      };

      await handleSaveData(newData);
    },
    [data, handleSaveData]
  );

  // タスク保存
  const handleTaskSave = useCallback(
    async (updatedTask: Task) => {
      if (!data) return;

      const taskExists = data.tasks.some((t) => t.id === updatedTask.id);

      const newData = {
        ...data,
        tasks: taskExists
          ? data.tasks.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          )
          : [...data.tasks, updatedTask],
      };

      await handleSaveData(newData);
    },
    [data, handleSaveData]
  );

  // タスク削除
  const handleTaskDelete = useCallback(
    async (taskId: string) => {
      if (!data) return;

      const newData = {
        ...data,
        tasks: data.tasks.filter((task) => task.id !== taskId),
      };

      setSelectedTaskId(null);
      await handleSaveData(newData);
    },
    [data, handleSaveData]
  );

  // 新規タスク作成
  const handleCreateTask = useCallback(() => {
    if (!data) return;

    const newId = `t-${Date.now()}`;
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const newTask: Task = {
      id: newId,
      name: '新規タスク',
      start: today.toISOString().split('T')[0],
      end: nextWeek.toISOString().split('T')[0],
      progress: 0,
      assignee_id: null,
      parent_id: null,
      dependencies: [],
      is_milestone: false,
    };

    // 一時的にローカル状態に追加して編集パネルを開く
    mutate(
      { ...data, tasks: [...data.tasks, newTask] },
      false // revalidateしない
    );
    setSelectedTaskId(newId);
  }, [data, mutate]);

  // ガントチャートからの日付変更
  const handleDateChange = useCallback(
    async (taskId: string, start: Date, end: Date) => {
      if (!data) return;

      const newData = {
        ...data,
        tasks: data.tasks.map((task) =>
          task.id === taskId
            ? {
              ...task,
              start: start.toISOString().split('T')[0],
              end: end.toISOString().split('T')[0],
            }
            : task
        ),
      };

      await handleSaveData(newData);
    },
    [data, handleSaveData]
  );

  // ログアウト
  const handleLogout = useCallback(() => {
    setAuthState({
      isAuthenticated: false,
      role: null,
      currentUser: null,
    });
    setSelectedTaskId(null);
    setSelectedUserId(null);
  }, []);

  // ローディング
  if (isLoading || isSystemLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // エラー
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="glass-card p-8 text-center max-w-md bg-white">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">接続エラー</h2>
          <p className="text-slate-500 mb-4 text-sm">{error.message || 'データの取得に失敗しました'}</p>
          <button onClick={() => mutate()} className="btn btn-primary">
            再試行
          </button>
        </div>
      </div>
    );
  }

  // データなし
  if (!data) {
    return null;
  }

  // ログイン画面
  if (!authState.isAuthenticated) {
    return (
      <LoginPage
        users={data.users}
        pollingInterval={pollingInterval}
        onLogin={setAuthState}
        mode={mode} // モードを渡す
      />
    );
  }

  // メイン画面
  return (
    <div className="min-h-screen p-4 flex flex-col h-screen overflow-hidden bg-slate-100"> {/* 背景色を少し濃く */}
      {/* ヘッダー */}
      <div className="flex-shrink-0">
        <Header
          authState={authState}
          users={data.users}
          selectedUserId={selectedUserId}
          onUserFilterChange={setSelectedUserId}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          lastUpdated={lastUpdated}
          onLogout={handleLogout}
          onOpenUserManagement={() => setIsUserManagementOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
        />
      </div>

      {/* メインコンテンツ - Grid layout */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-4">

        {/* 左側: タスク一覧 (8/12 - 拡大) */}
        <div className="col-span-8 flex flex-col glass-card bg-white overflow-hidden shadow-sm h-full">
          <div className="p-3 border-b border-slate-100 font-semibold text-slate-700 bg-slate-50">
            タスク一覧
          </div>
          <div className="flex-1 overflow-auto">
            <TaskGrid
              tasks={filteredTasks}
              users={data.users}
              isAdmin={authState.role === 'admin'}
              currentUserId={authState.currentUser?.id || null}
              onProgressChange={handleProgressChange}
              onTaskSelect={(task) => setSelectedTaskId(task?.id || null)}
              selectedTaskId={selectedTaskId}
            />
          </div>
        </div>

        {/* 右側: ガントチャート (4/12 - 縮小) */}
        <div className="col-span-4 flex flex-col glass-card bg-white overflow-hidden shadow-sm h-full relative">
          <div className="p-3 border-b border-slate-100 font-semibold text-slate-700 bg-slate-50 flex justify-between items-center">
            <span>ガントチャート</span>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0 pb-2">
              <GanttChart
                tasks={filteredTasks}
                users={data.users}
                viewMode={viewMode}
                selectedTaskId={selectedTaskId}
                onTaskSelect={setSelectedTaskId}
                onDateChange={handleDateChange}
                isAdmin={authState.role === 'admin'}
              />
            </div>

            {/* タスク編集パネル (オーバーレイ) */}
            {selectedTaskId && (
              <div className="absolute top-0 right-0 w-80 h-full bg-white border-l border-slate-200 shadow-xl z-20 overflow-y-auto animate-fade-in text-sm"> {/* z-indexを引き上げ */}
                <TaskEditPanel
                  task={selectedTask}
                  users={data.users}
                  isAdmin={authState.role === 'admin'}
                  onSave={handleTaskSave}
                  onDelete={handleTaskDelete}
                  onClose={() => setSelectedTaskId(null)}
                  onCreateTask={handleCreateTask}
                  onOpenHelp={() => setIsHelpOpen(true)} // 実装していないが型エラーは起きないはず（TaskEditPanelPropsによる）
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ユーザー管理モーダル */}
      {isUserManagementOpen && (
        <UserManagementModal
          users={data.users}
          onAddUser={handleAddUser}
          onClose={() => setIsUserManagementOpen(false)}
        />
      )}

      {/* 管理者ヘルプモーダル */}
      {isHelpOpen && (
        <AdminHelpModal onClose={() => setIsHelpOpen(false)} />
      )}

      {/* トースト通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default App;
