const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'sailaStudyHub_v1';
let state = { user: null, todos: [], schedule: [], notes: [], targets: { semester: '', university: '' }, assignments: [] };
let isRegister = false;

function loadState(){
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); if(saved) state = {...state, ...saved}; }
  catch(error){ console.warn('Data lokal tidak dapat dibaca.', error); }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function escapeHTML(value=''){ return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function toast(message){ const el=$('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2600); }
function showApp(){ $('authPage').classList.add('hidden'); $('appPage').classList.remove('hidden'); renderAll(); }
function showAuth(){ $('appPage').classList.add('hidden'); $('authPage').classList.remove('hidden'); }

function renderAuthMode(){
  $('authHeading').textContent=isRegister?'Create your study space':'Open your study space';
  $('authButtonText').textContent=isRegister?'Create account':'Mari Mulai Belajar';
  $('switchAuth').innerHTML=isRegister?'Already have an account? <button type="button" id="toggleAuth">Sign in</button>':'New here? <button type="button" id="toggleAuth">Create an account</button>';
}
$('switchAuth').addEventListener('click',(event)=>{
  if(event.target && event.target.id==='toggleAuth'){isRegister=!isRegister;renderAuthMode();}
});
$('authForm').addEventListener('submit',(e)=>{
  e.preventDefault(); const email=$('authEmail').value.trim().toLowerCase(); const password=$('authPassword').value;
  if(password.length<8){toast('Password minimal 8 karakter.');return;}
  const existing=JSON.parse(localStorage.getItem('sailaDemoAccount')||'null');
  if(isRegister){ if(existing && existing.email===email){toast('Akun ini sudah terdaftar. Silakan masuk.');return;} localStorage.setItem('sailaDemoAccount',JSON.stringify({email,password})); toast('Akun berhasil dibuat!'); }
  else if(existing && (existing.email!==email || existing.password!==password)){toast('Email atau password demo tidak sesuai.');return;}
  state.user={email}; saveState(); showApp();
});
function googleNotice(){toast('Integrasi Google perlu konfigurasi OAuth dan Google Cloud terlebih dahulu.');}
$('googleAuth').addEventListener('click',googleNotice); $('googleCalendarBtn').addEventListener('click',googleNotice);
$('logoutBtn').addEventListener('click',()=>{showAuth();toast('Kamu sudah keluar dari study hub.');});

function updateClock(){const now=new Date();const time=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false}).format(now);const date=new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now);const longDate=new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now);$('topClock').textContent=time;$('bigClock').textContent=time;$('todayDate').textContent=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}).format(now).toUpperCase();$('fullDate').textContent=longDate;}
setInterval(updateClock,1000); updateClock();

$('todoForm').addEventListener('submit',(e)=>{e.preventDefault();const text=$('todoInput').value.trim();if(!text)return;state.todos.push({id:uid(),text,done:false});$('todoInput').value='';saveState();renderTodos();});
function toggleItem(collection,id){const item=state[collection].find(x=>x.id===id);if(item){item.done=!item.done;saveState();renderAll();}}
function deleteItem(collection,id){state[collection]=state[collection].filter(x=>x.id!==id);saveState();renderAll();}
function renderTodos(){const list=$('todoList');list.innerHTML='';state.todos.forEach(item=>{const li=document.createElement('li');li.className='task-item'+(item.done?' done':'');li.innerHTML=`<button class="task-check" aria-label="Tandai selesai">${item.done?'✓':''}</button><span class="task-text">${escapeHTML(item.text)}</span><button class="delete-btn" aria-label="Hapus">×</button>`;li.querySelector('.task-check').addEventListener('click',()=>toggleItem('todos',item.id));li.querySelector('.delete-btn').addEventListener('click',()=>deleteItem('todos',item.id));list.appendChild(li);});$('todoEmpty').classList.toggle('hidden',state.todos.length>0);const done=state.todos.filter(x=>x.done).length;$('todoCount').textContent=`${done}/${state.todos.length} done`;$('todayDone').textContent=done;updateProgress();}

const days=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
$('scheduleForm').addEventListener('submit',(e)=>{e.preventDefault();const day=$('scheduleDay').value,subject=$('scheduleSubject').value.trim(),start=$('scheduleStart').value,end=$('scheduleEnd').value;if(!subject)return;if(start>=end){toast('Waktu selesai harus setelah waktu mulai.');return;}state.schedule.push({id:uid(),day,subject,start,end});saveState();$('scheduleSubject').value='';renderSchedule();toast('Jadwal belajar berhasil ditambahkan.');});
function renderSchedule(){const root=$('weekSchedule');root.innerHTML='';days.forEach(day=>{const events=state.schedule.filter(x=>x.day===day).sort((a,b)=>a.start.localeCompare(b.start));const row=document.createElement('div');row.className='day-row';const short=day.slice(0,3).toUpperCase();row.innerHTML=`<div class="day-name"><small>${short}</small><b>${day}</b></div><div class="day-events">${events.length?events.map(x=>`<span class="event-chip">${escapeHTML(x.start)}–${escapeHTML(x.end)} · ${escapeHTML(x.subject)} <button data-id="${x.id}" aria-label="Hapus jadwal">×</button></span>`).join(''):'<span class="soft-space">a soft space for you</span>'}</div>`;row.querySelectorAll('button[data-id]').forEach(btn=>btn.addEventListener('click',()=>{state.schedule=state.schedule.filter(x=>x.id!==btn.dataset.id);saveState();renderSchedule();}));root.appendChild(row);});}

$('noteForm').addEventListener('submit',(e)=>{e.preventDefault();const title=$('noteTitle').value.trim(),content=$('noteContent').value.trim();if(!title||!content)return;state.notes.unshift({id:uid(),title,content,updated:new Date().toISOString()});saveState();$('noteTitle').value='';$('noteContent').value='';renderNotes();toast('Catatan tersimpan otomatis di perangkat ini ♡');});
function renderNotes(){const root=$('notesList');root.innerHTML='';state.notes.forEach(note=>{const card=document.createElement('article');card.className='note-card';card.innerHTML=`<h4>${escapeHTML(note.title)}</h4><p>${escapeHTML(note.content)}</p><div class="note-tools"><button>Delete note ×</button></div>`;card.querySelector('button').addEventListener('click',()=>{if(confirm('Hapus catatan ini?')){state.notes=state.notes.filter(x=>x.id!==note.id);saveState();renderNotes();}});root.appendChild(card);});$('notesEmpty').classList.toggle('hidden',state.notes.length>0);}
$('targetForm').addEventListener('submit',(e)=>{e.preventDefault();state.targets={semester:$('semesterTarget').value,university:$('universityTarget').value};saveState();$('targetSaved').textContent='Targets saved on this device ♡';toast('Target Saila berhasil disimpan.');});

$('assignmentForm').addEventListener('submit',(e)=>{e.preventDefault();const name=$('assignmentName').value.trim();if(!name)return;state.assignments.push({id:uid(),name,date:$('assignmentDate').value,done:false});$('assignmentName').value='';$('assignmentDate').value='';saveState();renderAssignments();});
function renderAssignments(){const root=$('assignmentList');root.innerHTML='';state.assignments.forEach(item=>{const li=document.createElement('li');li.className='task-item assignment-item'+(item.done?' done':'');const date=item.date?new Date(item.date+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}):'No deadline';li.innerHTML=`<button class="task-check" aria-label="Tandai selesai">${item.done?'✓':''}</button><span class="task-text"><span>${escapeHTML(item.name)}</span><small class="assignment-meta">Deadline: ${date}</small></span><button class="delete-btn" aria-label="Hapus">×</button>`;li.querySelector('.task-check').addEventListener('click',()=>toggleItem('assignments',item.id));li.querySelector('.delete-btn').addEventListener('click',()=>deleteItem('assignments',item.id));root.appendChild(li);});$('assignmentEmpty').classList.toggle('hidden',state.assignments.length>0);$('assignmentDone').textContent=state.assignments.filter(x=>x.done).length;updateProgress();}
function updateProgress(){const all=state.todos.length+state.assignments.length;const done=state.todos.filter(x=>x.done).length+state.assignments.filter(x=>x.done).length;$('sideProgress').style.width=(all?done/all*100:0)+'%';}
function renderAll(){updateClock();renderTodos();renderSchedule();renderNotes();renderAssignments();$('semesterTarget').value=state.targets.semester||'';$('universityTarget').value=state.targets.university||'';}

document.querySelectorAll('.nav-link').forEach(link=>link.addEventListener('click',()=>{document.querySelectorAll('.nav-link').forEach(x=>x.classList.remove('active'));link.classList.add('active');}));
loadState();
if(state.user){showApp();}else{showAuth();}
