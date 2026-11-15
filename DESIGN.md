# DESIGN — Codi 3 · Parla com el SEM · «Consola de guàrdia»

Món visual: la consola de coordinació de CECOS vista des d'una ambulància. Capçalera i aparells en blau marí de nit, pàgina gris fred (aula il·luminada, ús diürn), ambre de senyalització com a únic accent, verd «3.3 operatiu» per als encerts i vermell de prioritat per als errors i els codis prioritaris. Les il·lustracions (Seedream 5.5, mateixos dos TES amb uniforme verd) porten tot el color narratiu; la interfície és sòbria.

| Token | Valor | Ús |
|---|---|---|
| `--navy-900` | `#0F1B2D` | capçalera, ràdio, consola |
| `--paper` | `#EEF1F5` | fons de pàgina (gris fred de consola) |
| `--ink` / `--ink-2` | `#14213A` / `#4A5872` | text principal / secundari |
| `--amber` | `#F5A623` | accent sobre marí; `--amber-ink #8A5300` per a text sobre clar |
| `--ok` | `#1F6B4A` | encert, recurs operatiu |
| `--bad` | `#B3261E` | error, codis prioritaris |

Tipografia: Barlow Condensed 600/700 (títols, rètols de fase), Barlow 400–600 (text), JetBrains Mono 500/700 només per a codis, ISSI i puntuacions (dades reals, no decoració). Icones SVG pròpies, traç 2 px.

Moviment: un sol moment amb autoria — l'encesa del LED i el «squelch» de la ràdio quan CECOS parla. La resta, transicions de 160–220 ms amb ease-out; `prefers-reduced-motion` les anul·la.

Àudio: veus de CECOS pre-generades (HeyGen Voice, Nadine/Lucian alternats) amb filtre de ràdio aplicat al navegador (passabanda 300–3400 Hz, compressió, soroll i pitet), de manera que canviar de veu no obliga a refer cap efecte.
