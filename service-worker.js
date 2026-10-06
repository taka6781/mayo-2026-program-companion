const CACHE='mayo-2026-production-pwa-v8-4-live-chat-sound';
const ASSETS=['./','index.html','styles.css?v=8.4','config.js?v=8.4','cloud.js?v=8.4','app.js?v=8.4','manifest.json','icon.svg','jstarx-logo.png','planex-logo.png','planex-favicon.png','apple-touch-icon.png','pwa-icon-192.png','pwa-icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin) return; // never cache Supabase/CDN/API traffic
  e.respondWith(fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return resp;}).catch(()=>caches.match(e.request).then(r=>r||caches.match(new URL('./index.html', self.registration.scope).href))));
});


self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch(_e){data={title:'Mayo 2026',body:event.data?.text?.()||'New update'}}
  const title=data.title||'Mayo 2026';
  const options={
    body:data.body||'You have a new update.',
    icon:'pwa-icon-192.png',
    badge:'pwa-icon-192.png',
    tag:data.tag||`mayo-update-${Date.now()}`,
    renotify:true,
    silent:false,
    timestamp:Date.now(),
    data:{url:data.url||'./'}
  };
  event.waitUntil(self.registration.showNotification(title,options));
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||'./',self.registration.scope).href;
  event.waitUntil((async()=>{
    const windows=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if('focus' in client){await client.focus();return;}
    }
    if(clients.openWindow)return clients.openWindow(target);
  })());
});
