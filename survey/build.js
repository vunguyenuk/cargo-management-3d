#!/usr/bin/env node
// Turns the survey notes in this folder into src/sites.js. No dependencies: `node survey/build.js`.
//
// Each .txt file is one tile of Esri World Imagery, exported north-up at a known centre and scale and read by eye. A line "@ cx cz mpp"
// gives the tile: its centre in the survey grid of src/map.js (metres, +x west, +z north) and its scale in metres per CSS pixel; the
// tile is 585 x 858 CSS pixels and was looked at as an 800 x 1173 screenshot, so every coordinate below it is in those screenshot
// pixels. The lines that follow are features:
//   S x1 y1 x2 y2 w h roof wall   pitched-roof building: centreline (ridge) end to end, width, eaves height in metres, colours
//   F x1 y1 x2 y2 w h roof wall   flat roof; roof "bullets" = rack of horizontal LPG tanks, "fdock" = floating dock
//   T x y r h colour              storage tank          O x y r colour      sphere
//   Y x1 y1 x2 y2 w tiers         block of stacked containers lying along the centreline
//   G kind x y x y ...            ground outline (conc sand lsand grass pitch court blue pool pond asph dark water houses)
//   E kind x y x y ...            land the OpenStreetMap coastline leaves out (a spit, a causeway); kind is its surface, sand or grass
//   V x1 y1 x2 y2 beam kind col   vessel, stern to bow
//   P w [kind] x y ...            pier deck             M w x y ...  rock mound       D w x y ...  causeway
//   W x y ...                     wall                  N x y r      clump of trees   n x y ...    row of trees
//   K x y bx by                   ship-to-shore crane: foot, boom tip               R x1 y1 x2 y2  goliath crane, leg to leg
//   C x y kind size               the rest: fleet (size = number of boats), tarp, steel, pile, pipes, blocks, mcrane, monument, roundabout, shiplift, platform
// Widths, radii and sizes are in screenshot pixels unless noted. A building read on two overlapping tiles is kept once.
const fs=require('fs'),path=require('path');
const lat0=16.1164519,lon0=108.2309745,c=Math.cos(10.2*Math.PI/180),s=Math.sin(10.2*Math.PI/180),K=800/585;
const out=[];
for(const f of fs.readdirSync(__dirname).filter(f=>f.endsWith('.txt')).sort()){
  let conv=null,sc=1,tc=[0,0];
  for(let line of fs.readFileSync(path.join(__dirname,f),'utf8').split('\n')){line=line.replace(/#.*/,'').trim();if(!line)continue;const a=line.split(/\s+/);
    if(a[0]==='@'){const [cx,cz,mpp]=a.slice(1).map(Number);const E0=-c*cx+s*cz+550,N0=s*cx+c*cz-513;sc=mpp/K;tc=[cx,cz];
      conv=(u,v)=>{const E=E0+(u/K-292.5)*mpp-550,N=N0-(v/K-429)*mpp+513;return [+(-c*E+s*N).toFixed(1),+(s*E+c*N).toFixed(1)];};continue;}
    const _len=out.length;const t=a[0],n=a.slice(1),num=i=>+n[i],pt=i=>conv(num(i),num(i+1)),L=v=>+(v*sc).toFixed(1);
    const poly=i=>{const p=[];for(;i+1<n.length&&!isNaN(+n[i]);i+=2)p.push(...conv(+n[i],+n[i+1]));return p;};
    if(t==='S'||t==='F')out.push({t,p:[...pt(0),...pt(2)],w:L(num(4)),h:num(5),roof:n[6]||'grey',wall:n[7]||'cream',src:f});
    else if(t==='T')out.push({t,p:pt(0),r:L(num(2)),h:num(3),col:n[4]||'white',src:f});
    else if(t==='O')out.push({t,p:pt(0),r:L(num(2)),col:n[3]||'white',src:f});
    else if(t==='Y')out.push({t,p:[...pt(0),...pt(2)],w:L(num(4)),tiers:num(5)||3,fill:n[6]===undefined?.85:+n[6],src:f});
    else if(t==='G')out.push({t,col:n[0],p:poly(1),src:f});
    else if(t==='E')out.push({t,col:n[0],p:poly(1),src:f});
    else if(t==='V')out.push({t,p:[...pt(0),...pt(2)],w:L(num(4)),kind:n[5]||'cargo',col:n[6]||'',src:f});
    else if(t==='P'||t==='M'||t==='D')out.push({t,w:L(num(0)),p:poly(1),kind:n.find((v,i)=>i>0&&isNaN(+v))||'',src:f});
    else if(t==='W'||t==='n')out.push({t,p:poly(0),src:f});
    else if(t==='N')out.push({t,p:pt(0),r:L(num(2)),src:f});
    else if(t==='K'||t==='R')out.push({t,p:[...pt(0),...pt(2)],kind:n[4]||'',src:f});
    else if(t==='L'||t==='C')out.push({t,p:pt(0),kind:n[2]||'',arg:n[2]==='fleet'||n[2]==='monument'&&0?+n[3]:L(+n[3]||0),src:f});
    else console.error('unknown',f,line);
    for(let i=_len;i<out.length;i++)out[i].tc=tc;
  }}
// the same building traced on two overlapping tiles: keep the reading nearer its tile centre
{const cen=o=>o.p.length>2?[(o.p[0]+o.p[2])/2,(o.p[1]+o.p[3])/2]:o.p,solid=o=>'SFTO'.includes(o.t);let nd=0;
 for(let i=0;i<out.length;i++)for(let j=i+1;j<out.length;j++){const A=out[i],B=out[j];if(!A||!B||A.src===B.src||!solid(A)||!solid(B))continue;const a=cen(A),b=cen(B);if(Math.hypot(a[0]-b[0],a[1]-b[1])<14){const da=Math.hypot(a[0]-A.tc[0],a[1]-A.tc[1]),db=Math.hypot(b[0]-B.tc[0],b[1]-B.tc[1]);if(da<=db)out[j]=null;else{out[i]=null;break;}nd++;}}
 for(let i=out.length-1;i>=0;i--)if(!out[i])out.splice(i,1);}
const S=out;
const R=v=>Math.round(v),R1=v=>Math.round(v*10)/10,P=p=>p.map(R).join(',');
const by={};for(const o of S)(by[o.t]=by[o.t]||[]).push(o);
const q=s=>"'"+s+"'";
const L=[];
L.push(`/* ---------- sites between Mân Quang and Tiên Sa ----------
   Buildings, tanks, stacks, vessels and ground traced by eye over Esri World Imagery (© Esri, Maxar, Earthstar Geographics), tile by tile,
   in the same frame as the map data above (metres, +x west, +z north). Two readings of the same roof on overlapping tiles agree to a few
   metres; that is the accuracy to expect. Rectangles are given by their centreline: x1,z1,x2,z2,width. */`);
L.push('const SITES={');
L.push('// pitched roofs: x1,z1,x2,z2,width,eaves height,roof,wall');
L.push('shed:['+(by.S||[]).map(o=>`[${P(o.p)},${R1(o.w)},${o.h},${q(o.roof)},${q(o.wall)}]`).join(',')+'],');
L.push('// flat roofs and specials (bullets = rack of horizontal LPG tanks, fdock = floating dock)');
L.push('flat:['+(by.F||[]).map(o=>`[${P(o.p)},${R1(o.w)},${o.h},${q(o.roof)},${q(o.wall)}]`).join(',')+'],');
L.push('// tanks x,z,radius,height,colour; spheres x,z,radius,colour');
L.push('tank:['+(by.T||[]).map(o=>`[${P(o.p)},${R1(o.r)},${o.h},${q(o.col)}]`).join(',')+'],');
L.push('sphere:['+(by.O||[]).map(o=>`[${P(o.p)},${R1(o.r)},${q(o.col)}]`).join(',')+'],');
L.push('// container blocks: boxes lie along the centreline; x1,z1,x2,z2,width,tiers');
L.push('stack:['+(by.Y||[]).map(o=>`[${P(o.p)},${R1(o.w)},${o.tiers}]`).join(',')+'],');
L.push('// ground: kind, then the outline');
L.push('ground:['+(by.G||[]).map(o=>`[${q(o.col)},${P(o.p)}]`).join(',')+'],');
L.push('// land the mapped coastline leaves out (spits, causeways): kind, then the outline');
L.push('land:['+(by.E||[]).map(o=>`[${q(o.col)},${P(o.p)}]`).join(',')+'],');
L.push('// vessels stern to bow: x1,z1,x2,z2,beam,kind,colour');
L.push('vessel:['+(by.V||[]).map(o=>`[${P(o.p)},${R1(o.w)},${q(o.kind)},${q(o.col)}]`).join(',')+'],');
L.push('// decks, rock mounds, causeways: width, kind, centreline');
L.push('pier:['+(by.P||[]).map(o=>`[${R1(o.w)},${q(o.kind)},${P(o.p)}]`).join(',')+'],');
L.push('mound:['+(by.M||[]).map(o=>`[${R1(o.w)},${P(o.p)}]`).join(',')+'],');
L.push('cause:['+(by.D||[]).map(o=>`[${R1(o.w)},${P(o.p)}]`).join(',')+'],');
L.push('wall:['+(by.W||[]).map(o=>`[${P(o.p)}]`).join(',')+'],');
L.push('// trees: clumps x,z,radius and rows along a line');
L.push('trees:['+(by.N||[]).map(o=>`[${P(o.p)},${R(o.r)}]`).join(',')+'],');
L.push('treeRow:['+(by.n||[]).map(o=>`[${P(o.p)}]`).join(',')+'],');
L.push('// ship-to-shore cranes (foot, boom tip) and shipyard goliaths (leg, leg)');
L.push('sts:['+(by.K||[]).map(o=>`[${P(o.p)}]`).join(',')+'],');
L.push('goliath:['+(by.R||[]).map(o=>`[${P(o.p)}]`).join(',')+'],');
L.push('// odds and ends: kind,x,z,size (fleet: number of boats; the rest: radius in pixels of the survey tile)');
L.push('misc:['+(by.C||[]).map(o=>`[${q(o.kind.split(' ')[0])},${P(o.p)},${o.arg||0}]`).join(',')+'],');
L.push(`// Tiên Sa container yard, in the port's own grid: d runs along the quays, n inland. Rows of six-wide stacks at n0+k*pitch between d0 and d1.
ts:{dir:[.760,.651],nrm:[-.651,.760],rows:[
  {n0:-1174,pitch:22.2,k:10,d0:1832,d1:2022,tiers:4},                 // behind the south-east berth
  {n0:-1001,pitch:31.2,k:7,d0:2056,d1:2290,tiers:4,cut:[2286,-.81,-1016]},   // upper yard, top edge slants: d < cut0 + cut1*(n - cut2)
  {n0:-1341.5,pitch:24.4,k:6,d0:2336,d1:2600,tiers:4},                // behind the west quay
  {n0:-1136,pitch:16.5,k:7,d0:2062,d1:2326,tiers:3,across:1}]}        // between the inner quay and the upper yard: boxes lie across
};`);
fs.writeFileSync(path.join(__dirname,'..','src','sites.js'),L.join('\n')+'\n');console.log('wrote src/sites.js: '+S.length+' features from '+fs.readdirSync(__dirname).filter(f=>f.endsWith('.txt')).length+' tiles');
