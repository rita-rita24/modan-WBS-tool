import { useState, useEffect } from 'react';
import type { Task, User } from '../types';

interface TaskEditPanelProps {
  task: Task | null;
  users: User[];
  isAdmin: boolean;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onClose: () => void;
  onCreateTask: () => void;
  onOpenHelp?: () => void;
}

export default function TaskEditPanel({
  task,
  users,
  isAdmin,
  onSave,
  onDelete,
  onClose,
  onCreateTask: _onCreateTask,
}: TaskEditPanelProps) {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // タスク変更時に編集状態を更新
  useEffect(() => {
    setEditedTask(task ? { ...task } : null);
    setIsDeleting(false);
  }, [task]);

  // 変更を適用
  const handleChange = (field: keyof Task, value: string | number | boolean | null) => {
    if (!editedTask) return;
    setEditedTask({ ...editedTask, [field]: value });
  };

  // 保存
  const handleSave = () => {
    if (!editedTask) return;
    onSave(editedTask);
  };

  // 削除確認
  const handleDelete = () => {
    if (!editedTask) return;
    if (isDeleting) {
      onDelete(editedTask.id);
      setIsDeleting(false);
    } else {
      setIsDeleting(true);
    }
  };

  if (!editedTask) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-slate-400">
        <p>タスクを選択してください</p>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">
          {isAdmin ? 'タスク編集' : 'タスク詳細'}
        </h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* フォーム - flex-1 scrollable */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {/* タスク名 */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            タスク名
          </label>
          <input
            type="text"
            value={editedTask.name}
            onChange={(e) => handleChange('name', e.target.value)}
            disabled={!isAdmin}
            className="input"
          />
        </div>

        {/* 担当者 */}
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            担当者
          </label>
          <select
            value={editedTask.assignee_id || ''}
            onChange={(e) => handleChange('assignee_id', e.target.value || null)}
            disabled={!isAdmin}
            className="input select"
          >
            <option value="">未割り当て</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </select>
        </div>

        {/* 期間 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              開始日
            </label>
            <input
              type="date"
              value={editedTask.start}
              onChange={(e) => handleChange('start', e.target.value)}
              disabled={!isAdmin}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">
              終了日
            </label>
            <input
              type="date"
              value={editedTask.end}
              onChange={(e) => handleChange('end', e.target.value)}
              disabled={!isAdmin}
              className="input"
            />
          </div>
        </div>

        {/* 進捗率 */}
        <div>
          <div className="flex justify-between mb-1">
            <label className="block text-sm font-medium text-slate-600">
              進捗率
            </label>
            <span className="text-sm font-semibold text-slate-800">{editedTask.progress}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={editedTask.progress}
            onChange={(e) => handleChange('progress', Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
          />
        </div>

        {/* マイルストーン（管理者のみ） */}
        {isAdmin && (
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={editedTask.is_milestone}
                onChange={(e) => handleChange('is_milestone', e.target.checked)}
                className="w-4 h-4 rounded text-slate-800 focus:ring-slate-800"
              />
              <span className="text-sm text-slate-700">マイルストーンとして設定</span>
            </label>
          </div>
        )}
      </div>

      {/* アクションボタン */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
        {isAdmin && (
          <>
            <button
              onClick={handleDelete}
              className={`btn ${isDeleting ? 'bg-red-600 text-white hover:bg-red-700' : 'btn-secondary text-red-600 border-red-200 hover:bg-red-50'}`}
            >
              {isDeleting ? '確認' : '削除'}
            </button>
            {isDeleting && (
              <button
                onClick={() => setIsDeleting(false)}
                className="btn btn-secondary"
              >
                キャンセル
              </button>
            )}
          </>
        )}
        <button
          onClick={handleSave}
          className="btn btn-primary flex-1 bg-slate-800 hover:bg-slate-700 text-white"
        >
          保存
        </button>
      </div>
    </div>
  );
}
