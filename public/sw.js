// BRUTAL CASH Offline-First Service Worker
const CACHE_NAME = "brutal-cash-v1";

const STATIC_ASSETS = [
  "/",
  "/history",
  "/calendar",
  "/analytics",
  "/settings",
  "/manifest.json",
  "/icons/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
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
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Don't cache Supabase remote REST API calls directly with static worker
  if (url.hostname.includes("supabase.co")) {
    return;
  }

  // Network First, fallback to Cache strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache valid responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to home page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("Offline - Brutal Cash", {
            status: 503,
            statusText: "Service Unavailable",
          });
        });
      })
  );
});
