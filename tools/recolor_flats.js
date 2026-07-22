// Synthesizes flat product shots for colors Bella has no flat photo of
// (Vintage Denim, Purple Storm) by recoloring the Asphalt flat. The garment color
// is sampled from the real model photo's chest; texture/shading comes from the
// asphalt flat via per-channel multiplicative relighting. Background stays white.
const fs = require('fs');
const puppeteer = require('C:/Users/kevsc/Desktop/Claude/hyrox_pdf/node_modules/puppeteer');
const S = 'C:/Users/kevsc/AppData/Local/Temp/claude/C--Users-kevsc-Desktop-Claude/24432f1d-cd54-440d-8514-dd9fecb0259c/scratchpad';

const JOBS = [
  { src: S + '/bella-views2/denim_11_1.jpg', out: S + '/bella-flats/unisex-vintage-denim.jpg' },
  { src: S + '/bella-views2/storm_11_2.jpg', out: S + '/bella-flats/unisex-purple-storm.jpg' },
];
const BASE = S + '/bella-flats/unisex-asphalt.jpg';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('about:blank');
  const baseB64 = fs.readFileSync(BASE).toString('base64');
  for (const job of JOBS) {
    const srcB64 = fs.readFileSync(job.src).toString('base64');
    const outB64 = await page.evaluate(async (baseB64, srcB64) => {
      const load = b64 => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/jpeg;base64,' + b64; });
      const base = await load(baseB64), src = await load(srcB64);
      // 1) target color: median of center-chest patch on the model photo
      const sc = document.createElement('canvas'); sc.width = src.naturalWidth; sc.height = src.naturalHeight;
      const sx = sc.getContext('2d', { willReadFrequently: true }); sx.drawImage(src, 0, 0);
      const px = sx.getImageData(Math.round(sc.width * 0.44), Math.round(sc.height * 0.34), Math.round(sc.width * 0.12), Math.round(sc.height * 0.10)).data;
      const rs = [], gs = [], bs = [];
      for (let i = 0; i < px.length; i += 4) { rs.push(px[i]); gs.push(px[i + 1]); bs.push(px[i + 2]); }
      const med = a => { a.sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
      const target = [med(rs), med(gs), med(bs)];
      // 2) asphalt garment reference tone: median of chest patch on the flat
      const bc = document.createElement('canvas'); bc.width = base.naturalWidth; bc.height = base.naturalHeight;
      const bx = bc.getContext('2d', { willReadFrequently: true }); bx.drawImage(base, 0, 0);
      const bp = bx.getImageData(Math.round(bc.width * 0.40), Math.round(bc.height * 0.40), Math.round(bc.width * 0.20), Math.round(bc.height * 0.14)).data;
      const brs = [], bgs = [], bbs = [];
      for (let i = 0; i < bp.length; i += 4) { brs.push(bp[i]); bgs.push(bp[i + 1]); bbs.push(bp[i + 2]); }
      const ref = [med(brs), med(bgs), med(bbs)];
      // 3) relight: garment pixels scaled channel-wise by target/ref; background kept
      const img = bx.getImageData(0, 0, bc.width, bc.height);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        if (mn > 233 && mx - mn < 14) continue;            // white bg, soft shadow edge, neck label
        d[i]     = Math.min(255, r * target[0] / ref[0]);
        d[i + 1] = Math.min(255, g * target[1] / ref[1]);
        d[i + 2] = Math.min(255, b * target[2] / ref[2]);
      }
      bx.putImageData(img, 0, 0);
      return { b64: bc.toDataURL('image/jpeg', 0.92).split(',')[1], target, ref };
    }, baseB64, srcB64);
    fs.writeFileSync(job.out, Buffer.from(outB64.b64, 'base64'));
    console.log(job.out.split('/').pop(), 'target rgb', outB64.target, 'ref', outB64.ref);
  }
  await browser.close();
  console.log('RECOLOR DONE');
})().catch(e => { console.error(e); process.exit(1); });
