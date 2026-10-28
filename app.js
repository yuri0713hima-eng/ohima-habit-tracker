import { habits, dateKey, parseDate, weekDates, countDone, validRecords, cumulativeDays, weekProgress } from './habits.mjs';

const storageKey = 'ohima-habits-v1';
let displayMonth = dateKey(new Date()).slice(0,7);
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
  renderExtras();
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
  const isStudy=button.dataset.tab==='study';
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===button)));
  document.querySelector('#habit-view').hidden=isWork || isStudy;
  document.querySelector('#work-view').hidden=!isWork;
  document.querySelector('#study-view').hidden=!isStudy;
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


/* Garden, month calendar and reports are read-only views of existing habit records. */
function monthKeys(ym) {
  const [y,m]=ym.split('-').map(Number);
  const last=new Date(y,m,0).getDate();
  return Array.from({length:last},(_,i)=>ym+'-'+String(i+1).padStart(2,'0'));
}
function shiftMonth(ym,delta) {
  const [y,m]=ym.split('-').map(Number);
  const d=new Date(y,m-1+delta,1);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
}
function monthStats(ym) {
  const today=dateKey(new Date());
  const days=monthKeys(ym).filter(k=>k<=today);
  return habits.map(h=>({habit:h,days:days.filter(k=>records[k]?.[h.id]===true).length}));
}
function renderExtras() {
  const today=dateKey(new Date());
  const selected=dateInput.value;
  const total=habits.map(h=>({habit:h,count:cumulativeDays(records,h.id,selected)}));
  const garden=document.querySelector('#garden-plants');
  garden.replaceChildren();
  const plantIcons=['🌿','💜','🌼'];
  total.forEach(({habit,count},idx)=>{
    const item=document.createElement('div');item.className='garden-plant';
    const visual=document.createElement('div');visual.className='garden-visual';
    // Show a small garden, not hundreds of nodes for long-term use.
    const shown=Math.min(count,12);
    visual.textContent=shown?Array.from({length:shown},(_,i)=>plantIcons[idx]).join(' '):'🌱';
    const label=document.createElement('strong');label.textContent=habit.name+' · 累計'+count+'日';
    item.append(visual,label);garden.append(item);
  });
  document.querySelector('#garden-caption').textContent='これまでの「できた」が、お庭を育てるよ。累計 '+total.reduce((s,x)=>s+x.count,0)+' 回の小さな一歩 🌷';
  const todayMonth=today.slice(0,7);
  document.querySelector('#month-next').disabled=displayMonth>=todayMonth;
  const [year,month]=displayMonth.split('-').map(Number);
  document.querySelector('#month-label').textContent=year+'年'+month+'月';
  const grid=document.querySelector('#month-grid');
  grid.replaceChildren();
  for(const d of ['月','火','水','木','金','土','日']){
    const span=document.createElement('span');span.className='month-weekday';span.textContent=d;grid.append(span);
  }
  const firstWeekday=(new Date(year,month-1,1).getDay()+6)%7;
  for(let i=0;i<firstWeekday;i++){const blank=document.createElement('span');blank.className='month-blank';grid.append(blank);}
  for(const key of monthKeys(displayMonth)){
    const value=countDone(records,key);
    const btn=document.createElement('button');btn.type='button';
    btn.className='month-day'+(key===selected?' is-selected':'')+(key===today?' is-today':'');
    btn.disabled=key>today;
    const num=document.createElement('strong');num.textContent=String(Number(key.slice(-2)));
    const flowers=document.createElement('span');flowers.className='month-symbols';
    flowers.textContent=habits.filter(h=>records[key]?.[h.id]===true).map(h=>({gym:'🌱',study:'💜',reading:'📖'})[h.id]).join('') || '·';
    btn.setAttribute('aria-label',key+' '+value+'件達成');
    btn.append(num,flowers);
    btn.addEventListener('click',()=>{dateInput.value=key;render();document.querySelector('.dashboard').scrollIntoView({behavior:'smooth',block:'start'});});
    grid.append(btn);
  }
  const stats=monthStats(displayMonth);
  const previous=monthStats(shiftMonth(displayMonth,-1));
  const report=document.querySelector('#growth-report');report.replaceChildren();
  stats.forEach(({habit,days},i)=>{
    const row=document.createElement('div');row.className='growth-item';
    const head=document.createElement('div');head.className='growth-top';
    const name=document.createElement('span');name.textContent=habit.name;
    const value=document.createElement('strong');value.textContent=days+'日';
    head.append(name,value);
    const track=document.createElement('div');track.className='growth-track';
    const fill=document.createElement('div');fill.className='growth-fill '+habit.color;
    fill.style.width=(days/monthKeys(displayMonth).length*100)+'%';track.append(fill);
    const previousLabel=document.createElement('p');previousLabel.textContent='先月 '+previous[i].days+'日 · 今月 '+days+'日';
    row.append(head,track,previousLabel);report.append(row);
  });
  const sum=stats.reduce((n,s)=>n+s.days,0);
  document.querySelector('#report-caption').textContent=displayMonth+' の達成回数は合計 '+sum+' 回。頑張った日は、全部宝物だよ ✨';
}
document.querySelector('#month-prev').addEventListener('click',()=>{displayMonth=shiftMonth(displayMonth,-1);renderExtras();});
document.querySelector('#month-next').addEventListener('click',()=>{if(displayMonth<dateKey(new Date()).slice(0,7)){displayMonth=shiftMonth(displayMonth,1);renderExtras();}});



/* Study notebook: a separate key preserves all old habit and work records. */
const studyStorageKey='ohima-study-v1';
const studyDate=document.querySelector('#study-date');
let studyRecords=[];
let studyError=false;
try {const raw=JSON.parse(localStorage.getItem(studyStorageKey));if(Array.isArray(raw))studyRecords=raw.filter(x=>x&&typeof x==='object'&&/^\d{4}-\d{2}-\d{2}$/.test(x.day||'')&&typeof x.book==='string').slice(0,3000);}catch{studyError=true}
studyDate.value=dateKey(new Date());
function saveStudy(){
  try{localStorage.setItem(studyStorageKey,JSON.stringify(studyRecords));studyError=false;}
  catch{studyError=true;}
  document.querySelector('#study-save-status').textContent=studyError?'保存に失敗しました。記録を別の場所に控えてください。':'勉強記録をこのブラウザに保存しました。';
}
function studyCard(item,allowDelete){
  const div=document.createElement('article');div.className='study-entry';
  const head=document.createElement('div');head.className='study-entry-head';
  const name=document.createElement('strong');name.textContent=item.book;
  const info=document.createElement('span');info.textContent=item.day+' · '+(item.minutes==null?'時間未記録':item.minutes+'分');
  head.append(name,info);
  const scope=document.createElement('p');scope.textContent=item.scope;
  div.append(head,scope);
  if(item.note){const note=document.createElement('p');note.className='study-hint';note.textContent=item.note;div.append(note);}
  const bottom=document.createElement('div');bottom.className='study-entry-bottom';
  const label=document.createElement('label');label.className='study-check';
  const check=document.createElement('input');check.type='checkbox';check.checked=item.review===true;
  check.addEventListener('change',()=>{item.review=check.checked;saveStudy();renderStudy();});
  label.append(check,document.createTextNode(' 復習する'));bottom.append(label);
  if(allowDelete){const del=document.createElement('button');del.type='button';del.textContent='削除';del.addEventListener('click',()=>{if(!confirm('この学習記録を削除する？'))return;studyRecords=studyRecords.filter(x=>x!==item);saveStudy();renderStudy();});bottom.append(del);}
  div.append(bottom);return div;
}
function renderStudy(){
  const day=studyDate.value;
  const items=studyRecords.filter(x=>x.day===day);
  const minutes=items.reduce((sum,x)=>sum+(x.minutes==null?0:Number(x.minutes)||0),0);
  document.querySelector('#study-summary').textContent=day+' · '+items.length+'件 · 合計'+minutes+'分の学習 🌱';
  const list=document.querySelector('#study-items');list.replaceChildren();
  if(!items.length){const p=document.createElement('p');p.className='study-hint';p.textContent='まだ記録はないよ。今日の一歩を残してみよう！';list.append(p);}
  items.slice().reverse().forEach(x=>list.append(studyCard(x,true)));
  const review=document.querySelector('#study-review-items');review.replaceChildren();
  const pending=studyRecords.filter(x=>x.review===true).sort((a,b)=>b.day.localeCompare(a.day));
  if(!pending.length){const p=document.createElement('p');p.className='study-hint';p.textContent='復習マークを付けた内容がここに並ぶよ。';review.append(p);}
  pending.forEach(x=>review.append(studyCard(x,false)));
  document.querySelector('#study-save-status').textContent=studyError?'保存に失敗しました。':'勉強記録はこのブラウザに保存されます。';
}
studyDate.addEventListener('change',renderStudy);
document.querySelector('#study-form').addEventListener('submit',e=>{
  e.preventDefault();
  const scope=document.querySelector('#study-scope').value.trim();
  if(!scope)return;
  studyRecords.push({id:Date.now()+'-'+Math.random().toString(36).slice(2),day:studyDate.value,book:document.querySelector('#study-book').value,scope:scope.slice(0,160),minutes:Math.max(0,Math.min(600,Number(document.querySelector('#study-minutes').value)||0)),note:document.querySelector('#study-note').value.slice(0,1500),review:document.querySelector('#study-review').checked});
  saveStudy();renderStudy();
  document.querySelector('#study-scope').value='';
  document.querySelector('#study-note').value='';
  document.querySelector('#study-review').checked=false;
});
document.querySelector('#study-export').addEventListener('click',()=>{
  const payload={exportedAt:new Date().toISOString(),habits:localStorage.getItem(storageKey),work:localStorage.getItem(workStorageKey),study:localStorage.getItem(studyStorageKey)};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ohima-backup-'+dateKey(new Date())+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
});
renderStudy();


document.querySelector('#study-import').addEventListener('change',async event=>{
 const file=event.target.files?.[0];if(!file)return;
 const status=document.querySelector('#study-import-status');
 try{
   if(file.size>2_000_000)throw Error('ファイルが大きすぎます。');
   const parsed=JSON.parse(await file.text());
   if(!Array.isArray(parsed)||parsed.length>3000)throw Error('指定された移行形式ではありません。');
   const incoming=parsed.map(x=>{
     if(!x||typeof x!=='object'||!/^\d{4}-\d{2}-\d{2}$/.test(x.day||'')||typeof x.book!=='string'||typeof x.scope!=='string'||typeof x.id!=='string'||!x.id.startsWith('notion-'))throw Error('移行データの形式が正しくありません。');
     return {id:x.id.slice(0,120),day:x.day,book:x.book.slice(0,120),scope:x.scope.slice(0,160),minutes:x.minutes===null?null:Math.max(0,Math.min(600,Number(x.minutes)||0)),note:String(x.note||'').slice(0,1500),review:x.review===true};
   });
   const existing=new Set(studyRecords.map(x=>x.id));
   const additions=incoming.filter(x=>!existing.has(x.id));
   const merged=studyRecords.concat(additions);
   localStorage.setItem(studyStorageKey,JSON.stringify(merged));
   studyRecords=merged;studyError=false;renderStudy();
   status.textContent=additions.length+'件の過去の記録を追加したよ 🌷（すでにあった'+(incoming.length-additions.length)+'件は重複を防止）';
 }catch(err){status.textContent='読み込めませんでした。記録は変更していません。 '+err.message;}
 event.target.value='';
});
