/* Оқушы прогресі: уақыт, оқу, ұпай, тапсырмалар — мұғалімге синхрондалады */
window.Sfx = (function () {
  let ac; const ctx = () => ac || (ac = new (window.AudioContext || window.webkitAudioContext)());
  function tone(f, d, type, vol, delay) { try { const c = ctx(), o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, c.currentTime + (delay || 0)); g.gain.linearRampToValueAtTime(vol || .15, c.currentTime + (delay || 0) + .02); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + (delay || 0) + d); o.connect(g); g.connect(c.destination); o.start(c.currentTime + (delay || 0)); o.stop(c.currentTime + (delay || 0) + d + .05); } catch (e) {} }
  return { page() { tone(1400, .08, 'triangle', .05); tone(900, .12, 'triangle', .04, .05); }, chime() { tone(880, .25); tone(1320, .35, 'sine', .12, .1); }, ok() { tone(660, .15); tone(990, .3, 'sine', .12, .12); }, bad() { tone(220, .3, 'triangle', .12); }, win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, .4, 'sine', .12, i * .12)); } };
})();

window.Progress = (function () {
  let rec = null, id = null, dirty = false, reading = null;
  const blank = () => ({ sec: 0, worlds: {}, readSec: 0, books: {}, done: {}, score: 0, items: {}, visits: 0, last: Date.now() });
  function start(userId) {
    id = userId; rec = Object.assign(blank(), Net.get('prog/' + id) || {}); rec.visits = (rec.visits || 0) + 1; delete rec._ts; save(true);
  }
  function merge(remote) { // сервердегі жазба жаңарақ болса (басқа құрылғыдан)
    if (!rec || !remote) return; ['sec', 'readSec', 'score', 'visits'].forEach(k => { if ((remote[k] || 0) > (rec[k] || 0)) rec[k] = remote[k]; });
    ['worlds', 'books'].forEach(k => Object.keys(remote[k] || {}).forEach(w => { if ((remote[k][w] || 0) > (rec[k][w] || 0)) rec[k][w] = remote[k][w]; }));
    Object.keys(remote.done || {}).forEach(k => { if (!rec.done[k]) rec.done[k] = remote.done[k]; });
    Object.keys(remote.items || {}).forEach(k => { const s = new Set([...(rec.items[k] || []), ...remote.items[k]]); rec.items[k] = [...s]; });
  }
  function save(now) { if (!rec || !id) return; dirty = true; if (now) flush(); }
  function flush() { if (!dirty || !rec) return; dirty = false; rec.last = Date.now(); Net.put('prog/' + id, rec); App.updateBadges(); }
  setInterval(() => {
    if (!rec || document.hidden || !App.user()) return;
    rec.sec++; const w = App.where(); rec.worlds[w] = (rec.worlds[w] || 0) + 1;
    const rb = reading || (window.Book && Book.current); if (rb) { rec.readSec++; rec.books[rb] = (rec.books[rb] || 0) + 1; }
    dirty = true;
  }, 1000);
  setInterval(flush, 15000);
  addEventListener('pagehide', flush); document.addEventListener('visibilitychange', () => document.hidden && flush());
  function award(key, pts, ans, title) {
    if (!rec) return false; const was = rec.done[key];
    if (was) { if (ans) { was.a = ans; save(true); } return false; }
    rec.done[key] = { p: pts, ts: Date.now(), t: title || key }; if (ans) rec.done[key].a = ans;
    rec.score += pts; save(true); App.toast(`+${pts} ұпай · ${title || ''}`); Sfx.win();
    checkWorld(key.split(':')[0]); return true;
  }
  function checkWorld(wid) {
    const w = WORLDS.find(x => x.id === wid); if (!w || isDone(wid + ':world')) return;
    const need = worldKeys(w); if (need.every(k => rec.done[k])) { rec.done[wid + ':world'] = { p: 30, ts: Date.now(), t: 'Әлем толық: ' + w.name }; rec.score += 30; save(true); setTimeout(() => { Voice.say(TEXT.phrases.worldDone); App.celebrate(true); }, 1500); }
  }
  function worldKeys(w) { return [w.id + ':museum', w.id + ':case', w.id + ':read', w.id + ':write', w.id + ':speak', ...w.labs.map((l, i) => w.id + ':lab' + i), ...w.books.map(b => w.id + ':book:' + b.id), ...w.quests.map((q, i) => w.id + ':quest:' + i)]; }
  function worldPct(w) { if (!rec) return 0; const k = worldKeys(w); return Math.round(k.filter(x => rec.done[x]).length / k.length * 100); }
  const isDone = k => !!(rec && rec.done[k]);
  function questItems(wid, qi) { return (rec && rec.items[wid + ':' + qi]) || []; }
  function collectItem(wid, qi, k) { const key = wid + ':' + qi; rec.items[key] = rec.items[key] || []; if (!rec.items[key].includes(k)) rec.items[key].push(k); save(); return rec.items[key].length; }
  return { start, merge, award, isDone, questItems, collectItem, worldPct, worldKeys, flush, setReading: b => reading = b, get rec() { return rec; }, stop() { flush(); rec = null; id = null; } };
})();
