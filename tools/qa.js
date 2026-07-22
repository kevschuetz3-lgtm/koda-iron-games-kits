// Visual QA: generates tools/ref-name.png (sample name crop from the .ai),
// then screenshots the tuner grid + key states of the live page.
const fs = require('fs');
const path = require('path');
const puppeteer = require('C:/Users/kevsc/Desktop/Claude/hyrox_pdf/node_modules/puppeteer');

const SCRATCH = 'C:/Users/kevsc/AppData/Local/Temp/claude/C--Users-kevsc-Desktop-Claude/24432f1d-cd54-440d-8514-dd9fecb0259c/scratchpad';
const PROJ = 'C:/Users/kevsc/Desktop/Claude/New Custom Apparel Website';
const BASE = 'http://localhost:8747';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  page.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE ERROR:', m.text().slice(0, 300)); });

  // 1) ref-name.png from the .ai render (name sample crop for font-weight comparison)
  if (!fs.existsSync(path.join(PROJ, 'tools/ref-name.png'))) {
    await page.goto('about:blank');
    await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js' });
    const teamB64 = fs.readFileSync(path.join(SCRATCH, 'ai/team-shirt.pdf')).toString('base64');
    const refPng = await page.evaluate(async (b64) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      const bin = atob(b64); const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const doc = await pdfjsLib.getDocument({ data: u8 }).promise;
      const pg = await doc.getPage(1);
      const vp1 = pg.getViewport({ scale: 1 });
      const vp = pg.getViewport({ scale: 2600 / vp1.width });
      const c = document.createElement('canvas');
      c.width = Math.round(vp.width); c.height = Math.round(vp.height);
      await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      const crop = document.createElement('canvas');
      crop.width = 2320; crop.height = 290;
      crop.getContext('2d').drawImage(c, 140, 1045, 2320, 290, 0, 0, 2320, 290);
      return crop.toDataURL('image/png');
    }, teamB64);
    fs.writeFileSync(path.join(PROJ, 'tools/ref-name.png'), Buffer.from(refPng.split(',')[1], 'base64'));
    console.log('ref-name.png written');
  }

  // 2) tuner grid: long 2-line name + short giant name
  for (const [file, q] of [
    ['qa-tune-long.png', ''],
    ['qa-tune-abc.png', '?name=ABC'],
  ]) {
    await page.setViewport({ width: 1500, height: 2400, deviceScaleFactor: 1 });
    await page.goto(`${BASE}/tools/tune.html${q}`, { waitUntil: 'networkidle0' });
    await page.waitForFunction('document.title === "READY"', { timeout: 15000 }).catch(() => console.log('tune READY timeout'));
    await page.screenshot({ path: path.join(SCRATCH, file), fullPage: true });
    console.log(file, 'saved');
  }

  // 3) live page states
  await page.setViewport({ width: 1280, height: 950, deviceScaleFactor: 1 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(SCRATCH, 'qa-hero.png') });

  // drive a full RX Female selection
  await page.evaluate(() => {
    state.division = 'RX Female';
    state.teamName = "WOD TO EXPECT WHEN YOU'RE EXPECTING";
    document.getElementById('team-name').value = state.teamName;
    state.day1 = { garment: 'unisex', shirt: 'unisex-black', print1: 'White', print2: 'Red', sizes: ['S', 'M', 'M'] };
    state.day2 = { garment: 'crop', shirt: 'crop-solid-pink', print1: 'Black', print2: 'Aqua', sizes: ['S', 'M', 'L'] };
    refresh();
  });
  await new Promise(r => setTimeout(r, 700));
  const shots = [
    ['step-name', 'qa-name-preview.png'],
    ['step-day1', 'qa-day1.png'],
    ['step-day2', 'qa-day2.png'],
    ['step-review', 'qa-review.png'],
  ];
  for (const [id, file] of shots) {
    const el = await page.$('#' + id);
    await el.screenshot({ path: path.join(SCRATCH, file) });
    console.log(file, 'saved');
  }

  // mobile pass
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    state.division = 'Scaled Male';
    state.teamName = 'BEEF BOYS';
    document.getElementById('team-name').value = state.teamName;
    state.day1 = { garment: 'unisex', shirt: 'unisex-red', print1: 'White', print2: 'Black', sizes: ['L', 'XL', 'XXL'] };
    refresh();
    document.getElementById('step-day1').scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 700));
  await page.screenshot({ path: path.join(SCRATCH, 'qa-mobile-day1.png') });
  console.log('qa-mobile-day1.png saved');

  // snapshot canvas (email mockup) test
  await page.setViewport({ width: 1280, height: 950 });
  await page.goto(BASE + '/', { waitUntil: 'networkidle0' });
  const snap = await page.evaluate(async () => {
    state.division = 'RX Male';
    state.teamName = 'ABC';
    state.day1 = { garment: 'unisex', shirt: 'unisex-vintage-denim', print1: 'Bright Royal Blue', print2: 'Black', sizes: ['M', 'L', 'XL'] };
    refresh();
    await document.fonts.ready;
    return await snapshotDay(1);
  });
  fs.writeFileSync(path.join(SCRATCH, 'qa-email-mockup.jpg'), Buffer.from(snap, 'base64'));
  console.log('qa-email-mockup.jpg saved');

  await browser.close();
  console.log('QA DONE');
})().catch(e => { console.error(e); process.exit(1); });
