/* ============================================
   LIFE DASHBOARD — app.js
   ============================================ */

'use strict';

/* ═══════════════════════════════════════════
   DATE
═══════════════════════════════════════════ */
const NOW = new Date();

document.getElementById('hdr-date').textContent =
  NOW.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/* ═══════════════════════════════════════════
   CONFIG BUDGET
   — doit correspondre à ton app budget
═══════════════════════════════════════════ */
const BASE_BUDGET = 50;

const CATS = [
  { name: 'Nourriture', color: '#34d399', pct: 0.25 },
  { name: 'Loisirs',    color: '#60a5fa', pct: 0.30 },
  { name: 'Matériel',   color: '#f59e0b', pct: 0.30 },
  { name: 'Épargne',    color: '#a3e635', pct: 0.15 },
];

/* ═══════════════════════════════════════════
   LECTURE localStorage (budget app)
═══════════════════════════════════════════ */
let expenses = [], incomes = [];
try { expenses = JSON.parse(localStorage.getItem('budget_v4')  || '[]'); } catch(e) {}
try { incomes  = JSON.parse(localStorage.getItem('budget_inc') || '[]'); } catch(e) {}

function getMonthKey(dateStr) {
  const d = new Date(dateStr);
  return d.getFullYear() + '-' + (d.getMonth() + 1);
}

const CMK = NOW.getFullYear() + '-' + (NOW.getMonth() + 1);

function fmt(n) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €';
}

/* ═══════════════════════════════════════════
   CALCULS BUDGET
═══════════════════════════════════════════ */
const extra = incomes
  .filter(i => getMonthKey(i.date) === CMK)
  .reduce((a, b) => a + b.amount, 0);

const BUDGET = BASE_BUDGET + extra;

const totals = {};
CATS.forEach(c => totals[c.name] = 0);
expenses
  .filter(e => getMonthKey(e.date) === CMK)
  .forEach(e => { if (totals[e.cat] !== undefined) totals[e.cat] += e.amount; });

const totalSpent = Object.values(totals).reduce((a, b) => a + b, 0);
const totalLeft  = Math.max(BUDGET - totalSpent, 0);
const pct        = Math.min((totalSpent / BUDGET) * 100, 100);

/* ═══════════════════════════════════════════
   RENDER BUDGET HERO
═══════════════════════════════════════════ */
document.getElementById('b-month').textContent =
  NOW.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

const bLeftEl = document.getElementById('b-left');
bLeftEl.textContent = fmt(totalLeft);
bLeftEl.className = 'b-amount' + (pct >= 100 ? ' danger' : pct >= 75 ? ' warning' : '');

const barEl = document.getElementById('b-bar');
barEl.className = 'b-bar' + (pct >= 100 ? ' danger' : pct >= 75 ? ' warning' : '');
setTimeout(() => { barEl.style.width = pct.toFixed(1) + '%'; }, 200);

document.getElementById('b-total').textContent = fmt(BUDGET);
document.getElementById('b-spent').textContent = fmt(totalSpent);
document.getElementById('b-saved').textContent = fmt(totals['Épargne'] || 0);

/* ═══════════════════════════════════════════
   RENDER ENVELOPES
═══════════════════════════════════════════ */
const envGrid = document.getElementById('env-grid');

CATS.forEach(c => {
  const alloc = Math.round(BUDGET * c.pct * 100) / 100;
  const s     = totals[c.name] || 0;
  const p     = Math.min((s / alloc) * 100, 100).toFixed(1);
  const left  = Math.max(alloc - s, 0);
  const over  = s > alloc;

  const card = document.createElement('div');
  card.className = 'env-card';
  card.innerHTML = `
    <div class="env-top">
      <div class="env-dot" style="background:${c.color}"></div>
      <span class="env-name">${c.name}</span>
      <span class="env-alloc">${fmt(alloc)}</span>
    </div>
    <div class="env-bar-bg">
      <div class="env-bar-fill" style="background:${over ? '#f87171' : c.color}; width:0%" data-w="${p}"></div>
    </div>
    <div class="env-foot">
      <span>${fmt(s)} dépensé</span>
      <span class="${over ? 'over' : ''}">${over ? '−' + fmt(s - alloc) : fmt(left) + ' reste'}</span>
    </div>`;
  envGrid.appendChild(card);
});

requestAnimationFrame(() => {
  document.querySelectorAll('.env-bar-fill[data-w]').forEach(b => {
    b.style.width = b.dataset.w + '%';
  });
});

/* ═══════════════════════════════════════════
   RENDER HISTORIQUE (6 dernières entrées)
═══════════════════════════════════════════ */
const histList = document.getElementById('hist-list');

const allTx = [
  ...expenses.filter(e => getMonthKey(e.date) === CMK).map(e => ({ ...e, type: 'expense' })),
  ...incomes .filter(i => getMonthKey(i.date) === CMK).map(i => ({ ...i, type: 'income'  })),
].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);

if (!allTx.length) {
  histList.innerHTML = `<div class="h-empty">aucune entrée ce mois — <a href="https://cl0s3s.github.io/budget/" target="_blank">ouvre Budget ↗</a></div>`;
} else {
  allTx.forEach(e => {
    const isInc = e.type === 'income';
    const cat   = isInc ? null : CATS.find(c => c.name === e.cat) || CATS[0];
    const color = isInc ? '#a3e635' : (cat ? cat.color : '#6b6a6f');

    const div = document.createElement('div');
    div.className = 'h-item';
    div.innerHTML = `
      <div class="h-dot" style="background:${color}"></div>
      <div class="h-info">
        <div class="h-name">${e.name}</div>
        <div class="h-cat">${isInc ? 'revenu' : e.cat}</div>
      </div>
      <div class="h-amt" style="color:${isInc ? '#a3e635' : ''}">${isInc ? '+' : '−'}${fmt(e.amount)}</div>`;
    histList.appendChild(div);
  });
}

/* ═══════════════════════════════════════════
   RENDER STATS ANALYSE
═══════════════════════════════════════════ */
const statCards = document.getElementById('stat-cards');
const monthExp  = expenses.filter(e => getMonthKey(e.date) === CMK);

if (!monthExp.length) {
  statCards.innerHTML = `<div class="stat-card">aucune dépense enregistrée ce mois.</div>`;
} else {
  const byCat  = {};
  monthExp.forEach(e => byCat[e.cat] = (byCat[e.cat] || 0) + e.amount);
  const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];
  const days   = NOW.getDate();
  const avgDay = totalSpent / days;
  const daysInMonth = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 0).getDate();

  statCards.innerHTML = `
    <div class="stat-card">catégorie principale : <strong>${topCat[0]}</strong> — ${fmt(topCat[1])}</div>
    <div class="stat-card">moyenne par jour : <strong>${fmt(avgDay)}</strong></div>
    <div class="stat-card">projection fin de mois : <strong>${fmt(avgDay * daysInMonth)}</strong></div>`;
}

/* ═══════════════════════════════════════════
   PORTFOLIO — SKILLS
═══════════════════════════════════════════ */
const SKILLS = [
  { name: 'Cybersécurité', pct: 85 },
  { name: 'Python / IA',   pct: 78 },
  { name: 'React / JS',    pct: 72 },
  { name: 'Linux / Sys',   pct: 80 },
  { name: 'Design sys.',   pct: 60 },
  { name: 'TypeScript',    pct: 74 },
];

const skillsList = document.getElementById('skills-list');
SKILLS.forEach(s => {
  const row = document.createElement('div');
  row.className = 'skill-row';
  row.innerHTML = `
    <span class="skill-name">${s.name}</span>
    <div class="skill-bar-bg">
      <div class="skill-bar-fill" style="width:0%" data-w="${s.pct}"></div>
    </div>
    <span class="skill-pct">${s.pct}%</span>`;
  skillsList.appendChild(row);
});

setTimeout(() => {
  document.querySelectorAll('.skill-bar-fill[data-w]').forEach(b => {
    b.style.width = b.dataset.w + '%';
  });
}, 300);

/* ── Tags stack ── */
const TAGS = ['Pentest', 'CTF', 'Machine Learning', 'Node.js', 'Git', 'Docker', 'Bash', 'TypeScript', 'C', 'Rust'];
const tagsRow = document.getElementById('tags-row');
TAGS.forEach((t, i) => {
  const span = document.createElement('span');
  span.className = 'tag' + (i < 2 ? ' accent' : '');
  span.textContent = t;
  tagsRow.appendChild(span);
});

/* ═══════════════════════════════════════════
   PROJETS
═══════════════════════════════════════════ */
const PROJECTS = [
  {
    name: 'Life Dashboard',
    desc: 'Hub central — regroupe tous les outils de gestion de vie.',
    tags: ['HTML', 'CSS', 'JS'],
    wip:  true,
    url:  null,
  },
  {
    name: 'Budget Tracker',
    desc: 'Gestionnaire de budget mensuel avec enveloppes et visualisation.',
    tags: ['Chart.js', 'PWA', 'localStorage'],
    url:  'https://cl0s3s.github.io/budget/',
  },
  {
    name: 'zer0 Portfolio',
    desc: 'Portfolio personnel orienté Cybersécurité & IA.',
    tags: ['HTML', 'CSS', 'JS', 'GitHub Pages'],
    url:  'https://cl0s3s.github.io/zer0-portfolio/',
  },
];

const projList = document.getElementById('proj-list');
PROJECTS.forEach(p => {
  const div = document.createElement('div');
  div.className = 'proj-card';

  const tagsHtml = p.tags.map(t => `<span class="ptag">${t}</span>`).join('');
  const wipHtml  = p.wip ? '<span class="ptag wip">en cours</span>' : '';
  const linkHtml = p.url
    ? `<a href="${p.url}" target="_blank" style="margin-left:auto;font-size:10px;color:var(--accent);text-decoration:none">↗</a>`
    : '';

  div.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
      <div class="proj-name">${p.name}</div>${linkHtml}
    </div>
    <div class="proj-desc">${p.desc}</div>
    <div class="proj-tags">${tagsHtml}${wipHtml}</div>`;
  projList.appendChild(div);
});

/* ═══════════════════════════════════════════
   INSIGHTS
═══════════════════════════════════════════ */
const insightsBody = document.getElementById('insights-body');
const currentMonthIncomes = incomes.filter(i => getMonthKey(i.date) === CMK);

if (!monthExp.length && !currentMonthIncomes.length) {
  insightsBody.innerHTML = `
    <div class="insights-empty">
      Ajoute des données dans <a href="https://cl0s3s.github.io/budget/" target="_blank">Budget ↗</a> pour voir l'analyse ici.
    </div>`;
} else {
  const saved       = totals['Épargne'] || 0;
  const saveRate    = BUDGET > 0 ? (saved / BUDGET * 100) : 0;
  const daysInMonth = new Date(NOW.getFullYear(), NOW.getMonth() + 1, 0).getDate();
  const projEnd     = (totalSpent / Math.max(NOW.getDate(), 1)) * daysInMonth;
  const topCatE     = Object.entries(totals).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])[0];

  const INSIGHT_CARDS = [
    {
      icon:  '💰',
      label: 'budget consommé',
      val:   `${pct.toFixed(0)}%`,
      sub:   `${fmt(totalSpent)} / ${fmt(BUDGET)}`,
      cls:   pct >= 100 ? 'insight-danger' : pct >= 75 ? 'insight-warn' : 'insight-ok',
    },
    {
      icon:  '🌱',
      label: "taux d'épargne",
      val:   `${saveRate.toFixed(0)}%`,
      sub:   saveRate >= 15
        ? 'objectif 15% atteint ✓'
        : `objectif : 15% — ${fmt(BUDGET * 0.15 - saved)} manquants`,
      cls:   saveRate >= 15 ? 'insight-ok' : 'insight-warn',
    },
    {
      icon:  '📌',
      label: 'catégorie principale',
      val:   topCatE ? topCatE[0] : '—',
      sub:   topCatE ? fmt(topCatE[1]) + ' ce mois' : '',
      cls:   '',
    },
    {
      icon:  '📈',
      label: 'projection fin de mois',
      val:   fmt(projEnd),
      sub:   projEnd > BUDGET
        ? `dépassement estimé : ${fmt(projEnd - BUDGET)}`
        : `marge restante : ${fmt(BUDGET - projEnd)}`,
      cls:   projEnd > BUDGET ? 'insight-warn' : 'insight-ok',
    },
    {
      icon:  '🧩',
      label: 'modules actifs',
      val:   '5 / 7',
      sub:   'Budget · Portfolio · Planning · Tracker · Backlog — 2 en construction',
      cls:   '',
    },
    {
      icon:  '📅',
      label: 'données analysées',
      val:   `${monthExp.length} entrées`,
      sub:   `depuis le 1er ${NOW.toLocaleDateString('fr-FR', { month: 'long' })}`,
      cls:   '',
    },
  ];

  const grid = document.createElement('div');
  grid.className = 'insights-grid';

  INSIGHT_CARDS.forEach(c => {
    const card = document.createElement('div');
    card.className = 'insight-card';
    card.innerHTML = `
      <div class="insight-icon">${c.icon}</div>
      <div>
        <div class="insight-label">${c.label}</div>
        <div class="insight-val ${c.cls}">${c.val}</div>
        <div class="insight-sub">${c.sub}</div>
      </div>`;
    grid.appendChild(card);
  });

  insightsBody.appendChild(grid);
}

/* ═══════════════════════════════════════════
   ROADMAP
═══════════════════════════════════════════ */
const ROADMAP = [
  { num: '01', icon: '💰', name: 'Budget',    desc: 'Suivi des dépenses & revenus',        badge: 'done',   label: 'terminé'  },
  { num: '02', icon: '💼', name: 'Portfolio', desc: 'CV · identité · projets',              badge: 'done',   label: 'terminé'  },
  { num: '03', icon: '🗓️', name: 'Planning',  desc: 'Emploi du temps optimisé',             badge: 'done',   label: 'terminé'  },
  { num: '04', icon: '📚', name: 'Tracker',   desc: 'Lecture · cours · progression',        badge: 'done',   label: 'terminé'  },
  { num: '05', icon: '🎮', name: 'Backlog',   desc: 'Jeux · statuts · temps de jeu',        badge: 'done',   label: 'terminé'  },
  { num: '06', icon: '📥', name: 'Inbox',     desc: 'Centralisation des emails importants', badge: 'soon',   label: 'à venir'  },
  { num: '07', icon: '📊', name: 'Insights',  desc: 'Analyse globale · recommandations IA', badge: 'soon',   label: 'dernier'  },
];

const roadmapEl = document.getElementById('roadmap');
ROADMAP.forEach(r => {
  const div = document.createElement('div');
  div.className = 'rm-item';
  div.innerHTML = `
    <div class="rm-num">${r.num}</div>
    <div class="rm-icon">${r.icon}</div>
    <div class="rm-info">
      <div class="rm-name">${r.name}</div>
      <div class="rm-desc">${r.desc}</div>
    </div>
    <div class="rm-badge ${r.badge}">${r.label}</div>`;
  roadmapEl.appendChild(div);
});

/* ═══════════════════════════════════════════
   PLANNING PANEL — aperçu depuis le dashboard
═══════════════════════════════════════════ */
(function renderPlanningPanel() {
  const el = document.getElementById('planning-body');
  if (!el) return;

  const COLORS_P = {
    wake: '#e2ff7c', meal: '#60a5fa', course: '#f59e0b',
    revision: '#34d399', leisure: '#a78bfa', sleep: '#6b6a6f',
  };
  const LABELS_P = {
    wake: 'réveil', meal: 'repas', course: 'cours',
    revision: 'révision', leisure: 'temps libre', sleep: 'coucher',
  };

  function toTime(mins) {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
  }
  function durLabel(mins) {
    if (mins <= 0) return '0 min';
    const h = Math.floor(mins / 60), m = mins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h`;
    return `${h}h${String(m).padStart(2,'0')}`;
  }

  let data = null;
  try { data = JSON.parse(localStorage.getItem('planning_v1') || 'null'); } catch(e) {}

  const tomorrow = (() => { const d = new Date(); d.setDate(d.getDate()+1); return d.toISOString().slice(0,10); })();
  const today    = new Date().toISOString().slice(0, 10);

  if (!data || (data.date !== tomorrow && data.date !== today)) {
    el.innerHTML = `
      <div style="padding:20px 0;text-align:center;color:var(--muted);font-size:12px">
        aucun planning — <a href="https://cl0s3s.github.io/planning/" target="_blank" style="color:var(--accent);text-decoration:none">planifie demain ↗</a>
      </div>`;
    return;
  }

  // Stats chips
  const s = data.stats || {};
  const chips = [
    { color: COLORS_P.course,   val: durLabel(s.totalCourse   || 0), lbl: 'cours'    },
    { color: COLORS_P.revision, val: durLabel(s.totalRevision || 0), lbl: 'révision' },
    { color: COLORS_P.leisure,  val: durLabel(s.totalLeisure  || 0), lbl: 'loisirs'  },
  ];

  const statsHtml = chips.map(c => `
    <div style="display:flex;align-items:center;gap:6px;padding:5px 10px;border:1px solid var(--border);border-radius:99px;font-size:11px;background:var(--bg3)">
      <div style="width:6px;height:6px;border-radius:50%;background:${c.color};flex-shrink:0"></div>
      <span style="color:var(--text);font-weight:500">${c.val}</span>
      <span style="color:var(--muted)">${c.lbl}</span>
    </div>`).join('');

  // Timeline (on affiche les 6 premiers blocs)
  const preview = (data.blocks || []).slice(0, 7);
  const tlHtml = preview.map(b => {
    const color = COLORS_P[b.type] || '#6b6a6f';
    const tag   = LABELS_P[b.type] || b.type;
    const timeStr = b.dur > 0
      ? `${toTime(b.start)} → ${toTime(b.end)}`
      : toTime(b.start);
    return `
      <div style="display:flex;align-items:center;gap:0;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="width:80px;flex-shrink:0;font-family:var(--font-disp);font-size:12px;font-weight:600;color:var(--text)">${toTime(b.start)}</div>
        <div style="width:3px;align-self:stretch;background:${color};margin-right:12px;border-radius:2px"></div>
        <div style="flex:1;font-size:12px;color:var(--text)">${b.name}</div>
        <div style="font-size:10px;padding:2px 7px;border-radius:99px;background:${color}18;color:${color};border:1px solid ${color}44;white-space:nowrap">${tag}</div>
      </div>`;
  }).join('');

  const moreCount = (data.blocks || []).length - preview.length;
  const moreHtml  = moreCount > 0
    ? `<div style="padding:10px 0;text-align:center;font-size:11px;color:var(--muted)">+${moreCount} blocs — <a href="https://cl0s3s.github.io/planning/" target="_blank" style="color:var(--accent);text-decoration:none">voir tout ↗</a></div>`
    : '';

  const dateObj = new Date(data.date + 'T12:00:00');
  const dateLabel = data.date === today ? "aujourd'hui" :
    dateObj.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });

  el.innerHTML = `
    <div style="font-size:12px;color:var(--muted);margin-bottom:12px">${dateLabel}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">${statsHtml}</div>
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-md);padding:0 14px">
      ${tlHtml}${moreHtml}
    </div>`;
})();

/* ═══════════════════════════════════════════
   TRACKER PANEL — aperçu depuis le dashboard
═══════════════════════════════════════════ */
(function renderTrackerPanel() {
  const el = document.getElementById('tracker-body');
  if (!el) return;

  let books = [];
  try { books = JSON.parse(localStorage.getItem('tracker_v1') || '[]'); } catch(e) {}

  const TYPE_EMOJI = { roman: '📖', manga: '🎌', bd: '🖼' };

  function getCurrentPage(book) {
    if (!book.sessions.length) return book.startPage;
    return book.sessions[book.sessions.length - 1].page;
  }
  function getProgress(book) {
    const cur = getCurrentPage(book);
    return Math.min(((cur - book.startPage) / (book.totalPages - book.startPage)) * 100, 100);
  }

  if (!books.length) {
    el.innerHTML = `<div style="padding:20px 0;text-align:center;color:var(--muted);font-size:12px">
      bibliothèque vide — <a href="https://cl0s3s.github.io/tracker/" target="_blank" style="color:var(--accent);text-decoration:none">ajouter un livre ↗</a>
    </div>`;
    return;
  }

  const reading = books.filter(b => b.status === 'reading');
  const done    = books.filter(b => b.status === 'done').length;
  const totalPages = books.reduce((acc, b) => {
    const cur = getCurrentPage(b);
    return acc + (cur - b.startPage);
  }, 0);

  const statsHtml = `
    <div style="display:flex;gap:0;margin-bottom:16px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden">
      <div style="flex:1;padding:12px 14px;border-right:1px solid var(--border)">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">en cours</div>
        <div style="font-family:var(--font-disp);font-size:20px;font-weight:700;color:var(--text)">${reading.length}</div>
      </div>
      <div style="flex:1;padding:12px 14px;border-right:1px solid var(--border)">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">terminés</div>
        <div style="font-family:var(--font-disp);font-size:20px;font-weight:700;color:var(--text)">${done}</div>
      </div>
      <div style="flex:1;padding:12px 14px">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">pages lues</div>
        <div style="font-family:var(--font-disp);font-size:20px;font-weight:700;color:var(--text)">${totalPages.toLocaleString('fr-FR')}</div>
      </div>
    </div>`;

  const booksHtml = reading.slice(0, 4).map(book => {
    const pct = getProgress(book);
    const cur = getCurrentPage(book);
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
        <div style="font-size:20px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${book.color}22;border-radius:6px;flex-shrink:0">${TYPE_EMOJI[book.type] || '📖'}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:4px">${book.title}</div>
          <div style="height:2px;background:var(--bg3);border-radius:2px;overflow:hidden">
            <div style="height:2px;background:${book.color};width:${pct.toFixed(1)}%;border-radius:2px"></div>
          </div>
        </div>
        <div style="font-family:var(--font-disp);font-size:13px;font-weight:600;color:${book.color};flex-shrink:0">${pct.toFixed(0)}%</div>
      </div>`;
  }).join('');

  const moreHtml = reading.length > 4
    ? `<div style="padding:10px 0;text-align:center;font-size:11px;color:var(--muted)">+${reading.length - 4} autres — <a href="https://cl0s3s.github.io/tracker/" target="_blank" style="color:var(--accent);text-decoration:none">voir tout ↗</a></div>`
    : '';

  el.innerHTML = statsHtml + `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-md);padding:0 14px">${booksHtml || '<div style="padding:14px 0;text-align:center;font-size:12px;color:var(--muted)">aucun livre en cours</div>'}${moreHtml}</div>`;
})();

/* ═══════════════════════════════════════════
   BACKLOG PANEL — aperçu depuis le dashboard
═══════════════════════════════════════════ */
(function renderBacklogPanel() {
  const el = document.getElementById('backlog-body');
  if (!el) return;

  let games = [];
  try { games = JSON.parse(localStorage.getItem('backlog_v1') || '[]'); } catch(e) {}

  function getTotalMins(g) { return g.sessions.reduce((a, s) => a + s.durationMins, 0); }
  function fmtH(m) {
    const h = Math.floor(m / 60), mn = m % 60;
    if (!h) return `${mn}min`;
    if (!mn) return `${h}h`;
    return `${h}h${String(mn).padStart(2,'0')}`;
  }

  const STATUS_COLOR = { wishlist:'#6b6a6f', playing:'#60a5fa', done:'#34d399', abandoned:'#f87171' };
  const STATUS_LABEL = { wishlist:'wishlist', playing:'en cours', done:'terminé', abandoned:'abandonné' };

  if (!games.length) {
    el.innerHTML = `<div style="padding:20px 0;text-align:center;color:var(--muted);font-size:12px">
      backlog vide — <a href="https://cl0s3s.github.io/backlog/" target="_blank" style="color:var(--accent);text-decoration:none">ajouter un jeu ↗</a>
    </div>`;
    return;
  }

  const totalMins  = games.reduce((a, g) => a + getTotalMins(g), 0);
  const playing    = games.filter(g => g.status === 'playing').length;
  const done       = games.filter(g => g.status === 'done').length;
  const wishlist   = games.filter(g => g.status === 'wishlist').length;

  // Ce mois
  const now = new Date();
  const minsMonth = games.reduce((acc, g) => acc + g.sessions.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((a, s) => a + s.durationMins, 0), 0);

  const statsHtml = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-md);overflow:hidden;margin-bottom:16px">
      <div style="padding:12px 14px;border-right:1px solid var(--border)">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">en cours</div>
        <div style="font-family:var(--font-disp);font-size:20px;font-weight:700;color:#60a5fa">${playing}</div>
      </div>
      <div style="padding:12px 14px;border-right:1px solid var(--border)">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">terminés</div>
        <div style="font-family:var(--font-disp);font-size:20px;font-weight:700;color:#34d399">${done}</div>
      </div>
      <div style="padding:12px 14px;border-right:1px solid var(--border)">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">wishlist</div>
        <div style="font-family:var(--font-disp);font-size:20px;font-weight:700;color:var(--text)">${wishlist}</div>
      </div>
      <div style="padding:12px 14px">
        <div style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:2px">ce mois</div>
        <div style="font-family:var(--font-disp);font-size:20px;font-weight:700;color:var(--accent)">${fmtH(minsMonth)}</div>
      </div>
    </div>`;

  // Top 5 jeux par temps
  const topGames = [...games].filter(g => getTotalMins(g) > 0)
    .sort((a, b) => getTotalMins(b) - getTotalMins(a)).slice(0, 5);

  // En cours
  const inProgress = games.filter(g => g.status === 'playing').slice(0, 3);
  const displayList = inProgress.length ? inProgress : topGames.slice(0, 4);
  const listTitle   = inProgress.length ? 'en cours' : 'top jeux';

  const listHtml = displayList.map(g => {
    const mins = getTotalMins(g);
    const color = STATUS_COLOR[g.status];
    const coverHtml = g.coverUrl
      ? `<img src="${g.coverUrl}" alt="" style="width:36px;height:36px;object-fit:cover;border-radius:6px;flex-shrink:0" onerror="this.style.display='none'">`
      : `<div style="width:36px;height:36px;background:var(--bg3);border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🎮</div>`;
    return `
      <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
        ${coverHtml}
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${g.title}</div>
          <div style="font-size:10px;color:${color}">${STATUS_LABEL[g.status]} · ${g.platform}</div>
        </div>
        <div style="font-family:var(--font-disp);font-size:13px;font-weight:600;color:var(--text);white-space:nowrap">${mins ? fmtH(mins) : '—'}</div>
      </div>`;
  }).join('');

  const moreCount = games.filter(g => g.status === 'playing').length > 3
    ? `<div style="padding:9px 0;text-align:center;font-size:11px;color:var(--muted)">+${games.filter(g=>g.status==='playing').length-3} jeux — <a href="https://cl0s3s.github.io/backlog/" target="_blank" style="color:var(--accent);text-decoration:none">voir tout ↗</a></div>`
    : '';

  el.innerHTML = statsHtml + `
    <div style="font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);margin-bottom:10px">${listTitle}</div>
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-md);padding:0 14px">
      ${listHtml || '<div style="padding:14px 0;text-align:center;font-size:12px;color:var(--muted)">aucun jeu</div>'}
      ${moreCount}
    </div>`;
})();

/* ═══════════════════════════════════════════
   ENTRANCE ANIMATIONS
═══════════════════════════════════════════ */
(function initReveal() {
  const els = document.querySelectorAll('[data-anim]');

  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => entry.target.classList.add('visible'), +delay);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  els.forEach(el => io.observe(el));
})();
