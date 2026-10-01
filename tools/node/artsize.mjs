// Measures SVG size + build time of every art piece.
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
await p.goto('http://localhost:8765/tools/lab/art.html');
const r = await p.evaluate(async () => {
  const out = [];
  const time = async (name, fn) => { const t0 = performance.now(); const s = fn(); const t1 = performance.now(); const img = new Image(); img.src = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' })); await img.decode(); const c = document.createElement('canvas'); c.width = 1920; c.height = 1080; c.getContext('2d').drawImage(img, 0, 0, 1920, 1080); const t2 = performance.now(); out.push([name, (s.length / 1024).toFixed(0) + 'KB', (t1 - t0).toFixed(0) + 'ms build', (t2 - t1).toFixed(0) + 'ms decode+draw']); };
  for (const k of Object.keys(TC.art.bg)) await time('bg:' + k, TC.art.bg[k]);
  for (const k of Object.keys(TC.art.ch)) await time('ch:' + k, () => TC.art.ch[k]());
  return out;
});
r.forEach((x) => console.log(x.join('  ')));
await b.close();
