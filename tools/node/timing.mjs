// Counts characters shown on a route (skip mode) and estimates play time.
import puppeteer from 'puppeteer-core';
const plans = {
  canon: 'walk,axe,chop,talk,burn,let,fight,bath',
  true_: 'walk,refuse,talk,sorry,let,fight,change',
  run: 'leave,refuse,hide,run,ask,run',
  wry: 'walk,axe,chop,shoo,burn,snatch,fight,wry',
  eat: 'walk,axe,chop,eat,bite,eat,fight,eat',
  chatty: 'who,sauce,walk,talk,axe,down,drop,cry,talk,sorry,ask,fight,change',
};
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
for (const lang of ['en', 'vi']) for (const [name, plan] of Object.entries(plans)) {
  const p = await b.newPage();
  await p.goto('http://localhost:8765/index.html?dev=1');
  await p.waitForFunction(() => !document.getElementById('boot-btn').disabled);
  await p.evaluate((l) => { TC.setLang(l); window.__chars = 0; window.__lines = 0; window.__choices = 0; const o = TC.ui.say; TC.ui.say = function (w, t, op) { window.__chars += TC.t(t).replace(/[*|]|\{[^}]*\}/g, '').length; window.__lines++; return o.apply(this, arguments); }; const c = TC.ui.choose; TC.ui.choose = function (opts) { window.__choices++; return c.apply(this, arguments); }; }, lang);
  await p.click('#boot-btn');
  await p.waitForFunction(() => TC.dev.title());
  await p.evaluate(() => document.querySelector('[data-a="new"]').click());
  const q = plan.split(',');
  for (let i = 0; i < 3000; i++) {
    await new Promise((r) => setTimeout(r, 15));
    const done = await p.evaluate((q0) => { TC.state.skip = true; if (TC.dev.title() && !TC.dev.inGame()) return 'done'; const o = TC.dev.opts(); if (o) { TC.dev.pickId(o.includes(q0) ? q0 : o[0]); return 'pick'; } if (TC.dev.prompt()) TC.dev.press(); TC.dev.advance(); return ''; }, q[0]);
    if (done === 'pick') q.shift();
    if (done === 'done' && i > 20) break;
  }
  const r = await p.evaluate(() => ({ chars: window.__chars, lines: window.__lines, choices: window.__choices }));
  // reading ~16 chars/s (≈190 wpm, relaxed) + 0.6s per click + 3s per choice + ~95s of set pieces/cards/transitions
  const est = r.chars / 16 + r.lines * 0.6 + r.choices * 3 + 95;
  console.log(`${lang} ${name.padEnd(7)} lines ${String(r.lines).padStart(3)}  chars ${String(r.chars).padStart(5)}  choices ${r.choices}  ≈ ${(est / 60).toFixed(1)} min`);
  await p.close();
}
await b.close();
