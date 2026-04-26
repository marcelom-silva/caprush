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
    t0: 0, elapsed: 0,
    best: null,          // melhor volta (segundos)
    lapStart: 0,         // timestamp inicio da volta atual
    ds: null, dc: null,
    respawn: null, respawnPending: null,
    respawnCooldown: 0   // timestamp -- impede loop de respawn
  };
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
  var _CANNON_MIN = 5, _CANNON_MAX = 12;
  function _randTimer(){ return _CANNON_MIN + Math.random()*(_CANNON_MAX-_CANNON_MIN); }
  var shake     = { power: 0, time: 0 };
  var DIFFICULTY = parseInt(localStorage.getItem('caprush_difficulty')||'2');
  var DIFF_CFG = {
    1: { noise:0.28, lookahead:8,  speedMult:0.78, obsSkip:3  },
    2: { noise:0.04, lookahead:20, speedMult:1.00, obsSkip:6  },
    3: { noise:0.005,lookahead:32, speedMult:1.18, obsSkip:12 },
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

  // -- RACING LINE (nunca usa getRacingLine -- hardcoded errado) -------------
  var _racingPath = [];
  function buildRacingPath(){
    var CW=canvas.width, CH=canvas.height;
    var TW=Math.min(CW,CH)*0.095, m=TW*0.85;
    // Racing path follows actual track dotted line (pts[] waypoints from TrackV3)
    // Paddock is at x:0.107-0.267, y:0.21-0.43 -- track itself avoids it
    // Paddock zone: x=CW*0.107-0.267, y=CH*0.21-0.43
    // m = CW*0.095 -- track left wall stays at x=m which is LEFT of paddock (x<0.107)
    var raw=[
      // Left straight -- x=m=CW*0.095 stays OUTSIDE paddock left edge (0.107)
      {x:m,         y:CH*0.54},   // bottom left straight
      {x:m,         y:CH*0.40},   // mid left (y=0.40 inside paddock y-range but x=m<0.107 SAFE)
      {x:m,         y:CH*0.16},   // above paddock top (y=0.21)
      {x:m,         y:m},         // top-left corner
      // Top V section
      {x:CW*0.36,   y:m},         // top-left approach
      {x:CW*0.44,   y:CH*0.24},   // V left descent
      {x:CW*0.50,   y:CH*0.33},   // V bottom
      {x:CW*0.56,   y:CH*0.24},   // V right ascent
      {x:CW*0.64,   y:m},         // top-right approach
      // Right section
      {x:CW-m,      y:m},         // top-right corner
      {x:CW-m,      y:CH*0.30},   // right straight top
      {x:CW-m,      y:CH*0.60},   // right straight bottom
      {x:CW*0.75,   y:CH*0.72},   // right curve exit
      // Bottom section
      {x:CW*0.62,   y:CH-m},      // bottom-right
      {x:CW*0.50,   y:CH-m},      // bottom center
      {x:CW*0.38,   y:CH-m},      // bottom-left
      {x:CW*0.25,   y:CH*0.72},   // left curve
      {x:m,         y:CH*0.62},   // rejoin left straight (y=0.62 > 0.43 = below paddock)
    ];
    var N=30; _racingPath=[];
    for(var i=0;i<raw.length;i++){
      var a=raw[i], b=raw[(i+1)%raw.length];
      for(var j=0;j<N;j++){ var tk=j/N; _racingPath.push({x:a.x+(b.x-a.x)*tk, y:a.y+(b.y-a.y)*tk}); }
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
  function gridPlayer(){ var TW=TrackV3.TW, m=TW*0.85, CH=canvas.height; return{x:m+TW*0.25, y:CH*0.50}; }
  function gridEnemy() { var TW=TrackV3.TW, m=TW*0.85, CH=canvas.height; return{x:m+TW*0.60, y:CH*0.56}; }

  // -- RESIZE ---------------------------------------------------------------
  function resize(){
    var wrap=canvas.parentElement;
    canvas.width =Math.max(wrap.offsetWidth-170,320);
    canvas.height=Math.max(wrap.offsetHeight,280);
    TrackV3.init(canvas.width,canvas.height);
    buildRacingPath();
    var gp=gridPlayer(), ge=gridEnemy();
    Physics.reset(gp.x,gp.y,'asfalto'); Yuki.resetAnim();
    gs.respawn={x:gp.x,y:gp.y};
    enemyPhys.reset(ge.x,ge.y,'asfalto'); RacerX.resetAnim();
    enemyLastOnTrack=null; enemyRespawnPending=null;
  }
  window.addEventListener('resize',resize);
  setTimeout(resize,80);

  // -- START -----------------------------------------------------------------
  function startGame(){
    SoundEngine.resume(); RacerX.initSound();
    // -- Pregame animation (if available) --
    if(typeof PregameAnim !== 'undefined' && !window._pregameShown){
      window._pregameShown = true;
      var pid = localStorage.getItem('caprush_pilot')||'YUKI';
      var _pm = {YUKI:{color:'#00E5FF',kanji:'\u96EA'},KENTA:{color:'#FF9900',kanji:'\u9B54'}};
      var ps  = _pm[pid]||_pm.YUKI;
      var _pimgs={YUKI:'client/public/assets/images/yuki-piloto.png',KENTA:'client/public/assets/images/kenta-piloto.png'};
      PregameAnim.show({
        track:'CAPRUSH -- PISTA ORIGINAL',
        p1name:pid, p1color:ps.color, p1kanji:ps.kanji, p1img:_pimgs[pid]||_pimgs.YUKI,
        p2name:'RACER-D', p2color:'#FF2A2A', p2kanji:'?', p2img:'client/public/assets/images/racer-x-piloto.png',
        mode:'SOLO vs IA'
      }, function(){
        overlay.style.display='none'; gs.phase='AIM';
        if(gs.t0===0) gs.t0=performance.now();
      });
      return; // wait for animation callback
    }
    overlay.style.display='none'; gs.phase='AIM';
    if(canvas.width<50) resize();
    var gp=gridPlayer();
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
    var info=Physics.flick(gs.ds,cpos(e),Yuki.M.spd);
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
    Physics.flick(gs.ds,cpos(e.changedTouches[0]),Yuki.M.spd);
    gs.ds=null;gs.dc=null;gs.phase='MOVING';
    if(!gs.t0){gs.t0=performance.now();gs.lapStart=gs.t0;}
    elFBar.style.height='0%';elFVal.textContent='0%';
  },{passive:true});

  // -- LOOP ------------------------------------------------------------------
  function loop(now){
    var dt=Math.min((now-lt)/1000,0.05);lt=now;animT+=dt;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width,canvas.height);

    var ph =Physics.step(dt,bnd());
    var eph=enemyPhys.step(dt,bnd());

    // Colisao player x Racer-X
    var cdx=eph.pos.x-ph.pos.x,cdy=eph.pos.y-ph.pos.y,cdst=Math.sqrt(cdx*cdx+cdy*cdy);
    if(cdst>0.5&&cdst<CAP_R*2){
      var cnx=cdx/cdst,cny=cdy/cdst,overlap=CAP_R*2-cdst;
      var eps=enemyPhys.snap();
      enemyPhys.reset(eps.pos.x+cnx*overlap*0.6,eps.pos.y+cny*overlap*0.6,'asfalto');
      var pv0n=ph.vel.x*cnx+ph.vel.y*cny,ev0n=eph.vel.x*cnx+eph.vel.y*cny;
      if(pv0n-ev0n>0){
        Physics.setVel(ph.vel.x-(pv0n-ev0n)*cnx*0.85,ph.vel.y-(pv0n-ev0n)*cny*0.85);
        enemyPhys.setVel(eph.vel.x+(pv0n-ev0n)*cnx*0.85,eph.vel.y+(pv0n-ev0n)*cny*0.85);
      }
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
      var obs=TrackV3.checkObstacles(ph.pos,CAP_R);
      if(obs){var rest=obs.elastic?1.15:0.72;Physics.bounce(obs.nx,obs.ny,rest);SoundEngine.hit();log(t('game_hit_obs','Bateu em obstaculo!'));if(obs.elastic){spawnSparks(ph.pos.x,ph.pos.y,ph.vel.x,ph.vel.y,10);}ph=Physics.step(0,bnd());}
      // Pothole
      if(TrackV3.checkPothole){var pot=TrackV3.checkPothole(ph.pos,CAP_R);if(pot){Physics.reset(pot.x,pot.y,'asfalto');log('Buraco! Tampinha parou!','ev');SoundEngine.hit();spawnSparks(pot.x,pot.y,0,0,8);}}
      var stand=TrackV3.checkStands(ph.pos,CAP_R);
      if(stand){Physics.bounce(stand.nx,stand.ny,0.72);SoundEngine.hit();log(t('game_stand','Arquibancada! Ricochete!'),'ev');ph=Physics.step(0,bnd());}
      var pdk=TrackV3.checkPaddock(ph.pos,CAP_R);
      if(pdk){skipTurn=true;SoundEngine.hit();log(t('game_paddock','Foi para o BOX! Perdeu turno!'),'ev');ph=Physics.step(0,bnd());}

      if(TrackV3.isOnTrack(ph.pos)){
        var n2=Date.now();
        if(TrackV3.detectPuddle(ph.pos)){Physics.setSurface('agua');if(n2-sndTimer.water>700){SoundEngine.splash();sndTimer.water=n2;}}
        else if(TrackV3.detectSand&&TrackV3.detectSand(ph.pos)){Physics.setSurface('areia');if(n2-sndTimer.grass>600){SoundEngine.drag('areia',ph.speed||0);sndTimer.grass=n2;}}
        else if(TrackV3.detectGrassOnTrack(ph.pos)){Physics.setSurface('grama');if(n2-sndTimer.grass>900){SoundEngine.grass();sndTimer.grass=n2;}}
        else Physics.setSurface('asfalto');
      } else {
        // Cooldown anti-loop: evita respawn infinito quando dois jogadores
        // ficam juntos fora da pista (bug do loop de grama reportado)
        if(Date.now()>gs.respawnCooldown){
          var inner=TrackV3.detectInner(ph.pos);
          if(inner){
            var rp=gs.respawn||TrackV3.getStartPos();
            gs.respawnPending={x:rp.x,y:rp.y};
            gs.respawnCooldown=Date.now()+1500;  // 1.5s de cooldown
            log(t('game_offtrack','Voltando ao CP'));
          }
        }
      }

      TrackV3.checkCP(ph.pos,function(c){
        gs.cp++; gs.respawn={x:c.x,y:c.y};
        elCp.textContent=gs.cp+'/'+NCPS;
        SoundEngine.checkpoint(); log(t('game_checkpoint','Checkpoint!'),'ev');
      });

      if(gs.cp>=NCPS&&TrackV3.checkLap(ph.pos)){
        // -- MELHOR VOLTA ----------------------------------------
        var lapTime=(performance.now()-gs.lapStart)/1000;
        if(!gs.best||lapTime<gs.best){
          gs.best=lapTime;
          elBest.textContent=fmt(gs.best);
        }
        gs.lapStart=performance.now();
        // --------------------------------------------------------
        gs.lap++; gs.cp=0; TrackV3.resetCPs();
        elLap.textContent=gs.lap+'/'+LAPS;
        log(t('game_lap_label','Volta')+' '+gs.lap,'lap');
        if(gs.lap>LAPS){gs.phase='FINISH';onFinish();}
      }

      gs.elapsed=(performance.now()-gs.t0)/1000; updHUD();

      if(!ph.moving){
        gs.phase='ENEMY_AIM';
        log(skipTurn?t('game_turn_lost','Turno perdido! Vez de Racer-X.'):t('game_enemy_turn','Turno de Racer-X'),'ev');
        if(skipTurn) skipTurn=false;
      }
    }

    if(gs.respawnPending){Physics.reset(gs.respawnPending.x,gs.respawnPending.y,'asfalto');gs.respawnPending=null;}

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
      // Racer-X fora da pista: respawn com cooldown anti-loop
      if(!TrackV3.isOnTrack(eph.pos)&&!enemyRespawnPending&&Date.now()>enemyRespawnCooldown){
        var eRp=enemyLastOnTrack||gridEnemy();
        enemyRespawnPending={x:eRp.x,y:eRp.y};
        enemyRespawnCooldown=Date.now()+1500;
        enemyPhys.setVel(0,0); eph=enemyPhys.snap();
      }
    }
    if(enemyRespawnPending){enemyPhys.reset(enemyRespawnPending.x,enemyRespawnPending.y,'asfalto');enemyRespawnPending=null;eph=enemyPhys.snap();}

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

    // -- Racer-X: ENEMY_AIM ------------------------------------
    gs._enemyStuckFrames=(gs._enemyStuckFrames||0);
    if(gs.phase==='ENEMY_AIM'&&_racingPath.length>0){
      var eClosest=findClosestWaypoint(eph.pos);
      var df=getDiff();
      var la=df.lookahead;
      var w0=_racingPath[eClosest%_racingPath.length];
      var w10=_racingPath[(eClosest+10)%_racingPath.length];
      var w20=_racingPath[(eClosest+20)%_racingPath.length];
      var d0x=w10.x-w0.x,d0y=w10.y-w0.y,d1x=w20.x-w10.x,d1y=w20.y-w10.y;
      var dotLA=d0x*d1x+d0y*d1y,magLA=Math.sqrt((d0x*d0x+d0y*d0y)*(d1x*d1x+d1y*d1y));
      if(magLA>0&&dotLA/magLA<0.5) la=12;
      var eTarget=_racingPath[(eClosest+la)%_racingPath.length];
      // Obstacle avoidance: check target AND midpoint of trajectory
      var _hitR = CAP_R*(DIFFICULTY===3 ? 4.5 : 3.5);
      var _midPt = {x:(eph.pos.x+eTarget.x)/2, y:(eph.pos.y+eTarget.y)/2};
      var _blocked = TrackV3.checkObstacles({x:eTarget.x,y:eTarget.y},_hitR)
                  || TrackV3.checkObstacles(_midPt, _hitR);
      if(_blocked){
        var _skip = df.obsSkip||6;
        var _found = false;
        for(var _sk=la+_skip; _sk<=la+_skip*5; _sk+=_skip){
          var _alt=_racingPath[(eClosest+_sk)%_racingPath.length];
          var _altMid={x:(eph.pos.x+_alt.x)/2,y:(eph.pos.y+_alt.y)/2};
          if(!TrackV3.checkObstacles({x:_alt.x,y:_alt.y},_hitR)
          && !TrackV3.checkObstacles(_altMid,_hitR)){
            eTarget=_alt; _found=true; break;
          }
        }
        // Hard fallback: take next waypoint regardless
        if(!_found && DIFFICULTY===3){
          eTarget=_racingPath[(eClosest+la+2)%_racingPath.length];
        }
      }
      var eDir=new Vector2D(eTarget.x-eph.pos.x,eTarget.y-eph.pos.y).normalize();
      var eDist=eph.pos.distanceTo(eTarget);
      // Hard: boost speed on straights (high dot product = low curvature)
      var _straightBoost=(DIFFICULTY===3&&dotLA/Math.max(magLA,0.001)>0.85)?1.12:1.0;
      var eSpeed=Math.min(560,Math.max(380,eDist*4.2))*df.speedMult*_straightBoost;
      var noise=1+(Math.random()-0.5)*df.noise;
      enemyPhys.setVel(eDir.x*eSpeed*noise,eDir.y*eSpeed*noise);
      eph=enemyPhys.snap(); // re-snap ESSENCIAL (moving=true antes do check de parada)
      gs.phase='ENEMY_MOVING';
    }
    if(gs.phase==='ENEMY_MOVING'){
      gs.elapsed=(performance.now()-gs.t0)/1000; updHUD();
      gs._enemyStuck=(gs._enemyStuck||0)+1;
      if(gs._enemyStuck>280){ gs.phase='AIM'; gs._enemyStuck=0; log('Sua vez','ev'); }
      else if(!eph.moving){gs._enemyStuck=0;gs.phase='AIM';log(t('game_your_turn','Sua vez'),'ev');}
    }

    // -- RENDER ------------------------------------------------
    Yuki.render(ctx,ph,dt);
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
      var pdx=p.x-_capPos.x,pdy=p.y-_capPos.y;
      if(Math.sqrt(pdx*pdx+pdy*pdy)<p.r+CAP_R){
        var pn=new Vector2D(pdx,pdy).normalize();
        var hitPow=Math.max(200,ph.speed*0.55+160);
        Physics.setVel(pn.x*hitPow,pn.y*hitPow);
        spawnSparks(p.x,p.y,p.vx*0.3,p.vy*0.3,18);
        SoundEngine.hit();
        log('? PROJETIL! Ricochete!','ev');
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
    postScore('Yuki',tT);
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
    var gp=gridPlayer(),ge=gridEnemy();
    Physics.reset(gp.x,gp.y,'asfalto');
    enemyPhys.reset(ge.x,ge.y,'asfalto');
    Yuki.resetAnim(); RacerX.resetAnim();
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
    fetch(SURL,{method:'POST',headers:{'Content-Type':'application/json','apikey':SKEY,'Authorization':'Bearer '+SKEY,'Prefer':'return=minimal'},
      body:JSON.stringify({wallet:nick,nickname:nick,pilot:p,time_ms:Math.round(tT*1000),launches:0,mode:'solo'})
    }).then(function(r){log(r.ok?'Score salvo!':'Erro ao salvar.','ev');}).catch(function(){log('Sem conexao.');});
  }

  requestAnimationFrame(function(t2){lt=t2;requestAnimationFrame(loop);});
})();
