const VERSION = "badminton-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const PAGE_CACHE = `${VERSION}-pages`;
const PAGE_CACHE_LIMIT = 40;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(["/offline.html"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("badminton-") &&
                key !== SHELL_CACHE &&
                key !== PAGE_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (
    self.location.hostname === "localhost" ||
    self.location.hostname === "127.0.0.1"
  ) {
    return;
  }

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname === "/login" ||
    (url.pathname.startsWith("/api/") &&
      !url.pathname.startsWith("/api/app/")) ||
    url.pathname.startsWith("/_next/image")
  ) {
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        const response = await fetch(request);
        if (response.ok) {
          try {
            await cache.put(request, response.clone());
          } catch (error) {
            console.error("Could not cache static asset:", error);
          }
        }
        return response;
      }),
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        const contentType = response.headers.get("content-type") ?? "";
        if (
          response.ok &&
          (contentType.includes("text/html") ||
            contentType.includes("text/x-component") ||
            (url.pathname.startsWith("/api/app/") &&
              contentType.includes("application/json")))
        ) {
          try {
            const cache = await caches.open(PAGE_CACHE);
            await cache.put(request, response.clone());
            const keys = await cache.keys();
            await Promise.all(
              keys
                .slice(0, Math.max(0, keys.length - PAGE_CACHE_LIMIT))
                .map((key) => cache.delete(key)),
            );
          } catch (error) {
            console.error("Could not cache signed-in page:", error);
          }
        }
        return response;
      } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.mode === "navigate") {
          const shell = await caches.open(SHELL_CACHE);
          const offline = await shell.match("/offline.html");
          if (offline) return offline;
        }

        throw error;
      }
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "CLEAR_CACHED_PAGES") {
    event.waitUntil(caches.delete(PAGE_CACHE));
  }
});
