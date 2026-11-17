"""Espai del professorat contra el Worker local (tests/worker_local.mjs a :8766) i ús de la clau per l'alumnat.
Ús: python3 tests/teacher.py http://localhost:8765/ /tmp/sem.wav <clau-openrouter>"""
import sys, json, re
from playwright.sync_api import sync_playwright
URL, WAV, KEY = sys.argv[1:4]
CFG = "window.CODI3_CONFIG={stt:'http://localhost:8766'};"
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--autoplay-policy=no-user-gesture-required', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', f'--use-file-for-fake-audio-capture={WAV}'])
    c = b.new_context(viewport={'width': 1366, 'height': 900}, permissions=['microphone', 'clipboard-read', 'clipboard-write']); errs = []
    c.route('**/config.js', lambda r: r.fulfill(body=CFG, content_type='text/javascript'))
    c.add_init_script("window.__opened=[]; window.open=(u)=>{window.__opened.push(u); return {}};")
    pg = c.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.evaluate('localStorage.clear(); sessionStorage.clear()'); pg.reload()
    pg.click('#b-prof'); pg.fill('#tf input', 'malament'); pg.click('#tf button[type=submit]'); pg.wait_for_timeout(200)
    assert 'no és correcta' in pg.inner_text('#terr')
    pg.fill('#tf input', 'tes1aa'); pg.click('#tf button[type=submit]'); pg.wait_for_selector('#t-guia'); pg.wait_for_timeout(1500)
    print('servei per defecte:', pg.inner_text('#st-def').replace('\n', ' | '))
    pg.screenshot(path='/tmp/t1.png', full_page=True)
    assert 'sigma2005' not in pg.content(), 'adreça visible al codi!'
    pg.click('#k-check'); pg.wait_for_selector('#k-res .feedback', timeout=40000); print('comprova (defecte):', pg.inner_text('#k-res'))
    pg.fill('#k-key', 'sk-or-v1-clau-falsa-0000000000000000'); pg.click('#k-check'); pg.wait_for_selector('#k-res .feedback.ko', timeout=40000); print('comprova (falsa):', pg.inner_text('#k-res'))
    assert pg.is_disabled('#k-save')
    pg.fill('#k-key', KEY); pg.click('#k-check'); pg.wait_for_selector('#k-res .feedback.ok', timeout=40000); print('comprova (bona):', pg.inner_text('#k-res'))
    assert not pg.is_disabled('#k-save')
    pg.click('#k-save'); pg.wait_for_timeout(500); print('desa sense PIN:', pg.inner_text('#k-res'))
    pg.fill('#k-pin', '4321'); pg.fill('#k-code', 'tes2b'); pg.click('#k-save'); pg.wait_for_selector('#cp-link', timeout=20000)
    print('desa:', pg.inner_text('#k-res')); print('classe:', pg.inner_text('#st-cls').replace('\n', ' | '))
    link = pg.input_value('.share input'); print('enllaç:', link)
    pg.screenshot(path='/tmp/t2.png', full_page=True)
    pg.click('#k-save') if not pg.is_disabled('#k-save') else None
    # verificació
    code = pg.evaluate("(async()=>{const h=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('alu@altre.cat|873|codi3-tes')))].map(x=>x.toString(16).padStart(2,'0')).join('');return ('C3-'+h.slice(0,4)+'-'+h.slice(4,8)).toUpperCase()})()")
    pg.fill('#vf [name=email]', 'alu@altre.cat'); pg.fill('#vf [name=pts]', '873'); pg.fill('#vf [name=code]', code); pg.click('#vf button'); pg.wait_for_timeout(300); print('verifica bo:', pg.inner_text('#v-res'))
    pg.fill('#vf [name=pts]', '874'); pg.click('#vf button'); pg.wait_for_timeout(300); print('verifica dolent:', pg.inner_text('#v-res'))
    # suport
    pg.fill('#sf [name=name]', 'Prof Prova'); pg.fill('#sf [name=email]', 'prof@centre.cat'); pg.fill('#sf [name=msg]', 'Hola, una prova.')
    pg.click('#sf button[value=gmail]'); pg.wait_for_timeout(300); opened = pg.evaluate('window.__opened'); print('suport gmail:', opened[-1][:120] if opened else 'cap')
    assert opened and 'sigma2005%40gmail.com' in opened[-1]
    pg.screenshot(path='/tmp/t3.png', full_page=True)
    # alumne amb l'enllaç de classe i qualsevol correu, veu real
    s2 = b.new_context(viewport={'width': 1366, 'height': 900}, permissions=['microphone']); s2.route('**/config.js', lambda r: r.fulfill(body=CFG, content_type='text/javascript'))
    st = s2.new_page(); st.on('pageerror', lambda e: errs.append(str(e)))
    st.goto(link.replace('https://rvs78.github.io/teleemergencies01/', URL)); st.wait_for_selector('#lf')
    print('codi a l’accés:', st.input_value('[name=classe]'), '| url:', st.url)
    st.fill('[name=name]', 'Alumne Altre'); st.fill('[name=email]', 'alu@altre.cat'); st.fill('[name=pass]', 'tes1aa'); st.click('#lf button[type=submit]'); st.wait_for_selector('.phase-grid')
    st.evaluate("DATA.SPELL=[{word:'SEM',ctx:'prova'}]; DATA.LISTEN=DATA.LISTEN.slice(0,1)")
    st.click('[data-intro=f1]'); st.click('#go'); st.wait_for_selector('#ans'); st.wait_for_timeout(500)
    aid = st.evaluate("performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/audio\\/l/.test(n)).pop()").split('/')[-1][:-4]
    st.fill('#ans', st.evaluate(f'DATA.LISTEN.find(x=>x.id==={json.dumps(aid)}).answer')); st.click('#ok'); st.click('#nx')
    st.wait_for_selector('#mic'); st.click('#mic'); st.wait_for_selector('#lvl'); st.wait_for_timeout(500)
    box = st.query_selector('#ptt').bounding_box(); st.mouse.move(box['x'] + 40, box['y'] + 20); st.mouse.down(); st.wait_for_timeout(9000); st.mouse.up()
    st.wait_for_selector('.feedback', timeout=30000); print('alumne amb clau de classe:', st.inner_text('.feedback'))
    print('errors JS:', errs or 'cap'); b.close()
