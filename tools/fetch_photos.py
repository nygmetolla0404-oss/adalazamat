#!/usr/bin/env python3
"""Downloads real-world photos from Wikimedia Commons (only free licenses) into assets/img/photos
and writes js/photos.js with author/license credits.  Usage: python3 tools/fetch_photos.py"""
import json, os, re, subprocess, sys, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'img', 'photos')
os.makedirs(OUT, exist_ok=True)
UA = {'User-Agent': 'SmartGuideEdu/1.0 (educational school project)'}
# key: list of candidate (wiki, article title) – first free Commons image wins
WANT = {
  'goldman': [('en', 'Issyk kurgan'), ('en', 'Golden Man (Kazakhstan)')],
  'khanate': [('en', 'Kazakh Khanate')],
  'jeltoqsan': [('en', 'Jeltoqsan'), ('ru', 'Декабрьские события в Алма-Ате')],
  'indep': [('ru', 'Монумент Независимости (Алма-Ата)'), ('en', 'Independence Monument (Almaty)')],
  'shanyrak': [('en', 'Shanyrak'), ('en', 'Yurt')],
  'kokpar': [('en', 'Buzkashi'), ('en', 'Kokpar')],
  'nauryz': [('en', 'Nowruz in Kazakhstan'), ('ru', 'Наурыз'), ('en', 'Nowruz')],
  'irtysh': [('en', 'Irtysh'), ('en', 'Irtysh River')],
  'semeyforest': [('en', 'Semey Ormany'), ('ru', 'Семей орманы')],
  'farabi': [('en', 'Al-Farabi')],
  'baikonur': [('en', 'Baikonur Cosmodrome')],
  'wind': [('en', 'Wind power in Kazakhstan'), ('en', 'Ereymentau Wind Farm')],
  'tolebi': [('en', 'Tole bi'), ('ru', 'Толе би')],
  'kazybek': [('en', 'Kazybek bi'), ('ru', 'Казыбек би')],
  'tauke': [('en', 'Tauke Khan'), ('ru', 'Тауке-хан')],
  'constitution': [('en', 'Constitution of Kazakhstan')],
  'bayterek': [('en', 'Bayterek Tower'), ('en', 'Baiterek (monument)')],
  'yasawi': [('en', 'Mausoleum of Khoja Ahmed Yasawi')],
  'abai': [('en', 'Abai Qunanbaiuly'), ('ru', 'Абай Кунанбаев')],
  'satbayev': [('en', 'Kanysh Satbayev'), ('ru', 'Сатпаев, Каныш Имантаевич')],
  'altynsarin': [('en', 'Ibrahim Altynsarin'), ('ru', 'Алтынсарин, Ибрай')],
  'magzhan': [('en', 'Magzhan Zhumabayev'), ('ru', 'Жумабаев, Магжан')],
  'aubakirov': [('en', 'Toktar Aubakirov')],
  'caspian': [('en', 'Caspian Sea')],
  'almaty': [('en', 'Medeu'), ('en', 'Almaty')],
  'karaganda': [('en', 'Karaganda'), ('en', 'Ulytau')],
  'astana': [('en', 'Astana')],
  'turkistan': [('en', 'Turkistan (city)')],
  'yurt': [('en', 'Yurt')],
  'dombra': [('en', 'Dombra')],
  'tulip': [('en', 'Tulipa greigii'), ('en', 'Tulipa')],
  'aral': [('en', 'Aral Sea')],
  'balkhash': [('en', 'Lake Balkhash')],
  'charyn': [('en', 'Charyn Canyon')],
  'saxaul': [('en', 'Haloxylon ammodendron')],
  'oil': [('en', 'Tengiz Field'), ('en', 'Pumpjack')],
}

import time
def get(url):
    for attempt in range(6):
        time.sleep(1.2)
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429: time.sleep(8 + attempt * 8); continue
            raise
    raise RuntimeError('rate limited')

def page_image(wiki, title):
    q = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'prop': 'pageimages', 'piprop': 'name', 'redirects': 1, 'titles': title})
    d = json.loads(get(f'https://{wiki}.wikipedia.org/w/api.php?{q}'))
    for p in d.get('query', {}).get('pages', {}).values():
        if p.get('pageimage'): return p['pageimage']
    return None

def commons_info(fname, wiki='en'):
    q = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'prop': 'imageinfo', 'iiprop': 'url|extmetadata|mime', 'iiurlwidth': 900, 'titles': 'File:' + fname})
    d = json.loads(get(f'https://{wiki}.wikipedia.org/w/api.php?' + q))
    for p in d.get('query', {}).get('pages', {}).values():
        if 'imageinfo' in p and p.get('imagerepository') == 'shared':
            return p['imageinfo'][0]
    return None

def strip(html): return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', html or '')).strip()[:90]

photos = {}
for key, cands in WANT.items():
    for wiki, title in cands:
        try:
            fn = page_image(wiki, title)
            if not fn: continue
            info = commons_info(fn, wiki)
            if not info: continue
            meta = info.get('extmetadata', {})
            lic = strip(meta.get('LicenseShortName', {}).get('value', ''))
            if not re.search(r'CC|Public domain|PD|GFDL|CC0', lic, re.I) or re.search(r'NC|ND|fair', lic): continue
            mime = info.get('mime', '')
            if 'svg' in mime: continue
            data = get(info['thumburl'])
            raw = os.path.join(OUT, key + '.src'); open(raw, 'wb').write(data)
            dst = os.path.join(OUT, key + '.jpg')
            subprocess.run(['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', '78', '-Z', '900', raw, '--out', dst], check=True, capture_output=True)
            os.remove(raw)
            photos[key] = {'src': 'assets/img/photos/' + key + '.jpg', 'credit': strip(meta.get('Artist', {}).get('value', '')) or 'Wikimedia Commons', 'license': lic, 'file': fn}
            print('OK  ', key, '<-', fn, '|', lic); break
        except Exception as e:
            print('ERR ', key, title, e, file=sys.stderr)
    else:
        if key not in photos: print('skip', key)

with open(os.path.join(ROOT, 'js', 'photos.js'), 'w', encoding='utf-8') as f:
    f.write('/* Нақты фотолар: Wikimedia Commons (еркін лицензиялар). Авторлары мен лицензиялары көрсетілген. */\n')
    f.write('window.PHOTOS=' + json.dumps(photos, ensure_ascii=False, indent=0) + ';\n')
print(len(photos), 'photos')
