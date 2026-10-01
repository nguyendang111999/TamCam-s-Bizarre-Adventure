// Plays to each scene from the art-feedback round and screenshots it in-game (1920×1080).
// usage: node feedback.mjs [outDir] [lang]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const OUT = process.argv[2] || 'C:/Users/nguye/AppData/Local/Temp/claude/C--Users-nguye-Projects-TamCam/52b3216d-c48d-4f08-b1a4-41349e04a42a/scratchpad/shots/feedback';
const lang = process.argv[3] || 'en';
fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'], defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const errs = [];
async function fresh() {
  const p = await b.newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:8765/index.html?dev=1');
  await p.waitForFunction(() => !document.getElementById('boot-btn').disabled);
  await p.evaluate((l) => TC.setLang(l), lang);
  await p.click('#boot-btn');
  await p.waitForFunction(() => TC.dev.title());
  return p;
}
async function until(p, pred, prefs = [], max = 700) {
  for (let i = 0; i < max; i++) {
    if (await p.evaluate(pred)) return true;
    await p.evaluate((prefs) => {
      const o = TC.dev.opts();
      if (o) { TC.dev.pickId(prefs.find((x) => o.includes(x)) || o[0]); return; }
      if (TC.dev.prompt()) { TC.dev.press(); return; }
      if (TC.ui.isTyping()) TC.ui.finishTyping(); else TC.dev.advance();
    }, prefs);
    await sleep(240);
  }
  console.log('TIMEOUT waiting for', pred.toString());
  return false;
}
const shot = async (p, name, settle = 500) => { await sleep(settle); await p.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };
const boxHas = (re) => new Function(`return ${re}.test(TC.dev.box()) && !TC.ui.isTyping();`);

const p = await fresh();
await p.evaluate(() => TC.dev.start('ch1', {}, []));
await until(p, boxHas('/sharpened it with love|mài nó bằng cả tấm lòng/'), ['walk']);
await shot(p, '1-axe', 700);
await until(p, () => !!TC.dev.opts() && TC.dev.opts().includes('axe'), ['walk']);
await p.evaluate(() => TC.dev.pickId('axe'));
await until(p, boxHas('/handle fits your hand|vừa khít tay/'));
await shot(p, '1b-axe-held', 600);

await p.evaluate(() => TC.dev.start('ch2', { v1: 'menacing' }, ['menacing']));
await until(p, boxHas('/sleeve|tay áo/'), ['talk']);
await shot(p, '2-king');

await p.evaluate(() => TC.dev.start('ch4', {}, ['menacing', 'hungry', 'coward']));
await until(p, boxHas('/drop into my bag|rụng vào bị/'), ['ask', 'bite']);
await shot(p, '3-oldwoman');
await until(p, boxHas('/just a fruit|Tưởng chỉ là quả thị/') , ['ask', 'bite', 'snatch'], 900);
await shot(p, '4-reveal', 900);

await p.evaluate(() => TC.dev.start('ch5', {}, ['menacing', 'sister', 'hungry']));
await until(p, () => /approaching|tiến lại gần/i.test(TC.dev.box()) && !TC.ui.isTyping(), ['fight'], 900);
await shot(p, '5a-approach-line', 300);
await until(p, () => !!TC.minigames._approachSfx, ['fight'], 900);
await sleep(900);
await p.evaluate(() => { document.getElementById('ui').style.visibility = 'hidden'; });
await shot(p, '5b-panel', 200);
await p.evaluate(() => { document.getElementById('ui').style.visibility = ''; });
await until(p, () => /MAMMA MIA/.test(document.getElementById('overlay').textContent), ['fight'], 500);
await shot(p, '5c-standcard-cam', 900);
await until(p, () => TC.dev.prompt() && /MASH|BẤM/.test(document.getElementById('prompt').textContent), ['fight'], 400);
for (let i = 0; i < 24; i++) { await p.evaluate(() => TC.dev.press()); await sleep(80); }
await shot(p, '5d-rush', 100);
await p.close();

// run-away ending: Cám turns tail
const q = await fresh();
await q.evaluate(() => TC.dev.start('ch5', {}, ['coward']));
await until(q, () => !!TC.dev.opts() && TC.dev.opts().includes('run'), [], 900);
await q.evaluate(() => TC.dev.pickId('run'));
await sleep(450);
await shot(q, '5e-run', 0);
await b.close();
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no console errors');
