// Headless autoplayer for TẤM CÁM'S BIZARRE ADVENTURE.
// usage: node play.mjs --plan "walk,axe,chop,..." [--lang vi] [--shots dir] [--skip] [--start ch3 --voices a,b --flags json] [--scale .5] [--max 4000]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]] : a), []));
const plan = (args.plan || '').split(',').filter(Boolean);
const shots = args.shots || 'C:/Users/nguye/AppData/Local/Temp/claude/C--Users-nguye-Projects-TamCam/52b3216d-c48d-4f08-b1a4-41349e04a42a/scratchpad/shots/run';
fs.mkdirSync(shots, { recursive: true });
const scale = parseFloat(args.scale || '0.5');
const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--autoplay-policy=no-user-gesture-required', '--disable-gpu', '--hide-scrollbars'],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: scale },
});
const page = await browser.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[${m.type()}] ${m.text()}`); });
page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message));
await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) { } });
await page.goto(`http://localhost:8799/html/12345/index.html?dev=1${args.lang ? '&x=' : ''}`, { waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('boot-btn').disabled, { timeout: 15000 });
if (args.lang) await page.evaluate((l) => TC.setLang(l), args.lang);
await page.click('#boot-btn');
await page.waitForFunction(() => TC.dev.title(), { timeout: 15000 });
await new Promise((r) => setTimeout(r, 1200));
let n = 0;
const shot = async (name) => { const f = `${shots}/${String(n++).padStart(3, '0')}_${name}.png`; await page.screenshot({ path: f }); return f; };
await shot('title');
if (args.start) await page.evaluate((c, v, f) => TC.dev.start(c, f ? JSON.parse(f) : {}, v ? v.split(',') : []), args.start, args.voices || '', args.flags || '');
else await page.evaluate(() => document.querySelector('[data-a="new"]').click());
const setSkip = async () => { if (args.skip) await page.evaluate(() => { TC.state.skip = true; }); };
let lastBg = null, lastBox = '', stuck = 0, picks = [];
// --every N: timed screenshots (auto mode — the game advances itself)
let lastShot = Date.now();
if (args.every) await page.evaluate(() => { TC.state.auto = true; TC.persist.data.settings.autoDelay = 0; });
const t0 = Date.now();
for (let step = 0; step < +(args.max || 4000); step++) {
  await new Promise((r) => setTimeout(r, args.skip ? 25 : +(args.delay || 350)));
  await setSkip();
  const s = await page.evaluate(() => ({ opts: TC.dev.opts(), prompt: TC.dev.prompt(), box: TC.dev.box(), bg: TC.dev.bg(), inGame: TC.dev.inGame(), title: TC.dev.title(), errors: TC.dev.errors.slice(), endings: TC.dev.endings(), modal: TC.dev.modal() }));
  if (s.errors.length) { logs.push(...s.errors.map((e) => '[game] ' + e)); await page.evaluate(() => (TC.dev.errors.length = 0)); }
  if (s.bg !== lastBg && s.bg) { lastBg = s.bg; if (!args.skip || args.shotall) await shot('bg-' + s.bg); }
  if (s.title && step > 5) { console.log('RETURNED TO TITLE. endings:', s.endings.join(',')); break; }
  if (args.every && Date.now() - lastShot > +args.every) { lastShot = Date.now(); await shot('t'); }
  if (s.opts) {
    const want = plan.length ? plan.shift() : s.opts[0];
    const id = s.opts.includes(want) ? want : s.opts[0];
    if (id !== want) console.log(`  ! wanted "${want}" but options are [${s.opts}] -> ${id}`);
    picks.push(id);
    if (args.shotchoices) await shot('choice-' + id);
    await page.evaluate((i) => TC.dev.pickId(i), id);
    stuck = 0; continue;
  }
  if (s.prompt) { await page.evaluate(() => TC.dev.press()); stuck = 0; continue; }
  if (s.box && s.box !== lastBox) { lastBox = s.box; if (args.verbose) console.log('  >', s.box.slice(0, 110)); if (args.shotlines) await shot('line'); stuck = 0; }
  else stuck++;
  if (!args.every) await page.evaluate(() => { TC.dev.advance(); }); else await page.evaluate(() => { TC.state.auto = true; });
  if (stuck > (args.every ? 4000 : 400)) { console.log('STUCK at bg', s.bg, 'box:', s.box); await shot('stuck'); break; }
}
console.log('picks:', picks.join(','));
console.log(`time ${((Date.now() - t0) / 1000).toFixed(1)}s`);
console.log(logs.length ? 'LOGS:\n' + logs.join('\n') : 'no console errors');
await browser.close();
