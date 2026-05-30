/* TableLive — service worker (PWA installable + hors-ligne) */
const VERSION = 'tablelive-v1';
const SHELL = [
  './',
  './index.html',
  './reservation.html',
  './icon.svg',
  './manifest.webmanifest',
];

// Pré-cache du "shell" applicatif à l'installation
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

// Nettoyage des anciens caches lors de l'activation
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // jamais d'interception des écritures (Supabase insert/upsert)
  const url = new URL(req.url);

  // API Supabase (REST + realtime) : toujours le réseau, jamais de cache (données fraîches)
  if (url.hostname.endsWith('supabase.co')) return;

  // Navigation (ouverture d'une page) : réseau d'abord, cache en secours hors-ligne
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => { caches.open(VERSION).then(c => c.put(req, res.clone())); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Reste (scripts, polices, icône) : cache d'abord, puis réseau (et on garde une copie)
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res && res.status === 200 && (url.origin === location.origin || res.type === 'cors')) {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => cached))
  );
});
