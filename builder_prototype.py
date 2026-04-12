"""
builder_prototype.py  v3
========================
CapRush - Overdrive! | FASE 1 - Core Gameplay
Correcoes:
  - Bug do clique no overlay corrigido
  - Canvas dimensionado corretamente antes do primeiro frame
  - caprush-game.html integrado ao site Vercel
Execute: python builder_prototype.py
"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))

def w(rel, txt):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(txt)
    print("  OK  " + rel)

def d(rel):
    os.makedirs(os.path.join(ROOT, rel), exist_ok=True)
    print("  DIR " + rel)

VECTOR2D = """// Vector2D.js - Matematica vetorial 2D pura
var Vector2D = function(x,y){this.x=x||0;this.y=y||0;};
Vector2D.prototype={
  add:function(v){return new Vector2D(this.x+v.x,this.y+v.y);},
  sub:function(v){return new Vector2D(this.x-v.x,this.y-v.y);},
  scale:function(s){return new Vector2D(this.x*s,this.y*s);},
  magnitude:function(){return Math.sqrt(this.x*this.x+this.y*this.y);},
  normalize:function(){var m=this.magnitude();return m===0?new Vector2D(0,0):new Vector2D(this.x/m,this.y/m);},
  distanceTo:function(v){return this.sub(v).magnitude();},
  clone:function(){return new Vector2D(this.x,this.y);}
};
"""

PHYSICS = """// Physics.js - Motor de fisica da tampinha
// Modelo: velocidade inicial pelo arraste, arrasto linear, ricochete elastico
var Physics=(function(){
  var DRAG=0.52,MAX_PX=165,MAX_SPD=740,REST=0.72,MIN=4;
  var s={pos:new Vector2D(0,0),vel:new Vector2D(0,0),moving:false,drag:1.0};
  function dragOf(surf){return{terra:1.0,areia:1.6,asfalto:0.7}[surf]||1.0;}
  function reset(x,y,surf){s.pos=new Vector2D(x,y);s.vel=new Vector2D(0,0);s.moving=false;s.drag=dragOf(surf||'terra');}
  function flick(from,to,mult){
    var d=from.sub(to),len=Math.min(d.magnitude(),MAX_PX),t=len/MAX_PX;
    s.vel=d.normalize().scale(t*MAX_SPD*(mult||1));s.moving=true;
    return{forcePct:Math.round(t*100),angle:Math.atan2(d.y,d.x)*180/Math.PI};
  }
  function step(dt,b){
    if(!s.moving)return snap();
    var spd=s.vel.magnitude(),ns=Math.max(0,spd-DRAG*s.drag*spd*dt);
    if(ns<MIN){s.vel=new Vector2D(0,0);s.moving=false;return snap();}
    s.vel=s.vel.normalize().scale(ns);s.pos=s.pos.add(s.vel.scale(dt));
    var r=16;
    if(s.pos.x-r<b.x){s.pos.x=b.x+r;s.vel.x=Math.abs(s.vel.x)*REST;}
    if(s.pos.x+r>b.x+b.w){s.pos.x=b.x+b.w-r;s.vel.x=-Math.abs(s.vel.x)*REST;}
    if(s.pos.y-r<b.y){s.pos.y=b.y+r;s.vel.y=Math.abs(s.vel.y)*REST;}
    if(s.pos.y+r>b.y+b.h){s.pos.y=b.y+b.h-r;s.vel.y=-Math.abs(s.vel.y)*REST;}
    return snap();
  }
  function snap(){return{pos:s.pos.clone(),vel:s.vel.clone(),speed:s.vel.magnitude(),moving:s.moving};}
  return{reset:reset,flick:flick,step:step,MAX_PX:MAX_PX};
})();
"""

YUKI = """// Yuki.js - Piloto Lendario de CONTROLE
// Atributos NFT + modificadores fisicos + renderizacao sprite
var Yuki=(function(){
  var A={nome:'YUKI',raridade:'Lendario',velocidade:82,controle:91,aerodinamica:75,
         cor:'#00E5FF',anel:'#FFD700',kanji:'\u96EA'};
  var M={spd:A.velocidade/100,ctrl:A.controle/100,drag:1-(A.aerodinamica-50)/200};
  var an={rot:0,glow:0,gdir:1,trail:[]};
  function render(ctx,ph,dt){
    var p=ph.pos,spd=ph.speed;
    an.rot+=spd*dt*0.005;
    an.glow+=0.03*an.gdir;if(an.glow>=1||an.glow<=0)an.gdir*=-1;
    an.trail.push({x:p.x,y:p.y});if(an.trail.length>18)an.trail.shift();
    for(var i=0;i<an.trail.length;i++){
      var t=an.trail[i],a=(i/an.trail.length)*0.3;
      ctx.save();ctx.globalAlpha=a;
      ctx.beginPath();ctx.arc(t.x,t.y,13*(i/an.trail.length),0,Math.PI*2);
      ctx.fillStyle=A.cor;ctx.fill();ctx.restore();
    }
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(an.rot);
    if(spd>50){ctx.shadowColor=A.cor;ctx.shadowBlur=18+an.glow*12;}
    var g=ctx.createRadialGradient(-5,-5,2,0,0,16);
    g.addColorStop(0,'#FFF');g.addColorStop(0.3,A.cor);g.addColorStop(1,'#003A50');
    ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
    ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.strokeStyle=A.anel;ctx.lineWidth=2.5;ctx.stroke();
    ctx.rotate(-an.rot);ctx.shadowBlur=0;ctx.fillStyle='#FFF';
    ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(A.kanji,0,0);ctx.restore();
  }
  function resetAnim(){an.rot=0;an.trail=[];an.glow=0;}
  return{A:A,M:M,render:render,resetAnim:resetAnim};
})();
"""

TRACKTEST = """// TrackTest.js - Pista Terra e Cascalho
// Responsabilidade: geometria, renderizacao, checkpoints. NAO faz fisica.
var TrackTest=(function(){
  var META={id:'01',nome:'Terra e Cascalho',superficie:'terra',voltas:2};
  var cps=[],obs=[],SP={x:0,y:0},pts=[],TW=72;
  function init(cw,ch){
    var m=60;
    pts=[
      {x:m,y:ch*.5},{x:m,y:m},
      {x:cw*.4,y:m},{x:cw*.5,y:ch*.28},
      {x:cw*.6,y:m},{x:cw-m,y:m},
      {x:cw-m,y:ch-m},{x:cw*.5,y:ch-m},
      {x:m,y:ch-m},{x:m,y:ch*.5},
    ];
    SP={x:pts[0].x+TW*.5,y:pts[0].y};
    cps=[
      {x:cw*.48,y:m+2,r:TW*.5,lbl:'CP 1',ok:false},
      {x:cw-m,y:ch*.55,r:TW*.5,lbl:'CP 2',ok:false},
      {x:cw*.25,y:ch-m-2,r:TW*.5,lbl:'CP 3',ok:false},
    ];
    obs=[{x:cw*.35,y:m+6,r:6},{x:cw*.62,y:m+8,r:8},{x:cw-m-8,y:ch*.45,r:7}];
  }
  function resetCPs(){cps.forEach(function(c){c.ok=false;});}
  function checkCP(pos){
    for(var i=0;i<cps.length;i++){
      var c=cps[i];if(c.ok)continue;
      var dx=pos.x-c.x,dy=pos.y-c.y;
      if(Math.sqrt(dx*dx+dy*dy)<c.r){c.ok=true;return c;}
    }return null;
  }
  function checkLap(pos){
    if(!pts.length)return false;
    var dx=pos.x-(pts[0].x+TW*.5),dy=pos.y-pts[0].y;
    return Math.sqrt(dx*dx+dy*dy)<28;
  }
  function drawPath(ctx,w,col){
    if(pts.length<2)return;
    ctx.save();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    for(var i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);
    ctx.closePath();ctx.stroke();ctx.restore();
  }
  function render(ctx,cw,ch){
    if(!pts.length)return;
    ctx.fillStyle='#1A1208';ctx.fillRect(0,0,cw,ch);
    ctx.fillStyle='rgba(80,60,40,0.4)';
    for(var i=0;i<220;i++)ctx.fillRect((i*137.5)%cw,(i*97.3)%ch,2,2);
    drawPath(ctx,TW+22,'#2A1F18');
    drawPath(ctx,TW,'#4A3728');
    ctx.save();ctx.strokeStyle='rgba(255,215,0,0.3)';ctx.lineWidth=2;ctx.setLineDash([12,10]);
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    for(var j=1;j<pts.length;j++)ctx.lineTo(pts[j].x,pts[j].y);
    ctx.closePath();ctx.stroke();ctx.setLineDash([]);ctx.restore();
    obs.forEach(function(o){
      ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);
      ctx.fillStyle='#6B4F35';ctx.fill();ctx.strokeStyle='#3A2A1A';ctx.lineWidth=2;ctx.stroke();
    });
    for(var q=0;q<6;q++){
      ctx.fillStyle=q%2===0?'#FFF':'#111';
      ctx.fillRect(pts[0].x+4,pts[0].y-TW*.5+q*(TW/6),22,TW/6);
    }
    cps.forEach(function(c){
      ctx.save();ctx.globalAlpha=c.ok?0.25:0.9;
      ctx.strokeStyle=c.ok?'#333':'#00E5FF';ctx.lineWidth=3;ctx.setLineDash([6,4]);
      ctx.beginPath();ctx.moveTo(c.x,c.y-c.r);ctx.lineTo(c.x,c.y+c.r);
      ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=c.ok?'#333':'#00E5FF';
      ctx.font='bold 11px Rajdhani,sans-serif';ctx.textAlign='center';
      ctx.fillText(c.lbl,c.x,c.y-c.r-6);ctx.restore();
    });
  }
  return{META:META,init:init,render:render,checkCP:checkCP,checkLap:checkLap,resetCPs:resetCPs,
         get startPos(){return SP;},get cps(){return cps;}};
})();
"""

GAMELOOP = """// GameLoop.js - Orquestrador principal
// FIX: overlay agora tem seu proprio listener de clique.
// O canvas so recebe input apos o usuario clicar no overlay.
// resize() aguarda o layout estar pronto via setTimeout.
(function(){
  'use strict';
  var canvas  = document.getElementById('gameCanvas');
  var ctx     = canvas.getContext('2d');
  var overlay = document.getElementById('overlay');
  var elLap   = document.getElementById('hud-lap');
  var elCp    = document.getElementById('hud-cp');
  var elTime  = document.getElementById('hud-time');
  var elBest  = document.getElementById('hud-best');
  var elFBar  = document.getElementById('force-bar-fill');
  var elFVal  = document.getElementById('force-value');
  var logBox  = document.getElementById('log-box');
  var LAPS=TrackTest.META.voltas, NCPS=3;
  var gs={phase:'WAIT',lap:1,cp:0,t0:0,elapsed:0,best:null,ds:null,dc:null};

  function resize(){
    var wrap=canvas.parentElement;
    canvas.width  = Math.max(wrap.offsetWidth - 160, 300);
    canvas.height = Math.max(wrap.offsetHeight, 300);
    TrackTest.init(canvas.width,canvas.height);
    Physics.reset(TrackTest.startPos.x,TrackTest.startPos.y,'terra');
    Yuki.resetAnim();
  }
  window.addEventListener('resize',resize);
  setTimeout(resize,80);

  // FIX: overlay escuta o proprio clique
  function startGame(){
    overlay.style.display='none';
    gs.phase='AIM';
    if(canvas.width<50) resize();
    Physics.reset(TrackTest.startPos.x,TrackTest.startPos.y,'terra');
  }
  overlay.addEventListener('click', startGame);
  overlay.addEventListener('touchend',function(e){e.preventDefault();startGame();},{passive:false});
  overlay.style.cursor='pointer';

  function cpos(e){var r=canvas.getBoundingClientRect();return new Vector2D(e.clientX-r.left,e.clientY-r.top);}
  function bnd(){return{x:0,y:0,w:canvas.width,h:canvas.height};}

  canvas.addEventListener('mousedown',function(e){
    if(gs.phase!=='AIM')return;
    var ph=Physics.step(0,bnd());
    if(cpos(e).distanceTo(ph.pos)<44){gs.ds=cpos(e);gs.dc=cpos(e);}
  });
  canvas.addEventListener('mousemove',function(e){
    if(!gs.ds)return;
    gs.dc=cpos(e);
    var pct=Math.min(gs.ds.sub(gs.dc).magnitude()/Physics.MAX_PX,1);
    elFBar.style.height=(pct*100)+'%';elFVal.textContent=Math.round(pct*100)+'%';
  });
  canvas.addEventListener('mouseup',function(e){
    if(!gs.ds||gs.phase!=='AIM')return;
    var info=Physics.flick(gs.ds,cpos(e),Yuki.M.spd);
    log('Lancamento '+info.forcePct+'% / '+info.angle.toFixed(0)+'deg','ev');
    gs.ds=null;gs.dc=null;gs.phase='MOVING';
    if(!gs.t0)gs.t0=performance.now();
    elFBar.style.height='0%';elFVal.textContent='0%';
  });
  canvas.addEventListener('touchstart',function(e){
    if(gs.phase!=='AIM')return;
    var ph=Physics.step(0,bnd());
    if(cpos(e.touches[0]).distanceTo(ph.pos)<44){gs.ds=cpos(e.touches[0]);gs.dc=cpos(e.touches[0]);}
  },{passive:true});
  canvas.addEventListener('touchmove',function(e){
    e.preventDefault();if(!gs.ds)return;
    gs.dc=cpos(e.touches[0]);
    var pct=Math.min(gs.ds.sub(gs.dc).magnitude()/Physics.MAX_PX,1);
    elFBar.style.height=(pct*100)+'%';elFVal.textContent=Math.round(pct*100)+'%';
  },{passive:false});
  canvas.addEventListener('touchend',function(e){
    if(!gs.ds||gs.phase!=='AIM')return;
    var info=Physics.flick(gs.ds,cpos(e.changedTouches[0]),Yuki.M.spd);
    log('Lancamento '+info.forcePct+'%','ev');
    gs.ds=null;gs.dc=null;gs.phase='MOVING';
    if(!gs.t0)gs.t0=performance.now();
    elFBar.style.height='0%';elFVal.textContent='0%';
  },{passive:true});

  var lt=0;
  function loop(now){
    var dt=Math.min((now-lt)/1000,0.05);lt=now;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    TrackTest.render(ctx,canvas.width,canvas.height);
    var ph=Physics.step(dt,bnd());
    Yuki.render(ctx,ph,dt);
    if(gs.ds&&gs.dc)drawAim(ph.pos,gs.dc);
    if(gs.phase==='MOVING'){
      gs.elapsed=(performance.now()-gs.t0)/1000;updHUD();
      if(!ph.moving){gs.phase='AIM';log('Tampinha parou - mire novamente');}
      var hit=TrackTest.checkCP(ph.pos);
      if(hit){gs.cp++;elCp.textContent=gs.cp+'/'+NCPS;log(hit.lbl+' ativado!','ev');}
      if(gs.cp>=NCPS&&TrackTest.checkLap(ph.pos))onLap();
    }
    requestAnimationFrame(loop);
  }
  function onLap(){
    gs.cp=0;TrackTest.resetCPs();
    if(gs.lap>=LAPS){gs.phase='FINISH';onFinish();}
    else{gs.lap++;log('Volta '+gs.lap+' iniciada!','ev');elLap.textContent=gs.lap+'/'+LAPS;}
  }
  function onFinish(){
    var t=gs.elapsed;
    if(!gs.best||t<gs.best)gs.best=t;
    elBest.textContent=fmt(gs.best);
    log('CORRIDA COMPLETA! '+fmt(t),'ev');
    postScore('Yuki',t);
    setTimeout(function(){
      overlay.innerHTML='<h2>CORRIDA COMPLETA!</h2>'
        +'<p style="color:#FFD700;font-size:2rem;font-family:Bebas Neue,sans-serif">'+fmt(t)+'</p>'
        +'<p style="color:#aaa;margin-top:.5rem">Clique para jogar novamente</p>';
      overlay.style.display='flex';
      overlay.onclick=function(){overlay.onclick=null;restart();};
    },1200);
  }
  function restart(){
    overlay.style.display='none';
    gs={phase:'AIM',lap:1,cp:0,t0:performance.now(),elapsed:0,best:gs.best,ds:null,dc:null};
    TrackTest.resetCPs();
    Physics.reset(TrackTest.startPos.x,TrackTest.startPos.y,'terra');
    Yuki.resetAnim();updHUD();logBox.innerHTML='';
    overlay.addEventListener('click',startGame);
  }
  function updHUD(){
    elTime.textContent=fmt(gs.elapsed);
    elLap.textContent=gs.lap+'/'+LAPS;
    elCp.textContent=gs.cp+'/'+NCPS;
  }
  function fmt(s){
    var m=Math.floor(s/60),ss=(s%60).toFixed(1);
    return(m<10?'0':'')+m+':'+(parseFloat(ss)<10?'0':'')+ss;
  }
  function log(msg,cls){
    var p=document.createElement('p');if(cls)p.className=cls;
    p.textContent=msg;logBox.insertBefore(p,logBox.firstChild);
    while(logBox.children.length>30)logBox.removeChild(logBox.lastChild);
  }
  function drawAim(cap,drag){
    var dir=cap.sub(drag).normalize();
    var dist=Math.min(cap.distanceTo(drag),Physics.MAX_PX);
    var end=cap.add(dir.scale(dist*1.8)),pct=dist/Physics.MAX_PX;
    ctx.save();
    var g=ctx.createLinearGradient(cap.x,cap.y,end.x,end.y);
    g.addColorStop(0,'rgba(0,229,255,'+(0.8+pct*.2)+')');
    g.addColorStop(1,'rgba(0,229,255,0)');
    ctx.strokeStyle=g;ctx.lineWidth=2+pct*2;ctx.setLineDash([8,6]);
    ctx.beginPath();ctx.moveTo(cap.x,cap.y);ctx.lineTo(end.x,end.y);ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(cap.x,cap.y,20+pct*10,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,215,0,'+(0.3+pct*.4)+')';ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
  }
  function postScore(p,t){
    fetch('http://localhost:5000/api/scores',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({piloto:p,pista:'Terra e Cascalho',tempo:t})
    }).then(function(){log('Score salvo.','ev');}).catch(function(){log('Servidor offline.');});
  }
  requestAnimationFrame(function(t){lt=t;requestAnimationFrame(loop);});
})();
"""

GAME_HTML = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>CapRush - Jogo</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    :root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--panel:rgba(8,8,18,.95);--acc:#00E5FF;}
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:100%;height:100%;background:var(--dark);font-family:'Rajdhani',sans-serif;color:#E8E8F0;overflow:hidden;}
    #shell{display:flex;flex-direction:column;width:100%;height:100%;}
    #hud{display:flex;justify-content:space-between;align-items:center;padding:6px 16px;
         background:var(--panel);border-bottom:1px solid rgba(255,42,42,.3);flex-shrink:0;height:46px;}
    .hlogo{font-family:'Bebas Neue',sans-serif;font-size:1.3rem;letter-spacing:3px;
           background:linear-gradient(135deg,var(--red),var(--gold));
           -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
    .hrow{display:flex;gap:1.4rem;}
    .hs{text-align:center;}
    .hs label{display:block;font-size:.58rem;letter-spacing:2px;color:#666680;text-transform:uppercase;}
    .hs span{font-family:'Bebas Neue',sans-serif;font-size:1.15rem;color:var(--gold);}
    #wrap{position:relative;flex:1;min-height:0;display:flex;}
    #gameCanvas{display:block;flex:1;cursor:crosshair;}
    #panel{width:160px;flex-shrink:0;background:var(--panel);
           border-left:1px solid rgba(255,42,42,.2);
           display:flex;flex-direction:column;padding:10px;gap:10px;overflow:hidden;}
    .pt{font-family:'Bebas Neue',sans-serif;font-size:.9rem;letter-spacing:2px;color:var(--red);
        border-bottom:1px solid rgba(255,42,42,.25);padding-bottom:3px;}
    #fbg{width:100%;height:110px;background:#1A1A28;border:1px solid #333;border-radius:4px;
         position:relative;overflow:hidden;}
    #force-bar-fill{position:absolute;bottom:0;left:0;right:0;height:0%;
                    background:linear-gradient(0deg,var(--red),var(--gold));transition:height .05s;}
    #flbl{font-size:.66rem;color:#666680;letter-spacing:1px;text-transform:uppercase;text-align:center;}
    #force-value{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--gold);text-align:center;}
    #cc{background:#1A1A28;border:1px solid rgba(255,42,42,.3);border-radius:6px;padding:8px;text-align:center;}
    #cav{width:58px;height:58px;border-radius:50%;margin:0 auto 5px;
         background:radial-gradient(circle at 30% 30%,#fff4,transparent 60%),linear-gradient(135deg,#1A3A6A,#0A1A3A);
         border:2px solid var(--acc);display:flex;align-items:center;justify-content:center;font-size:1.7rem;}
    #cnm{font-family:'Bebas Neue',sans-serif;font-size:.9rem;color:var(--acc);letter-spacing:2px;}
    .ar{display:flex;justify-content:space-between;font-size:.67rem;color:#666680;margin-top:3px;}
    .av{color:var(--gold);font-weight:700;}
    #log-box{flex:1;overflow-y:auto;font-size:.63rem;color:#555570;}
    #log-box p{padding:2px 0;border-bottom:1px solid #1A1A28;}
    #log-box p.ev{color:var(--gold);}
    #overlay{position:absolute;left:0;top:0;right:160px;bottom:0;
             background:rgba(0,0,0,.80);
             display:flex;flex-direction:column;align-items:center;justify-content:center;
             z-index:20;cursor:pointer;}
    #overlay h2{font-family:'Bebas Neue',sans-serif;font-size:2.4rem;letter-spacing:5px;
                color:var(--gold);text-shadow:0 0 20px rgba(255,215,0,.5);margin-bottom:.5rem;}
    #overlay p{color:#AAA;letter-spacing:2px;font-size:.9rem;margin:.25rem 0;}
    .pulse{animation:pulse 1.2s ease-in-out infinite;}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    #btnBack{position:absolute;top:8px;left:8px;z-index:25;
             background:rgba(255,42,42,.15);border:1px solid var(--red);
             color:var(--red);font-family:'Rajdhani',sans-serif;
             font-size:.8rem;letter-spacing:2px;padding:4px 10px;
             cursor:pointer;border-radius:3px;text-decoration:none;transition:background .2s;}
    #btnBack:hover{background:var(--red);color:#fff;}
  </style>
</head>
<body>
<div id="shell">
  <div id="hud">
    <div class="hlogo">CAP RUSH</div>
    <div class="hrow">
      <div class="hs"><label>Volta</label><span id="hud-lap">1/2</span></div>
      <div class="hs"><label>Checkpoint</label><span id="hud-cp">0/3</span></div>
      <div class="hs"><label>Tempo</label><span id="hud-time">00:00.0</span></div>
      <div class="hs"><label>Melhor</label><span id="hud-best">--:--.--</span></div>
    </div>
  </div>
  <div id="wrap">
    <canvas id="gameCanvas"></canvas>
    <div id="panel">
      <div class="pt">FORCA</div>
      <div id="flbl">Potencia</div>
      <div id="fbg"><div id="force-bar-fill"></div></div>
      <div id="force-value">0%</div>
      <div class="pt">PILOTO</div>
      <div id="cc">
        <div id="cav">&#38634;</div>
        <div id="cnm">YUKI</div>
        <div class="ar"><span>Velocidade</span><span class="av">82</span></div>
        <div class="ar"><span>Controle</span><span class="av">91</span></div>
        <div class="ar"><span>Aerodin.</span><span class="av">75</span></div>
      </div>
      <div class="pt">EVENTOS</div>
      <div id="log-box"></div>
    </div>
    <div id="overlay">
      <h2>PRONTO?</h2>
      <p>Clique aqui para come&#231;ar</p>
      <p style="font-size:.8rem;color:#666680;margin-top:.5rem">Depois: clique e arraste a tampinha para mirar</p>
      <br>
      <p class="pulse">&#9654; CLIQUE PARA COME&#199;AR</p>
    </div>
    <a href="index.html" id="btnBack">&larr; LOBBY</a>
  </div>
</div>
<script src="src/core/Vector2D.js"></script>
<script src="src/core/Physics.js"></script>
<script src="src/entities/Yuki.js"></script>
<script src="src/scenes/TrackTest.js"></script>
<script src="src/core/GameLoop.js"></script>
</body>
</html>
"""

CAPRUSH_GAME_HTML = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>CapRush - Jogar</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    :root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--acc:#00E5FF;}
    *{margin:0;padding:0;box-sizing:border-box;}
    html,body{width:100%;height:100%;background:var(--dark);font-family:'Rajdhani',sans-serif;color:#E8E8F0;overflow:hidden;}
    #topbar{display:flex;align-items:center;justify-content:space-between;
            padding:8px 20px;background:rgba(8,8,18,.97);
            border-bottom:2px solid var(--red);height:48px;flex-shrink:0;}
    .tlogo{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:4px;
           background:linear-gradient(135deg,var(--red),var(--gold));
           -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
    .tlinks{display:flex;gap:1.4rem;align-items:center;}
    .tlinks a{color:#888;font-size:.78rem;letter-spacing:2px;text-decoration:none;
              text-transform:uppercase;transition:color .2s;}
    .tlinks a:hover{color:var(--gold);}
    .tbadge{background:var(--red);color:#fff;font-size:.62rem;
            letter-spacing:2px;padding:2px 8px;border-radius:2px;text-transform:uppercase;}
    #gframe{width:100%;height:calc(100vh - 48px);border:none;display:block;}
  </style>
</head>
<body>
  <div style="display:flex;flex-direction:column;height:100vh;">
    <div id="topbar">
      <span class="tlogo">CAP RUSH</span>
      <div class="tlinks">
        <a href="index.html">Lobby</a>
        <a href="personagens.html">Pilotos</a>
        <a href="ranking.html">Ranking</a>
        <span class="tbadge">Prototype v0.2</span>
      </div>
    </div>
    <iframe id="gframe" src="client/game.html" allow="autoplay" title="CapRush Game"></iframe>
  </div>
</body>
</html>
"""

INDEX_LOCAL = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>CapRush - Overdrive!</title>
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
  <style>
    :root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--acc:#00E5FF;}
    *{margin:0;padding:0;box-sizing:border-box;}
    body{background:var(--dark);color:#E8E8F0;font-family:'Rajdhani',sans-serif;
         height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;}
    body::before{content:'';position:fixed;inset:0;
      background-image:linear-gradient(rgba(255,42,42,.04) 1px,transparent 1px),
                       linear-gradient(90deg,rgba(255,42,42,.04) 1px,transparent 1px);
      background-size:40px 40px;z-index:0;animation:gm 8s linear infinite;}
    @keyframes gm{to{background-position:0 40px;}}
    .hero{position:relative;z-index:1;text-align:center;padding:2rem;}
    .logo{font-family:'Bebas Neue',sans-serif;font-size:clamp(4rem,12vw,9rem);line-height:.9;letter-spacing:4px;
          background:linear-gradient(135deg,var(--red),var(--gold));
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
    .sub{font-size:1.4rem;letter-spacing:8px;color:var(--acc);text-transform:uppercase;
         margin-top:.5rem;margin-bottom:2.5rem;}
    .badge{display:inline-block;background:var(--red);color:#fff;font-size:.7rem;
           letter-spacing:3px;padding:3px 10px;border-radius:2px;margin-bottom:2.5rem;text-transform:uppercase;}
    .btn{display:inline-block;background:linear-gradient(135deg,var(--red),#A00);color:#fff;
         font-family:'Bebas Neue',sans-serif;font-size:1.6rem;letter-spacing:4px;
         padding:.9rem 3rem;text-decoration:none;border-radius:4px;
         border:2px solid var(--gold);transition:all .2s;box-shadow:0 0 30px rgba(255,42,42,.4);}
    .btn:hover{background:var(--gold);color:var(--dark);box-shadow:0 0 50px rgba(255,215,0,.5);transform:translateY(-2px);}
    .stats{display:flex;gap:3rem;margin-top:3rem;color:#666680;font-size:.85rem;letter-spacing:2px;}
    .stat strong{display:block;color:var(--gold);font-family:'Bebas Neue',sans-serif;font-size:1.8rem;}
    .deco{position:fixed;width:60px;height:60px;border-radius:50%;border:3px solid var(--gold);
          background:radial-gradient(circle at 30% 30%,#fff5,transparent 60%),linear-gradient(135deg,var(--red),#600);
          animation:fl 3s ease-in-out infinite;opacity:.6;}
    .deco:nth-child(1){top:15%;left:10%;}
    .deco:nth-child(2){top:70%;left:85%;animation-delay:1s;}
    .deco:nth-child(3){top:80%;left:8%;animation-delay:2s;width:40px;height:40px;}
    @keyframes fl{0%,100%{transform:translateY(0) rotate(0deg);}50%{transform:translateY(-15px) rotate(10deg);}}
  </style>
</head>
<body>
  <div class="deco"></div><div class="deco"></div><div class="deco"></div>
  <section class="hero">
    <div class="badge">Prototype v0.2 &middot; Fogo SVM &middot; Devnet</div>
    <h1 class="logo">CAP<br>RUSH</h1>
    <p class="sub">&#8212; Overdrive! &#8212;</p>
    <a href="game.html" class="btn">&#9654; JOGAR AGORA</a>
    <div class="stats">
      <div class="stat"><strong>01</strong>PISTA ATIVA</div>
      <div class="stat"><strong>$CR</strong>TOKEN</div>
      <div class="stat"><strong>04</strong>PILOTOS</div>
      <div class="stat"><strong>FOGO</strong>SVM</div>
    </div>
  </section>
</body>
</html>
"""

SERVER_PY = """#!/usr/bin/env python3
# server.py - Backend CapRush | Flask + SQLite
# pip install flask flask-cors
# python server.py
from flask import Flask,request,jsonify
from flask_cors import CORS
import sqlite3,os,time
app=Flask(__name__)
CORS(app)
DB=os.path.join(os.path.dirname(__file__),'caprush.db')
def db():
    c=sqlite3.connect(DB);c.row_factory=sqlite3.Row;return c
def init():
    with db() as c:
        c.execute("CREATE TABLE IF NOT EXISTS scores(id INTEGER PRIMARY KEY AUTOINCREMENT,piloto TEXT,pista TEXT,tempo REAL,ts INTEGER DEFAULT(strftime('%s','now')))");c.commit()
    print('DB ok:',DB)
@app.route('/api/scores',methods=['GET'])
def ls():
    p=request.args.get('pista','Terra e Cascalho')
    with db() as c:
        rows=c.execute('SELECT piloto,pista,tempo,ts FROM scores WHERE pista=? ORDER BY tempo LIMIT 20',(p,)).fetchall()
    return jsonify([dict(r) for r in rows])
@app.route('/api/scores',methods=['POST'])
def add():
    d=request.get_json(force=True)
    pi=str(d.get('piloto','?'))[:32];pi2=str(d.get('pista','Terra e Cascalho'))[:64]
    t=float(d.get('tempo',0))
    if t<=0:return jsonify({'error':'tempo invalido'}),400
    with db() as c:
        c.execute('INSERT INTO scores(piloto,pista,tempo) VALUES(?,?,?)',(pi,pi2,t));c.commit()
    print('Score:',pi,pi2,round(t,2),'s')
    return jsonify({'ok':True}),201
@app.route('/api/scores/<p>',methods=['GET'])
def best(p):
    with db() as c:
        r=c.execute('SELECT MIN(tempo) as m FROM scores WHERE piloto=?',(p,)).fetchone()
    return jsonify({'piloto':p,'melhor':r['m'] if r else None})
@app.route('/api/health')
def health():return jsonify({'ok':True,'ts':int(time.time())})
if __name__=='__main__':
    init();print('CapRush Server -> http://localhost:5000')
    app.run(host='0.0.0.0',port=5000,debug=True)
"""

SETUP_PY = """#!/usr/bin/env python3
# setup_project.py - Instala dependencias do CapRush
import subprocess,sys
def r(cmd):print('$',cmd);subprocess.run(cmd,shell=True,check=True)
print('=== CapRush Setup ===')
r(sys.executable+' -m pip install flask flask-cors')
print()
print('Pronto! Rode:')
print('  Terminal 1: cd server && python server.py')
print('  Terminal 2: cd client && python -m http.server 3000')
print('  Chrome: http://localhost:3000')
"""

def build():
    print()
    print("="*60)
    print("  CapRush builder_prototype.py v3")
    print("  FASE 1 + Integracao Vercel + Bug Fix")
    print("="*60)
    print()
    print("Raiz:", ROOT)
    print()
    print("Pastas...")
    for dd in ["anchor","assets/images","assets/sounds","assets/models",
               "client/src/core","client/src/entities","client/src/scenes",
               "server","docs"]:
        d(dd)
    print()
    print("Arquivos...")
    w("client/src/core/Vector2D.js",    VECTOR2D)
    w("client/src/core/Physics.js",     PHYSICS)
    w("client/src/core/GameLoop.js",    GAMELOOP)
    w("client/src/entities/Yuki.js",    YUKI)
    w("client/src/scenes/TrackTest.js", TRACKTEST)
    w("client/index.html",              INDEX_LOCAL)
    w("client/game.html",               GAME_HTML)
    w("caprush-game.html",              CAPRUSH_GAME_HTML)
    w("server/server.py",               SERVER_PY)
    w("setup_project.py",               SETUP_PY)
    print()
    print("="*60)
    print("  GERADO COM SUCESSO!")
    print("="*60)
    print()
    print("  TESTAR LOCALMENTE:")
    print("  1) cd server && python server.py")
    print("  2) cd client && python -m http.server 3000")
    print("  3) Chrome: http://localhost:3000")
    print()

if __name__=="__main__":
    build()
