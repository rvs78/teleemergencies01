/* Codi 3 · Parla com el SEM — lògica de l'activitat (sense dependències; jsPDF per a l'informe)
   Disseny i continguts: Rubén Vallejo */
(function () {
  'use strict';
  const D = window.DATA;
  const STORE = 'codi3-tes-v2';
  /* Contrasenya d'aula: SHA-256 de «tes1aa». Per canviar-la: echo -n NOVA | sha256sum */
  const PASS_HASH = '6000d76c8885915b57c97b9841752193b454bfcbc15612210afbb435abed16aa';
  const CLASSROOM = 'https://classroom.google.com/';
  const PHASES = [
    { id: 'f1', n: 1, icon: 'spell', title: 'Alfabet INTERCO', bloom: 'Recordar', art: 'assets/img/s3-3.webp',
      goal: 'Entendre i lletrejar per ràdio amb l’alfabet internacional.',
      todo: ['Escolta: CECOS lletreja una paraula i tu l’escrius. Primer amb text, després només amb la veu.', 'Parla: surt una paraula de la professió i la lletreges per veu en INTERCO.', 'Si CECOS no et copia, repeteix.'],
      ctl: [['PARLA', 'mantén premut el botó vermell (o la barra espaiadora) mentre parles'], ['CECOS', 'botó verd: torna a escoltar el missatge'], ['Micròfon', 'el navegador et demanarà permís; sense micròfon ho faràs amb fitxes']] },
    { id: 'f2', n: 2, icon: 'grid', title: 'Famílies de codis', bloom: 'Comprendre', art: 'assets/img/f2/c3-3.webp',
      goal: 'Entendre per a què serveix cada codi i agrupar-lo en la seva família.',
      todo: ['Per la ràdio sentiràs una frase real amb un codi.', 'Mira la imatge i tria la família on va.', 'Després veuràs l’explicació amb un exemple i dos codis relacionats.'],
      ctl: [['Clic / toc', 'tria la família'], ['1–6', 'dreceres de teclat']] },
    { id: 'f3', n: 3, icon: 'image', title: 'Escenes il·lustrades', bloom: 'Aplicar', art: 'assets/img/s3-23.webp',
      goal: 'Reconèixer la situació real i triar el codi que comunicaries a CECOS.',
      todo: ['12 escenes en tres nivells.', 'Nivell 1: amb pista de la família.', 'Nivell 2: sense pista.', 'Nivell 3: només el codi i 20 segons per escena.'],
      ctl: [['Clic / toc', 'tria una opció'], ['1–4', 'dreceres de teclat']] },
    { id: 'f4', n: 4, icon: 'route', title: 'La línia del servei', bloom: 'Analitzar', art: 'assets/img/s3-35.webp',
      goal: 'Ordenar els codis tal com es comuniquen durant un servei, de l’inici al final.',
      todo: ['3 serveis complets.', 'Arrossega les targetes o fes servir les fletxes.', 'Tens dos intents per servei.'],
      ctl: [['Arrossegar', 'mou la targeta amb el dit o el ratolí'], ['Fletxes', 'mou la targeta una posició']] },
    { id: 'f5', n: 5, icon: 'ear', title: 'Descodifica', bloom: 'Interpretar', art: 'assets/img/hero.webp',
      goal: 'Traduir un missatge de ràdio en codi a llenguatge planer.',
      todo: ['6 missatges dels guions de classe.', 'Escolta el missatge i tria què vol dir.'],
      ctl: [['CECOS', 'botó verd: torna a escoltar el missatge'], ['1–3', 'dreceres de teclat']] },
    { id: 'f6', n: 6, icon: 'radio', title: 'Simulador de ràdio', bloom: 'Transferir', art: 'assets/img/cabina.webp',
      goal: 'Mantenir una comunicació completa amb CECOS seguint el protocol i els codis.',
      todo: ['4 situacions: inici de guàrdia, assignació de servei, trasllat i final del servei.', 'Tria què dius i mantén premut PARLA mentre transmets.', 'Si prems PARLA mentre parla CECOS, trepitges la comunicació (3.13).'],
      ctl: [['PARLA', 'mantén premut el botó vermell (o la barra espaiadora) i deixa’l anar per enviar'], ['Clic / toc', 'tria el missatge abans de prémer PARLA']] },
  ];

  /* ---------- utilitats ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const app = $('#app');
  const ic = n => `<svg aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const legend = c => (D.byCode[c] || {}).text || '';
  const isPrio = c => (D.byCode[c] || {}).prio;
  const cid = c => 'c' + c.toLowerCase().replace(/[^0-9a-z]+/g, '-').replace(/^-|-$/g, '');
  const fmt = n => (Math.round(n * 10) / 10).toLocaleString('ca-ES');
  const toast = msg => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200); };
  async function sha256(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  const IC = Object.fromEntries(D.INTERCO.map(x => [x.l, x]));

  /* ---------- estat ---------- */
  let S = load();
  function load() { try { return JSON.parse(localStorage.getItem(STORE)) || null; } catch { return null; } }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch { } }
  const fresh = (email, name) => ({ v: 2, email, name, started: Date.now(), phases: {}, mistakes: [], slips: [], errs: 0, helps: 0 });
  const total = () => Object.values(S.phases).reduce((a, p) => a + (p.score || 0), 0);
  const doneCount = () => PHASES.filter(p => S.phases[p.id] && S.phases[p.id].done).length;
  const nextPhase = () => PHASES.find(p => !(S.phases[p.id] && S.phases[p.id].done));
  const grade = () => Math.max(1, Math.round(total() / 100 * 10) / 10);
  const itemScore = (value, errors, helps) => Math.max(0, value * (1 - 0.5 * errors - 0.3 * helps));
  function slip(text) { S.errs = (S.errs || 0) + 1; (String(text || '').match(/3\.\d+(?: [A-Z]{1,2}(?:\/PL)?)?/g) || []).forEach(c => { if (D.byCode[c]) S.slips.push(c); }); }
  function mistake(phase, expected, given, note) { S.mistakes.push({ phase, expected, given, note: note || '' }); }

  /* ========== RADIOCOMUNICADOR (àudio + panell inferior) ========== */
  const Radio = (() => {
    const dock = $('#dock'), cv = $('#wave'), g2 = cv.getContext('2d'), cap = $('#dock-cap'), stt = $('#dock-status');
    const lampRx = $('#lamp-rx'), ptt = $('#ptt');
    let ac = null, master, an, micAn = null, micStream = null, cur = null, vol = 0.9, state = 'idle', last = null, raf = 0, handlers = null, txAt = 0, down = false;
    const bufs = {};
    function ctx() {
      if (!ac) {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = vol; an = ac.createAnalyser(); an.fftSize = 1024; an.smoothingTimeConstant = .6;
        master.connect(an); an.connect(ac.destination);
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    }
    async function getBuf(id) {
      if (bufs[id]) return bufs[id];
      const r = await fetch(`assets/audio/${id}.mp3`); if (!r.ok) throw new Error('audio');
      return (bufs[id] = await ctx().decodeAudioData(await r.arrayBuffer()));
    }
    function beep(t, f = 1750, d = .12, g = .06) { const a = ctx(), o = a.createOscillator(), v = a.createGain(); o.frequency.value = f; v.gain.value = g; o.connect(v).connect(master); o.start(t); o.stop(t + d); }
    function noise(t, d, g = .03, f = 1800) {
      const a = ctx(), b = a.createBuffer(1, Math.ceil(a.sampleRate * d), a.sampleRate), ch = b.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      const s = a.createBufferSource(), bp = a.createBiquadFilter(), v = a.createGain(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = .6; v.gain.value = g;
      s.buffer = b; s.connect(bp).connect(v).connect(master); s.start(t); return s;
    }
    /* so de sintonia: soroll de freqüències + xiulet, per al botó «Continua» */
    function squelch() {
      try {
        const a = ctx(), t = a.currentTime;
        noise(t, .22, .07, 2400); noise(t + .05, .16, .05, 900);
        const o = a.createOscillator(), v = a.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(900, t); o.frequency.exponentialRampToValueAtTime(2200, t + .18);
        v.gain.setValueAtTime(.035, t); v.gain.exponentialRampToValueAtTime(.001, t + .2); o.connect(v).connect(master); o.start(t); o.stop(t + .22);
        beep(t + .24, 1500, .05, .04);
      } catch { }
    }
    function setState(s, label) {
      state = s; dock.classList.toggle('rx', s === 'rx'); dock.classList.toggle('tx', s === 'tx');
      lampRx.classList.toggle('on', s === 'rx'); ptt.classList.toggle('on', s === 'tx');
      stt.textContent = label || (s === 'rx' ? '◀ RX · CECOS' : s === 'tx' ? '▶ TX · UNITAT' : 'EN ESCOLTA');
    }
    function stop() { if (cur) { try { cur.src.onended = null; cur.src.stop(); cur.nz.stop(); } catch { } cur.res && cur.res(false); cur = null; } if (state === 'rx') setState('idle'); }
    /* reprodueix un clip de CECOS amb efecte de ràdio. opts: caption (text al panell), onProgress(0..1), remember */
    async function play(id, opts = {}) {
      stop(); const a = ctx(); let buf;
      if (opts.remember !== false) last = { id, opts };
      lampRx.disabled = !last;
      try { buf = await getBuf(id); } catch { toast('No s’ha pogut carregar l’àudio. Llegeix el text.'); cap.textContent = opts.caption || ''; return false; }
      const t0 = a.currentTime + .05; beep(t0, 1750, .1);
      const src = a.createBufferSource(); src.buffer = buf;
      const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 320;
      const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3300;
      const comp = a.createDynamicsCompressor(); comp.threshold.value = -24; comp.ratio.value = 8;
      const sh = a.createWaveShaper(), k = 2.2, n = 1024, curve = new Float32Array(n);
      for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; curve[i] = (1 + k) * x / (1 + k * Math.abs(x)); } sh.curve = curve;
      const g = a.createGain(); g.gain.value = .9;
      src.connect(hp).connect(lp).connect(comp).connect(sh).connect(g).connect(master);
      const start = t0 + .14, nz = noise(t0 + .1, buf.duration + .25, .016);
      src.start(start); noise(start + buf.duration, .18, .06); beep(start + buf.duration + .02, 1200, .06, .03);
      setState('rx'); cap.textContent = opts.caption || '';
      return new Promise(res => {
        const me = { src, nz, res }; cur = me;
        const tick = () => { if (cur !== me) return; opts.onProgress && opts.onProgress(Math.min(1, Math.max(0, (a.currentTime - start) / buf.duration))); requestAnimationFrame(tick); };
        tick();
        src.onended = () => { if (cur === me) { cur = null; setState('idle'); opts.onProgress && opts.onProgress(1); } res(true); };
      });
    }
    async function mic() {
      if (micAn || !navigator.mediaDevices) return;
      try { micStream = await navigator.mediaDevices.getUserMedia({ audio: true }); const a = ctx(); micAn = a.createAnalyser(); micAn.fftSize = 1024; a.createMediaStreamSource(micStream).connect(micAn); } catch { }
    }
    /* PTT */
    function pttDown(e) {
      e && e.preventDefault(); if (down || !handlers || ptt.disabled) return;
      if (state === 'rx') { handlers.stepped && handlers.stepped(); return; }
      down = true; txAt = performance.now(); setState('tx'); try { beep(ctx().currentTime, 900, .05, .03); } catch { }
      handlers.down && handlers.down();
    }
    function pttUp() {
      if (!down) return; down = false; const held = performance.now() - txAt; setState('idle'); try { noise(ctx().currentTime, .12, .03); } catch { }
      handlers && handlers.up && handlers.up(held);
    }
    ptt.addEventListener('pointerdown', pttDown); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => ptt.addEventListener(ev, pttUp));
    ptt.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => { if (e.code === 'Space' && !e.repeat && handlers && !/INPUT|TEXTAREA/.test(e.target.tagName) && !$('#ref').open) { e.preventDefault(); pttDown(); } });
    document.addEventListener('keyup', e => { if (e.code === 'Space' && down) { e.preventDefault(); pttUp(); } });
    lampRx.addEventListener('click', () => { if (last && state !== 'tx') play(last.id, last.opts); });
    $('#vol').addEventListener('input', e => { vol = +e.target.value; if (master) master.gain.value = vol; });
    /* forma d'ona */
    const data = new Uint8Array(1024);
    function draw() {
      raf = requestAnimationFrame(draw);
      const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
      if (cv.width !== w * dpr) { cv.width = w * dpr; cv.height = h * dpr; }
      g2.setTransform(dpr, 0, 0, dpr, 0, 0); g2.clearRect(0, 0, w, h);
      g2.strokeStyle = 'rgba(159,170,198,.18)'; g2.lineWidth = 1; g2.beginPath(); for (let x = 0; x < w; x += 24) { g2.moveTo(x, 0); g2.lineTo(x, h); } g2.moveTo(0, h / 2); g2.lineTo(w, h / 2); g2.stroke();
      const src = state === 'tx' ? micAn : an; let live = false;
      if (src) { src.getByteTimeDomainData(data); live = true; }
      const col = state === 'rx' ? '#3DDC97' : state === 'tx' ? '#FF5D5D' : '#5C6C9C', t = performance.now() / 1000;
      g2.strokeStyle = col; g2.lineWidth = 2; g2.beginPath();
      const N = 180, gain = state === 'tx' ? 2.6 : 1.5;
      for (let i = 0; i <= N; i++) {
        let v;
        if (live && (state !== 'tx' || micAn)) v = (data[Math.floor(i / N * 1023)] - 128) / 128 * gain;
        else v = state === 'tx' ? Math.sin(i * .5 + t * 18) * Math.sin(i * .07 + t * 3) * .5 : 0;
        if (state === 'idle') v = v * .6 + (Math.random() - .5) * .04;
        const y = h / 2 + Math.max(-1, Math.min(1, v)) * (h / 2 - 5), x = i / N * w;
        i ? g2.lineTo(x, y) : g2.moveTo(x, y);
      }
      g2.stroke();
    }
    function show(on) {
      dock.hidden = !on; cancelAnimationFrame(raf);
      if (on) { draw(); requestAnimationFrame(() => document.documentElement.style.setProperty('--dock-h', dock.offsetHeight + 'px')); }
      else { document.documentElement.style.setProperty('--dock-h', '0px'); stop(); last = null; cap.textContent = ''; setPtt(null); }
      lampRx.disabled = !last;
    }
    function setPtt(h) { handlers = h; ptt.disabled = !h; ptt.classList.toggle('ready', !!h); if (!h && down) { down = false; setState('idle'); } }
    window.addEventListener('resize', () => { if (!dock.hidden) document.documentElement.style.setProperty('--dock-h', dock.offsetHeight + 'px'); });
    return { play, stop, show, setPtt, squelch, mic, setState, caption: t => { cap.textContent = t || ''; }, forget: () => { last = null; lampRx.disabled = true; cap.textContent = ''; }, get busy() { return state === 'rx'; } };
  })();

  /* ---------- reconeixement de veu (Web Speech API, català) ---------- */
  const SRC = window.SpeechRecognition || window.webkitSpeechRecognition;
  const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  function lev(a, b) { const m = a.length, n = b.length, d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
  function matchSpell(text, letters) {
    const tk = norm(text).split(' ').filter(Boolean), hit = letters.map(() => false); let i = 0;
    for (let j = 0; j < letters.length; j++) {
      const cands = (D.HEAR[letters[j]] || []).map(c => norm(c).replace(/ /g, '')); let found = -1, span = 1;
      for (let k = i; k < tk.length && found < 0; k++) for (const sp of [2, 1]) {
        if (k + sp > tk.length) continue; const t = tk.slice(k, k + sp).join('');
        if (cands.some(c => c === t || (t.length > 2 && lev(c, t) <= (c.length > 5 ? 2 : 1)))) { found = k; span = sp; break; }
      }
      if (found >= 0) { hit[j] = true; i = found + span; }
    }
    return { ok: hit.every(Boolean), hit, n: tk.length, score: hit.filter(Boolean).length };
  }
  function listenOnce() {
    /* retorna { stop():Promise<{alts:[text], error}> } */
    const rec = new SRC(); rec.lang = 'ca-ES'; rec.continuous = true; rec.interimResults = true; rec.maxAlternatives = 3;
    const finals = [[], [], []]; let interim = '', error = null, ended = false, resolve;
    rec.onresult = e => { interim = ''; for (let r = e.resultIndex; r < e.results.length; r++) { const R = e.results[r];
      if (R.isFinal) for (let a = 0; a < 3; a++) finals[a].push((R[a] || R[0]).transcript); else interim += R[0].transcript + ' '; }
      Radio.caption('TX · ' + (finals[0].join(' ') + ' ' + interim).trim()); };
    rec.onerror = e => { error = e.error; };
    rec.onend = () => { ended = true; resolve && resolve(out()); };
    const out = () => ({ alts: finals.map(f => (f.join(' ') + ' ' + interim).trim()).filter((t, i, a) => t && a.indexOf(t) === i), error });
    try { rec.start(); } catch (e) { error = 'start'; ended = true; }
    return { stop: () => new Promise(res => { if (ended) return res(out()); resolve = res; try { rec.stop(); } catch { res(out()); } setTimeout(() => res(out()), 2500); }) };
  }

  /* ---------- capçalera ---------- */
  function header(active) {
    $('#top').hidden = !S;
    if (!S) return;
    $('#steps').innerHTML = PHASES.map(p => { const st = S.phases[p.id] || {}; const cls = active === p.id ? 'on' : st.done ? 'done' : '';
      return `<li class="${cls}" title="${esc(p.title)}">${st.done ? ic('check') : ''}F${p.n}</li>`; }).join('');
    $('#score').innerHTML = `${Math.round(total())}<small>/ 1000</small>`;
  }

  /* ---------- navegació ---------- */
  let timerId = null, keys = null;
  document.addEventListener('keydown', e => { if (!$('#ref').open && keys && !/INPUT|TEXTAREA/.test(e.target.tagName)) keys(e); });
  function go(screen, arg) {
    Radio.stop(); clearInterval(timerId); keys = null; Radio.setPtt(null);
    window.scrollTo({ top: 0 });
    if (!S && screen !== 'login') screen = 'login';
    Radio.show(screen === 'phase');
    ({ login, dash, intro, phase: runPhase, results }[screen] || dash)(arg);
    app.focus({ preventScroll: true });
  }

  /* ========== LOGIN ========== */
  function login() {
    header();
    app.innerHTML = `
      <section class="panel login">
        <div class="login-art" style="background-image:url(assets/img/hero.webp)">
          <div class="cap"><h1>Codi 3 · Parla com el SEM</h1>
          <p>Aprèn els codis de transmissió del SEM i l’alfabet INTERCO, i parla amb CECOS com ho faràs a l’ambulància.</p>
          <div class="feat"><span>6 fases</span><span>Veu i ràdio</span><span>Escenes il·lustrades</span><span>Informe PDF</span></div></div>
        </div>
        <form class="login-form" id="lf" novalidate>
          <div><span class="chip-tag">MP0060 Teleemergències · TES 1AA</span><h2 style="margin-top:.6rem">Inici de guàrdia</h2></div>
          <label class="field">Nom i cognoms<input name="name" autocomplete="name" required></label>
          <label class="field">Correu de l’institut<input name="email" type="email" autocomplete="email" inputmode="email" placeholder="nom@isvh.cat" required></label>
          <label class="field">Contrasenya de l’aula<input name="pass" type="password" autocomplete="current-password" required><span class="help">Te la dona el professorat a classe.</span></label>
          <p class="err" id="lerr" role="alert"></p>
          <button class="btn" type="submit">${ic('radio')} Comença la guàrdia</button>
          <p class="meta-line">El progrés es desa en aquest navegador. Codis: «CODI 3 MODIFICAT» del SEM.<br>Aplicació dissenyada per <b>Rubén Vallejo</b>.</p>
        </form>
      </section>`;
    $('#lf').addEventListener('submit', async e => {
      e.preventDefault();
      const f = new FormData(e.target), name = f.get('name').trim(), email = f.get('email').trim().toLowerCase();
      const err = m => { $('#lerr').textContent = m; };
      if (name.split(/\s+/).length < 2) return err('Escriu el teu nom i almenys un cognom.');
      if (!/^[^\s@]+@isvh\.cat$/.test(email)) return err('Escriu el teu correu acabat en @isvh.cat.');
      if (await sha256(f.get('pass').trim().toLowerCase()) !== PASS_HASH) return err('La contrasenya no és correcta. Demana-la al professorat.');
      const prev = load();
      S = (prev && prev.email === email) ? prev : fresh(email, name);
      S.name = name; save(); go('dash');
    });
  }

  /* ========== TAULER ========== */
  function dash() {
    header();
    const nx = nextPhase(), done = doneCount(), C = 2 * Math.PI * 54;
    const initials = S.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    app.innerHTML = `
      <section class="dash-hero">
        <div><div class="who"><span class="avatar">${esc(initials)}</span><span><b style="color:#fff">${esc(S.name)}</b><br>${esc(S.email)}</span></div>
          <h1>${done === 6 ? 'Guàrdia completada' : done ? 'Continua la guàrdia' : 'Bon dia i bona guàrdia'}</h1>
          <p>Sis fases, de recordar els codis a fer-los servir per ràdio. Cada fase s’obre quan acabes l’anterior.</p></div>
        <div class="ring" role="img" aria-label="${done} de 6 fases completades"><svg viewBox="0 0 120 120"><circle class="trk" cx="60" cy="60" r="54"/><circle class="val" cx="60" cy="60" r="54" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - done / 6)}"/></svg><div><b>${done}/6</b><small>fases</small></div></div>
      </section>
      <dl class="stats" aria-label="Panell de l'alumne">
        <div class="stat"><dt>Punts</dt><dd>${Math.round(total())}<span class="muted" style="font-size:.6em"> /1000</span></dd></div>
        <div class="stat"><dt>Nota provisional</dt><dd>${done ? fmt(grade()) : '—'}</dd></div>
        <div class="stat"><dt>Respostes errònies</dt><dd>${S.errs || 0}</dd></div>
        <div class="stat"><dt>Ajudes</dt><dd>${S.helps}</dd></div>
      </dl>
      <div class="sec-head"><h2>El teu recorregut</h2></div>
      <ol class="phase-grid">
        ${PHASES.map(p => { const st = S.phases[p.id] || {}; const isNext = nx && nx.id === p.id; const cls = st.done ? 'done' : isNext ? 'next' : 'locked';
          return `<li class="pcard ${cls}">
            <div class="art" style="background-image:url(${p.art})"><span class="num">Fase ${p.n}</span><span class="state">${st.done ? ic('check') : isNext ? ic('play') : ic('lock')}</span></div>
            <div class="body"><span class="chip-tag sun" style="align-self:flex-start">${p.bloom}</span><h3>${esc(p.title)}</h3><p class="d">${esc(p.goal)}</p>
              <div class="foot"><span class="pts">${st.done ? `${Math.round(st.score)} / ${D.POINTS[p.id]}` : `${D.POINTS[p.id]} punts`}</span>
              ${isNext ? `<button class="btn small" data-intro="${p.id}">Comença ${ic('arrow')}</button>` : ''}</div></div></li>`; }).join('')}
      </ol>
      <div class="dash-actions">
        ${done === 6 ? `<button class="btn" id="b-res">${ic('file')} Resultats i informe</button>` : ''}
        <button class="btn ghost small" id="b-ref2">${ic('book')} Consulta els codis</button>
        <button class="btn ghost small" id="b-out">${ic('exit')} Surt</button>
      </div>`;
    $$('[data-intro]').forEach(b => b.onclick = () => go('intro', b.dataset.intro));
    $('#b-res') && ($('#b-res').onclick = () => go('results'));
    $('#b-ref2').onclick = openRef;
    $('#b-out').onclick = () => { S = null; header(); go('login'); };
  }

  /* ========== INTRO DE FASE ========== */
  function intro(pid) {
    const p = PHASES.find(x => x.id === pid); header(pid);
    app.innerHTML = `
      <section class="panel intro">
        <div class="intro-art"><video class="capsule" src="assets/video/capsula-${p.id}.mp4" poster="${p.art}" controls playsinline preload="metadata" aria-label="Vídeo d’instruccions de la fase ${p.n}, narrat. El mateix contingut és al text del costat."></video></div>
        <div class="intro-body">
          <div class="row"><span class="phase-tag">${ic(p.icon)} Fase ${p.n} de 6</span><span class="chip-tag sun">${p.bloom}</span></div>
          <h1>${esc(p.title)}</h1>
          <p class="prompt"><b>Objectiu:</b> ${esc(p.goal)}</p>
          <div><h3 style="margin-bottom:.4rem">Què faràs</h3><ul class="steps-list">${p.todo.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
          <div class="controls">${p.ctl.map(([k, v]) => `<kbd>${esc(k)}</kbd><span>${esc(v)}</span>`).join('')}</div>
          <p class="muted"><b>${D.POINTS[p.id]} punts.</b> Els errors i les ajudes resten punts. Al segon error es mostra la resposta correcta.</p>
          <div class="actions"><button class="btn" id="go">${ic('play')} Comença la fase</button><button class="btn ghost" id="back">Torna al tauler</button></div>
        </div>
      </section>`;
    $('#go').onclick = () => { Radio.squelch(); go('phase', pid); };
    $('#back').onclick = () => go('dash');
  }

  /* ========== MOTOR COMÚ ========== */
  function runPhase(pid) { header(pid); ({ f1: F1, f2: F2, f3: F3, f4: F4, f5: F5, f6: F6 })[pid](); }
  function frame(p, i, n, marks, body) {
    return `<div class="play-head"><span class="phase-tag">${ic(p.icon)} F${p.n} · ${esc(p.title)}</span><span class="count">${Math.min(i + 1, n)} / ${n}</span></div>
      <div class="prog" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<i class="${marks[k] || (k === i ? 'cur' : '')}"></i>`).join('')}</div>
      <section class="panel stage">${body}</section>`;
  }
  const fb = (kind, html) => `<div class="feedback ${kind}" role="status">${ic(kind === 'ok' ? 'check' : kind === 'ko' ? 'x' : 'help')}<div>${html}</div></div>`;
  /* botó «Continua»: sempre amb so de ràdio */
  function nextBtn(cb, label) {
    const a = $('.actions'); if (!a) return;
    a.innerHTML = `<button class="btn" id="nx">${label || 'Continua'} ${ic('arrow')}</button>`;
    const b = $('#nx'); b.focus({ preventScroll: true }); b.onclick = () => { Radio.squelch(); Radio.stop(); cb(); };
  }
  function finishPhase(pid, score) {
    S.phases[pid] = { done: true, score: Math.round(score * 10) / 10, at: Date.now() }; save(); header();
    Radio.show(false); keys = null;
    const p = PHASES.find(x => x.id === pid), max = D.POINTS[pid], nx = nextPhase();
    app.innerHTML = `<section class="panel stage" style="text-align:center;padding:3rem 1.5rem">
      <span class="chip-tag" style="background:var(--ok-soft);color:var(--ok)">${ic('check')} Fase ${p.n} completada</span>
      <h1 style="margin:.8rem 0 .4rem"><span class="code">${Math.round(score)}</span> <span class="muted" style="font-size:.45em">/ ${max} punts</span></h1>
      <p class="muted">${score >= max * .85 ? 'Comunicació impecable. CECOS t’ha entès a la primera.' : score >= max * .6 ? 'Bona feina. Repassa els codis que t’han costat abans de continuar.' : 'Cal repassar: consulta els codis i fixa’t en les explicacions.'}</p>
      <div class="actions" style="justify-content:center">
        ${nx ? `<button class="btn" id="nx">Següent: ${esc(nx.title)} ${ic('arrow')}</button>` : `<button class="btn" id="res">${ic('file')} Resultats i informe</button>`}
        <button class="btn ghost" id="bk">Torna al tauler</button></div></section>`;
    if (nx) $('#nx').onclick = () => { Radio.squelch(); go('intro', nx.id); }; else $('#res').onclick = () => { Radio.squelch(); go('results'); };
    $('#bk').onclick = () => go('dash');
  }

  /* ========== F1 · INTERCO: escolta (amb text → només veu) i parla ========== */
  function F1() {
    const p = PHASES[0];
    const L = shuffle(D.LISTEN).slice(0, 4), W = shuffle(D.SPELL.filter(w => w.word.length <= 6)).slice(0, 2).concat(shuffle(D.SPELL.filter(w => w.word.length > 6)).slice(0, 2));
    const items = [...L.map((x, k) => ({ t: 'listen', text: k < 2, ...x })), ...W.map(x => ({ t: 'speak', ...x }))];
    const val = D.POINTS.f1 / items.length; let i = 0, score = 0; const marks = [];
    const next = () => { i++; show(); };
    function show() {
      Radio.setPtt(null); Radio.forget();
      if (i >= items.length) return finishPhase('f1', score);
      (items[i].t === 'listen' ? listenItem : speakItem)(items[i]);
    }
    /* --- escolta --- */
    function listenItem(it) {
      const words = it.say.split('.').map(s => s.trim()).filter(Boolean), shown = [...it.answer].map(c => IC[c] ? IC[c].w : c);
      let errors = 0, helps = 0, reveal = it.text, lock = false, msg = '';
      const playIt = () => Radio.play(it.id, { caption: reveal ? shown.join(' · ') : 'CECOS lletreja…', onProgress: f => {
        const k = Math.min(words.length - 1, Math.floor(f * words.length)); $$('.sub').forEach((e, n) => { e.classList.toggle('on', n === k && f < 1); e.classList.toggle('past', n < k || f >= 1); }); } });
      const render = (focus) => {
        app.innerHTML = frame(p, i, items.length, marks, `<div class="f1">
          <span class="mode-pill">${ic('ear')} Escolta · ${it.text ? 'amb text' : 'només veu'}</span>
          <h2>CECOS et lletreja una paraula</h2>
          <p class="muted">${esc(it.ctx)} · Escriu-la amb lletres, sense espais.</p>
          <div class="subs" aria-hidden="${!reveal}">${shown.map(w => `<span class="sub ${reveal ? '' : 'hid'}">${esc(reveal ? w : '·····')}</span>`).join('')}</div>
          <div class="row" style="justify-content:center"><label class="sr" for="ans">Resposta</label><input id="ans" class="text-in" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="12" ${lock ? 'disabled' : ''}>
            <button class="btn" id="ok" ${lock ? 'disabled' : ''}>${ic('check')} Comprova</button></div>
          ${msg}
          <div class="actions"><button class="btn ghost small" id="rp">${ic('sound')} Torna a escoltar</button>
            ${reveal ? '' : `<button class="btn ghost small" id="hp" ${lock ? 'disabled' : ''}>${ic('help')} Mostra el text</button><span class="help-cost">−30 %</span>`}</div></div>`);
        $('#rp').onclick = playIt;
        $('#hp') && ($('#hp').onclick = () => { helps++; S.helps++; reveal = true; render(true); playIt(); });
        const check = () => {
          const a = $('#ans').value.toUpperCase().replace(/[\s-]/g, ''); if (!a) return;
          if (a === it.answer) { score += itemScore(val, errors, helps); marks[i] = errors ? 'ko' : 'ok'; lock = true; reveal = true; msg = fb('ok', `Correcte: <b class="code">${it.answer}</b> · ${shown.join(' · ')}`); render(); $('#ans').value = a; return nextBtn(next); }
          errors++; slip();
          if (errors >= 2) { marks[i] = 'ko'; mistake('F1', it.answer, a, 'INTERCO escolta'); lock = true; reveal = true; msg = fb('ko', `Era <b class="code">${it.answer}</b> · ${shown.join(' · ')}`); render(); return nextBtn(next); }
          msg = fb('ko', 'No és correcte. Escolta-ho un altre cop i torna-ho a provar.'); render(true); playIt();
        };
        $('#ok').onclick = check; $('#ans').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
        if (focus && !lock) $('#ans').focus({ preventScroll: true });
      };
      render(true); playIt();
    }
    /* --- parla --- */
    function speakItem(it) {
      const letters = [...it.word], need = letters.map(c => IC[c].w);
      let fails = 0, helps = 0, hint = false, mode = (SRC && !S.noVoice) ? 'voice' : 'chips', hit = null, heard = '', picked = [], msg = '', done = false, rec = null;
      const pool = shuffle([...new Set(need.concat(shuffle(D.INTERCO.map(x => x.w).filter(w => !need.includes(w))).slice(0, 4)))]);
      const sc = () => Math.max(0, val * (1 - .25 * fails - .3 * helps));
      const win = () => { done = true; score += sc(); marks[i] = fails ? 'ko' : 'ok'; Radio.setPtt(null); hit = letters.map(() => true); msg = fb('ok', `CECOS t’ha copiat: <b>${need.join(' · ')}</b>`); render(); nextBtn(next); };
      const lose = () => { done = true; marks[i] = 'ko'; mistake('F1', need.join(' '), heard || picked.join(' '), 'INTERCO ' + it.word); Radio.setPtt(null); hint = true; hit = null; msg = fb('ko', `Es lletreja així: <b>${need.join(' · ')}</b>`); render(); nextBtn(next); };
      function render() {
        app.innerHTML = frame(p, i, items.length, marks, `<div class="f1">
          <span class="mode-pill">${ic('mic')} Parla · ${mode === 'voice' ? 'per veu' : 'amb fitxes'}</span>
          <h2>Lletreja per ràdio</h2>
          <p class="muted">${esc(it.ctx)}</p>
          <div class="tiles" aria-label="${esc(it.word)}">${letters.map((c, k) => {
            const cls = done && hit ? 'hit' : hit ? (hit[k] ? 'hit' : 'miss') : (mode === 'chips' && picked[k] ? 'filled' : '');
            const w = (hint || (hit && hit[k]) || done) ? need[k] : (mode === 'chips' && picked[k]) ? picked[k] : '';
            return `<div class="tile ${cls}">${mode === 'chips' && picked[k] && !done ? `<button type="button" data-rm="${k}" aria-label="Treu ${esc(picked[k])}">` : ''}<span class="l">${esc(c)}</span><span class="w">${esc(w)}</span>${mode === 'chips' && picked[k] && !done ? '</button>' : ''}</div>`; }).join('')}</div>
          ${mode === 'voice' && !done ? `<p class="ptt-hint">${ic('mic')} Mantén premut PARLA (o la barra espaiadora) i digues les paraules INTERCO, una per lletra.</p><p class="heard" id="heard">${heard ? 'CECOS ha sentit: «' + esc(heard) + '»' : ''}</p>` : ''}
          ${mode === 'chips' && !done ? `<div class="chips" role="group" aria-label="Paraules INTERCO">${pool.map(w => `<button class="chip" type="button" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>` : ''}
          ${msg}
          <div class="actions">${done ? '' : `
            ${mode === 'chips' ? `<button class="btn" id="ok" ${picked.length < need.length ? 'disabled' : ''}>${ic('check')} Comprova</button>` : ''}
            <button class="btn ghost small" id="hp" ${hint ? 'disabled' : ''}>${ic('help')} Mostra les paraules</button><span class="help-cost">−30 %</span>
            ${mode === 'voice' ? `<button class="btn ghost small" id="sw">Sense micròfon? Fes-ho amb fitxes</button>` : ''}`}</div></div>`);
        if (done) return;
        $('#hp').onclick = () => { helps++; S.helps++; hint = true; render(); };
        $('#sw') && ($('#sw').onclick = () => { mode = 'chips'; hit = null; msg = ''; Radio.setPtt(null); render(); });
        if (mode === 'chips') {
          $$('[data-w]').forEach(b => b.onclick = () => { if (picked.length < need.length) { picked.push(b.dataset.w); hit = null; render(); } });
          $$('[data-rm]').forEach(b => b.onclick = () => { picked.splice(+b.dataset.rm, 1); hit = null; render(); });
          $('#ok').onclick = () => {
            if (picked.every((w, k) => w === need[k])) return win();
            fails++; slip(); if (fails >= 4) return lose();
            hit = picked.map((w, k) => w === need[k]); picked = []; msg = fb('ko', 'No és correcte: en verd, les lletres encertades. Torna-ho a provar.'); render();
          };
        }
      }
      const fallback = why => { S.noVoice = true; save(); mode = 'chips'; Radio.setPtt(null); msg = fb('info', why + ' Fes-ho amb les fitxes.'); render(); };
      if (mode === 'voice') Radio.setPtt({
        down() { Radio.mic(); Radio.caption('TX · …'); try { rec = listenOnce(); } catch { rec = null; } },
        async up(held) {
          if (!rec) return fallback('El navegador no pot reconèixer la veu.');
          const r = await rec.stop(); rec = null; if (done) return;
          if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(r.error)) return fallback('No hi ha accés al micròfon.');
          if (r.error === 'network' || r.error === 'start') return fallback('El reconeixement de veu no està disponible ara.');
          if (held < 500 || !r.alts.length) { msg = fb('info', 'No t’hem sentit. Mantén premut PARLA mentre dius totes les paraules.'); return render(); }
          const best = r.alts.map(t => ({ t, m: matchSpell(t, letters) })).sort((a, b) => b.m.score - a.m.score)[0];
          heard = best.t; hit = best.m.hit;
          if (best.m.ok) return win();
          fails++; slip(); if (fails >= 4) return lose();
          msg = fb('ko', `CECOS no t’ha copiat (${best.m.score} de ${letters.length} lletres). <b>Repeteix</b> la paraula sencera.`); render();
          Radio.play('rep', { caption: D.F2_REPEAT.text, remember: false });
        },
      });
      render();
    }
    show();
  }

  /* ========== F2 · FAMÍLIES ========== */
  function F2() {
    const p = PHASES[1], fams = Object.entries(D.FAMILIES);
    const byFam = {}; D.F2.forEach(x => { const f = D.byCode[x.code].fam; (byFam[f] = byFam[f] || []).push(x); });
    const items = shuffle(fams.flatMap(([f]) => shuffle(byFam[f]).slice(0, 2)));
    const val = D.POINTS.f2 / items.length; let i = 0, score = 0; const marks = [], placed = {};
    function show() {
      if (i >= items.length) return finishPhase('f2', score);
      const it = items[i], c = it.code, right = D.byCode[c].fam; let errors = 0, helps = 0, shown = false, wrong = null, msg = '';
      const img = `assets/img/f2/${cid(c)}.webp`;
      const render = () => {
        app.innerHTML = frame(p, i, items.length, marks, `<div class="f2">
          <div class="codecard"><img src="${img}" alt="Imatge d’un servei relacionat amb el codi" width="1280" height="720">
            <div class="cc-body"><div class="code">${esc(c)}</div>${shown ? `<p class="mean">${esc(legend(c))}</p>` : ''}<p class="said">«${esc(it.ctx)}»</p></div></div>
          <div><h2>A quina família pertany?</h2>
            <p class="muted" style="margin:.3rem 0 .9rem">Escolta la ràdio, mira la imatge i tria.</p>
            <div class="bins" role="group" aria-label="Famílies">${fams.map(([k, f], n) => `
              <button class="bin ${wrong === k ? 'wrong' : ''}" type="button" data-f="${k}" ${wrong === k ? 'disabled' : ''}><kbd>${n + 1}</kbd>
                <span class="bh"><span class="bi">${ic(f.icon)}</span>${esc(f.name)}</span><span class="bq">${esc(f.hint)}</span>
                <span class="placed">${(placed[k] || []).map(x => `<span class="tag">${esc(x)}</span>`).join('')}</span></button>`).join('')}</div>
            ${msg}
            <div class="actions"><button class="btn ghost small" id="hp" ${shown ? 'disabled' : ''}>${ic('help')} Significat</button><span class="help-cost">−30 %</span></div></div></div>`);
        $('#hp').onclick = () => { helps++; S.helps++; shown = true; render(); };
        $$('.bin').forEach(b => b.onclick = () => pick(b.dataset.f));
      };
      const pick = f => {
        if (f === right) { score += itemScore(val, errors, helps); marks[i] = errors ? 'ko' : 'ok'; return explain(true); }
        errors++; slip(c);
        if (errors >= 2) { marks[i] = 'ko'; mistake('F2', c, D.FAMILIES[f].name, 'família: ' + D.FAMILIES[right].name); return explain(false); }
        wrong = f; msg = fb('ko', `No és «${esc(D.FAMILIES[f].name)}». Pensa què vol dir el codi.`); render();
      };
      /* motion graphic: resposta explicada, exemple amb imatge i 2 codis relacionats */
      const explain = ok => {
        keys = null; (placed[right] = placed[right] || []).push(c);
        app.innerHTML = frame(p, i, items.length, marks, `<div class="explain">
          <div class="ex-img"><img src="${img}" alt="${esc(it.ex)}"><span class="ex-badge">${ic(D.FAMILIES[right].icon)} ${esc(D.FAMILIES[right].name)}</span></div>
          <div class="ex-body">
            <span class="ex-verdict ${ok ? 'ok' : 'ko'}">${ic(ok ? 'check' : 'x')} ${ok ? 'Correcte' : 'La resposta era'}</span>
            <div class="ex-code">${esc(c)}</div>
            <p class="ex-mean">${esc(legend(c))}</p>
            <p class="ex-fam">Família: ${esc(D.FAMILIES[right].name)}</p>
            <p class="ex-ex"><b>Exemple</b>${esc(it.ex)}</p>
            <div class="ex-rel"><b>Codis relacionats</b>${it.rel.map(r => `<div class="rel"><span class="code">${esc(r)}</span><span>${esc(legend(r))}</span></div>`).join('')}</div>
          </div></div><div class="actions"></div>`);
        nextBtn(() => { i++; show(); });
      };
      keys = e => { if (/^[1-6]$/.test(e.key)) { const b = $$('.bin')[+e.key - 1]; if (b && !b.disabled) pick(b.dataset.f); } };
      render(); Radio.play(cid(c), { caption: it.ctx });
    }
    show();
  }

  /* ========== F3 · ESCENES ========== */
  function F3() {
    const p = PHASES[2];
    const pickLvl = (l, n) => shuffle(D.SCENES.filter(s => s.lvl === l)).slice(0, n);
    const items = [...pickLvl(1, 4), ...pickLvl(2, 4), ...pickLvl(3, 4)], levels = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
    const val = D.POINTS.f3 / items.length; let i = 0, score = 0; const marks = [];
    function show() {
      if (i >= items.length) return finishPhase('f3', score);
      const s = items[i], lvl = levels[i]; let errors = 0, done = false, left = 20;
      const opts = shuffle([s.code, ...s.opts]), fam = D.FAMILIES[D.byCode[s.code].fam];
      app.innerHTML = frame(p, i, items.length, marks, `<div class="scene">
          <figure id="fig"><img src="assets/img/${s.id}.webp" alt="${esc(s.desc)}" width="1600" height="900">
            <span class="lvl">Nivell ${lvl}${lvl === 3 ? ' · contrarellotge' : ''}</span>
            ${lvl === 3 ? `<span class="timer" id="tm">${ic('clock')}<span id="tl">20</span> s</span>` : ''}</figure>
          <div><p class="desc">${esc(s.desc)}</p>
            ${lvl === 1 ? `<p class="hint" style="margin-top:.7rem">${ic(fam.icon)} Pista: família «${esc(fam.name)}»</p>` : ''}
            <p class="muted" style="margin-top:.8rem">Quin codi comunicaries a CECOS?</p>
            <div class="opts" role="group" aria-label="Opcions">${opts.map((c, k) => `
              <button class="opt" type="button" data-c="${esc(c)}"><span class="k">${k + 1}</span><span class="code">${esc(c)}</span><small>${lvl < 3 ? esc(legend(c)) : ''}</small></button>`).join('')}</div>
            <div id="fbk"></div><div class="actions"></div></div></div>`);
      const lock = () => { done = true; clearInterval(timerId); $$('.opt').forEach(b => { b.disabled = true; if (b.dataset.c === s.code) b.classList.add('ok'); }); $('#tm') && $('#tm').remove(); };
      const next = () => { i++; show(); };
      const answer = (c, btn) => {
        if (done) return;
        if (c === s.code) {
          score += itemScore(val, errors, 0); marks[i] = errors ? 'ko' : 'ok'; lock();
          /* motion graphic sobre el dibuix: codi en gran amb efecte de llum */
          $('#fig').insertAdjacentHTML('beforeend', `<div class="reveal" role="status"><span class="rv-ok">${ic('check')} Correcte</span><div class="rv-code">${esc(s.code)}</div><p class="rv-text">${esc(legend(s.code))}</p></div>`);
          Radio.squelch(); return nextBtn(next);
        }
        errors++; slip(s.code); if (btn) { btn.classList.add('ko'); btn.disabled = true; }
        if (errors >= 2 || c === null) {
          marks[i] = 'ko'; lock(); mistake('F3', s.code, c || 'temps esgotat', s.desc.slice(0, 60));
          $('#fbk').innerHTML = fb('ko', `${c === null ? 'S’ha acabat el temps. ' : ''}El codi correcte és <b class="code">${esc(s.code)}</b> · ${esc(legend(s.code))}.${c ? `<br><span class="muted">${esc(c)} vol dir: ${esc(legend(c))}.</span>` : ''}`);
          return nextBtn(next);
        }
        $('#fbk').innerHTML = fb('ko', `<b class="code">${esc(c)}</b> és «${esc(legend(c))}». Torna-ho a provar.`);
      };
      $$('.opt').forEach(b => b.onclick = () => answer(b.dataset.c, b));
      keys = e => { if (/^[1-4]$/.test(e.key)) { const b = $$('.opt')[+e.key - 1]; if (b && !b.disabled) answer(b.dataset.c, b); } };
      if (lvl === 3) timerId = setInterval(() => {
        left--; const tl = $('#tl'); if (!tl) return clearInterval(timerId);
        tl.textContent = left; if (left <= 5) $('#tm').classList.add('low');
        if (left <= 0) { clearInterval(timerId); answer(null, null); }
      }, 1000);
    }
    show();
  }

  /* ========== F4 · LÍNIA DEL SERVEI ========== */
  function F4() {
    const p = PHASES[3], items = D.SEQUENCES, val = D.POINTS.f4 / items.length; let i = 0, score = 0; const marks = [];
    function show() {
      if (i >= items.length) return finishPhase('f4', score);
      const q = items[i]; let order = shuffle(q.steps); while (order.join() === q.steps.join()) order = shuffle(q.steps);
      let tries = 0, done = false;
      const render = (msg, res) => {
        app.innerHTML = frame(p, i, items.length, marks, `
          <h2>${esc(q.title)}</h2>
          <p class="prompt" style="margin-top:.3rem">Ordena els codis tal com es comuniquen, del primer (dalt) a l’últim (baix).</p>
          <ol class="seq" id="seq">${order.map((c, k) => `
            <li data-c="${esc(c)}" class="${res ? (res[k] ? 'ok' : 'ko') : ''}"><span class="code grip">${esc(c)}</span><span class="tx">${esc(legend(c))}</span>
            ${done ? '' : `<span class="mv"><button type="button" data-up="${k}" aria-label="Puja ${esc(c)}" ${k === 0 ? 'disabled' : ''}>${ic('up')}</button><button type="button" data-dn="${k}" aria-label="Baixa ${esc(c)}" ${k === order.length - 1 ? 'disabled' : ''}>${ic('down')}</button></span>`}</li>`).join('')}</ol>
          ${msg || ''}
          <div class="actions">${done ? '' : `<button class="btn" id="ok">${ic('check')} Comprova</button><span class="help-cost">Intent ${tries + 1} de 2</span>`}</div>`);
        if (done) return nextBtn(() => { i++; show(); });
        const mv = (k, d) => { [order[k + d], order[k]] = [order[k], order[k + d]]; render(); const b = $(`[data-${d < 0 ? 'up' : 'dn'}="${k + d}"]`); (b && !b.disabled ? b : $(`[data-${d < 0 ? 'dn' : 'up'}="${k + d}"]`)).focus(); };
        $$('[data-up]').forEach(b => b.onclick = () => mv(+b.dataset.up, -1));
        $$('[data-dn]').forEach(b => b.onclick = () => mv(+b.dataset.dn, 1));
        dragSort($('#seq'), (from, to) => { const [x] = order.splice(from, 1); order.splice(to, 0, x); render(); });
        $('#ok').onclick = () => {
          const r = order.map((c, k) => c === q.steps[k]), nOk = r.filter(Boolean).length;
          if (nOk === order.length) { score += itemScore(val, tries, 0); marks[i] = tries ? 'ko' : 'ok'; done = true; return render(fb('ok', 'Seqüència correcta. Així és com avança un servei.'), r); }
          tries++; slip(order.filter((c, k) => c !== q.steps[k]).join(' '));
          if (tries >= 2) {
            score += itemScore(val, 1, 0) * (nOk / order.length); marks[i] = 'ko'; done = true;
            mistake('F4', order.filter((c, k) => c !== q.steps[k]).join(' '), order.join(' > '), q.title + ' (ordre)'); order = q.steps.slice();
            return render(fb('ko', `L’ordre correcte és: <b>${q.steps.join(' → ')}</b>.`), q.steps.map(() => true));
          }
          render(fb('ko', `${nOk} de ${order.length} en el lloc correcte (en verd). Mou les vermelles i torna-ho a provar.`), r);
        };
      };
      render();
    }
    show();
  }
  function dragSort(list, onMove) {
    let el = null, from = -1, startY = 0, h = 0;
    $$('li', list).forEach((li, k) => {
      li.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; el = li; from = k; startY = e.clientY; h = li.offsetHeight + 8; li.setPointerCapture(e.pointerId); li.classList.add('drag'); });
      li.addEventListener('pointermove', e => { if (el === li) li.style.transform = `translateY(${e.clientY - startY}px)`; });
      li.addEventListener('pointerup', e => { if (el !== li) return; const d = Math.round((e.clientY - startY) / h); el = null; li.classList.remove('drag'); li.style.transform = '';
        const to = Math.max(0, Math.min(list.children.length - 1, from + d)); if (to !== from) onMove(from, to); });
    });
  }

  /* ========== F5 · DESCODIFICA ========== */
  function F5() {
    const p = PHASES[4], items = shuffle(D.DECODE), val = D.POINTS.f5 / items.length; let i = 0, score = 0; const marks = [];
    function show() {
      if (i >= items.length) return finishPhase('f5', score);
      const d = items[i]; let errors = 0, done = false; const opts = shuffle([d.ok, ...d.bad]);
      const playIt = () => Radio.play(d.id, { caption: d.msg });
      app.innerHTML = frame(p, i, items.length, marks, `
        <h2>Què vol dir aquest missatge?</h2>
        <div class="msg" style="margin-top:1rem"><button class="play" id="pl" aria-label="Torna a escoltar el missatge">${ic('sound')}</button><div class="txt">«${esc(d.msg)}»</div></div>
        <p class="muted" style="margin-top:.6rem;display:flex;gap:.4rem;align-items:center">${ic('radio')} ${esc(d.who)}</p>
        <div class="opts" role="group" aria-label="Traduccions">${opts.map((o, k) => `<button class="opt" type="button" data-o="${k}"><span class="k">${k + 1}</span><span></span><small style="color:inherit;font-size:1rem;font-weight:600">${esc(o)}</small></button>`).join('')}</div>
        <div id="fbk"></div><div class="actions"></div>`);
      $('#pl').onclick = playIt;
      const info = `<span class="muted">Qui: ${esc(d.who)} · Què: ${esc(d.what)} · On: ${esc(d.where)}</span>`;
      const answer = (k, b) => {
        if (done) return; const o = opts[k];
        if (o === d.ok) { score += itemScore(val, errors, 0); marks[i] = errors ? 'ko' : 'ok'; done = true; b.classList.add('ok'); $$('.opt').forEach(x => x.disabled = true); $('#fbk').innerHTML = fb('ok', 'Correcte. ' + info); return nextBtn(() => { i++; show(); }); }
        errors++; slip(d.msg); b.classList.add('ko'); b.disabled = true;
        if (errors >= 2) { marks[i] = 'ko'; done = true; mistake('F5', d.msg, o, 'descodificació'); $$('.opt').forEach(x => { x.disabled = true; if (opts[+x.dataset.o] === d.ok) x.classList.add('ok'); });
          $('#fbk').innerHTML = fb('ko', 'La traducció correcta està marcada en verd. ' + info); return nextBtn(() => { i++; show(); }); }
        $('#fbk').innerHTML = fb('ko', 'No és això. Torna a escoltar i fixa’t en els codis.');
      };
      $$('.opt').forEach(b => b.onclick = () => answer(+b.dataset.o, b));
      keys = e => { if (/^[1-3]$/.test(e.key)) { const b = $$('.opt')[+e.key - 1]; if (b && !b.disabled) answer(+b.dataset.o, b); } };
      playIt();
    }
    show();
  }

  /* ========== F6 · SIMULADOR DE RÀDIO ========== */
  function F6() {
    const p = PHASES[5], scen = D.RADIO, txTotal = scen.reduce((a, s) => a + s.steps.filter(x => x.type === 'tx').length, 0);
    const val = D.POINTS.f6 / txTotal; let si = 0, score = 0; const marks = [];
    function scenario() {
      if (si >= scen.length) return finishPhase('f6', score);
      const sc = scen[si]; let step = 0, sel = null, errors = 0, ended = false, note = ''; const log = [];
      const render = () => {
        const st = sc.steps[step], tx = !ended && st && st.type === 'tx' && !Radio.busy;
        if (tx && !st._opts) st._opts = shuffle([st.ok, ...st.bad]);
        app.innerHTML = frame(p, si, scen.length, marks, `<div class="radio-wrap">
            <div><h2>${esc(sc.title)}</h2>
              <p class="muted" style="margin:.3rem 0 1rem">Ets la unitat <b>${esc(sc.unit)}</b>. Parles amb CECOS pel canal del SEM.</p>
              <div class="log" id="log" aria-live="polite">${log.map(m => `<div class="bubble ${m.k}${m.bad ? ' ko' : ''}"><b>${m.k === 'rx' ? 'CECOS' : m.k === 'tx' ? esc(sc.unit) : 'Avís'}</b>${esc(m.t)}</div>`).join('') || '<p class="muted">Esperant comunicació…</p>'}</div></div>
            <div class="tx-panel">${ended ? `<p class="tx-task">Comunicació tancada.</p>` : tx ? `<p class="tx-task" id="txt-task">${esc(st.prompt)}</p>
                <div class="tx-opts" role="radiogroup" aria-label="Què dius">${st._opts.map((o, k) => `<button type="button" role="radio" aria-checked="${sel === k}" class="tx-opt ${sel === k ? 'sel' : ''}" data-k="${k}">${esc(o)}</button>`).join('')}</div>
                <p class="ptt-hint" style="margin-top:.8rem">${ic('mic')} Tria el missatge i mantén premut PARLA.</p>` : `<p class="tx-task">CECOS està parlant… escolta.</p>`}
              ${note}</div></div><div class="actions"></div>`);
        const L = $('#log'); L.scrollTop = L.scrollHeight;
        $$('.tx-opt').forEach(b => b.onclick = () => { sel = +b.dataset.k; note = ''; render(); });
        if (ended) nextBtn(() => { si++; scenario(); }, si + 1 < scen.length ? 'Següent situació' : 'Acaba la fase');
      };
      const advance = async () => {
        while (step < sc.steps.length && sc.steps[step].type === 'rx') {
          const st = sc.steps[step]; log.push({ k: 'rx', t: st.text }); const pr = Radio.play(`${sc.id}-${step}`, { caption: st.text }); render();
          await pr; if (!$('#log')) return; step++; await new Promise(r => setTimeout(r, 350));
        }
        if (step >= sc.steps.length) { ended = true; if (!marks[si]) marks[si] = 'ok'; Radio.setPtt(null); note = fb('ok', `Comunicació «${esc(sc.title)}» tancada.`); return render(); }
        sel = null; errors = 0; render();
      };
      Radio.setPtt({
        stepped() { errors += .5; slip('3.13'); mistake('F6', '3.13', 'PARLA durant RX', 'ha trepitjat CECOS'); log.push({ k: 'sys', t: '3.13 · Fer ús correcte de l’equip de ràdio: no premis PARLA mentre parla CECOS.' }); render(); },
        down() { Radio.mic(); },
        up(held) {
          const st = sc.steps[step]; if (ended || !st || st.type !== 'tx') return;
          if (sel === null) { note = fb('info', 'Primer tria què diràs i després prem PARLA.'); return render(); }
          if (held < 600) { errors += .5; note = fb('ko', 'Missatge tallat: has deixat anar PARLA massa aviat. Mantén-lo premut mentre parles.'); return render(); }
          const said = st._opts[sel];
          if (said === st.ok) { score += itemScore(val, Math.min(errors, 2), 0); if (errors) marks[si] = 'ko'; log.push({ k: 'tx', t: said }); note = fb('ok', esc(st.why)); step++; sel = null; render(); return setTimeout(advance, 700); }
          errors++; slip(st.ok); log.push({ k: 'tx', t: said, bad: true });
          if (errors >= 2) { marks[si] = 'ko'; mistake('F6', st.ok, said, sc.title); log.push({ k: 'sys', t: 'Correcte seria: «' + st.ok + '»' }); note = fb('ko', esc(st.why)); step++; sel = null; render(); return setTimeout(advance, 1200); }
          note = fb('ko', 'CECOS no ho entén així. Torna-ho a provar: ' + esc(st.why.split('.')[0]) + '.'); render();
        },
      });
      render(); setTimeout(advance, 600);
    }
    scenario();
  }

  /* ========== RESULTATS I INFORME ========== */
  async function verifyCode() {
    if (S.verify) return S.verify;
    const h = await sha256(`${S.email}|${Math.round(total())}|${S.started}|codi3-tes`);
    S.verify = `C3-${h.slice(0, 4)}-${h.slice(4, 8)}`.toUpperCase(); S.finished = S.finished || Date.now(); save(); return S.verify;
  }
  function reviewList() {
    const seen = new Map(); (S.slips || []).forEach(c => seen.set(c, (seen.get(c) || 0) + 1));
    return [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c, n]) => ({ c, n, t: legend(c) }));
  }
  async function results() {
    header(); const code = await verifyCode(), g = grade(), rv = reviewList();
    const famErr = {}; (S.slips || []).forEach(c => { const f = D.byCode[c].fam; famErr[f] = (famErr[f] || 0) + 1; });
    const maxFE = Math.max(1, ...Object.values(famErr));
    app.innerHTML = `
      <section class="panel res-top">
        <div class="grade" aria-label="Nota ${fmt(g)} sobre 10"><div><b>${fmt(g)}</b><br><small>sobre 10</small></div></div>
        <div class="stack"><h1>Informe de guàrdia</h1>
          <p class="muted">${esc(S.name)} · ${esc(S.email)} · ${new Date(S.finished).toLocaleString('ca-ES')}</p>
          <p><b class="code">${Math.round(total())}</b> / 1000 punts · ${S.errs || 0} respostes errònies · ${S.helps} ajudes</p>
          <p>Codi de verificació: <span class="verify">${code}</span></p></div>
      </section>
      <div class="res-grid">
        <section class="panel"><h3>Punts per fase</h3>
          <div class="bars" role="list">${PHASES.map(p => { const sc = (S.phases[p.id] || {}).score || 0, mx = D.POINTS[p.id], pc = sc / mx * 100;
            return `<div class="bar" role="listitem" tabindex="0"><span>F${p.n} · ${esc(p.title)}</span><span class="track"><span class="fill" style="width:${pc}%"></span></span><span class="v">${Math.round(sc)}/${mx}</span><span class="tip">${Math.round(pc)} % · ${esc(p.bloom)}</span></div>`; }).join('')}</div>
          <table class="t"><caption class="sr">Taula de punts per fase</caption><thead><tr><th>Fase</th><th class="n">Punts</th><th class="n">Màx.</th></tr></thead>
          <tbody>${PHASES.map(p => `<tr><td>F${p.n} · ${esc(p.title)}</td><td class="n">${Math.round((S.phases[p.id] || {}).score || 0)}</td><td class="n">${D.POINTS[p.id]}</td></tr>`).join('')}</tbody></table>
        </section>
        <section class="panel"><h3>Respostes errònies per família</h3>
          ${Object.keys(famErr).length ? `<div class="bars">${Object.entries(D.FAMILIES).map(([k, f]) => { const n = famErr[k] || 0;
            return `<div class="bar" tabindex="0"><span>${esc(f.name)}</span><span class="track"><span class="fill bad" style="width:${n / maxFE * 100}%"></span></span><span class="v">${n}</span><span class="tip">${n} resposta${n === 1 ? '' : 'es'}</span></div>`; }).join('')}</div>` : '<p class="muted" style="margin-top:.8rem">Cap resposta errònia amb codis. Excel·lent.</p>'}
          <h3 style="margin-top:1.4rem">Codis a repassar</h3>
          ${rv.length ? `<div class="review">${rv.map(r => `<div><b class="code">${esc(r.c)}</b><span>${esc(r.t)}</span></div>`).join('')}</div>` : '<p class="muted" style="margin-top:.6rem">No n’hi ha cap.</p>'}
        </section>
      </div>
      <section class="panel stage" style="margin-top:1.25rem">
        <h2>Lliura l’informe a Classroom</h2>
        <ol class="deliver"><li><b>1.</b> Desa l’informe en PDF amb el botó.</li><li><b>2.</b> Obre la tasca «Codi 3 · Parla com el SEM» a Google Classroom i adjunta-hi el PDF.</li><li><b>3.</b> Prem <b>Lliura</b>.</li></ol>
        <div class="actions"><button class="btn" id="pdf">${ic('file')} Desa l’informe en PDF</button>
        <a class="btn ghost" href="${CLASSROOM}" target="_blank" rel="noopener">Obre Google Classroom</a>
        <button class="btn ghost" id="bk">Torna al tauler</button>
        <button class="btn ghost small" id="rs">${ic('refresh')} Torna a començar</button></div>
      </section>`;
    $('#pdf').onclick = pdf; $('#bk').onclick = () => go('dash');
    $('#rs').onclick = e => { const b = e.currentTarget; if (!b.dataset.sure) { b.dataset.sure = 1; b.innerHTML = `${ic('refresh')} Prem un altre cop: es perdrà el resultat`; return; } S = fresh(S.email, S.name); save(); go('dash'); };
  }

  function pdf() {
    if (!window.jspdf) return toast('Encara s’està carregant el generador de PDF. Torna-ho a provar.');
    const T = s => String(s).replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/→/g, '>').replace(/[–—]/g, '-');
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' }), W = 210, M = 16; let y = 0;
    doc.setFillColor(11, 21, 48); doc.rect(0, 0, W, 34, 'F');
    doc.setTextColor(255, 197, 61); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('Codi 3 · Parla com el SEM', M, 15);
    doc.setTextColor(232, 236, 247); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(T('MP0060 Teleemergències · CFGM Emergències Sanitàries · TES 1AA · Institut d’FP Sanitària Vall d’Hebron'), M, 23);
    doc.text(T('Informe individual de l’activitat · Aplicació dissenyada per Rubén Vallejo'), M, 28.5);
    y = 46; doc.setTextColor(11, 21, 48);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(T(S.name), M, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(T(`${S.email} · ${new Date(S.finished || Date.now()).toLocaleString('ca-ES')}`), M, y + 6);
    doc.setFillColor(255, 197, 61); doc.circle(W - M - 16, y + 2, 16, 'F'); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.text(fmt(grade()), W - M - 16, y + 5, { align: 'center' }); doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.text('sobre 10', W - M - 16, y + 10, { align: 'center' });
    doc.setFontSize(11); doc.text(T(`Total: ${Math.round(total())} / 1000 punts · Respostes errònies: ${S.errs || 0} · Ajudes: ${S.helps}`), M, y + 14);
    doc.setFont('courier', 'bold'); doc.text(`Codi de verificació: ${S.verify}`, M, y + 20);
    y += 32; doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Punts per fase', M, y); y += 4;
    PHASES.forEach(p => { const sc = (S.phases[p.id] || {}).score || 0, mx = D.POINTS[p.id]; y += 8;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(T(`F${p.n} · ${p.title} (${p.bloom})`), M, y);
      doc.setFillColor(237, 240, 247); doc.rect(M + 78, y - 3.5, 80, 4.5, 'F'); doc.setFillColor(36, 86, 240); doc.rect(M + 78, y - 3.5, 80 * sc / mx, 4.5, 'F');
      doc.setFont('courier', 'bold'); doc.text(`${Math.round(sc)}/${mx}`, W - M, y, { align: 'right' }); });
    y += 14; doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Codis a repassar', M, y); y += 2;
    const rv = reviewList(); doc.setFontSize(10);
    if (!rv.length) { y += 7; doc.setFont('helvetica', 'normal'); doc.text('Cap codi pendent.', M, y); }
    rv.forEach(r => { y += 6.5; doc.setFont('courier', 'bold'); doc.text(r.c, M, y); doc.setFont('helvetica', 'normal'); doc.text(T(doc.splitTextToSize(r.t, 150)[0]), M + 22, y); });
    y += 12; doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Elements no resolts (resposta mostrada)', M, y); doc.setFontSize(9);
    const rows = S.mistakes.slice(0, 22);
    if (!rows.length) { y += 7; doc.setFont('helvetica', 'normal'); doc.text('Cap.', M, y); }
    rows.forEach(m => { if (y > 272) { doc.addPage(); y = 20; } y += 6; doc.setFont('helvetica', 'bold'); doc.text(m.phase, M, y); doc.setFont('helvetica', 'normal');
      doc.text(doc.splitTextToSize(T(`Correcte: ${m.expected}  ·  Resposta: ${m.given}${m.note ? '  ·  ' + m.note : ''}`), W - 2 * M - 12)[0], M + 10, y); });
    if (S.mistakes.length > 22) { y += 6; doc.text(`… i ${S.mistakes.length - 22} més.`, M + 10, y); }
    const pages = doc.getNumberOfPages();
    for (let k = 1; k <= pages; k++) { doc.setPage(k); doc.setFontSize(8); doc.setTextColor(105, 115, 140);
      doc.text(T('Lliura aquest PDF a la tasca de Google Classroom. La valoració és orientativa i la revisa el professorat.'), M, 290); doc.text(`${k}/${pages}`, W - M, 290, { align: 'right' }); }
    const nm = S.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_');
    doc.save(`Informe_Codi3_${nm}.pdf`); toast('PDF desat. Adjunta’l a la tasca de Classroom.');
  }

  /* ========== CONSULTA DE CODIS ========== */
  function openRef() {
    const dlg = $('#ref');
    dlg.innerHTML = `<div class="ref-head"><h2 id="ref-title" style="font-size:1.4rem">Codi 3 i INTERCO</h2>
      <label class="ref-search">${ic('search')}<span class="sr">Cerca</span><input id="rq" placeholder="Cerca un codi o una paraula"></label>
      <button class="icon-btn" id="rc" aria-label="Tanca">${ic('x')}</button></div>
      <div class="ref-body"><div><p class="muted" style="margin-bottom:.6rem">En vermell, els codis prioritaris o de risc.</p><div class="ref-list" id="rl"></div></div>
      <div><h3 style="margin-bottom:.6rem">Alfabet INTERCO</h3><div class="ic-grid">${D.INTERCO.map(x => `<div><b>${x.l}</b>${esc(x.w)}</div>`).join('')}</div></div></div>`;
    const list = q => { q = (q || '').toLowerCase(); $('#rl').innerHTML = D.CODES.filter(c => !q || (c.code + ' ' + c.text).toLowerCase().includes(q)).map(c => `<div><b class="code ${c.prio ? 'prio' : ''}">${esc(c.code)}</b><span>${esc(c.text)}</span></div>`).join('') || '<p class="muted">Cap resultat.</p>'; };
    list(); $('#rq').oninput = e => list(e.target.value); $('#rc').onclick = () => dlg.close();
    dlg.showModal();
  }
  $('#btn-ref').onclick = () => { if (!$('#dock').hidden) return toast('Durant les fases fes servir els botons d’ajuda. La consulta s’obre des del tauler.'); openRef(); };
  $('.brand').addEventListener('click', e => { e.preventDefault(); if (S) go('dash'); });

  go(S ? 'dash' : 'login');
})();
