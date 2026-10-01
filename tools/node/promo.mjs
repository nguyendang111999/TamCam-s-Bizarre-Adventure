// Captures promotional screenshots (1280×720) for the itch.io page into dist/itch-page/.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const OUT = 'C:/Users/nguye/Projects/TamCam/dist/itch-page';
fs.mkdirSync(OUT, { recursive: true });
const lang = process.argv[2] || 'en';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--autoplay-policy=no-user-gesture-required'], defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 2 / 3 } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function fresh() {
  const p = await b.newPage();
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto('http://localhost:8765/index.html?dev=1');
  await p.waitForFunction(() => !document.getElementById('boot-btn').disabled);
  await p.evaluate((l) => TC.setLang(l), lang);
  await p.click('#boot-btn');
  await p.waitForFunction(() => TC.dev.title());
  return p;
}
// advance until predicate(page state) true; picks options by preference list
async function until(p, pred, prefs = [], max = 600) {
  for (let i = 0; i < max; i++) {
    const hit = await p.evaluate(pred);
    if (hit) return true;
    await p.evaluate((prefs) => {
      const o = TC.dev.opts();
      if (o) { TC.dev.pickId(prefs.find((x) => o.includes(x)) || o[0]); return; }
      if (TC.dev.prompt()) { TC.dev.press(); return; }
      if (TC.ui.isTyping()) TC.ui.finishTyping(); else TC.dev.advance();
    }, prefs);
    await sleep(260);
  }
  return false;
}
const n = (s) => `${OUT}/${lang}-${s}.png`;

// 1. title
let p = await fresh();
await sleep(2600);
await p.screenshot({ path: n('1-title') });

// 2. courtyard: the King's proposal to the bird
await p.evaluate(() => TC.dev.start('ch2', { v1: 'menacing' }, []));
await until(p, () => /sleeve|tay áo/i.test(TC.dev.box()) && !TC.ui.isTyping(), ['talk']);
await sleep(300);
await p.screenshot({ path: n('3-king') });

// 3. the loom wakes
await p.evaluate(() => TC.dev.start('ch3', { v2: 'coward' }, ['menacing']));
await until(p, () => /gouge|khoét/i.test(TC.dev.box()) && !TC.ui.isTyping());
await sleep(500);
await p.screenshot({ path: n('4-loom') });

// 3b. the fruit was Tấm all along (Kono Dio Da)
await p.evaluate(() => TC.dev.start('ch4', {}, ['menacing', 'hungry', 'coward']));
await until(p, () => /just a fruit|Tưởng chỉ là quả thị/i.test(TC.dev.box()) && !TC.ui.isTyping(), ['ask', 'bite', 'snatch'], 900);
await sleep(900);
await p.screenshot({ path: n('8-reveal') });

// 4. approach panel → stand card → rush
await p.evaluate(() => TC.dev.start('ch5', {}, ['menacing', 'sister', 'hungry']));
await until(p, () => !!TC.minigames._approachSfx, ['fight'], 900);
await sleep(700);
await p.evaluate(() => { document.getElementById('ui').style.visibility = 'hidden'; });
await p.screenshot({ path: n('2-approach') });
await p.evaluate(() => { document.getElementById('ui').style.visibility = ''; });
await until(p, () => !!document.querySelector('#overlay .ov svg text') && /STAND/.test(document.getElementById('overlay').textContent), ['fight'], 400);
await sleep(700);
await p.screenshot({ path: n('5-standcard') });
await until(p, () => TC.dev.prompt() && /MASH|BẤM/.test(document.getElementById('prompt').textContent), ['fight'], 400);
for (let i = 0; i < 22; i++) { await p.evaluate(() => TC.dev.press()); await sleep(90); }
await p.screenshot({ path: n('6-rush') });
await p.close();

// 5. true ending
p = await fresh();
await p.evaluate(() => TC.dev.start('test_true', {}, ['sister']));
await until(p, () => TC.dev.bg() === 'riverbank' && /now|nay/i.test(TC.dev.box()), [], 700);
await sleep(600);
await p.screenshot({ path: n('7-epilogue') });
await b.close();
console.log('done');
