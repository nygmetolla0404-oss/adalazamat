/* Қосымша байланыстар: жәдігерлердің 3D модельдері, нақты фотолар, квест заттарының модельдері */
window.EXTRA = {
  museum: {
    w1: [['goldman', 'goldman'], ['bow', 'khanate'], ['candle', 'jeltoqsan'], ['flag', 'jeltoqsan']],
    w2: [['shanyrak', 'shanyrak'], ['people', null], ['horse', null], ['tulip', 'tulip']],
    w3: [['river', 'irtysh'], ['pine', null], ['anvil', 'yurt'], ['sprout', null]],
    w4: [['telescope', 'farabi'], ['rocket', 'baikonur'], ['robot', null], ['solar', 'wind']],
    w5: [['scales', 'tolebi'], ['tap', null], ['bulb', null], ['flask', null]],
    w6: [['scroll', 'tauke'], ['bluebook', 'constitution'], ['kids', null], ['traffic', null]]
  },
  holidayMuseum: { h1: ['tulip', 'tulip'], h2: ['monument', 'jeltoqsan'], h3: ['people', 'shanyrak'], h4: ['bluebook', 'constitution'], h5: ['tower', 'astana'] },
  region: { w1: 'astana', w2: 'karaganda', w3: 'irtysh', w4: 'almaty', w5: 'caspian', w6: 'turkistan' },
  lit: { b1: 'abai', b2: 'magzhan', b3: 'khanate', b5: 'kazybek', b7: 'altynsarin', b8: 'altynsarin', b9: 'satbayev', b10: 'altynsarin', b11: 'farabi', b12: 'aubakirov', b13: 'tolebi', b14: 'abai', b15: 'altynsarin', b16: 'tauke', b17: 'constitution' },
  holiday: { h1: 'tulip', h2: 'jeltoqsan', h3: 'yurt', h4: null, h5: 'astana' },
  holidayGround: { h1: '#a8d36a', h2: '#9cc86a', h3: '#a3d07a', h4: '#9fcd78', h5: '#a6cf74' },
  item: { '🇰🇿': ['flag'], '🌞': ['emblem'], '🪕': ['dombra'], '⭕': ['shanyrak'], '🏹': ['bow'], '🎵': ['note'], '👑': ['goldman'],
    '💧': ['jar', '#7fd0ff'], '🥩': ['jar', '#c0392b'], '🧂': ['jar', '#ffffff'], '🧈': ['jar', '#ffd966'], '🌾': ['jar', '#f3e2b0'], '🍚': ['jar', '#f2c94c'], '🥛': ['jar', '#fdfdf6'],
    '🚀': ['star'], '🏅': ['star'], '🔬': ['star'], '🎨': ['star'], '🏭': ['star'],
    '🗑️': ['trash'], '🚦': ['traffic'], '🪑': ['bench'], '✏️': ['wall'], '🐕': ['dog'] }
};
/* Жәдігерлерге модель мен фото қосу */
WORLDS.forEach(w => (EXTRA.museum[w.id] || []).forEach(([m, p], i) => { if (w.museum[i]) { w.museum[i].model = m; w.museum[i].photo = p; } }));
window.photo = key => (window.PHOTOS && key && PHOTOS[key]) || null;
