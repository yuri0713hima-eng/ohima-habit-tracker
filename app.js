import { habits, dateKey, parseDate, weekDates, countDone, validRecords, cumulativeDays, weekProgress } from './habits.mjs';

const storageKey = 'ohima-habits-v1';
let records = {};
let storageError = false;
try { records = validRecords(JSON.parse(localStorage.getItem(storageKey))); } catch { storageError = true; }
const memoInput = document.querySelector('#memo');
function save() {
  try { localStorage.setItem(storageKey, JSON.stringify(records)); storageError = false; } catch { storageError = true; }
  showSaveStatus();
}
function showSaveStatus() {
  document.querySelector('#save-status').textContent = storageError ? '保存できませんでした。ブラウザの保存設定を確認してください。この画面を閉じると変更が失われる場合があります。' : 'このブラウザに保存しました。';
}
const dateInput = document.querySelector('#date');
dateInput.value = dateKey(new Date());
dateInput.max = dateKey(new Date());
const format = key => new Intl.DateTimeFormat('ja-JP', { month: 'numeric', day: 'numeric' }).format(parseDate(key));

function render() {
  const selected = dateInput.value;
  const today = dateKey(new Date());
  dateInput.max = today;
  document.querySelector('#next').disabled = selected >= today;
  document.querySelector('#day-title').textContent = selected === today ? '今日の習慣' : `${format(selected)}の習慣`;
  const count = countDone(records, selected);
  document.querySelector('#progress-label').textContent = `${count} / 3 達成`;
  document.querySelector('#percentage').textContent = `${Math.round(count / 3 * 100)}%`;
  document.querySelector('#progress-fill').style.width = `${count / 3 * 100}%`;
  document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', count);
  document.querySelector('#encouragement').textContent = ['小さな一歩から、はじめよう。', 'いいスタート。その一歩が大切。', 'あとひとつ。自分のペースで。', 'すべて達成！今日もおつかれさま。'][count];
  document.querySelector('#habits').innerHTML = habits.map(habit => {
    const done = records[selected]?.[habit.id] === true;
    return `<article class="habit ${habit.color} ${done ? 'completed' : ''}"><div class="habit-top"><span class="habit-icon" aria-hidden="true">${habit.icon}</span><span class="habit-number">0${habits.indexOf(habit) + 1}</span></div><p class="habit-english">${habit.english}</p><h3>${habit.name}</h3><p class="habit-description">${habit.description}</p><p class="streak">✿ <strong>${cumulativeDays(records, habit.id, selected)}</strong> 日達成（累計） <span>${selected === today ? '今日まで' : '選択日まで'}</span></p><button data-habit="${habit.id}" aria-pressed="${done}"><span aria-hidden="true">${done ? '✓' : '+'}</span> ${done ? '達成しました' : '達成を記録する'}</button></article>`;
  }).join('');
  const days = weekDates(selected);
  document.querySelector('#week-range').textContent = `${format(days[0])} — ${format(days[6])}`;
  document.querySelector('#week-head').innerHTML = `<tr><th scope="col">習慣</th>${days.map((day, i) => `<th scope="col" class="${day === selected ? 'selected' : ''}"><span>${['月', '火', '水', '木', '金', '土', '日'][i]}</span>${day <= today ? `<button class="calendar-date" data-date="${day}" aria-label="${format(day)}の記録" ${day === selected ? 'aria-current="date"' : ''}>${parseDate(day).getDate()}</button>` : parseDate(day).getDate()}${day === today ? '<small>今日</small>' : ''}</th>`).join('')}</tr>`;
  document.querySelector('#week-body').innerHTML = habits.map(habit => `<tr><th scope="row"><span class="table-icon ${habit.color}" aria-hidden="true">${habit.icon}</span>${habit.name}</th>${days.map(day => `<td class="${day === selected ? 'selected' : ''}"><span class="day-dot ${records[day]?.[habit.id] === true ? `done ${habit.color}` : ''}" aria-label="${format(day)} ${records[day]?.[habit.id] === true ? '達成' : day > today ? '未到来' : '未達成'}">${records[day]?.[habit.id] === true ? '✓' : '·'}</span></td>`).join('')}</tr>`).join('');
  document.querySelector('#week-summary').textContent = `今週は ${days.reduce((sum, day) => sum + countDone(records, day), 0)} 回の「できた」を記録`;
  const weekly = weekProgress(records, selected, today);
  document.querySelector('#weekly-rate').textContent = `週間達成率 ${weekly.percentage}% · ${weekly.done} / ${weekly.total} 達成（未来の日を除く）`;
  memoInput.value = records[selected]?.memo || '';
  document.querySelector('#memo-count').textContent = `${memoInput.value.length} / 2000`;
  showSaveStatus();
}

document.querySelector('#habits').addEventListener('click', event => {
  const button = event.target.closest('[data-habit]');
  if (!button) return;
  const key = dateInput.value;
  records[key] = { ...records[key], [button.dataset.habit]: !records[key]?.[button.dataset.habit] };
  save();
  render();
  document.querySelector(`[data-habit="${button.dataset.habit}"]`).focus();
});
dateInput.addEventListener('change', () => { if (!dateInput.value || !dateInput.validity.valid) dateInput.value = dateKey(new Date()); render(); });
for (const [id, offset] of [['previous', -1], ['next', 1]]) document.querySelector(`#${id}`).addEventListener('click', () => { const date = parseDate(dateInput.value); date.setDate(date.getDate() + offset); dateInput.value = dateKey(date); render(); });
document.querySelector('#today').addEventListener('click', () => { dateInput.value = dateKey(new Date()); render(); });
window.addEventListener('storage', event => { if (event.key === storageKey || event.key === null) { try { records = validRecords(JSON.parse(localStorage.getItem(storageKey))); storageError = false; render(); } catch { storageError = true; render(); } } });
render();

memoInput.addEventListener('input', () => {
  const key = dateInput.value;
  records[key] = { ...records[key], memo: memoInput.value };
  document.querySelector('#memo-count').textContent = `${memoInput.value.length} / 2000`;
  save();
});
document.querySelector('#week-head').addEventListener('click', event => {
  const button = event.target.closest('[data-date]');
  if (!button) return;
  dateInput.value = button.dataset.date;
  render();
});
