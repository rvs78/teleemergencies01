"""Imatges realistes de la Fase 2 (Seedream 5.5). Ús: OPENROUTER_API_KEY=... python3 tools/gen_f2.py [codi ...]"""
import os, sys, json, re, subprocess, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_images import call, ROOT
OUT = os.path.join(ROOT, 'assets', 'img', 'f2'); RAW = os.path.join(ROOT, 'tools', 'raw'); os.makedirs(OUT, exist_ok=True)
STYLE = ("Photorealistic documentary photograph, 35mm lens, natural light, shallow depth of field, Barcelona, Catalonia. "
  "Emergency medical technicians wear high-visibility yellow jackets with reflective silver stripes and navy blue trousers. "
  "Ambulances are yellow vans with reflective stripes and blue light bars. Clothing and vehicles carry no symbols or insignia at all: plain fabric and plain bodywork, no badges, no markings, no lettering, no blood, no gore, respectful and calm tone, faces natural and not looking at the camera. SCENE: {scene}. 16:9.")
cid = lambda c: 'c' + re.sub(r'[^0-9a-z]+', '-', c.lower()).strip('-')
js = "global.window={};require(%r);console.log(JSON.stringify(window.DATA.F2))" % os.path.join(ROOT, 'data.js')
F2 = json.loads(subprocess.run(['node', '-e', js], capture_output=True, text=True, check=True).stdout)
if sys.argv[1:]: F2 = [x for x in F2 if x['code'] in sys.argv[1:]]
def gen(x):
    data, cost = call(STYLE.format(scene=x['prompt'])); raw = os.path.join(RAW, 'f2_' + cid(x['code']) + '.png'); open(raw, 'wb').write(data)
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-vf', 'scale=1280:-2', '-c:v', 'libwebp', '-quality', '78', os.path.join(OUT, cid(x['code']) + '.webp')], check=True)
    return x['code'], cost
tot = 0
with cf.ThreadPoolExecutor(6) as ex:
    for c, cost in ex.map(gen, F2): tot += cost or 0; print(c, cost, flush=True)
print('TOTAL', round(tot, 2))
