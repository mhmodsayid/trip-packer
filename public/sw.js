const CACHE_NAME = "trip-packer-shell-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function shouldBypassCache(url) {
  if (url.origin !== self.location.origin) return true;
  if (/supabase\.co/i.test(url.href)) return true;
  if (url.pathname.includes("/rest/") || url.pathname.includes("/realtime")) {
    return true;
  }
  return false;
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })
    .catch(() =>
      caches.match(request).then((cached) => cached || caches.match("/"))
    );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (shouldBypassCache(url)) return;

  if (request.mode === "navigate" || url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
  }
});
