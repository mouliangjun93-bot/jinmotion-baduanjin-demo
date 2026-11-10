const CACHE='jinmotion-shell-v2.4',MODEL_CACHE='jinmotion-pose-chunks-v1';
const ASSETS=['./','./index.html','./style.css','./app.js','./model.js','./i18n.js','./camera-controls.js','./pose-loader.js','./pose-engine.js','./pose-math.js','./pose-quality.js','./pose-voice.js','./pose-download.js','./pose-assets.js','./vendor/fflate/fflate.mjs','./vendor/mediapipe/vision_bundle.mjs','./icon.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting()});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE&&k!==MODEL_CACHE&&(k.startsWith('jinmotion-v')||k.startsWith('jinmotion-shell-'))).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/vendor/mediapipe/packed/')||event.request.headers.has('Range'))return;
 event.respondWith((async()=>{try{const response=await fetch(event.request);if(response.ok){try{const cache=await caches.open(CACHE);await cache.put(event.request,response.clone())}catch{}}return response}catch{return await caches.match(event.request)||new Response('Offline',{status:503})}})());
});
