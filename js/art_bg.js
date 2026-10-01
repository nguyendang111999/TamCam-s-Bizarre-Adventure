/* art_bg.js — backgrounds (1920×1080), procedurally inked in a JoJo-coloured-manga style. */
(function () {
  'use strict';
  const TC = window.TC, U = TC.util, K = TC.ink;
  const ART = (TC.art = TC.art || {});
  ART.bg = ART.bg || {};
  const lib = (ART.lib = ART.lib || {});
  const INK = '#140b16';
  const W = 1920, H = 1080;
  const r1 = K.r1;
  // shared inking helpers live in art_chars.js (ART.util); resolved lazily at draw time
  const inked = (...a) => ART.util.inked(...a);
  const sm = (pts, closed = true) => K.smooth(pts, closed);

  /* ======================================================= shared scenery */
  // linear gradient def
  lib.grad = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
    `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
  lib.rgrad = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) =>
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;

  // areca palm (cây cau): slender ringed trunk + drooping crown + nut bunch
  lib.areca = function (x, baseY, topY, o = {}) {
    const rnd = U.rng(o.seed || 21), s = o.scale || 1, lean = o.lean || 0;
    const tw = (o.w || 16) * s;
    const trunk = [[x, baseY], [x + lean * 0.35, baseY - (baseY - topY) * 0.4], [x + lean * 0.8, baseY - (baseY - topY) * 0.8], [x + lean, topY]];
    let out = '';
    const col = o.color || '#2a1238';
    if (o.silhouette) {
      out += `<path d="${K.taper(trunk, tw, { s: 0, e: 0.15, min: 0.55 })}" fill="${col}"/>`;
    } else {
      out += `<path d="${K.taper(trunk, tw + 6, { s: 0, e: 0.1, min: 0.6 })}" fill="${INK}"/>`;
      out += `<path d="${K.taper(trunk, tw, { s: 0, e: 0.1, min: 0.6 })}" fill="${o.trunkFill || '#b9a58a'}"/>`;
      // ring scars
      const S = K.sample(trunk, false, 6), rings = [];
      for (let i = 4; i < S.length - 3; i += 3 + Math.floor(rnd() * 2)) {
        const t = i / S.length, w = tw * (1 - t * 0.4) * 0.5;
        rings.push(K.taper([[S[i][0] - w, S[i][1]], [S[i][0] + w, S[i][1] + 1]], 2.4 * s, { s: 0.3, e: 0.3 }));
      }
      out += `<path d="${rings.join('')}" fill="${INK}" opacity=".75"/>`;
      // shadow side hatch
      out += `<path d="${K.taper(trunk.map((p) => [p[0] + tw * 0.25, p[1]]), tw * 0.35, { s: 0, e: 0.1, min: 0.6 })}" fill="${INK}" opacity=".25"/>`;
    }
    // crown
    const cx = x + lean, cy = topY, fronds = o.fronds || 9, L = (o.frond || 150) * s;
    const fr = [], lf = [];
    for (let i = 0; i < fronds; i++) {
      const a = -Math.PI / 2 + ((i / (fronds - 1)) - 0.5) * Math.PI * 1.55 + (rnd() - 0.5) * 0.2;
      const len = L * (0.75 + rnd() * 0.4);
      const tip = [cx + Math.cos(a) * len, cy + Math.sin(a) * len * 0.55 + len * 0.45 * Math.abs(Math.cos(a))];
      const mid = [cx + Math.cos(a) * len * 0.5, cy + Math.sin(a) * len * 0.5 - 10 * s];
      fr.push(K.taper([[cx, cy], mid, tip], 7 * s, { s: 0.05, e: 0.9, min: 0.1 }));
      if (!o.silhouette || o.leaflets) {
        const Sp = K.sample([[cx, cy], mid, tip], false, 9 * s);
        Sp.forEach((p, k) => {
          if (k < 2 || k === Sp.length - 1) return;
          const q = Sp[Math.min(Sp.length - 1, k + 1)];
          const dx = q[0] - p[0], dy = q[1] - p[1], dl = Math.hypot(dx, dy) || 1;
          const ll = (26 + 18 * Math.sin((k / Sp.length) * Math.PI)) * s;
          [-1, 1].forEach((sd) => lf.push(K.taper([p, [p[0] + (dx / dl) * ll * 0.5 - (dy / dl) * ll * sd * 0.8, p[1] + (dy / dl) * ll * 0.5 + (dx / dl) * ll * sd * 0.8 + ll * 0.5]], 5 * s, { s: 0.1, e: 0.9, min: 0 })));
        });
      }
    }
    const fcol = o.silhouette ? col : (o.frondFill || '#1d6b4f');
    if (lf.length) out += `<path d="${lf.join('')}" fill="${fcol}"/>`;
    out += `<path d="${fr.join('')}" fill="${o.silhouette ? col : INK}"/>`;
    if (!o.silhouette && o.nuts !== false) {
      // nut bunch under the crown
      let nuts = '';
      for (let i = 0; i < 14; i++) {
        const nx = cx + (rnd() - 0.5) * 34 * s + 8 * s, ny = cy + 18 * s + rnd() * 40 * s;
        nuts += `<ellipse cx="${r1(nx)}" cy="${r1(ny)}" rx="${r1(6.5 * s)}" ry="${r1(8 * s)}" fill="${rnd() < 0.5 ? '#f08a24' : '#d9b233'}" stroke="${INK}" stroke-width="${r1(2 * s)}"/>`;
      }
      out += nuts;
      // crownshaft
      out += `<path d="${K.taper([[cx - 2, cy + 40 * s], [cx, cy - 4]], 14 * s, { s: 0, e: 0.2, min: 0.6 })}" fill="#3d8f55" stroke="${INK}" stroke-width="2.5"/>`;
    }
    return out;
  };

  // bamboo/tree-line silhouette band
  lib.treeLine = function (y0, amp, col, seed, o = {}) {
    const rnd = U.rng(seed);
    let pts = [[-20, H]];
    let x = -20;
    while (x < W + 40) {
      const r = 25 + rnd() * 45;
      pts.push([x, y0 - rnd() * amp]);
      x += r;
    }
    pts.push([W + 40, H]);
    let d = K.smooth(pts.slice(1, -1));
    d = `M-20 ${H}L${pts[1][0]} ${pts[1][1]}` + d.slice(d.indexOf('C')) + `L${W + 40} ${H}Z`;
    let out = `<path d="${d}" fill="${col}"/>`;
    // feathery bamboo plumes
    if (o.bamboo) {
      const st = [];
      for (let i = 0; i < o.bamboo; i++) {
        const bx = rnd() * W, by = y0 - rnd() * amp * 0.6, h = 60 + rnd() * 110;
        const bend = (rnd() - 0.3) * 60;
        st.push(K.taper([[bx, by + 20], [bx + bend * 0.3, by - h * 0.6], [bx + bend, by - h]], 5, { s: 0, e: 0.8, min: 0.1 }));
        for (let k = 0; k < 7; k++) {
          const t = 0.35 + k * 0.09, px = bx + bend * t * t, py = by - h * t;
          const dir = k % 2 ? 1 : -1, ll = 26 + rnd() * 22;
          st.push(K.taper([[px, py], [px + dir * ll, py + 8 + rnd() * 10]], 7, { s: 0.1, e: 0.9, min: 0 }));
        }
      }
      out += `<path d="${st.join('')}" fill="${col}"/>`;
    }
    return out;
  };

  // rice tuft (foreground grass clump)
  lib.tuft = function (x, y, h, seed, o = {}) {
    const rnd = U.rng(seed), n = o.n || 14, blades = [], hi = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (rnd() - 0.5) * 1.5;
      const L = h * (0.55 + rnd() * 0.55), bx = x + (rnd() - 0.5) * h * 0.35;
      const curl = (rnd() - 0.5) * 0.9;
      const p1 = [bx + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.5];
      const p2 = [bx + Math.cos(a + curl) * L, y + Math.sin(a + curl) * L];
      blades.push(K.taper([[bx, y], p1, p2], (o.w || 12) * (0.6 + rnd() * 0.6), { s: 0, e: 0.95, min: 0 }));
      if (rnd() < 0.5) hi.push(K.taper([[bx + 2, y - 6], [p1[0] + 2, p1[1]], [p2[0], p2[1] + 6]], (o.w || 12) * 0.25, { s: 0.2, e: 0.9, min: 0 }));
    }
    return `<path d="${blades.join('')}" fill="${o.fill || '#0f3f35'}" stroke="${INK}" stroke-width="2"/>` + (o.hi !== false ? `<path d="${hi.join('')}" fill="${o.hiFill || '#7fd98a'}" opacity=".8"/>` : '');
  };

  // streaky manga clouds
  lib.streaks = function (bb, n, col, seed, o = {}) {
    const rnd = U.rng(seed), st = [];
    for (let i = 0; i < n; i++) {
      const y = bb.y + rnd() * bb.h, x = bb.x + rnd() * bb.w, L = 120 + rnd() * (o.len || 420);
      st.push(K.taper([[x, y], [x + L * 0.5, y - 4 + rnd() * 8], [x + L, y + (rnd() - 0.5) * 10]], (o.w || 12) * (0.4 + rnd()), { s: 0.4, e: 0.5, min: 0 }));
    }
    return `<path d="${st.join('')}" fill="${col}"${o.op ? ` opacity="${o.op}"` : ''}/>`;
  };
  lib.birds = function (bb, n, seed, col = INK) {
    const rnd = U.rng(seed), st = [];
    for (let i = 0; i < n; i++) {
      const x = bb.x + rnd() * bb.w, y = bb.y + rnd() * bb.h, s = 8 + rnd() * 12;
      st.push(K.taper([[x - s, y - s * 0.35], [x - s * 0.4, y - s * 0.5], [x, y]], 3, { s: 0.2, e: 0.3 }));
      st.push(K.taper([[x, y], [x + s * 0.4, y - s * 0.5], [x + s, y - s * 0.3]], 3, { s: 0.3, e: 0.2 }));
    }
    return `<path d="${st.join('')}" fill="${col}"/>`;
  };
  // big dramatic hatch corners (manga sky shading)
  lib.cornerHatch = (seed, op = 0.5, col = INK) =>
    `<g opacity="${op}">${K.hatch({ x: -100, y: -100, w: 900, h: 420 }, { angle: 18, gap: 16, w: 3.2, seed, fade: [0.25, 0.55], color: col })}` +
    `${K.hatch({ x: 1180, y: -100, w: 860, h: 420 }, { angle: 162, gap: 16, w: 3.2, seed: seed + 1, fade: [0.25, 0.55], color: col })}</g>`;

  /* ======================================================= BG: PATH (Ch I) */
  ART.bg.path = function () {
    const VP = [1010, 600];
    let s = `<defs>${lib.grad('pa-sky', [[0, '#2a0f45'], [0.35, '#8e1f6a'], [0.72, '#ff6a3d'], [1, '#ffd36b']])}
      ${lib.rgrad('pa-sun', [[0, '#fffbe0'], [0.6, '#ffe28a'], [1, '#ffb347']])}
      ${lib.grad('pa-water', [[0, '#ffc766'], [0.5, '#ff7d5c'], [1, '#c43b7d']])}
      ${lib.grad('pa-rice', [[0, '#1a6e5e'], [1, '#0d3b36']])}
      ${lib.grad('pa-road', [[0, '#e9b673'], [1, '#b8733a']])}
      <clipPath id="pa-skyclip"><rect width="${W}" height="${VP[1] + 4}"/></clipPath></defs>`;
    // sky
    s += `<rect width="${W}" height="${H}" fill="url(#pa-sky)"/>`;
    s += `<image href="${K.halftone('pa-sky-ht', 960, 330, (u, v) => Math.max(0, 0.9 - v * 1.4) * (0.5 + 0.5 * Math.abs(u - 0.5) * 2), { step: 12, color: '#1a0730' })}" width="${W}" height="660" opacity=".55"/>`;
    // sun
    s += `<clipPath id="pa-sunclip"><circle cx="1330" cy="585" r="170"/></clipPath>`;
    s += `<circle cx="1330" cy="585" r="205" fill="#ffcf6b" opacity=".25"/>`;
    s += `<circle cx="1330" cy="585" r="170" fill="url(#pa-sun)"/>`;
    s += `<g clip-path="url(#pa-sunclip)">${K.hatch({ x: 1160, y: 500, w: 340, h: 90 }, { angle: 0, gap: 13, w: 3.4, seed: 4, color: '#ff7a2e', op: 0.9 })}</g>`;
    s += `<circle cx="1330" cy="585" r="170" fill="none" stroke="${INK}" stroke-width="5"/>`;
    // cloud streaks
    s += lib.streaks({ x: -200, y: 120, w: 2000, h: 300 }, 26, '#4a1760', 8, { op: 0.9, len: 520, w: 16 });
    s += lib.streaks({ x: -200, y: 330, w: 2000, h: 180 }, 20, '#ff9e6b', 9, { op: 0.7, len: 380, w: 9 });
    s += lib.cornerHatch(31, 0.55, '#12051e');
    s += lib.birds({ x: 380, y: 200, w: 500, h: 160 }, 7, 12, '#1a0826');
    // far tree line + palms
    s += lib.treeLine(575, 40, '#3a1450', 5, { bamboo: 26 });
    [[160, 590, 330], [290, 588, 380], [520, 592, 420], [1500, 590, 360], [1700, 588, 300], [1840, 590, 410]].forEach(([x, b, t], i) =>
      (s += lib.areca(x, b, t, { silhouette: true, scale: 0.55, color: '#3a1450', seed: 40 + i, lean: (i % 2 ? 1 : -1) * 18, frond: 120 })));
    s += lib.treeLine(598, 16, '#24092f', 6);
    // THE areca tree at the end of the path — unreasonably tall, with a halo so the eye goes there
    s += `<circle cx="${VP[0] + 30}" cy="96" r="150" fill="#ffd36b" opacity=".18"/><circle cx="${VP[0] + 30}" cy="96" r="90" fill="#ffe9a8" opacity=".22"/>`;
    s += K.radial(VP[0] + 30, 96, 120, 420, 40, { w: 8, seed: 71, color: '#ffe9a8', op: 0.35 });
    s += lib.areca(VP[0] + 6, 606, 92, { silhouette: true, scale: 1.25, color: '#12031c', seed: 99, lean: 26, frond: 150, fronds: 11, w: 22, leaflets: true });
    // tiny Tấm up top: a speck of gold and a waving arm
    s += `<circle cx="${VP[0] + 42}" cy="84" r="9" fill="#f7c325" stroke="${INK}" stroke-width="3"/>` +
      `<path d="${K.taper([[VP[0] + 46, 80], [VP[0] + 58, 62]], 5, { s: 0.2, e: 0.5 })}" fill="${INK}"/>`;
    // paddies
    const rows = [600, 616, 640, 680, 745, 850, 1080];
    const colsL = [-60000, -5200, -1800, -500, 300, 820], colsR = [1200, 1720, 2500, 3800, 7000, 60000];
    s += `<rect y="598" width="${W}" height="${H - 598}" fill="url(#pa-water)"/>`;
    const xAt = (xb, y) => VP[0] + (xb - VP[0]) * ((y - VP[1]) / (H - VP[1]));
    const cell = (xa, xb, ya, yb, k) => {
      const p = [[xAt(xa, ya), ya], [xAt(xb, ya), ya], [xAt(xb, yb), yb], [xAt(xa, yb), yb]];
      const water = (k % 3) !== 1;
      let c = `<path d="${K.poly(p)}" fill="${water ? 'url(#pa-water)' : 'url(#pa-rice)'}"/>`;
      if (!water) c += `<path d="${K.poly(p)}" fill="url(#lines-v)" opacity=".35"/>`;
      else {
        // seedling ticks in rows
        const ticks = [], rr = U.rng(k * 13 + ya);
        const nRows = Math.max(1, Math.round((yb - ya) / 18));
        for (let j = 0; j < nRows; j++) {
          const y = ya + ((j + 0.5) / nRows) * (yb - ya), sc = (y - VP[1]) / (H - VP[1]);
          const x0 = Math.max(-20, xAt(xa, y)), x1 = Math.min(W + 20, xAt(xb, y));
          for (let x = x0 + 10 * sc; x < x1 - 6 * sc; x += 38 * sc + 6) {
            const hh = 6 + 22 * sc;
            ticks.push(K.taper([[x, y], [x + (rr() - 0.5) * 6 * sc, y - hh]], 1.5 + 4 * sc, { s: 0, e: 0.8, min: 0.1 }));
          }
        }
        c += `<path d="${ticks.join('')}" fill="#0f4d45"/>`;
        c += `<path d="${K.poly(p)}" fill="url(#lines-f)" opacity=".12"/>`;
      }
      return c;
    };
    let k = 0;
    for (let r = 0; r < rows.length - 1; r++) {
      for (let c = 0; c < colsL.length - 1; c++) s += cell(colsL[c], colsL[c + 1], rows[r], rows[r + 1], k++);
      for (let c = 0; c < colsR.length - 1; c++) s += cell(colsR[c], colsR[c + 1], rows[r], rows[r + 1], k++);
    }
    // dikes (bờ ruộng): ink lines
    const dk = [];
    rows.slice(1, -1).forEach((y) => {
      const sc = (y - VP[1]) / (H - VP[1]);
      dk.push(K.taper([[xAt(colsL[0], y), y], [xAt(colsL[colsL.length - 1], y), y]], 3 + 14 * sc, { s: 0.02, e: 0.02, min: 0.8 }));
      dk.push(K.taper([[xAt(colsR[0], y), y], [xAt(colsR[colsR.length - 1], y), y]], 3 + 14 * sc, { s: 0.02, e: 0.02, min: 0.8 }));
    });
    [...colsL, ...colsR].forEach((xb) => dk.push(K.taper([[VP[0] + (xb - VP[0]) * 0.001, VP[1]], [xb, H]], 16, { s: 0.9, e: 0, min: 0.05, profile: (t) => t })));
    s += `<path d="${dk.join('')}" fill="${INK}"/>`;
    // road
    const road = [[VP[0] - 6, VP[1]], [VP[0] + 14, VP[1]], [1335, H], [690, H]];
    s += `<path d="${K.poly(road)}" fill="url(#pa-road)"/>`;
    s += `<path d="${K.poly([[VP[0] + 4, VP[1]], [VP[0] + 14, VP[1]], [1335, H], [1120, H]])}" fill="#8f4f25" opacity=".35"/>`;
    s += `<g>${K.hatch({ x: 690, y: 820, w: 640, h: 260 }, { angle: 90, gap: 22, w: 3, seed: 6, color: '#7a3f1c', op: 0.35 })}</g>`;
    s += `<path d="${K.taper([[VP[0] - 6, VP[1]], [690, H]], 12, { s: 0.9, e: 0, min: 0.08, profile: (t) => 0.2 + t })}${K.taper([[VP[0] + 14, VP[1]], [1335, H]], 12, { s: 0.9, e: 0, min: 0.08, profile: (t) => 0.2 + t })}" fill="${INK}"/>`;
    // pebbles & footprints on road
    const rr = U.rng(77); let pb = '';
    for (let i = 0; i < 40; i++) { const y = 640 + Math.pow(rr(), 0.6) * 440, sc = (y - VP[1]) / (H - VP[1]); const x = U.lerp(VP[0] - 6, 690, sc) + rr() * (U.lerp(VP[0] + 14, 1335, sc) - U.lerp(VP[0] - 6, 690, sc)); pb += `<ellipse cx="${r1(x)}" cy="${r1(y)}" rx="${r1(2 + 7 * sc)}" ry="${r1(1 + 3 * sc)}" fill="#6b3818" opacity=".6"/>`; }
    s += pb;
    // foreground tufts
    s += lib.tuft(90, 1090, 330, 1, { n: 22, w: 16 }) + lib.tuft(300, 1100, 240, 2, { n: 16 }) + lib.tuft(1650, 1095, 300, 3, { n: 20, w: 15 }) + lib.tuft(1860, 1100, 360, 4, { n: 24, w: 17 });
    s += lib.tuft(560, 1090, 150, 5, { n: 10, w: 10 }) + lib.tuft(1460, 1090, 170, 6, { n: 11, w: 10 });
    return K.svg(W, H, s, 'class="bg-svg"');
  };

  /* ======================================================= BG: TREE (Ch I, low angle up the areca) */
  ART.bg.tree = function () {
    let s = `<defs>${lib.grad('tr-sky', [[0, '#1c0a3a'], [0.45, '#6d1d66'], [0.8, '#e0485a'], [1, '#ff9d4d']])}
      ${lib.grad('tr-trunk', [[0, '#8d7a64'], [0.45, '#e8d6b4'], [0.6, '#cdb893'], [1, '#6e5a48']], 0, 0, 1, 0)}
      ${lib.grad('tr-ground', [[0, '#2c6b4a'], [1, '#0f2f2a']])}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#tr-sky)"/>`;
    // dramatic radial speed lines from the crown
    const C = [1030, 150];
    s += K.radial(C[0], C[1], 260, 2300, 150, { w: 26, seed: 3, color: '#12051e', op: 0.55 });
    s += `<image href="${K.halftone('tr-ht', 960, 540, (u, v) => Math.max(0, Math.hypot(u - 0.54, v - 0.14) * 1.25 - 0.25), { step: 13, color: '#12051e' })}" width="${W}" height="${H}" opacity=".45"/>`;
    // distant palms at angles (converging upward, low-angle perspective)
    [[180, -140], [420, -70], [1560, 60], [1790, 150]].forEach(([x, lean], i) => (s += lib.areca(x, 1100, 360 + i * 30, { silhouette: true, scale: 0.8, color: '#2b0c38', seed: 60 + i, lean, frond: 150, w: 26 })));
    // ground at bottom
    s += `<path d="M0 1000 C 400 960, 800 990, 1100 975 S 1700 950, 1920 990 L1920 1080 L0 1080Z" fill="url(#tr-ground)" stroke="${INK}" stroke-width="6"/>`;
    s += lib.tuft(120, 1085, 260, 11, { n: 20, w: 15 }) + lib.tuft(1780, 1085, 280, 12, { n: 22, w: 16 }) + lib.tuft(700, 1080, 140, 13, { n: 10 }) + lib.tuft(1300, 1085, 160, 14, { n: 12 });
    return K.svg(W, H, s, 'class="bg-svg"');
  };
  /* ======================================================= BG: STEPS (Ch V — the approach panel)
     Same staging as the manga panel: warm paper, bundles of diagonal speed-hatching, and the
     palace terrace's grey stone cutting in from the lower right, its edge the line Cám walks along. */
  lib.STEP_EDGE = (x) => 1080 - ((x - 1000) / 920) * 440;
  ART.bg.steps = function () {
    let s = `<defs>${lib.grad('st-paper', [[0, '#fbefd6'], [0.6, '#f4dfb4'], [1, '#ecd09a']], 0, 0, 1, 1)}
      ${lib.grad('st-stone', [[0, '#e9e6e1'], [0.5, '#cfcac3'], [1, '#a29b93']], 0, 0, 1, 1)}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#st-paper)"/>`;
    // the panel's speed-hatching: long strokes falling gently to the right, gathered in bundles
    const rnd = U.rng(143), dx = Math.cos(0.3), dy = Math.sin(0.3);
    const thin = [], thick = [];
    for (let b = 0; b < 26; b++) {
      const by = -300 + rnd() * 1300, bx = -500 + rnd() * 2200, n = 6 + Math.floor(rnd() * 10);
      for (let i = 0; i < n; i++) {
        const y = by + i * (7 + rnd() * 7), x = bx + (rnd() - 0.5) * 260, L = 380 + rnd() * 900;
        (rnd() < 0.18 ? thick : thin).push(K.taper([[x, y], [x + dx * L, y + dy * L]], rnd() < 0.18 ? 5 + rnd() * 4 : 1.6 + rnd() * 2.4, { s: 0.25, e: 0.35, min: 0 }));
      }
    }
    s += `<path d="${thin.join('')}" fill="#c08a4a" opacity=".55"/><path d="${thick.join('')}" fill="#9a6630" opacity=".45"/>`;
    s += `<image href="${K.halftone('st-ht2', 960, 540, (u, v) => Math.max(0, 0.55 - Math.hypot(u - 0.62, v - 0.35) * 1.5) * 0.7, { step: 12, color: '#c08a4a' })}" width="${W}" height="${H}" opacity=".35"/>`;
    // the terrace: grey stone wedge, paving joints running off toward the palace
    const E = lib.STEP_EDGE;
    s += `<path d="M1000 1080 L1920 ${E(1920)} L1920 1080 Z" fill="url(#st-stone)"/>`;
    s += `<path d="M1000 1080 L1920 ${E(1920)} L1920 ${E(1920) + 30} L1034 1080 Z" fill="#fbfaf7"/>`;
    const pv = [];
    for (let i = 1; i < 9; i++) { const x = 1000 + i * 116; pv.push(K.taper([[x, E(x) + 6], [x + 280 + i * 34, 1080]], 3 + i * 0.3, { s: 0.05, e: 0.05, min: 0.6 })); }
    for (let j = 1; j < 5; j++) { const t = j / 5; pv.push(K.taper([[1000 + t * 300, 1080 - t * 143], [1920, E(1920) + t * 440 * 0.95]], 2.6 + j * 0.6, { s: 0.02, e: 0.02, min: 0.8 })); }
    s += `<path d="${pv.join('')}" fill="#7d756d" opacity=".7"/>`;
    s += K.hatch({ x: 1300, y: 860, w: 620, h: 220 }, { angle: 12, gap: 18, w: 2.2, seed: 31, color: '#6b625a', op: 0.35, fade: [0.1, 0.4] });
    s += `<path d="M1000 1080 L1920 ${E(1920)}" stroke="${INK}" stroke-width="9" fill="none"/>`;
    // crumbs kicked up along the edge
    for (let i = 0; i < 16; i++) { const x = 1060 + rnd() * 840, y = E(x) - 8 - rnd() * 40; s += `<circle cx="${K.r1(x)}" cy="${K.r1(y)}" r="${K.r1(2 + rnd() * 4)}" fill="${INK}" opacity=".55"/>`; }
    return K.svg(W, H, s, 'class="bg-svg"');
  };

  /* ======================================================= BG: COURTYARD (Ch II — palace laundry, pink JoJo sky) */
  lib.palaceRoof = function (x, y, w, h, o = {}) {
    // upturned-eave roof (mái đao) with glazed yellow tiles and dragon-tip corners
    const tile = o.tile || '#f2b624', dark = o.dark || '#a86a0a';
    const L = x, R = x + w, T = y, B = y + h, curl = h * 0.55;
    const d = `M${L - 40} ${B - curl} Q${L + w * 0.08} ${B + 6} ${L + w * 0.2} ${B} L${R - w * 0.2} ${B} Q${R - w * 0.08} ${B + 6} ${R + 40} ${B - curl} L${R - w * 0.08} ${T + h * 0.35} Q${x + w / 2} ${T - h * 0.05} ${L + w * 0.08} ${T + h * 0.35} Z`;
    let s = `<path d="${d}" fill="${INK}" transform="translate(6 7)"/><path d="${d}" fill="${tile}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`;
    // tile rows
    const rows = [];
    for (let i = 1; i < 6; i++) { const t = i / 6; rows.push(K.taper([[L + w * 0.1 - 30 * t, T + h * 0.35 + (B - T - h * 0.35) * t], [R - w * 0.1 + 30 * t, T + h * 0.35 + (B - T - h * 0.35) * t]], 3, { s: 0.05, e: 0.05, min: 0.7 })); }
    for (let i = 0; i <= 24; i++) { const t = i / 24, xx = L + w * 0.1 + (w * 0.8) * t; rows.push(K.taper([[xx, T + h * 0.36], [L - 20 + (w + 40) * t, B - 2]], 2.4, { s: 0.1, e: 0.1, min: 0.6 })); }
    s += `<path d="${rows.join('')}" fill="${dark}" opacity=".85"/>`;
    // ridge + dragon tips
    s += `<path d="M${L + w * 0.08} ${T + h * 0.35} Q${x + w / 2} ${T - h * 0.05} ${R - w * 0.08} ${T + h * 0.35}" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>`;
    s += `<path d="M${L + w * 0.08} ${T + h * 0.35} Q${x + w / 2} ${T - h * 0.05} ${R - w * 0.08} ${T + h * 0.35}" fill="none" stroke="#3a9d6a" stroke-width="8" stroke-linecap="round"/>`;
    [[L - 40, B - curl, -1], [R + 40, B - curl, 1]].forEach(([cx, cy, sd]) => {
      s += `<path d="M${cx} ${cy} q${sd * 18} -40 ${sd * 2} -70 q${sd * -10} 22 ${sd * -28} 20" fill="#3a9d6a" stroke="${INK}" stroke-width="5"/>`;
    });
    s += `<circle cx="${x + w / 2}" cy="${T + h * 0.1}" r="${h * 0.12}" fill="#f7c325" stroke="${INK}" stroke-width="5"/>`;
    return s;
  };
  ART.bg.courtyard = function () {
    let s = `<defs>${lib.grad('cy-sky', [[0, '#ff9ec7'], [0.5, '#ffc2d8'], [1, '#fff0c9']])}
      ${lib.grad('cy-wall', [[0, '#c0392b'], [1, '#7a1f1a']])}
      ${lib.grad('cy-floor', [[0, '#c7866a'], [1, '#8a4a36']])}
      ${lib.grad('cy-water', [[0, '#bdf3ff'], [1, '#62c3e0']])}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#cy-sky)"/>`;
    s += lib.streaks({ x: -200, y: 60, w: 2200, h: 300 }, 22, '#ffffff', 41, { op: 0.75, len: 480, w: 14 });
    s += lib.streaks({ x: -200, y: 120, w: 2200, h: 260 }, 14, '#e06aa0', 42, { op: 0.35, len: 400, w: 8 });
    s += `<image href="${K.halftone('cy-ht', 960, 300, (u, v) => Math.max(0, 0.7 - v * 1.2) * 0.9, { step: 13, color: '#b0306a' })}" width="${W}" height="600" opacity=".35"/>`;
    // palace hall
    s += `<rect x="180" y="330" width="1560" height="330" fill="url(#cy-wall)" stroke="${INK}" stroke-width="7"/>`;
    // doors & lattice
    for (let i = 0; i < 7; i++) {
      const x = 250 + i * 206;
      s += `<rect x="${x}" y="400" width="150" height="260" fill="#8a2a1c" stroke="${INK}" stroke-width="5"/>`;
      s += `<rect x="${x + 16}" y="420" width="118" height="110" fill="#5a1a12" stroke="#f2b624" stroke-width="3"/>`;
      s += `<path d="M${x + 16} 475 H${x + 134} M${x + 75} 420 V530" stroke="#f2b624" stroke-width="3"/>`;
    }
    // red columns
    [200, 440, 646, 852, 1058, 1264, 1470, 1700].forEach((x) => { s += `<rect x="${x - 18}" y="330" width="36" height="330" fill="#d63a2a" stroke="${INK}" stroke-width="5"/><rect x="${x - 10}" y="330" width="8" height="330" fill="#ff8a70" opacity=".6"/>`; });
    s += `<rect x="150" y="640" width="1620" height="40" fill="#e8dcc4" stroke="${INK}" stroke-width="6"/>`;
    s += lib.palaceRoof(120, 200, 1680, 150);
    s += lib.palaceRoof(420, 70, 1080, 120);
    s += `<rect x="560" y="186" width="800" height="30" fill="#7a1f1a" stroke="${INK}" stroke-width="5"/>`;
    // courtyard brick floor (gạch bát tràng) in perspective
    s += `<path d="M0 680 L1920 680 L1920 1080 L0 1080Z" fill="url(#cy-floor)"/>`;
    const fl = [], VP = [960, 380];
    for (let i = -16; i <= 16; i++) { const xb = 960 + i * 150; fl.push(K.taper([[U.lerp(VP[0], xb, (680 - VP[1]) / (1080 - VP[1])), 680], [xb, 1080]], 4, { s: 0.6, e: 0.02, min: 0.2, profile: (t) => 0.3 + t })); }
    [700, 730, 772, 830, 910, 1010].forEach((y, i) => fl.push(K.taper([[0, y], [1920, y]], 2 + i, { s: 0.01, e: 0.01, min: 0.9 })));
    s += `<path d="${fl.join('')}" fill="${INK}" opacity=".55"/>`;
    // clothesline: forked posts + bamboo pole + royal laundry
    s += `<path d="${K.taper([[1840, 1040], [1832, 470]], 26, { s: 0.02, e: 0.02, min: 0.9 })}" fill="${INK}"/><path d="${K.taper([[1840, 1036], [1832, 474]], 16, { s: 0.02, e: 0.02, min: 0.9 })}" fill="#a57a3c"/>`;
    s += `<path d="M1812 480 L1800 440 M1852 480 L1866 440" stroke="${INK}" stroke-width="12" stroke-linecap="round"/>`;
    s += `<path d="${K.taper([[860, 528], [1880, 506]], 22, { s: 0.01, e: 0.01, min: 0.9 })}" fill="${INK}"/><path d="${K.taper([[862, 526], [1878, 504]], 13, { s: 0.01, e: 0.01, min: 0.9 })}" fill="#c9b36a"/>`;
    [980, 1180, 1500, 1700].forEach((x) => (s += `<rect x="${x - 3}" y="${516 - (x - 860) * 0.022}" width="6" height="14" fill="${INK}"/>`));
    // hanging robes
    const robe = (x, col, trim) => {
      const y = 530 - (x - 860) * 0.022;
      let r = `<path d="M${x - 90} ${y} L${x + 90} ${y} L${x + 150} ${y + 60} L${x + 110} ${y + 90} L${x + 80} ${y + 70} L${x + 80} ${y + 330} L${x - 80} ${y + 330} L${x - 80} ${y + 70} L${x - 110} ${y + 90} L${x - 150} ${y + 60} Z" fill="${col}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`;
      r += `<path d="M${x - 80} ${y + 300} L${x + 80} ${y + 300}" stroke="${trim}" stroke-width="12"/><path d="M${x} ${y} L${x} ${y + 330}" stroke="${INK}" stroke-width="3" opacity=".5"/>`;
      r += `<path d="M${x + 20} ${y + 10} L${x + 80} ${y + 70} L${x + 80} ${y + 330} L${x + 30} ${y + 330}Z" fill="${INK}" opacity=".25"/>`;
      return r;
    };
    s += robe(1010, '#f7c325', '#d63a2a') + robe(1620, '#ffffff', '#3a9d6a');
    // dragon squiggle on the yellow robe
    s += `<path d="${K.taper([[960, 640], [1000, 610], [1040, 650], [1010, 700], [1050, 740]], 9, { s: 0.1, e: 0.5 })}" fill="#d63a2a"/>`;
    // washing basin (chậu) + bubbles + washboard, foreground left
    s += `<ellipse cx="420" cy="930" rx="300" ry="95" fill="${INK}" transform="translate(8 10)"/><path d="M120 930 Q420 1100 720 930 L700 1010 Q420 1150 140 1010Z" fill="#9c5a2e" stroke="${INK}" stroke-width="7"/>`;
    s += `<ellipse cx="420" cy="930" rx="300" ry="95" fill="#b56a36" stroke="${INK}" stroke-width="7"/><ellipse cx="420" cy="936" rx="262" ry="72" fill="url(#cy-water)" stroke="${INK}" stroke-width="4"/>`;
    const rb = U.rng(9); let bub = '';
    for (let i = 0; i < 26; i++) { const x = 220 + rb() * 400, y = 880 + rb() * 90, r = 8 + rb() * 22; bub += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="#fff" fill-opacity=".85" stroke="${INK}" stroke-width="3"/><circle cx="${r1(x - r * 0.3)}" cy="${r1(y - r * 0.3)}" r="${r1(r * 0.25)}" fill="#fff"/>`; }
    s += bub;
    s += `<path d="M560 800 L660 790 L700 980 L600 990Z" fill="#c9a56a" stroke="${INK}" stroke-width="6"/>` + K.hatch({ x: 580, y: 800, w: 110, h: 180 }, { angle: 5, gap: 14, w: 3, seed: 3, color: INK, op: 0.6 });
    // potted bonsai at left edge
    s += `<path d="M20 700 L180 700 L160 800 L40 800Z" fill="#3a6e9c" stroke="${INK}" stroke-width="6"/><path d="M40 720 H160" stroke="#fff" stroke-width="4" opacity=".6"/>`;
    s += `<path d="${K.taper([[100, 700], [80, 620], [120, 560], [90, 500]], 16, { s: 0.02, e: 0.6 })}" fill="#5a3616"/>`;
    [[60, 520, 60], [140, 560, 54], [96, 470, 50]].forEach(([x, y, r]) => (s += `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.6}" fill="#2f8a4e" stroke="${INK}" stroke-width="5"/>`));
    return K.svg(W, H, s, 'class="bg-svg"');
  };

  /* ======================================================= BG: LOOM ROOM (Ch III — night, candle, dread) */
  ART.bg.loomroom = function () {
    let s = `<defs>${lib.grad('lr-wall', [[0, '#2a1f45'], [1, '#120c24']])}
      ${lib.rgrad('lr-glow', [[0, '#ffb347', 0.75], [0.35, '#ff7a2e', 0.35], [1, '#ff7a2e', 0]], 0.5, 0.5, 0.5)}
      ${lib.rgrad('lr-moon', [[0, '#e8f4ff'], [1, '#7fa4d9']], 0.5, 0.5, 0.5)}
      ${lib.grad('lr-floor', [[0, '#3a2a3e'], [1, '#150d1a']])}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#lr-wall)"/>`;
    // wall planks
    const pl = [];
    for (let x = 0; x < W; x += 120) pl.push(K.taper([[x, 0], [x + 4, 760]], 5, { s: 0.02, e: 0.02, min: 0.8 }));
    s += `<path d="${pl.join('')}" fill="#0a0614" opacity=".8"/>`;
    s += K.hatch({ x: 0, y: 0, w: W, h: 760 }, { angle: 90, gap: 26, w: 2, seed: 5, color: '#3d2d5e', op: 0.5 });
    // paper window with moonlight + bars
    s += `<rect x="1420" y="120" width="360" height="300" fill="url(#lr-moon)" stroke="${INK}" stroke-width="10"/>`;
    s += `<circle cx="1640" cy="220" r="70" fill="#fffbe8" opacity=".9"/>`;
    [1510, 1600, 1690].forEach((x) => (s += `<rect x="${x - 6}" y="120" width="12" height="300" fill="${INK}"/>`));
    s += `<rect x="1420" y="262" width="360" height="12" fill="${INK}"/>`;
    s += `<path d="M1420 420 L1180 1080 L1860 1080 L1780 420Z" fill="#9fc3ff" opacity=".08"/>`;
    // floor
    s += `<path d="M0 760 L1920 760 L1920 1080 L0 1080Z" fill="url(#lr-floor)"/>`;
    const fb = [];
    for (let i = -10; i <= 10; i++) fb.push(K.taper([[960 + i * 60, 760], [960 + i * 260, 1080]], 4, { s: 0.5, e: 0.02, min: 0.2, profile: (t) => 0.3 + t }));
    s += `<path d="${fb.join('')}" fill="#0a0614" opacity=".7"/>`;
    s += `<path d="M0 760 H1920" stroke="${INK}" stroke-width="8"/>`;
    // cobweb corner
    const cw = [];
    for (let i = 0; i < 7; i++) { const a = (i / 6) * Math.PI / 2; cw.push(K.taper([[0, 0], [Math.cos(a) * 320, Math.sin(a) * 320]], 2.5, { s: 0.02, e: 0.9 })); }
    s += `<path d="${cw.join('')}" fill="#8f86b0" opacity=".6"/>`;
    [90, 160, 230, 300].forEach((r) => (s += `<path d="${K.smooth(Array.from({ length: 7 }, (_, i) => { const a = (i / 6) * Math.PI / 2; const rr = r * (0.92 + (i % 2) * 0.08); return [Math.cos(a) * rr, Math.sin(a) * rr]; }))}" fill="none" stroke="#8f86b0" stroke-width="2" opacity=".6"/>`));
    // candle on a low table (left) + glow
    s += `<circle cx="300" cy="640" r="520" fill="url(#lr-glow)"/>`;
    s += `<path d="M150 760 L450 760 L430 800 L170 800Z" fill="#4a2a1a" stroke="${INK}" stroke-width="6"/><rect x="180" y="800" width="24" height="120" fill="#3a2010" stroke="${INK}" stroke-width="5"/><rect x="396" y="800" width="24" height="120" fill="#3a2010" stroke="${INK}" stroke-width="5"/>`;
    s += `<rect x="276" y="650" width="46" height="110" fill="#f4ebd4" stroke="${INK}" stroke-width="6"/><path d="M276 670 q10 14 0 30" fill="none" stroke="#d9cfb2" stroke-width="5"/>`;
    s += `<path d="M299 650 L299 632" stroke="${INK}" stroke-width="4"/><path d="M299 560 q-26 40 0 74 q26 -34 0 -74z" fill="#ffd36b" stroke="${INK}" stroke-width="4"/><path d="M299 590 q-10 20 0 38 q10 -18 0 -38z" fill="#fff6c8"/>`;
    // vignette + halftone darkness
    s += `<image href="${K.halftone('lr-ht', 960, 540, (u, v) => Math.max(0, Math.hypot(u - 0.5, v - 0.55) * 1.7 - 0.45), { step: 12, color: '#05030a' })}" width="${W}" height="${H}" opacity=".6"/>`;
    return K.svg(W, H, s, 'class="bg-svg"');
  };

  /* ======================================================= BG: TEASHOP (Ch IV — roadside stall under a thị tree) */
  ART.bg.teashop = function () {
    let s = `<defs>${lib.grad('ts-sky', [[0, '#ffb35c'], [0.6, '#ffd98a'], [1, '#fff3c4']])}
      ${lib.grad('ts-ground', [[0, '#d9a45a'], [1, '#9c6a32']])}
      ${lib.grad('ts-leaf', [[0, '#4caf6a'], [1, '#1f6b3e']])}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#ts-sky)"/>`;
    s += lib.streaks({ x: -200, y: 80, w: 2200, h: 260 }, 16, '#fff6dc', 51, { op: 0.8, len: 460, w: 14 });
    s += `<circle cx="420" cy="260" r="120" fill="#fff6c8" opacity=".85"/>`;
    // distant fields + bamboo
    s += lib.treeLine(560, 50, '#6b8f3a', 8, { bamboo: 18 });
    s += `<path d="M0 600 L1920 600 L1920 700 L0 700Z" fill="#8fbf4a"/>` + K.hatch({ x: 0, y: 600, w: 1920, h: 100 }, { angle: 0, gap: 12, w: 2, seed: 2, color: '#5a8a2a', op: 0.6 });
    // road
    s += `<path d="M0 700 L1920 700 L1920 1080 L0 1080Z" fill="url(#ts-ground)"/>`;
    s += K.hatch({ x: 0, y: 720, w: 1920, h: 360 }, { angle: 4, gap: 26, w: 2.4, seed: 7, color: '#7a4a1e', op: 0.45, fade: [0.1, 0.3] });
    // thị tree (right): trunk + dense crown, one golden fruit hangs as an actor
    // limbs are inked as ONE silhouette: all outlines first, then all fills, so forks join with no seams;
    // every tip ends inside a guaranteed leaf clump below
    const limbs = [
      K.taper([[1562, 1092], [1546, 830], [1510, 640], [1478, 480], [1452, 320]], 104, { s: 0, e: 0.95, min: 0.3 }),
      K.taper([[1516, 660], [1482, 566], [1424, 452], [1356, 334], [1306, 246]], 50, { s: 0, e: 0.9, min: 0.28 }),
      K.taper([[1508, 600], [1556, 520], [1640, 430], [1730, 354], [1806, 300]], 46, { s: 0, e: 0.9, min: 0.28 }),
      K.taper([[1484, 500], [1520, 420], [1552, 352], [1566, 292]], 28, { s: 0, e: 0.85, min: 0.3 }),
    ].join('');
    s += `<defs><clipPath id="ts-limbs"><path d="${limbs}"/></clipPath></defs>`;
    s += `<path d="${limbs}" fill="${INK}" stroke="${INK}" stroke-width="12" stroke-linejoin="round" transform="translate(9 5)"/>`;
    s += `<path d="${limbs}" fill="${INK}" stroke="${INK}" stroke-width="12" stroke-linejoin="round"/>`;
    s += `<g clip-path="url(#ts-limbs)"><rect x="1200" y="200" width="720" height="900" fill="#4a2a14"/>`;
    s += `<path d="${limbs}" fill="#6b4226" transform="translate(-16 0)"/>`;
    s += `<path d="${limbs}" fill="#8a5a34" opacity=".55" transform="translate(-34 0)"/>`;
    s += K.hatch({ x: 1500, y: 560, w: 110, h: 520 }, { angle: 80, gap: 12, w: 3, seed: 9, color: INK, op: 0.5 });
    const bark = [[[1528, 1070], [1520, 900], [1500, 760]], [[1556, 1060], [1552, 930], [1538, 820]], [[1500, 700], [1486, 600], [1470, 520]], [[1440, 470], [1400, 400], [1366, 344]], [[1600, 470], [1660, 410], [1720, 364]]];
    s += `<path d="${bark.map((p) => K.taper(p, 4, { s: 0.3, e: 0.4 })).join('')}" fill="${INK}" opacity=".45"/></g>`;
    s += `<ellipse cx="1528" cy="880" rx="11" ry="17" fill="#4a2a14" stroke="${INK}" stroke-width="4"/><path d="M1522 872 q6 8 0 16" fill="none" stroke="${INK}" stroke-width="3" opacity=".7"/>`;
    const rnd = U.rng(77), blobs = [];
    for (let i = 0; i < 26; i++) { const x = 1140 + rnd() * 780, y = 40 + rnd() * 330, r = 70 + rnd() * 70; blobs.push(`M${x - r} ${y} a${r} ${r * 0.72} 0 1 0 ${2 * r} 0 a${r} ${r * 0.72} 0 1 0 ${-2 * r} 0`); }
    [[1300, 240, 92], [1452, 300, 112], [1594, 282, 100], [1792, 292, 112]].forEach(([x, y, r]) => blobs.push(`M${x - r} ${y} a${r} ${r * 0.72} 0 1 0 ${2 * r} 0 a${r} ${r * 0.72} 0 1 0 ${-2 * r} 0`));
    s += `<path d="${blobs.join('')}" fill="${INK}" stroke="${INK}" stroke-width="14"/><path d="${blobs.join('')}" fill="url(#ts-leaf)"/>`;
    const lv = [];
    for (let i = 0; i < 90; i++) { const x = 1150 + rnd() * 760, y = 40 + rnd() * 340; lv.push(K.taper([[x, y], [x + 14, y + 22]], 10, { s: 0.3, e: 0.6 })); }
    s += `<path d="${lv.join('')}" fill="#9be07a" opacity=".7"/>`;
    s += `<path d="M1310 230 L1326 280" stroke="${INK}" stroke-width="5"/>`; // stem where the fruit hangs
    // the stall: thatched roof on bamboo poles, bench, kettle & bowls
    s += `<path d="${K.taper([[260, 1000], [270, 440]], 22, { s: 0.02, e: 0.02, min: 0.9 })}" fill="#b08a48" stroke="${INK}" stroke-width="5"/><path d="${K.taper([[900, 1000], [890, 440]], 22, { s: 0.02, e: 0.02, min: 0.9 })}" fill="#b08a48" stroke="${INK}" stroke-width="5"/>`;
    s += `<path d="M150 470 Q580 300 1020 470 L980 520 Q580 380 190 520Z" fill="#d9b25a" stroke="${INK}" stroke-width="7"/>`;
    s += K.hatch({ x: 150, y: 330, w: 870, h: 190 }, { angle: 100, gap: 12, w: 2.6, seed: 11, color: '#8a6a2a', op: 0.9 });
    s += `<path d="M150 470 Q580 300 1020 470" fill="none" stroke="${INK}" stroke-width="7"/>`;
    // bench (chõng tre)
    s += `<path d="M300 820 L880 820 L900 860 L280 860Z" fill="#c9a060" stroke="${INK}" stroke-width="6"/>` + K.hatch({ x: 300, y: 822, w: 580, h: 36 }, { angle: 90, gap: 14, w: 2.4, seed: 5, color: '#8a6a2a' });
    [320, 860].forEach((x) => (s += `<rect x="${x - 10}" y="860" width="20" height="120" fill="#9c7a40" stroke="${INK}" stroke-width="5"/>`));
    // kettle + bowls + a betel tray
    s += `<ellipse cx="760" cy="800" rx="70" ry="54" fill="#7a3a1e" stroke="${INK}" stroke-width="6"/><path d="M820 790 q50 -10 60 -40" fill="none" stroke="${INK}" stroke-width="10"/><path d="M820 790 q50 -10 60 -40" fill="none" stroke="#7a3a1e" stroke-width="5"/><ellipse cx="760" cy="752" rx="30" ry="10" fill="#5a2a14" stroke="${INK}" stroke-width="4"/>`;
    [[560, 810], [640, 812]].forEach(([x, y]) => (s += `<path d="M${x - 34} ${y - 14} Q${x} ${y + 26} ${x + 34} ${y - 14}Z" fill="#e8f0f4" stroke="${INK}" stroke-width="5"/><ellipse cx="${x}" cy="${y - 14}" rx="34" ry="8" fill="#9ed06a" stroke="${INK}" stroke-width="3"/>`));
    s += `<ellipse cx="420" cy="812" rx="70" ry="18" fill="#c0392b" stroke="${INK}" stroke-width="5"/>`;
    [[396, 802], [430, 798], [456, 806]].forEach(([x, y]) => (s += `<path d="M${x} ${y} l14 -12 l14 12 l-14 6z" fill="#3a9d4a" stroke="${INK}" stroke-width="3"/>`));
    // hanging sign-less lantern
    s += `<path d="M580 470 L580 520" stroke="${INK}" stroke-width="4"/><ellipse cx="580" cy="560" rx="34" ry="44" fill="#e0302a" stroke="${INK}" stroke-width="5"/><path d="M556 560 H604" stroke="#ffd36b" stroke-width="4"/>`;
    return K.svg(W, H, s, 'class="bg-svg"');
  };

  /* ======================================================= BG: BATTLE (the rush) — split colours, focus lines */
  ART.bg.battle = function () {
    let s = `<defs>${lib.grad('bt-l', [[0, '#fff08a'], [1, '#e0a010']], 0, 0, 1, 1)}${lib.grad('bt-r', [[0, '#ffb6d6'], [1, '#c2185b']], 1, 0, 0, 1)}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#bt-l)"/>`;
    s += `<path d="M1060 0 L1920 0 L1920 1080 L860 1080 Z" fill="url(#bt-r)"/>`;
    s += K.radial(960, 520, 120, 2200, 160, { w: 30, seed: 77, color: INK, op: 0.5 });
    s += `<image href="${K.halftone('bt-ht', 960, 540, (u, v) => Math.max(0, Math.hypot(u - 0.5, v - 0.48) * 1.5 - 0.2), { step: 14, color: INK })}" width="${W}" height="${H}" opacity=".45"/>`;
    s += `<path d="M1060 0 L860 1080" stroke="${INK}" stroke-width="18"/><path d="M1060 0 L860 1080" stroke="#fff" stroke-width="6"/>`;
    return K.svg(W, H, s, 'class="bg-svg"');
  };

  // embed another art piece (character svg) inside a background at x,y,width
  lib.embed = function (svg, x, y, w, extra = '') {
    const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
    const vw = +m[1], vh = +m[2], h = (w * vh) / vw;
    return svg.replace(/^<svg[^>]*>/, `<svg x="${x}" y="${y}" width="${w}" height="${r1(h)}" viewBox="0 0 ${vw} ${vh}" overflow="visible" ${extra}>`);
  };

  /* ======================================================= BG: LYING (aftermath — top-down, both sisters on the stones) */
  ART.bg.lying = function () {
    const F = ART.face;
    let s = `<defs>${lib.grad('ly-st', [[0, '#d8d2c8'], [1, '#a9a196']], 0, 0, 1, 1)}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#ly-st)"/>`;
    // paving grid (top-down)
    const g = [];
    for (let x = -60; x < W + 60; x += 240) g.push(K.taper([[x, 0], [x + 30, H]], 5, { s: 0.02, e: 0.02, min: 0.9 }));
    for (let y = 60; y < H; y += 200) g.push(K.taper([[0, y], [W, y + 20]], 5, { s: 0.02, e: 0.02, min: 0.9 }));
    s += `<path d="${g.join('')}" fill="#5b5058" opacity=".55"/>`;
    s += K.hatch({ x: 0, y: 0, w: W, h: H }, { angle: 30, gap: 30, w: 1.6, seed: 4, color: '#6b6068', op: 0.25, fade: [0.05, 0.2] });
    // cracks from the impact
    s += K.radial(960, 540, 160, 900, 14, { w: 8, seed: 12, color: INK, op: 0.5 });
    // Cám (left, head toward centre), lying on her back: coat spread, hat fallen off beside her
    s += `<g transform="translate(690 540) rotate(90)">`;
    s += inked(sm([[-120, 40], [-160, 260], [-120, 520], [120, 520], [160, 260], [120, 40], [0, 20]]), '#26205c', 7);
    s += `<path d="M0 30 L0 520" stroke="${INK}" stroke-width="5"/>`;
    s += inked(sm([[-120, 60], [-250, 120], [-300, 220], [-260, 240], [-180, 160], [-110, 130]]), '#26205c', 6) + inked(sm([[120, 60], [240, 20], [320, 40], [300, 80], [220, 90], [110, 130]]), '#26205c', 6);
    s += `<g transform="translate(0 -70) scale(.95)">${F({ expr: 'soft', skin: '#f0c9a0', iris: '#2b2466', lips: '#a0425a' })}</g>`;
    s += inked(sm([[-110, -70], [-120, -170], [-60, -220], [60, -220], [120, -170], [110, -70], [60, -120], [-60, -120]]), '#15122e', 6);
    s += `</g>`;
    s += `<g transform="translate(420 250) rotate(-25)"><path d="M0 -90 L130 20 L-130 20 Z" fill="#e9d49c" stroke="${INK}" stroke-width="7"/><path d="M0 -90 L130 20 L0 20Z" fill="#8a6a2a" opacity=".35"/></g>`;
    // Tấm (right, head toward centre)
    s += `<g transform="translate(1230 540) rotate(-90)">`;
    s += inked(sm([[-130, 40], [-180, 260], [-150, 540], [150, 540], [180, 260], [130, 40], [0, 20]]), '#f7c325', 7);
    s += `<path d="M-60 30 L0 180 L60 30" fill="#c0392b" stroke="${INK}" stroke-width="5"/>`;
    s += inked(sm([[-130, 60], [-260, 20], [-330, 40], [-310, 90], [-220, 100], [-120, 130]]), '#f7c325', 6) + inked(sm([[130, 60], [250, 140], [290, 230], [250, 250], [180, 170], [120, 130]]), '#f7c325', 6);
    s += `<g transform="translate(0 -70) scale(.95)">${F({ expr: 'soft', shadowSide: -1 })}</g>`;
    s += inked(sm([[-110, -70], [-120, -170], [-60, -230], [60, -230], [120, -170], [110, -70], [60, -120], [-60, -120]]), '#15142e', 6);
    s += `<path d="M-40 -250 c-14 -18 -40 -6 -30 14 l30 28 l30 -28 c10 -20 -16 -32 -30 -14z" fill="#ffd84a" stroke="${INK}" stroke-width="5"/>`;
    s += `</g>`;
    // dust puffs
    const pr = U.rng(21);
    [[700, 300], [1240, 800], [960, 170], [820, 900], [1300, 260]].forEach(([x, y]) => { const pf = []; for (let i = 0; i < 5; i++) { const r = 14 + pr() * 16; pf.push(`M${r1(x + (pr() - 0.5) * 60 - r)} ${r1(y + (pr() - 0.5) * 30)} a${r1(r)} ${r1(r)} 0 1 0 ${r1(2 * r)} 0 a${r1(r)} ${r1(r)} 0 1 0 ${r1(-2 * r)} 0`); } s += `<path d="${pf.join('')}" fill="${INK}" stroke="${INK}" stroke-width="8"/><path d="${pf.join('')}" fill="#efe6d4"/>`; });
    s += `<image href="${K.halftone('ly-ht', 960, 540, (u, v) => Math.max(0, Math.hypot(u - 0.5, v - 0.5) * 1.8 - 0.55), { step: 13, color: INK })}" width="${W}" height="${H}" opacity=".5"/>`;
    return K.svg(W, H, s, 'class="bg-svg"');
  };

  /* ======================================================= BG: CROW (canon ending — the jar of mắm) */
  ART.bg.crow = function () {
    let s = `<defs>${lib.grad('cr-w', [[0, '#3a2f2a'], [1, '#1a1412']])}${lib.rgrad('cr-l', [[0, '#ffe7a8', 0.6], [1, '#ffe7a8', 0]], 0.5, 0.3, 0.6)}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#cr-w)"/>`;
    s += `<rect width="${W}" height="${H}" fill="url(#cr-l)"/>`;
    // roof beams + the crow
    s += `<path d="M0 150 L1920 90 L1920 150 L0 210Z" fill="#5a3a22" stroke="${INK}" stroke-width="7"/>`;
    s += `<path d="M1380 120 Q1440 40 1540 60 Q1600 80 1620 120 L1680 130 L1620 150 Q1560 200 1460 180 Q1400 170 1380 120Z" fill="#141018" stroke="${INK}" stroke-width="5"/>`;
    s += `<circle cx="1560" cy="100" r="8" fill="#fff"/><path d="M1620 120 L1700 116 L1624 138Z" fill="#555" stroke="${INK}" stroke-width="3"/>`;
    s += `<path d="M1460 180 l-10 30 m30 -28 l0 30" stroke="${INK}" stroke-width="6"/>`;
    // table + the jar with a sad little face
    s += `<path d="M420 820 L1500 820 L1560 880 L360 880Z" fill="#6b4226" stroke="${INK}" stroke-width="7"/>`;
    s += `<path d="M760 520 Q700 600 720 760 Q760 830 960 830 Q1160 830 1200 760 Q1220 600 1160 520 Q1060 470 960 470 Q860 470 760 520Z" fill="#8a5a3a" stroke="${INK}" stroke-width="8"/>`;
    s += `<path d="M1060 500 Q1180 560 1190 740 Q1170 810 1080 822 Q1130 700 1060 500Z" fill="${INK}" opacity=".4"/>`;
    s += `<rect x="830" y="430" width="260" height="60" rx="16" fill="#6b4226" stroke="${INK}" stroke-width="7"/>`;
    s += `<rect x="820" y="410" width="280" height="36" rx="12" fill="#e8dcc4" stroke="${INK}" stroke-width="6"/>`;
    s += `<path d="M860 600 q18 -14 36 0 M1024 600 q18 -14 36 0" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`;
    s += `<path d="M920 690 q40 -26 80 0" fill="none" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`;
    s += `<path d="M870 630 q-6 30 4 44 q10 -12 -4 -44z" fill="#9ee7ff" stroke="${INK}" stroke-width="3"/>`;
    // label: MẮM
    s += `<rect x="880" y="720" width="160" height="70" fill="#f4ebd4" stroke="${INK}" stroke-width="5" transform="rotate(-4 960 755)"/>`;
    s += `<path d="M900 770 l10 -34 l12 22 l12 -22 l10 34 M950 770 l12 -34 l12 34 M956 758 h14 M990 770 l10 -34 l12 22 l12 -22 l10 34 M952 722 q10 10 20 0 M964 714 l8 -10" fill="none" stroke="#c0392b" stroke-width="6" transform="rotate(-4 960 755)"/>`;
    s += K.hatch({ x: 0, y: 880, w: W, h: 200 }, { angle: 0, gap: 16, w: 3, seed: 5, color: '#000', op: 0.6 });
    s += `<image href="${K.halftone('cr-ht', 960, 540, (u, v) => Math.max(0, Math.hypot(u - 0.5, v - 0.45) * 1.8 - 0.5), { step: 12, color: '#000' })}" width="${W}" height="${H}" opacity=".7"/>`;
    return K.svg(W, H, s, 'class="bg-svg"');
  };

  /* ======================================================= BG: VOID (wry ending — an erased page) */
  ART.bg.void = function () {
    let s = `<rect width="${W}" height="${H}" fill="#fbf5e4"/>`;
    const rnd = U.rng(5); let ln = '';
    for (let y = 120; y < H; y += 64) ln += `<path d="M120 ${y} H1800" stroke="#c9b99a" stroke-width="2" opacity=".6"/>`;
    s += ln;
    // ghosts of erased text
    for (let i = 0; i < 26; i++) { const y = 150 + Math.floor(rnd() * 14) * 64, x = 150 + rnd() * 1400, w = 60 + rnd() * 260; s += `<rect x="${r1(x)}" y="${y - 26}" width="${r1(w)}" height="16" fill="#9a8a70" opacity=".12"/>`; }
    s += `<path d="M1700 900 q60 -40 120 -10 q-40 50 -120 10z" fill="#e8d0d0" opacity=".6"/>`;
    return K.svg(W, H, s, 'class="bg-svg"');
  };

  /* ======================================================= BG: RIVERBANK (true ending — two sisters, chè, sunset) */
  ART.bg.riverbank = function () {
    let s = `<defs>${lib.grad('rb-sky', [[0, '#5b2a86'], [0.4, '#ff6fa8'], [0.75, '#ffb35c'], [1, '#ffe7a8']])}
      ${lib.grad('rb-water', [[0, '#ffc37a'], [0.5, '#ff7aa8'], [1, '#6b3a9a']])}
      ${lib.grad('rb-grass', [[0, '#3a8a5a'], [1, '#1a4a3a']])}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#rb-sky)"/>`;
    s += `<circle cx="960" cy="560" r="190" fill="#fff3c4"/><circle cx="960" cy="560" r="190" fill="none" stroke="#ffd36b" stroke-width="10" opacity=".6"/>`;
    s += lib.streaks({ x: -200, y: 120, w: 2200, h: 300 }, 22, '#ffd1e6', 61, { op: 0.8, len: 480, w: 14 });
    s += lib.birds({ x: 600, y: 200, w: 700, h: 200 }, 6, 33, '#3a1450');
    // far bank with areca palms & bamboo (the same tree, now just a tree)
    s += lib.treeLine(600, 40, '#3a1450', 71, { bamboo: 20 });
    [[300, 606, 330], [520, 604, 380], [1500, 606, 360], [1700, 604, 300]].forEach(([x, b, t], i) => (s += lib.areca(x, b, t, { silhouette: true, scale: 0.6, color: '#3a1450', seed: 80 + i, lean: (i % 2 ? 1 : -1) * 16, frond: 110 })));
    // river with sun reflection
    s += `<path d="M0 610 L1920 610 L1920 820 L0 820Z" fill="url(#rb-water)"/>`;
    for (let i = 0; i < 12; i++) s += `<path d="M${880 - i * 6} ${630 + i * 16} H${1040 + i * 6}" stroke="#fff3c4" stroke-width="${6 - i * 0.3}" opacity="${0.9 - i * 0.06}"/>`;
    s += K.hatch({ x: 0, y: 620, w: W, h: 200 }, { angle: 0, gap: 18, w: 2.4, seed: 6, color: '#5b2a86', op: 0.35, fade: [0.05, 0.25] });
    // a goby fish (cá bống) peeking out of the water — alive and well
    s += `<path d="M1300 700 q40 -40 90 0 q-40 30 -90 0z" fill="#c9a060" stroke="${INK}" stroke-width="5"/><circle cx="1360" cy="690" r="6" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="1362" cy="690" r="2.5" fill="${INK}"/><path d="M1300 700 l-24 -16 l0 32z" fill="#c9a060" stroke="${INK}" stroke-width="4"/>`;
    s += `<path d="M1340 660 q6 -14 16 -18" fill="none" stroke="#fff" stroke-width="4"/>`;
    // near bank (grass)
    s += `<path d="M0 800 Q480 770 960 790 T1920 800 L1920 1080 L0 1080Z" fill="url(#rb-grass)" stroke="${INK}" stroke-width="7"/>`;
    s += lib.tuft(120, 1085, 220, 91, { n: 16 }) + lib.tuft(1800, 1085, 240, 92, { n: 18 });
    // the sisters, from behind, sitting shoulder to shoulder, feet toward the water, bowls of chè
    const sis = (x, coat, hair, bun) => {
      let g = `<g transform="translate(${x} 0)">`;
      g += inked(sm([[-110, 1080], [-120, 940], [-90, 860], [-40, 820], [40, 820], [90, 860], [120, 940], [110, 1080]]), coat, 7);
      g += inked(sm([[-60, 700], [-72, 780], [-50, 840], [50, 840], [72, 780], [60, 700], [0, 680]]), hair, 6);
      g += bun;
      g += `</g>`;
      return g;
    };
    s += sis(830, '#26205c', '#15122e', `<path d="M-90 690 L0 610 L90 690 Z" fill="#e9d49c" stroke="${INK}" stroke-width="6"/>`);
    s += sis(1090, '#f7c325', '#15142e', `<path d="M-30 690 q0 -50 30 -50 q30 0 30 50z" fill="#1b1a3c" stroke="${INK}" stroke-width="5"/><path d="M-10 610 c-10 -12 -28 -4 -22 10 l22 20 l22 -20 c6 -14 -12 -22 -22 -10z" fill="#ffd84a" stroke="${INK}" stroke-width="4"/>`);
    // shoulders touching + bowls of chè held between them
    s += `<ellipse cx="960" cy="900" rx="44" ry="16" fill="#e8f0f4" stroke="${INK}" stroke-width="5"/><ellipse cx="960" cy="896" rx="34" ry="9" fill="#9b6adf"/>`;
    s += `<path d="M916 900 Q960 950 1004 900" fill="#e8f0f4" stroke="${INK}" stroke-width="5"/>`;
    s += `<path d="M946 880 L930 840 M966 880 L980 836" stroke="${INK}" stroke-width="5"/>`;
    s += K.sparkle(1240, 380, 22) + K.sparkle(700, 330, 16);
    return K.svg(W, H, s, 'class="bg-svg"');
  };

  /* ======================================================= BG: TITLE — the panel, as a poster */
  ART.bg.title = function () {
    let s = `<defs>${lib.grad('ti-sky', [[0, '#1a0830'], [0.45, '#5b1a6e'], [0.8, '#c2185b'], [1, '#ff8a3d']], 0, 0, 0.3, 1)}</defs>`;
    s += `<rect width="${W}" height="${H}" fill="url(#ti-sky)"/>`;
    s += K.radial(1560, 560, 220, 2400, 140, { w: 30, seed: 9, color: '#0a0414', op: 0.55 });
    s += `<image href="${K.halftone('ti-ht', 960, 540, (u, v) => Math.max(0, 0.95 - u * 1.3), { step: 13, color: '#0a0414' })}" width="${W}" height="${H}" opacity=".7"/>`;
    s += `<path d="M1000 1080 L1920 700 L1920 1080 Z" fill="#2a1438" opacity=".7"/>`;
    s += lib.embed(ART.ch.cam_walk(), 1520, 300, 300);
    s += lib.embed(ART.ch.tam_back(), 690, 110, 900);
    s += `<rect width="${W}" height="${H}" fill="url(#ti-sky)" opacity=".08"/>`;
    return K.svg(W, H, s, 'class="bg-svg"');
  };

})();
