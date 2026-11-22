/* Аудиогид: алдын ала жазылған нейрондық қазақша дауыс (assets/audio) + сөйлеуді тану */
window.Voice = (function () {
  const enc = new TextEncoder();
  let enabled = true; try { enabled = localStorage.getItem('sg_voice') !== '0'; } catch (e) {}
  const player = new Audio(); player.preload = 'auto';
  let queue = [], token = 0, onEnd = null, unlocked = false;
  const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
  function unlock() {
    if (unlocked) return; unlocked = true;
    try { if (player.paused && !player.src) { player.src = SILENT; const p = player.play(); p && p.catch(() => { unlocked = false; }); } } catch (e) {}
  }
  ['pointerdown', 'keydown', 'touchend'].forEach(ev => addEventListener(ev, unlock, true));
  function key(text) { let h = 0x811c9dc5; for (const b of enc.encode('kk|' + text.trim())) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; } return ('0000000' + h.toString(16)).slice(-8); }
  const has = t => !!(window.AUDIO_MAP || {})[key(t)];
  function kkVoice() { const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || []; return vs.find(v => /^kk/i.test(v.lang)); }
  function playOne(text, my) {
    return new Promise(res => {
      if (my !== token) return res();
      if (has(text)) {
        player.onended = player.onerror = () => res();
        player.src = 'assets/audio/' + key(text) + '.mp3';
        const p = player.play(); p && p.catch(() => res());
      } else if (window.speechSynthesis && kkVoice()) { // тек жергілікті қазақ дауысы болса ғана (акцентсіз)
        const u = new SpeechSynthesisUtterance(text); u.voice = kkVoice(); u.lang = u.voice.lang; u.rate = .95;
        u.onend = u.onerror = () => res(); speechSynthesis.speak(u);
      } else res();
    });
  }
  async function say(texts, opts) {
    opts = opts || {}; stop(); if (!enabled && !opts.force) return;
    const my = ++token; texts = [].concat(texts).filter(Boolean);
    const btn = opts.btn; if (btn) btn.classList.add('speaking');
    document.body.classList.add('voice-on');
    for (const t of texts) { if (my !== token) break; await playOne(t, my); }
    if (my === token) { document.body.classList.remove('voice-on'); if (btn) btn.classList.remove('speaking'); opts.done && opts.done(); }
  }
  function stop() {
    token++; try { player.pause(); } catch (e) {}
    try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {}
    document.querySelectorAll('.speaking').forEach(b => b.classList.remove('speaking'));
    document.body.classList.remove('voice-on');
  }
  function setEnabled(v) { enabled = v; try { localStorage.setItem('sg_voice', v ? '1' : '0'); } catch (e) {} if (!v) stop(); }
  /* Сөйлеуді тану (айтылым тапсырмасы) */
  function canListen() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }
  function listen(lang, onPartial) {
    return new Promise((res, rej) => {
      const R = window.SpeechRecognition || window.webkitSpeechRecognition; if (!R) return rej('no');
      const r = new R(); r.lang = lang || 'kk-KZ'; r.interimResults = true; r.continuous = true;
      let finalText = '';
      r.onresult = e => { let interim = ''; for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) finalText += t + ' '; else interim += t; } onPartial && onPartial((finalText + interim).trim()); };
      r.onerror = e => rej(e.error); r.onend = () => res(finalText.trim());
      r.start(); listen.current = r;
    });
  }
  function stopListen() { try { listen.current && listen.current.stop(); } catch (e) {} }
  return { say, stop, has, key, setEnabled, get enabled() { return enabled; }, canListen, listen, stopListen };
})();
