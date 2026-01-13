/**
 * Portable WBS Tool - Modal Component
 * モーダルダイアログコンポーネント
 */

import type { Task } from '../types';
import { store } from '../store';
import { showToast } from './Toast';

/** モーダルを開く */
export const openModal = (modalId: string): void => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('modal--active');
  }
};

/** モーダルを閉じる */
export const closeModal = (modalId: string): void => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('modal--active');
  }
};

/** タスク編集モーダルを開く */
export const openTaskModal = (task?: Task): void => {
  const state = store.getState();
  const users = state.data?.users ?? [];
  const tasks = state.data?.tasks ?? [];

  const modal = document.getElementById('task-modal');
  if (!modal) return;

  const title = modal.querySelector('.modal__title') as HTMLElement;
  const form = modal.querySelector('#task-form') as HTMLFormElement;
  const deleteBtn = modal.querySelector('#delete-task-btn') as HTMLButtonElement;

  // タイトル設定
  title.textContent = task ? 'タスク編集' : '新規タスク';
  deleteBtn.style.display = task ? 'inline-flex' : 'none';

  // 担当者セレクト生成
  const assigneeSelect = form.querySelector('#task-assignee') as HTMLSelectElement;
  assigneeSelect.innerHTML = '<option value="">未割り当て</option>';
  users.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = user.name;
    assigneeSelect.appendChild(option);
  });

  // 親タスクセレクト生成
  const parentSelect = form.querySelector('#task-parent') as HTMLSelectElement;
  parentSelect.innerHTML = '<option value="">なし（ルートタスク）</option>';
  tasks.forEach(t => {
    if (!task || t.id !== task.id) {
      const option = document.createElement('option');
      option.value = t.id;
      option.textContent = t.name;
      parentSelect.appendChild(option);
    }
  });

  // フォーム値設定
  if (task) {
    (form.querySelector('#task-id') as HTMLInputElement).value = task.id;
    (form.querySelector('#task-name') as HTMLInputElement).value = task.name;
    (form.querySelector('#task-start') as HTMLInputElement).value = task.start;
    (form.querySelector('#task-end') as HTMLInputElement).value = task.end;
    assigneeSelect.value = task.assignee_id ?? '';
    parentSelect.value = task.parent_id ?? '';
    (form.querySelector('#task-progress') as HTMLInputElement).value = String(task.progress);
    (form.querySelector('#task-milestone') as HTMLInputElement).checked = task.is_milestone;
  } else {
    form.reset();
    (form.querySelector('#task-id') as HTMLInputElement).value = '';
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    (form.querySelector('#task-start') as HTMLInputElement).value = today;
    (form.querySelector('#task-end') as HTMLInputElement).value = nextWeek;
    (form.querySelector('#task-progress') as HTMLInputElement).value = '0';
  }

  openModal('task-modal');
};

/** タスク保存 */
export const saveTask = async (): Promise<void> => {
  const form = document.querySelector('#task-form') as HTMLFormElement;
  if (!form) return;

  const id = (form.querySelector('#task-id') as HTMLInputElement).value;
  const name = (form.querySelector('#task-name') as HTMLInputElement).value.trim();
  const start = (form.querySelector('#task-start') as HTMLInputElement).value;
  const end = (form.querySelector('#task-end') as HTMLInputElement).value;
  const assigneeId = (form.querySelector('#task-assignee') as HTMLSelectElement).value || null;
  const parentId = (form.querySelector('#task-parent') as HTMLSelectElement).value || null;
  const progress = parseInt((form.querySelector('#task-progress') as HTMLInputElement).value) || 0;
  const isMilestone = (form.querySelector('#task-milestone') as HTMLInputElement).checked;

  if (!name) {
    showToast('タスク名を入力してください', { type: 'error' });
    return;
  }

  if (!start || !end) {
    showToast('開始日と終了日を入力してください', { type: 'error' });
    return;
  }

  if (new Date(start) > new Date(end)) {
    showToast('終了日は開始日以降に設定してください', { type: 'error' });
    return;
  }

  const taskData = {
    name,
    start,
    end,
    assignee_id: assigneeId,
    parent_id: parentId,
    progress: Math.min(100, Math.max(0, progress)),
    is_milestone: isMilestone,
    dependencies: [] as string[],
  };

  let success: boolean;
  if (id) {
    success = await store.updateTask(id, taskData);
  } else {
    success = await store.addTask(taskData);
  }

  if (success) {
    closeModal('task-modal');
    showToast(id ? 'タスクを更新しました' : 'タスクを作成しました', { type: 'success' });
  }
};

/** タスク削除 */
export const deleteTask = async (): Promise<void> => {
  const form = document.querySelector('#task-form') as HTMLFormElement;
  const id = (form?.querySelector('#task-id') as HTMLInputElement)?.value;

  if (!id) return;

  if (!confirm('このタスクを削除しますか？')) return;

  const success = await store.deleteTask(id);

  if (success) {
    closeModal('task-modal');
    showToast('タスクを削除しました', { type: 'success' });
  }
};

/** 進捗編集モーダルを開く */
export const openProgressModal = (task: Task): void => {
  const modal = document.getElementById('progress-modal');
  if (!modal) return;

  const taskIdInput = modal.querySelector('#progress-task-id') as HTMLInputElement;
  const taskNameSpan = modal.querySelector('#progress-task-name') as HTMLSpanElement;
  const progressInput = modal.querySelector('#progress-value') as HTMLInputElement;

  taskIdInput.value = task.id;
  taskNameSpan.textContent = task.name;
  progressInput.value = String(task.progress);

  openModal('progress-modal');
};

/** 進捗保存 */
export const saveProgress = async (): Promise<void> => {
  const modal = document.getElementById('progress-modal');
  if (!modal) return;

  const taskId = (modal.querySelector('#progress-task-id') as HTMLInputElement).value;
  const progress = parseInt((modal.querySelector('#progress-value') as HTMLInputElement).value) || 0;

  const success = await store.updateTask(taskId, {
    progress: Math.min(100, Math.max(0, progress)),
  });

  if (success) {
    closeModal('progress-modal');
    showToast('進捗を更新しました', { type: 'success' });
  }
};

/** ユーザー管理モーダルを開く */
export const openUserModal = (): void => {
  renderUserList();
  openModal('user-modal');
};

/** ユーザーリストをレンダリング */
export const renderUserList = (): void => {
  const container = document.getElementById('user-list');
  if (!container) return;

  const state = store.getState();
  const users = state.data?.users ?? [];

  if (users.length === 0) {
    container.innerHTML = '<p class="text-muted">ユーザーがいません</p>';
    return;
  }

  container.innerHTML = users.map(user => `
    <div class="user-item">
      <span class="user-item__name"><i class="bi bi-person"></i> ${escapeHtml(user.name)}</span>
      <div class="user-item__actions">
        <button class="btn btn--sm btn--secondary" data-generate-batch="${user.id}" data-user-name="${escapeHtml(user.name)}">
          <i class="bi bi-file-earmark-code"></i> バッチ生成
        </button>
        <button class="btn btn--sm btn--outline-danger" data-delete-user="${user.id}">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
};

/** ユーザー追加 */
export const addNewUser = async (): Promise<void> => {
  const input = document.getElementById('new-user-name') as HTMLInputElement;
  const name = input?.value.trim();

  if (!name) {
    showToast('ユーザー名を入力してください', { type: 'error' });
    return;
  }

  const success = await store.addUserToData(name);

  if (success) {
    input.value = '';
    renderUserList();
    showToast('ユーザーを追加しました', { type: 'success' });
  }
};

/** ユーザー削除 */
export const deleteUser = async (userId: string): Promise<void> => {
  if (!confirm('このユーザーを削除しますか？')) return;

  const success = await store.deleteUser(userId);

  if (success) {
    renderUserList();
    showToast('ユーザーを削除しました', { type: 'success' });
  }
};

/** HTMLエスケープ */
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
