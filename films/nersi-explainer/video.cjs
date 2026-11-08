// node video.cjs [--fps 24] [--workers 4] [--events-only]
// Renders index.html frame by frame (window.render(t)) in headless Chromium and pipes JPEGs into ffmpeg.
// Also writes out/events.json (sound cues) and out/cues.json (subtitle notes).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), { spawn, execFileSync } = require('child_process');
const ROOT = __dirname, OUT = path.join(ROOT, process.env.OUT || 'out'), PAGE = process.env.PAGE || 'index.html';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = +arg('--fps', 24), WK = +arg('--workers', 4), EVONLY = process.argv.includes('--events-only');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.json': 'application/json' };
async function open(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
  await page.route('http://film.local/**', r => {
    const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  await page.goto('http://film.local/' + PAGE);
  await page.waitForFunction('window.READY === true', null, { timeout: 180000 });
  return page;
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const p0 = await open(browser);
  const info = await p0.evaluate(() => ({ dur: window.DUR, ev: window.EV, notes: window.NOTES, voice: window.VOICE || [], sil: window.SILENCES || [] }));
  fs.writeFileSync(path.join(OUT, 'voice.json'), JSON.stringify({ voice: info.voice, silences: info.sil }, null, 1));
  fs.writeFileSync(path.join(OUT, 'events.json'), JSON.stringify(info.ev, null, 1));
  fs.writeFileSync(path.join(OUT, 'cues.json'), JSON.stringify(info.notes.map(n => ({ t0: n.t0, t1: n.t1, text: n.s })), null, 1));
  if (EVONLY) { await browser.close(); return; }
  const total = Math.round(info.dur * FPS), per = Math.ceil(total / WK), t0 = Date.now();
  const pages = [p0]; for (let i = 1; i < WK; i++) pages.push(await open(browser));
  let done = 0;
  const segs = await Promise.all(pages.map(async (page, w) => {
    const a = w * per, b = Math.min(total, a + per), seg = path.join(OUT, `.seg${w}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let f = a; f < b; f++) {
      await page.evaluate(t => window.render(t), f / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (++done % 96 === 0) console.log(`${done}/${total} frames · ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    ff.stdin.end(); await new Promise((r, j) => ff.on('close', c => c ? j(new Error('ffmpeg ' + c)) : r()));
    return seg;
  }));
  await browser.close();
  const list = path.join(OUT, '.segs.txt'); fs.writeFileSync(list, segs.map(s => `file '${s}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', path.join(OUT, 'video.mp4')]);
  segs.forEach(s => fs.unlinkSync(s)); fs.unlinkSync(list);
  console.log(`video.mp4 · ${total} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
})();
