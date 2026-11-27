// GBEMIDEBE (Remix Version 2) · Metheues — 80s cel-anime music video, drawn in code · 1920×1080 · window.render(t) is deterministic
'use strict';
(() => {
const W = 1920, H = 1080;
const cv = document.getElementById('c'), c0 = cv.getContext('2d');
const mk = (w, h) => { const k = document.createElement('canvas'); k.width = w; k.height = h; return k; };
const COL = mk(W, H), EMI = mk(W, H), SMALL = mk(W / 4, H / 4), SMALL2 = mk(W / 8, H / 8);
const c = COL.getContext('2d'), e = EMI.getContext('2d'), sm = SMALL.getContext('2d'), sm2 = SMALL2.getContext('2d');
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
const pr = (t, a, d) => clamp((t - a) / d), eout = k => 1 - Math.pow(1 - k, 3), eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const rng = C80.rng, q12 = t => Math.floor(t * 12) / 12, q8 = t => Math.floor(t * 8) / 8;
let TM, PLAN, BEATS;
const NEON = { pink: '#FF3EA5', cyan: '#36E7FF', gold: '#FFC95A', violet: '#B46BFF', orange: '#FF8A3D', lime: '#B6FF5A' };

// ---------------- beats ----------------
function beatAt(t) { let lo = 0, hi = BEATS.length - 1; if (t < BEATS[0]) return { i: -1, f: 0, t0: 0 }; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (BEATS[m] <= t) lo = m; else hi = m - 1; } const t0 = BEATS[lo], t1 = BEATS[lo + 1] ?? t0 + 0.528; return { i: lo, f: (t - t0) / (t1 - t0), t0 }; }
const pulse = (t, k = 6) => { const b = beatAt(t); return b.i < 0 ? 0 : Math.exp(-b.f * k); };

// ---------------- painted plates (colour + emissive pair), painted once ----------------
const PL = {};
function plate(name, w, h, paint) { const a = mk(w, h), b = mk(w, h); paint(a.getContext('2d'), b.getContext('2d'), w, h); PL[name] = { col: a, emi: b, w, h }; }
function sky(g, w, h, stops) { const gr = g.createLinearGradient(0, 0, 0, h); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
function stars(g, ge, w, h, n, seed) { const R = rng(seed); for (let i = 0; i < n; i++) { const x = R() * w, y = R() * h, r = R() < 0.92 ? 1 + R() : 2.2; g.fillStyle = `rgba(255,250,240,${0.4 + R() * 0.6})`; g.fillRect(x, y, r, r); if (r > 2) { ge.fillStyle = '#FFF4E0'; ge.fillRect(x - 1, y - 1, 4, 4); } } }
function clouds(g, w, y0, n, seed, body, lit) { const R = rng(seed); for (let i = 0; i < n; i++) { const x = R() * w, y = y0 + R() * 120, s = 80 + R() * 160;
  g.fillStyle = body; g.beginPath(); for (let j = 0; j < 6; j++) g.ellipse(x + j * s * 0.45, y - Math.sin(j * 1.3) * s * 0.18, s * 0.5, s * 0.28, 0, 0, 7); g.fill();
  g.fillStyle = lit; g.beginPath(); for (let j = 0; j < 6; j++) g.ellipse(x + j * s * 0.45, y + s * 0.16 - Math.sin(j * 1.3) * s * 0.18, s * 0.42, s * 0.1, 0, 0, 7); g.fill(); } }
function skyline(g, ge, w, base, seed, fill, winCols, tall = 1, signs = []) {
  const R = rng(seed); let x = -20;
  while (x < w) { const bw = 50 + R() * 130, bh = (90 + R() * 330) * tall; g.fillStyle = fill; g.fillRect(x, base - bh, bw, bh + 4);
    if (R() < 0.25) { g.fillRect(x + bw * 0.45, base - bh - 50, 4, 50); ge.fillStyle = NEON.pink; ge.fillRect(x + bw * 0.45 - 2, base - bh - 54, 8, 8); }
    for (let wy = base - bh + 14; wy < base - 10; wy += 18) for (let wx = x + 8; wx < x + bw - 10; wx += 16) if (R() < 0.38) { const col = winCols[Math.floor(R() * winCols.length)]; g.fillStyle = col; g.fillRect(wx, wy, 8, 10); ge.fillStyle = col; ge.globalAlpha = 0.7; ge.fillRect(wx, wy, 8, 10); ge.globalAlpha = 1; }
    x += bw + R() * 6; }
  for (const [sx, sy, text, col, size] of signs) { neonText(g, ge, text, sx, sy, size, col); }
}
function neonText(g, ge, s, x, y, size, col, font = "800") {
  for (const k of [g, ge]) { k.save(); k.font = `${font} ${size}px 'Barlow Semi Condensed'`; k.textAlign = 'center'; k.textBaseline = 'middle'; k.lineJoin = 'round';
    k.lineWidth = size * 0.12; k.strokeStyle = col; k.strokeText(s, x, y); k.lineWidth = size * 0.04; k.strokeStyle = '#FFFFFF'; k.strokeText(s, x, y); k.restore(); } }
function water(g, ge, src, srcE, w, y0, h) { // wet reflection: flipped, smeared, darkened copy with ripple bands
  for (const [k, s, dark] of [[g, src, 0.55], [ge, srcE, 0.25]]) { k.save(); k.translate(0, y0 * 2); k.scale(1, -1); k.filter = 'blur(3px)'; k.globalAlpha = 1 - dark; k.drawImage(s, 0, 0, w, y0, 0, 0, w, y0); k.restore();
    k.save(); k.globalAlpha = 1; for (let y = y0; y < y0 + h; y += 6 + (y - y0) * 0.04) { k.fillStyle = k === g ? 'rgba(10,6,30,0.35)' : 'rgba(0,0,0,0.55)'; k.fillRect(0, y, w, 2 + (y - y0) * 0.015); } k.restore(); }
  g.fillStyle = 'rgba(14,8,40,0.35)'; g.fillRect(0, y0, w, h);
}
function paintPlates() {
  // 1. Lagos night over the lagoon, wide for panning
  plate('city', 3200, 1080, (g, ge, w, h) => {
    sky(g, w, h, [[0, '#0B0828'], [0.45, '#2A1460'], [0.62, '#7A2A7E'], [0.7, '#E2577A']]); stars(g, ge, w, 560, 500, 3);
    g.fillStyle = '#F6E7C8'; g.beginPath(); g.arc(2450, 190, 70, 0, 7); g.fill(); ge.fillStyle = '#FFE9C0'; ge.beginPath(); ge.arc(2450, 190, 74, 0, 7); ge.fill();
    clouds(g, w, 300, 9, 5, 'rgba(70,30,110,0.85)', 'rgba(255,120,160,0.55)');
    skyline(g, ge, w, 720, 7, '#3B1E6A', [NEON.violet, '#C9A2FF'], 0.8);
    skyline(g, ge, w, 760, 9, '#1A0F3A', [NEON.gold, NEON.cyan, '#FFE7A0'], 1.15, [[420, 420, 'VIBES', NEON.pink, 64], [1320, 470, 'BLUES', NEON.cyan, 58], [2180, 440, 'SUYA 24H', NEON.gold, 50], [2900, 460, 'LAGOS', NEON.pink, 66]]);
    // bridge with lamps across the lagoon
    g.fillStyle = '#120A2A'; g.fillRect(0, 760, w, 26); for (let x = 30; x < w; x += 120) { g.fillRect(x, 700, 6, 62); ge.fillStyle = NEON.gold; ge.beginPath(); ge.arc(x + 3, 700, 7, 0, 7); ge.fill(); g.fillStyle = '#FFE6A8'; g.beginPath(); g.arc(x + 3, 700, 5, 0, 7); g.fill(); g.fillStyle = '#120A2A'; }
    water(g, ge, g.canvas, ge.canvas, w, 786, h - 786);
  });
  // 2. rooftop at dusk
  plate('dusk', 2600, 1080, (g, ge, w, h) => {
    sky(g, w, h, [[0, '#2B1E5A'], [0.35, '#8A3A8C'], [0.6, '#F07A6A'], [0.75, '#FFC27A']]);
    g.fillStyle = '#FFD9A0'; g.beginPath(); g.arc(1700, 700, 150, 0, 7); g.fill(); ge.fillStyle = '#FFB070'; ge.beginPath(); ge.arc(1700, 700, 160, 0, 7); ge.fill();
    clouds(g, w, 220, 10, 11, 'rgba(120,50,120,0.8)', 'rgba(255,190,120,0.75)');
    skyline(g, ge, w, 830, 13, '#5A2A6A', ['#FFD79A', '#FFB86A'], 0.7);
    // palms and the rooftop edge
    for (const [x, s] of [[180, 1.1], [2350, 0.95], [980, 0.7]]) { g.save(); g.translate(x, 840); g.scale(s, s); g.strokeStyle = '#2A1030'; g.fillStyle = '#2A1030'; g.lineWidth = 18; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(26, -220, -10, -420); g.stroke();
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.45; g.beginPath(); g.moveTo(-10, -420); g.quadraticCurveTo(-10 + Math.cos(a) * 150, -440 + Math.sin(a) * 150, -10 + Math.cos(a) * 250, -420 + Math.sin(a) * 120 + 70); g.quadraticCurveTo(-10 + Math.cos(a) * 150, -420 + Math.sin(a) * 150 + 20, -10, -420); g.fill(); } g.restore(); }
    g.fillStyle = '#2A1434'; g.fillRect(0, 840, w, h); g.fillStyle = '#3F1F4C'; g.fillRect(0, 840, w, 14);
    for (let x = 0; x < w; x += 60) { g.fillStyle = '#1C0D24'; g.fillRect(x, 780, 8, 62); } g.fillRect(0, 778, w, 8);
    ge.fillStyle = '#FFB070'; ge.globalAlpha = 0.5; ge.fillRect(0, 840, w, 4); ge.globalAlpha = 1;
  });
  // 3. club: dark room, a stage arch with lights (beams are drawn live)
  plate('club', 2400, 1080, (g, ge, w, h) => {
    sky(g, w, h, [[0, '#090418'], [0.6, '#1E0A3A'], [1, '#2C0F4A']]);
    for (let i = 0; i < 9; i++) { const x = 120 + i * 270; g.fillStyle = '#140828'; g.fillRect(x, 0, 30, 520); ge.fillStyle = [NEON.pink, NEON.cyan, NEON.violet][i % 3]; ge.fillRect(x + 10, 0, 10, 500); g.fillStyle = ge.fillStyle; g.globalAlpha = 0.6; g.fillRect(x + 10, 0, 10, 500); g.globalAlpha = 1; }
    neonText(g, ge, 'VIBES & BLUES', w / 2, 140, 110, NEON.pink);
  });
  // 4. rainy street at night
  plate('rain', 2400, 1080, (g, ge, w, h) => {
    sky(g, w, h, [[0, '#060A1E'], [0.5, '#14224A'], [0.7, '#24386A']]);
    skyline(g, ge, w, 700, 17, '#0E1634', [NEON.cyan, '#9FE8FF', NEON.violet], 1.25, [[500, 420, 'OPEN', NEON.cyan, 60], [1500, 380, 'AGOGO BAR', NEON.gold, 54], [2100, 450, 'BLUES', NEON.violet, 56]]);
    g.fillStyle = '#0A0F24'; g.fillRect(0, 700, w, 30);
    water(g, ge, g.canvas, ge.canvas, w, 730, h - 730);
  });
  // 5. sunrise: a huge sun over clouds
  plate('dawn', 2400, 1080, (g, ge, w, h) => {
    sky(g, w, h, [[0, '#3A4FA0'], [0.4, '#E68AA0'], [0.62, '#FFC07A'], [0.8, '#FFE6B0']]);
    g.fillStyle = '#FFF2C8'; g.beginPath(); g.arc(1200, 640, 230, 0, 7); g.fill(); ge.fillStyle = '#FFE0A0'; ge.beginPath(); ge.arc(1200, 640, 240, 0, 7); ge.fill();
    clouds(g, w, 690, 14, 19, 'rgba(240,140,150,0.95)', 'rgba(255,230,180,0.95)'); clouds(g, w, 850, 12, 23, 'rgba(200,110,150,1)', 'rgba(255,200,160,0.9)');
  });
  // 6. above the clouds at night (rising)
  plate('high', 1920, 3240, (g, ge, w, h) => {
    sky(g, w, h, [[0, '#05031A'], [0.5, '#1E1258'], [0.85, '#6A2E86'], [1, '#C25A86']]); stars(g, ge, w, h * 0.7, 900, 29);
    for (let i = 0; i < 6; i++) clouds(g, w, 900 + i * 380, 7, 31 + i, 'rgba(90,50,140,0.9)', 'rgba(255,140,190,0.6)');
    skyline(g, ge, w, h, 37, '#1A0F3A', [NEON.gold, NEON.cyan], 0.9);
  });
}
function drawPlate(name, x, y, zoom = 1) { const p = PL[name]; zoom = Math.max(zoom, W / p.w, H / p.h);
  x = clamp(x, W / (2 * zoom) - W / 2, p.w - W / 2 - W / (2 * zoom)); y = clamp(y, H / (2 * zoom) - H / 2, p.h - H / 2 - H / (2 * zoom)); for (const [k, s] of [[c, p.col], [e, p.emi]]) { k.save(); k.translate(W / 2, H / 2); k.scale(zoom, zoom); k.translate(-W / 2 - x, -H / 2 - y); k.drawImage(s, 0, 0); k.restore(); } }

// ---------------- cels on both canvases: colour on COL, a black stamp on EMI so glow never bleeds through ----------------
function cel2(fn) { c.save(); fn(c); c.restore(); e.save(); e.filter = 'brightness(0)'; fn(e); e.restore(); }
const POSES = [
  { lsh: -2.5, lel: -0.5, rsh: 0.5, rel: 1.6, lhip: -0.25, lkn: 0.35, rhip: 0.1, rkn: -0.05, lean: 0.05 },
  { lsh: -0.5, lel: -1.6, rsh: 2.5, rel: 0.5, lhip: -0.1, lkn: 0.05, rhip: 0.25, rkn: -0.35, lean: -0.05 },
  { lsh: -1.3, lel: -1.2, rsh: 1.3, rel: 1.2, lhip: -0.3, lkn: 0.5, rhip: 0.3, rkn: -0.5, lean: 0, bob: 30 },
  { lsh: -2.8, lel: 0.2, rsh: 2.8, rel: -0.2, lhip: -0.18, lkn: 0.1, rhip: 0.18, rkn: -0.1, lean: 0, bob: -20 },
  { lsh: -0.9, lel: -0.8, rsh: 1.9, rel: 1.0, lhip: -0.05, lkn: 0.6, rhip: 0.35, rkn: -0.2, lean: 0.08, bob: 10 },
  { lsh: -0.3, lel: -0.2, rsh: 0.3, rel: 0.2, lhip: -0.06, lkn: 0, rhip: 0.06, rkn: 0, lean: 0 },
];
function poseAt(t, set) { const tq = q12(t), b = beatAt(tq), i = Math.max(0, b.i), A = POSES[set[i % set.length]], B = POSES[set[(i + 1) % set.length]], k = eio(clamp((b.f - 0.5) / 0.5)), p = {};
  for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) p[key] = lerp(A[key] ?? 0, B[key] ?? 0, k); p.bob = (p.bob || 0) + Math.sin(b.f * Math.PI) * -16; return p; }
function hero(x, y, s, o = {}) { cel2(k => { k.translate(x, y); k.scale(s, s); C80.bust(k, { turn: 0.3, ...o, blink: o.blink ?? blinkAt(o.t ?? 0) }); }); }
function heroHead(x, y, s, o = {}) { cel2(k => { k.translate(x, y); k.scale(s, s); C80.head(k, { turn: 0.3, ...o, blink: o.blink ?? blinkAt(o.t ?? 0) }); }); }
function dancer(x, y, s, t, set, o = {}) { cel2(k => { k.translate(x, y); k.scale(s, s); C80.body(k, poseAt(t, set), { turn: 0.25, expr: 'grin', ...o }); }); }
function blinkAt(t) { const p = (q8(t) % 3.7); return p > 3.55 ? 1 : 0; }
function backView(x, y, s, t, set = 'night', dance = false) { // seen from behind: jacket, curls, beard edge
  const P = C80.pal(set); const sway = dance ? Math.sin(q12(t) * Math.PI * 2 * TM.bpm / 120) * 0.05 : 0;
  cel2(k => { k.translate(x, y); k.rotate(sway); k.scale(s, s);
    const jk = () => C80.L(k, [[-70, 200], [-210, 230, -270, 330], [-250, 700], [250, 700], [270, 330, 210, 230], [70, 200]]); C80.cel(k, jk, P.jk, P.jkS, P.jkH, P.jkL, P, { d: 40 });
    k.strokeStyle = P.jkH; k.lineWidth = 3; k.beginPath(); k.moveTo(0, 230); k.lineTo(0, 700); k.stroke();
    const nk = () => C80.L(k, [[-60, 120], [-64, 230], [64, 230], [60, 120]]); C80.cel(k, nk, P.skin, P.skinS, null, P.skinL, P, { d: 20 });
    const hd = () => { k.ellipse(0, 0, 122, 140, 0, 0, 7); }; C80.cel(k, hd, P.hair, P.hairL, P.hairH, P.hairL, P, { d: 12 });
    const R = rng(5); k.save(); k.beginPath(); k.ellipse(0, 0, 122, 140, 0, 0, 7); k.clip(); for (let i = 0; i < 260; i++) { const xx = (R() - .5) * 250, yy = (R() - .5) * 280, r = 3 + R() * 3, a0 = R() * 6.28; k.strokeStyle = R() < clamp((Math.abs(xx) - 70) / 50) * 0.8 + (yy > 70 ? 0.4 : 0) ? P.grey : P.hairH; k.lineWidth = 2; k.beginPath(); k.arc(xx, yy, r, a0, a0 + 3.4); k.stroke(); } k.restore();
    for (const sd of [-1, 1]) { const ear = () => { k.ellipse(sd * 120, 10, 16, 30, 0, 0, 7); }; C80.cel(k, ear, P.skin, P.skinS, null, P.skinL, P, { d: 8 }); }
  });
}

// ---------------- light & effects (emissive) ----------------
function beams(t, cols, n = 6, a = 1) { e.save(); e.globalCompositeOperation = 'lighter'; e.globalAlpha = 0.55 * a;
  for (let i = 0; i < n; i++) { const x = (i + 0.5) * W / n, ang = Math.sin(t * 0.9 + i * 1.7) * 0.6, col = cols[i % cols.length], len = 1500;
    const gr = e.createLinearGradient(x, 0, x + Math.sin(ang) * len, len); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); e.fillStyle = gr;
    e.beginPath(); e.moveTo(x - 8, -10); e.lineTo(x + Math.sin(ang - 0.08) * len, Math.cos(ang - 0.08) * len); e.lineTo(x + Math.sin(ang + 0.08) * len, Math.cos(ang + 0.08) * len); e.lineTo(x + 8, -10); e.fill(); }
  e.restore(); }
function flare(x, y, r, col, a = 1) { for (const k of [e, c]) { k.save(); k.globalCompositeOperation = 'lighter'; k.globalAlpha = a * (k === c ? 0.6 : 1);
  const gr = k.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.2, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); k.fillStyle = gr; k.beginPath(); k.arc(x, y, r, 0, 7); k.fill();
  k.fillStyle = '#FFFFFF'; for (const [w2, h2, rot] of [[r * 2.4, 3, 0], [r * 1.2, 2, Math.PI / 2], [r * 0.9, 2, Math.PI / 4], [r * 0.9, 2, -Math.PI / 4]]) { k.save(); k.translate(x, y); k.rotate(rot); k.fillRect(-w2, -h2, w2 * 2, h2 * 2); k.restore(); }
  k.restore(); }
  e.save(); e.globalCompositeOperation = 'lighter'; e.globalAlpha = 0.35 * a; for (let i = 1; i <= 3; i++) { const gx = W / 2 + (W / 2 - x) * i * 0.5, gy = H / 2 + (H / 2 - y) * i * 0.5; e.strokeStyle = col; e.lineWidth = 3; e.beginPath(); for (let j = 0; j < 7; j++) { const an = j * Math.PI / 3; e.lineTo(gx + Math.cos(an) * 30 * i, gy + Math.sin(an) * 30 * i); } e.stroke(); } e.restore(); }
function radial(cx, cy, n, seed, col = '#FFFFFF', a = 1) { const R = rng(seed); for (const k of [c, e]) { k.save(); k.globalAlpha = a; k.fillStyle = col; for (let i = 0; i < n; i++) { const an = R() * 6.283, da = 0.006 + R() * 0.012, r0 = 300 + R() * 300;
  k.beginPath(); k.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); k.lineTo(cx + Math.cos(an - da) * 2400, cy + Math.sin(an - da) * 2400); k.lineTo(cx + Math.cos(an + da) * 2400, cy + Math.sin(an + da) * 2400); k.fill(); } k.restore(); } }
function vspeed(t, n, seed, col = 'rgba(255,255,255,0.8)') { const R = rng(seed); c.save(); c.fillStyle = col; for (let i = 0; i < n; i++) { const x = R() * W, len = 200 + R() * 500, y = ((R() * (H + len) + t * (900 + R() * 600)) % (H + len)) - len; c.fillRect(x, y, 2 + R() * 3, len); } c.restore(); }
function rain(t, n = 260) { const R = rng(41); for (const k of [c, e]) { k.save(); k.strokeStyle = k === c ? 'rgba(200,230,255,0.55)' : 'rgba(120,200,255,0.25)'; k.lineWidth = 2; k.beginPath();
  for (let i = 0; i < n; i++) { const x = R() * W, sp = 1400 + R() * 600, y = (R() * (H + 80) + t * sp) % (H + 80) - 40; k.moveTo(x, y); k.lineTo(x - 10, y + 40); } k.stroke(); k.restore(); } }
function bokeh(t, n, seed, cols) { const R = rng(seed); e.save(); e.globalCompositeOperation = 'lighter'; for (let i = 0; i < n; i++) { const x = (R() * W + t * 30 * (R() - .5)) % W, y = R() * H, r = 20 + R() * 60; e.globalAlpha = 0.25 + R() * 0.3; e.fillStyle = cols[i % cols.length]; e.beginPath(); e.arc(x, y, r, 0, 7); e.fill(); } e.restore(); }
function crowd(t, set, y0 = H, rows = 3, seed = 1) { const R = rng(seed), P = C80.pal(set);
  for (let r = rows - 1; r >= 0; r--) { const n = 8 + r * 3, sc = 1 - r * 0.2, yy = y0 - r * 60;
    for (let i = 0; i < n; i++) { const x = (i + 0.5 + (R() - .5) * 0.6) * W / n, ph = R() * 6.28, b = Math.sin(q12(t) * Math.PI * 2 * TM.bpm / 120 + ph) * 10 * sc - pulse(t) * 14 * sc;
      const col = r === 0 ? '#0A0614' : r === 1 ? '#1A0E30' : '#2A1848';
      for (const k of [c, e]) { k.fillStyle = k === e ? '#000' : col; k.beginPath(); k.arc(x, yy - 150 * sc + b, 44 * sc, 0, 7); k.fill(); k.beginPath(); k.ellipse(x, yy - 20 * sc + b, 70 * sc, 110 * sc, 0, Math.PI, 0); k.lineTo(x + 70 * sc, H); k.lineTo(x - 70 * sc, H); k.fill();
        if (R() > 0.35) { const sd = R() > .5 ? 1 : -1, up = 0.5 + 0.5 * Math.abs(Math.sin(q12(t) * 5.9 + ph)); k.strokeStyle = k.fillStyle; k.lineWidth = 22 * sc; k.lineCap = 'round'; k.beginPath(); k.moveTo(x + sd * 50 * sc, yy - 90 * sc + b); k.lineTo(x + sd * (80 + 30 * up) * sc, yy - (190 + 140 * up) * sc + b); k.stroke(); } }
      if (P.rim && r === 0) { c.strokeStyle = i % 2 ? P.rim : (P.rim2 || P.rim); c.lineWidth = 3; c.beginPath(); c.arc(x, yy - 150 * sc + b, 44 * sc, -2.4, -0.6); c.stroke(); } } } }
function disco(t, cols, y0 = 620) { // pseudo-3D light-up floor, tiles flash on the beat
  const b = beatAt(t), rows = 9, cols2 = 14;
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols2; q++) { const z0 = 1 + r * 0.55, z1 = z0 + 0.55, yA = y0 + 420 / z0 * 1.2 - 380, yB = y0 + 420 / z1 * 1.2 - 380;
    const xs = k => W / 2 + (q - cols2 / 2 + k) * 230 / (rows - r) * (1 + r * 0.05);
    const ya = H - (r) * 52, yb = H - (r + 1) * 52, w0 = 1 + (rows - r) * 0.22, w1 = 1 + (rows - r - 1) * 0.22, cx = W / 2;
    const xa0 = cx + (q - cols2 / 2) * 110 * w0, xa1 = cx + (q + 1 - cols2 / 2) * 110 * w0, xb0 = cx + (q - cols2 / 2) * 110 * w1, xb1 = cx + (q + 1 - cols2 / 2) * 110 * w1;
    const on = ((q * 7 + r * 3 + Math.max(0, b.i)) % 5) === 0, col = cols[(q + r + Math.max(0, b.i)) % cols.length];
    for (const k of [c, e]) { k.beginPath(); k.moveTo(xa0, ya); k.lineTo(xa1, ya); k.lineTo(xb1, yb); k.lineTo(xb0, yb); k.closePath(); k.fillStyle = on ? col : (k === c ? '#160A2A' : '#000'); if (k === e && on) k.globalAlpha = 0.6 * (0.4 + 0.6 * pulse(t, 4)); k.fill(); k.globalAlpha = 1; if (k === c) { k.strokeStyle = '#2A1650'; k.lineWidth = 2; k.stroke(); } } } }
function fireworks(t, seed, n = 5) { const R = rng(seed); e.save(); c.save(); e.globalCompositeOperation = 'lighter'; c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const period = 2.2 + R() * 1.2, off = R() * period, k = ((t + off) % period) / period, x = 200 + R() * (W - 400), y = 140 + R() * 360, col = [NEON.pink, NEON.cyan, NEON.gold, NEON.lime, NEON.violet][i % 5];
    if (k < 0.18) { const yy = lerp(H, y, k / 0.18); e.fillStyle = '#FFE9B0'; e.fillRect(x - 2, yy, 4, 30); continue; }
    const kk = (k - 0.18) / 0.82, rad = eout(kk) * (160 + R() * 100), a = 1 - kk;
    for (let j = 0; j < 36; j++) { const an = j * Math.PI / 18, px = x + Math.cos(an) * rad, py = y + Math.sin(an) * rad + kk * kk * 60;
      for (const g of [e, c]) { g.globalAlpha = a * (g === c ? 0.7 : 1); g.fillStyle = col; g.beginPath(); g.arc(px, py, 4, 0, 7); g.fill(); } } }
  e.restore(); c.restore(); }
function impact(t, t0) { // 2-frame inverted silhouette over radial lines
  const k = t - t0; if (k < 0 || k > 2 / 24) return false;
  c.fillStyle = '#FFF4E6'; c.fillRect(0, 0, W, H); radial(W / 2, H / 2, 140, 3, '#1A0A2A', 1); return true; }

// ---------------- titles & text ----------------
function chrome(s, x, y, size, k, opt = {}) { // heavy italic chrome title, glowing through the emissive layer, flickering on at 12 fps
  if (k <= 0) return; const on = k > 0.33 || (Math.floor(k * 12) % 2 === 0);
  if (!on) return;
  c.save(); c.font = `italic 900 ${size}px 'Barlow Condensed'`; c.textAlign = opt.align || 'center'; c.textBaseline = 'middle'; c.letterSpacing = (size * 0.02) + 'px';
  const gr = c.createLinearGradient(0, y - size * 0.5, 0, y + size * 0.5); gr.addColorStop(0, '#7FD8FF'); gr.addColorStop(0.46, '#FFFFFF'); gr.addColorStop(0.5, '#6A3AA8'); gr.addColorStop(0.75, '#FF5FA2'); gr.addColorStop(1, '#FFD36A');
  c.lineJoin = 'round'; c.lineWidth = size * 0.16; c.strokeStyle = opt.neon || NEON.pink; c.strokeText(s, x, y); c.lineWidth = size * 0.08; c.strokeStyle = '#1A0830'; c.strokeText(s, x, y); c.fillStyle = gr; c.fillText(s, x, y);
  // light sweep across the letters
  const sw = (k * 1.4) % 3; if (sw < 1) { c.globalCompositeOperation = 'source-atop'; const g2 = c.createLinearGradient(x - size * 4 + sw * size * 8, 0, x - size * 3 + sw * size * 8, 0); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(0.5, 'rgba(255,255,255,0.8)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g2; c.fillRect(x - size * 6, y - size, size * 12, size * 2); }
  c.restore();
  e.save(); e.font = c.font = `italic 900 ${size}px 'Barlow Condensed'`; e.textAlign = opt.align || 'center'; e.textBaseline = 'middle'; e.letterSpacing = (size * 0.02) + 'px'; e.lineWidth = size * 0.16; e.strokeStyle = opt.neon || NEON.pink; e.strokeText(s, x, y); e.restore();
  if (k < 0.6) flare(x + size * s.length * 0.22, y - size * 0.3, 80, '#FFFFFF', 1 - k / 0.6);
}
function sign(s, x, y, size, col, k = 1, flick = false) { if (k <= 0) return; if (flick && (Math.floor(k * 12) % 5 === 1) && k < 1) return; neonText(c, e, s, x, y, size, col); }

// ---------------- shots (each draws a full frame into COL + EMI) ----------------
const S = {
  cover(t) { const k = t; // crane down from the stars to the lagoon, title flickers on, hero reveal
    if (t < PLAN.cover.t1 - 5.5) { const cy = lerp(-200, 0, eio(clamp(k / 8))); drawPlate('city', 600 + k * 14, cy, 1.05 + 0.08 * clamp(k / 8)); }
    else { const kk = t - (PLAN.cover.t1 - 5.5); drawPlate('city', 1500 + kk * 10, 0, 1.15); hero(W * 0.5, H * 0.3 + (1 - eout(clamp(kk / 1.2))) * 200, 0.95, { set: 'night', expr: 'cool', t, turn: 0.2 }); }
    if (t < PLAN.cover.t1 - 5.5) chrome('GBEMIDEBE', W / 2, H * 0.42, 190, t - PLAN.cover.vibes + 0.2); else chrome('GBEMIDEBE', W * 0.2, H * 0.12, 96, t - (PLAN.cover.t1 - 5.5) + 0.4);
    if (t < PLAN.cover.t1 - 5.5) { c.save(); c.globalAlpha = pr(t, PLAN.cover.name - 0.2, 0.3); c.font = "italic 900 64px 'Barlow Condensed'"; c.fillStyle = '#FFE9A8'; c.textAlign = 'center'; c.fillText('METHEUES', W / 2, H * 0.56); c.font = "600 34px 'Barlow Semi Condensed'"; c.fillText('Vibes and Blues · Remix Version 2', W / 2, H * 0.62); c.restore(); }
    for (const sh of PLAN.cover.shouts) if (t > sh) { flare(W * 0.72, H * 0.2, 160 * (1 - pr(t, sh, 1.2)), NEON.pink, 1 - pr(t, sh, 1.2)); }
  },
  chain(t, k) { drawPlate('city', 2200, 0, 1.4); bokeh(t, 26, 3, [NEON.pink, NEON.cyan, NEON.gold]);
    cel2(g => { g.translate(W / 2, -220); g.scale(2.4, 2.4); C80.bust(g, { set: 'night', turn: 0.1, bottom: 700 }); });
    const sx = -400 + pr(k, 0.1, 1.2) * 2600; c.save(); c.globalCompositeOperation = 'lighter'; const gr = c.createLinearGradient(sx - 200, 0, sx + 200, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H); c.restore();
    flare(W * 0.42 + Math.sin(k * 3) * 40, H * 0.47, 70, '#FFFFFF', 0.8); sign('FRESH', W * 0.16, H * 0.2, 90, NEON.cyan, k * 2, true); sign('CLEAN', W * 0.84, H * 0.24, 80, NEON.pink, k * 2 - 0.6, true); },
  sweet(t, k) { drawPlate('dusk', 900 + k * 30, 0, 1.1); sign('SWEET 16', W * 0.74, H * 0.24, 110, NEON.pink, k * 2, true); hero(W * 0.36, H * 0.32, 0.9, { set: 'dusk', expr: 'smile', turn: 0.35, t }); },
  datguy(t, k) { drawPlate('city', 1800, -40, 1.0); radial(W / 2, H * 0.42, 90, 7, 'rgba(255,255,255,0.75)', 0.6); dancer(W / 2, H * 0.08 - pr(k, 0, 0.4) * 30, 0.78, t, [5, 3], { set: 'night', expr: 'cool' }); flare(W * 0.62, H * 0.12, 120, NEON.pink, 0.9); sign("I'M DAT GUY", W * 0.5, H * 0.86, 84, NEON.gold, k * 2); },
  nevrsee(t, k) { drawPlate('club', 600, 0, 1.0); beams(t, [NEON.pink, NEON.cyan], 5, 0.7);
    const R = rng(61); for (let i = 0; i < 7; i++) { const x = 160 + i * 270, y = H * (0.55 + (i % 2) * 0.12); for (const g of [c, e]) { g.fillStyle = g === c ? '#0B0618' : '#000'; g.beginPath(); g.arc(x, y, 92, 0, 7); g.fill(); g.beginPath(); g.ellipse(x, y + 220, 140, 180, 0, Math.PI, 0); g.fill(); }
      const op = pr(k, 0.15 + i * 0.06, 0.12); for (const sd of [-1, 1]) for (const g of [c, e]) { g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(x + sd * 28, y - 4, 14, 20 * op + 1, 0, 0, 7); g.fill(); } } },
  vibes(t, k) { drawPlate('city', 1200 + k * 20, 0, 1.2); for (let i = 0; i < 10; i++) { const a = k * 1.8 + i * 0.63, r = 260 + i * 22, x = W / 2 + Math.cos(a) * r, y = H * 0.42 + Math.sin(a) * r * 0.55; sign(i % 2 ? '♪' : '♫', x, y, 70, [NEON.pink, NEON.cyan, NEON.gold][i % 3]); }
    hero(W * 0.5, H * 0.3, 0.85, { set: 'night', expr: 'cool', turn: -0.3, t }); },
  mix(t, k) { drawPlate('city', 2600, 0, 1.2); for (let s = 0; s < 2; s++) { const col = s ? NEON.cyan : NEON.pink; for (const g of [c, e]) { g.save(); g.translate(W / 2 + (s ? 1 : -1) * 300 * (1 - eout(pr(k, 0.2, 1.4))), H * 0.45); g.rotate(k * 2.2 + s * Math.PI); g.strokeStyle = col; g.lineWidth = 18; g.lineCap = 'round'; g.beginPath(); for (let a = 0; a < 10; a += 0.15) g.lineTo(Math.cos(a) * a * 22, Math.sin(a) * a * 22); g.stroke(); g.restore(); } }
    sign('VIBES', W * 0.2, H * 0.2, 90, NEON.pink, k * 2); sign('+ BLUES', W * 0.8, H * 0.2, 90, NEON.cyan, k * 2 - 0.5); },
  cube(t, k) { drawPlate('rain', 900, 0, 1.05); const g0 = (g, col) => { g.save(); g.translate(W / 2, H * 0.44); g.rotate(-0.12); g.strokeStyle = col; g.lineWidth = 16; g.lineJoin = 'round'; g.strokeRect(-150, -150, 300, 300); g.beginPath(); g.moveTo(-150, -150); g.lineTo(-90, -210); g.lineTo(210, -210); g.lineTo(150, -150); g.moveTo(210, -210); g.lineTo(210, 90); g.lineTo(150, 150); g.stroke(); g.restore(); };
    g0(c, NEON.gold); g0(e, NEON.gold); const x = eout(pr(k, 0.35, 0.25)); if (x > 0) for (const g of [c, e]) { g.save(); g.strokeStyle = '#FF2A4A'; g.lineWidth = 34; g.lineCap = 'round'; g.beginPath(); g.moveTo(W / 2 - 240, H * 0.44 - 240); g.lineTo(W / 2 - 240 + 480 * x, H * 0.44 - 240 + 480 * x); g.stroke(); g.restore(); }
    sign('NO NEED!', W / 2, H * 0.84, 90, NEON.pink, k * 2 - 1); rain(t, 120); },
  supreme(t, k) { drawPlate('dusk', 1400, 0, 1.3); heroHead(W * 0.5, H * 0.46, 1.25, { set: 'dusk', expr: k > 0.5 ? 'wink' : 'smile', turn: 0.3, t }); flare(W * 0.62, H * 0.3, 140, NEON.gold, 1 - pr(k, 0.5, 1.2) * 0.6); chrome('SUPREME!', W * 0.5, H * 0.84, 120, k - 0.3, { neon: NEON.orange }); },
  rise(t, k) { const p = PL.high; const y = lerp(p.h - H, 0, eio(clamp(k / 4))); drawPlate('high', 0, y - (p.h - H) / 2 - 1080 + 1080, 1); vspeed(t, 60, 9); dancer(W / 2, H * 0.12, 0.7, t, [3, 3], { set: 'night', expr: 'grin' }); },
  drips(t, k) { drawPlate('city', 900, 0, 1.25); hero(W * 0.5, H * 0.3, 0.9, { set: 'night', expr: 'cool', t, turn: 0.25 });
    const by = ((k * 700) % (H + 400)) - 200; c.save(); c.globalCompositeOperation = 'source-atop'; c.globalAlpha = 0.35; const gr = c.createLinearGradient(0, by - 120, 0, by + 120); gr.addColorStop(0, 'rgba(54,231,255,0)'); gr.addColorStop(0.5, '#36E7FF'); gr.addColorStop(1, 'rgba(54,231,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, H); c.restore();
    const R = rng(71); for (let i = 0; i < 14; i++) { const x = R() * W, len = (100 + R() * 420) * eout(clamp(k / 1.5 - R() * 0.3)); for (const g of [c, e]) { g.fillStyle = [NEON.pink, NEON.cyan, NEON.violet][i % 3]; g.fillRect(x - 7, 0, 14, len); g.beginPath(); g.arc(x, len, 12, 0, 7); g.fill(); } } },
  comot(t, k) { drawPlate('club', 300 + k * 40, 0, 1.0); beams(t, [NEON.pink, NEON.cyan, NEON.violet], 7); disco(t, [NEON.pink, NEON.cyan, NEON.gold]); dancer(W / 2, H * 0.1, 0.66, t, [0, 1], { set: 'club' }); },
  lift(t, k) { drawPlate('club', 900, 0, 1.0); beams(t, [NEON.gold, NEON.pink], 6); flare(W / 2, H * 0.2, 260, NEON.gold, 0.8 + 0.2 * pulse(t)); crowd(t, 'club', H + 40, 3, 7); },
  deny(t, k, t0) { if (impact(t, t0)) return; drawPlate('city', 1600, -100, 1.6); radial(W / 2, H * 0.45, 120, 11, 'rgba(255,255,255,0.7)', 0.7);
    cel2(g => { g.translate(W / 2, H * 0.5 + 60); g.scale(3.2, 3.2); g.translate(0, 26); C80.head(g, { set: 'night', turn: 0.05, expr: 'cool', blink: 0 }); }); sign("YOU CAN'T DENY", W / 2, H * 0.12, 86, NEON.pink, k * 2); },
  carry(t, k, t0, v) { const set = ['club', 'dusk', 'night', 'club'][v % 4]; if (set === 'club') { drawPlate('club', 600 + k * 40, 0, 1); beams(t, [NEON.pink, NEON.cyan], 6); } else if (set === 'dusk') drawPlate('dusk', 800 + k * 30, 0, 1.05); else drawPlate('city', 1400 + k * 40, 0, 1.05);
    cel2(g => { g.translate(W / 2 - 170, H * 0.4 + Math.sin(q12(t) * 6) * 12); g.rotate(-Math.PI / 2 + 0.1); g.scale(0.52, 0.52); C80.body(g, POSES[3], { set: set === 'dusk' ? 'dusk' : set, expr: 'grin', turn: 0.3 }); });
    crowd(t, set === 'dusk' ? 'dusk' : 'club', H + 60, 3, 3 + v); },
  laya(t, k, t0, v) { if (impact(t, t0)) return; drawPlate(v % 2 ? 'dusk' : 'city', 1500, -60, 1.3); const p = pulse(t, 5);
    for (let i = 0; i < 3; i++) for (const g of [c, e]) { g.strokeStyle = [NEON.pink, NEON.cyan, NEON.gold][i]; g.lineWidth = 10 - i * 2; g.globalAlpha = 0.8; g.beginPath(); g.arc(W / 2, H * 0.78, 260 + i * 110 + p * 70, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.globalAlpha = 1; }
    hero(W / 2, H * 0.3 + p * 8, 0.9 * (1 + p * 0.03), { set: v % 2 ? 'dusk' : 'night', expr: 'shout', mouth: Math.floor(q8(t) * 8) % 2 ? 3 : 2, t }); sign('LAYA!', W * 0.18, H * 0.2, 110, NEON.gold, 1); },
  light(t, k, t0, v) { c.fillStyle = '#05020E'; c.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
    e.save(); e.globalCompositeOperation = 'lighter'; for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12 + k * 0.5, col = [NEON.pink, NEON.cyan, NEON.gold, NEON.violet][(i + v) % 4]; e.globalAlpha = 0.5; e.fillStyle = col; e.beginPath(); e.moveTo(W / 2, H * 0.5); e.lineTo(W / 2 + Math.cos(a) * 2200, H * 0.5 + Math.sin(a) * 2200); e.lineTo(W / 2 + Math.cos(a + 0.08) * 2200, H * 0.5 + Math.sin(a + 0.08) * 2200); e.fill(); } e.restore();
    flare(W / 2, H * 0.45, 340 + pulse(t) * 120, NEON.gold, 1); dancer(W / 2, H * 0.1, 0.68, t, [3, 2], { set: 'club', expr: 'grin' });
    chrome('LIGHT WAN!', W / 2, H * 0.84, 120, k, { neon: NEON.cyan }); },
  step(t, k, t0, v) { drawPlate('club', 1200, 0, 1); beams(t, [NEON.violet, NEON.pink], 5, 0.6); disco(t, [[NEON.pink, NEON.cyan, NEON.gold], [NEON.gold, NEON.orange, NEON.pink], [NEON.cyan, NEON.lime, NEON.violet], [NEON.pink, NEON.cyan, NEON.lime]][v % 4], 600);
    const b = beatAt(q12(t)), P = C80.pal('club');
    for (const [sd, ph] of [[-1, 0], [1, 1]]) { const up = Math.max(0, Math.sin((b.f + ph * 0.5 + (Math.max(0, b.i) % 2) * .5) * Math.PI)), x = W / 2 + sd * 200, y = H * 0.74 - up * 130;
      cel2(g => { const leg = () => C80.L(g, [[x - 60, -20], [x + 60, -20], [x + 60, y], [x - 60, y]]); C80.cel(g, leg, P.jeans, P.jeansS, null, P.jkL, P, { d: 20 }); const sh = () => { g.ellipse(x + sd * 30, y + 30, 130, 56, 0, 0, 7); }; C80.cel(g, sh, P.shoe, P.shoeS, null, P.jkL, P, { d: 12 }); g.fillStyle = P.jkS; g.fillRect(x + sd * 30 - 130, y + 62, 260, 12); }); }
    sign('STEP!', W * 0.16, H * 0.2, 100, NEON.lime, 1); sign('MAGỌ!', W * 0.84, H * 0.22, 100, NEON.pink, k * 2 - 0.6); },
  magoHold(t, k) { drawPlate('city', 2000 + k * 25, -30, 1.1); fireworks(t, 13, 4); dancer(W / 2, H * 0.1, 0.66, k > 0.2 ? 0.2 + t * 0.0001 : t, [3, 3], { set: 'night', expr: 'grin' }); chrome('MAGỌ!', W / 2, H * 0.84, 140, k, { neon: NEON.gold }); },
  ride(t, k) { drawPlate('city', 400 + k * 260, 0, 1); dancer(W * 0.5, H * 0.14, 0.62, t, [0, 2, 1, 2], { set: 'night' }); },
  fw(t, k) { drawPlate('city', 1600, -20, 1.0); fireworks(t, 21, 7); backView(W * 0.5, H * 0.52, 0.85, t, 'night', true); },
  danceClub(t, k) { drawPlate('club', 500 + k * 30, 0, 1); beams(t, [NEON.pink, NEON.cyan, NEON.gold], 8); disco(t, [NEON.pink, NEON.cyan, NEON.gold]); dancer(W / 2, H * 0.1, 0.62, t, [0, 2, 1, 4], { set: 'club' }); crowd(t, 'club', H + 140, 2, 17); },
  rooftop(t, k) { drawPlate('dusk', 600 + k * 50, 0, 1); dancer(W * 0.5, H * 0.08, 0.66, t, [4, 1, 0, 2], { set: 'dusk' }); },
  bend(t, k) { drawPlate('club', 1000, 0, 1); beams(t, [NEON.pink, NEON.violet], 5); disco(t, [NEON.pink, NEON.violet, NEON.cyan]); dancer(W / 2, H * 0.2, 0.64, t, [2, 4], { set: 'club', expr: 'grin' }); sign('Ó YÁ!', W * 0.18, H * 0.2, 110, NEON.gold, 1); },
  suya(t, k) { drawPlate('rain', 300, 0, 1.15); sign('SUYA', W * 0.76, H * 0.22, 130, NEON.gold, 1, true); hero(W * 0.36, H * 0.3, 0.88, { set: 'rain', expr: 'smile', blink: 1, turn: 0.35 }); sign('MO TI YÓ!', W * 0.74, H * 0.62, 90, NEON.pink, k * 2 - 0.5); },
  real(t, k) { drawPlate('city', 2900, 0, 1.2); hero(W * 0.36, H * 0.3, 0.88, { set: 'night', expr: 'cool', turn: 0.3, t }); const on = k > 0.4; if (on) { sign('REAL', W * 0.74, H * 0.42, 190, NEON.pink, k - 0.4, true); flare(W * 0.86, H * 0.32, 90, '#FFFFFF', 1 - pr(k, 0.4, 0.8)); } sign('NO BE CHINKO', W * 0.74, H * 0.66, 64, NEON.cyan, k * 2 - 1.4); },
  lowlow(t, k) { drawPlate('city', 600 + k * 60, 0, 1.15); hero(W * 0.5, H * 0.3, 0.88, { set: 'night', expr: 'cool', turn: 0.1, t, blink: 0 });
    cel2(g => { g.translate(W * 0.5 + 0.1 * 26 * 0.88, H * 0.3); g.scale(0.88, 0.88); g.fillStyle = '#0B0A14'; g.beginPath(); g.roundRect(-112, -62, 104, 58, 14); g.roundRect(14, -62, 104, 58, 14); g.fill(); g.fillRect(-10, -50, 26, 10); g.fillStyle = 'rgba(54,231,255,0.7)'; g.fillRect(-90, -54, 30, 8); g.fillRect(36, -54, 30, 8); });
    for (let i = 0; i < 3; i++) { const by = ((k * 420 + i * 380) % (H + 300)) - 150; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18; c.fillStyle = [NEON.pink, NEON.cyan, NEON.gold][i]; c.fillRect(0, by, W, 80); c.restore(); } },
  whisper(t, k) { drawPlate('rain', 1700, 0, 1.2); rain(t, 160); const R = rng(81);
    for (let i = 0; i < 5; i++) { const x = 220 + i * 370, y = H * 0.62 + (i % 2) * 40; for (const g of [c, e]) { g.fillStyle = g === c ? '#0A0E24' : '#000'; g.beginPath(); g.arc(x, y - 140, 70, 0, 7); g.fill(); g.beginPath(); g.ellipse(x, y + 60, 110, 170, 0, Math.PI, 0); g.lineTo(x + 110, H); g.lineTo(x - 110, H); g.fill(); g.fillStyle = NEON.violet; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(x + sd * 24, y - 146, 14, 6, sd * 0.3, 0, 7); g.fill(); } } }
    sign('DEM NO KNOW', W / 2, H * 0.14, 96, NEON.violet, k * 2); },
  giant(t, k) { drawPlate('dawn', 1100, -120, 1.1); flare(W * 0.5, H * 0.2, 300, NEON.gold, 0.9); cel2(g => { g.translate(W * 0.55, H * 0.12); g.scale(1.25, 1.25); C80.bust(g, { set: 'dawn', expr: 'cool', turn: -0.3, look: -0.8, bottom: 700 }); });
    for (let i = 0; i < 7; i++) { const x = 60 + i * 64, y = H * 0.94; for (const g of [c, e]) { g.fillStyle = g === c ? '#2A1430' : '#000'; g.beginPath(); g.arc(x, y - 44, 18, 0, 7); g.fill(); g.fillRect(x - 14, y - 26, 28, 40); } } sign('KÉRÉ-KÉRÉ', W * 0.2, H * 0.74, 72, NEON.pink, k * 2 - 0.4); },
  agogo(t, k) { drawPlate('rain', 1100, 0, 1.1); rain(t, 300); const b = beatAt(t), sw = Math.sin(q12(t) * 10.7) * 0.12 - pulse(t, 8) * 0.08;
    const bell = (g, len, mouth, glow) => { g.beginPath(); g.moveTo(0, -mouth * 0.22); g.lineTo(len, -mouth * 0.5); g.quadraticCurveTo(len + 26, 0, len, mouth * 0.5); g.lineTo(0, mouth * 0.22); g.closePath();
      if (glow) { g.fillStyle = '#FFB830'; g.fill(); return; } const gr = g.createLinearGradient(0, -mouth / 2, 0, mouth / 2); gr.addColorStop(0, '#FFF0B0'); gr.addColorStop(0.35, '#E0A63A'); gr.addColorStop(1, '#6A4410'); g.fillStyle = gr; g.fill(); g.lineWidth = 5; g.strokeStyle = '#3A2408'; g.stroke();
      g.fillStyle = '#2A1604'; g.beginPath(); g.ellipse(len + 6, 0, 12, mouth * 0.46, 0, 0, 7); g.fill(); };
    for (const g of [c, e]) { g.save(); g.translate(W * 0.42, H * 0.46); g.rotate(-0.15 + sw);
      g.save(); g.translate(0, -90); bell(g, 330, 210, g === e); g.restore(); g.save(); g.translate(40, 110); bell(g, 260, 160, g === e); g.restore();
      g.lineWidth = 18; g.lineCap = 'round'; g.strokeStyle = g === e ? '#FFB830' : '#8A5A18'; g.beginPath(); g.moveTo(0, -90); g.quadraticCurveTo(-150, 10, 40, 110); g.stroke(); g.restore(); }
    for (let i = 0; i < 3; i++) { const kk = (b.f + i / 3) % 1; e.strokeStyle = NEON.gold; e.lineWidth = 6 * (1 - kk); e.globalAlpha = 1 - kk; e.beginPath(); e.arc(W * 0.6, H * 0.46, 200 + kk * 600, 0, 7); e.stroke(); e.globalAlpha = 1; }
    sign('GOGO!', W * 0.82, H * 0.2, 110, NEON.gold, 1); sign('GOGO!', W * 0.84, H * 0.74, 100, NEON.gold, k - 0.5); },
  sun(t, k) { drawPlate('dawn', 0, 0, 1.0); const bl = pr(k, 0.9, 0.35); flare(W / 2, H * 0.58, 220 + bl * 160, NEON.gold, 0.45 + bl * 0.3);
    const hx = lerp(W / 2 - 40, W / 2 - 700, eout(bl)), hy = lerp(H * 0.6, H * 0.95, eout(bl)), P = C80.pal('dawn');
    cel2(g => { g.translate(hx, hy); g.rotate(-0.3 - bl * 0.6); const hand = () => { g.roundRect(-140, -40, 280, 300, 70); for (let i = 0; i < 4; i++) g.roundRect(-128 + i * 66, -230, 56, 220, 28); }; C80.cel(g, hand, '#2A1430', '#1A0C20', null, '#0C0610', P, { d: 16, norim: true }); });
    chrome('OÒRÙN MI!', W / 2, H * 0.16, 120, k - 0.9, { neon: NEON.orange }); },
  back(t, k) { const O = PLAN.outro, up = eio(clamp(k / 14)); drawPlate('city', 800, lerp(180, -180, up), 1.5);
    backView(W * 0.5, H * 0.62 + up * 420, 0.8, t, 'night', false);
    c.save(); c.globalAlpha = pr(k, 0.3, 0.5); c.font = "600 46px 'Barlow Semi Condensed'"; c.fillStyle = '#FFE9A8'; c.textAlign = 'center'; c.fillText('Vibes and Blues', W / 2, H * 0.2); c.restore();
    chrome('METHEUES MUSIC', W / 2, H * 0.34, 130, k - (O.music - O.t0), { neon: NEON.cyan });
    chrome('GIDDEM!!!', W / 2, H * 0.54, 200, k - (O.giddem - O.t0), { neon: NEON.pink });
    if (k > O.giddem - O.t0 + 1.4) { c.save(); c.font = "italic 900 54px 'Barlow Condensed'"; c.fillStyle = '#FFE9A8'; c.textAlign = 'right'; c.globalAlpha = Math.floor(k * 2) % 2 ? 1 : 0.85; c.fillText('TO BE CONTINUED…', W - 120, H - 190); c.restore(); }
  },
};

// ---------------- the film: shots from the song's plan ----------------
function chorus(t, at, v) { const a = at.map(x => x - 0.1), seq = ['carry', 'laya', 'light', 'step']; const i = Math.max(0, a.filter(x => t >= x).length - 1); return S[seq[i]](t, t - a[i], a[i], v); }
function shot(t) {
  const P = PLAN, v1 = P.v1.map(x => x - 0.1), v2 = P.v2.map(x => x - 0.1), idx = (arr) => Math.max(0, arr.filter(x => t >= x).length - 1);
  if (t < P.cover.t1) return S.cover(t);
  if (t < P.pre1[0] - 0.1) { const i = idx(v1); return S[['chain', 'sweet', 'datguy', 'nevrsee', 'vibes', 'mix', 'cube', 'supreme'][i]](t, t - Math.max(v1[i], P.cover.t1)); }
  if (t < P.ch1[0][0] - 0.1) { const a = P.pre1.map(x => x - 0.1), i = idx(a); return S[['rise', 'drips', 'comot', 'lift', 'deny'][i]](t, t - a[i], a[i]); }
  const endCh1 = P.tag1 ? P.tag1[0] - 0.1 : v2[0];
  if (t < endCh1) { const n = Math.max(0, P.ch1.filter(b => t >= b[0] - 0.15).length - 1); return chorus(t, P.ch1[n], n); }
  if (P.tag1 && t < P.tag1[1]) return S.magoHold(t, t - P.tag1[0] + 0.1);
  if (P.break1 && t < v2[0]) { const bar = 4 * 60 / TM.bpm, i = Math.floor((t - P.tag1[1]) / (2 * bar)), at = P.tag1[1] + i * 2 * bar; return S[['ride', 'fw', 'danceClub', 'rooftop', 'ride', 'fw', 'danceClub', 'rooftop'][i % 8]](t, t - at); }
  if (t < P.pre2[0] - 0.1) { const i = idx(v2); return S[['bend', 'suya', 'real', 'lowlow', 'whisper', 'giant', 'agogo', 'sun'][i]](t, t - v2[i]); }
  if (t < P.ch2[0][0] - 0.1) { const a = P.pre2.map(x => x - 0.1), i = idx(a); return S[['rise', 'drips', 'comot', 'lift', 'deny'][i]](t, t - a[i], a[i]); }
  const endCh2 = P.tag2 ? P.tag2[0] - 0.1 : P.outro.t0;
  if (t < endCh2) { const n = Math.max(0, P.ch2.filter(b => t >= b[0] - 0.15).length - 1); return chorus(t, P.ch2[n], n + 1); }
  if (P.tag2 && t < P.tag2[1]) return S.magoHold(t, t - P.tag2[0] + 0.1);
  if (P.break2 && t < P.outro.t0) return S.fw(t, t - P.break2[0]);
  return S.back(t, t - P.outro.t0);
}

// ---------------- subtitles on the tape ----------------
function subtitle(t) {
  const L = TM.lines; let cur = null;
  for (let i = 0; i < L.length; i++) { const end = Math.min((L[i + 1]?.t0 ?? 999) - 0.05, L[i].t1 + 0.8); if (t >= L[i].t0 - 0.1 && t < end) { cur = L[i]; break; } }
  if (!cur) return;
  c0.save(); c0.font = "600 54px 'Barlow Semi Condensed'"; c0.textAlign = 'center'; c0.lineJoin = 'round';
  c0.shadowColor = 'rgba(0,0,0,0.6)'; c0.shadowBlur = 10; c0.lineWidth = 10; c0.strokeStyle = '#1A0A24'; c0.strokeText(cur.text, W / 2, H - 96); c0.shadowBlur = 0;
  c0.fillStyle = '#FFF1B8'; c0.fillText(cur.text, W / 2, H - 96); c0.restore();
}

// ---------------- videotape + CRT pass ----------------
let SCAN, NOISE;
function buildPost() {
  const s = mk(4, 4), g = s.getContext('2d'); g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(0, 3, 4, 1); g.fillStyle = 'rgba(0,0,0,0.1)'; g.fillRect(0, 2, 4, 1); SCAN = c0.createPattern(s, 'repeat');
  const n = mk(256, 256), gn = n.getContext('2d'), im = gn.createImageData(256, 256), R = rng(99); for (let i = 0; i < im.data.length; i += 4) { const v = R() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 18; } gn.putImageData(im, 0, 0); NOISE = c0.createPattern(n, 'repeat');
}
function post(t) {
  c0.setTransform(1, 0, 0, 1, 0, 0); c0.globalAlpha = 1; c0.globalCompositeOperation = 'source-over'; c0.filter = 'none';
  c0.filter = 'saturate(1.12) contrast(1.05)'; c0.drawImage(COL, 0, 0); c0.filter = 'none';
  // chroma bleed: a faint horizontally shifted, blurred copy
  c0.save(); c0.globalCompositeOperation = 'screen'; c0.globalAlpha = 0.12; c0.filter = 'blur(2px)'; c0.drawImage(COL, 3, 0); c0.restore();
  // bloom from the emissive layer (downscaled blur), widest pass tinted red-orange (halation)
  sm.clearRect(0, 0, W / 4, H / 4); sm.filter = 'blur(3px)'; sm.drawImage(EMI, 0, 0, W / 4, H / 4); sm.filter = 'none';
  sm2.clearRect(0, 0, W / 8, H / 8); sm2.filter = 'blur(5px)'; sm2.drawImage(EMI, 0, 0, W / 8, H / 8); sm2.filter = 'none';
  c0.save(); c0.globalCompositeOperation = 'lighter'; c0.globalAlpha = 0.9; c0.drawImage(SMALL, 0, 0, W, H); c0.globalAlpha = 0.55; c0.filter = 'sepia(0.6) saturate(2) hue-rotate(-20deg)'; c0.drawImage(SMALL2, 0, 0, W, H); c0.filter = 'none'; c0.globalAlpha = 0.5; c0.drawImage(EMI, 0, 0); c0.restore();
  subtitle(t);
  // scanlines, signal noise, darkened corners
  c0.fillStyle = SCAN; c0.fillRect(0, 0, W, H);
  c0.save(); const off = Math.floor(t * 24) * 37 % 256; c0.translate(-off, -(off * 3) % 256); c0.fillStyle = NOISE; c0.fillRect(0, 0, W + 256, H + 256); c0.restore();
  const v = c0.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)'); c0.fillStyle = v; c0.fillRect(0, 0, W, H);
  // power-on at the start, tracking noise before verse 2, tape runs out to blue at the end
  if (t < 0.8) { const k = t / 0.8; const img = c0.getImageData(0, 0, 1, 1); c0.fillStyle = '#000'; c0.fillRect(0, 0, W, H); if (k > 0.25) { const hh = Math.max(4, H * eout((k - 0.25) / 0.75)); c0.drawImage(cv, 0, 0); c0.fillStyle = '#000'; c0.fillRect(0, 0, W, (H - hh) / 2); c0.fillRect(0, (H + hh) / 2, W, H); } else { c0.fillStyle = '#FFFFFF'; c0.fillRect(W / 2 - 400 * k * 4, H / 2 - 2, 800 * k * 4, 4); } }
  const v2 = PLAN.v2[0] - 0.1; if (t > v2 - 0.6 && t < v2) { const R = rng(Math.floor(t * 24)); for (let i = 0; i < 9; i++) { const y = R() * H, h = 6 + R() * 40; c0.drawImage(cv, 0, y, W, h, (R() - .5) * 120, y, W, h); c0.fillStyle = `rgba(255,255,255,${R() * 0.3})`; c0.fillRect(0, y, W, 2); } }
  const end = TM.duration; if (t > end - 2.2) { const k = pr(t, end - 2.2, 0.3); c0.fillStyle = `rgba(30,50,220,${k})`; c0.fillRect(0, 0, W, H); if (k >= 1) { c0.font = "600 54px 'Barlow Semi Condensed'"; c0.fillStyle = '#FFFFFF'; c0.textAlign = 'left'; c0.fillText('■ STOP', 110, 130); } }
}

function render(t) {
  t = clamp(t, 0, TM.duration - 1e-3);
  for (const k of [c, e]) { k.setTransform(1, 0, 0, 1, 0, 0); k.globalAlpha = 1; k.globalCompositeOperation = 'source-over'; k.filter = 'none'; }
  c.fillStyle = '#05020E'; c.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  shot(t);
  post(t);
}
window.render = render;
fetch('timing.json').then(r => r.json()).then(j => { TM = j; PLAN = j.plan; BEATS = j.beats; window.DUR = j.duration; })
  .then(() => Promise.all(["italic 900 80px 'Barlow Condensed'", "600 54px 'Barlow Semi Condensed'", "800 54px 'Barlow Semi Condensed'"].map(f => document.fonts.load(f, 'GBEMIDEBE ọ́ẹ̀ṣ'))))
  .then(() => document.fonts.ready).then(() => { paintPlates(); buildPost(); render(0); window.READY = true; });
})();
