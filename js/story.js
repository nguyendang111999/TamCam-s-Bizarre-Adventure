/* story.js — the script. Every line is bilingual: L(english, tiếng việt).
   Structure (after Slay the Princess): each chapter the "princess" (Tấm) returns in a new form,
   and each chapter's defining choice gives Cám a new Voice. Voices unlock endings. */
(function () {
  'use strict';
  const TC = window.TC;
  const { L, N, say, me, V, choice, bg, show, hide, swap, move, flag, has, get, inc, hasVoice, gainVoice, pickVoice, music, stopMusic, sfx, wait, chapter, tbc, fx, ui } = TC.api;
  const MG = () => TC.minigames;
  const plays = () => TC.persist.data.plays || 0;

  /* ================================================================ VOICES */
  TC.voices = {
    menacing: {
      id: 'menacing', glyph: 'ゴ', color: '#a66bff', tint: '#f1e8ff', numeral: 'XXIII',
      name: L('THE MENACING', 'KẺ HĂM DỌA'), short: L('MENACING', 'HĂM DỌA'),
      kicker: L('A NEW VOICE STANDS BY YOU', 'MỘT TIẾNG LÒNG THỨC TỈNH'),
    },
    sister: {
      id: 'sister', glyph: '姉', color: '#ff6fa8', tint: '#ffeef5', numeral: 'XXIV',
      name: L('THE SISTER', 'ĐỨA EM'), short: L('SISTER', 'ĐỨA EM'),
      kicker: L('A NEW VOICE STANDS BY YOU', 'MỘT TIẾNG LÒNG THỨC TỈNH'),
    },
    coward: {
      id: 'coward', glyph: '逃', color: '#34d17c', tint: '#e9fff2', numeral: 'XXV',
      name: L('THE COWARD', 'KẺ NHÁT GAN'), short: L('COWARD', 'NHÁT GAN'),
      kicker: L('A NEW VOICE STANDS BY YOU', 'MỘT TIẾNG LÒNG THỨC TỈNH'),
    },
    hungry: {
      id: 'hungry', glyph: '食', color: '#ff8a1f', tint: '#fff2e3', numeral: 'XXVI',
      name: L('THE HUNGRY', 'KẺ HÁU ĂN'), short: L('HUNGRY', 'HÁU ĂN'),
      kicker: L('A NEW VOICE STANDS BY YOU', 'MỘT TIẾNG LÒNG THỨC TỈNH'),
    },
  };

  const INTRO = {
    menacing: [
      L('ゴゴゴゴ… Do you feel that? That\'s *menace*. It\'s coming from us.', 'ゴゴゴゴ… Cảm thấy không? Đó là *sát khí*. Nó tỏa ra từ chúng ta.'),
      L('I\'m the part of you that swung the axe and thought, "Huh. Nice." If we\'re the villain, we villain PROPERLY. With posing.', 'Ta là phần trong ngươi đã vung rìu và nghĩ: "Hử. Đã tay đấy." Đã làm phản diện thì phải cho RA TRÒ. Có tạo dáng hẳn hoi.'),
    ],
    sister: [
      L('…Hi. I\'m the part of you that didn\'t want to do it.', '…Chào. Mình là phần trong cậu đã không muốn làm chuyện đó.'),
      L('Remember when she piggybacked you across the stream? No? I do. That\'s kind of my whole job.', 'Còn nhớ hồi nhỏ chị ấy cõng cậu qua suối không? Không à? Mình nhớ. Nhiệm vụ của mình là nhớ đấy.'),
    ],
    coward: [
      L('Hi! New voice! Quick question: can we leave? The palace. The country. The genre.', 'Chào! Tiếng lòng mới nè! Hỏi nhanh: mình về được chưa? Về khỏi cung. Khỏi nước. Khỏi cái thể loại truyện này.'),
      L('I\'m the part of you that turned around on that path. I\'d love to keep turning.', 'Tui là phần trong bà đã quay đầu trên con đường đó. Tui muốn quay đầu tiếp.'),
    ],
    hungry: [
      L('Hello! I\'m the part of you that ate the fish. And the bird. No regrets. Just a light appetite.', 'Chào nha! Tui là phần trong bà đã ăn con cá bống. Rồi con chim. Không hối hận. Chỉ hơi đói.'),
      L('Is there a snack in this scene? There\'s always a snack.', 'Cảnh này có gì ăn vặt không? Lúc nào chả có.'),
    ],
  };
  const NARR_REACT = [
    L('…Who said that? There\'s nobody else in this scene.', '…Ai vừa nói đấy? Cảnh này làm gì có ai khác.'),
    L('…There are TWO of you now? I don\'t remember writing either of you.', '…Giờ có tới HAI đứa các người à? Ta nhớ đâu có viết ra các người.'),
    L('Oh, come ON. How many of you ARE there?', 'Ôi thôi đi. Rốt cuộc có BAO NHIÊU đứa các người?'),
  ];
  async function newVoice(id) {
    if (!id) return;
    await gainVoice(id);
    for (const l of INTRO[id]) await V(id, l);
    await N(NARR_REACT[Math.min(2, TC.state.voices.length - 1)]);
  }
  // every owned voice reacts, in acquisition order
  async function chorus(lines) {
    for (const id of TC.state.voices.slice()) if (lines[id]) await V(id, lines[id]);
  }

  /* ================================================================ CHAPTER I — THE ARECA TREE */
  const ch1 = async () => {
    await fx.fadeTo('#140b16', 1);
    await chapter('ch1', L('CHAPTER I', 'CHƯƠNG I'), L('THE ARECA TREE', 'CÂY CAU'), L('Cây Cau', 'The Areca Tree'));
    music('path');
    if (plays() > 0) await N(L('Once upon a time… hm. Strange. I have the oddest feeling I\'ve said that before.', 'Ngày xửa ngày xưa… hừm. Lạ nhỉ. Ta có cảm giác mình từng nói câu này rồi.'));
    else {
      await N(L('Once upon a time…', 'Ngày xửa ngày xưa…'));
      await N(L('No. Let\'s skip that part. You know how this one goes. Everyone does.', 'Thôi. Bỏ qua đoạn đó đi. Chuyện này ai mà chẳng thuộc.'));
    }
    await bg('path', { tr: 'black', ms: 1200 });
    await N(L('You\'re on a path in the rice fields. At the end of the path is an areca tree. And at the top of that areca tree is your sister, Tấm.', 'Cô đang đi trên con đường làng giữa cánh đồng lúa. Cuối con đường là một cây cau. Và trên ngọn cây cau ấy là chị cô — Tấm.'));
    await N(L('You\'re here to chop it down.', 'Cô đến đây để chặt nó.'));
    await N(L('If you don\'t, she\'ll marry the King, become Queen, and eventually — I\'ve read ahead — boil you alive, turn you into fish sauce, and mail you to your mother.', 'Nếu không, cô ta sẽ lấy vua, làm hoàng hậu, rồi — ta đọc trước rồi — dội nước sôi vào cô, làm mắm, gửi về cho mẹ cô ăn.'));
    await N(L('So. Chop-chop.', 'Vậy nên. Chặt lẹ đi.'));

    const asked = {};
    for (; ;) {
      const c = await choice([
        { id: 'walk', text: L('[Walk to the tree.]', '[Đi tới cây cau.]') },
        { id: 'who', text: L('"Who are you, exactly?"', '"Ông là ai vậy?"'), cond: () => !asked.who },
        { id: 'sauce', text: L('"Sorry — FISH SAUCE?"', '"Khoan — LÀM MẮM á?"'), cond: () => !asked.sauce },
        { id: 'leave', text: L('[Turn around and walk away.]', '[Quay lưng bỏ đi.]') },
      ]);
      asked[c] = true;
      if (c === 'who') {
        await N(L('I\'m the Narrator. I\'ve told this story ten thousand times. Grandmothers tell it. Teachers tell it. It\'s in the textbook.', 'Ta là Người Kể Chuyện. Chuyện này ta kể mười nghìn lần rồi. Bà kể. Cô giáo kể. Có cả trong sách giáo khoa.'));
        await N(L('You are Cám — it means "rice bran". Your sister is Tấm — "broken rice". Your mother named you both after pig feed.', 'Cô là Cám — tức là cám gạo. Chị cô là Tấm — tức là gạo tấm. Mẹ cô đặt tên hai đứa theo… thức ăn cho lợn.'));
        await N(L('We don\'t talk about it.', 'Chuyện đó ta không bàn.'));
      } else if (c === 'sauce') {
        await N(L('Mắm. Fermented. Delivered in a jar. It\'s a very old story — people had different hobbies back then.', 'Mắm. Ủ chượp hẳn hoi. Đóng hũ gửi đi. Chuyện xưa mà — người xưa có sở thích hơi khác.'));
        await N(L('Which is exactly why you\'re going to chop first.', 'Chính vì thế mà cô phải chặt trước.'));
      } else if (c === 'leave') {
        flag('fled');
        await N(L('You turn your back on the tree, the axe, and your destiny, and you walk away down the path.', 'Cô quay lưng với cây cau, cái rìu, và số phận, rồi bỏ đi.'));
        await bg('path', { tr: 'wipe', ms: 900 });
        await N(L('…and at the end of the path is an areca tree.', '…và cuối con đường là một cây cau.'));
        await N(L('Hm. Would you look at that.', 'Ồ. Nhìn kìa.'));
        await N(L('It\'s a very short story, Cám. It only has the one path.', 'Truyện này ngắn lắm, Cám. Chỉ có đúng một con đường thôi.'));
        break;
      } else break;
    }

    // ---- at the tree
    await bg('tree', { tr: 'wipe' });
    await show('areca', { variant: 'tam', x: 560, y: -40, w: 900, anim: 'fade', z: 1, origin: '52% 99%' });
    await show('axe', { x: 680, y: 600, w: 300, anim: 'up', z: 3 });
    await N(L('The areca tree is tall. Unreasonably tall. It looks like it\'s trying to escape into the sky, and honestly? Same.', 'Cây cau cao. Cao vô lý. Nó cao như thể muốn trốn lên trời, mà nói thật… ai chẳng muốn.'));
    fx.panel('p:axe', TC.art.panel.axe, { x: 1180, y: 170, w: 620, h: 420 }, { rot: 3 });
    sfx('sparkle');
    fx.sfx('キラーン', { x: 1500, y: 150, style: 'gold', size: 110, rot: 8 });
    await N(L('Leaning against the trunk is an axe. Its blade is pristine. Someone has sharpened it with love.', 'Dựa vào gốc cây là một cái rìu. Lưỡi rìu sáng loáng. Có ai đó đã mài nó bằng cả tấm lòng.'));
    fx.closePanels();
    if (plays() > 0) await say('tam', L('Cám? Is that you down there? …Oh. It\'s this part again.', 'Cám ơi? Em đấy à? …Ồ. Lại là đoạn này.'), { tail: 1000, tailH: 160 });
    else await say('tam', L('Cám? Is that you down there?', 'Cám ơi? Em đấy à?'), { tail: 1000, tailH: 160 });
    await say('tam', L('Mom said to pick areca nuts for Dad\'s memorial! It\'s sooo windy up here!', 'Dì bảo chị trèo hái cau cúng giỗ cha! Trên này gió ghê lắm!'), { tail: 1000, tailH: 160 });
    await N(L('Ignore her. She\'s doing a voice. Pick up the axe.', 'Kệ cô ta. Cô ta đang giả giọng hiền đấy. Cầm rìu lên.'));

    let talked = false, result = null;
    while (!result) {
      const c = await choice([
        { id: 'axe', text: L('[Pick up the axe.]', '[Cầm rìu lên.]') },
        { id: 'talk', text: L('"Hi, sis! …Nice view up there?"', '"Chị ơi! …Trên đó ngắm cảnh đẹp không?"'), cond: () => !talked },
        { id: 'refuse', text: L('[Leave the axe where it is.]', '[Để yên cái rìu đó.]') },
      ]);
      if (c === 'talk') {
        talked = true;
        await say('tam', L('The best! I can see the palace from here. And the river. And… hey.', 'Đẹp lắm! Chị thấy cả cung vua. Cả dòng sông. Mà… ơ kìa.'), { tail: 1000, tailH: 160 });
        await say('tam', L('Why are you standing next to an axe?', 'Sao em lại đứng cạnh cái rìu thế?'), { tail: 1000, tailH: 160 });
        await me(L('No reason.', 'Không có gì ạ.'));
        await say('tam', L('Okay! You look tense, though.', 'Ừ! Mà trông em căng thẳng quá.'), { tail: 1000, tailH: 160 });
        stopMusic(0.3); sfx('menace'); fx.menace(true, { every: 300 });
        await say('tam', L('Have you considered… a bath?', 'Em có muốn… đi tắm không?'), { style: 'shout', tail: 1000, tailH: 160 });
        fx.menace(false); music('path');
        await N(L('Did you hear that? That was foreshadowing.', 'Nghe thấy chưa? Cái đó gọi là điềm báo.'));
      } else if (c === 'axe') {
        flag('tookAxe');
        await move('axe', { x: 820, y: 560, rot: -25 }, 400);
        await N(L('You pick up the axe. The handle fits your hand perfectly, as if it had been carved for exactly this moment.', 'Cô cầm rìu lên. Cán rìu vừa khít tay, như thể được đẽo riêng cho khoảnh khắc này.'));
        await N(L('It was. By me.', 'Đúng thế đấy. Ta đẽo.'));
        let called = false;
        for (; ;) {
          const d = await choice([
            { id: 'chop', text: L('[CHOP.]', '[CHẶT.]') },
            { id: 'down', text: L('"Sis! Come down from there!"', '"Chị ơi! Xuống đây đi!"'), cond: () => !called },
            { id: 'drop', text: L('[Put the axe back down.]', '[Đặt rìu xuống.]') },
          ]);
          if (d === 'down') {
            called = true;
            await say('tam', L('Why? I just got up here!', 'Sao thế? Chị vừa leo lên mà!'), { tail: 1000, tailH: 160 });
            await say('tam', L('…Why are you holding the axe like that, Cám?', '…Sao em cầm rìu kiểu đó hả Cám?'), { tail: 1000, tailH: 160 });
            await N(L('Don\'t answer that. Chop.', 'Đừng trả lời. Chặt.'));
            continue;
          }
          result = d === 'chop' ? 'chop' : 'refuse';
          break;
        }
      } else result = 'refuse';
    }

    if (result === 'chop') {
      flag('chopped');
      await MG().chop();
    } else {
      flag('refused'); inc('kind');
      await N(L('You leave the axe exactly where it is. You fold your arms. You are making a statement.', 'Cô để nguyên cái rìu. Cô khoanh tay. Cô đang thể hiện quan điểm.'));
      await N(L('The statement is: "I would like to be the villain of a different, less murdery story."', 'Quan điểm đó là: "Tôi muốn làm phản diện trong một câu chuyện khác, ít án mạng hơn."'));
      await N(L('Unfortunately, there isn\'t one. …Fine. The story has other hands.', 'Tiếc là không có chuyện nào như thế. …Được thôi. Câu chuyện còn những bàn tay khác.'));
      await MG().momChop();
    }

    await N(L('And so Tấm fell — exactly as written. Next, you replace her as Queen. Nobody will notice. The King is not a details man.', 'Và thế là Tấm ngã — đúng như sách viết. Tiếp theo, cô thế chỗ chị làm hoàng hậu. Chẳng ai nhận ra đâu. Nhà vua không phải người để ý tiểu tiết.'));
    await N(L('He chose his wife by shoe size. Let\'s leave it at that.', 'Ông ấy chọn vợ bằng cỡ giày. Thôi, ta không nói thêm.'));
    if (has('chopped')) await N(L('…You did swing that axe with real enthusiasm, though. I noticed. Something inside you noticed too.', '…Mà công nhận cô vung rìu hăng thật. Ta để ý rồi. Và có thứ gì đó bên trong cô cũng để ý.'));
    else if (has('fled')) await N(L('…And you did try to run away. Something inside you is still running.', '…Mà cô đã từng định bỏ chạy. Có thứ gì đó bên trong cô vẫn đang chạy.'));
    else await N(L('…You wouldn\'t do it yourself, though. Something inside you refused.', '…Mà cô không tự tay làm. Có thứ gì đó bên trong cô đã từ chối.'));
    flag('v1', has('chopped') ? 'menacing' : has('fled') ? 'coward' : 'sister');
    await tbc();
    return 'ch2';
  };

  /* ================================================================ CHAPTER II — THE GOLDEN ORIOLE */
  const ch2 = async () => {
    await chapter('ch2', L('CHAPTER II', 'CHƯƠNG II'), L('THE GOLDEN ORIOLE', 'CHIM VÀNG ANH'), L('Chim Vàng Anh', 'The Golden Oriole'));
    await bg('courtyard', { tr: 'black' });
    music('palace');
    await N(L('The palace courtyard. You are the Queen now. Congratulations. Queens, it turns out, still do laundry.', 'Sân sau hoàng cung. Giờ cô là hoàng hậu. Chúc mừng. Hóa ra hoàng hậu vẫn phải giặt đồ.'));
    await newVoice(get('v1'));
    sfx('flap');
    await show('bird', { x: 1180, y: 196, w: 360, anim: 'down', z: 3 });
    sfx('sing');
    await say('bird', L('♪ Wash my husband\'s shirt, and wash it clean! ♪ Dry it on a pole — not the fence, you fiend! ♪', '♪ Giặt áo chồng tao, thì giặt cho sạch! ♪ Phơi áo chồng tao, phơi lao phơi sào — chớ phơi bờ rào, rách áo chồng tao! ♪'), { tail: 1330 });
    await N(L('Yes. That is Tấm. She\'s a bird now. This is normal. It\'s in the text.', 'Phải. Đó là Tấm. Giờ cô ta là chim. Chuyện bình thường. Sách có ghi.'));
    await say('bird', L('Tweet. Also, you\'re using way too much soap.', 'Chíp. Với lại em dùng nhiều bồ kết quá đấy.'), { tail: 1330 });
    await chorus({
      menacing: L('A BIRD is taunting us. Stand up. Strike a pose. Show her who the protagonist is.', 'Một CON CHIM đang khiêu khích chúng ta. Đứng dậy. Tạo dáng. Cho nó biết ai mới là nhân vật chính.'),
      sister: L('She sounds… okay? Healthy, for a bird. I\'m glad.', 'Nghe giọng chị ấy… ổn nhỉ? Khỏe re, so với một con chim. Mừng ghê.'),
      coward: L('Haunted bird. Cool. Love that for us. Can we go inside?', 'Chim ma. Tuyệt. Hay quá ha. Mình vô nhà được chưa?'),
    });

    let cried = false, pref;
    for (; ;) {
      const c = await choice([
        { id: 'shoo', text: L('[Shoo the bird away.]', '[Xua con chim đi.]') },
        { id: 'talk', text: L('"…Sis? Is that really you?"', '"…Chị? Đúng là chị thật à?"') },
        { id: 'eat', text: L('[Stare at the bird. It looks… delicious.]', '[Nhìn con chim. Trông nó… ngon ghê.]') },
        { id: 'hide', text: L('[Hide in the laundry basket.]', '[Trốn vào thúng quần áo.]') },
        { id: 'cry', text: L('[Fake-cry so someone comes to help you.]', '[Giả vờ khóc cho có người tới giúp.]'), cond: () => !cried },
      ]);
      if (c === 'cry') {
        cried = true; flag('butSnub');
        sfx('cry');
        await me(L('Huhuhu… huhuhuhu…', 'Hu hu hu… hu hu…'), { style: 'shout' });
        await MG().butAppear(560, 170);
        await say('but', L('Why are you crying, my child?', 'Làm sao con khóc?'), { tail: 800 });
        await wait(400);
        await say('but', L('…Oh. It\'s you.', '…À. Con à.'), { tail: 800 });
        await MG().butVanish();
        await say('bird', L('HA!', 'HA!'), { style: 'shout', tail: 1330 });
        await N(L('He only shows up for her. It\'s a whole thing.', 'Ông ấy chỉ hiện ra vì cô ta thôi. Chuyện dài lắm.'));
        continue;
      }
      if (c === 'shoo') {
        pref = ['menacing', 'coward', 'hungry', 'sister'];
        await N(L('You flap the King\'s wet shirt at the bird. It dodges without even looking.', 'Cô vẩy cái áo ướt của vua về phía con chim. Nó né mà chẳng thèm nhìn.'));
        await move('bird', { x: 1250, y: 150 }, 180); await move('bird', { x: 1180, y: 196 }, 220);
        await say('bird', L('Too slow. Weak! WEAK!', 'Chậm quá. Yếu! YẾU XÌU!'), { style: 'shout', tail: 1330 });
      } else if (c === 'talk') {
        pref = ['sister', 'coward', 'menacing', 'hungry']; inc('kind');
        await say('bird', L('Who else would sing about laundry, Cám?', 'Chứ còn ai rảnh mà hát về chuyện giặt đồ hả Cám?'), { tail: 1330 });
        await say('bird', L('…It\'s cold, being a bird. Nobody tells you that.', '…Làm chim lạnh lắm. Chẳng ai nói cho chị biết điều đó.'), { tail: 1330 });
      } else if (c === 'eat') {
        pref = ['hungry', 'menacing', 'coward', 'sister']; flag('hungryBird');
        sfx('gulp');
        await N(L('In the original story, you literally eat it. So. Consistent characterization.', 'Trong truyện gốc, cô ăn nó thật. Nên… nhân vật rất nhất quán.'));
        await say('bird', L('Don\'t. You. DARE.', 'Mày. Mà. DÁM.'), { style: 'shout', tail: 1330 });
      } else {
        pref = ['coward', 'sister', 'hungry', 'menacing'];
        await N(L('You climb into the laundry basket and pull a royal robe over your head. Very regal.', 'Cô chui vào thúng quần áo, trùm áo long bào lên đầu. Trông rất ra dáng hoàng hậu.'));
        await say('bird', L('I can see your feet, Cám.', 'Chị thấy chân em rồi, Cám.'), { tail: 1330 });
      }
      break;
    }

    await show('king', { x: 1250, y: 170, w: 690, anim: 'right', z: 2 });
    await say('king', L('Oriole, oriole! If you are my wife… fly into my sleeve!', 'Vàng ảnh vàng anh! Có phải vợ anh… chui vào tay áo!'), { style: 'shout', tail: 1560 });
    await MG().birdToSleeve();
    await N(L('And the King, a man who has apparently never seen a bird before, falls in love with it instantly.', 'Và nhà vua, một người có vẻ như chưa từng thấy con chim nào, lập tức phải lòng nó.'));
    await say('king', L('My Queen! …Not you. The bird.', 'Hoàng hậu của trẫm! …Không phải nàng. Con chim kia.'), { tail: 1560 });
    await hide('king', { anim: 'right' });
    await chorus({
      menacing: L('He left us. For a BIRD. The disrespect. ゴゴゴゴ', 'Hắn bỏ chúng ta. Vì một CON CHIM. Thật là sỉ nhục. ゴゴゴゴ'),
      sister: L('…He does look really happy, though.', '…Nhưng mà trông anh ấy hạnh phúc thật.'),
      coward: L('Great. Now the bird has political power.', 'Hay rồi. Giờ con chim có cả quyền lực chính trị.'),
    });
    await N(L('And so, as the story demands, the bird met with an unfortunate accident involving a cooking pot.', 'Và thế là, theo đúng yêu cầu cốt truyện, con chim gặp một tai nạn đáng tiếc liên quan tới… nồi canh.'));
    await MG().potDrop();
    if (has('hungryBird')) await N(L('You had seconds.', 'Cô còn xin thêm bát nữa.'));
    await N(L('Its feathers became a tree. You chopped it down. It became a loom. …I\'m summarizing. We\'re on a schedule.', 'Lông chim mọc thành cây xoan đào. Cô chặt cây. Gỗ đóng thành khung cửi. …Ta tóm tắt đấy. Chúng ta có lịch trình.'));
    flag('v2', pickVoice(pref));
    await tbc();
    return 'ch3';
  };

  /* ================================================================ CHAPTER III — THE LOOM */
  const ch3 = async () => {
    await chapter('ch3', L('CHAPTER III', 'CHƯƠNG III'), L('THE LOOM', 'KHUNG CỬI'), L('Khung Cửi', 'The Loom'));
    await bg('loomroom', { tr: 'black' });
    music('loom');
    await show('loom', { variant: 'calm', x: 560, y: 150, w: 800, anim: 'fade', z: 1 });
    await N(L('Night. You sit at the loom that was the tree, that was the bird, that was your sister. Weaving is relaxing. Weave something.', 'Đêm. Cô ngồi bên khung cửi từng là cái cây, từng là con chim, từng là chị cô. Dệt vải giúp thư giãn. Dệt gì đó đi.'));
    await newVoice(get('v2'));
    await MG().weave();
    await say('loom', L('Clickety-clack, little sister. How\'s my husband?', 'Cót ca cót két, em gái ơi. Chồng chị dạo này khỏe không?'), { tail: 960 });
    await N(L('Don\'t engage with the furniture.', 'Đừng nói chuyện với đồ đạc.'));
    await chorus({
      menacing: L('Oh, she\'s GOOD. That was genuinely menacing. I\'m taking notes.', 'Ồ, ả giỏi đấy. Đáng sợ thật sự. Ta phải ghi chép lại.'),
      sister: L('She\'s not angry. She\'s… hurt. Listen to her voice.', 'Chị ấy không giận đâu. Chị ấy… đau. Nghe giọng chị ấy mà xem.'),
      coward: L('NOPE. The furniture is threatening us. I\'m out. Legs, let\'s go.', 'THÔI XONG. Đồ đạc đang dọa giết mình. Tui té đây. Chân ơi, chạy.'),
      hungry: L('Can you eat a loom? Asking for me. I\'m the one asking.', 'Khung cửi ăn được không? Hỏi giùm tui. À mà tui là người hỏi.'),
    });
    const tag = (v) => (hasVoice(v) ? v : undefined);
    const c = await choice([
      { id: 'burn', text: L('[Burn it.]', '[Đốt nó đi.]'), tag: tag('menacing') },
      { id: 'sorry', text: L('"…I\'m sorry."', '"…Em xin lỗi."'), tag: tag('sister') },
      { id: 'bite', text: L('[Take a bite out of it.]', '[Cắn thử một miếng.]'), tag: tag('hungry') },
      { id: 'run', text: L('[Run.]', '[Chạy.]'), tag: tag('coward') },
    ]);
    let pref;
    if (c === 'burn') {
      pref = ['menacing', 'hungry', 'coward', 'sister'];
      await N(L('You knock the candle over. On purpose. With flair.', 'Cô hất đổ cây nến. Cố ý. Rất điệu nghệ.'));
      await MG().fire();
      await say('loom', L('…Rude.', '…Mất dạy.'), { tail: 960 });
      await N(L('Correct! That is exactly what happens in the text.', 'Chính xác! Sách viết y như vậy.'));
    } else if (c === 'sorry') {
      pref = ['sister', 'hungry', 'coward', 'menacing']; inc('kind'); flag('apologized');
      stopMusic(1.5);
      await say('loom', L('…What?', '…Hả?'), { tail: 960 });
      await swap('loom', 'soft');
      await say('loom', L('You\'ve never said that. Not once. Not in ten thousand tellings.', 'Em chưa bao giờ nói câu đó. Chưa một lần. Mười nghìn lần kể, chưa một lần.'), { tail: 960 });
      await N(L('She\'s a loom. Looms don\'t get apologies. Anyway—', 'Nó là khung cửi. Khung cửi không cần xin lỗi. Thôi thì—'));
      await MG().fire();
      await N(L('Oops. Story.', 'Úi. Cốt truyện ấy mà.'));
    } else if (c === 'bite') {
      pref = ['hungry', 'menacing', 'coward', 'sister'];
      sfx('bite'); fx.sfx('ガリッ', { x: 960, y: 520, style: 'impact', size: 170 }); fx.shake(12, 250);
      await N(L('You bite the loom. It is mostly wood. You regret it immediately.', 'Cô cắn khung cửi. Toàn gỗ là gỗ. Cô hối hận ngay lập tức.'));
      await say('loom', L('Did you just— BITE me?!', 'Em vừa… CẮN chị đấy à?!'), { style: 'shout', tail: 960 });
      await N(L('The loom is so embarrassed it bursts into flames.', 'Khung cửi xấu hổ đến mức tự bốc cháy.'));
      await MG().fire();
    } else {
      pref = ['coward', 'sister', 'hungry', 'menacing'];
      await N(L('You run out of the room. Behind you, the candle tips over. How convenient.', 'Cô chạy khỏi phòng. Sau lưng, cây nến đổ. Tiện ghê.'));
      await MG().fire();
    }
    await N(L('The loom burned. You threw the ashes far away — and from them grew a thị tree, bearing one single, golden fruit.', 'Khung cửi cháy rụi. Cô đổ tro thật xa — và từ đó mọc lên một cây thị, chỉ đậu đúng một quả vàng ươm.'));
    flag('v3', pickVoice(pref));
    await tbc();
    return 'ch4';
  };

  /* ================================================================ CHAPTER IV — THE GOLDEN FRUIT */
  const ch4 = async () => {
    await chapter('ch4', L('CHAPTER IV', 'CHƯƠNG IV'), L('THE GOLDEN FRUIT', 'QUẢ THỊ'), L('Quả Thị', 'The Golden Fruit'));
    await bg('teashop', { tr: 'black' });
    music('teashop');
    await show('fruit', { x: 1266, y: 236, w: 120, anim: 'fade', z: 2, idle: 'sway' });
    await show('oldwoman', { x: 170, y: 250, w: 560, anim: 'left', z: 3 });
    await N(L('A roadside tea stall. A thị tree. One golden fruit, hanging there like it knows something.', 'Một quán nước ven đường. Một cây thị. Một quả thị vàng lủng lẳng, như thể nó biết điều gì đó.'));
    await newVoice(get('v3'));
    await N(L('Whatever you do — do NOT let that fruit fall into the old woman\'s bag. …Wait. No. It\'s SUPPOSED to. Ugh. Let it.', 'Dù thế nào — tuyệt đối KHÔNG để quả thị rơi vào bị bà lão. …Khoan. Sai rồi. Nó PHẢI rơi vào chứ. Hừ. Cứ để nó rơi.'));
    await say('oldwoman', L('Oh thị fruit, oh thị fruit, drop into my bag! I\'ll only sniff you — I promise I won\'t eat you!', 'Thị ơi thị rụng bị bà! Bà để bà ngửi chứ bà không ăn!'), { tail: 520 });
    await chorus({
      hungry: L('She\'s lying. Everyone who says "I won\'t eat you" eats you. Let ME not-eat it.', 'Bà ấy xạo đó. Ai nói "không ăn" là ăn liền. Để tui "không ăn" cho.'),
      menacing: L('A fruit that holds our nemesis. How… delicious. I mean menacing. I mean both.', 'Một quả thị chứa kẻ thù truyền kiếp. Thật là… ngon. À nhầm, đáng sợ. À thôi, cả hai.'),
      sister: L('She lives alone, doesn\'t she. …Tấm would take care of her.', 'Bà ấy sống một mình nhỉ. …Chị Tấm sẽ chăm sóc bà ấy.'),
      coward: L('What if the fruit explodes? Fruit can explode. Probably. I read that somewhere. I didn\'t.', 'Lỡ quả thị nổ thì sao? Trái cây nổ được mà. Chắc vậy. Tui đọc ở đâu đó. Xạo đó.'),
    });
    const tag = (v) => (hasVoice(v) ? v : undefined);
    const c = await choice([
      { id: 'let', text: L('[Let it fall into her bag.]', '[Để nó rơi vào bị bà.]'), tag: tag('sister') },
      { id: 'snatch', text: L('[Snatch it first!]', '[Giật lấy trước!]'), tag: tag('menacing') },
      { id: 'eat', text: L('[Eat it.]', '[Ăn nó.]'), tag: tag('hungry') },
      { id: 'ask', text: L('"…Sis? Are you in there?"', '"…Chị ơi? Chị ở trong đó hả?"') },
    ]);
    if (c === 'let') {
      inc('kind');
      await MG().fruitToBag();
      await say('oldwoman', L('Oh! Such a good fruit! And such a good girl — here, have some tea.', 'Ôi! Quả thị ngoan quá! Cháu cũng ngoan — nào, uống chén nước chè.'), { tail: 520 });
      await N(L('She pats your head. Nobody has patted your head in ten thousand tellings.', 'Bà xoa đầu cô. Mười nghìn lần kể chuyện, chưa ai xoa đầu cô cả.'));
    } else if (c === 'snatch') {
      await N(L('You dive for the fruit. So does she. Time slows down—', 'Cô lao tới chộp quả thị. Bà lão cũng lao tới. Thời gian như chậm lại—'));
      await say('oldwoman', L('ZA WARUDO! Time, stop!', 'THẾ GIỚI! Thời gian, ngừng lại!'), { style: 'shout', tail: 520 });
      await MG().oldWomanTimeStop();
      await say('oldwoman', L('…And time resumes.', '…Và thời gian tiếp tục trôi.'), { tail: 520 });
      await N(L('…The old woman has a Stand?', '…Bà lão có Stand à?'));
      await say('oldwoman', L('I\'ve been catching fruit since before you were named after pig feed, kiddo.', 'Bà hứng thị từ hồi cháu còn chưa được đặt tên theo cám lợn, nhóc ạ.'), { tail: 520 });
    } else if (c === 'eat') {
      flag('ateFruit');
      sfx('bite'); fx.sfx('ガブッ', { x: 1330, y: 300, style: 'impact', size: 150 }); fx.shake(10, 250);
      await say('fruit', L('OW!', 'ÁI!'), { style: 'shout', tail: 1330 });
      await say('fruit', L('Cám, I swear on Dad\'s grave—', 'Cám, chị thề trên mộ cha—'), { tail: 1330 });
      await N(L('You spit it out. It rolls, very deliberately, into the old woman\'s bag.', 'Cô nhổ nó ra. Nó lăn, rất có chủ đích, vào thẳng bị bà lão.'));
      await MG().fruitToBag();
    } else {
      inc('kind');
      await say('fruit', L('…Maybe.', '…Có lẽ.'), { tail: 1330 });
      await say('fruit', L('It\'s cozy in here. Nobody tries to chop you when you\'re a fruit.', 'Trong này ấm lắm. Làm quả thị thì chẳng ai đòi chặt mình.'), { tail: 1330 });
      await MG().fruitToBag();
    }
    await hide('oldwoman', { anim: 'left' });
    await N(L('Every day, while the old woman was out, a tiny girl stepped out of the fruit to sweep, cook, and fold betel leaves into the shape of phoenix wings.', 'Ngày ngày, khi bà lão vắng nhà, một cô gái bé xíu bước ra từ quả thị, quét nhà, thổi cơm, và têm trầu cánh phượng.'));
    fx.panel('p:betel', TC.art.panel.betel, { x: 1120, y: 120, w: 640, h: 440 }, { rot: -2 });
    await N(L('One day the King stopped by for tea, saw the betel, and recognized it instantly. As one does.', 'Một hôm nhà vua ghé quán uống nước, thấy miếng trầu, nhận ra ngay. Chuyện thường tình.'));
    await say('king', L('These betel leaves… folded like a phoenix… only ONE woman folds them like this!', 'Miếng trầu này… têm hình cánh phượng… chỉ có MỘT người têm được thế này!'), { style: 'shout', tail: 1500 });
    fx.closePanels();
    await MG().tamReveal();
    await say('tam', L('You thought it was just a fruit? But it was me — TẤM!', 'Tưởng chỉ là quả thị thôi sao? Nhầm to rồi — là ta đây, TẤM!'), { style: 'shout', tail: 960 });
    fx.menace(false);
    await N(L('And so Tấm returned to the palace. Tomorrow you\'ll go to meet her, and the story will end the way it always ends.', 'Và thế là Tấm trở về cung. Ngày mai cô sẽ đi gặp cô ta, và câu chuyện sẽ kết thúc như nó vẫn luôn kết thúc.'));
    await tbc();
    return 'ch5';
  };

  /* ================================================================ CHAPTER V — RICEDUST CRUSADERS */
  const ch5 = async () => {
    await chapter('ch5', L('FINAL CHAPTER', 'CHƯƠNG CUỐI'), L('RICEDUST CRUSADERS', 'RICEDUST CRUSADERS'), L('The Approach', 'Tiến Lại Gần'));
    await bg('steps', { tr: 'black' });
    TC.music.param('intensity', 0);
    music('menace');
    await N(L('Noon at the palace. The cicadas have gone quiet. Between you and Tấm: forty steps and ten thousand retellings.', 'Hoàng cung, giữa trưa. Ve sầu đã thôi kêu. Giữa cô và Tấm: bốn mươi bậc đá và mười nghìn lần kể lại.'));
    await N(L('Walk to her. It\'s the last scene.', 'Bước tới đi. Đây là cảnh cuối.'));
    await MG().approach();
    const h = await choice([
      { id: 'fight', text: L('[Fight.]', '[Chiến.]') },
      { id: 'run', text: L('[NIGERUNDAYO! Run away!]', '[CHUỒN THÔI!]'), voice: 'coward' },
    ]);
    if (h === 'run') return endRun();

    await say('tam', L('Then witness my Stand!', 'Vậy thì chiêm ngưỡng Stand của chị đi!'), { style: 'shout', tail: 700 });
    await MG().standReveal('tam');
    await N(L('…She has a Stand. Of course she has a Stand. Why does she have a Stand?', '…Cô ta có Stand. Tất nhiên rồi. Mà sao cô ta lại có Stand?'));
    await me(L('Fine. MOM!', 'Được thôi. MẸ ƠI!'), { style: 'shout' });
    await MG().standReveal('cam');
    await say('mom', L('Mommy\'s here, sweetie.', 'Mẹ đây, con yêu.'), { tail: 1300 });
    const won = await MG().rush();
    flag('rushWon', won);
    await N(L('And both of them went flying, the way rice does when you thresh it.', 'Và cả hai văng ra xa, như hạt lúa lúc đập lúa.'));
    await MG().aftermath();
    if (won) {
      await say('tam', L('…You\'ve gotten stronger.', '…Em mạnh lên rồi đấy.'), { tail: 700 });
      await me(L('…You\'ve gotten more birds.', '…Chị thì nhiều chim hơn.'));
    } else {
      await me(L('…Ow.', '…Đau.'));
      await say('tam', L('…Your mom punches like a rice pestle.', '…Mẹ em đấm như chày giã gạo.'), { tail: 700 });
    }
    music('menace'); TC.music.param('intensity', 0.2);
    await N(L('WONDERFUL. Now, Tấm, darling — the bath. Offer her the bath. Page forty-seven.', 'TUYỆT VỜI. Nào, Tấm yêu quý — bồn tắm. Mời cô ta tắm đi. Trang bốn mươi bảy.'));
    await say('tam', L('……', '……'), { tail: 700 });
    await say('tam', L('Cám. Would you like… a bath.', 'Cám. Em có muốn… đi tắm không.'), { tail: 700 });
    await me(L('…Is it boiling?', '…Nước sôi hả chị?'));
    await say('tam', L('It\'s always boiling.', 'Lúc nào mà chẳng sôi.'), { tail: 700 });
    music('truth');
    await say('tam', L('Do you know how many times I\'ve done this? Ten thousand. Every grandmother. Every classroom. Every bedtime.', 'Em biết chị làm chuyện này bao nhiêu lần rồi không? Mười nghìn lần. Mỗi người bà. Mỗi lớp học. Mỗi giờ đi ngủ.'), { tail: 700 });
    await say('tam', L('Every time, I boil you. And every time, they call me the good one.', 'Lần nào chị cũng dội nước sôi vào em. Và lần nào người ta cũng gọi chị là người hiền.'), { tail: 700 });
    if (plays() > 0) await say('tam', L('…Ten thousand and one, actually. You keep coming back too, don\'t you?', '…Mười nghìn lẻ một, nói đúng ra. Em cũng cứ quay lại mãi, phải không?'), { tail: 700 });
    await chorus({
      menacing: L('…Huh. So she\'s ALSO a villain. Respect.', '…Hừm. Vậy ra ả CŨNG là phản diện. Nể.'),
      hungry: L('I\'m not hungry anymore. That\'s how you know it\'s serious.', 'Tui hết đói rồi. Vậy là biết chuyện nghiêm trọng cỡ nào.'),
      sister: L('She\'s tired. She\'s just as tired as we are.', 'Chị ấy mệt rồi. Mệt y như tụi mình.'),
      coward: L('Wait — the MAIN CHARACTER is scared too?!', 'Khoan — NHÂN VẬT CHÍNH cũng sợ hả?!'),
    });
    await N(L('Stop. Stop talking. You\'re the heroine. Heroines don\'t have feelings about page forty-seven.', 'Dừng. Thôi ngay. Cô là nữ chính. Nữ chính không được có cảm xúc về trang bốn mươi bảy.'));
    await say('tam', L('They changed it once, you know. The ending. A school textbook, 2011. They cut the fish sauce.', 'Họ từng sửa nó đấy, em biết không. Cái kết ấy. Sách giáo khoa năm 2011. Họ bỏ đoạn làm mắm.'), { tail: 700 });
    await N(L('A dark day for fish sauce.', 'Một ngày đen tối của ngành mắm.'));
    await say('tam', L('If they could change it… couldn\'t we?', 'Nếu họ sửa được… thì sao chúng ta lại không?'), { tail: 700 });
    await N(L('Absolutely not. Cám, you know what to do. Get in the bath.', 'Tuyệt đối không. Cám, cô biết phải làm gì rồi đấy. Vào bồn tắm đi.'));
    const f = await choice([
      { id: 'bath', text: L('[Get in the bath.]', '[Bước vào bồn tắm.]') },
      { id: 'wry', text: L('"No. YOU get in the bath."', '"Không. CHỊ vào bồn tắm đi."'), voice: 'menacing' },
      { id: 'eat', text: L('[Eat the story.]', '[Ăn luôn câu chuyện.]'), voice: 'hungry' },
      { id: 'change', text: L('"Chị Tấm… let\'s change it."', '"Chị Tấm… mình sửa nó đi."'), voice: 'sister' },
    ]);
    if (f === 'wry') return endWry();
    if (f === 'eat') return endEat();
    if (f === 'change') return endTrue();
    return endCanon();
  };

  /* ================================================================ ENDINGS */
  const endCanon = async () => {
    await N(L('Good girl. Right this way.', 'Ngoan lắm. Mời vào.'));
    await MG().bathTime();
    await me(L('…See you next time, sis.', '…Hẹn gặp lại lần sau nhé, chị.'));
    await say('tam', L('…See you next time.', '…Hẹn gặp lại.'), { tail: 700 });
    await MG().crowScene();
    await say('crow', L('Yum yum yummy! Mom\'s eating her daughter — any left for me?', 'Ngon ngỏn ngòn ngon! Mẹ ăn thịt con, có còn xin miếng!'), { tail: 1350 });
    await N(L('And they all lived happily ever after. Well. Some of them. Mostly Tấm.', 'Và họ sống hạnh phúc mãi mãi về sau. À. Một vài người thôi. Chủ yếu là Tấm.'));
    await N(L('The End.', 'Hết.'));
    await N(L('…Once upon a time…', '…Ngày xửa ngày xưa…'), { auto: 1400 });
    return TC.main.ending('canon');
  };

  const endWry = async () => {
    await me(L('No. YOU get in the bath.', 'Không. CHỊ vào bồn tắm đi.'), { style: 'shout' });
    await MG().wryPose();
    await V('menacing', L('YES! YES! WRYYYYYYYYY!', 'ĐÚNG RỒI! WRYYYYYYYYY!'), { style: 'shout' });
    await N(L('Wait. Wait, no. That\'s not— she\'s the HEROINE. Without her there\'s no—', 'Khoan. Khoan đã. Không phải thế— cô ta là NỮ CHÍNH. Không có cô ta thì—'));
    await MG().erase();
    await N(L('No heroine, no story. No story, no… anything.', 'Không nữ chính, không câu chuyện. Không câu chuyện thì… chẳng còn gì.'));
    await me(L('…I won.', '…Em thắng rồi.'));
    await me(L('…Hello?', '…Có ai không?'));
    await V('menacing', L('…Is it still menacing if there\'s nobody left to menace?', '…Còn ai đâu mà dọa nữa nhỉ?'));
    return TC.main.ending('wry');
  };

  const endRun = async () => {
    await V('coward', L('Of the thirty-six stratagems, the best one is RUNNING AWAY!', 'Ba mươi sáu kế, chuồn là thượng sách!'), { style: 'shout' });
    await MG().runAway('cam');
    await say('tam', L('…Did she just—', '…Nó vừa—'), { tail: 700 });
    await N(L('She\'s RUNNING? At the CLIMAX? You can\'t run from the—', 'Nó CHẠY? Ngay ĐOẠN CAO TRÀO? Không được chạy khỏi—'));
    await say('tam', L('…Wait. That\'s allowed?', '…Khoan. Được phép vậy hả?'), { tail: 700 });
    await MG().runAway('tam');
    await N(L('Come back! Both of you! There\'s a WEDDING scene! There\'s FISH SAUCE!', 'Quay lại! Cả hai! Còn cảnh ĐÁM CƯỚI! Còn vụ LÀM MẮM nữa!'));
    await N(L('…And they ran, and ran. And the story, having no one left to tell, sat down on the palace steps and had a little cry.', '…Và họ chạy mãi, chạy mãi. Còn câu chuyện, chẳng còn ai để kể, ngồi bệt xuống bậc thềm và khóc thút thít.'));
    await MG().butAppear(1180, 200);
    await say('but', L('Why are you crying, my child?', 'Làm sao con khóc?'), { tail: 1420 });
    await N(L('…Oh, NOW you show up.', '…Ồ, GIỜ ông mới chịu hiện ra.'));
    return TC.main.ending('run');
  };

  const endEat = async () => {
    await V('hungry', L('FINALLY. SOMEONE LISTENS TO ME.', 'CUỐI CÙNG. CŨNG CÓ NGƯỜI NGHE TUI.'), { style: 'shout' });
    await MG().bookAppear();
    await N(L('What are you— put that down, that\'s the BOOK, that\'s the—', 'Cô làm gì— bỏ xuống, đó là QUYỂN SÁCH, đó là—'));
    await MG().eatBook(1);
    await N(L('That\'s chapter one! You\'re eating the FISH chapter!', 'Đó là chương một! Cô đang ăn chương CÁ BỐNG!'));
    await MG().eatBook(2);
    await N(L('Not page forty-seven! Not— …oh. You ate page forty-seven.', 'Đừng trang bốn mươi bảy! Đừng— …ôi. Cô ăn mất trang bốn mươi bảy rồi.'));
    await say('tam', L('…Did you just eat the ending?', '…Em vừa ăn mất cái kết đấy à?'), { tail: 700 });
    await me(L('It tasted like fish sauce.', 'Vị như mắm ấy.'));
    await say('tam', L('…Is there any left?', '…Còn miếng nào không?'), { tail: 700 });
    await MG().eatBook(3);
    await N(L('…That\'s it. There is no more story. You ate it.', '…Hết rồi. Chẳng còn chuyện gì nữa. Cô ăn hết rồi.'));
    return TC.main.ending('eat');
  };

  const endTrue = async () => {
    await me(L('Chị Tấm… let\'s change it.', 'Chị Tấm… mình sửa nó đi.'));
    await V('sister', L('…There you are.', '…Cậu đây rồi.'));
    await N(L('No. No, no, no. You don\'t get to change it. It\'s been told ten thousand times. It\'s written in stone. It\'s in the TEXTBOOK—', 'Không. Không không không. Các người không được sửa. Nó được kể mười nghìn lần rồi. Khắc vào đá rồi. Có trong SÁCH GIÁO KHOA—'));
    await say('tam', L('The textbook changed.', 'Sách giáo khoa cũng sửa rồi mà.'), { tail: 700 });
    await N(L('That was ONE TIME!', 'Có MỘT LẦN thôi!'));
    await MG().tears();
    await N(L('Cám. You\'re the villain. Villains don\'t— …why are you crying?', 'Cám. Cô là phản diện. Phản diện không được— …sao cô lại khóc?'));
    await MG().butAppear(560, 170, true);
    await say('but', L('…Why are you crying, my child?', '…Làm sao con khóc?'), { tail: 800 });
    await me(L('…Me? You\'re asking… me?', '…Con á? Ông hỏi… con á?'));
    await say('but', L('Ten thousand tellings, and you never cried for real. Not once.', 'Mười nghìn lần kể, con chưa từng khóc thật. Chưa một lần.'), { tail: 800 });
    await say('but', L('So. What do you need?', 'Nào. Con cần gì?'), { tail: 800 });
    await me(L('…A new ending.', '…Một cái kết mới.'));
    await say('but', L('That, I can\'t give you. But the two of you can write one.', 'Cái đó ta không cho được. Nhưng hai chị em con có thể tự viết.'), { tail: 800 });
    await MG().butVanish();
    await MG().page47();
    await say('tam', L('Ready, em?', 'Sẵn sàng chưa, em?'), { tail: 700 });
    await me(L('Ready, chị.', 'Sẵn sàng rồi, chị.'));
    await say('both', L('BỐNG BỐNG BANG BANG!!', 'BỐNG BỐNG BANG BANG!!'), { style: 'shout', tail: 960 });
    await MG().doubleRush();
    await N(L('Wait— what do I— what do I say now?', 'Khoan— ta phải— giờ ta nói gì đây?'));
    await say('tam', L('Whatever you want.', 'Gì cũng được.'), { tail: 700 });
    await me(L('Something short.', 'Ngắn thôi nha.'));
    await MG().epilogue();
    await N(L('Once upon a now, there were two sisters.', 'Ngày xửa ngày nay, có hai chị em.'));
    await N(L('They were named after pig feed. They argued about everything. Nobody boiled anybody.', 'Tên hai đứa đặt theo thức ăn cho lợn. Chuyện gì cũng cãi nhau. Không ai dội nước sôi vào ai.'));
    await N(L('And they lived. That\'s it. That\'s the ending.', 'Và họ sống. Vậy thôi. Đó là cái kết.'));
    await N(L('…I think I like it.', '…Ta nghĩ… ta thích nó.'));
    return TC.main.ending('true');
  };

  /* ================================================================ ENDING TABLE */
  TC.endings = {
    canon: { n: 1, title: L('AS IT IS WRITTEN', 'ĐÚNG NHƯ SÁCH VIẾT'), sub: L('The story was told correctly. Again.', 'Câu chuyện được kể đúng. Một lần nữa.'), hint: L('Do what the Narrator says.', 'Nghe lời Người Kể Chuyện.') },
    wry: { n: 2, title: L('WRYYYYYYY', 'WRYYYYYYY'), sub: L('You won. There is nothing left to win.', 'Cô thắng rồi. Chẳng còn gì để thắng.'), hint: L('Let the Menacing speak at the very end.', 'Để Kẻ Hăm Dọa lên tiếng ở phút cuối.') },
    run: { n: 3, title: L('NIGERUNDAYO!', 'CHUỒN LÀ THƯỢNG SÁCH'), sub: L('The oldest trick in the book is leaving it.', 'Mánh cũ nhất trong sách là… bỏ sách mà đi.'), hint: L('A coward\'s voice knows when to leave.', 'Tiếng lòng nhát gan biết lúc nào nên chuồn.') },
    eat: { n: 4, title: L('THE END (EATEN)', 'HẾT CHUYỆN'), sub: L('No more story. Burp.', 'Hết sạch chuyện. Ợ.'), hint: L('Some voices are always hungry.', 'Có những tiếng lòng lúc nào cũng đói.') },
    true: { n: 5, title: L('ONCE UPON A NOW', 'NGÀY XỬA NGÀY NAY'), sub: L('They lived. That\'s the ending.', 'Họ sống. Đó là cái kết.'), hint: L('Remember your sister.', 'Hãy nhớ về chị mình.') },
  };

  // dev-only shortcuts straight into each ending (used by tools/node/play.mjs --start test_*)
  const lyingPrelude = async () => { await bg('lying', { tr: 'cut' }); music('truth'); };
  const approachPrelude = async () => {
    await bg('steps', { tr: 'cut' }); music('menace');
    await show('tam_back', { x: 40, y: 20, w: 1000, anim: 'none', z: 4 });
    await show('cam_walk', { x: 1246, y: 328, w: 336, anim: 'none', z: 3 });
  };
  const tests = {
    test_canon: async () => { await lyingPrelude(); return endCanon(); },
    test_wry: async () => { await lyingPrelude(); return endWry(); },
    test_eat: async () => { await lyingPrelude(); return endEat(); },
    test_true: async () => { await lyingPrelude(); return endTrue(); },
    test_run: async () => { await approachPrelude(); return endRun(); },
  };
  TC.story = { chapters: Object.assign({ ch1, ch2, ch3, ch4, ch5 }, /[?&]dev/.test(location.search) ? tests : {}) };
})();
