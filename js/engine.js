/* engine.js — story runtime: the scripting API used by story.js */
(function () {
  'use strict';
  const TC = window.TC, U = TC.util, UI = TC.ui, FX = TC.fx, G = TC.gfx;
  const $ = (id) => document.getElementById(id);
  const E = (TC.engine = {});
  TC.voices = TC.voices || {};

  const freshState = () => ({ flags: {}, voices: [], chapter: null, auto: false, skip: false, ctrlSkip: false, paused: false, kind: 0, seen: {} });
  TC.state = freshState();

  /* ======================================================= lines */
  function autoDelay(text) {
    const n = TC.t(text).length;
    const base = [700, 1300, 2100][TC.persist.data.settings.autoDelay] || 1300;
    return base + n * 38;
  }
  async function line(who, text, o = {}) {
    TC.guard();
    const run = TC.run;
    let typingDone = false, resolveAdv;
    const advP = new Promise((r) => (resolveAdv = r));
    const offAdv = TC.input.on('advance', () => {
      if (TC.input.locked || TC.state.paused) return;
      if (!typingDone) { UI.finishTyping(); return; }
      resolveAdv('adv');
    });
    const offAbort = TC.input.on('abort', () => resolveAdv('abort'));
    try {
      await UI.say(who, text, o);
    } catch (e) { offAdv(); offAbort(); throw e; }
    typingDone = true;
    const t0 = performance.now(), need = o.auto != null ? o.auto : autoDelay(text);
    const poll = setInterval(() => {
      if (TC.state.paused) return;
      if (TC.fastForward() && performance.now() - t0 > 45) resolveAdv('ff');
      else if ((TC.state.auto || o.auto != null) && performance.now() - t0 > need) resolveAdv('auto');
    }, 40);
    const r = await advP;
    clearInterval(poll); offAdv(); offAbort();
    if (r === 'abort' || run.aborted) throw TC.ABORT;
  }

  /* ======================================================= backgrounds */
  let curBg = null;
  async function bg(id, o = {}) {
    TC.guard();
    const tr = o.tr || 'fade', ms = TC.fastForward() ? 1 : o.ms || 650;
    const fn = TC.art.bg[id];
    if (!fn) { console.warn('no bg', id); return; }
    const c = await G.canvas('bg:' + id, fn, 1920, 1080);
    const layer = $('bg');
    const d = U.el('div', { class: 'scene', 'data-id': id });
    d.appendChild(c);
    if (o.cls) d.classList.add(o.cls);
    const old = U.$$('.scene', layer);
    if (tr === 'black') {
      if (!FX.isBlack()) await FX.fadeTo('#140b16', ms / 2);
      old.forEach((e) => e.remove());
      layer.appendChild(d);
      await FX.fadeIn(ms / 2);
    } else if (tr === 'cut' || !old.length) {
      old.forEach((e) => e.remove());
      layer.appendChild(d);
    } else if (tr === 'wipe') {
      d.style.clipPath = 'polygon(0 0,0 0,0 100%,0 100%)';
      layer.appendChild(d);
      TC.audio.sfx('whoosh');
      await U.tween(ms, (t) => { const x = t * 130; d.style.clipPath = `polygon(0 0,${x}% 0,${x - 30}% 100%,0 100%)`; });
      d.style.clipPath = '';
      old.forEach((e) => e.remove());
    } else if (tr === 'flash') {
      FX.flash('#fff', ms);
      old.forEach((e) => e.remove());
      layer.appendChild(d);
    } else {
      d.style.opacity = 0;
      layer.appendChild(d);
      await d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, fill: 'forwards' }).finished;
      d.style.opacity = 1;
      old.forEach((e) => e.remove());
    }
    curBg = id;
    TC.guard();
  }

  /* ======================================================= actors */
  const actors = new Map(); // id -> {el, o}
  const vbCache = {};
  function artSize(key, svgFn) {
    if (vbCache[key]) return vbCache[key];
    const s = svgFn();
    const m = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(s);
    return (vbCache[key] = m ? [+m[1], +m[2]] : [600, 800]);
  }
  function artFn(id, variant) {
    const f = TC.art.ch[id] || TC.art.prop[id];
    if (!f) throw new Error('no art ' + id);
    return () => f(variant);
  }
  async function makeActorCanvas(id, variant, w) {
    const key = `a:${id}:${variant || ''}`;
    const fn = artFn(id, variant);
    const [vw, vh] = artSize(key, fn);
    const h = (w * vh) / vw;
    const c = await G.canvas(key, fn, w, h);
    return { c, h };
  }
  // o: {x, y (top-left in stage px), w, variant, z, anim, idle, flip, rot, op, anchor:'bottom'|'center'}
  async function show(id, o = {}) {
    TC.guard();
    const name = o.as || id;
    const w = o.w || 600;
    const { c, h } = await makeActorCanvas(id, o.variant, w);
    let a = actors.get(name);
    const el = U.el('div', { class: 'actor', 'data-id': name });
    const x = o.x != null ? o.x : 960 - w / 2;
    let y = o.y != null ? o.y : 1080 - h;
    if (o.anchor === 'bottom' && o.y != null) y = o.y - h;
    if (o.anchor === 'center' && o.y != null) y = o.y - h / 2;
    Object.assign(el.style, { position: 'absolute', left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', zIndex: o.z || 1, transformOrigin: o.origin || '50% 100%' });
    const inner = U.el('div', { class: 'actor-in' + (o.idle ? ' anim-' + o.idle : '') });
    Object.assign(inner.style, { position: 'absolute', inset: 0, transformOrigin: '50% 100%' });
    if (o.flip) c.style.transform = 'scaleX(-1)';
    inner.appendChild(c);
    el.appendChild(inner);
    if (o.rot) el.style.rotate = o.rot + 'deg';
    if (o.filter) el.style.filter = o.filter;
    $('actors').appendChild(el);
    if (a) a.el.remove();
    a = { el, o: Object.assign({}, o, { x, y, w, h }), variant: o.variant };
    actors.set(name, a);
    const ms = TC.fastForward() ? 1 : o.ms || 450;
    const anim = o.anim || 'fade';
    const K = {
      fade: [{ opacity: 0 }, { opacity: o.op != null ? o.op : 1 }],
      up: [{ opacity: 0, transform: 'translateY(80px)' }, { opacity: 1, transform: 'none' }],
      down: [{ opacity: 0, transform: 'translateY(-80px)' }, { opacity: 1, transform: 'none' }],
      left: [{ opacity: 0, transform: 'translateX(-160px)' }, { opacity: 1, transform: 'none' }],
      right: [{ opacity: 0, transform: 'translateX(160px)' }, { opacity: 1, transform: 'none' }],
      pop: [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.06)', offset: 0.7 }, { opacity: 1, transform: 'scale(1)' }],
      drop: [{ opacity: 1, transform: 'translateY(-1200px)' }, { opacity: 1, transform: 'translateY(0)', offset: 0.75 }, { opacity: 1, transform: 'translateY(-30px)', offset: 0.87 }, { opacity: 1, transform: 'translateY(0)' }],
      slam: [{ opacity: 0, transform: 'scale(1.6)' }, { opacity: 1, transform: 'scale(.97)', offset: 0.6 }, { opacity: 1, transform: 'scale(1)' }],
      none: [{ opacity: o.op != null ? o.op : 1 }, { opacity: o.op != null ? o.op : 1 }],
    };
    const anm = el.animate(K[anim] || K.fade, { duration: ms, easing: anim === 'drop' ? 'cubic-bezier(.5,0,.8,.4)' : 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
    if (o.wait) await anm.finished;
    return el;
  }
  async function hide(id, o = {}) {
    const a = actors.get(id);
    if (!a) return;
    actors.delete(id);
    const ms = TC.fastForward() ? 1 : o.ms || 350;
    const K = {
      fade: [{ opacity: 1 }, { opacity: 0 }],
      down: [{ transform: 'none', opacity: 1 }, { transform: 'translateY(120px)', opacity: 0 }],
      up: [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-200px)', opacity: 0 }],
      left: [{ transform: 'none', opacity: 1 }, { transform: 'translateX(-300px)', opacity: 0 }],
      right: [{ transform: 'none', opacity: 1 }, { transform: 'translateX(300px)', opacity: 0 }],
      pop: [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.4)', opacity: 0 }],
    };
    const anm = a.el.animate(K[o.anim || 'fade'] || K.fade, { duration: ms, fill: 'forwards' });
    const done = anm.finished.then(() => a.el.remove());
    if (o.wait) await done;
  }
  async function swap(id, variant, o = {}) {
    const a = actors.get(id);
    if (!a) return;
    const { c } = await makeActorCanvas(id, variant, a.o.w);
    if (a.o.flip) c.style.transform = 'scaleX(-1)';
    const inner = a.el.querySelector('.actor-in');
    const old = inner.querySelector('canvas');
    c.style.position = 'absolute'; c.style.left = '0'; c.style.top = '0';
    inner.appendChild(c);
    a.variant = variant;
    if (o.ms === 0 || TC.fastForward()) { old && old.remove(); return; }
    c.animate([{ opacity: 0 }, { opacity: 1 }], { duration: o.ms || 160, fill: 'forwards' }).finished.then(() => old && old.remove());
  }
  // tween actor: {x,y,w(scale via transform),rot,op}
  function move(id, to = {}, ms = 600, easing = 'cubic-bezier(.45,0,.2,1)') {
    const a = actors.get(id);
    if (!a) return Promise.resolve();
    const el = a.el;
    const dx = (to.x != null ? to.x : a.o.x) - a.o.x, dy = (to.y != null ? to.y : a.o.y) - a.o.y;
    const sc = to.scale != null ? to.scale : a.o.scale || 1;
    const rot = to.rot != null ? to.rot : a.o.rot || 0;
    const op = to.op != null ? to.op : 1;
    const from = el.style.transform || 'none';
    const tf = `translate(${dx}px,${dy}px) scale(${sc}) rotate(${rot}deg)`;
    a.o.scale = sc; a.o.rot = rot;
    a._dx = dx; a._dy = dy;
    const anm = el.animate([{ transform: from, opacity: getComputedStyle(el).opacity }, { transform: tf, opacity: op }], { duration: TC.fastForward() ? 1 : ms, easing, fill: 'forwards' });
    el.style.transform = tf;
    return anm.finished.catch(() => { });
  }
  function actor(id) { const a = actors.get(id); return a ? a.el : null; }
  function clearActors() { actors.forEach((a) => a.el.remove()); actors.clear(); }

  /* ======================================================= flags & voices */
  const flag = (k, v = true) => { TC.state.flags[k] = v; };
  const has = (k) => !!TC.state.flags[k];
  const get = (k) => TC.state.flags[k];
  const inc = (k, n = 1) => { TC.state.flags[k] = (TC.state.flags[k] || 0) + n; };
  const hasVoice = (id) => TC.state.voices.includes(id);
  async function gainVoice(id) {
    if (hasVoice(id)) return;
    TC.state.voices.push(id);
    UI.hideBox();
    await FX.voiceCard(TC.voices[id]);
    UI.voicesBar(TC.state.voices, id);
  }
  // choose a new voice from preference list, skipping owned ones
  function pickVoice(prefs) {
    for (const v of prefs) if (!hasVoice(v)) return v;
    return null;
  }

  /* ======================================================= choices */
  async function choice(opts) {
    TC.guard();
    const list = opts.filter((o) => (o.voice ? hasVoice(o.voice) : true) && (o.cond ? o.cond() : true));
    UI.hideBox();
    const id = await UI.choose(list);
    TC.guard();
    return id;
  }

  /* ======================================================= misc */
  const music = (id, f) => TC.music.play(id, f);
  const stopMusic = (f) => TC.music.stop(f);
  const sfx = (n, d) => TC.audio.sfx(n, d);
  const wait = (ms) => TC.wait(ms);

  const CH_ART = {
    ch1: [['a:areca:tam', 'areca', 'tam'], ['a:areca:empty', 'areca', 'empty'], ['a:axe:', 'axe'], ['a:tam_fall:', 'tam_fall'], ['a:mom:', 'mom']],
    ch2: [['a:bird:', 'bird'], ['a:king:', 'king'], ['a:but:', 'but'], ['a:potsmall:', 'potsmall']],
    ch3: [['a:loom:calm', 'loom', 'calm'], ['a:loom:eyes', 'loom', 'eyes'], ['a:loom:soft', 'loom', 'soft']],
    ch4: [['a:fruit:', 'fruit'], ['a:oldwoman:', 'oldwoman'], ['a:tam_dio:', 'tam_dio'], ['p:betel', null]],
    ch5: [['a:tam_back:', 'tam_back'], ['a:cam_walk:', 'cam_walk'], ['a:cam_walk:run', 'cam_walk', 'run'], ['a:stand_tam:', 'stand_tam'], ['a:stand_cam:', 'stand_cam'], ['a:bathpot:', 'bathpot'], ['a:throne:', 'throne'], ['a:book:0', 'book', '0'], ['a:page47:', 'page47'], ['a:but:', 'but']],
  };
  function warmChapter(id) {
    const list = (CH_ART[id] || []).map(([key, art, v]) => [key, art ? artFn(art, v) : TC.art.panel.betel]);
    G.preloadIdle(list, 60);
  }
  async function chapter(id, num, title, sub) {
    warmChapter(id);
    TC.state.chapter = id;
    TC.persist.data.checkpoint = { chapter: id, flags: JSON.parse(JSON.stringify(TC.state.flags)), voices: TC.state.voices.slice() };
    TC.persist.save();
    UI.hideBox();
    await FX.chapterCard(TC.t(num), TC.t(title), sub ? TC.t(sub) : '');
  }

  async function tbc() { UI.hideBox(); await FX.tbc(); clearActors(); FX.resetAll(); $('bg').innerHTML = ''; }

  /* ======================================================= HUD/shortcuts */
  E.bindHud = function () {
    $('hud').addEventListener('click', (e) => {
      const b = e.target.closest('.hud-btn'); if (!b) return;
      TC.audio.sfx('click');
      const a = b.dataset.act;
      if (a === 'auto') { TC.state.auto = !TC.state.auto; TC.state.skip = false; }
      if (a === 'skip') { TC.state.skip = !TC.state.skip; TC.state.auto = false; if (TC.state.skip) { UI.finishTyping(); TC.input.emit('advance'); } }
      if (a === 'log') UI.openLog();
      if (a === 'menu') UI.openPause();
      UI.syncHud();
    });
    TC.input.on('key', (e) => {
      if (!TC.main || !TC.main.inGame) return;
      const k = e.key.toLowerCase();
      if (e.key === 'Escape') { if (UI.modalOpen()) UI.closeModal(); else UI.openPause(); return; }
      if (TC.input.locked) return;
      if (k === 'a') { TC.state.auto = !TC.state.auto; TC.state.skip = false; UI.syncHud(); }
      else if (k === 's') { TC.state.skip = !TC.state.skip; TC.state.auto = false; UI.syncHud(); if (TC.state.skip) TC.input.emit('advance'); }
      else if (k === 'l') UI.openLog();
      else if (k === 'f') TC.toggleFullscreen();
      else if (k === 'h') $('ui').classList.toggle('hidden');
    });
    TC.input.on('wheel', (dy) => { if (TC.main && TC.main.inGame && !TC.input.locked && dy < -30) UI.openLog(); });
    TC.input.on('rightclick', () => { if (TC.main && TC.main.inGame && !TC.input.locked) UI.openPause(); });
  };

  /* ======================================================= running chapters */
  E.reset = function (keepVoices) {
    FX.resetAll();
    clearActors();
    $('bg').innerHTML = '';
    UI.reset();
    TC.state = Object.assign(freshState(), keepVoices ? { flags: keepVoices.flags, voices: keepVoices.voices } : {});
  };
  E.run = async function (startChapter, restore) {
    const run = TC.newRun();
    E.reset(restore);
    if (restore) UI.voicesBar(TC.state.voices);
    let next = startChapter;
    try {
      while (next) {
        const fn = TC.story.chapters[next];
        if (!fn) throw new Error('missing chapter ' + next);
        next = await fn();
        TC.guard(run);
      }
    } catch (e) {
      if (e !== TC.ABORT) { console.error(e); UI.toast(TC.L('Something broke — returning to title.', 'Có lỗi — quay về màn hình chính.')); TC.main.toTitle(); }
    }
  };

  // exported scripting API (story.js destructures this)
  TC.api = {
    L: TC.L, t: TC.t,
    N: (text, o) => line('narrator', text, o),
    say: (who, text, o) => line(who, text, o),
    me: (text, o) => line('cam', text, o),
    V: async (id, text, o) => { if (hasVoice(id)) await line(id, text, o); },
    choice, bg, show, hide, swap, move, actor, clearActors,
    flag, has, get, inc, hasVoice, gainVoice, pickVoice,
    music, stopMusic, sfx, wait, chapter, tbc,
    fx: FX, ui: UI,
    curBg: () => curBg,
  };
})();
