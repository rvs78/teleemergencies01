# Servei de transcripció (Cloudflare Worker `codi3-stt`)

Transcriu l'àudio temporal que grava l'alumnat i el retorna com a text. No desa cap àudio.

- **Clau per defecte:** el secret `OPENROUTER_API_KEY`. Si caduca o es queda sense saldo, l'aplicació passa sola al reconeixement de veu del navegador.
- **Claus del professorat (opcional):** a l'«Espai del professorat», cada docent pot desar la seva clau (OpenRouter, Groq, OpenAI o ElevenLabs) amb un codi de classe i un PIN. Es desen a un espai KV vinculat amb el nom `KEYS`. Sense KV, l'aplicació funciona igual, però no es poden desar claus.

## Configuració des del panell de Cloudflare (sense instal·lar res)

1. **Codi:** Workers & Pages → `codi3-stt` → **Edit code** → substitueix-lo pel contingut de `stt-worker.js` → **Deploy**.
2. **Clau per defecte:** Settings → **Variables and Secrets** → `OPENROUTER_API_KEY` → edita el valor → **Deploy**.
3. **Espai per a les claus del professorat:**
   - Storage & Databases → **KV** → **Create** → nom `codi3-claus`.
   - Torna al Worker → Settings → **Bindings** → **Add** → *KV namespace* → nom de la variable `KEYS`, espai `codi3-claus` → **Deploy**.

L'avís «Actualitza la configuració de Wrangler…» es pot ignorar si el Worker es gestiona només des del panell.

## Rutes

| Ruta | Què fa |
|---|---|
| `POST /` | Àudio WAV → `{ text }`. Capçalera opcional `X-Classe` per fer servir la clau d'una classe |
| `GET /status?classe=` | Comprova la clau sense transcriure (l'aplicació ho fa en entrar) |
| `POST /check` | Prova completa amb una mostra d'àudio (botó «Comprova» del professorat) |
| `POST /class`, `POST /class/delete` | Desa o esborra la clau d'un codi de classe, protegida amb PIN |

Només accepta peticions des de `ALLOWED_ORIGINS` (per defecte `https://rvs78.github.io`). Proves locals: `tests/worker_local.mjs`.

**Privadesa:** l'àudio de l'alumnat s'envia a la plataforma de la clau per transcriure'l. Les claus del professorat queden a l'espai KV del compte de Cloudflare de l'autor.
