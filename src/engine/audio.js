// Tiny WebAudio synth for UI feedback. No assets, just oscillators.

export const Sfx = {
  ctx: null,
  gain: null,
  muted: typeof localStorage !== 'undefined' && localStorage.getItem('sldash.muted') === '1',

  ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.gain = this.ctx.createGain();
    this.gain.gain.value = this.muted ? 0 : 0.14;
    this.gain.connect(this.ctx.destination);
  },

  tone(freq, dur, { type = 'square', vol = 0.5, when = 0, slideTo = null } = {}) {
    this.ensure();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(env); env.connect(this.gain);
    osc.start(t0); osc.stop(t0 + dur + 0.05);
  },

  blip()    { this.tone(740, 0.05, { vol: 0.35 }); },
  click()   { this.tone(440, 0.035, { vol: 0.22 }); },
  good()    { [523, 659, 784].forEach((f, i) => this.tone(f, 0.09, { when: i * 0.07, vol: 0.4 })); },
  bad()     { this.tone(170, 0.18, { type: 'sawtooth', vol: 0.3 }); this.tone(120, 0.22, { type: 'sawtooth', vol: 0.25, when: 0.06 }); },
  item()    { [659, 988].forEach((f, i) => this.tone(f, 0.08, { when: i * 0.08, vol: 0.4, type: 'triangle' })); },
  portal()  { this.tone(220, 0.6, { type: 'sine', vol: 0.5, slideTo: 540 }); },
  fanfare() { [392, 523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.13, { when: i * 0.1, vol: 0.42 })); },
  somber()  { this.tone(196, 0.5, { type: 'sine', vol: 0.25 }); },

  toggle() {
    this.ensure();
    this.muted = !this.muted;
    if (this.gain) this.gain.gain.value = this.muted ? 0 : 0.14;
    localStorage.setItem('sldash.muted', this.muted ? '1' : '0');
    return this.muted;
  },
};
