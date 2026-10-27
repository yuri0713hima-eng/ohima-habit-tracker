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


/* Work notebook: separate storage; never modifies ohima-habits-v1. */
const workStorageKey = 'ohima-work-v1';
const workDate = document.querySelector('#work-date');
const workList = document.querySelector('#work-list');
const workWins = document.querySelector('#work-wins');
const workNext = document.querySelector('#work-next');
let workData = { tasks: [], notes: {} };
let workStorageError = false;
try {
  const loaded = JSON.parse(localStorage.getItem(workStorageKey));
  if (loaded && typeof loaded === 'object' && !Array.isArray(loaded)) {
    workData.tasks = Array.isArray(loaded.tasks) ? loaded.tasks.filter(t => t && typeof t.title === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(t.day)).slice(0,2000).map(t => ({
      id: String(t.id || ''), title: t.title.slice(0,120), day: t.day,
      priority: ['高','中','低'].includes(t.priority) ? t.priority : '中',
      due: /^\d{4}-\d{2}-\d{2}$/.test(t.due || '') ? t.due : '',
      done: t.done === true
    })) : [];
    workData.notes = loaded.notes && typeof loaded.notes === 'object' && !Array.isArray(loaded.notes) ? loaded.notes : {};
  }
} catch { workStorageError = true; }
workDate.value = dateKey(new Date());
function saveWork() {
  try { localStorage.setItem(workStorageKey, JSON.stringify(workData)); workStorageError = false; }
  catch { workStorageError = true; }
  document.querySelector('#work-status').textContent = workStorageError ? '保存に失敗しました。入力内容を別に控えてください。' : 'このiPhoneのブラウザに自動保存しました。';
}
function renderWork() {
  const key = workDate.value;
  const tasks = workData.tasks.filter(t => t.day === key).sort((a,b) => Number(a.done)-Number(b.done) || ['高','中','低'].indexOf(a.priority)-['高','中','低'].indexOf(b.priority));
  const finished = tasks.filter(t => t.done).length;
  document.querySelector('#work-summary').textContent = tasks.length ? `${finished} / ${tasks.length} 件完了 🌷 今日の積み重ねが増えとるよ。` : '今日の仕事を追加してみよう 🌱';
  workList.replaceChildren();
  if (!tasks.length) {
    const empty=document.createElement('li');empty.className='work-empty';empty.textContent='タスクはまだないよ。今日やりたいことをひとつ書いてみよう。';workList.append(empty);
  }
  for (const task of tasks) {
    const li = document.createElement('li');li.className='work-task' + (task.done ? ' done' : '');
    const check=document.createElement('input');check.type='checkbox';check.checked=task.done;check.setAttribute('aria-label',task.title+'を完了');check.addEventListener('change',()=>{task.done=check.checked;saveWork();renderWork()});
    const details=document.createElement('div');details.className='work-task-body';
    const title=document.createElement('div');title.className='work-task-title';title.textContent=task.title;
    const meta=document.createElement('div');meta.className='work-meta';meta.textContent='優先度 '+task.priority+(task.due ? ' · 締切 '+task.due : '');
    details.append(title,meta);
    const remove=document.createElement('button');remove.type='button';remove.textContent='削除';remove.setAttribute('aria-label',task.title+'を削除');
    remove.addEventListener('click',()=>{if (!confirm('このタスクを削除する？')) return;workData.tasks=workData.tasks.filter(t=>t!==task);saveWork();renderWork()});
    li.append(check,details,remove);workList.append(li);
  }
  const note=workData.notes[key] || {};
  workWins.value=typeof note.wins==='string'?note.wins:'';
  workNext.value=typeof note.next==='string'?note.next:'';
  document.querySelector('#work-status').textContent=workStorageError?'保存に失敗しました。入力内容を別に控えてください。':'仕事の記録はこのブラウザに保存されます。';
}
document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{
  const isWork=button.dataset.tab==='work';
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===button)));
  document.querySelector('#habit-view').hidden=isWork;
  document.querySelector('#work-view').hidden=!isWork;
}));
document.querySelector('#work-add').addEventListener('submit',event=>{
  event.preventDefault();
  const title=document.querySelector('#work-title').value.trim();
  if (!title) return;
  workData.tasks.push({id:String(Date.now())+'-'+Math.random().toString(36).slice(2),title:title.slice(0,120),day:workDate.value,priority:document.querySelector('#work-priority').value,due:document.querySelector('#work-due').value,done:false});
  document.querySelector('#work-title').value='';
  saveWork();renderWork();
});
workDate.addEventListener('change',()=>{if(workDate.validity.valid && workDate.value)renderWork()});
for(const [area,field] of [[workWins,'wins'],[workNext,'next']])area.addEventListener('input',()=>{
  const key=workDate.value;
  workData.notes[key]={...(workData.notes[key]||{}),[field]:area.value.slice(0,2000)};
  saveWork();
});
renderWork();
