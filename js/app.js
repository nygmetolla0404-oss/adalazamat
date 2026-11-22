/* Негізгі қосымша: сынып коды, тіркелу, кіру, мұғалім аккаунты, Қазақстан картасы, кітаптар, тірі қатысу */
window.App = (function () {
  const $ = s => document.querySelector(s), esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const D = CONFIG.DEMO_TEACHER;
  let user = null, myId = null, lastMapPres = 0, pres = { w: 'map' };
  const TR = { а: 'a', ә: 'a', б: 'b', в: 'v', г: 'g', ғ: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i', к: 'k', қ: 'q', л: 'l', м: 'm', н: 'n', ң: 'n', о: 'o', ө: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ұ: 'u', ү: 'u', ф: 'f', х: 'h', һ: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sh', ъ: '', ы: 'y', і: 'i', ь: '', э: 'e', ю: 'yu', я: 'ya' };
  const translit = s => s.toLowerCase().split('').map(c => TR[c] != null ? TR[c] : /[a-z0-9]/.test(c) ? c : '').join('');
  const WORDS = ['bars', 'kyran', 'tulpar', 'alma', 'kun', 'aisu', 'dala', 'samal', 'nur', 'ainur', 'jas', 'kok'];
  const genPass = () => WORDS[Math.random() * WORDS.length | 0] + (10 + Math.random() * 90 | 0);
  const subsFor = id => ['cfg', 'msg/all', 'pres/#'].concat(id ? ['acct/' + id, 'prog/' + id, 'ctl/' + id, 'msg/' + id] : []);
  async function classInfo(code) { code = (code || '').toUpperCase().trim(); if (!code) return null; if (code === D.code) return { name: D.name, school: D.school, cls: D.cls, code }; return await Net.fetchOnce('@/code/' + code, 3000); }

  /* ---------- бастау ---------- */
  function boot() {
    renderSections();
    Net.onStatus(on => document.querySelectorAll('.net-chip').forEach(n => { n.classList.toggle('on', on); n.title = on ? 'Тірі әлемге қосылды' : 'Офлайн режим'; }));
    Net.connect({ subs: subsFor(null) });
    Net.on('pres/', (p, v) => { if (v) World.onPresence(v); onlineCount(); });
    Net.on('cfg', applyCfg); Net.on('msg/', onMsg);
    Net.on('prog/', (p, v) => { if (myId && p === 'prog/' + myId) Progress.merge(v); });
    Net.on('ctl/', (p, v) => { if (myId && p === 'ctl/' + myId && !document.body.classList.contains('in-teacher')) checkCtl(v); });
    Net.on('acct/', (p, v) => { if (!myId || p !== 'acct/' + myId || document.body.classList.contains('in-teacher')) return; if (v && !v._del && user && v.login === user.login) { if (v.pass !== user.pass) { logout('Мұғалім құпиясөзіңді өзгертті. Жаңа құпиясөзбен кір.'); return; } user = Object.assign({}, v, { code: user.code }); updateUserChip(); } else if (v && v._del) logout('Аккаунтың өшірілді. Мұғаліміңе хабарлас.'); });
    World.showMap();
    try { const s = JSON.parse(localStorage.getItem('sg_session') || 'null'); if (s) resume(s); } catch (e) {}
    applyCfg(); updateUserChip(); showClass();
    setInterval(() => { if (user && Date.now() - lastMapPres > 4000) presence({}); onlineCount(); }, 2000);
    document.querySelectorAll('.nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
    $('#burger').onclick = () => document.body.classList.toggle('menu-open');
    $('#voiceBtn').onclick = () => { Voice.setEnabled(!Voice.enabled); syncVoice(); }; syncVoice();
    $('#teacherBtn').onclick = teacherLogin; document.querySelectorAll('.open-teacher').forEach(b => b.onclick = teacherLogin);
    $('#userChip').onclick = () => user ? profile() : auth();
    $('#startBtn').onclick = () => { $('#splash').classList.add('gone'); Voice.say([TEXT.phrases.welcome, user ? TEXT.phrases.kzmap : TEXT.phrases.register]); if (!user) setTimeout(() => { if (!user && !document.querySelector('#modal.open') && !document.body.classList.contains('in-teacher')) auth(); }, 600); };
    $('#wBack').onclick = () => World.kind === 'value' ? World.exitToMap() : World.setMode('overview');
    document.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { const m = b.dataset.mode; if (m === 'overview') return World.setMode('overview'); if (!user) return auth(() => World.travel(m)); World.mode === 'overview' ? World.travel(m) : World.setMode(m); });
    $('#wBook').onclick = () => { const w = World.world; if (w && w.holiday) return Book.open(Books.holiday(w.holiday)); if (w) return Book.open(Books.world(w)); if (World.kind === 'museum') return Book.open(Books.world(WORLDS[0]), 'museum'); const z = World.zoneWorld && World.zoneWorld(); Book.open(Books.world(z || WORLDS[0])); };
    $('#wVoice').onclick = () => { Voice.setEnabled(!Voice.enabled); syncVoice(); };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(s => io.observe(s));
    try { const t = JSON.parse(sessionStorage.getItem('sg_teacher') || 'null'); if (t) { $('#splash').classList.add('gone'); enterTeacher(t); } } catch (e) {}
  }
  function syncVoice() { const t = Voice.enabled ? '🔊' : '🔇'; $('#voiceBtn').textContent = t; $('#wVoice').textContent = t; }
  async function showClass() { const c = await classInfo(CONFIG.CLASS); const el = $('#classInfo'); if (el) el.innerHTML = c ? `🏫 Сынып коды: <b>${esc(CONFIG.CLASS)}</b> · ${esc(c.cls)} · ${esc(c.name)}` : `🏫 Сынып коды: <b>${esc(CONFIG.CLASS)}</b>`; }

  /* ---------- оқушы аккаунты ---------- */
  function useClass(code) { code = code.toUpperCase(); if (Net.room.endsWith('|' + code)) return; CONFIG.CLASS = code; try { localStorage.setItem('sg_class', code); } catch (e) {} Net.setRoom(code); Net.connect({ subs: subsFor(null) }); }
  async function createAccount(o) {
    let login, tries = 0;
    do { login = translit(o.first).slice(0, 10) + (tries < 3 ? (10 + Math.random() * 90 | 0) : (100 + Math.random() * 900 | 0)); tries++; } while (Net.get('acct/' + Net.id(login)) && tries < 8);
    if (await Net.fetchOnce('acct/' + Net.id(login), 1500)) login += (Math.random() * 9 | 0);
    const acct = { login, pass: o.pass || genPass(), first: o.first, last: o.last, cls: o.cls, avatar: o.avatar, created: Date.now() };
    Net.put('acct/' + Net.id(login), acct); return acct;
  }
  function setUser(acct, code) {
    user = Object.assign({}, acct, { code }); myId = Net.id(acct.login);
    localStorage.setItem('sg_session', JSON.stringify({ login: acct.login, pass: acct.pass, code }));
    Net.connect({ subs: subsFor(myId), will: { path: 'pres/' + myId, data: { off: 1, id: myId } } });
    Progress.start(myId); checkCtl(Net.get('ctl/' + myId)); updateUserChip(); updateBadges(); renderShelf(); if (!World.kind) World.showMap(); presence({});
  }
  function checkCtl(v) { if (!v || !user) return; if (v.deleted && !Net.get('acct/' + myId)) logout('Аккаунтың өшірілді. Мұғаліміңе хабарлас.'); else if (v.blocked) logout(TEXT.phrases.blocked); }
  async function resume(s) {
    const code = s.code || CONFIG.CLASS; useClass(code);
    const local = Net.get('acct/' + Net.id(s.login)); if (local && local.pass === s.pass) setUser(local, code);
    const remote = await Net.fetchOnce('acct/' + Net.id(s.login), 4000);
    if (remote && remote.pass !== s.pass && user) logout('Мұғалім құпиясөзіңді өзгертті. Жаңа құпиясөзбен кір.');
    else if (remote && !user && remote.pass === s.pass) setUser(remote, code);
  }
  function logout(msg) {
    if (Book.current) Book.close(); if (World.world) World.exitToMap(); World.setMode('overview'); Progress.stop(); if (myId) Net.send('pres/' + myId, { off: 1, id: myId });
    user = null; myId = null; localStorage.removeItem('sg_session'); Net.connect({ subs: subsFor(null) }); updateUserChip(); renderShelf(); Modal.close();
    if (msg) { toast(msg, 6000); Voice.say(msg); }
  }
  function auth(then) {
    let av = { t: 'flame', c: Avatars.COLORS[0] };
    Modal.open({ eyebrow: 'Smart Guide · Адал азамат', title: '🐆 Саяхатқа қош келдің!', cls: 'auth', body: b => {
      b.innerHTML = `<div class="tabs"><button class="on" data-tab="reg">Тіркелу</button><button data-tab="in">Кіру</button></div>
      <form class="pane reg" autocomplete="off"><label class="fld">Сынып коды <small>(сынып жетекшіңнен ал)</small><input name="code" required maxlength="12" value="${esc(CONFIG.CLASS)}" autocapitalize="characters"></label><p class="class-who muted small"></p>
        <div class="grid2"><label class="fld">Аты<input name="first" required maxlength="20" placeholder="Арман"></label><label class="fld">Тегі<input name="last" required maxlength="24" placeholder="Серікұлы"></label></div>
        <label class="fld">Сыныбы<div class="cls"><select name="num">${Array.from({ length: 11 }, (_, i) => `<option ${i === 9 ? 'selected' : ''}>${i + 1}</option>`).join('')}</select><select name="let">${['А', 'Ә', 'Б', 'В', 'Г', 'Д', 'Е'].map(l => `<option ${l === 'Б' ? 'selected' : ''}>${l}</option>`).join('')}</select></div></label>
        <p class="fld-l">Кейіпкеріңді таңда</p><div class="av-pick">${Avatars.TYPES.map(t => `<button type="button" data-t="${t.id}" class="${t.id === av.t ? 'on' : ''}"><span>${t.emoji}</span>${t.name}</button>`).join('')}</div>
        <div class="col-pick">${Avatars.COLORS.map(c => `<button type="button" data-c="${c}" style="--c:${c}" class="${c === av.c ? 'on' : ''}"></button>`).join('')}</div>
        <button class="btn gold big" type="submit">✨ Тіркелу және бастау</button></form>
      <form class="pane in" hidden autocomplete="off"><label class="fld">Сынып коды<input name="code" required value="${esc(CONFIG.CLASS)}" autocapitalize="characters"></label><label class="fld">Логин<input name="login" required placeholder="arman27" autocapitalize="off"></label><label class="fld">Құпиясөз<input name="pass" required type="password"></label><button class="btn gold big" type="submit">Кіру</button><p class="muted small">Логин мен құпиясөзді ұмытсаң, сынып жетекшіңнен сұра.</p></form>`;
      b.querySelectorAll('[data-tab]').forEach(t => t.onclick = () => { b.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === t)); b.querySelector('.reg').hidden = t.dataset.tab !== 'reg'; b.querySelector('.in').hidden = t.dataset.tab !== 'in'; });
      b.querySelectorAll('[data-t]').forEach(x => x.onclick = () => { av.t = x.dataset.t; b.querySelectorAll('[data-t]').forEach(y => y.classList.toggle('on', y === x)); });
      b.querySelectorAll('[data-c]').forEach(x => x.onclick = () => { av.c = x.dataset.c; b.querySelectorAll('[data-c]').forEach(y => y.classList.toggle('on', y === x)); });
      const who = b.querySelector('.class-who'), check = async () => { const c = await classInfo(b.querySelector('.reg').code.value); who.innerHTML = c ? `✅ ${esc(c.cls)} · сынып жетекшісі: <b>${esc(c.name)}</b>` : '⚠️ Мұндай сынып коды табылмады. Мұғаліміңнен тексеріп ал.'; return c; };
      b.querySelector('.reg').code.onchange = check; check();
      b.querySelector('.reg').onsubmit = async e => { e.preventDefault(); const f = e.target, btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = '⏳ ...';
        const c = await check(); if (!c) { btn.disabled = false; btn.textContent = '✨ Тіркелу және бастау'; return toast('Сынып коды қате'); }
        useClass(c.code || f.code.value);
        const first = f.first.value.trim().replace(/^./, ch => ch.toUpperCase()), last = f.last.value.trim().replace(/^./, ch => ch.toUpperCase());
        const acct = await createAccount({ first, last, cls: f.num.value + ' «' + f.let.value + '»', avatar: av }); setUser(acct, CONFIG.CLASS);
        b.innerHTML = `<div class="cred"><div class="cred-av" style="--c:${av.c}">${Avatars.icon(av.t)}</div><h3>Сәлем, ${esc(first)}!</h3><p>Сенің жеке логин мен құпиясөзің. <b>Жазып ал!</b></p><div>Сынып коды: <b>${esc(CONFIG.CLASS)}</b></div><div>Логин: <b>${esc(acct.login)}</b></div><div>Құпиясөз: <b>${esc(acct.pass)}</b></div><button class="btn gold big" id="goMap">🗺️ Қазақстан картасына</button></div>`;
        b.querySelector('#goMap').onclick = () => { Modal.close(); location.hash = '#map'; Voice.say(TEXT.phrases.kzmap); then && then(); }; };
      b.querySelector('.in').onsubmit = async e => { e.preventDefault(); const f = e.target, login = f.login.value.trim().toLowerCase(), pass = f.pass.value.trim(), btn = f.querySelector('[type=submit]'); btn.disabled = true; btn.textContent = '⏳ Тексерілуде...';
        useClass(f.code.value.trim()); const acct = await Net.fetchOnce('acct/' + Net.id(login), 4000); btn.disabled = false; btn.textContent = 'Кіру';
        if (!acct) return toast('Бұл сыныпта мұндай логин табылмады.'); if (acct.pass !== pass) return toast('Құпиясөз қате.');
        const ctl = await Net.fetchOnce('ctl/' + Net.id(login), 1500); if (ctl && ctl.blocked) return toast(TEXT.phrases.blocked);
        setUser(acct, CONFIG.CLASS); Modal.close(); toast('Қош келдің, ' + acct.first + '!'); location.hash = '#map'; Voice.say(TEXT.phrases.kzmap); then && then(); };
    } });
  }
  function profile() {
    const p = Progress.rec || {};
    Modal.open({ eyebrow: user.cls + ' · ' + user.login + ' · сынып коды ' + user.code, title: Avatars.icon(user.avatar.t) + ' ' + user.first + ' ' + user.last, body: b => {
      b.innerHTML = `<div class="kpis"><div><b>${p.score || 0}</b><span>ұпай</span></div><div><b>${Math.round((p.sec || 0) / 60)} мин</b><span>платформада</span></div><div><b>${Math.round((p.readSec || 0) / 60)} мин</b><span>кітап оқу</span></div></div>
      <div class="bars">${WORLDS.map(w => `<div class="bar-row"><span>${w.icon} ${w.short}</span><div class="bar"><i style="width:${Progress.worldPct(w)}%;background:${w.color}"></i></div><b>${Progress.worldPct(w)}%</b></div>`).join('')}</div>
      <div class="row"><button class="btn ghost" id="pOut">Шығу</button></div>`;
      b.querySelector('#pOut').onclick = () => logout();
    } });
  }

  /* ---------- мұғалім аккаунты ---------- */
  function teacherLogin() {
    Modal.open({ eyebrow: 'Сынып жетекшісіне', title: '👩‍🏫 Мұғалім кабинеті', cls: 'auth', body: b => {
      b.innerHTML = `<div class="tabs"><button class="on" data-tab="in">Кіру</button><button data-tab="reg">Жаңа сынып тіркеу</button></div>
      <form class="pane in"><label class="fld">Логин<input name="login" required autocapitalize="off" placeholder="mugalim"></label><label class="fld">Құпиясөз<input name="pass" type="password" required></label><button class="btn gold big">Кіру</button>
        <p class="muted small">Кез келген сынып жетекшісі «Жаңа сынып тіркеу» арқылы өз аккаунтын ашып, сынып кодын алады. Оқушылар осы кодпен тіркеледі.</p></form>
      <form class="pane reg" hidden><label class="fld">Аты-жөніңіз<input name="name" required placeholder="Ахмедова Гулбону Қалбайқызы"></label><label class="fld">Мектеп<input name="school" required placeholder="№4 мектеп-лицей"></label><label class="fld">Сынып<input name="cls" required placeholder="10 «Б»"></label>
        <div class="grid2"><label class="fld">Логин<input name="login" required autocapitalize="off" pattern="[A-Za-z0-9_.]{3,20}" title="Латын әріптері мен сандар"></label><label class="fld">Құпиясөз<input name="pass" required minlength="6"></label></div><button class="btn gold big">Тіркелу</button></form>`;
      b.querySelectorAll('[data-tab]').forEach(t => t.onclick = () => { b.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === t)); b.querySelector('.reg').hidden = t.dataset.tab !== 'reg'; b.querySelector('.in').hidden = t.dataset.tab !== 'in'; });
      b.querySelector('.in').onsubmit = async e => { e.preventDefault(); const f = e.target, login = f.login.value.trim().toLowerCase(), pass = f.pass.value.trim(), btn = f.querySelector('button'); btn.disabled = true; btn.textContent = '⏳ Тексерілуде...';
        const rec = await Net.fetchOnce('@/t/' + Net.id(login), 3500); btn.disabled = false; btn.textContent = 'Кіру';
        let t = null; if (rec && rec.pass === pass) t = rec; else if (!rec && login === D.login && pass === D.pass) t = Object.assign({}, D);
        if (!t) { Sfx.bad(); return toast('Логин немесе құпиясөз қате'); }
        Modal.close(); enterTeacher({ login: t.login, name: t.name, school: t.school, cls: t.cls, code: t.code }); };
      b.querySelector('.reg').onsubmit = async e => { e.preventDefault(); const f = e.target, login = f.login.value.trim().toLowerCase(), btn = f.querySelector('button'); btn.disabled = true; btn.textContent = '⏳ ...';
        if (login === D.login || await Net.fetchOnce('@/t/' + Net.id(login), 3000)) { btn.disabled = false; btn.textContent = 'Тіркелу'; return toast('Бұл логин бос емес, басқасын таңдаңыз'); }
        let code; for (let i = 0; i < 5; i++) { code = translit(f.cls.value).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) + (1000 + Math.random() * 9000 | 0); if (!(await Net.fetchOnce('@/code/' + code, 1200))) break; }
        const t = { login, pass: f.pass.value.trim(), name: f.name.value.trim(), school: f.school.value.trim(), cls: f.cls.value.trim(), code, created: Date.now() };
        Net.put('@/t/' + Net.id(login), t); Net.put('@/code/' + code, { name: t.name, school: t.school, cls: t.cls, code });
        b.innerHTML = `<div class="cred"><h3>Сынып тіркелді!</h3><p>Осы деректерді сақтап қойыңыз.</p><div>Логин: <b>${esc(login)}</b></div><div>Құпиясөз: <b>${esc(t.pass)}</b></div><div>Сынып коды: <b>${esc(code)}</b></div><p class="small">Оқушыларға сілтеме: <code>${esc(location.href.split(/[?#]/)[0] + '?class=' + code)}</code></p><button class="btn gold big" id="tGo">Кабинетке кіру</button></div>`;
        b.querySelector('#tGo').onclick = () => { Modal.close(); enterTeacher({ login, name: t.name, school: t.school, cls: t.cls, code }); }; };
    } });
  }
  function enterTeacher(t) {
    $('#splash').classList.add('gone'); sessionStorage.setItem('sg_teacher', JSON.stringify(t)); if (user) logout();
    Net.setRoom(t.code); Net.connect({ subs: ['#'] }); Teacher.open(t);
  }

  /* ---------- қатысу ---------- */
  function presence(extra) {
    if (!user) return; Object.assign(pres, extra || {}); if (extra && extra.b === null) delete pres.b; lastMapPres = Date.now();
    Net.send('pres/' + myId, Object.assign({ id: myId, name: user.first + ' ' + (user.last || '').slice(0, 1) + '.', cls: user.cls, av: user.avatar, t: Date.now() }, pres));
  }
  function onlineCount() { const n = Net.livePresence().filter(p => p.id !== myId).length + (user ? 1 : 0); document.querySelectorAll('.online-n').forEach(e => e.textContent = n); }
  function applyCfg() { const c = Net.get('cfg') || {}, ann = $('#annBar'); if (c.ann) { ann.hidden = false; ann.querySelector('span').textContent = '📢 ' + c.ann; } else ann.hidden = true; renderShelf(); if (World.world && isClosed(World.world)) { World.exitToMap(); toast(TEXT.phrases.closed); } }
  function onMsg(path, v) {
    if (!user || !v || v._del) return; if (path !== 'msg/all' && path !== 'msg/' + myId) return;
    const seenKey = 'sg_seen_' + Net.room + path; if (+localStorage.getItem(seenKey) >= v._ts) return; if (Date.now() - v._ts > 3 * 864e5) return; localStorage.setItem(seenKey, v._ts);
    const w = v.go && (WORLDS.find(x => x.id === v.go) || HOLIDAYS.find(x => x.id === v.go));
    const box = document.createElement('div'); box.className = 'msg-pop';
    box.innerHTML = `<div class="mp-h">👩‍🏫 Мұғалімнен хабарлама</div>${v.text ? `<p>${esc(v.text)}</p>` : ''}${w ? `<button class="btn gold go">${w.icon} «${esc(w.name)}» әлеміне бару</button>` : ''}<button class="btn ghost ok">Түсіндім</button>`;
    document.body.appendChild(box); Sfx.chime();
    box.querySelector('.ok').onclick = () => box.remove(); if (w) box.querySelector('.go').onclick = () => { box.remove(); w.books ? World.enterValue(w) : World.enterHoliday(w); };
  }

  /* ---------- карта мен кітаптар ---------- */
  const isClosed = w => ((Net.get('cfg') || {}).closed || []).includes(w.id);
  function openWorldCard(w, at) {
    const v = TEXT.values.find(x => x.id === w.id), z = KZ.ZONES.find(q => q.w === w.id);
    Modal.open({ eyebrow: z.region + ' · ' + z.cities, title: w.icon + ' ' + w.name, cls: 'wide', body: b => {
      b.innerHTML = `<div class="wcard" style="--c:${w.color}"><p class="lead">${esc(v.text)}</p><p class="motto">«${esc(w.motto)}»</p><div class="subj">${w.subjects.map((s, i) => `<span>${w.labs[i].icon} ${esc(s)}</span>`).join('')}</div>
        <h3 class="sub">Кітаптар</h3><div class="mini-books">${w.books.map(bk => `<button data-b="${bk.id}">📖 <b>${esc(bk.title)}</b><i>${esc(bk.author)}</i></button>`).join('')}</div>
        ${user ? `<div class="bar big"><i style="width:${Progress.worldPct(w)}%;background:${w.color}"></i></div><p class="small muted">Орындалды: ${Progress.worldPct(w)}%</p>` : ''}
        <div class="row"><button class="btn gold big" id="cBook">📕 3D кітапты ашу</button><button class="btn ghost" id="cGo">🐆 Осы өңірде саяхат</button><button class="btn ghost" id="cWorld">🌀 Пәндік әлем</button></div></div>`;
      const need = f => () => { if (isClosed(w)) { toast('🔒 ' + TEXT.phrases.closed); return; } if (!user) return auth(f); f(); };
      b.querySelector('#cBook').onclick = need(() => Book.open(Books.world(w)));
      b.querySelector('#cGo').onclick = need(() => { Modal.close(); const [lon, lat] = KZ.PORTALS[w.id], [x, zz] = KZ.toXZ(lon, lat); World.travel('leopard', at && at.x != null ? at : { x, z: zz + 10, ry: Math.PI }); });
      b.querySelector('#cWorld').onclick = need(() => { Modal.close(); World.enterValue(w); });
      b.querySelectorAll('[data-b]').forEach(x => x.onclick = need(() => Book.open(Books.world(w), 'lit:' + x.dataset.b)));
      Voice.say([w.name, v.text]);
    } });
  }

  /* ---------- бөлімдер ---------- */
  function renderSections() {
    const I = TEXT.idea, A = TEXT.author;
    $('#heroLead').textContent = I.lead;
    $('#legend').innerHTML = WORLDS.map((w, i) => `<button style="--c:${w.color}" data-i="${i}"><span>${w.icon}</span>${w.name}</button>`).join('') + `<p class="lg-h">🎉 Мерекелер</p>` + HOLIDAYS.map(h => `<button style="--c:${h.color}" data-h="${h.id}"><span>${h.icon}</span>${h.name}</button>`).join('');
    $('#legend').querySelectorAll('[data-i]').forEach(b => b.onclick = () => { World.focusZone(+b.dataset.i); openWorldCard(WORLDS[+b.dataset.i]); });
    $('#legend').querySelectorAll('[data-h]').forEach(b => b.onclick = () => { const h = HOLIDAYS.find(x => x.id === b.dataset.h); if (!user) return auth(() => Book.open(Books.holiday(h))); Book.open(Books.holiday(h)); });
    renderShelf();
    $('#museumGrid').innerHTML = WORLDS.map(w => w.museum.map(m => `<button class="exhibit" style="--c:${w.color}" data-hall="${w.id}">${window.photo(m.photo) ? `<img class="ex-ph" src="${window.photo(m.photo).src}" alt="" loading="lazy">` : ''}<div class="ex-emoji">${m.emoji}</div><h4>${esc(m.title)}</h4><p>${esc(m.text)}</p><span class="tag">${w.icon} ${w.short}</span></button>`).join('')).join('');
    $('#museumGrid').querySelectorAll('[data-hall]').forEach(b => b.onclick = () => { const go = () => World.enterMuseum(b.dataset.hall); user ? go() : auth(go); });
    $('#museumGo').onclick = () => { const go = () => World.enterMuseum('center'); user ? go() : auth(go); };
    $('#adalText').innerHTML = TEXT.adal.map(p => `<p>${esc(p)}</p>`).join('');
    $('#adalSay').onclick = e => Voice.say(TEXT.adal, { btn: e.currentTarget, force: true });
    $('#valuesGrid').innerHTML = WORLDS.map(w => { const z = KZ.ZONES.find(q => q.w === w.id); return `<article class="value" style="--c:${w.color}"><div class="vi">${w.icon}</div><h3>${w.name}</h3><p>${esc(TEXT.values.find(v => v.id === w.id).text)}</p><p class="vs">📚 ${w.subjects.join(' · ')}</p><p class="vs">📍 ${z.region}: ${z.cities}</p></article>`; }).join('');
    $('#ideaBox').innerHTML = `
      <div class="title-page"><p class="eyebrow">Педагогикалық идеялар фестивалі · облыстық кезең · 2026</p><h3>«${esc(I.title)}»</h3><p class="st">${esc(I.subtitle)}</p>
        <dl><dt>Автор</dt><dd>${esc(A.name)}</dd><dt>Бағыты</dt><dd>${esc(I.direction)}</dd><dt>Қызметі</dt><dd>${esc(A.role)}</dd><dt>Білім беру ұйымы</dt><dd>${esc(A.school)}, ${esc(A.region)}</dd><dt>Форматы</dt><dd>${esc(I.format)}</dd></dl></div>
      ${I.sections.map((s, i) => `<article class="isec"><span class="inum">${String(i + 1).padStart(2, '0')}</span><div><h3>${esc(s.h)}</h3>${(s.p || []).map(p => `<p>${esc(p)}</p>`).join('')}${s.list ? `<ul>${s.list.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}</div></article>`).join('')}
      <article class="isec"><span class="inum">🗺️</span><div><h3>Қазақстан картасы: 6 өңір – 6 құндылық – 12 пән</h3><div class="map-table">${WORLDS.map(w => { const z = KZ.ZONES.find(q => q.w === w.id); return `<div style="--c:${w.color}"><b>${w.icon} ${w.name}</b><span>📍 ${z.region} (${z.cities})</span><span>📚 ${w.subjects.join(' · ')}</span><i>${w.quests.map(q => q.title).join(', ')}</i></div>`; }).join('')}</div><p class="muted small">Сонымен қатар 5 мереке порталы: ${HOLIDAYS.map(h => h.icon + ' ' + h.name).join(', ')}.</p></div></article>
      <article class="isec"><span class="inum">🎤</span><div><h3>TEDx баяндамасының жоспары · 7 минут</h3><ol class="ted">${I.ted.map(t => `<li><time>${t.t}</time><b>${esc(t.h)}</b><span>${esc(t.p)}</span></li>`).join('')}</ol></div></article>
      <article class="isec"><span class="inum">✓</span><div><h3>Бағалау өлшемшарттарына сәйкестігі</h3><div class="crit">${I.criteria.map(c => `<div><b>${esc(c.h)}</b><p>${esc(c.p)}</p></div>`).join('')}</div></div></article>
      <article class="isec"><span class="inum">Aa</span><div><h3>Аннотация</h3><div class="annot"><div><p class="eyebrow">Қазақ тілінде</p><p>${esc(I.annotation_kk)}</p></div><div><p class="eyebrow">На русском языке</p><p>${esc(I.annotation_ru)}</p></div></div></div></article>`;
    $('#ideaSay').onclick = e => Voice.say([I.lead, ...I.sections.flatMap(s => s.p || [])], { btn: e.currentTarget, force: true });
    $('#authorBox').innerHTML = `<div class="author-photo"><img src="assets/img/author.jpg" alt="${esc(A.name)}"></div><div class="author-info"><p class="eyebrow">Идея авторы</p><h3>${esc(A.name)}</h3><p class="role">${esc(A.role)}</p><p class="school">🏫 ${esc(A.school)} · ${esc(A.region)}</p><p>${esc(A.about)}</p><p class="quote">«Сабақ аяқталған соң тәрбие тоқтамайды – ол жаңа әлемде жалғасады.»</p><button class="say" id="authorSay">🔊 Тыңдау</button></div>`;
    const fc = $('#photoCredits'); if (fc && window.PHOTOS) fc.innerHTML = '📷 Фотолар: Wikimedia Commons — ' + Object.values(PHOTOS).map(p => esc(p.credit) + ' (' + esc(p.license) + ')').filter((v, i, a) => a.indexOf(v) === i).join(', ') + '.';
    $('#authorSay').onclick = e => Voice.say(A.about, { btn: e.currentTarget, force: true });
  }
  function renderShelf() {
    const g = $('#shelf'); if (!g) return;
    const card = (d, sub, closed, pct) => `<article class="shelf-book ${closed ? 'closed' : ''}" style="--c:${d.color}"><div class="cover"><span>${d.icon}</span><b>${esc(d.name)}</b><i>${esc(sub)}</i></div>${pct != null ? `<div class="bar"><i style="width:${pct}%"></i></div>` : ''}<button class="btn gold" data-open="${d.id}">${closed ? '🔒 Жабық' : '📖 Кітапты ашу'}</button></article>`;
    g.innerHTML = `<h3 class="shelf-h">📚 Құндылықтар кітаптары</h3><div class="shelf-row">${WORLDS.map(w => card(w, w.subjects.join(' · '), isClosed(w), user ? Progress.worldPct(w) : null)).join('')}</div><h3 class="shelf-h">🎉 Мереке кітаптары</h3><div class="shelf-row">${HOLIDAYS.map(h => card(h, h.date, false, null)).join('')}</div>`;
    g.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { const id = b.dataset.open, w = WORLDS.find(x => x.id === id), h = HOLIDAYS.find(x => x.id === id); if (w && isClosed(w)) return toast('🔒 ' + TEXT.phrases.closed); const go = () => Book.open(w ? Books.world(w) : Books.holiday(h)); user ? go() : auth(go); });
  }
  function updateUserChip() {
    const c = $('#userChip'); if (!c) return;
    c.innerHTML = user ? `<span class="av" style="--c:${user.avatar.c}">${Avatars.icon(user.avatar.t)}</span><span class="un">${esc(user.first)}</span>` : '👤 <span class="un">Кіру</span>';
    $('#mapUser').innerHTML = user ? `<span class="av" style="--c:${user.avatar.c}">${Avatars.icon(user.avatar.t)}</span><div><b>${esc(user.first)} ${esc(user.last)}</b><i>${esc(user.cls)} · логин: ${esc(user.login)}</i></div>` : `<button class="btn gold" onclick="App.auth()">✨ Тіркелу / Кіру</button>`;
    updateBadges();
  }
  function updateBadges() { const s = Progress.rec ? Progress.rec.score : 0; document.querySelectorAll('.score-n').forEach(e => e.textContent = s); }
  function toast(t, ms) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; $('#toasts').appendChild(d); setTimeout(() => d.classList.add('out'), ms || 2600); setTimeout(() => d.remove(), (ms || 2600) + 500); }
  function celebrate(big) { const box = $('#confetti'); for (let i = 0; i < (big ? 120 : 50); i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = ['#f4c95d', '#e8505b', '#3fa7f5', '#4cc38a', '#a66cf5'][i % 5]; s.style.animationDelay = Math.random() * .6 + 's'; s.style.animationDuration = 1.8 + Math.random() * 1.6 + 's'; box.appendChild(s); setTimeout(() => s.remove(), 4000); } }
  const where = () => Book.current || (World.world ? World.world.id : World.kind === 'museum' ? 'museum' : World.mode === 'overview' ? 'map' : 'kz');

  document.addEventListener('DOMContentLoaded', boot);
  return { user: () => user, myId: () => myId, where, presence, toast, celebrate, updateBadges, openWorldCard, auth, createAccount, genPass, isClosed };
})();
