// screenshot the title screen (and optionally the endings gallery) at 1920x1080
import puppeteer from 'puppeteer-core';
const OUT = process.argv[2];
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', defaultViewport: { width: 1920, height: 1080 } });
const p = await b.newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('http://localhost:8765/index.html?dev=1');
await p.waitForFunction(() => !document.getElementById('boot-btn').disabled);
await p.evaluate((l) => TC.setLang(l), process.argv[3] || 'en');
await p.click('#boot-btn');
await p.waitForFunction(() => TC.dev.title());
await new Promise((r) => setTimeout(r, 2600));
await p.screenshot({ path: OUT });
console.log(errs.length ? errs.join('\n') : 'no errors');
await b.close();
