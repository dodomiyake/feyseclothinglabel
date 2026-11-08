// NERSI explainer — Caption News style · 1920×1080 · 45 s · window.render(t) is deterministic
'use strict';
(() => {
const W = 1920, H = 1080, DUR = 45, BEAT = 0.5;
const IVORY = '#F7F5EF', HONEY = '#FFC21A', INK = '#0E0E0C', RED = '#FF4A3D', GREY = '#8D8B83', DIM = '#5E5C55', CARD = '#151512';
const SRC = 'fmhapr.gov.ng/nersi · official programme page';
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const pr = (t, a, d) => clamp((t - a) / d);
const eout = k => 1 - Math.pow(1 - k, 3);
const eio = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const back = k => { const c = 1.6; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const F = (w, s) => `${w} ${s}px IT`;

// ---------------- timeline (single source of truth) ----------------
// captions: big line with '|' chunks and one {keyword}; small line = the spoken line
const CAPS = [
  { t0: 0.9, t1: 3.5, big: 'A government | {grant}', en: '₦50,000. A grant you never pay back.' },
  { t0: 3.5, t1: 7.5, big: 'For {poor and vulnerable} | homes', en: "It's called NERSI: relief for poor and vulnerable households." },
  { t0: 7.5, t1: 11.5, big: 'Chosen from the | {Social Register}', en: 'Beneficiaries come from the National Social Register, paid in phases.' },
  { t0: 12.0, t1: 14.0, big: 'So how do you | {apply}?', en: 'So how do you apply?' },
  { t0: 14.0, t1: 16.5, big: 'You {don’t}.', en: "You don't. You cannot apply…" },
  { t0: 16.5, t1: 18.5, big: 'No one can | {sell you a place}', en: '…and no one can sell you a place on the list.' },
  { t0: 18.5, t1: 22.0, big: 'Selected? You get | an {SMS}', en: 'If you are selected, your provider sends you an SMS.' },
  { t0: 22.0, t1: 25.5, big: 'Accept, and get | {₦50,000}', en: 'Accept, and ₦50,000 lands in your wallet.' },
  { t0: 25.5, t1: 32.5, big: 'Check by | {dialling a code}', en: "To check, dial any provider's code and choose ‘Check eligibility’." },
  { t0: 32.5, t1: 35.5, big: 'It’s {free}.', en: "It's free. Never pay anyone…" },
  { t0: 35.5, t1: 38.0, big: 'Never share your | {PIN or OTP}', en: '…and never share your PIN or OTP.' },
  { t0: 38.5, t1: 45.0, big: 'Not sure? | {Call first}.', en: 'Not sure? Call the help line before you do anything.' },
];
// narration (TTS text spells numbers; start times on the grid)
const VOICE = [
  { id: 1, t: 0.3, say: 'Fifty thousand naira. A grant you never pay back.' },
  { id: 2, t: 3.6, say: "It's called NERSI: relief for poor and vulnerable households." },
  { id: 3, t: 7.6, say: 'Beneficiaries come from the National Social Register, paid in phases.' },
  { id: 4, t: 12.4, say: 'So how do you apply?' },
  { id: 5, t: 14.02, say: "You don't. You cannot apply, and no one can sell you a place on the list." },
  { id: 6, t: 18.6, say: 'If you are selected, your provider sends you an SMS.' },
  { id: 7, t: 22.1, say: 'Accept, and fifty thousand naira lands in your wallet.' },
  { id: 8, t: 25.7, say: "To check, dial any provider's code, and choose: check eligibility." },
  { id: 9, t: 32.6, say: "It's free. Never pay anyone, and never share your PIN or OTP." },
  { id: 10, t: 38.7, say: 'Not sure? Call the help line before you do anything.' },
];
const SILENCES = [[12.0, 12.4], [38.05, 38.5]];
const SHOTS = [
  { t0: 0, t1: 3.0, f: shotHook },
  { t0: 3.0, t1: 7.5, f: shotDocHero },
  { t0: 7.5, t1: 12.0, f: shotRegister },
  { t0: 12.0, t1: 14.0, f: shotQuestion },
  { t0: 14.0, t1: 18.5, f: shotDocKnow },
  { t0: 18.5, t1: 25.5, f: shotSteps },
  { t0: 25.5, t1: 32.5, f: shotCodes },
  { t0: 32.5, t1: 38.5, f: shotSafe },
  { t0: 38.5, t1: 45.01, f: shotHelp },
];
const PROVIDERS = [
  ['ALAT', 'Wema Bank', '*945*23#'], ['MoMo', 'MoMo PSB', '*671*0#'], ['NairaGram', 'Mobile wallet', '*726*00#'],
  ['OPay', 'Mobile money', '*955*20#'], ['Moniepoint', 'Microfinance bank', '*5573*27#'],
];

// ---------------- assets ----------------
const IMG = {}, BOX = {}; let NOOVL = false;
function load(name) { return new Promise(r => { const i = new Image(); i.onload = () => { IMG[name] = i; r(); }; i.onerror = () => r(); i.src = 'src/' + name + '.png'; }); }

// ---------------- drawing helpers ----------------
function txt(s, x, y, font, color, align = 'left', ls = 0) { ctx.font = font; ctx.letterSpacing = ls + 'px'; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y); ctx.letterSpacing = '0px'; ctx.textAlign = 'left'; }
function tw(s, font, ls = 0) { ctx.font = font; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }
function ledger(t, t0, push = 0.028) {
  const k = clamp((t - t0) / 6);
  ctx.save(); ctx.fillStyle = CARD; ctx.fillRect(0, 0, W, H);
  ctx.translate(W / 2, H / 2); ctx.scale(1 + push * k, 1 + push * k); ctx.translate(-W / 2, -H / 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.045)'; ctx.lineWidth = 1.5;
  for (let y = 54; y < H + 60; y += 54) { ctx.beginPath(); ctx.moveTo(-40, y); ctx.lineTo(W + 40, y); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,74,61,0.45)'; ctx.lineWidth = 2;
  for (const x of [78, 86]) { ctx.beginPath(); ctx.moveTo(x, -40); ctx.lineTo(x, H + 40); ctx.stroke(); }
  ctx.restore();
}
function slideIn(t, t0) { const k = eout(pr(t, t0, 0.18)); return (1 - k) * 380; }
function streaks(t, t0) { const k = pr(t, t0, 0.18); if (k <= 0 || k >= 1) return; ctx.save(); ctx.globalAlpha = (1 - k) * 0.5; ctx.fillStyle = IVORY; for (let i = 0; i < 9; i++) { const y = 80 + i * 110 + (i * 37 % 50); ctx.fillRect(W - 900 * k - 200, y, 600 * (1 - k) + 60, 3); } ctx.restore(); }
function gradients(light) {
  let g = ctx.createLinearGradient(0, light ? 820 : 560, 0, H); g.addColorStop(0, 'rgba(8,8,6,0)'); g.addColorStop(1, 'rgba(8,8,6,0.84)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createRadialGradient(0, H, 0, 0, H, 900); g.addColorStop(0, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  g = ctx.createLinearGradient(0, 0, 0, 200); g.addColorStop(0, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 200);
}
function bug(t) {
  if (NOOVL) return;
  const h = 46, x = 96, y = 52, a = 'RELIEF BRIEF', w = tw(a, F(900, 24), 2) + 32;
  ctx.fillStyle = HONEY; ctx.fillRect(x, y, w, h); txt(a, x + 16, y + 32, F(900, 24), INK, 'left', 2);
  txt('NERSI  ·  ₦50,000 GRANT', x + w + 18, y + 32, F(800, 22), IVORY, 'left', 3);
}
function sourceTag(t, t0) {
  if (NOOVL) return;
  const k = eout(pr(t, t0, 0.2)); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = k; ctx.translate(-30 * (1 - k), 0);
  const x = 96, y = 108, h = 36, w1 = tw('SOURCE', F(900, 18), 2) + 24, w2 = tw(SRC, F(500, 19), 0.5) + 28;
  ctx.fillStyle = IVORY; ctx.fillRect(x, y, w1, h); txt('SOURCE', x + 12, y + 25, F(900, 18), INK, 'left', 2);
  ctx.fillStyle = 'rgba(20,20,18,0.88)'; ctx.fillRect(x + w1, y, w2, h); txt(SRC, x + w1 + 14, y + 25, F(500, 19), IVORY, 'left', 0.5);
  ctx.restore();
}
function credit(s) { ctx.font = F(500, 19); const w = ctx.measureText(s).width + 24; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(W - 96 - w, 52, w, 34); txt(s, W - 96 - w + 12, 76, F(500, 19), IVORY); }
// fixed-width number cells so counters never jitter
function num(s, x, y, size, color, cell = 0.62) {
  ctx.font = F(900, size); ctx.fillStyle = color; ctx.textAlign = 'center'; let cx = x;
  for (const ch of s) { const w = /[0-9]/.test(ch) ? size * cell : ctx.measureText(ch).width + size * 0.02; ctx.fillText(ch, cx + w / 2, y); cx += w; }
  ctx.textAlign = 'left'; return cx - x;
}
const fmt = n => '₦' + Math.round(n).toLocaleString('en-US');

// caption card: big line slammed in chunks with one yellow keyword; spoken line underneath
function caption(t) {
  const C = CAPS.find(c => t >= c.t0 && t < c.t1); if (!C) return;
  const chunks = C.big.split('|').map(s => s.trim());
  const size = 84, font = F(900, size); let x = 120; const y = 948;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 20;
  chunks.forEach((ch, i) => {
    const t0 = C.t0 + i * 0.12, k = pr(t, t0, 0.13); if (k <= 0) { x += tw(ch.replace(/[{}]/g, ''), font) + 24; return; }
    const s = lerp(1.3, 1, back(k)), parts = ch.split(/(\{[^}]*\})/).filter(Boolean);
    const wAll = tw(ch.replace(/[{}]/g, ''), font);
    ctx.save(); ctx.globalAlpha = clamp((t - t0) / 0.04); ctx.translate(x + wAll / 2, y - size * 0.35); ctx.scale(s, s); ctx.translate(-(x + wAll / 2), -(y - size * 0.35));
    let px = x;
    for (const p of parts) {
      const kw = p.startsWith('{'), str = p.replace(/[{}]/g, ''), w = tw(str, font);
      if (kw) { const wk = eout(pr(t, t0 + 0.1, 0.12)); ctx.save(); ctx.shadowBlur = 0; ctx.fillStyle = HONEY; ctx.fillRect(px - 12, y - size * 0.82, (w + 24) * wk, size * 1.06); ctx.restore(); txt(str, px, y, font, wk > 0.5 ? INK : IVORY); }
      else txt(str, px, y, font, IVORY);
      px += w;
    }
    ctx.restore(); x += wAll + 24;
  });
  const ke = pr(t, C.t0 + 0.1, 0.18);
  ctx.globalAlpha = ke; txt(C.en, 120, 1014 + 10 * (1 - eout(ke)), F(500, 33), IVORY);
  ctx.restore();
}
function flash(t, at, d = 2 / 24) { const k = (t - at) / d; if (k >= 0 && k < 1) { ctx.fillStyle = `rgba(255,255,255,${0.85 * (1 - k)})`; ctx.fillRect(0, 0, W, H); } }

// a document page on a dark desk, pushed in, with highlighter sweeps
function doc(t, t0, name, opt) {
  ctx.fillStyle = '#1A1916'; ctx.fillRect(0, 0, W, H);
  const v = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 1200); v.addColorStop(0, 'rgba(60,56,48,0.35)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  const im = IMG[name]; if (!im) return;
  const k = clamp((t - t0) / (opt.dur || 4.5)), s = opt.scale * (1 + 0.03 * k);
  ctx.save(); ctx.translate(opt.cx + (opt.drift || 0) * k, opt.cy); ctx.rotate(opt.rot); ctx.scale(s, s); ctx.translate(-im.width / 2, -im.height / 2);
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, im.width, im.height); ctx.shadowColor = 'transparent';
  ctx.filter = 'contrast(1.04) saturate(0.95)'; ctx.drawImage(im, 0, 0); ctx.filter = 'none';
  for (const h of opt.hl || []) {
    const kk = eio(pr(t, h.at, h.d || 0.4)); if (kk <= 0) continue;
    for (const [x, y, w, hh] of h.rects) { ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(255,214,40,0.85)'; ctx.fillRect(x - 8, y - 2, (w + 16) * kk, hh + 6); ctx.globalCompositeOperation = 'source-over'; }
  }
  ctx.restore();
}
function popBlock(t, at, lines, x, y) {
  const k = pr(t, at, 0.14); if (k <= 0) return; const s = lerp(1.25, 1, back(k));
  const w = Math.max(...lines.map(([s0, f]) => tw(s0, f))) + 56, h = lines.length * 70 + 34;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha = clamp(k * 4);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; ctx.fillStyle = HONEY; ctx.fillRect(0, 0, w, h); ctx.shadowColor = 'transparent';
  lines.forEach(([s0, f], i) => txt(s0, 28, 74 + i * 70, f, INK));
  ctx.restore();
}

// ---------------- shots ----------------
function shotHook(t) {
  ledger(t, 0);
  txt('FEDERAL GOVERNMENT RELIEF', 120, 230, F(800, 34), GREY, 'left', 6);
  const k = eout(pr(t, 0.15, 0.45)), val = 50000 * k, s = fmt(val);
  const pk = pr(t, 0.12, 0.13), sc = lerp(1.3, 1, back(pk));
  ctx.save(); ctx.translate(120, 520); ctx.scale(sc, sc); ctx.globalAlpha = clamp(pk * 5);
  ctx.fillStyle = HONEY; ctx.fillRect(-20, -230, 1120, 280); num(s, 20, 0, 250, INK);
  ctx.restore();
  if (k >= 1) { ctx.globalAlpha = pr(t, 0.6, 0.12); txt('into your mobile wallet · no deductions', 120, 640, F(500, 42), IVORY); ctx.globalAlpha = 1; }
  const g = pr(t, 1.2, 0.14); if (g > 0) { const s2 = lerp(1.3, 1, back(g)); ctx.save(); ctx.translate(1520, 640); ctx.rotate(-0.08); ctx.scale(s2, s2); ctx.globalAlpha = clamp(g * 4);
    ctx.strokeStyle = IVORY; ctx.lineWidth = 6; ctx.strokeRect(-190, -70, 380, 140); ctx.lineWidth = 2; ctx.strokeRect(-178, -58, 356, 116);
    txt('GRANT', 0, 6, F(900, 64), IVORY, 'center', 6); txt('NOT A LOAN', 0, 46, F(800, 24), HONEY, 'center', 6); ctx.restore(); }
  gradients(true); bug(t);
}
function shotDocHero(t) {
  const B = BOX.hero;
  doc(t, 3.0, 'hero', { cx: 900, cy: 470, scale: 0.68, rot: -0.018, drift: -30, hl: B ? [{ at: 4.1, rects: B[0], d: 0.5 }] : [] });
  popBlock(t, 4.8, [['₦50,000', F(900, 64)], ['POOR & VULNERABLE', F(800, 34)], ['HOUSEHOLDS', F(800, 34)]], 1380, 150);
  gradients(false); bug(t); sourceTag(t, 3.1);
}
function shotRegister(t) {
  ledger(t, 7.5); const dx = slideIn(t, 7.5); ctx.save(); ctx.translate(dx, 0);
  txt('Who is selected', 120, 250, F(900, 64), IVORY); txt('No sign-up. Names come from existing records.', 120, 300, F(500, 30), GREY);
  const rows = [['National Social Register', 'poor and vulnerable households', 7.9, 'Social Register'], ['Verified national identity records', 'your phone number and NIN', 8.4], ['Paid in phases', 'across all six geopolitical zones', 9.6]];
  rows.forEach(([a, b, at], i) => {
    const k = eout(pr(t, at, 0.25)); if (k <= 0) return; const y = 380 + i * 150;
    ctx.globalAlpha = k; ctx.save(); ctx.translate(0, 30 * (1 - k));
    const lit = i === 0 ? pr(t, 8.6, 0.15) : 1;
    ctx.fillStyle = i === 0 ? `rgba(255,194,26,${0.12 + 0.88 * lit})` : 'rgba(255,255,255,0.06)'; ctx.fillRect(820, y - 70, 980, 120);
    num(String(i + 1), 860, y + 12, 64, i === 0 && lit > .5 ? INK : HONEY);
    txt(a, 960, y - 6, F(900, 46), i === 0 && lit > .5 ? INK : IVORY); txt(b, 960, y + 34, F(500, 28), i === 0 && lit > .5 ? 'rgba(14,14,12,.75)' : GREY);
    ctx.restore(); ctx.globalAlpha = 1;
  });
  ctx.restore(); streaks(t, 7.5); gradients(true); bug(t); sourceTag(t, 7.7);
}
function shotQuestion(t) {
  // the register card frozen, desaturated, with corner brackets: the viewer's question
  ctx.save(); ctx.filter = 'saturate(0.45) brightness(0.7)'; ctx.translate(W / 2, H / 2); const p = lerp(1, 1.12, eout(pr(t, 12.0, 0.3))); ctx.scale(p, p); ctx.translate(-W / 2, -H / 2);
  NOOVL = true; shotRegister(12.0); NOOVL = false; ctx.restore();
  const k = eout(pr(t, 12.05, 0.3)), m = lerp(220, 90, k);
  ctx.strokeStyle = HONEY; ctx.lineWidth = 8;
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m - 120, 1, -1], [W - m, H - m - 120, -1, -1]]) { ctx.beginPath(); ctx.moveTo(x, y + sy * 70); ctx.lineTo(x, y); ctx.lineTo(x + sx * 70, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(W - 300, 52, 204, 40); txt('❚❚  00:12:00', W - 286, 81, F(800, 22), IVORY, 'left', 1);
  flash(t, 12.0); bug(t);
}
function shotDocKnow(t) {
  const B = BOX.know;
  doc(t, 14.0, 'know', { cx: 820, cy: 420, scale: 1.18, rot: 0.012, drift: 20, hl: B ? [{ at: 14.5, rects: B[0], d: 0.45 }, { at: 16.6, rects: B[1], d: 0.45 }] : [] });
  popBlock(t, 15.2, [['YOU CAN’T APPLY', F(900, 52)], ['OR PAY TO BE ADDED', F(800, 30)]], 1180, 640 - 260);
  gradients(false); bug(t); sourceTag(t, 14.1); flash(t, 14.0);
}
function phone(x, y, t, t0) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = '#26251f'; roundRect(-150, -250, 300, 500, 36); ctx.fill(); ctx.fillStyle = '#F2F0E8'; roundRect(-132, -210, 264, 420, 14); ctx.fill();
  txt('Provider', -112, -178, F(800, 18), '#555');
  const k = pr(t, t0, 0.2); ctx.globalAlpha = k; ctx.fillStyle = '#fff'; roundRect(-118, -158, 236, 268, 14); ctx.fill();
  const lines = ['Relief! FGN has selected', 'you to receive ₦50,000', 'under NERSI to help with', 'living costs. This is FREE.', 'Enq? Call 07000222222.', 'Dial *945*23# to accept.'];
  lines.forEach((l, i) => txt(l, -104, -126 + i * 30, F(500, 18), '#222'));
  ctx.globalAlpha = 1; ctx.restore();
}
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function shotSteps(t) {
  ledger(t, 18.5);
  txt('How it works', 120, 200, F(900, 64), IVORY); txt('The example SMS is quoted from the official page', 120, 246, F(500, 26), GREY);
  const P = [['1', 'An SMS', 'from ALAT, MoMo, NairaGram,\nOPay or Moniepoint', 18.5, 19.6], ['2', 'You accept', 'reply YES, or dial the\ncode in the SMS', 18.6, 22.2], ['3', '₦50,000', 'credited to your wallet,\nno deductions', 18.7, 23.4]];
  P.forEach(([n, a, b, rise, light], i) => {
    const k = eout(pr(t, rise - 0.12, 0.3)), x = 120 + i * 596, y = 300 + 60 * (1 - k), lit = pr(t, light, 0.15);
    ctx.globalAlpha = k; ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(x, y, 584, 470);
    if (lit > 0) { ctx.strokeStyle = HONEY; ctx.lineWidth = 6 * lit; ctx.strokeRect(x + 3, y + 3, 578, 464); }
    num(n, x + 40, y + 96, 80, lit > 0.5 ? HONEY : DIM);
    txt(a, x + 40, y + 190, F(900, 60), lit > 0.5 ? HONEY : IVORY);
    b.split('\n').forEach((l, j) => txt(l, x + 40, y + 250 + j * 40, F(500, 30), GREY));
    if (i === 0) { const q = pr(t, 19.4, 0.25) * k; ctx.globalAlpha = q; ctx.fillStyle = HONEY; ctx.fillRect(x + 40, y + 345, 6, 92);
      ['“Relief! FGN has selected you', 'to receive ₦50,000 under NERSI…', 'This is FREE.”'].forEach((l, j) => txt(l, x + 62, y + 370 + j * 34, F(500, 26), IVORY)); }
    ctx.globalAlpha = 1;
  });
  gradients(true); bug(t); sourceTag(t, 18.7);
}
function shotCodes(t) {
  ledger(t, 25.5); const dx = slideIn(t, 25.5); ctx.save(); ctx.translate(dx, 0);
  txt('Check your eligibility', 120, 200, F(900, 64), IVORY); txt('Dial any provider’s code, then choose “Check eligibility”. Works on any phone, no data.', 120, 246, F(500, 26), GREY);
  PROVIDERS.forEach(([name, kind, code], i) => {
    const at = 25.75 + i * 0.1, k = eout(pr(t, at, 0.25)), y = 290 + i * 104; if (k <= 0) return;
    ctx.globalAlpha = k; ctx.save(); ctx.translate(80 * (1 - k), 0);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(120, y, 1680, 92);
    txt(name, 160, y + 58, F(900, 44), IVORY); txt(kind, 520, y + 56, F(500, 28), GREY);
    const lit = pr(t, 27.3 + i * 0.55, 0.15);
    ctx.fillStyle = lit > 0.5 ? HONEY : 'rgba(255,194,26,0.14)'; ctx.fillRect(1180, y + 8, 580, 76);
    txt('DIAL', 1210, y + 58, F(800, 26), lit > 0.5 ? INK : HONEY, 'left', 3);
    num(code, 1310, y + 64, 56, lit > 0.5 ? INK : IVORY, 0.6);
    ctx.restore(); ctx.globalAlpha = 1;
  });
  ctx.restore(); streaks(t, 25.5); gradients(true); bug(t); sourceTag(t, 25.7);
}
function shotSafe(t) {
  ledger(t, 32.5);
  const d = eout(pr(t, 32.4, 0.25));
  ctx.fillStyle = 'rgba(255,74,61,0.10)'; ctx.fillRect(W / 2, 0, W / 2, H * d);
  ctx.fillStyle = HONEY; ctx.fillRect(W / 2 - 2, 0, 4, H * d);
  // left: FREE stamp
  const s = pr(t, 32.65, 0.14); if (s > 0) { const sc = lerp(1.4, 1, back(s)); ctx.save(); ctx.translate(W / 4 + 20, 420); ctx.rotate(-0.06); ctx.scale(sc, sc); ctx.globalAlpha = clamp(s * 4);
    ctx.fillStyle = HONEY; ctx.fillRect(-300, -150, 600, 300); txt('FREE', 0, 50, F(900, 170), INK, 'center', 8); txt('NO FEES · NO MIDDLEMEN', 0, 115, F(800, 30), INK, 'center', 4); ctx.restore(); }
  txt('THE PROGRAMME IS', W / 4 + 20, 210, F(900, 40), HONEY, 'center', 8);
  txt('NEVER', W * 3 / 4, 210, F(900, 40), RED, 'center', 8);
  const items = [['Pay anyone to “release” it', 33.6], ['Share your PIN', 35.6], ['Share your OTP', 35.9], ['Click a link in a message', 36.4]];
  items.forEach(([s0, at], i) => { const k = eout(pr(t, at, 0.2)); if (k <= 0) return; const y = 300 + i * 112; ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(255,74,61,0.9)'; ctx.beginPath(); ctx.arc(1080, y - 14, 26, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(1068, y - 26); ctx.lineTo(1092, y - 2); ctx.moveTo(1092, y - 26); ctx.lineTo(1068, y - 2); ctx.stroke();
    txt(s0, 1130, y, F(800, 44), IVORY); ctx.globalAlpha = 1; });
  gradients(true); bug(t); sourceTag(t, 32.7);
}
function shotHelp(t) {
  ledger(t, 38.5, 0.02);
  txt('NOT SURE A MESSAGE IS REAL?', 120, 280, F(800, 40), GREY, 'left', 5);
  txt('Stop. Call the official help line first.', 120, 340, F(500, 36), IVORY);
  const pk = pr(t, 38.6, 0.14), sc = lerp(1.3, 1, back(pk));
  ctx.save(); ctx.translate(120, 560); ctx.scale(sc, sc); ctx.globalAlpha = clamp(pk * 5);
  ctx.fillStyle = HONEY; ctx.fillRect(-20, -150, 1300, 190);
  const full = '0700-022-2222', n = Math.floor(full.length * eout(pr(t, 38.62, 0.45)));
  num(full.slice(0, n) + full.slice(n).replace(/[0-9]/g, '0'), 20, 0, 160, INK, 0.6);
  ctx.restore();
  const k2 = pr(t, 39.6, 0.2); ctx.globalAlpha = k2; txt('fmhapr.gov.ng/nersi', 120, 680, F(800, 44), HONEY); txt('Official NERSI programme page · Federal Ministry of Humanitarian Affairs and Poverty Reduction', 120, 728, F(500, 26), GREY); ctx.globalAlpha = 1;
  flash(t, 38.5); gradients(true); bug(t); sourceTag(t, 38.7);
}

// ---------------- frame ----------------
function render(t) {
  t = clamp(t, 0, DUR - 1e-4);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  const S = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
  S.f(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  caption(t);
  // tail: fade to the ledger on the last half second
  if (t > DUR - 0.5) { ctx.fillStyle = `rgba(14,14,12,${pr(t, DUR - 0.5, 0.5)})`; ctx.fillRect(0, 0, W, H); }
}

// ---------------- sound events ----------------
const EV = [];
CAPS.forEach(c => c.big.split('|').forEach((_, i) => EV.push({ t: c.t0 + i * 0.12, type: 'slam' })));
EV.push({ t: 0.15, type: 'hit_big' }, { t: 0.15, type: 'counter', dur: 0.45 }, { t: 1.2, type: 'stamp' },
  { t: 3.0, type: 'whoosh' }, { t: 4.1, type: 'highlighter', dur: 0.5 }, { t: 4.8, type: 'pop' },
  { t: 7.5, type: 'whoosh' }, { t: 7.9, type: 'pop' }, { t: 8.4, type: 'pop' }, { t: 8.6, type: 'tick' }, { t: 9.6, type: 'pop' },
  { t: 12.0, type: 'shutter' }, { t: 14.0, type: 'turn_hit' }, { t: 14.5, type: 'highlighter', dur: 0.45 }, { t: 15.2, type: 'stamp' }, { t: 16.6, type: 'highlighter', dur: 0.45 },
  { t: 18.4, type: 'rise' }, { t: 19.4, type: 'sms' }, { t: 19.6, type: 'tick' }, { t: 22.2, type: 'tick' }, { t: 23.4, type: 'hit_big' },
  { t: 25.5, type: 'whoosh' }, ...PROVIDERS.map((_, i) => ({ t: 25.75 + i * 0.1, type: 'pop' })), ...PROVIDERS.map((_, i) => ({ t: 27.3 + i * 0.55, type: 'tick' })),
  { t: 32.4, type: 'whoosh' }, { t: 32.65, type: 'stamp' }, { t: 33.6, type: 'buzz' }, { t: 35.6, type: 'buzz' }, { t: 35.9, type: 'buzz' }, { t: 36.4, type: 'buzz' },
  { t: 38.5, type: 'verdict' }, { t: 38.62, type: 'counter', dur: 0.45 });
EV.sort((a, b) => a.t - b.t);

window.DUR = DUR; window.EV = EV; window.NOTES = CAPS.map(c => ({ t0: c.t0, t1: c.t1, s: c.en })); window.VOICE = VOICE; window.SILENCES = SILENCES;
window.render = render;
Promise.all([load('hero'), load('know'), fetch('src/bbox.json').then(r => r.json()).then(j => Object.assign(BOX, j)).catch(() => {}),
  document.fonts.load(F(900, 80)), document.fonts.load(F(500, 30)), document.fonts.load(F(900, 80) , '₦')]).then(() => { render(0); window.READY = true; });
})();
