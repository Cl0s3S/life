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
      val:   '2 / 7',
      sub:   'Budget · Portfolio — 5 en construction',
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
  { num: '03', icon: '🗓️', name: 'Planning',  desc: 'Emploi du temps optimisé',             badge: 'active', label: 'en cours' },
  { num: '04', icon: '📚', name: 'Tracker',   desc: 'Lecture · cours · progression',        badge: 'soon',   label: 'à venir'  },
  { num: '05', icon: '🎮', name: 'Backlog',   desc: 'Jeux · statuts · temps de jeu',        badge: 'soon',   label: 'à venir'  },
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
