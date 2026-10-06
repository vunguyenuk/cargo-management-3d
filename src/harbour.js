
/* ---------- harbour geography, laid out after Sơn Trà Port (Thọ Quang, Đà Nẵng) ----------
   Coastline, Yết Kiêu road and the neighbouring sites are traced from OpenStreetMap (© OpenStreetMap contributors) and turned so the
   wharf runs along x. +x is west (Tiên Sa and the way in from the bay), -x is east (Thọ Quang), +z is north (the Sơn Trà ridge) and
   -z is south (Đà Nẵng Bay). The wharf sits where the real one does; the terminal behind it keeps the simulator's own layout. */
const WY=-2.2;
const hrand=(()=>{let s=90417;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})();
const hr=(a,b)=>a+hrand()*(b-a),hpick=a=>a[Math.floor(hrand()*a.length)];
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
// shoreline from west to east, land on the +z side; the last four points close the polygon far inland
const COAST=[[1320,5200],[1320,4033],[1133,3669],[1141,3401],[1057,3343],[1074,3230],[1267,3057],[1241,2816],[1190,2690],[1339,2303],[1410,2250],[1519,2302],[1642,2293],[1663,2233],[1640,2122],[1733,1930],[1890,1841],[1863,1701],[1964,1624],[1962,1537],[1921,1400],[1885,1281],[1824,1216],[1817,1155],[1875,1048],[2020,951],[2049,940],[2168,1015],[2320,1062],[2451,1043],[2509,1001],[2610,765],[2641,705],[2877,664],[2900,638],[2664,433],[2532,586],[2444,519],[2580,358],[2557,338],[2420,498],[2353,438],[2472,297],[2449,277],[2331,420],[2268,364],[2309,314],[2136,165],[2113,194],[2059,115],[1939,91],[1925,114],[1941,306],[1838,354],[1946,324],[1986,395],[1949,477],[1705,715],[1603,640],[1576,567],[1711,517],[1706,505],[1571,552],[1541,474],[1493,470],[1423,437],[1346,400],[1255,348],[1214,321],[1160,305],[898,302],[890,396],[865,376],[835,373],[775,349],[805,268],[618,197],[607,223],[575,231],[536,234],[501,223],[506,208],[413,172],[324,147],[327,136],[224,99],[205,84],[221,50],[154,25],[134,25],[134,0],[-134,0],[-134,44],[-255,111],[-275,107],[-289,87],[-300,89],[-335,107],[-383,129],[-403,154],[-472,140],[-579,168],[-577,157],[-591,148],[-594,118],[-601,58],[-597,36],[-585,29],[-589,-8],[-508,-50],[-525,-85],[-402,-147],[-407,-156],[-530,-96],[-681,-397],[-575,-450],[-588,-477],[-695,-425],[-821,-694],[-710,-1079],[-691,-1077],[-667,-1226],[-628,-1241],[-598,-1347],[-523,-1681],[-542,-1653],[-585,-1663],[-507,-1997],[-455,-2070],[-183,-1895],[-164,-1852],[-262,-1522],[-58,-1151],[-58,-1084],[71,-908],[791,-1453],[811,-1421],[794,-1351],[592,-1297],[578,-1262],[786,-695],[848,-452],[884,-430],[1086,-505],[1292,-827],[1230,-1300],[1150,-1750],[1040,-2150],[900,-2700],[700,-3600],[500,-5200],[-1850,-5200],[-1876,-3323],[-1900,-2404],[-2039,-1876],[-2099,-1437],[-2206,-1137],[-2314,-973],[-2592,-711],[-2802,-600],[-3070,-607],[-3196,-768],[-3360,-908],[-3651,-1131],[-3816,-1159],[-3851,-882],[-4139,-722],[-4488,-828],[-4878,-730],[-5071,-546],[-5200,-300],[-5200,5200]];
const FARC=p=>Math.abs(p[0])>=5100||Math.abs(p[1])>=5100;   // corners that only close the polygon far inland
// Yết Kiêu road, west to east
const ROAD=[[2600,900],[2100,760],[1700,640],[1393,552],[1301,455],[1246,420],[1186,409],[1124,424],[1031,480],[944,533],[897,550],[845,551],[796,535],[712,503],[654,483],[469,419],[324,357],[160,279],[71,237],[21,224],[-37,222],[-96,235],[-160,277],[-216,321],[-261,343],[-309,352],[-458,350],[-611,343],[-683,329],[-758,302],[-830,252],[-883,189],[-967,31],[-1037,-111],[-1207,-424],[-1420,-900],[-1700,-1700]];
const CITY=[[1905,-2100],[2024,-2639],[2249,-2898],[2573,-3028],[2765,-2795],[3131,-2579],[3348,-2555],[5200,-2400],[5200,-5200],[900,-5200],[1250,-3600],[1560,-2900],[1700,-2450]];   // west bank of the Hàn river mouth
const inPoly=(P,x,z)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const inLand=(x,z)=>inPoly(COAST,x,z);
function coastDist(x,z){let m=1e9;for(let i=0;i<COAST.length;i++){const a=COAST[i],b=COAST[(i+1)%COAST.length];if(FARC(a)||FARC(b))continue;const dx=b[0]-a[0],dz=b[1]-a[1],t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz),0,1),d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);if(d<m)m=d;}return m;}
function zRoad(x){const R=ROAD;if(x>=R[0][0])return R[0][1];for(let i=1;i<R.length;i++)if(x>=R[i][0]){const a=R[i-1],b=R[i];return a[1]+(b[1]-a[1])*(a[0]-x)/(a[0]-b[0]);}return R[R.length-1][1];}
const hash2=(x,z)=>{const s=Math.sin(x*127.1+z*311.7)*43758.5453;return s-Math.floor(s);};
function vnoise(x,z){const xi=Math.floor(x),zi=Math.floor(z);let fx=x-xi,fz=z-zi;fx=fx*fx*(3-2*fx);fz=fz*fz*(3-2*fz);return lerp(lerp(hash2(xi,zi),hash2(xi+1,zi),fx),lerp(hash2(xi,zi+1),hash2(xi+1,zi+1),fx),fz);}
const fbm=(x,z)=>vnoise(x,z)*.55+vnoise(x*2.1+5.3,z*2.1+1.7)*.3+vnoise(x*4.3+2.2,z*4.3+9.1)*.15;
// the ridge behind the road; the low ground east of the stream stays flat
function terrainH(x,z){
  const s=z-zRoad(x)-28;if(s<=0)return 0;
  const low=sstep(.9,1.8,Math.hypot((x+400)/340,(z-500)/215));
  let m=Math.max(sstep(-620,-200,x),sstep(640,900,z))*low;if(m<=0)return 0;m*=sstep(10,210,coastDist(x,z));if(m<=0)return 0;
  const base=310*(1-Math.exp(-s/400)),n=fbm(x*.0034,z*.0034),r=fbm(x*.012+7,z*.012+3);
  return Math.max(0,base*m*(.58+.66*n)+(r-.5)*30*Math.min(1,s/120)*m);
}
function smoothLine(pts,step){const c=new T.CatmullRomCurve3(pts.map(([x,z])=>V(x,0,z)),false,'centripetal');return c.getSpacedPoints(Math.max(2,Math.ceil(c.getLength()/step))).map(p=>[p.x,p.z]);}
// flat strip along a polyline; off shifts it sideways, dash keeps every other piece
function ribbon(pts,w,y,mat,off=0,dash=0){const pos=[],n=pts.length;
  const side=i=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)];let tx=b[0]-a[0],tz=b[1]-a[1];const l=Math.hypot(tx,tz)||1;return [-tz/l,tx/l];};
  for(let i=0;i<n-1;i++){if(dash&&i%dash>=dash/2)continue;const [ax,az]=side(i),[bx,bz]=side(i+1),p=pts[i],q=pts[i+1];
    const x1=p[0]+ax*(off-w/2),z1=p[1]+az*(off-w/2),x2=p[0]+ax*(off+w/2),z2=p[1]+az*(off+w/2),x3=q[0]+bx*(off-w/2),z3=q[1]+bz*(off-w/2),x4=q[0]+bx*(off+w/2),z4=q[1]+bz*(off+w/2);
    pos.push(x1,y,z1,x2,y,z2,x3,y,z3,x3,y,z3,x2,y,z2,x4,y,z4);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();const m=new T.Mesh(g,mat);m.receiveShadow=true;scene.add(m);return m;}
const flatMat=(hex,k=2)=>wetReg(new T.MeshStandardMaterial({color:col(hex),roughness:.95,polygonOffset:true,polygonOffsetFactor:-k,polygonOffsetUnits:-k}));
const GEO=[{t:'Vũng Thùng',x:330,y:0,z:-430},{t:'Vịnh Đà Nẵng',x:2350,y:0,z:-520},{t:'Bán đảo Sơn Trà',x:560,y:230,z:880},{t:'Đ. Yết Kiêu',x:330,y:0,z:366},{t:'Cảng Tiên Sa',x:2380,y:10,z:470},{t:'Âu thuyền Thọ Quang',x:-380,y:0,z:-1480},{t:'Cầu Thuận Phước',x:1150,y:60,z:-1980},{t:'Cầu Mân Quang',x:-560,y:14,z:-800},{t:'Nại Hiên Đông',x:900,y:0,z:-1080}];

(function geography(){
  // land
  const sh=new T.Shape();COAST.forEach(([x,z],i)=>i?sh.lineTo(x,-z):sh.moveTo(x,-z));
  const lg=new T.ShapeGeometry(sh);lg.rotateX(-Math.PI/2);
  const land=new T.Mesh(lg,M_(0xbfae8c,{roughness:.96}));land.position.y=-.09;land.receiveShadow=true;scene.add(land);
  {const s2=new T.Shape();CITY.forEach(([x,z],i)=>i?s2.lineTo(x,-z):s2.moveTo(x,-z));const g=new T.ShapeGeometry(s2);g.rotateX(-Math.PI/2);const m=new T.Mesh(g,M_(0xbfae8c,{roughness:.96}));m.position.y=-.09;scene.add(m);}
  // rock revetment along the natural shore (the terminal has quay walls instead)
  {const NC=COAST.length,out=[];for(let i=0;i<NC;i++){const a=COAST[(i+NC-1)%NC],b=COAST[(i+1)%NC],p=COAST[i];let nx=b[1]-a[1],nz=-(b[0]-a[0]);const l=Math.hypot(nx,nz)||1;nx/=l;nz/=l;if(inLand(p[0]+nx*3,p[1]+nz*3)){nx=-nx;nz=-nz;}out.push([nx,nz]);}
    const pos=[];for(let i=0;i<NC-1;i++){const p=COAST[i],q=COAST[i+1];if(FARC(p)||FARC(q)||Math.abs(p[0])<=134&&Math.abs(q[0])<=134&&p[1]<=44&&q[1]<=44&&p[1]>=0)continue;
      const [ax,az]=out[i],[bx,bz]=out[i+1],T1=[p[0]-ax*1.5,-.12,p[1]-az*1.5],T2=[q[0]-bx*1.5,-.12,q[1]-bz*1.5],B1=[p[0]+ax*7,-3.6,p[1]+az*7],B2=[q[0]+bx*7,-3.6,q[1]+bz*7];
      pos.push(...T1,...B1,...T2,...T2,...B1,...B2,...T2,...B1,...T1,...B2,...B1,...T2);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();
    const m=new T.Mesh(g,new T.MeshStandardMaterial({color:col(0x9a8f7e),roughness:1,flatShading:true}));m.receiveShadow=true;scene.add(m);}
  // paved ground of the neighbouring port sites
  const pad=(pts,hex)=>{const s=new T.Shape();pts.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z));const g=new T.ShapeGeometry(s);g.rotateX(-Math.PI/2);const m=new T.Mesh(g,flatMat(hex,1));m.position.y=-.07;m.receiveShadow=true;scene.add(m);};
  pad([[805,268],[618,197],[607,223],[575,231],[536,234],[501,223],[506,208],[413,172],[324,147],[327,136],[224,99],[205,84],[221,50],[154,25],[134,25],[134,170],[165,262],[326,340],[468,402],[650,465],[712,487],[790,518],[850,528],[849,394],[771,356]],0xb1aca2);
  pad([[-134,44],[-255,111],[-200,238],[-170,262],[-134,236]],0xb5afa4);
  pad([[-134,160],[134,160],[134,206],[60,214],[-60,206],[-134,222]],0xb9b0a0);
  // roads
  const asph=flatMat(0x77767b,3),lineW=flatMat(0xf1eee6,5),lineY=flatMat(0xe2a81a,5),kerb=flatMat(0xbdb7ab,4);
  const yk=smoothLine(ROAD,7);
  ribbon(yk,22,-.05,asph);ribbon(yk,1.5,-.035,kerb);ribbon(yk,.22,-.03,lineW,10.2);ribbon(yk,.22,-.03,lineW,-10.2);ribbon(yk,.18,-.03,lineW,5.6,4);ribbon(yk,.18,-.03,lineW,-5.6,4);
  const svc=(pts,w=8)=>{const s=smoothLine(pts,6);ribbon(s,w,-.055,asph);ribbon(s,.14,-.04,lineY,0,4);return s;};
  ribbon([[0,159],[0,226]],19,-.045,asph);ribbon([[0,159],[0,214]],.24,-.03,lineY);ribbon([[0,159],[0,214]],.16,-.03,lineW,9.3);ribbon([[0,159],[0,214]],.16,-.03,lineW,-9.3);
  svc([[160,279],[198,177],[207,171],[244,183],[262,146],[264,122],[234,115],[207,171]]);svc([[324,357],[333,339],[357,294],[261,246]]);svc([[654,483],[560,381],[616,222]]);svc([[357,294],[420,330],[520,372]],7);
  svc([[-216,321],[-232,262],[-205,205]],7);
  // street lamps down the median of Yết Kiêu
  // near things cast shadows, far ones do not: two builders behind one interface, chosen by where a piece is placed
  const NB=new Builder(),FB=new Builder(),nearT=(x,z)=>Math.hypot(x,z-90)<470?NB:FB,
    B={box:(...a)=>nearT(a[4],a[6]).box(...a),cyl:(...a)=>nearT(a[3],a[5]).cyl(...a),add:(...a)=>nearT(a[2]||0,a[4]||0).add(...a),beam:(m,t,a,b)=>nearT(a.x,a.z).beam(m,t,a,b)};
  const steel=M_(0x6f6a6c,{roughness:.6}),lamp=M_(0xfff0c8,{emissive:0xffc978,emissiveIntensity:1}),conc=M_(0xa9a297),dark=M_(0x2a2629),white=M_(0xf3f1ec),cream=M_(0xece6da),glass=M_(0x1f3640,{roughness:.2,metalness:.2});
  for(let i=4;i<yk.length-4;i+=6){const [x,z]=yk[i];if(Math.abs(x)>1500)continue;const a=yk[i-1],b=yk[i+1],ry=Math.atan2(-(b[1]-a[1]),b[0]-a[0]);
    B.cyl(steel,.16,9.5,x,4.75,z,0,0,0,6,.1);B.box(steel,.12,.12,5.6,x,9.4,z,0,ry,0);
    for(const s of [-1,1]){const lx=x+Math.sin(ry)*s*2.6,lz=z+Math.cos(ry)*s*2.6;B.box(lamp,.5,.12,1,lx,9.3,lz,0,ry,0);LAMPS.push([lx,9.2,lz,1,0xffd9a0]);}}
  // the ridge: one faceted mesh, forest green
  {const X0=-1700,Z0=150,ST=36,NX=126,NZ=44,pos=[],cl=[],H=[],c1=col(0x2f5a34),c2=col(0x47793f),c3=col(0x6d8a45),cc=new T.Color();
    for(let j=0;j<=NZ;j++)for(let i=0;i<=NX;i++)H.push(terrainH(X0+i*ST,Z0+j*ST));
    const vtx=(i,j)=>{const x=X0+i*ST,z=Z0+j*ST,h=H[j*(NX+1)+i];pos.push(x,h>.3?h:-1.8,z);const n=fbm(x*.02,z*.02);cc.copy(c1).lerp(c2,n).lerp(c3,sstep(.66,.95,fbm(x*.006+3,z*.006))*.4).multiplyScalar(.8+.24*hash2(i,j));cl.push(cc.r,cc.g,cc.b);};
    for(let j=0;j<NZ;j++)for(let i=0;i<NX;i++){const k=j*(NX+1)+i;if(H[k]+H[k+1]+H[k+NX+1]+H[k+NX+2]<=0)continue;vtx(i,j);vtx(i,j+1);vtx(i+1,j);vtx(i+1,j);vtx(i,j+1);vtx(i+1,j+1);}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(cl,3));g.computeVertexNormals();
    scene.add(new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true})));}
  // sheds, stockpiles and houses on the sites around the terminal
  const tones=[0xe2d6c4,0xd9c0a6,0xe9dfd0,0xc9ad94,0xd6c5b4,0xcfd3d0],roofs=[0xb65a34,0x8f8f8c,0xc0916c,0x7f93a0];
  const shed=(x,z,w,d,h,rot,wall,rf)=>{B.box(M_(wall),w,h,d,x,h/2,z,0,rot,0);const s=new T.Shape();s.moveTo(-d/2-.5,0);s.lineTo(d/2+.5,0);s.lineTo(0,d*.19);s.closePath();
    const g=new T.ExtrudeGeometry(s,{depth:w+1,bevelEnabled:false});g.translate(0,0,-(w+1)/2);g.rotateY(Math.PI/2);B.add(M_(rf),g,x,h,z,0,rot,0);};
  const pile=(x,z,r,h,hex)=>B.cyl(M_(hex,{roughness:1}),r,h,x,h/2-.1,z,0,hr(0,6),0,9,.4);
  const along=[];{let acc=0;for(let i=1;i<yk.length;i++){acc+=Math.hypot(yk[i][0]-yk[i-1][0],yk[i][1]-yk[i-1][1]);if(acc>74){acc=0;along.push(i);}}}
  for(const i of along){const [x,z]=yk[i];if(x<150||x>860)continue;const a=yk[i-1],b=yk[i+1],tx=b[0]-a[0],tz=b[1]-a[1],l=Math.hypot(tx,tz),ry=Math.atan2(-tz,tx);let nx=-tz/l,nz=tx/l;if(nz>0){nx=-nx;nz=-nz;}
    const px=x+nx*52,pz=z+nz*52;if(inLand(px,pz)&&coastDist(px,pz)>34&&Math.hypot(px-333,pz-339)>46)shed(px,pz,hr(46,62),hr(22,30),hr(8,11),ry,hpick(tones),hpick(roofs));
    for(const o of [104,138,172]){const qx=x+nx*o+hr(-14,14),qz=z+nz*o+hr(-6,6);if(!inLand(qx,qz)||coastDist(qx,qz)<16||qx<150)continue;const k=hrand();
      if(k<.4)pile(qx,qz,hr(9,15),hr(5,9),hpick([0xc8a878,0xb89a66,0x5b5552,0x8f8a84]));else if(k<.7)for(let n=0;n<3;n++)B.box(M_(hpick([0x8a5a3c,0x6f7780,0x9b8f7f])),hr(8,13),hr(1.6,3.6),hr(3,5),qx+hr(-6,6),1.4,qz+n*5.2-5,0,ry,0);
      else shed(qx,qz,hr(24,36),hr(14,18),hr(6,8),ry,hpick(tones),hpick(roofs));}}
  for(const [x,z] of [[-340,319],[-341,280],[-389,247],[-336,240],[-396,319],[-397,281]])shed(x,z,26,11,6.5,-.17,hpick(tones),0xb65a34);
  for(let i=0;i<4;i++)for(let j=0;j<3;j++){const x=-560+i*96+hr(-6,6),z=392+j*74+hr(-5,5);shed(x,z,hr(48,66),13,7,-.05,0xe6d9b8,0xa8482c);}
  shed(-466,479,72,26,9,-.05,0xe6d9b8,0xa8482c);
  // filling station on the far side of the road (neutral livery)
  B.box(white,22,.6,11,791,6.2,512,0,-.35,0);for(const o of [-7,7])B.cyl(steel,.3,6,791+Math.cos(.35)*o,3,512+Math.sin(.35)*o,0,0,0,8);B.box(M_(0x2f6f9f),22.2,.9,11.2,791,5.6,512,0,-.35,0);B.box(cream,9,3.4,6,806,1.7,497,0,-.35,0);
  // tug berth in the cove east of the terminal: pontoon, gangway, hut
  B.box(M_(0x5f6a72,{roughness:.7}),64,1.5,8,-191,WY+.35,54);B.box(M_(0x2a2629),64.3,.5,8.3,-191,WY+.9,54);for(let x=-219;x<=-163;x+=8)B.cyl(dark,.3,.7,x,WY+1.6,50.9,0,0,0,8,.4);
  B.box(steel,2.2,.2,27,-205,-.55,71.5,-.041,0,0);for(const s of [-1,1])B.box(steel,.08,.9,27,-205+s*1.05,0,71.5,-.041,0,0);
  B.box(cream,9,3.2,6,-214,1.6,101,0,.5,0);B.box(M_(0xa93c16),9.6,.3,6.6,-214,3.35,101,0,.5,0);B.cyl(steel,.14,8,-196,4,88,0,0,0,6);B.box(lamp,.9,.2,.5,-196,7.9,87.6);LAMPS.push([-196,7.8,87.6,1,0xffe2b0],[-175,WY+3.2,57,0,0xffe2b0],[-207,WY+3.2,57,0,0xffe2b0]);
  // terminal side walls, east pier, breakwater, Tiên Sa and the yards beyond
  B.box(conc,1.4,5,25,134.7,-2.5,12.5);B.box(conc,1.4,5,44,-134.7,-2.5,22);
  B.box(conc,176,1.4,10,-515,-.3,24.5,0,.097,0);for(let i=0;i<9;i++)B.cyl(dark,.7,6,-432-i*20,-3,16.5+i*1.95,0,0,0,8);
  {const bw=smoothLine([[1876,-532],[1639,-642],[1402,-1358],[1165,-2075],[1125,-2153]],30),rock=new T.MeshStandardMaterial({color:col(0x8d857a),roughness:1,flatShading:true});
    ribbon(bw,7,1.3,rock);
    const pos=[];for(let i=0;i<bw.length-1;i++){const p=bw[i],q=bw[i+1],tx=q[0]-p[0],tz=q[1]-p[1],l=Math.hypot(tx,tz),nx=-tz/l,nz=tx/l;for(const s of [-1,1]){const a=[p[0]+nx*s*3.5,1.3,p[1]+nz*s*3.5],b=[q[0]+nx*s*3.5,1.3,q[1]+nz*s*3.5],c=[p[0]+nx*s*13,-3.4,p[1]+nz*s*13],d=[q[0]+nx*s*13,-3.4,q[1]+nz*s*13];pos.push(...a,...c,...b,...b,...c,...d,...b,...c,...a,...d,...c,...b);}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();scene.add(new T.Mesh(g,rock));
    B.cyl(white,1.4,9,1124,5.5,-2153,0,0,0,10,1);B.cyl(M_(0xc8402e),1.5,2,1124,10.5,-2153,0,0,0,10);LAMPS.push([1124,12,-2153,2,0xff5040],[1877,3,-532,1,0x4be37a]);}
  for(const [x,z,w,d,h,r] of [[2520,640,150,40,14,-.25],[2700,700,120,46,16,-.2],[2260,560,110,38,13,-.3],[2080,420,90,34,12,-.2],[1700,640,80,30,10,-.2],[1480,560,70,24,9,.2],[1280,470,64,22,8,.3]])shed(x,z,w,d,h,r,hpick(tones),hpick(roofs));
  for(const [x,z] of [[2596,516],[2500,410],[2400,350],[2290,300]]){const c=M_(0x3f6e8f,{roughness:.6});for(const sx of [-9,9])for(const sz of [-7,7])B.box(c,1.6,44,1.6,x+sx,22,z+sz);B.box(c,22,3,16,x,45,z);B.box(c,3,3,74,x,47,z-22,0,.9,0);B.box(c,2,14,2,x,54,z);LAMPS.push([x,48,z,2,0xffe2b0]);}
  for(let i=0;i<26;i++){const x=hr(1950,2850),z=hr(430,640);if(!inLand(x,z)||coastDist(x,z)<25)continue;B.box(M_(hpick([0x1f5f8f,0xa83a26,0xd19a1f,0x24365a,0x7a2c2c,0x2f6b4f,0x9a9d9f])),36,hr(5,13),hr(10,14),x,5,z,0,-.86,0);}
  for(const [x,z,w,d,h] of [[-760,-300,120,44,15],[-880,-120,90,40,12],[-700,-520,70,30,11],[-980,-420,110,40,13],[-760,60,60,24,8]])shed(x,z,w,d,h,.45,hpick(tones),hpick(roofs));
  // channel buoys on the way in from the bay
  for(const [x,z,g] of [[470,-36,1],[470,-285,0],[780,-30,1],[780,-300,0],[1090,-40,1],[1090,-330,0],[1420,-60,1],[1420,-330,0],[-250,-120,0]]){const c=M_(g?0x2d8659:0xc8402e,{roughness:.5});B.cyl(c,1.25,2.4,x,WY+.9,z,0,0,0,10,.7);B.cyl(steel,.1,2.6,x,WY+3.3,z,0,0,0,6);g?B.cyl(c,.5,.9,x,WY+4.6,z,0,0,0,8,.02):B.cyl(c,.45,.8,x,WY+4.6,z,0,0,0,8);LAMPS.push([x,WY+5.2,z,0,g?0x4be37a:0xff5040]);}
  // ---- around the port: ships at the neighbours' berths, shipyards, the fishing harbour, the bridges, the far shore ----
  const hullShape=(L,W)=>{const s=new T.Shape();s.moveTo(-L/2,-W/2);s.lineTo(L*.22,-W/2);s.quadraticCurveTo(L*.42,-W*.45,L/2,0);s.quadraticCurveTo(L*.42,W*.45,L*.22,W/2);s.lineTo(-L/2,W/2);s.quadraticCurveTo(-L*.53,0,-L/2,-W/2);return s;};
  const at=(x,z,r,lx,lz)=>[x+lx*Math.cos(r)+lz*Math.sin(r),z-lx*Math.sin(r)+lz*Math.cos(r)];
  const hull=(x,z,L,W,r,free,hex)=>{const g=new T.ExtrudeGeometry(hullShape(L,W),{depth:free+2.6,bevelEnabled:false,curveSegments:L>30?5:3});g.rotateX(Math.PI/2);B.add(M_(hex,{roughness:.6}),g,x,WY+free,z,0,r,0);};
  // a moored ship: hull, deckhouse aft, mast; grey for the navy, coloured for coasters
  const ship=(x,z,L,W,r,hex,house,cargo)=>{const f=L*.045+1.6;hull(x,z,L,W,r,f,hex);const y=WY+f;
    let [px,pz]=at(x,z,r,-L*.33,0);B.box(M_(house),L*.16,L*.07+3,W*.8,px,y+(L*.07+3)/2,pz,0,r,0);B.box(glass,L*.1,1.2,W*.84,px+0,y+L*.07+3.4,pz,0,r,0);B.box(M_(house),L*.11,1.2,W*.86,px,y+L*.07+4.6,pz,0,r,0);
    [px,pz]=at(x,z,r,-L*.3,0);B.cyl(steel,.25,L*.1,px,y+L*.07+5+L*.05,pz,0,0,0,6);LAMPS.push([px,y+L*.17+5,pz,0,0xffe9c4]);
    if(cargo)for(let i=0;i<5;i++){const [qx,qz]=at(x,z,r,-L*.16+i*L*.11,0);B.box(M_(hpick([0x1f5f8f,0xa83a26,0xd19a1f,0x24365a,0x2f6b4f,0x9a9d9f])),L*.1,hr(2.6,7.8),W*.78,qx,y+hr(1.4,3.9),qz,0,r,0);}
    else{const [qx,qz]=at(x,z,r,L*.2,0),[mx,mz]=at(x,z,r,-L*.12,0);B.box(M_(house),L*.07,2.2,W*.36,qx,y+1.1,qz,0,r,0);B.cyl(steel,.2,L*.16,mx,y+L*.08,mz,0,0,0,6);}};
  // wooden fishing boat of the Thọ Quang fleet: blue hull, red rail, cabin aft
  const boat=(x,z,r)=>{const L=hr(14,20),W=L*.27;hull(x,z,L,W,r,1.5,hpick([0x2f6fae,0x2a64a0,0x3b82b8,0x2c7f8f]));
    const g=new T.ExtrudeGeometry(hullShape(L*.93,W*.8),{depth:.2,bevelEnabled:false,curveSegments:3});g.rotateX(Math.PI/2);B.add(M_(0xa9855c),g,x,WY+1.56,z,0,r,0);const [fx,fz]=at(x,z,r,L*.36,0);B.box(M_(0xb8322a),L*.12,.5,W*.5,fx,WY+1.8,fz,0,r,0);
    const [cx,cz]=at(x,z,r,-L*.22,0);B.box(M_(hpick([0xe8e4d8,0xd9d2c0,0x9fc0d8])),L*.27,2.3,W*.62,cx,WY+2.7,cz,0,r,0);B.box(M_(0x2a64a0),L*.31,.16,W*.7,cx,WY+3.9,cz,0,r,0);
    const [mx,mz]=at(x,z,r,L*.08,0);B.cyl(M_(0x6b4a36),.09,5.2,mx,WY+4.2,mz,0,0,0,5);if(hrand()<.4)LAMPS.push([mx,WY+6.6,mz,0,hpick([0xffe9c4,0x9fe0ff,0x7dffb0])]);};
  // road bridge on piers; a steel-grey deck with parapets
  const deckMat=M_(0xcfcac0,{roughness:.8}),pierMat=M_(0xb9b3a8);
  const span=(a,b,w,y)=>{const dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz),r=Math.atan2(-dz,dx),mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;B.box(deckMat,l+.5,1.5,w,mx,y-.75,mz,0,r,0);for(const s of [-1,1]){const [px,pz]=at(mx,mz,r,0,s*(w/2-.2));B.box(pierMat,l+.5,.9,.3,px,y+.45,pz,0,r,0);}
    for(let t=20;t<l-10;t+=42){const px=a[0]+dx*t/l,pz=a[1]+dz*t/l;if(inLand(px,pz)&&y<12)continue;B.box(pierMat,2.4,y-WY+2,w*.55,px,(y-1.5+WY-2)/2,pz,0,r,0);}
    for(let t=30;t<l;t+=60)LAMPS.push([a[0]+dx*t/l,y+7,a[1]+dz*t/l,0,0xffd9a0]);return [l,r,mx,mz];};
  span([-900,-620],[-837,-655],16,5);span([-837,-655],[-531,-807],16,11);span([-531,-807],[-58,-1070],16,9);span([-58,-1070],[60,-1140],16,5);
  // Thuận Phước suspension bridge over the river mouth
  {const A=[576,-1537],C=[1724,-2428],D=[1789,-2807],dy=27,w=18,yT=96,cab=M_(0xe2ddd2,{roughness:.6}),dx=C[0]-A[0],dz=C[1]-A[1],l=Math.hypot(dx,dz),ux=dx/l,uz=dz/l,r=Math.atan2(-dz,dx),P=t=>[A[0]+ux*t,A[1]+uz*t];
    span([470,-1455],A,w,14);span(A,C,w,dy);span(C,D,w,dy-6);const t1=l*.36,t2=l*.64,an=165;
    for(const t of [t1,t2]){const [tx,tz]=P(t);for(const s of [-1,1]){const [px,pz]=at(tx,tz,r,0,s*(w/2+1));B.box(cab,3.4,yT-WY+3,3,px,(yT+WY-3)/2,pz,0,r,0);}for(const y of [dy-4,dy+30,yT-3])B.box(cab,3,3.4,w+2,tx,y,tz,0,r,0);LAMPS.push([tx,yT+2,tz,2,0xffe9c4]);}
    for(const s of [-1,1]){const pt=(t,y)=>{const [x,z]=P(t),[px,pz]=at(x,z,r,0,s*(w/2+1));return V(px,y,pz);};
      for(let i=0;i<14;i++){const u0=i/14,u1=(i+1)/14,y0=dy+3+(yT-dy-3)*Math.pow(2*u0-1,2),y1=dy+3+(yT-dy-3)*Math.pow(2*u1-1,2);B.beam(cab,1,pt(t1+(t2-t1)*u0,y0),pt(t1+(t2-t1)*u1,y1));if(i%2===0)LAMPS.push([pt(t1+(t2-t1)*u0,y0).x,y0,pt(t1+(t2-t1)*u0,y0).z,0,0xffe2b0]);
        if(i>0&&i<14)B.beam(cab,.35,pt(t1+(t2-t1)*u0,y0),pt(t1+(t2-t1)*u0,dy));}
      B.beam(cab,1,pt(t1,yT),pt(t1-an,dy+1));B.beam(cab,1,pt(t2,yT),pt(t2+an,dy+1));}}
  // Tiên Sa: two feeders on the finger piers; the navy's berths west of the terminal
  ship(2618,512,150,23,-2.28,0x24365a,0xf1efe9,1);ship(2528,402,130,21,-2.28,0x6e2a23,0xf1efe9,1);ship(2388,372,120,20,-2.28,0x2f4a3f,0xf1efe9,1);
  B.box(conc,236,1.6,14,1452,-.2,418,0,-.4,0);B.box(conc,150,1.6,10,1640,-.2,534,0,.33,0);B.box(conc,70,1.6,10,1458,-.2,372,0,.95,0);
  ship(1478,456,98,12.5,-.4,0x8a9198,0x9aa1a8,0);ship(1396,378,84,11,-.4,0x8a9198,0x9aa1a8,0);ship(1650,512,90,12,.33,0x8a9198,0x9aa1a8,0);ship(1565,566,62,9,.33,0x8a9198,0x9aa1a8,0);
  // shipyards on the east shore (X50 and Sông Thu): slipways, hulls on the stocks, goliath cranes
  for(const [x,z,r,L] of [[-640,-470,.52,84],[-560,-120,.3,66],[-640,60,-.1,58]]){const [sx,sz]=at(x,z,r,L*.5,0);B.box(conc,L*1.5,1,26,sx,-.9,sz,0,r,.03);ship(x,z,L,L*.17,r,hpick([0x8d2f22,0x7a8088,0x54606c]),0xc9c4b8,0);
    const [gx,gz]=at(x,z,r,-L*.5,0),blue=M_(0x2f6f9f,{roughness:.6});for(const s of [-1,1]){const [px,pz]=at(gx,gz,r,0,s*24);B.box(blue,3,40,3,px,20,pz,0,r,0);}B.box(blue,5,4,54,gx,41,gz,0,r,0);LAMPS.push([gx,44,gz,2,0xffe9c4]);}
  // the fishing fleet: rafted along both banks of the lock basin, a few at anchor in the bay
  for(let i=0;i<34;i++){const t=i/33,x=lerp(-700,-545,t)+hr(-6,6),z=lerp(-1100,-1960,t);for(let k=0;k<3;k++)if(hrand()<.82)boat(x+22+k*19,z+hr(-3,3),hr(-.12,.12));}
  for(let i=0;i<26;i++){const t=i/25,x=lerp(-95,-215,t),z=lerp(-1180,-1840,t);for(let k=0;k<2;k++)if(hrand()<.8)boat(x-26-k*19,z+hr(-3,3),Math.PI+hr(-.12,.12));}
  for(let i=0;i<22;i++){let x,z,n=0;do{x=hr(-520,640);z=hr(-860,-330);}while((inLand(x,z)||coastDist(x,z)<40||z>-560+x*.5&&x<200)&&n++<30);boat(x,z,hr(0,6.3));}
  for(let i=0;i<9;i++)boat(-330-i*9+hr(-2,2),150-i*4-34-hr(0,10),.5+hr(-.2,.2));
  // Nại Hiên Đông: the hotel tower on the point and the apartment blocks behind it
  {const gold=M_(0xc9a13c,{roughness:.35,metalness:.55,env:.8});B.box(M_(0xd9d2c4),86,14,60,966,7,-1719,0,-.6,0);B.box(gold,44,118,28,966,73,-1719,0,-.6,0);for(let y=22;y<128;y+=7)B.box(glass,44.4,1.8,28.4,966,y,-1719,0,-.6,0);B.box(gold,48,7,32,966,135.5,-1719,0,-.6,0);LAMPS.push([966,141,-1719,2,0xffd27a]);
    for(const [x,z,h] of [[57,-2430,62],[93,-2437,62],[23,-2424,62],[191,-2489,74],[143,-2453,74],[201,-2417,74],[1040,-1560,58],[860,-1840,66],[1728,-2702,96]]){B.box(M_(hpick(tones)),30,h,22,x,h/2,z,0,-.3,0);for(let y=8;y<h-2;y+=6)B.box(glass,30.3,1.4,22.3,x,y,z,0,-.3,0);LAMPS.push([x,h+2,z,1,0xff5040]);}}
  // radar domes on the ridge
  for(const [x,z] of [[-320,1560],[620,1640]]){const h=terrainH(x,z);B.cyl(white,3,14,x,h+7,z,0,0,0,10);B.add(white,new T.SphereGeometry(9,14,10),x,h+19,z);LAMPS.push([x,h+30,z,1,0xff5040]);}
  scene.add(NB.build(),FB.build(false));
  // the built-up shores around the bay: Thọ Quang, Nại Hiên Đông and the city over the river, as instanced blocks
  {const N=1150,im=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({roughness:.9}),N),pal2=tones.concat([0xc86a48,0xd9d2c8,0xb9c2c6]);let k=0,guard=0;
    const put=(x,z,w,d,h,ry,lit)=>{_o.position.set(x,h/2,z);_o.rotation.set(0,ry,0);_o.scale.set(w,h,d);_o.updateMatrix();im.setMatrixAt(k,_o.matrix);im.setColorAt(k,col(hpick(pal2)));k++;if(hrand()<lit)LAMPS.push([x,h+1,z,h>40?1:0,0xffd9a0]);};
    while(k<880&&guard++<20000){const x=hr(-2700,1560),z=hr(-2700,330);if(z>-425&&x>-640||x>-1160&&x<-560&&z>-640&&z<170)continue;if(!inLand(x,z)||coastDist(x,z)<28||terrainH(x,z)>0||z>zRoad(x)-24&&x>-900)continue;
      const tall=hrand()<(x>540?.2:.07);put(x,z,hr(9,22),hr(8,16),tall?hr(16,46):hr(4,9),hr(-.2,.2)+(x>540?-.9:.4),.13);}
    guard=0;while(k<N&&guard++<9000){const x=hr(1300,3600),z=hr(-4700,-2200);if(!inPoly(CITY,x,z))continue;const t=hrand();put(x,z,hr(16,34),hr(14,28),t<.12?hr(70,150):t<.5?hr(24,60):hr(8,18),hr(0,.4),.35);}
    im.count=k;im.frustumCulled=false;im.receiveShadow=true;scene.add(im);}
  // trees: along the road, around the sites and thick on the lower slopes
  {const flat=[],slope=[];
    for(let i=3;i<yk.length-3;i+=3){const [x,z]=yk[i];if(Math.abs(x)>1500)continue;const a=yk[i-1],b=yk[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]),nx=-(b[1]-a[1])/l,nz=(b[0]-a[0])/l;for(const s of [-1,1]){const px=x+nx*s*15.5+hr(-1,1),pz=z+nz*s*15.5+hr(-1,1);if(Math.abs(px)<16&&pz<240)continue;if(inLand(px,pz)&&coastDist(px,pz)>8)flat.push([px,pz]);}}
    for(let i=0;i<150;i++){const x=hr(-640,-150),z=hr(374,660);flat.push([x,z]);}
    for(let i=0;i<60;i++){const x=hr(-330,-140),z=hr(120,300);if(inLand(x,z)&&coastDist(x,z)>10&&z<zRoad(x)-16)flat.push([x,z]);}
    let guard=0;while(slope.length<1500&&guard++<12000){const x=hr(-250,1500),z=zRoad(x)+hr(30,340),h=terrainH(x,z);if(h>1)slope.push([x,h,z]);}
    const tm=new T.MeshStandardMaterial({roughness:.9,flatShading:true}),crown=new T.InstancedMesh(new T.IcosahedronGeometry(1,1),tm,flat.length),canopy=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),tm,slope.length),trunk=new T.InstancedMesh(new T.CylinderGeometry(.18,.26,1,6),M_(0x5f4636),flat.length),greens=[0x5f8a45,0x4f7f48,0x6f8f48,0x47744a,0x3f6e42];
    flat.forEach(([x,z],i)=>{const s=hr(.8,1.35);_o.rotation.set(0,hr(0,6),0);_o.position.set(x,2*s,z);_o.scale.set(1,4*s,1);_o.updateMatrix();trunk.setMatrixAt(i,_o.matrix);_o.position.set(x,5.6*s,z);_o.scale.set(2.6*s,3.2*s,2.6*s);_o.updateMatrix();crown.setMatrixAt(i,_o.matrix);crown.setColorAt(i,col(hpick(greens)));});
    slope.forEach(([x,h,z],i)=>{const s=hr(1.2,2.3);_o.rotation.set(0,hr(0,6),0);_o.position.set(x,h+1.6*s,z);_o.scale.set(3.4*s,2.6*s,3.4*s);_o.updateMatrix();canopy.setMatrixAt(i,_o.matrix);canopy.setColorAt(i,col(hpick([0x3a6a38,0x325f36,0x447640,0x2e5a34])).multiplyScalar(hr(.8,1.05)));});
    for(const m of [crown,canopy,trunk]){m.frustumCulled=false;m.receiveShadow=true;scene.add(m);}}
  // fixed lights that already stand in the terminal
  for(const x of [-103,-8.5,8.5,103])for(const z of [52.5,78.5])LAMPS.push([x,28,z,2,0xffe9c4]);
  LAMPS.push([71,32.8,124,1,0xff5040],[-OFF,5.9,GATE_Z+15.6,0,0xffe2b0],[OFF,5.9,GATE_Z+15.6,0,0xffe2b0]);for(const x of [-11,-3,3,11])LAMPS.push([x,5.8,GATE_Z,1,0xffe9c4]);
})();

/* ---------- tugs and ship handling ----------
   Two ASD harbour tugs lie stern-to at the pontoon east of the terminal. One ship moves in the basin at a time. Inbound, the tugs
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
const GATE_W=-62;   // tugs leave and enter the cove on a line due south of their berth
const lineMat=new T.LineBasicMaterial({color:col(0xd8cfb8)});
class Tug{
  constructor(i,name,accent){this.kind='tug';this.id=name;this.name=name;this.home={x:-178-27*i,z:36.4,h:Math.PI/2};this.x=this.home.x;this.z=this.home.z;this.h=this.home.h;this.v=0;this.spd=0;this.on=false;
    this._tgt=null;this.status='Standing by';this.assist=null;this.fast=null;this.push=false;this.jobs=0;this.t=i*1.7;
    this.group=tugModel(name,accent);this.group.userData.ent=this;scene.add(this.group);this.wake=new Wake(26,5,15,7);wakes.push(this.wake);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(9),3));this.line=new T.Line(g,lineMat);this.line.frustumCulled=false;this.line.raycast=()=>{};this.line.visible=false;scene.add(this.line);
    ents.push(this);}
  get label(){return this.name;}
  get tgt(){return this._tgt;}
  set tgt(f){this._tgt=f;this.on=false;}   // a new station: not on it until the tug has actually got there
  center(v){return v.set(this.x,WY+13.5,this.z);}
  frame(){return {x:this.x,y:WY+5,z:this.z,rot:this.h,d:[30,13,11.5]};}
  step(dt){this.t+=dt;const px=this.x,pz=this.z;let T=this._tgt?this._tgt():null,own=!!T;const inCove=this.z>-34;
    if(!T){T=Math.hypot(this.x-this.home.x,this.z-GATE_W)<12||inCove&&Math.abs(this.x-this.home.x)<3?Object.assign({dp:true,spd:5},this.home):{x:this.home.x,z:GATE_W,h:this.home.h};
      if(Math.hypot(this.x-this.home.x,this.z-this.home.z)<.4&&this.status!=='Standing by'){this.status='Standing by';this.assist=null;}}
    else if(inCove&&T.z<-34){T={x:this.home.x,z:GATE_W-8,h:this.home.h,dp:true,spd:7};own=false;}
    const dx=T.x-this.x,dz=T.z-this.z,d=Math.hypot(dx,dz);
    if(T.dp||d<20){const st=Math.min(d,(T.spd||19)*dt);if(d>1e-4){this.x+=dx/d*st;this.z+=dz/d*st;}this.h+=clamp(angDiff(T.h,this.h),-1.5*dt,1.5*dt);this.on=own&&d<2.5&&Math.abs(angDiff(T.h,this.h))<.25;this.v=0;}
    else{const err=angDiff(Math.atan2(-dz,dx),this.h);this.h+=clamp(err,-1.2*dt,1.2*dt);const vt=Math.min(14,d*.5+4)*(Math.abs(err)>.9?.3:1);this.v+=clamp(vt-this.v,-7*dt,5*dt);this.x+=Math.cos(this.h)*this.v*dt;this.z-=Math.sin(this.h)*this.v*dt;this.on=false;}
    this.spd=lerp(this.spd,Math.hypot(this.x-px,this.z-pz)/Math.max(dt,1e-4),.3);
    const sx=this.x-Math.cos(this.h)*13,sz=this.z+Math.sin(this.h)*13;
    if(this.push)this.wake.feed(sx+hr(-1,1),sz+hr(-1,1),1,-Math.cos(this.h)*4.5,Math.sin(this.h)*4.5,2.2);else this.wake.feed(sx,sz,clamp(this.spd/9,0,1),0,0,3);}
  sync(){this.group.position.set(this.x,WY+Math.sin(this.t*1.3)*.07,this.z);this.group.rotation.set(Math.sin(this.t*.9)*.012,this.h,0);
    const f=this.fast;this.line.visible=!!f;if(f){const c=Math.cos(this.h),s=Math.sin(this.h),o=f.bow?11.2:-5.5,p=this.line.geometry.attributes.position,a=stn(f.v,f.lx,f.lz,0),ty=WY+(f.bow?3.4:2.7),sy=f.y||DECK+1.2;
      p.setXYZ(0,this.x+c*o,ty,this.z-s*o);p.setXYZ(1,(this.x+c*o+a.x)/2,(ty+sy)/2-1.4,(this.z-s*o+a.z)/2);p.setXYZ(2,a.x,sy,a.z);p.needsUpdate=true;}}
}
const tugs=[new Tug(0,'TL TUG 01',0xd4501d),new Tug(1,'TL TUG 02',0x1f6f8f)];
const port={busy:null};
const ARRIVE_S=6+60+3+20+3+18;   // seconds from "tugs away" to all fast
function stepHarbour(dt){for(const t of tugs)t.step(dt);for(const w of wakes)w.step(dt);
  for(const b of berths){const v=b.vessel;if(v&&v.wake){const sp=Math.hypot(v.x-v.px,v.z-v.pz)/Math.max(dt,1e-4);v.px=v.x;v.pz=v.z;const s=stn(v,-55,0,0);v.wake.feed(s.x,s.z,clamp(sp/10,0,1),0,0,7);}}}
function syncHarbour(){for(const t of tugs)t.sync();for(const w of wakes)w.draw();}
const bezAt=(P,u,o)=>{const a=1-u,b0=a*a*a,b1=3*a*a*u,b2=3*a*u*u,b3=u*u*u;o.x=b0*P[0][0]+b1*P[1][0]+b2*P[2][0]+b3*P[3][0];o.z=b0*P[0][1]+b1*P[1][1]+b2*P[2][1]+b3*P[3][1];
  const tx=3*a*a*(P[1][0]-P[0][0])+6*a*u*(P[2][0]-P[1][0])+3*u*u*(P[3][0]-P[2][0]),tz=3*a*a*(P[1][1]-P[0][1])+6*a*u*(P[2][1]-P[1][1])+3*u*u*(P[3][1]-P[2][1]);o.rot=Math.atan2(-tz,tx);return o;};
const inPath=cx=>[[cx+1300,-190],[cx+800,-215],[cx+330,-100],[cx,-100]],U_JOIN=.86;
// the tugs go out ahead of the ship and wait where they will fall in
function tugsAway(b,name){const hold=bezAt(inPath(b.cx),U_JOIN,{x:0,z:0,rot:0});hold.u=0;
  tugs[0].tgt=()=>stn(hold,94,0,0);tugs[1].tgt=()=>stn(hold,-40,-44,0);for(const t of tugs){t.status='Proceeding to meet '+name;t.assist=null;t.fast=null;t.push=false;}return hold;}
function* shipArrive(v,b){
  const cx=b.cx,P=inPath(cx),A=tugs[0],B=tugs[1],q={x:0,z:0,rot:0},hold=bezAt(P,U_JOIN,{x:0,z:0,rot:0});let t=0,made=false;
  v.wake=new Wake(40,17,46,15);wakes.push(v.wake);bezAt(P,0,q);v.setPos(q.x,q.z,q.rot);v.px=v.x;v.pz=v.z;v.status='Inbound';
  A.assist=B.assist=v;A.status=B.status='Waiting for '+v.name;A.tgt=()=>made?stn(v,94,0,0):stn(hold,94,0,0);B.tgt=()=>made?stn(v,-40,-15.4,0):stn(hold,-40,-44,0);
  while(t<60){t+=(yield)||0;const u=1-Math.pow(1-clamp(t/60,0,1),3);bezAt(P,u,q);v.setPos(q.x,q.z,q.rot);
    if(u>=U_JOIN&&!made){made=true;A.fast={v,lx:59,lz:0};A.status='Towing '+v.name;B.status='Alongside '+v.name;v.status='Tugs made fast';ev('vessel',`${v.name} · ${A.name} fast forward, ${B.name} on the quarter`,v);}}
  v.setPos(cx,-100,Math.PI);
  // swing bow-out: one tug hauls the bow round on the line, the other shoulders the stern the opposite way
  v.status='Swinging';A.fast={v,lx:58,lz:-4};A.tgt=()=>stn(v,56,-41,Math.PI/2);A.status='Pulling the bow round';B.tgt=()=>stn(v,-42,-23.7,-Math.PI/2);B.status='Pushing the stern';
  t=0;while(t<3||!(A.on&&B.on)&&t<9)t+=(yield)||0;B.push=true;
  t=0;while(t<20){t+=(yield)||0;v.setPos(cx,-100,Math.PI*(1+ease(clamp(t/20,0,1))));}
  v.setPos(cx,-100,0);B.push=false;
  // press her alongside
  v.status='Berthing';A.fast=null;A.tgt=()=>stn(v,34,-23.7,-Math.PI/2);B.tgt=()=>stn(v,-34,-23.7,-Math.PI/2);A.status=B.status='Pushing '+v.name+' alongside';
  t=0;while(t<3||!(A.on&&B.on)&&t<9)t+=(yield)||0;A.push=B.push=true;
  yield* glide(v,cx,BZ,18,ease);v.setPos(cx,BZ,0);
  A.push=B.push=false;for(const [g,o] of [[A,34],[B,-34]]){g.jobs++;g.status='Standing off';g.tgt=()=>({x:cx+o,z:BZ-58,h:-Math.PI/2,dp:true,spd:5});}
  cos.push((function*(){yield* sleep(7);for(const g of [A,B])if(g.assist===v&&g.status==='Standing off'){g.tgt=null;g.status='Returning to berth';}})());
  const i=wakes.indexOf(v.wake);if(i>=0)wakes.splice(i,1);scene.remove(v.wake.mesh);v.wake.mesh.geometry.dispose();v.wake=null;
}
function* shipDepart(v,b){
  const cx=b.cx,A=tugs[0],B=tugs[1],q={x:0,z:0,rot:0};let t=0;
  A.assist=B.assist=v;A.fast=B.fast=null;A.push=B.push=false;A.status=B.status='Proceeding to '+v.name;A.tgt=()=>stn(v,36,-50,Math.PI/2);B.tgt=()=>stn(v,-36,-50,Math.PI/2);
  while(!(A.on&&B.on)&&t<110)t+=(yield)||0;
  A.fast={v,lx:36,lz:-9.9,y:DECK+.9};B.fast={v,lx:-36,lz:-9.9,y:DECK+.9};A.status=B.status='Pulling '+v.name+' off the berth';v.status='Unberthing';ev('vessel',`${v.name} singled up · tugs fast`,v);yield* sleep(2.5);
  v.wake=new Wake(40,17,46,15);wakes.push(v.wake);v.px=v.x;v.pz=v.z;A.push=B.push=true;
  yield* glide(v,cx,-86,16,ease);A.push=B.push=false;A.fast=B.fast=null;A.jobs++;B.jobs++;
  B.tgt=null;B.status='Returning to berth';A.tgt=()=>stn(v,26,-48,0);A.status='Escorting '+v.name;v.status='Departing';ev('vessel',`${v.name} sailed from ${b.name}`,null);
  const P=[[cx,-86],[cx+330,-86],[cx+800,-215],[cx+1350,-190]];t=0;
  while(t<46){t+=(yield)||0;const u=Math.pow(clamp(t/46,0,1),2.1);bezAt(P,u,q);v.setPos(q.x,q.z,q.rot);if(u>.2&&A.tgt){A.tgt=null;A.status='Returning to berth';}}
  const i=wakes.indexOf(v.wake);if(i>=0)wakes.splice(i,1);scene.remove(v.wake.mesh);v.wake.mesh.geometry.dispose();v.wake=null;
}
