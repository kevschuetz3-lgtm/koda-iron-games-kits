// Recon 2: map color name -> code from the color <select>, and list gallery view URLs.
const puppeteer = require('C:/Users/kevsc/Desktop/Claude/hyrox_pdf/node_modules/puppeteer');
const PRODUCTS = [
  ['3001', 'https://www.bellacanvas.com/product/3001/Unisex-Jersey-Short-Sleeve-Tee.html'],
  ['1010', 'https://www.bellacanvas.com/product/1010/Womens-Micro-Rib-Baby-Tee.html'],
  ['8882', 'https://www.bellacanvas.com/product/8882/Womens-Flowy-Cropped-Tee.html'],
];
const WANT = /red|asphalt|^black$|vintage denim|synthetic green|berry|purple storm|lavender blue|heather dust|solid vintage navy|solid maroon|solid forest|solid pink|solid cocoa/i;
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
  for (const [name, url] of PRODUCTS) {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(r => setTimeout(r, 2500));
    const info = await page.evaluate(() => {
      const sel = document.querySelector('select.mainColorSwatchSelect');
      const opts = sel ? [...sel.options].map(o => ({ v: o.value, t: o.textContent.trim() })) : [];
      const hires = [...new Set([...document.querySelectorAll('img')].map(i => i.src).filter(s => s.includes('/hires/')))];
      return { opts, hires };
    });
    console.log('=== ' + name + ' ===');
    console.log('views:', JSON.stringify(info.hires));
    info.opts.filter(o => WANT.test(o.t)).forEach(o => console.log(`  ${o.t}  ->  ${o.v}`));
  }
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
