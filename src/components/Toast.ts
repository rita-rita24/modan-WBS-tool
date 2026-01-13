/**
 * Portable WBS Tool - Toast Component
 * トースト通知コンポーネント
 */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

/** トースト通知を表示 */
export const showToast = (message: string, options: ToastOptions = {}): void => {
  const { type = 'info', duration = 3000 } = options;

  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // アニメーション後に削除
  setTimeout(() => {
    toast.classList.add('toast--fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
};
