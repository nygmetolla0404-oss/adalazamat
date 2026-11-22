/* Интерактивті 3D кітап: парақталатын беттер, беттен шығатын 3D бейнелер (толықтырылған шындық), аудиогид */
window.Book = (function () {
  const T = THREE, PW = 1024, PH = 1400, W = 4.4, H = W * PH / PW, GAP = .06, PY = .27;
  let el, renderer, scene, camera, clock, raf = 0, def = null, spread = 0, focus = 'all', single = false;
  let pageL, pageR, texL, texR, cvL, cvR, flip = null, pops = [], table, video = null, auto = false, regions = { L: [], R: [] };
  const camCur = { p: new T.Vector3(0, 11, 8), l: new T.Vector3(0, 0, .5) }, ray = new T.Raycaster(), mouse = new T.Vector2();
  const esc = s => String(s == null ? '' : s);

  /* ---------- сахна ---------- */
  function init() {
    el = document.getElementById('bookView');
    renderer = new T.WebGLRenderer({ canvas: document.getElementById('bookCanvas'), antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.shadowMap.enabled = true;
    scene = new T.Scene(); scene.background = new T.Color('#3a2618');
    camera = new T.PerspectiveCamera(38, 1, .1, 200); clock = new T.Clock();
    scene.add(new T.HemisphereLight('#fff6e6', '#3a2618', .5));
    const sun = new T.DirectionalLight('#fff1d6', .55); sun.position.set(-4, 12, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 }); scene.add(sun);
    table = new T.Mesh(new T.PlaneGeometry(40, 28), new T.MeshStandardMaterial({ map: woodTex(), roughness: .8 })); table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table);
    const coverM = new T.MeshStandardMaterial({ color: '#13285a', roughness: .6 });
    const cover = new T.Mesh(new T.BoxGeometry(W * 2 + GAP * 2 + .35, .12, H + .35), coverM); cover.position.y = .06; cover.castShadow = true; cover.receiveShadow = true; scene.add(cover);
    const trim = new T.Mesh(new T.BoxGeometry(W * 2 + GAP * 2 + .38, .05, H + .38), new T.MeshStandardMaterial({ color: '#e0a92b', metalness: .5, roughness: .4 })); trim.position.y = .1; scene.add(trim);
    [-1, 1].forEach(s => { const st = new T.Mesh(new T.BoxGeometry(W, .15, H), new T.MeshStandardMaterial({ color: '#f3e7c9' })); st.position.set(s * (W / 2 + GAP), .19, 0); st.castShadow = true; scene.add(st); });
    cvL = document.createElement('canvas'); cvR = document.createElement('canvas'); [cvL, cvR].forEach(c => { c.width = PW; c.height = PH; });
    texL = new T.CanvasTexture(cvL); texR = new T.CanvasTexture(cvR); [texL, texR].forEach(t => { t.anisotropy = 8; });
    const geo = new T.PlaneGeometry(W, H); geo.rotateX(-Math.PI / 2);
    pageL = new T.Mesh(geo, new T.MeshStandardMaterial({ map: texL, roughness: .95 })); pageL.position.set(-W / 2 - GAP, PY, 0); pageL.receiveShadow = true;
    pageR = new T.Mesh(geo, new T.MeshStandardMaterial({ map: texR, roughness: .95 })); pageR.position.set(W / 2 + GAP, PY, 0); pageR.receiveShadow = true;
    scene.add(pageL, pageR);
    const spine = new T.Mesh(new T.CylinderGeometry(.09, .09, H, 10), new T.MeshStandardMaterial({ color: '#e8d9b5' })); spine.rotation.x = Math.PI / 2; spine.position.y = PY - .02; scene.add(spine);
    // басқару
    const cv = renderer.domElement;
    cv.addEventListener('pointermove', e => { const h = hit(e); cv.style.cursor = h && h.r ? 'pointer' : 'default'; });
    let sx = null; cv.addEventListener('pointerdown', e => { sx = { x: e.clientX, t: Date.now() }; });
    cv.addEventListener('pointerup', e => { if (sx && Math.abs(e.clientX - sx.x) > 60 && Date.now() - sx.t < 600) { e.clientX < sx.x ? next() : prev(); sx = null; return; } sx = null; const h = hit(e); if (h && h.r) act(h.r.act, h.page, h.side); });
    addEventListener('keydown', e => { if (!def || document.querySelector('.modal.open')) return; if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); if (e.key === 'Escape') close(); });
    addEventListener('resize', resize);
    el.querySelector('#bkPrev').onclick = prev; el.querySelector('#bkNext').onclick = next; el.querySelector('#bkClose').onclick = close;
    el.querySelector('#bkHome').onclick = () => flipTo(1);
    el.querySelector('#bkRead').onclick = () => readNow();
    el.querySelector('#bkAuto').onclick = () => { auto = !auto; el.querySelector('#bkAuto').classList.toggle('on', auto); if (auto) readNow(); else Voice.stop(); };
    el.querySelector('#bkAR').onclick = toggleAR;
    el.querySelector('#bkFull').onclick = () => { try { document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen(); } catch (e) {} };
    el.querySelector('#bkMascot').onclick = () => readNow();
  }
  function woodTex() { const c = document.createElement('canvas'); c.width = 1024; c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#8a5a33'; x.fillRect(0, 0, 1024, 512); for (let i = 0; i < 90; i++) { x.strokeStyle = `rgba(${60 + Math.random() * 40},${30 + Math.random() * 20},10,${.15 + Math.random() * .25})`; x.lineWidth = 1 + Math.random() * 4; x.beginPath(); const y = Math.random() * 512; x.moveTo(0, y); for (let k = 0; k <= 1024; k += 64) x.lineTo(k, y + Math.sin(k * .01 + i) * 6); x.stroke(); } for (let i = 1; i < 6; i++) { x.fillStyle = 'rgba(40,20,5,.35)'; x.fillRect(0, i * 85, 1024, 3); } const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(2, 2); return t; }
  function resize() { if (!renderer || !el.classList.contains('open')) return; const w = el.clientWidth, h = el.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); single = camera.aspect < 1.2; if (!single) focus = 'all'; else if (focus === 'all') focus = 'L'; updatePager(); }
  function camTarget() {
    const fov = camera.fov * Math.PI / 180, a = camera.aspect;
    if (focus === 'all') { const needW = W * 2 + 1.2, needH = H + 1.6, d = Math.max(needH / (2 * Math.tan(fov / 2)), needW / (2 * Math.tan(fov / 2) * a)) * 1.02; return { p: new T.Vector3(0, d * .86, d * .5 + .4), l: new T.Vector3(0, 0, .35) }; }
    const x = (focus === 'L' ? -1 : 1) * (W / 2 + GAP), d = Math.max((H + .6) / (2 * Math.tan(fov / 2)), (W + .4) / (2 * Math.tan(fov / 2) * a)); return { p: new T.Vector3(x, d * .93, d * .36 + .2), l: new T.Vector3(x, 0, .1) };
  }

  /* ---------- бет салу ---------- */
  function wrap(x, text, maxW) { const words = esc(text).split(/\s+/), lines = []; let line = ''; words.forEach(w => { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }); if (line) lines.push(line); return lines; }
  function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }
  function paper(x, side, num) {
    const g = x.createLinearGradient(side === 'L' ? PW : 0, 0, side === 'L' ? 0 : PW, 0); g.addColorStop(0, '#e9dcbc'); g.addColorStop(.08, '#fbf3df'); g.addColorStop(1, '#fdf8ea'); x.fillStyle = g; x.fillRect(0, 0, PW, PH);
    x.strokeStyle = 'rgba(224,169,43,.55)'; x.lineWidth = 3; for (let i = 0; i < 26; i++) { const cx = 90 + i * 34; x.beginPath(); x.arc(cx, PH - 70, 9, Math.PI, 0); x.stroke(); }
    x.beginPath(); x.moveTo(70, PH - 60); x.lineTo(PW - 70, PH - 60); x.stroke();
    x.fillStyle = '#fdf8ea'; x.beginPath(); x.arc(PW / 2, PH - 60, 30, 0, 7); x.fill(); x.strokeStyle = '#d9a43a'; x.lineWidth = 3; x.stroke();
    x.fillStyle = '#7a5a20'; x.font = '800 26px Nunito'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(num, PW / 2, PH - 59); x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  }
  function drawPage(cv, page, idx, side) {
    const x = cv.getContext('2d'), regs = []; paper(x, side, idx + 1); if (!page) return regs;
    if (page.cover) { x.fillStyle = def.color; x.globalAlpha = .1; x.fillRect(0, 0, PW, PH); x.globalAlpha = 1; }
    let s = 1.42, res;
    for (let tries = 0; tries < 9; tries++) { res = layout(x, page, s, true); if (res.y < PH - 115) break; s *= .92; }
    layout(x, page, s, false, regs); page._big = res.big; return regs;
  }
  function layout(x, page, s, dry, regs) {
    const L = 78, R = PW - 78, MW = R - L; let y = 80; let big = null; const st = page.state || (page.state = {});
    const text = (str, size, weight, color, lh, maxW, X) => { x.font = `${weight} ${size * s}px Nunito`; const lines = wrap(x, str, maxW || MW); if (!dry) { x.fillStyle = color; lines.forEach((l, i) => x.fillText(l, X || L, y + size * s + i * lh * s)); } y += lines.length * lh * s + size * s * .35; };
    const button = (bx, by, bw, bh, label, color, actv, fg) => { if (!dry) { x.fillStyle = 'rgba(0,0,0,.18)'; rr(x, bx, by + 6, bw, bh, bh / 2); x.fill(); x.fillStyle = color; rr(x, bx, by, bw, bh, bh / 2); x.fill(); x.fillStyle = fg || '#fff'; x.font = `800 ${30 * s * (bw < 300 ? .78 : 1)}px Nunito`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(label, bx + bw / 2, by + bh / 2 + 1); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; regs.push({ x: bx, y: by, w: bw, h: bh, act: actv }); } };
    page.blocks.forEach(b => {
      if (b.k === 'chip') { x.font = `900 ${22 * s}px Nunito`; const w = x.measureText(b.text).width + 40; if (!dry) { x.fillStyle = def.color; rr(x, L, y, w, 42 * s, 21 * s); x.fill(); x.fillStyle = '#fff'; x.fillText(b.text, L + 20, y + 29 * s); } y += 62 * s; }
      else if (b.k === 'banner') { const bh = 70 * s; if (!dry) { x.fillStyle = '#13285a'; rr(x, L, y, MW, bh, 22); x.fill(); x.strokeStyle = '#e0a92b'; x.lineWidth = 5; x.stroke(); x.fillStyle = '#f4c95d'; x.font = `900 ${38 * s}px Nunito`; x.textAlign = 'center'; x.fillText(b.text, PW / 2, y + bh * .69); x.textAlign = 'left'; } y += bh + 24 * s; }
      else if (b.k === 'h') text(b.text, b.size || 52, 900, '#13285a', (b.size || 52) * 1.12);
      else if (b.k === 'sub') text(b.text, 28, 800, def.color, 38);
      else if (b.k === 'p') text(b.text, 33, 600, '#2b2340', 48);
      else if (b.k === 'quote') { y += 8 * s; const y0 = y; text('«' + b.text + '»', 34, 800, '#7a4a10', 46, MW - 50, L + 34); if (!dry) { x.fillStyle = '#e0a92b'; x.fillRect(L, y0, 8, y - y0 - 8); } y += 10 * s; }
      else if (b.k === 'box') { x.font = `800 ${29 * s}px Nunito`; const tl = b.title ? wrap(x, b.title, MW - 50) : []; x.font = `600 ${29 * s}px Nunito`; const pl = wrap(x, b.text, MW - 50), hgt = (tl.length * 40 + pl.length * 41) * s + 40 * s;
        if (!dry) { x.fillStyle = b.color || '#fff6d8'; rr(x, L, y, MW, hgt, 24); x.fill(); x.strokeStyle = 'rgba(224,169,43,.6)'; x.lineWidth = 3; x.stroke(); x.fillStyle = '#7a4a10'; x.font = `800 ${29 * s}px Nunito`; tl.forEach((l, i) => x.fillText(l, L + 25, y + 46 * s + i * 40 * s)); x.fillStyle = '#2b2340'; x.font = `600 ${29 * s}px Nunito`; pl.forEach((l, i) => x.fillText(l, L + 25, y + 46 * s + tl.length * 40 * s + i * 41 * s)); }
        y += hgt + 22 * s; }
      else if (b.k === 'big') { big = { x: PW / 2, y: y + b.h * s / 2, h: b.h * s }; y += b.h * s; }
      else if (b.k === 'tags') { let X = L; x.font = `800 ${26 * s}px Nunito`; b.items.forEach(t => { const w = x.measureText(t).width + 36; if (X + w > R) { X = L; y += 58 * s; } if (!dry) { x.fillStyle = '#fff'; rr(x, X, y, w, 46 * s, 23 * s); x.fill(); x.strokeStyle = def.color; x.lineWidth = 3; x.stroke(); x.fillStyle = '#13285a'; x.fillText(t, X + 18, y + 32 * s); } X += w + 12; }); y += 70 * s; }
      else if (b.k === 'btns') { const n = b.items.length, gap = 14, bw = (MW - gap * (n - 1)) / n, bh = 76 * s; const fs0 = n > 2 ? .78 : 1; b.items.forEach((it, i) => button(L + i * (bw + gap), y, bw, bh, it.label, it.color, it.act)); y += bh + 30 * s; }
      else if (b.k === 'toc') { def.pages.forEach((p, i) => { if (!p.toc || p.toc === true) return; const t = p.toc; const rh = 50 * s; if (!dry) { x.fillStyle = 'rgba(224,169,43,.13)'; rr(x, L, y, MW, rh, 16); x.fill(); x.fillStyle = '#13285a'; x.font = `800 ${24 * s}px Nunito`; x.fillText(t, L + 22, y + rh * .67); x.fillStyle = '#b07a20'; x.textAlign = 'right'; x.fillText(String(i + 1), R - 20, y + rh * .67); x.textAlign = 'left'; regs.push({ x: L, y, w: MW, h: rh, act: 'goto:' + i }); } y += rh + 10 * s; }); if (!dry) { x.fillStyle = '#8a6a30'; x.font = `italic 700 ${21 * s}px Nunito`; x.fillText('👆 Тақырыпты бас — кітап өзі парақталады', L + 10, y + 28 * s); } y += 50 * s; }
      else if (b.k === 'q') {
        const q = b.q, ans = st[b.id]; text('❓ ' + q.q, 34, 800, '#13285a', 46);
        q.a.forEach((o, k) => { x.font = `700 ${30 * s}px Nunito`; const ls = wrap(x, o, MW - 90), bh = Math.max(70, ls.length * 40 + 30) * s; let bg = '#ffffff', bd = '#e3dccb';
          if (ans != null) { if (k === q.c) { bg = '#dff5e8'; bd = '#2fa866'; } else if (k === ans) { bg = '#fbe5e4'; bd = '#d9534f'; } }
          if (!dry) { x.fillStyle = bg; rr(x, L, y, MW, bh, 18); x.fill(); x.strokeStyle = bd; x.lineWidth = 4; x.stroke(); x.fillStyle = '#e0a92b'; x.beginPath(); x.arc(L + 38, y + bh / 2, 20, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = `900 ${24 * s}px Nunito`; x.textAlign = 'center'; x.fillText('АБВГ'[k], L + 38, y + bh / 2 + 8); x.textAlign = 'left'; x.fillStyle = '#2b2340'; x.font = `700 ${30 * s}px Nunito`; ls.forEach((l, i) => x.fillText(l, L + 72, y + bh / 2 + 10 - (ls.length - 1) * 20 * s + i * 40 * s)); if (ans == null) regs.push({ x: L, y, w: MW, h: bh, act: 'ans:' + b.id + ':' + k }); }
          y += bh + 12 * s; });
        if (ans == null) { button(L, y + 4, MW, 66 * s, '🎙 Айтып жауап бер', '#8a5cf0', 'voice:' + b.id); y += 86 * s; }
        else { text(ans === q.c ? '✅ Дұрыс! Жарайсың!' : '❌ Қате. Дұрыс жауап жасылмен белгіленді.', 29, 800, ans === q.c ? '#16723f' : '#b03a30', 40); }
        y += 10 * s;
      }
      else if (b.k === 'opts') { const ch = st.case; b.options.forEach((o, k) => { x.font = `700 ${30 * s}px Nunito`; const ls = wrap(x, o.t, MW - 50), bh = (ls.length * 40 + 34) * s; let bg = '#fff', bd = '#e3dccb'; if (ch === k) { bg = o.ok ? '#dff5e8' : '#fbe5e4'; bd = o.ok ? '#2fa866' : '#d9534f'; }
          if (!dry) { x.fillStyle = bg; rr(x, L, y, MW, bh, 18); x.fill(); x.strokeStyle = bd; x.lineWidth = 4; x.stroke(); x.fillStyle = '#2b2340'; ls.forEach((l, i) => x.fillText(l, L + 25, y + 46 * s + i * 40 * s)); regs.push({ x: L, y, w: MW, h: bh, act: 'case:' + k }); } y += bh + 14 * s; });
        if (ch != null) { y += 6; text(b.options[ch].fb, 31, 800, b.options[ch].ok ? '#16723f' : '#b03a30', 44); } }
      else if (b.k === 'saved') { const d = Progress.rec && Progress.rec.done[b.key]; const t = d && d.a ? '📨 Жіберілді: «' + d.a.replace(/^🎙️ /, '').slice(0, 110) + (d.a.length > 110 ? '…' : '') + '»' : '📝 Жауап әлі жоқ. Төмендегі батырманы бас.'; text(t, 27, 700, d ? '#16723f' : '#8a6a30', 38); }
      else if (b.k === 'result') { const done = Progress.rec ? Progress.rec.done : {}; let rows;
        if (b.wid) { const w = WORLDS.find(q => q.id === b.wid); rows = [['📖 Кітаптар', w.books.filter(k => done[w.id + ':book:' + k.id]).length + '/3'], ['🏛️ Мұражай', done[w.id + ':museum'] ? '✅' : '—'], ['⭕ Зертханалар', w.labs.filter((l, i) => done[w.id + ':lab' + i]).length + '/2'], ['💬 Жағдаят', done[w.id + ':case'] ? '✅' : '—'], ['✍️ Жазылым', done[w.id + ':write'] ? '✅' : '—'], ['🎙️ Айтылым', done[w.id + ':speak'] ? '✅' : '—'], ['🎯 Квестер', w.quests.filter((q, i) => done[w.id + ':quest:' + i]).length + '/' + w.quests.length], ['⭐ Әлем орындалды', Progress.worldPct(w) + '%']]; }
        else { const hid = b.hid; rows = [['❓ Сұрақтар', done[hid + ':quiz'] ? '✅' : '—'], ['💬 Жағдаят', done[hid + ':case'] ? '✅' : '—'], ['✍️ Жазылым', done[hid + ':write'] ? '✅' : '—'], ['🎙️ Айтылым', done[hid + ':speak'] ? '✅' : '—']]; }
        rows.push(['🏅 Жалпы ұпайым', String(Progress.rec ? Progress.rec.score : 0)]);
        const rh = 46 * s; rows.forEach(([a, v]) => { if (!dry) { x.fillStyle = 'rgba(224,169,43,.12)'; rr(x, L, y, MW, rh, 14); x.fill(); x.fillStyle = '#13285a'; x.font = `800 ${23 * s}px Nunito`; x.fillText(a, L + 20, y + rh * .67); x.textAlign = 'right'; x.fillText(v, R - 20, y + rh * .67); x.textAlign = 'left'; } y += rh + 8 * s; }); }
      else if (b.k === 'photo') { const im = imgs[b.key], ph = window.photo(b.key), hh = b.h * s; if (im && im.complete && im.naturalWidth) { if (!dry) { x.save(); rr(x, L, y, MW, hh, 22); x.clip(); const sc = Math.max(MW / im.naturalWidth, hh / im.naturalHeight), iw = im.naturalWidth * sc, ih = im.naturalHeight * sc; x.drawImage(im, L + (MW - iw) / 2, y + (hh - ih) / 2, iw, ih); x.restore(); x.strokeStyle = '#e0a92b'; x.lineWidth = 6; rr(x, L, y, MW, hh, 22); x.stroke(); x.fillStyle = '#8a6a30'; x.font = `600 ${15 * s}px Nunito`; x.fillText(('📷 ' + ph.credit + ' · ' + ph.license + ' · Wikimedia Commons').slice(0, 90), L + 6, y + hh + 20 * s); } y += hh + 34 * s; } }
      else if (b.k === 'space') y += b.h * s;
    });
    return { y, big };
  }

  /* ---------- 3D бейнелер (беттен шығады) ---------- */
  const SM = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .6, flatShading: true }, o || {}));
  function emojiSprite(e, s) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.font = '200px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, 128, 140); const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true })); sp.scale.set(s, s, 1); return sp; }
  function makePop(kind) {
    if (window.Models && Models.has(kind)) { const mg = Models.build(kind); mg.userData.isModel = true; return mg; }
    const g = new T.Group(), m = (geo, mat, x, y, z) => { const o = new T.Mesh(geo, mat); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; g.add(o); return o; };
    if (kind.indexOf('emoji:') === 0) { const sp = emojiSprite(kind.slice(6), 1.5); sp.position.y = .85; g.add(sp); const base = m(new T.CylinderGeometry(.6, .7, .08, 24), SM('#e0a92b', { metalness: .4 }), 0, .04, 0); }
    else if (kind === 'yurt') { m(new T.CylinderGeometry(.75, .75, .55, 20), SM('#f6f1e4'), 0, .28, 0); m(new T.CylinderGeometry(.76, .76, .12, 20, 1, true), SM('#d8473f'), 0, .5, 0); m(new T.ConeGeometry(.82, .5, 20), SM('#efe6d2'), 0, .8, 0); m(new T.TorusGeometry(.16, .04, 6, 14), SM('#a8742e'), 0, 1.04, 0).rotation.x = Math.PI / 2; m(new T.BoxGeometry(.3, .4, .05), SM('#c1462f'), 0, .2, .74); }
    else if (kind === 'tree') { m(new T.CylinderGeometry(.08, .12, .7, 6), SM('#7a4f2a'), 0, .35, 0); m(new T.IcosahedronGeometry(.5, 0), SM('#4caf50'), 0, .95, 0); m(new T.IcosahedronGeometry(.32, 0), SM('#66c25a'), .25, 1.25, .1); }
    else if (kind === 'book') { const a = m(new T.BoxGeometry(.7, .06, .9), SM('#fff8e6'), -.36, .5, 0); a.rotation.z = .25; const b = m(new T.BoxGeometry(.7, .06, .9), SM('#fff8e6'), .36, .5, 0); b.rotation.z = -.25; m(new T.BoxGeometry(1.5, .05, .95), SM(def ? def.color : '#13285a'), 0, .4, 0); const sp = emojiSprite('✨', .6); sp.position.y = 1.0; g.add(sp); }
    else if (kind === 'flask') { m(new T.SphereGeometry(.42, 16, 12), SM('#cfefff', { transparent: true, opacity: .55 }), 0, .45, 0); m(new T.SphereGeometry(.34, 16, 12), SM('#e0368a', { emissive: '#4a0a2a' }), 0, .4, 0); m(new T.CylinderGeometry(.1, .12, .5, 10), SM('#cfefff', { transparent: true, opacity: .6 }), 0, .95, 0); }
    else if (kind === 'robot') { m(new T.BoxGeometry(.6, .55, .45), SM('#8a5cf0', { metalness: .3 }), 0, .4, 0); m(new T.BoxGeometry(.5, .4, .4), SM('#dfe6ee'), 0, .9, 0); m(new T.BoxGeometry(.4, .14, .02), new T.MeshBasicMaterial({ color: '#46e6ff' }), 0, .92, .21); m(new T.SphereGeometry(.06), new T.MeshBasicMaterial({ color: '#ff5d5d' }), 0, 1.25, 0); }
    else if (kind === 'scales') { m(new T.CylinderGeometry(.05, .05, 1.1, 8), SM('#e0a92b', { metalness: .6 }), 0, .55, 0); m(new T.BoxGeometry(1.2, .05, .05), SM('#e0a92b', { metalness: .6 }), 0, 1.08, 0); [-.55, .55].forEach(x => m(new T.CylinderGeometry(.25, .18, .06, 16), SM('#e0a92b', { metalness: .6 }), x, .75, 0)); m(new T.CylinderGeometry(.3, .35, .08, 16), SM('#7a4a10'), 0, .04, 0); }
    else if (kind === 'scroll') { const r = m(new T.CylinderGeometry(.14, .14, 1.1, 12), SM('#e9d6a8'), 0, .3, 0); r.rotation.z = Math.PI / 2; const p = m(new T.BoxGeometry(1, .02, .8), SM('#fbf0d0'), 0, .3, .4); m(new T.SphereGeometry(.09), SM('#c1462f'), 0, .32, .7); }
    else if (kind === 'mountain') { m(new T.ConeGeometry(.7, 1.2, 5), SM('#9aa3ad'), 0, .6, 0); m(new T.ConeGeometry(.28, .35, 5), SM('#ffffff'), 0, 1.05, 0); m(new T.ConeGeometry(.45, .7, 5), SM('#8a939c'), .55, .35, .2); }
    else if (kind === 'flag') { m(new T.CylinderGeometry(.03, .03, 1.5, 6), SM('#ddd'), -.5, .75, 0); const f = m(new T.PlaneGeometry(.95, .55, 8, 1), new T.MeshStandardMaterial({ color: '#19a3d9', side: T.DoubleSide }), 0, 1.2, 0); f.userData.wave = true; const sun = m(new T.CircleGeometry(.12, 16), new T.MeshBasicMaterial({ color: '#f4c95d', side: T.DoubleSide }), 0, 1.22, .01); }
    else if (kind === 'sun') { m(new T.SphereGeometry(.4, 16, 12), new T.MeshBasicMaterial({ color: '#ffd23f' }), 0, .9, 0); for (let i = 0; i < 10; i++) { const r = m(new T.ConeGeometry(.07, .3, 6), new T.MeshBasicMaterial({ color: '#ffb340' }), Math.cos(i * .628) * .6, .9 + Math.sin(i * .628) * .6, 0); r.rotation.z = i * .628 - Math.PI / 2; } }
    else if (kind === 'flower') { m(new T.CylinderGeometry(.03, .03, .8, 6), SM('#3f9b48'), 0, .4, 0); for (let i = 0; i < 6; i++) { const p = m(new T.SphereGeometry(.17, 10, 8), SM('#ff6b8a'), Math.cos(i * 1.05) * .2, .85, Math.sin(i * 1.05) * .2); p.scale.y = .5; } m(new T.SphereGeometry(.12), SM('#ffd23f'), 0, .88, 0); }
    else if (kind === 'heart') { const s = emojiSprite('❤️', 1.2); s.position.y = .8; g.add(s); }
    else if (kind === 'hands') { const s = emojiSprite('🤝', 1.3); s.position.y = .8; g.add(s); m(new T.TorusGeometry(.5, .05, 8, 24), SM('#ef8a22'), 0, .1, 0).rotation.x = Math.PI / 2; }
    else if (kind === 'tower') { m(new T.CylinderGeometry(.08, .12, 1.2, 8), SM('#ffffff'), 0, .6, 0); for (let i = 0; i < 8; i++) { const b = m(new T.CylinderGeometry(.02, .03, .45, 5), SM('#ffffff'), Math.cos(i * .785) * .16, 1.2, Math.sin(i * .785) * .16); b.rotation.set(Math.sin(i * .785) * .5, 0, -Math.cos(i * .785) * .5); } m(new T.SphereGeometry(.2, 16, 12), SM('#f4c95d', { metalness: .6, flatShading: false }), 0, 1.45, 0); }
    else if (kind === 'rocket') { m(new T.CylinderGeometry(.16, .16, .9, 12), SM('#f5f5f5'), 0, .55, 0); m(new T.ConeGeometry(.16, .3, 12), SM('#d8473f'), 0, 1.15, 0); for (let i = 0; i < 3; i++) { const f = m(new T.BoxGeometry(.03, .25, .22), SM('#d8473f'), Math.cos(i * 2.1) * .17, .2, Math.sin(i * 2.1) * .17); f.rotation.y = -i * 2.1; } const fl = emojiSprite('🔥', .5); fl.position.y = -.05; g.add(fl); }
    else if (kind === 'monument') { m(new T.CylinderGeometry(.09, .13, 1.3, 8), SM('#f2efe6'), 0, .65, 0); const gm = emojiSprite('🐆', .55); gm.position.y = 1.45; g.add(gm); m(new T.CylinderGeometry(.4, .45, .1, 16), SM('#c9c2b0'), 0, .05, 0); }
    else if (kind === 'river') { const w = m(new T.TorusGeometry(.45, .12, 8, 24, Math.PI), SM('#3f9ee0'), 0, .1, 0); w.rotation.x = Math.PI / 2; const s = emojiSprite('🐟', .5); s.position.set(.1, .5, 0); g.add(s); }
    else if (kind === 'lamp') { m(new T.SphereGeometry(.35, 16, 12), new T.MeshBasicMaterial({ color: '#fff3a0' }), 0, .85, 0); m(new T.CylinderGeometry(.15, .15, .25, 12), SM('#888', { metalness: .6 }), 0, .45, 0); g.add(Object.assign(new T.Sprite(new T.SpriteMaterial({ map: Avatars.glowTex('#ffe680'), transparent: true, blending: T.AdditiveBlending, depthWrite: false })), { position: new T.Vector3(0, .85, 0), scale: new T.Vector3(1.6, 1.6, 1) })); }
    else if (kind === 'drop') { m(new T.SphereGeometry(.35, 16, 12), SM('#4fb8ff', { transparent: true, opacity: .85 }), 0, .45, 0); m(new T.ConeGeometry(.3, .45, 16), SM('#4fb8ff', { transparent: true, opacity: .85 }), 0, .85, 0); }
    else if (kind === 'trophy') { m(new T.CylinderGeometry(.35, .15, .55, 16), SM('#f4c95d', { metalness: .7, flatShading: false }), 0, .85, 0); m(new T.CylinderGeometry(.06, .06, .3, 8), SM('#f4c95d', { metalness: .7 }), 0, .45, 0); m(new T.BoxGeometry(.5, .15, .5), SM('#7a4a10'), 0, .25, 0); const st = emojiSprite('⭐', .5); st.position.y = 1.35; g.add(st); }
    else if (kind === 'portal') { m(new T.TorusGeometry(.5, .07, 8, 30), new T.MeshBasicMaterial({ color: '#ffe9a8' }), 0, .7, 0); const sw = m(new T.CircleGeometry(.47, 30), new T.MeshBasicMaterial({ color: '#8a5cf0', transparent: true, opacity: .8, side: T.DoubleSide }), 0, .7, 0); sw.userData.spin = true; m(new T.CylinderGeometry(.6, .65, .08, 20), SM('#d9cfb6'), 0, .04, 0); }
    else { const sp = emojiSprite('⭐', 1); sp.position.y = .7; g.add(sp); }
    return g;
  }
  function clearPops() { pops.forEach(p => scene.remove(p.g)); pops = []; }
  function showPops() {
    clearPops(); if (!def) return;
    [[2 * spread, -1], [2 * spread + 1, 1]].forEach(([i, side]) => { const page = def.pages[i]; if (!page || !page.pop || !page._big) return;
      const kinds = page.pop, b = page._big, cx = side * (W / 2 + GAP) + (b.x / PW - .5) * W, cz = (b.y / PH - .5) * H, sc = Math.min(1.25, b.h / PH * H * .62);
      kinds.forEach((k, j) => { const g = makePop(k); g.position.set(cx + (j - (kinds.length - 1) / 2) * 1.1, PY, cz + .25); g.scale.setScalar(.001); scene.add(g); pops.push({ g, t: -j * .15, target: sc * (g.userData.isModel ? .72 : 1) }); }); });
  }

  /* ---------- парақтау ---------- */
  function render() {
    const iL = 2 * spread, iR = iL + 1;
    regions.L = drawPage(cvL, def.pages[iL], iL, 'L'); regions.R = drawPage(cvR, def.pages[iR], iR, 'R');
    texL.needsUpdate = true; texR.needsUpdate = true; showPops(); updatePager(); bubble(); checkVisit();
    App.presence({ b: def.id });
  }
  function redrawSide(side) { const i = 2 * spread + (side === 'L' ? 0 : 1); regions[side] = drawPage(side === 'L' ? cvL : cvR, def.pages[i], i, side); (side === 'L' ? texL : texR).needsUpdate = true; }
  function pagesCount() { return Math.ceil(def.pages.length / 2); }
  function next() { if (flip) return; if (single && focus === 'L') { focus = 'R'; updatePager(); bubble(); if (auto) readNow(); return; } if (spread < pagesCount() - 1) doFlip(spread + 1); else if (auto) { auto = false; el.querySelector('#bkAuto').classList.remove('on'); } }
  function prev() { if (flip) return; if (single && focus === 'R') { focus = 'L'; updatePager(); bubble(); return; } if (spread > 0) doFlip(spread - 1, true); }
  function flipTo(pageIdx) { const sp = Math.floor(pageIdx / 2); if (single) focus = pageIdx % 2 ? 'R' : 'L'; if (sp !== spread) doFlip(sp, sp < spread); else { updatePager(); bubble(); } }
  function makeFlipGeo() { const g = new T.PlaneGeometry(W, H, 28, 1); g.rotateX(-Math.PI / 2); g.translate(W / 2, 0, 0); g.userData.base = g.attributes.position.array.slice(); return g; }
  function doFlip(to, back) {
    Voice.stop(); clearPops();
    const fromL = cloneCanvas(cvL), fromR = cloneCanvas(cvR), old = spread; spread = to;
    const nL = document.createElement('canvas'), nR = document.createElement('canvas'); nL.width = nR.width = PW; nL.height = nR.height = PH;
    const rL = drawPage(nL, def.pages[2 * to], 2 * to, 'L'), rR = drawPage(nR, def.pages[2 * to + 1], 2 * to + 1, 'R');
    const gF = makeFlipGeo(), gB = makeFlipGeo(); const uv = (back ? gF : gB).attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
    const frontCv = back ? fromL : fromR, backCv = back ? nR : nL;
    const mF = new T.Mesh(gF, new T.MeshStandardMaterial({ map: new T.CanvasTexture(frontCv), side: T.FrontSide, roughness: .95 })), mB = new T.Mesh(gB, new T.MeshStandardMaterial({ map: new T.CanvasTexture(backCv), side: T.BackSide, roughness: .95 }));
    const fg = new T.Group(); fg.add(mF, mB); fg.position.set(0, PY + .01, 0); if (back) fg.scale.x = -1; mF.castShadow = true; scene.add(fg);
    // астындағы беттер: алға – оң жақта жаңа оң бет; артқа – сол жақта жаңа сол бет
    if (back) { copyTo(cvL, nL); texL.needsUpdate = true; } else { copyTo(cvR, nR); texR.needsUpdate = true; }
    flip = { fg, gF, gB, t: 0, back, done: () => { copyTo(cvL, nL); copyTo(cvR, nR); texL.needsUpdate = texR.needsUpdate = true; regions.L = rL; regions.R = rR; scene.remove(fg); flip = null; if (single) focus = back ? 'R' : 'L'; showPops(); updatePager(); bubble(); checkVisit(); App.presence({ b: def.id }); if (auto) setTimeout(readNow, 300); } };
    Sfx.page && Sfx.page();
  }
  function cloneCanvas(c) { const n = document.createElement('canvas'); n.width = c.width; n.height = c.height; n.getContext('2d').drawImage(c, 0, 0); return n; }
  function copyTo(dst, src) { const x = dst.getContext('2d'); x.clearRect(0, 0, PW, PH); x.drawImage(src, 0, 0); }
  function stepFlip(dt) {
    const f = flip; f.t = Math.min(1, f.t + dt / .85); const p = f.t < .5 ? 2 * f.t * f.t : 1 - Math.pow(-2 * f.t + 2, 2) / 2, th = p * Math.PI;
    [f.gF, f.gB].forEach(g => { const a = g.attributes.position, b = g.userData.base; for (let i = 0; i < a.count; i++) { const x0 = b[i * 3], z0 = b[i * 3 + 2], u = Math.max(0, x0 / W), phi = th - .55 * Math.sin(p * Math.PI) * Math.pow(u, 1.4); a.setXYZ(i, x0 * Math.cos(phi), x0 * Math.sin(phi) + .02, z0); } a.needsUpdate = true; g.computeVertexNormals(); });
    if (f.t >= 1) f.done();
  }

  /* ---------- әрекеттер ---------- */
  function hit(e) {
    if (flip) return null; const r = renderer.domElement.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(mouse, camera);
    const h = ray.intersectObjects([pageL, pageR])[0]; if (!h) return null; const side = h.object === pageL ? 'L' : 'R', cx = h.uv.x * PW, cy = (1 - h.uv.y) * PH;
    const reg = regions[side].find(g => cx >= g.x && cx <= g.x + g.w && cy >= g.y && cy <= g.y + g.h); return { r: reg, side, page: def.pages[2 * spread + (side === 'L' ? 0 : 1)] };
  }
  function act(a, page, side) {
    const [k, p1, p2] = a.split(':'), w = def.world;
    if (k === 'say') Voice.say(page.say, { force: true });
    else if (k === 'goto') flipTo(+p1);
    else if (k === 'lab') Acts.lab(w, +p1);
    else if (k === 'journey') { close(); World.enterValue(w); }
    else if (k === 'trailer') Acts.trailer(w);
    else if (k === 'close') close();
    else if (k === 'book') { const ww = WORLDS.find(q => q.id === p1); open(Books.world(ww)); }
    else if (k === 'write') { const pr = w ? w.tasks.write.prompt : def.holiday.write; Acts.writeFree({ key: def.id + ':write', title: '✍️ Жазылым · ' + def.title, prompt: pr, pts: 15, onDone: () => redrawSide(side) }); }
    else if (k === 'speak') { const pr = w ? w.tasks.speak.prompt : def.holiday.speak, lang = w ? w.tasks.speak.lang : 'kk-KZ'; Acts.speakFree({ key: def.id + ':speak', title: '🎙️ Айтылым · ' + def.title, prompt: pr, lang, pts: 15, onDone: () => redrawSide(side) }); }
    else if (k === 'think') { const bk = w.books.find(b => b.id === p1); Acts.speakFree({ key: w.id + ':think:' + p1, title: '💭 ' + bk.title, prompt: 'Бұл шығарма «' + w.name + '» құндылығына қалай байланысты? Өз ойыңды айт.', lang: 'kk-KZ', pts: 5 }); }
    else if (k === 'ans') answer(page, side, p1 + ':' + p2, +a.split(':')[3]);
    else if (k === 'voice') voiceAnswer(page, side, p1 + ':' + p2);
    else if (k === 'case') { const b = page.blocks.find(x => x.k === 'opts'), o = b.options[+p1]; page.state = page.state || {}; page.state.case = +p1; redrawSide(side); Voice.say(o.fb, { force: true }); if (o.ok) { Sfx.ok(); Progress.award(b.id, page.state.caseTried ? 5 : 10, o.t, 'Жағдаят: ' + b.title); } else { Sfx.bad(); page.state.caseTried = true; } }
  }
  function answer(page, side, id, k) {
    const b = page.blocks.find(x => x.k === 'q' && x.id === id); if (!b) return; page.state = page.state || {}; if (page.state[id] != null) return;
    page.state[id] = k; const ok = k === b.q.c; ok ? Sfx.ok() : Sfx.bad(); Voice.say(ok ? TEXT.phrases.correct : TEXT.phrases.wrong, { force: true }); redrawSide(side);
    def.answers = def.answers || {}; def.answers[id] = ok;
    const grp = Object.keys(def.answers).filter(x => def.pages.some(pg => pg.blocks.some(bb => bb.k === 'q' && bb.id === x && bb.group === b.group)));
    if (grp.length >= b.n) { const correct = grp.filter(x => def.answers[x]).length; Progress.award(b.group, 10 + correct * 5, correct + '/' + b.n, (def.kind === 'world' ? 'Кітап' : 'Мереке') + ': ' + def.title);
      if (def.kind === 'world' && def.world.books.every(bk => Progress.isDone(def.id + ':book:' + bk.id))) Progress.award(def.id + ':read', 10, null, 'Оқылым: ' + def.world.short); }
  }
  function norm(s) { return s.toLowerCase().replace(/[«»"'.,!?–—\-:;()]/g, ' ').split(/\s+/).filter(w => w.length > 1); }
  async function voiceAnswer(page, side, id) {
    const b = page.blocks.find(x => x.k === 'q' && x.id === id); if (!Voice.canListen()) { App.toast('Микрофонмен жауап беру үшін Google Chrome ашыңыз'); return; }
    const lang = /[a-z]/i.test(b.q.a.join('')) && !/[а-яәіңғүұқөһ]/i.test(b.q.a.join('')) ? 'en-US' : 'kk-KZ';
    showMic(true); let text = '';
    try { const p = Voice.listen(lang, t => { el.querySelector('#bkMicText').textContent = t || '...'; }); setTimeout(() => Voice.stopListen(), 6000); text = await p; } catch (e) { App.toast('Микрофонға рұқсат беріңіз'); }
    showMic(false); if (!text) { App.toast('Естілмеді, қайталап көр'); return; }
    const said = norm(text); let best = -1, bs = 0; b.q.a.forEach((o, k) => { const ow = norm(o); const sc = ow.filter(w => said.some(s => s.indexOf(w.slice(0, 4)) === 0 || w.indexOf(s.slice(0, 4)) === 0)).length / Math.max(1, ow.length); if (sc > bs) { bs = sc; best = k; } });
    if (best < 0 || bs < .3) { App.toast('«' + text + '» – жауапты нақтырақ айтшы'); return; }
    App.toast('🎙 «' + text + '»'); answer(page, side, id, best);
  }
  function showMic(on) { const m = el.querySelector('#bkMic'); m.hidden = !on; el.querySelector('#bkMicText').textContent = 'Тыңдап тұрмын...'; }
  function checkVisit() {
    [2 * spread, 2 * spread + 1].forEach(i => { const p = def.pages[i]; if (!p) return; if (p.museum === 3) Progress.award(def.id + ':museum', 5, null, 'Мұражай: ' + def.title); if (p.finish) Progress.award(p.finish, 5, null, 'Мереке кітабы: ' + def.title); });
  }
  function visiblePages() { const iL = 2 * spread; return single ? [focus === 'L' ? iL : iL + 1] : [iL, iL + 1]; }
  function readNow() { const texts = visiblePages().flatMap(i => (def.pages[i] && def.pages[i].say) || []); Voice.say(texts, { force: true, done: () => { if (auto) setTimeout(next, 700); } }); }
  function bubble() { const i = visiblePages()[0], p = def.pages[i], h = p && p.blocks.find(b => b.k === 'h' || b.k === 'banner'); el.querySelector('#bkBubble').innerHTML = `<b>Ақбарыс:</b> ${h ? h.text : def.title}`; }
  function updatePager() { if (!def) return; const iL = 2 * spread, total = def.pages.length; el.querySelector('#bkCount').textContent = single ? `${(focus === 'L' ? iL : iL + 1) + 1} / ${total}` : `${iL + 1}–${iL + 2} / ${total}`; el.querySelector('#bkPrev').disabled = spread === 0 && (!single || focus === 'L'); el.querySelector('#bkNext').disabled = spread >= pagesCount() - 1 && (!single || focus === 'R'); }
  async function toggleAR() {
    const btn = el.querySelector('#bkAR');
    if (video) { video.srcObject && video.srcObject.getTracks().forEach(t => t.stop()); video = null; scene.background = new T.Color('#3a2618'); table.visible = true; btn.classList.remove('on'); return; }
    try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); video = document.createElement('video'); video.srcObject = s; video.playsInline = true; video.muted = true; await video.play(); const vt = new T.VideoTexture(video); scene.background = vt; table.visible = false; btn.classList.add('on'); App.toast('📷 AR режимі: кітап сенің бөлмеңде!'); }
    catch (e) { App.toast('Камераға рұқсат жоқ немесе камера табылмады'); }
  }

  /* ---------- цикл ---------- */
  function loop() {
    if (!def) { raf = 0; return; } raf = requestAnimationFrame(loop); const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
    if (flip) stepFlip(dt);
    const tg = camTarget(); camCur.p.lerp(tg.p, Math.min(1, dt * 3)); camCur.l.lerp(tg.l, Math.min(1, dt * 3)); camera.position.copy(camCur.p); camera.lookAt(camCur.l);
    pops.forEach((p, i) => { p.t += dt; const k = Math.max(0, Math.min(1, p.t / .7)), e = k === 0 ? 0 : 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2); p.g.scale.setScalar(Math.max(.001, e * p.target)); p.g.position.y = PY + Math.sin(t * 1.8 + i) * .05 * k; p.g.rotation.y = Math.sin(t * .7 + i) * .5;
      if (p.g.userData.isModel) p.g.userData.anim(t); p.g.traverse(o => { if (o.userData.wave) { const a = o.geometry.attributes.position; for (let j = 0; j < a.count; j++) a.setZ(j, Math.sin(a.getX(j) * 5 + t * 4) * .05); a.needsUpdate = true; } if (o.userData.spin) o.rotation.z = t * 2; }); });
    renderer.render(scene, camera);
  }
  const imgs = {};
  function preload(d) { const keys = new Set(); d.pages.forEach(p => p.blocks.forEach(b => b.k === 'photo' && keys.add(b.key))); return Promise.all([...keys].map(k => new Promise(res => { if (imgs[k] && imgs[k].complete) return res(); const ph = window.photo(k); if (!ph) return res(); const im = new Image(); im.onload = im.onerror = () => res(); im.src = ph.src; imgs[k] = im; setTimeout(res, 3000); }))); }
  async function open(d, key) {
    if (d.kind === 'world' && App.isClosed(d.world)) { App.toast('🔒 ' + TEXT.phrases.closed); Voice.say(TEXT.phrases.closed); return; }
    if (!App.user()) { App.auth(() => open(d, key)); return; }
    if (!renderer) init(); if (document.fonts) { try { await document.fonts.load('800 40px Nunito'); await document.fonts.load('600 40px Nunito'); } catch (e) {} }
    await preload(d); Modal.close(); def = d; def.pages.forEach(p => { delete p._big; }); spread = 0; auto = false; el.querySelector('#bkAuto').classList.remove('on');
    el.querySelector('#bkTitle').textContent = d.icon + ' ' + d.title; el.style.setProperty('--c', d.color);
    el.classList.add('open'); document.body.classList.add('in-book'); resize();
    if (key && d.keys[key] != null) { spread = Math.floor(d.keys[key] / 2); if (single) focus = d.keys[key] % 2 ? 'R' : 'L'; }
    const tg = camTarget(); camCur.p.copy(tg.p).add(new T.Vector3(0, 6, 4)); camCur.l.copy(tg.l);
    render(); World.stamp(d.id); clock.getDelta(); if (!raf) loop();
    Voice.say([TEXT.phrases.bookOpen, ...(def.pages[2 * spread].say || [])].slice(0, 3));
  }
  function close() { if (!def) return; Voice.stop(); auto = false; if (video) toggleAR(); def = null; clearPops(); el.classList.remove('open'); document.body.classList.remove('in-book'); App.presence({ b: null }); World.resume(); }
  return { open, close, get current() { return def ? def.id : null; }, get _scene() { return scene; } };
})();
