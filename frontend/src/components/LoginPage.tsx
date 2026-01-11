import { useState } from 'react';
import type { User, AuthState } from '../types';

interface LoginPageProps {
  users: User[];
  pollingInterval: number;
  onLogin: (auth: AuthState) => void;
  mode?: string;
}

export default function LoginPage({
  users,
  onLogin,
  mode
}: LoginPageProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 管理者ログイン処理
  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        onLogin({
          isAuthenticated: true,
          role: 'admin',
          currentUser: null,
        });
      } else {
        setError(data.error || 'ログインに失敗しました');
      }
    } catch (err) {
      setError('サーバーに接続できませんでした');
    } finally {
      setIsLoading(false);
    }
  };

  // ユーザーログイン処理
  const handleUserLogin = (user: User) => {
    onLogin({
      isAuthenticated: true,
      role: 'member',
      currentUser: user,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in">
        {/* ヘッダー部分 */}
        <div className="bg-slate-800 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <h1 className="text-2xl font-bold text-white mb-2">Portable WBS Tool</h1>
          <p className="text-slate-300 text-sm">プロジェクト管理をシンプルに</p>
        </div>

        <div className="p-8 md:p-10 space-y-8">
          {mode === undefined ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 mx-auto mb-4 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
              <p className="text-slate-500">システム情報を取得中...</p>
            </div>
          ) : mode === 'admin' ? (
            /* 管理者モード */
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200 mb-2">
                  管理者モード
                </span>
                <p className="text-slate-600">管理者パスワードを入力してください</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-5">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-5 py-3 rounded-lg border border-slate-300 focus:border-slate-800 focus:ring-2 focus:ring-slate-200 transition-all outline-none text-slate-800 placeholder:text-slate-400"
                    placeholder="パスワード (admin)"
                    autoFocus
                  />
                  {error && <p className="text-red-500 text-sm mt-2 ml-1">{error}</p>}
                </div>
                <button
                  type="submit"
                  disabled={!password || isLoading}
                  className="w-full btn bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-lg font-bold shadow-lg shadow-slate-200 transform active:scale-95 transition-all text-base"
                >
                  {isLoading ? '認証中...' : 'ログイン'}
                </button>
              </form>
            </div>
          ) : (
            /* 一般ユーザーモード */
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 mb-2">
                  一般ユーザーモード
                </span>
                <p className="text-slate-600">あなたの担当者名を選択してください</p>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-slate-500">ユーザーが登録されていません</p>
                  <p className="text-xs text-slate-400 mt-1">管理者に連絡してください</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserLogin(user)}
                      className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50 hover:shadow-md transition-all group text-left bg-white"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700 transition-colors font-bold text-sm">
                        {user.name.slice(0, 2)}
                      </div>
                      <span className="font-bold text-slate-700 group-hover:text-slate-900 text-lg">
                        {user.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-400 border-t border-slate-100">
          &copy; 2026 Portable WBS Tool
        </div>
      </div>
    </div>
  );
}
