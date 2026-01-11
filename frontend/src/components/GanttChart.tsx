/**
 * Portable WBS Tool - Gantt Chart Component (Grid View)
 * シンプルな日付グリッドによるガントチャート表示
 */

import { useMemo, useRef, useEffect } from 'react';
import type { Task, User } from '../types';

interface GanttChartProps {
  tasks: Task[];
  users: User[];
  viewMode: any; // 互換性のため残すが使用しない
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string | null) => void;
  onDateChange?: (taskId: string, start: Date, end: Date) => void;
  isAdmin: boolean;
}

export default function GanttChart({
  tasks,
  users: _users,
  selectedTaskId,
  onTaskSelect,
}: GanttChartProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 表示期間の計算
  const { startDate, dates } = useMemo(() => {
    if (tasks.length === 0) {
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const end = new Date();
      end.setDate(end.getDate() + 21);
      return { startDate: start, endDate: end, totalDays: 28, dates: [] };
    }

    // タスクの最小開始日と最大終了日を見つける
    let minStart = new Date(tasks[0].start);
    let maxEnd = new Date(tasks[0].end);

    tasks.forEach(task => {
      const s = new Date(task.start);
      const e = new Date(task.end);
      if (s < minStart) minStart = s;
      if (e > maxEnd) maxEnd = e;
    });

    // 前後に余裕を持たせる
    minStart.setDate(minStart.getDate() - 7);
    maxEnd.setDate(maxEnd.getDate() + 14);

    const diffTime = Math.abs(maxEnd.getTime() - minStart.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const dates = [];
    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(minStart);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    return { startDate: minStart, endDate: maxEnd, totalDays, dates };
  }, [tasks]);

  // 今日の日付へスクロール
  useEffect(() => {
    if (scrollContainerRef.current) {
      // 簡易的に中央付近へ (改善の余地あり)
      // scrollContainerRef.current.scrollLeft = 0;
    }
  }, [startDate]);


  // 日付のフォーマット
  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 曜日の取得
  const getDayOfWeek = (date: Date) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return days[date.getDay()];
  };

  // 週末判定
  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // 今日判定
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // タスクが日付に含まれるか判定
  const isTaskActiveOnDate = (task: Task, date: Date) => {
    const taskStart = new Date(task.start);
    const taskEnd = new Date(task.end);

    // 時間情報をクリアして日付のみで比較
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(taskStart.getFullYear(), taskStart.getMonth(), taskStart.getDate());
    const e = new Date(taskEnd.getFullYear(), taskEnd.getMonth(), taskEnd.getDate());

    return checkDate >= s && checkDate <= e;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white select-none">
      {/* ヘッダー (日付) */}
      <div className="flex-shrink-0 overflow-hidden border-b border-slate-200 bg-slate-50" ref={scrollContainerRef} style={{ marginLeft: '0px' }}> {/* Sync scroll needed if separate */}
        {/* 簡易実装のため、bodyとスクロールを同期させる構造にするのが理想だが、
              今回は親コンテナでスクロールさせる */}
      </div>

      <div className="flex-1 overflow-auto relative" ref={scrollContainerRef}>
        <table className="border-collapse w-max">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
            <tr>
              {dates.map((date, index) => (
                <th
                  key={index}
                  className={`
                    border-r border-b border-slate-200 min-w-[40px] h-10 text-center text-xs
                    ${isWeekend(date) ? 'bg-slate-100 text-slate-500' : 'text-slate-700'}
                    ${isToday(date) ? 'bg-blue-50 text-blue-700 font-bold' : ''}
                  `}
                >
                  <div className="flex flex-col justify-center h-full leading-tight">
                    <span>{formatDate(date)}</span>
                    <span className="text-[10px] opacity-70">{getDayOfWeek(date)}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                className={`
                  h-10 hover:bg-slate-50 transition-colors
                  ${selectedTaskId === task.id ? 'bg-slate-100' : ''}
                `}
                onClick={() => onTaskSelect(task.id)}
              >
                {dates.map((date, index) => {
                  const active = isTaskActiveOnDate(task, date);
                  const isMilestone = task.is_milestone;

                  let cellClass = `border-r border-b border-slate-100 min-w-[40px] `;
                  if (isWeekend(date)) cellClass += 'bg-slate-50 ';
                  if (isToday(date)) cellClass = cellClass.replace('bg-slate-50 ', '') + 'bg-blue-50/30 ';

                  return (
                    <td key={index} className={cellClass}>
                      {active && (
                        <div className="w-full h-full flex items-center justify-center py-2 px-0.5">
                          {isMilestone ? (
                            <div className="w-4 h-4 bg-slate-800 rotate-45 transform shadow-sm" />
                          ) : (
                            <div
                              className={`w-full h-4 rounded-sm shadow-sm opacity-90
                                                ${selectedTaskId === task.id ? 'bg-slate-600' : 'bg-slate-400'}
                                            `}
                            />
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* 空行を追加して見た目を整える */}
            {Array.from({ length: Math.max(0, 15 - tasks.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-10">
                {dates.map((date, index) => (
                  <td key={index} className={`border-r border-b border-slate-100 min-w-[40px] ${isWeekend(date) ? 'bg-slate-50' : ''}`} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
