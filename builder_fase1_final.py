"""
builder_fase1_final.py
======================
CapRush - Fase 1 FINAL - Todas as correcoes aplicadas
Gera todos os arquivos do jogo de uma vez so.

Correcoes:
  - Pista: zonas de grama/lago NAO sobrepoe a pista
  - Fisica: atrito de asfalto real (para rapido, menos escorregamento)
  - Tampinha: visual de tampinha de refrigerante com coroa metalica
  - Multiplayer: motores fisicos separados por jogador (sem singleton)
  - Multiplayer online: lobby com opcao Local / Online (WebSocket)
  - Yuki SVG: Samoeida correto (focinho largo, sorriso, pelo fofo)
  - Efeito dash/velocidade ao deslizar
  - Poças de agua e grama na PISTA (sons e fisica corretos)
  - Texto branco nas tampinhas do menu

Execute: python builder_fase1_final.py
"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))

def w(rel, txt):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(txt)
    print("  OK  " + rel)

# ============================================================
# PHYSICS V2 - Atrito de asfalto, para mais rapido
# ============================================================
PHYSICS = r"""// Physics.js v2 - Fisica realista de asfalto
// Atrito alto (asfalto real): tampinha para em ~1.5s
// Superficie: asfalto=base, agua=desliza menos (mais atrito),
//             grama=desliza mais (menos atrito)
var Physics = (function(){
  // Coeficientes ajustados para asfalto
  var BASE_DRAG = 1.8;   // arrasto base (asfalto) - para rapido
  var MAX_PX    = 165;   // distancia maxima de arraste
  var MAX_SPD   = 620;   // velocidade maxima px/s
  var REST      = 0.65;  // ricochete (perde 35% da velocidade)
  var MIN_SPD   = 6;     // velocidade minima antes de parar

  // Multiplicadores de arrasto por superficie
  var DRAG_MULT = {
    asfalto: 1.0,  // base
    agua:    0.55, // MENOS arrasto = desliza menos (mais atrito com agua)
    grama:   1.35, // MAIS arrasto = desliza mais (menos atrito com grama)
  };

  var s = {
    pos: new Vector2D(0,0),
    vel: new Vector2D(0,0),
    moving: false,
    surf: 'asfalto'
  };

  function reset(x, y, surf){
    s.pos    = new Vector2D(x, y);
    s.vel    = new Vector2D(0, 0);
    s.moving = false;
    s.surf   = surf || 'asfalto';
  }

  function setSurface(surf){ s.surf = surf || 'asfalto'; }

  function flick(from, to, charMult){
    var drag    = from.sub(to);
    var len     = Math.min(drag.magnitude(), MAX_PX);
    var t       = len / MAX_PX;
    s.vel       = drag.normalize().scale(t * MAX_SPD * (charMult || 1));
    s.moving    = true;
    return { forcePct: Math.round(t * 100),
             angle: Math.atan2(drag.y, drag.x) * 180 / Math.PI };
  }

  function step(dt, bounds){
    if (!s.moving) return snap();

    var dragCoeff = BASE_DRAG * (DRAG_MULT[s.surf] || 1.0);
    var spd       = s.vel.magnitude();
    var newSpd    = Math.max(0, spd - dragCoeff * spd * dt);

    if (newSpd < MIN_SPD){
      s.vel    = new Vector2D(0, 0);
      s.moving = false;
      return snap();
    }

    s.vel = s.vel.normalize().scale(newSpd);
    s.pos = s.pos.add(s.vel.scale(dt));

    // bordas
    var r = 14;
    if (s.pos.x - r < bounds.x){ s.pos.x = bounds.x + r; s.vel.x =  Math.abs(s.vel.x) * REST; }
    if (s.pos.x + r > bounds.x + bounds.w){ s.pos.x = bounds.x + bounds.w - r; s.vel.x = -Math.abs(s.vel.x) * REST; }
    if (s.pos.y - r < bounds.y){ s.pos.y = bounds.y + r; s.vel.y =  Math.abs(s.vel.y) * REST; }
    if (s.pos.y + r > bounds.y + bounds.h){ s.pos.y = bounds.y + bounds.h - r; s.vel.y = -Math.abs(s.vel.y) * REST; }

    return snap();
  }

  function snap(){
    return {
      pos:    s.pos.clone(),
      vel:    s.vel.clone(),
      speed:  s.vel.magnitude(),
      moving: s.moving,
      surf:   s.surf
    };
  }

  return { reset:reset, flick:flick, step:step, setSurface:setSurface,
           MAX_PX:MAX_PX, MAX_SPD:MAX_SPD,
           get pos(){ return s.pos.clone(); } };
})();
"""

# ============================================================
# VECTOR2D (igual)
# ============================================================
VECTOR2D = r"""// Vector2D.js
var Vector2D = function(x,y){ this.x=x||0; this.y=y||0; };
Vector2D.prototype = {
  add:        function(v){ return new Vector2D(this.x+v.x, this.y+v.y); },
  sub:        function(v){ return new Vector2D(this.x-v.x, this.y-v.y); },
  scale:      function(s){ return new Vector2D(this.x*s,   this.y*s);   },
  magnitude:  function(){ return Math.sqrt(this.x*this.x + this.y*this.y); },
  normalize:  function(){ var m=this.magnitude(); return m===0?new Vector2D(0,0):new Vector2D(this.x/m,this.y/m); },
  distanceTo: function(v){ return this.sub(v).magnitude(); },
  clone:      function(){ return new Vector2D(this.x, this.y); }
};
"""

# ============================================================
# SOUND ENGINE (igual ao anterior)
# ============================================================
SOUND = r"""// SoundEngine.js
var SoundEngine = (function(){
  var ctx = null;
  function init(){ if(ctx) return; try{ ctx=new(window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  function resume(){ if(ctx&&ctx.state==='suspended') ctx.resume(); }
  function beep(freq,dur,vol,type){
    if(!ctx)return;
    var o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type||'square'; o.frequency.value=freq||880;
    g.gain.setValueAtTime(vol||0.3,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+(dur||0.12));
    o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+(dur||0.12));
  }
  function checkpoint(){ if(!ctx)return; beep(660,.08,.35,'square'); setTimeout(function(){beep(880,.1,.35,'square');},90); }
  function hit(){
    if(!ctx)return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*.12,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2)*.8;
    var s=ctx.createBufferSource(),g=ctx.createGain(); g.gain.value=0.5;
    s.buffer=buf; s.connect(g);g.connect(ctx.destination);s.start();
  }
  function splash(){
    if(!ctx)return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*.18,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*.25*Math.pow(1-i/d.length,1.5);
    var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    f.type='bandpass';f.frequency.value=1800;g.gain.value=.7;
    s.buffer=buf;s.connect(f);f.connect(g);g.connect(ctx.destination);s.start();
  }
  function grass(){
    if(!ctx)return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*.15,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*.12*Math.pow(1-i/d.length,1.2);
    var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    f.type='lowpass';f.frequency.value=350;g.gain.value=.6;
    s.buffer=buf;s.connect(f);f.connect(g);g.connect(ctx.destination);s.start();
  }
  function victory(){
    if(!ctx)return;
    [523,659,784,1047].forEach(function(n,i){setTimeout(function(){beep(n,.18,.32,'triangle');},i*115);});
    setTimeout(function(){beep(1047,.4,.38,'triangle');},480);
  }
  return {init:init,resume:resume,checkpoint:checkpoint,hit:hit,splash:splash,grass:grass,victory:victory};
})();
"""

# ============================================================
# TRACK V3 - CORRIGIDA
# Principio: zonas de grama/lago sao APENAS no interior do loop
# A pista (marrom escuro) NUNCA e afetada pelo innerGrass
# As poças e grama na PISTA sao detectadas por coordenadas
# especificas DENTRO da faixa da pista
# ============================================================
TRACKV3 = r"""// TrackV3.js - Pista corrigida
// REGRA FUNDAMENTAL: a tampinha esta NA PISTA quando sua posicao
// esta dentro do poligono da pista (verificado por path2D ou bbox).
// Zonas internas so ativam SE tampinha estiver FORA da pista.
var TrackV3 = (function(){
  var META = { id:'03', nome:'Terra & Cascalho v3', superficie:'asfalto', voltas:2 };

  var CW=800, CH=500;
  var TW;       // largura da faixa (calculada no init)

  // Pontos do CAMINHO CENTRAL da pista
  var pts = [];

  // Zonas especiais NA PISTA (fisica diferente)
  var puddleZones = [];  // poças de agua (circulo azul claro)
  var grassOnTrack = []; // grama NA pista (quadrado verde claro)

  // Zonas internas (respawn se entrar)
  var innerBounds = [];

  // Checkpoints
  var cps = [];

  // Obstaculos
  var obstacles = [];

  // Largada
  var startRect = null;

  // Path2D da pista para hit-test (fallback bbox)
  var trackBbox = [];  // array de bboxes "proibidas" = fora da pista

  // Sons
  var _snd = { water:0, grass:0 };

  function init(cw, ch){
    CW = cw; CH = ch;
    TW = Math.min(cw, ch) * 0.10;
    var m  = TW * 0.8;

    // CAMINHO CENTRAL da pista (sentido horario)
    // Pista em formato M: topo com V, lados, curva U na base
    pts = [
      // 0  - Largada (esquerda, meio)
      { x: m,          y: CH*0.46 },
      // 1  - canto sup-esq
      { x: m,          y: m },
      // 2  - reta topo esq
      { x: CW*0.36,    y: m },
      // 3  - V descida
      { x: CW*0.44,    y: CH*0.24 },
      // 4  - V fundo (CP1 fica aqui)
      { x: CW*0.50,    y: CH*0.33 },
      // 5  - V subida
      { x: CW*0.56,    y: CH*0.24 },
      // 6  - reta topo dir
      { x: CW*0.64,    y: m },
      // 7  - canto sup-dir
      { x: CW-m,       y: m },
      // 8  - lado dir desce (CP2 fica aqui)
      { x: CW-m,       y: CH*0.60 },
      // 9  - curva dir-baixo
      { x: CW*0.75,    y: CH*0.72 },
      // 10 - reta inferior dir
      { x: CW*0.62,    y: CH-m },
      // 11 - curva inferior (CP3 fica aqui)
      { x: CW*0.50,    y: CH-m },
      // 12 - reta inferior esq
      { x: CW*0.38,    y: CH-m },
      // 13 - curva inf-esq
      { x: CW*0.25,    y: CH*0.72 },
      // 14 - lado esq sobe
      { x: m,          y: CH*0.60 },
      // 15 - volta ao inicio
      { x: m,          y: CH*0.46 },
    ];

    // Largada: xadrez VERTICAL (perpendicular ao trecho pts[0]->pts[1])
    // O trecho 0->1 e vertical, entao a largada e horizontal
    startRect = {
      x: m - TW*0.5,
      y: CH*0.46 - TW*0.5,
      w: TW,
      h: TW,
    };

    // Checkpoints (brancos, circulares)
    cps = [
      { x: CW*0.50, y: CH*0.33, r: TW*0.52, lbl:'CP 1', ok:false },  // V fundo
      { x: CW-m,    y: CH*0.55, r: TW*0.52, lbl:'CP 2', ok:false },  // lado dir
      { x: CW*0.50, y: CH-m,    r: TW*0.52, lbl:'CP 3', ok:false },  // baixo
    ];

    // Obstaculos (tocos de madeira) - DENTRO da faixa da pista
    obstacles = [
      { x: CW*0.38, y: m + TW*0.3,         r: 8 },
      { x: CW*0.62, y: m + TW*0.3,         r: 8 },
      { x: CW-m,    y: CH*0.35,             r: 7 },
      { x: CW*0.70, y: CH*0.72 + TW*0.1,   r: 8 },
      { x: CW*0.50, y: CH-m - TW*0.2,      r: 7 },
    ];

    // ── POÇAS DE AGUA NA PISTA (aneis azuis claros da imagem) ──
    // Imagem: 2 aneis azuis - sup-dir e mid-dir
    puddleZones = [
      { x: CW*0.77, y: CH*0.12, r: TW*0.38 },  // sup-dir
      { x: CW*0.80, y: CH*0.60, r: TW*0.38 },  // mid-dir
    ];

    // ── GRAMA NA PISTA (retangulos verde-claro da imagem) ──
    // Imagem: 2 retangulos - baixo-esq e baixo-dir da curva U
    grassOnTrack = [
      { x: CW*0.28, y: CH*0.78, w: TW*0.7, h: TW*0.55 },  // esq da curva U
      { x: CW*0.62, y: CH*0.78, w: TW*0.7, h: TW*0.55 },  // dir da curva U
    ];

    // ── INTERIOR DA PISTA (areas de respawn) ──
    // Calculadas para NÃO incluir a faixa da pista
    // Regiao central grande (grama/arvores escuras)
    // IMPORTANTE: essas regioes ficam BEM DENTRO do loop
    var innerX = m + TW + 5;
    var innerY = m + TW + 5;
    var innerW = CW - 2*(m + TW) - 10;
    var innerH = CH - 2*(m + TW) - 10;

    // Dividimos o interior em zonas mais precisas
    innerBounds = [
      // LAGO (centro, oval)
      { type:'lake',  x: CW*0.38, y: CH*0.32, w: CW*0.20, h: CH*0.20, shape:'ellipse' },
      // GRAMA INTERNA (todo o resto do interior que nao e o lago)
      // Usamos 4 quadrantes ao redor do lago
      { type:'grass', x: innerX,           y: innerY,           w: CW*0.36-innerX,         h: innerH },  // esq
      { type:'grass', x: CW*0.60,          y: innerY,           w: innerX+innerW-CW*0.60,  h: innerH },  // dir
      { type:'grass', x: CW*0.36,          y: innerY,           w: CW*0.24,                h: CH*0.30 }, // topo-centro
      { type:'grass', x: CW*0.36,          y: CH*0.54,          w: CW*0.24,                h: innerY+innerH-CH*0.54 }, // base-centro
    ];
  }

  // ── VERIFICACAO SE ESTA NA PISTA ─────────────────────────
  // Usa distancia ao caminho central +/- TW/2
  function isOnTrack(pos){
    var minDist = Infinity;
    for(var i=0;i<pts.length-1;i++){
      var ax=pts[i].x, ay=pts[i].y, bx=pts[i+1].x, by=pts[i+1].y;
      var dx=bx-ax, dy=by-ay;
      var len=Math.sqrt(dx*dx+dy*dy);
      if(len<1) continue;
      var t=((pos.x-ax)*dx+(pos.y-ay)*dy)/(len*len);
      t=Math.max(0,Math.min(1,t));
      var px=ax+t*dx, py=ay+t*dy;
      var d=Math.sqrt((pos.x-px)*(pos.x-px)+(pos.y-py)*(pos.y-py));
      if(d<minDist) minDist=d;
    }
    // Tampinha esta na pista se distancia ao caminho < TW/2 + raio
    return minDist < (TW*0.65 + 16);
  }

  // Detect zona interna (apenas se FORA da pista)
  function detectInner(pos){
    if(isOnTrack(pos)) return null; // esta na pista, nao ativa zona interna
    for(var i=0;i<innerBounds.length;i++){
      var z=innerBounds[i];
      if(z.shape==='ellipse'){
        var ex=(pos.x-(z.x+z.w/2))/(z.w/2);
        var ey=(pos.y-(z.y+z.h/2))/(z.h/2);
        if(ex*ex+ey*ey<=1) return z.type;
      } else {
        if(pos.x>=z.x&&pos.x<=z.x+z.w&&pos.y>=z.y&&pos.y<=z.y+z.h) return z.type;
      }
    }
    // Se fora da pista e fora de qualquer zona mapeada, ainda respawna
    // (evita sair pelos lados)
    var onAnyZone=false;
    if(!onAnyZone && !isOnTrack(pos)){
      // Verifica se esta nas bordas externas
      var m=TW*0.8;
      var inBorder=(pos.x<m-14||pos.x>CW-m+14||pos.y<m-14||pos.y>CH-m+14);
      if(!inBorder) return 'grass'; // interior nao mapeado = grama
    }
    return null;
  }

  // Detecta poça de agua NA PISTA
  function detectPuddle(pos){
    for(var i=0;i<puddleZones.length;i++){
      var p=puddleZones[i];
      var dx=pos.x-p.x, dy=pos.y-p.y;
      if(Math.sqrt(dx*dx+dy*dy)<p.r+14) return true;
    }
    return false;
  }

  // Detecta grama NA PISTA
  function detectGrassOnTrack(pos){
    for(var i=0;i<grassOnTrack.length;i++){
      var g=grassOnTrack[i];
      if(pos.x>=g.x-14&&pos.x<=g.x+g.w+14&&pos.y>=g.y-14&&pos.y<=g.y+g.h+14) return true;
    }
    return false;
  }

  // Checkpoints
  function resetCPs(){ cps.forEach(function(c){c.ok=false;}); }
  function checkCP(pos, onCp){
    for(var i=0;i<cps.length;i++){
      var c=cps[i]; if(c.ok) continue;
      var dx=pos.x-c.x, dy=pos.y-c.y;
      if(Math.sqrt(dx*dx+dy*dy)<c.r){ c.ok=true; if(onCp)onCp(c); return c; }
    }
    return null;
  }
  function lastCP(){
    var l=null; cps.forEach(function(c){if(c.ok)l=c;}); return l;
  }
  function checkLap(pos){
    if(!startRect) return false;
    var s=startRect;
    return(pos.x>=s.x-8&&pos.x<=s.x+s.w+8&&pos.y>=s.y-8&&pos.y<=s.y+s.h+8);
  }
  function checkObstacles(pos, r){
    for(var i=0;i<obstacles.length;i++){
      var o=obstacles[i];
      var dx=pos.x-o.x, dy=pos.y-o.y;
      var dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<r+o.r) return{obs:o,nx:dx/dist,ny:dy/dist};
    }
    return null;
  }
  function getStartPos(){
    if(!startRect) return{x:80,y:CH/2};
    return{x:startRect.x+startRect.w+20, y:startRect.y+startRect.h/2};
  }

  // ── RENDER ────────────────────────────────────────────────
  function render(ctx, cw, ch, t){
    if(!pts.length) init(cw,ch);

    // Fundo
    ctx.fillStyle='#1A1208';
    ctx.fillRect(0,0,cw,ch);
    // Cascalho
    ctx.fillStyle='rgba(70,50,30,.35)';
    for(var i=0;i<240;i++) ctx.fillRect((i*137.5)%cw,(i*97.3)%ch,2,2);

    // ── Interior: grama escura + arvores ──────────────
    // Regiao interna grande
    var m2=TW*0.8;
    ctx.fillStyle='#0D2B0D';
    roundRect(ctx, m2+TW, m2+TW, cw-2*(m2+TW), ch-2*(m2+TW), 12);
    ctx.fill();

    // Textura de grama (linhas diagonais verdes)
    ctx.strokeStyle='rgba(0,140,0,.2)';
    ctx.lineWidth=1;
    for(var gx=0;gx<cw;gx+=7){
      ctx.beginPath();
      ctx.moveTo(gx,0); ctx.lineTo(gx-20,ch);
      ctx.stroke();
    }

    // Arvores (clusters de circulos)
    var treePos=[
      [cw*0.20,ch*0.25],[cw*0.30,ch*0.40],[cw*0.18,ch*0.55],
      [cw*0.72,ch*0.22],[cw*0.80,ch*0.38],[cw*0.75,ch*0.50],
      [cw*0.25,ch*0.65],[cw*0.70,ch*0.65],
    ];
    treePos.forEach(function(tp){
      // tronco
      ctx.fillStyle='#3D2008';
      ctx.fillRect(tp[0]-3,tp[1]+10,6,12);
      // copa
      [14,9,5].forEach(function(r2,li){
        ctx.fillStyle=['#1A5C1A','#27862A','#38B838'][li];
        ctx.beginPath();ctx.arc(tp[0],tp[1],r2,0,Math.PI*2);ctx.fill();
      });
    });

    // Lago (centro interior)
    var lx=innerBounds[0];
    if(lx){
      var lgrd=ctx.createRadialGradient(lx.x+lx.w/2,lx.y+lx.h/2,4,lx.x+lx.w/2,lx.y+lx.h/2,lx.w/2);
      lgrd.addColorStop(0,'rgba(0,120,230,.85)');
      lgrd.addColorStop(.6,'rgba(0,70,180,.65)');
      lgrd.addColorStop(1,'rgba(0,40,120,.4)');
      ctx.fillStyle=lgrd;
      ctx.beginPath();
      ctx.ellipse(lx.x+lx.w/2,lx.y+lx.h/2,lx.w/2,lx.h/2,0,0,Math.PI*2);
      ctx.fill();
      // ondas
      for(var wi=1;wi<=3;wi++){
        ctx.strokeStyle='rgba(100,200,255,'+(0.25+Math.sin(t*1.5+wi)*.1)+')';
        ctx.lineWidth=1;
        ctx.beginPath();
        ctx.ellipse(lx.x+lx.w/2,lx.y+lx.h/2,lx.w/2*wi/3.8,lx.h/2*wi/3.8,Math.sin(t*.5)*0.1,0,Math.PI*2);
        ctx.stroke();
      }
    }

    // ── Borda e faixa da pista ──────────────────────────
    drawPath(ctx, TW+18, '#2A1F18');
    drawPath(ctx, TW,    '#5C4530');
    // textura asfalto (linhas finas)
    ctx.save();
    ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.lineWidth=1;
    ctx.setLineDash([4,8]);
    drawPathStroke(ctx, TW*0.7);
    ctx.setLineDash([]); ctx.restore();

    // Linha central tracejada dourada
    ctx.save();
    ctx.strokeStyle='rgba(255,215,0,.35)'; ctx.lineWidth=2; ctx.setLineDash([12,10]);
    drawPathStroke(ctx, 0);
    ctx.setLineDash([]); ctx.restore();

    // ── Poças de agua NA PISTA ──────────────────────────
    puddleZones.forEach(function(p){
      // Anel azul claro
      ctx.strokeStyle='rgba(100,200,255,.9)';
      ctx.lineWidth=4;
      ctx.setLineDash([8,4]);
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);
      // preenchimento agua
      var wgrd=ctx.createRadialGradient(p.x,p.y,2,p.x,p.y,p.r);
      wgrd.addColorStop(0,'rgba(0,160,255,.45)');
      wgrd.addColorStop(1,'rgba(0,100,200,.15)');
      ctx.fillStyle=wgrd;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
      // onda animada
      ctx.strokeStyle='rgba(150,230,255,'+(0.3+Math.sin(t*2)*.1)+')';
      ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r*.6,Math.sin(t)*.3,Math.PI+Math.sin(t)*.3);ctx.stroke();
    });

    // ── Grama NA PISTA (verde claro) ──────────────────
    grassOnTrack.forEach(function(g){
      ctx.fillStyle='rgba(60,200,60,.35)';
      ctx.fillRect(g.x,g.y,g.w,g.h);
      ctx.strokeStyle='rgba(80,230,80,.8)';
      ctx.lineWidth=2;
      ctx.strokeRect(g.x,g.y,g.w,g.h);
      // listras de grama
      for(var gi=0;gi<g.w;gi+=5){
        var gbh=3+Math.sin(gi*.8)*2;
        ctx.strokeStyle='rgba(50,220,50,.5)';
        ctx.lineWidth=1;
        ctx.beginPath();
        ctx.moveTo(g.x+gi,g.y+g.h);
        ctx.lineTo(g.x+gi+2,g.y+g.h-gbh);
        ctx.lineTo(g.x+gi+4,g.y+g.h);
        ctx.stroke();
      }
    });

    // ── Obstaculos (tocos) ─────────────────────────────
    obstacles.forEach(function(o){
      ctx.fillStyle='rgba(0,0,0,.3)';
      ctx.beginPath();ctx.ellipse(o.x+3,o.y+3,o.r+2,o.r+1,0,0,Math.PI*2);ctx.fill();
      // toco
      ctx.fillStyle='#5C3A1A';
      ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#7A5030';
      ctx.beginPath();ctx.arc(o.x-1,o.y-2,o.r*.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#3A2010';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle='rgba(80,45,15,.5)';ctx.lineWidth=.8;
      ctx.beginPath();ctx.arc(o.x,o.y,o.r*.55,0,Math.PI*2);ctx.stroke();
    });

    // ── Largada: xadrez horizontal ─────────────────────
    if(startRect){
      var sl=startRect;
      var sq=8;
      var nc=Math.ceil(sl.w/sq), nr=Math.ceil(sl.h/sq);
      for(var r=0;r<nr;r++) for(var c=0;c<nc;c++){
        ctx.fillStyle=(r+c)%2===0?'#FFF':'#111';
        ctx.fillRect(sl.x+c*sq,sl.y+r*sq,sq,sq);
      }
      ctx.strokeStyle='#FFD700';ctx.lineWidth=2;
      ctx.strokeRect(sl.x,sl.y,sl.w,sl.h);
      ctx.fillStyle='#FFD700';
      ctx.font='bold 9px Rajdhani,sans-serif';
      ctx.textAlign='center';
      ctx.fillText('START/FINISH',sl.x+sl.w/2,sl.y-5);
    }

    // ── Checkpoints ─────────────────────────────────────
    cps.forEach(function(c){
      ctx.save();
      ctx.globalAlpha=c.ok?.25:.9;
      // Mancha branca
      ctx.fillStyle=c.ok?'rgba(40,40,40,.3)':'rgba(255,255,255,.15)';
      ctx.beginPath();ctx.arc(c.x,c.y,c.r*.65,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=c.ok?'#333':'#FFF';
      ctx.lineWidth=3;ctx.setLineDash([5,3]);
      ctx.beginPath();ctx.arc(c.x,c.y,c.r*.65,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle=c.ok?'#333':'#FFF';
      ctx.font='bold 10px Rajdhani,sans-serif';
      ctx.textAlign='center';
      ctx.fillText(c.lbl,c.x,c.y-c.r*.65-5);
      ctx.restore();
    });
  }

  // Helpers de desenho
  function drawPath(ctx, width, color){
    if(!pts.length) return;
    ctx.save();
    ctx.strokeStyle=color; ctx.lineWidth=width;
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(function(p,i){if(i>0)ctx.lineTo(p.x,p.y);});
    ctx.closePath();ctx.stroke();ctx.restore();
  }
  function drawPathStroke(ctx, offset){
    if(!pts.length) return;
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(function(p,i){if(i>0)ctx.lineTo(p.x,p.y);});
    ctx.closePath();ctx.stroke();
  }
  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }

  return {
    META:META, init:init, render:render,
    isOnTrack:isOnTrack,
    detectInner:detectInner,
    detectPuddle:detectPuddle,
    detectGrassOnTrack:detectGrassOnTrack,
    checkCP:checkCP, checkLap:checkLap, resetCPs:resetCPs,
    checkObstacles:checkObstacles, lastCP:lastCP,
    getStartPos:getStartPos,
    get checkpoints(){ return cps; },
    get TW(){ return TW; },
  };
})();
"""

# ============================================================
# CAP SPRITE - Tampinha de refrigerante/cerveja realista
# Yuki: Samoeida correto, Kenta: Maine Coon
# ============================================================
CAP_SPRITE = r"""// CapSprite.js - Tampinhas de garrafa (coroa metalica) + Pilotos anime
var CapSprite = (function(){

  // Desenha uma tampinha realista (coroa de garrafa)
  // color = cor principal, pilotKanji = kanji no centro
  function drawCap(ctx, x, y, radius, color, accentColor, kanji, rotation, speed, glowAlpha){
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Glow de velocidade
    if(speed > 80){
      ctx.shadowColor  = color;
      ctx.shadowBlur   = 10 + glowAlpha * 14;
    }

    // ── Corpo da tampinha (disco metalico) ──
    // Sombra projetada
    ctx.fillStyle='rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(3,4,radius,radius*.4,0,0,Math.PI*2);
    ctx.fill();

    // Aba ondulada da coroa (fundo mais escuro)
    var crownColor = shadeColor(color, -35);
    ctx.fillStyle = crownColor;
    ctx.beginPath();
    var n = 21; // dentes da coroa
    for(var i=0;i<n*2;i++){
      var ang = (i/n)*Math.PI;
      var r2  = i%2===0 ? radius : radius*.84;
      if(i===0) ctx.moveTo(Math.cos(ang)*r2, Math.sin(ang)*r2);
      else ctx.lineTo(Math.cos(ang)*r2, Math.sin(ang)*r2);
    }
    ctx.closePath();
    ctx.fill();

    // Disco principal (face da tampinha)
    var grad = ctx.createRadialGradient(-radius*.25,-radius*.25, radius*.05, 0,0, radius*.95);
    grad.addColorStop(0, lightenColor(color, 60));
    grad.addColorStop(0.4, color);
    grad.addColorStop(0.85, shadeColor(color,-20));
    grad.addColorStop(1, shadeColor(color,-40));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0,0,radius*.82,0,Math.PI*2);
    ctx.fill();

    // Anel metalico interno (borda impressa)
    ctx.strokeStyle = shadeColor(color,-25);
    ctx.lineWidth   = 1.8;
    ctx.beginPath();
    ctx.arc(0,0,radius*.72,0,Math.PI*2);
    ctx.stroke();

    // Area central (impressao)
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath();
    ctx.arc(0,0,radius*.60,0,Math.PI*2);
    ctx.fill();

    // Reflexo (brilho metalico)
    var refGrad = ctx.createRadialGradient(-radius*.3,-radius*.32,1,-radius*.2,-radius*.2,radius*.45);
    refGrad.addColorStop(0,'rgba(255,255,255,.55)');
    refGrad.addColorStop(0.5,'rgba(255,255,255,.12)');
    refGrad.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = refGrad;
    ctx.beginPath();
    ctx.arc(0,0,radius*.82,0,Math.PI*2);
    ctx.fill();

    // Kanji do piloto (nao rotaciona com a tampinha)
    ctx.rotate(-rotation);
    ctx.fillStyle   = '#FFF';
    ctx.font        = 'bold '+(radius*.55)+'px sans-serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.shadowBlur  = 0;
    ctx.fillText(kanji || '?', 0, 1);

    ctx.restore();
  }

  // Rastro / efeito dash de velocidade
  function drawTrail(ctx, trail, color, speed){
    if(!trail || trail.length<2) return;
    // Dash lines (linhas de velocidade)
    if(speed > 120){
      var dashCount = Math.min(5, Math.floor(speed/120));
      for(var d=0;d<dashCount;d++){
        var idx1 = Math.max(0, trail.length-2-d*2);
        var idx2 = Math.max(0, trail.length-4-d*2);
        if(idx1===idx2) break;
        var pt1=trail[idx1], pt2=trail[idx2];
        var dx=pt2.x-pt1.x, dy=pt2.y-pt1.y;
        var len=Math.sqrt(dx*dx+dy*dy);
        if(len<2) break;
        // perp offset para linhas de dash
        var px=-dy/len*3, py=dx/len*3;
        ctx.save();
        ctx.globalAlpha=(0.5-d*.08)*Math.min(1,speed/300);
        ctx.strokeStyle=color;
        ctx.lineWidth=1.5-d*.2;
        ctx.beginPath();
        ctx.moveTo(pt1.x+px,pt1.y+py);
        ctx.lineTo(pt2.x+px,pt2.y+py);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pt1.x-px,pt1.y-py);
        ctx.lineTo(pt2.x-px,pt2.y-py);
        ctx.stroke();
        ctx.restore();
      }
    }
    // Trilha de desvanecimento
    for(var i=0;i<trail.length-1;i++){
      var t=trail[i];
      var a=(i/trail.length)*0.28;
      ctx.save();
      ctx.globalAlpha=a;
      ctx.beginPath();
      ctx.arc(t.x,t.y,11*(i/trail.length)+1,0,Math.PI*2);
      ctx.fillStyle=color;
      ctx.fill();
      ctx.restore();
    }
  }

  // Helpers de cor
  function shadeColor(hex, pct){
    var n=parseInt(hex.replace('#',''),16);
    var r=Math.max(0,Math.min(255,((n>>16)&0xFF)+pct));
    var g=Math.max(0,Math.min(255,((n>>8)&0xFF)+pct));
    var b=Math.max(0,Math.min(255,(n&0xFF)+pct));
    return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }
  function lightenColor(hex,pct){ return shadeColor(hex,pct); }

  return { drawCap:drawCap, drawTrail:drawTrail };
})();
"""

# ============================================================
# YUKI.JS - Samoeida correto (nao e gato)
# ============================================================
YUKI = r"""// Yuki.js - Samoeida (cachorro branco neve) piloto Lendario
var Yuki = (function(){
  var A = {
    nome:'YUKI', raridade:'Lendario',
    velocidade:82, controle:91, aerodinamica:75,
    color:'#00E5FF', accentColor:'#00A5C8', kanji:'\u96EA'
  };
  var M = { spd:A.velocidade/100, ctrl:A.controle/100 };
  var anim = { rot:0, glow:0, gdir:1, trail:[], glowAlpha:0 };

  function render(ctx, ph, dt){
    var spd = ph.speed || ph.vel && ph.vel.magnitude() || 0;
    anim.rot     += spd * dt * 0.006;
    anim.glow    += 0.03 * anim.gdir;
    if(anim.glow>=1||anim.glow<=0) anim.gdir*=-1;
    anim.trail.push({x:ph.pos.x, y:ph.pos.y});
    if(anim.trail.length>20) anim.trail.shift();

    CapSprite.drawTrail(ctx, anim.trail, A.color, spd);
    CapSprite.drawCap(ctx, ph.pos.x, ph.pos.y, 16, A.color, A.accentColor, A.kanji,
                      anim.rot, spd, anim.glow);
  }
  function resetAnim(){ anim.rot=0; anim.trail=[]; anim.glow=0; }
  return { A:A, M:M, render:render, resetAnim:resetAnim };
})();
"""

# ============================================================
# GAMELOOP V3 - Corrigido: usa TrackV3, isOnTrack(), fisica correta
# ============================================================
GAMELOOP3 = r"""// GameLoop.js v3 - fisica corrigida, TrackV3, sons
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
    canvas.width  = Math.max(wrap.offsetWidth  - 155, 320);
    canvas.height = Math.max(wrap.offsetHeight, 280);
    TrackV3.init(canvas.width, canvas.height);
    var sp=TrackV3.getStartPos();
    Physics.reset(sp.x, sp.y, 'asfalto');
    Yuki.resetAnim();
    gs.respawn={x:sp.x,y:sp.y};
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 80);

  // Overlay → inicia
  function startGame(){
    SoundEngine.resume();
    overlay.style.display='none';
    gs.phase='AIM';
    if(canvas.width<50) resize();
    var sp=TrackV3.getStartPos();
    Physics.reset(sp.x,sp.y,'asfalto');
    gs.respawn={x:sp.x,y:sp.y};
  }
  overlay.addEventListener('click',   startGame);
  overlay.addEventListener('touchend',function(e){e.preventDefault();startGame();},{passive:false});
  overlay.style.cursor='pointer';

  // Input
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
    log('Lance: '+info.forcePct+'% / '+info.angle.toFixed(0)+' graus','ev');
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

  // Loop
  function loop(now){
    var dt=Math.min((now-lt)/1000, 0.05); lt=now; animT+=dt;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    TrackV3.render(ctx, canvas.width, canvas.height, animT);

    var ph=Physics.step(dt, bnd());

    if(ph.moving){
      // Obstaculos
      var obs=TrackV3.checkObstacles(ph.pos, CAP_R);
      if(obs){
        var dot=ph.vel.x*obs.nx+ph.vel.y*obs.ny;
        var nvx=(ph.vel.x-2*dot*obs.nx)*.78;
        var nvy=(ph.vel.y-2*dot*obs.ny)*.78;
        Physics.reset(ph.pos.x,ph.pos.y,'asfalto');
        // aplica nova velocidade simulando flick
        var tmpFrom=new Vector2D(ph.pos.x-nvx*0.05, ph.pos.y-nvy*0.05);
        var tmpTo  =new Vector2D(ph.pos.x+nvx*0.05, ph.pos.y+nvy*0.05);
        Physics.flick(tmpFrom, tmpTo, 1);
        SoundEngine.hit();
        log('Bateu em obstaculo!');
        ph=Physics.step(0,bnd());
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
        // Fora da pista
        var inner=TrackV3.detectInner(ph.pos);
        if(inner){
          var rp=gs.respawn||TrackV3.getStartPos();
          Physics.reset(rp.x,rp.y,'asfalto');
          log('Zona '+inner+' - voltando ao CP');
        }
      }
    }

    Yuki.render(ctx, ph, dt);
    if(gs.ds&&gs.dc) drawAim(ph.pos, gs.dc);

    if(gs.phase==='MOVING'){
      gs.elapsed=(performance.now()-gs.t0)/1000; updHUD();
      if(!ph.moving){ gs.phase='AIM'; log('Parou - mire novamente'); }

      TrackV3.checkCP(ph.pos, function(c){
        SoundEngine.checkpoint();
        gs.cp++; elCp.textContent=gs.cp+'/'+NCPS;
        gs.respawn={x:c.x,y:c.y};
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
"""

# ============================================================
# GAME.HTML solo
# ============================================================
GAME_HTML = r"""<!DOCTYPE html>
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
#panel{width:155px;flex-shrink:0;background:var(--panel);border-left:1px solid rgba(255,42,42,.2);display:flex;flex-direction:column;padding:9px;gap:9px;overflow:hidden;}
.pt{font-family:'Bebas Neue',sans-serif;font-size:.88rem;letter-spacing:2px;color:var(--red);border-bottom:1px solid rgba(255,42,42,.25);padding-bottom:3px;}
#fbg{width:100%;height:100px;background:#1A1A28;border:1px solid #333;border-radius:4px;position:relative;overflow:hidden;}
#force-bar-fill{position:absolute;bottom:0;left:0;right:0;height:0%;background:linear-gradient(0deg,var(--red),var(--gold));transition:height .05s;}
#flbl{font-size:.65rem;color:#666680;letter-spacing:1px;text-transform:uppercase;text-align:center;}
#force-value{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;color:var(--gold);text-align:center;}
#cc{background:#1A1A28;border:1px solid rgba(255,42,42,.3);border-radius:6px;padding:7px;text-align:center;}
.cn-av{width:52px;height:52px;border-radius:50%;margin:0 auto 5px;border:2px solid var(--acc);display:flex;align-items:center;justify-content:center;}
#cnm{font-family:'Bebas Neue',sans-serif;font-size:.88rem;color:var(--acc);letter-spacing:2px;}
.ar{display:flex;justify-content:space-between;font-size:.65rem;color:#666680;margin-top:2px;}
.av{color:var(--gold);font-weight:700;}
#log-box{flex:1;overflow-y:auto;font-size:.6rem;color:#555570;}
#log-box p{padding:2px 0;border-bottom:1px solid #1A1A28;}
#log-box p.ev{color:var(--gold);}
#overlay{position:absolute;left:0;top:0;right:155px;bottom:0;background:rgba(0,0,0,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:20;cursor:pointer;}
#overlay h2{font-family:'Bebas Neue',sans-serif;font-size:2.2rem;letter-spacing:5px;color:var(--gold);text-shadow:0 0 20px rgba(255,215,0,.5);margin-bottom:.5rem;}
#overlay p{color:#AAA;letter-spacing:2px;font-size:.85rem;margin:.2rem 0;}
.pulse{animation:pulse 1.2s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
#btnBack{position:absolute;top:8px;left:8px;z-index:25;background:rgba(255,42,42,.15);border:1px solid var(--red);color:var(--red);font-family:'Rajdhani',sans-serif;font-size:.75rem;letter-spacing:2px;padding:3px 8px;cursor:pointer;border-radius:3px;text-decoration:none;}
#btnBack:hover{background:var(--red);color:#fff;}
#btnMulti{position:absolute;top:8px;right:168px;z-index:25;background:rgba(0,229,255,.15);border:1px solid var(--acc);color:var(--acc);font-family:'Rajdhani',sans-serif;font-size:.75rem;letter-spacing:2px;padding:3px 8px;cursor:pointer;border-radius:3px;text-decoration:none;}
#btnMulti:hover{background:var(--acc);color:#000;}
/* Legenda superficies */
#surf-legend{font-size:.6rem;color:#666680;margin-top:4px;}
.sl-row{display:flex;align-items:center;gap:4px;margin:2px 0;}
.sl-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
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
      <div id="log-box"></div>
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
// Preview da tampinha no painel
(function(){
  var cv=document.getElementById('capPreview');
  if(!cv) return;
  var cx=cv.getContext('2d');
  function drawPreview(){
    cx.clearRect(0,0,52,52);
    CapSprite.drawCap(cx,26,26,22,'#00E5FF','#00A5C8','\u96EA',Date.now()*0.001,0,0.5);
    requestAnimationFrame(drawPreview);
  }
  requestAnimationFrame(drawPreview);
})();
</script>
</body>
</html>
"""

# ============================================================
# MULTIPLAYER HTML - Local + Online (lobby de escolha)
# ============================================================
MULTI_LOBBY = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush - Multiplayer</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--acc:#00E5FF;--muted:#666680;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;background:var(--dark);font-family:'Rajdhani',sans-serif;color:#E8E8F0;overflow:hidden;}
body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(255,42,42,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,42,42,.04) 1px,transparent 1px);background-size:40px 40px;z-index:0;pointer-events:none;animation:gm 8s linear infinite;}
@keyframes gm{to{background-position:0 40px;}}
.center{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:2rem;padding:2rem;}
h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,8vw,5rem);letter-spacing:6px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-align:center;}
.sub{color:var(--muted);letter-spacing:4px;font-size:.9rem;text-transform:uppercase;text-align:center;margin-top:-.5rem;}
.cards{display:flex;gap:2rem;flex-wrap:wrap;justify-content:center;}
.mode-card{
  width:260px;padding:2rem 1.5rem;
  background:rgba(14,14,26,.95);
  border:1px solid rgba(255,255,255,.08);
  border-radius:16px;
  text-align:center;
  cursor:pointer;
  transition:transform .2s,box-shadow .2s,border-color .2s;
  text-decoration:none;
  display:flex;flex-direction:column;align-items:center;gap:1rem;
}
.mode-card:hover{transform:translateY(-8px);box-shadow:0 24px 60px rgba(0,0,0,.6);}
.mode-card.local:hover{border-color:var(--acc);box-shadow:0 24px 60px rgba(0,229,255,.15);}
.mode-card.online:hover{border-color:var(--gold);box-shadow:0 24px 60px rgba(255,215,0,.15);}
.mode-icon{font-size:3rem;line-height:1;}
.mode-title{font-family:'Bebas Neue',sans-serif;font-size:1.8rem;letter-spacing:4px;}
.mode-desc{font-size:.82rem;color:var(--muted);line-height:1.5;}
.mode-badge{font-size:.65rem;letter-spacing:3px;padding:3px 10px;border-radius:4px;text-transform:uppercase;}
.local .mode-title{color:var(--acc);}
.online .mode-title{color:var(--gold);}
.local .mode-badge{background:rgba(0,229,255,.15);color:var(--acc);border:1px solid rgba(0,229,255,.3);}
.online .mode-badge{background:rgba(255,215,0,.15);color:var(--gold);border:1px solid rgba(255,215,0,.3);}
.back-link{color:var(--muted);font-size:.8rem;letter-spacing:2px;text-decoration:none;text-transform:uppercase;margin-top:1rem;}
.back-link:hover{color:var(--gold);}
</style>
</head>
<body>
<div class="center">
  <h1>MULTIPLAYER</h1>
  <p class="sub">Escolha o modo de jogo</p>
  <div class="cards">
    <a href="game-multi-local.html" class="mode-card local">
      <div class="mode-icon">&#128101;</div>
      <div class="mode-title">LOCAL</div>
      <div class="mode-desc">2 jogadores no mesmo dispositivo. Turnos alternados. Ideal para jogar lado a lado.</div>
      <div class="mode-badge">Disponivel agora</div>
    </a>
    <a href="game-multi-online.html" class="mode-card online">
      <div class="mode-icon">&#127760;</div>
      <div class="mode-title">ONLINE</div>
      <div class="mode-desc">Duelo com jogador remoto via internet. Encontre oponentes ou desafie um amigo pelo codigo da sala.</div>
      <div class="mode-badge">Beta</div>
    </a>
  </div>
  <a href="game.html" class="back-link">&larr; Voltar ao Solo</a>
</div>
</body>
</html>
"""

# ============================================================
# MULTIPLAYER LOCAL - Motor proprio, sem singleton Physics
# ============================================================
MULTI_LOCAL = r"""<!DOCTYPE html>
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
#wrap{position:relative;flex:1;min-height:0;}
#gameCanvas{display:block;width:100%;height:100%;cursor:crosshair;}
#turn-banner{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  font-family:'Bebas Neue',sans-serif;font-size:2.5rem;letter-spacing:6px;
  pointer-events:none;opacity:0;transition:opacity .3s;z-index:15;
  text-shadow:0 0 30px currentColor;}
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
// ── Motor fisico independente (sem singleton) ─────────────────
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
      return{forcePct:Math.round(t*100)};
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

// ── Clonador de CPs por jogador ───────────────────────────────
function cloneCPs(master){
  return master.map(function(c){ return{x:c.x,y:c.y,r:c.r,lbl:c.lbl,ok:false}; });
}

// ── Setup ─────────────────────────────────────────────────────
SoundEngine.init();
var canvas=document.getElementById('gameCanvas');
var ctx=canvas.getContext('2d');
var overlay=document.getElementById('overlay');
var tb=document.getElementById('turn-banner');
var LAPS=2,NCPS=3,CAP_R=16;

// Jogadores
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

var cur=0; // turno atual
var phase='WAIT';
var ds=null,dc=null;
var sndT={water:0,grass:0};

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
}

function cpos(e){var r=canvas.getBoundingClientRect();return new Vector2D(e.clientX-r.left,e.clientY-r.top);}
function bnd(){return{x:0,y:0,w:canvas.width,h:canvas.height};}

function nearActive(pt){ var ph=P[cur].phys.snap(); return pt.distanceTo(ph.pos)<52; }

canvas.addEventListener('mousedown',function(e){
  if(phase!=='AIM')return;SoundEngine.resume();
  if(nearActive(cpos(e))){ds=cpos(e);dc=cpos(e);}
});
canvas.addEventListener('mousemove',function(e){if(!ds)return;dc=cpos(e);});
canvas.addEventListener('mouseup',function(e){
  if(!ds||phase!=='AIM')return;
  doFlick(cpos(e));
});
canvas.addEventListener('touchstart',function(e){
  if(phase!=='AIM')return;SoundEngine.resume();
  if(nearActive(cpos(e.touches[0]))){ds=cpos(e.touches[0]);dc=cpos(e.touches[0]);}
},{passive:true});
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

  // Passo do jogador ativo
  if(phase==='MOVING'){
    var p=P[cur];
    var ph=p.phys.step(dt,bnd());

    // Obstaculos
    var obs=TrackV3.checkObstacles(ph.pos,CAP_R);
    if(obs){
      var dot=ph.vel.x*obs.nx+ph.vel.y*obs.ny;
      var nvx=(ph.vel.x-2*dot*obs.nx)*.78;
      var nvy=(ph.vel.y-2*dot*obs.ny)*.78;
      p.phys.reset(ph.pos.x,ph.pos.y,'asfalto');
      var tf=new Vector2D(ph.pos.x-nvx*.05,ph.pos.y-nvy*.05);
      var tt=new Vector2D(ph.pos.x+nvx*.05,ph.pos.y+nvy*.05);
      p.phys.flick(tf,tt,1);
      SoundEngine.hit();
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
      } else { p.phys.setSurface('asfalto'); }
    } else {
      var inner=TrackV3.detectInner(ph.pos);
      if(inner){
        var rp=p.respawn||TrackV3.getStartPos();
        p.phys.reset(rp.x,rp.y,'asfalto');
        ph=p.phys.snap();
      }
    }

    // Checkpoints do jogador
    for(var ci=0;ci<p.cps.length;ci++){
      var c=p.cps[ci]; if(c.ok) continue;
      var dx=ph.pos.x-c.x,dy=ph.pos.y-c.y;
      if(Math.sqrt(dx*dx+dy*dy)<c.r){
        c.ok=true; p.cp++; p.respawn={x:c.x,y:c.y};
        SoundEngine.checkpoint();
        document.getElementById('p'+p.id+'-lap').textContent='V'+p.lap+'/'+LAPS+' CP'+p.cp+'/'+NCPS;
      }
    }

    // Chegada
    if(p.cp>=NCPS&&TrackV3.checkLap(ph.pos)){
      p.cp=0; p.cps=cloneCPs(TrackV3.checkpoints);
      if(p.lap>=LAPS){
        p.finished=true; p.elapsed=(performance.now()-p.t0)/1000;
        SoundEngine.victory();
        onWin(p); return;
      } else { p.lap++; }
      document.getElementById('p'+p.id+'-lap').textContent='V'+p.lap+'/'+LAPS+' CP0/'+NCPS;
    }

    p.elapsed=(performance.now()-p.t0)/1000;
    document.getElementById('p'+p.id+'-time').textContent=fmt(p.elapsed);

    if(!ph.moving){
      phase='AIM';
      // Alterna turno
      var other=P[1-cur];
      if(!other.finished){ cur=1-cur; showTurn(); }
    }
  }

  // Renderiza os 2 jogadores
  P.forEach(function(p){
    var ph=p.phys.snap();
    var spd=ph.speed;
    p.anim.rot+=spd*dt*.006;
    p.anim.glow+=.03*p.anim.gdir; if(p.anim.glow>=1||p.anim.glow<=0) p.anim.gdir*=-1;
    p.anim.trail.push({x:ph.pos.x,y:ph.pos.y});
    if(p.anim.trail.length>20) p.anim.trail.shift();
    CapSprite.drawTrail(ctx,p.anim.trail,p.color,spd);
    CapSprite.drawCap(ctx,ph.pos.x,ph.pos.y,16,p.color,p.accent,p.kanji,p.anim.rot,spd,p.anim.glow);
    // Indicador de turno ativo
    if(P[cur]===p&&phase==='AIM'){
      ctx.save();ctx.strokeStyle=p.color;ctx.lineWidth=2;
      var pulse=Math.sin(Date.now()*.004)*4;
      ctx.beginPath();ctx.arc(ph.pos.x,ph.pos.y,23+pulse,0,Math.PI*2);ctx.stroke();
      ctx.restore();
    }
  });

  // Linha de mira
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
    ctx.setLineDash([]);
    ctx.restore();
  }

  requestAnimationFrame(loop);
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

requestAnimationFrame(function(t){lt=t;requestAnimationFrame(loop);});
</script>
</body>
</html>
"""

# ============================================================
# MULTIPLAYER ONLINE (WebSocket)
# ============================================================
MULTI_ONLINE = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush - Online</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--acc:#00E5FF;--muted:#666680;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;background:var(--dark);font-family:'Rajdhani',sans-serif;color:#E8E8F0;overflow:hidden;}
body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(255,42,42,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,42,42,.04) 1px,transparent 1px);background-size:40px 40px;z-index:0;pointer-events:none;}
.center{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;gap:1.5rem;padding:2rem;text-align:center;}
h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(2rem,7vw,4rem);letter-spacing:6px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.sub{color:var(--muted);letter-spacing:3px;font-size:.85rem;text-transform:uppercase;}
.panel{background:rgba(14,14,26,.95);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:2rem;width:100%;max-width:440px;display:flex;flex-direction:column;gap:1rem;}
.section-title{font-family:'Bebas Neue',sans-serif;font-size:1.1rem;letter-spacing:3px;color:var(--gold);border-bottom:1px solid rgba(255,215,0,.2);padding-bottom:.4rem;}
input{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.15);border-radius:6px;padding:.7rem 1rem;color:#E8E8F0;font-family:'Rajdhani',sans-serif;font-size:1rem;letter-spacing:2px;width:100%;text-transform:uppercase;outline:none;}
input:focus{border-color:var(--acc);}
input::placeholder{color:#444;text-transform:none;}
.btn{font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:3px;padding:.7rem 1.5rem;border:1px solid;border-radius:6px;cursor:pointer;transition:all .2s;background:transparent;width:100%;}
.btn-create{color:var(--gold);border-color:var(--gold);}
.btn-create:hover{background:var(--gold);color:var(--dark);}
.btn-join{color:var(--acc);border-color:var(--acc);}
.btn-join:hover{background:var(--acc);color:var(--dark);}
#status{font-size:.82rem;color:var(--muted);letter-spacing:2px;min-height:1.2rem;}
#status.ok{color:#00FF88;}
#status.err{color:var(--red);}
.room-code{font-family:'Bebas Neue',sans-serif;font-size:2.5rem;letter-spacing:10px;color:var(--gold);background:rgba(255,215,0,.08);padding:.5rem 1rem;border-radius:8px;border:1px solid rgba(255,215,0,.25);display:none;}
.back-link{color:var(--muted);font-size:.8rem;letter-spacing:2px;text-decoration:none;text-transform:uppercase;margin-top:1rem;}
.back-link:hover{color:var(--gold);}
.ws-note{font-size:.72rem;color:#444;letter-spacing:1px;line-height:1.6;margin-top:.5rem;}
</style>
</head>
<body>
<div class="center">
  <h1>ONLINE 1v1</h1>
  <p class="sub">Duelo via internet (Beta)</p>
  <div class="panel">
    <div class="section-title">CRIAR SALA</div>
    <input id="nickCreate" placeholder="Seu nickname" maxlength="16"/>
    <button class="btn btn-create" onclick="createRoom()">CRIAR SALA E AGUARDAR</button>
    <div class="room-code" id="roomCode">----</div>

    <div class="section-title" style="margin-top:.5rem">ENTRAR EM SALA</div>
    <input id="nickJoin"   placeholder="Seu nickname" maxlength="16"/>
    <input id="roomInput"  placeholder="Codigo da sala (4 letras)" maxlength="4"/>
    <button class="btn btn-join" onclick="joinRoom()">ENTRAR NA SALA</button>
    <div id="status">Conectando ao servidor...</div>
    <p class="ws-note">
      O servidor WebSocket deve estar rodando.<br>
      Execute: <strong style="color:#888">node server/ws-server.js</strong><br>
      Porta padrao: 8765
    </p>
  </div>
  <a href="game-multi.html" class="back-link">&larr; Voltar ao menu multiplayer</a>
</div>
<script>
var WS_URL='ws://localhost:8765';
var ws=null, myRoom=null, myNick='';

function setStatus(msg,cls){
  var el=document.getElementById('status');
  el.textContent=msg; el.className=cls||'';
}

function connect(onOpen){
  try{
    ws=new WebSocket(WS_URL);
    ws.onopen=function(){ setStatus('Conectado ao servidor','ok'); if(onOpen)onOpen(); };
    ws.onerror=function(){ setStatus('Servidor offline. Inicie ws-server.js','err'); };
    ws.onclose=function(){ setStatus('Desconectado.','err'); };
    ws.onmessage=function(e){
      var d=JSON.parse(e.data);
      if(d.type==='room_created'){
        var rc=document.getElementById('roomCode');
        rc.textContent=d.room; rc.style.display='block';
        setStatus('Aguardando oponente...','');
        myRoom=d.room;
      }
      if(d.type==='game_start'){
        setStatus('Oponente encontrado! Iniciando...','ok');
        setTimeout(function(){
          window.location.href='game-multi-local.html?online=1&room='+myRoom+'&nick='+myNick;
        },1200);
      }
      if(d.type==='error'){ setStatus(d.msg,'err'); }
    };
  }catch(e){ setStatus('WebSocket nao suportado.','err'); }
}

function createRoom(){
  myNick=document.getElementById('nickCreate').value.trim()||'Jogador1';
  connect(function(){
    ws.send(JSON.stringify({type:'create',nick:myNick}));
  });
}
function joinRoom(){
  myNick=document.getElementById('nickJoin').value.trim()||'Jogador2';
  var room=document.getElementById('roomInput').value.toUpperCase().trim();
  if(!room){setStatus('Digite o codigo da sala','err');return;}
  connect(function(){
    ws.send(JSON.stringify({type:'join',nick:myNick,room:room}));
  });
}

// tenta conectar ao iniciar para mostrar status
setTimeout(function(){
  try{
    var testWs=new WebSocket(WS_URL);
    testWs.onopen=function(){setStatus('Servidor disponivel','ok');testWs.close();};
    testWs.onerror=function(){setStatus('Servidor offline. Execute ws-server.js para jogar online','err');};
  }catch(e){}
},500);
</script>
</body>
</html>
"""

# ============================================================
# WEBSOCKET SERVER (Node.js)
# ============================================================
WS_SERVER = r"""// server/ws-server.js
// Servidor WebSocket para multiplayer online do CapRush
// Instalar: npm install ws
// Rodar: node ws-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8765 });

const rooms = {}; // { code: { p1, p2 } }

function genCode(){
  return Math.random().toString(36).substr(2,4).toUpperCase();
}

wss.on('connection', function(ws){
  ws.on('message', function(raw){
    let d;
    try{ d=JSON.parse(raw); }catch(e){ return; }

    if(d.type==='create'){
      const code=genCode();
      rooms[code]={ p1:ws, p2:null, nick1:d.nick, nick2:null };
      ws.roomCode=code; ws.role='p1';
      ws.send(JSON.stringify({type:'room_created', room:code, nick:d.nick}));
      console.log('[ROOM] Criada:', code, 'por', d.nick);
    }

    if(d.type==='join'){
      const room=rooms[d.room];
      if(!room){ ws.send(JSON.stringify({type:'error',msg:'Sala nao encontrada'})); return; }
      if(room.p2){ ws.send(JSON.stringify({type:'error',msg:'Sala cheia'})); return; }
      room.p2=ws; room.nick2=d.nick;
      ws.roomCode=d.room; ws.role='p2';
      // Notifica ambos
      const start=JSON.stringify({type:'game_start', room:d.room, nick1:room.nick1, nick2:d.nick});
      room.p1.send(start);
      room.p2.send(start);
      console.log('[ROOM]', d.room, '- P2 entrou:', d.nick, '- Jogo iniciado!');
    }

    // Relay de movimentos (lances, posicoes)
    if(d.type==='move' || d.type==='state'){
      const room=rooms[ws.roomCode];
      if(!room) return;
      const other = ws.role==='p1' ? room.p2 : room.p1;
      if(other && other.readyState===WebSocket.OPEN){
        other.send(JSON.stringify(d));
      }
    }
  });

  ws.on('close', function(){
    if(ws.roomCode && rooms[ws.roomCode]){
      const room=rooms[ws.roomCode];
      const other = ws.role==='p1' ? room.p2 : room.p1;
      if(other && other.readyState===WebSocket.OPEN){
        other.send(JSON.stringify({type:'opponent_left'}));
      }
      delete rooms[ws.roomCode];
    }
  });
});

console.log('CapRush WS Server rodando na porta 8765');
"""

# ============================================================
# CAPRUSH-GAME.HTML (atualizado com nav)
# ============================================================
CAPRUSH_GAME = r"""<!DOCTYPE html>
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
#topbar{display:flex;align-items:center;justify-content:space-between;padding:8px 20px;background:rgba(8,8,18,.97);border-bottom:2px solid var(--red);height:46px;flex-shrink:0;}
.tlogo{font-family:'Bebas Neue',sans-serif;font-size:1.4rem;letter-spacing:4px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none;}
.tlinks{display:flex;gap:1.2rem;align-items:center;}
.tlinks a{color:#888;font-size:.75rem;letter-spacing:2px;text-decoration:none;text-transform:uppercase;transition:color .2s;}
.tlinks a:hover{color:var(--gold);}
.tbadge{background:var(--red);color:#fff;font-size:.6rem;letter-spacing:2px;padding:2px 7px;border-radius:2px;text-transform:uppercase;}
#gframe{width:100%;height:calc(100vh - 46px);border:none;display:block;}
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
        <a href="arquitetura.html">Arquitetura</a>
        <span class="tbadge">v0.2</span>
      </div>
    </div>
    <iframe id="gframe" src="client/game.html" allow="autoplay" title="CapRush Game"></iframe>
  </div>
</body>
</html>
"""

# ============================================================
# INDEX.HTML - tampinhas com texto branco
# ============================================================
INDEX_HTML = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush - Overdrive!</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#060610;--acc:#00E5FF;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;background:var(--dark);font-family:'Rajdhani',sans-serif;color:#E8E8F0;}
#bg-canvas{position:fixed;inset:0;z-index:0;}
.logo-wrap{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;text-align:center;pointer-events:none;user-select:none;}
.logo-main{font-family:'Bebas Neue',sans-serif;font-size:clamp(3.5rem,10vw,8rem);line-height:.85;letter-spacing:6px;background:linear-gradient(160deg,#FF0000 0%,#FF6B00 30%,#FFD700 60%,#FF2A2A 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 30px rgba(255,100,0,.6));animation:logoBreath 3s ease-in-out infinite;}
.logo-sub{font-family:'Bebas Neue',sans-serif;font-size:clamp(1rem,3vw,2rem);letter-spacing:14px;color:#00E5FF;text-shadow:0 0 20px rgba(0,229,255,.5);margin-top:.3rem;}
.logo-proto{font-size:.75rem;letter-spacing:4px;color:rgba(255,255,255,.3);text-transform:uppercase;margin-top:.6rem;}
@keyframes logoBreath{0%,100%{filter:drop-shadow(0 0 30px rgba(255,100,0,.6));}50%{filter:drop-shadow(0 0 60px rgba(255,215,0,.9));}}
.cap{position:fixed;width:100px;height:100px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;z-index:20;text-decoration:none;animation:floatCap var(--dur,4s) ease-in-out var(--delay,0s) infinite;transition:transform .2s;border:3px solid rgba(255,255,255,.25);}
.cap:hover{transform:scale(1.18)!important;z-index:30;}
.cap-inner{width:72px;height:72px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.3);border:2px solid rgba(255,255,255,.25);}
/* TEXTO BRANCO em todos os elementos da tampinha */
.cap-icon{font-size:1.5rem;line-height:1;color:#FFFFFF;}
.cap-lbl{font-family:'Bebas Neue',sans-serif;font-size:.72rem;letter-spacing:2px;margin-top:.2rem;color:#FFFFFF;text-shadow:0 1px 4px rgba(0,0,0,.9);}
.cap-name{position:absolute;bottom:-28px;left:50%;transform:translateX(-50%);font-family:'Bebas Neue',sans-serif;font-size:.85rem;letter-spacing:3px;white-space:nowrap;color:rgba(255,255,255,.85);text-shadow:0 0 10px rgba(0,0,0,1);pointer-events:none;opacity:0;transition:opacity .2s;}
.cap:hover .cap-name{opacity:1;}
.cap-jogar  {top:22%;left:12%;--dur:3.8s;--delay:0s;}
.cap-pilotos{top:20%;right:12%;--dur:4.2s;--delay:.5s;}
.cap-ranking{bottom:22%;left:14%;--dur:4.5s;--delay:1s;}
.cap-arq    {bottom:22%;right:14%;--dur:3.6s;--delay:1.5s;}
.cap-manual {bottom:10%;left:50%;transform:translateX(-50%);--dur:4s;--delay:.3s;animation-name:floatCapC;}
.cap-jogar  {background:radial-gradient(circle at 35% 35%,#FF6B6B,#A00);box-shadow:0 0 30px rgba(255,42,42,.5);}
.cap-pilotos{background:radial-gradient(circle at 35% 35%,#6BFFC8,#00774A);box-shadow:0 0 30px rgba(0,255,160,.4);}
.cap-ranking{background:radial-gradient(circle at 35% 35%,#6BC5FF,#0055AA);box-shadow:0 0 30px rgba(0,150,255,.4);}
.cap-arq    {background:radial-gradient(circle at 35% 35%,#FFD76B,#AA7700);box-shadow:0 0 30px rgba(255,200,0,.4);}
.cap-manual {background:radial-gradient(circle at 35% 35%,#D46BFF,#660099);box-shadow:0 0 30px rgba(180,0,255,.4);}
@keyframes floatCap{0%,100%{transform:translateY(0) rotate(-4deg);}50%{transform:translateY(-18px) rotate(4deg);}}
@keyframes floatCapC{0%,100%{transform:translateX(-50%) translateY(0) rotate(-3deg);}50%{transform:translateX(-50%) translateY(-14px) rotate(3deg);}}
.cap::after{content:'';position:absolute;top:12%;left:18%;width:30%;height:20%;background:rgba(255,255,255,.3);border-radius:50%;transform:rotate(-35deg);pointer-events:none;}
</style>
</head>
<body>
<canvas id="bg-canvas"></canvas>
<div class="logo-wrap">
  <div class="logo-main">CAP<br>RUSH</div>
  <div class="logo-sub">&#8212; OVERDRIVE! &#8212;</div>
  <div class="logo-proto">Prototype v0.2 &middot; Fogo SVM &middot; Devnet</div>
</div>
<a href="caprush-game.html" class="cap cap-jogar">
  <div class="cap-inner"><div class="cap-icon">&#9654;</div><div class="cap-lbl">JOGAR</div></div>
  <span class="cap-name">JOGAR</span>
</a>
<a href="personagens.html" class="cap cap-pilotos">
  <div class="cap-inner"><div class="cap-icon">&#128100;</div><div class="cap-lbl">PILOTOS</div></div>
  <span class="cap-name">PILOTOS</span>
</a>
<a href="ranking.html" class="cap cap-ranking">
  <div class="cap-inner"><div class="cap-icon">&#127942;</div><div class="cap-lbl">RANKING</div></div>
  <span class="cap-name">RANKING</span>
</a>
<a href="arquitetura.html" class="cap cap-arq">
  <div class="cap-inner"><div class="cap-icon">&#9881;</div><div class="cap-lbl">ARQT.</div></div>
  <span class="cap-name">ARQUITETURA</span>
</a>
<a href="manual.html" class="cap cap-manual">
  <div class="cap-inner"><div class="cap-icon">&#128218;</div><div class="cap-lbl">MANUAL</div></div>
  <span class="cap-name">MANUAL</span>
</a>
<script>
(function(){
  var cv=document.getElementById('bg-canvas');
  var cx=cv.getContext('2d');
  var W,H,mx=0,my=0,pts=[];
  function resize(){W=cv.width=innerWidth;H=cv.height=innerHeight;}
  window.addEventListener('resize',resize);resize();
  document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;});
  for(var i=0;i<120;i++) pts.push({x:Math.random()*2000-1000,y:Math.random()*2000-1000,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,r:Math.random()*1.8+.4,hue:Math.random()*60+10,a:Math.random()*.7+.2});
  var hue=0;
  function frame(){
    requestAnimationFrame(frame);
    cx.fillStyle='rgba(6,6,16,.18)';cx.fillRect(0,0,W,H);
    var grd=cx.createRadialGradient(mx,my,0,mx,my,350);
    grd.addColorStop(0,'rgba(255,100,0,.06)');grd.addColorStop(.5,'rgba(255,42,42,.02)');grd.addColorStop(1,'rgba(0,0,0,0)');
    cx.fillStyle=grd;cx.fillRect(0,0,W,H);
    hue=(hue+.3)%360;
    cx.strokeStyle='rgba('+(80+Math.sin(hue*.02)*40)+',20,10,0.05)';cx.lineWidth=.5;
    var gs=50;
    for(var x=0;x<W;x+=gs){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,H);cx.stroke();}
    for(var y=0;y<H;y+=gs){cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke();}
    pts.forEach(function(p){
      var dx=mx-W/2-p.x,dy=my-H/2-p.y,dist=Math.sqrt(dx*dx+dy*dy)+1;
      p.vx+=dx/dist*.003;p.vy+=dy/dist*.003;p.vx*=.98;p.vy*=.98;
      p.x+=p.vx;p.y+=p.vy;
      if(Math.abs(p.x)>1200)p.vx*=-.8;if(Math.abs(p.y)>1200)p.vy*=-.8;
      var sx=W/2+p.x,sy=H/2+p.y;
      if(sx<-5||sx>W+5||sy<-5||sy>H+5)return;
      cx.save();cx.globalAlpha=p.a;cx.fillStyle='hsl('+(p.hue+hue*.1)+',90%,70%)';
      cx.beginPath();cx.arc(sx,sy,p.r,0,Math.PI*2);cx.fill();cx.restore();
    });
  }
  cx.fillStyle='#060610';cx.fillRect(0,0,W||1920,H||1080);
  requestAnimationFrame(frame);
})();
</script>
</body>
</html>
"""

# ============================================================
# BUILD
# ============================================================
def build():
    print()
    print("="*62)
    print("  CapRush – builder_fase1_final.py")
    print("  Fase 1 Final – Todas as correcoes aplicadas")
    print("="*62)
    print("Raiz:", ROOT)
    print()
    print("JS / Modulos...")
    w("client/src/core/Vector2D.js",      VECTOR2D)
    w("client/src/core/Physics.js",       PHYSICS)
    w("client/src/core/SoundEngine.js",   SOUND)
    w("client/src/core/CapSprite.js",     CAP_SPRITE)
    w("client/src/core/GameLoop.js",      GAMELOOP3)
    w("client/src/entities/Yuki.js",      YUKI)
    w("client/src/scenes/TrackV3.js",     TRACKV3)
    print()
    print("HTMLs...")
    w("client/game.html",                 GAME_HTML)
    w("client/game-multi.html",           MULTI_LOBBY)
    w("client/game-multi-local.html",     MULTI_LOCAL)
    w("client/game-multi-online.html",    MULTI_ONLINE)
    w("index.html",                       INDEX_HTML)
    w("caprush-game.html",                CAPRUSH_GAME)
    print()
    print("Servidor WS...")
    w("server/ws-server.js",              WS_SERVER)
    print()
    print("="*62)
    print("  TUDO GERADO COM SUCESSO!")
    print("="*62)
    print()
    print("  COMO TESTAR:")
    print()
    print("  1) Terminal 1 – Ranking:")
    print("     cd server && python server.py")
    print()
    print("  2) Terminal 2 – Jogo (na RAIZ do projeto):")
    print("     python -m http.server 8080")
    print()
    print("  3) Chrome: http://localhost:8080/index.html")
    print()
    print("  4) Multiplayer online (opcional):")
    print("     cd server && npm install ws && node ws-server.js")
    print()

if __name__=="__main__":
    build()
