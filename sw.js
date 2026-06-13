/* 서비스워커 — 항상 최신 + 오프라인 지원
   - network-first: 인터넷이 되면 항상 최신 파일을 받고(앱·문제 모두), 캐시에도 저장.
   - 오프라인이면 마지막으로 저장된 캐시로 동작.
   - 캐시 버전(CACHE)을 올리면 옛 캐시가 정리되고 새 서비스워커가 즉시 적용됩니다. */
const CACHE = 'gwiwha-v3';
const CORE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './questions.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  const isQuestions = url.pathname.endsWith('questions.json');

  // 네트워크 우선: 항상 최신을 받아오고 캐시 갱신. 실패(오프라인) 시 캐시로.
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(isQuestions ? './questions.json' : req, copy));
        return res;
      })
      .catch(() => {
        if (isQuestions) return caches.match('./questions.json');
        return caches.match(req).then((c) => c || (req.mode === 'navigate' ? caches.match('./index.html') : undefined));
      })
  );
});
