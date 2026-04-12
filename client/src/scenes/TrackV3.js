// TrackV3.js - Pista corrigida
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
