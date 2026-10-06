
/* ---------- camera ---------- */
const VIEWS={all:{tx:20,tz:40,dist:520,az:.66,el:.63},b1:{tx:-62,tz:4,dist:215,el:.63},b2:{tx:62,tz:4,dist:215,el:.63},yard:{tx:0,tz:66,dist:300,el:.63},gate:{tx:8,tz:130,dist:175,el:.63},
  bay:{tx:30,tz:60,dist:760,az:2.62,el:.085},west:{tx:10,tz:-30,dist:560,az:-1.2,el:.1},tugs:{tx:-150,tz:10,dist:250,az:2.2,el:.4}};
const view={tx:20,tz:40,dist:520,az:.66,el:.63},cur=Object.assign({},view);let W=1,H=1,narrow=1,shiftT=0,shiftC=0;
function applyCam(){const ce=Math.cos(cur.el),d=cur.dist*narrow,fv=18+15*sstep(.46,.07,cur.el);if(Math.abs(fv-cam.fov)>.02){cam.fov=fv;cam.updateProjectionMatrix();}   // the lens opens up as the view drops to the horizon, so the sky comes into frame
  cam.position.set(cur.tx+d*Math.sin(cur.az)*ce,d*Math.sin(cur.el),cur.tz+d*Math.cos(cur.az)*ce);const gh=terrainH(cam.position.x,cam.position.z)+22;if(cam.position.y<gh)cam.position.y=gh;cam.lookAt(cur.tx,0,cur.tz);
  if(Math.abs(shiftC)>1)cam.setViewOffset(W,H,-shiftC,0,W,H);else if(cam.view)cam.clearViewOffset();
  // haze: further when looking towards the horizon, closer in rain and fog
  const reach=Math.min(Math.max(900,d*3)+5200*sstep(.55,.1,cur.el),wx.vis);
  cam.updateMatrixWorld();scene.fog.near=d*.95*(1-.7*wx.mist)*(1-.3*sstep(.5,.14,cur.el));scene.fog.far=d*.95+reach;}
function resize(){W=app.clientWidth||1;H=app.clientHeight||1;renderer.setSize(W,H,false);cam.aspect=W/H;narrow=clamp(1.5/cam.aspect,1,2.1);cam.updateProjectionMatrix();setShift();applyCam();}
function setShift(){const w=$('#work');shiftT=(!w.hidden&&W>1100&&!app.classList.contains('x-all'))?w.offsetWidth/2:0;}
const ray=new T.Raycaster(),ndc=new T.Vector2(),gp=new T.Plane(V(0,1,0),0);
const groundAt=(cx,cy)=>{const r=canvas.getBoundingClientRect();ndc.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);ray.setFromCamera(ndc,cam);const p=V(0,0,0);return ray.ray.intersectPlane(gp,p)?p:null;};
function pickAt(cx,cy){const r=canvas.getBoundingClientRect();ndc.set((cx-r.left)/r.width*2-1,-(cy-r.top)/r.height*2+1);ray.setFromCamera(ndc,cam);
  const list=[CIM];for(const e of ents)if(e.group&&e.active!==false)list.push(e.group);
  const hits=ray.intersectObjects(list,true);
  for(const h of hits){if(h.object===CIM){const b=boxAt[h.instanceId];if(b)return b;continue;}let o=h.object;while(o&&!o.userData.ent)o=o.parent;if(o)return o.userData.ent;}return null;}
const ptrs=new Map();let grab=null,moved=0,pinch=null,follow=false;
const DMIN=70,DMAX=1500,ELMIN=.045,ELMAX=1.3;
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,b:e.button,sh:e.shiftKey});moved=0;
  if(ptrs.size===1){grab=groundAt(e.clientX,e.clientY);canvas.classList.add('drag');}
  else if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),a:Math.atan2(b.y-a.y,b.x-a.x),dist:view.dist,az:view.az};grab=null;}});
canvas.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);
  if(!p){hoverAt=[e.clientX,e.clientY];return;}
  const dx=e.clientX-p.x,dy=e.clientY-p.y;moved+=Math.abs(dx)+Math.abs(dy);p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size===2&&pinch){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),an=Math.atan2(b.y-a.y,b.x-a.x);view.dist=clamp(pinch.dist*pinch.d/d,DMIN,DMAX);view.az=pinch.az-(an-pinch.a);return;}
  if(p.b===2||p.b===1||p.sh){view.az-=dx*.006;cur.az=view.az;view.el=clamp(view.el+dy*.004,ELMIN,ELMAX);cur.el=view.el;applyCam();return;}
  if(grab&&moved>4){follow=false;const g=groundAt(e.clientX,e.clientY);if(g){view.tx=clamp(view.tx+grab.x-g.x,-1300,2700);view.tz=clamp(view.tz+grab.z-g.z,-2400,700);cur.tx=view.tx;cur.tz=view.tz;applyCam();}}});
const up=e=>{const p=ptrs.get(e.pointerId);ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(!ptrs.size){canvas.classList.remove('drag');if(p&&moved<6&&e.type==='pointerup'&&p.b===0)select(pickAt(e.clientX,e.clientY),false);}};
canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('pointerleave',()=>{hoverAt=null;hov=null;});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();view.dist=clamp(view.dist*Math.exp(e.deltaY*.0012),DMIN,DMAX);},{passive:false});
$('.ctl').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const c=b.dataset.c;
  if(c==='in')view.dist=clamp(view.dist*.75,DMIN,DMAX);else if(c==='out')view.dist=clamp(view.dist/.75,DMIN,DMAX);else if(c==='left')view.az+=Math.PI/6;else if(c==='right')view.az-=Math.PI/6;else if(c==='up')view.el=clamp(view.el+.16,ELMIN,ELMAX);else if(c==='down')view.el=clamp(view.el-.16,ELMIN,ELMAX);
  else{follow=false;Object.assign(view,VIEWS.all);$('#view').value='all';}});
$('#view').addEventListener('change',e=>{follow=false;Object.assign(view,VIEWS[e.target.value]);});
function flyTo(e){const f=e.frame();view.tx=f.x;view.tz=f.z;view.dist=e.kind==='vessel'?270:e.kind==='sts'?210:e.kind==='rtg'?175:125;}

/* ---------- selection ---------- */
let sel=null,hov=null,hoverAt=null,tracked=null,brk=null,yardSel=null;
const brkMat=new T.MeshBasicMaterial({color:new T.Color(0xff6a2a),fog:false,toneMapped:false,depthTest:false,transparent:true}),padMat=new T.MeshBasicMaterial({color:new T.Color(0xff6a2a),transparent:true,opacity:.22,depthWrite:false,fog:false,toneMapped:false});
function brackets(d){const [dx,dy,dz]=d,g=new T.Group(),B=new Builder(),L=clamp(Math.min(dx,dy,dz)*.28,.9,4),th=clamp(Math.max(dx,dy,dz)*.011,.1,.4);
  for(const sx of [-1,1])for(const sy of [-1,1])for(const sz of [-1,1]){const x=sx*dx/2,y=sy*dy/2,z=sz*dz/2;B.box(brkMat,L,th,th,x-sx*L/2,y,z);B.box(brkMat,th,L,th,x,y-sy*L/2,z);B.box(brkMat,th,th,L,x,y,z-sz*L/2);}
  const m=B.build(false);m.children.forEach(c=>{c.receiveShadow=false;c.renderOrder=20;});g.add(m);
  if(dy<6){const p=new T.Mesh(new T.PlaneGeometry(dx+1.2,dz+1.2),padMat);p.rotation.x=-Math.PI/2;p.position.y=-dy/2+.12;g.add(p);}
  return g;}
function select(e,fly){sel=e&&!e.dead?e:null;if(brk){scene.remove(brk);brk.traverse(o=>{if(o.geometry)o.geometry.dispose();});brk=null;}
  if(sel){const f=sel.frame();brk=brackets(f.d);scene.add(brk);if(sel.kind==='vessel')tracked=sel;else if(sel.berth&&sel.berth.vessel)tracked=sel.berth.vessel;
    if(sel.kind==='box'&&sel.where==='yard')yardSel=sel.ref;
    follow=!!fly&&(sel.kind==='truck'||sel.kind==='vessel'||sel.kind==='tug');if(fly)flyTo(sel);}
  else follow=false;
  app.classList.toggle('has-sel',!!sel);uiTick(true);}
const tagBox=$('#tags'),mkTag=c=>{const d=document.createElement('div');d.className='tag '+c;d.hidden=true;tagBox.appendChild(d);return d;};
const tagSel=mkTag('sel'),tagHov=mkTag('hov'),tagV=[mkTag('ves'),mkTag('ves')],_v=V(0,0,0);
const geoTags=GEO.map(g=>{const d=mkTag('geo');d.textContent=g.t;return d;});
// place names fade in once the view is wide or low enough to show the surroundings
function syncGeo(){const on=cur.dist>430||cur.el<.42;GEO.forEach((g,i)=>{const el=geoTags[i];_v.set(g.x,g.y,g.z).project(cam);if(!on||_v.z>1||Math.abs(_v.x)>1.05||Math.abs(_v.y)>1.05){el.hidden=true;return;}el.hidden=false;el.style.transform=`translate(${((_v.x*.5+.5)*W).toFixed(1)}px,${((-_v.y*.5+.5)*H).toFixed(1)}px) translate(-50%,-50%)`;});}
function place(el,e,html){if(!e){el.hidden=true;return;}e.center(_v).project(cam);if(_v.z>1||Math.abs(_v.x)>1.1||Math.abs(_v.y)>1.1){el.hidden=true;return;}
  el.hidden=false;if(el._h!==html){el._h=html;el.innerHTML=html;}el.style.transform=`translate(${((_v.x*.5+.5)*W).toFixed(1)}px,${((-_v.y*.5+.5)*H).toFixed(1)}px) translate(-50%,-100%)`;}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const statusOf=e=>e.kind==='box'?({yard:'In yard',ship:'On vessel',truck:'On truck',hook:'On hook'}[e.where]):e.status;

/* ---------- HUD helpers ---------- */
const IC={vessel:'<path d="M2.5 12.5l1.6 4h11.8l1.6-4M5 12.5V8h10v4.5M8 8V5h4v3M10 5V3"/>',tug:'<path d="M2.5 12l1.4 4h11.6l2-4zM6 12V8.5h6V12M8 8.5V6h3v2.5M9.5 6V3.5M14 12V9.5h2"/>',sts:'<path d="M5 17V4l10 3M5 7h8M12 7v5M10.5 12h3v2h-3zM3 17h5"/>',rtg:'<path d="M4 17V5h12v12M4 8h12M10 8v4M8 12h4v2.5H8zM2.5 17h3M14.5 17h3"/>',
  truck:'<path d="M2 6h9v8H2zM11 9h4l3 3v2h-7"/><circle cx="5.5" cy="14.5" r="1.5"/><circle cx="14.5" cy="14.5" r="1.5"/>',box:'<path d="M2.5 6.5h15v8h-15zM6 6.5v8M9.5 6.5v8M13 6.5v8"/>',
  terminal:'<path d="M3 4h14v12H3zM3 8h14M3 12h14M8 4v12M12.5 4v12"/>',locate:'<circle cx="10" cy="10" r="3"/><path d="M10 2.5v3M10 14.5v3M2.5 10h3M14.5 10h3"/>',close:'<path d="M5 5l10 10M15 5L5 15"/>',
  follow:'<path d="M4 16L16 4M16 4H9M16 4v7"/>',anchor:'<circle cx="10" cy="5" r="1.8"/><path d="M10 7v10M5 12a5 5 0 0010 0M7 9.5h6"/>',check:'<path d="M5 10.5l3.2 3.2L15 7"/>',flag:'<path d="M5 17V4h9l-2 3.5 2 3.5H5"/>'};
const svg=(k,c='i')=>`<svg class="${c}" viewBox="0 0 20 20">${IC[k]}</svg>`;
const TONE={Discharging:'good',Loading:'good',Hoisting:'good',Lowering:'good',Stacking:'good','Loading truck':'good','Trolley out':'good','Trolley in':'good','Trolley travel':'good','Gantry travel':'sea',Rehandling:'warn',
  'Waiting for truck':'warn','Gate check':'warn','Gate out':'warn',Mooring:'warn',Berthing:'sea',Arriving:'sea',Departing:'sea',Inbound:'sea','Tugs made fast':'sea',Swinging:'sea',Unberthing:'sea','Awaiting tugs':'warn','Standing by':'idle','Standing off':'idle',Completed:'idle',Idle:'idle',Standby:'idle','Boom up':'idle','Lowering boom':'sea',
  'In yard':'idle','On vessel':'sea','On truck':'good','On hook':'accent',Operational:'good',Cleared:'good',Pending:'warn',Inspection:'vio',Hold:'bad',Booked:'sea','At gate':'warn','In terminal':'good',Cancelled:'bad',Expected:'idle'};
const tone=s=>TONE[s]||(/^Towing|^Pushing|^Pulling|^Alongside|^Escorting/.test(s)?'good':/patrol|Checking|Standing|^Proceeding|^Returning|^Waiting for MV/.test(s)?'sea':/^Under|^At RTG/.test(s)?'warn':/^To |Arriving|Leaving|Delivering|Collecting|Repositioning/.test(s)?'sea':'idle');
const pill=s=>`<span class="pill ${tone(s)}">${esc(s)}</span>`;
const kv=rows=>'<dl class="kv">'+rows.map(([k,v,m])=>`<div><dt>${k}</dt><dd${m?' class="mono"':''}>${v}</dd></div>`).join('')+'</dl>';
const head=(icon,eyebrow,title,sub,mono)=>`<div class="ihead"><div class="iicon">${svg(icon)}</div><div class="ititle"><small>${esc(eyebrow)}</small><b${mono?' class="mono"':''}>${esc(title)}</b><span>${esc(sub)}</span></div><div class="iact"><button data-a="locate" aria-label="Centre on this">${svg('locate')}</button><button data-a="follow" class="${follow?'on':''}" aria-label="Follow" aria-pressed="${follow}">${svg('follow')}</button><button data-a="close" aria-label="Close">${svg('close')}</button></div></div>`;
const prog=(a,b,cls='')=>`<div class="prog"><div class="bar ${cls}"><i style="width:${b?Math.round(a/b*100):0}%"></i></div>${a}/${b}</div>`;
const key=e=>e.kind==='box'?'b'+e.i:'e'+ents.indexOf(e),fromKey=k=>k[0]==='b'?boxAt[+k.slice(1)]:ents[+k.slice(1)];
const link=(e,txt)=>e&&!e.dead?`<a data-go="${key(e)}">${esc(txt||e.label)}</a>`:(e?esc(txt||e.label):'—');
const dwellTxt=b=>{if(b.where!=='yard')return '—';const h=dwellH(b);return h>=24?`${Math.floor(h/24)} d ${Math.floor(h%24)} h`:`${Math.floor(h)} h`;};
const locText=b=>{const r=b.ref;return b.where==='yard'?`${slotName(r)} · T${r.items.indexOf(b)+1}`:b.where==='ship'?r.name:r?r.id:'—';};
const hexCss=h=>'#'+h.toString(16).padStart(6,'0');
const boxCss=b=>{const h=SCHEME[colorBy](b),r=h>>16&255,g=h>>8&255,bl=h&255;return `background:${hexCss(h)};color:${r*.3+g*.59+bl*.11>150?'#1c191f':'#fff'}`;};
const tpl=document.createElement('template');
function sync(a,b){const ac=a.childNodes,bc=b.childNodes;
  if(ac.length!==bc.length){a.replaceChildren(...[...bc].map(n=>n.cloneNode(true)));return;}
  for(let i=0;i<bc.length;i++){const x=ac[i],y=bc[i];
    if(x.nodeType!==y.nodeType||x.nodeName!==y.nodeName){a.replaceChild(y.cloneNode(true),x);continue;}
    if(x.nodeType===3){if(x.data!==y.data)x.data=y.data;continue;}
    if(x.nodeType===1){for(const at of [...x.attributes])if(!y.hasAttribute(at.name))x.removeAttribute(at.name);for(const at of y.attributes)if(x.getAttribute(at.name)!==at.value)x.setAttribute(at.name,at.value);sync(x,y);}}}
// patch in place so buttons keep focus and clicks are never lost to a re-render
const setH=(el,h)=>{if(el&&el._h!==h){el._h=h;tpl.innerHTML=h;sync(el,tpl.content);}};
let toastT=0;function toast(msg){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{t.hidden=true;},3800);}
const go=k=>{const t=fromKey(k);if(t&&!t.dead)select(t,true);};
/* show / hide panels */
const PANELS=[['kpis','Key figures'],['insp','Terminal overview'],['tracker','Vessel call'],['lists','Equipment and activity']],HID=new Set();
// first visit starts quiet: only the key figures are open, the rest wait as chips
{let saved=null;try{saved=JSON.parse(localStorage.getItem('tideline.panels.v2'));}catch(e){}(Array.isArray(saved)?saved:['insp','tracker','lists']).forEach(k=>{if(PANELS.some(p=>p[0]===k))HID.add(k);});}
function applyPanels(){for(const [k] of PANELS)app.classList.toggle('x-'+k,HID.has(k));const all=HID.has('all');app.classList.toggle('x-all',all);$('#pbtn').classList.toggle('on',all);
  try{localStorage.setItem('tideline.panels.v2',JSON.stringify([...HID].filter(k=>k!=='all')));}catch(e){}
  const ck='<svg class="i" viewBox="0 0 20 20"><path d="M5 10.5l3.2 3.2L15 7"/></svg>';
  $('#pmenu').innerHTML=PANELS.map(([k,l])=>`<button role="menuitemcheckbox" aria-checked="${!HID.has(k)}" data-pt="${k}">${ck}${l}</button>`).join('')+`<hr><button role="menuitemcheckbox" aria-checked="${all}" data-pt="all">${ck}Hide everything<kbd>H</kbd></button>`;
  setShift();}
function setPanel(k,show){if(show)HID.delete(k);else HID.add(k);if(k!=='all'&&show)HID.delete('all');applyPanels();}
$('#pbtn').addEventListener('click',()=>{const m=$('#pmenu');m.hidden=!m.hidden;$('#feed').hidden=true;$('#skymenu').hidden=true;});
$('#skybtn').addEventListener('click',()=>{const m=$('#skymenu');m.hidden=!m.hidden;$('#feed').hidden=true;$('#pmenu').hidden=true;skyUI();});
$('#skymenu').addEventListener('click',e=>{if(e.target.closest('#skyhold')){setHold(sky.hold===null);skyUI();return;}const b=e.target.closest('[data-v]');if(!b)return;if(b.parentNode.dataset.k==='tod')setTimeOfDay(b.dataset.v);else setWeather(b.dataset.v);skyTick(0);uiTick(true);});
const SHIFTS=[[6,'Shift A · 06:00–14:00'],[14,'Shift B · 14:00–22:00'],[22,'Shift C · 22:00–06:00']];
function skyUI(){const hd=sky.hold!==null,hb=$('#skyhold');if(hb.getAttribute('aria-checked')!==String(hd)){hb.setAttribute('aria-checked',hd);hb.lastChild.textContent=hd?'On':'Off';}
  const h=skyHour(),p=periodOf(h),t=p+' · '+WXN[wx.name]+(hd?' · held':'');if($('#skylbl').textContent!==t)$('#skylbl').textContent=t;
  const tod=h>=5.2&&h<11?'morning':h<13.5&&h>=11?'noon':h>=13.5&&h<17.6?'afternoon':'night';
  for(const b of $('#skymenu').querySelectorAll('[data-v]'))b.classList.toggle('on',b.dataset.v===(b.parentNode.dataset.k==='tod'?tod:wx.name));
  const hc=hourNow(),sh=hc>=6&&hc<14?SHIFTS[0][1]:hc>=14&&hc<22?SHIFTS[1][1]:SHIFTS[2][1];if($('#shift').textContent!==sh)$('#shift').textContent=sh;}
$('#pmenu').addEventListener('click',e=>{const b=e.target.closest('[data-pt]');if(!b)return;const k=b.dataset.pt;if(k==='all')setPanel('all',HID.has('all'));else setPanel(k,HID.has(k));});
app.addEventListener('click',e=>{const mn=e.target.closest('[data-min]'),op=e.target.closest('[data-open]');if(mn)return setPanel(mn.dataset.min,false);if(op)return setPanel(op.dataset.open,true);
  const g=e.target.closest('[data-go]');if(g&&g.dataset.go){go(g.dataset.go);}});

/* ---------- inspector ---------- */
function yardFigures(){let n=0,reef=0,hold=0,dg=0,dw=0;for(const b of blocks)for(const s of b.stacks)for(const x of s.items){n++;if(x.reefer)reef++;if(x.customs==='Hold'||x.customs==='Inspection')hold++;if(x.dg)dg++;dw+=dwellH(x);}return {n,reef,hold,dg,dw:n?dw/n:0};}
function card(e){
  if(!e){const occ=yard.count(),q=cranes.filter(c=>c.kind==='sts'),r=cranes.filter(c=>c.kind==='rtg');
    return `<div class="ihead"><div class="iicon">${svg('terminal')}</div><div class="ititle"><small>Terminal · VCT</small><b>Vàm Chiều Terminal</b><span>2 berths · 4 quay cranes · 6 yard gantries · 2 tugs</span></div><div class="iact"><button  data-min="insp" aria-label="Hide terminal overview"><svg class="i" viewBox="0 0 20 20"><path d="M5 10h10"/></svg></button></div></div><div class="istat">${pill('Operational')}<span>${berths.filter(b=>b.vessel).length} of 2 berths occupied</span></div>`+
    kv([['Yard stock',`${(occ*2).toLocaleString()} / ${(yard.cap*2).toLocaleString()} TEU`],['Quay cranes working',`${q.filter(c=>!c.idle).length} / ${q.length}`],['Yard gantries working',`${r.filter(c=>!c.idle).length} / ${r.length}`],['Trucks on site',trucks.filter(t=>t.active).length],['Weather',WXN[wx.name]+' · '+({clear:'visibility 10 km',cloudy:'visibility 8 km',rain:'visibility 2 km',fog:'visibility 400 m'})[wx.name]],['Wind',({clear:'W 9 kn',cloudy:'NW 13 kn',rain:'NE 18 kn',fog:'calm'})[wx.name]],['Tide','+1.8 m, rising'],['Sunrise · sunset','05:40 · 17:30']])+
    '<div class="blocks">'+blocks.map(b=>{let n=0;for(const s of b.stacks)n+=s.items.length;const p=Math.round(n/b.cap*100);return `<div><s><i style="height:${p}%"></i></s><b>${b.name}</b>${p}%</div>`;}).join('')+'</div><p class="note">Click a vessel, tug, crane, truck or container to inspect it. Drag to pan, scroll to zoom, shift-drag to rotate and tilt.</p><p class="note">Site and surroundings laid out after Sơn Trà Port, Đà Nẵng. Map data © OpenStreetMap contributors. Operations and names are fictional.</p>';}
  if(e.kind==='vessel'){const b=e.berth;return head('vessel','Vessel · '+b.name,e.name,`${e.imo} · voy. ${e.voy} · ${e.line.n}`)+`<div class="istat">${pill(e.status)}<span>${e.mode==='discharge'?'Import discharge':'Export loading'}</span></div>`+prog(e.done,e.planned)+
    kv([['Line',esc(e.line.n)],['Length overall','172 m'],['Berth',b.name+' · starboard side to, bow out'],['Tugs',tugs.filter(t=>t.assist===e).map(t=>link(t)).join(' · ')||'—'],['Quay cranes',b.cranes.map(c=>link(c)).join(' · ')],['Arrived',clockAt(e.tArr),1],['Est. departure',clockAt(etdOf(e)),1],['Last move',e.last?link(e.last.box):'—',1]])+
    `<div class="acts"><button class="btn" data-mod="vessels">Open bay plan</button></div>`;}
  if(e.kind==='tug')return head('tug','Harbour tug · Tideline Towage',e.name,'ASD tug · 27 m · 45 t bollard pull')+`<div class="istat">${pill(e.status)}<span>${e.fast?'Line made fast':e.push?'Pushing':'No line out'}</span></div>`+
    kv([['Assisting',e.assist&&!e.assist.dead?link(e.assist):'—'],['Speed',(e.spd*1.944/3).toFixed(1)+' kn',1],['Heading',Math.round((Math.atan2(-(.984*Math.cos(e.h)+.177*Math.sin(e.h)),.177*Math.cos(e.h)-.984*Math.sin(e.h))*180/Math.PI+360)%360)+'°',1],['Ship moves this session',e.jobs,1],['Berth','Tug pontoon, east cove']]);
  if(e.kind==='sts'){const v=e.berth.vessel;return head('sts','Quay crane · '+e.berth.name,e.id,'Ship-to-shore gantry · 16 rows outreach')+`<div class="istat">${pill(e.status)}<span>${e.cargo?'Laden':'Empty spreader'}</span></div>`+
    kv([['Vessel',link(v)],['Working bay',v?'Bay '+v.cols[Math.min(e.col,e.range[1])].bay:'—',1],['On hook',e.cargo?link(e.cargo):'—',1],['Truck in lane',e.atStop?link(e.atStop):'—',1],['Boom',e.boom<.02?'Down':e.boom>1.2?'Raised':'Moving'],['Hoist height',e.h.toFixed(1)+' m',1],['Moves this session',e.moves,1]]);}
  if(e.kind==='rtg'){let n=0;for(const s of e.blk.stacks)n+=s.items.length;const q=e.queue[0];return head('rtg','Yard gantry · Block '+e.blk.name,e.id,'Rubber-tyred gantry · 5 wide, 1 over 4')+`<div class="istat">${pill(e.status)}<span>${e.queue.length} job${e.queue.length===1?'':'s'} queued</span></div>`+prog(n,e.blk.cap,'accent')+
    kv([['Block fill',Math.round(n/e.blk.cap*100)+'%'],['On hook',e.cargo?link(e.cargo):'—',1],['Serving',q?(q.truck?link(q.truck):'Restow order'):'—',1],['Truck lane','Lane '+(e.blk.li+1)+' · westbound'],['Moves this session',e.moves,1]])+
    `<div class="acts"><button class="btn" data-mod="yard">Open yard planner</button></div>`;}
  if(e.kind==='truck'&&e.sub==='car')return head('truck','Service vehicle',e.id,'Operations patrol · 4×4 pickup')+`<div class="istat">${pill(e.status)}</div>`+kv([['Heading to',esc(e.dest)],['Speed',Math.round(e.v*3.6)+' km/h',1],['Laps this session',e.trips,1]]);
  if(e.kind==='truck'){const tt=e.sub==='tt';return head('truck',tt?'Terminal tractor · '+e.berth.name:'External haulier',e.id,tt?'Terminal fleet · 40′ skeletal trailer':e.haul+' · '+e.plate)+`<div class="istat">${pill(e.status)}<span>${e.cargo?'Laden':'Empty'}</span></div>`+
    kv([['Heading to',esc(e.dest)],['Cargo',e.cargo?link(e.cargo):'—',1],['Speed',Math.round(e.v*3.6)+' km/h',1],['Trips this session',e.trips,1],...(tt?[['Vessel',link(e.berth.vessel)]]:[['Booking',e.job],['Appointment',e.appt?e.appt.id:'—',1]])]);}
  const st=e.where==='yard'?e.ref:null,over=st?st.items.length-1-st.items.indexOf(e):0,held=e.customs==='Hold'||e.customs==='Inspection';
  let h=head('box',(e.reefer?'Reefer':e.dg?'Dangerous goods':e.empty?'Empty':'Dry cargo')+' · '+e.dir,e.id,`${e.type} · ISO ${e.iso} · ${e.line.n}`,1)+`<div class="istat">${pill(statusOf(e))}${pill(e.customs)}${e.reefer?`<span>Set ${e.tSet} °C</span>`:''}${e.dg?`<span>IMDG ${e.dg.cls}</span>`:''}</div>`;
  if(e.appt)h+=`<div class="banner">Truck pick-up ${e.appt.status==='Booked'?'booked':'in progress'} · ${e.appt.id}</div>`;
  else if(held)h+=`<div class="banner bad">${e.customs==='Hold'?'Customs hold':'Selected for inspection'} · cannot leave the terminal</div>`;
  if(st&&!e.appt){h+='<div class="acts">'+(held?'<button class="btn pri" data-act="release">Release hold</button>':'<button class="btn pri" data-act="pickup">Book truck pick-up</button><button class="btn danger" data-act="hold">Place hold</button>')+'<button class="btn" data-act="restow">Restow</button></div>';}
  h+='<div class="sec cap">Cargo</div>'+kv([['Commodity',esc(e.commodity)],['Packages',e.pkgs?e.pkgs.toLocaleString():'—',1],['Gross weight (VGM)',e.wt.toFixed(1)+' t',1],['Consignee',esc(e.cons)],['Bill of lading',e.bl,1],['Port of discharge',e.pod],...(e.dg?[['UN number',e.dg.un,1]]:[])]);
  h+='<div class="sec cap">Handling</div>'+kv([['Location',st?`<a data-yard="1">Block ${locText(e)}</a>`:e.where==='ship'?link(e.ref):link(e.ref),1],['Containers on top',st?over:'—',1],['Dwell',dwellTxt(e),1],['Seal',e.seal,1]]);
  return h;
}
function act(a){const b=sel;if(!b||b.kind!=='box'||b.where!=='yard')return;const st=b.ref,busy=st.rin||st.rout;
  if(a==='release'){b.customs='Cleared';b.paint();ev('hold',`Hold released on ${b.id}`,b);toast(`${b.id} released. It can now be booked out.`);}
  else if(busy){toast('This stack is in the middle of another move. Try again in a moment.');return;}
  else if(a==='hold'){b.customs='Hold';b.paint();ev('hold',`Customs hold placed on ${b.id}`,b);toast(`Hold placed on ${b.id}.`);}
  else if(a==='pickup'){st.rout++;const ap=mkAppt(true,b);b.appt=ap;const n=st.items.length-1-st.items.indexOf(b);ev('gate',`Pick-up ${ap.id} booked for ${b.id}`,b);toast(`Pick-up ${ap.id} booked. ${n?n+' container'+(n>1?'s':'')+' will be rehandled first.':'The next free truck will collect it.'}`);}
  else if(a==='restow'){if(!shiftTarget(st)){toast('No free slot in this block to restow into.');return;}st.rout++;st.blk.rtg.queue.push({type:'shift',stack:st,box:b,free:false});toast(`Restow order sent to ${st.blk.rtg.id}.`);}
  uiTick(true);if(mode==='cargo')cargoRefresh();}
const inspEl=$('#insp'),trackEl=$('#tracker'),rowsEl=$('#rows'),tabsEl=$('#tabs');let tab='berths';
inspEl.addEventListener('click',e=>{const a=e.target.closest('[data-a]'),c=e.target.closest('[data-act]'),m=e.target.closest('[data-mod]'),y=e.target.closest('[data-yard]');
  if(c)return act(c.dataset.act);if(m){if(sel&&sel.kind==='vessel')tracked=sel;return setMode(m.dataset.mod);}if(y)return setMode('yard');if(!a)return;
  if(a.dataset.a==='close')select(null);else if(a.dataset.a==='locate'&&sel)flyTo(sel);else if(a.dataset.a==='follow'){follow=!follow;uiTick(true);}});
tabsEl.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b.dataset.t){tab=b.dataset.t;uiTick(true);}});
function trackerHTML(){
  let v=tracked&&!tracked.dead?tracked:null;if(!v)v=berths[0].vessel||berths[1].vessel;
  if(!v)return `<div class="tr-main"><div class="tr-head">${svg('vessel')}<b>Vessel call</b><span>Both berths clear · next arrival inbound</span><button class="pmin" data-min="tracker" aria-label="Hide vessel call"><svg class="i" viewBox="0 0 20 20"><path d="M5 10h10"/></svg></button></div></div>`;
  const ord=['arrive','moor','work','done','depart'],idx=ord.indexOf(v.phase),verb=v.mode==='discharge'?'Discharging':'Loading',c=t=>t===undefined?'':clockAt(t);
  const st=[['Arrival','anchor',c(v.tArr)],['Berthed','flag',c(v.tBerth)],[idx>2?verb.replace('ing','ed'):verb,'box',idx>=2?v.done+'/'+v.planned+' · '+c(v.tWork):''],['Completed','check',c(v.tDone)||(idx===2?'est '+clockAt(etdOf(v)-8):'')],['Sailed','vessel',c(v.tDep)]];
  const l=v.last;
  return `<div class="tr-main"><div class="tr-head">${svg('vessel')}<b>Vessel call</b><span>${esc(v.name)} · voy. ${v.voy} · ${v.berth.name}</span><button class="pmin" data-min="tracker" aria-label="Hide vessel call"><svg class="i" viewBox="0 0 20 20"><path d="M5 10h10"/></svg></button></div><div class="steps">`+
    st.map((s,i)=>`<div class="step ${i<idx?'done':i===idx?'now':''}"><i>${svg(s[1])}</i><b>${s[0]}</b><span>${s[2]||'&nbsp;'}</span></div>`).join('')+
    `</div></div><div class="now-card"><small class="cap">Last move</small>${l?`<b>${l.box.id}</b><span>${esc(l.from)} → ${esc(l.to)}</span><span>${l.crane} · ${l.box.wt.toFixed(1)} t</span>`:'<b>—</b><span>Waiting for the first lift</span>'}</div>`;
}
function rowsHTML(){
  const row=(e,sub,mid,st,right)=>`<button class="row ${sel===e?'on':''}" data-go="${key(e)}"><div><b>${esc(e.label.replace('MV ',''))}</b><small>${esc(sub)}</small></div><span>${mid}</span>${pill(st)}<em>${right}</em></button>`;
  if(tab==='berths')return berths.map(b=>b.vessel?row(b.vessel,b.name,esc(b.vessel.line.n),b.vessel.status,b.vessel.done+'/'+b.vessel.planned):`<div class="row"><div><b>${b.id}</b><small>${b.name}</small></div><span>Next: ${esc(b.next.name)} · ETA ${clockAt(b.nextAt)}</span>${pill('Idle')}<em></em></div>`).join('')+
    tugs.map(t=>row(t,'Harbour tug',t.assist&&!t.assist.dead?esc(t.assist.name):'Tug pontoon',t.status,(t.spd*1.944/3).toFixed(1)+' kn')).join('')+
    `<div class="row"><div><b>Gate</b><small>2 lanes</small></div><span>${stats.gateIn} external truck${stats.gateIn===1?'':'s'} on site</span>${pill('Operational')}<em></em></div>`;
  if(tab==='cranes')return cranes.map(c=>row(c,c.kind==='sts'?c.berth.name:'Block '+c.blk.name,c.cargo?`<span class="mono">${c.cargo.id}</span>`:c.kind==='rtg'&&c.queue.length?c.queue.length+' queued':'—',c.status,c.moves)).join('');
  if(tab==='trucks')return trucks.filter(t=>t.active).map(t=>row(t,t.sub==='tt'?t.berth.name:t.sub==='car'?'Service':'Haulier',esc(t.dest),t.status,Math.round(t.v*3.6)+' km/h')).join('');
  return events.slice(0,24).map(feedRow).join('')||'<div class="row ev"><b></b><span>No activity yet.</span></div>';
}
const feedRow=x=>`<button class="row ev" data-go="${x.ent&&!x.ent.dead?key(x.ent):''}"><b>${x.t}</b><span>${esc(x.text)}</span></button>`;

/* ---------- modules ---------- */
const MODS={live:['Live operations',''],yard:['Yard planner','Stack heights by block. Select a stack to open its bay profile.'],cargo:['Cargo inventory','Every container in the yard, on vessels alongside and in transit.'],vessels:['Vessel calls','Berth schedule, call list and bay plan.'],gate:['Gate and appointments','Truck appointments, gate transactions and turn times.']};
let mode='live';const workEl=$('#work'),wbody=$('#wbody');
const CG={q:'',loc:'all',type:'all',customs:'all',line:'all',sort:'dwell',asc:false,list:[]},ROWH=40;
const CCOLS='1.5fr .5fr .85fr 1.15fr 1.4fr .55fr 1.1fr .85fr .85fr';
function setMode(m){mode=m;for(const k in MODS)app.classList.toggle('m-'+k,k===m);[...document.querySelectorAll('.rail button')].forEach(b=>b.classList.toggle('on',b.dataset.m===m));
  workEl.hidden=m==='live';$('#wtitle').textContent=MODS[m][0];$('#wsub').textContent=MODS[m][1];$('#crumb').textContent=MODS[m][0];
  if(m==='cargo'){const opt=(v,l)=>`<option value="${v}">${l}</option>`;
    wbody.innerHTML=`<div class="filters"><input id="c-q" type="search" placeholder="Filter by container, commodity, consignee, B/L…" aria-label="Filter cargo" autocomplete="off" spellcheck="false">
      <select id="c-loc" aria-label="Location">${opt('all','All locations')+opt('yard','In yard')+opt('ship','On vessel')+opt('move','In transit')}</select>
      <select id="c-type" aria-label="Cargo type">${opt('all','All types')+opt('dry','Dry')+opt('reefer','Reefer')+opt('dg','Dangerous goods')+opt('empty','Empty')}</select>
      <select id="c-customs" aria-label="Customs status">${opt('all','All customs')+['Cleared','Pending','Inspection','Hold'].map(x=>opt(x,x)).join('')}</select>
      <select id="c-line" aria-label="Shipping line">${opt('all','All lines')+LINES.map((l,i)=>opt(i,l.n)).join('')}</select></div>
      <div class="stats" id="c-stats"></div>
      <div class="tbl"><div class="tin" style="--cols:${CCOLS}"><div class="thead" id="c-head"></div><div class="tscroll" id="c-scroll"><div id="c-sizer" style="position:relative"><div id="c-rows" style="position:absolute;left:0;right:0;top:0"></div></div></div><div class="tfoot" id="c-foot"></div></div></div>`;
    $('#c-q').value=CG.q;$('#c-loc').value=CG.loc;$('#c-type').value=CG.type;$('#c-customs').value=CG.customs;$('#c-line').value=CG.line;
    $('#c-q').addEventListener('input',e=>{CG.q=e.target.value;cargoRefresh(true);});
    for(const k of ['loc','type','customs','line'])$('#c-'+k).addEventListener('change',e=>{CG[k]=e.target.value;cargoRefresh(true);});
    $('#c-head').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.sort;if(CG.sort===k)CG.asc=!CG.asc;else{CG.sort=k;CG.asc=k!=='dwell'&&k!=='wt';}cargoRefresh(true);});
    let raf=0;$('#c-scroll').addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;cargoRows();});});
    cargoRefresh(true);
  }else wbody.innerHTML=m==='live'?'':'<div id="m-all" style="display:flex;flex-direction:column;gap:12px"></div>';
  setShift();modT=0;uiTick(true);}
document.querySelector('.rail').addEventListener('click',e=>{const b=e.target.closest('button');if(b)setMode(b.dataset.m);});
$('#wclose').addEventListener('click',()=>setMode('live'));
const stat=(l,v,s)=>`<div class="stat"><small>${l}</small><b>${v}</b><em>${s}</em></div>`;
/* yard planner */
function yardHTML(){
  const s=yardFigures(),cap=yard.cap;
  let h=`<div class="stats">${stat('Occupancy',Math.round(s.n/cap*100)+'%',`${s.n*2} / ${cap*2} TEU`)}${stat('Free 40′ slots',cap-s.n,'across six blocks')}${stat('Reefers plugged',s.reef,'of 72 reefer points')}${stat('Customs holds',s.hold,'hold or inspection')}${stat('Average dwell',(s.dw/24).toFixed(1)+' d','target under 4 d')}${stat('Rehandles',stats.rehandles,'this session')}</div>`;
  h+=`<div class="quay"><span class="cap">Quay</span>`+berths.map(b=>{const v=b.vessel;return v?`<button class="qv" data-go="${key(v)}"><b>${b.id}</b><span>${esc(v.name)}</span>${pill(v.status)}<em>${v.done}/${v.planned}</em></button>`:`<div class="qv off"><b>${b.id}</b><span>Next: ${esc(b.next.name)} · ETA ${clockAt(b.nextAt)}</span></div>`;}).join('')+'</div><div class="ymap">';
  for(let li=0;li<3;li++)for(const hf of [0,3]){const b=blocks[hf+li],bi=hf+li;let n=0;for(const st of b.stacks)n+=st.items.length;const qn=b.rtg.queue.length;
    h+=`<div class="blk"><div class="blk-h"><b>Block ${b.name}</b><span>${Math.round(n/b.cap*100)}% · ${n}/${b.cap}</span><button data-go="${key(b.rtg)}">${b.rtg.id} ${pill(b.rtg.status)}</button></div><div class="lane">← Lane ${li+1} · westbound${qn?` · ${qn} job${qn>1?'s':''} at gantry`:''}</div><div class="cells">`;
    for(let r=0;r<NR;r++)for(let c=0;c<NB;c++){const si=c*NR+r,st=b.stacks[si],k=st.items.length,hold=st.items.some(x=>x.customs==='Hold'||x.customs==='Inspection');
      h+=`<button class="c t${k}${st===yardSel?' on':''}${st.rin||st.rout?' lock':''}" data-st="${bi}.${si}" aria-label="Block ${b.name} bay ${c+1} row ${r+1}, ${k} high">${k||''}${hold?'<i></i>':''}</button>`;}
    h+='</div><div class="bays">'+[1,2,3,4,5,6].map(x=>`<span>${pad2(x)}</span>`).join('')+'</div></div>';}
  h+=`</div><div class="keyrow"><span><i style="background:#fbe1cf"></i>1 high</span><span><i style="background:#f5bf9b"></i>2</span><span><i style="background:#ea9460"></i>3</span><span><i style="background:#d4581f"></i>4 (full)</span><span><i style="background:repeating-linear-gradient(135deg,#bbb 0 3px,#eee 3px 6px)"></i>move in progress</span><span><i style="background:var(--bad);width:8px;height:8px;border-radius:50%"></i>hold in stack</span></div>`;
  const st=yardSel;
  if(!st)return h+'<div class="bay empty">Select a stack on the plan, or a container in the 3D view, to see its bay profile.</div>';
  const b=st.blk,q=b.rtg.queue.find(x=>x.truck&&x.stack.bay===st.bay);
  h+=`<div class="bay stick"><div class="bay-h"><b>Block ${b.name} · Bay ${pad2(st.bay+1)}</b><span>Cross-section looking east · truck lane on the left · coloured by ${$('#colorby').selectedOptions[0].textContent.toLowerCase()}</span></div><div class="prof"><div class="plane">${q?`<b>${esc(q.truck.id)}</b>`:''}lane ${b.li+1}</div>`;
  for(let r=0;r<NR;r++){const s2=b.stacks[st.bay*NR+r];h+='<div class="pcol">';
    for(let t=MAXT-1;t>=0;t--){const x=s2.items[t];h+=x?`<button class="bx${x===sel?' on':''}" style="${boxCss(x)}" data-go="${key(x)}" title="${x.id} · ${esc(x.commodity)}">${x.id.slice(7,11)}${x.customs==='Hold'||x.customs==='Inspection'?'<sup>H</sup>':x.appt?'<sup>P</sup>':''}</button>`:'<i class="bx none"></i>';}
    h+=`<small>Row ${r+1}${s2===st?' ◂':''}</small></div>`;}
  return h+'</div></div>';
}
wbody.addEventListener('click',e=>{const c=e.target.closest('[data-st]');if(!c)return;const [bi,si]=c.dataset.st.split('.').map(Number),st=blocks[bi].stacks[si];yardSel=st;const t=topOf(st);
  if(t)select(t,true);else{select(null);yardSel=st;view.tx=st.x;view.tz=st.z;view.dist=140;uiTick(true);}});
/* cargo inventory */
const CKEY={id:b=>b.id,type:b=>b.type,status:b=>statusOf(b),loc:b=>locText(b),commodity:b=>b.commodity,wt:b=>b.wt,pod:b=>b.pod,customs:b=>b.customs,dwell:b=>b.where==='yard'?dwellH(b):-1};
function cargoRefresh(reset){
  const q=CG.q.trim().toLowerCase(),list=[];
  for(const b of boxAt){if(!b)continue;
    if(CG.loc!=='all'&&(CG.loc==='move'?(b.where!=='truck'&&b.where!=='hook'):b.where!==CG.loc))continue;
    if(CG.type!=='all'&&!(CG.type==='reefer'?b.reefer:CG.type==='dg'?b.dg:CG.type==='empty'?b.empty:(!b.reefer&&!b.dg&&!b.empty)))continue;
    if(CG.customs!=='all'&&b.customs!==CG.customs)continue;
    if(CG.line!=='all'&&b.line!==LINES[+CG.line])continue;
    if(q&&!(b.id+' '+b.commodity+' '+b.cons+' '+b.bl+' '+b.line.n+' '+b.pod).toLowerCase().includes(q)&&!b.id.replace(/\s/g,'').toLowerCase().includes(q.replace(/\s/g,'')))continue;
    list.push(b);}
  const f=CKEY[CG.sort],d=CG.asc?1:-1;list.sort((a,b)=>{const x=f(a),y=f(b);return x<y?-d:x>y?d:a.i-b.i;});CG.list=list;
  let wt=0,reef=0,dg=0,hold=0;for(const b of list){wt+=b.wt;if(b.reefer)reef++;if(b.dg)dg++;if(b.customs==='Hold'||b.customs==='Inspection')hold++;}
  setH($('#c-stats'),stat('Containers',list.length.toLocaleString(),'matching filters')+stat('TEU',(list.length*2).toLocaleString(),'40′ units')+stat('Gross weight',Math.round(wt).toLocaleString()+' t','verified gross mass')+stat('Reefers',reef,'temperature controlled')+stat('Dangerous goods',dg,'IMDG declared')+stat('On hold',hold,'customs hold or inspection'));
  const hd=[['id','Container'],['type','Type'],['status','Status'],['loc','Location'],['commodity','Commodity'],['wt','Gross t',1],['pod','Port of discharge'],['customs','Customs'],['dwell','Dwell',1]];
  setH($('#c-head'),hd.map(([k,l,n])=>`<button data-sort="${k}" class="${n?'num ':''}${CG.sort===k?'on':''}" aria-sort="${CG.sort===k?(CG.asc?'ascending':'descending'):'none'}">${l}${CG.sort===k?(CG.asc?' ↑':' ↓'):''}</button>`).join(''));
  $('#c-sizer').style.height=list.length*ROWH+'px';if(reset)$('#c-scroll').scrollTop=0;
  setH($('#c-foot'),`${list.length.toLocaleString()} of ${boxAt.filter(Boolean).length.toLocaleString()} containers · click a row to locate it in the 3D view`);cargoRows();
}
function cargoRows(){const sc=$('#c-scroll');if(!sc)return;const a=Math.max(0,Math.floor(sc.scrollTop/ROWH)-3),b=Math.min(CG.list.length,a+Math.ceil((sc.clientHeight||420)/ROWH)+7),rows=$('#c-rows');rows.style.transform=`translateY(${a*ROWH}px)`;
  setH(rows,CG.list.slice(a,b).map(x=>`<button class="tr${x===sel?' on':''}" data-go="${key(x)}"><span class="mono">${x.id}<small>${esc(x.line.n)}</small></span><span>${x.type}</span><span>${pill(statusOf(x))}</span><span>${esc(locText(x))}</span><span>${esc(x.commodity)}${x.dg?` <span class="pill bad">${x.dg.cls}</span>`:''}</span><span class="num">${x.wt.toFixed(1)}</span><span>${x.pod}</span><span>${pill(x.customs)}</span><span class="num">${dwellTxt(x)}</span></button>`).join('')||'<div class="tfoot" style="border:0;background:none">No containers match these filters.</div>');}
/* vessel calls */
function vesselsHTML(){
  const t0=simT-900,t1=simT+1500,pos=t=>clamp((t-t0)/(t1-t0)*100,0,100),B0=16*3600+42*60;
  let ticks='',grid='';for(let k=Math.ceil((B0+t0*6)/1800);k<=Math.floor((B0+t1*6)/1800);k++){const t=(k*1800-B0)/6,p=pos(t).toFixed(2);ticks+=`<span style="left:${p}%">${clockAt(t+.01)}</span>`;grid+=`<i style="left:${p}%"></i>`;}
  grid+=`<i class="now" style="left:${pos(simT).toFixed(2)}%"></i>`;
  const calls=[];let h=`<div class="sched"><div class="sc-axis">${ticks}</div>`;
  for(const b of berths){const v=b.vessel;let bars='';
    if(v){const a=pos(v.tArr),e=etdOf(v),w=Math.max(1,pos(e)-a);bars+=`<button class="sc-bar" data-go="${key(v)}" style="left:${a.toFixed(2)}%;width:${w.toFixed(2)}%"><u style="width:${Math.round(v.done/v.planned*100)}%"></u><span>${esc(v.name)} · ${v.mode==='discharge'?'discharge':'load'} ${v.done}/${v.planned}</span></button>`;
      calls.push([v,null,b,v.tArr,e]);}
    const n=b.next,ns=v?etdOf(v)+80+ARRIVE_S:b.nextAt,ne=ns+60+n.planned*13.5;if(pos(ns)<99)bars+=`<div class="sc-bar next" style="left:${pos(ns).toFixed(2)}%;width:${Math.max(1,pos(ne)-pos(ns)).toFixed(2)}%"><span>${esc(n.name)} · ${n.mode==='discharge'?'discharge':'load'} ${n.planned}</span></div>`;
    calls.push([null,n,b,ns,ne]);
    h+=`<div class="sc-row"><b>${b.id}</b><div class="sc-lane">${grid}${bars}</div></div>`;}
  h+=`</div><div class="tbl simple" style="flex:none;min-height:0"><div class="tin" style="--cols:1.4fr 1.2fr .6fr .9fr .6fr .6fr .7fr .9fr;min-width:700px"><div class="thead">${['Vessel','Line','Berth','Operation','ATA / ETA','ETD','Moves','Status'].map((x,i)=>`<button class="${i===6?'num':''}" tabindex="-1">${x}</button>`).join('')}</div>`;
  for(const [v,n,b,ts,te] of calls){const o=v||n;h+=`<${v?'button':'div'} class="tr"${v?` data-go="${key(v)}"`:''}><span class="mono">${esc(o.name)}<small>voy. ${o.voy}</small></span><span>${esc(o.line.n)}</span><span>${b.id}</span><span>${o.mode==='discharge'?'Discharge':'Load'}</span><span class="num">${clockAt(ts)}</span><span class="num">${clockAt(te)}</span><span class="num">${v?v.done+'/'+v.planned:'0/'+n.planned}</span><span>${pill(v?v.status:'Expected')}</span></${v?'button':'div'}>`;}
  h+='</div></div>';
  let v=tracked&&!tracked.dead?tracked:berths[0].vessel||berths[1].vessel;
  if(!v)return h+'<div class="bay empty">No vessel alongside. The bay plan opens when the next call berths.</div>';
  h+=`<div class="bay"><div class="bay-h"><b>Bay plan · ${esc(v.name)}</b><span>Deck stow by bay, seen from astern · quay on the right · bow bays first</span></div><div class="bplan">`;
  for(let ci=5;ci>=0;ci--){const cl=v.cols[ci],cr=v.berth.cranes.find(c=>!c.idle&&c.col===ci);let n=0;
    let g='';for(let t=MAXT-1;t>=0;t--)for(let r=0;r<6;r++){const x=cl.stacks[r].items[t];if(x)n++;g+=x?`<button class="vb${x===sel?' on':''}" style="${boxCss(x)}" data-go="${key(x)}" title="${x.id}"></button>`:'<i class="vb none"></i>';}
    h+=`<div class="vbay"><div class="vb-h"><b>Bay ${cl.bay}</b><span>${n}/24</span>${cr?pill(cr.id):ci===2||ci===3?'<span class="pill idle">Stays on board</span>':''}</div><div class="g">${g}</div></div>`;}
  return h+'</div></div>';
}
/* gate */
function gateHTML(){
  const act2=appts.filter(a=>a.status==='At gate'||a.status==='In terminal'),bk=appts.filter(a=>a.status==='Booked').sort((a,b)=>(b.user-a.user)||a.t-b.t),dn=appts.filter(a=>a.status==='Completed'||a.status==='Cancelled').reverse();
  const avg=stats.turn.reduce((a,b)=>a+b,0)/stats.turn.length;
  let h=`<div class="stats">${stat('Trucks on site',act2.length,'external hauliers')}${stat('Average turn',avg.toFixed(1)+' min','last '+stats.turn.length+' trucks')}${stat('Gate transactions',stats.gateDone,'this shift')}${stat('Booked ahead',bk.length,'appointments waiting')}${stat('In lane',trucks.filter(t=>t.active&&t.status==='Gate check').length,'at the in-gate now')}${stat('Out lane',trucks.filter(t=>t.active&&t.status==='Gate out').length,'at the out-gate now')}</div>`;
  h+=`<div class="tbl simple"><div class="tin" style="--cols:.8fr 1.3fr 1fr 1.25fr .9fr .9fr .6fr;min-width:700px"><div class="thead">${['Appointment','Haulier','Type','Container','Window','Status','Turn'].map((x,i)=>`<button class="${i===6?'num':''}" tabindex="-1">${x}</button>`).join('')}</div><div class="tscroll">`;
  for(const a of [...act2,...bk,...dn]){const live=a.truck&&a.truck.active&&a.truck.appt===a&&(a.status==='At gate'||a.status==='In terminal'),tgt=live?a.truck:(a.box&&!a.box.dead?a.box:null);
    h+=`<${tgt?'button':'div'} class="tr"${tgt?` data-go="${key(tgt)}"`:''}><span class="mono">${a.id}${a.user?'<small>Booked by you</small>':''}</span><span>${esc(a.haul)}<small>${a.plate}</small></span><span>${a.type}</span><span class="mono">${a.box?a.box.id:'<span style="color:var(--ink-3);font-family:var(--f-body)">Assigned at gate</span>'}</span><span class="num" style="text-align:left">${clockAt(a.t)}–${clockAt(a.t+100)}</span><span>${pill(a.status)}</span><span class="num">${a.turn?a.turn.toFixed(1)+' min':'—'}</span></${tgt?'button':'div'}>`;}
  return h+`</div><div class="tfoot">To book a truck for a specific container, select it and choose “Book truck pick-up”.</div></div></div>`;
}

/* ---------- periodic HUD refresh ---------- */
let lastUI=0,occ0=null,modT=0;
function uiTick(force){
  const now=performance.now();if(!force&&now-lastUI<300)return;lastUI=now;
  $('#clock').textContent=clockAt(simT);skyUI();
  if(sel&&(sel.dead||sel.active===false))return select(null);
  inspEl.classList.toggle('home',!sel);setH(inspEl,card(sel));
  const bn=$('#bellN');bn.hidden=!unread;bn.textContent=unread>9?'9+':unread;
  if(!$('#feed').hidden)setH($('#feed'),events.slice(0,12).map(x=>`<button data-go="${x.ent&&!x.ent.dead?key(x.ent):''}"><b>${x.t}</b><span>${esc(x.text)}</span></button>`).join('')||'<button disabled>No activity yet.</button>');
  const lg=$('#legend');lg.hidden=colorBy==='natural';if(colorBy!=='natural')setH(lg,`<span class="cap">${$('#colorby').selectedOptions[0].textContent}</span>`+LEGEND[colorBy].map(([l,h])=>`<span><i style="background:${hexCss(h)}"></i>${l}</span>`).join(''));
  if(mode==='live'){
    const occ=yard.count();if(occ0===null)occ0=occ;const d=(occ-occ0)*2;
    setH($('#k1'),Math.round(occ/yard.cap*100)+'<u>%</u>'+(d?`<span class="d">${d>0?'+':''}${d}</span>`:''));$('#k1s').textContent=`${(occ*2).toLocaleString()} / ${(yard.cap*2).toLocaleString()} TEU`;
    while(stats.moves.length&&stats.moves[0]<simT-200)stats.moves.shift();
    setH($('#k2'),(stats.moves.length/4*3).toFixed(1)+'<u>moves/h</u>');$('#k2s').textContent=`per crane · ${stats.total} lifts this shift`;
    const tt=stats.turn.reduce((a,b)=>a+b,0)/stats.turn.length;setH($('#k3'),tt.toFixed(1)+'<u>min</u>');$('#k3s').textContent=`last ${stats.turn.length} hauliers · gate to gate`;
    const yf=yardFigures();setH($('#k4'),yf.hold+'<u>boxes</u>');$('#k4s').textContent=`${yf.reef} reefers · ${yf.dg} dangerous goods`;
    setH(trackEl,trackerHTML());
    const q=cranes.filter(c=>!c.idle).length;
    setH(tabsEl,[['berths','Berths',berths.filter(b=>b.vessel).length+'/2'],['cranes','Cranes',q+'/'+cranes.length],['trucks','Trucks',trucks.filter(t=>t.active).length],['feed','Activity',events.length]].map(([k,n,c])=>`<button role="tab" data-t="${k}" aria-selected="${tab===k}" class="${tab===k?'on':''}">${n}<u>${c}</u></button>`).join('')+'<button class="pmin" data-min="lists" aria-label="Hide equipment and activity"><svg class="i" viewBox="0 0 20 20"><path d="M5 10h10"/></svg></button>');
    setH(rowsEl,rowsHTML());
  }else if(force||now-modT>(mode==='cargo'?1500:600)){modT=now;
    if(mode==='yard')setH($('#m-all'),yardHTML());else if(mode==='vessels')setH($('#m-all'),vesselsHTML());else if(mode==='gate')setH($('#m-all'),gateHTML());else if(mode==='cargo')cargoRefresh(false);}
}
/* search, bell, colour, speed */
const qEl=$('#q'),resEl=$('#results');
function search(){const s=qEl.value.trim().toLowerCase().replace(/\s+/g,'');if(!s){resEl.hidden=true;return;}const out=[];
  for(const e of ents){if(e.active===false)continue;if((e.label+' '+(e.line?e.line.n:'')).toLowerCase().replace(/\s+/g,'').includes(s))out.push(e);if(out.length>=6)break;}
  if(out.length<6)for(const b of boxAt){if(b&&b.id.toLowerCase().replace(/\s+/g,'').includes(s)){out.push(b);if(out.length>=6)break;}}
  resEl._list=out;resEl.innerHTML=out.length?out.map((e,i)=>`<button data-i="${i}">${svg(e.kind)}<b class="mono">${esc(e.label)}</b><small>${esc(statusOf(e))}</small></button>`).join(''):'<button disabled>No match. Try QC-02, TT-07 or a container number.</button>';resEl.hidden=false;}
qEl.addEventListener('input',search);qEl.addEventListener('focus',search);
qEl.addEventListener('keydown',e=>{if(e.key==='Escape'){qEl.blur();resEl.hidden=true;}if(e.key==='Enter'&&resEl._list&&resEl._list[0]){select(resEl._list[0],true);resEl.hidden=true;qEl.blur();}});
resEl.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-i]');if(b){e.preventDefault();select(resEl._list[+b.dataset.i],true);resEl.hidden=true;qEl.blur();}});
qEl.addEventListener('blur',()=>setTimeout(()=>{resEl.hidden=true;},120));
$('#bell').addEventListener('click',()=>{const f=$('#feed');f.hidden=!f.hidden;$('#pmenu').hidden=true;$('#skymenu').hidden=true;unread=0;uiTick(true);});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.bell')){$('#feed').hidden=true;$('#pmenu').hidden=true;$('#skymenu').hidden=true;}});
$('#colorby').addEventListener('change',e=>{colorBy=e.target.value;repaintAll();modT=0;uiTick(true);});
addEventListener('keydown',e=>{const tg=e.target.tagName;if(e.key==='/'&&tg!=='INPUT'){e.preventDefault();qEl.focus();}else if((e.key==='h'||e.key==='H')&&tg!=='INPUT'&&tg!=='SELECT'&&!e.metaKey&&!e.ctrlKey&&!e.altKey){const hide=!HID.has('all');setPanel('all',!hide);if(hide)toast('Panels hidden. Press H or use the panels button to bring them back.');}
  else if(e.key==='Escape'&&tg!=='INPUT'){if(HID.has('all'))setPanel('all',true);else if(sel)select(null);else if(mode!=='live')setMode('live');}});
let speed=1;document.querySelector('.speed').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;speed=+b.dataset.sp;[...b.parentNode.children].forEach(x=>x.classList.toggle('on',x===b));$('#live').classList.toggle('paused',!speed);$('#live span').textContent=speed?'Live':'Paused';});

/* ---------- frame loop ---------- */
const lr=new T.Vector3(),lu=new T.Vector3(),_c=V(0,0,0),UP=V(0,1,0);let sunS=0;
function shadowFit(){lr.crossVectors(UP,SUN).normalize();lu.crossVectors(SUN,lr).normalize();const d=cur.dist*narrow,S=d<150?95:d<260?150:d<430?215:300;if(S!==sunS){sunS=S;const c=sun.shadow.camera;c.left=-S;c.right=S;c.top=S;c.bottom=-S;c.updateProjectionMatrix();}
  const tx=2*S/SM;_c.set(cur.tx,0,cur.tz);const a=_c.dot(lr),b=_c.dot(lu);_c.addScaledVector(lr,Math.round(a/tx)*tx-a).addScaledVector(lu,Math.round(b/tx)*tx-b);
  sun.target.position.copy(_c);sun.position.copy(_c).addScaledVector(SUN,560);}
let last=performance.now(),hovT=0,dwT=0,fN=0,fT=0;
function frame(now){
  requestAnimationFrame(frame);
  if(++fN>30&&fN<=120){fT+=now-last;if(fN===120&&fT/90>30&&pxr>Math.max(1,Math.min(DPR,2))){pxr=Math.max(1,Math.min(DPR,2));renderer.setPixelRatio(pxr);resize();}}
  const rdt=Math.min(.1,(now-last)/1000);last=now;let rem=rdt*speed;while(rem>1e-6){const d=Math.min(1/30,rem);step(d);rem-=d;}
  uT.value+=rdt*(speed?1:.25);
  for(const c of cranes){c.sync();if(c.kind==='sts')syncBoom(c);}
  for(const t of trucks)t.sync();
  for(const p of peds)p.sync(rdt);
  syncHarbour();
  if(colorBy==='dwell'&&now-dwT>20000){dwT=now;repaintAll();}
  if(dirtyC){CIM.instanceMatrix.needsUpdate=true;dirtyC=false;}
  if(sel&&follow){const f=sel.frame();view.tx=f.x;view.tz=f.z;}
  const k=1-Math.exp(-rdt*8);for(const key2 in view)cur[key2]=lerp(cur[key2],view[key2],k);shiftC=lerp(shiftC,shiftT,k);applyCam();shadowFit();
  if(sel&&brk){const f=sel.frame();brk.position.set(f.x,f.y,f.z);brk.rotation.y=f.rot;}
  if(hoverAt&&!ptrs.size&&now-hovT>70){hovT=now;hov=pickAt(hoverAt[0],hoverAt[1]);canvas.classList.toggle('hot',!!hov);}
  place(tagSel,sel,sel?`${esc(sel.label)}<span>${esc(statusOf(sel))}</span>`:'');
  place(tagHov,hov&&hov!==sel&&hov.kind!=='vessel'?hov:null,hov?esc(hov.label):'');
  berths.forEach((b,i)=>place(tagV[i],b.vessel&&b.vessel!==sel?b.vessel:null,b.vessel?`${esc(b.vessel.name)}<span>${esc(b.vessel.status)}${b.vessel.phase==='work'?' '+b.vessel.done+'/'+b.vessel.planned:''}</span>`:''));
  skyTick(rdt);syncGeo();
  uiTick(false);renderer.render(scene,cam);
}
new ResizeObserver(resize).observe(app);resize();applyPanels();initNight();
for(let i=0;i<1500;i++)step(.05);
uiTick(true);requestAnimationFrame(frame);
