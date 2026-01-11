/**
 * Portable WBS Tool - Task Grid Component
 * タスク一覧テーブル表示
 */

import { useState } from 'react';
import type { Task, User } from '../types';

interface TaskGridProps {
  tasks: Task[];
  users: User[];
  isAdmin: boolean;
  currentUserId: string | null;
  onProgressChange: (taskId: string, progress: number) => void;
  onTaskSelect: (task: Task | null) => void;
  selectedTaskId: string | null;
}

export default function TaskGrid({
  tasks,
  users,
  isAdmin,
  currentUserId,
  onProgressChange,
  onTaskSelect,
  selectedTaskId,
}: TaskGridProps) {
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [tempProgress, setTempProgress] = useState<number>(0);

  // ユーザー名を取得
  const getUserName = (userId: string | null): string => {
    if (!userId) return '-';
    const user = users.find((u) => u.id === userId);
    return user?.name || '不明';
  };

  // 進捗率の色を取得 (モノトーンベースでも進捗バーはわかりやすく)
  const getProgressColor = (progress: number): string => {
    if (progress >= 100) return 'bg-slate-700';
    return 'bg-slate-500';
  };

  // 編集可能かどうか
  const canEdit = (task: Task): boolean => {
    if (isAdmin) return true;
    return task.assignee_id === currentUserId;
  };

  // 進捗率編集開始
  const startEditProgress = (task: Task) => {
    if (!canEdit(task)) return;
    setEditingProgress(task.id);
    setTempProgress(task.progress);
  };

  // 進捗率保存
  const saveProgress = (taskId: string) => {
    onProgressChange(taskId, tempProgress);
    setEditingProgress(null);
  };

  // 日付フォーマット
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getRowClassName = (task: Task) => {
    let classes = 'border-b border-slate-100 cursor-pointer transition-colors ';

    if (selectedTaskId === task.id) {
      classes += 'bg-slate-100 ';
    } else {
      classes += 'hover:bg-slate-50 ';
    }

    if (task.is_milestone) {
      classes += 'font-medium ';
    }

    return classes;
  };

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white z-10 shadow-sm">
            <tr className="border-b border-slate-200">
              <th className="px-4 py-3 text-left font-medium text-slate-500 w-1/2 min-w-[300px]">
                タスク名
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 w-24">
                担当
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 w-24">
                期限
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-500 w-32">
                進捗
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onTaskSelect(selectedTaskId === task.id ? null : task)}
                className={getRowClassName(task)}
              >
                {/* タスク名 */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {task.parent_id && (
                      <div className="w-4 border-l-2 border-b-2 border-slate-200 h-3 rounded-bl -mt-2 ml-1" />
                    )}
                    <span
                      className={`truncate
                        ${task.is_milestone ? 'text-slate-900 font-bold' : 'text-slate-700'}
                      `}
                      style={{ paddingLeft: task.parent_id ? '4px' : '0px' }}
                    >
                      {task.is_milestone && (
                        <span className="inline-block w-2.5 h-2.5 mr-2 transform rotate-45 bg-slate-800" />
                      )}
                      {task.name}
                    </span>
                  </div>
                </td>

                {/* 担当者 */}
                <td className="px-4 py-3">
                  <span className="text-slate-600 truncate block max-w-[80px]">
                    {getUserName(task.assignee_id)}
                  </span>
                </td>

                {/* 期限 (終了日のみ表示してスペース節約) */}
                <td className="px-4 py-3">
                  <span className="text-slate-500 text-xs">
                    {formatDate(task.end)}
                  </span>
                </td>

                {/* 進捗 */}
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  {editingProgress === task.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={tempProgress}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, Number(e.target.value)));
                          setTempProgress(val);
                        }}
                        className="w-12 h-8 px-1 text-right border border-slate-300 rounded text-sm"
                      />
                      <span className="text-xs text-slate-500">%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={tempProgress}
                        onChange={(e) => setTempProgress(Number(e.target.value))}
                        className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                      />
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => saveProgress(task.id)}
                          className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                          title="保存"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEditingProgress(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                          title="キャンセル"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group">
                      <div className={`flex items-center gap-2 flex-1 ${canEdit(task) ? 'cursor-pointer' : ''}`} onClick={() => startEditProgress(task)}>
                        <div className="flex-1 progress-bar bg-slate-100 border border-slate-200 h-2 rounded overflow-hidden max-w-[80px]">
                          <div
                            className={`h-full ${getProgressColor(task.progress)}`}
                            style={{ width: `${task.progress}%`, transition: 'width 0.3s' }}
                          />
                        </div>
                        <span className="text-slate-700 text-sm font-medium w-8 text-right">{task.progress}%</span>
                      </div>

                      {canEdit(task) && (
                        <button
                          onClick={() => startEditProgress(task)}
                          className="ml-2 p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-600 hover:bg-slate-100 rounded transition-all"
                          title="進捗を更新"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
