// ── PMOi Tareas — Service Worker ──
// Este archivo se actualiza automáticamente por GitHub Actions en cada push.
// El BUILD_VERSION cambia con cada deploy → fuerza actualización en todos los clientes.

const BUILD_VERSION = '__BUILD_VERSION__';
const CACHE_NAME = 'pmoi-' + BUILD_VERSION;

// ── INSTALL: cachear el index, activar inmediatamente ──
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) { return cache.add('./'); })
      .then(function() { return self.skipWaiting(); })
  );
});

// ── ACTIVATE: borrar caches viejos, tomar control inmediato ──
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k) { return k !== CACHE_NAME; })
          .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// ── FETCH: Network-First ──
// Siempre intenta la red. Solo usa caché si no hay conexión (offline fallback).
// Esto garantiza que siempre sirve la versión más reciente cuando hay internet.
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Guardar copia fresca en caché
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      })
      .catch(function() {
        // Sin conexión → servir desde caché
        return caches.match(e.request);
      })
  );
});

// ── MESSAGE: activación inmediata desde el cliente ──
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
