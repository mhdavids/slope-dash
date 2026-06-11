// Boot, fixed-step game loop, and the mode router.

import { G, qs, VIEW_W, VIEW_H } from './engine/g.js';
import { Input } from './engine/input.js';
import { Sfx } from './engine/audio.js';
import { State } from './game/state.js';
import { Level } from './game/level.js';
import { Gates } from './game/gates.js';
import { Hud } from './game/hud.js';
import { Screens } from './game/screens.js';
import { WORLDS } from './data/worlds.js';

function setupCanvas() {
  const canvas = qs('#game');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  G.canvas = canvas;
  G.ctx = canvas.getContext('2d');
  const fit = () => {
    const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
    canvas.style.width = `${VIEW_W * scale}px`;
    canvas.style.height = `${VIEW_H * scale}px`;
  };
  window.addEventListener('resize', fit);
  fit();
}

// ambient backdrop for title/select: drifting function curves
const curves = Array.from({ length: 6 }, (_, i) => ({
  a: 0.4 + i * 0.25, phase: i * 1.7, speed: 0.12 + i * 0.05, y: 90 + i * 75,
  color: ['#ffd76e', '#7dd4ff', '#c792ff', '#7dffb0', '#ff9d7d', '#f4f6fb'][i],
}));

function drawAmbient(ctx, t) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#101426'); g.addColorStop(1, '#1c1030');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  for (let x = 0; x < VIEW_W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIEW_H); ctx.stroke(); }
  for (let y = 0; y < VIEW_H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW_W, y); ctx.stroke(); }
  for (const c of curves) {
    ctx.strokeStyle = c.color + '33';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 0; x <= VIEW_W; x += 12) {
      const y = c.y + Math.sin(x * 0.008 * c.a + t * c.speed + c.phase) * 46;
      x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
  }
}

let last = 0;
function frame(ms) {
  const t = ms / 1000;
  G.dt = Math.min(0.033, t - last);
  last = t;
  G.time = t;

  if (G.mode === 'play') Level.update(G.dt);

  if (['play', 'gate', 'complete'].includes(G.mode) && G.level) {
    Level.draw(G.ctx, t);
  } else {
    drawAmbient(G.ctx, t);
  }

  Input.endFrame();
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (e) => {
  if (e.target?.tagName === 'INPUT') {
    if (G.mode === 'gate') Gates.key(e);
    return;
  }
  const k = e.key.toLowerCase();
  if (k === 'm') {
    const m = Sfx.toggle();
    qs('#btn-mute').textContent = m ? '🔇' : '🔊';
    return;
  }
  switch (G.mode) {
    case 'gate': Gates.key(e); break;
    case 'complete': Screens.completeKey(e); break;
    case 'notebook': if (k === 'escape' || k === 'n') Screens.closeNotebook(); break;
    case 'help': if (k === 'escape' || k === 'enter') Screens.closeHelp(); break;
    case 'play':
      if (k === 'n') Screens.notebook();
      if (k === 'r') Screens.startLevel(G.level.id);
      if (k === 'escape') Screens.select();
      break;
    case 'select':
      if (k === 'n') Screens.notebook();
      break;
    case 'title':
      if (k === 'enter' || k === ' ') { e.preventDefault(); qs('#title-start')?.click(); }
      break;
  }
});

window.addEventListener('pointerdown', () => Sfx.ensure(), { once: true });
window.addEventListener('keydown', () => Sfx.ensure(), { once: true });

// ---- boot ----
setupCanvas();
State.load();
Input.init();
Gates.init();
Hud.init();
Screens.init();
Screens.showTitle();
qs('#loading')?.remove();
requestAnimationFrame((ms) => { last = ms / 1000; requestAnimationFrame(frame); });

// ---- debug API (used by automated playtesting) ----
window.__SLDASH = {
  G, Level, Gates, State, WORLDS,
  warp(id) { G.screens.startLevel(id); },
  // fill the answer key into a gate and run it, exactly as a player would
  solveAndRun(gateId) {
    const g = Level.gates.find((x) => x.id === gateId) || Level.gates[0];
    if (g.kind === 'troll') {
      const r = g.riddles[g.riddleIdx];
      g.runs++;
      Gates.close();
      Gates.trollPass(g, r);
      return g.id;
    }
    g.params = { ...g.answerKey };
    g.state = 'armed';
    g.runs++;
    Gates.close();
    Gates.startRide(g);
    return g.id;
  },
  press(key) {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
    window.dispatchEvent(new KeyboardEvent('keyup', { key }));
  },
};
if (G.debug) console.log('SLDASH debug ready: __SLDASH.warp(id), .solveAndRun(gateId)');
