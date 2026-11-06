// Feyse Clothing Labels — "Signature" · Blueprint style
// Deterministic film page: window.render(t) draws the frame at second t.
'use strict';
(() => {
const W = 1920, H = 1080, SW = 3200, SH = 1900, S0 = 1080 / 2100;
const BPM = 96, BEAT = 60 / BPM, BAR = BEAT * 4;
const DUR = 48;
const INK = '#E7F0F9', RED = '#C9302C';
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const inkC = document.createElement('canvas'); inkC.width = W; inkC.height = H;
const ic = inkC.getContext('2d');

// ---------- maths ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const eout = k => 1 - Math.pow(1 - k, 3);
const pr = (t, a, d) => clamp((t - a) / d);
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
function hash(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0; h = Math.imul(h ^ h >>> 13, 1274126177); return ((h ^ h >>> 16) >>> 0) / 4294967296; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}
function fbm(x, y, s, o = 4) { let v = 0, a = .5, f = 1, n = 0; for (let i = 0; i < o; i++) { v += a * vnoise(x * f, y * f, s + i); n += a; a *= .5; f *= 2; } return v / n; }

// ---------- textures ----------
let paperPat, grainPat, finePat, tablePat;
function buildTextures() {
  const PW = 1600, PH = 950, P = document.createElement('canvas'); P.width = PW; P.height = PH;
  const pc = P.getContext('2d'), img = pc.createImageData(PW, PH), d = img.data;
  const c0 = [0x18, 0x33, 0x6B], c1 = [0x2A, 0x58, 0xA6], cb = [0x4A, 0x7C, 0xBA];
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    let n = fbm(x / 170, y / 170, 11, 4);
    const streak = fbm(x / 700, y / 9, 23, 3);
    let v = clamp(0.15 + 0.95 * (n - 0.5) + 0.5 + (streak - 0.5) * 0.35) * 0.85;
    let r = lerp(c0[0], c1[0], v), g = lerp(c0[1], c1[1], v), b = lerp(c0[2], c1[2], v);
    // bleached edges
    const e = Math.min(x, y, PW - 1 - x, PH - 1 - y), en = fbm(x / 40, y / 40, 5, 2);
    const bl = Math.pow(clamp(1 - e / (26 + 30 * en)), 2) * 0.75;
    r = lerp(r, cb[0], bl); g = lerp(g, cb[1], bl); b = lerp(b, cb[2], bl);
    // fold creases (sheet x=1600 -> px 800, y=950 -> px 475)
    const dx = x - 800 + (fbm(y / 60, 1, 7, 2) - .5) * 4, dy = y - 475 + (fbm(x / 60, 2, 8, 2) - .5) * 4;
    let k = 0;
    if (Math.abs(dx) < 3) k += dx < 0 ? 0.22 * (1 - Math.abs(dx) / 3) : -0.16 * (1 - Math.abs(dx) / 3);
    if (Math.abs(dy) < 3) k += dy < 0 ? 0.2 * (1 - Math.abs(dy) / 3) : -0.15 * (1 - Math.abs(dy) / 3);
    if (k > 0) { r = lerp(r, 160, k); g = lerp(g, 190, k); b = lerp(b, 230, k); } else { r *= 1 + k; g *= 1 + k; b *= 1 + k; }
    const i = (y * PW + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
  }
  pc.putImageData(img, 0, 0);
  const R = rng(42);
  pc.lineCap = 'round';
  for (let i = 0; i < 900; i++) { // fibres
    const x = R() * PW, y = R() * PH, a = R() * Math.PI * 2, l = 6 + R() * 18;
    pc.strokeStyle = `rgba(200,220,255,${0.03 + R() * 0.05})`; pc.lineWidth = 0.6;
    pc.beginPath(); pc.moveTo(x, y); pc.quadraticCurveTo(x + Math.cos(a) * l * .5 + R() * 4, y + Math.sin(a) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); pc.stroke();
  }
  for (let i = 0; i < 1400; i++) { // specks
    const x = R() * PW, y = R() * PH, s = R() < .85 ? .5 : 1.2;
    pc.fillStyle = R() < .7 ? `rgba(220,235,255,${0.15 + R() * 0.3})` : `rgba(10,20,50,${0.2 + R() * 0.3})`;
    pc.fillRect(x, y, s, s);
  }
  paperPat = ctx.createPattern(P, 'no-repeat');
  // grain tiles
  const mk = (sz, fn) => { const c = document.createElement('canvas'); c.width = c.height = sz; const g = c.getContext('2d'), im = g.createImageData(sz, sz); for (let i = 0; i < sz * sz; i++) fn(im.data, i * 4, i % sz, Math.floor(i / sz)); g.putImageData(im, 0, 0); return c; };
  const R2 = rng(7);
  const grain = mk(256, (D, i, x, y) => { const n = fbm(x / 3, y / 3, 3, 2); const v = Math.pow(clamp((n - 0.45) * 2.2), 2) * 0.9 + (R2() < .02 ? .6 : 0); D[i] = D[i + 1] = D[i + 2] = 0; D[i + 3] = 255 * clamp(v); });
  grainPat = ic.createPattern(grain, 'repeat');
  const R3 = rng(9);
  const fine = mk(256, (D, i) => { const v = R3(); D[i] = D[i + 1] = D[i + 2] = v > .5 ? 255 : 0; D[i + 3] = 255 * Math.abs(v - .5) * 0.5; });
  finePat = ctx.createPattern(fine, 'repeat');
  const R4 = rng(13);
  const table = mk(256, (D, i, x, y) => { const n = (Math.sin(x * 0.9) * Math.sin(y * 0.9)) * 0.5 + R4() * 0.5; D[i] = 13 + n * 8; D[i + 1] = 17 + n * 8; D[i + 2] = 22 + n * 9; D[i + 3] = 255; });
  tablePat = ctx.createPattern(table, 'repeat');
}

// ---------- camera ----------
// Shots (hard cuts on downbeats between sections, continuous moves within)
const SHOTS = [
  { t0: 0, t1: 5.0, a: [1000, 600, 1.9], b: [1000, 600, 2.02] },
  { t0: 5.0, t1: 12.5, a: [1420, 600, 1.58], b: [1380, 600, 1.72] },
  { t0: 12.5, t1: 20.0, a: [975, 1190, 3.15], b: [960, 1180, 3.3] },
  { t0: 20.0, t1: 27.5, a: [1050, 1380, 2.3], b: [1830, 1420, 2.3] },
  { t0: 27.5, t1: 35.0, a: [2560, 1545, 3.0], b: [2560, 1545, 3.0] },
  { t0: 35.0, t1: 42.6, a: [1600, 960, 1.12], b: [1560, 950, 1.0], d: 4 },
  { t0: 42.6, t1: 48.01, a: [1560, 950, 1.0], b: [1260, 720, 1.5], d: 3 },
];
function camera(t) {
  const s = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  const k = eio(clamp((t - s.t0) / (s.d || (s.t1 - s.t0))));
  let x = lerp(s.a[0], s.b[0], k), y = lerp(s.a[1], s.b[1], k), z = lerp(s.a[2], s.b[2], k);
  // stamp bump
  const bt = t - 33.125; if (bt > 0 && bt < 0.4) { y += Math.sin(bt * 60) * 6 * Math.exp(-bt * 12); z *= 1 + 0.012 * Math.exp(-bt * 14); }
  // paper slap at the start
  if (t < 0.25) z *= 1 + 0.01 * Math.sin(t / 0.25 * Math.PI);
  return { x, y, z };
}
let Z = 1, CAM;
const LW = w => w * 1.6 * Math.pow(Z, -0.35);
const OUT = 3.2, DET = 2.0, THIN = 1.25, HAIR = 0.9;
function setSheet(c, cam) { const a = S0 * cam.z; c.setTransform(a, 0, 0, a, W / 2 - cam.x * a, H / 2 - cam.y * a); }

// ---------- drawing primitives (ink layer) ----------
const lenCache = new WeakMap();
function lens(pts) { let L = lenCache.get(pts); if (L) return L; L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); lenCache.set(pts, L); return L; }
function partial(pts, p) {
  const L = lens(pts), tot = L[L.length - 1], tgt = tot * p, out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (L[i] <= tgt) out.push(pts[i]);
    else { const k = (tgt - L[i - 1]) / (L[i] - L[i - 1] || 1); out.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]); break; }
  }
  return out;
}
function nib(x, y, r = 1) {
  const R = LW(9) * r, g = ic.createRadialGradient(x, y, 0, x, y, R);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(235,245,255,.7)'); g.addColorStop(1, 'rgba(235,245,255,0)');
  ic.fillStyle = g; ic.beginPath(); ic.arc(x, y, R, 0, 7); ic.fill();
}
function path(pts, p, w, dash, opt = {}) {
  if (p <= 0) return; const q = p >= 1 ? pts : partial(pts, p);
  ic.save(); ic.strokeStyle = opt.color || INK; ic.lineWidth = opt.abs ? w : LW(w); ic.lineCap = 'round'; ic.lineJoin = 'round';
  if (opt.erase) ic.globalCompositeOperation = 'destination-out';
  ic.setLineDash(dash || []);
  ic.beginPath(); ic.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) ic.lineTo(q[i][0], q[i][1]); ic.stroke(); ic.restore();
  if (p < 1 && !opt.erase && !opt.nonib) { const e = q[q.length - 1]; nib(e[0], e[1]); }
}
const seg = (x0, y0, x1, y1) => [[x0, y0], [x1, y1]];
function arcPts(cx, cy, rx, ry, a0, a1, n = 64) { const o = []; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o; }
function rrect(x0, y0, x1, y1, r) {
  const o = [], P = Math.PI;
  o.push([x0 + r, y0], [x1 - r, y0]); o.push(...arcPts(x1 - r, y0 + r, r, r, -P / 2, 0, 10).slice(1));
  o.push([x1, y1 - r]); o.push(...arcPts(x1 - r, y1 - r, r, r, 0, P / 2, 10).slice(1));
  o.push([x0 + r, y1]); o.push(...arcPts(x0 + r, y1 - r, r, r, P / 2, P, 10).slice(1));
  o.push([x0, y0 + r]); o.push(...arcPts(x0 + r, y0 + r, r, r, P, P * 1.5, 10).slice(1));
  return o;
}
function fillPts(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const q of pts) c.lineTo(q[0], q[1]); c.closePath(); }
function erase(pts) { ic.save(); ic.globalCompositeOperation = 'destination-out'; ic.fillStyle = '#000'; fillPts(ic, pts); ic.fill(); ic.restore(); }
function text(str, x, y, size, font, p, align = 'left', opt = {}) {
  if (p <= 0) return;
  ic.save(); ic.font = `${opt.weight || ''} ${size}px ${font}`; ic.letterSpacing = (opt.ls || 0) + 'px';
  ic.textBaseline = 'alphabetic'; ic.fillStyle = opt.color || INK;
  const w = ic.measureText(str).width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  if (opt.rot) { ic.translate(x, y); ic.rotate(opt.rot); ic.translate(-x, -y); }
  if (p < 1) { ic.beginPath(); ic.rect(x0 - 4, y - size * 1.2, w * p + 4, size * 1.6); ic.clip(); }
  ic.fillText(str, x0, y); ic.restore();
  if (p < 1 && !opt.rot) nib(x0 + w * p, y - size * 0.35, 0.8);
}
function arrowHead(x, y, ang, p) { if (p < 1) return; const s = 16; path([[x + Math.cos(ang + 2.7) * s, y + Math.sin(ang + 2.7) * s], [x, y], [x + Math.cos(ang - 2.7) * s, y + Math.sin(ang - 2.7) * s]], 1, HAIR, null, { nonib: true }); }
function dimLine(x0, y0, x1, y1, p) { path(seg(x0, y0, x1, y1), p, HAIR); const a = Math.atan2(y1 - y0, x1 - x0); if (p > 0.05) arrowHead(x0, y0, a + Math.PI, 1); arrowHead(x1, y1, a, p); }
function hatch(clipPts, bbox, sp, p) {
  if (p <= 0) return; ic.save(); fillPts(ic, clipPts); ic.clip();
  const [x0, y0, x1, y1] = bbox, n = Math.ceil((x1 - x0 + y1 - y0) / sp);
  for (let i = 0; i < n * p; i++) { const o = x0 - (y1 - y0) + i * sp; path(seg(o, y1, o + (y1 - y0), y0), 1, HAIR, null, { nonib: true }); }
  ic.restore();
}
function balloon(n, x, y, p) { path(arcPts(x, y, 26, 26, -Math.PI / 2, Math.PI * 1.5, 40), p, THIN); text(String(n), x, y + 10, 28, 'Tech', pr(p, .6, .4), 'center', { weight: 700 }); }
function tick(x, y, s, p) { path([[x, y], [x + s * .35, y + s * .4], [x + s, y - s * .55]], p, DET); }

// ---------- notes (subtitles) ----------
const NOTES = [
  { t0: 0.9, t1: 4.9, x: 480, y: 860, w: 960, s: 'Every garment carries a signature.' },
  { t0: 5.6, t1: 8.8, x: 160, y: 850, w: 900, s: 'Yours starts as a message.' },
  { t0: 9.0, t1: 12.45, x: 160, y: 850, w: 900, s: 'We draw it to the millimetre…' },
  { t0: 13.0, t1: 19.9, x: 50, y: 100, w: 470, s: '…and weave it, thread by thread, in Lagos.' },
  { t0: 21.0, t1: 27.4, x: 1180, y: 50, w: 700, s: 'Every step, tracked on WhatsApp.' },
  { t0: 28.0, t1: 32.45, x: 50, y: 80, w: 760, s: 'And every label is checked by hand.' },
  { t0: 36.4, t1: 38.8, x: 960, y: 470, w: 560, s: 'Feyse Clothing Labels.' },
  { t0: 38.9, t1: 42.5, x: 960, y: 470, w: 560, s: 'Made in Lagos. Worn everywhere.' },
];
function wrap(c, s, w) { const words = s.split(' '), lines = []; let cur = ''; for (const wd of words) { const tst = cur ? cur + ' ' + wd : wd; if (c.measureText(tst).width > w && cur) { lines.push(cur); cur = wd; } else cur = tst; } if (cur) lines.push(cur); return lines; }
function noteBox(t, n, N) {
  if (t < N.t0 || t >= N.t1) return null;
  const a = clamp((t - N.t0) / 0.12) * clamp((N.t1 - t) / 0.15);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a;
  ctx.font = '40px Hand'; const lines = wrap(ctx, N.s, N.w - 170), lh = 52;
  const bw = Math.min(N.w, 170 + Math.max(...lines.map(l => ctx.measureText(l).width)) + 40), bh = lines.length * lh + 40;
  const { x, y } = N;
  ctx.fillStyle = 'rgba(214,228,246,0.14)'; ctx.fillRect(x, y, bw, bh);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; ctx.strokeRect(x, y, bw, bh);
  ctx.lineWidth = 1.1; ctx.strokeRect(x + 7, y + 7, bw - 14, bh - 14);
  ctx.beginPath(); ctx.moveTo(x + 132, y + 7); ctx.lineTo(x + 132, y + bh - 7); ctx.moveTo(x + 138, y + 7); ctx.lineTo(x + 138, y + bh - 7); ctx.stroke();
  ctx.fillStyle = INK; ctx.font = '700 17px Tech'; ctx.textAlign = 'center'; ctx.fillText('NOTE', x + 70, y + bh / 2 - 4); ctx.font = '400 26px Tech'; ctx.fillText('/ ' + n, x + 70, y + bh / 2 + 26);
  ctx.textAlign = 'left'; ctx.font = '40px Hand';
  const total = lines.join('').length, shown = total * clamp((t - N.t0) / 0.35); let used = 0;
  lines.forEach((l, i) => { const k = clamp((shown - used) / l.length); used += l.length; if (k <= 0) return; const lw = ctx.measureText(l).width; ctx.save(); ctx.beginPath(); ctx.rect(x + 156, y + 20 + i * lh, lw * k + 14, lh); ctx.clip(); ctx.fillText(l, x + 160, y + 20 + (i + 1) * lh - 14); ctx.restore(); });
  // leader tick
  ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + bw, y + bh); ctx.lineTo(x + bw + 26, y + bh + 22); ctx.stroke();
  ctx.restore();
  return { id: 'note' + n, text: N.s, x0: x, y0: y, x1: x + bw, y1: y + bh };
}

// ---------- the label (front face) ----------
const LBL = rrect(500, 380, 1500, 780, 18);
function labelBody(t, ox, oy, full) {
  ic.save(); ic.translate(ox, oy);
  const f = k => full ? 1 : k;
  path(LBL, f(pr(t, 2.5, 1.25)), OUT);
  path(rrect(528, 408, 1472, 752, 8), f(pr(t, 4.0, 0.6)), HAIR, [10, 8]);
  path(seg(600, 380, 600, 780), f(pr(t, 3.75, 0.4)), THIN, [36, 8, 6, 8, 6, 8]);
  path(seg(1400, 380, 1400, 780), f(pr(t, 3.95, 0.4)), THIN, [36, 8, 6, 8, 6, 8]);
  text('YOUR BRAND', 1000, 618, 96, 'Tech', f(pr(t, 4.4, 1.0)), 'center', { weight: 700, ls: 14 });
  text('100% COTTON · SIZE M', 1000, 692, 30, 'Tech', f(pr(t, 5.2, 0.6)), 'center', { ls: 4 });
  ic.restore();
}

// ---------- the sheet ----------
function drawSheet(t) {
  // pre-printed border, zone marks, title block grid, notes column
  path(rrect(40, 40, 3160, 1860, 0), 1, OUT, null, { nonib: true });
  path(rrect(60, 60, 3140, 1840, 0), 1, HAIR, null, { nonib: true });
  for (let x = 400; x < 3200; x += 400) { path(seg(x, 40, x, 60), 1, HAIR); path(seg(x, 1840, x, 1860), 1, HAIR); }
  for (let y = 380; y < 1900; y += 380) { path(seg(40, y, 60, y), 1, HAIR); path(seg(3140, y, 3160, y), 1, HAIR); }
  path(rrect(2280, 1500, 3140, 1840, 0), 1, DET, null, { nonib: true });
  for (const y of [1560, 1620, 1680, 1740]) path(seg(2280, y, 3140, y), 1, HAIR);
  path(seg(2460, 1500, 2460, 1840), 1, HAIR);
  [['CLIENT', 1540], ['ORDER', 1600], ['QC', 1660], ['STATUS', 1720], ['CHECKED', 1800]].forEach(([s, y]) => text(s, 2300, y, 22, 'Tech', 1, 'left', { weight: 700, ls: 2 }));
  path(rrect(2560, 120, 3140, 1460, 0), 1, THIN, null, { nonib: true });
  text('GENERAL NOTES', 2585, 170, 26, 'Tech', 1, 'left', { weight: 700, ls: 3 });
  path(seg(2580, 188, 3120, 188), 1, HAIR);

  // 1 · centre lines + header
  path(seg(380, 580, 1620, 580), pr(t, 0.25, 0.8), HAIR, [44, 10, 8, 10]);
  path(seg(1000, 300, 1000, 860), pr(t, 1.25, 0.6), HAIR, [44, 10, 8, 10]);
  text('FEYSE CLOTHING LABELS', 500, 168, 74, 'Hand', pr(t, 1.9, 1.3));
  text('DWG. 001 · WOVEN BRAND LABEL · SCALE 4:1', 504, 214, 26, 'Tech', pr(t, 3.0, 0.9), 'left', { ls: 3 });
  path(seg(500, 234, 1620, 234), pr(t, 3.2, 0.7), THIN);
  text('FIG. 1', 430, 888, 28, 'Tech', pr(t, 2.5, 0.3), 'left', { weight: 700 });

  // the label (static until it turns in oblique)
  if (t < 36.25) labelBody(t, 0, 0, false);

  // 2 · message bubble
  const bub = rrect(1660, 300, 2400, 560, 40);
  path(bub, pr(t, 5.6, 0.8), DET);
  path([[1720, 560], [1640, 640], [1790, 560]], pr(t, 6.3, 0.25), DET);
  text('Hi Feyse! 500 woven labels', 1705, 390, 40, 'Hand', pr(t, 6.5, 0.8));
  text('for my new line, please.', 1705, 448, 40, 'Hand', pr(t, 7.3, 0.7));
  text('10:42', 2232, 528, 20, 'Tech', pr(t, 8.0, 0.2));
  if (t > 8.05) { tick(2300, 520, 20, pr(t, 8.05, .12)); tick(2318, 520, 20, pr(t, 8.17, .12)); }
  path([[1640, 640], [1510, 700]], pr(t, 8.3, 0.4), HAIR, [10, 8]);

  // 3 · dimensions (numbers count while the lines draw)
  path(seg(500, 370, 500, 276), pr(t, 9.0, 0.3), HAIR); path(seg(1500, 370, 1500, 276), pr(t, 9.1, 0.3), HAIR);
  dimLine(500, 296, 1500, 296, pr(t, 9.3, 0.9));
  if (t > 9.3) text(`${Math.round(50 * eout(pr(t, 9.3, 0.9)))} mm`, 1000, 282, 30, 'Tech', 1, 'center', { weight: 700 });
  path(seg(490, 380, 396, 380), pr(t, 9.6, 0.3), HAIR); path(seg(490, 780, 396, 780), pr(t, 9.7, 0.3), HAIR);
  dimLine(420, 380, 420, 780, pr(t, 9.9, 0.6));
  if (t > 9.9) text(`${Math.round(20 * eout(pr(t, 9.9, 0.6)))} mm`, 404, 580, 30, 'Tech', 1, 'center', { weight: 700, rot: -Math.PI / 2 });
  dimLine(500, 340, 600, 340, pr(t, 10.6, 0.3));
  if (t > 10.7) text('5', 550, 330, 24, 'Tech', 1, 'center', { weight: 700 });
  // balloons
  path([[1100, 640], [1160, 852]], pr(t, 11.25, 0.25), HAIR); balloon(1, 1180, 876, pr(t, 11.5, 0.3)); text('WOVEN DAMASK', 1220, 888, 32, 'Hand', pr(t, 11.7, 0.4));
  path([[600, 760], [680, 852]], pr(t, 11.6, 0.25), HAIR); balloon(2, 700, 876, pr(t, 11.85, 0.3)); text('END FOLD', 740, 888, 32, 'Hand', pr(t, 12.0, 0.35));
  // detail callout B
  path(arcPts(820, 520, 62, 62, -Math.PI / 2, Math.PI * 1.5, 48), pr(t, 11.9, 0.4), HAIR, [12, 8]);
  text('B', 884, 470, 30, 'Tech', pr(t, 12.2, 0.15), 'left', { weight: 700 });

  // 4 · Detail B · weave section
  const DX = 1000, DY = 1190, DR = 230;
  path(arcPts(DX, DY, DR, DR, -Math.PI / 2, Math.PI * 1.5, 120), pr(t, 12.55, 0.5), DET);
  text('DETAIL B', 748, 1150, 34, 'Tech', pr(t, 12.9, 0.4), 'right', { weight: 700, ls: 3 });
  text('WEAVE SECTION · 40:1', 748, 1192, 26, 'Tech', pr(t, 13.2, 0.5), 'right', { ls: 2 });
  ic.save(); ic.beginPath(); ic.arc(DX, DY, DR - 3, 0, 7); ic.clip();
  const shedB = Math.floor((t - 14.375) / BEAT), shedK = eout(clamp(((t - 14.375) / BEAT - shedB) / 0.25));
  for (let i = 0; i < 7; i++) {
    const x = 814 + 62 * i;
    let sy = 0;
    if (t > 14.375 && t < 19.7) { const s0 = ((i + shedB) % 2 ? 1 : -1) * 7, s1 = -s0; sy = lerp(s1, s0, shedK); }
    const el = arcPts(x, DY + sy, 24, 20, -Math.PI / 2, Math.PI * 1.5, 40);
    path(el, pr(t, 12.8 + i * 0.08, 0.3), DET);
    hatch(el, [x - 26, DY + sy - 22, x + 26, DY + sy + 22], 9, pr(t, 14.0 + i * 0.06, 0.3));
  }
  path(seg(770, DY, 1230, DY), pr(t, 13.3, 0.6), HAIR, [44, 10, 8, 10]);
  // weft passes, stepped on 1/4-beat like an escapement
  const step = (a, n, len) => { if (t < a) return 0; const u = (t - a) / (len / n), k = Math.floor(u); return clamp((k + eout(clamp((u - k) * 3))) / n); };
  const weft = (sgn, rev) => { const o = []; for (let x = 770; x <= 1230; x += 4) o.push([x, DY - sgn * 38 * Math.cos(Math.PI * (x - 814) / 62)]); return rev ? o.reverse() : o; };
  const W1 = weft(1, false), W2 = weft(-1, true);
  const tube = (pts, p) => { if (p <= 0) return; path(pts, p, 15, null, { abs: true, nonib: true }); path(pts, p, 8, null, { abs: true, erase: true }); if (p < 1) { const e = partial(pts, p).pop(); nib(e[0], e[1], 1.2); } };
  tube(W1, step(15.0, 16, 2.5)); tube(W2, step(17.5, 14, 2.1));
  ic.restore();
  path([[814, DY + 4], [752, 1254]], pr(t, 15.6, 0.25), HAIR); text('WARP Ø 0.12 mm', 746, 1268, 24, 'Tech', pr(t, 15.8, 0.4), 'right');
  path([[792, 1160], [752, 1300]], pr(t, 16.4, 0.25), HAIR); text('WEFT · ONE PICK PER STEP', 746, 1312, 24, 'Tech', pr(t, 16.6, 0.5), 'right');

  // 5 · the thread becomes the route
  const route = []; for (let x = 1000; x <= 2150; x += 5) route.push([x, 1620 + 5 * Math.sin((x - 1000) / 22)]);
  const drop = [[1000, 1422], [1000, 1620]];
  path(drop, pr(t, 20.0, 0.8), DET);
  path(arcPts(1000, 1620, 14, 14, 0, 7, 24), pr(t, 20.8, 0.2), DET);
  text('LAGOS', 1000, 1686, 32, 'Tech', pr(t, 20.9, 0.4), 'center', { weight: 700, ls: 4 });
  text('FCL-0001', 960, 1560, 22, 'Tech', pr(t, 21.0, 0.3), 'right', { ls: 2 });
  text('FIG. 2 · ORDER ROUTE', 900, 1470, 26, 'Tech', pr(t, 20.3, 0.5), 'right', { weight: 700, ls: 2 });
  const rp = eio(pr(t, 21.1, 4.9));
  path(route, rp, DET);
  if (rp > 0 && rp < 1) { const e = partial(route, rp).pop(); path(rrect(e[0] - 30, e[1] - 34, e[0] + 30, e[1] - 12, 4), 1, THIN, null, { nonib: true }); }
  const STAT = ['QUOTE', 'PAID', 'WOVEN', 'CHECKED', 'SHIPPED'];
  STAT.forEach((s, i) => {
    const x = 1180 + 195 * i, at = 21.1 + 4.9 * ((x - 1000) / 1150) - 0.15, ta = Math.max(at, 22.5 + i * 0.625 * 1.2 - 0.6);
    path(seg(x, 1608, x, 1572), pr(t, ta, 0.12), HAIR); balloon(i + 1, x, 1544, pr(t, ta + 0.1, 0.25));
    text(s, x, 1690, 28, 'Hand', pr(t, ta + 0.25, 0.35), 'center');
    if (t > ta + 0.6) { tick(x - 18, 1722, 14, pr(t, ta + 0.6, 0.1)); tick(x - 4, 1722, 14, pr(t, ta + 0.7, 0.1)); }
  });
  path(arcPts(2150, 1620, 14, 14, 0, 7, 24), pr(t, 26.0, 0.2), DET);
  text('UK', 2150, 1686, 32, 'Tech', pr(t, 26.1, 0.3), 'center', { weight: 700, ls: 4 });

  // 6 · title block fields, QC, signature
  text('YOUR BRAND', 2490, 1541, 28, 'Tech', pr(t, 27.8, 0.5), 'left', { weight: 700, ls: 2 });
  text('FCL-0001 · 500 PCS · WOVEN', 2490, 1601, 26, 'Tech', pr(t, 28.3, 0.6), 'left', { ls: 1 });
  ['COLOUR', 'SIZE', 'EDGES', 'FOLD'].forEach((s, i) => {
    const x = 2490 + 160 * i;
    path(rrect(x, 1638, x + 26, 1664, 0), pr(t, 28.6 + i * 0.1, 0.2), THIN);
    text(s, x + 36, 1661, 22, 'Tech', pr(t, 28.7 + i * 0.1, 0.3), 'left', { ls: 1 });
    tick(x + 3, 1652, 26, pr(t, 29.375 + i * BEAT, 0.18));
  });
  text('Feyse', 2500, 1815, 70, 'Sig', pr(t, 31.5, 0.9));
  path([[2490, 1826], [2760, 1822]], pr(t, 32.2, 0.25), HAIR);
  text('QC LEAD · LAGOS', 2800, 1806, 22, 'Tech', pr(t, 32.0, 0.4), 'left', { ls: 2 });

  // general notes column
  ic.save(); ic.font = '27px Hand'; let ny = 232;
  NOTES.forEach((N, i) => {
    const lines = wrap(ic, (i + 1) + '. ' + N.s, 530), p = pr(t, N.t0 + 0.2, 1.2);
    lines.forEach((l, j) => text(l, 2585 + (j ? 26 : 0), ny + j * 36, 27, 'Hand', clamp(p * lines.length - j)));
    ny += lines.length * 36 + 18;
  });
  ic.restore();

  // 7 · the label turns in oblique, then becomes real
  if (t >= 36.25) {
    const real = eio(pr(t, 39.4, 1.6));
    const d = 0.5 * eio(pr(t, 36.25, 2.5)) * (1 - real), D = d * 220, N = 14;
    const ox = D * Math.SQRT1_2, oy = -D * Math.SQRT1_2;
    if (D > 0.5) {
      for (let i = N; i >= 1; i--) path(LBL.map(q => [q[0] + ox * i / N, q[1] + oy * i / N]), 1, OUT * 2, null, { nonib: true });
      for (let i = N; i >= 1; i--) erase(LBL.map(q => [q[0] + ox * i / N, q[1] + oy * i / N]));
    }
    erase(LBL);
    labelBody(t, 0, 0, true);
    if (real > 0) { ic.save(); ic.fillStyle = `rgba(231,240,249,${0.16 * real})`; fillPts(ic, LBL); ic.fill(); ic.restore(); }
  }
}

// the one real thing: a woven label leaving the drawing (fx pass, main canvas)
function drawReal(t, lights) {
  const r = eio(pr(t, 39.4, 1.6)); if (r <= 0) return;
  const lift = r * 46, s = 1 + 0.05 * r;
  ctx.save(); setSheet(ctx, CAM);
  // shadow falls across the lines
  ctx.save(); ctx.filter = `blur(${18 * S0 * CAM.z}px)`; ctx.fillStyle = `rgba(4,10,30,${0.5 * r})`;
  ctx.translate(1000 + 26 * r, 580 + 40 * r); ctx.scale(s, s); ctx.translate(-1000, -580); fillPts(ctx, LBL); ctx.fill(); ctx.restore();
  ctx.translate(1000, 580 - lift); ctx.scale(s, s); ctx.translate(-1000, -580);
  const g = ctx.createLinearGradient(500, 380, 1500, 780);
  g.addColorStop(0, '#F6F9FD'); g.addColorStop(1, '#C4D5EA');
  ctx.globalAlpha = r * (1 - 0.35 * lights);
  ctx.shadowColor = 'rgba(235,245,255,0.9)'; ctx.shadowBlur = (24 + 30 * lights) * S0 * CAM.z;
  ctx.fillStyle = g; fillPts(ctx, LBL); ctx.fill(); ctx.shadowBlur = 0;
  // woven texture
  ctx.save(); fillPts(ctx, LBL); ctx.clip(); ctx.strokeStyle = 'rgba(29,63,128,0.07)'; ctx.lineWidth = 1.2;
  for (let y = 384; y < 780; y += 6) { ctx.beginPath(); ctx.moveTo(500, y); ctx.lineTo(1500, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(29,63,128,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([10, 8]); fillPts(ctx, rrect(528, 408, 1472, 752, 8)); ctx.stroke();
  ctx.setLineDash([]); ctx.strokeStyle = 'rgba(29,63,128,0.25)'; ctx.beginPath(); ctx.moveTo(600, 380); ctx.lineTo(600, 780); ctx.moveTo(1400, 380); ctx.lineTo(1400, 780); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = '#1D3F80'; ctx.font = '700 96px Tech'; ctx.letterSpacing = '14px'; ctx.textAlign = 'center'; ctx.fillText('YOUR BRAND', 1000, 618);
  ctx.font = '400 30px Tech'; ctx.letterSpacing = '4px'; ctx.fillStyle = 'rgba(29,63,128,0.8)'; ctx.fillText('100% COTTON · SIZE M', 1000, 692);
  ctx.restore();
}

function drawStamp(t) {
  const st = t - 33.125; if (st < 0) return;
  const k = eout(clamp(st / 0.07)), sc = lerp(1.35, 1, k);
  ctx.save(); setSheet(ctx, CAM); ctx.translate(2800, 1712); ctx.rotate(-0.12); ctx.scale(sc, sc);
  const S = document.createElement('canvas'); // stamp drawn with ink breakup
  S.width = 700; S.height = 240; const sc2 = S.getContext('2d');
  sc2.strokeStyle = RED; sc2.fillStyle = RED; sc2.lineWidth = 9; sc2.strokeRect(14, 14, 672, 212); sc2.lineWidth = 3.5; sc2.strokeRect(30, 30, 640, 180);
  sc2.font = '700 104px Tech'; sc2.textAlign = 'center'; sc2.letterSpacing = '10px'; sc2.fillText('APPROVED', 355, 156);
  sc2.font = '700 26px Tech'; sc2.letterSpacing = '6px'; sc2.fillText('QUALITY CONTROL · FEYSE', 350, 198);
  sc2.globalCompositeOperation = 'destination-out'; sc2.fillStyle = grainPat; sc2.globalAlpha = 0.85; sc2.fillRect(0, 0, 700, 240);
  ctx.globalAlpha = 0.9 * k; ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(S, -175, -60, 350, 120);
  ctx.restore();
}

// ---------- frame ----------
function render(t) {
  t = clamp(t, 0, DUR - 1e-4);
  CAM = camera(t); Z = CAM.z;
  const lights = eio(pr(t, 45.6, 1.4));
  // table + sheet
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = tablePat; ctx.fillRect(0, 0, W, H);
  setSheet(ctx, CAM);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.65)'; ctx.shadowBlur = 40 * S0 * Z; ctx.shadowOffsetY = 14 * S0 * Z;
  ctx.fillStyle = '#18336B'; ctx.fillRect(0, 0, SW, SH); ctx.restore();
  ctx.save(); paperPat.setTransform(new DOMMatrix([2, 0, 0, 2, 0, 0])); ctx.fillStyle = paperPat; ctx.fillRect(0, 0, SW, SH);
  finePat.setTransform(new DOMMatrix([1.3, 0, 0, 1.3, 0, 0])); ctx.globalAlpha = 0.35; ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = finePat; ctx.fillRect(0, 0, SW, SH); ctx.restore();
  if (lights > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(2,5,14,${0.8 * lights})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  // ink
  ic.setTransform(1, 0, 0, 1, 0, 0); ic.clearRect(0, 0, W, H); setSheet(ic, CAM);
  drawSheet(t);
  ic.save(); ic.globalCompositeOperation = 'destination-out'; grainPat.setTransform(new DOMMatrix([1.4, 0, 0, 1.4, 0, 0])); ic.globalAlpha = 0.3; ic.fillStyle = grainPat; ic.fillRect(-200, -200, SW + 400, SH + 400); ic.restore();
  ic.save(); ic.globalCompositeOperation = 'destination-in'; ic.fillStyle = '#000'; ic.fillRect(0, 0, SW, SH); ic.restore(); // ink only on paper
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 0.55 + 0.4 * lights; ctx.filter = `blur(${(1.1 + 5 * lights) * Math.pow(Z, 0.3)}px)`; ctx.drawImage(inkC, 0, 0);
  ctx.filter = 'none'; ctx.globalAlpha = 1 - 0.45 * lights; ctx.drawImage(inkC, 0, 0); ctx.restore();
  drawStamp(t);
  drawReal(t, lights);
  // overlay: notes
  const texts = [];
  NOTES.forEach((N, i) => { const b = noteBox(t, i + 1, N); if (b) texts.push(b); });
  window.__texts = texts;
}

// ---------- sound / cue events for the mixer ----------
const EV = [
  { t: 0, type: 'paper_slap' }, { t: 0.25, type: 'pen', dur: 0.8 }, { t: 1.25, type: 'pen', dur: 0.6 },
  { t: 1.9, type: 'letter', dur: 1.3 }, { t: 3.0, type: 'letter', dur: 0.9 }, { t: 2.5, type: 'pen', dur: 1.25 },
  { t: 3.75, type: 'pen', dur: 0.6 }, { t: 4.4, type: 'letter', dur: 1.4 }, { t: 5.6, type: 'pop' },
  { t: 5.6, type: 'pen', dur: 0.9 }, { t: 6.5, type: 'letter', dur: 1.5 }, { t: 8.05, type: 'tick' }, { t: 8.17, type: 'tick' },
  { t: 9.3, type: 'click' }, { t: 10.2, type: 'click' }, { t: 9.9, type: 'click' }, { t: 10.5, type: 'click' }, { t: 10.9, type: 'click' },
  { t: 11.5, type: 'balloon' }, { t: 11.85, type: 'balloon' }, { t: 12.5, type: 'cut' },
  { t: 12.55, type: 'compass', dur: 0.5 }, { t: 14.0, type: 'hatch', dur: 0.7 },
  ...Array.from({ length: 9 }, (_, i) => ({ t: 14.375 + i * BEAT, type: 'shed' })),
  ...Array.from({ length: 16 }, (_, i) => ({ t: 15.0 + i * 2.5 / 16, type: 'weft_step' })),
  ...Array.from({ length: 14 }, (_, i) => ({ t: 17.5 + i * 2.1 / 14, type: 'weft_step' })),
  { t: 20.0, type: 'cut' }, { t: 21.1, type: 'thread_whirr', dur: 4.9 },
  ...[0, 1, 2, 3, 4].map(i => ({ t: 22.5 + i * 0.75, type: 'balloon' })),
  { t: 27.5, type: 'cut' }, ...[0, 1, 2, 3].map(i => ({ t: 29.375 + i * BEAT, type: 'tick_stroke' })),
  { t: 31.5, type: 'signature', dur: 0.9 }, { t: 32.5, type: 'silence', dur: 0.625 }, { t: 33.125, type: 'stamp' },
  { t: 35.0, type: 'cut' }, { t: 39.4, type: 'lift', dur: 1.6 }, { t: 45.6, type: 'light_switch' },
];
const VOICE = NOTES.map((N, i) => ({ id: i + 1, t: N.t0, text: N.s.replace('…', '') }));

window.DUR = DUR; window.EV = EV; window.VOICE = VOICE; window.NOTES = NOTES;
window.render = render;
window.TEXTS = t => { render(t); return window.__texts || []; };
Promise.all(['74px Hand', '700 26px Tech', '400 26px Tech', '70px Sig'].map(f => document.fonts.load(f))).then(() => document.fonts.ready).then(() => {
  buildTextures(); render(0); window.READY = true;
});
})();
