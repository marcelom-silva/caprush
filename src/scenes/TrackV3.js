// TrackV3.js v9 — CapRush Overdrive!
// MUDANÇAS v9 (Marco 2.8 — ajustes pós-feedback teste 4):
//  1. Grama na pista: base verde clara (não mais marrom que parecia lodo)
//
// Nota: as outras 3 correções deste ciclo são em GameLoop.js e SoundEngine.js
// (Racer-D respawn, player respawn empurrado, som da areia mais perceptível).
var TrackV3 = (function(){
  'use strict';
  var META = { id:'04', nome:'Terra & Cascalho v6', superficie:'asfalto', voltas:2 };
  var CW=800, CH=500, TW=50;
  var pts=[], puddleZones=[], grassOnTrack=[], innerBounds=[], cps=[], obstacles=[];
  var startRect=null, startExtended=null;
  var standZones=[], paddockZone=null, parkingZone=null, sandZones=[], cannonZones=[];
  var crowd=[], lakeSparkles=[];
  var boostZones=[], oilZones=[], spinZones=[];
  var sponsorBoards=[];
  var treePosArr=[];

  function init(cw, ch){
    CW=cw; CH=ch;
    TW = Math.min(cw, ch) * 0.095;
    var m = TW * 0.85;

    pts = [
      {x:m,         y:CH*0.46},
      {x:m,         y:m},
      {x:CW*0.36,   y:m},
      {x:CW*0.44,   y:CH*0.24},
      {x:CW*0.50,   y:CH*0.33},
      {x:CW*0.56,   y:CH*0.24},
      {x:CW*0.64,   y:m},
      {x:CW-m,      y:m},
      {x:CW-m,      y:CH*0.60},
      {x:CW*0.75,   y:CH*0.72},
      {x:CW*0.62,   y:CH-m},
      {x:CW*0.50,   y:CH-m},
      {x:CW*0.38,   y:CH-m},
      {x:CW*0.25,   y:CH*0.72},
      {x:m,         y:CH*0.60},
      {x:m,         y:CH*0.46},
    ];

    startRect = { x: m - TW*0.5, y: CH*0.46, w: TW, h: 14 };
    startExtended = { x: 0, y: CH*0.36, w: m + TW*0.55 + 8, h: CH*0.20 };

    cps = [
      { x: CW*0.50, y: CH*0.33, r: TW*0.40, lbl:'CP 1', ok:false },
      { x: CW-m,    y: CH*0.30, r: TW*0.40, lbl:'CP 2', ok:false },
      { x: CW*0.50, y: CH-m,    r: TW*0.40, lbl:'CP 3', ok:false },
    ];

    obstacles = [
      { x: CW*0.38, y: m + TW*0.3,        r: 8 },
      { x: CW*0.62, y: m + TW*0.3,        r: 8 },
      { x: CW-m,    y: CH*0.22,            r: 7 },
      { x: CW*0.70, y: CH*0.72 + TW*0.1,  r: 8 },
      { x: CW*0.50, y: CH-m - TW*0.18,    r: 7 },
    ];

    puddleZones = [
      { x: CW*0.16, y: CH*0.66, r: TW*0.70 },
      { x: CW*0.91, y: CH*0.09, r: TW*0.70 },
    ];

    grassOnTrack = [
      { type:'blob', cx:CW*0.73, cy:CH*0.75, rx:TW*0.69, ry:TW*0.30, rot:-0.22 },
    ];

    var innerX = m + TW + 5;
    var innerY = m + TW + 5;
    var innerW = CW - 2*(m + TW) - 10;
    var innerH = CH - 2*(m + TW) - 10;
    innerBounds = [
      { type:'lake',  x:CW*0.41, y:CH*0.36, w:CW*0.18, h:CH*0.16, shape:'ellipse' },
      { type:'grass', x:innerX,      y:innerY, w:CW*0.36-innerX,        h:innerH },
      { type:'grass', x:CW*0.62,     y:innerY, w:innerX+innerW-CW*0.62, h:innerH },
      { type:'grass', x:CW*0.36,     y:innerY, w:CW*0.28, h:CH*0.28 },
      { type:'grass', x:CW*0.36,     y:CH*0.54, w:CW*0.28, h:innerY+innerH-CH*0.54 },
    ];

    standZones = [
      { x:CW*0.08, y:0, w:CW*0.80, h:Math.max(m*0.55, 6), nx:0, ny:1, label:'STANDS' },
      { x:CW*0.28, y:CH-Math.max(m-TW*0.5, 6), w:CW*0.44, h:Math.max(m-TW*0.5, 6), nx:0, ny:-1, label:'STANDS' },
      // v10: arquibancada direita encostada na borda do canvas (FORA da pista, sem ricochete)
      { x: CW-16, y: CH*0.10, w: 12, h: CH*0.62, nx: -1, ny: 0, label:'STANDS' },
    ];

    paddockZone = { x: CW*0.107, y: CH*0.21, w: CW*0.16, h: CH*0.22, nx:-1, ny:0, label:'PADDOCK' };

    // ── ESTACIONAMENTO MENOR (v6) ───────────────────────────────────────
    parkingZone = { x: CW*0.85, y: CH*0.78, w: CW*0.13, h: CH*0.20 };

    // ── CANHÕES (v7: norte e sul movidos para o interior, fora da pista) ────
    cannonZones = [
      { x:CW*0.50, y:CH*0.20, angle:Math.PI*0.5,  r:11, cooldown:0 },  // norte (entre pista superior e chicane, no interior)
      { x:CW*0.82, y:CH*0.48, angle:Math.PI*1.15, r:11, cooldown:0 },  // leste (mantém — entre arquibancada e pista direita)
      { x:CW*0.55, y:CH*0.83, angle:Math.PI*1.5,  r:11, cooldown:0 },  // sul (interior, deslocado pra direita conforme pediu)
      { x:CW*0.18, y:CH*0.55, angle:Math.PI*0.0,  r:11, cooldown:0 },  // oeste (mantém — entre arquibancada e pista esquerda)
    ];

    sandZones = [
      { x:CW*0.893, y:CH*0.36, w:CW*0.08, h:CH*0.17 }
    ];

    // ── OBSTÁCULOS v7: posições revistas pós-feedback 2 ─────────────────
    // BOOST: início da reta longa NE (logo após a chicane), recompensa quem sai bem
    boostZones = [
      { x: CW*0.66, y: m - TW*0.05, w: TW*1.0, h: TW*0.55, angle: 0 }
    ];
    // OIL: reta esquerda (reta principal/largada) perto do final, antes da curva NW
    // (antes ficava sobreposto a um blob de grama na entrada da curva sul)
    oilZones = [
      { x: m + 3, y: CH*0.30, r: TW*0.42 }
    ];
    // SPIN: v8 — movido pra entrada da curva sul-direita (final da reta direita)
    spinZones = [
      { x: CW-m, y: CH*0.55, r: TW*0.22 }
    ];

    // ── PLACAS DE OUTDOOR — Marco 2.9.2: dentro do gramado, longe da pista ──
    var bw = TW*0.90, bh = TW*0.34;
    sponsorBoards = [
      // SO mais central — longe da curva sul-oeste
      { x: CW*0.30-bw/2, y: CH*0.62, w: bw, h: bh, color:'#d11515', dark:'#7a0000', logo:'privy' },
      // NO mais central
      { x: CW*0.36-bw/2, y: CH*0.46, w: bw, h: bh, color:'#FFD700', dark:'#7a5a00', logo:'cr' },
      // NE mais central
      { x: CW*0.62-bw/2, y: CH*0.46, w: bw, h: bh, color:'#1a5fa5', dark:'#0a3a5a', logo:'solana' },
      // SE mais central
      { x: CW*0.68-bw/2, y: CH*0.62, w: bw, h: bh, color:'#3a8a1a', dark:'#1a4810', logo:'fogo' },
    ];

    // ── ÁRVORES v7: posições revistas, longe das arquibancadas reduzidas ─
    treePosArr = [
      [CW*0.22, CH*0.35], [CW*0.30, CH*0.45], [CW*0.20, CH*0.55],
      [CW*0.70, CH*0.45], [CW*0.78, CH*0.55], [CW*0.65, CH*0.42],
      [CW*0.45, CH*0.68], [CW*0.55, CH*0.68],
      [CW*0.32, CH*0.62], [CW*0.68, CH*0.62],
    ];
    // Filtro de segurança: remove árvores que caem na pista ou em arquibancadas
    treePosArr = treePosArr.filter(function(tp){
      var p = {x:tp[0], y:tp[1]};
      if(isOnTrack(p)) return false;
      for(var si=0; si<standZones.length; si++){
        var sz = standZones[si];
        if(p.x > sz.x-12 && p.x < sz.x+sz.w+12 && p.y > sz.y-12 && p.y < sz.y+sz.h+12) return false;
      }
      return true;
    });

    _initCrowd();
    _initLakeSparkles();
  }

  function getCheckpoints(){ return cps; }

  function _initCrowd(){
    crowd = [];
    standZones.forEach(function(sz){
      var step = 7;
      var cols = Math.floor(sz.w / step);
      var rows = Math.max(1, Math.floor(sz.h * 0.7 / 9));
      for(var r=0;r<rows;r++) for(var c=0;c<cols;c++){
        crowd.push({
          x: sz.x + 4 + c * step,
          y: sz.y + sz.h * 0.15 + r * 9,
          color:['#FF4444','#4488FF','#44AA44','#FFEE22','#FF44FF','#FFFFFF','#FF8800','#AA44FF'][(r*17+c*7)%8],
          phase:(r*cols+c)*0.31, sz:sz
        });
      }
    });
  }

  function _initLakeSparkles(){
    lakeSparkles = [];
    for(var i=0;i<12;i++) lakeSparkles.push({
      angle:Math.random()*Math.PI*2,
      dist:0.2+Math.random()*0.65,
      phase:Math.random()*Math.PI*2,
      size:1+Math.random()*2.5
    });
  }

  // ═══ DETECÇÕES (geometria preservada) ════════════════════════════════
  function isOnTrack(pos){
    var minD = Infinity;
    for(var i=0;i<pts.length-1;i++){
      var ax=pts[i].x,ay=pts[i].y,bx=pts[i+1].x,by=pts[i+1].y;
      var dx=bx-ax,dy=by-ay,len=Math.sqrt(dx*dx+dy*dy);
      if(len<1) continue;
      var t=((pos.x-ax)*dx+(pos.y-ay)*dy)/(len*len);
      t=Math.max(0,Math.min(1,t));
      var px=ax+t*dx,py=ay+t*dy;
      var d=Math.sqrt((pos.x-px)*(pos.x-px)+(pos.y-py)*(pos.y-py));
      if(d<minD) minD=d;
    }
    return minD < TW*0.62+16;
  }
  function detectInner(pos){
    if(isOnTrack(pos)) return null;
    for(var i=0;i<innerBounds.length;i++){
      var z=innerBounds[i];
      if(z.shape==='ellipse'){
        var ex=(pos.x-(z.x+z.w/2))/(z.w/2),ey=(pos.y-(z.y+z.h/2))/(z.h/2);
        if(ex*ex+ey*ey<=1) return z.type;
      } else {
        if(pos.x>=z.x&&pos.x<=z.x+z.w&&pos.y>=z.y&&pos.y<=z.y+z.h) return z.type;
      }
    }
    return 'grass';
  }
  function detectPuddle(pos){
    for(var i=0;i<puddleZones.length;i++){
      var p=puddleZones[i],dx=pos.x-p.x,dy=pos.y-p.y;
      if(Math.sqrt(dx*dx+dy*dy)<p.r) return true;
    }
    return false;
  }
  function detectSand(pos){
    for(var i=0;i<sandZones.length;i++){
      var s=sandZones[i];
      if(pos.x>s.x&&pos.x<s.x+s.w&&pos.y>s.y&&pos.y<s.y+s.h) return true;
    }
    return false;
  }
  function detectGrassOnTrack(pos){
    for(var i=0;i<grassOnTrack.length;i++){
      var g=grassOnTrack[i];
      if(g.type==='blob'){
        var dx=(pos.x-g.cx)/g.rx, dy=(pos.y-g.cy)/g.ry;
        var cosR=Math.cos(-g.rot),sinR=Math.sin(-g.rot);
        var rdx=cosR*dx-sinR*dy, rdy=sinR*dx+cosR*dy;
        if(rdx*rdx+rdy*rdy<=1) return true;
      }
    }
    return false;
  }
  function checkStands(pos,r){
    r=r||14;
    for(var i=0;i<standZones.length;i++){
      var s=standZones[i];
      if(pos.x+r>s.x&&pos.x-r<s.x+s.w&&pos.y+r>s.y&&pos.y-r<s.y+s.h)
        return{zone:s,nx:s.nx,ny:s.ny};
    }
    return null;
  }
  function checkPaddock(pos, r){
    if(!paddockZone) return null;
    if(pos.x > paddockZone.x + r && pos.x < paddockZone.x + paddockZone.w - r &&
       pos.y > paddockZone.y + r && pos.y < paddockZone.y + paddockZone.h - r){
      return { nx:0, ny:0 };
    }
    return null;
  }
  // Marco 2.9.2: checkParking — usado pela IA pra rejeitar lances que terminam
  // ou passam pelo estacionamento.
  function checkParking(pos, r){
    if(!parkingZone) return null;
    r = r || 0;
    if(pos.x + r > parkingZone.x && pos.x - r < parkingZone.x + parkingZone.w &&
       pos.y + r > parkingZone.y && pos.y - r < parkingZone.y + parkingZone.h){
      return { nx:0, ny:0 };
    }
    return null;
  }
  function resetCPs(){ cps.forEach(function(c){c.ok=false;}); }
  function checkCP(pos,onCp){
    for(var i=0;i<cps.length;i++){
      var c=cps[i]; if(c.ok) continue;
      var dx=pos.x-c.x,dy=pos.y-c.y;
      if(Math.sqrt(dx*dx+dy*dy)<c.r){c.ok=true;if(onCp)onCp(c);return c;}
    }
    return null;
  }
  function lastCP(){ var l=null; cps.forEach(function(c){if(c.ok)l=c;}); return l; }
  function checkLap(pos){
    if(!startRect) return false;
    var s=startRect;
    return(pos.x>=s.x&&pos.x<=s.x+s.w&&pos.y>=s.y-5&&pos.y<=s.y+s.h+5);
  }
  function checkObstacles(pos,r){
    for(var i=0;i<obstacles.length;i++){
      var o=obstacles[i],dx=pos.x-o.x,dy=pos.y-o.y,dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<r+o.r) return{obs:o,nx:dx/dist,ny:dy/dist};
    }
    return null;
  }
  // v6: tampinhas saem ATRÁS da linha de largada (sul, sentido contrário ao trajeto)
  function getStartPos(){
    if(!startRect) return{x:80,y:CH/2};
    return{
      x: startRect.x + startRect.w/2,
      y: startRect.y + startRect.h + 22
    };
  }

  function detectBoost(pos, r){
    r = r || 14;
    for(var i=0;i<boostZones.length;i++){
      var b = boostZones[i];
      if(pos.x+r>b.x && pos.x-r<b.x+b.w && pos.y+r>b.y && pos.y-r<b.y+b.h){
        return { zone:b, angle:b.angle };
      }
    }
    return null;
  }
  function detectOil(pos){
    for(var i=0;i<oilZones.length;i++){
      var o=oilZones[i], dx=pos.x-o.x, dy=pos.y-o.y;
      if(Math.sqrt(dx*dx+dy*dy)<o.r) return { zone:o };
    }
    return null;
  }
  function detectSpin(pos){
    for(var i=0;i<spinZones.length;i++){
      var s=spinZones[i], dx=pos.x-s.x, dy=pos.y-s.y;
      if(Math.sqrt(dx*dx+dy*dy)<s.r) return { zone:s };
    }
    return null;
  }
  // Marco 2.9.2 (E3): direção INSTANTÂNEA do empurrão do twister.
  // Casa exatamente com a rotação visual da seta (t*1.8) no render.
  function getSpinDirection(zone, t){
    var ang = t*1.8;
    return { x: Math.cos(ang), y: Math.sin(ang) };
  }

  // ════════════════════════════════════════════════════════════════════════
  //                          RENDER (v6 — ordem corrigida)
  // ════════════════════════════════════════════════════════════════════════
  function render(ctx, cw, ch, t){
    if(!pts.length) init(cw,ch);
    var m = TW * 0.85;

    // ─── 1. CHÃO BASE — GRAMA EXTERNA ─────────────────────────────────
    ctx.fillStyle = '#5db830';
    ctx.fillRect(0, 0, cw, ch);
    var seed = 1;
    var rng = function(){ seed = (seed*9301+49297) % 233280; return seed/233280; };
    ctx.globalAlpha = 0.4;
    for(var i=0; i<14; i++){
      var mx = rng()*cw, my = rng()*ch, mr = TW*0.8 + rng()*TW*1.2;
      ctx.fillStyle = (i%2===0) ? '#4ca524' : '#6dc837';
      ctx.beginPath();
      ctx.ellipse(mx, my, mr, mr*0.65, rng()*Math.PI, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ─── 2. INTERIOR VERDE ESCURO (ANTES do asfalto v6) ────────────────
    // Asfalto desenhado por cima vai cobrir as áreas onde a pista entra/sai
    var m2 = m + TW;
    ctx.fillStyle = '#2a6815';
    _roundRect(ctx, m2, m2, cw - 2*m2, ch - 2*m2, 14); ctx.fill();
    ctx.strokeStyle = '#1a4810'; ctx.lineWidth = 2;
    _roundRect(ctx, m2, m2, cw - 2*m2, ch - 2*m2, 14); ctx.stroke();
    // Variação tonal sutil interior
    ctx.globalAlpha = 0.5;
    for(var ii=0; ii<10; ii++){
      var ix = m2 + rng()*(cw-2*m2);
      var iy = m2 + rng()*(ch-2*m2);
      var ir = TW*0.5 + rng()*TW*0.8;
      ctx.fillStyle = (ii%2===0) ? '#1f5010' : '#3a8a25';
      ctx.beginPath();
      ctx.ellipse(ix, iy, ir, ir*0.6, rng()*Math.PI, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ─── 3. ARQUIBANCADAS (sem propaganda — só torcida) ────────────────
    standZones.forEach(function(sz){
      if(sz.h < 4) return;
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      _roundRect(ctx, sz.x+3, sz.y+4, sz.w, sz.h, 4); ctx.fill();
      ctx.fillStyle = '#1e1e1e';
      _roundRect(ctx, sz.x, sz.y, sz.w, sz.h, 4); ctx.fill();
      ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 2;
      _roundRect(ctx, sz.x, sz.y, sz.w, sz.h, 4); ctx.stroke();
      var tierH = Math.max(8, sz.h/4);
      for(var ti=0; ti<4; ti++){
        var ty = sz.y + ti*tierH;
        if(ty + tierH > sz.y + sz.h) break;
        ctx.fillStyle = (ti%2===0) ? '#2a2a2a' : '#252525';
        ctx.fillRect(sz.x+1, ty+1, sz.w-2, tierH-1);
      }
      crowd.forEach(function(c){
        if(c.sz !== sz) return;
        var wave = Math.sin(t*2.5 + c.phase)*2;
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x-2, c.y - wave - 2, 4, 5);
      });
    });

    // ─── 4. PADDOCK ────────────────────────────────────────────────────
    if(paddockZone){
      var pz = paddockZone;
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      _roundRect(ctx, pz.x+3, pz.y+4, pz.w, pz.h, 6); ctx.fill();
      ctx.fillStyle = '#9c9a8c';
      _roundRect(ctx, pz.x, pz.y, pz.w, pz.h, 6); ctx.fill();
      ctx.strokeStyle = '#5a5848'; ctx.lineWidth = 2;
      _roundRect(ctx, pz.x, pz.y, pz.w, pz.h, 6); ctx.stroke();
      // garagem central
      var gx = pz.x + 6, gy = pz.y + 8, gw = pz.w - 12, gh = pz.h*0.45;
      ctx.fillStyle = '#3a3a42';
      ctx.fillRect(gx, gy, gw, gh);
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
      ctx.strokeRect(gx, gy, gw, gh);
      var boxColors = ['#d11515','#1a5fa5','#FFD700','#3a8a1a'];
      var bxw = (gw-4) / 4;
      for(var bi=0; bi<4; bi++){
        ctx.fillStyle = boxColors[bi];
        ctx.fillRect(gx+2 + bi*bxw, gy+3, bxw-2, gh-6);
        ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
        ctx.strokeRect(gx+2 + bi*bxw, gy+3, bxw-2, gh-6);
      }
      // mini-tampinhas estacionadas no paddock — v7: tamanho igual ao estacionamento
      var py0 = pz.y + pz.h*0.55;
      var capColors = [
        ['#FF4444','#AA0000'], ['#44AAFF','#1166AA'],
        ['#44FF88','#22AA55'], ['#FFCC00','#AA8800'],
        ['#CC44FF','#882299'], ['#FF8844','#AA5522']
      ];
      var ppCols = 3, ppRows = 2;
      var ppCellW = (pz.w - 12) / ppCols;
      var ppCellH = (pz.h*0.40) / ppRows;
      var ppCapR  = Math.min(ppCellW, ppCellH) * 0.42;
      for(var ci=0; ci<6; ci++){
        var cx = pz.x + 6 + (ci%ppCols)*ppCellW + ppCellW/2;
        var cy = py0 + Math.floor(ci/ppCols)*ppCellH + ppCellH/2;
        _drawMiniCap(ctx, cx, cy, ppCapR, capColors[ci][0], capColors[ci][1]);
      }
    }

    // ─── 5. ESTACIONAMENTO (v6: menor + mini-tampinhas) ─────────────────
    if(parkingZone){
      var pkz = parkingZone;
      ctx.fillStyle = 'rgba(0,0,0,.35)';
      _roundRect(ctx, pkz.x+3, pkz.y+4, pkz.w, pkz.h, 5); ctx.fill();
      ctx.fillStyle = '#454550';
      _roundRect(ctx, pkz.x, pkz.y, pkz.w, pkz.h, 5); ctx.fill();
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2;
      _roundRect(ctx, pkz.x, pkz.y, pkz.w, pkz.h, 5); ctx.stroke();
      // P de "parking" no canto
      ctx.fillStyle = 'rgba(0,229,255,.85)';
      ctx.font = 'bold ' + Math.floor(pkz.w*0.20) + 'px Bebas Neue, Arial';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('P', pkz.x + 4, pkz.y + 3);
      // grade de tampinhas variadas
      var capPalette = [
        ['#FF2A2A','#7a0000'],['#FFD700','#7a5a00'],['#1a5fa5','#0a2845'],
        ['#3a8a1a','#1a4810'],['#FF8C00','#7a3a00'],['#9933cc','#4a1a5a'],
        ['#00aabb','#005566'],['#fff','#888'],['#ff4488','#7a1a3a'],
        ['#88ff44','#3a7a1a'],['#ff88cc','#7a3a55'],['#1a1a1a','#000']
      ];
      var cols = 4, rows = 3;
      var cellW = (pkz.w - 8) / cols, cellH = (pkz.h - 18) / rows;
      var cellSize = Math.min(cellW, cellH) * 0.42;
      for(var pr=0; pr<rows; pr++){
        for(var pc=0; pc<cols; pc++){
          var pi = pr*cols + pc;
          if(pi >= capPalette.length) break;
          var cx2 = pkz.x + 4 + pc*cellW + cellW/2;
          var cy2 = pkz.y + 16 + pr*cellH + cellH/2;
          var pal = capPalette[pi % capPalette.length];
          _drawMiniCap(ctx, cx2, cy2, cellSize, pal[0], pal[1]);
        }
      }
    }

    // ─── 5b. LAGO (v7: ANTES do asfalto, p/ asfalto cobrir invasão) ─────
    var _lx = innerBounds[0];
    if(_lx){ _drawLake(ctx, _lx, t); }

    // ─── 6. CONCRETO RUNOFF (anel externo da pista) ─────────────────────
    ctx.save();
    ctx.lineWidth = TW + 18;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#9c9a8c';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(function(p,idx){ if(idx>0) ctx.lineTo(p.x,p.y); });
    ctx.closePath(); ctx.stroke();
    ctx.restore();

    // ─── 7. ASFALTO PRINCIPAL ───────────────────────────────────────────
    _drawPath(ctx, TW + 2, '#1a1a1f');
    _drawPath(ctx, TW,     '#3a3a42');

    // textura sutil
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#262630';
    for(var ai=0; ai<60; ai++){
      var ax = (ai*97.3) % cw, ay = (ai*73.7) % ch;
      if(isOnTrack({x:ax, y:ay})){
        ctx.beginPath(); ctx.arc(ax, ay, 1.2, 0, Math.PI*2); ctx.fill();
      }
    }
    ctx.restore();

    // ─── 8. FAIXA AMARELA TRACEJADA (centro) ────────────────────────────
    ctx.save();
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([14, 10]);
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(function(p,idx){ if(idx>0) ctx.lineTo(p.x,p.y); });
    ctx.closePath();
    ctx.globalAlpha = 0.7;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // ─── 9. ZEBRAS MANUAIS (v7: só nas saídas das 2 curvas laterais) ────
    // Removidas as do topo e sul que invadiam as arquibancadas
    var manualCurbs = [
      [7,  8, 1,  0, TW*2.5],   // saída curva NE → reta direita, lado leste
      [14, 0,-1,  0, TW*2.5],   // saída curva esquerda → reta esquerda, lado oeste
    ];
    manualCurbs.forEach(function(cb){
      _drawCurbAt(ctx, pts[cb[0]], pts[cb[1]], cb[2], cb[3], cb[4]);
    });

    // ─── 10. POÇAS NA PISTA ─────────────────────────────────────────────
    puddleZones.forEach(function(p){
      _drawPuddle(ctx, p.x, p.y, p.r, t);
    });

    // ─── 11. GRAMA NA PISTA (v8: tufos de capim balançando ao vento) ───
    grassOnTrack.forEach(function(g){
      if(g.type !== 'blob') return;
      ctx.save();
      ctx.translate(g.cx, g.cy); ctx.rotate(g.rot);
      // sombra elíptica no chão
      ctx.fillStyle = 'rgba(0,0,0,.20)';
      ctx.beginPath();
      ctx.ellipse(2, 4, g.rx*1.05, g.ry*0.7, 0, 0, Math.PI*2);
      ctx.fill();
      // v9: base verde clara (não mais marrom de terra que parecia lodo)
      ctx.fillStyle = 'rgba(80,180,50,.55)';
      ctx.beginPath();
      ctx.ellipse(0, 0, g.rx*0.92, g.ry*0.78, 0, 0, Math.PI*2);
      ctx.fill();
      // anel mais escuro suave para definir borda
      ctx.strokeStyle = 'rgba(40,120,30,.65)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // tufos de capim — vários conjuntos de 3-5 folhas verticais
      var nTufts = 18;
      var seed = (g.cx*31 + g.cy*17)|0;
      var rng = function(i){ var s=Math.sin(seed*0.013 + i*7.7)*43758.5453; return s - Math.floor(s); };
      for(var i=0; i<nTufts; i++){
        // posição dentro da elipse
        var ang = rng(i)*Math.PI*2;
        var rad = Math.sqrt(rng(i+99)) * 0.85;
        var tx = Math.cos(ang) * g.rx * rad;
        var ty = Math.sin(ang) * g.ry * rad * 0.85;
        // sway por tufo (cada um balança em fase diferente)
        var sway = Math.sin(t*2.2 + i*0.83) * 1.8;
        var swayX = sway * 0.6;
        // 3-4 folhas por tufo
        var nLeaves = 3 + (i%2);
        for(var j=0; j<nLeaves; j++){
          var jx = tx + (j-(nLeaves-1)/2) * 1.6;
          var jh = 5 + rng(i*9+j)*4;
          var leafSway = swayX + Math.sin(t*2.2 + i*0.83 + j*0.4) * 0.8;
          // folha — linha curva ascendente
          var greens = ['#2a8520','#3DB838','#4dc848','#1f7018'];
          ctx.strokeStyle = greens[(i+j)%4];
          ctx.lineWidth = 1.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(jx, ty + 1);
          ctx.quadraticCurveTo(
            jx + leafSway*0.5, ty - jh*0.5,
            jx + leafSway,     ty - jh
          );
          ctx.stroke();
          // ponta clara
          ctx.fillStyle = 'rgba(180,255,140,.7)';
          ctx.beginPath();
          ctx.arc(jx + leafSway, ty - jh, 0.8, 0, Math.PI*2);
          ctx.fill();
        }
      }
      ctx.restore();
    });

    // ─── 12. AREIA / ESCAPATÓRIA ────────────────────────────────────────
    sandZones.forEach(function(sz){
      ctx.fillStyle = 'rgba(0,0,0,.3)';
      _roundRect(ctx, sz.x+2, sz.y+3, sz.w, sz.h, 6); ctx.fill();
      ctx.fillStyle = '#d4b06a';
      _roundRect(ctx, sz.x, sz.y, sz.w, sz.h, 6); ctx.fill();
      ctx.fillStyle = '#c09a4e'; ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.ellipse(sz.x + sz.w*0.3, sz.y + sz.h*0.4, sz.w*0.35, sz.h*0.3, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#7a5a30'; ctx.lineWidth = 2;
      _roundRect(ctx, sz.x, sz.y, sz.w, sz.h, 6); ctx.stroke();
      var sd = Math.round(sz.x*31 + sz.y*17);
      for(var gi=0; gi<Math.min(sz.w*sz.h*0.05, 200); gi++){
        var gx = sz.x + ((sd*gi*179+17) % (sz.w|1));
        var gy = sz.y + ((sd*gi*137+31) % (sz.h|1));
        ctx.fillStyle = ['#a8854a','#e8c980','#a8854a','#bca25a'][gi%4];
        ctx.beginPath(); ctx.arc(gx, gy, 1.2, 0, Math.PI*2); ctx.fill();
      }
    });

    // ─── 13. ÁRVORES (filtradas — só fora da pista) ─────────────────────
    treePosArr.forEach(function(tp){
      _drawTree(ctx, tp[0], tp[1], t);
    });

    // ─── 14. LAGO já foi desenhado antes do asfalto (passo 5b) ──────────

    // ─── 15. PEDRAS / OBSTÁCULOS NATURAIS ───────────────────────────────
    obstacles.forEach(function(o){
      _drawRock(ctx, o.x, o.y, o.r);
    });

    // ─── 16. PLACAS DE OUTDOOR (v7: pequenas, com LOGOS em vez de texto) ─
    sponsorBoards.forEach(function(b){
      // sombra projetada à frente (em direção à pista — sul)
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.beginPath();
      ctx.ellipse(b.x + b.w/2 + 3, b.y + b.h + 4, b.w*0.55, b.h*0.18, 0, 0, Math.PI*2);
      ctx.fill();
      // lateral fina (sugere espessura — placa em pé)
      ctx.fillStyle = b.dark;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + 3);
      ctx.lineTo(b.x, b.y + b.h - 1);
      ctx.lineTo(b.x + 3, b.y + b.h + 2);
      ctx.lineTo(b.x + 3, b.y + 6);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      ctx.stroke();
      // frente da placa
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x + 3, b.y + 6, b.w - 3, b.h - 4);
      ctx.strokeStyle = b.dark; ctx.lineWidth = 1.6;
      ctx.strokeRect(b.x + 3, b.y + 6, b.w - 3, b.h - 4);
      ctx.fillStyle = b.dark;
      ctx.fillRect(b.x + 3, b.y + 6, b.w - 3, 2);
      ctx.fillRect(b.x + 3, b.y + b.h - 1, b.w - 3, 2);
      // logo (v7)
      _drawSponsorLogo(ctx, b);
      // pés inclinados (cavalete)
      ctx.strokeStyle = b.dark;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x + 6,        b.y + b.h + 1);
      ctx.lineTo(b.x + 2,        b.y + b.h + 6);
      ctx.moveTo(b.x + b.w - 4,  b.y + b.h + 1);
      ctx.lineTo(b.x + b.w + 1,  b.y + b.h + 6);
      ctx.stroke();
    });

    // ─── 17. NOVOS OBSTÁCULOS v6: BOOST / OIL / SPIN ────────────────────
    boostZones.forEach(function(b){
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      _roundRect(ctx, b.x+3, b.y+5, b.w, b.h, 5); ctx.fill();
      ctx.save();
      ctx.globalAlpha = 0.3 + 0.2*Math.sin(t*4);
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.ellipse(b.x + b.w/2, b.y + b.h/2 + 4, b.w*0.7, b.h*0.6, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#FFD700';
      _roundRect(ctx, b.x, b.y, b.w, b.h, 5); ctx.fill();
      ctx.strokeStyle = '#7a5a00'; ctx.lineWidth = 2.5;
      _roundRect(ctx, b.x, b.y, b.w, b.h, 5); ctx.stroke();
      var arrowOff = (t*40) % (b.w*0.3);
      ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.7;
      for(var ai2=0; ai2<3; ai2++){
        var sx = b.x + 4 + ai2*(b.w*0.3) + arrowOff;
        var sy = b.y + b.h/2;
        ctx.beginPath();
        ctx.moveTo(sx,           sy - b.h*0.3);
        ctx.lineTo(sx + b.h*0.5, sy);
        ctx.lineTo(sx,           sy + b.h*0.3);
        ctx.lineTo(sx + b.h*0.15,sy);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#FF8C00';
      ctx.strokeStyle = '#7a3a00'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      var bcx = b.x + b.w/2, bcy = b.y + b.h/2;
      ctx.moveTo(bcx - b.w*0.18, bcy - b.h*0.3);
      ctx.lineTo(bcx + b.w*0.25, bcy);
      ctx.lineTo(bcx - b.w*0.18, bcy + b.h*0.3);
      ctx.lineTo(bcx - b.w*0.05, bcy);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    });

    oilZones.forEach(function(o){
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.beginPath();
      ctx.ellipse(o.x+3, o.y+4, o.r*1.2, o.r*0.85, 0, 0, Math.PI*2);
      ctx.fill();
      var n2 = 9, opts2 = [];
      for(var i2=0; i2<n2; i2++){
        var a2 = i2/n2 * Math.PI*2;
        var w2 = 1 + 0.15*Math.sin(t*0.8 + i2*1.1);
        opts2.push({x: o.x + Math.cos(a2)*o.r*w2, y: o.y + Math.sin(a2)*o.r*0.7*w2});
      }
      ctx.fillStyle = '#1a1414';
      ctx.beginPath();
      ctx.moveTo((opts2[0].x + opts2[n2-1].x)/2, (opts2[0].y + opts2[n2-1].y)/2);
      for(var i3=0; i3<n2; i3++){
        var nx2 = opts2[(i3+1)%n2];
        ctx.quadraticCurveTo(opts2[i3].x, opts2[i3].y, (opts2[i3].x+nx2.x)/2, (opts2[i3].y+nx2.y)/2);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(120,40,90,.5)';
      ctx.beginPath();
      ctx.ellipse(o.x - o.r*0.3, o.y - o.r*0.2, o.r*0.4, o.r*0.15, 0.3, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = 'rgba(60,80,140,.4)';
      ctx.beginPath();
      ctx.ellipse(o.x + o.r*0.2, o.y + o.r*0.15, o.r*0.3, o.r*0.1, -0.2, 0, Math.PI*2);
      ctx.fill();
    });

    spinZones.forEach(function(s){
      // Sombra
      ctx.fillStyle = 'rgba(0,0,0,.4)';
      ctx.beginPath();
      ctx.ellipse(s.x+2, s.y+3, s.r*1.05, s.r*1.05, 0, 0, Math.PI*2);
      ctx.fill();
      // Base azul (espiral mais escura)
      ctx.fillStyle = '#1a5fa5';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#0a2845'; ctx.lineWidth = 2;
      ctx.stroke();
      // 4 pétalas girando (visual de tornado)
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(t*1.8);
      ctx.fillStyle = 'rgba(58,138,204,.7)';
      for(var pi=0; pi<4; pi++){
        ctx.save();
        ctx.rotate(pi * Math.PI/2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, s.r*0.95, -Math.PI/4, Math.PI/4);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      // Marco 2.9.2 (E3): SETA giratória mostrando direção do empurrão
      // (mesma rotação do render — quem leu o ângulo via getSpinDirection
      // recebe valor consistente com o que vê na tela)
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(t*1.8);
      // haste da seta (amarelo brilhante)
      ctx.strokeStyle='#FFD700'; ctx.lineWidth=4; ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(-s.r*0.7, 0);
      ctx.lineTo( s.r*0.65, 0);
      ctx.stroke();
      // ponta da seta
      ctx.fillStyle='#FFD700';
      ctx.beginPath();
      ctx.moveTo( s.r*0.85, 0);
      ctx.lineTo( s.r*0.55,-s.r*0.30);
      ctx.lineTo( s.r*0.55, s.r*0.30);
      ctx.closePath(); ctx.fill();
      // glow
      ctx.shadowColor='#FFEE66'; ctx.shadowBlur=12;
      ctx.beginPath();
      ctx.moveTo( s.r*0.85, 0);
      ctx.lineTo( s.r*0.55,-s.r*0.30);
      ctx.lineTo( s.r*0.55, s.r*0.30);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur=0;
      ctx.restore();
      // Centro branco
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r*0.18, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#0a2845'; ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#1a5fa5';
      ctx.font = 'bold ' + Math.floor(s.r*0.5) + 'px Arial Black';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('\u21BB', s.x, s.y + 1);
    });

    // ─── 18. LINHA DE LARGADA (xadrez) ──────────────────────────────────
    if(startRect){
      var sl = startRect;
      ctx.fillStyle = 'rgba(0,0,0,.5)';
      ctx.fillRect(sl.x+2, sl.y+3, sl.w, sl.h);
      var sq = 7;
      var nc = Math.ceil(sl.w/sq), nr = Math.ceil(sl.h/sq);
      for(var row=0; row<nr; row++){
        for(var col=0; col<nc; col++){
          ctx.fillStyle = (row+col)%2===0 ? '#FFFFFF' : '#111111';
          ctx.fillRect(sl.x + col*sq, sl.y + row*sq, sq, sq);
        }
      }
      ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2.5;
      ctx.strokeRect(sl.x, sl.y, sl.w, sl.h);
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 8px Bebas Neue, Rajdhani, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('START / FINISH', sl.x + sl.w/2, sl.y - 4);
      ctx.fillStyle = 'rgba(255,120,0,.55)';
      ctx.fillRect(sl.x, sl.y + sl.h + 2, sl.w, 4);
      ctx.fillStyle = 'rgba(255,180,0,.5)';
      ctx.font = 'bold 7px Rajdhani, sans-serif';
      ctx.fillText('PIT LANE', sl.x + sl.w/2, sl.y + sl.h + 12);
    }

    // ─── 19. CHECKPOINTS ────────────────────────────────────────────────
    cps.forEach(function(c){
      var pulse = 1 + Math.sin(t*4) * 0.12;
      ctx.save();
      ctx.globalAlpha = c.ok ? 0.05 : 0.18;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * 0.8 * pulse, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = c.ok ? 0.3 : 1;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * 0.7 * pulse, 0, Math.PI*2);
      ctx.stroke();
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = c.ok ? 0.2 : 0.6;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * 0.55 * pulse, 0, Math.PI*2);
      ctx.stroke();
      ctx.restore();
    });

    // ─── 20. CANHÕES (v6: norte e sul movidos para fora da pista) ───────
    if(typeof cannonZones !== 'undefined') cannonZones.forEach(function(c){
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      ctx.beginPath();
      ctx.ellipse(2, 4, c.r*1.1, c.r*0.45, 0, 0, Math.PI*2);
      ctx.fill();
      if(c.firing){
        ctx.shadowColor = '#FF6600'; ctx.shadowBlur = 18;
      }
      ctx.fillStyle = '#3a3a42';
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(0, 0, c.r*0.55, 0, Math.PI*2);
      ctx.fill();
      ctx.rotate(c.angle);
      ctx.fillStyle = c.firing ? '#FF8C00' : '#3a3a42';
      ctx.fillRect(c.r*0.3, -c.r*0.25, c.r*1.1, c.r*0.5);
      ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 1.5;
      ctx.strokeRect(c.r*0.3, -c.r*0.25, c.r*1.1, c.r*0.5);
      ctx.fillStyle = c.firing ? '#FFCC00' : '#222';
      ctx.beginPath();
      ctx.arc(c.r*1.45, 0, c.r*0.32, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#000'; ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    });
  }

  // ═══ HELPERS DE RENDER ═══════════════════════════════════════════════════

  function _drawPath(ctx, width, color){
    if(!pts.length) return;
    ctx.save();
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(function(p,i){ if(i>0) ctx.lineTo(p.x,p.y); });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  // v6: zebra manual em saída de curva
  // sideX, sideY: vetor (não normalizado) que aponta para o lado externo desejado
  function _drawCurbAt(ctx, a, b, sideX, sideY, length){
    var dx = b.x - a.x, dy = b.y - a.y;
    var L = Math.sqrt(dx*dx + dy*dy);
    if(L < 1) return;
    var ux = dx/L, uy = dy/L;
    // duas perpendiculares possíveis ao segmento
    var p1x = -uy, p1y = ux;
    var p2x = uy,  p2y = -ux;
    // escolhe a que mais se aproxima de (sideX, sideY)
    var d1 = p1x*sideX + p1y*sideY;
    var d2 = p2x*sideX + p2y*sideY;
    var nx = (d1 > d2) ? p1x : p2x;
    var ny = (d1 > d2) ? p1y : p2y;

    var len = Math.min(L * 0.65, length || TW*2.5);
    var d_start = TW*0.5;   // começa na borda externa da pista
    var d_end   = TW*0.72;  // v8: ainda mais estreitas (era 0.78)

    var nTri = 4;
    for(var ti=0; ti<nTri; ti++){
      var t1 = ti/nTri;
      var t2 = (ti+1)/nTri;
      var p1x_ = a.x + ux*len*t1;
      var p1y_ = a.y + uy*len*t1;
      var p2x_ = a.x + ux*len*t2;
      var p2y_ = a.y + uy*len*t2;
      ctx.fillStyle = (ti%2===0) ? '#d11515' : '#f5f5f5';
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';  // v8: pontas arredondadas
      ctx.beginPath();
      ctx.moveTo(p1x_ + nx*d_start, p1y_ + ny*d_start);
      ctx.lineTo(p2x_ + nx*d_start, p2y_ + ny*d_start);
      ctx.lineTo(p2x_ + nx*d_end,   p2y_ + ny*d_end);
      ctx.lineTo(p1x_ + nx*d_end,   p1y_ + ny*d_end);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function _drawTree(ctx, x, y, t){
    var sway = Math.sin(t*0.8 + x*0.01)*1.5;
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath();
    ctx.ellipse(x+5, y+12, 14, 5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#3D2008';
    ctx.fillRect(x-3, y+6, 6, 14);
    ctx.strokeStyle = '#1a0e02'; ctx.lineWidth = 1;
    ctx.strokeRect(x-3, y+6, 6, 14);
    var layers = [[16,'#1A5C1A'],[12,'#1E7020'],[8,'#28902A'],[5,'#3DB838']];
    layers.forEach(function(l){
      ctx.fillStyle = l[1];
      ctx.beginPath();
      ctx.arc(x + sway*0.3, y-2, l[0], 0, Math.PI*2);
      ctx.fill();
    });
    ctx.strokeStyle = '#0a3a08'; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x + sway*0.3, y-2, 16, 0, Math.PI*2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(120,255,120,.3)';
    ctx.beginPath();
    ctx.ellipse(x-4 + sway*0.3, y-10, 5, 3, -0.5, 0, Math.PI*2);
    ctx.fill();
  }

  function _drawRock(ctx, x, y, r){
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath();
    ctx.ellipse(x+3, y+4, r+2, r*0.7, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#7a7470';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#2a2825'; ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#9a948f';
    ctx.beginPath();
    ctx.ellipse(x-1.5, y-2, r*0.55, r*0.4, -0.3, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#3a3835'; ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(x-r*0.4, y);
    ctx.lineTo(x+r*0.3, y+r*0.3);
    ctx.stroke();
  }

  function _drawLake(ctx, lx, t){
    var lcx = lx.x + lx.w/2, lcy = lx.y + lx.h/2;
    var lrx = lx.w/2, lry = lx.h/2;
    var lgrd = ctx.createRadialGradient(lcx-lrx*.2, lcy-lry*.2, 2, lcx, lcy, lrx);
    lgrd.addColorStop(0,'rgba(40,160,255,.95)');
    lgrd.addColorStop(.45,'rgba(10,100,220,.85)');
    lgrd.addColorStop(.8,'rgba(0,60,180,.7)');
    lgrd.addColorStop(1,'rgba(0,30,120,.5)');
    ctx.fillStyle = lgrd;
    ctx.beginPath();
    ctx.ellipse(lcx, lcy, lrx, lry, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#0a2845'; ctx.lineWidth = 2;
    ctx.stroke();
    for(var ri=0; ri<3; ri++){
      var rphase = (t*0.6 + ri*0.7) % (Math.PI*2);
      var rscale = 0.2 + 0.5 * (rphase/(Math.PI*2));
      var ralpha = 0.3 * (1 - rphase/(Math.PI*2));
      ctx.strokeStyle = 'rgba(120,210,255,'+ralpha+')';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(lcx, lcy, lrx*rscale, lry*rscale, 0, 0, Math.PI*2);
      ctx.stroke();
    }
    var shx = lcx - lrx*.3 + Math.sin(t*1.2)*lrx*.20;
    var shy = lcy - lry*.2 + Math.cos(t*.9)*lry*.12;
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath();
    ctx.ellipse(shx, shy, lrx*.25, lry*.1, -0.4, 0, Math.PI*2);
    ctx.fill();
    lakeSparkles.forEach(function(sp){
      var sx = lcx + Math.cos(sp.angle + t*.2) * lrx * sp.dist;
      var sy = lcy + Math.sin(sp.angle + t*.2) * lry * sp.dist;
      var spA = 0.35 + 0.35 * Math.sin(t*3 + sp.phase);
      ctx.fillStyle = 'rgba(200,240,255,'+spA+')';
      ctx.beginPath();
      ctx.arc(sx, sy, sp.size*(0.7+0.3*Math.sin(t*2+sp.phase)), 0, Math.PI*2);
      ctx.fill();
    });
  }

  function _drawPuddle(ctx, cx, cy, r, t){
    var n = 9, p2 = [];
    for(var i=0; i<n; i++){
      var a = i/n * Math.PI*2;
      var w2 = 1 + 0.2*Math.sin(t*1.3 + i*1.2 + 0.5);
      p2.push({x: cx + Math.cos(a)*r*w2, y: cy + Math.sin(a)*r*0.65*w2});
    }
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(cx+2, cy+3, r*1.05, r*0.7, 0, 0, Math.PI*2);
    ctx.fill();
    var wgrd = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    wgrd.addColorStop(0,'rgba(40,170,255,.78)');
    wgrd.addColorStop(.55,'rgba(0,110,220,.6)');
    wgrd.addColorStop(1,'rgba(0,60,170,.35)');
    ctx.fillStyle = wgrd;
    ctx.beginPath();
    ctx.moveTo((p2[0].x + p2[n-1].x)/2, (p2[0].y + p2[n-1].y)/2);
    for(var i2=0; i2<n; i2++){
      var nx = p2[(i2+1)%n];
      ctx.quadraticCurveTo(p2[i2].x, p2[i2].y, (p2[i2].x+nx.x)/2, (p2[i2].y+nx.y)/2);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0a2845'; ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(100,215,255,.85)'; ctx.lineWidth = 2; ctx.setLineDash([6,3]);
    ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(160,235,255,'+(0.3+Math.sin(t*2)*0.12)+')';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(cx+2, cy-2, r*0.44, r*0.27, Math.sin(t*0.7)*0.2, 0, Math.PI*2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.2)';
    ctx.beginPath();
    ctx.ellipse(cx-r*0.22, cy-r*0.18, r*0.2, r*0.08, -0.5, 0, Math.PI*2);
    ctx.fill();
  }

  // v6: mini-tampinha estática (estacionamento e paddock)
  function _drawMiniCap(ctx, x, y, r, color, accent){
    ctx.fillStyle = 'rgba(0,0,0,.4)';
    ctx.beginPath();
    ctx.ellipse(x+1.2, y+1.8, r, r*0.4, 0, 0, Math.PI*2);
    ctx.fill();
    var n = 14;
    ctx.fillStyle = accent;
    ctx.beginPath();
    for(var k=0; k<=n*2; k++){
      var ang = (k/n)*Math.PI;
      var rr = (k%2===0) ? r : r*0.84;
      var px = x + rr*Math.cos(ang - Math.PI/2);
      var py = y + rr*Math.sin(ang - Math.PI/2);
      if(k===0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r*0.78, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(x, y, r*0.62, 0, Math.PI*2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.ellipse(x-r*0.25, y-r*0.3, r*0.28, r*0.16, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.arc(x, y, r*0.16, 0, Math.PI*2);
    ctx.fill();
  }

  // v7: logos vetoriais para as placas de sponsor
  function _drawSponsorLogo(ctx, b){
    var cx = b.x + 3 + (b.w-3)/2;
    var cy = b.y + b.h/2 + 2;
    var sz = b.h * 0.55;
    ctx.save();
    ctx.translate(cx, cy);
    if(b.logo === 'privy'){
      // P estilizado em círculo (cor de fundo branca)
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(0, 0, sz*0.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = b.color;
      ctx.font = 'bold ' + Math.floor(sz*0.7) + 'px Arial Black, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('P', 0, 1);
    } else if(b.logo === 'cr'){
      // $ + tampinha estilizada em duas cores
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.arc(-sz*0.25, 0, sz*0.4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold ' + Math.floor(sz*0.55) + 'px Arial Black, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('$', -sz*0.25, 1);
      ctx.fillStyle = '#1a1a1a';
      ctx.font = 'bold ' + Math.floor(sz*0.65) + 'px Arial Black, sans-serif';
      ctx.fillText('CR', sz*0.20, 1);
    } else if(b.logo === 'solana'){
      // 3 barras inclinadas (logo Solana clássica)
      ctx.save();
      ctx.translate(-sz*0.45, -sz*0.30);
      var barH = sz*0.18, barW = sz*0.95, gap = sz*0.06;
      var grds = [
        ['#9945FF','#7d1fdc'],
        ['#14F195','#0eb574'],
        ['#19FB9B','#11c479']
      ];
      for(var bi=0; bi<3; bi++){
        var grd = ctx.createLinearGradient(0, 0, barW, 0);
        grd.addColorStop(0, grds[bi][0]);
        grd.addColorStop(1, grds[bi][1]);
        ctx.fillStyle = grd;
        ctx.beginPath();
        var bo = bi * (barH + gap);
        var skew = sz*0.18;
        ctx.moveTo(skew, bo);
        ctx.lineTo(barW, bo);
        ctx.lineTo(barW - skew, bo + barH);
        ctx.lineTo(0, bo + barH);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else if(b.logo === 'fogo'){
      // Chama estilizada
      ctx.fillStyle = '#FFCC00';
      ctx.beginPath();
      ctx.moveTo(0, -sz*0.50);
      ctx.bezierCurveTo(sz*0.40, -sz*0.20, sz*0.30, sz*0.30, 0, sz*0.45);
      ctx.bezierCurveTo(-sz*0.30, sz*0.30, -sz*0.40, -sz*0.20, 0, -sz*0.50);
      ctx.fill();
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.moveTo(0, -sz*0.30);
      ctx.bezierCurveTo(sz*0.25, -sz*0.10, sz*0.18, sz*0.20, 0, sz*0.32);
      ctx.bezierCurveTo(-sz*0.18, sz*0.20, -sz*0.25, -sz*0.10, 0, -sz*0.30);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(0, -sz*0.10);
      ctx.bezierCurveTo(sz*0.10, 0, sz*0.08, sz*0.14, 0, sz*0.20);
      ctx.bezierCurveTo(-sz*0.08, sz*0.14, -sz*0.10, 0, 0, -sz*0.10);
      ctx.fill();
    }
    ctx.restore();
  }

  function _roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }

  function getRacingLine(){
    return [
      {x: 120, y: 300}, {x: 120, y: 150}, {x: 300, y: 120}, {x: 520, y: 120},
      {x: 700, y: 180}, {x: 700, y: 400}, {x: 500, y: 500}, {x: 250, y: 500},
      {x: 120, y: 400}
    ];
  }

  return {
    META:META, init:init, render:render,
    isOnTrack:isOnTrack, detectInner:detectInner,
    detectPuddle:detectPuddle, detectSand:detectSand, detectGrassOnTrack:detectGrassOnTrack,
    detectBoost:detectBoost, detectOil:detectOil, detectSpin:detectSpin, getSpinDirection:getSpinDirection,
    getCannons:function(){return cannonZones;},
    checkCP:checkCP, checkLap:checkLap, resetCPs:resetCPs,
    checkObstacles:checkObstacles, lastCP:lastCP, getStartPos:getStartPos,
    checkStands:checkStands, checkPaddock:checkPaddock, checkParking:checkParking,
    getCheckpoints:getCheckpoints, getRacingLine:getRacingLine,
    get checkpoints(){ return cps; },
    get TW(){ return TW; },
  };
})();
