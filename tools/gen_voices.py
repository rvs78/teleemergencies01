"""Genera les veus (MP3 estàtics) amb ElevenLabs v3 via OpenRouter, a partir de data.js i tools/narration.json.
Ús: OPENROUTER_API_KEY=... python3 tools/gen_voices.py [ids...]   (sense ids: tot)
Per canviar de veu, edita tools/voices.json."""
import os, sys, json, subprocess, urllib.request, concurrent.futures as cf, re, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'audio'); os.makedirs(OUT, exist_ok=True)
CFG = json.load(open(os.path.join(ROOT, 'tools', 'voices.json')))
NAR = json.load(open(os.path.join(ROOT, 'tools', 'narration.json')))
KEY = os.environ['OPENROUTER_API_KEY']
cid = lambda c: 'c' + re.sub(r'[^0-9a-z]+', '-', c.lower()).strip('-')
def load_data():
    js = "global.window={};require(%r);console.log(JSON.stringify(window.DATA))" % os.path.join(ROOT, 'data.js')
    return json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout)
def jobs(D):
    v = CFG['voices']; out = []
    for i, it in enumerate(D['LISTEN']): out.append((it['id'], it['say'], v[i % 2]))
    out.append((D['F2_REPEAT']['id'], D['F2_REPEAT']['say'], v[0]))
    for i, it in enumerate(D['F2']): out.append((cid(it['code']), it['say'], v[i % 2]))
    for i, it in enumerate(D['DECODE']): out.append((it['id'], it['say'], v[(i + 1) % 2]))
    for i, sc in enumerate(D['RADIO']):
        for j, st in enumerate(sc['steps']):
            if st['type'] == 'rx': out.append((f"{sc['id']}-{j}", st['say'], v[i % 2]))
    for k, t in NAR.items(): out.append(('nar-' + k, t, CFG['narrator']))
    return out
def tts(job):
    jid, text, voice = job
    body = {'model': CFG['model'], 'voice': voice, 'input': text, 'response_format': 'mp3'}
    req = urllib.request.Request('https://openrouter.ai/api/v1/audio/speech', data=json.dumps(body).encode(),
        headers={'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'})
    for a in range(3):
        try: data = urllib.request.urlopen(req, timeout=180).read(); break
        except Exception as e:
            if a == 2: raise
            time.sleep(3)
    raw = os.path.join(OUT, jid + '.raw.mp3'); open(raw, 'wb').write(data)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-af',
        'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,loudnorm=I=-18:TP=-2',
        '-ac', '1', '-ar', '44100', '-b:a', '64k', os.path.join(OUT, jid + '.mp3')], check=True)
    os.remove(raw); return jid, voice, len(text)
if __name__ == '__main__':
    J = jobs(load_data())
    if sys.argv[1:]: J = [j for j in J if j[0] in sys.argv[1:]]
    mpath = os.path.join(OUT, 'manifest.json')
    man = json.load(open(mpath)).get('files', {}) if os.path.exists(mpath) and sys.argv[1:] else {}
    chars = 0
    with cf.ThreadPoolExecutor(4) as ex:
        for jid, voice, n in ex.map(tts, J): man[jid] = voice; chars += n
    json.dump({'model': CFG['model'], 'files': man}, open(mpath, 'w'), indent=1)
    print(len(J), 'clips,', chars, 'caràcters')
