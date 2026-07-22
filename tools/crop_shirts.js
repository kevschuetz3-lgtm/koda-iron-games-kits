// Strips the baked-in Bella+Canvas product-title band from the top of each shirt photo.
// Header rows are (near-)pure white, optionally with dark text; the studio photo below is
// light gray (~235-250) so the first non-header row marks the crop line.
const fs = require('fs');
const path = require('path');
const puppeteer = require('C:/Users/kevsc/Desktop/Claude/hyrox_pdf/node_modules/puppeteer');

const DIR = 'C:/Users/kevsc/Desktop/Claude/New Custom Apparel Website/assets/shirts';
const BACKUP = 'C:/Users/kevsc/AppData/Local/Temp/claude/C--Users-kevsc-Desktop-Claude/24432f1d-cd54-440d-8514-dd9fecb0259c/scratchpad/shirts-orig';

(async () => {
  fs.mkdirSync(BACKUP, { recursive: true });
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.jpg'));
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('about:blank');
  for (const f of files) {
    const src = path.join(DIR, f);
    const bak = path.join(BACKUP, f);
    if (!fs.existsSync(bak)) fs.copyFileSync(src, bak);
    const b64 = fs.readFileSync(bak).toString('base64');
    const out = await page.evaluate(async (b64) => {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/jpeg;base64,' + b64; });
      const W = img.naturalWidth, H = img.naturalHeight;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, W, H).data;
      // A header row (page-white background, possibly with title text) has most pixels
      // near-pure white; the studio photo below is a broad band of light gray (~225-250).
      // Crop at the first run of consecutive photo-like rows.
      // page-white level = median max-channel of the top row
      const topVals = [];
      for (let px = 0; px < W; px += 2) {
        const i = px * 4;
        topVals.push(Math.max(d[i], d[i + 1], d[i + 2]));
      }
      topVals.sort((a, b) => a - b);
      const pageWhite = topVals[Math.floor(topVals.length / 2)];
      // blank row = essentially all page-white. The title block is rows of text separated
      // by small gaps; a 40px+ blank run marks the end of the title block. Crop at the
      // first non-blank row (start of photo content: gray studio block OR cutout model).
      const isBlank = (y) => {
        let off = 0, n = 0;
        for (let px = 0; px < W; px += 2) {
          const i = (y * W + px) * 4;
          const v = Math.max(d[i], d[i + 1], d[i + 2]);
          if (v < pageWhite - 5) off++;
          n++;
        }
        return off / n < 0.01;
      };
      // crop at the end of the LAST decent blank run in the top region — i.e. the
      // final whitespace gap before continuous photo content begins.
      let crop = 0;
      const limit = Math.floor(H * 0.30);
      let y = 0, sawText = false;
      while (y < limit) {
        if (!isBlank(y)) { sawText = true; y++; continue; }
        let run = 0;
        while (y + run < limit && isBlank(y + run)) run++;
        if (sawText && run >= 12 && y + run < limit) crop = Math.max(0, y + run - 6);
        y += run;
      }
      const c2 = document.createElement('canvas'); c2.width = W; c2.height = H - crop;
      c2.getContext('2d').drawImage(c, 0, crop, W, H - crop, 0, 0, W, H - crop);
      return { crop, H, png: c2.toDataURL('image/jpeg', 0.92).split(',')[1] };
    }, b64);
    fs.writeFileSync(src, Buffer.from(out.png, 'base64'));
    console.log(`${f}: cropped ${out.crop}px of ${out.H} (${(out.crop / out.H * 100).toFixed(1)}%)`);
  }
  await browser.close();
  console.log('CROP DONE');
})().catch(e => { console.error(e); process.exit(1); });
