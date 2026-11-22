/* 3D кітаптардың беттері: құндылық кітаптары мен мереке кітаптары */
window.Books = (function () {
  const POPS = { w1: ['goldman', 'flag', 'scroll'], w2: ['people', 'yurt', 'dombra'], w3: ['pine', 'river', 'sprout'], w4: ['robot', 'telescope', 'rocket'], w5: ['scales', 'flask', 'tap'], w6: ['scroll', 'bluebook', 'tower'] };
  const cache = {};
  const ph = (k, h) => (window.photo(k) ? [{ k: 'photo', key: k, h: h || 330 }] : []);
  function world(w) {
    if (cache[w.id]) return cache[w.id];
    const v = TEXT.values.find(x => x.id === w.id).text, z = KZ.ZONES.find(q => q.w === w.id), P = [], keys = {};
    const pop = POPS[w.id];
    // 0–1: мұқаба және мазмұны
    P.push({ blocks: [{ k: 'chip', text: 'SMART GUIDE · АДАЛ АЗАМАТ' }, { k: 'big', h: 330 }, { k: 'h', text: w.name, size: 64 }, { k: 'quote', text: w.motto }, { k: 'p', text: v }, { k: 'tags', items: w.subjects }], pop: [pop[0]], say: [w.name, v], cover: true });
    P.push({ toc: true, blocks: [{ k: 'banner', text: 'МАЗМҰНЫ' }, { k: 'toc' }], say: ['Мазмұны. Тақырыпты бас, кітап өзі парақталады.'] });
    // 2–3: құндылық пен пәндер
    keys.value = P.length;
    P.push({ blocks: [{ k: 'chip', text: '1-тарау · ҚҰНДЫЛЫҚ' }, { k: 'h', text: 'Біз нені үйренеміз?' }, { k: 'p', text: w.intro }, { k: 'box', title: '📍 Картадағы өңірі: ' + z.region, text: 'Қалалары: ' + z.cities + '.' }, ...(window.photo(EXTRA.region[w.id]) ? ph(EXTRA.region[w.id], 300) : [{ k: 'big', h: 260 }]), { k: 'btns', items: [{ label: '🔊 Тыңдау', color: '#2fa866', act: 'say' }] }], pop: [pop[1]], say: [w.intro], toc: 'Құндылық туралы' });
    P.push({ blocks: [{ k: 'chip', text: 'ПӘНАРАЛЫҚ БАЙЛАНЫС' }, { k: 'h', text: 'Пәндер мен киіз үй-зертханалар' }, ...w.labs.map((l, i) => ({ k: 'box', title: l.icon + ' ' + l.subject + ': ' + l.title, text: l.intro, color: i ? '#e7efff' : '#fff1e3' })), { k: 'big', h: 160 }, { k: 'btns', items: w.labs.map((l, i) => ({ label: '⭕ ' + l.subject, color: i ? '#3f7fd9' : '#d8473f', act: 'lab:' + i })) }], pop: ['yurt'], say: w.labs.map(l => l.intro), toc: 'Пәндер мен зертханалар' });
    // әдеби шығармалар: әрқайсысы 2 жайма
    w.books.forEach((b, n) => {
      keys['lit:' + b.id] = P.length;
      P.push({ blocks: [{ k: 'chip', text: (n + 2) + '-тарау · ОҚЫЛЫМ' }, { k: 'h', text: b.title }, { k: 'sub', text: b.author + ' · ' + b.genre }, { k: 'box', title: '📌 Қысқаша мазмұны', text: b.summary, color: '#fff6d8' }, { k: 'p', text: b.paras[0] }, { k: 'p', text: b.paras[1] }], say: [b.title + '. ' + b.author + '.', b.summary, b.paras[0], b.paras[1]], toc: '📖 ' + b.title });
      P.push({ blocks: [{ k: 'p', text: b.paras[2] }, { k: 'p', text: b.paras[3] }, ...(window.photo(EXTRA.lit[b.id]) ? ph(EXTRA.lit[b.id], 300) : [{ k: 'big', h: 240 }]), { k: 'quote', text: b.quote }, { k: 'btns', items: [{ label: '🔊 Тыңдау', color: '#2fa866', act: 'say' }] }], pop: ['book'], say: [b.paras[2], b.paras[3], b.quote] });
      P.push({ blocks: [{ k: 'chip', text: 'ОҚЫЛЫМ САУАТТЫЛЫҒЫ' }, { k: 'h', text: 'Мәтінді түсіндің бе?' }, { k: 'q', q: b.quiz[0], id: b.id + ':0', group: w.id + ':book:' + b.id, n: 2 }, { k: 'big', h: 170 }], pop: ['bala'], say: [b.quiz[0].q] });
      P.push({ blocks: [{ k: 'q', q: b.quiz[1], id: b.id + ':1', group: w.id + ':book:' + b.id, n: 2 }, { k: 'box', title: '💭 Ойлан', text: 'Бұл шығарма «' + w.name + '» құндылығына қалай байланысты? Микрофонды басып, өз ойыңды айт.', color: '#eef6ff' }, { k: 'btns', items: [{ label: '🎙 Ойымды айтамын', color: '#8a5cf0', act: 'think:' + b.id }] }], say: [b.quiz[1].q] });
    });
    // мұражай
    keys.museum = P.length;
    w.museum.forEach((m, i) => P.push({ blocks: [{ k: 'chip', text: 'МҰРАЖАЙ · ' + (i + 1) + '/4' }, { k: 'big', h: 330 }, { k: 'h', text: m.title }, { k: 'p', text: m.text }, ...ph(m.photo, 260), { k: 'btns', items: [{ label: '🔊 Тыңдау', color: '#2fa866', act: 'say' }] }], pop: [m.model || 'star'], say: [m.title + '. ' + m.text], toc: i === 0 ? '🏛️ Мұражай' : null, museum: i }));
    // өмірлік жағдаят
    keys.case = P.length;
    P.push({ blocks: [{ k: 'chip', text: 'ӨМІРЛІК ЖАҒДАЯТ' }, { k: 'h', text: w.case.title }, { k: 'big', h: 230 }, { k: 'p', text: w.case.text }], pop: [w.case.npc === 'Әже' ? 'aje' : 'ata'], say: [w.case.text], toc: '💬 Өмірлік жағдаят' });
    P.push({ blocks: [{ k: 'h', text: 'Сен не істер едің?' }, { k: 'opts', options: w.case.options, id: w.id + ':case', title: w.case.title }], say: ['Сен не істер едің? Дұрыс шешімді таңда.'] });
    // жазылым мен айтылым
    keys.tasks = P.length;
    P.push({ blocks: [{ k: 'chip', text: 'ЖАЗЫЛЫМ' }, { k: 'h', text: '✍️ ' + w.tasks.write.title }, { k: 'p', text: w.tasks.write.prompt }, { k: 'big', h: 200 }, { k: 'saved', key: w.id + ':write' }, { k: 'btns', items: [{ label: '✍️ Жауап жазу', color: '#e0a92b', act: 'write' }] }], pop: ['pen'], say: [w.tasks.write.prompt], toc: '✍️ Жазылым және айтылым' });
    P.push({ blocks: [{ k: 'chip', text: 'АЙТЫЛЫМ' }, { k: 'h', text: '🎙️ ' + w.tasks.speak.title }, { k: 'p', text: w.tasks.speak.prompt }, { k: 'big', h: 200 }, { k: 'saved', key: w.id + ':speak' }, { k: 'btns', items: [{ label: '🎙 Сөйлеп жауап беру', color: '#8a5cf0', act: 'speak' }] }], pop: ['mic'], say: [w.tasks.speak.prompt] });
    // саяхат және нәтиже
    keys.journey = P.length;
    P.push({ blocks: [{ k: 'chip', text: 'ВИРТУАЛДЫ САЯХАТ' }, { k: 'h', text: 'Пәндік әлемге саяхат' }, ...w.quests.map(q => ({ k: 'box', title: '🎯 ' + q.title, text: q.intro, color: '#eafbef' })), { k: 'big', h: 190 }, { k: 'btns', items: [{ label: '🌀 Саяхатқа шығу', color: '#8a5cf0', act: 'journey' }, { label: '🎬 Буктрейлер', color: '#c1462f', act: 'trailer' }] }], pop: ['portal'], say: w.quests.map(q => q.intro), toc: '🌀 Саяхат және нәтиже' });
    P.push({ blocks: [{ k: 'chip', text: 'МЕНІҢ ЖЕТІСТІГІМ' }, { k: 'h', text: 'Нәтижем' }, { k: 'result', wid: w.id }, { k: 'big', h: 230 }], pop: ['trophy'], say: ['Жарайсың! Нәтижеңді қара.'] });
    const def = { id: w.id, kind: 'world', world: w, title: w.name, color: w.color, icon: w.icon, pages: P, keys }; cache[w.id] = def; return def;
  }
  function holiday(h) {
    if (cache[h.id]) return cache[h.id];
    const vals = h.values.map(id => WORLDS.find(w => w.id === id)), P = [], keys = {};
    P.push({ blocks: [{ k: 'chip', text: 'ҰЛТТЫҚ МЕРЕКЕ · ' + h.date }, { k: 'big', h: 360 }, { k: 'h', text: h.name, size: 64 }, { k: 'p', text: h.intro }, { k: 'tags', items: vals.map(w => w.icon + ' ' + w.short) }], pop: [h.popups[0] === 'flower' ? 'tulip' : h.popups[0]], say: [h.name, h.intro], cover: true });
    P.push({ toc: true, blocks: [{ k: 'banner', text: 'МАЗМҰНЫ' }, { k: 'toc' }], say: ['Мазмұны.'] });
    P.push({ blocks: [{ k: 'chip', text: '1-тарау · ТАРИХЫ' }, { k: 'h', text: h.name + ' туралы' }, { k: 'p', text: h.paras[0] }, { k: 'big', h: 260 }, { k: 'p', text: h.paras[1] }], pop: [h.popups[1]], say: [h.paras[0], h.paras[1]], toc: '📜 Мереке туралы' });
    P.push({ blocks: [{ k: 'p', text: h.paras[2] }, ...(window.photo(EXTRA.holiday[h.id]) ? ph(EXTRA.holiday[h.id], 300) : [{ k: 'big', h: 240 }]), { k: 'p', text: h.paras[3] }, { k: 'btns', items: [{ label: '🔊 Тыңдау', color: '#2fa866', act: 'say' }] }], pop: [h.popups[2]], say: [h.paras[2], h.paras[3]] });
    P.push({ blocks: [{ k: 'chip', text: 'ҚЫЗЫҚ ДЕРЕКТЕР' }, { k: 'h', text: 'Білесің бе?' }, ...h.facts.map(f => ({ k: 'box', title: '💡', text: f, color: '#fff6d8' })), { k: 'big', h: 160 }], pop: ['bulb'], say: h.facts, toc: '💡 Қызық деректер' });
    P.push({ blocks: [{ k: 'chip', text: 'ҚҰНДЫЛЫҚТАР' }, { k: 'h', text: 'Мереке қандай құндылыққа үйретеді?' }, ...vals.map(w => ({ k: 'box', title: w.icon + ' ' + w.name, text: TEXT.values.find(x => x.id === w.id).text, color: '#eef6ff' })), { k: 'btns', items: vals.map(w => ({ label: w.icon + ' ' + w.short + ' кітабы', color: w.color, act: 'book:' + w.id })) }], say: vals.flatMap(w => [w.name, TEXT.values.find(x => x.id === w.id).text]) });
    keys.quiz = P.length;
    P.push({ blocks: [{ k: 'chip', text: 'ОҚЫЛЫМ САУАТТЫЛЫҒЫ' }, { k: 'h', text: 'Сұрақтарға жауап бер' }, { k: 'q', q: h.quiz[0], id: h.id + ':0', group: h.id + ':quiz', n: 3 }, { k: 'big', h: 150 }], pop: ['bala'], say: [h.quiz[0].q], toc: '❓ Сұрақтар' });
    P.push({ blocks: [{ k: 'q', q: h.quiz[1], id: h.id + ':1', group: h.id + ':quiz', n: 3 }, { k: 'q', q: h.quiz[2], id: h.id + ':2', group: h.id + ':quiz', n: 3 }], say: [h.quiz[1].q, h.quiz[2].q] });
    keys.case = P.length;
    P.push({ blocks: [{ k: 'chip', text: 'ӨМІРЛІК ЖАҒДАЯТ' }, { k: 'h', text: 'Сен қалай шешесің?' }, { k: 'big', h: 230 }, { k: 'p', text: h.case.text }], pop: [h.case.npc === 'Әже' ? 'aje' : 'ata'], say: [h.case.text], toc: '💬 Өмірлік жағдаят' });
    P.push({ blocks: [{ k: 'h', text: 'Дұрыс шешімді таңда' }, { k: 'opts', options: h.case.options, id: h.id + ':case', title: h.name }], say: ['Дұрыс шешімді таңда.'] });
    keys.tasks = P.length;
    P.push({ blocks: [{ k: 'chip', text: 'ЖАЗЫЛЫМ' }, { k: 'h', text: '✍️ Жазып көр' }, { k: 'p', text: h.write }, { k: 'big', h: 200 }, { k: 'saved', key: h.id + ':write' }, { k: 'btns', items: [{ label: '✍️ Жауап жазу', color: '#e0a92b', act: 'write' }] }], pop: ['pen'], say: [h.write], toc: '✍️ Жазылым және айтылым' });
    P.push({ blocks: [{ k: 'chip', text: 'АЙТЫЛЫМ' }, { k: 'h', text: '🎙️ Айтып бер' }, { k: 'p', text: h.speak }, { k: 'big', h: 200 }, { k: 'saved', key: h.id + ':speak' }, { k: 'btns', items: [{ label: '🎙 Сөйлеп жауап беру', color: '#8a5cf0', act: 'speak' }] }], pop: ['mic'], say: [h.speak] });
    P.push({ blocks: [{ k: 'chip', text: 'МЕНІҢ ЖЕТІСТІГІМ' }, { k: 'h', text: 'Құттықтаймын!' }, { k: 'result', hid: h.id }, { k: 'big', h: 260 }], pop: ['trophy'], say: ['Құттықтаймын! Сен мереке кітабын оқып шықтың.'], toc: '🏆 Нәтиже', finish: h.id + ':read' });
    P.push({ blocks: [{ k: 'big', h: 420 }, { k: 'h', text: h.icon + ' ' + h.name, size: 56 }, { k: 'p', text: 'Картаға оралып, басқа порталдар мен кітаптарды тап!' }, { k: 'btns', items: [{ label: '🗺️ Картаға оралу', color: '#0b1a3a', act: 'close' }] }], pop: [h.popups[0] === 'flower' ? 'tulip' : h.popups[0]], say: ['Картаға оралып, басқа порталдарды тап!'] });
    const def = { id: h.id, kind: 'holiday', holiday: h, title: h.name, color: h.color, icon: h.icon, pages: P, keys }; cache[h.id] = def; return def;
  }
  return { world, holiday };
})();
