// デイトレ売買ボード: 通信なしでも開けるようにするための仕組み
const CACHE="dtb-e21d6c4623";
const SHELL=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png","apple-touch-icon.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("dtb-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const req=e.request; if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin===location.origin){
    // 画面本体：まず手元の保存分で開き、つながっていれば裏で新しい版を取ってくる
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit=await c.match(req,{ignoreSearch:true})||(req.mode==="navigate"?await c.match("index.html"):null);
      const net=fetch(req).then(r=>{if(r&&r.ok)c.put(req,r.clone());return r}).catch(()=>null);
      return hit||await net||new Response("offline",{status:503});
    }));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)){
    e.respondWith(caches.open(CACHE+"-font").then(async c=>{
      const hit=await c.match(req); if(hit)return hit;
      try{const r=await fetch(req);c.put(req,r.clone());return r}catch(err){return new Response("",{status:504})}
    }));
  }
});
