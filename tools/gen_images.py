"""Genera les il·lustracions amb Seedream 5.5 (OpenRouter).
Ús: OPENROUTER_API_KEY=... python3 tools/gen_images.py [sheet|scenes|<id> ...]
La clau només s'usa en local: cap imatge es genera al navegador de l'alumnat."""
import os, sys, json, base64, re, subprocess, time, urllib.request, concurrent.futures as cf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'tools', 'raw'); OUT = os.path.join(ROOT, 'assets', 'img')
os.makedirs(RAW, exist_ok=True); os.makedirs(OUT, exist_ok=True)
KEY = os.environ['OPENROUTER_API_KEY']
MODEL = 'bytedance-seed/seedream-5-5'

STYLE = ("Flat editorial illustration, clean vector style with subtle grain, limited palette "
         "(deep navy #0F1B2D, signal amber #F5A623, white, soft greys, muted greens), soft daylight, "
         "Barcelona urban setting. The two emergency medical technicians from the reference image: "
         "a woman with a dark ponytail and a man with a short beard, both in dark green uniforms with "
         "reflective silver stripes and amber shoulder details. Generic white ambulance with amber "
         "stripes. Strictly no red cross, no crescent, no logos, no emblems, no readable text, no letters, "
         "no numbers, no blood, no gore. Calm, respectful documentary tone. 16:9 composition, main action "
         "in the centre-lower area, quiet background in the top quarter. SCENE: {scene}.")

SHEET = ("Character reference sheet, flat editorial vector illustration with subtle grain, white background, "
         "two emergency medical technicians standing side by side, full body, front view and three-quarter view: "
         "a woman in her late twenties with a dark ponytail and a man in his thirties with a short dark beard, "
         "both wearing identical dark green uniforms with reflective silver stripes on arms and legs and amber "
         "shoulder details, black boots, a portable radio on the chest strap. Strictly no red cross, no logos, "
         "no emblems, no text, no letters. Palette deep navy, amber, white, greys, dark green.")

def call(prompt, refs=None):
    body = {'model': MODEL, 'prompt': prompt, 'aspect_ratio': '16:9'}
    if refs:
        body['input_references'] = [{'type': 'image_url', 'image_url': {'url': r}} for r in refs]
    req = urllib.request.Request('https://openrouter.ai/api/v1/images', data=json.dumps(body).encode(),
        headers={'Authorization': f'Bearer {KEY}', 'Content-Type': 'application/json'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                res = json.loads(r.read())
            img = res['data'][0]
            data = base64.b64decode(img['b64_json']) if 'b64_json' in img else urllib.request.urlopen(img['url']).read()
            return data, res.get('usage', {}).get('cost', 0)
        except Exception as e:
            err = e.read()[:300] if hasattr(e, 'read') else e
            print('  retry', attempt, err, flush=True); time.sleep(4)
    raise RuntimeError('failed')

def to_webp(src, dst):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-vf', 'scale=1600:-2',
                    '-c:v', 'libwebp', '-quality', '82', dst], check=True)

def sheet_ref():
    p = os.path.join(RAW, 'sheet.png')
    return 'data:image/png;base64,' + base64.b64encode(open(p, 'rb').read()).decode()

def scenes():
    src = open(os.path.join(ROOT, 'data.js'), encoding='utf-8').read()
    return re.findall(r"\{ id: '(s3-[^']+)'.*?prompt: '((?:[^'\\]|\\.|’)*)'", src, re.S)

def gen_scene(sid, prompt, ref):
    data, cost = call(STYLE.format(scene=prompt.replace("\\'", "'")), [ref])
    raw = os.path.join(RAW, sid + '.png'); open(raw, 'wb').write(data)
    to_webp(raw, os.path.join(OUT, sid + '.webp'))
    return sid, cost

if __name__ == '__main__':
    args = sys.argv[1:] or ['scenes']
    if args[0] == 'extra':
        pass
    if args[0] == 'sheet':
        data, cost = call(SHEET); open(os.path.join(RAW, 'sheet.png'), 'wb').write(data); print('sheet', cost)
        sys.exit()
    todo = [] if args[0] == 'extra' else scenes()
    if args[0] not in ('scenes', 'extra'):
        todo = [t for t in todo if t[0] in args]
    ref = sheet_ref(); total = 0
    with cf.ThreadPoolExecutor(6) as ex:
        for sid, cost in ex.map(lambda t: gen_scene(t[0], t[1], ref), todo):
            total += cost or 0; print(sid, cost, flush=True)
    print('TOTAL', round(total, 3), 'USD,', len(todo), 'imatges')

EXTRA = {
  'hero': 'split composition: on the left a calm dispatcher with a headset at a coordination centre desk with several dark screens showing abstract maps, on the right the two technicians in the front seats of an ambulance at dusk, the woman holding the handheld radio microphone close to her mouth, amber dashboard light',
  'cabina': 'interior view of an ambulance cab from the back seat at dusk, the two technicians in the front seats seen from behind, the man driving, the woman holding a handheld radio microphone, a vehicle radio unit with an amber display on the dashboard, city street visible through the windscreen',
}
if __name__ == '__main__' and sys.argv[1:2] == ['extra']:
    ref = sheet_ref()
    for k, p in EXTRA.items():
        data, cost = call(STYLE.format(scene=p), [ref]); raw = os.path.join(RAW, k + '.png'); open(raw, 'wb').write(data)
        to_webp(raw, os.path.join(OUT, k + '.webp')); print(k, cost)
