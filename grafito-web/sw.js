const SHELL_CACHE='grafito-shell-v10';
const RUNTIME_CACHE='grafito-runtime-v10';
const SHELL=['./','./index.html','./style.css?v=10','./grafito-v7.js?v=10-base','./grafito-v9-patch.js?v=10-knowledge','./grafito-v10-patch.js?v=10-intent','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(SHELL_CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{const names=await caches.keys();await Promise.all(names.filter(n=>n.startsWith('grafito-')&&![SHELL_CACHE,RUNTIME_CACHE].includes(n)).map(n=>caches.delete(n)));await self.clients.claim()})())});
async function fresh(request){try{const response=await fetch(request,{cache:'no-store'});if(response&&response.ok){const c=await caches.open(RUNTIME_CACHE);c.put(request,response.clone()).catch(()=>{})}return response}catch(e){const hit=await caches.match(request);if(hit)return hit;if(request.mode==='navigate')return(await caches.match('./index.html'))||(await caches.match('./'));throw e}}
self.addEventListener('fetch',event=>{const r=event.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin===self.location.origin)event.respondWith(fresh(r))});
