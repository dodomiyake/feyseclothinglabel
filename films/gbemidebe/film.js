// GBEMIDEBE — Metheues · manga-panel music video, drawn in code · 1920×1080 · window.render(t) is deterministic
'use strict';
(() => {
const W = 1920, H = 1080, INK = '#111', PAPER = '#F4F0E6', SPOT = '#FF5A1F';
const cv = document.getElementById('c'), c = cv.getContext('2d');
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
const pr = (t, a, d) => clamp((t - a) / d), eout = k => 1 - Math.pow(1 - k, 3), eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const back = k => { const s = 1.7; return 1 + (s + 1) * Math.pow(k - 1, 3) + s * Math.pow(k - 1, 2); };
let TM, BEATS, T; // timing.json, beat times, screentones
const R0 = CH.rng;

// ---------------- beats ----------------
function beatAt(t) { let lo = 0, hi = BEATS.length - 1; if (t < BEATS[0]) return { i: -1, f: 0, t0: 0 }; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (BEATS[m] <= t) lo = m; else hi = m - 1; } const t0 = BEATS[lo], t1 = BEATS[lo + 1] ?? t0 + 0.5866; return { i: lo, f: (t - t0) / (t1 - t0), t0 }; }
const pulse = (t, k = 7) => { const b = beatAt(t); return b.i < 0 ? 0 : Math.exp(-b.f * k); };
const snap = t => { const b = beatAt(t); return b.f < 0.5 ? b.t0 : (BEATS[b.i + 1] ?? t); };

// ---------------- drawing kit ----------------
function paper() { c.fillStyle = PAPER; c.fillRect(0, 0, W, H); }
function tone(name, a = 1) { c.globalAlpha = a; c.fillStyle = T[name]; }
function speed(cx, cy, w, h, n, seed, inner = 0.35, white = false) { // focus lines toward a point
  const R = R0(seed); c.save(); c.fillStyle = white ? '#fff' : INK; const rad = Math.hypot(w, h);
  for (let i = 0; i < n; i++) { const a = R() * 6.283, da = 0.004 + R() * 0.012, r0 = rad * (inner + R() * 0.25);
    c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a - da) * rad, cy + Math.sin(a - da) * rad); c.lineTo(cx + Math.cos(a + da) * rad, cy + Math.sin(a + da) * rad); c.fill(); }
  c.restore(); }
function vlines(w, h, n, seed, off = 0, dir = 1) { // vertical speed lines (rising)
  const R = R0(seed); c.save(); c.fillStyle = INK;
  for (let i = 0; i < n; i++) { const x = R() * w, len = 120 + R() * 380, y = ((R() * (h + len) + off * dir * (300 + R() * 300)) % (h + len)) - len, ww = 1.5 + R() * 4;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + ww, y + len * .1); c.lineTo(x, y + len); c.lineTo(x - ww, y + len * .1); c.fill(); }
  c.restore(); }
function sparkle(x, y, r, a = 1) { c.save(); c.globalAlpha = a; c.translate(x, y); c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 3;
  c.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.22 : r, an = i * Math.PI / 4; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } c.closePath(); c.fill(); c.stroke(); c.restore(); }
function sfx(s, x, y, size, k, rot = -0.08, fill = INK, outline = '#fff') { // slam-in lettering
  if (k <= 0) return; const sc = lerp(1.6, 1, back(clamp(k / 0.14))); c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc);
  c.font = `${size}px Bangers`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.letterSpacing = (size * 0.03) + 'px'; c.lineJoin = 'round';
  c.lineWidth = size * 0.22; c.strokeStyle = INK; c.strokeText(s, 0, 0); c.lineWidth = size * 0.14; c.strokeStyle = outline; c.strokeText(s, 0, 0); c.fillStyle = fill; c.fillText(s, 0, 0);
  c.letterSpacing = '0px'; c.restore(); }
function burst(cx, cy, r, n, seed, fill, a = 1) { // jagged starburst
  const R = R0(seed); c.save(); c.globalAlpha = a; c.beginPath(); for (let i = 0; i < n * 2; i++) { const an = i * Math.PI / n, rr = i % 2 ? r * (0.55 + R() * 0.1) : r * (0.9 + R() * 0.2); c.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr); } c.closePath();
  c.fillStyle = fill; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.restore(); }
function crowd(w, h, t, seed, rows = 3, hands = true, dark = true) {
  const R = R0(seed); c.save();
  for (let r = 0; r < rows; r++) { const y = h - 60 - r * 70, n = 9 + r * 2, sc = 1 - r * 0.18;
    for (let i = 0; i < n; i++) { const x = (i + 0.5 + (R() - .5) * .5) * w / n, ph = R() * 6.28, bob = Math.sin(t * Math.PI * 2 * (102.3 / 60) / 2 + ph) * 8 * sc + pulse(t) * -10 * sc;
      c.fillStyle = dark ? (r === 0 ? INK : r === 1 ? T.dark : T.mid) : T.light; c.strokeStyle = INK; c.lineWidth = 3;
      c.beginPath(); c.arc(x, y - 70 * sc + bob, 34 * sc, 0, 7); c.fill(); if (r) c.stroke();
      c.beginPath(); c.ellipse(x, y + 30 * sc + bob, 52 * sc, 70 * sc, 0, Math.PI, 0); c.lineTo(x + 52 * sc, h); c.lineTo(x - 52 * sc, h); c.fill();
      if (hands && R() > 0.35) { const s = R() > .5 ? 1 : -1, up = 0.4 + 0.6 * Math.abs(Math.sin(t * 5.35 + ph));
        c.lineWidth = 16 * sc; c.lineCap = 'round'; c.strokeStyle = c.fillStyle; c.beginPath(); c.moveTo(x + s * 36 * sc, y - 20 * sc + bob); c.lineTo(x + s * (60 + 20 * up) * sc, y - (90 + 110 * up) * sc + bob); c.stroke();
        c.beginPath(); c.arc(x + s * (60 + 20 * up) * sc, y - (90 + 110 * up) * sc + bob, 13 * sc, 0, 7); c.fill(); } }
  }
  c.restore(); }
function skyline(w, h, seed, fill) { const R = R0(seed); c.save(); c.fillStyle = fill; let x = 0; c.beginPath(); c.moveTo(0, h);
  while (x < w) { const bw = 60 + R() * 120, bh = 120 + R() * 320; c.lineTo(x, h - bh); c.lineTo(x + bw, h - bh); x += bw; } c.lineTo(w, h); c.fill();
  c.fillStyle = PAPER; for (let i = 0; i < 70; i++) { c.fillRect(R() * w, h - R() * 300, 8, 12); } // lit windows
  c.restore(); }
function palm(x, y, s) { c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = INK; c.fillStyle = INK; c.lineWidth = 16; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(20, -200, -10, -380); c.stroke();
  for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.45; c.beginPath(); c.moveTo(-10, -380); c.quadraticCurveTo(-10 + Math.cos(a) * 140, -380 + Math.sin(a) * 140 - 20, -10 + Math.cos(a) * 230, -380 + Math.sin(a) * 120 + 60); c.quadraticCurveTo(-10 + Math.cos(a) * 140, -380 + Math.sin(a) * 140 + 10, -10, -380); c.fill(); } c.restore(); }

// ---------------- panels ----------------
// a panel is a polygon in screen space; content draws in panel-local space (0..w, 0..h)
function rect(x, y, w, h) { return { pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], x, y, w, h }; }
function poly(pts) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), x = Math.min(...xs), y = Math.min(...ys); return { pts, x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y }; }
const M = 36, G = 20, PB = H - 132; // page margin, gutter, page bottom (the strip below holds the lyrics)
const LAY = {
  full: () => [rect(M, M, W - 2 * M, PB - M)],
  grid4: () => { const w = (W - 2 * M - G) / 2, h = (PB - M - G) / 2; return [rect(M, M, w, h), rect(M + w + G, M, w, h), rect(M, M + h + G, w, h), rect(M + w + G, M + h + G, w, h)]; },
  bigLeft: () => { const w1 = 1100, w2 = W - 2 * M - G - w1, h = (PB - M - G) / 2; return [rect(M, M, w1, PB - M), rect(M + w1 + G, M, w2, h), rect(M + w1 + G, M + h + G, w2, h)]; },
  strips3: () => { const w = (W - 2 * M - 2 * G) / 3; return [0, 1, 2].map(i => rect(M + i * (w + G), M, w, PB - M)); },
  diag2: () => [poly([[M, M], [1180, M], [760, PB], [M, PB]]), poly([[1180 + G, M], [W - M, M], [W - M, PB], [760 + G, PB]])],
  zig4: () => [poly([[M, M], [980, M], [880, 460], [M, 460]]), poly([[980 + G, M], [W - M, M], [W - M, 460], [880 + G, 460]]), poly([[M, 480], [700, 480], [800, PB], [M, PB]]), poly([[700 + G, 480], [W - M, 480], [W - M, PB], [800 + G, PB]])],
};
function drawPanel(p, t, appear, content, opt = {}) {
  const k = pr(t, appear, 0.16); if (k <= 0) return;
  c.save();
  const sc = lerp(1.06, 1, eout(k)), cx = p.x + p.w / 2, cy = p.y + p.h / 2;
  c.translate(cx, cy); c.scale(sc, sc); c.translate(-cx, -cy); c.globalAlpha = clamp(k * 3);
  c.beginPath(); p.pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
  c.save(); c.clip(); c.fillStyle = opt.bg || PAPER; c.fillRect(p.x, p.y, p.w, p.h);
  c.translate(p.x, p.y); content(p.w, p.h, t - appear); c.restore();
  c.lineWidth = opt.border ?? 7; c.strokeStyle = INK; c.lineJoin = 'miter'; c.stroke();
  c.restore();
}
// a page = layout + panels with their own appear times and contents
function page(t, lay, items, opt = {}) {
  c.fillStyle = opt.gutter || PAPER; c.fillRect(0, 0, W, H);
  const ps = LAY[lay]();
  const push = opt.push ? 1 + 0.02 * clamp((t - opt.t0) / 8) : 1, bump = opt.bump ? 1 + 0.012 * pulse(t, 9) : 1;
  c.save(); c.translate(W / 2, H / 2); c.scale(push * bump, push * bump); c.translate(-W / 2, -H / 2);
  items.forEach((it, i) => { if (!it || t >= it.at) return; const p = ps[i]; c.beginPath(); p.pts.forEach(([x, y], j) => j ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = opt.gutter === INK ? '#1c1c1a' : '#ECE7DB'; c.fill(); c.lineWidth = 3; c.strokeStyle = opt.gutter === INK ? '#444' : '#bdb6a6'; c.stroke(); });
  items.forEach((it, i) => it && drawPanel(ps[i], t, it.at, it.f, it));
  c.restore();
}

// ---------------- character helpers ----------------
function hero(x, y, s, o = {}) { c.save(); c.translate(x, y); c.scale(s, s); CH.bust(c, o); c.restore(); }
function heroHead(x, y, s, o = {}) { c.save(); c.translate(x, y); c.scale(s, s); CH.head(c, o); c.restore(); }
// dance poses (0 = arm/leg pointing down; left limbs go outward with negative angles, right limbs with positive)
const POSES = [
  { lsh: -2.5, lel: -0.5, rsh: 0.5, rel: 1.6, lhip: -0.25, lkn: 0.35, rhip: 0.1, rkn: -0.05, lean: 0.05 },
  { lsh: -0.5, lel: -1.6, rsh: 2.5, rel: 0.5, lhip: -0.1, lkn: 0.05, rhip: 0.25, rkn: -0.35, lean: -0.05 },
  { lsh: -1.3, lel: -1.2, rsh: 1.3, rel: 1.2, lhip: -0.3, lkn: 0.5, rhip: 0.3, rkn: -0.5, lean: 0, bob: 30 },
  { lsh: -2.8, lel: 0.2, rsh: 2.8, rel: -0.2, lhip: -0.18, lkn: 0.1, rhip: 0.18, rkn: -0.1, lean: 0, bob: -20 },
  { lsh: -0.9, lel: -0.8, rsh: 1.9, rel: 1.0, lhip: -0.05, lkn: 0.6, rhip: 0.35, rkn: -0.2, lean: 0.08, bob: 10 },
];
function dancer(x, y, s, t, set = [0, 1], o = {}) {
  const b = beatAt(t), i = Math.max(0, b.i), A = POSES[set[i % set.length]], B = POSES[set[(i + 1) % set.length]];
  const k = eio(clamp((b.f - 0.55) / 0.45)); const pose = {}; for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) pose[key] = lerp(A[key] ?? 0, B[key] ?? 0, k);
  pose.bob = (pose.bob || 0) + Math.sin(b.f * Math.PI) * -18;
  c.save(); c.translate(x, y); c.scale(s, s); CH.body(c, pose, { expr: o.expr || 'grin', blink: 0 }); c.restore(); }

// ---------------- panel contents ----------------
const F = {
  cover: (w, h, k, t) => { // intro cover page
    c.fillStyle = T.light; c.fillRect(0, 0, w, h); speed(w * 0.33, h * 0.45, w, h, 150, 11, 0.32);
    c.fillStyle = PAPER; c.beginPath(); c.arc(w * 0.33, h * 0.45, 360, 0, 7); c.fill();
    const C = PLAN.cover, shouting = C.shouts.some(a => k > a - 0.2 && k < a + 0.7);
    hero(w * 0.33, h * 0.38, 0.95, { expr: shouting ? 'shout' : 'cool', blink: (k % 4.1) > 3.95 ? 1 : 0 });
    c.fillStyle = SPOT; c.fillRect(w * 0.62, 70, 640, 16);
    sfx('GBEMIDEBE', w * 0.79, 210, 170, k - 0.15, -0.04, INK);
    c.font = '800 40px "Noto Sans"'; c.fillStyle = INK; c.textAlign = 'center'; c.globalAlpha = pr(k, C.name - 0.1, 0.3); c.fillText('METHEUES', w * 0.79, 330); c.globalAlpha = pr(k, C.vibes - 0.1, 0.3);
    c.font = '500 30px "Noto Sans"'; c.fillText(TM.title.includes('Remix') ? 'Vibes and Blues · Remix Vol. 2' : 'Vibes and Blues · Vol. 1', w * 0.79, 380); c.globalAlpha = 1; c.textAlign = 'left';
    const SP = [[0.78, 0.62, 200, -0.12], [0.66, 0.8, 150, 0.1], [0.9, 0.84, 170, -0.06]];
    C.shouts.forEach((at, i) => sfx(TM.title.includes('Remix') ? 'GBEMIDEBE!' : 'GIDDEM!', w * SP[i % 3][0], h * SP[i % 3][1], SP[i % 3][2], k - at, SP[i % 3][3], i === 0 ? SPOT : INK));
  },
  chain: (w, h, k, t) => { tone('light'); c.fillRect(0, 0, w, h); c.globalAlpha = 1; speed(w / 2, h * 0.65, w, h, 90, 21, 0.4);
    c.save(); c.translate(w / 2, h * 0.05); c.scale(1.9, 1.9); c.translate(0, -230); CH.bust(c, { expr: 'cool' }); c.restore();
    for (let i = 0; i < 4; i++) sparkle(w * (0.3 + i * 0.13), h * (0.55 + (i % 2) * 0.12), 26 + 10 * Math.sin(k * 6 + i), clamp(Math.sin(k * 4 + i * 1.3) + 0.3));
    sfx('FRESH', w * 0.2, h * 0.2, 110, k - 0.1, -0.1); sfx('CLEAN', w * 0.8, h * 0.25, 100, k - 0.7, 0.08, '#fff'); },
  cake16: (w, h, k, t) => { tone('light'); c.fillRect(0, 0, w, h); c.globalAlpha = 1;
    const cx = w * 0.62, cy = h * 0.68; c.lineWidth = 6; c.strokeStyle = INK;
    for (const [yy, ww, hh] of [[0, 300, 110], [-110, 220, 90]]) { c.fillStyle = PAPER; c.beginPath(); c.roundRect(cx - ww / 2, cy + yy - hh, ww, hh, 18); c.fill(); c.stroke(); c.fillStyle = T.mid; c.beginPath(); c.roundRect(cx - ww / 2 + 6, cy + yy - hh + 30, ww - 12, 24, 8); c.fill(); }
    sfx('16', cx, cy - 280, 140, 1, 0, SPOT);
    for (let i = 0; i < 5; i++) { const x = cx - 80 + i * 40, y = cy - 200; c.fillStyle = '#fff'; c.fillRect(x - 6, y - 50, 12, 50); c.strokeRect(x - 6, y - 50, 12, 50);
      c.fillStyle = SPOT; c.beginPath(); c.ellipse(x, y - 64 - Math.sin(k * 12 + i) * 3, 9, 16, 0, 0, 7); c.fill(); c.stroke(); }
    heroHead(w * 0.22, h * 0.5, 0.95, { expr: 'smile', turn: 0.4, look: 0.8 }); sfx('SWEET!', w * 0.25, h * 0.12, 100, k - 0.4, -0.08); },
  heroLow: (w, h, k, t) => { c.fillStyle = PAPER; c.fillRect(0, 0, w, h); speed(w / 2, h * 0.35, w, h, 170, 31, 0.25);
    dancer(w / 2, h * 0.08, 0.75, t, [3, 3]); sfx("I'M DAT GUY", w * 0.5, h * 0.82, 110, k - 0.2, -0.04, SPOT); },
  gasp: (w, h, k, t) => { tone('mid'); c.fillRect(0, 0, w, h); c.globalAlpha = 1;
    const R = R0(41); for (let i = 0; i < 7; i++) { const x = 90 + i * (w - 180) / 6, y = h * (0.45 + (i % 2) * 0.18), r = 70;
      c.fillStyle = INK; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); for (const s of [-1, 1]) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x + s * 24, y - 6, 16, 22, 0, 0, 7); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(x + s * 24, y - 2, 6, 0, 7); c.fill(); }
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y + 34, 12, 16 + 4 * Math.sin(k * 8 + i), 0, 0, 7); c.fill(); }
    sfx('?!', w * 0.85, h * 0.18, 140, k - 0.1, 0.1, '#fff'); sfx('UNA NEVER SEE!', w * 0.4, h * 0.15, 90, k - 0.5, -0.06); },
  notes: (w, h, k, t) => { tone('light'); c.fillRect(0, 0, w, h); c.globalAlpha = 1;
    for (let i = 0; i < 9; i++) { const a = k * 1.6 + i * 0.7, r = 120 + i * 26, x = w / 2 + Math.cos(a) * r, y = h / 2 + Math.sin(a) * r * 0.6;
      c.fillStyle = i % 3 ? INK : SPOT; c.beginPath(); c.ellipse(x, y, 20, 14, -0.4, 0, 7); c.fill(); c.fillRect(x + 14, y - 70, 6, 70); c.beginPath(); c.moveTo(x + 20, y - 70); c.quadraticCurveTo(x + 50, y - 50, x + 40, y - 26); c.lineWidth = 6; c.strokeStyle = c.fillStyle; c.stroke(); }
    heroHead(w / 2, h * 0.5, 0.8, { expr: 'cool', blink: (k % 2.3) < 0.12 ? 1 : 0 }); sfx('VIBES!', w * 0.18, h * 0.14, 90, k - 0.2, -0.1); },
  mix: (w, h, k, t) => { c.fillStyle = PAPER; c.fillRect(0, 0, w, h); speed(w / 2, h * 0.55, w, h, 70, 51, 0.45);
    const cx = w / 2, cy = h * 0.72; c.fillStyle = INK; c.beginPath(); c.ellipse(cx, cy, 230, 70, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(cx - 230, cy); c.quadraticCurveTo(cx - 220, cy + 210, cx, cy + 210); c.quadraticCurveTo(cx + 220, cy + 210, cx + 230, cy); c.fill();
    c.fillStyle = T.light; c.beginPath(); c.ellipse(cx, cy, 200, 52, 0, 0, 7); c.fill();
    for (let i = 0; i < 2; i++) { c.save(); c.translate(cx, cy - 160); c.rotate(k * 2.4 + i * Math.PI); c.strokeStyle = i ? SPOT : INK; c.lineWidth = 14; c.beginPath(); for (let a = 0; a < 9; a += 0.2) c.lineTo(Math.cos(a) * a * 14, Math.sin(a) * a * 8); c.stroke(); c.restore(); }
    sfx('VIBES', cx - 260, h * 0.2, 90, k - 0.1, -0.1); sfx('+ BLUES', cx + 250, h * 0.2, 90, k - 0.6, 0.08, SPOT); },
  cube: (w, h, k, t) => { tone('light'); c.fillRect(0, 0, w, h); c.globalAlpha = 1;
    const cx = w / 2, cy = h / 2; c.save(); c.translate(cx, cy); c.rotate(-0.2); c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 8; c.fillRect(-120, -120, 240, 240); c.strokeRect(-120, -120, 240, 240);
    c.fillStyle = T.mid; c.fillRect(-120, -40, 240, 80); c.restore();
    const x = pr(k, 0.5, 0.25); c.strokeStyle = SPOT; c.lineWidth = 34; c.lineCap = 'round';
    if (x > 0) { c.beginPath(); c.moveTo(cx - 190, cy - 190); c.lineTo(cx - 190 + 380 * x, cy - 190 + 380 * x); c.stroke(); }
    const y = pr(k, 0.78, 0.25); if (y > 0) { c.beginPath(); c.moveTo(cx + 190, cy - 190); c.lineTo(cx + 190 - 380 * y, cy - 190 + 380 * y); c.stroke(); }
    sfx('NO NEED!', cx, h * 0.12, 100, k - 0.9, -0.05); },
  chef: (w, h, k, t) => { c.fillStyle = PAPER; c.fillRect(0, 0, w, h); burst(w / 2, h / 2, Math.max(w, h) * 0.55, 18, 61, T.light);
    heroHead(w / 2, h * 0.52, 0.95, { expr: k > 0.5 ? 'wink' : 'smile' });
    for (let i = 0; i < 5; i++) sparkle(w * (0.15 + i * 0.18), h * (0.2 + (i % 2) * 0.6), 30, clamp(k * 2 - i * 0.2));
    sfx('SUPREME!', w * 0.5, h * 0.88, 120, k - 0.4, -0.05, SPOT); },
  rise: (w, h, k, t) => { c.fillStyle = PAPER; c.fillRect(0, 0, w, h); vlines(w, h, 140, 71, k, 1);
    const y = h * 0.95 - eout(clamp(k / 2.2)) * h * 0.55; dancer(w / 2, y - 560 * 0.7, 0.7, t, [3, 3], { expr: 'grin' });
    for (let i = 0; i < 5; i++) { c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 5; const cx = (i * 430 + 200) % w, cy = h * 0.9 + ((k * 260 + i * 200) % 500) - 100; c.beginPath(); for (let j = 0; j < 5; j++) c.arc(cx + j * 50 - 100, cy + (j % 2) * 16, 50, Math.PI, 0); c.fill(); c.stroke(); }
    sfx('GOING HIGH', w * 0.22, h * 0.16, 110, k - 0.2, -0.08); sfx('SO FLY!', w * 0.8, h * 0.22, 110, k - 1.2, 0.08, SPOT); },
  drip: (w, h, k, t) => { tone('light'); c.fillRect(0, 0, w, h); c.globalAlpha = 1; hero(w / 2, h * 0.32, 0.85, { expr: 'cool' });
    const R = R0(81); c.fillStyle = INK; for (let i = 0; i < 16; i++) { const x = R() * w, len = (80 + R() * 400) * eout(clamp(k / 1.6 - R() * 0.3)), ww = 14 + R() * 22;
      c.fillRect(x - ww / 2, 0, ww, len); c.beginPath(); c.arc(x, len, ww * 0.75, 0, 7); c.fill(); }
    sfx('DRIP', w * 0.18, h * 0.8, 120, k - 0.2, -0.1, '#fff'); sfx('ON DRIP!', w * 0.8, h * 0.82, 110, k - 0.8, 0.06, SPOT); },
  comot: (w, h, k, t) => { c.fillStyle = '#4a4944'; c.fillRect(0, 0, w, h); tone('dark', 0.6); c.fillRect(0, 0, w, h); c.globalAlpha = 1; speed(w / 2, h / 2, w, h, 120, 91, 0.3, true);
    dancer(w / 2, h * 0.12, 0.62, t, [0, 1]); sfx('COMOT BODY!', w * 0.5, h * 0.84, 110, k - 0.2, -0.04, SPOT); },
  carry: (w, h, k, t) => { tone('light'); c.fillRect(0, 0, w, h); c.globalAlpha = 1; speed(w / 2, h * 0.3, w, h, 90, 101, 0.35);
    c.save(); c.translate(w / 2, h * 0.42 + Math.sin(k * 5.35) * 14); c.rotate(-Math.PI / 2 + 0.12); c.scale(0.5, 0.5); CH.body(c, POSES[3], { expr: 'grin' }); c.restore();
    crowd(w, h, t, 111, 2, true); sfx('GBÉ MI DÉ BẸ̀!', w * 0.5, h * 0.12, 100, k - 0.2, -0.05, SPOT); },
  point: (w, h, k, t) => { c.fillStyle = PAPER; c.fillRect(0, 0, w, h); speed(w / 2, h * 0.4, w, h, 200, 121, 0.2);
    hero(w / 2, h * 0.3, 1.05, { expr: 'grin', look: 0 }); c.strokeStyle = INK; c.fillStyle = PAPER; c.lineWidth = 8;
    sfx("YOU CAN'T DENY!", w * 0.5, h * 0.12, 120, k - 0.1, -0.04, SPOT); },
  chest: (w, h, k, t) => { c.fillStyle = PAPER; c.fillRect(0, 0, w, h); const p = pulse(t, 6);
    for (let i = 0; i < 3; i++) { c.strokeStyle = INK; c.lineWidth = 8 - i * 2; c.beginPath(); c.arc(w / 2, h * 0.75, 200 + i * 90 + p * 60, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    hero(w / 2, h * 0.3 + p * 10, 0.95 * (1 + p * 0.03), { expr: 'shout' }); sfx('LAYA!', w * 0.2, h * 0.2, 120, k - 0.1, -0.1, SPOT); sfx('BOOM', w * 0.82, h * 0.7, 110, k - 0.3, 0.1); },
  light: (w, h, k, t) => { c.fillStyle = INK; c.fillRect(0, 0, w, h); const p = pulse(t, 5);
    c.save(); c.globalAlpha = 0.85; for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12 + k * 0.4; c.fillStyle = i % 2 ? SPOT : '#fff'; c.beginPath(); c.moveTo(w / 2, h * 0.55); c.lineTo(w / 2 + Math.cos(a) * 2000, h * 0.55 + Math.sin(a) * 2000); c.lineTo(w / 2 + Math.cos(a + 0.12) * 2000, h * 0.55 + Math.sin(a + 0.12) * 2000); c.fill(); } c.restore();
    burst(w / 2, h * 0.55, 220 + p * 60, 14, 131, '#fff'); dancer(w / 2, h * 0.08, 0.68, t, [3, 2], { expr: 'grin' });
    sfx('LIGHT WAN!', w * 0.5, h * 0.84, 130, k - 0.2, -0.04, SPOT); },
  steps: (w, h, k, t) => { tone('light'); c.fillRect(0, 0, w, h); c.globalAlpha = 1; const b = beatAt(t);
    for (const [s, ph] of [[-1, 0], [1, 1]]) { const up = Math.max(0, Math.sin((b.f + ph * 0.5 + (b.i % 2) * .5) * Math.PI)); const x = w / 2 + s * 170, y = h * 0.72 - up * 120;
      c.fillStyle = '#222220'; c.fillRect(x - 50, 0, 100, y); c.strokeStyle = INK; c.lineWidth = 8; c.strokeRect(x - 50, -10, 100, y + 10);
      c.save(); c.translate(x, y + 30); c.scale(s, 1); c.beginPath(); c.ellipse(30, 0, 120, 52, 0, 0, 7); c.fillStyle = '#fff'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(-80, 26); c.lineTo(150, 26); c.lineWidth = 6; c.stroke(); c.restore();
      for (let i = 0; i < 4; i++) { c.lineWidth = 5; c.beginPath(); c.moveTo(x - 150 * s - i * 20 * s, y + 10 + i * 18); c.lineTo(x - 260 * s - i * 20 * s, y + 10 + i * 18); c.stroke(); } }
    c.fillStyle = INK; c.fillRect(0, h * 0.9, w, h * 0.1); sfx('STEP!', w * 0.15, h * 0.18, 110, k - 0.1, -0.1, SPOT); sfx('MAGỌ!', w * 0.85, h * 0.2, 110, k - 0.6, 0.08); },
  dance: (w, h, k, t) => { c.fillStyle = PAPER; c.fillRect(0, 0, w, h); speed(w / 2, h * 0.45, w, h, 110, 141, 0.38);
    skyline(w, h * 0.75, 151, T.mid); palm(w * 0.1, h * 0.75, 0.9); palm(w * 0.9, h * 0.78, 0.8);
    dancer(w / 2, h * 0.06, 0.62, t, [0, 2, 1, 2]); crowd(w, h, t, 161, 2, true); },
  chapter: (w, h, k, t) => { c.fillStyle = INK; c.fillRect(0, 0, w, h); c.fillStyle = SPOT; c.fillRect(0, h * 0.46, w * eout(clamp(k / 0.4)), 14);
    sfx('CHAPTER 2', w / 2, h * 0.36, 140, k - 0.1, 0, '#fff', INK); c.font = '800 54px "Noto Sans"'; c.fillStyle = PAPER; c.textAlign = 'center'; c.globalAlpha = pr(k, 0.3, 0.3); c.fillText('Òjò ò lè pa agogo', w / 2, h * 0.62); c.globalAlpha = 1; c.textAlign = 'left'; },
  bend: (w, h, k, t) => { tone('light'); c.fillRect(0, 0, w, h); c.globalAlpha = 1; speed(w / 2, h * 0.7, w, h, 80, 171, 0.42);
    dancer(w / 2, h * 0.2, 0.62, t, [2, 4]); sfx('Ó YÁ!', w * 0.2, h * 0.16, 120, k - 0.05, -0.1, SPOT); sfx('JÓ!', w * 0.82, h * 0.22, 130, k - 1.6, 0.1); },
  plate: (w, h, k, t) => { c.fillStyle = PAPER; c.fillRect(0, 0, w, h); burst(w * 0.7, h * 0.6, 260, 12, 181, T.light);
    c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.ellipse(w * 0.7, h * 0.7, 230, 70, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.ellipse(w * 0.7, h * 0.7, 150, 42, 0, 0, 7); c.stroke();
    heroHead(w * 0.26, h * 0.48, 0.85, { expr: 'smile', turn: 0.5, blink: 1 }); sfx('MO TI YÓ!', w * 0.7, h * 0.2, 110, k - 0.3, -0.06, SPOT); },
  real: (w, h, k, t) => { tone('mid'); c.fillRect(0, 0, w, h); c.globalAlpha = 1; hero(w * 0.3, h * 0.3, 0.8, { expr: 'cool' });
    const s = pr(k, 0.35, 0.12); if (s > 0) { c.save(); c.translate(w * 0.72, h * 0.5); c.rotate(-0.15); c.scale(lerp(1.8, 1, back(s)), lerp(1.8, 1, back(s))); c.strokeStyle = SPOT; c.lineWidth = 16; c.strokeRect(-230, -110, 460, 220); c.font = '150px Bangers'; c.fillStyle = SPOT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('REAL', 0, 8); c.restore(); }
    sfx('NO BE CHINKO', w * 0.72, h * 0.85, 80, k - 0.8, -0.04); },
  lowlow: (w, h, k, t) => { c.fillStyle = PAPER; c.fillRect(0, 0, w, h); tone('light'); c.fillRect(0, h * 0.55, w, h); c.globalAlpha = 1;
    c.save(); c.translate(w / 2, h * 0.35); c.rotate(-0.06); c.scale(0.8, 0.8); CH.bust(c, { expr: 'cool' }); c.fillStyle = INK; c.beginPath(); c.roundRect(-150, -62, 130, 60, 16); c.roundRect(20, -62, 130, 60, 16); c.fill(); c.fillRect(-30, -50, 60, 10); c.fillStyle = '#fff'; c.fillRect(-120, -52, 30, 8); c.fillRect(50, -52, 30, 8); c.restore();
    for (let i = 0; i < 4; i++) { const y = h * 0.2 + i * 40 + Math.sin(k * 2 + i) * 10; c.font = '60px Bangers'; c.fillStyle = INK; c.fillText('♪', w * 0.8 + i * 30, y); }
    sfx('LOWLOW...', w * 0.2, h * 0.86, 90, k - 0.3, -0.05); },
  haters: (w, h, k, t) => { c.fillStyle = INK; c.fillRect(0, 0, w, h); const R = R0(191);
    for (let i = 0; i < 5; i++) { const x = 160 + i * (w - 320) / 4, y = h * 0.62 + (i % 2) * 40; c.fillStyle = '#2a2a28'; c.beginPath(); c.arc(x, y - 120, 60, 0, 7); c.fill(); c.beginPath(); c.ellipse(x, y + 40, 80, 120, 0, Math.PI, 0); c.lineTo(x + 80, h); c.lineTo(x - 80, h); c.fill();
      c.fillStyle = '#fff'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * 20, y - 124, 14, 6, s * 0.3, 0, 7); c.fill(); }
      if (i % 2 === 0) { c.fillStyle = PAPER; c.beginPath(); c.ellipse(x + 90, y - 250, 80, 46, 0, 0, 7); c.fill(); c.font = '40px Bangers'; c.fillStyle = INK; c.textAlign = 'center'; c.fillText('psst...', x + 90, y - 238); c.textAlign = 'left'; } }
    sfx('DEM NO KNOW', w * 0.5, h * 0.14, 110, k - 0.2, -0.04, SPOT); },
  giant: (w, h, k, t) => { tone('light'); c.fillRect(0, 0, w, h); c.globalAlpha = 1; speed(w * 0.6, h * 0.3, w, h, 120, 201, 0.3);
    hero(w * 0.62, h * 0.28, 1.1, { expr: 'cool', look: -0.8, turn: -0.3 });
    for (let i = 0; i < 6; i++) { const x = 60 + i * 60, y = h * 0.92; c.fillStyle = INK; c.beginPath(); c.arc(x, y - 40, 16, 0, 7); c.fill(); c.fillRect(x - 12, y - 24, 24, 34); }
    sfx('KÉRÉ-KÉRÉ', w * 0.2, h * 0.72, 70, k - 0.4, -0.08); },
  rain: (w, h, k, t) => { tone('mid'); c.fillRect(0, 0, w, h); c.globalAlpha = 1; const R = R0(211);
    c.strokeStyle = '#fff'; c.lineWidth = 3; for (let i = 0; i < 160; i++) { const x = R() * w, y = (R() * h + k * 900 * (0.8 + R() * .4)) % (h + 60) - 30; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 14, y + 44); c.stroke(); }
    const sw = Math.sin(k * 10.7) * 0.15; c.save(); c.translate(w / 2, h * 0.5); c.rotate(sw);
    for (const [dx, s] of [[-80, 1], [90, 0.8]]) { c.save(); c.translate(dx, 0); c.scale(s, s); c.fillStyle = '#ddd'; c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.moveTo(-60, -110); c.lineTo(60, -110); c.lineTo(110, 120); c.lineTo(-110, 120); c.closePath(); c.fill(); c.stroke(); c.fillStyle = T.light; c.fill(); c.fillStyle = '#fff'; c.fillRect(-60, -80, 18, 170); c.restore(); }
    c.lineWidth = 12; c.beginPath(); c.moveTo(-80, -110); c.quadraticCurveTo(0, -260, 72, -96); c.stroke(); c.restore();
    for (const [at, x, y] of [[0.2, 0.2, 0.25], [0.8, 0.8, 0.3], [1.4, 0.25, 0.78]]) sfx('GOGO!', w * x, h * y, 110, k - at, (x - .5) * .3, SPOT);
    sfx('ÒJÒ Ò LÈ PA AGOGO', w * 0.5, h * 0.92, 72, k - 0.3, 0); },
  sun: (w, h, k, t) => { c.fillStyle = PAPER; c.fillRect(0, 0, w, h); const cx = w * 0.55, cy = h * 0.45, bl = pr(k, 1.0, 0.35);
    c.save(); for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10 + k * 0.2, len = 320 + bl * 900; c.fillStyle = i % 2 ? SPOT : INK; c.globalAlpha = 0.8; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); c.lineTo(cx + Math.cos(a + 0.1) * len, cy + Math.sin(a + 0.1) * len); c.fill(); } c.restore();
    c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.arc(cx, cy, 160, 0, 7); c.fill(); c.stroke(); tone('light'); c.fill(); c.globalAlpha = 1;
    // a hand trying to cover the sun, pushed away when the rays burst
    const hx = lerp(cx - 40, cx - 600, eout(bl)), hy = lerp(cy + 40, cy + 200, eout(bl)); c.save(); c.translate(hx, hy); c.rotate(-0.3 - bl * 0.6);
    c.fillStyle = PAPER; c.beginPath(); c.roundRect(-120, -40, 240, 260, 60); for (let i = 0; i < 4; i++) c.roundRect(-110 + i * 58, -200, 48, 190, 24); c.fill(); c.fillStyle = T.skin; c.fill(); c.stroke(); c.restore();
    sfx('OÒRÙN MI!', w * 0.5, h * 0.88, 110, k - 1.0, -0.04, SPOT); },
  back: (w, h, k, t) => { c.fillStyle = '#3a3935'; c.fillRect(0, 0, w, h); speed(w * 0.3, h * 0.5, w, h, 140, 221, 0.35, true);
    c.save(); c.translate(w * 0.3 + k * 6, h * 0.12); c.scale(0.6, 0.6); CH.body(c, POSES[4], { expr: 'cool' }); c.restore();
    c.font = '800 44px "Noto Sans"'; c.fillStyle = PAPER; c.textAlign = 'center'; c.globalAlpha = pr(k, 0.1, 0.4); c.fillText('Vibes and Blues', w * 0.72, h * 0.3); c.globalAlpha = 1;
    const O = PLAN.outro; sfx('METHEUES MUSIC', w * 0.72, h * 0.45, 120, k - (O.music - O.t0), -0.04, SPOT, INK);
    sfx('GIDDEM!!!', w * 0.72, h * 0.66, 180, k - (O.giddem - O.t0), -0.08, '#fff', INK);
    c.globalAlpha = pr(k, O.giddem - O.t0 + 1.0, 0.6); c.font = '800 40px "Noto Sans"'; c.fillStyle = PAPER; c.fillText('TO BE CONTINUED…', w * 0.72, h * 0.86); c.globalAlpha = 1; c.textAlign = 'left'; },
};
const P_ = (f, at, o = {}) => ({ f: (w, h, k) => F[f](w, h, k, cur), at, ...o });
let cur = 0;

// ---------------- the film: pages on the song's sections, panels on the lyric lines ----------------
let PLAN;
const CHORUS_LINES = ['carry', 'chest', 'light', 'steps'];
function chorusBlock(t, at, n, wave) { // one 4-line chorus block, panels on the sung lines; each block gets its own layout
  const a = at.map(x => x - 0.12), style = (n + wave) % 4;
  if (style === 0) return page(t, 'grid4', CHORUS_LINES.map((f, i) => P_(f, a[i])), { bump: 1 });
  if (style === 1) { const i = Math.max(0, a.filter(x => t >= x).length - 1); return page(t, 'full', [P_(CHORUS_LINES[i], a[i])], { bump: 1 }); }
  if (style === 2) { if (t < a[3]) return page(t, 'strips3', [P_('carry', a[0]), P_('chest', a[1]), P_('light', a[2])], { bump: 1 }); return page(t, 'full', [P_('dance', a[3])], { bump: 1 }); }
  if (t < a[2]) return page(t, 'diag2', [P_('carry', a[0]), P_('chest', a[1])], { bump: 1 });
  return page(t, 'diag2', [P_('light', a[2]), P_('steps', a[3])], { bump: 1 });
}
function pre(t, p, next) { // pre-chorus: rise, drip, comot body, carry, "you can't deny"
  const a = p.map(x => x - 0.12), seq = ['rise', 'drip', 'comot', 'carry', 'point'];
  const i = Math.max(0, a.filter(x => t >= x).length - 1); return page(t, 'full', [P_(seq[i], i === 0 ? Math.min(a[0], t) : a[i], seq[i] === 'comot' ? { bg: INK } : {})]);
}
function dancebreak(t, t0, t1, seed) { // instrumental break: a new full page every two bars
  const bar = 4 * (60 / TM.bpm), i = Math.floor((t - t0) / (2 * bar)), at = t0 + i * 2 * bar, seq = ['dance', 'light', 'steps', 'carry', 'dance', 'chest', 'light', 'dance'];
  if (t > t1 - 1.15) return page(t, 'full', [P_('chapter', t1 - 1.15, { bg: INK })]);
  return page(t, 'full', [P_(seq[(i + seed) % seq.length], at)], { bump: 1 });
}
function scene(t) {
  cur = t; const P = PLAN, v1 = P.v1.map(x => x - 0.15), v2 = P.v2.map(x => x - 0.15);
  if (t < P.cover.t1) return page(t, 'full', [P_('cover', 0)], { push: 1, t0: 0 });
  if (t < v1[4] - 0.05) return page(t, 'grid4', [P_('chain', v1[0]), P_('cake16', v1[1]), P_('heroLow', v1[2]), P_('gasp', v1[3])], { push: 1, t0: P.cover.t1 });
  if (t < P.pre1[0] - 0.12) return page(t, 'zig4', [P_('notes', v1[4]), P_('mix', v1[5]), P_('cube', v1[6]), P_('chef', v1[7])], { push: 1, t0: v1[4] });
  if (t < P.ch1[0][0] - 0.12) return pre(t, P.pre1);
  const lastCh1 = P.ch1[P.ch1.length - 1], endCh1 = P.tag1 ? P.tag1[0] : v2[0] - 1.15;
  if (t < endCh1) { const n = Math.max(0, P.ch1.filter(b => t >= b[0] - 0.15).length - 1); return chorusBlock(t, P.ch1[n], n, 0); }
  if (P.tag1 && t < P.tag1[1]) return page(t, 'full', [P_('steps', P.tag1[0] - 0.1)], { bump: 1 });
  if (P.break1 && t < v2[0]) return dancebreak(t, P.tag1[1], v2[0], 0);
  if (t < v2[0]) return page(t, 'full', [P_('chapter', v2[0] - 1.15, { bg: INK })]);
  if (t < v2[4] - 0.05) return page(t, 'grid4', [P_('bend', v2[0]), P_('plate', v2[1]), P_('real', v2[2]), P_('lowlow', v2[3])], { push: 1, t0: v2[0] });
  if (t < v2[7]) return page(t, 'bigLeft', [P_('haters', v2[4]), P_('giant', v2[5]), P_('rain', v2[6])], { push: 1, t0: v2[4] });
  if (t < P.pre2[0] - 0.12) return page(t, 'full', [P_('sun', v2[7])]);
  if (t < P.ch2[0][0] - 0.12) return pre(t, P.pre2);
  const endCh2 = P.tag2 ? P.tag2[0] : P.outro.t0;
  if (t < endCh2) { const n = Math.max(0, P.ch2.filter(b => t >= b[0] - 0.15).length - 1);
    if (n === 4) return page(t, 'full', [P_('dance', P.ch2[4][0] - 0.12)], { bump: 1 }); return chorusBlock(t, P.ch2[n], n, 1); }
  if (P.tag2 && t < P.tag2[1]) return page(t, 'full', [P_('steps', P.tag2[0] - 0.1)], { bump: 1 });
  if (P.break2 && t < P.outro.t0) { const bar = 4 * (60 / TM.bpm), i = Math.floor((t - P.break2[0]) / (2 * bar)); return page(t, 'full', [P_(['dance', 'light', 'dance'][i % 3], P.break2[0] + i * 2 * bar)], { bump: 1 }); }
  return page(t, 'full', [P_('back', P.outro.t0, { bg: INK })], { gutter: INK });
}

// ---------------- subtitles (lyrics) ----------------
function subtitle(t) {
  const L = TM.lines; let cur = null;
  for (let i = 0; i < L.length; i++) { const end = Math.min((L[i + 1]?.t0 ?? 999) - 0.05, L[i].t1 + 0.8); if (t >= L[i].t0 - 0.12 && t < end) { cur = L[i]; break; } }
  if (!cur) return null;
  c.save(); c.font = '800 50px "Noto Sans"'; const tw = c.measureText(cur.text).width, x = W / 2, y = H - 50;
  const a = clamp((t - cur.t0 + 0.12) / 0.1);
  c.globalAlpha = a;
  c.fillStyle = PAPER; c.textAlign = 'center'; c.fillText(cur.text, x, y);
  c.restore();
  return { id: 'lyric', text: cur.text, x0: x - tw / 2 - 34, y0: y - 52, x1: x + tw / 2 + 34, y1: y + 22 };
}

function render(t) {
  t = clamp(t, 0, TM.duration - 1e-3);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.filter = 'none';
  scene(t);
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
  // downbeat flash on page changes is drawn by panels themselves; final fade
  if (t > TM.duration - 1.2) { c.fillStyle = `rgba(17,17,17,${pr(t, TM.duration - 1.2, 1.2)})`; c.fillRect(0, 0, W, H); }
  c.fillStyle = INK; c.fillRect(0, PB + 14, W, H - PB - 14); c.fillStyle = SPOT; c.fillRect(0, PB + 14, W, 5);
  const s = subtitle(t); window.__texts = s ? [s] : [];
}

window.render = render;
window.TEXTS = t => { render(t); return window.__texts; };
const SONG = new URLSearchParams(location.search).get('song');
fetch(SONG === 'remix' ? 'timing-remix.json' : 'timing.json').then(r => r.json()).then(j => { TM = j; BEATS = j.beats; PLAN = j.plan; window.DUR = j.duration; CH.HAIR = j.hair || 'twists'; CH.GREY = j.grey || 1; T = CH.tones(c); })
  .then(() => Promise.all(['100px Bangers', '800 46px "Noto Sans"'].map(f => document.fonts.load(f, 'GIDDEM ọ́ẹ̀ṣ'))))
  .then(() => document.fonts.ready).then(() => { render(0); window.READY = true; });
})();
