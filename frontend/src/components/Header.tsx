/**
 * Portable WBS Tool - Header Component
 */

import type { User, AuthState } from '../types';
import { ViewMode } from '../types';

interface HeaderProps {
  authState: AuthState;
  users: User[];
  selectedUserId: string | null;
  onUserFilterChange: (userId: string | null) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  lastUpdated: Date | null;
  onLogout: () => void;
  onOpenUserManagement?: () => void;
  onOpenHelp?: () => void;
}

export default function Header({
  authState,
  users,
  selectedUserId,
  onUserFilterChange,
  viewMode,
  onViewModeChange,
  lastUpdated,
  onLogout,
  onOpenUserManagement,
  onOpenHelp,
}: HeaderProps) {
  return (
    <header className="glass-card mb-4 p-4 bg-white border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* 左側: ロゴ・タイトル */}
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-800">Portable WBS Tool</h1>
              {authState.role === 'admin' && onOpenUserManagement && (
                <button
                  onClick={onOpenUserManagement}
                  className="text-xs px-2 py-0.5 bg-slate-800 text-white rounded hover:bg-slate-700 transition-colors"
                  title="ユーザー管理・バッチ出力"
                >
                  設定
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {authState.role === 'admin' ? (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">管理者</span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  {authState.currentUser?.name || '一般ユーザー'}
                </span>
              )}
              {lastUpdated && (
                <span>
                  最終更新: {lastUpdated.toLocaleTimeString('ja-JP')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 中央: フィルター・表示モード */}
        <div className="flex items-center gap-4">
          {/* 担当者フィルター */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">担当者:</label>
            <select
              value={selectedUserId || ''}
              onChange={(e) => onUserFilterChange(e.target.value || null)}
              className="input select py-2 text-sm min-w-32 bg-slate-50 border-slate-200"
            >
              <option value="">全員</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          {/* 表示モード切替 */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
            {[
              { mode: ViewMode.Day, label: '日' },
              { mode: ViewMode.Week, label: '週' },
              { mode: ViewMode.Month, label: '月' },
            ].map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${viewMode === mode
                  ? 'bg-white text-slate-800 shadow-sm border border-slate-200 font-medium'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 右側: ログアウト & ヘルプ */}
        <div className="flex items-center gap-2">
          {authState.role === 'admin' && onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              title="操作ヘルプ"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={onLogout}
            className="btn btn-secondary text-sm py-2 px-3 border-slate-200 hover:bg-slate-50 ml-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            ログアウト
          </button>
        </div>
      </div>
    </header>
  );
}
