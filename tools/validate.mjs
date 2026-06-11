// Run with: node tools/validate.mjs
// Checks level geometry and — crucially — re-simulates every gate's answerKey
// to prove the authored solution actually clears the level.

import { WORLDS } from '../src/data/worlds.js';

const issues = [];
const warn = (m) => issues.push(m);
const PW = 26, PH = 34; // player box

const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

let nGates = 0;
const ids = new Set();

for (const w of WORLDS) {
  if (!w.pal?.accent) warn(`[${w.id}] missing palette accent`);
  for (const l of w.levels) {
    const tag = `[${l.id}]`;
    if (ids.has(l.id)) warn(`${tag} duplicate level id`);
    ids.add(l.id);
    if (!l.platforms?.length) { warn(`${tag} no platforms`); continue; }

    // spawn must stand on something below it
    const spawnFoot = { x: l.spawn[0], y: l.spawn[1], w: PW, h: PH + 16 };
    if (!l.platforms.some((p) => overlap(spawnFoot, p))) warn(`${tag} spawn not above a platform`);

    // flag must stand on a platform top
    if (!l.platforms.some((p) => l.flag.x >= p.x - 8 && l.flag.x <= p.x + p.w && Math.abs(l.flag.y - p.y) < 4)) {
      warn(`${tag} flag not planted on a platform top`);
    }

    for (const g of l.gates || []) {
      nGates++;
      const gtag = `${tag} gate '${g.id}'`;

      if (g.kind === 'troll') {
        if (!g.name || !g.greeting) warn(`${gtag} troll missing name/greeting`);
        if (!Array.isArray(g.riddles) || g.riddles.length < 2) warn(`${gtag} troll needs >= 2 riddles`);
        for (const [ri, r] of (g.riddles || []).entries()) {
          if (!r.q || !r.explain) warn(`${gtag} riddle ${ri} missing q/explain`);
          if (r.type === 'numeric') {
            if (typeof r.answer !== 'number' || !Number.isFinite(r.answer)) warn(`${gtag} riddle ${ri} numeric answer invalid`);
          } else if (r.type === 'mc') {
            const correct = (r.options || []).filter((o) => o.correct).length;
            if (!r.options || r.options.length < 2 || r.options.length > 4) warn(`${gtag} riddle ${ri} needs 2-4 options`);
            if (correct !== 1) warn(`${gtag} riddle ${ri} has ${correct} correct options (needs exactly 1)`);
          } else warn(`${gtag} riddle ${ri} unknown type '${r.type}'`);
        }
        const lock = l.platforms.find((p) => p.gateLock === g.id);
        if (!lock) warn(`${gtag} no gateLock platform (the troll isn't physically blocking)`);
        if (g.standX == null || g.standY == null) warn(`${gtag} missing standX/standY`);
        const z = { ...g.zone };
        if (!l.platforms.some((p) => overlap({ ...z, h: z.h + 8 }, p))) warn(`${gtag} zone not near a platform`);
        continue;   // trolls need no answerKey/predict/ride sim
      }

      if (!g.answerKey) { warn(`${gtag} missing answerKey`); continue; }
      if (!g.title || !g.prompt || !g.controls?.length) warn(`${gtag} missing title/prompt/controls`);
      // zone should sit on / near a platform so the player can reach it
      const z = { ...g.zone };
      if (!l.platforms.some((p) => overlap({ ...z, h: z.h + 8 }, p))) warn(`${gtag} zone not near a platform`);
      // every control key must exist in answerKey
      for (const c of g.controls) if (!(c.key in g.answerKey)) warn(`${gtag} control '${c.key}' missing from answerKey`);

      const mx = (x) => g.org[0] + g.S * x;
      const my = (y) => g.org[1] - g.S * y;
      const d = (f, x) => (f(x + 1e-4) - f(x - 1e-4)) / 2e-4;

      let simLandX = null;   // captured for prediction verification

      if (g.kind === 'parabola') {
        const P = g.answerKey;
        const f = g.mode === 'apex'
          ? (x) => (-P.k / (P.h * P.h)) * (x - P.h) ** 2 + P.k
          : (x) => P.a * x * x + P.b * x;
        let landed = false;
        for (let x = 0.05; x <= g.rangeMax; x += 0.02) {
          const box = { x: mx(x) - PW / 2, y: my(f(x)) - PH, w: PW, h: PH };
          const slope = d(f, x);
          let crashed = false;
          for (const p of l.platforms) {
            if (!overlap(box, p)) continue;
            if (slope < 0 && box.y + PH - p.y < 26) { landed = true; simLandX = x; } else { crashed = true; }
            break;
          }
          for (const s of l.spikes || []) if (overlap(box, s)) crashed = true;
          if (crashed) { warn(`${gtag} answerKey crashes mid-flight at x=${x.toFixed(2)}`); break; }
          if (landed) break;
          if (f(x) < g.floorY) { warn(`${gtag} answerKey falls below floor without landing`); break; }
        }
        if (!landed) warn(`${gtag} answerKey never lands on a platform`);
      }

      else if (g.kind === 'track') {
        const P = g.answerKey;
        for (const s of g.seams) {
          const L = g.pieces.find((q) => Math.abs(q.to - s) < 1e-9);
          const R = g.pieces.find((q) => Math.abs(q.from - s) < 1e-9);
          if (!L || !R) { warn(`${gtag} seam ${s} has no adjoining pieces`); continue; }
          const gap = Math.abs(L.f(s, P) - R.f(s, P));
          if (gap > 0.01) warn(`${gtag} answerKey leaves a value gap ${gap.toFixed(3)} at seam ${s}`);
          if (g.needC1) {
            const dgap = Math.abs(d((x) => L.f(x, P), s) - d((x) => R.f(x, P), s));
            if (dgap > 0.01) warn(`${gtag} answerKey leaves a slope gap ${dgap.toFixed(3)} at seam ${s}`);
          }
        }
        const last = g.pieces[g.pieces.length - 1];
        const endY = my(last.f(last.to, P));
        const endX = mx(last.to);
        if (!l.platforms.some((p) => endX >= p.x && endX <= p.x + p.w && Math.abs(endY - p.y) < 6)) {
          warn(`${gtag} track end (${endX.toFixed(0)}, ${endY.toFixed(0)}) doesn't meet a platform top`);
        }
        // the start of the track should sit at the station
        const startY = my(g.pieces[0].f(g.pieces[0].from, P));
        if (!l.platforms.some((p) => Math.abs(startY - p.y) < 8)) warn(`${gtag} track start not at a platform top`);
      }

      else if (g.kind === 'spinner') {
        const { px, py } = g.answerKey;
        if (Math.abs(px * px + py * py - g.r * g.r) > 1e-6) warn(`${gtag} answerKey (${px},${py}) not on circle r=${g.r}`);
        const th = Math.atan2(py, px);
        const dx = g.spin > 0 ? -Math.sin(th) : Math.sin(th);
        const dy = g.spin > 0 ? Math.cos(th) : -Math.cos(th);
        let hit = false;
        for (let s = 0; s <= g.r * 7; s += 0.01) {
          const fx = px + dx * s, fy = py + dy * s;
          if (Math.hypot(fx - g.target[0], fy - g.target[1]) <= g.targetR) { hit = true; break; }
        }
        if (!hit) warn(`${gtag} answerKey tangent ray misses target (${g.target})`);
        // exit must sit on a platform top
        const ex = mx(g.exit[0]), ey = my(g.exit[1]);
        if (!l.platforms.some((p) => ex >= p.x && ex <= p.x + p.w && Math.abs(ey - p.y) < 6)) {
          warn(`${gtag} exit (${ex.toFixed(0)}, ${ey.toFixed(0)}) not on a platform top`);
        }
      }

      else if (g.kind === 'chrono') {
        const arrive = g.solveFor === 'v' ? g.d / g.answerKey.v : g.answerKey.t0 + g.d / g.v;
        if (arrive < g.open0 || arrive > g.open1) warn(`${gtag} answerKey arrives at ${arrive.toFixed(2)} outside [${g.open0}, ${g.open1}]`);
        const lock = l.platforms.find((p) => p.gateLock === g.id);
        if (!lock) warn(`${gtag} no gateLock platform (door isn't physically blocking)`);
        else if (Math.abs(lock.x - (g.zone.x + g.zone.w / 2 + g.d)) > 2) warn(`${gtag} gateLock platform not at door position`);
      }

      else if (g.kind === 'apex') {
        const { xp } = g.answerKey;
        if (Math.abs(xp - g.crit) > g.tolX) warn(`${gtag} answerKey xp=${xp} outside tolX of crit=${g.crit}`);
        // crit must actually be a local max: f' flips + to −
        const dl = d(g.f, g.crit - 0.2), dr = d(g.f, g.crit + 0.2);
        if (!(dl > 0 && dr < 0)) warn(`${gtag} crit=${g.crit} is not a local max (f' ${dl.toFixed(2)} → ${dr.toFixed(2)})`);
        const ex = mx(g.exit[0]), ey = my(g.exit[1]);
        if (!l.platforms.some((p) => ex >= p.x && ex <= p.x + p.w && Math.abs(ey - p.y) < 6)) {
          warn(`${gtag} exit (${ex.toFixed(0)}, ${ey.toFixed(0)}) not on a platform top`);
        }
        // terrain start should meet a platform top (the station ledge)
        const sy = my(g.f(g.from));
        if (!l.platforms.some((p) => Math.abs(sy - p.y) < 8)) warn(`${gtag} terrain start not at a platform top`);
      }

      else if (g.kind === 'field') {
        const { C } = g.answerKey;
        if (C < g.cMin || C > g.cMax) warn(`${gtag} answerKey C outside rail [${g.cMin}, ${g.cMax}]`);
        // Euler-integrate exactly like the ride does (coarser step, same scheme)
        let x = 0, y = C, hit = false;
        while (x <= g.xEnd) {
          const step = 0.02;
          x += step; y += g.fxy(x, y) * step;
          if (Math.hypot(x - g.ring[0], y - g.ring[1]) <= g.ringR) { hit = true; break; }
          if (y > g.yMax + 1 || y < g.yMin - 1) break;
        }
        if (!hit) warn(`${gtag} answerKey C=${C} never threads the ring`);
        const ex = mx(g.exit[0]), ey = my(g.exit[1]);
        if (!l.platforms.some((p) => ex >= p.x && ex <= p.x + p.w && Math.abs(ey - p.y) < 6)) {
          warn(`${gtag} exit (${ex.toFixed(0)}, ${ey.toFixed(0)}) not on a platform top`);
        }
      }

      else warn(`${gtag} unknown kind '${g.kind}'`);

      // ---- prediction verification: the authored pred must match the math ----
      if (!g.predict) warn(`${gtag} missing predict config (gold needs a prediction)`);
      else {
        if (g.answerKey.pred == null) warn(`${gtag} answerKey missing pred`);
        else {
          const mock = { ...g, lastLandX: simLandX };
          const truth = g.predict.truth(g.answerKey, mock);
          if (truth == null || Number.isNaN(truth)) warn(`${gtag} predict.truth() returned ${truth}`);
          else if (Math.abs(g.answerKey.pred - truth) > g.predict.tol) {
            warn(`${gtag} answerKey.pred=${g.answerKey.pred} but truth=${truth.toFixed(3)} (tol ${g.predict.tol})`);
          }
        }
      }
    }
    if (!(l.gates || []).length) warn(`${tag} has no gates — that's just a platformer`);
  }
}

const nLevels = WORLDS.reduce((s, w) => s + w.levels.length, 0);
console.log(`Worlds: ${WORLDS.length} · Levels: ${nLevels} · Gates: ${nGates}`);
if (issues.length) {
  console.log(`\n✗ ${issues.length} issue(s):`);
  for (const i of issues) console.log('  -', i);
  process.exit(1);
} else {
  console.log('✓ All levels valid — every answerKey clears its level.');
}
