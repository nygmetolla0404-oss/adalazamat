#!/usr/bin/env python3
"""Generates the Kazakh audio guide (assets/audio/*.mp3) and js/audio-map.js.

Usage:  python3 tools/gen_audio.py        (run from the smart-guide folder)
Needs:  pip3 install edge-tts ; ffmpeg (only for mixed Kazakh/English lines)
Every narrated text from js/w*.js and js/common.js is voiced by the neural
kk-KZ-AigulNeural voice; English sentences use en-GB-SoniaNeural.
Already generated files are skipped, so after editing texts just run it again.
"""
import asyncio, json, os, re, subprocess, sys, tempfile, glob
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'audio')
KK, EN = 'kk-KZ-AigulNeural', 'en-GB-SoniaNeural'
os.makedirs(OUT, exist_ok=True)


def key(text):
    h = 0x811c9dc5
    for b in ('kk|' + text).encode('utf-8'):
        h ^= b
        h = (h * 0x01000193) & 0xffffffff
    return '%08x' % h


def load_json_from_js(path, start):
    src = open(path, encoding='utf-8').read()
    i = src.index(start) + len(start)
    j = max(src.rindex('}'), src.rindex(']')) + 1
    return json.loads(src[i:j])


def collect():
    texts = []
    add = lambda t: t and texts.append(t.strip())
    for f in sorted(glob.glob(os.path.join(ROOT, 'js', 'w[0-9].js'))):
        w = load_json_from_js(f, 'WORLDS.push(')
        add(w['name']); add(w['intro']); add(w['motto'])
        for b in w['books']:
            add(b['title'] + '. ' + b['author'] + '.'); add(b['summary']); add(b['quote'])
            for p in b['paras']: add(p)
            for q in b['quiz']: add(q['q'])
        for m in w['museum']: add(m['title'] + '. ' + m['text'])
        for l in w['labs']:
            add(l['intro'])
            for q in l.get('quiz', []): add(q['q'])
            for p in l.get('problems', []): add(p['q'])
            for fct in l.get('facts', []): add(fct)
        for q in w['quests']: add(q['intro'])
        c = w['case']; add(c['text'])
        for o in c['options']: add(o['fb'])
        for t in w['tasks'].values(): add(t['prompt'])
        for t in w['trailer']: add(t)
    c = load_json_from_js(os.path.join(ROOT, 'js', 'common.js'), 'window.TEXT = ')
    for v in c['phrases'].values(): add(v)
    for v in c.get('zones', {}).values(): add(v)
    hs = load_json_from_js(os.path.join(ROOT, 'js', 'holidays.js'), 'window.HOLIDAYS = ')
    for hd in hs:
        add(hd['name']); add(hd['intro']); add(hd.get('quest', {}).get('intro')); add(hd['write']); add(hd['speak']); add(hd['case']['text']); add('Картаға оралып, басқа порталдарды тап!')
        for x in hd['paras'] + hd['facts']: add(x)
        for q in hd['quiz']: add(q['q'])
        for o in hd['case']['options']: add(o['fb'])
        for wid in hd['values']: pass
    for t in ['Мазмұны. Тақырыпты бас, кітап өзі парақталады.', 'Мазмұны.', 'Сен не істер едің? Дұрыс шешімді таңда.', 'Дұрыс шешімді таңда.', 'Жарайсың! Нәтижеңді қара.', 'Құттықтаймын! Сен мереке кітабын оқып шықтың.', 'Бұл шығарма құндылыққа қалай байланысты? Өз ойыңды айт.']: add(t)
    for v in c['values']: add(v['text'])
    WN = {}
    for p in c['adal']: add(p)
    i = c['idea']; add(i['lead']); add(i['annotation_kk'])
    for s in i['sections']:
        for p in s.get('p', []): add(p)
    add(c['author']['about'])
    seen, out = set(), []
    for t in texts:
        if t not in seen:
            seen.add(t); out.append(t)
    return out


def segments(text):
    """Split into runs of Kazakh / English sentences."""
    parts = re.split(r'(?<=[.!?»])\s+', text)
    segs = []
    for p in parts:
        lat = len(re.findall(r'[A-Za-z]', p)); cyr = len(re.findall(r'[А-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі]', p))
        v = EN if lat > cyr else KK
        if segs and segs[-1][0] == v: segs[-1][1] += ' ' + p
        else: segs.append([v, p])
    return segs


async def synth(text, sem, stats):
    path = os.path.join(OUT, key(text) + '.mp3')
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        stats['skip'] += 1; return
    async with sem:
        segs = segments(text)
        for attempt in range(4):
            try:
                if len(segs) == 1:
                    await edge_tts.Communicate(text, segs[0][0], rate='-5%').save(path)
                else:
                    tmp = tempfile.mkdtemp(); files = []
                    for n, (v, t) in enumerate(segs):
                        fp = os.path.join(tmp, '%d.mp3' % n)
                        await edge_tts.Communicate(t, v, rate='-5%').save(fp); files.append(fp)
                    lst = os.path.join(tmp, 'l.txt')
                    open(lst, 'w').write(''.join("file '%s'\n" % f for f in files))
                    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst,
                                    '-ac', '1', '-ar', '24000', '-b:a', '48k', path], check=True)
                stats['new'] += 1; return
            except Exception as e:
                if attempt == 3: print('FAILED:', text[:60], e, file=sys.stderr); stats['fail'] += 1
                await asyncio.sleep(2 + attempt * 3)


async def main():
    texts = collect()
    sem, stats = asyncio.Semaphore(6), {'new': 0, 'skip': 0, 'fail': 0}
    await asyncio.gather(*(synth(t, sem, stats) for t in texts))
    amap = {key(t): 1 for t in texts if os.path.exists(os.path.join(OUT, key(t) + '.mp3'))}
    with open(os.path.join(ROOT, 'js', 'audio-map.js'), 'w', encoding='utf-8') as f:
        f.write('window.AUDIO_MAP=' + json.dumps(amap, separators=(',', ':')) + ';\n')
    print('texts:', len(texts), stats, 'mapped:', len(amap))


asyncio.run(main())
