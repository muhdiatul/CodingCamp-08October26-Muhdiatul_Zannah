// =============================================
//  CLOCK
// =============================================
const DAYS   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni',
                'Juli','Agustus','September','Oktober','November','Desember'];

function updateClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2, '0');
  const m    = String(now.getMinutes()).padStart(2, '0');
  const s    = String(now.getSeconds()).padStart(2, '0');

  document.getElementById('time').textContent = `${h}:${m}:${s}`;

  const dayName  = DAYS[now.getDay()];
  const date     = now.getDate();
  const month    = MONTHS[now.getMonth()];
  const year     = now.getFullYear();
  document.getElementById('date-display').textContent =
    `${dayName}, ${date} ${month} ${year}`;

  const hour = now.getHours();
  let greet;
  if      (hour <  5) greet = '🌙 Selamat tengah malam!';
  else if (hour < 11) greet = '🌅 Selamat pagi!';
  else if (hour < 15) greet = '☀️ Selamat siang!';
  else if (hour < 18) greet = '🌤 Selamat sore!';
  else                greet = '🌙 Selamat malam!';
  document.getElementById('greeting').textContent = greet;
}

setInterval(updateClock, 1000);
updateClock();


// =============================================
//  TO-DO LIST
// =============================================
let todos      = JSON.parse(localStorage.getItem('todos') || '[]');
let todoFilter = 'all';

function saveTodos() {
  localStorage.setItem('todos', JSON.stringify(todos));
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function priorityLabel(p) {
  const map = { high: '🔴 Tinggi', medium: '⚡ Sedang', low: '🟢 Rendah' };
  return map[p] || p;
}

function renderTodos() {
  const list = document.getElementById('todo-list');

  // Apply filter
  const visible = todos.filter(t => {
    if (todoFilter === 'active') return !t.done;
    if (todoFilter === 'done')   return  t.done;
    return true;
  });

  if (visible.length === 0) {
    list.innerHTML = '<div class="todo-empty">Tidak ada tugas di sini 🎉</div>';
  } else {
    list.innerHTML = visible.map(t => `
      <li class="todo-item${t.done ? ' done' : ''}" data-id="${t.id}">
        <div class="todo-check" onclick="toggleTodo(${t.id})"></div>
        <span class="todo-text">${escHtml(t.text)}</span>
        <span class="todo-priority priority-${t.priority}">${priorityLabel(t.priority)}</span>
        <button class="todo-delete" onclick="deleteTodo(${t.id})" title="Hapus">✕</button>
      </li>
    `).join('');
  }

  // Update counters
  const done = todos.filter(t => t.done).length;
  document.getElementById('done-count').textContent = done;
  document.getElementById('left-count').textContent = todos.length - done;
}

function addTodo() {
  const input    = document.getElementById('todo-input');
  const text     = input.value.trim();
  if (!text) { input.focus(); return; }

  const priority = document.getElementById('priority-select').value;
  todos.unshift({ id: Date.now(), text, done: false, priority });
  saveTodos();
  renderTodos();
  input.value = '';
  input.focus();
  showToast('✅ Tugas ditambahkan!');
}

function toggleTodo(id) {
  const task = todos.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTodos();
    renderTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
  showToast('🗑 Tugas dihapus');
}

function clearDone() {
  const count = todos.filter(t => t.done).length;
  if (!count) { showToast('Tidak ada tugas selesai.'); return; }
  todos = todos.filter(t => !t.done);
  saveTodos();
  renderTodos();
  showToast(`🗑 ${count} tugas selesai dihapus`);
}

function setFilter(f, btn) {
  todoFilter = f;
  document.querySelectorAll('.filter-btn')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTodos();
}

// Enter key to add todo
document.getElementById('todo-input')
  .addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });

renderTodos();


// =============================================
//  FOCUS TIMER (Pomodoro)
// =============================================
const CIRCUMFERENCE = 2 * Math.PI * 70; // ≈ 439.82

let timerTotal    = 25 * 60;
let timerLeft     = timerTotal;
let timerInterval = null;
let timerRunning  = false;
let timerIsBreak  = false;
let sessions      = parseInt(localStorage.getItem('sessions') || '0');

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateTimerUI() {
  document.getElementById('timer-display').textContent = formatTime(timerLeft);

  const progress = timerLeft / timerTotal;
  const offset   = CIRCUMFERENCE * (1 - progress);
  const arc      = document.getElementById('timer-arc');
  arc.style.strokeDashoffset = offset;
  arc.style.stroke           = timerIsBreak ? 'var(--green)' : 'var(--accent)';

  document.getElementById('timer-label').textContent =
    timerIsBreak ? '☕ Istirahat' : '🎯 Sesi Fokus';
}

function toggleTimer() {
  if (timerRunning) {
    clearInterval(timerInterval);
    timerRunning = false;
    document.getElementById('timer-start-btn').textContent = '▶ Lanjut';
  } else {
    timerRunning = true;
    document.getElementById('timer-start-btn').textContent = '⏸ Jeda';
    timerInterval = setInterval(() => {
      timerLeft--;
      updateTimerUI();
      if (timerLeft <= 0) {
        clearInterval(timerInterval);
        timerRunning = false;
        document.getElementById('timer-start-btn').textContent = '▶ Mulai';
        if (!timerIsBreak) {
          sessions++;
          localStorage.setItem('sessions', sessions);
          updateSessionDots();
          showToast('🎉 Sesi fokus selesai! Waktunya istirahat.');
        } else {
          showToast('⚡ Istirahat selesai! Ayo fokus lagi!');
        }
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerLeft    = timerTotal;
  updateTimerUI();
  document.getElementById('timer-start-btn').textContent = '▶ Mulai';
}

function setPreset(minutes, mode, btn) {
  clearInterval(timerInterval);
  timerRunning  = false;
  timerIsBreak  = mode === 'break';
  timerTotal    = minutes * 60;
  timerLeft     = timerTotal;
  updateTimerUI();
  document.getElementById('timer-start-btn').textContent = '▶ Mulai';
  document.querySelectorAll('.preset-btn')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function updateSessionDots() {
  document.getElementById('session-num').textContent = sessions;
  const dots = document.querySelectorAll('.session-dot');
  dots.forEach((d, i) => d.classList.toggle('done', i < (sessions % 4)));
  if (sessions > 0 && sessions % 4 === 0) {
    showToast('🏆 4 sesi selesai! Ambil istirahat panjang!');
  }
}

updateTimerUI();
updateSessionDots();


// =============================================
//  QUICK LINKS
// =============================================
const DEFAULT_LINKS = [
  { id: 1, name: 'Google',    url: 'https://google.com',          emoji: '🔍' },
  { id: 2, name: 'YouTube',   url: 'https://youtube.com',         emoji: '▶️' },
  { id: 3, name: 'Wikipedia', url: 'https://wikipedia.org',       emoji: '📖' },
  { id: 4, name: 'GitHub',    url: 'https://github.com',          emoji: '🐙' },
  { id: 5, name: 'Gmail',     url: 'https://mail.google.com',     emoji: '📧' },
  { id: 6, name: 'ChatGPT',   url: 'https://chat.openai.com',     emoji: '🤖' },
];

let links = JSON.parse(localStorage.getItem('links') || 'null') || DEFAULT_LINKS;

function saveLinks() {
  localStorage.setItem('links', JSON.stringify(links));
}

function renderLinks() {
  const grid = document.getElementById('links-grid');
  grid.innerHTML = links.map(l => `
    <a class="link-card" href="${l.url}" target="_blank" rel="noopener noreferrer">
      <button class="link-delete-btn"
        onclick="deleteLink(event, ${l.id})" title="Hapus">✕</button>
      <div class="link-icon">${l.emoji || '🌐'}</div>
      <div class="link-name">${escHtml(l.name)}</div>
    </a>
  `).join('');
}

function toggleAddLink() {
  const form = document.getElementById('add-link-form');
  form.classList.toggle('open');
  if (form.classList.contains('open')) {
    document.getElementById('link-name').focus();
  }
}

function addLink(e) {
  e.preventDefault();
  const name  = document.getElementById('link-name').value.trim();
  const url   = document.getElementById('link-url').value.trim();
  const emoji = document.getElementById('link-emoji').value.trim() || '🌐';
  if (!name || !url) return;

  links.push({ id: Date.now(), name, url, emoji });
  saveLinks();
  renderLinks();
  e.target.reset();
  toggleAddLink();
  showToast('🔗 Tautan ditambahkan!');
}

function deleteLink(e, id) {
  e.preventDefault();
  e.stopPropagation();
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
  showToast('🗑 Tautan dihapus');
}

renderLinks();


// =============================================
//  TOAST NOTIFICATION
// =============================================
let toastTimer;

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}
