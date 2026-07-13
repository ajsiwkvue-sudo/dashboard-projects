// AX 대시보드 서비스워커
// HTML은 항상 최신 배포본(network-first), 정적 자원은 캐시 폴백.
const CACHE = 'ax-dashboard-v2';
const SHELL = ['./index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html')
    || url.pathname === '/' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html');

  if (isHTML) {
    // 네트워크 우선: 온라인이면 항상 최신, 오프라인이면 캐시
    e.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
        return resp;
      }).catch(() => caches.match('./index.html'))
    );
  } else {
    // 정적 자원: 캐시 우선 + 백그라운드 갱신
    e.respondWith(
      caches.match(req).then(cached => {
        const net = fetch(req).then(resp => {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          return resp;
        }).catch(() => cached);
        return cached || net;
      })
    );
  }
});
