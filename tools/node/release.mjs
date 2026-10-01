// One-command rebuild of everything you upload to itch.io: zip, cover, and EN+VI screenshots.
// Needs the dev server running (python -m http.server 8765 in the repo root). Run: node tools/node/release.mjs
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });
console.log('1/4 zip');
run('python', ['tools/package.py']);
console.log('2/4 cover');
run(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--window-size=630,500', '--virtual-time-budget=5000',
  `--screenshot=${root}/dist/itch-page/cover-630x500.png`, 'http://localhost:8765/tools/lab/cover.html?w=630&h=500']);
for (const [i, lang] of ['en', 'vi'].entries()) {
  console.log(`${i + 3}/4 screenshots (${lang})`);
  run('node', ['promo.mjs', lang], path.join(root, 'tools/node'));
}
console.log('done: dist/TamCam-itch.zip and dist/itch-page/*.png');
