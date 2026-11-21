(() => {
'use strict';
const A=window.YS97_APP;
const $=(id)=>document.getElementById(id);
let state=structuredClone(A.initial);
let activeFilter='Toutes';
let activeSort='original';
let adminUnlocked=false;
let noticeTimer=null;
const CATEGORIES=['Formule 1','Football'];
const TOGGLE_WAIT=650;
const CYCLE_EVERY=1400;
const ACCESS_HASH='08094b571b976574cb25b27d30707317b5de5848d3fe220272a0540d380a05cc';
const gallery=$('posterGrid');
const filterButtons=[...document.querySelectorAll('.filter-btn')];
const inputSearch=$('searchInput');
const adminDialog=$('adminDialog');

function notify(str){
  const el=$('toast');el.textContent=str;el.classList.add('visible');
  clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>el.classList.remove('visible'),3200);
}
function text(id,value){const el=$(id);if(el)el.textContent=String(value);}
function getGroups(){return A.groups(state.posters);}
function syncLogo(){
  const mark=$('brandMark');
  mark.replaceChildren();
  const img=document.createElement('img');img.src=state.logo || 'logo-ys97-header.png';
  img.alt='YS97';img.className='actual-logo';mark.append(img);
  mark.classList.add('has-custom-logo');
  A.logo($('footerLogo'),state.logo);
}
function applyFeatured(){
  for(const [key,elementId] of Object.entries({front:'featuredFront',back:'featuredBack',f1:'featuredF1',football:'featuredFootball'})) {
    let v=A.findPoster(state.posters,state.featured[key]);
    if(!v) v=state.posters.find(p=>(key==='football'?p.category==='Football':true))||state.posters[0];
    if(v && $(elementId)) {$(elementId).src=v.file;$(elementId).alt=`À la une : ${v.title}, ${v.edition || 'édition originale'}`;}
  }
}
function updateCounts(){
  const gs=getGroups();
  const f1=gs.filter(g=>g.category==='Formule 1').length,foot=gs.filter(g=>g.category==='Football').length;
  for(const [id,val] of Object.entries({totalCount:gs.length,allFilterCount:gs.length,
    f1Count:f1,footCount:foot,f1FilterCount:f1,footFilterCount:String(foot).padStart(2,'0'),year:new Date().getFullYear()})) text(id,val);
  const sticker=document.querySelector('.sticker-bottom');
  if(sticker)sticker.textContent=`${String(gs.length).padStart(2,'0')} SÉRIES / ${state.posters.length} AFFICHES`;
}
function card(g,index) {
  const article=document.createElement('article');article.className='poster-card';
  const a=document.createElement('a');a.className='poster-open';a.href=A.link(g.id);
  a.setAttribute('aria-label',`Ouvrir ${g.title} : ${g.variants.length} édition${g.variants.length>1?'s':''}`);
  const picture=document.createElement('div');picture.className='poster-image';
  const img=document.createElement('img');img.src=g.variants[0].file;img.alt=`Affiche ${g.title}`;
  img.loading='lazy';img.decoding='async';
  const hover=document.createElement('span');hover.className='poster-hover';hover.textContent='↗';hover.setAttribute('aria-hidden','true');
  picture.append(img,hover);
  if(g.variants.length>1){
    const badge=document.createElement('span');badge.className='poster-versions';badge.textContent=`${g.variants.length} ÉDITIONS`;
    picture.append(badge);
    const dots=document.createElement('div');dots.className='preview-dots';dots.setAttribute('aria-hidden','true');
    const indicators=g.variants.map((v,i)=>{const dot=document.createElement('span');if(!i)dot.classList.add('active');dots.append(dot);return dot;});
    picture.append(dots);
    let timer=null,start=null,n=0;
    const show=()=>{
      n=(n+1)%g.variants.length;
      img.classList.add('switching');
      img.src=g.variants[n].file;
      img.alt=`${g.title}, ${g.variants[n].edition}`;
      indicators.forEach((d,i)=>d.classList.toggle('active',i===n));
      setTimeout(()=>{if(img.isConnected)img.classList.remove('switching');},180);
    };
    const stop=()=>{
      if(start!==null)clearTimeout(start);if(timer!==null)clearInterval(timer);
      start=null;timer=null;n=0;img.src=g.variants[0].file;
      indicators.forEach((d,i)=>d.classList.toggle('active',i===0));
    };
    a.addEventListener('pointerenter',e=>{
      if(e.pointerType==='touch')return;
      stop();start=setTimeout(()=>{show();timer=setInterval(show,CYCLE_EVERY);},TOGGLE_WAIT);
    });
    a.addEventListener('pointerleave',stop);
    a.addEventListener('blur',()=>{if(!a.matches(':hover'))stop();});
    a.addEventListener('focus',()=>{stop();start=setTimeout(()=>{show();timer=setInterval(show,CYCLE_EVERY);},TOGGLE_WAIT);});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();},{passive:true});
  }
  const label=document.createElement('div');label.className='poster-label';
  const number=document.createElement('span');number.textContent=`SÉRIE ${String(index+1).padStart(2,'0')}`;
  const cat=document.createElement('span');cat.className='poster-tag';cat.textContent=g.category==='Football'?'FOOTBALL':'FORMULE 1';
  label.append(number,cat);
  const title=document.createElement('h3');title.className='poster-name';title.textContent=g.title;
  const edition=document.createElement('p');edition.className='poster-edition';
  edition.textContent=g.variants.length>1?`${g.variants.length} éditions — explorer ↗`:(g.variants[0].edition||'Édition originale');
  a.append(picture,label,title,edition);article.append(a);return article;
}
function render(){
  updateCounts();syncLogo();applyFeatured();
  const gs=getGroups();const q=inputSearch.value.toLocaleLowerCase('fr').trim();
  const visible=gs.filter(g=>{
    const hay=[g.title,g.category,...g.variants.flatMap(v=>[v.title,v.edition,v.search||''])].join(' ').toLocaleLowerCase('fr');
    return (activeFilter==='Toutes'||g.category===activeFilter)&&hay.includes(q);
  });
  if(activeSort==='az'||activeSort==='za') {
    const collator=new Intl.Collator('fr',{sensitivity:'base',ignorePunctuation:true,numeric:true});
    visible.sort((a,b)=>activeSort==='az'?collator.compare(a.title,b.title):collator.compare(b.title,a.title));
  }
  const frag=document.createDocumentFragment();visible.forEach((g,i)=>frag.append(card(g,i)));
  gallery.replaceChildren(frag);
  const count=visible.reduce((n,g)=>n+g.variants.length,0);
  text('resultsText',`${visible.length} SÉRIE${visible.length!==1?'S':''} / ${count} AFFICHE${count!==1?'S':''}`);
  $('emptyState').hidden=visible.length>0;
  filterButtons.forEach(b=>{const on=b.dataset.filter===activeFilter;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
}
filterButtons.forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;render();}));
inputSearch.addEventListener('input',render);
$('sortSelect').addEventListener('change',()=>{activeSort=$('sortSelect').value;render();});
$('resetFilters').addEventListener('click',()=>{activeFilter='Toutes';inputSearch.value='';render();inputSearch.focus();});
document.querySelectorAll('[data-collection]').forEach(b=>b.addEventListener('click',()=>{
  activeFilter=b.dataset.collection;inputSearch.value='';render();
  $('galerie').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
}));

function openAdmin(){
  adminUnlocked=false; // Toujours redemander le code, même lors d'une seconde ouverture.
  $('adminLogin').hidden=false;$('adminWorkspace').hidden=true;
  $('adminCode').value='';$('adminError').textContent='';
  adminDialog.hidden=false;adminDialog.setAttribute('aria-hidden','false');
  document.body.classList.add('modal-open');$('adminCode').focus();
}
function closeAdmin(){
  adminUnlocked=false; // Jamais de session conservée.
  $('adminCode').value='';$('githubToken').value='';$('adminLogin').hidden=false;$('adminWorkspace').hidden=true;
  adminDialog.hidden=true;adminDialog.setAttribute('aria-hidden','true');
  document.body.classList.remove('modal-open');$('ys97Access').focus();
}
$('ys97Access').addEventListener('click',openAdmin);
$('adminClose').addEventListener('click',closeAdmin);
$('adminBackdrop').addEventListener('click',closeAdmin);
document.addEventListener('keydown',e=>{
  if(adminDialog.hidden)return;
  if(e.key==='Escape'){closeAdmin();return;}
  if(e.key==='Tab'){
    const list=[...adminDialog.querySelectorAll('button,input,select,a[href]')].filter(x=>!x.disabled&&x.getClientRects().length);
    if(!list.length)return;
    if(e.shiftKey&&document.activeElement===list[0]){e.preventDefault();list.at(-1).focus();}
    else if(!e.shiftKey&&document.activeElement===list.at(-1)){e.preventDefault();list[0].focus();}
  }
});
$('adminLoginForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const candidate=$('adminCode').value;$('adminCode').value='';
  if(!window.crypto?.subtle){$('adminError').textContent='Ouvre le site dans Chrome ou Edge.';return;}
  const data=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(candidate));
  const hex=[...new Uint8Array(data)].map(n=>n.toString(16).padStart(2,'0')).join('');
  if(hex!==ACCESS_HASH){$('adminError').textContent='Code incorrect.';return;}
  adminUnlocked=true;$('adminLogin').hidden=true;$('adminWorkspace').hidden=false;
  fillAdmin();notify('MODE ÉDITION ACTIVÉ');$('newTitle').focus();
});
async function persist(message){
  try{await A.save(state);}catch(e){console.error(e);notify('Erreur de sauvegarde locale — exporte tes données');return false;}
  render();fillAdmin();if(message)notify(message);return true;
}
function selectFeatured(){
  const mapping={heroFrontSelect:'front',heroBackSelect:'back',heroF1Select:'f1',heroFootballSelect:'football'};
  const p=state.posters;
  for(const [id,key] of Object.entries(mapping)){
    const sel=$(id);sel.replaceChildren();
    const allowed=(key==='f1'?p.filter(x=>x.category==='Formule 1'):key==='football'?p.filter(x=>x.category==='Football'):p);
    allowed.forEach(v=>sel.add(new Option(`${v.title} — ${v.edition||'Originale'}`,v.id)));
    sel.value=allowed.some(x=>x.id===state.featured[key])?state.featured[key]:allowed[0]?.id||'';
  }
  previewFeatured();
}
function previewFeatured(){
  const area=$('featuredPreview');area.replaceChildren();
  for(const id of ['heroFrontSelect','heroBackSelect','heroF1Select','heroFootballSelect']){
    const item=state.posters.find(p=>p.id===$(id).value);
    if(!item)continue;
    const div=document.createElement('div');div.className='featured-thumb';
    const img=document.createElement('img');img.src=item.file;img.alt='';
    const caption=document.createElement('span');caption.textContent=({heroFrontSelect:'DEVANT',heroBackSelect:'DERRIÈRE',heroF1Select:'FORMULE 1',heroFootballSelect:'FOOTBALL'})[id];
    div.append(img,caption);area.append(div);
  }
}
for(const id of ['heroFrontSelect','heroBackSelect','heroF1Select','heroFootballSelect'])$(id).addEventListener('change',previewFeatured);
$('saveFeatured').addEventListener('click',async()=>{
  if(!adminUnlocked)return;
  state.featured={front:$('heroFrontSelect').value,back:$('heroBackSelect').value,
    f1:$('heroF1Select').value,football:$('heroFootballSelect').value};
  await persist('IMAGES À LA UNE MODIFIÉES');
});
function fillAdmin(){
  if(!adminUnlocked)return;
  const gs=getGroups();
  text('adminStats',`${gs.length} CRÉATIONS · ${state.posters.length} AFFICHES · LOGO YS97`);
  const sel=$('newGroup'),old=sel.value;
  sel.replaceChildren(new Option('Créer une nouvelle affiche / création',''));
  gs.forEach(g=>sel.add(new Option(`${g.title} — ajouter une édition (${g.variants.length})`,g.id)));
  sel.value=gs.some(g=>g.id===old)?old:'';
  selectFeatured();
  const list=$('adminItems');list.replaceChildren();
  gs.forEach(g=>{
    const container=document.createElement('section');container.className='admin-group';
    const title=document.createElement('h4');title.textContent=`${g.title} · ${g.variants.length} ÉDITION${g.variants.length>1?'S':''}`;container.append(title);
    g.variants.forEach(v=>{
      const row=document.createElement('div');row.className='admin-item';
      const image=document.createElement('img');image.src=v.file;image.alt='';image.loading='lazy';
      const fields=document.createElement('div');fields.className='admin-item-fields';
      const name=document.createElement('input');name.value=v.title;name.maxLength=90;name.setAttribute('aria-label','Titre de la création');
      const edition=document.createElement('input');edition.value=v.edition||'';edition.maxLength=90;edition.setAttribute('aria-label','Nom de l’édition');
      const rep=document.createElement('label');rep.className='admin-replace';rep.textContent='REMPLACER L’IMAGE';
      const file=document.createElement('input');file.type='file';file.accept='image/jpeg,image/png,image/webp';rep.append(file);
      const rowControls=document.createElement('div');rowControls.className='admin-item-controls';
      const saveBtn=document.createElement('button');saveBtn.type='button';saveBtn.className='admin-minor';saveBtn.textContent='ENREGISTRER';
      saveBtn.addEventListener('click',async()=>{
        const n=name.value.trim();if(!n){notify('Ajoute un titre');return;}
        for(const x of state.posters.filter(x=>(x.group||x.id)===g.id)){x.title=n;x.category=g.category;}
        v.edition=edition.value.trim()||'Édition originale';
        const uploaded=file.files[0];
        if(uploaded){
          if(!validImage(uploaded)){notify('Image JPG, PNG ou WEBP, 15 Mo maximum');return;}
          v.file=await A.readImage(uploaded);
        }
        await persist('CRÉATION MISE À JOUR');
      });
      const moveUp=document.createElement('button');moveUp.type='button';moveUp.className='admin-minor';moveUp.textContent='↑';moveUp.title='Avancer cette édition';
      moveUp.addEventListener('click',async()=>{
        const order=state.posters.filter(x=>(x.group||x.id)===g.id),at=order.indexOf(v);
        if(at===0)return;
        const prev=state.posters.indexOf(order[at-1]),now=state.posters.indexOf(v);
        [state.posters[prev],state.posters[now]]=[state.posters[now],state.posters[prev]];
        await persist('ORDRE DES ÉDITIONS MODIFIÉ');
      });
      const remove=document.createElement('button');remove.type='button';remove.className='admin-minor danger';remove.textContent='SUPPRIMER';
      remove.addEventListener('click',async()=>{
        if(!confirm(`Retirer l’édition « ${v.edition||v.title} » ?`))return;
        state.posters=state.posters.filter(x=>x.id!==v.id);
        await persist('ÉDITION RETIRÉE');
      });
      rowControls.append(saveBtn,moveUp,remove);fields.append(name,edition,rep,rowControls);row.append(image,fields);container.append(row);
    });
    list.append(container);
  });
}
function validImage(file){return !!file&&['image/jpeg','image/png','image/webp'].includes(file.type)&&file.size<=15*1024*1024;}
$('newGroup').addEventListener('change',()=>{
  const g=getGroups().find(x=>x.id===$('newGroup').value);
  if(g){$('newTitle').value=g.title;$('newCategory').value=g.category;}
});
$('uploadForm').addEventListener('submit',async e=>{
  e.preventDefault();if(!adminUnlocked)return;
  const image=$('newImage').files[0];
  if(!validImage(image)){text('uploadStatus','Fichier JPG / PNG / WEBP, 15 Mo maximum.');return;}
  const g=getGroups().find(g=>g.id===$('newGroup').value);
  const t=$('newTitle').value.trim();
  if(!t){text('uploadStatus','Ajoute le titre.');return;}
  text('uploadStatus','Import de ton image...');
  try{
    const file=await A.readImage(image);
    const id=`ys97-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    state.posters.push({id,group:g?g.id:id,file,title:g?g.title:t,category:g?g.category:$('newCategory').value,edition:$('newEdition').value.trim()||'Édition originale',search:t});
    const saved=await persist('NOUVELLE ÉDITION AJOUTÉE');
    $('uploadForm').reset();text('uploadStatus',saved?'Affiche ajoutée au brouillon. Clique sur PUBLIER POUR TOUT LE MONDE à la fin.':'Ajoutée mais sauvegarde locale indisponible.');
  }catch(err){console.error(err);text('uploadStatus','Erreur de lecture du fichier.');}
});
$('logoInput').addEventListener('change',async e=>{
  if(!adminUnlocked)return;
  const f=e.target.files[0];if(!f)return;
  if(!validImage(f)){text('logoStatus','Logo PNG / JPG / WEBP, max 15 Mo.');return;}
  state.logo=await A.readImage(f);await persist('LOGO REMPLACÉ');text('logoStatus','Nouveau logo enregistré.');
});
$('restoreLogo').addEventListener('click',async()=>{
  if(!adminUnlocked)return;
  state.logo='logo-ys97-header.png';await persist('LOGO YS97 RESTAURÉ');
});
// Publication sécurisée sur GitHub Pages : le token n'est lu qu'au clic et jamais stocké.
// Les images ajoutées dans l'éditeur sont envoyées comme fichiers séparés, pas dans affiches.js.
const GITHUB_OWNER='baracapy087-tech';
const GITHUB_REPO='ys97-project';
const GITHUB_BRANCH='main';
let publishing=false;
function setPublishStatus(message,kind=''){
  const el=$('publishStatus');el.textContent=message;
  el.classList.remove('error','success');if(kind)el.classList.add(kind);
}
function dataImageParts(value){
  if(typeof value!=='string')return null;
  const match=/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(value);
  if(!match)return null;
  return {mime:match[1].toLowerCase(),base64:match[2]};
}
function cleanImageFilename(id,mime){
  const extension=mime==='image/jpeg'?'jpg':mime==='image/png'?'png':'webp';
  // Limiter strictement les caractères dans les chemins envoyés à GitHub.
  const slug=String(id).replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,90);
  return `images/ys97-${slug}-${Date.now().toString(36)}.${extension}`;
}
function catalogJS(config){
  return '// YS97 : catalogue public (mis à jour depuis le mode édition)\n'
    +'window.YS97_AFFICHES = '+JSON.stringify(config.posters,null,2)+';\n'
    +'window.YS97_LOGO = '+JSON.stringify(config.logo)+';\n'
    +'window.YS97_FEATURED = '+JSON.stringify(config.featured,null,2)+';\n';
}
async function gitRequest(token,path,method='GET',data){
  const options={method,headers:{
    'Accept':'application/vnd.github+json',
    'Authorization':`Bearer ${token}`,
    'X-GitHub-Api-Version':'2022-11-28'
  },cache:'no-store'};
  if(data!==undefined){options.headers['Content-Type']='application/json';options.body=JSON.stringify(data);}
  let response;
  try{response=await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}${path}`,options);}
  catch(error){throw new Error('Connexion à GitHub impossible. Vérifie Internet et que tu es sur le site https://.');}
  if(!response.ok){
    let msg='';try{msg=(await response.json()).message||'';}catch(_){/* corps non JSON */}
    if(response.status===401)throw new Error('Token GitHub invalide ou expiré. Recrée une clé de publication.');
    if(response.status===403)throw new Error('GitHub refuse la publication. Vérifie que le token autorise ys97-project → Contents: Read and write.');
    if(response.status===404)throw new Error('Dépôt GitHub introuvable ou non autorisé par le token.');
    if(response.status===409||response.status===422)throw new Error('Le dépôt a changé pendant la publication. Actualise ton site avant de réessayer.');
    throw new Error(`GitHub a répondu ${response.status}${msg?' : '+msg:''}`);
  }
  return response.status===204?null:response.json();
}
async function publishDraftToGitHub(token){
  const basePath=''; // Dépôt déjà configuré dans GITHUB_OWNER / GITHUB_REPO.
  setPublishStatus('Connexion à GitHub et vérification du dépôt…');
  // Vérifier les droits AVANT d'envoyer les nouvelles images.
  const ref=await gitRequest(token,`/git/ref/heads/${GITHUB_BRANCH}`);
  const parentSha=ref.object.sha;
  const commit=await gitRequest(token,`/git/commits/${parentSha}`);
  const treeSha=commit.tree.sha;
  const publishState=structuredClone(state);
  const pending=[];
  let sequence=0;
  for(const item of publishState.posters){
    const data=dataImageParts(item.file);
    if(!data){
      if(typeof item.file==='string'&&item.file.startsWith('data:'))throw Error('Format d’image non pris en charge. Utilise JPG, PNG ou WEBP.');
      continue;
    }
    const path=cleanImageFilename(item.id+'-'+(sequence++),data.mime);
    pending.push({path,base64:data.base64});
    item.file=path;
  }
  const logoParts=dataImageParts(publishState.logo);
  if(logoParts){
    const path=cleanImageFilename('logo-personnalise',logoParts.mime);
    pending.push({path,base64:logoParts.base64});
    publishState.logo=path;
  }else if(typeof publishState.logo==='string'&&publishState.logo.startsWith('data:')){
    throw Error('Format du logo non pris en charge. Utilise JPG, PNG ou WEBP.');
  }
  const treeEntries=[];
  for(let i=0;i<pending.length;i++){
    const item=pending[i];
    setPublishStatus(`Envoi des images vers GitHub : ${i+1}/${pending.length}…`);
    const blob=await gitRequest(token,'/git/blobs','POST',{content:item.base64,encoding:'base64'});
    treeEntries.push({path:item.path,mode:'100644',type:'blob',sha:blob.sha});
  }
  // Écriture UTF-8 dans l'arbre Git : une seule validation pour tous les changements.
  treeEntries.push({path:'affiches.js',mode:'100644',type:'blob',content:catalogJS(publishState)});
  setPublishStatus('Création de la mise à jour publique…');
  const tree=await gitRequest(token,'/git/trees','POST',{base_tree:treeSha,tree:treeEntries});
  const nextCommit=await gitRequest(token,'/git/commits','POST',{
    message:`YS97 : publication de ${publishState.posters.length} affiches depuis le mode édition`,
    tree:tree.sha,parents:[parentSha]
  });
  await gitRequest(token,`/git/refs/heads/${GITHUB_BRANCH}`,'PATCH',{sha:nextCommit.sha,force:false});
  // Éviter qu'un ancien brouillon local masque le nouveau catalogue en ligne.
  // Il est supprimé seulement lorsque GitHub a confirmé la publication.
  try{await A.clear();}
  catch(e){console.warn('Le brouillon local n’a pas pu être effacé après publication',e);}
  // Afficher encore les aperçus locaux tant que Pages n'a pas fini son déploiement.
  setPublishStatus('✅ Publication envoyée à GitHub ! Le site public se met à jour en quelques minutes. Vérifie-le dans une fenêtre privée.','success');
  notify('PUBLICATION ENVOYÉE À GITHUB');
}
$('publishOnline').addEventListener('click',async()=>{
  if(!adminUnlocked||publishing)return;
  const token=$('githubToken').value.trim();
  if(!token){setPublishStatus('Crée ton token GitHub et colle-le dans le champ au-dessus.','error');$('githubToken').focus();return;}
  if(!confirm('Publier maintenant toutes tes modifications et nouvelles images sur YS97’s Project ?'))return;
  publishing=true;
  $('publishOnline').disabled=true;
  $('publishOnline').textContent='PUBLICATION EN COURS…';
  try{await publishDraftToGitHub(token);}
  catch(e){console.error('Erreur de publication',e);setPublishStatus(`❌ ${e.message}`,'error');}
  finally{
    $('githubToken').value=''; // Aucun stockage permanent du secret.
    publishing=false;$('publishOnline').disabled=false;
    $('publishOnline').textContent='↗ PUBLIER POUR TOUT LE MONDE';
  }
});

$('exportConfig').addEventListener('click',()=>{
  if(!adminUnlocked)return;
  A.exportData(state);notify('FICHIER AFFICHES.JS EXPORTÉ');
});
$('resetLocal').addEventListener('click',async()=>{
  if(!adminUnlocked||!confirm('Effacer ton brouillon local et revenir aux affiches publiées ?'))return;
  await A.clear();state=structuredClone(A.initial);
  render();fillAdmin();notify('BROUILLON RÉINITIALISÉ');
});
(async()=>{state=await A.load();render();})();
})();
