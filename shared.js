// YS97 V3 : données partagées par l'accueil et les pages de créations.
window.YS97_APP = (() => {
  'use strict';
  const DB_NAME = 'YS97_LOCAL_EDITOR_V2'; // Conserve les brouillons de la V2.
  const rawPosters = window.YS97_AFFICHES || [];
  const initial = {
    posters: structuredClone(rawPosters),
    logo: window.YS97_LOGO || 'logo-ys97-header.png',
    featured: {...{
      front:'oscar-piastri-orange',back:'raphinha-color',
      f1:'lewis-hamilton',football:'raphinha-original'
    },...(window.YS97_FEATURED || {})}
  };
  function groups(posters) {
    const map = new Map();
    for (const p of posters) {
      const key = p.group || p.id;
      if (!map.has(key)) map.set(key, {id:key,title:p.title,category:p.category,variants:[]});
      map.get(key).variants.push(p);
    }
    return [...map.values()];
  }
  function findPoster(posters,id) {return posters.find(p => p.id === id);}
  function openDb() {
    return new Promise((resolve,reject) => {
      if (!window.indexedDB) return reject(Error('IndexedDB indisponible'));
      const req = indexedDB.open(DB_NAME,1);
      req.onupgradeneeded = () => req.result.createObjectStore('content');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function readDraft() {
    const db = await openDb();
    return new Promise((resolve,reject)=> {
      const tx=db.transaction('content','readonly');
      const req=tx.objectStore('content').get('draft');
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error);
      tx.oncomplete=()=>db.close();
    });
  }
  async function load() {
    const base = structuredClone(initial);
    try {
      const draft=await readDraft();
      if (draft && Array.isArray(draft.posters)) {
        base.posters=draft.posters;
        base.logo=draft.logo || initial.logo;
        if (draft.featured) base.featured={...base.featured,...draft.featured};
      }
    } catch(e) {console.warn('Brouillon local indisponible',e);}
    return base;
  }
  async function save(state) {
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('content','readwrite');
      tx.objectStore('content').put(state,'draft');
      tx.oncomplete=()=>{db.close();resolve();};
      tx.onerror=()=>{db.close();reject(tx.error);};
    });
  }
  async function clear() {
    const db=await openDb();
    return new Promise((resolve,reject)=>{
      const tx=db.transaction('content','readwrite');
      tx.objectStore('content').delete('draft');
      tx.oncomplete=()=>{db.close();resolve();};
      tx.onerror=()=>{db.close();reject(tx.error);};
    });
  }
  function readImage(file) {
    return new Promise((resolve,reject)=>{
      const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);
      r.readAsDataURL(file);
    });
  }
  function exportData(state) {
    const content='// YS97 / catalogue et mise en avant — export depuis le mode édition.\n'
      +'window.YS97_AFFICHES = '+JSON.stringify(state.posters,null,2)+';\n'
      +'window.YS97_LOGO = '+JSON.stringify(state.logo)+';\n'
      +'window.YS97_FEATURED = '+JSON.stringify(state.featured,null,2)+';\n';
    const blob=new Blob([content],{type:'text/javascript;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='affiches.js';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
  }
  const link=(gId,variantId)=>`affiche.html?serie=${encodeURIComponent(gId)}${variantId?'&version='+encodeURIComponent(variantId):''}`;
  function logo(img,src) {if(img)img.src=src||'logo-ys97-header.png';}
  return {initial,load,save,clear,readImage,exportData,groups,findPoster,link,logo};
})();
