"""Partida completa automàtica amb Playwright (Chrome). Ús: python3 tests/e2e.py http://localhost:8765/ shots
El reconeixement de veu es simula (window.__say). Fa errors intencionats per comprovar el feedback; desa captures i el PDF."""
import sys, os, json
from playwright.sync_api import sync_playwright

URL = sys.argv[1]; OUT = sys.argv[2] if len(sys.argv) > 2 else 'shots'; os.makedirs(OUT, exist_ok=True)
errors = []
INIT = """
window.__say = ''; window.__audio = [];
const _f = window.fetch; window.fetch = function (u) { const m = String(u).match(/audio\\/(.+)\\.mp3/); if (m) window.__audio.push(m[1]); return _f.apply(this, arguments); };
window.SpeechRecognition = class { start() { setTimeout(() => { if (window.__say && this.onresult) { const r = [{ transcript: window.__say }]; r.isFinal = true; this.onresult({ resultIndex: 0, results: [r] }); } }, 120); }
  stop() { setTimeout(() => this.onend && this.onend(), 60); } };
"""
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'])
    ctx = b.new_context(viewport={'width': 1366, 'height': 900}, accept_downloads=True, permissions=['microphone'])
    ctx.add_init_script(INIT)
    ctx.route('**/config.js', lambda r: r.fulfill(body="window.CODI3_CONFIG={stt:''};", content_type='text/javascript'))
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    shot = lambda n: pg.screenshot(path=f'{OUT}/{n}.png')
    D = lambda js: pg.evaluate(js)
    def nxt(): pg.wait_for_selector('#nx', timeout=60000); pg.click('#nx'); pg.wait_for_timeout(220)
    def ptt(ms=800):
        box = pg.query_selector('#ptt').bounding_box(); pg.mouse.move(box['x'] + 40, box['y'] + 20); pg.mouse.down(); pg.wait_for_timeout(ms); pg.mouse.up(); pg.wait_for_timeout(450)
    shot('01_login')
    assert '2021' not in pg.inner_text('body') and 'Rubén Vallejo' in pg.inner_text('body')
    pg.fill('input[name=name]', 'Alumna Prova Exemple'); pg.fill('input[name=email]', 'prova@isvh.cat'); pg.fill('input[name=pass]', 'xx'); pg.click('button[type=submit]'); pg.wait_for_timeout(300)
    assert 'contrasenya' in pg.inner_text('#lerr').lower()
    pg.fill('input[name=pass]', 'tes1aa'); pg.click('button[type=submit]'); pg.wait_for_selector('.phase-grid'); pg.wait_for_timeout(900)
    shot('02_tauler')

    # F1
    pg.click('[data-intro=f1]'); pg.wait_for_selector('#go'); pg.wait_for_timeout(300); shot('03_intro'); pg.click('#go'); pg.wait_for_timeout(500)
    W = {x['l']: x['w'] for x in D('DATA.INTERCO')}
    for k in range(4):
        pg.wait_for_selector('#ans'); pg.wait_for_timeout(700)
        aid = [a for a in D('window.__audio') if a.startswith('l')][-1]
        ans = D(f'DATA.LISTEN.find(x=>x.id==={json.dumps(aid)}).answer')
        if k == 0: shot('04_f1_escolta_text')
        if k == 2:
            shot('05_f1_escolta_veu'); pg.fill('#ans', 'XXX'); pg.click('#ok'); pg.wait_for_timeout(300)
        pg.fill('#ans', ans); pg.click('#ok'); nxt()
    for k in range(4):
        pg.wait_for_selector('.tiles'); word = ''.join(e.inner_text().strip() for e in pg.query_selector_all('.tile .l'))
        if k == 1:   # sense micròfon: fitxes amb paraules falses
            pg.click('#sw'); pg.wait_for_selector('.chip'); shot('08b_f1_fitxes')
            n_decoy = len(pg.query_selector_all('.chip')) - len(set(word))
            assert n_decoy >= len(set(word)) * 2, 'falten fitxes falses'
            for c in word: pg.click(f'.chip[data-w="{W[c]}"]'); pg.wait_for_timeout(30)
            pg.click('#ok'); nxt(); continue
        if pg.query_selector('#sv'): pg.click('#sv')
        if pg.query_selector('#mic'): pg.click('#mic'); pg.wait_for_selector('#lvl')
        if k == 0:
            shot('06_f1_parla'); D("window.__say='alfa bravo'"); ptt(); pg.wait_for_timeout(500); shot('07_f1_repeteix'); pg.wait_for_timeout(2500)
        D(f"window.__say={json.dumps(' '.join(W[c] for c in word).lower().replace('echo', 'eco').replace('mike', 'maik'))}"); ptt()
        if k == 0: shot('08_f1_copiat')
        nxt()
    nxt()

    # F2
    pg.click('#go'); pg.wait_for_timeout(600)
    for k in range(12):
        pg.wait_for_selector('.codecard'); code = pg.inner_text('.codecard .code').strip(); fam = D(f'DATA.byCode[{json.dumps(code)}].fam')
        if k == 0:
            pg.wait_for_timeout(1200); shot('09_f2'); pg.hover(f'.bin[data-f={fam}]'); pg.wait_for_timeout(300); shot('10_f2_hover')
            other = [f for f in D('Object.keys(DATA.FAMILIES)') if f != fam][0]; pg.click(f'.bin[data-f={other}]'); pg.wait_for_timeout(200)
        pg.click(f'.bin[data-f={fam}]'); pg.wait_for_selector('.explain')
        if k == 0: pg.wait_for_timeout(700); shot('11_f2_explica_a'); pg.wait_for_timeout(2200); shot('12_f2_explica_b')
        nxt()
    nxt()

    # F3
    pg.click('#go'); pg.wait_for_timeout(300)
    for k in range(12):
        sid = pg.get_attribute('.scene img', 'src').split('/')[-1].replace('.webp', ''); code = D(f'DATA.SCENES.find(s=>s.id==={json.dumps(sid)}).code')
        pg.wait_for_timeout(200)
        if k == 5:
            wrong = [e.get_attribute('data-c') for e in pg.query_selector_all('.opt') if e.get_attribute('data-c') != code][0]; pg.click(f'.opt[data-c="{wrong}"]'); pg.wait_for_timeout(100)
        pg.click(f'.opt[data-c="{code}"]')
        if k in (0, 9): pg.wait_for_timeout(1300); shot(f'13_f3_revela_{k}')
        nxt()
    nxt()

    # F4
    pg.click('#go'); pg.wait_for_timeout(300)
    for k in range(3):
        title = pg.inner_text('.stage h2'); steps = D(f'DATA.SEQUENCES.find(q=>q.title==={json.dumps(title)}).steps')
        if k == 0: pg.click('#ok'); pg.wait_for_timeout(200); shot('14_f4_parcial')
        for t, c in enumerate(steps):
            while True:
                cur = [e.get_attribute('data-c') for e in pg.query_selector_all('#seq li')].index(c)
                if cur == t: break
                pg.click(f'[data-up="{cur}"]'); pg.wait_for_timeout(30)
        pg.click('#ok'); pg.wait_for_timeout(150)
        if k == 0: shot('15_f4_correcte')
        nxt()
    nxt()

    # F5
    pg.click('#go'); pg.wait_for_timeout(300)
    for k in range(6):
        msg = pg.inner_text('.msg .txt').strip().strip('«»'); ok = D(f'DATA.DECODE.find(d=>d.msg==={json.dumps(msg)}).ok')
        if k == 0: pg.wait_for_timeout(1500); shot('16_f5')
        for e in pg.query_selector_all('.opt'):
            if e.inner_text().strip().endswith(ok): e.click(); break
        nxt()
    nxt()

    # F6 · emissora
    pg.click('#go'); pg.wait_for_timeout(400); n = 0
    def mptt(ms=800):
        box = pg.query_selector('#mx-ptt').bounding_box(); pg.mouse.move(box['x'] + 40, box['y'] + 20); pg.mouse.down(); pg.wait_for_timeout(ms); pg.mouse.up(); pg.wait_for_timeout(500)
    for s_ in range(4):
        pg.wait_for_selector('#mx')
        if s_ == 0:
            shot('17_f6_apagada'); mptt(700); assert 'apagada' in pg.inner_text('#txp')
            pg.click('#mx-pwr'); pg.wait_for_timeout(200)
        tch, tsub = pg.inner_text('#t-ch'), pg.inner_text('#t-sub')
        for _ in range(16):
            if pg.inner_text('#mx-ch') == tch: break
            pg.click('#mx-cu')
        if s_ == 0: shot('17b_f6_sense_enllac')
        for _ in range(39):
            if pg.inner_text('#mx-sub') == tsub: break
            pg.click('#mx-su')
        assert pg.inner_text('#mx-ch') == tch and pg.inner_text('#mx-sub') == tsub
        while True:
            pg.wait_for_selector('.tx-opt, #nx', timeout=60000)
            if pg.query_selector('#nx'): break
            task = pg.inner_text('#txt-task').strip()
            st = D(f'(()=>{{for(const s of DATA.RADIO)for(const t of s.steps)if(t.prompt==={json.dumps(task)})return {{ok:t.ok,manual:!!t.manual}}}})()')
            if n % 2 == 0 and not st['manual']:      # per veu (reconeixement simulat)
                if pg.query_selector('#mic'): pg.click('#mic'); pg.wait_for_timeout(300)
                D(f"window.__say={json.dumps(st['ok'].lower().replace('727', 'set-cents vint-i-set').replace('3.3', 'tres punt tres'))}")
                if n == 0: box = pg.query_selector('#mx-ptt').bounding_box(); pg.mouse.move(box['x'] + 40, box['y'] + 20); pg.mouse.down(); pg.wait_for_timeout(750); shot('18_f6_tx'); pg.mouse.up(); pg.wait_for_timeout(1600); shot('19_f6_rx')
                else: mptt(); pg.wait_for_timeout(1500)
            else:                                      # sense micròfon: clic + PTT
                D("window.__say=''")
                for e in pg.query_selector_all('.tx-opt'):
                    if e.inner_text().strip() == st['ok']: e.click(); break
                mptt(750)
            n += 1
        if s_ == 0: shot('19b_f6_final')
        nxt()
    pg.wait_for_selector('#res'); pg.click('#res'); pg.wait_for_selector('.grade'); pg.wait_for_timeout(1200)
    pg.screenshot(path=f'{OUT}/20_resultats.png', full_page=True)
    with pg.expect_download() as dl: pg.click('#pdf')
    dl.value.save_as(f'{OUT}/informe.pdf')
    state = D('JSON.parse(localStorage.getItem("codi3-tes-v2"))')
    print('TOTAL', sum(p['score'] for p in state['phases'].values()), {k: v['score'] for k, v in state['phases'].items()}, 'errs', state['errs'], state['verify'], [m for m in state['mistakes']], state['slips'])

    m = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True); m.add_init_script(INIT); m.route('**/config.js', lambda r: r.fulfill(body="window.CODI3_CONFIG={stt:''};", content_type='text/javascript'))
    mp = m.new_page(); mp.goto(URL); mp.evaluate('localStorage.clear()'); mp.reload(); mp.screenshot(path=f'{OUT}/21_mobil_login.png')
    st = dict(state); st['phases'] = {'f1': state['phases']['f1']}
    mp.evaluate(f'localStorage.setItem("codi3-tes-v2", {json.dumps(json.dumps(st))})'); mp.reload(); mp.wait_for_selector('.phase-grid'); mp.screenshot(path=f'{OUT}/22_mobil_tauler.png')
    mp.tap('[data-intro=f2]'); mp.wait_for_selector('#go'); mp.tap('#go'); mp.wait_for_selector('.codecard'); mp.wait_for_timeout(1200); mp.screenshot(path=f'{OUT}/23_mobil_f2.png')
    b.close()
print('JS errors:', errors or 'cap')
