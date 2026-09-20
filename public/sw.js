// BRUTAL CASH Offline-First Service Worker
const CACHE_NAME = "brutal-cash-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "./",
        "./manifest.json",
        "./icons/icon.svg",
        "./icons/icon-192.png",
        "./icons/icon-512.png"
      ]);
    }).catch((err) => {
      console.warn("Pre-cache error:", err);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Don't intercept Supabase calls
  if (url.hostname.includes("supabase.co")) return;

  // Stale-While-Revalidate / Network First with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === "navigate") {
            return caches.match("./") || caches.match("./index.html");
          }
          return new Response("Offline", { status: 503 });
        });
      })
  );
});
