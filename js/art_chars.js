/* art_chars.js — characters. Each entry returns a self-contained <svg> string with its own viewBox. */
(function () {
  'use strict';
  const TC = window.TC, U = TC.util, K = TC.ink;
  const ART = (TC.art = TC.art || {});
  ART.ch = ART.ch || {};
  const INK = '#140b16';
  const r1 = K.r1;
  const sm = (pts, closed = true) => K.smooth(pts, closed);
  // filled shape with ink outline + offset "weight" shadow (manga inking)
  const inked = (d, fill, sw = 7, off = [4, 5]) =>
    `<path d="${d}" fill="${INK}" transform="translate(${off[0]} ${off[1]})"/><path d="${d}" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const line = (pts, w, o = {}) => `<path d="${K.taper(pts, w, o)}" fill="${o.fill || INK}"${o.op ? ` opacity="${o.op}"` : ''}/>`;
  const lines = (list, fill = INK, op) => `<path d="${list.join('')}" fill="${fill}"${op ? ` opacity="${op}"` : ''}/>`;
  const clip = (id, d) => `<clipPath id="${id}"><path d="${d}"/></clipPath>`;
  ART.util = { inked, line, lines, clip, sm };

  /* An axe built in its own frame so the head always sits on the haft: the haft runs along +y from the
     eye (0,0) to the butt (0,len); the blade grows toward +x, its cutting edge parallel to the haft.
     o: {x, y, rot, scale, dir (-1 mirrors), len, haftW, id, glint(fn(px,py) for an upright overlay)} */
  ART.axe = function (o = {}) {
    const len = o.len || 420, dir = o.dir || 1, sc = o.scale || 1, id = o.id || 'ax', hw = o.haftW || 24;
    const rot = ((o.rot || 0) * Math.PI) / 180, ca = Math.cos(rot), sa = Math.sin(rot);
    const at = (lx, ly) => [(o.x || 0) + (lx * dir * ca - ly * sa) * sc, (o.y || 0) + (lx * dir * sa + ly * ca) * sc];
    let s = `<defs><linearGradient id="${id}-w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#dcaa6c"/><stop offset=".45" stop-color="#a0703c"/><stop offset="1" stop-color="#5a3616"/></linearGradient>
      <linearGradient id="${id}-m" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="#f2f6fa"/><stop offset=".5" stop-color="#aeb9c5"/><stop offset="1" stop-color="#5d6976"/></linearGradient>
      <linearGradient id="${id}-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c3ccd6"/><stop offset="1" stop-color="#6c7784"/></linearGradient></defs>`;
    s += `<g transform="translate(${K.r1(o.x || 0)} ${K.r1(o.y || 0)}) rotate(${K.r1(o.rot || 0)}) scale(${sc * dir} ${sc})">`;
    // haft: a gentle S-curve that swells to a knob at the butt
    const haft = [[0, -22], [3, len * 0.35], [-3, len * 0.72], [2, len]];
    s += `<path d="${K.taper(haft, hw + 12, { s: 0, e: 0.03, min: 0.9 })}" fill="${INK}"/>`;
    s += `<path d="${K.taper(haft, hw, { s: 0, e: 0.03, min: 0.9 })}" fill="url(#${id}-w)"/>`;
    s += `<ellipse cx="2" cy="${len - 4}" rx="${hw * 0.78}" ry="${hw * 0.5}" fill="#7a4c22" stroke="${INK}" stroke-width="6"/>`;
    s += `<path d="${K.taper([[-hw * 0.2, 96], [-hw * 0.24, len * 0.5], [-hw * 0.18, len - 30]], 3.4, { s: 0.2, e: 0.3 })}" fill="#f1c98c" opacity=".75"/>`;
    s += `<path d="${K.taper([[hw * 0.22, 130], [hw * 0.18, len * 0.62]], 2.6, { s: 0.3, e: 0.3 })}" fill="${INK}" opacity=".45"/>`;
    // butt-end of the haft poking through the top of the eye, with its wedge
    s += `<path d="M${-hw / 2} -20 L${hw / 2} -20" stroke="${INK}" stroke-width="5"/><path d="M-2 -21 L2 2" stroke="${INK}" stroke-width="3.5"/>`;
    // poll (the flat back of the head)
    s += inked(`M-24 10 L-46 14 Q-50 41 -46 68 L-24 72 Z`, `url(#${id}-c)`, 6, [3, 4]);
    // cheek + bit: flares above and below the eye, cutting edge bowed outward
    const cheek = sm([[20, 8], [62, 4], [110, -8], [150, -28], [178, -50], [192, -12], [199, 40], [193, 92], [177, 134], [148, 118], [110, 96], [66, 82], [20, 74]]);
    s += inked(cheek, `url(#${id}-m)`, 6, [4, 5]);
    s += `<clipPath id="${id}-ck"><path d="${cheek}"/></clipPath><g clip-path="url(#${id}-ck)">`;
    s += `<path d="${sm([[20, 46], [80, 56], [140, 80], [196, 110], [200, 160], [20, 160]])}" fill="${INK}" opacity=".22"/>`;
    s += `<path d="${sm([[150, -60], [172, -30], [178, 40], [170, 112], [150, 150], [220, 150], [220, -60]])}" fill="#f7fbff"/>`;
    s += `<path d="${sm([[156, -40], [174, -8], [180, 40], [174, 92], [158, 126]], false)}" fill="none" stroke="#7d8a98" stroke-width="3"/></g>`;
    s += `<path d="${sm([[182, -38], [193, -6], [198, 40], [192, 90], [180, 122]], false)}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`;
    s += `<path d="${K.taper([[44, 22], [96, 14], [140, -4]], 9, { s: 0.2, e: 0.6 })}" fill="#fff" opacity=".85"/>`;
    // eye collar wrapped round the haft
    s += inked(`M-24 0 Q-24 -6 -18 -6 L20 -6 Q26 -6 26 0 L26 82 Q26 88 20 88 L-18 88 Q-24 88 -24 82 Z`, `url(#${id}-c)`, 6, [3, 4]);
    s += `<path d="M-10 -2 L-10 84" stroke="#fff" stroke-width="5" opacity=".7"/><path d="M14 0 L14 84" stroke="${INK}" stroke-width="3" opacity=".35"/>`;
    s += `</g>`;
    if (o.glint) s += o.glint(at);
    return s;
  };

  /* =====================================================================
     TẤM — back view from below, striding toward Cám (DIO's pose in the panel). 1000×1240
     ===================================================================== */
  ART.ch.tam_back = function () {
    // the DIO of the panel: seen from behind and below, striding right; shoulders tipped up toward Cám,
    // both arms hanging loose and away from the body, near leg planted and running off the bottom of the frame.
    const SK = '#f3cda6', HAIR = '#15132e', HL = '#4d5aa8';
    const torso = sm([[300, 266], [222, 304], [154, 352], [128, 396], [150, 476], [190, 562], [228, 640], [360, 612], [484, 560], [488, 460], [494, 350], [486, 266], [440, 240], [380, 254]]);
    const armL = sm([[162, 354], [118, 404], [84, 476], [58, 566], [56, 626], [70, 684], [122, 686], [118, 626], [126, 566], [152, 486], [190, 424]]);
    const armR = sm([[468, 252], [514, 272], [542, 330], [568, 420], [602, 490], [644, 552], [614, 578], [572, 524], [534, 452], [504, 380], [478, 322]]);
    const legNear = sm([[238, 650], [444, 690], [438, 800], [424, 900], [420, 1000], [428, 1120], [442, 1250], [198, 1250], [212, 1120], [234, 1000], [260, 900], [246, 780]]);
    const legFar = sm([[420, 690], [524, 636], [606, 688], [690, 752], [728, 806], [770, 880], [826, 944], [796, 972], [748, 956], [700, 902], [656, 852], [616, 828], [540, 800], [466, 764]]);
    const flap = sm([[226, 628], [360, 604], [480, 552], [452, 650], [380, 740], [290, 818], [196, 860], [150, 836], [192, 740]]);
    const head = sm([[290, 150], [318, 110], [376, 94], [434, 112], [462, 158], [466, 216], [444, 262], [396, 282], [340, 278], [300, 248], [284, 200]]);
    const tail = sm([[330, 270], [410, 270], [440, 330], [436, 400], [408, 460], [374, 500], [346, 460], [320, 400], [316, 330]]);
    const bun = sm([[316, 122], [334, 74], [388, 56], [442, 74], [454, 116], [424, 142], [366, 144]]);
    const handL = sm([[62, 680], [124, 684], [136, 730], [118, 774], [82, 778], [58, 742]]);
    const handR = sm([[608, 562], [654, 548], [686, 584], [682, 628], [650, 642], [620, 614]]);
    const hai = sm([[772, 948], [832, 934], [894, 944], [932, 966], [912, 990], [842, 998], [774, 990]]);
    const LEAN = 'rotate(7 360 640)';
    const sil = [legNear, legFar, flap, hai].map((d) => `<path d="${d}"/>`).join('') + `<g transform="${LEAN}">` + [torso, armL, armR, tail, head, bun, handL, handR].map((d) => `<path d="${d}"/>`).join('') + `</g>`;
    const rnd = U.rng(314);
    let s = `<defs>${clip('tb-torso', torso)}${clip('tb-flap', flap)}${clip('tb-ln', legNear)}${clip('tb-lf', legFar)}${clip('tb-al', armL)}${clip('tb-ar', armR)}
      <linearGradient id="tb-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe98a"/><stop offset=".45" stop-color="#f7c325"/><stop offset="1" stop-color="#c98a0e"/></linearGradient>
      <linearGradient id="tb-silk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff0b0"/><stop offset=".5" stop-color="#f2c94c"/><stop offset="1" stop-color="#b07c18"/></linearGradient></defs>`;

    // ---------------------------------------------------------------- aura: flame band round the silhouette, tongues licking up-left
    const flames = [];
    const edge = [[198, 1240], [234, 1000], [260, 900], [150, 836], [190, 562], [58, 742], [56, 626], [84, 476], [154, 352], [300, 266], [284, 200], [316, 122], [388, 56], [454, 116], [466, 216], [514, 272], [568, 420], [644, 552], [686, 584], [718, 830], [822, 940], [932, 966], [912, 990], [442, 1240]];
    const la = (7 * Math.PI) / 180;
    edge.forEach(([x0, y0]) => {
      const up = y0 < 640 && !(x0 > 640 && y0 > 560);
      const x = up ? 360 + (x0 - 360) * Math.cos(la) - (y0 - 640) * Math.sin(la) : x0;
      const y = up ? 640 + (x0 - 360) * Math.sin(la) + (y0 - 640) * Math.cos(la) : y0;
      for (let k = 0; k < 3; k++) {
        const h = 60 + rnd() * 120, lean = -40 - rnd() * 80;
        const bx = x + (rnd() - 0.5) * 50, by = y + (rnd() - 0.5) * 40;
        flames.push(K.taper([[bx, by], [bx + lean * 0.4, by - h * 0.55], [bx + lean, by - h]], 34 + rnd() * 30, { s: 0.05, e: 1, min: 0 }));
      }
    });
    s += `<g opacity=".92"><path d="${flames.join('')}" fill="#3fe6ff"/><g fill="#3fe6ff" stroke="#3fe6ff" stroke-width="78" stroke-linejoin="round">${sil}</g></g>`;
    s += `<g fill="#bff8ff" stroke="#bff8ff" stroke-width="32" stroke-linejoin="round">${sil}</g>`;
    s += `<g fill="${INK}" stroke="${INK}" stroke-width="14" stroke-linejoin="round" transform="translate(6 7)">${sil}</g>`;

    // ---------------------------------------------------------------- far leg (stepping toward Cám) + the hài
    s += inked(legFar, 'url(#tb-silk)', 7);
    s += `<g clip-path="url(#tb-lf)"><path d="${sm([[480, 740], [600, 680], [700, 790], [830, 950], [760, 980], [660, 890], [560, 820]])}" fill="${INK}" opacity=".5"/>`;
    s += K.hatch({ x: 480, y: 640, w: 360, h: 340 }, { angle: 55, gap: 12, w: 2.6, seed: 6, color: INK, op: 0.45, fade: [0.2, 0.5] }) + `</g>`;
    s += line([[480, 730], [590, 800], [700, 880]], 4, { s: 0.2, e: 0.5 }) + line([[560, 690], [660, 770]], 3.4, { fill: '#fff6d0', op: 0.8 });
    s += inked(hai, '#d62828', 6);
    s += `<path d="${sm([[792, 968], [856, 960], [916, 972]], false)}" fill="none" stroke="#ffcf5a" stroke-width="5"/>`;
    s += `<path d="M830 950 q8 -10 16 0 q8 -10 16 0" fill="none" stroke="#ffcf5a" stroke-width="4"/>` + `<circle cx="926" cy="970" r="7" fill="#ffcf5a" stroke="${INK}" stroke-width="3"/>`;

    // ---------------------------------------------------------------- near leg (planted, foreshortened, wide silk trousers)
    s += inked(legNear, 'url(#tb-silk)', 8, [6, 7]);
    s += `<g clip-path="url(#tb-ln)"><path d="${sm([[380, 680], [450, 700], [430, 900], [430, 1100], [450, 1260], [340, 1260], [336, 1100], [350, 900], [340, 760]])}" fill="${INK}" opacity=".55"/>`;
    s += K.hatch({ x: 300, y: 720, w: 140, h: 540 }, { angle: 80, gap: 13, w: 3, seed: 8, color: INK, op: 0.5, fade: [0.15, 0.45] }) + `</g>`;
    [[[270, 760], [262, 920], [250, 1100], [240, 1240]], [[320, 800], [306, 1000], [300, 1240]]].forEach((p) => (s += line(p, 6, { s: 0.15, e: 0.6 })));
    s += line([[236, 860], [226, 1020], [222, 1180]], 4, { fill: '#fff6d0', op: 0.85 });

    // ---------------------------------------------------------------- áo: back flap swinging left, then the body
    s += inked(flap, 'url(#tb-gold)', 7);
    s += `<g clip-path="url(#tb-flap)"><path d="${sm([[360, 610], [480, 552], [452, 650], [380, 740], [300, 800], [350, 700]])}" fill="${INK}" opacity=".45"/>`;
    s += `<path d="M120 800 Q260 820 420 700 L460 760 L300 880 L120 900Z" fill="#8a1c1c"/>`;
    for (let i = 0; i < 6; i++) { const x = 176 + i * 40, y = 818 - i * 26; s += `<path d="M${x} ${y} q10 -17 20 0 q10 17 20 0" fill="none" stroke="#ffcf5a" stroke-width="4" transform="rotate(-32 ${x} ${y})"/>`; }
    s += `</g>`;
    s += line([[290, 660], [250, 740], [200, 810]], 5, { s: 0.15, e: 0.6 }) + line([[400, 620], [350, 700], [290, 770]], 5, { s: 0.15, e: 0.6 });
    s += `<g transform="${LEAN}">` + inked(torso, 'url(#tb-gold)', 8, [6, 7]);
    s += `<g clip-path="url(#tb-torso)">`;
    s += `<path d="${sm([[440, 240], [486, 266], [494, 350], [488, 460], [484, 560], [420, 590], [440, 460], [446, 330]])}" fill="${INK}" opacity=".7"/>`;
    s += K.hatch({ x: 400, y: 280, w: 90, h: 320 }, { angle: 80, gap: 12, w: 3, seed: 3, color: INK, op: 0.5, fade: [0.2, 0.5] });
    s += `<path d="${sm([[154, 352], [222, 304], [240, 400], [236, 520], [200, 580]])}" fill="${INK}" opacity=".28"/>`;
    // phoenix roundel on the back
    const PH = '#9a5a00';
    s += `<circle cx="330" cy="500" r="62" fill="#ffd84a" stroke="${INK}" stroke-width="5"/><circle cx="330" cy="500" r="51" fill="none" stroke="#b37a00" stroke-width="3" stroke-dasharray="9 6"/>`;
    s += `<g transform="translate(330 500) scale(.7) translate(-452 -468)">`;
    s += `<path d="${sm([[508, 404], [520, 412], [512, 424], [490, 444], [470, 474], [446, 500], [420, 512], [430, 494], [452, 468], [474, 438], [494, 414]])}" fill="${PH}"/>`;
    s += `<path d="${sm([[476, 446], [446, 414], [410, 398], [376, 404], [396, 416], [372, 426], [398, 436], [380, 450], [412, 454], [444, 462]])}" fill="${PH}"/>`;
    s += line([[440, 500], [410, 536], [388, 544], [376, 528], [392, 518]], 9, { s: 0.05, e: 0.6, fill: PH }) + line([[450, 500], [448, 540], [470, 556], [486, 542], [474, 530]], 8, { s: 0.05, e: 0.6, fill: PH });
    s += `</g>`;
    // folds from the shoulder blades
    s += line([[226, 330], [236, 440], [222, 540]], 5, { s: 0.2, e: 0.5 }) + line([[452, 300], [446, 420]], 4, { s: 0.2, e: 0.5, fill: '#fff4b0', op: 0.7 });
    s += `</g>`;
    // sash round the waist (rising toward the stepping side), knot and ribbons streaming back
    s += inked(sm([[216, 604], [360, 578], [490, 520], [494, 568], [364, 628], [222, 660]]), '#d62828', 6);
    s += inked(sm([[344, 616], [294, 710], [224, 806], [160, 900], [136, 930], [164, 940], [222, 880], [314, 756], [372, 650]]), '#d62828', 5);
    s += inked(sm([[372, 626], [346, 730], [306, 840], [282, 906], [308, 914], [346, 846], [390, 740], [398, 636]]), '#b21e1e', 5);
    s += inked(sm([[338, 596], [370, 578], [406, 594], [398, 640], [352, 644]]), '#ff4d4d', 5);
    s += line([[262, 770], [198, 880]], 4, { fill: '#fff', op: 0.7 }) + `</g>`;

    // ---------------------------------------------------------------- arms hanging loose, hands half-open
    s += `<g transform="${LEAN}">`;
    s += inked(armL, 'url(#tb-gold)', 7);
    s += `<g clip-path="url(#tb-al)"><path d="${sm([[170, 360], [200, 420], [150, 500], [128, 600], [124, 700], [96, 700], [100, 590], [124, 480]])}" fill="${INK}" opacity=".55"/></g>`;
    s += line([[128, 420], [96, 520], [82, 620]], 4, { fill: '#fff4b0', op: 0.8 }) + line([[146, 500], [120, 590]], 4, { s: 0.3, e: 0.5 });
    s += `<path d="M64 672 Q94 686 124 676" fill="none" stroke="${INK}" stroke-width="22"/><path d="M64 672 Q94 686 124 676" fill="none" stroke="#d62828" stroke-width="13"/>`;
    s += inked(handL, SK, 5);
    s += line([[76, 732], [74, 770]], 3) + line([[92, 736], [92, 776]], 3) + line([[108, 732], [110, 770]], 3) + `<path d="M62 684 L124 688 L128 706 L60 702Z" fill="${INK}" opacity=".3"/>`;
    s += inked(armR, 'url(#tb-gold)', 7);
    s += `<g clip-path="url(#tb-ar)"><path d="${sm([[500, 262], [548, 330], [580, 430], [630, 520], [650, 560], [624, 580], [580, 510], [530, 410]])}" fill="${INK}" opacity=".7"/></g>`;
    s += line([[486, 290], [520, 390], [560, 470]], 4, { fill: '#fff4b0', op: 0.75 });
    s += `<path d="M608 566 Q630 562 650 548" fill="none" stroke="${INK}" stroke-width="22"/><path d="M608 566 Q630 562 650 548" fill="none" stroke="#d62828" stroke-width="13"/>`;
    s += inked(handR, SK, 5);
    s += line([[644, 596], [662, 630]], 3) + line([[632, 604], [646, 636]], 3) + line([[656, 586], [676, 614]], 3);

    // ---------------------------------------------------------------- head from behind, glancing right; hair tail down the back
    s += inked(sm([[330, 230], [410, 230], [414, 282], [326, 282]]), '#e8b88c', 5);
    s += inked(tail, HAIR, 6);
    const strands = [];
    for (let i = 0; i < 10; i++) { const x = 324 + i * 10; strands.push(K.taper([[x + 6, 242], [x + (370 - x) * 0.2, 360], [370 + (x - 370) * 0.3, 480]], 3.4, { s: 0.2, e: 0.6 })); }
    s += lines(strands, HL, 0.8);
    s += inked(sm([[300, 266], [370, 248], [446, 266], [440, 300], [370, 286], [306, 302]]), '#8a1c1c', 5);
    // a sliver of cheek, jaw and ear on the right: she is looking at Cám
    s += inked(sm([[430, 140], [470, 150], [492, 186], [490, 226], [466, 252], [436, 256]]), SK, 5);
    s += `<path d="${sm([[488, 180], [502, 192], [490, 202]], false)}" fill="${SK}" stroke="${INK}" stroke-width="4"/>`;
    s += line([[478, 160], [500, 150]], 5, { s: 0.05, e: 0.9 }) + line([[482, 166], [506, 162]], 4, { s: 0.05, e: 0.9 });
    s += `<path d="M430 140 L456 150 L456 256 L436 256Z" fill="${INK}" opacity=".25"/>`;
    s += line([[452, 190], [452, 206]], 3) + `<circle cx="452" cy="216" r="8" fill="#ffd84a" stroke="${INK}" stroke-width="3"/>`;
    s += inked(head, HAIR, 7);
    const hs = [];
    for (let i = 0; i < 14; i++) { const x = 306 + i * 11 + rnd() * 6; hs.push(K.taper([[x, 256], [x + (380 - x) * 0.4, 180], [380 + (x - 380) * 0.25, 100]], 4, { s: 0.3, e: 0.6 })); }
    s += `<clipPath id="tb-hd"><path d="${head}"/></clipPath><g clip-path="url(#tb-hd)">${lines(hs, HL, 0.8)}<path d="M430 90 L500 130 L500 270 L430 270 Z" fill="${INK}" opacity=".5"/></g>`;
    s += inked(bun, '#1b1a3c', 6);
    s += line([[340, 90], [380, 60], [430, 60]], 4, { fill: HL }) + line([[346, 108], [396, 96], [440, 100]], 4, { fill: HL });
    // gold trâm through the bun + beads + the heart ornament
    s += line([[262, 134], [500, 44]], 12, { s: 0.02, e: 0.3, min: 0.4 }) + line([[266, 132], [496, 46]], 7, { s: 0.02, e: 0.3, min: 0.4, fill: '#ffd84a' });
    [[276, 146], [282, 174], [288, 200]].forEach(([x, y]) => (s += `<circle cx="${x}" cy="${y}" r="9" fill="#e0302a" stroke="${INK}" stroke-width="3"/>`));
    s += line([[270, 134], [288, 206]], 2.5);
    s += `<path d="M394 26 c-14 -18 -40 -6 -30 14 l30 28 l30 -28 c10 -20 -16 -32 -30 -14z" fill="#ffd84a" stroke="${INK}" stroke-width="5" transform="translate(0 12)"/>`;
    s += line([[300, 200], [250, 216], [204, 206]], 4, { s: 0.2, e: 0.9 }) + line([[298, 160], [248, 158], [212, 140]], 3, { s: 0.2, e: 0.9 });
    return K.svg(1000, 1240, s + `</g>`);
  };

  /* =====================================================================
     CÁM — 3/4 view facing left, mid-stride (Jotaro's pose in the panel). 560×1040. variants: walk | run
     ===================================================================== */
  ART.ch.cam_walk = function (v) {
    // the Jotaro of the panel: 3/4 view facing left, leaning in mid-stride, open coat streaming back,
    // near hand hanging loose, rear heel lifted. 'run' = the same girl turned tail (mirrored), sprinting away.
    const run = v === 'run';
    const COAT = '#2f2770', COAT_HI = '#5c4bc0', COAT_SH = '#110d2e', LINING = '#cfc8ea', PANTS = '#1d1846', SKIN = '#f0c9a0', SHOE = '#3b2418';
    let s = `<defs><linearGradient id="cw-coat${run ? 'r' : ''}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${COAT_HI}"/><stop offset=".4" stop-color="${COAT}"/><stop offset="1" stop-color="${COAT_SH}"/></linearGradient>
      <linearGradient id="cw-hat${run ? 'r' : ''}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e6b4"/><stop offset="1" stop-color="#cfae62"/></linearGradient></defs>`;
    const CG = `url(#cw-coat${run ? 'r' : ''})`, HG = `url(#cw-hat${run ? 'r' : ''})`;
    if (run) s += `<g transform="translate(560 0) scale(-1 1)">`;
    const body = run ? 'rotate(-12 260 560)' : 'rotate(-9 260 560)';

    // axe slung across the back: head over the far shoulder, blade turned away from her neck
    s += `<g transform="${body}">` + ART.axe({ x: 372, y: 196, rot: 30, scale: 0.42, dir: 1, len: 1180, haftW: 26, id: `cwax${run ? 'r' : ''}` }) + `</g>`;

    // coat tails streaming back (behind the legs), lining showing
    const tails = run
      ? sm([[300, 540], [400, 560], [500, 590], [552, 640], [520, 700], [440, 690], [360, 660], [300, 640]])
      : sm([[290, 530], [380, 560], [460, 610], [520, 690], [536, 780], [470, 790], [420, 760], [360, 720], [300, 690]]);
    s += inked(tails, CG, 7);
    s += `<path d="${run ? sm([[330, 590], [460, 610], [530, 650], [500, 690], [400, 670]]) : sm([[330, 600], [440, 640], [500, 700], [520, 770], [470, 780], [410, 720]])}" fill="${LINING}" stroke="${INK}" stroke-width="4"/>`;
    s += line(run ? [[320, 560], [440, 600], [540, 650]] : [[310, 560], [420, 620], [500, 720]], 4, { s: 0.2, e: 0.6, fill: COAT_HI });

    // legs
    const legFront = run
      ? sm([[206, 560], [286, 580], [260, 620], [200, 650], [140, 660], [130, 700], [146, 780], [150, 840], [104, 846], [96, 760], [86, 690], [100, 630], [150, 600]])
      : sm([[196, 556], [288, 580], [258, 680], [222, 772], [202, 860], [190, 950], [138, 952], [136, 860], [146, 764], [164, 660]]);
    const legBack = run
      ? sm([[262, 580], [334, 560], [370, 640], [400, 700], [460, 760], [520, 800], [504, 840], [440, 812], [370, 760], [320, 700], [280, 640]])
      : sm([[262, 580], [332, 558], [352, 660], [366, 742], [404, 802], [452, 858], [470, 884], [438, 906], [392, 862], [334, 804], [300, 744], [272, 660]]);
    s += inked(legBack, PANTS, 6);
    s += line(run ? [[300, 620], [380, 720], [480, 790]] : [[300, 620], [330, 720], [400, 820]], 4, { s: 0.2, e: 0.5, fill: COAT_HI, op: 0.8 });
    s += inked(run ? sm([[496, 788], [544, 800], [560, 838], [520, 852], [490, 836]]) : sm([[436, 866], [482, 870], [516, 902], [500, 920], [454, 918], [426, 900]]), SHOE, 5);
    s += inked(legFront, PANTS, 6);
    s += line(run ? [[200, 610], [130, 660], [116, 760]] : [[230, 620], [196, 760], [170, 900]], 4, { s: 0.2, e: 0.5, fill: COAT_HI, op: 0.8 });
    s += inked(run ? sm([[80, 836], [150, 832], [162, 862], [84, 870]]) : sm([[84, 944], [192, 940], [204, 972], [196, 986], [88, 990], [76, 970]]), SHOE, 5);
    if (!run) s += `<path d="M84 978 L198 976" stroke="${INK}" stroke-width="4"/>`;

    s += `<g transform="${body}">`;
    // far arm: barely visible behind the torso
    s += run
      ? inked(sm([[290, 320], [360, 360], [420, 380], [460, 360], [470, 392], [420, 420], [350, 410], [290, 380]]), COAT_SH, 5) + inked(sm([[452, 350], [490, 344], [500, 380], [470, 398]]), SKIN, 4)
      : inked(sm([[300, 330], [334, 420], [340, 520], [316, 560], [292, 520], [296, 420]]), COAT_SH, 5);
    // torso: open coat, lavender áo underneath, high collar
    const torso = sm([[196, 290], [168, 340], [150, 420], [160, 500], [184, 560], [320, 560], [330, 460], [324, 360], [300, 300], [246, 278]]);
    s += inked(torso, CG, 7);
    s += `<path d="${sm([[268, 284], [300, 300], [324, 360], [330, 460], [320, 560], [270, 560], [290, 440], [282, 340]])}" fill="${COAT_SH}" opacity=".75"/>`;
    s += K.hatch({ x: 250, y: 320, w: 80, h: 230 }, { angle: 75, gap: 10, w: 2.6, seed: 12, color: COAT_HI, op: 0.45 });
    s += inked(sm([[196, 312], [244, 304], [252, 400], [240, 500], [204, 540], [176, 500], [174, 420], [184, 352]]), '#9c7bd6', 5);
    s += line([[204, 360], [196, 460], [204, 520]], 4, { fill: '#c8b4f0', op: 0.9 });
    s += line([[186, 320], [168, 420], [182, 552]], 6, { s: 0.05, e: 0.1, min: 0.6, fill: COAT_HI }) + line([[248, 306], [262, 420], [254, 552]], 6, { s: 0.05, e: 0.1, min: 0.6 });
    s += inked(sm([[170, 540], [330, 534], [334, 570], [172, 580]]), '#6b1c3c', 5);
    // collar + the coin chain (tiền đồng) hanging from it, Jotaro-style
    s += inked(sm([[190, 276], [252, 266], [266, 310], [196, 318]]), COAT_SH, 5);
    // near arm: hangs loose in front of the coat (walk) / pumps forward (run)
    if (run) {
      s += inked(sm([[196, 312], [150, 340], [104, 360], [70, 330], [60, 300], [90, 290], [124, 316], [170, 300]]), CG, 6);
      s += inked(sm([[40, 268], [84, 262], [96, 300], [66, 318], [38, 302]]), SKIN, 5);
      s += line([[50, 284], [84, 280]], 2.6) + line([[48, 296], [80, 296]], 2.6);
    } else {
      s += inked(sm([[194, 310], [160, 360], [140, 440], [134, 520], [140, 580], [178, 584], [178, 520], [186, 440], [214, 360]]), CG, 6);
      s += `<path d="${sm([[196, 330], [214, 360], [190, 440], [180, 520], [178, 580], [162, 580], [168, 460]])}" fill="${COAT_SH}" opacity=".5"/>`;
      s += `<path d="M136 556 Q158 566 180 558" fill="none" stroke="#d4a017" stroke-width="7"/>`;
      s += inked(sm([[136, 574], [180, 576], [190, 612], [174, 648], [146, 650], [130, 616]]), SKIN, 5);
      s += line([[148, 616], [146, 646]], 2.6) + line([[160, 618], [160, 648]], 2.6) + line([[172, 614], [176, 640]], 2.6);
    }
    let coins = '';
    for (let i = 0; i < 6; i++) { const t = i / 5, x = 214 + Math.sin(t * Math.PI) * 10 + t * 8, y = 316 + t * 70; coins += `<circle cx="${K.r1(x)}" cy="${K.r1(y)}" r="8" fill="#e0b52a" stroke="${INK}" stroke-width="3"/><rect x="${K.r1(x - 2.6)}" y="${K.r1(y - 2.6)}" width="5.2" height="5.2" fill="${INK}"/>`; }
    s += coins;
    // neck + face in 3/4 profile, eyes glinting under the brim's shadow
    s += inked(sm([[206, 236], [252, 236], [256, 284], [204, 286]]), '#d9a57c', 4);
    s += `<path d="M206 256 L254 256 L256 284 L204 286Z" fill="${INK}" opacity=".4"/>`;
    const faceD = sm([[170, 146], [262, 144], [270, 192], [262, 230], [240, 258], [206, 268], [178, 254], [160, 232], [152, 214], [140, 206], [150, 194], [156, 172]]);
    s += inked(faceD, '#f0c9a0', 5);
    s += `<clipPath id="cw-face${run ? 'r' : ''}"><path d="${faceD}"/></clipPath><g clip-path="url(#cw-face${run ? 'r' : ''})">` +
      `<path d="M130 140 L280 140 L280 182 Q210 176 130 186Z" fill="${INK}" opacity=".85"/>` +
      K.hatch({ x: 130, y: 178, w: 150, h: 16 }, { angle: 8, gap: 5, w: 2, seed: 4, color: INK, op: 0.7 }) +
      `<path d="M236 150 L282 150 L268 240 L232 250Z" fill="${INK}" opacity=".28"/></g>`;
    if (run) {
      s += `<circle cx="178" cy="196" r="9" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="176" cy="196" r="3" fill="${INK}"/><circle cx="214" cy="198" r="11" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="210" cy="198" r="3.4" fill="${INK}"/>`;
      s += `<ellipse cx="188" cy="236" rx="14" ry="16" fill="${INK}"/><ellipse cx="188" cy="242" rx="8" ry="7" fill="#c0392b"/>`;
      s += `<path d="M276 170 q14 18 0 30 q-14 -12 0 -30z" fill="#9fe3ff" stroke="${INK}" stroke-width="3"/><path d="M290 214 q10 14 0 22 q-10 -8 0 -22z" fill="#9fe3ff" stroke="${INK}" stroke-width="3"/>`;
    } else {
      s += `<path d="M168 198 Q178 190 190 196 Q180 202 168 198Z" fill="#fff" stroke="${INK}" stroke-width="2.2"/><circle cx="176" cy="197" r="3.6" fill="#2b2466"/>`;
      s += `<path d="M200 198 Q216 186 232 196 Q216 204 200 198Z" fill="#fff" stroke="${INK}" stroke-width="2.6"/><circle cx="210" cy="197" r="5" fill="#2b2466"/><circle cx="212" cy="195" r="1.8" fill="#fff"/>`;
      s += line([[162, 184], [190, 192]], 6, { s: 0.1, e: 0.4 }) + line([[198, 194], [236, 182]], 6.5, { s: 0.3, e: 0.1 });
      s += line([[200, 202], [230, 200]], 2.4, { op: 0.7 });
      s += line([[160, 226], [176, 230], [194, 228]], 3.4, { s: 0.3, e: 0.3 });
      s += `<path d="M150 214 L144 206 L154 200" fill="none" stroke="${INK}" stroke-width="2.6"/>`;
    }
    // hair: long and black, streaming back from under the hat
    s += inked(run ? sm([[250, 150], [320, 150], [400, 170], [460, 200], [400, 210], [330, 230], [270, 250], [252, 200]]) : sm([[250, 148], [300, 150], [334, 200], [350, 270], [330, 330], [296, 300], [270, 250], [254, 200]]), '#15122e', 5);
    s += line(run ? [[270, 170], [360, 180], [440, 196]] : [[268, 170], [300, 220], [318, 290]], 3.4, { fill: '#3d4a98' });
    // nón lá, tipped forward over the eyes
    const hat = sm([[256, 16], [312, 66], [376, 110], [424, 130], [374, 154], [250, 178], [130, 176], [82, 166], [130, 136], [196, 78]]);
    s += inked(hat, HG, 7);
    const ribs = [];
    for (let i = 1; i <= 5; i++) { const t = i / 6; ribs.push(K.taper([[256 - 174 * t, 16 + 150 * t], [250, 16 + 162 * t], [256 + 168 * t, 16 + 114 * t]], 3, { s: 0.2, e: 0.2 })); }
    s += lines(ribs, '#8a6a2a');
    s += `<path d="M256 16 L424 130 L374 154 L250 178Z" fill="#8a6a2a" opacity=".32"/>`;
    s += line([[82, 166], [250, 182], [424, 130]], 8, { s: 0.05, e: 0.05, min: 0.6 });
    s += `<path d="M150 178 Q160 214 172 250" fill="none" stroke="#8a6a2a" stroke-width="3" opacity=".8"/>`;
    s += `</g>`;
    if (run) s += `</g>`;
    return K.svg(560, 1040, s);
  };
  /* =====================================================================
     THE ARECA TREE (actor so it can fall). 900×1200. variants: tam | empty
     ===================================================================== */
  ART.ch.areca = function (v) {
    const lib = ART.lib;
    const C = [470, 190];
    let s = `<defs><linearGradient id="ar-trunk" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8d7a64"/><stop offset=".42" stop-color="#eadbbd"/><stop offset=".62" stop-color="#cbb591"/><stop offset="1" stop-color="#5e4c3c"/></linearGradient></defs>`;
    const trunk = [[440, 1210], [452, 900], [462, 560], [C[0], C[1] + 30]];
    s += `<path d="${K.taper(trunk, 132, { s: 0, e: 0.02, min: 0.32, profile: (t) => 1 - t })}" fill="${INK}" transform="translate(7 0)"/>`;
    s += `<path d="${K.taper(trunk, 120, { s: 0, e: 0.02, min: 0.32, profile: (t) => 1 - t })}" fill="url(#ar-trunk)"/>`;
    const S = K.sample(trunk, false, 4), rings = [];
    let acc = 0;
    for (let i = 3; i < S.length - 2; i++) {
      const t = i / S.length, gap = 9 + (1 - t) * 24;
      acc += Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]);
      if (acc < gap) continue; acc = 0;
      const w = 120 * (0.32 + 0.68 * (1 - t)) * 0.5;
      rings.push(K.taper([[S[i][0] - w, S[i][1] + 3], [S[i][0], S[i][1] - 2], [S[i][0] + w, S[i][1] + 3]], 2 + 3.5 * (1 - t), { s: 0.2, e: 0.2 }));
    }
    s += `<path d="${rings.join('')}" fill="${INK}" opacity=".78"/>`;
    s += `<path d="${K.taper(trunk.map((p, i) => [p[0] + 34 * (1 - i / 3) + 6, p[1]]), 38, { s: 0, e: 0.05, min: 0.3, profile: (t) => 1 - t })}" fill="url(#lines-d)" opacity=".75"/>`;
    s += `<path d="${K.taper(trunk.map((p, i) => [p[0] - 30 * (1 - i / 3), p[1]]), 10, { s: 0, e: 0.05, min: 0.3, profile: (t) => 1 - t })}" fill="#fff" opacity=".55"/>`;
    // crown
    s += lib.areca(C[0], C[1] + 14, C[1], { scale: 2.2, seed: 7, fronds: 12, frond: 180, nuts: true, w: 0, trunkFill: 'none' });
    if (v !== 'empty') {
      // Tấm hugging the trunk just under the crown, waving (peasant brown áo, before she's queen)
      const x = C[0] + 26, y = C[1] + 70;
      s += `<g transform="translate(${x} ${y})">`;
      s += inked(sm([[-26, 40], [-30, 90], [-14, 132], [14, 136], [30, 96], [26, 42], [0, 30]]), '#8a5a34', 4); // body
      s += inked(sm([[-14, 128], [-40, 150], [-60, 146], [-44, 128]]), '#6b4226', 4) + inked(sm([[12, 130], [34, 156], [52, 150], [34, 126]]), '#6b4226', 4); // legs round trunk
      s += inked(sm([[-22, 50], [-58, 56], [-70, 44], [-40, 36]]), '#8a5a34', 4); // arm hugging
      s += inked(sm([[22, 44], [44, 10], [56, -30], [66, -26], [56, 16], [34, 56]]), '#8a5a34', 4); // waving arm
      s += inked(sm([[52, -40], [66, -44], [74, -28], [62, -20]]), '#f3cda6', 3);
      s += inked(sm([[-18, 4], [0, -4], [20, 4], [22, 26], [0, 38], [-20, 26]]), '#f3cda6', 4); // face
      s += inked(sm([[-24, 4], [-10, -22], [14, -24], [28, 0], [20, 6], [0, -8], [-18, 8]]), '#1b1a3c', 4); // hair
      s += inked(sm([[-6, -34], [10, -40], [18, -26], [4, -20]]), '#1b1a3c', 3); // bun
      s += line([[-8, 16], [-2, 14]], 3) + line([[8, 14], [14, 16]], 3) + `<path d="M-4 24 Q4 32 12 24" fill="#c0392b" stroke="${INK}" stroke-width="2"/>`;
      s += `</g>`;
    }
    return K.svg(900, 1200, s);
  };

  /* falling Tấm (tiny, tumbling) 240×300 */
  ART.ch.tam_fall = function () {
    let s = '';
    s += inked(sm([[96, 120], [80, 180], [100, 230], [150, 232], [162, 180], [148, 122], [122, 110]]), '#8a5a34', 5);
    s += inked(sm([[100, 226], [70, 270], [50, 262], [76, 222]]), '#6b4226', 4) + inked(sm([[148, 228], [180, 276], [200, 266], [166, 222]]), '#6b4226', 4);
    s += inked(sm([[98, 136], [44, 110], [24, 80], [40, 74], [60, 100], [104, 118]]), '#8a5a34', 4) + inked(sm([[150, 134], [196, 104], [214, 72], [228, 80], [206, 118], [156, 150]]), '#8a5a34', 4);
    s += inked(sm([[92, 46], [122, 34], [152, 46], [156, 84], [124, 104], [94, 86]]), '#f3cda6', 5);
    s += inked(sm([[86, 50], [104, 16], [140, 12], [166, 40], [180, 20], [170, 60], [150, 44], [120, 40], [96, 60]]), '#1b1a3c', 5);
    s += `<ellipse cx="124" cy="82" rx="12" ry="15" fill="${INK}"/><ellipse cx="124" cy="86" rx="7" ry="8" fill="#c0392b"/>`;
    s += line([[104, 62], [116, 58]], 4) + line([[132, 58], [144, 62]], 4) + `<circle cx="110" cy="68" r="4" fill="${INK}"/><circle cx="138" cy="68" r="4" fill="${INK}"/>`;
    s += line([[190, 30], [220, 10]], 4) + line([[200, 50], [232, 40]], 4) + line([[40, 30], [14, 14]], 4);
    return K.svg(240, 300, s);
  };

  /* =====================================================================
     MOM (the stepmother) — low angle, axe on shoulder, face in shadow. 720×1000
     ===================================================================== */
  ART.ch.mom = function (v) {
    const spectral = v === 'stand';
    const SK = spectral ? '#ffb6d6' : '#e3b08a', CL = spectral ? '#ff6fa8' : '#5a3a2a', CL2 = spectral ? '#c23b7a' : '#3b2418';
    let s = `<defs><linearGradient id="mm-cl${spectral ? 's' : ''}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${spectral ? '#ffd1e6' : '#7a5236'}"/><stop offset=".5" stop-color="${CL}"/><stop offset="1" stop-color="${CL2}"/></linearGradient></defs>`;
    const cl = `url(#mm-cl${spectral ? 's' : ''})`;
    // big axe behind, over the shoulder
    s += ART.axe({ x: 560, y: 170, rot: 26.8, scale: 0.8, dir: 1, len: 1135, haftW: 22, id: `mmax${spectral ? 's' : ''}` });
    // body — stout, wide sleeves (low angle: big at bottom)
    const body = sm([[250, 330], [150, 380], [90, 520], [60, 720], [40, 1010], [680, 1010], [650, 720], [600, 520], [540, 380], [440, 330]]);
    s += inked(body, cl, 9, [6, 7]);
    s += `<path d="${sm([[440, 330], [540, 380], [600, 520], [650, 720], [680, 1010], [520, 1010], [520, 700], [470, 500]])}" fill="${INK}" opacity=".7"/>`;
    s += K.hatch({ x: 60, y: 560, w: 200, h: 440 }, { angle: 70, gap: 14, w: 3, seed: 21, color: INK, op: 0.5, fade: [0.2, 0.6] });
    // yếm (bodice) peek + apron
    s += inked(`M292 372 L398 372 L420 470 L345 560 L270 470 Z`, spectral ? '#fff0f6' : '#c9382c', 5);
    s += line([[292, 372], [260, 340]], 3) + line([[398, 372], [430, 340]], 3);
    s += inked(`M236 600 Q345 620 454 600 L500 1010 L190 1010 Z`, spectral ? '#ffe0ee' : '#241a16', 6);
    [[280, 640, 250, 1000], [330, 640, 320, 1000], [380, 640, 392, 1000], [420, 630, 452, 1000]].forEach(([a, b, c, d]) => (s += line([[a, b], [c, d]], 5, { s: 0.1, e: 0.7, fill: spectral ? '#c23b7a' : '#4a3a32' })));
    s += inked(`M236 520 L292 560 L270 1010 L150 1010 Z`, cl, 5) + inked(`M454 520 L400 560 L430 1010 L550 1010 Z`, cl, 5);
    s += `<path d="M454 520 L400 560 L430 1010 L550 1010 Z" fill="${INK}" opacity=".45"/>`;
    // arm up holding the axe handle
    s += inked(sm([[440, 360], [520, 330], [560, 280], [580, 300], [540, 380], [460, 420]]), cl, 6);
    s += inked(sm([[536, 250], [582, 244], [598, 282], [566, 306], [534, 290]]), SK, 5); // fist on handle
    s += line([[548, 262], [584, 262]], 3) + line([[546, 278], [582, 282]], 3);
    // other arm on hip
    s += inked(sm([[250, 360], [170, 440], [150, 560], [210, 600], [250, 560], [230, 470], [280, 410]]), cl, 6);
    // neck + head (face shadowed from above, JoJo villain glare)
    s += inked(sm([[310, 290], [380, 290], [384, 340], [306, 340]]), SK, 5);
    const face = sm([[270, 170], [420, 170], [428, 250], [404, 300], [346, 326], [290, 300], [264, 250]]);
    s += inked(face, SK, 6);
    s += `<clipPath id="mm-face${spectral ? 's' : ''}"><path d="${face}"/></clipPath><g clip-path="url(#mm-face${spectral ? 's' : ''})"><path d="M250 150 L440 150 L440 232 Q346 214 250 236Z" fill="${INK}" opacity=".92"/>${K.hatch({ x: 250, y: 226, w: 190, h: 26 }, { angle: 5, gap: 6, w: 2.4, seed: 5, color: INK })}</g>`;
    // glowing eyes
    s += `<path d="M292 212 L334 204 L330 218 Z" fill="${spectral ? '#fff' : '#ffe066'}"/><path d="M358 204 L400 212 L362 218 Z" fill="${spectral ? '#fff' : '#ffe066'}"/>`;
    // wicked grin
    s += `<path d="M300 262 Q346 300 394 258 Q346 280 300 262Z" fill="${INK}"/><path d="M312 266 L318 276 L326 270 L334 280 L342 272 L350 282 L358 272 L366 280 L374 268 L382 272" fill="none" stroke="#fff" stroke-width="3"/>`;
    s += line([[330, 238], [322, 254], [336, 256]], 3, { op: 0.8 });
    s += line([[290, 300], [276, 320]], 3, { op: 0.6 }) + line([[404, 298], [418, 318]], 3, { op: 0.6 });
    // hair + khăn vấn (wrapped headscarf)
    s += inked(sm([[256, 190], [262, 120], [300, 84], [346, 74], [392, 84], [430, 120], [436, 190], [410, 150], [346, 138], [284, 150]]), spectral ? '#5a1c3c' : '#1a1210', 6);
    s += inked(sm([[250, 150], [270, 100], [346, 70], [424, 100], [444, 150], [420, 130], [346, 110], [274, 130]]), spectral ? '#ff8fc0' : '#2d2a26', 6);
    s += line([[272, 120], [346, 96], [420, 120]], 4, { fill: spectral ? '#ffd1e6' : '#555', op: 0.7 });
    // gold earrings (tacky)
    s += `<circle cx="262" cy="258" r="12" fill="#f7c325" stroke="${INK}" stroke-width="4"/><circle cx="432" cy="258" r="12" fill="#f7c325" stroke="${INK}" stroke-width="4"/>`;
    return K.svg(720, 1000, s);
  };

  /* =====================================================================
     THE GOLDEN ORIOLE (Tấm, reborn) — black-naped oriole with Tấm's bun & heart pin. 360×300
     ===================================================================== */
  ART.ch.bird = function () {
    let s = `<defs><linearGradient id="bd-y" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff08a"/><stop offset=".5" stop-color="#f7c325"/><stop offset="1" stop-color="#d49a10"/></linearGradient></defs>`;
    // tail
    s += inked(sm([[70, 150], [10, 180], [4, 210], [40, 206], [96, 178]]), INK, 5);
    s += line([[20, 196], [80, 172]], 5, { fill: '#f7c325' });
    // body
    const body = sm([[90, 140], [140, 96], [210, 84], [262, 100], [292, 140], [276, 196], [226, 226], [150, 224], [100, 196]]);
    s += inked(body, 'url(#bd-y)', 6);
    // wing (black with yellow edge)
    s += inked(sm([[112, 138], [170, 116], [234, 130], [250, 160], [206, 190], [140, 190], [100, 170]]), INK, 5);
    s += line([[128, 176], [230, 150]], 6, { fill: '#f7c325' }) + line([[140, 188], [210, 176]], 4, { fill: '#f7c325' });
    // head
    const head = sm([[230, 58], [272, 40], [316, 56], [330, 96], [304, 124], [260, 128], [230, 104]]);
    s += inked(head, 'url(#bd-y)', 6);
    // black nape mask through the eye (bandit/JoJo villain stripe)
    s += `<path d="${sm([[236, 70], [290, 70], [330, 84], [326, 100], [290, 96], [236, 104]])}" fill="${INK}"/>`;
    s += `<path d="M300 78 L322 84 L300 90Z" fill="#fff"/><circle cx="306" cy="84" r="4" fill="#d63a2a"/>`; // glinting eye
    s += line([[292, 66], [326, 76]], 6, { s: 0.2, e: 0.6 }); // smug brow
    // beak (pink-red)
    s += inked(`M322 92 L360 100 L324 110 Z`, '#ff5a78', 4);
    // Tấm's bun + gold heart hairpin on top of the head (it's her.)
    s += inked(sm([[250, 50], [262, 22], [292, 18], [304, 40], [284, 54]]), '#1b1a3c', 4);
    s += line([[236, 44], [320, 14]], 7, { s: 0.02, e: 0.3, min: 0.4 }) + line([[238, 43], [318, 15]], 4, { s: 0.02, e: 0.3, min: 0.4, fill: '#ffd84a' });
    s += `<path d="M300 4 c-8 -10 -22 -4 -17 8 l17 16 l17 -16 c5 -12 -9 -18 -17 -8z" fill="#ffd84a" stroke="${INK}" stroke-width="3"/>`;
    // feet gripping the pole
    s += line([[176, 222], [170, 262]], 6) + line([[210, 222], [214, 262]], 6);
    s += `<path d="M156 264 q14 -10 28 0 M200 264 q14 -10 28 0" fill="none" stroke="${INK}" stroke-width="6"/>`;
    // breast hatching
    s += K.hatch({ x: 150, y: 170, w: 120, h: 50 }, { angle: 30, gap: 9, w: 2, seed: 2, color: '#b37a00', op: 0.7 });
    return K.svg(360, 300, s);
  };

  /* =====================================================================
     THE KING — dragon robe, winged hat, lovesick. Holds his sleeve open. 560×900
     ===================================================================== */
  ART.ch.king = function () {
    let s = `<defs><linearGradient id="kg-r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe98a"/><stop offset=".5" stop-color="#f7c325"/><stop offset="1" stop-color="#b37a00"/></linearGradient></defs><g transform="translate(130 0)">`;
    // robe body
    const body = sm([[210, 300], [130, 350], [100, 500], [90, 700], [80, 900], [520, 900], [500, 700], [470, 500], [430, 350], [350, 300]]);
    s += inked(body, 'url(#kg-r)', 8);
    s += `<path d="${sm([[350, 300], [430, 350], [470, 500], [500, 700], [520, 900], [420, 900], [410, 600], [380, 420]])}" fill="${INK}" opacity=".45"/>`;
    // dragon embroidery (squiggly, goofy)
    s += `<path d="${K.taper([[170, 480], [230, 430], [300, 470], [260, 540], [330, 600], [390, 560]], 16, { s: 0.1, e: 0.4 })}" fill="#d63a2a"/>`;
    s += `<circle cx="392" cy="556" r="16" fill="#d63a2a" stroke="${INK}" stroke-width="4"/><circle cx="398" cy="552" r="4" fill="#fff"/>`;
    [[200, 470], [250, 450], [290, 500]].forEach(([x, y]) => (s += `<path d="M${x} ${y} l10 -18 l10 18" fill="none" stroke="#d63a2a" stroke-width="6"/>`));
    // belt (đai)
    s += inked(sm([[112, 620], [300, 640], [490, 620], [490, 660], [300, 680], [112, 660]]), '#d63a2a', 6);
    [180, 260, 340, 420].forEach((x) => (s += `<rect x="${x - 12}" y="636" width="24" height="24" rx="4" fill="#f7f0d0" stroke="${INK}" stroke-width="3"/>`));
    // arm extended to the left, wide sleeve held open for the bird; the hand comes out palm-up ("come, little bird")
    s += inked(sm([[160, 340], [70, 380], [10, 440], [0, 520], [60, 540], [120, 500], [180, 440]]), 'url(#kg-r)', 7);
    s += `<path d="${sm([[120, 380], [60, 420], [20, 470], [10, 520], [60, 540], [120, 500], [170, 450]])}" fill="${INK}" opacity=".18"/>`;
    s += `<ellipse cx="30" cy="490" rx="34" ry="52" fill="${INK}" transform="rotate(20 30 490)"/>`;
    s += `<ellipse cx="30" cy="490" rx="24" ry="40" fill="#3a1a0a" transform="rotate(20 30 490)"/>`;
    s += `<ellipse cx="30" cy="490" rx="34" ry="52" fill="none" stroke="#d63a2a" stroke-width="7" transform="rotate(20 30 490)"/><ellipse cx="30" cy="490" rx="38" ry="56" fill="none" stroke="${INK}" stroke-width="3" transform="rotate(20 30 490)"/>`;
    const SKN = '#f3cda6';
    s += `<g transform="translate(30 512) scale(1.2) translate(-30 -512)">`;
    s += inked(sm([[34, 500], [8, 494], [-22, 494], [-50, 488], [-74, 482], [-90, 488], [-86, 502], [-62, 508], [-40, 518], [-12, 528], [24, 532]]), SKN, 5, [3, 4]);
    s += line([[-34, 500], [-70, 492]], 2.6, { s: 0.2, e: 0.6 }) + line([[-30, 508], [-64, 502]], 2.6, { s: 0.2, e: 0.6 }) + line([[-24, 516], [-52, 512]], 2.4, { s: 0.2, e: 0.6 });
    s += inked(sm([[-4, 496], [-16, 478], [-30, 462], [-44, 456], [-48, 468], [-36, 482], [-24, 498]]), SKN, 4, [2, 3]);
    s += `<path d="M24 532 Q4 528 -12 528 L24 500Z" fill="#d99a74" opacity=".55"/></g>`;
    // other hand on heart
    s += inked(sm([[390, 350], [440, 420], [380, 470], [330, 440], [350, 400]]), 'url(#kg-r)', 6);
    s += inked(sm([[312, 418], [336, 398], [362, 404], [372, 430], [352, 454], [326, 450]]), SKN, 4);
    s += line([[326, 416], [356, 414]], 2.6, { s: 0.2, e: 0.5 }) + line([[322, 428], [358, 428]], 2.6, { s: 0.2, e: 0.5 }) + line([[324, 440], [354, 442]], 2.6, { s: 0.2, e: 0.5 });
    // head
    s += inked(sm([[240, 250], [320, 250], [324, 306], [236, 306]]), '#e8b88c', 5);
    const face = sm([[200, 150], [360, 150], [362, 230], [330, 278], [280, 294], [230, 278], [198, 230]]);
    s += inked(face, '#f3cda6', 6);
    // lovestruck: heart eyes + blush + huge mustache
    const heart = (x, y, r) => `<path d="M${x} ${y + r * 0.8} C${x - r * 1.4} ${y - r * 0.2} ${x - r * 0.6} ${y - r * 1.2} ${x} ${y - r * 0.4} C${x + r * 0.6} ${y - r * 1.2} ${x + r * 1.4} ${y - r * 0.2} ${x} ${y + r * 0.8}Z" fill="#ff3d8b" stroke="${INK}" stroke-width="4"/>`;
    s += heart(246, 206, 22) + heart(316, 206, 22);
    s += `<ellipse cx="228" cy="240" rx="20" ry="10" fill="#ff8fb0" opacity=".8"/><ellipse cx="336" cy="240" rx="20" ry="10" fill="#ff8fb0" opacity=".8"/>`;
    s += inked(sm([[280, 246], [240, 250], [200, 238], [214, 262], [254, 266], [280, 258], [306, 266], [346, 262], [360, 238], [320, 250]]), '#1a1210', 4);
    s += `<path d="M262 270 Q280 286 298 270" fill="#c0392b" stroke="${INK}" stroke-width="3"/>`;
    // winged hat (mũ cánh chuồn) — goofy big wings
    s += inked(sm([[204, 150], [210, 96], [240, 70], [320, 70], [350, 96], [356, 150]]), '#1a1a3a', 6);
    s += inked(`M204 118 L110 90 L96 120 L204 140 Z`, '#1a1a3a', 5) + inked(`M356 118 L450 90 L464 120 L356 140 Z`, '#1a1a3a', 5);
    s += `<rect x="236" y="118" width="88" height="18" fill="#f7c325" stroke="${INK}" stroke-width="4"/><circle cx="280" cy="98" r="12" fill="#e0302a" stroke="${INK}" stroke-width="4"/>`;
    return K.svg(690, 900, s + '</g>');
  };

  /* =====================================================================
     BỤT — the fairy godfather. Long beard, halo, on a cloud. 440×560
     ===================================================================== */
  ART.ch.but = function () {
    let s = `<defs><radialGradient id="bt-halo"><stop offset="0" stop-color="#fffbe0"/><stop offset=".7" stop-color="#ffe066" stop-opacity=".7"/><stop offset="1" stop-color="#ffe066" stop-opacity="0"/></radialGradient></defs>`;
    s += `<circle cx="220" cy="150" r="150" fill="url(#bt-halo)"/>`;
    s += K.radial(220, 150, 110, 210, 32, { w: 8, seed: 5, color: '#ffd23a', op: 0.8 });
    // robe (saffron) body
    s += inked(sm([[150, 250], [90, 330], [70, 440], [370, 440], [350, 330], [290, 250]]), '#ff9f2e', 7);
    s += `<path d="M290 250 L350 330 L370 440 L300 440 L300 330Z" fill="${INK}" opacity=".35"/>`;
    s += line([[140, 300], [200, 440]], 6, { s: 0.1, e: 0.6 }) + line([[300, 300], [250, 440]], 6, { s: 0.1, e: 0.6 });
    // hands: one raised in blessing, holding a whisk (phất trần)
    s += inked(sm([[300, 290], [352, 250], [366, 200], [386, 206], [376, 262], [322, 318]]), '#ff9f2e', 5);
    s += inked(sm([[356, 190], [380, 176], [394, 196], [378, 214]]), '#f3cda6', 4);
    s += line([[372, 196], [340, 120]], 6, { fill: '#8a5a2a' });
    for (let i = 0; i < 9; i++) s += line([[340, 122], [300 + i * 6, 70 + (i % 3) * 8]], 3, { s: 0.1, e: 0.95, fill: '#fff' });
    // head: bald, big ears, kind closed eyes, dramatic brows
    s += inked(sm([[150, 120], [170, 70], [220, 50], [270, 70], [290, 120], [284, 180], [220, 214], [156, 180]]), '#f3cda6', 6);
    s += inked(sm([[146, 130], [130, 150], [146, 176], [160, 160]]), '#f3cda6', 4) + inked(sm([[294, 130], [310, 150], [294, 176], [280, 160]]), '#f3cda6', 4);
    s += line([[176, 118], [200, 108], [212, 116]], 7, { s: 0.2, e: 0.5, fill: '#eee' }) + line([[228, 116], [240, 108], [264, 118]], 7, { s: 0.5, e: 0.2, fill: '#eee' });
    s += `<path d="M184 138 Q198 148 212 138 M228 138 Q242 148 256 138" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    s += `<circle cx="220" cy="100" r="7" fill="#e0302a" opacity=".8"/>`; // urna dot
    // long white beard
    s += inked(sm([[168, 170], [190, 200], [220, 208], [250, 200], [272, 170], [276, 250], [252, 330], [220, 380], [188, 330], [164, 250]]), '#ffffff', 6);
    [[200, 220, 196, 320], [220, 224, 220, 360], [240, 220, 244, 320]].forEach(([a, b, c, d]) => (s += line([[a, b], [c, d]], 3, { s: 0.2, e: 0.7, fill: '#aab' })));
    s += inked(sm([[188, 178], [220, 170], [252, 178], [240, 192], [220, 186], [200, 192]]), '#ffffff', 4); // mustache
    // cloud seat
    const cloud = [];
    [[100, 470, 70], [180, 490, 80], [270, 486, 78], [350, 466, 66], [220, 440, 70], [140, 440, 56], [310, 440, 56]].forEach(([x, y, r]) => cloud.push(`M${x - r} ${y} a${r} ${r * 0.62} 0 1 0 ${2 * r} 0 a${r} ${r * 0.62} 0 1 0 ${-2 * r} 0`));
    s += `<path d="${cloud.join('')}" fill="${INK}" stroke="${INK}" stroke-width="14" transform="translate(5 6)"/><path d="${cloud.join('')}" fill="${INK}" stroke="${INK}" stroke-width="12"/><path d="${cloud.join('')}" fill="#ffffff"/>`;
    s += `<path d="${cloud.join('')}" fill="#bfe9ff" opacity=".35" transform="translate(6 10)"/>`;
    return K.svg(440, 560, s);
  };

  /* falling cooking pot (nồi đất) with lid & steam. 420×360 */
  ART.ch.potsmall = function () {
    let s = '';
    s += inked(sm([[60, 150], [40, 230], [90, 320], [210, 350], [330, 320], [380, 230], [360, 150]]), '#8a4a2a', 7);
    s += `<path d="${sm([[210, 150], [360, 150], [380, 230], [330, 320], [230, 350]])}" fill="${INK}" opacity=".4"/>`;
    s += K.hatch({ x: 60, y: 200, w: 120, h: 120 }, { angle: 60, gap: 12, w: 2.5, seed: 4, color: INK, op: 0.4 });
    s += inked(`M40 140 Q210 110 380 140 L380 170 Q210 196 40 170 Z`, '#a85a32', 6);
    s += inked(sm([[90, 136], [210, 96], [330, 136], [210, 150]]), '#6b3a1e', 6);
    s += inked(sm([[190, 100], [210, 70], [230, 100]]), '#6b3a1e', 5);
    s += line([[120, 260], [300, 260]], 5, { fill: '#c9784a' });
    // a single golden feather poking out
    s += `<path d="M300 130 q40 -60 70 -110 q-10 60 -50 120z" fill="#f7c325" stroke="${INK}" stroke-width="4"/>`;
    return K.svg(420, 360, s);
  };

  /* =====================================================================
     THE LOOM (khung cửi) — variants: calm | eyes | soft. 800×760
     ===================================================================== */
  ART.ch.loom = function (v) {
    const WOOD = '#8a5a34', WOOD2 = '#5e3a1e';
    let s = '';
    const beam = (x1, y1, x2, y2, w) => `<path d="${K.taper([[x1, y1], [x2, y2]], w + 8, { s: 0.01, e: 0.01, min: 0.95 })}" fill="${INK}"/><path d="${K.taper([[x1, y1], [x2, y2]], w, { s: 0.01, e: 0.01, min: 0.95 })}" fill="${WOOD}"/>`;
    // back uprights & frame
    s += beam(120, 740, 150, 90, 34) + beam(680, 740, 650, 90, 34);
    s += beam(90, 110, 710, 110, 40);
    // warp threads (like long hair when she wakes)
    const th = [];
    const n = 34;
    for (let i = 0; i < n; i++) {
      const x0 = 200 + i * 12.2, x1 = 190 + i * 12.8;
      const wav = v === 'eyes' ? Math.sin(i * 1.7) * 10 : 0;
      th.push(K.taper([[x0, 140], [x0 + wav, 330], [x1, 520]], 2.6, { s: 0.02, e: 0.02, min: 0.8 }));
    }
    s += `<path d="${th.join('')}" fill="${v === 'eyes' ? '#2a1a3a' : '#efe4c8'}"/>`;
    // heddle bar + beater
    s += beam(160, 320, 640, 320, 22);
    s += beam(150, 470, 650, 470, 30);
    // woven cloth (patterned brocade), rolled on the front beam
    const cloth = `M180 500 L620 500 L640 640 L160 640 Z`;
    s += `<path d="${cloth}" fill="#b8323a" stroke="${INK}" stroke-width="6"/>`;
    for (let y = 520; y < 640; y += 28) for (let x = 200; x < 610; x += 44) s += `<path d="M${x} ${y} l14 8 l-14 8 l-14 -8z" fill="#f7c325" stroke="${INK}" stroke-width="2"/>`;
    if (v === 'eyes') {
      // a stitched grin opens in the cloth
      s += `<path d="M230 560 Q400 640 570 560 Q400 610 230 560Z" fill="${INK}"/>`;
      for (let i = 0; i < 9; i++) { const x = 260 + i * 34; s += `<path d="M${x} ${566 + Math.sin(i / 8 * Math.PI) * 26} l10 16 l10 -16" fill="#fff" stroke="${INK}" stroke-width="2"/>`; }
    }
    s += beam(130, 650, 670, 650, 44);
    s += `<path d="M150 640 H650" stroke="#fff" stroke-width="3" opacity=".3"/>`;
    // shuttle (thoi)
    s += `<path d="M500 488 q40 -14 90 0 q-40 14 -90 0z" fill="#d9b25a" stroke="${INK}" stroke-width="4"/>`;
    // treadles
    s += beam(260, 740, 330, 700, 16) + beam(470, 740, 540, 700, 16);
    // shading
    s += K.hatch({ x: 620, y: 100, w: 80, h: 640 }, { angle: 80, gap: 10, w: 2.4, seed: 3, color: INK, op: 0.6 });
    // eyes on the top beam
    if (v === 'eyes' || v === 'soft') {
      const eye = (cx, cy, mirror) => {
        let e = `<path d="M${cx - 70} ${cy} Q${cx} ${cy - 58} ${cx + 70} ${cy} Q${cx} ${cy + 40} ${cx - 70} ${cy}Z" fill="#fff" stroke="${INK}" stroke-width="6"/>`;
        if (v === 'eyes') {
          e += `<circle cx="${cx}" cy="${cy - 4}" r="26" fill="#d63a2a" stroke="${INK}" stroke-width="4"/><circle cx="${cx}" cy="${cy - 4}" r="10" fill="${INK}"/><circle cx="${cx + 8}" cy="${cy - 12}" r="5" fill="#fff"/>`;
          for (let k = 0; k < 5; k++) e += `<path d="M${cx - 60 + k * 8} ${cy + 6 - k} l${10 + k * 3} ${-4 + (k % 2) * 6}" stroke="#d63a2a" stroke-width="2"/>`; // bloodshot
        } else {
          e += `<circle cx="${cx}" cy="${cy - 2}" r="24" fill="#5c4bc0" stroke="${INK}" stroke-width="4"/><circle cx="${cx}" cy="${cy - 2}" r="10" fill="${INK}"/><circle cx="${cx + 8}" cy="${cy - 10}" r="6" fill="#fff"/><circle cx="${cx - 8}" cy="${cy + 6}" r="3" fill="#fff"/>`;
          e += `<path d="M${cx - 40} ${cy + 30} q-6 26 4 40 q10 -12 -4 -40z" fill="#9ee7ff" stroke="${INK}" stroke-width="3"/>`; // tear
        }
        // heavy JoJo lashes
        e += `<path d="${K.taper([[cx - 78, cy + 2], [cx, cy - 60], [cx + 78, cy + 2]], 12, { s: 0.2, e: 0.2 })}" fill="${INK}"/>`;
        for (let k = 0; k < 5; k++) { const a = -2.6 + k * 0.28 * (mirror ? -1 : 1) + (mirror ? 0 : 0); const bx = cx + (k - 2) * 26, by = cy - 50 + Math.abs(k - 2) * 12; e += `<path d="${K.taper([[bx, by], [bx + (k - 2) * 8, by - 26]], 5, { s: 0.1, e: 0.9 })}" fill="${INK}"/>`; }
        e += `<path d="${K.taper([[cx - 70, cy - 78], [cx, cy - 98], [cx + 60, cy - 82]], 10, { s: 0.3, e: 0.3 })}" fill="${INK}"/>`;
        return e;
      };
      s += eye(260, 112, false) + eye(540, 112, true);
    }
    return K.svg(800, 760, s);
  };

  /* =====================================================================
     OLD WOMAN (bà lão hàng nước) — khăn mỏ quạ, black lacquered teeth, bag held open. 560×820
     ===================================================================== */
  ART.ch.oldwoman = function () {
    const CL = '#7a5236', CL2 = '#4a2e1c', SK = '#e3b08a';
    let s = `<defs><linearGradient id="ow-c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9c6a44"/><stop offset=".6" stop-color="${CL}"/><stop offset="1" stop-color="${CL2}"/></linearGradient></defs>`;
    // hunched body
    const body = sm([[210, 300], [150, 340], [110, 460], [100, 620], [90, 810], [420, 810], [410, 620], [380, 460], [330, 330], [270, 300]]);
    s += inked(body, 'url(#ow-c)', 8);
    s += `<path d="${sm([[300, 320], [360, 420], [400, 600], [420, 810], [320, 810], [320, 560]])}" fill="${INK}" opacity=".45"/>`;
    s += inked(`M180 560 L360 560 L380 810 L160 810 Z`, '#2a2622', 6);
    s += line([[220, 580], [210, 800]], 4, { fill: '#555' }) + line([[300, 580], [310, 800]], 4, { fill: '#555' });
    // cane
    s += line([[90, 810], [130, 470]], 16, { s: 0.02, e: 0.02, min: 0.9 }) + line([[92, 806], [128, 474]], 9, { s: 0.02, e: 0.02, min: 0.9, fill: '#a57a3c' });
    s += inked(sm([[112, 470], [150, 452], [160, 480], [124, 498]]), SK, 4);
    // arm holding the bag (bị) open, toward the tree (right) — suspiciously buff forearm
    s += inked(sm([[300, 340], [380, 380], [440, 420], [470, 470], [440, 490], [380, 450], [320, 420]]), 'url(#ow-c)', 6);
    s += inked(sm([[430, 430], [480, 426], [498, 460], [470, 484], [436, 480]]), SK, 5);
    s += line([[440, 452], [470, 450]], 3) + `<path d="M396 400 q16 -24 38 -10" fill="none" stroke="${INK}" stroke-width="3"/>`;
    // the bag
    s += inked(sm([[320, 440], [420, 430], [470, 500], [440, 580], [360, 590], [300, 540]]), '#c9a56a', 6);
    s += `<ellipse cx="380" cy="448" rx="54" ry="16" fill="#3a2a14" stroke="${INK}" stroke-width="5"/>`;
    s += K.hatch({ x: 310, y: 470, w: 150, h: 110 }, { angle: 30, gap: 12, w: 2.4, seed: 6, color: '#8a6a2a' });
    // head
    s += inked(sm([[206, 264], [270, 264], [276, 312], [200, 312]]), SK, 5);
    const face = sm([[170, 140], [300, 140], [306, 210], [284, 262], [236, 282], [190, 262], [166, 210]]);
    s += inked(face, SK, 6);
    // wrinkles, squint, cheeky grin with black teeth (nhuộm răng đen)
    s += line([[184, 196], [206, 190], [222, 196]], 5, { s: 0.3, e: 0.3 }) + line([[248, 196], [264, 190], [286, 196]], 5, { s: 0.3, e: 0.3 });
    s += `<circle cx="206" cy="200" r="4" fill="${INK}"/><circle cx="266" cy="200" r="4" fill="${INK}"/><circle cx="268" cy="198" r="1.6" fill="#fff"/>`;
    s += line([[176, 216], [192, 230]], 3, { op: 0.7 }) + line([[292, 216], [278, 230]], 3, { op: 0.7 }) + line([[198, 170], [226, 166]], 3, { op: 0.5 }) + line([[244, 166], [272, 170]], 3, { op: 0.5 });
    s += line([[236, 206], [230, 226], [240, 230]], 3, { op: 0.8 });
    s += `<path d="M200 240 Q236 272 272 240 Q236 256 200 240Z" fill="${INK}"/><path d="M212 246 H262" stroke="#333" stroke-width="3"/>`;
    // khăn mỏ quạ (crow-beak headscarf) over white hair
    s += inked(sm([[170, 150], [190, 100], [236, 84], [282, 100], [300, 150], [236, 132]]), '#eeeeee', 5);
    s += inked(`M156 140 Q236 60 316 140 L300 160 Q236 108 172 160 Z`, '#2a2622', 6);
    s += inked(`M236 70 L250 40 L270 76 Z`, '#2a2622', 5);
    // betel-red lips hint + blush
    s += `<ellipse cx="190" cy="230" rx="14" ry="7" fill="#ff8f8f" opacity=".6"/><ellipse cx="282" cy="230" rx="14" ry="7" fill="#ff8f8f" opacity=".6"/>`;
    // ✦ in the eye (she has a Stand)
    s += `<path d="M300 170 l5 -14 l5 14 l14 5 l-14 5 l-5 14 l-5 -14 l-14 -5z" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`;
    return K.svg(560, 820, s);
  };

  /* the golden thị fruit (with a tiny Tấm peeking). 120×140 */
  ART.ch.fruit = function () {
    let s = `<defs><radialGradient id="fr-g" cx=".38" cy=".38" r=".7"><stop offset="0" stop-color="#fff3a0"/><stop offset=".5" stop-color="#f7c325"/><stop offset="1" stop-color="#c98a0e"/></radialGradient></defs>`;
    s += inked(sm([[60, 30], [100, 46], [112, 86], [96, 124], [60, 136], [24, 124], [8, 86], [20, 46]]), 'url(#fr-g)', 5, [3, 4]);
    s += `<path d="M30 60 q10 -18 26 -20" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".9"/>`;
    s += inked(`M60 34 L40 22 L52 36 L34 40 L56 44 L60 30 L64 44 L86 40 L68 36 L80 22 Z`, '#2f7a3a', 3, [2, 2]);
    s += line([[60, 30], [62, 4]], 5, { fill: '#5a3616' });
    // peeking eyes
    s += `<path d="M44 86 q8 -8 16 0" fill="none" stroke="${INK}" stroke-width="3.5"/><path d="M64 86 q8 -8 16 0" fill="none" stroke="${INK}" stroke-width="3.5"/>`;
    s += `<circle cx="52" cy="88" r="3" fill="${INK}"/><circle cx="72" cy="88" r="3" fill="${INK}"/>`;
    s += `<path d="M56 104 q6 4 12 0" fill="none" stroke="${INK}" stroke-width="2.5"/>`;
    return K.svg(120, 140, s);
  };

  /* =====================================================================
     A JoJo-style female face (front / slight tilt). Local coords centred on the nose bridge.
     o: {expr:'smug'|'fierce'|'soft'|'shock', skin, iris, lips, shadowSide:1|-1}
     ===================================================================== */
  ART.face = function (o = {}) {
    const SK = o.skin || '#f6d2ae', SKD = o.skinDark || '#d99a74', IR = o.iris || '#b8860b', LP = o.lips || '#b3122e';
    const ex = o.expr || 'smug';
    let s = '';
    const face = `M-90 -84 Q-104 16 -74 70 Q-40 114 0 120 Q40 114 74 70 Q104 16 90 -84 Z`;
    s += inked(face, SK, 6, [4, 5]);
    // cheek/jaw shadow (JoJo planes) on the shadow side
    const sd = o.shadowSide || 1;
    s += `<path d="M${sd * 20} -40 Q${sd * 70} -20 ${sd * 92} -10 Q${sd * 98} 30 ${sd * 72} 70 Q${sd * 44} 100 ${sd * 14} 116 Q${sd * 50} 60 ${sd * 56} 20 Z" fill="${SKD}" opacity=".75"/>`;
    s += K.hatch({ x: sd > 0 ? 40 : -90, y: 10, w: 50, h: 50 }, { angle: sd > 0 ? 60 : 120, gap: 6, w: 1.8, seed: 3, color: '#8a4a2a', op: 0.7 });
    s += `<path d="M-14 124 Q0 132 14 124 L10 140 L-10 140Z" fill="${SKD}"/>`;
    // eyes
    const eye = (cx, flip) => {
      const f = flip ? -1 : 1;
      let lidTop = ex === 'smug' ? -16 : ex === 'shock' ? -30 : ex === 'soft' ? -20 : -22;
      const lidBot = ex === 'shock' ? 10 : 4;
      const x0 = cx - 30 * f, x1 = cx + 28 * f;
      let e = `<path d="M${x0} -4 Q${cx - 6 * f} ${lidTop - 6} ${x1} -8 Q${cx} ${lidBot + 6} ${x0} -4Z" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`;
      const irY = ex === 'smug' ? -4 : -7, irR = ex === 'shock' ? 7 : 12;
      e += `<clipPath id="eyeclip${flip ? 'r' : 'l'}${ex}"><path d="M${x0} -4 Q${cx - 6 * f} ${lidTop - 6} ${x1} -8 Q${cx} ${lidBot + 6} ${x0} -4Z"/></clipPath>`;
      e += `<g clip-path="url(#eyeclip${flip ? 'r' : 'l'}${ex})"><circle cx="${cx}" cy="${irY}" r="${irR}" fill="${IR}"/><circle cx="${cx}" cy="${irY}" r="${irR * 0.45}" fill="${INK}"/><circle cx="${cx + 4}" cy="${irY - 4}" r="${irR * 0.28}" fill="#fff"/>`;
      if (ex === 'smug') e += `<path d="M${x0 - 4} -24 L${x1 + 4} -24 L${x1 + 4} ${lidTop + 4} Q${cx} ${lidTop - 2} ${x0 - 4} ${lidTop + 6}Z" fill="${SK}"/>`;
      e += `</g>`;
      // heavy upper lash line with winged tip
      e += `<path d="${K.taper([[x0 - 2 * f, -2], [cx - 6 * f, lidTop - 4], [x1 + 2 * f, -8], [x1 + 14 * f, -16]], 6.5, { s: 0.15, e: 0.25 })}" fill="${INK}"/>`;
      for (let k = 0; k < 3; k++) e += `<path d="${K.taper([[x1 - k * 9 * f, -9 - (2 - k) * 2], [x1 + (8 - k * 4) * f, -20 - (2 - k) * 3]], 3, { s: 0.1, e: 0.9 })}" fill="${INK}"/>`;
      e += `<path d="${K.taper([[x0 + 6 * f, 2], [cx, lidBot + 4], [x1 - 2 * f, -4]], 2.2, { s: 0.3, e: 0.3 })}" fill="${INK}"/>`;
      e += `<path d="${K.taper([[x0 + 4 * f, lidTop - 10], [cx, lidTop - 18], [x1, lidTop - 12]], 2, { s: 0.3, e: 0.3 })}" fill="${INK}" opacity=".6"/>`;
      return e;
    };
    s += eye(-42, false) + eye(42, true);
    // brows (smug: one raised)
    const bL = ex === 'fierce' ? [[-76, -40], [-44, -44], [-16, -34]] : ex === 'soft' ? [[-76, -46], [-46, -54], [-16, -48]] : [[-76, -42], [-46, -50], [-16, -44]];
    const bR = ex === 'smug' ? [[16, -52], [46, -64], [78, -54]] : ex === 'fierce' ? [[16, -34], [44, -44], [76, -40]] : [[16, -48], [46, -54], [76, -46]];
    s += `<path d="${K.taper(bL, 6, { s: 0.3, e: 0.6 })}" fill="${INK}"/><path d="${K.taper(bR, 6, { s: 0.6, e: 0.3 })}" fill="${INK}"/>`;
    // nose: bridge shadow on one side + tip
    s += `<path d="${K.taper([[6 * sd, -14], [12 * sd, 18], [14 * sd, 40]], 3.2, { s: 0.3, e: 0.2 })}" fill="${INK}"/>`;
    s += `<path d="M${10 * sd} 36 L${18 * sd} 44 L${4 * sd} 46Z" fill="${SKD}"/><path d="M-10 46 q4 3 8 0 M6 46 q4 3 8 0" fill="none" stroke="${INK}" stroke-width="2.4"/>`;
    // lips
    if (ex === 'shock') {
      s += `<ellipse cx="0" cy="78" rx="18" ry="22" fill="${INK}"/><ellipse cx="0" cy="84" rx="11" ry="10" fill="#c0392b"/>`;
    } else {
      const smirk = ex === 'smug' ? 8 : ex === 'soft' ? 3 : 0;
      s += `<path d="M-30 ${72} Q-14 ${62} 0 ${68} Q14 ${62} ${32} ${70 - smirk} Q16 ${74} 0 ${74} Q-16 ${74} -30 ${72}Z" fill="${LP}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>`;
      s += `<path d="M-26 ${74} Q0 ${96} ${28} ${72 - smirk} Q0 ${82} -26 ${74}Z" fill="${LP}" stroke="${INK}" stroke-width="2.6"/>`;
      s += `<path d="M-8 ${82} Q2 ${86} 10 ${81}" fill="none" stroke="#ff8fa6" stroke-width="3" stroke-linecap="round"/>`;
      s += `<path d="${K.taper([[-32, 72], [0, 74], [34, 70 - smirk]], 3, { s: 0.2, e: 0.2 })}" fill="${INK}"/>`;
      s += `<path d="${K.taper([[-12, 100], [0, 104], [12, 100]], 2.4, { s: 0.3, e: 0.3 })}" fill="${INK}" opacity=".6"/>`;
    }
    return s;
  };

  /* =====================================================================
     TẤM REVEAL — "You thought it was just a fruit? But it was me, TẤM!" 900×1040
     ===================================================================== */
  ART.ch.tam_dio = function () {
    const SK = '#f6d2ae', SKD = '#dc9f78', SKDD = '#b9714a', HAIR = '#15142e', HL = '#3d4a98', LIP = '#b3122e';
    let s = `<defs><linearGradient id="td-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0a0"/><stop offset=".45" stop-color="#f7c325"/><stop offset="1" stop-color="#b8780a"/></linearGradient>
      <linearGradient id="td-sl" x1="0" y1="1" x2=".6" y2="0"><stop offset="0" stop-color="#b8780a"/><stop offset=".5" stop-color="#f7c325"/><stop offset="1" stop-color="#fff0a0"/></linearGradient></defs>`;
    const GOLD = 'url(#td-g)';
    // head is drawn upright in its own frame (origin = nose bridge), then cocked toward her right shoulder like DIO
    const HX = 478, HY = 318, HR = -17;
    const hc = Math.cos((HR * Math.PI) / 180), hs = Math.sin((HR * Math.PI) / 180);
    const H = (x, y) => [HX + x * hc - y * hs, HY + x * hs + y * hc];
    const headT = `translate(${HX} ${HY}) rotate(${HR})`;
    // the hand is drawn as a fist seen knuckles-on, thumb out along +x, then turned so the thumb jabs back at her
    const handT = 'translate(244 596) rotate(55) scale(1.12)';

    // ---------------------------------------------------------------- silhouettes
    const face = sm([[-92, -152], [-102, -96], [-112, -38], [-108, 4], [-102, 38], [-98, 74], [-82, 120], [-50, 162], [-14, 187], [12, 192], [40, 180], [82, 150], [114, 104], [132, 52], [140, 0], [137, -60], [125, -118], [98, -160], [40, -184], [-40, -180]]);
    const bangs = sm([[132, -150], [96, -196], [36, -210], [-30, -202], [-90, -176], [-126, -126], [-136, -62], [-122, -28], [-108, -70], [-84, -112], [-46, -140], [6, -150], [-2, -126], [40, -148], [92, -144], [124, -108], [140, -60], [150, -112]]);
    const lockFar = sm([[-112, -96], [-138, -30], [-146, 60], [-138, 150], [-118, 206], [-112, 140], [-116, 60], [-104, -20], [-96, -70]]);
    const lockNear = sm([[118, -126], [146, -54], [148, 26], [136, 96], [120, 150], [116, 90], [124, 20], [120, -50], [104, -110]]);
    const bun = sm([[-6, -196], [6, -252], [56, -290], [122, -282], [158, -240], [146, -196], [86, -184]]);
    const backHair = sm([[452, 108], [560, 92], [660, 150], [728, 270], [770, 420], [836, 560], [880, 690], [800, 720], [720, 640], [680, 500], [640, 380], [600, 300]]);
    const body = sm([[452, 600], [352, 640], [252, 700], [176, 800], [150, 1040], [900, 1040], [900, 770], [826, 662], [716, 606], [630, 592]]);
    const sleeve = sm([[60, 604], [118, 676], [178, 768], [172, 890], [128, 1040], [26, 1040], [14, 880], [18, 744], [32, 654]]);
    const fist = sm([[-58, -60], [-20, -72], [30, -70], [60, -50], [66, 20], [58, 86], [0, 98], [-52, 92], [-64, 30]]);
    const thumb = sm([[12, -56], [6, -108], [18, -158], [44, -178], [68, -166], [70, -120], [60, -52]]);
    const wrist = sm([[-42, 70], [40, 74], [46, 150], [-46, 150]]);

    // ---------------------------------------------------------------- aura: one crisp rim, no clutter
    const sil = (fill, w) => `<g fill="${fill}" stroke="${fill}" stroke-width="${w}" stroke-linejoin="round"><path d="${backHair}"/><path d="${body}"/><path d="${sleeve}"/>` +
      `<g transform="${headT}"><path d="${face}"/><path d="${bangs}"/><path d="${lockFar}"/><path d="${lockNear}"/><path d="${bun}"/></g>` +
      `<g transform="${handT}"><path d="${fist}"/><path d="${thumb}"/><path d="${wrist}"/></g></g>`;
    s += sil('#3fe6ff', 44) + sil('#c9fbff', 18);

    // ---------------------------------------------------------------- back hair & body
    s += inked(backHair, HAIR, 6);
    s += line([[600, 200], [690, 330], [760, 520], [830, 660]], 5, { fill: HL }) + line([[580, 260], [650, 420], [720, 600]], 4, { fill: HL });
    s += inked(body, GOLD, 8, [6, 7]);
    s += `<path d="${sm([[690, 604], [826, 662], [900, 770], [900, 1040], [760, 1040], [720, 800]])}" fill="${INK}" opacity=".45"/>`;
    [[[340, 700], [300, 1040]], [[760, 700], [800, 1040]], [[650, 740], [640, 1040]]].forEach((p) => (s += line(p, 6, { s: 0.1, e: 0.7 })));
    // neck (long, in shadow under the jaw), then the crossed collar (giao lĩnh)
    const neck = sm([[498, 470], [540, 506], [600, 420], [628, 376], [650, 470], [664, 606], [580, 638], [492, 632], [504, 556]]);
    s += inked(neck, SK, 5);
    s += `<clipPath id="td-neck"><path d="${neck}"/></clipPath><g clip-path="url(#td-neck)"><path d="${sm([[480, 470], [540, 516], [606, 400], [640, 380], [660, 470], [640, 520], [570, 560], [500, 540]])}" fill="${SKD}"/>`;
    s += `<path d="M626 380 L670 380 L672 640 L640 640 Z" fill="${SKDD}" opacity=".55"/></g>`;
    s += line([[606, 560], [616, 622]], 3, { op: 0.45 });
    s += inked(`M432 606 L476 598 L604 772 L582 792 Z`, '#c0392b', 5) + inked(`M664 592 L708 604 L612 790 L590 772 Z`, '#d63a2a', 5);
    s += `<path d="M454 600 L594 784 M686 598 L600 784" fill="none" stroke="#ffd84a" stroke-width="9"/><path d="M454 600 L594 784 M686 598 L600 784" fill="none" stroke="${INK}" stroke-width="2.5"/>`;

    // ---------------------------------------------------------------- the head
    s += `<g transform="${headT}">`;
    // ear + gold earring (near side)
    s += inked(sm([[126, -30], [150, -44], [166, -14], [162, 30], [146, 54], [128, 42]]), SK, 5);
    s += `<path d="${sm([[140, -24], [154, -10], [150, 22], [140, 34]], false)}" fill="none" stroke="${SKDD}" stroke-width="4"/>`;
    s += line([[150, 50], [152, 82]], 3) + `<circle cx="152" cy="92" r="11" fill="#ffd84a" stroke="${INK}" stroke-width="4"/>`;
    s += inked(face, SK, 6, [4, 5]);
    s += `<clipPath id="td-face"><path d="${face}"/></clipPath><g clip-path="url(#td-face)">`;
    // JoJo planes: shadowed near cheek & jaw, brow shadow, far temple
    s += `<path d="${sm([[56, 22], [104, -4], [142, 20], [140, 90], [110, 150], [70, 178], [52, 150], [86, 100], [80, 56]])}" fill="${SKD}"/>`;
    s += `<path d="${sm([[-116, -60], [-80, -64], [-40, -46], [-26, -24], [-70, -34], [-112, -20]])}" fill="${SKD}" opacity=".85"/>`;
    s += `<path d="${sm([[10, -44], [60, -66], [104, -60], [96, -40], [50, -46], [18, -30]])}" fill="${SKD}" opacity=".7"/>`;
    s += `<path d="M-120 -40 L-98 -150 L-70 -150 L-96 -20 Z" fill="${SKD}" opacity=".55"/></g>`;
    // eyes: wide open, tiny irises, heavy winged lashes
    const eye = (cx, cy, w, h, ir, irx, iry, far) => {
      const x0 = cx - w / 2, x1 = cx + w / 2;
      const wd = `M${x0} ${cy + 2} Q${cx - w * 0.1} ${cy - h * 1.15} ${x1} ${cy - h * 0.35} Q${cx + w * 0.05} ${cy + h * 0.75} ${x0} ${cy + 2}Z`;
      let e = `<path d="${wd}" fill="#fff" stroke="${INK}" stroke-width="2.5"/>`;
      e += `<circle cx="${cx + irx}" cy="${cy + iry}" r="${ir}" fill="#b8860b" stroke="${INK}" stroke-width="2"/><circle cx="${cx + irx}" cy="${cy + iry}" r="${ir * 0.45}" fill="${INK}"/><circle cx="${cx + irx + ir * 0.35}" cy="${cy + iry - ir * 0.4}" r="${ir * 0.28}" fill="#fff"/>`;
      e += `<path d="${K.taper([[x0 - 3, cy + 3], [cx - w * 0.12, cy - h * 0.62], [x1 + 2, cy - h * 0.38], [x1 + (far ? 4 : 16), cy - h * 0.38 - (far ? 6 : 12)]], far ? 7.5 : 9.5, { s: 0.12, e: 0.25 })}" fill="${INK}"/>`;
      if (!far) for (let k = 0; k < 3; k++) e += `<path d="${K.taper([[x1 - 4 - k * 9, cy - h * 0.42 - k * 2], [x1 + 6 - k * 6, cy - h * 0.42 - 12 - k * 3]], 3, { s: 0.1, e: 0.9 })}" fill="${INK}"/>`;
      e += `<path d="${K.taper([[x0 + 6, cy + 5], [cx, cy + h * 0.5], [x1 - 6, cy - h * 0.18]], 2.2, { s: 0.3, e: 0.3 })}" fill="${INK}"/>`;
      e += `<path d="${K.taper([[x0 + 4, cy - h * 0.95], [cx, cy - h * 1.25], [x1 - 6, cy - h * 0.95]], 2.2, { s: 0.3, e: 0.3 })}" fill="${INK}" opacity=".6"/>`;
      return e;
    };
    s += eye(-64, -8, 52, 22, 7, 2, -6, true) + eye(40, -14, 70, 28, 9, -6, -8, false);
    // furrowed brows (inner ends dragged down) + glabella creases: the grin of someone who has been waiting for this
    s += `<path d="${K.taper([[-114, -46], [-84, -58], [-50, -52], [-22, -30]], 9, { s: 0.25, e: 0.3 })}" fill="${INK}"/>`;
    s += `<path d="${K.taper([[-4, -32], [28, -52], [62, -64], [100, -64]], 10, { s: 0.3, e: 0.3 })}" fill="${INK}"/>`;
    s += line([[-16, -64], [-12, -40]], 3, { s: 0.3, e: 0.3 }) + line([[-6, -70], [-2, -46]], 3, { s: 0.3, e: 0.3 }) + line([[6, -64], [6, -48]], 2.4, { op: 0.6 });
    s += line([[20, 10], [44, 14], [64, 8]], 2.4, { op: 0.5 });
    // nose (3/4, pointing left) with its shadow side
    s += `<path d="${sm([[-6, -18], [-2, 20], [-12, 56], [-30, 64], [-14, 40], [-12, 0]])}" fill="${SKD}"/>`;
    s += `<path d="${K.taper([[-10, -20], [-16, 20], [-34, 58]], 3.4, { s: 0.3, e: 0.1 })}" fill="${INK}"/>`;
    s += `<path d="M-40 60 Q-34 70 -20 66 Q-8 70 -2 62" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    // the open grin: top teeth, tongue, smirk hooked up at the near corner
    const mouth = sm([[-56, 104], [-30, 104], [-6, 104], [24, 98], [56, 88], [66, 86], [58, 108], [36, 136], [0, 152], [-30, 140], [-50, 120]]);
    s += `<path d="${sm([[-62, 104], [-30, 92], [-8, 96], [8, 92], [40, 84], [72, 82], [64, 112], [38, 146], [0, 166], [-34, 152], [-56, 124]])}" fill="${LIP}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="${mouth}" fill="#3a0a16" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<clipPath id="td-mouth"><path d="${mouth}"/></clipPath><g clip-path="url(#td-mouth)">`;
    s += `<path d="${sm([[-60, 98], [-4, 100], [60, 82], [64, 102], [10, 118], [-56, 116]])}" fill="#fff"/>`;
    s += `<path d="M-30 104 L-28 116 M-6 104 L-4 118 M18 100 L20 114 M40 94 L42 108" stroke="#c9c2c8" stroke-width="2.4"/>`;
    s += `<ellipse cx="2" cy="150" rx="34" ry="18" fill="#e0526a"/><path d="M2 136 L4 156" stroke="#a82840" stroke-width="3"/>`;
    s += `<path d="${sm([[-50, 128], [-30, 140], [-12, 146], [-30, 152], [-50, 140]])}" fill="#fff" opacity=".9"/></g>`;
    s += `<path d="${K.taper([[-64, 102], [-30, 92], [8, 94], [44, 84], [76, 76]], 3.6, { s: 0.15, e: 0.2 })}" fill="${INK}"/>`;
    s += line([[66, 88], [84, 72]], 3.4, { s: 0.2, e: 0.6 }) + line([[-60, 108], [-70, 118]], 2.6, { s: 0.2, e: 0.6, op: 0.7 });
    s += `<path d="M-24 158 Q0 170 26 156" fill="none" stroke="#ff8fa6" stroke-width="4" stroke-linecap="round" opacity=".8"/>`;
    s += line([[-14, 178], [10, 182]], 2.6, { op: 0.55 });
    // hair: locks, fringe, bun, gold trâm and the heart ornament
    s += inked(lockFar, HAIR, 5) + inked(lockNear, HAIR, 5);
    s += line([[-124, -20], [-132, 80], [-124, 170]], 3.4, { fill: HL }) + line([[132, -30], [136, 50], [126, 120]], 3.4, { fill: HL });
    s += inked(bangs, HAIR, 6);
    s += line([[90, -188], [20, -176], [-60, -150], [-112, -90]], 4, { fill: HL }) + line([[40, -196], [-20, -186], [-84, -156]], 3, { fill: HL });
    s += inked(bun, '#1b1a3c', 6);
    s += line([[20, -246], [70, -276], [130, -270]], 4, { fill: HL }) + line([[24, -220], [80, -244], [140, -230]], 3.4, { fill: HL });
    s += line([[-56, -232], [214, -300]], 13, { s: 0.02, e: 0.3, min: 0.4 }) + line([[-54, -233], [212, -299]], 8, { s: 0.02, e: 0.3, min: 0.4, fill: '#ffd84a' });
    [[-50, -220], [-46, -196], [-42, -172]].forEach(([x, y]) => (s += `<circle cx="${x}" cy="${y}" r="8" fill="#e0302a" stroke="${INK}" stroke-width="3"/>`));
    s += line([[-54, -232], [-42, -168]], 2.4);
    s += `<path d="M70 -300 c-16 -20 -46 -6 -34 16 l34 30 l34 -30 c12 -22 -18 -36 -34 -16z" fill="#ffd84a" stroke="${INK}" stroke-width="5"/>`;
    s += `</g>`;

    // ---------------------------------------------------------------- arm: one sleeve, one cuff, one hand
    s += inked(sleeve, 'url(#td-sl)', 7, [5, 6]);
    s += `<path d="${sm([[120, 700], [178, 768], [172, 890], [128, 1040], [60, 1040], [110, 880]])}" fill="${INK}" opacity=".3"/>`;
    s += line([[60, 720], [40, 880], [20, 1040]], 5, { s: 0.2, e: 0.6 }) + line([[120, 790], [92, 1040]], 4, { s: 0.2, e: 0.6 }) + line([[10, 680], [-10, 780]], 4, { fill: '#fff4b0', op: 0.8 });
    s += `<g transform="${handT}">`;
    s += inked(wrist, SK, 5);
    s += `<path d="M-40 70 L40 74 L46 120 L-46 116 Z" fill="${SKD}"/>`;
    // cuff (red, gold trim) round the wrist, swallowing the sleeve's end
    s += inked(sm([[-70, 118], [0, 108], [70, 118], [76, 160], [0, 176], [-74, 162]]), '#d62828', 5);
    s += `<path d="${sm([[-66, 128], [0, 118], [68, 128]], false)}" fill="none" stroke="#ffd84a" stroke-width="7"/><path d="${sm([[-66, 128], [0, 118], [68, 128]], false)}" fill="none" stroke="${INK}" stroke-width="2"/>`;
    // the fist, knuckles to camera: four curled fingers stacked index-to-pinky
    s += inked(fist, SK, 6, [4, 5]);
    [[-62, -24, -52, 46], [-26, 12, -54, 48], [10, 46, -52, 44], [44, 78, -46, 36]].forEach(([t, b, x0, x1], i) => {
      s += `<path d="M${x0 + 10} ${t} L${x1 - 8} ${t} Q${x1} ${t} ${x1} ${t + 8} L${x1} ${b - 8} Q${x1} ${b} ${x1 - 8} ${b} L${x0 + 10} ${b} Q${x0} ${b} ${x0} ${b - 10} L${x0} ${t + 10} Q${x0} ${t} ${x0 + 10} ${t}Z" fill="${SK}" stroke="${INK}" stroke-width="4"/>`;
      s += `<path d="M${x0 + 8} ${t + 7} Q${(x0 + x1) / 2} ${t + 2} ${x1 - 10} ${t + 7}" fill="none" stroke="#fff3e0" stroke-width="5" stroke-linecap="round"/>`;
      s += `<path d="M${x0 + 4} ${b - 6} L${x1 - 6} ${b - 6}" stroke="${SKD}" stroke-width="5" stroke-linecap="round"/>`;
      s += line([[x0 + 18, t + 12], [x0 + 18, b - 12]], 2.2, { op: 0.4 });
    });
    // the thumb, jabbed back at herself — "it was me"
    s += inked(thumb, SK, 5, [3, 4]);
    s += `<path d="${sm([[26, -164], [44, -176], [62, -166], [60, -146], [34, -148]])}" fill="#fff0e6" stroke="${INK}" stroke-width="2.6"/>`;
    s += line([[14, -104], [30, -110]], 2.4, { op: 0.55 }) + `<path d="${sm([[58, -60], [64, -110], [66, -150]], false)}" fill="none" stroke="${SKD}" stroke-width="6"/>`;
    s += `</g>`;
    return K.svg(900, 1040, s);
  };

  /* =====================================================================
     STAND: 「STAYIN' ALIVE」 (Tấm) — golden oriole-knight, thị-fruit pauldrons, loom-thread hair.
     Faces right, mid-rush. 900×900
     ===================================================================== */
  ART.ch.stand_tam = function () {
    const G = 'url(#sa-g)', GD = '#a8700a';
    let s = `<defs><linearGradient id="sa-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset=".5" stop-color="#f7c325"/><stop offset="1" stop-color="#b8780a"/></linearGradient>
      <radialGradient id="sa-f" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#fff3a0"/><stop offset=".55" stop-color="#f7c325"/><stop offset="1" stop-color="#a8700a"/></radialGradient>
      <linearGradient id="sa-fade" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="sa-m"><rect width="900" height="900" fill="url(#sa-fade)"/></mask></defs>`;
    s += `<ellipse cx="420" cy="420" rx="380" ry="420" fill="#ffe066" opacity=".22"/>`;
    s += `<g mask="url(#sa-m)">`;
    // thread-hair streaming back (left)
    const th = [];
    for (let i = 0; i < 12; i++) th.push(K.taper([[420, 120 + i * 6], [300, 100 + i * 14], [160, 140 + i * 18], [40, 120 + i * 26]], 7, { s: 0.05, e: 0.95, jit: 10, seed: i }));
    s += `<path d="${th.join('')}" fill="#efe4c8" stroke="${INK}" stroke-width="2"/>`;
    // torso: V-shape
    const torso = sm([[330, 300], [260, 380], [290, 560], [340, 700], [480, 720], [560, 560], [590, 400], [520, 300], [430, 280]]);
    s += inked(torso, G, 8);
    s += `<path d="${sm([[470, 290], [520, 300], [590, 400], [560, 560], [480, 720], [470, 560]])}" fill="${GD}" opacity=".65"/>`;
    // armour lines / abs
    [[[350, 520], [470, 530]], [[356, 580], [466, 590]], [[364, 640], [460, 646]]].forEach((p) => (s += line(p, 5, { s: 0.2, e: 0.2 })));
    s += line([[412, 470], [416, 700]], 5, { s: 0.1, e: 0.1 });
    // chest phoenix gem
    s += `<path d="M360 360 L420 330 L480 360 L470 440 L420 470 L370 440 Z" fill="#fff4c0" stroke="${INK}" stroke-width="6"/><path d="M390 410 q30 -40 60 -8 q-20 -4 -28 12 q-12 -12 -32 -4z" fill="#9a5a00"/>`;
    // pulled-back left arm (behind)
    s += inked(sm([[330, 330], [230, 380], [210, 470], [270, 520], [300, 450], [350, 420]]), G, 6);
    s += inked(sm([[250, 470], [300, 470], [310, 530], [260, 540]]), G, 6);
    // shoulder pauldrons = thị fruits
    s += inked(`M230 330 a80 70 0 1 0 160 0 a80 70 0 1 0 -160 0`, 'url(#sa-f)', 6) + inked(`M470 320 a86 74 0 1 0 172 0 a86 74 0 1 0 -172 0`, 'url(#sa-f)', 6);
    s += inked(`M556 250 L530 236 L548 256 L524 262 L556 266 L560 244 L566 266 L596 262 L572 256 L588 236 Z`, '#2f7a3a', 3);
    s += `<path d="M262 306 q20 -26 50 -26" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M500 294 q22 -28 56 -28" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`;
    // PUNCHING right arm → fist
    s += inked(sm([[560, 330], [680, 340], [800, 360], [820, 420], [700, 440], [580, 420]]), G, 7);
    s += `<path d="${sm([[580, 400], [700, 420], [820, 420], [700, 440]])}" fill="${GD}" opacity=".6"/>`;
    s += inked(sm([[790, 330], [860, 330], [890, 380], [880, 440], [820, 456], [786, 420]]), G, 7);
    [[838, 350, 846, 440], [860, 350, 866, 436]].forEach(([a, b, c, d]) => (s += line([[a, b], [c, d]], 4)));
    s += `<path d="M796 332 L886 340" stroke="${INK}" stroke-width="5"/>`;
    // head: oriole helm with beak visor, glowing eyes, heart gem
    const head = sm([[360, 120], [400, 70], [470, 60], [530, 90], [556, 150], [540, 220], [480, 250], [400, 240], [360, 190]]);
    s += inked(head, G, 7);
    s += inked(`M520 150 L620 176 L528 200 Z`, '#ff5a78', 5);   // beak visor
    s += `<path d="${sm([[380, 150], [470, 140], [540, 150], [530, 180], [460, 186], [384, 184]])}" fill="${INK}"/>`;  // mask band
    s += `<path d="M420 160 L470 158 L464 172 L424 172Z" fill="#3fe6ff"/><path d="M490 160 L524 162 L518 174 L494 172Z" fill="#3fe6ff"/>`;
    s += `<path d="M452 84 c-8 -12 -26 -4 -20 8 l20 18 l20 -18 c6 -12 -12 -20 -20 -8z" fill="#ff3d8b" stroke="${INK}" stroke-width="4"/>`;
    s += line([[392, 216], [470, 236]], 4, { op: 0.6 });
    s += `</g>`;
    // speed streaks from the fist
    s += K.parallel({ x: 560, y: 300, w: 300, h: 170 }, 14, { angle: 180, w: 6, seed: 3, color: '#fff' });
    return K.svg(900, 900, s);
  };

  /* dép tổ ong — the one-piece moulded plastic sandal every Vietnamese mom keeps within reach.
     Seen from above at a slight 3/4 (sole thickness on the right). Local frame: heel at (0,0), toe at (0,-302). */
  ART.depToOng = function (id = 'dto') {
    const sole = sm([[4, -302], [52, -294], [80, -262], [88, -220], [84, -170], [72, -122], [66, -80], [68, -40], [60, -10], [34, 7], [0, 11], [-34, 7], [-60, -10], [-66, -40], [-62, -80], [-60, -122], [-68, -170], [-78, -220], [-74, -264], [-46, -294]]);
    const vamp = sm([[4, -296], [48, -289], [74, -260], [82, -220], [78, -172], [69, -124], [44, -138], [0, -156], [-44, -138], [-59, -124], [-66, -172], [-73, -220], [-68, -260], [-42, -289]]);
    const WHITE = '#fbfaf3', EDGE = '#b9c1cf';
    let s = `<defs><clipPath id="${id}-v"><path d="${vamp}"/></clipPath><clipPath id="${id}-s"><path d="${sole}"/></clipPath>
      <linearGradient id="${id}-sh" x1="0" y1="0" x2="1" y2="0"><stop offset=".35" stop-color="#5a6380" stop-opacity="0"/><stop offset="1" stop-color="#5a6380" stop-opacity=".42"/></linearGradient></defs>`;
    // the sole's thickness with its moulded tread ridges
    s += `<path d="${sole}" fill="${INK}" transform="translate(17 15)"/>`;
    s += `<path d="${sole}" fill="${EDGE}" stroke="${INK}" stroke-width="5" transform="translate(12 10)"/>`;
    const tread = [];
    K.sample([[86, -250], [92, -200], [84, -140], [74, -90], [76, -40], [66, -6], [36, 14], [0, 19], [-30, 15]], false, 15).forEach(([x, y], i, a) => {
      if (i === 0 || i === a.length - 1) return;
      const [px, py] = a[i - 1], [nx, ny] = a[i + 1], tx = nx - px, ty = ny - py, tl = Math.hypot(tx, ty) || 1;
      tread.push(K.taper([[x + 4, y + 2], [x + 4 + (ty / tl) * 9, y + 2 - (tx / tl) * 9]], 3.2, { s: 0.2, e: 0.2 }));
    });
    s += `<path d="${tread.join('')}" fill="${INK}" opacity=".6"/>`;
    // footbed, with its grip nubs
    s += `<path d="${sole}" fill="#eceee8" stroke="${INK}" stroke-width="6"/>`;
    let nubs = '';
    for (let r = 0, y = -138; y < 0; r++, y += 14) for (let x = -70 + (r % 2 ? 7 : 0); x < 74; x += 14) nubs += `<circle cx="${x}" cy="${y}" r="2.6"/>`;
    s += `<g clip-path="url(#${id}-s)"><g fill="#b8bfca">${nubs}</g><path d="${sole}" fill="url(#${id}-sh)"/>`;
    s += `<ellipse cx="0" cy="-60" rx="26" ry="15" fill="none" stroke="#c4cad4" stroke-width="3"/></g>`;
    // the closed toe cap: honeycomb holes, then a thick moulded rim covers the cut-off cells
    s += `<path d="${vamp}" fill="${WHITE}"/>`;
    const R = 8.6, cell = 12.4, holes = [], lips = [];
    for (let c = 0; c < 18; c++) for (let r = 0; r < 16; r++) {
      const cx = -100 + c * cell * 1.5, cy = -312 + r * cell * 1.732 + (c % 2 ? cell * 0.866 : 0);
      if (cy > -108) continue;
      holes.push(`M${K.r1(cx + R)} ${K.r1(cy)}L${K.r1(cx + R / 2)} ${K.r1(cy + R * 0.866)}L${K.r1(cx - R / 2)} ${K.r1(cy + R * 0.866)}L${K.r1(cx - R)} ${K.r1(cy)}L${K.r1(cx - R / 2)} ${K.r1(cy - R * 0.866)}L${K.r1(cx + R / 2)} ${K.r1(cy - R * 0.866)}Z`);
      lips.push(`M${K.r1(cx - R / 2 + 1)} ${K.r1(cy + R * 0.866 - 1.4)}L${K.r1(cx + R / 2 - 1)} ${K.r1(cy + R * 0.866 - 1.4)}`);
    }
    s += `<g clip-path="url(#${id}-v)"><path d="${holes.join('')}" fill="#4b4560"/><path d="${lips.join('')}" stroke="#d7dbe3" stroke-width="2.4"/>`;
    s += `<path d="${vamp}" fill="url(#${id}-sh)"/></g>`;
    s += `<path d="${vamp}" fill="none" stroke="${WHITE}" stroke-width="17" stroke-linejoin="round"/>`;
    s += `<path d="${vamp}" fill="none" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>`;
    s += `<path d="${sm([[-36, -272], [-58, -238], [-62, -196]], false)}" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`;
    // heel strap folded forward over the footbed, riveted at both sides
    s += `<path d="${sm([[-64, -44], [-30, -82], [0, -90], [34, -82], [68, -44]], false)}" fill="none" stroke="${INK}" stroke-width="24" stroke-linecap="round"/>`;
    s += `<path d="${sm([[-64, -44], [-30, -82], [0, -90], [34, -82], [68, -44]], false)}" fill="none" stroke="${WHITE}" stroke-width="15" stroke-linecap="round"/>`;
    s += `<path d="${sm([[-40, -70], [0, -84], [40, -70]], false)}" fill="none" stroke="#c4cad4" stroke-width="3"/>`;
    [[-62, -42], [66, -42]].forEach(([x, y]) => (s += `<circle cx="${x}" cy="${y}" r="10" fill="#dfe3ea" stroke="${INK}" stroke-width="4"/><circle cx="${x - 2}" cy="${y - 2}" r="3" fill="#fff"/>`));
    return s;
  };

  /* =====================================================================
     STAND: 「MAMMA MIA」 (Cám) — it is literally her mom. Hair curlers, floral đồ bộ,
     honeycomb sandal (dép tổ ong) of doom. Faces left, mid-rush. 900×900
     ===================================================================== */
  ART.ch.stand_cam = function () {
    const P = 'url(#mm2-g)', PD = '#b0306a';
    let s = `<defs><linearGradient id="mm2-g" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd1e6"/><stop offset=".5" stop-color="#ff6fa8"/><stop offset="1" stop-color="#b0306a"/></linearGradient>
      <linearGradient id="mm2-fade" x1="0" y1="0" x2="0" y2="900" gradientUnits="userSpaceOnUse"><stop offset=".55" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <mask id="mm2-m" maskUnits="userSpaceOnUse" x="-200" y="-400" width="1300" height="1300"><rect x="-200" y="-400" width="1300" height="1300" fill="url(#mm2-fade)"/></mask>
      <pattern id="mm2-flower" width="70" height="70" patternUnits="userSpaceOnUse"><g transform="translate(20 22)">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-10" rx="7" ry="11" fill="#fff" transform="rotate(${a})"/>`).join('')}<circle r="6" fill="#ffd84a"/></g><circle cx="55" cy="55" r="5" fill="#fff" opacity=".8"/></pattern></defs>`;
    s += `<g transform="translate(36 100) scale(.92)">`;
    s += `<ellipse cx="480" cy="420" rx="390" ry="420" fill="#ff6fa8" opacity=".2"/>`;
    s += `<g mask="url(#mm2-m)">`;
    // torso (broad, floral pyjama set)
    const torso = sm([[360, 300], [290, 400], [310, 560], [360, 720], [560, 730], [620, 560], [650, 400], [580, 300], [470, 280]]);
    s += inked(torso, P, 8);
    s += `<path d="${torso}" fill="url(#mm2-flower)" opacity=".55"/>`;
    s += `<path d="${sm([[360, 300], [290, 400], [310, 560], [360, 720], [420, 720], [400, 500]])}" fill="${PD}" opacity=".5"/>`;
    [[440, 360], [440, 440], [440, 520]].forEach(([x, y]) => (s += `<circle cx="${x}" cy="${y}" r="9" fill="#fff" stroke="${INK}" stroke-width="3"/>`));
    // back arm raised, brandishing the dép tổ ong
    s += inked(sm([[590, 320], [672, 262], [712, 196], [772, 200], [748, 292], [640, 380]]), P, 6);
    s += `<g transform="translate(758 204) rotate(13)">${ART.depToOng('mm2-dep')}</g>` + K.sparkle(872, -60, 30) + K.sparkle(905, 30, 16);
    s += inked(sm([[716, 186], [744, 164], [786, 160], [812, 180], [808, 218], [776, 236], [736, 230]]), '#ffc9a8', 5);
    s += line([[790, 172], [804, 196]], 3.2, { s: 0.2, e: 0.3 }) + line([[778, 184], [794, 212]], 3.2, { s: 0.2, e: 0.3 }) + line([[764, 196], [778, 224]], 3.2, { s: 0.2, e: 0.3 });
    s += inked(sm([[726, 192], [752, 178], [774, 182], [770, 196], [744, 202]]), '#ffc9a8', 4, [2, 3]);
    // PUNCHING arm → left
    s += inked(sm([[360, 330], [240, 340], [100, 360], [80, 420], [220, 440], [340, 420]]), P, 7);
    s += `<path d="${sm([[340, 400], [220, 420], [80, 420], [220, 440]])}" fill="${PD}" opacity=".6"/>`;
    s += `<path d="M280 336 L300 440" stroke="#fff" stroke-width="6" opacity=".6"/>`; // rolled-up sleeve edge
    s += inked(sm([[110, 330], [40, 330], [10, 380], [20, 440], [80, 456], [114, 420]]), '#ffc9a8', 7);
    [[62, 350, 54, 440], [40, 350, 34, 436]].forEach(([a, b, c, d]) => (s += line([[a, b], [c, d]], 4)));
    // head: bun + hair curlers + khăn, furious glowing eyes, gritted teeth
    const head = sm([[380, 130], [420, 80], [490, 70], [550, 100], [570, 170], [550, 240], [490, 270], [420, 262], [384, 210]]);
    s += inked(head, '#ffc9a8', 7);
    s += `<path d="M380 150 L570 150 L570 196 Q480 184 380 200Z" fill="${INK}" opacity=".9"/>`;
    s += `<path d="M400 180 L450 168 L446 184Z" fill="#fff"/><path d="M500 168 L550 180 L504 184Z" fill="#fff"/>`;
    s += `<path d="M420 222 Q476 256 530 220 Q476 240 420 222Z" fill="${INK}"/><path d="M428 226 H524" stroke="#fff" stroke-width="7"/><path d="M430 226 H522" stroke="${INK}" stroke-width="1.5" stroke-dasharray="8 4"/>`;
    s += line([[396, 240], [384, 262]], 3, { op: 0.6 }) + line([[556, 236], [568, 258]], 3, { op: 0.6 });
    s += inked(sm([[372, 120], [400, 60], [480, 40], [560, 60], [584, 130], [540, 100], [470, 90], [410, 110]]), '#2d1a2a', 6);
    [[410, 70], [460, 52], [512, 54], [558, 80]].forEach(([x, y]) => (s += `<rect x="${x - 18}" y="${y - 12}" width="36" height="24" rx="10" fill="#7fd6ff" stroke="${INK}" stroke-width="4"/>`));
    s += `<circle cx="376" cy="210" r="11" fill="#f7c325" stroke="${INK}" stroke-width="4"/>`;
    // vein pop (anger mark)
    s += `<path d="M590 60 l14 14 m-14 0 l14 -14 M606 58 q10 8 0 18" stroke="#e0302a" stroke-width="6" fill="none"/>`;
    s += `</g>`;
    s += K.parallel({ x: 40, y: 300, w: 300, h: 170 }, 14, { angle: 0, w: 6, seed: 5, color: '#fff' });
    return K.svg(900, 900, s + '</g>');
  };

  /* big boiling bath-pot (canon ending). 800×700 */
  ART.ch.bathpot = function () {
    let s = `<defs><linearGradient id="bp-m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6b6f78"/><stop offset=".4" stop-color="#b9c0c9"/><stop offset="1" stop-color="#3a3e46"/></linearGradient></defs>`;
    // fire underneath
    const rnd = U.rng(3), fl = [];
    for (let i = 0; i < 14; i++) { const x = 180 + i * 34; fl.push(K.taper([[x, 700], [x + (rnd() - 0.5) * 30, 620], [x + (rnd() - 0.5) * 40, 540 - rnd() * 60]], 50, { s: 0.05, e: 1, min: 0 })); }
    s += `<path d="${fl.join('')}" fill="#ff7a2e" stroke="${INK}" stroke-width="4"/>`;
    s += `<path d="${fl.join('')}" fill="#ffd36b" transform="translate(12 40) scale(.96)"/>`;
    // pot
    s += inked(`M80 240 Q60 520 400 600 Q740 520 720 240 Z`, 'url(#bp-m)', 9);
    s += `<path d="M560 250 Q700 300 700 420 Q650 540 480 590 Q620 460 560 250Z" fill="${INK}" opacity=".35"/>`;
    s += inked(`M40 220 Q400 170 760 220 L760 262 Q400 312 40 262 Z`, '#7a7e88', 8);
    // boiling water surface
    s += `<ellipse cx="400" cy="236" rx="330" ry="46" fill="#9fe3ff" stroke="${INK}" stroke-width="6"/>`;
    for (let i = 0; i < 16; i++) { const x = 120 + rnd() * 560, y = 214 + rnd() * 40, r = 10 + rnd() * 22; s += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="#dff7ff" stroke="${INK}" stroke-width="3"/>`; }
    // handles
    s += `<path d="M40 250 q-40 20 -20 70" fill="none" stroke="${INK}" stroke-width="18"/><path d="M760 250 q40 20 20 70" fill="none" stroke="${INK}" stroke-width="18"/>`;
    return K.svg(800, 700, s);
  };

  /* throne in the white void (wry ending): a tiny Cám on a huge throne. 400×560 */
  ART.ch.throne = function () {
    let s = '';
    s += inked(`M60 120 L60 540 L340 540 L340 120 Q200 20 60 120 Z`, '#6b1c3c', 8);
    s += inked(`M40 380 L360 380 L360 440 L40 440 Z`, '#b8323a', 7);
    s += `<path d="M90 140 Q200 70 310 140" fill="none" stroke="#f7c325" stroke-width="10"/><circle cx="200" cy="90" r="20" fill="#f7c325" stroke="${INK}" stroke-width="5"/>`;
    // tiny Cám slumped on it, hat askew
    s += inked(sm([[170, 300], [160, 380], [240, 380], [230, 300], [200, 290]]), '#26205c', 5);
    s += inked(sm([[180, 250], [220, 250], [226, 290], [200, 302], [176, 290]]), '#f0c9a0', 4);
    s += `<path d="M170 250 L200 214 L236 250 Z" fill="#e9d49c" stroke="${INK}" stroke-width="4" transform="rotate(-18 200 240)"/>`;
    s += `<path d="M190 280 q10 -4 20 0" stroke="${INK}" stroke-width="3" fill="none"/><circle cx="192" cy="268" r="2.5" fill="${INK}"/><circle cx="210" cy="268" r="2.5" fill="${INK}"/>`;
    s += inked(sm([[176, 380], [170, 440], [190, 440], [196, 380]]), '#1a1640', 4) + inked(sm([[206, 380], [214, 440], [234, 440], [226, 380]]), '#1a1640', 4);
    return K.svg(400, 560, s);
  };

  /* the storybook (hungry ending). variants 0 (whole) / 1 (bitten) / 2 (mostly eaten). 800×620 */
  ART.ch.book = function (v = '0') {
    const bites = +v || 0;
    let s = `<defs><clipPath id="bk-c${bites}"><path d="${bites === 0 ? 'M0 0 H800 V620 H0Z' : bites === 1 ? 'M0 0 H620 Q660 60 700 40 Q740 90 800 80 V620 H0Z' : 'M0 0 H300 Q340 80 400 60 Q440 140 500 120 Q560 220 620 200 Q680 300 800 300 V620 H0Z'}"/></clipPath></defs>`;
    s += `<g clip-path="url(#bk-c${bites})">`;
    s += inked(`M20 80 Q200 40 400 90 Q600 40 780 80 L780 590 Q600 550 400 600 Q200 550 20 590 Z`, '#8a1c1c', 8);
    s += `<path d="M40 70 Q210 30 400 80 L400 580 Q210 530 40 570Z" fill="#fbf3dc" stroke="${INK}" stroke-width="6"/>`;
    s += `<path d="M760 70 Q590 30 400 80 L400 580 Q590 530 760 570Z" fill="#f4ead0" stroke="${INK}" stroke-width="6"/>`;
    for (let i = 0; i < 9; i++) { s += `<path d="M80 ${150 + i * 44} Q220 ${130 + i * 44} 370 ${160 + i * 44}" stroke="#9a8a70" stroke-width="6" fill="none" opacity=".6"/>`; s += `<path d="M430 ${160 + i * 44} Q580 ${130 + i * 44} 720 ${150 + i * 44}" stroke="#9a8a70" stroke-width="6" fill="none" opacity=".6"/>`; }
    // chapter ornament instead of text (art is rasterized without web fonts)
    s += `<path d="M150 118 Q220 90 290 118" fill="none" stroke="#8a1c1c" stroke-width="6"/><circle cx="220" cy="104" r="12" fill="#f7c325" stroke="${INK}" stroke-width="4"/>`;
    s += `<path d="${K.taper([[190, 130], [210, 100], [205, 70]], 5, { s: 0.1, e: 0.8, fill: '#3a9d4a' })}" fill="#3a9d4a"/><path d="${K.taper([[250, 130], [230, 100], [236, 70]], 5, { s: 0.1, e: 0.8 })}" fill="#3a9d4a"/>`;
    s += `<text x="580" y="560" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#6b4a2a">47</text>`;
    s += `<path d="M400 80 L400 600" stroke="${INK}" stroke-width="7"/>`;
    s += `</g>`;
    if (bites) s += `<path d="${bites === 1 ? 'M620 0 Q660 60 700 40 Q740 90 800 80' : 'M300 0 Q340 80 400 60 Q440 140 500 120 Q560 220 620 200 Q680 300 800 300'}" fill="none" stroke="${INK}" stroke-width="8" stroke-dasharray="18 10"/>`;
    return K.svg(800, 620, s);
  };

  /* PAGE 47 — the page with the ending, looming in the sky. 700×880 */
  ART.ch.page47 = function () {
    let s = '';
    s += inked(`M40 40 L620 20 L680 90 L660 860 L60 850 Z`, '#fbf3dc', 9);
    s += `<path d="M620 20 L680 90 L618 86 Z" fill="#e8dcc0" stroke="${INK}" stroke-width="6"/>`;
    for (let i = 0; i < 12; i++) s += `<path d="M110 ${210 + i * 48} H${580 - (i % 3) * 60}" stroke="#9a8a70" stroke-width="8" opacity=".7"/>`;
    s += `<text x="360" y="150" text-anchor="middle" font-family="Georgia,serif" font-size="80" font-weight="bold" fill="#8a1c1c">47</text>`;
    // the fateful line, circled in red
    s += `<path d="M110 450 H560" stroke="#c0392b" stroke-width="10"/><ellipse cx="335" cy="452" rx="250" ry="40" fill="none" stroke="#e0302a" stroke-width="7" stroke-dasharray="4 0"/>`;
    s += `<path d="M560 520 q40 40 90 30" fill="none" stroke="#e0302a" stroke-width="6"/><text x="600" y="600" font-family="Bangers" font-size="44" fill="#e0302a">!!</text>`;
    // menacing glare in the page margins
    s += `<path d="M90 780 Q130 756 170 780 Q130 796 90 780Z" fill="${INK}"/><path d="M510 780 Q550 756 590 780 Q550 796 510 780Z" fill="${INK}"/><circle cx="130" cy="778" r="7" fill="#e0302a"/><circle cx="550" cy="778" r="7" fill="#e0302a"/>`;
    return K.svg(700, 880, s);
  };

})();
