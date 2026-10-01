/* music.js — bar-by-bar lookahead sequencer + original compositions.
   Modes: Bắc (hò-xự-xang-xê-cống ≈ C D F G A) for daylight, Nam/oán (C Eb F G Bb + bends) for sorrow.
   Melody mini-notation: "NOTE/beats" e.g. "E5/1.5 D5/.5 C5/1 -/1"; modifiers: *vel ^bend >glideTo <scoopFrom ~ (vibrato) */
(function () {
  'use strict';
  const TC = window.TC, A = TC.audio, U = TC.util;
  const M = (TC.music = {});
  let cur = null; // {id, def, gain, nextBar, barIndex, timer}
  const params = { intensity: 0 };
  M.params = params;
  M.param = (k, v) => { params[k] = v; };

  // parse melody string once (cached)
  const pcache = new Map();
  function parse(str) {
    if (pcache.has(str)) return pcache.get(str);
    const out = [];
    let beat = 0;
    str.trim().split(/\s+/).forEach((tok) => {
      const m = /^([A-G][b#]?-?\d|-)(?:\/([\d.]+))?(.*)$/.exec(tok);
      if (!m) return;
      const dur = m[2] ? parseFloat(m[2]) : 1;
      if (m[1] !== '-') {
        const ev = { beat, note: m[1], dur, vel: 1, o: {} };
        const mods = m[3] || '';
        let mm;
        if ((mm = /\*([\d.]+)/.exec(mods))) ev.vel = parseFloat(mm[1]);
        if ((mm = /\^(-?[\d.]+)/.exec(mods))) ev.o.bend = parseFloat(mm[1]);
        if ((mm = />([A-G][b#]?-?\d)/.exec(mods))) ev.o.to = mm[1];
        if ((mm = /<([A-G][b#]?-?\d)/.exec(mods))) ev.o.from = mm[1];
        if (mods.includes('~')) ev.o.vib = 0.03;
        out.push(ev);
      }
      beat += dur;
    });
    pcache.set(str, out);
    return out;
  }

  function makeT(def, bar, t0, gain) {
    const spb = 60 / def.bpm;
    const rnd = U.rng(bar * 7919 + (def.seed || 1));
    const T = {
      bar, spb, rnd, t0, p: params,
      t: (beat) => t0 + beat * spb,
      i(inst, beat, note, dur = 1, vel = 0.7, o = {}) {
        const fn = A.inst[inst];
        if (!fn) return;
        fn(t0 + beat * spb, note, dur * spb, vel * (def.gain || 1), Object.assign({ bus: gain }, o));
      },
      mel(inst, str, start = 0, vel = 0.7, o = {}) {
        parse(str).forEach((e) => {
          const oo = Object.assign({}, o, e.o);
          if (oo.to && inst !== 'bau') delete oo.to;
          T.i(inst, start + e.beat, e.note, e.dur, vel * e.vel, oo);
        });
      },
      chord(inst, notes, beat, dur, vel, o) { notes.forEach((n) => T.i(inst, beat, n, dur, vel, o)); },
    };
    return T;
  }

  function tick() {
    if (!cur || !A.ready) return;
    const ctx = A.ctx();
    const def = cur.def;
    const barLen = (60 / def.bpm) * (def.beats || 4);
    while (cur.nextBar < ctx.currentTime + 0.35) {
      try { def.gen(cur.barIndex, makeT(def, cur.barIndex, cur.nextBar, cur.gain)); } catch (e) { console.warn('music gen', e); }
      cur.nextBar += barLen;
      cur.barIndex++;
      if (def.bars && def.once && cur.barIndex >= def.bars) { const c = cur; setTimeout(() => { if (cur === c) M.stop(0.5); }, barLen * 1000); break; }
    }
  }

  M.current = () => (cur ? cur.id : null);
  M.play = function (id, fade = 0.8) {
    if (!A.ready) { M.pending = id; return; }
    if (cur && cur.id === id) return;
    const def = TRACKS[id];
    if (!def) { M.stop(fade); return; }
    M.stop(fade);
    const ctx = A.ctx();
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(1, ctx.currentTime + Math.max(0.05, fade * 0.6));
    g.connect(A.musicBus());
    cur = { id, def, gain: g, nextBar: ctx.currentTime + 0.12, barIndex: 0 };
    cur.timer = setInterval(tick, 60);
    tick();
  };
  M.stop = function (fade = 0.8) {
    if (!cur) return;
    const c = cur; cur = null;
    clearInterval(c.timer);
    const ctx = A.ctx();
    c.gain.gain.cancelScheduledValues(ctx.currentTime);
    c.gain.gain.setValueAtTime(c.gain.gain.value, ctx.currentTime);
    c.gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + Math.max(0.03, fade));
    setTimeout(() => { try { c.gain.disconnect(); } catch (e) { } }, (fade + 3) * 1000);
  };
  M.resumePending = () => { if (M.pending) { const p = M.pending; M.pending = null; M.play(p); } };
  // offline render of a track (tools/lab/audio.html) — returns an AudioBuffer
  M.renderOffline = async function (id, seconds = 20, params = {}) {
    const sr = 44100, off = new OfflineAudioContext(2, sr * seconds, sr);
    A.initWith(off);
    Object.assign(M.params, params);
    const def = TRACKS[id];
    const g = off.createGain(); g.connect(A.musicBus());
    const barLen = (60 / def.bpm) * (def.beats || 4);
    for (let t = 0.05, b = 0; t < seconds; t += barLen, b++) def.gen(b, makeT(def, b, t, g));
    return off.startRendering();
  };

  /* ================================================================ TRACKS */
  const TRACKS = (M.tracks = {});

  // --- helpers
  const eighths = (T, inst, notes, vel, o, start = 0, step = 0.5) => notes.forEach((n, k) => n && T.i(inst, start + k * step, n, step * 1.6, vel * (k % 2 ? 0.75 : 1), o));

  /* TITLE — "Ricedust Crusaders" (A minor pentatonic, 128 bpm) */
  const titleLead = [
    'A4/.5 C5/.5 D5/.5 E5/1.5 G5/.5 E5/.5',
    'D5/1 C5/.5 D5/.5 E5/2^2',
    'G5/.5 A5/.5 G5/.5 E5/.5 D5/1 C5/1',
    'D5/.5 E5/.5 C5/1 A4/2~',
    'F5/1 E5/.5 D5/.5 C5/1 D5/1',
    'G5/1.5 A5/.5 G5/1 D5/1^2',
    'E5/.5 G5/.5 A5/1 C6/1 A5/1',
    'G5/.5 E5/.5 D5/1 E5/2~',
  ];
  const titleRoots = ['A1', 'A1', 'C2', 'D2', 'F1', 'G1', 'A1', 'E1'];
  const oct = (n) => n.replace(/(\d)$/, (d) => String(+d + 1));
  TRACKS.title = {
    bpm: 128, seed: 3, gain: 1,
    gen(b, T) {
      const k = b % 8, intro = b < 2;
      const r = titleRoots[k];
      // bass: funky octave 8ths
      [r, oct(r), r, oct(r), r, oct(r), r, oct(r)].forEach((n, i) => T.i('bass', i * 0.5, n, 0.42, i % 2 ? 0.45 : 0.66, { cut: 1600, cutEnd: 200, q: 8 }));
      // drums
      if (!intro || b === 1) {
        [0, 1.75, 2].forEach((x) => T.i('drum', x, 0, 0, 0.95, { pitch: 120, to: 45, decay: 0.35 }));
        [1, 3].forEach((x) => T.i('snare', x, 0, 0, 0.7));
        for (let i = 0; i < 8; i++) T.i('hat', i * 0.5, 0, 0, i % 2 ? 0.35 : 0.5);
      } else {
        T.i('drum', 0, 0, 0, 1, { pitch: 110, to: 38, decay: 0.8 });
      }
      if (k === 7) [3, 3.25, 3.5, 3.75].forEach((x, i) => T.i('drum', x, 0, 0, 0.8, { pitch: 260 - i * 40, to: 90 - i * 10, decay: 0.2 }));
      if (k === 0 || k === 4) T.i('stab', 0, k ? 'F3' : 'A3', 0.6, 0.8);
      if (k === 0 && b % 16 === 0) T.i('gong', 0, 'A2', 4, 0.6);
      if (!intro) T.mel('tranh', titleLead[k], 0, 0.8, { bright: 0.7, rev: 0.25, pan: 0.2 });
      if (!intro && b % 16 >= 8) T.mel('bau', titleLead[k].replace(/(\d)(?=\/)/g, (d) => String(+d - 1)), 0, 0.55, { pan: -0.3 });
      // pad
      const chords = [['A3', 'C4', 'E4'], ['A3', 'C4', 'E4'], ['G3', 'C4', 'E4'], ['A3', 'D4', 'F4'], ['A3', 'C4', 'F4'], ['G3', 'B3', 'D4'], ['A3', 'C4', 'E4'], ['G#3', 'B3', 'E4']];
      T.chord('pad', chords[k], 0, 4, 0.32, { att: 0.2, rel: 0.4, cut: 1200 });
    },
  };

  /* PATH — dusk rice fields (C Bắc, 72 bpm) */
  const pathBau = ['G5/2<A5 A5/1 G5/1', 'F5/1.5<G5 D5/.5 C5/2~', 'D5/1 F5/1 G5/2^1', 'A5/1 G5/1 F5/1 D5/1', 'C5/3<D5~ D5/1', 'F5/2 D5/1 C5/1', 'A4/2 C5/1 D5/1', 'C5/4~'];
  const pathArp = [['C4', 'G4', 'C5', 'D5', 'G4', 'C5', 'D5', 'G5'], ['C4', 'G4', 'C5', 'D5', 'G4', 'C5', 'D5', 'G5'], ['F3', 'C4', 'F4', 'G4', 'C4', 'F4', 'A4', 'C5'], ['G3', 'D4', 'G4', 'A4', 'D4', 'G4', 'A4', 'D5'],
    ['A3', 'E4', 'A4', 'C5', 'E4', 'A4', 'C5', 'D5'], ['F3', 'C4', 'F4', 'G4', 'C4', 'F4', 'G4', 'C5'], ['G3', 'D4', 'G4', 'A4', 'D4', 'G4', 'C5', 'D5'], ['C4', 'G4', 'C5', 'D5', 'C5', 'G4', 'D4', 'C4']];
  TRACKS.path = {
    gain: 1.25, bpm: 72, seed: 11,
    gen(b, T) {
      const k = b % 8;
      eighths(T, 'tranh', pathArp[k], 0.38, { bright: 0.45, rev: 0.4, pan: 0.25 });
      if (b >= 2) T.mel('bau', pathBau[k], 0, 0.8, { pan: -0.2 });
      if (k === 0 || k === 4) T.i('mo', 0, 0, 0, 0.55);
      T.i('phach', 2, 0, 0, 0.18);
      if (k % 2 === 0) T.chord('pad', ['C3', 'G3'], 0, 8, 0.7, { att: 1.5, rel: 2, cut: 700 });
      if (k === 6 && T.rnd() < 0.7) T.i('tranh', 3.5, 'Eb5', 0.5, 0.35, { bend: -1, bright: 0.3 }); // a sour "nhấn"
    },
  };

  /* PALACE — goofy court music (G Bắc, 104 bpm) */
  const palSao = ['D5/1 E5/.5 D5/.5 C5/1 A4/1', 'G4/1.5 A4/.5 C5/2', 'E5/1 G5/1 E5/.5 D5/.5 C5/1', 'D5/3~ -/1', 'G5/1 E5/.5 G5/.5 A5/1 G5/1', 'E5/1.5 D5/.5 E5/2', 'C5/1 D5/.5 C5/.5 A4/1 C5/1', 'G4/3~ -/1'];
  const palRoots = [['G2', 'D3'], ['G2', 'D3'], ['C3', 'G3'], ['D3', 'A3'], ['G2', 'D3'], ['E2', 'B2'], ['C3', 'G3'], ['D3', 'A3']];
  TRACKS.palace = {
    bpm: 104, seed: 5,
    gen(b, T) {
      const k = b % 8, [r, fth] = palRoots[k];
      [r, fth, r, fth].forEach((n, i) => T.i('bass', i, n, 0.5, 0.6, { type: 'triangle', cut: 900, cutEnd: 300, q: 2 }));
      [0, 2].forEach((x) => T.i('drum', x, 0, 0, 0.6, { pitch: 150, to: 70, decay: 0.3 }));
      [1, 1.5, 3, 3.5].forEach((x) => T.i('phach', x, 0, 0, x % 1 ? 0.2 : 0.35));
      if (k === 0) T.i('gong', 0, 'G2', 3, 0.5);
      T.mel('sao', palSao[k], 0, 0.9);
      T.chord('tranh', [r.replace('2', '4').replace('3', '4'), fth.replace(/\d/, '4')], 0, 1, 0.3, { bright: 0.6 });
      T.chord('tranh', [fth.replace(/\d/, '4')], 2, 1, 0.25, { bright: 0.6 });
      if (k === 7) ['D5', 'C5', 'A4', 'G4'].forEach((n, i) => T.i('tranh', 2 + i * 0.5, n, 0.5, 0.35));
    },
  };

  /* LOOM — horror (D Nam/oán, 58 bpm) */
  const loomBau = ['A5/3<C6 -/1', 'G5/2>F5 F5/2~', 'D5/3~ -/1', 'C5/2<D5 D5/2>Eb5'];
  TRACKS.loom = {
    gain: 1.25, bpm: 58, seed: 13,
    gen(b, T) {
      const k = b % 4;
      if (k === 0) T.i('drone', 0, 'D1', 16, 0.42, { cut: 200, trem: 4.5, att: 2 });
      // cót ... két (loom creak as percussion)
      T.i('creak', 0, 0, 0, 0.6); T.i('creak', 2.5, 0, 0, 0.45);
      T.i('drum', 3, 0, 0, 0.55, { pitch: 70, to: 40, decay: 0.25, rev: 0 }); T.i('drum', 3.3, 0, 0, 0.4, { pitch: 65, to: 38, decay: 0.25, rev: 0 });
      if (b >= 1) T.mel('bau', loomBau[k], 0, 0.75, { vib: 0.02, vibRate: 4.2 });
      if (T.rnd() < 0.6) T.i('tranh', 1 + Math.floor(T.rnd() * 3), T.rnd() < 0.5 ? 'D6' : 'A5', 1, 0.18, { bright: 0.9, rev: 0.8, bend: T.rnd() < 0.4 ? 1 : 0 });
    },
  };
  // loom creak as an instrument (reuses sfx synthesis on the music bus)
  A.inst.creak = (t, _n, _d, vel = 0.5, o = {}) => {
    const ctx = A.ctx();
    const osc = ctx.createOscillator(); osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, t); osc.frequency.linearRampToValueAtTime(120, t + 0.3); osc.frequency.linearRampToValueAtTime(85, t + 0.55);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 850; bp.Q.value = 10;
    const am = ctx.createOscillator(), amg = ctx.createGain(); am.type = 'square'; am.frequency.setValueAtTime(24, t); am.frequency.linearRampToValueAtTime(40, t + 0.55); amg.gain.value = 0.5;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vel * 0.5, t + 0.05); g.gain.setValueAtTime(vel * 0.5, t + 0.45); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    am.connect(amg); amg.connect(g.gain); osc.connect(bp); bp.connect(g); g.connect(o.bus && o.bus.connect ? o.bus : A.musicBus());
    osc.start(t); am.start(t); osc.stop(t + 0.62); am.stop(t + 0.62);
  };

  /* TEASHOP — warm afternoon (F Bắc, 88 bpm) */
  const teaMel = ['C5/1 D5/.5 C5/.5 Bb4/1 G4/1', 'F4/2 G4/1 Bb4/1', 'C5/1.5 D5/.5 F5/1 D5/1', 'C5/4^2', 'D5/1 F5/1 G5/1 F5/1', 'D5/1.5 C5/.5 Bb4/2', 'G4/1 Bb4/1 C5/1 D5/1', 'F4/4~'];
  const teaCounter = ['', '', '', '', 'Bb4/2 C5/2', 'Bb4/2 G4/2', 'D4/2 F4/2', 'C4/4'];
  TRACKS.teashop = {
    gain: 2.0, bpm: 88, seed: 17,
    gen(b, T) {
      const k = b % 8;
      T.mel('tranh', teaMel[k], 0, 0.75, { bright: 0.55, pan: 0.2 });
      if (teaCounter[k] && b >= 8) T.mel('bau', teaCounter[k], 0, 0.6);
      T.i('drum', 0, 0, 0, 0.45, { pitch: 130, to: 60, decay: 0.35 });
      T.i('mo', 2, 0, 0, 0.3, { pitch: 950 });
      if (k % 2 === 0) T.chord('pad', ['F3', 'C4'], 0, 8, 0.55, { att: 1.2, rel: 1.5, cut: 800 });
      const arp = k % 4 < 2 ? ['F3', 'C4', 'F4', 'C4'] : ['Bb2', 'F3', 'Bb3', 'F3'];
      arp.forEach((n, i) => T.i('tranh', i + 0.5, n, 0.6, 0.22, { bright: 0.35 }));
    },
  };

  /* MENACE — ドドドド (E, 84 bpm); params.intensity 0..1 adds layers */
  TRACKS.menace = {
    bpm: 84, seed: 19,
    gen(b, T) {
      const I = T.p.intensity || 0;
      const roots = ['E1', 'F1', 'F#1', 'G1'];
      const r = I > 0.55 ? roots[b % 4] : 'E1';
      if (b % 2 === 0) T.i('drone', 0, 'E1', 8, 0.5, { cut: 200 + I * 450, trem: 6 + I * 6, att: 1 });
      for (let i = 0; i < 8; i++) T.i('bass', i * 0.5, r, 0.3, i % 2 ? 0.45 : 0.85, { cut: 420 + I * 900, cutEnd: 90, q: 10 });
      if (I > 0.25) { T.i('drum', 0, 0, 0, 0.9, { pitch: 60, to: 34, decay: 0.3, rev: 0 }); T.i('drum', 0.35, 0, 0, 0.7, { pitch: 58, to: 33, decay: 0.3, rev: 0 }); }
      if (I > 0.45) T.i('drum', 2, 0, 0, 1, { pitch: 100, to: 30, decay: 0.9 });
      if (I > 0.7) for (let i = 0; i < 16; i++) T.i('tranh', i * 0.25, i % 2 ? 'B5' : 'E6', 0.25, 0.15 + I * 0.1, { bright: 0.9, rev: 0.3 });
      if (I > 0.9 && b % 2 === 0) T.i('stab', 0, 'E3', 0.8, 0.7);
    },
  };

  /* BATTLE — the rush (E phrygian pentatonic, 168 bpm) */
  const batLead = ['E5/.25 F5/.25 G5/.5 B5/.5 A5/.5 G5/.5 F5/.5 E5/1', 'G5/.5 A5/.5 B5/.5 C6/.5 B5/1 G5/1', 'E6/.5 D6/.5 B5/.5 A5/.5 G5/.5 A5/.5 B5/1', 'F5/.5 E5/.5 D5/.5 E5/.5 E5/2^1'];
  const batBass = ['E2', 'E2', 'E3', 'E2', 'G2', 'E2', 'A2', 'B2', 'E2', 'E2', 'E3', 'E2', 'F2', 'E2', 'D2', 'B1'];
  TRACKS.battle = {
    bpm: 168, seed: 23,
    gen(b, T) {
      const k = b % 4;
      batBass.forEach((n, i) => T.i('bass', i * 0.25, n, 0.24, i % 4 === 0 ? 0.9 : 0.6, { cut: 2200, cutEnd: 250, q: 6 }));
      for (let i = 0; i < 4; i++) T.i('drum', i, 0, 0, 0.95, { pitch: 130, to: 42, decay: 0.25 });
      [1, 3].forEach((x) => T.i('snare', x, 0, 0, 0.75));
      for (let i = 0; i < 16; i++) T.i('hat', i * 0.25, 0, 0, i % 2 ? 0.25 : 0.4);
      T.mel('tranh', batLead[k], 0, 0.85, { bright: 0.8, rev: 0.15 });
      if (k % 2 === 0) T.i('stab', 0, k ? 'G3' : 'E3', 0.4, 0.7);
      if (k === 3) [2, 2.5, 3, 3.5].forEach((x, i) => T.i('drum', x, 0, 0, 0.8, { pitch: 240 - i * 35, to: 80, decay: 0.2 }));
    },
  };

  /* VOID — the space between retellings (A minor, 56 bpm) */
  const voidCh = [['A2', 'E3', 'B3', 'C4'], ['F2', 'C3', 'E3', 'A3'], ['C3', 'G3', 'E4', 'D4'], ['G2', 'D3', 'B3', 'A3']];
  const voidBau = ['E5/2 D5/2', 'C5/4~', 'G5/2<A5 E5/2', 'D5/4~'];
  TRACKS.void = {
    gain: 1.2, bpm: 56, seed: 29,
    gen(b, T) {
      const k = b % 4;
      T.chord('pad', voidCh[k], 0, 4, 0.8, { att: 1.8, rel: 2.5, cut: 1100, type: 'triangle' });
      if (b >= 1) T.mel('bau', voidBau[k], 0, 0.55, { vib: 0.016 });
      if (T.rnd() < 0.8) T.i('chime', T.rnd() * 3, ['A6', 'E6', 'C7', 'B6'][Math.floor(T.rnd() * 4)], 2, 0.25);
      if (k === 0) T.i('gong', 0, 'A1', 5, 0.35);
    },
  };

  /* TRUTH — Tấm's confession (A oán-ish, 64 bpm) */
  const truthBau = ['E5/2 D5/1 C5/1', 'D5/3^1 -/1', 'C5/1 A4/1 G4/1 A4/1', 'A4/4~', 'G5/2<A5 E5/1 D5/1', 'E5/3~ -/1', 'D5/1 C5/1 A4/1 C5/1', 'A4/4~'];
  const truthArp = [['A2', 'E3', 'A3', 'C4'], ['F2', 'C3', 'F3', 'A3'], ['C3', 'G3', 'C4', 'E4'], ['E2', 'B2', 'E3', 'G#3']];
  TRACKS.truth = {
    gain: 1.4, bpm: 64, seed: 31,
    gen(b, T) {
      const k = b % 8, arp = truthArp[k % 4];
      [...arp, ...arp.slice().reverse()].forEach((n, i) => T.i('tranh', i * 0.5, n, 1, 0.3 * (i % 4 === 0 ? 1.2 : 0.9), { bright: 0.35, rev: 0.5 }));
      if (b >= 2) T.mel('bau', truthBau[k], 0, 0.8);
      if (k === 0) T.i('pad', 0, 'A2', 16, 0.5, { att: 3, rel: 3, cut: 600, type: 'triangle' });
    },
  };

  /* ENDING — once upon a now (C major pentatonic, 80 bpm) */
  const endMel = ['E5/1 G5/1 A5/2', 'G5/1 E5/1 D5/2', 'C5/1 D5/1 E5/1 G5/1', 'A5/3~ G5/1', 'C6/2 A5/1 G5/1', 'E5/2 D5/1 C5/1', 'D5/1 E5/1 G5/1 E5/1', 'C5/4~'];
  const endCh = [['C3', 'G3', 'E4'], ['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['G2', 'D3', 'B3']];
  TRACKS.ending = {
    gain: 1.3, bpm: 80, seed: 37,
    gen(b, T) {
      const k = b % 8, ch = endCh[k % 4];
      T.chord('pad', ch, 0, 4, 0.6, { att: 0.8, rel: 1.4, cut: 1300, type: 'triangle' });
      [ch[0], ch[1], ch[2], ch[1], ch[2], oct(ch[1]), ch[2], ch[1]].forEach((n, i) => T.i('tranh', i * 0.5, n, 0.9, 0.28, { bright: 0.5 }));
      if (b >= 1) T.mel('sao', endMel[k], 0, 0.85);
      if (b >= 9) T.mel('bau', endMel[k].replace(/(\d)(?=\/)/g, (d) => String(+d - 1)), 0, 0.45);
      T.i('drum', 0, 0, 0, 0.35, { pitch: 110, to: 55, decay: 0.5 });
      if (k === 0) T.i('gong', 0, 'C3', 4, 0.3);
    },
  };

  /* RUN — nigerundayo chase (C, 176 bpm) */
  const runMel = ['C5/.5 D5/.5 E5/.5 G5/.5 A5/.5 G5/.5 E5/.5 D5/.5', 'C5/.5 A4/.5 G4/.5 A4/.5 C5/2', 'F5/.5 G5/.5 A5/.5 C6/.5 A5/.5 G5/.5 F5/.5 D5/.5', 'C5/.5 D5/.5 C5/.5 A4/.5 G4/2'];
  TRACKS.run = {
    bpm: 176, seed: 41,
    gen(b, T) {
      const k = b % 4, r = k === 2 ? ['F2', 'C3'] : ['C2', 'G2'];
      for (let i = 0; i < 4; i++) { T.i('bass', i, r[0], 0.45, 0.8, { type: 'square', cut: 1200, cutEnd: 300, q: 3 }); T.i('bass', i + 0.5, r[1], 0.4, 0.6, { type: 'square', cut: 1200, cutEnd: 300, q: 3 }); }
      [1, 3].forEach((x) => T.i('snare', x, 0, 0, 0.6));
      [0, 2].forEach((x) => T.i('drum', x, 0, 0, 0.7, { pitch: 140, to: 50, decay: 0.2 }));
      T.mel('tranh', runMel[k], 0, 0.8, { bright: 0.75 });
      if (k === 3) T.i('mo', 3.5, 0, 0, 0.6);
    },
  };

  /* CANON — solemn but silly (A, 60 bpm) */
  const canonMel = ['A3/2 G3/1 E3/1', 'D3/4~', 'E3/1 G3/1 A3/1 C4/1', 'A3/4~'];
  TRACKS.canon = {
    bpm: 60, seed: 43,
    gen(b, T) {
      const k = b % 4;
      T.i('gong', 0, 'A2', 3, 0.5);
      T.mel('bau', canonMel[k], 0, 0.9);
      T.chord('pad', k % 2 ? ['D3', 'F3', 'A3'] : ['A2', 'C3', 'E3'], 0, 4, 0.6, { att: 1, rel: 1.5, cut: 700 });
      T.i('mo', 2, 0, 0, 0.3, { pitch: 600 });
    },
  };

  /* VILLAIN — hollow victory (C minor, 70 bpm) */
  const vilCh = [['C3', 'Eb3', 'G3'], ['Ab2', 'C3', 'Eb3'], ['F2', 'Ab2', 'C3'], ['G2', 'B2', 'D3']];
  TRACKS.villain = {
    bpm: 70, seed: 47,
    gen(b, T) {
      const k = b % 4;
      T.chord('pad', vilCh[k], 0, 4, 0.9, { att: 0.4, rel: 1.6, cut: 1600, type: 'square' });
      T.mel('bau', ['G5/2<Ab5 Eb5/2', 'C5/3~ -/1', 'F5/1 Eb5/1 C5/2', 'D5/4>B4'][k], 0, 0.6);
      T.i('drum', 0, 0, 0, 0.6, { pitch: 80, to: 30, decay: 1 });
    },
  };

  /* SILENCE with just wind (for dramatic beats) */
  TRACKS.wind = {
    bpm: 60, seed: 53,
    gen(b, T) { T.i('drone', 0, 'C2', 4, 0.5, { cut: 150, sweep: 260, trem: 0.3, att: 1.5 }); },
  };

  // expose bus for tracks
  A.musicBus = function () { return A._musicBus; };
})();
