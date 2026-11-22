// Metheues as a manga character, drawn in code from the reference photo:
// short twists on top with grey at the temples, full salt-and-pepper beard (greyest at the chin),
// calm heavy-lidded eyes and straight brows, black leather bomber with ribbed collar, black tee, silver figaro chain.
// Black-and-white manga rendering: dark skin is a mid screentone, never paper white.
'use strict';
const CH = (() => {
  const INK = '#111', PAPER = '#F4F0E6';
  let TONE = {};
  function tones(ctx) {
    const mk = (r, sp, col = INK) => { const c = document.createElement('canvas'); c.width = c.height = sp; const g = c.getContext('2d');
      g.fillStyle = col; for (const [x, y] of [[sp / 2, sp / 2], [0, 0], [sp, 0], [0, sp], [sp, sp]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
      const p = ctx.createPattern(c, 'repeat'); p.setTransform(new DOMMatrix().rotate(45)); return p; };
    TONE = { light: mk(1.05, 7), skin: mk(1.75, 7), mid: mk(2.3, 7), dark: mk(2.9, 7), white: mk(1.4, 7, '#fff') };
    return TONE;
  }
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
  const P = (c, pts, close = true) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) c.quadraticCurveTo(p[0], p[1], p[2], p[3]); else if (p.length === 6) c.bezierCurveTo(...p); else c.lineTo(p[0], p[1]); } if (close) c.closePath(); };
  function skin(c, path, lw = 5) { path(); c.fillStyle = PAPER; c.fill(); path(); c.fillStyle = TONE.skin; c.fill(); path(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }

  // ---------- head (local units: face ~250 wide, eyes at y≈-24, chin at y≈+160) ----------
  // o: { expr: 'cool'|'smile'|'shout'|'wink'|'grin', look: -1..1 (eyes), turn: -1..1 (head yaw), blink: 0..1, seed }
  function curls(c, clip, n, R, area, density, col, len = [2.5, 5]) {
    c.save(); clip(); c.clip(); c.strokeStyle = col; c.lineWidth = 1.7;
    for (let i = 0; i < n; i++) {
      const x = lerp(area[0], area[2], R()), y = lerp(area[1], area[3], R());
      if (R() > density(x, y)) continue;
      const r = len[0] + R() * (len[1] - len[0]), a0 = R() * 6.28;
      c.beginPath(); c.arc(x, y, r, a0, a0 + 1.4 + R() * 1.2); c.stroke();
    }
    c.restore();
  }
  function head(c, o = {}) {
    const expr = o.expr || 'cool', turn = o.turn || 0, look = o.look || 0, R = rng(o.seed || 7);
    const fx = turn * 22;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = INK;
    // neck (thick)
    skin(c, () => P(c, [[-74, 100], [-80, 236], [80, 236], [74, 100]]));
    c.save(); P(c, [[-74, 100], [-80, 236], [80, 236], [74, 100]]); c.clip(); c.fillStyle = TONE.dark; c.fillRect(-90, 100, 180, 70); c.restore();
    // ears
    for (const s of [-1, 1]) { const ex = s * (126 - s * turn * 10); skin(c, () => { c.beginPath(); c.ellipse(ex, -12, 22, 36, s * 0.15, 0, 7); }, 4.5);
      c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.arc(ex - s * 3, -12, 12, s > 0 ? -1.2 : 1.9, s > 0 ? 1.2 : 4.4); c.stroke(); }
    // face: broad and full, rounded cheeks
    const face = () => P(c, [[-100 + fx * .3, -108], [-122 + fx * .4, -70, -126, -10], [-132, 50, -112, 104], [-80, 158, 0 + fx, 178], [80, 158, 112, 104], [132, 50, 126, -10], [122 + fx * .4, -70, 100 + fx * .3, -108], [0, -126, -100 + fx * .3, -108]]);
    skin(c, face, 5.5);
    c.save(); face(); c.clip(); c.fillStyle = TONE.mid; P(c, [[78 + fx, -130], [150, -130], [150, 200], [40 + fx, 200], [100 + fx, 40]]); c.fill();
    c.fillStyle = TONE.light; c.globalAlpha = 0.9; c.beginPath(); c.ellipse(-60 + fx, -84, 40, 16, -0.1, 0, 7); c.fillStyle = PAPER; c.globalAlpha = 0.35; c.fill(); c.globalAlpha = 1; c.restore();
    // hair: short twists, flat-ish top, faded grey sides
    const bumps = [];
    for (let i = 0; i <= 22; i++) { const k = i / 22, ang = Math.PI * (1.04 + 0.92 * k), r = 1 + 0.035 * Math.sin(i * 2.7);
      bumps.push([Math.cos(ang) * 124 * r, -100 + Math.sin(ang) * 104 * r + (i % 2 ? 4 : -4)]); }
    const hair = () => { c.beginPath(); c.moveTo(-114, -86); for (const [x, y] of bumps) c.lineTo(x, y); c.lineTo(114, -86); c.quadraticCurveTo(60, -116, 0, -120); c.quadraticCurveTo(-60, -116, -114, -86); c.closePath(); };
    hair(); c.fillStyle = INK; c.fill();
    c.save(); hair(); c.clip(); c.strokeStyle = 'rgba(255,255,255,0.62)'; c.lineWidth = 1.7;
    for (let row = 0; row < 7; row++) for (let col = 0; col < 16; col++) { // tight coiled twists in rows
      const x = -112 + col * 15 + (row % 2) * 7 + (R() - .5) * 4, y = -124 - row * 12 - (1 - (x / 124) ** 2) * 30 + (R() - .5) * 4;
      c.beginPath(); c.moveTo(x - 3, y + 5); c.quadraticCurveTo(x + 4, y + 2, x - 1, y - 1); c.quadraticCurveTo(x - 5, y - 4, x + 2, y - 7); c.stroke(); }
    c.restore();
    curls(c, hair, 260, R, [-130, -150, 130, -86], (x, y) => clamp((Math.abs(x) - 72) / 46, 0, 1) * 0.95, 'rgba(255,255,255,0.9)', [1.8, 3.2]);
    // sideburns
    for (const s of [-1, 1]) { P(c, [[s * 110, -92], [s * 128, -30], [s * 126, 20], [s * 106, 10], [s * 104, -80]]); c.fillStyle = INK; c.fill(); }
    curls(c, () => { for (const s of [-1, 1]) P(c, [[s * 110, -92], [s * 128, -30], [s * 126, 20], [s * 106, 10], [s * 104, -80]]); }, 70, R, [-130, -92, 130, 20], () => 0.7, 'rgba(255,255,255,0.85)', [1.6, 3]);
    // brows: thick, straight, slightly lowered
    c.fillStyle = INK;
    const lift = expr === 'shout' ? 12 : expr === 'smile' || expr === 'grin' ? 5 : 0;
    for (const s of [-1, 1]) { P(c, [[fx + s * 20, -62 - lift], [fx + s * 52, -70 - lift, fx + s * 90, -64 - lift], [fx + s * 94, -52 - lift], [fx + s * 54, -58 - lift, fx + s * 20, -50 - lift]]); c.fill(); }
    // eyes: calm, heavy-lidded
    const bl = clamp(o.blink || 0, 0, 1);
    for (const s of [-1, 1]) {
      const ex = fx + s * 56, ey = -26, wink = expr === 'wink' && s > 0;
      c.strokeStyle = INK;
      if (wink || bl > 0.85) { c.beginPath(); c.moveTo(ex - 28, ey); c.quadraticCurveTo(ex, ey + 9, ex + 28, ey); c.lineWidth = 6; c.stroke(); continue; }
      const open = (expr === 'shout' ? 1.2 : 0.78) * (1 - bl);
      c.save(); P(c, [[ex - 30, ey], [ex - 8, ey - 20 * open, ex + 30, ey - 4], [ex + 8, ey + 13 * open, ex - 30, ey]]); c.fillStyle = '#fff'; c.fill(); c.clip();
      c.fillStyle = INK; c.beginPath(); c.arc(ex + look * 8, ey - 1, 13, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(ex + look * 8 - 5, ey - 6, 4.5, 0, 7); c.fill(); c.restore();
      c.beginPath(); c.moveTo(ex - 33, ey + 1); c.quadraticCurveTo(ex - 6, ey - 23 * open - 3, ex + 33, ey - 5); c.lineWidth = 7; c.stroke();
      c.beginPath(); c.moveTo(ex - 22, ey + 10); c.quadraticCurveTo(ex, ey + 13, ex + 20, ey + 7); c.lineWidth = 2.4; c.stroke();
    }
    // nose: broad, rounded tip, wide nostril wings
    c.strokeStyle = INK; c.lineWidth = 4;
    c.save(); c.fillStyle = TONE.mid; c.beginPath(); c.ellipse(fx + 10, 36, 34, 16, 0, 0, 7); c.fill(); c.restore();
    c.beginPath(); c.moveTo(fx - 6, -8); c.quadraticCurveTo(fx - 14, 22, fx - 10, 30); c.stroke();
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(fx + s * 20, 22); c.quadraticCurveTo(fx + s * 50, 26, fx + s * 42, 50); c.quadraticCurveTo(fx + s * 30, 58, fx + s * 18, 52); c.lineWidth = 4.5; c.stroke();
      c.fillStyle = INK; c.beginPath(); c.ellipse(fx + s * 17, 50, 9, 5, s * 0.2, 0, 7); c.fill(); }
    // beard: full, from the sideburns round the jaw; moustache joins it
    const beard = () => P(c, [[-128, 4], [-134, 100, -98, 168], [-56, 224, 0 + fx, 232], [56, 224, 98, 168], [134, 100, 128, 4], [114, 50, 98, 78], [72, 96, fx + 54, 74], [fx + 30, 62, fx, 66], [fx - 30, 62, fx - 54, 74], [-72, 96, -98, 78], [-114, 50, -128, 4]]);
    beard(); c.fillStyle = INK; c.fill();
    curls(c, beard, 1100, R, [-136, 0, 136, 234], (x, y) => 0.22 + 0.75 * Math.exp(-((x - fx) ** 2) / 5200 - ((y - 175) ** 2) / 3200) + 0.25 * clamp((y - 100) / 120, 0, 1) * clamp((Math.abs(x) - 50) / 70, 0, 1), 'rgba(255,255,255,0.82)', [2, 4.2]);
    // mouth
    const my = 108;
    if (expr === 'shout' || expr === 'grin' || expr === 'smile') {
      const open = expr === 'shout' ? 34 : expr === 'grin' ? 16 : 10;
      P(c, [[fx - 36, my - 4], [fx, my - 10, fx + 36, my - 4], [fx + 22, my + open * 1.3, fx, my + open * 1.25], [fx - 22, my + open * 1.3, fx - 36, my - 4]]);
      c.fillStyle = INK; c.fill();
      if (expr !== 'shout') { P(c, [[fx - 30, my - 3], [fx, my - 8, fx + 30, my - 3], [fx, my + 7, fx - 30, my - 3]]); c.fillStyle = '#fff'; c.fill(); }
    } else {
      P(c, [[fx - 34, my], [fx - 12, my - 12, fx, my - 7], [fx + 12, my - 12, fx + 34, my - 2], [fx + 14, my + 16, fx - 4, my + 15], [fx - 24, my + 14, fx - 34, my]]);
      c.fillStyle = PAPER; c.fill(); c.fillStyle = TONE.dark; c.fill(); c.strokeStyle = INK; c.lineWidth = 3.5; c.stroke();
      c.beginPath(); c.moveTo(fx - 32, my + 1); c.quadraticCurveTo(fx, my + 4, fx + 34, my - 3); c.lineWidth = 4; c.stroke();
    }
    c.strokeStyle = INK; c.lineWidth = 5.5; face(); c.stroke();
    c.restore();
  }

  // ---------- bust: jacket, tee, chain ----------
  function bust(c, o = {}) {
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // jacket body
    const jk = () => P(c, [[-60, 210], [-190, 250, -250, 330], [-290, 820], [290, 820], [250, 330, 190, 250], [60, 210]]);
    jk(); c.fillStyle = INK; c.fill();
    // leather shine: soft white streaks
    c.save(); jk(); c.clip(); c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 5;
    for (const [x0, y0, x1, y1] of [[-210, 300, -170, 470], [-150, 270, -120, 470], [190, 300, 160, 470], [230, 340, 220, 470]]) { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + 12, (y0 + y1) / 2, x1, y1); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 2; for (let i = 0; i < 10; i++) { c.beginPath(); c.moveTo(-250 + i * 50, 480); c.lineTo(-240 + i * 52, 380); c.stroke(); }
    c.restore();
    // tee (dark screentone so it separates from the jacket)
    P(c, [[-62, 212], [-90, 300, -76, 820], [76, 820], [90, 300, 62, 212]]); c.fillStyle = '#2a2a28'; c.fill(); c.fillStyle = TONE.white; c.globalAlpha = 0.25; c.fill(); c.globalAlpha = 1;
    // ribbed stand collar
    for (const s of [-1, 1]) { P(c, [[s * 58, 200], [s * 120, 214, s * 138, 260], [s * 96, 300], [s * 70, 250, s * 52, 236]]); c.fillStyle = INK; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2;
      c.save(); c.clip(); c.strokeStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 10; i++) { c.beginPath(); c.moveTo(s * 50, 204 + i * 10); c.lineTo(s * 140, 222 + i * 10); c.stroke(); } c.restore(); }
    // zipper lines
    for (const s of [-1, 1]) { c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 3; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(s * 92, 300); c.quadraticCurveTo(s * 86, 500, s * 80, 820); c.stroke(); c.setLineDash([]); }
    // silver figaro chain: links along a U
    const R = rng(3), N = 26;
    for (let i = 0; i <= N; i++) { const k = i / N, a = Math.PI * (0.08 + 0.84 * k), x = -Math.cos(a) * 66, y = 216 + Math.sin(a) * 62, long = i % 4 === 0;
      c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.beginPath(); c.ellipse(0, 0, long ? 9 : 5, 3.6, 0, 0, 7); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke(); c.restore(); }
    c.restore();
    head(c, o);
  }

  // ---------- full body (for dance shots); angles in radians, 0 = pointing down ----------
  // pose: { lsh, lel, rsh, rel, lhip, lkn, rhip, rkn, lean, bob, hx }
  function body(c, pose = {}, o = {}) {
    const g = (k, d) => pose[k] ?? d;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.translate(0, g('bob', 0)); c.rotate(g('lean', 0)); c.strokeStyle = INK;
    const seg = (x, y, a1, a2, l1, l2) => { const x1 = x + Math.sin(a1) * l1, y1 = y + Math.cos(a1) * l1; return [x1, y1, x1 + Math.sin(a1 + a2) * l2, y1 + Math.cos(a1 + a2) * l2]; };
    const stroke2 = (pts, w, fill) => { for (const [ww, col] of [[w + 12, INK], [w, fill]]) { c.strokeStyle = col; c.lineWidth = ww; c.beginPath(); c.moveTo(pts[0], pts[1]); c.lineTo(pts[2], pts[3]); c.lineTo(pts[4], pts[5]); c.stroke(); } };
    const hand = (x, y) => { c.beginPath(); c.arc(x, y, 28, 0, 7); c.fillStyle = PAPER; c.fill(); c.fillStyle = TONE.skin; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); };
    const shoe = (x, y, s) => { c.save(); c.translate(x, y); c.scale(s, 1); c.beginPath(); c.ellipse(18, 6, 48, 22, 0, 0, 7); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.moveTo(-26, 14); c.lineTo(62, 14); c.lineWidth = 4; c.stroke(); c.restore(); };
    // legs
    for (const [x, hip, kn, s] of [[-48, g('lhip', 0.08), g('lkn', -0.05), -1], [48, g('rhip', -0.08), g('rkn', 0.05), 1]]) {
      const [x1, y1, x2, y2] = seg(x, 560, hip, kn, 190, 190); stroke2([x, 560, x1, y1, x2, y2], 64, '#222220'); shoe(x2, y2, s); }
    // back arm (behind the torso)
    const arm = (x, sh, el) => { const [x1, y1, x2, y2] = seg(x, 300, sh, el, 150, 140); stroke2([x, 300, x1, y1, x2, y2], 66, INK);
      c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 4; c.beginPath(); c.moveTo(x + (x1 - x) * .2, 300 + (y1 - 300) * .2); c.lineTo(x + (x1 - x) * .8, 300 + (y1 - 300) * .8); c.stroke();
      hand(x2, y2); };
    arm(-170, g('lsh', 0.25), g('lel', -0.3));
    // torso: jacket to the hips with a ribbed hem, tee under, chain
    const jk = () => P(c, [[-70, 200], [-170, 230, -196, 300], [-184, 570], [184, 570], [196, 300, 170, 230], [70, 200]]);
    jk(); c.fillStyle = INK; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
    c.save(); jk(); c.clip(); c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 5;
    for (const [x0, x1] of [[-160, -140], [-120, -104], [150, 136]]) { c.beginPath(); c.moveTo(x0, 280); c.quadraticCurveTo(x0 + 14, 420, x1, 540); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2; for (let i = 0; i < 20; i++) { c.beginPath(); c.moveTo(-190 + i * 20, 536); c.lineTo(-190 + i * 20, 570); c.stroke(); }
    c.restore();
    P(c, [[-66, 204], [-84, 300, -64, 540], [64, 540], [84, 300, 66, 204]]); c.fillStyle = '#2a2a28'; c.fill();
    for (const s of [-1, 1]) { c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 3; c.setLineDash([5, 5]); c.beginPath(); c.moveTo(s * 80, 290); c.lineTo(s * 72, 540); c.stroke(); c.setLineDash([]); }
    for (const s of [-1, 1]) { P(c, [[s * 64, 196], [s * 120, 206, s * 136, 250], [s * 96, 286], [s * 72, 240, s * 56, 228]]); c.fillStyle = INK; c.fill(); }
    for (let i = 0; i <= 22; i++) { const a = Math.PI * (0.1 + 0.8 * i / 22), x = -Math.cos(a) * 62, y = 212 + Math.sin(a) * 56;
      c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.beginPath(); c.ellipse(0, 0, i % 4 === 0 ? 9 : 5, 3.6, 0, 0, 7); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = INK; c.stroke(); c.restore(); }
    c.save(); c.translate(g('hx', 0), -6); c.scale(0.92, 0.92); head(c, o); c.restore();
    arm(170, g('rsh', -0.25), g('rel', 0.3));
    c.restore();
  }
  const lerp = (a, b, k) => a + (b - a) * k, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  return { tones, head, bust, body, rng, P, INK, PAPER, get TONE() { return TONE; } };
})();
