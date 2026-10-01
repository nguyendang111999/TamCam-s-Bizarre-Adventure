// Renders music tracks / sfx offline in headless Chrome and saves WAVs for analysis.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const OUT = 'C:/Users/nguye/AppData/Local/Temp/claude/C--Users-nguye-Projects-TamCam/52b3216d-c48d-4f08-b1a4-41349e04a42a/scratchpad/audio';
fs.mkdirSync(OUT, { recursive: true });
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await b.newPage();
p.on('console', (m) => console.log('[page]', m.type(), m.text()));
p.on('pageerror', (e) => console.log('[pageerror]', e.message));
await p.goto('http://localhost:8765/tools/lab/audio.html');
await p.waitForFunction(() => document.title === 'ready');
const tracks = (process.argv[2] || 'title,path,palace,loom,teashop,menace,battle,void,truth,ending,run,canon,villain,wind').split(',');
for (const t of tracks) {
  const secs = +(process.argv[3] || 16);
  const b64 = await p.evaluate((id, s) => window.renderTrack(id, s, id === 'menace' ? { intensity: 1 } : {}), t, secs);
  fs.writeFileSync(`${OUT}/${t}.wav`, Buffer.from(b64, 'base64'));
  console.log('rendered', t);
}
const sfx = ['click', 'select', 'whoosh', 'slam', 'boom', 'dun', 'dundun', 'shock', 'chop', 'creak', 'crash', 'fall', 'poof', 'flap', 'chirp', 'sing', 'sparkle', 'heart', 'step', 'dodo', 'menace', 'punch', 'bigpunch', 'fire', 'plop', 'bite', 'munch', 'gulp', 'splash', 'bubble', 'timestop', 'timego', 'record', 'wahwah', 'tearpaper', 'pageflip', 'crow', 'cry', 'tbc', 'voiceGet', 'chapter', 'ending', 'bath', 'rip', 'eraser'];
fs.writeFileSync(`${OUT}/sfx.wav`, Buffer.from(await p.evaluate((n) => window.renderSfx(n, 1.6), sfx), 'base64'));
fs.writeFileSync(`${OUT}/blips.wav`, Buffer.from(await p.evaluate(() => window.renderBlips()), 'base64'));
console.log('rendered sfx + blips:', sfx.length, 'sfx');
await b.close();
