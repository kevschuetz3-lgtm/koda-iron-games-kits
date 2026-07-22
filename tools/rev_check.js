const puppeteer = require('C:/Users/kevsc/Desktop/Claude/hyrox_pdf/node_modules/puppeteer');
const S = 'C:/Users/kevsc/AppData/Local/Temp/claude/C--Users-kevsc-Desktop-Claude/24432f1d-cd54-440d-8514-dd9fecb0259c/scratchpad';
(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  p.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  await p.setViewport({ width: 1280, height: 950 });
  await p.goto('http://localhost:8747/', { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(() => {
    state.division = 'RX Female';
    state.teamName = 'GRIT AND GRACE';
    document.getElementById('team-name').value = state.teamName;
    state.day1 = { garment: 'unisex', shirt: 'unisex-black', print1: 'White', print2: 'Red', sizes: ['S', 'M', 'M'] };
    refresh();
  });
  await new Promise(r => setTimeout(r, 700));
  await (await p.$('#step-division')).screenshot({ path: S + '/rev-divisions.png' });
  await (await p.$('#step-day1')).screenshot({ path: S + '/rev-day1.png' });
  console.log('letters:', await p.evaluate(() => [...document.querySelectorAll('.step-num')].map(e => e.textContent).join(' ')));
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
