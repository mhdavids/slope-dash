// Platformer input: held keys + edge-triggered presses with a small jump buffer.

import { qs } from './g.js';

const KEYMAP = {
  arrowleft: 'left', a: 'left',
  arrowright: 'right', d: 'right',
  arrowup: 'jump', w: 'jump', ' ': 'jump',
  arrowdown: 'down', s: 'down',
  e: 'action', enter: 'action',
};

const PREVENT = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ']);

export const Input = {
  down: new Set(),
  hit: new Set(),
  jumpBufferedAt: -1,

  init() {
    window.addEventListener('keydown', (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return; // typing in a panel
      const raw = e.key.toLowerCase();
      if (PREVENT.has(raw)) e.preventDefault();
      const k = KEYMAP[raw];
      if (!k) return;
      if (!this.down.has(k)) {
        this.hit.add(k);
        if (k === 'jump') this.jumpBufferedAt = performance.now();
      }
      this.down.add(k);
    });
    window.addEventListener('keyup', (e) => {
      const k = KEYMAP[e.key.toLowerCase()];
      if (k) this.down.delete(k);
    });
    window.addEventListener('blur', () => { this.down.clear(); this.hit.clear(); });
    this.initTouch();
  },

  consume(k) {
    if (this.hit.has(k)) { this.hit.delete(k); return true; }
    return false;
  },

  // jump pressed within the last `ms` milliseconds (jump buffering)
  consumeJumpBuffer(ms = 120) {
    if (this.jumpBufferedAt > 0 && performance.now() - this.jumpBufferedAt <= ms) {
      this.jumpBufferedAt = -1;
      return true;
    }
    return false;
  },

  endFrame() { this.hit.clear(); },

  axis() {
    let x = 0;
    if (this.down.has('left')) x -= 1;
    if (this.down.has('right')) x += 1;
    return x;
  },

  initTouch() {
    const pad = qs('#touch');
    if (!pad) return;
    if (!('ontouchstart' in window) && navigator.maxTouchPoints === 0) return;
    pad.classList.add('touch-on');
    document.body.classList.add('touch');   // drives the portrait rotate overlay
    const bind = (id, key) => {
      const b = qs(id);
      if (!b) return;
      const on = (e) => {
        e.preventDefault();
        if (!this.down.has(key)) {
          this.hit.add(key);
          if (key === 'jump') this.jumpBufferedAt = performance.now();
        }
        this.down.add(key);
      };
      const off = (e) => { e.preventDefault(); this.down.delete(key); };
      b.addEventListener('touchstart', on, { passive: false });
      b.addEventListener('touchend', off, { passive: false });
      b.addEventListener('touchcancel', off, { passive: false });
    };
    bind('#t-left', 'left'); bind('#t-right', 'right'); bind('#t-jump', 'jump');
    const act = qs('#t-act');
    act?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'e' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'e' }));
    }, { passive: false });
  },
};
