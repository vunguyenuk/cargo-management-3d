const $=(s,r=document)=>r.querySelector(s);
const app=$('#app'), canvas=$('#gl');
if(!window.THREE){app.insertAdjacentHTML('beforeend','<div class="err panel">The 3D library did not load. Check the connection and reload.</div>');return;}
const T=THREE, V=(x,y,z)=>new T.Vector3(x,y,z);
let seed=20261006;
const rnd=()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const rr=(a,b)=>a+rnd()*(b-a), ri=(a,b)=>Math.floor(rr(a,b+1)), pick=a=>a[Math.floor(rnd()*a.length)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t, pad2=n=>String(n).padStart(2,'0');
const col=h=>new T.Color(h).convertSRGBToLinear();
const small=matchMedia('(max-width:760px)').matches;
let simT=0, colorBy='natural';

/* ---------- renderer, light ---------- */
let renderer;
try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}
catch(e){app.insertAdjacentHTML('beforeend','<div class="err panel">This view cannot draw 3D graphics (WebGL is unavailable).</div>');return;}
const DPR=window.devicePixelRatio||1;let pxr=small?Math.min(DPR,1.5):clamp(DPR,1.5,2);renderer.setPixelRatio(pxr);
renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene(), HAZE=col(0xefcba2);
scene.background=HAZE;scene.fog=new T.Fog(HAZE,400,1600);
const cam=new T.PerspectiveCamera(18,1,20,4000);
const SUN=V(-0.80,0.45,0.40).normalize(), SM=small?2048:4096;
const sun=new T.DirectionalLight(col(0xffc88e),3.3);sun.castShadow=true;sun.shadow.mapSize.set(SM,SM);sun.shadow.bias=-0.0004;sun.shadow.normalBias=0.22;
sun.shadow.camera.near=40;sun.shadow.camera.far=1200;scene.add(sun,sun.target);
scene.add(new T.HemisphereLight(col(0xa6b8e0),col(0xc9b29a),.8));
const fill=new T.DirectionalLight(col(0xa9b6e6),.16);fill.position.set(.7,.5,.6);scene.add(fill);

const envTex=(()=>{try{const sc=new T.Scene(),g=new T.SphereGeometry(50,32,16),p=g.attributes.position,c=new Float32Array(p.count*3),hz=[1.5,1.02,.66],zn=[.3,.46,.86],gd=[.5,.44,.4];
  for(let i=0;i<p.count;i++){const y=p.getY(i)/50,ax=(p.getX(i)*SUN.x+p.getZ(i)*SUN.z)/50,w=y>0?Math.pow(y,.45):0,warm=1+.6*Math.max(0,ax);for(let k=0;k<3;k++)c[i*3+k]=y>0?hz[k]*warm*(1-w)+zn[k]*w:gd[k]+(hz[k]*.5-gd[k])*Math.max(0,1+y*6);}
  g.setAttribute('color',new T.BufferAttribute(c,3));sc.add(new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide})));
  const sm=new T.Mesh(new T.SphereGeometry(3.2,16,8),new T.MeshBasicMaterial({color:new T.Color(14,9,4.5)}));sm.position.copy(SUN).multiplyScalar(44);sc.add(sm);
  const pm=new T.PMREMGenerator(renderer),t=pm.fromScene(sc,.015).texture;pm.dispose();return t;}catch(e){return null;}})();
const mats={};
const M_=(hex,o)=>{const k=hex+(o?JSON.stringify(o):'');if(mats[k])return mats[k];const p=Object.assign({color:col(hex),roughness:.82,metalness:0},o||{});if(p.emissive!==undefined)p.emissive=col(p.emissive);
  if(p.env!==undefined){if(envTex){p.envMap=envTex;p.envMapIntensity=p.env;}else p.metalness=Math.min(p.metalness,.3);delete p.env;}return mats[k]=new T.MeshStandardMaterial(p);};
const _m=new T.Matrix4(),_e=new T.Euler(),_o=new T.Object3D(),_col=new T.Color();
function merge(gs){let n=0;for(const g of gs)n+=g.attributes.position.count;const p=new Float32Array(n*3),nm=new Float32Array(n*3),uv=new Float32Array(n*2);let o=0;
  for(const g of gs){p.set(g.attributes.position.array,o*3);nm.set(g.attributes.normal.array,o*3);if(g.attributes.uv)uv.set(g.attributes.uv.array,o*2);o+=g.attributes.position.count;g.dispose();}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(p,3));geo.setAttribute('normal',new T.BufferAttribute(nm,3));geo.setAttribute('uv',new T.BufferAttribute(uv,2));return geo;}
class Builder{
  constructor(){this.m=new Map();}
  push(mat,g){if(!this.m.has(mat))this.m.set(mat,[]);this.m.get(mat).push(g);return this;}
  add(mat,geo,x=0,y=0,z=0,rx=0,ry=0,rz=0){const g=geo.index?geo.toNonIndexed():geo;_m.makeRotationFromEuler(_e.set(rx,ry,rz));_m.setPosition(x,y,z);g.applyMatrix4(_m);if(g!==geo)geo.dispose();return this.push(mat,g);}
  box(mat,sx,sy,sz,x,y,z,rx,ry,rz){return this.add(mat,new T.BoxGeometry(sx,sy,sz),x,y,z,rx,ry,rz);}
  cyl(mat,r,h,x,y,z,rx,ry,rz,seg=12,rt){return this.add(mat,new T.CylinderGeometry(rt===undefined?r:rt,r,h,seg),x,y,z,rx,ry,rz);}
  beam(mat,th,a,b){const g=new T.BoxGeometry(th,th,a.distanceTo(b)).toNonIndexed();_o.position.copy(a).add(b).multiplyScalar(.5);_o.rotation.set(0,0,0);_o.scale.set(1,1,1);_o.lookAt(b);_o.updateMatrix();g.applyMatrix4(_o.matrix);return this.push(mat,g);}
  build(shadow=true){const grp=new T.Group();for(const [mat,gs] of this.m){const mesh=new T.Mesh(merge(gs),mat);mesh.castShadow=shadow;mesh.receiveShadow=true;grp.add(mesh);}return grp;}
}
function plate(text,w,h,fg='#ffffff'){const c=document.createElement('canvas');c.width=256;c.height=Math.max(16,Math.round(256*h/w));const g=c.getContext('2d');g.fillStyle=fg;g.font=`800 ${Math.round(c.height*.8)}px "Arial Narrow","Helvetica Neue",Arial,sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(text,128,c.height*.54,246);
  const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=8;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:t,transparent:true,alphaTest:.35,roughness:.8}));}

/* ---------- world constants (metres) ---------- */
const CL=12.2,CH=2.6,CW=2.44,BAYP=12.9,ROWP=2.75,MAXT=4,NB=6,NR=5,BED=1.32,DECK=3.6,BZ=-11.6;
// quay has two eastbound lanes between the crane legs: LQ is worked under the cranes, LS is where idle tractors stand by
const LQ=8,LS=13,HZ=[10,32,58,84,108],ROADS=[8,13,32,58,84,108],HDIR={8:1,13:1,32:-1,58:-1,84:-1,108:1},VXS=[-112,0,112],OFF=2.3,LANES=[32,58,84];
const GX0=-134,GX1=134,GZ1=160,FENCE_Z=140,GATE_Z=132;

/* ---------- water ---------- */
const uT={value:0};
const waterMat=new T.MeshStandardMaterial({color:col(0x2a8791),roughness:.45,metalness:0});
waterMat.onBeforeCompile=sh=>{sh.uniforms.uT=uT;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(position,1.0)).xyz;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vWP;uniform float uT;
float hs(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hs(i),hs(i+vec2(1,0)),f.x),mix(hs(i+vec2(0,1)),hs(i+vec2(1,1)),f.x),f.y);}`)
  .replace('#include <color_fragment>',`#include <color_fragment>
vec2 p=vWP.xz;
float w1=sin(p.x*.19+uT*.8+sin(p.y*.11+uT*.3)*1.8)*.5+.5;
float w2=sin(p.y*.33-uT*.6+sin(p.x*.07-uT*.2)*2.4)*.5+.5;
float rip=w1*w2;
float n=nz(vec2(p.x*.05+uT*.05,p.y*.4-uT*.13));
float n2=nz(vec2(p.x*.12-uT*.06,p.y*.9+uT*.11));
float toSun=clamp(.6-p.x*.0030-p.y*.0016,0.,1.);
float gl=(smoothstep(.62,.7,n)*.55+smoothstep(.72,.78,n2)*.45)*(.18+.82*toSun);
vec3 base=mix(diffuseColor.rgb*.82,diffuseColor.rgb*1.1,rip);
base=mix(base,vec3(.95,.55,.28),.03+.06*toSun);
diffuseColor.rgb=mix(base,vec3(1.,.84,.58),gl*.7);`);};
const water=new T.Mesh(new T.PlaneGeometry(3200,1800),waterMat);water.rotation.x=-Math.PI/2;water.position.set(0,-2.2,-894);water.receiveShadow=true;scene.add(water);

/* ---------- yard model ---------- */
const mkStack=(x,z,bay,row)=>({x,z,y0:0,items:[],rin:0,rout:0,blk:null,bay,row,top(){return this.y0+this.items.length*CH;}});
const blocks=[];
'ABCDEF'.split('').forEach((name,i)=>{const half=i<3?-1:1,lane=LANES[i%3],cx=half*56,stacks=[];
  for(let b=0;b<NB;b++)for(let r=0;r<NR;r++)stacks.push(mkStack(cx+(b-2.5)*BAYP,lane+4.6+r*ROWP,b,r));
  const blk={name,half,lane,li:i%3,cx,stacks,rtg:null,x0:cx-2.5*BAYP,fill:[.84,.62,.44,.72,.54,.38][i],cap:NB*NR*MAXT};stacks.forEach(s=>s.blk=blk);blocks.push(blk);});
const slotName=s=>`${s.blk.name}-${pad2(s.bay+1)}-${s.row+1}`;
const topOf=s=>s.items[s.items.length-1];
const movable=b=>b&&b.customs!=='Hold'&&b.customs!=='Inspection'&&!b.appt;
const yard={
  reserveIn(half){const c=[];for(const b of blocks)if(b.half===half)for(const s of b.stacks)if(s.items.length<MAXT&&!s.rin&&!s.rout)c.push(s);if(!c.length)return null;const s=pick(c);s.rin++;return s;},
  reserveOut(half,dir){const a=[],c=[];for(const b of blocks)if(b.half===half)for(const s of b.stacks)if(s.items.length&&!s.rin&&!s.rout&&movable(topOf(s))){c.push(s);if(topOf(s).dir===dir)a.push(s);}
    const l=a.length?a:c;if(!l.length)return null;const s=pick(l);s.rout++;return s;},
  count(){let n=0;for(const b of blocks)for(const s of b.stacks)n+=s.items.length;return n;},cap:blocks.length*NB*NR*MAXT
};

/* ---------- ground: flat colour + crisp geometric markings ---------- */
const MK=new Builder(),mkm={};
const mkMat=hex=>mkm[hex]||(mkm[hex]=new T.MeshStandardMaterial({color:col(hex),roughness:.92,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
function quad(hex,x,z,w,d,y=.02){const g=new T.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);MK.add(mkMat(hex),g,x+w/2,y,z+d/2);}
function ln(hex,x1,z1,x2,z2,w=.16,on=0,off=0,y=.035){const len=Math.hypot(x2-x1,z2-z1),h=z1===z2;
  const seg=(a,b)=>{if(h)quad(hex,Math.min(x1,x2)+a,z1-w/2,b-a,w,y);else quad(hex,x1-w/2,Math.min(z1,z2)+a,w,b-a,y);};
  if(!on)seg(0,len);else for(let t=0;t<len;t+=on+off)seg(t,Math.min(len,t+on));}
const arrowShape=(()=>{const s=new T.Shape();s.moveTo(1.9,0);s.lineTo(.4,-.7);s.lineTo(.4,-.2);s.lineTo(-1.9,-.2);s.lineTo(-1.9,.2);s.lineTo(.4,.2);s.lineTo(.4,.7);s.closePath();return s;})();
function arrow(hex,x,z,ang){const g=new T.ShapeGeometry(arrowShape);g.rotateX(-Math.PI/2);MK.add(mkMat(hex),g,x,.035,z,0,ang,0);}
const decalCache={};
function decal(text,x,z,h,css,rot=0){let e=decalCache[text+css];
  if(!e){const c=document.createElement('canvas'),g=c.getContext('2d'),f='900 112px "Arial Black","Helvetica Neue",Arial,sans-serif';g.font=f;c.width=Math.ceil(g.measureText(text).width)+24;c.height=144;const g2=c.getContext('2d');g2.font=f;g2.fillStyle=css;g2.textBaseline='middle';g2.fillText(text,12,78);
    const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=renderer.capabilities.getMaxAnisotropy();
    e=decalCache[text+css]={ar:c.width/c.height,mat:new T.MeshStandardMaterial({map:t,transparent:true,alphaTest:.3,roughness:.92,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4})};}
  const m=new T.Mesh(new T.PlaneGeometry(h*e.ar,h),e.mat);m.rotation.set(-Math.PI/2,0,rot);m.position.set(x,.045,z);m.receiveShadow=true;scene.add(m);}
(function ground(){
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle='#f4f4f4';g.fillRect(0,0,256,256);
  for(let i=0;i<5200;i++){const v=rnd();g.fillStyle=v<.5?`rgba(0,0,0,${.03+.07*rnd()})`:`rgba(255,255,255,${.1+.2*rnd()})`;const s=1+rnd()*2.2;g.fillRect(rnd()*256,rnd()*256,s,s);}
  for(let i=0;i<26;i++){g.strokeStyle=`rgba(0,0,0,${.03+.04*rnd()})`;g.lineWidth=.7;g.beginPath();const x=rnd()*256,y=rnd()*256;g.moveTo(x,y);g.lineTo(x+rr(-40,40),y+rr(-40,40));g.stroke();}
  const nt=new T.CanvasTexture(c);nt.wrapS=nt.wrapT=T.RepeatWrapping;nt.repeat.set(34,20);nt.encoding=T.sRGBEncoding;nt.anisotropy=renderer.capabilities.getMaxAnisotropy();
  const base=new T.Mesh(new T.PlaneGeometry(GX1-GX0,GZ1),new T.MeshStandardMaterial({color:col(0x8b8b8e),map:nt,roughness:.95}));base.rotation.x=-Math.PI/2;base.position.set(0,0,GZ1/2);base.receiveShadow=true;scene.add(base);
  const WH=0xf1eee6,YE=0xe2a81a,CONC=0xb8b6b0,PADC=0xa2a19e,JOINT=0xa09e98;
  quad(CONC,GX0,0,GX1-GX0,25,.012);
  for(let x=GX0+7;x<GX1;x+=7)ln(JOINT,x,1.8,x,25,.07,0,0,.02);
  for(const z of [8,15,22])ln(JOINT,GX0,z,GX1,z,.07,0,0,.02);
  quad(0x8a857f,GX0,0,GX1-GX0,1.1,.022);ln(YE,GX0,1.55,GX1,1.55,.28);
  for(const z of [3,17]){quad(0x4d4946,-132,z-.24,264,.48,.028);quad(0xb4aea6,-132,z-.05,264,.1,.04);}
  quad(0x7c7c80,-116.7,5.2,233.4,10.6,.016);decal('STANDBY',-56,LS,.9,'#b4aea6');decal('STANDBY',56,LS,.9,'#b4aea6');
  const VSEG=[[16,28.5],[35.5,54.5],[61.5,80.5],[87.5,103.4]],HSEG=[[-107.3,-4.7],[4.7,107.3]];
  for(const v of VXS)for(const [a,b] of VSEG){ln(WH,v-4.7,a,v-4.7,b);ln(WH,v+4.7,a,v+4.7,b);ln(YE,v,a,v,b,.15,3,3);}
  for(const z of LANES)for(const [a,b] of HSEG){ln(WH,a,z-3.5,b,z-3.5);ln(WH,a,z+3.5,b,z+3.5,.15,2,2);for(let x=a+12;x<b-6;x+=26)arrow(WH,x,z,Math.PI);}
  for(const [a,b] of HSEG){ln(YE,a,5.2,b,5.2,.2,2.4,1.6);ln(YE,a,15.8,b,15.8,.2,2.4,1.6);ln(WH,a,10.5,b,10.5,.12,1.6,2.4);for(let x=a+22;x<b-4;x+=24)arrow(WH,x,LS,0);ln(WH,a,103.4,b,103.4);ln(WH,a,112.6,b,112.6);for(let x=a+10;x<b-4;x+=24){arrow(YE,x,LQ,0);arrow(WH,x,108,0);}}
  for(const b of blocks){const z0=b.lane+4.6-CW/2-.5,x0=b.x0-CL/2-.6;quad(PADC,x0,z0,5*BAYP+CL+1.2,4*ROWP+CW+1,.012);
    for(const s of b.stacks){const xa=s.x-CL/2,xb=s.x+CL/2,za=s.z-CW/2,zb=s.z+CW/2;ln(YE,xa,za,xb,za,.1);ln(YE,xa,zb,xb,zb,.1);ln(YE,xa,za,xa,zb,.1);ln(YE,xb,za,xb,zb,.1);}
    const zl=b.lane+4.6+4*ROWP+CW/2;
    for(let i=0;i<NB;i++)decal(pad2(i+1),b.x0+i*BAYP,zl+1.5,1.3,'#f1eee6');
    decal('BLOCK '+b.name,b.cx,zl+3.3,1.7,'#f1eee6');
    for(const z of [b.lane-4.3,zl+1.8]){ln(0x6f6b68,x0-2,z-.55,x0+5*BAYP+CL+3.2,z-.55,.1);ln(0x6f6b68,x0-2,z+.55,x0+5*BAYP+CL+3.2,z+.55,.1);}
  }
  decal('BERTH 1',-62,21.4,2.4,'#e2a81a');decal('BERTH 2',62,21.4,2.4,'#e2a81a');
  for(let x=-126;x<=126;x+=14)decal(String(Math.round((x+126)/14)+1),x,4.6,.9,'#8a857f');
  // gate apron
  ln(WH,-9.5,112.6,-9.5,GZ1);ln(WH,9.5,112.6,9.5,GZ1);ln(YE,-.12,112.6,-.12,GZ1,.12);ln(YE,.12,112.6,.12,GZ1,.12);
  quad(WH,-4,GATE_Z-5.4,3.6,.45,.035);quad(WH,.4,GATE_Z+5,3.6,.45,.035);
  decal('OUT',-OFF,150,1.5,'#f1eee6');decal('IN',OFF,154,1.5,'#f1eee6');arrow(WH,-OFF,145.5,-Math.PI/2);arrow(WH,OFF,149,Math.PI/2);
  for(let x=34;x<=70;x+=3)ln(WH,x,130.5,x,135.5,.12);
  quad(0xa69a80,GX0,FENCE_Z+.3,GX1-GX0,GZ1-FENCE_Z-.3,.012);quad(0x8b8b8e,-9.5,FENCE_Z,19,GZ1-FENCE_Z,.016);
  const mk=MK.build(false);scene.add(mk);
})();

/* ---------- static scenery ---------- */
(function scenery(){
  const B=new Builder(),conc=M_(0xa9a297),dark=M_(0x2a2629),cream=M_(0xece6da),glass=M_(0x1f3640,{roughness:.2,metalness:.2}),roof=M_(0xc8481b),roofD=M_(0xa93c16),steel=M_(0x6f6a6c,{roughness:.6}),lamp=M_(0xfff0c8,{emissive:0xffc978,emissiveIntensity:1}),
    hiv=M_(0xf2c21a),hio=M_(0xf07a1c),skin=M_(0xc99878),white=M_(0xf3f1ec);
  B.box(conc,GX1-GX0,5,1.4,0,-2.5,-.7);B.box(M_(0x8f897f),GX1-GX0,.4,1.7,0,-.02,-.78);
  for(let x=-126;x<=126;x+=14){B.cyl(dark,.36,.7,x,.35,2.1,0,0,0,10,.46);B.cyl(dark,.56,.16,x,.78,2.1,0,0,0,10);}
  for(let x=-128;x<=128;x+=6.4)if(Math.abs(x)>3)B.box(dark,1.4,2.6,.7,x,-1.4,-1.72);
  const land=new T.Mesh(new T.PlaneGeometry(3200,1400),M_(0xbfae8c,{roughness:.96}));land.rotation.x=-Math.PI/2;land.position.set(0,-.09,700);land.receiveShadow=true;scene.add(land);
  for(const s of [-1,1])B.box(M_(0xa99b80),1466,.8,10,s*867,-1.35,-4.2,.3,0,0);
  const rd=M_(0x8b8b8e,{roughness:.95});
  for(const [w,d,x,z] of [[19,500,0,410],[2400,11,0,196]]){const r=new T.Mesh(new T.PlaneGeometry(w,d),rd);r.rotation.x=-Math.PI/2;r.position.set(x,-.05,z);r.receiveShadow=true;scene.add(r);}
  // perimeter fence
  const fm=new T.MeshStandardMaterial({color:col(0xdfe3e2),transparent:true,opacity:.3,roughness:.5});
  const F=new Builder();
  const run=(x1,z1,x2,z2)=>{const len=Math.hypot(x2-x1,z2-z1),horiz=z1===z2;F.box(fm,horiz?len:.06,2.4,horiz?.06:len,(x1+x2)/2,1.2,(z1+z2)/2);B.box(steel,horiz?len:.1,.1,horiz?.1:len,(x1+x2)/2,2.45,(z1+z2)/2);
    for(let t=0;t<=len;t+=4)B.box(steel,.12,2.5,.12,x1+(x2-x1)*t/len,1.25,z1+(z2-z1)*t/len);};
  run(GX0+1,FENCE_Z,-11,FENCE_Z);run(11,FENCE_Z,GX1-1,FENCE_Z);run(GX0+1,27,GX0+1,FENCE_Z);run(GX1-1,27,GX1-1,FENCE_Z);
  scene.add(F.build(false));
  // gate: canopy, booths, barriers, OCR portal
  B.box(M_(0xdedbd3),32,.3,9,0,6.92,GATE_Z);B.box(roof,32.4,.75,9.4,0,6.4,GATE_Z);B.box(white,32.5,.2,9.5,0,6.05,GATE_Z);
  for(const x of [-15,-5.8,5.8,15])B.box(white,.5,6.1,.5,x,3.05,GATE_Z);
  for(const x of [-5.8,5.8]){B.box(white,1.9,2.7,3.2,x,1.55,GATE_Z);B.box(glass,1.95,1,3.25,x,2.05,GATE_Z);B.box(roofD,2.3,.18,3.6,x,3,GATE_Z);B.box(conc,2.5,.22,6,x,.11,GATE_Z);}
  B.box(conc,.9,.22,12,0,.11,GATE_Z);
  for(const [x,z,s] of [[-4.2,GATE_Z-5,1],[4.2,GATE_Z+5.4,-1]]){B.box(hiv,.45,1.1,.45,x,.55,z);B.box(M_(0xd43a2c),.1,.1,3.4,x,2.6,z+s*.2,s*.9,0,0);}
  for(const z of [GATE_Z+16]){for(const x of [-9.8,9.8])B.box(steel,.3,6.6,.3,x,3.3,z);B.box(steel,19.9,.3,.3,0,6.5,z);for(const x of [-OFF,OFF]){B.box(dark,.5,.4,.5,x,6.1,z);B.box(lamp,.3,.2,.1,x,5.9,z-.3);}}
  // office and control tower
  B.box(cream,32,9.6,11,50,4.8,124);for(const y of [2.4,5.6,8.4])B.box(glass,32.1,1.4,11.1,50,y,124);B.box(M_(0xd8d0c2),33,.5,12,50,9.85,124);
  B.box(steel,3,1.4,2.4,42,10.8,123);B.box(steel,2.2,1.1,2,56,10.6,125);
  B.box(cream,6,24,6,71,12,124);B.box(glass,8,3.2,8,71,25.6,124);B.box(roof,8.8,.45,8.8,71,27.4,124);B.cyl(steel,.1,5,71,30,124);B.box(lamp,.4,.4,.4,71,32.6,124);
  // workshop
  B.box(cream,42,7.8,14,-72,3.9,124);
  const sh=new T.Shape();sh.moveTo(-7.6,0);sh.lineTo(7.6,0);sh.lineTo(0,3.2);sh.closePath();
  const rg=new T.ExtrudeGeometry(sh,{depth:43,bevelEnabled:false});rg.rotateY(Math.PI/2);B.add(roof,rg,-93.5,7.8,124);
  for(let x=-87;x<=-57;x+=10){B.box(M_(0x7c7775),7,5.8,.25,x,2.9,131.1);for(let y=1;y<5.8;y+=1)B.box(M_(0x696462),7,.06,.3,x,y,131.15);}
  B.box(glass,.25,1.8,10,-50.9,5.4,124);
  // yard light masts
  for(const x of [-103,-8.5,8.5,103])for(const z of [52.5,78.5]){B.cyl(steel,.28,28,x,14,z,0,0,0,8,.14);B.cyl(steel,.8,.3,x,28.1,z,0,0,0,10);for(const a of [0,1,2,3])B.box(lamp,.9,.22,.5,x+Math.cos(a*Math.PI/2)*1.1,27.8,z+Math.sin(a*Math.PI/2)*1.1,0,a*Math.PI/2,0);}
  // people, for scale
  const person=(x,z,v)=>{B.cyl(dark,.13,.85,x,.43,z,0,0,0,6);B.cyl(v,.2,.62,x,1.16,z,0,0,0,8);B.add(skin,new T.SphereGeometry(.14,8,6),x,1.6,z);B.cyl(white,.16,.1,x,1.72,z,0,0,0,8);};
  [[-100,1.3],[-36,1.4],[28,1.3],[102,1.4],[-8.3,GATE_Z-1],[8.2,GATE_Z+1.5],[40,131],[41.2,131.6],[58,130.4],[-60,133.4],[-58.6,134],[-8.8,50.8],[103.6,77],[-103.4,54.2],[6.6,27]].forEach(([x,z],i)=>person(x,z,i%3?hiv:hio));
  // background town
  const tones=[0xe2d6c4,0xd9c0a6,0xe9dfd0,0xc9ad94,0xd6c5b4,0xcfd3d0];
  for(let i=0;i<34;i++){const x=rr(-520,520),z=rr(214,420);if(Math.abs(x)<26)continue;const w=rr(14,36),d=rr(12,28),h=rr(6,24);
    B.box(M_(pick(tones)),w,h,d,x,h/2,z);B.box(M_(pick([0xb65a34,0x8f8f8c,0xc0916c])),w+.8,.5,d+.8,x,h+.25,z);if(h>9)for(let y=3;y<h-1;y+=3.2)B.box(glass,w+.1,1.2,d+.1,x,y,z);}
  for(const s of [-1,1])for(let i=0;i<7;i++){const x=s*rr(165,470),z=rr(36,170),w=rr(22,50),d=rr(18,32),h=rr(7,13);B.box(M_(pick(tones)),w,h,d,x,h/2,z);B.box(M_(pick([0xb65a34,0x8c9a96,0xc0916c])),w+1,.6,d+1,x,h+.3,z);}
  for(let i=0;i<10;i++){const x=-360+i*80,c=i%2?0xc8402e:0x2d8659;B.cyl(M_(c),1.1,2.2,x,-1.4,-104+(i%2)*10,0,0,0,10,.5);B.cyl(M_(c),.12,2.4,x,.8,-104+(i%2)*10);}
  scene.add(B.build());
  // trees
  const pts=[];for(let x=-190;x<=190;x+=10){if(Math.abs(x)>16)pts.push([x+rr(-1.5,1.5),167+rr(-1,1)]);}
  for(let z=30;z<=160;z+=11){pts.push([-142+rr(-1,1),z]);pts.push([142+rr(-1,1),z]);}
  for(let i=0;i<110;i++){const x=rr(-560,560),z=rr(205,440);if(Math.abs(x)<16)continue;pts.push([x,z]);}
  const crown=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),new T.MeshStandardMaterial({roughness:.9,flatShading:true}),pts.length),trunk=new T.InstancedMesh(new T.CylinderGeometry(.18,.26,1,6),M_(0x5f4636),pts.length);
  const greens=[0x6f8f45,0x5f8a4c,0x869a48,0x55804f];
  pts.forEach(([x,z],i)=>{const s=rr(.8,1.3);_o.rotation.set(0,rr(0,6),0);_o.position.set(x,2*s,z);_o.scale.set(1,4*s,1);_o.updateMatrix();trunk.setMatrixAt(i,_o.matrix);
    _o.position.set(x,5.6*s,z);_o.scale.set(2.6*s,3.2*s,2.6*s);_o.updateMatrix();crown.setMatrixAt(i,_o.matrix);crown.setColorAt(i,col(pick(greens)));});
  for(const m of [crown,trunk]){m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;scene.add(m);}
})();

/* ---------- containers: one instanced mesh, detailed atlas ---------- */
const CAP=1300,boxAt=new Array(CAP),freeIdx=[];for(let i=CAP-1;i>=0;i--)freeIdx.push(i);
const cTex=(()=>{const c=document.createElement('canvas');c.width=1024;c.height=512;const g=c.getContext('2d');g.fillStyle='#dadada';g.fillRect(0,0,1024,512);
  const ribs=(x0,y0,w,h,p,a)=>{for(let x=x0+p*.3;x<x0+w-p*.4;x+=p){g.fillStyle=`rgba(0,0,0,${a})`;g.fillRect(x,y0,p*.3,h);g.fillStyle=`rgba(255,255,255,${a*2.4})`;g.fillRect(x+p*.3,y0,p*.16,h);}};
  const frame=(x,y,w,h,t)=>{g.fillStyle='rgba(0,0,0,.34)';g.fillRect(x,y,w,t);g.fillRect(x,y+h-t-2,w,t+2);g.fillRect(x,y,t,h);g.fillRect(x+w-t,y,t,h);g.fillStyle='rgba(0,0,0,.55)';for(const [cx,cy] of [[x,y],[x+w-t*1.7,y],[x,y+h-t*1.5],[x+w-t*1.7,y+h-t*1.5]])g.fillRect(cx,cy,t*1.7,t*1.5);};
  ribs(14,14,996,226,22.6,.2);frame(0,0,1024,256,13);
  g.fillStyle='#ffffff';for(let k=0;k<3;k++){g.beginPath();const x=92+k*40;g.moveTo(x,170);g.lineTo(x+22,170);g.lineTo(x+62,82);g.lineTo(x+40,82);g.closePath();g.fill();}
  g.fillRect(250,98,160,15);g.fillRect(250,124,112,10);g.fillRect(250,142,136,10);
  g.fillRect(806,40,156,13);g.fillRect(806,60,98,8);g.fillRect(806,74,124,8);g.fillRect(806,88,70,8);
  let gr=g.createLinearGradient(0,140,0,256);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.2)');g.fillStyle=gr;g.fillRect(0,140,1024,116);
  // door end
  g.save();g.translate(0,256);for(let y=34;y<236;y+=34){g.fillStyle='rgba(0,0,0,.12)';g.fillRect(16,y,224,5);}
  g.fillStyle='rgba(0,0,0,.5)';g.fillRect(126,14,4,226);
  for(const x of [46,94,158,206]){g.fillStyle='rgba(255,255,255,.8)';g.fillRect(x,16,5,222);g.fillStyle='rgba(0,0,0,.5)';g.fillRect(x-13,150,26,6);g.fillRect(x-3,26,11,7);g.fillRect(x-3,222,11,7);}
  g.fillStyle='rgba(0,0,0,.5)';for(const y of [36,98,160,216]){g.fillRect(13,y,10,9);g.fillRect(233,y,10,9);}
  g.fillStyle='#ffffff';g.fillRect(140,44,70,10);g.fillRect(140,60,52,7);g.fillRect(140,72,64,7);g.fillRect(140,84,40,7);g.fillRect(140,96,58,7);
  frame(0,0,256,256,13);g.restore();
  // front end, roof
  g.save();g.translate(256,256);ribs(14,14,228,226,20,.2);frame(0,0,256,256,13);g.restore();
  g.save();g.translate(512,256);ribs(8,8,496,240,19,.11);g.fillStyle='rgba(0,0,0,.28)';g.fillRect(0,0,512,8);g.fillRect(0,248,512,8);g.fillRect(0,0,8,256);g.fillRect(504,0,8,256);g.restore();
  const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;})();
const cGeo=new T.BoxGeometry(CL,CH,CW);cGeo.translate(0,CH/2,0);
(()=>{const R=[[0,.25,0,.5],[.25,.5,0,.5],[.5,1,0,.5],[.5,1,0,.5],[0,1,.5,1],[0,1,.5,1]],uv=cGeo.attributes.uv;for(let f=0;f<6;f++){const [u0,u1,v0,v1]=R[f];for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,u0+uv.getX(i)*(u1-u0),v0+uv.getY(i)*(v1-v0));}}})();
const CIM=new T.InstancedMesh(cGeo,new T.MeshStandardMaterial({map:cTex,roughness:.6,metalness:.08}),CAP);CIM.castShadow=CIM.receiveShadow=true;CIM.frustumCulled=false;
const ZERO=new T.Matrix4().makeScale(0,0,0);for(let i=0;i<CAP;i++){CIM.setMatrixAt(i,ZERO);CIM.setColorAt(i,_col.set(0xffffff));}scene.add(CIM);
const LINES=[{n:'Lam Hải Line',p:'LHLU',c:0x1f5f8f},{n:'Triều Dương Ocean',p:'TDOU',c:0xa83a26},{n:'Sao Mai Feeder',p:'SMFU',c:0xd19a1f},{n:'Nam Phong Carriers',p:'NPCU',c:0x24365a},{n:'Hoàng Hôn Lines',p:'HHLU',c:0x7a2c2c},{n:'Vàm Chiều Coastal',p:'VCCU',c:0x2f6b4f}];
const MIXC=[0xc9ccca,0x7f878d,0x2f7f86,0xb5522c,0x6b4a36,0x3d6ea3,0x9a9d9f];
const PODS=['Singapore','Hong Kong','Busan','Laem Chabang','Port Klang','Kaohsiung','Yokohama','Long Beach'],PODC=[0x3a7ca5,0xd9a521,0x8f5bb5,0x2f9e77,0xd4682a,0x5d6fc9,0xc0476d,0x7d8a3a];
const COMM={dry:['Garments','Footwear','Wooden furniture','Bagged rice','Coffee beans','Consumer electronics','Ceramic tiles','Natural rubber','Cashew kernels','Machinery parts','Plastic resin','Paper rolls','Auto components','Textile yarn'],
  rf:['Frozen pangasius fillets','Frozen shrimp','Dragon fruit','Fresh mango','Frozen pork cuts','Frozen durian'],dg:[['Paints and varnish','3','UN1263'],['Lithium-ion batteries','9','UN3480'],['Battery acid','8','UN2796'],['Aerosols','2.1','UN1950']]};
const CONS=['Sông Tiền Garment','Đông Hải Trading','Phú Lợi Foods','An Lạc Furniture','Tân Kiên Electronics','Cửu Long Agri Export','Bình An Polymer','Hải Triều Seafood','Long Sơn Machinery','Việt Sứ Ceramics'];
const dwellH=b=>Math.max(0,(simT-b.tIn)/600);
const SCHEME={
  natural:b=>b.color,
  customs:b=>({Cleared:0x93a4ad,Pending:0xe0b03a,Inspection:0x6f55c9,Hold:0xd43a2c})[b.customs],
  dwell:b=>{if(b.where!=='yard')return 0x93a4ad;const d=dwellH(b)/24;return d<2?0x3f9b6e:d<4?0xb5bb46:d<7?0xe29a2c:0xc8402e;},
  weight:b=>b.wt<8?0xdde6ea:b.wt<16?0x97bdca:b.wt<24?0x4688a0:0x18506a,
  pod:b=>PODC[PODS.indexOf(b.pod)],
  type:b=>b.dg?0xd43a2c:b.reefer?0x38a3cf:b.empty?0xe9e5dd:0x8496a3
};
const LEGEND={customs:[['Cleared',0x93a4ad],['Pending',0xe0b03a],['Inspection',0x6f55c9],['Hold',0xd43a2c]],dwell:[['Under 2 d',0x3f9b6e],['2–4 d',0xb5bb46],['4–7 d',0xe29a2c],['Over 7 d',0xc8402e],['Not in yard',0x93a4ad]],
  weight:[['Under 8 t',0xdde6ea],['8–16 t',0x97bdca],['16–24 t',0x4688a0],['Over 24 t',0x18506a]],pod:PODS.map((p,i)=>[p,PODC[i]]),type:[['Dry',0x8496a3],['Reefer',0x38a3cf],['Dangerous goods',0xd43a2c],['Empty',0xe9e5dd]]};
function isoId(prefix){const d=String(ri(100000,999999)),s=prefix+d;let sum=0;for(let i=0;i<10;i++){const ch=s.charCodeAt(i);let v;if(ch<65)v=ch-48;else{const a=ch-65;v=10+a+(a>=1?1:0)+(a>=11?1:0)+(a>=21?1:0);}sum+=v*(1<<i);}return `${prefix} ${d} ${sum%11%10}`;}
let dirtyC=false;
class Box{
  constructor(line){this.kind='box';this.i=freeIdx.pop();boxAt[this.i]=this;this.line=line||pick(LINES);this.id=isoId(this.line.p);
    this.reefer=rnd()<.1;const dg=!this.reefer&&rnd()<.05?pick(COMM.dg):null;this.empty=!this.reefer&&!dg&&rnd()<.07;
    this.type=this.reefer?'40RF':rnd()<.6?'40HC':'40GP';this.iso=this.reefer?'45R1':this.type==='40HC'?'45G1':'42G1';
    this.dg=dg?{cls:dg[1],un:dg[2]}:null;this.commodity=this.empty?'Empty':dg?dg[0]:pick(this.reefer?COMM.rf:COMM.dry);
    this.wt=this.empty?3.9:rr(8,29.8);this.pkgs=this.empty?0:ri(160,1400);this.cons=this.empty?'—':pick(CONS);this.bl=this.empty?'—':'VCT'+ri(10000000,99999999);
    const r=rnd();this.customs=this.empty?'Cleared':r<.83?'Cleared':r<.91?'Pending':r<.96?'Inspection':'Hold';
    this.dir='Import';this.pod=pick(PODS);this.tSet=this.reefer?pick([-18,-18,-20,2,4,8]):null;this.seal='VC'+ri(100000,999999);this.appt=null;
    this.color=this.reefer?0xeeece6:(rnd()<.66?this.line.c:pick(MIXC));this.shade=rr(.86,1.06);this.where='yard';this.ref=null;this.x=this.y=this.z=0;this.rot=0;this.tIn=simT;this.paint();}
  paint(){_col.set(SCHEME[colorBy](this)).convertSRGBToLinear();if(colorBy==='natural')_col.multiplyScalar(this.shade);CIM.setColorAt(this.i,_col);CIM.instanceColor.needsUpdate=true;}
  set(x,y,z,rot=0){this.x=x;this.y=y;this.z=z;this.rot=rot;_o.position.set(x,y,z);_o.rotation.set(0,rot,0);_o.scale.set(1,1,1);_o.updateMatrix();CIM.setMatrixAt(this.i,_o.matrix);dirtyC=true;}
  free(){CIM.setMatrixAt(this.i,ZERO);dirtyC=true;boxAt[this.i]=null;freeIdx.push(this.i);this.dead=true;if(sel===this)select(null);}
  get label(){return this.id;}
  center(v){return v.set(this.x,this.y+CH+.5,this.z);}
  frame(){return {x:this.x,y:this.y+CH/2,z:this.z,rot:this.rot,d:[CL+.6,CH+.4,CW+.6]};}
}
function repaintAll(){for(const b of boxAt)if(b)b.paint();}
for(const b of blocks)for(const s of b.stacks){const n=rnd()<b.fill?ri(1,MAXT):(rnd()<.4?ri(0,2):0);for(let k=0;k<n;k++){const c=new Box();c.ref=s;c.dir=rnd()<.5?'Import':'Export';c.tIn=-(rnd()<.06?rr(8,14):rr(0,6.5))*14400;c.set(s.x,k*CH,s.z);s.items.push(c);c.paint();}}

/* ---------- coroutines, stats, events ---------- */
function* sleep(s){let t=0;while(t<s)t+=(yield)||0;}
function* until(f){while(!f())yield;}
function* moveTo(c,tg){for(;;){const dt=(yield)||0;let done=true;for(const k in tg){const d=tg[k]-c[k],ad=Math.abs(d);if(ad<1e-3){c[k]=tg[k];continue;}const v=Math.min(c.sp[k],Math.max(c.sp[k]*.2,ad*2.6)),st=v*dt;if(ad<=st)c[k]=tg[k];else{c[k]+=Math.sign(d)*st;done=false;}}if(done)return;}}
const cos=[],stats={moves:[],total:412,turn:[7.6,8.3,6.9,7.4],gateIn:0,gateDone:37,rehandles:0};
for(let t=-200;t<0;t+=5.6)stats.moves.push(t);
const clockAt=t=>{const s=16*3600+42*60+t*6,h=((Math.floor(s/3600)%24)+24)%24,m=((Math.floor(s/60)%60)+60)%60;return pad2(h)+':'+pad2(m);};
const events=[];let unread=0;
function ev(kind,text,ent){events.unshift({t:clockAt(simT),kind,text,ent});if(events.length>40)events.pop();if(simT>80)unread++;}

/* ---------- cranes ---------- */
const ents=[],cranes=[],Zax=V(0,0,1);
class Crane{
  constructor(kind,id){this.kind=kind;this.id=id;this.g=0;this.t=0;this.h=0;this.cargo=null;this.status='Idle';this.idle=true;this.moves=0;this.engaged=false;this.group=new T.Group();this.group.userData.ent=this;scene.add(this.group);cranes.push(this);ents.push(this);}
  get label(){return this.id;}
  sync(){this.group.position.x=this.g;this.trolley.position.z=this.t;this.spreader.position.set(0,this.h,this.t);
    const len=Math.max(.1,this.ropeTop-this.h-1.1);this.ropes.forEach((r,i)=>{r.scale.y=len;r.position.set(i&1?2.4:-2.4,this.h+1.1+len/2,this.t+(i&2?.7:-.7));});
    if(this.cargo)this.cargo.set(this.g,this.h-CH,this.t,0);}
}
function spreaderModel(){const yel=M_(0xe9b21f,{roughness:.5}),dark=M_(0x2a2629),S=new Builder();
  for(const z of [-.95,.95])S.box(yel,CL,.28,.3,0,.14,z);for(const x of [-CL/2+.2,-3,3,CL/2-.2])S.box(yel,.4,.28,CW,x,.14,0);
  S.box(dark,3.4,.8,1.9,0,.68,0);S.box(yel,5,.3,1.2,0,.3,0);for(const x of [-CL/2,CL/2])for(const z of [-1.1,1.1])S.box(dark,.3,.5,.3,x,.1,z);return S;}
function craneRig(c,top,trolleyB){c.trolley=trolleyB.build();c.trolley.position.y=top;c.spreader=spreaderModel().build();c.ropeTop=top-.4;c.ropes=[];
  const rg=new T.BoxGeometry(.08,1,.08),rm=M_(0x2a2629);for(let i=0;i<4;i++){const r=new T.Mesh(rg,rm);c.ropes.push(r);c.group.add(r);}c.group.add(c.trolley,c.spreader);}
function makeSTS(id,berth,g0,range){
  const c=new Crane('sts',id),R=M_(0xc9481b,{roughness:.55}),Rd=M_(0xa33a15),white=M_(0xf1efe9,{roughness:.6}),dark=M_(0x2a2629),steel=M_(0x6f6a6c),glass=M_(0x1f3640,{roughness:.2,metalness:.2}),lamp=M_(0xfff0c8,{emissive:0xffc978,emissiveIntensity:1});
  const LX=7.6,Z1=3,Z2=17,TOP=27,F=new Builder();
  for(const x of [-LX,LX]){for(const z of [Z1,Z2]){F.box(R,1.3,TOP,1.3,x,TOP/2+1,z);F.box(dark,4.2,.9,1.5,x,.75,z);for(const wx of [-1.5,-.5,.5,1.5])F.cyl(steel,.38,.5,x+wx,.38,z,Math.PI/2,0,0,10);}
    F.box(R,1,1.1,Z2-Z1,x,13,(Z1+Z2)/2);F.box(R,1,1.3,Z2-Z1,x,TOP+.6,(Z1+Z2)/2);F.beam(R,.55,V(x,2.8,Z1),V(x,13,Z2));F.beam(R,.55,V(x,13,Z1),V(x,TOP,Z2));
    F.box(steel,.12,TOP-2,.9,x+(x>0?.72:-.72),TOP/2+1,Z2+.2);for(let y=3;y<TOP;y+=1.2)F.box(steel,.14,.06,.9,x+(x>0?.74:-.74),y,Z2+.2);}
  for(const z of [Z1,Z2]){F.box(R,2*LX+1.3,1.4,1.4,0,2.5,z);F.box(R,2*LX+1.3,1.5,1.4,0,TOP+.6,z);}
  for(const x of [-2.9,2.9])F.box(R,.9,1.7,26,x,TOP+2.1,13);
  F.box(R,6.7,1,1,0,TOP+2.1,26);for(let z=4;z<26;z+=5.4)F.box(R,5.8,.4,.5,0,TOP+2.9,z);
  for(const x of [-3,3]){F.beam(R,.8,V(x,TOP+1,Z1+.6),V(x*.4,44.5,6.5));F.beam(R,.5,V(x*.4,44.5,6.5),V(x,TOP+2.8,25));}
  F.box(R,3.2,1,1,0,44.5,6.5);F.box(lamp,.5,.5,.5,0,45.4,6.5);
  F.box(white,9.6,4.6,8,0,TOP+5.3,19.6);F.box(Rd,10,.4,8.4,0,TOP+7.8,19.6);F.box(glass,9.7,1,2.6,0,TOP+5.6,16.4);F.box(steel,2,1.2,1.6,-2.6,TOP+8.6,20);
  for(const z of [7,13,21])F.box(lamp,4.2,.2,.5,0,TOP+1.15,z);
  F.box(steel,1.4,2.6,2.6,LX+1.4,4.6,Z2,0,0,0);F.cyl(steel,1.5,.5,LX+1.4,4.6,Z2-1.6,Math.PI/2,0,0,16);
  c.group.add(F.build());
  for(const [z,ry,y,w] of [[Z2+.72,0,2.5,5.2],[23.62,0,TOP+5.3,5.8]]){const p=plate(id.replace('-',' '),w,w*.26);p.position.set(0,y,z);p.rotation.y=ry;c.group.add(p);}
  c.pivot=new T.Group();c.pivot.position.set(0,TOP+2.1,.5);const Bm=new Builder();
  for(const x of [-2.9,2.9])Bm.box(R,.9,1.7,31,x,0,-15.5);
  for(let z=-4;z>=-31;z-=5.4)Bm.box(R,5.8,.4,.5,0,.8,z);Bm.box(R,6.7,1,1,0,0,-31);for(const z of [-10,-22])Bm.box(lamp,4.2,.2,.5,0,-.95,z);
  c.pivot.add(Bm.build());c.group.add(c.pivot);
  c.stays=[-15,-30].map(()=>{const m=new T.Mesh(new T.BoxGeometry(.38,.38,1),R);m.castShadow=true;c.group.add(m);return m;});c.stayZ=[-15,-30];c.apex=V(0,44.5,6.5);
  const Tr=new Builder();Tr.box(white,7,.9,4.2,0,0,0);Tr.box(white,2,2.2,2.2,4,-1.6,.2);Tr.box(glass,2.05,1.1,2.25,4,-1.5,.2);Tr.box(glass,1.6,.1,1.8,4,-2.72,.2);
  craneRig(c,TOP+1,Tr);
  Object.assign(c,{berth,g:g0,t:LQ,h:24,safe:24,sp:{g:3.2,t:10,h:8},stopX:g0,atStop:null,assigned:0,range,col:range[0],boom:0,boomT:0,exhausted:false});
  c.center=v=>v.set(c.g,47,6);c.frame=()=>({x:c.g,y:15,z:10,rot:0,d:[18,30,17]});
  return c;
}
function syncBoom(c){c.pivot.rotation.x=c.boom;const cs=Math.cos(c.boom),sn=Math.sin(c.boom);
  c.stays.forEach((m,i)=>{const z=c.stayZ[i],p=V(0,c.pivot.position.y+.9*cs-z*sn,c.pivot.position.z+.9*sn+z*cs),d=p.clone().sub(c.apex),len=d.length();m.position.copy(c.apex).add(p).multiplyScalar(.5);m.quaternion.setFromUnitVectors(Zax,d.normalize());m.scale.z=len;});}
function makeRTG(id,blk){
  const c=new Crane('rtg',id),Y=M_(0xe3a81c,{roughness:.55}),white=M_(0xf1efe9),dark=M_(0x2a2629),steel=M_(0x6f6a6c),glass=M_(0x1f3640,{roughness:.2,metalness:.2}),lamp=M_(0xfff0c8,{emissive:0xffc978,emissiveIntensity:1});
  const zN=blk.lane-4.3,zS=blk.lane+4.6+4*ROWP+CW/2+1.8,HT=19,LXR=4.6,F=new Builder();
  for(const z of [zN,zS]){for(const x of [-LXR,LXR]){F.box(Y,.8,HT-.6,.8,x,HT/2+1.3,z);F.box(Y,2.6,.8,1,x,1.5,z);for(const wx of [-.85,.85]){F.cyl(dark,.72,.55,x+wx,.72,z,Math.PI/2,0,0,16);F.cyl(steel,.36,.58,x+wx,.72,z,Math.PI/2,0,0,10);}}
    F.box(Y,2*LXR+.8,.9,.9,0,2.4,z);F.box(Y,2*LXR+.8,1,1,0,HT+1.4,z);F.beam(Y,.4,V(-LXR,2.6,z),V(0,7.5,z));F.beam(Y,.4,V(LXR,2.6,z),V(0,7.5,z));}
  for(const x of [-2.4,2.4])F.box(Y,.8,1.5,zS-zN+1.6,x,HT+1.4,(zN+zS)/2);
  F.box(white,3.6,2.3,2.2,0,4.2,zS+.3);F.box(steel,3.8,.2,2.4,0,5.4,zS+.3);F.box(steel,.12,HT-5,.8,LXR+.55,HT/2+2.5,zS);
  for(const z of [zN+3,(zN+zS)/2,zS-3])F.box(lamp,3.6,.2,.4,0,HT+.55,z);
  c.group.add(F.build());
  const p=plate(id.replace('-',' '),4.6,1.05,'#1c191f');p.position.set(0,HT+1.4,zS+.52);c.group.add(p);
  const Tr=new Builder();Tr.box(white,5.6,.9,3.6,0,0,0);Tr.box(white,1.7,2,1.9,-2.2,-1.5,-.2);Tr.box(glass,1.75,1,1.95,-2.2,-1.4,-.2);
  craneRig(c,HT+.4,Tr);
  Object.assign(c,{blk,g:blk.cx+rr(-22,22),t:blk.lane+4.6+2*ROWP,h:14.6,safe:14.6,laneZ:blk.lane,sp:{g:5.5,t:6.5,h:6.5},queue:[]});
  blk.rtg=c;c.center=v=>v.set(c.g,HT+4.5,(zN+zS)/2);c.frame=()=>({x:c.g,y:10.6,z:(zN+zS)/2,rot:0,d:[11.4,21.2,zS-zN+2.6]});
  return c;
}
blocks.forEach(b=>makeRTG('RTG-'+b.name,b));

/* ---------- vessels ---------- */
const VNAMES=['MV Hải Âu','MV Sao Mai','MV Hoàng Hôn','MV Lam Giang','MV Nam Phong','MV Triều Dương'],HULLS=[0x1b4a5c,0x26334f,0x6e2a23,0x2f4a3f,0x3b2b47,0x20262e];
let vN=0;
const berths=[{id:'B1',name:'Berth 1',cx:-62,half:-1,exitX:0,lapX:-96,cranes:[],vessel:null,next:null,nextAt:0,sbE:0,sbN:0},{id:'B2',name:'Berth 2',cx:62,half:1,exitX:112,lapX:16,cranes:[],vessel:null,next:null,nextAt:0,sbE:0,sbN:0}];
// a crane is worth driving to if it still has lifts to hand out, or is already holding a box for a truck
berths.forEach(b=>{b.pickCrane=()=>{const v=b.vessel,dry=v&&v.mode==='discharge'&&v.jobsLeft<=0;let best=null;for(const c of b.cranes){if(dry?!c.cargo:c.exhausted)continue;if(!best||c.assigned<best.assigned)best=c;}return best||b.cranes.find(c=>c.cargo)||b.cranes[0];};});
const planCall=mode=>{const k=vN++;return {name:VNAMES[k%VNAMES.length],line:LINES[k%LINES.length],hull:HULLS[k%HULLS.length],mode,planned:ri(30,38),voy:ri(101,389)+(mode==='discharge'?'N':'S')};};
const etdOf=v=>v.phase==='work'?simT+(v.planned-v.done)*13.5+25:v.phase==='done'?simT+6:v.phase==='depart'?v.tDep:simT+55+v.planned*13.5;
function makeVessel(b,plan){
  const {name,line,mode}=plan;
  const v={kind:'vessel',id:name,name,line,mode,voy:plan.voy,berth:b,x:0,z:0,done:0,planned:plan.planned,jobsLeft:0,toDispatch:0,phase:'arrive',status:'Arriving',last:null,imo:'IMO 9'+ri(100000,899999),tArr:simT};
  const B=new Builder(),white=M_(0xf1efe9,{roughness:.6}),glass=M_(0x1f3640,{roughness:.2,metalness:.2}),deck=M_(0x7d5a4a),steel=M_(0x6f6a6c),lamp=M_(0xfff0c8,{emissive:0xffc978,emissiveIntensity:1}),hullM=M_(plan.hull,{roughness:.5});
  const sh=new T.Shape();sh.moveTo(-55,-9.8);sh.lineTo(40,-9.8);sh.quadraticCurveTo(54,-8.8,60,0);sh.quadraticCurveTo(54,8.8,40,9.8);sh.lineTo(-55,9.8);sh.quadraticCurveTo(-57.4,0,-55,-9.8);
  const hg=new T.ExtrudeGeometry(sh,{depth:6.8,bevelEnabled:false,curveSegments:14});hg.rotateX(Math.PI/2);B.add(hullM,hg,0,DECK,0);
  const bg=new T.ExtrudeGeometry(sh,{depth:2.4,bevelEnabled:false,curveSegments:14});bg.rotateX(Math.PI/2);bg.scale(1.003,1,1.012);B.add(M_(0x8d2f22),bg,0,-.8,0);
  const wl=new T.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:false,curveSegments:14});wl.rotateX(Math.PI/2);wl.scale(1.004,1,1.014);B.add(white,wl,0,-.62,0);
  const dg=new T.ShapeGeometry(sh,14);dg.rotateX(-Math.PI/2);dg.scale(.99,1,.95);B.add(deck,dg,0,DECK+.04,0);
  // bulwark, hatch covers, lashing bridges
  for(const s of [-1,1]){B.box(hullM,96,1,.18,-7,DECK+.5,s*9.66);B.box(white,96,.07,.07,-7,DECK+1.25,s*9.5);for(let x=-54;x<=40;x+=3.2)B.box(white,.06,.3,.06,x,DECK+1.1,s*9.5);}
  for(let i=0;i<6;i++){B.box(M_(0x5b4d48),CL+.3,.3,16.6,-32+i*BAYP,DECK+.16,0);B.box(steel,.35,2.9,17,-32+(i-.5)*BAYP,DECK+1.5,0);}
  B.box(steel,.35,2.9,17,-32+5.5*BAYP,DECK+1.5,0);
  // forecastle, mast, windlass
  B.box(hullM,13,1.4,13,46,DECK+.7,0);B.box(deck,12.6,.1,12.6,46,DECK+1.45,0);B.cyl(steel,.22,9,48,DECK+6,0);B.box(lamp,.35,.35,.35,48,DECK+10.7,0);for(const s of [-1,1])B.cyl(steel,.7,1.6,50,DECK+2.1,s*2.6,Math.PI/2,0,0,10);
  // accommodation, bridge, funnel, lifeboat
  B.box(white,11,13.4,16,-47.5,DECK+6.7,0);for(const y of [3,6,9,12])B.box(glass,11.1,.9,16.1,-47.5,DECK+y,0);
  B.box(white,6.6,3,19.8,-45.8,DECK+14.9,0);B.box(glass,6.7,1.2,19.9,-45.8,DECK+15.2,0);B.box(M_(0xd8d2c8),7.2,.3,20.4,-45.8,DECK+16.55,0);
  B.cyl(steel,.2,6,-45.5,DECK+19.6,0);B.box(steel,.25,.25,4,-45.5,DECK+21.4,0);B.box(lamp,.35,.35,.35,-45.5,DECK+22.8,0);B.box(white,2.6,.8,2.6,-44,DECK+17.1,3);
  B.box(M_(line.c),3.8,6,5,-51.4,DECK+15.4,0);B.box(M_(0x1f1c1f),3.9,1.1,5.1,-51.4,DECK+18.9,0);B.box(white,3.86,1.2,5.06,-51.4,DECK+16.2,0);
  B.box(M_(0xe2641c),5.6,1.5,2,-49,DECK+9.4,8.6);B.box(M_(0xe2641c),4.6,.9,1.8,-49,DECK+10.5,8.6);
  v.group=B.build();v.group.userData.ent=v;
  const nm=plate(name.replace('MV ','').toUpperCase(),13,1.7,'#f1efe9');v.tex=nm.material.map;
  for(const s of [1,-1]){const p=s>0?nm:nm.clone();p.position.set(37,.9,s*9.82);p.rotation.y=s<0?Math.PI:0;v.group.add(p);}
  scene.add(v.group);
  v.cols=[];for(let i=0;i<6;i++){const stacks=[];for(let r=0;r<6;r++){const lx=-32+i*BAYP,lz=(r-2.5)*ROWP;stacks.push({lx,lz,y0:DECK+.3,items:[],rin:0,rout:0,v,get x(){return v.x+lx;},get z(){return v.z+lz;},top(){return this.y0+this.items.length*CH;}});}
    v.cols.push({stacks,i,bay:pad2(22-i*4),get x(){return v.x-32+i*BAYP;}});}
  v.cols.forEach((cl,ci)=>cl.stacks.forEach(st=>{const served=ci<2||ci>3,n=!served?(rnd()<.8?MAXT:3):(mode==='discharge'?(rnd()<.85?ri(2,4):1):(rnd()<.7?ri(0,2):3));for(let j=0;j<n;j++){const bx=new Box(rnd()<.75?line:null);bx.where='ship';bx.ref=v;bx.dir=served&&mode==='discharge'?'Import':'Transship';if(bx.customs==='Hold')bx.customs='Pending';st.items.push(bx);}}));
  v.setPos=(x,z)=>{v.x=x;v.z=z;v.group.position.set(x,0,z);for(const cl of v.cols)for(const st of cl.stacks){const sx=st.x,sz=st.z;for(let j=0;j<st.items.length;j++)st.items[j].set(sx,st.y0+j*CH,sz);}};
  v.center=q=>q.set(v.x-46,DECK+27,v.z);v.frame=()=>({x:v.x+1.5,y:6.5,z:v.z,rot:0,d:[120,20,21.5]});
  Object.defineProperty(v,'label',{get:()=>v.name});
  v.dispose=()=>{for(const cl of v.cols)for(const st of cl.stacks)st.items.forEach(bx=>bx.free());scene.remove(v.group);v.group.traverse(o=>{if(o.geometry)o.geometry.dispose();});v.tex.dispose();const i=ents.indexOf(v);if(i>=0)ents.splice(i,1);v.dead=true;if(sel===v)select(null);if(tracked===v)tracked=null;};
  ents.push(v);return v;
}
const ease=u=>u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;
function* glide(v,x1,z1,dur,fn){const x0=v.x,z0=v.z;let t=0;while(t<dur){t+=(yield)||0;const u=fn(clamp(t/dur,0,1));v.setPos(lerp(x0,x1,u),lerp(z0,z1,u));}}
function* berthLife(b,mode,warm){
  let first=true,plan=planCall(mode);
  for(;;){
    const v=makeVessel(b,plan);b.vessel=v;b.next=planCall(mode==='discharge'?'load':'discharge');
    b.cranes.forEach(c=>{c.col=c.range[0];c.exhausted=false;});
    if(first){v.setPos(b.cx,BZ);v.done=warm;v.tArr=-(330+warm*14);v.tBerth=v.tArr+70;v.tWork=v.tBerth+22;b.cranes.forEach(c=>{c.boom=c.boomT=0;});}
    else{
      v.setPos(b.cx-430,-54);ev('vessel',`${v.name} inbound for ${b.name}`,v);
      yield* glide(v,b.cx,-54,34,u=>1-Math.pow(1-u,2.2));
      v.status='Berthing';yield* glide(v,b.cx,BZ,10,ease);
      v.phase='moor';v.status='Mooring';v.tBerth=simT;b.cranes.forEach(c=>c.boomT=0);ev('vessel',`${v.name} all fast at ${b.name}`,v);
      yield* sleep(2.5);yield* until(()=>b.cranes.every(c=>c.boom<.02));v.tWork=simT;
    }
    v.jobsLeft=v.toDispatch=v.planned-v.done;v.phase='work';b.sbE++;b.sbN=0;v.status=mode==='discharge'?'Discharging':'Loading';
    let guard=0;
    while(!(v.done>=v.planned&&b.cranes.every(c=>c.idle&&!c.cargo))){guard+=(yield)||0;if(guard>1500){v.jobsLeft=v.toDispatch=0;if(b.cranes.every(c=>c.idle&&!c.cargo))break;}}
    v.phase='done';v.status='Completed';v.tDone=simT;ev('vessel',`${v.name} completed ${v.done} moves`,v);yield* sleep(4);
    b.cranes.forEach(c=>c.boomT=1.22);v.phase='depart';v.status='Departing';v.tDep=simT;
    yield* sleep(4);yield* glide(v,b.cx,-54,10,ease);ev('vessel',`${v.name} sailed from ${b.name}`,null);yield* glide(v,b.cx+470,-60,34,u=>u*u);
    v.dispose();b.vessel=null;b.nextAt=simT+7+44;yield* sleep(7);plan=b.next;mode=plan.mode;first=false;
  }
}
function logMove(v,c,box,from,to){v.done++;c.moves++;stats.total++;stats.moves.push(simT);v.last={box,from,to,crane:c.id};}
function* stsLoop(c){
  const b=c.berth;
  for(;;){
    const v=b.vessel;
    if(!v||v.phase!=='work'||c.boom>.02){c.status=c.boom>.02&&c.boomT===0?'Lowering boom':c.boom>.02?'Boom up':'Idle';c.idle=true;yield;continue;}
    if(v.mode==='discharge'){
      let st=null;
      if(v.jobsLeft>0){for(;c.col<=c.range[1];c.col++){for(const s of v.cols[c.col].stacks)if(s.items.length&&!s.rout&&(!st||s.items.length>st.items.length))st=s;if(st)break;}}
      if(!st){if(v.jobsLeft>0)c.exhausted=true;c.status='Idle';c.idle=true;yield;continue;}
      c.idle=false;v.jobsLeft--;st.rout++;c.stopX=st.x;
      c.status='Gantry travel';yield* moveTo(c,{g:st.x,h:c.safe});
      c.status='Trolley out';yield* moveTo(c,{t:st.z});
      c.status='Lowering';yield* moveTo(c,{h:st.top()});
      const box=st.items.pop();st.rout--;c.cargo=box;box.where='hook';box.ref=c;yield* sleep(.5);
      c.status='Hoisting';yield* moveTo(c,{h:c.safe});
      c.status='Trolley in';yield* moveTo(c,{t:LQ});
      c.status='Waiting for truck';
      yield* until(()=>{const t=c.atStop;return t&&!t.cargo&&t.v===0&&Math.abs(t.pos.x-c.g)<.5;});
      const tr=c.atStop;c.engaged=true;c.status='Lowering';yield* moveTo(c,{t:tr.pos.z,h:BED+CH});
      tr.cargo=box;box.where='truck';box.ref=tr;box.dir='Import';c.cargo=null;yield* sleep(.4);c.engaged=false;
      logMove(v,c,box,v.name,tr.id);c.status='Hoisting';yield* moveTo(c,{h:c.safe});
    }else{
      let cl=null;for(;c.col<=c.range[1];c.col++){if(v.cols[c.col].stacks.some(s=>s.items.length+s.rin<MAXT)){cl=v.cols[c.col];break;}}
      if(!cl){c.exhausted=true;c.status='Idle';c.idle=true;yield;continue;}
      c.stopX=cl.x;
      if(Math.abs(c.g-cl.x)>.01||Math.abs(c.t-LQ)>.01||c.h<c.safe-.01){c.idle=false;c.status='Gantry travel';yield* moveTo(c,{g:cl.x,t:LQ,h:c.safe});}
      c.idle=true;c.status=v.done>=v.planned?'Idle':'Waiting for truck';
      const tr=c.atStop;if(!(tr&&tr.cargo&&tr.v===0&&Math.abs(tr.pos.x-c.g)<.5)){yield;continue;}
      let st=null;for(const s of cl.stacks)if(s.items.length+s.rin<MAXT&&(!st||s.items.length<st.items.length))st=s;st.rin++;
      c.idle=false;c.engaged=true;c.status='Lowering';yield* moveTo(c,{t:tr.pos.z,h:BED+CH});
      const box=tr.cargo;tr.cargo=null;c.cargo=box;box.where='hook';box.ref=c;yield* sleep(.4);c.engaged=false;
      c.status='Hoisting';yield* moveTo(c,{h:c.safe});
      c.status='Trolley out';yield* moveTo(c,{t:st.z});
      c.status='Lowering';yield* moveTo(c,{h:st.top()+CH});
      st.items.push(box);st.rin--;c.cargo=null;box.where='ship';box.ref=v;box.dir='Export';box.set(st.x,st.top()-CH,st.z);yield* sleep(.4);
      logMove(v,c,box,tr.id,v.name);c.status='Hoisting';yield* moveTo(c,{h:c.safe});c.status='Trolley in';yield* moveTo(c,{t:LQ});
    }
  }
}
function shiftTarget(st){let best=null,bs=1e9;for(const s of st.blk.stacks){if(s===st||s.rin||s.rout||s.items.length>=MAXT)continue;const sc=Math.abs(s.bay-st.bay)*10+Math.abs(s.row-st.row)+s.items.length*.6;if(sc<bs){bs=sc;best=s;}}return best;}
function* rtgShift(c,from,to){
  c.status='Gantry travel';yield* moveTo(c,{g:from.x,t:from.z,h:c.safe});
  c.status='Lowering';yield* moveTo(c,{h:from.top()});
  const box=from.items.pop();c.cargo=box;box.where='hook';box.ref=c;yield* sleep(.4);
  c.status='Hoisting';yield* moveTo(c,{h:c.safe});c.status='Trolley travel';yield* moveTo(c,{g:to.x,t:to.z});
  c.status='Stacking';yield* moveTo(c,{h:to.top()+CH});
  to.items.push(box);c.cargo=null;box.where='yard';box.ref=to;box.set(to.x,to.top()-CH,to.z);yield* sleep(.4);
  c.status='Hoisting';yield* moveTo(c,{h:c.safe});return box;
}
function* digOut(c,st,box){while(st.items.length&&topOf(st)!==box&&st.items.includes(box)){const t2=shiftTarget(st);if(!t2){yield* sleep(1);continue;}t2.rin++;yield* rtgShift(c,st,t2);t2.rin--;stats.rehandles++;}}
function* rtgLoop(c){
  for(;;){
    const q=c.queue[0];if(!q){c.status='Idle';c.idle=true;yield;continue;}
    c.idle=false;const st=q.stack,tr=q.truck;
    if(q.type==='shift'){
      yield* digOut(c,st,q.box);
      if(topOf(st)===q.box){const t2=shiftTarget(st);if(t2){t2.rin++;yield* rtgShift(c,st,t2);t2.rin--;ev('yard',`${q.box.id} restowed to ${slotName(t2)}`,q.box);}}
      st.rout--;q.free=true;
    }else if(q.type==='store'){
      c.status='Gantry travel';yield* moveTo(c,{g:tr.pos.x,t:c.laneZ,h:c.safe});
      c.status='Lowering';yield* moveTo(c,{h:BED+CH});
      const box=tr.cargo;tr.cargo=null;c.cargo=box;box.where='hook';box.ref=c;yield* sleep(.4);q.free=true;
      c.status='Hoisting';yield* moveTo(c,{h:c.safe});c.status='Trolley travel';yield* moveTo(c,{g:st.x,t:st.z});
      c.status='Stacking';yield* moveTo(c,{h:st.top()+CH});
      st.items.push(box);st.rin--;c.cargo=null;box.where='yard';box.ref=st;box.tIn=simT;box.set(st.x,st.top()-CH,st.z);if(colorBy==='dwell')box.paint();yield* sleep(.4);
      c.status='Hoisting';yield* moveTo(c,{h:c.safe});
    }else{
      if(q.box)yield* digOut(c,st,q.box);
      c.status='Gantry travel';yield* moveTo(c,{g:st.x,t:st.z,h:c.safe});
      c.status='Lowering';yield* moveTo(c,{h:st.top()});
      const box=st.items.pop();st.rout--;c.cargo=box;box.where='hook';box.ref=c;yield* sleep(.4);
      c.status='Hoisting';yield* moveTo(c,{h:c.safe});c.status='Trolley travel';yield* moveTo(c,{g:tr.pos.x,t:c.laneZ});
      c.status='Loading truck';yield* moveTo(c,{h:BED+CH});
      tr.cargo=box;box.where='truck';box.ref=tr;c.cargo=null;if(colorBy==='dwell')box.paint();yield* sleep(.4);q.free=true;
      c.status='Hoisting';yield* moveTo(c,{h:c.safe});
    }
    c.queue.shift();c.moves++;
  }
}

/* ---------- roads and trucks ---------- */
const nextV=(x,d)=>{if(d>0){for(const v of VXS)if(v>x+.6)return v;return VXS[2];}for(let i=2;i>=0;i--)if(VXS[i]<x-.6)return VXS[i];return VXS[0];};
const upV=(x,d)=>nextV(x,-d);
const vx=(v,z1,z2)=>v+(z2<z1?OFF:-OFF);
const snapZ=z=>{let b=ROADS[0];for(const h of ROADS)if(Math.abs(h-z)<Math.abs(b-z))b=h;return b;};
function route(A,B){
  const dA=HDIR[A.z],dB=HDIR[B.z];
  if(A.z===B.z&&(B.x-A.x)*dA>.5)return [A,B];
  const vo=nextV(A.x,dA),vi=upV(B.x,dB);
  if(vo===vi&&A.z!==B.z){const x=vx(vo,A.z,B.z);return [A,{x,z:A.z},{x,z:B.z},B];}
  const need=Math.sign(vi-vo)||1;let best=108,bc=1e9;for(const z of ROADS){if(z===LQ||z===LS||HDIR[z]!==need)continue;const c=Math.abs(A.z-z)+Math.abs(z-B.z);if(c<bc){bc=c;best=z;}}
  const x1=vx(vo,A.z,best),x2=vx(vi,best,B.z);return [A,{x:x1,z:A.z},{x:x1,z:best},{x:x2,z:best},{x:x2,z:B.z},B];
}
function makePath(raw){
  const pts=[];for(const p of raw){const l=pts[pts.length-1];if(!l||Math.hypot(p.x-l.x,p.z-l.z)>.05)pts.push(p);}
  const out=[pts[0]];
  for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],c=pts[i+1],la=Math.hypot(a.x-b.x,a.z-b.z),lc=Math.hypot(c.x-b.x,c.z-b.z);
    const cr=(b.x-a.x)*(c.z-b.z)-(b.z-a.z)*(c.x-b.x);if(Math.abs(cr)<1e-4)continue;
    const r=Math.min(7,la/2,lc/2),p1={x:b.x+(a.x-b.x)/la*r,z:b.z+(a.z-b.z)/la*r},p2={x:b.x+(c.x-b.x)/lc*r,z:b.z+(c.z-b.z)/lc*r};
    for(let k=0;k<=8;k++){const t=k/8,u=1-t;out.push({x:u*u*p1.x+2*u*t*b.x+t*t*p2.x,z:u*u*p1.z+2*u*t*b.z+t*t*p2.z,turn:k>0&&k<8});}}
  out.push(pts[pts.length-1]);
  const L=[0];for(let i=1;i<out.length;i++)L.push(L[i-1]+Math.hypot(out[i].x-out[i-1].x,out[i].z-out[i-1].z));
  const n=L.length;
  return {len:L[n-1],i:1,
    at(s,pos,dir){let i;if(s<=0)i=1;else if(s>=this.len)i=n-1;else{i=this.i;while(i<n-1&&L[i]<s)i++;while(i>1&&L[i-1]>s)i--;this.i=i;}
      const a=out[i-1],b=out[i],d=L[i]-L[i-1]||1,t=(s-L[i-1])/d;pos.x=a.x+(b.x-a.x)*t;pos.z=a.z+(b.z-a.z)*t;dir.x=(b.x-a.x)/d;dir.z=(b.z-a.z)/d;return !!(b.turn||a.turn);}};
}
const trucks=[];
/* vehicles: crisp edge outlines on the main forms, fine details left unlined */
const PO={polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1.5};
const VM=(hex,o)=>M_(hex,Object.assign({},o||{},PO));
const edgeMat=new T.LineBasicMaterial({color:col(0x0d0b0f),transparent:true,opacity:.62});
function finish(B,D){const g=B.build(),parts=[];let n=0;
  for(const m of g.children){const e=new T.EdgesGeometry(m.geometry,30),a=e.attributes.position.array;parts.push(a);n+=a.length;}
  const p=new Float32Array(n);let o=0;for(const a of parts){p.set(a,o);o+=a.length;}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(p,3));const l=new T.LineSegments(geo,edgeMat);l.raycast=()=>{};
  if(D){const d=D.build();while(d.children.length)g.add(d.children[0]);}
  g.add(l);return g;}
function wheel(B,D,x,z,dual,r=.52,w0){const w=w0||(dual?.62:.32);B.cyl(VM(0x131114,{roughness:.95}),r,w,x,r,z,Math.PI/2,0,0,28);D.cyl(VM(0xc8c8c4,{roughness:.22,metalness:.8,env:.8}),r*.6,w+.02,x,r,z,Math.PI/2,0,0,20);D.cyl(VM(0x2a282c,{roughness:.6}),r*.24,w+.06,x,r,z,Math.PI/2,0,0,10);}
function tractorModel(sub,hex,opt){
  opt=opt||{};
  const B=new Builder(),D=new Builder(),dark=VM(0x1b191c,{roughness:.8}),blackp=VM(0x0f0e10,{roughness:.5}),steel=VM(0x4a4a51,{roughness:.5,metalness:.35}),body=VM(hex,{roughness:.3,metalness:.2,env:.8}),glass=VM(0x0a1014,{roughness:.08,metalness:.55,env:.4}),chrome=VM(0xd0d0cb,{roughness:.18,metalness:.9,env:1}),
    lamp=VM(0xfff3d6,{emissive:0xffd9a0,emissiveIntensity:1.4}),red=VM(0xc0221a,{emissive:0x8a120c,emissiveIntensity:.9}),amber=VM(0xffb030,{emissive:0xff8a14,emissiveIntensity:1.2}),stripe=VM(opt.stripe||0x1a5f6f,{roughness:.4}),white=VM(0xf4f2ed,{roughness:.4}),yel=VM(0xf2c21a,{roughness:.5});
  if(sub==='ext'){const wb=3.9;
    for(const s of [-1,1])B.box(steel,6.9,.26,.14,1.75,.95,s*.42);for(const x of [-1.2,.6,2.4])D.box(steel,.12,.2,.9,x,.92,0);
    for(const x of [-.66,.66])for(const s of [-1,1])wheel(B,D,x,s*.92,true);
    for(const s of [-1,1]){B.box(dark,2.9,.06,.7,0,1.15,s*.92);D.box(dark,.05,.36,.7,-1.45,.98,s*.92);D.box(dark,.05,.36,.7,1.45,.98,s*.92);D.box(dark,.04,.46,.62,-1.5,.5,s*.92);}
    B.cyl(steel,.52,.1,0,1.15,0,0,0,0,16);D.box(steel,1.1,.08,.9,-.2,1.07,0);
    for(const s of [-1,1])wheel(B,D,wb,s*1.03,false);
    B.box(body,2.3,1.5,2.46,wb+.2,1.72,0);B.box(body,2.1,1.25,2.46,wb+.1,3.08,0);B.box(body,.36,1.3,2.46,wb+1.18,3.02,0,0,0,.2);
    B.box(blackp,.05,1.12,2.26,wb+1.352,3.07,0,0,0,.2);B.box(glass,.08,1,2.14,wb+1.376,3.08,0,0,0,.2);for(const z of [-.5,.5])D.box(blackp,.03,.05,.8,wb+1.33,2.62,z,.5,0,0);
    for(const s of [-1,1]){B.box(glass,1.15,.78,.05,wb+.42,3.12,s*1.235);B.box(body,1.3,1.46,.03,wb+.32,1.76,s*1.243);D.box(stripe,2.3,.24,.03,wb+.2,2.28,s*1.262);D.box(blackp,.2,.05,.04,wb-.14,2.02,s*1.268);
      B.box(dark,.1,.5,.18,wb+1.1,2.9,s*1.46);D.box(dark,.36,.05,.05,wb+1.1,3.1,s*1.34);D.box(dark,.7,.05,.3,wb+.3,.7,s*1.1);D.box(dark,.7,.05,.3,wb+.3,1,s*1.12);}
    D.box(stripe,.03,.24,2.46,wb+1.364,2.28,0);
    B.box(body,1.7,.62,2.3,wb-.2,3.98,0,0,0,.2);B.box(body,2.1,.1,2.46,wb+.1,3.75,0);D.box(blackp,.34,.1,2.36,wb+1.28,3.68,0);
    for(const z of [-.8,-.4,0,.4,.8])D.box(amber,.08,.06,.1,wb+.95,3.83,z);
    B.box(dark,.34,.5,2.5,wb+1.34,.78,0);B.box(blackp,.08,.8,1.6,wb+1.37,1.55,0);for(let y=1.25;y<1.9;y+=.16)D.box(chrome,.09,.05,1.5,wb+1.38,y,0);
    for(const s of [-1,1]){D.box(chrome,.07,.3,.54,wb+1.5,.84,s*.9);D.box(lamp,.08,.2,.42,wb+1.52,.84,s*.9);D.box(amber,.08,.12,.2,wb+1.5,1.16,s*1.1);}
    D.box(white,.03,.15,.5,wb+1.53,.6,0);
    for(const s of [-1,1]){B.cyl(chrome,.31,1.25,1.75,.72,s*.98,0,0,Math.PI/2,16);D.box(dark,.08,.66,.08,1.3,.72,s*.98);D.box(dark,.08,.66,.08,2.2,.72,s*.98);}
    B.cyl(chrome,.08,2.7,wb-1.05,2.6,1.02,0,0,0,10);B.box(dark,.1,2.6,2.3,wb-1,2.3,0);
    for(const s of [-1,1])D.box(red,.06,.14,.3,-1.72,.95,s*.5);
  }else{const wb=3.0;
    for(const s of [-1,1])B.box(steel,5.4,.3,.16,1.35,.9,s*.44);
    for(const s of [-1,1])wheel(B,D,-.05,s*.94,true,.56);for(const s of [-1,1])wheel(B,D,wb,s*1.02,false,.56);
    for(const s of [-1,1]){B.box(dark,1.5,.06,.7,-.05,1.23,s*.94);D.box(dark,.04,.5,.62,-.85,.55,s*.94);}
    B.cyl(steel,.54,.12,.1,1.3,0,0,0,0,16);B.box(steel,2,.3,.6,.9,1.05,0,0,0,-.1);D.cyl(chrome,.07,.9,1.55,.95,.3,0,0,.6,8);
    B.box(body,2.7,.8,2.36,wb+.05,1.3,0);B.box(dark,2.72,.14,2.4,wb+.05,.93,0);
    for(const s of [-1,1])D.box(stripe,2.7,.14,.03,wb+.05,1.6,s*1.19);
    B.box(body,1.6,1.75,1.3,wb+.35,2.57,-.52);B.box(body,1.72,.1,1.42,wb+.35,3.48,-.52);
    B.box(glass,.06,1.05,1.1,wb+1.16,2.72,-.52);B.box(glass,.06,1.05,1.1,wb-.46,2.72,-.52);B.box(glass,1.2,1.05,.05,wb+.35,2.72,-1.18);B.box(glass,1.2,1.05,.05,wb+.35,2.72,.14);
    D.cyl(amber,.1,.2,wb+.95,3.63,-.52,0,0,0,10);for(const z of [-.95,-.1])D.box(lamp,.1,.12,.2,wb+1.18,3.42,z);
    B.box(VM(0x2a5f6d,{roughness:.5}),1.3,.72,1.0,wb+.4,2.06,.58);B.cyl(chrome,.07,1.5,wb-.5,2.4,.95,0,0,0,10);
    for(const [x,z] of [[wb-1.2,-1.1],[wb-1.2,1.1],[wb-.5,1.1]])D.box(yel,.05,.95,.05,x,2.17,z);D.box(yel,.05,.05,2.2,wb-1.2,2.64,0);D.box(yel,.7,.05,.05,wb-.85,2.64,1.1);
    D.box(dark,.5,.05,.3,wb+.35,.82,-1.32);D.box(dark,.5,.05,.3,wb+.35,1.14,-1.3);
    B.box(dark,.26,.44,2.4,wb+1.5,.72,0);for(let k=-3;k<=3;k++)D.box(k%2?yel:blackp,.04,.3,.32,wb+1.64,.74,k*.33);
    for(const s of [-1,1]){D.box(lamp,.06,.18,.36,wb+1.42,1.38,s*.9);D.box(red,.06,.14,.26,-.98,.95,s*.5);D.box(dark,.1,.4,.16,wb+1.2,2.9,-.52+s*.82);}
  }
  const g=finish(B,D);
  if(opt.num){const p=plate(opt.num,1.15,.66,'#17151a');Object.assign(p.material,{polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    p.rotation.set(-Math.PI/2,0,-Math.PI/2);p.position.set(3.3,3.54,-.52);g.add(p);
    for(const s of [-1,1]){const q=p.clone();q.rotation.set(0,s<0?Math.PI:0,0);q.scale.setScalar(.6);q.position.set(3.05,1.26,s*1.19);g.add(q);}}
  return g;
}
function trailerModel(){
  const B=new Builder(),D=new Builder(),dark=VM(0x1b191c,{roughness:.8}),steel=VM(0x40566c,{roughness:.45,metalness:.3}),red=VM(0xc0221a,{emissive:0x8a120c,emissiveIntensity:.9}),tape=VM(0xc7281f,{roughness:.5}),white=VM(0xf4f2ed,{roughness:.5}),yel=VM(0xf2c21a,{roughness:.5});
  for(const s of [-1,1]){B.box(steel,12.5,.36,.18,0,BED-.2,s*.52);D.box(steel,12.5,.06,.34,0,BED-.03,s*.52);}
  for(let x=-6;x<=6.01;x+=1.5)D.box(steel,.12,.16,1.2,x,BED-.2,0);
  for(const x of [-6.05,6.05]){B.box(steel,.36,.22,CW+.04,x,BED-.11,0);for(const s of [-1,1])D.box(yel,.3,.1,.26,x,BED+.03,s*1.08);}
  for(const x of [-3.55,-4.9])for(const s of [-1,1])wheel(B,D,x,s*.92,true);
  for(const s of [-1,1]){B.box(dark,3.2,.06,.7,-4.22,1.15,s*.92);D.box(dark,.05,.4,.7,-5.85,.96,s*.92);D.box(dark,.04,.5,.62,-5.95,.5,s*.92);}
  D.box(steel,2,.3,.9,-4.22,.8,0);
  for(const s of [-1,1]){B.box(steel,.14,.84,.14,2.5,.7,s*.62);D.box(steel,.36,.05,.36,2.5,.27,s*.62);}D.box(steel,.1,.1,1.3,2.5,.9,0);
  B.box(dark,.14,.22,2.44,-6.22,.62,0);D.box(steel,.1,.4,.1,-6.2,.86,.7);D.box(steel,.1,.4,.1,-6.2,.86,-.7);
  for(const s of [-1,1])D.box(red,.06,.18,.44,-6.3,.62,s*.9);D.box(white,.04,.2,.52,-6.3,.62,0);
  for(let i=0;i<24;i++)for(const s of [-1,1])D.box(i%2?white:tape,.5,.08,.02,-5.75+i*.5,BED-.2,s*.62);
  D.cyl(steel,.07,.3,5,BED-.42,0,0,0,0,8);
  return finish(B,D);
}
const _A={x:0,z:0},_K={x:0,z:0},_F={x:0,z:0},_D={x:0,z:0},_T1={x:0,z:0},_T2={x:0,z:0};
const TRO=[-6.2,-4,-1.8,.4,2.6,4.6];
class Truck{
  constructor(sub,id,hex,opt){this.kind='truck';this.sub=sub;this.id=id;this.wb=sub==='tt'?3.0:3.9;this.nose=5+this.wb+1.5;this.tail=6.4;this.cabO=[1.2,3,this.wb+1.3];
    this.group=new T.Group();this.tractor=tractorModel(sub,hex,opt);this.trailer=trailerModel();this.group.add(this.tractor,this.trailer);this.group.userData.ent=this;scene.add(this.group);
    this.pos={x:0,z:0};this.dir={x:1,z:0};this.tp={x:0,z:0};this.ta=0;this.kx=0;this.kz=0;this.ka=0;this.body=[];for(let i=0;i<9;i++)this.body.push({x:0,z:9999});this.zones=[];this.groups=[];this.gi=0;this.waitT=0;
    this.v=0;this.vmax=sub==='tt'?9:8.2;this.acc=3;this.dec=5;this.cargo=null;this.status='Standby';this.dest='—';this.trips=0;this.active=true;this.pop=1;trucks.push(this);ents.push(this);this.place(0,400,1);}
  place(x,z,dx){this.path=makePath([{x:x-dx*40,z},{x,z}]);this.s=40;this.pos.x=x;this.pos.z=z;this.dir.x=dx;this.dir.z=0;this.updatePose();}
  get label(){return this.id;}
  center(v){return v.set(this.tp.x+Math.cos(this.ta)*3,this.cargo?5.4:4.9,this.tp.z-Math.sin(this.ta)*3);}
  frame(){return {x:this.tp.x+Math.cos(this.ta)*2.6,y:2.3,z:this.tp.z-Math.sin(this.ta)*2.6,rot:this.ta,d:[19.6,4.8,3.5]};}
  // articulated pose from the path: trailer tail, kingpin and front axle each ride the path (no tail swing into the next lane)
  updatePose(){const p=this.path,s=this.s;p.at(s-6.2,_A,_D);p.at(s+5,_K,_D);p.at(s+5+this.wb,_F,_D);
    let dx=_K.x-_A.x,dz=_K.z-_A.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;this.tp.x=_K.x-dx*5;this.tp.z=_K.z-dz*5;this.ta=Math.atan2(-dz,dx);
    let cx=_F.x-_K.x,cz=_F.z-_K.z;const m=Math.hypot(cx,cz)||1;cx/=m;cz/=m;this.kx=_K.x;this.kz=_K.z;this.ka=Math.atan2(-cz,cx);
    const b=this.body;let i=0;for(const o of TRO){b[i].x=this.tp.x+dx*o;b[i].z=this.tp.z+dz*o;i++;}for(const o of this.cabO){b[i].x=_K.x+cx*o;b[i].z=_K.z+cz*o;i++;}}
  sync(){this.group.visible=this.active;const k=this.pop;
    this.trailer.position.set(this.tp.x,0,this.tp.z);this.trailer.rotation.y=this.ta;this.trailer.scale.setScalar(k);
    this.tractor.position.set(this.kx,0,this.kz);this.tractor.rotation.y=this.ka;this.tractor.scale.setScalar(k);
    if(this.cargo)this.cargo.set(this.tp.x,BED,this.tp.z,this.ta);}
}
/* ---------- traffic control ----------
   Vehicles never overlap. Two mechanisms:
   1. Look-ahead: each vehicle sweeps its own path ahead of its nose and brakes for any other vehicle body (or a person crossing) in the way.
   2. Junction reservations: before its nose enters a junction box a vehicle reserves the exact piece of path it will drive there. Crossing or
      merging paths cannot be reserved at the same time; vehicles arriving on the same lane simply follow each other. Junctions closer together
      than a truck length are reserved as one group, and a group is only granted when there is room to clear it on the far side. */
const ZX=9.8,ZZ=10,CLEAR=2.7,GAPV=1.2,DCONF=3.0,PEDR=1.9;
const JUNC=[];for(const v of VXS)for(const h of HZ)JUNC.push({x:v,z:h,res:[]});
const peds=[];
function dropRes(tr){for(const J of JUNC)for(let i=J.res.length-1;i>=0;i--)if(J.res[i].veh===tr)J.res.splice(i,1);}
function planZones(tr,path){dropRes(tr);const zs=[];
  const add=(J,a,b)=>{const pts=[];for(let s=a;s<=b+.01;s+=1.5){path.at(s,_T1,_T2);pts.push({x:_T1.x,z:_T1.z});}zs.push({J,sIn:a,sOut:b,pts,held:false,done:false});};
  for(const J of JUNC){let a=null,b=null;   // a route can pass the same junction twice (a lap), so collect every separate pass
    for(let s=-tr.tail;s<=path.len+tr.nose;s+=.75){path.at(s,_T1,_T2);if(Math.abs(_T1.x-J.x)<=ZX&&Math.abs(_T1.z-J.z)<=ZZ){if(a===null)a=s;b=s;}else if(a!==null){add(J,a,b);a=null;}}
    if(a!==null)add(J,a,b);}
  zs.sort((p,q)=>p.sIn-q.sIn);
  const L=tr.nose+tr.tail,groups=[];
  for(const z of zs){if(z.sIn<=tr.nose+.5){z.held=true;z.J.res.push({veh:tr,pts:z.pts});continue;}   // already standing in it
    const g=groups[groups.length-1];if(g&&z.sIn-g.sOut<L+2){g.zs.push(z);g.sOut=Math.max(g.sOut,z.sOut);}else groups.push({zs:[z],sIn:z.sIn,sOut:z.sOut});}
  tr.zones=zs;tr.groups=groups;tr.gi=0;}
function conflict(a,b){if(Math.hypot(a[0].x-b[0].x,a[0].z-b[0].z)<1.2)return false;for(const p of a)for(const q of b){const dx=p.x-q.x,dz=p.z-q.z;if(dx*dx+dz*dz<DCONF*DCONF)return true;}return false;}
function bodyNear(tr,px,pz){for(const o of trucks){if(o===tr||!o.active)continue;const ex=o.pos.x-px,ez=o.pos.z-pz;if(ex*ex+ez*ez>400)continue;for(const q of o.body){const qx=q.x-px,qz=q.z-pz;if(qx*qx+qz*qz<CLEAR*CLEAR)return true;}}return false;}
function acquire(tr,path,g,goal,force){
  for(const z of g.zs)for(const r of z.J.res)if(r.veh!==tr&&conflict(z.pts,r.pts))return false;
  if(!force){const b=Math.min(g.sOut+tr.nose+tr.tail+GAPV,goal+tr.nose);for(let s=g.sOut;s<=b;s+=1.5){path.at(s,_T1,_T2);if(bodyNear(tr,_T1.x,_T1.z))return false;}}
  for(const z of g.zs){z.held=true;z.J.res.push({veh:tr,pts:z.pts});}return true;}
function freeAhead(tr,path,s,look){const s0=s+tr.nose;
  for(let d=0;d<=look;d+=1.5){path.at(s0+d,_T1,_T2);const px=_T1.x,pz=_T1.z;if(bodyNear(tr,px,pz))return d;
    for(const p of peds)if(p.cross){const qx=p.x-px,qz=p.z-pz;if(qx*qx+qz*qz<PEDR*PEDR)return d;}}
  return 1e9;}
const P=t=>({x:t.pos.x,z:snapZ(t.pos.z)});
function* drive(tr,pts,opt){
  const path=makePath(pts),last=pts[pts.length-1],prev=pts[pts.length-2],dirx=Math.sign(last.x-prev.x);let s=0;
  tr.path=path;tr.s=0;path.at(0,tr.pos,tr.dir);planZones(tr,path);tr.waitT=0;
  for(;;){
    const dt=(yield)||0;let goal=path.len;
    if(opt&&opt.stopX){goal=path.len-(last.x-opt.stopX())*dirx;if(goal<s-1.2)return 'missed';if(goal<s)goal=s;}
    if(opt&&opt.abort&&tr.v<.05&&tr.dir.z===0&&HDIR[tr.pos.z]!==undefined&&opt.abort()){tr.v=0;return 'abort';}
    for(const z of tr.zones)if(z.held&&!z.done&&s-tr.tail>z.sOut+.4){z.done=true;const i=z.J.res.findIndex(r=>r.veh===tr&&r.pts===z.pts);if(i>=0)z.J.res.splice(i,1);}
    let lim=goal;const bd=tr.v*tr.v/(2*tr.dec*.8),g=tr.groups[tr.gi];
    if(g&&s+tr.nose+bd+8>=g.sIn&&goal+tr.nose>g.sIn){
      if(acquire(tr,path,g,goal,tr.waitT>45)){tr.gi++;tr.waitT=0;}
      else{lim=Math.min(goal,Math.max(s,g.sIn-tr.nose-.8));if(tr.v<.2)tr.waitT+=dt;}}
    const turn=path.at(s+11,_T1,_T2)||path.at(s-6.2,_T1,_T2),free=freeAhead(tr,path,s,bd+9);
    const vt=Math.min(turn?4.4:tr.vmax,Math.sqrt(2*tr.dec*.8*Math.max(0,lim-s-.03)),free>1e8?99:Math.sqrt(2*tr.dec*.8*Math.max(0,free-GAPV)));
    tr.v=tr.v<vt?Math.min(vt,tr.v+tr.acc*dt):Math.max(vt,tr.v-tr.dec*1.5*dt);
    s=Math.min(lim,s+tr.v*dt);tr.s=s;path.at(s,tr.pos,tr.dir);
    if(goal-s<.06&&tr.v<.4){tr.v=0;tr.s=goal;path.at(goal,tr.pos,tr.dir);return 'ok';}
  }
}
function* toQuay(tr,b,cr){
  const exit={x:b.exitX-8,z:LQ},stopX=()=>cr.stopX;
  if(tr.pos.z===LQ&&tr.pos.x>cr.stopX+.6){tr.status='Repositioning';tr.dest='Lane 1';yield* drive(tr,route(P(tr),{x:b.lapX,z:32}));}
  tr.status='To quay';tr.dest=cr.id;
  if((yield* drive(tr,route(P(tr),exit),{stopX}))!=='ok')return;
  cr.atStop=tr;tr.status='Under '+cr.id;
  const dis=b.vessel&&b.vessel.mode==='discharge';
  for(;;){
    const v=b.vessel;
    if(dis?tr.cargo:!tr.cargo)break;
    if(!cr.engaged){
      if(!v||v.phase!=='work')break;
      if(dis&&v.jobsLeft<=0&&!cr.cargo&&cr.idle)break;
      if(!dis&&cr.exhausted)break;
      if(Math.abs(cr.stopX-tr.pos.x)>.4){if(cr.stopX<tr.pos.x)break;cr.atStop=null;if((yield* drive(tr,[P(tr),exit],{stopX}))!=='ok')break;cr.atStop=tr;}
    }
    yield;
  }
  if(cr.atStop===tr)cr.atStop=null;
}
function* toYard(tr,st,type,box){
  tr.status=type==='store'?'To yard':'To yard (empty)';tr.dest='Block '+slotName(st);
  yield* drive(tr,route(P(tr),{x:st.x,z:st.blk.lane}));
  const q={truck:tr,stack:st,type,box:box||null,free:false};st.blk.rtg.queue.push(q);tr.status='At '+st.blk.rtg.id;yield* until(()=>q.free);
}
function* ttLoop(tr,b,k){
  // nothing left to fetch or carry for this call (or no vessel): get off the working lane
  const idle=()=>{const v=b.vessel;if(!v||v.phase!=='work')return true;return v.mode==='load'?v.toDispatch<=0:(v.jobsLeft<=0&&b.cranes.every(c=>!c.cargo));};
  const slot=()=>{const on=Math.abs(tr.pos.z-LS)<.01;let n=0;for(const o of trucks)if(o!==tr&&o.berth===b&&Math.abs(o.pos.z-LS)<.01&&(!on||o.pos.x>tr.pos.x))n++;return b.exitX-20-20.5*n;};
  for(;;){
    const v=b.vessel,working=v&&v.phase==='work';
    if(tr.cargo&&!(working&&v.mode==='load')){let st;while(!(st=yard.reserveIn(b.half)))yield* sleep(1);yield* toYard(tr,st,'store');continue;}
    if(!tr.cargo&&idle()){tr.status='Standby';tr.dest='Standby lane';
      yield* drive(tr,route(P(tr),{x:b.exitX-12,z:LS}),{stopX:slot,abort:()=>!idle()});
      yield* until(()=>!idle());continue;}
    if(v.mode==='discharge'){
      const cr=b.pickCrane();cr.assigned++;yield* toQuay(tr,b,cr);cr.assigned--;
      if(tr.cargo){tr.trips++;let st;while(!(st=yard.reserveIn(b.half)))yield* sleep(1);yield* toYard(tr,st,'store');}else yield;
    }else{
      if(!tr.cargo){
        const st=yard.reserveOut(b.half,'Export');if(!st){yield* sleep(1);continue;}
        v.toDispatch--;yield* toYard(tr,st,'retrieve');
      }
      const cr=b.pickCrane();cr.assigned++;yield* toQuay(tr,b,cr);cr.assigned--;tr.trips++;yield;
    }
  }
}
/* gate appointments */
const HAUL=['Sếu Trắng Haulage','Gió Nam Trucking','Bến Mới Cartage','Vàm Xanh Transport','Đất Mũi Logistics'],EXTC=[0xf4f2ed,0x2a5a8a,0xb23a24,0xd3d6d4];
const appts=[];let apN=10431,slotT=-60,spawnAt=0;
function mkAppt(user,box){const a={id:'GA-'+(apN++),haul:pick(HAUL),plate:`${ri(50,63)}C-${ri(100,999)}.${ri(10,99)}`,truckId:'EXT-'+ri(1000,9999),type:box?'Import pick-up':rnd()<.5?'Export drop-off':'Import pick-up',box:box||null,status:'Booked',user:!!user,t:user?simT:(slotT+=55),tIn:null,turn:null,truck:null};
  if(slotT<simT-30)slotT=simT;appts.push(a);return a;}
function fillAppts(){while(appts.filter(a=>a.status==='Booked'&&!a.user).length<4)mkAppt(false,null);
  let done=appts.filter(a=>a.status==='Completed'||a.status==='Cancelled');while(done.length>8){appts.splice(appts.indexOf(done.shift()),1);}}
function* extLoop(tr,delay){
  tr.active=false;yield* sleep(delay);
  for(;;){
    fillAppts();
    const a=appts.find(x=>x.status==='Booked'&&x.user)||appts.find(x=>x.status==='Booked');
    if(!a){yield* sleep(2);continue;}
    const deliver=a.type==='Export drop-off';let st;
    if(a.user){if(!a.box||a.box.dead||a.box.where!=='yard'){a.status='Cancelled';yield;continue;}st=a.box.ref;}
    else{const half=rnd()<.5?-1:1;st=deliver?(yard.reserveIn(half)||yard.reserveIn(-half)):(yard.reserveOut(half,'Import')||yard.reserveOut(-half,'Import'));
      if(!st){yield* sleep(3);continue;}
      if(!deliver){a.box=topOf(st);a.box.appt=a;}}
    a.status='At gate';a.truck=tr;tr.appt=a;tr.id=a.truckId;tr.haul=a.haul;tr.plate=a.plate;tr.job=a.type;tr.cargo=null;
    if(deliver){const bx=new Box();bx.dir='Export';bx.where='truck';bx.ref=tr;tr.cargo=bx;a.box=bx;}
    yield* until(()=>simT>spawnAt&&!trucks.some(o=>o.active&&o.body.some(q=>Math.abs(q.x-OFF)<2.6&&q.z>186)));spawnAt=simT+4;
    tr.v=0;tr.place(0,400,1);tr.active=true;tr.pop=0;stats.gateIn++;
    tr.status='Arriving at gate';tr.dest='Gate in';yield* drive(tr,[{x:OFF,z:215},{x:OFF,z:GATE_Z+11}]);
    tr.status='Gate check';a.tIn=simT;yield* sleep(2.6);a.status='In terminal';ev('gate',`${tr.id} gated in · ${a.type.toLowerCase()}`,tr);
    tr.status=deliver?'Delivering export':'Collecting import';tr.dest='Block '+slotName(st);
    const B={x:st.x,z:st.blk.lane},vi=upV(B.x,-1),G={x:OFF,z:GATE_Z+11};
    yield* drive(tr,vi===0?[G,{x:OFF,z:B.z},B]:[G,{x:OFF,z:108},{x:vx(vi,108,B.z),z:108},{x:vx(vi,108,B.z),z:B.z},B]);
    const q={truck:tr,stack:st,type:deliver?'store':'retrieve',box:deliver?null:a.box,free:false};st.blk.rtg.queue.push(q);tr.status='At '+st.blk.rtg.id;yield* until(()=>q.free);
    if(deliver)a.box.appt=null;
    tr.status='To gate';tr.dest='Gate out';const A=P(tr),vo=nextV(A.x,-1),E={x:-OFF,z:GATE_Z-6};
    yield* drive(tr,vo===0?[A,{x:-OFF,z:A.z},E]:[A,{x:vo-OFF,z:A.z},{x:vo-OFF,z:108},{x:-OFF,z:108},E]);
    tr.status='Gate out';yield* sleep(1.6);tr.trips++;a.turn=(simT-a.tIn)*6/60;stats.turn.push(a.turn);if(stats.turn.length>6)stats.turn.shift();
    a.status='Completed';stats.gateDone++;ev('gate',`${tr.id} gated out · turn ${a.turn.toFixed(1)} min`,null);
    tr.status='Leaving';yield* drive(tr,[E,{x:-OFF,z:215}]);
    if(tr.cargo){tr.cargo.free();tr.cargo=null;}
    tr.active=false;if(sel===tr)select(null);stats.gateIn--;yield* sleep(rr(3,12));
  }
}

/* ---------- build the fleet ---------- */
berths.forEach((b,bi)=>{[[0,1],[4,5]].forEach((rg,i)=>{const c=makeSTS('QC-0'+(bi*2+i+1),b,b.cx-32+rg[0]*BAYP,rg);b.cranes.push(c);cos.push(stsLoop(c));});});
blocks.forEach(b=>cos.push(rtgLoop(b.rtg)));
cos.push(berthLife(berths[0],'discharge',9),berthLife(berths[1],'load',12));
berths.forEach((b,bi)=>{for(let k=0;k<5;k++){const t=new Truck('tt','TT-'+pad2(bi*5+k+1),0xf4f2ed,{num:pad2(bi*5+k+1)});t.berth=b;t.place(b.half*56+(k<3?24:-22),LANES[k%3],-1);cos.push(ttLoop(t,b,k));}});
for(let k=0;k<4;k++){const t=new Truck('ext','EXT-0000',EXTC[k],{stripe:[0xc8481b,0xd9a521,0xf1efe9,0x1a5f6f][k]});cos.push(extLoop(t,k*9));}
/* cars: body cut from a side profile with wheel arches, glasshouse with pillars, outlined like the trucks */
const CARS={pickup:{L:2.66,W:1.86,belt:1.02,roof:1.76,hood:[1.2,2.44],cab:[-.52,-.4,.6,1.24],wb:1.62,pill:[.1],bed:1},
  suv:{L:2.32,W:1.84,belt:.98,roof:1.68,hood:[1.0,2.12],cab:[-2.3,-1.96,.28,1.02],wb:1.38,pill:[-.36,-1.32]},
  sedan:{L:2.36,W:1.8,belt:.9,roof:1.42,hood:[.92,2.18],cab:[-1.62,-1.02,.22,.98],wb:1.4,pill:[-.38]}};
function carModel(kind,hex,svc){
  const c=CARS[kind],{L,W,belt,roof,wb}=c,[c0,c1,c2,c3]=c.cab,B=new Builder(),D=new Builder(),hz=W/2,
    paint=VM(hex,{roughness:.28,metalness:.25,env:.85}),glass=VM(0x0a1014,{roughness:.08,metalness:.55,env:.4}),trim=VM(0x1c1b1e,{roughness:.55}),chrome=VM(0xd2d2ce,{roughness:.16,metalness:.9,env:1}),
    lamp=VM(0xfff3d6,{emissive:0xffd9a0,emissiveIntensity:1.4}),red=VM(0xc0221a,{emissive:0x8a120c,emissiveIntensity:.9}),amber=VM(0xffb030,{emissive:0xff8a14,emissiveIntensity:1.2}),white=VM(0xf4f2ed,{roughness:.4});
  const sh=new T.Shape();sh.moveTo(-L,.4);sh.lineTo(-L,belt-.1);sh.quadraticCurveTo(-L,belt,-L+.12,belt);sh.lineTo(c.hood[0],belt);sh.lineTo(c.hood[1],belt-.1);sh.quadraticCurveTo(L,belt-.14,L,belt-.38);sh.lineTo(L,.5);sh.quadraticCurveTo(L,.4,L-.1,.4);
  sh.lineTo(wb+.5,.4);sh.absarc(wb,.39,.5,0,Math.PI,false);sh.lineTo(-wb+.5,.4);sh.absarc(-wb,.39,.5,0,Math.PI,false);sh.lineTo(-L,.4);
  B.add(paint,new T.ExtrudeGeometry(sh,{depth:W,bevelEnabled:false,curveSegments:12}),0,0,-hz);
  const gs=new T.Shape();gs.moveTo(c0,belt-.01);gs.lineTo(c1,roof-.02);gs.lineTo(c2,roof-.02);gs.lineTo(c3,belt-.01);gs.closePath();
  B.add(glass,new T.ExtrudeGeometry(gs,{depth:W-.18,bevelEnabled:false}),0,0,-(W-.18)/2);
  const rs=new T.Shape();rs.moveTo(c1-.1,roof-.03);rs.lineTo(c1-.02,roof+.05);rs.lineTo(c2+.02,roof+.05);rs.lineTo(c2+.12,roof-.03);rs.closePath();
  B.add(paint,new T.ExtrudeGeometry(rs,{depth:W-.12,bevelEnabled:false}),0,0,-(W-.12)/2);
  for(const s of [-1,1]){const z=s*(hz-.065);
    D.beam(paint,.1,V(c3+.02,belt,z),V(c2+.06,roof,z));D.beam(paint,.14,V(c0-.03,belt,z),V(c1-.05,roof,z));
    for(const x of c.pill)D.box(paint,.12,roof-belt,.06,x,(roof+belt)/2,z);D.box(paint,c3-c0+.06,.06,.06,(c0+c3)/2,belt+.01,z);
    D.box(paint,.2,.12,.17,c3-.14,belt+.13,s*(hz+.1));D.box(glass,.02,.1,.14,c3-.245,belt+.13,s*(hz+.1));D.box(trim,.06,.05,.1,c3-.1,belt+.06,s*(hz+.02));
    for(const x of [c3-.2,...c.pill.map(p=>p-.02)])D.box(trim,.018,belt-.52,.012,x,belt/2+.24,s*(hz+.004));
    for(const x of [c3-.6,...c.pill.map(p=>p-.42)])D.box(chrome,.15,.035,.03,x,belt-.13,s*(hz+.012));
    D.box(trim,2*wb-1.04,.1,.012,0,.45,s*(hz+.004));
    D.box(lamp,.14,.15,.42,L-.06,belt-.31,s*(hz-.25));D.box(chrome,.16,.19,.46,L-.075,belt-.31,s*(hz-.25));D.box(amber,.06,.08,.1,L-.2,belt-.3,s*(hz+.005));
    D.box(red,.1,.24,.22,-L+.04,belt-.25,s*(hz-.13));D.box(lamp,.04,.07,.16,L+.03,.54,s*(hz-.36));
    if(svc){D.box(VM(0xf2c21a,{roughness:.4}),2*L-.6,.15,.012,0,belt-.3,s*(hz+.006));D.box(VM(0xe2641c,{roughness:.4}),2*L-.6,.05,.012,0,belt-.43,s*(hz+.006));}}
  D.box(trim,.05,.24,W-.9,L+.012,belt-.35,0);for(let y=belt-.43;y<belt-.25;y+=.06)D.box(chrome,.06,.018,W-1.0,L+.022,y,0);D.box(chrome,.05,.07,.2,L+.03,belt-.21,0);
  B.box(trim,.2,.2,W+.02,L-.05,.5,0);B.box(trim,.2,.2,W+.02,-L+.05,.52,0);D.box(white,.02,.13,.46,L+.06,.5,0);D.box(white,.02,.13,.46,-L-.06,.56,0);
  D.box(trim,.26,.03,W-.4,c3+.1,belt+.012,0);D.box(trim,.02,.02,W-.6,(c.hood[0]+c.hood[1])/2,belt-.04,0);
  if(c.bed){B.box(VM(0x161518,{roughness:.6}),c0+L-.2,.05,W-.24,(c0-L)/2-.03,belt+.03,0);D.box(chrome,.05,.42,W-.4,c0-.1,belt+.26,0);D.box(chrome,.05,.05,W-.4,c0-.1,belt+.48,0);D.box(trim,.02,belt-.6,.012,-L+.5,belt/2+.26,hz+.004);D.box(trim,.02,belt-.6,.012,-L+.5,belt/2+.26,-hz-.004);}
  else D.box(glass,.02,.3,W-.5,(c0+c1)/2-.05,(belt+roof)/2,0);
  if(svc){D.box(trim,.3,.05,1.24,(c1+c2)/2,roof+.08,0);B.box(amber,.24,.11,1.12,(c1+c2)/2,roof+.16,0);D.cyl(chrome,.012,1.4,c1+.12,roof+.75,hz-.3,0,0,-.1,6);}
  for(const sx of [-1,1])for(const s of [-1,1])wheel(B,D,sx*wb,s*(hz-.14),false,.37,.26);
  return finish(B,D);
}
class Car{
  constructor(id,model){this.kind='truck';this.sub='car';this.id=id;this.group=model;this.group.userData.ent=this;scene.add(this.group);this.pos={x:0,z:0};this.dir={x:1,z:0};this.ta=0;this.cx=0;this.cz=0;this.nose=2.9;this.tail=2.9;
    this.body=[];for(let i=0;i<4;i++)this.body.push({x:0,z:9999});this.zones=[];this.groups=[];this.gi=0;this.waitT=0;this.v=0;this.vmax=8.5;this.acc=3.4;this.dec=6;this.cargo=null;this.status='Yard patrol';this.dest='—';this.trips=0;this.active=true;this.pop=1;trucks.push(this);ents.push(this);}
  place(x,z,dx){this.path=makePath([{x:x-dx*40,z},{x,z}]);this.s=40;this.pos.x=x;this.pos.z=z;this.dir.x=dx;this.dir.z=0;this.updatePose();}
  get label(){return this.id;}
  center(v){return v.set(this.cx,2.7,this.cz);}
  frame(){return {x:this.cx,y:1.05,z:this.cz,rot:this.ta,d:[6,2.3,2.6]};}
  updatePose(){const p=this.path;p.at(this.s-1.6,_A,_D);p.at(this.s+1.6,_F,_D);let dx=_F.x-_A.x,dz=_F.z-_A.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;this.ta=Math.atan2(-dz,dx);this.cx=(_A.x+_F.x)/2;this.cz=(_A.z+_F.z)/2;
    [-2.3,-.75,.75,2.3].forEach((o,i)=>{this.body[i].x=this.cx+dx*o;this.body[i].z=this.cz+dz*o;});}
  sync(){this.group.position.set(this.cx,0,this.cz);this.group.rotation.y=this.ta;}
}
function* carLoop(c){for(;;){c.status='Yard patrol';c.dest='Block F, lane 3';yield* drive(c,[P(c),{x:112+OFF,z:108},{x:112+OFF,z:84},{x:64,z:84}]);c.status='Checking stacks';yield* sleep(5);
  c.status='Yard patrol';c.dest='South road';yield* drive(c,[P(c),{x:-OFF,z:84},{x:-OFF,z:108},{x:38,z:108}]);c.trips++;c.status='Standing by';yield* sleep(4);}}
(()=>{const sv=new Car('SV-01',carModel('pickup',0xf4f2ed,true));sv.place(38,108,1);cos.push(carLoop(sv));
  const park=(kind,hex,x,z,r,svc)=>{const g=carModel(kind,hex,svc);g.position.set(x,0,z);g.rotation.y=r;scene.add(g);},N=Math.PI/2;
  [['sedan',0xb9bdc1,35.5,N],['suv',0x1b1c20,38.5,N],['pickup',0xf4f2ed,41.5,-N],['sedan',0x27395c,47.5,N],['suv',0xd9d4c6,50.5,-N],['sedan',0x7d1d1d,53.5,N],['suv',0x5a5f63,59.5,N],['sedan',0xf4f2ed,62.5,-N],['pickup',0x2b3a33,68.5,N]].forEach(([k,h,x,r])=>park(k,h,x,133,r));
  park('pickup',0xf4f2ed,-46,134.4,0,1);park('pickup',0xf2c21a,-105,21.4,0,1);park('suv',0xf4f2ed,72,22.4,Math.PI,1);park('pickup',0xf4f2ed,-36,134.6,Math.PI,1);})();
/* ---------- people: quay signalmen, gate marshals and yard foremen ---------- */
function makePed(vest){
  const g=new T.Group(),dark=M_(0x23262d),skin=M_(0xc99878),white=M_(0xf3f1ec),vm=M_(vest,{roughness:.6,emissive:vest,emissiveIntensity:.18}),refl=M_(0xeeeeea,{emissive:0xffffff,emissiveIntensity:.3}),wand=M_(0xff7a1a,{emissive:0xff5a00,emissiveIntensity:1.6});
  const B=new Builder();B.box(vm,.26,.6,.44,0,1.18,0);B.box(refl,.27,.06,.45,0,1.04,0);B.box(refl,.27,.06,.45,0,1.3,0);B.add(skin,new T.SphereGeometry(.13,10,8),0,1.62,0);B.cyl(white,.15,.1,0,1.72,0,0,0,0,10);B.box(white,.12,.03,.26,.14,1.68,0);g.add(B.build());
  const limb=(mat,w,len,z,y,extra)=>{const p=new T.Group();p.position.set(0,y,z);const L=new Builder();L.box(mat,w,len,w,0,-len/2,0);if(extra)extra(L);p.add(L.build());g.add(p);return p;};
  const p={x:0,z:0,hdg:0,rot:0,phase:0,wave:0,cross:false,moving:false,t:rr(0,6),next:rr(4,9),group:g,
    legs:[limb(dark,.17,.86,-.11,.86),limb(dark,.17,.86,.11,.86)],arms:[limb(vm,.12,.58,-.29,1.44),limb(vm,.12,.58,.29,1.44,L=>L.box(wand,.05,.5,.05,0,-.8,0))],
    sync(dt){this.t+=dt;let d=this.hdg-this.rot;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;this.rot+=d*(1-Math.exp(-dt*8));g.position.set(this.x,0,this.z);g.rotation.y=this.rot;
      const sw=this.moving?Math.sin(this.phase*4.4)*.6:0;this.legs[0].rotation.z=sw;this.legs[1].rotation.z=-sw;this.arms[0].rotation.z=-sw*.7;
      if(this.wave){this.arms[1].rotation.z=2.25+Math.sin(this.t*6)*.4;this.arms[1].rotation.x=Math.sin(this.t*6)*.3;}else{this.arms[1].rotation.z=sw*.7;this.arms[1].rotation.x=0;}}};
  scene.add(g);peds.push(p);return p;
}
function* walkTo(p,x,z,sp=1.35){for(;;){const dt=(yield)||0,dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);if(d<.04){p.x=x;p.z=z;p.moving=false;return;}const st=Math.min(d,sp*dt);p.x+=dx/d*st;p.z+=dz/d*st;p.phase+=st;p.hdg=Math.atan2(-dz,dx);p.moving=true;}}
// signalman on the apron behind each quay crane: follows the crane and waves trucks into position
function* quayMan(p,c,off){p.x=c.g+off;p.z=20.6;let t=0;
  for(;;){if(Math.abs(p.x-(c.g+off))>1.2){p.wave=0;yield* walkTo(p,c.g+off,20.6);}
    const coming=trucks.some(o=>o.active&&Math.abs(o.pos.z-LQ)<.6&&o.v>.4&&c.g-o.pos.x>-2&&c.g-o.pos.x<34);
    p.wave=coming||c.engaged?1:0;p.hdg=coming?Math.atan2(.8,-.6):Math.PI/2;
    t+=(yield)||0;if(t>p.next){t=0;p.next=rr(7,13);off=rr(-6.5,6.5);}}}
// marshal beside each gate lane
function* gateMan(p,inbound){const x=inbound?5.8:-5.8,z0=GATE_Z+(inbound?5.6:-5.6),z1=GATE_Z+(inbound?9.4:-9.4);p.x=x;p.z=z0;let t=0,at0=true;
  for(;;){const busy=trucks.some(o=>o.active&&o.sub==='ext'&&(inbound?(o.status==='Arriving at gate'||o.status==='Gate check'):(o.status==='Gate out'||(o.status==='To gate'&&Math.abs(o.pos.x)<4&&o.pos.z>100))));
    p.wave=busy?1:0;if(busy)p.hdg=inbound?-Math.PI/2:Math.PI/2;
    t+=(yield)||0;if(!busy&&t>p.next){t=0;p.next=rr(6,12);at0=!at0;yield* walkTo(p,x,at0?z0:z1,1.1);p.hdg=inbound?-Math.PI/2:Math.PI/2;}}}
// yard foreman walking the block ends; crosses a truck lane only when it is clear, and trucks stop for him
function laneClear(x,L){
  for(const o of trucks){if(!o.active)continue;for(const q of o.body){const dz=Math.abs(q.z-L),dx=q.x-x;if(dz<4.6&&Math.abs(dx)<6.5)return false;if(dz<2.6&&dx>0&&dx<34&&o.v>.3)return false;}}
  if(x<0){const J=JUNC.find(j=>j.x===0&&j.z===L);if(J.res.some(r=>r.pts[r.pts.length-1].x<-ZX+1.6))return false;}
  return true;}
function* foreman(p,x,dir){p.x=x;p.z=dir>0?26.5:97;
  for(;;){for(const L of dir>0?LANES:[...LANES].reverse()){
      yield* walkTo(p,x,L-4.8*dir);p.hdg=0;
      while(!laneClear(x,L)){p.wave=1;yield;}
      p.wave=0;p.cross=true;yield* walkTo(p,x,L+4.8*dir,1.5);p.cross=false;
      yield* walkTo(p,x,clamp(L+13*dir,26.5,97));p.hdg=x<0?Math.PI:0;yield* sleep(rr(3,7));}
    dir=-dir;}}
(()=>{const hiv=0xe6d21a,hio=0xf07a1c;
  cranes.filter(c=>c.kind==='sts').forEach((c,i)=>cos.push(quayMan(makePed(i%2?hio:hiv),c,i%2?4.5:-4.5)));
  cos.push(gateMan(makePed(hio),true),gateMan(makePed(hiv),false),foreman(makePed(hiv),-11.2,1),foreman(makePed(hio),11.2,-1));})();
const tug=(()=>{const B=new Builder();B.box(M_(0x26334f),10,2.8,4,0,-1.2,0);B.box(M_(0xf1efe9),3.6,2.3,2.8,-.6,1.3,0);B.box(M_(0x1f3640),3.7,.8,2.9,-.6,1.6,0);B.box(M_(0xc9481b),1.1,1.7,1.1,-2.6,2.6,0);B.cyl(M_(0x1d1b1e),.5,10.2,0,-.2,2.05,0,0,Math.PI/2,8);B.cyl(M_(0x1d1b1e),.5,10.2,0,-.2,-2.05,0,0,Math.PI/2,8);const g=B.build();scene.add(g);return g;})();

function step(dt){
  simT+=dt;for(const c of cos)c.next(dt);
  for(const t of trucks)t.updatePose();
  for(const c of cranes)if(c.kind==='sts'&&c.boom!==c.boomT){const d=c.boomT-c.boom,st=.2*dt;c.boom=Math.abs(d)<=st?c.boomT:c.boom+Math.sign(d)*st;}
  for(const t of trucks)if(t.active&&t.pop<1)t.pop=Math.min(1,t.pop+dt*2.5);
}
