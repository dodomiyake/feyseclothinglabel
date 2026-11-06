// node stills.cjs <outDir> <t> [<t> ...]   — render review stills of index.html at the given seconds
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = __dirname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png' };
(async () => {
  const [out, ...ts] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => { console.error('page error:', e.message); process.exit(1); });
  await page.route('http://film.local/**', r => {
    const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname));
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, contentType: TYPES[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
  });
  await page.goto('http://film.local/index.html');
  await page.waitForFunction('window.READY === true', null, { timeout: 180000 });
  for (const t of ts) {
    await page.evaluate(t => window.render(+t), t);
    await page.screenshot({ path: path.join(out, `t_${(+t).toFixed(2)}.jpg`), type: 'jpeg', quality: 90 });
  }
  await browser.close();
})();
