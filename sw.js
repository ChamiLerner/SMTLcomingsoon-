/* Service Worker — עבודה אופליין על ההר */
const CACHE = "dolomites-2026-v28";
const ASSETS = [
  "./", "index.html", "styles.css", "app.js", "trip-data.js", "places.js", "expenses.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png",
  "assets/arrival.jpg", "assets/col-alt.jpg", "assets/braies.jpg", "assets/funbob.jpg",
  "assets/corvara.jpg", "assets/lagazuoi.jpg", "assets/sorapis.jpg", "assets/tre-cime.jpg", "assets/venice.jpg",
  "assets/braies-boats.jpg", "assets/sancandido.jpg", "assets/haunold.jpg", "assets/loacker.jpg",
  "assets/braies-path.jpg", "assets/coaster.jpg", "assets/iceclub.jpg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Site Data (קופה משותפת) — תמיד מהרשת, בלי מטמון, כדי שכולם יראו את המצב העדכני
  if (url.pathname.startsWith("/.herenow/")) {
    e.respondWith(fetch(req).catch(() => new Response('{"records":[],"nextCursor":null}', { status: 200, headers: { "Content-Type": "application/json" } })));
    return;
  }
  // מזג אוויר וקריאות רשת חיצוניות — רשת קודם, בלי לשמור במטמון האפליקציה
  if (url.origin !== location.origin) {
    e.respondWith(fetch(req).catch(() => new Response("", { status: 504 })));
    return;
  }
  // נכסי האפליקציה — cache first, עם רענון ברקע
  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
