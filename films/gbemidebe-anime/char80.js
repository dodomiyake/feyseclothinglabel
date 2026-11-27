// Metheues as an 80s cel-anime hero, drawn in code from the reference photo:
// short natural curls with grey at the sides, full salt-and-pepper beard (greyest at the chin), calm heavy-lidded eyes,
// black leather bomber (quilted shoulders, ribbed collar), black tee, silver figaro chain.
// Cel rules: flat fills, hard shadow/highlight crescents, coloured outlines (never pure black), a neon rim light.
'use strict';
const C80 = (() => {
  // ---------- colour models: one daylight model, other lighting sets derived per material ----------
  const BASE = {
    skin: '#8A5638', skinS: '#5C3524', skinH: '#A86E4C', skinL: '#2C140C',
    hair: '#1E1624', hairH: '#4B3A5E', hairL: '#10081A', grey: '#CFC8D6',
    beard: '#2E272C', beardS: '#1C171B', beardL: '#120D11',
    eyeW: '#F3ECE2', iris: '#3B2216', lip: '#6E3A2C', lipS: '#4A2219', lipH: '#9A5A44',
    jk: '#1C1C27', jkS: '#0F0F17', jkH: '#555872', jkL: '#07070C', tee: '#26262F', teeS: '#17171E',
    chain: '#EDEFF5', chainL: '#6B7184', jeans: '#232838', jeansS: '#151927', shoe: '#ECE8E2', shoeS: '#B9B2AA',
  };
  const mul = (hex, t, k = 1) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
    const f = (v, tv) => Math.round(Math.min(255, v * lerp(1, tv / 255, k))); const tn = parseInt(t.slice(1), 16);
    return '#' + [f(r, tn >> 16), f(g, tn >> 8 & 255), f(b, tn & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); };
  // set: { tint (lit), shade (shadow tint), rim, light: [dx,dy] } — skin keeps its own, gentler tint so faces never turn pink
  const SETS = {
    day: { tint: '#FFFFFF', shade: '#FFFFFF', rim: null, light: [-1, -0.7], k: 0 },
    night: { tint: '#B9B4E8', shade: '#8A7FD0', rim: '#FF3EA5', rim2: '#36E7FF', light: [-1, -0.5], k: 1 },
    dusk: { tint: '#FFC79A', shade: '#C88AA8', rim: '#FFB347', rim2: '#FF6F91', light: [1, -0.4], k: 1 },
    club: { tint: '#C7A8FF', shade: '#7A5AD0', rim: '#36E7FF', rim2: '#FF3EA5', light: [-1, -0.8], k: 1 },
    rain: { tint: '#A9C4E0', shade: '#6F7FB0', rim: '#7FE0FF', rim2: '#B78CFF', light: [0.6, -1], k: 1 },
    dawn: { tint: '#FFE0B8', shade: '#D6A0A0', rim: '#FFD27A', rim2: '#FF9A62', light: [1, -0.6], k: 1 },
  };
  function pal(name) {
    const S = SETS[name] || SETS.day, p = {};
    for (const [k, v] of Object.entries(BASE)) {
      const skinish = /^(skin|lip)/.test(k), shadowish = /S$/.test(k) && k !== 'S';
      p[k] = mul(v, shadowish ? S.shade : S.tint, S.k * (skinish ? 0.45 : 1));
    }
    p.rim = S.rim; p.rim2 = S.rim2; p.light = S.light; return p;
  }

  // ---------- cel helpers: shapes add sub-paths (no beginPath inside) ----------
  const L = (c, pts) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) c.quadraticCurveTo(p[0], p[1], p[2], p[3]); else if (p.length === 6) c.bezierCurveTo(...p); else c.lineTo(p[0], p[1]); } c.closePath(); };
  function crescent(c, shape, dx, dy, color) { // shape − (shape shifted by dx,dy), filled flat
    c.save(); c.beginPath(); shape(); c.clip(); c.beginPath(); shape(); c.translate(dx, dy); shape(); c.translate(-dx, -dy); c.fillStyle = color; c.fill('evenodd'); c.restore(); }
  function cel(c, shape, f, s, h, line, P, o = {}) {
    const [lx, ly] = P.light, n = Math.hypot(lx, ly), ux = lx / n, uy = ly / n, d = o.d ?? 14, dh = o.dh ?? 7, lw = o.lw ?? 3;
    c.beginPath(); shape(); c.fillStyle = f; c.fill();
    if (s) crescent(c, shape, ux * d, uy * d, s);          // shadow on the side away from the light
    if (h) crescent(c, shape, -ux * dh, -uy * dh, h);      // highlight on the lit side
    if (P.rim && !o.norim) crescent(c, shape, (o.rimDir ?? 1) * -4, 1, o.rimC || P.rim); // neon rim on the far edge
    if (line) { c.beginPath(); shape(); c.lineWidth = lw; c.strokeStyle = line; c.lineJoin = 'round'; c.stroke(); }
  }
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }

  // ---------- head (units: face ~230 wide, eyes y≈-30, chin y≈+170); turn: -1..1 (3/4 when |turn|≈0.35) ----------
  // o: { set, turn, expr: 'cool'|'smile'|'grin'|'shout'|'wink', mouth: 0..3 (lip flap shape), blink, look }
  function head(c, o = {}) {
    const P = pal(o.set || 'day'), tn = o.turn ?? 0.3, ex = o.expr || 'cool', R = rng(11);
    const X = x => (x < 0 ? x * (1 - 0.28 * Math.max(0, tn)) * (1 + 0.1 * Math.max(0, -tn)) : x * (1 - 0.28 * Math.max(0, -tn)) * (1 + 0.1 * Math.max(0, tn))) + tn * 26;
    const fx = tn * 34; // feature centre
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // neck
    const neck = () => L(c, [[X(-66), 100], [X(-70), 250], [X(72), 250], [X(68), 100]]);
    cel(c, neck, P.skin, P.skinS, null, P.skinL, P, { d: 40, norim: true });
    c.save(); c.beginPath(); neck(); c.clip(); c.fillStyle = P.skinS; c.beginPath(); c.ellipse(X(0), 112, 110, 46, 0, 0, 7); c.fill(); c.restore();
    // far ear / near ear
    for (const s of [-1, 1]) { const ear = () => { c.ellipse(X(s * 118), -14, 18, 32, s * 0.12, 0, 7); }; cel(c, ear, P.skin, P.skinS, null, P.skinL, P, { d: 8, norim: s < 0 }); }
    // face: egg with cheekbones, soft-point chin (the beard covers the jaw)
    const face = () => L(c, [[X(-96), -122], [X(-116), -72, X(-118), -8], [X(-114), 66, X(-82), 128], [X(-40), 172, X(0), 176], [X(40), 172, X(82), 128], [X(114), 66, X(118), -8], [X(116), -72, X(96), -122], [X(0), -140, X(-96), -122]]);
    cel(c, face, P.skin, P.skinS, P.skinH, P.skinL, P, { d: 22, dh: 9, lw: 3.2 });
    // cheekbone turn on the far side (3/4 construction)
    c.save(); c.beginPath(); face(); c.clip(); c.fillStyle = P.skinS; c.beginPath(); L(c, [[X(tn > 0 ? -120 : 120), -40], [X(tn > 0 ? -92 : 92), 0], [X(tn > 0 ? -104 : 104), 60], [X(tn > 0 ? -140 : 140), 60]]); c.fill(); c.restore();
    // hair: short natural curls, straight hairline with slight temple corners; dark under-layer, angel ring
    const hair = () => { const pts = [[X(-112), -78]]; for (let i = 0; i <= 24; i++) { const a = Math.PI * (1.02 + 0.96 * i / 24), r = 1 + (i % 2 ? 0.045 : -0.02); pts.push([X(Math.cos(a) * 128 * r), -96 + Math.sin(a) * 108 * r]); } pts.push([X(112), -78], [X(84), -104], [X(40), -110], [X(-40), -110], [X(-84), -104]); L(c, pts); };
    cel(c, hair, P.hair, P.hairL, P.hairH, P.hairL, P, { d: 10, dh: 5, lw: 3 });
    c.save(); c.beginPath(); hair(); c.clip();
    for (let i = 0; i < 300; i++) { const x = (R() - .5) * 260, y = -212 + R() * 130, side = Math.max(0, Math.min(1, (Math.abs(x) - 70) / 46)), r = 3 + R() * 3, a0 = R() * 6.28;
      c.strokeStyle = R() < side * 0.85 ? P.grey : P.hairH; c.lineWidth = 2; c.beginPath(); c.arc(X(x), y, r, a0, a0 + 3.4); c.stroke(); }
    // angel ring: a zigzag-edged highlight band across the crown
    c.fillStyle = P.hairH; c.globalAlpha = 0.85; c.beginPath(); c.moveTo(X(-96), -170); for (let i = 0; i <= 12; i++) c.lineTo(X(-96 + i * 16), -176 - (i % 2) * 10); for (let i = 12; i >= 0; i--) c.lineTo(X(-96 + i * 16), -158 + (i % 2) * 8); c.fill(); c.globalAlpha = 1;
    c.restore();
    // brows: thick, straight, slightly lowered
    const lift = ex === 'shout' ? 10 : ex === 'smile' || ex === 'grin' ? 4 : 0;
    c.fillStyle = P.hairL;
    for (const s of [-1, 1]) { const far = (s < 0) === (tn > 0), sc = far ? 0.8 : 1; c.beginPath(); L(c, [[fx + s * 18, -66 - lift], [fx + s * 52 * sc, -74 - lift, fx + s * 88 * sc, -68 - lift], [fx + s * 92 * sc, -58 - lift], [fx + s * 54 * sc, -62 - lift, fx + s * 18, -54 - lift]]); c.fill(); }
    // eyes: almond, heavy upper lash line flicking out, tall oval iris with two highlights
    const bl = Math.max(0, Math.min(1, o.blink || 0));
    for (const s of [-1, 1]) {
      const far = (s < 0) === (tn > 0), sc = far ? 0.78 : 1, exx = fx + s * 54 * sc, ey = -30, w = 30 * sc, wink = ex === 'wink' && s > 0;
      if (wink || bl > 0.7) { c.strokeStyle = P.skinL; c.lineWidth = 5; c.beginPath(); c.moveTo(exx - w, ey); c.quadraticCurveTo(exx, ey + 8, exx + w, ey - 2); c.stroke(); continue; }
      const op = (ex === 'shout' ? 1.25 : 0.82) * (1 - bl);
      c.save(); c.beginPath(); L(c, [[exx - w, ey + 2], [exx - w * .2, ey - 20 * op, exx + w, ey - 6], [exx + w * .2, ey + 12 * op, exx - w, ey + 2]]); c.fillStyle = P.eyeW; c.fill(); c.clip();
      const ix = exx + (o.look || 0) * 7 + tn * 4;
      c.fillStyle = P.iris; c.beginPath(); c.ellipse(ix, ey - 2, 11 * sc, 15, 0, 0, 7); c.fill();
      c.fillStyle = '#120806'; c.beginPath(); c.ellipse(ix, ey - 2, 5.5 * sc, 8, 0, 0, 7); c.fill();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ix - 4, ey - 8, 4, 0, 7); c.fill(); c.beginPath(); c.arc(ix + 4, ey + 4, 2, 0, 7); c.fill();
      c.fillStyle = 'rgba(40,20,10,0.35)'; c.fillRect(exx - w, ey - 22, w * 2, 9); // lid shadow on the eyeball
      c.restore();
      c.strokeStyle = P.hairL; c.lineWidth = 6.5; c.beginPath(); c.moveTo(exx - w - 2, ey + 2); c.quadraticCurveTo(exx - w * .2, ey - 22 * op - 2, exx + w + 4 * s, ey - 8); c.stroke();
      c.lineWidth = 3; c.beginPath(); c.moveTo(exx + w * .6 * s, ey - 6 - (s > 0 ? 2 : 0)); c.lineTo(exx + (w + 10) * s, ey - 14); c.stroke(); // outward flick
      c.strokeStyle = P.skinL; c.lineWidth = 2; c.beginPath(); c.moveTo(exx - w * .6, ey + 11); c.quadraticCurveTo(exx, ey + 14, exx + w * .6, ey + 9); c.stroke();
    }
    // nose: shadow plane on the far side + one stroke + broad nostrils
    c.fillStyle = P.skinS; c.beginPath(); L(c, [[fx - 6 * Math.sign(tn || 1), -20], [fx + 22 * Math.sign(tn || 1), 34], [fx + 34 * Math.sign(tn || 1), 46], [fx - 4, 48]]); c.fill();
    c.strokeStyle = P.skinL; c.lineWidth = 3; c.beginPath(); c.moveTo(fx - 24, 40); c.quadraticCurveTo(fx - 30, 52, fx - 14, 54); c.moveTo(fx + 24, 40); c.quadraticCurveTo(fx + 34, 52, fx + 16, 54); c.stroke();
    c.fillStyle = P.skinL; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(fx + s * 14, 51, 7, 3.5, 0, 0, 7); c.fill(); }
    c.fillStyle = P.skinH; c.beginPath(); c.ellipse(fx - 8, 36, 7, 4, 0, 0, 7); c.fill();
    // beard: full, from the sideburns round the jaw; moustache joins it; greyest at the chin
    const beard = () => L(c, [[X(-122), -20], [X(-128), 90, X(-92), 160], [X(-52), 222, X(0), 232], [X(52), 222, X(92), 160], [X(128), 90, X(122), -20], [X(112), 40, X(96), 70], [X(70), 94, fx + 50, 74], [fx + 26, 62, fx, 66], [fx - 26, 62, fx - 50, 74], [X(-70), 94, X(-96), 70], [X(-112), 40, X(-122), -20]]);
    cel(c, beard, P.beard, P.beardS, null, P.beardL, P, { d: 18, lw: 3 });
    c.save(); c.beginPath(); beard(); c.clip(); c.lineWidth = 1.6;
    for (let i = 0; i < 1500; i++) { const x = (R() - .5) * 270, y = -20 + R() * 260, chin = Math.exp(-((x - fx * .6) ** 2) / 6500 - ((y - 180) ** 2) / 4600);
      if (R() > 0.22 + 0.62 * chin) continue; const r = 1.6 + R() * 2.2, a0 = R() * 6.28;
      c.globalAlpha = 0.55 + 0.4 * R(); c.strokeStyle = R() < 0.78 ? P.grey : P.hairH; c.beginPath(); c.arc(X(x), y, r, a0, a0 + 1.6 + R()); c.stroke(); }
    c.globalAlpha = 1; c.restore();
    // mouth: full lips; 4 lip-flap shapes
    const my = 104, m = o.mouth ?? (ex === 'shout' ? 3 : ex === 'grin' ? 2 : ex === 'smile' ? 1 : 0);
    if (m === 0) {
      const lips = () => L(c, [[fx - 32, my], [fx - 12, my - 12, fx, my - 7], [fx + 12, my - 12, fx + 32, my - 1], [fx + 14, my + 17, fx - 4, my + 16], [fx - 22, my + 14, fx - 32, my]]);
      cel(c, lips, P.lip, P.lipS, P.lipH, P.skinL, P, { d: 5, dh: 3, lw: 2.5, norim: true });
      c.strokeStyle = P.skinL; c.lineWidth = 3; c.beginPath(); c.moveTo(fx - 30, my + 1); c.quadraticCurveTo(fx, my + 4, fx + 30, my - 2); c.stroke();
    } else {
      const open = [0, 10, 18, 32][m];
      c.beginPath(); L(c, [[fx - 34, my - 3], [fx, my - 11, fx + 34, my - 3], [fx + 22, my + open * 1.3, fx, my + open * 1.25], [fx - 22, my + open * 1.3, fx - 34, my - 3]]);
      c.fillStyle = '#3A1010'; c.fill(); c.strokeStyle = P.skinL; c.lineWidth = 3; c.stroke();
      if (m < 3) { c.fillStyle = '#F4EEE6'; c.beginPath(); L(c, [[fx - 28, my - 3], [fx, my - 8, fx + 28, my - 3], [fx, my + 6, fx - 28, my - 3]]); c.fill(); }
      else { c.fillStyle = '#B04A4A'; c.beginPath(); c.ellipse(fx, my + 30, 16, 8, 0, 0, 7); c.fill(); }
    }
    c.restore();
  }

  // ---------- bust: leather bomber, tee, chain ----------
  function torso(c, P, bottom = 820, hem = 296) {
    const jk = () => L(c, [[-60, 206], [-200, 232, -262, 320], [-hem, bottom], [hem, bottom], [262, 320, 200, 232], [60, 206]]);
    cel(c, jk, P.jk, P.jkS, P.jkH, P.jkL, P, { d: 40, dh: 12, lw: 3.5 });
    c.save(); c.beginPath(); jk(); c.clip();
    // quilted shoulder panels and leather specular streaks
    c.strokeStyle = P.jkH; c.globalAlpha = 0.5; c.lineWidth = 2;
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(s * (150 + i * 22), 230); c.lineTo(s * (230 + i * 22), 320); c.moveTo(s * (240 - i * 22), 236); c.lineTo(s * (160 - i * 22), 320); c.stroke(); }
    c.globalAlpha = 0.7; c.lineWidth = 6; for (const [x0, x1] of [[-220, -200], [-150, -136], [176, 160]]) { c.beginPath(); c.moveTo(x0, 330); c.quadraticCurveTo(x0 + 16, 520, x1, bottom); c.stroke(); }
    c.globalAlpha = 1; c.restore();
    const tee = () => L(c, [[-62, 210], [-90, 300, -76, bottom], [76, bottom], [90, 300, 62, 210]]);
    cel(c, tee, P.tee, P.teeS, null, P.jkL, P, { d: 16, norim: true });
    for (const s of [-1, 1]) { c.strokeStyle = '#B8A26A'; c.lineWidth = 3; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(s * 90, 300); c.lineTo(s * 80, bottom); c.stroke(); c.setLineDash([]); }
    for (const s of [-1, 1]) { const col = () => L(c, [[s * 58, 196], [s * 124, 208, s * 142, 256], [s * 98, 300], [s * 72, 246, s * 52, 232]]);
      cel(c, col, P.jk, P.jkS, null, P.jkL, P, { d: 10, norim: s < 0 });
      c.save(); c.beginPath(); col(); c.clip(); c.strokeStyle = P.jkH; c.globalAlpha = 0.6; c.lineWidth = 1.6; for (let i = 0; i < 12; i++) { c.beginPath(); c.moveTo(s * 48, 200 + i * 9); c.lineTo(s * 146, 216 + i * 9); c.stroke(); } c.restore(); }
    // silver figaro chain
    for (let i = 0; i <= 26; i++) { const a = Math.PI * (0.08 + 0.84 * i / 26), x = -Math.cos(a) * 64, y = 214 + Math.sin(a) * 60, long = i % 4 === 0;
      c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); c.beginPath(); c.ellipse(0, 0, long ? 9 : 5, 3.5, 0, 0, 7); c.fillStyle = P.chain; c.fill(); c.lineWidth = 1.5; c.strokeStyle = P.chainL; c.stroke(); c.restore(); }
  }
  function bust(c, o = {}) { const P = pal(o.set || 'day'); c.save(); torso(c, P, o.bottom || 820); head(c, o); c.restore(); }

  // ---------- full body; angles in radians, 0 = pointing down; left limbs outward with negative angles ----------
  function body(c, pose = {}, o = {}) {
    const P = pal(o.set || 'day'), g = (k, d) => pose[k] ?? d;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round'; c.translate(0, g('bob', 0)); c.rotate(g('lean', 0));
    const seg = (x, y, a1, a2, l1, l2) => { const x1 = x + Math.sin(a1) * l1, y1 = y + Math.cos(a1) * l1; return [x1, y1, x1 + Math.sin(a1 + a2) * l2, y1 + Math.cos(a1 + a2) * l2]; };
    const tube = (pts, w, f, line) => { for (const [ww, col] of [[w + 7, line], [w, f]]) { c.strokeStyle = col; c.lineWidth = ww; c.beginPath(); c.moveTo(pts[0], pts[1]); c.lineTo(pts[2], pts[3]); c.lineTo(pts[4], pts[5]); c.stroke(); } };
    const hand = (x, y) => { const h = () => { c.ellipse(x, y, 30, 34, 0, 0, 7); }; cel(c, h, P.skin, P.skinS, P.skinH, P.skinL, P, { d: 10, dh: 5 }); };
    const shoe = (x, y, s) => { const sh = () => { c.ellipse(x + s * 18, y + 6, 52, 22, 0, 0, 7); }; cel(c, sh, P.shoe, P.shoeS, null, P.jkL, P, { d: 10 }); c.fillStyle = P.jkS; c.fillRect(x + s * 18 - 52, y + 18, 104, 7); };
    for (const [x, hip, kn, s] of [[-50, g('lhip', 0.08), g('lkn', -0.05), -1], [50, g('rhip', -0.08), g('rkn', 0.05), 1]]) {
      const [x1, y1, x2, y2] = seg(x, 560, hip, kn, 190, 190); tube([x, 560, x1, y1, x2, y2], 68, P.jeans, P.jkL);
      c.strokeStyle = P.jeansS; c.lineWidth = 20; c.beginPath(); c.moveTo(x + 18 * s, 580); c.lineTo(x1 + 18 * s, y1); c.lineTo(x2 + 16 * s, y2); c.stroke(); shoe(x2, y2, s); }
    const arm = (x, sh, el, s) => { const [x1, y1, x2, y2] = seg(x, 300, sh, el, 150, 140); tube([x, 300, x1, y1, x2, y2], 70, P.jk, P.jkL);
      c.strokeStyle = P.jkH; c.lineWidth = 6; c.beginPath(); c.moveTo(x - 18 * s, 310); c.lineTo(x1 - 18 * s, y1); c.stroke();
      if (P.rim) { c.strokeStyle = s > 0 ? P.rim : (P.rim2 || P.rim); c.lineWidth = 4; c.beginPath(); c.moveTo(x + 30 * s, 300); c.lineTo(x1 + 30 * s, y1); c.lineTo(x2 + 28 * s, y2); c.stroke(); }
      hand(x2, y2); };
    arm(-176, g('lsh', 0.25), g('lel', -0.3), -1);
    c.save(); torso(c, P, 580, 214); c.restore();
    c.save(); c.translate(g('hx', 0), -6); c.scale(0.92, 0.92); head(c, o); c.restore();
    arm(176, g('rsh', -0.25), g('rel', 0.3), 1);
    c.restore();
  }
  const lerp = (a, b, k) => a + (b - a) * k;
  return { pal, SETS, cel, crescent, L, head, bust, body, rng };
})();
