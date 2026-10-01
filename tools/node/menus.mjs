import puppeteer from 'puppeteer-core';
const OUT = 'C:/Users/nguye/AppData/Local/Temp/claude/C--Users-nguye-Projects-TamCam/52b3216d-c48d-4f08-b1a4-41349e04a42a/scratchpad/shots/menus';
import fs from 'node:fs'; fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 0.5 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) errs.push(m.text()); });
await p.goto('http://localhost:8765/index.html?dev=1');
await p.waitForFunction(() => !document.getElementById('boot-btn').disabled);
await p.click('#boot-btn');
await p.waitForFunction(() => TC.dev.title());
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 1) play into chapter 2 quickly with skip, then return to title
await p.evaluate(() => document.querySelector('[data-a="new"]').click());
for (let i = 0; i < 400; i++) {
  await sleep(30);
  const s = await p.evaluate(() => { TC.state.skip = true; const o = TC.dev.opts(); if (o) TC.dev.pickId(o.includes('refuse') ? 'refuse' : o[0]); else TC.dev.advance(); return TC.state.chapter; });
  if (s === 'ch2') break;
}
await sleep(500);
const st = await p.evaluate(() => ({ ch: TC.state.chapter, voices: TC.state.voices, cp: TC.persist.data.checkpoint }));
console.log('in game:', JSON.stringify(st));
await p.evaluate(() => TC.main.toTitle());
await sleep(1800);
await p.screenshot({ path: OUT + '/title_after.png' });
const cont = await p.evaluate(() => !document.querySelector('[data-a="cont"]').disabled);
console.log('continue enabled:', cont);
await p.evaluate(() => document.querySelector('[data-a="cont"]').click());
await sleep(2500);
console.log('after continue:', await p.evaluate(() => JSON.stringify({ ch: TC.state.chapter, voices: TC.state.voices, v1: TC.state.flags.v1 })));
await p.screenshot({ path: OUT + '/continue.png' });
// 2) pause menu + settings + log
await p.keyboard.press('Escape'); await sleep(400);
await p.screenshot({ path: OUT + '/pause.png' });
await p.evaluate(() => document.querySelector('[data-a="settings"]').click()); await sleep(300);
await p.screenshot({ path: OUT + '/settings.png' });
await p.evaluate(() => document.querySelector('[data-close]').click()); await sleep(200);
await p.evaluate(() => TC.ui.openLog()); await sleep(300);
await p.screenshot({ path: OUT + '/log.png' });
await p.evaluate(() => TC.ui.closeModal());
// 3) endings gallery with two endings unlocked
await p.evaluate(() => { TC.persist.data.endings = { canon: 1, true: 2 }; TC.persist.save(); TC.main.toTitle(); });
await sleep(1800);
await p.evaluate(() => document.querySelector('[data-a="endings"]').click()); await sleep(1500);
await p.screenshot({ path: OUT + '/endings.png' });
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
await b.close();
