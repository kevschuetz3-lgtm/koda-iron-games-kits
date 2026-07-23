// Normalizes all 15 flat shirt photos onto identical canvases so every garment
// renders at the same scale: 900x950 frame, #f5f5f5 background, garment width
// exactly 78% of frame width, centered. Prints per-file garment metrics so the
// print/sleeve config can be set relative to the garment.
const fs = require('fs');
const path = require('path');
const puppeteer = require('C:/Users/kevsc/Desktop/Claude/hyrox_pdf/node_modules/puppeteer');

const SRC = 'C:/Users/kevsc/AppData/Local/Temp/claude/C--Users-kevsc-Desktop-Claude/24432f1d-cd54-440d-8514-dd9fecb0259c/scratchpad/bella-flats';
const DST = 'C:/Users/kevsc/Desktop/Claude/New Custom Apparel Website/assets/shirts';
const FRAME_W = 900, FRAME_H = 950, GARMENT_FRAC = 0.78, BG = '#f5f5f5';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('about:blank');
  const files = fs.readdirSync(SRC).filter(f => f.endsWith('.jpg') && !f.startsWith('swatch'));
  for (const f of files) {
    const b64 = fs.readFileSync(path.join(SRC, f)).toString('base64');
    const out = await page.evaluate(async (b64, FRAME_W, FRAME_H, GARMENT_FRAC, BG) => {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = 'data:image/jpeg;base64,' + b64; });
      const W = img.naturalWidth, H = img.naturalHeight;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(img, 0, 0);
      const d = x.getImageData(0, 0, W, H).data;
      // background color = median of top-left corner block
      const rs = [], gs = [], bs = [];
      for (let yy = 2; yy < 40; yy++) for (let xx = 2; xx < 40; xx++) {
        const i = (yy * W + xx) * 4; rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2]);
      }
      const med = a => { a.sort((p, q) => p - q); return a[Math.floor(a.length / 2)]; };
      const bg = [med(rs), med(gs), med(bs)];
      // garment bbox: pixels departing from bg
      let minX = W, minY = H, maxX = -1, maxY = -1;
      for (let yy = 0; yy < H; yy++) for (let xx = 0; xx < W; xx++) {
        const i = (yy * W + xx) * 4;
        if (Math.abs(d[i] - bg[0]) > 13 || Math.abs(d[i + 1] - bg[1]) > 13 || Math.abs(d[i + 2] - bg[2]) > 13) {
          if (xx < minX) minX = xx; if (xx > maxX) maxX = xx;
          if (yy < minY) minY = yy; if (yy > maxY) maxY = yy;
        }
      }
      const gw = maxX - minX + 1, gh = maxY - minY + 1;
      const scale = FRAME_W * GARMENT_FRAC / gw;
      const dw = gw * scale, dh = gh * scale;
      const dx = (FRAME_W - dw) / 2, dy = (FRAME_H - dh) / 2;
      const oc = document.createElement('canvas'); oc.width = FRAME_W; oc.height = FRAME_H;
      const ox = oc.getContext('2d');
      ox.fillStyle = BG; ox.fillRect(0, 0, FRAME_W, FRAME_H);
      ox.imageSmoothingQuality = 'high';
      ox.drawImage(c, minX, minY, gw, gh, dx, dy, dw, dh);
      return {
        b64: oc.toDataURL('image/jpeg', 0.92).split(',')[1],
        topPct: +(dy / FRAME_H * 100).toFixed(1),
        hPct: +(dh / FRAME_H * 100).toFixed(1),
        aspect: +(gh / gw).toFixed(3),
      };
    }, b64, FRAME_W, FRAME_H, GARMENT_FRAC, BG);
    fs.writeFileSync(path.join(DST, f), Buffer.from(out.b64, 'base64'));
    console.log(`${f}: garment top ${out.topPct}%  h ${out.hPct}%  aspect ${out.aspect}`);
  }
  await browser.close();
  console.log('NORMALIZE DONE');
})().catch(e => { console.error(e); process.exit(1); });
