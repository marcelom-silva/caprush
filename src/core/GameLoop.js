// GameLoop.js v9 -- CapRush Solo + Racer-X (Boss IA)
// v9: melhor volta por lap, cooldown anti-loop de respawn,
//     Racer-X tracked independentemente (CP + voltas),
//     tela de derrota quando Racer-X termina, mensagens i18n
(function(){
  'use strict';

  // -- DOM ------------------------------------------------------------------
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

  var LAPS  = TrackV3.META.voltas;
  var NCPS  = 3;
  var CAP_R = 16;

  // Helper i18n: usa sistema global se disponivel, senao retorna fallback
  function t(key, fallback){ return (window.i18n && window.i18n.t) ? window.i18n.t(key) : (fallback || key); }

  // -- ESTADO DO JOGADOR ----------------------------------------------------
  var gs = {
    phase: 'WAIT', lap: 1, cp: 0,
    lapArmed: false,
    lastPos: null,
    lastCP: null,
    t0: 0, elapsed: 0,
    best: null,          // melhor volta (segundos)
    lapStart: 0,         // timestamp inicio da volta atual
    ds: null, dc: null,
    respawn: null, respawnPending: null,
    respawnCooldown: 0   // timestamp -- impede loop de respawn
  };
  // Marco 2.9.2: expõe estado para UI externa ler fase atual (cards P1/P2)
  if(typeof window !== 'undefined') window.__gameState = gs;
  var skipTurn = false;

  // -- ESTADO DA IA ---------------------------------------------------------
  var enemyLastOnTrack      = null;
  var enemyRespawnPending   = null;
  var enemyRespawnCooldown  = 0;   // anti-loop para IA

  // Racer-X progresso independente (sem usar estado compartilhado de cps)
  var enemyRaceState = {
    lap:     1,
    cp:      0,
    cpsHit:  [false, false, false]   // indexed igual TrackV3.checkpoints
  };

  // -- EFEITOS --------------------------------------------------------------
  var particles = [];
  var sparks = [];
  var _projectiles = [];
  var _cannonTimers = []; // one timer per cannon
  // Marco 2.9.2: cooldown menor pra disparos visíveis em rodadas curtas
  // (antes 5-12s, agora 2-6s, com aleatoriedade por canhão)
  var _CANNON_MIN = 2, _CANNON_MAX = 6;
  function _randTimer(){ return _CANNON_MIN + Math.random()*(_CANNON_MAX-_CANNON_MIN); }
  var shake     = { power: 0, time: 0 };
  var DIFFICULTY = parseInt(localStorage.getItem('caprush_difficulty')||'2');
  // Marco 2.9.2 (IA Boss): DIFF_CFG repensada como perfil de COMPETÊNCIA.
  // - Hard (3) é o Racer-D real: zero noise, lookahead longo, freia no ponto certo
  // - Easy (1) tem ruído alto e curto-vista de propósito (pra perder)
  // - Medium (2) é equilibrado (ruído baixo, mas comete pequenos erros)
  var DIFF_CFG = {
    1: { noise:0.28, lookaheadPx:120, speedMult:0.78 },
    2: { noise:0.06, lookaheadPx:200, speedMult:1.00 },
    3: { noise:0.00, lookaheadPx:280, speedMult:1.20 }, // Boss: precisão cirúrgica
  };
  function getDiff(){ return DIFF_CFG[DIFFICULTY]||DIFF_CFG[2]; }
  var animT     = 0;
  var lt        = 0;
  var sndTimer  = { water: 0, grass: 0 };

  // -- FISICA DA IA ---------------------------------------------------------
  var enemyPhys = (function(){
    var BASE_DRAG = 1.8, REST = 0.65, MIN = 6;
    var DRAG_MULT = { asfalto:1.0, agua:1.95, grama:0.42, areia:1.55 };
    var s = { pos:new Vector2D(0,0), vel:new Vector2D(0,0), moving:false, surf:'asfalto' };
    return {
      reset:function(x,y,sf){ s.pos=new Vector2D(x,y); s.vel=new Vector2D(0,0); s.moving=false; s.surf=sf||'asfalto'; },
      setVel:function(vx,vy){ s.vel=new Vector2D(vx,vy); s.moving=s.vel.magnitude()>MIN; },
      setSurface:function(sf){ s.surf=sf||'asfalto'; },
      step:function(dt,b){
        if(!s.moving) return this.snap();
        var dc=BASE_DRAG*(DRAG_MULT[s.surf]||1.0), spd=s.vel.magnitude();
        var ns=Math.max(0,spd-dc*spd*dt);
        if(ns<MIN){ s.vel=new Vector2D(0,0); s.moving=false; return this.snap(); }
        s.vel=s.vel.normalize().scale(ns); s.pos=s.pos.add(s.vel.scale(dt));
        var r=CAP_R;
        if(s.pos.x-r<b.x)     {s.pos.x=b.x+r;     s.vel.x= Math.abs(s.vel.x)*REST;}
        if(s.pos.x+r>b.x+b.w) {s.pos.x=b.x+b.w-r; s.vel.x=-Math.abs(s.vel.x)*REST;}
        if(s.pos.y-r<b.y)     {s.pos.y=b.y+r;     s.vel.y= Math.abs(s.vel.y)*REST;}
        if(s.pos.y+r>b.y+b.h) {s.pos.y=b.y+b.h-r; s.vel.y=-Math.abs(s.vel.y)*REST;}
        return this.snap();
      },
      snap:function(){ return{pos:s.pos.clone(),vel:s.vel.clone(),speed:s.vel.magnitude(),moving:s.moving}; },
      get pos(){ return s.pos.clone(); },
      get vel(){ return s.vel.clone(); }
    };
  })();

  // -- RACING LINE (Marco 2.9.2: linha de corrida real, suavizada + plano de velocidade) --
  // Cada ponto: { x, y, vMax, sCum }
  //   vMax = velocidade máxima segura naquele ponto (calculada do raio de curva local)
  //   sCum = distância acumulada do ponto 0 até este (em px) — pra lookahead em distância
  var _racingPath = [];

  // Suavização Catmull-Rom (cardinal spline tensão 0.5)
  function _catmullRom(p0, p1, p2, p3, t){
    var t2=t*t, t3=t2*t;
    return {
      x: 0.5*((2*p1.x) + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
      y: 0.5*((2*p1.y) + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
    };
  }
  // Raio de curvatura passando por 3 pontos
  function _curvatureRadius(pa, pb, pc){
    var ax=pa.x-pb.x, ay=pa.y-pb.y;
    var bx=pc.x-pb.x, by=pc.y-pb.y;
    var a=Math.sqrt(ax*ax+ay*ay), c=Math.sqrt(bx*bx+by*by);
    var dx=pa.x-pc.x, dy=pa.y-pc.y; var b=Math.sqrt(dx*dx+dy*dy);
    var s=(a+b+c)/2;
    var area=Math.sqrt(Math.max(0, s*(s-a)*(s-b)*(s-c)));
    if(area<0.5) return 99999; // praticamente reta
    return (a*b*c)/(4*area);
  }

  function buildRacingPath(){
    var CW=canvas.width, CH=canvas.height;
    var TW=Math.min(CW,CH)*0.095, m=TW*0.85;
    var raw=[
      {x:m,         y:CH*0.54},
      {x:m,         y:CH*0.40},
      {x:m,         y:CH*0.16},
      {x:m,         y:m},
      {x:CW*0.36,   y:m},
      {x:CW*0.44,   y:CH*0.24},
      {x:CW*0.50,   y:CH*0.33},
      {x:CW*0.56,   y:CH*0.24},
      {x:CW*0.64,   y:m},
      {x:CW-m,      y:m},
      {x:CW-m,      y:CH*0.30},
      {x:CW-m,      y:CH*0.60},
      {x:CW*0.75,   y:CH*0.72},
      {x:CW*0.62,   y:CH-m},
      {x:CW*0.50,   y:CH-m},
      {x:CW*0.38,   y:CH-m},
      {x:CW*0.25,   y:CH*0.72},
      {x:m,         y:CH*0.62},
    ];
    // 1) Suavização Catmull-Rom (24 pontos por segmento) → ~430 pontos lisos
    var N=24, smooth=[];
    for(var i=0;i<raw.length;i++){
      var p0=raw[(i-1+raw.length)%raw.length];
      var p1=raw[i];
      var p2=raw[(i+1)%raw.length];
      var p3=raw[(i+2)%raw.length];
      for(var j=0;j<N;j++){ smooth.push(_catmullRom(p0,p1,p2,p3, j/N)); }
    }
    // 2) Calcula vMax + sCum em cada ponto
    _racingPath=[];
    var sCum=0;
    for(var k=0;k<smooth.length;k++){
      var prev=smooth[(k-1+smooth.length)%smooth.length];
      var curr=smooth[k];
      var next=smooth[(k+1)%smooth.length];
      var R=_curvatureRadius(prev, curr, next);
      // vMax por raio (calibrado: TW≈50px, curva fechada R≈100px)
      var vMax;
      if(R>800)        vMax=620;
      else if(R>400)   vMax=540;
      else if(R>250)   vMax=460;
      else if(R>150)   vMax=380;
      else if(R>90)    vMax=320;
      else             vMax=280;
      if(k>0){
        var dx2=curr.x-prev.x, dy2=curr.y-prev.y;
        sCum += Math.sqrt(dx2*dx2+dy2*dy2);
      }
      _racingPath.push({x:curr.x, y:curr.y, vMax:vMax, sCum:sCum});
    }
    // 3) Propaga vMax pra trás considerando capacidade de frenagem
    //    (pontos antes de uma curva fechada precisam reduzir antecipadamente)
    var DECEL=280; // px/s² desaceleração efetiva no asfalto
    var pathLen = _racingPath[_racingPath.length-1].sCum;
    for(var iter=0; iter<3; iter++){
      for(var p=_racingPath.length-1; p>=0; p--){
        var nxt = _racingPath[(p+1)%_racingPath.length];
        var ds = nxt.sCum - _racingPath[p].sCum;
        if(ds<0) ds += pathLen;
        var vBrake = Math.sqrt(nxt.vMax*nxt.vMax + 2*DECEL*ds);
        if(vBrake < _racingPath[p].vMax) _racingPath[p].vMax = vBrake;
      }
    }
  }
  function findClosestWaypoint(pos){
    var best=0, bestD=Infinity;
    for(var i=0;i<_racingPath.length;i++){
      var dx=pos.x-_racingPath[i].x, dy=pos.y-_racingPath[i].y, d=dx*dx+dy*dy;
      if(d<bestD){bestD=d;best=i;}
    }
    return best;
  }
  // Lookahead em DISTÂNCIA (px) — robusto a curvatura variável
  function findWaypointAtDist(fromIdx, dist){
    if(_racingPath.length===0) return 0;
    var totalS = _racingPath[_racingPath.length-1].sCum;
    var startS = _racingPath[fromIdx].sCum;
    for(var i=1; i<=_racingPath.length; i++){
      var idx=(fromIdx+i)%_racingPath.length;
      var rel=_racingPath[idx].sCum - startS;
      if(rel<0) rel += totalS;
      if(rel>=dist) return idx;
    }
    return (fromIdx+30)%_racingPath.length;
  }
  // Distância da posição até a linha de corrida (px) — útil pra detectar "fora do plano"
  function distanceToRacingLine(pos){
    var idx=findClosestWaypoint(pos);
    var p=_racingPath[idx];
    var dx=pos.x-p.x, dy=pos.y-p.y;
    return Math.sqrt(dx*dx+dy*dy);
  }

  // -- PARTICULAS -----------------------------------------------------------
  function spawnImpact(x,y,power){
    for(var i=0;i<12;i++) particles.push({x:x,y:y,vx:(Math.random()-0.5)*power*0.12,vy:(Math.random()-0.5)*power*0.12,life:20});
    shake.power=Math.min(power*0.15,12); shake.time=0.25;
  }
  function spawnSparks(x,y,vx,vy,n){
    n=n||10;
    for(var i=0;i<n;i++){
      var ang=Math.random()*Math.PI*2,spd=60+Math.random()*140;
      sparks.push({x:x,y:y,vx:Math.cos(ang)*spd+(vx||0)*.25,vy:Math.sin(ang)*spd+(vy||0)*.25,
        life:10+Math.random()*10|0,maxLife:20,
        color:['#FFD700','#FF8800','#FFFFFF','#FF4400'][Math.floor(Math.random()*4)]});
    }
  }
  function _tickCannons(dt){
    var cannons = TrackV3.getCannons ? TrackV3.getCannons() : [];
    if(!cannons.length) return;
    // Init timers on first call
    if(_cannonTimers.length !== cannons.length){
      _cannonTimers = cannons.map(function(){ return _randTimer()*Math.random(); });
    }
    cannons.forEach(function(c, ci){
      _cannonTimers[ci] -= dt;
      if(_cannonTimers[ci] <= 0){
        _cannonTimers[ci] = _randTimer();
        c.firing = true;
        setTimeout(function(){ c.firing=false; }, 400);
        var PROJ_SPD = 520 + Math.random()*120;
        _projectiles.push({
          x: c.x + Math.cos(c.angle)*c.r*1.6,
          y: c.y + Math.sin(c.angle)*c.r*1.6,
          vx: Math.cos(c.angle)*PROJ_SPD,
          vy: Math.sin(c.angle)*PROJ_SPD,
          life: 5.5, r: 6,
          trail: [],   // comet trail points
          color: ['#FF6600','#FFAA00','#FF3300','#FFD700'][ci%4]
        });
      }
    });
  }
  window.onImpact=spawnImpact;
  SoundEngine.init();

  // -- GRID DE LARGADA -------------------------------------------------------
  // FIX BUG 1 (Marco 2.9.2): tampinhas lado a lado, alinhadas ATRÁS da linha de largada.
  // getStartPos() já retorna o ponto logo abaixo da linha; deslocamos lateralmente.
  // Player = lado esquerdo da linha; Racer-D = lado direito.
  // Marco 2.9.2 (FIX): pista esquerda é VERTICAL — mover em X joga uma tampinha
  // pra fora. Lado a lado = mesmo X (centro da pista), Y diferente.
  // Player na frente, enemy atrás (mais ao sul, no sentido contrário do trajeto
  // que sobe pra norte).
  function gridPositions(){

    var sp = TrackV3.getStartPos();

    // pega direção da pista via racing line
    var idx = findClosestWaypoint(sp);

    var p0 = _racingPath[idx];
    var p1 = _racingPath[(idx + 1) % _racingPath.length];

    var dx = p1.x - p0.x;
    var dy = p1.y - p0.y;

    var len = Math.sqrt(dx*dx + dy*dy) || 1;

    // perpendicular (lado a lado REAL)
    var px = -dy / len;
    var py = dx / len;

    var offset = TrackV3.TW * 0.35;

    return {
      player: { x: sp.x + px * offset, y: sp.y + py * offset },
      enemy:  { x: sp.x - px * offset, y: sp.y - py * offset }
    };
  }

  // FIX BUG 2 (Marco 2.9.2): IA presa no gramado/área inválida — respawnar no
  // último checkpoint validado pela própria IA, ou na largada se nenhum CP foi feito.
  // enemyLastOnTrack era atualizado em qualquer ponto on-track (incluindo beiradas)
  // e gerava loops; agora usamos pontos canônicos e centrais.
  function enemyRespawnPoint(){
    var cps = TrackV3.checkpoints;
    if(cps && enemyRaceState && enemyRaceState.cpsHit){
      for(var i = cps.length - 1; i >= 0; i--){
        if(enemyRaceState.cpsHit[i]) return { x: cps[i].x, y: cps[i].y };
      }
    }
    var g = gridPositions();
    return { x: g.enemy.x, y: g.enemy.y };
  }

  // -- RESIZE ---------------------------------------------------------------
  function resize(){
    var wrap=canvas.parentElement;
    canvas.width =Math.max(wrap.offsetWidth-170,320);
    canvas.height=Math.max(wrap.offsetHeight,280);
    TrackV3.init(canvas.width,canvas.height);
    buildRacingPath();
    var g = gridPositions();
    var gp = g.player;
    var ge = g.enemy;
    Physics.reset(gp.x,gp.y,'asfalto'); PilotRenderer.resetAnim();
    gs.respawn={x:gp.x,y:gp.y};
    enemyPhys.reset(ge.x,ge.y,'asfalto'); RacerX.resetAnim();
    enemyLastOnTrack=null; enemyRespawnPending=null;
  }
  window.addEventListener('resize',resize);
  setTimeout(resize,80);

  // -- START -----------------------------------------------------------------
  function startGame(){
    SoundEngine.resume(); RacerX.initSound();

    // Marco 2.9: pega piloto selecionado do PilotsData (single source of truth)
    // Se não houver piloto válido, redireciona pra escolha
    var _selPilot = null;
    if (typeof PilotsData !== 'undefined') {
      _selPilot = PilotsData.getSelected();
      if (!_selPilot) {
        try { window.location.href = 'personagens.html'; } catch(e) {}
        return;
      }
    }
    var _pid = (_selPilot && _selPilot.id) || localStorage.getItem('caprush_pilot') || 'CAL';

    // Marco 2.9: aplica cor/accent da garagem ao Yuki/CapSprite (player render)
    // Marco 2.9.2: também popula _capSoundProfile pro SoundEngine.drag()
    if (typeof GarageEngine !== 'undefined') {
      try {
        var cap = GarageEngine.get(_pid);
        window._capColor  = cap.hex;
        window._capAccent = cap.accent;
        window._capTemplate = cap.template;
        window._capSoundProfile = cap.template; // id da tampinha (AETHERION/SOLARA/...)
      } catch(e) {}
    }

    // Marco 2.5: carrega multipliers de evolução do piloto selecionado
    if (typeof PilotEvolution !== 'undefined') {
      PilotEvolution.loadAll(function() {
        var _m = PilotEvolution.getMultipliers(_pid);
        Physics.setMults(_m);
        PilotRenderer.M._evoSpeed  = _m.speedMult;
      });
    }
    // -- Pregame animation (if available) --
    if(typeof PregameAnim !== 'undefined' && !window._pregameShown){
      window._pregameShown = true;
      // Marco 2.9.2: usa dados do PilotsData (paths absolutos /assets/images/pilots/...)
      var p = (typeof PilotsData !== 'undefined') ? PilotsData.byId(_pid) : null;
      var pColor = (window._capColor) || (p && p.color) || '#00E5FF';
      var pKanji = (p && p.kanji) || '\u96EA';
      var pImg   = (p && p.img)   || '/assets/images/pilots/cal-piloto.png';
      var pName  = (p && p.name)  || _pid;
      // Racer-D: pega do catálogo se possível, fallback para path absoluto correto
      var rd = (typeof PilotsData !== 'undefined') ? PilotsData.byId('RACER_D') : null;
      var rdImg = (rd && rd.img) || '/assets/images/pilots/racer-x-piloto.png';
      PregameAnim.show({
        track:'CAPRUSH -- PISTA ORIGINAL',
        p1name:pName, p1color:pColor, p1kanji:pKanji, p1img:pImg,
        p2name:'RACER-D', p2color:'#FF2A2A', p2kanji:'\u9B3C',
        p2img:rdImg,
        mode:'SOLO vs IA'
      }, function(){
        overlay.style.display='none'; gs.phase='AIM';
        if(gs.t0===0) gs.t0=performance.now();
      });
      return; // wait for animation callback
    }
    overlay.style.display='none'; gs.phase='AIM';
    if(canvas.width<50) resize();
    var g = gridPositions();
    var gp = g.player;
    Physics.reset(gp.x,gp.y,'asfalto'); gs.respawn={x:gp.x,y:gp.y};
  }
  overlay.onclick = startGame;
  overlay.addEventListener('touchend',function(e){e.preventDefault();startGame();},{passive:false});
  overlay.style.cursor='pointer';

  // -- INPUT -----------------------------------------------------------------
  function cpos(e){var r=canvas.getBoundingClientRect();return new Vector2D(e.clientX-r.left,e.clientY-r.top);}
  function bnd(){return{x:0,y:0,w:canvas.width,h:canvas.height};}
  canvas.addEventListener('mousedown',function(e){
    if(gs.phase!=='AIM') return; SoundEngine.resume();
    if(cpos(e).distanceTo(Physics.pos)<48){gs.ds=cpos(e);gs.dc=cpos(e);}
  });
  canvas.addEventListener('mousemove',function(e){
    if(!gs.ds) return; gs.dc=cpos(e);
    var pct=Math.min(gs.ds.sub(gs.dc).magnitude()/Physics.MAX_PX,1);
    elFBar.style.height=(pct*100)+'%'; elFVal.textContent=Math.round(pct*100)+'%';
  });
  canvas.addEventListener('mouseup',function(e){
    if(!gs.ds||gs.phase!=='AIM') return;
    var info=Physics.flick(gs.ds,cpos(e),(PilotRenderer.M._evoSpeed||1)*PilotRenderer.M.spd);
    log('Lance: '+info.forcePct+'% / '+info.angle.toFixed(0)+'\u00b0','ev');
    gs.ds=null;gs.dc=null;gs.phase='MOVING';
    if(!gs.t0){gs.t0=performance.now();gs.lapStart=gs.t0;}
    elFBar.style.height='0%';elFVal.textContent='0%';
  });
  canvas.addEventListener('touchstart',function(e){
    if(gs.phase!=='AIM') return; SoundEngine.resume();
    if(cpos(e.touches[0]).distanceTo(Physics.pos)<48){gs.ds=cpos(e.touches[0]);gs.dc=cpos(e.touches[0]);}
  },{passive:true});
  canvas.addEventListener('touchmove',function(e){
    e.preventDefault();if(!gs.ds) return;gs.dc=cpos(e.touches[0]);
    var pct=Math.min(gs.ds.sub(gs.dc).magnitude()/Physics.MAX_PX,1);
    elFBar.style.height=(pct*100)+'%';elFVal.textContent=Math.round(pct*100)+'%';
  },{passive:false});
  canvas.addEventListener('touchend',function(e){
    if(!gs.ds||gs.phase!=='AIM') return;
    Physics.flick(gs.ds,cpos(e.changedTouches[0]),(PilotRenderer.M._evoSpeed||1)*PilotRenderer.M.spd);
    gs.ds=null;gs.dc=null;gs.phase='MOVING';
    if(!gs.t0){gs.t0=performance.now();gs.lapStart=gs.t0;}
    elFBar.style.height='0%';elFVal.textContent='0%';
  },{passive:true});

  // -- LOOP ------------------------------------------------------------------
  function loop(now){
    var dt=Math.min((now-lt)/1000,0.05);lt=now;animT+=dt;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // mantém boost por alguns frames
    if(gs._boosting && Date.now() - gs._boosting < 600){
      // não deixa drag matar velocidade
      Physics.setSurface('asfalto');
    }

    // 🔥 PRIMEIRO calcula player
    var ph = Physics.step(dt,bnd());

    // 🔥 DEPOIS calcula enemy
    var eph = enemyPhys.step(dt,bnd());

    // Colisao player x Racer-X
    var cdx=eph.pos.x-ph.pos.x,cdy=eph.pos.y-ph.pos.y,cdst=Math.sqrt(cdx*cdx+cdy*cdy);
    if(cdst>0.5&&cdst<CAP_R*2){
      var cnx=cdx/cdst,cny=cdy/cdst,overlap=CAP_R*2-cdst;
      var eps=enemyPhys.snap();
      enemyPhys.reset(eps.pos.x+cnx*overlap*0.6,eps.pos.y+cny*overlap*0.6,'asfalto');
      var pv0n=ph.vel.x*cnx+ph.vel.y*cny,ev0n=eph.vel.x*cnx+eph.vel.y*cny;
      var impulse = Math.abs(pv0n - ev0n);

      Physics.setVel(
        ph.vel.x - impulse * cnx * 0.85,
        ph.vel.y - impulse * cny * 0.85
      );

      enemyPhys.setVel(
        eph.vel.x + impulse * cnx * 0.85,
        eph.vel.y + impulse * cny * 0.85
      );

      enemyPhys._lastHit = Date.now();

      // -- Sparks + hit sound on cap collision --
      SoundEngine.hit();
      var csx=(ph.pos.x+eph.pos.x)*0.5,csy=(ph.pos.y+eph.pos.y)*0.5;
      spawnSparks(csx,csy,(pv0n-ev0n)*cnx*0.5,(pv0n-ev0n)*cny*0.5,14);
      eph=enemyPhys.snap();
    }

    // Shake
    if(shake.time>0){
      shake.time-=dt;var si=shake.power*(shake.time/0.25);
      ctx.translate((Math.random()-0.5)*si,(Math.random()-0.5)*si);
    }
    TrackV3.render(ctx,canvas.width,canvas.height,animT);

    // ============================================================
    // JOGADOR
    // ============================================================
    if(gs.phase==='MOVING'){

      // BOOSTER (Marco 2.9.2): detectBoost (API correta da V3) + Physics.applyBoost
      // applyBoost SOMA à velocidade atual (rampa pra spd*1.5, max MAX_SPD*1.3) e
      // reduz drag em 40% por 1500ms. Tampinha veio rápido → fica MAIS rápida.
      if(TrackV3.detectBoost){
        var boost = TrackV3.detectBoost(Physics.pos, CAP_R);
        if(boost){
          // Cooldown 600ms — evita disparo múltiplo no mesmo frame de zona
          var nowB = Date.now();
          if(!gs._boosting || nowB - gs._boosting > 600){
            gs._boosting = nowB;
            Physics.applyBoost(1500);
            SoundEngine.boost && SoundEngine.boost();
            log('BOOST!', 'ev');
            var bDir = ph.vel.magnitude() > 0 ? ph.vel.normalize() : new Vector2D(0,-1);
            spawnSparks(ph.pos.x, ph.pos.y, bDir.x*80, bDir.y*80, 12);
          }
        }
      }

      var obs=TrackV3.checkObstacles(ph.pos,CAP_R);
      if(obs){var rest=obs.elastic?1.15:0.72;Physics.bounce(obs.nx,obs.ny,rest);SoundEngine.hit();log(t('game_hit_obs','Bateu em obstaculo!'));if(obs.elastic){spawnSparks(ph.pos.x,ph.pos.y,ph.vel.x,ph.vel.y,10);}ph=Physics.step(0,bnd());}
      // Pothole
      if(TrackV3.checkPothole){var pot=TrackV3.checkPothole(ph.pos,CAP_R);if(pot){Physics.reset(pot.x,pot.y,'asfalto');log('Buraco! Tampinha parou!','ev');SoundEngine.hit();spawnSparks(pot.x,pot.y,0,0,8);}}
      var stand=TrackV3.checkStands(ph.pos,CAP_R);
      if(stand){Physics.bounce(stand.nx,stand.ny,0.72);SoundEngine.hit();log(t('game_stand','Arquibancada! Ricochete!'),'ev');ph=Physics.step(0,bnd());}
      var pdk=TrackV3.checkPaddock(ph.pos,CAP_R);
      if(pdk){skipTurn=true;SoundEngine.hit();log(t('game_paddock','Foi para o BOX! Perdeu turno!'),'ev');ph=Physics.step(0,bnd());}

      // Marco 2.9.2 (E3): twister/spin — empurra na direção da seta giratória
      // visível no render (consistente com TrackV3.getSpinDirection)
      if(TrackV3.detectSpin){
        var sp=TrackV3.detectSpin(ph.pos);
        if(sp){
          var nowSp=Date.now();
          if(!gs._spinCd || nowSp-gs._spinCd>700){
            gs._spinCd=nowSp;
            var dir=TrackV3.getSpinDirection(sp.zone, animT);
            // empurrão: combina velocidade atual + impulso forte na direção da seta
            var pushV = 320; // px/s
            var cv = ph.vel;
            Physics.setVel(cv.x*0.4 + dir.x*pushV, cv.y*0.4 + dir.y*pushV);
            if(SoundEngine.twister) SoundEngine.twister();
            log(t('game_twister','Twister! Lançada pela ventania!'),'ev');
            spawnSparks(ph.pos.x, ph.pos.y, dir.x*50, dir.y*50, 8);
            ph=Physics.step(0,bnd());
          }
        }
      }

      if(TrackV3.isOnTrack(ph.pos)){
        var n2=Date.now();
        if(TrackV3.detectPuddle(ph.pos)){Physics.setSurface('agua');if(n2-sndTimer.water>700){SoundEngine.splash();sndTimer.water=n2;}}
        else if(TrackV3.detectSand&&TrackV3.detectSand(ph.pos)){Physics.setSurface('areia');if(n2-sndTimer.grass>600){SoundEngine.drag('areia',ph.speed||0);sndTimer.grass=n2;}}
        else if(TrackV3.detectGrassOnTrack(ph.pos)){Physics.setSurface('grama');if(n2-sndTimer.grass>900){SoundEngine.grass();sndTimer.grass=n2;}}
        else Physics.setSurface('asfalto');
      } else {
        // Marco 2.9.2 (E1): respawn AGORA também dispara quando saiu pra QUALQUER
        // área fora da pista (não só interna). Antes ficava parado no gramado externo.
        // Cooldown anti-loop preservado.
        if(Date.now()>gs.respawnCooldown){
          var rp;

          if(gs.lastCP){
            rp = gs.lastCP;
          }
          else if(gs.respawn){
            rp = gs.respawn;
          }
          else{
            var g = gridPositions();
            rp = g.player;
          }
          
          gs.respawnPending={x:rp.x,y:rp.y};
          gs.respawnCooldown=Date.now()+1500;  // 1.5s de cooldown
          log(t('game_offtrack','Voltando ao CP'));
        }
      }

      // Ativa contagem de volta só depois de sair da largada
      if(!gs.lapArmed){
        var distFromStart = ph.pos.distanceTo(TrackV3.getStartPos());
        if(distFromStart > 120){
          gs.lapArmed = true;
        }
      }

      TrackV3.checkCP(ph.pos,function(c){
        gs.cp++;
        gs.respawn = {x:c.x,y:c.y};
        gs.lastCP = {x:c.x,y:c.y};
        elCp.textContent=gs.cp+'/'+NCPS;
        SoundEngine.checkpoint(); log(t('game_checkpoint','Checkpoint!'),'ev');
      });

      var crossedLap = false;

      // detector principal
      if(TrackV3.checkLap(ph.pos)){
        crossedLap = true;
      }

      // fallback (SÓ se o principal não pegou)
      else if(gs.lastPos){
        var prev = gs.lastPos;
        var curr = ph.pos;
        var sp = TrackV3.getStartPos();

        if(prev.y > sp.y && curr.y <= sp.y){
          crossedLap = true;
        }
      }

      // 🔥 ANTI DUPLICAÇÃO DE FRAME
      if(crossedLap){
        if(gs._lapLock && Date.now() - gs._lapLock < 800){
          crossedLap = false;
        } else {
          gs._lapLock = Date.now();
        }
      }

      gs.lastPos = { x: ph.pos.x, y: ph.pos.y };

      if(crossedLap && gs.lapArmed && gs.cp >= NCPS){

        // 🔥 RESET ARM (ESSENCIAL PRA NÃO BUGAR)
        gs.lapArmed = false;

        // -- MELHOR VOLTA ----------------------------------------
        var lapTime=(performance.now()-gs.lapStart)/1000;

        if(!gs.best||lapTime<gs.best){
          gs.best=lapTime;
          elBest.textContent=fmt(gs.best);
        }

        gs.lapStart=performance.now();

        // --------------------------------------------------------
        gs.lap++;
        gs.cp=0;

        TrackV3.resetCPs();

        elLap.textContent=gs.lap+'/'+LAPS;

        log(t('game_lap_label','Volta')+' '+gs.lap,'lap');

        // 🔥 GARANTE QUE SÓ TERMINA DEPOIS DA PRIMEIRA VOLTA REAL
        if(gs.lap > LAPS){
          gs.phase='FINISH';
          onFinish();
        }
      }
      // Marco 2.9.2: avisa o jogador se cruzar a linha sem ter feito todos CPs
      else if(crossedLap && gs.lapArmed && gs.cp < NCPS){
        if(!gs._cpWarnLock || Date.now()-gs._cpWarnLock > 3000){
          gs._cpWarnLock = Date.now();
          log(t('game_cp_missing','Faltam checkpoints!')+' ('+gs.cp+'/'+NCPS+')','ev');
        }
      }

      gs.elapsed=(performance.now()-gs.t0)/1000; updHUD();

      if(!ph.moving){
        gs.phase='ENEMY_AIM';
        log(skipTurn?t('game_turn_lost','Turno perdido! Vez de Racer-X.'):t('game_enemy_turn','Turno de Racer-X'),'ev');
        if(skipTurn) skipTurn=false;
      }
    }

    if(gs.respawnPending){
      Physics.reset(gs.respawnPending.x,gs.respawnPending.y,'asfalto');

      // 🔥 CORREÇÕES CRÍTICAS
      gs.lastPos = null;
      gs.lapArmed = false;
      gs._lapLock = Date.now(); // evita trigger imediato

      gs.respawnPending=null;
    }

    // ============================================================
    // RACER-X -- FISICA + PROGRESSO
    // ============================================================
    if(TrackV3.isOnTrack(eph.pos)) enemyLastOnTrack={x:eph.pos.x,y:eph.pos.y};

    if(eph.moving){
      var eObs=TrackV3.checkObstacles(eph.pos,CAP_R);
      if(eObs){var eDot=eph.vel.x*eObs.nx+eph.vel.y*eObs.ny;if(eDot<0){enemyPhys.setVel((eph.vel.x-2*eDot*eObs.nx)*0.65,(eph.vel.y-2*eDot*eObs.ny)*0.65);eph=enemyPhys.snap();}}
      var eStand=TrackV3.checkStands(eph.pos,CAP_R);
      if(eStand){var esDot=eph.vel.x*eStand.nx+eph.vel.y*eStand.ny;if(esDot<0){enemyPhys.setVel((eph.vel.x-2*esDot*eStand.nx)*0.60,(eph.vel.y-2*esDot*eStand.ny)*0.60);eph=enemyPhys.snap();}}
      if(TrackV3.isOnTrack(eph.pos)){
        if(TrackV3.detectPuddle(eph.pos)) enemyPhys.setSurface('agua');
        else if(TrackV3.detectSand&&TrackV3.detectSand(eph.pos)) enemyPhys.setSurface('areia');
        else if(TrackV3.detectGrassOnTrack(eph.pos)) enemyPhys.setSurface('grama');
        else enemyPhys.setSurface('asfalto');
      }
      // Racer-D fora da pista durante movimento: agenda respawn no último CP / largada
      if(!TrackV3.isOnTrack(eph.pos)&&!enemyRespawnPending&&Date.now()>enemyRespawnCooldown){
        var eRp=enemyRespawnPoint();
        enemyRespawnPending={x:eRp.x,y:eRp.y};
        enemyRespawnCooldown=Date.now()+1500;
        enemyPhys.setVel(0,0); eph=enemyPhys.snap();
      }
    }

    // Racer-D PARADO fora da pista (preso em terra/área proibida):
    // teleporta imediatamente para o último checkpoint validado / largada.
    if(!eph.moving && !TrackV3.isOnTrack(eph.pos) && !enemyRespawnPending){
      var eRpStuck=enemyRespawnPoint();
      enemyRespawnPending={x:eRpStuck.x,y:eRpStuck.y};
    }

    if(enemyRespawnPending){

      var safe = true;

      var dxp = ph.pos.x - enemyRespawnPending.x;
      var dyp = ph.pos.y - enemyRespawnPending.y;
      var distP = Math.sqrt(dxp*dxp + dyp*dyp);

      if(distP < 120){
        safe = false;
      }

      if(safe){
        enemyPhys.reset(enemyRespawnPending.x,enemyRespawnPending.y,'asfalto');
        enemyRespawnPending = null;
        eph = enemyPhys.snap();
      }
    }

    // -- Racer-X: checkpoints independentes --------------------
    var eCps=TrackV3.checkpoints;
    if(eCps&&(eph.moving||gs.phase==='ENEMY_MOVING')){
      for(var ci=0;ci<eCps.length;ci++){
        if(enemyRaceState.cpsHit[ci]) continue;
        var ec=eCps[ci];
        var ecDx=eph.pos.x-ec.x, ecDy=eph.pos.y-ec.y;
        if(Math.sqrt(ecDx*ecDx+ecDy*ecDy)<ec.r){
          enemyRaceState.cpsHit[ci]=true;
          enemyRaceState.cp++;
          enemyLastOnTrack={x:ec.x,y:ec.y};
          log('Racer-X: CP '+(ci+1),'ev');
        }
      }
      // -- Racer-X: volta completa ----------------------------
      if(enemyRaceState.cp>=NCPS&&TrackV3.checkLap(eph.pos)){
        enemyRaceState.cp=0;
        enemyRaceState.cpsHit=[false,false,false];
        enemyRaceState.lap++;
        log('Racer-X: Volta '+enemyRaceState.lap,'ev');
        if(enemyRaceState.lap>LAPS&&gs.phase!=='FINISH'){
          gs.phase='FINISH'; onEnemyWin();
        }
      }
    }

    // -- Racer-D: ENEMY_AIM (Marco 2.9.2 — IA SIMPLES restaurada) -----------
    // Filosofia: voltar à versão que FUNCIONAVA. Olha um waypoint à frente,
    // checa obstáculo, manda lance proporcional à distância. Hard tem noise=0.
    // Adapta-se à _racingPath suavizada (Catmull-Rom) que tem ~430 pontos —
    // por isso o lookahead em índices é multiplicado por 1.5x ao 4x (a linha
    // tem mais pontos do que a antiga).
    gs._enemyStuckFrames=(gs._enemyStuckFrames||0);
    if(gs.phase==='ENEMY_AIM'&&_racingPath.length>0){

      var df = getDiff();

      // 🔥 1. SNAP NA LINHA (FIX PRINCIPAL)
      var eClosest = findClosestWaypoint(eph.pos);
      var snapPoint = _racingPath[eClosest];

      var snapDist = eph.pos.distanceTo(new Vector2D(snapPoint.x, snapPoint.y));

      // 🔥 2. LOOKAHEAD BASEADO EM DISTÂNCIA REAL
      var lookDist = df.lookaheadPx;

      var targetIndex = findWaypointAtDist(eClosest, lookDist);
      var eTarget = _racingPath[targetIndex];

      // 🔥 3. DIREÇÃO SUAVIZADA (ANTI-BURRICE)
      var desiredDir = new Vector2D(
        eTarget.x - eph.pos.x,
        eTarget.y - eph.pos.y
      ).normalize();

      var dx = eTarget.x - eph.pos.x;
      var dy = eTarget.y - eph.pos.y;

      var currentVel = eph.vel.magnitude() > 0 ? eph.vel.normalize() : desiredDir;

      var smoothFactor = (DIFFICULTY===3) ? 0.85 : 0.6;

      var eDir = currentVel.scale(1 - smoothFactor)
        .add(desiredDir.scale(smoothFactor))
        .normalize();

      // ============================
      // 🔥 MELHORIA 1 — LINHA IDEAL (CORTE DE CURVA)
      // ============================

      var next2 = _racingPath[(targetIndex + 20) % _racingPath.length];

      if(next2){
        var dx2 = next2.x - eTarget.x;
        var dy2 = next2.y - eTarget.y;

        var cross = dx * dy2 - dy * dx2;

        var sideBias = (cross > 0 ? -1 : 1) * 0.25;

        eDir = new Vector2D(
          eDir.x + sideBias * (-eDir.y),
          eDir.y + sideBias * ( eDir.x)
        ).normalize();
      }

      // 🔥 4. VELOCIDADE INTELIGENTE (USA vMax DA PISTA)
      var vMax = eTarget.vMax || 400;

      // 🔥 IA decide força baseado em espaço livre
      var baseSpeed = vMax * df.speedMult;

      // detecta obstáculo à frente — Marco 2.9.2: amostragem múltipla
      // Antes: 1 ponto a 90px (escapava obstáculos antes/depois)
      // Agora: 5 pontos cobrindo até 280px do trajeto até o alvo, raio inflado.
      var obstacle = null;
      var _checkR = CAP_R * (DIFFICULTY===3 ? 4.0 : 3.2);
      var _maxCheckDist = Math.min(eph.pos.distanceTo(new Vector2D(eTarget.x, eTarget.y)), 280);
      for(var _ci=1; _ci<=5; _ci++){
        var _t = _ci/5;
        var _testPos = eph.pos.add(eDir.scale(_maxCheckDist * _t));
        var _hit = TrackV3.checkObstacles(_testPos, _checkR);
        if(_hit){ obstacle = _hit; break; }
      }

      // distância até target
      var dist = eph.pos.distanceTo(new Vector2D(eTarget.x, eTarget.y));

      // lógica de decisão
      var speed;

      if(obstacle){
        // Marco 2.9.2: REMOVIDO o desvio lateral cego (eDir.add(avoidDir...))
        // que jogava IA pra fora da pista. Agora só REDUZ velocidade — se vai
        // bater, bate devagar e ricocheteia bem. Mantém na linha de corrida.
        speed = baseSpeed * 0.55;
      }
      else if(dist > 220){
        // reta longa → acelera
        speed = baseSpeed * 1.35;
      }
      else if(dist > 120){
        // média
        speed = baseSpeed * 0.85;
      }
      else{
        // curva / ajuste fino
        speed = baseSpeed * 0.6;
      }

      // ============================
      // 🔥 MELHORIA 3 — EVITA BORDA
      // ============================

      if(distanceToRacingLine(eph.pos) > TrackV3.TW * 0.6){
        speed *= 0.7;
      }

      // 🔥 5. FREIO AUTOMÁTICO EM CURVA
      var nextIndex = (targetIndex + 10) % _racingPath.length;
      var next = _racingPath[nextIndex];

      if(next && next.vMax < vMax){
        speed *= 0.75; // freia antes da curva
      }

      // 🔥 6. EVITA MICRO MOVIMENTO
      if(speed < 260) speed = 260;

      // 🔥 7. APLICA VELOCIDADE
      // ============================
      // 🔥 MELHORIA 2 — ACELERAÇÃO PROGRESSIVA
      // ============================

      var accel = 0.92;

      var newVel = eph.vel.scale(1 - accel).add(
        eDir.scale(speed * accel)
      );

      // 🔥 respeita impacto recente
      if(enemyPhys._lastHit && Date.now() - enemyPhys._lastHit < 400){
        speed *= 0.6; // reage ao impacto, mas não trava
      }

      enemyPhys.setVel(
        newVel.x,
        newVel.y
      );

      eph = enemyPhys.snap();

      gs.phase='ENEMY_MOVING';
    }
    if(gs.phase==='ENEMY_MOVING'){
      gs.elapsed=(performance.now()-gs.t0)/1000; updHUD();
      gs._enemyStuck=(gs._enemyStuck||0)+1;
      if(gs._enemyStuck>280){ gs.phase='AIM'; gs._enemyStuck=0; log('Sua vez','ev'); }
      else if(!eph.moving){gs._enemyStuck=0;gs.phase='AIM';log(t('game_your_turn','Sua vez'),'ev');}
    }

    // -- RENDER ------------------------------------------------
    PilotRenderer.render(ctx,ph,dt);
    RacerX.render(ctx,eph,dt);

    for(var pi=0;pi<particles.length;pi++){
      var p=particles[pi];p.x+=p.vx;p.y+=p.vy;p.life--;
      ctx.globalAlpha=p.life/20;
      ctx.fillStyle='rgb(255,'+Math.round(200+Math.random()*50)+',50)';
      ctx.beginPath();ctx.arc(p.x,p.y,2+(20-p.life)*0.05,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    particles=particles.filter(function(p){return p.life>0;});
    // Sparks
    sparks=sparks.filter(function(s){
      s.life--;if(s.life<=0)return false;
      s.x+=s.vx*dt;s.y+=s.vy*dt;s.vx*=.82;s.vy*=.82;
      var a=s.life/s.maxLife;
      ctx.save();ctx.globalAlpha=a;ctx.fillStyle=s.color;
      ctx.shadowColor=s.color;ctx.shadowBlur=5;
      ctx.beginPath();ctx.arc(s.x,s.y,2.5*a,0,Math.PI*2);ctx.fill();
      ctx.restore();return true;
    });

    // -- Cannon projectiles -----------------------------------------
    _tickCannons(dt);
    var _capPos=ph.pos;  // ph already computed by Physics.step above
    _projectiles=_projectiles.filter(function(p){
      p.life-=dt; if(p.life<=0) return false;
      p.x+=p.vx*dt; p.y+=p.vy*dt;
      // === Colisão com JOGADOR ===
      var pdx=p.x-_capPos.x,pdy=p.y-_capPos.y;
      if(Math.sqrt(pdx*pdx+pdy*pdy)<p.r+CAP_R){
        var pn=new Vector2D(pdx,pdy).normalize();
        var hitPow=Math.max(200,ph.speed*0.55+160);
        Physics.setVel(pn.x*hitPow,pn.y*hitPow);
        spawnSparks(p.x,p.y,p.vx*0.3,p.vy*0.3,18);
        SoundEngine.hit();
        log('Projétil! Ricochete!','ev');
        setTimeout(function(){
          var np=Physics.pos;  // use getter
          if(!TrackV3.isOnTrack(np)){
            var cp2=gs.lastCP||TrackV3.getStartPos();
            Physics.reset(cp2.x,cp2.y,'asfalto');
            log('Saiu da pista -- volta ao CP','ev');
          }
        },1100);
        return false;
      }
      // === Marco 2.9.2: Colisão com IA RACER-D ===
      // Mesmo padrão do jogador, aplicado ao enemyPhys. Se o projétil joga a IA
      // pra fora da pista, ela respawna no último CP dela (enemyRespawnPoint).
      var edx=p.x-eph.pos.x, edy=p.y-eph.pos.y;
      if(Math.sqrt(edx*edx+edy*edy)<p.r+CAP_R){
        // Marco 2.9.2: BOSS — Racer-D é foda. NÃO se move quando projétil bate.
        // Em vez disso, REFLETE o projétil no vetor normal da tampinha (en).
        // Reflexão: v' = v - 2(v·n)n. Aplica perda de 25% pra projétil não viajar
        // pra sempre. Empurra projétil pra fora do raio de colisão pra evitar
        // re-colisão no frame seguinte.
        var en = new Vector2D(edx, edy).normalize();           // normal IA → projétil
        var vDotN = p.vx * en.x + p.vy * en.y;
        if(vDotN < 0){                                          // só reflete se vindo em direção
          var refX = (p.vx - 2 * vDotN * en.x) * 0.75;
          var refY = (p.vy - 2 * vDotN * en.y) * 0.75;
          p.vx = refX; p.vy = refY;
          // empurra projétil pra fora do raio de colisão (evita stuck)
          var pushOut = (p.r + CAP_R + 1);
          p.x = eph.pos.x + en.x * pushOut;
          p.y = eph.pos.y + en.y * pushOut;
          p.trail = []; // reseta trail pra mostrar mudança visual
          spawnSparks(p.x, p.y, refX*0.3, refY*0.3, 22);
          SoundEngine.hit();
          log('Racer-D ricocheteou o projétil!','ev');
        }
        return true; // projétil continua vivo, voando em outra direção
      }
      // Add trail point every 2 frames
      if(!p.trail) p.trail=[];
      p.trail.push({x:p.x,y:p.y});
      if(p.trail.length>28) p.trail.shift();

      ctx.save();
      // Comet tail
      if(p.trail.length>1){
        for(var ti=1;ti<p.trail.length;ti++){
          var tp=ti/p.trail.length;
          ctx.beginPath();
          ctx.moveTo(p.trail[ti-1].x,p.trail[ti-1].y);
          ctx.lineTo(p.trail[ti].x,p.trail[ti].y);
          ctx.strokeStyle=p.color||'#FF6600';
          ctx.lineWidth=(p.r*0.8)*tp;
          ctx.globalAlpha=tp*0.55;
          ctx.shadowColor=p.color||'#FF6600';
          ctx.shadowBlur=6*tp;
          ctx.lineCap='round';
          ctx.stroke();
        }
      }
      // Comet head -- bright core
      ctx.globalAlpha=1;
      ctx.shadowColor='#FFFFFF';ctx.shadowBlur=18;
      var pg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
      pg.addColorStop(0,'#FFFFFF');
      pg.addColorStop(0.35,p.color||'#FF6600');
      pg.addColorStop(1,'rgba(255,80,0,0)');
      ctx.fillStyle=pg;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r*1.2,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.restore();
      return true;
    });
    if(gs.ds&&gs.dc) drawAim(ph.pos,gs.dc);
    if(gs.phase!=='FINISH') requestAnimationFrame(loop);
  }

  // -- JOGADOR VENCE --------------------------------------------------------
  function onFinish(){
    var tT=gs.elapsed;
    log(t('game_complete','CORRIDA COMPLETA!')+' '+fmt(tT),'ev');
    SoundEngine.victory();
    var _pid = localStorage.getItem('caprush_pilot') || 'CAL';
    postScore(_pid, tT);

    // Marco 2.5: verifica missões após corrida solo
    if (typeof Missions !== 'undefined') {
      Missions.checkAfterEvent('solo_race', _pid, {}, function(awarded) {
        if (awarded && awarded.length > 0 && window._onMissionAwarded) {
          window._onMissionAwarded(awarded);
        }
      });
    }

    // Marco 2.9: badge BOSS_SLAYER se vencer no Hard Solo
    try {
      var diff = (localStorage.getItem('caprush_difficulty') || 'normal').toLowerCase();
      if(diff === 'hard' && typeof BadgesEngine !== 'undefined' && !BadgesEngine.has('BOSS_SLAYER')){
        BadgesEngine.grant('BOSS_SLAYER');
      }
    } catch(e) {}

    // Marco 2.9: contador de vitórias solo + badge SPEED_DEMON @ 50 wins
    try {
      var wins = parseInt(localStorage.getItem('caprush_solo_wins') || '0', 10) + 1;
      localStorage.setItem('caprush_solo_wins', String(wins));
      if(wins >= 50 && typeof BadgesEngine !== 'undefined' && !BadgesEngine.has('SPEED_DEMON')){
        BadgesEngine.grant('SPEED_DEMON');
      }
    } catch(e) {}
    setTimeout(function(){
      overlay.innerHTML=
        '<h2 data-i18n="game_complete">'+t('game_complete','CORRIDA COMPLETA!')+'</h2>'+
        '<p style="color:#FFD700;font-size:2rem;font-family:Bebas Neue,sans-serif">'+fmt(tT)+'</p>'+
        '<p style="color:#aaa;margin-top:.5rem">'+t('game_play_again','Clique para jogar novamente')+'</p>';
      overlay.style.display='flex';
      overlay.onclick=function(){overlay.onclick=null;restart();};
    },1600);
  }

  // -- RACER-X VENCE (tela de derrota) --------------------------------------
  function onEnemyWin(){
    log('RACER-X VENCEU! Voce foi derrotado!','ev');
    // Som de vitoria do chefe (beeps descendentes -- diferente do jogador)
    try{
      [880,740,660,440].forEach(function(f,i){
        setTimeout(function(){
          var o=new (window.AudioContext||window.webkitAudioContext)();
          var osc=o.createOscillator(),g=o.createGain();
          osc.type='sawtooth';osc.frequency.value=f;
          g.gain.setValueAtTime(0.4,o.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001,o.currentTime+0.25);
          osc.connect(g);g.connect(o.destination);osc.start();osc.stop(o.currentTime+0.25);
          setTimeout(function(){try{o.close();}catch(e){}},500);
        },i*180);
      });
    }catch(e){}
    setTimeout(function(){
      overlay.innerHTML=
        '<h2 style="color:#FF2A2A;font-family:Bebas Neue,sans-serif;font-size:2.5rem;letter-spacing:3px">'+
          t('game_defeat','RACER-X VENCEU!')+'</h2>'+
        '<p style="color:#aaa;margin-top:.6rem">'+t('game_defeat_sub','O Boss completou a corrida primeiro')+'</p>'+
        '<p style="color:#FF2A2A;margin-top:.4rem;font-size:.85rem">'+t('game_best_label','Melhor volta')+': '+(gs.best?fmt(gs.best):'--')+'</p>'+
        '<br><p style="color:#888;font-size:.8rem">'+t('game_play_again','Clique para tentar novamente')+'</p>';
      overlay.style.display='flex';
      overlay.onclick=function(){overlay.onclick=null;restart();};
    },1600);
  }

  function restart(){
    overlay.style.display='none'; TrackV3.resetCPs();
    var g = gridPositions();
    var gp = g.player;
    var ge = g.enemy;
    Physics.reset(gp.x,gp.y,'asfalto');
    enemyPhys.reset(ge.x,ge.y,'asfalto');
    PilotRenderer.resetAnim(); RacerX.resetAnim();
    enemyLastOnTrack=null;enemyRespawnPending=null;
    enemyRespawnCooldown=0;
    enemyRaceState={lap:1,cp:0,cpsHit:[false,false,false]};
    skipTurn=false;
    gs={phase:'AIM',lap:1,cp:0,t0:performance.now(),elapsed:0,
        best:gs.best,lapStart:performance.now(),
        ds:null,dc:null,respawn:{x:gp.x,y:gp.y},respawnPending:null,respawnCooldown:0};
    updHUD();logBox.innerHTML='';
    // ESSENCIAL: reinicia o loop de animacao que parou na fase FINISH
    lt=performance.now();
    requestAnimationFrame(loop);
  }

  function updHUD(){
    elTime.textContent=fmt(gs.elapsed);
    elLap.textContent=gs.lap+'/'+LAPS;
    elCp.textContent=gs.cp+'/'+NCPS;
    if(gs.best) elBest.textContent=fmt(gs.best); // melhor volta atualiza em tempo real
  }
  function fmt(s){ var m=Math.floor(s/60),ss=(s%60).toFixed(1); return(m<10?'0':'')+m+':'+(parseFloat(ss)<10?'0':'')+ss; }
  function log(msg,cls){ var p=document.createElement('p');if(cls)p.className=cls;p.textContent=msg;logBox.insertBefore(p,logBox.firstChild);while(logBox.children.length>30)logBox.removeChild(logBox.lastChild); }
  function drawAim(cap,drag){
    var dir=cap.sub(drag).normalize(),dist=Math.min(cap.distanceTo(drag),Physics.MAX_PX);
    var end=cap.add(dir.scale(dist*1.8)),pct=dist/Physics.MAX_PX;
    ctx.save();
    var g=ctx.createLinearGradient(cap.x,cap.y,end.x,end.y);
    g.addColorStop(0,'rgba(0,229,255,'+(0.85+pct*.15)+')');g.addColorStop(1,'rgba(0,229,255,0)');
    ctx.strokeStyle=g;ctx.lineWidth=2+pct*2.5;ctx.setLineDash([7,5]);
    ctx.beginPath();ctx.moveTo(cap.x,cap.y);ctx.lineTo(end.x,end.y);ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(cap.x,cap.y,20+pct*12,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,215,0,'+(0.25+pct*.5)+')';ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
  }
  function postScore(p,tT){
    var nick=(function(){try{return JSON.parse(localStorage.getItem('caprush_user')||'{}').nickname||'ANON';}catch(e){return 'ANON';}})();
    var SURL='https://rigghudagbzrzadsbeml.supabase.co/rest/v1/runs';
    var SKEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZ2dodWRhZ2J6cnphZHNiZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzk4OTUsImV4cCI6MjA5MTk1NTg5NX0.2fXODjCXc7IjsF7KS5cAMC-jt9ovxturuQUKmiApO9A';
    var _ms = Math.round(tT*1000);
    fetch(SURL,{method:'POST',headers:{'Content-Type':'application/json','apikey':SKEY,'Authorization':'Bearer '+SKEY,'Prefer':'return=minimal'},
      body:JSON.stringify({wallet:nick,nickname:nick,pilot:p,time_ms:_ms,launches:0,mode:'solo'})
    }).then(function(r){log(r.ok?'Score salvo!':'Erro ao salvar.','ev');}).catch(function(){log('Sem conexao.');});
    // Award $CR for completed solo race
    if(typeof CREngine!=='undefined'){
      var _prevBest=parseInt(localStorage.getItem('caprush_best_solo_'+p)||'0')||null;
      CREngine.awardRace({mode:'solo',time_ms:_ms,won:true,previous_best_ms:_prevBest});
      // Marco 2.5: missão de recorde pessoal
      if(typeof Missions!=='undefined' && _prevBest && _ms < _prevBest){
        Missions.checkAfterEvent('personal_record', localStorage.getItem('caprush_pilot')||'CAL', {}, function(){});
      }
      if(!_prevBest||_ms<_prevBest) localStorage.setItem('caprush_best_solo_'+p,_ms);
    }
  }

  requestAnimationFrame(function(t2){lt=t2;requestAnimationFrame(loop);});
})();
