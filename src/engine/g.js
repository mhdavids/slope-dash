// Shared globals + helpers. Every module imports G and attaches itself.

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

// Rich text with math helpers: **bold**, *italic*, ^{sup}, _{sub}, and
// lim_{x→a} typeset AP-style with the approach stacked beneath. HTML-escaped first.
export function rich(text) {
  return String(text)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .replace(/lim_\{(.+?)\}/g, '<span class="lim">lim<span class="lim-under">$1</span></span>')
    .replace(/\^\{(.+?)\}/g, '<sup>$1</sup>')
    .replace(/_\{(.+?)\}/g, '<sub>$1</sub>');
}

export function fmtNum(n, dp = 2) {
  const r = Math.round(n * 10 ** dp) / 10 ** dp;
  return Object.is(r, -0) ? (0).toFixed(0) : String(r);
}
