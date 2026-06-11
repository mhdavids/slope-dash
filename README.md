# Slope Dash 📈

**A 2D platformer where the physics grades your calculus.**

Pits too wide to jump. Coaster tracks with holes in them. Spinning wheels over the void. The only way through is the **math gate** in each level: open the scope, set your answer, and *run it* — the level itself decides if you were right.

No quizzes. The parabola you tune **is** your jump. The k you solve for **is** the track. The point you compute **is** where the wheel lets go.

Zero dependencies. Vanilla JS + canvas. One `index.html`.

## Run it

```bash
cd slope-dash
python3 -m http.server 8782
# → http://localhost:8782
```

(ES modules require a server.) Deploys as-is to Vercel/Netlify/GitHub Pages — no build step.

## The worlds

| World | The mechanic | The math |
|---|---|---|
| **Vertex Valley** | Tune your jump arc's apex (h, k), then exact a & b | Vertex form, standard form, roots & symmetry (precalc review) |
| **Seam City** | Weld a piecewise coaster track so it doesn't drop you | Continuity at a seam; then differentiability — match f *and* f′ (find m and b) |
| **Spin Station** | Pick the release point on a spinning circle | Implicit differentiation: dy/dx = −x/y, tangent ⊥ radius, tangent-line aiming |
| **Chrono Run** | Choose when to leave — or how fast to run — to hit a door's open window | d = v·t, average rate, solving timing equations |

Two levels per world; the second always demands **exact values**, exam-style.

## Controls

| Key | Action |
|---|---|
| ← → / A D | Run |
| ↑ / W / Space | Jump (tap = short hop) |
| E / Enter | Open a math gate |
| N | Notebook — the math behind every gate, exam-style |
| R | Restart level |
| Esc | Close panel · level select |

## Scoring

Wrong answers cost nothing — you respawn instantly, with a message telling you *what the math did* ("the track JUMPS at x = 4 — not continuous"). But the medal remembers: **first-try gold**, second-try silver, anything after bronze. Trial-and-error will eventually clear a level; computing clears it in one.

Sibling project: [Echoes of the Infinite](https://ap-calc-quest.vercel.app) — the full AP Calculus AB syllabus as a story adventure. Slope Dash is the arcade; Echoes is the textbook with a plot.

A study companion, not a substitute for your textbook. AP® is a trademark of the College Board, which was not involved in and does not endorse this game.
