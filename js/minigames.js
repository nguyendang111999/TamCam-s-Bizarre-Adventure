/* minigames.js — interactive set pieces & scripted sequences */
(function () {
  'use strict';
  const TC = window.TC, U = TC.util;
  const { L, say, me, V, bg, show, hide, swap, move, actor, clearActors, sfx, wait, music, stopMusic, fx, ui, hasVoice } = TC.api;
  const MG = (TC.minigames = {});
  const $ = (id) => document.getElementById(id);

  // resolve on a "press" (space/enter/click/tap); honours abort
  function waitPress() {
    const run = TC.run;
    return new Promise((res, rej) => {
      if (TC.fastForward()) { setTimeout(res, 30); return; }
      const off = TC.input.on('press', () => { if (TC.input.locked) return; off(); offA(); res(); });
      const offA = TC.input.on('abort', () => { off(); offA(); rej(TC.ABORT); });
      if (run.aborted) { off(); offA(); rej(TC.ABORT); }
    });
  }
  const P = {
    chop: L('CHOP! — SPACE / CLICK / TAP', 'CHẶT! — SPACE / CLICK / CHẠM'),
    weave: L('WEAVE — SPACE / CLICK / TAP', 'DỆT — SPACE / CLICK / CHẠM'),
    walk: L('WALK — SPACE / CLICK / TAP', 'BƯỚC — SPACE / CLICK / CHẠM'),
    mash: L('MASH! — SPACE / CLICK / TAP!!', 'BẤM LIÊN TỤC!! — SPACE / CLICK / CHẠM'),
    tear: L('TEAR IT! — MASH!!', 'XÉ NÓ! — BẤM LIÊN TỤC!!'),
  };

  /* ================================================================ CH I */
  const CROWN = [1010, 150];
  async function treeFall(byMom) {
    sfx('creak'); fx.sfx('メキメキ', { x: 1150, y: 640, style: 'impact', size: 150, rot: -12 });
    fx.shake(8, 500);
    await wait(650);
    await swap('areca', 'empty', { ms: 0 });
    show('tam_fall', { x: CROWN[0] - 110, y: CROWN[1] - 60, w: 240, anim: 'none', z: 6 });
    sfx('fall');
    const m1 = move('areca', { rot: 84 }, 1300, 'cubic-bezier(.55,0,.95,.45)');
    const m2 = move('tam_fall', { x: CROWN[0] + 600, y: 1400, rot: 540, scale: 0.8 }, 1500, 'cubic-bezier(.4,0,.9,.6)');
    await say('tam', byMom ? L('MOOOM?! CÁÁÁM?!', 'DÌ ƠIII?! CÁÁÁM?!') : L('CÁÁÁÁÁM?!', 'CÁÁÁÁÁM?!'), { style: 'shout', auto: 500, tail: 1300, tailH: 30 });
    await m1;
    sfx('crash'); fx.shake(34, 800); fx.flash('#fff', 400, 0.8);
    fx.sfx('ドゴォォン', { x: 1500, y: 800, style: 'impact', size: 190, rot: -6, life: 1800 });
    fx.burst('dust', 1500, 980, 26, { angle: -Math.PI / 2, spread: 2.6, speed: 600, size: 34, g: 200, life: 1.6, drag: 0.97, grow: 1.2 });
    await m2;
    hide('tam_fall'); hide('areca', { ms: 600 }); hide('axe', { ms: 300 }); hide('mom', { ms: 300 });
    ui.hideBox();
    stopMusic(1.5);
    await wait(700);
    // a single golden feather drifts down (foreshadowing the oriole)
    fx.burst('feather', 980, -40, 1, { angle: Math.PI / 2, spread: 0.2, speed: 60, g: 12, size: 34, life: 6, sway: 1.6, vr: 1.2, drag: 1, fade: false });
    fx.burst('feather', 760, -120, 1, { angle: Math.PI / 2, spread: 0.2, speed: 50, g: 10, size: 26, life: 6.5, sway: 1.3, vr: 1, drag: 1 });
    await wait(1600);
    music('wind');
  }

  MG.chop = async function () {
    ui.hideBox();
    const lines = [null, L('Hm? Cám?', 'Hả? Cám?'), L('CÁM?!', 'CÁM?!')];
    for (let i = 0; i < 3; i++) {
      ui.prompt(P.chop);
      await waitPress();
      ui.prompt(null);
      sfx('chop'); fx.shake(18 + i * 6, 320);
      fx.burst('chip', 960, 930, 14 + i * 4, { angle: -Math.PI / 2 - 0.3, spread: 2.4, speed: 750, size: 16, g: 1700, life: 1.2 });
      fx.sfx(['ドン', 'ドン', 'ドォン'][i], { x: 1150 + i * 110, y: 800 - i * 130, style: 'impact', size: 150 + i * 30, rot: -10 + i * 8 });
      move('axe', { x: 870, y: 700, rot: 30 }, 90, 'ease-in').then(() => move('axe', { x: 820, y: 560, rot: -25 }, 260));
      await move('areca', { rot: [1.5, 3.5, 7][i] }, 240, 'cubic-bezier(.2,1.8,.4,1)');
      if (lines[i]) await say('tam', lines[i], { auto: 450, tail: 1000, tailH: 160, style: i === 2 ? 'shout' : undefined });
    }
    await treeFall(false);
  };

  MG.momChop = async function () {
    sfx('whooshDown');
    await show('mom', { x: 1180, y: 90, w: 720, anim: 'right', z: 4, wait: true });
    fx.menace(true, { every: 380, style: 'menace' });
    await say('mom', L('Move, sweetie. Mommy\'s got this.', 'Tránh ra con yêu. Để mẹ.'), { tail: 1450 });
    fx.menace(false);
    ui.hideBox();
    for (let i = 0; i < 3; i++) {
      sfx('chop'); fx.shake(20 + i * 6, 320);
      fx.burst('chip', 1000, 930, 16, { angle: -Math.PI / 2 - 0.3, spread: 2.4, speed: 750, size: 16, g: 1700, life: 1.2 });
      fx.sfx(['ドン', 'ドン', 'ドォン'][i], { x: 900 + i * 60, y: 820 - i * 150, style: 'impact', size: 150 + i * 30 });
      move('mom', { x: 1150, rot: -4 }, 90).then(() => move('mom', { x: 1180, rot: 0 }, 200));
      await move('areca', { rot: [1.5, 3.5, 7][i] }, 240, 'cubic-bezier(.2,1.8,.4,1)');
      await wait(380);
    }
    await treeFall(true);
  };

  /* ================================================================ Bụt */
  MG.butAppear = async function (x = 560, y = 170, gentle = false) {
    sfx('poof');
    fx.burst('smoke', x + 210, y + 300, 16, { speed: 380, g: -60, size: 60, life: 1.1, drag: 0.93, grow: 0.6 });
    fx.sfx('ポンッ', { x: x + 380, y: y + 60, style: 'cyan', size: 120, anim: 'pop' });
    if (gentle) { stopMusic(1); fx.burst('sparkle', x + 210, y + 300, 20, { speed: 300, g: 0, size: 18, life: 2.2, drag: 0.96 }); }
    await show('but', { x, y, w: 440, anim: 'pop', z: 7, idle: 'bob', ms: 420, wait: true });
  };
  MG.butVanish = async function () {
    const a = actor('but');
    sfx('poof');
    if (a) { const r = a.getBoundingClientRect(); const p = TC.stage.toStage(r.left + r.width / 2, r.top + r.height / 2); fx.burst('smoke', p.x, p.y, 16, { speed: 380, g: -60, size: 60, life: 1, drag: 0.93, grow: 0.6 }); }
    await hide('but', { anim: 'pop', ms: 220, wait: true });
  };

  /* ================================================================ CH II */
  MG.birdToSleeve = async function () {
    ui.hideBox();
    sfx('flap');
    await move('bird', { x: 1420, y: 520, scale: 0.35, rot: 20 }, 700, 'cubic-bezier(.5,0,.4,1)');
    await hide('bird', { ms: 120 });
    sfx('sparkle');
    fx.sfx('ズキュウウン', { x: 1240, y: 360, style: 'pink', size: 130, rot: -10, life: 1800 });
    fx.burst('heart', 1560, 560, 14, { angle: -Math.PI / 2, spread: 1.6, speed: 420, g: -80, size: 22, life: 1.8, drag: 0.97 });
    await wait(900);
  };
  MG.potDrop = async function () {
    ui.hideBox();
    await show('potsmall', { x: 1060, y: 560, w: 420, anim: 'drop', z: 5, ms: 700, wait: true });
    sfx('slam'); fx.shake(26, 450);
    fx.sfx('ドン!!', { x: 1500, y: 560, style: 'impact', size: 180 });
    fx.burst('dust', 1270, 900, 18, { angle: -Math.PI / 2, spread: 2.8, speed: 500, size: 28, g: 300, life: 1.2, drag: 0.95, grow: 1 });
    fx.burst('feather', 1270, 620, 1, { angle: -Math.PI / 2, spread: 0.3, speed: 220, g: 40, size: 30, life: 4.5, sway: 1.5, vr: 1.5, drag: 0.98 });
    await wait(900);
    await hide('potsmall', { ms: 500 });
  };

  /* ================================================================ CH III */
  MG.weave = async function () {
    ui.hideBox();
    const lines = [L('Clickety…', 'Cót ca…'), L('…clackety…', '…cót két…'), L('You stole my husband…', 'Lấy tranh chồng chị…'), L('…I\'ll gouge out your eyes.', '…chị khoét mắt ra.')];
    for (let i = 0; i < 4; i++) {
      ui.prompt(P.weave);
      await waitPress();
      ui.prompt(null);
      sfx('creak'); fx.shake(3 + i * 4, 300);
      fx.sfx('ギシ', { x: 560 + (i % 2) * 800, y: 380 + i * 60, style: 'menace', size: 110 + i * 14, rot: i % 2 ? 10 : -12 });
      move('loom', { x: 560 + (i % 2 ? 8 : -8) }, 110).then(() => move('loom', { x: 560 }, 160));
      if (i === 3) {
        await swap('loom', 'eyes', { ms: 60 });
        sfx('shock'); fx.shake(24, 600);
        fx.pulseShift(['negative', 'green', 'negative']).then(() => fx.shift('purple', 500));
        fx.menace(true, { every: 220, style: 'menace' });
        await say('loom', lines[i], { style: 'shout', tail: 960 });
        fx.menace(false);
      } else await say('loom', lines[i], { auto: 700, tail: 960 });
    }
    fx.shift('none', 800);
  };
  MG.fire = async function () {
    ui.hideBox();
    sfx('fire');
    fx.shift('red', 400);
    const stop = fx.emit('ember', { x: 960, y: 760, w: 700, h: 200, every: 30, n: 2, angle: -Math.PI / 2, spread: 0.7, speed: 520, g: -200, size: 34, life: 1.4, drag: 0.98 });
    fx.sfx('ゴオオ', { x: 960, y: 420, style: 'impact', size: 190, life: 2000 });
    fx.shake(10, 1800);
    await wait(1600);
    hide('loom', { ms: 900 });
    await wait(900);
    stop();
    fx.shift('none', 900);
    fx.emit('ash', { x: 960, y: -20, w: 1600, every: 60, n: 1, angle: Math.PI / 2, spread: 0.4, speed: 60, g: 20, size: 10, life: 5, sway: 1.2, duration: 5000 });
    await wait(900);
  };

  /* ================================================================ CH IV */
  MG.fruitToBag = async function () {
    ui.hideBox();
    const m = move('fruit', { x: 520, y: 700, rot: 200, scale: 0.9 }, 750, 'cubic-bezier(.5,0,.8,.5)');
    await m;
    sfx('plop');
    fx.sfx('ポン', { x: 640, y: 640, style: 'gold', size: 110, anim: 'pop' });
    await hide('fruit', { ms: 150 });
    await wait(400);
  };
  MG.oldWomanTimeStop = async function () {
    ui.hideBox();
    await fx.timeStop(440, 520);
    fx.sfx('ザ・ワールド', { x: 960, y: 200, style: 'gold', size: 130, anim: 'stay', life: 99999, force: true });
    await wait(500);
    await move('oldwoman', { x: 900, y: 250 }, 700);
    await move('fruit', { x: 1150, y: 520, rot: 30 }, 400);
    await move('oldwoman', { x: 170, y: 250 }, 700);
    await move('fruit', { x: 520, y: 700, rot: 200 }, 300);
    await hide('fruit', { ms: 100 });
    fx.clearSfx();
    await fx.timeResume();
    music('teashop');
    sfx('plop');
  };
  MG.tamReveal = async function () {
    ui.hideBox();
    stopMusic(0.4);
    sfx('shock');
    await fx.flash('#ffe066', 500, 1);
    fx.speedLines(true, { type: 'radial', cx: 960, cy: 420, inner: 360, n: 110, color: 'rgba(120,70,0,.55)' });
    await show('tam_dio', { x: 510, y: 40, w: 900, anim: 'slam', z: 8, ms: 500 });
    sfx('dun');
    fx.shake(26, 700);
    fx.sfx('バァーン', { x: 1560, y: 260, style: 'impact', size: 200, rot: 10, life: 2400 });
    fx.menace(true, { every: 260, style: 'gold', text: 'ゴ', count: 3, size: 100, spots: [[250, 250], [1700, 520], [300, 760], [1620, 860], [220, 520]] });
    music('title');
    await wait(900);
  };

  /* ================================================================ CH V — the approach */
  MG.approach = async function () {
    ui.hideBox();
    fx.speedLines(false);
    // Cám walks down the terrace edge (see ART.lib.STEP_EDGE): her feet stay on it while she grows
    const CAM = { x: 1246, y: 328, far: { x: 1518, y: 166, scale: 0.55 } };
    await show('tam_back', { x: -40, y: 20, w: 1000, anim: 'left', z: 4, ms: 700 });
    await show('cam_walk', { x: CAM.x, y: CAM.y, w: 336, anim: 'fade', z: 3, ms: 700 });
    move('cam_walk', CAM.far, 1);
    const steps = 9;
    const beats = {
      1: async () => {
        if (hasVoice('menacing')) await V('menacing', L('Slowly. Menacingly. Villains never run.', 'Từ từ thôi. Đáng sợ vào. Phản diện không bao giờ chạy.'));
        if (hasVoice('coward')) await V('coward', L('Every step forward is a step we could be taking BACKWARDS!', 'Mỗi bước tiến là một bước lẽ ra mình được LÙI!'));
      },
      3: async () => {
        if (hasVoice('hungry')) await V('hungry', L('If this goes badly, can our last meal be something nice?', 'Nếu toang thì bữa cuối cho tui ăn gì ngon ngon nha?'));
        if (hasVoice('sister')) await V('sister', L('She\'s shaking. Look at her hands.', 'Chị ấy đang run. Nhìn tay chị ấy kìa.'));
      },
      5: async () => {
        fx.menace(false);
        await say('tam', L('Oh? You\'re approaching me? Instead of running away, you\'re coming right to me?', 'Ồ? Em đang tiến lại gần chị đấy à? Không bỏ chạy mà còn tự tìm tới?'), { tail: 520, tailH: 110 });
        await me(L('I can\'t pound you into broken rice without getting closer.', 'Không lại gần thì làm sao em giã chị ra tấm được.'), { tail: 1560 });
        fx.sfx('ゴゴゴゴ', { x: 960, y: 170, style: 'menace', size: 120 });
        await say('tam', L('Oh ho! Then come as close as you like.', 'Ồ hô! Vậy thì cứ lại gần bao nhiêu tùy thích.'), { tail: 520, tailH: 110 });
      },
    };
    for (let i = 0; i < steps; i++) {
      ui.hideBox();
      ui.prompt(P.walk);
      await waitPress();
      ui.prompt(null);
      const t = (i + 1) / steps;
      sfx('step'); sfx('dodo', 0.12);
      TC.music.param('intensity', t);
      move('cam_walk', { x: U.lerp(CAM.far.x, CAM.x, t), y: U.lerp(CAM.far.y, CAM.y, t), scale: U.lerp(CAM.far.scale, 1, t) }, 420, 'cubic-bezier(.3,.6,.4,1)');
      move('tam_back', { x: -40 + t * 80, y: 20, scale: 1 + t * 0.02 }, 420);
      fx.sfx('ドドド', { x: 760 + Math.random() * 640, y: 110 + Math.random() * 170, style: 'dodoBlue', size: 120 + t * 50, rot: -14 + Math.random() * 10, anim: 'float', life: 1400 });
      fx.cam({ zoom: 1 + t * 0.06, x: -t * 20 }, 420);
      if (i === 2) fx.menace(true, { every: 480, style: 'dodoBlue', text: 'ド', count: 3, size: 110, spots: [[900, 150], [1300, 120], [1650, 220], [1100, 260]] });
      await wait(260);
      if (beats[i]) await beats[i]();
    }
    // the panel: freeze on the composition, framed like the page it came from
    fx.menace(false);
    ui.hideBox();
    sfx('dundun');
    fx.shake(12, 400);
    const frame = MG.panelFrame();
    const big = fx.sfx('ドドドドド', { x: 1240, y: 168, style: 'dodoBlue', size: 150, rot: -9, anim: 'stay', life: 99999, spacing: 0.02, stagger: 14, force: true });
    const big2 = fx.sfx('ド', { x: 128, y: 136, style: 'dodoBlue', size: 250, rot: -6, anim: 'stay', life: 99999, force: true });
    await wait(1400);
    MG._approachSfx = [big, big2, frame];
  };
  // tilted manga-panel border (paper gutter + ink rule) laid over the stage
  MG.panelFrame = function () {
    const P = [[46, 30], [1884, 54], [1862, 1046], [30, 1028]];
    const d = `M-20 -20 H1940 V1100 H-20 Z M${P.map((p) => p.join(' ')).join(' L')} Z`;
    const el = U.el('div', { class: 'ov' });
    el.innerHTML = `<svg viewBox="0 0 1920 1080" width="1920" height="1080"><path d="${d}" fill="#fbf5e6" fill-rule="evenodd"/>` +
      `<path d="M${P.map((p) => p.join(' ')).join(' L')} Z" fill="none" stroke="#140b16" stroke-width="9" stroke-linejoin="round"/></svg>`;
    $('panels').appendChild(el);
    el.animate([{ opacity: 0, transform: 'scale(1.06)' }, { opacity: 1, transform: 'scale(1)' }], { duration: TC.fastForward() ? 1 : 260, easing: 'cubic-bezier(.2,1.2,.4,1)', fill: 'forwards' });
    return el;
  };
  MG.clearApproach = () => { (MG._approachSfx || []).forEach((e) => e && e.remove()); MG._approachSfx = null; };

  /* ================================================================ stands */
  TC.stands = {
    tam: {
      name: 'STAYIN\' ALIVE', jp: '「ステイン・アライヴ」', color: '#f7c325', dark: '#6b4a00', art: 'stand_tam',
      user: L('STAND USER: TẤM', 'CHỦ STAND: TẤM'),
      stats: { power: 'B', speed: 'A', range: 'C', stamina: '∞', precision: 'A', potential: 'A' },
      note: L('Keeps coming back. Bird. Tree. Loom. Fruit. Folds betel leaves into phoenix wings at Speed A.', 'Chết rồi lại về. Chim. Cây. Khung cửi. Quả thị. Têm trầu cánh phượng với tốc độ A.'),
    },
    cam: {
      name: 'MAMMA MIA', jp: '「マンマ・ミーア」', color: '#ff6fa8', dark: '#6b0a33', art: 'stand_cam',
      user: L('STAND USER: CÁM', 'CHỦ STAND: CÁM'),
      stats: { power: 'A', speed: 'E', range: 'A', stamina: 'A', precision: 'E', potential: 'E' },
      note: L('It is literally her mom. Range: the entire village. Development potential: set in her ways.', 'Đúng nghĩa đen là mẹ nó. Tầm hoạt động: cả làng. Tiềm năng phát triển: bảo thủ.'),
    },
  };
  MG.standReveal = async function (who) {
    MG.clearApproach();
    ui.hideBox();
    await fx.standCard(TC.stands[who]);
  };

  /* ================================================================ the rush */
  MG.rush = async function () {
    const run = TC.run;
    ui.hideBox();
    MG.clearApproach();
    fx.menace(false);
    await bg('battle', { tr: 'flash', ms: 300 });
    TC.api.clearActors();
    fx.camReset();
    music('battle');
    await Promise.all([
      show('stand_tam', { x: -80, y: 120, w: 900, anim: 'left', z: 3, ms: 350 }),
      show('stand_cam', { x: 1030, y: 130, w: 900, anim: 'right', z: 3, ms: 350 }),
    ]);
    // meter
    const meter = U.el('div', { class: 'ov' });
    meter.innerHTML = `<div style="position:absolute;left:260px;right:260px;top:40px;height:54px;border:6px solid #000;background:#ff6fa8;box-shadow:8px 8px 0 #000;transform:skew(-10deg);overflow:hidden">
        <div class="mt" style="position:absolute;left:0;top:0;bottom:0;width:50%;background:#f7c325;border-right:8px solid #000;transition:width .08s"></div></div>
      <div style="position:absolute;left:200px;top:108px;font-family:var(--f-comic);font-size:38px;color:#f7c325;-webkit-text-stroke:2px #000">STAYIN' ALIVE</div>
      <div style="position:absolute;right:200px;top:108px;font-family:var(--f-comic);font-size:38px;color:#ff6fa8;-webkit-text-stroke:2px #000">MAMMA MIA</div>`;
    $('overlay').appendChild(meter);
    const mt = meter.querySelector('.mt');
    fx.speedLines(true, { type: 'radial', cx: 960, cy: 520, inner: 140, n: 120, color: 'rgba(20,11,22,.6)', rate: 45 });
    fx.sfx('ラッシュ!!', { x: 960, y: 520, style: 'impact', size: 200, life: 900, force: true });
    await wait(700);
    ui.prompt(P.mash);
    let p = 0, t0 = performance.now(), dur = TC.fastForward() ? 300 : 6500, lastTxtL = 0, lastTxtR = 0;
    const fistImgs = await TC.minigames.fists();
    const throwFist = (side) => {
      const fromL = side === 'L';
      const cx = 960 - p * 380;
      fx.burstImg(fromL ? fistImgs.gold : fistImgs.pink, fromL ? 520 : 1400, 420 + Math.random() * 260, cx + (fromL ? -30 : 30) + (Math.random() - 0.5) * 80, 380 + Math.random() * 300, fromL);
    };
    const onPress = () => {
      p = Math.min(1, p + 0.052);
      sfx('punch'); throwFist('R'); throwFist('R');
      const n = performance.now();
      if (n - lastTxtR > 140) { lastTxtR = n; fx.sfx(TC.t(L('BANG', 'BANG')), { x: 1350 + Math.random() * 420, y: 260 + Math.random() * 560, style: 'rushR', size: 90 + Math.random() * 60, life: 600, anim: 'pop' }); }
    };
    const off = TC.input.on('press', onPress);
    const offKey = TC.input.on('key', (e) => { if (e.repeat) return; if (/^[a-z]$/i.test(e.key) || e.key.startsWith('Arrow')) onPress(); });
    let won = false;
    await new Promise((res) => {
      const tick = () => {
        if (run.aborted) { res(); return; }
        const t = (performance.now() - t0) / dur;
        // Tấm pushes back harder over time (but stays beatable at ~6 presses/sec)
        p -= 0.0075 * (1 + t * 0.9);
        if (Math.random() < 0.55) throwFist('L');
        const n = performance.now();
        if (n - lastTxtL > 170) { lastTxtL = n; fx.sfx('BỐNG', { x: 150 + Math.random() * 420, y: 260 + Math.random() * 560, style: 'rushL', size: 90 + Math.random() * 60, life: 600, anim: 'pop' }); }
        if (Math.random() < 0.4) sfx('punch');
        p = U.clamp(p, -1, 1);
        mt.style.width = (50 - p * 45) + '%';
        fx.speedLines(true, { type: 'radial', cx: 960 - p * 380, cy: 520, inner: 140, n: 120, color: 'rgba(20,11,22,.6)', rate: 45 });
        fx.shakeSoft(6);
        if (t >= 1) { won = p > 0; res(); return; }
        setTimeout(tick, 50);
      };
      tick();
    });
    off(); offKey();
    ui.prompt(null);
    TC.guard(run);
    fx.speedLines(false);
    stopMusic(0.2);
    sfx('bigpunch'); sfx('boom', 0.1);
    fx.sfx('ドゴォォォン', { x: 960, y: 520, style: 'impact', size: 240, life: 2200, force: true });
    fx.shake(40, 1000);
    await fx.flash('#fff', 700, 1);
    move('stand_tam', { x: -900, rot: -30 }, 500);
    move('stand_cam', { x: 2000, rot: 30 }, 500);
    await wait(900);
    meter.remove();
    return won;
  };

  // pre-rendered fist sprites for the rush
  let fistCache = null;
  MG.fists = async function () {
    if (fistCache) return fistCache;
    const mk = async (col) => TC.gfx.canvas('fist:' + col, () => TC.art.prop.fist(col), 130, 110, 1);
    fistCache = { gold: await mk('#f7c325'), pink: await mk('#ff6fa8') };
    return fistCache;
  };

  MG.aftermath = async function () {
    fx.clearSfx();
    await bg('lying', { tr: 'black', ms: 1400 });
    TC.api.clearActors();
    music('wind');
    await wait(600);
  };

  /* ================================================================ endings */
  MG.bathTime = async function () {
    ui.hideBox();
    stopMusic(1);
    await show('bathpot', { x: 560, y: 260, w: 800, anim: 'up', z: 5, ms: 700, wait: true });
    sfx('bath'); sfx('bubble', 0.4);
    const stop = fx.emit('steam', { x: 960, y: 420, w: 500, every: 70, n: 1, angle: -Math.PI / 2, spread: 0.5, speed: 120, g: -30, size: 36, life: 2.2, drag: 0.99, grow: 1.4 });
    fx.sfx('グツグツ', { x: 1480, y: 330, style: 'impact', size: 150, life: 2400 });
    await wait(1600);
    MG._stopSteam = stop;
    music('canon');
  };
  MG.crowScene = async function () {
    if (MG._stopSteam) { MG._stopSteam(); MG._stopSteam = null; }
    await fx.flash('#fff', 900, 1);
    TC.api.clearActors();
    await bg('crow', { tr: 'black', ms: 1200 });
    sfx('crow');
    fx.sfx('カァ', { x: 1500, y: 170, style: 'impact', size: 120 });
  };
  MG.wryPose = async function () {
    ui.hideBox();
    stopMusic(0.2);
    fx.clearSfx();
    await fx.pulseShift(['negative', 'purple', 'negative', 'green'], 100);
    fx.shift('purple', 300);
    sfx('menace'); sfx('dundun');
    await show('stand_cam', { x: 520, y: 20, w: 900, anim: 'slam', z: 6 });
    fx.menace(true, { every: 180, style: 'menace', count: 4, size: 120 });
    fx.shake(22, 900);
    fx.sfx('ドボン', { x: 460, y: 760, style: 'cyan', size: 160 });
    sfx('splash', 0.5);
    await wait(1300);
    music('villain');
  };
  MG.erase = async function () {
    ui.hideBox();
    fx.menace(false);
    sfx('eraser');
    const w = U.el('div', { class: 'ov', style: { background: '#fbf5e4' } });
    w.style.clipPath = 'circle(0% at 50% 50%)';
    $('overlay').appendChild(w);
    await U.tween(2200, (t) => { w.style.clipPath = `circle(${t * 120}% at 50% 50%)`; });
    TC.api.clearActors(); fx.shift('none');
    await bg('void', { tr: 'cut' });
    await show('throne', { x: 760, y: 330, w: 400, anim: 'fade', z: 3 });
    await w.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, fill: 'forwards' }).finished;
    w.remove();
  };
  MG.runAway = async function (who) {
    ui.hideBox();
    MG.clearApproach();
    fx.menace(false);
    if (who === 'cam') {
      music('run');
      swap('cam_walk', 'run', { ms: 0 });
      sfx('whoosh');
      fx.sfx('ダダダダ', { x: 1500, y: 300, style: 'green', size: 140 });
      const e = fx.emit('dust', { x: 1350, y: 920, w: 80, every: 40, n: 2, angle: -Math.PI / 2, spread: 1.4, speed: 200, g: 100, size: 26, life: 0.9, drag: 0.96, grow: 1 });
      await move('cam_walk', { x: 2300, y: 120, scale: 0.85 }, 900, 'cubic-bezier(.6,0,.9,.5)');
      e();
    } else {
      sfx('whoosh');
      fx.sfx('ダダダダ', { x: 420, y: 300, style: 'gold', size: 140 });
      const e = fx.emit('dust', { x: 400, y: 960, w: 200, every: 40, n: 2, angle: -Math.PI / 2, spread: 1.4, speed: 220, g: 100, size: 30, life: 0.9, drag: 0.96, grow: 1 });
      await move('tam_back', { x: -1400, y: 20, scale: 1 }, 900, 'cubic-bezier(.6,0,.9,.5)');
      e();
    }
    await wait(400);
  };
  MG.bookAppear = async function () {
    ui.hideBox();
    stopMusic(0.5);
    await show('book', { variant: '0', x: 560, y: 190, w: 800, anim: 'pop', z: 6, ms: 500, wait: true });
    sfx('pageflip');
    fx.sfx('ゴゴゴ', { x: 1560, y: 230, style: 'gold', size: 120 });
  };
  MG.eatBook = async function (n) {
    ui.hideBox();
    sfx('munch');
    fx.sfx('モグモグ', { x: 700 + n * 200, y: 250 + n * 80, style: 'impact', size: 130 });
    fx.burst('paper', 960, 520, 14, { speed: 600, g: 700, size: 22, life: 1.6, vr: 8 });
    fx.shake(8, 400);
    if (n < 3) await swap('book', String(n));
    else { await hide('book', { anim: 'pop', ms: 300 }); sfx('gulp'); fx.sfx('ゴクリ', { x: 960, y: 500, style: 'impact', size: 170 }); music('ending'); }
    await wait(700);
  };
  MG.tears = async function () {
    ui.hideBox();
    stopMusic(2);
    sfx('cry');
    fx.burst('tear', 745, 505, 6, { angle: Math.PI / 2, spread: 1.2, speed: 160, g: 500, size: 14, life: 1.4 });
    await wait(500);
    fx.burst('tear', 745, 575, 5, { angle: Math.PI / 2, spread: 1.2, speed: 160, g: 500, size: 13, life: 1.4 });
    await wait(600);
  };
  MG.page47 = async function () {
    ui.hideBox();
    sfx('pageflip'); sfx('menace', 0.2);
    await show('page47', { x: 610, y: 60, w: 700, anim: 'down', z: 5, ms: 700, idle: 'bob', wait: true });
    fx.sfx('ゴゴゴゴ', { x: 1500, y: 180, style: 'menace', size: 130 });
    music('battle');
  };
  MG.doubleRush = async function () {
    const run = TC.run;
    ui.hideBox();
    const fistImgs = await MG.fists();
    ui.prompt(P.tear);
    let hits = 0;
    const need = TC.fastForward() ? 1 : 24;
    await new Promise((res) => {
      const off = TC.input.on('press', () => {
        if (TC.input.locked) return;
        hits++;
        sfx('punch');
        fx.burstImg(fistImgs.gold, 200, 500 + Math.random() * 400, 900 + Math.random() * 120, 300 + Math.random() * 300, true);
        fx.burstImg(fistImgs.pink, 1720, 500 + Math.random() * 400, 1020 + Math.random() * 120, 300 + Math.random() * 300, false);
        fx.sfx(hits % 2 ? 'BỐNG' : 'BANG', { x: 300 + Math.random() * 1300, y: 200 + Math.random() * 600, style: hits % 2 ? 'rushL' : 'rushR', size: 100 + Math.random() * 60, life: 600, anim: 'pop' });
        fx.shakeSoft(10);
        move('page47', { rot: (Math.random() - 0.5) * 6 }, 60);
        if (hits >= need) { off(); offA(); res(); }
      });
      const offA = TC.input.on('abort', () => { off(); offA(); res(); });
      if (TC.fastForward()) { off(); offA(); res(); }
    });
    ui.prompt(null);
    TC.guard(run);
    stopMusic(0.2);
    sfx('rip');
    fx.sfx('ビリィィッ', { x: 960, y: 420, style: 'impact', size: 220, life: 1800, force: true });
    fx.burst('paper', 960, 420, 40, { speed: 900, g: 500, size: 26, life: 2.2, vr: 10 });
    await hide('page47', { anim: 'pop', ms: 300 });
    fx.shake(30, 800);
    await fx.flash('#fff', 1400, 1);
  };
  MG.epilogue = async function () {
    ui.hideBox();
    TC.api.clearActors();
    fx.resetAll();
    await bg('riverbank', { tr: 'black', ms: 1600 });
    music('ending');
    fx.emit('petal', { x: 960, y: -30, w: 1900, every: 260, n: 1, angle: Math.PI / 2, spread: 0.6, speed: 80, g: 20, size: 12, life: 7, sway: 1.1, vr: 2 });
    await wait(1200);
  };
})();
