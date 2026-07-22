// Renders the printer's .ai art into web assets for the kit builder.
// - team-shirt.pdf (AI w/ PDF stream): split into red mask (VI+line) and dark mask
//   (sample team name ABOVE the line -> measured then discarded; KODA IRON GAMES 26 below -> kept)
// - sleeve-logo.pdf page 2 (black version): alpha mask
// - co-flag .ai (AI8 PostScript, no PDF stream): parsed to SVG, rasterized to alpha mask
// - contact sheet of all shirt photos + masks for visual verification
const fs = require('fs');
const path = require('path');
const puppeteer = require('C:/Users/kevsc/Desktop/Claude/hyrox_pdf/node_modules/puppeteer');

const SCRATCH = 'C:/Users/kevsc/AppData/Local/Temp/claude/C--Users-kevsc-Desktop-Claude/24432f1d-cd54-440d-8514-dd9fecb0259c/scratchpad';
const PROJ = 'C:/Users/kevsc/Desktop/Claude/New Custom Apparel Website';
const ASSETS = path.join(PROJ, 'assets');

// ---------- AI8 PostScript -> SVG parser (for the CO flag) ----------
function ai8ToSvg(file) {
  const str = fs.readFileSync(file, 'latin1');
  const start = str.indexOf('%%EndSetup');
  const end = str.indexOf('%%PageTrailer');
  let art = str.substring(start + 10, end);
  // strip comment lines
  art = art.split(/\r?\n/).filter(l => !l.startsWith('%')).join('\n');
  // tokenize: parens strings, numbers, operators
  const tokens = art.match(/\([^)]*\)|[-\d.]+|[A-Za-z*][A-Za-z0-9*]*/g) || [];
  const stack = [];
  let cur = null;          // current subpath string
  let curStart = null;     // subpath start point for close
  let subpaths = [];       // finished subpaths awaiting paint
  let compound = false;
  let compoundPaths = [];
  let last = [0, 0];
  const out = [];          // emitted svg path d strings
  let ops = {};
  const num = v => parseFloat(v);
  function endSubpath() { if (cur) { subpaths.push(cur); cur = null; } }
  function paint(fill) {
    endSubpath();
    if (!subpaths.length) return;
    if (compound) { compoundPaths.push(...subpaths); subpaths = []; return; }
    if (fill) out.push(subpaths.join(' '));
    subpaths = [];
  }
  for (const t of tokens) {
    if (/^[-\d.]+$/.test(t)) { stack.push(num(t)); continue; }
    if (t.startsWith('(')) { stack.length = 0; continue; }
    ops[t] = (ops[t] || 0) + 1;
    switch (t) {
      case 'm': {
        endSubpath();
        const y = stack.pop(), x = stack.pop();
        cur = `M ${x} ${-y}`; curStart = [x, y]; last = [x, y]; break;
      }
      case 'l': case 'L': {
        const y = stack.pop(), x = stack.pop();
        cur += ` L ${x} ${-y}`; last = [x, y]; break;
      }
      case 'c': case 'C': {
        const y3 = stack.pop(), x3 = stack.pop(), y2 = stack.pop(), x2 = stack.pop(), y1 = stack.pop(), x1 = stack.pop();
        cur += ` C ${x1} ${-y1} ${x2} ${-y2} ${x3} ${-y3}`; last = [x3, y3]; break;
      }
      case 'v': case 'V': {
        const y3 = stack.pop(), x3 = stack.pop(), y2 = stack.pop(), x2 = stack.pop();
        cur += ` C ${last[0]} ${-last[1]} ${x2} ${-y2} ${x3} ${-y3}`; last = [x3, y3]; break;
      }
      case 'y': case 'Y': {
        const y3 = stack.pop(), x3 = stack.pop(), y1 = stack.pop(), x1 = stack.pop();
        cur += ` C ${x1} ${-y1} ${x3} ${-y3} ${x3} ${-y3}`; last = [x3, y3]; break;
      }
      case 'f': case 'F': case 'b': case 'B': paint(true); stack.length = 0; break;
      case 's': case 'S': case 'n': case 'N': paint(false); stack.length = 0; break;
      case '*u': compound = true; compoundPaths = []; stack.length = 0; break;
      case '*U':
        compound = false;
        if (subpaths.length) compoundPaths.push(...subpaths);
        subpaths = [];
        if (compoundPaths.length) out.push(compoundPaths.join(' '));
        compoundPaths = []; stack.length = 0; break;
      default: stack.length = 0; break;
    }
  }
  paint(true); // trailing safety
  // bbox from all coordinates in emitted paths
  let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
  for (const d of out) {
    const nums = d.match(/[-\d.]+/g).map(parseFloat);
    for (let i = 0; i < nums.length; i += 2) {
      minX = Math.min(minX, nums[i]); maxX = Math.max(maxX, nums[i]);
      minY = Math.min(minY, nums[i + 1]); maxY = Math.max(maxY, nums[i + 1]);
    }
  }
  const pad = (maxX - minX) * 0.01;
  const vb = `${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`;
  const pathsSvg = out.map(d => `<path d="${d}" fill="#000" fill-rule="evenodd"/>`).join('\n');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">\n${pathsSvg}\n</svg>`;
  return { svg, ops, nPaths: out.length, w: maxX - minX, h: maxY - minY };
}

(async () => {
  const flag = ai8ToSvg(path.join(SCRATCH, 'ai/co-flag.pdf'));
  console.log('CO flag parsed: paths=', flag.nPaths, 'ops=', JSON.stringify(flag.ops), 'aspect=', (flag.w / flag.h).toFixed(3));
  fs.writeFileSync(path.join(SCRATCH, 'co-flag.svg'), flag.svg);

  const teamB64 = fs.readFileSync(path.join(SCRATCH, 'ai/team-shirt.pdf')).toString('base64');
  const sleeveB64 = fs.readFileSync(path.join(SCRATCH, 'ai/sleeve-logo.pdf')).toString('base64');

  const browser = await puppeteer.launch({ headless: 'new', args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage();
  page.on('console', m => console.log('[page]', m.text().slice(0, 300)));
  await page.goto('about:blank');
  await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js' });
  await page.evaluate(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  });

  const result = await page.evaluate(async (teamB64, sleeveB64, flagSvg) => {
    function b64ToU8(b64) {
      const bin = atob(b64); const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return u8;
    }
    async function renderPdf(b64, pageNum, targetW) {
      const doc = await pdfjsLib.getDocument({ data: b64ToU8(b64) }).promise;
      const pg = await doc.getPage(pageNum);
      const vp1 = pg.getViewport({ scale: 1 });
      const scale = targetW / vp1.width;
      const vp = pg.getViewport({ scale });
      const c = document.createElement('canvas');
      c.width = Math.round(vp.width); c.height = Math.round(vp.height);
      const ctx = c.getContext('2d', { willReadFrequently: true });
      await pg.render({ canvasContext: ctx, viewport: vp }).promise;
      return { canvas: c, ctx, nPages: doc.numPages };
    }
    // classify pixels -> {red: ImageData, dark: ImageData} with alpha masks (black ink)
    function classify(ctx, w, h) {
      const src = ctx.getImageData(0, 0, w, h);
      const d = src.data;
      // detect painted-white-background PDFs
      let opaqueWhite = 0, total = w * h;
      for (let i = 0; i < d.length; i += 4 * 997) {
        if (d[i + 3] > 250 && d[i] > 250 && d[i + 1] > 250 && d[i + 2] > 250) opaqueWhite++;
      }
      const whiteBg = opaqueWhite / (total / 997) > 0.3;
      const red = new ImageData(w, h), dark = new ImageData(w, h);
      let redColor = null, darkColor = null;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
        let alpha;
        if (whiteBg) alpha = a > 0 ? (255 - Math.min(r, g, b)) / 255 * (a / 255) : 0;
        else alpha = a / 255;
        if (alpha < 0.02) continue;
        const redness = r - Math.max(g, b);
        if (redness > 35 && r > 90) {
          // red art; recover full-strength alpha for white-blended edge pixels
          let aa = whiteBg ? Math.min(1, (255 - g) / 223) : alpha;
          red.data[i] = 0; red.data[i + 1] = 0; red.data[i + 2] = 0; red.data[i + 3] = Math.round(aa * 255);
          if (!redColor && aa > 0.95) redColor = [r, g, b];
        } else {
          let aa = whiteBg ? Math.min(1, (255 - Math.max(r, g, b)) / 220) : alpha;
          dark.data[i] = 0; dark.data[i + 1] = 0; dark.data[i + 2] = 0; dark.data[i + 3] = Math.round(aa * 255);
          if (!darkColor && aa > 0.95 && a > 250) darkColor = [r, g, b];
        }
      }
      return { red, dark, redColor, darkColor, whiteBg };
    }
    function bbox(img) {
      const { width: w, height: h, data } = img;
      let minX = w, minY = h, maxX = -1, maxY = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 10) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
      return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    }
    function rowHist(img) {
      const { width: w, height: h, data } = img;
      const rows = new Array(h).fill(0);
      for (let y = 0; y < h; y++) { let c = 0; for (let x = 0; x < w; x++) if (data[(y * w + x) * 4 + 3] > 10) c++; rows[y] = c; }
      return rows;
    }
    function cropToPng(img, box) {
      const c = document.createElement('canvas');
      c.width = box.w; c.height = box.h;
      const ctx = c.getContext('2d');
      const full = document.createElement('canvas');
      full.width = img.width; full.height = img.height;
      full.getContext('2d').putImageData(img, 0, 0);
      ctx.drawImage(full, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      return c.toDataURL('image/png');
    }
    const out = { logs: [] };

    // ---- team shirt logo ----
    const team = await renderPdf(teamB64, 1, 2600);
    const w = team.canvas.width, h = team.canvas.height;
    const cls = classify(team.ctx, w, h);
    out.logs.push('team whiteBg=' + cls.whiteBg + ' redColor=' + JSON.stringify(cls.redColor) + ' darkColor=' + JSON.stringify(cls.darkColor));
    const redBox = bbox(cls.red);
    // split dark art into name (above line) vs KIG26 (below) via largest y-gap
    const rows = rowHist(cls.dark);
    const darkBox = bbox(cls.dark);
    let gaps = [], inGap = false, gs = 0;
    for (let y = darkBox.y; y <= darkBox.y + darkBox.h; y++) {
      if (rows[y] === 0) { if (!inGap) { inGap = true; gs = y; } }
      else if (inGap) { inGap = false; gaps.push([gs, y - 1]); }
    }
    gaps.sort((a, b2) => (b2[1] - b2[0]) - (a[1] - a[0]));
    const gap = gaps[0];
    const splitY = Math.round((gap[0] + gap[1]) / 2);
    out.logs.push('dark y-gaps=' + JSON.stringify(gaps.slice(0, 3)) + ' splitY=' + splitY);
    // name mask = dark above split; kig26 = dark below
    const nameImg = new ImageData(w, h), kigImg = new ImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4 + 3;
      if (cls.dark.data[i] > 0) {
        (y < splitY ? nameImg : kigImg).data[i] = cls.dark.data[i];
      }
    }
    const nameBox = bbox(nameImg), kigBox = bbox(kigImg);
    out.teamShirt = {
      canvasW: w, canvasH: h,
      redBox, nameBox, kigBox,
      redColor: cls.redColor, darkColor: cls.darkColor,
      viPng: cropToPng(cls.red, redBox),
      kigPng: cropToPng(kigImg, kigBox)
    };

    // ---- sleeve logo (page 2 = black) ----
    const sleeve = await renderPdf(sleeveB64, 2, 1800);
    const scls = classify(sleeve.ctx, sleeve.canvas.width, sleeve.canvas.height);
    // whole art -> dark mask (black page has no red)
    const sAll = new ImageData(sleeve.canvas.width, sleeve.canvas.height);
    for (let i = 3; i < sAll.data.length; i += 4) sAll.data[i] = Math.max(scls.dark.data[i], scls.red.data[i]);
    const sBox = bbox(sAll);
    out.sleeve = { box: sBox, png: cropToPng(sAll, sBox), nPages: sleeve.nPages };

    // ---- CO flag from parsed SVG ----
    const img = new Image();
    const svgUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(flagSvg)));
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = svgUrl; });
    const fw = 1800, fh = Math.round(1800 * img.naturalHeight / img.naturalWidth);
    const fc = document.createElement('canvas'); fc.width = fw; fc.height = fh;
    const fctx = fc.getContext('2d', { willReadFrequently: true });
    fctx.drawImage(img, 0, 0, fw, fh);
    // normalize to pure-black alpha mask
    const fd = fctx.getImageData(0, 0, fw, fh);
    for (let i = 0; i < fd.data.length; i += 4) {
      const a = fd.data[i + 3];
      fd.data[i] = 0; fd.data[i + 1] = 0; fd.data[i + 2] = 0; fd.data[i + 3] = a;
    }
    const fBox = bbox(fd);
    out.flag = { box: fBox, png: cropToPng(fd, fBox) };
    return out;
  }, teamB64, sleeveB64, flag.svg);

  for (const l of result.logs) console.log('LOG:', l);
  const t = result.teamShirt;
  console.log('redBox=', JSON.stringify(t.redBox));
  console.log('nameBox=', JSON.stringify(t.nameBox));
  console.log('kigBox=', JSON.stringify(t.kigBox));
  console.log('sleeve box=', JSON.stringify(result.sleeve.box), 'pages=', result.sleeve.nPages);
  console.log('flag box=', JSON.stringify(result.flag.box));

  const save = (dataUrl, file) => fs.writeFileSync(path.join(ASSETS, file), Buffer.from(dataUrl.split(',')[1], 'base64'));
  save(t.viPng, 'vi-line.png');
  save(t.kigPng, 'kig26.png');
  save(result.sleeve.png, 'sleeve.png');
  save(result.flag.png, 'co-flag.png');

  // layout.json: geometry normalized to the red (VI+line) box as the reference frame
  const rb = t.redBox, nb = t.nameBox, kb = t.kigBox;
  const layout = {
    ref: 'vi',                             // all rel values are fractions of vi width
    vi: { w: 1, h: rb.h / rb.w },
    kig26: { x: (kb.x - rb.x) / rb.w, y: (kb.y - rb.y) / rb.w, w: kb.w / rb.w, h: kb.h / rb.w },
    name: {
      left: (nb.x - rb.x) / rb.w,
      right: (nb.x + nb.w - rb.x) / rb.w,
      bottomGap: (rb.y - (nb.y + nb.h)) / rb.w, // gap between name bottom and vi top
      sampleH: nb.h / rb.w
    },
    colors: { red: t.redColor, dark: t.darkColor },
    flagAspect: result.flag.box.w / result.flag.box.h,
    sleeveAspect: result.sleeve.box.w / result.sleeve.box.h
  };
  fs.writeFileSync(path.join(ASSETS, 'layout.json'), JSON.stringify(layout, null, 2));
  console.log('layout.json:', JSON.stringify(layout));

  // ---- contact sheet ----
  const shirts = fs.readdirSync(path.join(ASSETS, 'shirts')).filter(f => f.endsWith('.jpg'));
  const cells = shirts.map(f =>
    `<div class="cell"><img src="file:///${ASSETS.replace(/\\/g, '/')}/shirts/${f}"><div>${f}</div></div>`).join('');
  const masks = ['vi-line.png', 'kig26.png', 'sleeve.png', 'co-flag.png'].map(f =>
    `<div class="cell mask"><img src="file:///${ASSETS.replace(/\\/g, '/')}/${f}"><div>${f}</div></div>`).join('');
  const sheetHtml = `<!doctype html><style>
    body{margin:0;background:#fff;font:12px sans-serif}
    .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;padding:8px}
    .cell{text-align:center;border:1px solid #ddd;padding:4px}
    .cell img{width:100%;height:200px;object-fit:contain}
    .mask{background:#7fb2d9}
  </style><div class="grid">${cells}${masks}</div>`;
  const sheetPath = path.join(SCRATCH, 'contact-sheet.html');
  fs.writeFileSync(sheetPath, sheetHtml);
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 1400, height: 1700 });
  await p2.goto('file:///' + sheetPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await p2.screenshot({ path: path.join(SCRATCH, 'contact-sheet.png'), fullPage: true });
  await browser.close();
  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
