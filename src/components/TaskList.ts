/**
 * Portable WBS Tool - Task List Component
 * タスク一覧コンポーネント（幅2/3）
 */

import type { Task, User } from '../types';
import { store } from '../store';
import { openTaskModal, openProgressModal } from './Modal';
import { showToast } from './Toast';

/** タスクを階層順にソート */
const sortTasksByHierarchy = (tasks: Task[]): Task[] => {
  const result: Task[] = [];

  const addTaskAndChildren = (parentId: string | null) => {
    tasks
      .filter(t => t.parent_id === parentId)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .forEach(task => {
        result.push(task);
        addTaskAndChildren(task.id);
      });
  };

  addTaskAndChildren(null);
  return result;
};

/** インデントレベルを取得 */
const getIndentLevel = (task: Task, tasks: Task[]): number => {
  let level = 0;
  let current = task;

  while (current.parent_id) {
    level++;
    const parent = tasks.find(t => t.id === current.parent_id);
    if (!parent) break;
    current = parent;
  }

  return level;
};

/** ユーザー名を取得 */
const getUserName = (userId: string | null, users: User[]): string => {
  if (!userId) return '-';
  const user = users.find(u => u.id === userId);
  return user?.name ?? '-';
};

/** 進捗バーのクラスを取得 */
const getProgressClass = (progress: number): string => {
  if (progress < 30) return 'progress--low';
  if (progress < 70) return 'progress--medium';
  return 'progress--high';
};

/** 日付フォーマット */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

/** HTMLエスケープ */
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/** タスク一覧をレンダリング */
export const renderTaskList = (): void => {
  const container = document.getElementById('task-list-container');
  if (!container) return;

  const state = store.getState();
  const tasks = state.data?.tasks ?? [];
  const users = state.data?.users ?? [];
  const selectedTaskId = state.selectedTaskId;
  const mode = store.getMode();
  const isAdmin = mode === 'admin';
  const currentUserId = store.getCurrentUserId();

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📋</div>
        <p class="empty-state__text">タスクがありません</p>
        ${isAdmin ? '<button class="btn btn--primary" id="add-first-task">+ 最初のタスクを作成</button>' : ''}
      </div>
    `;
    return;
  }

  const sortedTasks = sortTasksByHierarchy(tasks);

  let html = `
    <table class="task-table">
      <thead>
        <tr>
          <th class="task-table__th--name">タスク名</th>
          <th class="task-table__th--assignee">担当者</th>
          <th class="task-table__th--date">開始日</th>
          <th class="task-table__th--date">終了日</th>
          <th class="task-table__th--progress">進捗</th>
          <th class="task-table__th--actions">操作</th>
        </tr>
      </thead>
      <tbody>
  `;

  sortedTasks.forEach(task => {
    const indent = getIndentLevel(task, tasks);
    const isSelected = selectedTaskId === task.id;
    const isMilestone = task.is_milestone;

    // ユーザーは自分の担当タスクの進捗のみ編集可能
    const isMyTask = task.assignee_id === currentUserId;
    const canEditProgress = isAdmin || isMyTask;

    const rowClass = [
      isSelected ? 'task-row--selected' : '',
      isMilestone ? 'task-row--milestone' : '',
    ].filter(Boolean).join(' ');

    html += `
      <tr class="task-row ${rowClass}" data-task-id="${task.id}">
        <td class="task-table__td--name">
          <div class="task-name" style="padding-left: ${indent * 20}px">
            <span class="task-icon ${isMilestone ? 'task-icon--milestone' : ''}">${isMilestone ? '◆' : '○'}</span>
            <span class="task-name__text">${escapeHtml(task.name)}</span>
          </div>
        </td>
        <td class="task-table__td--assignee">${escapeHtml(getUserName(task.assignee_id, users))}</td>
        <td class="task-table__td--date">${formatDate(task.start)}</td>
        <td class="task-table__td--date">${formatDate(task.end)}</td>
        <td class="task-table__td--progress">
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-bar__fill ${getProgressClass(task.progress)}" style="width: ${task.progress}%"></div>
            </div>
            <span class="progress-value">${task.progress}%</span>
          </div>
        </td>
        <td class="task-table__td--actions">
          <div class="action-buttons">
            ${isAdmin ? `
              <button class="btn btn--icon btn--outline" data-edit-task="${task.id}" title="編集">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn--icon btn--outline-danger" data-delete-task="${task.id}" title="削除">
                <i class="bi bi-trash"></i>
              </button>
            ` : canEditProgress ? `
              <button class="btn btn--icon btn--outline" data-edit-progress="${task.id}" title="進捗編集">
                <i class="bi bi-pencil-square"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
};

/** タスク一覧のイベントを設定 */
export const setupTaskListEvents = (): void => {
  const container = document.getElementById('task-list-container');
  if (!container) return;

  container.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    // 行クリック（選択）
    const row = target.closest('.task-row') as HTMLElement;
    if (row && !target.closest('button')) {
      const taskId = row.dataset.taskId;
      store.selectTask(taskId ?? null);
    }

    // 編集ボタン（Admin用：全編集）
    const editBtn = target.closest('[data-edit-task]') as HTMLElement;
    if (editBtn) {
      const taskId = editBtn.dataset.editTask;
      const state = store.getState();
      const task = state.data?.tasks.find(t => t.id === taskId);

      if (task) {
        openTaskModal(task);
      }
    }

    // 進捗編集ボタン（User用：進捗のみ）
    const editProgressBtn = target.closest('[data-edit-progress]') as HTMLElement;
    if (editProgressBtn) {
      const taskId = editProgressBtn.dataset.editProgress;
      const state = store.getState();
      const task = state.data?.tasks.find(t => t.id === taskId);

      if (task) {
        openProgressModal(task);
      }
    }

    // 削除ボタン
    const deleteBtn = target.closest('[data-delete-task]') as HTMLElement;
    if (deleteBtn) {
      const taskId = deleteBtn.dataset.deleteTask;
      if (taskId && confirm('このタスクを削除しますか？')) {
        const success = await store.deleteTask(taskId);
        if (success) {
          showToast('タスクを削除しました', { type: 'success' });
        }
      }
    }

    // 最初のタスク作成ボタン
    if (target.id === 'add-first-task') {
      openTaskModal();
    }
  });
};
