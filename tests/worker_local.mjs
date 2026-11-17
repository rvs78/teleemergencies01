/* Executa worker/stt-worker.js en local (Node) amb un KV en memòria, per a les proves.
   Ús: OPENROUTER_API_KEY=... NODE_USE_ENV_PROXY=1 node tests/worker_local.mjs   → http://localhost:8766 */
import http from 'node:http';
import worker from '../worker/stt-worker.js';
const store = new Map();
const KEYS = { async get(k, t) { const v = store.get(k); return v == null ? null : t === 'json' ? JSON.parse(v) : v; },
  async put(k, v) { store.set(k, v); }, async delete(k) { store.delete(k); } };
const env = { OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY, KEYS: process.env.NO_KV ? undefined : KEYS, ALLOWED_ORIGINS: 'http://localhost:8765' };
http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const body = ['GET', 'HEAD', 'OPTIONS'].includes(req.method) ? undefined : Buffer.concat(chunks);
  const r = await worker.fetch(new Request('http://localhost:8766' + req.url, { method: req.method, headers: req.headers, body }), env);
  const out = Buffer.from(await r.arrayBuffer()); console.log(req.method, req.url, r.status, out.toString().slice(0, 160));
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(out);
}).listen(8766, () => console.log('worker local a :8766'));
