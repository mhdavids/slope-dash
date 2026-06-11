// Math gates — the heart of the game. Each gate is a device in the world that
// pauses time ("scope mode"), takes a mathematical answer, then RUNS it as
// physics. The math is the controller; the level is the grader.
//
// Gate kinds:
//   parabola — tune a jump arc (vertex or standard form) and ride it
//   track    — fix a piecewise function so the coaster crosses its seams
//   spinner  — pick the release point on a spinning circle (tangent throw)
//   chrono   — choose when to start running so you arrive while a door is open
//
// Shared shape: def { kind, zone:{x,y,w,h}, org:[ox,oy], S, ...cfg, answerKey }
// Runtime adds: state idle|armed, params, runs, medal, cleared.

import { G, qs, el, rich, fmtNum, clamp } from '../engine/g.js';
import { Sfx } from '../engine/audio.js';

const NUM = (v) => (typeof v === 'string' ? parseFloat(v) : v);

export const Gates = {
  init() {
    this.panel = qs('#gate');
    this.open = null;
  },

  instance(def) {
    return {
      ...def,
      state: 'idle', cleared: false,
      params: { ...(def.start || {}) },
      runs: 0, medal: null,
      anim: { podAngle: def.podAngle ?? Math.PI / 2, clock: -1, trace: [] },
    };
  },

  promptFor(g) {
    if (g.cleared) return `E: re-run ${g.title}`;
    return `E: ${g.state === 'armed' ? 're-tune' : 'open'} ${g.title}`;
  },

  onRespawn(g) {
    if (g.state === 'riding') g.state = 'armed';
    g.anim.clock = -1;
    g.anim.trace = [];
  },

  // math-space helpers
  mx(g, x) { return g.org[0] + g.S * x; },
  my(g, y) { return g.org[1] - g.S * y; },
  ux(g, px) { return (px - g.org[0]) / g.S; },

  // numeric derivative
  d(f, x) { const h = 1e-4; return (f(x + h) - f(x - h)) / (2 * h); },

  // ======================= scope-mode panel =======================
  activate(g) {
    this.open = g;
    G.mode = 'gate';
    this.panel.classList.remove('hidden');
    this.render(g);
    Sfx.click();
  },

  close() {
    this.open = null;
    this.panel.classList.add('hidden');
    this.panel.innerHTML = '';
    if (G.mode === 'gate') G.mode = 'play';
  },

  key(e) {
    if (e.key === 'Escape') { e.preventDefault(); this.close(); }
    // Enter inside a number input shouldn't trigger global handlers
    if (e.key === 'Enter' && e.target?.tagName !== 'INPUT') {
      qs('#gate-run')?.click();
    }
  },

  render(g) {
    const c = this.controlsHTML(g);
    this.panel.innerHTML = `
      <div class="gate-card" style="--w:${G.world.pal.accent}">
        <div class="gate-kicker">${G.world.name.toUpperCase()} — SCOPE MODE</div>
        <h2>${g.title}</h2>
        <div class="gate-prompt">${rich(g.prompt)}</div>
        <div class="gate-eq" id="gate-eq">${this.equationHTML(g)}</div>
        <div class="gate-controls">${c}</div>
        ${g.note ? `<div class="gate-note">${rich(g.note)}</div>` : ''}
        <div class="gate-buttons">
          <button id="gate-run" class="btn-go">Run it ▸</button>
          <button id="gate-cancel" class="btn-quiet">Back (Esc)</button>
        </div>
        <div class="gate-foot">Attempt ${g.runs + 1}${g.cleared ? ' · already cleared — free replay' : ' · first try = gold'}</div>
      </div>`;
    this.panel.querySelectorAll('input').forEach((inp) => {
      inp.addEventListener('input', () => {
        g.params[inp.dataset.key] = NUM(inp.value);
        const lab = this.panel.querySelector(`[data-lab="${inp.dataset.key}"]`);
        if (lab) lab.textContent = fmtNum(g.params[inp.dataset.key]);
        qs('#gate-eq').innerHTML = this.equationHTML(g);
      });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') qs('#gate-run').click(); });
    });
    qs('#gate-cancel').addEventListener('click', () => this.close());
    qs('#gate-run').addEventListener('click', () => {
      const err = this.checkInputs(g);
      if (err) { G.hud.toast(err, 'poor'); Sfx.bad(); return; }
      g.state = 'armed';
      g.runs++;
      this.close();
      this.startRide(g);
    });
    this.panel.querySelector('input')?.focus();
  },

  controlsHTML(g) {
    const rows = g.controls.map((ctl) => {
      const v = g.params[ctl.key];
      if (ctl.input === 'slider') {
        return `<label class="gc-row"><span class="gc-name">${rich(ctl.label)}</span>
          <input type="range" min="${ctl.min}" max="${ctl.max}" step="${ctl.step}" value="${v}" data-key="${ctl.key}">
          <span class="gc-val" data-lab="${ctl.key}">${fmtNum(v)}</span></label>`;
      }
      return `<label class="gc-row"><span class="gc-name">${rich(ctl.label)}</span>
        <input type="number" step="${ctl.step ?? 'any'}" value="${v ?? ''}" data-key="${ctl.key}" class="gc-num" placeholder="?">
        ${ctl.unit ? `<span class="gc-val">${ctl.unit}</span>` : ''}</label>`;
    }).join('');
    return rows;
  },

  checkInputs(g) {
    for (const ctl of g.controls) {
      const v = g.params[ctl.key];
      if (v == null || Number.isNaN(v)) return `Enter a value for ${ctl.label.replace(/\*/g, '')}.`;
    }
    if (g.kind === 'spinner') {
      const { px, py } = g.params;
      if (Math.abs(px * px + py * py - g.r * g.r) > g.r * 0.35) {
        return `(${fmtNum(px)}, ${fmtNum(py)}) isn’t on the circle x² + y² = ${g.r * g.r}.`;
      }
    }
    if (g.kind === 'parabola' && g.mode === 'apex' && g.params.h <= 0) return 'The apex must be ahead of you (h > 0).';
    return null;
  },

  equationHTML(g) {
    if (g.kind === 'parabola') {
      if (g.mode === 'apex') {
        const { h, k } = g.params;
        const a = -k / (h * h);
        return rich(`y = a(x − **${fmtNum(h)}**)^{2} + **${fmtNum(k)}**, through (0, 0) ⇒ a = −k/h² = **${fmtNum(a, 3)}**`);
      }
      const { a, b } = g.params;
      return rich(`y = **${fmtNum(a)}**x^{2} + **${fmtNum(b)}**x`);
    }
    if (g.kind === 'track') return g.tex(g.params);
    if (g.kind === 'spinner') {
      const { px, py } = g.params;
      const slope = py === 0 ? '∞ (vertical)' : fmtNum(-px / py, 2);
      return rich(`x^{2} + y^{2} = ${g.r * g.r} ⇒ dy/dx = −x/y${px != null && py != null && !Number.isNaN(px) ? ` = **${slope}** at (${fmtNum(px)}, ${fmtNum(py)})` : ''}`);
    }
    if (g.kind === 'chrono') {
      if (g.solveFor === 'v') {
        const v = g.params.v;
        const arr = v > 0 ? g.d / v : null;
        return rich(`you leave at t = 0 ⇒ arrival = d/v = ${g.d}/v${arr != null && !Number.isNaN(arr) ? ` = **${fmtNum(arr, 2)}s**` : ''} — door open on [${g.open0}, ${g.open1}]`);
      }
      const t0 = g.params.t0;
      const arr = t0 != null && !Number.isNaN(t0) ? t0 + g.d / g.v : null;
      return rich(`arrival = t_{0} + d/v = t_{0} + ${fmtNum(g.d / g.v)}${arr != null ? ` = **${fmtNum(arr)}s**` : ''} — door open on [${g.open0}, ${g.open1}]`);
    }
    return '';
  },

  // ======================= the rides =======================
  startRide(g) {
    const p = G.levelCtl.pl;
    g.anim.trace = [];
    if (g.kind === 'parabola') {
      p.mode = 'ride'; p.rideGate = g; g.state = 'riding';
      g.ride = { t: 0 };
      // start the arc at the pad's math origin
      p.x = g.org[0] - p.w / 2;
      p.y = g.org[1] - p.h;
      Sfx.portal();
    } else if (g.kind === 'track') {
      p.mode = 'ride'; p.rideGate = g; g.state = 'riding';
      g.ride = { x: g.pieces[0].from };
      Sfx.portal();
    } else if (g.kind === 'spinner') {
      p.mode = 'ride'; p.rideGate = g; g.state = 'riding';
      // snap entered point onto the circle exactly, keep direction
      const { px, py } = g.params;
      const m = Math.hypot(px, py) || 1;
      g.ride = { phase: 'orbit', angle: g.anim.podAngle, relAngle: Math.atan2(py / m, px / m), flew: 0 };
      g.ride.relAngle = Math.atan2(py, px);
      Sfx.portal();
    } else if (g.kind === 'chrono') {
      p.mode = 'ride'; p.rideGate = g; g.state = 'riding';
      g.ride = { clock: 0, running: false, done: false };
      p.x = g.zone.x + g.zone.w / 2 - p.w / 2;
      Sfx.click();
    }
  },

  fail(g, msg) {
    g.state = 'armed';
    G.levelCtl.pl.rideGate = null;
    G.levelCtl.die(msg);
  },

  succeed(g, landX, landY) {
    const p = G.levelCtl.pl;
    g.state = 'done';
    if (!g.cleared) {
      g.cleared = true;
      g.medal = g.runs === 1 ? 'gold' : g.runs === 2 ? 'silver' : 'bronze';
      G.hud.toast(`${g.title} cleared — ${g.medal} ✦`, g.medal === 'gold' ? 'gold' : 'info');
    }
    p.mode = 'free'; p.rideGate = null;
    if (landX != null) { p.x = landX; p.y = landY; }
    p.vy = 0;
    Sfx.good();
    G.levelCtl.burst(p.x + 13, p.y + 10, 24, '#7dffb0');
  },

  updateWorld(g, dt) {
    // idle spinner pod keeps revolving so the room feels alive
    if (g.kind === 'spinner' && g.state !== 'riding') {
      g.anim.podAngle += (g.spin * 2 * Math.PI * dt) / g.period;
    }
  },

  updateRide(g, p, dt) {
    if (g.kind === 'parabola') {
      const r = g.ride;
      r.t += dt;
      const xm = g.vx * r.t;                       // math-units x along the arc
      const f = this.parabolaF(g);
      const ym = f(xm);
      p.x = this.mx(g, xm) - p.w / 2;
      p.y = this.my(g, ym) - p.h;
      g.anim.trace.push([p.x + p.w / 2, p.y + p.h]);
      // grade by physics: landing / crashing handled against real level geometry
      const lvl = G.levelCtl;
      const slope = this.d(f, xm);
      for (const rPlat of lvl.platforms) {
        if (!lvl.overlap(p, rPlat)) continue;
        if (slope < 0 && p.y + p.h - rPlat.y < 26) return this.succeed(g, p.x, rPlat.y - p.h);
        return this.fail(g, 'Smacked the side — reshape the arc!');
      }
      for (const s of lvl.spikes) if (lvl.overlap(p, s)) return this.fail(g, 'Right into the spikes — adjust the parabola.');
      if (ym < g.floorY - 2 || xm > g.rangeMax) return this.fail(g, 'The arc ran out — no landing under your feet.');
    }

    else if (g.kind === 'track') {
      const r = g.ride;
      const pieces = g.pieces;
      r.x += g.rideSpeed * dt;
      // seam checks the moment we cross
      for (const s of g.seams) {
        if (r.x - g.rideSpeed * dt < s && r.x >= s) {
          const [L, R] = this.piecesAt(g, s);
          const gap = Math.abs(L.f(s, g.params) - R.f(s, g.params));
          if (gap > 0.05) return this.fail(g, `The track JUMPS at x = ${s} — not continuous. Mind the gap: ${fmtNum(gap)} units.`);
          if (g.needC1) {
            const dgap = Math.abs(this.d((x) => L.f(x, g.params), s) - this.d((x) => R.f(x, g.params), s));
            if (dgap > 0.05) return this.fail(g, `Continuous at x = ${s}, but the CORNER threw you — match the slopes (gap ${fmtNum(dgap)}).`);
          }
          Sfx.blip();
        }
      }
      const piece = pieces.find((q) => r.x >= q.from && r.x <= q.to) || pieces[pieces.length - 1];
      const ym = piece.f(Math.min(r.x, piece.to), g.params);
      p.x = this.mx(g, r.x) - p.w / 2;
      p.y = this.my(g, ym) - p.h;
      g.anim.trace.push([p.x + p.w / 2, p.y + p.h]);
      if (r.x >= pieces[pieces.length - 1].to) {
        return this.succeed(g, p.x, p.y);
      }
    }

    else if (g.kind === 'spinner') {
      const r = g.ride;
      if (r.phase === 'orbit') {
        const w = (g.spin * 2 * Math.PI) / g.period;
        const prev = r.angle;
        r.angle += w * dt;
        // park the player on the rim
        p.x = this.mx(g, g.r * Math.cos(r.angle)) - p.w / 2;
        p.y = this.my(g, g.r * Math.sin(r.angle)) - p.h / 2;
        // release when we sweep past the chosen angle
        const a0 = this.normAng(prev), a1 = this.normAng(r.angle), tgt = this.normAng(r.relAngle);
        if (this.sweptPast(a0, a1, tgt, g.spin)) {
          r.phase = 'fly';
          r.angle = r.relAngle;
          const c = Math.cos(r.angle), s = Math.sin(r.angle);
          // tangent direction: CCW → (−sin, cos); CW → (sin, −cos)
          r.dx = g.spin > 0 ? -s : s;
          r.dy = g.spin > 0 ? c : -c;
          r.fx = g.r * c; r.fy = g.r * s;
          Sfx.portal();
        }
      } else {
        const sp = g.flySpeed ?? 7;
        r.fx += r.dx * sp * dt;
        r.fy += r.dy * sp * dt;
        r.flew += sp * dt;
        p.x = this.mx(g, r.fx) - p.w / 2;
        p.y = this.my(g, r.fy) - p.h / 2;
        g.anim.trace.push([p.x + p.w / 2, p.y + p.h / 2]);
        const dist = Math.hypot(r.fx - g.target[0], r.fy - g.target[1]);
        if (dist <= g.targetR) {
          return this.succeed(g, this.mx(g, g.exit[0]) - p.w / 2, this.my(g, g.exit[1]) - p.h);
        }
        if (r.flew > g.r * 7) return this.fail(g, 'Drifted past the ring — that tangent line missed. Recompute the release point.');
      }
    }

    else if (g.kind === 'chrono') {
      const r = g.ride;
      r.clock += dt;
      g.anim.clock = r.clock;
      const t0 = g.solveFor === 'v' ? 0 : g.params.t0;
      const vRun = g.solveFor === 'v' ? g.params.v : g.v;
      if (!r.running && r.clock >= t0) { r.running = true; Sfx.blip(); }
      if (r.running) {
        p.x += vRun * dt;      // px/s
        p.face = 1;
        const arrive = g.zone.x + g.zone.w / 2 + g.d;
        if (p.x + p.w / 2 >= arrive) {
          const t = r.clock;
          g.anim.clock = -1;
          if (t >= g.open0 - 0.12 && t <= g.open1 + 0.12) {
            return this.succeed(g);
          }
          return this.fail(g, `Arrived at t = ${fmtNum(t, 1)}s — the door was only open on [${g.open0}, ${g.open1}].`);
        }
      }
    }
  },

  parabolaF(g) {
    if (g.mode === 'apex') {
      const { h, k } = g.params;
      const a = -k / (h * h);
      return (x) => a * (x - h) ** 2 + k;
    }
    const { a, b } = g.params;
    return (x) => a * x * x + b * x;
  },

  piecesAt(g, s) {
    const L = g.pieces.find((q) => Math.abs(q.to - s) < 1e-9);
    const R = g.pieces.find((q) => Math.abs(q.from - s) < 1e-9);
    return [L, R];
  },

  normAng(a) { return ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); },
  sweptPast(a0, a1, t, spin) {
    if (spin > 0) return a0 <= a1 ? (t > a0 && t <= a1) : (t > a0 || t <= a1);
    return a0 >= a1 ? (t < a0 && t >= a1) : (t < a0 || t >= a1);
  },

  // ======================= world drawing =======================
  drawWorld(g, ctx, t) {
    const pal = G.world.pal;
    this.drawAxes(g, ctx);

    if (g.kind === 'parabola') {
      // launch pad
      const z = g.zone;
      ctx.fillStyle = pal.device;
      ctx.beginPath(); ctx.roundRect(z.x, z.y + z.h - 12, z.w, 12, 4); ctx.fill();
      ctx.fillStyle = pal.accent;
      ctx.beginPath(); ctx.roundRect(z.x + 4, z.y + z.h - 16, z.w - 8, 6, 3); ctx.fill();
      // arc preview (armed or being tuned)
      if (g.state !== 'idle' || G.mode === 'gate') {
        const f = this.parabolaF(g);
        if (g.params.h > 0 || g.mode === 'coeffs') this.plotCurve(g, ctx, f, 0, g.rangeMax, pal.preview, true);
      }
    }

    else if (g.kind === 'track') {
      for (const piece of g.pieces) {
        this.plotCurve(g, ctx, (x) => piece.f(x, g.params), piece.from, piece.to, pal.track, false, 5);
      }
      for (const s of g.seams) {
        const sx = this.mx(g, s);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.setLineDash([5, 6]);
        ctx.beginPath(); ctx.moveTo(sx, g.org[1] - g.S * g.seamLabelY); ctx.lineTo(sx, g.org[1] + 30); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '13px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`x = ${s}`, sx, g.org[1] + 46);
      }
      // station
      const z = g.zone;
      ctx.fillStyle = pal.device;
      ctx.beginPath(); ctx.roundRect(z.x, z.y + z.h - 14, z.w, 14, 4); ctx.fill();
    }

    else if (g.kind === 'spinner') {
      const cx = g.org[0], cy = g.org[1], R = g.S * g.r;
      ctx.strokeStyle = pal.track;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.font = '13px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`x² + y² = ${g.r * g.r}`, cx, cy - R - 12);
      // spin direction arrows
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const a = t * (g.spin * 2 * Math.PI) / g.period + (i * 2 * Math.PI) / 3;
        const ax = cx + Math.cos(a) * (R + 14), ay = cy - Math.sin(a) * (R + 14);
        const dx = (g.spin > 0 ? -Math.sin(a) : Math.sin(a)), dy = (g.spin > 0 ? -Math.cos(a) : Math.cos(a));
        ctx.beginPath(); ctx.moveTo(ax - dx * 8, ay - dy * 8); ctx.lineTo(ax + dx * 8, ay + dy * 8);
        ctx.lineTo(ax + dx * 8 - (dx * 5 + dy * 4), ay + dy * 8 - (dy * 5 - dx * 4));
        ctx.stroke();
      }
      // chosen release point
      if (g.state !== 'idle' && g.params.px != null && !Number.isNaN(g.params.px)) {
        const pxp = this.mx(g, g.params.px), pyp = this.my(g, g.params.py);
        ctx.fillStyle = '#ffd76e';
        ctx.beginPath(); ctx.arc(pxp, pyp, 6, 0, Math.PI * 2); ctx.fill();
        // tangent + radius shown once flying/cleared (the payoff diagram)
        if (g.state === 'riding' && g.ride?.phase === 'fly' || g.state === 'done') {
          ctx.strokeStyle = 'rgba(255,215,110,0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(pxp, pyp); ctx.stroke();
          const m = g.params.py === 0 ? null : -g.params.px / g.params.py;
          if (m != null) {
            // math slope m renders as −m on screen (y axis flips)
            ctx.setLineDash([4, 5]);
            ctx.beginPath();
            ctx.moveTo(pxp - 220, pyp + m * 220);
            ctx.lineTo(pxp + 220, pyp - m * 220);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
      }
      // idle pod
      if (g.state !== 'riding') {
        const a = g.anim.podAngle;
        ctx.fillStyle = pal.accent;
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R, cy - Math.sin(a) * R, 7, 0, Math.PI * 2); ctx.fill();
      }
      // target ring
      const tx = this.mx(g, g.target[0]), ty = this.my(g, g.target[1]);
      const pulse = 1 + Math.sin(t * 4) * 0.12;
      ctx.strokeStyle = '#7dffb0';
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(tx, ty, g.targetR * g.S * pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(125,255,176,0.85)';
      ctx.font = '12px Outfit, sans-serif';
      ctx.fillText(`(${g.target[0]}, ${g.target[1]})`, tx, ty - g.targetR * g.S - 8);
    }

    else if (g.kind === 'chrono') {
      const z = g.zone;
      // start pad
      ctx.fillStyle = pal.device;
      ctx.beginPath(); ctx.roundRect(z.x, z.y + z.h - 12, z.w, 12, 4); ctx.fill();
      // the door
      const doorX = z.x + z.w / 2 + g.d;
      const clock = g.anim.clock;
      const isOpen = g.cleared || (clock >= 0 && clock >= g.open0 && clock <= g.open1);
      ctx.fillStyle = isOpen ? 'rgba(125,255,176,0.18)' : 'rgba(255,93,93,0.45)';
      ctx.fillRect(doorX, g.doorTop, 14, g.doorH);
      ctx.strokeStyle = isOpen ? '#7dffb0' : '#ff5d5d';
      ctx.lineWidth = 2;
      ctx.strokeRect(doorX, g.doorTop, 14, g.doorH);
      // schedule sign
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '13px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`OPEN: ${g.open0} ≤ t ≤ ${g.open1}`, doorX + 7, g.doorTop - 26);
      ctx.fillText(g.solveFor === 'v' ? `d = ${g.d} px · choose your pace v` : `d = ${g.d} px · you run v = ${g.v} px/s`, z.x + z.w / 2 + g.d / 2, g.doorTop - 6);
      // big clock while running
      if (clock >= 0) {
        ctx.font = 'bold 26px Outfit, sans-serif';
        ctx.fillStyle = '#ffd76e';
        ctx.fillText(`t = ${clock.toFixed(1)}s`, z.x + z.w / 2 + 110, z.y - 20);
      }
    }

    // the traced path (last ride)
    if (g.anim.trace.length > 1) {
      const pal2 = G.world.pal;
      ctx.strokeStyle = pal2.preview;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      g.anim.trace.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.setLineDash([]);
    }
  },

  drawAxes(g, ctx) {
    if (!g.axes) return;
    const [x0, x1, y0, y1] = g.axes;     // in math units
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.mx(g, x0), g.org[1]); ctx.lineTo(this.mx(g, x1), g.org[1]);
    ctx.moveTo(g.org[0], this.my(g, y0)); ctx.lineTo(g.org[0], this.my(g, y1));
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    for (let x = Math.ceil(x0); x <= x1; x += g.tickEvery || 1) {
      if (x === 0) continue;
      ctx.fillRect(this.mx(g, x) - 0.5, g.org[1] - 3, 1, 6);
      if (x % (g.tickLabelEvery || 2) === 0) ctx.fillText(String(x), this.mx(g, x), g.org[1] + 14);
    }
    for (let y = Math.ceil(y0); y <= y1; y += g.tickEvery || 1) {
      if (y === 0) continue;
      ctx.fillRect(g.org[0] - 3, this.my(g, y) - 0.5, 6, 1);
    }
  },

  plotCurve(g, ctx, f, from, to, color, dashed = false, width = 3) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([6, 6]);
    ctx.beginPath();
    const n = 64;
    for (let i = 0; i <= n; i++) {
      const x = from + ((to - from) * i) / n;
      const X = this.mx(g, x), Y = this.my(g, f(x));
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

G.gates = Gates;
