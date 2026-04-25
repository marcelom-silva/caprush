// TrackV3.js v4 — CapRush Overdrive!
// FIXES v4:
//  - Paddock REMOVIDO da esquerda -> DIREITO INFERIOR EXTERNO (nao bloqueia mais largada)
//  - Start/finish EXPANDIDO como pista real com reta dos boxes
//  - CP1 movido para CIMA (fora da agua)
//  - 2a poca movida para DENTRO da pista (reta direita)
//  - Grama on-track: formato ORGANICO (blob bezier), nao retangular
//  - Grama central: mais arvores + hastes animadas
//  - Lago: ripples expandindo + sparkles + reflexo
//  - Stands: finos e decorativos nas bordas
var TrackV3 = (function(){
  'use strict';
  var META = { id:'04', nome:'Terra & Cascalho v4', superficie:'asfalto', voltas:2 };
  var CW=800, CH=500, TW=50;
  var pts=[], puddleZones=[], grassOnTrack=[], innerBounds=[], cps=[], obstacles=[];
  var startRect=null, startExtended=null;
  var standZones=[], paddockZone=null, parkingZone=null, sandZones=[];
  var crowd=[], grassBlades=[], lakeSparkles=[];

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

    // FIX v4: startRect EXPANDIDO - cobre toda a largura da pista na reta esquerda
    // Para as tampinhas passarem livremente
    startRect = {

      x: m - TW*0.5,

      y: CH*0.46,

      w: TW,

      h: 14,

    };
    // Area visual estendida (decorativa - barra de pit lane)
    startExtended = {
      x: 0, y: CH*0.36,
      w: m + TW*0.55 + 8, h: CH*0.20
    };

    // FIX v4: CP1 movido para CIMA - fora da agua, no topo do chicane
    // CP2 na reta direita, CP3 na base
    cps = [
      { x: CW*0.50, y: CH*0.33, r: TW*0.62, lbl:'CP 1', ok:false },
      { x: CW-m,    y: CH*0.30, r: TW*0.62, lbl:'CP 2', ok:false },
      { x: CW*0.50, y: CH-m,    r: TW*0.62, lbl:'CP 3', ok:false },
    ];

    obstacles = [
      { x: CW*0.38, y: m + TW*0.3,        r: 8 },
      { x: CW*0.62, y: m + TW*0.3,        r: 8 },
      { x: CW-m,    y: CH*0.22,            r: 7 },
      { x: CW*0.70, y: CH*0.72 + TW*0.1,  r: 8 },
      { x: CW*0.50, y: CH-m - TW*0.18,    r: 7 },
    ];

    // FIX v4: Poca 1 no chicane central, Poca 2 na RETA DIREITA (dentro da pista)
    puddleZones = [
      { x: CW*0.16, y: CH*0.66, r: TW*0.70 },  // esquerda - na pista
      { x: CW*0.91, y: CH*0.09, r: TW*0.70 },  // direita - na pista
    ];

    // FIX v4: Grama on-track em formato ORGANICO (blob) - colisao via elipse
    grassOnTrack = [
      { type:'blob', cx:CW*0.30, cy:CH*0.80, rx:TW*0.50, ry:TW*0.34, rot:0.28 },
      { type:'blob', cx:CW*0.73, cy:CH*0.75, rx:TW*0.69, ry:TW*0.30, rot:-0.22 },
    ];

    var innerX = m + TW + 5;
    var innerY = m + TW + 5;
    var innerW = CW - 2*(m + TW) - 10;
    var innerH = CH - 2*(m + TW) - 10;
    innerBounds = [
      { type:'lake',  x:CW*0.38, y:CH*0.30, w:CW*0.24, h:CH*0.22, shape:'ellipse' },
      { type:'grass', x:innerX,      y:innerY, w:CW*0.36-innerX,        h:innerH },
      { type:'grass', x:CW*0.62,     y:innerY, w:innerX+innerW-CW*0.62, h:innerH },
      { type:'grass', x:CW*0.36,     y:innerY, w:CW*0.28, h:CH*0.28 },
      { type:'grass', x:CW*0.36,     y:CH*0.54, w:CW*0.28, h:innerY+innerH-CH*0.54 },
    ];

    // Stands FINOS - apenas borda superior e inferior externas (nao bloqueiam pista)
    standZones = [
      // Topo (acima da reta topo da pista) - very thin
      { x:CW*0.08, y:0, w:CW*0.80, h:Math.max(m*0.55, 6), nx:0, ny:1, label:'STANDS' },
      // Borda inferior (abaixo da curva de baixo)
      { x:CW*0.28, y:CH-Math.max(m-TW*0.5, 6), w:CW*0.44, h:Math.max(m-TW*0.5, 6),
        nx:0, ny:-1, label:'STANDS' },
        {
  x: CW*0.70,
  y: CH*0.35,
  w: CW*0.22,
  h: CH*0.18,
  nx: -1,
  ny: 0,
  label:'STANDS'
},
    ];

    // FIX v4: PADDOCK no CANTO INFERIOR DIREITO - completamente fora da pista
    // A pista curva de pts[8]=(CW-m, CH*0.60) para pts[9]=(CW*0.75, CH*0.72)
    // Paddock em x>CW*0.78, y>CH*0.72 e seguro
    paddockZone = {
  x: CW*0.107,
y: CH*0.21,
w: CW*0.16,
h: CH*0.22,
  nx: -1,
  ny: 0,
  label: 'PADDOCK'
};

parkingZone = {
  x: CW*0.79,
  y: CH*0.76,
  w: CW*0.20,
  h: CH*0.25
};

    // Zona de areia — faixa entre arquibancada direita e borda (visível sobre stands)
    sandZones = [
      { x:CW*0.893, y:CH*0.36, w:CW*0.08, h:CH*0.17 }
    ];

    _initCrowd();
    _initGrassBlades();
    _initLakeSparkles();
  }

function getCheckpoints(){
  return cps;
}

  function _initCrowd(){
    crowd = [];
    standZones.forEach(function(sz){
      var step = 7;
      var cols = Math.floor(sz.w / step);
      var rows = Math.max(1, Math.floor(sz.h * 0.7 / 9));
      for(var r=0;r<rows;r++) for(var c=0;c<cols;c++){
        crowd.push({
          x: sz.x + 4 + c * step,
          y: sz.y + sz.h * 0.1 + r * 9,
          color:['#FF4444','#4488FF','#44AA44','#FFEE22','#FF44FF','#44FFFF'][(r*17+c*7)%6],
          phase:(r*cols+c)*0.31, sz:sz
        });
      }
    });
  }

  function _initGrassBlades(){
    grassBlades = [];
    // Hastes na grama interior
    for(var i=0;i<500;i++) grassBlades.push({
      rx:Math.random(), ry:Math.random(),
      h:3+Math.random()*5, phase:Math.random()*Math.PI*2,
      type:'inner'
    });
    // Hastes on-track grass
    grassOnTrack.forEach(function(g,gi){
      var n = Math.floor(Math.PI * g.rx * g.ry / 8);
      for(var i=0;i<n;i++) grassBlades.push({
        gIdx:gi, angle:Math.random()*Math.PI*2, dist:Math.random(),
        h:3+Math.random()*4.5, phase:Math.random()*Math.PI*2, type:'track'
      });
      
    });
  }

  function _initLakeSparkles(){
    lakeSparkles = [];
    for(var i=0;i<18;i++) lakeSparkles.push({
      angle:Math.random()*Math.PI*2,
      dist:0.2+Math.random()*0.65,
      phase:Math.random()*Math.PI*2,
      size:1+Math.random()*2.5
    });
  }

  // ── isOnTrack ──────────────────────────────────────────────
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

  if(
    pos.x > paddockZone.x + r &&
    pos.x < paddockZone.x + paddockZone.w - r &&
    pos.y > paddockZone.y + r &&
    pos.y < paddockZone.y + paddockZone.h - r
  ){
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
  function getStartPos(){
    if(!startRect) return{x:80,y:CH/2};
    return{x:startRect.x+startRect.w+22, y:startRect.y+startRect.h/2};
  }

  // ── RENDER ─────────────────────────────────────────────────
  function render(ctx, cw, ch, t){
    if(!pts.length) init(cw,ch);

    // Fundo
    ctx.fillStyle='#1A1208'; ctx.fillRect(0,0,cw,ch);
    ctx.fillStyle='rgba(70,50,30,.32)';
    for(var i=0;i<240;i++) ctx.fillRect((i*137.5)%cw,(i*97.3)%ch,2,2);

    // ── PADDOCK inferior direito ──
    if(paddockZone){
      var pz=paddockZone;
      var pg=ctx.createLinearGradient(pz.x,pz.y,pz.x+pz.w,pz.y+pz.h);
      pg.addColorStop(0,'#6B2800'); pg.addColorStop(1,'#C05000');
      ctx.fillStyle=pg; ctx.fillRect(pz.x,pz.y,pz.w,pz.h);

      // estacionamento de tampinhas
for(var i=0;i<18;i++){
  var px = pz.x + 20 + (i%6)*28;
  var py = pz.y + 20 + Math.floor(i/6)*28;

  // sombra
  ctx.fillStyle='rgba(0,0,0,.4)';
  ctx.beginPath();
  ctx.arc(px+2,py+3,10,0,Math.PI*2);
  ctx.fill();

  // tampinha
  ctx.fillStyle=['#FF4444','#44AAFF','#44FF88','#FFCC00'][i%4];
  ctx.beginPath();
  ctx.arc(px,py,10,0,Math.PI*2);
  ctx.fill();

  // borda
  ctx.strokeStyle='#222';
  ctx.lineWidth=1;
  ctx.stroke();
}

ctx.globalAlpha=1;
    }

    // ── Stands finos com areia/cascalho e torcida ──
    standZones.forEach(function(sz){
      if(sz.h < 2) return;
      // Fundo base
      var sg = ctx.createLinearGradient(sz.x,sz.y,sz.x,sz.y+sz.h);
      sg.addColorStop(0,'#C8A060'); sg.addColorStop(0.5,'#B08840'); sg.addColorStop(1,'#806020');
      ctx.fillStyle=sg; ctx.fillRect(sz.x,sz.y,sz.w,sz.h);
      // Textura de areia/cascalho: pontilhado procedural com semente fixa
      if(sz.h >= 4){
        var seed = Math.round(sz.x + sz.y);
        for(var gi=0; gi<Math.min(sz.w*sz.h*0.08, 600); gi++){
          var gx = sz.x + ((seed*gi*179+17)%Math.max(sz.w,1));
          var gy = sz.y + ((seed*gi*137+31)%Math.max(sz.h,1));
          var gb = [['#E8C87A',1.5],['#705020',1],['#A07030',1.2],['#D4A850',1.3]][gi%4];
          ctx.globalAlpha = 0.55;
          ctx.fillStyle = gb[0];
          ctx.beginPath();
          ctx.arc(gx, gy, gb[1], 0, Math.PI*2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      // Torcida so se houver espaco suficiente
      if(sz.h>10){
        crowd.forEach(function(c){
          if(c.sz!==sz) return;
          var wave=Math.sin(t*2.5+c.phase)*3;
          ctx.fillStyle=c.color; ctx.fillRect(c.x-2,c.y-wave-2,4,6);
          ctx.fillStyle='#FFD8A8'; ctx.beginPath();var pulse = 1 + Math.sin(t*4)*0.2;

ctx.save();

ctx.shadowColor = "#FFD700";
ctx.shadowBlur = 20;

ctx.strokeStyle = "#FFD700";
ctx.lineWidth = 2;

ctx.beginPath();
ctx.arc(c.x, c.y, c.r * pulse, 0, Math.PI*2);
ctx.stroke();

ctx.globalAlpha = 0.15;
ctx.beginPath();
ctx.arc(c.x, c.y, c.r * 1.2, 0, Math.PI*2);
ctx.fillStyle = "#FFD700";
ctx.fill();

ctx.restore();ctx.fill();
        });
      }
      ctx.strokeStyle='#FFD700'; ctx.lineWidth=2; ctx.setLineDash([8,4]);
      ctx.strokeRect(sz.x+1,sz.y+1,sz.w-2,sz.h-2); ctx.setLineDash([]);
    });

    // ── Interior grama escura ──
    var m2=TW*0.85+TW;
    ctx.fillStyle='#0D2B0D';
    _roundRect(ctx,m2,m2,cw-2*m2,ch-2*m2,14); ctx.fill();

    // Grama interior - listras diagonais de fundo
    ctx.strokeStyle='rgba(0,120,0,.14)'; ctx.lineWidth=1;
    for(var gx=0;gx<cw;gx+=8){
      ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx-20,ch);ctx.stroke();
    }

    // Hastes de grama animadas (interior)
    var innerXb=m2, innerYb=m2, innerWb=cw-2*m2, innerHb=ch-2*m2;
    grassBlades.forEach(function(b){
      if(b.type!=='inner') return;
      var bx=innerXb+b.rx*innerWb, by=innerYb+b.ry*innerHb;
      var lean=Math.sin(t*1.8+b.phase)*3;
      ctx.strokeStyle='rgba('+(30+Math.floor(b.h*10))+',200,40,.55)';
      ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(bx,by);
      ctx.quadraticCurveTo(bx+lean,by-b.h*.5,bx+lean*.6,by-b.h);
      ctx.stroke();
    });

    // MAIS ARVORES (16 posicoes em vez de 8)
    var treePos=[
      [cw*0.18,ch*0.22],[cw*0.28,ch*0.35],[cw*0.16,ch*0.48],[cw*0.20,ch*0.62],
      [cw*0.28,ch*0.50],[cw*0.22,ch*0.38],
      [cw*0.72,ch*0.20],[cw*0.82,ch*0.35],[cw*0.76,ch*0.48],[cw*0.72,ch*0.62],
      [cw*0.82,ch*0.50],[cw*0.76,ch*0.38],
      [cw*0.38,ch*0.72],[cw*0.50,ch*0.70],[cw*0.62,ch*0.72],[cw*0.50,ch*0.78],
    ];
    treePos.forEach(function(tp){
      // Sombra da arvore
      ctx.fillStyle='rgba(0,0,0,.18)';
      ctx.beginPath();ctx.ellipse(tp[0]+5,tp[1]+14,12,5,0,0,Math.PI*2);ctx.fill();
      // Tronco
      ctx.fillStyle='#3D2008'; ctx.fillRect(tp[0]-3,tp[1]+8,6,14);
      // Copa em layers (efeito 3D)
      [[16,'#1A5C1A'],[12,'#1E7020'],[8,'#28902A'],[4,'#38B838']].forEach(function(l){
        ctx.fillStyle=l[1];
        ctx.beginPath();ctx.arc(tp[0],tp[1]-2,l[0],0,Math.PI*2);ctx.fill();
      });
      // Brilho no topo
      ctx.fillStyle='rgba(80,220,80,.25)';
      ctx.beginPath();ctx.ellipse(tp[0]-3,tp[1]-8,5,3,-0.5,0,Math.PI*2);ctx.fill();
    });

    // LAGO com animacao rica
    var lx=innerBounds[0];
    if(lx){
      var lcx=lx.x+lx.w/2, lcy=lx.y+lx.h/2;
      var lrx=lx.w/2, lry=lx.h/2;
      // Base do lago
      var lgrd=ctx.createRadialGradient(lcx-lrx*.2,lcy-lry*.2,2,lcx,lcy,lrx);
      lgrd.addColorStop(0,'rgba(40,160,255,.9)');
      lgrd.addColorStop(.35,'rgba(10,100,220,.75)');
      lgrd.addColorStop(.7,'rgba(0,60,180,.6)');
      lgrd.addColorStop(1,'rgba(0,30,120,.35)');
      ctx.fillStyle=lgrd;
      ctx.beginPath();ctx.ellipse(lcx,lcy,lrx,lry,0,0,Math.PI*2);ctx.fill();
      // Ripples expandindo
      for(var ri=0;ri<5;ri++){
        var rphase=(t*0.7+ri*0.55)%(Math.PI*2);
        var rscale=0.15+0.55*(rphase/(Math.PI*2));
        var ralpha=0.35*(1-rphase/(Math.PI*2));
        ctx.strokeStyle='rgba(120,210,255,'+ralpha+')';
        ctx.lineWidth=1.5;
        ctx.beginPath();ctx.ellipse(lcx,lcy,lrx*rscale,lry*rscale,Math.sin(t*.3)*.08,0,Math.PI*2);ctx.stroke();
      }
      // Reflexo de luz (shimmer)
      var shimmerX=lcx-lrx*.3+Math.sin(t*1.2)*lrx*.25;
      var shimmerY=lcy-lry*.2+Math.cos(t*.9)*lry*.15;
      ctx.fillStyle='rgba(255,255,255,.12)';
      ctx.beginPath();ctx.ellipse(shimmerX,shimmerY,lrx*.25,lry*.1,-0.4,0,Math.PI*2);ctx.fill();
      // Sparkles do lago
      lakeSparkles.forEach(function(sp){
        var sx=lcx+Math.cos(sp.angle+t*.2)*lrx*sp.dist;
        var sy=lcy+Math.sin(sp.angle+t*.2)*lry*sp.dist;
        var spAlpha=0.4+0.4*Math.sin(t*3+sp.phase);
        ctx.fillStyle='rgba(200,240,255,'+spAlpha+')';
        ctx.beginPath();ctx.arc(sx,sy,sp.size*(0.7+0.3*Math.sin(t*2+sp.phase)),0,Math.PI*2);ctx.fill();
      });
    }

    // ── Borda e faixa da pista ──
    _drawPath(ctx, TW+18, '#2A1F18');
    _drawPath(ctx, TW,    '#5C4530');
    ctx.save(); ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.lineWidth=1; ctx.setLineDash([4,8]);
    _drawPathStroke(ctx); ctx.setLineDash([]); ctx.restore();
    ctx.save(); ctx.strokeStyle='rgba(255,215,0,.32)'; ctx.lineWidth=2; ctx.setLineDash([12,10]);
    _drawPathStroke(ctx); ctx.setLineDash([]); ctx.restore();

// 🅿️ ESTACIONAMENTO REFORMULADO
if(parkingZone){
  var pz = parkingZone;
  var pCols=5, pRows=2;
  var pSpW=(pz.w-16)/pCols, pSpH=(pz.h-38)/pRows;

  // Asfalto escuro com gradiente sutil
  var pGrd=ctx.createLinearGradient(pz.x,pz.y,pz.x,pz.y+pz.h);
  pGrd.addColorStop(0,'#1E1E24'); pGrd.addColorStop(1,'#161618');
  ctx.fillStyle=pGrd;
  ctx.fillRect(pz.x,pz.y,pz.w,pz.h);

  // Borda com brilho
  ctx.strokeStyle='rgba(255,215,0,.2)'; ctx.lineWidth=1.5;
  ctx.strokeRect(pz.x+0.75,pz.y+0.75,pz.w-1.5,pz.h-1.5);

  // Faixa de entrada
  ctx.fillStyle='rgba(255,215,0,.12)';
  ctx.fillRect(pz.x, pz.y, pz.w, 6);

  // Placa 🅿
  ctx.save();
  ctx.font='bold '+Math.floor(pz.w*0.12)+'px Bebas Neue,Arial Black,Arial';
  ctx.fillStyle='rgba(0,229,255,.7)';
  ctx.textAlign='left'; ctx.textBaseline='top';
  ctx.fillText('P', pz.x+6, pz.y+7);
  // Linha separadora logo abaixo da placa
  ctx.strokeStyle='rgba(255,255,255,.08)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(pz.x,pz.y+26); ctx.lineTo(pz.x+pz.w,pz.y+26); ctx.stroke();
  ctx.restore();

  // Vagas com marcação e tampinhas
  var pColors=[
    {c:'#00E5FF',a:'#00A5C8',k:'雪'},
    {c:'#FF9900',a:'#CC7700',k:'魔'},
    {c:'#FF2A2A',a:'#AA0000',k:'X'},
    {c:'#44FF88',a:'#22AA55',k:'緑'},
    {c:'#FFCC00',a:'#AA8800',k:'金'},
    {c:'#CC44FF',a:'#882299',k:'紫'},
    {c:'#FF44AA',a:'#AA2266',k:'桃'},
    {c:'#44CCFF',a:'#2288AA',k:'水'},
    {c:'#FF8844',a:'#AA5522',k:'橙'},
    {c:'#88FF44',a:'#55AA22',k:'草'},
  ];
  for(var pr=0;pr<pRows;pr++){
    for(var pc=0;pc<pCols;pc++){
      var pi=pr*pCols+pc;
      var psx=pz.x+8+pc*pSpW, psy=pz.y+28+pr*pSpH;
      // Vaga
      ctx.strokeStyle='rgba(255,255,255,.12)'; ctx.lineWidth=1;
      ctx.strokeRect(psx+1,psy+1,pSpW-2,pSpH-2);
      // Número da vaga (pequeno)
      ctx.font='7px Arial'; ctx.fillStyle='rgba(255,255,255,.2)';
      ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillText((pi+1).toString(), psx+3, psy+2);
      // Tampinha estacionada com CapSprite se disponível
      var pcx=psx+pSpW/2, pcy=psy+pSpH/2;
      var col=pColors[pi%pColors.length];
      if(typeof CapSprite!=='undefined'){
        // Sombra sob a tampinha
        ctx.save(); ctx.globalAlpha=0.25;
        ctx.fillStyle='#000';
        ctx.beginPath(); ctx.ellipse(pcx+2,pcy+3,9,4,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
        CapSprite.drawCap(ctx,pcx,pcy,10,col.c,col.a,col.k,pi*0.52,0,0.4,false);
      } else {
        ctx.fillStyle=col.c;
        ctx.beginPath(); ctx.arc(pcx,pcy,10,0,Math.PI*2); ctx.fill();
      }
    }
  }
}

    // ── Pocas organicas ──
    puddleZones.forEach(function(p){
      _drawOrganicPuddle(ctx,p.x,p.y,p.r,t);
      CapSprite.drawWaterFX(ctx, p.x, p.y, p.r, t);
    });

    // ── Grama on-track ORGANICA ──
    grassOnTrack.forEach(function(g,gi){
      if(g.type!=='blob') return;
      // Desenha blob organico com bezier
      ctx.save();ctx.translate(g.cx,g.cy);ctx.rotate(g.rot);
      var n=8;
      var gGrd=ctx.createRadialGradient(0,0,2,0,0,Math.max(g.rx,g.ry));
      gGrd.addColorStop(0,'rgba(80,230,70,.55)');
      gGrd.addColorStop(1,'rgba(30,180,30,.2)');
      ctx.fillStyle=gGrd;
      ctx.beginPath();
      for(var bi2=0;bi2<n;bi2++){
        var ang=bi2/n*Math.PI*2;
        var wobble=1+0.18*Math.sin(t*1.2+bi2*1.4);
        var px=g.rx*wobble*Math.cos(ang), py=g.ry*wobble*Math.sin(ang);
        if(bi2===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
      }
      ctx.closePath(); ctx.fill();
      
      ctx.restore();
      // Hastes on-track
      grassBlades.forEach(function(b){
        if(b.type!=='track'||b.gIdx!==gi) return;
        var ang=b.angle, dist=b.dist;
        var bx2=g.cx+Math.cos(ang+g.rot)*g.rx*dist;
        var by2=g.cy+Math.sin(ang+g.rot)*g.ry*dist;
        var lean=Math.sin(t*2+b.phase)*2.8;
        ctx.strokeStyle='rgba(40,220,40,.65)'; ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(bx2,by2);
        ctx.quadraticCurveTo(bx2+lean,by2-b.h*.5,bx2+lean*.6,by2-b.h);
        ctx.stroke();
      });
    });

    // ── Obstaculos ──
    obstacles.forEach(function(o){
      ctx.fillStyle='rgba(0,0,0,.28)';
      ctx.beginPath();ctx.ellipse(o.x+3,o.y+3,o.r+2,o.r+1,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#5C3A1A';ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#7A5030';ctx.beginPath();ctx.arc(o.x-1,o.y-2,o.r*.5,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#3A2010';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.stroke();
    });

    // ── START/FINISH expandido (pit straight) ──

    // ── Zona de areia (visível sobre arquibancada direita) ──
    sandZones.forEach(function(sz){
      ctx.save();
      var sGrd=ctx.createLinearGradient(sz.x,sz.y,sz.x+sz.w,sz.y+sz.h);
      sGrd.addColorStop(0,'#DDBA70');sGrd.addColorStop(.4,'#C8A055');sGrd.addColorStop(1,'#A07830');
      ctx.fillStyle=sGrd;ctx.fillRect(sz.x,sz.y,sz.w,sz.h);
      ctx.strokeStyle='rgba(120,80,20,.55)';ctx.lineWidth=2;
      ctx.strokeRect(sz.x+1,sz.y+1,sz.w-2,sz.h-2);
      var seed=Math.round(sz.x*31+sz.y*17);
      for(var gi=0;gi<Math.min(sz.w*sz.h*0.16,950);gi++){
        var gx2=sz.x+((seed*gi*179+17)%(sz.w|1));
        var gy2=sz.y+((seed*gi*137+31)%(sz.h|1));
        ctx.globalAlpha=0.62;
        ctx.fillStyle=[['#F0D07A',1.5],['#604518',1.0],['#A07840',1.2],['#E0C060',1.3],['#FFE890',0.9]][gi%5][0];
        ctx.beginPath();ctx.arc(gx2,gy2,[1.5,1.0,1.2,1.3,0.9][gi%5],0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=0.30;
      ctx.font='bold '+Math.floor(sz.w*.22)+'px Bebas Neue,Arial Black';
      ctx.fillStyle='#6B3A0A';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText('AREIA',sz.x+sz.w/2,sz.y+sz.h/2);
      ctx.restore();
    });

    if(startRect){
      var sl=startRect;
      var sq=8;
      var nc=Math.ceil(sl.w/sq), nr=Math.ceil(sl.h/sq);
      for(var row=0;row<nr;row++) for(var col=0;col<nc;col++){
        ctx.fillStyle=(row+col)%2===0?'#FFFFFF':'#111111';
        ctx.fillRect(sl.x+col*sq, sl.y+row*sq, sq, sq);
      }
      // Borda dourada
      ctx.strokeStyle='#FFD700'; ctx.lineWidth=3;
      ctx.strokeRect(sl.x,sl.y,sl.w,sl.h);
      // Label
      ctx.fillStyle='#FFD700'; ctx.font='bold 8px Rajdhani,sans-serif';
      ctx.textAlign='center';
      ctx.fillText('START / FINISH', sl.x+sl.w/2, sl.y-4);
      // Pit lane marking
      ctx.fillStyle='rgba(255,120,0,.5)';
      ctx.fillRect(sl.x, sl.y+sl.h+2, sl.w, 4);
      ctx.fillStyle='rgba(255,180,0,.4)';
      ctx.font='bold 7px Rajdhani,sans-serif'; ctx.textAlign='center';
      ctx.fillText('PIT LANE', sl.x+sl.w/2, sl.y+sl.h+12);
    }

    // ── Checkpoints ──
cps.forEach(function(c){
  var pulse = 1 + Math.sin(t*4)*0.12;

  ctx.save();

  // aura leve (bem sutil)
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#FFD700";
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r * 0.9, 0, Math.PI*2);
  ctx.fill();

  // anel principal (mais fino)
  ctx.globalAlpha = c.ok ? 0.3 : 1;
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r * 0.7 * pulse, 0, Math.PI*2);
  ctx.stroke();

  ctx.restore();
});
  }

  // Poca organica
  function _drawOrganicPuddle(ctx,cx,cy,r,t){
    var n=9, pts2=[];
    for(var i=0;i<n;i++){
      var a=i/n*Math.PI*2;
      var w2=1+0.2*Math.sin(t*1.3+i*1.2+0.5);
      pts2.push({x:cx+Math.cos(a)*r*w2, y:cy+Math.sin(a)*r*0.65*w2});
    }
    var wgrd=ctx.createRadialGradient(cx,cy,2,cx,cy,r);
    wgrd.addColorStop(0,'rgba(40,170,255,.58)');
    wgrd.addColorStop(.55,'rgba(0,110,220,.38)');
    wgrd.addColorStop(1,'rgba(0,60,170,.15)');
    ctx.fillStyle=wgrd;
    ctx.beginPath();
    ctx.moveTo((pts2[0].x+pts2[n-1].x)/2,(pts2[0].y+pts2[n-1].y)/2);
    for(var i2=0;i2<n;i2++){
      var next=pts2[(i2+1)%n];
      ctx.quadraticCurveTo(pts2[i2].x,pts2[i2].y,(pts2[i2].x+next.x)/2,(pts2[i2].y+next.y)/2);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='rgba(100,215,255,.88)'; ctx.lineWidth=2.5; ctx.setLineDash([6,3]);
    ctx.stroke(); ctx.setLineDash([]);
    // Onda interna
    ctx.strokeStyle='rgba(160,235,255,'+(0.3+Math.sin(t*2)*.12)+')';
    ctx.lineWidth=1.2;
    ctx.beginPath();ctx.ellipse(cx+2,cy-2,r*.44,r*.27,Math.sin(t*.7)*.2,0,Math.PI*2);ctx.stroke();
    // Reflexo
    ctx.fillStyle='rgba(255,255,255,.16)';
    ctx.beginPath();ctx.ellipse(cx-r*.22,cy-r*.18,r*.2,r*.08,-0.5,0,Math.PI*2);ctx.fill();
  }

  function _drawPath(ctx,width,color){
    if(!pts.length) return;
    ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;
    ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(function(p,i){if(i>0)ctx.lineTo(p.x,p.y);});
    ctx.closePath();ctx.stroke();ctx.restore();
  }
  function _drawPathStroke(ctx){
    if(!pts.length) return;
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(function(p,i){if(i>0)ctx.lineTo(p.x,p.y);});
    ctx.closePath();ctx.stroke();
  }
  function _roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
    ctx.closePath();
  }

  function getRacingLine(){
  return [
    {x: 120, y: 300},
    {x: 120, y: 150},
    {x: 300, y: 120},
    {x: 520, y: 120},
    {x: 700, y: 180},
    {x: 700, y: 400},
    {x: 500, y: 500},
    {x: 250, y: 500},
    {x: 120, y: 400}
  ];
}

  return {
    META:META, init:init, render:render,
    isOnTrack:isOnTrack, detectInner:detectInner,
    detectPuddle:detectPuddle, detectSand:detectSand, detectGrassOnTrack:detectGrassOnTrack,
    checkCP:checkCP, checkLap:checkLap, resetCPs:resetCPs,
    checkObstacles:checkObstacles, lastCP:lastCP, getStartPos:getStartPos,
    checkStands:checkStands, checkPaddock:checkPaddock, getCheckpoints:getCheckpoints, getRacingLine: getRacingLine,
    get checkpoints(){ return cps; },
    get TW(){ return TW; },
  };
})();
