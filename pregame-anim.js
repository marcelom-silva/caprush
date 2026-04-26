// pregame-anim.js — CapRush Overdrive! Pre-game intro animation
// Call: PregameAnim.show(trackName, pilotColor, pilotKanji, opponentColor, opponentKanji, callback)
var PregameAnim = (function(){
  'use strict';

  function show(opts, cb){
    // opts: { track, p1name, p1color, p1kanji, p2name, p2color, p2kanji, mode }
    var overlay = document.createElement('div');
    overlay.id = 'pregame-overlay';
    overlay.style.cssText = [
      'position:fixed','inset:0','z-index:1000',
      'background:#020208',
      'display:flex','flex-direction:column',
      'align-items:center','justify-content:center',
      'font-family:Bebas Neue,sans-serif',
      'overflow:hidden'
    ].join(';');

    // Background canvas (racing lines)
    var bg = document.createElement('canvas');
    bg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    overlay.appendChild(bg);

    // Content
    var content = document.createElement('div');
    content.style.cssText = 'position:relative;z-index:2;text-align:center;';

    // Track badge
    var badge = document.createElement('div');
    badge.style.cssText = 'font-size:.75rem;letter-spacing:4px;color:#FF4400;text-transform:uppercase;margin-bottom:12px;opacity:0;transition:opacity .4s';
    badge.textContent = opts.track || 'TRACK';
    content.appendChild(badge);

    // VS display
    var vsRow = document.createElement('div');
    vsRow.style.cssText = 'display:flex;align-items:center;gap:28px;margin-bottom:18px';

    function makePilotDiv(name, color, kanji){
      var d = document.createElement('div');
      d.style.cssText = 'text-align:center;opacity:0;transition:opacity .5s,transform .5s;';
      var c = document.createElement('canvas');
      c.width = 90; c.height = 90;
      c.style.cssText = 'display:block;margin:0 auto 8px;border-radius:50%;box-shadow:0 0 28px '+color;
      d.appendChild(c);
      var n = document.createElement('div');
      n.style.cssText = 'font-size:1.4rem;letter-spacing:3px;color:'+color;
      n.textContent = name;
      d.appendChild(n);
      // animate cap
      var ctx2 = c.getContext('2d');
      var rot = 0;
      (function aloop(){
        if(!document.getElementById('pregame-overlay')) return;
        ctx2.clearRect(0,0,90,90);
        if(typeof CapSprite !== 'undefined'){
          CapSprite.drawCap(ctx2,45,45,36,color,
            color.replace('FF','AA'), kanji||'●', rot, 80, .8, false);
        } else {
          // Fallback circle
          ctx2.beginPath(); ctx2.arc(45,45,34,0,Math.PI*2);
          ctx2.fillStyle=color; ctx2.globalAlpha=.3; ctx2.fill(); ctx2.globalAlpha=1;
          ctx2.strokeStyle=color; ctx2.lineWidth=3; ctx2.stroke();
          ctx2.fillStyle='#fff'; ctx2.font='bold 24px sans-serif';
          ctx2.textAlign='center'; ctx2.textBaseline='middle';
          ctx2.fillText(kanji||'?',45,45);
        }
        rot += .025;
        requestAnimationFrame(aloop);
      })();
      return d;
    }

    var p1div = makePilotDiv(opts.p1name||'YUKI', opts.p1color||'#00E5FF', opts.p1kanji||'雪');
    vsRow.appendChild(p1div);

    if(opts.p2name){
      var vslbl = document.createElement('div');
      vslbl.style.cssText = 'font-size:2.5rem;letter-spacing:4px;color:#666;opacity:0;transition:opacity .4s';
      vslbl.textContent = 'VS';
      vsRow.appendChild(vslbl);
      var p2div = makePilotDiv(opts.p2name, opts.p2color||'#FF9900', opts.p2kanji||'魔');
      p2div.style.cssText += 'transform:translateX(20px)';
      vsRow.appendChild(p2div);
    }
    content.appendChild(vsRow);

    // Mode label
    var modelbl = document.createElement('div');
    modelbl.style.cssText = 'font-size:.68rem;letter-spacing:4px;color:#555;text-transform:uppercase;margin-bottom:24px;opacity:0;transition:opacity .4s';
    modelbl.textContent = opts.mode || 'SOLO';
    content.appendChild(modelbl);

    // Countdown
    var countdown = document.createElement('div');
    countdown.style.cssText = 'font-size:5rem;letter-spacing:8px;background:linear-gradient(135deg,#FF2A2A,#FFD700);-webkit-background-clip:text;-webkit-text-fill-color:transparent;min-height:90px;transition:transform .15s,opacity .15s';
    countdown.textContent = '3';
    content.appendChild(countdown);

    // Subtitle
    var sub = document.createElement('div');
    sub.style.cssText = 'font-size:.72rem;letter-spacing:4px;color:#444;margin-top:12px;opacity:0;transition:opacity .3s';
    sub.textContent = 'PREPARE-SE';
    content.appendChild(sub);

    overlay.appendChild(content);
    document.body.appendChild(overlay);

    // Background racing lines animation
    var W = window.innerWidth, H = window.innerHeight;
    bg.width = W; bg.height = H;
    var bgCtx = bg.getContext('2d');
    var lines = [];
    for(var i=0;i<18;i++){
      lines.push({
        x: Math.random()*W, y: Math.random()*H,
        vx: (Math.random()-.5)*4, vy: (Math.random()-.5)*4,
        len: 60+Math.random()*200,
        color:['#FF4400','#FF6600','#FF8800','#FFD700'][Math.floor(Math.random()*4)],
        alpha: .08+Math.random()*.22
      });
    }
    var bgAnim = setInterval(function(){
      bgCtx.fillStyle='rgba(2,2,8,.18)';bgCtx.fillRect(0,0,W,H);
      lines.forEach(function(l){
        bgCtx.save();
        bgCtx.globalAlpha=l.alpha;
        bgCtx.strokeStyle=l.color;bgCtx.lineWidth=1.5;
        bgCtx.shadowColor=l.color;bgCtx.shadowBlur=8;
        bgCtx.beginPath();bgCtx.moveTo(l.x,l.y);bgCtx.lineTo(l.x-l.vx*l.len,l.y-l.vy*l.len);bgCtx.stroke();
        bgCtx.restore();
        l.x+=l.vx;l.y+=l.vy;
        if(l.x<-200||l.x>W+200||l.y<-200||l.y>H+200){l.x=Math.random()*W;l.y=Math.random()*H;}
      });
    },16);

    // Sequence
    setTimeout(function(){ badge.style.opacity='1'; modelbl.style.opacity='1'; sub.style.opacity='1'; },100);
    setTimeout(function(){
      p1div.style.opacity='1';
      if(opts.p2name){
        setTimeout(function(){ vslbl&&(vslbl.style.opacity='1'); },200);
        setTimeout(function(){ p2div.style.opacity='1'; p2div.style.transform='translateX(0)'; },350);
      }
    }, 350);

    function tick(n){
      countdown.textContent = n > 0 ? String(n) : 'GO!';
      countdown.style.transform='scale(1.3)';countdown.style.opacity='1';
      setTimeout(function(){ countdown.style.transform='scale(1)'; countdown.style.opacity=n===0?'0':'1'; },180);
      if(n > 0) setTimeout(function(){ tick(n-1); }, 900);
      else setTimeout(function(){
        clearInterval(bgAnim);
        overlay.style.transition='opacity .35s';
        overlay.style.opacity='0';
        setTimeout(function(){ if(overlay.parentNode) overlay.parentNode.removeChild(overlay); if(cb) cb(); }, 380);
      }, 600);
    }
    setTimeout(function(){ tick(3); }, 900);
  }

  return { show: show };
})();
