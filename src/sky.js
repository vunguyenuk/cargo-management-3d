
/* ---------- sky, time of day and weather ----------
   The sky follows the terminal clock (one clock hour every ten minutes at 1×). Each hour of the day has a palette: sky gradient,
   sun or moon light, ambient light, water and haze. Weather lays cloud, rain or fog over it. At night the terminal lights itself:
   six flood lights, glowing lamp heads, lit windows and vehicle lamps. */
const LAMPS=[];   // [x,y,z,size,hex]: every fixed light in the world, drawn as a glow after dark
const SUNRISE=5.67,SUNSET=17.5;
const hourNow=()=>{const s=16*3600+42*60+dayOff+simT*6;return ((s/3600)%24+24)%24;};
const TOD={morning:7.5,noon:12,afternoon:16.7,night:20.5};
const WXN={clear:'Clear',cloudy:'Cloudy',rain:'Rain',fog:'Fog'};
//            cloud sun  amb  grey rain wet  mist vis(m beyond the camera target)
const WX={clear:[.26,1,   1,   0,   0,   0,  0,  1e5],cloudy:[.94,.26,1.12,.8,  0,   0,  0,  2600],rain:[1,  .1, .92,.92, 1,   1,  .15,1150],fog:[.7, .3, 1.05,.85,0,   .25,1,  330]};
const wx={name:'clear',cur:WX.clear.slice(),vis:1e5,mist:0,rain:0,wet:0};
const KEYS=[  // hour, zenith, horizon, sun/moon colour, its intensity, ambient sky, ambient ground, ambient intensity, water, glint colour, glint, night, stars, warm overlay
  [0,   0x060a18,0x121b33,0x9db4e6,.5, 0x2c3c6a,0x15151c,.36,0x0a1a2a,0xa9bce6,.22,1,  1,  0],
  [4.8, 0x060a18,0x121b33,0x9db4e6,.5, 0x2c3c6a,0x15151c,.36,0x0a1a2a,0xa9bce6,.22,1,  .8, 0],
  [5.4, 0x1a2a5c,0x8a5a66,0x9db4e6,.1, 0x4a5a94,0x2a2630,.42,0x16324a,0xd9a6a0,.1, .95,.25,.2],
  [5.9, 0x3f66ac,0xf2a47e,0xff9c62,1.5,0x8fa4d6,0xa88f80,.62,0x2f7186,0xffc08a,.8, .4, 0,  .9],
  [6.6, 0x4a82cc,0xf3d3b0,0xffc890,2.8,0xa9c0ea,0xbfab98,.78,0x2e8697,0xffe0b0,1,  0,  0,  .7],
  [8.5, 0x3f86d8,0xcfe2f1,0xffeed6,2.8,0xb6cff2,0xc2b5a3,.74,0x2590a6,0xfff6e6,.7, 0,  0,  .2],
  [12,  0x2c7ad8,0xc2def5,0xfff8ee,2.6,0xc0d8f7,0xc6baa8,.7, 0x1c93ad,0xf2fbff,.55,0,  0,  .08],
  [15,  0x3a80d2,0xdbe2e2,0xffe9c8,3.0,0xb4c8ee,0xc8b8a2,.76,0x2590a2,0xfff2d8,.8, 0,  0,  .35],
  [16.7,0x95b4ef,0xefcba2,0xffc88e,3.3,0xa6b8e0,0xc9b29a,.8, 0x2a8791,0xffd694,1,  0,  0,  1],
  [17.3,0x5a6fc0,0xf6ac74,0xff9a58,2.3,0x95a2d4,0xb8957e,.66,0x2a6c80,0xffb070,1,  .3, 0,  1],
  [17.75,0x33488f,0xe98a6a,0xff8a5a,.5,0x6c78b4,0x6a5560,.5, 0x1f4a63,0xff9a70,.4, .85,0,  .5],
  [18.3,0x141f4a,0x6a4a72,0x9db4e6,.1, 0x3c4a80,0x1e1c26,.4, 0x10283e,0xa9bce6,.12,1,  .5, .1],
  [19,  0x060a18,0x121b33,0x9db4e6,.5, 0x2c3c6a,0x15151c,.36,0x0a1a2a,0xa9bce6,.22,1,  1,  0],
  [24,  0x060a18,0x121b33,0x9db4e6,.5, 0x2c3c6a,0x15151c,.36,0x0a1a2a,0xa9bce6,.22,1,  1,  0]
].map(k=>({h:k[0],c:[1,2,3,5,6,8,9].map(i=>col(k[i])),n:[k[4],k[7],k[10],k[11],k[12],k[13]]}));
const mkPal=()=>({c:[0,1,2,3,4,5,6].map(()=>new T.Color()),n:[0,0,0,0,0,0]});
const palT=mkPal(),pal=mkPal();   // c: zenith, horizon, light, ambient sky, ambient ground, water, glint; n: light, ambient, glint, night, stars, warm
function samplePal(h,out){let i=1;while(i<KEYS.length-1&&KEYS[i].h<h)i++;const a=KEYS[i-1],b=KEYS[i],t=clamp((h-a.h)/(b.h-a.h),0,1);
  for(let k=0;k<7;k++)out.c[k].copy(a.c[k]).lerp(b.c[k],t);for(let k=0;k<6;k++)out.n[k]=lerp(a.n[k],b.n[k],t);}
// where the sun stands: rises in the east, passes south over the bay and sets in the west, worked out in map bearings and turned into the terminal's frame
const sunDir=V(0,1,0),moonDir=V(-.42,.74,-.53).normalize(),sunT=V(0,1,0);
function sunAt(h,out){const p=(h-SUNRISE)/(SUNSET-SUNRISE)*Math.PI,s=Math.sin(p),el=(s>=0?72*Math.pow(s,.75):-30*Math.pow(-s,.6))*Math.PI/180;
  let hx=-Math.cos(p),hz=-.42*Math.abs(s)-.18;const l=Math.hypot(hx,hz),[cx,cz]=[hx*_sc+hz*_ss,-hx*_ss+hz*_sc];return out.set(cx/l*Math.cos(el),Math.sin(el),cz/l*Math.cos(el));}

/* sky dome: gradient, sun, moon, stars, drifting cloud and the far shores of the bay */
const skyU={uZen:{value:new T.Color()},uHor:{value:new T.Color()},uSunC:{value:new T.Color()},uSunD:{value:V(0,1,0)},uMoonD:{value:moonDir},uCloudA:{value:new T.Color()},uCloudB:{value:new T.Color()},uSil:{value:new T.Color()},
  uStar:{value:0},uCloud:{value:.26},uT:uT,uSunG:{value:1},uMoon:{value:0},uCity:{value:0},uMist:{value:0},uEnv:{value:0},uGround:{value:new T.Color()}};
// drawn after everything solid, pinned to the far plane, so only the pixels that really show sky are shaded
const skyMat=new T.ShaderMaterial({uniforms:skyU,side:T.BackSide,depthWrite:false,fog:false,
  vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',
  fragmentShader:`uniform vec3 uZen,uHor,uSunC,uSunD,uMoonD,uCloudA,uCloudB,uSil,uGround;uniform float uStar,uCloud,uT,uSunG,uMoon,uCity,uMist,uEnv;varying vec3 vD;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float h31(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p=p*2.03+vec2(17.3,9.1);a*=.5;}return s;}
void main(){
  vec3 d=normalize(vD);float y=d.y;
  vec3 c=mix(uHor,uZen,pow(clamp(y,0.,1.),.42));
  float sd=max(dot(d,uSunD),0.),up=step(-.02,y);
  c+=uSunC*(pow(sd,6.)*.2+pow(sd,48.)*.45)*uSunG;
  vec3 q=d*190.;float st=step(.9972,h31(floor(q)))*smoothstep(.55,.1,length(fract(q)-.5));
  c+=vec3(.9,.95,1.)*st*uStar*smoothstep(.02,.25,y)*(1.-uCloud*.9);
  float md=max(dot(d,uMoonD),0.);c+=vec3(.95,.97,1.)*(smoothstep(.99965,.9998,md)*2.2+pow(md,300.)*.22)*uMoon*(1.-uCloud*.7);
  c+=uSunC*smoothstep(.99955,.9998,sd)*6.*uSunG*up;
  float th=mix(.72,.18,uCloud);vec2 uv=d.xz/(max(y,0.)+.16)*1.25+vec2(uT*.006,uT*.002);float n=fbm(uv);
  float cov=smoothstep(th,th+.22,n)*smoothstep(0.,.16,y);
  vec3 cl=mix(uCloudA,uCloudB,smoothstep(th+.08,th+.5,n))+uSunC*pow(sd,9.)*.22*uSunG;
  c=mix(c,cl,cov);
  if(y<0.)c=uEnv>.5?mix(uHor*.6,uGround,clamp(-y*6.,0.,1.)):mix(uHor,uHor*.92,clamp(-y*5.,0.,1.));
  // far side of the bay: the Hai Van range to the west and north-west, the city low on the southern shore
  float az=atan(d.z,d.x)+0.3675;if(az>3.14159)az-=6.28318;float w1=smoothstep(-1.75,-1.1,az)*smoothstep(.95,.5,az),w2=smoothstep(-2.75,-2.35,az)*smoothstep(-.75,-1.15,az);
  float m1=(.022+.05*fbm(vec2(az*2.2+4.,1.))+.012*sin(az*9.))*w1*(.55+.45*smoothstep(-1.2,.3,az)),m2=(.012+.03*fbm(vec2(az*4.1,7.)))*w1;
  float hb=h21(vec2(floor(az*150.),3.)),ch=(.0035+.016*pow(hb,3.))*w2;
  vec3 sil=mix(uHor,uSil,.42),sil2=mix(uHor,uSil,.66);
  if(y>=0.){if(y<m1)c=mix(c,sil,.9);if(y<m2)c=mix(c,sil2,.9);if(y<ch)c=mix(c,sil2,.85);
    float cy=smoothstep(.02,.0,y)*(w2+.35*w1*smoothstep(.012,0.,y));c+=vec3(1.,.78,.5)*step(.83,h21(vec2(floor(az*820.),floor(y*820.))))*cy*uCity*1.6;}
  c=mix(c,uHor,uMist*.9);
  gl_FragColor=vec4(c,1.);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`});
const skyDome=new T.Mesh(new T.SphereGeometry(4200,40,20),skyMat);skyDome.renderOrder=900;skyDome.frustumCulled=false;skyDome.raycast=()=>{};scene.add(skyDome);
scene.background=null;

/* flood lights for the night shift */
// the floods exist only after dark: a light that is switched off still costs every pixel, so they are removed by day. Real lights are dear, so
// there are six in all: they stand at whichever floodlit places (FSITES: the terminal's masts, every high mast along the shore) are nearest
// the middle of the view, and fade out and in as they change places. Everything else that is lit is drawn: a glow at the lamp, a pool on the ground
const FSITES=[[-62,34,12],[62,34,12],[-62,36,70],[62,36,70],[0,32,118]].map(([x,y,z])=>({x,y,z,k:1}));
const FLOODS=[0,1,2,3,4,5].map(()=>{const l=new T.PointLight(col(0xffd9a0),0,215,1.6);l.visible=false;l.site=null;l.k=0;l.keep=false;scene.add(l);return l;});let floodsOn=false,floodT=0;
function floodFollow(dt,night){floodT-=dt;
  if(floodT<=0){floodT=.3;const tx=cur.tx,tz=cur.tz;for(const f of FSITES)f.d=(f.x-tx)*(f.x-tx)+(f.z-tz)*(f.z-tz);const want=FSITES.slice().sort((a,b)=>a.d-b.d).slice(0,FLOODS.length);
    for(const l of FLOODS)l.keep=want.includes(l.site);const free=want.filter(f=>!FLOODS.some(l=>l.site===f));
    for(const l of FLOODS)if(!l.keep&&l.k<.002&&free.length){l.site=free.shift();l.position.set(l.site.x,l.site.y,l.site.z);l.keep=true;}}
  for(const l of FLOODS){l.k=clamp(l.k+(l.keep?dt:-dt)*2.4,0,1);l.intensity=l.site?1.35*night*l.k*l.site.k:0;}}
// the pool of light a lamp throws on the ground under it: one mesh of flat patches for all of them, laid on after dark
const poolMat=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.62)');gr.addColorStop(.7,'rgba(255,255,255,.18)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
  return new T.MeshBasicMaterial({map:new T.CanvasTexture(c),vertexColors:true,blending:T.AdditiveBlending,transparent:true,depthWrite:false,toneMapped:false,opacity:0,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-7,polygonOffsetUnits:-7});})();
function lightPools(){const p=[],u=[],c=[],k=new T.Color();
  for(const l of LAMPS){if(!l[6])continue;const ra=l[6],rl=l[7]||ra,a=l[8]===undefined?0:l[8]+SITE.rot,ax=Math.cos(a)*rl,az=-Math.sin(a)*rl,bx=Math.sin(a)*ra,bz=Math.cos(a)*ra,y=l[5]+.07,x=l[0],z=l[2],q=[[-1,-1],[1,-1],[-1,1],[1,-1],[1,1],[-1,1]];
    k.set(l[4]).convertSRGBToLinear().multiplyScalar(l[3]===2?.17:.3);for(const [s,t] of q){p.push(x+ax*s+bx*t,y,z+az*s+bz*t);u.push((s+1)/2,(t+1)/2);c.push(k.r,k.g,k.b);}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(u,2));g.setAttribute('color',new T.Float32BufferAttribute(c,3));
  const m=new T.Mesh(g,poolMat);m.frustumCulled=false;m.raycast=()=>{};m.visible=false;m.renderOrder=4;nightObjs.push(m);scene.add(m);}
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.18,'rgba(255,255,255,.75)');gr.addColorStop(.45,'rgba(255,255,255,.2)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new T.CanvasTexture(c);})();
const glowMats=[5,11,24].map(s=>new T.PointsMaterial({map:glowTex,size:s,sizeAttenuation:true,vertexColors:true,blending:T.AdditiveBlending,depthWrite:false,transparent:true,fog:false,toneMapped:false,opacity:0}));
const nightObjs=[];
// glow sprites for a list of [x,y,z,hex]; added to a moving thing they travel with it
function glowPts(list,size=0){const p=[],c=[],k=new T.Color();for(const [x,y,z,hex] of list){p.push(x,y,z);k.set(hex).convertSRGBToLinear();c.push(k.r,k.g,k.b);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('color',new T.Float32BufferAttribute(c,3));
  const m=new T.Points(g,glowMats[size]);m.frustumCulled=false;m.raycast=()=>{};m.visible=false;m.renderOrder=6;nightObjs.push(m);return m;}
function initNight(){
  for(const l of LAMPS)if(l[3]===2&&l[6]>30)FSITES.push({x:l[0],y:l[1]+3,z:l[2],k:.95});
  lightPools();
  for(let s=0;s<3;s++){const l=LAMPS.filter(a=>a[3]===s).map(a=>[a[0],a[1],a[2],a[4]]);if(l.length)scene.add(glowPts(l,s));}
  for(const tm of TERMS)for(const c of tm.cranes){c.group.add(glowPts(c.lampPts.map(p=>[...p,0xffe9c4]),c.kind==='sts'?2:1));if(c.kind==='sts'){c.pivot.add(glowPts(c.boomLamps.map(p=>[...p,0xffe9c4]),2));c.group.add(glowPts([[0,46,6.5,0xff5040]],1));}}
  for(const tm of TERMS)for(const t of tm.trucks){const f=t.sub==='car'?2.3:(t.wb||3)+1.45,host=t.tractor||t.group;host.add(glowPts([[f,1,.85,0xfff3d6],[f,1,-.85,0xfff3d6]],0));
    if(t.trailer)t.trailer.add(glowPts([[-6.2,1.1,.9,0xff3020],[-6.2,1.1,-.9,0xff3020]],0));else host.add(glowPts([[-2.3,.9,.7,0xff3020],[-2.3,.9,-.7,0xff3020]],0));}
}
const nmat={lamp:M_(0xfff0c8,{emissive:0xffc978,emissiveIntensity:1}),glass:M_(0x1f3640,{roughness:.2,metalness:.2}),vl:VM(0xfff3d6,{emissive:0xffd9a0,emissiveIntensity:1.4}),vr:VM(0xc0221a,{emissive:0x8a120c,emissiveIntensity:.9})};
nmat.glass.emissive=col(0xffc27a);nmat.glass.emissiveIntensity=0;

/* rain */
const rainU={uT:uT,uC:{value:V(0,0,0)},uA:{value:0}};
const rain=(()=>{const N=2800,o=new Float32Array(N*6),e=new Float32Array(N*2);for(let i=0;i<N;i++){const a=Math.random(),b=Math.random(),c=Math.random();o.set([a,b,c,a,b,c],i*6);e[i*2+1]=1;}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(o,3));g.setAttribute('e',new T.BufferAttribute(e,1));
  const m=new T.LineSegments(g,new T.ShaderMaterial({uniforms:rainU,transparent:true,depthWrite:false,fog:false,
    vertexShader:'attribute float e;uniform float uT;uniform vec3 uC;void main(){vec3 o=position;float y=fract(o.y-uT*(.55+o.x*.25));vec3 p=uC+vec3((o.x-.5)*760.,y*240.,(o.z-.5)*760.)+vec3(-.16,-1.,.06)*e*10.-vec3(.16,0.,-.06)*(1.-y)*240.*.16;gl_Position=projectionMatrix*viewMatrix*vec4(p,1.);}',
    fragmentShader:'uniform float uA;void main(){gl_FragColor=vec4(.86,.9,.96,uA);}'}));
  m.frustumCulled=false;m.raycast=()=>{};m.visible=false;m.renderOrder=8;scene.add(m);return m;})();

/* reflections on paint, glass and chrome follow the sky */
let envH=-99,envW='',envLast=0;
function rebuildEnv(){try{const sc=new T.Scene(),m=new T.Mesh(new T.SphereGeometry(50,32,16),skyMat);skyU.uEnv.value=1;sc.add(m);
    const pm=new T.PMREMGenerator(renderer),t=pm.fromScene(sc,.02).texture;pm.dispose();skyU.uEnv.value=0;m.geometry.dispose();
    const old=envTex;envTex=t;for(const e of envMats){e.m.envMap=t;}if(old)old.dispose();}catch(e){skyU.uEnv.value=0;}}

const sky={h:16.7,period:'Afternoon',night:0,foam:1,first:true,hold:null};   // hold: an hour to keep the sky at while the clock runs on
const skyHour=()=>sky.hold===null?hourNow():sky.hold;
const overcast=new T.Color(),_k1=new T.Color(),_k2=new T.Color();
function setTimeOfDay(k){if(sky.hold!==null)sky.hold=TOD[k];else dayOff+=((TOD[k]-hourNow()+24)%24)*3600;}
function setHold(on){sky.hold=on?hourNow():null;}
function setWeather(k){wx.name=k;}
function periodOf(h){return h<5.2?'Night':h<6.5?'Dawn':h<11?'Morning':h<13.5?'Noon':h<17.1?'Afternoon':h<18.4?'Dusk':'Night';}
function skyTick(rdt){
  const h=skyHour(),W=WX[wx.name],k=sky.first?1:1-Math.exp(-rdt*2.2);sky.h=h;sky.period=periodOf(h);
  for(let i=0;i<8;i++)wx.cur[i]=lerp(wx.cur[i],W[i],sky.first?1:1-Math.exp(-rdt*(i===7?1.2:1.6)));
  const [cloud,sunK,ambK,grey,rainA,wet,mist,vis]=wx.cur;wx.vis=vis;wx.mist=mist;wx.rain=rainA;wx.wet=wet;
  samplePal(h,palT);
  const day=1-palT.n[3];
  // overcast and rain flatten the sky towards grey and hide the sun
  overcast.setRGB(.06+.38*day,.07+.41*day,.09+.45*day).multiplyScalar(1-.3*rainA);
  palT.c[0].lerp(_k1.copy(overcast).multiplyScalar(.78),grey);palT.c[1].lerp(_k1.copy(overcast).multiplyScalar(1.1),grey);
  palT.c[5].lerp(_k1.copy(overcast).multiplyScalar(.5),grey*.75);palT.c[2].lerp(_k1.setRGB(1,1,1),grey*.5);
  palT.n[0]*=lerp(1,sunK,day);palT.n[1]*=lerp(1,ambK,day);palT.n[2]*=1-grey*.85;palT.n[4]*=1-grey;palT.n[5]*=1-grey;
  for(let i=0;i<7;i++)pal.c[i].lerp(palT.c[i],k);for(let i=0;i<6;i++)pal.n[i]=lerp(pal.n[i],palT.n[i],k);
  const night=pal.n[3];sky.night=night;sky.foam=1-.75*night;
  // light direction: the sun by day, the moon once it is down
  sunAt(h,sunDir);const upNow=h>SUNRISE-.12&&h<SUNSET+.12;
  if(upNow)sunT.copy(sunDir).setY(Math.max(sunDir.y,.13)).normalize();else sunT.copy(moonDir);
  SUN.lerp(sunT,sky.first?1:1-Math.exp(-rdt*1.6)).normalize();
  sun.color.copy(pal.c[2]);sun.intensity=pal.n[0];hemi.color.copy(pal.c[3]);hemi.groundColor.copy(pal.c[4]);hemi.intensity=pal.n[1];fill.intensity=.16*(1-.7*night);
  scene.fog.color.copy(pal.c[1]);
  waterMat.color.copy(pal.c[5]);waterMat.roughness=lerp(.45,1,night);waterU.uGl.value.copy(pal.c[6]);waterU.uGlI.value=pal.n[2];waterU.uSun3.value.copy(SUN);waterU.uRain.value=rainA;
  // sky dome
  skyU.uZen.value.copy(pal.c[0]);skyU.uHor.value.copy(pal.c[1]);skyU.uSunC.value.copy(pal.c[2]);skyU.uSunD.value.copy(sunDir);skyU.uSunG.value=(upNow?1:0)*(1-grey*.9)*clamp(pal.n[0]/1.2,0,1);
  skyU.uMoon.value=sstep(.6,1,night);skyU.uStar.value=pal.n[4];skyU.uCloud.value=cloud;skyU.uCity.value=night;skyU.uMist.value=mist;
  _k1.copy(pal.c[1]).lerp(_k2.setRGB(1,1,1),.55*(1-night)).multiplyScalar(1-.25*grey*day);skyU.uCloudA.value.copy(_k1).lerp(pal.c[2],.12*(1-grey));
  skyU.uCloudB.value.copy(pal.c[0]).lerp(pal.c[1],.45).multiplyScalar(.62+.2*(1-day));
  skyU.uSil.value.copy(pal.c[0]).multiplyScalar(.4+.25*day).lerp(_k2.setRGB(.16,.2,.26).multiplyScalar(.25+.75*day),.5);
  skyU.uGround.value.setRGB(.5,.44,.4).multiplyScalar(.12+.88*day*(1-.35*grey));
  // night shift: floods, lamp heads, windows, vehicle lamps, glows
  const lit=clamp(Math.max(night,rainA*.55,mist*.6,grey*.25),0,1);
  if(floodsOn?night<.02:night>.06){floodsOn=!floodsOn;for(const f of FLOODS)f.visible=floodsOn;}
  floodFollow(sky.first?9:rdt,night);poolMat.opacity=clamp(night*1.15,0,1);
  nmat.lamp.emissiveIntensity=1+2.6*lit;nmat.glass.emissiveIntensity=.75*night;nmat.vl.emissiveIntensity=1.4+2.4*lit;nmat.vr.emissiveIntensity=.9+1.6*lit;
  const go=clamp(lit*1.15,0,1)*(1+.35*mist);for(let i=0;i<3;i++){glowMats[i].opacity=Math.min(1,go);glowMats[i].size=[5,11,24][i]*(1+.6*mist+.25*rainA);}
  const on=go>.03;for(const o of nightObjs)o.visible=on;
  // wet ground and rain
  for(const w of wetMats){w.m.roughness=lerp(w.r,.34,wet);w.m.color.copy(w.c).multiplyScalar(1-.24*wet);}
  rain.visible=rainA>.02;rainU.uA.value=.34*rainA*(1-.5*night);rainU.uC.value.set(Math.round(cur.tx/40)*40,0,Math.round(cur.tz/40)*40);
  const ek=(.14+.86*day)*(1-.35*grey);for(const e of envMats)e.m.envMapIntensity=e.k*ek;
  // refresh the reflection map when the sky has moved on
  const now=performance.now();if(sky.first||((Math.abs(h-envH)>.45&&Math.abs(h-envH)<23.5)||envW!==wx.name)&&now-envLast>2600){envH=h;envW=wx.name;envLast=now;rebuildEnv();}
  const gl=$('.glow');if(gl)gl.style.opacity=(pal.n[5]*(1-.4*mist)).toFixed(3);
  skyDome.position.copy(cam.position);
  sky.first=false;
}
