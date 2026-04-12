"""
builder_track.py
================
CapRush – Pista reformulada + sons + multiplayer + zonas especiais
Gera:
  client/game.html                 – jogo solo atualizado
  client/game-multi.html           – modo multiplayer 1v1
  client/src/scenes/TrackV2.js     – pista nova com todos os elementos
  client/src/core/SoundEngine.js   – sons via Web Audio API
  client/src/core/GameLoop.js      – loop atualizado
  caprush-game.html                – frame atualizado

Execute: python builder_track.py
"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))
def w(rel, txt):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f: f.write(txt)
    print("  OK  " + rel)

# ──────────────────────────────────────────────
# SOUND ENGINE  (Web Audio API – sem arquivos externos)
# ──────────────────────────────────────────────
SOUND_ENGINE = r"""// SoundEngine.js – sons procedurais via Web Audio API
var SoundEngine = (function(){
  var ctx = null;
  function init(){
    if(ctx) return;
    try{ ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){}
  }
  function resume(){ if(ctx && ctx.state==='suspended') ctx.resume(); }

  // Tom curto tipo beep
  function beep(freq, dur, vol, type){
    if(!ctx) return;
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type||'square'; o.frequency.value=freq||880;
    g.gain.setValueAtTime(vol||0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+(dur||0.12));
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime+(dur||0.12));
  }

  // Checkpoint: bip duplo ascendente (River Raid style)
  function checkpoint(){
    if(!ctx) return;
    beep(660,0.08,0.4,'square');
    setTimeout(function(){ beep(880,0.1,0.4,'square'); },90);
  }

  // Batida em obstáculo: ruído/crash curto
  function hit(){
    if(!ctx) return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*0.15,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
    var s=ctx.createBufferSource(), g=ctx.createGain();
    g.gain.value=0.5; s.buffer=buf;
    s.connect(g); g.connect(ctx.destination); s.start();
  }

  // Água: salpico (noise rápido filtrado)
  function splash(){
    if(!ctx) return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*0.2,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.3*Math.pow(1-i/d.length,1.5);
    var s=ctx.createBufferSource();
    var f=ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1800;
    var g=ctx.createGain(); g.gain.value=0.7;
    s.buffer=buf; s.connect(f); f.connect(g); g.connect(ctx.destination); s.start();
  }

  // Grama: ruído baixo suave
  function grass(){
    if(!ctx) return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*0.18,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.15*Math.pow(1-i/d.length,1.2);
    var s=ctx.createBufferSource();
    var f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=400;
    var g=ctx.createGain(); g.gain.value=0.6;
    s.buffer=buf; s.connect(f); f.connect(g); g.connect(ctx.destination); s.start();
  }

  // Vitória: fanfarra simples
  function victory(){
    if(!ctx) return;
    var notes=[523,659,784,1047];
    notes.forEach(function(n,i){
      setTimeout(function(){
        beep(n, 0.18, 0.35, 'triangle');
      }, i*120);
    });
    setTimeout(function(){ beep(1047,0.4,0.4,'triangle'); },500);
  }

  return { init:init, resume:resume, checkpoint:checkpoint, hit:hit, splash:splash, grass:grass, victory:victory };
})();
"""

# ──────────────────────────────────────────────
# TRACKV2.JS – pista nova com todos os elementos
# ──────────────────────────────────────────────
TRACKV2 = r"""// TrackV2.js – Pista CapRush reformulada
// Elementos: pista marrom, chicane em V no topo, curva U em vermelho/baixo,
// checkpoints brancos, largada xadrez horizontal, obstáculos vermelhos,
// água (azul/dir), grama (verde/curva), ponte, zonas internas (paddock/arq/grama/lago)
var TrackV2 = (function(){
  var META={id:'02',nome:'Terra & Cascalho – Pista Completa',superficie:'terra',voltas:2};

  // Estado – preenchido pelo init()
  var CW=800, CH=500;
  var trackPts=[];   // polígono exterior da pista
  var innerPts=[];   // polígono interior da pista
  var checkpoints=[];
  var obstacles=[];
  var waterZones=[];
  var grassZones=[];
  var bridgeZone=null;
  var startLine=null;

  // zonas internas (retornam ao último CP se tampinha entrar)
  var paddockZone=null, standZone=null, innerGrassZone=null, lakeZone=null;

  var lastSoundTime={water:0,grass:0};

  function init(cw, ch){
    CW=cw; CH=ch;
    var m=Math.min(cw,ch)*0.06; // margem

    // ── PISTA (pontos do caminho central) ──
    // Formato em "M": topo com V, lados, curva U inferior
    // O caminho vai no sentido horário para facilitar a detecção

    trackPts = [
      // Largada: topo esquerdo
      {x:m*1.5,          y:CH*0.42},
      // Lado esquerdo sobe
      {x:m*1.5,          y:m*1.5},
      // Topo esq → chicane V
      {x:CW*0.35,        y:m*1.5},
      {x:CW*0.42,        y:CH*0.22},  // V descida
      {x:CW*0.50,        y:CH*0.32},  // V fundo
      {x:CW*0.58,        y:CH*0.22},  // V subida
      {x:CW*0.65,        y:m*1.5},
      // Topo dir
      {x:CW-m*1.5,       y:m*1.5},
      // Lado direito desce
      {x:CW-m*1.5,       y:CH*0.42},
      // Curva U inferior (nova em vermelho)
      {x:CW-m*1.5,       y:CH*0.65},
      {x:CW*0.75,        y:CH*0.65},
      {x:CW*0.65,        y:CH-m*1.5},
      {x:CW*0.35,        y:CH-m*1.5},
      {x:CW*0.25,        y:CH*0.65},
      {x:m*1.5,          y:CH*0.65},
      // volta à largada
      {x:m*1.5,          y:CH*0.42},
    ];

    var TW = Math.min(cw,ch)*0.09; // largura da faixa

    // Largada: linha horizontal na posição x=m*1.5, y=CH*0.42
    startLine = {
      x: m*1.5 - TW*0.5,
      y: CH*0.42 - TW*0.5,
      w: TW*1,
      h: TW
    };

    // Checkpoints (manchas brancas)
    checkpoints = [
      { x:CW*0.50, y:CH*0.32, r:TW*0.55, lbl:'CP 1', ok:false },   // V inferior
      { x:CW-m*1.5, y:CH*0.55, r:TW*0.55, lbl:'CP 2', ok:false },  // lado dir
      { x:CW*0.35, y:CH-m*1.5, r:TW*0.55, lbl:'CP 3', ok:false },  // curva inferior
    ];

    // Obstáculos (pontos vermelhos → pedras/tocos)
    obstacles = [
      { x:CW*0.35, y:m*1.5+TW*0.3, r:8 },
      { x:CW*0.65, y:m*1.5+TW*0.3, r:8 },
      { x:CW-m*1.5-TW*0.1, y:CH*0.28, r:7 },
      { x:CW*0.70, y:CH*0.65+TW*0.1, r:9 },
      { x:CW*0.50, y:CH-m*1.5-TW*0.1, r:7 },
    ];

    // Água (azul, lado direito)
    waterZones = [
      { x:CW-m*1.5-TW*0.8, y:CH*0.42+TW*0.2, w:TW*0.6, h:TW*1.2 }
    ];

    // Grama (verde, dentro da curva U)
    grassZones = [
      { x:CW*0.35+TW*0.2, y:CH*0.68, w:(CW*0.65-CW*0.35)-TW*0.4, h:CH-m*1.5-CH*0.68-TW*0.3 }
    ];

    // Ponte (estreitamento antes da chegada)
    bridgeZone = { x:m*1.5, y:CH*0.42-TW*0.15, w:TW*0.5, h:TW*0.3 };

    // Zonas internas
    paddockZone = { x:m*0.3, y:CH*0.25, w:m*1.0, h:CH*0.5 };
    standZone   = { x:CW-m*1.4, y:m*0.5, w:m*1.2, h:CH*0.65, fans:[] };
    innerGrassZone = { x:CW*0.15, y:m*1.5+TW, w:CW*0.55, h:CH*0.55-TW*2 };
    lakeZone    = { x:CW*0.38+TW*0.5, y:CH*0.3, w:CW*0.22, h:CH*0.22 };

    // criar torcedores (pontos animados)
    standZone.fans = [];
    for(var i=0;i<20;i++){
      standZone.fans.push({
        x:standZone.x + Math.random()*standZone.w,
        y:standZone.y + Math.random()*standZone.h,
        phase:Math.random()*Math.PI*2,
        spd:1+Math.random()
      });
    }
  }

  function resetCPs(){
    checkpoints.forEach(function(c){ c.ok=false; });
  }

  function checkCP(pos, onCP){
    for(var i=0;i<checkpoints.length;i++){
      var c=checkpoints[i]; if(c.ok) continue;
      var dx=pos.x-c.x, dy=pos.y-c.y;
      if(Math.sqrt(dx*dx+dy*dy)<c.r){
        c.ok=true;
        if(onCP) onCP(c);
        return c;
      }
    }
    return null;
  }

  // Retorna o último CP que passou (para respawn)
  function lastCP(){
    var last=null;
    checkpoints.forEach(function(c){ if(c.ok) last=c; });
    return last;
  }

  // Ponto de respawn
  function respawnPos(startPos){
    var lc=lastCP();
    if(lc) return {x:lc.x, y:lc.y};
    return {x:startPos.x, y:startPos.y};
  }

  function checkLap(pos){
    if(!startLine) return false;
    var sl=startLine;
    return(pos.x>=sl.x && pos.x<=sl.x+sl.w+16 &&
           pos.y>=sl.y-8 && pos.y<=sl.y+sl.h+8);
  }

  // Detecta zona especial em que a tampinha está
  function detectZone(pos){
    // Paddock
    var p=paddockZone;
    if(pos.x>=p.x && pos.x<=p.x+p.w && pos.y>=p.y && pos.y<=p.y+p.h) return 'paddock';
    // Arquibancada
    var s=standZone;
    if(pos.x>=s.x && pos.x<=s.x+s.w && pos.y>=s.y && pos.y<=s.y+s.h) return 'stand';
    // Lago
    var l=lakeZone;
    if(pos.x>=l.x && pos.x<=l.x+l.w && pos.y>=l.y && pos.y<=l.y+l.h) return 'lake';
    // Grama interna (excluindo grassZone da curva que é válida)
    var ig=innerGrassZone;
    if(pos.x>=ig.x && pos.x<=ig.x+ig.w && pos.y>=ig.y && pos.y<=ig.y+ig.h) return 'innergrass';
    return null;
  }

  // Detecta superf. especial (água / grama da curva)
  function detectSurface(pos){
    // Água
    for(var i=0;i<waterZones.length;i++){
      var w=waterZones[i];
      if(pos.x>=w.x && pos.x<=w.x+w.w && pos.y>=w.y && pos.y<=w.y+w.h) return 'water';
    }
    // Grama curva
    for(var j=0;j<grassZones.length;j++){
      var g=grassZones[j];
      if(pos.x>=g.x && pos.x<=g.x+g.w && pos.y>=g.y && pos.y<=g.y+g.h) return 'grasszone';
    }
    return 'terra';
  }

  // Detecta colisão com obstáculo – retorna obstáculo ou null
  function checkObstacles(pos, radius){
    for(var i=0;i<obstacles.length;i++){
      var o=obstacles[i];
      var dx=pos.x-o.x, dy=pos.y-o.y;
      var dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<radius+o.r) return {obs:o, nx:dx/dist, ny:dy/dist};
    }
    return null;
  }

  // ──── RENDER ────────────────────────────────
  function render(ctx, cw, ch, t){
    if(!trackPts.length){ init(cw,ch); }
    var TW=Math.min(cw,ch)*0.09;

    // Fundo terra
    ctx.fillStyle='#1A1208';
    ctx.fillRect(0,0,cw,ch);
    // Cascalho
    ctx.fillStyle='rgba(80,60,40,.4)';
    for(var i=0;i<240;i++) ctx.fillRect((i*137.5)%cw,(i*97.3)%ch,2,2);

    // ── Zonas internas ──────────────────────────

    // Paddock (amarelo)
    var p=paddockZone;
    ctx.fillStyle='#3A3000';
    ctx.fillRect(p.x,p.y,p.w,p.h);
    ctx.strokeStyle='#FFD700';
    ctx.lineWidth=2;
    ctx.strokeRect(p.x,p.y,p.w,p.h);
    ctx.save();
    ctx.font='bold 9px Rajdhani,sans-serif';
    ctx.fillStyle='#FFD700';
    ctx.textAlign='center';
    // texto vertical
    ctx.translate(p.x+p.w/2, p.y+p.h/2);
    ctx.rotate(-Math.PI/2);
    ctx.fillText('PADDOCK',0,0);
    ctx.restore();
    // quadriculado do paddock
    ctx.strokeStyle='rgba(255,215,0,.15)';
    ctx.lineWidth=1;
    for(var gx=p.x;gx<p.x+p.w;gx+=8){
      ctx.beginPath();ctx.moveTo(gx,p.y);ctx.lineTo(gx,p.y+p.h);ctx.stroke();
    }

    // Arquibancada (laranja)
    var s=standZone;
    ctx.fillStyle='#2A1200';
    ctx.fillRect(s.x,s.y,s.w,s.h);
    ctx.strokeStyle='#FF6600';
    ctx.lineWidth=2;
    ctx.strokeRect(s.x,s.y,s.w,s.h);
    // Degraus
    for(var row=0;row<5;row++){
      ctx.fillStyle='rgba(255,100,0,'+(0.1+row*0.05)+')';
      ctx.fillRect(s.x+2, s.y+row*(s.h/5), s.w-4, s.h/5-1);
    }
    // Torcedores (pontos animados)
    s.fans.forEach(function(f){
      var bounce=Math.sin(f.phase+t*f.spd*3)*3;
      ctx.fillStyle='hsl('+(Math.floor(f.phase*50)%360)+',80%,60%)';
      ctx.beginPath();
      ctx.arc(f.x, f.y+bounce, 3,0,Math.PI*2);
      ctx.fill();
    });

    // Grama interna + árvores
    var ig=innerGrassZone;
    ctx.fillStyle='#0A2A0A';
    ctx.fillRect(ig.x,ig.y,ig.w,ig.h);
    // padrão de grama
    ctx.strokeStyle='rgba(0,180,0,.4)';
    ctx.lineWidth=1;
    for(var gi=0;gi<ig.w;gi+=6){
      var bh=4+Math.sin(gi*0.5)*3;
      ctx.beginPath();
      ctx.moveTo(ig.x+gi, ig.y+ig.h);
      ctx.lineTo(ig.x+gi+2, ig.y+ig.h-bh);
      ctx.lineTo(ig.x+gi+4, ig.y+ig.h);
      ctx.stroke();
    }
    // árvores (círculos verdes)
    [[ig.x+ig.w*0.2,ig.y+ig.h*0.3],[ig.x+ig.w*0.6,ig.y+ig.h*0.5],[ig.x+ig.w*0.4,ig.y+ig.h*0.75]].forEach(function(tp){
      ctx.fillStyle='#1A5C1A'; ctx.beginPath();ctx.arc(tp[0],tp[1],12,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#2E8B2E'; ctx.beginPath();ctx.arc(tp[0],tp[1],9,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#3CB83C'; ctx.beginPath();ctx.arc(tp[0],tp[1],5,0,Math.PI*2);ctx.fill();
      // tronco
      ctx.fillStyle='#5C3A1A'; ctx.fillRect(tp[0]-2,tp[1]+10,4,8);
    });

    // Lago
    var l=lakeZone;
    // gradiente do lago
    var lgrd=ctx.createRadialGradient(l.x+l.w/2,l.y+l.h/2,5,l.x+l.w/2,l.y+l.h/2,l.w/2);
    lgrd.addColorStop(0,'rgba(0,100,220,.7)');
    lgrd.addColorStop(1,'rgba(0,50,150,.4)');
    ctx.fillStyle=lgrd;
    ctx.beginPath();
    ctx.ellipse(l.x+l.w/2, l.y+l.h/2, l.w/2, l.h/2, 0, 0, Math.PI*2);
    ctx.fill();
    // ondas animadas
    ctx.strokeStyle='rgba(100,200,255,'+(0.3+Math.sin(t*2)*0.1)+')';
    ctx.lineWidth=1;
    for(var wi=1;wi<=3;wi++){
      ctx.beginPath();
      ctx.ellipse(l.x+l.w/2, l.y+l.h/2, l.w/2*wi/3.5, l.h/2*wi/3.5, Math.sin(t+wi)*0.1, 0, Math.PI*2);
      ctx.stroke();
    }

    // ── Pista ────────────────────────────────────

    // Borda
    drawTrack(ctx, TW+18, '#2A1F18');
    // Pista
    drawTrack(ctx, TW, '#4A3728');

    // Zona de água na pista
    waterZones.forEach(function(wz){
      var wgrd=ctx.createRadialGradient(wz.x+wz.w/2,wz.y+wz.h/2,2,wz.x+wz.w/2,wz.y+wz.h/2,wz.w/2);
      wgrd.addColorStop(0,'rgba(0,150,255,.55)');
      wgrd.addColorStop(1,'rgba(0,80,200,.25)');
      ctx.fillStyle=wgrd;
      ctx.fillRect(wz.x,wz.y,wz.w,wz.h);
      // ondas
      ctx.strokeStyle='rgba(120,220,255,.5)';
      ctx.lineWidth=1;
      var wx=wz.x+wz.w/2, wy=wz.y+wz.h/2;
      for(var wi2=1;wi2<=2;wi2++){
        ctx.beginPath();
        ctx.moveTo(wx-wz.w*(wi2/3), wy+Math.sin(t*3+wi2)*2);
        ctx.lineTo(wx+wz.w*(wi2/3), wy+Math.sin(t*3+wi2+1)*2);
        ctx.stroke();
      }
    });

    // Zona de grama (curva)
    grassZones.forEach(function(gz){
      ctx.fillStyle='rgba(0,160,0,.35)';
      ctx.fillRect(gz.x,gz.y,gz.w,gz.h);
      ctx.strokeStyle='rgba(0,220,0,.2)';
      ctx.lineWidth=1;
      for(var ggi=0;ggi<gz.w;ggi+=5){
        var gbh=3+Math.sin(ggi*0.7)*2;
        ctx.beginPath();
        ctx.moveTo(gz.x+ggi,gz.y+gz.h);
        ctx.lineTo(gz.x+ggi+2,gz.y+gz.h-gbh);
        ctx.lineTo(gz.x+ggi+4,gz.y+gz.h);
        ctx.stroke();
      }
    });

    // Linha central tracejada
    ctx.save();
    ctx.strokeStyle='rgba(255,215,0,.3)'; ctx.lineWidth=2; ctx.setLineDash([12,10]);
    ctx.beginPath();
    ctx.moveTo(trackPts[0].x,trackPts[0].y);
    trackPts.forEach(function(pt,i){ if(i>0) ctx.lineTo(pt.x,pt.y); });
    ctx.closePath(); ctx.stroke(); ctx.setLineDash([]); ctx.restore();

    // Obstáculos (pedras/tocos)
    obstacles.forEach(function(o){
      // sombra
      ctx.fillStyle='rgba(0,0,0,.4)';
      ctx.beginPath();ctx.ellipse(o.x+3,o.y+3,o.r+2,o.r+1,0,0,Math.PI*2);ctx.fill();
      // toco marrom
      ctx.fillStyle='#5C3A1A';
      ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();
      // textura
      ctx.fillStyle='#7A5030';
      ctx.beginPath();ctx.arc(o.x-1,o.y-2,o.r*0.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#3A2010'; ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.stroke();
      // marca de toco (anéis)
      ctx.strokeStyle='rgba(90,50,20,.6)'; ctx.lineWidth=.8;
      ctx.beginPath();ctx.arc(o.x,o.y,o.r*0.6,0,Math.PI*2);ctx.stroke();
    });

    // Ponte (estreitamento)
    if(bridgeZone){
      var bz=bridgeZone;
      ctx.fillStyle='#8B7355';
      ctx.fillRect(bz.x, bz.y-4, bz.w+8, bz.h+8);
      // guias laterais
      ctx.fillStyle='#FF4444';
      ctx.fillRect(bz.x, bz.y-4, 6, bz.h+8);
      ctx.fillRect(bz.x+bz.w+2, bz.y-4, 6, bz.h+8);
      ctx.strokeStyle='#CC2222'; ctx.lineWidth=1;
      ctx.strokeRect(bz.x, bz.y-4, bz.w+8, bz.h+8);
    }

    // Largada/chegada: xadrez horizontal CORRETO
    if(startLine){
      var sl=startLine;
      var sqSize=8;
      var cols=Math.ceil(sl.w/sqSize), rows=Math.ceil(sl.h/sqSize);
      for(var sr=0;sr<rows;sr++){
        for(var sc=0;sc<cols;sc++){
          ctx.fillStyle=(sr+sc)%2===0?'#FFFFFF':'#111111';
          ctx.fillRect(sl.x+sc*sqSize, sl.y+sr*sqSize, sqSize, sqSize);
        }
      }
      // borda da largada
      ctx.strokeStyle='#FFD700'; ctx.lineWidth=2;
      ctx.strokeRect(sl.x, sl.y, sl.w, sl.h);
      ctx.fillStyle='#FFD700';
      ctx.font='bold 9px Rajdhani,sans-serif';
      ctx.textAlign='center';
      ctx.fillText('START/FINISH', sl.x+sl.w/2, sl.y-4);
    }

    // Checkpoints
    checkpoints.forEach(function(c){
      ctx.save();
      ctx.globalAlpha=c.ok?0.25:0.9;
      ctx.strokeStyle=c.ok?'#333':'#FFFFFF';
      ctx.lineWidth=4;
      ctx.setLineDash([5,3]);
      ctx.beginPath();ctx.arc(c.x,c.y,c.r*0.7,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);
      // mancha branca translúcida
      ctx.fillStyle=c.ok?'rgba(50,50,50,.3)':'rgba(255,255,255,.18)';
      ctx.beginPath();ctx.arc(c.x,c.y,c.r*0.7,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=c.ok?'#333':'#FFFFFF';
      ctx.font='bold 10px Rajdhani,sans-serif';
      ctx.textAlign='center';
      ctx.fillText(c.lbl,c.x,c.y-c.r*0.7-5);
      ctx.restore();
    });
  }

  function drawTrack(ctx,width,color){
    if(!trackPts.length) return;
    ctx.save();
    ctx.strokeStyle=color; ctx.lineWidth=width;
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath();
    ctx.moveTo(trackPts[0].x,trackPts[0].y);
    trackPts.forEach(function(pt,i){ if(i>0) ctx.lineTo(pt.x,pt.y); });
    ctx.closePath(); ctx.stroke();
    ctx.restore();
  }

  // Calcula posição de largada
  function getStartPos(){
    if(!trackPts.length) return {x:80,y:200};
    var sl=startLine;
    if(sl) return {x:sl.x+sl.w/2+20, y:sl.y+sl.h/2};
    return {x:trackPts[0].x+40,y:trackPts[0].y};
  }

  return {
    META:META, init:init, render:render,
    checkCP:checkCP, checkLap:checkLap, resetCPs:resetCPs,
    checkObstacles:checkObstacles, detectZone:detectZone,
    detectSurface:detectSurface, lastCP:lastCP, respawnPos:respawnPos,
    getStartPos:getStartPos,
    get checkpoints(){return checkpoints;}
  };
})();
"""

# ──────────────────────────────────────────────
# GAMELOOP V2 – com zonas, sons, respawn
# ──────────────────────────────────────────────
GAMELOOP2 = r"""// GameLoop.js v2 – sons, zonas especiais, respawn, TrackV2
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
  var LAPS=TrackV2.META.voltas, NCPS=3;
  var RADIUS=16;

  var gs={phase:'WAIT',lap:1,cp:0,t0:0,elapsed:0,best:null,ds:null,dc:null,
          lastRespawn:null};

  // sons
  SoundEngine.init();

  function resize(){
    var wrap=canvas.parentElement;
    canvas.width  = Math.max(wrap.offsetWidth - 160, 320);
    canvas.height = Math.max(wrap.offsetHeight, 280);
    TrackV2.init(canvas.width, canvas.height);
    var sp=TrackV2.getStartPos();
    Physics.reset(sp.x, sp.y, 'terra');
    Yuki.resetAnim();
    gs.lastRespawn={x:sp.x,y:sp.y};
  }
  window.addEventListener('resize',resize);
  setTimeout(resize,80);

  // Overlay clique → inicia
  function startGame(){
    SoundEngine.resume();
    overlay.style.display='none';
    gs.phase='AIM';
    if(canvas.width<50) resize();
    var sp=TrackV2.getStartPos();
    Physics.reset(sp.x,sp.y,'terra');
    gs.lastRespawn={x:sp.x,y:sp.y};
  }
  overlay.addEventListener('click',startGame);
  overlay.addEventListener('touchend',function(e){e.preventDefault();startGame();},{passive:false});
  overlay.style.cursor='pointer';

  function cpos(e){var r=canvas.getBoundingClientRect();return new Vector2D(e.clientX-r.left,e.clientY-r.top);}
  function bnd(){return{x:0,y:0,w:canvas.width,h:canvas.height};}

  // Input
  canvas.addEventListener('mousedown',function(e){
    if(gs.phase!=='AIM') return;
    SoundEngine.resume();
    var ph=Physics.step(0,bnd());
    if(cpos(e).distanceTo(ph.pos)<44){gs.ds=cpos(e);gs.dc=cpos(e);}
  });
  canvas.addEventListener('mousemove',function(e){
    if(!gs.ds) return;
    gs.dc=cpos(e);
    var pct=Math.min(gs.ds.sub(gs.dc).magnitude()/Physics.MAX_PX,1);
    elFBar.style.height=(pct*100)+'%'; elFVal.textContent=Math.round(pct*100)+'%';
  });
  canvas.addEventListener('mouseup',function(e){
    if(!gs.ds||gs.phase!=='AIM') return;
    var info=Physics.flick(gs.ds,cpos(e),Yuki.M.spd);
    log('Lancamento '+info.forcePct+'% / '+info.angle.toFixed(0)+'graus','ev');
    gs.ds=null;gs.dc=null;gs.phase='MOVING';
    if(!gs.t0) gs.t0=performance.now();
    elFBar.style.height='0%'; elFVal.textContent='0%';
  });
  canvas.addEventListener('touchstart',function(e){
    if(gs.phase!=='AIM') return; SoundEngine.resume();
    var ph=Physics.step(0,bnd());
    if(cpos(e.touches[0]).distanceTo(ph.pos)<44){gs.ds=cpos(e.touches[0]);gs.dc=cpos(e.touches[0]);}
  },{passive:true});
  canvas.addEventListener('touchmove',function(e){
    e.preventDefault();if(!gs.ds) return;
    gs.dc=cpos(e.touches[0]);
    var pct=Math.min(gs.ds.sub(gs.dc).magnitude()/Physics.MAX_PX,1);
    elFBar.style.height=(pct*100)+'%'; elFVal.textContent=Math.round(pct*100)+'%';
  },{passive:false});
  canvas.addEventListener('touchend',function(e){
    if(!gs.ds||gs.phase!=='AIM') return;
    var info=Physics.flick(gs.ds,cpos(e.changedTouches[0]),Yuki.M.spd);
    gs.ds=null;gs.dc=null;gs.phase='MOVING';
    if(!gs.t0) gs.t0=performance.now();
    elFBar.style.height='0%'; elFVal.textContent='0%';
  },{passive:true});

  var lt=0, animT=0;
  function loop(now){
    var dt=Math.min((now-lt)/1000,0.05); lt=now; animT+=dt;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    TrackV2.render(ctx,canvas.width,canvas.height,animT);

    var ph=Physics.step(dt,bnd());

    // Detectar colisão com obstáculos
    if(ph.moving){
      var obs=TrackV2.checkObstacles(ph.pos, RADIUS);
      if(obs){
        // Ricochete: reflete velocidade na normal do obstáculo
        var dot=ph.vel.x*obs.nx+ph.vel.y*obs.ny;
        ph.vel.x=(ph.vel.x-2*dot*obs.nx)*0.85;
        ph.vel.y=(ph.vel.y-2*dot*obs.ny)*0.85;
        Physics.reset(ph.pos.x,ph.pos.y,'terra');
        // aplicar velocidade manualmente
        Physics.flick(
          new Vector2D(ph.pos.x-ph.vel.x*10, ph.pos.y-ph.vel.y*10),
          new Vector2D(ph.pos.x, ph.pos.y), 1
        );
        SoundEngine.hit();
        log('Bateu em obstaculo!','ev');
      }
    }

    // Detectar zona especial
    var zone=TrackV2.detectZone(ph.pos);
    if(zone){
      var rp=TrackV2.respawnPos(TrackV2.getStartPos());
      Physics.reset(rp.x,rp.y,'terra');
      log('Zona '+zone+' – voltando ao ultimo CP');
    }

    // Detectar superfície
    var surf=TrackV2.detectSurface(ph.pos);
    if(surf==='water'){
      Physics.reset(ph.pos.x,ph.pos.y,'areia'); // areia = mais arrasto
      var now2=Date.now();
      if(now2-_lastSnd.water>600){ SoundEngine.splash(); _lastSnd.water=now2; }
    } else if(surf==='grasszone'){
      Physics.reset(ph.pos.x,ph.pos.y,'asfalto'); // asfalto = menos arrasto (escorrega)
      var now3=Date.now();
      if(now3-_lastSnd.grass>800){ SoundEngine.grass(); _lastSnd.grass=now3; }
    }

    Yuki.render(ctx,ph,dt);
    if(gs.ds&&gs.dc) drawAim(ph.pos,gs.dc);

    if(gs.phase==='MOVING'){
      gs.elapsed=(performance.now()-gs.t0)/1000; updHUD();
      if(!ph.moving){ gs.phase='AIM'; log('Tampinha parou – mire novamente'); }

      var hit=TrackV2.checkCP(ph.pos,function(){
        SoundEngine.checkpoint();
      });
      if(hit){
        gs.cp++; elCp.textContent=gs.cp+'/'+NCPS;
        log(hit.lbl+' ativado!','ev');
        gs.lastRespawn={x:hit.x,y:hit.y};
      }
      if(gs.cp>=NCPS&&TrackV2.checkLap(ph.pos)) onLap();
    }
    requestAnimationFrame(loop);
  }

  var _lastSnd={water:0,grass:0};

  function onLap(){
    gs.cp=0; TrackV2.resetCPs();
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
    },1800);
  }
  function restart(){
    overlay.style.display='none';
    TrackV2.resetCPs();
    var sp=TrackV2.getStartPos();
    Physics.reset(sp.x,sp.y,'terra');
    Yuki.resetAnim();
    gs={phase:'AIM',lap:1,cp:0,t0:performance.now(),elapsed:0,best:gs.best,ds:null,dc:null,lastRespawn:{x:sp.x,y:sp.y}};
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
      body:JSON.stringify({piloto:p,pista:TrackV2.META.nome,tempo:t})
    }).then(function(){log('Score salvo.','ev');}).catch(function(){log('Servidor offline.');});
  }
  requestAnimationFrame(function(t){lt=t;requestAnimationFrame(loop);});
})();
"""

# ──────────────────────────────────────────────
# GAME.HTML SOLO atualizado
# ──────────────────────────────────────────────
GAME_HTML = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush – Solo</title>
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
#panel{width:155px;flex-shrink:0;background:var(--panel);border-left:1px solid rgba(255,42,42,.2);display:flex;flex-direction:column;padding:9px;gap:9px;overflow:hidden;}
.pt{font-family:'Bebas Neue',sans-serif;font-size:.88rem;letter-spacing:2px;color:var(--red);border-bottom:1px solid rgba(255,42,42,.25);padding-bottom:3px;}
#fbg{width:100%;height:100px;background:#1A1A28;border:1px solid #333;border-radius:4px;position:relative;overflow:hidden;}
#force-bar-fill{position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(0deg,var(--red),var(--gold));transition:height .05s;}
#flbl{font-size:.65rem;color:#666680;letter-spacing:1px;text-transform:uppercase;text-align:center;}
#force-value{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;color:var(--gold);text-align:center;}
#cc{background:#1A1A28;border:1px solid rgba(255,42,42,.3);border-radius:6px;padding:7px;text-align:center;}
#cav{width:54px;height:54px;border-radius:50%;margin:0 auto 5px;background:radial-gradient(circle at 30% 30%,#fff4,transparent 60%),linear-gradient(135deg,#1A3A6A,#0A1A3A);border:2px solid var(--acc);display:flex;align-items:center;justify-content:center;font-size:1.6rem;}
#cnm{font-family:'Bebas Neue',sans-serif;font-size:.88rem;color:var(--acc);letter-spacing:2px;}
.ar{display:flex;justify-content:space-between;font-size:.65rem;color:#666680;margin-top:2px;}
.av{color:var(--gold);font-weight:700;}
#log-box{flex:1;overflow-y:auto;font-size:.6rem;color:#555570;}
#log-box p{padding:2px 0;border-bottom:1px solid #1A1A28;}
#log-box p.ev{color:var(--gold);}
#overlay{position:absolute;left:0;top:0;right:155px;bottom:0;background:rgba(0,0,0,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;cursor:pointer;}
#overlay h2{font-family:'Bebas Neue',sans-serif;font-size:2.2rem;letter-spacing:5px;color:var(--gold);text-shadow:0 0 20px rgba(255,215,0,.5);margin-bottom:.5rem;}
#overlay p{color:#AAA;letter-spacing:2px;font-size:.88rem;margin:.2rem 0;}
.pulse{animation:pulse 1.2s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
#btnBack{position:absolute;top:8px;left:8px;z-index:25;background:rgba(255,42,42,.15);border:1px solid var(--red);color:var(--red);font-family:'Rajdhani',sans-serif;font-size:.78rem;letter-spacing:2px;padding:3px 9px;cursor:pointer;border-radius:3px;text-decoration:none;transition:background .2s;}
#btnBack:hover{background:var(--red);color:#fff;}
#btnMulti{position:absolute;top:8px;right:168px;z-index:25;background:rgba(0,229,255,.15);border:1px solid var(--acc);color:var(--acc);font-family:'Rajdhani',sans-serif;font-size:.78rem;letter-spacing:2px;padding:3px 9px;cursor:pointer;border-radius:3px;text-decoration:none;transition:background .2s;}
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
      <p>Clique aqui para comecar</p>
      <p style="font-size:.8rem;color:#666680;margin-top:.4rem">Clique e arraste a tampinha para mirar</p>
      <br>
      <p class="pulse">&#9654; CLIQUE PARA COMECAR</p>
    </div>
    <a href="../index.html" id="btnBack">&larr; LOBBY</a>
    <a href="game-multi.html" id="btnMulti">2 JOGADORES &rarr;</a>
  </div>
</div>
<script src="src/core/Vector2D.js"></script>
<script src="src/core/Physics.js"></script>
<script src="src/core/SoundEngine.js"></script>
<script src="src/entities/Yuki.js"></script>
<script src="src/scenes/TrackV2.js"></script>
<script src="src/core/GameLoop.js"></script>
</body>
</html>
"""

# ──────────────────────────────────────────────
# GAME-MULTI.HTML – multiplayer 1v1 local
# ──────────────────────────────────────────────
GAME_MULTI = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush – 1v1</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--panel:rgba(8,8,18,.95);--acc:#00E5FF;--p2:#FF9900;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;background:var(--dark);font-family:'Rajdhani',sans-serif;color:#E8E8F0;overflow:hidden;}
#shell{display:flex;flex-direction:column;width:100%;height:100%;}
#hud{display:flex;justify-content:space-between;align-items:center;padding:5px 14px;background:var(--panel);border-bottom:2px solid rgba(255,42,42,.3);flex-shrink:0;height:46px;}
.hlogo{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:3px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none;}
.p-info{display:flex;align-items:center;gap:.6rem;}
.p-dot{width:12px;height:12px;border-radius:50%;}
.p-name{font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:2px;}
.p-stat{font-family:'Bebas Neue',sans-serif;font-size:.8rem;color:#888;min-width:60px;}
#wrap{position:relative;flex:1;min-height:0;}
#gameCanvas{display:block;width:100%;height:100%;cursor:crosshair;}
#overlay{position:absolute;inset:0;background:rgba(0,0,0,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;cursor:pointer;}
#overlay h2{font-family:'Bebas Neue',sans-serif;font-size:2.2rem;letter-spacing:5px;color:var(--gold);margin-bottom:.5rem;}
#overlay p{color:#AAA;letter-spacing:2px;font-size:.85rem;margin:.2rem 0;}
.pulse{animation:pulse 1.2s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
#turn-banner{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  font-family:'Bebas Neue',sans-serif;font-size:2.5rem;letter-spacing:6px;
  pointer-events:none;opacity:0;transition:opacity .3s;z-index:15;
  text-shadow:0 0 30px currentColor;}
#btnBack{position:absolute;top:8px;left:8px;z-index:25;background:rgba(255,42,42,.15);border:1px solid var(--red);color:var(--red);font-family:'Rajdhani',sans-serif;font-size:.75rem;letter-spacing:2px;padding:3px 8px;cursor:pointer;border-radius:3px;text-decoration:none;}
#btnBack:hover{background:var(--red);color:#fff;}
</style>
</head>
<body>
<div id="shell">
  <div id="hud">
    <a href="../index.html" class="hlogo">CAP RUSH &ndash; 1v1</a>
    <div class="p-info">
      <div class="p-dot" style="background:var(--acc);box-shadow:0 0 8px var(--acc);"></div>
      <span class="p-name" style="color:var(--acc);">YUKI</span>
      <span class="p-stat" id="p1-time">00:00.0</span>
      <span class="p-stat" id="p1-lap" style="color:var(--acc)">V 1/2</span>
    </div>
    <div style="font-family:'Bebas Neue',sans-serif;color:#444;font-size:1.5rem;letter-spacing:4px;">VS</div>
    <div class="p-info">
      <span class="p-stat" id="p2-lap" style="color:var(--p2)">V 1/2</span>
      <span class="p-stat" id="p2-time">00:00.0</span>
      <span class="p-name" style="color:var(--p2);">KENTA</span>
      <div class="p-dot" style="background:var(--p2);box-shadow:0 0 8px var(--p2);"></div>
    </div>
  </div>
  <div id="wrap">
    <canvas id="gameCanvas"></canvas>
    <div id="turn-banner">TURNO YUKI</div>
    <div id="overlay">
      <h2>1 v 1</h2>
      <p style="color:var(--acc);">YUKI (Azul) e KENTA (Laranja)</p>
      <p>Jogadores se alternam em cada lancamento</p>
      <p style="font-size:.78rem;color:#555;margin-top:.5rem">Clique e arraste a tampinha ativa para mirar</p>
      <br>
      <p class="pulse">&#9654; CLIQUE PARA COMECAR</p>
    </div>
    <a href="game.html" id="btnBack">&larr; SOLO</a>
  </div>
</div>
<script src="src/core/Vector2D.js"></script>
<script src="src/core/Physics.js"></script>
<script src="src/core/SoundEngine.js"></script>
<script src="src/entities/Yuki.js"></script>
<script src="src/scenes/TrackV2.js"></script>
<script>
// ── MULTIPLAYER ENGINE ──────────────────────────────────────────
(function(){
  'use strict';
  var canvas=document.getElementById('gameCanvas');
  var ctx=canvas.getContext('2d');
  var overlay=document.getElementById('overlay');
  var turnBanner=document.getElementById('turn-banner');
  SoundEngine.init();

  var LAPS=2, NCPS=3, RADIUS=16;

  // Estado dos 2 jogadores
  var players=[
    {id:0,name:'YUKI',color:'#00E5FF',pos:new Vector2D(0,0),vel:new Vector2D(0,0),
     moving:false,lap:1,cp:0,t0:0,elapsed:0,finished:false,lastRespawn:null,
     anim:{rot:0,glow:0,gdir:1,trail:[]},kanji:'\u96EA'},
    {id:1,name:'KENTA',color:'#FF9900',pos:new Vector2D(0,0),vel:new Vector2D(0,0),
     moving:false,lap:1,cp:0,t0:0,elapsed:0,finished:false,lastRespawn:null,
     anim:{rot:0,glow:0,gdir:1,trail:[]},kanji:'\u9B54'}
  ];
  var trackCps=[null,null]; // checkpoints por jogador (instâncias separadas)

  var phase='WAIT'; // WAIT | AIM | MOVING | DONE
  var currentP=0;   // turno: 0=Yuki, 1=Kenta
  var ds=null, dc=null;

  function resize(){
    canvas.width=canvas.parentElement.offsetWidth;
    canvas.height=canvas.parentElement.offsetHeight||400;
    TrackV2.init(canvas.width,canvas.height);
    var sp=TrackV2.getStartPos();
    // P1 levemente acima da largada, P2 levemente abaixo
    var offset=20;
    players[0].pos=new Vector2D(sp.x, sp.y-offset);
    players[0].lastRespawn={x:sp.x,y:sp.y-offset};
    players[1].pos=new Vector2D(sp.x, sp.y+offset);
    players[1].lastRespawn={x:sp.x,y:sp.y+offset};
    // resetar CPs por jogador
    trackCps=[cloneCPs(),cloneCPs()];
  }

  function cloneCPs(){
    return [
      {x:0,y:0,r:0,lbl:'CP 1',ok:false},
      {x:0,y:0,r:0,lbl:'CP 2',ok:false},
      {x:0,y:0,r:0,lbl:'CP 3',ok:false},
    ];
  }

  function syncCPs(pidx){
    // Copia posições dos CPs do TrackV2 para os CPs do jogador
    var master=TrackV2.checkpoints;
    for(var i=0;i<Math.min(master.length,trackCps[pidx].length);i++){
      trackCps[pidx][i].x=master[i].x;
      trackCps[pidx][i].y=master[i].y;
      trackCps[pidx][i].r=master[i].r;
      trackCps[pidx][i].lbl=master[i].lbl;
    }
  }

  window.addEventListener('resize',resize);
  setTimeout(function(){resize();syncCPs(0);syncCPs(1);},80);

  // ── Overlay ────────────────────────────────────────────────────
  function startGame(){
    SoundEngine.resume();
    overlay.style.display='none';
    phase='AIM';
    if(canvas.width<50){resize();syncCPs(0);syncCPs(1);}
    showTurn();
  }
  overlay.addEventListener('click',startGame);
  overlay.addEventListener('touchend',function(e){e.preventDefault();startGame();},{passive:false});
  overlay.style.cursor='pointer';

  function showTurn(){
    var p=players[currentP];
    turnBanner.textContent='TURNO '+p.name;
    turnBanner.style.color=p.color;
    turnBanner.style.opacity='1';
    setTimeout(function(){turnBanner.style.opacity='0';},1200);
  }

  // ── Input ──────────────────────────────────────────────────────
  function cpos(e){var r=canvas.getBoundingClientRect();return new Vector2D(e.clientX-r.left,e.clientY-r.top);}
  function bnd(){return{x:0,y:0,w:canvas.width,h:canvas.height};}

  function nearActive(pt){
    var p=players[currentP];
    return pt.distanceTo(p.pos)<50;
  }

  canvas.addEventListener('mousedown',function(e){
    if(phase!=='AIM') return; SoundEngine.resume();
    if(nearActive(cpos(e))){ ds=cpos(e); dc=cpos(e); }
  });
  canvas.addEventListener('mousemove',function(e){
    if(!ds) return; dc=cpos(e);
  });
  canvas.addEventListener('mouseup',function(e){
    if(!ds||phase!=='AIM') return;
    launch(cpos(e));
  });
  canvas.addEventListener('touchstart',function(e){
    if(phase!=='AIM') return; SoundEngine.resume();
    if(nearActive(cpos(e.touches[0]))){ ds=cpos(e.touches[0]); dc=cpos(e.touches[0]); }
  },{passive:true});
  canvas.addEventListener('touchmove',function(e){
    e.preventDefault();if(!ds) return; dc=cpos(e.touches[0]);
  },{passive:false});
  canvas.addEventListener('touchend',function(e){
    if(!ds||phase!=='AIM') return; launch(cpos(e.changedTouches[0]));
  },{passive:true});

  function launch(releasePos){
    var p=players[currentP];
    var drag=p.pos.sub(releasePos);
    var len=Math.min(drag.magnitude(),165);
    var t=len/165;
    p.vel=drag.normalize().scale(t*700);
    p.moving=true;
    if(!p.t0) p.t0=performance.now();
    ds=null; dc=null;
    phase='MOVING';
  }

  // ── Loop ───────────────────────────────────────────────────────
  var lt=0,animT=0;
  function loop(now){
    var dt=Math.min((now-lt)/1000,0.05); lt=now; animT+=dt;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Renderiza pista (sem checkpoints individuais – desenhamos manualmente)
    TrackV2.render(ctx,canvas.width,canvas.height,animT);

    // Atualiza jogador ativo
    if(phase==='MOVING'){
      var p=players[currentP];
      stepPlayer(p,dt);
      p.elapsed=(performance.now()-p.t0)/1000;
      document.getElementById('p'+p.id+'-time').textContent=fmt(p.elapsed);

      if(!p.moving){
        phase='AIM';
        // Alterna turno (apenas se o outro jogador não terminou)
        var other=players[1-currentP];
        if(!other.finished){
          currentP=1-currentP;
          showTurn();
        }
      }

      // Checkpoint do jogador atual
      var myCps=trackCps[currentP];
      for(var ci=0;ci<myCps.length;ci++){
        var c=myCps[ci]; if(c.ok) continue;
        var dx=p.pos.x-c.x, dy=p.pos.y-c.y;
        if(Math.sqrt(dx*dx+dy*dy)<c.r){
          c.ok=true; p.cp++;
          SoundEngine.checkpoint();
          document.getElementById('p'+p.id+'-lap').textContent='V '+p.lap+'/'+LAPS+' CP'+p.cp+'/'+NCPS;
        }
      }
      // Chegada
      if(p.cp>=NCPS && TrackV2.checkLap(p.pos)){
        p.cp=0; trackCps[currentP]=cloneCPs(); syncCPs(currentP);
        if(p.lap>=LAPS){ p.finished=true; checkWinner(p); }
        else{ p.lap++; document.getElementById('p'+p.id+'-lap').textContent='V '+p.lap+'/'+LAPS; }
      }
    }

    // Renderiza os 2 jogadores
    players.forEach(function(p){ renderPlayer(ctx,p,dt); });

    // Linha de mira
    if(ds&&dc){
      var ap=players[currentP];
      drawAim(ap.pos,dc,ap.color);
    }

    requestAnimationFrame(loop);
  }

  function stepPlayer(p,dt){
    var b=bnd();
    var DRAG=0.52,REST=0.72,MIN=4;
    var spd=p.vel.magnitude();
    if(spd<MIN){ p.vel=new Vector2D(0,0); p.moving=false; return; }
    var ns=Math.max(0,spd-DRAG*spd*dt);
    p.vel=p.vel.normalize().scale(ns);
    p.pos=p.pos.add(p.vel.scale(dt));

    // bordas
    var r=RADIUS;
    if(p.pos.x-r<b.x){p.pos.x=b.x+r;p.vel.x=Math.abs(p.vel.x)*REST;}
    if(p.pos.x+r>b.x+b.w){p.pos.x=b.x+b.w-r;p.vel.x=-Math.abs(p.vel.x)*REST;}
    if(p.pos.y-r<b.y){p.pos.y=b.y+r;p.vel.y=Math.abs(p.vel.y)*REST;}
    if(p.pos.y+r>b.y+b.h){p.pos.y=b.y+b.h-r;p.vel.y=-Math.abs(p.vel.y)*REST;}

    // Obstáculos
    var obs=TrackV2.checkObstacles(p.pos,RADIUS);
    if(obs){
      var dot=p.vel.x*obs.nx+p.vel.y*obs.ny;
      p.vel.x=(p.vel.x-2*dot*obs.nx)*0.85;
      p.vel.y=(p.vel.y-2*dot*obs.ny)*0.85;
      SoundEngine.hit();
    }

    // Zona especial
    var zone=TrackV2.detectZone(p.pos);
    if(zone){
      var rp=p.lastRespawn||TrackV2.getStartPos();
      p.pos=new Vector2D(rp.x,rp.y);
      p.vel=new Vector2D(0,0); p.moving=false;
    }

    // Superfície
    var surf=TrackV2.detectSurface(p.pos);
    var now2=Date.now();
    if(surf==='water'){ p.vel=p.vel.scale(.65); if(now2-_lastSnd.water>600){SoundEngine.splash();_lastSnd.water=now2;} }
    if(surf==='grasszone'){ p.vel=p.vel.scale(1.05); if(now2-_lastSnd.grass>800){SoundEngine.grass();_lastSnd.grass=now2;} }
  }

  var _lastSnd={water:0,grass:0};

  function renderPlayer(ctx,p,dt){
    var pos=p.pos, spd=p.vel.magnitude();
    p.anim.rot+=spd*dt*0.005;
    p.anim.glow+=0.03*p.anim.gdir; if(p.anim.glow>=1||p.anim.glow<=0) p.anim.gdir*=-1;
    p.anim.trail.push({x:pos.x,y:pos.y}); if(p.anim.trail.length>14) p.anim.trail.shift();
    for(var i=0;i<p.anim.trail.length;i++){
      var tr=p.anim.trail[i],a=(i/p.anim.trail.length)*0.3;
      ctx.save(); ctx.globalAlpha=a;
      ctx.beginPath(); ctx.arc(tr.x,tr.y,12*(i/p.anim.trail.length),0,Math.PI*2);
      ctx.fillStyle=p.color; ctx.fill(); ctx.restore();
    }
    ctx.save(); ctx.translate(pos.x,pos.y); ctx.rotate(p.anim.rot);
    if(spd>50){ ctx.shadowColor=p.color; ctx.shadowBlur=16+p.anim.glow*10; }
    var g=ctx.createRadialGradient(-5,-5,2,0,0,16);
    g.addColorStop(0,'#FFF'); g.addColorStop(0.3,p.color); g.addColorStop(1,'rgba(0,0,0,.8)');
    ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    ctx.beginPath(); ctx.arc(0,0,16,0,Math.PI*2); ctx.strokeStyle=p.color; ctx.lineWidth=2.5; ctx.stroke();
    ctx.rotate(-p.anim.rot); ctx.shadowBlur=0; ctx.fillStyle='#FFF';
    ctx.font='bold 11px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(p.kanji,0,0); ctx.restore();

    // indicador de jogador ativo
    if(players[currentP]===p && phase==='AIM'){
      ctx.save(); ctx.strokeStyle=p.color; ctx.lineWidth=2;
      var pulse2=Math.sin(Date.now()*0.005)*4;
      ctx.beginPath(); ctx.arc(pos.x,pos.y,22+pulse2,0,Math.PI*2); ctx.stroke();
      ctx.restore();
    }
  }

  function drawAim(cap,drag,color){
    var dir=cap.sub(drag).normalize();
    var dist=Math.min(cap.distanceTo(drag),165);
    var end=cap.add(dir.scale(dist*1.8)),pct=dist/165;
    ctx.save();
    var g=ctx.createLinearGradient(cap.x,cap.y,end.x,end.y);
    g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.strokeStyle=g; ctx.lineWidth=2+pct*2; ctx.setLineDash([8,6]);
    ctx.beginPath(); ctx.moveTo(cap.x,cap.y); ctx.lineTo(end.x,end.y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(cap.x,cap.y,20+pct*10,0,Math.PI*2);
    ctx.strokeStyle=color; ctx.lineWidth=1.5; ctx.globalAlpha=.4+pct*.4; ctx.stroke();
    ctx.restore();
  }

  function checkWinner(p){
    SoundEngine.victory();
    setTimeout(function(){
      overlay.innerHTML='<h2 style="color:'+p.color+'">'+p.name+' VENCEU!</h2>'
        +'<p style="color:'+p.color+';font-size:2rem;font-family:Bebas Neue,sans-serif">'+fmt(p.elapsed)+'</p>'
        +'<p style="color:#aaa;margin-top:.5rem">Clique para jogar novamente</p>';
      overlay.style.display='flex';
      overlay.onclick=function(){ overlay.onclick=null; location.reload(); };
    },1500);
  }

  function fmt(s){
    var m=Math.floor(s/60),ss=(s%60).toFixed(1);
    return(m<10?'0':'')+m+':'+(parseFloat(ss)<10?'0':'')+ss;
  }

  requestAnimationFrame(function(t){lt=t;requestAnimationFrame(loop);});
})();
</script>
</body>
</html>
"""

CAPRUSH_GAME = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush – Jogar</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--acc:#00E5FF;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;background:var(--dark);font-family:'Rajdhani',sans-serif;color:#E8E8F0;overflow:hidden;}
#topbar{display:flex;align-items:center;justify-content:space-between;padding:8px 20px;background:rgba(8,8,18,.97);border-bottom:2px solid var(--red);height:48px;flex-shrink:0;}
.tlogo{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:4px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none;}
.tlinks{display:flex;gap:1.4rem;align-items:center;}
.tlinks a{color:#888;font-size:.78rem;letter-spacing:2px;text-decoration:none;text-transform:uppercase;transition:color .2s;}
.tlinks a:hover{color:var(--gold);}
.tbadge{background:var(--red);color:#fff;font-size:.62rem;letter-spacing:2px;padding:2px 8px;border-radius:2px;text-transform:uppercase;}
#gframe{width:100%;height:calc(100vh - 48px);border:none;display:block;}
</style>
</head>
<body>
  <div style="display:flex;flex-direction:column;height:100vh;">
    <div id="topbar">
      <a href="index.html" class="tlogo">CAP RUSH</a>
      <div class="tlinks">
        <a href="index.html">Lobby</a>
        <a href="personagens.html">Pilotos</a>
        <a href="ranking.html">Ranking</a>
        <a href="manual.html">Manual</a>
        <span class="tbadge">Prototype v0.2</span>
      </div>
    </div>
    <iframe id="gframe" src="client/game.html" allow="autoplay" title="CapRush Game"></iframe>
  </div>
</body>
</html>
"""

def build():
    print()
    print("="*55)
    print("  CapRush – builder_track.py")
    print("  Pista v2 + Sons + Multiplayer")
    print("="*55)
    print("Raiz:", ROOT)
    print()
    w("client/src/core/SoundEngine.js",   SOUND_ENGINE)
    w("client/src/scenes/TrackV2.js",     TRACKV2)
    w("client/src/core/GameLoop.js",      GAMELOOP2)
    w("client/game.html",                 GAME_HTML)
    w("client/game-multi.html",           GAME_MULTI)
    w("caprush-game.html",                CAPRUSH_GAME)
    print()
    print("  GERADO COM SUCESSO!")
    print()

if __name__=="__main__":
    build()
