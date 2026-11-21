(() => {
'use strict';
const A=window.YS97_APP,$=id=>document.getElementById(id);
let state,series,activeId,viewerFocus;
const qs=new URLSearchParams(location.search);
const requestedSeries=qs.get('serie'),requestedVariant=qs.get('version');
function notice(msg){const t=$('toast');t.textContent=msg;t.classList.add('visible');setTimeout(()=>t.classList.remove('visible'),2600);}
function renderOptions(){
  const grid=$('detailEditions'),thumbs=$('detailThumbnails');
  grid.replaceChildren();thumbs.replaceChildren();
  series.variants.forEach((v,i)=>{
    const active=v.id===activeId;
    const btn=document.createElement('button');btn.type='button';btn.className='edition-swatch';btn.classList.toggle('selected',active);
    btn.setAttribute('aria-pressed',String(active));btn.setAttribute('aria-label',`Afficher ${v.edition||'Édition '+(i+1)}`);
    const image=document.createElement('img');image.src=v.file;image.alt='';
    const label=document.createElement('span');label.textContent=v.edition||`Édition ${i+1}`;
    btn.append(image,label);btn.addEventListener('click',()=>select(v.id));grid.append(btn);
    const mini=document.createElement('button');mini.type='button';mini.className='detail-thumbnail';mini.classList.toggle('selected',active);
    mini.setAttribute('aria-label',`Afficher ${v.edition||'Édition '+(i+1)}`);mini.setAttribute('aria-pressed',String(active));
    const img=document.createElement('img');img.src=v.file;img.alt='';mini.append(img);
    mini.addEventListener('click',()=>select(v.id));thumbs.append(mini);
  });
}
function select(id,noHistory=false){
  const variant=series?.variants.find(v=>v.id===id);if(!variant)return;
  activeId=id;
  const large=$('detailImage');large.src=variant.file;large.alt=`Affiche ${series.title}, ${variant.edition}`;
  $('viewerImage').src=variant.file;$('viewerImage').alt=large.alt;
  $('selectedEdition').textContent=variant.edition||'Édition originale';
  renderOptions();
  const url=new URL(location.href);url.searchParams.set('serie',series.id);url.searchParams.set('version',id);
  if(!noHistory){try{history.pushState(null,'',url);}catch(e){/* Compatible ouverture locale */}}
}
function otherProjects(){
  const host=$('moreGrid');host.replaceChildren();
  const gs=A.groups(state.posters).filter(g=>g.id!==series.id).slice(0,4);
  for(const g of gs){
    const a=document.createElement('a');a.href=A.link(g.id);a.className='more-item';
    const pic=document.createElement('div');pic.className='more-picture';
    const img=document.createElement('img');img.src=g.variants[0].file;img.alt=`Affiche ${g.title}`;img.loading='lazy';pic.append(img);
    const name=document.createElement('strong');name.textContent=g.title;
    const cat=document.createElement('small');cat.textContent=`${g.category.toUpperCase()} · ${g.variants.length} ÉDITION${g.variants.length>1?'S':''}`;
    a.append(pic,name,cat);host.append(a);
  }
}
function openViewer(){viewerFocus=document.activeElement;$('detailViewer').hidden=false;document.body.classList.add('modal-open');$('closeViewer').focus();}
function closeViewer(){$('detailViewer').hidden=true;document.body.classList.remove('modal-open');if(viewerFocus?.isConnected)viewerFocus.focus();}
$('zoomImage').addEventListener('click',openViewer);
$('seeLarge').addEventListener('click',openViewer);
$('detailImage').addEventListener('click',openViewer);
$('closeViewer').addEventListener('click',closeViewer);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('detailViewer').hidden){closeViewer();return;}
  if(!$('detailViewer').hidden)return;
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
    if(!series)return;
    const i=series.variants.findIndex(v=>v.id===activeId);
    select(series.variants[(i+(e.key==='ArrowRight'?1:-1)+series.variants.length)%series.variants.length].id);
  }
});
$('copyLink').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(location.href);notice('LIEN DE L’ÉDITION COPIÉ');}
  catch(e){notice('COPIE LE LIEN DE LA BARRE D’ADRESSE');}
});
window.addEventListener('popstate',()=>{
  const v=new URLSearchParams(location.search).get('version');
  if(v&&series?.variants.some(x=>x.id===v))select(v,true);
});
(async()=>{
  state=await A.load();
  const gs=A.groups(state.posters);
  series=gs.find(g=>g.id===requestedSeries)||gs.find(g=>g.variants.some(x=>x.id===requestedVariant));
  if(!series){$('notFound').hidden=false;return;}
  $('detailMain').hidden=false;
  document.title=`${series.title} — YS97's Project`;
  const mark=$('detailBrandMark');mark.replaceChildren();
  const image=document.createElement('img');image.src=state.logo||'logo-ys97-header.png';image.alt='YS97';image.className='actual-logo';mark.append(image);
  A.logo($('detailFooterLogo'),state.logo);
  $('detailTitle').textContent=series.title.toUpperCase();
  $('detailCategory').textContent=`${series.category.toUpperCase()} / AFFICHE`;
  $('crumbCategory').textContent=series.category.toUpperCase();$('crumbTitle').textContent=series.title.toUpperCase();
  $('editionCount').textContent=`${String(series.variants.length).padStart(2,'0')} ÉDITION${series.variants.length>1?'S':''}`;
  $('detailYear').textContent=String(new Date().getFullYear());
  select(series.variants.some(v=>v.id===requestedVariant)?requestedVariant:series.variants[0].id,true);
  otherProjects();
})();
})();
