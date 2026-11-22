/* Әрекеттер: кітап, мұражай, киіз үй-зертханалар, тапсырмалар, кейс, буктрейлер */
window.Modal = (function () {
  let el, onClose = null;
  function open(o) {
    el = el || document.getElementById('modal'); Voice.stop(); if (onClose) { const f = onClose; onClose = null; f(); }
    el.className = 'modal open ' + (o.cls || '');
    el.innerHTML = `<div class="modal-card"><header class="mh"><div><p class="eyebrow">${o.eyebrow || ''}</p><h2>${o.title}</h2></div><button class="x" aria-label="Жабу">✕</button></header><div class="mb"></div></div>`;
    el.querySelector('.x').onclick = close; el.onclick = e => { if (e.target === el) close(); };
    onClose = o.onClose || null; const body = el.querySelector('.mb'); o.body(body); return body;
  }
  function close() { if (!el) return; el.className = 'modal'; el.innerHTML = ''; Voice.stop(); Voice.stopListen(); if (onClose) { const f = onClose; onClose = null; f(); } }
  addEventListener('keydown', e => { if (e.key === 'Escape' && el && el.classList.contains('open')) close(); });
  return { open, close };
})();

window.Acts = (function () {
  const h = (s) => { const d = document.createElement('div'); d.innerHTML = s.trim(); return d.firstElementChild; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sayBtn = (texts) => { const b = h(`<button class="say" title="Тыңдау">🔊 Тыңдау</button>`); b.onclick = () => Voice.say(texts, { btn: b, force: true }); return b; };
  const doneTag = k => Progress.isDone(k) ? '<span class="tag ok">✅ Орындалды</span>' : '';

  /* ---- тест (жалпы) ---- */
  function quiz(box, qs, onEnd) {
    let i = 0, score = 0;
    function show() {
      if (i >= qs.length) { box.innerHTML = `<div class="result"><div class="big">${score}/${qs.length}</div><p>${score === qs.length ? 'Керемет! Барлығы дұрыс!' : 'Жақсы! Қателерден үйрен.'}</p></div>`; onEnd && onEnd(score); return; }
      const q = qs[i], order = shuffle(q.a.map((t, k) => ({ t, k })));
      box.innerHTML = `<div class="quiz"><p class="qn">Сұрақ ${i + 1} / ${qs.length}</p><h3>${esc(q.q)}</h3><div class="opts"></div><p class="fb"></p></div>`;
      if (Voice.has(q.q)) Voice.say(q.q);
      const opts = box.querySelector('.opts'); let locked = false;
      order.forEach(o => { const b = h(`<button class="opt">${esc(o.t)}</button>`); b.onclick = () => {
        if (locked) return; locked = true; const ok = o.k === q.c; b.classList.add(ok ? 'right' : 'wrong'); if (ok) score++;
        if (!ok) opts.children[order.findIndex(x => x.k === q.c)].classList.add('right');
        box.querySelector('.fb').textContent = ok ? '✅ Дұрыс!' : '❌ Қате. Дұрыс жауап белгіленді.'; ok ? Sfx.ok() : Sfx.bad();
        setTimeout(() => { i++; show(); }, 1300); }; opts.appendChild(b); });
    }
    show();
  }

  /* ---- кітаптар ---- */
  function books(world, only) {
    Modal.open({ eyebrow: world.icon + ' ' + world.name, title: 'Кітап сөресі', cls: 'wide', body: b => {
      b.appendChild(h(`<p class="lead">Кітапты таңда: оқы, тыңда, сұрақтарға жауап бер.</p>`));
      const grid = h('<div class="book-grid"></div>');
      world.books.forEach(bk => { const c = h(`<button class="book-card" style="--c:${world.color}"><div class="cover"><span>📖</span><b>${esc(bk.title)}</b><i>${esc(bk.author)}</i></div><p>${esc(bk.genre)}</p>${doneTag(world.id + ':book:' + bk.id)}</button>`); c.onclick = () => reader(world, bk); grid.appendChild(c); });
      b.appendChild(grid);
    } });
    if (only) reader(world, world.books.find(x => x.id === only));
  }
  function reader(world, bk) {
    const pages = [{ h: 'Қысқаша мазмұны', p: bk.summary }, ...bk.paras.map((p, i) => ({ h: (i + 1) + '-бет', p })), { h: 'Нақыл сөз', p: '«' + bk.quote + '»', quote: true }];
    let i = 0;
    Modal.open({ eyebrow: '📖 ' + bk.author + ' · ' + bk.genre, title: bk.title, cls: 'reader', onClose: () => Progress.setReading(null), body: b => {
      Progress.setReading(bk.id);
      const page = h('<div class="page"></div>'), nav = h('<div class="pnav"><button class="btn ghost prev">← Артқа</button><span class="pc"></span><button class="btn gold next">Келесі →</button></div>');
      b.append(page, nav);
      function show() {
        const pg = pages[i]; page.innerHTML = `<p class="ph">${pg.h}</p><p class="${pg.quote ? 'pq' : 'pt'}">${esc(pg.p)}</p>`; page.prepend(sayBtn(pg.p));
        nav.querySelector('.pc').textContent = (i + 1) + ' / ' + (pages.length + 1); nav.querySelector('.prev').disabled = i === 0;
        Voice.say(pg.p);
      }
      nav.querySelector('.prev').onclick = () => { if (i > 0) { i--; show(); } };
      nav.querySelector('.next').onclick = () => {
        if (i < pages.length - 1) { i++; show(); return; }
        Voice.stop(); nav.remove(); page.innerHTML = '<p class="ph">Оқылым сұрақтары</p><div class="qb"></div>';
        quiz(page.querySelector('.qb'), bk.quiz, sc => Progress.award(world.id + ':book:' + bk.id, 10 + sc * 5, null, 'Кітап: ' + bk.title));
      };
      show();
    } });
  }

  /* ---- мұражай ---- */
  function museum(world) {
    const seen = new Set();
    Modal.open({ eyebrow: world.icon + ' ' + world.name, title: '🏛️ Мұражай', cls: 'wide museum', body: b => {
      b.appendChild(h(`<p class="lead">${TEXT.phrases.museum}</p>`)); Voice.say(TEXT.phrases.museum);
      const g = h('<div class="ex-grid"></div>');
      world.museum.forEach((m, k) => { const c = h(`<button class="exhibit" style="--c:${world.color}"><div class="ex-emoji">${m.emoji}</div><h4>${esc(m.title)}</h4><p>${esc(m.text)}</p></button>`);
        c.onclick = () => { g.querySelectorAll('.exhibit').forEach(x => x.classList.remove('on')); c.classList.add('on'); Voice.say(m.title + '. ' + m.text, { btn: c, force: true }); seen.add(k);
          if (seen.size === world.museum.length) Progress.award(world.id + ':museum', 5, null, 'Мұражай: ' + world.short); };
        g.appendChild(c); });
      b.appendChild(g); b.appendChild(h('<p class="hint">Барлық жәдігерді қарап шықсаң, ұпай аласың.</p>'));
    } });
  }

  /* ---- зертхана (киіз үй ішінде) ---- */
  function lab(world, i) {
    const L = world.labs[i], key = world.id + ':lab' + i;
    Modal.open({ eyebrow: '⭕ Киіз үй-зертхана · ' + world.name, title: L.icon + ' ' + L.subject + ': ' + L.title, cls: 'wide yurt', body: b => {
      b.appendChild(h(`<div class="lab-intro"><p>${esc(L.intro)}</p></div>`)); b.querySelector('.lab-intro').prepend(sayBtn(L.intro)); Voice.say(L.intro);
      if (Progress.isDone(key)) b.appendChild(h('<p class="tag ok">✅ Бұл зертхана орындалған. Қайта жаттығуға болады.</p>'));
      const box = h('<div class="lab-box"></div>'); b.appendChild(box);
      const finish = (extra) => { const after = () => Progress.award(key, 15 + (extra || 0), null, L.subject + ' зертханасы'); if (L.quiz && L.type !== 'quiz') { box.appendChild(h('<h3 class="sub">Білімді тексер</h3>')); const qb = h('<div></div>'); box.appendChild(qb); quiz(qb, L.quiz, sc => { Progress.award(key, 15 + sc * 3, null, L.subject + ' зертханасы'); }); } else after(); };
      (LABS[L.type] || LABS.quiz)(box, L, finish);
    } });
  }
  const LABS = {
    sound(box, L, fin) { // Домбыра: ішек ұзындығы → жиілік
      const target = 196 * (1 + Math.floor(Math.random() * 3) * .25); let ac;
      const pluck = f => { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), o2 = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o2.type = 'sine'; o.frequency.value = f; o2.frequency.value = f * 2; g.gain.setValueAtTime(.3, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + 1.4); o.connect(g); o2.connect(g); g.connect(ac.destination); o.start(); o2.start(); o.stop(ac.currentTime + 1.5); o2.stop(ac.currentTime + 1.5); } catch (e) {} };
      box.innerHTML = `<div class="sound"><svg viewBox="0 0 600 140" class="dom"><ellipse cx="90" cy="70" rx="80" ry="55" fill="#a8642a"/><circle cx="90" cy="70" r="12" fill="#3a2212"/><rect x="160" y="62" width="400" height="16" rx="4" fill="#6e3f18"/><rect x="555" y="56" width="35" height="28" rx="5" fill="#5a3212"/><line x1="40" y1="66" x2="580" y2="66" stroke="#eee" stroke-width="2" class="s1"/><line x1="40" y1="74" x2="580" y2="74" stroke="#eee" stroke-width="2"/><circle class="finger" cx="300" cy="70" r="10" fill="#f1c7a1" stroke="#a8742e" stroke-width="3"/></svg>
        <label class="fld">Ішекті басу орны (ұзындығы): <b class="len"></b><input type="range" min="40" max="100" value="100" class="rng"></label>
        <div class="row"><button class="btn ghost tgt">🎯 Мақсатты үнді тыңда</button><button class="btn gold pl">🎵 Ішекті шерт</button><span class="hz"></span></div><p class="hint">Мақсатты үнмен бірдей болғанша ішекті басып, шерт. Ұзындық азайса – жиілік артады: f ~ 1/L.</p></div>`;
      const r = box.querySelector('.rng'), f = () => 196 * 100 / +r.value, upd = () => { box.querySelector('.len').textContent = r.value + '%'; box.querySelector('.finger').setAttribute('cx', 560 - (100 - +r.value) / 60 * 360); box.querySelector('.hz').textContent = Math.round(f()) + ' Гц'; };
      r.oninput = upd; upd(); box.querySelector('.tgt').onclick = () => pluck(target);
      box.querySelector('.pl').onclick = () => { pluck(f()); box.querySelector('.s1').classList.remove('vib'); void box.offsetWidth; box.querySelector('.s1').classList.add('vib');
        if (Math.abs(f() - target) / target < .03 && !box.dataset.ok) { box.dataset.ok = 1; setTimeout(() => { Sfx.win(); box.querySelector('.sound').appendChild(h(`<p class="tag ok big">🎶 Үйлесім табылды! ${Math.round(target)} Гц. Ішектер бірге үн қосқанда – әуен туады.</p>`)); fin(); }, 700); } else if (!box.dataset.ok) App.toast(f() < target ? 'Дыбыс төмен – ішекті қысқарт' : 'Дыбыс жоғары – ішекті ұзарт'); };
    },
    soil(box, L, fin) { // Топырақ реакциясы
      const S = [['А', 'Әкті (сілтілі) топырақ', 'base', true, '🌵 Сексеуіл'], ['Ә', 'Қышқылдау құмды топырақ', 'acid', false, '🌲 Қарағай'], ['Б', 'Бейтарап қара топырақ', 'neutral', false, '🍎 Алма ағашы']];
      const col = { acid: '#e8505b', base: '#3f6fe0', neutral: '#9b6fd0' };
      box.innerHTML = `<div class="soil"><p class="hint">1) Сірке суын тамыз – көпіршік шыға ма? 2) Лакмус тамыз – түсіне қара. 3) Әр топыраққа лайық ағашты таңда.</p><div class="flasks"></div><button class="btn gold chk">Тексеру</button></div>`;
      const fe = box.querySelector('.flasks');
      S.forEach(([n, name, kind, fizz]) => { const c = h(`<div class="flask"><div class="glass"><span class="liq soilliq"></span><div class="bub"></div><b>${n}</b></div><p>${name}</p><div class="row center"><button class="btn ghost vin">🧴 Сірке суы</button><button class="btn ghost lit">🟣 Лакмус</button></div><select><option value="">— қай ағаш? —</option>${S.map(x => `<option>${x[4]}</option>`).join('')}</select></div>`);
        c.querySelector('.vin').onclick = () => { const b = c.querySelector('.bub'); if (fizz) { b.innerHTML = Array.from({ length: 14 }, (_, i) => `<i style="left:${10 + Math.random() * 70}%;animation-delay:${i * .12}s"></i>`).join(''); b.classList.add('on'); App.toast('🫧 Көпіршік! Әк сірке суымен әрекеттесіп, көмірқышқыл газын бөлді'); Sfx.chime(); } else App.toast('Реакция жоқ – көпіршік шықпады'); };
        c.querySelector('.lit').onclick = () => { const l = c.querySelector('.liq'); l.style.background = col[kind]; l.style.height = '62%'; Sfx.chime(); };
        c.dataset.k = S.find(x => x[0] === n)[4]; fe.appendChild(c); });
      box.querySelector('.chk').onclick = () => { let ok = 0; fe.querySelectorAll('.flask').forEach(f => { const r = f.querySelector('select').value === f.dataset.k; f.classList.toggle('right', r); f.classList.toggle('wrong', !r); ok += r; });
        if (ok === 3) { Sfx.win(); box.querySelector('.chk').remove(); box.querySelector('.soil').appendChild(h('<p class="tag ok big">🌱 Тамаша! Еңбекқор маман алдымен зерттейді, сосын егеді.</p>')); fin(); } else { Sfx.bad(); App.toast('Кеңес: қарағай қышқыл топырақты, сексеуіл сілтілі шөлді жерді ұнатады.'); } };
    },
    nature(box, L, fin) { // Табиғат құбылыстары: су айналымы, кемпірқосақ, найзағай
      let done = new Set(); const mark = k => { done.add(k); box.querySelector('.np').textContent = `Орындалды: ${done.size} / 3`; if (done.size === 3 && !box.dataset.ok) { box.dataset.ok = 1; Sfx.win(); box.appendChild(h('<p class="tag ok big">🌦 Табиғат құбылыстарын зерттедің! Білім – табиғатты сақтаудың кілті.</p>')); fin(); } };
      box.innerHTML = `<div class="nature"><p class="np hint">Орындалды: 0 / 3</p>
        <section><h4>1. Су айналымы</h4><svg viewBox="0 0 400 170" class="cyc"><rect x="0" y="120" width="400" height="50" fill="#3f9ee0"/><circle class="sunb" cx="50" cy="40" r="26" fill="#ffd23f" style="cursor:pointer"/><g class="vap" opacity="0">${[0, 1, 2].map(i => `<path d="M${150 + i * 40} 115 q8 -15 0 -30 q-8 -15 0 -30" stroke="#9fd3ff" stroke-width="5" fill="none"/>`).join('')}</g><g class="cloud" opacity="0"><ellipse cx="290" cy="40" rx="50" ry="22" fill="#d6dde6"/><ellipse cx="260" cy="45" rx="30" ry="18" fill="#c9d1db"/></g><g class="rain" opacity="0">${[0, 1, 2, 3, 4].map(i => `<line x1="${260 + i * 12}" y1="70" x2="${255 + i * 12}" y2="95" stroke="#3f9ee0" stroke-width="3"/>`).join('')}</g></svg><p class="hint">Күнді бас: су буланады → бұлт пайда болады → жаңбыр жауады.</p></section>
        <section><h4>2. Кемпірқосақ</h4><svg viewBox="0 0 400 150" class="prism"><line x1="10" y1="75" x2="170" y2="75" stroke="#fff" stroke-width="6"/><polygon points="200,25 250,120 150,120" fill="rgba(200,230,255,.6)" stroke="#9fc3d6" stroke-width="3" class="pr"/><g class="spec" opacity="0">${['#e8505b', '#ff9f43', '#ffd23f', '#2fb37a', '#3fa7f5', '#3f4fd9', '#8a5cf0'].map((c, i) => `<line x1="215" y1="78" x2="390" y2="${40 + i * 12}" stroke="${c}" stroke-width="5"/>`).join('')}</g></svg><label class="fld">Призманың бұрышы: <input type="range" min="0" max="60" value="0" class="ang"></label></section>
        <section><h4>3. Найзағай қашықтығы</h4><p>Найзағай жарқ етті ⚡, ал күркіреу <b class="sec"></b> секундтан кейін естілді. Дыбыс жылдамдығы ≈ 340 м/с. Найзағай неше метр қашықта?</p><label><input type="text" inputmode="numeric" class="dist" placeholder="метр"> м</label> <button class="btn gold dchk">Тексеру</button></section></div>`;
      const sun = box.querySelector('.sunb'); sun.onclick = () => { let i = 0; ['.vap', '.cloud', '.rain'].forEach((sel, k) => setTimeout(() => { box.querySelector(sel).setAttribute('opacity', 1); Sfx.chime(); if (k === 2) mark('cycle'); }, 700 * (k + 1))); };
      const ang = box.querySelector('.ang'); ang.oninput = () => { box.querySelector('.pr').setAttribute('transform', `rotate(${ang.value - 30} 200 85)`); const on = Math.abs(ang.value - 30) < 6; box.querySelector('.spec').setAttribute('opacity', on ? 1 : 0); if (on) mark('prism'); };
      const sec = 2 + Math.floor(Math.random() * 5); box.querySelector('.sec').textContent = sec;
      box.querySelector('.dchk').onclick = () => { const v = parseFloat(box.querySelector('.dist').value.replace(',', '.')); if (Math.abs(v - sec * 340) <= 20) { Sfx.ok(); mark('storm'); App.toast('✅ ' + sec + ' × 340 = ' + sec * 340 + ' м'); } else { Sfx.bad(); App.toast('Секундты 340-қа көбейт'); } };
    },
    forensic(box, L, fin) { // Саусақ ізі
      const types = ['Ілмек (петля)', 'Шиыршық (завиток)', 'Доға (дуга)'], ans = Math.floor(Math.random() * 3);
      const fp = (t, w) => { const c = document.createElement('canvas'); c.width = c.height = w; const x = c.getContext('2d'); x.strokeStyle = '#333'; x.lineWidth = w / 60; const m = w / 2;
        for (let i = 1; i < 11; i++) { x.beginPath(); const r = i * w / 26; if (t === 1) x.ellipse(m, m, r, r * 1.2, 0, 0, 7); else if (t === 0) { x.moveTo(m - r, w * .9); x.bezierCurveTo(m - r, m - r * 1.6, m + r, m - r * 1.6, m + r * .9, w * .9); } else { x.moveTo(w * .05, m + r * .6); x.quadraticCurveTo(m, m - r * 1.1, w * .95, m + r * .6); } x.stroke(); } return c; };
      box.innerHTML = `<div class="forensic"><p class="hint">1) Ұнтақты щеткамен әйнектің бетін сүрт (тінтуірді немесе саусақты жүргіз). 2) Табылған ізді күдіктілердің іздерімен салыстыр.</p><div class="glassbox"><canvas width="320" height="320" class="fpc"></canvas></div><div class="suspects"></div></div>`;
      const cv = box.querySelector('.fpc'), x = cv.getContext('2d'); const hidden = fp(ans, 320); x.fillStyle = '#cfe6f2'; x.fillRect(0, 0, 320, 320);
      let revealed = 0; const brush = e => { const r = cv.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * 320, py = (e.clientY - r.top) / r.height * 320; x.save(); x.beginPath(); x.arc(px, py, 26, 0, 7); x.clip(); x.fillStyle = '#e9dcc0'; x.fillRect(0, 0, 320, 320); x.globalAlpha = .9; x.drawImage(hidden, 0, 0); x.restore(); revealed++; if (revealed === 60) { App.toast('🔍 Саусақ ізі анықталды! Енді салыстыр.'); box.querySelector('.suspects').hidden = false; } };
      let down = false; cv.onpointerdown = e => { down = true; brush(e); }; cv.onpointermove = e => down && brush(e); addEventListener('pointerup', () => down = false);
      const sp = box.querySelector('.suspects'); sp.hidden = true; ['Асан', 'Бекзат', 'Дәулет'].forEach((n, i) => { const t = (ans + i) % 3, c = h(`<button class="suspect"><span></span><b>${n}</b><i>${types[t]}</i></button>`); c.querySelector('span').appendChild(fp(t, 110)); c.onclick = () => { if (t === ans) { Sfx.win(); c.classList.add('right'); sp.appendChild(h(`<p class="tag ok big">⚖️ Дәлел табылды: іздің өрнегі – ${types[ans]}. Бірақ соңғы шешімді тек сот шығарады!</p>`)); fin(); } else { Sfx.bad(); c.classList.add('wrong'); App.toast('Өрнек сәйкес емес. Мұқият қара!'); } }; sp.appendChild(c); });
    },
    quiz(box, L, fin) { quiz(box, L.quiz, sc => fin(sc * 3)); },
    timeline(box, L, fin) { order(box, L.items.map(x => x.t), L.items.map(x => x.y), fin, 'Оқиғаларды ретімен бас:'); },
    steps(box, L, fin) { order(box, L.steps, null, fin, 'Қадамдарды дұрыс ретпен бас:'); },
    match(box, L, fin) {
      box.innerHTML = '<p class="hint">Сол жақтан біреуін, сосын оң жақтан сәйкесін бас.</p><div class="match"><div class="col l"></div><div class="col r"></div></div>';
      let sel = null, ok = 0; const l = box.querySelector('.l'), r = box.querySelector('.r');
      shuffle(L.pairs).forEach(p => { const b = h(`<button class="mi">${esc(p[0])}</button>`); b.dataset.k = p[0]; b.onclick = () => { if (b.classList.contains('done')) return; l.querySelectorAll('.mi').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sel = p; }; l.appendChild(b); });
      shuffle(L.pairs).forEach(p => { const b = h(`<button class="mi">${esc(p[1])}</button>`); b.onclick = () => { if (!sel || b.classList.contains('done')) return; if (sel[1] === p[1]) { b.classList.add('done'); l.querySelector(`[data-k="${CSS.escape(sel[0])}"]`).classList.add('done'); Sfx.ok(); ok++; sel = null; if (ok === L.pairs.length) { box.appendChild(h('<p class="tag ok big">🎉 Барлығы сәйкес!</p>')); fin(); } } else { b.classList.add('wrong'); Sfx.bad(); setTimeout(() => b.classList.remove('wrong'), 500); } }; r.appendChild(b); });
    },
    asyk(box, L, fin) {
      box.innerHTML = `<div class="asyk"><canvas width="560" height="160"></canvas><div class="row"><button class="btn gold throw">🦴 Лақтыр!</button><span class="as-score">Тиген: 0 / 3 · Әрекет: 0 / 6</span></div><ul class="facts">${L.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>`;
      const cv = box.querySelector('canvas'), x = cv.getContext('2d'); let t = 0, hits = 0, tries = 0, run = true, flash = 0;
      const zone = () => ({ a: 0.42, b: 0.58 });
      function draw() { if (!run || !box.isConnected) return; t += .022; const pos = (Math.sin(t * (1 + hits * .35)) + 1) / 2, z = zone();
        x.clearRect(0, 0, 560, 160); x.fillStyle = '#f3e6c8'; x.fillRect(20, 60, 520, 40); x.fillStyle = '#4cc38a'; x.fillRect(20 + z.a * 520, 60, (z.b - z.a) * 520, 40);
        for (let i = 0; i < 3; i++) { x.font = '34px serif'; x.fillText('🦴', 250 + i * 26, 48); }
        x.fillStyle = flash > 0 ? '#e8505b' : '#0b1a3a'; x.fillRect(20 + pos * 520 - 4, 52, 8, 56); flash--;
        cv.dataset.pos = pos; requestAnimationFrame(draw); }
      draw();
      box.querySelector('.throw').onclick = () => { if (tries >= 6 || hits >= 3) return; tries++; const p = +cv.dataset.pos, z = zone(); if (p > z.a && p < z.b) { hits++; Sfx.ok(); } else { Sfx.bad(); flash = 15; }
        box.querySelector('.as-score').textContent = `Тиген: ${hits} / 3 · Әрекет: ${tries} / 6`;
        if (hits >= 3) { run = false; box.appendChild(h('<p class="tag ok big">🏆 Мерген атқыш! Асық нысанаға тиді.</p>')); fin(); }
        else if (tries >= 6) { box.appendChild(h('<p class="tag">Тағы бір рет көр! Зертхананы қайта аш.</p>')); run = false; } };
    },
    robot(box, L, fin) {
      const N = 6, start = [0, 5], goal = [5, 0], walls = ['1,5', '1,4', '1,3', '3,1', '3,2', '3,0', '4,3', '2,1', '5,3'];
      box.innerHTML = `<div class="robot"><div class="grid"></div><div class="rp"><p class="hint">Командаларды қосып, «Іске қос» бас. 🤖 роботты 🔋 станцияға жеткіз.</p><div class="cmds"><button data-d="U">⬆️</button><button data-d="L">⬅️</button><button data-d="R">➡️</button><button data-d="D">⬇️</button></div><div class="prog"></div><div class="row"><button class="btn ghost clr">Тазалау</button><button class="btn gold go">▶ Іске қос</button></div></div></div>`;
      const grid = box.querySelector('.grid'), prog = []; const cell = (x, y) => grid.children[y * N + x];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) grid.appendChild(h(`<div class="cell ${walls.includes(x + ',' + y) ? 'wall' : ''}">${walls.includes(x + ',' + y) ? '🪨' : ''}</div>`));
      cell(...goal).textContent = '🔋'; let bot = start.slice(); const place = () => { grid.querySelectorAll('.bot').forEach(c => { c.classList.remove('bot'); if (c.textContent === '🤖') c.textContent = ''; }); const c = cell(...bot); c.classList.add('bot'); c.textContent = '🤖'; }; place();
      const pe = box.querySelector('.prog'); const render = () => pe.innerHTML = prog.map(d => ({ U: '⬆️', D: '⬇️', L: '⬅️', R: '➡️' }[d])).join(' ') || '<i>Бағдарлама бос</i>'; render();
      box.querySelectorAll('.cmds button').forEach(b => b.onclick = () => { if (prog.length < 20) { prog.push(b.dataset.d); render(); } });
      box.querySelector('.clr').onclick = () => { prog.length = 0; render(); bot = start.slice(); place(); };
      box.querySelector('.go').onclick = async () => { bot = start.slice(); place();
        for (const d of prog) { await new Promise(r => setTimeout(r, 350)); const n = [bot[0] + (d === 'R') - (d === 'L'), bot[1] + (d === 'D') - (d === 'U')];
          if (n[0] < 0 || n[1] < 0 || n[0] >= N || n[1] >= N || walls.includes(n.join(','))) { Sfx.bad(); App.toast('🪨 Кедергі! Бағдарламаны түзет.'); return; } bot = n; place(); }
        if (bot[0] === goal[0] && bot[1] === goal[1]) { Sfx.win(); box.querySelector('.rp').appendChild(h(`<p class="tag ok big">⚡ Робот қуатталды! Алгоритм: ${prog.length} қадам.</p>`)); fin(prog.length <= 10 ? 3 : 0); } else { Sfx.bad(); App.toast('Робот станцияға жетпеді. Тағы көр!'); } };
    },
    circuit(box, L, fin) {
      const parts = [['🔋', 'Батарея', 1], ['💡', 'Шам', 1], ['🔘', 'Кілт (ажыратқыш)', 1], ['〰️', 'Мыс сым', 1], ['🪵', 'Ағаш таяқша', 0], ['🎈', 'Резеңке шар', 0]];
      box.innerHTML = `<div class="circuit"><p class="hint">Тізбекке тек ток өткізетін бөлшектерді таңда (4 бөлшек).</p><div class="parts"></div><svg viewBox="0 0 320 170" class="csvg"><rect x="40" y="30" width="240" height="110" rx="10" fill="none" stroke="#b9c3d6" stroke-width="5" stroke-dasharray="10 8" class="wire"/><text x="30" y="95" font-size="34" class="s-bat">◻️</text><text x="140" y="42" font-size="34" class="s-lamp">◻️</text><text x="255" y="95" font-size="34" class="s-sw">◻️</text></svg><button class="btn gold sw" disabled>🔘 Кілтті тұйықта</button></div>`;
      const chosen = new Set(), pe = box.querySelector('.parts');
      parts.forEach(([e, n, ok]) => { const b = h(`<button class="part">${e}<span>${n}</span></button>`); b.onclick = () => { if (!ok) { b.classList.add('wrong'); Sfx.bad(); App.toast(n + ' – диэлектрик, ток өткізбейді!'); setTimeout(() => b.classList.remove('wrong'), 600); return; } b.classList.add('done'); chosen.add(n); Sfx.ok();
        const s = box.querySelector('svg'); if (n === 'Батарея') s.querySelector('.s-bat').textContent = '🔋'; if (n === 'Шам') s.querySelector('.s-lamp').textContent = '💡'; if (n.startsWith('Кілт')) s.querySelector('.s-sw').textContent = '🔘'; if (n === 'Мыс сым') { const w = s.querySelector('.wire'); w.setAttribute('stroke', '#d9822b'); w.removeAttribute('stroke-dasharray'); }
        if (chosen.size === 4) box.querySelector('.sw').disabled = false; }; pe.appendChild(b); });
      box.querySelector('.sw').onclick = (e) => { e.target.disabled = true; box.querySelector('.csvg').classList.add('lit'); Sfx.win(); box.querySelector('.circuit').appendChild(h('<p class="tag ok big">💡 Шам жанды! Тізбек тұйықталды.</p>')); fin(); };
    },
    chem(box, L, fin) {
      const fl = [['🍋', 'Лимон шырыны', 'acid'], ['🧼', 'Сабын ерітіндісі', 'base'], ['💧', 'Таза су', 'neutral']];
      const color = { litmus: { acid: '#e8505b', base: '#3f6fe0', neutral: '#9b6fd0' }, phen: { acid: '#f4f4f4', base: '#e0368a', neutral: '#f4f4f4' } };
      box.innerHTML = `<div class="chem"><p class="hint">1) Индикатор таңда. 2) Колбаны басып, тамыз. 3) Ортаны анықта.</p><div class="ind"><button data-i="litmus" class="btn ghost on">🟣 Лакмус</button><button data-i="phen" class="btn ghost">⚪ Фенолфталеин</button></div><div class="flasks"></div><button class="btn gold chk">Тексеру</button></div>`;
      let ind = 'litmus'; box.querySelectorAll('.ind button').forEach(b => b.onclick = () => { ind = b.dataset.i; box.querySelectorAll('.ind button').forEach(x => x.classList.toggle('on', x === b)); });
      const fe = box.querySelector('.flasks');
      fl.forEach(([e, n, kind]) => { const c = h(`<div class="flask"><button class="glass"><span class="liq"></span><b>${e}</b></button><p>${n}</p><select><option value="">— орта? —</option><option value="acid">Қышқыл</option><option value="base">Сілті</option><option value="neutral">Бейтарап</option></select></div>`);
        c.querySelector('.glass').onclick = () => { c.querySelector('.liq').style.background = color[ind][kind]; c.querySelector('.liq').style.height = '70%'; Sfx.chime(); };
        c.dataset.k = kind; fe.appendChild(c); });
      box.querySelector('.chk').onclick = () => { let ok = 0; fe.querySelectorAll('.flask').forEach(f => { const r = f.querySelector('select').value === f.dataset.k; f.classList.toggle('right', r); f.classList.toggle('wrong', !r); ok += r; });
        if (ok === 3) { Sfx.win(); box.querySelector('.chk').remove(); box.querySelector('.chem').appendChild(h('<p class="tag ok big">🧪 Тамаша химик! Барлық орта дұрыс анықталды.</p>')); fin(); } else { Sfx.bad(); App.toast('Тағы ойлан: лакмус қышқылда қызарады, сілтіде көгереді.'); } };
    },
    calc(box, L, fin) {
      box.innerHTML = '<div class="calc"></div><button class="btn gold chk">Тексеру</button>'; const c = box.querySelector('.calc');
      L.problems.forEach((p, k) => { const r = h(`<div class="prob"><p><b>${k + 1}.</b> ${esc(p.q)}</p><label><input type="text" inputmode="decimal" placeholder="Жауап"> <span>${p.unit}</span></label><i class="pf"></i></div>`); r.querySelector('p').prepend(sayBtn(p.q)); c.appendChild(r); });
      box.querySelector('.chk').onclick = () => { let ok = 0; c.querySelectorAll('.prob').forEach((r, k) => { const v = parseFloat(r.querySelector('input').value.replace(',', '.')), p = L.problems[k], good = Math.abs(v - p.ans) <= p.tol; r.classList.toggle('right', good); r.classList.toggle('wrong', !good); r.querySelector('.pf').textContent = good ? '✅' : '❌'; ok += good; });
        if (ok === L.problems.length) { Sfx.win(); box.querySelector('.chk').remove(); box.appendChild(h('<p class="tag ok big">🎉 Барлық есеп дұрыс шығарылды!</p>')); fin(); } else { Sfx.bad(); App.toast(`${ok} / ${L.problems.length} дұрыс. Қатесін түзет.`); } };
    }
  };
  function order(box, labels, years, fin, title) {
    const correct = labels.slice(); let picked = [];
    box.innerHTML = `<p class="hint">${title}</p><ol class="slots"></ol><div class="pool"></div>`;
    const slots = box.querySelector('.slots'), pool = box.querySelector('.pool');
    function render() { slots.innerHTML = correct.map((_, k) => `<li class="${picked[k] ? 'fill' : ''}">${picked[k] ? esc(picked[k]) + (years ? ` <b>${years[correct.indexOf(picked[k])]}</b>` : '') : '…'}</li>`).join(''); }
    shuffle(labels).forEach(t => { const b = h(`<button class="chip">${esc(t)}</button>`); b.onclick = () => {
      const k = picked.length; if (correct[k] === t) { picked.push(t); b.remove(); Sfx.ok(); render(); if (picked.length === correct.length) { box.appendChild(h('<p class="tag ok big">🎉 Дұрыс рет!</p>')); fin(); } }
      else { b.classList.add('wrong'); Sfx.bad(); setTimeout(() => b.classList.remove('wrong'), 500); } }; pool.appendChild(b); });
    render();
  }

  /* ---- тапсырмалар: оқылым, жазылым, айтылым ---- */
  function tasks(world) {
    Modal.open({ eyebrow: world.icon + ' ' + world.name, title: '🧩 Тапсырмалар', cls: 'wide', body: b => {
      const list = [['read', '📚', 'Оқылым', 'Әлемнің үш кітабы бойынша сұрақтар'], ['write', '✍️', world.tasks.write.title, world.tasks.write.prompt], ['speak', '🎙️', world.tasks.speak.title, world.tasks.speak.prompt]];
      const g = h('<div class="task-grid"></div>');
      list.forEach(([k, e, t, d], i) => { const c = h(`<button class="task-card n${i}"><span class="tn">${i + 1}</span><div class="te">${e}</div><h4>${esc(t)}</h4><p>${esc(d)}</p>${doneTag(world.id + ':' + k)}</button>`); c.onclick = () => ({ read: readTask, write: writeTask, speak: speakTask })[k](world); g.appendChild(c); });
      b.appendChild(g);
    } });
  }
  function readTask(world) {
    Modal.open({ eyebrow: world.icon + ' Оқылым', title: '📚 Оқып, жауап бер', cls: 'wide', body: b => {
      const txt = world.books.map(x => `<p><b>${esc(x.title)}</b> (${esc(x.author)}). ${esc(x.summary)}</p>`).join('');
      b.appendChild(h(`<div class="readtxt">${txt}</div>`)); b.querySelector('.readtxt').prepend(sayBtn(world.books.map(x => x.summary)));
      const go = h('<button class="btn gold">Сұрақтарға көшу →</button>'); b.appendChild(go);
      go.onclick = () => { b.innerHTML = '<div class="qb"></div>'; const qs = world.books.flatMap(x => x.quiz); quiz(b.querySelector('.qb'), qs, sc => Progress.award(world.id + ':read', 10 + sc * 2, sc + '/' + qs.length, 'Оқылым: ' + world.short)); };
    } });
  }
  function writeFree(o) {
    const prev = (Progress.rec && Progress.rec.done[o.key] || {}).a || '';
    Modal.open({ eyebrow: '✍️ Жазылым', title: o.title, cls: 'wide paper', body: b => {
      b.appendChild(h(`<div class="lab-intro"><p>${esc(o.prompt)}</p></div>`)); b.querySelector('.lab-intro').prepend(sayBtn(o.prompt)); Voice.say(TEXT.phrases.write);
      const ta = h(`<textarea rows="8" placeholder="Осы жерге жаз...">${esc(prev)}</textarea>`), info = h('<p class="hint wc"></p>'), row = h('<div class="row"></div>'), sb = h('<button class="btn gold">📨 Мұғалімге жіберу</button>'), dict = h('<button class="btn ghost">🎙 Айтып жазу</button>');
      const wc = () => { const n = ta.value.trim().split(/\s+/).filter(Boolean).length; info.textContent = `Сөз саны: ${n} (кемінде 25)`; return n; }; ta.oninput = wc; wc();
      dict.onclick = async () => { if (!Voice.canListen()) return App.toast('Айтып жазу үшін Google Chrome ашыңыз'); dict.textContent = '⏺ Тыңдап тұрмын... (тоқтату)'; dict.onclick = () => Voice.stopListen(); const base = ta.value; try { await Voice.listen('kk-KZ', t => { ta.value = (base + ' ' + t).trim(); wc(); }); } catch (e) {} dict.textContent = '🎙 Айтып жазу'; };
      sb.onclick = () => { if (wc() < 25) { App.toast('Тағы біраз жаз: кемінде 25 сөз.'); Sfx.bad(); return; } Progress.award(o.key, o.pts || 15, ta.value.trim(), o.title) || Progress.award(o.key, 0, ta.value.trim()); App.toast('📨 Жұмысың мұғалімге жіберілді!'); Modal.close(); o.onDone && o.onDone(); };
      row.append(dict, sb); b.append(ta, info, row);
    } });
  }
  function speakFree(o) {
    Modal.open({ eyebrow: '🎙️ Айтылым', title: o.title, cls: 'wide paper', body: b => {
      b.appendChild(h(`<div class="lab-intro"><p>${esc(o.prompt)}</p></div>`)); b.querySelector('.lab-intro').prepend(sayBtn(o.prompt)); Voice.say(o.prompt);
      const out = h('<div class="transcript"><i>Мұнда сенің сөзің мәтінге айналады...</i></div>'), mic = h('<button class="mic">🎙️<span>Сөйлеу</span></button>'), sb = h('<button class="btn gold" disabled>📨 Жіберу</button>'), tm = h('<p class="hint"></p>');
      let on = false, timer = 0, sec = 0;
      mic.onclick = async () => {
        if (!Voice.canListen()) { out.contentEditable = 'true'; out.innerHTML = ''; out.focus(); tm.textContent = 'Бұл браузерде сөйлеуді тану жоқ (Google Chrome ұсынылады). Айтқаныңды осында жаз.'; sb.disabled = false; return; }
        if (on) { Voice.stopListen(); return; }
        on = true; mic.classList.add('rec'); mic.querySelector('span').textContent = 'Тоқтату'; sec = 0; timer = setInterval(() => { sec++; tm.textContent = `⏺ Жазылуда: ${sec} с`; }, 1000);
        try { await Voice.listen(o.lang || 'kk-KZ', t => { out.textContent = t; }); } catch (e) { tm.textContent = 'Микрофонға рұқсат беріңіз немесе қайталап көріңіз.'; }
        on = false; clearInterval(timer); mic.classList.remove('rec'); mic.querySelector('span').textContent = 'Қайта сөйлеу';
        const t = (out.textContent || '').trim(); if (t.split(/\s+/).length >= 4) { sb.disabled = false; tm.textContent = `Жарайсың! ${sec} секунд сөйледің.`; } else tm.textContent = 'Сөз аз болды, тағы қайтала.';
      };
      sb.onclick = () => { const t = (out.textContent || '').trim(); if (t.length < 10) return; Progress.award(o.key, o.pts || 15, '🎙️ ' + t, o.title) || Progress.award(o.key, 0, '🎙️ ' + t); App.toast('📨 Айтылым мәтіні мұғалімге жіберілді!'); Modal.close(); o.onDone && o.onDone(); };
      b.append(h('<div class="mic-row"></div>')); b.querySelector('.mic-row').append(mic, tm); b.append(out, sb);
    } });
  }
  const writeTask = world => writeFree({ key: world.id + ':write', title: '✍️ ' + world.tasks.write.title + ' · ' + world.short, prompt: world.tasks.write.prompt, pts: 15 });
  const speakTask = world => speakFree({ key: world.id + ':speak', title: '🎙️ ' + world.tasks.speak.title + ' · ' + world.short, prompt: world.tasks.speak.prompt, lang: world.tasks.speak.lang, pts: 15 });

  /* ---- өмірлік жағдаят ---- */
  function kase(world) {
    const C = world.case; let first = true;
    Modal.open({ eyebrow: '💬 Өмірлік жағдаят · ' + C.npc, title: C.title, cls: 'wide', body: b => {
      b.appendChild(h(`<div class="npc"><div class="npc-face">${C.npc === 'Әже' ? '👵' : '👴'}</div><p>${esc(C.text)}</p></div>`)); b.querySelector('.npc p').prepend(sayBtn(C.text)); Voice.say(C.text);
      const opts = h('<div class="opts"></div>'), fb = h('<p class="fb big"></p>');
      C.options.forEach(o => { const btn = h(`<button class="opt">${esc(o.t)}</button>`); btn.onclick = () => { opts.querySelectorAll('.opt').forEach(x => x.classList.remove('right', 'wrong')); btn.classList.add(o.ok ? 'right' : 'wrong'); fb.textContent = o.fb; Voice.say(o.fb); o.ok ? Sfx.ok() : Sfx.bad();
        if (o.ok) Progress.award(world.id + ':case', first ? 10 : 5, (first ? '' : '(2-әрекет) ') + o.t, 'Жағдаят: ' + C.title); else first = false; }; opts.appendChild(btn); });
      b.append(opts, fb);
    } });
  }

  /* ---- буктрейлер ---- */
  function trailer(world) {
    const emo = [world.icon, '📖', ...world.museum.map(m => m.emoji), '⭐'];
    Modal.open({ eyebrow: '🎬 Буктрейлер', title: world.name, cls: 'trailer', body: b => {
      const st = h(`<div class="stage" style="--c:${world.color}"><div class="orn"></div><div class="emo"></div><p class="line"></p><div class="bar"><i></i></div></div>`), ctl = h('<div class="row center"><button class="btn gold play">▶ Көру</button></div>');
      b.append(st, ctl);
      const play = async () => { ctl.hidden = true;
        for (let i = 0; i < world.trailer.length; i++) { if (!st.isConnected) return; const e = st.querySelector('.emo'), l = st.querySelector('.line'); e.textContent = emo[i % emo.length]; l.textContent = world.trailer[i]; st.classList.remove('anim'); void st.offsetWidth; st.classList.add('anim'); st.querySelector('.bar i').style.width = ((i + 1) / world.trailer.length * 100) + '%';
          const t0 = Date.now(); await new Promise(r => Voice.say(world.trailer[i], { force: true, done: r })); const left = 2600 - (Date.now() - t0); if (left > 0) await new Promise(r => setTimeout(r, left)); }
        if (st.isConnected) { Progress.award(world.id + ':trailer', 5, null, 'Буктрейлер: ' + world.short); ctl.hidden = false; ctl.querySelector('.play').textContent = '↻ Қайта көру'; } };
      ctl.querySelector('.play').onclick = play; st.querySelector('.line').textContent = world.motto; st.querySelector('.emo').textContent = world.icon;
    } });
  }
  return { books, reader, museum, lab, tasks, kase, trailer, quiz, writeFree, speakFree };
})();
