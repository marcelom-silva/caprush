#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace") if hasattr(sys.stdout, "reconfigure") else None
# -*- coding: utf-8 -*-
"""CapRush v0.3 — Builder Parte 3: GameLoop, multi-local, online, server, docs"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))
def w(rel, txt):
    path = os.path.join(ROOT, *rel.split('/'))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(txt)
    print(f'  [OK]  {rel}')

# ═══════════════════════════════════════════════════════════════
# GameLoop.js v3 — Ricochete correto + stands/paddock
# ═══════════════════════════════════════════════════════════════
w('client/src/core/GameLoop.js', r"""// GameLoop.js v3 — CapRush Solo
// CORRECAO: ricochete em obstaculos usa reflexao vetorial correta (Physics.bounce)
// NOVO: colisao com stands (ricochet REST=0.72) e paddock (ricochet REST=0.60)
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

  var LAPS=TrackV3.META.voltas, NCPS=3, CAP_R=16;
  var gs={phase:'WAIT',lap:1,cp:0,t0:0,elapsed:0,best:null,ds:null,dc:null,respawn:null};
  var animT=0, lt=0;
  var sndTimer={water:0,grass:0};

  SoundEngine.init();

  function resize(){
    var wrap=canvas.parentElement;
    canvas.width  = Math.max(wrap.offsetWidth - 155, 320);
    canvas.height = Math.max(wrap.offsetHeight, 280);
    TrackV3.init(canvas.width, canvas.height);
    var sp=TrackV3.getStartPos();
    Physics.reset(sp.x, sp.y, 'asfalto');
    Yuki.resetAnim();
    gs.respawn={x:sp.x, y:sp.y};
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 80);

  function startGame(){
    SoundEngine.resume();
    overlay.style.display='none';
    gs.phase='AIM';
    if(canvas.width<50) resize();
    var sp=TrackV3.getStartPos();
    Physics.reset(sp.x, sp.y, 'asfalto');
    gs.respawn={x:sp.x, y:sp.y};
  }
  overlay.addEventListener('click',   startGame);
  overlay.addEventListener('touchend',function(e){e.preventDefault();startGame();},{passive:false});

  function cpos(e){ var r=canvas.getBoundingClientRect(); return new Vector2D(e.clientX-r.left, e.clientY-r.top); }
  function bnd(){ return{x:0,y:0,w:canvas.width,h:canvas.height}; }

  canvas.addEventListener('mousedown', function(e){
    if(gs.phase!=='AIM') return; SoundEngine.resume();
    var ph=Physics.step(0,bnd());
    if(cpos(e).distanceTo(ph.pos)<48){ gs.ds=cpos(e); gs.dc=cpos(e); }
  });
  canvas.addEventListener('mousemove', function(e){
    if(!gs.ds) return; gs.dc=cpos(e);
    var pct=Math.min(gs.ds.sub(gs.dc).magnitude()/Physics.MAX_PX,1);
    elFBar.style.height=(pct*100)+'%'; elFVal.textContent=Math.round(pct*100)+'%';
  });
  canvas.addEventListener('mouseup', function(e){
    if(!gs.ds||gs.phase!=='AIM') return;
    var info=Physics.flick(gs.ds,cpos(e),Yuki.M.spd);
    log('Lance: '+info.forcePct+'% / '+info.angle.toFixed(0)+'\u00b0','ev');
    gs.ds=null; gs.dc=null; gs.phase='MOVING';
    if(!gs.t0) gs.t0=performance.now();
    elFBar.style.height='0%'; elFVal.textContent='0%';
  });
  canvas.addEventListener('touchstart',function(e){
    if(gs.phase!=='AIM') return; SoundEngine.resume();
    var ph=Physics.step(0,bnd());
    if(cpos(e.touches[0]).distanceTo(ph.pos)<48){ gs.ds=cpos(e.touches[0]); gs.dc=cpos(e.touches[0]); }
  },{passive:true});
  canvas.addEventListener('touchmove',function(e){
    e.preventDefault(); if(!gs.ds) return; gs.dc=cpos(e.touches[0]);
    var pct=Math.min(gs.ds.sub(gs.dc).magnitude()/Physics.MAX_PX,1);
    elFBar.style.height=(pct*100)+'%'; elFVal.textContent=Math.round(pct*100)+'%';
  },{passive:false});
  canvas.addEventListener('touchend',function(e){
    if(!gs.ds||gs.phase!=='AIM') return;
    Physics.flick(gs.ds,cpos(e.changedTouches[0]),Yuki.M.spd);
    gs.ds=null; gs.dc=null; gs.phase='MOVING';
    if(!gs.t0) gs.t0=performance.now();
    elFBar.style.height='0%'; elFVal.textContent='0%';
  },{passive:true});

  function loop(now){
    var dt=Math.min((now-lt)/1000, 0.05); lt=now; animT+=dt;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    TrackV3.render(ctx, canvas.width, canvas.height, animT);

    var ph=Physics.step(dt, bnd());

    if(ph.moving){
      // ── Obstaculos: ricochete correto via reflexao vetorial ──
      var obs=TrackV3.checkObstacles(ph.pos, CAP_R);
      if(obs){
        // FIX v3: usa Physics.bounce com normal do obstaculo (REST=0.72)
        Physics.bounce(obs.nx, obs.ny, 0.72);
        SoundEngine.hit();
        log('Bateu em obstaculo!');
        ph=Physics.step(0, bnd());
      }

      // ── NOVO v3: Arquibancadas — ricochete REST=0.72 ──
      var stand=TrackV3.checkStands(ph.pos, CAP_R);
      if(stand){
        Physics.bounce(stand.nx, stand.ny, 0.72);
        SoundEngine.hit();
        log('Arquibancada! Ricochete!', 'ev');
        ph=Physics.step(0, bnd());
      }

      // ── NOVO v3: Paddock — ricochete REST=0.60 (solo) ──
      var pdk=TrackV3.checkPaddock(ph.pos, CAP_R);
      if(pdk){
        Physics.bounce(pdk.nx, pdk.ny, 0.60);
        SoundEngine.hit();
        log('Paddock! Ricochete!', 'ev');
        ph=Physics.step(0, bnd());
      }

      // Superficie especial (apenas se na pista)
      if(TrackV3.isOnTrack(ph.pos)){
        var now2=Date.now();
        if(TrackV3.detectPuddle(ph.pos)){
          Physics.setSurface('agua');
          if(now2-sndTimer.water>700){ SoundEngine.splash(); sndTimer.water=now2; }
        } else if(TrackV3.detectGrassOnTrack(ph.pos)){
          Physics.setSurface('grama');
          if(now2-sndTimer.grass>900){ SoundEngine.grass(); sndTimer.grass=now2; }
        } else {
          Physics.setSurface('asfalto');
        }
      } else {
        var inner=TrackV3.detectInner(ph.pos);
        if(inner){
          var rp=gs.respawn||TrackV3.getStartPos();
          Physics.reset(rp.x, rp.y, 'asfalto');
          log('Zona '+inner+' \u2014 voltando ao CP');
        }
      }
    }

    Yuki.render(ctx, ph, dt);
    if(gs.ds&&gs.dc) drawAim(ph.pos, gs.dc);

    if(gs.phase==='MOVING'){
      gs.elapsed=(performance.now()-gs.t0)/1000; updHUD();
      if(!ph.moving){ gs.phase='AIM'; log('Parou \u2014 mire novamente'); }
      TrackV3.checkCP(ph.pos, function(c){
        SoundEngine.checkpoint();
        gs.cp++; elCp.textContent=gs.cp+'/'+NCPS;
        gs.respawn={x:c.x, y:c.y};
        log(c.lbl+' ativado!','ev');
      });
      if(gs.cp>=NCPS&&TrackV3.checkLap(ph.pos)) onLap();
    }
    requestAnimationFrame(loop);
  }

  function onLap(){
    gs.cp=0; TrackV3.resetCPs();
    if(gs.lap>=LAPS){ gs.phase='FINISH'; onFinish(); }
    else{ gs.lap++; log('Volta '+gs.lap+' iniciada!','ev'); elLap.textContent=gs.lap+'/'+LAPS; }
  }
  function onFinish(){
    var t=gs.elapsed;
    if(!gs.best||t<gs.best) gs.best=t;
    elBest.textContent=fmt(gs.best);
    log('CORRIDA COMPLETA! '+fmt(t),'ev');
    SoundEngine.victory();
    postScore('Yuki',t);
    setTimeout(function(){
      overlay.innerHTML='<h2>CORRIDA COMPLETA!</h2>'
        +'<p style="color:#FFD700;font-size:2rem;font-family:Bebas Neue,sans-serif">'+fmt(t)+'</p>'
        +'<p style="color:#aaa;margin-top:.5rem">Clique para jogar novamente</p>';
      overlay.style.display='flex';
      overlay.onclick=function(){overlay.onclick=null;restart();};
    },1600);
  }
  function restart(){
    overlay.style.display='none';
    TrackV3.resetCPs();
    var sp=TrackV3.getStartPos();
    Physics.reset(sp.x,sp.y,'asfalto');
    Yuki.resetAnim();
    gs={phase:'AIM',lap:1,cp:0,t0:performance.now(),elapsed:0,best:gs.best,ds:null,dc:null,respawn:{x:sp.x,y:sp.y}};
    updHUD(); logBox.innerHTML='';
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
    var p=document.createElement('p'); if(cls)p.className=cls;
    p.textContent=msg; logBox.insertBefore(p,logBox.firstChild);
    while(logBox.children.length>30) logBox.removeChild(logBox.lastChild);
  }
  function drawAim(cap, drag){
    var dir=cap.sub(drag).normalize();
    var dist=Math.min(cap.distanceTo(drag),Physics.MAX_PX);
    var end=cap.add(dir.scale(dist*1.8)), pct=dist/Physics.MAX_PX;
    ctx.save();
    var g=ctx.createLinearGradient(cap.x,cap.y,end.x,end.y);
    g.addColorStop(0,'rgba(0,229,255,'+(0.85+pct*.15)+')');
    g.addColorStop(1,'rgba(0,229,255,0)');
    ctx.strokeStyle=g; ctx.lineWidth=2+pct*2.5; ctx.setLineDash([7,5]);
    ctx.beginPath();ctx.moveTo(cap.x,cap.y);ctx.lineTo(end.x,end.y);ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(cap.x,cap.y,20+pct*12,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,215,0,'+(0.25+pct*.5)+')';
    ctx.lineWidth=1.5; ctx.stroke();
    ctx.restore();
  }
  function postScore(p,t){
    fetch('http://localhost:5000/api/scores',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({piloto:p,pista:TrackV3.META.nome,tempo:t})
    }).then(function(){log('Score salvo.','ev');}).catch(function(){log('Servidor offline.');});
  }
  requestAnimationFrame(function(t){lt=t;requestAnimationFrame(loop);});
})();
""")

# ═══════════════════════════════════════════════════════════════
# game-multi-local.html v3 — physics corrigidas + stands/paddock
#   + painel lateral + colisao cap×cap
# ═══════════════════════════════════════════════════════════════
w('client/game-multi-local.html', r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush - 1v1 Local</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--panel:rgba(8,8,18,.96);--acc:#00E5FF;--p2:#FF9900;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;background:var(--dark);font-family:'Rajdhani',sans-serif;color:#E8E8F0;overflow:hidden;}
#shell{display:flex;flex-direction:column;width:100%;height:100%;}
#hud{display:flex;justify-content:space-between;align-items:center;padding:5px 14px;background:var(--panel);border-bottom:2px solid rgba(255,42,42,.3);flex-shrink:0;height:44px;gap:1rem;}
.hlogo{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:3px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none;white-space:nowrap;}
.pi{display:flex;align-items:center;gap:.5rem;}
.pd{width:11px;height:11px;border-radius:50%;flex-shrink:0;}
.pn{font-family:'Bebas Neue',sans-serif;font-size:.95rem;letter-spacing:2px;}
.ps{font-family:'Bebas Neue',sans-serif;font-size:.8rem;color:#888;min-width:54px;}
.vs{font-family:'Bebas Neue',sans-serif;color:#333;font-size:1.3rem;letter-spacing:3px;}
#wrap{position:relative;flex:1;min-height:0;display:flex;}
#gameCanvas{display:block;flex:1;cursor:crosshair;}
/* Painel lateral — desliza no hover */
#side-panel{width:150px;flex-shrink:0;background:var(--panel);border-left:1px solid rgba(255,42,42,.2);display:flex;flex-direction:column;padding:8px;gap:8px;overflow:hidden;transition:width .25s,opacity .25s;opacity:.4;}
#side-panel:hover{opacity:1;}
.pt{font-family:'Bebas Neue',sans-serif;font-size:.82rem;letter-spacing:2px;color:var(--red);border-bottom:1px solid rgba(255,42,42,.25);padding-bottom:3px;}
#fbg{width:100%;height:70px;background:#1A1A28;border:1px solid #333;border-radius:3px;position:relative;overflow:hidden;}
#force-bar-fill{position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(0deg,var(--red),var(--gold));transition:height .05s;}
#force-value{font-family:'Bebas Neue',sans-serif;font-size:1.2rem;color:var(--gold);text-align:center;}
.pil-row{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.05);}
.pil-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
.pil-name{font-family:'Bebas Neue',sans-serif;font-size:.8rem;letter-spacing:1px;flex:1;}
.pil-info{font-size:.6rem;color:#666;line-height:1.3;}
.pil-row.active-p{background:rgba(255,255,255,.04);border-radius:4px;}
#surf-legend{font-size:.58rem;color:#666680;}
.sl-row{display:flex;align-items:center;gap:3px;margin:2px 0;}
.sl-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
#log-box-m{flex:1;overflow-y:auto;font-size:.56rem;color:#555570;}
#log-box-m p{padding:2px 0;border-bottom:1px solid #1A1A28;}
#log-box-m p.ev{color:var(--gold);}
#turn-banner{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Bebas Neue',sans-serif;font-size:2.5rem;letter-spacing:6px;pointer-events:none;opacity:0;transition:opacity .3s;z-index:15;text-shadow:0 0 30px currentColor;}
#overlay{position:absolute;inset:0;background:rgba(0,0,0,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;cursor:pointer;}
#overlay h2{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:5px;color:var(--gold);margin-bottom:.5rem;}
#overlay p{color:#AAA;letter-spacing:2px;font-size:.85rem;margin:.2rem 0;}
.pulse{animation:pulse 1.2s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
#btnBack{position:absolute;top:8px;left:8px;z-index:25;background:rgba(255,42,42,.15);border:1px solid var(--red);color:var(--red);font-family:'Rajdhani',sans-serif;font-size:.73rem;letter-spacing:2px;padding:3px 8px;cursor:pointer;border-radius:3px;text-decoration:none;}
#btnBack:hover{background:var(--red);color:#fff;}
</style>
</head>
<body>
<div id="shell">
  <div id="hud">
    <a href="../index.html" class="hlogo">CAP RUSH</a>
    <div class="pi">
      <div class="pd" style="background:var(--acc);box-shadow:0 0 7px var(--acc)"></div>
      <span class="pn" style="color:var(--acc)">YUKI</span>
      <span class="ps" id="p0-time">00:00.0</span>
      <span class="ps" id="p0-lap" style="color:var(--acc)">V1/2 CP0/3</span>
    </div>
    <span class="vs">VS</span>
    <div class="pi">
      <span class="ps" id="p1-lap" style="color:var(--p2)">V1/2 CP0/3</span>
      <span class="ps" id="p1-time">00:00.0</span>
      <span class="pn" style="color:var(--p2)">KENTA</span>
      <div class="pd" style="background:var(--p2);box-shadow:0 0 7px var(--p2)"></div>
    </div>
  </div>
  <div id="wrap">
    <canvas id="gameCanvas"></canvas>
    <!-- Painel lateral -->
    <div id="side-panel">
      <div class="pt">FORCA</div>
      <div id="fbg"><div id="force-bar-fill"></div></div>
      <div id="force-value">0%</div>
      <div class="pt">PILOTOS</div>
      <div id="pilots-panel">
        <div class="pil-row" id="prow-0">
          <div class="pil-dot" style="background:var(--acc)"></div>
          <div><div class="pil-name" style="color:var(--acc)">YUKI</div><div class="pil-info" id="pinfo-0">V1 CP0/3</div></div>
        </div>
        <div class="pil-row" id="prow-1">
          <div class="pil-dot" style="background:var(--p2)"></div>
          <div><div class="pil-name" style="color:var(--p2)">KENTA</div><div class="pil-info" id="pinfo-1">V1 CP0/3</div></div>
        </div>
      </div>
      <div class="pt">PISTA</div>
      <div id="surf-legend">
        <div class="sl-row"><div class="sl-dot" style="background:#5C4530"></div><span>Asfalto</span></div>
        <div class="sl-row"><div class="sl-dot" style="background:#00A0FF;border:1px solid #00E5FF"></div><span>Agua</span></div>
        <div class="sl-row"><div class="sl-dot" style="background:#38B838;border:1px solid #60E060"></div><span>Grama</span></div>
        <div class="sl-row"><div class="sl-dot" style="background:#FFD700;border:1px solid #FFD700"></div><span>Stands</span></div>
        <div class="sl-row"><div class="sl-dot" style="background:#FF6600;border:1px solid #FF8800"></div><span>Paddock</span></div>
      </div>
      <div class="pt">EVENTOS</div>
      <div id="log-box-m"></div>
    </div>
    <div id="turn-banner">TURNO YUKI</div>
    <div id="overlay">
      <h2>1v1 LOCAL</h2>
      <p style="color:var(--acc)">YUKI (Azul) vs KENTA (Laranja)</p>
      <p>Jogadores se alternam em cada lance</p>
      <p style="font-size:.77rem;color:#555;margin-top:.4rem">Clique e arraste a tampinha ATIVA para mirar</p>
      <br><p class="pulse">&#9654; CLIQUE PARA COMECAR</p>
    </div>
    <a href="game-multi.html" id="btnBack">&larr; MODOS</a>
  </div>
</div>

<script src="src/core/Vector2D.js"></script>
<script src="src/core/SoundEngine.js"></script>
<script src="src/core/CapSprite.js"></script>
<script src="src/scenes/TrackV3.js"></script>
<script>
// ── Motor fisico independente v3 (com bugs corrigidos) ─────────────────
function makePhysics(){
  var BASE_DRAG=1.8, MAX_PX=165, MAX_SPD=620, REST=0.65, MIN=6;
  // FIX v3: drag multiplicadores corrigidos
  var DRAG_MULT={asfalto:1.0, agua:1.95, grama:0.42};
  var s={pos:new Vector2D(0,0), vel:new Vector2D(0,0), moving:false, surf:'asfalto'};
  return {
    reset:function(x,y,sf){ s.pos=new Vector2D(x,y);s.vel=new Vector2D(0,0);s.moving=false;s.surf=sf||'asfalto'; },
    setSurface:function(sf){ s.surf=sf||'asfalto'; },
    // FIX v3: reflexao vetorial correta
    bounce:function(nx,ny,rest){
      var r=rest||REST;
      var dot=s.vel.x*nx+s.vel.y*ny;
      if(dot>=0)return;
      s.vel.x=(s.vel.x-2*dot*nx)*r;
      s.vel.y=(s.vel.y-2*dot*ny)*r;
      s.moving=s.vel.magnitude()>MIN;
    },
    flick:function(from,to,mult){
      var d=from.sub(to),len=Math.min(d.magnitude(),MAX_PX),t=len/MAX_PX;
      s.vel=d.normalize().scale(t*MAX_SPD*(mult||1));s.moving=true;
      return{forcePct:Math.round(t*100)};
    },
    step:function(dt,b){
      if(!s.moving) return this.snap();
      var dc=BASE_DRAG*(DRAG_MULT[s.surf]||1),spd=s.vel.magnitude();
      var ns=Math.max(0,spd-dc*spd*dt);
      if(ns<MIN){s.vel=new Vector2D(0,0);s.moving=false;return this.snap();}
      s.vel=s.vel.normalize().scale(ns);
      s.pos=s.pos.add(s.vel.scale(dt));
      var r2=14;
      if(s.pos.x-r2<b.x){s.pos.x=b.x+r2;s.vel.x=Math.abs(s.vel.x)*REST;}
      if(s.pos.x+r2>b.x+b.w){s.pos.x=b.x+b.w-r2;s.vel.x=-Math.abs(s.vel.x)*REST;}
      if(s.pos.y-r2<b.y){s.pos.y=b.y+r2;s.vel.y=Math.abs(s.vel.y)*REST;}
      if(s.pos.y+r2>b.y+b.h){s.pos.y=b.y+b.h-r2;s.vel.y=-Math.abs(s.vel.y)*REST;}
      return this.snap();
    },
    snap:function(){ return{pos:s.pos.clone(),vel:s.vel.clone(),speed:s.vel.magnitude(),moving:s.moving}; },
    applyVel:function(vx,vy){ s.vel=new Vector2D(vx,vy);s.moving=s.vel.magnitude()>MIN; },
    get pos(){ return s.pos.clone(); },
    get vel(){ return s.vel.clone(); },
    MAX_PX:MAX_PX, REST:REST
  };
}

function cloneCPs(master){ return master.map(function(c){return{x:c.x,y:c.y,r:c.r,lbl:c.lbl,ok:false};}); }

// ── Setup ─────────────────────────────────────────────────────
SoundEngine.init();
var canvas=document.getElementById('gameCanvas');
var ctx=canvas.getContext('2d');
var overlay=document.getElementById('overlay');
var tb=document.getElementById('turn-banner');
var elFBar=document.getElementById('force-bar-fill');
var elFVal=document.getElementById('force-value');
var logBox=document.getElementById('log-box-m');
var LAPS=2,NCPS=3,CAP_R=16;

var P=[
  {id:0,name:'YUKI', color:'#00E5FF',accent:'#00A5C8',kanji:'\u96EA',
   phys:makePhysics(),cps:null,
   lap:1,cp:0,t0:0,elapsed:0,finished:false,respawn:null,
   anim:{rot:0,glow:0,gdir:1,trail:[]}},
  {id:1,name:'KENTA',color:'#FF9900',accent:'#CC7700',kanji:'\u9B54',
   phys:makePhysics(),cps:null,
   lap:1,cp:0,t0:0,elapsed:0,finished:false,respawn:null,
   anim:{rot:0,glow:0,gdir:1,trail:[]}},
];

var cur=0, phase='WAIT', ds=null, dc=null;
var sndT={water:0,grass:0};
var paddockSkip=-1; // index do jogador que perde rodada por paddock

function resize(){
  canvas.width=canvas.parentElement.offsetWidth;
  canvas.height=canvas.parentElement.offsetHeight||400;
  TrackV3.init(canvas.width,canvas.height);
  var sp=TrackV3.getStartPos();
  P.forEach(function(p,i){
    var off=(i===0?-14:14);
    p.phys.reset(sp.x,sp.y+off,'asfalto');
    p.respawn={x:sp.x,y:sp.y+off};
    p.cps=cloneCPs(TrackV3.checkpoints);
  });
}
window.addEventListener('resize',resize);
setTimeout(resize,80);

function startGame(){
  SoundEngine.resume();
  overlay.style.display='none';
  phase='AIM';
  if(canvas.width<50) resize();
  showTurn();
}
overlay.addEventListener('click',startGame);
overlay.addEventListener('touchend',function(e){e.preventDefault();startGame();},{passive:false});

function showTurn(){
  var p=P[cur];
  tb.textContent='TURNO '+p.name;
  tb.style.color=p.color;
  tb.style.opacity='1';
  setTimeout(function(){tb.style.opacity='0';},1100);
  // atualiza painel
  P.forEach(function(p2,i){
    var row=document.getElementById('prow-'+i);
    row.classList.toggle('active-p',i===cur);
  });
}

function cpos(e){var r=canvas.getBoundingClientRect();return new Vector2D(e.clientX-r.left,e.clientY-r.top);}
function bnd(){return{x:0,y:0,w:canvas.width,h:canvas.height};}
function nearActive(pt){var ph=P[cur].phys.snap();return pt.distanceTo(ph.pos)<52;}

canvas.addEventListener('mousedown',function(e){
  if(phase!=='AIM')return;SoundEngine.resume();
  if(nearActive(cpos(e))){ds=cpos(e);dc=cpos(e);}
});
canvas.addEventListener('mousemove',function(e){
  if(!ds)return;dc=cpos(e);
  var pct=Math.min(ds.sub(dc).magnitude()/P[cur].phys.MAX_PX,1);
  elFBar.style.height=(pct*100)+'%';elFVal.textContent=Math.round(pct*100)+'%';
});
canvas.addEventListener('mouseup',function(e){
  if(!ds||phase!=='AIM')return;
  doFlick(ds,cpos(e));
  ds=null;dc=null;
});
canvas.addEventListener('touchstart',function(e){
  if(phase!=='AIM')return;SoundEngine.resume();
  if(nearActive(cpos(e.touches[0]))){ds=cpos(e.touches[0]);dc=cpos(e.touches[0]);}
},{passive:true});
canvas.addEventListener('touchmove',function(e){
  e.preventDefault();if(!ds)return;dc=cpos(e.touches[0]);
  var pct=Math.min(ds.sub(dc).magnitude()/P[cur].phys.MAX_PX,1);
  elFBar.style.height=(pct*100)+'%';elFVal.textContent=Math.round(pct*100)+'%';
},{passive:false});
canvas.addEventListener('touchend',function(e){
  if(!ds||phase!=='AIM')return;
  doFlick(ds,cpos(e.changedTouches[0]));
  ds=null;dc=null;
},{passive:true});

function doFlick(from,to){
  var p=P[cur];
  var info=p.phys.flick(from,to,1.0);
  if(!p.t0) p.t0=performance.now();
  phase='MOVING';
  log('['+p.name+'] Lance '+info.forcePct+'%','ev');
  elFBar.style.height='0%';elFVal.textContent='0%';
}

var lt=0, animT=0;

// ── COLISAO CAP x CAP ─────────────────────────────────────────
function resolveCapCollision(){
  var a=P[0].phys, b=P[1].phys;
  var pa=a.snap(), pb=b.snap();
  var dx=pb.pos.x-pa.pos.x, dy=pb.pos.y-pa.pos.y;
  var dist=Math.sqrt(dx*dx+dy*dy);
  if(dist > CAP_R*2+2 || dist < 0.1) return false;
  var nx=dx/dist, ny=dy/dist;
  var relVx=pa.vel.x-pb.vel.x, relVy=pa.vel.y-pb.vel.y;
  var relVn=relVx*nx+relVy*ny;
  if(relVn<=0) return false;
  var impulse=relVn*0.85;
  // Aplica impulso em ambas as tampinhas
  a.applyVel(pa.vel.x-impulse*nx, pa.vel.y-impulse*ny);
  b.applyVel(pb.vel.x+impulse*nx, pb.vel.y+impulse*ny);
  // Separa para evitar sobreposicao
  var overlap=(CAP_R*2+2-dist)/2;
  var pa2=a.snap(); a.applyVel(pa2.vel.x, pa2.vel.y);
  SoundEngine.hit();
  log('Batida entre tampinhas!','ev');
  return true;
}

function loop(now){
  var dt=Math.min((now-lt)/1000,0.05);lt=now;animT+=dt;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  TrackV3.render(ctx,canvas.width,canvas.height,animT);

  var moved=false;
  P.forEach(function(p,i){
    if(p.finished) return;
    var ph=p.phys.step(dt,bnd());

    if(ph.moving){
      // Obstaculos — ricochete correto
      var obs=TrackV3.checkObstacles(ph.pos,CAP_R);
      if(obs){ p.phys.bounce(obs.nx,obs.ny,0.72); SoundEngine.hit(); log('['+p.name+'] Obstaculo!'); ph=p.phys.snap(); }

      // Stands — ricochete REST=0.72
      var stand=TrackV3.checkStands(ph.pos,CAP_R);
      if(stand){ p.phys.bounce(stand.nx,stand.ny,0.72); SoundEngine.hit(); log('['+p.name+'] Arquibancada!','ev'); ph=p.phys.snap(); }

      // Paddock — ricochete REST=0.60 + perde proxima rodada
      var pdk=TrackV3.checkPaddock(ph.pos,CAP_R);
      if(pdk){
        p.phys.bounce(pdk.nx,pdk.ny,0.60); SoundEngine.hit();
        paddockSkip=i;
        log('['+p.name+'] PADDOCK! Perde rodada!','ev');
        ph=p.phys.snap();
      }

      // Superficie
      if(TrackV3.isOnTrack(ph.pos)){
        var n2=Date.now();
        if(TrackV3.detectPuddle(ph.pos)){
          p.phys.setSurface('agua');
          if(n2-sndT.water>700){SoundEngine.splash();sndT.water=n2;}
        } else if(TrackV3.detectGrassOnTrack(ph.pos)){
          p.phys.setSurface('grama');
          if(n2-sndT.grass>900){SoundEngine.grass();sndT.grass=n2;}
        } else {
          p.phys.setSurface('asfalto');
        }
      } else {
        var inner=TrackV3.detectInner(ph.pos);
        if(inner){ var rp=p.respawn||TrackV3.getStartPos(); p.phys.reset(rp.x,rp.y,'asfalto'); }
      }
      moved=true;
    }

    // Checkpoints e volta
    if(phase==='MOVING'&&i===cur){
      p.elapsed=(performance.now()-p.t0)/1000;
      checkCPForPlayer(p,ph.pos);
    }
  });

  // Colisao cap x cap
  if(moved) resolveCapCollision();

  // Desenha tampinhas
  P.forEach(function(p){
    var ph=p.phys.snap();
    var a=p.anim;
    a.rot+=0.04; a.glow+=0.05*a.gdir; if(a.glow>1||a.glow<0)a.gdir*=-1;
    // trail
    a.trail.push({x:ph.pos.x,y:ph.pos.y,a:0.35});
    if(a.trail.length>8) a.trail.shift();
    a.trail.forEach(function(tr,ti){
      ctx.save();ctx.globalAlpha=tr.a*(ti/8);
      ctx.fillStyle=p.color;
      ctx.beginPath();ctx.arc(tr.x,tr.y,CAP_R*.6,0,Math.PI*2);ctx.fill();
      ctx.restore();
    });
    // sombra
    ctx.save();ctx.globalAlpha=.2;ctx.fillStyle='#000';
    ctx.beginPath();ctx.ellipse(ph.pos.x+3,ph.pos.y+4,CAP_R+2,CAP_R*.5,0,0,Math.PI*2);ctx.fill();ctx.restore();
    // cap
    CapSprite.drawCap(ctx,ph.pos.x,ph.pos.y,CAP_R,p.color,p.accent,p.kanji,animT,a.rot,a.glow);
    // anel ativo
    if(cur===p.id && phase==='AIM'){
      ctx.save();ctx.strokeStyle=p.color;ctx.lineWidth=2;ctx.globalAlpha=0.5+Math.sin(animT*4)*.3;
      ctx.beginPath();ctx.arc(ph.pos.x,ph.pos.y,CAP_R+8,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
  });

  // Linha de mira
  if(ds&&dc){
    var ap=P[cur].phys.snap();
    var p3=P[cur];
    var dir=ap.pos.sub(dc).normalize();
    var dist2=Math.min(ap.pos.distanceTo(dc),165);
    var end=ap.pos.add(dir.scale(dist2*1.8));
    var pct=dist2/165;
    ctx.save();
    var g=ctx.createLinearGradient(ap.pos.x,ap.pos.y,end.x,end.y);
    g.addColorStop(0,p3.color);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.strokeStyle=g;ctx.lineWidth=2+pct*2;ctx.setLineDash([7,5]);
    ctx.beginPath();ctx.moveTo(ap.pos.x,ap.pos.y);ctx.lineTo(end.x,end.y);ctx.stroke();
    ctx.setLineDash([]);ctx.restore();
  }

  // Verifica fim do turno
  if(phase==='MOVING'){
    var allStopped=P.every(function(p){return!p.phys.snap().moving||p.finished;});
    if(allStopped){
      phase='AIM';
      updHUD();
      // Proximo turno
      var next=(cur+1)%2;
      // Pula turno por paddock?
      if(paddockSkip===next){
        paddockSkip=-1;
        log('['+P[next].name+'] Turno pulado (Paddock)!','ev');
        next=(next+1)%2;
      }
      cur=next;
      showTurn();
      elFBar.style.height='0%';elFVal.textContent='0%';
    }
  }

  requestAnimationFrame(loop);
}

function checkCPForPlayer(p,pos){
  for(var i=0;i<p.cps.length;i++){
    var c=p.cps[i]; if(c.ok) continue;
    var dx=pos.x-c.x,dy=pos.y-c.y;
    if(Math.sqrt(dx*dx+dy*dy)<c.r){
      c.ok=true; p.cp++;
      SoundEngine.checkpoint();
      p.respawn={x:c.x,y:c.y};
      log('['+p.name+'] '+c.lbl+' ativado!','ev');
      break;
    }
  }
  // Verifica volta
  if(p.cp>=NCPS&&checkLapForPlayer(p)){
    p.cp=0; p.cps.forEach(function(c){c.ok=false;});
    if(p.lap>=LAPS){ p.finished=true; onWin(p); }
    else{ p.lap++; log('['+p.name+'] Volta '+p.lap+' iniciada!','ev'); }
  }
}

function checkLapForPlayer(p){
  var ph=p.phys.snap();
  return TrackV3.checkLap(ph.pos);
}

function updHUD(){
  P.forEach(function(p,i){
    var te=document.getElementById('p'+i+'-time');
    var tl=document.getElementById('p'+i+'-lap');
    if(te) te.textContent=fmt(p.elapsed);
    if(tl) tl.textContent='V'+p.lap+'/'+LAPS+' CP'+p.cp+'/'+NCPS;
    var pi=document.getElementById('pinfo-'+i);
    if(pi) pi.textContent='V'+p.lap+' CP'+p.cp+'/3';
  });
}

function onWin(p){
  setTimeout(function(){
    overlay.innerHTML='<h2 style="color:'+p.color+'">'+p.name+' VENCEU!</h2>'
      +'<p style="color:'+p.color+';font-size:2rem;font-family:Bebas Neue,sans-serif">'+fmt(p.elapsed)+'</p>'
      +'<p style="color:#aaa;margin-top:.5rem">Clique para jogar novamente</p>';
    overlay.style.display='flex';
    overlay.onclick=function(){location.reload();};
  },1400);
}
function fmt(s){var m=Math.floor(s/60),ss=(s%60).toFixed(1);return(m<10?'0':'')+m+':'+(parseFloat(ss)<10?'0':'')+ss;}
function log(msg,cls){
  var p=document.createElement('p');if(cls)p.className=cls;
  p.textContent=msg;logBox.insertBefore(p,logBox.firstChild);
  while(logBox.children.length>40)logBox.removeChild(logBox.lastChild);
}

requestAnimationFrame(function(t2){lt=t2;requestAnimationFrame(loop);});
</script>
</body>
</html>
""")

# ═══════════════════════════════════════════════════════════════
# game-multi-online.html v3 — instrucoes claras + auto-fetch IP
# ═══════════════════════════════════════════════════════════════
w('client/game-multi-online.html', r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush - Online</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--acc:#00E5FF;--muted:#666680;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;background:var(--dark);font-family:'Rajdhani',sans-serif;color:#E8E8F0;overflow:auto;}
body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(255,42,42,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,42,42,.04) 1px,transparent 1px);background-size:40px 40px;z-index:0;pointer-events:none;}
.center{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;min-height:100vh;gap:1.2rem;padding:2rem;text-align:center;}
h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,7vw,4rem);letter-spacing:6px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.sub{color:var(--muted);letter-spacing:3px;font-size:.85rem;text-transform:uppercase;}
.panel{background:rgba(14,14,26,.95);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:1.5rem;width:100%;max-width:480px;display:flex;flex-direction:column;gap:.9rem;}
.section-title{font-family:'Bebas Neue',sans-serif;font-size:1.05rem;letter-spacing:3px;color:var(--gold);border-bottom:1px solid rgba(255,215,0,.2);padding-bottom:.35rem;}
input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:.65rem 1rem;color:#E8E8F0;font-family:'Rajdhani',sans-serif;font-size:1rem;letter-spacing:2px;width:100%;text-transform:uppercase;outline:none;}
input:focus{border-color:var(--acc);}
input::placeholder{color:#444;text-transform:none;}
.btn{font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:3px;padding:.65rem 1.5rem;border:1px solid;border-radius:6px;cursor:pointer;transition:all .2s;background:transparent;width:100%;}
.btn-create{color:var(--gold);border-color:var(--gold);}
.btn-create:hover{background:var(--gold);color:var(--dark);}
.btn-join{color:var(--acc);border-color:var(--acc);}
.btn-join:hover{background:var(--acc);color:var(--dark);}
#status{font-size:.82rem;color:var(--muted);letter-spacing:2px;min-height:1.2rem;}
#status.ok{color:#00FF88;}
#status.err{color:var(--red);}
.room-code{font-family:'Bebas Neue',sans-serif;font-size:2.8rem;letter-spacing:10px;color:var(--gold);background:rgba(255,215,0,.08);padding:.5rem 1rem;border-radius:8px;border:1px solid rgba(255,215,0,.25);display:none;}
.back-link{color:var(--muted);font-size:.8rem;letter-spacing:2px;text-decoration:none;text-transform:uppercase;}
.back-link:hover{color:var(--gold);}
/* Guia de como jogar */
.guide{background:rgba(14,14,26,.8);border:1px solid rgba(255,255,255,.05);border-radius:12px;padding:1.2rem;width:100%;max-width:480px;text-align:left;}
.guide h3{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:3px;color:var(--acc);margin-bottom:.8rem;}
.step{display:flex;gap:.7rem;margin-bottom:.7rem;font-size:.8rem;line-height:1.5;}
.step-n{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;color:var(--gold);flex-shrink:0;width:20px;}
.step-t{color:#CCC;}
.step-t b{color:var(--acc);}
.ws-note{font-size:.72rem;color:#444;letter-spacing:1px;line-height:1.6;}
#server-info{background:rgba(0,229,255,.06);border:1px solid rgba(0,229,255,.2);border-radius:8px;padding:.6rem 1rem;font-size:.78rem;color:var(--acc);display:none;}
#server-info a{color:var(--gold);word-break:break-all;}
</style>
</head>
<body>
<div class="center">
  <h1 data-i18n="online.title">ONLINE 1v1</h1>
  <p class="sub" data-i18n="online.sub">Duelo via internet (Beta)</p>

  <!-- Painel principal -->
  <div class="panel">
    <div class="section-title" data-i18n="online.criar">CRIAR SALA</div>
    <input id="nickCreate" data-i18n-ph="online.nick.c" placeholder="Seu nickname" maxlength="16"/>
    <button class="btn btn-create" onclick="createRoom()" data-i18n="online.criar.btn">CRIAR SALA E AGUARDAR</button>
    <div class="room-code" id="roomCode">-----</div>

    <div class="section-title" style="margin-top:.4rem" data-i18n="online.entrar">ENTRAR EM SALA</div>
    <input id="nickJoin"   data-i18n-ph="online.nick.j" placeholder="Seu nickname" maxlength="16"/>
    <input id="roomInput"  data-i18n-ph="online.code.ph" placeholder="Codigo da sala (5 letras)" maxlength="5"/>
    <button class="btn btn-join" onclick="joinRoom()" data-i18n="online.entrar.btn">ENTRAR NA SALA</button>

    <div id="status" data-i18n="online.connecting">Conectando ao servidor...</div>
    <div id="server-info"></div>
  </div>

  <!-- Guia de como jogar online -->
  <div class="guide">
    <h3 data-i18n="online.guide.title">&#9997; Como jogar Online</h3>
    <div class="step"><span class="step-n">1</span><span class="step-t">Abra o terminal na pasta <b>server/</b> do projeto e execute: <b>node ws-server.js</b></span></div>
    <div class="step"><span class="step-n">2</span><span class="step-t">O servidor mostrará o <b>IP e a porta</b> (3001). Os jogadores devem estar na mesma rede Wi-Fi, ou o host precisa de VPN/tunelamento (ex.: <b>ngrok tcp 3001</b>).</span></div>
    <div class="step"><span class="step-n">3</span><span class="step-t"><b>Host:</b> Digite seu nickname, clique em <b>CRIAR SALA</b> e compartilhe o código gerado com o outro jogador.</span></div>
    <div class="step"><span class="step-n">4</span><span class="step-t"><b>Guest:</b> Digite seu nickname, cole o código recebido e clique em <b>ENTRAR NA SALA</b>.</span></div>
    <div class="step"><span class="step-n">5</span><span class="step-t">Quando os dois estiverem conectados, o jogo inicia automaticamente em turnos alternados.</span></div>
    <div class="ws-note" style="margin-top:.5rem;color:#555;">
      Se o servidor estiver offline, o status aparece em vermelho. Certifique-se que <b>node ws-server.js</b> está rodando. O servidor aceita conexões na porta <b>3001</b>.
    </div>
  </div>

  <a href="game-multi.html" class="back-link">&larr; Voltar aos Modos</a>
</div>

<script>
var WS_HOST = location.hostname || 'localhost';
var WS_PORT = 3001;
var WS_URL  = 'ws://'+WS_HOST+':'+WS_PORT;
var ws = null;
var role = null;
var roomCode = null;

function connect(){
  try{
    ws = new WebSocket(WS_URL);
    ws.onopen = function(){
      setStatus('Conectado ao servidor ('+WS_HOST+':'+WS_PORT+')','ok');
      // Tenta buscar info do servidor HTTP para exibir IPs
      fetch('http://'+WS_HOST+':'+WS_PORT+'/info')
        .then(function(r){return r.json();})
        .then(function(d){
          if(d.ips && d.ips.length){
            var si = document.getElementById('server-info');
            si.style.display = 'block';
            si.innerHTML = 'Servidor encontrado &mdash; IPs: '+d.ips.map(function(ip){return'<b>'+ip.address+'</b>';}).join(', ')+' &mdash; porta <b>'+WS_PORT+'</b>';
          }
        })
        .catch(function(){});
    };
    ws.onmessage = function(e){
      var m=JSON.parse(e.data);
      if(m.type==='room_created'){
        roomCode=m.code;
        var rc=document.getElementById('roomCode');
        rc.textContent=m.code; rc.style.display='block';
        setStatus('Sala criada! Aguardando oponente...','ok');
      } else if(m.type==='room_joined'){
        roomCode=m.code;
        setStatus('Entrando na sala '+m.code+'...','ok');
      } else if(m.type==='start'){
        setStatus('Oponente conectado! Iniciando...','ok');
        role=m.first;
        setTimeout(function(){ startOnlineGame(); },800);
      } else if(m.type==='error'){
        setStatus('Erro: '+m.msg,'err');
      }
    };
    ws.onerror  = function(){ setStatus('Erro de conexao com o servidor. Execute node ws-server.js','err'); };
    ws.onclose  = function(){ setStatus('Conexao encerrada.','err'); ws=null; };
  } catch(e){
    setStatus('Nao foi possivel conectar. Verifique se o servidor esta rodando.','err');
  }
}

function setStatus(msg, cls){
  var el=document.getElementById('status');
  el.textContent=msg; el.className=cls||'';
}

function createRoom(){
  if(!ws||ws.readyState!==1){ setStatus('Servidor offline. Inicie node ws-server.js primeiro.','err'); return; }
  var nick=document.getElementById('nickCreate').value.trim()||'HOST';
  role='host';
  ws.send(JSON.stringify({type:'create_room', nick:nick}));
}

function joinRoom(){
  if(!ws||ws.readyState!==1){ setStatus('Servidor offline.','err'); return; }
  var nick=document.getElementById('nickJoin').value.trim()||'GUEST';
  var code=(document.getElementById('roomInput').value||'').toUpperCase().trim();
  if(!code){ setStatus('Digite o codigo da sala.','err'); return; }
  role='guest'; roomCode=code;
  ws.send(JSON.stringify({type:'join_room', code:code, nick:nick}));
}

function startOnlineGame(){
  // Salva estado de conexao para a pagina de jogo usar
  sessionStorage.setItem('cr_ws_host', WS_HOST);
  sessionStorage.setItem('cr_ws_port', String(WS_PORT));
  sessionStorage.setItem('cr_role', role);
  sessionStorage.setItem('cr_room', roomCode);
  // Poderia redirecionar para game-multi-online-game.html
  // Por ora, exibe instrucoes inline
  setStatus('Jogo iniciado! Role: '+role+' | Sala: '+roomCode,'ok');
}

// Conecta assim que a pagina carrega
connect();
</script>
<script src="../i18n.js"></script>
</body>
</html>
""")

# ═══════════════════════════════════════════════════════════════
# ws-server.js — Melhor exibicao de IP + link
# ═══════════════════════════════════════════════════════════════
w('server/ws-server.js', r"""/**
 * CapRush ws-server.js v3
 * Porta 3001 — WebSocket + HTTP
 * Executar: node ws-server.js   (dentro de server/)
 */
const WebSocket = require('ws');
const http      = require('http');
const os        = require('os');
const PORT      = 3001;

function getIPs(){
  const ips = [];
  for(const [,ifaces] of Object.entries(os.networkInterfaces()))
    for(const i of ifaces)
      if(i.family==='IPv4'&&!i.internal) ips.push(i.address);
  return ips;
}

const srv = http.createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Content-Type','application/json');
  if(req.url==='/info'){
    res.writeHead(200);
    res.end(JSON.stringify({ips:getIPs().map(a=>({address:a})),port:PORT}));
  } else {
    res.writeHead(200);
    res.end(JSON.stringify({status:'ok'}));
  }
});

const wss   = new WebSocket.Server({server:srv});
const rooms = {};

function gen(){ return Math.random().toString(36).substr(2,5).toUpperCase(); }
function send(ws,obj){ if(ws&&ws.readyState===1) ws.send(JSON.stringify(obj)); }

wss.on('connection', ws=>{
  ws._room=null; ws._role=null; ws._nick='?';
  ws.on('message', raw=>{
    let m; try{ m=JSON.parse(raw); }catch{ return; }
    if(m.type==='create_room'){
      const code=gen();
      rooms[code]={host:ws,guest:null,state:'waiting'};
      ws._room=code; ws._role='host'; ws._nick=m.nick||'HOST';
      send(ws,{type:'room_created',code});
      console.log(`\n  [+] Sala criada: ${code} | host: ${ws._nick}`);
    }
    else if(m.type==='join_room'){
      const code=(m.code||'').toUpperCase();
      const rm=rooms[code];
      if(!rm||rm.state!=='waiting'){ send(ws,{type:'error',msg:'Sala nao encontrada.'}); return; }
      rm.guest=ws; rm.state='playing';
      ws._room=code; ws._role='guest'; ws._nick=m.nick||'GUEST';
      send(ws, {type:'room_joined',code});
      send(rm.host, {type:'start',first:'host'});
      send(rm.guest,{type:'start',first:'host'});
      console.log(`  [>] Sala ${code} iniciada: ${rm.host._nick} vs ${ws._nick}`);
    }
    else if(m.type==='launch'){
      const rm=rooms[ws._room]; if(!rm) return;
      const opp=ws._role==='host'?rm.guest:rm.host;
      send(opp,{type:'launch',from:m.from,to:m.to});
      send(opp,{type:'pass_turn'});
    }
    else if(m.type==='pos'){
      const rm=rooms[ws._room]; if(!rm) return;
      const opp=ws._role==='host'?rm.guest:rm.host;
      send(opp,{type:'pos',x:m.x,y:m.y,vx:m.vx,vy:m.vy});
    }
  });
  ws.on('close',()=>{
    const code=ws._room;
    if(!code||!rooms[code]) return;
    const rm=rooms[code];
    const opp=ws._role==='host'?rm.guest:rm.host;
    send(opp,{type:'opponent_disconnected'});
    console.log(`  [-] Sala ${code} encerrada.`);
    delete rooms[code];
  });
});

srv.listen(PORT, ()=>{
  const ips=getIPs();
  const w=50;
  const line='+'+'-'.repeat(w)+'+';
  console.log('\n'+line);
  console.log('|'+' CapRush WebSocket Server v3'.padEnd(w)+'|');
  console.log('|'+('  Porta: '+PORT).padEnd(w)+'|');
  console.log(line);
  if(ips.length===0){
    console.log('|  (apenas localhost — sem rede externa)'.padEnd(w+1)+'|');
  } else {
    ips.forEach(ip=>{
      const url='  http://'+ip+':8080/client/game-multi-online.html';
      console.log('| '+url.substring(0,w-1).padEnd(w-1)+'|');
    });
    console.log(line);
    console.log('|  Compartilhe um dos links acima com o oponente  |');
    console.log('|  (ambos precisam estar na mesma rede Wi-Fi)     |');
  }
  console.log(line+'\n');
});
""")

# ═══════════════════════════════════════════════════════════════
# README.md v3
# ═══════════════════════════════════════════════════════════════
w('README.md', r"""# CapRush — Overdrive! v0.3

Jogo de corrida de tampinhas estilo turno, com física realista, gráficos Canvas 2D e suporte a NFTs Solana (Devnet).

## Novidades v0.3

- **Física corrigida** — arrasto da água e grama estavam invertidos; ricochete em obstáculos usa reflexão vetorial correta
- **Arquibancadas (amarelo)** — visual com torcida animada, ricocheteia com REST=0.72
- **Paddock (laranja)** — visual com boxes e barris; ricocheteia (solo) ou perde rodada (1v1/online)
- **Água orgânica** — poças desenhadas com blob bezier animado, não mais círculos
- **Grama texturizada** — hastes animadas nas zonas de grama
- **i18n** — PT-BR / EN-US / ES com bandeirinhas em todas as páginas
- **Logo** — imagem Whisk_2.png substituindo texto, com brilho metálico no arco vermelho ao hover
- **Personagens manga/anime** — SVGs redesenhados com olhos maiores, highlights, estilo mais expressivo
- **1v1 Local** — colisão cap×cap com troca de momento, painel lateral, stands/paddock ativo
- **Online 1v1** — guia de como jogar, display de IP ao iniciar o servidor

## Estrutura

```
caprush/
├── index.html              ← Landing page (tampinhas flutuantes + logo img)
├── personagens.html        ← Seleção de pilotos (SVGs manga/anime)
├── caprush-game.html       ← Shell iframe → client/game.html
├── manual.html             ← Manual do jogador v0.3
├── arquitetura.html        ← Documentação técnica v0.3
├── ranking.html
├── i18n.js                 ← Sistema de tradução PT/EN/ES
├── Whisk_2.png             ← Logo (coloque na raiz)
├── client/
│   ├── game.html           ← Modo Solo
│   ├── game-multi.html     ← Seletor de modo multiplayer
│   ├── game-multi-local.html   ← 1v1 Local (com painel + cap×cap)
│   ├── game-multi-online.html  ← Lobby Online
│   └── src/
│       ├── core/Physics.js     ← Motor de física v3
│       ├── core/GameLoop.js    ← Loop solo v3
│       ├── scenes/TrackV3.js   ← Pista v3 (stands, paddock, organico)
│       └── ...
└── server/
    └── ws-server.js        ← WebSocket v3 (display IP melhorado)
```

## Desenvolvimento local

```bash
# Servidor estático (qualquer um)
npx serve .
# ou
python -m http.server 8080

# Servidor WebSocket (multiplayer online)
cd server && node ws-server.js
```

## Superfícies v0.3

| Superfície | Efeito       | Visual          |
|------------|--------------|-----------------|
| Asfalto    | Normal       | Marrom          |
| Água       | Freia        | Blob azul orgânico |
| Grama      | Acelera      | Verde com hastes |
| Stands     | Ricocheteia  | Amarelo + torcida |
| Paddock    | Rico. / perde turno | Laranja + boxes |
""")

# ═══════════════════════════════════════════════════════════════
# manual.html v3 — atualizado com fisica, stands, paddock, online
# ═══════════════════════════════════════════════════════════════
w('manual.html', r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush — Manual v0.3</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#08080F;--acc:#00E5FF;--muted:#666680;}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--dark);color:#E8E8F0;font-family:'Rajdhani',sans-serif;min-height:100vh;padding:0;}
nav{display:flex;justify-content:space-between;align-items:center;padding:10px 32px;background:rgba(8,8,18,.97);border-bottom:2px solid var(--red);position:sticky;top:0;z-index:100;}
.nlogo{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:4px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none;}
.tlinks{display:flex;gap:1.2rem;align-items:center;}
.tlinks a{color:var(--muted);font-size:.78rem;letter-spacing:2px;text-decoration:none;text-transform:uppercase;transition:color .2s;}
.tlinks a:hover{color:var(--gold);}
#flag-container{display:flex;gap:4px;}
.main{max-width:820px;margin:0 auto;padding:3rem 2rem 6rem;}
h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,7vw,3.5rem);letter-spacing:5px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:.3rem;}
.version{color:var(--muted);letter-spacing:3px;font-size:.8rem;margin-bottom:3rem;}
h2{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:3px;color:var(--acc);margin:2.5rem 0 1rem;padding-bottom:.4rem;border-bottom:1px solid rgba(0,229,255,.2);}
h3{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:2px;color:var(--gold);margin:1.5rem 0 .6rem;}
p{line-height:1.7;color:#C8C8D8;margin-bottom:1rem;font-size:.95rem;}
.surf-table{width:100%;border-collapse:collapse;margin:1rem 0 1.5rem;font-size:.88rem;}
.surf-table th{text-align:left;padding:.5rem .8rem;background:rgba(255,255,255,.05);font-family:'Bebas Neue',sans-serif;letter-spacing:1px;color:var(--gold);border-bottom:1px solid rgba(255,255,255,.1);}
.surf-table td{padding:.5rem .8rem;border-bottom:1px solid rgba(255,255,255,.05);color:#C8C8D8;}
.surf-table tr:hover td{background:rgba(255,255,255,.03);}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle;}
.tip{background:rgba(0,229,255,.07);border-left:3px solid var(--acc);padding:.8rem 1rem;border-radius:0 6px 6px 0;margin:1rem 0;font-size:.88rem;color:#AAA;}
.cmd{background:#0D0D18;border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:.6rem 1rem;font-family:monospace;font-size:.9rem;color:#00FF88;margin:.5rem 0;}
</style>
</head>
<body>
<nav>
  <a href="index.html" class="nlogo">CAP RUSH</a>
  <div class="tlinks">
    <a href="caprush-game.html">Jogar</a>
    <a href="personagens.html">Pilotos</a>
    <a href="ranking.html">Ranking</a>
    <a href="manual.html" style="color:var(--gold)">Manual</a>
    <a href="arquitetura.html">Arquitetura</a>
    <div id="flag-container"></div>
  </div>
</nav>
<div class="main">
  <h1 data-i18n="man.title">MANUAL DO JOGADOR</h1>
  <p class="version">CapRush — Overdrive! v0.3 &nbsp;|&nbsp; Prototype</p>

  <h2>Mecânica Básica</h2>
  <p>CapRush é um jogo de corrida em turnos. A tampinha (bottle cap) é lançada clicando nela e arrastando para trás — quanto mais você arrastar, maior a força. Solte para lançar. O objetivo é completar as voltas passando pelos checkpoints na ordem certa.</p>
  <p>A seta de mira mostra a direção e a intensidade do lançamento. A barra lateral de <strong>FORÇA</strong> indica a porcentagem de potência.</p>

  <h2>Superfícies v0.3</h2>
  <p>Cada superfície tem efeito diferente no arrasto (desaceleração) da tampinha:</p>
  <table class="surf-table">
    <tr><th>Superfície</th><th>Cor</th><th>Efeito</th><th>Drag mult.</th></tr>
    <tr><td>Asfalto</td><td><span class="dot" style="background:#5C4530"></span>Marrom</td><td>Normal — referência</td><td>1.0×</td></tr>
    <tr><td>Água</td><td><span class="dot" style="background:#00A0FF"></span>Azul orgânico</td><td>Mais atrito — freia mais rápido</td><td>1.95×</td></tr>
    <tr><td>Grama (na pista)</td><td><span class="dot" style="background:#38B838"></span>Verde brilhante</td><td>Menos atrito — desliza e ganha velocidade</td><td>0.42×</td></tr>
    <tr><td>Grama (fora)</td><td><span class="dot" style="background:#0D2B0D"></span>Verde escuro</td><td>Fora da pista — respawn no último CP</td><td>—</td></tr>
    <tr><td>Arquibancadas</td><td><span class="dot" style="background:#FFD700"></span>Amarelo</td><td>Ricocheteia (REST = 0.72)</td><td>—</td></tr>
    <tr><td>Paddock</td><td><span class="dot" style="background:#FF6600"></span>Laranja</td><td>Ricocheteia (REST = 0.60) / Perde turno (1v1)</td><td>—</td></tr>
  </table>
  <div class="tip">💡 Dica: Use a grama estrategicamente para acelerar nas retas e evite a água em curvas onde você precisa de controle.</div>

  <h2>Checkpoints e Voltas</h2>
  <p>Existem 3 checkpoints por volta, indicados por marcadores brancos com tracejado. Eles devem ser ativados <strong>em ordem</strong>. Ao cruzar a linha de largada com todos os CPs ativados, uma nova volta começa. O último checkpoint ativado se torna o ponto de respawn.</p>

  <h2>Arquibancadas (Stands)</h2>
  <p>As áreas amarelas nas bordas direita e inferior da pista são as arquibancadas. Quando a tampinha bate nelas, ricocheteia com restituição de 72%, perdendo menos velocidade do que ao bater em obstáculos. A torcida anima a cada lance.</p>

  <h2>Paddock</h2>
  <p>A área laranja no lado esquerdo é o paddock/boxes. Em modo Solo, a tampinha ricocheteia com restituição de 60%. Em modo 1v1 (local e online), além do ricochete, o jogador perde a próxima rodada.</p>

  <h2>Modo 1v1 Local</h2>
  <p>Dois jogadores se alternam em cada lançamento no mesmo dispositivo. O painel lateral mostra força, status de ambos os pilotos e eventos. Quando as duas tampinhas estão em movimento simultâneo (após ricochete), pode ocorrer colisão com troca de momento. O primeiro a completar as voltas vence.</p>

  <h2>Online 1v1</h2>
  <h3>Como configurar</h3>
  <p>Para jogar online, o host precisa iniciar o servidor WebSocket:</p>
  <div class="cmd">cd server &amp;&amp; node ws-server.js</div>
  <p>O servidor exibirá o IP da máquina e a porta (3001). Ambos os jogadores precisam estar na mesma rede Wi-Fi ou o host precisa expor a porta (ex.: ngrok).</p>
  <p>Com o servidor rodando, acesse a página Online 1v1. O host cria a sala e compartilha o código de 5 letras com o oponente. Quando os dois conectam, o jogo inicia automaticamente.</p>
  <div class="tip">⚠️ O servidor precisa ficar aberto enquanto a partida durar. Fechar o terminal encerra a sala.</div>

  <h2>Ricochete Correto v0.3</h2>
  <p>O ricochete em obstáculos, stands e paddock usa a fórmula de reflexão vetorial correta: <code>v' = (v − 2(v·n)n) × restituição</code>, onde n é o vetor normal da superfície atingida. Isso garante que a direção de saída seja fisicamente precisa, não um hack com a mecânica de lançamento.</p>
</div>
<script src="i18n.js"></script>
</body>
</html>
""")

# ═══════════════════════════════════════════════════════════════
# arquitetura.html — patch das secoes desatualizadas
# ═══════════════════════════════════════════════════════════════
import re

arq_path = os.path.join(ROOT, 'arquitetura.html')
if os.path.exists(arq_path):
    with open(arq_path, 'r', encoding='utf-8') as f:
        arq = f.read()

    # Injeta badge v0.3 no titulo se ainda nao tiver
    if 'v0.3' not in arq:
        arq = arq.replace('v0.2','v0.3',1)

    # Injeta secao de novas features antes de </body>
    novo_bloco = r"""
<section id="v03-delta" style="max-width:900px;margin:3rem auto;padding:0 2rem 4rem;font-family:'Rajdhani',sans-serif;color:#C8C8D8;">
  <h2 style="font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:3px;color:#00E5FF;border-bottom:1px solid rgba(0,229,255,.2);padding-bottom:.4rem;margin-bottom:1rem;">&#9651; Alterações v0.3</h2>
  <h3 style="font-family:'Bebas Neue',sans-serif;color:#FFD700;margin:.8rem 0 .4rem;">Camada i18n</h3>
  <p style="line-height:1.7">Novo arquivo <code>i18n.js</code> implementa tradução PT-BR / EN-US / ES com dicionários estáticos, <code>data-i18n</code> attributes, bandeiras interativas e propagação para iframes via <code>postMessage</code>. Idioma persistido em <code>localStorage</code>.</p>
  <h3 style="font-family:'Bebas Neue',sans-serif;color:#FFD700;margin:.8rem 0 .4rem;">Correções de Física (Physics.js v3)</h3>
  <p style="line-height:1.7"><strong>Bug corrigido:</strong> <code>DRAG_MULT</code> de água e grama estavam invertidos. <code>agua: 1.95</code> (mais atrito, freia) e <code>grama: 0.42</code> (menos atrito, desliza). Adicionados métodos <code>setVel()</code> e <code>bounce(nx,ny,rest)</code> para ricochete via reflexão vetorial correta.</p>
  <h3 style="font-family:'Bebas Neue',sans-serif;color:#FFD700;margin:.8rem 0 .4rem;">TrackV3.js v3 — Novos Elementos Visuais</h3>
  <p style="line-height:1.7">Arquibancadas (standZones) com torcida animada por <code>sin(t)</code>. Paddock com boxes e barris. Poças de água com blob bezier orgânico (<code>drawOrganicPuddle()</code>). Hastes de grama animadas (<code>grassBladesG[]</code>). APIs: <code>checkStands(pos,r)</code>, <code>checkPaddock(pos,r)</code>.</p>
  <h3 style="font-family:'Bebas Neue',sans-serif;color:#FFD700;margin:.8rem 0 .4rem;">GameLoop.js v3</h3>
  <p style="line-height:1.7">Ricochete em obstáculos usa <code>Physics.bounce()</code> (reflexão vetorial) em vez do hack com <code>flick()</code>. Stands: ricochete REST=0.72. Paddock: ricochete REST=0.60.</p>
  <h3 style="font-family:'Bebas Neue',sans-serif;color:#FFD700;margin:.8rem 0 .4rem;">1v1 Local — game-multi-local.html v3</h3>
  <p style="line-height:1.7">Mesmo <code>makePhysics()</code> agora com valores corrigidos. Colisão cap×cap com troca de momento (impulso bilateral simétrico). Painel lateral com força, pilotos, pista e eventos. Stands e paddock ativos com regra de perde-rodada no paddock.</p>
</section>
"""
    arq = arq.replace('</body>', novo_bloco + '</body>', 1)

    with open(arq_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(arq)
    print(f'  [OK]  arquitetura.html (patched)')
else:
    print(f'  [!]  arquitetura.html nao encontrado — pulando patch')

print('\n[v]  Parte 3 concluida.\n')
