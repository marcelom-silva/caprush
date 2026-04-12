// TrackV2.js – Pista CapRush reformulada
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
