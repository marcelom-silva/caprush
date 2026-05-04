// TrackMonza.js v4 — CapRush Overdrive!
// Aplica todas as correções da TrackV3 v6-v10:
//  • Geometria F1 (Monza CW) preservada exatamente como estava
//  • Marco 2.8: BOOST/OIL/SPIN integrados, com detectBoost/Oil/Spin
//  • Sponsor boards com LOGOS vetoriais (Privy, $CR, Solana, Fogo)
//  • Mini-tampinhas no paddock e estacionamento (não mais retângulos)
//  • Grama na pista como tufos balançando (verde claro, não lodo)
//  • Zebras mais estreitas e arredondadas
//  • Canhões fora da pista
//  • getStartPos atrás da linha de largada
//  • Arquibancadas longe da pista (sem ricochete inadequado)
var TrackMonza = (function(){
  'use strict';
  var TW, CW, CH;
  var pts=[], standZones=[], chicurbs=[], obstacles=[], potholes=[];
  // Marco 2.9.2 (5i): projéteis ativos dos canhões
  var projectiles=[];
  var puddles=[], lakesDecor=[], grassInner=[], grassBlades=[];
  var parkingZone=null, paddockZone=null, helipadZone=null, _checkpoints=[], _cpHit=[];
  var _startLine=null, crowd=[];
  var boostZones=[], oilZones=[], spinZones=[];
  var sponsorBoards=[], cannonZones=[];
  var treePosArr=[];  // Marco 2.9.2: árvores espalhadas pelo gramado interior
  var grassOnTrack=[];
  var META={voltas:2,nome:'Monza'};

  function init(cw,ch){
    CW=cw; CH=ch;
    TW=Math.min(cw,ch)*0.096;

    // ── CIRCUIT CENTERLINE (Monza CW) — INTACTA ──────────────────────
    pts=[
      {x:CW*0.12,y:CH*0.84}, {x:CW*0.35,y:CH*0.84}, {x:CW*0.58,y:CH*0.84},
      {x:CW*0.76,y:CH*0.84}, {x:CW*0.87,y:CH*0.76}, {x:CW*0.89,y:CH*0.64},
      {x:CW*0.85,y:CH*0.52}, {x:CW*0.87,y:CH*0.41}, {x:CW*0.83,y:CH*0.30},
      {x:CW*0.76,y:CH*0.19}, {x:CW*0.66,y:CH*0.13}, {x:CW*0.55,y:CH*0.15},
      {x:CW*0.44,y:CH*0.12}, {x:CW*0.35,y:CH*0.15}, {x:CW*0.28,y:CH*0.20},
      {x:CW*0.20,y:CH*0.29}, {x:CW*0.14,y:CH*0.40}, {x:CW*0.16,y:CH*0.52},
      {x:CW*0.11,y:CH*0.62}, {x:CW*0.09,y:CH*0.73}, {x:CW*0.11,y:CH*0.80},
    ];

    // Marco 2.9.2: faixa de largada VERTICAL (atravessa pista horizontal),
    // dimensões = mesmas da V3 (TW × 14, só rotacionado: 14 × TW). Não passa da pista.
    _startLine={x:CW*0.17-7, y:CH*0.84-TW*0.5, w:14, h:TW};

    _checkpoints=[
      // Marco 2.9.2 (H): CPs MENORES (TW*0.32) e ENCOSTADOS NAS BORDAS
      // (não no centro da pista). Posicionados no lado externo de cada curva.
      // CP1 — Curva Grande (lado externo): pista vai NW→S, borda externa = direita
      {x:CW*0.91,y:CH*0.64,r:TW*0.32,lbl:'CP1 Prima Variante'},
      // CP2 — topo Lesmo (lado externo = norte/cima)
      {x:CW*0.54,y:CH*0.10,r:TW*0.32,lbl:'CP2 Lesmo'},
      // CP3 — Parabolica (lado externo = oeste/esquerda)
      {x:CW*0.10,y:CH*0.44,r:TW*0.32,lbl:'CP3 Ascari'},
    ];
    _cpHit=[false,false,false];

    var topH=Math.max(TW*0.95,18);
    var sfH=Math.max(TW*0.70,12);
    standZones=[
      // Topo (acima da reta Roggia/Lesmo) — bem encostada na borda norte
      {x:CW*0.18,y:0,w:CW*0.66,h:topH,nx:0,ny:1,label:'STANDS'},
      // Reta principal SF — sul (Marco 2.9.2: aproximada da reta de chegada)
      {x:CW*0.10,y:CH*0.84+TW*0.85,w:CW*0.66,h:sfH,nx:0,ny:-1,label:'STANDS'},
      // Direita (Curva Grande) — afastada da pista
      {x:CW-Math.max(TW*0.6,18),y:CH*0.40,w:Math.max(TW*0.6,18),h:CH*0.30,nx:-1,ny:0,label:'STANDS'},
      // Esquerda (Parabolica)
      {x:0,y:CH*0.55,w:Math.max(TW*0.5,16),h:CH*0.25,nx:1,ny:0,label:'STANDS'},
    ];

    chicurbs=_buildChicurbs();

    obstacles=[
      {x:CW*0.88,y:CH*0.70,r:TW*0.07,nx:0,ny:0},
      {x:CW*0.74,y:CH*0.86,r:TW*0.07,nx:0,ny:0},
      // Marco 2.9.2: movido de 0.30 (que ficava DENTRO do boost) pra 0.55 (livre)
      {x:CW*0.55,y:CH*0.86,r:TW*0.07,nx:0,ny:0},
      {x:CW*0.52,y:CH*0.11,r:TW*0.07,nx:0,ny:0},
      {x:CW*0.15,y:CH*0.49,r:TW*0.07,nx:0,ny:0},
      {x:CW*0.08,y:CH*0.76,r:TW*0.07,nx:0,ny:0},
    ];

    potholes=[
      // Marco 2.9.2 (H): movidos pra LONGE de outras armadilhas
      // Buraco 1: meio da reta sul (entre largada e CP1) — fora do boost
      {x:CW*0.45,y:CH*0.84,r:TW*0.16},
      // Buraco 2: descida da curva NE (entre CP1 e Lesmo) — fora de spin/oil
      {x:CW*0.85,y:CH*0.36,r:TW*0.14},
      // Buraco 3: subida pela Parabolica — fora de tudo
      {x:CW*0.13,y:CH*0.68,r:TW*0.14},
    ];

    puddles=[
      {x:CW*0.62,y:CH*0.84,r:TW*0.45},  // poça reta sul
      {x:CW*0.87,y:CH*0.55,r:TW*0.42},  // poça pré-CP1
      {x:CW*0.20,y:CH*0.27,r:TW*0.40},  // poça pós-CP2 (Lesmo→Ascari)
    ];

    // Marco 2.9.2 (H): Lago central GRANDE com ponte do amor + crocodilo.
    // O lago é decorativo, não detectado como água da pista.
    lakesDecor=[
      // Lago principal (grande, ~30% da largura, com brilho)
      {x:CW*0.50,y:CH*0.42,rx:CW*0.16,ry:CH*0.11, big:true},
    ];

    grassInner=[
      // SO interior (entre lago e parabolica)
      {x:CW*0.30,y:CH*0.50,rx:CW*0.07,ry:CH*0.06},
      // SE interior (entre lago e curva grande)
      {x:CW*0.72,y:CH*0.50,rx:CW*0.07,ry:CH*0.06},
      // Sul interior (perto da reta principal sem cobrir paddock)
      {x:CW*0.40,y:CH*0.65,rx:CW*0.08,ry:CH*0.06},
      {x:CW*0.62,y:CH*0.65,rx:CW*0.08,ry:CH*0.06},
    ];

    // ── Grama NA PISTA (Monza tem 1 só, na entrada da Parabolica) ───
    grassOnTrack=[
      {type:'blob', cx:CW*0.13, cy:CH*0.70, rx:TW*0.55, ry:TW*0.32, rot:0.4},
    ];

    // Estacionamento (canto superior esquerdo, FORA da pista — não tampado pela grama)
    parkingZone={x:CW*0.02,y:CH*0.02,w:CW*0.16,h:CH*0.12};
    // Paddock (interior, longe da pista)
    paddockZone={x:CW*0.20,y:CH*0.66,w:CW*0.13,h:CH*0.11,nx:-1,ny:0,label:'PADDOCK'};
    // Marco 2.9.2 (5e): heliponto reaparece no centro do paddock interno
    helipadZone={x:CW*0.70, y:CH*0.30, r:TW*0.50};

    // ── Marco 2.8 + 2.9.2 (H): BOOST / OIL / SPIN realocados sem sobrepor ──
    // BOOST: início da reta sul (oeste, logo após Parabolica) — fora do pothole 1 (0.45)
    boostZones=[
      {x:CW*0.24, y:CH*0.84-TW*0.18, w:TW*1.0, h:TW*0.55, angle:0}
    ];
    // OIL: topo Lesmo após CP2 — fora do pothole 2 e da puddle 3
    oilZones=[
      {x:CW*0.40, y:CH*0.14, r:TW*0.40}
    ];
    // SPIN/twister: pré-Curva Grande (CP1) — antes do pothole 2 e puddle 2
    spinZones=[
      {x:CW*0.88, y:CH*0.70, r:TW*0.20}
    ];

    // ── Sponsor boards COM LOGOS — gramado interno, sem conflito com heliponto ──
    var bw=TW*0.85, bh=TW*0.32;
    sponsorBoards=[
      // SO interior (entre paddock e parabolica)
      {x:CW*0.22-bw/2, y:CH*0.55, w:bw, h:bh, color:'#d11515', dark:'#7a0000', logo:'privy'},
      // NO interior
      {x:CW*0.30-bw/2, y:CH*0.32, w:bw, h:bh, color:'#FFD700', dark:'#7a5a00', logo:'cr'},
      // S interior central — afastado da reta sul
      {x:CW*0.50-bw/2, y:CH*0.70, w:bw, h:bh, color:'#1a5fa5', dark:'#0a3a5a', logo:'solana'},
      // E interior — perto Curva Grande
      {x:CW*0.78-bw/2, y:CH*0.55, w:bw, h:bh, color:'#3a8a1a', dark:'#1a4810', logo:'fogo'},
    ];

    // ── Canhões fora da pista — Marco 2.9.2 (rev): aleatoriedade FORTE ─────
    // Cada canhão dispara INDEPENDENTE com cooldownBase + jitter aleatório.
    // Jitter ~ base = imprevisibilidade real (entre 1.2x e 4.5x do base).
    // nextShot inicial bem espalhado pra primeira rodada não ter sincronia.
    cannonZones=[
      // NO — entre reta de cima e Lesmo
      {x:CW*0.45, y:CH*0.27, angle:Math.PI*0.5, r:11, lastShot:0,
       cooldownBase: 2400, cooldownJitter: 2200, nextShot: Date.now()+ 700},
      // NE — interior da Curva Grande
      {x:CW*0.65, y:CH*0.42, angle:Math.PI*1.0, r:11, lastShot:0,
       cooldownBase: 2800, cooldownJitter: 2600, nextShot: Date.now()+1900},
      // SE — interior livre
      {x:CW*0.62, y:CH*0.58, angle:Math.PI*1.5, r:11, lastShot:0,
       cooldownBase: 2200, cooldownJitter: 2000, nextShot: Date.now()+3300},
      // SO — interior livre
      {x:CW*0.42, y:CH*0.62, angle:Math.PI*0.0, r:11, lastShot:0,
       cooldownBase: 2600, cooldownJitter: 2400, nextShot: Date.now()+4900},
    ];

    // Marco 2.9.2: árvores espalhadas pelo gramado interior (filtra colisões)
    treePosArr = [
      [CW*0.27, CH*0.40], [CW*0.40, CH*0.32], [CW*0.55, CH*0.25],
      [CW*0.62, CH*0.42], [CW*0.27, CH*0.62], [CW*0.40, CH*0.58],
      [CW*0.52, CH*0.62], [CW*0.78, CH*0.42], [CW*0.36, CH*0.50],
      [CW*0.62, CH*0.78], [CW*0.46, CH*0.78], [CW*0.74, CH*0.78],
    ];
    treePosArr = treePosArr.filter(function(tp){
      var tx=tp[0], ty=tp[1];
      // Não em cima da pista
      if(isOnTrack({x:tx,y:ty})) return false;
      // Não em cima do lago
      if(lakesDecor.some(function(l){ var dx=(tx-l.x)/l.rx, dy=(ty-l.y)/l.ry; return (dx*dx+dy*dy)<=1.4; })) return false;
      // Não em cima de placa
      if(sponsorBoards.some(function(b){ return tx>b.x-10 && tx<b.x+b.w+10 && ty>b.y-10 && ty<b.y+b.h+10; })) return false;
      // Não em cima de paddock/parking/heliponto
      if(paddockZone && tx>paddockZone.x-12 && tx<paddockZone.x+paddockZone.w+12 && ty>paddockZone.y-12 && ty<paddockZone.y+paddockZone.h+12) return false;
      if(parkingZone && tx>parkingZone.x-12 && tx<parkingZone.x+parkingZone.w+12 && ty>parkingZone.y-12 && ty<parkingZone.y+parkingZone.h+12) return false;
      if(helipadZone){ var hx=tx-helipadZone.x, hy=ty-helipadZone.y; if(Math.sqrt(hx*hx+hy*hy)<helipadZone.r+12) return false; }
      return true;
    });

    grassBlades=[];
    grassInner.forEach(function(g){
      var seed=Math.round(g.x*g.y);
      for(var i=0;i<40;i++){
        grassBlades.push({
          x:g.x+(((seed*i*173+7)%(g.rx*2|0))-g.rx)*0.85,
          y:g.y+(((seed*i*97+3)%(g.ry*2|0))-g.ry)*0.85,
          len:4+Math.random()*5, phase:Math.random()*Math.PI*2,
          color:i%3===0?'#33BB22':i%3===1?'#44CC33':'#22AA11'
        });
      }
    });

    _initCrowd();
  }

  function _initCrowd(){
    crowd=[];
    standZones.forEach(function(sz){
      if(sz.h<6 || sz.w<10) return;
      var step=7;
      var cols=Math.floor(sz.w/step);
      var rows=Math.max(1, Math.floor(sz.h*0.7/9));
      for(var r=0;r<rows;r++) for(var c=0;c<cols;c++){
        crowd.push({
          x:sz.x+4+c*step,
          y:sz.y+sz.h*0.15+r*9,
          color:['#FF4444','#4488FF','#44AA44','#FFEE22','#FF44FF','#FFFFFF','#FF8800','#AA44FF'][(r*17+c*7)%8],
          phase:(r*cols+c)*0.31, sz:sz
        });
      }
    });
  }

  // Marco 2.9.2 (H): chicanes nas chicanes reais, não em retas.
  // Mapeamento dos waypoints:
  //   pts[0..3]   reta sul (largada → Curva Grande) — NÃO tem chicane
  //   pts[3..6]   Curva Grande (curva fechada longa) — NÃO é chicane
  //   pts[8..10]  Lesmo 1 (entrada do topo)         ← chicane
  //   pts[10..12] Lesmo 2 (zigue-zague topo)         ← chicane
  //   pts[12..14] Variante Ascari (descida)         ← chicane
  //   pts[15..17] subida NW                          — curva, não chicane
  function _buildChicurbs(){
    var arr=[];
    var triples=[
      // Lesmo 1: pts 8→9→10
      {pre:8,  peak:9,  post:10},
      // Lesmo 2: pts 10→11→12
      {pre:10, peak:11, post:12},
      // Ascari: pts 12→13→14
      {pre:12, peak:13, post:14}
    ];
    triples.forEach(function(tr){
      var pa=pts[tr.pre], pb=pts[tr.peak], pc=pts[tr.post];
      [{a:pa,b:pb},{a:pb,b:pc}].forEach(function(seg){
        var dx=seg.b.x-seg.a.x, dy=seg.b.y-seg.a.y;
        var len=Math.sqrt(dx*dx+dy*dy);
        if(len<1) return;
        var nx=-dy/len, ny=dx/len;
        var off=TW*0.55;
        var mx=(seg.a.x+seg.b.x)/2, my=(seg.a.y+seg.b.y)/2;
        // zebra borda interna
        arr.push({x:mx+nx*off, y:my+ny*off, r:TW*0.14, ang:Math.atan2(dy,dx)});
        // zebra borda externa
        arr.push({x:mx-nx*off, y:my-ny*off, r:TW*0.14, ang:Math.atan2(dy,dx)});
      });
    });
    return arr;
  }

  // ─── DETECÇÕES ─────────────────────────────────────────────────────
  function isOnTrack(pos){
    var minD=Infinity;
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
    // Loop close: ponto 20→0
    var ax=pts[20].x,ay=pts[20].y,bx=pts[0].x,by=pts[0].y;
    var dx=bx-ax,dy=by-ay,len=Math.sqrt(dx*dx+dy*dy);
    if(len>=1){
      var t=((pos.x-ax)*dx+(pos.y-ay)*dy)/(len*len);
      t=Math.max(0,Math.min(1,t));
      var px=ax+t*dx,py=ay+t*dy;
      var d=Math.sqrt((pos.x-px)*(pos.x-px)+(pos.y-py)*(pos.y-py));
      if(d<minD) minD=d;
    }
    return minD<TW*0.72;
  }

  function detectInner(pos){
    if(isOnTrack(pos)) return null;
    return 'grass';
  }

  function detectPuddle(pos){
    for(var i=0;i<puddles.length;i++){
      var p=puddles[i],dx=pos.x-p.x,dy=pos.y-p.y;
      if(Math.sqrt(dx*dx+dy*dy)<p.r) return true;
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
  function detectSand(){ return false; } // Monza não tem areia

  function detectBoost(pos, r){
    r=r||14;
    for(var i=0;i<boostZones.length;i++){
      var b=boostZones[i];
      if(pos.x+r>b.x && pos.x-r<b.x+b.w && pos.y+r>b.y && pos.y-r<b.y+b.h){
        return {zone:b, angle:b.angle};
      }
    }
    return null;
  }
  function detectOil(pos){
    for(var i=0;i<oilZones.length;i++){
      var o=oilZones[i], dx=pos.x-o.x, dy=pos.y-o.y;
      if(Math.sqrt(dx*dx+dy*dy)<o.r) return {zone:o};
    }
    return null;
  }
  function detectSpin(pos){
    for(var i=0;i<spinZones.length;i++){
      var s=spinZones[i], dx=pos.x-s.x, dy=pos.y-s.y;
      if(Math.sqrt(dx*dx+dy*dy)<s.r) return {zone:s};
    }
    return null;
  }
  // Marco 2.9.2 (E3): direção INSTANTÂNEA do empurrão do twister.
  // Casa exatamente com a rotação visual da seta (t*1.8) no render.
  function getSpinDirection(zone, t){
    var ang = t*1.8;
    return { x: Math.cos(ang), y: Math.sin(ang) };
  }

  function checkObstacles(pos,r){
    for(var i=0;i<obstacles.length;i++){
      var o=obstacles[i],dx=pos.x-o.x,dy=pos.y-o.y,dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<r+o.r) return{obs:o,nx:dx/dist,ny:dy/dist};
    }
    for(var j=0;j<chicurbs.length;j++){
      var c=chicurbs[j],dx2=pos.x-c.x,dy2=pos.y-c.y,d2=Math.sqrt(dx2*dx2+dy2*dy2);
      if(d2<r+c.r) return{obs:c,elastic:true,nx:dx2/d2,ny:dy2/d2};
    }
    return null;
  }
  // Marco 2.9.2 (5i): canhões ativos disparam projéteis em ciclo. Cada um:
  //   - pivota apontando pra pista (aproximação por waypoints próximos)
  //   - dispara a cada 4-7s (cada canhão com cadência própria)
  // Marco 2.9.2: disparos ALEATÓRIOS por canhão (cada um tem cooldownBase +
  // jitter próprio). Cada canhão dispara INDEPENDENTE — nunca todos juntos.
  function tickCannons(dtMs){
    var now = Date.now();
    cannonZones.forEach(function(c){
      if(now < c.nextShot) return;
      // Aponta para o waypoint mais próximo do canhão
      var nearest = pts[0], best = Infinity;
      for(var i=0;i<pts.length;i++){
        var dx = pts[i].x - c.x, dy = pts[i].y - c.y;
        var d  = dx*dx + dy*dy;
        if(d < best){ best = d; nearest = pts[i]; }
      }
      var aim = Math.atan2(nearest.y - c.y, nearest.x - c.x);
      c.angle = aim;
      c.firing = true;
      c.lastShot = now;
      // Próximo tiro: cooldownBase ± jitter aleatório (cada canhão único)
      var jitter = (Math.random()*2 - 1) * c.cooldownJitter;
      c.nextShot = now + c.cooldownBase + jitter;
      // dispara projétil
      var spd = TW * 4.2; // px/s
      projectiles.push({
        x:c.x + Math.cos(aim)*c.r*1.5,
        y:c.y + Math.sin(aim)*c.r*1.5,
        vx:Math.cos(aim)*spd,
        vy:Math.sin(aim)*spd,
        r:Math.max(3, TW*0.05),
        life:2200,
        born:now,
        fromCannon:c
      });
    });
    // Atualiza posição e expira projéteis
    var alive = [];
    for(var i=0;i<projectiles.length;i++){
      var p = projectiles[i];
      p.x += p.vx * dtMs/1000;
      p.y += p.vy * dtMs/1000;
      var age = now - p.born;
      if(age < p.life && p.x>-30 && p.x<CW+30 && p.y>-30 && p.y<CH+30){
        alive.push(p);
      }
    }
    projectiles = alive;
    // Desliga firing flag depois de 200ms (efeito visual breve)
    cannonZones.forEach(function(c){
      if(c.firing && (now - c.lastShot) > 200) c.firing = false;
    });
  }
  // Detecta colisão de projétil com tampinha (chamado pelo loop externo)
  function checkProjectiles(pos, capR){
    for(var i=0;i<projectiles.length;i++){
      var p=projectiles[i];
      var dx=pos.x-p.x, dy=pos.y-p.y;
      if(Math.sqrt(dx*dx+dy*dy) < capR + p.r){
        // Remove projétil ao impacto
        projectiles.splice(i,1);
        return { vx:p.vx*0.2, vy:p.vy*0.2 }; // retorna empurrão proporcional
      }
    }
    return null;
  }
  function getProjectiles(){ return projectiles; }
  function clearProjectiles(){ projectiles = []; }

  function checkPothole(pos,r){
    for(var i=0;i<potholes.length;i++){
      var p=potholes[i],dx=pos.x-p.x,dy=pos.y-p.y;
      if(Math.sqrt(dx*dx+dy*dy)<p.r) return p;
    }
    return null;
  }
  // Marco 2.9.2 (5j): retorna ponto de respawn fora do buraco (1.2x raio à direita por default)
  function potholeEscapePos(pothole){
    if(!pothole) return null;
    return { x: pothole.x + pothole.r*1.2, y: pothole.y };
  }
  function checkStands(pos,r){
    for(var i=0;i<standZones.length;i++){
      var s=standZones[i];
      if(pos.x+r>s.x&&pos.x-r<s.x+s.w&&pos.y+r>s.y&&pos.y-r<s.y+s.h)
        return{nx:s.nx,ny:s.ny};
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
  function resetCPs(){ _cpHit=[false,false,false]; _checkpoints.forEach(function(c){c.ok=false;}); }
  function checkCP(pos,onCp){
    for(var i=0;i<_checkpoints.length;i++){
      if(_cpHit[i]) continue;
      var c=_checkpoints[i],dx=pos.x-c.x,dy=pos.y-c.y;
      if(Math.sqrt(dx*dx+dy*dy)<c.r){_cpHit[i]=true; c.ok=true; if(onCp) onCp(c); return c;}
    }
    return null;
  }
  function lastCP(){ var l=null; for(var i=0;i<_checkpoints.length;i++) if(_cpHit[i]) l=_checkpoints[i]; return l; }
  function checkLap(pos){
    if(!_startLine) return false;
    var s=_startLine;
    return(pos.x>=s.x&&pos.x<=s.x+s.w&&pos.y>=s.y-5&&pos.y<=s.y+s.h+5);
  }
  // Marco 2.9.2: tampinhas COLADAS atrás da faixa.
  // _startLine.x é o canto OESTE da faixa (faixa de largura 14px).
  // Spawn em (_startLine.x - 14) = exatamente uma faixa de distância pra trás.
  // Visualmente: tampinha quase tocando a faixa, do lado oeste, dentro da pista.
  function getStartPos(){
    if(!_startLine) return{x:CW*0.14,y:CH*0.84};
    return{x:_startLine.x + 35, y:_startLine.y + _startLine.h/2};
  }
  function getCheckpoints(){ return _checkpoints; }
  function getRacingLine(){
    return pts.slice();
  }

  // ═══ RENDER ════════════════════════════════════════════════════════
  function render(ctx, cw, ch, t){
    if(!pts.length) init(cw,ch);

    // 1. Chão grama externa
    ctx.fillStyle='#5db830';
    ctx.fillRect(0,0,cw,ch);
    var seed=1, rng=function(){seed=(seed*9301+49297)%233280; return seed/233280;};
    ctx.globalAlpha=0.4;
    for(var i=0;i<14;i++){
      var mx=rng()*cw, my=rng()*ch, mr=TW*0.8+rng()*TW*1.2;
      ctx.fillStyle=(i%2===0)?'#4ca524':'#6dc837';
      ctx.beginPath();
      ctx.ellipse(mx,my,mr,mr*0.65,rng()*Math.PI,0,Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha=1;

    // 2. Lagos decorativos (Marco 2.9.2: lago grande + brilho + ponte + crocodilo)
    lakesDecor.forEach(function(l){
      // Sombra fora d'água
      ctx.save();
      ctx.fillStyle='rgba(0,0,0,.25)';
      ctx.beginPath();
      ctx.ellipse(l.x+3,l.y+5,l.rx*1.05,l.ry*1.05,0,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
      // Água com gradiente radial
      var grd=ctx.createRadialGradient(l.x-l.rx*0.3,l.y-l.ry*0.4,2,l.x,l.y,l.rx);
      grd.addColorStop(0,'rgba(80,200,255,.95)');
      grd.addColorStop(.55,'rgba(20,120,220,.85)');
      grd.addColorStop(1,'rgba(0,40,140,.65)');
      ctx.fillStyle=grd;
      ctx.beginPath();
      ctx.ellipse(l.x,l.y,l.rx,l.ry,0,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle='#0a2845'; ctx.lineWidth=2;
      ctx.stroke();
      // Brilhos (3 highlights animados)
      if(l.big){
        ctx.save();
        for(var hi=0; hi<3; hi++){
          var phase=t*1.2 + hi*2.1;
          var hx=l.x - l.rx*0.45 + Math.cos(phase)*l.rx*0.15;
          var hy=l.y - l.ry*0.40 + Math.sin(phase*0.7)*l.ry*0.15;
          var hr=l.rx*0.10 * (0.7 + Math.sin(phase*2)*0.3);
          ctx.fillStyle='rgba(255,255,255,'+(0.45 + Math.sin(phase*1.5)*0.20)+')';
          ctx.beginPath();
          ctx.ellipse(hx,hy,hr,hr*0.4,Math.PI*0.2,0,Math.PI*2);
          ctx.fill();
        }
        ctx.restore();
        // Ondinhas concêntricas
        ctx.save();
        ctx.strokeStyle='rgba(180,230,255,.35)'; ctx.lineWidth=1.2;
        for(var ri=0; ri<2; ri++){
          var rt=(t*0.6 + ri*0.5) % 1;
          var rrx=l.rx*0.4*(0.5+rt*0.5);
          var rry=l.ry*0.4*(0.5+rt*0.5);
          ctx.globalAlpha=(1-rt)*0.4;
          ctx.beginPath();
          ctx.ellipse(l.x+l.rx*0.2,l.y+l.ry*0.1,rrx,rry,0,0,Math.PI*2);
          ctx.stroke();
        }
        ctx.restore();
        // Marco 2.9.2: PONTE DO AMOR atravessa o lago (curva levemente arqueada)
        // Ponte cruza o lago no eixo X (oeste→leste)
        ctx.save();
        var bx0=l.x - l.rx*1.05;
        var bx1=l.x + l.rx*1.05;
        var by =l.y;
        var arch=l.ry*0.35;
        // Sombra da ponte na água
        ctx.fillStyle='rgba(0,0,0,.25)';
        ctx.beginPath();
        ctx.moveTo(bx0+2, by+l.ry*0.10);
        ctx.quadraticCurveTo((bx0+bx1)/2+2, by-arch+l.ry*0.10+3, bx1+2, by+l.ry*0.10);
        ctx.lineTo(bx1+2, by+l.ry*0.20);
        ctx.quadraticCurveTo((bx0+bx1)/2+2, by-arch+l.ry*0.20+3, bx0+2, by+l.ry*0.20);
        ctx.closePath(); ctx.fill();
        // Tabuleiro da ponte (madeira)
        var grdB=ctx.createLinearGradient(0,by-arch,0,by+l.ry*0.15);
        grdB.addColorStop(0,'#a87440');
        grdB.addColorStop(1,'#6e4c20');
        ctx.fillStyle=grdB;
        ctx.beginPath();
        ctx.moveTo(bx0, by);
        ctx.quadraticCurveTo((bx0+bx1)/2, by-arch, bx1, by);
        ctx.lineTo(bx1, by+l.ry*0.12);
        ctx.quadraticCurveTo((bx0+bx1)/2, by-arch+l.ry*0.12, bx0, by+l.ry*0.12);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle='#3a2410'; ctx.lineWidth=1.4; ctx.stroke();
        // Tábuas da ponte
        ctx.strokeStyle='rgba(60,38,15,.75)'; ctx.lineWidth=1;
        var nplanks=10;
        for(var pi=1; pi<nplanks; pi++){
          var pkt = pi/nplanks;
          var px = bx0 + (bx1-bx0)*pkt;
          var pyt = by - Math.sin(pkt*Math.PI)*arch;
          ctx.beginPath();
          ctx.moveTo(px, pyt);
          ctx.lineTo(px, pyt + l.ry*0.12);
          ctx.stroke();
        }
        // Corrimãos vermelhos (estilo amor)
        ctx.strokeStyle='#cc1a3a'; ctx.lineWidth=2;
        ctx.beginPath();
        ctx.moveTo(bx0, by-2);
        ctx.quadraticCurveTo((bx0+bx1)/2, by-arch-3, bx1, by-2);
        ctx.stroke();
        // Pequeno coração no centro
        var hcx=(bx0+bx1)/2, hcy=by-arch-7;
        ctx.fillStyle='#ff3366';
        ctx.beginPath();
        ctx.moveTo(hcx, hcy+2);
        ctx.bezierCurveTo(hcx, hcy, hcx-3, hcy-3, hcx-3, hcy);
        ctx.bezierCurveTo(hcx-3, hcy+2, hcx, hcy+3, hcx, hcy+5);
        ctx.bezierCurveTo(hcx, hcy+3, hcx+3, hcy+2, hcx+3, hcy);
        ctx.bezierCurveTo(hcx+3, hcy-3, hcx, hcy, hcx, hcy+2);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        // CROCODILO nadando — corpo com cauda animada, longe da ponte
        ctx.save();
        var croPhase = t*0.7;
        var croCx = l.x + Math.cos(croPhase)*l.rx*0.55;
        var croCy = l.y + l.ry*0.45 + Math.sin(croPhase*1.3)*l.ry*0.10;
        var croAng = Math.cos(croPhase)*0.4 - Math.PI*0.5;
        ctx.translate(croCx, croCy);
        ctx.rotate(croAng);
        // corpo
        ctx.fillStyle='#3a5a25';
        ctx.beginPath();
        ctx.ellipse(0, 0, l.rx*0.13, l.ry*0.06, 0, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle='#1a3010'; ctx.lineWidth=1; ctx.stroke();
        // cauda
        ctx.fillStyle='#3a5a25';
        ctx.beginPath();
        ctx.moveTo(-l.rx*0.10, -l.ry*0.02);
        ctx.lineTo(-l.rx*0.22+Math.sin(t*4)*l.rx*0.04, 0);
        ctx.lineTo(-l.rx*0.10, l.ry*0.02);
        ctx.closePath(); ctx.fill();
        ctx.stroke();
        // crista dorsal (espinhos)
        ctx.fillStyle='#2a4515';
        for(var ki=0; ki<4; ki++){
          var kx = -l.rx*0.06 + ki*l.rx*0.04;
          ctx.beginPath();
          ctx.moveTo(kx-1, 0);
          ctx.lineTo(kx, -l.ry*0.04);
          ctx.lineTo(kx+1, 0);
          ctx.closePath(); ctx.fill();
        }
        // olho
        ctx.fillStyle='#FFFF00';
        ctx.beginPath();
        ctx.arc(l.rx*0.09, -l.ry*0.025, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='#000';
        ctx.beginPath();
        ctx.arc(l.rx*0.09, -l.ry*0.025, 0.7, 0, Math.PI*2); ctx.fill();
        ctx.restore();
      }
    });

    // 3. Arquibancadas
    standZones.forEach(function(sz){
      if(sz.h<4||sz.w<4) return;
      ctx.fillStyle='rgba(0,0,0,.35)';
      _roundRect(ctx,sz.x+3,sz.y+4,sz.w,sz.h,4); ctx.fill();
      ctx.fillStyle='#1e1e1e';
      _roundRect(ctx,sz.x,sz.y,sz.w,sz.h,4); ctx.fill();
      ctx.strokeStyle='#0a0a0a'; ctx.lineWidth=2;
      _roundRect(ctx,sz.x,sz.y,sz.w,sz.h,4); ctx.stroke();
      var tierH=Math.max(8, sz.h/4);
      for(var ti=0;ti<4;ti++){
        var ty=sz.y+ti*tierH;
        if(ty+tierH>sz.y+sz.h) break;
        ctx.fillStyle=(ti%2===0)?'#2a2a2a':'#252525';
        ctx.fillRect(sz.x+1,ty+1,sz.w-2,tierH-1);
      }
      crowd.forEach(function(c){
        if(c.sz!==sz) return;
        var wave=Math.sin(t*2.5+c.phase)*2;
        ctx.fillStyle=c.color;
        ctx.fillRect(c.x-2,c.y-wave-2,4,5);
      });
    });

    // 3b. Marco 2.9.2 (5l): GRAMA INTERNA renderizada ANTES de paddock/estacionamento,
    // pra esses ficarem POR CIMA da grama (estavam sendo cobertos antes).
    grassInner.forEach(function(g){
      ctx.fillStyle='rgba(45,150,30,.55)';
      ctx.beginPath();
      ctx.ellipse(g.x,g.y,g.rx,g.ry,0,0,Math.PI*2);
      ctx.fill();
    });
    grassBlades.forEach(function(b){
      var sw=Math.sin(t*2+b.phase);
      ctx.strokeStyle=b.color; ctx.lineWidth=1.2; ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.quadraticCurveTo(b.x+sw*1.5, b.y-b.len*0.5, b.x+sw*2, b.y-b.len);
      ctx.stroke();
    });

    // 4. Paddock
    if(paddockZone){
      var pz=paddockZone;
      ctx.fillStyle='rgba(0,0,0,.3)';
      _roundRect(ctx,pz.x+3,pz.y+4,pz.w,pz.h,6); ctx.fill();
      ctx.fillStyle='#9c9a8c';
      _roundRect(ctx,pz.x,pz.y,pz.w,pz.h,6); ctx.fill();
      ctx.strokeStyle='#5a5848'; ctx.lineWidth=2;
      _roundRect(ctx,pz.x,pz.y,pz.w,pz.h,6); ctx.stroke();
      // mini-tampinhas estacionadas
      var py0=pz.y+pz.h*0.20;
      var capColors=[['#FF4444','#AA0000'],['#44AAFF','#1166AA'],['#44FF88','#22AA55'],
                     ['#FFCC00','#AA8800'],['#CC44FF','#882299'],['#FF8844','#AA5522']];
      var ppCols=3, ppRows=2;
      var ppCellW=(pz.w-12)/ppCols, ppCellH=(pz.h*0.70)/ppRows;
      var ppCapR=Math.min(ppCellW,ppCellH)*0.42;
      for(var ci=0;ci<6;ci++){
        var cx=pz.x+6+(ci%ppCols)*ppCellW+ppCellW/2;
        var cy=py0+Math.floor(ci/ppCols)*ppCellH+ppCellH/2;
        _drawMiniCap(ctx,cx,cy,ppCapR,capColors[ci][0],capColors[ci][1]);
      }
    }

    // 5. Estacionamento
    if(parkingZone){
      var pkz=parkingZone;
      ctx.fillStyle='rgba(0,0,0,.35)';
      _roundRect(ctx,pkz.x+3,pkz.y+4,pkz.w,pkz.h,5); ctx.fill();
      ctx.fillStyle='#454550';
      _roundRect(ctx,pkz.x,pkz.y,pkz.w,pkz.h,5); ctx.fill();
      ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=2;
      _roundRect(ctx,pkz.x,pkz.y,pkz.w,pkz.h,5); ctx.stroke();
      ctx.fillStyle='rgba(0,229,255,.85)';
      ctx.font='bold '+Math.floor(pkz.w*0.20)+'px Bebas Neue, Arial';
      ctx.textAlign='left'; ctx.textBaseline='top';
      ctx.fillText('P',pkz.x+4,pkz.y+3);
      var capPalette=[['#FF2A2A','#7a0000'],['#FFD700','#7a5a00'],['#1a5fa5','#0a2845'],
                      ['#3a8a1a','#1a4810'],['#FF8C00','#7a3a00'],['#9933cc','#4a1a5a'],
                      ['#00aabb','#005566'],['#fff','#888'],['#ff4488','#7a1a3a'],
                      ['#88ff44','#3a7a1a'],['#ff88cc','#7a3a55'],['#1a1a1a','#000']];
      var cols=4, rows=3;
      var cellW=(pkz.w-8)/cols, cellH=(pkz.h-18)/rows;
      var cellSize=Math.min(cellW,cellH)*0.42;
      for(var pr=0;pr<rows;pr++){
        for(var pc=0;pc<cols;pc++){
          var pi=pr*cols+pc;
          if(pi>=capPalette.length) break;
          var cx2=pkz.x+4+pc*cellW+cellW/2;
          var cy2=pkz.y+16+pr*cellH+cellH/2;
          var pal=capPalette[pi%capPalette.length];
          _drawMiniCap(ctx,cx2,cy2,cellSize,pal[0],pal[1]);
        }
      }
    }

    // 6. Concreto runoff
    ctx.save();
    ctx.lineWidth=TW+18;
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.strokeStyle='#9c9a8c';
    ctx.beginPath();
    ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(function(p,idx){ if(idx>0) ctx.lineTo(p.x,p.y); });
    ctx.closePath(); ctx.stroke();
    ctx.restore();

    // 7. Asfalto
    _drawPath(ctx, TW+2, '#1a1a1f');
    _drawPath(ctx, TW,   '#3a3a42');

    // textura sutil
    ctx.save();
    ctx.globalAlpha=0.18;
    ctx.fillStyle='#262630';
    for(var ai=0;ai<60;ai++){
      var ax=(ai*97.3)%cw, ay=(ai*73.7)%ch;
      if(isOnTrack({x:ax,y:ay})){
        ctx.beginPath(); ctx.arc(ax,ay,1.2,0,Math.PI*2); ctx.fill();
      }
    }
    ctx.restore();

    // 8. Faixa amarela tracejada
    ctx.save();
    ctx.strokeStyle='#FFD700'; ctx.lineWidth=2.5;
    ctx.setLineDash([14,10]); ctx.lineCap='butt';
    ctx.beginPath();
    ctx.moveTo(pts[0].x,pts[0].y);
    pts.forEach(function(p,idx){ if(idx>0) ctx.lineTo(p.x,p.y); });
    ctx.closePath();
    ctx.globalAlpha=0.7;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 9. Zebras das chicanes (Marco 2.9.2 - 5f: nas bordas, alinhadas com a pista)
    chicurbs.forEach(function(c){
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.ang);
      // 4 listras vermelho/branco alternadas (mais detalhe que antes)
      var w=c.r*2.4, h=c.r*0.55;
      var nstripes=4;
      for(var ti=0;ti<nstripes;ti++){
        ctx.fillStyle=(ti%2===0)?'#d11515':'#f5f5f5';
        ctx.beginPath();
        var rx=-w/2+ti*(w/nstripes), ry=-h/2;
        var rw=w/nstripes, rh=h;
        // pontas arredondadas
        ctx.moveTo(rx+3, ry);
        ctx.lineTo(rx+rw-3, ry);
        ctx.quadraticCurveTo(rx+rw, ry, rx+rw, ry+3);
        ctx.lineTo(rx+rw, ry+rh-3);
        ctx.quadraticCurveTo(rx+rw, ry+rh, rx+rw-3, ry+rh);
        ctx.lineTo(rx+3, ry+rh);
        ctx.quadraticCurveTo(rx, ry+rh, rx, ry+rh-3);
        ctx.lineTo(rx, ry+3);
        ctx.quadraticCurveTo(rx, ry, rx+3, ry);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=1;
        ctx.stroke();
      }
      ctx.restore();
    });

    // 10. Poças na pista
    puddles.forEach(function(p){ _drawPuddle(ctx, p.x, p.y, p.r, t); });

    // 11. Grama na pista (tufos balançando — verde claro)
    grassOnTrack.forEach(function(g){
      if(g.type!=='blob') return;
      ctx.save();
      ctx.translate(g.cx, g.cy); ctx.rotate(g.rot);
      ctx.fillStyle='rgba(0,0,0,.20)';
      ctx.beginPath();
      ctx.ellipse(2,4,g.rx*1.05,g.ry*0.7,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(80,180,50,.55)';
      ctx.beginPath();
      ctx.ellipse(0,0,g.rx*0.92,g.ry*0.78,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(40,120,30,.65)'; ctx.lineWidth=1.5; ctx.stroke();
      var nTufts=14;
      var seedG=(g.cx*31+g.cy*17)|0;
      var rngG=function(i){var s=Math.sin(seedG*0.013+i*7.7)*43758.5453; return s-Math.floor(s);};
      for(var i=0;i<nTufts;i++){
        var ang=rngG(i)*Math.PI*2;
        var rad=Math.sqrt(rngG(i+99))*0.8;
        var tx=Math.cos(ang)*g.rx*rad, ty=Math.sin(ang)*g.ry*rad*0.85;
        var sway=Math.sin(t*2.2+i*0.83)*1.6;
        var nLeaves=3;
        for(var j=0;j<nLeaves;j++){
          var jx=tx+(j-1)*1.6;
          var jh=5+rngG(i*9+j)*4;
          var leafSway=sway*0.6+Math.sin(t*2.2+i*0.83+j*0.4)*0.7;
          var greens=['#2a8520','#3DB838','#4dc848','#1f7018'];
          ctx.strokeStyle=greens[(i+j)%4]; ctx.lineWidth=1.4; ctx.lineCap='round';
          ctx.beginPath();
          ctx.moveTo(jx, ty+1);
          ctx.quadraticCurveTo(jx+leafSway*0.5, ty-jh*0.5, jx+leafSway, ty-jh);
          ctx.stroke();
        }
      }
      ctx.restore();
    });

    // 12. Grama interna (Marco 2.9.2 - 5l): movida pra ANTES do paddock (#3b acima)
    // para que estacionamento/paddock fiquem por cima dela.

    // Marco 2.9.2: árvores espalhadas pelo gramado interior
    treePosArr.forEach(function(tp){ _drawTree(ctx, tp[0], tp[1], t); });

    // 13. Pedras / obstáculos
    obstacles.forEach(function(o){ _drawRock(ctx, o.x, o.y, o.r); });

    // 14. Outdoors com logos
    sponsorBoards.forEach(function(b){
      ctx.fillStyle='rgba(0,0,0,.4)';
      ctx.beginPath();
      ctx.ellipse(b.x+b.w/2+3, b.y+b.h+4, b.w*0.55, b.h*0.18, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle=b.dark;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y+3);
      ctx.lineTo(b.x, b.y+b.h-1);
      ctx.lineTo(b.x+3, b.y+b.h+2);
      ctx.lineTo(b.x+3, b.y+6);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#000'; ctx.lineWidth=1; ctx.stroke();
      ctx.fillStyle=b.color;
      ctx.fillRect(b.x+3, b.y+6, b.w-3, b.h-4);
      ctx.strokeStyle=b.dark; ctx.lineWidth=1.6;
      ctx.strokeRect(b.x+3, b.y+6, b.w-3, b.h-4);
      ctx.fillStyle=b.dark;
      ctx.fillRect(b.x+3, b.y+6, b.w-3, 2);
      ctx.fillRect(b.x+3, b.y+b.h-1, b.w-3, 2);
      _drawSponsorLogo(ctx, b);
      ctx.strokeStyle=b.dark; ctx.lineWidth=2;
      ctx.beginPath();
      ctx.moveTo(b.x+6, b.y+b.h+1); ctx.lineTo(b.x+2, b.y+b.h+6);
      ctx.moveTo(b.x+b.w-4, b.y+b.h+1); ctx.lineTo(b.x+b.w+1, b.y+b.h+6);
      ctx.stroke();
    });

    // 15. Boost / Oil / Spin
    boostZones.forEach(function(b){
      ctx.fillStyle='rgba(0,0,0,.45)';
      _roundRect(ctx, b.x+3, b.y+5, b.w, b.h, 5); ctx.fill();
      ctx.fillStyle='#FFD700';
      _roundRect(ctx, b.x, b.y, b.w, b.h, 5); ctx.fill();
      ctx.strokeStyle='#7a5a00'; ctx.lineWidth=2.5;
      _roundRect(ctx, b.x, b.y, b.w, b.h, 5); ctx.stroke();
      var arrowOff=(t*40)%(b.w*0.3);
      ctx.fillStyle='#fff'; ctx.globalAlpha=0.7;
      for(var ai2=0;ai2<3;ai2++){
        var sx=b.x+4+ai2*(b.w*0.3)+arrowOff;
        var sy=b.y+b.h/2;
        ctx.beginPath();
        ctx.moveTo(sx, sy-b.h*0.3);
        ctx.lineTo(sx+b.h*0.5, sy);
        ctx.lineTo(sx, sy+b.h*0.3);
        ctx.lineTo(sx+b.h*0.15, sy);
        ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha=1;
    });
    oilZones.forEach(function(o){
      ctx.fillStyle='rgba(0,0,0,.55)';
      ctx.beginPath();
      ctx.ellipse(o.x+3, o.y+4, o.r*1.2, o.r*0.85, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#1a1414';
      ctx.beginPath();
      ctx.ellipse(o.x, o.y, o.r, o.r*0.7, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle='#000'; ctx.lineWidth=2; ctx.stroke();
      ctx.fillStyle='rgba(120,40,90,.5)';
      ctx.beginPath();
      ctx.ellipse(o.x-o.r*0.3, o.y-o.r*0.2, o.r*0.4, o.r*0.15, 0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(60,80,140,.4)';
      ctx.beginPath();
      ctx.ellipse(o.x+o.r*0.2, o.y+o.r*0.15, o.r*0.3, o.r*0.1, -0.2, 0, Math.PI*2); ctx.fill();
    });
    spinZones.forEach(function(s){
      // Sombra
      ctx.fillStyle='rgba(0,0,0,.4)';
      ctx.beginPath();
      ctx.ellipse(s.x+2, s.y+3, s.r*1.05, s.r*1.05, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#1a5fa5';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle='#0a2845'; ctx.lineWidth=2; ctx.stroke();
      // Pétalas girando
      ctx.save();
      ctx.translate(s.x, s.y); ctx.rotate(t*1.8);
      ctx.fillStyle='rgba(58,138,204,.7)';
      for(var pi=0;pi<4;pi++){
        ctx.save(); ctx.rotate(pi*Math.PI/2);
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.arc(0,0, s.r*0.95, -Math.PI/4, Math.PI/4);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      // Marco 2.9.2 (E3): SETA giratória amarela mostrando direção do empurrão
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(t*1.8);
      ctx.strokeStyle='#FFD700'; ctx.lineWidth=4; ctx.lineCap='round';
      ctx.beginPath();
      ctx.moveTo(-s.r*0.7, 0);
      ctx.lineTo( s.r*0.65, 0);
      ctx.stroke();
      ctx.fillStyle='#FFD700';
      ctx.beginPath();
      ctx.moveTo( s.r*0.85, 0);
      ctx.lineTo( s.r*0.55,-s.r*0.30);
      ctx.lineTo( s.r*0.55, s.r*0.30);
      ctx.closePath(); ctx.fill();
      ctx.shadowColor='#FFEE66'; ctx.shadowBlur=12;
      ctx.beginPath();
      ctx.moveTo( s.r*0.85, 0);
      ctx.lineTo( s.r*0.55,-s.r*0.30);
      ctx.lineTo( s.r*0.55, s.r*0.30);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur=0;
      ctx.restore();
      // Centro branco menor
      ctx.fillStyle='#fff';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r*0.18, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle='#0a2845'; ctx.lineWidth=1.2; ctx.stroke();
    });

    // 16. Linha de largada xadrez
    if(_startLine){
      var sl=_startLine;
      ctx.fillStyle='rgba(0,0,0,.5)';
      ctx.fillRect(sl.x+2, sl.y+3, sl.w, sl.h);
      var sq=7;
      var nc=Math.ceil(sl.w/sq), nr=Math.ceil(sl.h/sq);
      for(var row=0;row<nr;row++){
        for(var col=0;col<nc;col++){
          ctx.fillStyle=(row+col)%2===0?'#FFFFFF':'#111111';
          ctx.fillRect(sl.x+col*sq, sl.y+row*sq, sq, sq);
        }
      }
      ctx.strokeStyle='#FFD700'; ctx.lineWidth=2.5;
      ctx.strokeRect(sl.x, sl.y, sl.w, sl.h);
    }

    // 16b. Buracos (Marco 2.9.2 - 5j: estavam na lista mas não eram renderizados)
    potholes.forEach(function(p){
      ctx.save();
      // sombra escura interna
      ctx.fillStyle='rgba(0,0,0,.85)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      // borda quebrada (asfalto rachado)
      ctx.strokeStyle='#1a1a1a'; ctx.lineWidth=2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r*0.92, 0, Math.PI*2); ctx.stroke();
      // realce sutil dentro
      ctx.fillStyle='rgba(60,40,30,.5)';
      ctx.beginPath();
      ctx.arc(p.x-p.r*0.2, p.y-p.r*0.2, p.r*0.45, 0, Math.PI*2); ctx.fill();
      // pulse pra chamar atenção
      var pulse = 0.6 + Math.sin(t*3)*0.4;
      ctx.globalAlpha = 0.12*pulse;
      ctx.strokeStyle='#FF6600'; ctx.lineWidth=2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r*1.1, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    });

    // 17. Checkpoints
    _checkpoints.forEach(function(c){
      var ok=_cpHit[_checkpoints.indexOf(c)];
      var pulse=1+Math.sin(t*4)*0.12;
      ctx.save();
      ctx.globalAlpha=ok?0.05:0.18;
      ctx.fillStyle='#FFD700';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r*0.8*pulse, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha=ok?0.3:1;
      ctx.strokeStyle='#FFD700'; ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r*0.7*pulse, 0, Math.PI*2); ctx.stroke();
      ctx.restore();
    });

    // 17b. Heliponto (Marco 2.9.2 - 5e: estava sumido nesta versão)
    if(helipadZone){
      var hp=helipadZone;
      ctx.save();
      // base de concreto
      ctx.fillStyle='#cfcfd0';
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, hp.r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle='#7a7a7a'; ctx.lineWidth=2; ctx.stroke();
      // círculo amarelo (zona de pouso)
      ctx.strokeStyle='#FFD700'; ctx.lineWidth=3;
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, hp.r*0.85, 0, Math.PI*2); ctx.stroke();
      // letra "H"
      ctx.fillStyle='#FFD700';
      ctx.font='bold '+(hp.r*0.95)+'px "Bebas Neue", sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('H', hp.x, hp.y+1);
      ctx.restore();
    }

    // 17c. Projéteis dos canhões — Marco 2.9.2 (rev): MENORES + rastro com arrasto
    projectiles.forEach(function(p){
      ctx.save();
      // 1. Trail de fogo (4 elipses fade — dá a impressão de arrasto)
      // calcula direção normalizada do projétil
      var pSpd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
      if(pSpd > 1){
        var pInv = 1/pSpd;
        var pDirX = p.vx*pInv, pDirY = p.vy*pInv;
        for(var ti=1; ti<=5; ti++){
          var alpha = 0.55 * (1 - ti/6);  // fade
          var len = ti * p.r * 1.4;
          var trX = p.x - pDirX*len;
          var trY = p.y - pDirY*len;
          var trR = p.r * (1 - ti*0.12);
          if(trR < 0.5) break;
          ctx.globalAlpha = alpha;
          ctx.fillStyle = ti<=2 ? '#FFAA00' : '#FF5500';
          ctx.beginPath();
          ctx.ellipse(trX, trY, trR*1.3, trR*0.7,
                      Math.atan2(pDirY, pDirX), 0, Math.PI*2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      // 2. Núcleo brilhante
      ctx.shadowColor='#FFAA00'; ctx.shadowBlur=10;
      ctx.fillStyle='#FFCC00';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r*0.85, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
      // 3. Centro branco quente
      ctx.fillStyle='#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r*0.40, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });

    // 18. Canhões
    cannonZones.forEach(function(c){
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.fillStyle='rgba(0,0,0,.55)';
      ctx.beginPath();
      ctx.ellipse(2, 4, c.r*1.1, c.r*0.45, 0, 0, Math.PI*2); ctx.fill();
      if(c.firing){ ctx.shadowColor='#FF6600'; ctx.shadowBlur=18; }
      ctx.fillStyle='#3a3a42';
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle='#0a0a0a'; ctx.lineWidth=2.5; ctx.stroke();
      ctx.shadowBlur=0;
      ctx.fillStyle='#1a1a1a';
      ctx.beginPath();
      ctx.arc(0, 0, c.r*0.55, 0, Math.PI*2); ctx.fill();
      ctx.rotate(c.angle);
      ctx.fillStyle=c.firing?'#FF8C00':'#3a3a42';
      ctx.fillRect(c.r*0.3, -c.r*0.25, c.r*1.1, c.r*0.5);
      ctx.strokeStyle='#0a0a0a'; ctx.lineWidth=1.5;
      ctx.strokeRect(c.r*0.3, -c.r*0.25, c.r*1.1, c.r*0.5);
      ctx.fillStyle=c.firing?'#FFCC00':'#222';
      ctx.beginPath();
      ctx.arc(c.r*1.45, 0, c.r*0.32, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });
  }

  // ═══ HELPERS ═══════════════════════════════════════════════════════
  function _drawPath(ctx, width, color){
    ctx.save();
    ctx.strokeStyle=color; ctx.lineWidth=width;
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.forEach(function(p,i){ if(i>0) ctx.lineTo(p.x,p.y); });
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  function _drawPuddle(ctx, cx, cy, r, t){
    var n=9, p2=[];
    for(var i=0;i<n;i++){
      var a=i/n*Math.PI*2;
      var w2=1+0.2*Math.sin(t*1.3+i*1.2+0.5);
      p2.push({x:cx+Math.cos(a)*r*w2, y:cy+Math.sin(a)*r*0.65*w2});
    }
    ctx.fillStyle='rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(cx+2, cy+3, r*1.05, r*0.7, 0, 0, Math.PI*2); ctx.fill();
    var wgrd=ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    wgrd.addColorStop(0,'rgba(40,170,255,.78)');
    wgrd.addColorStop(.55,'rgba(0,110,220,.6)');
    wgrd.addColorStop(1,'rgba(0,60,170,.35)');
    ctx.fillStyle=wgrd;
    ctx.beginPath();
    ctx.moveTo((p2[0].x+p2[n-1].x)/2, (p2[0].y+p2[n-1].y)/2);
    for(var i2=0;i2<n;i2++){
      var nx=p2[(i2+1)%n];
      ctx.quadraticCurveTo(p2[i2].x, p2[i2].y, (p2[i2].x+nx.x)/2, (p2[i2].y+nx.y)/2);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle='#0a2845'; ctx.lineWidth=2; ctx.stroke();
    ctx.strokeStyle='rgba(100,215,255,.85)'; ctx.lineWidth=2; ctx.setLineDash([6,3]);
    ctx.stroke(); ctx.setLineDash([]);
  }

  // Marco 2.9.2: desenho de árvore (copiado da V3 pra consistência visual)
  function _drawTree(ctx, x, y, t){
    var sway = Math.sin(t*0.8 + x*0.01)*1.5;
    ctx.fillStyle='rgba(0,0,0,.4)';
    ctx.beginPath();
    ctx.ellipse(x+5, y+12, 14, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='#3D2008';
    ctx.fillRect(x-3, y+6, 6, 14);
    ctx.strokeStyle='#1a0e02'; ctx.lineWidth=1; ctx.strokeRect(x-3, y+6, 6, 14);
    var layers=[[16,'#1A5C1A'],[12,'#1E7020'],[8,'#28902A'],[5,'#3DB838']];
    layers.forEach(function(l){
      ctx.fillStyle=l[1];
      ctx.beginPath();
      ctx.arc(x + sway*0.3, y-2, l[0], 0, Math.PI*2); ctx.fill();
    });
    ctx.strokeStyle='#0a3a08'; ctx.lineWidth=1.5;
    ctx.beginPath();
    ctx.arc(x + sway*0.3, y-2, 16, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle='rgba(120,255,120,.3)';
    ctx.beginPath();
    ctx.ellipse(x-4 + sway*0.3, y-10, 5, 3, -0.5, 0, Math.PI*2); ctx.fill();
  }

  function _drawRock(ctx, x, y, r){
    ctx.fillStyle='rgba(0,0,0,.4)';
    ctx.beginPath();
    ctx.ellipse(x+3, y+4, r+2, r*0.7, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='#7a7470';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle='#2a2825'; ctx.lineWidth=2; ctx.stroke();
    ctx.fillStyle='#9a948f';
    ctx.beginPath();
    ctx.ellipse(x-1.5, y-2, r*0.55, r*0.4, -0.3, 0, Math.PI*2); ctx.fill();
  }

  function _drawMiniCap(ctx, x, y, r, color, accent){
    ctx.fillStyle='rgba(0,0,0,.4)';
    ctx.beginPath();
    ctx.ellipse(x+1.2, y+1.8, r, r*0.4, 0, 0, Math.PI*2); ctx.fill();
    var n=14;
    ctx.fillStyle=accent;
    ctx.beginPath();
    for(var k=0;k<=n*2;k++){
      var ang=(k/n)*Math.PI;
      var rr=(k%2===0)?r:r*0.84;
      var px=x+rr*Math.cos(ang-Math.PI/2);
      var py=y+rr*Math.sin(ang-Math.PI/2);
      if(k===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.arc(x, y, r*0.78, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle=accent; ctx.lineWidth=0.7;
    ctx.beginPath();
    ctx.arc(x, y, r*0.62, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.ellipse(x-r*0.25, y-r*0.3, r*0.28, r*0.16, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.arc(x, y, r*0.16, 0, Math.PI*2); ctx.fill();
  }

  function _drawSponsorLogo(ctx, b){
    var cx=b.x+3+(b.w-3)/2, cy=b.y+b.h/2+2;
    var sz=b.h*0.55;
    ctx.save();
    ctx.translate(cx, cy);
    if(b.logo==='privy'){
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(0, 0, sz*0.5, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle=b.color;
      ctx.font='bold '+Math.floor(sz*0.7)+'px Arial Black, sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('P', 0, 1);
    } else if(b.logo==='cr'){
      ctx.fillStyle='#1a1a1a';
      ctx.beginPath(); ctx.arc(-sz*0.25, 0, sz*0.4, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#FFD700';
      ctx.font='bold '+Math.floor(sz*0.55)+'px Arial Black, sans-serif';
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('$', -sz*0.25, 1);
      ctx.fillStyle='#1a1a1a';
      ctx.font='bold '+Math.floor(sz*0.65)+'px Arial Black, sans-serif';
      ctx.fillText('CR', sz*0.20, 1);
    } else if(b.logo==='solana'){
      ctx.save();
      ctx.translate(-sz*0.45, -sz*0.30);
      var barH=sz*0.18, barW=sz*0.95, gap=sz*0.06;
      var grds=[['#9945FF','#7d1fdc'],['#14F195','#0eb574'],['#19FB9B','#11c479']];
      for(var bi=0;bi<3;bi++){
        var grd=ctx.createLinearGradient(0, 0, barW, 0);
        grd.addColorStop(0, grds[bi][0]); grd.addColorStop(1, grds[bi][1]);
        ctx.fillStyle=grd;
        ctx.beginPath();
        var bo=bi*(barH+gap), skew=sz*0.18;
        ctx.moveTo(skew, bo);
        ctx.lineTo(barW, bo);
        ctx.lineTo(barW-skew, bo+barH);
        ctx.lineTo(0, bo+barH);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    } else if(b.logo==='fogo'){
      ctx.fillStyle='#FFCC00';
      ctx.beginPath();
      ctx.moveTo(0, -sz*0.50);
      ctx.bezierCurveTo(sz*0.40, -sz*0.20, sz*0.30, sz*0.30, 0, sz*0.45);
      ctx.bezierCurveTo(-sz*0.30, sz*0.30, -sz*0.40, -sz*0.20, 0, -sz*0.50);
      ctx.fill();
      ctx.fillStyle='#FF6600';
      ctx.beginPath();
      ctx.moveTo(0, -sz*0.30);
      ctx.bezierCurveTo(sz*0.25, -sz*0.10, sz*0.18, sz*0.20, 0, sz*0.32);
      ctx.bezierCurveTo(-sz*0.18, sz*0.20, -sz*0.25, -sz*0.10, 0, -sz*0.30);
      ctx.fill();
      ctx.fillStyle='#fff';
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
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
  }

  return {
    META:META, init:init, render:render,
    isOnTrack:isOnTrack, detectInner:detectInner,
    detectPuddle:detectPuddle, detectSand:detectSand, detectGrassOnTrack:detectGrassOnTrack,
    detectBoost:detectBoost, detectOil:detectOil, detectSpin:detectSpin, getSpinDirection:getSpinDirection,
    getCannons:function(){return cannonZones;},
    checkObstacles:checkObstacles, checkStands:checkStands, checkPaddock:checkPaddock,
    checkPothole:checkPothole, potholeEscapePos:potholeEscapePos, checkCP:checkCP, checkLap:checkLap,
    tickCannons:tickCannons, checkProjectiles:checkProjectiles,
    getProjectiles:getProjectiles, clearProjectiles:clearProjectiles,
    resetCPs:resetCPs, lastCP:lastCP, getStartPos:getStartPos,
    getCheckpoints:getCheckpoints, getRacingLine:getRacingLine,
    get checkpoints(){ return _checkpoints; },
    get TW(){ return TW; },
  };
})();
