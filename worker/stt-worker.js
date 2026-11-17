/* Servei de transcripció de «Codi 3 · Parla com el SEM» (Cloudflare Worker). No desa cap àudio.

   Rutes (només des de ALLOWED_ORIGINS):
     POST /               àudio WAV → { text }            (capçalera opcional X-Classe: codi de classe)
     GET  /status?classe= → { ok, provider, source }     comprova la clau sense transcriure
     POST /check          { audio(base64 WAV), provider?, key?, classe? } → { ok, text }   prova completa
     POST /class          { code, pin, provider, key }  → desa la clau d'un professor/a     (cal KV)
     POST /class/delete   { code, pin }                  → l'esborra                          (cal KV)

   Configuració al panell de Cloudflare:
     OPENROUTER_API_KEY  (secret)  clau per defecte
     KEYS                (vincle KV, opcional) claus del professorat per codi de classe
     ALLOWED_ORIGINS     (opcional) per defecte https://rvs78.github.io
     STT_MODEL           (opcional) model d'OpenRouter, per defecte elevenlabs/scribe-v2 */

const PROVIDERS = {
  openrouter: { name: 'OpenRouter' },
  groq: { name: 'Groq', url: 'https://api.groq.com/openai/v1', model: 'whisper-large-v3', lang: 'ca' },
  openai: { name: 'OpenAI', url: 'https://api.openai.com/v1', model: 'gpt-transcribe' },
  elevenlabs: { name: 'ElevenLabs' },
};

const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(x => x.toString(16).padStart(2, '0')).join('');

async function transcribe(provider, key, wav, env) {
  const P = PROVIDERS[provider]; if (!P) throw new Error('provider');
  let r;
  if (provider === 'openrouter') {
    r = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', { method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: env.STT_MODEL || 'elevenlabs/scribe-v2', input_audio: { data: b64(wav), format: 'wav' } }) });
  } else {
    const f = new FormData(); f.append('file', new Blob([wav], { type: 'audio/wav' }), 'audio.wav');
    if (provider === 'elevenlabs') {
      f.append('model_id', 'scribe_v2'); f.append('language_code', 'ca');
      r = await fetch('https://api.elevenlabs.io/v1/speech-to-text', { method: 'POST', headers: { 'xi-api-key': key }, body: f });
    } else {
      f.append('model', P.model); if (P.lang) f.append('language', P.lang); f.append('response_format', 'json');
      r = await fetch(`${P.url}/audio/transcriptions`, { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: f });
    }
  }
  if (!r.ok) { const e = new Error('upstream'); e.status = r.status; throw e; }
  const j = await r.json(); return (j.text || '').trim();
}

/* comprovació barata de la clau, sense transcriure: 'ok' | 'invalid' | 'unknown' */
async function keyState(provider, key) {
  try {
    if (provider === 'openrouter') {
      const r = await fetch('https://openrouter.ai/api/v1/key', { headers: { Authorization: `Bearer ${key}` } });
      if (r.status === 401 || r.status === 403) return 'invalid';
      if (!r.ok) return 'unknown';
      const d = (await r.json()).data || {};
      if (d.expires_at && Date.parse(d.expires_at) < Date.now()) return 'invalid';
      if (d.limit_remaining != null && d.limit_remaining <= 0) return 'invalid';
      return 'ok';
    }
    if (provider === 'groq' || provider === 'openai') {
      const r = await fetch(`${PROVIDERS[provider].url}/models`, { headers: { Authorization: `Bearer ${key}` } });
      return r.status === 401 || r.status === 403 ? 'invalid' : r.ok ? 'ok' : 'unknown';
    }
    return 'unknown'; /* ElevenLabs: les claus restringides no permeten consultar-ne l'estat; ho diu la prova completa */
  } catch { return 'unknown'; }
}

const CODE = /^[A-Z0-9]{4,12}$/;
async function resolve(env, classe) {
  const code = String(classe || '').toUpperCase();
  if (code && env.KEYS && CODE.test(code)) {
    const v = await env.KEYS.get('class:' + code, 'json');
    if (v) return { provider: v.provider, key: v.key, source: 'classe' };
  }
  return env.OPENROUTER_API_KEY ? { provider: 'openrouter', key: env.OPENROUTER_API_KEY, source: 'defecte' } : null;
}

const cache = new Map(); /* estat per clau, uns minuts, per no consultar el proveïdor a cada alumne */

export default {
  async fetch(req, env) {
    const allow = (env.ALLOWED_ORIGINS || 'https://rvs78.github.io').split(',').map(s => s.trim());
    const origin = req.headers.get('Origin') || '';
    const cors = { 'Access-Control-Allow-Origin': allow.includes(origin) ? origin : allow[0], 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Classe', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' };
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (!allow.includes(origin)) return json({ error: 'forbidden' }, 403);
    const path = new URL(req.url).pathname.replace(/\/+$/, '') || '/';

    try {
      if (req.method === 'GET' && path === '/status') {
        const classe = new URL(req.url).searchParams.get('classe');
        const k = await resolve(env, classe);
        if (!k) return json({ ok: false, reason: 'sense-clau', kv: !!env.KEYS });
        const id = k.provider + ':' + k.key.slice(-12), hit = cache.get(id);
        let st = hit && hit.t > Date.now() - 300000 ? hit.st : null;
        if (!st) { st = await keyState(k.provider, k.key); cache.set(id, { st, t: Date.now() }); }
        return json({ ok: st !== 'invalid', state: st, provider: k.provider, source: k.source, kv: !!env.KEYS });
      }

      if (req.method === 'POST' && path === '/') {
        const buf = new Uint8Array(await req.arrayBuffer());
        if (buf.byteLength < 100 || buf.byteLength > 1_500_000) return json({ error: 'size' }, 413);
        const k = await resolve(env, req.headers.get('X-Classe'));
        if (!k) return json({ error: 'sense-clau' }, 503);
        return json({ text: await transcribe(k.provider, k.key, buf, env), provider: k.provider });
      }

      if (req.method === 'POST' && path === '/check') {
        const b = await req.json();
        const wav = unb64(String(b.audio || '')); if (wav.byteLength < 100 || wav.byteLength > 600_000) return json({ ok: false, error: 'size' }, 413);
        const k = b.key ? { provider: b.provider, key: String(b.key).trim(), source: 'prova' } : await resolve(env, b.classe);
        if (!k || !PROVIDERS[k.provider]) return json({ ok: false, error: 'sense-clau' });
        const t0 = Date.now();
        try { const text = await transcribe(k.provider, k.key, wav, env); return json({ ok: true, text, ms: Date.now() - t0, provider: k.provider, source: k.source }); }
        catch (e) { return json({ ok: false, error: e.status === 401 || e.status === 403 ? 'clau' : e.status === 402 || e.status === 429 ? 'saldo' : 'servei', status: e.status || 0, provider: k.provider }); }
      }

      if (req.method === 'POST' && (path === '/class' || path === '/class/delete')) {
        if (!env.KEYS) return json({ ok: false, error: 'kv' }, 501);
        const b = await req.json(), code = String(b.code || '').toUpperCase(), pin = String(b.pin || '');
        if (!CODE.test(code)) return json({ ok: false, error: 'codi' }, 400);
        if (pin.length < 4 || pin.length > 40) return json({ ok: false, error: 'pin' }, 400);
        const id = 'class:' + code, old = await env.KEYS.get(id, 'json'), pinHash = await sha(code + '|' + pin);
        if (old && old.pin !== pinHash) return json({ ok: false, error: 'pin-incorrecte' }, 403);
        if (path === '/class/delete') { if (old) await env.KEYS.delete(id); return json({ ok: true }); }
        const provider = String(b.provider || ''), key = String(b.key || '').trim();
        if (!PROVIDERS[provider] || key.length < 10 || key.length > 300) return json({ ok: false, error: 'clau' }, 400);
        if (await keyState(provider, key) === 'invalid') return json({ ok: false, error: 'clau' }, 400);
        await env.KEYS.put(id, JSON.stringify({ provider, key, pin: pinHash, at: new Date().toISOString() }));
        return json({ ok: true, code });
      }

      return json({ error: 'not-found' }, 404);
    } catch (e) {
      return json({ error: 'servei', status: e.status || 0 }, 502);
    }
  },
};
