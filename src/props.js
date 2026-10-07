
/* ---------- props: the cranes, ships and boats that stand around the terminal ----------
   Each function builds one model in its own frame and returns it as a Builder; the harbour code stamps copies into the merged scenery,
   so a hundred boats cost a handful of draw calls. Cranes: x along the quay, +z towards the land, quay edge at z = 0.
   Vessels: +x is the bow, y = 0 the waterline. */
const P_={white:M_(0xf1efe9,{roughness:.6}),dark:M_(0x2a2629),steel:M_(0x6f6a6c,{roughness:.6}),glass:M_(0x1f3640,{roughness:.2,metalness:.2}),lamp:M_(0xfff0c8,{emissive:0xffc978,emissiveIntensity:1}),
  boot:M_(0x8d2f22,{roughness:.7}),rail:M_(0xe6e4dc,{roughness:.6}),rub:M_(0x141416,{roughness:.95}),orange:M_(0xe2641c,{roughness:.6}),wood:M_(0xa9855c,{roughness:.9}),conc:M_(0xa9a297)};
// plan of a hull: fine is how much of the length the bow takes to close, tr how square the stern is
const hullSh=(L,W,fine=.34,tr=.86)=>{const s=new T.Shape(),h=W/2,a=-L/2,b=L/2,x1=b-L*fine;s.moveTo(a,-h*tr);s.lineTo(a+L*.08,-h);s.lineTo(x1,-h);s.bezierCurveTo(b-L*fine*.45,-h,b-L*.05,-h*.4,b,0);s.bezierCurveTo(b-L*.05,h*.4,b-L*fine*.45,h,x1,h);s.lineTo(a+L*.08,h);s.lineTo(a,h*tr);s.closePath();return s;};
// the part of a plan ahead of (or abaft) x0, for forecastles and poops
const cutSh=(sh,x0,fwd=true)=>{const p=sh.getPoints(8),o=[],inn=q=>fwd?q.x>=x0:q.x<=x0;
  for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],ia=inn(a),ib=inn(b);if(ia)o.push(a);if(ia!==ib)o.push(new T.Vector2(x0,a.y+(b.y-a.y)*(x0-a.x)/(b.x-a.x)));}
  return o.length>2?new T.Shape(o):null;};
// half-breadth of a plan at x
const hbAt=(sh,x)=>{const p=sh.getPoints(8);let m=0;for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if((a.x-x)*(b.x-x)<=0&&a.x!==b.x)m=Math.max(m,Math.abs(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x)));}return m;};
const ringSh=(o,i)=>{o.holes.push(new T.Path(i.getPoints(10)));return o;};
// extrude a plan downwards from yTop; lay a plan flat at y
const sink=(S,mat,sh,depth,yTop,seg=7)=>{if(!sh)return;const g=new T.ExtrudeGeometry(sh,{depth,bevelEnabled:false,curveSegments:seg});g.rotateX(Math.PI/2);S.add(mat,g,0,yTop,0);};
const lay=(S,mat,sh,y,seg=7)=>{if(!sh)return;const g=new T.ShapeGeometry(sh,seg);g.rotateX(-Math.PI/2);S.add(mat,g,0,y,0);};
// handrail down both sides between x0 and x1 at half-breadth hz
const rails=(S,x0,x1,y,hz,m=P_.rail,h=1)=>{for(const s of [-1,1]){S.box(m,x1-x0,.06,.06,(x0+x1)/2,y+h,s*hz);S.box(m,x1-x0,.04,.04,(x0+x1)/2,y+h*.5,s*hz);for(let x=x0;x<=x1+.01;x+=Math.max(2.4,(x1-x0)/14))S.box(m,.06,h,.06,x,y+h/2,s*hz);}};
// a deckhouse tier with a band of windows right round
// window bars round a band of glass, so it reads as a row of windows
const panes=(S,m,len,wid,x,yc,win)=>{const nx=Math.max(2,Math.round(len/1.8)),nz=Math.max(2,Math.round(wid/1.8));
  for(let i=0;i<=nx;i++)for(const s of [-1,1])S.box(m,.15,win+.04,.05,x-len/2+len*i/nx,yc,s*(wid/2+.04));for(let i=0;i<=nz;i++)for(const s of [-1,1])S.box(m,.05,win+.04,.15,x+s*(len/2+.04),yc,-wid/2+wid*i/nz);};
const tier=(S,m,len,h,wid,x,y,win=.8)=>{S.box(m,len,h,wid,x,y+h/2,0);if(win){S.box(P_.glass,len+.06,win,wid+.06,x,y+h*.62,0);panes(S,m,len,wid,x,y+h*.62,win);}};
// anchors in their pockets either side of the bow
const anchors=(S,sh,x,y,k=1)=>{const hb=hbAt(sh,x),ang=Math.atan2(hb-hbAt(sh,x+1.5),1.5);for(const s of [-1,1]){S.box(P_.dark,1.2*k,1.6*k,.22,x,y,s*(hb+.07),0,s*ang,0);S.box(P_.dark,.5*k,.5*k,.4,x,y+1*k,s*(hb+.04),0,s*ang,0);}};
/* the fittings that make a box ship read as a ship at a distance: a sheer stripe, ports under the house, anchors, bitts, window bars on the house
   and the bridge, a rail round the monkey island, radar and a dome, pipes on the funnel, davits for the boat, seams on the hatch covers */
function shipTrim(S,o){const {sh,a,b,h,D,ax,al,aw}=o,{white,dark,steel,glass,rail}=P_,L=b-a,xs=a+L*.03,xe=o.x1;
  for(const s of [-1,1]){S.box(white,xe-xs,.14,.05,(xs+xe)/2,D-.6,s*(h+.03));for(let x=ax-al/2+1;x<ax+al/2-.4;x+=2.2)S.cyl(glass,.2,.06,x,D-1.6,s*(h+.025),Math.PI/2,0,0,8);
    for(let x=xs+5;x<xe;x+=L*.105){S.cyl(dark,.2,.6,x,D+.3,s*(h-.85),0,0,0,6);S.cyl(dark,.2,.6,x+.8,D+.3,s*(h-.85),0,0,0,6);S.box(dark,1.3,.1,.5,x+.4,D+.05,s*(h-.85));}}
  anchors(S,sh,b-L*.075,D-1.5,L>100?1:.8);
  for(const y of o.bands)panes(S,white,al,aw,ax,D+y,.9);panes(S,white,o.bl,o.bwid,o.bx,o.by,1.2);
  rails(S,o.bx-o.bl/2+.2,o.bx+o.bl/2-.2,o.by+1.5,o.bwid/2-.4,rail,1);S.box(white,2.8,.16,.32,o.mx+.3,o.my-1.4,0,0,.6,0);S.add(white,new T.SphereGeometry(.75,10,8),o.bx-o.bl*.2,o.by+2.3,-o.bwid*.22);S.cyl(steel,.12,1.2,o.bx-o.bl*.2,o.by+1.6,-o.bwid*.22,0,0,0,6);
  for(const s of [-1,1]){S.cyl(steel,.26,1.7,o.fx,o.fy+.6,s*.85,0,0,0,8);S.cyl(dark,.3,.2,o.fx,o.fy+1.5,s*.85,0,0,0,8);}
  for(const [x,y,z] of o.boats)for(const e of [-1.9,1.9])S.beam(steel,.16,V(x+e,y-1.6,z-Math.sign(z)*1.2),V(x+e,y+1.4,z+Math.sign(z)*.3));
  for(const x of o.bays)for(let r=1;r<o.nr;r++)S.box(dark,CL+.3,.05,.07,x,D+.32,(r-o.nr/2)*ROWP);
  for(const x of o.bridges){S.box(rail,.07,.07,o.bw+.4,x,o.brTop+.95,0);for(let z=-o.bw/2;z<=o.bw/2+.01;z+=o.bw/6)S.box(rail,.07,.95,.07,x,o.brTop+.47,z);}
  {const mx=o.fmx,mt=o.fmy;for(const s of [-1,1]){S.beam(steel,.07,V(mx,mt,0),V(mx-5,D+1.5,s*3));}S.box(steel,.12,.12,3,mx,mt-1.6,0);}
  rails(S,a+.6,a+L*.05,D,h-.5,rail,1);S.box(rail,.06,.06,2*h-1,a+.6,D+1,0);}

function hullOf(S,L,W,free,hullM,deckM,o={}){const sh=hullSh(L,W,o.fine,o.tr);sink(S,hullM,sh,free+2.4,free);
  const bt=hullSh(L*1.004,W*1.012,o.fine,o.tr);sink(S,o.boot||P_.boot,bt,2.6,.5);if(o.line)sink(S,o.line,hullSh(L*1.005,W*1.014,o.fine,o.tr),.16,.68);
  lay(S,deckM,hullSh(L*.985,W*.93,o.fine,o.tr),free+.03);return sh;}

/* ship-to-shore crane, the terminal's own design in another livery; up raises the boom, load hangs a box from the spreader */
function stsProp(hex,hexD,up,load){
  const R=M_(hex,{roughness:.55}),Rd=M_(hexD),{white,dark,steel,glass,lamp}=P_,yel=M_(0xe9b21f,{roughness:.5}),LX=7.6,Z1=3,Z2=17,TOP=27,F=new Builder();
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
  // boom, hinged at the waterside sill beam
  const Bm=new Builder(),a=up?1.36:0,piv=V(0,TOP+2.1,.5);
  for(const x of [-2.9,2.9])Bm.box(R,.9,1.7,31,x,0,-15.5);for(let z=-4;z>=-31;z-=5.4)Bm.box(R,5.8,.4,.5,0,.8,z);Bm.box(R,6.7,1,1,0,0,-31);for(const z of [-10,-22])Bm.box(lamp,4.2,.2,.5,0,-.95,z);
  const M=new T.Matrix4().makeRotationX(a).setPosition(piv);for(const [m,gs] of Bm.m)for(const g of gs){g.applyMatrix4(M);F.push(m,g);}
  for(const z of [-15,-30])F.beam(R,.38,V(0,44.5,6.5),V(0,.9,z).applyMatrix4(M));
  // trolley, ropes and spreader: out over the ship when the boom is down, parked over the quay when it is up
  const t=up?9:-13,h=up?22:load?13:17;F.box(white,7,.9,4.2,0,TOP+1,t);F.box(white,2,2.2,2.2,4,TOP-.6,t+.2);F.box(glass,2.05,1.1,2.25,4,TOP-.5,t+.2);
  for(const z of [-.95,.95])F.box(yel,CL,.28,.3,0,h+.14,t+z);for(const x of [-CL/2+.2,-3,3,CL/2-.2])F.box(yel,.4,.28,CW,x,h+.14,t);F.box(dark,3.4,.8,1.9,0,h+.68,t);
  for(const x of [-2.4,2.4])for(const z of [-.7,.7])F.box(dark,.08,TOP+.6-h-1.1,.08,x,(TOP+.6+h+1.1)/2,t+z);
  return {S:F,hang:load?[0,h-CH,t]:null};
}
/* rubber-tyred gantry over a six-wide row; the row runs along x */
function rtgProp(load){
  const Y=M_(0xe3a81c,{roughness:.55}),{white,dark,steel,glass,lamp}=P_,yel=M_(0xe9b21f,{roughness:.5}),zN=-11.6,zS=11.6,HT=19,LXR=4.6,F=new Builder();
  for(const z of [zN,zS]){for(const x of [-LXR,LXR]){F.box(Y,.8,HT-.6,.8,x,HT/2+1.3,z);F.box(Y,2.6,.8,1,x,1.5,z);for(const wx of [-.85,.85]){F.cyl(dark,.72,.55,x+wx,.72,z,Math.PI/2,0,0,14);F.cyl(steel,.36,.58,x+wx,.72,z,Math.PI/2,0,0,8);}}
    F.box(Y,2*LXR+.8,.9,.9,0,2.4,z);F.box(Y,2*LXR+.8,1,1,0,HT+1.4,z);F.beam(Y,.4,V(-LXR,2.6,z),V(0,7.5,z));F.beam(Y,.4,V(LXR,2.6,z),V(0,7.5,z));}
  for(const x of [-2.4,2.4])F.box(Y,.8,1.5,zS-zN+1.6,x,HT+1.4,0);
  F.box(white,3.6,2.3,2.2,0,4.2,zS+.3);F.box(steel,3.8,.2,2.4,0,5.4,zS+.3);F.box(steel,.12,HT-5,.8,LXR+.55,HT/2+2.5,zS);
  for(const z of [zN+3,0,zS-3])F.box(lamp,3.6,.2,.4,0,HT+.55,z);
  const t=load?2.6:-5.2,h=load?13.2:15;F.box(white,5.6,.9,3.6,0,HT+.4,t);F.box(white,1.7,2,1.9,-2.2,HT-1.1,t-.2);F.box(glass,1.75,1,1.95,-2.2,HT-1,t-.2);
  for(const z of [-.95,.95])F.box(yel,CL,.28,.3,0,h+.14,t+z);for(const x of [-CL/2+.2,-3,3,CL/2-.2])F.box(yel,.4,.28,CW,x,h+.14,t);F.box(dark,3.4,.8,1.9,0,h+.68,t);
  for(const x of [-2.4,2.4])for(const z of [-.7,.7])F.box(dark,.08,HT-h-1.1,.08,x,(HT+h+1.1)/2,t+z);
  return {S:F,hang:load?[0,h-CH,t]:null};
}
/* mobile harbour crane: carrier on outriggers, slewing tower with the cab half way up, lattice jib */
function mhcProp(slew){
  const Y=M_(0xe9c21f,{roughness:.55}),G=M_(0x5d6468,{roughness:.6}),{white,dark,steel,glass,lamp}=P_,F=new Builder(),U=new Builder();
  F.box(G,13,1.6,7,0,1.9,0);for(const x of [-5,-3,3,5])for(const s of [-1,1])F.cyl(dark,.8,1.1,x,.8,s*3,Math.PI/2,0,0,12);for(const x of [-6.6,6.6])for(const s of [-1,1]){F.box(G,1,.5,3.4,x,1.6,s*4.6);F.box(dark,1.6,.3,1.6,x,.15,s*6.2);F.box(G,.5,1.3,.5,x,.8,s*6.2);}
  U.cyl(G,2.6,1,0,3.2,0,0,0,0,16);U.box(Y,8,3.2,5.6,-2.6,5.3,0);U.box(G,3,2.6,5.8,-6.2,5.3,0);U.box(white,3.2,24,3.2,1.2,15.5,0);U.box(Y,3.4,.5,3.4,1.2,27.6,0);
  U.box(white,2.6,2.4,2.4,3.6,17,0);U.box(glass,2.7,1.2,2.5,3.7,17.3,0);U.box(steel,.12,22,.9,-.5,15,1.9);
  const a=V(2.4,25,0),b=V(31,41,0);for(const s of [-1,1]){U.beam(Y,.5,V(2.4,25,s*1.1),V(31,41,s*.4));U.beam(Y,.3,V(2.4,27.4,s*1.1),V(31,41.6,s*.4));}
  for(let i=0;i<8;i++){const p=a.clone().lerp(b,i/8),q=a.clone().lerp(b,(i+1)/8),w=1.1-i*.085;U.box(Y,.25,.25,2*w,p.x,p.y+.3,0);U.beam(Y,.18,V(p.x,p.y+.2,-w),V(q.x,q.y+.2,w-.085));}
  U.beam(steel,.14,V(1.2,28,0),V(31,41.4,0));U.box(dark,.1,23,.1,31,29.5,0);U.box(Y,1.6,.9,1.2,31,17.6,0);U.box(lamp,.5,.3,.5,1.2,28.1,0);
  const M=new T.Matrix4().makeRotationY(slew);for(const [m,gs] of U.m)for(const g of gs){g.applyMatrix4(M);F.push(m,g);}
  return {S:F,tip:V(31,41.5,0).applyMatrix4(M)};
}
/* reach stacker carrying a box high */
function stackerProp(){
  const Y=M_(0xe9a81f,{roughness:.5}),{dark,steel,glass,white,lamp}=P_,F=new Builder();
  F.box(Y,7.4,1.5,3.6,-.6,1.9,0);F.box(dark,2.2,1.4,3.8,-4.6,2.1,0);for(const s of [-1,1]){F.cyl(dark,.95,.9,2.4,.95,s*1.9,Math.PI/2,0,0,14);F.cyl(dark,.8,.7,-3.4,.8,s*1.7,Math.PI/2,0,0,14);F.cyl(steel,.4,.94,2.4,.95,s*1.9,Math.PI/2,0,0,8);}
  F.box(white,2.2,1.9,1.9,-1.4,3.9,0);F.box(glass,2.26,1.1,1.96,-1.4,4.1,0);F.box(Y,2.4,.2,2.1,-1.4,4.95,0);
  F.beam(Y,1.1,V(-3.6,3.4,0),V(6.4,10.2,0));F.beam(steel,.5,V(.6,2.6,0),V(2.2,7.2,0));F.box(Y,1.4,.8,3,6.4,9.6,0);F.box(Y,12.4,.4,.5,6.4,8.9,-1);F.box(Y,12.4,.4,.5,6.4,8.9,1);F.box(lamp,.3,.3,.3,-1.4,5.2,.8);
  return {S:F,hang:[6.4,8.7-CH,0]};
}

/* warship or patrol craft. kind: navy, frigate, patrol (border guard), cutter (coast guard, white hull) */
function navyProp(L,W,kind){
  const S=new Builder(),cut=kind==='cutter',grey=cut?0xe9ebec:kind==='patrol'?0xaeb5b8:0x8b9299,hullM=M_(grey,{roughness:.55}),upM=M_(cut?0xf3f3f1:0xa3aab0,{roughness:.6}),deckM=M_(cut?0x5f7f6c:0x74625d,{roughness:.9}),
    {dark,steel,glass,lamp,rail,orange}=P_,gun=M_(0x6d747a,{roughness:.5}),f=1.7+L*.018,big=L>66,fc=.8+L*.007,xf=L*.16;
  const sh=hullOf(S,L,W,f,hullM,deckM,{fine:.46,tr:.78,boot:M_(cut?0xc8451f:0x3c3f44,{roughness:.7})});
  // raised forecastle with the flare of the bow, anchor and breakwater
  sink(S,hullM,cutSh(sh,xf),fc,f+fc);lay(S,deckM,cutSh(hullSh(L*.985,W*.93,.46,.78),xf+.2),f+fc+.03);sink(S,hullM,ringSh(cutSh(sh,xf+L*.1),cutSh(hullSh(L*.975,W*.9,.46,.78),xf+L*.1+.2)),.5,f+fc+.5);
  S.box(hullM,.25,.7,W*.42,L*.24,f+fc+.35,0);
  // stripes on the bow for the cutters and the border guard
  if(cut||kind==='patrol')for(const s of [-1,1]){S.box(M_(cut?0xe2641c:0x2f7a4a),L*.035,f+.5,.08,L*.0,f/2+.2,s*(W/2+.02),0,0,.42);if(cut)S.box(M_(0x1f4f9a),L*.014,f+.5,.08,-L*.036,f/2+.2,s*(W/2+.02),0,0,.42);}
  // main gun forward, lighter mount aft on the bigger ships
  const gy=f+fc;S.cyl(gun,W*.15,.35,L*.3,gy+.17,0,0,0,0,12);S.cyl(gun,W*.12,1.15,L*.3,gy+.9,0,0,0,0,10,W*.09);S.cyl(dark,.08+L*.0008,2.6+L*.02,L*.3+1.6+L*.01,gy+1.15,0,0,0,Math.PI/2-.12,6);
  // superstructure: deckhouse, bridge with windows all round, open bridge wings
  const h1=2.4,h2=2.3,x1=L*.02,l1=L*.3;tier(S,upM,l1,h1,W*.8,x1,f,0);for(const s of [-1,1])for(let x=x1-l1/2+1.6;x<x1+l1/2-1;x+=2.6)S.cyl(glass,.24,.06,x,f+1.5,s*W*.4,Math.PI/2,0,0,8);
  tier(S,upM,L*.14,h2,W*.7,L*.085,f+h1,.75);S.box(upM,L*.06,.9,W*.94,L*.07,f+h1+.45,0);S.box(upM,L*.15,.18,W*.76,L*.085,f+h1+h2+.09,0);
  if(big){tier(S,upM,L*.08,2,W*.5,L*.06,f+h1+h2,.6);}
  const top=f+h1+h2+(big?2:0);
  // lattice mast with yard, radar and a dome
  const mh=3.5+L*.085,mx=L*.03;for(const s of [-1,1]){S.beam(steel,.16,V(mx-1,top,s*1.1),V(mx,top+mh,0));S.beam(steel,.16,V(mx+1.2,top,s*.7),V(mx,top+mh,0));}
  S.box(steel,.14,.14,W*.6,mx,top+mh*.62,0);S.box(steel,.9,.12,.12,mx,top+mh*.8,0);S.box(P_.white,2.4+L*.01,.22,.4,mx+.2,top+mh*.45,0,0,.5,0);S.add(P_.white,new T.SphereGeometry(.5+L*.004,10,8),mx-.6,top+.7,0);S.box(lamp,.22,.22,.22,mx,top+mh+.15,0);
  // funnel, raked, with a dark cap
  const fx=-L*.07;S.box(upM,L*.055,2.6+L*.012,W*.3,fx,f+h1+1.3+L*.006,0,0,0,.12);S.box(dark,L*.058,.5,W*.31,fx-.2,f+h1+2.7+L*.012,0,0,0,.12);if(cut)S.box(P_.orange,L*.057,.5,W*.305,fx-.08,f+h1+1.8,0,0,0,.12);
  // after deck: boat on its cradle, davit, hangar and flight deck on the frigates
  S.box(orange,5.2,.9,1.9,-L*.2,f+1.1,-W*.2);S.box(dark,5.3,.25,2,-L*.2,f+.5,-W*.2);S.beam(steel,.14,V(-L*.2,f,W*.05),V(-L*.2,f+3.4,-W*.2));
  if(big){tier(S,upM,L*.1,3,W*.72,-L*.2,f,0);S.cyl(P_.white,W*.3,.03,-L*.36,f+.06,0,0,0,0,20);S.cyl(deckM,W*.26,.035,-L*.36,f+.065,0,0,0,0,20);S.cyl(gun,W*.1,1,-L*.12,f+h1+.5,0,0,0,0,10);}
  else S.cyl(gun,W*.09,.9,-L*.33,f+.5,0,0,0,0,8);
  rails(S,-L*.4,xf-.5,f,W*.44,rail,.95);anchors(S,sh,L*.38,f+fc-.9,L>66?.8:.55);S.cyl(steel,.05,2.4,-L*.485,f+1.2,0,0,0,0,5);S.box(M_(0xc8281f),.03,.5,.8,-L*.485,f+2.1,.42);
  return {S,light:[mx,top+mh+.4,0]};
}
/* coaster, general cargo ship or steel trawler: house aft, hatches and cargo gear forward */
function merchantProp(L,W,hex,kind){
  const S=new Builder(),hullM=M_(hex,{roughness:.55}),deckM=M_(kind==='trawler'?0x4a6a58:0x6d4d42,{roughness:.9}),{white,dark,steel,glass,lamp,rail,orange}=P_,hatch=M_(0x59666c,{roughness:.7}),cover=M_(0x74828a,{roughness:.6}),
    f=1.9+L*.026,up=1.5+L*.004,xf=L*.33,xa=-L*.24;
  const sh=hullOf(S,L,W,f,hullM,deckM,{fine:.3,tr:.9,line:white});
  const fo=cutSh(sh,xf),po=cutSh(sh,xa,false);if(fo){sink(S,hullM,fo,up,f+up);lay(S,deckM,cutSh(hullSh(L*.985,W*.93,.3,.9),xf+.2),f+up+.03);}if(po){sink(S,hullM,po,up,f+up);lay(S,deckM,cutSh(hullSh(L*.985,W*.93,.3,.9),xa-.2,false),f+up+.03);}
  // bulwark amidships, forecastle gear, foremast
  {const xb=Math.min(xf,L*.19);for(const s of [-1,1])S.box(hullM,xb-xa,1,.16,(xb+xa)/2,f+.5,s*(W/2-.08));}
  sink(S,hullM,ringSh(cutSh(sh,xf),cutSh(hullSh(L*.975,W*.92,.3,.9),xf+.25)),.9,f+up+.9);
  for(const s of [-1,1])S.cyl(steel,.55,1.3,L*.4,f+up+.6,s*W*.14,Math.PI/2,0,0,8);S.cyl(steel,.2,5+L*.03,L*.37,f+up+2.5+L*.015,0,0,0,0,6);S.box(lamp,.3,.3,.3,L*.37,f+up+5.2+L*.03,0);
  // hatches with ribbed covers; cargo gear between them
  const n=kind==='trawler'?1:L>62?3:2,x0=xa+L*.045,span=xf-L*.03-x0,hl=span/n-2.4;
  for(let i=0;i<n;i++){const x=x0+span*(i+.5)/n;S.box(hatch,hl,1.2,W*.62,x,f+.6,0);S.box(cover,hl+.3,.22,W*.66,x,f+1.3,0);for(let k=1;k<5;k++)S.box(hatch,.14,.1,W*.66,x-hl/2+hl*k/5,f+1.45,0);
    if(i<n-1||n===1){const gx=x0+span*(i+1)/n-(n===1?hl*.9:0);S.box(white,1.5,6+L*.03,1.5,gx,f+3+L*.015,0);S.box(white,2.6,.4,W*.5,gx,f+6+L*.03,0);for(const s of [-1,1])S.beam(M_(0xd9b02a),.3,V(gx,f+2.2,s*W*.16),V(gx+(kind==='trawler'?-1:1)*hl*.7,f+7+L*.02,s*W*.24));}}
  // accommodation aft: three tiers stepping in, bridge with wings, funnel in the owner's colour, lifeboat
  const ay=f+up,ax=-L*.36,t1=2.6;tier(S,white,L*.17,t1,W*.86,ax,ay);tier(S,white,L*.14,t1,W*.8,ax+L*.008,ay+t1);tier(S,white,L*.1,2.5,W*.74,ax+L*.02,ay+2*t1,1);S.box(white,L*.045,.9,W*1.0,ax+L*.03,ay+2*t1+.45,0);S.box(M_(0xd8d2c8),L*.11,.2,W*.8,ax+L*.02,ay+2*t1+2.6,0);
  S.cyl(steel,.16,4.4,ax+L*.02,ay+2*t1+4.8,0,0,0,0,6);S.box(steel,.14,.14,3,ax+L*.02,ay+2*t1+6,0);S.box(white,2.2,.2,.36,ax+L*.03,ay+2*t1+3.3,0,0,.6,0);S.box(lamp,.26,.26,.26,ax+L*.02,ay+2*t1+7.1,0);
  S.box(M_(kind==='trawler'?0x2f6f9f:0xd9b02a),L*.045,3.4,W*.3,ax-L*.05,ay+2*t1+1.2,0);S.box(dark,L*.047,.7,W*.31,ax-L*.05,ay+2*t1+3.2,0);
  S.box(orange,4.6,1.3,1.8,ax-L*.01,ay+t1+1,W*.36);S.box(orange,3.6,.6,1.5,ax-L*.01,ay+t1+1.9,W*.36);for(const o of [-1.8,1.8])S.beam(steel,.12,V(ax-L*.01+o,ay+t1,W*.2),V(ax-L*.01+o,ay+t1+2.8,W*.4));
  if(kind==='trawler'){for(const s of [-1,1])S.beam(steel,.3,V(-L*.46,ay,s*W*.3),V(-L*.44,ay+6,0));S.cyl(M_(0x3f7a55),1.1,W*.5,-L*.4,ay+1.2,0,Math.PI/2,0,0,10);}
  rails(S,-L*.47,xa,ay,W*.4,rail,.95);anchors(S,sh,L*.41,f+up-1.1,L>70?.9:.65);
  for(const s of [-1,1])for(let x=ax-L*.07;x<ax+L*.08;x+=2.1)S.cyl(glass,.17,.06,x,f-.7,s*(W/2+.02),Math.PI/2,0,0,8);
  return {S,light:[ax+L*.02,ay+2*t1+7.4,0]};
}
/* container ship of any length: the terminal's own vessel design, with the stack positions handed back so real boxes can be set on her */
function boxShipProp(L,hex,line){
  const S=new Builder(),W=Math.min(32.2,L*.158),k=L/115,hullM=M_(hex,{roughness:.5}),{white,dark,steel,glass,lamp,orange}=P_,deckM=M_(0x7d5a4a),D=5.6+L*.012,h=W/2;
  const sh=new T.Shape(),a=-L*.478,b=L*.522,x1=L*.348;sh.moveTo(a,-h);sh.lineTo(x1,-h);sh.quadraticCurveTo(b-L*.052,-h*.9,b,0);sh.quadraticCurveTo(b-L*.052,h*.9,x1,h);sh.lineTo(a,h);sh.quadraticCurveTo(a-L*.02,0,a,-h);
  sink(S,hullM,sh,D+2.6,D,12);{const g=new T.ExtrudeGeometry(sh,{depth:2.9,bevelEnabled:false,curveSegments:12});g.rotateX(Math.PI/2);g.scale(1.003,1,1.012);S.add(P_.boot,g,0,.6,0);const w=new T.ExtrudeGeometry(sh,{depth:.2,bevelEnabled:false,curveSegments:12});w.rotateX(Math.PI/2);w.scale(1.004,1,1.014);S.add(white,w,0,.82,0);
    const d=new T.ShapeGeometry(sh,12);d.rotateX(-Math.PI/2);d.scale(.99,1,.95);S.add(deckM,d,0,D+.04,0);}
  const ax=a+L*.11,x0=ax+L*.075,xe=x1-L*.02,nb=Math.max(4,Math.floor((xe-x0)/BAYP)),nr=Math.max(5,Math.floor((W-2.4)/ROWP)),bw=nr*ROWP+.4,stacks=[];
  for(const s of [-1,1]){S.box(hullM,xe-x0+8,1.1,.2,(x0+xe)/2,D+.55,s*(h-.14));S.box(white,xe-x0+8,.07,.07,(x0+xe)/2,D+1.3,s*(h-.3));for(let x=x0-4;x<=xe+4;x+=3.2)S.box(white,.06,.3,.06,x,D+1.15,s*(h-.3));}
  for(let i=0;i<nb;i++){const x=x0+(i+.5)*(xe-x0)/nb;S.box(M_(0x5b4d48),CL+.3,.3,bw,x,D+.16,0);S.box(steel,.35,2.9+L*.01,bw+.4,x-(xe-x0)/nb/2,D+1.5,0);for(let r=0;r<nr;r++)stacks.push([x,(r-(nr-1)/2)*ROWP]);}
  S.box(steel,.35,2.9+L*.01,bw+.4,xe,D+1.5,0);
  // forecastle, mast, windlass
  S.box(hullM,L*.1,1.4,W*.6,b-L*.11,D+.7,0);S.box(deckM,L*.096,.1,W*.58,b-L*.11,D+1.45,0);S.cyl(steel,.22+L*.0006,7+L*.02,b-L*.09,D+5+L*.01,0,0,0,0,6);S.box(lamp,.35,.35,.35,b-L*.09,D+8.8+L*.02,0);for(const s of [-1,1])S.cyl(steel,.7,1.6,b-L*.08,D+2.1,s*2.6,Math.PI/2,0,0,10);
  // accommodation right aft: tiers of windows, bridge with wings, funnel in the line's colour, lifeboat
  const ah=11+L*.022,al=8+L*.03;S.box(white,al,ah,W*.82,ax,D+ah/2,0);for(let y=2.6;y<ah-.6;y+=3)S.box(glass,al+.1,.9,W*.82+.1,ax,D+y,0);
  S.box(white,al*.6,3,W*1.02,ax+al*.15,D+ah+1.5,0);S.box(glass,al*.6+.1,1.2,W*1.02+.1,ax+al*.15,D+ah+1.8,0);S.box(M_(0xd8d2c8),al*.66,.3,W*1.05,ax+al*.15,D+ah+3.15,0);
  S.cyl(steel,.2,6,ax+al*.2,D+ah+6.2,0,0,0,0,6);S.box(steel,.25,.25,4,ax+al*.2,D+ah+8,0);S.box(lamp,.35,.35,.35,ax+al*.2,D+ah+9.4,0);S.box(white,2.6,.8,2.6,ax+al*.3,D+ah+3.7,3);
  S.box(M_(line),3.8+L*.006,6+L*.01,5+L*.01,ax-al*.36,D+ah+1.6,0);S.box(M_(0x1f1c1f),3.9+L*.006,1.1,5.1+L*.01,ax-al*.36,D+ah+5+L*.005,0);S.box(white,3.86+L*.006,1.2,5.06+L*.01,ax-al*.36,D+ah+2.4,0);
  for(const s of [-1,1]){S.box(orange,5.6,1.5,2,ax-al*.1,D+ah*.66,s*(W*.41+1.1));S.box(orange,4.6,.9,1.8,ax-al*.1,D+ah*.66+1.1,s*(W*.41+1.1));}
  {const bands=[],bays=[],brs=[];for(let y=2.6;y<ah-.6;y+=3)bands.push(y);for(let i=0;i<nb;i++){bays.push(x0+(i+.5)*(xe-x0)/nb);brs.push(x0+i*(xe-x0)/nb);}brs.push(xe);
    shipTrim(S,{sh,a,b,h,D,ax,al,aw:W*.82,x1,bands,bl:al*.6,bwid:W*1.02,bx:ax+al*.15,by:D+ah+1.8,mx:ax+al*.2,my:D+ah+8,fx:ax-al*.36,fy:D+ah+5.55+L*.005,boats:[[ax-al*.1,D+ah*.66,W*.41+1.1],[ax-al*.1,D+ah*.66,-(W*.41+1.1)]],bays,nr,bw,bridges:brs,brTop:D+2.95+L*.005,fmx:b-L*.09,fmy:D+8.5+L*.02});}
  return {S,stacks,base:D+.3,light:[ax+al*.2,D+ah+9.7,0],W};
}
/* dumb barge: raked ends, coaming, a load of sand or a clear deck, hut and bitts */
function bargeProp(L,W,hex,sand){
  const S=new Builder(),m=M_(hex,{roughness:.8}),{dark,steel,white,glass,rub}=P_,sh=new T.Shape();sh.moveTo(-L/2+2.6,-1.3);sh.lineTo(L/2-3.4,-1.3);sh.lineTo(L/2,1.5);sh.lineTo(-L/2,1.5);sh.closePath();
  const g=new T.ExtrudeGeometry(sh,{depth:W,bevelEnabled:false});g.translate(0,0,-W/2);S.add(m,g,0,0,0);S.box(M_(0x595654,{roughness:.9}),L-1,.08,W-.6,0,1.54,0);
  S.box(m,L*.7,.9,.3,0,2,W*.36);S.box(m,L*.7,.9,.3,0,2,-W*.36);S.box(m,.3,.9,W*.72,L*.35,2,0);S.box(m,.3,.9,W*.72,-L*.35,2,0);
  if(sand){const q=new T.SphereGeometry(1,12,6,0,Math.PI*2,0,Math.PI/2);q.scale(L*.33,W*.2,W*.33);S.add(M_(0xd2c096,{roughness:1}),q,0,1.6,0);}
  S.box(white,2.6,2.4,2.6,-L*.43,2.8,0);S.box(glass,2.66,.8,2.66,-L*.43,3.2,0);S.box(dark,3,.16,3,-L*.43,4.05,0);
  for(const x of [-L*.46,L*.44])for(const s of [-1,1]){S.cyl(steel,.2,.7,x,1.9,s*(W/2-.6),0,0,0,6);S.cyl(steel,.28,.08,x,2.26,s*(W/2-.6),0,0,0,6);}
  for(let x=-L*.36;x<=L*.36;x+=L*.18)for(const s of [-1,1])S.add(rub,new T.TorusGeometry(.5,.18,5,10),x,.9,s*(W/2+.05));
  return {S};
}
/* wooden fishing boat of the Thọ Quang fleet: high bow with eyes, cabin and wheelhouse aft, masts and booms, lamp rack on the squid boats */
function fishProp(L,hex,trim,squid,lod){
  const S=new Builder(),W=L*.27,hullM=M_(hex,{roughness:.6}),red=M_(0xb8322a,{roughness:.6}),cab=M_(trim,{roughness:.6}),{wood,glass,dark,rub,white,lamp}=P_,spar=M_(0x6b4a36,{roughness:.8}),f=1.25,seg=lod?3:5;
  const sh=hullSh(L,W,.42,.9);sink(S,hullM,sh,f+1.6,f,seg);if(!lod)sink(S,red,hullSh(L*1.006,W*1.02,.42,.9),.5,-.05,seg);
  sink(S,hullM,ringSh(hullSh(L,W,.42,.9),hullSh(L*.955,W*.86,.42,.9)),.55,f+.55,seg);sink(S,red,ringSh(hullSh(L*1.008,W*1.03,.42,.9),hullSh(L*.95,W*.84,.42,.9)),.1,f+.65,seg);lay(S,wood,hullSh(L*.955,W*.86,.42,.9),f+.03,seg);
  // the stem carried up above the rail, and the eyes either side of it
  S.box(hullM,L*.1,1.5,.34,L*.455,f+.9,0,0,0,.5);if(!lod){S.box(red,L*.1,.12,.4,L*.47,f+1.62,0,0,0,.5);const hb=hbAt(sh,L*.34);for(const s of [-1,1]){S.cyl(white,.22,.05,L*.34,f+.2,s*(hb+.02),Math.PI/2,0,0,8);S.cyl(dark,.09,.06,L*.342,f+.2,s*(hb+.03),Math.PI/2,0,0,6);}}
  // cabin with a row of windows, wheelhouse on its fore end, roof with a rail of gear
  const cx=-L*.2,cl=L*.3,cw=W*.62;S.box(cab,cl,1.9,cw,cx,f+1,0);S.box(glass,cl*.86,.5,cw+.05,cx,f+1.35,0);S.box(hullM,cl+.6,.12,cw+.5,cx,f+2,0);
  S.box(cab,cl*.42,1.5,cw*.8,cx+cl*.27,f+2.8,0);S.box(glass,cl*.42+.05,.55,cw*.8+.05,cx+cl*.27,f+3,0);S.box(hullM,cl*.5,.1,cw*.9,cx+cl*.27,f+3.6,0);
  // masts, boom, stays; fish hold hatches, barrels and a tyre on the quarter
  S.cyl(spar,.09,5.4,L*.06,f+2.7,0,0,0,0,lod?4:5);S.beam(spar,.1,V(L*.06,f+4.6,0),V(cx+cl*.2,f+3.7,0));S.box(M_(0xd0281f),.03,.34,.5,L*.06,f+5.2,.27);S.box(wood,L*.1,.3,W*.34,L*.17,f+.2,0);
  if(!lod){S.box(red,cl*.3,.5,cw*.4,cx-cl*.24,f+2.3,0);S.cyl(spar,.07,3.4,L*.3,f+1.7,0,0,0,0,5);S.box(dark,L*.1+.1,.06,W*.34+.1,L*.17,f+.37,0);for(const s of [-1,1])S.cyl(M_(0x2f6fae),.3,.75,L*.01,f+.4,s*W*.26,0,0,0,7);
    S.add(rub,new T.TorusGeometry(.42,.15,5,9),-L*.36,f*.6,W*.5+.04);S.add(rub,new T.TorusGeometry(.42,.15,5,9),L*.1,f*.6,-W*.5-.04);}
  if(squid){for(const s of [-1,1]){S.beam(spar,.09,V(L*.06,f+1,s*W*.3),V(L*.1,f+3.6,s*W*1.25));S.box(dark,L*.34,.06,.06,L*.02,f+3.5,s*W*.75);if(lod)S.box(lamp,L*.3,.26,.2,L*.02,f+3.3,s*W*.75);else for(let i=0;i<5;i++)S.box(lamp,.22,.3,.22,L*.02+(i-2)*L*.07,f+3.3,s*W*.75);}}
  return {S,light:[L*.06,f+5.6,0]};
}
function launchProp(L,hex){
  const S=new Builder(),W=L*.3,m=M_(hex,{roughness:.5}),{glass,white,rail,rub}=P_;sink(S,m,hullSh(L,W,.5,.92),1.6,.9,5);sink(S,P_.boot,hullSh(L*1.005,W*1.02,.5,.92),.4,-.05,5);lay(S,M_(0xd8d4c8),hullSh(L*.96,W*.88,.5,.92),.93,5);
  S.box(white,L*.3,1.2,W*.66,-L*.04,1.5,0);S.box(glass,L*.3+.04,.5,W*.66+.04,-L*.04,1.75,0);S.box(white,L*.34,.08,W*.72,-L*.04,2.14,0);S.cyl(P_.steel,.04,1.4,-L*.1,2.9,0,0,0,0,5);rails(S,L*.1,L*.36,.9,W*.3,rail,.6);S.box(P_.dark,.5,.8,.7,-L*.47,1,0);
  return {S,light:[-L*.1,3.7,0]};
}
/* floating dock: pontoon deck, two wing walls with walkways and a travelling crane, a hull inside when docked */
function dockProp(L,W){
  const S=new Builder(),m=M_(0x7a4a3c,{roughness:.85}),m2=M_(0x8d5a4a,{roughness:.85}),{steel,white,rail,dark,lamp}=P_,Y=M_(0xe3a81c);
  S.box(m,L,3.2,W,0,-.2,0);S.box(M_(0x5f4a44,{roughness:.95}),L-.6,.06,W-9,0,1.43,0);for(let x=-L*.42;x<=L*.42;x+=L*.14)S.box(dark,1,.9,W*.3,x,1.85,0);
  for(const s of [-1,1]){S.box(m2,L,9.4,4,0,6,s*(W/2-2));S.box(m,L+.2,.3,4.4,0,10.8,s*(W/2-2));rails(S,-L/2+.5,L/2-.5,10.9,s*(W/2-2)+1.9,rail,1);for(let x=-L*.4;x<=L*.4;x+=L*.2)S.box(dark,1.6,1,.1,x,7,s*(W/2+.02));S.box(white,L*.12,2.4,3,-L*.3*s,12.1,s*(W/2-2));}
  S.box(Y,1.6,5,1.6,L*.2,13.3,W/2-2);S.beam(Y,.5,V(L*.2,15.6,W/2-2),V(L*.2-8,19,0));S.box(lamp,.4,.3,.4,L*.2,16,W/2-2);
  return {S};
}
