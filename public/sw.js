/* one task service worker — network-first so app code is always fresh online.
   Bumping CACHE invalidates everything from older versions. */
const CACHE = "one-task-v3";

self.addEventListener("install", () => {
  // Take over as soon as possible — don't wait for old tabs to close.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // never cache the data/auth API

  // Images & fonts can be cache-first (they don't change app behaviour).
  if (/\.(?:png|svg|ico|webp|jpg|jpeg|gif|woff2?)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // HTML, JS, CSS → network-first: always fresh online, cache only as an
  // offline fallback. This prevents users from getting pinned to old builds.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() =>
        caches
          .match(req)
          .then((cached) =>
            cached || (req.mode === "navigate" ? caches.match("/") : undefined),
          ),
      ),
  );
});
