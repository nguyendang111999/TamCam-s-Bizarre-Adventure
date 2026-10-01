# TẤM CÁM'S BIZARRE ADVENTURE — *Ricedust Crusaders*

> *"You're on a path in the rice fields. At the end of the path is an areca tree. At the top of that tree is your sister. You're here to chop it down."*

A goofy, 10-minute **Slay the Princess**-style visual novel retelling the Vietnamese folk tale **Tấm Cám**, drawn and staged like **JoJo's Bizarre Adventure: Stardust Crusaders** — ゴゴゴゴ, Stands, stat cards, "To Be Continued", and yes: *"Oh? You're approaching me?"*

You play **Cám** — the villain. The Narrator has told this story ten thousand times and needs it to go *exactly* as written. Tấm keeps coming back — as a bird, a loom, a golden fruit — and every chapter a new **Voice** joins the chorus in your head. The Voices decide which endings you can reach.

| | |
|---|---|
| **Length** | 8–10 min per run · 5 endings |
| **Languages** | English · Tiếng Việt (switch any time; auto-detects Vietnamese browsers) |
| **Platforms** | Any modern browser — desktop & mobile (landscape) |
| **Size** | ~400 KB zipped. No images or audio files: every illustration, the music and all sound are generated in code at runtime |

---

## Play locally

The game is plain HTML/JS — no build step.

```bash
python -m http.server 8765
```

Then open http://localhost:8765. (Double-clicking `index.html` also works in most browsers.)

**Controls** — `Space` / `Enter` / click / tap: advance · `1–9` or arrows: choose · `A` auto · `S` skip · `L` log · `F` fullscreen · `H` hide UI · `Esc` / right-click: menu · mouse wheel up: log.

---

## Publish on itch.io

1. Build the upload zip:
   ```bash
   python tools/package.py
   ```
   → `dist/TamCam-itch.zip` (index.html at the zip root, 32 files).
2. On itch.io: **Upload new project** →
   - *Kind of project*: **HTML**
   - *Uploads*: upload `dist/TamCam-itch.zip` and tick **"This file will be played in the browser"**
3. *Embed options* (recommended):
   - Viewport dimensions: **1280 × 720** (960 × 540 also works; the game scales to any 16:9 size)
   - ✅ **Mobile friendly** — orientation **Landscape**
   - ✅ **Fullscreen button**
   - ✅ **Click to launch in fullscreen** is optional; leave *Automatically start on page load* **off** (browsers need a click before sound can play anyway)
   - Scrollbars: off
4. *Cover image*: `dist/itch-page/cover-630x500.png`
5. *Screenshots*: `dist/itch-page/*.png` (English `en-*` and Vietnamese `vi-*` sets, 1280×720)
6. Suggested tags: `visual-novel`, `interactive-fiction`, `parody`, `comedy`, `multiple-endings`, `short`, `vietnam`, `folklore`, `jojo`, `slay-the-princess`

### Suggested page text

**EN** — *A fairy tale told ten thousand times. This time, you're the villain.* Tấm Cám is Vietnam's Cinderella — with more reincarnation and considerably more fish sauce. In this bizarre little parody you play Cám, the wicked stepsister, while an increasingly desperate Narrator insists the story go exactly as written. Your sister keeps coming back. The Voices in your head keep multiplying. And at the top of the palace steps, something is going ドドドドド. Five endings. Ten minutes. One Stand named after her mom.

**VI** — *Chuyện cổ tích đã kể mười nghìn lần. Lần này, bạn là phản diện.* Vào vai Cám, nghe Người Kể Chuyện ra lệnh, và gặp lại Tấm trong hình dạng chim vàng anh, khung cửi, quả thị… và một Stand tên là "MAMMA MIA". Năm cái kết. Mười phút. Rất nhiều ゴゴゴゴ.

*Fan work disclaimer (put this on the page):* A non-commercial fan tribute to *Slay the Princess* (Black Tabby Games) and *JoJo's Bizarre Adventure* (Hirohiko Araki). Not affiliated with or endorsed by either. All art, music and code are original.

### Your name in the credits

Open `js/main.js` and set `M.AUTHOR = 'Your Name';` near the top. It then shows on the title screen and in the credits. Re-run `python tools/package.py` afterwards.

---

## How it's made

- **Narrative structure** borrows Slay the Princess's loop: each chapter Tấm returns in a new form from the original tale (areca tree → golden oriole → loom → thị fruit → queen), a Narrator who needs the story to go as written, and a new **Voice** per chapter (The Menacing, The Sister, The Coward, The Hungry) chosen by what you did last chapter. Voices unlock endings.
- **Art** (`js/ink.js`, `js/art_*.js`): a small procedural "manga ink" toolkit — tapered G-pen strokes, hatching, feathering, halftone screentone, focus lines — draws every scene as SVG, which is rasterized to canvas once and cached.
- **JoJo staging** (`js/fx.js`): katakana SFX lettering (ゴゴゴ, ドドドド, バァーン), anime-style palette inversions, the sepia "To Be Continued" freeze-frame, a Za Warudo time-stop, Stand stat cards, speed lines, screen shake.
- **Music & sound** (`js/audio.js`, `js/music.js`): Web Audio synthesis — a Karplus–Strong **đàn tranh** (plucked zither with *nhấn* pitch bends), a gliding **đàn bầu**, **sáo** flute, **trống**, **mõ**, **phách** and **chiêng**, written in Vietnamese pentatonic modes (bright *Bắc* for daylight, mournful *Nam/oán* for the haunted loom), plus an original funk-bass "To Be Continued" sting.
- **Engine** (`js/engine.js`, `js/ui.js`, `js/story.js`): the story is written as async scripts with bilingual lines `L('English', 'Tiếng Việt')`.

### Project layout

```
index.html        entry point
css/style.css     all styles (stage is authored at 1920×1080 and scaled)
js/               game code (load order is in index.html)
fonts/            self-hosted Google Fonts subsets (SIL OFL) — works offline
tools/            dev only, not shipped: package.py, fetch-fonts.mjs, check-glyphs.mjs,
                  lab/ (art & audio previews), node/ (headless autoplay & screenshot tests)
dist/             build output: itch.io zip + page images
```

### Dev tools (optional)

- `tools/node/` needs `npm install` (puppeteer-core) and a local Chrome. With the local server running:
  - `node play.mjs --skip --plan "walk,refuse,talk,sorry,let,fight,change"`: plays a whole route headlessly and reports errors
  - `node timing.mjs`: estimates play time for every route
  - `node promo.mjs en|vi`: regenerates the itch.io screenshots
  - `node feedback.mjs <outDir> [en|vi]`: plays to the art set-pieces (axe close-up, the King, the tea stall, the Kono Dio Da reveal, the approach panel, Mamma Mia, the rush, the run-away) and screenshots each one
- New Japanese SFX text? Run `node tools/check-glyphs.mjs` then `node tools/fetch-fonts.mjs` to rebuild the font subset.
- Add `?dev` to the URL for test hooks (`TC.dev.start('ch3', flags, voices)` jumps to a chapter).

## Credits & licenses

- Story adapted from the Vietnamese folk tale *Tấm Cám* (public domain).
- Fonts: Dela Gothic One, Bangers, Patrick Hand, Lora — Google Fonts, SIL Open Font License 1.1.
- Inspired by *Slay the Princess* (Black Tabby Games) and *JoJo's Bizarre Adventure* (Hirohiko Araki). Parody / fan tribute; no assets from either work are used.
