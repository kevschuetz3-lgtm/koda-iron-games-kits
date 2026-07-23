/* Koda Iron Games 26 Team Kit Builder — shared config + lockup engine.
   Used by index.html (live site) and tools/tune.html (dev placement tuner). */

const API = 'https://script.google.com/macros/s/AKfycbyk14st_Ix70GM0T2I8aKRU9HRBlotk_Up-Ikh5MHxYuUdDj4xIvj36r8lvQh15gPvm/exec';

const DIVISIONS = [
  { id: 'RX Male', top: 'RX', sub: 'Male' },
  { id: 'RX Female', top: 'RX', sub: 'Female' },
  { id: 'Scaled Male', top: 'Scaled', sub: 'Male' },
  { id: 'Scaled Female', top: 'Scaled', sub: 'Female' },
  { id: 'Masters Male', top: 'Masters', sub: 'Male' },
  { id: 'Masters Female', top: 'Masters', sub: 'Female' },
];

// Print geometry per shirt (calibrated against each photo on the tuner grid):
// chest = {cy: vertical CENTER of the print as % of photo height, w: print width as % of photo width}
// sleeve = {x: center %, y: top %, w: width %, rot: deg}. bg = background-position for fabric detail chips.
const SHIRTS = [
  { id: 'unisex-red',             garment: 'unisex', label: 'Red',             product: 'Bella+Canvas 3001 Unisex Tee', img: 'assets/shirts/unisex-red.jpg',             sw: '#c8392e', chest: { cy: 36, w: 37 }, sleeve: { x: 84, y: 29.5, w: 8.5, rot: 32 }, bg: '50% 45%' },
  { id: 'unisex-asphalt',         garment: 'unisex', label: 'Asphalt',         product: 'Bella+Canvas 3001 Unisex Tee', img: 'assets/shirts/unisex-asphalt.jpg',         sw: '#4c4a48', chest: { cy: 36, w: 37 }, sleeve: { x: 84, y: 29.5, w: 8.5, rot: 32 }, bg: '50% 45%' },
  { id: 'unisex-black',           garment: 'unisex', label: 'Black',           product: 'Bella+Canvas 3001 Unisex Tee', img: 'assets/shirts/unisex-black.jpg',           sw: '#1b1b1b', chest: { cy: 36, w: 37 }, sleeve: { x: 84, y: 29.5, w: 8.5, rot: 32 }, bg: '50% 45%' },
  { id: 'unisex-vintage-denim',   garment: 'unisex', label: 'Vintage Denim',   product: 'Bella+Canvas 3001 Unisex Tee', img: 'assets/shirts/unisex-vintage-denim.jpg',   sw: '#8a9aab', chest: { cy: 36, w: 37 }, sleeve: { x: 84, y: 29.5, w: 8.5, rot: 32 }, bg: '50% 45%' },
  { id: 'unisex-synthetic-green', garment: 'unisex', label: 'Synthetic Green', product: 'Bella+Canvas 3001 Unisex Tee', img: 'assets/shirts/unisex-synthetic-green.jpg', sw: '#2aa457', chest: { cy: 36, w: 37 }, sleeve: { x: 84, y: 29.5, w: 8.5, rot: 32 }, bg: '50% 45%' },
  { id: 'unisex-berry',           garment: 'unisex', label: 'Berry',           product: 'Bella+Canvas 3001 Unisex Tee', img: 'assets/shirts/unisex-berry.jpg',           sw: '#d54387', chest: { cy: 36, w: 37 }, sleeve: { x: 84, y: 29.5, w: 8.5, rot: 32 }, bg: '50% 45%' },
  { id: 'unisex-purple-storm',    garment: 'unisex', label: 'Purple Storm',    product: 'Bella+Canvas 3001 Unisex Tee', img: 'assets/shirts/unisex-purple-storm.jpg',    sw: '#6a5b62', chest: { cy: 36, w: 37 }, sleeve: { x: 84, y: 29.5, w: 8.5, rot: 32 }, bg: '50% 45%' },
  { id: 'unisex-lavender-blue',   garment: 'unisex', label: 'Lavender Blue',   product: 'Bella+Canvas 3001 Unisex Tee', img: 'assets/shirts/unisex-lavender-blue.jpg',   sw: '#8d99cf', chest: { cy: 36, w: 37 }, sleeve: { x: 84, y: 29.5, w: 8.5, rot: 32 }, bg: '50% 45%' },
  { id: 'crop-heather-dust',      garment: 'crop',   label: 'Heather Dust',    product: 'Bella+Canvas 8882 Flowy Crop', img: 'assets/shirts/crop-heather-dust.jpg', sw: '#e0d6cb', chest: { cy: 46, w: 37 }, sleeve: { x: 84.5, y: 38, w: 9.5, rot: 35 }, bg: '50% 45%' },
  { id: 'crop-black',             garment: 'crop',   label: 'Black',           product: 'Bella+Canvas 8882 Flowy Crop', img: 'assets/shirts/crop-black.jpg',        sw: '#1a1a1a', chest: { cy: 46, w: 37 }, sleeve: { x: 84.5, y: 38, w: 9.5, rot: 35 }, bg: '50% 45%' },
  { id: 'crop-solid-vintage-navy',garment: 'crop',   label: 'Vintage Navy',    product: 'Bella+Canvas 1010 Baby Tee', img: 'assets/shirts/crop-solid-vintage-navy.jpg', sw: '#46525e', chest: { cy: 42, w: 37 }, sleeve: { x: 83, y: 34.5, w: 7, rot: 30 }, bg: '50% 45%' },
  { id: 'crop-solid-maroon',      garment: 'crop',   label: 'Maroon',          product: 'Bella+Canvas 1010 Baby Tee', img: 'assets/shirts/crop-solid-maroon.jpg',   sw: '#5c2431', chest: { cy: 42, w: 37 }, sleeve: { x: 83, y: 34.5, w: 7, rot: 30 }, bg: '50% 45%' },
  { id: 'crop-solid-forest',      garment: 'crop',   label: 'Forest',          product: 'Bella+Canvas 1010 Baby Tee', img: 'assets/shirts/crop-solid-forest.jpg',   sw: '#173428', chest: { cy: 42, w: 37 }, sleeve: { x: 83, y: 34.5, w: 7, rot: 30 }, bg: '50% 45%' },
  { id: 'crop-solid-pink',        garment: 'crop',   label: 'Pink',            product: 'Bella+Canvas 1010 Baby Tee', img: 'assets/shirts/crop-solid-pink.jpg',     sw: '#f5a3b0', chest: { cy: 42, w: 37 }, sleeve: { x: 83, y: 34.5, w: 7, rot: 30 }, bg: '50% 45%' },
  { id: 'crop-solid-cocoa',       garment: 'crop',   label: 'Cocoa',           product: 'Bella+Canvas 1010 Baby Tee', img: 'assets/shirts/crop-solid-cocoa.jpg',    sw: '#5d4038', chest: { cy: 42, w: 37 }, sleeve: { x: 83, y: 34.5, w: 7, rot: 30 }, bg: '50% 45%' },
];

const VINYL = [
  { name: 'Black',             hex: '#1a1a1a', light: 0 },
  { name: 'White',             hex: '#ffffff', light: 1 },
  { name: 'Green',             hex: '#0e7c3f', light: 0 },
  { name: 'Bright Royal Blue', hex: '#1526a8', light: 0 },
  { name: 'Aqua',              hex: '#00aec9', light: 0 },
  { name: 'Red',               hex: '#d4291a', light: 0 },
  { name: 'Neon Pink',         hex: '#ff2f92', light: 0 },
  { name: 'Orchid Purple',     hex: '#a9569f', light: 0 },
  { name: 'Yellow',            hex: '#f2d13e', light: 1 },
  { name: 'Grey',              hex: '#8b8e90', light: 0 },
];

const SIZES_UNISEX = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SIZES_CROP = ['S', 'M', 'L', 'XL', 'XXL'];   // crops don't come in XS

// Lockup geometry measured from the printer's .ai (fractions of the VI+line width)
const LK = {
  viH: 0.10176,
  kig: { x: 0.38766, y: 0.03480, w: 0.61013, h: 0.04758 },
  name: { left: -0.01278, bottomGap: 0.0207, sampleH: 0.1145 },
  maxSingleH: 0.252,      // "ABC"-style giant single-line cap height
  maxTwoLineH: 0.148,     // per-line cap height in 2-line mode
  minSingleH: 0.094,      // below this a one-liner wraps to two lines
};

/* ── Lockup layout math (shared by DOM preview + canvas email mockups) ──
   Tungsten Bold cap-height ≈ 0.72em → font-size = capH / 0.72. */
const CAP = 0.72;
const NAME_FONT = "Tungsten, 'Arial Narrow', sans-serif";
const NAME_WEIGHT = 900;   // Tungsten Black — matches the printer's sample letterforms
const measureCtx = document.createElement('canvas').getContext('2d');
// Measure at a fixed 100px then scale — capH values here are tiny fractions of the
// lockup width, and sub-pixel font sizes make measureText unreliable.
function measureName(text, capH) {
  measureCtx.font = `${NAME_WEIGHT} 100px ${NAME_FONT}`;
  return measureCtx.measureText(text).width / 100 * (capH / CAP);
}
function layoutName(raw) {
  const text = (raw || 'YOUR TEAM NAME').toUpperCase().trim().replace(/\s+/g, ' ');
  const maxW = 1 - LK.name.left;
  let capH = LK.maxSingleH;
  const w = measureName(text, capH);
  if (w > maxW) capH = capH * maxW / w;
  if (capH >= LK.minSingleH || !text.includes(' ')) {
    return { lines: [text], capH: Math.max(capH, 0.035), single: true };
  }
  const words = text.split(' ');
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(' '), l2 = words.slice(i).join(' ');
    const wide = Math.max(measureName(l1, 1), measureName(l2, 1)); // width per unit of capH
    if (!best || wide < best.wide) best = { l1, l2, wide };
  }
  const capH2 = Math.min(LK.maxTwoLineH, maxW / best.wide);
  return { lines: [best.l1, best.l2], capH: Math.max(capH2, 0.03), single: false };
}

// Total lockup height (px) for a given name at a given lockup pixel width.
function lockupHeight(teamName, w) {
  const lay = layoutName(teamName);
  const lineGap = lay.single ? 0 : lay.capH * 0.28;
  const nameH = lay.single ? lay.capH : lay.capH * 2 + lineGap;
  return (nameH + LK.name.bottomGap + Math.max(LK.viH, LK.kig.y + LK.kig.h)) * w;
}

// Render the lockup into `el` at a given pixel width. c1 = name/KIG26 color, c2 = VI color.
function renderLockup(el, widthPx, teamName, c1, c2) {
  const lay = layoutName(teamName);
  const lineGap = lay.single ? 0 : lay.capH * 0.28;
  const nameH = lay.single ? lay.capH : lay.capH * 2 + lineGap;
  const fontPx = lay.capH * widthPx / CAP;
  const totalH = (nameH + LK.name.bottomGap + Math.max(LK.viH, LK.kig.y + LK.kig.h)) * widthPx;
  el.innerHTML = '';
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.style.height = totalH + 'px';
  const nm = document.createElement('div');
  nm.className = 'lk-name';
  nm.style.cssText = `position:absolute;left:${LK.name.left * widthPx}px;top:0;color:${c1};` +
    `font:${NAME_WEIGHT} ${fontPx}px ${NAME_FONT};text-transform:uppercase;white-space:nowrap;` +
    `line-height:${(lay.capH + lineGap) / lay.capH * CAP};transform:translateY(${-fontPx * (1 - CAP) * 0.47}px);`;
  lay.lines.forEach(l => { const d = document.createElement('div'); d.textContent = l; nm.appendChild(d); });
  el.appendChild(nm);
  const viTop = (nameH + LK.name.bottomGap) * widthPx;
  const vi = document.createElement('div');
  vi.style.cssText = `position:absolute;left:0;top:${viTop}px;width:${widthPx}px;height:${LK.viH * widthPx}px;background:${c2};` +
    maskCss('assets/vi-line.png');
  el.appendChild(vi);
  const kig = document.createElement('div');
  kig.style.cssText = `position:absolute;left:${LK.kig.x * widthPx}px;top:${viTop + LK.kig.y * widthPx}px;` +
    `width:${LK.kig.w * widthPx}px;height:${LK.kig.h * widthPx}px;background:${c1};` + maskCss('assets/kig26.png');
  el.appendChild(kig);
  return totalH;
}
function maskCss(url) {
  return `-webkit-mask-image:url(${url});mask-image:url(${url});-webkit-mask-size:100% 100%;mask-size:100% 100%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;`;
}

/* ── Canvas rendering (order-email mockups) ── */
const imgCache = {};
function loadImg(src) {
  return imgCache[src] || (imgCache[src] = new Promise((res, rej) => {
    const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src;
  }));
}
async function tintedMask(src, color) {
  const m = await loadImg(src);
  const c = document.createElement('canvas'); c.width = m.naturalWidth; c.height = m.naturalHeight;
  const x = c.getContext('2d');
  x.drawImage(m, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  return c;
}
async function drawLockup(x, px, py, w, teamName, c1, c2) {
  const lay = layoutName(teamName);
  const lineGap = lay.single ? 0 : lay.capH * 0.28;
  const nameH = lay.single ? lay.capH : lay.capH * 2 + lineGap;
  const fontPx = lay.capH * w / CAP;
  try { await document.fonts.load(`${NAME_WEIGHT} ${Math.max(10, Math.round(fontPx))}px Tungsten`); } catch (e) {}
  x.font = `${NAME_WEIGHT} ${fontPx}px ${NAME_FONT}`;
  x.fillStyle = c1;
  x.textBaseline = 'alphabetic';
  lay.lines.forEach((l, i) => {
    const baseY = py + (lay.capH + i * (lay.capH + lineGap)) * w;
    x.fillText(l, px + LK.name.left * w, baseY);
  });
  const viTop = py + (nameH + LK.name.bottomGap) * w;
  const vi = await tintedMask('assets/vi-line.png', c2);
  x.drawImage(vi, px, viTop, w, LK.viH * w);
  const kig = await tintedMask('assets/kig26.png', c1);
  x.drawImage(kig, px + LK.kig.x * w, viTop + LK.kig.y * w, LK.kig.w * w, LK.kig.h * w);
}
