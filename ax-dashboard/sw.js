// AX 대시보드 서비스워커
// 온라인이면 항상 최신 배포본(network-first) · 오프라인일 때만 캐시 폴백.
const CACHE = 'ax-dashboard-v3';
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

  // 전부 네트워크 우선: 최신 index.html/ax_port.js/자원 보장, 실패 시 캐시 폴백
  e.respondWith(
    fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return resp;
    }).catch(() => caches.match(req).then(c => c || caches.match('./index.html')))
  );
});
