/* core.js — namespace, utilities, i18n, persistence, input, stage scaling */
(function () {
  'use strict';
  const TC = (window.TC = window.TC || {});
  const W = 1920, H = 1080;
  TC.W = W; TC.H = H;

  /* ------------------------------------------------------------------ utils */
  const U = (TC.util = {});
  U.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  U.lerp = (a, b, t) => a + (b - a) * t;
  U.rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  U.pick = (arr) => arr[(Math.random() * arr.length) | 0];
  // deterministic RNG (mulberry32) so procedural art is identical every load
  U.rng = (seed) => {
    let s = seed >>> 0;
    return (a = 1, b) => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      return b === undefined ? r * a : a + r * (b - a);
    };
  };
  U.ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inCubic: (t) => t * t * t,
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  };
  U.$ = (sel, root = document) => root.querySelector(sel);
  U.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  U.el = (tag, attrs, html) => {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'style' && typeof attrs[k] === 'object') Object.assign(e.style, attrs[k]);
      else if (k === 'class') e.className = attrs[k];
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    if (html !== undefined) e.innerHTML = html;
    return e;
  };
  U.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // tween helper driven by rAF; returns promise
  U.tween = (ms, fn, ease = U.ease.inOut) => new Promise((res) => {
    if (ms <= 0 || TC.fastForward()) { fn(1); res(); return; }
    const t0 = performance.now();
    const step = (now) => {
      const t = U.clamp((now - t0) / ms, 0, 1);
      fn(ease(t));
      if (t < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
  U.nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

  /* -------------------------------------------------------- run / abort */
  // Every story coroutine shares a run token; returning to title aborts it.
  const ABORT = (TC.ABORT = { abort: true });
  TC.run = { id: 0, aborted: false };
  TC.newRun = () => { TC.run.aborted = true; TC.run = { id: TC.run.id + 1, aborted: false }; return TC.run; };
  TC.guard = (run) => { if ((run || TC.run).aborted) throw ABORT; };
  TC.fastForward = () => !!(TC.state && (TC.state.skip || TC.state.ctrlSkip));
  // wait that respects skip + abort
  TC.wait = (ms) => {
    const run = TC.run;
    if (TC.fastForward()) ms = Math.min(ms, 40);
    return new Promise((res, rej) => {
      setTimeout(() => (run.aborted ? rej(ABORT) : res()), ms);
    });
  };

  /* ------------------------------------------------------------- i18n */
  TC.lang = 'en';
  TC.L = (en, vi) => ({ en, vi: vi === undefined ? en : vi });
  TC.t = (s) => {
    if (s == null) return '';
    if (typeof s === 'string') return s;
    if (typeof s === 'function') return TC.t(s());
    return s[TC.lang] != null ? s[TC.lang] : s.en;
  };

  /* ------------------------------------------------------------- persistence */
  const KEY = 'tamcam-bizarre-v1';
  const defaults = () => ({
    settings: { lang: null, textSpeed: 2, autoDelay: 1, music: 0.7, sfx: 0.8, voice: 0.6, shake: true, flashes: true },
    endings: {}, // id -> timestamp
    plays: 0, // completed runs (any ending)
    starts: 0,
    checkpoint: null, // {chapter, flags, voices}
    seenTrue: false,
  });
  TC.persist = {
    data: defaults(),
    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const d = JSON.parse(raw), base = defaults();
          this.data = Object.assign(base, d);
          this.data.settings = Object.assign(base.settings, d.settings || {});
        }
      } catch (e) { /* storage may be blocked (private mode / iframe) — run without it */ }
      return this.data;
    },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) { /* ignore */ }
    },
    reset() { this.data = defaults(); this.save(); },
  };

  /* ------------------------------------------------------------- stage */
  TC.stage = {
    scale: 1, ox: 0, oy: 0,
    el: null,
    fit() {
      const vw = window.innerWidth, vh = window.innerHeight;
      const s = Math.min(vw / W, vh / H);
      this.scale = s;
      this.ox = Math.round((vw - W * s) / 2);
      this.oy = Math.round((vh - H * s) / 2);
      this.el.style.transform = `translate(${this.ox}px,${this.oy}px) scale(${s})`;
      if (TC.fx && TC.fx.resize) TC.fx.resize();
    },
    toStage(cx, cy) { return { x: (cx - this.ox) / this.scale, y: (cy - this.oy) / this.scale }; },
    init() {
      this.el = document.getElementById('stage');
      this.fit();
      window.addEventListener('resize', () => this.fit());
      window.addEventListener('orientationchange', () => setTimeout(() => this.fit(), 250));
    },
  };

  /* ------------------------------------------------------------- input */
  const listeners = {};
  const IN = (TC.input = {
    on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); return () => this.off(ev, fn); },
    off(ev, fn) { const a = listeners[ev]; if (a) { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); } },
    emit(ev, arg) { const a = listeners[ev]; if (a) a.slice().forEach((f) => f(arg)); },
    held: new Set(),
    pointerDown: false,
    locked: false, // true while a menu is open
    // resolves on next advance (click/space/enter/tap)
    waitAdvance(run = TC.run) {
      return new Promise((res, rej) => {
        const off = this.on('advance', () => { off(); offA(); run.aborted ? rej(ABORT) : res(); });
        const offA = this.on('abort', () => { off(); offA(); rej(ABORT); });
      });
    },
  });

  const isUIControl = (t) => t && t.closest && t.closest('button, input, .choice, .mbtn, #menus .panel-box, a, .no-adv');

  function init() {
    window.addEventListener('keydown', (e) => {
      if (e.repeat && !['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Control'].includes(e.key)) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); }
        return;
      }
      IN.held.add(e.key);
      IN.emit('key', e);
      if (e.key === 'Control') { if (TC.state) TC.state.ctrlSkip = true; IN.emit('advance'); }
      if (IN.locked) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); IN.emit('press', 'key'); IN.emit('advance'); }
    });
    window.addEventListener('keyup', (e) => {
      IN.held.delete(e.key);
      if (e.key === 'Control' && TC.state) TC.state.ctrlSkip = false;
      IN.emit('keyup', e);
    });
    window.addEventListener('blur', () => { IN.held.clear(); if (TC.state) TC.state.ctrlSkip = false; IN.pointerDown = false; IN.emit('release'); });
    const stageEl = document.getElementById('app');
    stageEl.addEventListener('pointerdown', (e) => {
      if (e.button === 2) return;
      if (TC.audio) TC.audio.unlock();
      if (isUIControl(e.target)) return;
      IN.pointerDown = true;
      IN.emit('pointer', TC.stage.toStage(e.clientX, e.clientY));
      if (IN.locked) return;
      IN.emit('press', 'pointer');
      IN.emit('advance');
    });
    window.addEventListener('pointerup', () => { IN.pointerDown = false; IN.emit('release'); });
    window.addEventListener('pointercancel', () => { IN.pointerDown = false; IN.emit('release'); });
    stageEl.addEventListener('contextmenu', (e) => { e.preventDefault(); IN.emit('rightclick'); });
    stageEl.addEventListener('wheel', (e) => { IN.emit('wheel', e.deltaY); }, { passive: true });
    document.addEventListener('visibilitychange', () => IN.emit('visibility', document.hidden));
  }
  TC.initCore = () => { TC.stage.init(); init(); };

  /* ------------------------------------------------------------- fullscreen */
  TC.toggleFullscreen = () => {
    const d = document, el = d.documentElement;
    try {
      if (!d.fullscreenElement && !d.webkitFullscreenElement) {
        (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
      } else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    } catch (e) { /* not allowed in this frame */ }
  };
})();
