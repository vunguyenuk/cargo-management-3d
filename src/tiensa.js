/* ---------- Tiên Sa, west quay: a second terminal ----------
   The west quay of Tiên Sa is worked by the same code as the main terminal (Terminal, in the world file), in a frame of its own (TSF, in the
   harbour file): one berth for ships up to 200 m, three working quay cranes and a spare, six yard blocks under gantries, its own tractors, its
   own gate. What is particular to the place is here: how a haulier gets from Yết Kiêu through the port to that gate and back, how a ship is
   brought alongside and taken off by the port's two tugs, and the paint and furniture on the ground. Everything a terminal does in its own
   frame it does here in TSF; the road outside is in the scene's frame, and a truck changes from one to the other on the link behind the gate. */
const TS=(()=>{
  const F=TSF,VX=[-94,0,94],LN=[32,58,84],BK=108,GZ=132,LZ=158,BX=47,NBT=5,QX0=-112,QX1=186,L2=2.2;
  const pt=(x,z)=>{const s=F.w(x,z);return {x:s[0],z:s[1]};};
  let T2=null;   // the terminal, once it is built

  // ---- the way in and out for hauliers ----
  // Yết Kiêu westbound to the junction, in at the port gate (a pause there), down the port's own road to the back of the west quay, right onto the
  // link and so to the terminal gate; out the same way on the other side of each road and back along Yết Kiêu eastbound
  const W14=RD.way(14),S6=RD.sw(6),x6=z=>-97+(186-z)*6/155,run=(x0,x1,z)=>{const n=Math.ceil(Math.abs(x1-x0)/6),o=[];for(let i=0;i<=n;i++)o.push(F.m(x0+(x1-x0)*i/n,z));return o;};
  const nearL=(pts,x,z)=>{let b=0,bd=1e9;pts.forEach((p,i)=>{const l=F.lm(p[0],p[1]),d=(l[0]-x)**2+(l[1]-z)**2;if(d<bd){bd=d;b=i;}});return b;};
  // the port's road as far down as the link: its right-hand side going in, the other side coming back
  const s6i=RD.side(S6,L2),in6=s6i.slice(0,nearL(s6i,x6(LZ)+L2,LZ+2.3)+1),s6o=RD.side(RD.rev(S6),L2),out6=s6o.slice(nearL(s6o,x6(LZ)-L2,LZ-2.3));
  const xi=F.lm(...in6[in6.length-1])[0],xo=F.lm(...out6[0])[0],PINp=[[RD.sw(4),9],[in6,8],[run(xi,-70,LZ+2.3),9]],POUTp=[run(-70,xo,LZ-2.3),[out6,9],[RD.sw(14),8]];
  const TSin=RD.chain(...RD.WBTp,...PINp),TSout=RD.chain(...POUTp,[RD.S62,10],...RD.EBTp.slice(1));RD.pave([TSin,TSout],1.6);
  const gateP=pt(2023-F.X1,637),iGate=RD.near(TSin,gateP),iOut=RD.near(TSout,RD.sim(...W14[W14.length-1])),portOutP=TSout[RD.near(TSout,pt(2008-F.X1,650))];
  const inside=(pts,R=3.4,self)=>{for(const o of T2.trucks){if(!o.active||o===self)continue;for(const q of o.body)for(const p of pts){const dx=q.x-p.x,dz=q.z-p.z;if(dx*dx+dz*dz<R*R)return true;}}return false;};
  const line=(x0,x1,z,n=8)=>{const o=[];for(let i=0;i<=n;i++)o.push({x:x0+(x1-x0)*i/n,z});return o;};
  const entry=line(-78,-44,LZ+2.3),inLast=RD.stretch(TSin,TSin.length-6,TSin.length-1),outUp=RD.stretch(TSout,0,10).concat(RD.stretch(TSin,RD.back(TSin,TSin.length-1,60),TSin.length-1));
  // The frame changes on the link, and a truck sees only the trucks of the frame she is in. So the last stretch before the change is a block for one truck at
  // a time each way: going in she waits short of it until nobody is on it ahead of her in either frame; coming out she waits until the truck ahead
  // has changed over and drawn well clear along the port road
  const road={name:'Đ. Yết Kiêu',out:'Port gate, then Đ. Yết Kiêu eastbound',
    startFree:(tr,nearBy)=>{if(simT<RD.spawn)return false;const i=nearBy?RD.back(TSin,iGate,nearBy):0;if(RD.busy(tr,[TSin[i],TSin[i+1]],14))return false;RD.spawn=simT+4;return true;},
    *toGate(tr,nearBy,onGate){TM.adopt(tr);const i=nearBy?RD.back(TSin,iGate,nearBy):0,t=RD.through(tr,TSin,24,40),t2=RD.thru2(tr,TSin,30,28,1);tr.vmax=14.5;
      const h={p:gateP,near:1.5,ok:(q,st)=>{if(!st)return false;if(h.t0===undefined){h.t0=simT;tr.status='Port gate check';}return simT-h.t0>3;}};
      yield* drive(tr,TSin.slice(i),{thru:true,holds:t2.holds.concat(t.holds,[h,{p:TSin[TSin.length-6],near:14,ok:()=>!inside(entry)&&!RD.busy(tr,inLast)}]),marks:t2.marks.concat(t.marks,[{p:TSin[Math.min(TSin.length-1,iGate+2)],fn:()=>{tr.vmax=7.5;tr.status='In Tiên Sa port';tr.dest='West quay gate';}}])});
      RD.free(tr);T2.adopt(tr);onGate();tr.vmax=8.2;
      yield* T2.drive(tr,[{x:-70,z:LZ+2.3},{x:OFF,z:LZ+2.3},{x:OFF,z:T2.K.GATE_IN}]);},
    *fromGate(tr,E,onRoad){yield* T2.drive(tr,[E,{x:-OFF,z:LZ-2.3},{x:-70,z:LZ-2.3}],{thru:true,holds:[{p:{x:-52,z:LZ-2.3},near:12,ok:()=>!RD.busy(tr,outUp)&&!T2.trucks.some(o=>o!==tr&&o.active&&Math.abs(o.pos.z-(LZ-2.3))<1.5&&o.pos.x<tr.pos.x-1&&o.pos.x>-80)}]});
      TM.adopt(tr);tr.vmax=7.5;tr.status='In Tiên Sa port';
      const t2=RD.thru2(tr,TSout,30,34,1);
      yield* drive(tr,TSout,{holds:[{p:TSout[RD.back(TSout,iOut,24)],near:4,ok:RD.NODEM.take(tr)}].concat(t2.holds),marks:[{p:portOutP,fn:()=>{tr.vmax=14.5;onRoad();}},{p:TSout[iOut+5],fn:RD.NODEM.drop(tr)}].concat(t2.marks)});
      RD.free(tr);tr.vmax=8.2;}};

  // ---- the port's tugs and how a ship is handled ----
  const mkTug=(k,f,name,hex,mx)=>{const [hx,hz]=F.lm(f.x,f.z),t=new Tug(k,name,hex,{home:{x:hx,z:hz,h:Math.atan2(-(-26-hz),mx-hx)},mouth:{x:mx,z:-26},berth:'Tug basin, Tiên Sa',owner:'Tiên Sa Port',frame:F});t.L=20;t.W=7;seaOn(t,1);return t;};
  const tugA=mkTug(0,HB.live.tug1,'TS TUG 01',0x1f6f8f,-158),tugB=mkTug(1,HB.live.tug2,'TS TUG 02',0xd9b02a,-184);AMB.push(tugA,tugB);pairTugs(tugA,tugB);
  const tsPort={busy:null},HOLD=.84,TIN=125,q0=()=>({x:0,z:0,rot:0});
  // in from the bay heading down the quay, well off it; SW is where she is swung, far enough out for her length to clear the cope
  const swz=L=>-(L/2+24),inPath=(cx,L)=>[[cx+870,-440],[cx+520,-300],[cx+190,swz(L)],[cx,swz(L)]];
  const wakeOn=v=>{v.wake=new Wake(40,v.W*.9,v.W*2.4,15);wakes.push(v.wake);v.px=v.x;v.pz=v.z;},wakeOff=v=>{const i=wakes.indexOf(v.wake);if(i>=0)wakes.splice(i,1);scene.remove(v.wake.mesh);v.wake.mesh.geometry.dispose();v.wake=null;};
  const lineY=v=>v.cols[0].stacks[0].y0+1.2;
  function away(b,plan){const L=plan.cls.L,hw=plan.cls.W/2,hold=bezAt(inPath(b.cx,L),HOLD,q0());tugA.tgt=()=>stn(hold,L/2+13,0,0);tugB.tgt=()=>stn(hold,-L*.3,-(hw+34),0);
    for(const t of [tugA,tugB]){t.status='Proceeding to meet '+plan.name;t.assist=null;t.fast=null;t.push=false;}}
  function* arrive(v,b){const cx=b.cx,L=v.L,hw=v.W/2,A=tugA,B=tugB,q=q0(),P=inPath(cx,L),hold=bezAt(P,HOLD,q0()),sw=swz(L);let t=0,made=false;
    bezAt(P,0,q);v.setPos(q.x,q.z,q.rot);wakeOn(v);seaOn(v,0);v.status='Inbound';
    // one tug ahead of the bow on a line, the other on the quarter, on the side that will be seaward once she has been swung
    A.assist=B.assist=v;A.fast=B.fast=null;A.push=B.push=false;A.status=B.status='Waiting for '+v.name;
    A.tgt=()=>made?stn(v,L/2+13,0,0):stn(hold,L/2+13,0,0);B.tgt=()=>made?stn(v,-L*.3,-(hw+9),0):stn(hold,-L*.3,-(hw+34),0);
    while(t<TIN){t+=((yield)||0)*seaWay(v);const u=1-Math.pow(1-clamp(t/TIN,0,1),2);bezAt(P,u,q);v.setPos(q.x,q.z,q.rot);
      if(u>=HOLD&&!made){made=true;A.fast={v,lx:L/2+1,lz:0,y:lineY(v)};A.status='Towing '+v.name;B.status='Alongside '+v.name;v.status='Tugs made fast';ev('vessel',`Tiên Sa · ${v.name} · ${A.name} fast forward, ${B.name} on the quarter`,v);}}
    v.setPos(cx,sw,Math.PI);
    // swing her bow out: one tug shoulders the bow round, the other hauls the stern the other way on its line; both end on her seaward side
    v.status='Swinging';A.fast=null;A.tgt=()=>stn(v,L*.4,-(hw+10.8),-Math.PI/2);A.status='Pushing the bow round';B.fast={v,lx:-L*.4,lz:-hw,y:lineY(v)};B.tgt=()=>stn(v,-L*.4,-(hw+38),Math.PI/2);B.status='Hauling the stern round';
    t=0;while(t<4||!(A.on&&B.on)&&t<40)t+=(yield)||0;A.push=true;
    t=0;while(t<36){t+=(yield)||0;v.setPos(cx,sw,Math.PI*(1-ease(clamp(t/36,0,1))));}v.setPos(cx,sw,0);A.push=false;B.fast=null;
    // press her alongside
    v.status='Berthing';A.tgt=()=>stn(v,L*.3,-(hw+10.8),-Math.PI/2);B.tgt=()=>stn(v,-L*.3,-(hw+10.8),-Math.PI/2);A.status=B.status='Pushing '+v.name+' alongside';
    t=0;while(t<3||!(A.on&&B.on)&&t<30)t+=(yield)||0;A.push=B.push=true;
    t=0;while(t<26){t+=(yield)||0;v.setPos(cx,lerp(sw,v.bz,ease(clamp(t/26,0,1))),0);}v.setPos(cx,v.bz,0);
    A.push=B.push=false;for(const [g,o] of [[A,L*.3],[B,-L*.3]]){g.jobs++;g.status='Standing off';const p=stn(v,o,-(hw+52),-Math.PI/2);p.dp=true;p.spd=5;g.tgt=()=>p;}
    cos.push((function*(){yield* sleep(8);for(const g of [A,B])if(g.assist===v&&g.status==='Standing off'){g.tgt=null;g.status='Returning to berth';}})());wakeOff(v);seaOff(v);}
  function* depart(v,b){const cx=b.cx,L=v.L,hw=v.W/2,A=tugA,B=tugB,q=q0(),off=-(hw+74);let t=0;
    A.assist=B.assist=v;A.fast=B.fast=null;A.push=B.push=false;A.status=B.status='Proceeding to '+v.name;A.tgt=()=>stn(v,L*.3,-(hw+42),Math.PI/2);B.tgt=()=>stn(v,-L*.3,-(hw+42),Math.PI/2);
    while(!(A.on&&B.on)&&t<170)t+=(yield)||0;
    A.fast={v,lx:L*.3,lz:-hw,y:lineY(v)};B.fast={v,lx:-L*.3,lz:-hw,y:lineY(v)};A.status=B.status='Pulling '+v.name+' off the berth';v.status='Unberthing';ev('vessel',`${v.name} singled up · tugs fast`,v);yield* sleep(2.5);
    wakeOn(v);seaOn(v,0);A.push=B.push=true;t=0;while(t<30){t+=(yield)||0;v.setPos(cx,lerp(v.bz,off,ease(clamp(t/30,0,1))),0);}
    A.push=B.push=false;A.fast=B.fast=null;A.jobs++;B.jobs++;{const h={x:B.x,z:B.z,h:B.h,dp:true};B.tgt=()=>h;B.status='Standing clear';}A.tgt=()=>stn(v,30,-(hw+42),0);A.status='Escorting '+v.name;v.status='Departing';ev('vessel',`${v.name} sailed from ${b.name}`,null);
    const P=[[cx,off],[cx+200,off-6],[cx+440,-270],[cx+940,-440]],TOUT=95;t=0;
    while(t<TOUT){t+=((yield)||0)*seaWay(v);const u=Math.pow(clamp(t/TOUT,0,1),2.1);bezAt(P,u,q);v.setPos(q.x,q.z,q.rot);if(u>.1&&B.tgt){B.tgt=null;B.status='Returning to berth';}if(u>.2&&A.tgt){A.tgt=null;A.status='Returning to berth';}}
    wakeOff(v);seaOff(v);}

  // ---- paint and furniture ----
  function dress({quad,ln,arrow,decal,HOST,blocks}){
    const WH=0xf1eee6,YE=0xe2a81a,CONC=0xb8b6b0,PADC=0xa2a19e,JOINT=0xa09e98,ASPH=0x8b8b8e,[V0,,V2]=VX;
    quad(ASPH,V0-12,25,V2-V0+24,BK+5.4-25,.006);quad(CONC,QX0,0,QX1-QX0,25,.012);
    for(let x=QX0+7;x<QX1;x+=7)ln(JOINT,x,1.8,x,25,.07,0,0,.02);for(const z of [8,15,22])ln(JOINT,QX0,z,QX1,z,.07,0,0,.02);
    quad(0x7c7c80,V0-4.7,5.2,V2-V0+9.4,10.6,.016);for(const h of [-1,1])decal('STANDBY',h*BX,13,.9,'#b4aea6');
    const VSEG=[[16,28.5],[35.5,54.5],[61.5,80.5],[87.5,103.4]],HSEG=[[V0+4.7,-4.7],[4.7,V2-4.7]];
    for(const v of VX)for(const [a,b] of VSEG){ln(WH,v-4.7,a,v-4.7,b);ln(WH,v+4.7,a,v+4.7,b);ln(YE,v,a,v,b,.15,3,3);}
    for(const z of LN)for(const [a,b] of HSEG){ln(WH,a,z-3.5,b,z-3.5);ln(WH,a,z+3.5,b,z+3.5,.15,2,2);for(let x=a+12;x<b-6;x+=26)arrow(WH,x,z,Math.PI);}
    for(const [a,b] of HSEG){ln(YE,a,5.2,b,5.2,.2,2.4,1.6);ln(YE,a,15.8,b,15.8,.2,2.4,1.6);ln(WH,a,10.5,b,10.5,.12,1.6,2.4);for(let x=a+22;x<b-4;x+=24)arrow(WH,x,13,0);ln(WH,a,103.4,b,103.4);ln(WH,a,112.6,b,112.6);for(let x=a+10;x<b-4;x+=24){arrow(YE,x,8,0);arrow(WH,x,BK,0);}}
    for(const b of blocks){const z0=b.lane+4.6-CW/2-.5,x0=b.x0-CL/2-.6,w=(NBT-1)*BAYP+CL;quad(PADC,x0,z0,w+1.2,4*ROWP+CW+1,.012);
      for(const s of b.stacks){const xa=s.x-CL/2,xb=s.x+CL/2,za=s.z-CW/2,zb=s.z+CW/2;ln(YE,xa,za,xb,za,.1);ln(YE,xa,zb,xb,zb,.1);ln(YE,xa,za,xa,zb,.1);ln(YE,xb,za,xb,zb,.1);}
      const zl=b.lane+4.6+4*ROWP+CW/2;for(let i=0;i<NBT;i++)decal(pad2(i+1),b.x0+i*BAYP,zl+1.5,1.3,'#f1eee6');decal('BLOCK '+b.name,b.cx,zl+3.3,1.7,'#f1eee6');
      for(const z of [b.lane-4.3,zl+1.8]){ln(0x6f6b68,x0-2,z-.55,x0+w+3.2,z-.55,.1);ln(0x6f6b68,x0-2,z+.55,x0+w+3.2,z+.55,.1);}}
    decal('WEST QUAY',10,21.4,2.4,'#e2a81a');for(let x=QX0+10;x<=QX1-8;x+=14)decal(String(Math.round((x-QX0-10)/14)+1),x,4.6,.9,'#8a857f');
    // gate apron and the link out to the port road
    quad(ASPH,-9.5,112.6,19,LZ+7.5-112.6,.008);quad(ASPH,V0-7,LZ-7.5,9.5-(V0-7),15,.008);
    ln(WH,-9.5,112.6,-9.5,LZ-7.5);ln(WH,9.5,112.6,9.5,LZ+7.5);ln(YE,0,112.6,0,LZ-8,.14);ln(WH,V0+2,LZ-7.5,-9.5,LZ-7.5);ln(WH,V0+2,LZ+7.5,9.5,LZ+7.5);ln(YE,V0+6,LZ,-10,LZ,.14,3,3);
    quad(WH,-4,GZ+4.35,3.6,.45,.035);quad(WH,.4,GZ-4.8,3.6,.45,.035);decal('OUT',-OFF,143,1.5,'#f1eee6');decal('IN',OFF,146,1.5,'#f1eee6');arrow(WH,-OFF,119,-Math.PI/2);arrow(WH,OFF,121,Math.PI/2);
    for(let x=-76;x<=-30;x+=3)ln(WH,x,132.5,x,137.5,.12);
    // gate canopy, booths, OCR portal; operations building; yard masts
    const B=new Builder(),conc=M_(0xa9a297),dark=M_(0x2a2629),cream=M_(0xece6da),glass=M_(0x1f3640,{roughness:.2,metalness:.2}),roof=M_(0xe3a81c),roofD=M_(0xb98a1a),steel=M_(0x6f6a6c,{roughness:.6}),lamp=M_(0xfff0c8,{emissive:0xffc978,emissiveIntensity:1}),white=M_(0xf3f1ec);
    B.box(M_(0xdedbd3),32,.3,9,0,6.92,GZ);B.box(roof,32.4,.75,9.4,0,6.4,GZ);B.box(white,32.5,.2,9.5,0,6.05,GZ);for(const x of [-15,-5.8,5.8,15])B.box(white,.5,6.1,.5,x,3.05,GZ);
    for(const x of [-5.8,5.8]){B.box(white,1.9,2.7,3.2,x,1.55,GZ);B.box(glass,1.95,1,3.25,x,2.05,GZ);B.box(roofD,2.3,.18,3.6,x,3,GZ);B.box(conc,2.5,.22,6,x,.11,GZ);}B.box(conc,.9,.22,12,0,.11,GZ);
    {const z=GZ+14;for(const x of [-9.8,9.8])B.box(steel,.3,6.6,.3,x,3.3,z);B.box(steel,19.9,.3,.3,0,6.5,z);for(const x of [-OFF,OFF]){B.box(dark,.5,.4,.5,x,6.1,z);B.box(lamp,.3,.2,.1,x,5.9,z-.3);}}
    B.box(cream,46,8.4,11,-53,4.2,123);for(const y of [2.4,5.6])B.box(glass,46.1,1.4,11.1,-53,y,123);B.box(M_(0xd8d0c2),47,.5,12,-53,8.65,123);B.box(steel,3,1.4,2.4,-62,9.6,122);
    for(const x of [V0-9,-8.5,8.5,V2+9])for(const z of [52.5,78.5]){B.cyl(steel,.28,28,x,14,z,0,0,0,8,.14);B.cyl(steel,.8,.3,x,28.1,z,0,0,0,10);for(const a of [0,1,2,3])B.box(lamp,.9,.22,.5,x+Math.cos(a*Math.PI/2)*1.1,27.8,z+Math.sin(a*Math.PI/2)*1.1,0,a*Math.PI/2,0);
      const s=F.w(x,z);LAMPS.push([s[0],28,s[1],2,0xffe9c4,0,46]);}
    for(const [x,z] of [[-OFF,GZ+15.6],[OFF,GZ+15.6],[-11,GZ],[-3,GZ],[3,GZ],[11,GZ],[-53,123]]){const s=F.w(x,z);LAMPS.push([s[0],x===-53?9.4:5.9,s[1],x===-53?0:1,0xffe2b0]);}
    HOST.add(B.build());}

  const K={LQ,LS,HZ,ROADS,HDIR,VXS:VX,OFF,LANES:LN,GX0:QX0,GX1:QX1,GZ1:166,FENCE_Z:140,GATE_Z:GZ,GATE_IN:GZ+6.5,GATE_OUT:GZ-6.5,BOOM,NB:NBT,NR,BZ:-17.6,BACK:BK,BCX:BX,
    host:F.host,frame:F,name:'Tiên Sa Port · West Quay',code:'TSA',short:'Tiên Sa',pre:'TS-',evp:'Tiên Sa · ',blockNames:['W1','W2','W3','W4','W5','W6'],fill:[.78,.6,.46,.7,.52,.36],classes:['L','S'],
    berths:[{id:'TS1',name:'West Quay',cx:10,half:0,exitX:94,lapX:-58}],
    cranes:[{id:'TS-QC1',b:0,g:-41.7},{id:'TS-QC2',b:0,g:13.5},{id:'TS-QC3',b:0,g:54.9,park:104},{id:'TS-QC4',b:0,g:152,park:152}],craneHex:0xe3a81c,craneHexD:0xb98a1a,boomL:37,
    tts:8,slots:[[74,55,36,17],[-19.5,-38.5,-57.5,-76.5]],ttId:n=>'TS-TT'+pad2(n),ttHex:0xe9b21f,ttStripe:0x24507a,exts:22,rtgId:n=>'TS-RTG-'+n,stats:{total:268,turn:[8.4,9.1,7.8,8.6],gateDone:21},
    sea:{port:()=>tsPort,away,arrive,depart,arriveS:()=>6+TIN+40+36+30+26},road,dress};
  T2=Terminal(K);TERMS.push(T2);tugA.T=tugB.T=T2;
  // her wake is laid in the scene's frame
  AMB.push({step(dt){const v=T2.berths[0].vessel;if(v&&v.wake){const sp=Math.hypot(v.x-v.px,v.z-v.pz)/Math.max(dt,1e-4);v.px=v.x;v.pz=v.z;const s=stn(v,-v.L*.47,0,0),w=F.w(s.x,s.z);v.wake.feed(w[0],w[1],clamp(sp/10,0,1),0,0,7);}},sync(){}});
  return Object.assign(T2,{tugs:[tugA,tugB],port:tsPort,TSin,TSout});
})();
