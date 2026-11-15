"""Servei de transcripció local per a proves (equivalent a worker/stt-worker.js). Ús: OPENROUTER_API_KEY=... python3 tests/stt_proxy.py"""
import os, json, base64, urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
    def _cors(self): self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', 'Content-Type'); self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
    def do_OPTIONS(self): self.send_response(204); self._cors(); self.end_headers()
    def do_POST(self):
        wav = self.rfile.read(int(self.headers['Content-Length'])); open('/tmp/last_upload.wav', 'wb').write(wav)
        req = urllib.request.Request('https://openrouter.ai/api/v1/audio/transcriptions', data=json.dumps({'model': 'elevenlabs/scribe-v2', 'input_audio': {'data': base64.b64encode(wav).decode(), 'format': 'wav'}}).encode(),
            headers={'Authorization': 'Bearer ' + os.environ['OPENROUTER_API_KEY'], 'Content-Type': 'application/json'})
        text = json.loads(urllib.request.urlopen(req, timeout=60).read()).get('text', ''); print('STT:', text, flush=True)
        self.send_response(200); self._cors(); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(json.dumps({'text': text}).encode())
    def log_message(self, *a): pass
HTTPServer(('127.0.0.1', 8766), H).serve_forever()
