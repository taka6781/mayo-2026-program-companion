const CACHE='mayo-2026-production-pwa-v8-0';
const ASSETS=['./','index.html','styles.css?v=8.0','config.js?v=8.0','cloud.js?v=8.0','app.js?v=8.0','manifest.json','icon.svg','jstarx-logo.png','planex-logo.png','planex-favicon.png','apple-touch-icon.png','pwa-icon-192.png','pwa-icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin) return; // never cache Supabase/CDN/API traffic
  e.respondWith(fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp;}).catch(()=>caches.match(e.request).then(r=>r||caches.match(new URL('./index.html', self.registration.scope).href))));
});
