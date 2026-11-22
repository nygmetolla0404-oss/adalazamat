/* Тірі әлем: шифрланған MQTT арқылы деректер мен қатысуды синхрондау.
   Әр сыныптың өз кеңістігі бар (сынып коды). «@/» деп басталатын жолдар — барлық мектепке ортақ
   (мұғалімдер тізімі). Деректер екі тегін серверге жазылады, уақыт белгісімен біріктіріледі және
   әр құрылғыда жергілікті көшірмесі сақталады. */
window.Net = (function () {
  const C = window.CONFIG;
  const enc = new TextEncoder(), dec = new TextDecoder();
  function fnv(s) { let h = 0x811c9dc5; for (const b of enc.encode(s)) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; } return h >>> 0; }
  const hex = s => ('0000000' + fnv(s).toString(16)).slice(-8);
  const id = login => hex('id|' + C.SECRET + '|' + String(login).toLowerCase().trim());
  const PFXG = 'sga2/g' + hex('global|' + C.BASE + C.SECRET);
  let ROOM = '', PFX = '', CK = '';

  /* ---- шифрлау (XOR-ағын, кілт SECRET-тен) ---- */
  function stream(seed) { let x = seed | 0 || 1, y = fnv(C.SECRET) | 0 || 7; return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; y = (y + 0x6D2B79F5) | 0; return (x ^ y) & 255; }; }
  function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s); }
  function unb64(s) { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function seal(obj) { const iv = (Math.random() * 4294967295) >>> 0, data = enc.encode(JSON.stringify(obj)), ks = stream(fnv(C.SECRET + '|' + iv)); const out = new Uint8Array(data.length); for (let i = 0; i < data.length; i++) out[i] = data[i] ^ ks(); return iv.toString(36) + '.' + b64(out); }
  function open(str) { try { const [ivs, body] = str.split('.'); const iv = parseInt(ivs, 36), data = unb64(body), ks = stream(fnv(C.SECRET + '|' + iv)); const out = new Uint8Array(data.length); for (let i = 0; i < data.length; i++) out[i] = data[i] ^ ks(); return JSON.parse(dec.decode(out)); } catch (e) { return null; } }
  const topicOf = p => p.indexOf('@/') === 0 ? PFXG + '/' + p.slice(2) : PFX + '/' + p;
  const pathOf = t => t.indexOf(PFXG + '/') === 0 ? '@/' + t.slice(PFXG.length + 1) : t.indexOf(PFX + '/') === 0 ? t.slice(PFX.length + 1) : null;

  /* ---- жергілікті кэш ---- */
  let cache = {}, saveT = 0;
  function saveCache() { clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem(CK, JSON.stringify(cache)); } catch (e) {} }, 400); }
  const listeners = [];
  function emit(path, val) { listeners.forEach(l => { if (path.indexOf(l.prefix) === 0) try { l.fn(path, val); } catch (e) { console.error(e); } }); }
  function accept(path, val) { const old = cache[path]; if (old && old._ts >= (val._ts || 0)) return false; cache[path] = val; saveCache(); emit(path, val); return true; }

  /* ---- MQTT ---- */
  const clients = []; let subs = new Set(), will = null, pending = new Set(), statusFn = null, presence = {};
  function status() { const n = clients.filter(c => c.connected).length; statusFn && statusFn(n > 0, n); return n > 0; }
  function setRoom(code) {
    ROOM = C.BASE + '|' + String(code || '').toUpperCase(); PFX = 'sga2/' + hex('room|' + ROOM) + hex('r2|' + ROOM + C.SECRET); CK = 'sg_cache2_' + hex('c|' + ROOM);
    try { cache = JSON.parse(localStorage.getItem(CK) || '{}'); } catch (e) { cache = {}; }
    presence = {}; pending = new Set([...pending].filter(p => p.indexOf('@/') === 0));
  }
  function connect(opts) {
    opts = opts || {}; will = opts.will || null; if (opts.subs) subs = new Set(opts.subs);
    clients.splice(0).forEach(c => { try { c.end(false); } catch (e) {} });
    if (!window.mqtt) { status(); return; }
    C.BROKERS.forEach(url => {
      const o = { clientId: 'sg_' + Math.random().toString(36).slice(2, 10), clean: true, reconnectPeriod: 4000, connectTimeout: 9000, keepalive: 30 };
      if (will) o.will = { topic: topicOf(will.path), payload: seal(will.data), qos: 0, retain: false };
      let c; try { c = mqtt.connect(url, o); } catch (e) { return; }
      clients.push(c);
      c.on('connect', () => { subs.forEach(s => c.subscribe(topicOf(s), { qos: 0 })); pending.forEach(p => { if (cache[p]) c.publish(topicOf(p), seal(cache[p]), { qos: 1, retain: true }); }); status(); });
      c.on('close', status); c.on('offline', status); c.on('error', () => {});
      c.on('message', (topic, payload) => {
        const path = pathOf(topic); if (path == null) return; const val = open(payload.toString()); if (!val) return;
        if (path.indexOf('pres/') === 0) { const pid = path.slice(5); if (val.off) { delete presence[pid]; emit(path, null); } else { presence[pid] = { data: val, seen: Date.now() }; emit(path, val); } return; }
        const mine = cache[path] && cache[path]._ts === val._ts;
        if (accept(path, val) || mine) pending.delete(path);
      });
    });
  }
  function retry() { pending.forEach(p => { if (cache[p]) clients.forEach(c => c.connected && c.publish(topicOf(p), seal(cache[p]), { qos: 1, retain: true })); }); }
  setInterval(retry, 8000);
  function subscribe(list) { list.forEach(s => { if (subs.has(s)) return; subs.add(s); clients.forEach(c => c.connected && c.subscribe(topicOf(s))); }); }
  function put(path, data) {
    const val = Object.assign({}, data, { _ts: Date.now() }); cache[path] = val; saveCache(); emit(path, val);
    pending.add(path); clients.forEach(c => { if (c.connected) c.publish(topicOf(path), seal(val), { qos: 1, retain: true }); });
    return val;
  }
  const del = path => put(path, { _del: 1 });
  function get(path) { const v = cache[path]; return v && !v._del ? v : null; }
  function all(prefix) { const out = {}; Object.keys(cache).forEach(k => { if (k.indexOf(prefix) === 0 && !cache[k]._del) out[k.slice(prefix.length)] = cache[k]; }); return out; }
  function on(prefix, fn) { const l = { prefix, fn }; listeners.push(l); return () => { const i = listeners.indexOf(l); if (i >= 0) listeners.splice(i, 1); }; }
  function send(path, data) { clients.forEach(c => c.connected && c.publish(topicOf(path), seal(data), { qos: 0, retain: false })); }
  function waitOnline(ms) { return new Promise(res => { if (clients.some(c => c.connected)) return res(true); const t0 = Date.now(), iv = setInterval(() => { if (clients.some(c => c.connected) || Date.now() - t0 > ms) { clearInterval(iv); res(clients.some(c => c.connected)); } }, 150); }); }
  async function fetchOnce(path, ms) { // сервердегі сақталған жазбаны күту
    ms = ms || 3500; const t0 = cache[path] ? cache[path]._ts : 0;
    const online = await waitOnline(Math.min(ms, 4000)); subscribe([path]); if (!online) return get(path);
    return new Promise(res => { const off = on(path, (p, v) => { if (p === path && v && v._ts > t0) { off(); clearTimeout(tm); res(get(path)); } }); const tm = setTimeout(() => { off(); res(get(path)); }, ms); });
  }
  function livePresence(maxAge) { const now = Date.now(), out = []; Object.keys(presence).forEach(k => { if (now - presence[k].seen < (maxAge || 15000)) out.push(presence[k].data); }); return out; }
  setRoom(C.CLASS);
  return { id, hex, setRoom, connect, subscribe, put, del, get, all, on, send, fetchOnce, livePresence, onStatus: f => { statusFn = f; status(); }, get online() { return clients.some(c => c.connected); }, get room() { return ROOM; } };
})();
