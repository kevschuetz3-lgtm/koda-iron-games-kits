// Downloads every hires gallery view for each target color by actually selecting
// colors on bellacanvas.com (no URL guessing). Files land in scratchpad/bella-flats
// as <slug>__<viewfile>.jpg; a contact sheet identifies the flat-front per color.
const fs = require('fs');
const path = require('path');
const puppeteer = require('C:/Users/kevsc/Desktop/Claude/hyrox_pdf/node_modules/puppeteer');
const OUT = 'C:/Users/kevsc/AppData/Local/Temp/claude/C--Users-kevsc-Desktop-Claude/24432f1d-cd54-440d-8514-dd9fecb0259c/scratchpad/bella-flats';

const PRODUCTS = [
  {
    url: 'https://www.bellacanvas.com/product/3001/Unisex-Jersey-Short-Sleeve-Tee.html',
    colors: {
      'Red': 'unisex-red', 'Asphalt': 'unisex-asphalt', 'Black': 'unisex-black',
      'Vintage Denim': 'unisex-vintage-denim', 'Synthetic Green': 'unisex-synthetic-green',
      'Berry': 'unisex-berry', 'Purple Storm': 'unisex-purple-storm', 'Lavender Blue': 'unisex-lavender-blue',
    },
  },
  {
    url: 'https://www.bellacanvas.com/product/8882/Womens-Flowy-Cropped-Tee.html',
    colors: { 'Heather Dust': 'crop-heather-dust', 'Black': 'crop-black' },
  },
  {
    url: 'https://www.bellacanvas.com/product/1010/Womens-Micro-Rib-Baby-Tee.html',
    colors: {
      'Solid Vintage Navy Blend': 'crop-solid-vintage-navy', 'Solid Maroon Blend': 'crop-solid-maroon',
      'Solid Forest Blend': 'crop-solid-forest', 'Solid Pink Blend': 'crop-solid-pink',
      'Solid Cocoa Blend': 'crop-solid-cocoa',
    },
  },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1400, height: 1000 });

  for (const prod of PRODUCTS) {
    await page.goto(prod.url, { waitUntil: 'networkidle2', timeout: 90000 });
    await new Promise(r => setTimeout(r, 2500));
    for (const [colorName, slug] of Object.entries(prod.colors)) {
      const result = await page.evaluate(async (colorName) => {
        const sel = document.querySelector('select.mainColorSwatchSelect');
        if (!sel) return { err: 'no select' };
        const opt = [...sel.options].find(o => o.textContent.trim().toLowerCase() === colorName.toLowerCase());
        if (!opt) return { err: 'color not found: ' + colorName };
        sel.value = opt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        if (window.jQuery) { try { window.jQuery(sel).trigger('change'); } catch (e) {} }
        await new Promise(r => setTimeout(r, 2500));
        const urls = [...new Set([...document.querySelectorAll('img')].map(i => i.src).filter(s => s.includes('/hires/')))];
        const files = [];
        for (const u of urls) {
          try {
            const resp = await fetch(u, { credentials: 'include' });
            if (!resp.ok) continue;
            const blob = await resp.blob();
            const b64 = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result.split(',')[1]); fr.readAsDataURL(blob); });
            files.push({ name: u.split('/').pop(), b64 });
          } catch (e) {}
        }
        return { value: opt.value, files };
      }, colorName);
      if (result.err) { console.log(`${slug}: ERROR ${result.err}`); continue; }
      result.files.forEach(f => {
        fs.writeFileSync(path.join(OUT, `${slug}__${f.name}`), Buffer.from(f.b64, 'base64'));
      });
      console.log(`${slug} (code ${result.value}): ${result.files.length} views -> ${result.files.map(f => f.name).join(', ')}`);
    }
  }
  await browser.close();
  console.log('SCRAPE DONE');
})().catch(e => { console.error(e); process.exit(1); });
