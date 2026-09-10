/* Northline — static build. Reads data/, writes index.html. No dependencies. */
import { readFileSync, writeFileSync } from 'node:fs';

const site = JSON.parse(readFileSync('data/site.json','utf8'));
const data = JSON.parse(readFileSync('data/listings.json','utf8'));
const L = data.listings;

const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const telRaw = site.phone.replace(/[^\d+]/g,'');
const uniq = k => [...new Set(L.map(x=>x[k]))].sort();

const HOODS = uniq('neighborhood').map(h=>`<option value="${esc(h)}">${esc(h)}</option>`).join('');
const TYPES = uniq('type').map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('');
const STATS = site.stats.map(s=>`<div><b>${esc(s.n)}</b><span>${esc(s.l)}</span></div>`).join('');

const d = site.demo || {};
const DEMOBAR = d.show ? `<div class="demo-bar" role="note"><p>${esc(d.text)}</p><span class="sep">&middot;</span>
  <a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.linkText)}</a></div>` : '';
const DEMOFOOT = d.show ? `<div class="demo-foot">${esc(d.text)}
  <a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.linkText)}</a></div>` : '';

const JSONLD = JSON.stringify({
  '@context':'https://schema.org','@type':'RealEstateAgent',
  name:`${site.name} — ${site.agent}`, description:site.intro,
  telephone:site.phone, email:site.email, areaServed:site.city,
  address:{'@type':'PostalAddress',streetAddress:site.office.line1,addressLocality:site.city}
});

const SCRIPT = `<script>
var LISTINGS = ${JSON.stringify(L)};
document.getElementById('yr').textContent = new Date().getFullYear();

var nav=document.getElementById('nav');
addEventListener('scroll',function(){nav.classList.toggle('stuck',scrollY>12)},{passive:true});
if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
  var io=new IntersectionObserver(function(es){es.forEach(function(e){
    if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.05});
  document.querySelectorAll('.rv').forEach(function(el){io.observe(el)});
}else{document.querySelectorAll('.rv').forEach(function(el){el.classList.add('in')})}

var money=function(n){return '$'+n.toLocaleString('en-US')};
var el=function(id){return document.getElementById(id)};
var cards=el('cards'), detail=el('detail');

/* ---------- map ---------- */
var map=null, markers={};
if (window.L && L.map) {
  map = L.map('map',{scrollWheelZoom:false}).setView([41.905,-87.665],11.6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:18, attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
  LISTINGS.forEach(function(p){
    var m=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'',
      html:'<span class="pin'+(p.status==='sold'?' sold':'')+'" data-id="'+p.id+'">'+money(p.price)+'</span>',
      iconSize:null})}).addTo(map);
    m.on('click',function(){ focus(p.id,true) });
    markers[p.id]=m;
  });
}

/* ---------- filtering ---------- */
function current(){
  var hood=el('f-hood').value, type=el('f-type').value,
      beds=+el('f-beds').value, status=el('f-status').value, max=+el('f-price').value;
  return LISTINGS.filter(function(p){
    return (!hood||p.neighborhood===hood) && (!type||p.type===type) &&
           (!beds||p.beds>=beds) && (!status||p.status===status) && p.price<=max;
  });
}
function render(){
  var list=current();
  el('count').textContent=list.length;
  el('countNote').textContent = list.length===LISTINGS.length ? '' : ' of '+LISTINGS.length;
  el('priceRange').textContent = list.length
    ? money(Math.min.apply(null,list.map(function(p){return p.price})))+' to '+money(Math.max.apply(null,list.map(function(p){return p.price})))
    : '';
  cards.innerHTML = list.length ? list.map(function(p){
    return '<article class="card" data-id="'+p.id+'" tabindex="0">'+
      '<div class="im"><img src="assets/img/'+p.image+'.webp" alt="'+p.address+'" loading="lazy" width="900" height="653">'+
      '<span class="tagpill '+p.status+'">'+p.status+'</span></div>'+
      '<div class="bd"><p class="pr">'+money(p.price)+'</p>'+
      '<p class="ad">'+p.address+'</p><p class="nb">'+p.neighborhood+'</p>'+
      '<div class="sp"><span><b>'+p.beds+'</b> bd</span><span><b>'+p.baths+'</b> ba</span>'+
      '<span><b>'+p.sqft.toLocaleString('en-US')+'</b> sq ft</span><span>'+p.type+'</span></div>'+
      '</div></article>' }).join('')
    : '<p class="empty">No homes match those filters. Try widening the price or clearing the neighborhood.</p>';

  var ids={}; list.forEach(function(p){ids[p.id]=1});
  Object.keys(markers).forEach(function(id){
    var m=markers[id];
    if(ids[id]){ if(!map.hasLayer(m)) m.addTo(map) } else { if(map.hasLayer(m)) map.removeLayer(m) }
  });
  if(map && list.length){ map.fitBounds(list.map(function(p){return [p.lat,p.lng]}),{padding:[42,42],maxZoom:14}) }
  detail.hidden=true;
}
function focus(id,fromMap){
  var p=LISTINGS.find(function(x){return x.id===id}); if(!p) return;
  document.querySelectorAll('.card').forEach(function(c){c.classList.toggle('hl',c.dataset.id===id)});
  document.querySelectorAll('.pin').forEach(function(s){s.classList.toggle('on',s.dataset.id===id)});
  detail.hidden=false;
  detail.innerHTML='<h3>'+p.address+'</h3><p class="nb" style="color:var(--faint);font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;margin:0 0 .6rem">'+
    p.neighborhood+' &middot; '+p.type+' &middot; '+p.status+'</p><p style="margin:0;color:var(--soft)">'+p.blurb+'</p>'+
    '<ul class="feat">'+p.features.map(function(f){return '<li>'+f+'</li>'}).join('')+'</ul>';
  var card=document.querySelector('.card[data-id="'+id+'"]');
  if(fromMap && card) card.scrollIntoView({behavior:'smooth',block:'center'});
}
cards.addEventListener('click',function(e){ var c=e.target.closest('.card'); if(c) focus(c.dataset.id) });
cards.addEventListener('keydown',function(e){
  if(e.key!=='Enter'&&e.key!==' ') return;
  var c=e.target.closest('.card'); if(c){ e.preventDefault(); focus(c.dataset.id) }
});

['f-hood','f-type','f-beds','f-status'].forEach(function(id){ el(id).addEventListener('change',render) });
el('f-price').addEventListener('input',function(){
  el('f-price-out').textContent = +this.value >= +this.max ? 'any' : money(+this.value);
  render();
});
el('f-reset').addEventListener('click',function(){
  el('f-hood').value=''; el('f-type').value=''; el('f-beds').value='0'; el('f-status').value='';
  el('f-price').value=el('f-price').max; el('f-price-out').textContent='any'; render();
});
render();

/* ---------- lead form ---------- */
el('lead').addEventListener('submit',function(e){
  e.preventDefault();
  var f=this, name=f.name.value.trim(), mail=f.email.value.trim();
  if(!name||!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(mail)){
    var bad=!name?f.name:f.email; bad.focus(); bad.style.borderColor='var(--clay)'; return;
  }
  var ok=f.querySelector('.form-ok');
  if(!ok){ ok=document.createElement('p'); ok.className='form-ok'; f.insertBefore(ok,f.querySelector('button')) }
  ok.textContent='Thanks '+name+'. In production this would reach '+${JSON.stringify(site.email)}+'. Nothing was sent from this demo.';
});
</script>`;

const vars = {
  NAME:esc(site.name), TAGLINE:esc(site.tagline), AGENT:esc(site.agent), ROLE:esc(site.role),
  FIRST:esc(site.agent.split(' ')[0]), CITY:esc(site.city), LICENSE:esc(site.license),
  INTRO:esc(site.intro), INTRO_SHORT:esc(site.intro.split('. ').slice(0,2).join('. ')+'.'),
  PHONE:esc(site.phone), PHONE_RAW:telRaw, EMAIL:esc(site.email),
  OFF1:esc(site.office.line1), OFF2:esc(site.office.line2),
  HOODS, TYPES, STATS, DEMOBAR, DEMOFOOT, SCRIPT, JSONLD
};
const out = readFileSync('src/index.template.html','utf8')
  .replace(/\{\{(\w+)\}\}/g,(m,k)=> k in vars ? vars[k] : (console.warn('  ! unknown token',k),m));
writeFileSync('index.html', out);
console.log(`  built index.html`);
console.log(`  ${L.length} listings, ${uniq('neighborhood').length} neighborhoods, ${uniq('type').length} types`);
