/* Codi 3 · Parla com el SEM — lògica de l'activitat (sense dependències; jsPDF per a l'informe) */
(function () {
  'use strict';
  const D = window.DATA;
  const STORE = 'codi3-tes-v1';
  /* Contrasenya d'aula: SHA-256 de «tes1aa». Per canviar-la: echo -n NOVA | sha256sum */
  const PASS_HASH = '6000d76c8885915b57c97b9841752193b454bfcbc15612210afbb435abed16aa';
  const CLASSROOM = 'https://classroom.google.com/';
  const PHASES = [
    { id: 'f1', n: 1, icon: 'spell', title: 'Alfabet INTERCO', bloom: 'Recordar', art: 'assets/img/s3-3.webp',
      goal: 'Lletrejar noms, carrers i indicatius amb l’alfabet internacional, sense errors.',
      todo: ['3 paraules per lletrejar: toca les paraules INTERCO en ordre.', '3 missatges per escoltar: escolta CECOS i escriu el que lletreja.'],
      ctl: [['Clic / toc', 'tria una paraula; toca-la a dalt per treure-la'], ['Tab · Enter', 'tot es pot fer amb teclat'], ['Escolta', 'pots repetir l’àudio sense penalització']] },
    { id: 'f2', n: 2, icon: 'grid', title: 'Famílies de codis', bloom: 'Comprendre', art: 'assets/img/s3-17.webp',
      goal: 'Entendre per a què serveix cada codi i agrupar-lo en la seva família.',
      todo: ['Surten 12 codis, d’un en un.', 'Tria la família on va cada codi.', 'Si no recordes què vol dir, prem «Significat» (ajuda).'],
      ctl: [['Clic / toc', 'tria la família'], ['1–6', 'dreceres de teclat de les famílies']] },
    { id: 'f3', n: 3, icon: 'image', title: 'Escenes il·lustrades', bloom: 'Aplicar', art: 'assets/img/s3-23.webp',
      goal: 'Reconèixer la situació real i triar el codi que comunicaries a CECOS.',
      todo: ['12 escenes en tres nivells.', 'Nivell 1: amb pista de la família.', 'Nivell 2: sense pista.', 'Nivell 3: només el codi i 20 segons per escena.'],
      ctl: [['Clic / toc', 'tria una opció'], ['1–4', 'dreceres de teclat']] },
    { id: 'f4', n: 4, icon: 'route', title: 'La línia del servei', bloom: 'Analitzar', art: 'assets/img/s3-35.webp',
      goal: 'Ordenar els codis tal com es comuniquen durant un servei, de l’inici al final.',
      todo: ['3 serveis complets.', 'Arrossega les targetes o fes servir les fletxes.', 'Tens dos intents per servei.'],
      ctl: [['Arrossegar', 'mou la targeta amb el dit o el ratolí'], ['Fletxes ▲ ▼', 'mou la targeta una posició']] },
    { id: 'f5', n: 5, icon: 'ear', title: 'Descodifica', bloom: 'Interpretar', art: 'assets/img/hero.webp',
      goal: 'Traduir un missatge de ràdio en codi a llenguatge planer.',
      todo: ['6 missatges dels guions de classe.', 'Escolta (o llegeix) el missatge i tria què vol dir.'],
      ctl: [['Escolta', 'reprodueix el missatge amb so de ràdio'], ['1–3', 'dreceres de teclat']] },
    { id: 'f6', n: 6, icon: 'radio', title: 'Simulador de ràdio', bloom: 'Transferir', art: 'assets/img/cabina.webp',
      goal: 'Mantenir una comunicació completa amb CECOS seguint el protocol i els codis.',
      todo: ['4 situacions: inici de guàrdia, assignació de servei, trasllat i final del servei.', 'Tria què dius i mantén premut el PTT mentre «parles».', 'Si prems el PTT mentre parla CECOS, trepitges la comunicació (3.13).'],
      ctl: [['PTT', 'mantén premut el botó (o la barra espaiadora) i deixa’l anar per enviar'], ['Clic / toc', 'tria el missatge abans de prémer el PTT']] },
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
  const fmt = n => (Math.round(n * 10) / 10).toLocaleString('ca-ES');
  const toast = (msg) => { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2600); };
  async function sha256(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }

  /* ---------- estat ---------- */
  let S = load();
  function load() { try { return JSON.parse(localStorage.getItem(STORE)) || null; } catch { return null; } }
  function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch { } }
  function fresh(email, name) {
    return { v: 1, email, name, started: Date.now(), phases: {}, mistakes: [], helps: 0 };
  }
  const total = () => Object.values(S.phases).reduce((a, p) => a + (p.score || 0), 0);
  const doneCount = () => PHASES.filter(p => S.phases[p.id] && S.phases[p.id].done).length;
  const nextPhase = () => PHASES.find(p => !(S.phases[p.id] && S.phases[p.id].done));
  const grade = () => Math.max(1, Math.round(total() / 100 * 10) / 10);
  function itemScore(value, errors, helps) { return Math.max(0, value * (1 - 0.5 * errors - 0.3 * helps)); }
  function slip(text) { S.errs = (S.errs || 0) + 1; (String(text || '').match(/3\.\d+(?: [A-Z]{1,2}(?:\/PL)?)?/g) || []).forEach(c => { if (D.byCode[c]) (S.slips = S.slips || []).push(c); }); }
  function mistake(phase, expected, given, note) { S.mistakes.push({ phase, expected, given, note: note || '' }); }

  /* ---------- capçalera ---------- */
  function header(active) {
    $('#top').hidden = !S;
    if (!S) return;
    $('#steps').innerHTML = PHASES.map(p => {
      const st = S.phases[p.id] || {}; const cls = st.done ? 'done' : (active === p.id ? 'on' : '');
      return `<li class="${cls}" title="${esc(p.title)}">${st.done ? ic('check') : ''}F${p.n}</li>`;
    }).join('');
    $('#score').innerHTML = `${Math.round(total())}<small>de 1000</small>`;
  }

  /* ---------- àudio amb efecte de ràdio ---------- */
  let AC = null, current = null;
  const bufCache = {};
  function ctx() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; }
  async function getBuf(id) {
    if (bufCache[id]) return bufCache[id];
    const r = await fetch(`assets/audio/${id}.mp3`); const ab = await r.arrayBuffer();
    return (bufCache[id] = await ctx().decodeAudioData(ab));
  }
  function beep(ac, t, f = 1750, d = .12, g = .06) {
    const o = ac.createOscillator(), v = ac.createGain(); o.frequency.value = f; v.gain.value = g;
    o.connect(v).connect(ac.destination); o.start(t); o.stop(t + d);
  }
  function noise(ac, t, d, g = .025) {
    const b = ac.createBuffer(1, Math.ceil(ac.sampleRate * d), ac.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1);
    const s = ac.createBufferSource(), bp = ac.createBiquadFilter(), v = ac.createGain();
    bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = .6; v.gain.value = g;
    s.buffer = b; s.connect(bp).connect(v).connect(ac.destination); s.start(t); return s;
  }
  let VOL = 0.9;
  async function playRadio(id, onState) {
    stopAudio();
    const ac = ctx(); let buf;
    try { buf = await getBuf(id); } catch { toast('No s’ha pogut carregar l’àudio. Llegeix el text.'); return; }
    const t0 = ac.currentTime + .05;
    beep(ac, t0, 1750, .1);
    const src = ac.createBufferSource(); src.buffer = buf;
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 320;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3300;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -24; comp.ratio.value = 8;
    const sh = ac.createWaveShaper(); const k = 2.2, n = 1024, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = i * 2 / n - 1; curve[i] = (1 + k) * x / (1 + k * Math.abs(x)); } sh.curve = curve;
    const g = ac.createGain(); g.gain.value = VOL * 0.85;
    src.connect(hp).connect(lp).connect(comp).connect(sh).connect(g).connect(ac.destination);
    const nz = noise(ac, t0 + .1, buf.duration + .25, .018 * VOL);
    src.start(t0 + .14);
    const end = t0 + .14 + buf.duration;
    noise(ac, end, .18, .06 * VOL); beep(ac, end + .02, 1200, .06, .03);
    onState && onState(true);
    current = { src, nz };
    return new Promise(res => { src.onended = () => { if (current && current.src === src) current = null; onState && onState(false); res(); }; });
  }
  function stopAudio() { if (current) { try { current.src.onended = null; current.src.stop(); current.nz.stop(); } catch { } current = null; } }

  /* ---------- navegació ---------- */
  function go(screen, arg) {
    stopAudio(); clearInterval(timerId);
    window.scrollTo({ top: 0 });
    if (!S && screen !== 'login') screen = 'login';
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
          <p>Aprèn els codis de transmissió del SEM i l’alfabet INTERCO, i parla amb CECOS com ho faràs a l’ambulància.</p></div>
        </div>
        <form class="login-form" id="lf" novalidate>
          <div><h2>Inici de guàrdia</h2><p class="muted">MP0060 Teleemergències · TES 1AA</p></div>
          <label class="field">Nom i cognoms<input name="name" autocomplete="name" required></label>
          <label class="field">Correu de l’institut<input name="email" type="email" autocomplete="email" inputmode="email" placeholder="nom@isvh.cat" required></label>
          <label class="field">Contrasenya de l’aula<input name="pass" type="password" autocomplete="current-password" required><span class="help">Te la dona el professorat a classe.</span></label>
          <p class="err" id="lerr" role="alert"></p>
          <button class="btn amber" type="submit">${ic('radio')} Comença la guàrdia</button>
          <p class="meta-line">El progrés es desa en aquest navegador. Font dels codis: CODI 3 MODIFICAT (SEM, v1, 23/09/2021).</p>
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
    const nx = nextPhase(), done = doneCount();
    const initials = S.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
    
    app.innerHTML = `
      <div class="dash">
        <aside class="panel user-card" aria-label="Panell de l'alumne">
          <div class="who"><span class="avatar">${esc(initials)}</span><div><b>${esc(S.name)}</b><div class="muted" style="font-size:.9rem">${esc(S.email)}</div></div></div>
          <div class="meter" aria-hidden="true"><i style="width:${done / 6 * 100}%"></i></div>
          <dl class="kv">
            <dt>Fases completades</dt><dd>${done}/6</dd>
            <dt>Punts</dt><dd>${Math.round(total())}/1000</dd>
            <dt>Nota provisional</dt><dd>${done ? fmt(grade()) : '—'}</dd>
            <dt>Respostes errònies</dt><dd>${S.errs || 0}</dd>
            <dt>Ajudes</dt><dd>${S.helps}</dd>
          </dl>
          <div class="actions">
            ${done === 6 ? `<button class="btn amber" data-go="results">${ic('file')} Resultats i informe</button>` : ''}
            <button class="btn ghost small" id="b-ref2">${ic('book')} Consulta els codis</button>
            <button class="btn ghost small" id="b-out">${ic('exit')} Surt</button>
          </div>
        </aside>
        <section>
          <div class="dash-head"><div><h1>${done === 6 ? 'Guàrdia completada' : done ? 'Continua la guàrdia' : 'Bon dia i bona guàrdia'}</h1>
          <p class="muted" style="margin-top:.35rem">Sis fases, de recordar els codis a fer-los servir per ràdio. Cada fase s’obre quan acabes l’anterior.</p></div></div>
          <ol class="route panel" style="padding:.5rem 1.25rem">
            ${PHASES.map(p => {
              const st = S.phases[p.id] || {}; const isNext = nx && nx.id === p.id;
              const cls = st.done ? 'done' : isNext ? 'next' : 'locked';
              return `<li class="${cls}">
                <span class="dot">${st.done ? ic('check') : isNext ? ic(p.icon) : ic('lock')}</span>
                <div><div class="t">F${p.n} · ${esc(p.title)} <span class="bloom">${p.bloom}</span></div><div class="d">${esc(p.goal)}</div></div>
                <div class="pts">${st.done ? `${Math.round(st.score)}/${D.POINTS[p.id]}` : `${D.POINTS[p.id]} pts`}
                ${isNext ? `<div style="margin-top:.4rem"><button class="btn small amber" data-intro="${p.id}">Comença ${ic('arrow')}</button></div>` : ''}</div>
              </li>`;
            }).join('')}
          </ol>
        </section>
      </div>`;
    $$('[data-intro]').forEach(b => b.onclick = () => go('intro', b.dataset.intro));
    $$('[data-go=results]').forEach(b => b.onclick = () => go('results'));
    $('#b-ref2').onclick = openRef;
    $('#b-out').onclick = () => { S = null; header(); go('login'); };
  }

  /* ========== INTRO DE FASE ========== */
  function intro(pid) {
    const p = PHASES.find(x => x.id === pid); header(pid);
    app.innerHTML = `
      <section class="panel intro">
        <div class="intro-art"><video class="capsule" src="assets/video/capsula-${p.id}.mp4" poster="${p.art}" controls muted playsinline preload="metadata" aria-label="Càpsula d’instruccions de la fase ${p.n} (sense so; el mateix contingut és a la dreta)"></video></div>
        <div class="intro-body">
          <div class="row"><span class="phase-tag">${ic(p.icon)} Fase ${p.n} de 6</span><span class="bloom">${p.bloom}</span></div>
          <h1>${esc(p.title)}</h1>
          <p class="prompt"><b>Objectiu:</b> ${esc(p.goal)}</p>
          <div><h3 style="margin-bottom:.4rem">Què faràs</h3><ul class="steps-list">${p.todo.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
          <div class="controls">${p.ctl.map(([k, v]) => `<kbd>${esc(k)}</kbd><span>${esc(v)}</span>`).join('')}</div>
          <p class="muted"><b>${D.POINTS[p.id]} punts.</b> Cada error resta la meitat de l’element; cada ajuda en resta un 30 %. Al segon error es mostra la resposta correcta.</p>
          <div class="actions"><button class="btn amber" id="go">${ic('play')} Comença la fase</button><button class="btn ghost" id="back">Torna al tauler</button></div>
        </div>
      </section>`;
    $('#go').onclick = () => go('phase', pid);
    $('#back').onclick = () => go('dash');
  }

  /* ========== MOTOR COMÚ ========== */
  let timerId = null;
  function runPhase(pid) {
    header(pid);
    ({ f1: F1, f2: F2, f3: F3, f4: F4, f5: F5, f6: F6 })[pid]();
  }
  function frame(p, i, n, marks, body) {
    return `<div class="play-head"><div class="row"><span class="phase-tag">${ic(p.icon)} F${p.n} · ${esc(p.title)}</span></div>
      <span class="count">${i + 1} / ${n}</span></div>
      <div class="prog" aria-hidden="true">${Array.from({ length: n }, (_, k) => `<i class="${marks[k] || (k === i ? 'cur' : '')}"></i>`).join('')}</div>
      <section class="panel stage">${body}</section>`;
  }
  function finishPhase(pid, score, extra) {
    S.phases[pid] = Object.assign({ done: true, score: Math.round(score * 10) / 10, at: Date.now() }, extra || {});
    save(); header();
    const p = PHASES.find(x => x.id === pid), max = D.POINTS[pid];
    const nx = nextPhase();
    app.innerHTML = `<section class="panel stage" style="text-align:center;padding:3rem 1.5rem">
      <span class="phase-tag" style="justify-content:center">${ic('check')} Fase ${p.n} completada</span>
      <h1 style="margin:.5rem 0">${Math.round(score)} <span class="muted" style="font-size:.5em">/ ${max} punts</span></h1>
      <p class="muted">${score >= max * .85 ? 'Comunicació impecable. CECOS t’ha entès a la primera.' : score >= max * .6 ? 'Bona feina. Repassa els codis que t’han costat abans de continuar.' : 'Cal repassar: consulta els codis i fixa’t en les explicacions.'}</p>
      <div class="actions" style="justify-content:center">
        ${nx ? `<button class="btn amber" id="nx">Següent: ${esc(nx.title)} ${ic('arrow')}</button>` : `<button class="btn amber" id="res">${ic('file')} Resultats i informe</button>`}
        <button class="btn ghost" id="bk">Torna al tauler</button></div></section>`;
    if (nx) $('#nx').onclick = () => go('intro', nx.id); else $('#res').onclick = () => go('results');
    $('#bk').onclick = () => go('dash');
  }
  function fb(kind, html) { return `<div class="feedback ${kind}" role="status">${ic(kind === 'ok' ? 'check' : kind === 'ko' ? 'x' : 'help')}<div>${html}</div></div>`; }

  /* ========== F1 · INTERCO ========== */
  function F1() {
    const p = PHASES[0];
    const strip = s => s.normalize('NFD').replace(/[̀-́]/g, '').normalize('NFC');
    const items = shuffle(D.SPELL).slice(0, 3).map(x => ({ t: 'spell', ...x })).concat(shuffle(D.LISTEN).slice(0, 3).map(x => ({ t: 'listen', ...x })));
    const val = D.POINTS.f1 / items.length; let i = 0, score = 0; const marks = [];
    const IC = Object.fromEntries(D.INTERCO.map(x => [x.l, x]));
    function show() {
      if (i >= items.length) return finishPhase('f1', score);
      const it = items[i]; let errors = 0, helps = 0;
      if (it.t === 'spell') {
        const word = strip(it.word).toUpperCase();
        const letters = [...word];
        const need = letters.filter(c => IC[c]).map(c => IC[c].w);
        const pool = shuffle([...new Set(need.concat(shuffle(D.INTERCO.map(x => x.w).filter(w => !need.includes(w))).slice(0, 4)))]);
        let picked = [];
        const render = (msg) => {
          let k = 0;
          app.innerHTML = frame(p, i, items.length, marks, `
            <p class="muted">${esc(it.ctx)}</p>
            <h2 style="margin:.3rem 0 .2rem">Lletreja per ràdio: <span class="big-word" style="font-size:1em">${esc(it.word)}</span></h2>
            <p class="prompt">Toca les paraules INTERCO en l’ordre correcte. Els números es diuen tal qual.</p>
            <div class="slots" aria-label="La teva resposta">${letters.map(c => {
              if (!IC[c]) return `<div class="slot fixed"><span class="l">${esc(c)}</span><span class="w">${esc(c)}</span></div>`;
              const w = picked[k]; const idx = k++;
              return w ? `<div class="slot filled"><button type="button" data-rm="${idx}" aria-label="Treu ${esc(w)}"><span class="l">${esc(c)}</span><span class="w">${esc(w)}</span></button></div>`
                : `<div class="slot"><span class="l">${esc(c)}</span><span class="w muted">···</span></div>`;
            }).join('')}</div>
            <div class="chips" role="group" aria-label="Paraules INTERCO">${pool.map(w => `<button class="chip" type="button" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>
            ${msg || ''}
            <div class="actions"><button class="btn" id="ok" ${picked.length < need.length ? 'disabled' : ''}>${ic('check')} Comprova</button>
            <button class="btn ghost small" id="hp">${ic('help')} Mostra la primera lletra</button><span class="help-cost">−30 %</span></div>`);
          $$('[data-w]').forEach(b => b.onclick = () => { if (picked.length < need.length) { picked.push(b.dataset.w); render(); } });
          $$('[data-rm]').forEach(b => b.onclick = () => { picked.splice(+b.dataset.rm, 1); render(); });
          $('#hp').onclick = () => { helps++; S.helps++; picked = [need[0]]; render(fb('info', `Comença per <b>${esc(need[0])}</b>.`)); };
          $('#ok').onclick = () => {
            const right = picked.every((w, k) => w === need[k]);
            if (right) { const s = itemScore(val, errors, helps); score += s; marks[i] = 'ok'; render(fb('ok', `Correcte: ${need.join(' · ')}.`) ); return nextBtn(); }
            errors++; slip();
            if (errors >= 2) { marks[i] = 'ko'; mistake('F1', need.join(' '), picked.join(' '), 'INTERCO ' + it.word); render(fb('ko', `La resposta era: <b>${need.join(' · ')}</b>.`)); return nextBtn(); }
            picked = []; render(fb('ko', 'No és correcte. Torna-ho a provar (et queda un intent).'));
          };
        };
        render();
      } else {
        const render = (msg, lock) => {
          app.innerHTML = frame(p, i, items.length, marks, `
            <h2>Escolta i escriu</h2>
            <p class="prompt">CECOS et lletreja una paraula. Escriu-la en lletres i números (sense espais).</p>
            <div class="msg" style="margin-top:1rem"><button class="play" id="pl" aria-label="Escolta el missatge">${ic('play')}</button><div class="txt" id="tr">${lock ? esc(it.say) : 'Prem el botó per escoltar.'}</div></div>
            <div class="row" style="margin-top:1.1rem"><label class="sr" for="ans">Resposta</label><input id="ans" class="text-in" autocomplete="off" spellcheck="false" ${lock ? 'disabled' : ''}>
            <button class="btn" id="ok" ${lock ? 'disabled' : ''}>${ic('check')} Comprova</button></div>
            ${msg || ''}
            <div class="actions"><button class="btn ghost small" id="hp" ${lock ? 'disabled' : ''}>${ic('help')} Mostra el text</button><span class="help-cost">−30 %</span></div>`);
          $('#pl').onclick = () => playRadio(it.id, on => $('#pl') && $('#pl').classList.toggle('on', on));
          $('#hp').onclick = () => { helps++; S.helps++; $('#tr').textContent = it.say; $('#hp').disabled = true; };
          const check = () => {
            const a = $('#ans').value.toUpperCase().replace(/\s|-/g, '');
            if (!a) return;
            if (a === it.answer) { score += itemScore(val, errors, helps); marks[i] = 'ok'; render(fb('ok', `Correcte: <b>${it.answer}</b>.`), true); return nextBtn(); }
            errors++; slip();
            if (errors >= 2) { marks[i] = 'ko'; mistake('F1', it.answer, a, 'INTERCO escolta'); render(fb('ko', `Era <b>${it.answer}</b>.`), true); return nextBtn(); }
            render(fb('ko', 'No és correcte. Escolta-ho un altre cop.'));
          };
          $('#ok').onclick = check; $('#ans') && $('#ans').addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
          if (!lock) $('#ans').focus();
        };
        render();
      }
    }
    function nextBtn() {
      const a = $('.actions'); a.innerHTML = `<button class="btn amber" id="nx">Continua ${ic('arrow')}</button>`; $('#nx').focus();
      $('#nx').onclick = () => { i++; show(); };
    }
    show();
  }

  /* ========== F2 · FAMÍLIES ========== */
  function F2() {
    const p = PHASES[1];
    const fams = Object.entries(D.FAMILIES);
    // 2 codis per família per garantir varietat
    const byFam = {}; D.CLASSIFY_POOL.forEach(c => { const f = D.byCode[c].fam; (byFam[f] = byFam[f] || []).push(c); });
    const items = shuffle(fams.flatMap(([f]) => shuffle(byFam[f] || []).slice(0, 2)));
    const val = D.POINTS.f2 / items.length; let i = 0, score = 0; const marks = [];
    const placed = {};
    function show(msg, lock) {
      if (i >= items.length) return finishPhase('f2', score);
      const c = items[i]; const st = show.st || (show.st = { errors: 0, helps: 0, shown: false });
      app.innerHTML = frame(p, i, items.length, marks, `
        <div class="row" style="justify-content:space-between">
          <div><p class="muted">On va aquest codi?</p>
          <div class="code-card ${isPrio(c) ? 'prio' : ''}" style="margin-top:.4rem"><span class="code" style="font-size:2rem">${esc(c)}</span>${st.shown || lock ? `<small>${esc(legend(c))}</small>` : ''}</div></div>
          <div class="row"><button class="btn ghost small" id="hp" ${st.shown || lock ? 'disabled' : ''}>${ic('help')} Significat</button><span class="help-cost">−30 %</span></div>
        </div>
        <div class="bins" role="group" aria-label="Famílies">${fams.map(([k, f], n) => `
          <button class="bin" type="button" data-f="${k}" ${lock ? 'disabled' : ''}>
            <span class="bh">${ic(f.icon)} <span><kbd>${n + 1}</kbd> ${esc(f.name)}</span></span>
            <span class="bq">${esc(f.hint)}</span>
            <span class="placed">${(placed[k] || []).map(x => `<span class="tag ${x.ok ? 'ok' : 'ko'}">${esc(x.c)}</span>`).join('')}</span>
          </button>`).join('')}</div>
        ${msg || ''}<div class="actions"></div>`);
      if (!lock) {
        $('#hp').onclick = () => { st.helps++; S.helps++; st.shown = true; show(); };
        $$('.bin').forEach(b => b.onclick = () => pick(b.dataset.f));
      } else nextBtn();
    }
    function pick(f) {
      const c = items[i], st = show.st, right = D.byCode[c].fam;
      if (f === right) {
        score += itemScore(val, st.errors, st.helps); marks[i] = st.errors ? 'ko' : 'ok';
        (placed[f] = placed[f] || []).push({ c, ok: true });
        return show(fb('ok', `<b>${esc(c)}</b> · ${esc(legend(c))} → ${esc(D.FAMILIES[f].name)}.`), true);
      }
      st.errors++; slip(c);
      if (st.errors >= 2) {
        marks[i] = 'ko'; (placed[right] = placed[right] || []).push({ c, ok: false });
        mistake('F2', c, D.FAMILIES[f].name, 'família: ' + D.FAMILIES[right].name);
        return show(fb('ko', `<b>${esc(c)}</b> vol dir «${esc(legend(c))}». Va a <b>${esc(D.FAMILIES[right].name)}</b>.`), true);
      }
      show(fb('ko', `No és «${esc(D.FAMILIES[f].name)}». Pensa què vol dir el codi.`));
    }
    function nextBtn() { const a = $('.actions'); a.innerHTML = `<button class="btn amber" id="nx">Continua ${ic('arrow')}</button>`; $('#nx').focus(); $('#nx').onclick = () => { i++; show.st = null; show(); }; }
    keys = e => { if (/^[1-6]$/.test(e.key) && !$('.bin[disabled]') && $('.bin')) pick(fams[+e.key - 1][0]); };
    show();
  }

  /* ========== F3 · ESCENES ========== */
  function F3() {
    const p = PHASES[2];
    const pickLvl = (l, n) => shuffle(D.SCENES.filter(s => s.lvl === l)).slice(0, n);
    const items = [...pickLvl(1, 4), ...pickLvl(2, 4), ...pickLvl(3, 4)];
    const levels = [1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3];
    const val = D.POINTS.f3 / items.length; let i = 0, score = 0; const marks = [];
    function show() {
      if (i >= items.length) return finishPhase('f3', score);
      const s = items[i], lvl = levels[i]; let errors = 0, done = false;
      const opts = shuffle([s.code, ...s.opts]);
      const fam = D.FAMILIES[D.byCode[s.code].fam];
      let left = 20;
      app.innerHTML = frame(p, i, items.length, marks, `
        <div class="scene">
          <figure><img src="assets/img/${s.id}.webp" alt="${esc(s.desc)}" width="1600" height="900">
            <span class="lvl">Nivell ${lvl}${lvl === 3 ? ' · contrarellotge' : ''}</span>
            ${lvl === 3 ? `<span class="timer" id="tm">${ic('clock')}<span id="tl">20</span> s</span>` : ''}</figure>
          <div>
            <p class="desc">${esc(s.desc)}</p>
            ${lvl === 1 ? `<p class="hint" style="margin-top:.7rem">${ic(fam.icon)} Pista: família «${esc(fam.name)}»</p>` : ''}
            <p class="muted" style="margin-top:.8rem">Quin codi comunicaries a CECOS?</p>
            <div class="opts" role="group" aria-label="Opcions">${opts.map((c, k) => `
              <button class="opt" type="button" data-c="${esc(c)}"><span class="k">${k + 1}</span><span class="code ${isPrio(c) ? 'prio' : ''}">${esc(c)}</span>${lvl < 3 ? `<small>${esc(legend(c))}</small>` : '<small></small>'}</button>`).join('')}</div>
            <div id="fbk"></div><div class="actions"></div>
          </div>
        </div>`);
      const lock = () => { done = true; clearInterval(timerId); $$('.opt').forEach(b => b.disabled = true); $$('.opt').forEach(b => { if (b.dataset.c === s.code) b.classList.add('ok'); }); };
      const answer = (c, btn) => {
        if (done) return;
        if (c === s.code) { score += itemScore(val, errors, 0); marks[i] = errors ? 'ko' : 'ok'; lock(); $('#fbk').innerHTML = fb('ok', `<b>${esc(s.code)}</b> · ${esc(legend(s.code))}.`); return nextBtn(); }
        errors++; slip(s.code); btn && btn.classList.add('ko'); btn && (btn.disabled = true);
        if (errors >= 2 || c === null) {
          marks[i] = 'ko'; lock(); mistake('F3', s.code, c || 'temps esgotat', s.desc.slice(0, 60));
          $('#fbk').innerHTML = fb('ko', `${c === null ? 'S’ha acabat el temps. ' : ''}El codi correcte és <b>${esc(s.code)}</b> · ${esc(legend(s.code))}.${c ? ` <br><span class="muted">${esc(c)} vol dir: ${esc(legend(c))}.</span>` : ''}`);
          return nextBtn();
        }
        $('#fbk').innerHTML = fb('ko', `<b>${esc(c)}</b> és «${esc(legend(c))}». Torna-ho a provar.`);
      };
      $$('.opt').forEach(b => b.onclick = () => answer(b.dataset.c, b));
      keys = e => { if (/^[1-4]$/.test(e.key)) { const b = $$('.opt')[+e.key - 1]; if (b && !b.disabled) answer(b.dataset.c, b); } };
      if (lvl === 3) {
        timerId = setInterval(() => {
          left--; const tl = $('#tl'); if (!tl) return clearInterval(timerId);
          tl.textContent = left; if (left <= 5) $('#tm').classList.add('low');
          if (left <= 0) { clearInterval(timerId); answer(null, null); }
        }, 1000);
      }
    }
    function nextBtn() { const a = $('.actions'); a.innerHTML = `<button class="btn amber" id="nx">Continua ${ic('arrow')}</button>`; $('#nx').focus(); $('#nx').onclick = () => { i++; show(); }; }
    show();
  }

  /* ========== F4 · LÍNIA DEL SERVEI ========== */
  function F4() {
    const p = PHASES[3];
    const items = D.SEQUENCES; const val = D.POINTS.f4 / items.length; let i = 0, score = 0; const marks = [];
    function show() {
      if (i >= items.length) return finishPhase('f4', score);
      const q = items[i]; let order = shuffle(q.steps); while (order.join() === q.steps.join()) order = shuffle(q.steps);
      let tries = 0, done = false;
      const render = (msg, res) => {
        app.innerHTML = frame(p, i, items.length, marks, `
          <h2>${esc(q.title)}</h2>
          <p class="prompt" style="margin-top:.3rem">Ordena els codis tal com es comuniquen, del primer (dalt) a l’últim (baix).</p>
          <ol class="seq" id="seq">${order.map((c, k) => `
            <li data-c="${esc(c)}" class="${res ? (res[k] ? 'ok' : 'ko') : ''}"><span class="code grip ${isPrio(c) ? 'prio' : ''}">${esc(c)}</span><span class="tx">${esc(legend(c))}</span>
            ${done ? '' : `<span class="mv"><button type="button" data-up="${k}" aria-label="Puja ${esc(c)}" ${k === 0 ? 'disabled' : ''}>${ic('up')}</button><button type="button" data-dn="${k}" aria-label="Baixa ${esc(c)}" ${k === order.length - 1 ? 'disabled' : ''}>${ic('down')}</button></span>`}</li>`).join('')}</ol>
          ${msg || ''}
          <div class="actions">${done ? '' : `<button class="btn" id="ok">${ic('check')} Comprova</button><span class="help-cost">Intent ${tries + 1} de 2</span>`}</div>`);
        if (done) return nextBtn();
        $$('[data-up]').forEach(b => b.onclick = () => { const k = +b.dataset.up; [order[k - 1], order[k]] = [order[k], order[k - 1]]; render(); $(`[data-up="${k - 1}"]`)?.focus() || $(`[data-dn="${k - 1}"]`)?.focus(); });
        $$('[data-dn]').forEach(b => b.onclick = () => { const k = +b.dataset.dn; [order[k + 1], order[k]] = [order[k], order[k + 1]]; render(); $(`[data-dn="${k + 1}"]`)?.focus() || $(`[data-up="${k + 1}"]`)?.focus(); });
        dragSort($('#seq'), (from, to) => { const [x] = order.splice(from, 1); order.splice(to, 0, x); render(); });
        $('#ok').onclick = () => {
          const res = order.map((c, k) => c === q.steps[k]);
          const nOk = res.filter(Boolean).length;
          if (nOk === order.length) { score += itemScore(val, tries, 0); marks[i] = tries ? 'ko' : 'ok'; done = true; return render(fb('ok', 'Seqüència correcta. Així és com avança un servei.'), res); }
          tries++; slip(order.filter((c, k) => c !== q.steps[k]).join(' '));
          if (tries >= 2) {
            score += itemScore(val, 1, 0) * (nOk / order.length); marks[i] = 'ko'; done = true;
            const wrong = order.filter((c, k) => c !== q.steps[k]);
            mistake('F4', wrong.join(' '), order.join(' > '), q.title + ' (ordre)');
            order = q.steps.slice();
            return render(fb('ko', `L’ordre correcte és: <b>${q.steps.join(' → ')}</b>. Recorda: 3.3 operatiu → 3.35 mobilització → 3.4 arribada → trasllat → 3.6 final.`), q.steps.map(() => true));
          }
          render(fb('ko', `${nOk} de ${order.length} en el lloc correcte (en verd). Mou les vermelles i torna-ho a provar.`), res);
        };
      };
      render();
    }
    function nextBtn() { const a = $('.actions'); a.innerHTML = `<button class="btn amber" id="nx">Continua ${ic('arrow')}</button>`; $('#nx').focus(); $('#nx').onclick = () => { i++; show(); }; }
    show();
  }
  function dragSort(list, onMove) {
    let el = null, from = -1, startY = 0, h = 0;
    $$('li', list).forEach((li, k) => {
      li.addEventListener('pointerdown', e => {
        if (e.target.closest('button')) return;
        el = li; from = k; startY = e.clientY; h = li.offsetHeight + 8; li.setPointerCapture(e.pointerId); li.classList.add('drag');
      });
      li.addEventListener('pointermove', e => { if (el === li) li.style.transform = `translateY(${e.clientY - startY}px)`; });
      li.addEventListener('pointerup', e => {
        if (el !== li) return; const d = Math.round((e.clientY - startY) / h); el = null;
        li.classList.remove('drag'); li.style.transform = '';
        const to = Math.max(0, Math.min(list.children.length - 1, from + d)); if (to !== from) onMove(from, to);
      });
    });
  }

  /* ========== F5 · DESCODIFICA ========== */
  function F5() {
    const p = PHASES[4];
    const items = shuffle(D.DECODE); const val = D.POINTS.f5 / items.length; let i = 0, score = 0; const marks = [];
    function show() {
      if (i >= items.length) return finishPhase('f5', score);
      const d = items[i]; let errors = 0, done = false; const opts = shuffle([d.ok, ...d.bad]);
      app.innerHTML = frame(p, i, items.length, marks, `
        <h2>Què vol dir aquest missatge?</h2>
        <div class="msg" style="margin-top:1rem"><button class="play" id="pl" aria-label="Escolta el missatge">${ic('play')}</button><div class="txt">«${esc(d.msg)}»</div></div>
        <p class="muted" style="margin-top:.6rem">${ic('radio')} ${esc(d.who)}</p>
        <div class="opts" role="group" aria-label="Traduccions">${opts.map((o, k) => `<button class="opt" type="button" data-o="${k}"><span class="k">${k + 1}</span><span></span><small style="color:var(--ink);font-size:1.02rem">${esc(o)}</small></button>`).join('')}</div>
        <div id="fbk"></div><div class="actions"></div>`);
      $('#pl').onclick = () => playRadio(d.id, on => $('#pl') && $('#pl').classList.toggle('on', on));
      const answer = (k, b) => {
        if (done) return; const o = opts[k];
        if (o === d.ok) { score += itemScore(val, errors, 0); marks[i] = errors ? 'ko' : 'ok'; done = true; b.classList.add('ok'); $$('.opt').forEach(x => x.disabled = true);
          $('#fbk').innerHTML = fb('ok', `Correcte. <span class="muted">Qui: ${esc(d.who)} · Què: ${esc(d.what)} · On: ${esc(d.where)}</span>`); return nextBtn(); }
        errors++; slip(d.msg); b.classList.add('ko'); b.disabled = true;
        if (errors >= 2) { marks[i] = 'ko'; done = true; mistake('F5', d.msg, o, 'descodificació'); $$('.opt').forEach(x => { x.disabled = true; if (opts[+x.dataset.o] === d.ok) x.classList.add('ok'); });
          $('#fbk').innerHTML = fb('ko', `La traducció correcta està marcada en verd. <span class="muted">Qui: ${esc(d.who)} · Què: ${esc(d.what)} · On: ${esc(d.where)}</span>`); return nextBtn(); }
        $('#fbk').innerHTML = fb('ko', 'No és això. Torna a escoltar i fixa’t en els codis.');
      };
      $$('.opt').forEach(b => b.onclick = () => answer(+b.dataset.o, b));
      keys = e => { if (/^[1-3]$/.test(e.key)) { const b = $$('.opt')[+e.key - 1]; if (b && !b.disabled) answer(+b.dataset.o, b); } };
    }
    function nextBtn() { const a = $('.actions'); a.innerHTML = `<button class="btn amber" id="nx">Continua ${ic('arrow')}</button>`; $('#nx').focus(); $('#nx').onclick = () => { i++; show(); }; }
    show();
  }

  /* ========== F6 · SIMULADOR DE RÀDIO ========== */
  function F6() {
    const p = PHASES[5];
    const scen = D.RADIO; const txTotal = scen.reduce((a, s) => a + s.steps.filter(x => x.type === 'tx').length, 0);
    const val = D.POINTS.f6 / txTotal; let si = 0, score = 0; const marks = [];
    let txIndex = 0;
    function scenario() {
      if (si >= scen.length) return finishPhase('f6', score);
      const sc = scen[si]; let step = 0; let log = [];
      let rxOn = false, txOn = false, sel = null, errors = 0, pttStart = 0, stepped = 0;
      const render = () => {
        app.innerHTML = frame(p, si, scen.length, marks, `
          <div class="radio-wrap">
            <div>
              <h2>${esc(sc.title)}</h2>
              <p class="muted" style="margin:.3rem 0 1rem">Ets la unitat <b>${esc(sc.unit)}</b>. Parles amb CECOS pel canal del SEM.</p>
              <div class="log" id="log" aria-live="polite">${log.map(m => `<div class="bubble ${m.k}${m.bad ? ' ko' : ''}"><b>${m.k === 'rx' ? 'CECOS' : m.k === 'tx' ? esc(sc.unit) : 'Avís'}</b>${esc(m.t)}</div>`).join('') || '<p class="muted">Esperant comunicació…</p>'}</div>
            </div>
            <div class="device" aria-label="Emissora">
              <div class="lcd"><div class="r1"><span>TETRA · SEM</span><span>CH 03</span></div><div class="big">${esc(sc.unit.replace('Bravo ', 'B'))} · ISSI 4807271</div><div class="st" id="lcd-st">${rxOn ? '◀ RX CECOS' : txOn ? '▶ TX' : 'EN ESCOLTA'}</div></div>
              <div class="leds"><span class="led rx ${rxOn ? 'on' : ''}"><i></i>RX</span><span class="led tx ${txOn ? 'on' : ''}"><i></i>TX</span></div>
              <div class="knobs"><label>${ic('sound')} Volum <input type="range" id="vol" min="0" max="1" step=".05" value="${VOL}"></label></div>
              <button class="ptt" id="ptt" type="button" aria-describedby="txt-task">${ic('mic')}<span>PTT<small>mantén premut per parlar</small></span></button>
              <div id="tx-area"></div>
            </div>
          </div>
          <div id="fbk"></div><div class="actions"></div>`);
        $('#vol').oninput = e => VOL = +e.target.value;
        const L = $('#log'); L.scrollTop = L.scrollHeight;
        bindPtt(); drawTx();
      };
      const drawTx = () => {
        const st = sc.steps[step]; const area = $('#tx-area'); if (!area) return;
        if (!st || st.type !== 'tx' || rxOn) { area.innerHTML = rxOn ? '<p class="tx-task">CECOS està parlant… escolta.</p>' : ''; return; }
        if (!st._opts) st._opts = shuffle([st.ok, ...st.bad]);
        area.innerHTML = `<p class="tx-task" id="txt-task">${esc(st.prompt)}</p><div class="tx-opts" role="radiogroup" aria-label="Què dius">${st._opts.map((o, k) => `<button type="button" role="radio" aria-checked="${sel === k}" class="tx-opt ${sel === k ? 'sel' : ''}" data-k="${k}">${esc(o)}</button>`).join('')}</div>`;
        $$('.tx-opt').forEach(b => b.onclick = () => { sel = +b.dataset.k; drawTx(); });
      };
      const push = (k, t, bad) => { log.push({ k, t, bad }); render(); };
      const advance = async () => {
        while (step < sc.steps.length && sc.steps[step].type === 'rx') {
          const st = sc.steps[step];
          rxOn = true; render();
          await new Promise(r => setTimeout(r, 450));
          push('rx', st.text);
          await playRadio(`${sc.id}-${step}`);
          rxOn = false; step++; render();
        }
        if (step >= sc.steps.length) return endScenario();
        sel = null; errors = 0; drawTx();
      };
      const transmit = (held) => {
        const st = sc.steps[step]; if (!st || st.type !== 'tx') return;
        if (sel === null) { $('#fbk').innerHTML = fb('info', 'Primer tria què diràs i després prem el PTT.'); return; }
        if (held < 600) { $('#fbk').innerHTML = fb('ko', 'Missatge tallat: has deixat anar el PTT massa aviat. Mantén-lo premut mentre parles.'); errors += .5; return; }
        const said = st._opts[sel];
        if (said === st.ok) {
          score += itemScore(val, Math.min(errors, 2), 0); marks[si] = marks[si] === 'ko' ? 'ko' : (errors ? 'ko' : 'ok');
          txIndex++; step++; sel = null; push('tx', said); $('#fbk').innerHTML = fb('ok', esc(st.why)); setTimeout(advance, 700); return;
        }
        errors++; slip(st.ok);
        if (errors >= 2) {
          marks[si] = 'ko'; mistake('F6', st.ok, said, sc.title); step++; sel = null; log.push({ k: 'tx', t: said, bad: true });
          push('sys', 'Correcte seria: «' + st.ok + '»'); $('#fbk').innerHTML = fb('ko', esc(st.why)); setTimeout(advance, 1200); return;
        }
        push('tx', said, true); $('#fbk').innerHTML = fb('ko', 'CECOS no ho entén així. Torna-ho a provar: ' + esc(st.why.split('.')[0]) + '.');
      };
      const bindPtt = () => {
        const b = $('#ptt');
        const down = e => {
          e && e.preventDefault(); if (txOn) return;
          if (rxOn) { stepped++; errors += .5; slip('3.13'); mistake('F6', '3.13', 'PTT durant RX', 'ha trepitjat CECOS'); log.push({ k: 'sys', t: '3.13 · Fer ús correcte de l’equip de ràdio: no prenguis el PTT mentre parla CECOS.' }); render(); return; }
          txOn = true; pttStart = performance.now(); b.classList.add('down'); $('.led.tx').classList.add('on'); $('#lcd-st').textContent = '▶ TX';
          beep(ctx(), ctx().currentTime, 900, .05, .03);
        };
        const up = e => {
          if (!txOn) return; txOn = false; const held = performance.now() - pttStart;
          b.classList.remove('down'); const led = $('.led.tx'); led && led.classList.remove('on'); const lcd = $('#lcd-st'); lcd && (lcd.textContent = 'EN ESCOLTA');
          noise(ctx(), ctx().currentTime, .12, .03); transmit(held);
        };
        b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
        b.addEventListener('contextmenu', e => e.preventDefault());
        keys = e => { if (e.code === 'Space' && !e.repeat && e.target.tagName !== 'INPUT') { e.preventDefault(); down(); } };
        keysUp = e => { if (e.code === 'Space') { e.preventDefault(); up(); } };
      };
      const endScenario = () => {
        const a = $('.actions'); if (!a) return;
        $('#fbk').innerHTML = fb('ok', `Comunicació «${esc(sc.title)}» tancada.`);
        a.innerHTML = `<button class="btn amber" id="nx">${si + 1 < scen.length ? 'Següent situació' : 'Acaba la fase'} ${ic('arrow')}</button>`;
        $('#nx').focus(); $('#nx').onclick = () => { si++; scenario(); };
        if (!marks[si]) marks[si] = 'ok';
      };
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
    const seen = new Map();
    (S.slips || []).forEach(c => seen.set(c, (seen.get(c) || 0) + 1));
    return [...seen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([c, n]) => ({ c, n, t: legend(c) }));
  }
  async function results() {
    header(); const code = await verifyCode(); const g = grade(); const rv = reviewList();
    const famErr = {}; (S.slips || []).forEach(c => { const f = D.byCode[c].fam; famErr[f] = (famErr[f] || 0) + 1; });
    const maxFE = Math.max(1, ...Object.values(famErr));
    app.innerHTML = `
      <section class="panel res-top">
        <div class="grade" aria-label="Nota ${fmt(g)} sobre 10"><div><b>${fmt(g)}</b><br><small>sobre 10</small></div></div>
        <div class="stack">
          <h1>Informe de guàrdia</h1>
          <p class="muted">${esc(S.name)} · ${esc(S.email)} · ${new Date(S.finished).toLocaleString('ca-ES')}</p>
          <p><b class="code">${Math.round(total())}</b> / 1000 punts · ${S.errs || 0} respostes errònies · ${S.helps} ajudes</p>
          <p>Codi de verificació: <span class="verify">${code}</span></p>
        </div>
      </section>
      <div class="res-grid">
        <section class="panel"><h3>Punts per fase</h3>
          <div class="bars" role="list">${PHASES.map(p => { const sc = (S.phases[p.id] || {}).score || 0, mx = D.POINTS[p.id], pc = sc / mx * 100;
            return `<div class="bar" role="listitem" tabindex="0"><span>F${p.n} · ${esc(p.title)}</span><span class="track"><span class="fill" style="width:${pc}%;display:block"></span></span><span class="v">${Math.round(sc)}/${mx}</span><span class="tip">${Math.round(pc)} % · ${esc(p.bloom)}</span></div>`; }).join('')}</div>
          <table class="t"><caption class="sr">Taula de punts per fase</caption><thead><tr><th>Fase</th><th class="n">Punts</th><th class="n">Màx.</th></tr></thead>
          <tbody>${PHASES.map(p => `<tr><td>F${p.n} · ${esc(p.title)}</td><td class="n">${Math.round((S.phases[p.id] || {}).score || 0)}</td><td class="n">${D.POINTS[p.id]}</td></tr>`).join('')}</tbody></table>
        </section>
        <section class="panel"><h3>Respostes errònies per família</h3>
          ${Object.keys(famErr).length ? `<div class="bars">${Object.entries(D.FAMILIES).map(([k, f]) => { const n = famErr[k] || 0;
            return `<div class="bar" tabindex="0"><span>${esc(f.name)}</span><span class="track"><span class="fill" style="width:${n / maxFE * 100}%;display:block;background:var(--bad)"></span></span><span class="v">${n}</span><span class="tip">${n} error${n === 1 ? '' : 's'}</span></div>`; }).join('')}</div>` : '<p class="muted" style="margin-top:.8rem">Cap resposta errònia amb codis. Excel·lent.</p>'}
          <h3 style="margin-top:1.4rem">Codis a repassar</h3>
          ${rv.length ? `<div class="review">${rv.map(r => `<div><b class="code">${esc(r.c)}</b><span>${esc(r.t)}</span></div>`).join('')}</div>` : '<p class="muted" style="margin-top:.6rem">No n’hi ha cap.</p>'}
        </section>
      </div>
      <section class="panel stage" style="margin-top:1.5rem">
        <h2>Lliura l’informe a Classroom</h2>
        <ol class="deliver"><li><b>1.</b> Desa l’informe en PDF amb el botó.</li><li><b>2.</b> Obre la tasca «Codi 3 · Parla com el SEM» a Google Classroom i adjunta-hi el PDF.</li><li><b>3.</b> Prem <b>Lliura</b>.</li></ol>
        <div class="actions"><button class="btn amber" id="pdf">${ic('file')} Desa l’informe en PDF</button>
        <a class="btn ghost" href="${CLASSROOM}" target="_blank" rel="noopener">Obre Google Classroom</a>
        <button class="btn ghost" id="bk">Torna al tauler</button>
        <button class="btn ghost small" id="rs">${ic('refresh')} Torna a començar</button></div>
      </section>`;
    $('#pdf').onclick = pdf; $('#bk').onclick = () => go('dash');
    $('#rs').onclick = e => { const b = e.currentTarget; if (!b.dataset.sure) { b.dataset.sure = 1; b.innerHTML = `${ic('refresh')} Prem un altre cop: es perdrà el resultat`; return; } S = fresh(S.email, S.name); save(); go('dash'); };
  }

  function pdf() {
    if (!window.jspdf) return toast('Encara s’està carregant el generador de PDF. Torna-ho a provar.');
    const T = s => String(s).replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/→/g, '>').replace(/[–—]/g, '-').replace(/·/g, '·');
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' }); const W = 210, M = 16; let y = 0;
    doc.setFillColor(15, 27, 45); doc.rect(0, 0, W, 34, 'F');
    doc.setTextColor(245, 166, 35); doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.text('Codi 3 · Parla com el SEM', M, 15);
    doc.setTextColor(233, 238, 246); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
    doc.text(T('MP0060 Teleemergències · CFGM Emergències Sanitàries · TES 1AA · Institut d’FP Sanitària Vall d’Hebron'), M, 23);
    doc.text(T('Informe individual de l’activitat · Font: CODI 3 MODIFICAT (SEM, v1, 23/09/2021)'), M, 28.5);
    y = 46; doc.setTextColor(20, 33, 58);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text(T(S.name), M, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.text(T(`${S.email} · ${new Date(S.finished || Date.now()).toLocaleString('ca-ES')}`), M, y + 6);
    doc.setFillColor(15, 27, 45); doc.circle(W - M - 16, y + 2, 16, 'F'); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.text(fmt(grade()), W - M - 16, y + 5, { align: 'center' }); doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.text('sobre 10', W - M - 16, y + 10, { align: 'center' });
    doc.setTextColor(20, 33, 58); doc.setFontSize(11);
    doc.text(T(`Total: ${Math.round(total())} / 1000 punts · Respostes errònies: ${S.errs || 0} · Ajudes: ${S.helps}`), M, y + 14);
    doc.setFont('courier', 'bold'); doc.text(`Codi de verificació: ${S.verify}`, M, y + 20);
    y += 32; doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Punts per fase', M, y); y += 4;
    PHASES.forEach(p => {
      const sc = (S.phases[p.id] || {}).score || 0, mx = D.POINTS[p.id]; y += 8;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(20, 33, 58);
      doc.text(T(`F${p.n} · ${p.title} (${p.bloom})`), M, y);
      doc.setFillColor(225, 230, 237); doc.rect(M + 78, y - 3.5, 80, 4.5, 'F');
      doc.setFillColor(51, 80, 122); doc.rect(M + 78, y - 3.5, 80 * sc / mx, 4.5, 'F');
      doc.setFont('courier', 'bold'); doc.text(`${Math.round(sc)}/${mx}`, W - M, y, { align: 'right' });
    });
    y += 14; doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Codis a repassar', M, y); y += 2;
    const rv = reviewList(); doc.setFontSize(10);
    if (!rv.length) { y += 7; doc.setFont('helvetica', 'normal'); doc.text('Cap codi pendent.', M, y); }
    rv.forEach(r => { y += 6.5; doc.setFont('courier', 'bold'); doc.text(r.c, M, y); doc.setFont('helvetica', 'normal'); doc.text(T(doc.splitTextToSize(r.t, 150)[0]), M + 22, y); });
    y += 12; doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Elements no resolts (resposta mostrada)', M, y); doc.setFontSize(9);
    const rows = S.mistakes.slice(0, 22);
    if (!rows.length) { y += 7; doc.setFont('helvetica', 'normal'); doc.text('Sense errors.', M, y); }
    rows.forEach(m => {
      if (y > 272) { doc.addPage(); y = 20; }
      y += 6; doc.setFont('helvetica', 'bold'); doc.text(m.phase, M, y); doc.setFont('helvetica', 'normal');
      const line = T(`Correcte: ${m.expected}  ·  Resposta: ${m.given}${m.note ? '  ·  ' + m.note : ''}`);
      doc.text(doc.splitTextToSize(line, W - 2 * M - 12)[0], M + 10, y);
    });
    if (S.mistakes.length > 22) { y += 6; doc.text(`… i ${S.mistakes.length - 22} errors més.`, M + 10, y); }
    const pages = doc.getNumberOfPages();
    for (let k = 1; k <= pages; k++) { doc.setPage(k); doc.setFontSize(8); doc.setTextColor(106, 116, 137);
      doc.text(T('Lliura aquest PDF a la tasca de Google Classroom. La valoració és orientativa i la revisa el professorat.'), M, 290); doc.text(`${k}/${pages}`, W - M, 290, { align: 'right' }); }
    const nm = S.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_');
    doc.save(`Informe_Codi3_${nm}.pdf`); toast('PDF desat. Adjunta’l a la tasca de Classroom.');
  }

  /* ========== CONSULTA DE CODIS ========== */
  function openRef() {
    const dlg = $('#ref');
    dlg.innerHTML = `<div class="ref-head"><h2 id="ref-title" style="font-size:1.5rem">Codi 3 i INTERCO</h2>
      <label class="ref-search">${ic('search')}<span class="sr">Cerca</span><input id="rq" placeholder="Cerca un codi o una paraula"></label>
      <button class="icon-btn" id="rc" aria-label="Tanca">${ic('x')}</button></div>
      <div class="ref-body"><div><p class="muted" style="margin-bottom:.6rem">En vermell, els codis prioritaris o de risc.</p><div class="ref-list" id="rl"></div></div>
      <div><h3 style="margin-bottom:.6rem">Alfabet INTERCO</h3><div class="ic-grid">${D.INTERCO.map(x => `<div><b>${x.l}</b>${esc(x.w)}</div>`).join('')}</div></div></div>`;
    const list = q => { q = (q || '').toLowerCase(); $('#rl').innerHTML = D.CODES.filter(c => !q || (c.code + ' ' + c.text).toLowerCase().includes(q)).map(c => `<div><b class="code ${c.prio ? 'prio' : ''}">${esc(c.code)}</b><span>${esc(c.text)}</span></div>`).join('') || '<p class="muted">Cap resultat.</p>'; };
    list(); $('#rq').oninput = e => list(e.target.value); $('#rc').onclick = () => dlg.close();
    dlg.showModal();
  }
  $('#btn-ref').onclick = () => {
    const inPhase = $('.stage') && !$('.res-top') && $('.prog');
    if (inPhase) return toast('Durant les fases fes servir els botons d’ajuda. La consulta s’obre des del tauler.');
    openRef();
  };

  /* ---------- teclat global ---------- */
  let keys = null, keysUp = null;
  document.addEventListener('keydown', e => { if ($('#ref').open) return; keys && keys(e); });
  document.addEventListener('keyup', e => { keysUp && keysUp(e); });
  const _go = go; go = function (s, a) { keys = null; keysUp = null; _go(s, a); };
  $('.brand').addEventListener('click', e => { e.preventDefault(); if (S) go('dash'); });

  go(S ? 'dash' : 'login');
})();
