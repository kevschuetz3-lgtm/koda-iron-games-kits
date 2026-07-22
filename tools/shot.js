// Quick screenshot helper: node shot.js <url-path-with-hash> <outfile> [viewportW] [viewportH]
const puppeteer = require('C:/Users/kevsc/Desktop/Claude/hyrox_pdf/node_modules/puppeteer');
const SCRATCH = 'C:/Users/kevsc/AppData/Local/Temp/claude/C--Users-kevsc-Desktop-Claude/24432f1d-cd54-440d-8514-dd9fecb0259c/scratchpad';
(async () => {
  const [urlPath, out, w, h] = process.argv.slice(2);
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  await page.setViewport({ width: parseInt(w) || 1500, height: parseInt(h) || 2400 });
  await page.goto('http://localhost:8747' + urlPath, { waitUntil: 'networkidle0' });
  await page.waitForFunction('document.title === "READY"', { timeout: 15000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: SCRATCH + '/' + out, fullPage: true });
  await browser.close();
  console.log(out, 'saved');
})().catch(e => { console.error(e); process.exit(1); });
