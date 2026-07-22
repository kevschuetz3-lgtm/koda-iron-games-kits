// Live smoke test against the deployed GitHub Pages site (no submission).
const puppeteer = require('C:/Users/kevsc/Desktop/Claude/hyrox_pdf/node_modules/puppeteer');
const SCRATCH = 'C:/Users/kevsc/AppData/Local/Temp/claude/C--Users-kevsc-Desktop-Claude/24432f1d-cd54-440d-8514-dd9fecb0259c/scratchpad';
const LIVE = 'https://kevschuetz3-lgtm.github.io/koda-iron-games-kits/';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const failures = [];
  page.on('pageerror', e => failures.push('PAGE ERROR: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`); });
  await page.setViewport({ width: 1280, height: 950 });
  await page.goto(LIVE, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);

  // drive to a fully-selected state (no submit)
  await page.evaluate(() => {
    state.division = 'Masters Female';
    state.teamName = 'GRIT AND GRACE';
    document.getElementById('team-name').value = state.teamName;
    state.day1 = { garment: 'unisex', shirt: 'unisex-vintage-denim', print1: 'White', print2: 'Bright Royal Blue', sizes: ['M', 'M', 'L'] };
    state.day2 = { garment: 'crop', shirt: 'crop-solid-maroon', print1: 'Yellow', print2: 'White', sizes: ['M', 'L', 'XL'] };
    refresh();
  });
  await new Promise(r => setTimeout(r, 900));
  await page.screenshot({ path: SCRATCH + '/live-full.png', fullPage: true });

  const checks = await page.evaluate(() => ({
    fontLoaded: document.fonts.check('900 40px Tungsten'),
    lockupInDom: !!document.querySelector('#d1-chest .lk-name'),
    submitDisabled: document.getElementById('submit-btn').disabled,
    review: document.getElementById('review-box').innerText.slice(0, 200),
  }));
  console.log(JSON.stringify(checks, null, 2));
  console.log(failures.length ? 'FAILURES:\n' + failures.join('\n') : 'NO network/JS failures');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
