/* art_placeholder.js — temporary stand-ins so the game runs end-to-end before final art exists.
   Real art files load after this and overwrite these entries. */
(function () {
  'use strict';
  const TC = window.TC, K = TC.ink;
  const ART = (TC.art = TC.art || {});
  ART.bg = ART.bg || {}; ART.ch = ART.ch || {}; ART.prop = ART.prop || {}; ART.panel = ART.panel || {};
  const ph = (w, h, label, col = '#ccc') => K.svg(w, h,
    `<rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="18" fill="${col}" stroke="#140b16" stroke-width="8"/>` +
    `<path d="M4 4L${w - 4} ${h - 4}M${w - 4} 4L4 ${h - 4}" stroke="#140b16" stroke-width="3" opacity=".3"/>` +
    `<text x="${w / 2}" y="${h / 2}" font-family="Arial Black,Arial" font-size="${Math.max(18, Math.min(w, h) / 8)}" text-anchor="middle" dominant-baseline="middle" fill="#140b16">${label}</text>`);
  const bgs = { title: '#3b1450', courtyard: '#f2b8c8', loomroom: '#1d1830', teashop: '#e0b060', steps: '#eeeeee', battle: '#ff9ec0', lying: '#8fb0a0', crow: '#555', void: '#fbf5e4', riverbank: '#ff9a5c' };
  for (const k in bgs) if (!ART.bg[k]) ART.bg[k] = () => ph(1920, 1080, 'BG: ' + k, bgs[k]);
  const chars = {
    areca: [900, 1200, '#6a8'], tam_fall: [240, 300, '#fc3'], mom: [720, 1000, '#d55'], but: [440, 560, '#9ef'], bird: [360, 300, '#fc3'], king: [560, 900, '#fd6'],
    loom: [800, 760, '#a86'], fruit: [120, 140, '#fb4'], oldwoman: [560, 820, '#cd8'], tam_dio: [900, 1040, '#fc3'], tam_back: [980, 1180, '#fc3'], cam_walk: [210, 520, '#648'],
    stand_tam: [900, 900, '#fc3'], stand_cam: [900, 900, '#f7a'], bathpot: [800, 700, '#999'], potsmall: [420, 360, '#888'], throne: [400, 560, '#a8f'], book: [800, 620, '#edc'], page47: [700, 880, '#fff'],
  };
  for (const k in chars) if (!ART.ch[k]) { const [w, h, c] = chars[k]; ART.ch[k] = (v) => ph(w, h, k + (v ? ':' + v : ''), c); }
  if (!ART.prop.axe) ART.prop.axe = () => ph(300, 420, 'axe', '#bbb');
  if (!ART.prop.fist) ART.prop.fist = (col) => ph(130, 110, '✊', col);
  if (!ART.panel.axe) ART.panel.axe = () => ph(620, 420, 'PANEL axe', '#fff');
  if (!ART.panel.betel) ART.panel.betel = () => ph(640, 440, 'PANEL betel', '#9d6');
  if (!ART.voiceCard) ART.voiceCard = (v, w, h) => `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%"><rect width="${w}" height="${h}" fill="${v.color}"/><text x="${w / 2}" y="${h / 2}" font-size="${w / 2}" text-anchor="middle" dominant-baseline="middle" font-family="SFX JP">${v.glyph}</text></svg>`;
  if (!ART.standCard) ART.standCard = (sd) => `<div style="position:absolute;inset:0;background:#140b16;color:#fff;font:80px Bangers;display:grid;place-items:center">${sd.name}</div>`;
})();
