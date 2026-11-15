# Codi 3 · Parla com el SEM

Activitat en línia individual de **MP0060 Teleemergències** (CFGM Emergències Sanitàries, grup TES 1AA, Institut d'FP Sanitària Vall d'Hebron). L'alumnat aprèn de forma gràfica i progressiva el **CODI 3** del SEM i l'**alfabet INTERCO**, i acaba parlant amb CECOS en un simulador de ràdio basat en els guions de la pràctica de classe (Bravo 727/749).

**Font única dels codis:** «CODI 3 MODIFICAT. Codificacions de transmissió de dades pels recursos SEM» (U100.U00.0.D6.008, v1, 23/09/2021).

## Estructura (la de sempre)

1. **Accés:** nom i cognoms, correu `@isvh.cat` i contrasenya d'aula (**`tes1aa`**, comparada per empremta SHA-256 a `app.js`). És una barrera d'entrada, no una autenticació. El progrés es desa al `localStorage`.
2. **Tauler:** panell de l'alumne (fases, punts, nota provisional, respostes errònies, ajudes) i ruta de 6 fases que s'obren en ordre.
3. **Instruccions per fase:** objectiu, nivell de Bloom, què faràs, controls i puntuació, amb una càpsula de vídeo (Remotion).
4. **Fases i punts (1000):**

| Fase | Bloom | Què es fa | Punts |
|---|---|---|---|
| F1 · Alfabet INTERCO | Recordar | 3 lletrejos (tocar paraules en ordre) i 3 escoltes (escriure el que lletreja CECOS) | 150 |
| F2 · Famílies de codis | Comprendre | Classificar 12 codis en 6 famílies; ajuda «Significat» | 150 |
| F3 · Escenes il·lustrades | Aplicar | 12 escenes en 3 nivells: amb pista, sense pista, contrarellotge de 20 s | 200 |
| F4 · La línia del servei | Analitzar | Ordenar 3 serveis complets (arrossegar o fletxes), 2 intents | 150 |
| F5 · Descodifica | Interpretar | 6 missatges reals → llenguatge planer (qui, què, on) | 100 |
| F6 · Simulador de ràdio | Transferir | 4 situacions amb PTT; prémer PTT mentre parla CECOS compta com a 3.13 | 250 |

5. **Resultats:** nota 1–10, punts per fase, respostes errònies per família, codis a repassar i codi de verificació.
6. **Informe PDF** (jsPDF) per lliurar a la tasca de Google Classroom.

Puntuació de cada element: −50 % per error, −30 % per ajuda; al segon error es mostra la resposta correcta.

## Recursos generats amb IA (pre-generats, cap clau al navegador)

| Recurs | Eina | Fitxers | Regenerar |
|---|---|---|---|
| 30 escenes + portada + cabina | Seedream 5.5 (OpenRouter) amb full de personatges com a referència | `assets/img/` | `OPENROUTER_API_KEY=… python3 tools/gen_images.py scenes` |
| Veus de CECOS (20 clips) | HeyGen Voice Turbo free (OpenRouter), Nadine i Lucian alternats | `assets/audio/` | edita `tools/voices.json` i `python3 tools/gen_voices.py` |
| Càpsules d'instruccions (6) | Remotion | `assets/video/` | `tools/remotion/Composition.tsx` |

**Canviar les veus:** a `tools/voices.json` hi ha el model i la llista de veus; els textos que es locuten són els camps `say` de `data.js`. L'efecte de ràdio (passabanda 300–3400 Hz, compressió, soroll i pitet) s'aplica al navegador, així que no cal refer res més.

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
