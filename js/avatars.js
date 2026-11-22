/* Кейіпкерлер: Ақбарыс, Қыран және оқушылардың аватарлары (процедуралық 3D) */
window.Avatars = (function () {
  const T = THREE;
  const TYPES = [
    { id: 'adam', name: 'Кішкентай адам', emoji: '🧒' },
    { id: 'animal', name: 'Жануар', emoji: '🦊' },
    { id: 'smile', name: 'Смайлик', emoji: '😊' },
    { id: 'robot', name: 'Көмекші робот', emoji: '🤖' },
    { id: 'flame', name: 'Шам жалыны', emoji: '🔥' },
    { id: 'drop', name: 'Су тамшысы', emoji: '💧' }
  ];
  const COLORS = ['#f4b942', '#e8505b', '#3fa7f5', '#4cc38a', '#a66cf5', '#ff8a3d', '#f06fb0', '#2ec4c4'];
  const L = (c, o) => new T.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const S = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .6, metalness: 0 }, o || {}));
  function mesh(g, m, x, y, z) { const o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = true; return o; }
  const sph = (r, w, h) => new T.SphereGeometry(r, w || 16, h || 12);

  function faceTex(kind) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    x.fillStyle = '#1b1b2a';
    const eye = (ex) => { x.beginPath(); x.ellipse(ex, 56, 9, 12, 0, 0, 7); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(ex + 3, 51, 3.5, 0, 7); x.fill(); x.fillStyle = '#1b1b2a'; };
    eye(44); eye(84);
    x.strokeStyle = '#1b1b2a'; x.lineWidth = 6; x.lineCap = 'round';
    x.beginPath(); x.arc(64, 74, kind === 'robot' ? 0 : 16, .15 * Math.PI, .85 * Math.PI); x.stroke();
    x.fillStyle = 'rgba(255,110,130,.55)'; x.beginPath(); x.arc(28, 80, 9, 0, 7); x.arc(100, 80, 9, 0, 7); x.fill();
    const t = new T.CanvasTexture(c); return t;
  }
  function facePlane(size, z, y) { const m = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({ map: faceTex(), transparent: true })); m.position.set(0, y, z); return m; }

  function build(type, color) {
    color = color || COLORS[0]; const g = new T.Group(); let anim;
    if (type === 'adam') {
      const body = mesh(new T.CylinderGeometry(.28, .36, .6, 14), S(color), 0, .45, 0);
      const head = mesh(sph(.32), S('#f2c9a0'), 0, 1.0, 0);
      const hat = mesh(new T.CylinderGeometry(.22, .3, .2, 12), S('#ffffff'), 0, 1.28, 0); // тақия
      const band = mesh(new T.TorusGeometry(.27, .03, 6, 18), S('#d4a017'), 0, 1.2, 0); band.rotation.x = Math.PI / 2;
      g.add(body, head, hat, band); Models.face(g, 1.0, .3 - .5 * .45, .5 * .55);
      [-.13, .13].forEach(x => g.add(mesh(new T.CylinderGeometry(.08, .08, .3, 8), S('#3a3a55'), x, .12, 0)));
      anim = (t, mv) => { g.children[1].position.y = 1.0 + Math.sin(t * 6) * (mv ? .04 : .015); };
    } else if (type === 'animal') {
      const body = mesh(sph(.42), S(color), 0, .5, 0); body.scale.set(1, .9, 1.05);
      const head = mesh(sph(.34), S(color), 0, 1.02, .05);
      [-.2, .2].forEach(x => { const e = mesh(new T.ConeGeometry(.11, .26, 4), S(color), x, 1.32, 0); e.rotation.z = x > 0 ? -.3 : .3; g.add(e); });
      const belly = mesh(sph(.24), S('#fff6e6'), 0, .48, .26); belly.scale.z = .5;
      const muzzle = mesh(sph(.13), S('#fff6e6'), 0, .95, .32); const nose = mesh(sph(.05), S('#222'), 0, .99, .44);
      const tail = mesh(new T.CylinderGeometry(.04, .1, .55, 8), S(color), 0, .55, -.45); tail.rotation.x = -1;
      g.add(body, head, belly, muzzle, nose, tail); Models.face(g, 1.07, .36 - .5 * .45, .5 * .55);
      anim = (t) => { tail.rotation.z = Math.sin(t * 5) * .4; };
    } else if (type === 'smile') {
      const ball = mesh(sph(.5, 24, 18), S('#ffd23f', { emissive: '#4a3300' }), 0, .6, 0);
      g.add(ball); Models.face(g, .62, .48 - .8 * .45, .8 * .55);
      anim = (t) => { ball.position.y = .6 + Math.abs(Math.sin(t * 3)) * .15; g.children[1].position.y = ball.position.y + .02; };
    } else if (type === 'robot') {
      const body = mesh(new T.BoxGeometry(.6, .55, .45), S(color, { metalness: .3 }), 0, .45, 0);
      const head = mesh(new T.BoxGeometry(.55, .42, .45), S('#dfe6ee', { metalness: .3 }), 0, .97, 0);
      const visor = mesh(new T.BoxGeometry(.44, .2, .02), new T.MeshBasicMaterial({ color: '#46e6ff' }), 0, .99, .23);
      const ant = mesh(new T.CylinderGeometry(.02, .02, .25, 6), S('#888'), 0, 1.3, 0);
      const bulb = mesh(sph(.06), new T.MeshBasicMaterial({ color: '#ff5d5d' }), 0, 1.45, 0);
      g.add(body, head, visor, ant, bulb);
      anim = (t) => { bulb.material.color.setHSL((t * .2) % 1, .9, .6); head.rotation.y = Math.sin(t * 1.5) * .25; visor.rotation.y = head.rotation.y; };
    } else if (type === 'flame') {
      const body = mesh(sph(.42, 20, 16), S('#f3ead8'), 0, .48, 0); body.scale.set(1, 1.15, 1);
      const scarf = mesh(new T.TorusGeometry(.36, .07, 8, 20), S(color), 0, .32, 0); scarf.rotation.x = Math.PI / 2;
      const flame = mesh(new T.ConeGeometry(.17, .5, 14), new T.MeshBasicMaterial({ color: '#ffb340' }), 0, 1.15, 0);
      const core = mesh(new T.ConeGeometry(.09, .28, 10), new T.MeshBasicMaterial({ color: '#fff3b0' }), 0, 1.05, .03);
      const glow = new T.Sprite(new T.SpriteMaterial({ map: glowTex('#ffcc66'), transparent: true, depthWrite: false, blending: T.AdditiveBlending })); glow.scale.set(1.4, 1.4, 1); glow.position.y = 1.1;
      g.add(body, scarf, flame, core, glow); Models.face(g, .5, .42 - .5 * .45, .5 * .55);
      anim = (t) => { const s = 1 + Math.sin(t * 12) * .08; flame.scale.set(s, 1 + Math.sin(t * 9) * .12, s); glow.material.opacity = .7 + Math.sin(t * 7) * .2; };
    } else { // drop
      const m = S('#4fb8ff', { transparent: true, opacity: .85, emissive: '#0a3a66', roughness: .2 });
      const b = mesh(sph(.42, 22, 16), m, 0, .45, 0); const tip = mesh(new T.ConeGeometry(.36, .55, 22), m, 0, .97, 0);
      const shine = mesh(sph(.08), new T.MeshBasicMaterial({ color: '#fff' }), -.18, .7, .3);
      g.add(b, tip, shine); Models.face(g, .5, .42 - .55 * .45, .55 * .55);
      anim = (t) => { const s = 1 + Math.sin(t * 4) * .04; g.scale.set(s * g.userData.base, (2 - s) * g.userData.base, s * g.userData.base); };
    }
    g.userData.base = 1; g.userData.anim = anim; return g;
  }

  function glowTex(col) {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c);
  }
  function label(text, opt) {
    opt = opt || {}; const c = document.createElement('canvas'), x = c.getContext('2d'), fs = 44;
    x.font = '800 ' + fs + 'px Nunito, sans-serif'; const w = Math.ceil(x.measureText(text).width) + 56; c.width = w; c.height = 76;
    x.font = '800 ' + fs + 'px Nunito, sans-serif';
    x.fillStyle = opt.bg || 'rgba(11,26,58,.85)'; const r = 34; x.beginPath(); x.moveTo(r, 4); x.arcTo(w - 4, 4, w - 4, 72, r); x.arcTo(w - 4, 72, 4, 72, r); x.arcTo(4, 72, 4, 4, r); x.arcTo(4, 4, w - 4, 4, r); x.fill();
    if (opt.glow) { x.strokeStyle = opt.glow; x.lineWidth = 5; x.stroke(); }
    x.fillStyle = opt.color || '#fff'; x.textBaseline = 'middle'; x.fillText(text, 28, 40);
    const s = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), depthTest: opt.depthTest !== false, transparent: true }));
    const h = opt.h || .45; s.scale.set(h * w / 76, h, 1); s.renderOrder = 10; return s;
  }

  /* ---- Ақбарыс ---- */
  function furTex() {
    const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#eef0ee'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++) { const px = Math.random() * 256, py = Math.random() * 256, r = 4 + Math.random() * 7;
      x.strokeStyle = '#4a4a4a'; x.lineWidth = 2.5; x.beginPath(); x.arc(px, py, r, Math.random() * 2, Math.random() * 2 + 4.5); x.stroke(); x.fillStyle = '#9a9c9a'; x.beginPath(); x.arc(px, py, r * .45, 0, 7); x.fill(); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }
  function leopard() {
    const g = new T.Group(), fur = new T.MeshStandardMaterial({ map: furTex(), roughness: .9 }), light = S('#f7f7f5');
    const body = mesh(sph(1, 20, 14), fur, 0, 1.05, 0); body.scale.set(.62, .58, 1.25);
    const chest = mesh(sph(.55), light, 0, .95, .85);
    const head = new T.Group(); head.position.set(0, 1.55, 1.25);
    head.add(mesh(sph(.48, 18, 14), fur), mesh(sph(.24), light, 0, -.1, .38), mesh(sph(.07), S('#c97b84'), 0, .02, .55));
    [-.18, .18].forEach(x => { head.add(mesh(sph(.075), S('#2a3a2a'), x, .1, .4)); head.add(mesh(sph(.025), new T.MeshBasicMaterial({ color: '#fff' }), x + .02, .13, .47)); const ear = mesh(sph(.14), fur, x * 1.7, .38, -.05); ear.scale.set(1, 1, .5); head.add(ear); });
    g.add(body, chest, head);
    const legs = [];
    [[-.35, .75], [.35, .75], [-.35, -.75], [.35, -.75]].forEach(([x, z]) => {
      const p = new T.Group(); p.position.set(x, 1.0, z); const leg = mesh(new T.CylinderGeometry(.15, .13, 1, 10), fur, 0, -.5, 0); const paw = mesh(sph(.18), light, 0, -1, .05); paw.scale.set(1, .6, 1.2); p.add(leg, paw); g.add(p); legs.push(p);
    });
    const tail = []; let prev = g;
    for (let i = 0; i < 9; i++) { const seg = new T.Group(); seg.position.set(0, i ? 0 : 1.2, i ? -.32 : -1.15); seg.add(mesh(sph(.2 - i * .004, 10, 8), fur)); prev.add(seg); tail.push(seg); prev = seg; }
    g.userData.anim = (t, speed) => {
      const k = Math.min(1, speed / 6), ph = t * (5 + speed * 1.4);
      legs.forEach((l, i) => l.rotation.x = Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * .7 * k);
      body.position.y = 1.05 + Math.abs(Math.sin(ph)) * .06 * k; head.rotation.x = Math.sin(t * 1.3) * .05;
      tail.forEach((s, i) => { s.rotation.x = (i ? .12 : .35) + Math.sin(t * 2 - i * .5) * .05; s.rotation.y = Math.sin(t * 2.2 - i * .45) * .12; });
    };
    g.scale.setScalar(.55); return g;
  }

  /* ---- Қыран (бүркіт) ---- */
  function eagle() {
    const g = new T.Group(), brown = S('#5b3a1e'), gold = S('#c8913d'), dark = S('#3a2412');
    const body = mesh(sph(.6, 16, 12), brown, 0, 0, 0); body.scale.set(.8, .75, 1.6);
    const head = mesh(sph(.38), gold, 0, .35, 1.05); const beak = mesh(new T.ConeGeometry(.12, .4, 8), S('#f2c230'), 0, .27, 1.45); beak.rotation.x = Math.PI / 2 + .3;
    [-.17, .17].forEach(x => g.add(mesh(sph(.06), S('#1a1a1a'), x, .45, 1.3)));
    const tailM = mesh(new T.BoxGeometry(.7, .06, .8), dark, 0, 0, -1.25); tailM.rotation.x = .12;
    g.add(body, head, beak, tailM);
    const wings = [-1, 1].map(s => {
      const w = new T.Group(); w.position.set(s * .4, .15, .1);
      const inner = mesh(new T.BoxGeometry(1.4, .07, .9), brown, s * .7, 0, 0); const outer = new T.Group(); outer.position.set(s * 1.4, 0, 0);
      outer.add(mesh(new T.BoxGeometry(1.2, .06, .7), dark, s * .6, 0, -.05));
      for (let i = 0; i < 4; i++) { const f = mesh(new T.BoxGeometry(.55, .04, .14), dark, s * (1.35 + i * .06), 0, .2 - i * .19); f.rotation.y = s * (i * .12 - .1); outer.add(f); }
      w.add(inner, outer); g.add(w); w.userData.outer = outer; return w;
    });
    g.userData.anim = (t, speed, climb) => {
      const flap = Math.sin(t * (climb > 0 ? 9 : 5)) * (climb > 0 ? .7 : .35);
      wings.forEach((w, i) => { const s = i ? -1 : 1; w.rotation.z = s * flap; w.userData.outer.rotation.z = s * flap * .6; });
    };
    g.scale.setScalar(.75); return g;
  }
  function icon(type) { const t = TYPES.find(x => x.id === type); return t ? t.emoji : '🙂'; }
  return { TYPES, COLORS, build, label, leopard, eagle, glowTex, icon };
})();
