// ─────────────────────────────────────────────────────────────
// Service Worker — DC Pecém Contratos
// IMPORTANTE: incremente CACHE_NOME a cada publicação de updates
//             para que os usuários recebam os novos arquivos.
// Ex.: 'dc-pecem-v3' → 'dc-pecem-v4'
// ─────────────────────────────────────────────────────────────

const CACHE_NOME = 'dc-pecem-v3';

const ARQUIVOS_ESTATICOS = [
  'index.html',
  'pedidos.html',
  'pedido.html',
  'medicao.html',
  'importacao.html',
  'fat-direto.html',
  'avanco.html',
  'login.html',
  'style.css',
  'api.js',
  'config.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

// ── Instalação: pré-carrega arquivos no cache ─────────────────
self.addEventListener('install', e =>
  e.waitUntil(
    caches.open(CACHE_NOME)
      .then(c => c.addAll(ARQUIVOS_ESTATICOS))
      .then(() => self.skipWaiting())
  )
);

// ── Ativação: remove caches de versões anteriores ─────────────
self.addEventListener('activate', e =>
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(
        ks.filter(k => k !== CACHE_NOME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
);

// ── Interceptação de requisições ──────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API Google Apps Script: sempre via rede
  if (url.hostname.includes('script.google.com')) return;

  // Google Fonts e CDN externos: passa direto para o browser
  if (url.hostname.includes('fonts.google') ||
      url.hostname.includes('fonts.gstatic') ||
      url.hostname.includes('cdnjs.cloudflare')) return;

  // Imagens e ícones: cache-first (raramente mudam)
  if (/\.(png|jpg|jpeg|svg|ico|woff2?)$/i.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request))
    );
    return;
  }

  // HTML, CSS, JS: network-first → cache como fallback offline
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok && e.request.method === 'GET' &&
            url.origin === self.location.origin) {
          const copia = res.clone();
          caches.open(CACHE_NOME).then(c => c.put(e.request, copia));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached => {
          if (cached) return cached;
          if (e.request.destination === 'document') {
            return caches.match('index.html');
          }
        })
      )
  );
});
