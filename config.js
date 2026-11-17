/* Configuració de l'aplicació.
   stt: adreça del servei de transcripció (vegeu worker/README.md). Si es deixa buida, la veu es reconeix
   amb el reconeixement del navegador (Chrome o Edge) i, si no n'hi ha, l'activitat es fa sense micròfon.
   professorat: true mostra el botó «Accés professorat» i el camp de codi de classe (cal el Worker nou i el KV; vegeu worker/README.md). */
window.CODI3_CONFIG = { stt: 'https://codi3-stt.ruben-743.workers.dev', professorat: false };
