/* World Education System — public page service worker.
   Network-first for everything: when the visitor is online, every page
   and file is fetched fresh from the network, so the live page never
   serves stale content. The cache only keeps the last good copy of
   pages and small static files as an offline fallback. Narration audio
   under /assets/audio/ is never cached. */
var CACHE = "wes-pwa-v1";

self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE) return caches.delete(key);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  var dest = event.request.destination;
  var cacheable =
    ["document", "image", "style", "script", "font", "manifest", ""].indexOf(dest) >= 0 &&
    url.pathname.indexOf("/assets/audio/") === -1;

  event.respondWith(
    fetch(event.request)
      .then(function (response) {
        if (cacheable && response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      })
      .catch(function () {
        return caches.match(event.request, { ignoreSearch: true }).then(function (hit) {
          if (hit) return hit;
          if (event.request.mode === "navigate") return caches.match("/");
          return Response.error();
        });
      })
  );
});
