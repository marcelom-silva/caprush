// GameLoop.js v3 — CapRush Solo
// CORRECAO: ricochete em obstaculos usa reflexao vetorial correta (Physics.bounce)
// NOVO: colisao com stands (ricochet REST=0.72) e paddock (ricochet REST=0.60)
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
    canvas.width  = Math.max(wrap.offsetWidth - 155, 320);
    canvas.height = Math.max(wrap.offsetHeight, 280);
    TrackV3.init(canvas.width, canvas.height);
    var sp=TrackV3.getStartPos();
    Physics.reset(sp.x, sp.y, 'asfalto');
    Yuki.resetAnim();
    gs.respawn={x:sp.x, y:sp.y};
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 80);

  function startGame(){
    SoundEngine.resume();
    overlay.style.display='none';
    gs.phase='AIM';
    if(canvas.width<50) resize();
    var sp=TrackV3.getStartPos();
    Physics.reset(sp.x, sp.y, 'asfalto');
    gs.respawn={x:sp.x, y:sp.y};
  }
  overlay.addEventListener('click',   startGame);
  overlay.addEventListener('touchend',function(e){e.preventDefault();startGame();},{passive:false});

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
    log('Lance: '+info.forcePct+'% / '+info.angle.toFixed(0)+'\u00b0','ev');
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

  function loop(now){
    var dt=Math.min((now-lt)/1000, 0.05); lt=now; animT+=dt;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    TrackV3.render(ctx, canvas.width, canvas.height, animT);

    var ph=Physics.step(dt, bnd());

    if(ph.moving){
      // ── Obstaculos: ricochete correto via reflexao vetorial ──
      var obs=TrackV3.checkObstacles(ph.pos, CAP_R);
      if(obs){
        // FIX v3: usa Physics.bounce com normal do obstaculo (REST=0.72)
        Physics.bounce(obs.nx, obs.ny, 0.72);
        SoundEngine.hit();
        log('Bateu em obstaculo!');
        ph=Physics.step(0, bnd());
      }

      // ── NOVO v3: Arquibancadas — ricochete REST=0.72 ──
      var stand=TrackV3.checkStands(ph.pos, CAP_R);
      if(stand){
        Physics.bounce(stand.nx, stand.ny, 0.72);
        SoundEngine.hit();
        log('Arquibancada! Ricochete!', 'ev');
        ph=Physics.step(0, bnd());
      }

      // ── NOVO v3: Paddock — ricochete REST=0.60 (solo) ──
      var pdk=TrackV3.checkPaddock(ph.pos, CAP_R);
      if(pdk){
        Physics.bounce(pdk.nx, pdk.ny, 0.60);
        SoundEngine.hit();
        log('Paddock! Ricochete!', 'ev');
        ph=Physics.step(0, bnd());
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
        var inner=TrackV3.detectInner(ph.pos);
        if(inner){
          var rp=gs.respawn||TrackV3.getStartPos();
          Physics.reset(rp.x, rp.y, 'asfalto');
          log('Zona '+inner+' \u2014 voltando ao CP');
        }
      }
    }

    Yuki.render(ctx, ph, dt);
    if(gs.ds&&gs.dc) drawAim(ph.pos, gs.dc);

    if(gs.phase==='MOVING'){
      gs.elapsed=(performance.now()-gs.t0)/1000; updHUD();
      if(!ph.moving){ gs.phase='AIM'; log('Parou \u2014 mire novamente'); }
      TrackV3.checkCP(ph.pos, function(c){
        SoundEngine.checkpoint();
        gs.cp++; elCp.textContent=gs.cp+'/'+NCPS;
        gs.respawn={x:c.x, y:c.y};
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
