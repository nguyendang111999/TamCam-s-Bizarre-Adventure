/* ink.js — procedural manga-ink toolkit for SVG.
   Tapered G-pen strokes, hatching, feathering, speed lines, halftone screentone, shared <defs>. */
(function () {
  'use strict';
  const TC = window.TC, U = TC.util;
  const K = (TC.ink = {});
  const r1 = (v) => Math.round(v * 10) / 10;
  K.r1 = r1;

  /* ---------- curves */
  // Catmull-Rom spline through points -> dense sample list
  K.sample = function (pts, closed = false, spacing = 7) {
    const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
    const out = [];
    for (let i = 1; i < P.length - 2; i++) {
      const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const n = Math.max(2, Math.ceil(segLen / spacing));
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        out.push([
          0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
        ]);
      }
    }
    if (!closed) out.push(pts[pts.length - 1]);
    return out;
  };
  // smooth closed/open path "d" through points (cubic béziers)
  K.smooth = function (pts, closed = false, k = 1) {
    if (pts.length < 2) return '';
    const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
    let d = `M${r1(pts[0][0])} ${r1(pts[0][1])}`;
    for (let i = 1; i < P.length - 2; i++) {
      const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * k, p1[1] + ((p2[1] - p0[1]) / 6) * k];
      const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * k, p2[1] - ((p3[1] - p1[1]) / 6) * k];
      d += `C${r1(c1[0])} ${r1(c1[1])} ${r1(c2[0])} ${r1(c2[1])} ${r1(p2[0])} ${r1(p2[1])}`;
    }
    return d + (closed ? 'Z' : '');
  };
  K.poly = (pts, closed = true) => 'M' + pts.map((p) => r1(p[0]) + ' ' + r1(p[1])).join('L') + (closed ? 'Z' : '');

  /* ---------- tapered stroke (G-pen). opts: s/e = taper fractions (0..1), min = min width ratio,
     jit = normal jitter px, seed, profile fn(t)->0..1 overrides */
  K.taper = function (pts, w = 6, o = {}) {
    const S = pts.length > 2 || o.smooth ? K.sample(pts, false, o.spacing || 5) : lineSample(pts[0], pts[1], o.spacing || 6);
    const n = S.length;
    if (n < 2) return '';
    const s = o.s != null ? o.s : 0.35, e = o.e != null ? o.e : 0.35, mn = o.min != null ? o.min : 0.04;
    const rnd = o.jit ? U.rng(o.seed || 7) : null;
    const ph = rnd ? rnd() * 6.28 : 0, fq = rnd ? 1.5 + rnd() * 3 : 0;
    const L = [], R = [];
    for (let i = 0; i < n; i++) {
      const a = S[Math.max(0, i - 1)], b = S[Math.min(n - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const nx = -ty, ny = tx;
      const t = i / (n - 1);
      let prof = o.profile ? o.profile(t) : Math.min(1, s > 0 ? sm(t / s) : 1) * Math.min(1, e > 0 ? sm((1 - t) / e) : 1);
      prof = mn + (1 - mn) * prof;
      const hw = (w * prof) / 2;
      const jx = rnd ? o.jit * 0.5 * Math.sin(t * fq * Math.PI + ph) : 0;
      const cx = S[i][0] + nx * jx, cy = S[i][1] + ny * jx;
      L.push([cx + nx * hw, cy + ny * hw]);
      R.push([cx - nx * hw, cy - ny * hw]);
    }
    let d = 'M' + L.map((p) => r1(p[0]) + ' ' + r1(p[1])).join('L');
    d += 'L' + R.reverse().map((p) => r1(p[0]) + ' ' + r1(p[1])).join('L') + 'Z';
    return d;
  };
  function sm(x) { x = U.clamp(x, 0, 1); return x * x * (3 - 2 * x); }
  function lineSample(a, b, sp) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(len / sp));
    const o = [];
    for (let i = 0; i <= n; i++) o.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
    return o;
  }
  // many tapered strokes -> one path element
  K.strokes = function (list, fill = '#140b16', extra = '') {
    return `<path d="${list.join('')}" fill="${fill}" ${extra}/>`;
  };
  K.line = (pts, w, o = {}) => `<path d="${K.taper(pts, w, o)}" fill="${o.fill || '#140b16'}"${o.op ? ` opacity="${o.op}"` : ''}/>`;

  /* ---------- hatching inside a bbox (clip externally). angle in deg */
  K.hatch = function (bb, o = {}) {
    const ang = ((o.angle != null ? o.angle : 45) * Math.PI) / 180;
    const gap = o.gap || 12, w = o.w || 2.4, rnd = U.rng(o.seed || 1);
    const cx = bb.x + bb.w / 2, cy = bb.y + bb.h / 2, R = Math.hypot(bb.w, bb.h) / 2 + 20;
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    const paths = [];
    for (let k = -R; k <= R; k += gap) {
      const jit = (rnd() - 0.5) * gap * (o.gapJit != null ? o.gapJit : 0.35);
      const ox = cx + nx * (k + jit), oy = cy + ny * (k + jit);
      // clip the infinite line (ox,oy)+t(dx,dy) against the bbox
      let t0 = -1e9, t1 = 1e9;
      const clipAx = (p0, d, lo, hi) => {
        if (Math.abs(d) < 1e-9) return p0 >= lo && p0 <= hi;
        let a = (lo - p0) / d, b = (hi - p0) / d;
        if (a > b) [a, b] = [b, a];
        t0 = Math.max(t0, a); t1 = Math.min(t1, b);
        return t0 <= t1;
      };
      if (!clipAx(ox, dx, bb.x, bb.x + bb.w) || !clipAx(oy, dy, bb.y, bb.y + bb.h)) continue;
      let a0 = t0, a1 = t1;
      const len = a1 - a0;
      if (len < 4) continue;
      if (o.fade) a1 = a0 + len * (o.fade[0] + rnd() * (o.fade[1] - o.fade[0]));
      if (o.startJit) a0 += rnd() * o.startJit;
      paths.push(K.taper([[ox + dx * a0, oy + dy * a0], [ox + dx * a1, oy + dy * a1]], w * (0.75 + rnd() * 0.5), { s: o.s != null ? o.s : 0.12, e: o.e != null ? o.e : 0.5, min: 0.1 }));
    }
    return `<path d="${paths.join('')}" fill="${o.color || '#140b16'}"${o.op ? ` opacity="${o.op}"` : ''}/>`;
  };
  // cross hatch
  K.xhatch = (bb, o = {}) => K.hatch(bb, o) + K.hatch(bb, Object.assign({}, o, { angle: (o.angle || 45) + 90, seed: (o.seed || 1) + 9 }));

  /* ---------- feathering: short tapered strokes from an edge polyline toward a direction */
  K.feather = function (edge, o = {}) {
    const rnd = U.rng(o.seed || 3), S = K.sample(edge, false, o.every || 9);
    const len = o.len || 40, ang = ((o.angle != null ? o.angle : 90) * Math.PI) / 180, w = o.w || 3;
    const out = [];
    S.forEach((p, i) => {
      const L = len * (0.45 + rnd() * 0.75) * (o.lenFn ? o.lenFn(i / S.length) : 1);
      const a = ang + (rnd() - 0.5) * (o.spread || 0.15);
      out.push(K.taper([p, [p[0] + Math.cos(a) * L, p[1] + Math.sin(a) * L]], w * (0.7 + rnd() * 0.6), { s: 0.05, e: 0.9, min: 0.02 }));
    });
    return `<path d="${out.join('')}" fill="${o.color || '#140b16'}"${o.op ? ` opacity="${o.op}"` : ''}/>`;
  };

  /* ---------- speed lines */
  K.radial = function (cx, cy, rIn, rOut, n, o = {}) {
    const rnd = U.rng(o.seed || 5), out = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (rnd() - 0.5) * ((Math.PI * 2) / n) * 0.9;
      const r0 = rIn * (0.8 + rnd() * 0.6), r1_ = rOut;
      const w = (o.w || 10) * (0.3 + rnd() * rnd() * 1.6);
      out.push(K.taper([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1_, cy + Math.sin(a) * r1_]], w, { s: 0.95, e: 0.0, min: 0.0, profile: (t) => t }));
    }
    return `<path d="${out.join('')}" fill="${o.color || '#140b16'}"${o.op ? ` opacity="${o.op}"` : ''}/>`;
  };
  K.parallel = function (bb, n, o = {}) {
    const rnd = U.rng(o.seed || 9), out = [];
    const ang = ((o.angle || 0) * Math.PI) / 180, dx = Math.cos(ang), dy = Math.sin(ang);
    for (let i = 0; i < n; i++) {
      const y = bb.y + rnd() * bb.h, x0 = bb.x + rnd() * bb.w * 0.6, L = bb.w * (0.2 + rnd() * 0.6);
      const px = x0, py = y;
      out.push(K.taper([[px, py], [px + dx * L, py + dy * L]], (o.w || 5) * (0.4 + rnd()), { s: 0.4, e: 0.5, min: 0 }));
    }
    return `<path d="${out.join('')}" fill="${o.color || '#140b16'}"${o.op ? ` opacity="${o.op}"` : ''}/>`;
  };

  /* ---------- halftone via canvas (returns dataURL). fn(u,v) -> radius factor 0..1 */
  const htCache = new Map();
  K.halftone = function (key, w, h, fn, o = {}) {
    if (htCache.has(key)) return htCache.get(key);
    const step = o.step || 14, c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = o.color || '#140b16';
    const ang = ((o.angle != null ? o.angle : 45) * Math.PI) / 180, ca = Math.cos(ang), sa = Math.sin(ang);
    const R = Math.hypot(w, h);
    for (let i = -R; i < R; i += step) for (let j = -R; j < R; j += step) {
      const x = w / 2 + i * ca - j * sa, y = h / 2 + i * sa + j * ca;
      if (x < -step || y < -step || x > w + step || y > h + step) continue;
      const r = fn(x / w, y / h) * step * 0.62;
      if (r > 0.35) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
    }
    const url = c.toDataURL('image/png');
    htCache.set(key, url);
    return url;
  };

  /* ---------- shared defs, injected once into a hidden <svg> in the document */
  K.DEFS = `<pattern id="dots-s" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="5" cy="5" r="1.7" fill="#140b16"/></pattern>
      <pattern id="dots-m" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="7" cy="7" r="3.2" fill="#140b16"/></pattern>
      <pattern id="dots-l" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="9" cy="9" r="5.4" fill="#140b16"/></pattern>
      <pattern id="dots-w" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="7" cy="7" r="2.6" fill="#fff"/></pattern>
      <pattern id="lines-d" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="12" height="3" fill="#140b16"/></pattern>
      <pattern id="lines-f" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><rect width="9" height="1.6" fill="#140b16"/></pattern>
      <pattern id="lines-v" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="2.2" height="10" fill="#140b16"/></pattern>
      <pattern id="lines-h" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="2.2" fill="#140b16"/></pattern>
      <pattern id="xh" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="12" height="2" fill="#140b16"/><rect width="2" height="12" fill="#140b16"/></pattern>
      <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10" result="b"/><feFlood flood-color="#3fe6ff"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" result="b"/><feFlood flood-color="#ffd23a"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>`;
  // for inline (DOM) svgs that reference shared patterns
  K.installDefs = function () {
    if (document.getElementById('ink-defs')) return;
    document.body.insertAdjacentHTML('afterbegin', `<svg id="ink-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${K.DEFS}</defs></svg>`);
  };

  /* ---------- convenience: wrap content in a full svg */
  // standalone svg (self-contained: embeds shared pattern/filter defs so it can be rasterized as an image)
  K.svg = (w, h, body, attrs = '') => `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ${attrs}><defs>${K.DEFS}</defs>${body}</svg>`;

  // outline trick: draw shape twice — black offset "ink weight" below, colored fill above with stroke
  K.inked = function (d, fill, o = {}) {
    const sw = o.sw != null ? o.sw : 6, dx = o.dx != null ? o.dx : 3, dy = o.dy != null ? o.dy : 4;
    return `<path d="${d}" fill="#140b16" transform="translate(${dx} ${dy})"/>` +
      `<path d="${d}" fill="${fill}" stroke="#140b16" stroke-width="${sw}" stroke-linejoin="round"/>`;
  };
  // sparkle ✦
  K.sparkle = (x, y, r, fill = '#fff') => {
    const p = [[x, y - r], [x + r * 0.18, y - r * 0.18], [x + r, y], [x + r * 0.18, y + r * 0.18], [x, y + r], [x - r * 0.18, y + r * 0.18], [x - r, y], [x - r * 0.18, y - r * 0.18]];
    return `<path d="${K.poly(p)}" fill="${fill}" stroke="#140b16" stroke-width="3"/>`;
  };
  // flame-like aura outline around a silhouette path: approximated with offset strokes + flames
  K.flames = function (cx, baseY, width, height, n, o = {}) {
    const rnd = U.rng(o.seed || 11), out = [];
    for (let i = 0; i < n; i++) {
      const x = cx - width / 2 + (i + rnd() * 0.8) * (width / n), h = height * (0.5 + rnd() * 0.7);
      const lean = (rnd() - 0.5) * 60 + (o.lean || 0);
      out.push(K.taper([[x, baseY], [x + lean * 0.3, baseY - h * 0.5], [x + lean, baseY - h]], (width / n) * (1.2 + rnd()), { s: 0.1, e: 1, min: 0 }));
    }
    return `<path d="${out.join('')}" fill="${o.fill || '#3fe6ff'}"${o.op ? ` opacity="${o.op}"` : ''}/>`;
  };
})();
