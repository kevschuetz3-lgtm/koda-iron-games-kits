// Recon: inspect bellacanvas.com product page DOM to find color swatches + gallery images.
const puppeteer = require('C:/Users/kevsc/Desktop/Claude/hyrox_pdf/node_modules/puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1400, height: 1000 });
  await page.goto('https://www.bellacanvas.com/product/3001/Unisex-Jersey-Short-Sleeve-Tee.html', { waitUntil: 'networkidle2', timeout: 90000 });
  await new Promise(r => setTimeout(r, 3000));
  const info = await page.evaluate(() => {
    const out = { title: document.title, swatchSelectors: [], galleryImgs: [] };
    // look for anything that smells like a color swatch list
    const candidates = document.querySelectorAll('[class*="swatch"], [class*="color"], [data-color], [class*="Color"]');
    const seen = new Set();
    candidates.forEach(el => {
      const cls = (el.className || '').toString().slice(0, 80);
      const key = el.tagName + '|' + cls;
      if (seen.has(key) || seen.size > 40) return;
      seen.add(key);
      out.swatchSelectors.push({
        tag: el.tagName, cls,
        title: el.getAttribute('title') || el.getAttribute('data-color') || el.getAttribute('aria-label') || '',
        children: el.children.length,
      });
    });
    document.querySelectorAll('img').forEach(img => {
      if (out.galleryImgs.length < 30 && img.src && (img.src.includes('media') || img.src.includes('catalog') || img.src.includes('product'))) {
        out.galleryImgs.push({ src: img.src.slice(0, 180), alt: (img.alt || '').slice(0, 60), w: img.naturalWidth });
      }
    });
    return out;
  });
  console.log(JSON.stringify(info, null, 1).slice(0, 6000));
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
