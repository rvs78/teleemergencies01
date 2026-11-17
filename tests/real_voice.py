"""Prova real de la cadena de veu: micròfon simulat amb un WAV → gravació temporal → WAV 16 kHz → servei de transcripció → comparació.
Requereix tests/stt_proxy.py en marxa. Ús: python3 tests/real_voice.py http://localhost:8765/ /tmp/sem.wav"""
import sys, json
from playwright.sync_api import sync_playwright
URL, WAV = sys.argv[1], sys.argv[2]
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', f'--use-file-for-fake-audio-capture={WAV}'])
    c = b.new_context(viewport={'width': 1366, 'height': 900}, permissions=['microphone']); pg = c.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.route('**/config.js', lambda r: r.fulfill(body="window.CODI3_CONFIG={stt:'http://localhost:8766'};", content_type='text/javascript'))
    pg.goto(URL); pg.evaluate('localStorage.setItem("codi3-tes-v2", JSON.stringify({v:2,email:"a@isvh.cat",name:"Prova Veu",started:1,phases:{},mistakes:[],slips:[],errs:0,helps:0}))'); pg.reload()
    pg.evaluate("DATA.SPELL=[{word:'SEM',ctx:'prova'}]; DATA.LISTEN=DATA.LISTEN.slice(0,1)")
    pg.click('[data-intro=f1]'); pg.click('#go'); pg.wait_for_selector('#ans'); pg.wait_for_timeout(500)
    aid = pg.evaluate("performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/audio\\/l/.test(n)).pop()").split('/')[-1][:-4]
    pg.fill('#ans', pg.evaluate(f'DATA.LISTEN.find(x=>x.id==={json.dumps(aid)}).answer')); pg.click('#ok'); pg.click('#nx')
    pg.wait_for_selector('#mic'); pg.click('#mic'); pg.wait_for_selector('#lvl'); pg.wait_for_timeout(600)
    print('nivell de micròfon:', round(pg.evaluate("parseFloat(document.querySelector('#lvl').style.width)||0"), 1), '%')
    box = pg.query_selector('#ptt').bounding_box(); pg.mouse.move(box['x'] + 40, box['y'] + 20); pg.mouse.down(); pg.wait_for_timeout(9000); pg.screenshot(path='/tmp/real_tx.png'); pg.mouse.up()
    pg.wait_for_selector('.feedback', timeout=30000); pg.wait_for_timeout(300)
    print('resultat:', pg.inner_text('.feedback')); pg.screenshot(path='/tmp/real_res.png'); print('errors JS:', errs or 'cap'); b.close()
