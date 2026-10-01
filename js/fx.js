/* fx.js — screen effects: raster pipeline, camera, shake, flash, JoJo colour-shifts, SFX lettering,
   speed lines & particles (canvas), chapter cards, "To Be Continued" freeze-frame, time-stop, voice/stand cards. */
(function () {
  'use strict';
  const TC = window.TC, U = TC.util, K = TC.ink;
  const FX = (TC.fx = {});
  const $ = (id) => document.getElementById(id);
  const INK = '#140b16';

  /* ============================================================ raster pipeline
     SVG strings -> decoded images (cached) -> drawn to canvases at the right resolution.
     Keeps the live DOM tiny and makes camera moves GPU-cheap. */
  const G = (TC.gfx = {});
  const imgCache = new Map(); // key -> Promise<HTMLImageElement>
  G.rasterScale = () => U.clamp(TC.stage.scale * (window.devicePixelRatio || 1) * 1.08, 0.7, 1.6);
  G.image = function (key, svgFn) {
    if (imgCache.has(key)) return imgCache.get(key);
    const p = new Promise((res, rej) => {
      let svg;
      try { svg = svgFn(); } catch (e) { console.error('art', key, e); rej(e); return; }
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { (img.decode ? img.decode() : Promise.resolve()).catch(() => { }).then(() => res(img)); };
      img.onerror = (e) => { console.error('art load', key, e); rej(e); };
      img.src = url;
      img._url = url;
    });
    imgCache.set(key, p);
    return p;
  };
  // returns a canvas (css size w×h) with the art drawn at raster scale
  G.canvas = async function (key, svgFn, w, h, scale) {
    const img = await G.image(key, svgFn);
    const s = scale || G.rasterScale();
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
    c.style.width = w + 'px'; c.style.height = h + 'px';
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, c.width, c.height);
    c._key = key;
    return c;
  };
  G.preload = (list) => Promise.all(list.map(([k, fn]) => G.image(k, fn).catch(() => null)));
  // one item per idle slot so a long SVG build never blocks a frame for long
  G.preloadIdle = function (list, gap = 90) {
    const q = list.slice();
    const next = () => {
      if (!q.length) return;
      const [k, fn] = q.shift();
      G.image(k, fn).catch(() => null).then(() => {
        const ric = window.requestIdleCallback || ((f) => setTimeout(f, gap));
        ric(next, { timeout: 600 });
      });
    };
    next();
  };
  G.forget = (key) => { const p = imgCache.get(key); if (p) p.then((i) => URL.revokeObjectURL(i._url)).catch(() => { }); imgCache.delete(key); };

  /* ============================================================ canvas FX layer */
  let cv, cx, W = 1920, H = 1080, dpr = 1;
  const parts = [];
  let lines = null; // speed line state
  let running = false;

  FX.init = function () {
    cv = $('fx'); cx = cv.getContext('2d');
    FX.resize();
    makeGrain();
    if (!running) { running = true; requestAnimationFrame(loop); }
  };
  FX.resize = function () {
    if (!cv) return;
    dpr = U.clamp(TC.stage.scale * (window.devicePixelRatio || 1), 0.5, 1.5);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  };
  function makeGrain() {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'), d = g.createImageData(512, 512), a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      const n = 200 + Math.random() * 55;
      a[i] = n; a[i + 1] = n * 0.97; a[i + 2] = n * 0.9; a[i + 3] = 255;
    }
    g.putImageData(d, 0, 0);
    // fibres
    g.globalAlpha = 0.07; g.strokeStyle = '#5a4630';
    for (let i = 0; i < 160; i++) { g.beginPath(); const x = Math.random() * 512, y = Math.random() * 512, a2 = Math.random() * 6.28, l = 6 + Math.random() * 20; g.moveTo(x, y); g.lineTo(x + Math.cos(a2) * l, y + Math.sin(a2) * l); g.stroke(); }
    $('grain').style.backgroundImage = `url(${c.toDataURL()})`;
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, W, H);
    if (lines) drawLines(dt, now);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t >= p.life) { parts.splice(i, 1); continue; }
      p.update ? p.update(p, dt) : defaultUpdate(p, dt);
      drawPart(p);
    }
    requestAnimationFrame(loop);
  }
  function defaultUpdate(p, dt) {
    p.vy += (p.g || 0) * dt; p.vx *= p.drag || 1; p.vy *= p.drag || 1;
    p.x += p.vx * dt; p.y += p.vy * dt; p.rot += (p.vr || 0) * dt;
    if (p.sway) p.x += Math.sin(p.t * p.sway + p.ph) * 40 * dt;
  }
  function drawPart(p) {
    const k = p.t / p.life;
    const a = p.fade === false ? 1 : k < 0.1 ? k / 0.1 : 1 - Math.max(0, (k - 0.6) / 0.4);
    cx.save();
    cx.globalAlpha = a * (p.alpha || 1);
    cx.translate(p.x, p.y); cx.rotate(p.rot);
    const s = p.size * (p.grow ? 1 + k * p.grow : 1);
    p.draw(cx, s, k);
    cx.restore();
  }

  // speed lines: 'radial' (focus lines) or 'h'/'v' streaks
  FX.speedLines = function (on, o = {}) {
    if (!on) { lines = null; return; }
    lines = Object.assign({ type: 'radial', cx: 960, cy: 540, color: 'rgba(20,11,22,0.85)', inner: 330, n: 90, w: 16, jitter: 0.08 }, o);
  };
  function drawLines(dt, now) {
    const L = lines;
    if (!L.seed || now - (L.last || 0) > (L.rate || 70)) { L.seed = Math.random() * 1e9; L.last = now; }
    const r = U.rng(L.seed | 0);
    cx.fillStyle = L.color;
    if (L.type === 'radial') {
      const R = 1500;
      for (let i = 0; i < L.n; i++) {
        const a = (i / L.n) * Math.PI * 2 + (r() - 0.5) * 0.06;
        const r0 = L.inner * (0.75 + r() * 0.6), w = L.w * (0.25 + r() * r() * 1.8);
        const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
        cx.beginPath();
        cx.moveTo(L.cx + ca * r0, L.cy + sa * r0);
        cx.lineTo(L.cx + ca * R + px * w, L.cy + sa * R + py * w);
        cx.lineTo(L.cx + ca * R - px * w, L.cy + sa * R - py * w);
        cx.closePath(); cx.fill();
      }
    } else {
      const horiz = L.type === 'h';
      for (let i = 0; i < L.n; i++) {
        const p = r() * (horiz ? H : W), len = 200 + r() * 900, st = r() * (horiz ? W : H) - 200, w = 1 + r() * r() * L.w * 0.5;
        cx.beginPath();
        if (horiz) { cx.moveTo(st, p); cx.lineTo(st + len, p - w); cx.lineTo(st + len, p + w); }
        else { cx.moveTo(p, st); cx.lineTo(p - w, st + len); cx.lineTo(p + w, st + len); }
        cx.closePath(); cx.fill();
      }
    }
  }

  /* ---- particle presets */
  const PD = {
    chip: (c, s) => { c.fillStyle = '#e8d2a6'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(-s, -s * 0.4); c.lineTo(s, -s * 0.2); c.lineTo(s * 0.6, s * 0.5); c.lineTo(-s * 0.8, s * 0.3); c.closePath(); c.fill(); c.stroke(); },
    feather: (c, s, k) => {
      c.fillStyle = '#f7c325'; c.strokeStyle = INK; c.lineWidth = 3;
      c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(s * 0.45, -s * 0.2, 0, s); c.quadraticCurveTo(-s * 0.45, -s * 0.2, 0, -s); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(0, -s * 0.9); c.lineTo(0, s * 1.25); c.stroke();
    },
    ember: (c, s) => { const g = c.createRadialGradient(0, 0, 0, 0, 0, s); g.addColorStop(0, '#fff3b0'); g.addColorStop(0.4, '#ff9a1f'); g.addColorStop(1, 'rgba(255,60,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, s, 0, 6.3); c.fill(); },
    ash: (c, s) => { c.fillStyle = '#3a2d33'; c.fillRect(-s / 2, -s / 3, s, s * 0.66); },
    sparkle: (c, s, k) => {
      c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 2.5;
      c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.22 : s, a = (i / 8) * 6.283 - 1.571; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke();
    },
    petal: (c, s) => { c.fillStyle = '#ffb6d0'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, s, s * 0.55, 0, 0, 6.3); c.fill(); c.stroke(); },
    steam: (c, s, k) => { c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(0, 0, s, 0, 6.3); c.fill(); },
    dust: (c, s) => { c.fillStyle = 'rgba(214,176,120,0.7)'; c.strokeStyle = 'rgba(20,11,22,0.6)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, s, 0, 6.3); c.fill(); c.stroke(); },
    smoke: (c, s) => { c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); for (let i = 0; i < 7; i++) { const a = (i / 7) * 6.283; c.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.5, a - 1.2, a + 1.2); } c.closePath(); c.fill(); c.stroke(); },
    tear: (c, s) => { c.fillStyle = '#9ee7ff'; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(0, -s); c.quadraticCurveTo(s * 0.8, s * 0.2, 0, s * 0.7); c.quadraticCurveTo(-s * 0.8, s * 0.2, 0, -s); c.fill(); c.stroke(); },
    paper: (c, s) => { c.fillStyle = '#f4ebd4'; c.strokeStyle = INK; c.lineWidth = 2.5; c.fillRect(-s, -s * 0.7, s * 2, s * 1.4); c.strokeRect(-s, -s * 0.7, s * 2, s * 1.4); c.fillStyle = 'rgba(20,11,22,.35)'; for (let i = 0; i < 4; i++) c.fillRect(-s * 0.8, -s * 0.45 + i * s * 0.3, s * 1.6 * (i === 3 ? 0.6 : 1), 2); },
    fist: (c, s) => { c.fillStyle = '#ffd23a'; c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.roundRect ? c.roundRect(-s, -s * 0.7, s * 2, s * 1.4, s * 0.4) : c.rect(-s, -s * 0.7, s * 2, s * 1.4); c.fill(); c.stroke(); },
    heart: (c, s) => { c.fillStyle = '#ff3d8b'; c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, s * 0.8); c.bezierCurveTo(-s * 1.4, -s * 0.2, -s * 0.6, -s * 1.2, 0, -s * 0.4); c.bezierCurveTo(s * 0.6, -s * 1.2, s * 1.4, -s * 0.2, 0, s * 0.8); c.fill(); c.stroke(); },
    bubble: (c, s) => { c.strokeStyle = INK; c.lineWidth = 3; c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(0, 0, s, 0, 6.3); c.fill(); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(-s * 0.35, -s * 0.35, s * 0.25, 0, 6.3); c.fill(); },
  };
  FX.burst = function (type, x, y, n, o = {}) {
    if (TC.fastForward()) return;
    for (let i = 0; i < n; i++) {
      const a = o.angle != null ? o.angle + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * Math.PI * 2;
      const sp = (o.speed || 400) * (0.4 + Math.random() * 0.8);
      parts.push({
        x: x + (Math.random() - 0.5) * (o.jx || 0), y: y + (Math.random() - 0.5) * (o.jy || 0),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.g != null ? o.g : 900, drag: o.drag || 0.995,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * (o.vr != null ? o.vr : 10),
        size: (o.size || 14) * (0.6 + Math.random() * 0.8), life: (o.life || 1.2) * (0.7 + Math.random() * 0.6), t: 0,
        sway: o.sway, ph: Math.random() * 6.28, grow: o.grow, alpha: o.alpha, fade: o.fade,
        draw: PD[type] || PD.dust,
      });
    }
  };
  FX.clearParticles = () => { parts.length = 0; };
  // image sprite flying from (x0,y0) to (x1,y1) with a motion trail, then an impact pop (rush fists)
  FX.burstImg = function (img, x0, y0, x1, y1, fromLeft) {
    if (TC.fastForward()) return;
    const dur = 0.11 + Math.random() * 0.07, ang = Math.atan2(y1 - y0, x1 - x0);
    const w = img.width, h = img.height, sc = 0.7 + Math.random() * 0.6;
    parts.push({
      x: x0, y: y0, rot: 0, t: 0, life: dur + 0.16, size: 1, fade: false,
      update(p) {
        const k = Math.min(1, p.t / dur);
        p.px = p.x; p.py = p.y;
        p.x = x0 + (x1 - x0) * k; p.y = y0 + (y1 - y0) * k;
        p.hit = p.t > dur;
      },
      draw(c) {
        const k = this.t / dur;
        const s = this.hit ? sc * (1 + (this.t - dur) * 4) : sc * (0.6 + 0.4 * Math.min(1, k));
        c.globalAlpha = this.hit ? Math.max(0, 1 - (this.t - dur) / 0.16) : 1;
        c.rotate(fromLeft ? ang : ang + Math.PI);
        if (!fromLeft) c.scale(1, -1);
        // trail
        c.save(); c.globalAlpha *= 0.35; c.translate(-w * s * 0.5, 0); c.drawImage(img, -w * s / 2, -h * s / 2, w * s, h * s); c.restore();
        c.drawImage(img, -w * s / 2, -h * s / 2, w * s, h * s);
        if (this.hit) { c.fillStyle = '#fff'; c.strokeStyle = '#140b16'; c.lineWidth = 4; c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 14 : 38, a = (i / 10) * 6.283; c.lineTo(w * s * 0.5 + Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); }
      },
    });
  };

  // continuous emitter (returns stop fn)
  const emitters = new Set();
  FX.stopEmitters = () => { emitters.forEach((stop) => stop()); emitters.clear(); };
  FX.emit = function (type, o = {}) {
    let alive = true;
    const tick = () => {
      if (!alive) return;
      FX.burst(type, (o.x != null ? o.x : Math.random() * 1920) + (Math.random() - 0.5) * (o.w || 0), o.y != null ? o.y + (Math.random() - 0.5) * (o.h || 0) : -40, o.n || 1, o);
      setTimeout(tick, o.every || 120);
    };
    tick();
    const stop = () => { alive = false; emitters.delete(stop); };
    emitters.add(stop);
    if (o.duration) setTimeout(stop, o.duration);
    return stop;
  };

  /* ============================================================ camera & screen */
  const cam = { zoom: 1, x: 0, y: 0, rot: 0 };
  function applyCam() {
    $('world').style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.zoom}) rotate(${cam.rot}deg)`;
  }
  FX.cam = function (o = {}, ms = 600, ease = U.ease.inOut) {
    const from = Object.assign({}, cam), to = Object.assign({}, cam, o);
    return U.tween(ms, (t) => {
      cam.zoom = U.lerp(from.zoom, to.zoom, t); cam.x = U.lerp(from.x, to.x, t); cam.y = U.lerp(from.y, to.y, t); cam.rot = U.lerp(from.rot, to.rot, t);
      applyCam();
    }, ease);
  };
  FX.camReset = (ms = 0) => FX.cam({ zoom: 1, x: 0, y: 0, rot: 0 }, ms);

  let shakeT = 0;
  FX.shake = function (power = 16, ms = 400) {
    if (!TC.persist.data.settings.shake || TC.fastForward()) return;
    const st = $('stage').parentElement; // shake the #app content via stage translate offset
    const t0 = performance.now(), id = ++shakeT;
    const base = () => `translate(${TC.stage.ox}px,${TC.stage.oy}px) scale(${TC.stage.scale})`;
    const step = (now) => {
      if (id !== shakeT) return;
      const k = (now - t0) / ms;
      if (k >= 1) { TC.stage.el.style.transform = base(); return; }
      const p = power * (1 - k) * TC.stage.scale;
      TC.stage.el.style.transform = `translate(${TC.stage.ox + (Math.random() - 0.5) * 2 * p}px,${TC.stage.oy + (Math.random() - 0.5) * 2 * p}px) scale(${TC.stage.scale})`;
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // tiny per-frame jitter used during rushes (no cooldown)
  FX.shakeSoft = function (px = 6) {
    if (!TC.persist.data.settings.shake || TC.fastForward()) return;
    const s = TC.stage;
    s.el.style.transform = `translate(${s.ox + (Math.random() - 0.5) * px * s.scale}px,${s.oy + (Math.random() - 0.5) * px * s.scale}px) scale(${s.scale})`;
    clearTimeout(FX._ss); FX._ss = setTimeout(() => { s.el.style.transform = `translate(${s.ox}px,${s.oy}px) scale(${s.scale})`; }, 70);
  };

  FX.flash = function (color = '#fff', ms = 350, peak = 1) {
    if (TC.fastForward()) return Promise.resolve();
    if (!TC.persist.data.settings.flashes) { peak = Math.min(peak, 0.35); }
    const d = U.el('div', { class: 'ov', style: { background: color, opacity: peak, transition: `opacity ${ms}ms ease-out` } });
    $('overlay').appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => (d.style.opacity = 0)));
    return new Promise((r) => setTimeout(() => { d.remove(); r(); }, ms + 30));
  };

  // JoJo-anime palette shift: the whole frame re-colours for a beat
  const SHIFTS = {
    negative: 'invert(1) hue-rotate(180deg) saturate(1.4)',
    purple: 'sepia(1) hue-rotate(230deg) saturate(3) contrast(1.15)',
    green: 'sepia(1) hue-rotate(60deg) saturate(3.2) contrast(1.2)',
    pink: 'sepia(1) hue-rotate(290deg) saturate(3.5) contrast(1.1)',
    cyan: 'sepia(1) hue-rotate(140deg) saturate(3) contrast(1.15)',
    gold: 'sepia(1) hue-rotate(5deg) saturate(3.5) contrast(1.1) brightness(1.05)',
    red: 'sepia(1) hue-rotate(-30deg) saturate(4) contrast(1.2)',
    mono: 'grayscale(1) contrast(1.35)',
    sepia: 'sepia(.85) contrast(1.05) brightness(.95)',
    timestop: 'grayscale(.85) sepia(.3) hue-rotate(190deg) contrast(1.2) brightness(.9)',
    none: 'none',
  };
  FX.shift = function (name = 'none', ms = 0) {
    const f = SHIFTS[name] || name;
    ['world', 'fx', 'panels'].forEach((id) => { const e = $(id); e.style.transition = ms ? `filter ${ms}ms` : 'none'; e.style.filter = f === 'none' ? '' : f; });
  };
  FX.pulseShift = async function (seq = ['negative', 'purple', 'none'], step = 110) {
    if (TC.fastForward() || !TC.persist.data.settings.flashes) return;
    for (const s of seq) { FX.shift(s); await TC.wait(step); }
  };

  /* ============================================================ SFX lettering (ゴゴゴゴ etc.) */
  const SFXSTYLES = {
    menace: { fill: '#b98cff', stroke: '#140b16', sw: 10, size: 120, font: 'jp', skew: -12, shadow: '#3b1060' },
    dodo: { fill: '#ff9a1f', stroke: '#140b16', sw: 12, size: 150, font: 'jp', skew: -10, shadow: '#7a2d00' },
    dodoBlue: { fill: '#6f9bff', stroke: '#0e1748', sw: 12, size: 150, font: 'jp', skew: -10, shadow: '#1b2a7a' },
    impact: { fill: '#fff', stroke: '#140b16', sw: 14, size: 190, font: 'jp', skew: -8, shadow: '#e0302a' },
    gold: { fill: '#f7c325', stroke: '#140b16', sw: 12, size: 150, font: 'jp', skew: -8, shadow: '#8a5a00' },
    pink: { fill: '#ff6fa8', stroke: '#140b16', sw: 10, size: 120, font: 'jp', skew: -8, shadow: '#7a1040' },
    cyan: { fill: '#3fe6ff', stroke: '#140b16', sw: 10, size: 120, font: 'jp', skew: -8, shadow: '#0b4a66' },
    green: { fill: '#34d17c', stroke: '#140b16', sw: 10, size: 120, font: 'jp', skew: -8, shadow: '#0b4a2a' },
    latin: { fill: '#fff', stroke: '#140b16', sw: 12, size: 120, font: 'latin', skew: -10, shadow: '#e0302a' },
    rushL: { fill: '#f7c325', stroke: '#140b16', sw: 12, size: 110, font: 'latin', skew: -12, shadow: '#5b3a00' },
    rushR: { fill: '#ff6fa8', stroke: '#140b16', sw: 12, size: 110, font: 'latin', skew: 12, shadow: '#5b0a2c' },
  };
  // text: string; o: {x,y,style,size,rot,life,anim:'slam'|'float'|'pop'|'shake', color overrides}
  FX.sfx = function (text, o = {}) {
    if (TC.fastForward() && !o.force) return null;
    const st = Object.assign({}, SFXSTYLES[o.style || 'impact'], o);
    const size = st.size;
    const e = U.el('div', { class: 'sfx' + (st.font === 'latin' ? ' latin' : '') });
    e.style.left = (o.x != null ? o.x : 960) + 'px';
    e.style.top = (o.y != null ? o.y : 540) + 'px';
    e.style.fontSize = size + 'px';
    e.style.color = st.fill;
    e.style.webkitTextStroke = `${st.sw}px ${st.stroke}`;
    e.style.textShadow = `${Math.round(size * 0.05)}px ${Math.round(size * 0.06)}px 0 ${st.shadow}`;
    e.style.letterSpacing = (o.spacing != null ? o.spacing : -0.02) + 'em';
    const chars = Array.from(text);
    e.innerHTML = chars.map((c, i) => `<span style="transform:translateY(${o.stagger ? (i % 2 ? -1 : 1) * o.stagger : 0}px) rotate(${o.wobble ? ((i * 37) % 11) - 5 : 0}deg)">${U.esc(c)}</span>`).join('');
    const rot = o.rot != null ? o.rot : -8 + Math.random() * 6;
    const base = `translate(-50%,-50%) rotate(${rot}deg) skewX(${st.skew}deg)`;
    e.style.transform = base + ' scale(2.2)';
    e.style.opacity = '0';
    $('sfx').appendChild(e);
    const anim = o.anim || 'slam', life = o.life != null ? o.life : 1400;
    const kf = {
      slam: [{ transform: base + ' scale(2.4)', opacity: 0 }, { transform: base + ' scale(.92)', opacity: 1, offset: 0.12 }, { transform: base + ' scale(1)', opacity: 1, offset: 0.2 }, { transform: base + ' scale(1.04)', opacity: 1, offset: 0.85 }, { transform: base + ' scale(1.1)', opacity: 0 }],
      pop: [{ transform: base + ' scale(.2)', opacity: 0 }, { transform: base + ' scale(1.12)', opacity: 1, offset: 0.15 }, { transform: base + ' scale(1)', opacity: 1, offset: 0.25 }, { transform: base + ' scale(1)', opacity: 1, offset: 0.85 }, { transform: base + ' scale(.9)', opacity: 0 }],
      float: [{ transform: base + ' translateY(30px) scale(.9)', opacity: 0 }, { transform: base + ' translateY(0) scale(1)', opacity: 1, offset: 0.2 }, { transform: base + ' translateY(-20px) scale(1.02)', opacity: 1, offset: 0.8 }, { transform: base + ' translateY(-40px) scale(1.04)', opacity: 0 }],
      stay: [{ transform: base + ' scale(2)', opacity: 0 }, { transform: base + ' scale(.95)', opacity: 1, offset: 0.55 }, { transform: base + ' scale(1)', opacity: 1 }],
    };
    const a = e.animate(kf[anim] || kf.slam, { duration: anim === 'stay' ? 700 : life, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
    if (anim !== 'stay') a.onfinish = () => e.remove();
    if (o.shake) e.classList.add('tx-shake');
    return e;
  };
  FX.clearSfx = () => { $('sfx').innerHTML = ''; };

  // looping menacing ゴゴゴ around the frame; returns stop fn
  let menaceTimer = null;
  FX.menace = function (on, o = {}) {
    clearInterval(menaceTimer); menaceTimer = null;
    if (!on) return;
    const txt = o.text || 'ゴ', style = o.style || 'menace';
    const spots = o.spots || [[160, 300], [1760, 280], [220, 760], [1700, 720], [960, 170], [520, 520], [1400, 520]];
    let i = 0;
    const spawn = () => {
      if (TC.fastForward()) return;
      const [x, y] = spots[i++ % spots.length];
      FX.sfx(txt.repeat(o.count || 1), { x: x + (Math.random() - 0.5) * 120, y: y + (Math.random() - 0.5) * 90, style, size: (o.size || 110) * (0.8 + Math.random() * 0.5), rot: -18 + Math.random() * 12, anim: 'float', life: 1700 });
    };
    spawn();
    menaceTimer = setInterval(spawn, o.every || 260);
  };

  /* ============================================================ inline scene overlays */
  // manga close-up panel slammed onto the screen. content: svg string. rect: {x,y,w,h}
  FX.panel = async function (key, svgFn, rect, o = {}) {
    const p = U.el('div', { class: 'panel' });
    Object.assign(p.style, { left: rect.x + 'px', top: rect.y + 'px', width: rect.w + 'px', height: rect.h + 'px', transform: `rotate(${o.rot || 0}deg)`, opacity: 0 });
    const c = await G.canvas(key, svgFn, rect.w, rect.h);
    c.style.position = 'absolute'; c.style.inset = '0';
    p.appendChild(c);
    $('panels').appendChild(p);
    p.animate([{ transform: `rotate(${o.rot || 0}deg) translate(${o.from || '160px,-60px'}) scale(1.15)`, opacity: 0 }, { transform: `rotate(${o.rot || 0}deg)`, opacity: 1 }], { duration: TC.fastForward() ? 1 : 260, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'forwards' });
    TC.audio.sfx('whoosh');
    return p;
  };
  FX.closePanels = function () {
    U.$$('.panel', $('panels')).forEach((p) => { p.animate([{ opacity: 1 }, { opacity: 0, transform: (p.style.transform || '') + ' translateY(30px)' }], { duration: 200, fill: 'forwards' }).onfinish = () => p.remove(); });
  };

  // "To Be Continued" freeze frame
  FX.tbc = async function () {
    TC.music.stop(0.15);
    TC.audio.sfx('tbc');
    await TC.wait(TC.fastForward() ? 10 : 1000);
    FX.shift('sepia');
    const ov = U.el('div', { class: 'tbc' });
    ov.innerHTML = `<svg class="tbc-arrow" viewBox="0 0 760 150">
      <path d="M130 12 L730 12 L730 138 L130 138 L10 75 Z" fill="#e8d9b5" stroke="#140b16" stroke-width="8" stroke-linejoin="round"/>
      <path d="M130 12 L730 12 L730 138 L130 138 L10 75 Z" fill="none" stroke="#6b4a2a" stroke-width="3" transform="translate(10 10) scale(.975)"/>
      <text x="425" y="98" text-anchor="middle" font-family="Bangers, Impact" font-size="74" letter-spacing="3" fill="#3b2616">TO BE CONTINUED</text></svg>`;
    $('overlay').appendChild(ov);
    const arrow = ov.firstChild;
    arrow.animate([{ transform: 'translateX(900px)' }, { transform: 'translateX(-20px)', offset: 0.8 }, { transform: 'translateX(0)' }], { duration: TC.fastForward() ? 1 : 520, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
    await TC.wait(TC.fastForward() ? 50 : 1800);
    ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 350, fill: 'forwards' });
    await FX.fadeTo('#140b16', 500);
    ov.remove();
    FX.shift('none');
  };

  // full-screen fades
  let fader = null;
  FX.fadeTo = function (color = '#000', ms = 600) {
    if (!fader) { fader = U.el('div', { class: 'ov', style: { background: color, opacity: 0, pointerEvents: 'none' } }); $('fade').appendChild(fader); }
    fader.style.background = color;
    fader.style.transition = `opacity ${TC.fastForward() ? 1 : ms}ms`;
    fader.getBoundingClientRect();
    fader.style.opacity = 1;
    return TC.wait(TC.fastForward() ? 20 : ms);
  };
  FX.fadeIn = function (ms = 600) {
    if (!fader) return Promise.resolve();
    fader.style.transition = `opacity ${TC.fastForward() ? 1 : ms}ms`;
    fader.style.opacity = 0;
    return TC.wait(TC.fastForward() ? 20 : ms);
  };
  FX.isBlack = () => fader && fader.style.opacity === '1';

  // chapter title card
  FX.chapterCard = async function (num, title, sub) {
    TC.audio.sfx('chapter');
    const d = U.el('div', { class: 'chcard' });
    d.innerHTML = `<svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">
      <rect width="1920" height="1080" fill="#140b16"/>
      <g transform="rotate(-8 960 540)">
        <rect x="-200" y="330" width="2400" height="300" fill="#f7c325"/>
        <rect x="-200" y="318" width="2400" height="12" fill="#fff"/><rect x="-200" y="630" width="2400" height="12" fill="#fff"/>
      </g>
      ${K.radial(960, 540, 700, 1400, 70, { w: 30, seed: num * 7 + 1, color: '#2d1740' })}
    </svg>
    <div style="position:absolute;left:0;right:0;top:318px;height:340px;transform:rotate(-8deg);display:flex;flex-direction:column;justify-content:center;align-items:center">
      <div class="num" style="font-size:54px;color:#140b16">${U.esc(num)}</div>
      <div class="ttl" style="font-size:118px;line-height:1.05;color:#140b16;text-align:center;-webkit-text-stroke:0">${U.esc(title)}</div>
    </div>
    ${sub ? `<div style="position:absolute;left:0;right:0;bottom:170px;text-align:center;font-family:var(--f-tell);font-style:italic;font-size:44px;color:#f4ebd4">${U.esc(sub)}</div>` : ''}`;
    d.style.opacity = 0;
    $('overlay').appendChild(d);
    await d.animate([{ opacity: 0, transform: 'scale(1.08)' }, { opacity: 1, transform: 'scale(1)' }], { duration: TC.fastForward() ? 1 : 380, fill: 'forwards', easing: 'cubic-bezier(.2,.9,.3,1)' }).finished;
    FX.shake(10, 300);
    await TC.wait(TC.fastForward() ? 60 : 1900);
    await d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: TC.fastForward() ? 1 : 450, fill: 'forwards' }).finished;
    d.remove();
  };

  // time stop: an inverted sphere expands from a point, world freezes grey-blue
  FX.timeStop = async function (x = 960, y = 540) {
    TC.audio.sfx('timestop');
    TC.music.stop(0.2);
    const ring = U.el('div', { class: 'ov' });
    Object.assign(ring.style, { left: x + 'px', top: y + 'px', width: '10px', height: '10px', marginLeft: '-5px', marginTop: '-5px', borderRadius: '50%', inset: 'auto', position: 'absolute',
      backdropFilter: 'invert(1) hue-rotate(180deg)', webkitBackdropFilter: 'invert(1) hue-rotate(180deg)', boxShadow: '0 0 0 12px rgba(63,230,255,.35)' });
    $('overlay').appendChild(ring);
    await ring.animate([{ transform: 'scale(1)' }, { transform: 'scale(460)' }], { duration: TC.fastForward() ? 1 : 900, easing: 'cubic-bezier(.5,0,.8,.4)', fill: 'forwards' }).finished;
    await ring.animate([{ transform: 'scale(460)', opacity: 1 }, { transform: 'scale(1)', opacity: 1 }], { duration: TC.fastForward() ? 1 : 700, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' }).finished;
    ring.remove();
    FX.shift('timestop', 200);
  };
  FX.timeResume = async function () {
    TC.audio.sfx('timego');
    await FX.pulseShift(['negative', 'none'], 90);
    FX.shift('none');
  };

  /* ============================================================ big cards */
  // Voice acquired (tarot-style)
  FX.voiceCard = async function (v) {
    TC.audio.sfx('voiceGet');
    TC.music.stop && TC.audio.setDuck(0.25);
    const d = U.el('div', { class: 'ov' });
    d.innerHTML = `<div style="position:absolute;inset:0;background:rgba(20,11,22,.82)"></div>
      <svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">${K.radial(960, 520, 250, 1500, 90, { w: 26, seed: 17, color: v.color, op: 0.55 })}</svg>
      <div class="vbig" style="position:absolute;left:760px;top:130px;width:400px;height:640px;border:8px solid #000;border-radius:18px;background:#fff;box-shadow:18px 18px 0 #000;overflow:hidden">${TC.art.voiceCard(v, 400, 640)}</div>
      <div style="position:absolute;left:0;right:0;top:800px;text-align:center;font-family:var(--f-comic);font-size:40px;letter-spacing:.2em;color:${v.color}">${U.esc(TC.t(v.kicker))}</div>
      <div style="position:absolute;left:0;right:0;top:850px;text-align:center;font-family:var(--f-logo);font-size:96px;color:#fff;-webkit-text-stroke:4px #000;paint-order:stroke fill;text-shadow:8px 8px 0 #000">${U.esc(TC.t(v.name))}</div>`;
    $('overlay').appendChild(d);
    const card = d.querySelector('.vbig');
    d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, fill: 'forwards' });
    card.animate([{ transform: 'rotateY(180deg) scale(.4) rotate(-20deg)', opacity: 0 }, { transform: 'rotateY(0) scale(1.06) rotate(3deg)', opacity: 1, offset: 0.7 }, { transform: 'rotateY(0) scale(1) rotate(0)', opacity: 1 }], { duration: TC.fastForward() ? 1 : 700, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
    FX.sfx('バァーン', { x: 1480, y: 300, style: 'impact', size: 150, rot: 12, life: 1800 });
    FX.shake(14, 380);
    await TC.wait(TC.fastForward() ? 50 : 1800);
    await d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished;
    d.remove();
    TC.audio.setDuck(1);
  };

  // Stand stat card (SC eyecatch style)
  FX.standCard = async function (sd) {
    TC.audio.sfx('dundun');
    const d = U.el('div', { class: 'ov' });
    d.innerHTML = TC.art.standCard(sd);
    $('overlay').appendChild(d);
    d.animate([{ opacity: 0, transform: 'scale(1.1)' }, { opacity: 1, transform: 'scale(1)' }], { duration: TC.fastForward() ? 1 : 300, fill: 'forwards', easing: 'cubic-bezier(.2,.9,.3,1)' });
    FX.shake(12, 300);
    // click to continue, or it moves on by itself (so AUTO mode never stalls here)
    await Promise.race([TC.input.waitAdvance(), TC.wait(5200)]).catch((e) => { d.remove(); throw e; });
    await d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: 'forwards' }).finished;
    d.remove();
  };

  FX.clearOverlay = () => { U.$$('.ov, .tbc, .chcard', $('overlay')).forEach((e) => { if (e !== fader) e.remove(); }); };
  FX.resetAll = () => {
    FX.speedLines(false); FX.menace(false); FX.stopEmitters(); FX.clearParticles(); FX.clearSfx(); FX.closePanels(); FX.shift('none'); FX.clearOverlay(); FX.camReset();
    if (fader) { fader.style.transition = 'none'; fader.style.opacity = 0; }
  };
})();
