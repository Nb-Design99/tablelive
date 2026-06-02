// TableLive — service worker minimal (rend l'app installable + utilisable hors-ligne)
// Stratégie : réseau d'abord (toujours la version la plus fraîche), cache en secours hors-ligne.
const CACHE = 'tablelive-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // ne touche pas aux écritures
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // Supabase/API/CDN → réseau direct
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      const c = await caches.open(CACHE);
      c.put(req, fresh.clone());
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      return cached || caches.match('/');
    }
  })());
});
