// ====================================================================
// mentoriax — app.js
// Incluye: chat IA, diario emocional, planificador, Pomodoro,
//          ejercicio de respiración, grounding 5-4-3-2-1,
//          test PHQ-2/GAD-2, logros, confetti, racha de días,
//          menú hamburguesa, contadores animados, PWA.
// ====================================================================

// ── Configuración ─────────────────────────────────────────────────
const CONFIG = {
  emergencia: '123',
  linea106:   '106',
  bienestar: {
    correo: 'bienestar@tu-universidad.edu.co',
    tel: 'Ext. Bienestar'
  }
};
const API = location.port === '3000' ? '' : 'http://localhost:3000';

// ── Datos de estados de ánimo ──────────────────────────────────────
const MOODS = {
  bien:      { e: '😄', t: 'Con energía',  p: 10, c: 'var(--menta)',   v: 1 },
  normal:    { e: '🙂', t: 'Normal',       p: 25, c: 'var(--azul)',    v: 2 },
  triste:    { e: '😔', t: 'Desanimado/a', p: 65, c: 'var(--lila)',    v: 3 },
  estresado: { e: '😟', t: 'Estresado/a',  p: 70, c: 'var(--ambar)',   v: 4 },
  ansioso:   { e: '😰', t: 'Ansioso/a',    p: 80, c: 'var(--naranja)', v: 5 }
};

const REPLY = {
  bien:      '¡Qué buena energía! Aprovechémosla: elige una micro-meta para esta semana y la anotamos en el planificador. ¿Cuál sería?',
  normal:    'Gracias por contarme. Dime qué materia o decisión quieres trabajar hoy y la vamos desmenuzando en pasos pequeños.',
  estresado: 'Se siente pesado cuando todo se acumula, y es válido. Vamos a bajar la carga: dime las 3 cosas que vencen primero y elegimos solo una para hoy.',
  ansioso:   'Lo que sientes es real y se puede ir calmando. Prueba ahora: inhala 4 segundos, sostén 4 y exhala 6, tres veces. Luego cuéntame qué te preocupa más.',
  triste:    'Siento que estés pasando por esto. No tienes que resolverlo todo hoy. ¿Qué fue lo que más te pesó esta semana? Te escucho.'
};

const AFFIRMATIONS = {
  bien:      ['Tu energía de hoy es un regalo. Úsala para algo que te importe.', 'Los días buenos también construyen tu historia.', '¡Sigue así! La consistencia es la clave del éxito.'],
  normal:    ['Lo normal es el suelo firme desde donde puedes crecer.', 'No todos los días tienen que ser extraordinarios para ser valiosos.', 'Paso a paso, día a día. Eso es suficiente.'],
  estresado: ['Has sobrevivido el 100% de tus días difíciles hasta ahora.', 'El estrés es una señal, no una condena. Escúchalo.', 'Una tarea a la vez. Solo una. Puedes hacerlo.'],
  ansioso:   ['Tu ansiedad te miente: no puedes ver el futuro.', 'Respira. Este momento es todo lo que tienes que manejar ahora.', 'La ansiedad es energía mal dirigida. Vamos a redirigirla juntos.'],
  triste:    ['No tienes que resolver nada hoy. Solo existir ya es suficiente.', 'La tristeza también pasa. No eres tu estado de ánimo.', 'Ser vulnerable no es debilidad, es valentía.']
};

const CRISIS = `Gracias por contármelo. Lo que sientes importa y no tienes que cargarlo solo/a. Si estás en peligro o piensas hacerte daño, llama ya a la **Línea 106** (Salud Mental Colombia, gratuita 24/7) o al ${CONFIG.emergencia} en emergencia. Busca ahora a alguien de confianza que esté cerca y contacta a Bienestar Universitario: te dejé sus datos aquí abajo. Puedo seguir acompañándote mientras tanto.`;

const KW = {
  crisis:    /(suicid|quitarme la vida|no quiero vivir|hacerme da[ñn]o|acabar con todo|morirme|matarme)/,
  ansioso:   /(ansied|p[aá]nico|no puedo respirar|miedo|angusti)/,
  estresado: /(estr[eé]s|abrumad|agobi|no doy m[aá]s|colaps|sobrecarg|no alcanzo|cansad)/,
  triste:    /(triste|llor|desanim|sin ganas|no sirvo|me rend[ií]|renunciar|dejar la carrera|salirme)/,
  bien:      /(feliz|content[oa]|motivad|emocionad|me fue bien)/
};

// ── PHQ-2 / GAD-2 preguntas ────────────────────────────────────────
const PHQ_QUESTIONS = [
  { id: 'phq1', text: '¿Con qué frecuencia has tenido poco interés o placer en hacer las cosas?', category: 'PHQ' },
  { id: 'phq2', text: '¿Te has sentido decaído/a, deprimido/a o sin esperanza?', category: 'PHQ' },
  { id: 'gad1', text: '¿Has sentido nerviosismo, ansiedad o has estado al límite?', category: 'GAD' },
  { id: 'gad2', text: '¿No has podido dejar de preocuparte o controlar tu preocupación?', category: 'GAD' }
];
const PHQ_OPTIONS = ['Nunca', 'Algunos días', 'Más de la mitad de días', 'Casi todos los días'];

// ── Grounding steps ────────────────────────────────────────────────
const GROUNDING_STEPS = [
  { n: 5, sense: '👁️', key: 'VER',      hint: 'Una silla, tu pantalla, una ventana…' },
  { n: 4, sense: '✋', key: 'TOCAR',    hint: 'El escritorio, tu ropa, el teléfono…' },
  { n: 3, sense: '👂', key: 'ESCUCHAR', hint: 'El ventilador, voces, tu propia respiración…' },
  { n: 2, sense: '👃', key: 'OLER',     hint: 'El aire, comida cercana, jabón…' },
  { n: 1, sense: '👅', key: 'SABOREAR', hint: 'El sabor que tienes ahora mismo.' }
];

// ── Logros / Achievements ──────────────────────────────────────────
const ACHIEVEMENT_DEFS = [
  { id: 'first_msg',   icon: '🌱', label: 'Primer paso',      desc: 'Enviaste tu primer mensaje' },
  { id: 'breathing',   icon: '🧘', label: 'Respiración',      desc: 'Completaste un ejercicio de respiración' },
  { id: 'five_tasks',  icon: '📋', label: 'Organizador',      desc: 'Completaste 5 micro-metas' },
  { id: 'streak7',     icon: '💪', label: 'Semana fuerte',    desc: '7 días de check-in seguidos' },
  { id: 'pomodoro5',   icon: '🍅', label: 'Pomodoro Pro',     desc: 'Completaste 5 sesiones Pomodoro' },
  { id: 'phq_done',    icon: '❤️', label: 'Autocuidado',      desc: 'Hiciste el test de bienestar' },
  { id: 'streak3',     icon: '🌟', label: 'Constante',        desc: '3 días de check-in seguidos' }
];

// ── Helpers ────────────────────────────────────────────────────────
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = text => esc(text)
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  .replace(/\n/g, '<br>');

// ── Estado global ──────────────────────────────────────────────────
let mood        = 'normal';
let history     = [];
let urgent      = false;
let offlineNoted= false;
let busy        = false;
let profile     = {};
let tasks       = [];
let moodDiary   = [];   // [{ mood, ts }]
let achievements= {};   // { id: true }
let crisisCount = 0;
let currentFilter = 'all';
let phqAnswers  = {};

// ── Cargar persistencia ────────────────────────────────────────────
(function loadStorage() {
  const safe = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch(e) { return fallback; } };
  history      = safe('mentoria_history', []);
  profile      = safe('mentoria_profile', {});
  tasks        = safe('mentoria_tasks', []);
  moodDiary    = safe('mentoria_mood_diary', []);
  achievements = safe('mentoria_achievements', {});
  crisisCount  = safe('mentoria_crisis_count', 0);
})();

const save = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} };

// ====================================================================
// CHAT
// ====================================================================

function add(role, text, typing = false) {
  const d = document.createElement('div');
  d.className = 'msg ' + role + (typing ? ' typing' : '');
  d.innerHTML = md(text);
  $('#log').appendChild(d);
  $('#log').scrollTop = 1e9;
  return d;
}

function typeWriter(text, speed = 12) {
  return new Promise(resolve => {
    const d = document.createElement('div');
    d.className = 'msg bot';
    const cursor = document.createElement('span');
    cursor.className = 'cursor-blink';
    cursor.setAttribute('aria-hidden', 'true');
    d.appendChild(cursor);
    $('#log').appendChild(d);
    const chars = [...text];
    let i = 0;
    const tick = () => {
      if (i < chars.length) {
        const partial = chars.slice(0, ++i).join('');
        d.innerHTML = md(partial);
        d.appendChild(cursor);
        $('#log').scrollTop = 1e9;
        const delay = (chars[i-1] === '.' || chars[i-1] === '?') ? 60 : speed;
        setTimeout(tick, delay);
      } else {
        d.innerHTML = md(text);
        appendPlanButton(d, text);
        $('#log').scrollTop = 1e9;
        resolve(d);
      }
    };
    tick();
  });
}

function appendPlanButton(el, text) {
  if (!/\*\*\d|paso|meta|planificador|pomodoro/i.test(text)) return;
  const btn = document.createElement('button');
  btn.className = 'add-plan-btn';
  btn.type = 'button';
  btn.innerHTML = '📋 Añadir al planificador';
  btn.onclick = () => { $('#planificador').scrollIntoView({ behavior: 'smooth' }); $('#planInput').focus(); };
  el.appendChild(document.createElement('br'));
  el.appendChild(btn);
}

function showHelp(isUrgent) {
  const b = CONFIG.bienestar;
  const line106 = `<a href="tel:${CONFIG.linea106}" class="btn sm">📞 Línea 106 (24/7)</a>`;
  $('#help').innerHTML = (isUrgent
    ? `<b>Tu seguridad es lo primero.</b> Llama ya al <a href="tel:${CONFIG.emergencia}">${CONFIG.emergencia}</a> o a la Línea ${CONFIG.linea106} de salud mental (gratuita).`
    : '<b>Veo que llevas mucha carga.</b> Hablar con alguien puede ayudarte.')
    + ` ${line106} <a class="btn sm" href="mailto:${esc(b.correo)}?subject=Necesito%20apoyo">✉ Bienestar</a> <span>${esc(b.tel)}</span>`;
  $('#help').hidden = false;
}

function setMood(k) {
  if (!MOODS[k]) return;
  mood = k;
  const m = MOODS[k];
  document.querySelectorAll('#moods button').forEach(b => b.classList.toggle('on', b.dataset.m === k));
  $('#moodLabel').textContent = m.t;
  $('#moodPct').textContent   = m.p + '% de carga';
  $('#moodBar').style.width      = m.p + '%';
  $('#moodBar').style.background = m.c;
  // Guardar en diario
  moodDiary.push({ mood: k, ts: Date.now() });
  if (moodDiary.length > 200) moodDiary.splice(0, moodDiary.length - 200);
  save('mentoria_mood_diary', moodDiary);
  // Mostrar afirmación
  updateAffirmation(k);
  // Mostrar ayuda si carga alta
  if (m.p >= 65) showHelp(false);
  else if (!urgent) $('#help').hidden = true;
  // Actualizar gráfica
  renderMoodChart();
  renderWeeklySummary();
  // Check-in streak
  updateStreak();
}

function updateAffirmation(k) {
  const list = AFFIRMATIONS[k] || AFFIRMATIONS.normal;
  const text = list[Math.floor(Math.random() * list.length)];
  const el = $('#affirmationText');
  el.style.opacity = '0';
  setTimeout(() => { el.textContent = text; el.style.opacity = '1'; }, 300);
}

function detect(t) {
  t = t.toLowerCase();
  if (KW.crisis.test(t)) return 'crisis';
  for (const k of ['ansioso', 'estresado', 'triste', 'bien']) if (KW[k].test(t)) return k;
  return null;
}

function localReply(t) {
  const l = t.toLowerCase();
  if (/(algebra|álgebra|trigonom|c[aá]lculo|matem|f[ií]sica)/.test(l))
    return 'Esas materias suelen ser un cuello de botella. Prueba: **1)** estudia un solo tema hoy, **2)** revisa 3 ejercicios resueltos antes de hacer uno, **3)** Pomodoro: 25 min de trabajo y 5 de descanso. ¿Lo anotamos en el planificador?';
  if (/(plan|horario|organiz|pomodoro|semana)/.test(l))
    return 'Armemos algo realista: elige **máximo 3 metas** para esta semana, ponles un día y 25-50 min de duración. Agrégalas en el planificador de abajo. ¿Cuáles son tus 3 prioridades?';
  if (/(salirme|dejar la carrera|abandonar|retirar)/.test(l))
    return 'Querer salirte suele aparecer cuando estás agotado/a, y no siempre significa que la carrera no es para ti. Hablarlo con Bienestar o tu coordinación te da más opciones, como reducir carga. ¿Te pesa la carrera o el cansancio de este momento?';
  return REPLY[mood];
}

async function send(text) {
  if (busy || !text.trim()) return;
  busy = true;
  $('#sendBtn').disabled = true;
  add('user', text);
  history.push({ role: 'user', content: text });
  save('mentoria_history', history.slice(-30));

  const d = detect(text);
  if (d === 'crisis') {
    crisisCount++;
    save('mentoria_crisis_count', crisisCount);
    urgent = true;
    showHelp(true);
    // Escalación: si es recurrente, mensaje más fuerte
    const crisisReply = crisisCount > 1
      ? `**Esta es la ${crisisCount}a vez** que me compartes algo así. Eso me importa mucho. Por favor, llama ahora a la **Línea 106** (gratuita, 24/7) o al ${CONFIG.emergencia}. ${CRISIS}`
      : CRISIS;
    await typeWriter(crisisReply);
    history.push({ role: 'assistant', content: crisisReply });
    save('mentoria_history', history.slice(-30));
    busy = false;
    $('#sendBtn').disabled = false;
    return;
  }

  if (d) setMood(d);
  const typing = add('bot', 'NETORAX está escribiendo…', true);
  let reply;
  try {
    const r = await fetch(API + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history.slice(-14), mood, profile: profile.name ? profile : null }),
      signal: AbortSignal.timeout(28000)
    });
    if (!r.ok) throw new Error(r.status);
    reply = (await r.json()).reply;
  } catch(e) {
    reply = localReply(text);
    if (!offlineNoted) { offlineNoted = true; reply += '\n\n_(Respondo en modo básico porque el servidor no está activo.)_'; }
  }
  typing.remove();
  await typeWriter(reply);
  history.push({ role: 'assistant', content: reply });
  save('mentoria_history', history.slice(-30));

  // Primer mensaje → logro
  unlockAchievement('first_msg');

  busy = false;
  $('#sendBtn').disabled = false;
}

function greet() {
  const nameGreet = profile.name ? `, **${profile.name}**` : '';
  const ctx = profile.carrera ? ` Veo que estudias **${profile.carrera}**. ` : ' ';
  typeWriter(`¡Hola${nameGreet}! Soy **NETORAX**, tu mentor en mentoriax.${ctx}Puedo ayudarte con tus materias, organizar tu semana o escucharte si vienes con estrés. Elige cómo te sientes o escríbeme.`);
}

function initChat() {
  $('#moods').innerHTML = Object.entries(MOODS).map(([k, m]) =>
    `<button type="button" data-m="${k}" aria-pressed="false">${m.e} ${m.t}</button>`
  ).join('');

  $('#moods').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const k = b.dataset.m;
    const u = 'Hoy me siento ' + MOODS[k].t.toLowerCase();
    add('user', u);
    history.push({ role: 'user', content: u });
    save('mentoria_history', history.slice(-30));
    setMood(k);
    typeWriter(REPLY[k]);
    history.push({ role: 'assistant', content: REPLY[k] });
    save('mentoria_history', history.slice(-30));
  };

  document.querySelectorAll('.quick button').forEach(b =>
    b.addEventListener('click', () => { $('#input').value = ''; send(b.dataset.q); })
  );

  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    const t = $('#input').value.trim();
    if (!t) return;
    $('#input').value = '';
    send(t);
  });

  $('#reset').addEventListener('click', () => {
    history = []; save('mentoria_history', []);
    urgent = false; offlineNoted = false; busy = false;
    $('#log').innerHTML = ''; $('#help').hidden = true;
    document.querySelectorAll('#moods button').forEach(b => b.classList.remove('on'));
    $('#moodLabel').textContent = 'Elige una opción o escríbeme';
    $('#moodPct').textContent   = '';
    $('#moodBar').style.width   = '0';
    mood = 'normal';
    greet();
  });

  const hasHistory = history.length > 0;
  if (hasHistory) {
    const resumeEl = document.createElement('div');
    resumeEl.className = 'msg bot';
    resumeEl.innerHTML = '<em style="font-size:.8rem;color:var(--mut)">— sesión anterior restaurada —</em>';
    $('#log').appendChild(resumeEl);
    history.slice(-6).forEach(m => add(m.role === 'user' ? 'user' : 'bot', m.content));
    typeWriter('¡Hola de nuevo! ¿Continuamos donde lo dejamos?');
  } else {
    greet();
  }
}

// ── Check-in diario y racha ────────────────────────────────────────
function updateStreak() {
  const now    = new Date();
  const today  = now.toDateString();
  const stored = localStorage.getItem('mentoria_streak');
  let streakData = { count: 0, lastDate: '', dates: [] };
  try { streakData = JSON.parse(stored || '{}'); } catch(e) {}

  if (streakData.lastDate === today) return; // ya registrado hoy

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const wasYesterday = streakData.lastDate === yesterday.toDateString();

  streakData.count    = wasYesterday ? (streakData.count || 0) + 1 : 1;
  streakData.lastDate = today;
  save('mentoria_streak', streakData);
  $('#streakNum').textContent = streakData.count;

  if (streakData.count >= 3)  unlockAchievement('streak3');
  if (streakData.count >= 7)  unlockAchievement('streak7');

  // Check-in diario: comparar mood de ayer vs hoy
  dailyCheckIn(streakData.count);
}

function dailyCheckIn(streak) {
  if (streak <= 1) return;
  const yesterday = moodDiary.filter(e => {
    const d = new Date(e.ts);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return d.toDateString() === yesterday.toDateString();
  });
  if (!yesterday.length) return;
  const lastMood = yesterday[yesterday.length - 1].mood;
  const lastV = MOODS[lastMood]?.v || 2;
  const curV  = MOODS[mood]?.v || 2;
  if (curV > lastV + 1) {
    // Mood empeoró: mensaje proactivo
    setTimeout(() => {
      add('bot', `Noto que hoy pareces más cargado/a que ayer. Eso es válido y merece atención. ¿Qué ha cambiado desde ayer? Si necesitas apoyo inmediato, la **Línea 106** está disponible 24/7.`);
    }, 3000);
  }
}

function loadStreak() {
  try {
    const s = JSON.parse(localStorage.getItem('mentoria_streak') || '{}');
    if (s.count) $('#streakNum').textContent = s.count;
  } catch(e) {}
}

// ── Resumen semanal ────────────────────────────────────────────────
function renderWeeklySummary() {
  const now   = Date.now();
  const week  = 7 * 24 * 60 * 60 * 1000;
  const week_entries = moodDiary.filter(e => now - e.ts < week);
  if (!week_entries.length) {
    $('#weeklyStats').innerHTML = '<p style="font-size:.85rem;color:var(--mut2)">Registra tu estado de ánimo para ver el resumen semanal.</p>';
    return;
  }
  const avg = week_entries.reduce((sum, e) => sum + (MOODS[e.mood]?.v || 2), 0) / week_entries.length;
  const moodNames = { 1: 'Con energía', 2: 'Normal', 3: 'Desanimado/a', 4: 'Estresado/a', 5: 'Ansioso/a' };
  const highStress = week_entries.filter(e => MOODS[e.mood]?.v >= 4).length;
  const mostCommon = Object.entries(
    week_entries.reduce((acc, e) => { acc[e.mood] = (acc[e.mood] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  $('#weeklyStats').innerHTML = `
    <div class="weekly-stat"><span>Promedio de carga</span><b>${moodNames[Math.round(avg)] || 'Normal'}</b></div>
    <div class="weekly-stat"><span>Días con estrés/ansiedad</span><b>${highStress} de ${week_entries.length}</b></div>
    <div class="weekly-stat"><span>Estado más frecuente</span><b>${MOODS[mostCommon?.[0]]?.t || '—'}</b></div>
    <div class="weekly-stat"><span>Check-ins esta semana</span><b>${week_entries.length}</b></div>
  `;
}

// ── Gráfica de ánimo (SVG puro) ────────────────────────────────────
function renderMoodChart() {
  const entries = moodDiary.slice(-14);
  const svg = $('#moodChart');
  const empty = $('#chartEmpty');

  if (entries.length < 2) {
    svg.innerHTML = '';
    if (empty) empty.style.display = 'flex';
    return;
  }
  if (empty) empty.style.display = 'none';

  const W = 560, H = 180, PAD = { t: 14, r: 20, b: 36, l: 30 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;

  // Normalizar: v=1(bien)…5(ansioso) → Y invertido
  const points = entries.map((e, i) => ({
    x: PAD.l + (i / (entries.length - 1)) * cW,
    y: PAD.t + ((MOODS[e.mood]?.v - 1) / 4) * cH,
    mood: e.mood,
    ts: e.ts
  }));

  // Bezier path
  const path = points.map((p, i) => {
    if (i === 0) return `M${p.x},${p.y}`;
    const prev = points[i - 1];
    const cx   = (prev.x + p.x) / 2;
    return `C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
  }).join(' ');

  const areaPath = path + ` L${points[points.length-1].x},${H - PAD.b} L${points[0].x},${H - PAD.b} Z`;

  // X-axis labels (dates)
  const labels = entries.map((e, i) => {
    if (i % Math.ceil(entries.length / 5) !== 0 && i !== entries.length - 1) return '';
    const d = new Date(e.ts);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = `
    <defs>
      <linearGradient id="chartGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#6A45F5"/>
        <stop offset="100%" stop-color="#3BBEF0"/>
      </linearGradient>
      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3BBEF0" stop-opacity=".35"/>
        <stop offset="100%" stop-color="#3BBEF0" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <!-- Grid lines -->
    ${[1,2,3,4].map(v => {
      const y = PAD.t + ((v - 1) / 4) * cH;
      return `<line class="chart-grid" x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}"/>`;
    }).join('')}
    <!-- Area fill -->
    <path class="chart-area" d="${areaPath}"/>
    <!-- Line -->
    <path class="chart-line" d="${path}"/>
    <!-- Dots -->
    ${points.map((p, i) => `
      <circle class="chart-dot" cx="${p.x}" cy="${p.y}" r="4">
        <title>${MOODS[entries[i].mood]?.t || ''} · ${new Date(entries[i].ts).toLocaleDateString('es-CO')}</title>
      </circle>
    `).join('')}
    <!-- X labels -->
    ${points.map((p, i) => labels[i] ? `<text class="chart-label" x="${p.x}" y="${H - 8}">${labels[i]}</text>` : '').join('')}
    <!-- Y label axis -->
    <text class="chart-label" x="${PAD.l - 4}" y="${PAD.t + 4}" text-anchor="end" style="font-size:9px">Alto</text>
    <text class="chart-label" x="${PAD.l - 4}" y="${H - PAD.b + 4}" text-anchor="end" style="font-size:9px">Bien</text>
  `;
}

// ====================================================================
// BREATHING EXERCISE
// ====================================================================

const BREATHING_TECHS = {
  box:  { label: 'Box Breathing', phases: [{ name: 'Inhala', dur: 4 }, { name: 'Sostén', dur: 4 }, { name: 'Exhala', dur: 4 }, { name: 'Sostén', dur: 4 }] },
  '478':{ label: 'Técnica 4-7-8',  phases: [{ name: 'Inhala', dur: 4 }, { name: 'Sostén', dur: 7 }, { name: 'Exhala', dur: 8 }] },
  calm: { label: 'Relajación 4-6', phases: [{ name: 'Inhala', dur: 4 }, { name: 'Exhala', dur: 6 }] }
};

let breathState = { running: false, phaseIdx: 0, countdown: 0, interval: null, cyclesDone: 0 };

function startBreathing() {
  const tech = BREATHING_TECHS[$('#breathingTech').value] || BREATHING_TECHS.box;
  breathState.running   = true;
  breathState.phaseIdx  = 0;
  breathState.cyclesDone= 0;
  $('#breathStart').style.display = 'none';
  $('#breathStop').style.display  = 'inline-flex';
  runBreathPhase(tech);
}

function runBreathPhase(tech) {
  if (!breathState.running) return;
  const phase = tech.phases[breathState.phaseIdx];
  breathState.countdown = phase.dur;
  const ring = $('#breathRing');
  const inner = ring.querySelector('.breath-inner');

  // Set ring class for color
  ring.className = 'breath-ring';
  if (phase.name === 'Inhala')      { ring.classList.add('inhale'); inner.style.transform = 'scale(1.35)'; }
  else if (phase.name === 'Exhala') { ring.classList.add('exhale'); inner.style.transform = 'scale(1)'; }
  else                               { ring.classList.add('hold'); }

  $('#breathPhase').textContent = phase.name + '…';
  $('#breathCount').textContent = breathState.countdown;
  $('#breathSub').textContent   = phase.name === 'Inhala' ? 'Llena tus pulmones lentamente.' :
                                   phase.name === 'Exhala' ? 'Suelta el aire despacio, completamente.' :
                                   'Mantén el aire con calma.';

  clearInterval(breathState.interval);
  breathState.interval = setInterval(() => {
    breathState.countdown--;
    $('#breathCount').textContent = breathState.countdown;
    if (breathState.countdown <= 0) {
      clearInterval(breathState.interval);
      breathState.phaseIdx++;
      if (breathState.phaseIdx >= tech.phases.length) {
        breathState.phaseIdx = 0;
        breathState.cyclesDone++;
        if (breathState.cyclesDone >= 3) {
          stopBreathing(true);
          return;
        }
      }
      runBreathPhase(tech);
    }
  }, 1000);
}

function stopBreathing(completed = false) {
  clearInterval(breathState.interval);
  breathState.running = false;
  $('#breathStart').style.display = 'inline-flex';
  $('#breathStop').style.display  = 'none';
  $('#breathRing').className = 'breath-ring';
  $('#breathPhase').textContent = completed ? '✅ ¡Muy bien! 3 ciclos completados.' : 'Prepárate…';
  $('#breathSub').textContent   = completed ? 'Tómate un momento para sentir cómo cambia tu cuerpo.' : 'Siéntate cómodamente. Cierra los ojos si puedes.';
  $('#breathCount').textContent = '4';
  if (completed) {
    unlockAchievement('breathing');
    showToast('🧘 Ejercicio completado', '¡3 ciclos de respiración! Tu cuerpo lo agradece.', 'success');
  }
}

function initBreathing() {
  document.querySelectorAll('.wellbeing-action-breathing').forEach(btn => {
    btn.addEventListener('click', () => { $('#breathingModal').hidden = false; });
  });
  $('#breathStart').addEventListener('click', () => startBreathing());
  $('#breathStop').addEventListener('click',  () => stopBreathing(false));
  $('#breathClose').addEventListener('click', () => { stopBreathing(false); $('#breathingModal').hidden = true; });
}

// ====================================================================
// GROUNDING 5-4-3-2-1
// ====================================================================

let groundingStep = 0;

function initGrounding() {
  document.querySelectorAll('.wellbeing-action-grounding').forEach(btn => {
    btn.addEventListener('click', () => openGrounding());
  });

  $('#groundingNext').addEventListener('click', () => {
    const input = $('#groundingInput').value.trim();
    // Avanzar aunque esté vacío (no forzar al usuario)
    groundingStep++;
    if (groundingStep >= GROUNDING_STEPS.length) {
      // Completado
      $('#groundingStepBox').innerHTML = `<div style="text-align:center;padding:20px 0">
        <p style="font-size:2rem;margin-bottom:12px">🌿</p>
        <p style="font-weight:700;margin-bottom:8px">¡Bien hecho!</p>
        <p style="color:var(--mut);font-size:.9rem">Conectar con tus sentidos interrumpe el ciclo de ansiedad. ¿Cómo te sientes ahora?</p>
      </div>`;
      $('#groundingNext').textContent = 'Cerrar';
      $('#groundingNext').onclick = () => { $('#groundingModal').hidden = true; groundingStep = 0; };
      return;
    }
    renderGroundingStep();
  });

  $('#groundingClose').addEventListener('click', () => { $('#groundingModal').hidden = true; groundingStep = 0; });
}

function openGrounding() {
  groundingStep = 0;
  renderGroundingStep();
  $('#groundingNext').textContent = 'Siguiente →';
  $('#groundingNext').onclick = null;
  // Reassign listener
  $('#groundingNext').addEventListener('click', function handler() {
    groundingStep++;
    if (groundingStep >= GROUNDING_STEPS.length) {
      $('#groundingStepBox').innerHTML = `<div style="text-align:center;padding:20px 0"><p style="font-size:2rem;margin-bottom:12px">🌿</p><p style="font-weight:700;margin-bottom:8px">¡Bien hecho!</p><p style="color:var(--mut);font-size:.9rem">Conectar con tus sentidos interrumpe el ciclo de ansiedad. ¿Cómo te sientes ahora?</p></div>`;
      this.textContent = 'Cerrar';
      this.removeEventListener('click', handler);
      this.addEventListener('click', () => { $('#groundingModal').hidden = true; });
      return;
    }
    renderGroundingStep();
  });
  $('#groundingModal').hidden = false;
}

function renderGroundingStep() {
  const step = GROUNDING_STEPS[groundingStep];
  // Progress dots
  document.querySelectorAll('.gp-dot').forEach((dot, i) => {
    dot.classList.remove('active', 'done');
    if (i < groundingStep) dot.classList.add('done');
    else if (i === groundingStep) dot.classList.add('active');
  });
  $('#groundingSense').textContent = step.sense;
  $('#groundingQ').innerHTML = `Nombra <b>${step.n}</b> ${step.n === 1 ? 'cosa' : 'cosas'} que puedes <b>${step.key}</b> ahora mismo`;
  $('#groundingInput').value       = '';
  $('#groundingInput').placeholder = step.hint;
  $('#groundingInput').focus();
}

// ====================================================================
// PHQ-2 / GAD-2 TEST
// ====================================================================

function updatePhqProgress() {
  const answered = Object.keys(phqAnswers).length;
  const total = PHQ_QUESTIONS.length;
  const next = Math.min(answered + 1, total);
  $('#phqProgressText').textContent = answered >= total
    ? `${total} de ${total} completadas`
    : `Pregunta ${next} de ${total}`;
  $('#phqAnsweredText').textContent = `${answered} respondida${answered === 1 ? '' : 's'}`;
  $('#phqProgressBar').style.width = `${(answered / total) * 100}%`;
  const bar = document.querySelector('.phq-progress-bar');
  if (bar) bar.setAttribute('aria-valuenow', String(answered));
}

function renderPhq() {
  phqAnswers = {};
  $('#phqResultBox').hidden = true;
  $('#phqSubmit').style.display = 'inline-flex';
  updatePhqProgress();
  $('#phqQuestions').innerHTML = PHQ_QUESTIONS.map((q, qi) => `
    <div class="phq-q">
      <p>${qi + 1}. ${esc(q.text)}</p>
      <div class="phq-options">
        ${PHQ_OPTIONS.map((opt, vi) =>
          `<button class="phq-opt" data-q="${q.id}" data-v="${vi}" type="button"><span class="phq-opt-n">${vi}</span><span class="phq-opt-t">${esc(opt)}</span></button>`
        ).join('')}
      </div>
    </div>
  `).join('');
}

/** Único punto de entrada: diario «Hacer el test» y panel 🧘 Bienestar → Test */
function openWellbeingTest() {
  renderPhq();
  $('#phqModal').hidden = false;
}

function submitPhq() {
  const total = Object.values(phqAnswers).reduce((s, v) => s + v, 0);
  let resultHtml, cls;
  if (total <= 2) {
    cls = 'ok';
    resultHtml = `<b>✅ Tu bienestar parece estable (${total}/12)</b><br>Tus respuestas no muestran señales de alerta importantes. Sigue cuidándote y chequea cómo te sientes regularmente.`;
  } else if (total <= 6) {
    cls = 'moderate';
    resultHtml = `<b>🟡 Podrías beneficiarte de apoyo (${total}/12)</b><br>Algunas respuestas sugieren que algo te está pesando. Considera hablar con alguien de Bienestar Universitario o llamar a la <a href="tel:106" style="text-decoration:underline;font-weight:700">Línea 106</a> (gratuita, 24/7).`;
  } else {
    cls = 'high';
    resultHtml = `<b>🟠 Te recomendamos buscar apoyo profesional (${total}/12)</b><br>Tus respuestas sugieren que mereces apoyo de un profesional. Por favor llama a la <a href="tel:106" style="text-decoration:underline;font-weight:700">Línea 106</a> o visita a Bienestar Universitario. No tienes que manejarlo solo/a.`;
  }
  const box = $('#phqResultBox');
  box.className = `phq-result-box ${cls}`;
  box.innerHTML = `<p>${resultHtml}</p><p style="font-size:.75rem;margin-top:10px;opacity:.7">⚠️ Este resultado NO es un diagnóstico médico.</p>`;
  box.hidden = false;
  $('#phqSubmit').style.display = 'none';
  unlockAchievement('phq_done');
  // Update diary card result
  const summary = total <= 2 ? '✅ Estable' : total <= 6 ? '🟡 Moderado' : '🟠 Requiere atención';
  $('#phqResult').textContent = `Último test: ${summary}`;
  $('#phqResult').hidden = false;
  $('#phqProgressBar').style.width = '100%';
}

function initPhq() {
  document.querySelectorAll('.wellbeing-test-trigger').forEach(btn => {
    btn.addEventListener('click', openWellbeingTest);
  });

  $('#phqQuestions').addEventListener('click', e => {
    const btn = e.target.closest('.phq-opt'); if (!btn) return;
    const qId = btn.dataset.q;
    phqAnswers[qId] = +btn.dataset.v;
    document.querySelectorAll(`.phq-opt[data-q="${qId}"]`).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    updatePhqProgress();
  });

  $('#phqSubmit').addEventListener('click', submitPhq);
  $('#phqClose').addEventListener('click', () => {
    $('#phqModal').hidden = true;
    $('#phqResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
  $('#phqModal').addEventListener('click', e => {
    if (e.target === $('#phqModal')) $('#phqModal').hidden = true;
  });
}

// ====================================================================
// ACHIEVEMENTS
// ====================================================================

function unlockAchievement(id) {
  if (achievements[id]) return;
  achievements[id] = true;
  save('mentoria_achievements', achievements);
  renderAchievements();
  const def = ACHIEVEMENT_DEFS.find(a => a.id === id);
  if (def) showToast(`${def.icon} ¡Logro desbloqueado!`, def.label + ': ' + def.desc, 'achievement');
}

function renderAchievements() {
  const row = $('#achievementsRow');
  if (!row) return;
  row.innerHTML = ACHIEVEMENT_DEFS.map(a => `
    <div class="achievement-badge ${achievements[a.id] ? 'unlocked' : ''}" title="${a.desc}">
      <span class="badge-icon">${achievements[a.id] ? a.icon : '🔒'}</span>
      <span>${a.label}</span>
    </div>
  `).join('');
}

// ====================================================================
// TOAST NOTIFICATIONS
// ====================================================================

function showToast(title, body = '', type = '', customIcon = '') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;

  let iconContent = `<span class="toast-icon">${type.includes('success') ? '✅' : type.includes('achievement') ? '🏆' : '✨'}</span>`;
  if (customIcon) {
    iconContent = `<div class="toast-avatar-badge"><img src="${esc(customIcon)}" alt="Icono"></div>`;
  }

  const bodyHtml = body ? `<span class="toast-body">${esc(body)}</span>` : '';
  t.innerHTML = `
    ${iconContent}
    <div class="toast-content">
      <b class="toast-title">${esc(title)}</b>
      ${bodyHtml}
    </div>
    <button type="button" class="toast-close" aria-label="Cerrar">&times;</button>
  `;

  const closeBtn = t.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      t.style.opacity = '0';
      t.style.transform = 'translateY(-8px) scale(0.96)';
      setTimeout(() => t.remove(), 250);
    };
  }

  $('#toastContainer').appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(-8px) scale(0.96)';
    setTimeout(() => t.remove(), 250);
  }, 4200);
}

// ====================================================================
// CONFETTI
// ====================================================================

function launchConfetti() {
  const colors = ['#6A45F5','#3BBEF0','#2BD49A','#B9AEFF','#FF6F61','#F4F2FF'];
  for (let i = 0; i < 28; i++) {
    const dot = document.createElement('div');
    dot.className = 'confetti-dot';
    dot.style.cssText = `left:${Math.random()*100}vw;top:${60 + Math.random()*20}vh;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*.6}s;width:${6+Math.random()*6}px;height:${6+Math.random()*6}px`;
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 2200);
  }
}

// ====================================================================
// PLANIFICADOR
// ====================================================================

const saveTasks = () => save('mentoria_tasks', tasks);

const pomoState = { running:false, paused:false, taskIdx:null, phase:'work', remaining:25*60, interval:null, completed:0 };

function formatTime(s) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }

function renderPlan() {
  const filtered = tasks.filter(t => {
    if (currentFilter === 'done')     return t.done;
    if (currentFilter === 'pendiente') return !t.done;
    if (currentFilter === 'alta')     return t.priority === 'alta';
    return true;
  });

  const now = new Date().toISOString().split('T')[0];
  $('#planList').innerHTML = filtered.map(t => {
    const ri   = tasks.indexOf(t);
    const over = t.dueDate && t.dueDate < now && !t.done;
    const pBadge = (t.priority && t.priority !== 'media')
      ? `<span class="priority-badge priority-${t.priority}">${t.priority.toUpperCase()}</span>` : '';
    const dateLbl = t.dueDate
      ? `<span class="due-date ${over ? 'overdue' : ''}">${over ? '⚠ ' : ''}${t.dueDate}</span>` : '';
    const pomoLabel = pomoState.running && pomoState.taskIdx === ri
      ? `🍅 ${formatTime(pomoState.remaining)}` : '🍅';
    return `<li class="${t.done ? 'done' : ''}">
      <input type="checkbox" data-i="${ri}" ${t.done ? 'checked' : ''}>
      <label>${pBadge}${esc(t.text)}${dateLbl}</label>
      <button class="pomo-btn${pomoState.running && pomoState.taskIdx===ri?' running':''}" data-pi="${ri}" type="button">${pomoLabel}</button>
      <button class="del-btn" data-x="${ri}" type="button">✕</button>
    </li>`;
  }).join('');

  const done = tasks.filter(t => t.done).length;
  const pct  = tasks.length ? done / tasks.length * 100 : 0;
  $('#planBar').style.width = pct + '%';
  $('#planText').textContent = tasks.length
    ? `${done} de ${tasks.length} micro-metas cumplidas`
    : 'Agrega tu primera micro-meta de la semana.';

  // Logro 5 tareas
  if (done >= 5) unlockAchievement('five_tasks');
}

function initPlanificador() {
  $('#planForm').addEventListener('submit', e => {
    e.preventDefault();
    const t = $('#planInput').value.trim();
    if (!t) return;
    tasks.push({ text: t, done: false, priority: $('#planPriority').value || 'media', dueDate: $('#planDate').value || null, created: Date.now() });
    $('#planInput').value = '';
    $('#planDate').value  = '';
    saveTasks();
    renderPlan();
  });

  $('#planList').addEventListener('click', e => {
    const xi = e.target.dataset.x, ii = e.target.dataset.i, pi = e.target.dataset.pi;
    if (xi !== undefined) { tasks.splice(+xi, 1); saveTasks(); renderPlan(); }
    else if (ii !== undefined) {
      tasks[+ii].done = e.target.checked;
      saveTasks();
      if (tasks[+ii].done) { launchConfetti(); showToast('✅ ¡Meta cumplida!', tasks[+ii].text.slice(0,40), 'success'); }
      renderPlan();
    }
    else if (pi !== undefined) startPomodoro(+pi);
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderPlan();
    });
  });
}

// ====================================================================
// POMODORO
// ====================================================================

function startPomodoro(taskIdx) {
  if (pomoState.running && pomoState.taskIdx === taskIdx) { $('#pomoModal').hidden = false; return; }
  clearInterval(pomoState.interval);
  Object.assign(pomoState, { running:true, paused:false, taskIdx, phase:'work', remaining:25*60 });
  $('#pomoModal').hidden = false;
  $('#pomoPhase').textContent = `🎯 ${tasks[taskIdx]?.text?.slice(0,28) || 'Tarea'}…`;
  tickPomodoro();
}

function tickPomodoro() {
  updatePomoDom();
  pomoState.interval = setInterval(() => {
    if (pomoState.paused) return;
    pomoState.remaining--;
    updatePomoDom();
    renderPlan();
    if (pomoState.remaining <= 0) {
      clearInterval(pomoState.interval);
      pomoPhaseEnd();
    }
  }, 1000);
}

function updatePomoDom() {
  $('#pomoTime').textContent = formatTime(pomoState.remaining);
  document.title = `${formatTime(pomoState.remaining)} · Mentor IA`;
}

function pomoPhaseEnd() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.frequency.value = 660;
  gain.gain.setValueAtTime(.4, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + .8);
  osc.start(); osc.stop(ctx.currentTime + .8);

  if (pomoState.phase === 'work') {
    pomoState.completed++;
    if (pomoState.completed >= 5) unlockAchievement('pomodoro5');
    pomoState.phase = 'break'; pomoState.remaining = 5 * 60;
    $('#pomoPhase').textContent = '☕ Descanso — ¡lo lograste!';
    showToast('🍅 Pomodoro completado', '5 minutos de descanso merecidos.', 'success');
  } else {
    pomoState.phase = 'work'; pomoState.remaining = 25 * 60;
    $('#pomoPhase').textContent = '🎯 Nueva sesión de trabajo';
  }
  tickPomodoro();
}

function initPomodoro() {
  $('#pomoPause').addEventListener('click', () => {
    pomoState.paused = !pomoState.paused;
    $('#pomoPause').textContent = pomoState.paused ? '▶ Reanudar' : '⏸ Pausar';
  });
  $('#pomoStop').addEventListener('click', () => {
    clearInterval(pomoState.interval);
    Object.assign(pomoState, { running:false, paused:false, taskIdx:null });
    $('#pomoModal').hidden = true;
    document.title = 'Mentor IA · Tu mentor académico y emocional 24/7';
    renderPlan();
  });
}

// ====================================================================
// VOZ
// ====================================================================

function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { $('#voiceBtn').style.display = 'none'; return; }
  const rec = new SR(); rec.lang = 'es-CO'; rec.continuous = false;
  rec.onresult = e => { $('#input').value = e.results[0][0].transcript; };
  rec.onend    = ()  => { $('#voiceBtn').classList.remove('recording'); };
  $('#voiceBtn').addEventListener('click', () => {
    if ($('#voiceBtn').classList.contains('recording')) { rec.stop(); }
    else { rec.start(); $('#voiceBtn').classList.add('recording'); }
  });
}

// ====================================================================
// PERFIL / ONBOARDING
// ====================================================================

function updateProfileUI() {
  if (profile.name) {
    $('#profileBadgeText').textContent = `Hola, ${profile.name} 👋`;
    if (profile.carrera) {
      const chip = $('#profileChip');
      chip.textContent = profile.carrera;
      chip.style.display = 'inline-flex';
    }
  }
}

function initProfile() {
  if (profile.name) {
    $('#profileName').value    = profile.name;
    $('#profileUniv').value    = profile.univ || '';
    $('#profileCarrera').value = profile.carrera || '';
    $('#profileSemestre').value= profile.semestre || '';
  }

  $('#profileBadge').addEventListener('click', () => { $('#onboardingModal').hidden = false; });
  $('#profileBadge').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') $('#onboardingModal').hidden = false; });

  $('#saveProfile').addEventListener('click', () => {
    profile = { name: $('#profileName').value.trim(), univ: $('#profileUniv').value.trim(), carrera: $('#profileCarrera').value.trim(), semestre: $('#profileSemestre').value };
    save('mentoria_profile', profile);
    $('#onboardingModal').hidden = true;
    updateProfileUI();
    showToast('✅ Perfil guardado', `¡Hola, ${profile.name || 'estudiante'}!`, 'success');
  });

  $('#skipOnboarding').addEventListener('click', () => { $('#onboardingModal').hidden = true; save('mentoria_skipped', true); });
  $('#skipOnboarding').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') $('#onboardingModal').hidden = true; });

  if (!profile.name && !localStorage.getItem('mentoria_skipped')) {
    setTimeout(() => { $('#onboardingModal').hidden = false; }, 1800);
  }
}

// ====================================================================
// HAMBURGER MENU
// ====================================================================

function initHamburger() {
  const hamburger = $('#hamburger'), drawer = $('#navDrawer');
  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
    if (open) { drawer.classList.add('open'); drawer.style.display = 'flex'; }
    else { drawer.classList.remove('open'); setTimeout(() => { drawer.style.display = ''; }, 250); }
  });
  document.querySelectorAll('.drawer-link').forEach(a => a.addEventListener('click', () => {
    hamburger.classList.remove('open'); hamburger.setAttribute('aria-expanded', 'false');
    drawer.classList.remove('open'); setTimeout(() => { drawer.style.display = ''; }, 250);
  }));
}

// ====================================================================
// ANIMATED COUNTERS
// ====================================================================

function animateCounter(el) {
  const targetStr = el.dataset.target, prefix = el.dataset.prefix || '', suffix = el.dataset.suffix || '';
  const isDecimal = targetStr?.includes('.');
  const target = parseFloat(targetStr);
  if (isNaN(target)) return;
  const t0 = performance.now();
  const tick = now => {
    const p = Math.min((now - t0) / 1800, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + (isDecimal ? (target * ease).toFixed(1) : Math.round(target * ease).toLocaleString('es-CO')) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && e.target.dataset.target && !e.target.dataset.animated) {
        e.target.dataset.animated = '1';
        animateCounter(e.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-target]').forEach(el => obs.observe(el));
}

// ====================================================================
// PERSONALIZADOR DE AVATAR (NETORAX)
// ====================================================================

let customAvatar = localStorage.getItem('mentoria_netorax_avatar') || 'logo.png';
let tempAvatarSelection = customAvatar;

function applyAvatarToUI(src) {
  const avImg = $('#netoraxAvatarImg');
  if (avImg) avImg.src = src;
  const modalPreview = $('#avatarModalPreview');
  if (modalPreview) modalPreview.src = src;
}

function initAvatarCustomizer() {
  applyAvatarToUI(customAvatar);

  const modal = $('#avatarModal');
  const openBtn = $('#openAvatarModalBtn');
  const avatarBtn = $('#netoraxAvatarBtn');
  const closeBtn = $('#closeAvatarBtn');
  const saveBtn = $('#saveAvatarBtn');
  const resetBtn = $('#resetAvatarBtn');
  const presets = $('#avatarPresets');
  const fileInput = $('#customAvatarInput');
  const urlInput = $('#customAvatarUrl');
  const applyUrlBtn = $('#applyAvatarUrlBtn');

  function openModal() {
    tempAvatarSelection = customAvatar;
    applyAvatarToUI(tempAvatarSelection);
    highlightActivePreset(tempAvatarSelection);
    if (modal) modal.hidden = false;
  }

  function closeModal() {
    if (modal) modal.hidden = true;
  }

  function highlightActivePreset(src) {
    if (!presets) return;
    presets.querySelectorAll('.avatar-preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.src === src);
    });
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (avatarBtn) avatarBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal();
    });
  }

  if (presets) {
    presets.addEventListener('click', e => {
      const btn = e.target.closest('.avatar-preset-btn');
      if (!btn) return;
      tempAvatarSelection = btn.dataset.src;
      const prev = $('#avatarModalPreview');
      if (prev) prev.src = tempAvatarSelection;
      highlightActivePreset(tempAvatarSelection);
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 2.5 * 1024 * 1024) {
        showToast('La imagen supera los 2MB. Elige una más liviana.');
        return;
      }
      const reader = new FileReader();
      reader.onload = ev => {
        tempAvatarSelection = ev.target.result;
        const prev = $('#avatarModalPreview');
        if (prev) prev.src = tempAvatarSelection;
        highlightActivePreset('');
        showToast('Imagen cargada en vista previa. Pulsa "Guardar cambios".');
      };
      reader.readAsDataURL(file);
    });
  }

  if (applyUrlBtn && urlInput) {
    applyUrlBtn.addEventListener('click', () => {
      const url = urlInput.value.trim();
      if (!url) return;
      const testImg = new Image();
      testImg.onload = () => {
        tempAvatarSelection = url;
        const prev = $('#avatarModalPreview');
        if (prev) prev.src = tempAvatarSelection;
        highlightActivePreset('');
        showToast('Enlace válido. Pulsa "Guardar cambios".');
      };
      testImg.onerror = () => {
        showToast('No se pudo cargar la imagen desde ese enlace.');
      };
      testImg.src = url;
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      customAvatar = tempAvatarSelection;
      localStorage.setItem('mentoria_netorax_avatar', customAvatar);
      applyAvatarToUI(customAvatar);
      closeModal();
      launchConfetti();
      showToast('¡Logo de NETORAX actualizado! ✨', 'Tu nuevo avatar ya está activo y guardado en tu navegador.', 'avatar success', customAvatar);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem('mentoria_netorax_avatar');
      customAvatar = 'logo.png';
      tempAvatarSelection = 'logo.png';
      applyAvatarToUI(customAvatar);
      highlightActivePreset(customAvatar);
      showToast('Logo restablecido', 'Se restauró el logo oficial con la X de mentoriax.', 'success', 'logo.png');
    });
  }
}

// ====================================================================
// WELLBEING FAB
// ====================================================================

function initWellbeingFab() {
  $('#wellbeingFab').addEventListener('click', () => {
    const diario = $('#diario');
    diario.scrollIntoView({ behavior: 'smooth', block: 'start' });
    diario.classList.add('wellbeing-highlight');
    setTimeout(() => diario.classList.remove('wellbeing-highlight'), 2200);
  });
}

// ====================================================================
// PWA SERVICE WORKER
// ====================================================================

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

// ====================================================================
// INICIALIZACIÓN
// ====================================================================

updateProfileUI();
initProfile();
initChat();
initAvatarCustomizer();
initBreathing();
initGrounding();
initPhq();
initPlanificador();
initPomodoro();
initVoice();
initHamburger();
initCounters();
initWellbeingFab();
renderAchievements();
renderPlan();
renderMoodChart();
renderWeeklySummary();
loadStreak();

// Afirmación inicial
updateAffirmation(mood);
