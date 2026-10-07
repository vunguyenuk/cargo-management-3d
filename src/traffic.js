/* ---------- traffic outside the terminal ----------
   Road vehicles out here drive with the terminal's own engine (drive, in the world file): each sweeps the lane ahead of it and brakes for
   whatever is there. One file of traffic runs each way along Yết Kiêu, over Mân Quang bridge and on into Nại Hiên Đông; the terminal's
   hauliers and the trucks bound for Tiên Sa join it and leave it at their gates. Everything here is in terminal coordinates. */
const hri=(a,b)=>Math.floor(hr(a,b+1));   // this file draws from the shore's own run of random numbers, so the terminal's is left as it was
// outlines do not thin with distance, so a small craft far off would turn into a dark blot: hers are dropped beyond a few hundred metres
const farEdge=g=>{const l=g.children.find(o=>o.isLineSegments);return (x,z)=>{l.visible=(cam.position.x-x)**2+(cam.position.z-z)**2+cam.position.y**2<422500;};};
const RD=(()=>{
  const L=2.3,way=i=>{const h=MAP.hw[i],p=[];for(let k=1;k+1<h.length;k+=2)p.push([h[k],h[k+1]]);return p;},rev=p=>p.slice().reverse();
  // a line moved sideways, positive to the right of travel
  const side=(pts,off)=>pts.map((p,i)=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];let tx=b[0]-a[0],tz=b[1]-a[1];const l=Math.hypot(tx,tz)||1;return [p[0]-tz/l*off,p[1]+tx/l*off];});
  // pieces joined into one lane: points that crowd or double back at the joints are dropped, the line is smoothed and carried into terminal coordinates
  const lane=(...parts)=>{const o=[];for(const p of parts.flat()){const l=o[o.length-1],k=o[o.length-2];if(l&&Math.hypot(p[0]-l[0],p[1]-l[1])<7)continue;if(k&&Math.hypot(p[0]-l[0],p[1]-l[1])<24&&(l[0]-k[0])*(p[0]-l[0])+(l[1]-k[1])*(p[1]-l[1])<0)continue;o.push(p);}
    return smoothLine(o,9).map(([x,z])=>{const s=toSim(x,z);return {x:s[0],z:s[1]};});};
  const sim=(x,z)=>{const s=toSim(x,z);return {x:s[0],z:s[1]};},near=(pts,q)=>{let b=0,bd=1e9;pts.forEach((p,i)=>{const d=(p.x-q.x)**2+(p.z-q.z)**2;if(d<bd){bd=d;b=i;}});return b;};
  // i steps back along a line by a distance
  const back=(pts,i,d)=>{while(i>0&&d>0){d-=Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z);i--;}return i;};
  // points every few metres along a stretch of lane, for asking whether it is empty
  const stretch=(pts,i0,i1)=>{const o=[];for(let i=i0;i<i1;i++){const a=pts[i],b=pts[i+1];o.push(a,{x:(a.x+b.x)/2,z:(a.z+b.z)/2});}return o;};
  const busy=(self,pts,R=3.2)=>{for(const o of trucks){if(o===self||!o.active)continue;for(const q of o.body)for(const p of pts){const dx=q.x-p.x,dz=q.z-p.z;if(dx*dx+dz*dz<R*R)return true;}}return false;};

  // a long straight given by its two ends is filled in
  const dense=(p,st=30)=>{const o=[];for(let i=0;i<p.length-1;i++){const a=p[i],b=p[i+1],n=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/st));for(let k=0;k<n;k++)o.push([a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n]);}o.push(p[p.length-1]);return o;};
  // the centreline of a mapped way exactly as the harbour file draws it, so that a lane offset from it stays on the asphalt
  const sw=i=>{const r=way(i);return r.length>2?smoothLine(r,5):dense(r,10);};
  // one piece of lane run into the next: the end of the first and the start of the second are cut back a few metres and the gap is bridged by a
  // curve that leaves the one and meets the other in its own direction, whether they simply carry on or turn a corner
  const trim=(p,d)=>{p=p.slice();while(p.length>2){const a=p[p.length-2],b=p[p.length-1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);if(l>d){p[p.length-1]=[b[0]+(a[0]-b[0])*d/l,b[1]+(a[1]-b[1])*d/l];break;}d-=l;p.pop();}return p;};
  const join=(a,b,ta=8,tb=ta)=>{a=trim(a,ta);b=rev(trim(rev(b),tb));const p0=a[a.length-1],q=a[a.length-2],p3=b[0],r=b[1],d=Math.hypot(p3[0]-p0[0],p3[1]-p0[1]),h=d*.38,
      ul=Math.hypot(p0[0]-q[0],p0[1]-q[1])||1,vl=Math.hypot(r[0]-p3[0],r[1]-p3[1])||1,p1=[p0[0]+(p0[0]-q[0])/ul*h,p0[1]+(p0[1]-q[1])/ul*h],p2=[p3[0]-(r[0]-p3[0])/vl*h,p3[1]-(r[1]-p3[1])/vl*h],n=Math.max(2,Math.ceil(d/4)),o=a.slice();
    for(let i=1;i<n;i++){const t=i/n,m=1-t;o.push([m*m*m*p0[0]+3*m*m*t*p1[0]+3*m*t*t*p2[0]+t*t*t*p3[0],m*m*m*p0[1]+3*m*m*t*p1[1]+3*m*t*t*p2[1]+t*t*t*p3[1]]);}return o.concat(b);};
  // a lane made of pieces: [points, metres cut back at the joint before it]
  const chain=(...parts)=>{let o=null;for(const P of parts){const [p,t]=Array.isArray(P[0][0])?P:[P,8];o=o?join(o,p,t):p;}const c=[o[0]];for(const p of o){const l=c[c.length-1];if(Math.hypot(p[0]-l[0],p[1]-l[1])>1.2)c.push(p);}
    return smoothLine(c,8).map(([x,z])=>{const s=toSim(x,z);return {x:s[0],z:s[1]};});};

  // ways of the map data: Yết Kiêu's two carriageways (8 westbound; 62, 61 and 2 eastbound, which runs into the other 290 m short of the Lê Đức Thọ junction),
  // Lê Đức Thọ (52 and 5), the bridge, the causeway (81 and 3), and the pieces the harbour file adds where the map stops (from HWX on)
  const W8=way(8),dk=(v,dir)=>{const o=[];for(let u=-44;u<=BR.L+44.1;u+=(BR.L+88)/40)o.push(BR.at(u,v));return dir>0?o:o.reverse();};
  const bu=p=>(p[0]-BR.A[0])*BR.ux+(p[1]-BR.A[1])*BR.uz,offA=p=>bu(p)<-47,offB=p=>bu(p)>BR.L+47,cum=p=>{const c=[0];for(let i=1;i<p.length;i++)c.push(c[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));return c;};
  const S8=sw(8),c8=cum(S8),twS=rev(S8.filter((p,i)=>c8[i]<=290)),RS=smoothLine(ROAD_S,5),RX=RS.concat(ROAD_X.slice(ROAD_S.length)),RY=smoothLine(ROAD_Y,5).slice(0,-5);   // the lane stops short of where the drawn road does, so a truck comes into being and goes out of it on asphalt
  const iR1=(()=>{let b=0,bd=1e9;RS.forEach((p,i)=>{const d=Math.hypot(p[0]-ROAD_S[1][0],p[1]-ROAD_S[1][1]);if(d<bd){bd=d;b=i;}});return b;})();
  const c62=cum(sw(62)),S62=side(sw(62),L),L9=1.9;   // the beach road is narrower: its lanes sit closer in
  const ebHead=[S62,side(sw(61),L),side(sw(2),L),[side(sw(HWX+3),L),14],[side(twS,L),14]],ebTail=ebHead.slice(1);
  const wbParts=[side(rev(RX.slice(iR1)),L),[side(rev(sw(HWX+2)),L),10],side(sw(81),L).filter(offB),[dk(5.2,-1),16],[side(sw(52),L).filter(offA),16],[side(S8,L),13]];
  const ebOn=[[side(sw(5),L).filter(offA),13],[dk(-5.2,1),16],[side(sw(3),L).filter(offB),16],[side(RX,L),10]];
  const WB=chain(...wbParts),EB=chain(...ebHead,...ebOn),S109=(()=>{const s=sw(109),e=way(109)[13];let b=0,bd=1e9;s.forEach((p,i)=>{const d=Math.hypot(p[0]-e[0],p[1]-e[1]);if(d<bd){bd=d;b=i;}});return s.slice(0,b+1);})();
  // the hauliers' lanes: up Yết Kiêu from the south-east and back down it
  const WBTp=[side(rev(RY),L),[side(S8,L),12]],EBTp=[...ebHead,[side(RY,L),12]],WBT=chain(...WBTp),EBT=chain(...EBTp);
  // cars to and from the beach road, which leaves Yết Kiêu just short of the junction: off to the right going west, and across the end of the dual carriageway coming back
  const CARW=chain(...wbParts,[side(S109,L9),11]),CARE=chain(side(rev(S109),L9),[rev(sw(18)),5],[S62.filter((p,i)=>c62[i]>19),7],...ebTail,...ebOn);
  // wherever a lane cuts the corner between two roads, or runs on past the end of one, the ground under it is paved: the mouth of a junction is splayed
  const paveM=flatMat(0x77767b,3),pave=(lanes,hw)=>{for(const P of lanes){const Q=[];for(let i=0;i<P.length-1;i++)for(let k=0;k<3;k++)Q.push({x:P[i].x+(P[i+1].x-P[i].x)*k/3,z:P[i].z+(P[i+1].z-P[i].z)*k/3});Q.push(P[P.length-1]);
      const n=Q.length,bad=Q.map((p,i)=>{const a=Q[Math.max(0,i-1)],b=Q[Math.min(n-1,i+1)],l=Math.hypot(b.x-a.x,b.z-a.z)||1,nx=-(b.z-a.z)/l*hw,nz=(b.x-a.x)/l*hw;return !HB.paved(p.x+nx,p.z+nz,.15)||!HB.paved(p.x-nx,p.z-nz,.15);});
      for(let i=0;i<n;i++){if(!bad[i])continue;let j=i;while(j+1<n&&bad[j+1])j++;const r=Q.slice(Math.max(0,i-2),Math.min(n,j+3)).map(p=>toMap(p.x,p.z));ribbon(r,2*hw+1.2,-.052,paveM);for(let k=0;k<r.length-1;k++)HB.addSeg(r[k],r[k+1],2*hw+1.2);i=j;}}
    flushRibbons();};

  // --- the junction at Tiên Sa, where the dual carriageway ends: one vehicle through it at a time ---
  const mkNode=p=>{const N={who:null,sh:new Set(),p},others=tr=>{for(const o of N.sh){if(!o.active)N.sh.delete(o);else if(o!==tr)return true;}return false;};
    N.take=tr=>()=>{if((!N.who||N.who===tr||!N.who.active)&&!others(tr)){N.who=tr;return true;}return false;};
    N.join=tr=>()=>{if(!N.who||N.who===tr||!N.who.active){N.who=null;N.sh.add(tr);return true;}return false;};   // for movements that do not cross each other: any number at once, but not with one that has the junction to itself
    N.drop=tr=>()=>{if(N.who===tr)N.who=null;N.sh.delete(tr);};return N;};
  const NODE=mkNode(sim(...W8[W8.length-1])),take=NODE.take,drop=NODE.drop;
  const through=(tr,pts,before,after,N=NODE,sh)=>{const i=near(pts,N.p);return {holds:[{p:pts[back(pts,i,before)],near:4,ok:sh?N.join(tr):N.take(tr)}],marks:[{p:pts[Math.min(pts.length-1,i+Math.ceil(after/9))],fn:N.drop(tr)}]};};
  // --- the junction at the other end, where Lê Đức Thọ comes in from the bridge: traffic off the bridge crosses the lane the hauliers leave by and joins the one they arrive by
  const NODEM=mkNode(sim(...way(62)[0]));   // where the port's way out and the beach road's traffic join the eastbound carriageway
  const NODE2=mkNode(sim(...W8[0])),thru2=(tr,pts,before,after,sh)=>through(tr,pts,before,after,NODE2,sh),free=tr=>{for(const N of [NODE,NODE2,NODEM])N.drop(tr)();};

  // --- the terminal's gate road: the median of Yết Kiêu is open in front of it, so a truck from the east turns left across the oncoming carriageway
  // straight into the gate road, and one leaving turns right. A truck for the gate moves over to the inside lane well before the opening and waits
  // there for a gap, so the traffic behind it can carry on
  const zW=WBT[near(WBT,{x:0,z:271})].z-2*L,zG=EB[near(EB,{x:0,z:253})].z,rT=13,xs=OFF-rT,arc=[];for(let a=75;a>=0;a-=15){const r=a*Math.PI/180;arc.push({x:xs+rT*Math.cos(r),z:zW-rT+rT*Math.sin(r)});}
  const iW0=near(WBT,{x:xs-4,z:zW}),iA=back(WBT,iW0,110);
  const inner=side(WBT.slice(iA+6,iW0+1).map(p=>[p.x,p.z]),-2*L).map(([x,z])=>({x,z}));
  const IN=WBT.slice(0,iA+1).concat(inner,[{x:xs,z:zW}],arc,[{x:OFF,z:zG-10},{x:OFF,z:GATE_IN}]);
  const inHold=inner[inner.length-1],inUp=stretch(EB,near(EB,{x:175,z:zG}),near(EB,{x:-9,z:zG})),inRoad={x:OFF,z:zG-10};
  const iEo=near(EBT,{x:-OFF-14,z:zG}),outPts=[{x:-OFF,z:zG}].concat(EBT.slice(iEo)),outHold={x:-OFF,z:zG-17},outUp=stretch(EB,near(EB,{x:150,z:252}),near(EB,{x:-OFF-14,z:zG})+2);

  pave([WBT,EBT,IN,outPts],1.6);pave([WB,EB,CARW,CARE],1.3);
  return {WB,EB,WBT,EBT,WBTp,EBTp,L,S62,CARW,CARE,IN,OUT:outPts,busy,NODE,NODE2,NODEM,thru2,free,sim,sw,chain,dense,rev,pave,
    spawn:0,startFree(tr,nearBy){if(simT<this.spawn)return false;const i=nearBy?back(IN,near(IN,inHold),nearBy):0;if(busy(tr,[IN[i],IN[i+1]],12))return false;this.spawn=simT+4;return true;},
    *toGate(tr,nearBy,onGate){const i=nearBy?back(IN,near(IN,inHold),nearBy):0,t=thru2(tr,IN,30,28,1);tr.vmax=14.5;
      yield* drive(tr,IN.slice(i),{holds:t.holds.concat([{p:inHold,near:14,ok:()=>!busy(tr,inUp)}]),marks:t.marks.concat([{p:inRoad,fn:()=>{tr.vmax=8.2;onGate();}}])});free(tr);tr.vmax=8.2;},
    *fromGate(tr,E,onRoad){const t=thru2(tr,outPts,30,34,1);yield* drive(tr,[E].concat(outPts),{holds:[{p:outHold,near:9,ok:()=>!busy(tr,outUp)}].concat(t.holds),marks:[{p:{x:-OFF-12,z:zG},fn:()=>{tr.vmax=14.5;onRoad();}}].concat(t.marks)});free(tr);tr.vmax=8.2;},
    // a car off the bridge crosses the hauliers' way at the southern junction; one coming back from the beach road crosses the way into the port and joins the way out of it
    carRoute:(c,west)=>{if(west){const u=thru2(c,CARW,26,30);return {pts:CARW,holds:u.holds,marks:u.marks};}
      const i=near(CARE,NODE.p),ok=()=>{for(const N of [NODE,NODEM])if(N.who&&N.who!==c&&N.who.active)return false;NODE.who=NODEM.who=c;return true;};
      return {pts:CARE,holds:[{p:CARE[back(CARE,i,30)],near:4,ok}],marks:[{p:CARE[Math.min(CARE.length-1,i+7)],fn:()=>free(c)}]};},
    back,near,side,lane,way,through,take,drop,stretch};
})();

// --- cars on the road ---
const roadCars=[];
(()=>{const kinds=['sedan','suv','pickup','sedan','suv','sedan'],cols=[0xd9d6cf,0x24365a,0xf4f2ed,0xa83a26,0x3d3f44,0x1f5f8f,0xd19a1f,0x7a8088,0x1b1c20,0xb9bdc1,0x5a7a52],tpl={};
  function* run(c,west,s0){
    for(;;){const R=RD.carRoute(c,west);let pts=R.pts;if(s0){let i=pts.length-1,d=s0;while(i>1&&d>0){d-=Math.hypot(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z);i--;}
        for(let k=R.holds.length-1;k>=0;k--){const iH=RD.near(pts,R.holds[k].p),iM=RD.near(pts,R.marks[k].p);if(i>iH-3&&i<iM+3)i=Math.max(1,iH-4);}   // nobody starts the day inside a junction: she would be in it without having been let in
        pts=pts.slice(i);s0=0;}
      yield* until(()=>!RD.busy(c,[pts[0],pts[1]],10));
      c.v=0;c.active=true;c.pop=0;c.dest=west?'Tiên Sa':'Mân Quang';c.status='On the road';
      yield* drive(c,pts,{holds:R.holds,marks:R.marks});
      RD.free(c);c.active=false;if(sel===c)select(null);c.trips++;yield* sleep(hr(5,45));west=!west;}}
  const N=54,len=p=>{let l=0;for(let i=1;i<p.length;i++)l+=Math.hypot(p[i].x-p[i-1].x,p[i].z-p[i-1].z);return l;},LW=len(RD.CARW),LE=len(RD.CARE);
  for(let i=0;i<N;i++){const kd=kinds[i%kinds.length],hex=cols[(i*7)%cols.length],key=kd+hex,g=(tpl[key]||(tpl[key]=bake(carModel(kd,hex),true))).clone(),c=new Car('CAR-'+pad2(i+1),g),west=i%2===0;
    c.amb=true;c.edge=farEdge(g);c.place(0,430,1);c.active=false;c.vmax=13.5+((i*37)%10)*.3;c.acc=3;c.plate=`43A-${hri(100,999)}.${hri(10,99)}`;roadCars.push(c);
    cos.push(run(c,west,(west?LW:LE)*(1-(Math.floor(i/2)+.5)/(N/2))+hr(-40,40)));}
})();

/* ---------- afloat: boats and ships on their own business ----------
   None of these steer round anything: each keeps to a line of its own that crosses no other, and the lines were laid clear of the terminal's ships. */
const _sp={x:0,z:0,h:0},SEA={boats:[],craft:[]};
// a smooth line through points: place and heading at a distance along it
function seaLine(pts,closed){const c=new T.CatmullRomCurve3(pts.map(p=>V(p[0],0,p[1])),!!closed,'centripetal'),len=c.getLength(),n=Math.max(8,Math.ceil(len/8)),P=c.getSpacedPoints(n),step=len/n;
  return {len,pts:P,at(s,o){s=closed?((s%len)+len)%len:clamp(s,0,len);const f=s/step,i=Math.min(n-1,Math.floor(f)),u=f-i,a=P[i],b=P[i+1];o.x=a.x+(b.x-a.x)*u;o.z=a.z+(b.z-a.z)*u;o.h=Math.atan2(-(b.z-a.z),b.x-a.x);return o;}};}
// a prop made ready to move: outlined like the vehicles, flattened to one mesh
function floatModel(S){return bake(outline(S.build()),true);}

// --- the fishing fleet: out of the harbour, under the bridge, through Vũng Thùng to the bay and back, each way in its own lane of the fairway ---
(()=>{const C=FAIRWAY,n=C.length,tan=i=>{const a=C[Math.max(0,i-1)],b=C[Math.min(n-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1]);return [(b[0]-a[0])/l,(b[1]-a[1])/l];};
  const out=C.map((p,i)=>{const t=tan(i);return [p[0]-t[1]*p[2],p[1]+t[0]*p[2]];}),inn=C.map((p,i)=>{const t=tan(i);return [p[0]+t[1]*p[2],p[1]-t[0]*p[2]];}).reverse(),t1=tan(n-1),t0=tan(0);
  const line=seaLine(out.concat([[C[n-1][0]+t1[0]*C[n-1][2]*1.1,C[n-1][1]+t1[1]*C[n-1][2]*1.1]],inn,[[C[0][0]-t0[0]*C[0][2]*1.1,C[0][1]-t0[1]*C[0][2]*1.1]]),true);SEA.fairway=line;
  const kinds=[[16,0x2f6fae,0xe8e4d8,false],[18,0x2a64a0,0xd9d2c0,true],[20,0x3b82b8,0x9fc0d8,false],[14,0x2c7f8f,0xe8e4d8,false],[18,0x3a7fa8,0xd9d2c0,true],[16,0x2a64a0,0x9fc0d8,false]].map(([L,hex,trim,sq])=>{const m=fishProp(L,hex,trim,sq);return {L,g:floatModel(m.S),light:m.light};});
  const N=20;for(let i=0;i<N;i++){const k=kinds[i%kinds.length],g=k.g.clone(),w=new Wake(14,2,7.5,7),b=seaOn({s:line.len*(i+hr(-.12,.12))/N,v:5.2,x:0,z:0,h:0,t:hr(0,6),L:k.L,W:k.L*.27,group:g},3),edge=farEdge(g);
    g.add(glowPts([[...k.light,[0xffe9c4,0x9fe0ff,0x7dffb0][i%3]]],0));scene.add(g);wakes.push(w);line.at(b.s,_sp);b.x=_sp.x;b.z=_sp.z;b.h=_sp.h;SEA.boats.push(b);
    AMB.push({step(dt){const way=seaWay(b);b.s+=b.v*dt*way;b.t+=dt;line.at(b.s,_sp);b.x=_sp.x;b.z=_sp.z;b.h+=clamp(angDiff(_sp.h,b.h),-.6*dt,.6*dt);w.feed(b.x-Math.cos(b.h)*b.L*.45,b.z+Math.sin(b.h)*b.L*.45,.5*way,0,0,3);},
      sync(){g.position.set(b.x,WY+Math.sin(b.t*1.2)*.06,b.z);g.rotation.set(Math.sin(b.t*.8)*.025,b.h,0);edge(b.x,b.z);}});}
})();

// a vessel that is moved about by a routine of its own (the cutter, the coaster)
function seaCraft(S,L,W,name){const g=floatModel(S),w=new Wake(22,W*.7,W*2.2,9),o={kind:'craft',name,x:0,z:0,rot:0,px:0,pz:0,t:hr(0,6),L,W,group:g,status:'Alongside',hidden:false};
  scene.add(g);wakes.push(w);SEA.craft.push(o);seaOn(o,2);o.setPos=(x,z,rot)=>{o.x=x;o.z=z;o.rot=rot;};
  AMB.push({step(dt){o.t+=dt;const sp=Math.hypot(o.x-o.px,o.z-o.pz)/Math.max(dt,1e-4);o.px=o.x;o.pz=o.z;if(!o.hidden)w.feed(o.x-Math.cos(o.rot)*L*.46,o.z+Math.sin(o.rot)*L*.46,clamp(sp/9,0,1),0,0,4);},
    sync(){g.visible=!o.hidden;g.position.set(o.x,WY+Math.sin(o.t*.9)*.04,o.z);g.rotation.set(0,o.rot,0);}});return o;}
// along a line at a speed, easing away from the start and in to the end; astern keeps her stern to the way she is going
function* sail(o,line,v,back,astern){let s=0;const len=line.len;while(s<len){const dt=(yield)||0,k=Math.min(1,(s+4)/36,(len-s+3)/44);s+=v*Math.max(.12,k)*dt*seaWay(o);line.at(back?len-s:s,_sp);o.setPos(_sp.x,_sp.z,_sp.h+((back?1:0)+(astern?1:0))*Math.PI);}}
function* swing(o,rot,secs){const r0=o.rot,d=angDiff(rot,r0);let t=0;while(t<secs){t+=(yield)||0;o.setPos(o.x,o.z,r0+d*ease(clamp(t/secs,0,1)));}}

// --- the border guard cutter: off her berth east of the terminal, a turn round the east bay well inside the fishing lanes, and back in stern first ---
if(HB.live.cutter){const f=HB.live.cutter,[x0,z0]=toSim(f.x,f.z),r0=f.r+SITE.rot,m=navyProp(f.l,f.w,'patrol'),o=seaCraft(m.S,f.l,f.w,'BP 31-19-02');
  o.group.add(glowPts([[...m.light,0xfff3d6]],0));o.setPos(x0,z0,r0);
  const ox=Math.cos(r0),oz=-Math.sin(r0),Q=[x0+ox*112,z0+oz*112];   // straight off the berth, the way her bow points
  const round=seaLine([[x0,z0],[x0+ox*60,z0+oz*60],[-246,-150],[-335,-232],[-470,-262],[-620,-212],[-758,-140],[-792,-78],[-722,-42],[-600,-56],[-440,-80],[-310,-88],Q]),home=seaLine([Q,[x0+ox*50,z0+oz*50],[x0,z0]]);SEA.cutter=[round,home];
  cos.push((function*(){yield* sleep(45);for(;;){o.status='Under way';yield* sail(o,round,8);o.status='Swinging';yield* swing(o,r0,12);o.status='Backing in';yield* sail(o,home,3.2,false,true);o.setPos(x0,z0,r0);o.status='Alongside';yield* sleep(hr(110,170));}})());}

// --- the coaster at Tiên Sa's finger pier: backs out of the dock, swings, runs out to the bay; some minutes later she is back ---
if(HB.live.coaster){const f=HB.live.coaster,[x0,z0]=toSim(f.x,f.z),r0=f.r+SITE.rot,m=merchantProp(f.l,f.w,0x34506a,'cargo'),o=seaCraft(m.S,f.l,f.w,'MV Hòn Chảo');
  o.group.add(glowPts([[...m.light,0xfff3d6]],0));o.setPos(x0,z0,r0);
  const ox=-Math.cos(r0),oz=Math.sin(r0),A=[x0+ox*200,z0+oz*200],outL=seaLine([[x0,z0],[x0+ox*100,z0+oz*100],A]),sea=seaLine([A,[1800,-742],[1930,-832],[2300,-852],[2800,-805],[3350,-760]]),back=seaLine([[x0,z0],[x0+ox*100,z0+oz*100],A,[1800,-742],[1930,-832],[2300,-852],[2800,-805],[3350,-760]]);SEA.coaster=[outL,sea];
  cos.push((function*(){yield* sleep(150);for(;;){o.status='Backing out';yield* sail(o,outL,3,false,true);o.status='Swinging';sea.at(1,_sp);yield* swing(o,_sp.h,26);o.status='Outbound';yield* sail(o,sea,7);
    o.hidden=true;yield* sleep(hr(70,130));o.hidden=false;o.status='Inbound';yield* sail(o,back,7,true);o.setPos(x0,z0,r0);o.status='Alongside';yield* sleep(hr(140,220));}})());}

