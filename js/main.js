/* main.js — boot, title screen, endings gallery, credits, language */
(function () {
  'use strict';
  const TC = window.TC, U = TC.util, UI = TC.ui, FX = TC.fx, G = TC.gfx, L = TC.L;
  const $ = (id) => document.getElementById(id);
  const M = (TC.main = { inGame: false });
  // ✏️ Put your name / studio here to show it on the title screen and in the credits (leave '' to hide).
  M.AUTHOR = 'haidang@gamedev';
  const T = (en, vi) => TC.t(L(en, vi));

  TC.setLang = function (lang) {
    TC.lang = lang === 'vi' ? 'vi' : 'en';
    TC.persist.data.settings.lang = TC.lang;
    TC.persist.save();
    document.documentElement.lang = TC.lang;
    if (!M.inGame && M.titleShown) M.showTitle(true);
  };

  /* ======================================================= boot */
  async function boot() {
    TC.persist.load();
    const s = TC.persist.data.settings;
    TC.lang = s.lang || ((navigator.language || '').toLowerCase().startsWith('vi') ? 'vi' : 'en');
    document.documentElement.lang = TC.lang;
    TC.initCore();
    if (window.matchMedia && (matchMedia('(pointer: coarse)').matches || Math.min(innerWidth, innerHeight) < 500)) document.body.classList.add('touch');
    TC.ink.installDefs();
    FX.init();
    TC.engine.bindHud();
    UI.hud(false);
    const btn = $('boot-btn');
    // fonts + key art (fail-safe timeout so a blocked font never soft-locks the boot)
    const fontList = ['400 40px "Dela Gothic One"', '400 40px "Bangers"', '400 40px "Patrick Hand"', 'italic 400 40px "Lora"', '400 40px "SFX JP"'];
    const fonts = Promise.all(fontList.map((f) => document.fonts.load(f, 'TẤM CÁM ゴドン').catch(() => null)));
    const art = G.preload([['bg:title', TC.art.bg.title], ['bg:path', TC.art.bg.path]]);
    await Promise.race([Promise.all([fonts, art]), new Promise((r) => setTimeout(r, 6000))]);
    btn.disabled = false;
    btn.textContent = T('PRESS START', 'BẤM ĐỂ BẮT ĐẦU');
    const go = () => {
      btn.removeEventListener('click', go);
      TC.audio.init(); TC.audio.unlock();
      $('boot').classList.add('gone');
      setTimeout(() => $('boot').remove(), 700);
      M.showTitle();
      // warm the rest of the art in the background
      setTimeout(() => G.preloadIdle(['path', 'tree', 'courtyard', 'loomroom', 'teashop', 'steps', 'battle', 'lying', 'crow', 'void', 'riverbank'].map((k) => ['bg:' + k, TC.art.bg[k]])), 900);
    };
    btn.addEventListener('click', go);
    btn.focus();
    window.addEventListener('keydown', function k(e) { if ((e.key === 'Enter' || e.key === ' ') && $('boot') && !btn.disabled) { window.removeEventListener('keydown', k); go(); } });
  }

  /* ======================================================= title */
  let titleEl = null;
  M.showTitle = async function (quick) {
    M.inGame = false;
    M.titleShown = true;
    UI.hud(false);
    UI.reset();
    if (!quick) {
      TC.engine.reset();
      await TC.gfx.canvas('bg:title', TC.art.bg.title, 1920, 1080).then((c) => { $('bg').innerHTML = ''; const d = U.el('div', { class: 'scene' }); d.appendChild(c); $('bg').appendChild(d); });
      FX.fadeIn(10);
      TC.music.play('title', 0.5);
    }
    if (titleEl) titleEl.remove();
    const P = TC.persist.data;
    const found = Object.keys(P.endings).length;
    const cp = P.checkpoint;
    const quip = P.seenTrue
      ? L('Once upon a now…', 'Ngày xửa ngày nay…')
      : P.plays > 2 ? L('You again. I\'m starting to think you\'re doing this on purpose.', 'Lại là cô. Ta bắt đầu nghĩ cô cố tình đấy.')
        : P.plays > 0 ? L('Oh. It\'s you. Have we… met?', 'Ồ. Là cô à. Chúng ta… gặp nhau chưa nhỉ?')
          : L('A fairy tale told ten thousand times. This time, you\'re the villain.', 'Chuyện cổ tích đã kể mười nghìn lần. Lần này, cô là phản diện.');
    titleEl = U.el('div', { class: 'menu-root title' });
    titleEl.innerHTML = `
      <div class="logo-wrap" style="position:absolute;left:70px;top:44px;transform:rotate(-4deg)">
        <div style="font-family:var(--f-logo);font-size:190px;line-height:.95;color:#f7c325;-webkit-text-stroke:7px #140b16;paint-order:stroke fill;text-shadow:10px 10px 0 #ff3d8b,20px 20px 0 #140b16;letter-spacing:-.02em;transform:skew(-8deg)">TẤM CÁM</div>
        <div style="font-family:var(--f-comic);font-size:64px;letter-spacing:.14em;color:#3fe6ff;-webkit-text-stroke:3px #140b16;paint-order:stroke fill;text-shadow:5px 5px 0 #140b16;margin:14px 0 0 30px;transform:skew(-8deg)">'S BIZARRE ADVENTURE</div>
        <div style="display:inline-block;margin:18px 0 0 40px;padding:6px 26px;background:#140b16;color:#fff;font-family:var(--f-comic);font-size:38px;letter-spacing:.2em;transform:skew(-12deg)">RICEDUST CRUSADERS</div>
      </div>
      <div class="tmenu" style="position:absolute;left:92px;top:470px;display:flex;flex-direction:column;gap:14px">
        <button class="mbtn" data-a="new">${T('NEW GAME', 'CHƠI MỚI')}</button>
        <button class="mbtn" data-a="cont" ${cp ? '' : 'disabled'}>${T('CONTINUE', 'CHƠI TIẾP')}${cp ? `<small>${U.esc(chapterName(cp.chapter))}</small>` : ''}</button>
        <button class="mbtn" data-a="endings">${T('ENDINGS', 'KẾT THÚC')}<small>${found}/5</small></button>
        <button class="mbtn" data-a="settings">${T('SETTINGS', 'CÀI ĐẶT')}</button>
      </div>
      <div class="seg" style="position:absolute;right:40px;top:30px" data-lang>
        <button data-v="en" class="${TC.lang === 'en' ? 'on' : ''}">EN</button><button data-v="vi" class="${TC.lang === 'vi' ? 'on' : ''}">VI</button>
      </div>
      <button class="mbtn" data-a="fs" style="position:absolute;right:40px;top:104px;min-width:0;font-size:30px;padding:6px 18px">⛶</button>
      <div class="quip" style="position:absolute;left:92px;bottom:92px;max-width:900px;font-family:var(--f-tell);font-style:italic;font-size:36px;color:#fbf3dc;text-shadow:3px 3px 0 #140b16,0 0 18px #140b16">${U.esc(TC.t(quip))}</div>
      <div style="position:absolute;left:92px;right:40px;bottom:30px;font-family:var(--f-talk);font-size:24px;color:#fbf3dcaa;text-shadow:2px 2px 0 #140b16">${M.AUTHOR ? U.esc(M.AUTHOR) + ' · ' : ''}${T('A goofy fan tribute to Slay the Princess & JoJo\'s Bizarre Adventure, retelling the Vietnamese folk tale Tấm Cám. Not affiliated. Everything you see and hear is generated in code.', 'Một tác phẩm fan vui nhộn, tri ân Slay the Princess & JoJo\'s Bizarre Adventure, kể lại truyện cổ tích Tấm Cám. Không liên kết chính thức. Mọi hình ảnh và âm thanh đều được tạo bằng code.')}</div>`;
    $('menus').appendChild(titleEl);
    titleEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: quick ? 1 : 700, fill: 'forwards' });
    const logo = titleEl.querySelector('.logo-wrap');
    if (!quick) logo.animate([{ transform: 'rotate(-4deg) scale(1.6) translateX(-200px)', opacity: 0 }, { transform: 'rotate(-4deg) scale(.96)', opacity: 1, offset: 0.7 }, { transform: 'rotate(-4deg) scale(1)', opacity: 1 }], { duration: 700, easing: 'cubic-bezier(.2,.9,.3,1)' });
    if (!quick) { setTimeout(() => { TC.audio.sfx('dun'); FX.shake(12, 300); }, 380); }
    FX.menace(true, { text: 'ド', style: 'dodoBlue', count: 3, size: 96, every: 900, spots: [[1360, 190], [1590, 250], [1330, 330], [1540, 130]] });
    // menu keyboard navigation
    const btns = U.$$('.tmenu .mbtn:not([disabled])', titleEl);
    let sel = -1;
    const mark = (i) => { sel = i; btns.forEach((b, k) => b.classList.toggle('sel', k === i)); };
    btns.forEach((b, i) => b.addEventListener('mouseenter', () => { mark(i); TC.audio.sfx('hover'); }));
    titleEl.addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      const lg = e.target.closest('[data-lang] button');
      if (lg) { TC.audio.sfx('click'); TC.setLang(lg.dataset.v); return; }
      if (!b) return;
      TC.audio.sfx('select');
      act(b.dataset.a);
    });
    const offKey = TC.input.on('key', (e) => {
      if (M.inGame || UI.modalOpen() || !titleEl || !titleEl.isConnected) return;
      if (e.key === 'ArrowDown') mark((sel + 1) % btns.length);
      else if (e.key === 'ArrowUp') mark((sel - 1 + btns.length) % btns.length);
      else if ((e.key === 'Enter' || e.key === ' ') && sel >= 0) btns[sel].click();
    });
    titleEl._off = offKey;
    function act(a) {
      if (a === 'new') M.newGame();
      else if (a === 'cont') M.continueGame();
      else if (a === 'endings') M.openEndings();
      else if (a === 'settings') UI.openSettings();
      else if (a === 'fs') TC.toggleFullscreen();
    }
  };
  function chapterName(id) {
    return { ch1: 'I', ch2: 'II', ch3: 'III', ch4: 'IV', ch5: 'V' }[id] ? T('Chapter ', 'Chương ') + { ch1: 'I', ch2: 'II', ch3: 'III', ch4: 'IV', ch5: 'V' }[id] : '';
  }
  function leaveTitle() {
    FX.menace(false); FX.clearSfx();
    if (titleEl) { titleEl._off && titleEl._off(); const t = titleEl; titleEl = null; t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).onfinish = () => t.remove(); }
    M.titleShown = false;
  }

  M.newGame = async function () {
    leaveTitle();
    TC.persist.data.starts++;
    TC.persist.save();
    UI.logClear();
    TC.music.stop(0.6);
    await FX.fadeTo('#140b16', 500);
    M.inGame = true;
    UI.hud(true);
    TC.engine.run('ch1');
  };
  M.continueGame = async function () {
    const cp = TC.persist.data.checkpoint;
    if (!cp) return;
    leaveTitle();
    TC.music.stop(0.6);
    await FX.fadeTo('#140b16', 500);
    M.inGame = true;
    UI.hud(true);
    TC.engine.run(cp.chapter, { flags: cp.flags || {}, voices: cp.voices || [] });
  };
  M.toTitle = async function () {
    TC.input.emit('abort');
    TC.newRun();
    M.inGame = false;
    UI.closeModal();
    TC.music.stop(0.4);
    await FX.fadeTo('#140b16', 400);
    TC.engine.reset();
    await M.showTitle();
  };

  /* ======================================================= endings */
  M.ending = async function (id) {
    const P = TC.persist.data;
    const first = !P.endings[id];
    P.endings[id] = Date.now();
    P.plays = (P.plays || 0) + 1;
    P.checkpoint = null;
    if (id === 'true') P.seenTrue = true;
    TC.persist.save();
    UI.hideBox();
    UI.hud(false);
    FX.menace(false);
    const e = TC.endings[id];
    const found = Object.keys(P.endings).length;
    TC.audio.sfx('ending');
    const card = U.el('div', { class: 'ov' });
    card.innerHTML = `<div style="position:absolute;inset:0;background:rgba(20,11,22,.86)"></div>
      <svg viewBox="0 0 1920 1080" width="1920" height="1080" style="position:absolute;inset:0">${TC.ink.radial(960, 470, 300, 1500, 90, { w: 22, seed: e.n * 11, color: '#f7c325', op: 0.28 })}</svg>
      <div style="position:absolute;left:0;right:0;top:170px;text-align:center;font-family:var(--f-comic);font-size:52px;letter-spacing:.3em;color:#3fe6ff;-webkit-text-stroke:2px #000">${T('ENDING', 'KẾT THÚC')} ${e.n} / 5${first ? ` · <span style="color:#ff6fa8">${T('NEW!', 'MỚI!')}</span>` : ''}</div>
      <div class="etitle" style="position:absolute;left:60px;right:60px;top:270px;text-align:center;font-family:var(--f-logo);font-size:150px;line-height:1.05;color:#f7c325;-webkit-text-stroke:6px #140b16;paint-order:stroke fill;text-shadow:10px 10px 0 #ff3d8b,18px 18px 0 #140b16">${U.esc(TC.t(e.title))}</div>
      <div style="position:absolute;left:0;right:0;top:${TC.t(e.title).length > 14 ? 640 : 520}px;text-align:center;font-family:var(--f-tell);font-style:italic;font-size:50px;color:#fbf3dc">${U.esc(TC.t(e.sub))}</div>
      <div style="position:absolute;left:0;right:0;bottom:150px;text-align:center;font-family:var(--f-comic);font-size:40px;letter-spacing:.12em;color:#fff">${T('ENDINGS FOUND', 'ĐÃ MỞ KHÓA')}: ${found} / 5</div>
      <div style="position:absolute;left:0;right:0;bottom:80px;text-align:center;font-family:var(--f-talk);font-size:32px;color:#fbf3dcaa">${T('click / tap to continue', 'bấm để tiếp tục')}</div>`;
    $('overlay').appendChild(card);
    card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: 'forwards' });
    card.querySelector('.etitle').animate([{ transform: 'scale(1.8) rotate(-6deg)', opacity: 0 }, { transform: 'scale(.95) rotate(-3deg)', opacity: 1, offset: 0.7 }, { transform: 'scale(1) rotate(-3deg)', opacity: 1 }], { duration: 700, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'forwards' });
    setTimeout(() => FX.shake(14, 300), 480);
    await TC.wait(1200).catch(() => { });
    await Promise.race([TC.input.waitAdvance(), new Promise((r) => setTimeout(r, 9000))]).catch(() => { });
    card.remove();
    if (id === 'true' || found === 5) await M.credits(found === 5);
    await M.toTitle();
    if (first && found < 5) UI.toast(L(`New ending unlocked (${found}/5). There are other ways this story can go…`, `Mở khóa kết thúc mới (${found}/5). Câu chuyện này còn những ngả rẽ khác…`));
    return null;
  };

  M.credits = async function (all) {
    TC.music.play('ending', 1);
    const c = U.el('div', { class: 'ov' });
    const lines = [
      ['h', "TẤM CÁM'S BIZARRE ADVENTURE"], ['s', 'RICEDUST CRUSADERS'], ['gap'],
      ...(M.AUTHOR ? [['t', T('A game by', 'Một trò chơi của')], ['n', M.AUTHOR], ['gap']] : []),
      ['t', T('Based on the Vietnamese folk tale', 'Dựa trên truyện cổ tích Việt Nam')], ['n', 'Tấm Cám'], ['gap'],
      ['t', T('With love to', 'Thân tặng')], ['n', 'Slay the Princess — Black Tabby Games'], ['n', "JoJo's Bizarre Adventure — Hirohiko Araki"], ['gap'],
      ['t', T('Art, music & sound', 'Hình ảnh, âm nhạc & âm thanh')], ['n', T('100% procedurally generated in the browser', '100% tạo bằng code ngay trên trình duyệt')], ['gap'],
      ['t', T('Instruments (synthesized)', 'Nhạc cụ (tổng hợp)')], ['n', 'đàn tranh · đàn bầu · sáo · trống · mõ · phách · chiêng'], ['gap'],
      ['t', T('Fonts (SIL Open Font License)', 'Phông chữ (SIL OFL)')], ['n', 'Dela Gothic One · Bangers · Patrick Hand · Lora'], ['gap'],
      ['t', T('Starring', 'Diễn viên')], ['n', 'Tấm · Cám · ' + T('Mom', 'Mẹ') + ' · Bụt · ' + T('The King', 'Nhà Vua') + ' · ' + T('An Old Woman With A Stand', 'Bà Lão Có Stand')], ['n', T('and The Narrator, as himself', 'và Người Kể Chuyện, trong vai chính mình')], ['gap'],
      ['t', T('No fish were harmed. One bird, a loom, and a book were.', 'Không con cá nào bị hại. Một con chim, một khung cửi và một quyển sách thì có.')], ['gap'], ['gap'],
      ['h', all ? T('ALL ENDINGS FOUND', 'ĐÃ MỞ KHÓA MỌI KẾT THÚC') : T('THANK YOU FOR PLAYING', 'CẢM ƠN ĐÃ CHƠI')],
      ['s', T('…and they lived.', '…và họ sống.')],
    ];
    c.innerHTML = `<div style="position:absolute;inset:0;background:#140b16"></div><div class="roll" style="position:absolute;left:0;right:0;top:1080px;text-align:center">${lines.map(([k, v]) =>
      k === 'gap' ? '<div style="height:70px"></div>' :
        k === 'h' ? `<div style="font-family:var(--f-logo);font-size:84px;color:#f7c325;-webkit-text-stroke:3px #000;paint-order:stroke fill;text-shadow:6px 6px 0 #ff3d8b;margin:10px 0">${U.esc(v)}</div>` :
          k === 's' ? `<div style="font-family:var(--f-comic);font-size:48px;letter-spacing:.2em;color:#3fe6ff">${U.esc(v)}</div>` :
            k === 't' ? `<div style="font-family:var(--f-comic);font-size:38px;letter-spacing:.14em;color:#ff6fa8;margin-top:6px">${U.esc(v)}</div>` :
              `<div style="font-family:var(--f-talk);font-size:46px;color:#fbf3dc">${U.esc(v)}</div>`).join('')}</div>`;
    $('overlay').appendChild(c);
    const roll = c.querySelector('.roll');
    const h = roll.scrollHeight;
    let skip = false;
    const off = TC.input.on('advance', () => { skip = true; });
    await U.tween(Math.max(12000, h * 11), (t) => { if (!skip) roll.style.transform = `translateY(${-t * (h + 1080 - 300)}px)`; }, U.ease.linear).catch(() => { });
    off();
    if (!skip) await TC.wait(1500).catch(() => { });
    c.remove();
  };

  M.openEndings = function () {
    const P = TC.persist.data;
    const ids = ['canon', 'wry', 'run', 'eat', 'true'];
    const html = `<div style="position:absolute;inset:0;background:rgba(20,11,22,.9)"></div>
      <div style="position:absolute;left:80px;top:60px;font-family:var(--f-logo);font-size:84px;color:#f7c325;-webkit-text-stroke:3px #000;paint-order:stroke fill;text-shadow:6px 6px 0 #ff3d8b">${T('ENDINGS', 'KẾT THÚC')} <span style="font-size:.6em;color:#fff">${Object.keys(P.endings).length}/5</span></div>
      <button class="mbtn" data-close style="position:absolute;right:60px;top:60px;min-width:0">✕</button>
      <div class="egrid">${ids.map((id, i) => {
        const e = TC.endings[id], got = !!P.endings[id];
        return `<div class="ecard ${got ? '' : 'locked'}" style="--r:${[-2, 1.5, -1, 2, -1.5][i]}deg">
          <canvas data-e="${id}" width="300" height="470" style="position:absolute;left:0;top:0;width:100%;height:470px;${got ? '' : 'filter:grayscale(1) brightness(.25)'}"></canvas>
          ${got ? '' : `<div style="position:absolute;left:0;right:0;top:170px;text-align:center;font-family:var(--f-logo);font-size:110px;color:#fff3">?</div>`}
          <div style="position:absolute;left:14px;top:12px;font-family:var(--f-comic);font-size:36px;color:#fff;-webkit-text-stroke:2px #000">${e.n}</div>
          <div class="elbl">${got ? U.esc(TC.t(e.title)) : '???'}<div style="font-family:var(--f-talk);font-size:22px;letter-spacing:0;color:${got ? '#ccc' : '#aaa'};margin-top:4px">${U.esc(TC.t(got ? e.sub : e.hint))}</div></div></div>`;
      }).join('')}</div>`;
    const m = U.el('div', { class: 'menu-root' });
    m.innerHTML = html;
    $('menus').appendChild(m);
    TC.input.locked = true;
    m.querySelector('[data-close]').onclick = () => { m.remove(); TC.input.locked = false; };
    m.addEventListener('pointerdown', (e) => e.stopPropagation());
    const bgOf = { canon: 'crow', wry: 'void', run: 'steps', eat: 'lying', true: 'riverbank' };
    U.$$('canvas[data-e]', m).forEach((cv) => {
      const k = bgOf[cv.dataset.e];
      G.image('bg:' + k, TC.art.bg[k]).then((img) => {
        const g = cv.getContext('2d');
        const sw = 1080 * (300 / 470), sx = (1920 - sw) / 2 + (cv.dataset.e === 'wry' ? 0 : 0);
        g.drawImage(img, sx, 0, sw, 1080, 0, 0, 300, 470);
      }).catch(() => { });
    });
    const esc = TC.input.on('key', (e) => { if (e.key === 'Escape' && m.isConnected) { m.remove(); TC.input.locked = false; esc(); } });
  };

  /* ======================================================= dev hooks (?dev) */
  const Q = new URLSearchParams(location.search);
  if (Q.has('dev')) {
    TC.dev = {
      opts: () => (UI._opts && document.querySelector('#choices .choice') && !document.querySelector('#choices .choice.picked') ? UI._opts.map((o) => o.id) : null),
      pickId: (id) => { const i = (UI._opts || []).findIndex((o) => o.id === id); const els = U.$$('#choices .choice'); if (i >= 0 && els[i]) { els[i]._pick(); return true; } return false; },
      prompt: () => !$('prompt').classList.contains('hidden'),
      box: () => (UI.boxShown ? $('text').textContent : ''),
      advance: () => TC.input.emit('advance'),
      press: () => TC.input.emit('press', 'dev'),
      modal: () => UI.modalOpen() || !!document.querySelector('#menus .menu-root:not(.title)'),
      state: () => JSON.parse(JSON.stringify(TC.state)),
      bg: () => TC.api.curBg(),
      inGame: () => M.inGame,
      title: () => M.titleShown,
      start: (ch, flags = {}, voices = []) => { if (titleEl) leaveTitle(); M.inGame = true; UI.hud(true); TC.engine.run(ch, { flags, voices }); },
      endings: () => Object.keys(TC.persist.data.endings),
      reset: () => TC.persist.reset(),
      errors: [],
    };
    window.addEventListener('error', (e) => TC.dev.errors.push(String(e.message)));
    window.addEventListener('unhandledrejection', (e) => TC.dev.errors.push('rej: ' + String(e.reason && e.reason.stack || e.reason)));
  }

  window.addEventListener('DOMContentLoaded', boot);
})();
