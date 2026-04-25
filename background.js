// background.js — CapRush Overdrive! Animated Background
// Tampinhas deslizando com rastros estilo Tron — tons laranja/vermelho
(function(){
  'use strict';

  var canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  canvas.style.cssText = [
    'position:fixed','inset:0','width:100%','height:100%',
    'z-index:-1','pointer-events:none','opacity:0.55'
  ].join(';');

  // Insert as first child of body
  document.addEventListener('DOMContentLoaded', function(){
    document.body.insertBefore(canvas, document.body.firstChild);
    resize();
    loop();
  });

  var ctx = canvas.getContext('2d');
  var W, H;
  var caps = [];
  var trails = [];
  var NUM_CAPS = 22;
  var t = 0;

  var PALETTE = [
    '#FF4400','#FF6600','#FF8800','#FFAA00','#FFD700',
    '#FF2200','#DD3300','#FF5500','#CC4400','#FF9900'
  ];

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    caps = [];
    for(var i = 0; i < NUM_CAPS; i++) caps.push(makeCap());
  }
  window.addEventListener('resize', resize);

  function rand(a, b){ return a + Math.random() * (b - a); }
  function pick(arr){ return arr[Math.floor(Math.random() * arr.length)]; }

  function makeCap(forced){
    var r = rand(8, 20);
    return {
      x: forced ? (Math.random() < 0.5 ? -r : W + r) : rand(0, W),
      y: forced ? rand(0, H) : rand(0, H),
      r: r,
      vx: rand(-0.4, 0.4),
      vy: rand(-0.4, 0.4),
      color: pick(PALETTE),
      rot: Math.random() * Math.PI * 2,
      rotV: rand(-0.005, 0.005),
      trailOn: false,
      trailTimer: 0,
      trailCooldown: Math.floor(rand(120, 400)),
      trailLen: Math.floor(rand(80, 220)),
      opacity: rand(0.35, 0.90),
      pulse: Math.random() * Math.PI * 2,
      pulseV: rand(0.02, 0.06)
    };
  }

  function drawCap(c){
    var glow = 0.5 + 0.5 * Math.sin(c.pulse);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.globalAlpha = c.opacity;

    // Shadow glow
    ctx.shadowColor = c.color;
    ctx.shadowBlur = 8 + glow * 12;

    // Outer ring (serrated edge — 21 teeth)
    var TEETH = 21;
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    for(var k = 0; k <= TEETH * 2; k++){
      var a = (k / (TEETH * 2)) * Math.PI * 2;
      var rr = (k % 2 === 0) ? c.r : c.r - 2.2;
      var px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner circle
    ctx.beginPath();
    ctx.arc(0, 0, c.r * 0.70, 0, Math.PI * 2);
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, c.r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = c.color;
    ctx.fill();

    // Radial spokes (3)
    ctx.lineWidth = 0.8;
    for(var s = 0; s < 3; s++){
      var sa = (s / 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * c.r * 0.28, Math.sin(sa) * c.r * 0.28);
      ctx.lineTo(Math.cos(sa) * c.r * 0.65, Math.sin(sa) * c.r * 0.65);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawTrail(trail){
    if(trail.points.length < 2) return;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    var n = trail.points.length;
    for(var i = 1; i < n; i++){
      var prog = i / n;
      var alpha = prog * trail.alpha * 0.85;
      if(alpha < 0.01) continue;
      ctx.beginPath();
      ctx.moveTo(trail.points[i-1].x, trail.points[i-1].y);
      ctx.lineTo(trail.points[i].x, trail.points[i].y);
      ctx.strokeStyle = trail.color;
      ctx.lineWidth = trail.w * prog;
      ctx.globalAlpha = alpha;
      ctx.shadowColor = trail.color;
      ctx.shadowBlur = 8 * prog;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function loop(){
    requestAnimationFrame(loop);
    t++;

    // Fade background
    ctx.fillStyle = 'rgba(2,2,8,0.30)';
    ctx.fillRect(0, 0, W, H);

    // Update trails
    for(var i = trails.length - 1; i >= 0; i--){
      trails[i].alpha -= 0.012;
      if(trails[i].alpha <= 0) trails.splice(i, 1);
      else drawTrail(trails[i]);
    }

    // Update caps
    for(var j = 0; j < caps.length; j++){
      var c = caps[j];
      c.x += c.vx;
      c.y += c.vy;
      c.rot += c.rotV;
      c.pulse += c.pulseV;

      // Trail logic
      if(!c.trailOn){
        c.trailCooldown--;
        if(c.trailCooldown <= 0){
          c.trailOn = true;
          c.trailTimer = c.trailLen;
          // Boost speed for trail
          var spd = rand(1.8, 3.5);
          var ang = Math.atan2(c.vy, c.vx) + rand(-0.5, 0.5);
          c.vx = Math.cos(ang) * spd;
          c.vy = Math.sin(ang) * spd;
          // Start new trail
          trails.push({
            points: [{x: c.x, y: c.y}],
            color: c.color,
            alpha: rand(0.7, 1.0),
            w: c.r * 0.38,
            cap: c
          });
        }
      } else {
        c.trailTimer--;
        // Add point to current trail
        var tr = trails[trails.length - 1];
        if(tr && tr.cap === c) tr.points.push({x: c.x, y: c.y});
        if(c.trailTimer <= 0){
          c.trailOn = false;
          c.trailCooldown = Math.floor(rand(150, 450));
          c.trailLen = Math.floor(rand(80, 240));
          // Reset to normal speed
          var nspd = rand(0.2, 0.5);
          var nang = Math.random() * Math.PI * 2;
          c.vx = Math.cos(nang) * nspd;
          c.vy = Math.sin(nang) * nspd;
        }
      }

      // Wrap / respawn
      var pad = c.r + 10;
      if(c.x < -pad || c.x > W + pad || c.y < -pad || c.y > H + pad){
        var fresh = makeCap(true);
        caps[j] = fresh;
        continue;
      }

      drawCap(c);
    }
  }
})();
