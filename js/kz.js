/* Қазақстан картасы – бір үлкен ашық әлем: 6 құндылық өңірі, таулар, ормандар, қалалар, порталдар */
window.KZ = (function () {
  const T = THREE, K = 12, COS = 0.68, LON0 = 67, LAT0 = 48;
  const toXZ = (lon, lat) => [(lon - LON0) * K * COS, (LAT0 - lat) * K];
  const toLL = (x, z) => [x / (K * COS) + LON0, LAT0 - z / K];
  /* Өңірлер (экономикалық аймақтар сияқты): тұқым нүктесі → құндылық */
  const ZONES = [
    { w: 'w1', region: 'Солтүстік өңір', seed: [71.0, 52.6], cities: 'Астана, Петропавл, Қостанай, Көкшетау, Павлодар' },
    { w: 'w2', region: 'Орталық өңір', seed: [72.0, 47.5], cities: 'Қарағанды, Ұлытау, Жезқазған, Балқаш' },
    { w: 'w3', region: 'Шығыс өңір', seed: [82.0, 48.5], cities: 'Семей, Өскемен, Аягөз' },
    { w: 'w4', region: 'Оңтүстік-шығыс өңір', seed: [77.5, 44.0], cities: 'Алматы, Қонаев, Талдықорған' },
    { w: 'w5', region: 'Батыс өңір', seed: [54.5, 47.5], cities: 'Атырау, Ақтөбе, Орал, Ақтау' },
    { w: 'w6', region: 'Оңтүстік өңір', seed: [66.5, 43.5], cities: 'Түркістан, Шымкент, Тараз, Қызылорда' }
  ];
  const PORTALS = { w1: [71.1, 51.55], w2: [71.6, 48.3], w3: [80.4, 49.6], w4: [76.4, 44.3], w5: [54.2, 48.2], w6: [67.9, 43.9] };
  const CITIES = [
    ['Астана', 71.43, 51.13, 3], ['Алматы', 76.95, 43.3, 3], ['Шымкент', 69.6, 42.32, 2], ['Түркістан', 68.25, 43.3, 2], ['Тараз', 71.37, 42.9, 1], ['Қызылорда', 65.5, 44.85, 1],
    ['Ақтөбе', 57.17, 50.28, 2], ['Атырау', 51.9, 47.1, 2], ['Ақтау', 51.4, 43.65, 1], ['Орал', 51.37, 51.23, 1], ['Қостанай', 63.62, 53.21, 1], ['Петропавл', 69.15, 54.6, 1],
    ['Көкшетау', 69.4, 53.28, 1], ['Павлодар', 76.95, 52.29, 1], ['Қарағанды', 73.1, 49.8, 2], ['Жезқазған', 67.7, 47.8, 1], ['Семей', 80.25, 50.41, 2], ['Өскемен', 82.6, 49.95, 1],
    ['Талдықорған', 78.37, 45.0, 1], ['Байқоңыр', 63.3, 45.6, 1], ['Балқаш', 75.0, 46.85, 1], ['Ұлытау', 67.0, 48.65, 1], ['Қонаев', 77.1, 43.87, 1]
  ];
  const LAKES = [
    [[73.6, 46.0], [74.5, 46.35], [75.5, 46.65], [77.0, 46.7], [78.5, 46.55], [79.25, 46.35], [78.9, 46.05], [77.5, 46.15], [76.0, 46.2], [74.6, 45.9]], // Балқаш
    [[60.3, 46.3], [60.9, 46.75], [61.7, 46.85], [61.9, 46.4], [61.3, 46.05], [60.6, 46.0]], // Кіші Арал
    [[83.6, 47.9], [84.4, 48.15], [85.2, 48.05], [84.6, 47.75], [83.9, 47.7]], // Зайсан
    [[77.3, 43.75], [77.9, 43.95], [78.3, 43.85], [77.8, 43.65]] // Қапшағай
  ];
  const RIVERS = [
    [[84.2, 47.95], [83.2, 49.0], [82.6, 49.95], [81.4, 50.3], [80.25, 50.41], [78.6, 51.2], [77.4, 52.0], [76.95, 52.29], [76.2, 52.9], [75.4, 53.55]], // Ертіс
    [[68.2, 40.95], [68.3, 41.8], [68.0, 42.7], [67.0, 43.9], [65.5, 44.85], [64.2, 45.4], [62.9, 45.9], [61.8, 46.1]], // Сырдария
    [[80.3, 44.0], [79.0, 43.95], [78.3, 43.85], [77.3, 43.8], [76.6, 44.6], [75.7, 45.5], [74.9, 45.95]], // Іле
    [[51.5, 51.7], [51.37, 51.23], [51.6, 49.6], [51.9, 47.9], [51.9, 47.1], [51.7, 46.8]], // Жайық
    [[63.0, 53.6], [63.6, 53.2], [64.5, 52.5], [65.4, 51.5]] // Тобыл
  ];
  const MOUNTAINS = [ // lon, lat, радиус(°), биіктік
    [77.0, 42.95, 1.4, 14], [79.5, 42.9, 1.2, 15], [75.0, 42.9, 1.0, 10], [80.5, 45.2, 1.0, 9], [79.0, 45.0, 0.8, 7], // Алатау, Жетісу
    [85.5, 49.3, 1.3, 13], [86.6, 49.0, 0.8, 14], [84.2, 50.0, 0.9, 9], [82.6, 47.3, 1.0, 7], [81.2, 47.2, 0.7, 6], // Алтай, Тарбағатай
    [70.0, 42.0, 0.7, 8], [69.4, 43.2, 0.9, 6], // Қаратау
    [74.5, 49.6, 1.4, 3.2], [76.0, 49.4, 1.0, 3], [72.5, 49.0, 1.2, 2.2], [67.0, 48.7, 0.8, 3.2], // Сарыарқа, Ұлытау
    [58.6, 48.5, 0.9, 2.6], [52.6, 44.2, 1.2, 1.8], [80.9, 49.2, 0.6, 3] // Мұғалжар, Маңғыстау, Абай өңірі
  ];
  const B = window.KZ_BORDER.map(p => toXZ(p[0], p[1]));
  const LK = LAKES.map(l => l.map(p => toXZ(p[0], p[1]))), RV = RIVERS.map(r => r.map(p => toXZ(p[0], p[1])));
  function inPoly(x, z, poly) { let ins = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1]; if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) ins = !ins; } return ins; }
  function segDist(x, z, a, b) { const dx = b[0] - a[0], dz = b[1] - a[1], l = dx * dx + dz * dz; let t = l ? ((x - a[0]) * dx + (z - a[1]) * dz) / l : 0; t = Math.max(0, Math.min(1, t)); return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz); }
  function polyDist(x, z, poly, closed) { let d = 1e9; for (let i = 0; i < poly.length - (closed ? 0 : 1); i++) d = Math.min(d, segDist(x, z, poly[i], poly[(i + 1) % poly.length])); return d; }
  const inside = (x, z) => inPoly(x, z, B);
  function zoneAt(x, z) { const [lon, lat] = toLL(x, z); let best = 0, bd = 1e9, second = 1e9; ZONES.forEach((zz, i) => { const d = Math.hypot((lon - zz.seed[0]) * COS, lat - zz.seed[1]); if (d < bd) { second = bd; bd = d; best = i; } else if (d < second) second = d; }); return { i: best, edge: second - bd }; }
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  let hcache = null;
  function rawHeight(x, z) {
    if (!inside(x, z)) { const d = polyDist(x, z, B, true); return -2.5 - Math.min(3, d * .2); }
    const [lon, lat] = toLL(x, z), dB = polyDist(x, z, B, true);
    let h = .55 + Math.sin(x * .09) * Math.cos(z * .11) * .35 + Math.sin(x * .023 + z * .031) * .5;
    MOUNTAINS.forEach(m => { const d = Math.hypot((lon - m[0]) * COS, lat - m[1]) / m[2]; if (d < 1.6) { const ridge = 1 + .35 * Math.sin(lon * 9) * Math.cos(lat * 7); h += m[3] * Math.exp(-d * d * 2.2) * ridge; } });
    h *= smooth(0, 3, dB); h = Math.max(h, .25 * smooth(0, 1.5, dB));
    LK.forEach(l => { if (inPoly(x, z, l)) h = -1.2; else { const d = polyDist(x, z, l, true); if (d < 2) h = Math.min(h, -1.2 + d * .7); } });
    RV.forEach(r => { const d = polyDist(x, z, r, false); if (d < 1.6) h = Math.min(h, -.9 + d * d * .5); });
    return h;
  }
  function heightAt(x, z) { // карта торы бойынша жылдам интерполяция
    if (!hcache) return rawHeight(x, z);
    const { x0, z0, step, nx, nz, data } = hcache; const gx = (x - x0) / step, gz = (z - z0) / step;
    const ix = Math.max(0, Math.min(nx - 2, Math.floor(gx))), iz = Math.max(0, Math.min(nz - 2, Math.floor(gz))), fx = Math.min(1, Math.max(0, gx - ix)), fz = Math.min(1, Math.max(0, gz - iz));
    const a = data[iz * nx + ix], b = data[iz * nx + ix + 1], c = data[(iz + 1) * nx + ix], d = data[(iz + 1) * nx + ix + 1];
    return a * (1 - fx) * (1 - fz) + b * fx * (1 - fz) + c * (1 - fx) * fz + d * fx * fz;
  }
  function biome(lon, lat, h) {
    if (h > 9) return '#f4f6f8'; if (h > 5.5) return '#8f969c';
    if (lat > 51.2) return lon > 75 ? '#7fb35a' : '#86bb5c';
    if (lon > 79.5 && lat > 47.5) return '#6aa64f';
    if (lat < 45.8 && lon < 76) return lon < 58 ? '#e3cd94' : '#dcc58b';
    if (lon < 56) return '#d6c28c';
    if (lat < 45 && lon >= 76) return '#8fbf5a';
    return '#b9c070';
  }

  function build(api) {
    const { root, M, add, addPoi, emojiTex, label } = api, rand = api.rand;
    const xs = B.map(p => p[0]), zs = B.map(p => p[1]);
    const minX = Math.min(...xs) - 30, maxX = Math.max(...xs) + 30, minZ = Math.min(...zs) - 30, maxZ = Math.max(...zs) + 30;
    const step = 1.6, nx = Math.ceil((maxX - minX) / step) + 1, nz = Math.ceil((maxZ - minZ) / step) + 1;
    const geo = new T.PlaneGeometry((nx - 1) * step, (nz - 1) * step, nx - 1, nz - 1); geo.rotateX(-Math.PI / 2); geo.translate(minX + (nx - 1) * step / 2, 0, minZ + (nz - 1) * step / 2);
    const p = geo.attributes.position, cols = [], data = new Float32Array(nx * nz);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), h = rawHeight(x, z); p.setY(i, h);
      const ix = Math.round((x - minX) / step), iz = Math.round((z - minZ) / step); data[iz * nx + ix] = h;
      let c;
      if (h < -.3) c = new T.Color(inside(x, z) ? '#d9c98f' : '#c9b57c');
      else { const [lon, lat] = toLL(x, z), zn = zoneAt(x, z), w = WORLDS.find(q => q.id === ZONES[zn.i].w); c = new T.Color(biome(lon, lat, h)).lerp(new T.Color(w.color), h > 5.5 ? .08 : .42); if (zn.edge < .09 && h < 5.5) c.lerp(new T.Color('#ffffff'), .75); c.offsetHSL(0, 0, Math.sin(x * 1.7) * Math.cos(z * 1.3) * .02); }
      cols.push(c.r, c.g, c.b);
    }
    hcache = { x0: minX, z0: minZ, step, nx, nz, data };
    geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const ground = new T.Mesh(geo, new T.MeshLambertMaterial({ vertexColors: true })); ground.receiveShadow = false; root.add(ground); root.userData.ground = ground;
    const sea = new T.Mesh(new T.PlaneGeometry(1400, 1000), new T.MeshStandardMaterial({ color: '#3f9ad8', roughness: .25, metalness: .1 })); sea.rotation.x = -Math.PI / 2; sea.position.y = -.45; root.add(sea); root.userData.water = sea;
    // ағаштар (Instanced)
    const d = new T.Object3D(), MAXT = 2600;
    const trunk = new T.InstancedMesh(new T.CylinderGeometry(.14, .2, 1.2, 5), M('#7a4f2a'), MAXT), pine = new T.InstancedMesh(new T.ConeGeometry(.85, 2.4, 6), M('#2f7d43'), MAXT), leaf = new T.InstancedMesh(new T.IcosahedronGeometry(.95, 0), M('#4c9e46'), MAXT), shrub = new T.InstancedMesh(new T.DodecahedronGeometry(.45, 0), M('#9a9a5a'), 900);
    let nt = 0, np = 0, nl = 0, ns = 0;
    for (let i = 0; i < 24000 && nt < MAXT; i++) {
      const x = minX + rand() * (maxX - minX), z = minZ + rand() * (maxZ - minZ); if (!inside(x, z)) continue; const h = heightAt(x, z); if (h < .15 || h > 8.5) continue;
      const [lon, lat] = toLL(x, z); let dens = 0;
      if (lat > 51.5) dens = .55; else if (lon > 79.5 && lat > 47.3) dens = .7; else if (h > 2.5) dens = .55; else if (lat < 44.5 && lon > 68) dens = .25; else if (Math.abs(lon - 80) < 1.2 && Math.abs(lat - 50.6) < .6) dens = .9; else dens = .03;
      const desert = lat < 46 && lon < 70 || lon < 55;
      if (desert) { if (rand() < .05 && ns < 900) { d.position.set(x, h + .25, z); d.scale.setScalar(.6 + rand() * .8); d.rotation.set(0, rand() * 3, 0); d.updateMatrix(); shrub.setMatrixAt(ns++, d.matrix); } continue; }
      if (rand() > dens) continue;
      const s = .7 + rand() * .7; d.position.set(x, h + .6 * s, z); d.scale.setScalar(s); d.rotation.set(0, rand() * 3, 0); d.updateMatrix(); trunk.setMatrixAt(nt++, d.matrix);
      d.position.y = h + 1.9 * s; d.updateMatrix(); if (lat > 50 || h > 3) pine.setMatrixAt(np++, d.matrix); else leaf.setMatrixAt(nl++, d.matrix);
    }
    trunk.count = nt; pine.count = np; leaf.count = nl; shrub.count = ns;
    [trunk, pine, leaf, shrub].forEach(m => { m.castShadow = true; root.add(m); });
    // шөп пен гүлдер
    const grass = new T.InstancedMesh(new T.ConeGeometry(.08, .55, 3), new T.MeshLambertMaterial({ color: '#6fb24f' }), 9000); let gi = 0;
    for (let i = 0; i < 30000 && gi < 9000; i++) { const x = minX + rand() * (maxX - minX), z = minZ + rand() * (maxZ - minZ); if (!inside(x, z)) continue; const h = heightAt(x, z), [lon, lat] = toLL(x, z); if (h < .2 || h > 5 || (lat < 46 && lon < 70)) continue; d.position.set(x, h + .2, z); d.scale.set(1, .6 + rand(), 1); d.rotation.set(rand() * .3, 0, rand() * .3); d.updateMatrix(); grass.setMatrixAt(gi++, d.matrix); }
    grass.count = gi; root.add(grass);
    ['#ff6b8a', '#ffd23f', '#ffffff', '#c77dff', '#ff4d4d'].forEach(col => { const fl = new T.InstancedMesh(new T.CylinderGeometry(.2, .2, .06, 6), new T.MeshLambertMaterial({ color: col }), 700); let fi = 0;
      for (let i = 0; i < 6000 && fi < 700; i++) { const x = minX + rand() * (maxX - minX), z = minZ + rand() * (maxZ - minZ); if (!inside(x, z)) continue; const h = heightAt(x, z), [lon, lat] = toLL(x, z); if (h < .2 || h > 4 || (lat < 45.5 && lon < 70)) continue; d.position.set(x, h + .3, z); d.scale.setScalar(.7 + rand()); d.rotation.set(0, 0, 0); d.updateMatrix(); fl.setMatrixAt(fi++, d.matrix); }
      fl.count = fi; root.add(fl); });
    // қалалар
    const bm = [M('#f1e6d2'), M('#d9e4f0'), M('#f0d6c2'), M('#cfe3d4')], roofM = [M('#c1462f'), M('#2f5fb3'), M('#3f8f5a')], win = M('#9fd3ff', { emissive: '#1a4a7a' });
    CITIES.forEach(([name, lon, lat, size]) => {
      const [cx, cz] = toXZ(lon, lat), g = new T.Group(); add(g, cx, 0, cz);
      const n = size === 3 ? 22 : size === 2 ? 13 : 7, R = size === 3 ? 5.5 : size === 2 ? 4 : 2.8;
      for (let k = 0; k < n; k++) {
        const a = rand() * 6.28, r = Math.sqrt(rand()) * R, x = Math.cos(a) * r, z = Math.sin(a) * r, h = heightAt(cx + x, cz + z);
        if (h < 0) continue; const tall = rand() < (size === 3 ? .45 : .2), hh = tall ? 2 + rand() * (size * 2) : .8 + rand() * .6, w = .7 + rand() * .6;
        const b = add(new T.Mesh(new T.BoxGeometry(w, hh, w), bm[k % 4]), x, h + hh / 2, z, g);
        if (!tall) { const rf = add(new T.Mesh(new T.ConeGeometry(w * .78, .6, 4), roofM[k % 3]), x, h + hh + .3, z, g); rf.rotation.y = Math.PI / 4; }
        else for (let f = 0; f < Math.floor(hh / .8); f++) add(new T.Mesh(new T.BoxGeometry(w * 1.02, .12, w * 1.02), win), x, h + .5 + f * .8, z, g);
      }
      const lb = label(name, { bg: 'rgba(255,255,255,.92)', color: '#0b1a3a', h: size === 3 ? 1.5 : 1.1 }); lb.position.set(0, heightAt(cx, cz) + (size === 3 ? 11 : 6), 0); g.add(lb);
    });
    // ауылдар (киіз үйлер)
    for (let i = 0; i < 40; i++) { const x = minX + rand() * (maxX - minX), z = minZ + rand() * (maxZ - minZ); if (!inside(x, z)) { i--; continue; } const h = heightAt(x, z); if (h < .3 || h > 4) continue;
      const g = new T.Group(); add(g, x, h, z); for (let k = 0; k < 3; k++) { const ox = (k - 1) * 1.6, oz = rand() - .5; add(new T.Mesh(new T.CylinderGeometry(.6, .6, .5, 12), M('#f6f1e4')), ox, .25, oz, g); add(new T.Mesh(new T.ConeGeometry(.66, .45, 12), M('#d8473f')), ox, .72, oz, g); } }
    landmarks(api);
    return { heightAt, inside, zoneAt, toXZ, toLL, ZONES, PORTALS };
  }

  function landmarks(api) {
    const { M, add } = api, at = (lon, lat, dx, dz) => { const [x, z] = toXZ(lon, lat); return [x + (dx || 0), heightAt(x + (dx || 0), z + (dz || 0)), z + (dz || 0)]; };
    // Бәйтерек
    let [x, y, z] = at(71.43, 51.13, -1.5, 1); const bt = new T.Group(); add(bt, x, y, z);
    add(new T.Mesh(new T.CylinderGeometry(.35, .5, 9, 10), M('#ffffff')), 0, 4.5, 0, bt);
    for (let i = 0; i < 10; i++) { const br = add(new T.Mesh(new T.CylinderGeometry(.08, .12, 3.2, 5), M('#ffffff')), Math.cos(i / 10 * 6.28) * .9, 9.2, Math.sin(i / 10 * 6.28) * .9, bt); br.rotation.set(Math.sin(i / 10 * 6.28) * .5, 0, -Math.cos(i / 10 * 6.28) * .5); }
    add(new T.Mesh(new T.SphereGeometry(1.25, 20, 16), M('#f4c95d', { metalness: .6, roughness: .25, flatShading: false, emissive: '#5a3a00' })), 0, 10.6, 0, bt);
    // Хан Шатыр
    [x, y, z] = at(71.43, 51.13, 3, -2); add(new T.Mesh(new T.ConeGeometry(2.2, 6, 3), M('#e8edf2', { metalness: .3 })), x, y + 3, z);
    // Яссауи кесенесі
    [x, y, z] = at(68.25, 43.3, 1.5, 1.5); const ya = new T.Group(); add(ya, x, y, z);
    add(new T.Mesh(new T.BoxGeometry(4, 2.6, 3), M('#d9b98a')), 0, 1.3, 0, ya); add(new T.Mesh(new T.BoxGeometry(2.4, 4, .8), M('#cfa775')), 0, 2, 1.6, ya);
    add(new T.Mesh(new T.SphereGeometry(1.25, 16, 10, 0, 6.29, 0, 1.6), M('#2c9ad8', { flatShading: false, roughness: .3 })), .9, 2.6, -.4, ya); add(new T.Mesh(new T.SphereGeometry(.8, 14, 8, 0, 6.29, 0, 1.6), M('#2c9ad8', { flatShading: false })), -1.2, 2.6, -.4, ya);
    // Байқоңыр зымыраны
    [x, y, z] = at(63.3, 45.6, 2, 0); const rk = new T.Group(); add(rk, x, y, z);
    add(new T.Mesh(new T.CylinderGeometry(.45, .45, 6, 12), M('#f5f5f5')), 0, 3, 0, rk); add(new T.Mesh(new T.ConeGeometry(.45, 1.4, 12), M('#d8473f')), 0, 6.7, 0, rk);
    for (let i = 0; i < 4; i++) { const f = add(new T.Mesh(new T.BoxGeometry(.08, 1.2, .9), M('#d8473f')), Math.cos(i * 1.57) * .5, .7, Math.sin(i * 1.57) * .5, rk); f.rotation.y = -i * 1.57; }
    // Мұнай қондырғылары (Атырау, Ақтөбе)
    api.pumps = [];
    [[52.6, 47.0], [53.4, 46.6], [55.8, 47.6], [56.5, 49.5], [52.0, 45.5]].forEach(([lo, la]) => { [x, y, z] = at(lo, la); const g = new T.Group(); add(g, x, y, z); add(new T.Mesh(new T.BoxGeometry(.3, 1.6, .3), M('#444')), 0, .8, 0, g); const beam = new T.Group(); beam.position.y = 1.6; g.add(beam); add(new T.Mesh(new T.BoxGeometry(2.4, .2, .25), M('#e0a92b')), 0, 0, 0, beam); add(new T.Mesh(new T.BoxGeometry(.3, .6, .4), M('#e0a92b')), 1.2, -.2, 0, beam); api.pumps.push(beam); });
    // Көктөбе мұнарасы (Алматы)
    [x, y, z] = at(76.95, 43.3, 2.5, 2); add(new T.Mesh(new T.CylinderGeometry(.08, .35, 9, 6), M('#e8505b')), x, y + 4.5, z);
    // Абай ескерткіші (Семей)
    [x, y, z] = at(80.25, 50.41, -2, 1.5); add(new T.Mesh(new T.BoxGeometry(1.4, 1.2, 1.4), M('#9a8f80')), x, y + .6, z); add(new T.Mesh(new T.CylinderGeometry(.35, .45, 1.6, 8), M('#5a6470', { metalness: .4 })), x, y + 2, z); add(new T.Mesh(new T.SphereGeometry(.32, 10, 8), M('#5a6470', { metalness: .4 })), x, y + 3.1, z);
    // Қарағанды шахтасы
    [x, y, z] = at(73.1, 49.8, 2.5, -2); const mn = new T.Group(); add(mn, x, y, z); [[-.6, -.6], [.6, -.6], [-.6, .6], [.6, .6]].forEach(([a, b]) => add(new T.Mesh(new T.BoxGeometry(.15, 4, .15), M('#7a2f2f')), a, 2, b, mn)); add(new T.Mesh(new T.TorusGeometry(.6, .1, 6, 16), M('#333')), 0, 4.2, 0, mn);
  }
  return { build, heightAt: (x, z) => heightAt(x, z), inside, zoneAt, toXZ, toLL, ZONES, PORTALS };
})();
