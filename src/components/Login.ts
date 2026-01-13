/**
 * Portable WBS Tool - Login Component
 * ログインコンポーネント
 */

import { authenticate } from '../api';
import { store } from '../store';
import { showToast } from './Toast';

/** ログインフォームをレンダリング */
export const renderLoginForm = (): void => {
  const container = document.getElementById('login-container');
  if (!container) return;

  const systemInfo = store.getState().systemInfo;
  const mode = systemInfo?.mode ?? 'user';

  if (mode === 'user') {
    // ユーザーモードは自動ログイン
    store.setAuthenticated(true);
    return;
  }

  container.innerHTML = `
    <div class="login-box">
      <div class="login-box__header">
        <div class="login-box__logo">📊</div>
        <h1 class="login-box__title">Portable WBS Tool</h1>
        <p class="login-box__subtitle">管理者ログイン</p>
      </div>
      <form id="login-form" class="login-box__form">
        <div class="form-group">
          <label class="form-label" for="admin-password">管理者パスワード</label>
          <input type="password" id="admin-password" class="form-input" placeholder="パスワードを入力" required>
        </div>
        <button type="submit" class="btn btn--primary btn--full">ログイン</button>
      </form>
      <p class="login-box__hint">初期パスワード: admin</p>
    </div>
  `;

  container.style.display = 'flex';
};

/** ログインフォームのイベントを設定 */
export const setupLoginEvents = (): void => {
  document.addEventListener('submit', async (e) => {
    if ((e.target as HTMLFormElement).id !== 'login-form') return;

    e.preventDefault();

    const passwordInput = document.getElementById('admin-password') as HTMLInputElement;
    const password = passwordInput?.value;

    if (!password) {
      showToast('パスワードを入力してください', { type: 'error' });
      return;
    }

    try {
      const result = await authenticate(password);

      if (result.success) {
        store.setAuthenticated(true);
        const loginContainer = document.getElementById('login-container');
        if (loginContainer) {
          loginContainer.style.display = 'none';
        }
        showToast('ログインしました', { type: 'success' });
      } else {
        showToast('パスワードが正しくありません', { type: 'error' });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ログインに失敗しました';
      showToast(message, { type: 'error' });
    }
  });
};

/** ログイン状態を表示/非表示 */
export const updateLoginVisibility = (): void => {
  const state = store.getState();
  const loginContainer = document.getElementById('login-container');
  const appContainer = document.getElementById('app-container');

  if (state.isAuthenticated) {
    if (loginContainer) loginContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'flex';
  } else {
    if (loginContainer) loginContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
  }
};
