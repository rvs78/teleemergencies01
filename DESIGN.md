# DESIGN — Codi 3 · Parla com el SEM · v2 «Aula i ràdio»

Aplicació educativa clara i actual amb un radiocomunicador sempre present a la part inferior durant les fases.

| Token | Valor | Ús |
|---|---|---|
| `--bg` / `--surface` | `#F3F5FA` / `#FFFFFF` | pàgina / targetes |
| `--ink` · `--night` | `#0B1530` | text, capçaleres fosques, ràdio |
| `--blue` | `#2456F0` | acció principal, hover, selecció |
| `--sun` | `#FFC53D` | groc SEM: codis sobre fosc, accents |
| `--ok` / `--bad` | `#0A7F57` / `#C92A30` | encert (fons verd, text blanc) / error |
| `--rx` / `--tx` | `#3DDC97` / `#FF5D5D` | llum CECOS / llum PARLA |

Tipografia: Plus Jakarta Sans 500–800; JetBrains Mono només per a codis, puntuacions i pantalla de la ràdio. Icones SVG pròpies de traç 2 px.

Moviment: explicació animada de la F2 (imatge amb escombrat, codi que entra, exemple i codis relacionats en cascada), revelació del codi amb llum a la F3 i barres dels resultats. `prefers-reduced-motion` ho desactiva.

Imatges: il·lustració plana (F3, portada) i fotografia realista generada (F2). Cap logotip ni emblema.

Àudio: veus ElevenLabs v3 en català amb efecte de ràdio aplicat al navegador; so de sintonia a cada «Continua».
