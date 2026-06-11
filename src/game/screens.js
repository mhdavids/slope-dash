// Full-screen flows: title, level select, level complete, notebook, help.

import { G, qs, el, rich } from '../engine/g.js';
import { Sfx } from '../engine/audio.js';
import { WORLDS, NOTEBOOK } from '../data/worlds.js';
import { Level } from './level.js';

const MEDAL_ICON = { gold: '🥇', silver: '🥈', bronze: '🥉' };

export const Screens = {
  init() {
    this.titleEl = qs('#title');
    this.selectEl = qs('#select');
    this.completeEl = qs('#complete');
    this.notebookEl = qs('#notebook');
    this.helpEl = qs('#help');
    qs('#title-start').addEventListener('click', () => { G.state.markStarted(); this.select(); });
    qs('#title-help').addEventListener('click', () => this.help());
    qs('#help-close').addEventListener('click', () => this.closeHelp());
  },

  hideAll() {
    ['#title', '#select', '#complete', '#notebook', '#help'].forEach((s) => qs(s).classList.add('hidden'));
  },

  showTitle() {
    G.mode = 'title';
    G.hud.hide();
    this.hideAll();
    this.titleEl.classList.remove('hidden');
    qs('#title-start').textContent = G.state.hasSave() ? 'Continue ▸' : 'Start ▸';
  },

  // ---- level select ----
  select() {
    G.mode = 'select';
    G.hud.hide();
    this.hideAll();
    const rows = WORLDS.map((w) => `
      <div class="sel-world" style="--w:${w.pal.accent}">
        <div class="sel-wname">${w.name} <span class="sel-tag">${w.tagline}</span></div>
        <div class="sel-cards">
          ${w.levels.map((l) => {
            const unlocked = G.state.isUnlocked(l.id);
            const medal = G.state.medalFor(l.id);
            return `<button class="sel-card ${unlocked ? '' : 'locked'}" data-id="${l.id}" ${unlocked ? '' : 'disabled'}>
              <span class="sel-lname">${l.name}</span>
              <span class="sel-medal">${medal ? MEDAL_ICON[medal] : unlocked ? '▸' : '🔒'}</span>
            </button>`;
          }).join('')}
        </div>
      </div>`).join('');
    this.selectEl.innerHTML = `
      <div class="select-inner">
        <h1 class="select-logo">SLOPE DASH</h1>
        <div class="select-sub">run the numbers · ${G.state.medalCount().gold} gold</div>
        <div class="sel-worlds">${rows}</div>
        <div class="select-buttons">
          <button id="sel-notebook" class="btn-quiet">📓 Notebook (N)</button>
          <button id="sel-help" class="btn-quiet">❓ Help</button>
          <button id="sel-reset" class="btn-quiet danger">Reset progress</button>
        </div>
      </div>`;
    this.selectEl.classList.remove('hidden');
    this.selectEl.querySelectorAll('.sel-card:not(.locked)').forEach((b) =>
      b.addEventListener('click', () => { Sfx.portal(); this.startLevel(b.dataset.id); }));
    qs('#sel-notebook').addEventListener('click', () => this.notebook());
    qs('#sel-help').addEventListener('click', () => this.help());
    qs('#sel-reset').addEventListener('click', () => {
      if (confirm('Erase all medals?')) { G.state.reset(); this.select(); }
    });
  },

  startLevel(id) {
    for (const w of WORLDS) {
      const l = w.levels.find((x) => x.id === id);
      if (l) {
        this.hideAll();
        G.mode = 'play';
        Level.load(w, l);
        return;
      }
    }
  },

  // ---- level complete ----
  complete(medal) {
    G.mode = 'complete';
    G.state.setMedal(G.level.id, medal);
    G.hud.refreshMedals();
    const flat = G.state.flatLevels();
    const idx = flat.findIndex((l) => l.id === G.level.id);
    const next = flat[idx + 1];
    this.completeEl.innerHTML = `
      <div class="done-card" style="--w:${G.world.pal.accent}">
        <div class="done-medal">${MEDAL_ICON[medal]}</div>
        <h2>${G.level.name} — cleared</h2>
        <div class="done-sub">${medal === 'gold' ? 'First-try mathematics. The exam should be nervous.' : medal === 'silver' ? 'Solid — one re-run to dial it in.' : 'Cleared! Re-run it later and aim for first-try gold.'}</div>
        ${G.level.lesson ? `<div class="done-lesson">${rich(G.level.lesson)}</div>` : ''}
        <div class="gate-buttons">
          ${next ? `<button id="done-next" class="btn-go">Next: ${next.name} ▸</button>` : '<button id="done-next" class="btn-go">All levels cleared! ▸</button>'}
          <button id="done-replay" class="btn-quiet">Replay</button>
          <button id="done-map" class="btn-quiet">Level select</button>
        </div>
      </div>`;
    this.completeEl.classList.remove('hidden');
    qs('#done-next').addEventListener('click', () => {
      this.completeEl.classList.add('hidden');
      if (next) this.startLevel(next.id); else this.select();
    });
    qs('#done-replay').addEventListener('click', () => { this.completeEl.classList.add('hidden'); this.startLevel(G.level.id); });
    qs('#done-map').addEventListener('click', () => { this.completeEl.classList.add('hidden'); this.select(); });
    qs('#done-next').focus();
  },

  completeKey(e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); qs('#done-next')?.click(); }
  },

  // ---- notebook ----
  notebook() {
    this.prevMode = G.mode;
    G.mode = 'notebook';
    const ids = Object.keys(NOTEBOOK);
    this.notebookEl.innerHTML = `
      <div class="nb-card">
        <div class="nb-top"><h2>📓 The Notebook</h2><button id="nb-close">✕</button></div>
        <div class="nb-body">
          <div class="nb-list">${ids.map((id) => `<button class="nb-item" data-id="${id}">${rich(NOTEBOOK[id].term)}</button>`).join('')}</div>
          <div class="nb-detail" id="nb-detail">The math behind every gate, written exam-style. Pick a page.</div>
        </div>
      </div>`;
    this.notebookEl.classList.remove('hidden');
    this.notebookEl.querySelectorAll('.nb-item').forEach((b) =>
      b.addEventListener('click', () => {
        this.notebookEl.querySelectorAll('.nb-item.sel').forEach((x) => x.classList.remove('sel'));
        b.classList.add('sel');
        const e = NOTEBOOK[b.dataset.id];
        qs('#nb-detail').innerHTML = `<h3>${rich(e.term)}</h3><p>${rich(e.def)}</p>`;
      }));
    qs('#nb-close').addEventListener('click', () => this.closeNotebook());
  },

  closeNotebook() {
    this.notebookEl.classList.add('hidden');
    this.notebookEl.innerHTML = '';
    G.mode = this.prevMode === 'select' ? 'select' : this.prevMode === 'title' ? 'title' : 'play';
  },

  // ---- help ----
  help() {
    this.prevHelpMode = G.mode;
    G.mode = 'help';
    this.helpEl.classList.remove('hidden');
  },
  closeHelp() {
    this.helpEl.classList.add('hidden');
    G.mode = this.prevHelpMode === 'title' ? 'title' : this.prevHelpMode === 'select' ? 'select' : 'play';
  },
};

G.screens = Screens;
