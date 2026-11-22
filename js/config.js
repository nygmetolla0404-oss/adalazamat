/* ===== Smart Guide баптаулары =====
   Әр сынып жетекшісі өз сыныбын тіркейді және «сынып кодын» алады.
   Оқушылар осы кодпен тіркеледі — мұғалім тек өз оқушыларын көреді.
   DEMO_TEACHER – автордың дайын мұғалім аккаунты.
   BROKERS – тірі әлемге арналған тегін серверлер (бір уақытта екеуіне жазылады). */
window.CONFIG = {
  BASE: 'smart-guide-adal-azamat-v2',
  SECRET: 'smart-guide-adal-azamat-2026-bars-kyran',
  DEMO_TEACHER: {
    login: 'mugalim', pass: 'ADAL2026', code: 'ADAL10B',
    name: 'Ахмедова Гулбону Қалбайқызы', school: 'Балжан Бөлтірікова атындағы №4 мектеп-лицей', cls: '10 «Б»'
  },
  BROKERS: ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt']
};
/* Сынып коды: сілтемедегі ?class=КОД → соңғы қолданылған → демо сынып */
CONFIG.classFromUrl = (function () { try { const c = new URLSearchParams(location.search).get('class'); return c && /^[A-Za-z0-9]{3,12}$/.test(c) ? c.toUpperCase() : null; } catch (e) { return null; } })();
CONFIG.CLASS = CONFIG.classFromUrl || (function () { try { return localStorage.getItem('sg_class'); } catch (e) { return null; } })() || CONFIG.DEMO_TEACHER.code;
