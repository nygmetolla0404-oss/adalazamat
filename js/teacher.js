/* Мұғалім кабинеті: тірі сынып бөлмесі, оқушылар, жауаптар, статистика, баптаулар */
window.Teacher = (function () {
  const T = THREE;
  let el, tab = 'room', filter = { cls: '', q: '' }, renderT = 0, offs = [], me = null;
  const ALL = () => [...WORLDS, ...HOLIDAYS], byId = id => ALL().find(x => x.id === id);
  const link = () => location.href.split(/[?#]/)[0] + '?class=' + (me ? me.code : '');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = s => { s = s || 0; const hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60); return hh ? `${hh} сағ ${mm} мин` : `${mm} мин`; };
  const ago = ts => { if (!ts) return '—'; const d = (Date.now() - ts) / 1000; if (d < 60) return 'жаңа ғана'; if (d < 3600) return Math.floor(d / 60) + ' мин бұрын'; if (d < 86400) return Math.floor(d / 3600) + ' сағ бұрын'; return new Date(ts).toLocaleDateString('kk-KZ'); };
  const where = (w, p) => { if (p && p.b) { const x = byId(p.b); return '📖 ' + (x ? x.icon + ' ' + (x.short || x.name) : 'кітап'); } if (!w) return '—'; if (w === 'museum') return '🏛️ Мұражайда'; if (w === 'map') return '🗺️ Картаға шолу'; if (w === 'kz') { if (p && p.x != null && window.KZ) { const z = KZ.ZONES[KZ.zoneAt(p.x, p.z).i]; return '🐆 ' + z.region; } return '🐆 Қазақстан картасы'; } const x = byId(w); return x ? '🌀 ' + x.icon + ' ' + (x.short || x.name) : w; };

  function data() {
    const acc = Net.all('acct/'), prog = Net.all('prog/'), ctl = Net.all('ctl/'), live = {};
    Net.livePresence().forEach(p => live[p.id] = p);
    return Object.keys(acc).map(id => ({ id, a: acc[id], p: prog[id] || {}, c: ctl[id] || {}, live: live[id] || null }))
      .sort((x, y) => (!!y.live - !!x.live) || (x.a.last || '').localeCompare(y.a.last || '', 'kk'));
  }
  function cfg() { return Net.get('cfg') || {}; }

  function open(t) {
    me = t; el = document.getElementById('teacher'); el.classList.add('open'); document.body.classList.add('in-teacher');
    Net.subscribe(['#']);
    el.innerHTML = `<header class="t-head"><div><p class="eyebrow">SMART GUIDE · АДАЛ АЗАМАТ</p><h2>👩‍🏫 Мұғалім кабинеті</h2><p class="t-me">${esc(t.name)} · ${esc(t.cls)} · сынып коды: <b>${esc(t.code)}</b></p></div>
      <nav class="t-tabs">${[['room', '🏫 Сынып бөлмесі'], ['list', '👥 Оқушылар'], ['answers', '📝 Жауаптар'], ['stats', '📊 Статистика'], ['settings', '⚙️ Баптаулар']].map(([k, n]) => `<button data-t="${k}">${n}</button>`).join('')}</nav>
      <div class="t-actions"><span class="net-dot" id="tNet"></span><button class="btn ghost" id="tClose">✕ Шығу</button></div></header><div class="t-body" id="tBody"></div>`;
    el.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; render(); });
    el.querySelector('#tClose').onclick = close;
    offs.push(Net.on('', () => { clearTimeout(renderT); renderT = setTimeout(() => render(true), 700); }));
    Voice.say(TEXT.phrases.teacher);
    render(); setNet();
    open.iv = setInterval(() => render(true), 5000);
  }
  function setNet() { const d = document.getElementById('tNet'); if (d) { d.className = 'net-dot ' + (Net.online ? 'on' : ''); d.textContent = Net.online ? 'Желіде' : 'Офлайн'; } }
  function close() { Room.stop(); sessionStorage.removeItem('sg_teacher'); location.href = location.href.split('#')[0]; }

  function render(soft) {
    if (!el || !el.classList.contains('open')) return; setNet();
    el.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
    const body = document.getElementById('tBody'), rows = data();
    if (soft && (tab === 'answers' || tab === 'settings' || document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && body.contains(document.activeElement))) { if (tab === 'room') Room.update(rows); return; }
    if (tab === 'room') {
      if (!soft || !body.querySelector('#classBox')) { body.innerHTML = `<div class="room-wrap"><div id="classBox"><canvas id="classCanvas"></canvas><div class="room-hint">Тінтуірмен айналдыр · оқушыны бас</div></div><aside class="room-side"><h3>🟢 Қазір онлайн</h3><div id="onlineList"></div><h3>⚪ Офлайн</h3><div id="offList"></div></aside></div>`; Room.start(document.getElementById('classCanvas'), rows); }
      else Room.update(rows);
      const on = rows.filter(r => r.live), off = rows.filter(r => !r.live);
      document.getElementById('onlineList').innerHTML = on.map(r => `<button class="srow on" data-id="${r.id}"><span class="av" style="--c:${r.a.avatar.c}">${Avatars.icon(r.a.avatar.t)}</span><span><b>${esc(r.a.first)} ${esc(r.a.last)}</b><i>${where(r.live.w, r.live)} · ${fmt(r.p.sec)}</i></span></button>`).join('') || '<p class="muted">Әзірге ешкім жоқ</p>';
      document.getElementById('offList').innerHTML = off.map(r => `<button class="srow" data-id="${r.id}"><span class="av off">${Avatars.icon(r.a.avatar.t)}</span><span><b>${esc(r.a.first)} ${esc(r.a.last)}</b><i>${ago(r.p.last)}</i></span></button>`).join('') || '<p class="muted">—</p>';
      body.querySelectorAll('.srow').forEach(b => b.onclick = () => detail(b.dataset.id));
    } else if (tab === 'list') listTab(body, rows);
    else if (tab === 'answers') answersTab(body, rows);
    else if (tab === 'stats') statsTab(body, rows);
    else settingsTab(body);
  }

  function listTab(body, rows) {
    const classes = [...new Set(rows.map(r => r.a.cls))].sort();
    const f = rows.filter(r => (!filter.cls || r.a.cls === filter.cls) && (!filter.q || (r.a.first + ' ' + r.a.last + ' ' + r.a.login).toLowerCase().includes(filter.q.toLowerCase())));
    body.innerHTML = `<div class="t-tools"><input id="tq" placeholder="🔎 Іздеу: аты, логин" value="${esc(filter.q)}"><select id="tc"><option value="">Барлық сыныптар</option>${classes.map(c => `<option ${c === filter.cls ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
      <button class="btn gold" id="tAdd">＋ Оқушы қосу</button><button class="btn ghost" id="tCsv">⬇️ Excel (CSV)</button><button class="btn ghost" id="tMsgAll">✉️ Барлығына хабарлама</button></div>
      <div class="t-table-wrap"><table class="t-table"><thead><tr><th></th><th>Аты-жөні</th><th>Сынып</th><th>Логин</th><th>Құпиясөз</th><th>Күйі</th><th>Жалпы уақыт</th><th>Оқу уақыты</th><th>Ұпай</th><th>Тапсырма</th><th>Соңғы кіру</th><th>Әрекет</th></tr></thead><tbody>
      ${f.map(r => `<tr class="${r.c.blocked ? 'blocked' : ''}"><td><span class="av ${r.live ? '' : 'off'}" style="--c:${r.a.avatar.c}">${Avatars.icon(r.a.avatar.t)}</span></td><td><b>${esc(r.a.first)} ${esc(r.a.last)}</b></td><td>${esc(r.a.cls)}</td><td><code>${esc(r.a.login)}</code></td><td><code class="pw" data-pw="${esc(r.a.pass)}">••••••</code></td>
      <td>${r.c.blocked ? '🔒 Жабық' : r.live ? `<span class="live">● ${where(r.live.w, r.live)}</span>` : '⚪ Офлайн'}</td><td>${fmt(r.p.sec)}</td><td>${fmt(r.p.readSec)}</td><td><b>${r.p.score || 0}</b></td><td>${Object.keys(r.p.done || {}).length}</td><td>${ago(r.p.last)}</td>
      <td class="acts"><button title="Толық" data-a="view" data-id="${r.id}">👁</button><button title="Хабарлама / бағыттау" data-a="msg" data-id="${r.id}">✉️</button><button title="${r.c.blocked ? 'Ашу' : 'Жабу'}" data-a="block" data-id="${r.id}">${r.c.blocked ? '🔓' : '🔒'}</button><button title="Құпиясөзді өзгерту" data-a="pass" data-id="${r.id}">🔑</button><button title="Өшіру" data-a="del" data-id="${r.id}">🗑</button></td></tr>`).join('') || '<tr><td colspan="12" class="muted center">Оқушылар әлі тіркелмеген. Сілтемені оқушыларға жіберіңіз немесе «Оқушы қосу» батырмасын басыңыз.</td></tr>'}
      </tbody></table></div><p class="muted small">Құпиясөзді көру үшін нүктелерді басыңыз. Оқушы аккаунты жабылса, ол бірден әлемнен шығарылады.</p>`;
    body.querySelector('#tq').oninput = e => { filter.q = e.target.value; clearTimeout(listTab.t); listTab.t = setTimeout(() => { render(); const q = document.getElementById('tq'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 300); };
    body.querySelector('#tc').onchange = e => { filter.cls = e.target.value; render(); };
    body.querySelectorAll('.pw').forEach(c => c.onclick = () => c.textContent = c.textContent === c.dataset.pw ? '••••••' : c.dataset.pw);
    body.querySelector('#tAdd').onclick = addStudent; body.querySelector('#tCsv').onclick = () => csv(rows); body.querySelector('#tMsgAll').onclick = () => message(null);
    body.querySelectorAll('[data-a]').forEach(b => b.onclick = () => action(b.dataset.a, b.dataset.id));
  }
  function action(a, id) {
    const r = data().find(x => x.id === id); if (!r) return;
    if (a === 'view') detail(id);
    if (a === 'msg') message(r);
    if (a === 'block') { Net.put('ctl/' + id, { blocked: !r.c.blocked }); App.toast(r.c.blocked ? '🔓 Аккаунт ашылды' : '🔒 Аккаунт жабылды'); render(); }
    if (a === 'pass') { const p = prompt(`${r.a.first} ${r.a.last} үшін жаңа құпиясөз:`, App.genPass()); if (p && p.trim().length >= 4) { Net.put('acct/' + id, Object.assign({}, r.a, { pass: p.trim() })); App.toast('🔑 Құпиясөз өзгертілді: ' + p.trim()); render(); } }
    if (a === 'del') { if (confirm(`${r.a.first} ${r.a.last} оқушысын және оның барлық нәтижесін өшіру керек пе? Бұл әрекетті қайтару мүмкін емес.`)) { Net.del('acct/' + id); Net.del('prog/' + id); Net.put('ctl/' + id, { deleted: true }); App.toast('🗑 Оқушы өшірілді'); render(); } }
  }
  function message(r) {
    Modal.open({ eyebrow: 'Хабарлама', title: r ? `✉️ ${r.a.first} ${r.a.last}` : '✉️ Барлық оқушыға', body: b => {
      b.innerHTML = `<label class="fld">Хабарлама мәтіні<textarea rows="4" id="mText" placeholder="Мысалы: Бүгін Еңбекқорлық әлеміндегі квестті орындаңдар!"></textarea></label>
        <label class="fld">Кітапқа бағыттау (міндетті емес)<select id="mGo"><option value="">— бағыттамау —</option>${ALL().map(w => `<option value="${w.id}">${w.icon} ${w.name} кітабы</option>`).join('')}</select></label><button class="btn gold" id="mSend">Жіберу</button>`;
      b.querySelector('#mSend').onclick = () => { const text = b.querySelector('#mText').value.trim(), go = b.querySelector('#mGo').value; if (!text && !go) return; Net.put(r ? 'msg/' + r.id : 'msg/all', { text, go, from: 'Мұғалім' }); App.toast('📨 Жіберілді'); Modal.close(); };
    } });
  }
  function addStudent() {
    Modal.open({ eyebrow: 'Жаңа оқушы', title: '＋ Оқушы қосу', body: b => {
      b.innerHTML = `<div class="grid2"><label class="fld">Аты<input id="aF"></label><label class="fld">Тегі<input id="aL"></label><label class="fld">Сыныбы<input id="aC" placeholder="10 «Б»"></label><label class="fld">Құпиясөз<input id="aP" value="${App.genPass()}"></label></div><button class="btn gold" id="aGo">Қосу</button><p class="muted small">Логин автоматты түрде жасалады. Оны оқушыға беріңіз.</p>`;
      b.querySelector('#aGo').onclick = async () => { const f = b.querySelector('#aF').value.trim(), l = b.querySelector('#aL').value.trim(), c = b.querySelector('#aC').value.trim(), p = b.querySelector('#aP').value.trim(); if (!f || !l || !c || p.length < 4) return App.toast('Барлық өрісті толтырыңыз');
        const acct = await App.createAccount({ first: f, last: l, cls: c, pass: p, avatar: { t: Avatars.TYPES[Math.random() * 6 | 0].id, c: Avatars.COLORS[Math.random() * 8 | 0] } });
        b.innerHTML = `<div class="cred"><p>Оқушы қосылды!</p><div>Логин: <b>${esc(acct.login)}</b></div><div>Құпиясөз: <b>${esc(acct.pass)}</b></div></div>`; render(); };
    } });
  }
  function detail(id) {
    const r = data().find(x => x.id === id); if (!r) return; const p = r.p, maxW = Math.max(60, ...WORLDS.map(w => (p.worlds || {})[w.id] || 0));
    Modal.open({ eyebrow: `${r.a.cls} · логин: ${r.a.login}`, title: `${Avatars.icon(r.a.avatar.t)} ${r.a.first} ${r.a.last}`, cls: 'wide', body: b => {
      b.innerHTML = `<div class="kpis"><div><b>${p.score || 0}</b><span>ұпай</span></div><div><b>${fmt(p.sec)}</b><span>жалпы уақыт</span></div><div><b>${fmt(p.readSec)}</b><span>кітап оқу</span></div><div><b>${Object.keys(p.done || {}).length}</b><span>орындалған</span></div><div><b>${p.visits || 0}</b><span>кіру саны</span></div><div><b>${r.live ? where(r.live.w, r.live) : ago(p.last)}</b><span>${r.live ? 'қазір' : 'соңғы кіру'}</span></div></div>
        <h3 class="sub">Әлемдерде болған уақыты</h3><div class="bars">${WORLDS.map(w => { const s = (p.worlds || {})[w.id] || 0; return `<div class="bar-row"><span>${w.icon} ${w.short}</span><div class="bar"><i style="width:${s / maxW * 100}%;background:${w.color}"></i></div><b>${fmt(s)}</b><em>${pct(r, w)}%</em></div>`; }).join('')}<div class="bar-row"><span>🗺️ Карта</span><div class="bar"><i style="width:${((p.worlds || {}).map || 0) / maxW * 100}%"></i></div><b>${fmt((p.worlds || {}).map)}</b><em></em></div></div>
        <h3 class="sub">Оқыған кітаптары</h3><div class="chips">${Object.keys(p.books || {}).map(bid => { const bk = WORLDS.flatMap(w => w.books).find(x => x.id === bid) || byId(bid); return bk ? `<span class="chip">📖 ${esc(bk.title || bk.name)} · ${fmt(p.books[bid])}</span>` : ''; }).join('') || '<span class="muted">Әлі жоқ</span>'}</div>
        <h3 class="sub">Орындалған тапсырмалар</h3><ul class="done-list">${Object.entries(p.done || {}).sort((a, b) => b[1].ts - a[1].ts).map(([k, d]) => `<li><b>+${d.p}</b> ${esc(d.t)} <i>${ago(d.ts)}</i>${d.a ? `<blockquote>${esc(d.a)}</blockquote>` : ''}</li>`).join('') || '<li class="muted">Әлі жоқ</li>'}</ul>`;
    } });
  }
  const pct = (r, w) => { const k = Progress.worldKeys(w); return Math.round(k.filter(x => (r.p.done || {})[x]).length / k.length * 100); };
  function answersTab(body, rows) {
    const items = []; rows.forEach(r => Object.entries(r.p.done || {}).forEach(([k, d]) => { if (d.a && /write|speak|case|think/.test(k)) items.push({ r, k, d }); }));
    items.sort((a, b) => b.d.ts - a.d.ts);
    body.innerHTML = `<div class="answers">${items.map(({ r, k, d }) => { const w = byId(k.split(':')[0]); return `<article class="ans"><header><span class="av" style="--c:${r.a.avatar.c}">${Avatars.icon(r.a.avatar.t)}</span><b>${esc(r.a.first)} ${esc(r.a.last)}</b><i>${esc(r.a.cls)}</i><span class="tag">${w ? w.icon + ' ' + (w.short || w.name) : ''} · ${/write/.test(k) ? '✍️ Жазылым' : /speak/.test(k) ? '🎙️ Айтылым' : /think/.test(k) ? '💭 Ой-пікір' : '💬 Жағдаят'}</span><time>${ago(d.ts)}</time></header><p>${esc(d.a)}</p></article>`; }).join('') || '<p class="muted center">Жазылым мен айтылым жұмыстары осы жерде пайда болады.</p>'}</div>`;
  }
  function statsTab(body, rows) {
    const tot = {}; WORLDS.forEach(w => tot[w.id] = 0); let all = 0, read = 0;
    rows.forEach(r => { WORLDS.forEach(w => tot[w.id] += (r.p.worlds || {})[w.id] || 0); all += r.p.sec || 0; read += r.p.readSec || 0; });
    const mx = Math.max(60, ...Object.values(tot)), top = rows.slice().sort((a, b) => (b.p.score || 0) - (a.p.score || 0)).slice(0, 10);
    body.innerHTML = `<div class="kpis"><div><b>${rows.length}</b><span>оқушы</span></div><div><b>${rows.filter(r => r.live).length}</b><span>қазір онлайн</span></div><div><b>${fmt(all)}</b><span>жалпы уақыт</span></div><div><b>${fmt(read)}</b><span>кітап оқу</span></div><div><b>${rows.length ? Math.round(rows.reduce((s, r) => s + (r.p.score || 0), 0) / rows.length) : 0}</b><span>орташа ұпай</span></div></div>
      <div class="stats-grid"><section><h3 class="sub">Әлемдер бойынша жалпы уақыт</h3><div class="bars">${WORLDS.map(w => `<div class="bar-row"><span>${w.icon} ${w.short}</span><div class="bar"><i style="width:${tot[w.id] / mx * 100}%;background:${w.color}"></i></div><b>${fmt(tot[w.id])}</b></div>`).join('')}</div></section>
      <section><h3 class="sub">🏆 Үздік оқушылар</h3><ol class="top">${top.map(r => `<li><span class="av" style="--c:${r.a.avatar.c}">${Avatars.icon(r.a.avatar.t)}</span>${esc(r.a.first)} ${esc(r.a.last)} <b>${r.p.score || 0}</b></li>`).join('') || '<li class="muted">—</li>'}</ol></section></div>`;
  }
  function settingsTab(body) {
    const c = cfg(), closed = c.closed || [];
    body.innerHTML = `<div class="settings"><section><h3 class="sub">🌍 Құндылық кітаптары мен әлемдерін ашу / жабу</h3><p class="muted small">Жабық кітап пен әлемге оқушылар кіре алмайды. Мысалы, айдың құндылығына сай тек бір әлемді ашық қалдыруға болады.</p>${WORLDS.map(w => `<label class="switch"><input type="checkbox" data-w="${w.id}" ${closed.includes(w.id) ? '' : 'checked'}><span></span>${w.icon} ${w.name}</label>`).join('')}</section>
      <section><h3 class="sub">📢 Хабарландыру (барлық оқушының экранында)</h3><textarea id="sAnn" rows="3" placeholder="Мысалы: Бүгінгі тәрбие сағатының тақырыбы – Заң және тәртіп">${esc(c.ann || '')}</textarea><button class="btn gold" id="sAnnGo">Сақтау</button></section>
      <section><h3 class="sub">🔗 Сынып коды және оқушыларға сілтеме</h3><p class="big-code">${esc(me.code)}</p><input readonly value="${esc(link())}" onclick="this.select()"><p class="muted small">Оқушылар осы сілтеме арқылы кіреді немесе тіркелгенде сынып кодын жазады. Байланыс: ${Net.online ? '🟢 тірі әлем серверіне қосылған' : '🟠 офлайн режим (деректер осы құрылғыда)'}.</p></section>
      <section><h3 class="sub">🔐 Құпиясөзді өзгерту</h3><p class="muted small">Логин: <b>${esc(me.login)}</b></p><input id="sPass" placeholder="Жаңа құпиясөз (кемінде 6 таңба)"><button class="btn gold" id="sPassGo">Өзгерту</button></section></div>`;
    body.querySelectorAll('[data-w]').forEach(i => i.onchange = () => { const cl = [...body.querySelectorAll('[data-w]')].filter(x => !x.checked).map(x => x.dataset.w); Net.put('cfg', Object.assign({}, cfg(), { closed: cl })); App.toast('Сақталды'); });
    body.querySelector('#sAnnGo').onclick = () => { Net.put('cfg', Object.assign({}, cfg(), { ann: body.querySelector('#sAnn').value.trim() })); App.toast('📢 Хабарландыру жарияланды'); };
    body.querySelector('#sPassGo').onclick = async () => { const v = body.querySelector('#sPass').value.trim(); if (v.length < 6) return App.toast('Кемінде 6 таңба'); const cur = (await Net.fetchOnce('@/t/' + Net.id(me.login), 2500)) || Object.assign({}, CONFIG.DEMO_TEACHER); Net.put('@/t/' + Net.id(me.login), Object.assign({}, cur, { login: me.login, pass: v, name: me.name, school: me.school, cls: me.cls, code: me.code })); Net.put('@/code/' + me.code, { name: me.name, school: me.school, cls: me.cls, code: me.code }); App.toast('🔐 Құпиясөз өзгертілді'); body.querySelector('#sPass').value = ''; };
  }
  function csv(rows) {
    const head = ['Аты', 'Тегі', 'Сынып', 'Логин', 'Құпиясөз', 'Жалпы уақыт (мин)', 'Оқу уақыты (мин)', 'Ұпай', 'Орындалған', ...WORLDS.map(w => w.short + ' (мин)'), 'Соңғы кіру'];
    const lines = [head, ...rows.map(r => [r.a.first, r.a.last, r.a.cls, r.a.login, r.a.pass, Math.round((r.p.sec || 0) / 60), Math.round((r.p.readSec || 0) / 60), r.p.score || 0, Object.keys(r.p.done || {}).length, ...WORLDS.map(w => Math.round(((r.p.worlds || {})[w.id] || 0) / 60)), r.p.last ? new Date(r.p.last).toLocaleString('kk-KZ') : ''])];
    const s = '﻿' + lines.map(l => l.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(';')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([s], { type: 'text/csv;charset=utf-8' })); a.download = 'smart-guide-oqushylar.csv'; a.click();
  }

  /* ---- 3D сынып бөлмесі ---- */
  const Room = (function () {
    let renderer, scene, camera, raf = 0, seats = {}, ray = new T.Raycaster(), yaw = .3, tYaw = .3, clock = new T.Clock(), canvas;
    function start(cv, rows) {
      stop(); canvas = cv; renderer = new T.WebGLRenderer({ canvas: cv, antialias: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio));
      scene = new T.Scene(); scene.background = new T.Color('#1d2a24'); scene.fog = new T.Fog('#1d2a24', 25, 60);
      camera = new T.PerspectiveCamera(50, 1, .1, 200);
      scene.add(new T.HemisphereLight('#ffe6c0', '#2a1a10', .55));
      const lamp = new T.PointLight('#ffcf8a', 1.1, 40); lamp.position.set(0, 7, 0); scene.add(lamp);
      const floor = new T.Mesh(new T.PlaneGeometry(40, 30), new T.MeshStandardMaterial({ color: '#7a4a2a', roughness: .8 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
      for (let i = 0; i < 14; i++) { const pl = new T.Mesh(new T.BoxGeometry(40, .01, .05), new T.MeshBasicMaterial({ color: '#5e361d' })); pl.position.set(0, .01, -14 + i * 2.1); scene.add(pl); }
      const wallM = new T.MeshStandardMaterial({ color: '#2f4a3c', roughness: .9 });
      [[0, 4, -15, 0], [-20, 4, 0, Math.PI / 2], [20, 4, 0, -Math.PI / 2]].forEach(([x, y, z, r]) => { const w = new T.Mesh(new T.PlaneGeometry(40, 8), wallM); w.position.set(x, y, z); w.rotation.y = r; scene.add(w); });
      for (let i = 0; i < 6; i++) { const sh = new T.Mesh(new T.BoxGeometry(3, 4, .8), new T.MeshStandardMaterial({ color: '#5a3520' })); sh.position.set(-15 + i * 6, 2, -14.5); scene.add(sh); for (let k = 0; k < 3; k++) for (let j = 0; j < 7; j++) { const bk = new T.Mesh(new T.BoxGeometry(.3, .8, .5), new T.MeshStandardMaterial({ color: ['#c1462f', '#2f5fb3', '#e0a92b', '#4c9a5a'][(i + j + k) % 4] })); bk.position.set(-16.1 + i * 6 + j * .36, .9 + k * 1.25, -14.2); scene.add(bk); } }
      // шырақ жіптері
      for (let s = 0; s < 3; s++) for (let i = 0; i <= 24; i++) { const x = -18 + i * 1.5, b = new T.Mesh(new T.SphereGeometry(.12, 8, 6), new T.MeshBasicMaterial({ color: '#ffe3a0' })); b.position.set(x, 6.4 - Math.sin(i / 24 * Math.PI) * .9 - s * .1, -8 + s * 7); scene.add(b); }
      // шаңырақ тәрізді шам
      const sh = new T.Mesh(new T.TorusGeometry(1.4, .12, 8, 24), new T.MeshStandardMaterial({ color: '#a8742e' })); sh.rotation.x = Math.PI / 2; sh.position.y = 6.8; scene.add(sh);
      // үстелдер
      const tableM = new T.MeshStandardMaterial({ color: '#8a5a33', roughness: .6 });
      [-5, 5].forEach(x => { const tb = new T.Mesh(new T.BoxGeometry(3, .25, 22), tableM); tb.position.set(x, 1.5, 0); scene.add(tb); [-10, 0, 10].forEach(z => { const lg = new T.Mesh(new T.BoxGeometry(.25, 1.5, .25), tableM); lg.position.set(x, .75, z); scene.add(lg); });
        for (let z = -9; z <= 9; z += 4.5) { const l = new T.Mesh(new T.CylinderGeometry(.05, .1, .7, 6), new T.MeshStandardMaterial({ color: '#d9c48a' })); l.position.set(x, 1.95, z); const sh2 = new T.Mesh(new T.ConeGeometry(.45, .35, 12, 1, true), new T.MeshBasicMaterial({ color: '#7fe0a8', side: T.DoubleSide })); sh2.position.set(x, 2.35, z); scene.add(l, sh2); } });
      camera.position.set(14, 11, 18);
      cv.addEventListener('pointerdown', down); addEventListener('resize', resize);
      update(rows); resize(); clock.getDelta(); loop();
    }
    let dragX = null, moved = false;
    function down(e) { dragX = { x: e.clientX, yaw: tYaw }; moved = false; const mv = ev => { if (Math.abs(ev.clientX - dragX.x) > 4) moved = true; tYaw = dragX.yaw - (ev.clientX - dragX.x) * .005; }; const up = ev => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); if (!moved) pick(ev); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); }
    function pick(e) { const r = canvas.getBoundingClientRect(), m = new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(m, camera); const hit = ray.intersectObjects(Object.values(seats).map(s => s.g), true)[0]; if (hit) { let o = hit.object; while (o && !o.userData.sid) o = o.parent; if (o) detail(o.userData.sid); } }
    function update(rows) {
      if (!scene) return; const ids = new Set(rows.map(r => r.id));
      Object.keys(seats).forEach(id => { if (!ids.has(id)) { scene.remove(seats[id].g); delete seats[id]; } });
      rows.slice().sort((a, b) => (a.a.created || 0) - (b.a.created || 0)).forEach((r, i) => {
        const on = !!r.live, key = r.a.avatar.t + r.a.avatar.c + r.a.first + on + (r.live ? r.live.w + (r.live.b ? 'b' : '') : '');
        if (seats[r.id] && seats[r.id].key === key) return; if (seats[r.id]) scene.remove(seats[r.id].g);
        const g = new T.Group(), av = Avatars.build(r.a.avatar.t, on ? r.a.avatar.c : '#6b7280'); av.scale.setScalar(2.1); g.add(av);
        if (!on) av.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .45; } });
        const chair = new T.Mesh(new T.BoxGeometry(1.2, .15, 1.2), new T.MeshStandardMaterial({ color: '#5a3520' })); chair.position.y = -.05; g.add(chair);
        const lb = Avatars.label((on ? '✨ ' : '') + r.a.first + (on && r.live.b ? ' · 📖' : on && r.live.w === 'kz' ? ' · 🐆' : ''), on ? { glow: '#ffd36b', bg: 'rgba(40,28,10,.9)', color: '#fff3c4', h: .8, depthTest: false } : { bg: 'rgba(20,20,20,.6)', color: '#9aa', h: .6 }); lb.position.y = 3.4; g.add(lb);
        if (on) { const gl = new T.Sprite(new T.SpriteMaterial({ map: Avatars.glowTex('#ffcc66'), transparent: true, depthWrite: false, blending: T.AdditiveBlending })); gl.scale.set(3.5, 3.5, 1); gl.position.y = 1.2; g.add(gl); const pl = new T.PointLight('#ffcc77', .6, 5); pl.position.y = 1.6; g.add(pl); }
        const n = i % 20, side = n % 2 ? 1 : -1, col = Math.floor(n / 10), z = -9 + (Math.floor(n / 2) % 5) * 4.5;
        const tableX = col ? 5 : -5; g.position.set(tableX + side * 2.3, 1.0, z); g.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        g.userData.sid = r.id; scene.add(g); seats[r.id] = { g, av, key };
      });
    }
    function resize() { if (!renderer) return; const p = canvas.parentElement; renderer.setSize(p.clientWidth, p.clientHeight, false); camera.aspect = p.clientWidth / p.clientHeight; camera.updateProjectionMatrix(); }
    function loop() { raf = requestAnimationFrame(loop); const t = clock.getElapsedTime(); yaw += (tYaw - yaw) * .08; camera.position.set(Math.sin(yaw) * 17, 9.5, Math.cos(yaw) * 17); camera.lookAt(0, 1.2, 0); Object.values(seats).forEach(s => s.av.userData.anim && s.av.userData.anim(t, false)); renderer.render(scene, camera); }
    function stop() { cancelAnimationFrame(raf); raf = 0; if (renderer) { renderer.dispose(); renderer = null; } scene = null; seats = {}; removeEventListener('resize', resize); }
    return { start, update, stop };
  })();
  return { open, close, render };
})();
