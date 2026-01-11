import { useState } from 'react';
import type { User } from '../types';

interface UserManagementModalProps {
  users: User[];
  onAddUser: (name: string) => Promise<void>;
  onClose: () => void;
}

export default function UserManagementModal({
  users,
  onAddUser,
  onClose,
}: UserManagementModalProps) {
  const [newUserName, setNewUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ユーザー追加
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddUser(newUserName.trim());
      setNewUserName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // バッチファイル生成・ダウンロード
  const downloadBatchFile = (user: User) => {
    // Windows用バッチファイル
    const batchContent = `@echo off
cd /d %~dp0
set WBS_MODE=user
set WBS_AUTO_LOGIN_USER=${user.id}
if exist ".venv\\Scripts\\activate.bat" (
    call .venv\\Scripts\\activate.bat
)
start http://127.0.0.1:5000
python bin\\app\\server.py
pause
`;
    // ※ start http://... を入れておくとブラウザも自動で開くので便利

    // 今回は簡易的にUTF-8（BOM付きにするとBATが誤動作することもある）またはASCIIで。
    // ひとまずUTF-8で生成。

    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([batchContent], { type: 'text/plain' }));
    link.download = `start_${user.name}.bat`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Batchファイル (Mac用)
  const downloadCommandFile = (user: User) => {
    const content = `#!/bin/bash
cd "$(dirname "$0")"
export WBS_MODE=user
export WBS_AUTO_LOGIN_USER=${user.id}
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
fi
open http://127.0.0.1:5000
python bin/app/server.py
`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    link.download = `start_${user.name}.command`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 md:p-12 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">ユーザー管理</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {/* 新規追加フォーム */}
          <form onSubmit={handleSubmit} className="mb-10 p-6 bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
            <label className="block text-sm font-bold text-slate-700 mb-3">新規ユーザー追加</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="担当者名を入力"
                className="flex-1 input border-slate-300 py-2.5"
              />
              <button
                type="submit"
                disabled={isSubmitting || !newUserName.trim()}
                className="btn btn-primary px-6"
              >
                追加
              </button>
            </div>
          </form>

          {/* ユーザー一覧 */}
          <h3 className="font-bold text-lg text-slate-800 mb-4 pb-2 border-b border-slate-100">登録済みユーザー</h3>
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                    {user.name.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-lg">{user.name}</div>
                    <div className="text-xs text-slate-400 font-mono">ID: {user.id}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadBatchFile(user)}
                    className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded border border-blue-100 hover:bg-blue-100 transition-colors"
                    title="Windows用バッチファイルをダウンロード"
                  >
                    Win用バッチ
                  </button>
                  <button
                    onClick={() => downloadCommandFile(user)}
                    className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded border border-slate-200 hover:bg-slate-200 transition-colors"
                    title="Mac用コマンドファイルをダウンロード"
                  >
                    Mac用コマンド
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 text-right">
          <button onClick={onClose} className="btn bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-6 py-2.5">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
