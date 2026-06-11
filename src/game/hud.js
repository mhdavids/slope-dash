// HUD: level banner, medal tally, prompt pill, toasts.

import { G, qs, el, rich } from '../engine/g.js';
import { Sfx } from '../engine/audio.js';

export const Hud = {
  init() {
    this.root = qs('#hud');
    this.nameEl = qs('#hud-name');
    this.medalEl = qs('#hud-medals');
    this.promptEl = qs('#prompt');
    this.toastsEl = qs('#toasts');
    qs('#btn-notebook').addEventListener('click', () => G.screens.notebook());
    qs('#btn-exit').addEventListener('click', () => { if (G.mode === 'play') G.screens.select(); });
    this.muteBtn = qs('#btn-mute');
    this.muteBtn.addEventListener('click', () => {
      const m = Sfx.toggle();
      this.muteBtn.textContent = m ? '🔇' : '🔊';
    });
    this.muteBtn.textContent = Sfx.muted ? '🔇' : '🔊';
  },

  showLevel() {
    this.root.classList.remove('hidden');
    this.nameEl.innerHTML = `<b style="color:${G.world.pal.accent}">${G.world.name}</b> · ${G.level.name}`;
    this.refreshMedals();
  },

  hide() { this.root.classList.add('hidden'); this.prompt(null); },

  refreshMedals() {
    const m = G.state.medalCount();
    this.medalEl.textContent = `🥇 ${m.gold} · ✔ ${m.total}`;
  },

  prompt(text) {
    if (!text) { this.promptEl.classList.add('hidden'); return; }
    this.promptEl.innerHTML = rich(text);
    this.promptEl.classList.remove('hidden');
  },

  toast(text, kind = 'info') {
    const t = el('div', `toast ${kind}`, rich(text));
    this.toastsEl.appendChild(t);
    requestAnimationFrame(() => t.classList.add('in'));
    setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, 3600);
  },
};

G.hud = Hud;
