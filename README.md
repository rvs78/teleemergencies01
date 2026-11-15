# Codi 3 · Parla com el SEM

Activitat en línia individual de **MP0060 Teleemergències** (CFGM Emergències Sanitàries, grup TES 1AA, Institut d'FP Sanitària Vall d'Hebron). L'alumnat aprèn de forma gràfica i progressiva el **CODI 3** del SEM i l'**alfabet INTERCO**, i acaba parlant amb CECOS en un simulador de ràdio basat en els guions de la pràctica de classe (Bravo 727/749).

**Font única dels codis:** «CODI 3 MODIFICAT. Codificacions de transmissió de dades pels recursos SEM» (U100.U00.0.D6.008, v1, 23/09/2021).

## Estructura

1. **Accés:** nom i cognoms, correu `@isvh.cat` i contrasenya d'aula (**`tes1aa`**, comparada per empremta SHA-256 a `app.js`). Barrera d'entrada, no autenticació. El progrés es desa al `localStorage`.
2. **Tauler:** panell de l'alumne i recorregut de 6 fases que s'obren en ordre.
3. **Instruccions per fase:** vídeo narrat (Remotion + veu femenina), objectiu, controls i puntuació.
4. **Fases (1000 punts)**, amb el **radiocomunicador** a la part inferior (canal, freqüència, forma d'ona, botó verd CECOS i botó vermell PARLA):

| Fase | Què es fa | Punts |
|---|---|---|
| F1 · Alfabet INTERCO | 4 escoltes (2 amb text, 2 només veu) i 4 paraules lletrejades **per veu**; si CECOS no copia, cal repetir | 150 |
| F2 · Famílies de codis | 12 codis amb imatge i frase de ràdio; explicació animada amb exemple i 2 codis relacionats | 150 |
| F3 · Escenes il·lustrades | 12 escenes en 3 nivells; en encertar, el codi apareix en gran sobre el dibuix | 200 |
| F4 · La línia del servei | Ordenar 3 serveis; encerts en verd | 150 |
| F5 · Descodifica | 6 missatges de ràdio → llenguatge planer | 100 |
| F6 · Simulador de ràdio | 4 comunicacions amb PARLA; trepitjar CECOS compta com a 3.13 | 250 |

5. **Resultats** amb gràfiques i **informe PDF** amb codi de verificació per lliurar a Classroom.

### Veu de l'alumnat (F1 i F6)

Quan l'alumne manté premut PARLA/PTT, el navegador **grava un àudio temporal** (només a la memòria), el transcriu, el compara amb el text esperat i **l'elimina**: no es desa ni al dispositiu ni enlloc. Hi ha un indicador de senyal per comprovar que el micròfon funciona.

La transcripció es pot fer de dues maneres (`config.js`):

| `stt` a `config.js` | Com es transcriu | Requisits |
|---|---|---|
| buit (per defecte) | Reconeixement de veu del navegador, en català | Chrome o Edge, amb connexió |
| adreça del servei | El WAV temporal s'envia al servei de `worker/` (ElevenLabs Scribe via OpenRouter) | Desplegar el Worker amb una clau pròpia; vegeu `worker/README.md` |

**Sense micròfon** tot és jugable: a la F1 es trien fitxes (amb paraules falses de la mateixa inicial barrejades) i a la F6 es tria el missatge amb un clic i es prem el PTT.

A la F6 l'alumne fa servir una **emissora de pràctiques** (encesa, volum, canal, subcanal CTCSS i PTT): ha d'engegar-la i sintonitzar el canal i el subcanal de CECOS del full de guàrdia abans de poder comunicar-se.

Proves: `tests/e2e.py` (partida completa amb reconeixement simulat) i `tests/real_voice.py` (cadena real: micròfon simulat amb un WAV → gravació → servei de transcripció → comparació; requereix `tests/stt_proxy.py`).

## Recursos generats amb IA (pre-generats, cap clau al navegador)

| Recurs | Eina | Regenerar |
|---|---|---|
| Escenes il·lustrades (F3), portada | Seedream 5.5 | `python3 tools/gen_images.py scenes` |
| 26 imatges realistes (F2) | Seedream 5.5 | `python3 tools/gen_f2.py [codi]` |
| Veus de CECOS (52 clips) i narració dels vídeos | ElevenLabs v3 via OpenRouter | edita `tools/voices.json` i `python3 tools/gen_voices.py` |
| Vídeos d'instruccions | Remotion | `tools/remotion/Composition.tsx` |

Totes les eines llegeixen `OPENROUTER_API_KEY` de l'entorn.

## Fitxers

| Fitxer | Funció |
|---|---|
| `index.html`, `styles.css` | Pàgina i estil (vegeu `DESIGN.md`) |
| `app.js` | Pantalles, fases, puntuació, àudio de ràdio, resultats i PDF |
| `data.js` | Tot el contingut: codis, famílies, INTERCO, escenes, seqüències, missatges i guions de ràdio |
| `vendor/jspdf.umd.min.js` | Generador de PDF |
| `tests/e2e.py` | Partida completa automàtica amb Playwright i captures |

## Desenvolupament

```bash
python3 -m http.server 8000          # http://localhost:8000
python3 tests/e2e.py http://localhost:8000/ shots
```

Publicació: GitHub Pages des de la branca `main` (carpeta arrel). Sense compilació.
