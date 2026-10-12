/* Medical HQ service worker: offline shell + silent update detection.
   You never need to edit this file. Upload a new index.html and the app notices by itself. */
const CACHE = "mhq-shell-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];
const INDEX = () => new Request(new URL("./index.html", self.registration.scope).href);

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
async function tell(msg) { for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg); }
async function revalidate(req, cached) {
  try {
    const res = await fetch(req, { cache: "no-cache" });
    if (!res || !res.ok) return res;
    const cache = await caches.open(CACHE);
    if (cached) {
      const a = cached.headers.get("etag"), b = res.headers.get("etag");
      let changed = a && b ? a !== b : (await cached.clone().text()) !== (await res.clone().text());
      if (changed) { await cache.put(req, res.clone()); if (req.url.endsWith("index.html")) tell({ type: "MHQ_UPDATE" }); }
    } else await cache.put(req, res.clone());
    return res;
  } catch (err) { return null; }
}
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  const isIndex = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  const key = isIndex ? INDEX() : req;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(key, { ignoreSearch: true });
    const net = revalidate(key, cached ? cached.clone() : null);
    if (cached) { e.waitUntil(net); return cached; }
    return (await net) || new Response("Offline", { status: 503, statusText: "Offline" });
  })());
});
