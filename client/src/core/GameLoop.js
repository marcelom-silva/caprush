// GameLoop.js v2 – sons, zonas especiais, respawn, TrackV2
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
  var LAPS=TrackV2.META.voltas, NCPS=3;
  var RADIUS=16;

  var gs={phase:'WAIT',lap:1,cp:0,t0:0,elapsed:0,best:null,ds:null,dc:null,
          lastRespawn:null};

  // sons
  SoundEngine.init();

  function resize(){
    var wrap=canvas.parentElement;
    canvas.width  = Math.max(wrap.offsetWidth - 160, 320);
    canvas.height = Math.max(wrap.offsetHeight, 280);
    TrackV2.init(canvas.width, canvas.height);
    var sp=TrackV2.getStartPos();
    Physics.reset(sp.x, sp.y, 'terra');
    Yuki.resetAnim();
    gs.lastRespawn={x:sp.x,y:sp.y};
  }
  window.addEventListener('resize',resize);
  setTimeout(resize,80);

  // Overlay clique → inicia
  function startGame(){
    SoundEngine.resume();
    overlay.style.display='none';
    gs.phase='AIM';
    if(canvas.width<50) resize();
    var sp=TrackV2.getStartPos();
    Physics.reset(sp.x,sp.y,'terra');
    gs.lastRespawn={x:sp.x,y:sp.y};
  }
  overlay.addEventListener('click',startGame);
  overlay.addEventListener('touchend',function(e){e.preventDefault();startGame();},{passive:false});
  overlay.style.cursor='pointer';

  function cpos(e){var r=canvas.getBoundingClientRect();return new Vector2D(e.clientX-r.left,e.clientY-r.top);}
  function bnd(){return{x:0,y:0,w:canvas.width,h:canvas.height};}

  // Input
  canvas.addEventListener('mousedown',function(e){
    if(gs.phase!=='AIM') return;
    SoundEngine.resume();
    var ph=Physics.step(0,bnd());
    if(cpos(e).distanceTo(ph.pos)<44){gs.ds=cpos(e);gs.dc=cpos(e);}
  });
  canvas.addEventListener('mousemove',function(e){
    if(!gs.ds) return;
    gs.dc=cpos(e);
    var pct=Math.min(gs.ds.sub(gs.dc).magnitude()/Physics.MAX_PX,1);
    elFBar.style.height=(pct*100)+'%'; elFVal.textContent=Math.round(pct*100)+'%';
  });
  canvas.addEventListener('mouseup',function(e){
    if(!gs.ds||gs.phase!=='AIM') return;
    var info=Physics.flick(gs.ds,cpos(e),Yuki.M.spd);
    log('Lancamento '+info.forcePct+'% / '+info.angle.toFixed(0)+'graus','ev');
    gs.ds=null;gs.dc=null;gs.phase='MOVING';
    if(!gs.t0) gs.t0=performance.now();
    elFBar.style.height='0%'; elFVal.textContent='0%';
  });
  canvas.addEventListener('touchstart',function(e){
    if(gs.phase!=='AIM') return; SoundEngine.resume();
    var ph=Physics.step(0,bnd());
    if(cpos(e.touches[0]).distanceTo(ph.pos)<44){gs.ds=cpos(e.touches[0]);gs.dc=cpos(e.touches[0]);}
  },{passive:true});
  canvas.addEventListener('touchmove',function(e){
    e.preventDefault();if(!gs.ds) return;
    gs.dc=cpos(e.touches[0]);
    var pct=Math.min(gs.ds.sub(gs.dc).magnitude()/Physics.MAX_PX,1);
    elFBar.style.height=(pct*100)+'%'; elFVal.textContent=Math.round(pct*100)+'%';
  },{passive:false});
  canvas.addEventListener('touchend',function(e){
    if(!gs.ds||gs.phase!=='AIM') return;
    var info=Physics.flick(gs.ds,cpos(e.changedTouches[0]),Yuki.M.spd);
    gs.ds=null;gs.dc=null;gs.phase='MOVING';
    if(!gs.t0) gs.t0=performance.now();
    elFBar.style.height='0%'; elFVal.textContent='0%';
  },{passive:true});

  var lt=0, animT=0;
  function loop(now){
    var dt=Math.min((now-lt)/1000,0.05); lt=now; animT+=dt;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    TrackV2.render(ctx,canvas.width,canvas.height,animT);

    var ph=Physics.step(dt,bnd());

    // Detectar colisão com obstáculos
    if(ph.moving){
      var obs=TrackV2.checkObstacles(ph.pos, RADIUS);
      if(obs){
        // Ricochete: reflete velocidade na normal do obstáculo
        var dot=ph.vel.x*obs.nx+ph.vel.y*obs.ny;
        ph.vel.x=(ph.vel.x-2*dot*obs.nx)*0.85;
        ph.vel.y=(ph.vel.y-2*dot*obs.ny)*0.85;
        Physics.reset(ph.pos.x,ph.pos.y,'terra');
        // aplicar velocidade manualmente
        Physics.flick(
          new Vector2D(ph.pos.x-ph.vel.x*10, ph.pos.y-ph.vel.y*10),
          new Vector2D(ph.pos.x, ph.pos.y), 1
        );
        SoundEngine.hit();
        log('Bateu em obstaculo!','ev');
      }
    }

    // Detectar zona especial
    var zone=TrackV2.detectZone(ph.pos);
    if(zone){
      var rp=TrackV2.respawnPos(TrackV2.getStartPos());
      Physics.reset(rp.x,rp.y,'terra');
      log('Zona '+zone+' – voltando ao ultimo CP');
    }

    // Detectar superfície
    var surf=TrackV2.detectSurface(ph.pos);
    if(surf==='water'){
      Physics.reset(ph.pos.x,ph.pos.y,'areia'); // areia = mais arrasto
      var now2=Date.now();
      if(now2-_lastSnd.water>600){ SoundEngine.splash(); _lastSnd.water=now2; }
    } else if(surf==='grasszone'){
      Physics.reset(ph.pos.x,ph.pos.y,'asfalto'); // asfalto = menos arrasto (escorrega)
      var now3=Date.now();
      if(now3-_lastSnd.grass>800){ SoundEngine.grass(); _lastSnd.grass=now3; }
    }

    Yuki.render(ctx,ph,dt);
    if(gs.ds&&gs.dc) drawAim(ph.pos,gs.dc);

    if(gs.phase==='MOVING'){
      gs.elapsed=(performance.now()-gs.t0)/1000; updHUD();
      if(!ph.moving){ gs.phase='AIM'; log('Tampinha parou – mire novamente'); }

      var hit=TrackV2.checkCP(ph.pos,function(){
        SoundEngine.checkpoint();
      });
      if(hit){
        gs.cp++; elCp.textContent=gs.cp+'/'+NCPS;
        log(hit.lbl+' ativado!','ev');
        gs.lastRespawn={x:hit.x,y:hit.y};
      }
      if(gs.cp>=NCPS&&TrackV2.checkLap(ph.pos)) onLap();
    }
    requestAnimationFrame(loop);
  }

  var _lastSnd={water:0,grass:0};

  function onLap(){
    gs.cp=0; TrackV2.resetCPs();
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
    },1800);
  }
  function restart(){
    overlay.style.display='none';
    TrackV2.resetCPs();
    var sp=TrackV2.getStartPos();
    Physics.reset(sp.x,sp.y,'terra');
    Yuki.resetAnim();
    gs={phase:'AIM',lap:1,cp:0,t0:performance.now(),elapsed:0,best:gs.best,ds:null,dc:null,lastRespawn:{x:sp.x,y:sp.y}};
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
    var p=document.createElement('p');if(cls)p.className=cls;
    p.textContent=msg;logBox.insertBefore(p,logBox.firstChild);
    while(logBox.children.length>30)logBox.removeChild(logBox.lastChild);
  }
  function drawAim(cap,drag){
    var dir=cap.sub(drag).normalize();
    var dist=Math.min(cap.distanceTo(drag),Physics.MAX_PX);
    var end=cap.add(dir.scale(dist*1.8)),pct=dist/Physics.MAX_PX;
    ctx.save();
    var g=ctx.createLinearGradient(cap.x,cap.y,end.x,end.y);
    g.addColorStop(0,'rgba(0,229,255,'+(0.8+pct*.2)+')');
    g.addColorStop(1,'rgba(0,229,255,0)');
    ctx.strokeStyle=g;ctx.lineWidth=2+pct*2;ctx.setLineDash([8,6]);
    ctx.beginPath();ctx.moveTo(cap.x,cap.y);ctx.lineTo(end.x,end.y);ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();ctx.arc(cap.x,cap.y,20+pct*10,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,215,0,'+(0.3+pct*.4)+')';ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
  }
  function postScore(p,t){
    fetch('http://localhost:5000/api/scores',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({piloto:p,pista:TrackV2.META.nome,tempo:t})
    }).then(function(){log('Score salvo.','ev');}).catch(function(){log('Servidor offline.');});
  }
  requestAnimationFrame(function(t){lt=t;requestAnimationFrame(loop);});
})();
