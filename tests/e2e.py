"""Partida completa automàtica amb Playwright (Chrome). Ús: python3 tests/e2e.py http://localhost:8765/ shots
Fa un error intencionat a cada fase per comprovar el feedback, desa captures i el PDF."""
import sys, os, re, time, json
from playwright.sync_api import sync_playwright

URL = sys.argv[1]; OUT = sys.argv[2] if len(sys.argv) > 2 else 'shots'; os.makedirs(OUT, exist_ok=True)
NUM = {'zero': '0', 'u': '1', 'un': '1', 'dos': '2', 'tres': '3', 'quatre': '4', 'cinc': '5', 'sis': '6', 'set': '7', 'vuit': '8', 'nou': '9'}
errors = []

with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': 1366, 'height': 900}, accept_downloads=True)
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errors.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    pg.goto(URL); pg.evaluate('localStorage.clear()'); pg.reload()
    shot = lambda n: pg.screenshot(path=f'{OUT}/{n}.png')
    D = lambda js: pg.evaluate(js)
    shot('01_login')
    pg.fill('input[name=name]', 'Prova'); pg.fill('input[name=email]', 'prova@isvh.cat'); pg.fill('input[name=pass]', 'xx'); pg.click('button[type=submit]'); pg.wait_for_timeout(300)
    assert 'Escriu el teu nom' in pg.inner_text('#lerr')
    pg.fill('input[name=name]', 'Alumna Prova Exemple'); pg.click('button[type=submit]'); pg.wait_for_timeout(300)
    assert 'contrasenya' in pg.inner_text('#lerr').lower()
    pg.fill('input[name=pass]', 'tes1aa'); pg.click('button[type=submit]'); pg.wait_for_selector('.route')
    shot('02_tauler')

    def start(pid):
        pg.click(f'[data-intro={pid}]'); pg.wait_for_selector('#go')
        if pid == 'f3': shot('03_intro_f3')
        pg.click('#go'); pg.wait_for_timeout(250)
    def nxt():
        pg.wait_for_selector('#nx'); pg.click('#nx'); pg.wait_for_timeout(200)

    # F1
    start('f1'); first = True
    IC = {x['w']: x['l'] for x in D('DATA.INTERCO')}; W = {x['l']: x['w'] for x in D('DATA.INTERCO')}
    for _ in range(6):
        if pg.query_selector('.big-word'):
            word = pg.inner_text('.big-word').strip()
            import unicodedata
            word = ''.join(c for c in unicodedata.normalize('NFD', word) if unicodedata.category(c) != 'Mn' or c == '̃')
            word = unicodedata.normalize('NFC', word)
            need = [W[c] for c in word if c in W]
            if first: shot('04_f1_lletreja')
            for w in need: pg.click(f'[data-w="{w}"]'); pg.wait_for_timeout(40)
            pg.click('#ok')
        else:
            pg.click('#hp'); say = pg.inner_text('#tr')
            ans = ''.join(IC.get(t, NUM.get(t.lower(), '')) for t in re.findall(r"[\wÀ-ÿ\-]+", say))
            if first: pg.fill('#ans', 'XXXX'); pg.click('#ok'); pg.wait_for_timeout(150)
            pg.fill('#ans', ans); pg.click('#ok')
            if first: shot('05_f1_escolta'); first = False
        nxt()
    pg.wait_for_selector('#nx'); shot('06_fi_fase'); nxt()

    # F2
    pg.click('#go'); pg.wait_for_timeout(200); k = 0
    for _ in range(12):
        code = pg.inner_text('.code-card .code').strip()
        fam = D(f'DATA.byCode[{json.dumps(code)}].fam')
        if k == 0:
            other = [f for f in D('Object.keys(DATA.FAMILIES)') if f != fam][0]
            pg.click(f'.bin[data-f={other}]'); pg.wait_for_timeout(100); shot('07_f2_error')
        pg.click(f'.bin[data-f={fam}]'); k += 1; nxt()
    nxt()

    # F3
    pg.click('#go'); pg.wait_for_timeout(200)
    for k in range(12):
        sid = pg.get_attribute('.scene img', 'src').split('/')[-1].replace('.webp', '')
        code = D(f'DATA.SCENES.find(s=>s.id==={json.dumps(sid)}).code')
        pg.wait_for_timeout(250)
        if k == 0: shot('08_f3_escena_n1')
        if k == 9: shot('09_f3_escena_n3')
        if k == 5:
            wrong = [e.get_attribute('data-c') for e in pg.query_selector_all('.opt') if e.get_attribute('data-c') != code][0]
            pg.click(f'.opt[data-c="{wrong}"]'); pg.wait_for_timeout(100)
        pg.click(f'.opt[data-c="{code}"]')
        if k == 5: shot('10_f3_feedback')
        nxt()
    nxt()

    # F4
    pg.click('#go'); pg.wait_for_timeout(200)
    for k in range(3):
        title = pg.inner_text('.stage h2')
        steps = D(f'DATA.SEQUENCES.find(q=>q.title==={json.dumps(title)}).steps')
        if k == 0: shot('11_f4_inici'); pg.click('#ok'); pg.wait_for_timeout(150); shot('12_f4_parcial')
        for t, c in enumerate(steps):
            while True:
                cur = [e.get_attribute('data-c') for e in pg.query_selector_all('#seq li')].index(c)
                if cur == t: break
                pg.click(f'[data-up="{cur}"]'); pg.wait_for_timeout(30)
        pg.click('#ok'); pg.wait_for_timeout(100)
        nxt()
    nxt()

    # F5
    pg.click('#go'); pg.wait_for_timeout(200)
    for k in range(6):
        msg = pg.inner_text('.msg .txt').strip().strip('«»')
        ok = D(f'DATA.DECODE.find(d=>d.msg==={json.dumps(msg)}).ok')
        if k == 0: pg.click('#pl'); pg.wait_for_timeout(600); shot('13_f5')
        for e in pg.query_selector_all('.opt'):
            if e.inner_text().strip().endswith(ok): e.click(); break
        nxt()
    nxt()

    # F6
    pg.click('#go'); pg.wait_for_timeout(300); shots = 0; stepped = False
    for _ in range(4):
        while True:
            pg.wait_for_selector('.tx-opt, #nx', timeout=60000)
            if pg.query_selector('#nx'): break
            if not stepped and pg.query_selector('.led.rx.on'):
                pass
            task = pg.inner_text('#txt-task').strip()
            ok = D(f'(()=>{{for(const s of DATA.RADIO)for(const t of s.steps)if(t.prompt==={json.dumps(task)})return t.ok}})()')
            for e in pg.query_selector_all('.tx-opt'):
                if e.inner_text().strip() == ok: e.click(); break
            if shots == 0: shot('14_f6_radio'); shots = 1
            box = pg.query_selector('#ptt').bounding_box()
            pg.mouse.move(box['x'] + 50, box['y'] + 30); pg.mouse.down(); pg.wait_for_timeout(750)
            if shots == 1: shot('15_f6_ptt'); shots = 2
            pg.mouse.up(); pg.wait_for_timeout(400)
        if shots == 2: shot('16_f6_log'); shots = 3
        nxt()
    pg.wait_for_selector('#res'); pg.click('#res'); pg.wait_for_selector('.grade'); pg.wait_for_timeout(300)
    shot('17_resultats'); pg.screenshot(path=f'{OUT}/18_resultats_full.png', full_page=True)
    with pg.expect_download() as dl: pg.click('#pdf')
    dl.value.save_as(f'{OUT}/informe.pdf')
    state = D('JSON.parse(localStorage.getItem("codi3-tes-v1"))')
    print('TOTAL', sum(p['score'] for p in state['phases'].values()), {k: v['score'] for k, v in state['phases'].items()}, 'errors', len(state['mistakes']), state['verify'], 'slips', state.get('slips'), 'errs', state.get('errs'))

    # mòbil
    m = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    mp = m.new_page(); mp.goto(URL); mp.evaluate(f'localStorage.setItem("codi3-tes-v1", {json.dumps(json.dumps(state))})'); mp.reload()
    mp.wait_for_selector('.route'); mp.screenshot(path=f'{OUT}/20_mobil_tauler.png', full_page=True)
    mp.goto(URL); mp.evaluate('localStorage.clear()'); mp.reload(); mp.screenshot(path=f'{OUT}/19_mobil_login.png')
    b.close()
print('JS errors:', errors or 'cap')
