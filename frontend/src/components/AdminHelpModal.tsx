interface AdminHelpModalProps {
  onClose: () => void;
}

export default function AdminHelpModal({ onClose }: AdminHelpModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6 md:p-12 animate-fade-in">
      {/*
        [余白調整]
        - max-w-3xl: 幅を広めに
        - p-8: 内部余白を大きく確保
        - max-h-[90vh]: 上下にも余裕を持たせる
      */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ヘッダー */}
        <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800">管理者ガイド</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-200 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 text-slate-700 leading-relaxed">

          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-800 text-white text-xs font-bold">1</span>
              ユーザーの追加と配布
            </h3>
            <div className="pl-2 space-y-3">
              <p>プロジェクトに参加するメンバーを登録し、専用の起動ファイルを配布します。</p>
              <ol className="list-decimal list-inside space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm">
                <li>ヘッダー右上の <strong className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800">設定</strong> ボタンをクリックして「ユーザー管理」を開きます。</li>
                <li>「新規ユーザー追加」欄に担当者名を入力して追加します。</li>
                <li>追加されたユーザー一覧から、「Win用バッチ」または「Mac用コマンド」をダウンロードします。</li>
                <li>ダウンロードしたファイルを、メールやチャットなどで各担当者に送付してください。</li>
              </ol>
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-800 text-white text-xs font-bold">2</span>
              タスクの管理
            </h3>
            <div className="pl-2 space-y-3">
              <p>WBS（左側リスト）とガントチャート（右側カレンダー）を使って進捗を管理します。</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><strong>作成・編集</strong>: ガントチャート上の何もない場所をクリックすると新規タスクを作成できます。タスクバーをクリックすると詳細を編集できます。</li>
                <li><strong>進捗更新</strong>: タスクリストの「進捗」列にはマウスオーバーで鉛筆アイコンが表示され、ここから素早く進捗率を更新できます。</li>
                <li><strong>ガントチャート操作</strong>: マウスでのドラッグ操作機能は現在開発中です。日付の変更はタスク詳細パネルから行ってください。</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-3 pb-2 border-b border-slate-100">
              <span className="flex items-center justify-center w-6 h-6 rounded bg-slate-800 text-white text-xs font-bold">3</span>
              データの保存とバックアップ
            </h3>
            <div className="pl-2 space-y-3">
              <p>全ての変更はローカルのJSONファイルに即座に保存されます。</p>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                <p className="font-bold flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  自動バックアップ
                </p>
                アプリ起動時に自動的に <code>backup/</code> フォルダにデータのバックアップが作成されます。万が一の際はここからデータを復元できます。
              </div>
            </div>
          </section>

        </div>

        {/* フッター */}
        <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 text-center">
          <button onClick={onClose} className="btn bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-8 py-2.5 shadow-sm text-base">
            閉じる
          </button>
        </div>

      </div>
    </div>
  );
}
