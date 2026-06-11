// All level + gate data. Coordinates in px (960×540 view). Each gate carries an
// `answerKey` — a known-good solution used by tools/validate.mjs and the debug
// auto-solver; the GAME never shows it.
//
// Math-space: gate.org is the screen position of the math origin; gate.S is
// px per unit; math y points UP (screen y = org.y − S·y).

import { rich, tex, fmtNum } from '../engine/g.js';

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
        lesson: 'Vertex form $y = a(x-h)^2 + k$: the graph peaks at the vertex $(h, k)$. A parabola through the origin comes back to height 0 at $x = 2h$ — symmetry does the aiming.',
        gates: [{
          id: 'w1g1', kind: 'parabola', mode: 'apex', title: 'the Jump Scope',
          zone: { x: 296, y: 404, w: 64, h: 56 },
          org: [330, 460], S: 42, vx: 3, rangeMax: 13, floorY: -1.5,
          axes: [-0.5, 13, 0, 8.5], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'Your jump follows the parabola $y = a(x-h)^2 + k$, starting at your feet — the origin $(0,0)$. The sliders set the **vertex** $(h, k)$: the highest point of the jump. Because a parabola is symmetric, the arc comes back down to height 0 at $x = 2h$ — twice the vertex’s x. **Goal: land on the far ledge, which is the ground ($y = 0$) from $x = 9$ to $x = 22$.**',
          note: 'Raising k makes the jump taller, but only **h** moves where you land.',
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
        id: 'w1l2', name: 'Standard Form', w: 1900, h: 620,
        spawn: [60, 420],
        platforms: [
          { x: 0, y: 460, w: 380, h: 160 },
          { x: 560, y: 160, w: 40, h: 460 },     // the wall
          { x: 840, y: 460, w: 420, h: 160 },
          { x: 1260, y: 460, w: 190, h: 24 },    // the troll's bridge
          { x: 1340, y: 344, w: 14, h: 116, gateLock: 'w1t1' },
          { x: 1450, y: 460, w: 420, h: 160 },
        ],
        spikes: [{ x: 380, y: 600, w: 460, h: 20 }, { x: 1260, y: 600, w: 190, h: 20 }],
        flag: { x: 1760, y: 460 },
        lesson: 'Standard form $y = ax^2 + bx$ factors as $x(ax + b)$: roots at $x = 0$ and $x = -\\frac{b}{a}$ — the launch and the landing. The wall is a constraint on the heights *between* the roots.',
        gates: [{
          id: 'w1g2', kind: 'parabola', mode: 'coeffs', title: 'the Jump Scope II',
          zone: { x: 296, y: 404, w: 64, h: 56 },
          org: [330, 460], S: 30, vx: 3.4, rangeMax: 26, floorY: -1.5,
          axes: [-0.5, 26, 0, 14], tickEvery: 1, tickLabelEvery: 4,
          prompt: 'This jump is $y = ax^2 + bx$, and you type the exact coefficients. Factoring gives $y = x(ax + b)$: the arc leaves the ground at $x = 0$ and **returns to the ground at $x = -\\frac{b}{a}$** — that is your landing point. **Goals: (1) land on the ledge ($y = 0$, $17 \\le x \\le 31$), and (2) clear the wall, which rises to height $y = 10$ between $x = 7.7$ and $x = 9$.**',
          note: 'Pick the landing first: choose a and b so $-\\frac{b}{a}$ falls inside the ledge (a must be negative, or you never come down). Then check the wall: your arc’s height at $x = 8$ has to beat 10.',
          controls: [
            { key: 'a', label: 'a', input: 'number', step: 'any' },
            { key: 'b', label: 'b', input: 'number', step: 'any' },
          ],
          start: { a: null, b: null },
          predict: { label: 'you’ll land at x =', tol: 0.6, truth: (P, g) => g.lastLandX },
          answerKey: { a: -0.125, b: 2.5, pred: 20 },
        }, {
          id: 'w1t1', kind: 'troll', name: 'Grundle',
          greeting: 'None shall pass who cannot take a limit. Many have slid. Few have factored.',
          zone: { x: 1268, y: 404, w: 64, h: 56 },
          standX: 1357, standY: 460,
          riddles: [
            { type: 'numeric', tol: 0.01, answer: 6,
              q: 'Evaluate: $\\displaystyle\\lim_{x \\to 3} \\frac{x^2 - 9}{x - 3}$',
              explain: 'Substitution gives $\\frac{0}{0}$ — factor: $\\frac{(x-3)(x+3)}{x-3} = x + 3 \\to 6$.' },
            { type: 'numeric', tol: 0.01, answer: 3,
              q: 'The graph of $y = \\dfrac{6x^2 + 1}{2x^2 - 5}$ has a horizontal asymptote $y = \\,?$',
              explain: 'Equal degrees: the limit at infinity is the ratio of leading coefficients, $\\frac{6}{2} = 3$.' },
            { type: 'mc',
              q: '$\\displaystyle\\lim_{x \\to 2^-} f(x) = 5$ and $\\displaystyle\\lim_{x \\to 2^+} f(x) = 5$, but $f(2) = 7$. Which is true?',
              options: [
                { label: '$\\displaystyle\\lim_{x \\to 2} f(x)$ exists and equals 5', correct: true },
                { label: 'The limit at 2 does not exist' },
                { label: 'f is continuous at $x = 2$' },
                { label: '$\\displaystyle\\lim_{x \\to 2} f(x) = 7$' },
              ],
              explain: 'The one-sided limits agree, so the limit is 5 — the value $f(2) = 7$ is irrelevant to the limit (and breaks continuity: a removable discontinuity).' },
          ],
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
        lesson: 'Continuity at a seam $x = c$: the left piece’s value and the right piece’s value must **agree** — $\\displaystyle\\lim_{x \\to c^-} f(x) = \\lim_{x \\to c^+} f(x)$. One equation, one unknown.',
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
          tex: (P) => tex(`f(x) = \\begin{cases} \\dfrac{x^2}{4} & 0 \\le x \\le 4 \\\\[4pt] -x + ${P.k == null || Number.isNaN(P.k) ? '\\,?\\,' : P.k} & 4 < x \\le 10 \\end{cases}`, true),
          prompt: 'The coaster track is built from **two pieces**, and right now they don’t meet — the cart falls through the gap at $x = 4$. **Choose k so both pieces have the same height at $x = 4$.** (That is what *continuous* means here: the left piece’s ending value equals the right piece’s starting value.)',
          note: 'The left piece ends at height $f(4) = \\frac{4^2}{4} = 4$. So you need $-4 + k = 4$.',
          controls: [{ key: 'k', label: 'k', input: 'number', step: 'any' }],
          start: { k: 5 },
          predict: { label: 'the seam height $f(4)$ =', tol: 0.15, truth: () => 4 },
          answerKey: { k: 8, pred: 4 },
        }],
      },
      {
        id: 'w2l2', name: 'Smooth Operator', w: 1560, h: 640,
        spawn: [40, 420],
        platforms: [
          { x: 0, y: 460, w: 170, h: 180 },
          { x: 150, y: 370, w: 90, h: 24 },
          { x: 60, y: 286, w: 150, h: 30 },
          { x: 300, y: 478, w: 560, h: 160 },
          { x: 860, y: 478, w: 180, h: 22 },     // the troll's bridge
          { x: 940, y: 362, w: 14, h: 116, gateLock: 'w2t1' },
          { x: 1040, y: 478, w: 480, h: 160 },
        ],
        spikes: [{ x: 240, y: 620, w: 60, h: 20 }, { x: 860, y: 620, w: 180, h: 20 }],
        flag: { x: 1420, y: 478 },
        lesson: 'Differentiability at a seam needs **two** matches: the values agree (continuity) AND the one-sided slopes agree. That’s the classic “find m and b” exam problem: one value equation, one derivative equation.',
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
          tex: (P) => {
            const m = P.m == null || Number.isNaN(P.m) ? '\\,?\\,\\cdot ' : P.m === 1 ? '' : P.m === -1 ? '-' : P.m;
            const b = P.b == null || Number.isNaN(P.b) ? '+ \\,?\\,' : P.b < 0 ? `- ${Math.abs(P.b)}` : `+ ${P.b}`;
            return tex(`f(x) = \\begin{cases} 6 - \\dfrac{x^2}{4} & 0 \\le x \\le 4 \\\\[4pt] ${m}x ${b} & 4 < x \\le 6 \\end{cases}`, true);
          },
          prompt: 'At this speed, meeting at the seam isn’t enough — if the two pieces meet at **different slopes**, the corner launches the cart. **Choose m and b so that, at $x = 4$: (1) the heights match, and (2) the slopes match.** The curved piece arrives with height $f(4) = 6 - \\frac{16}{4} = 2$ and slope $f\'(4) = -\\frac{4}{2} = -2$.',
          note: 'Two equations, two unknowns: heights $4m + b = 2$, slopes $m = -2$. Solve for m first, then b.',
          controls: [
            { key: 'm', label: 'm (slope)', input: 'number', step: 'any' },
            { key: 'b', label: 'b (intercept)', input: 'number', step: 'any' },
          ],
          start: { m: -1, b: 6 },
          predict: { label: 'the matched slope $f\'(4)$ =', tol: 0.15, truth: () => -2 },
          answerKey: { m: -2, b: 10, pred: -2 },
        }, {
          id: 'w2t1', kind: 'troll', name: 'Berta',
          greeting: 'I guard the theorems. State your hypotheses or state your farewells.',
          zone: { x: 868, y: 422, w: 64, h: 56 },
          standX: 957, standY: 478,
          riddles: [
            { type: 'mc',
              q: 'f is continuous on $[1, 4]$ with $f(1) = -2$ and $f(4) = 6$. Which conclusion is **guaranteed**?',
              options: [
                { label: '$f(c) = 0$ for at least one $c$ in $(1, 4)$', correct: true },
                { label: 'f has exactly one zero in $(1, 4)$' },
                { label: 'f is increasing on $[1, 4]$' },
                { label: '$f(c) = 7$ for some $c$ in $(1, 4)$' },
              ],
              explain: 'IVT: a continuous function attains every value between $-2$ and $6$, and 0 is between them. It promises at least one zero — never exactly one, and nothing outside the range.' },
            { type: 'mc',
              q: 'The Intermediate Value Theorem requires which hypothesis?',
              options: [
                { label: 'f is continuous on a closed interval $[a, b]$', correct: true },
                { label: 'f is differentiable on $(a, b)$' },
                { label: '$f(a) = f(b)$' },
                { label: 'f is increasing' },
              ],
              explain: 'IVT is a continuity theorem — no derivatives involved. (Differentiability is MVT’s extra demand; $f(a) = f(b)$ is Rolle’s.)' },
            { type: 'mc',
              q: 'g has a **removable** discontinuity at $x = 3$. Which statement must be true?',
              options: [
                { label: '$\\lim_{x \\to 3} g(x)$ exists, but does not equal $g(3)$ (or $g(3)$ is undefined)', correct: true },
                { label: 'The one-sided limits at 3 disagree' },
                { label: 'g is unbounded near $x = 3$' },
                { label: '$g(3)$ does not exist, so the limit cannot exist' },
              ],
              explain: 'Removable = the limit exists but the point is missing or misplaced. Disagreeing sides = jump; unbounded = infinite discontinuity.' },
          ],
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
        id: 'w3l1', name: 'Release Point', w: 1560, h: 620,
        spawn: [60, 326],
        platforms: [
          { x: 0, y: 360, w: 260, h: 260 },
          { x: 720, y: 368, w: 240, h: 252 },
          { x: 960, y: 368, w: 180, h: 22 },     // the troll's bridge
          { x: 1040, y: 252, w: 14, h: 116, gateLock: 'w3t1' },
          { x: 1140, y: 368, w: 400, h: 252 },
        ],
        spikes: [{ x: 960, y: 600, w: 180, h: 20 }],
        flag: { x: 1440, y: 368 },
        lesson: 'On $x^2 + y^2 = r^2$, implicit differentiation gives $2x + 2y\\,y\' = 0$, so $\\frac{dy}{dx} = -\\frac{x}{y}$ — and the tangent is perpendicular to the radius. A spinning object releases **along the tangent**.',
        gates: [{
          id: 'w3g1', kind: 'spinner', title: 'the Release Computer',
          zone: { x: 228, y: 280, w: 64, h: 80 },
          org: [430, 300], S: 34, r: 5, spin: -1, period: 6, podAngle: Math.PI,
          flySpeed: 7, target: [7, 1], targetR: 0.8, exit: [10, -2],
          axes: [-6, 11, -5, 6], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'The pod circles $x^2 + y^2 = 25$ **clockwise**, and when it lets go you fly in a straight line **tangent to the circle** at the release point. Implicit differentiation gives that tangent’s slope: $\\frac{dy}{dx} = -\\frac{x}{y}$. **Enter a release point $(x, y)$ on the circle whose tangent line passes through the green ring at $(7, 1)$.**',
          note: 'The circle’s whole-number points are $(\\pm3, \\pm4)$, $(\\pm4, \\pm3)$, $(\\pm5, 0)$, $(0, \\pm5)$. For a candidate point, write its tangent line with point-slope form and test whether $(7,1)$ is on it. Then sanity-check direction: released clockwise, would you be moving *toward* the ring?',
          controls: [
            { key: 'px', label: 'release x', input: 'number', step: 0.5 },
            { key: 'py', label: 'release y', input: 'number', step: 0.5 },
          ],
          start: { px: null, py: null },
          predict: { label: 'the tangent slope $-\\frac{x}{y}$ at your point =', tol: 0.15, truth: (P) => -P.px / P.py },
          answerKey: { px: 3, py: 4, pred: -0.75 },
        }, {
          id: 'w3t1', kind: 'troll', name: 'Knot',
          greeting: 'Chains within chains, traveler. Differentiate or descend.',
          zone: { x: 968, y: 312, w: 64, h: 56 },
          standX: 1057, standY: 368,
          riddles: [
            { type: 'numeric', tol: 0.01, answer: 8,
              q: 'From a table: $g(2) = 3$, $g\'(2) = 4$, and $f\'(3) = 2$. If $h(x) = f(g(x))$, then $h\'(2) = \\,?$',
              explain: 'Chain rule from tables: $h\'(2) = f\'(g(2)) \\cdot g\'(2) = f\'(3) \\cdot 4 = 2 \\cdot 4 = 8$. Read $f\'$ at the INNER value, not at 2.' },
            { type: 'numeric', tol: 0.01, answer: 3,
              q: 'If $y = \\sin(3x)$, what is $y\'(0)$?',
              explain: '$y\' = 3\\cos(3x)$ by the chain rule; at 0: $3\\cos 0 = 3$. (Forgetting the inner derivative gives 1 — the troll has heard it before.)' },
            { type: 'numeric', tol: 0.01, answer: 1,
              q: 'If $p(x) = x \\cdot e^x$, what is $p\'(0)$?',
              explain: 'Product rule: $p\' = 1 \\cdot e^x + x \\cdot e^x$; at 0: $1 + 0 = 1$.' },
          ],
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
        lesson: 'Two points on the circle had tangent lines through the ring — but a tangent **line** allows two travel directions, and the spin picks one. Always check both the line and the direction of motion.',
        gates: [{
          id: 'w3g2', kind: 'spinner', title: 'the Release Computer II',
          zone: { x: 225, y: 300, w: 64, h: 84 },
          org: [430, 330], S: 30, r: 5, spin: -1, period: 5.2, podAngle: Math.PI,
          flySpeed: 7, target: [1, 7], targetR: 0.8, exit: [6, 8],
          axes: [-6, 8, -6, 9], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'Same circle ($x^2 + y^2 = 25$), still clockwise — but the ring sits high at $(1, 7)$. **Two** of the circle’s whole-number points have tangent lines that pass through the ring. The spin direction makes exactly one of them a hit; the other throws you the wrong way down its own tangent line. **Enter the right release point.**',
          note: 'The two candidates are $(-3, 4)$ and $(4, 3)$ — check both tangent lines through $(1,7)$ yourself. Then picture the clockwise motion at each point: at $(4, 3)$ the pod is heading down-and-right, away from the ring; at $(-3, 4)$ it is heading up-and-right. Direction matters as much as slope.',
          controls: [
            { key: 'px', label: 'release x', input: 'number', step: 0.5 },
            { key: 'py', label: 'release y', input: 'number', step: 0.5 },
          ],
          start: { px: null, py: null },
          predict: { label: 'the tangent slope $-\\frac{x}{y}$ at your point =', tol: 0.15, truth: (P) => -P.px / P.py },
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
        lesson: 'Distance = rate × time, run backwards: arrival $= t_0 + \\frac{d}{v}$. “When do I leave?” is an equation about **time**, not distance — the first step toward position functions $s(t)$.',
        gates: [{
          id: 'w4g1', kind: 'chrono', title: 'the Stopwatch',
          zone: { x: 200, y: 412, w: 60, h: 48 },
          org: [230, 460], S: 1,
          d: 540, v: 90, open0: 6, open1: 8, doorTop: 300, doorH: 160,
          prompt: 'The energy door ahead is open only while $6 \\le t \\le 8$ (seconds — the clock starts at 0 when you step on the pad). The door is $d = 540$ px away, and once you start running you move at a fixed $v = 90$ px/s, so the trip itself takes $\\frac{540}{90} = 6$ seconds. **Choose your departure time $t_0$ so you arrive while the door is open.**',
          note: 'Arrival time = $t_0 + 6$. Pick $t_0$ so that lands inside $[6, 8]$.',
          controls: [{ key: 't0', label: 't₀ (departure, s)', input: 'number', step: 0.1 }],
          start: { t0: null },
          predict: { label: 'your arrival time t =', tol: 0.2, truth: (P, g) => P.t0 + g.d / g.v },
          answerKey: { t0: 1, pred: 7 },
        }],
      },
      {
        id: 'w4l2', name: 'Set the Pace', w: 1760, h: 620,
        spawn: [60, 426],
        platforms: [
          { x: 0, y: 460, w: 1160, h: 160 },
          { x: 830, y: 300, w: 14, h: 160, gateLock: 'w4g2' },
          { x: 1160, y: 460, w: 180, h: 24 },    // the troll's bridge
          { x: 1240, y: 344, w: 14, h: 116, gateLock: 'w4t1' },
          { x: 1340, y: 460, w: 420, h: 160 },
        ],
        spikes: [{ x: 1160, y: 600, w: 180, h: 20 }],
        flag: { x: 1640, y: 460 },
        lesson: 'Same equation, different unknown: with departure fixed at $t = 0$, arrival $= \\frac{d}{v}$ — now you solve for the **rate**. Average speed $= \\frac{\\text{distance}}{\\text{time}}$ is the seed of every velocity problem in Unit 4.',
        gates: [{
          id: 'w4g2', kind: 'chrono', title: 'the Stopwatch II', solveFor: 'v',
          zone: { x: 200, y: 412, w: 60, h: 48 },
          org: [230, 460], S: 1,
          d: 600, v: 0, open0: 5, open1: 5.5, doorTop: 300, doorH: 160,
          prompt: 'This door is stingier: open only while $5 \\le t \\le 5.5$, at distance $d = 600$ px. You leave **immediately at $t = 0$** — but this time you choose your own running speed. **Enter v so that your arrival time, $\\frac{600}{v}$, lands inside the window.**',
          note: 'You need $5 \\le \\frac{600}{v} \\le 5.5$. Solve each side for v (careful: dividing flips things — faster speed means earlier arrival).',
          controls: [{ key: 'v', label: 'v (px/s)', input: 'number', step: 1 }],
          start: { v: null },
          predict: { label: 'your arrival time t =', tol: 0.2, truth: (P, g) => g.d / P.v },
          answerKey: { v: 112, pred: 5.36 },
        }, {
          id: 'w4t1', kind: 'troll', name: 'Old Manny Units',
          greeting: 'Numbers are free. MEANINGS cost a toll.',
          zone: { x: 1168, y: 404, w: 64, h: 56 },
          standX: 1257, standY: 460,
          riddles: [
            { type: 'mc',
              q: '$W(t)$ is the water in a tank, in gallons, at $t$ hours. $W\'(5) = -8$ means:',
              options: [
                { label: 'At $t = 5$ hours, the water is decreasing at 8 gallons per hour', correct: true },
                { label: 'The tank lost 8 gallons during the first 5 hours' },
                { label: 'At $t = 5$ the tank holds 8 fewer gallons than at $t = 0$' },
                { label: 'The tank loses exactly 8 gallons every hour' },
              ],
              explain: 'A derivative is an instantaneous rate: sign = direction, 8 = how fast, units = gallons per hour, “at $t = 5$” = the instant. Totals over intervals are a different tool.' },
            { type: 'mc',
              q: 'L’Hôpital’s rule may be applied to $\\lim \\frac{f(x)}{g(x)}$ only when:',
              options: [
                { label: 'Substitution gives the indeterminate form $\\frac{0}{0}$ or $\\frac{\\infty}{\\infty}$', correct: true },
                { label: 'The limit involves any quotient' },
                { label: 'f and g are both polynomials' },
                { label: 'The quotient rule has already been applied' },
              ],
              explain: 'Verify the form FIRST — applying L’Hôpital to a determinate limit is wrong (and penalized). Then take $\\lim \\frac{f\'}{g\'}$: derivatives separately, never the quotient rule.' },
            { type: 'numeric', tol: 0.01, answer: 5,
              q: 'Evaluate: $\\displaystyle\\lim_{x \\to 0} \\frac{\\sin(5x)}{x}$',
              explain: 'The form is $\\frac{0}{0}$: L’Hôpital gives $\\frac{5\\cos(5x)}{1} \\to 5$. (Or: near 0, $\\sin(5x) \\approx 5x$.)' },
          ],
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
        lesson: 'Maxima live where $f\'(x) = 0$: set the derivative to zero and solve. The spring pad only has enough launch height at the summit — “pretty close to the top” is measurably not the top.',
        gates: [{
          id: 'w5g1', kind: 'apex', title: 'the Summit Pad',
          zone: { x: 176, y: 412, w: 60, h: 48 },
          org: [240, 460], S: 40, from: 0, to: 8,
          f: (x) => -(x * x) / 4 + 2 * x,
          crit: 4, tolX: 0.3, exit: [11, 5.5],
          texF: 'f(x) = -\\frac{x^2}{4} + 2x', texDf: 'f\'(x) = -\\frac{x}{2} + 2',
          axes: [0, 11.5, 0, 6], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'The ridge ahead is the graph of $f(x) = -\\frac{x^2}{4} + 2x$, and your spring pad deploys at whatever $x$ you enter. Only the ridge’s **highest point** gives the pad enough launch height to reach the ledge. **At a maximum the tangent line is horizontal — the derivative equals zero. Solve $f\'(x) = 0$ and enter that x.**',
          note: 'Set $-\\frac{x}{2} + 2 = 0$ and solve for x. The pad only forgives being off by about 0.3, so estimate-by-eye won’t cut it.',
          controls: [{ key: 'xp', label: 'pad position x_{p}', input: 'number', step: 0.1 }],
          start: { xp: null },
          predict: { label: 'the pad height $f(x_p)$ =', tol: 0.2, truth: (P, g) => g.f(P.xp) },
          answerKey: { xp: 4, pred: 4 },
        }],
      },
      {
        id: 'w5l2', name: 'False Summit', w: 1580, h: 620,
        spawn: [80, 385],
        platforms: [
          { x: 0, y: 419, w: 210, h: 200 },
          { x: 600, y: 184, w: 300, h: 36 },
          { x: 900, y: 184, w: 180, h: 22 },     // the troll's bridge
          { x: 980, y: 68, w: 14, h: 116, gateLock: 'w5t1' },
          { x: 1080, y: 184, w: 440, h: 36 },
        ],
        spikes: [{ x: 210, y: 600, w: 390, h: 20 }, { x: 900, y: 600, w: 180, h: 20 }],
        flag: { x: 1420, y: 184 },
        lesson: '$f\'(x) = 0$ has TWO solutions here — and one of them is a **minimum**. The first-derivative test tells them apart: a max is where $f\'$ flips from positive to negative. Plant your pad in the valley and the valley keeps you.',
        gates: [{
          id: 'w5g2', kind: 'apex', title: 'the Summit Pad II',
          zone: { x: 140, y: 371, w: 56, h: 48 },
          org: [200, 360], S: 44, from: 0, to: 8,
          f: (x) => ((x - 4) ** 3) / 12 - (x - 4),
          crit: 2, tolX: 0.3, exit: [10.5, 4],
          texF: 'f(x) = \\frac{(x-4)^3}{12} - (x-4)', texDf: 'f\'(x) = \\frac{(x-4)^2}{4} - 1',
          axes: [0, 11, -2.5, 4.5], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'This ridge is the cubic $f(x) = \\frac{(x-4)^3}{12} - (x-4)$. Solving $f\'(x) = 0$ gives **two** x-values: one is the top of the hill, the other is the bottom of the valley — and the pad only launches from the **top**. **Find both, decide which is the local maximum, and enter that x.**',
          note: '$\\frac{(x-4)^2}{4} - 1 = 0$ gives $x = 2$ and $x = 6$. To tell them apart, check the sign of $f\'$ on each side (try x = 1, 3, 5, 7): a **maximum** is where $f\'$ switches from positive to negative.',
          controls: [{ key: 'xp', label: 'pad position x_{p}', input: 'number', step: 0.1 }],
          start: { xp: null },
          predict: { label: 'the pad height $f(x_p)$ =', tol: 0.15, truth: (P, g) => g.f(P.xp) },
          answerKey: { xp: 2, pred: 1.33 },
        }, {
          id: 'w5t1', kind: 'troll', name: 'Meanie',
          greeting: 'I am the Mean Value Troll. My theorem is fair. I am not.',
          zone: { x: 908, y: 128, w: 64, h: 56 },
          standX: 997, standY: 184,
          riddles: [
            { type: 'numeric', tol: 0.01, answer: 3,
              q: 'f is continuous on $[1, 5]$ and differentiable on $(1, 5)$, with $f(1) = 3$ and $f(5) = 15$. The Mean Value Theorem guarantees some $c$ in $(1, 5)$ where $f\'(c) = \\,?$',
              explain: 'MVT: some tangent matches the secant. The secant slope is $\\frac{15 - 3}{5 - 1} = 3$.' },
            { type: 'mc',
              q: 'Where can a continuous function on a closed interval $[a, b]$ attain its absolute maximum?',
              options: [
                { label: 'At a critical point inside, or at an endpoint', correct: true },
                { label: 'Only where $f\'(x) = 0$' },
                { label: 'Only at an endpoint' },
                { label: 'Only at an inflection point' },
              ],
              explain: 'The candidates test in one line: EVT guarantees a max exists, and it lives at a critical point or an endpoint — check them all, pick the biggest value.' },
            { type: 'mc',
              q: 'Rolle’s theorem is the Mean Value Theorem plus which extra requirement?',
              options: [
                { label: '$f(a) = f(b)$', correct: true },
                { label: '$f(a) = 0$' },
                { label: '$f\'$ is continuous' },
                { label: 'f is concave up' },
              ],
              explain: 'Equal endpoint values make the secant slope 0, so MVT’s matching tangent is horizontal: some $c$ with $f\'(c) = 0$.' },
          ],
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
        lesson: 'A slope field is the equation’s current: at every point, a dash with slope $\\frac{dy}{dx}$. Your launch height $y(0) = C$ is the **initial condition** — it picks which solution curve you ride. Same field, different C, completely different fate.',
        gates: [{
          id: 'w6g1', kind: 'field', title: 'the Wind Chart',
          zone: { x: 130, y: 398, w: 56, h: 48 },
          org: [220, 320], S: 42,
          fxy: (x, y) => x / 2,
          fieldBox: [0, 9, -4, 3], cMin: -4, cMax: 3,
          flySpeed: 3, ring: [4, 1], ringR: 0.8, exit: [6, -1], xEnd: 9, yMin: -5, yMax: 4,
          texEq: '\\frac{dy}{dx} = \\frac{x}{2} \\;\\Rightarrow\\; y = \\frac{x^2}{4} + C',
          axes: [0, 9, -4, 3.5], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'Each dash on the chart shows the wind: at that point, your glider’s slope will be $\\frac{dy}{dx} = \\frac{x}{2}$. Every possible flight path is one curve from the family $y = \\frac{x^2}{4} + C$ — and **your launch height chooses C**, because at launch $x = 0$, so $y(0) = C$. **Choose C so your path passes through the ring at $(4, 1)$.**',
          note: 'You need the height at $x = 4$ to be 1. Plug in: $\\frac{4^2}{4} + C = 1$, and solve for C.',
          controls: [{ key: 'C', label: 'launch height y(0) = C', input: 'number', step: 0.5 }],
          start: { C: null },
          predict: { label: 'your altitude y at x = 2 will be', tol: 0.3, truth: (P) => 1 + P.C },
          answerKey: { C: -3, pred: -2 },
        }],
      },
      {
        id: 'w6l2', name: 'The Dip', w: 1400, h: 620,
        spawn: [40, 386],
        platforms: [
          { x: 0, y: 420, w: 180, h: 200 },
          { x: 420, y: 380, w: 240, h: 240 },
          { x: 660, y: 380, w: 180, h: 22 },     // the troll's bridge
          { x: 740, y: 264, w: 14, h: 116, gateLock: 'w6t1' },
          { x: 840, y: 380, w: 480, h: 240 },
        ],
        spikes: [{ x: 180, y: 600, w: 240, h: 20 }, { x: 660, y: 600, w: 180, h: 20 }],
        flag: { x: 1240, y: 380 },
        lesson: 'Your flight bottomed out exactly where the field went flat — the solution’s minimum is where $\\frac{dy}{dx} = 0$ (here $x = 2$). Critical points and slope fields are the same fact wearing two outfits.',
        gates: [{
          id: 'w6g2', kind: 'field', title: 'the Wind Chart II',
          zone: { x: 110, y: 372, w: 56, h: 48 },
          org: [200, 300], S: 40,
          fxy: (x, y) => x - 2,
          fieldBox: [0, 7, -4, 4], cMin: -4, cMax: 3.5,
          flySpeed: 3, ring: [5, 1.5], ringR: 0.8, exit: [6.5, -2], xEnd: 7, yMin: -5, yMax: 5,
          texEq: '\\frac{dy}{dx} = x - 2 \\;\\Rightarrow\\; y = \\frac{x^2}{2} - 2x + C',
          axes: [0, 7.5, -4, 4.5], tickEvery: 1, tickLabelEvery: 2,
          prompt: 'This wind pushes you **down** where $x < 2$ and **up** where $x > 2$ (the slope is $\\frac{dy}{dx} = x - 2$), so your flight will sink, level off, then climb. The flight paths are $y = \\frac{x^2}{2} - 2x + C$ with $y(0) = C$. **Two jobs: choose C so the climb threads the ring at $(5, 1.5)$, and predict the x-value where your flight is lowest.**',
          note: 'For the ring: $y(5) = \\frac{25}{2} - 10 + C = 2.5 + C$ must equal 1.5. For the lowest point: a minimum happens where the slope is zero — set $x - 2 = 0$, or just find the column where the dashes lie flat.',
          controls: [{ key: 'C', label: 'launch height y(0) = C', input: 'number', step: 0.5 }],
          start: { C: null },
          predict: { label: 'the x where your flight is LOWEST', tol: 0.3, truth: () => 2 },
          answerKey: { C: -1, pred: 2 },
        }, {
          id: 'w6t1', kind: 'troll', name: 'Sumguy the Elder',
          greeting: 'Before you stands the LAST bridge. Behind me waits the next mathematics: the integral. Prove you are ready.',
          zone: { x: 668, y: 324, w: 64, h: 56 },
          standX: 757, standY: 380,
          riddles: [
            { type: 'numeric', tol: 0.01, answer: 15,
              q: 'Evaluate: $\\displaystyle\\int_1^4 2x \\, dx$',
              explain: 'An antiderivative of $2x$ is $x^2$; evaluate at the ends and subtract: $4^2 - 1^2 = 15$. (That’s the Fundamental Theorem of Calculus.)' },
            { type: 'numeric', tol: 0.01, answer: -1,
              q: 'If $g(x) = \\displaystyle\\int_0^x \\cos(t)\\, dt$, what is $g\'(\\pi)$?',
              explain: 'The derivative of an accumulation function is the integrand at the upper limit: $g\'(x) = \\cos x$, so $g\'(\\pi) = -1$.' },
            { type: 'numeric', tol: 0.01, answer: 70,
              q: 'Water flows into a barrel at a constant 7 liters per minute for 10 minutes. How many liters arrive?',
              explain: 'Integrate a rate, get a total: $7 \\times 10 = 70$ — the simplest possible $\\int \\text{rate} \\, dt$. Every accumulation problem is this idea with a fancier rate.' },
          ],
        }],
      },
    ],
  },
];

// ======================= the Notebook =======================
// Exam-style reference pages for the math behind the gates.
export const NOTEBOOK = {
  'transformations': { term: 'Function transformations', def: 'For $y = a \\cdot f(x - h) + k$: **h** shifts the graph horizontally ($x - h$ moves it RIGHT by h), **k** shifts it vertically, and **a** stretches it vertically — flipping it when negative. Combined, work outside-in: stretch/flip first, then shift. These four knobs are the whole grammar of graph-moving.' },
  'parabola-forms': { term: 'Vertex form vs standard form', def: 'Vertex form $y = a(x-h)^2 + k$: the vertex $(h, k)$ is visible, and the axis of symmetry is $x = h$. Standard form $y = ax^2 + bx + c$: with $c = 0$ it factors as $x(ax + b)$, giving roots $x = 0$ and $x = -\\frac{b}{a}$ — launch and landing. The vertex sits exactly halfway between the roots.' },
  'continuity': { term: 'Continuity at a point', def: 'f is continuous at $x = c$ when three things hold: $f(c)$ is defined; $\\displaystyle\\lim_{x \\to c} f(x)$ exists (the left and right limits agree); and the limit equals the value. For piecewise functions, the seam is where all three get tested — set the pieces equal there and solve.' },
  'piecewise-continuity': { term: 'Making piecewise functions continuous', def: 'At a seam $x = c$, set $(\\text{left piece at } c) = (\\text{right piece at } c)$ and solve for the unknown constant. One seam, one equation, one unknown. The AP loves “find k so that f is continuous” — it is exactly the Seam Welder.' },
  'differentiability': { term: 'Differentiability & corners', def: 'Differentiable at $c$ means the one-sided slopes agree (after f is continuous there). A corner — values match, slopes don’t — is continuous but NOT differentiable: $|x|$ at 0 is the classic. To make a piecewise track smooth, match BOTH the values and the derivatives at the seam: two equations, two unknowns ($m$ and $b$).' },
  'implicit-diff': { term: 'Implicit differentiation', def: 'When x and y are tangled ($x^2 + y^2 = 25$), differentiate both sides with respect to x — every y-term emits a $\\frac{dy}{dx}$ by the chain rule: $2x + 2y\\,\\frac{dy}{dx} = 0$, so $\\frac{dy}{dx} = -\\frac{x}{y}$. The slope arrives without ever solving for y.' },
  'tangent-perp-radius': { term: 'Circle tangents ⊥ radius', def: 'On $x^2 + y^2 = r^2$, the tangent slope $-\\frac{x}{y}$ is the negative reciprocal of the radius slope $\\frac{y}{x}$: tangent ⊥ radius, always. A point released from a spinning circle travels along this tangent — and the direction of travel continues the direction of spin.' },
  'rates-dvt': { term: 'd = v·t and average rate', def: 'Constant speed: distance = rate × time, so arrival time $= t_0 + \\frac{d}{v}$, and required pace $= \\frac{d}{\\text{time available}}$. Average rate over an interval $= \\frac{\\Delta \\text{position}}{\\Delta \\text{time}}$ — a secant slope. Every Unit 4 motion problem is this idea with the constant-speed assumption removed.' },
  'secant-tangent': { term: 'Secant vs tangent (coming attractions)', def: 'Average rate = slope of the secant through two points. Instantaneous rate = slope of the tangent at one point = the limit of secant slopes as the interval shrinks. The Stopwatch levels use averages; the derivative is what happens when the window closes to an instant.' },
  'critical-points': { term: 'Critical points & the first-derivative test', def: 'Candidates for peaks and valleys: where $f\'(x) = 0$ or $f\'$ is undefined. The first-derivative test sorts them: $f\'$ flips **+ to −** ⇒ local max; **− to +** ⇒ local min; no flip ⇒ neither. Summit Springs in one line: solve $f\'(x) = 0$, then CHECK the sign change — the false summit is the minimum wearing a max’s address.' },
  'slope-fields': { term: 'Slope fields', def: 'A differential equation $\\frac{dy}{dx} = f(x, y)$ drawn as weather: at each grid point, a dash with that slope. Solution curves follow the dashes they pass through. Read fields by asking: where are slopes zero? positive? steeper? If the formula has no y, every vertical column of dashes matches ($\\frac{dy}{dx} = x - 2$ is flat exactly on the column $x = 2$).' },
  'initial-conditions': { term: 'Initial conditions & particular solutions', def: 'Solving $\\frac{dy}{dx} = \\frac{x}{2}$ gives a FAMILY: $y = \\frac{x^2}{4} + C$, one curve per C. An initial condition like $y(0) = -3$ picks the single member through that point — the particular solution. Same field, different launch height, different fate: that is all an initial-value problem is.' },
  'prediction': { term: 'Why the gold medal demands a prediction', def: 'Trial-and-error can clear a gate; only computation can clear it AND call the result in advance. Predicting the landing x, the seam value, the tangent slope, the arrival time — that is exactly what an exam answer is: the consequence of your parameters, stated before the universe checks it.' },
};
