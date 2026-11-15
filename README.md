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

### Reconeixement de veu (F1)

Fa servir la Web Speech API del navegador en català (`ca-ES`): funciona a **Chrome i Edge** amb connexió i permís de micròfon. La coincidència és aproximada (accepta «eco/echo», «maik/mike»…; vegeu `HEAR` a `data.js`). Sense micròfon o en un navegador no compatible, la mateixa activitat es fa amb fitxes.

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
