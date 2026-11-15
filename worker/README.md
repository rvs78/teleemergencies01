# Servei de transcripció (opcional)

Sense aquest servei, la veu es reconeix amb el reconeixement del navegador (Chrome o Edge). Amb el servei, l'àudio temporal
que grava l'alumne s'envia a un model de transcripció (per defecte ElevenLabs Scribe v2 via OpenRouter), que entén molt millor
el català i funciona a qualsevol navegador.

```bash
cd worker
npx wrangler secret put OPENROUTER_API_KEY     # clau pròpia, amb límit de despesa
npx wrangler deploy                             # retorna l'adreça https://codi3-stt.<compte>.workers.dev
```

Després, posa l'adreça a `config.js`: `window.CODI3_CONFIG = { stt: 'https://codi3-stt.<compte>.workers.dev' };`

- El servei només accepta peticions des de `ALLOWED_ORIGINS` i àudios de menys d'1,5 MB. No desa res.
- Cost orientatiu: uns 0,00006 $ per segon d'àudio (una classe de 30 alumnes, menys de 0,20 $).
- Privadesa: la veu de l'alumnat surt del navegador cap a un tercer. Cal valorar-ho segons la política de dades del centre.
