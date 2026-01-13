/**
 * Portable WBS Tool - Gantt Chart Component
 * ガントチャートコンポーネント（幅1/3）
 */

import type { Task } from '../types';
import { store } from '../store';

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

/** 日付フォーマット */
const formatDate = (date: Date): string => {
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

/** 曜日取得 */
const getDayOfWeek = (date: Date): string => {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
};

/** 週末判定 */
const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

/** 今日判定 */
const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/** 日付範囲を計算 */
const calculateDateRange = (tasks: Task[]): Date[] => {
  if (tasks.length === 0) {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - 7);
    const end = new Date(today);
    end.setDate(end.getDate() + 21);

    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  let minDate = new Date(tasks[0].start);
  let maxDate = new Date(tasks[0].end);

  tasks.forEach(task => {
    const start = new Date(task.start);
    const end = new Date(task.end);
    if (start < minDate) minDate = start;
    if (end > maxDate) maxDate = end;
  });

  // 前後に余裕
  minDate.setDate(minDate.getDate() - 7);
  maxDate.setDate(maxDate.getDate() + 14);

  const dates: Date[] = [];
  const current = new Date(minDate);
  while (current <= maxDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/** 日付が範囲内か判定 */
const isDateInRange = (date: Date, start: string, end: string): boolean => {
  const taskStart = new Date(start);
  const taskEnd = new Date(end);

  // 時間情報をクリア
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const s = new Date(taskStart.getFullYear(), taskStart.getMonth(), taskStart.getDate());
  const e = new Date(taskEnd.getFullYear(), taskEnd.getMonth(), taskEnd.getDate());

  return checkDate >= s && checkDate <= e;
};

/** ガントチャートをレンダリング */
export const renderGanttChart = (): void => {
  const container = document.getElementById('gantt-container');
  if (!container) return;

  const state = store.getState();
  const tasks = state.data?.tasks ?? [];
  const selectedTaskId = state.selectedTaskId;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📅</div>
        <p class="empty-state__text">タスクを追加してください</p>
      </div>
    `;
    return;
  }

  const dates = calculateDateRange(tasks);
  const sortedTasks = sortTasksByHierarchy(tasks);

  let html = '<table class="gantt-table"><thead><tr>';

  // ヘッダー行（日付）
  dates.forEach(date => {
    const weekend = isWeekend(date);
    const today = isToday(date);

    const headerClass = [
      'gantt-header',
      weekend ? 'gantt-header--weekend' : '',
      today ? 'gantt-header--today' : '',
    ].filter(Boolean).join(' ');

    html += `
      <th class="${headerClass}">
        <div class="gantt-header__date">${formatDate(date)}</div>
        <div class="gantt-header__day">${getDayOfWeek(date)}</div>
      </th>
    `;
  });

  html += '</tr></thead><tbody>';

  // タスク行
  sortedTasks.forEach(task => {
    const isSelected = selectedTaskId === task.id;
    const rowClass = isSelected ? 'gantt-row--selected' : '';

    html += `<tr class="gantt-row ${rowClass}" data-task-id="${task.id}">`;

    dates.forEach(date => {
      const weekend = isWeekend(date);
      const today = isToday(date);
      const isActive = isDateInRange(date, task.start, task.end);

      const dateKey = date.toISOString().split('T')[0];
      const isStart = task.start === dateKey;
      const isEnd = task.end === dateKey;

      const cellClass = [
        'gantt-cell',
        weekend ? 'gantt-cell--weekend' : '',
        today ? 'gantt-cell--today' : '',
      ].filter(Boolean).join(' ');

      html += `<td class="${cellClass}">`;

      if (task.is_milestone && isActive) {
        html += `<div class="gantt-milestone ${isSelected ? 'gantt-milestone--selected' : ''}" title="${escapeHtml(task.name)}"></div>`;
      } else if (isActive) {
        let barClass = 'gantt-bar';
        if (isSelected) barClass += ' gantt-bar--selected';
        if (isStart && isEnd) barClass += ' gantt-bar--single';
        else if (isStart) barClass += ' gantt-bar--start';
        else if (isEnd) barClass += ' gantt-bar--end';
        else barClass += ' gantt-bar--middle';

        html += `<div class="${barClass}" title="${escapeHtml(task.name)}"></div>`;
      }

      html += '</td>';
    });

    html += '</tr>';
  });

  html += '</tbody></table>';
  container.innerHTML = html;
};

/** ガントチャートのイベントを設定 */
export const setupGanttEvents = (): void => {
  const container = document.getElementById('gantt-container');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const row = target.closest('.gantt-row') as HTMLElement;

    if (row) {
      const taskId = row.dataset.taskId;
      store.selectTask(taskId ?? null);
    }
  });
};

/** HTMLエスケープ */
const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};
