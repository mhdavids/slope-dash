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
          answerKey: { h: 5, k: 4 },
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
          answerKey: { a: -0.125, b: 2.5 },
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
          answerKey: { k: 8 },
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
          answerKey: { m: -2, b: 10 },
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
          answerKey: { px: 3, py: 4 },
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
          answerKey: { px: -3, py: 4 },
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
          answerKey: { t0: 1 },
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
          answerKey: { v: 112 },
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
};
