"""Genera les veus de CECOS (fitxers MP3 estàtics) a partir de data.js.
Ús: OPENROUTER_API_KEY=... python3 tools/gen_voices.py
Per canviar de veu o d'idioma, edita tools/voices.json (i, si cal, els camps «say» de data.js)."""
import os, json, subprocess, urllib.request, concurrent.futures as cf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'audio'); os.makedirs(OUT, exist_ok=True)
CFG = json.load(open(os.path.join(ROOT, 'tools', 'voices.json')))
KEY = os.environ['OPENROUTER_API_KEY']

def load_data():
    js = "global.window={};require(%r);console.log(JSON.stringify(window.DATA))" % os.path.join(ROOT, 'data.js')
    return json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout)

def jobs(D):
    v = CFG['voices']; out = []
    for i, it in enumerate(D['LISTEN']):
        out.append((it['id'], it['say'], v[i % len(v)]))
    for i, it in enumerate(D['DECODE']):
        out.append((it['id'], it['say'], v[(i + 1) % len(v)]))
    for i, sc in enumerate(D['RADIO']):
        for j, st in enumerate(sc['steps']):
            if st['type'] == 'rx':
                out.append((f"{sc['id']}-{j}", st['say'], v[i % len(v)]))
    return out

def tts(job):
    jid, text, voice = job
    body = {'model': CFG['model'], 'voice': voice, 'input': text}
    if CFG.get('format') != 'pcm': body['response_format'] = CFG['format']
    req = urllib.request.Request('https://openrouter.ai/api/v1/audio/speech', data=json.dumps(body).encode(),
        headers={'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'})
    data = urllib.request.urlopen(req, timeout=120).read()
    raw = os.path.join(OUT, jid + '.raw'); open(raw, 'wb').write(data)
    src = ['-f', 's16le', '-ar', str(CFG['pcm_rate']), '-ac', '1'] if CFG.get('format') == 'pcm' else []
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', *src, '-i', raw, '-af',
                    'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse',
                    '-ac', '1', '-b:a', '64k', os.path.join(OUT, jid + '.mp3')], check=True)
    os.remove(raw)
    return jid, voice

if __name__ == '__main__':
    J = jobs(load_data())
    manifest = {}
    with cf.ThreadPoolExecutor(4) as ex:
        for jid, voice in ex.map(tts, J):
            manifest[jid] = voice; print(jid, voice, flush=True)
    json.dump({'model': CFG['model'], 'files': manifest}, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
    print(len(manifest), 'fitxers')
