# Codi 3 v2 · Redisseny i fases amb veu (especificació)

Peticions del docent (15/11/2026) i com es resolen. Flux: especificació → pla → implementació → verificació amb `tests/e2e.py` abans de publicar.

| Petició | Solució | Verificació |
|---|---|---|
| Aspecte modern d'aplicació educativa professional | Nou sistema visual (`DESIGN.md`): Plus Jakarta Sans, blau interactiu, groc SEM, targetes amb imatge, anell de progrés | Captures a 1366 px i 390 px |
| Pantalla inicial sense la data 2021 i amb l'autoria | Text de l'accés i peu «Rubén Vallejo» | `assert` a l'e2e |
| Vídeos narrats amb veu femenina | Remotion + narració ElevenLabs v3 (veu «alice») | Pista d'àudio a cada MP4 |
| So de ràdio a cada «Continua» | `Radio.squelch()` a `nextBtn()` | Codi únic per a totes les fases |
| F1 refeta: escolta amb text → només veu; després parla i el sistema comprova | 4 escoltes (2+2) i 4 paraules de la professió lletrejades per veu (Web Speech API `ca-ES`, coincidència aproximada per lletra); si no coincideix, CECOS demana repetir; alternativa amb fitxes sense micròfon | e2e amb reconeixement simulat |
| Panell inferior tipus radiocomunicador | `#dock`: canal i freqüència, forma d'ona real (AnalyserNode), botó verd CECOS i botó vermell PARLA | Captures |
| Veus noves en català | ElevenLabs v3 via OpenRouter (sarah/george), transcrites per comprovar-les | `tools/gen_voices.py` |
| F2 amb imatge, frase de ràdio, hover i explicació animada | 26 imatges realistes, frase de servei per codi, explicació amb exemple i 2 codis relacionats | Captures |
| F3: codi en gran amb llum en encertar | Capa `.reveal` sobre el dibuix | Captures |
| F4: encerts en verd amb text blanc | `.seq li.ok` | Captures |
