#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace") if hasattr(sys.stdout, "reconfigure") else None
# -*- coding: utf-8 -*-
"""CapRush v0.3 — Builder Parte 2: Physics.js e TrackV3.js"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))
def w(rel, txt):
    path = os.path.join(ROOT, *rel.split('/'))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(txt)
    print(f'  [OK]  {rel}')

# ═══════════════════════════════════════════════════════════════
# Physics.js v3 — Correcao drags + bounce() + setVel()
# ═══════════════════════════════════════════════════════════════
w('client/src/core/Physics.js', r"""// Physics.js v3 — CapRush
// CORRECAO: agua aumenta atrito (freia), grama diminui (desliza/acelera)
// NOVO: setVel(), bounce() para ricochete correto
var Physics = (function(){
  var BASE_DRAG = 1.8;
  var MAX_PX    = 165;
  var MAX_SPD   = 620;
  var REST      = 0.65;
  var MIN_SPD   = 6;

  // FIX v3: valores corrigidos (estavam invertidos!)
  // agua:  MAIS atrito  = dragCoeff MAIOR = tampinha FREIA na agua
  // grama: MENOS atrito = dragCoeff MENOR = tampinha DESLIZA e ACELERA na grama
  var DRAG_MULT = {
    asfalto: 1.0,
    agua:    1.95,  // +95% de arrasto — freia significativamente
    grama:   0.42,  // -58% de arrasto — desliza e ganha velocidade
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

  // NOVO v3: define velocidade diretamente (para ricochete)
  function setVel(vx, vy){
    s.vel    = new Vector2D(vx, vy);
    s.moving = s.vel.magnitude() > MIN_SPD;
  }

  // NOVO v3: reflexao vetorial correta — n deve ser vetor unitario
  // Uso: bounce(nx, ny, restitution)
  // Aplica: v = v - 2*(v.n)*n  depois multiplica por restituicao
  function bounce(nx, ny, restitution){
    var r   = (restitution !== undefined) ? restitution : REST;
    var dot = s.vel.x * nx + s.vel.y * ny;
    if(dot >= 0) return;  // ja se afastando, nao ricocheta
    s.vel.x = (s.vel.x - 2 * dot * nx) * r;
    s.vel.y = (s.vel.y - 2 * dot * ny) * r;
    s.moving = s.vel.magnitude() > MIN_SPD;
  }

  function flick(from, to, charMult){
    var drag = from.sub(to);
    var len  = Math.min(drag.magnitude(), MAX_PX);
    var t    = len / MAX_PX;
    s.vel    = drag.normalize().scale(t * MAX_SPD * (charMult || 1));
    s.moving = true;
    return { forcePct: Math.round(t*100),
             angle: Math.atan2(drag.y, drag.x) * 180 / Math.PI };
  }

  function step(dt, bounds){
    if(!s.moving) return snap();

    var dragCoeff = BASE_DRAG * (DRAG_MULT[s.surf] || 1.0);
    var spd       = s.vel.magnitude();
    var newSpd    = Math.max(0, spd - dragCoeff * spd * dt);

    if(newSpd < MIN_SPD){
      s.vel    = new Vector2D(0, 0);
      s.moving = false;
      return snap();
    }

    s.vel = s.vel.normalize().scale(newSpd);
    s.pos = s.pos.add(s.vel.scale(dt));

    // bordas do canvas
    var r = 14;
    if(s.pos.x - r < bounds.x)         { s.pos.x = bounds.x + r;           s.vel.x =  Math.abs(s.vel.x) * REST; }
    if(s.pos.x + r > bounds.x+bounds.w){ s.pos.x = bounds.x+bounds.w - r;  s.vel.x = -Math.abs(s.vel.x) * REST; }
    if(s.pos.y - r < bounds.y)         { s.pos.y = bounds.y + r;           s.vel.y =  Math.abs(s.vel.y) * REST; }
    if(s.pos.y + r > bounds.y+bounds.h){ s.pos.y = bounds.y+bounds.h - r;  s.vel.y = -Math.abs(s.vel.y) * REST; }

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

  return {
    reset:reset, flick:flick, step:step,
    setSurface:setSurface, setVel:setVel, bounce:bounce,
    MAX_PX:MAX_PX, MAX_SPD:MAX_SPD, REST:REST,
    get pos(){ return s.pos.clone(); }
  };
})();
""")

# ═══════════════════════════════════════════════════════════════
# TrackV3.js v3 — Stands, Paddock, Agua organica, Grama texturizada
# ═══════════════════════════════════════════════════════════════
w('client/src/scenes/TrackV3.js', r"""// TrackV3.js v3 — CapRush
// NOVO: stands (amarelo) com torcida animada, paddock (laranja),
//       poças de agua organicas, grama texturizada
// API nova: checkStands(pos,r), checkPaddock(pos,r)
var TrackV3 = (function(){
  var META = { id:'03', nome:'Terra & Cascalho v3', superficie:'asfalto', voltas:2 };

  var CW=800, CH=500;
  var TW;

  var pts = [];
  var puddleZones  = [];
  var grassOnTrack = [];
  var innerBounds  = [];
  var cps          = [];
  var obstacles    = [];
  var startRect    = null;

  // ── NOVO v3: Arquibancadas (amarelo) e Paddock (laranja) ──
  var standZones   = [];  // {x,y,w,h,nx,ny} — normal aponta para a pista
  var paddockZone  = null;

  // Crowd pre-gerado
  var crowd = [];
  // Grass blades pre-geradas
  var grassBlades  = [];
  var grassBladesG = []; // para on-track grass

  function initCrowd(){
    crowd = [];
    standZones.forEach(function(sz){
      var cols = Math.floor(sz.w / 7);
      var rows = Math.floor(sz.h * 0.45 / 8);
      for(var r = 0; r < rows; r++){
        for(var c = 0; c < cols; c++){
          crowd.push({
            x: sz.x + 4 + c * 7,
            y: sz.y + sz.h * 0.15 + r * 9,
            color: ['#FF4444','#4488FF','#44AA44','#FFEE22','#FF44FF','#44FFFF'][((r*17+c*7)%6)],
            phase: (r * cols + c) * 0.32
          });
        }
      }
    });
  }

  function initGrassBlades(){
    grassBlades = [];
    for(var i = 0; i < 400; i++){
      grassBlades.push({
        x: Math.random(),
        y: Math.random(),
        h: 3 + Math.random() * 4,
        phase: Math.random() * Math.PI * 2
      });
    }
    grassBladesG = [];
    grassOnTrack.forEach(function(g){
      var n = Math.floor(g.w * g.h / 14);
      for(var i = 0; i < n; i++){
        grassBladesG.push({
          gx: g.x, gy: g.y, gw: g.w, gh: g.h,
          rx: Math.random(), ry: Math.random(),
          h: 3 + Math.random() * 4,
          phase: Math.random() * Math.PI * 2
        });
      }
    });
  }

  function init(cw, ch){
    CW = cw; CH = ch;
    TW = Math.min(cw, ch) * 0.10;
    var m  = TW * 0.8;

    pts = [
      { x: m,          y: CH*0.46 },
      { x: m,          y: m },
      { x: CW*0.36,    y: m },
      { x: CW*0.44,    y: CH*0.24 },
      { x: CW*0.50,    y: CH*0.33 },
      { x: CW*0.56,    y: CH*0.24 },
      { x: CW*0.64,    y: m },
      { x: CW-m,       y: m },
      { x: CW-m,       y: CH*0.60 },
      { x: CW*0.75,    y: CH*0.72 },
      { x: CW*0.62,    y: CH-m },
      { x: CW*0.50,    y: CH-m },
      { x: CW*0.38,    y: CH-m },
      { x: CW*0.25,    y: CH*0.72 },
      { x: m,          y: CH*0.60 },
      { x: m,          y: CH*0.46 },
    ];

    startRect = {
      x: m - TW * 0.45,
      y: CH * 0.30,
      w: TW * 0.45,
      h: CH * 0.32
    };

    cps = [
      { x: CW*0.50, y: CH*0.38, r: TW*0.65, lbl:'CP 1', ok:false },
      { x: CW-m,    y: CH*0.32, r: TW*0.65, lbl:'CP 2', ok:false },
      { x: CW*0.50, y: CH-m,    r: TW*0.65, lbl:'CP 3', ok:false },
    ];

    obstacles = [
      { x: CW*0.38, y: m + TW*0.3,       r: 8 },
      { x: CW*0.62, y: m + TW*0.3,       r: 8 },
      { x: CW-m,    y: CH*0.35,           r: 7 },
      { x: CW*0.70, y: CH*0.72 + TW*0.1, r: 8 },
      { x: CW*0.50, y: CH-m - TW*0.2,    r: 7 },
    ];

    puddleZones = [
      { x: CW*0.77, y: CH*0.12, r: TW*0.38 },
      { x: CW*0.80, y: CH*0.60, r: TW*0.38 },
    ];

    grassOnTrack = [
      { x: CW*0.28, y: CH*0.78, w: TW*0.7, h: TW*0.55 },
      { x: CW*0.62, y: CH*0.78, w: TW*0.7, h: TW*0.55 },
    ];

    var innerX = m + TW + 5;
    var innerY = m + TW + 5;
    var innerW = CW - 2*(m + TW) - 10;
    var innerH = CH - 2*(m + TW) - 10;
    innerBounds = [
      { type:'lake',  x: CW*0.38, y: CH*0.32, w: CW*0.20, h: CH*0.20, shape:'ellipse' },
      { type:'grass', x: innerX,         y: innerY,        w: CW*0.36-innerX,        h: innerH },
      { type:'grass', x: CW*0.60,        y: innerY,        w: innerX+innerW-CW*0.60, h: innerH },
      { type:'grass', x: CW*0.36,        y: innerY,        w: CW*0.24,               h: CH*0.30 },
      { type:'grass', x: CW*0.36,        y: CH*0.54,       w: CW*0.24,               h: innerY+innerH-CH*0.54 },
    ];

    // ── NOVO v3: Arquibancadas (amarelo) ──
    // Lado direito (fora da pista, exterior)
    // Fundo da pista (exterior sul)
    standZones = [
      {
        x: CW - m*0.3, y: m * 0.5,
        w: m * 1.6,    h: CH * 0.58,
        nx: -1, ny: 0,    // normal aponta para esquerda (de volta à pista)
        label: 'STANDS'
      },
      {
        x: CW*0.32, y: CH - m * 0.25,
        w: CW*0.36, h: m * 1.55,
        nx: 0, ny: -1,    // normal aponta para cima (de volta à pista)
        label: 'STANDS'
      },
    ];

    // ── NOVO v3: Paddock (laranja) ──
    paddockZone = {
      x: 0,    y: m * 0.4,
      w: m * 1.0, h: CH * 0.60,
      nx: 1, ny: 0,  // normal aponta para direita (de volta à pista)
      label: 'PADDOCK'
    };

    initCrowd();
    initGrassBlades();
  }

  // ── Verifica se tampinha esta na pista ──
  function isOnTrack(pos){
    var minDist = Infinity;
    for(var i = 0; i < pts.length - 1; i++){
      var ax=pts[i].x, ay=pts[i].y, bx=pts[i+1].x, by=pts[i+1].y;
      var dx=bx-ax, dy=by-ay, len=Math.sqrt(dx*dx+dy*dy);
      if(len < 1) continue;
      var t = ((pos.x-ax)*dx + (pos.y-ay)*dy) / (len*len);
      t = Math.max(0, Math.min(1, t));
      var px=ax+t*dx, py=ay+t*dy;
      var d = Math.sqrt((pos.x-px)*(pos.x-px) + (pos.y-py)*(pos.y-py));
      if(d < minDist) minDist = d;
    }
    return minDist < (TW * 0.65 + 16);
  }

  function detectInner(pos){
    if(isOnTrack(pos)) return null;
    for(var i = 0; i < innerBounds.length; i++){
      var z = innerBounds[i];
      if(z.shape === 'ellipse'){
        var ex=(pos.x-(z.x+z.w/2))/(z.w/2);
        var ey=(pos.y-(z.y+z.h/2))/(z.h/2);
        if(ex*ex+ey*ey <= 1) return z.type;
      } else {
        if(pos.x>=z.x&&pos.x<=z.x+z.w&&pos.y>=z.y&&pos.y<=z.y+z.h) return z.type;
      }
    }
    var m2 = TW * 0.8;
    var inBorder = (pos.x<m2-14||pos.x>CW-m2+14||pos.y<m2-14||pos.y>CH-m2+14);
    if(!inBorder && !isOnTrack(pos)) return 'grass';
    return null;
  }

  function detectPuddle(pos){
    for(var i = 0; i < puddleZones.length; i++){
      var p = puddleZones[i];
      var dx=pos.x-p.x, dy=pos.y-p.y;
      if(Math.sqrt(dx*dx+dy*dy) < p.r) return true;
    }
    return false;
  }

  function detectGrassOnTrack(pos){
    for(var i = 0; i < grassOnTrack.length; i++){
      var g = grassOnTrack[i];
      if(pos.x>=g.x&&pos.x<=g.x+g.w&&pos.y>=g.y&&pos.y<=g.y+g.h) return true;
    }
    return false;
  }

  // ── NOVO v3: Verifica colisao com arquibancadas ──
  function checkStands(pos, r){
    r = r || 14;
    for(var i = 0; i < standZones.length; i++){
      var s = standZones[i];
      if(pos.x+r > s.x && pos.x-r < s.x+s.w &&
         pos.y+r > s.y && pos.y-r < s.y+s.h){
        return { zone:s, nx:s.nx, ny:s.ny, label:s.label };
      }
    }
    return null;
  }

  // ── NOVO v3: Verifica colisao com paddock ──
  function checkPaddock(pos, r){
    r = r || 14;
    if(!paddockZone) return null;
    var p = paddockZone;
    if(pos.x+r > p.x && pos.x-r < p.x+p.w &&
       pos.y+r > p.y && pos.y-r < p.y+p.h){
      return { zone:p, nx:p.nx, ny:p.ny, label:p.label };
    }
    return null;
  }

  function resetCPs(){ cps.forEach(function(c){c.ok=false;}); }

  function checkCP(pos, onCp){
    for(var i = 0; i < cps.length; i++){
      var c = cps[i]; if(c.ok) continue;
      var dx=pos.x-c.x, dy=pos.y-c.y;
      if(Math.sqrt(dx*dx+dy*dy) < c.r){ c.ok=true; if(onCp)onCp(c); return c; }
    }
    return null;
  }

  function lastCP(){ var l=null; cps.forEach(function(c){if(c.ok)l=c;}); return l; }

  function checkLap(pos){
    if(!startRect) return false;
    var s=startRect;
    return(pos.x>=s.x-8&&pos.x<=s.x+s.w+8&&pos.y>=s.y-8&&pos.y<=s.y+s.h+8);
  }

  function checkObstacles(pos, r){
    for(var i = 0; i < obstacles.length; i++){
      var o=obstacles[i];
      var dx=pos.x-o.x, dy=pos.y-o.y;
      var dist=Math.sqrt(dx*dx+dy*dy);
      if(dist < r+o.r) return { obs:o, nx:dx/dist, ny:dy/dist };
    }
    return null;
  }

  function getStartPos(){
    if(!startRect) return {x:80, y:CH/2};
    return {x:startRect.x+startRect.w+20, y:startRect.y+startRect.h/2};
  }

  // ── RENDER ──────────────────────────────────────────────────
  function render(ctx, cw, ch, t){
    if(!pts.length) init(cw, ch);

    ctx.fillStyle='#1A1208';
    ctx.fillRect(0, 0, cw, ch);
    // cascalho
    ctx.fillStyle='rgba(70,50,30,.35)';
    for(var i=0;i<240;i++) ctx.fillRect((i*137.5)%cw,(i*97.3)%ch,2,2);

    // ── PADDOCK (laranja) — exterior esquerdo ──
    if(paddockZone){
      var pz = paddockZone;
      // Base laranja
      var pgrd = ctx.createLinearGradient(pz.x, pz.y, pz.x+pz.w, pz.y);
      pgrd.addColorStop(0, '#6B2A00');
      pgrd.addColorStop(1, '#C85000');
      ctx.fillStyle = pgrd;
      ctx.fillRect(pz.x, pz.y, pz.w, pz.h);
      // Boxes / garagens
      var bw=pz.w*0.85, bh=Math.min(pz.h/5, 32);
      var bx=pz.x+pz.w*0.07;
      for(var bi=0; bi<5; bi++){
        var by2=pz.y+10+bi*(bh+8);
        if(by2+bh > pz.y+pz.h-10) break;
        // porta do box
        ctx.fillStyle='#1A0A00';
        ctx.fillRect(bx, by2, bw, bh);
        // grade porta
        ctx.strokeStyle='#FF8822';
        ctx.lineWidth=1.2;
        for(var gi2=0;gi2<4;gi2++){
          ctx.beginPath();
          ctx.moveTo(bx+bw*gi2/4+2, by2+2);
          ctx.lineTo(bx+bw*gi2/4+2, by2+bh-2);
          ctx.stroke();
        }
        ctx.strokeStyle='#FF6600';
        ctx.lineWidth=2;
        ctx.strokeRect(bx-1, by2-1, bw+2, bh+2);
        // etiqueta
        ctx.fillStyle='#FF8800';
        ctx.font='bold '+(Math.floor(bh*0.35))+'px Rajdhani,sans-serif';
        ctx.textAlign='center';
        ctx.fillText('BOX '+(bi+1), bx+bw/2, by2+bh*0.65);
      }
      // Barril de combustivel
      ctx.fillStyle='#FF4400';
      ctx.beginPath();
      ctx.ellipse(pz.x+pz.w*0.5, pz.y+pz.h-22, 8, 16, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle='#FF8800';
      ctx.lineWidth=1.5;
      ctx.beginPath();
      ctx.moveTo(pz.x+pz.w*0.5-8, pz.y+pz.h-28);
      ctx.lineTo(pz.x+pz.w*0.5+8, pz.y+pz.h-28);
      ctx.stroke();
      // Borda do paddock
      ctx.strokeStyle='#FF6600';
      ctx.lineWidth=2.5;
      ctx.setLineDash([6,4]);
      ctx.strokeRect(pz.x+1, pz.y+1, pz.w-2, pz.h-2);
      ctx.setLineDash([]);
      // Label
      ctx.save();
      ctx.fillStyle='rgba(255,100,0,.8)';
      ctx.font='bold 11px Bebas Neue,sans-serif';
      ctx.textAlign='center';
      ctx.letterSpacing='2px';
      ctx.fillText('PADDOCK', pz.x+pz.w/2, pz.y+8);
      ctx.restore();
    }

    // ── ARQUIBANCADAS (amarelo) com torcida ──
    standZones.forEach(function(sz){
      // Base amarela
      var sgrd;
      if(sz.nx === -1){  // lado direito
        sgrd = ctx.createLinearGradient(sz.x, sz.y, sz.x+sz.w, sz.y);
        sgrd.addColorStop(0, '#DDAA00');
        sgrd.addColorStop(1, '#776000');
      } else {           // fundo
        sgrd = ctx.createLinearGradient(sz.x, sz.y, sz.x, sz.y+sz.h);
        sgrd.addColorStop(0, '#DDAA00');
        sgrd.addColorStop(1, '#776000');
      }
      ctx.fillStyle = sgrd;
      ctx.fillRect(sz.x, sz.y, sz.w, sz.h);

      // Degraus de arquibancada
      var stepH = Math.max(8, sz.h / 6);
      var nSteps = Math.floor(sz.h * 0.8 / stepH);
      ctx.strokeStyle = 'rgba(0,0,0,.25)';
      ctx.lineWidth = 1;
      for(var si=1; si<=nSteps; si++){
        var sy2 = sz.y + sz.h*0.15 + si*stepH;
        ctx.beginPath();
        ctx.moveTo(sz.x+2, sy2);
        ctx.lineTo(sz.x+sz.w-2, sy2);
        ctx.stroke();
      }

      // Torcida animada
      var crowdForThis = crowd.filter(function(c){
        return c.x >= sz.x && c.x < sz.x+sz.w;
      });
      crowdForThis.forEach(function(c){
        var wave = Math.sin(t * 2.5 + c.phase) * 4.5;
        // Corpo
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x-2, c.y - wave - 2, 4, 7);
        // Cabeca
        ctx.fillStyle = '#FFD8A8';
        ctx.beginPath();
        ctx.arc(c.x, c.y - wave - 5, 3, 0, Math.PI*2);
        ctx.fill();
        // Braco levantado animado
        if(Math.sin(t * 2.5 + c.phase) > 0.3){
          ctx.strokeStyle = c.color;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(c.x+2, c.y - wave);
          ctx.lineTo(c.x+6, c.y - wave - 5);
          ctx.stroke();
        }
      });

      // Borda amarela
      ctx.strokeStyle='#FFD700';
      ctx.lineWidth=2.5;
      ctx.setLineDash([8,4]);
      ctx.strokeRect(sz.x+1, sz.y+1, sz.w-2, sz.h-2);
      ctx.setLineDash([]);
      // Label
      ctx.save();
      ctx.fillStyle='rgba(255,220,0,.85)';
      ctx.font='bold 11px Bebas Neue,sans-serif';
      ctx.textAlign='center';
      ctx.fillText('STANDS', sz.x+sz.w/2, sz.y+8);
      ctx.restore();
    });

    // ── Interior grama escura + arvores ──
    var m2=TW*0.8;
    ctx.fillStyle='#0D2B0D';
    roundRect(ctx, m2+TW, m2+TW, cw-2*(m2+TW), ch-2*(m2+TW), 12);
    ctx.fill();

    // Grama interior animada com hastes
    ctx.strokeStyle='rgba(0,140,0,.18)';
    ctx.lineWidth=1;
    for(var gx=0; gx<cw; gx+=7){
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx-20, ch);
      ctx.stroke();
    }

    // Arvores
    var treePos=[
      [cw*0.20,ch*0.25],[cw*0.30,ch*0.40],[cw*0.18,ch*0.55],
      [cw*0.72,ch*0.22],[cw*0.80,ch*0.38],[cw*0.75,ch*0.50],
      [cw*0.25,ch*0.65],[cw*0.70,ch*0.65],
    ];
    treePos.forEach(function(tp){
      ctx.fillStyle='#3D2008';
      ctx.fillRect(tp[0]-3, tp[1]+10, 6, 12);
      [14,9,5].forEach(function(r2,li){
        ctx.fillStyle=['#1A5C1A','#27862A','#38B838'][li];
        ctx.beginPath();ctx.arc(tp[0],tp[1],r2,0,Math.PI*2);ctx.fill();
      });
    });

    // Lago interior
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
      for(var wi=1;wi<=3;wi++){
        ctx.strokeStyle='rgba(100,200,255,'+(0.25+Math.sin(t*1.5+wi)*.1)+')';
        ctx.lineWidth=1;
        ctx.beginPath();
        ctx.ellipse(lx.x+lx.w/2,lx.y+lx.h/2,lx.w/2*wi/3.8,lx.h/2*wi/3.8,Math.sin(t*.5)*0.1,0,Math.PI*2);
        ctx.stroke();
      }
    }

    // ── Borda e faixa da pista ──
    drawPath(ctx, TW+18, '#2A1F18');
    drawPath(ctx, TW,    '#5C4530');
    ctx.save();
    ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.lineWidth=1; ctx.setLineDash([4,8]);
    drawPathStroke(ctx, TW*0.7);
    ctx.setLineDash([]); ctx.restore();
    // Linha central tracejada
    ctx.save();
    ctx.strokeStyle='rgba(255,215,0,.35)'; ctx.lineWidth=2; ctx.setLineDash([12,10]);
    drawPathStroke(ctx, 0);
    ctx.setLineDash([]); ctx.restore();

    // ── POCAS DE AGUA ORGANICAS (nao mais circulos) ──
    puddleZones.forEach(function(p){
      drawOrganicPuddle(ctx, p.x, p.y, p.r, t);
    });

    // ── GRAMA NA PISTA texturizada ──
    grassOnTrack.forEach(function(g){
      // Base
      var ggrd = ctx.createRadialGradient(g.x+g.w/2, g.y+g.h/2, 2, g.x+g.w/2, g.y+g.h/2, Math.max(g.w,g.h)/2);
      ggrd.addColorStop(0, 'rgba(70,220,70,.5)');
      ggrd.addColorStop(1, 'rgba(30,180,30,.2)');
      ctx.fillStyle = ggrd;
      ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle='rgba(40,200,40,.7)';
      ctx.lineWidth=1.5;
      ctx.strokeRect(g.x, g.y, g.w, g.h);
      // Hastes de grama animadas
      grassBladesG.forEach(function(b){
        if(b.gx !== g.x) return;
        var bx2 = b.gx + b.rx * b.gw;
        var by3 = b.gy + b.ry * b.gh;
        var lean = Math.sin(t*2 + b.phase) * 2.5;
        ctx.strokeStyle = 'rgba(' + (40+Math.floor(b.h*8)) + ',220,40,.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bx2, by3);
        ctx.quadraticCurveTo(bx2+lean, by3-b.h*.5, bx2+lean*.7, by3-b.h);
        ctx.stroke();
      });
    });

    // ── Obstaculos (tocos) ──
    obstacles.forEach(function(o){
      ctx.fillStyle='rgba(0,0,0,.3)';
      ctx.beginPath();ctx.ellipse(o.x+3,o.y+3,o.r+2,o.r+1,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5C3A1A';
      ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#7A5030';
      ctx.beginPath();ctx.arc(o.x-1,o.y-2,o.r*.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#3A2010';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.stroke();
    });

    // ── Largada xadrez ──
    if(startRect){
      var sl=startRect;
      var sq=8;
      var nc=Math.ceil(sl.w/sq), nr=Math.ceil(sl.h/sq);
      for(var row=0;row<nr;row++) for(var col=0;col<nc;col++){
        ctx.fillStyle=(row+col)%2===0?'#FFF':'#111';
        ctx.fillRect(sl.x+col*sq, sl.y+row*sq, sq, sq);
      }
      ctx.strokeStyle='#FFD700';ctx.lineWidth=2;
      ctx.strokeRect(sl.x,sl.y,sl.w,sl.h);
      ctx.fillStyle='#FFD700';
      ctx.font='bold 9px Rajdhani,sans-serif';
      ctx.textAlign='center';
      ctx.fillText('START/FINISH', sl.x+sl.w/2, sl.y-5);
    }

    // ── Checkpoints ──
    cps.forEach(function(c){
      ctx.save();
      ctx.globalAlpha = c.ok ? .25 : .9;
      ctx.fillStyle = c.ok ? 'rgba(40,40,40,.3)' : 'rgba(255,255,255,.15)';
      ctx.beginPath();ctx.arc(c.x,c.y,c.r*.65,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=c.ok?'#333':'#FFF';
      ctx.lineWidth=3;ctx.setLineDash([5,3]);
      ctx.beginPath();ctx.arc(c.x,c.y,c.r*.65,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle=c.ok?'#333':'#FFF';
      ctx.font='bold 10px Rajdhani,sans-serif';
      ctx.textAlign='center';
      ctx.fillText(c.lbl, c.x, c.y-c.r*.65-5);
      ctx.restore();
    });
  }

  // ── POÇA ORGANICA: blob com bezier animado ──
  function drawOrganicPuddle(ctx, cx, cy, r, t){
    var n = 8;
    var pts2 = [];
    for(var i = 0; i < n; i++){
      var angle = (i / n) * Math.PI * 2;
      var wobble = 1 + 0.18 * Math.sin(t * 1.4 + i * 1.25);
      pts2.push({
        x: cx + Math.cos(angle) * r * wobble,
        y: cy + Math.sin(angle) * r * wobble * 0.68
      });
    }
    // Preenchimento
    var wgrd = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    wgrd.addColorStop(0, 'rgba(30,160,255,.55)');
    wgrd.addColorStop(.6, 'rgba(0,100,210,.35)');
    wgrd.addColorStop(1, 'rgba(0,60,160,.15)');
    ctx.fillStyle = wgrd;
    ctx.beginPath();
    ctx.moveTo((pts2[0].x+pts2[n-1].x)/2, (pts2[0].y+pts2[n-1].y)/2);
    for(var i2 = 0; i2 < n; i2++){
      var next = pts2[(i2+1) % n];
      var mpx = (pts2[i2].x + next.x) / 2;
      var mpy = (pts2[i2].y + next.y) / 2;
      ctx.quadraticCurveTo(pts2[i2].x, pts2[i2].y, mpx, mpy);
    }
    ctx.closePath();
    ctx.fill();
    // Borda ondulada
    ctx.strokeStyle = 'rgba(100,210,255,.85)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
    // Onda interna
    ctx.strokeStyle = 'rgba(150,230,255,' + (0.3+Math.sin(t*2)*.12) + ')';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(cx+2, cy-2, r*.45, r*.28, Math.sin(t*.8)*.25, 0, Math.PI*2);
    ctx.stroke();
    // Reflexo de luz
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath();
    ctx.ellipse(cx-r*.25, cy-r*.2, r*.22, r*.1, -0.5, 0, Math.PI*2);
    ctx.fill();
  }

  // Helpers
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
    // NOVO v3
    checkStands:checkStands,
    checkPaddock:checkPaddock,
    get checkpoints(){ return cps; },
    get TW(){ return TW; },
  };
})();
""")

print('\n[v]  Parte 2 concluida: Physics.js, TrackV3.js\n')
