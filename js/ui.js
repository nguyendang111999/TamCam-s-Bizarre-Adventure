/* ui.js — dialogue box, typewriter, choices, voices bar, HUD, menus (pause, settings, log, endings) */
(function () {
  'use strict';
  const TC = window.TC, U = TC.util, K = TC.ink;
  const UI = (TC.ui = {});
  const $ = (id) => document.getElementById(id);
  const INK = '#140b16';
  const BW = 1580, BH = 236;

  /* ======================================================= box frames */
  function frameSVG(style, o = {}) {
    const w = BW + 60, h = BH + 60, x0 = 30, y0 = 30, x1 = 30 + BW, y1 = 30 + BH;
    let d = '', fill = '#fff', extra = '';
    if (style === 'caption') {
      fill = '#fbf3dc';
      d = `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
      extra = `<rect x="${x0 + 12}" y="${y0 + 12}" width="${BW - 24}" height="${BH - 24}" fill="none" stroke="#8a6a44" stroke-width="2.5"/>`
        + `<path d="M${x0 + 24} ${y1 - 12}l18 -18M${x1 - 24} ${y0 + 12}l-18 18" stroke="#8a6a44" stroke-width="3"/>`;
    } else if (style === 'thought') {
      fill = o.tint || '#f3ecff';
      // scalloped cloud border
      const pts = [], step = 70;
      const edge = (ax, ay, bx, by) => { const L = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.round(L / step)); for (let i = 0; i < n; i++) pts.push([ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n]); };
      edge(x0, y0, x1, y0); edge(x1, y0, x1, y1); edge(x1, y1, x0, y1); edge(x0, y1, x0, y0);
      d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
        const nx = -(b[1] - a[1]), ny = b[0] - a[0], nl = Math.hypot(nx, ny) || 1;
        d += `Q${K.r1(mx - (nx / nl) * 22)} ${K.r1(my - (ny / nl) * 22)} ${K.r1(b[0])} ${K.r1(b[1])}`;
      }
      d += 'Z';
    } else if (style === 'shout') {
      const pts = [], rnd = U.rng(o.seed || 5);
      const edge = (ax, ay, bx, by, ox, oy) => { const L = Math.hypot(bx - ax, by - ay), n = Math.max(2, Math.round(L / 60)); for (let i = 0; i < n; i++) { const t = i / n; const spike = i % 2 ? 0 : 20 + rnd() * 26; pts.push([ax + (bx - ax) * t + ox * spike, ay + (by - ay) * t + oy * spike]); } };
      edge(x0, y0, x1, y0, 0, -1); edge(x1, y0, x1, y1, 1, 0); edge(x1, y1, x0, y1, 0, 1); edge(x0, y1, x0, y0, -1, 0);
      d = K.poly(pts);
    } else {
      // speech: rounded rect with the tail cut into the top edge as one outline (no seam to patch)
      const r = 46;
      d = `M${x0 + r} ${y0}`;
      if (o.tail != null) {
        const tx = U.clamp(o.tail - 170 + 30, x0 + r + 34, x1 - r - 30), tip = [U.clamp(o.tail - 170 + 30 + (o.tailDx || 0), 20, w - 20), y0 - (o.tailH || 70)];
        d += `H${tx - 34}L${tip[0]} ${tip[1]}L${tx + 30} ${y0}`;
      }
      d += `H${x1 - r}Q${x1} ${y0} ${x1} ${y0 + r}V${y1 - r}Q${x1} ${y1} ${x1 - r} ${y1}H${x0 + r}Q${x0} ${y1} ${x0} ${y1 - r}V${y0 + r}Q${x0} ${y0} ${x0 + r} ${y0}Z`;
    }
    const shadow = `<path d="${d}" fill="${INK}" transform="translate(12 12)" opacity=".92"/>`;
    const body = `<path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>`;
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${shadow}${body}${extra}</svg>`;
  }

  /* ======================================================= markup → spans */
  function renderMarkup(str) {
    // returns {html, count} where each visible char is a span.ch
    let html = '', count = 0;
    const stack = [];
    let i = 0;
    const open = (cls, style = '') => { html += `<span class="${cls}"${style ? ` style="${style}"` : ''}>`; stack.push('span'); };
    while (i < str.length) {
      const c = str[i];
      if (c === '{') {
        const j = str.indexOf('}', i);
        const tag = str.slice(i + 1, j);
        i = j + 1;
        if (tag[0] === '/') { if (stack.length) { html += '</span>'; stack.pop(); } continue; }
        if (tag === 'shake') open('tx-shake-g');
        else if (tag === 'wave') open('tx-wave-g');
        else if (tag === 'big') open('tx-big');
        else if (tag === 'jp') open('tx-jp');
        else if (tag.startsWith('c=')) open('tx-c', `color:${tag.slice(2)}`);
        else if (tag.startsWith('p=')) { html += `<span class="pz" data-p="${tag.slice(2)}"></span>`; }
        continue;
      }
      if (c === '*') {
        if (stack[stack.length - 1] === 'em') { html += '</span>'; stack.pop(); } else { html += '<span class="tx-em">'; stack.push('em'); }
        i++; continue;
      }
      if (c === '|') { html += '<span class="pz" data-p="380"></span>'; i++; continue; }
      const ch = U.esc(c);
      const inShake = stack.length && html.lastIndexOf('tx-shake-g') > html.lastIndexOf('</span>') ; // approximate
      html += `<span class="ch">${c === ' ' ? ' ' : ch}</span>`;
      count++;
      i++;
    }
    while (stack.length) { html += '</span>'; stack.pop(); }
    return { html, count };
  }

  /* ======================================================= speakers */
  const SPK = (UI.speakers = {
    narrator: { style: 'caption', blip: 'narrator' },
    cam: { name: TC.L('CÁM'), color: '#b79cff', blip: 'cam', tail: 1500 },
    tam: { name: TC.L('TẤM'), color: '#f7c325', blip: 'tam' },
    but: { name: TC.L('BỤT'), color: '#9ee7ff', blip: 'but' },
    mom: { name: TC.L('MOM', 'MẸ'), color: '#ff5a4d', blip: 'mom' },
    king: { name: TC.L('THE KING', 'NHÀ VUA'), color: '#ffcf33', blip: 'king' },
    oldwoman: { name: TC.L('OLD WOMAN', 'BÀ LÃO'), color: '#c8e07a', blip: 'oldwoman' },
    bird: { name: TC.L('THE ORIOLE', 'CHIM VÀNG ANH'), color: '#f7c325', blip: 'bird' },
    loom: { name: TC.L('THE LOOM', 'KHUNG CỬI'), color: '#ff6b6b', blip: 'loom' },
    fruit: { name: TC.L('THE FRUIT', 'QUẢ THỊ'), color: '#ffb640', blip: 'fruit' },
    crow: { name: TC.L('A CROW', 'CON QUẠ'), color: '#cccccc', blip: 'crow' },
    both: { name: TC.L('TẤM & CÁM'), color: '#ff6fa8', blip: 'tam' },
  });

  /* ======================================================= box API */
  let typing = null; // {finish()}
  UI.boxShown = false;
  UI.showBox = function (on) {
    const b = $('box');
    if (on && !UI.boxShown) { b.classList.remove('hidden'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    if (!on) b.classList.add('hidden');
    UI.boxShown = on;
  };
  UI.hideBox = () => UI.showBox(false);

  // line: {who, text(L), style?, tail?}
  UI.say = function (who, text, o = {}) {
    const run = TC.run;
    const sp = SPK[who] || (TC.voices && TC.voices[who] ? voiceSpeaker(who) : SPK.narrator);
    const style = o.style || sp.style || 'speech';
    const box = $('box');
    box.className = style === 'caption' ? 'narrator' : style === 'thought' ? 'voice' : style === 'shout' ? 'shout' : '';
    const tail = o.tail != null ? o.tail : sp.tail;
    $('box-frame').innerHTML = frameSVG(style === 'caption' ? 'caption' : style, { tail, tint: sp.tint, seed: (Math.random() * 99) | 0, tailDx: o.tailDx, tailH: o.tailH });
    const tag = $('nametag');
    if (style === 'caption' && !o.name) { tag.className = 'none'; }
    else {
      tag.className = '';
      tag.style.background = '#000';
      tag.style.color = sp.color || '#fff';
      tag.innerHTML = (sp.icon ? `<i>${sp.icon}</i>` : '') + `<span>${U.esc(TC.t(o.name || sp.name || ''))}</span>`;
    }
    UI.showBox(true);
    // voices bar highlight
    UI.voiceTalk(TC.voices && TC.voices[who] ? who : null);
    const raw = TC.t(text);
    const { html } = renderMarkup(raw);
    const tx = $('text');
    tx.innerHTML = html;
    // group effects on visible chars
    U.$$('.tx-shake-g .ch', tx).forEach((c) => c.classList.add('tx-shake'));
    U.$$('.tx-wave-g .ch', tx).forEach((c, i) => { c.classList.add('tx-wave'); c.style.animationDelay = (i * 0.06) + 's'; });
    const chars = U.$$('.ch, .pz', tx);
    $('next').classList.remove('on');
    TC.audio.resetBlip();
    UI.logPush(who, text, style);
    const speeds = [22, 40, 70, 1e9];
    const cps = speeds[TC.persist.data.settings.textSpeed] || 40;
    return new Promise((resolve, reject) => {
      let i = 0, done = false, timer = null;
      const finish = () => {
        if (done) return;
        done = true; clearTimeout(timer);
        chars.forEach((c) => c.classList.add('on'));
        $('next').classList.add('on');
        typing = null;
        resolve();
      };
      typing = { finish };
      if (TC.fastForward() || cps > 1e6) { finish(); return; }
      const step = () => {
        if (run.aborted) { reject(TC.ABORT); return; }
        if (done) return;
        let delay = 1000 / cps;
        while (i < chars.length) {
          const c = chars[i++];
          if (c.classList.contains('pz')) { delay = +c.dataset.p; break; }
          c.classList.add('on');
          const ch = c.textContent;
          TC.audio.blip(sp.blip || who, ch);
          if ('.!?…'.includes(ch)) delay += 170; else if (',;:—'.includes(ch)) delay += 70;
          break;
        }
        if (i >= chars.length) { finish(); return; }
        timer = setTimeout(step, delay);
      };
      step();
    });
  };
  UI.isTyping = () => !!typing;
  UI.finishTyping = () => { if (typing) typing.finish(); };

  function voiceSpeaker(id) {
    const v = TC.voices[id];
    return { name: v.name, color: v.color, blip: id, style: 'thought', tint: v.tint, icon: v.glyph };
  }

  /* ======================================================= choices */
  UI.choose = function (opts) {
    const run = TC.run;
    UI._opts = opts;
    const box = $('choices');
    box.innerHTML = '';
    TC.audio.sfx('choiceIn');
    let sel = -1;
    const els = opts.map((o, i) => {
      const vid = o.voice || o.tag, v = vid && TC.voices[vid];
      const e = U.el('button', { class: 'choice' });
      e.style.animationDelay = i * 0.06 + 's';
      e.innerHTML = `<span class="num">${i + 1}</span>` + (v ? `<span class="vt" style="background:${v.color}">${U.esc(TC.t(v.short))}</span>` : '') + `<span class="lbl">${U.esc(TC.t(o.text))}</span>`;
      e.addEventListener('mouseenter', () => { mark(i); TC.audio.sfx('hover'); });
      e.addEventListener('click', (ev) => { ev.stopPropagation(); pick(i); });
      e._pick = () => pick(i);
      box.appendChild(e);
      return e;
    });
    let resolveFn, rejectFn;
    const mark = (i) => { sel = i; els.forEach((e, k) => e.classList.toggle('sel', k === i)); };
    const onKey = (e) => {
      if (TC.input.locked) return;
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= els.length) pick(n - 1);
      else if (e.key === 'ArrowDown') mark((sel + 1) % els.length);
      else if (e.key === 'ArrowUp') mark((sel - 1 + els.length) % els.length);
      else if ((e.key === 'Enter' || e.key === ' ') && sel >= 0) pick(sel);
    };
    const offKey = TC.input.on('key', onKey);
    const offAbort = TC.input.on('abort', () => { cleanup(); rejectFn && rejectFn(TC.ABORT); });
    let picked = false;
    function cleanup() { offKey(); offAbort(); }
    function pick(i) {
      if (picked) return; picked = true;
      cleanup();
      TC.audio.sfx('select');
      els.forEach((e, k) => { if (k === i) e.classList.add('picked'); else e.classList.add('gone'); });
      UI.logPush('pick', opts[i].text, 'pick');
      setTimeout(() => { box.innerHTML = ''; UI._opts = null; resolveFn(opts[i].id); }, TC.fastForward() ? 10 : 330);
    }
    // stop fast-forward at choices
    if (TC.state) TC.state.skip = false;
    UI.syncHud();
    return new Promise((res, rej) => { resolveFn = res; rejectFn = rej; if (run.aborted) rej(TC.ABORT); });
  };

  /* ======================================================= voices bar */
  UI.voicesBar = function (ids, newId) {
    const bar = $('voices');
    bar.innerHTML = '';
    ids.forEach((id) => {
      const v = TC.voices[id];
      const e = U.el('div', { class: 'vcard' + (id === newId ? ' new' : ''), 'data-v': id, title: TC.t(v.name) });
      e.innerHTML = TC.art.voiceCard(v, 96, 150, true);
      bar.appendChild(e);
    });
  };
  UI.voiceTalk = function (id) { U.$$('.vcard', $('voices')).forEach((e) => e.classList.toggle('talk', e.dataset.v === id)); };

  /* ======================================================= prompt */
  UI.prompt = function (text) {
    const p = $('prompt');
    if (!text) { p.classList.add('hidden'); return; }
    p.textContent = TC.t(text);
    p.classList.remove('hidden');
  };

  /* ======================================================= HUD */
  UI.syncHud = function () {
    const s = TC.state || {};
    U.$$('.hud-btn').forEach((b) => {
      if (b.dataset.act === 'auto') b.classList.toggle('on', !!s.auto);
      if (b.dataset.act === 'skip') b.classList.toggle('on', !!s.skip);
    });
  };
  UI.hud = function (on) { $('hud').classList.toggle('hidden-soft', !on); };

  /* ======================================================= backlog */
  const LOG = [];
  UI.logPush = (who, text, kind) => { LOG.push({ who, text, kind }); if (LOG.length > 300) LOG.shift(); };
  UI.logClear = () => { LOG.length = 0; };

  /* ======================================================= modal menus */
  let modal = null;
  UI.modalOpen = () => !!modal;
  UI.closeModal = function () {
    if (!modal) return;
    modal.remove(); modal = null;
    TC.input.locked = false;
    if (TC.state) TC.state.paused = false;
  };
  function openModal(html, cls = '') {
    UI.closeModal();
    modal = U.el('div', { class: 'menu-root ' + cls });
    modal.innerHTML = html;
    $('menus').appendChild(modal);
    TC.input.locked = true;
    if (TC.state) TC.state.paused = true;
    modal.addEventListener('pointerdown', (e) => e.stopPropagation());
    return modal;
  }
  const T = (en, vi) => TC.t(TC.L(en, vi));

  UI.openLog = function () {
    const items = LOG.map((l) => {
      if (l.kind === 'pick') return `<div class="log-item pick">➤ ${U.esc(TC.t(l.text))}</div>`;
      const sp = SPK[l.who] || (TC.voices[l.who] ? voiceSpeaker(l.who) : null);
      if (!sp || l.who === 'narrator') return `<div class="log-item narrator">${U.esc(TC.t(l.text).replace(/[*|]|\{[^}]*\}/g, ''))}</div>`;
      return `<div class="log-item"><b style="color:${sp.color};-webkit-text-stroke:1px #000">${U.esc(TC.t(sp.name))}</b>${U.esc(TC.t(l.text).replace(/[*|]|\{[^}]*\}/g, ''))}</div>`;
    }).join('');
    const m = openModal(`<div style="position:absolute;inset:0;background:rgba(20,11,22,.6)"></div>
      <div class="panel-box" style="left:160px;top:60px;right:160px;bottom:60px">
        <div style="position:absolute;left:60px;top:26px;font-family:var(--f-logo);font-size:56px">${T('LOG', 'NHẬT KÝ')}</div>
        <button class="mbtn" data-close style="position:absolute;right:40px;top:22px;min-width:0;font-size:36px">✕</button>
        <div class="log-list">${items || '…'}</div></div>`);
    const list = m.querySelector('.log-list'); list.scrollTop = list.scrollHeight;
    m.querySelector('[data-close]').onclick = () => UI.closeModal();
  };

  UI.openSettings = function (onClose) {
    const s = TC.persist.data.settings;
    const seg = (key, labels) => `<div class="seg" data-k="${key}">${labels.map((l, i) => `<button data-v="${i}" class="${s[key] === i ? 'on' : ''}">${U.esc(l)}</button>`).join('')}</div>`;
    const bool = (key) => `<div class="seg" data-k="${key}" data-bool="1"><button data-v="1" class="${s[key] ? 'on' : ''}">${T('ON', 'BẬT')}</button><button data-v="0" class="${!s[key] ? 'on' : ''}">${T('OFF', 'TẮT')}</button></div>`;
    const m = openModal(`<div style="position:absolute;inset:0;background:rgba(20,11,22,.6)"></div>
      <div class="panel-box" style="left:300px;top:70px;width:1320px;height:940px;padding:40px 70px">
        <div style="font-family:var(--f-logo);font-size:64px;margin-bottom:14px">${T('SETTINGS', 'CÀI ĐẶT')}</div>
        <div class="set-row"><label>${T('LANGUAGE', 'NGÔN NGỮ')}</label><div class="seg" data-k="lang"><button data-v="en" class="${TC.lang === 'en' ? 'on' : ''}">ENGLISH</button><button data-v="vi" class="${TC.lang === 'vi' ? 'on' : ''}">TIẾNG VIỆT</button></div></div>
        <div class="set-row"><label>${T('TEXT SPEED', 'TỐC ĐỘ CHỮ')}</label>${seg('textSpeed', [T('SLOW', 'CHẬM'), T('NORMAL', 'VỪA'), T('FAST', 'NHANH'), T('INSTANT', 'TỨC THÌ')])}</div>
        <div class="set-row"><label>${T('AUTO DELAY', 'ĐỘ TRỄ AUTO')}</label>${seg('autoDelay', [T('SHORT', 'NGẮN'), T('MEDIUM', 'VỪA'), T('LONG', 'DÀI')])}</div>
        <div class="set-row"><label>${T('MUSIC', 'NHẠC')}</label><input type="range" min="0" max="1" step="0.05" value="${s.music}" data-r="music"></div>
        <div class="set-row"><label>${T('SOUND FX', 'HIỆU ỨNG')}</label><input type="range" min="0" max="1" step="0.05" value="${s.sfx}" data-r="sfx"></div>
        <div class="set-row"><label>${T('TEXT BLIPS', 'TIẾNG THOẠI')}</label><input type="range" min="0" max="1" step="0.05" value="${s.voice}" data-r="voice"></div>
        <div class="set-row"><label>${T('SCREEN SHAKE', 'RUNG MÀN HÌNH')}</label>${bool('shake')}</div>
        <div class="set-row"><label>${T('FLASHES', 'CHỚP SÁNG')}</label>${bool('flashes')}</div>
        <div style="display:flex;gap:26px;margin-top:34px">
          <button class="mbtn" data-fs style="min-width:0;font-size:40px">${T('FULLSCREEN', 'TOÀN MÀN HÌNH')}</button>
          <button class="mbtn" data-close style="min-width:0;font-size:40px;background:#f7c325">${T('DONE', 'XONG')}</button>
        </div>
      </div>`);
    m.querySelectorAll('.seg').forEach((g) => g.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      const k = g.dataset.k;
      if (k === 'lang') { TC.setLang(b.dataset.v); UI.openSettings(onClose); return; }
      s[k] = g.dataset.bool ? b.dataset.v === '1' : +b.dataset.v;
      g.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      TC.persist.save(); TC.audio.sfx('click');
    }));
    m.querySelectorAll('input[type=range]').forEach((r) => r.addEventListener('input', () => { s[r.dataset.r] = +r.value; TC.audio.applyVolumes(); TC.persist.save(); if (r.dataset.r === 'voice') TC.audio.blip('tam', 'a'); if (r.dataset.r === 'sfx') TC.audio.sfx('click'); }));
    m.querySelector('[data-fs]').onclick = () => TC.toggleFullscreen();
    m.querySelector('[data-close]').onclick = () => { UI.closeModal(); onClose && onClose(); };
  };

  UI.openPause = function () {
    const m = openModal(`<div style="position:absolute;inset:0;background:rgba(20,11,22,.72)"></div>
      <div style="position:absolute;left:0;right:0;top:120px;text-align:center;font-family:var(--f-logo);font-size:110px;color:#f7c325;-webkit-text-stroke:4px #000;paint-order:stroke fill;text-shadow:8px 8px 0 #000;transform:skew(-6deg)">${T('PAUSED', 'TẠM DỪNG')}</div>
      <div style="position:absolute;left:720px;top:330px;display:flex;flex-direction:column;gap:26px">
        <button class="mbtn" data-a="resume">${T('RESUME', 'TIẾP TỤC')}</button>
        <button class="mbtn" data-a="log">${T('LOG', 'NHẬT KÝ')}</button>
        <button class="mbtn" data-a="settings">${T('SETTINGS', 'CÀI ĐẶT')}</button>
        <button class="mbtn" data-a="title">${T('TITLE SCREEN', 'VỀ MÀN HÌNH CHÍNH')}</button>
      </div>`);
    m.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      TC.audio.sfx('click');
      const a = b.dataset.a;
      if (a === 'resume') UI.closeModal();
      else if (a === 'log') UI.openLog();
      else if (a === 'settings') UI.openSettings();
      else if (a === 'title') { UI.closeModal(); TC.main.toTitle(); }
    });
  };

  UI.toast = function (text) {
    const t = U.el('div', { class: 'toast' }, U.esc(TC.t(text)));
    $('menus').appendChild(t);
    setTimeout(() => t.remove(), 2600);
  };

  UI.reset = function () {
    UI.hideBox(); $('choices').innerHTML = ''; UI.prompt(null); UI.voiceTalk(null);
    $('voices').innerHTML = ''; typing = null;
  };
})();
