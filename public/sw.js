// AGILA Hub Secure Service Worker
// Strictly partitions public static assets and never caches authenticated or dynamic API data.
const CACHE_NAME = "agila-hub-static-v2";

const APPROVED_STATIC_ASSETS = [
  "/manifest.json",
  "/assets/AGILA Hub.png",
  "/assets/BEEC_vector.png",
  "/assets/AGILA_Hub_official.jpg",
  "/assets/BEEC_official_crest.jpg",
  "/favicon.ico"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APPROVED_STATIC_ASSETS).catch((err) => {
        console.warn("Service worker cache preload partial fail:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only process GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Never cache external API or Supabase requests
  if (url.origin !== location.origin) return;

  // Never cache API routes, auth endpoints, or dynamic Next.js data
  const isPrivateOrDynamic =
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.includes("/_next/data/") ||
    url.searchParams.has("token") ||
    event.request.headers.has("Authorization");

  if (isPrivateOrDynamic) {
    // Network-only for all dynamic and authenticated endpoints
    return;
  }

  // Only cache approved static public assets (images, static bundles)
  const isApprovedStatic =
    APPROVED_STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/assets/");

  if (isApprovedStatic) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});
