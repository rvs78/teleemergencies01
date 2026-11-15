/* Servei de transcripció per a «Codi 3 · Parla com el SEM» (Cloudflare Worker).
   Rep un WAV temporal (POST, audio/wav), el transcriu amb OpenRouter i retorna { text }. No desa res.
   Secrets/variables:  OPENROUTER_API_KEY (secret) · ALLOWED_ORIGINS (p. ex. https://rvs78.github.io) · STT_MODEL (opcional) */
export default {
  async fetch(req, env) {
    const allow = (env.ALLOWED_ORIGINS || 'https://rvs78.github.io').split(',').map(s => s.trim());
    const origin = req.headers.get('Origin') || '';
    const cors = { 'Access-Control-Allow-Origin': allow.includes(origin) ? origin : allow[0], 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
    const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'POST' || !allow.includes(origin)) return json({ error: 'forbidden' }, 403);
    const buf = await req.arrayBuffer();
    if (buf.byteLength < 100 || buf.byteLength > 1_500_000) return json({ error: 'size' }, 413);   /* màxim ≈ 45 s a 16 kHz */
    let bin = ''; const u8 = new Uint8Array(buf); for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    const r = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', { method: 'POST',
      headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: env.STT_MODEL || 'elevenlabs/scribe-v2', input_audio: { data: btoa(bin), format: 'wav' } }) });
    if (!r.ok) return json({ error: 'stt' }, 502);
    const j = await r.json(); return json({ text: j.text || '' });
  },
};
