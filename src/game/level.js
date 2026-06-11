// The playable level: player physics, platform collisions, hazards, camera,
// gate zones, flag, particles, and all world rendering. Math-gate behavior
// (panels + armed mechanisms) lives in gates.js and is driven from here.

import { G, VIEW_W, VIEW_H, clamp, lerp, hash2 } from '../engine/g.js';
import { Input } from '../engine/input.js';
import { Sfx } from '../engine/audio.js';
import { Gates } from './gates.js';

// physics constants (px, seconds)
const GRAV = 2400;
const MOVE_ACC = 2600;
const AIR_ACC = 1800;
const MAX_VX = 280;
const FRICTION = 2400;
const JUMP_V = 760;
const COYOTE_MS = 90;

export const Level = {
  pl: null, cam: null, parts: [],
  deathT: 0, finished: false,

  load(world, level) {
    G.world = world;
    G.level = level;
    this.platforms = level.platforms.map((p) => ({ ...p }));
    this.spikes = (level.spikes || []).map((s) => ({ ...s }));
    this.gates = (level.gates || []).map((g) => Gates.instance(g));
    this.flag = { ...level.flag };
    this.checkpoint = { x: level.spawn[0], y: level.spawn[1] };
    this.pl = {
      x: level.spawn[0], y: level.spawn[1], w: 26, h: 34,
      vx: 0, vy: 0, face: 1, onGround: false, groundAt: -1e9,
      mode: 'free',          // free | ride (gate-controlled) | dead | win
      rideGate: null, rideT: 0,
      trail: [],
    };
    this.cam = { x: clamp(level.spawn[0] - VIEW_W / 2, 0, Math.max(0, level.w - VIEW_W)), y: 0 };
    this.parts = [];
    this.deathT = 0;
    this.finished = false;
    G.hud.showLevel();
  },

  respawn() {
    const p = this.pl;
    p.x = this.checkpoint.x; p.y = this.checkpoint.y;
    p.vx = 0; p.vy = 0; p.mode = 'free'; p.rideGate = null;
    for (const g of this.gates) Gates.onRespawn(g);
  },

  die(msg) {
    if (this.pl.mode === 'dead') return;
    this.pl.mode = 'dead';
    this.deathT = 0;
    Sfx.bad();
    this.burst(this.pl.x + 13, this.pl.y + 17, 18, '#ff5d5d');
    if (msg) G.hud.toast(msg, 'poor');
  },

  win() {
    if (this.finished) return;
    this.finished = true;
    this.pl.mode = 'win';
    Sfx.fanfare();
    this.burst(this.flag.x + 4, this.flag.y - 30, 60, '#ffd76e');
    const medals = this.gates.filter((g) => g.medal).map((g) => g.medal);
    const worst = medals.includes('bronze') ? 'bronze' : medals.includes('silver') ? 'silver' : 'gold';
    setTimeout(() => G.screens.complete(worst), 700);
  },

  // ---- physics ----
  rects() {
    // platforms tagged gateLock are solid until their gate is cleared (e.g. the chrono door)
    return this.platforms.filter((r) => {
      if (!r.gateLock) return true;
      const g = this.gates.find((gg) => gg.id === r.gateLock);
      return !(g && g.cleared);
    });
  },

  overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  },

  update(dt) {
    const p = this.pl;

    if (p.mode === 'dead') {
      this.deathT += dt;
      if (this.deathT > 0.55) this.respawn();
      this.updateParticles(dt);
      this.updateCam(dt);
      return;
    }
    if (p.mode === 'win') { this.updateParticles(dt); return; }

    for (const g of this.gates) Gates.updateWorld(g, dt);

    if (p.mode === 'ride') {
      Gates.updateRide(p.rideGate, p, dt);
    } else {
      // -- free movement --
      const ax = Input.axis();
      const acc = p.onGround ? MOVE_ACC : AIR_ACC;
      if (ax) {
        p.vx = clamp(p.vx + ax * acc * dt, -MAX_VX, MAX_VX);
        p.face = ax;
      } else if (p.onGround) {
        const s = Math.sign(p.vx);
        p.vx -= s * Math.min(Math.abs(p.vx), FRICTION * dt);
      }
      p.vy = Math.min(p.vy + GRAV * dt, 1500);

      const wasGrounded = performance.now() - p.groundAt < COYOTE_MS;
      if (Input.consumeJumpBuffer() && (p.onGround || wasGrounded)) {
        p.vy = -JUMP_V;
        p.onGround = false;
        p.groundAt = -1e9;
        Sfx.blip();
        this.burst(p.x + 13, p.y + 34, 5, '#cfd8e6', 0.5);
      }
      if (!Input.down.has('jump') && p.vy < -260) p.vy = -260; // variable jump cut

      this.moveAndCollide(p, dt);
    }

    // hazards
    for (const s of this.spikes) {
      if (this.overlap(p, s)) { this.die(); break; }
    }
    if (p.y > G.level.h + 80) this.die();

    // flag
    if (this.overlap(p, { x: this.flag.x - 6, y: this.flag.y - 64, w: 24, h: 64 })) this.win();

    // gate zone prompts + activation
    let prompt = null;
    for (const g of this.gates) {
      if (this.overlap(p, g.zone)) {
        prompt = Gates.promptFor(g);
        if (Input.consume('action')) Gates.activate(g);
      }
    }
    G.hud.prompt(prompt);

    // run dust + scarf trail
    if (p.onGround && Math.abs(p.vx) > 120 && Math.random() < dt * 12) {
      this.parts.push({ x: p.x + (p.vx > 0 ? 2 : 24), y: p.y + 32, vx: -p.vx * 0.1, vy: -30 - Math.random() * 40, life: 0.4, age: 0, r: 2.5, color: 'rgba(220,228,240,0.5)' });
    }
    p.trail.unshift({ x: p.x + 13 - p.face * 12, y: p.y + 10 });
    if (p.trail.length > 7) p.trail.pop();

    this.updateParticles(dt);
    this.updateCam(dt);
  },

  moveAndCollide(p, dt) {
    // X axis
    p.x += p.vx * dt;
    for (const r of this.rects()) {
      if (!this.overlap(p, r)) continue;
      if (p.vx > 0) p.x = r.x - p.w; else if (p.vx < 0) p.x = r.x + r.w;
      p.vx = 0;
    }
    p.x = clamp(p.x, 0, G.level.w - p.w);

    // Y axis
    p.y += p.vy * dt;
    p.onGround = false;
    for (const r of this.rects()) {
      if (!this.overlap(p, r)) continue;
      if (p.vy > 0) {
        p.y = r.y - p.h;
        p.onGround = true;
        p.groundAt = performance.now();
        if (p.vy > 700) this.burst(p.x + 13, p.y + 34, 6, 'rgba(220,228,240,0.6)', 0.5);
      } else if (p.vy < 0) {
        p.y = r.y + r.h;
      }
      p.vy = 0;
    }
  },

  updateCam(dt) {
    const p = this.pl;
    const tx = clamp(p.x + 13 - VIEW_W / 2 + p.face * 60, 0, Math.max(0, G.level.w - VIEW_W));
    const ty = clamp(p.y + 17 - VIEW_H * 0.58, 0, Math.max(0, G.level.h - VIEW_H));
    this.cam.x = lerp(this.cam.x, tx, Math.min(1, dt * 6));
    this.cam.y = lerp(this.cam.y, ty, Math.min(1, dt * 5));
  },

  burst(x, y, n, color, scale = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (60 + Math.random() * 160) * scale;
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: 0.5 + Math.random() * 0.4, age: 0, r: 2 + Math.random() * 2.5, color });
    }
  },

  updateParticles(dt) {
    for (const pt of this.parts) {
      pt.age += dt;
      pt.x += pt.vx * dt; pt.y += pt.vy * dt;
      pt.vy += 600 * dt;
    }
    this.parts = this.parts.filter((pt) => pt.age < pt.life);
  },

  // ---- rendering ----
  draw(ctx, t) {
    const pal = G.world.pal;
    const cx = this.cam.x, cy = this.cam.y;

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    sky.addColorStop(0, pal.sky1); sky.addColorStop(1, pal.sky2);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    // graph-paper backdrop (the world is graph paper — this is a calculus game)
    ctx.strokeStyle = pal.grid;
    ctx.lineWidth = 1;
    const GS = 48;
    const gx0 = -((cx * 0.7) % GS), gy0 = -((cy * 0.7) % GS);
    ctx.beginPath();
    for (let x = gx0; x < VIEW_W; x += GS) { ctx.moveTo(x, 0); ctx.lineTo(x, VIEW_H); }
    for (let y = gy0; y < VIEW_H; y += GS) { ctx.moveTo(0, y); ctx.lineTo(VIEW_W, y); }
    ctx.stroke();

    // parallax curve-hills (drawn as a faint function landscape)
    this.drawHills(ctx, pal.hillFar, 0.25, 110, t * 2);
    this.drawHills(ctx, pal.hillNear, 0.45, 70, 40 + t * 4);

    ctx.save();
    ctx.translate(-cx, -cy);

    // gates render their world-pieces (tracks, circles, doors, axes) under the player
    for (const g of this.gates) Gates.drawWorld(g, ctx, t);

    // platforms
    for (const r of this.platforms) {
      ctx.fillStyle = pal.plat;
      ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 6); ctx.fill();
      ctx.fillStyle = pal.platTop;
      ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, Math.min(8, r.h), 6); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      for (let i = 0; i < Math.floor(r.w / 54); i++) {
        if (hash2(r.x + i, r.y) > 0.5) ctx.fillRect(r.x + 12 + i * 54, r.y + 14, 22, 5);
      }
    }

    // spikes
    for (const s of this.spikes) {
      ctx.fillStyle = pal.spike;
      const n = Math.max(1, Math.round(s.w / 14));
      for (let i = 0; i < n; i++) {
        const sx = s.x + (i * s.w) / n;
        ctx.beginPath();
        ctx.moveTo(sx, s.y + s.h);
        ctx.lineTo(sx + s.w / n / 2, s.y);
        ctx.lineTo(sx + s.w / n, s.y + s.h);
        ctx.closePath(); ctx.fill();
      }
    }

    // flag
    this.drawFlag(ctx, this.flag.x, this.flag.y, t);

    // player
    if (this.pl.mode !== 'dead') this.drawPlayer(ctx, t);

    // particles
    for (const pt of this.parts) {
      ctx.globalAlpha = Math.max(0, 1 - pt.age / pt.life);
      ctx.fillStyle = pt.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  },

  drawHills(ctx, color, par, amp, phase) {
    const cx = this.cam.x * par;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, VIEW_H);
    for (let x = 0; x <= VIEW_W; x += 16) {
      const wx = (x + cx) * 0.004;
      const y = VIEW_H - 90 - amp * (0.6 * Math.sin(wx + phase * 0.02) + 0.4 * Math.sin(wx * 2.3));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VIEW_W, VIEW_H);
    ctx.closePath(); ctx.fill();
  },

  drawFlag(ctx, x, y, t) {
    ctx.fillStyle = '#cfd8e6';
    ctx.fillRect(x, y - 64, 4, 64);
    ctx.fillStyle = '#ffd76e';
    const wave = Math.sin(t * 6) * 3;
    ctx.beginPath();
    ctx.moveTo(x + 4, y - 62);
    ctx.lineTo(x + 34, y - 54 + wave);
    ctx.lineTo(x + 4, y - 44);
    ctx.closePath(); ctx.fill();
    // the flag bears an integral sign, obviously
    ctx.fillStyle = '#1c2030';
    ctx.font = 'bold 13px Georgia';
    ctx.fillText('∫', x + 11, y - 48);
  },

  drawPlayer(ctx, t) {
    const p = this.pl;
    const pal = G.world.pal;
    const speed = Math.abs(p.vx) / MAX_VX;
    const squash = p.onGround ? 1 + Math.sin(t * 16) * 0.03 * speed : (p.vy < 0 ? 1.12 : 0.92);
    const w = p.w * (2 - squash), h = p.h * squash;
    const x = p.x + (p.w - w) / 2, y = p.y + (p.h - h);

    // scarf trail
    ctx.strokeStyle = pal.accent;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    p.trail.forEach((tp, i) => { i ? ctx.lineTo(tp.x, tp.y + Math.sin(t * 10 + i) * 2) : ctx.moveTo(tp.x, tp.y); });
    ctx.stroke();

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(p.x + 13, p.y + 35, 12, 3.5, 0, 0, Math.PI * 2); ctx.fill();

    // body
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    if (p.onGround && speed > 0.1) ctx.rotate(p.face * 0.06 * speed);
    ctx.fillStyle = '#f4f6fb';
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 9); ctx.fill();
    ctx.fillStyle = pal.accent;
    ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h * 0.32, 9); ctx.fill();
    // eyes
    ctx.fillStyle = '#1c2030';
    const ex = p.face * 4;
    ctx.beginPath();
    ctx.arc(ex - 4, -2, 2.6, 0, Math.PI * 2);
    ctx.arc(ex + 5, -2, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
};

G.levelCtl = Level;
