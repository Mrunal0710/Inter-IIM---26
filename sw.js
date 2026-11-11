/* Network-first for this site's own files (so data edits show up straight away),
   with a cached copy as the offline fallback. Bump VERSION if you change the file list. */
const VERSION = "interiim26-v8";
const SHELL = ["/", "/index.html", "/styles.css", "/app.js", "/data.js", "/fixtures.js", "/assets.js", "/mymap-data.js", "/manifest.webmanifest",
  "/assets/emblem.png", "/assets/sports-crest.png", "/assets/icon-192.png",
  "/assets/iimb.png", "/assets/iimv.png", "/assets/iimt.png", "/assets/iimi.png", "/assets/iimn.png", "/assets/iimm.png", "/assets/iimk.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const cdn = /unpkg\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host);
  if (!sameOrigin && !cdn) return; // map tiles, weather, sheets: always live
  e.respondWith(
    fetch(req).then(res => {
      if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || (req.mode === "navigate" ? caches.match("/index.html") : undefined)))
  );
});
