"""
builder_phase1_complete.py  —  CapRush Overdrive!
==================================================
COLOQUE NA RAIZ:  C:\\Users\\User\\Cryptos\\projects\\caprush\\
EXECUTE:          python builder_phase1_complete.py

Gera automaticamente nos lugares certos:
  client/caprush-game-v2.html   (jogo completo)
  server/ws-server.js            (servidor online)
  docs/ONLINE_GUIDE.md
  git_commands.ps1
"""

import os

ROOT = os.path.dirname(os.path.abspath(__file__))

def W(rel, txt):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8') as f:
        f.write(txt)
    print(f'  OK  {rel}')

GAME = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>CapRush - Overdrive!</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:#010108;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:'Courier New',monospace;overflow:hidden}
#lang-bar{position:fixed;top:8px;right:12px;z-index:9999;display:flex;gap:6px}
.lb{padding:4px 10px;font-size:10px;cursor:pointer;border:1px solid #1e3055;background:rgba(0,0,0,.8);color:#334;border-radius:3px;transition:all .15s;font-family:'Courier New',monospace}
.lb.on{color:#FF5500;border-color:#FF5500}.lb:hover{color:#fff;border-color:#fff}
#wrap{display:flex;width:1140px;height:860px;border-radius:10px;overflow:hidden;box-shadow:0 0 80px rgba(255,85,0,.15)}
#cv-area{flex:none;width:940px;height:860px}
#cv-area canvas{display:block!important}
#sp{width:200px;height:860px;background:#07081a;border-left:1px solid rgba(255,85,0,.15);display:flex;flex-direction:column}
.ss{padding:11px 13px;border-bottom:1px solid rgba(255,255,255,.04)}
.st{font-size:8px;letter-spacing:3px;color:#1a2840;margin-bottom:7px;text-transform:uppercase}
#fb-bg{height:7px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden;margin-bottom:4px}
#fb{height:100%;width:0%;background:#FF5500;border-radius:3px;transition:width .05s}
#fp{font-size:22px;font-family:Impact,Arial,sans-serif;color:#FF5500;text-align:center}
#pw{display:flex;align-items:center;gap:8px;margin-bottom:6px}
#pc{border-radius:4px;flex-shrink:0}
#pn{font-family:Impact,Arial,sans-serif;font-size:18px;color:#fff}
#ps{font-size:8px;color:#FF5500;margin-top:2px}
.sr{display:flex;justify-content:space-between;margin-top:3px}
.sk{font-size:8px;color:#1a2840;letter-spacing:1px}
.sv{font-size:11px;font-family:Impact,Arial,sans-serif}
.lr{display:flex;align-items:center;gap:5px;margin-top:4px}
.ld{width:7px;height:7px;border-radius:50%;flex-shrink:0}
.lt{font-size:8px;color:#1a2840}
#el{max-height:210px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;flex:1}
#el::-webkit-scrollbar{width:2px}
#el::-webkit-scrollbar-thumb{background:rgba(255,85,0,.25)}
.ei{font-size:8px;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.03);line-height:1.4}
.ej{color:#2a3f60}.ec{color:#FFD700}.el2{color:#FF5500}.eh{color:#CC44FF}.ew{color:#44AAFF}.eg{color:#44FF88}.ep{color:#FF8833}
</style>
</head>
<body>
<div id="lang-bar">
  <button class="lb on" onclick="GL('pt')">PT</button>
  <button class="lb"    onclick="GL('en')">EN</button>
  <button class="lb"    onclick="GL('es')">ES</button>
</div>
<div id="wrap">
  <div id="cv-area"></div>
  <div id="sp">
    <div class="ss"><div class="st" id="s-fo">FORCA</div><div id="fb-bg"><div id="fb"></div></div><div id="fp">0%</div></div>
    <div class="ss">
      <div class="st" id="s-pi">PILOTO</div>
      <div id="pw"><canvas id="pc" width="52" height="52"></canvas><div><div id="pn">-</div><div id="ps">-</div></div></div>
      <div class="sr"><span class="sk" id="s-eq">EQUILIBRIO</span><span class="sv" id="ve" style="color:#FF5500">-</span></div>
      <div class="sr"><span class="sk" id="s-co">CONTROLE</span><span class="sv" id="vc" style="color:#00EEFF">-</span></div>
      <div class="sr"><span class="sk" id="s-ad">ADERENCIA</span><span class="sv" id="va" style="color:#FFD700">-</span></div>
    </div>
    <div class="ss">
      <div class="st" id="s-tr">PISTA</div>
      <div class="lr"><div class="ld" style="background:#6e4a1e"></div><div class="lt" id="l-as">Asfalto (normal)</div></div>
      <div class="lr"><div class="ld" style="background:#1855cc"></div><div class="lt" id="l-wa">Agua (freia muito)</div></div>
      <div class="lr"><div class="ld" style="background:#2a7a12"></div><div class="lt" id="l-gr">Grama (desliza!)</div></div>
      <div class="lr"><div class="ld" style="background:#EEbb00"></div><div class="lt" id="l-gd">Arquibancada</div></div>
      <div class="lr"><div class="ld" style="background:#FF5500"></div><div class="lt" id="l-pd">Paddock (turno)</div></div>
    </div>
    <div class="ss" style="flex:1;overflow:hidden"><div class="st" id="s-ev">EVENTOS</div><div id="el"></div></div>
  </div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/phaser/3.60.0/phaser.min.js"></script>
<script>
/* i18n */
const TX={
  pt:{fo:'FORCA',pi:'PILOTO',tr:'PISTA',ev:'EVENTOS',eq:'EQUILIBRIO',co:'CONTROLE',ad:'ADERENCIA',
    la:'Asfalto (normal)',lw:'Agua (freia muito)',lg:'Grama (desliza!)',lgd:'Arquibancada',lpd:'Paddock (perde turno)',
    m1:'SOLO vs Bots',m2:'1 x 1 LOCAL',m3:'1 x 1 ONLINE',hint:'Arraste para tras da tampinha e solte',hint2:'Online: rode node server/ws-server.js',
    ch:'ESCOLHA SEU PILOTO',pl:'JOGAR COM ',bk:'MENU',
    rd:'Prepare-se...',go:'VA!',dr:'Arraste para lancar!',lp:'VOLTA',cp:'CHECKPOINTS',rs:'[RESET +5]',p2:'VEZ DO P2',
    ew:'Entrou na agua',eg:'Entrou na grama',eb:'Bateu na borda',egd:'Bateu na arquibancada!',epd:'Paddock - perde 1 turno!',
    el:'Lancou',ecp:'Checkpoint',elp:'Volta completa! +$CR 120',
    wi:'VITORIA!',bw:'BOT VENCEU',ti:'Tempo',la2:'lancamentos',cr:'CR ganhos',ag:'JOGAR DE NOVO',me:'MENU',
    sy:'Samoieda',sk:'Maine Coon',sb:'SRD',st:'Golden + Asas',
    py:'Impulso Inercial',pk:'Trajetoria Longa',pb:'Estabilidade no Terreno',pt2:'Velocidade em Curvas',
    ow:'Aguardando jogador 2...',oc:'Copiar Link',ocp:'Copiado!',oo:'Servidor offline. Rode: node server/ws-server.js',os:'Compartilhe com seu amigo:'},
  en:{fo:'POWER',pi:'PILOT',tr:'TRACK',ev:'EVENTS',eq:'BALANCE',co:'CONTROL',ad:'GRIP',
    la:'Asphalt (normal)',lw:'Water (heavy brake)',lg:'Grass (slippery!)',lgd:'Grandstand',lpd:'Paddock (skip turn)',
    m1:'SOLO vs Bots',m2:'1 v 1 LOCAL',m3:'1 v 1 ONLINE',hint:'Drag behind your cap and release',hint2:'Online: run node server/ws-server.js',
    ch:'CHOOSE YOUR PILOT',pl:'PLAY AS ',bk:'MENU',
    rd:'Get ready...',go:'GO!',dr:'Drag to shoot!',lp:'LAP',cp:'CHECKPOINTS',rs:'[RESET +5]',p2:"P2's TURN",
    ew:'Entered water',eg:'Entered grass',eb:'Hit border',egd:'Hit grandstand!',epd:'Paddock - skip 1 turn!',
    el:'Launched',ecp:'Checkpoint',elp:'Lap complete! +$CR 120',
    wi:'VICTORY!',bw:'BOT WON',ti:'Time',la2:'launches',cr:'CR earned',ag:'PLAY AGAIN',me:'MENU',
    sy:'Samoyed',sk:'Maine Coon',sb:'Mixed Breed',st:'Golden + Wings',
    py:'Inertial Boost',pk:'Long Trajectory',pb:'Terrain Stability',pt2:'Speed on Curves',
    ow:'Waiting for player 2...',oc:'Copy Link',ocp:'Copied!',oo:'Server offline. Run: node server/ws-server.js',os:'Share with your friend:'},
  es:{fo:'FUERZA',pi:'PILOTO',tr:'PISTA',ev:'EVENTOS',eq:'EQUILIBRIO',co:'CONTROL',ad:'ADHERENCIA',
    la:'Asfalto (normal)',lw:'Agua (frena mucho)',lg:'Pasto (resbala!)',lgd:'Tribuna',lpd:'Boxes (pierde turno)',
    m1:'SOLO vs Bots',m2:'1 x 1 LOCAL',m3:'1 x 1 ONLINE',hint:'Arrastra hacia atras y suelta',hint2:'Online: ejecuta node server/ws-server.js',
    ch:'ELIGE TU PILOTO',pl:'JUGAR CON ',bk:'MENU',
    rd:'Preparate...',go:'YA!',dr:'Arrastra para lanzar!',lp:'VUELTA',cp:'CHECKPOINTS',rs:'[RESET +5]',p2:'TURNO J2',
    ew:'Entro al agua',eg:'Entro al pasto',eb:'Golpeo el borde',egd:'Golpeo la tribuna!',epd:'Boxes - pierde 1 turno!',
    el:'Lanzo',ecp:'Checkpoint',elp:'Vuelta completa! +$CR 120',
    wi:'VICTORIA!',bw:'BOT GANO',ti:'Tiempo',la2:'lanzamientos',cr:'CR ganados',ag:'JUGAR DE NUEVO',me:'MENU',
    sy:'Samoyedo',sk:'Maine Coon',sb:'Mestizo',st:'Golden + Alas',
    py:'Impulso Inercial',pk:'Trayectoria Larga',pb:'Estabilidad en Terreno',pt2:'Velocidad en Curvas',
    ow:'Esperando jugador 2...',oc:'Copiar Enlace',ocp:'Copiado!',oo:'Servidor desconectado. Ejecuta: node server/ws-server.js',os:'Comparte con tu amigo:'}
};
let LANG='pt';
function t(k){return TX[LANG][k]||TX.pt[k]||k;}
function GL(l){
  LANG=l;
  document.querySelectorAll('.lb').forEach(b=>b.classList.remove('on'));
  {const m={pt:0,en:1,es:2};document.querySelectorAll('.lb')[m[l]].classList.add('on');}
  const ids={
    's-fo':'fo','s-pi':'pi','s-tr':'tr','s-ev':'ev',
    's-eq':'eq','s-co':'co','s-ad':'ad',
    'l-as':'la','l-wa':'lw','l-gr':'lg','l-gd':'lgd','l-pd':'lpd'
  };
  for(const[id,k]of Object.entries(ids)){const e=document.getElementById(id);if(e)e.textContent=t(k);}
  if(window.PG){const s=window.PG.scene.getScenes(true)[0];if(s)s.scene.restart();}
}

/* CONFIG */
const GW=940,GH=860;
const CHARS={
  Yuki: {power:1.4,fric:0.9,col:0xDDEEFF,eq:82,co:91,ad:75},
  Kenta:{power:0.8,fric:1.0,col:0x8B6914,eq:70,co:98,ad:80},
  Bruna:{power:1.0,fric:1.1,col:0x5C3317,eq:88,co:85,ad:92},
  Tapz: {power:0.7,fric:1.3,col:0xFFCC66,eq:75,co:92,ad:95},
};
const RETAIN={DIRT:0.76,GRASS:0.97,WATER:0.30};
const TR={
  outer:{x:62,y:68,w:826,h:760},
  island:[{x:148,y:120,w:272,h:216},{x:558,y:120,w:298,h:216},{x:148,y:336,w:710,h:462}],
  notch:{x:420,y:120,w:138,h:216},
  grand:{x:858,y:120,w:68,h:455},
  pad:{x:62,y:170,w:90,h:358},
  water:{cx:175,cy:720,rx:70,ry:45},
  grass:[{x:296,y:748,w:84,h:54},{x:676,y:748,w:84,h:54}],
  cps:[{x:489,y:300,r:44,col:0xFFD700,lbl:'CP1',cr:30},{x:875,y:568,r:44,col:0x44FF88,lbl:'CP2',cr:30},{x:489,y:812,r:44,col:0x00EEFF,lbl:'CP3',cr:30}],
  sx:90,sy:450,fin:{x:82,y:402,h:100}
};

/* PHYSICS */
class V2{constructor(x=0,y=0){this.x=x;this.y=y}len(){return Math.sqrt(this.x*this.x+this.y*this.y)}norm(){const l=this.len();return l>0?new V2(this.x/l,this.y/l):new V2()}scale(s){return new V2(this.x*s,this.y*s)}add(v){return new V2(this.x+v.x,this.y+v.y)}sub(v){return new V2(this.x-v.x,this.y-v.y)}clone(){return new V2(this.x,this.y)}}
class Body{
  constructor(ch){this.pos=new V2();this.vel=new V2();this.angle=0;this.stopped=true;this.ch=ch;this.surf='DIRT';}
  launch(from,to){const d=from.sub(to);const dist=Math.min(d.len(),165);this.vel=d.norm().scale((dist/165)*this.ch.power*720);this.stopped=false;}
  step(dt){if(this.stopped)return;const r=Math.pow((RETAIN[this.surf]||0.76)*this.ch.fric,dt);this.vel=this.vel.scale(r);this.pos=this.pos.add(this.vel.scale(dt));if(this.vel.len()<8){this.vel=new V2();this.stopped=true;}this.angle+=this.vel.len()*0.02;}
  reflect(nx,ny,e=0.65){const d=this.vel.x*nx+this.vel.y*ny;if(d>=0)return false;this.vel.x-=(1+e)*d*nx;this.vel.y-=(1+e)*d*ny;this.stopped=false;return true;}
  preview(from,to){const b=new Body(this.ch);b.pos=this.pos.clone();b.surf=this.surf;b.launch(from,to);const pts=[];for(let i=0;i<12;i++){b.step(0.08);pts.push(b.pos.clone());if(b.stopped)break;}return pts;}
}
function capCol(a,b,R=18){const dx=b.pos.x-a.pos.x,dy=b.pos.y-a.pos.y,d=Math.sqrt(dx*dx+dy*dy),m=R*2;if(d>=m||d<.01)return false;const nx=dx/d,ny=dy/d,ov=(m-d)*.5;a.pos.x-=nx*ov;a.pos.y-=ny*ov;b.pos.x+=nx*ov;b.pos.y+=ny*ov;const dvx=a.vel.x-b.vel.x,dvy=a.vel.y-b.vel.y,dvn=dvx*nx+dvy*ny;if(dvn>=0)return false;const j=-(1.75)*dvn/2;a.vel.x+=j*nx;a.vel.y+=j*ny;b.vel.x-=j*nx;b.vel.y-=j*ny;a.stopped=b.stopped=false;return true;}
function getSurf(x,y){const{cx,cy,rx,ry}=TR.water;if((x-cx)**2/rx**2+(y-cy)**2/ry**2<1)return 'WATER';for(const g of TR.grass)if(x>g.x&&x<g.x+g.w&&y>g.y&&y<g.y+g.h)return 'GRASS';return 'DIRT';}
function islandHit(x,y,r=18){const vn=TR.notch;for(const ir of TR.island){if(x>vn.x&&x<vn.x+vn.w&&y>vn.y&&y<vn.y+vn.h)continue;if(x>ir.x-r&&x<ir.x+ir.w+r&&y>ir.y-r&&y<ir.y+ir.h+r){const l=Math.abs(x-(ir.x-r)),rr=Math.abs(x-(ir.x+ir.w+r)),tp=Math.abs(y-(ir.y-r)),bt=Math.abs(y-(ir.y+ir.h+r)),m=Math.min(l,rr,tp,bt);return m===l?{nx:-1,ny:0}:m===rr?{nx:1,ny:0}:m===tp?{nx:0,ny:-1}:{nx:0,ny:1};}}return null;}
function worldBounce(b,r=18){const o=TR.outer;let h=false;if(b.pos.x-r<o.x){b.pos.x=o.x+r;b.reflect(1,0,.55);h=true;}if(b.pos.x+r>o.x+o.w){b.pos.x=o.x+o.w-r;b.reflect(-1,0,.55);h=true;}if(b.pos.y-r<o.y){b.pos.y=o.y+r;b.reflect(0,1,.55);h=true;}if(b.pos.y+r>o.y+o.h){b.pos.y=o.y+o.h-r;b.reflect(0,-1,.55);h=true;}return h;}
function zoneHit(b,r,rect){const{x,y,w,h}=rect;if(b.pos.x+r>x&&b.pos.x-r<x+w&&b.pos.y+r>y&&b.pos.y-r<y+h){const l=Math.abs(b.pos.x-r-x),rr=Math.abs(b.pos.x+r-(x+w)),tp=Math.abs(b.pos.y-r-y),bt=Math.abs(b.pos.y+r-(y+h)),m=Math.min(l,rr,tp,bt);let nx=0,ny=0;if(m===l){nx=-1;b.pos.x=x-r;}else if(m===rr){nx=1;b.pos.x=x+w+r;}else if(m===tp){ny=-1;b.pos.y=y-r;}else{ny=1;b.pos.y=y+h+r;}return{nx,ny};}return null;}

/* SIDE PANEL */
const SP={
  power(p){const pct=Math.round(p*100);const fb=document.getElementById('fb');fb.style.width=pct+'%';fb.style.background=p>.7?'#DD1100':p>.4?'#FF8800':'#44FF88';const fp=document.getElementById('fp');fp.textContent=pct+'%';fp.style.color=p>.7?'#FF3300':p>.4?'#FF8800':'#44FF88';},
  clearP(){document.getElementById('fb').style.width='0%';document.getElementById('fp').textContent='0%';},
  pilot(id){const c=CHARS[id];document.getElementById('pn').textContent=id.toUpperCase();document.getElementById('ps').textContent=t(id==='Yuki'?'py':id==='Kenta'?'pk':id==='Bruna'?'pb':'pt2');document.getElementById('ve').textContent=c.eq;document.getElementById('vc').textContent=c.co;document.getElementById('va').textContent=c.ad;const cv=document.getElementById('pc');const ctx=cv.getContext('2d');ctx.clearRect(0,0,52,52);ART[id](ctx,26,26,22);},
  log(txt,cls='ej'){const el=document.getElementById('el');const d=document.createElement('div');d.className='ei '+cls;d.textContent=txt;el.insertBefore(d,el.firstChild);while(el.children.length>35)el.removeChild(el.lastChild);}
};

/* CHARACTER ART */
const ART={};
function _shadow(ctx,cx,cy,r){ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(cx+2,cy+r*.55,r*.65,r*.2,0,0,Math.PI*2);ctx.fill();}
function _bow(ctx,cx,cy,r,c1,c2){ctx.fillStyle=c1;ctx.beginPath();ctx.ellipse(cx-r*.28,cy,r*.22,r*.13,-.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(cx+r*.06,cy,r*.22,r*.13,.5,0,Math.PI*2);ctx.fill();ctx.fillStyle=c2;ctx.beginPath();ctx.arc(cx-r*.1,cy,r*.1,0,Math.PI*2);ctx.fill();}
function _eyes(ctx,cx,cy,r,iris,pupil){for(const s of[-1,1]){ctx.fillStyle=iris;ctx.beginPath();ctx.arc(cx+s*r*.22,cy,r*.12,0,Math.PI*2);ctx.fill();ctx.fillStyle=pupil;ctx.beginPath();ctx.arc(cx+s*r*.22,cy,r*.07,0,Math.PI*2);ctx.fill();ctx.fillStyle='white';ctx.beginPath();ctx.arc(cx+s*r*.22-r*.03,cy-r*.04,r*.04,0,Math.PI*2);ctx.fill();}}

ART.Yuki=function(ctx,cx,cy,r){
  _shadow(ctx,cx,cy,r);
  for(const[dx,dy,s]of[[0,0,1],[-.35,.1,.72],[.35,.1,.72],[0,-.3,.76],[-.25,-.35,.56],[.25,-.35,.56],[-.4,.3,.5],[.4,.3,.5]]){
    const g=ctx.createRadialGradient(cx+dx*r,cy+dy*r,0,cx+dx*r,cy+dy*r,r*s*.75);
    g.addColorStop(0,'#f0f4ff');g.addColorStop(1,'#d0dcf0');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx+dx*r,cy+dy*r,r*s*.75,0,Math.PI*2);ctx.fill();
  }
  ctx.fillStyle='#e2eaf8';
  ctx.beginPath();ctx.moveTo(cx-r*.28,cy-r*.42);ctx.lineTo(cx-r*.52,cy-r*.78);ctx.lineTo(cx-r*.08,cy-r*.52);ctx.fill();
  ctx.beginPath();ctx.moveTo(cx+r*.28,cy-r*.42);ctx.lineTo(cx+r*.52,cy-r*.78);ctx.lineTo(cx+r*.08,cy-r*.52);ctx.fill();
  ctx.fillStyle='#ffb8cc';
  ctx.beginPath();ctx.moveTo(cx-r*.28,cy-r*.48);ctx.lineTo(cx-r*.46,cy-r*.7);ctx.lineTo(cx-r*.12,cy-r*.55);ctx.fill();
  ctx.beginPath();ctx.moveTo(cx+r*.28,cy-r*.48);ctx.lineTo(cx+r*.46,cy-r*.7);ctx.lineTo(cx+r*.12,cy-r*.55);ctx.fill();
  _eyes(ctx,cx,cy-r*.05,r,'#1a1a2e','#000');
  ctx.fillStyle='#ffb0cc';ctx.beginPath();ctx.ellipse(cx,cy+r*.1,r*.1,r*.07,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#aa3355';ctx.lineWidth=r*.08;ctx.lineCap='round';
  ctx.beginPath();ctx.arc(cx,cy+r*.18,r*.14,.1,Math.PI-.1);ctx.stroke();
  ctx.fillStyle='#ff6688';ctx.beginPath();ctx.ellipse(cx,cy+r*.3,r*.1,r*.08,0,0,Math.PI*2);ctx.fill();
};

ART.Kenta=function(ctx,cx,cy,r){
  _shadow(ctx,cx,cy,r);
  const g=ctx.createRadialGradient(cx-r*.2,cy-r*.1,r*.05,cx,cy,r*.88);
  g.addColorStop(0,'#a0621e');g.addColorStop(1,'#5a3510');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r*.86,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='rgba(40,20,5,.5)';ctx.lineWidth=r*.1;
  for(const sc of[.42,.6,.76]){ctx.beginPath();ctx.arc(cx,cy,r*sc,Math.PI*.7,Math.PI*1.6);ctx.stroke();}
  ctx.fillStyle='#c8883a';ctx.beginPath();ctx.ellipse(cx,cy+r*.18,r*.38,r*.48,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#7a4f1e';
  ctx.beginPath();ctx.moveTo(cx-r*.3,cy-r*.52);ctx.lineTo(cx-r*.56,cy-r*.92);ctx.lineTo(cx-r*.06,cy-r*.6);ctx.fill();
  ctx.beginPath();ctx.moveTo(cx+r*.3,cy-r*.52);ctx.lineTo(cx+r*.56,cy-r*.92);ctx.lineTo(cx+r*.06,cy-r*.6);ctx.fill();
  ctx.fillStyle='#ffb8cc';
  ctx.beginPath();ctx.moveTo(cx-r*.3,cy-r*.56);ctx.lineTo(cx-r*.5,cy-r*.84);ctx.lineTo(cx-r*.1,cy-r*.64);ctx.fill();
  ctx.beginPath();ctx.moveTo(cx+r*.3,cy-r*.56);ctx.lineTo(cx+r*.5,cy-r*.84);ctx.lineTo(cx+r*.1,cy-r*.64);ctx.fill();
  for(const s of[-1,1]){ctx.fillStyle='#1e6644';ctx.beginPath();ctx.ellipse(cx+s*r*.23,cy-r*.08,r*.13,r*.16,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111';ctx.beginPath();ctx.ellipse(cx+s*r*.23,cy-r*.08,r*.06,r*.14,s*.25,0,Math.PI*2);ctx.fill();ctx.fillStyle='white';ctx.beginPath();ctx.arc(cx+s*r*.22,cy-r*.14,r*.05,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#cc6677';ctx.beginPath();ctx.arc(cx,cy+r*.09,r*.07,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#884455';ctx.lineWidth=r*.06;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(cx,cy+r*.16);ctx.lineTo(cx+r*.2,cy+r*.24);ctx.stroke();
};

ART.Bruna=function(ctx,cx,cy,r){
  _shadow(ctx,cx,cy,r);
  const g=ctx.createRadialGradient(cx-r*.15,cy-r*.1,r*.05,cx,cy,r*.88);
  g.addColorStop(0,'#5c3317');g.addColorStop(1,'#2e1508');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r*.86,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#7a4820';ctx.beginPath();ctx.ellipse(cx,cy+r*.15,r*.36,r*.44,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#1e0d04';
  ctx.beginPath();ctx.ellipse(cx-r*.5,cy+r*.08,r*.2,r*.4,-.38,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+r*.5,cy+r*.08,r*.2,r*.4,.38,0,Math.PI*2);ctx.fill();
  _eyes(ctx,cx,cy-r*.05,r,'#3d1e00','#111');
  ctx.fillStyle='#1a0800';ctx.beginPath();ctx.ellipse(cx,cy+r*.1,r*.11,r*.08,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#5c2010';ctx.lineWidth=r*.07;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(cx-r*.16,cy+r*.2);ctx.quadraticCurveTo(cx,cy+r*.32,cx+r*.16,cy+r*.2);ctx.stroke();
  _bow(ctx,cx-r*.14,cy-r*.62,r,'#FF6699','#FF99BB');
};

ART.Tapz=function(ctx,cx,cy,r){
  _shadow(ctx,cx,cy,r);
  // wings
  for(const flip of[false,true]){
    ctx.save();if(flip){ctx.translate(cx*2,0);ctx.scale(-1,1);}
    ctx.fillStyle='rgba(210,230,255,.8)';
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.bezierCurveTo(cx-r*1.1,cy-r*.55,cx-r*1.55,cy+r*.35,cx-r*.75,cy+r*.52);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(160,195,255,.4)';ctx.lineWidth=1;
    for(const sc of[.35,.6,.85]){ctx.beginPath();ctx.moveTo(cx,cy);ctx.bezierCurveTo(cx-r*(.3+sc*.3),cy-r*.1,cx-r*(.8+sc*.4),cy+r*.22,cx-r*(.55+sc*.4),cy+r*.48);ctx.stroke();}
    ctx.restore();
  }
  // body
  const g=ctx.createRadialGradient(cx-r*.2,cy-r*.15,r*.05,cx,cy,r*.84);
  g.addColorStop(0,'#ffe055');g.addColorStop(.6,'#d4940a');g.addColorStop(1,'#a06800');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r*.84,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ffe8a0';ctx.beginPath();ctx.ellipse(cx,cy+r*.14,r*.4,r*.5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#c08800';
  ctx.beginPath();ctx.ellipse(cx-r*.5,cy+r*.06,r*.22,r*.42,-.34,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+r*.5,cy+r*.06,r*.22,r*.42,.34,0,Math.PI*2);ctx.fill();
  // halo
  ctx.save();ctx.shadowColor='#FFD700';ctx.shadowBlur=8;
  ctx.strokeStyle='#FFD700';ctx.lineWidth=r*.1;
  ctx.beginPath();ctx.ellipse(cx,cy-r*.86,r*.3,r*.09,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
  _eyes(ctx,cx,cy-r*.06,r,'#3d1e00','#111');
  ctx.fillStyle='#cc6688';ctx.beginPath();ctx.arc(cx,cy+r*.1,r*.07,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#994455';ctx.lineWidth=r*.07;ctx.lineCap='round';
  ctx.beginPath();ctx.arc(cx,cy+r*.19,r*.14,.1,Math.PI-.1);ctx.stroke();
  _bow(ctx,cx-r*.14,cy-r*.6,r,'#88CCFF','#BBDDFF');
};

/* CROWD */
class Crowd{
  constructor(sc,x,y,w,h){this.m=[];const cols=Math.floor(w/10),rows=5,rH=h/rows;const cs=[0xFF2222,0x2222FF,0xFFFF00,0xFF8800,0x00FF44,0xFFFFFF];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const mx=x+c*10+5+(r%2)*5,my=y+r*rH+rH/2;const d=sc.add.circle(mx,my,3.5,cs[Math.floor(Math.random()*cs.length)]).setDepth(8);this.m.push({d,bY:my,bX:mx,ph:Math.random()*Math.PI*2,sp:.8+Math.random()*1.5});}}
  update(t){this.m.forEach(m=>{m.d.y=m.bY+Math.sin(m.ph+t*.001*m.sp)*5;m.d.x=m.bX+Math.sin(m.ph*.5+t*.0005)*2;});}
  destroy(){this.m.forEach(m=>m.d.destroy());}
}

/* ======================= MENU ======================= */
class Menu extends Phaser.Scene{
  constructor(){super('Menu');}
  create(){
    const g=this.add.graphics();
    g.fillStyle(0x010108);g.fillRect(0,0,GW,GH);
    g.lineStyle(1,0xFF5500,.015);for(let x=0;x<GW+80;x+=44){g.beginPath();g.moveTo(x,0);g.lineTo(x-40,GH);g.strokePath();}
    // speed lines accent
    g.fillStyle(0xFF5500,.9);g.fillRect(36,54,6,180);
    [[58,420,1,.7],[64,300,2.5,.45],[70,190,1,.28]].forEach(([y,w,h,a])=>{g.fillStyle(0xFF5500,a);g.fillRect(0,y,w,h);});
    // grunge border
    const lg=this.add.graphics();
    lg.lineStyle(2,0xFF5500,.15);lg.strokeRect(48,58,568,140);
    // CAP + RUSH text logo
    const cap=this.add.text(56,182,'CAP',{fontFamily:"Impact,'Arial Black',Arial,sans-serif",fontSize:'120px',color:'#FFFFFF',stroke:'#001833',strokeThickness:6}).setOrigin(0,1);
    const rush=this.add.text(275,182,'RUSH',{fontFamily:"Impact,'Arial Black',Arial,sans-serif",fontSize:'120px',color:'#FF5500',stroke:'#661a00',strokeThickness:5}).setOrigin(0,1);
    // scratch marks grunge effect
    const sg=this.add.graphics();
    sg.lineStyle(1,0xffffff,.1);
    [[60,100,155,88],[210,72,165,94],[330,68,385,80],[425,90,505,74],[105,148,82,144]].forEach(([x1,y1,x2,y2])=>{sg.beginPath();sg.moveTo(x1,y1);sg.lineTo(x2,y2);sg.strokePath();});
    // rule + overdrive
    const rg=this.add.graphics();rg.fillStyle(0xFF5500,.92);rg.fillRect(56,186,546,4);
    this.add.text(64,228,'- OVERDRIVE!',{fontFamily:"Impact,'Arial Black',Arial,sans-serif",fontSize:'36px',color:'#00EEFF',fontStyle:'italic'}).setLetterSpacing(8);
    // bottlecap icon right of logo
    const bc=this.add.graphics();
    for(let i=0;i<16;i++){const a=i*Math.PI/8,ra=a+.18;bc.fillStyle(0xFF5500,.7);bc.fillTriangle(580+42*Math.cos(a),155+42*Math.sin(a),580+42*Math.cos(ra),155+42*Math.sin(ra),580+35*Math.cos((a+ra)/2),155+35*Math.sin((a+ra)/2));}
    bc.fillStyle(0xCC3300,.9);bc.fillCircle(580,155,30);bc.fillStyle(0xFF6600,.7);bc.fillCircle(580,155,22);
    bc.fillStyle(0xffffff,.5);bc.fillCircle(574,149,8);
    this.add.text(580,155,'II',{fontFamily:"Impact,Arial,sans-serif",fontSize:'20px',color:'rgba(255,255,255,0.9)'}).setOrigin(.5);
    // logo hover
    this.input.on('pointermove',p=>{if(p.x>50&&p.x<620&&p.y>55&&p.y<190){this.tweens.add({targets:[cap,rush],scaleX:{from:1,to:1.015},scaleY:{from:1,to:1.015},duration:80,yoyo:true,ease:'Sine.easeOut'});}});
    // tagline
    this.add.text(66,268,'TAMPINHAS  x  ANIME  x  WEB3',{fontFamily:"'Courier New',monospace",fontSize:'11px',color:'#1e3050'});
    // mode buttons
    const modes=[['m1','solo','#AA2200'],['m2','local','#0e3a7a'],['m3','online','#083322']];
    modes.forEach(([key,mode,bg],i)=>{
      const btn=this.add.text(GW/2,338+i*68,' '+t(key)+' ',{fontFamily:"'Courier New',monospace",fontSize:'20px',fontStyle:'bold',color:'#fff',backgroundColor:bg,padding:{x:28,y:14}}).setOrigin(.5).setInteractive({cursor:'pointer'});
      this.tweens.add({targets:btn,scaleX:1.018,scaleY:1.018,duration:900+i*130,yoyo:true,repeat:-1,ease:'Sine.easeInOut',delay:i*220});
      btn.on('pointerdown',()=>this.scene.start('Lobby',{mode}));
      btn.on('pointerover',()=>btn.setStyle({backgroundColor:'#FF4400'}));
      btn.on('pointerout',()=>btn.setStyle({backgroundColor:bg}));
    });
    this.add.text(GW/2,556,t('hint'),{fontFamily:"'Courier New',monospace",fontSize:'11px',color:'#334455'}).setOrigin(.5);
    this.add.text(GW/2,574,t('hint2'),{fontFamily:"'Courier New',monospace",fontSize:'10px',color:'#1e2e3e'}).setOrigin(.5);
  }
}

/* ======================= LOBBY ======================= */
class Lobby extends Phaser.Scene{
  constructor(){super('Lobby');}
  init(d){this.mode=d?.mode||'solo';}
  create(){
    const g=this.add.graphics();
    g.fillStyle(0x010108);g.fillRect(0,0,GW,GH);
    g.lineStyle(1,0xFF5500,.015);for(let x=0;x<GW+80;x+=44){g.beginPath();g.moveTo(x,0);g.lineTo(x-40,GH);g.strokePath();}
    const mL={solo:t('m1'),local:t('m2'),online:t('m3')}[this.mode];
    this.add.text(GW/2,28,t('ch')+' - '+mL,{fontFamily:"Impact,'Arial Black',Arial,sans-serif",fontSize:'22px',color:'#FF5500'}).setOrigin(.5);
    const ids=Object.keys(CHARS),cW=210,gap=14;
    const tx=(GW-(ids.length*cW+(ids.length-1)*gap))/2;
    ids.forEach((id,i)=>{
      const c=CHARS[id],x=tx+i*(cW+gap);
      const cg=this.add.graphics();
      const drawCard=(hl)=>{cg.clear();cg.fillStyle(hl?0x110e2a:0x0a0a1e);cg.fillRoundedRect(x,65,cW,690,7);cg.lineStyle(hl?2:1,hl?0xFF5500:0x1a2540);cg.strokeRoundedRect(x,65,cW,690,7);};
      drawCard(false);
      // character portrait
      const oc=document.createElement('canvas');oc.width=170;oc.height=190;
      const ctx=oc.getContext('2d');
      ctx.fillStyle='#0e0e22';ctx.beginPath();ctx.arc(85,95,80,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#1e3055';ctx.lineWidth=2;ctx.stroke();
      ART[id](ctx,85,95,72);
      const key='port_'+id;
      try{if(this.textures.exists(key))this.textures.remove(key);this.textures.addCanvas(key,oc);}catch(e){}
      this.add.image(x+cW/2,182,key).setDepth(5);
      this.add.text(x+cW/2,298,id.toUpperCase(),{fontFamily:"Impact,'Arial Black',Arial,sans-serif",fontSize:'26px',color:'#fff'}).setOrigin(.5);
      const subs={Yuki:t('sy'),Kenta:t('sk'),Bruna:t('sb'),Tapz:t('st')};
      this.add.text(x+cW/2,322,subs[id],{fontFamily:"'Courier New',monospace",fontSize:'9px',color:'#334'}).setOrigin(.5);
      const specs={Yuki:t('py'),Kenta:t('pk'),Bruna:t('pb'),Tapz:t('pt2')};
      this.add.text(x+cW/2,342,'* '+specs[id],{fontFamily:"'Courier New',monospace",fontSize:'9px',color:'#FF5500',wordWrap:{width:cW-18},align:'center'}).setOrigin(.5);
      const stats=[['eq',c.eq,'#FF5500'],['co',c.co,'#00EEFF'],['ad',c.ad,'#FFD700']];
      stats.forEach(([key2,val,col],si)=>{
        const sy=385+si*30;
        this.add.text(x+12,sy,t(key2),{fontFamily:"'Courier New',monospace",fontSize:'8px',color:'#1a2a40'});
        this.add.text(x+cW-12,sy,val,{fontFamily:"'Courier New',monospace",fontSize:'11px',color:col}).setOrigin(1,0);
        g.fillStyle(0x0e1228);g.fillRect(x+12,sy+13,cW-24,5);
        g.fillStyle(parseInt(col.replace('#','0x')),.6);g.fillRect(x+12,sy+13,(val/100)*(cW-24),5);
      });
      const btn=this.add.text(x+cW/2,648,t('pl')+id.toUpperCase(),{fontFamily:"'Courier New',monospace",fontSize:'11px',color:'#fff',backgroundColor:'#AA2200',padding:{x:14,y:9}}).setOrigin(.5).setInteractive({cursor:'pointer'});
      btn.on('pointerover',()=>{btn.setStyle({backgroundColor:'#FF4400'});drawCard(true);});
      btn.on('pointerout',()=>{btn.setStyle({backgroundColor:'#AA2200'});drawCard(false);});
      btn.on('pointerdown',()=>this.scene.start('Game',{charId:id,mode:this.mode}));
    });
    const back=this.add.text(GW/2,730,'<- '+t('bk'),{fontFamily:"'Courier New',monospace",fontSize:'13px',color:'#1a2840'}).setOrigin(.5).setInteractive({cursor:'pointer'});
    back.on('pointerdown',()=>this.scene.start('Menu'));
    back.on('pointerover',()=>back.setStyle({color:'#FF5500'}));
    back.on('pointerout',()=>back.setStyle({color:'#1a2840'}));
  }
}

/* ======================= GAME ======================= */
class Game extends Phaser.Scene{
  constructor(){super('Game');}
  init(d){this.charId=d?.charId||'Yuki';this.mode=d?.mode||'solo';this.totalLaps=2;this.laps=0;this.launches=0;this.cr=0;this.cpPassed=new Set();this.racing=false;this.finished=false;this.isAiming=false;this.aimFrom=null;this.aimTo=null;this.myTurn=true;this.skipLeft=0;this.startTime=0;}

  create(){
    const ch=CHARS[this.charId];
    this.p1={body:new Body(ch),spr:null};
    this.p1.body.pos=new V2(TR.sx,TR.sy);
    this.p1.spr=this._mkSpr(TR.sx,TR.sy,ch.col,this.charId);
    this.bots=[];
    if(this.mode==='solo'){
      Object.keys(CHARS).filter(k=>k!==this.charId).slice(0,2).forEach((bid,i)=>{
        const bc={body:new Body(CHARS[bid]),spr:null,charId:bid,laps:0,cpPassed:new Set(),thinking:false,ci:0};
        bc.body.pos=new V2(TR.sx,TR.sy+(i+1)*44);
        bc.spr=this._mkSpr(TR.sx,TR.sy+(i+1)*44,CHARS[bid].col,bid);
        this.bots.push(bc);
      });
    }
    this.p2=null;
    if(this.mode==='local'||this.mode==='online'){
      const p2id=Object.keys(CHARS).find(k=>k!==this.charId)||'Kenta';
      this.p2={body:new Body(CHARS[p2id]),spr:null,charId:p2id,laps:0,cpPassed:new Set()};
      this.p2.body.pos=new V2(TR.sx,TR.sy+44);
      this.p2.spr=this._mkSpr(TR.sx,TR.sy+44,CHARS[p2id].col,p2id);
    }
    this._buildTrack();this._buildCPs();
    this.aimG=this.add.graphics().setDepth(22);
    this._buildHUD();this._buildInput();
    this.crowd=new Crowd(this,TR.grand.x,TR.grand.y,TR.grand.w,TR.grand.h);
    SP.pilot(this.charId);SP.clearP();
    if(this.mode==='online')this._setupOnline();
    this._countdown();
  }

  _mkSpr(x,y,color,id){
    const R=18,sz=R*2+6;
    const oc=document.createElement('canvas');oc.width=sz;oc.height=sz;
    const ctx=oc.getContext('2d'),cx=R+3,cy=R+3;
    const hexStr='#'+color.toString(16).padStart(6,'0');
    const n=18,pts=[];
    for(let i=0;i<n*2;i++){const a=(i*Math.PI/n)-Math.PI/2,r=i%2===0?R:R-3;pts.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});}
    ctx.fillStyle=hexStr;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,R-5,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.5)';ctx.beginPath();ctx.ellipse(cx-5,cy-5,9,6,-.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.85)';ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.fill();
    ART[id](ctx,cx,cy,8);
    const key='cap_'+id+'_'+Math.random().toString(36).substr(2,6);
    try{this.textures.addCanvas(key,oc);}catch(e){console.warn('tex err',e);}
    return this.add.image(x,y,key).setDepth(12);
  }

  _buildTrack(){
    const g=this.add.graphics().setDepth(1);
    const{outer,island,notch,grand,pad,water,grass,fin}=TR;
    g.fillStyle(0x010108);g.fillRect(0,0,GW,GH);
    g.lineStyle(1,0xffffff,.015);for(let x=0;x<GW+80;x+=44){g.beginPath();g.moveTo(x,0);g.lineTo(x-40,GH);g.strokePath();}
    g.fillStyle(0x6e4a1e);g.fillRoundedRect(outer.x,outer.y,outer.w,outer.h,8);
    g.fillStyle(0x0b2010);island.forEach(r=>g.fillRect(r.x,r.y,r.w,r.h));
    g.fillStyle(0x6e4a1e);g.fillRect(notch.x,notch.y,notch.w,notch.h);
    g.lineStyle(1,0x142a18,.9);island.forEach(r=>{for(let y=r.y+18;y<r.y+r.h;y+=18){g.beginPath();g.moveTo(r.x+6,y);g.lineTo(r.x+r.w-6,y);g.strokePath();}});
    this.add.text(island[2].x+island[2].w/2,island[2].y+island[2].h/2,'CapRush\nCIRCUITO',{fontFamily:"Impact,'Arial Black',sans-serif",fontSize:'26px',color:'#122018',align:'center'}).setOrigin(.5).setDepth(2);
    g.lineStyle(2,0xFFFF44,.18);
    const tY=(outer.y+island[0].y)/2,bY=(island[2].y+island[2].h+outer.y+outer.h)/2;
    const lX=(outer.x+island[0].x)/2,rX=(island[1].x+island[1].w+outer.x+outer.w)/2;
    for(let x=outer.x+30;x<outer.x+outer.w-30;x+=34){g.beginPath();g.moveTo(x,tY);g.lineTo(x+17,tY);g.strokePath();g.beginPath();g.moveTo(x,bY);g.lineTo(x+17,bY);g.strokePath();}
    for(let y=outer.y+30;y<outer.y+outer.h-30;y+=30){g.beginPath();g.moveTo(lX,y);g.lineTo(lX,y+15);g.strokePath();g.beginPath();g.moveTo(rX,y);g.lineTo(rX,y+15);g.strokePath();}
    g.lineStyle(7,0xDD1100);g.strokeRoundedRect(outer.x+1,outer.y+1,outer.w-2,outer.h-2,8);
    g.lineStyle(4,0xDD1100,.7);island.forEach(r=>g.strokeRect(r.x,r.y,r.w,r.h));
    for(let r=0;r<5;r++)for(let c=0;c<5;c++){g.fillStyle((r+c)%2===0?0xffffff:0x000000);g.fillRect(fin.x,fin.y+r*10+c*2,10,10);}
    this.add.text(fin.x+14,fin.y-12,'START',{fontFamily:"'Courier New',monospace",fontSize:'8px',color:'rgba(255,255,255,.25)'}).setDepth(4);
    // water blob
    const wg=this.add.graphics().setDepth(4);
    const{cx,cy,rx,ry}=water;
    const N=[1.0,1.12,0.88,1.18,0.92,1.08,0.84,1.15,0.94,1.06,0.9,1.14,0.88,1.1,0.96,1.04];
    const np=N.length;
    wg.fillStyle(0x0a2a88,.35);wg.beginPath();for(let i=0;i<np;i++){const a=(i/np)*Math.PI*2,rn=N[i],px=cx+2+(rx+5)*rn*Math.cos(a),py=cy+4+(ry+4)*rn*Math.sin(a);i===0?wg.moveTo(px,py):wg.lineTo(px,py);}wg.closePath();wg.fillPath();
    wg.fillStyle(0x1855cc,.8);wg.beginPath();for(let i=0;i<np;i++){const a=(i/np)*Math.PI*2,rn=N[i],px=cx+rx*rn*Math.cos(a),py=cy+ry*rn*Math.sin(a);i===0?wg.moveTo(px,py):wg.lineTo(px,py);}wg.closePath();wg.fillPath();
    wg.fillStyle(0x3377ee,.4);wg.beginPath();for(let i=0;i<np;i++){const a=(i/np)*Math.PI*2,rn=N[i]*.62,px=cx+rx*rn*Math.cos(a),py=cy+ry*rn*Math.sin(a);i===0?wg.moveTo(px,py):wg.lineTo(px,py);}wg.closePath();wg.fillPath();
    wg.fillStyle(0x88bbff,.3);wg.fillEllipse(cx-rx*.22,cy-ry*.3,rx*.44,ry*.26);
    wg.lineStyle(1.5,0x2266dd,.6);wg.beginPath();for(let i=0;i<np;i++){const a=(i/np)*Math.PI*2,rn=N[i],px=cx+rx*rn*Math.cos(a),py=cy+ry*rn*Math.sin(a);i===0?wg.moveTo(px,py):wg.lineTo(px,py);}wg.closePath();wg.strokePath();
    this.add.text(cx,cy,'AGUA',{fontFamily:"'Courier New',monospace",fontSize:'8px',color:'rgba(136,187,255,.5)'}).setOrigin(.5).setDepth(5);
    // grass
    const gg=this.add.graphics().setDepth(4);
    TR.grass.forEach(gr=>{gg.fillStyle(0x2a7a12);gg.fillRect(gr.x,gr.y,gr.w,gr.h);for(let i=0;i<Math.floor(gr.w/8);i++){gg.fillStyle(i%2===0?0x338e18:0x246610,.5);gg.fillRect(gr.x+i*8,gr.y,8,gr.h);}gg.lineStyle(1.5,0x1a5a0a,.6);for(let i=0;i<Math.floor(gr.w*gr.h/200);i++){const bx=gr.x+((i*137)%gr.w),by=gr.y+((i*83)%gr.h);gg.beginPath();gg.moveTo(bx,by+6);gg.lineTo(bx+(i%3-1)*4,by-2);gg.strokePath();}gg.lineStyle(1.5,0x1e6010,.8);gg.strokeRect(gr.x,gr.y,gr.w,gr.h);this.add.text(gr.x+gr.w/2,gr.y+gr.h/2,'GRAMA',{fontFamily:"'Courier New',monospace",fontSize:'7px',color:'rgba(68,255,136,.45)'}).setOrigin(.5).setDepth(5);});
    // grandstand
    const gg2=this.add.graphics().setDepth(4);
    const rows2=7,rH2=grand.h/rows2;
    for(let i=0;i<rows2;i++){gg2.fillStyle(i%2===0?0xCC9900:0xEEBB00);gg2.fillRect(grand.x,grand.y+i*rH2,grand.w,rH2);gg2.fillStyle(0x000000,.1);gg2.fillRect(grand.x,grand.y+i*rH2,grand.w,3);}
    gg2.lineStyle(2,0xFFCC00,.85);gg2.strokeRect(grand.x,grand.y,grand.w,grand.h);
    gg2.fillStyle(0xFFDD00);gg2.fillRect(grand.x,grand.y,grand.w,16);
    this.add.text(grand.x+grand.w/2,grand.y+9,'ARQB',{fontFamily:"'Courier New',monospace",fontSize:'6px',color:'#2a1a00'}).setOrigin(.5).setDepth(5);
    // paddock
    const pg=this.add.graphics().setDepth(4);
    pg.fillStyle(0xFF5500);pg.fillRect(pad.x,pad.y,pad.w,pad.h);
    const nBays=4,bayH=(pad.h-16)/nBays;
    for(let i=0;i<nBays;i++){const by=pad.y+8+i*bayH;pg.fillStyle(0x1a0a00);pg.fillRect(pad.x+6,by+2,pad.w-12,bayH-6);const pw2=(pad.w-22)/2;pg.fillStyle(0x2e1400);pg.fillRect(pad.x+10,by+4,pw2,bayH-10);pg.fillRect(pad.x+13+pw2,by+4,pw2,bayH-10);pg.lineStyle(1,0xFF8800,.5);pg.strokeRect(pad.x+10,by+4,pw2,bayH-10);pg.strokeRect(pad.x+13+pw2,by+4,pw2,bayH-10);pg.lineStyle(1.5,0xFF6600,.8);pg.strokeRect(pad.x+6,by+2,pad.w-12,bayH-6);}
    pg.lineStyle(2.5,0xFF3300,.9);pg.strokeRect(pad.x,pad.y,pad.w,pad.h);
    pg.fillStyle(0xFF2200);pg.fillRect(pad.x,pad.y,pad.w,16);
    this.add.text(pad.x+pad.w/2,pad.y+9,'BOX',{fontFamily:"'Courier New',monospace",fontSize:'7px',color:'#1a0400'}).setOrigin(.5).setDepth(5);
  }

  _buildCPs(){
    this.cpGfx=TR.cps.map((cp,i)=>{
      const g=this.add.graphics().setDepth(6);
      g.lineStyle(3,cp.col,.8);g.strokeRect(-30,-30,60,60);g.lineStyle(1,cp.col,.3);g.strokeCircle(0,0,22);
      g.setPosition(cp.x,cp.y);
      this.tweens.add({targets:g,alpha:.12,duration:720+i*100,yoyo:true,repeat:-1});
      this.add.text(cp.x,cp.y,cp.lbl,{fontFamily:"'Courier New',monospace",fontSize:'9px',color:'rgba(255,255,255,.22)'}).setOrigin(.5).setDepth(7);
      return g;
    });
  }

  _buildHUD(){
    const W=GW,H=GH,hg=this.add.graphics().setDepth(30);
    hg.fillStyle(0x000000,.88);hg.fillRect(0,0,W,36);hg.fillStyle(0x000000,.88);hg.fillRect(0,H-34,W,34);
    const st={fontFamily:"'Courier New',monospace",fontSize:'13px'};
    this.txtLap=this.add.text(10,10,t('lp')+' 0/'+this.totalLaps,{...st,color:'#FF5500'}).setDepth(32);
    this.txtCPs=this.add.text(175,10,t('cp')+' 0/3',{...st,color:'#FFD700'}).setDepth(32);
    this.txtTime=this.add.text(W-10,10,'00:00.0',{...st,color:'#00EEFF'}).setOrigin(1,0).setDepth(32);
    this.txtTurn=this.add.text(W/2,10,'',{...st,color:'#44FF88'}).setOrigin(.5,0).setDepth(32);
    this.add.rectangle(W/2,H-14,220,10,0x080818).setDepth(30);
    this.pwBar=this.add.rectangle(W/2-108,H-14,0,8,0x44FF88).setOrigin(0,.5).setDepth(31);
    this.cpDots=TR.cps.map((cp,i)=>{const d=this.add.circle(16+i*24,H-15,9,0x111130).setDepth(32);this.add.text(16+i*24,H-15,''+(i+1),{fontFamily:"'Courier New',monospace",fontSize:'7px',color:'#334'}).setOrigin(.5).setDepth(33);return d;});
    this.txtL=this.add.text(W/2-55,H-16,'🚀 0',{fontFamily:"'Courier New',monospace",fontSize:'12px',color:'#fff'}).setOrigin(.5).setDepth(32);
    this.txtCR=this.add.text(W/2+55,H-16,'🪙 0',{fontFamily:"'Courier New',monospace",fontSize:'12px',color:'#FFD700'}).setOrigin(.5).setDepth(32);
    const rst=this.add.text(W-10,H-28,t('rs'),{fontFamily:"'Courier New',monospace",fontSize:'10px',color:'#442'}).setOrigin(1,0).setDepth(32).setInteractive({cursor:'pointer'});
    rst.on('pointerdown',()=>this._resetP1());rst.on('pointerover',()=>rst.setStyle({color:'#FF5500'}));rst.on('pointerout',()=>rst.setStyle({color:'#442'}));
    this.info=this.add.text(W/2,H/2+60,t('rd'),{fontFamily:"'Courier New',monospace",fontSize:'14px',color:'rgba(255,255,255,.75)',backgroundColor:'rgba(0,0,0,.7)',padding:{x:12,y:7}}).setOrigin(.5).setDepth(45);
  }

  _buildInput(){
    this.input.on('pointerdown',p=>{if(!this.racing||this.finished||!this.myTurn)return;if(this.skipLeft>0){SP.log(t('epd'),'ep');this.skipLeft--;return;}if(!this.p1.body.stopped)return;this.isAiming=true;this.aimFrom=new V2(p.x,p.y);this.aimTo=new V2(p.x,p.y);});
    this.input.on('pointermove',p=>{if(!this.isAiming)return;this.aimTo=new V2(p.x,p.y);const dx=this.aimFrom.x-p.x,dy=this.aimFrom.y-p.y;const pw=Math.min(Math.sqrt(dx*dx+dy*dy),165)/165;SP.power(pw);this.pwBar.width=pw*210;this.pwBar.fillColor=pw>.7?0xDD1100:pw>.4?0xFF8800:0x44FF88;const pts=this.p1.body.preview(this.aimFrom,this.aimTo);this._drawAim(this.aimFrom,this.aimTo,pts);});
    this.input.on('pointerup',p=>{if(!this.isAiming)return;this.isAiming=false;this.aimG.clear();SP.clearP();this.pwBar.width=0;this._launch(this.aimFrom,new V2(p.x,p.y));});
  }

  _drawAim(from,to,pts){
    const g=this.aimG;g.clear();
    g.lineStyle(1.5,0xFF5500,.35);g.beginPath();g.moveTo(from.x,from.y);g.lineTo(to.x,to.y);g.strokePath();
    pts.forEach((pt,i)=>{const a=1-i/pts.length*.9;g.fillStyle(0xffffff,a);g.fillCircle(pt.x,pt.y,Math.max(1.5,4.5-i*.34));});
    const dx=from.x-to.x,dy=from.y-to.y,len=Math.sqrt(dx*dx+dy*dy);
    if(len>8){const nx=dx/len,ny=dy/len,ax=from.x+nx*55,ay=from.y+ny*55,ang=Math.atan2(ny,nx);g.lineStyle(3,0xffffff,.8);g.beginPath();g.moveTo(from.x,from.y);g.lineTo(ax,ay);g.strokePath();g.fillStyle(0xffffff,.8);g.fillTriangle(ax+Math.cos(ang)*12,ay+Math.sin(ang)*12,ax+Math.cos(ang+2.4)*8,ay+Math.sin(ang+2.4)*8,ax+Math.cos(ang-2.4)*8,ay+Math.sin(ang-2.4)*8);}
  }

  _launch(from,to){
    if(!this.racing||this.finished)return;
    const dx=from.x-to.x,dy=from.y-to.y;
    if(Math.sqrt(dx*dx+dy*dy)<5)return;
    this.p1.body.launch(from,to);
    this.launches++;this.txtL.setText('🚀 '+this.launches);
    const pw=Math.round(Math.min(1,Math.sqrt(dx*dx+dy*dy)/165)*100);
    SP.log(t('el')+' '+pw+'%','ej');
    this.cameras.main.flash(50,255,100,40);
    if(this.mode==='local'){this.myTurn=false;const wait=()=>{if(this.p1.body.stopped){this.myTurn=true;this.txtTurn.setText(t('p2'));}else this.time.delayedCall(100,wait);};this.time.delayedCall(200,wait);}
  }

  _resetP1(){this.p1.body.pos=new V2(TR.sx,TR.sy);this.p1.body.vel=new V2();this.p1.body.stopped=true;this.p1.spr.x=TR.sx;this.p1.spr.y=TR.sy;this.launches+=5;this.txtL.setText('🚀 '+this.launches);}

  _setupOnline(){
    this.myTurn=false;this.info.setText(t('ow'));
    fetch('http://localhost:3001/info').then(r=>r.json()).then(d=>{if(d.ips&&d.ips.length)this._showIPBanner(d.ips);}).catch(()=>{this.info.setText(t('oo'));});
  }

  _showIPBanner(ips){
    const W=GW,H=GH;
    const bg=this.add.graphics().setDepth(58);
    bg.fillStyle(0x000000,.94);bg.fillRoundedRect(W/2-290,H/2-120,580,210,10);
    bg.lineStyle(2,0xFF5500,.7);bg.strokeRoundedRect(W/2-290,H/2-120,580,210,10);
    const items=[bg];
    const close=this.add.text(W/2+272,H/2-112,'X',{fontFamily:"'Courier New',monospace",fontSize:'14px',color:'#FF5500'}).setDepth(59).setInteractive({cursor:'pointer'});items.push(close);
    items.push(this.add.text(W/2,H/2-92,t('os'),{fontFamily:"'Courier New',monospace",fontSize:'11px',color:'#334'}).setOrigin(.5).setDepth(59));
    ips.slice(0,3).forEach((ip,i)=>{
      const url='http://'+ip.address+':8080/client/caprush-game-v2.html';
      items.push(this.add.text(W/2,H/2-64+i*26,url,{fontFamily:"'Courier New',monospace",fontSize:'12px',color:'#00EEFF',fontStyle:'bold'}).setOrigin(.5).setDepth(59));
    });
    const copyBtn=this.add.text(W/2,H/2+56,t('oc'),{fontFamily:"'Courier New',monospace",fontSize:'13px',color:'#fff',backgroundColor:'#0e3a7a',padding:{x:16,y:9}}).setOrigin(.5).setDepth(59).setInteractive({cursor:'pointer'});items.push(copyBtn);
    copyBtn.on('pointerdown',()=>{const url='http://'+ips[0].address+':8080/client/caprush-game-v2.html';navigator.clipboard?.writeText(url).then(()=>{copyBtn.setText(t('ocp'));this.time.delayedCall(2000,()=>copyBtn.setText(t('oc')));}).catch(()=>{});});
    close.on('pointerdown',()=>items.forEach(it=>it.destroy()));
  }

  _countdown(){
    this.myTurn=false;
    const steps=['3','2','1',t('go')];let i=0;
    const txt=this.add.text(GW/2,GH/2-60,'3',{fontFamily:"Impact,'Arial Black',Arial,sans-serif",fontSize:'110px',color:'#FF5500',stroke:'#000',strokeThickness:14}).setOrigin(.5).setDepth(62);
    this.time.addEvent({delay:920,repeat:3,callback:()=>{i++;if(i<steps.length){txt.setText(steps[i]);txt.setColor(i===3?'#00EEFF':'#FF5500');this.tweens.add({targets:txt,scale:{from:1.6,to:1},duration:360,ease:'Back.Out'});}else{txt.destroy();this.racing=true;this.myTurn=true;this.startTime=this.time.now;this.info.setText(t('dr')).setAlpha(1);this.tweens.add({targets:this.info,alpha:0,delay:2400,duration:700});}}});
  }

  _physStep(obj,dt){
    obj.body.step(dt);
    const sf=getSurf(obj.body.pos.x,obj.body.pos.y);
    if(sf!==obj.body.surf){if(sf==='WATER')SP.log(t('ew'),'ew');if(sf==='GRASS')SP.log(t('eg'),'eg');obj.body.surf=sf;}
    if(worldBounce(obj.body,18)){this.cameras.main.shake(28,.003);SP.log(t('eb'),'eh');}
    const ih=islandHit(obj.body.pos.x,obj.body.pos.y,18);if(ih)obj.body.reflect(ih.nx,ih.ny,.6);
    const gh=zoneHit(obj.body,18,TR.grand);if(gh){obj.body.reflect(gh.nx,gh.ny,.70);this.cameras.main.flash(65,255,200,100);SP.log(t('egd'),'eh');}
    const ph=zoneHit(obj.body,18,TR.pad);if(ph){obj.body.reflect(ph.nx,ph.ny,.22);if(obj===this.p1&&this.mode!=='solo'){this.skipLeft=1;SP.log(t('epd'),'ep');}SP.log('Paddock','ep');}
    obj.spr.x=obj.body.pos.x;obj.spr.y=obj.body.pos.y;obj.spr.angle=obj.body.angle;
  }

  _checkCPs(obj,isP1){
    const x=obj.body.pos.x,y=obj.body.pos.y;
    const cpSet=isP1?this.cpPassed:obj.cpPassed;
    TR.cps.forEach((cp,i)=>{
      if(!cpSet.has(i)&&Math.hypot(x-cp.x,y-cp.y)<cp.r){
        cpSet.add(i);
        if(isP1){SP.log(t('ecp')+' '+cp.lbl+' OK','ec');this.cameras.main.flash(100,80,200,100);const ft=this.add.text(cp.x,cp.y-18,'+$CR '+cp.cr,{fontFamily:"'Courier New',monospace",fontSize:'14px',color:'#FFD700',stroke:'#000',strokeThickness:3}).setOrigin(.5).setDepth(56);this.tweens.add({targets:ft,y:cp.y-70,alpha:0,duration:1300,onComplete:()=>ft.destroy()});this.cr+=cp.cr;this.txtCR.setText('🪙 '+this.cr);this.cpDots[i].setFillStyle(cp.col);this.cpGfx[i].setAlpha(.04);this.txtCPs.setText(t('cp')+' '+cpSet.size+'/3');}else{obj.ci=(obj.ci||0)+1;}
      }
    });
    const atStart=Math.hypot(x-TR.sx,y-TR.sy)<48;
    if(atStart&&cpSet.size>=TR.cps.length){
      cpSet.clear();
      if(isP1){this.laps++;this.txtLap.setText(t('lp')+' '+this.laps+'/'+this.totalLaps);SP.log(t('elp'),'el2');this.cr+=120;this.txtCR.setText('🪙 '+this.cr);this.cameras.main.flash(600,255,180,80);this.cpDots.forEach(d=>d.setFillStyle(0x111130));this.cpGfx.forEach(g=>g.setAlpha(.8));this.txtCPs.setText(t('cp')+' 0/3');if(this.laps>=this.totalLaps&&!this.finished){this.finished=true;this.time.delayedCall(900,()=>this._result(this.charId+' - '+t('wi'),true));}}
      else{obj.laps=(obj.laps||0)+1;if(obj.laps>=this.totalLaps&&!this.finished){this.finished=true;this.time.delayedCall(1000,()=>this._result(t('bw'),false));}}
    }
  }

  update(time,delta){
    if(!this.racing||this.finished)return;
    const dt=delta/1000;
    const ms=time-this.startTime;
    this.txtTime.setText(String(Math.floor(ms/60000)).padStart(2,'0')+':'+String(Math.floor(ms/1000)%60).padStart(2,'0')+'.'+Math.floor((ms%1000)/100));
    this._physStep(this.p1,dt);
    this.bots.forEach(bot=>{
      this._physStep(bot,dt);capCol(this.p1.body,bot.body,18);
      this._checkCPs(bot,false);
      if(bot.body.stopped&&!bot.thinking&&this.racing){
        bot.thinking=true;
        this.time.delayedCall(650+Math.random()*1300,()=>{
          if(!this.racing||this.finished){bot.thinking=false;return;}
          const cp=TR.cps[(bot.ci||0)%TR.cps.length];
          const dx=cp.x-bot.body.pos.x,dy=cp.y-bot.body.pos.y,d=Math.sqrt(dx*dx+dy*dy);
          const pw=Math.min(.88,d/300)*CHARS[bot.charId].power;
          const ang=Math.atan2(dy,dx)+(Math.random()-.5)*.22;
          const from=bot.body.pos.clone();
          const to=new V2(bot.body.pos.x-Math.cos(ang)*165*pw,bot.body.pos.y-Math.sin(ang)*165*pw);
          bot.body.launch(from,to);bot.thinking=false;
        });
      }
    });
    for(let i=0;i<this.bots.length;i++)for(let j=i+1;j<this.bots.length;j++)capCol(this.bots[i].body,this.bots[j].body,18);
    if(this.p2){this._physStep(this.p2,dt);capCol(this.p1.body,this.p2.body,18);}
    this._checkCPs(this.p1,true);
    this.crowd?.update(time);
    if(!this.isAiming)this.aimG.clear();
  }

  _result(winner,playerWon){this.scene.start('Result',{winner,playerWon,time:((this.time.now-this.startTime)/1e3).toFixed(1),launches:this.launches,cr:this.cr,charId:this.charId,rating:playerWon?Math.max(1,Math.min(3,Math.ceil((36-this.launches)/10)+1)):1});}
}

/* ======================= RESULT ======================= */
class Result extends Phaser.Scene{
  constructor(){super('Result');}
  init(d){this.d=d;}
  create(){
    const g=this.add.graphics();
    g.fillStyle(0x010108);g.fillRect(0,0,GW,GH);
    g.lineStyle(1,0xffffff,.015);for(let x=0;x<GW+80;x+=44){g.beginPath();g.moveTo(x,0);g.lineTo(x-40,GH);g.strokePath();}
    for(let i=0;i<70;i++){const col=[0xFF5500,0xFFD700,0x00EEFF,0x44FF88,0xFF8833,0xffffff][i%6];const c=this.add.rectangle(Phaser.Math.Between(0,GW),Phaser.Math.Between(-60,GH*.25),Phaser.Math.Between(5,14),Phaser.Math.Between(5,14),col);this.tweens.add({targets:c,y:c.y+GH+150,angle:Phaser.Math.Between(-360,360),alpha:{from:1,to:0},duration:Phaser.Math.Between(1600,3400),delay:Phaser.Math.Between(0,1500),repeat:-1});}
    const cg=this.add.graphics();cg.fillStyle(0x08071e,.97);cg.fillRoundedRect(140,40,660,770,16);cg.lineStyle(2,0xFF5500,.45);cg.strokeRoundedRect(140,40,660,770,16);
    const wc=this.d.playerWon?'#FFD700':'#FF5500';
    this.add.text(GW/2,108,this.d.playerWon?'VITORIA! '+t('wi'):this.d.winner,{fontFamily:"Impact,'Arial Black',Arial,sans-serif",fontSize:'44px',color:wc,stroke:'#000',strokeThickness:9}).setOrigin(.5);
    const oc=document.createElement('canvas');oc.width=180;oc.height=180;
    const ctx=oc.getContext('2d');
    ctx.fillStyle='#0e0e22';ctx.beginPath();ctx.arc(90,90,82,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#1e3055';ctx.lineWidth=2;ctx.stroke();
    ART[this.d.charId](ctx,90,90,76);
    const key='res_'+this.d.charId+'_'+Date.now();
    try{this.textures.addCanvas(key,oc);this.add.image(GW/2,248,key);}catch(e){}
    this.add.text(GW/2,354,'⏱ '+this.d.time+'s',{fontFamily:"Impact,'Arial Black',Arial,sans-serif",fontSize:'38px',color:'#00EEFF'}).setOrigin(.5);
    this.add.text(GW/2,404,'🚀 '+this.d.launches+' '+t('la2'),{fontFamily:"Impact,'Arial Black',Arial,sans-serif",fontSize:'28px',color:'#FF5500'}).setOrigin(.5);
    this.add.text(GW/2,450,'🪙 $CR '+this.d.cr+' '+t('cr'),{fontFamily:"Impact,'Arial Black',Arial,sans-serif",fontSize:'26px',color:'#FFD700'}).setOrigin(.5);
    this.add.text(GW/2,498,['⭐','⭐⭐','⭐⭐⭐'][Math.max(0,(this.d.rating||1)-1)],{fontSize:'38px'}).setOrigin(.5);
    [[GW/2-160,'▶ '+t('ag'),'#AA2200','Lobby',{}],[GW/2+160,'← '+t('me'),'#0e3a7a','Menu',{}]].forEach(([x,lbl,bg,sc,dt2])=>{const b=this.add.text(x,568,lbl,{fontFamily:"'Courier New',monospace",fontSize:'16px',color:'#fff',backgroundColor:bg,padding:{x:20,y:14}}).setOrigin(.5).setInteractive({cursor:'pointer'});b.on('pointerdown',()=>this.scene.start(sc,dt2));b.on('pointerover',()=>b.setAlpha(.8));b.on('pointerout',()=>b.setAlpha(1));});
  }
}

/* PHASER */
window.PG=new Phaser.Game({type:Phaser.AUTO,width:GW,height:GH,parent:'cv-area',backgroundColor:'#010108',scene:[Menu,Lobby,Game,Result]});
</script>
</body>
</html>
"""

WS = r"""/**
 * CapRush ws-server.js
 * Porta 3001 - WebSocket + HTTP
 * Executar: node ws-server.js (dentro de server/)
 */
const WebSocket=require('ws');
const http=require('http');
const os=require('os');
const PORT=3001;
function getIPs(){const r=[];for(const[,ifaces]of Object.entries(os.networkInterfaces()))for(const i of ifaces)if(i.family==='IPv4'&&!i.internal)r.push({address:i.address});return r;}
const srv=http.createServer((req,res)=>{res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Content-Type','application/json');if(req.url==='/info'){res.writeHead(200);res.end(JSON.stringify({ips:getIPs(),port:PORT}));}else{res.writeHead(200);res.end(JSON.stringify({status:'ok'}));}});
const wss=new WebSocket.Server({server:srv});
const rooms={};
function gen(){return Math.random().toString(36).substr(2,5).toUpperCase();}
function send(ws,obj){if(ws&&ws.readyState===1)ws.send(JSON.stringify(obj));}
wss.on('connection',ws=>{
  ws._room=null;ws._role=null;
  ws.on('message',raw=>{
    let m;try{m=JSON.parse(raw);}catch{return;}
    if(m.type==='create_room'){const code=gen();rooms[code]={host:ws,guest:null,state:'waiting'};ws._room=code;ws._role='host';send(ws,{type:'room_created',code});console.log('[SALA] '+code);}
    else if(m.type==='join_room'){const code=(m.code||'').toUpperCase();const rm=rooms[code];if(!rm||rm.state!=='waiting'){send(ws,{type:'error',msg:'Sala nao encontrada.'});return;}rm.guest=ws;rm.state='playing';ws._room=code;ws._role='guest';send(ws,{type:'room_joined',code});send(rm.host,{type:'start',first:'host'});send(rm.guest,{type:'start',first:'host'});console.log('[SALA] '+code+' iniciado!');}
    else if(m.type==='launch'){const rm=rooms[ws._room];if(!rm)return;const opp=ws._role==='host'?rm.guest:rm.host;send(opp,{type:'launch',from:m.from,to:m.to});send(opp,{type:'pass_turn'});}
    else if(m.type==='pos'){const rm=rooms[ws._room];if(!rm)return;const opp=ws._role==='host'?rm.guest:rm.host;send(opp,{type:'pos',x:m.x,y:m.y,vx:m.vx,vy:m.vy});}
  });
  ws.on('close',()=>{const code=ws._room;if(!code||!rooms[code])return;const opp=ws._role==='host'?rooms[code].guest:rooms[code].host;send(opp,{type:'opponent_disconnected'});delete rooms[code];console.log('[SALA] '+code+' encerrada.');});
});
srv.listen(PORT,()=>{
  const ips=getIPs();
  console.log('\n+-------------------------------------------+');
  console.log('| CapRush WebSocket Server  porta: '+PORT+'    |');
  console.log('+-------------------------------------------+');
  ips.forEach(ip=>console.log('| Link: http://'+ip.address+':8080/client/caprush-game-v2.html'));
  console.log('+-------------------------------------------+\n');
});
"""

GUIDE = """\
# CapRush - Guia Modo Online 1v1

## Requisitos
- Node.js instalado (nodejs.org, versao 18+)
- Dois computadores na mesma rede Wi-Fi

## Como executar no PowerShell (Windows)
Use comandos separados (nao use &&):

Terminal 1 - Servidor do jogo:
  cd C:\\Users\\User\\Cryptos\\projects\\caprush
  python -m http.server 8080

Terminal 2 - Servidor multiplayer:
  cd C:\\Users\\User\\Cryptos\\projects\\caprush\\server
  node ws-server.js

## Como jogar
1. HOST: abre http://localhost:8080/client/caprush-game-v2.html
2. HOST: clica 1x1 ONLINE, escolhe personagem
3. HOST: o jogo detecta o IP e exibe um banner com o link e botao Copiar
4. HOST: envia o link ao amigo via WhatsApp/Discord
5. GUEST: abre o link recebido, clica 1x1 ONLINE, escolhe personagem, joga
"""

GIT = """\
# CapRush - Git Push
# Execute no PowerShell na raiz do projeto:

git add client/caprush-game-v2.html
git add server/ws-server.js
git add docs/ONLINE_GUIDE.md
git add builder_phase1_complete.py
git commit -m "feat(phase1): jogo completo com menu, lobby, fisica, i18n, online"
git push origin main

Write-Host "Push concluido!"
"""

def main():
    print()
    print('='*58)
    print('  CapRush - builder_phase1_complete.py')
    print(f'  Repo: {ROOT}')
    print('='*58)
    print()
    print('--- Gerando arquivos ---')
    W('client/caprush-game-v2.html', GAME)
    W('server/ws-server.js', WS)
    W('docs/ONLINE_GUIDE.md', GUIDE)
    W('git_commands.ps1', GIT)
    print()
    print('='*58)
    print('  CONCLUIDO!')
    print('='*58)
    print()
    print('  PARA JOGAR:')
    print('    Terminal 1: python -m http.server 8080')
    print('    Navegador:  http://localhost:8080/client/caprush-game-v2.html')
    print()
    print('  PARA MODO ONLINE:')
    print('    Terminal 2 (pasta server):')
    print('      node ws-server.js')
    print()

if __name__ == '__main__':
    main()
