/**
 * Portable WBS Tool - Header Component
 * ヘッダーコンポーネント
 */

import { store } from '../store';
import { openTaskModal, openUserModal } from './Modal';
import { generateBatch } from '../api';
import { showToast } from './Toast';

/** ヘッダーをレンダリング */
export const renderHeader = (): void => {
  const container = document.getElementById('header-container');
  if (!container) return;

  const state = store.getState();
  const mode = store.getMode();
  const isAdmin = mode === 'admin';
  const userId = store.getCurrentUserId();
  const userName = state.data?.users.find(u => u.id === userId)?.name ?? '';

  container.innerHTML = `
    <header class="header">
      <div class="header__left">
        <div class="header__logo">
          <i class="bi bi-bar-chart-steps header__logo-icon"></i>
          <span class="header__logo-text">Portable WBS Tool</span>
        </div>
        ${!isAdmin && userName ? `<span class="header__user"><i class="bi bi-person"></i> ${escapeHtml(userName)}</span>` : ''}
      </div>
      <div class="header__right">
        ${isAdmin ? `
          <button class="btn btn--primary btn--sm" id="add-task-btn">
            <i class="bi bi-plus-lg"></i> 新規タスク
          </button>
          <button class="btn btn--secondary btn--sm" id="user-management-btn">
            <i class="bi bi-people"></i> ユーザー管理
          </button>
        ` : ''}
        <button class="btn btn--secondary btn--sm" id="export-btn">
          <i class="bi bi-download"></i> エクスポート
        </button>
      </div>
    </header>
  `;
};

/** ヘッダーのイベントを設定 */
export const setupHeaderEvents = (): void => {
  document.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    // 新規タスクボタン
    if (target.id === 'add-task-btn' || target.closest('#add-task-btn')) {
      openTaskModal();
    }

    // ユーザー管理ボタン
    if (target.id === 'user-management-btn' || target.closest('#user-management-btn')) {
      openUserModal();
    }

    // エクスポートボタン
    if (target.id === 'export-btn' || target.closest('#export-btn')) {
      exportData();
    }

    // バッチ生成ボタン
    const generateBatchBtn = target.closest('[data-generate-batch]') as HTMLElement;
    if (generateBatchBtn) {
      const userId = generateBatchBtn.dataset.generateBatch!;
      const userName = generateBatchBtn.dataset.userName ?? 'user';
      await handleGenerateBatch(userId, userName);
    }

    // ユーザー削除ボタン
    const deleteUserBtn = target.closest('[data-delete-user]') as HTMLElement;
    if (deleteUserBtn) {
      const userId = deleteUserBtn.dataset.deleteUser!;
      if (confirm('このユーザーを削除しますか？')) {
        const success = await store.deleteUser(userId);
        if (success) {
          const { renderUserList } = await import('./Modal');
          renderUserList();
          showToast('ユーザーを削除しました', { type: 'success' });
        }
      }
    }
  });
};

/** データエクスポート */
const exportData = (): void => {
  const state = store.getState();
  if (!state.data) return;

  const dataStr = JSON.stringify(state.data, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `wbs_data_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('データをエクスポートしました', { type: 'success' });
};

/** バッチファイル生成 */
const handleGenerateBatch = async (userId: string, userName: string): Promise<void> => {
  try {
    // Windows用とMac用の両方を生成
    const osType = navigator.platform.toLowerCase().includes('mac') ? 'mac' : 'windows';
    const result = await generateBatch(userId, userName, osType);

    if (result.success) {
      const blob = new Blob([result.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`${userName}用バッチファイルをダウンロードしました`, { type: 'success' });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'バッチファイルの生成に失敗しました';
    showToast(message, { type: 'error' });
  }
};

/** HTMLエスケープ */
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
