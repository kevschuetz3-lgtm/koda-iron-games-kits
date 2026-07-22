// Full E2E: drives the kit builder UI with real clicks and submits a TEST order
// through the live Apps Script backend (sheet row + both emails).
const puppeteer = require('C:/Users/kevsc/Desktop/Claude/hyrox_pdf/node_modules/puppeteer');
const SCRATCH = 'C:/Users/kevsc/AppData/Local/Temp/claude/C--Users-kevsc-Desktop-Claude/24432f1d-cd54-440d-8514-dd9fecb0259c/scratchpad';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text().slice(0, 200)); });
  await page.setViewport({ width: 1280, height: 950 });
  await page.goto('http://localhost:8747/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);

  const click = sel => page.evaluate(s => document.querySelector(s).click(), sel);

  // Step 1: division (female so both garment types get exercised)
  await click('.div-card[data-id="RX Female"]');
  // Step 2: team name
  await page.type('#team-name', 'TEST PLEASE IGNORE');
  // Step 3: Day 1 — unisex black, White/Red, sizes S M M
  await click('#d1-shirts .shirt-card[data-id="unisex-black"]');
  await click('#d1-p1 .swatch[data-name="White"]');
  await click('#d1-p2 .swatch[data-name="Red"]');
  await page.select('#d1-sizes select[data-i="0"]', 'S');
  await page.select('#d1-sizes select[data-i="1"]', 'M');
  await page.select('#d1-sizes select[data-i="2"]', 'M');
  // Step 4: Day 2 — crop tab, pink baby tee, Black/Aqua, sizes S M L
  await page.evaluate(() => document.querySelector('#d2-tabs .garment-tab[data-g="crop"]').click());
  await new Promise(r => setTimeout(r, 300));
  await click('#d2-shirts .shirt-card[data-id="crop-solid-pink"]');
  await click('#d2-p1 .swatch[data-name="Black"]');
  await click('#d2-p2 .swatch[data-name="Aqua"]');
  await page.select('#d2-sizes select[data-i="0"]', 'S');
  await page.select('#d2-sizes select[data-i="1"]', 'M');
  await page.select('#d2-sizes select[data-i="2"]', 'L');
  // Step 5: captain
  await page.type('#cap-name', 'Kevin Schuetz (TEST)');
  await page.type('#cap-email', 'kevschuetz3@gmail.com');
  await new Promise(r => setTimeout(r, 500));

  const btnState = await page.evaluate(() => ({
    disabled: document.getElementById('submit-btn').disabled,
    review: document.getElementById('review-box').innerText,
  }));
  console.log('review box:\n' + btnState.review);
  if (btnState.disabled) throw new Error('submit button still disabled — validation failed');

  await page.screenshot({ path: SCRATCH + '/e2e-before-submit.png', fullPage: true });
  await click('#submit-btn');
  await page.waitForSelector('#success-overlay.show', { timeout: 60000 });
  await page.screenshot({ path: SCRATCH + '/e2e-success.png' });
  console.log('SUCCESS overlay shown');

  // recover the auto-created sheet URL
  const info = await page.evaluate(async () => {
    const r = await fetch(API + '?action=ironGamesKitsInfo');
    return await r.json();
  });
  console.log('kits sheet:', JSON.stringify(info));

  await browser.close();
  console.log('E2E DONE');
})().catch(e => { console.error(e); process.exit(1); });
