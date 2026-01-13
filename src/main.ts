/**
 * Portable WBS Tool - Main Entry Point
 * アプリケーションエントリーポイント
 */

import { store } from './store';
import { renderLoginForm, setupLoginEvents, updateLoginVisibility } from './components/Login';
import { renderHeader, setupHeaderEvents } from './components/Header';
import { renderTaskList, setupTaskListEvents } from './components/TaskList';
import { renderGanttChart, setupGanttEvents } from './components/GanttChart';
import {
  closeModal,
  saveTask,
  deleteTask,
  saveProgress,
  addNewUser,
} from './components/Modal';
import { showToast } from './components/Toast';

/** アプリケーション初期化 */
const initApp = async (): Promise<void> => {
  console.log('[INFO] Portable WBS Tool initializing...');

  // 状態変更時の再レンダリング
  store.subscribe((state) => {
    if (state.isAuthenticated) {
      renderHeader();
      renderTaskList();
      renderGanttChart();
    }
    updateLoginVisibility();

    // エラー表示
    if (state.error) {
      showToast(state.error, { type: 'error' });
      store.clearError();
    }
  });

  // イベントリスナー設定
  setupLoginEvents();
  setupHeaderEvents();
  setupTaskListEvents();
  setupGanttEvents();
  setupModalEvents();

  // データ初期化
  await store.initialize();

  // ユーザーモードの場合は自動認証
  const mode = store.getMode();
  if (mode === 'user') {
    store.setAuthenticated(true);
  } else {
    renderLoginForm();
  }

  console.log('[INFO] Portable WBS Tool initialized');
};

/** モーダルイベント設定 */
const setupModalEvents = (): void => {
  // モーダル外クリックで閉じる
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  // 閉じるボタン
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = (btn as HTMLElement).dataset.closeModal!;
      closeModal(modalId);
    });
  });

  // タスク保存ボタン
  const saveTaskBtn = document.getElementById('save-task-btn');
  saveTaskBtn?.addEventListener('click', saveTask);

  // タスク削除ボタン
  const deleteTaskBtn = document.getElementById('delete-task-btn');
  deleteTaskBtn?.addEventListener('click', deleteTask);

  // 進捗保存ボタン
  const saveProgressBtn = document.getElementById('save-progress-btn');
  saveProgressBtn?.addEventListener('click', saveProgress);

  // ユーザー追加ボタン
  const addUserBtn = document.getElementById('add-user-btn');
  addUserBtn?.addEventListener('click', addNewUser);

  // ユーザー追加フォームのEnterキー
  const newUserInput = document.getElementById('new-user-name');
  newUserInput?.addEventListener('keypress', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      e.preventDefault();
      addNewUser();
    }
  });
};

// 初期化実行
document.addEventListener('DOMContentLoaded', initApp);
