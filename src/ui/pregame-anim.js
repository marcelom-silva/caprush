// pregame-anim.js v2 — CapRush Overdrive!
// Exibe foto real do piloto + anel de tampinha animado antes de cada corrida

var PregameAnim = (function(){
  'use strict';

  // Fallback images if none passed in opts
  // Marco 2.9.2: paths absolutos (sobrevivem a qualquer reorganização)
  var PILOT_FALLBACK = {
    YUKI:     '/assets/images/pilots/yuki-piloto.png',
    KENTA:    '/assets/images/pilots/kenta-piloto.png',
    'RACER-D':'/assets/images/pilots/racer-x-piloto.png',
  };

  function resolveImg(name, explicitImg){
    // Use explicit path if provided (caller knows the correct relative path)
    if(explicitImg) return explicitImg;
    return PILOT_FALLBACK[name] || PILOT_FALLBACK['RACER-D'];
  }

  // Draw the animated metallic cap ring (teeth + spokes, no fill) on canvas
  function drawCapRing(ctx, cx, cy, R, color, rot){
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);

    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur  = 18;

    // 21 teeth ring
    var TEETH = 21;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 3;
    ctx.beginPath();
    for(var k = 0; k <= TEETH * 2; k++){
      var a  = (k / (TEETH * 2)) * Math.PI * 2;
      var rr = (k % 2 === 0) ? R : R - 5;
      k === 0 ? ctx.moveTo(Math.cos(a)*rr, Math.sin(a)*rr)
              : ctx.lineTo(Math.cos(a)*rr, Math.sin(a)*rr);
    }
    ctx.closePath();
    ctx.stroke();

    // Middle ring
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, R * 0.78, 0, Math.PI * 2);
    ctx.stroke();

    // 6 spokes
    ctx.lineWidth = 1.5;
    for(var s = 0; s < 6; s++){
      var sa = (s / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * R * 0.30, Math.sin(sa) * R * 0.30);
      ctx.lineTo(Math.cos(sa) * R * 0.74, Math.sin(sa) * R * 0.74);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function show(opts, cb){
    var W = window.innerWidth, H = window.innerHeight;

    // ── OVERLAY ──────────────────────────────────────────────────
    var ov = document.createElement('div');
    ov.id = 'pregame-overlay';
    ov.style.cssText = [
      'position:fixed','inset:0','z-index:9999',
      'background:#020208',
      'display:flex','flex-direction:column',
      'align-items:center','justify-content:center',
      'font-family:Bebas Neue,sans-serif',
      'overflow:hidden'
    ].join(';');

    // ── BG RACING LINES ──────────────────────────────────────────
    var bgCanvas = document.createElement('canvas');
    bgCanvas.width = W; bgCanvas.height = H;
    bgCanvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    ov.appendChild(bgCanvas);
    var bgCtx = bgCanvas.getContext('2d');
    var lines = [];
    for(var li = 0; li < 14; li++){
      var ang = Math.random() * Math.PI * 2;
      lines.push({
        x:Math.random()*W, y:Math.random()*H,
        vx:Math.cos(ang)*3, vy:Math.sin(ang)*3,
        len:80+Math.random()*180,
        color:['#FF4400','#FF6600','#FF8800','#FFD700'][li%4],
        alpha:.07+Math.random()*.14
      });
    }

    // ── CONTENT WRAPPER ───────────────────────────────────────────
    var wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;z-index:2;text-align:center;width:100%;';

    // Track label
    var trackLabel = document.createElement('div');
    trackLabel.style.cssText = 'font-size:.8rem;letter-spacing:5px;color:#FF4400;text-transform:uppercase;margin-bottom:10px;opacity:0;transition:opacity .5s';
    trackLabel.textContent = opts.track || 'TRACK';
    wrap.appendChild(trackLabel);

    // Mode label
    var modeLabel = document.createElement('div');
    modeLabel.style.cssText = 'font-size:.65rem;letter-spacing:4px;color:#555;text-transform:uppercase;margin-bottom:32px;opacity:0;transition:opacity .5s';
    modeLabel.textContent = opts.mode || 'SOLO';
    wrap.appendChild(modeLabel);

    // ── PILOTS ROW ────────────────────────────────────────────────
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:40px;margin-bottom:30px;';

    function makePilotCard(name, color, imgSrc, side){
      var card = document.createElement('div');
      card.style.cssText = [
        'text-align:center',
        'opacity:0',
        'transition:opacity .6s ease, transform .6s ease',
        'transform:translateX('+(side < 0 ? '-40px' : '40px')+')',
      ].join(';');

      // Outer container — contains photo + cap ring overlay
      var frame = document.createElement('div');
      frame.style.cssText = [
        'position:relative',
        'width:160px','height:160px',
        'margin:0 auto 14px',
      ].join(';');

      // Photo circle (background)
      var photoWrap = document.createElement('div');
      photoWrap.style.cssText = [
        'position:absolute','inset:0',
        'border-radius:50%',
        'overflow:hidden',
        'background:#0A0A0F',
        'border:3px solid '+color,
        'box-shadow:0 0 30px '+color+',0 0 60px rgba(0,0,0,.8)',
      ].join(';');

      var img = document.createElement('img');
      img.src = imgSrc;
      img.style.cssText = [
        'width:100%','height:115%',   // slightly taller to allow top crop
        'object-fit:cover',
        'object-position:50% 8%',     // top-aligned: shows head to chest
        'filter:drop-shadow(0 4px 12px rgba(0,0,0,.95))',
        'transform:scale(1.08)',       // slight zoom to fill circle nicely
        'transform-origin:50% 12%',
      ].join(';');

      // Gradient overlay (bottom fade to black for name readability)
      var grad = document.createElement('div');
      grad.style.cssText = [
        'position:absolute','inset:0','border-radius:50%',
        'background:linear-gradient(180deg,rgba(0,0,0,.0) 40%,rgba(0,0,0,.65) 100%)',
      ].join(';');

      photoWrap.appendChild(img);
      photoWrap.appendChild(grad);
      frame.appendChild(photoWrap);

      // Cap ring canvas — overlaid on photo
      var ringCanvas = document.createElement('canvas');
      ringCanvas.width = 180;
      ringCanvas.height = 180;
      ringCanvas.style.cssText = [
        'position:absolute',
        'top:-10px','left:-10px',
        'width:180px','height:180px',
        'pointer-events:none',
      ].join(';');
      frame.appendChild(ringCanvas);

      var rCtx = ringCanvas.getContext('2d');
      var rot = 0;
      (function animRing(){
        if(!document.getElementById('pregame-overlay')) return;
        rCtx.clearRect(0, 0, 180, 180);
        drawCapRing(rCtx, 90, 90, 84, color, rot);
        rot += 0.018;
        requestAnimationFrame(animRing);
      })();

      card.appendChild(frame);

      // Pilot name
      var nameEl = document.createElement('div');
      nameEl.style.cssText = 'font-size:1.6rem;letter-spacing:4px;color:'+color+';text-shadow:0 0 20px '+color;
      nameEl.textContent = name;
      card.appendChild(nameEl);

      // Color accent bar
      var bar = document.createElement('div');
      bar.style.cssText = 'width:60px;height:2px;background:'+color+';margin:6px auto 0;border-radius:2px;box-shadow:0 0 8px '+color;
      card.appendChild(bar);

      return card;
    }

    var p1card = makePilotCard(
      opts.p1name || 'YUKI',
      opts.p1color || '#00E5FF',
      resolveImg(opts.p1name || 'YUKI', opts.p1img),
      -1
    );
    row.appendChild(p1card);

    // VS
    var vsEl = document.createElement('div');
    vsEl.style.cssText = [
      'font-size:3rem;letter-spacing:6px',
      'background:linear-gradient(135deg,#FF2A2A,#FFD700)',
      '-webkit-background-clip:text','-webkit-text-fill-color:transparent',
      'opacity:0;transition:opacity .4s',
      'text-shadow:none',
      'flex-shrink:0',
    ].join(';');
    vsEl.textContent = 'VS';
    row.appendChild(vsEl);

    if(opts.p2name){
      var p2card = makePilotCard(
        opts.p2name,
        opts.p2color || '#FF9900',
        resolveImg(opts.p2name, opts.p2img),
        1
      );
      row.appendChild(p2card);
    }

    wrap.appendChild(row);

    // ── COUNTDOWN ─────────────────────────────────────────────────
    var countdown = document.createElement('div');
    countdown.style.cssText = [
      'font-size:6rem;letter-spacing:8px',
      'background:linear-gradient(135deg,#FF2A2A,#FFD700)',
      '-webkit-background-clip:text','-webkit-text-fill-color:transparent',
      'min-height:100px;line-height:1',
      'transition:transform .18s ease, opacity .18s ease',
      'opacity:0',
    ].join(';');
    countdown.textContent = '3';
    wrap.appendChild(countdown);

    var hint = document.createElement('div');
    hint.style.cssText = 'font-size:.65rem;letter-spacing:4px;color:#333;margin-top:14px;opacity:0;transition:opacity .3s';
    hint.textContent = 'PREPARE-SE';
    wrap.appendChild(hint);

    ov.appendChild(wrap);
    document.body.appendChild(ov);

    // ── BG ANIMATION ─────────────────────────────────────────────
    var bgTimer = setInterval(function(){
      bgCtx.fillStyle = 'rgba(2,2,8,.20)';
      bgCtx.fillRect(0, 0, W, H);
      lines.forEach(function(l){
        bgCtx.save();
        bgCtx.globalAlpha = l.alpha;
        bgCtx.strokeStyle = l.color;
        bgCtx.lineWidth   = 1.5;
        bgCtx.shadowColor = l.color;
        bgCtx.shadowBlur  = 6;
        bgCtx.beginPath();
        bgCtx.moveTo(l.x, l.y);
        bgCtx.lineTo(l.x - l.vx * l.len, l.y - l.vy * l.len);
        bgCtx.stroke();
        bgCtx.restore();
        l.x += l.vx; l.y += l.vy;
        if(l.x < -250 || l.x > W+250 || l.y < -250 || l.y > H+250){
          l.x = Math.random()*W; l.y = Math.random()*H;
        }
      });
    }, 16);

    // ── REVEAL SEQUENCE ──────────────────────────────────────────
    setTimeout(function(){ trackLabel.style.opacity = '1'; modeLabel.style.opacity = '1'; hint.style.opacity = '1'; }, 80);

    setTimeout(function(){
      p1card.style.opacity  = '1';
      p1card.style.transform = 'translateX(0)';
      vsEl.style.opacity   = '1';
      if(opts.p2name){
        setTimeout(function(){
          p2card.style.opacity   = '1';
          p2card.style.transform = 'translateX(0)';
        }, 200);
      }
    }, 400);

    setTimeout(function(){ countdown.style.opacity = '1'; }, 800);

    // ── COUNTDOWN TICK ────────────────────────────────────────────
    function tick(n){
      countdown.textContent = n > 0 ? String(n) : 'GO!';
      countdown.style.transform = 'scale(1.35)';
      setTimeout(function(){ countdown.style.transform = 'scale(1)'; }, 200);
      if(n > 0){
        setTimeout(function(){ tick(n - 1); }, 900);
      } else {
        setTimeout(function(){
          clearInterval(bgTimer);
          ov.style.transition = 'opacity .35s ease';
          ov.style.opacity    = '0';
          setTimeout(function(){
            if(ov.parentNode) ov.parentNode.removeChild(ov);
            if(cb) cb();
          }, 370);
        }, 650);
      }
    }
    setTimeout(function(){ tick(3); }, 900);
  }

  return { show: show };
})();
