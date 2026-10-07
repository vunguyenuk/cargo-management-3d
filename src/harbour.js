/* ---------- harbour geography: Sơn Trà Port and its shore from Mân Quang to Tiên Sa ----------
   Everything outside the terminal is authored in the survey grid of the map data (metres, +x west, +z north) and hangs under one
   group, geo. SITE says where the simulator's terminal sits in that grid: its quay face lies along the real 200 m wharf of Sơn Trà
   Port, 15 m east of centre so the gate road clears the port's transit shed. The terminal keeps the simulator's own layout (268 m of
   quay against the real 200 m), so it overhangs the wharf at both ends. SITE, toSim and toMap are defined with the world constants. */
const WY=-2.2;
const geo=new T.Group();geo.rotation.y=SITE.rot;{const [x,z]=toSim(0,0);geo.position.set(x,0,z);}scene.add(geo);
// terminal ground and its gate road, asked in map coordinates
const inTerm=(x,z,m=0)=>{const [sx,sz]=toSim(x,z);return Math.abs(sx)<134+m&&sz>-m&&sz<160+m||Math.abs(sx)<9.5+m&&sz>=160&&sz<ROAD_Z+m;};
const hrand=(()=>{let s=90417;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();
const hr=(a,b)=>a+hrand()*(b-a),hpick=a=>a[Math.floor(hrand()*a.length)];
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
// shoreline, land on the +z side: the far coast north of Tiên Sa, the mapped shore from Tiên Sa to Nại Hiên Đông, then the river mouth and the open-sea side
const COAST=(()=>{const m=[];for(let i=0;i<MAP.coast.length;i+=2)m.push([MAP.coast[i],MAP.coast[i+1]]);
  // the terminal's quay replaces the mapped wharf: from the head of the inlet on its west side round to the shore on its east side
  const a=m.findIndex(p=>p[0]===843&&p[1]===375),b=m.findIndex(p=>p[0]===535&&p[1]===234);
  m.splice(a+1,b-a-1,...[[134,TERM_W],[134,0],[-134,0],[-134,TERM_E]].map(([x,z])=>{const q=toMap(x,z);q.term=true;return q;}));
  return [[1320,5200],[1320,4033],[1133,3669],[1141,3401],[1057,3343],[1074,3230],[1267,3057],[1241,2816],[1190,2690],[1339,2303],[1410,2250],[1519,2302],[1642,2293],[1663,2233],[1640,2122],[1733,1930],[1890,1841],[1863,1701],[1964,1624],[1962,1537],[1921,1400],[1885,1281]]
    .concat(m,[[1230,-1300],[1150,-1750],[1040,-2150],[900,-2700],[700,-3600],[500,-5200],[-1850,-5200],[-1876,-3323],[-1900,-2404],[-2039,-1876],[-2099,-1437],[-2206,-1137],[-2314,-973],[-2592,-711],[-2802,-600],[-3070,-607],[-3196,-768],[-3360,-908],[-3651,-1131],[-3816,-1159],[-3851,-882],[-4139,-722],[-4488,-828],[-4878,-730],[-5071,-546],[-5200,-300],[-5200,5200]]);})();
const FARC=p=>Math.abs(p[0])>=5100||Math.abs(p[1])>=5100;   // corners that only close the polygon far inland
// Yết Kiêu from the Tiên Sa gate east and round the bend to the south; the ridge rises behind it
const ROAD=[[2600,760],[2484,760],[2376,755],[2284,771],[2205,801],[2115,811],[2056,844],[1967,796],[1888,835],[1820,855],[1746,854],[1688,835],[1642,804],[1578,747],[1393,552],[1301,455],[1246,420],[1186,409],[1124,424],[1031,480],[944,533],[897,550],[845,551],[796,535],[712,503],[654,483],[469,419],[324,357],[160,279],[71,237],[21,224],[-37,222],[-96,235],[-160,277],[-216,321],[-261,343],[-309,352],[-458,350],[-611,343],[-683,329],[-758,302],[-830,252],[-883,189],[-967,31],[-1037,-111],[-1207,-424],[-1420,-900],[-1700,-1700]];
const CITY=[[1905,-2100],[2024,-2639],[2249,-2898],[2573,-3028],[2765,-2795],[3131,-2579],[3348,-2555],[5200,-2400],[5200,-5200],[900,-5200],[1250,-3600],[1560,-2900],[1700,-2450]];   // west bank of the Hàn river mouth
const inPoly=(P,x,z)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const inLand=(x,z)=>inPoly(COAST,x,z);
function coastDist(x,z){let m=1e9;for(let i=0;i<COAST.length;i++){const a=COAST[i],b=COAST[(i+1)%COAST.length];if(FARC(a)||FARC(b))continue;const dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1),d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);if(d<m)m=d;}return m;}
function zRoad(x){const R=ROAD;if(x>=R[0][0])return R[0][1];for(let i=1;i<R.length;i++)if(x>=R[i][0]){const a=R[i-1],b=R[i];return a[1]+(b[1]-a[1])*(a[0]-x)/(a[0]-b[0]);}return R[R.length-1][1];}
const hash2=(x,z)=>{const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);};
function vnoise(x,z){const xi=Math.floor(x),zi=Math.floor(z);let fx=x-xi,fz=z-zi;fx=fx*fx*(3-2*fx);fz=fz*fz*(3-2*fz);return lerp(lerp(hash2(xi,zi),hash2(xi+1,zi),fx),lerp(hash2(xi,zi+1),hash2(xi+1,zi+1),fx),fz);}
const fbm=(x,z)=>vnoise(x,z)*.55+vnoise(x*2.1+5.3,z*2.1+1.7)*.3+vnoise(x*4.3+2.2,z*4.3+9.1)*.15;
// built ground north of the road stays level: every traced roof and yard presses the slope down around it
const LEVEL=(()=>{const L=[];for(const s of SITES.shed.concat(SITES.flat))L.push([(s[0]+s[2])/2,(s[1]+s[3])/2,Math.hypot(s[2]-s[0],s[3]-s[1])/2+s[4]/2+10]);
  for(const t of SITES.tank)L.push([t[0],t[1],t[2]+12]);for(const m of SITES.misc)if(m[0]==='monument')L.push([m[1],m[2],m[3]+26]);
  for(const g of SITES.ground){let x=0,z=0,n=(g.length-1)/2,r=0;for(let i=1;i<g.length;i+=2){x+=g[i]/n;z+=g[i+1]/n;}for(let i=1;i<g.length;i+=2)r=Math.max(r,Math.hypot(g[i]-x,g[i+1]-z));L.push([x,z,r+6]);}
  return L.filter(l=>l[1]>zRoad(l[0])+10);})();
const AREAS=MAP.area.map(a=>{const p=[];for(let i=1;i<a.length;i+=2)p.push([a[i],a[i+1]]);return {kind:a[0].split(':')[0],p};});
// the ridge behind the road; the low ground east of the stream stays flat
function terrainH(x,z){
  const s=z-zRoad(x)-34;if(s<=0)return 0;
  const low=sstep(.9,1.8,Math.hypot((x+400)/340,(z-500)/215));
  let m=Math.max(sstep(-620,-200,x),sstep(640,900,z))*low;if(m<=0||!inLand(x,z))return 0;m*=sstep(10,210,coastDist(x,z));if(m<=0)return 0;
  for(const l of LEVEL){const d=Math.hypot(x-l[0],z-l[1]);if(d<l[2]+70){m*=sstep(l[2],l[2]+70,d);if(m<=0)return 0;}}
  for(const a of AREAS)if(a.kind!=='beach'&&inPoly(a.p,x,z))return 0;
  const base=310*(1-Math.exp(-s/400)),n=fbm(x*.0034,z*.0034),r=fbm(x*.012+7,z*.012+3);
  return Math.max(0,base*m*(.58+.66*n)+(r-.5)*30*Math.min(1,s/120)*m);
}
// the same questions asked from the terminal's side
const inLandS=(x,z)=>inLand(...toMap(x,z)),terrainS=(x,z)=>terrainH(...toMap(x,z));
function smoothLine(pts,step){const c=new T.CatmullRomCurve3(pts.map(([x,z])=>V(x,0,z)),false,'centripetal');return c.getSpacedPoints(Math.max(2,Math.ceil(c.getLength()/step))).map(p=>[p.x,p.z]);}
// flat strip along a polyline; off shifts it sideways, dash keeps every other piece
const RIB=new Map();
function ribbon(pts,w,y,mat,off=0,dash=0){let pos=RIB.get(mat);if(!pos)RIB.set(mat,pos=[]);const n=pts.length;
  const side=i=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)];let tx=b[0]-a[0],tz=b[1]-a[1];const l=Math.hypot(tx,tz)||1;return [-tz/l,tx/l];};
  for(let i=0;i<n-1;i++){if(dash&&i%dash>=dash/2)continue;const [ax,az]=side(i),[bx,bz]=side(i+1),p=pts[i],q=pts[i+1];
    const x1=p[0]+ax*(off-w/2),z1=p[1]+az*(off-w/2),x2=p[0]+ax*(off+w/2),z2=p[1]+az*(off+w/2),x3=q[0]+bx*(off-w/2),z3=q[1]+bz*(off-w/2),x4=q[0]+bx*(off+w/2),z4=q[1]+bz*(off+w/2);
    pos.push(x1,y,z1,x2,y,z2,x3,y,z3,x3,y,z3,x2,y,z2,x4,y,z4);}
}
function flushRibbons(){for(const [mat,pos] of RIB){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();const m=new T.Mesh(g,mat);m.receiveShadow=true;m.frustumCulled=false;geo.add(m);}RIB.clear();}
const flatMat=(hex,k=2)=>wetReg(new T.MeshStandardMaterial({color:col(hex),roughness:.95,polygonOffset:true,polygonOffsetFactor:-k,polygonOffsetUnits:-k}));
// place names, given in map coordinates and carried into the scene
const GEO=[['Vũng Thùng',330,0,-330],['Vịnh Đà Nẵng',3050,0,260],['Bán đảo Sơn Trà',700,230,900],['Đ. Yết Kiêu',250,0,318],['Cảng Tiên Sa',2400,14,520],['Quân cảng',1470,10,470],['Hải đội 2 Biên phòng',455,10,265],
  ['Nhà máy LPG',40,22,110],['X50 · Sông Thu',-860,24,-250],['Bãi Tiên Sa',2150,0,1000],['Âu thuyền Thọ Quang',-380,0,-1480],['Cầu Thuận Phước',1150,60,-1980],['Cầu Mân Quang',-690,16,-728],['Nại Hiên Đông',900,0,-1080]]
  .map(([t,x,y,z])=>{const [sx,sz]=toSim(x,z);return {t,x:sx,y,z:sz};});

(function geography(){
  const L0=LAMPS.length;   // lamps pushed below are in map coordinates and are carried into the scene at the end
  const shapeOf=pts=>{const s=new T.Shape();pts.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));return s;};
  // land
  const lg=new T.ShapeGeometry(shapeOf(COAST));lg.rotateX(-Math.PI/2);
  const land=new T.Mesh(lg,M_(0xbfae8c,{roughness:.96}));land.position.y=-.09;land.receiveShadow=true;geo.add(land);
  {const g=new T.ShapeGeometry(shapeOf(CITY));g.rotateX(-Math.PI/2);const m=new T.Mesh(g,M_(0xbfae8c,{roughness:.96}));m.position.y=-.09;geo.add(m);}
  // rock revetment along the natural shore (the terminal has quay walls instead)
  {const NC=COAST.length,out=[];for(let i=0;i<NC;i++){const a=COAST[(i+NC-1)%NC],b=COAST[(i+1)%NC],p=COAST[i];let nx=b[1]-a[1],nz=-(b[0]-a[0]);const l=Math.hypot(nx,nz)||1;nx/=l;nz/=l;if(inLand(p[0]+nx*3,p[1]+nz*3)){nx=-nx;nz=-nz;}out.push([nx,nz]);}
    const pos=[];for(let i=0;i<NC-1;i++){const p=COAST[i],q=COAST[i+1];if(FARC(p)||FARC(q)||p.term&&q.term)continue;
      const [ax,az]=out[i],[bx,bz]=out[i+1],T1=[p[0]-ax*1.5,-.12,p[1]-az*1.5],T2=[q[0]-bx*1.5,-.12,q[1]-bz*1.5],B1=[p[0]+ax*7,-3.6,p[1]+az*7],B2=[q[0]+bx*7,-3.6,q[1]+bz*7];
      pos.push(...T1,...B1,...T2,...T2,...B1,...B2,...T2,...B1,...T1,...B2,...B1,...T2);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();
    const m=new T.Mesh(g,new T.MeshStandardMaterial({color:col(0x9a8f7e),roughness:1,flatShading:true}));m.receiveShadow=true;geo.add(m);}
  // ground: the mapped land-use outlines first, then the surfaces read off the imagery on top of them
  const pad=(pts,hex,y=-.07,k=1)=>{const g=new T.ShapeGeometry(shapeOf(pts));g.rotateX(-Math.PI/2);const m=new T.Mesh(g,flatMat(hex,k));m.position.y=y;m.receiveShadow=true;geo.add(m);};
  const PADC={port:0xb1aca2,yard:0xaea79b,navy:0xb6b3a2,beach:0xe6d6aa,water:0x4a8c95};
  for(const a of AREAS)pad(a.p,PADC[a.kind]);
  const pairs=(a,o=0)=>{const p=[];for(let i=o;i+1<a.length;i+=2)p.push([a[i],a[i+1]]);return p;};
  const GRD={conc:0xbbb7ac,sand:0xd9c9a0,lsand:0xe8e2cf,grass:0x7d9f5a,pitch:0x4f8a4a,court:0x3d7d68,blue:0x3f6fae,pool:0x63c2d2,pond:0x4b6a56,asph:0x6c6b6f,dark:0x33353a,water:0x4a8c95,houses:0xc2bcae};
  // roads
  const asph=flatMat(0x77767b,3),lineW=flatMat(0xf1eee6,5),lineY=flatMat(0xe2a81a,5),earth=flatMat(0xb09a78,3),creek=flatMat(0x4f8f96,3),concT=flatMat(0xc4c0b6,3);
  SITES.ground.forEach((g,i)=>{const pts=pairs(g,1).filter(p=>!inTerm(p[0],p[1]));if(pts.length<3)return;pad(pts,GRD[g[0]],-.066+i*.0002,2);   // each outline a hair above the one before, so overlaps never fight
    if(g[0]==='pitch'||g[0]==='court'||g[0]==='blue')ribbon(pts.concat([pts[0]]),.3,-.035,lineW);});
  const yk=smoothLine(ROAD,7);
  // every mapped road at its class width; the two carriageways of Yết Kiêu are separate ways, so the median falls out by itself
  const RW={T:9.6,t:6.5,P:9.6,p:6,R:7,U:7,S:5.5,K:3.6},roadPts=[];
  for(const h of MAP.hw){const c=h[0][0];if(h[0][1]==='b')continue;const raw=pairs(h,1);
    const sm=raw.length>2?smoothLine(raw,5):raw,w=RW[c],runs=[];let cur=[];for(const q of sm){if(inLand(q[0],q[1])&&!inTerm(q[0],q[1],3))cur.push(q);else{if(cur.length>1)runs.push(cur);cur=[];}}if(cur.length>1)runs.push(cur);   // stretches over water are bridges, built as decks further down
    for(const s of runs){ribbon(s,w,c==='K'?-.058:-.05,c==='K'?earth:asph);
      if(c==='T'||c==='P'){ribbon(s,.2,-.03,lineW,w/2-.45);ribbon(s,.2,-.03,lineW,-(w/2-.45));ribbon(s,.16,-.03,lineW,0,4);}else if(c==='R'||c==='U')ribbon(s,.14,-.035,lineW,0,4);
      for(const q of s)roadPts.push(q);}}
  const nearRoad=(x,z,r)=>{for(const q of roadPts)if(Math.abs(q[0]-x)<r&&Math.abs(q[1]-z)<r&&Math.hypot(q[0]-x,q[1]-z)<r)return true;return false;};
  for(const st of MAP.stream)ribbon(smoothLine(pairs(st),6),3.4,-.062,creek);
  // the terminal's own ground behind the fence, and its gate road out to Yết Kiêu
  const sim=pts=>pts.map(([x,z])=>toMap(x,z));
  pad(sim([[-134,160],[134,160],[134,246],[-134,246]]),0xb9b0a0,-.068,2);
  ribbon(sim([[0,159],[0,ROAD_Z+1]]),19,-.045,asph);ribbon(sim([[0,159],[0,240]]),.24,-.03,lineY);for(const o of [9.3,-9.3])ribbon(sim([[o,159],[o,240]]),.16,-.03,lineW);
  // near things cast shadows, far ones do not: two builders behind one interface, chosen by where a piece is placed
  const NB=new Builder(),FB=new Builder(),nearT=(x,z)=>{const [sx,sz]=toSim(x,z);return Math.hypot(sx,sz-90)<470?NB:FB;},
    B={box:(...a)=>nearT(a[4],a[6]).box(...a),cyl:(...a)=>nearT(a[3],a[5]).cyl(...a),add:(...a)=>nearT(a[2]||0,a[4]||0).add(...a),beam:(m,t,a,b)=>nearT(a.x,a.z).beam(m,t,a,b)};
  const steel=M_(0x6f6a6c,{roughness:.6}),lamp=M_(0xfff0c8,{emissive:0xffc978,emissiveIntensity:1}),conc=M_(0xa9a297),dark=M_(0x2a2629),white=M_(0xf3f1ec),cream=M_(0xece6da),glass=M_(0x1f3640,{roughness:.2,metalness:.2}),yel=M_(0xe3a81c,{roughness:.55});
  // street lamps down the median of Yết Kiêu
  for(let i=4;i<yk.length-4;i+=6){const [x,z]=yk[i];if(x>1960||x<-1100)continue;const a=yk[i-1],b=yk[i+1],ry=Math.atan2(-(b[1]-a[1]),b[0]-a[0]);
    B.cyl(steel,.16,9.5,x,4.75,z,0,0,0,6,.1);B.box(steel,.12,.12,5.6,x,9.4,z,0,ry,0);
    for(const s of [-1,1]){const lx=x+Math.sin(ry)*s*2.6,lz=z+Math.cos(ry)*s*2.6;B.box(lamp,.5,.12,1,lx,9.3,lz,0,ry,0);LAMPS.push([lx,9.2,lz,1,0xffd9a0]);}}
  // the ridge: one faceted mesh, forest green
  {const X0=-1700,Z0=150,ST=18,NX=252,NZ=88,pos=[],cl=[],H=[],c1=col(0x2f5a34),c2=col(0x47793f),c3=col(0x6d8a45),cc=new T.Color();
    for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++)H.push(terrainH(X0+i*ST,Z0+j*ST));
    const vtx=(i,j)=>{const x=X0+i*ST,z=Z0+j*ST,h=H[j*(NX+1)+i];pos.push(x,h>.3?h:-.5,z);const n=fbm(x*.02,z*.02);cc.copy(c1).lerp(c2,n).lerp(c3,sstep(.66,.95,fbm(x*.006+3,z*.006))*.4).multiplyScalar(.8+.24*hash2(i,j));cl.push(cc.r,cc.g,cc.b);};
    for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const k=j*(NX+1)+i;if(H[k]+H[k+1]+H[k+NX+1]+H[k+NX+2]<=0)continue;vtx(i,j);vtx(i,j+1);vtx(i+1,j);vtx(i+1,j);vtx(i,j+1);vtx(i+1,j+1);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(cl,3));g.computeVertexNormals();
    geo.add(new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true})));}

  // ---- the sites read off the imagery ----
  const ROOF={red:0xb5482f,orange:0xcf6a3e,rust:0x8a4c3a,dark:0x4b4d53,white:0xdde0df,lgrey:0xbdbfbd,grey:0x8f8f8c,teal:0x86c2b2,lgreen:0xb5d8c6,blue:0x3d6cb3,tan:0xcbbd9a,stripe:0xa67f6b,salmon:0xe0a388,bullets:0xe9ebe8,fdock:0x8a4c3a},
    WALL={cream:0xe9e2d2,white:0xdedcd5,grey:0xb9b6ae,lgreen:0xbcd3c8,rust:0x8a5a48,dark:0x3a3b40,teal:0x6fa89a};
  const at=(x,z,r,lx,lz)=>[x+lx*Math.cos(r)+lz*Math.sin(r),z-lx*Math.sin(r)+lz*Math.cos(r)];
  const foot=[];   // footprints of everything solid, so trees and scatter keep off them
  const rect=(x1,z1,x2,z2,w)=>{const dx=x2-x1,dz=z2-z1,l=Math.hypot(dx,dz)||1;return {x:(x1+x2)/2,z:(z1+z2)/2,l,w,r:Math.atan2(-dz,dx),ux:dx/l,uz:dz/l};};
  const inFoot=(x,z,m=0)=>{for(const f of foot){const dx=x-f.x,dz=z-f.z;if(Math.abs(dx*f.ux+dz*f.uz)<f.l/2+m&&Math.abs(-dx*f.uz+dz*f.ux)<f.w/2+m)return true;}return false;};
  const y0=(x,z)=>terrainH(x,z);
  // a building with a pitched roof; wide spans get several ridges side by side, as the big halls have
  const prism=(len,d)=>{const s=new T.Shape();s.moveTo(-d/2-.5,0);s.lineTo(d/2+.5,0);s.lineTo(0,d*.19);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:len+1,bevelEnabled:false});g.translate(0,0,-(len+1)/2);g.rotateY(Math.PI/2);return g;};
  const plinth=M_(0x8f8b84,{roughness:.95}),door=M_(0x5b6268,{roughness:.6});
  const shed=(x,z,w,d,h,rot,wall,rf,y=0)=>{B.box(M_(wall),w,h,d,x,y+h/2,z,0,rot,0);B.box(plinth,w+.16,.9,d+.16,x,y+.45,z,0,rot,0);B.box(M_(rf,{roughness:.7}),w+.5,.4,d+.5,x,y+h-.1,z,0,rot,0);
    if(wall===WALL.cream&&w>9)for(let f=0;f<Math.max(1,Math.round(h/3.6));f++)B.box(glass,w*.84,1.05,d+.1,x,y+2+f*3.4,z,0,rot,0);   // offices and barracks: a band of windows per floor
    else if(h>=8&&w>28)for(const e of [-1,1])for(let t=-d/2+9;t<=d/2-9;t+=Math.max(14,d/3)){const [px,pz]=at(x,z,rot,e*(w/2+.06),t);B.box(door,.12,Math.min(6,h*.6),5.5,px,y+Math.min(6,h*.6)/2,pz,0,rot,0);}
    const k=Math.max(1,Math.round(d/30));for(let i=0;i<k;i++){const [px,pz]=at(x,z,rot,0,(i-(k-1)/2)*d/k);B.add(M_(rf,{roughness:.7}),prism(w,d/k),px,y+h,pz,0,rot,0);}};
  for(const [x1,z1,x2,z2,w,h,rf,wl] of SITES.shed){const f=rect(x1,z1,x2,z2,w);if(inTerm(f.x,f.z,3))continue;foot.push(f);shed(f.x,f.z,f.l,w,h,f.r,WALL[wl]||WALL.cream,ROOF[rf]||ROOF.grey,y0(f.x,f.z));
    if(hrand()<.4)LAMPS.push([f.x,y0(f.x,f.z)+h+w*.1+1.5,f.z,h>12?1:0,0xffd9a0]);}
  for(const [x1,z1,x2,z2,w,h,rf,wl] of SITES.flat){const f=rect(x1,z1,x2,z2,w);if(inTerm(f.x,f.z,3))continue;foot.push(f);const y=y0(f.x,f.z);
    if(rf==='bullets'){   // a rack of horizontal LPG tanks on saddles
      B.box(conc,f.l,.3,w,f.x,y+.15,f.z,0,f.r,0);const n=Math.max(2,Math.round(f.l/6.4));for(let i=0;i<n;i++){const [px,pz]=at(f.x,f.z,f.r,(i-(n-1)/2)*f.l/n,0);B.cyl(white,1.55,w-3,px,y+2.5,pz,0,f.r+Math.PI/2,Math.PI/2,12);
        for(const s of [-1,1]){const [qx,qz]=at(px,pz,f.r,0,s*(w/2-1.5));B.add(white,new T.SphereGeometry(1.55,10,6),qx,y+2.5,qz);const [sx,sz]=at(px,pz,f.r,0,s*w*.28);B.box(conc,1,1.6,2.6,sx,y+.8,sz,0,f.r,0);}}}
    else if(rf==='fdock'){   // floating dock: pontoon deck between two wing walls
      const m=M_(0x7a4a3c,{roughness:.8});B.box(m,f.l,3,w,f.x,WY-.2,f.z,0,f.r,0);for(const s of [-1,1]){const [px,pz]=at(f.x,f.z,f.r,0,s*(w/2-2));B.box(m,f.l,9,4,px,WY+5.6,pz,0,f.r,0);B.box(M_(0xd0c8b8),f.l*.2,2.4,3.4,px,WY+11.2,pz,0,f.r,0);}}
    else{B.box(M_(WALL[wl]||WALL.white),f.l,h,w,f.x,y+h/2,f.z,0,f.r,0);B.box(M_(ROOF[rf]||ROOF.grey),f.l+.4,.35,w+.4,f.x,y+h+.1,f.z,0,f.r,0);}}
  // storage tanks with shallow cone roofs; LPG spheres on legs
  for(const [x,z,r,h,c] of SITES.tank){const m=M_(ROOF[c]||ROOF.white,{roughness:.55}),y=y0(x,z);foot.push({x,z,l:2*r,w:2*r,r:0,ux:1,uz:0});B.cyl(m,r,h,x,y+h/2,z,0,0,0,24);B.cyl(m,r,r*.14,x,y+h+r*.07,z,0,0,0,24,.4);B.cyl(steel,r+.12,.25,x,y+h-.2,z,0,0,0,24);
    B.box(steel,.9,h,.5,x+r+.3,y+h/2,z);}
  for(const [x,z,r,c] of SITES.sphere){const m=M_(ROOF[c]||ROOF.white,{roughness:.4});foot.push({x,z,l:2*r+4,w:2*r+4,r:0,ux:1,uz:0});B.add(m,new T.SphereGeometry(r,22,14),x,r+2.6,z);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;B.cyl(steel,.28,r+2.6,x+Math.cos(a)*r*.86,(r+2.6)/2,z+Math.sin(a)*r*.86,0,0,0,6);}B.cyl(steel,1.4,.3,x,2*r+2.7,z,0,0,0,10);B.box(steel,.8,2*r+2.6,.5,x+r*.9+.6,r+1.3,z);LAMPS.push([x,2*r+4,z,1,0xff5040]);}
  // walls and gatehouses
  {const wm=M_(0xd9d2c0,{roughness:.9}),run=W=>{for(let i=0;i+3<W.length;i+=2){const dx=W[i+2]-W[i],dz=W[i+3]-W[i+1],l=Math.hypot(dx,dz);if(inTerm((W[i]+W[i+2])/2,(W[i+1]+W[i+3])/2,2))continue;B.box(wm,l+.4,2.6,.45,(W[i]+W[i+2])/2,1.3,(W[i+1]+W[i+3])/2,0,Math.atan2(-dz,dx),0);}};
    run(MAP.wall);for(const w of SITES.wall)run(w);
    for(const [x,z] of MAP.gate){if(inTerm(x,z,6))continue;B.box(cream,3.4,2.9,3,x+3.6,1.45,z+2.4);B.box(M_(0xa93c16),4,.25,3.6,x+3.6,3,z+2.4);B.box(M_(0xd0281f),.14,.14,5.6,x,1.05,z);B.box(M_(0xe9a815),.4,1.1,.4,x,.55,z+2.9);}
    const [lx,lz]=MAP.light;B.cyl(white,2.3,15,lx,7.5,lz,0,0,0,12,1.6);B.cyl(M_(0xc8402e),1.9,2.4,lx,16.2,lz,0,0,0,12);B.cyl(dark,.3,1.6,lx,18.2,lz,0,0,0,6);LAMPS.push([lx,16.4,lz,2,0xfff3d6]);}
  // piers and jetties: the mapped outlines, then the decks read off the imagery
  for(const o of MAP.pier){const g=new T.ExtrudeGeometry(shapeOf(pairs(o)),{depth:1.7,bevelEnabled:false});g.rotateX(-Math.PI/2);FB.add(conc,g,0,-1.75,0);
    for(let i=0;i<o.length;i+=4)FB.cyl(dark,.6,4,o[i],-3.6,o[i+1],0,0,0,8);}
  for(const [w,kind,...p] of SITES.pier){const m=kind==='slip'?M_(0x7d5a48,{roughness:.9}):kind==='caisson'?M_(0x8f8a80,{roughness:.95}):conc;
    for(let i=0;i+3<p.length;i+=2){const f=rect(p[i],p[i+1],p[i+2],p[i+3],w);
      if(kind==='caisson'){const n=Math.max(1,Math.round(f.l/26));for(let k=0;k<n;k++){const [px,pz]=at(f.x,f.z,f.r,(k-(n-1)/2)*f.l/n,0);B.box(m,f.l/n-4,3.6,w,px,-1.7,pz,0,f.r,0);B.box(M_(0x77736b,{roughness:1}),f.l/n-9,.2,w-6,px,.12,pz,0,f.r,0);}B.box(m,f.l,1,w*.3,f.x,-.6,f.z,0,f.r,0);}
      else{B.box(m,f.l+w*.5,1.6,w,f.x,-.92,f.z,0,f.r,kind==='slip'?.02:0);for(let t=-f.l/2+3;t<f.l/2;t+=12)for(const s of [-1,1]){const [px,pz]=at(f.x,f.z,f.r,t,s*(w/2-.7));B.cyl(dark,.45,4,px,-3.6,pz,0,0,0,6);}}}}
  // rock mounds: the long breakwater west of Nại Hiên Đông, the Tiên Sa breakwater with its causeway, and the mole that shelters the fishing harbour
  {const rock=new T.MeshStandardMaterial({color:col(0x8d857a),roughness:1,flatShading:true}),pos=[];
    const mound=(line,top,foot,y)=>{ribbon(line,top,y,rock);for(let i=0;i<line.length-1;i++){const p=line[i],q=line[i+1],tx=q[0]-p[0],tz=q[1]-p[1],l=Math.hypot(tx,tz)||1,nx=-tz/l,nz=tx/l;for(const s of [-1,1]){const a=[p[0]+nx*s*top/2,y,p[1]+nz*s*top/2],b=[q[0]+nx*s*top/2,y,q[1]+nz*s*top/2],c=[p[0]+nx*s*foot/2,-3.4,p[1]+nz*s*foot/2],d=[q[0]+nx*s*foot/2,-3.4,q[1]+nz*s*foot/2];pos.push(...a,...c,...b,...b,...c,...d,...b,...c,...a,...d,...c,...b);}}};
    mound(smoothLine([[1876,-532],[1639,-642],[1402,-1358],[1165,-2075],[1125,-2153]],30),7,26,1.3);
    for(const [w,...p] of SITES.mound)mound(pairs(p),w*.55,w+16,2.6);
    for(const [w,...p] of SITES.cause){mound(pairs(p),w,w+9,.9);ribbon(pairs(p),w-1,.94,concT);}
    for(const h of MAP.hw)if(h[0]==='K'&&h[1]<0&&h[2]<-500){const s=smoothLine(pairs(h,1),10);mound(s,11,30,.9);ribbon(s,3.4,.93,earth);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();geo.add(new T.Mesh(g,rock));
    B.cyl(white,1.4,9,1124,5.5,-2153,0,0,0,10,1);B.cyl(M_(0xc8402e),1.5,2,1124,10.5,-2153,0,0,0,10);LAMPS.push([1124,12,-2153,2,0xff5040],[1877,3,-532,1,0x4be37a],[3061,3.4,653,1,0x4be37a]);
    B.cyl(M_(0x2d8659),.9,5,3058,2.4,653,0,0,0,8,.6);}

  // ---- afloat ----
  const deckBox=[];   // container stacks standing on a ship's deck, turned into boxes once the yard code below is set up
  const hullShape=(L,W)=>{const s=new T.Shape();s.moveTo(-L/2,-W/2);s.lineTo(L*.22,-W/2);s.quadraticCurveTo(L*.42,-W*.45,L/2,0);s.quadraticCurveTo(L*.42,W*.45,L*.22,W/2);s.lineTo(-L/2,W/2);s.quadraticCurveTo(-L*.53,0,-L/2,-W/2);return s;};
  const hull=(x,z,L,W,r,free,hex,y=WY)=>{const g=new T.ExtrudeGeometry(hullShape(L,W),{depth:free+2.6,bevelEnabled:false,curveSegments:L>30?5:3});g.rotateX(Math.PI/2);B.add(M_(hex,{roughness:.6}),g,x,y+free,z,0,r,0);};
  // a moored ship: hull, deckhouse aft, mast; cargo 1 stacks boxes on deck, 2 lays hatch covers
  const ship=(x,z,L,W,r,hex,house,cargo)=>{const f=L*.045+1.6;hull(x,z,L,W,r,f,hex);const y=WY+f;
    const g=new T.ShapeGeometry(hullShape(L*.985,W*.9),4);g.rotateX(-Math.PI/2);B.add(M_(cargo?0x7a4a3c:0x7f858b,{roughness:.9}),g,x,y+.04,z,0,r,0);
    let [px,pz]=at(x,z,r,-L*.33,0);B.box(M_(house),L*.16,L*.07+3,W*.8,px,y+(L*.07+3)/2,pz,0,r,0);B.box(glass,L*.1,1.2,W*.84,px+0,y+L*.07+3.4,pz,0,r,0);B.box(M_(house),L*.11,1.2,W*.86,px,y+L*.07+4.6,pz,0,r,0);
    [px,pz]=at(x,z,r,-L*.3,0);B.cyl(steel,.25,L*.1,px,y+L*.07+5+L*.05,pz,0,0,0,6);LAMPS.push([px,y+L*.17+5,pz,0,0xffe9c4]);
    if(cargo===1){const nb=Math.max(4,Math.floor(L*.6/13.2)),nr=Math.max(3,Math.floor(W*.84/2.6));for(let i=0;i<nb;i++){const top=2+Math.floor(hrand()*4);for(let c=0;c<nr;c++){const [qx,qz]=at(x,z,r,-L*.2+(i+.5)*L*.6/nb,(c-(nr-1)/2)*2.6);deckBox.push(qx,qz,r,Math.max(1,top-(hrand()<.3?1:0)),y+.1);}}}
    else if(cargo===2)for(let i=0;i<3;i++){const [qx,qz]=at(x,z,r,-L*.12+i*L*.17,0);B.box(M_(0x5d6a70),L*.13,1.1,W*.6,qx,y+.55,qz,0,r,0);}
    else{const [qx,qz]=at(x,z,r,L*.2,0),[mx,mz]=at(x,z,r,-L*.12,0);B.box(M_(house),L*.07,2.2,W*.36,qx,y+1.1,qz,0,r,0);B.cyl(steel,.2,L*.16,mx,y+L*.08,mz,0,0,0,6);}};
  // wooden fishing boat of the Thọ Quang fleet: blue hull, red rail, cabin aft
  const boat=(x,z,r,L=hr(14,20),hex)=>{const W=L*.27;hull(x,z,L,W,r,1.5,hex||hpick([0x2f6fae,0x2a64a0,0x3b82b8,0x2c7f8f]));
    const g=new T.ExtrudeGeometry(hullShape(L*.93,W*.8),{depth:.2,bevelEnabled:false,curveSegments:3});g.rotateX(Math.PI/2);B.add(M_(0xa9855c),g,x,WY+1.56,z,0,r,0);const [fx,fz]=at(x,z,r,L*.36,0);B.box(M_(0xb8322a),L*.12,.5,W*.5,fx,WY+1.8,fz,0,r,0);
    const [cx,cz]=at(x,z,r,-L*.22,0);B.box(M_(hpick([0xe8e4d8,0xd9d2c0,0x9fc0d8])),L*.27,2.3,W*.62,cx,WY+2.7,cz,0,r,0);B.box(M_(0x2a64a0),L*.31,.16,W*.7,cx,WY+3.9,cz,0,r,0);
    const [mx,mz]=at(x,z,r,L*.08,0);B.cyl(M_(0x6b4a36),.09,5.2,mx,WY+4.2,mz,0,0,0,5);if(hrand()<.4)LAMPS.push([mx,WY+6.6,mz,0,hpick([0xffe9c4,0x9fe0ff,0x7dffb0])]);};
  const HULLC={grey:0x8a9198,white:0xe6e8ea,rust:0x7a3026,green:0x3f7a55,blue:0x2f6fae};
  for(const [x1,z1,x2,z2,w,kind,c] of SITES.vessel){const f=rect(x1,z1,x2,z2,w),hc=HULLC[c]||HULLC.grey;if(inTerm(f.x,f.z,20))continue;
    if(kind==='navy'||kind==='frigate'||kind==='patrol'||kind==='cutter')ship(f.x,f.z,f.l,w,f.r,hc,kind==='cutter'?0xf1efe9:0x9aa1a8,0);
    else if(kind==='container')ship(f.x,f.z,f.l,w,f.r,hc,0xf1efe9,1);
    else if(kind==='cargo'||kind==='coaster'||kind==='trawler')ship(f.x,f.z,f.l,w,f.r,hc,0xf1efe9,2);
    else if(kind==='tug')ship(f.x,f.z,f.l,w,f.r,0x18202c,0xf1efe9,0);
    else if(kind==='barge'){B.box(M_(hc,{roughness:.8}),f.l,2.6,w,f.x,WY+.5,f.z,0,f.r,0);B.box(M_(0x5d5a58),f.l-2,.2,w-2,f.x,WY+1.9,f.z,0,f.r,0);}
    else if(kind==='fdock'){const m=M_(0x7a4a3c,{roughness:.8});B.box(m,f.l,3,w,f.x,WY-.2,f.z,0,f.r,0);for(const s of [-1,1]){const [px,pz]=at(f.x,f.z,f.r,0,s*(w/2-2));B.box(m,f.l,9,4,px,WY+5.6,pz,0,f.r,0);}hull(f.x,f.z,f.l*.8,w*.5,f.r,5,0x8a9198,WY+1.5);}
    else if(kind==='hull'){hull(f.x,f.z,f.l,w,f.r,3.4,hc,1.2);for(const t of [-.3,0,.3]){const [px,pz]=at(f.x,f.z,f.r,f.l*t,0);B.box(conc,1.2,1.2,w*.8,px,.6,pz,0,f.r,0);}}
    else boat(f.x,f.z,f.r,f.l,HULLC[c]);}
  // the rafted fishing fleet: tiers of boats lying side by side, bows the same way
  const raft=(cx,cz,n)=>{const r0=hr(0,6.3),per=Math.ceil(Math.sqrt(n*3.4)),nt=Math.ceil(n/per);let k=0;for(let j=0;k<n&&j<nt;j++)for(let i=0;k<n&&i<per;i++){const [x,z]=at(cx,cz,r0,(j-(nt-1)/2)*19+hr(-2,2),(i-(per-1)/2)*5.6+hr(-.5,.5));if(inLand(x,z)||coastDist(x,z)<5||hrand()<.12){k++;continue;}boat(x,z,r0+hr(-.07,.07)+(hrand()<.2?Math.PI:0));k++;}};

  // ---- yards: stacked containers, drawn with the terminal's own box and livery ----
  const CONT=[],CCOL=[0x1f5f8f,0xa83a26,0xd19a1f,0x24365a,0x7a2c2c,0x2f6b4f,0x9a9d9f,0xc9ccca,0x2f7f86,0xb5522c,0xe8e4d8,0x3d6cb3];
  const stackAt=(x,z,r,t,base)=>{const b=base===undefined?y0(x,z):base;for(let i=0;i<t;i++)CONT.push(x,i*CH+b,z,r,hpick(CCOL));};
  for(let i=0;i<deckBox.length;i+=5)stackAt(deckBox[i],deckBox[i+1],deckBox[i+2],deckBox[i+3],deckBox[i+4]);
  for(const [x1,z1,x2,z2,w,t] of SITES.stack){const f=rect(x1,z1,x2,z2,w);if(inTerm(f.x,f.z,8))continue;foot.push(f);const nb=Math.max(1,Math.floor((f.l+.4)/(CL+.4))),nc=Math.max(1,Math.floor(w/2.6));
    for(let b=0;b<nb;b++){const top=1+Math.floor(hrand()*t);for(let c=0;c<nc;c++){if(hrand()<.1)continue;const [px,pz]=at(f.x,f.z,f.r,(b-(nb-1)/2)*(CL+.4),(c-(nc-1)/2)*2.6);stackAt(px,pz,f.r,Math.max(1,top-(hrand()<.3?1:0)));}}}
  // Tiên Sa: rows in the port's own grid, kept inside its mapped outline and clear of the quays, roads and sheds
  {const ts=SITES.ts,[dx,dz]=ts.dir,[nx,nz]=ts.nrm,rr=Math.atan2(-dz,dx),P=(n,d)=>[n*nx+d*dx,n*nz+d*dz],port=AREAS[0].p,ok=(x,z,m)=>inPoly(port,x,z)&&coastDist(x,z)>m&&!nearRoad(x,z,8)&&!inFoot(x,z,7);
    for(const f of ts.rows)for(let k=0;k<f.k;k++){const n=f.n0+k*f.pitch;let rtg=hrand()<.7;
      if(f.across){for(let d=f.d0;d<f.d1;d+=2.6){if(Math.floor((d-f.d0)/2.6)%16>13)continue;const [x,z]=P(n,d);if(!ok(x,z,30)||hrand()<.12)continue;stackAt(x,z,rr+Math.PI/2,1+Math.floor(hrand()*f.tiers));}continue;}
      for(let d=f.d0;d+CL<f.d1;d+=CL+.4){if(f.cut&&d+CL>f.cut[0]+f.cut[1]*(n-f.cut[2]))break;const [cx,cz]=P(n,d+CL/2);if(!ok(cx,cz,26)){continue;}
        if(rtg&&hrand()<.12){rtg=false;const g=yel;for(const s of [-1,1])for(const e of [-1,1]){const [px,pz]=P(n+s*11.6,d+CL/2+e*5.5);B.box(g,.9,18,.9,px,9,pz,0,rr,0);}
          for(const e of [-1,1]){const [px,pz]=P(n,d+CL/2+e*5.5);B.box(g,1.1,1.5,24.2,px,18.4,pz,0,rr,0);}const [hx,hz]=P(n+4,d+CL/2);B.box(white,3,2.4,3,hx,16.4,hz,0,rr,0);LAMPS.push([cx,19.6,cz,0,0xffe9c4]);}
        if(hrand()<.09)continue;const top=1+Math.floor(hrand()*f.tiers);for(let c=0;c<6;c++){if(hrand()<.07)continue;const [x,z]=P(n+(c-2.5)*2.6,d+CL/2);stackAt(x,z,rr,Math.max(1,top-(hrand()<.35?1:0)));}}}
    for(let i=0,k=0;i<400&&k<16;i++){const [x,z]=P(hr(-1330,-830),hr(1850,2580));if(ok(x,z,30)&&nearRoad(x,z,13)){k++;B.cyl(steel,.3,30,x,15,z,0,0,0,6,.16);B.box(lamp,2.4,.4,2.4,x,30,z);LAMPS.push([x,30.4,z,2,0xffe9c4]);}}}
  // ship-to-shore cranes: portal on the quay, boom out over the water
  for(const [x,z,bx,bz] of SITES.sts){const r=Math.atan2(-(bx-x),-(bz-z)),P=(lx,lz)=>at(x,z,r,lx,lz);   // local z runs towards the land
    for(const lx of [-9,9])for(const lz of [-8,10]){const [px,pz]=P(lx,lz);B.box(yel,1.6,40,1.6,px,20,pz,0,r,0);}
    for(const lz of [-8,10]){const [px,pz]=P(0,lz);B.box(yel,19.6,1.8,1.6,px,39.4,pz,0,r,0);}for(const lx of [-9,9]){const [px,pz]=P(lx,1);B.box(yel,1.2,1.4,18,px,12,pz,0,r,0);}
    let [px,pz]=P(0,-22);B.box(yel,5,2.4,78,px,42,pz,0,r,0);[px,pz]=P(0,6);B.box(yel,2.2,15,2.2,px,50.5,pz,0,r,0);[px,pz]=P(0,14);B.box(white,8,4.4,7,px,45,pz,0,r,0);
    const top=P(0,6),tip=P(0,-56),back=P(0,17);B.beam(yel,.8,V(top[0],57.5,top[1]),V(tip[0],43.4,tip[1]));B.beam(yel,.8,V(top[0],57.5,top[1]),V(back[0],43.4,back[1]));LAMPS.push([x,44,z,2,0xffe9c4]);}
  // shipyard goliaths
  for(const [x1,z1,x2,z2] of SITES.goliath){const f=rect(x1,z1,x2,z2,10),g=M_(0xe3c21c,{roughness:.55});for(const s of [-1,1])for(const e of [-1,1]){const [px,pz]=at(f.x,f.z,f.r,s*f.l/2,e*5);B.beam(g,1.4,V(px,0,pz),V(...(q=>[q[0],30,q[1]])(at(f.x,f.z,f.r,s*f.l/2,0))));}
    B.box(g,f.l+6,3.2,3,f.x,31,f.z,0,f.r,0);const [tx,tz]=at(f.x,f.z,f.r,f.l*.15,0);B.box(white,4,3,4.4,tx,28,tz,0,f.r,0);LAMPS.push([f.x,34,f.z,2,0xffe9c4]);}
  // odds and ends
  for(const [kind,x,z,a] of SITES.misc){if(inTerm(x,z,6))continue;const y=y0(x,z);
    if(kind==='fleet')raft(x,z,a);
    else if(kind==='roundabout'){B.cyl(M_(0x7d9f5a,{roughness:1}),a,.35,x,y+.1,z,0,0,0,20);B.cyl(conc,a+.6,.25,x,y+.02,z,0,0,0,20);}
    else if(kind==='monument'){const r=a||12;B.cyl(M_(0xcfc7b4),r,.3,x,y+.1,z,0,0,0,24);B.cyl(M_(0x7d9f5a,{roughness:1}),r*.62,.4,x,y+.2,z,0,0,0,20);B.box(M_(0xb9b2a2),3.4,1.6,3.4,x,y+.9,z);B.cyl(M_(0x7c8088,{roughness:.5}),.5,6.5,x,y+4.2,z,.5,.6,0,8,.15);LAMPS.push([x,y+8,z,1,0xffe9c4]);}
    else if(kind==='steel'){const r0=hr(0,3.1),nr=Math.max(2,Math.round(a/4.2));   // laid-down plate and section in rows, all one way
      for(let i=0;i<nr;i++)for(let j=0;j<nr;j++){const [px,pz]=at(x,z,r0,(i-(nr-1)/2)*8.6+hr(-.5,.5),(j-(nr-1)/2)*4.2);if(hrand()<.3||inFoot(px,pz,2)||nearRoad(px,pz,5)||!inLand(px,pz)||inTerm(px,pz,3))continue;const h=hr(.5,2);B.box(M_(hpick([0x8a5a3c,0x7a4a38,0x6f7780,0x9b6a4f])),hr(5.5,7.8),h,hr(2.2,3.4),px,y+h/2,pz,0,r0,0);}}
    else if(kind==='blocks'){const n=Math.max(3,Math.round(a*a/160));for(let i=0;i<n;i++){const px=x+hr(-a,a),pz=z+hr(-a,a);if(inFoot(px,pz,5)||!inLand(px,pz))continue;const h=hr(5,9);B.box(M_(hpick([0x9a6a3c,0xb9902c,0x8a5a48,0x7a8088])),hr(8,14),h,hr(7,11),px,h/2+.8,pz,0,hr(0,3.1),0);B.box(conc,2,.8,8,px,.4,pz);}}
    else if(kind==='tarp'){const g=new T.SphereGeometry(1,14,8);g.scale(a*.8,a*.22,a*.62);B.add(M_(0x3a4a7a,{roughness:.9}),g,x,.1,z,0,hr(0,3),0);}
    else if(kind==='pile'){B.cyl(M_(0xd2c096,{roughness:1}),a,a*.45,x,a*.22,z,0,0,0,10,.5);}
    else if(kind==='pipes'){const n=Math.max(3,Math.round(a/3.4)),r0=hr(0,3);for(let i=0;i<n;i++){const [px,pz]=at(x,z,r0,0,(i-(n-1)/2)*3.3);B.cyl(M_(0xbfd0d6,{roughness:.5}),1.5,a*1.5,px,2,pz,0,r0,Math.PI/2,12);}}
    else if(kind==='mcrane'){const r0=hr(0,6.3);B.box(yel,7,3,6,x,2.4,z,0,r0,0);B.cyl(white,1.2,20,x,13,z,0,0,0,8);B.box(white,4,3,4,x,22,z,0,r0,0);const [tx,tz]=at(x,z,r0,26,0);B.beam(yel,1,V(x,23,z),V(tx,40,tz));LAMPS.push([tx,40.5,tz,1,0xffe9c4]);}
    else if(kind==='shiplift'){for(const s of [-1,1])for(let i=0;i<5;i++){const [px,pz]=at(x,z,.42,(i-2)*9,s*10);B.box(white,2.2,7,2.2,px,WY+3.5,pz,0,.42,0);}B.box(M_(0xd8d4c8),44,.8,17,x,WY+.6,z,0,.42,0);}
    else if(kind==='platform'){const r=a||16;for(let i=0;i<4;i++){const an=i*Math.PI/2+.5;B.box(M_(0xd9d6cc),r*1.5,.8,4,x+Math.cos(an)*r*.7,WY+.5,z+Math.sin(an)*r*.7,0,-an+Math.PI/2,0);}}}
  // road bridge on piers; a steel-grey deck with parapets
  const deckMat=M_(0xcfcac0,{roughness:.8}),pierMat=M_(0xb9b3a8);
  const span=(a,b,w,y)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),r=Math.atan2(-dz,dx),mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;B.box(deckMat,l+.5,1.5,w,mx,y-.75,mz,0,r,0);ribbon([a,b],w-1.8,y+.04,asph);ribbon([a,b],.18,y+.07,lineW,0);for(const s of [-1,1]){const [px,pz]=at(mx,mz,r,0,s*(w/2-.2));B.box(pierMat,l+.5,.9,.3,px,y+.45,pz,0,r,0);}
    for(let t=20;t<l-10;t+=42){const px=a[0]+dx*t/l,pz=a[1]+dz*t/l;if(inLand(px,pz)&&y<12)continue;B.box(pierMat,2.4,y-WY+2,w*.55,px,(y-1.5+WY-2)/2,pz,0,r,0);}
    for(let t=30;t<l;t+=60)LAMPS.push([a[0]+dx*t/l,y+7,a[1]+dz*t/l,0,0xffd9a0]);return [l,r,mx,mz];};
  span([-900,-620],[-837,-655],16,5);span([-837,-655],[-531,-807],16,11);span([-531,-807],[-58,-1070],16,9);span([-58,-1070],[60,-1140],16,5);
  // Thuận Phước suspension bridge over the river mouth
  {const A=[576,-1537],C=[1724,-2428],D=[1789,-2807],dy=27,w=18,yT=96,cab=M_(0xe2ddd2,{roughness:.6}),dx=C[0]-A[0],dz=C[1]-A[1],l=Math.hypot(dx,dz),ux=dx/l,uz=dz/l,r=Math.atan2(-dz,dx),P=t=>[A[0]+ux*t,A[1]+uz*t];
    span([470,-1455],A,w,14);span(A,C,w,dy);span(C,D,w,dy-6);const t1=l*.36,t2=l*.64,an=165;
    for(const t of [t1,t2]){const [tx,tz]=P(t);for(const s of [-1,1]){const [px,pz]=at(tx,tz,r,0,s*(w/2+1));B.box(cab,3.4,yT-WY+3,3,px,(yT+WY-3)/2,pz,0,r,0);}for(const y of [dy-4,dy+30,yT-3])B.box(cab,3,3.4,w+2,tx,y,tz,0,r,0);LAMPS.push([tx,yT+2,tz,2,0xffe9c4]);}
    for(const s of [-1,1]){const pt=(t,y)=>{const [x,z]=P(t),[px,pz]=at(x,z,r,0,s*(w/2+1));return V(px,y,pz);};
      for(let i=0;i<14;i++){const u0=i/14,u1=(i+1)/14,ya=dy+3+(yT-dy-3)*Math.pow(2*u0-1,2),yb=dy+3+(yT-dy-3)*Math.pow(2*u1-1,2);B.beam(cab,1,pt(t1+(t2-t1)*u0,ya),pt(t1+(t2-t1)*u1,yb));if(i%2===0)LAMPS.push([pt(t1+(t2-t1)*u0,ya).x,ya,pt(t1+(t2-t1)*u0,ya).z,0,0xffe2b0]);
        if(i>0&&i<14)B.beam(cab,.35,pt(t1+(t2-t1)*u0,ya),pt(t1+(t2-t1)*u0,dy));}
      B.beam(cab,1,pt(t1,yT),pt(t1-an,dy+1));B.beam(cab,1,pt(t2,yT),pt(t2+an,dy+1));}}
  // beyond the surveyed shore: the boats along the lock basin of Âu thuyền Thọ Quang, a few at anchor in Vũng Thùng
  for(let i=0;i<34;i++){const t=i/33,x=lerp(-700,-545,t)+hr(-6,6),z=lerp(-1100,-1960,t);for(let k=0;k<3;k++)if(hrand()<.82)boat(x+22+k*19,z+hr(-3,3),hr(-.12,.12));}
  for(let i=0;i<26;i++){const t=i/25,x=lerp(-95,-215,t),z=lerp(-1180,-1840,t);for(let k=0;k<2;k++)if(hrand()<.8)boat(x-26-k*19,z+hr(-3,3),Math.PI+hr(-.12,.12));}
  for(let i=0;i<16;i++){let x,z,n=0;do{x=hr(-520,250);z=hr(-800,-200);}while((inLand(x,z)||coastDist(x,z)<60)&&n++<30);if(n<=30)boat(x,z,hr(0,6.3));}
  // Nại Hiên Đông: the hotel tower on the point and the apartment blocks behind it
  {const gold=M_(0xc9a13c,{roughness:.35,metalness:.55,env:.8});B.box(M_(0xd9d2c4),86,14,60,966,7,-1719,0,-.6,0);B.box(gold,44,118,28,966,73,-1719,0,-.6,0);for(let y=22;y<128;y+=7)B.box(glass,44.4,1.8,28.4,966,y,-1719,0,-.6,0);B.box(gold,48,7,32,966,135.5,-1719,0,-.6,0);LAMPS.push([966,141,-1719,2,0xffd27a]);
    for(const [x,z,h] of [[57,-2430,62],[93,-2437,62],[23,-2424,62],[191,-2489,74],[143,-2453,74],[201,-2417,74],[1040,-1560,58],[860,-1840,66],[1728,-2702,96]]){B.box(M_(0xd9c0a6),30,h,22,x,h/2,z,0,-.3,0);for(let y=8;y<h-2;y+=6)B.box(glass,30.3,1.4,22.3,x,y,z,0,-.3,0);LAMPS.push([x,h+2,z,1,0xff5040]);}}
  // radar domes on the ridge
  for(const [x,z] of [[-320,1560],[620,1640]]){const h=terrainH(x,z);B.cyl(white,3,14,x,h+7,z,0,0,0,10);B.add(white,new T.SphereGeometry(9,14,10),x,h+19,z);LAMPS.push([x,h+30,z,1,0xff5040]);}

  // ---- the terminal's own edges, given in its frame ----
  const sbox=(m,sx,sy,sz,x,y,z,ry=0)=>{const [mx,mz]=toMap(x,z);NB.box(m,sx,sy,sz,mx,y,mz,0,ry-SITE.rot,0);},scyl=(m,r,h,x,y,z,seg=8,rt)=>{const [mx,mz]=toMap(x,z);NB.cyl(m,r,h,mx,y,mz,0,0,0,seg,rt);};
  sbox(conc,1.4,5,TERM_W,134.7,-2.5,TERM_W/2);sbox(conc,1.4,5,TERM_E,-134.7,-2.5,TERM_E/2);
  // tug berth at the head of the inlet west of the quay: pontoon, gangway, hut
  sbox(M_(0x5f6a72,{roughness:.7}),48,1.5,6,164,WY+.35,81.6);sbox(M_(0x2a2629),48.3,.5,6.3,164,WY+.9,81.6);for(let x=142;x<=186;x+=8)scyl(dark,.3,.7,x,WY+1.6,79.2,8,.4);
  {const [mx,mz]=toMap(184,87.2);NB.box(steel,2,.2,9,mx,-.75,mz,-.16,-SITE.rot,0);}
  sbox(cream,7,3.2,5,160,1.6,97);sbox(M_(0xa93c16),7.6,.3,5.6,160,3.35,97);scyl(steel,.14,8,172,4,92,6);sbox(lamp,.9,.2,.5,172,7.9,91.6);
  // channel buoys on the way in from the bay: red cans to port and green cones to starboard for a ship coming in
  const BUOYS=[[1015,-821,1],[1081,-697,0],[686,-623,1],[765,-506,0],[410,-425,1],[494,-313,0],[205,-275,1],[285,-160,0]];
  for(const [x,z,g] of BUOYS){const c=M_(g?0x2d8659:0xc8402e,{roughness:.5});scyl(c,1.25,2.4,x,WY+.9,z,10,.7);scyl(steel,.1,2.6,x,WY+3.3,z,6);g?scyl(c,.5,.9,x,WY+4.6,z,8,.02):scyl(c,.45,.8,x,WY+4.6,z,8);}
  geo.add(NB.build(),FB.build(false));
  // containers in the neighbours' yards
  {const n=CONT.length/5,im=new T.InstancedMesh(cGeo,CIM.material,n);for(let i=0;i<n;i++){_o.position.set(CONT[i*5],CONT[i*5+1],CONT[i*5+2]);_o.rotation.set(0,CONT[i*5+3],0);_o.scale.set(1,1,1);_o.updateMatrix();im.setMatrixAt(i,_o.matrix);im.setColorAt(i,col(CONT[i*5+4]).multiplyScalar(hr(.82,1.05)));}
    im.frustumCulled=false;im.receiveShadow=true;im.raycast=()=>{};geo.add(im);}
  // the built-up shores beyond the survey: Thọ Quang east of the road, Nại Hiên Đông and the city over the river, as instanced blocks; small houses where the imagery shows tight rows of them
  {const N=1250,im=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({roughness:.9}),N),pal2=[0xe2d6c4,0xd9c0a6,0xe9dfd0,0xc9ad94,0xd6c5b4,0xcfd3d0,0xc86a48,0xd9d2c8,0xb9c2c6];let k=0,guard=0;
    const put=(x,z,w,d,h,ry,lit)=>{_o.position.set(x,h/2,z);_o.rotation.set(0,ry,0);_o.scale.set(w,h,d);_o.updateMatrix();im.setMatrixAt(k,_o.matrix);im.setColorAt(k,col(hpick(pal2)));k++;if(hrand()<lit)LAMPS.push([x,h+1,z,h>40?1:0,0xffd9a0]);};
    for(const g of SITES.ground)if(g[0]==='houses'){const p=pairs(g,1);let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const [x,z] of p){x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);}
      for(let x=x0;x<x1;x+=9)for(let z=z0;z<z1;z+=11){const px=x+hr(-1.5,1.5),pz=z+hr(-1.5,1.5);if(k<N&&inPoly(p,px,pz)&&!nearRoad(px,pz,5))put(px,pz,hr(6,8),hr(7,10),hr(3.5,7),.5+hr(-.06,.06),.2);}}
    while(k<980&&guard++<20000){const x=hr(-2700,1560),z=hr(-2700,330);if(x>-1080&&z>-1000)continue;if(!inLand(x,z)||coastDist(x,z)<28||terrainH(x,z)>0||z>zRoad(x)-24&&x>-900)continue;
      const tall=hrand()<(x>540?.2:.07);put(x,z,hr(9,22),hr(8,16),tall?hr(16,46):hr(4,9),hr(-.2,.2)+(x>540?-.9:.4),.13);}
    guard=0;while(k<N&&guard++<9000){const x=hr(1300,3600),z=hr(-4700,-2200);if(!inPoly(CITY,x,z))continue;const t=hrand();put(x,z,hr(16,34),hr(14,28),t<.12?hr(70,150):t<.5?hr(24,60):hr(8,18),hr(0,.4),.35);}
    im.count=k;im.frustumCulled=false;im.receiveShadow=true;geo.add(im);}
  // trees: along the road, where the imagery shows them, and thick on the lower slopes
  {const flat=[],slope=[],free=(x,z,m=2)=>inLand(x,z)&&coastDist(x,z)>5&&!inTerm(x,z,4)&&!inFoot(x,z,m)&&!nearRoad(x,z,4.5);
    for(let i=3;i<yk.length-3;i+=3){const [x,z]=yk[i];if(x>1960||x<-1100)continue;const a=yk[i-1],b=yk[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])/l,nz=(b[0]-a[0])/l;for(const s of [-1,1]){const px=x+nx*s*15.5+hr(-1,1),pz=z+nz*s*15.5+hr(-1,1);if(free(px,pz)&&coastDist(px,pz)>8)flat.push([px,pz]);}}
    for(const [x,z,r] of SITES.trees){const n=Math.max(1,Math.round(r*r/16));for(let i=0;i<n;i++){const a=hr(0,6.3),d=r*Math.sqrt(hrand()),px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;if(free(px,pz))flat.push([px,pz]);}}
    for(const row of SITES.treeRow){const s=smoothLine(pairs(row),9);for(const [x,z] of s)if(free(x,z,1))flat.push([x+hr(-.6,.6),z+hr(-.6,.6)]);}
    let guard=0;while(slope.length<1700&&guard++<14000){const x=hr(-250,2000),z=zRoad(x)+hr(30,340),h=terrainH(x,z);if(h>1)slope.push([x,h,z]);}
    const tm=new T.MeshStandardMaterial({roughness:.9,flatShading:true}),crown=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),tm,flat.length),canopy=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),tm,slope.length),trunk=new T.InstancedMesh(new T.CylinderGeometry(.18,.26,1,6),M_(0x5f4636),flat.length),greens=[0x5f8a45,0x4f7f48,0x6f8f48,0x47744a,0x3f6e42];
    flat.forEach(([x,z],i)=>{const s=hr(.8,1.35),y=terrainH(x,z);_o.rotation.set(0,hr(0,6),0);_o.position.set(x,y+2*s,z);_o.scale.set(1,4*s,1);_o.updateMatrix();trunk.setMatrixAt(i,_o.matrix);_o.position.set(x,y+5.6*s,z);_o.scale.set(2.6*s,3.2*s,2.6*s);_o.updateMatrix();crown.setMatrixAt(i,_o.matrix);crown.setColorAt(i,col(hpick(greens)));});
    slope.forEach(([x,h,z],i)=>{const s=hr(1.2,2.3);_o.rotation.set(0,hr(0,6),0);_o.position.set(x,h+1.6*s,z);_o.scale.set(3.4*s,2.6*s,3.4*s);_o.updateMatrix();canopy.setMatrixAt(i,_o.matrix);canopy.setColorAt(i,col(hpick([0x3a6a38,0x325f36,0x447640,0x2e5a34])).multiplyScalar(hr(.8,1.05)));});
    for(const m of [crown,canopy,trunk]){m.frustumCulled=false;m.receiveShadow=true;geo.add(m);}}
  flushRibbons();
  // carry the lamps into the scene's frame, then add the ones that stand in the terminal
  for(let i=L0;i<LAMPS.length;i++){const l=LAMPS[i],[x,z]=toSim(l[0],l[2]);l[0]=x;l[2]=z;}
  for(const x of [-103,-8.5,8.5,103])for(const z of [52.5,78.5])LAMPS.push([x,28,z,2,0xffe9c4]);
  LAMPS.push([71,32.8,124,1,0xff5040],[-OFF,5.9,GATE_Z+15.6,0,0xffe2b0],[OFF,5.9,GATE_Z+15.6,0,0xffe2b0],[172,7.8,91.6,1,0xffe2b0],[147,WY+3.2,79,0,0xffe2b0],[181,WY+3.2,79,0,0xffe2b0]);for(const x of [-11,-3,3,11])LAMPS.push([x,5.8,GATE_Z,1,0xffe9c4]);
  for(const [x,z,g] of BUOYS)LAMPS.push([x,WY+5.2,z,0,g?0x4be37a:0xff5040]);
})();

/* ---------- tugs and ship handling ----------
   Two ASD harbour tugs lie stern-to at the pontoon in the inlet west of the quay. One ship moves in the basin at a time. Inbound, the tugs
   wait in the fairway and fall in as the ship passes: one on a line ahead of the bow, one alongside the quarter. Off the berth they
   swing her through 180° so she lies bow out, then push her bodily onto the fenders. Outbound they pull her off on two lines. */
const angDiff=(a,b)=>{let d=(a-b)%(2*Math.PI);if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;return d;};
const foamTex=(()=>{const c=document.createElement('canvas');c.width=64;c.height=128;const g=c.getContext('2d');g.fillStyle='#000';g.fillRect(0,0,64,128);
  for(let i=0;i<900;i++){const x=hrand()*64,e=Math.sin(Math.PI*x/64),a=Math.pow(e,1.6)*(.25+.75*hrand());g.fillStyle=`rgba(255,255,255,${(a*.5).toFixed(3)})`;g.fillRect(x,hrand()*128,1+hrand()*2.4,3+hrand()*12);}
  const t=new T.CanvasTexture(c);t.wrapT=T.RepeatWrapping;return t;})();
const wakeMat=new T.MeshBasicMaterial({map:foamTex,vertexColors:true,blending:T.AdditiveBlending,transparent:true,depthWrite:false,fog:false,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3});
// foam trail: a ribbon through the last few stern positions that widens and fades with age
class Wake{
  constructor(n,w0,w1,life){this.n=n;this.w0=w0;this.w1=w1;this.life=life;this.p=[];this.lx=1e9;this.lz=1e9;
    const g=new T.BufferGeometry();this.pos=new Float32Array(n*6);this.col=new Float32Array(n*6);this.uv=new Float32Array(n*4);this.d=0;g.setAttribute('position',new T.BufferAttribute(this.pos,3));g.setAttribute('color',new T.BufferAttribute(this.col,3));g.setAttribute('uv',new T.BufferAttribute(this.uv,2));
    const idx=[];for(let i=0;i<n-1;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3,a,a+1,a+2,a+2,a+1,a+3);}g.setIndex(idx);
    this.mesh=new T.Mesh(g,wakeMat);this.mesh.frustumCulled=false;this.mesh.raycast=()=>{};this.mesh.renderOrder=2;scene.add(this.mesh);}
  // lay a point when the stern has moved on; k is how hard the water is being worked
  feed(x,z,k,vx=0,vz=0,gap=5){if(Math.hypot(x-this.lx,z-this.lz)<gap&&!(vx||vz))return;this.d+=Math.min(12,Math.hypot(x-this.lx,z-this.lz));this.lx=x;this.lz=z;this.p.unshift({x,z,k,vx,vz,a:0,d:this.d});if(this.p.length>this.n)this.p.pop();}
  step(dt){for(const q of this.p){q.a+=dt;q.x+=q.vx*dt;q.z+=q.vz*dt;}while(this.p.length&&this.p[this.p.length-1].a>this.life)this.p.pop();}
  draw(){const P=this.p,n=this.n,L=P.length,f0=sky.foam;
    for(let i=0;i<n;i++){const q=P[Math.min(i,L-1)],o=i*6;if(!q||L<2){this.pos.fill(0,o,o+6);this.col.fill(0,o,o+6);continue;}
      const a=P[Math.max(0,Math.min(i,L-1)-1)],b=P[Math.min(L-1,Math.min(i,L-1)+1)];let tx=b.x-a.x,tz=b.z-a.z;const l=Math.hypot(tx,tz)||1;tx/=l;tz/=l;
      const u=q.a/this.life,w=lerp(this.w0,this.w1,u)/2,f=i<L?Math.pow(1-u,1.4)*q.k*f0*Math.min(1,q.a*3+.25):0;this.uv[i*4]=0;this.uv[i*4+2]=1;this.uv[i*4+1]=this.uv[i*4+3]=q.d/26;
      this.pos[o]=q.x-tz*w;this.pos[o+1]=WY+.07;this.pos[o+2]=q.z+tx*w;this.pos[o+3]=q.x+tz*w;this.pos[o+4]=WY+.07;this.pos[o+5]=q.z-tx*w;
      this.col[o]=this.col[o+1]=this.col[o+2]=this.col[o+3]=this.col[o+4]=this.col[o+5]=f;}
    this.mesh.geometry.attributes.position.needsUpdate=true;this.mesh.geometry.attributes.color.needsUpdate=true;this.mesh.geometry.attributes.uv.needsUpdate=true;}
}
const wakes=[];
function tugModel(name,accent){
  const B=new Builder(),D=new Builder(),hullM=VM(0x18202c,{roughness:.55}),rub=VM(0x0e0e10,{roughness:.96}),deck=VM(0x7a3f33,{roughness:.9}),white=VM(0xf1efe9,{roughness:.45}),grey=VM(0xb9bcc0,{roughness:.6}),steel=VM(0x4a4a51,{roughness:.5,metalness:.35}),
    acc=VM(accent,{roughness:.45}),glass=VM(0x0a1014,{roughness:.08,metalness:.55,env:.4}),dark=VM(0x1b191c,{roughness:.8}),lamp=VM(0xfff3d6,{emissive:0xffd9a0,emissiveIntensity:1.4}),orange=VM(0xf07a1c,{roughness:.6}),
    red=VM(0xc0221a,{emissive:0x8a120c,emissiveIntensity:.9}),green=VM(0x2bb24c,{emissive:0x1c8a3a,emissiveIntensity:.9}),mono=VM(0xc0281f,{roughness:.5});
  // plan outline: square quarters, full bow; s scales it, x0 cuts the stern off for the raised forecastle
  const plan=(s=1,x0=null)=>{const sh=new T.Shape(),w=4.6*s,a=x0===null?-13.6*s:x0;
    if(x0===null){sh.moveTo(a,-w+1.3);sh.quadraticCurveTo(a,-w,a+1.5,-w);}else sh.moveTo(a,-w);
    sh.lineTo(3.2,-w);sh.bezierCurveTo(8.8,-w,12.6*s,-w*.6,13.6*s,0);sh.bezierCurveTo(12.6*s,w*.6,8.8,w,3.2,w);
    if(x0===null){sh.lineTo(a+1.5,w);sh.quadraticCurveTo(a,w,a,w-1.3);}else sh.lineTo(a,w);sh.closePath();return sh;};
  const ext=(sh,depth,y,mat,to=B)=>{const g=new T.ExtrudeGeometry(sh,{depth,bevelEnabled:false,curveSegments:10});g.rotateX(Math.PI/2);to.add(mat,g,0,y,0);};
  const ring=(o,i)=>{o.holes.push(new T.Path(i.getPoints(10)));return o;};
  ext(plan(),3.7,1.5,hullM);ext(plan(1,2.6),.82,2.3,hullM);
  ext(ring(plan(),plan(.93)),.9,2.4,hullM);ext(ring(plan(1,2.6),plan(.93,3)),.95,3.25,hullM);
  ext(ring(plan(1.012),plan(.92)),.13,2.52,acc,D);ext(ring(plan(1.012,2.6),plan(.92,3.05)),.13,3.37,acc,D);
  ext(ring(plan(1.05),plan(.99)),.55,1.52,rub);
  {const g=new T.ShapeGeometry(plan(.93),10);g.rotateX(-Math.PI/2);B.add(deck,g,0,1.52,0);const g2=new T.ShapeGeometry(plan(.93,3),10);g2.rotateX(-Math.PI/2);B.add(deck,g2,0,2.32,0);}
  // bow fender, tyres down the sides and across the stern
  for(const p of plan(1.03).getPoints(26))if(p.x>9.6){D.cyl(rub,.52,1.7,p.x,2.1,p.y,0,0,0,10);D.cyl(rub,.46,1.2,p.x-.05,.75,p.y,0,0,0,10);}
  const tyre=(x,y,z,ry)=>D.add(rub,new T.TorusGeometry(.6,.23,7,14),x,y,z,0,ry,0);
  for(const x of [-10.4,-7,-3.6,-.2,3.2,6.4])for(const s of [-1,1])tyre(x,1.05,s*(x>5?4.62:4.9),0);for(const z of [-2.6,0,2.6])tyre(-13.9,1.05,z,Math.PI/2);
  // deckhouse, boat deck, wheelhouse with windows all round
  B.box(white,8.6,2.85,5.7,.3,2.95,0);B.box(grey,10,.16,6.7,.1,4.44,0);
  for(const s of [-1,1]){for(const x of [-2.8,-1.2,.4,2])D.cyl(glass,.28,.06,x,3.45,s*2.86,Math.PI/2,0,0,12);D.box(dark,.9,1.9,.05,3.6,2.9,s*2.86);D.box(dark,.05,1.9,.9,-4.01,2.9,s*1.4);}
  B.box(white,4.5,1.25,4.7,1.7,5.14,0);B.box(glass,4.56,1.1,4.76,1.7,6.3,0);B.box(white,5.1,.18,5.3,1.75,6.94,0);B.box(white,.5,.08,5.3,4.45,6.9,0,0,0,-.5);
  for(const z of [-2.38,2.38])for(const x of [-.52,.6,1.7,2.8,3.92])D.box(white,.1,1.12,.06,x,6.3,z);for(const x of [-.56,3.98])for(const z of [-1.2,0,1.2])D.box(white,.06,1.12,.1,x,6.3,z);
  // mast, radar, lights, monitor
  B.cyl(steel,.13,4.6,.7,9.3,0,0,0,0,8,.08);D.box(steel,.1,.1,2.8,.7,10,0);D.box(steel,1.3,.1,.1,1.2,8.6,0);D.box(white,2,.14,.24,1.9,7.75,0,0,.5,0);D.cyl(steel,.1,.7,1.9,7.35,0,0,0,0,6);
  D.add(white,new T.SphereGeometry(.36,10,8),.1,7.4,-1.7);D.cyl(steel,.03,2.6,-.2,8.3,1.8,0,0,0,4);D.cyl(steel,.03,2.2,-.2,8.1,1.3,0,0,0,4);
  D.box(lamp,.22,.22,.22,.7,11.5,0);D.box(lamp,.18,.18,.18,.86,10.4,0);D.box(red,.16,.26,.3,2.6,6.55,-2.72);D.box(green,.16,.26,.3,2.6,6.55,2.72);D.cyl(lamp,.26,.3,3.5,7.2,-1.5,0,0,Math.PI/2,10);D.cyl(steel,.06,.3,3.5,7.05,-1.5,0,0,0,6);
  D.cyl(mono,.16,.5,3.5,7.25,1.5,0,0,0,8);D.cyl(mono,.09,1.1,3.95,7.6,1.5,0,0,-1.1,8);
  // twin funnels in the company colour
  for(const s of [-1,1]){B.box(acc,1.3,2.6,1.5,-2.9,5.82,s*1.8);D.box(white,1.33,.42,1.53,-2.9,6.5,s*1.8);B.box(dark,1.34,.5,1.54,-2.9,7.36,s*1.8);D.cyl(steel,.2,.7,-3.1,7.9,s*1.8,0,0,.25,8);}
  // boat deck rail, rafts, lifebuoys
  {const x0=-4.75,x1=4.95,zz=3.22;for(const y of [4.95,5.42]){for(const s of [-1,1])D.box(steel,x1-x0,.05,.05,(x0+x1)/2,y,s*zz);D.box(steel,.05,.05,2*zz,x0,y,0);}
    for(let x=x0;x<=x1+.01;x+=1.214)for(const s of [-1,1])D.box(steel,.05,.95,.05,x,4.95,s*zz);for(let z=-zz+1.07;z<zz;z+=1.07)D.box(steel,.05,.95,.05,x0,4.95,z);
    for(const s of [-1,1]){D.cyl(white,.32,1.25,-4,4.9,s*2.5,0,0,Math.PI/2,10);D.add(orange,new T.TorusGeometry(.33,.08,6,12),-1.4,5.1,s*3.27);}}
  // fore deck: towing winch, bitts, staple
  B.cyl(steel,.78,2.3,7.2,3.25,0,Math.PI/2,0,0,16);for(const s of [-1,1]){B.box(acc,1.5,1.9,.28,7.2,3.25,s*1.3);}D.box(steel,1.2,1,1,7.1,2.85,2);D.cyl(dark,.82,2,7.2,3.25,0,Math.PI/2,0,0,14,.82);
  for(const s of [-1,1])D.cyl(steel,.2,1.15,11.2,2.9,s*.7,0,0,0,8);D.box(steel,.3,.24,1.9,11.2,3.5,0);for(const s of [-1,1]){D.cyl(steel,.22,.8,9.7,2.72,s*1.6,0,0,0,8);D.cyl(steel,.3,.08,9.7,3.14,s*1.6,0,0,0,8);}
  // aft deck: H-bitt and hook, winch, capstan, hatch, bollards
  for(const s of [-1,1])D.cyl(steel,.24,1.35,-5.5,2.2,s*.9,0,0,0,8);D.box(steel,.28,.26,2.5,-5.5,2.55,0);D.box(acc,.9,.5,.5,-6.1,2.3,0);
  D.cyl(steel,.55,1.5,-7.6,2.15,0,Math.PI/2,0,0,12);for(const s of [-1,1])D.box(acc,1,1.2,.2,-7.6,2.12,s*.85);D.cyl(steel,.36,.9,-10.9,1.97,0,0,0,0,10,.3);D.cyl(steel,.46,.1,-10.9,2.45,0,0,0,0,10);
  D.box(grey,1.7,.3,1.7,-9.2,1.67,2.3);D.box(grey,1.3,.3,1.3,-9.4,1.67,-2.4);for(const x of [-12.3,-1.2])for(const s of [-1,1]){D.cyl(steel,.2,.6,x,1.82,s*3.5,0,0,0,8);D.cyl(steel,.27,.07,x,2.14,s*3.5,0,0,0,8);}
  const g=finish(B,D);
  const nm=plate(name,3.4,.62,'#f1efe9');for(const s of [1,-1]){const p=s>0?nm:nm.clone();p.position.set(-8.3,1.98,s*4.63);p.rotation.y=s<0?Math.PI:0;g.add(p);}
  const n2=plate(name,2.2,.4,'#18202c');for(const s of [1,-1]){const p=s>0?n2:n2.clone();p.position.set(1.7,5.3,s*2.37);p.rotation.y=s<0?Math.PI:0;g.add(p);}
  g.add(glowPts([[.7,11.6,0,0xfff3d6],[.86,10.5,0,0xfff3d6],[2.6,6.55,-2.8,0xff3020],[2.6,6.55,2.8,0x30e060],[-13.4,2.9,0,0xfff3d6],[3.6,7.2,-1.5,0xfff3d6],[-4.6,5.6,0,0xffe2b0]],0));
  return g;
}
const stn=(v,lx,lz,hrel)=>{const c=Math.cos(v.rot),s=Math.sin(v.rot);return {x:v.x+lx*c+lz*s,z:v.z-lx*s+lz*c,h:v.rot+hrel};};
const TUG_K=.72;      // a 20 m tug beside a 115 m ship
const GATE_W=-40;   // tugs leave and enter the inlet on a line due south of their berth
const lineMat=new T.LineBasicMaterial({color:col(0xd8cfb8)});
class Tug{
  constructor(i,name,accent){this.kind='tug';this.id=name;this.name=name;this.home={x:153+21*i,z:68.4,h:Math.PI/2};this.x=this.home.x;this.z=this.home.z;this.h=this.home.h;this.v=0;this.spd=0;this.on=false;this.inside=true;
    this._tgt=null;this.status='Standing by';this.assist=null;this.fast=null;this.push=false;this.jobs=0;this.t=i*1.7;
    this.group=tugModel(name,accent);this.group.scale.setScalar(TUG_K);this.group.userData.ent=this;scene.add(this.group);this.wake=new Wake(26,3.8,11,7);wakes.push(this.wake);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(9),3));this.line=new T.Line(g,lineMat);this.line.frustumCulled=false;this.line.raycast=()=>{};this.line.visible=false;scene.add(this.line);
    ents.push(this);}
  get label(){return this.name;}
  get tgt(){return this._tgt;}
  set tgt(f){this._tgt=f;this.on=false;}   // a new station: not on it until the tug has actually got there
  center(v){return v.set(this.x,WY+10,this.z);}
  frame(){return {x:this.x,y:WY+3.7,z:this.z,rot:this.h,d:[22,9.6,8.6]};}
  step(dt){this.t+=dt;const px=this.x,pz=this.z,H=this.home;let T=this._tgt?this._tgt():null,own=!!T;
    // in and out of the inlet on the line of the berth: dead slow inside, free running once past its mouth
    if(this.z<GATE_W+4)this.inside=false;
    if(T){if(this.inside){T={x:H.x,z:GATE_W-6,h:H.h,dp:true,spd:7};own=false;}}
    else{if(this.inside||Math.hypot(this.x-H.x,this.z-GATE_W)<9){this.inside=true;T=Object.assign({dp:true,spd:5},H);}else T={x:H.x,z:GATE_W,h:H.h};
      if(Math.hypot(this.x-H.x,this.z-H.z)<.4&&this.status!=='Standing by'){this.status='Standing by';this.assist=null;}}
    const dx=T.x-this.x,dz=T.z-this.z,d=Math.hypot(dx,dz);
    if(T.dp||d<20){const st=Math.min(d,(T.spd||19)*dt);if(d>1e-4){this.x+=dx/d*st;this.z+=dz/d*st;}this.h+=clamp(angDiff(T.h,this.h),-1.5*dt,1.5*dt);this.on=own&&d<2.5&&Math.abs(angDiff(T.h,this.h))<.25;this.v=0;}
    else{const err=angDiff(Math.atan2(-dz,dx),this.h);this.h+=clamp(err,-1.2*dt,1.2*dt);const vt=Math.min(14,d*.5+4)*(Math.abs(err)>.9?.3:1);this.v+=clamp(vt-this.v,-7*dt,5*dt);this.x+=Math.cos(this.h)*this.v*dt;this.z-=Math.sin(this.h)*this.v*dt;this.on=false;}
    this.spd=lerp(this.spd,Math.hypot(this.x-px,this.z-pz)/Math.max(dt,1e-4),.3);
    const sx=this.x-Math.cos(this.h)*9.4,sz=this.z+Math.sin(this.h)*9.4;
    if(this.push)this.wake.feed(sx+hr(-1,1),sz+hr(-1,1),1,-Math.cos(this.h)*4.5,Math.sin(this.h)*4.5,2.2);else this.wake.feed(sx,sz,clamp(this.spd/9,0,1),0,0,3);}
  sync(){this.group.position.set(this.x,WY+Math.sin(this.t*1.3)*.07,this.z);this.group.rotation.set(Math.sin(this.t*.9)*.012,this.h,0);
    const f=this.fast;this.line.visible=!!f;if(f){const c=Math.cos(this.h),s=Math.sin(this.h),o=f.bow?8.1:-4,p=this.line.geometry.attributes.position,a=stn(f.v,f.lx,f.lz,0),ty=WY+(f.bow?2.45:1.95),sy=f.y||DECK+1.2;
      p.setXYZ(0,this.x+c*o,ty,this.z-s*o);p.setXYZ(1,(this.x+c*o+a.x)/2,(ty+sy)/2-1.4,(this.z-s*o+a.z)/2);p.setXYZ(2,a.x,sy,a.z);p.needsUpdate=true;}}
}
const tugs=[new Tug(0,'TL TUG 01',0xd4501d),new Tug(1,'TL TUG 02',0x1f6f8f)];
const port={busy:null};
const T_IN=110,T_OUT=80;   // seconds under way in the bay, inbound and outbound
const ARRIVE_S=6+T_IN+3+20+3+18;   // seconds from "tugs away" to all fast
function stepHarbour(dt){for(const t of tugs)t.step(dt);for(const w of wakes)w.step(dt);
  for(const b of berths){const v=b.vessel;if(v&&v.wake){const sp=Math.hypot(v.x-v.px,v.z-v.pz)/Math.max(dt,1e-4);v.px=v.x;v.pz=v.z;const s=stn(v,-55,0,0);v.wake.feed(s.x,s.z,clamp(sp/10,0,1),0,0,7);}}}
function syncHarbour(){for(const t of tugs)t.sync();for(const w of wakes)w.draw();}
const bezAt=(P,u,o)=>{const a=1-u,b0=a*a*a,b1=3*a*a*u,b2=3*a*u*u,b3=u*u*u;o.x=b0*P[0][0]+b1*P[1][0]+b2*P[2][0]+b3*P[3][0];o.z=b0*P[0][1]+b1*P[1][1]+b2*P[2][1]+b3*P[3][1];
  const tx=3*a*a*(P[1][0]-P[0][0])+6*a*u*(P[2][0]-P[1][0])+3*u*u*(P[3][0]-P[2][0]),tz=3*a*a*(P[1][1]-P[0][1])+6*a*u*(P[2][1]-P[1][1])+3*u*u*(P[3][1]-P[2][1]);o.rot=Math.atan2(-tz,tx);return o;};
// in from the bay: round the point of Tiên Sa, across Vũng Thùng, then parallel to the quay; the far end is fixed, the near end follows the berth
const inPath=cx=>[[2400,-980],[1150,-1250],[cx+300,-100],[cx,-100]],U_JOIN=.9;
// the tugs go out ahead of the ship and wait where they will fall in
function tugsAway(b,name){const hold=bezAt(inPath(b.cx),U_JOIN,{x:0,z:0,rot:0});hold.u=0;
  tugs[0].tgt=()=>stn(hold,86,0,0);tugs[1].tgt=()=>stn(hold,-40,-44,0);for(const t of tugs){t.status='Proceeding to meet '+name;t.assist=null;t.fast=null;t.push=false;}return hold;}
function* shipArrive(v,b){
  const cx=b.cx,P=inPath(cx),A=tugs[0],B=tugs[1],q={x:0,z:0,rot:0},hold=bezAt(P,U_JOIN,{x:0,z:0,rot:0});let t=0,made=false;
  v.wake=new Wake(40,17,46,15);wakes.push(v.wake);bezAt(P,0,q);v.setPos(q.x,q.z,q.rot);v.px=v.x;v.pz=v.z;v.status='Inbound';
  A.assist=B.assist=v;A.status=B.status='Waiting for '+v.name;A.tgt=()=>made?stn(v,86,0,0):stn(hold,86,0,0);B.tgt=()=>made?stn(v,-40,-14,0):stn(hold,-40,-44,0);
  while(t<T_IN){t+=(yield)||0;const u=1-Math.pow(1-clamp(t/T_IN,0,1),2);bezAt(P,u,q);v.setPos(q.x,q.z,q.rot);
    if(u>=U_JOIN&&!made){made=true;A.fast={v,lx:59,lz:0};A.status='Towing '+v.name;B.status='Alongside '+v.name;v.status='Tugs made fast';ev('vessel',`${v.name} · ${A.name} fast forward, ${B.name} on the quarter`,v);}}
  v.setPos(cx,-100,Math.PI);
  // swing bow-out: one tug hauls the bow round on the line, the other shoulders the stern the opposite way
  v.status='Swinging';A.fast={v,lx:58,lz:-4};A.tgt=()=>stn(v,56,-41,Math.PI/2);A.status='Pulling the bow round';B.tgt=()=>stn(v,-42,-19.8,-Math.PI/2);B.status='Pushing the stern';
  t=0;while(t<3||!(A.on&&B.on)&&t<9)t+=(yield)||0;B.push=true;
  t=0;while(t<20){t+=(yield)||0;v.setPos(cx,-100,Math.PI*(1+ease(clamp(t/20,0,1))));}
  v.setPos(cx,-100,0);B.push=false;
  // press her alongside
  v.status='Berthing';A.fast=null;A.tgt=()=>stn(v,34,-19.8,-Math.PI/2);B.tgt=()=>stn(v,-34,-19.8,-Math.PI/2);A.status=B.status='Pushing '+v.name+' alongside';
  t=0;while(t<3||!(A.on&&B.on)&&t<9)t+=(yield)||0;A.push=B.push=true;
  yield* glide(v,cx,BZ,18,ease);v.setPos(cx,BZ,0);
  A.push=B.push=false;for(const [g,o] of [[A,34],[B,-34]]){g.jobs++;g.status='Standing off';g.tgt=()=>({x:cx+o,z:BZ-58,h:-Math.PI/2,dp:true,spd:5});}
  cos.push((function*(){yield* sleep(7);for(const g of [A,B])if(g.assist===v&&g.status==='Standing off'){g.tgt=null;g.status='Returning to berth';}})());
  const i=wakes.indexOf(v.wake);if(i>=0)wakes.splice(i,1);scene.remove(v.wake.mesh);v.wake.mesh.geometry.dispose();v.wake=null;
}
function* shipDepart(v,b){
  // the tug berthed further out takes the bow, the inner one the stern, so their tracks from the inlet never cross
  const cx=b.cx,A=tugs[1],B=tugs[0],q={x:0,z:0,rot:0};let t=0;
  A.assist=B.assist=v;A.fast=B.fast=null;A.push=B.push=false;A.status=B.status='Proceeding to '+v.name;A.tgt=()=>stn(v,36,-50,Math.PI/2);B.tgt=()=>stn(v,-36,-50,Math.PI/2);
  while(!(A.on&&B.on)&&t<110)t+=(yield)||0;
  A.fast={v,lx:36,lz:-9.9,y:DECK+.9};B.fast={v,lx:-36,lz:-9.9,y:DECK+.9};A.status=B.status='Pulling '+v.name+' off the berth';v.status='Unberthing';ev('vessel',`${v.name} singled up · tugs fast`,v);yield* sleep(2.5);
  v.wake=new Wake(40,17,46,15);wakes.push(v.wake);v.px=v.x;v.pz=v.z;A.push=B.push=true;
  yield* glide(v,cx,-86,16,ease);A.push=B.push=false;A.fast=B.fast=null;A.jobs++;B.jobs++;
  {const hold={x:B.x,z:B.z,h:B.h,dp:true};B.tgt=()=>hold;B.status='Standing clear';}A.tgt=()=>stn(v,26,-48,0);A.status='Escorting '+v.name;v.status='Departing';ev('vessel',`${v.name} sailed from ${b.name}`,null);
  const P=[[cx,-86],[cx+300,-86],[1150,-1250],[2450,-980]];t=0;
  while(t<T_OUT){t+=(yield)||0;const u=Math.pow(clamp(t/T_OUT,0,1),2.1);bezAt(P,u,q);v.setPos(q.x,q.z,q.rot);if(u>.2&&A.tgt){A.tgt=null;A.status='Returning to berth';}
    if(B.tgt&&v.x-57>tugs[1].home.x+16){B.tgt=null;B.status='Returning to berth';}}   // the stern tug waits until she has cleared the mouth of the inlet
  const i=wakes.indexOf(v.wake);if(i>=0)wakes.splice(i,1);scene.remove(v.wake.mesh);v.wake.mesh.geometry.dispose();v.wake=null;
}
