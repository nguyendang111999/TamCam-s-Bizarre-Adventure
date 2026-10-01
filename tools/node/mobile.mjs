import puppeteer from 'puppeteer-core';
const OUT = 'C:/Users/nguye/AppData/Local/Temp/claude/C--Users-nguye-Projects-TamCam/52b3216d-c48d-4f08-b1a4-41349e04a42a/scratchpad/shots/mobile';
import fs from 'node:fs'; fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.emulate({ name: 'phone', userAgent: 'Mozilla/5.0 (Linux; Android 14) Mobile', viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: false } });
await p.goto('http://localhost:8765/index.html?dev=1');
await new Promise((r) => setTimeout(r, 1500));
await p.screenshot({ path: OUT + '/portrait.png' });
await p.setViewport({ width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true, isLandscape: true });
await p.waitForFunction(() => !document.getElementById('boot-btn').disabled);
await p.tap('#boot-btn');
await p.waitForFunction(() => TC.dev.title());
await new Promise((r) => setTimeout(r, 1500));
await p.screenshot({ path: OUT + '/land_title.png' });
await p.tap('[data-a="new"]');
await new Promise((r) => setTimeout(r, 5500));
for (let i = 0; i < 4; i++) { await p.touchscreen.tap(420, 200); await new Promise((r) => setTimeout(r, 900)); }
await p.screenshot({ path: OUT + '/land_line.png' });
for (let i = 0; i < 12; i++) { const o = await p.evaluate(() => TC.dev.opts()); if (o) break; await p.touchscreen.tap(420, 200); await new Promise((r) => setTimeout(r, 700)); }
await p.screenshot({ path: OUT + '/land_choice.png' });
console.log('touch class:', await p.evaluate(() => document.body.classList.contains('touch')), 'errors:', errs.length ? errs : 'none');
await b.close();
