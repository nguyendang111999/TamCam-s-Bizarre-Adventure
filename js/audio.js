/* audio.js — fully procedural Web Audio engine.
   Instruments: đàn tranh (Karplus–Strong pluck), đàn bầu (glide monochord), sáo (breathy flute),
   trống (drum), mõ (temple wood block), phách (clapper), chiêng/gong, bass, stabs, drones, noise FX.
   No audio files are shipped — everything is synthesized at runtime. */
(function () {
  'use strict';
  const TC = window.TC;
  const A = (TC.audio = {});
  let ctx = null, master, comp, musicBus, sfxBus, voiceBus, reverb, reverbSend, musicDuck;
  const ksCache = new Map();
  let noiseBuf = null;

  A.ready = false;
  A.ctx = () => ctx;

  function build(c) {
    ctx = c;
    ksCache.clear();
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 12; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(ctx.destination);
    musicDuck = ctx.createGain(); musicDuck.gain.value = 1; musicDuck.connect(master);
    musicBus = ctx.createGain(); musicBus.connect(musicDuck);
    A._musicBus = musicBus;
    sfxBus = ctx.createGain(); sfxBus.connect(master);
    voiceBus = ctx.createGain(); voiceBus.connect(master);
    // reverb: generated impulse response
    reverb = ctx.createConvolver();
    reverb.buffer = makeIR(2.6, 2.2);
    reverbSend = ctx.createGain(); reverbSend.gain.value = 0.35;
    reverbSend.connect(reverb); reverb.connect(master);
    noiseBuf = makeNoise(2);
    A.applyVolumes();
    A.ready = true;
  }
  A.init = function () {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    build(new AC({ latencyHint: 'interactive' }));
  };
  // tests / tools: render through an OfflineAudioContext
  A.initWith = function (c) { build(c); };

  A.unlock = function () {
    if (!ctx) A.init();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  };

  A.applyVolumes = function () {
    if (!ctx) return;
    const s = TC.persist.data.settings;
    musicBus.gain.setTargetAtTime(s.music * 0.55, ctx.currentTime, 0.05);
    sfxBus.gain.setTargetAtTime(s.sfx * 0.9, ctx.currentTime, 0.05);
    voiceBus.gain.setTargetAtTime(s.voice * 0.5, ctx.currentTime, 0.05);
  };

  A.duck = function (amount = 0.35, ms = 600) {
    if (!ctx) return;
    const t = ctx.currentTime;
    musicDuck.gain.cancelScheduledValues(t);
    musicDuck.gain.setTargetAtTime(amount, t, 0.03);
    musicDuck.gain.setTargetAtTime(1, t + ms / 1000, 0.25);
  };
  A.setDuck = function (v) { if (ctx) musicDuck.gain.setTargetAtTime(v, ctx.currentTime, 0.12); };

  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend(); else ctx.resume();
  });

  /* ------------------------------------------------------- buffers */
  function makeNoise(sec) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function makeIR(sec, decay) {
    const len = ctx.sampleRate * sec, b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay) * (i < 90 ? i / 90 : 1);
    }
    return b;
  }
  // Karplus–Strong plucked string, pre-rendered per pitch (cached)
  function ksBuffer(freq, bright = 0.5, sec = 2.4) {
    const key = Math.round(freq * 10) + ':' + bright;
    if (ksCache.has(key)) return ksCache.get(key);
    const sr = ctx.sampleRate, len = Math.floor(sr * sec);
    const b = ctx.createBuffer(1, len, sr), d = b.getChannelData(0);
    const N = Math.max(2, Math.round(sr / freq));
    const buf = new Float32Array(N);
    // excitation: noise shaped by a quick lowpass = pluck position/brightness
    let lp = 0;
    for (let i = 0; i < N; i++) { const n = Math.random() * 2 - 1; lp = lp + (n - lp) * (0.35 + bright * 0.6); buf[i] = lp; }
    const damp = 0.4965 + bright * 0.0025; // ~0.5 average -> slow decay
    let idx = 0;
    for (let i = 0; i < len; i++) {
      const next = (idx + 1) % N;
      const v = damp * (buf[idx] + buf[next]);
      d[i] = buf[idx];
      buf[idx] = v;
      idx = next;
    }
    // gentle fade-out tail
    for (let i = len - 2000; i < len; i++) d[i] *= (len - i) / 2000;
    ksCache.set(key, b);
    return b;
  }

  /* ------------------------------------------------------- helpers */
  const now = () => (ctx ? ctx.currentTime : 0);
  A.now = now;
  function env(g, t, a, peak, d, sus, rel, len) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), t + a + d);
    g.gain.setValueAtTime(Math.max(0.0001, peak * sus), t + Math.max(a + d, len));
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + d, len) + rel);
    return t + Math.max(a + d, len) + rel;
  }
  function out(bus, node, rev = 0) {
    node.connect(bus);
    if (rev > 0) { const s = ctx.createGain(); s.gain.value = rev; node.connect(s); s.connect(reverbSend); }
  }
  function panner(p) { const n = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain(); if (n.pan) n.pan.value = p; return n; }
  A.mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  A.n = (name) => { // "C4" "Eb3" -> midi
    const m = /^([A-G][b#]?)(-?\d)$/.exec(name);
    return m ? 12 * (parseInt(m[2], 10) + 1) + NOTE[m[1]] : 60;
  };
  const f = (x) => (typeof x === 'number' ? (x < 128 ? A.mtof(x) : x) : A.mtof(A.n(x)));

  /* ------------------------------------------------------- instruments
     Each instrument: (t, note, dur, vel, opts) scheduled at absolute ctx time t. bus = 'music'|'sfx' */
  const bus = (b) => (b && b.connect ? b : b === 'sfx' ? sfxBus : b === 'voice' ? voiceBus : musicBus);
  const I = (A.inst = {});

  // đàn tranh — KS pluck with optional "nhấn" bend (semitones) and "rung" vibrato
  I.tranh = (t, note, dur = 1, vel = 0.7, o = {}) => {
    const src = ctx.createBufferSource();
    src.buffer = ksBuffer(f(note), o.bright != null ? o.bright : 0.55);
    const g = ctx.createGain(); g.gain.value = vel * 0.9;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 90;
    const p = panner(o.pan != null ? o.pan : 0.15);
    src.connect(hp); hp.connect(g); g.connect(p);
    out(bus(o.bus), p, o.rev != null ? o.rev : 0.35);
    if (o.bend) { // press the string after the attack
      src.playbackRate.setValueAtTime(1, t + 0.05);
      src.playbackRate.linearRampToValueAtTime(Math.pow(2, o.bend / 12), t + 0.05 + (o.bendTime || 0.18));
      if (o.release) src.playbackRate.linearRampToValueAtTime(1, t + dur);
    }
    if (o.vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.5; lg.gain.value = o.vib * 0.012; l.connect(lg); lg.connect(src.playbackRate); l.start(t + 0.15); l.stop(t + dur + 0.6); }
    const end = t + Math.min(2.3, dur + 0.9);
    g.gain.setValueAtTime(vel * 0.9, t); g.gain.setTargetAtTime(0.0001, t + dur, 0.25);
    src.start(t); src.stop(end);
  };

  // đàn bầu — pure harmonic tone with lever glides; o.from: start note for scoop, o.to: end glide
  I.bau = (t, note, dur = 1, vel = 0.6, o = {}) => {
    const osc = ctx.createOscillator(); osc.type = 'sine';
    const osc2 = ctx.createOscillator(); osc2.type = 'triangle';
    const g2 = ctx.createGain(); g2.gain.value = 0.18;
    const fr = f(note);
    const start = o.from != null ? f(o.from) : fr;
    osc.frequency.setValueAtTime(start, t); osc2.frequency.setValueAtTime(start * 2, t);
    if (o.from != null) { osc.frequency.exponentialRampToValueAtTime(fr, t + (o.scoop || 0.22)); osc2.frequency.exponentialRampToValueAtTime(fr * 2, t + (o.scoop || 0.22)); }
    if (o.to != null) { const tt = t + dur * (o.toAt || 0.6); osc.frequency.setValueAtTime(fr, tt); osc.frequency.exponentialRampToValueAtTime(f(o.to), t + dur); osc2.frequency.setValueAtTime(fr * 2, tt); osc2.frequency.exponentialRampToValueAtTime(f(o.to) * 2, t + dur); }
    const lfo = ctx.createOscillator(), lg = ctx.createGain();
    lfo.frequency.value = o.vibRate || 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(fr * (o.vib != null ? o.vib : 0.012), t + Math.min(0.5, dur * 0.6));
    lfo.connect(lg); lg.connect(osc.frequency); lg.connect(osc2.frequency);
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
    osc.connect(g); osc2.connect(g2); g2.connect(g); g.connect(lp);
    const p = panner(o.pan != null ? o.pan : -0.1); lp.connect(p);
    out(bus(o.bus), p, o.rev != null ? o.rev : 0.55);
    const end = env(g, t, 0.03, vel * 0.42, 0.25, 0.7, o.rel || 0.5, dur);
    [osc, osc2, lfo].forEach((n) => { n.start(t); n.stop(end + 0.05); });
  };

  // sáo — flute: sine + breath noise
  I.sao = (t, note, dur = 1, vel = 0.5, o = {}) => {
    const fr = f(note);
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(o.from != null ? f(o.from) : fr, t);
    if (o.from != null) osc.frequency.exponentialRampToValueAtTime(fr, t + 0.12);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.8; lg.gain.value = fr * 0.008; lfo.connect(lg); lg.connect(osc.frequency);
    const g = ctx.createGain();
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fr * 2; bp.Q.value = 3;
    const ng = ctx.createGain(); ng.gain.value = 0.09;
    n.connect(bp); bp.connect(ng); ng.connect(g);
    osc.connect(g);
    const p = panner(o.pan != null ? o.pan : 0.25); g.connect(p);
    out(bus(o.bus), p, 0.5);
    const end = env(g, t, 0.06, vel * 0.3, 0.2, 0.8, 0.25, dur);
    [osc, lfo, n].forEach((x) => { x.start(t); x.stop(end + 0.05); });
  };

  // bass — saw through resonant lowpass (funky)
  I.bass = (t, note, dur = 0.3, vel = 0.7, o = {}) => {
    const osc = ctx.createOscillator(); osc.type = o.type || 'sawtooth';
    osc.frequency.setValueAtTime(f(note), t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(f(o.slide), t + dur);
    const sub = ctx.createOscillator(); sub.type = 'sine'; sub.frequency.setValueAtTime(f(note) / 2, t);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = o.q || 7;
    lp.frequency.setValueAtTime(o.cut || 1400, t); lp.frequency.exponentialRampToValueAtTime(o.cutEnd || 180, t + Math.max(0.08, dur * 0.8));
    const g = ctx.createGain(), sg = ctx.createGain(); sg.gain.value = 0.6;
    osc.connect(lp); lp.connect(g); sub.connect(sg); sg.connect(g);
    out(bus(o.bus), g, 0.05);
    const end = env(g, t, 0.006, vel * 0.5, 0.08, 0.6, 0.06, dur);
    osc.start(t); sub.start(t); osc.stop(end + 0.05); sub.stop(end + 0.05);
  };

  // trống — drum (low tom / kick); o.pitch start freq
  I.drum = (t, _n, _d, vel = 0.9, o = {}) => {
    const osc = ctx.createOscillator(); osc.type = 'sine';
    const p0 = o.pitch || 140, p1 = o.to || 48;
    osc.frequency.setValueAtTime(p0, t); osc.frequency.exponentialRampToValueAtTime(p1, t + (o.drop || 0.16));
    const g = ctx.createGain();
    g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (o.decay || 0.45));
    osc.connect(g);
    // skin slap
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = o.slap || 1800; bp.Q.value = 0.8;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(vel * 0.35, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(bp); bp.connect(ng);
    const pn = panner(o.pan || 0); g.connect(pn); ng.connect(pn);
    out(bus(o.bus), pn, o.rev != null ? o.rev : 0.12);
    osc.start(t); osc.stop(t + (o.decay || 0.45) + 0.05); n.start(t); n.stop(t + 0.08);
  };

  // mõ — temple wood block "cốc"
  I.mo = (t, _n, _d, vel = 0.8, o = {}) => {
    const fr = o.pitch || 820;
    [1, 2.62].forEach((r, i) => {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.setValueAtTime(fr * r, t);
      osc.frequency.exponentialRampToValueAtTime(fr * r * 0.97, t + 0.08);
      const g = ctx.createGain(); g.gain.setValueAtTime(vel * (i ? 0.25 : 0.7), t); g.gain.exponentialRampToValueAtTime(0.0001, t + (i ? 0.04 : 0.11));
      osc.connect(g); const pn = panner(o.pan || -0.2); g.connect(pn); out(bus(o.bus), pn, 0.25);
      osc.start(t); osc.stop(t + 0.15);
    });
  };

  // phách — bamboo clapper
  I.phach = (t, _n, _d, vel = 0.6, o = {}) => {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = o.pitch || 2600; bp.Q.value = 4;
    const g = ctx.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    n.connect(bp); bp.connect(g); const pn = panner(o.pan || 0.3); g.connect(pn); out(bus(o.bus), pn, 0.2);
    n.start(t, Math.random()); n.stop(t + 0.06);
  };

  // hi-hat-ish shaker
  I.hat = (t, _n, _d, vel = 0.3, o = {}) => {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.setValueAtTime(vel * 0.5, t); g.gain.exponentialRampToValueAtTime(0.0001, t + (o.open ? 0.22 : 0.05));
    n.connect(hp); hp.connect(g); const pn = panner(o.pan || 0.1); g.connect(pn); out(bus(o.bus), pn, 0.05);
    n.start(t, Math.random()); n.stop(t + 0.3);
  };

  // snare
  I.snare = (t, _n, _d, vel = 0.7, o = {}) => {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'highpass'; bp.frequency.value = 1200;
    const g = ctx.createGain(); g.gain.setValueAtTime(vel * 0.55, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    n.connect(bp); bp.connect(g);
    const osc = ctx.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(220, t); osc.frequency.exponentialRampToValueAtTime(120, t + 0.08);
    const og = ctx.createGain(); og.gain.setValueAtTime(vel * 0.4, t); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.connect(og);
    const pn = panner(o.pan || 0); g.connect(pn); og.connect(pn); out(bus(o.bus), pn, 0.18);
    n.start(t, Math.random()); n.stop(t + 0.22); osc.start(t); osc.stop(t + 0.12);
  };

  // chiêng / gong — inharmonic partials, long decay
  I.gong = (t, note = 'C3', dur = 3, vel = 0.6, o = {}) => {
    const fr = f(note);
    const parts = [[1, 1, 1], [1.483, 0.55, 0.8], [1.932, 0.4, 0.6], [2.546, 0.28, 0.45], [3.117, 0.2, 0.35], [4.12, 0.12, 0.25]];
    const g = ctx.createGain(); g.gain.value = vel * 0.28;
    parts.forEach(([r, a, dec]) => {
      const osc = ctx.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(fr * r * 1.01, t); osc.frequency.exponentialRampToValueAtTime(fr * r, t + 0.3);
      const pg = ctx.createGain(); pg.gain.setValueAtTime(0.0001, t); pg.gain.linearRampToValueAtTime(a, t + 0.01);
      pg.gain.exponentialRampToValueAtTime(0.0001, t + dur * dec + 0.2);
      osc.connect(pg); pg.connect(g); osc.start(t); osc.stop(t + dur + 0.3);
    });
    const pn = panner(o.pan || 0); g.connect(pn); out(bus(o.bus), pn, 0.6);
  };

  // bell/chime (Bụt's sparkle)
  I.chime = (t, note = 'C6', dur = 1.5, vel = 0.4, o = {}) => {
    const fr = f(note);
    [[1, 1], [2.76, 0.35], [5.4, 0.15]].forEach(([r, a]) => {
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = fr * r;
      const g = ctx.createGain(); g.gain.setValueAtTime(vel * a * 0.3, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur / r);
      osc.connect(g); const pn = panner(o.pan || 0.3); g.connect(pn); out(bus(o.bus), pn, 0.7);
      osc.start(t); osc.stop(t + dur + 0.1);
    });
  };

  // pad — detuned saws, slow attack
  I.pad = (t, note, dur = 2, vel = 0.3, o = {}) => {
    const fr = f(note);
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.cut || 900; lp.Q.value = 0.7;
    [-7, 0, 6].forEach((d) => {
      const osc = ctx.createOscillator(); osc.type = o.type || 'sawtooth'; osc.frequency.value = fr; osc.detune.value = d;
      osc.connect(lp); osc.start(t); osc.stop(t + dur + (o.rel || 1.2) + 0.1);
    });
    lp.connect(g); const pn = panner(o.pan || 0); g.connect(pn); out(bus(o.bus), pn, 0.6);
    env(g, t, o.att || 0.6, vel * 0.12, 0.3, 0.85, o.rel || 1.2, dur);
  };

  // orchestra-hit style stab
  I.stab = (t, note = 'C3', dur = 0.5, vel = 0.8, o = {}) => {
    const fr = f(note);
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(400, t + dur);
    [1, 1.5, 2, 3, 4].forEach((r, i) => [-12, 9].forEach((d) => {
      const osc = ctx.createOscillator(); osc.type = i % 2 ? 'square' : 'sawtooth'; osc.frequency.value = fr * r; osc.detune.value = d;
      osc.connect(lp); osc.start(t); osc.stop(t + dur + 0.4);
    }));
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; const ng = ctx.createGain(); ng.gain.setValueAtTime(0.5, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    n.connect(ng); ng.connect(lp); n.start(t); n.stop(t + 0.15);
    lp.connect(g); out(bus(o.bus), g, 0.5);
    g.gain.setValueAtTime(vel * 0.16, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.3);
  };

  // low menacing drone (ゴゴゴ)
  I.drone = (t, note = 'C2', dur = 4, vel = 0.5, o = {}) => {
    const fr = f(note);
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(o.cut || 260, t); lp.Q.value = 6;
    if (o.sweep) lp.frequency.exponentialRampToValueAtTime(o.sweep, t + dur);
    [-14, 0, 11, 1203].forEach((d) => {
      const osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = fr; osc.detune.value = d;
      osc.connect(lp); osc.start(t); osc.stop(t + dur + 1.1);
    });
    // tremolo on its own stage so depth scales with the envelope (level stays proportional to vel)
    const tremG = ctx.createGain(); tremG.gain.value = 1;
    const trem = ctx.createOscillator(), tg = ctx.createGain(); trem.frequency.value = o.trem || 7; tg.gain.value = 0.35;
    trem.connect(tg); tg.connect(tremG.gain); trem.start(t); trem.stop(t + dur + 1.1);
    lp.connect(tremG); tremG.connect(g); out(bus(o.bus), g, 0.3);
    env(g, t, o.att || 0.8, vel * 0.22, 0.2, 0.9, 1, dur);
  };

  /* ------------------------------------------------------- SFX library */
  function noiseSweep(t, dur, f0, f1, vel, type = 'bandpass', q = 1.2, b = 'sfx', rev = 0.2) {
    const n = ctx.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q;
    fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(fl); fl.connect(g); out(bus(b), g, rev);
    n.start(t, Math.random()); n.stop(t + dur + 0.05);
  }
  function tone(t, type, f0, f1, dur, vel, b = 'sfx', rev = 0.1, pan = 0) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const pn = panner(pan); o.connect(g); g.connect(pn); out(bus(b), pn, rev); o.start(t); o.stop(t + dur + 0.02);
  }
  A.tone = (...a) => { if (ctx) tone(now(), ...a); };

  const SFX = {
    click: (t) => { I.mo(t, 0, 0, 0.35, { pitch: 1500, bus: 'sfx' }); },
    select: (t) => { I.mo(t, 0, 0, 0.5, { pitch: 1100, bus: 'sfx' }); I.tranh(t + 0.02, 'G5', 0.4, 0.4, { bus: 'sfx', rev: 0.3 }); },
    hover: (t) => { I.phach(t, 0, 0, 0.18, { pitch: 3400, bus: 'sfx' }); },
    choiceIn: (t) => { noiseSweep(t, 0.25, 800, 4000, 0.15); },
    whoosh: (t) => { noiseSweep(t, 0.45, 300, 3500, 0.5, 'bandpass', 1.5); },
    whooshDown: (t) => { noiseSweep(t, 0.5, 3000, 200, 0.45, 'bandpass', 1.5); },
    slam: (t) => { I.drum(t, 0, 0, 1, { pitch: 110, to: 40, decay: 0.6, bus: 'sfx', rev: 0.3 }); noiseSweep(t, 0.3, 3000, 300, 0.4); },
    boom: (t) => { I.drum(t, 0, 0, 1, { pitch: 90, to: 28, decay: 1.2, bus: 'sfx', rev: 0.5 }); noiseSweep(t, 1.2, 1800, 60, 0.6, 'lowpass', 0.7); },
    dun: (t) => { I.stab(t, 'C3', 0.7, 1, { bus: 'sfx' }); I.drum(t, 0, 0, 1, { pitch: 100, to: 35, decay: 0.8, bus: 'sfx' }); },
    dundun: (t) => { I.stab(t, 'C3', 0.35, 0.9, { bus: 'sfx' }); I.stab(t + 0.28, 'F#3', 0.8, 1, { bus: 'sfx' }); I.drum(t + 0.28, 0, 0, 1, { pitch: 90, to: 30, decay: 0.9, bus: 'sfx' }); },
    shock: (t) => { I.stab(t, 'D#3', 0.9, 1, { bus: 'sfx' }); tone(t, 'sawtooth', 1200, 300, 0.5, 0.08); },
    chop: (t) => { I.drum(t, 0, 0, 1, { pitch: 320, to: 90, decay: 0.18, slap: 2500, bus: 'sfx', rev: 0.25 }); I.phach(t, 0, 0, 0.9, { pitch: 1500, bus: 'sfx' }); I.phach(t + 0.01, 0, 0, 0.6, { pitch: 900, bus: 'sfx' }); },
    creak: (t) => { // tree / loom creak "kẽo kẹt"
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(140, t + 0.25); o.frequency.linearRampToValueAtTime(95, t + 0.5);
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 9;
      const am = ctx.createOscillator(), amg = ctx.createGain(); am.type = 'square'; am.frequency.setValueAtTime(28, t); am.frequency.linearRampToValueAtTime(45, t + 0.5); amg.gain.value = 0.5;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5, t + 0.05); g.gain.setValueAtTime(0.5, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      am.connect(amg); amg.connect(g.gain);
      o.connect(bp); bp.connect(g); out(sfxBus, g, 0.3);
      o.start(t); am.start(t); o.stop(t + 0.6); am.stop(t + 0.6);
    },
    crash: (t) => { noiseSweep(t, 1.4, 5000, 100, 0.7, 'lowpass', 0.5, 'sfx', 0.5); I.drum(t, 0, 0, 1, { pitch: 70, to: 25, decay: 1.4, bus: 'sfx' }); for (let i = 0; i < 6; i++) I.phach(t + 0.05 + i * 0.07 + Math.random() * 0.05, 0, 0, 0.5, { pitch: 600 + Math.random() * 1400, bus: 'sfx' }); },
    fall: (t) => { tone(t, 'sine', 1400, 180, 1.6, 0.12, 'sfx', 0.3); },
    poof: (t) => { noiseSweep(t, 0.6, 400, 2500, 0.45, 'bandpass', 0.8, 'sfx', 0.5); I.mo(t, 0, 0, 0.8, { pitch: 780, bus: 'sfx' }); I.mo(t + 0.16, 0, 0, 0.6, { pitch: 780, bus: 'sfx' }); ['C6', 'E6', 'G6', 'C7'].forEach((n, i) => I.chime(t + 0.08 + i * 0.07, n, 1.4, 0.5, { bus: 'sfx' })); },
    flap: (t) => { for (let i = 0; i < 5; i++) noiseSweep(t + i * 0.09, 0.08, 500, 1500, 0.28, 'bandpass', 1); },
    chirp: (t) => { for (let i = 0; i < 3; i++) tone(t + i * 0.09, 'sine', 2600 + i * 300, 4200, 0.07, 0.12, 'sfx', 0.2, 0.3); },
    sing: (t) => { [0, 0.14, 0.3, 0.42].forEach((d, i) => tone(t + d, 'sine', [2400, 3000, 2600, 3400][i], [3200, 3800, 2200, 4000][i], 0.12, 0.1, 'sfx', 0.3, 0.3)); },
    sparkle: (t) => { ['E6', 'B6', 'E7'].forEach((n, i) => I.chime(t + i * 0.06, n, 0.8, 0.5, { bus: 'sfx' })); },
    heart: (t) => { I.drum(t, 0, 0, 0.9, { pitch: 70, to: 40, decay: 0.25, bus: 'sfx', rev: 0 }); I.drum(t + 0.18, 0, 0, 0.7, { pitch: 65, to: 38, decay: 0.25, bus: 'sfx', rev: 0 }); },
    step: (t) => { I.drum(t, 0, 0, 0.6, { pitch: 90, to: 50, decay: 0.2, slap: 900, bus: 'sfx', rev: 0.3 }); },
    dodo: (t) => { I.drum(t, 0, 0, 0.8, { pitch: 60, to: 34, decay: 0.3, bus: 'sfx', rev: 0.1 }); I.bass(t, 'C1', 0.2, 0.5, { bus: 'sfx', cut: 300, cutEnd: 80 }); },
    menace: (t) => { I.drone(t, 'C1', 2.2, 0.8, { bus: 'sfx', cut: 180, sweep: 500, trem: 11, att: 0.3 }); },
    punch: (t) => { I.drum(t, 0, 0, 0.8, { pitch: 180, to: 60, decay: 0.12, slap: 3000 + Math.random() * 1500, bus: 'sfx', rev: 0.05, pan: Math.random() - 0.5 }); },
    bigpunch: (t) => { I.drum(t, 0, 0, 1, { pitch: 140, to: 30, decay: 0.7, slap: 1500, bus: 'sfx', rev: 0.3 }); noiseSweep(t, 0.5, 4000, 200, 0.6, 'lowpass', 0.6); I.stab(t, 'C2', 0.5, 0.7, { bus: 'sfx' }); },
    fire: (t) => { noiseSweep(t, 2.2, 300, 900, 0.35, 'lowpass', 0.5); for (let i = 0; i < 10; i++) I.phach(t + Math.random() * 2, 0, 0, 0.2, { pitch: 1500 + Math.random() * 2000, bus: 'sfx' }); },
    plop: (t) => { tone(t, 'sine', 300, 900, 0.09, 0.35); I.mo(t + 0.03, 0, 0, 0.3, { pitch: 500, bus: 'sfx' }); },
    bite: (t) => { I.phach(t, 0, 0, 0.9, { pitch: 1800, bus: 'sfx' }); I.phach(t + 0.05, 0, 0, 0.6, { pitch: 1200, bus: 'sfx' }); },
    munch: (t) => { for (let i = 0; i < 6; i++) I.phach(t + i * 0.11, 0, 0, 0.45, { pitch: 700 + Math.random() * 900, bus: 'sfx' }); },
    gulp: (t) => { tone(t, 'sine', 500, 150, 0.2, 0.4); },
    splash: (t) => { noiseSweep(t, 0.7, 6000, 500, 0.6, 'highpass', 0.5, 'sfx', 0.4); I.drum(t, 0, 0, 0.5, { pitch: 200, to: 80, decay: 0.2, bus: 'sfx' }); },
    bubble: (t) => { for (let i = 0; i < 8; i++) tone(t + i * 0.12 + Math.random() * 0.05, 'sine', 300 + Math.random() * 300, 700 + Math.random() * 500, 0.06, 0.18); },
    timestop: (t) => { noiseSweep(t, 1.2, 200, 8000, 0.5, 'bandpass', 2, 'sfx', 0.8); tone(t, 'sine', 80, 2000, 1.1, 0.2, 'sfx', 0.8); I.gong(t + 0.9, 'C3', 3, 0.7, { bus: 'sfx' }); },
    timego: (t) => { noiseSweep(t, 0.7, 8000, 200, 0.4, 'bandpass', 2, 'sfx', 0.6); tone(t, 'sine', 2000, 80, 0.7, 0.2, 'sfx', 0.5); },
    tick: (t) => { I.phach(t, 0, 0, 0.5, { pitch: 4200, bus: 'sfx' }); },
    record: (t) => { tone(t, 'sawtooth', 900, 60, 0.4, 0.12); noiseSweep(t, 0.4, 3000, 300, 0.3); },
    wahwah: (t) => { ['G3', 'F#3', 'F3', 'E3'].forEach((n, i) => I.bau(t + i * 0.42, n, i === 3 ? 1.1 : 0.4, 0.8, { bus: 'sfx', vib: i === 3 ? 0.03 : 0.004, from: i ? undefined : 'A3' })); },
    tearpaper: (t) => { for (let i = 0; i < 14; i++) noiseSweep(t + i * 0.03, 0.08, 1500 + Math.random() * 3000, 800, 0.25 + Math.random() * 0.2, 'bandpass', 2); },
    pageflip: (t) => { noiseSweep(t, 0.3, 900, 3500, 0.35, 'bandpass', 0.9); },
    glass: (t) => { ['C7', 'G6', 'D7', 'A6'].forEach((n, i) => I.chime(t + i * 0.04, n, 0.6, 0.4, { bus: 'sfx' })); },
    crow: (t) => { [0, 0.35].forEach((d) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(520, t + d); o.frequency.linearRampToValueAtTime(380, t + d + 0.28); const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 3; const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t + d); g.gain.linearRampToValueAtTime(0.4, t + d + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.3); o.connect(bp); bp.connect(g); out(sfxBus, g, 0.3); o.start(t + d); o.stop(t + d + 0.32); }); },
    cry: (t) => { [0, 0.3, 0.6].forEach((d, i) => tone(t + d, 'triangle', 700 - i * 40, 520 - i * 40, 0.26, 0.1, 'sfx', 0.3)); },
    gasp: (t) => { noiseSweep(t, 0.25, 900, 2400, 0.3, 'bandpass', 2); },
    tbc: (t) => { // original "to be continued" jingle: slap-bass + tranh riff
      const B = [['E2', 0], ['E2', 0.18], ['G2', 0.36], ['A2', 0.54], ['B2', 0.72], ['D3', 0.9], ['E3', 1.08]];
      B.forEach(([n, d], i) => I.bass(t + d, n, 0.16, 0.9, { bus: 'sfx', type: 'square', cut: 2600, cutEnd: 300, q: 4 }));
      ['E5', 'D5', 'B4', 'A4', 'B4'].forEach((n, i) => I.tranh(t + 0.02 + i * 0.18, n, 0.3, 0.55, { bus: 'sfx', bend: i === 4 ? 2 : 0 }));
      I.drum(t + 1.26, 0, 0, 1, { pitch: 120, to: 40, decay: 0.6, bus: 'sfx' }); I.stab(t + 1.26, 'E3', 1.2, 0.9, { bus: 'sfx' });
    },
    voiceGet: (t) => { I.gong(t, 'G2', 2.5, 0.8, { bus: 'sfx' }); I.stab(t, 'G3', 0.8, 0.8, { bus: 'sfx' }); ['G5', 'D6', 'G6'].forEach((n, i) => I.chime(t + 0.1 + i * 0.08, n, 1.2, 0.5, { bus: 'sfx' })); },
    chapter: (t) => { I.gong(t, 'C3', 3.5, 0.9, { bus: 'sfx' }); I.drum(t, 0, 0, 1, { pitch: 100, to: 30, decay: 1, bus: 'sfx' }); noiseSweep(t, 0.8, 200, 4000, 0.3); },
    ending: (t) => { ['C4', 'D4', 'F4', 'G4', 'A4', 'C5'].forEach((n, i) => I.tranh(t + i * 0.11, n, 1.2, 0.6, { bus: 'sfx' })); I.gong(t + 0.7, 'C3', 3, 0.6, { bus: 'sfx' }); },
    bath: (t) => { for (let i = 0; i < 16; i++) tone(t + i * 0.09 + Math.random() * 0.06, 'sine', 180 + Math.random() * 200, 500 + Math.random() * 300, 0.07, 0.16); },
    rip: (t) => { noiseSweep(t, 0.9, 400, 7000, 0.7, 'bandpass', 1.4, 'sfx', 0.3); I.drum(t + 0.6, 0, 0, 1, { pitch: 100, to: 30, decay: 1, bus: 'sfx' }); },
    fanfare: (t) => { [['C4', 0], ['G4', 0.18], ['C5', 0.36], ['E5', 0.54]].forEach(([n, d]) => I.stab(t + d, n, 0.4, 0.5, { bus: 'sfx' })); },
    eraser: (t) => { noiseSweep(t, 2.5, 200, 3000, 0.25, 'bandpass', 0.6, 'sfx', 0.6); },
  };
  A.sfx = function (name, delay = 0) {
    if (!ctx || !SFX[name]) return;
    if (TC.fastForward() && !['click', 'select'].includes(name)) return;
    try { SFX[name](now() + 0.005 + delay); } catch (e) { console.warn('sfx', name, e); }
  };

  /* ------------------------------------------------------- dialogue blips */
  const BLIP = {
    narrator: { fn: (t, v) => { tone(t, 'sine', 170 * v, 150 * v, 0.07, 0.16, 'voice', 0.2); tone(t, 'triangle', 340 * v, 330 * v, 0.04, 0.04, 'voice', 0.2); }, every: 3 },
    cam: { fn: (t, v) => { tone(t, 'square', 330 * v, 320 * v, 0.045, 0.05, 'voice', 0.05, -0.2); }, every: 2 },
    tam: { fn: (t, v) => { I.tranh(t, 76 + Math.round((v - 1) * 20), 0.12, 0.3, { bus: 'voice', rev: 0.2, bright: 0.8 }); }, every: 3 },
    menacing: { fn: (t, v) => { tone(t, 'sawtooth', 85 * v, 70 * v, 0.08, 0.12, 'voice', 0.1); }, every: 2 },
    hungry: { fn: (t, v) => { tone(t, 'sine', 260 * v, 520 * v, 0.06, 0.2, 'voice', 0.1); }, every: 2 },
    sister: { fn: (t, v) => { tone(t, 'sine', 620 * v, 600 * v, 0.08, 0.12, 'voice', 0.4); }, every: 3 },
    coward: { fn: (t, v) => { tone(t, 'triangle', 700 * v, 820 * v, 0.035, 0.09, 'voice', 0.05); }, every: 1 },
    but: { fn: (t, v) => { I.mo(t, 0, 0, 0.3, { pitch: 700 * v, bus: 'voice' }); }, every: 3 },
    mom: { fn: (t, v) => { tone(t, 'square', 250 * v, 230 * v, 0.06, 0.07, 'voice', 0.05); }, every: 2 },
    king: { fn: (t, v) => { tone(t, 'sawtooth', 140 * v, 150 * v, 0.09, 0.08, 'voice', 0.2); }, every: 3 },
    oldwoman: { fn: (t, v) => { tone(t, 'sine', 420 * v, 380 * v, 0.07, 0.14, 'voice', 0.2); }, every: 3 },
    bird: { fn: (t, v) => { tone(t, 'sine', 2400 * v, 3400 * v, 0.05, 0.08, 'voice', 0.2, 0.3); }, every: 2 },
    loom: { fn: (t, v) => { tone(t, 'sawtooth', 60 * v, 90 * v, 0.1, 0.1, 'voice', 0.4); }, every: 3 },
    fruit: { fn: (t, v) => { tone(t, 'sine', 900 * v, 700 * v, 0.05, 0.1, 'voice', 0.2); }, every: 2 },
    crow: { fn: (t, v) => { tone(t, 'sawtooth', 480 * v, 380 * v, 0.07, 0.07, 'voice', 0.2); }, every: 2 },
  };
  let blipCount = 0;
  A.blip = function (who, ch) {
    if (!ctx || TC.fastForward()) return;
    const b = BLIP[who] || BLIP.cam;
    if (!/[\p{L}\p{N}]/u.test(ch)) return;
    if (blipCount++ % b.every) return;
    b.fn(now() + 0.002, 0.94 + Math.random() * 0.12);
  };
  A.resetBlip = () => { blipCount = 0; };
})();
