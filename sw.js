// Service Worker для кэширования ресурсов галереи
const CACHE = 'gallery-v1';

// Критичные файлы, которые кэшируем сразу при установке SW
const PRECACHE = [
  './assets/textures/atlas/main/atlas-0.jpg',
  './assets/textures/atlas/main/atlas-1.jpg',
  './assets/textures/atlas/main/atlas-2.jpg',
  './assets/textures/atlas/main/atlas-3.jpg',
  './assets/textures/atlas/main/atlas-4.jpg',
  './assets/textures/atlas/main/atlas-5.jpg',
  './assets/textures/atlas/main/atlas-6.jpg',
  './assets/atlas-0-DXSMYIfM.js',
  './assets/atlas-1-CNOmpIuO.js',
  './assets/atlas-2-Dn_oyFMQ.js',
  './assets/atlas-3-DZTEhMap.js',
  './assets/atlas-4-DsrS5WzO.js',
  './assets/atlas-5-BEBC7xka.js',
  './assets/atlas-6-DFj5W7eF.js',
  './sixftyfps-app.js',
];

// Установка: кэшируем критичные ресурсы
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Стратегия: сначала кэш, потом сеть (Cache First)
// Для JS/JPG/шрифтов — отдаём из кэша мгновенно
// Для остального (HTML, JSON) — сначала сеть, fallback к кэшу
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Игнорируем не-GET и внешние запросы
  if (e.request.method !== 'GET' || !url.origin.includes(self.location.origin.replace('https://','').replace('http://',''))) {
    return;
  }

  const isAsset = /\.(js|jpg|jpeg|png|woff2?|mp3|json)$/.test(url.pathname);

  if (isAsset) {
    // Cache First: отдаём кэш мгновенно, обновляем в фоне
    e.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          const networkFetch = fetch(e.request).then(response => {
            if (response.ok) cache.put(e.request, response.clone());
            return response;
          }).catch(() => cached);
          return cached || networkFetch;
        })
      )
    );
  }
  // HTML — проверяем сеть, fallback к кэшу
});
