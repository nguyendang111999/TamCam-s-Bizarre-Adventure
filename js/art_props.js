/* art_props.js — props, close-up panels, emblems */
(function () {
  'use strict';
  const TC = window.TC, U = TC.util, K = TC.ink;
  const ART = (TC.art = TC.art || {});
  ART.prop = ART.prop || {};
  const INK = '#140b16';
  const sm = (pts, closed = true) => K.smooth(pts, closed);
  const inked = (d, fill, sw = 7, off = [4, 5]) => `<path d="${d}" fill="${INK}" transform="translate(${off[0]} ${off[1]})"/><path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const line = (pts, w, o = {}) => `<path d="${K.taper(pts, w, o)}" fill="${o.fill || INK}"${o.op ? ` opacity="${o.op}"` : ''}/>`;
  ART.panel = ART.panel || {};

  /* the pristine axe, leaning. 300×420 */
  const star = (x, y, r, sw = 3) => `<path d="M${x} ${y - r} l${r * 0.27} ${r * 0.73} l${r * 0.73} ${r * 0.27} l${-r * 0.73} ${r * 0.27} l${-r * 0.27} ${r * 0.73} l${-r * 0.27} ${-r * 0.73} l${-r * 0.73} ${-r * 0.27} l${r * 0.73} ${-r * 0.27}z" fill="#fff" stroke="${INK}" stroke-width="${sw}"/>`;

  /* the pristine axe, leaning on the trunk, blade resting toward the tree it is about to meet. 300×420 */
  ART.prop.axe = function () {
    return K.svg(300, 420, ART.axe({ x: 150, y: 82, rot: 15.6, scale: 0.62, dir: 1, len: 548, haftW: 30, id: 'pax',
      glint: (at) => { const [x, y] = at(186, -24); return star(x, y, 22); } }));
  };

  /* close-up panel: the blade, sharpened with love. 620×420 */
  ART.panel.axe = function () {
    let s = `<defs><linearGradient id="pa-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a0f45"/><stop offset="1" stop-color="#8e1f6a"/></linearGradient></defs>`;
    s += `<rect width="620" height="420" fill="url(#pa-bg)"/>`;
    s += K.radial(372, 170, 70, 720, 72, { w: 12, seed: 4, color: '#ffd36b', op: 0.35 });
    s += ART.axe({ x: 458, y: 300, rot: 72, scale: 1.25, dir: -1, len: 430, haftW: 26, id: 'pnx',
      glint: (at) => {
        // reflection in the cheek: a menacing eye, drawn upright
        const [ex, ey] = at(104, 40);
        let g = `<g opacity=".72" transform="translate(${K.r1(ex)} ${K.r1(ey)})"><path d="M-50 0 Q0 -32 50 0 Q0 22 -50 0Z" fill="#fff" stroke="${INK}" stroke-width="4"/><circle cx="0" cy="-2" r="15" fill="#5c4bc0"/><circle cx="0" cy="-2" r="7" fill="${INK}"/><circle cx="6" cy="-8" r="4" fill="#fff"/>`;
        g += line([[-58, -12], [0, -28], [60, -10]], 6, { s: 0.2, e: 0.5 }) + `</g>`;
        const [tx, ty] = at(182, -40), [hx, hy] = at(172, 120);
        return g + star(tx, ty, 34, 4) + star(hx, hy, 18);
      } });
    return K.svg(620, 420, s);
  };

  /* rush fist, knuckles to the right (tinted). 130×110 */
  ART.prop.fist = function (col = '#f7c325') {
    let s = '';
    s += inked(sm([[10, 30], [70, 12], [112, 20], [124, 54], [114, 92], [70, 100], [16, 90], [6, 60]]), col, 6, [3, 4]);
    [[80, 18, 82, 96], [98, 20, 102, 94]].forEach(([a, b, c, d]) => (s += line([[a, b], [c, d]], 3.6)));
    s += line([[66, 16], [66, 98]], 3.6);
    s += inked(sm([[30, 60], [70, 56], [86, 70], [60, 84], [30, 80]]), col, 4, [2, 2]);
    s += `<path d="M20 36 L60 24" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".8"/>`;
    return K.svg(130, 110, s);
  };

  /* =====================================================================
     STAND STAT CARD (SC eyecatch) — returns HTML for the overlay
     ===================================================================== */
  ART.standCard = function (sd) {
    const L = TC.L;
    const lv = { A: 5, B: 4, C: 3, D: 2, E: 1, '∞': 5.35 };
    const keys = [['power', '破壊力', L('POWER', 'SỨC MẠNH')], ['speed', 'スピード', L('SPEED', 'TỐC ĐỘ')], ['range', '射程距離', L('RANGE', 'TẦM XA')], ['stamina', '持続力', L('STAMINA', 'BỀN BỈ')], ['precision', '精密動作性', L('PRECISION', 'CHÍNH XÁC')], ['potential', '成長性', L('POTENTIAL', 'TIỀM NĂNG')]];
    const cx = 1400, cy = 640, R = 205;
    const pt = (i, r) => { const a = -Math.PI / 2 + (i / 6) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    let hex = '';
    for (let l = 1; l <= 5; l++) hex += `<path d="${K.poly([0, 1, 2, 3, 4, 5].map((i) => pt(i, (R * l) / 5)))}" fill="${l === 5 ? '#fff' : 'none'}" stroke="${INK}" stroke-width="${l === 5 ? 7 : 2}" ${l < 5 ? 'opacity=".5"' : ''}/>`;
    for (let i = 0; i < 6; i++) { const [x, y] = pt(i, R); hex += `<path d="M${cx} ${cy} L${x} ${y}" stroke="${INK}" stroke-width="2" opacity=".5"/>`; }
    const vals = keys.map(([k]) => lv[sd.stats[k]] || 1);
    hex += `<path d="${K.poly(vals.map((v, i) => pt(i, (R * Math.min(v, 5.6)) / 5)))}" fill="${sd.color}" fill-opacity=".75" stroke="${INK}" stroke-width="6"/>`;
    keys.forEach(([k, jp, en], i) => {
      const [x, y] = pt(i, R + 58), [lx, ly] = pt(i, (R * Math.min(vals[i], 5.35)) / 5);
      // labels hug the outside of the chart: left side right-aligned, right side left-aligned
      const anchor = x < cx - 20 ? 'end' : x > cx + 20 ? 'start' : 'middle';
      const ox = anchor === 'end' ? -16 : anchor === 'start' ? 16 : 0, oy = y < cy - R ? -22 : y > cy + R ? 30 : 0;
      hex += `<text x="${x + ox}" y="${y + oy - 6}" text-anchor="${anchor}" font-family="'SFX JP'" font-size="28" fill="#fff" stroke="${INK}" stroke-width="6" paint-order="stroke">${jp}</text>`;
      hex += `<text x="${x + ox}" y="${y + oy + 24}" text-anchor="${anchor}" font-family="Bangers" font-size="24" letter-spacing="2" fill="${sd.color}" stroke="${INK}" stroke-width="5" paint-order="stroke">${TC.t(en)}</text>`;
      hex += `<circle cx="${lx}" cy="${ly}" r="28" fill="#fff" stroke="${INK}" stroke-width="5"/><text x="${lx}" y="${ly + 12}" text-anchor="middle" font-family="Bangers, 'Dela Gothic One', sans-serif" font-size="${sd.stats[k] === '∞' ? 44 : 38}" fill="${INK}">${sd.stats[k]}</text>`;
    });
    const standSvg = TC.art.ch[sd.art]().replace('<svg ', '<svg style="position:absolute;left:40px;top:120px;width:900px;height:900px" ');
    return `<div style="position:absolute;inset:0;background:linear-gradient(135deg,${sd.dark},#140b16 70%)"></div>
      <svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">${K.radial(480, 560, 200, 1600, 80, { w: 28, seed: 21, color: sd.color, op: 0.25 })}</svg>
      ${standSvg}
      <svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">${hex}</svg>
      <div style="position:absolute;left:880px;top:40px;right:40px;text-align:right">
        <div style="font-family:var(--f-jp);font-size:46px;color:#fff;-webkit-text-stroke:2px #000">${sd.jp}</div>
        <div style="font-family:var(--f-comic);font-size:120px;line-height:1;color:${sd.color};-webkit-text-stroke:5px #000;paint-order:stroke fill;text-shadow:8px 8px 0 #000;letter-spacing:.04em">「${sd.name}」</div>
        <div style="font-family:var(--f-comic);font-size:44px;color:#fff;letter-spacing:.12em;margin-top:6px">${TC.util.esc(TC.t(sd.user))}</div>
      </div>
      <div style="position:absolute;left:40px;width:900px;bottom:36px;font-family:var(--f-talk);font-size:34px;line-height:1.25;color:#fbf3dc;text-shadow:3px 3px 0 #000">${TC.util.esc(TC.t(sd.note))}</div>
      <div style="position:absolute;left:40px;top:40px;padding:8px 22px;background:#000;color:${sd.color};font-family:var(--f-comic);font-size:40px;letter-spacing:.2em;transform:skew(-10deg);border:3px solid ${sd.color}">STAND</div>`;
  };

  /* =====================================================================
     VOICE TAROT CARD (inline SVG; fonts available). mini = sidebar version
     ===================================================================== */
  ART.voiceCard = function (v, w = 400, h = 640, mini = false) {
    const W = 400, H = 640, c = v.color;
    const emblem = {
      menacing: () => `<text x="200" y="380" text-anchor="middle" font-family="'SFX JP'" font-size="230" fill="${c}" stroke="${INK}" stroke-width="10" paint-order="stroke" transform="skewX(-10) translate(60 0)">ゴ</text>
        <path d="M110 210 Q150 180 190 210 Q150 226 110 210Z" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="150" cy="208" r="10" fill="${INK}"/><path d="M210 210 Q250 180 290 210 Q250 226 210 210Z" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="250" cy="208" r="10" fill="${INK}"/>
        <path d="${K.taper([[100, 190], [150, 172], [196, 196]], 10, { s: 0.2, e: 0.4 })}${K.taper([[204, 196], [250, 172], [300, 190]], 10, { s: 0.4, e: 0.2 })}" fill="${INK}"/>`,
      sister: () => `<path d="M60 330 Q120 300 180 320 L196 290 Q210 280 216 300 L200 340 Q150 360 70 360Z" fill="#ffd9c2" stroke="${INK}" stroke-width="6"/>
        <path d="M340 330 Q280 300 220 320 L204 290 Q190 280 184 300 L200 340 Q250 360 330 360Z" fill="#f6c9a8" stroke="${INK}" stroke-width="6"/>
        <path d="M200 250 c-30 -40 -90 -10 -60 30 l60 50 l60 -50 c30 -40 -30 -70 -60 -30z" fill="${c}" stroke="${INK}" stroke-width="6"/>
        <path d="M150 440 q50 30 100 0 M170 470 q30 20 60 0" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round"/>`,
      coward: () => `<g transform="translate(200 300)"><path d="M-30 -120 a34 34 0 1 0 1 0" fill="#f6c9a8" stroke="${INK}" stroke-width="6"/>
        <path d="M-10 -80 L20 20 L-40 90 M20 20 L90 70 M0 -50 L-70 -20 M0 -50 L70 -90" fill="none" stroke="${INK}" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M-10 -80 L20 20 L-40 90 M20 20 L90 70 M0 -50 L-70 -20 M0 -50 L70 -90" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="-120" cy="80" r="30" fill="#e0d2b0" stroke="${INK}" stroke-width="5"/><circle cx="-160" cy="100" r="22" fill="#e0d2b0" stroke="${INK}" stroke-width="5"/>
        <path d="M40 -150 q10 20 0 30 q-10 -10 0 -30z M70 -130 q10 20 0 30 q-10 -10 0 -30z" fill="#9ee7ff" stroke="${INK}" stroke-width="3"/></g>`,
      hungry: () => `<path d="M80 300 Q200 470 320 300 Z" fill="#fff" stroke="${INK}" stroke-width="7"/><path d="M80 300 Q200 470 320 300" fill="none" stroke="${c}" stroke-width="12" transform="translate(0 30) scale(1 .9) translate(0 -30)"/>
        <path d="M86 300 Q120 230 200 226 Q280 230 314 300 Z" fill="#fffdf4" stroke="${INK}" stroke-width="6"/>
        ${[[140, 280], [180, 256], [220, 262], [260, 286], [200, 292], [160, 296], [240, 300]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="10" ry="6" fill="#fff" stroke="${INK}" stroke-width="2"/>`).join('')}
        <path d="M250 170 L330 330 M280 160 L346 324" stroke="${INK}" stroke-width="14" stroke-linecap="round"/><path d="M250 170 L330 330 M280 160 L346 324" stroke="#c48a4c" stroke-width="7" stroke-linecap="round"/>
        <path d="M120 200 q10 20 0 34 q-10 -14 0 -34z M150 180 q10 20 0 34 q-10 -14 0 -34z" fill="#ffffff" stroke="${INK}" stroke-width="3"/>`,
    }[v.id]();
    const body = `<rect x="0" y="0" width="${W}" height="${H}" fill="#fbf3dc"/>
      <rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="none" stroke="${INK}" stroke-width="6"/>
      <rect x="30" y="30" width="${W - 60}" height="${H - 60}" fill="${v.tint}" stroke="${c}" stroke-width="4"/>
      ${K.radial(200, 300, 60, 420, 36, { w: 10, seed: 7, color: c, op: 0.35 })}
      <text x="200" y="92" text-anchor="middle" font-family="Bangers" font-size="54" letter-spacing="6" fill="${INK}">${v.numeral}</text>
      ${emblem}
      <rect x="30" y="${H - 150}" width="${W - 60}" height="92" fill="${INK}"/>
      <text x="200" y="${H - 90}" text-anchor="middle" font-family="Bangers, 'Dela Gothic One'" font-size="46" letter-spacing="3" fill="${c}">${TC.util.esc(TC.t(v.name))}</text>`;
    if (mini) return `<svg viewBox="0 0 96 150" width="100%" height="100%"><rect width="96" height="150" fill="${v.tint}"/>${K.radial(48, 62, 14, 120, 20, { w: 5, seed: 7, color: c, op: 0.5 })}
      <text x="48" y="90" text-anchor="middle" font-family="'SFX JP'" font-size="64" fill="${c}" stroke="${INK}" stroke-width="5" paint-order="stroke">${v.glyph}</text>
      <rect x="0" y="116" width="96" height="34" fill="${INK}"/><text x="48" y="141" text-anchor="middle" font-family="Bangers" font-size="21" letter-spacing="1" fill="${c}">${TC.util.esc(TC.t(v.short))}</text></svg>`;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%">${body}</svg>`;
  };

  /* close-up: the betel quid folded like phoenix wings (trầu têm cánh phượng). 640×440 */
  ART.panel.betel = function () {
    let s = `<defs><radialGradient id="bt-bg" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#fff3c4"/><stop offset="1" stop-color="#ffb35c"/></radialGradient></defs>`;
    s += `<rect width="640" height="440" fill="url(#bt-bg)"/>`;
    s += K.radial(320, 230, 80, 700, 60, { w: 12, seed: 8, color: '#c98a0e', op: 0.35 });
    s += `<ellipse cx="320" cy="360" rx="230" ry="46" fill="#c0392b" stroke="${INK}" stroke-width="7"/><ellipse cx="320" cy="352" rx="200" ry="34" fill="#e0564a"/>`;
    // phoenix-wing folded leaf
    s += inked(`M320 330 Q250 300 200 230 Q170 180 120 150 Q200 150 250 200 Q260 150 300 110 Q310 170 320 200 Q330 170 340 110 Q380 150 390 200 Q440 150 520 150 Q470 180 440 230 Q390 300 320 330 Z`, '#3a9d4a', 7);
    s += `<path d="M320 320 L320 200 M320 300 Q270 260 220 200 M320 300 Q370 260 420 200" fill="none" stroke="#1f6b2e" stroke-width="5"/>`;
    s += `<path d="M150 158 Q210 170 240 200" fill="none" stroke="#9be07a" stroke-width="6"/><path d="M490 158 Q430 170 400 200" fill="none" stroke="#9be07a" stroke-width="6"/>`;
    // areca nut slice + a toothpick
    s += `<ellipse cx="320" cy="300" rx="34" ry="22" fill="#e9c98a" stroke="${INK}" stroke-width="5"/><path d="M296 300 q24 -16 48 0" fill="none" stroke="#b5654a" stroke-width="4"/>`;
    s += `<path d="M320 90 L320 260" stroke="${INK}" stroke-width="8"/><path d="M320 90 L320 260" stroke="#d9b25a" stroke-width="4"/>`;
    s += K.sparkle(520, 90, 26) + K.sparkle(110, 300, 18);
    return K.svg(640, 440, s);
  };

})();
