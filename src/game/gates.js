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

import { G, qs, el, rich, tex, fmtNum, clamp } from '../engine/g.js';
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
      shown: { ...(def.start || {}) },   // what the WORLD renders — only updates on Run (anti-guess)
      runs: 0, medal: null, lastLandX: null,
      anim: { podAngle: def.podAngle ?? Math.PI / 2, clock: -1, trace: [] },
    };
  },

  // params used for world rendering: live only for explicitly-'live' preview gates
  // while their panel is open; otherwise the last RUN values. You aim with math,
  // not with the picture.
  viewParams(g) {
    if (g.preview === 'live' && this.open === g) return g.params;
    return g.shown;
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
        ${g.predict ? `
        <div class="gate-predict">
          <div class="gp-head">📐 Commit to a prediction <span>— gold requires it to be right</span></div>
          <label class="gc-row"><span class="gc-name">${rich(g.predict.label)}</span>
            <input type="number" step="any" value="${g.params.pred ?? ''}" data-key="pred" class="gc-num" placeholder="?">
          </label>
        </div>` : ''}
        ${g.note ? `<div class="gate-note">${rich(g.note)}</div>` : ''}
        <div class="gate-buttons">
          <button id="gate-run" class="btn-go">Run it ▸</button>
          <button id="gate-cancel" class="btn-quiet">Back (Esc)</button>
        </div>
        <div class="gate-foot">Attempt ${g.runs + 1}${g.cleared ? ' · already cleared — free replay' : ' · gold = first try + correct prediction'}</div>
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
    if (g.predict && (g.params.pred == null || Number.isNaN(g.params.pred))) {
      return 'Commit to your prediction first — that’s where the math lives.';
    }
    if (g.kind === 'apex') {
      const { xp } = g.params;
      if (xp <= g.from + 0.2 || xp >= g.to - 0.2) return `The pad must sit on the terrain: ${g.from} < x < ${g.to}.`;
    }
    if (g.kind === 'field') {
      const { C } = g.params;
      if (C < g.cMin || C > g.cMax) return `The launch rail only reaches y(0) between ${g.cMin} and ${g.cMax}.`;
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
    // ?-placeholder for not-yet-entered values, TeX-safe
    const Q = (v, dp = 2) => (v == null || Number.isNaN(v) ? '\\,?\\,' : fmtNum(v, dp));

    if (g.kind === 'apex') {
      const xp = g.params.xp;
      return tex(g.texF, true) + tex(g.texDf, true)
        + rich(`pad at $x_p = ${Q(xp, 1)}$`);
    }

    if (g.kind === 'field') {
      const C = g.params.C;
      return tex(`${g.texEq}`, true) + rich(`launch height: $y(0) = C = ${Q(C, 1)}$`);
    }

    if (g.kind === 'parabola') {
      if (g.mode === 'apex') {
        const { h, k } = g.params;
        const a = -k / (h * h);
        return tex(`y = a\\,(x - ${Q(h, 1)})^{2} + ${Q(k, 1)} \\quad\\text{with}\\quad a = -\\frac{k}{h^{2}} = ${Q(a, 3)}`, true)
          + rich('(the arc passes through your feet at $(0, 0)$)');
      }
      const { a, b } = g.params;
      const bTex = b == null || Number.isNaN(b) ? '+ \\,?\\,' : b < 0 ? `- ${fmtNum(Math.abs(b))}` : `+ ${fmtNum(b)}`;
      return tex(`y = ${Q(a, 3)}\\,x^{2} ${bTex}\\,x`, true)
        + rich(`roots at $x = 0$ and $x = -\\frac{b}{a}$`);
    }

    if (g.kind === 'track') return g.tex(g.params);

    if (g.kind === 'spinner') {
      const { px, py } = g.params;
      const have = px != null && py != null && !Number.isNaN(px) && !Number.isNaN(py);
      const slopeTex = have ? (py === 0 ? '\\text{vertical}' : fmtNum(-px / py, 2)) : null;
      return tex(`x^{2} + y^{2} = ${g.r * g.r} \\;\\Rightarrow\\; \\frac{dy}{dx} = -\\frac{x}{y}${have ? ` = ${slopeTex} \\;\\text{ at } (${fmtNum(px)}, ${fmtNum(py)})` : ''}`, true);
    }

    if (g.kind === 'chrono') {
      if (g.solveFor === 'v') {
        const v = g.params.v;
        const arr = v > 0 ? g.d / v : null;
        return tex(`\\text{arrival} = \\frac{d}{v} = \\frac{${g.d}}{${Q(v, 0)}}${arr != null && !Number.isNaN(arr) ? ` = ${fmtNum(arr, 2)}\\,\\text{s}` : ''}`, true)
          + rich(`door open on $${g.open0} \\le t \\le ${g.open1}$`);
      }
      const t0 = g.params.t0;
      const arr = t0 != null && !Number.isNaN(t0) ? t0 + g.d / g.v : null;
      return tex(`\\text{arrival} = t_0 + \\frac{d}{v} = ${Q(t0, 1)} + ${fmtNum(g.d / g.v, 1)}${arr != null ? ` = ${fmtNum(arr, 2)}\\,\\text{s}` : ''}`, true)
        + rich(`door open on $${g.open0} \\le t \\le ${g.open1}$`);
    }
    return '';
  },

  // ======================= the rides =======================
  startRide(g) {
    const p = G.levelCtl.pl;
    g.anim.trace = [];
    g.shown = { ...g.params };   // the world may now reveal what you committed to
    if (g.kind === 'apex') {
      p.mode = 'ride'; p.rideGate = g; g.state = 'riding';
      g.ride = { phase: 'walk', x: g.from, t: 0 };
      Sfx.portal();
    } else if (g.kind === 'field') {
      p.mode = 'ride'; p.rideGate = g; g.state = 'riding';
      g.ride = { x: 0, y: g.params.C };
      Sfx.portal();
    } else if (g.kind === 'parabola') {
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
      let medal = g.runs === 1 ? 'gold' : g.runs === 2 ? 'silver' : 'bronze';
      let note = '';
      if (g.predict) {
        const truth = g.predict.truth(g.params, g);
        const ok = Math.abs(g.params.pred - truth) <= g.predict.tol;
        if (ok) {
          note = ' · prediction ✓';
        } else {
          if (medal === 'gold') medal = 'silver';
          note = ` · but you predicted ${fmtNum(g.params.pred)} and the math says **${fmtNum(truth)}** — gold wants the why`;
        }
      }
      g.medal = medal;
      G.hud.toast(`${g.title} cleared — ${medal} ✦${note}`, medal === 'gold' ? 'gold' : 'info');
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
    if (g.kind === 'apex') {
      const r = g.ride;
      if (r.phase === 'walk') {
        r.x = Math.min(r.x + 2.4 * dt, g.params.xp);
        const ym = g.f(r.x);
        p.x = this.mx(g, r.x) - p.w / 2;
        p.y = this.my(g, ym) - p.h;
        g.anim.trace.push([p.x + p.w / 2, p.y + p.h]);
        if (r.x >= g.params.xp) {
          r.phase = 'jump';
          r.t = 0;
          r.fromX = g.params.xp;
          r.fromY = g.f(g.params.xp);
          r.ok = Math.abs(g.params.xp - g.crit) <= g.tolX;
          Sfx.blip();
        }
      } else {
        r.t += dt;
        const T = 0.6, u = Math.min(1, r.t / T);
        let xm, ym;
        if (r.ok) {
          xm = r.fromX + (g.exit[0] - r.fromX) * u;
          ym = r.fromY + (g.exit[1] - r.fromY) * u + 2.4 * 4 * u * (1 - u);
        } else {
          xm = r.fromX + 1.7 * u;
          ym = r.fromY + 1.3 * 4 * u * (1 - u) - 3.2 * u * u;
        }
        p.x = this.mx(g, xm) - p.w / 2;
        p.y = this.my(g, ym) - p.h;
        g.anim.trace.push([p.x + p.w / 2, p.y + p.h]);
        if (u >= 1) {
          if (r.ok) return this.succeed(g, this.mx(g, g.exit[0]) - p.w / 2, this.my(g, g.exit[1]) - p.h);
          return this.fail(g, `Weak launch — the pad at x = ${fmtNum(g.params.xp)} isn’t the summit. Solve $f'(x) = 0$, and make sure it’s a MAX.`);
        }
      }
    }

    else if (g.kind === 'field') {
      const r = g.ride;
      const step = g.flySpeed * dt;
      r.x += step;
      r.y += g.fxy(r.x, r.y) * step;
      p.x = this.mx(g, r.x) - p.w / 2;
      p.y = this.my(g, r.y) - p.h / 2;
      g.anim.trace.push([p.x + p.w / 2, p.y + p.h / 2]);
      if (Math.hypot(r.x - g.ring[0], r.y - g.ring[1]) <= g.ringR) {
        return this.succeed(g, this.mx(g, g.exit[0]) - p.w / 2, this.my(g, g.exit[1]) - p.h);
      }
      if (r.x > g.xEnd || r.y > g.yMax + 1 || r.y < g.yMin - 1) {
        return this.fail(g, 'The field carried you past the ring — the initial condition y(0) = C picks which solution curve you ride.');
      }
    }

    else if (g.kind === 'parabola') {
      const r = g.ride;
      r.t += dt;
      const xm = g.vx * r.t;                       // math-units x along the arc
      const f = this.parabolaF(g);
      const ym = f(xm);
      g.lastLandX = xm;
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

  parabolaF(g, P = g.params) {
    if (g.mode === 'apex') {
      const { h, k } = P;
      const a = -k / (h * h);
      return (x) => a * (x - h) ** 2 + k;
    }
    const { a, b } = P;
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
      // arc preview: live-preview gates show it while tuning (tutorial);
      // everything else only ever shows the values you last RAN.
      const P = this.viewParams(g);
      const show = g.preview === 'live' ? (this.open === g || g.state !== 'idle') : g.state !== 'idle';
      if (show && P && (g.mode === 'coeffs' ? P.a != null && !Number.isNaN(P.a) && P.b != null && !Number.isNaN(P.b) : P.h > 0 && P.k != null)) {
        this.plotCurve(g, ctx, this.parabolaF(g, P), 0, g.rangeMax, pal.preview, true);
      }
    }

    else if (g.kind === 'apex') {
      this.plotCurve(g, ctx, g.f, g.from, g.to, pal.track, false, 5);
      const P = this.viewParams(g);
      if (g.state !== 'idle' && P.xp != null && !Number.isNaN(P.xp)) {
        const px = this.mx(g, P.xp), py = this.my(g, g.f(P.xp));
        ctx.fillStyle = pal.accent;
        ctx.beginPath(); ctx.roundRect(px - 14, py - 8, 28, 7, 3); ctx.fill();
        ctx.strokeStyle = pal.accent; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(px - 9, py - 8); ctx.lineTo(px - 9, py - 15); ctx.moveTo(px + 9, py - 8); ctx.lineTo(px + 9, py - 15); ctx.stroke();
      }
      // station
      const z = g.zone;
      ctx.fillStyle = pal.device;
      ctx.beginPath(); ctx.roundRect(z.x, z.y + z.h - 14, z.w, 14, 4); ctx.fill();
    }

    else if (g.kind === 'field') {
      // the slope field itself: a dash at every lattice point
      ctx.strokeStyle = 'rgba(255,255,255,0.30)';
      ctx.lineWidth = 1.6;
      for (let gx = g.fieldBox[0]; gx <= g.fieldBox[1]; gx++) {
        for (let gy = g.fieldBox[2]; gy <= g.fieldBox[3]; gy++) {
          const s = g.fxy(gx, gy);
          const ang = Math.atan2(-s, 1);   // screen y flips math slope
          const cx = this.mx(g, gx), cy = this.my(g, gy);
          ctx.beginPath();
          ctx.moveTo(cx - Math.cos(ang) * 8, cy - Math.sin(ang) * 8);
          ctx.lineTo(cx + Math.cos(ang) * 8, cy + Math.sin(ang) * 8);
          ctx.stroke();
        }
      }
      // launch rail at x = 0
      const railTop = this.my(g, g.cMax), railBot = this.my(g, g.cMin);
      ctx.strokeStyle = pal.accent; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(g.org[0], railTop - 8); ctx.lineTo(g.org[0], railBot + 8); ctx.stroke();
      const P = this.viewParams(g);
      if (g.state !== 'idle' && P.C != null && !Number.isNaN(P.C)) {
        ctx.fillStyle = pal.accent;
        ctx.beginPath(); ctx.arc(g.org[0], this.my(g, P.C), 6.5, 0, Math.PI * 2); ctx.fill();
      }
      // target ring
      const tx = this.mx(g, g.ring[0]), ty = this.my(g, g.ring[1]);
      const pulse = 1 + Math.sin(t * 4) * 0.12;
      ctx.strokeStyle = '#7dffb0'; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(tx, ty, g.ringR * g.S * pulse, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(125,255,176,0.85)';
      ctx.font = '12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`(${g.ring[0]}, ${g.ring[1]})`, tx, ty - g.ringR * g.S - 8);
      // station
      const z = g.zone;
      ctx.fillStyle = pal.device;
      ctx.beginPath(); ctx.roundRect(z.x, z.y + z.h - 12, z.w, 12, 4); ctx.fill();
    }

    else if (g.kind === 'track') {
      const TP = this.viewParams(g);
      for (const piece of g.pieces) {
        this.plotCurve(g, ctx, (x) => piece.f(x, TP), piece.from, piece.to, pal.track, false, 5);
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
      // chosen release point (only what you last RAN — no live aiming)
      const SP = this.viewParams(g);
      if (g.state !== 'idle' && SP.px != null && !Number.isNaN(SP.px)) {
        const pxp = this.mx(g, SP.px), pyp = this.my(g, SP.py);
        ctx.fillStyle = '#ffd76e';
        ctx.beginPath(); ctx.arc(pxp, pyp, 6, 0, Math.PI * 2); ctx.fill();
        // tangent + radius shown once flying/cleared (the payoff diagram)
        if (g.state === 'riding' && g.ride?.phase === 'fly' || g.state === 'done') {
          ctx.strokeStyle = 'rgba(255,215,110,0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(pxp, pyp); ctx.stroke();
          const m = SP.py === 0 ? null : -SP.px / SP.py;
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
