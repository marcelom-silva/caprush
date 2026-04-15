# -*- coding: utf-8 -*-
"""
build_v04b_p3.py  --  CapRush Overdrive! v0.4b
Gera: client/game.html  client/game-multi-local.html  manual.html
      arquitetura.html  README.md
"""
import os, sys
if hasattr(sys.stdout,'reconfigure'):
    try: sys.stdout.reconfigure(encoding='utf-8',errors='replace')
    except: pass

ROOT = os.path.dirname(os.path.abspath(__file__))

def w(rel, txt):
    path = os.path.join(ROOT, *rel.replace('/','\\').split('\\'))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path,'w',encoding='utf-8') as f:
        f.write(txt)
    print(f'  [OK]  {rel}')
    print(f'        {path}')

# ─── CSS/JS compartilhado do painel lateral ───────────────────────────────
PANEL_CSS = """
#panel{width:155px;flex-shrink:0;background:var(--panel);border-left:1px solid rgba(255,42,42,.2);display:flex;flex-direction:column;padding:9px;gap:9px;overflow:hidden;}
.pt{font-family:'Bebas Neue',sans-serif;font-size:.88rem;letter-spacing:2px;color:var(--red);border-bottom:1px solid rgba(255,42,42,.25);padding-bottom:3px;display:flex;justify-content:space-between;align-items:center;}
.audio-btns{display:flex;gap:5px;}
.audio-btn{background:rgba(255,42,42,.1);border:1px solid rgba(255,42,42,.3);color:#888;border-radius:3px;font-size:.8rem;padding:1px 5px;cursor:pointer;transition:all .2s;line-height:1;}
.audio-btn:hover{background:rgba(255,42,42,.25);color:#ccc;}
.audio-btn.off{opacity:.35;color:#555;}
#fbg{width:100%;height:90px;background:#1A1A28;border:1px solid #333;border-radius:4px;position:relative;overflow:hidden;}
#force-bar-fill{position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(0deg,var(--red),var(--gold));transition:height .05s;}
#flbl{font-size:.65rem;color:#666680;letter-spacing:1px;text-transform:uppercase;text-align:center;}
#force-value{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;color:var(--gold);text-align:center;}
#cc{background:#1A1A28;border:1px solid rgba(255,42,42,.3);border-radius:6px;padding:7px;text-align:center;}
#cnm{font-family:'Bebas Neue',sans-serif;font-size:.88rem;color:var(--acc);letter-spacing:2px;}
.ar{display:flex;justify-content:space-between;font-size:.65rem;color:#666680;margin-top:2px;}
.av{color:var(--gold);font-weight:700;}
#log-box{flex:1;overflow-y:auto;font-size:.6rem;color:#555570;}
#log-box p{padding:2px 0;border-bottom:1px solid #1A1A28;}
#log-box p.ev{color:var(--gold);}
#surf-legend{font-size:.6rem;color:#666680;margin-top:2px;}
.sl-row{display:flex;align-items:center;gap:4px;margin:2px 0;}
.sl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
"""

PANEL_HTML = """      <div class="pt">
        <span>FORCA</span>
        <div class="audio-btns">
          <button class="audio-btn" id="btn-bgm" onclick="toggleBGM()" title="Musica">&#9836;</button>
          <button class="audio-btn" id="btn-sfx" onclick="toggleSFX()" title="Efeitos">&#9654;&#9654;</button>
        </div>
      </div>
      <div id="flbl">Potencia</div>
      <div id="fbg"><div id="force-bar-fill"></div></div>
      <div id="force-value">0%</div>
      <div class="pt">PILOTO</div>
      <div id="cc">
        <canvas id="capPreview" width="52" height="52" style="border-radius:50%;margin:0 auto 5px;display:block;"></canvas>
        <div id="cnm">YUKI</div>
        <div class="ar"><span>Velocidade</span><span class="av">82</span></div>
        <div class="ar"><span>Controle</span><span class="av">91</span></div>
        <div class="ar"><span>Aerodin.</span><span class="av">75</span></div>
      </div>
      <div class="pt">PISTA</div>
      <div id="surf-legend">
        <div class="sl-row"><div class="sl-dot" style="background:#5C4530;"></div><span>Asfalto (normal)</span></div>
        <div class="sl-row"><div class="sl-dot" style="background:#00A0FF;border:1px solid #00E5FF;"></div><span>Agua (mais aderente)</span></div>
        <div class="sl-row"><div class="sl-dot" style="background:#38B838;border:1px solid #60E060;"></div><span>Grama (desliza mais)</span></div>
        <div class="sl-row"><div class="sl-dot" style="background:#5C3A1A;"></div><span>Obstaculos</span></div>
      </div>
      <div class="pt">EVENTOS</div>
      <div id="log-box"></div>"""

AUDIO_JS = """
function toggleBGM(){
  var on=SoundEngine.toggleBGM();
  document.getElementById('btn-bgm').classList.toggle('off',!on);
}
function toggleSFX(){
  var on=SoundEngine.toggleSFX();
  document.getElementById('btn-sfx').classList.toggle('off',!on);
}
"""

# ─── client/game.html ─────────────────────────────────────────────────────
GAME = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush - Solo</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--panel:rgba(8,8,18,.95);--acc:#00E5FF;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;background:var(--dark);font-family:'Rajdhani',sans-serif;color:#E8E8F0;overflow:hidden;}
#shell{display:flex;flex-direction:column;width:100%;height:100%;}
#hud{display:flex;justify-content:space-between;align-items:center;padding:5px 14px;background:var(--panel);border-bottom:1px solid rgba(255,42,42,.3);flex-shrink:0;height:42px;}
.hlogo{font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:3px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;cursor:pointer;text-decoration:none;}
.hrow{display:flex;gap:1.2rem;}
.hs{text-align:center;}
.hs label{display:block;font-size:.55rem;letter-spacing:2px;color:#666680;text-transform:uppercase;}
.hs span{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;color:var(--gold);}
#wrap{position:relative;flex:1;min-height:0;display:flex;}
#gameCanvas{display:block;flex:1;cursor:crosshair;}
""" + PANEL_CSS + """
#overlay{position:absolute;left:0;top:0;right:155px;bottom:0;background:rgba(0,0,0,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;cursor:pointer;}
#overlay h2{font-family:'Bebas Neue',sans-serif;font-size:2.2rem;letter-spacing:5px;color:var(--gold);text-shadow:0 0 20px rgba(255,215,0,.5);margin-bottom:.5rem;}
#overlay p{color:#AAA;letter-spacing:2px;font-size:.85rem;margin:.2rem 0;}
.pulse{animation:pulse 1.2s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
#btnBack{position:absolute;top:8px;left:8px;z-index:25;background:rgba(255,42,42,.15);border:1px solid var(--red);color:var(--red);font-family:'Rajdhani',sans-serif;font-size:.75rem;letter-spacing:2px;padding:3px 8px;cursor:pointer;border-radius:3px;text-decoration:none;}
#btnBack:hover{background:var(--red);color:#fff;}
#btnMulti{position:absolute;top:8px;right:168px;z-index:25;background:rgba(0,229,255,.15);border:1px solid var(--acc);color:var(--acc);font-family:'Rajdhani',sans-serif;font-size:.75rem;letter-spacing:2px;padding:3px 8px;cursor:pointer;border-radius:3px;text-decoration:none;}
#btnMulti:hover{background:var(--acc);color:#000;}
</style>
</head>
<body>
<div id="shell">
  <div id="hud">
    <a href="../index.html" class="hlogo">CAP RUSH</a>
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
""" + PANEL_HTML + """
    </div>
    <div id="overlay">
      <h2>PRONTO?</h2>
      <p>Clique aqui para comecar</p>
      <p style="font-size:.78rem;color:#666680;margin-top:.4rem">Clique e arraste a tampinha para mirar</p>
      <br>
      <p class="pulse">&#9654; CLIQUE PARA COMECAR</p>
    </div>
    <a href="../index.html" id="btnBack">&larr; LOBBY</a>
    <a href="game-multi.html" id="btnMulti">2P &rarr;</a>
  </div>
</div>
<script src="src/core/Vector2D.js"></script>
<script src="src/core/Physics.js"></script>
<script src="src/core/SoundEngine.js"></script>
<script src="src/core/CapSprite.js"></script>
<script src="src/entities/Yuki.js"></script>
<script src="src/scenes/TrackV3.js"></script>
<script src="src/core/GameLoop.js"></script>
<script>
""" + AUDIO_JS + """
// Preview da tampinha no painel
(function(){
  var cv=document.getElementById('capPreview');
  if(!cv) return;
  var cx=cv.getContext('2d');
  function drawPreview(){
    cx.clearRect(0,0,52,52);
    CapSprite.drawCap(cx,26,26,22,'#00E5FF','#00A5C8','\\u96EA',Date.now()*0.001,0,0.5);
    requestAnimationFrame(drawPreview);
  }
  requestAnimationFrame(drawPreview);
})();

// Patch: startGame deve chamar BGM automaticamente
// (GameLoop.js ja chama SoundEngine.resume; aqui garantimos o BGM)
var _origOverlayClick = null;
document.addEventListener('DOMContentLoaded', function(){
  SoundEngine.init();
  var overlay = document.getElementById('overlay');
  if(overlay){
    overlay.addEventListener('click', function(){
      SoundEngine.resume();
      SoundEngine.startBGM();
    }, {once:true});
  }
});
</script>
</body>
</html>
"""

# ─── client/game-multi-local.html ─────────────────────────────────────────
# Le o arquivo atual e injeta painel lateral + audio
def build_multi_local():
    # Construir completo do zero com o painel lateral
    html = """<!DOCTYPE html>
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
""" + PANEL_CSS + """
/* Override do painel para multiplayer: mostrar turno ativo */
#mp-turn{font-size:.65rem;letter-spacing:1px;text-transform:uppercase;color:#888;text-align:center;margin-top:2px;}
#mp-p1-info, #mp-p2-info{padding:4px 0;border-bottom:1px solid #1A1A28;font-size:.65rem;}
#turn-banner{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  font-family:'Bebas Neue',sans-serif;font-size:2.5rem;letter-spacing:6px;
  pointer-events:none;opacity:0;transition:opacity .3s;z-index:15;
  text-shadow:0 0 30px currentColor;}
#overlay{position:absolute;left:0;top:0;right:155px;bottom:0;background:rgba(0,0,0,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;cursor:pointer;}
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
    <div id="panel">
      <div class="pt">
        <span>TURNO</span>
        <div class="audio-btns">
          <button class="audio-btn" id="btn-bgm" onclick="toggleBGM()" title="Musica">&#9836;</button>
          <button class="audio-btn" id="btn-sfx" onclick="toggleSFX()" title="Efeitos">&#9654;&#9654;</button>
        </div>
      </div>
      <div id="mp-turn">AGUARDANDO...</div>
      <div class="pt" style="margin-top:4px">FORCA</div>
      <div id="flbl">Potencia</div>
      <div id="fbg"><div id="force-bar-fill"></div></div>
      <div id="force-value">0%</div>
      <div class="pt">PLACAR</div>
      <div id="mp-p1-info" style="color:var(--acc)">YUKI: V1 CP0</div>
      <div id="mp-p2-info" style="color:var(--p2)">KENTA: V1 CP0</div>
      <div class="pt">PISTA</div>
      <div id="surf-legend">
        <div class="sl-row"><div class="sl-dot" style="background:#5C4530;"></div><span>Asfalto</span></div>
        <div class="sl-row"><div class="sl-dot" style="background:#00A0FF;border:1px solid #00E5FF;"></div><span>Agua</span></div>
        <div class="sl-row"><div class="sl-dot" style="background:#38B838;border:1px solid #60E060;"></div><span>Grama</span></div>
      </div>
      <div class="pt">EVENTOS</div>
      <div id="log-box"></div>
    </div>
    <div id="turn-banner">TURNO YUKI</div>
    <div id="overlay">
      <h2>1v1 LOCAL</h2>
      <p style="color:var(--acc)">YUKI (Azul) vs KENTA (Laranja)</p>
      <p>Jogadores se alternam em cada lancamento</p>
      <p style="font-size:.77rem;color:#555;margin-top:.4rem">Clique e arraste a tampinha ATIVA para mirar</p>
      <br>
      <p class="pulse">&#9654; CLIQUE PARA COMECAR</p>
    </div>
    <a href="game-multi.html" id="btnBack">&larr; MODOS</a>
  </div>
</div>

<script src="src/core/Vector2D.js"></script>
<script src="src/core/SoundEngine.js"></script>
<script src="src/core/CapSprite.js"></script>
<script src="src/scenes/TrackV3.js"></script>
<script>
""" + AUDIO_JS + """
function logEv(msg){ var lb=document.getElementById('log-box'); if(!lb)return; var p=document.createElement('p'); p.className='ev'; p.textContent=msg; lb.insertBefore(p,lb.firstChild); if(lb.children.length>12) lb.removeChild(lb.lastChild); }
function updPanel(){ if(P){ var p0=P[0],p1=P[1]; document.getElementById('mp-p1-info').textContent='YUKI: V'+p0.lap+' CP'+p0.cp; document.getElementById('mp-p2-info').textContent='KENTA: V'+p1.lap+' CP'+p1.cp; if(phase==='AIM'){ document.getElementById('mp-turn').textContent='VEZ DE '+P[cur].name; document.getElementById('force-value').textContent='0%'; document.getElementById('force-bar-fill').style.height='0%'; } } }

// ── Motor fisico independente ─────────────────────────────────────────────
function makePhysics(){
  var BASE_DRAG=1.8,MAX_PX=165,MAX_SPD=620,REST=0.65,MIN=6;
  var DRAG_MULT={asfalto:1.0,agua:0.55,grama:1.35};
  var s={pos:new Vector2D(0,0),vel:new Vector2D(0,0),moving:false,surf:'asfalto'};
  return {
    reset:function(x,y,sf){ s.pos=new Vector2D(x,y);s.vel=new Vector2D(0,0);s.moving=false;s.surf=sf||'asfalto'; },
    setSurface:function(sf){ s.surf=sf||'asfalto'; },
    flick:function(from,to,mult){
      var d=from.sub(to),len=Math.min(d.magnitude(),MAX_PX),t=len/MAX_PX;
      s.vel=d.normalize().scale(t*MAX_SPD*(mult||1));s.moving=true;
      var pct=Math.round(t*100);
      document.getElementById('force-value').textContent=pct+'%';
      document.getElementById('force-bar-fill').style.height=pct+'%';
      return{forcePct:pct};
    },
    step:function(dt,b){
      if(!s.moving) return this.snap();
      var dc=BASE_DRAG*(DRAG_MULT[s.surf]||1),spd=s.vel.magnitude();
      var ns=Math.max(0,spd-dc*spd*dt);
      if(ns<MIN){s.vel=new Vector2D(0,0);s.moving=false;return this.snap();}
      s.vel=s.vel.normalize().scale(ns);
      s.pos=s.pos.add(s.vel.scale(dt));
      var r=14;
      if(s.pos.x-r<b.x){s.pos.x=b.x+r;s.vel.x=Math.abs(s.vel.x)*REST;}
      if(s.pos.x+r>b.x+b.w){s.pos.x=b.x+b.w-r;s.vel.x=-Math.abs(s.vel.x)*REST;}
      if(s.pos.y-r<b.y){s.pos.y=b.y+r;s.vel.y=Math.abs(s.vel.y)*REST;}
      if(s.pos.y+r>b.y+b.h){s.pos.y=b.y+b.h-r;s.vel.y=-Math.abs(s.vel.y)*REST;}
      return this.snap();
    },
    snap:function(){ return{pos:s.pos.clone(),vel:s.vel.clone(),speed:s.vel.magnitude(),moving:s.moving}; },
    get pos(){ return s.pos.clone(); },
    MAX_PX:MAX_PX
  };
}
function cloneCPs(master){ return master.map(function(c){ return{x:c.x,y:c.y,r:c.r,lbl:c.lbl,ok:false}; }); }

// Setup
SoundEngine.init();
var canvas=document.getElementById('gameCanvas');
var ctx=canvas.getContext('2d');
var overlay=document.getElementById('overlay');
var tb=document.getElementById('turn-banner');
var LAPS=2,NCPS=3,CAP_R=16;

var P=[
  {id:0,name:'YUKI', color:'#00E5FF',accent:'#00A5C8',kanji:'\\u96EA', phys:makePhysics(),cps:null,lap:1,cp:0,t0:0,elapsed:0,finished:false,respawn:null,anim:{rot:0,glow:0,gdir:1,trail:[]}},
  {id:1,name:'KENTA',color:'#FF9900',accent:'#CC7700',kanji:'\\u9B54', phys:makePhysics(),cps:null,lap:1,cp:0,t0:0,elapsed:0,finished:false,respawn:null,anim:{rot:0,glow:0,gdir:1,trail:[]}},
];
var cur=0,phase='WAIT';
var ds=null,dc=null;
var sndT={water:0,grass:0};

function resize(){
  var wrap=canvas.parentElement;
  // subtrair largura do painel lateral
  canvas.width=wrap.offsetWidth-155;
  canvas.height=wrap.offsetHeight||400;
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
  SoundEngine.startBGM();
  overlay.style.display='none';
  phase='AIM';
  if(canvas.width<50){resize();}
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
  updPanel();
  logEv('Vez de '+p.name);
}

function cpos(e){var r=canvas.getBoundingClientRect();return new Vector2D(e.clientX-r.left,e.clientY-r.top);}
function bnd(){return{x:0,y:0,w:canvas.width,h:canvas.height};}
function nearActive(pt){ var ph=P[cur].phys.snap(); return pt.distanceTo(ph.pos)<52; }

canvas.addEventListener('mousedown',function(e){ if(phase!=='AIM')return;SoundEngine.resume(); if(nearActive(cpos(e))){ds=cpos(e);dc=cpos(e);} });
canvas.addEventListener('mousemove',function(e){if(!ds)return;dc=cpos(e);});
canvas.addEventListener('mouseup',function(e){ if(!ds||phase!=='AIM')return; doFlick(cpos(e)); });
canvas.addEventListener('touchstart',function(e){ if(phase!=='AIM')return;SoundEngine.resume(); if(nearActive(cpos(e.touches[0]))){ds=cpos(e.touches[0]);dc=cpos(e.touches[0]);}},{passive:true});
canvas.addEventListener('touchmove',function(e){e.preventDefault();if(!ds)return;dc=cpos(e.touches[0]);},{passive:false});
canvas.addEventListener('touchend',function(e){if(!ds||phase!=='AIM')return;doFlick(cpos(e.changedTouches[0]));},{passive:true});

function doFlick(rel){
  P[cur].phys.flick(ds,rel,1.0);
  if(!P[cur].t0) P[cur].t0=performance.now();
  ds=null;dc=null;phase='MOVING';
}

var lt=0,animT=0;
function loop(now){
  var dt=Math.min((now-lt)/1000,.05); lt=now; animT+=dt;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  TrackV3.render(ctx,canvas.width,canvas.height,animT);

  if(phase==='MOVING'){
    var p=P[cur];
    var ph=p.phys.step(dt,bnd());
    var obs=TrackV3.checkObstacles(ph.pos,CAP_R);
    if(obs){
      var dot=ph.vel.x*obs.nx+ph.vel.y*obs.ny;
      var nvx=(ph.vel.x-2*dot*obs.nx)*.78, nvy=(ph.vel.y-2*dot*obs.ny)*.78;
      p.phys.reset(ph.pos.x,ph.pos.y,'asfalto');
      var tf=new Vector2D(ph.pos.x-nvx*.05,ph.pos.y-nvy*.05);
      var tt=new Vector2D(ph.pos.x+nvx*.05,ph.pos.y+nvy*.05);
      p.phys.flick(tf,tt,1); SoundEngine.hit(); ph=p.phys.snap();
    }
    if(TrackV3.isOnTrack(ph.pos)){
      var n2=Date.now();
      if(TrackV3.detectPuddle(ph.pos)){ p.phys.setSurface('agua'); if(n2-sndT.water>700){SoundEngine.splash();sndT.water=n2;} }
      else if(TrackV3.detectGrassOnTrack(ph.pos)){ p.phys.setSurface('grama'); if(n2-sndT.grass>900){SoundEngine.grass();sndT.grass=n2;} }
      else { p.phys.setSurface('asfalto'); }
    } else {
      if(TrackV3.detectInner(ph.pos)){ var rp=p.respawn||TrackV3.getStartPos(); p.phys.reset(rp.x,rp.y,'asfalto'); ph=p.phys.snap(); }
    }
    for(var ci=0;ci<p.cps.length;ci++){
      var c=p.cps[ci]; if(c.ok) continue;
      var dx=ph.pos.x-c.x,dy=ph.pos.y-c.y;
      if(Math.sqrt(dx*dx+dy*dy)<c.r){ c.ok=true; p.cp++; p.respawn={x:c.x,y:c.y}; SoundEngine.checkpoint(); logEv(p.name+' CP'+p.cp); document.getElementById('p'+p.id+'-lap').textContent='V'+p.lap+'/'+LAPS+' CP'+p.cp+'/'+NCPS; updPanel(); }
    }
    if(p.cp>=NCPS&&TrackV3.checkLap(ph.pos)){
      p.cp=0; p.cps=cloneCPs(TrackV3.checkpoints);
      if(p.lap>=LAPS){ p.finished=true; p.elapsed=(performance.now()-p.t0)/1000; SoundEngine.victory(); logEv(p.name+' VENCEU!'); onWin(p); return; }
      else { p.lap++; logEv(p.name+' volta '+p.lap); }
      document.getElementById('p'+p.id+'-lap').textContent='V'+p.lap+'/'+LAPS+' CP0/'+NCPS;
    }
    p.elapsed=(performance.now()-p.t0)/1000;
    document.getElementById('p'+p.id+'-time').textContent=fmt(p.elapsed);
    if(!ph.moving){ phase='AIM'; var other=P[1-cur]; if(!other.finished){ cur=1-cur; showTurn(); } }
  }

  P.forEach(function(p){
    var ph=p.phys.snap(), spd=ph.speed;
    p.anim.rot+=spd*dt*.006;
    p.anim.glow+=.03*p.anim.gdir; if(p.anim.glow>=1||p.anim.glow<=0) p.anim.gdir*=-1;
    p.anim.trail.push({x:ph.pos.x,y:ph.pos.y});
    if(p.anim.trail.length>20) p.anim.trail.shift();
    CapSprite.drawTrail(ctx,p.anim.trail,p.color,spd);
    CapSprite.drawCap(ctx,ph.pos.x,ph.pos.y,16,p.color,p.accent,p.kanji,p.anim.rot,spd,p.anim.glow);
    if(P[cur]===p&&phase==='AIM'){
      ctx.save();ctx.strokeStyle=p.color;ctx.lineWidth=2;
      var pulse=Math.sin(Date.now()*.004)*4;
      ctx.beginPath();ctx.arc(ph.pos.x,ph.pos.y,23+pulse,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
  });

  if(ds&&dc){
    var ap=P[cur].phys.snap();
    var dir=ap.pos.sub(dc).normalize();
    var dist=Math.min(ap.pos.distanceTo(dc),165);
    var end=ap.pos.add(dir.scale(dist*1.8));
    var pct=dist/165;
    ctx.save();
    var g=ctx.createLinearGradient(ap.pos.x,ap.pos.y,end.x,end.y);
    g.addColorStop(0,P[cur].color);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.strokeStyle=g;ctx.lineWidth=2+pct*2;ctx.setLineDash([7,5]);
    ctx.beginPath();ctx.moveTo(ap.pos.x,ap.pos.y);ctx.lineTo(end.x,end.y);ctx.stroke();
    ctx.setLineDash([]);ctx.restore();
  }

  requestAnimationFrame(loop);
}

function onWin(p){
  setTimeout(function(){
    overlay.innerHTML='<h2 style="color:'+p.color+'">'+p.name+' VENCEU!</h2>'
      +'<p style="color:'+p.color+';font-size:2rem;font-family:Bebas Neue,sans-serif">'+fmt(p.elapsed)+'</p>'
      +'<p style="color:#aaa;margin-top:.5rem">Clique para jogar novamente</p>';
    overlay.style.display='flex';
    overlay.style.right='155px';
    overlay.onclick=function(){location.reload();};
  },1400);
}
function fmt(s){var m=Math.floor(s/60),ss=(s%60).toFixed(1);return(m<10?'0':'')+m+':'+(parseFloat(ss)<10?'0':'')+ss;}
requestAnimationFrame(function(t){lt=t;requestAnimationFrame(loop);});
</script>
</body>
</html>"""
    return html

# ─── manual.html ──────────────────────────────────────────────────────────
MANUAL = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush - Manual</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--acc:#00E5FF;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:var(--dark);color:#E8E8F0;font-family:'Rajdhani',sans-serif;min-height:100%;}
nav{display:flex;align-items:center;padding:12px 24px;background:rgba(5,5,12,.95);border-bottom:1px solid rgba(255,42,42,.25);gap:1.4rem;position:sticky;top:0;z-index:50;}
.nav-logo{font-family:'Bebas Neue',sans-serif;font-size:1.35rem;letter-spacing:4px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none;white-space:nowrap;margin-right:.4rem;}
.nav-link{color:#AAA;text-decoration:none;font-size:.9rem;letter-spacing:2px;text-transform:uppercase;transition:color .2s;white-space:nowrap;}
.nav-link:hover,.nav-link.active{color:var(--gold);}
#flag-container{display:flex;gap:6px;margin-left:auto;}
.flag-btn{background:none;border:1px solid transparent;border-radius:4px;padding:2px;cursor:pointer;opacity:.6;transition:opacity .2s,border-color .2s;}
.flag-btn:hover,.flag-btn.flag-active{opacity:1;border-color:rgba(255,215,0,.5);}
.content{max-width:780px;margin:0 auto;padding:40px 24px 80px;}
h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,6vw,3.5rem);letter-spacing:5px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px;}
h2{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:3px;color:var(--gold);border-bottom:1px solid rgba(255,215,0,.2);padding-bottom:4px;margin:32px 0 12px;}
h3{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:2px;color:var(--acc);margin:18px 0 8px;}
p{font-size:.95rem;line-height:1.7;color:#C8C8D8;margin-bottom:10px;}
.tip{background:rgba(0,229,255,.06);border-left:3px solid var(--acc);padding:10px 14px;border-radius:0 6px 6px 0;margin:14px 0;font-size:.88rem;color:#A0C8D8;}
.warn{background:rgba(255,42,42,.06);border-left:3px solid var(--red);padding:10px 14px;border-radius:0 6px 6px 0;margin:14px 0;font-size:.88rem;color:#D8A0A0;}
.step{display:flex;gap:14px;margin:10px 0;align-items:flex-start;}
.step-num{font-family:'Bebas Neue',sans-serif;font-size:1.6rem;color:var(--gold);min-width:32px;line-height:1;}
.step-txt{font-size:.92rem;line-height:1.6;color:#C8C8D8;padding-top:4px;}
.surf-table{width:100%;border-collapse:collapse;margin:14px 0;font-size:.88rem;}
.surf-table th{background:rgba(255,42,42,.1);padding:6px 10px;text-align:left;letter-spacing:1px;color:var(--red);}
.surf-table td{padding:6px 10px;border-bottom:1px solid rgba(255,255,255,.05);color:#C0C0D0;}
.surf-table tr:last-child td{border:none;}
.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle;}
</style>
</head>
<body>
<nav>
  <a href="index.html" class="nav-logo">CAP RUSH</a>
  <a id="nav-jogar"   href="caprush-game.html" class="nav-link">JOGAR</a>
  <a id="nav-pilotos" href="personagens.html"   class="nav-link">PILOTOS</a>
  <a id="nav-ranking" href="ranking.html"        class="nav-link">RANKING</a>
  <a id="nav-manual"  href="manual.html"         class="nav-link active">MANUAL</a>
  <div id="flag-container"></div>
</nav>
<div class="content">
  <h1 id="manual-title">MANUAL DO JOGADOR</h1>
  <p>Bem-vindo ao CapRush Overdrive! &mdash; o jogo de corrida de tampinhas mais eletrizante do universo digital. Esta pagina explica como jogar, dominar a pista e vencer seus oponentes.</p>

  <h2>COMO JOGAR</h2>
  <p>O controle e simples: clique e arraste para mirar, solte para lancar. A forca do lancamento depende de quanto voce puxou.</p>
  <div class="step"><span class="step-num">1</span><div class="step-txt"><strong>Clique sobre a sua tampinha</strong> &mdash; um circulo pulsante indica qual e a sua.</div></div>
  <div class="step"><span class="step-num">2</span><div class="step-txt"><strong>Arraste para tras</strong> em relacao ao destino. Quanto mais longe arrastar, mais forca.</div></div>
  <div class="step"><span class="step-num">3</span><div class="step-txt"><strong>Solte o mouse</strong> para disparar. A tampinha parte na direcao oposta ao arrasto.</div></div>
  <div class="step"><span class="step-num">4</span><div class="step-txt"><strong>Passe pelos Checkpoints</strong> em ordem (CP1 &rarr; CP2 &rarr; CP3) e cruze a linha Start/Finish para completar uma volta.</div></div>

  <div class="tip">&#9432; A barra de Forca no painel direito mostra a potencia atual do lancamento em tempo real.</div>

  <h2>SUPERFICIES DA PISTA</h2>
  <table class="surf-table">
    <tr><th>Superficie</th><th>Efeito</th><th>Dica</th></tr>
    <tr><td><span class="dot" style="background:#5C4530"></span>Asfalto</td><td>Normal, sem bonus/penalidade</td><td>Linha ideal de corrida</td></tr>
    <tr><td><span class="dot" style="background:#00A0FF;border:1px solid #00E5FF"></span>Agua</td><td>Mais aderencia, desacelera menos</td><td>Use para curvas fechadas</td></tr>
    <tr><td><span class="dot" style="background:#38B838;border:1px solid #60E060"></span>Grama</td><td>Menos aderencia, desliza mais</td><td>Evite ou use para desviar</td></tr>
    <tr><td><span class="dot" style="background:#5C3A1A"></span>Obstaculos</td><td>Reflete a tampinha</td><td>Podem ser usados estrategicamente</td></tr>
  </table>

  <h2>MODOS DE JOGO</h2>
  <h3>SOLO</h3>
  <p>Corra contra o tempo. Complete 2 voltas no menor tempo possivel. Seu melhor tempo e exibido no HUD.</p>
  <h3>1v1 LOCAL</h3>
  <p>Dois jogadores se alternam em um mesmo computador. YUKI (azul) e KENTA (laranja) disputam quem completa 2 voltas primeiro. Cada jogador tem seu proprio tempo de reacao &mdash; vence quem usa menos lancamentos.</p>
  <h3>ONLINE (Beta)</h3>
  <p>Desafie amigos via internet usando WebRTC (PeerJS). Um jogador cria a sala e compartilha o codigo; o outro entra. Nao e necessario servidor proprio &mdash; a conexao e ponto a ponto.</p>
  <div class="tip">&#9432; Se o jogo estiver publicado no Vercel ou GitHub Pages, qualquer pessoa com o link pode entrar e jogar sem configuracao adicional.</div>

  <h2>MUSICA E EFEITOS</h2>
  <p>O botao <strong>&#9836;</strong> no painel lateral liga/desliga a musica de fundo. O botao <strong>&#9654;&#9654;</strong> controla os efeitos sonoros. A musica inicia automaticamente quando a corrida comeca.</p>
  <div class="warn">&#9888; Alguns navegadores bloqueiam audio automatico. Se a musica nao tocar, clique dentro do jogo para ativar o contexto de audio.</div>

  <h2>PILOTOS</h2>
  <p>Cada piloto tem tres atributos que afetam o comportamento da tampinha na pista. Visite a pagina <a href="personagens.html" style="color:var(--acc)">PILOTOS</a> para conhecer cada um.</p>

  <h2>DICAS AVANCADAS</h2>
  <p>Use as bordas da pista como guia. Tampinhas que saem da pista sao teleportadas para o ultimo checkpoint visitado. Planejar a trajetoria com menos lancamentos e mais eficiente que usar forca maxima sempre.</p>
</div>
<script src="i18n.js"></script>
</body>
</html>
"""

# ─── arquitetura.html ─────────────────────────────────────────────────────
ARQT = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush - Arquitetura</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--acc:#00E5FF;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:var(--dark);color:#E8E8F0;font-family:'Rajdhani',sans-serif;min-height:100%;}
nav{display:flex;align-items:center;padding:12px 24px;background:rgba(5,5,12,.95);border-bottom:1px solid rgba(255,42,42,.25);gap:1.4rem;position:sticky;top:0;z-index:50;}
.nav-logo{font-family:'Bebas Neue',sans-serif;font-size:1.35rem;letter-spacing:4px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none;white-space:nowrap;margin-right:.4rem;}
.nav-link{color:#AAA;text-decoration:none;font-size:.9rem;letter-spacing:2px;text-transform:uppercase;transition:color .2s;white-space:nowrap;}
.nav-link:hover{color:var(--gold);}
#flag-container{display:flex;gap:6px;margin-left:auto;}
.flag-btn{background:none;border:1px solid transparent;border-radius:4px;padding:2px;cursor:pointer;opacity:.6;transition:opacity .2s,border-color .2s;}
.flag-btn:hover,.flag-btn.flag-active{opacity:1;border-color:rgba(255,215,0,.5);}
.content{max-width:820px;margin:0 auto;padding:40px 24px 80px;}
h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,6vw,3.5rem);letter-spacing:5px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px;}
h2{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:3px;color:var(--gold);border-bottom:1px solid rgba(255,215,0,.2);padding-bottom:4px;margin:32px 0 12px;}
h3{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:2px;color:var(--acc);margin:18px 0 8px;}
p{font-size:.95rem;line-height:1.7;color:#C8C8D8;margin-bottom:10px;}
code{background:rgba(255,255,255,.06);padding:2px 6px;border-radius:3px;font-family:monospace;font-size:.85rem;color:#AAD8FF;}
pre{background:rgba(5,5,20,.8);border:1px solid rgba(255,255,255,.08);border-radius:8px;padding:16px;overflow-x:auto;margin:14px 0;}
pre code{background:none;padding:0;font-size:.82rem;color:#90C8FF;}
.badge{display:inline-block;font-size:.65rem;letter-spacing:1px;padding:2px 8px;border-radius:10px;border:1px solid;margin-left:8px;vertical-align:middle;}
.badge-new{color:#00FF88;border-color:#00FF88;background:rgba(0,255,136,.06);}
.badge-fix{color:#FFD700;border-color:#FFD700;background:rgba(255,215,0,.06);}
</style>
</head>
<body>
<nav>
  <a href="index.html" class="nav-logo">CAP RUSH</a>
  <a id="nav-jogar"   href="caprush-game.html" class="nav-link">JOGAR</a>
  <a id="nav-pilotos" href="personagens.html"   class="nav-link">PILOTOS</a>
  <a id="nav-ranking" href="ranking.html"        class="nav-link">RANKING</a>
  <a id="nav-manual"  href="manual.html"         class="nav-link">MANUAL</a>
  <div id="flag-container"></div>
</nav>
<div class="content">
  <h1 id="arch-title">ARQUITETURA v0.4b</h1>
  <p>Documentacao tecnica do CapRush Overdrive! &mdash; Fase 1 (Prototipo Jogavel).</p>

  <h2>ESTRUTURA DE ARQUIVOS</h2>
  <pre><code>caprush/                       (raiz do projeto)
  index.html                   Landing page com logo + botoes orbitais
  personagens.html             Galeria de pilotos (SVG + atributos)
  manual.html                  Manual do jogador (multilingual)
  arquitetura.html             Esta pagina
  ranking.html                 Ranking global
  caprush-game.html            Wrapper iframe -> client/game.html
  i18n.js                      Internacionalizacao PT/EN/ES
  Whisk_2.png                  Logo oficial

  client/
    game.html                  Modo Solo (1 jogador)
    game-multi.html            Menu de modos multiplayer
    game-multi-local.html      1v1 Local (mesma maquina, turnos)
    game-multi-online.html     1v1 Online (PeerJS WebRTC - Beta)
    src/
      core/
        Vector2D.js            Vetores 2D imutaveis
        Physics.js             Motor de fisica (drag, bounce)
        SoundEngine.js         Audio procedural + BGM (v4b: session-ID)
        CapSprite.js           Renderizador da tampinha
        GameLoop.js            Loop de jogo solo
      scenes/
        TrackV3.js             Pista, checkpoints, superficies (v4b)</code></pre>

  <h2>MUDANCAS v0.4b <span class="badge badge-fix">HOTFIX</span></h2>

  <h3>TrackV3.js &mdash; Start/Finish</h3>
  <p>O <code>startRect</code> era um quadrado <code>TW x TW</code> que bloqueava toda a borda esquerda da pista. Corrigido para uma faixa fina de <code>14px</code> de altura, sem colisao fisica. Tampinhas passam livremente.</p>

  <h3>TrackV3.js &mdash; Pocas de Agua</h3>
  <p>As duas pocas foram reposicionadas para dentro da faixa da pista: Poca 1 no cotovelo do chicane (V-apex, proximo ao CP1) e Poca 2 na reta direita (ao lado do CP2).</p>

  <h3>TrackV3.js &mdash; Spawn da Tampinha</h3>
  <p><code>getStartPos()</code> agora retorna <code>{x: m, y: CH*0.54}</code>, colocando a tampinha dentro da pista, abaixo da linha de largada, pronta para cruzar no sentido correto.</p>

  <h3>SoundEngine.js &mdash; BGM Session-ID</h3>
  <p>Cada chamada a <code>startBGM()</code> ou <code>stopBGM()</code> incrementa um <code>_session</code> counter. O callback do loop de audio verifica se a sessao ainda e valida antes de agendar o proximo beat &mdash; eliminando o overlap ao fazer toggle rapido.</p>

  <h3>Painel Lateral no Multiplayer</h3>
  <p><code>game-multi-local.html</code> agora inclui o mesmo painel lateral do modo Solo: barra de forca, placar por jogador, legenda de superficies, log de eventos e botoes de audio.</p>

  <h3>BGM Auto-Start</h3>
  <p>Em todos os modos, <code>SoundEngine.startBGM()</code> e chamado automaticamente quando o jogador clica para comecar. Nao e mais necessario pressionar o botao de musica manualmente.</p>

  <h3>i18n.js &mdash; Flags</h3>
  <p>O injetor de bandeiras agora verifica se <code>#flag-container</code> ja possui filhos antes de injetar. Elimina a duplicacao de botoes de idioma.</p>

  <h2>TECNOLOGIAS</h2>
  <p>Canvas 2D API, Web Audio API, PeerJS (WebRTC), Vercel para deploy. Sem dependencias externas de runtime &mdash; JavaScript puro.</p>

  <h2>MULTIPLAYER ONLINE</h2>
  <p>Usa PeerJS como camada de sinalizacao WebRTC. Com o jogo publicado em URL publica (Vercel), qualquer jogador no mundo pode entrar com o link e jogar diretamente no navegador. Nao e necessario servidor proprio.</p>
</div>
<script src="i18n.js"></script>
</body>
</html>
"""

# ─── README.md ────────────────────────────────────────────────────────────
README = """# CapRush — Overdrive! v0.4b

Jogo de corrida de tampinhas (bottle caps) para 1-4 jogadores.
Canvas 2D, Web Audio API, PeerJS WebRTC online.

## Estrutura

```
caprush/                     <- RAIZ do projeto (servir daqui)
  index.html                 <- Landing page
  personagens.html           <- Galeria de pilotos
  manual.html                <- Manual do jogador (PT/EN/ES)
  arquitetura.html           <- Documentacao tecnica
  ranking.html               <- Ranking
  caprush-game.html          <- Wrapper -> client/game.html
  i18n.js                    <- Internacionalizacao
  Whisk_2.png                <- Logo

  client/
    game.html                <- Solo
    game-multi.html          <- Menu modos
    game-multi-local.html    <- 1v1 Local (turnos)
    game-multi-online.html   <- 1v1 Online (PeerJS - Beta)
    src/core/                <- Motor: Vector2D, Physics, SoundEngine, CapSprite, GameLoop
    src/scenes/TrackV3.js    <- Pista v4b
```

## Como rodar localmente

```bash
# Python 3
python -m http.server 8080
# Acessar: http://localhost:8080/index.html
```

## Builders v0.4b

Execute na raiz do projeto:

```bash
python build_v04b_p1.py   # index.html + i18n.js + personagens.html
python build_v04b_p2.py   # SoundEngine.js + TrackV3.js
python build_v04b_p3.py   # game.html + game-multi-local.html + manual.html + arquitetura.html
# OU tudo de uma vez:
python builder_v04b_run.py
```

## Mudancas v0.4b

- **Start/Finish**: Faixa fina (14px), sem bloqueio fisico. Tampinhas passam livremente.
- **Pocas**: Reposicionadas dentro da pista (cotovelo do chicane + reta direita).
- **BGM**: Inicia automaticamente. Sem overlap ao toggle rapido (session-ID).
- **Painel lateral**: Incluido no modo 1v1 Local.
- **i18n.js**: Flags sem duplicacao.

## Deploy (Vercel)

Conecte o repositorio GitHub ao Vercel. O `vercel.json` ja esta configurado.
Com URL publica, qualquer pessoa pode jogar online sem configuracao.

## Fase 1 — Prototipo Jogavel

- [x] Motor de fisica (drag, bounce, superficies)
- [x] Pista procedural (TrackV3) com checkpoints, pocas, grama
- [x] Modo Solo com timer e voltas
- [x] Modo 1v1 Local (turnos alternados)
- [x] Modo Online Beta (PeerJS WebRTC)
- [x] Audio procedural + BGM 148 BPM
- [x] 4 pilotos com SVG + atributos
- [x] Internacionalizacao PT/EN/ES
"""

print("\n=== build_v04b_p3.py  --  CapRush Overdrive! v0.4b ===\n")
w('client/game.html', GAME)
w('client/game-multi-local.html', build_multi_local())
w('manual.html', MANUAL)
w('arquitetura.html', ARQT)
w('README.md', README)
print("\n[CONCLUIDO] Part 3: game.html + game-multi-local.html + manual.html + arquitetura.html + README.md\n")
