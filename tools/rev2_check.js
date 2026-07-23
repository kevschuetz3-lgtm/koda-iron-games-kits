const puppeteer = require('C:/Users/kevsc/Desktop/Claude/hyrox_pdf/node_modules/puppeteer');
const S = 'C:/Users/kevsc/AppData/Local/Temp/claude/C--Users-kevsc-Desktop-Claude/24432f1d-cd54-440d-8514-dd9fecb0259c/scratchpad';
(async () => {
  const b = await puppeteer.launch({ headless: 'new' });
  const p = await b.newPage();
  p.on('pageerror', e => console.log('PAGE ERROR:', e.message));
  await p.setViewport({ width: 1280, height: 950 });
  await p.goto('http://localhost:8747/', { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);

  // 1) gating: nothing but division section visible on load
  await p.screenshot({ path: S + '/rev2-gated.png', fullPage: true });
  console.log('hidden sections on load:', await p.evaluate(() =>
    ['step-name', 'step-day1', 'step-day2', 'step-review'].map(id => document.getElementById(id).classList.contains('hidden')).join(',')));

  // 2) full female state — one of each garment type across the two days
  await p.evaluate(() => {
    document.querySelector('.div-card[data-id="RX Female"]').click();
    state.teamName = 'YOUR TEAM NAME';
    document.getElementById('team-name').value = state.teamName;
    state.day1 = { garment: 'unisex', shirt: 'unisex-black', print1: 'White', print2: 'Red', sizes: ['S', 'M', 'M'] };
    state.day2 = { garment: 'crop', shirt: 'crop-heather-dust', print1: 'Black', print2: 'Red', sizes: ['S', 'M', 'L'] };
    refresh();
  });
  await new Promise(r => setTimeout(r, 800));
  await (await p.$('#step-name')).screenshot({ path: S + '/rev2-name.png' });
  await (await p.$('#step-day1')).screenshot({ path: S + '/rev2-day1.png' });
  await (await p.$('#step-day2')).screenshot({ path: S + '/rev2-day2-8882.png' });

  // 3) swap day2 to a 1010 baby tee for ratio comparison
  await p.evaluate(() => {
    state.day2.shirt = 'crop-solid-maroon';
    refresh();
  });
  await new Promise(r => setTimeout(r, 600));
  await (await p.$('#step-day2')).screenshot({ path: S + '/rev2-day2-1010.png' });
  await b.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
