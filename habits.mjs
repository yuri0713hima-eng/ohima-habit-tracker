export const habits = [
  { id: 'gym', name: 'ジム', english: 'MOVE YOUR BODY', icon: '↗', description: '体を動かして、気持ちも軽く。', color: 'green' },
  { id: 'study', name: 'TOEIC勉強', english: 'FEED YOUR CURIOSITY', icon: '✎', description: '英語の一歩が、未来をひろげる。', color: 'purple' },
  { id: 'reading', name: '読書', english: 'OPEN A NEW WORLD', icon: '▤', description: 'ページの先に、新しい発見を。', color: 'orange' },
];
export function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function parseDate(key) { return new Date(`${key}T12:00:00`); }
export function weekDates(key) {
  const date = parseDate(key);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, index) => { const day = new Date(date); day.setDate(day.getDate() + index); return dateKey(day); });
}
export function countDone(records, key) { return habits.filter(habit => records[key]?.[habit.id] === true).length; }
export function validRecords(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, day]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && day && typeof day === 'object').map(([key, day]) => [key, { ...Object.fromEntries(habits.map(habit => [habit.id, day[habit.id] === true])), ...(typeof day.memo === 'string' ? { memo: day.memo.slice(0, 2000) } : {}) }]));
}

// 未達成の当日はまだ取り組めるため、直前の日までの連続記録を表示する。
export function streak(records, habitId, endKey, todayKey = dateKey(new Date())) {
  const date = parseDate(endKey);
  if (endKey === todayKey && records[endKey]?.[habitId] !== true) date.setDate(date.getDate() - 1);
  let count = 0;
  while (records[dateKey(date)]?.[habitId] === true) {
    count++;
    date.setDate(date.getDate() - 1);
  }
  return count;
}
export function weekProgress(records, selected, todayKey) {
  const days = weekDates(selected).filter(day => day <= todayKey);
  const done = days.reduce((total, day) => total + countDone(records, day), 0);
  return { done, total: days.length * habits.length, percentage: days.length ? Math.round(done / (days.length * habits.length) * 100) : 0 };
}
