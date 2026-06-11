// All level + gate data. Coordinates in px (960×540 view). Each gate carries an
// `answerKey` — a known-good solution used by tools/validate.mjs and the debug
// auto-solver; the GAME never shows it.
//
// Math-space: gate.org is the screen position of the math origin; gate.S is
// px per unit; math y points UP (screen y = org.y − S·y).

import { rich, fmtNum } from '../engine/g.js';

export const WORLDS = [
  // ======================= WORLD 1 — transformations =======================
  {
    id: 'w1', name: 'Vertex Valley', tagline: 'parabolas & transformations (precalc warm-up)',
    pal: {
      sky1: '#2b2d52', sky2: '#7a4a6e', grid: 'rgba(255,255,255,0.05)',
      hillFar: 'rgba(58,48,92,0.55)', hillNear: 'rgba(40,32,68,0.7)',
      plat: '#3f3a66', platTop: '#6c5e9e', spike: '#ff5d5d',
      accent: '#ffd76e', device: '#262244', track: '#ffd76e', preview: 'rgba(255,215,110,0.65)',
    },
    levels: [
      {
        id: 'w1l1', name: 'First Flight', w: 1320, h: 620,
        spawn: [60, 420],
        platforms: [
          { x: 0, y: 460, w: 380, h: 160 },
          { x: 708, y: 460, w: 560, h: 160 },
        ],
        spikes: [],
        flag: { x: 1180, y: 460 },
        lesson: 'Vertex form y = a(x − h)² + k: the arc peaks at (h, k), and a parabola through (0, 0) lands at **x = 2h** — symmetry does the aiming.',
        gates: [{
          id: 'w1g1', kind: 'parabola', mode: 'apex', title: 'the Jump Scope',
          zone: { x: 296, y: 404, w: 64, h: 56 },
          org: [330, 460], S: 42, vx: 3, rangeMax: 13, floorY: -1.5,
          axes: [-0.5, 13, 0, 8.5], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'The pit is wide. Place your **apex (h, k)** — the jump arc is y = a(x − h)^{2} + k through (0, 0), so symmetry lands you at **x = 2h**. The far ledge runs from x = 9 to x = 22.',
          note: 'Higher k clears more, but the landing point only cares about **h**.',
          controls: [
            { key: 'h', label: 'h (apex x)', input: 'slider', min: 1, max: 9, step: 0.5 },
            { key: 'k', label: 'k (apex height)', input: 'slider', min: 1, max: 8, step: 0.5 },
          ],
          start: { h: 2, k: 3 },
          preview: 'live',   // the one tutorial gate that shows its arc while you tune
          predict: { label: 'you’ll land at x =', tol: 0.6, truth: (P, g) => g.lastLandX },
          answerKey: { h: 5, k: 4, pred: 10 },
        }],
      },
      {
        id: 'w1l2', name: 'Standard Form', w: 1320, h: 620,
        spawn: [60, 420],
        platforms: [
          { x: 0, y: 460, w: 380, h: 160 },
          { x: 560, y: 160, w: 40, h: 460 },     // the wall
          { x: 840, y: 460, w: 420, h: 160 },
        ],
        spikes: [{ x: 380, y: 600, w: 460, h: 20 }],
        flag: { x: 1180, y: 460 },
        lesson: 'Standard form y = ax² + bx factors as x(ax + b): roots at x = 0 and x = **−b/a** — the launch and the landing. The wall is a constraint on the values *between* the roots.',
        gates: [{
          id: 'w1g2', kind: 'parabola', mode: 'coeffs', title: 'the Jump Scope II',
          zone: { x: 296, y: 404, w: 64, h: 56 },
          org: [330, 460], S: 30, vx: 3.4, rangeMax: 26, floorY: -1.5,
          axes: [-0.5, 26, 0, 14], tickEvery: 1, tickLabelEvery: 4,
          prompt: 'Exact entry this time: **y = ax^{2} + bx**. Clear the wall (top at y = 10, spanning x ∈ [7.7, 9]) and land on the far ledge (y = 0, x ∈ [17, 31]). Where does y = ax^{2} + bx return to zero?',
          note: 'Factor it: y = x(ax + b) ⇒ the far root is x = **−b/a**. Aim the root at the ledge, then check the wall.',
          controls: [
            { key: 'a', label: 'a', input: 'number', step: 'any' },
            { key: 'b', label: 'b', input: 'number', step: 'any' },
          ],
          start: { a: null, b: null },
          predict: { label: 'you’ll land at x =', tol: 0.6, truth: (P, g) => g.lastLandX },
          answerKey: { a: -0.125, b: 2.5, pred: 20 },
        }],
      },
    ],
  },

  // ======================= WORLD 2 — continuity =======================
  {
    id: 'w2', name: 'Seam City', tagline: 'continuity & differentiability',
    pal: {
      sky1: '#101426', sky2: '#23365c', grid: 'rgba(140,190,255,0.06)',
      hillFar: 'rgba(28,42,80,0.6)', hillNear: 'rgba(18,28,58,0.75)',
      plat: '#27314f', platTop: '#46598c', spike: '#ff5d5d',
      accent: '#7dd4ff', device: '#16203a', track: '#7dd4ff', preview: 'rgba(125,212,255,0.6)',
    },
    levels: [
      {
        id: 'w2l1', name: 'Mind the Gap', w: 960, h: 620,
        spawn: [100, 226],
        platforms: [
          { x: 60, y: 260, w: 150, h: 360 },
          { x: 470, y: 320, w: 430, h: 300 },
        ],
        spikes: [{ x: 210, y: 600, w: 260, h: 20 }],
        flag: { x: 840, y: 320 },
        lesson: 'Continuity at a seam x = c: the left piece’s value and the right piece’s value must **agree** — lim_{x→c⁻} f = lim_{x→c⁺} f. One equation, one unknown.',
        gates: [{
          id: 'w2g1', kind: 'track', title: 'the Seam Welder',
          zone: { x: 140, y: 212, w: 56, h: 48 },
          org: [200, 260], S: 30, rideSpeed: 2.6,
          axes: [0, 10, -3, 5], tickEvery: 1, tickLabelEvery: 2, seamLabelY: 4.5,
          seams: [4], needC1: false,
          pieces: [
            { f: (x) => (x * x) / 4, from: 0, to: 4 },
            { f: (x, P) => -x + P.k, from: 4, to: 10 },
          ],
          tex: (P) => rich(`f(x) = x^{2}/4 for 0 ≤ x ≤ 4 · then · f(x) = −x + **${P.k ?? '?'}** for 4 < x ≤ 10`),
          prompt: 'The coaster track is piecewise — and the pieces don’t meet. Choose **k** so the track is **continuous at x = 4**: the left piece ends at f(4) = 4²/4 = 4, so the right piece must start there too.',
          note: 'Set −(4) + k = 4 and the seam welds itself.',
          controls: [{ key: 'k', label: 'k', input: 'number', step: 'any' }],
          start: { k: 5 },
          predict: { label: 'the seam height f(4) =', tol: 0.15, truth: () => 4 },
          answerKey: { k: 8, pred: 4 },
        }],
      },
      {
        id: 'w2l2', name: 'Smooth Operator', w: 960, h: 640,
        spawn: [40, 420],
        platforms: [
          { x: 0, y: 460, w: 170, h: 180 },
          { x: 150, y: 370, w: 90, h: 24 },
          { x: 60, y: 286, w: 150, h: 30 },
          { x: 300, y: 478, w: 560, h: 160 },
        ],
        spikes: [{ x: 240, y: 620, w: 60, h: 20 }],
        flag: { x: 800, y: 478 },
        lesson: 'Differentiability at a seam needs **two** matches: values agree (continuous) AND one-sided slopes agree. The classic “find m and b” problem — value equation + derivative equation.',
        gates: [{
          id: 'w2g2', kind: 'track', title: 'the Seam Welder II',
          zone: { x: 90, y: 238, w: 56, h: 48 },
          org: [180, 430], S: 24, rideSpeed: 2.2,
          axes: [0, 7, -3, 7], tickEvery: 1, tickLabelEvery: 2, seamLabelY: 6.5,
          seams: [4], needC1: true,
          pieces: [
            { f: (x) => 6 - (x * x) / 4, from: 0, to: 4 },
            { f: (x, P) => P.m * x + P.b, from: 4, to: 6 },
          ],
          tex: (P) => rich(`f(x) = 6 − x^{2}/4 for 0 ≤ x ≤ 4 · then · f(x) = **${P.m ?? '?'}**·x + **${P.b ?? '?'}** for 4 < x ≤ 6`),
          prompt: 'A continuous seam isn’t enough at speed — a **corner** will throw you. Choose **m** and **b** so the track is continuous AND differentiable at x = 4: match the **value** f(4) = 2 and the **slope** f′(4) = −4/2 = −2.',
          note: 'Two conditions, two unknowns: m·4 + b = 2 and m = −2.',
          controls: [
            { key: 'm', label: 'm (slope)', input: 'number', step: 'any' },
            { key: 'b', label: 'b (intercept)', input: 'number', step: 'any' },
          ],
          start: { m: -1, b: 6 },
          predict: { label: 'the matched slope f′(4) =', tol: 0.15, truth: () => -2 },
          answerKey: { m: -2, b: 10, pred: -2 },
        }],
      },
    ],
  },

  // ======================= WORLD 3 — implicit differentiation =======================
  {
    id: 'w3', name: 'Spin Station', tagline: 'implicit differentiation · tangent lines',
    pal: {
      sky1: '#120a24', sky2: '#2c1b4e', grid: 'rgba(199,146,255,0.07)',
      hillFar: 'rgba(44,27,78,0.5)', hillNear: 'rgba(30,18,56,0.7)',
      plat: '#322550', platTop: '#5d4694', spike: '#ff5d5d',
      accent: '#c792ff', device: '#1d1336', track: '#c792ff', preview: 'rgba(199,146,255,0.6)',
    },
    levels: [
      {
        id: 'w3l1', name: 'Release Point', w: 980, h: 620,
        spawn: [60, 326],
        platforms: [
          { x: 0, y: 360, w: 260, h: 260 },
          { x: 720, y: 368, w: 240, h: 252 },
        ],
        spikes: [],
        flag: { x: 900, y: 368 },
        lesson: 'On x² + y² = r², implicit differentiation gives 2x + 2y·y′ = 0 ⇒ **dy/dx = −x/y** — and the tangent is perpendicular to the radius. A spinning object releases **along the tangent**.',
        gates: [{
          id: 'w3g1', kind: 'spinner', title: 'the Release Computer',
          zone: { x: 228, y: 280, w: 64, h: 80 },
          org: [430, 300], S: 34, r: 5, spin: -1, period: 6, podAngle: Math.PI,
          flySpeed: 7, target: [7, 1], targetR: 0.8, exit: [10, -2],
          axes: [-6, 11, -5, 6], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'The pod spins **clockwise** on x^{2} + y^{2} = 25 and releases you **along the tangent line**. The tangent at (x, y) has slope **dy/dx = −x/y** (and is ⊥ to the radius). Pick the release point P so the throw passes through the green ring at **(7, 1)**.',
          note: 'Lattice points on this circle: (±3, ±4), (±4, ±3), (±5, 0), (0, ±5). Which one’s tangent line hits (7, 1) — going the right way?',
          controls: [
            { key: 'px', label: 'release x', input: 'number', step: 0.5 },
            { key: 'py', label: 'release y', input: 'number', step: 0.5 },
          ],
          start: { px: null, py: null },
          predict: { label: 'tangent slope −x/y at your P =', tol: 0.15, truth: (P) => -P.px / P.py },
          answerKey: { px: 3, py: 4, pred: -0.75 },
        }],
      },
      {
        id: 'w3l2', name: 'Double Tangent', w: 980, h: 620,
        spawn: [50, 346],
        platforms: [
          { x: 0, y: 380, w: 260, h: 240 },
          { x: 560, y: 90, w: 220, h: 36 },
        ],
        spikes: [{ x: 300, y: 600, w: 400, h: 20 }],
        flag: { x: 720, y: 90 },
        lesson: 'Two lattice points can look right — only one tangent **direction** works. Check both the line AND the spin: a clockwise wheel at (x, y) moves along (sin θ, −cos θ) — direction matters as much as slope.',
        gates: [{
          id: 'w3g2', kind: 'spinner', title: 'the Release Computer II',
          zone: { x: 225, y: 300, w: 64, h: 84 },
          org: [430, 330], S: 30, r: 5, spin: -1, period: 5.2, podAngle: Math.PI,
          flySpeed: 7, target: [1, 7], targetR: 0.8, exit: [6, 8],
          axes: [-6, 8, -6, 9], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'Same circle (x^{2} + y^{2} = 25), clockwise spin — but the ring sits high at **(1, 7)**. Two mirror-image lattice points have tangent lines through it; the spin direction makes only **one** of them a hit. Choose carefully.',
          note: 'Candidates worth checking: (−3, 4) and (−4, 3). Slope at P is −x/y; a clockwise release at angle θ travels along (sin θ, −cos θ).',
          controls: [
            { key: 'px', label: 'release x', input: 'number', step: 0.5 },
            { key: 'py', label: 'release y', input: 'number', step: 0.5 },
          ],
          start: { px: null, py: null },
          predict: { label: 'tangent slope −x/y at your P =', tol: 0.15, truth: (P) => -P.px / P.py },
          answerKey: { px: -3, py: 4, pred: 0.75 },
        }],
      },
    ],
  },

  // ======================= WORLD 4 — motion & timing =======================
  {
    id: 'w4', name: 'Chrono Run', tagline: 'rates, schedules & motion',
    pal: {
      sky1: '#0e2422', sky2: '#1e4a3a', grid: 'rgba(125,255,176,0.06)',
      hillFar: 'rgba(20,58,46,0.55)', hillNear: 'rgba(12,40,32,0.75)',
      plat: '#1f3a32', platTop: '#3a6b58', spike: '#ff5d5d',
      accent: '#7dffb0', device: '#10241e', track: '#7dffb0', preview: 'rgba(125,255,176,0.6)',
    },
    levels: [
      {
        id: 'w4l1', name: 'The Door Schedule', w: 1100, h: 620,
        spawn: [60, 426],
        platforms: [
          { x: 0, y: 460, w: 1100, h: 160 },
          { x: 770, y: 300, w: 14, h: 160, gateLock: 'w4g1' },
        ],
        spikes: [],
        flag: { x: 1000, y: 460 },
        lesson: 'Distance = rate × time, run backwards: arrival = t₀ + d/v. Solving “when do I leave?” is solving an equation about **time**, not distance — the first step toward position functions s(t).',
        gates: [{
          id: 'w4g1', kind: 'chrono', title: 'the Stopwatch',
          zone: { x: 200, y: 412, w: 60, h: 48 },
          org: [230, 460], S: 1,
          d: 540, v: 90, open0: 6, open1: 8, doorTop: 300, doorH: 160,
          prompt: 'The energy door ahead opens only on **6 ≤ t ≤ 8** (seconds). It is **d = 540 px** away and you run at a fixed **v = 90 px/s** — a 6-second trip. Choose your departure time **t₀** so you arrive while it’s open.',
          note: 'arrival = t₀ + 540/90 = t₀ + 6. Make that land in [6, 8].',
          controls: [{ key: 't0', label: 't₀ (departure, s)', input: 'number', step: 0.1 }],
          start: { t0: null },
          predict: { label: 'your arrival time t =', tol: 0.2, truth: (P, g) => P.t0 + g.d / g.v },
          answerKey: { t0: 1, pred: 7 },
        }],
      },
      {
        id: 'w4l2', name: 'Set the Pace', w: 1160, h: 620,
        spawn: [60, 426],
        platforms: [
          { x: 0, y: 460, w: 1160, h: 160 },
          { x: 830, y: 300, w: 14, h: 160, gateLock: 'w4g2' },
        ],
        spikes: [],
        flag: { x: 1060, y: 460 },
        lesson: 'Same equation, different unknown: with departure fixed at t = 0, arrival = d/v — solving for the **rate**. Average speed = distance/time is the seed of every velocity problem in Unit 4.',
        gates: [{
          id: 'w4g2', kind: 'chrono', title: 'the Stopwatch II', solveFor: 'v',
          zone: { x: 200, y: 412, w: 60, h: 48 },
          org: [230, 460], S: 1,
          d: 600, v: 0, open0: 5, open1: 5.5, doorTop: 300, doorH: 160,
          prompt: 'This door is stingy: open only on **5 ≤ t ≤ 5.5**, at **d = 600 px**. You leave **at t = 0** — but this time you set your own pace. Choose **v** so that 600/v lands inside the window.',
          note: 'You need 600/v ∈ [5, 5.5] — solve both ends: v ∈ [600/5.5, 600/5] ≈ [109.1, 120].',
          controls: [{ key: 'v', label: 'v (px/s)', input: 'number', step: 1 }],
          start: { v: null },
          predict: { label: 'your arrival time t =', tol: 0.2, truth: (P, g) => g.d / P.v },
          answerKey: { v: 112, pred: 5.36 },
        }],
      },
    ],
  },
  // ======================= WORLD 5 — critical points =======================
  {
    id: 'w5', name: 'Summit Springs', tagline: 'critical points & the first-derivative test',
    pal: {
      sky1: '#2d1b3e', sky2: '#b4533f', grid: 'rgba(255,176,92,0.06)',
      hillFar: 'rgba(94,42,52,0.55)', hillNear: 'rgba(64,28,40,0.75)',
      plat: '#4a2c38', platTop: '#7c4a52', spike: '#ff5d5d',
      accent: '#ffb05c', device: '#2c1824', track: '#ffb05c', preview: 'rgba(255,176,92,0.6)',
    },
    levels: [
      {
        id: 'w5l1', name: 'Apex Hunt', w: 1000, h: 620,
        spawn: [60, 426],
        platforms: [
          { x: 0, y: 460, w: 240, h: 160 },
          { x: 640, y: 240, w: 300, h: 36 },
        ],
        spikes: [{ x: 240, y: 600, w: 400, h: 20 }],
        flag: { x: 880, y: 240 },
        lesson: 'Maxima live where **f′(x) = 0**: set the derivative to zero and solve. The spring pad only has enough launch height at the summit — “pretty close to the top” is measurably not the top.',
        gates: [{
          id: 'w5g1', kind: 'apex', title: 'the Summit Pad',
          zone: { x: 176, y: 412, w: 60, h: 48 },
          org: [240, 460], S: 40, from: 0, to: 8,
          f: (x) => -(x * x) / 4 + 2 * x,
          crit: 4, tolX: 0.3, exit: [11, 5.5],
          texF: 'f(x) = −x^{2}/4 + 2x', texDf: 'f′(x) = −x/2 + 2',
          axes: [0, 11.5, 0, 6], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'The ridge ahead is the curve **f(x) = −x^{2}/4 + 2x**, and your spring pad deploys wherever you say. Only the **summit** gives enough launch height to reach the high ledge. Where is the top? (The top is where the slope runs out.)',
          note: 'Solve f′(x) = −x/2 + 2 = 0. The pad tolerates being off by about 0.3 — eyeballing won’t cut it.',
          controls: [{ key: 'xp', label: 'pad position x_{p}', input: 'number', step: 0.1 }],
          start: { xp: null },
          predict: { label: 'pad height f(x_{p}) =', tol: 0.2, truth: (P, g) => g.f(P.xp) },
          answerKey: { xp: 4, pred: 4 },
        }],
      },
      {
        id: 'w5l2', name: 'False Summit', w: 980, h: 620,
        spawn: [80, 385],
        platforms: [
          { x: 0, y: 419, w: 210, h: 200 },
          { x: 600, y: 184, w: 300, h: 36 },
        ],
        spikes: [{ x: 210, y: 600, w: 390, h: 20 }],
        flag: { x: 840, y: 184 },
        lesson: 'f′(x) = 0 has TWO solutions here — and one of them is a **minimum**. The first-derivative test tells them apart: a max is where f′ flips from + to −. Plant your pad in the valley and the valley keeps you.',
        gates: [{
          id: 'w5g2', kind: 'apex', title: 'the Summit Pad II',
          zone: { x: 140, y: 371, w: 56, h: 48 },
          org: [200, 360], S: 44, from: 0, to: 8,
          f: (x) => ((x - 4) ** 3) / 12 - (x - 4),
          crit: 2, tolX: 0.3, exit: [10.5, 4],
          texF: 'f(x) = (x−4)^{3}/12 − (x−4)', texDf: 'f′(x) = (x−4)^{2}/4 − 1',
          axes: [0, 11, -2.5, 4.5], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'This ridge is a cubic: **f(x) = (x−4)^{3}/12 − (x−4)**. Setting f′ = 0 gives **two** candidates — but one is the local max and the other is the valley floor. Deploy the pad at the **maximum**. Choose wrong and enjoy the scenery down there.',
          note: '(x−4)²/4 − 1 = 0 ⇒ x = 2 or x = 6. Which one does the first-derivative test crown? (Check the sign of f′ on each side.)',
          controls: [{ key: 'xp', label: 'pad position x_{p}', input: 'number', step: 0.1 }],
          start: { xp: null },
          predict: { label: 'pad height f(x_{p}) =', tol: 0.15, truth: (P, g) => g.f(P.xp) },
          answerKey: { xp: 2, pred: 1.33 },
        }],
      },
    ],
  },

  // ======================= WORLD 6 — slope fields =======================
  {
    id: 'w6', name: 'Flow Fields', tagline: 'slope fields & initial conditions',
    pal: {
      sky1: '#0a1e28', sky2: '#16424e', grid: 'rgba(110,231,224,0.06)',
      hillFar: 'rgba(20,62,70,0.55)', hillNear: 'rgba(12,44,52,0.75)',
      plat: '#1c3a42', platTop: '#34626e', spike: '#ff5d5d',
      accent: '#6ee7e0', device: '#0e2830', track: '#6ee7e0', preview: 'rgba(110,231,224,0.6)',
    },
    levels: [
      {
        id: 'w6l1', name: 'Ride the Field', w: 760, h: 620,
        spawn: [40, 412],
        platforms: [
          { x: 0, y: 446, w: 200, h: 174 },
          { x: 420, y: 362, w: 240, h: 258 },
        ],
        spikes: [{ x: 200, y: 600, w: 220, h: 20 }],
        flag: { x: 600, y: 362 },
        lesson: 'A slope field is the equation’s current: at every point, a dash with slope dy/dx. Your launch height **y(0) = C is the initial condition** — it picks which solution curve you ride. Same field, different C, completely different fate.',
        gates: [{
          id: 'w6g1', kind: 'field', title: 'the Wind Chart',
          zone: { x: 130, y: 398, w: 56, h: 48 },
          org: [220, 320], S: 42,
          fxy: (x, y) => x / 2,
          fieldBox: [0, 9, -4, 3], cMin: -4, cMax: 3,
          flySpeed: 3, ring: [4, 1], ringR: 0.8, exit: [6, -1], xEnd: 9, yMin: -5, yMax: 4,
          texEq: 'dy/dx = x/2 ⇒ y = x^{2}/4 + C',
          axes: [0, 9, -4, 3.5], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'The glider drifts right and the **wind field dy/dx = x/2** decides your climb. Solutions are the family **y = x^{2}/4 + C**, and your launch height picks C. Thread the ring at **(4, 1)**: which C puts your curve through it?',
          note: 'You need y(4) = 1: that is 16/4 + C = 1. The rail launches you at y(0) = C.',
          controls: [{ key: 'C', label: 'launch height y(0) = C', input: 'number', step: 0.5 }],
          start: { C: null },
          predict: { label: 'your altitude y at x = 2 will be', tol: 0.3, truth: (P) => 1 + P.C },
          answerKey: { C: -3, pred: -2 },
        }],
      },
      {
        id: 'w6l2', name: 'The Dip', w: 800, h: 620,
        spawn: [40, 386],
        platforms: [
          { x: 0, y: 420, w: 180, h: 200 },
          { x: 420, y: 380, w: 240, h: 240 },
        ],
        spikes: [{ x: 180, y: 600, w: 240, h: 20 }],
        flag: { x: 600, y: 380 },
        lesson: 'Your flight bottomed out exactly where the field went flat — the solution’s **minimum is where dy/dx = 0** (here x = 2). Critical points and slope fields are the same fact wearing two outfits.',
        gates: [{
          id: 'w6g2', kind: 'field', title: 'the Wind Chart II',
          zone: { x: 110, y: 372, w: 56, h: 48 },
          org: [200, 300], S: 40,
          fxy: (x, y) => x - 2,
          fieldBox: [0, 7, -4, 4], cMin: -4, cMax: 3.5,
          flySpeed: 3, ring: [5, 1.5], ringR: 0.8, exit: [6.5, -2], xEnd: 7, yMin: -5, yMax: 5,
          texEq: 'dy/dx = x − 2 ⇒ y = x^{2}/2 − 2x + C',
          axes: [0, 7.5, -4, 4.5], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'This wind blows **down** before x = 2 and **up** after — dy/dx = x − 2. Your glider will sag, bottom out, and climb. Pick **C** so the climb threads the ring at **(5, 1.5)** — and predict where the sag is deepest.',
          note: 'y(5) = 25/2 − 10 + C = 2.5 + C. And the lowest point of the flight? Where the dashes lie flat: dy/dx = 0.',
          controls: [{ key: 'C', label: 'launch height y(0) = C', input: 'number', step: 0.5 }],
          start: { C: null },
          predict: { label: 'the x where your flight is LOWEST', tol: 0.3, truth: () => 2 },
          answerKey: { C: -1, pred: 2 },
        }],
      },
    ],
  },
];

// ======================= the Notebook =======================
// Exam-style reference pages for the math behind the gates.
export const NOTEBOOK = {
  'transformations': { term: 'Function transformations', def: 'For y = a·f(x − h) + k: **h** shifts horizontally (x − h moves RIGHT by h), **k** shifts vertically, **a** stretches vertically and flips when negative. Order matters when combined: stretch/flip first, then shift. These four knobs are the whole grammar of graph-moving.' },
  'parabola-forms': { term: 'Vertex form vs standard form', def: 'Vertex form y = a(x−h)² + k: vertex (h, k) visible, symmetry axis x = h. Standard form y = ax² + bx + c: with c = 0 it factors as x(ax + b), giving roots x = 0 and x = −b/a — launch and landing. Convert by completing the square; the vertex sits halfway between the roots.' },
  'continuity': { term: 'Continuity at a point', def: 'f is continuous at c iff three things hold: f(c) is defined; lim_{x→c} f(x) exists (left and right limits agree); and the limit equals the value. For piecewise functions, the seam x = c is where all three get tested — set the pieces equal there and solve.' },
  'piecewise-continuity': { term: 'Making piecewise functions continuous', def: 'At a seam x = c, set (left piece at c) = (right piece at c) and solve for the unknown constant. One seam, one equation, one unknown. The AP loves “find k so that f is continuous” — it is exactly the Seam Welder.' },
  'differentiability': { term: 'Differentiability & corners', def: 'Differentiable at c means the one-sided slopes agree (and f is continuous there first). A corner — values match, slopes don’t — is continuous but NOT differentiable: |x| at 0 is the classic. To make a piecewise track smooth, match BOTH f values and f′ values at the seam: two equations, two unknowns (m and b).' },
  'implicit-diff': { term: 'Implicit differentiation', def: 'When x and y are tangled (x² + y² = 25), differentiate both sides in x, with every y-term emitting a dy/dx by the chain rule: 2x + 2y·y′ = 0 ⇒ y′ = −x/y. The slope arrives without ever solving for y.' },
  'tangent-perp-radius': { term: 'Circle tangents ⊥ radius', def: 'On x² + y² = r², the tangent slope −x/y is the negative reciprocal of the radius slope y/x: tangent ⊥ radius, always. A point released from a spinning circle travels along this tangent — which is why a clockwise wheel at angle θ flies along (sin θ, −cos θ).' },
  'rates-dvt': { term: 'd = v·t and average rate', def: 'Constant speed: distance = rate × time, so arrival time = t₀ + d/v, and required pace = d/(time available). Average rate over an interval = Δposition/Δtime — a secant slope. Every Unit 4 motion problem is this idea with the constant-speed assumption removed.' },
  'secant-tangent': { term: 'Secant vs tangent (coming attractions)', def: 'Average rate = slope of the secant through two points; instantaneous rate = slope of the tangent at one point = the limit of secant slopes as the interval shrinks. The Stopwatch levels use averages; the derivative is what happens when the window closes to an instant.' },
  'critical-points': { term: 'Critical points & the first-derivative test', def: 'Candidates for peaks and valleys: where f′(x) = 0 or f′ is undefined. The first-derivative test sorts them: f′ flips **+ to −** ⇒ local max; **− to +** ⇒ local min; no flip ⇒ neither. Summit Springs in one line: solve f′ = 0, then CHECK the sign change — the false summit is the minimum wearing a max’s address.' },
  'slope-fields': { term: 'Slope fields', def: 'A differential equation dy/dx = f(x, y) drawn as weather: at each grid point, a dash with that slope. Solution curves follow the dashes they pass through. Read fields by asking: where are slopes zero? positive? steeper? If the formula has no y, every vertical column of dashes matches (dy/dx = x − 2 is flat exactly on the column x = 2).' },
  'initial-conditions': { term: 'Initial conditions & particular solutions', def: 'Solving dy/dx = x/2 gives a FAMILY: y = x²/4 + C, one curve per C. An initial condition like y(0) = −3 picks the single member through that point — the particular solution. Same field, different launch height, different fate: that is all an initial-value problem is.' },
  'prediction': { term: 'Why the gold medal demands a prediction', def: 'Trial-and-error can clear a gate; only computation can clear it AND call the result in advance. Predicting the landing x, the seam value, the tangent slope, the arrival time — that is exactly what an exam answer is: the consequence of your parameters, stated before the universe checks it.' },
};
