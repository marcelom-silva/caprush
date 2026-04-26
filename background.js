// background.js v3 — CapRush Overdrive!
// Tampinhas estilo Tron: Legacy — rastros somem ao parar, performance otimizada
(function(){
  'use strict';

  var canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.style.cssText = [
    'position:fixed','inset:0','width:100%','height:100%',
    'z-index:-1','pointer-events:none','opacity:0.55'
  ].join(';');

  document.addEventListener('DOMContentLoaded', function(){
    document.body.insertBefore(canvas, document.body.firstChild);
    resize();
    loop();
  });

  var ctx = canvas.getContext('2d');
  var W, H;
  var caps = [];
  var NUM_CAPS = 10;          // menos caps → menos CPU
  var t = 0;
  var lastTime = 0;

  // Orange/red neon — no blue
  var PALETTE = [
    '#FF4400','#FF6200','#FF8800','#FFAA00','#FFD700',
    '#FF2200','#FF5500','#CC3300','#FF9900','#FFCC00'
  ];

  function resize(){
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    caps = [];
    for(var i = 0; i < NUM_CAPS; i++) caps.push(makeCap(false));
  }
  window.addEventListener('resize', function(){
    clearTimeout(resize._t);
    resize._t = setTimeout(resize, 200); // debounce
  });

  function rand(a,b){ return a + Math.random()*(b-a); }
  function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

  // Grid-aligned angles (Tron feel)
  function randAngle(){
    var angles = [0, Math.PI*.25, Math.PI*.5, Math.PI*.75,
                  Math.PI, Math.PI*1.25, Math.PI*1.5, Math.PI*1.75];
    return pick(angles) + rand(-0.15, 0.15);
  }

  function makeCap(fromEdge){
    var r   = rand(6, 16);
    var spd = rand(0.5, 1.2);
    var ang = randAngle();
    var x, y;
    if(fromEdge){
      var edge = Math.floor(rand(0,4));
      if(edge===0){ x=rand(0,W); y=-r-5; }
      else if(edge===1){ x=W+r+5; y=rand(0,H); }
      else if(edge===2){ x=rand(0,W); y=H+r+5; }
      else{ x=-r-5; y=rand(0,H); }
    } else {
      x = rand(0,W); y = rand(0,H);
    }
    return {
      x:x, y:y, r:r,
      vx: Math.cos(ang)*spd,
      vy: Math.sin(ang)*spd,
      color: pick(PALETTE),
      rot: Math.random()*Math.PI*2,
      rotV: rand(-0.006, 0.006),
      // Trail state
      trailOn: false,
      trailCooldown: Math.floor(rand(60, 240)),
      trailLen: Math.floor(rand(300, 700)),
      trailTimer: 0,
      trailBoostSpd: rand(2.0, 4.5),
      trailPoints: [],     // trail owned by cap, not global array
      pulse: Math.random()*Math.PI*2,
      pulseV: rand(0.02, 0.045)
    };
  }

  // Draw cap outline (no shadowBlur on idle caps — expensive)
  function drawCap(c){
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.globalAlpha = 0.65;

    if(c.trailOn){
      ctx.shadowColor = c.color;
      ctx.shadowBlur  = 10;
    }

    // Teeth (21)
    var TEETH = 21;
    ctx.strokeStyle = c.color;
    ctx.lineWidth   = 1.4;
    ctx.beginPath();
    for(var k=0; k<=TEETH*2; k++){
      var a  = (k/(TEETH*2))*Math.PI*2;
      var rr = (k%2===0) ? c.r : c.r-2.2;
      k===0 ? ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr)
            : ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(0,0,c.r*0.62,0,Math.PI*2);
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // Center dot (bright when trailing)
    ctx.beginPath();
    ctx.arc(0,0,c.r*0.16,0,Math.PI*2);
    ctx.fillStyle = c.trailOn ? '#FFFFFF' : c.color;
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Draw trail directly from cap's point array — no object allocation
  // RULE: only draw if cap is currently trailing (trailOn=true)
  // When trail turns off, points are cleared immediately
  function drawTrail(c){
    var pts = c.trailPoints;
    var n   = pts.length;
    if(n < 2) return;

    ctx.save();
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    var hw = c.r * 0.38;

    // Single pass — 2 layers only (glow wide + thin bright)
    for(var i = 1; i < n; i++){
      var prog = i / n; // 0=tail, 1=head

      // Wide soft glow
      ctx.beginPath();
      ctx.moveTo(pts[i-1].x, pts[i-1].y);
      ctx.lineTo(pts[i].x,   pts[i].y);
      ctx.strokeStyle = c.color;
      ctx.lineWidth   = hw*2.2;
      ctx.globalAlpha = prog * 0.12;
      ctx.stroke();

      // Thin bright core
      ctx.beginPath();
      ctx.moveTo(pts[i-1].x, pts[i-1].y);
      ctx.lineTo(pts[i].x,   pts[i].y);
      ctx.lineWidth   = hw*0.5;
      ctx.globalAlpha = prog * 0.90;
      ctx.stroke();
    }

    // Head flash (small bright dot)
    var head = pts[n-1];
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur  = 14;
    ctx.fillStyle   = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(head.x, head.y, hw*0.55, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  // Background fade — one fillRect per frame (cheap)
  function fadeBg(){
    ctx.fillStyle = 'rgba(2,2,8,0.28)';
    ctx.fillRect(0,0,W,H);
  }

  function loop(now){
    requestAnimationFrame(loop);

    // Throttle to ~40 fps on background tab, full speed on active
    if(now - lastTime < 20){ return; }  // skip frame if < 20ms
    lastTime = now;
    t++;

    fadeBg();

    for(var j=0; j<caps.length; j++){
      var c = caps[j];

      // Move
      c.x += c.vx;
      c.y += c.vy;
      c.rot += c.rotV;
      c.pulse += c.pulseV;

      // Trail state machine
      if(!c.trailOn){
        // Idle drift
        c.trailCooldown--;
        if(c.trailCooldown <= 0){
          // Activate — pick clean direction
          c.trailOn    = true;
          c.trailTimer = c.trailLen;
          c.trailPoints = [];
          var ang2 = randAngle();
          c.vx = Math.cos(ang2)*c.trailBoostSpd;
          c.vy = Math.sin(ang2)*c.trailBoostSpd;
        }
      } else {
        // Build trail
        c.trailTimer--;

        // Add point every 2 frames
        if(t % 2 === 0){
          c.trailPoints.push({x:c.x, y:c.y});
          // Keep max 350 points (trail length)
          if(c.trailPoints.length > 350) c.trailPoints.shift();
        }

        // Draw active trail
        drawTrail(c);

        if(c.trailTimer <= 0){
          // STOP: clear trail immediately — Tron style (trail vanishes when bike stops)
          c.trailOn     = false;
          c.trailPoints = [];           // ← instant erase
          c.trailCooldown = Math.floor(rand(90, 360));
          c.trailLen      = Math.floor(rand(300, 700));
          c.trailBoostSpd = rand(2.0, 4.5);
          // Back to slow drift
          var driftAng = Math.random()*Math.PI*2;
          var driftSpd = rand(0.3, 0.9);
          c.vx = Math.cos(driftAng)*driftSpd;
          c.vy = Math.sin(driftAng)*driftSpd;
        }
      }

      // Out of bounds → respawn from edge
      var pad = c.r + 8;
      if(c.x < -pad || c.x > W+pad || c.y < -pad || c.y > H+pad){
        c.trailOn     = false;
        c.trailPoints = [];
        caps[j] = makeCap(true);
        continue;
      }

      drawCap(c);
    }
  }
})();
