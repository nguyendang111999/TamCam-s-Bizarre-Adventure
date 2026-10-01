// Scans js/ for every Japanese glyph (kana, kanji, fullwidth punctuation) and rewrites tools/jp-glyphs.txt.
// Run before tools/fetch-fonts.mjs so the "SFX JP" subset contains everything the game draws.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..');
const dir = path.join(ROOT, 'js');
const set = new Set();
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.js')) continue;
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  for (const ch of src) {
    const c = ch.codePointAt(0);
    if ((c >= 0x3000 && c <= 0x30ff) || (c >= 0x4e00 && c <= 0x9fff) || (c >= 0xff00 && c <= 0xffef) || c === 0x221e) set.add(ch);
  }
}
const extra = 'ゴドンバァーズキュウメタギャオラムダッ・ィイリヤレワルザシピチャパクポカビボケコ「」！？…ABCDE０１２３';
for (const ch of extra) set.add(ch);
const out = [...set].sort().join('');
fs.writeFileSync(path.join(ROOT, 'tools', 'jp-glyphs.txt'), out + '\n');
console.log(`${set.size} glyphs:`, out);
