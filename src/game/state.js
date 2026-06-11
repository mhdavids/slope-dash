// Persistent progress: per-level medals + attempt counts.
// Medal logic: gate solved on attempt 1 → gold, 2 → silver, 3+ → bronze.
// A level's medal = the worst medal among its gates that run.

import { G } from '../engine/g.js';
import { WORLDS } from '../data/worlds.js';

const KEY = 'sldash.save.v1';
const RANK = { gold: 3, silver: 2, bronze: 1 };

export const State = {
  data: null,

  load() {
    try { this.data = JSON.parse(localStorage.getItem(KEY)) || null; } catch { this.data = null; }
    if (!this.data || this.data.v !== 1) {
      this.data = { v: 1, medals: {}, started: false };
    }
    return this.data;
  },

  save() { localStorage.setItem(KEY, JSON.stringify(this.data)); },
  reset() { localStorage.removeItem(KEY); this.load(); },

  hasSave() { return this.data.started; },
  markStarted() { this.data.started = true; this.save(); },

  medalFor(levelId) { return this.data.medals[levelId] || null; },

  setMedal(levelId, medal) {
    const cur = this.medalFor(levelId);
    if (!cur || RANK[medal] > RANK[cur]) {
      this.data.medals[levelId] = medal;
      this.save();
    }
  },

  isCompleted(levelId) { return !!this.medalFor(levelId); },

  // Level n of a world unlocks when the previous level is complete;
  // world n unlocks when the previous world has at least one completed level...
  // keep it simple and generous: a level is unlocked if it's the first, or the
  // previous level (in flat order) is completed.
  flatLevels() {
    return WORLDS.flatMap((w) => w.levels.map((l) => ({ ...l, world: w })));
  },

  isUnlocked(levelId) {
    const flat = this.flatLevels();
    const idx = flat.findIndex((l) => l.id === levelId);
    if (idx <= 0) return true;
    return this.isCompleted(flat[idx - 1].id);
  },

  medalCount() {
    const m = Object.values(this.data.medals);
    return { gold: m.filter((x) => x === 'gold').length, total: m.length };
  },
};

G.state = State;
