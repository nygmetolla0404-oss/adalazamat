/* 3D әлем қозғалтқышы: Қазақстан картасы (шолу / Ақбарыс / Қыран) және пәндік әлемдер */
window.World = (function () {
  const T = THREE;
  let renderer, camera, clock, raf = 0, stage, labelsBox, view, mapBox;
  let cur = null, kzS = null, mode = 'overview', hero, heroModel = {}, rider, heroLabel, lastZone = -1;
  const keys = {}, joy = { x: 0, y: 0 }, fly = { up: 0 };
  const st = { pos: new T.Vector3(), ry: Math.PI, alt: 0, speed: 0, target: null, camYaw: 0, bank: 0 };
  const ov = { yaw: 0, pitch: 1.05, dist: 250, tx: 0, tz: 0, tYaw: 0, tPitch: 1.05, tDist: 250, ttx: 0, ttz: 0 };
  let lastPres = 0, lastSent = new T.Vector3(1e9, 0, 0), nearPoi = null, visible = true;
  const ray = new T.Raycaster(), mouse = new T.Vector2();
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .85, flatShading: true }, o || {}));
  function rnd(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  function init() {
    view = document.getElementById('worldView'); mapBox = document.getElementById('mapBox');
    stage = document.getElementById('stage'); labelsBox = document.getElementById('poiLabels');
    const cv = document.getElementById('worldCanvas');
    renderer = new T.WebGLRenderer({ canvas: cv, antialias: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    camera = new T.PerspectiveCamera(55, 1, .1, 1600); clock = new T.Clock();
    addEventListener('resize', resize);
    addEventListener('keydown', e => { if (mode === 'overview' || !cur || /INPUT|TEXTAREA/.test(document.activeElement.tagName) || document.querySelector('.modal.open') || document.body.classList.contains('in-book')) return; keys[e.code] = true; if (e.code === 'KeyE' && nearPoi) nearPoi.open(); if (e.code === 'KeyF') setMode(mode === 'leopard' ? 'eagle' : 'leopard'); if (/Arrow|Space/.test(e.code)) e.preventDefault(); });
    addEventListener('keyup', e => { keys[e.code] = false; });
    let drag = null;
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw: mode === 'overview' ? ov.tYaw : st.camYaw, pitch: ov.tPitch, moved: false }; });
    addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true; if (mode === 'overview') { ov.tYaw = drag.yaw - dx * .005; ov.tPitch = Math.max(.45, Math.min(1.45, drag.pitch + dy * .004)); } else st.camYaw = drag.yaw - dx * .006; });
    addEventListener('pointerup', e => { if (drag && !drag.moved && e.target === cv) click(e); drag = null; });
    cv.addEventListener('wheel', e => { if (mode !== 'overview') return; e.preventDefault(); ov.tDist = Math.max(45, Math.min(ovMax, ov.tDist * (1 + e.deltaY * .0012))); }, { passive: false });
    new IntersectionObserver(es => es.forEach(en => { visible = en.isIntersecting || mode !== 'overview'; if (visible) kick(); })).observe(mapBox);
    setupJoystick();
  }
  function resize() { if (!renderer) return; const p = stage.parentElement, w = p.clientWidth, h = p.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); const fit = Math.min(600, 250 / Math.min(1, camera.aspect / 1.15)); if (!resize.done || ov.tDist > fit) ov.tDist = ov.dist = fit; resize.done = true; ovMax = Math.max(330, fit); }
  let ovMax = 330;
  function mount(where) { if (where === 'full') view.prepend(stage); else mapBox.appendChild(stage); view.classList.toggle('open', where === 'full'); document.body.classList.toggle('in-world', where === 'full'); resize(); }

  /* ---------- текстура көмекшілері ---------- */
  function emojiTex(e, size) { const c = document.createElement('canvas'); c.width = c.height = size || 128; const x = c.getContext('2d'); x.font = (size || 128) * .78 + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(e, c.width / 2, c.height * .55); return new T.CanvasTexture(c); }
  function swirlTex(col) { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 5, 128, 128, 128); g.addColorStop(0, '#ffffff'); g.addColorStop(.35, col); g.addColorStop(1, 'rgba(10,20,60,.9)'); x.fillStyle = g; x.beginPath(); x.arc(128, 128, 128, 0, 7); x.fill(); x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 6; for (let i = 0; i < 5; i++) { x.beginPath(); for (let a = 0; a < 9; a += .1) { const r = a * 13; x.lineTo(128 + Math.cos(a + i * 1.25) * r, 128 + Math.sin(a + i * 1.25) * r); } x.stroke(); } return new T.CanvasTexture(c); }
  function carpetTex(col) {
    const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), m = 256;
    const ring = (r, f) => { x.fillStyle = f; x.beginPath(); x.arc(m, m, r, 0, 7); x.fill(); };
    ring(256, '#f2c230'); ring(236, '#d8473f'); ring(214, '#2f5fb3'); ring(150, '#f2c230'); ring(120, '#d8473f'); ring(60, '#2f5fb3');
    x.strokeStyle = '#f2c230'; x.lineWidth = 7; x.lineCap = 'round';
    const curl = (a, r, s) => { x.save(); x.translate(m + Math.cos(a) * r, m + Math.sin(a) * r); x.rotate(a + Math.PI / 2); x.scale(s, s); x.beginPath(); x.moveTo(0, 10); x.lineTo(0, 0); x.bezierCurveTo(0, -9, -6, -13, -11, -12); x.bezierCurveTo(-16, -11, -16, -5, -12, -3); x.moveTo(0, 0); x.bezierCurveTo(0, -9, 6, -13, 11, -12); x.bezierCurveTo(16, -11, 16, -5, 12, -3); x.stroke(); x.restore(); };
    for (let i = 0; i < 16; i++) curl(i / 16 * Math.PI * 2, 182, 1.6); x.strokeStyle = '#fff'; for (let i = 0; i < 8; i++) curl(i / 8 * Math.PI * 2, 90, 1.1);
    x.fillStyle = col; x.beginPath(); x.arc(m, m, 34, 0, 7); x.fill(); return new T.CanvasTexture(c);
  }
  function screenTex(title) { const c = document.createElement('canvas'); c.width = 512; c.height = 300; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#1f4fa0'); g.addColorStop(1, '#0b1a3a'); x.fillStyle = g; x.fillRect(0, 0, 512, 300); x.fillStyle = '#f4c95d'; x.font = '800 30px Nunito,sans-serif'; x.textAlign = 'center'; x.fillText('БУКТРЕЙЛЕР', 256, 60); x.beginPath(); x.arc(256, 150, 46, 0, 7); x.fill(); x.fillStyle = '#0b1a3a'; x.beginPath(); x.moveTo(240, 125); x.lineTo(240, 175); x.lineTo(280, 150); x.fill(); x.fillStyle = '#fff'; x.fillText(title, 256, 250); return new T.CanvasTexture(c); }
  const glow = (c, s) => { const sp = new T.Sprite(new T.SpriteMaterial({ map: Avatars.glowTex(c), transparent: true, depthWrite: false, blending: T.AdditiveBlending })); sp.scale.set(s, s, 1); return sp; };

  /* ---------- сахна қаңқасы ---------- */
  function newScene(sky, fogNear, fogFar) {
    const s = { scene: new T.Scene(), root: new T.Group(), pois: [], items: [], solids: [], anims: [], labels: document.createElement('div'), others: {} };
    s.scene.background = new T.Color(sky); s.scene.fog = new T.Fog(sky, fogNear, fogFar); s.scene.add(s.root);
    s.scene.add(new T.HemisphereLight('#dff0ff', '#4a6a3a', .55));
    const sun = new T.DirectionalLight('#fff1d6', .85); sun.position.set(30, 60, 20); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, far: 220 }); sun.shadow.bias = -.0005; s.scene.add(sun, sun.target); s.sun = sun;
    s.labels.className = 'lbl-layer'; return s;
  }
  function api(s, seed) {
    const add = (o, x, y, z, parent) => { o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; (parent || s.root).add(o); return o; };
    return { root: s.root, M, add, emojiTex, label: Avatars.label, rand: rnd(seed), addPoi: o => addPoi(s, o) };
  }
  function addPoi(s, o) {
    const d = document.createElement('button'); d.className = 'poi-label' + (o.cls ? ' ' + o.cls : ''); if (o.color) d.style.setProperty('--c', o.color);
    d.innerHTML = `<span class="pi">${o.icon}</span><span>${o.label}</span>`; d.onclick = e => { e.stopPropagation(); o.open(); }; s.labels.appendChild(d); o.el = d; s.pois.push(o); return o;
  }

  /* ---------- Қазақстан картасы ---------- */
  function buildKZ() {
    const s = newScene('#7cc4f0', 260, 700); s.kind = 'kz';
    const a = api(s, 4242), env = KZ.build(a); s.env = env; s.pumps = a.pumps; s.heightAt = env.heightAt;
    env.ZONES.forEach((z, i) => { const w = WORLDS.find(q => q.id === z.w), [x, zz] = env.toXZ(z.seed[0], z.seed[1]); addPoi(s, { id: 'zone' + i, kind: 'zone', icon: w.icon, label: `${w.name}<i>${z.region}</i>`, cls: 'zone-label', color: w.color, pos: new T.Vector3(x, 14, zz), open: () => App.openWorldCard(w) }); });
    WORLDS.forEach(w => { const [lon, lat] = env.PORTALS[w.id], [x, z] = env.toXZ(lon, lat);
      portal(s, x, z, w.color, w.icon, 1, { id: 'p_' + w.id, kind: 'portal', icon: '🌀', label: w.short + ' әлемі', color: w.color, open: () => { World.stamp(w.id); enterValue(w); } });
      w.books.forEach((b, k) => { const an = k / 3 * Math.PI * 2 + .6; floatBook(s, x + Math.cos(an) * 8, z + Math.sin(an) * 8, w.color, () => Book.open(Books.world(w), 'lit:' + b.id)); }); });
    HOLIDAYS.forEach(h => { const [x, z] = env.toXZ(h.lon, h.lat); portal(s, x, z, h.color, h.icon, .75, { id: 'p_' + h.id, kind: 'portal', icon: h.icon, label: h.name + ' · ' + h.date, cls: 'holiday', color: h.color, open: () => { World.stamp(h.id); enterValue(holidayWorld(h)); } }); });
    { const [x, z] = env.toXZ(70.4, 50.6); museumGate(s, x, z); }
    const [sx, sz] = env.toXZ(71.2, 51.0); s.spawn = { x: sx, z: sz, ry: Math.PI };
    clouds(s, 18, 300, 45);
    return s;
  }
  function portal(s, x, z, col, icon, sc, poi) {
    const h = s.heightAt(x, z), g = new T.Group(); g.position.set(x, h, z); g.scale.setScalar(sc * 1.4); s.root.add(g);
    const base = new T.Mesh(new T.CylinderGeometry(3.2, 3.5, .4, 24), M('#e8e0cc')); base.position.y = .2; g.add(base);
    const disc = new T.Mesh(new T.CircleGeometry(2.9, 32), new T.MeshBasicMaterial({ map: carpetTex(col) })); disc.rotation.x = -Math.PI / 2; disc.position.y = .42; g.add(disc);
    [-2.2, 2.2].forEach(px => { const p = new T.Mesh(new T.BoxGeometry(.7, 5, .7), M('#d9cfb6')); p.position.set(px, 2.9, 0); p.castShadow = true; g.add(p); const cap = new T.Mesh(new T.BoxGeometry(1, .4, 1), M(col)); cap.position.set(px, 5.5, 0); g.add(cap); });
    const arch = new T.Mesh(new T.TorusGeometry(2.2, .35, 8, 24, Math.PI), M(col)); arch.position.y = 5.5; g.add(arch);
    const ring = new T.Mesh(new T.TorusGeometry(1.7, .14, 8, 40), new T.MeshBasicMaterial({ color: '#ffe9a8' })); ring.position.y = 3.2; g.add(ring);
    const sw = new T.Mesh(new T.CircleGeometry(1.65, 40), new T.MeshBasicMaterial({ map: swirlTex(col), transparent: true, side: T.DoubleSide })); sw.position.y = 3.2; g.add(sw);
    const ic = new T.Sprite(new T.SpriteMaterial({ map: emojiTex(icon), transparent: true })); ic.scale.set(2, 2, 1); ic.position.y = 8.6; g.add(ic);
    const gl = glow(col, 9); gl.position.y = 3.4; g.add(gl);
    s.anims.push(t => { sw.rotation.z = -t * 1.5; ic.position.y = 8.6 + Math.sin(t * 2) * .3; gl.material.opacity = .6 + Math.sin(t * 3) * .2; });
    poi.pos = new T.Vector3(x, h + 12 * sc, z); poi.g = g; poi.r = 5 * sc; addPoi(s, poi); s.solids.push({ x, z, r: 2.2 * sc });
  }
  function floatBook(s, x, z, col, open) {
    const h = s.heightAt(x, z), g = new T.Group(); g.position.set(x, h + 2.4, z); s.root.add(g);
    const bm = Models.build('book', { col }); bm.scale.setScalar(1.9); bm.rotation.x = .5; bm.position.y = -.8; g.add(bm); s.anims.push(t => bm.userData.anim(t));
    g.add(glow('#fff2b0', 3.4)); const ph = Math.random() * 6;
    s.anims.push(t => { g.position.y = h + 2.4 + Math.sin(t * 1.6 + ph) * .3; g.rotation.y = t * .8 + ph; });
    s.items.push({ g, pos: new T.Vector3(x, h, z), book: true, open, done: false });
  }
  function clouds(s, n, spread, y) { const r = rnd(7); for (let i = 0; i < n; i++) { const c = new T.Group(); for (let k = 0; k < 5; k++) { const sp = new T.Mesh(new T.SphereGeometry(4 + r() * 3, 8, 6), new T.MeshLambertMaterial({ color: '#ffffff' })); sp.position.set(k * 4.5 - 9, r() * 2, r() * 3); c.add(sp); } c.position.set(r() * spread * 2 - spread, y + r() * 15, r() * spread * 1.2 - spread * .6); s.root.add(c); s.anims.push((t, dt) => { c.position.x += dt * 2; if (c.position.x > spread) c.position.x = -spread; }); } }

  /* ---------- Пәндік әлем (құндылық) ---------- */
  const RIVER_Z = x => 30 + Math.sin(x * .09) * 4;
  function valueHeight(x, z) {
    const r = Math.hypot(x, z); let h = (Math.sin(x * .08) * Math.cos(z * .07) * 2 + Math.sin(x * .031 + z * .027) * 3 + 2.5) * smooth(26, 62, r); h += Math.max(0, r - 64) * .35;
    const dz = Math.abs(z - RIVER_Z(x)); if (dz < 6 && r < 75) h = Math.min(h, -1.2 + dz * dz * .05) - (dz < 4 ? (4 - dz) * .25 : 0); return h;
  }
  function buildValue(world) {
    const s = newScene('#6fbfee', 70, 190); s.kind = 'value'; s.world = world; s.heightAt = valueHeight; s.limit = 72;
    const a = api(s, world.id.charCodeAt(1) * 7919), rand = a.rand, add = a.add;
    const geo = new T.PlaneGeometry(240, 240, 120, 120); geo.rotateX(-Math.PI / 2);
    const base = new T.Color(world.ground), tint = new T.Color(world.color), cols = [], p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), h = valueHeight(x, z); p.setY(i, h); const c = base.clone(); c.lerp(tint, .08 + .05 * Math.sin(x * .2 + z * .13)); if (h > 9) c.lerp(new T.Color('#b9b39a'), Math.min(1, (h - 9) / 10)); if (h < -.4) c.set('#d9c98f'); cols.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const ground = new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true })); ground.receiveShadow = true; s.root.add(ground); s.root.userData.ground = ground;
    const wg = new T.PlaneGeometry(170, 9, 80, 1); wg.rotateX(-Math.PI / 2); const wp = wg.attributes.position; for (let i = 0; i < wp.count; i++) wp.setZ(i, wp.getZ(i) + RIVER_Z(wp.getX(i)));
    const water = new T.Mesh(wg, new T.MeshStandardMaterial({ color: '#3f9ee0', transparent: true, opacity: .82, roughness: .15 })); water.position.y = -.55; s.root.add(water);
    for (let i = 0; i < 26; i++) { const an = i / 26 * Math.PI * 2 + rand() * .1, r = 105 + rand() * 18, h = 22 + rand() * 22; const m = new T.Mesh(new T.ConeGeometry(14 + rand() * 8, h, 5), M('#9aa3ad')); m.position.set(Math.cos(an) * r, h / 2 + 5, Math.sin(an) * r); s.root.add(m); const cap = new T.Mesh(new T.ConeGeometry(6.8, h * .3, 5), M('#ffffff')); cap.position.y = h * .36; m.add(cap); }
    const carpet = new T.Mesh(new T.CircleGeometry(6, 48), new T.MeshLambertMaterial({ map: carpetTex(world.color) })); carpet.rotation.x = -Math.PI / 2; carpet.position.y = .04; s.root.add(carpet);
    const ob = key => () => Book.open(world.holiday ? Books.holiday(world.holiday) : Books.world(world), key);
    const P = { book: [0, -7], museum: [-16, -11], lab0: [16, -11], lab1: [19, 5], lab2: [3, -24], trailer: [-18, 5], tasks: [8, 14], kase: [-8, 14] };
    { const [x, z] = P.book, g = new T.Group(); add(g, x, 0, z); add(new T.Mesh(new T.CylinderGeometry(.5, .8, 1.3, 8), M('#8a5a2b')), 0, .65, 0, g); const b = new T.Group(); b.position.y = 1.45; b.rotation.x = -.5; g.add(b); [-1, 1].forEach(sg => { const pg = new T.Mesh(new T.BoxGeometry(.9, .06, 1.2), M('#fff8e6')); pg.position.x = sg * .46; pg.rotation.z = sg * .12; b.add(pg); const cv = new T.Mesh(new T.BoxGeometry(.95, .04, 1.26), M(world.color)); cv.position.set(sg * .47, -.05, 0); cv.rotation.z = sg * .12; b.add(cv); }); const gl = glow('#fff2b0', 3); gl.position.y = 1.7; g.add(gl); a.addPoi({ id: 'book', icon: '📖', label: 'Кітап бөлімі', g, pos: new T.Vector3(x, 3.4, z), open: ob() }); s.solids.push({ x, z, r: 1 }); }
    { const [x, z] = P.museum, g = new T.Group(); add(g, x, 0, z); g.rotation.y = .6; add(new T.Mesh(new T.BoxGeometry(8, .6, 6), M('#e8e0cc')), 0, .3, 0, g); for (let i = 0; i < 4; i++) for (const zz of [-2.4, 2.4]) add(new T.Mesh(new T.CylinderGeometry(.28, .32, 3.6, 10), M('#fbf6ea')), -3 + i * 2, 2.4, zz, g); add(new T.Mesh(new T.BoxGeometry(8.4, .5, 6.4), M('#d9cfb6')), 0, 4.4, 0, g); const roof = add(new T.Mesh(new T.ConeGeometry(5.6, 2.2, 4), M(world.color)), 0, 5.75, 0, g); roof.rotation.y = Math.PI / 4; roof.scale.z = .75; const ex = Models.build(world.museum[0].model || 'goldman'); ex.position.y = .6; ex.scale.setScalar(1.3); g.add(ex); s.anims.push(t => { ex.userData.anim(t); ex.rotation.y = t * .5; }); a.addPoi({ id: 'museum', icon: '🏛️', label: 'Мұражай · кіру', g, pos: new T.Vector3(x, 7.4, z), open: () => enterMuseum(world.holiday ? 'center' : world.id) }); s.solids.push({ x, z, r: 4.6 }); }
    world.labs.forEach((lab, i) => { const [x, z] = P['lab' + i], g = new T.Group(); add(g, x, 0, z); g.rotation.y = Math.atan2(-x, -z); add(new T.Mesh(new T.CylinderGeometry(3.2, 3.2, 2.4, 24), M('#f6f1e4', { flatShading: false })), 0, 1.2, 0, g); add(new T.Mesh(new T.CylinderGeometry(3.24, 3.24, .45, 24, 1, true), M(i ? '#2f5fb3' : '#d8473f', { flatShading: false })), 0, 2.05, 0, g); add(new T.Mesh(new T.ConeGeometry(3.5, 1.9, 24), M('#efe6d2', { flatShading: false })), 0, 3.35, 0, g); add(new T.Mesh(new T.TorusGeometry(.65, .12, 8, 20), M('#a8742e')), 0, 4.25, 0, g).rotation.x = Math.PI / 2; add(new T.Mesh(new T.BoxGeometry(1.3, 1.9, .2), M('#c1462f')), 0, .95, 3.15, g); const ic = new T.Sprite(new T.SpriteMaterial({ map: emojiTex(lab.icon), transparent: true })); ic.scale.set(1.2, 1.2, 1); ic.position.set(0, 2.05, 3.4); g.add(ic); a.addPoi({ id: 'lab' + i, icon: lab.icon, label: lab.subject + ' · зертхана', g, pos: new T.Vector3(x, 5.6, z), open: () => Acts.lab(world, i) }); s.solids.push({ x, z, r: 3.4 }); });
    { const [x, z] = P.trailer, g = new T.Group(); add(g, x, 0, z); g.rotation.y = Math.atan2(-x, -z); [-2.6, 2.6].forEach(px => add(new T.Mesh(new T.BoxGeometry(.3, 5, .3), M('#8a5a2b')), px, 2.5, 0, g)); add(new T.Mesh(new T.BoxGeometry(5.6, 3.4, .25), M('#c1462f')), 0, 3.3, 0, g); const scr = new T.Mesh(new T.PlaneGeometry(5.1, 2.95), new T.MeshBasicMaterial({ map: screenTex(world.short) })); scr.position.set(0, 3.3, .14); g.add(scr); a.addPoi({ id: 'trailer', icon: '🎬', label: 'Буктрейлер', g, pos: new T.Vector3(x, 5.9, z), open: () => Acts.trailer(world) }); s.solids.push({ x, z, r: 1.5 }); }
    { const [x, z] = P.tasks, g = new T.Group(); add(g, x, 0, z); ['#e8505b', '#f2c230', '#3fa7f5'].forEach((c, i) => { const s2 = add(new T.Mesh(new T.DodecahedronGeometry(.9), M(c)), (i - 1) * 2, .8, 0, g); s2.rotation.set(i, i * 2, 0); const n = Avatars.label(String(i + 1), { bg: 'rgba(255,255,255,.95)', color: '#0b1a3a', h: .6 }); n.position.set((i - 1) * 2, 2.2, 0); g.add(n); }); a.addPoi({ id: 'tasks', icon: '🧩', label: 'Тапсырмалар', g, pos: new T.Vector3(x, 3.4, z), open: ob('tasks') }); s.solids.push({ x, z, r: 3 }); }
    { const [x, z] = P.kase, g = new T.Group(); add(g, x, 0, z); const elder = Models.build(world.case.npc === 'Әже' ? 'aje' : 'ata'); elder.scale.setScalar(1.55); g.add(elder); g.rotation.y = Math.atan2(-x, -z); a.addPoi({ id: 'case', icon: '💬', label: 'Өмірлік жағдаят · ' + world.case.npc, g, pos: new T.Vector3(x, 3.6, z), open: ob('case') }); s.solids.push({ x, z, r: 1 }); }
    scatterValue(s, rand);
    world.quests.forEach((q, qi) => questItems(s, world, q, qi, rand));
    clouds(s, 9, 120, 38);
    s.spawn = { x: 0, z: 6, ry: Math.PI };
    return s;
  }
  function scatterValue(s, rand) {
    const okSpot = (x, z, pad) => { const r = Math.hypot(x, z); if (r < 9 || r > 78) return false; if (Math.abs(z - RIVER_Z(x)) < 6) return false; return !s.solids.some(o => Math.hypot(o.x - x, o.z - z) < o.r + pad) && !(Math.abs(x) < 22 && z > -16 && z < 18 && r < 24); };
    const trunk = new T.InstancedMesh(new T.CylinderGeometry(.18, .26, 1.6, 6), M('#7a4f2a'), 300), crown = new T.InstancedMesh(new T.IcosahedronGeometry(1.25, 0), M('#3f9b48'), 160), crown2 = new T.InstancedMesh(new T.ConeGeometry(1.1, 2.6, 7), M('#2f7d43'), 160);
    const d = new T.Object3D(); let n = 0, n2 = 0;
    for (let i = 0; i < 600 && n + n2 < 300; i++) { const x = rand() * 160 - 80, z = rand() * 160 - 80; if (!okSpot(x, z, 2)) continue; const h = valueHeight(x, z), sc = .8 + rand() * .8; d.position.set(x, h + .8 * sc, z); d.scale.setScalar(sc); d.rotation.y = rand() * 3; d.updateMatrix(); trunk.setMatrixAt(n + n2, d.matrix); d.position.y = h + 2.3 * sc; d.updateMatrix(); if (rand() < .55 && n < 160) crown.setMatrixAt(n++, d.matrix); else if (n2 < 160) crown2.setMatrixAt(n2++, d.matrix); }
    trunk.count = n + n2; crown.count = n; crown2.count = n2; [trunk, crown, crown2].forEach(m => { m.castShadow = true; s.root.add(m); });
    const grass = new T.InstancedMesh(new T.ConeGeometry(.06, .5, 3), new T.MeshLambertMaterial({ color: '#5fb24a' }), 2500); let gi = 0;
    for (let i = 0; i < 4000 && gi < 2500; i++) { const x = rand() * 120 - 60, z = rand() * 120 - 60; if (Math.abs(z - RIVER_Z(x)) < 4.5 || Math.hypot(x, z) < 6.2) continue; d.position.set(x, valueHeight(x, z) + .22, z); d.scale.set(1, .6 + rand() * .9, 1); d.rotation.set(rand() * .3, 0, rand() * .3); d.updateMatrix(); grass.setMatrixAt(gi++, d.matrix); }
    grass.count = gi; s.root.add(grass);
    ['#ff6b8a', '#ffd23f', '#ffffff', '#c77dff', '#ff9f43'].forEach(c => { const fl = new T.InstancedMesh(new T.CylinderGeometry(.22, .22, .06, 6), new T.MeshLambertMaterial({ color: c }), 120); let fi = 0; for (let i = 0; i < 300 && fi < 120; i++) { const x = rand() * 110 - 55, z = rand() * 110 - 55; if (Math.abs(z - RIVER_Z(x)) < 5 || Math.hypot(x, z) < 7) continue; d.position.set(x, valueHeight(x, z) + .35, z); d.scale.setScalar(.7 + rand()); d.rotation.set(0, 0, 0); d.updateMatrix(); fl.setMatrixAt(fi++, d.matrix); } fl.count = fi; s.root.add(fl); });
  }
  function questItems(s, world, q, qi, rand) {
    const done = Progress.questItems(world.id, qi), spots = [];
    for (let k = 0; k < q.count; k++) {
      let x, z, tries = 0;
      do { if (q.kind === 'trash') { x = -40 + k * 11 + rand() * 4; z = RIVER_Z(x) + (rand() < .5 ? -1 : 1) * (2 + rand() * 4); } else if (q.kind === 'plant') { x = -30 + k * 16 + rand() * 3; z = RIVER_Z(x) - 9 - rand() * 3; } else { const an = (k / q.count) * Math.PI * 2 + rand() * .6, r = 24 + rand() * 24; x = Math.cos(an) * r; z = Math.sin(an) * r; } tries++; }
      while (tries < 30 && (s.solids.some(o => Math.hypot(o.x - x, o.z - z) < o.r + 2) || spots.some(o => Math.hypot(o[0] - x, o[1] - z) < 5) || (q.kind !== 'trash' && Math.abs(z - RIVER_Z(x)) < 5)));
      spots.push([x, z]); const y = valueHeight(x, z), g = new T.Group(); g.position.set(x, Math.max(y, q.kind === 'trash' ? -.5 : y), z); s.root.add(g);
      const it = { q, qi, k, g, world, pos: g.position.clone(), done: done.includes(k), kind: q.kind }; makeItem(it); s.items.push(it);
    }
  }
  function makeItem(it) {
    const g = it.g, k = it.k; g.clear();
    const add = (o, x, y, z) => { o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    const sprite = (e, sc, y) => { const sp = new T.Sprite(new T.SpriteMaterial({ map: emojiTex(e), transparent: true })); sp.scale.set(sc, sc, 1); sp.position.y = y; g.add(sp); return sp; };
    const gl = (c, sc, y) => { const sp = glow(c, sc); sp.position.y = y; g.add(sp); return sp; };
    if (it.kind === 'find' || it.kind === 'violation') { const lab = it.q.items[k] || '⭐ Жұлдыз', e = lab.split(' ')[0], name = lab.split(' ').slice(1).join(' '); if (it.done) { if (it.kind === 'violation') sprite('✅', 1, 1); return; }
      add(new T.Mesh(new T.CylinderGeometry(.9, 1, .3, 16), M(it.kind === 'find' ? '#e0a92b' : '#d8473f')), 0, .15, 0); gl(it.kind === 'find' ? '#fff3a0' : '#ff9a9a', 3.4, 1.4);
      const mk = (EXTRA.item[e] || ['star']), mdl = Models.build(mk[0], { col: mk[1] }) || Models.build('star'); mdl.scale.setScalar(it.kind === 'find' ? 1.15 : 1.3); mdl.position.y = .3; g.add(mdl); g.userData.model = mdl;
      if (name) { const lb = Avatars.label(name, { bg: 'rgba(255,255,255,.95)', color: '#0b1a3a', h: .45 }); lb.position.y = 2.7; g.add(lb); } }
    else if (it.kind === 'collect') { if (it.done) return; const rod = add(new T.Mesh(new T.CylinderGeometry(.09, .09, 2.4, 8), M('#e0a92b', { emissive: '#6a4a00', metalness: .4 })), 0, 1.6, 0); rod.rotation.z = .7; gl('#ffd36b', 3.2, 1.6); g.userData.spin = rod; }
    else if (it.kind === 'trash') { if (it.done) return; const t = k % 3; if (t === 0) add(new T.Mesh(new T.CylinderGeometry(.18, .18, .8, 10), M('#7fd0ff', { transparent: true, opacity: .8 })), 0, .3, 0).rotation.z = Math.PI / 2; else if (t === 1) add(new T.Mesh(new T.SphereGeometry(.45, 8, 6), M('#3a3a3a')), 0, .3, 0).scale.y = .7; else add(new T.Mesh(new T.CylinderGeometry(.15, .15, .35, 10), M('#d8473f', { metalness: .6 })), 0, .2, 0); gl('#ff7a7a', 2, .6); }
    else if (it.kind === 'plant') { if (it.done) { tree(g, 1); return; } const hole = new T.Mesh(new T.CircleGeometry(.9, 16), new T.MeshLambertMaterial({ color: '#5a3a1e' })); hole.rotation.x = -Math.PI / 2; hole.position.y = .05; g.add(hole); sprite('🌱', .9, 1.2); gl('#b6ff9a', 2.2, .8); }
    else if (it.kind === 'fix') { add(new T.Mesh(new T.CylinderGeometry(.12, .12, 2, 6), M('#888')), 0, 1, 0); add(new T.Mesh(new T.BoxGeometry(2.4, .1, 1.5), M(it.done ? '#2f6fe0' : '#2b3550', { metalness: .5, roughness: .3, emissive: it.done ? '#0a2a66' : '#000' })), 0, 2.1, 0).rotation.x = -.5; if (!it.done) { g.userData.spark = sprite('⚡', 1.2, 2.9); gl('#ffe066', 2.2, 2.6); } }
    else if (it.kind === 'tap') { add(new T.Mesh(new T.CylinderGeometry(.2, .25, 1.6, 8), M('#5a7fa8', { metalness: .5 })), 0, .8, 0); add(new T.Mesh(new T.CylinderGeometry(.08, .08, .6, 8), M('#9ab', { metalness: .6 })), 0, 1.4, .3).rotation.x = Math.PI / 2; add(new T.Mesh(new T.TorusGeometry(.18, .05, 6, 12), M(it.done ? '#3fbf6a' : '#d8473f')), 0, 1.75, 0).rotation.x = Math.PI / 2; if (!it.done) { const dr = new T.Mesh(new T.SphereGeometry(.07, 6, 5), new T.MeshBasicMaterial({ color: '#4fb8ff' })); dr.position.set(0, 1.3, .6); g.add(dr); g.userData.drip = dr; gl('#9ad7ff', 2, 1.2); } }
  }
  function tree(g, sc) { const t = new T.Group(); const a = new T.Mesh(new T.CylinderGeometry(.15, .22, 1.4, 6), M('#7a4f2a')); a.position.y = .7; const b = new T.Mesh(new T.IcosahedronGeometry(1, 0), M('#4caf50')); b.position.y = 2; t.add(a, b); t.scale.setScalar(sc); g.add(t); return t; }
  function collect(it) {
    if (it.done) return; it.done = true; burst(it.pos.clone().add(new T.Vector3(0, 1.4, 0)), it.world.color); Sfx.chime();
    makeItem(it); if (it.kind === 'plant') { const t = it.g.children[it.g.children.length - 1]; t.scale.setScalar(.05); cur.anims.push(growAnim(t)); }
    const n = Progress.collectItem(it.world.id, it.qi, it.k); App.toast(`${it.q.title}: ${n} / ${it.q.count}`); updateHud();
    if (n >= it.q.count) { Progress.award(it.world.id + ':quest:' + it.qi, 20, null, 'Квест: ' + it.q.title); Voice.say(TEXT.phrases.questDone); App.celebrate(); }
  }
  function growAnim(t) { let k = 0; return (tt, dt) => { k = Math.min(1, k + dt * .8); t.scale.setScalar(.05 + k * 1.05); }; }
  function burst(p, col) {
    const g = new T.Group(); g.position.copy(p); cur.root.add(g); let life = 0; const s = cur;
    for (let i = 0; i < 18; i++) { const sp = new T.Mesh(new T.OctahedronGeometry(.12), new T.MeshBasicMaterial({ color: i % 2 ? col : '#ffe066' })); sp.userData.v = new T.Vector3(Math.random() - .5, Math.random() * .8 + .4, Math.random() - .5).multiplyScalar(8); g.add(sp); }
    const fn = (t, dt) => { life += dt; g.children.forEach(c => { c.position.addScaledVector(c.userData.v, dt); c.userData.v.y -= dt * 12; }); if (life > 1.2) { s.root.remove(g); s.anims.splice(s.anims.indexOf(fn), 1); } }; s.anims.push(fn);
  }

  /* ---------- кейіпкер ---------- */
  function ensureHero(s) {
    if (!hero) { hero = new T.Group(); heroModel.leopard = Avatars.leopard(); heroModel.eagle = Avatars.eagle(); hero.add(heroModel.leopard, heroModel.eagle); }
    if (hero.parent !== s.root) s.root.add(hero);
    if (rider) { hero.remove(rider.parent); rider = null; } if (heroLabel) hero.remove(heroLabel);
    const u = App.user(); rider = Avatars.build(u ? u.avatar.t : 'smile', u ? u.avatar.c : '#f4b942'); const rw = new T.Group(); rw.add(rider); rw.scale.setScalar(.42); hero.add(rw);
    heroLabel = Avatars.label(u ? u.first : 'Мен', { glow: '#f4c95d', h: .5 }); hero.add(heroLabel);
  }
  function setMode(m, silent) {
    if (m === 'overview') { if (cur && cur.kind === 'kz') { mode = 'overview'; if (hero) hero.visible = false; mount('map'); syncUI(); App.presence({ w: 'map' }); kick(); } else exitToMap(); return; }
    if (!cur) return; const was = mode; mode = m; hero.visible = true;
    heroModel.leopard.visible = m === 'leopard'; heroModel.eagle.visible = m === 'eagle';
    rider.parent.position.set(0, m === 'leopard' ? .95 : .55, -.1); heroLabel.position.y = m === 'leopard' ? 2.1 : 1.6;
    if (m === 'eagle' && st.alt < 6) st.alt = cur.kind === 'kz' ? 18 : 9;
    if (was === 'overview') { mount('full'); camera.position.set(st.pos.x, st.pos.y + 20, st.pos.z + 30); }
    syncUI(); kick(); if (!silent) Voice.say(m === 'leopard' ? TEXT.phrases.leopard : TEXT.phrases.eagle);
  }
  function syncUI() {
    document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
    document.getElementById('flyBtns').hidden = mode !== 'eagle';
    if (cur) { document.getElementById('wTitle').textContent = cur.kind === 'kz' ? 'Қазақстан · «Адал азамат» картасы' : cur.kind === 'museum' ? '🏛️ Виртуалды мұражай' : cur.world.name; document.getElementById('wSub').textContent = cur.kind === 'kz' ? 'Порталдар мен кітаптарды тап · әр өңір – бір құндылық' : cur.kind === 'museum' ? '6 зал – 6 құндылық · ортада мереке жәдігерлері · жәдігерге жақында' : cur.world.icon + ' ' + (cur.world.labs.length ? [...new Set(cur.world.labs.map(l => l.subject))] : cur.world.subjects).join(' · ') + ' · «' + cur.world.motto + '»'; }
    updateHud();
  }
  function setupJoystick() {
    const pad = document.getElementById('joy'), knob = pad.querySelector('i'); let id = null, c = null;
    pad.addEventListener('pointerdown', e => { id = e.pointerId; const r = pad.getBoundingClientRect(); c = { x: r.left + r.width / 2, y: r.top + r.height / 2, R: r.width / 2 }; pad.setPointerCapture(id); move(e); e.stopPropagation(); });
    const move = e => { if (e.pointerId !== id) return; let dx = e.clientX - c.x, dy = e.clientY - c.y; const l = Math.hypot(dx, dy); if (l > c.R) { dx *= c.R / l; dy *= c.R / l; } joy.x = dx / c.R; joy.y = dy / c.R; knob.style.transform = `translate(${dx}px,${dy}px)`; };
    pad.addEventListener('pointermove', move); const end = () => { id = null; joy.x = joy.y = 0; knob.style.transform = ''; }; pad.addEventListener('pointerup', end); pad.addEventListener('pointercancel', end);
    const hold = (b, v) => { b.addEventListener('pointerdown', e => { fly.up = v; e.stopPropagation(); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => fly.up = 0)); };
    hold(document.getElementById('flyUp'), 1); hold(document.getElementById('flyDown'), -1);
  }
  function hitOwner(hit, list, get) { if (!hit) return null; return list.find(x => { let o = hit.object; while (o) { if (o === get(x)) return true; o = o.parent; } return false; }); }
  function click(e) {
    const r = renderer.domElement.getBoundingClientRect(); mouse.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(mouse, camera);
    const live = cur.items.filter(i => !i.done || i.book);
    const it = hitOwner(ray.intersectObjects(live.map(i => i.g), true)[0], live, i => i.g);
    if (it) { if (it.book) return it.open(); if (mode !== 'overview') { st.target = { p: it.pos.clone(), item: it }; return; } }
    const withG = cur.pois.filter(p => p.g); const pg = hitOwner(ray.intersectObjects(withG.map(p => p.g), true)[0], withG, p => p.g); if (pg) return pg.open();
    const gh = ray.intersectObject(cur.root.userData.ground)[0]; if (!gh) return;
    if (mode === 'overview') { if (KZ.inside(gh.point.x, gh.point.z)) { const z = KZ.zoneAt(gh.point.x, gh.point.z); App.openWorldCard(WORLDS.find(w => w.id === KZ.ZONES[z.i].w), { x: gh.point.x, z: gh.point.z }); } }
    else st.target = { p: gh.point.clone() };
  }

  /* ---------- жаңарту ---------- */
  function update(dt, t) {
    const s = cur; s.anims.slice().forEach(f => f(t, dt)); if (s.pumps) s.pumps.forEach((b, i) => b.rotation.z = Math.sin(t * 2 + i) * .3);
    if (mode === 'overview') {
      ov.yaw += (ov.tYaw - ov.yaw) * .08; ov.pitch += (ov.tPitch - ov.pitch) * .08; ov.dist += (ov.tDist - ov.dist) * .08; ov.tx += (ov.ttx - ov.tx) * .06; ov.tz += (ov.ttz - ov.tz) * .06;
      camera.position.set(ov.tx + Math.sin(ov.yaw) * Math.cos(ov.pitch) * ov.dist, Math.sin(ov.pitch) * ov.dist, ov.tz + Math.cos(ov.yaw) * Math.cos(ov.pitch) * ov.dist); camera.lookAt(ov.tx, 0, ov.tz);
      s.sun.position.set(ov.tx + 60, 120, ov.tz + 40); s.sun.target.position.set(ov.tx, 0, ov.tz);
    } else { moveHero(dt, t, s); if (s.kind === 'museum') museumUpdate(s); }
    const now = Date.now();
    Object.keys(s.others).forEach(id => { const o = s.others[id]; if (now - o.seen > 15000) { s.root.remove(o.g); delete s.others[id]; renderOnline(); return; } o.g.position.lerp(o.to, Math.min(1, dt * 5)); o.g.rotation.y += (o.ry - o.g.rotation.y) * Math.min(1, dt * 5); o.av.userData.anim && o.av.userData.anim(t, o.g.position.distanceTo(o.to) > .2); o.g.scale.setScalar(mode === 'overview' ? 3.5 : 1); });
    const w = stage.clientWidth, h = stage.clientHeight, v = new T.Vector3();
    s.pois.forEach(p => {
      let vis = true; if (p.kind === 'zone') vis = mode === 'overview'; else if (s.kind === 'kz' && mode === 'overview') vis = ov.dist < 230 || p.cls === 'holiday'; else if (s.kind === 'kz') vis = Math.hypot(p.pos.x - st.pos.x, p.pos.z - st.pos.z) < 70;
      if (vis) { v.copy(p.pos).project(camera); const sy = (1 - v.y) / 2 * h; vis = v.z < 1 && Math.abs(v.x) < 1.05 && sy > (mode === 'overview' ? 10 : 95) && sy < h - 30; if (vis) { p.el.style.transform = `translate(${(v.x + 1) / 2 * w}px,${sy}px) translate(-50%,-100%)`; p.el.classList.toggle('near', p === nearPoi); } }
      p.el.style.display = vis ? '' : 'none';
    });
    if (mode !== 'overview' && now - lastPres > 250) { const moved = lastSent.distanceTo(st.pos) > .25; if (moved || now - lastPres > 3000) { lastPres = now; lastSent.copy(st.pos); App.presence({ w: s.kind === 'kz' ? 'kz' : s.kind === 'museum' ? 'museum' : s.world.id, x: +st.pos.x.toFixed(2), y: +st.pos.y.toFixed(2), z: +st.pos.z.toFixed(2), ry: +st.ry.toFixed(2), m: mode }); } }
  }
  function moveHero(dt, t, s) {
    const fwdKey = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0) - joy.y, turnKey = (keys.KeyA || keys.ArrowLeft ? 1 : 0) - (keys.KeyD || keys.ArrowRight ? 1 : 0) - joy.x;
    const big = s.kind === 'kz', run = keys.ShiftLeft && mode === 'leopard' ? 1.8 : 1;
    let fwd = Math.max(-1, Math.min(1, fwdKey)), turn = Math.max(-1, Math.min(1, turnKey));
    if (Math.abs(fwd) > .05 || Math.abs(turn) > .05) st.target = null;
    if (st.target) { const d = st.target.p.clone().sub(st.pos); d.y = 0; const dist = d.length(), want = Math.atan2(d.x, d.z); let diff = want - st.ry; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2; turn = Math.max(-1, Math.min(1, diff * 3)); fwd = Math.abs(diff) < 1.2 ? Math.min(1, dist / 3 + .3) : .15; if (dist < (st.target.item ? 1.6 : .8)) st.target = null; }
    const maxSp = (mode === 'eagle' ? (big ? 34 : 15) : (big ? 13 : 9)) * run;
    st.speed += ((fwd * maxSp) - st.speed) * Math.min(1, dt * 4); st.ry += turn * dt * (mode === 'eagle' ? 1.6 : 2.6); st.bank += ((-turn * .5) - st.bank) * Math.min(1, dt * 3);
    const nx = st.pos.x + Math.sin(st.ry) * st.speed * dt, nz = st.pos.z + Math.cos(st.ry) * st.speed * dt;
    if (big) { if (mode === 'eagle' ? Math.abs(nx) < 200 && Math.abs(nz) < 120 : KZ.inside(nx, nz) && s.heightAt(nx, nz) > -.7) { st.pos.x = nx; st.pos.z = nz; } else { st.speed *= .3; st.target = null; } }
    else if (s.canWalk) { if (s.canWalk(nx, nz) || (mode === 'eagle' && Math.hypot(nx, nz) < 48)) { st.pos.x = nx; st.pos.z = nz; } else { st.speed *= .2; st.target = null; } }
    else { st.pos.x = nx; st.pos.z = nz; const r = Math.hypot(st.pos.x, st.pos.z); if (r > s.limit) { st.pos.x *= s.limit / r; st.pos.z *= s.limit / r; } }
    if (mode === 'leopard') s.solids.forEach(o => { const dx = st.pos.x - o.x, dz = st.pos.z - o.z, dd = Math.hypot(dx, dz); if (dd < o.r + .6 && dd > 0) { st.pos.x = o.x + dx / dd * (o.r + .6); st.pos.z = o.z + dz / dd * (o.r + .6); } });
    const gh = Math.max(s.heightAt(st.pos.x, st.pos.z), -.55); let climb = 0;
    if (mode === 'eagle') { climb = (keys.Space ? 1 : 0) - (keys.ShiftLeft || keys.KeyC ? 1 : 0) + fly.up; if (st.target && st.target.item) climb = st.alt > 2.5 ? -1 : 0; st.alt = Math.max(1.5, Math.min(big ? 70 : s.kind === 'museum' ? 14 : 45, st.alt + climb * dt * (big ? 14 : 9))); st.pos.y = gh + st.alt + Math.sin(t * 2) * .15; } else st.pos.y = gh;
    hero.position.copy(st.pos); hero.rotation.set(0, st.ry, 0); heroModel.eagle.rotation.z = st.bank; heroModel.eagle.rotation.x = -climb * .15;
    (mode === 'leopard' ? heroModel.leopard : heroModel.eagle).userData.anim(t, Math.abs(st.speed), climb || (st.speed > 2 ? .2 : 1)); rider.userData.anim && rider.userData.anim(t, st.speed > 1);
    if (Math.abs(st.speed) > 1) st.camYaw *= Math.pow(.2, dt);
    const back = mode === 'eagle' ? 13 : 8.5, up = mode === 'eagle' ? 5 : 4.2, yaw = st.ry + Math.PI + st.camYaw;
    const want = new T.Vector3(st.pos.x + Math.sin(yaw) * back, st.pos.y + up, st.pos.z + Math.cos(yaw) * back); want.y = Math.max(want.y, s.heightAt(want.x, want.z) + 1.5);
    camera.position.lerp(want, Math.min(1, dt * 4)); camera.lookAt(st.pos.x, st.pos.y + 1.4, st.pos.z);
    s.sun.position.set(st.pos.x + 30, st.pos.y + 50, st.pos.z + 20); s.sun.target.position.copy(st.pos);
    s.items.forEach(it => { const u = it.g.userData; if (u.model) { u.model.userData.anim(t); u.model.rotation.y = t * .8 + it.k; u.model.position.y = .3 + Math.sin(t * 2 + it.k) * .12; } if (u.bob) u.bob.position.y = 1.6 + Math.sin(t * 2 + it.k) * .25; if (u.spin) u.spin.rotation.y += dt * 2; if (u.spark) u.spark.material.opacity = Math.random() > .5 ? 1 : .3; if (u.drip) { u.drip.position.y -= dt * 3; if (u.drip.position.y < .1) u.drip.position.y = 1.3; }
      if (!it.done && !it.book) { const near = Math.hypot(it.pos.x - st.pos.x, it.pos.z - st.pos.z) < (mode === 'eagle' ? 3.5 : 2.6) && (mode === 'leopard' || st.alt < 6); if (near) collect(it); } });
    let best = null, bd = 1e9; s.pois.forEach(p => { if (p.kind === 'zone') return; const d = Math.hypot(p.pos.x - st.pos.x, p.pos.z - st.pos.z); if (d < bd) { bd = d; best = p; } });
    nearPoi = best && bd < (best.r ? best.r + 4 : 7) ? best : null;
    if (big && KZ.inside(st.pos.x, st.pos.z)) { const z = KZ.zoneAt(st.pos.x, st.pos.z).i; if (z !== lastZone) { if (lastZone >= 0) { const zz = KZ.ZONES[z], w = WORLDS.find(q => q.id === zz.w); App.toast(`${w.icon} ${zz.region}: ${w.name}`); Voice.say(TEXT.zones[w.id]); } lastZone = z; updateHud(); } }
  }
  function onPresence(p) {
    if (!cur || !p || p.id === App.myId()) return; const s = cur, here = s.kind === 'kz' ? p.w === 'kz' : s.kind === 'museum' ? p.w === 'museum' : p.w === s.world.id;
    if (!here) { if (s.others[p.id]) { s.root.remove(s.others[p.id].g); delete s.others[p.id]; renderOnline(); } return; }
    let o = s.others[p.id]; const key = p.av.t + p.av.c + p.name + (p.b ? 'b' : '');
    if (!o || o.key !== key) { if (o) s.root.remove(o.g); const g = new T.Group(), av = Avatars.build(p.av.t, p.av.c); av.scale.setScalar(1.25); g.add(av); const lb = Avatars.label((p.b ? '📖 ' : p.m === 'eagle' ? '🦅 ' : '🐆 ') + p.name, { glow: p.av.c, h: .5 }); lb.position.y = 2.3; g.add(lb); g.position.set(p.x || 0, p.y || 0, p.z || 0); s.root.add(g); o = s.others[p.id] = { g, av, key, to: new T.Vector3(), ry: 0, name: p.name, seen: Date.now() }; renderOnline(); }
    if (p.x != null) o.to.set(p.x, p.y, p.z); o.ry = p.ry || 0; o.seen = Date.now(); o.name = p.name;
  }
  function renderOnline() { const el = document.getElementById('worldOnline'); if (!el || !cur) return; const list = Object.values(cur.others); el.innerHTML = `<b>🟢 Осы әлемде: ${list.length + (App.user() ? 1 : 0)}</b>` + (App.user() ? `<span class="me">${App.user().first} (сен)</span>` : '') + list.map(o => `<span>${o.name}</span>`).join(''); }
  function updateHud() {
    const el = document.getElementById('questHud'); if (!el || !cur) return;
    if (cur.kind === 'kz') { const all = [...WORLDS.map(w => w.id), ...HOLIDAYS.map(h => h.id)], got = all.filter(id => Progress.isDone('kz:stamp:' + id)).length; const z = lastZone >= 0 ? KZ.ZONES[lastZone] : null, w = z && WORLDS.find(q => q.id === z.w);
      el.innerHTML = `<div class="qrow ${got >= all.length ? 'ok' : ''}"><span>🛂 Саяхат паспорты</span><b>${got}/${all.length}</b><i style="width:${got / all.length * 100}%"></i></div>` + (w ? `<div class="qrow zone" style="--c:${w.color}"><span>${w.icon} ${z.region}</span><b>${w.short}</b></div>` : ''); return; }
    if (cur.kind === 'museum') { const n = Progress.questItems('museum', 0).length, tot = cur.exhibits ? cur.exhibits.length : 29; el.innerHTML = `<div class="qrow ${n >= tot ? 'ok' : ''}"><span>🏛️ Көрілген жәдігерлер</span><b>${n}/${tot}</b><i style="width:${n / tot * 100}%"></i></div>`; return; }
    el.innerHTML = cur.world.quests.map((q, qi) => { const n = Progress.questItems(cur.world.id, qi).length; return `<div class="qrow ${n >= q.count ? 'ok' : ''}"><span>${n >= q.count ? '✅' : '🎯'} ${q.title}</span><b>${n}/${q.count}</b><i style="width:${n / q.count * 100}%"></i></div>`; }).join('');
  }
  function loop() {
    if (!cur || (mode === 'overview' && !visible) || document.body.classList.contains('in-book')) { raf = 0; return; }
    raf = requestAnimationFrame(loop); const dt = Math.min(.05, clock.getDelta()), t = clock.elapsedTime;
    if (!document.querySelector('.modal.open')) update(dt, t); renderer.render(cur.scene, camera);
  }
  function kick() { if (!raf && renderer) { clock.getDelta(); loop(); } }
  function use(s) { if (cur && cur !== s) cur.labels.remove(); cur = s; labelsBox.appendChild(s.labels); Net.livePresence().forEach(onPresence); renderOnline(); }


  /* ---------- Мереке әлемі (құндылық әлемінің үлгісімен) ---------- */
  function holidayWorld(h) {
    const hm = EXTRA.holidayMuseum[h.id] || ['star', null];
    return { id: h.id, holiday: h, name: h.name, short: h.name, icon: h.icon, color: h.color, ground: EXTRA.holidayGround[h.id] || '#a3cf74', subjects: ['Мереке әлемі'], motto: h.date, intro: h.intro,
      museum: [{ title: h.name, text: h.intro, model: hm[0], photo: hm[1], emoji: h.icon }], labs: [], quests: [h.quest],
      case: { npc: h.case.npc, title: h.name, text: h.case.text, options: h.case.options }, tasks: { write: { title: 'Жазылым', prompt: h.write }, speak: { title: 'Айтылым', prompt: h.speak, lang: 'kk-KZ' } }, trailer: h.paras };
  }
  function museumGate(s, x, z) {
    const h = s.heightAt(x, z), g = new T.Group(); g.position.set(x, h, z); g.scale.setScalar(1.3); s.root.add(g);
    const add = (o, a, b, c) => { o.position.set(a, b, c); o.castShadow = true; g.add(o); return o; };
    add(new T.Mesh(new T.BoxGeometry(9, .5, 6), M('#e8e0cc')), 0, .25, 0);
    for (let i = 0; i < 5; i++) add(new T.Mesh(new T.CylinderGeometry(.3, .35, 4, 12), M('#fbf6ea', { flatShading: false })), -3.6 + i * 1.8, 2.5, 2.2);
    add(new T.Mesh(new T.BoxGeometry(9.4, .6, 6.4), M('#d9cfb6')), 0, 4.8, 0);
    const roof = add(new T.Mesh(new T.ConeGeometry(6.4, 2.2, 4), M('#1f4fa0')), 0, 6.2, 0); roof.rotation.y = Math.PI / 4; roof.scale.z = .7;
    const gm = Models.build('goldman'); gm.position.set(0, .5, 0); gm.scale.setScalar(1.6); g.add(gm); s.anims.push(t => { gm.rotation.y = t * .6; });
    addPoi(s, { id: 'museum', kind: 'portal', icon: '🏛️', label: 'Виртуалды мұражай', color: '#1f4fa0', g, pos: new T.Vector3(x, h + 10, z), r: 6, open: () => enterMuseum('center') });
    s.solids.push({ x, z, r: 5 });
  }

  /* ---------- Виртуалды мұражай: ортадағы ротонда + 6 зал ---------- */
  const HALL_IN = 12, HALL_OUT = 40, HALL_W = 5.6;
  function exhibitsAll() {
    const list = [];
    WORLDS.forEach((w, i) => w.museum.forEach((m, k) => list.push({ id: w.id + ':' + k, wid: w.id, hall: i, k, m, color: w.color })));
    HOLIDAYS.forEach((h, k) => { const hm = EXTRA.holidayMuseum[h.id]; list.push({ id: h.id + ':m', wid: h.id, hall: -1, k, m: { title: h.name, text: h.intro, model: hm[0], photo: hm[1], emoji: h.icon }, color: h.color }); });
    return list;
  }
  function marbleTex() { const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? '#efe7d6' : '#d9cdb5'; x.fillRect(i * 64, j * 64, 64, 64); } x.strokeStyle = 'rgba(160,140,110,.25)'; for (let i = 0; i < 40; i++) { x.beginPath(); x.moveTo(Math.random() * 512, Math.random() * 512); x.bezierCurveTo(Math.random() * 512, Math.random() * 512, Math.random() * 512, Math.random() * 512, Math.random() * 512, Math.random() * 512); x.stroke(); } const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(10, 10); return t; }
  function photoPlane(key, w, h) {
    const ph = window.photo(key); if (!ph) return null; const g = new T.Group();
    const fr = new T.Mesh(new T.BoxGeometry(w + .24, h + .24, .1), M('#a8742e', { flatShading: false })); g.add(fr);
    const tex = new T.TextureLoader().load(ph.src); const pl = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex })); pl.position.z = .06; g.add(pl);
    return g;
  }
  function buildMuseum() {
    const s = newScene('#bfe3ff', 60, 160); s.kind = 'museum'; s.heightAt = () => 0; s.exhibits = [];
    const floor = new T.Mesh(new T.CircleGeometry(60, 64), new T.MeshStandardMaterial({ map: marbleTex(), roughness: .5 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; s.root.add(floor); s.root.userData.ground = floor;
    const wallM = M('#f6efe0', { flatShading: false }), add = (o, x, y, z, ry) => { o.position.set(x, y, z); o.rotation.y = ry || 0; o.castShadow = true; o.receiveShadow = true; s.root.add(o); return o; };
    // ротонда
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; if (WORLDS.some((w, k) => Math.abs(((a - k * Math.PI / 3) + Math.PI * 3) % (Math.PI * 2) - Math.PI) < .32)) continue; add(new T.Mesh(new T.CylinderGeometry(.35, .4, 5, 14), wallM), Math.cos(a) * 11.5, 2.5, Math.sin(a) * 11.5); }
    const ring = add(new T.Mesh(new T.TorusGeometry(11.5, .4, 8, 64), M('#e0a92b', { metalness: .5, flatShading: false })), 0, 5.1, 0); ring.rotation.x = Math.PI / 2;
    const carpet = new T.Mesh(new T.CircleGeometry(4, 48), new T.MeshLambertMaterial({ map: carpetTex('#1f4fa0') })); carpet.rotation.x = -Math.PI / 2; carpet.position.y = .02; s.root.add(carpet);
    // залдар
    WORLDS.forEach((w, i) => { const a = i * Math.PI / 3, c = Math.cos(a), sn = Math.sin(a), len = HALL_OUT - HALL_IN, mid = (HALL_IN + HALL_OUT) / 2, ry = -a;
      [-1, 1].forEach(side => { const wl = add(new T.Mesh(new T.BoxGeometry(len, 4.5, .4), wallM), c * mid - sn * side * (HALL_W + .2), 2.25, sn * mid + c * side * (HALL_W + .2), ry); const st = add(new T.Mesh(new T.BoxGeometry(len, .5, .45), M(w.color)), wl.position.x, 4.3, wl.position.z, ry); });
      add(new T.Mesh(new T.BoxGeometry(.4, 4.5, HALL_W * 2 + .8), M(w.color)), c * HALL_OUT, 2.25, sn * HALL_OUT, ry);
      const strip = new T.Mesh(new T.PlaneGeometry(len, 2.2), new T.MeshLambertMaterial({ color: w.color, transparent: true, opacity: .35 })); strip.rotation.set(-Math.PI / 2, 0, a); strip.position.set(c * mid, .03, sn * mid); s.root.add(strip);
      addPoi(s, { id: 'hall' + i, kind: 'hall', icon: w.icon, label: w.name + '<i>' + w.museum.length + ' жәдігер</i>', cls: 'zone-label', color: w.color, pos: new T.Vector3(c * (HALL_IN + 1.5), 5.6, sn * (HALL_IN + 1.5)), open: () => { const p = c * (HALL_IN + 2.5), q = sn * (HALL_IN + 2.5); st.target = { p: new T.Vector3(p, 0, q) }; } });
      const ph = photoPlane(EXTRA.region[w.id], 3.6, 2.4); if (ph) { ph.position.set(c * (HALL_OUT - .35), 2.4, sn * (HALL_OUT - .35)); ph.rotation.y = -a - Math.PI / 2; s.root.add(ph); }
    });
    // жәдігерлер
    exhibitsAll().forEach(ex => {
      let x, z, face; if (ex.hall < 0) { const a = (ex.k / 5) * Math.PI * 2 + Math.PI / 6; x = Math.cos(a) * 7.5; z = Math.sin(a) * 7.5; face = Math.atan2(-x, -z); }
      else { const a = ex.hall * Math.PI / 3, c = Math.cos(a), sn = Math.sin(a), r = 16 + ex.k * 6.2, side = ex.k % 2 ? 1 : -1, lat = side * 3.4; x = c * r - sn * lat; z = sn * r + c * lat; face = Math.atan2(sn * side, -c * side) ; face = Math.atan2(-(-sn * lat), -(c * lat)); }
      const g = new T.Group(); g.position.set(x, 0, z); s.root.add(g);
      const ped = new T.Mesh(new T.CylinderGeometry(.75, .9, 1.1, 24), M('#ffffff', { flatShading: false })); ped.position.y = .55; ped.castShadow = true; g.add(ped);
      const rim = new T.Mesh(new T.TorusGeometry(.78, .05, 8, 32), M(ex.color, { metalness: .4 })); rim.rotation.x = Math.PI / 2; rim.position.y = 1.1; g.add(rim);
      const glass = new T.Mesh(new T.CylinderGeometry(.85, .85, 2.1, 24, 1, true), new T.MeshStandardMaterial({ color: '#dff3ff', transparent: true, opacity: .14, roughness: .05, side: T.DoubleSide })); glass.position.y = 2.15; g.add(glass);
      const mdl = Models.build(ex.m.model || 'star') || Models.build('star'); mdl.position.y = 1.12; mdl.scale.setScalar(1.05); g.add(mdl);
      const plq = Avatars.label(ex.m.title, { bg: 'rgba(255,255,255,.95)', color: '#0b1a3a', h: .42, glow: ex.color }); plq.position.y = 3.6; g.add(plq);
      if (ex.hall >= 0) { const ph = photoPlane(ex.m.photo, 2.2, 1.5); if (ph) { const a = ex.hall * Math.PI / 3, c = Math.cos(a), sn = Math.sin(a), side = ex.k % 2 ? 1 : -1, r = 16 + ex.k * 6.2; ph.position.set(c * r - sn * side * HALL_W, 2.5, sn * r + c * side * HALL_W); ph.lookAt(c * r, 2.5, sn * r); s.root.add(ph); } }
      s.anims.push(t => { mdl.userData.anim(t); mdl.rotation.y = t * .5; });
      s.exhibits.push({ ex, g, plq, pos: new T.Vector3(x, 0, z) }); s.solids.push({ x, z, r: .95 });
    });
    s.canWalk = (x, z) => { if (Math.hypot(x, z) < 11.2) return true; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3, u = x * Math.cos(a) + z * Math.sin(a), v = -x * Math.sin(a) + z * Math.cos(a); if (u > 9 && u < HALL_OUT - .8 && Math.abs(v) < HALL_W - .5) return true; } return false; };
    s.spawn = { x: 0, z: 0, ry: 0 };
    return s;
  }
  let museumBack = null, exShown = null;
  function enterMuseum(at) {
    if (!renderer) init(); if (Book.current) Book.close(); museumBack = cur && cur.kind === 'value' ? { world: cur.world } : { map: true }; if (cur && cur.kind !== 'kz') drop();
    const s = buildMuseum(); use(s); ensureHero(s); let x = 0, z = 0, ry = 0;
    const hi = WORLDS.findIndex(w => w.id === (at || '').split(':')[0]);
    if (hi >= 0) { const a = hi * Math.PI / 3; x = Math.cos(a) * (HALL_IN + 1); z = Math.sin(a) * (HALL_IN + 1); ry = Math.atan2(Math.cos(a), Math.sin(a)); }
    st.pos.set(x, 0, z); st.ry = ry; st.alt = 0; st.target = null; st.camYaw = 0; mode = 'overview'; setMode('leopard', true); camera.position.set(x, 6, z + 10);
    Voice.say(TEXT.phrases.museumWorld);
  }
  function museumUpdate(s) {
    let near = null, nd = 3.4; s.exhibits.forEach(e => { const d = Math.hypot(e.pos.x - st.pos.x, e.pos.z - st.pos.z); e.plq.visible = d > 5; if (d < nd) { nd = d; near = e; } });
    if (near && exShown !== near) { exShown = near; showExhibit(near.ex); } else if (!near && exShown) { exShown = null; document.getElementById('exCard').hidden = true; }
  }
  function showExhibit(ex) {
    const el = document.getElementById('exCard'), ph = window.photo(ex.m.photo);
    el.innerHTML = `${ph ? `<img src="${ph.src}" alt=""><p class="credit">📷 ${ph.credit} · ${ph.license} · Wikimedia Commons</p>` : ''}<div><p class="eyebrow">${ex.hall >= 0 ? WORLDS[ex.hall].icon + ' ' + WORLDS[ex.hall].name : '🎉 Ұлттық мереке'}</p><h3>${ex.m.title}</h3><p>${ex.m.text}</p><button class="say">🔊 Тыңдау</button></div>`;
    el.hidden = false; el.querySelector('.say').onclick = () => Voice.say(ex.m.title + '. ' + ex.m.text, { force: true });
    Voice.say(ex.hall >= 0 ? ex.m.title + '. ' + ex.m.text : ex.m.text);
    const n = Progress.collectItem('museum', 0, ex.id); updateHud();
    if (ex.hall >= 0) { const w = WORLDS[ex.hall]; if (w.museum.every((m, k) => Progress.questItems('museum', 0).includes(w.id + ':' + k))) Progress.award(w.id + ':museum', 5, null, 'Мұражай: ' + w.short); }
    if (n >= cur.exhibits.length) Progress.award('museum:all', 15, null, 'Виртуалды мұражай толық');
  }
  /* ---------- сыртқы API ---------- */
  function showMap() { if (!renderer) init(); if (!kzS) kzS = buildKZ(); use(kzS); ensureHero(kzS); mode = 'overview'; hero.visible = false; mount('map'); syncUI(); kick(); }
  function travel(m, at) {
    if (!kzS) showMap(); use(kzS); ensureHero(kzS);
    let sp = at || (mode === 'overview' ? { x: ov.tx, z: ov.tz } : null) || kzS.spawn, x = sp.x, z = sp.z;
    if (!KZ.inside(x, z) || KZ.heightAt(x, z) < 0) { x = kzS.spawn.x; z = kzS.spawn.z; }
    if (at || mode === 'overview' || cur.kind !== 'kz') { st.pos.set(x, kzS.heightAt(x, z), z); st.ry = sp.ry || Math.PI; }
    st.target = null; st.camYaw = 0; lastZone = -1; mode = 'overview'; setMode(m, true); camera.position.set(st.pos.x, st.pos.y + 30, st.pos.z + 40);
    Voice.say(m === 'eagle' ? TEXT.phrases.eagle : TEXT.phrases.leopard);
  }
  function enterValue(w) {
    if (!renderer) init(); if (cur && cur.kind !== 'kz') drop(); const s = buildValue(w); use(s); ensureHero(s);
    st.pos.set(0, 0, 6); st.ry = Math.PI; st.alt = 0; st.target = null; st.camYaw = 0; mode = 'overview'; setMode('leopard', true); camera.position.set(0, 8, 18);
    setTimeout(() => { if (cur === s) Voice.say([TEXT.phrases.portal, w.intro, w.quests[0].intro, TEXT.phrases.worldBook]); }, 400);
  }
  function exitToMap() {
    Voice.stop(); document.getElementById('exCard').hidden = true; exShown = null;
    if (cur && cur.kind === 'museum' && museumBack && museumBack.world) { const w = museumBack.world; museumBack = null; drop(); return enterValue(w); }
    const from = cur && cur.kind === 'value' ? cur.world : null, wasMuseum = cur && cur.kind === 'museum';
    if (from) { drop(); const ll = from.holiday ? [from.holiday.lon, from.holiday.lat] : KZ.PORTALS[from.id], [x, z] = KZ.toXZ(ll[0], ll[1]); travel(mode === 'eagle' ? 'eagle' : 'leopard', { x, z: z + 9, ry: 0 }); }
    else if (wasMuseum) { drop(); const [x, z] = KZ.toXZ(70.4, 50.6); travel('leopard', { x, z: z + 10, ry: 0 }); }
    else showMap();
  }
  function drop() { if (!cur || cur.kind === 'kz') return; cur.labels.remove(); const old = cur; cur = null; old.root.traverse(o => o.geometry && o.geometry.dispose()); }
  function focusZone(i) { const z = KZ.ZONES[i], [x, zz] = KZ.toXZ(z.seed[0], z.seed[1]); ov.ttx = x; ov.ttz = zz; ov.tDist = 120; }
  function stamp(id) { if (Progress.rec && !Progress.isDone('kz:stamp:' + id)) { Progress.award('kz:stamp:' + id, 5, null, 'Саяхат паспорты'); updateHud(); } }
  return { zoneWorld: () => (cur && cur.kind === 'kz' && lastZone >= 0) ? WORLDS.find(w => w.id === KZ.ZONES[lastZone].w) : null, enterMuseum, enterHoliday: h => enterValue(holidayWorld(h)), showMap, travel, enterValue, exitToMap, setMode, focusZone, onPresence, updateHud, stamp, resume: kick, get world() { return cur && cur.kind === 'value' ? cur.world : null; }, get kind() { return cur ? cur.kind : null; }, get mode() { return mode; }, get _scene() { return cur && cur.scene; } };
})();
