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
  const isOther=button.dataset.tab==='other';
  document.querySelectorAll('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b===button)));
  document.querySelector('#habit-view').hidden=isWork || isStudy || isOther;
  document.querySelector('#work-view').hidden=!isWork;
  document.querySelector('#study-view').hidden=!isStudy;
  document.querySelector('#other-view').hidden=!isOther;
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
  const edit=document.createElement('button');edit.type='button';edit.textContent='編集';edit.className='study-edit-button';
  edit.addEventListener('click',()=>{
    if(div.querySelector('.study-edit-form'))return;
    const form=document.createElement('form');form.className='study-edit-form';
    const makeField=(title,control)=>{
      const label=document.createElement('label');label.textContent=title;label.append(control);form.append(label);return control;
    };
    const date=makeField('日付',document.createElement('input'));date.type='date';date.value=item.day;date.required=true;
    const book=makeField('教材',document.createElement('input'));book.type='text';book.maxLength=120;book.value=item.book;book.required=true;
    const content=makeField('学習範囲・内容',document.createElement('input'));content.type='text';content.maxLength=160;content.value=item.scope;content.required=true;
    const mins=makeField('勉強時間（分）',document.createElement('input'));mins.type='number';mins.min='0';mins.max='600';mins.placeholder='未記録';mins.value=item.minutes==null?'':String(item.minutes);
    const memo=makeField('メモ・気づいたこと',document.createElement('textarea'));memo.maxLength=1500;memo.rows=4;memo.value=item.note||'';
    const controls=document.createElement('div');controls.className='study-edit-actions';
    const cancel=document.createElement('button');cancel.type='button';cancel.textContent='キャンセル';cancel.addEventListener('click',()=>form.remove());
    const submit=document.createElement('button');submit.type='submit';submit.textContent='変更を保存';submit.className='study-submit';
    controls.append(cancel,submit);form.append(controls);
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const nextDate=date.value;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(nextDate)||!book.value.trim()||!content.value.trim()){alert('日付・教材・学習内容を確認してね。');return;}
      const old={day:item.day,book:item.book,scope:item.scope,minutes:item.minutes,note:item.note};
      Object.assign(item,{day:nextDate,book:book.value.trim().slice(0,120),scope:content.value.trim().slice(0,160),minutes:mins.value===''?null:Number(mins.value),note:memo.value.slice(0,1500)});
      saveStudy();
      if(studyError){Object.assign(item,old);alert('保存できませんでした。変更前の内容はそのままです。');return;}
      renderStudy();
    });
    div.append(form);form.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
  bottom.append(edit);
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
  const history=document.querySelector('#study-history');
  history.replaceChildren();
  const allEntries=studyRecords.slice().sort((a,b)=>b.day.localeCompare(a.day));
  document.querySelector('#study-history-count').textContent=allEntries.length+'件の記録を保存中（Notionからの移行 '+allEntries.filter(x=>String(x.id).startsWith('notion-')).length+'件）';
  if(!allEntries.length){const p=document.createElement('p');p.className='study-hint';p.textContent='まだ記録がないよ。Notionのファイルを取り込むとここに表示されるよ。';history.append(p);}
  allEntries.forEach(x=>history.append(studyCard(x,false)));
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
const backupKeys={habits:storageKey,work:workStorageKey,study:studyStorageKey,meetings:'ohima-meetings-v1',review:'ohima-review-progress-v1'};
document.querySelector('#study-export').addEventListener('click',()=>{
 const payload={format:'ohima-backup-v2',exportedAt:new Date().toISOString()};
 for(const [label,key] of Object.entries(backupKeys))payload[label]=localStorage.getItem(key);
 if(Object.entries(backupKeys).every(([,key])=>localStorage.getItem(key)===null)){alert('この画面には保存された記録が見つからなかったよ。普段使っているホーム画面のアプリから開いてね。');return;}
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ohima-backup-'+dateKey(new Date())+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 document.querySelector('#backup-status').textContent='バックアップを作ったよ。ファイルを「ファイル」アプリに保存してね。';
});
document.querySelector('#backup-import').addEventListener('change',async event=>{
 const input=event.target,status=document.querySelector('#backup-status');const file=input.files?.[0];if(!file)return;
 try{
  if(file.size>3000000)throw Error('ファイルが大きすぎます。');
  const data=JSON.parse(await file.text());
  if(!data||typeof data!=='object'||Array.isArray(data))throw Error('形式が正しくありません。');
  const parsed={};
  for(const [label,key] of Object.entries(backupKeys)){
   if(data[label]===undefined||data[label]===null)continue;
   if(typeof data[label]!=='string')throw Error(label+'のデータ形式が違います。');
   const val=JSON.parse(data[label]);if(!val||typeof val!=='object'||Array.isArray(val)&&!['study','meetings'].includes(label))throw Error(label+'の構造が違います。');
   if(['study','meetings'].includes(label)&&!Array.isArray(val))throw Error(label+'の構造が違います。');
   parsed[label]=val;
  }
  const labels={habits:'習慣',work:'仕事',study:'勉強',meetings:'会議',review:'復習'};
  const counts=Object.entries(parsed).map(([label,val])=>labels[label]+': '+(Array.isArray(val)?val.length:label==='work'?(val.tasks?.length||0)+'件の仕事＋メモ':Object.keys(val).length)+'件');
  if(!counts.length)throw Error('このファイルには復元できる記録がありません。');
  if(!confirm('復元する内容：\\n'+counts.join('\\n')+'\\n\\n今の記録は残し、追加・不足分の補完を行います。復元する？')){status.textContent='復元をキャンセルしたよ。';return;}
  const updates={};
  for(const [label,incoming] of Object.entries(parsed)){
   const key=backupKeys[label];let current;
   try{current=JSON.parse(localStorage.getItem(key));}catch{}
   if(label==='study'||label==='meetings'){
    const old=Array.isArray(current)?current:[];
    const ids=new Set(old.map(x=>String(x.id||'')));
    updates[key]=JSON.stringify(old.concat(incoming.filter(x=>x&&typeof x==='object'&&typeof x.id==='string'&&!ids.has(x.id)&&ids.add(x.id))));
   }else if(label==='habits'){
    updates[key]=JSON.stringify({...incoming,...(current&&typeof current==='object'&&!Array.isArray(current)?current:{})});
   }else if(label==='work'){
    const old=current&&typeof current==='object'&&!Array.isArray(current)?current:{};
    const oldTasks=Array.isArray(old.tasks)?old.tasks:[];
    const incomingTasks=Array.isArray(incoming.tasks)?incoming.tasks:[];
    const ids=new Set(oldTasks.map(x=>String(x.id||'')));
    updates[key]=JSON.stringify({...incoming,...old,tasks:oldTasks.concat(incomingTasks.filter(x=>x&&typeof x.id==='string'&&!ids.has(x.id)&&ids.add(x.id))),notes:{...(incoming.notes||{}),...(old.notes||{})}});
   }else{
    updates[key]=JSON.stringify({...incoming,...(current&&typeof current==='object'&&!Array.isArray(current)?current:{})});
   }
  }
  // Preflight storage capacity before applying. Roll back values on write error.
  const previous=Object.fromEntries(Object.keys(updates).map(key=>[key,localStorage.getItem(key)]));
  try{for(const [key,value] of Object.entries(updates))localStorage.setItem(key,value);}
  catch(err){for(const [key,value] of Object.entries(previous)){try{if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}catch{}}throw Error('保存容量などの問題で復元に失敗しました。');}
  status.textContent='復元できたよ！画面を更新して記録を確認してね 🌷';
  alert('復元できたよ！ページを再読み込みすると全データが表示されるよ。');
 }catch(err){status.textContent='復元できませんでした：'+err.message;}
 finally{input.value='';}
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
   document.querySelector('#study-history-section').scrollIntoView({behavior:'smooth',block:'start'});
 }catch(err){status.textContent='読み込めませんでした。記録は変更していません。 '+err.message;}
 event.target.value='';
});


const studyWeaknesses=[
 {title:'銀フレ｜意味・スペルが混同しやすい単語',detail:'recognize / definitely / specific / appropriate / outstanding / decline / renovate',task:'英文の中で意味を言う → 英単語を自力で書く（7語）',days:'10/13〜10/26に繰り返し登場'},
 {title:'英文法｜比較級・最上級',detail:'as ... as / any other＋単数 / three times as ... as / much＋比較級 / little→less→least',task:'短い英作文を4問。theの付け忘れにも注意',days:'10/15〜10/21の演習で課題'},
 {title:'英文法｜時制と過去完了',detail:'had had と had been having / had eaten と had been eating / 過去形と過去進行形',task:'2つの英文の違いを説明する練習を4問',days:'9/2、10/12〜10/14のメモ'},
 {title:'英文法｜受動態・前置詞',detail:'受動態のby / to / for、SVOOの受け身、前置詞付きの受け身',task:'Lesson22〜23の間違えた箇所を3〜4問復習',days:'10/22〜10/24のメモ'},
 {title:'リスニング｜短い音のつながり',detail:'destination / vehicle / tires と tired / these tires / to the third / usual room',task:'公式問題集11 Part2 7〜9番を英文を見ずに聞く',days:'10/27のPart2復習メモ'}
];

const reviewProgressKey='ohima-review-progress-v1';
let reviewProgress={};
try{const saved=JSON.parse(localStorage.getItem(reviewProgressKey));if(saved&&typeof saved==='object'&&!Array.isArray(saved))reviewProgress=saved;}catch{}
const reviewQuestions=[
 [
  ['「認識する」は？',['recognize','renovate','reputation'],0],
  ['「間違いなく」は？',['specific','definitely','decline'],1],
  ['「適切な」は？',['appropriate','outstanding','particular'],0]
 ],
 [
  ['This car is ___ faster than mine.',['many','much','most'],1],
  ['He is taller than any other ___ in the class.',['boy','boys','boyes'],0],
  ['little の比較級は？',['least','less','lesser'],1]
 ],
 [
  ['I ___ dinner before she arrived.',['had eaten','have eat','had eating'],0],
  ['I ___ for an hour when it rained.',['had been walking','have walked','had been walk'],0],
  ['「私はその本を持っていた」過去完了形は？',['I had been having the book','I had had the book','I have had book'],1]
 ],
 [
  ['The letter was written ___ Ken.',['to','for','by'],2],
  ['She was given a gift ___ her friend.',['by','to','at'],0],
  ['A gift was given ___ her.',['by','to','for'],1]
 ]
];
function storeReviewProgress(){try{localStorage.setItem(reviewProgressKey,JSON.stringify(reviewProgress));}catch{alert('復習の結果を保存できませんでした。ブラウザの空き容量を確認してね。');}}
function renderWeaknessAnalysis(){
 const target=document.querySelector('#study-analysis');
 const cleared=document.querySelector('#study-cleared-list');
 target.replaceChildren();cleared.replaceChildren();
 let completed=0;
 studyWeaknesses.forEach((w,i)=>{
  const prog=reviewProgress[i]||{passes:[]};
  const passes=Array.isArray(prog.passes)?prog.passes:[];
  const done=prog.done===true;
  if(done)completed++;
  const card=document.createElement('article');card.className='study-entry';
  const h=document.createElement('strong');h.textContent=w.title;
  const detail=document.createElement('p');detail.textContent=w.detail;
  const task=document.createElement('p');task.textContent='🎯 '+w.task;
  const src=document.createElement('p');src.className='study-hint';src.textContent='根拠：Notion '+w.days;
  card.append(h,detail,task,src);
  const status=document.createElement('p');status.className='study-hint';status.textContent=done?'🌸 復習クリア！':i===4?'音声の聞き取りが必要なため、チャットで確認後にクリアにしてね。':'確認テスト全問正解 '+Math.min(2,passes.length)+'/2日';card.append(status);
  if(done){
    const undo=document.createElement('button');undo.type='button';undo.className='study-back';undo.textContent='もう一度復習する';
    undo.addEventListener('click',()=>{reviewProgress[i]={passes:[],done:false};storeReviewProgress();renderWeaknessAnalysis();});
    card.append(undo);cleared.append(card);return;
  }
  if(i===4){
   const button=document.createElement('button');button.type='button';button.className='study-back';button.textContent='ちゃっぴーと音声復習ができたのでクリア';
   button.addEventListener('click',()=>{if(!confirm('実際の音声で聞き取れることを確認した？'))return;reviewProgress[i]={passes:[],done:true};storeReviewProgress();renderWeaknessAnalysis();});
   card.append(button);target.append(card);return;
  }
  const details=document.createElement('details');details.className='review-quiz';
  const summary=document.createElement('summary');summary.textContent='✏️ 3問の確認テストを受ける';details.append(summary);
  const form=document.createElement('form');form.className='review-quiz-form';
  reviewQuestions[i].forEach((q,qi)=>{
    const field=document.createElement('fieldset');const legend=document.createElement('legend');legend.textContent=(qi+1)+'. '+q[0];field.append(legend);
    q[1].forEach((answer,ai)=>{
      const label=document.createElement('label');const radio=document.createElement('input');radio.type='radio';radio.name='review-'+i+'-'+qi;radio.value=String(ai);radio.required=true;
      label.append(radio,document.createTextNode(' '+answer));field.append(label);
    });form.append(field);
  });
  const submit=document.createElement('button');submit.type='submit';submit.className='study-submit';submit.textContent='採点する';form.append(submit);
  const output=document.createElement('p');output.className='study-hint';output.setAttribute('role','status');form.append(output);
  form.addEventListener('submit',ev=>{
    ev.preventDefault();const answers=reviewQuestions[i].map((q,qi)=>Number(new FormData(form).get('review-'+i+'-'+qi)));
    const correct=answers.filter((a,qi)=>a===reviewQuestions[i][qi][2]).length;
    if(correct<3){output.textContent=correct+'/3 正解。間違えた問題を見直して、もう一度挑戦しよう！';return;}
    const today=dateKey(new Date());
    const state=reviewProgress[i]||{passes:[]};const previous=Array.isArray(state.passes)?state.passes:[];
    if(previous.includes(today)){output.textContent='3/3 正解！今日の合格は記録済み。別の日にもう一度満点を取ろう 🌱';return;}
    const next=[...previous,today];reviewProgress[i]={passes:next,done:next.length>=2};storeReviewProgress();renderWeaknessAnalysis();
    alert(next.length>=2?'🌸 2日間満点！復習クリア、おめでとう！':'🌱 全問正解！別の日にもう一度満点でクリアだよ。');
  });
  details.append(form);card.append(details);target.append(card);
 });
 document.querySelector('#study-cleared-count').textContent='('+completed+'件)';
 if(!completed){const msg=document.createElement('p');msg.className='study-hint';msg.textContent='まだクリアした項目はないよ。少しずつ増やそう 🌱';cleared.append(msg);}
}

renderWeaknessAnalysis();
const studyView=document.querySelector('#study-view');
document.querySelector('#study-history-open').addEventListener('click',()=>{
 studyView.classList.add('history-open');
 document.querySelector('#study-history-section').hidden=false;
 document.querySelector('#study-history-section').scrollIntoView({behavior:'smooth',block:'start'});
});
document.querySelector('#study-history-back').addEventListener('click',()=>{
 studyView.classList.remove('history-open');
 document.querySelector('#study-history-section').hidden=true;
 studyView.scrollIntoView({behavior:'smooth',block:'start'});
});


/* Monthly meeting notebooks: separate key, never overwrite habit/work/study data. */
const meetingKey='ohima-meetings-v1';
let meetingNotes=[];
try{const saved=JSON.parse(localStorage.getItem(meetingKey));if(Array.isArray(saved))meetingNotes=saved.filter(x=>x&&typeof x.text==='string'&&/^\d{4}-\d{2}$/.test(x.month||'')&&['staff','menu'].includes(x.type)).slice(0,3000)}catch{}
const meetingType=document.querySelector('#meeting-type');
const meetingMonth=document.querySelector('#meeting-month');
meetingMonth.value=dateKey(new Date()).slice(0,7);
const meetingInput=document.querySelector('#meeting-input');
const meetingStatus=document.querySelector('#meeting-status');
function saveMeeting(){
 try{localStorage.setItem(meetingKey,JSON.stringify(meetingNotes));meetingStatus.textContent='会議メモを保存したよ 🌷';return true;}
 catch{meetingStatus.textContent='保存できませんでした。大切なメモはコピーして控えてね。';return false;}
}
function meetingText(){
 const type=meetingType.value,month=meetingMonth.value;
 const notes=meetingNotes.filter(x=>x.type===type&&x.month===month);
 const header=(type==='staff'?'職員会議':'献立会議')+'｜'+month.replace('-','年')+'月';
 const lines=[header,'','【共有・相談したいこと】'];
 notes.forEach((x,i)=>lines.push((i+1)+'. '+x.text.trim().replace(/\n/g,'\n   ')));
 if(!notes.length)lines.push('（まだメモがありません）');
 lines.push('','【会議で決まったこと・確認事項】','','【次にすること】','');
 return lines.join('\n');
}
function renderMeeting(){
 const type=meetingType.value,month=meetingMonth.value;
 const entries=meetingNotes.filter(x=>x.type===type&&x.month===month);
 document.querySelector('#meeting-count').textContent=entries.length+'件';
 const list=document.querySelector('#meeting-list');list.replaceChildren();
 if(!entries.length){const p=document.createElement('p');p.className='meeting-help';p.textContent='この月のメモはまだないよ。会議前に思いついたことを残そう！';list.append(p)}
 entries.forEach(x=>{
  const item=document.createElement('article');item.className='meeting-entry';
  const date=document.createElement('small');date.textContent=x.created||'';
  const body=document.createElement('p');body.textContent=x.text;
  const edit=document.createElement('button');edit.type='button';edit.textContent='編集';
  edit.addEventListener('click',()=>{const next=prompt('メモを編集',x.text);if(next===null)return;const trimmed=next.trim().slice(0,2000);if(!trimmed)return;const old=x.text;x.text=trimmed;if(!saveMeeting())x.text=old;renderMeeting();});
  const del=document.createElement('button');del.type='button';del.textContent='削除';
  del.addEventListener('click',()=>{if(!confirm('この会議メモを削除する？'))return;const old=meetingNotes;meetingNotes=old.filter(n=>n!==x);if(!saveMeeting())meetingNotes=old;renderMeeting();});
  const actions=document.createElement('div');actions.className='meeting-actions';actions.append(edit,del);item.append(date,body,actions);list.append(item);
 });
 document.querySelector('#meeting-output').value=meetingText();
}
document.querySelector('#meeting-add').addEventListener('submit',e=>{
 e.preventDefault();const text=meetingInput.value.trim();if(!text||!meetingMonth.value)return;
 const entry={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),type:meetingType.value,month:meetingMonth.value,text:text.slice(0,2000),created:dateKey(new Date())};
 meetingNotes.push(entry);
 if(saveMeeting())meetingInput.value='';else meetingNotes.pop();
 renderMeeting();
});
meetingType.addEventListener('change',renderMeeting);
meetingMonth.addEventListener('change',renderMeeting);
document.querySelector('#meeting-copy').addEventListener('click',async()=>{
 const value=meetingText();
 try{await navigator.clipboard.writeText(value);meetingStatus.textContent='会議用のまとめをコピーしたよ 🌷';}
 catch{const el=document.querySelector('#meeting-output');el.focus();el.select();meetingStatus.textContent='コピーができなかったので、選択された文章を長押しでコピーしてね。';}
});
renderMeeting();

document.querySelector('#force-refresh')?.addEventListener('click',()=>{
 const next=new URL('./index.html',location.href);
 next.searchParams.set('refresh',String(Date.now()));
 location.replace(next.href);
});
