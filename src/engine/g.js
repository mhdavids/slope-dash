// Shared globals + helpers. Every module imports G and attaches itself.

// canvas roundRect shipped in iOS Safari 16.4 — polyfill the uniform-radius
// form we use so older iPhones don't crash on the first frame.
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r = 0) {
    if (Array.isArray(r)) r = r[0] ?? 0;
    r = Math.min(Math.abs(r), Math.abs(w) / 2, Math.abs(h) / 2);
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

export const G = {
  time: 0,
  dt: 0,
  mode: 'boot',      // title | select | play | gate | complete | notebook | help
  canvas: null,
  ctx: null,
  world: null,       // current world def
  level: null,       // current level def
  debug: typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug'),
};

export const VIEW_W = 960;
export const VIEW_H = 540;

export const qs = (s) => document.querySelector(s);

export function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html != null) e.innerHTML = html;
  return e;
}

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ (x << 5) ^ (y << 7);
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

// Render a TeX string with KaTeX (vendored). Falls back to the raw string if
// KaTeX hasn't loaded (or under Node, where the validator imports this module).
export function tex(s, display = false) {
  if (typeof window !== 'undefined' && window.katex) {
    return window.katex.renderToString(s, { throwOnError: false, displayMode: display });
  }
  return s;
}

// Rich text: **bold**, *italic*, plus $...$ segments typeset by KaTeX
// (fractions stacked, primes and minus signs done properly). Math segments are
// swapped for opaque tokens first so bold/italic can SPAN across math, then
// substituted back after the markdown pass.
export function rich(text) {
  const math = [];
  const tokenized = String(text).replace(/\$(.+?)\$/g, (_, t) => {
    math.push(tex(t));
    return `\x00${math.length - 1}\x00`;
  });
  const html = tokenized
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/lim_\{(.+?)\}/g, '<span class="lim">lim<span class="lim-under">$1</span></span>')
    .replace(/\^\{(.+?)\}/g, '<sup>$1</sup>')
    .replace(/_\{(.+?)\}/g, '<sub>$1</sub>');
  return html.replace(/\x00(\d+)\x00/g, (_, i) => math[+i]);
}

export function fmtNum(n, dp = 2) {
  const r = Math.round(n * 10 ** dp) / 10 ** dp;
  return Object.is(r, -0) ? (0).toFixed(0) : String(r);
}
