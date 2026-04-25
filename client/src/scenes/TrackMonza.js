// TrackMonza.js v2 — CapRush Overdrive!
// Circuito inspirado em Monza (F1) — procedural Canvas 2D
// API 100% compatível com TrackV3 (drop-in replacement)
var TrackMonza = (function(){
  'use strict';
  var TW, CW, CH;
  var pts=[], standZones=[], chicurbs=[], obstacles=[], potholes=[];
  var puddles=[], lakesDecor=[], grassInner=[], grassBlades=[];
  var parkingZone=null, _checkpoints=[], _cpHit=[];
  var _startLine=null, crowd=[];
  var META={voltas:2,nome:'Monza'};

  // ── INIT ─────────────────────────────────────────────────────────────
  function init(cw,ch){
    CW=cw; CH=ch;
    TW=Math.min(cw,ch)*0.096; // slightly larger track

    // ── CIRCUIT CENTERLINE (Monza clockwise) ─────────────────────────
    pts=[
      {x:CW*0.12,y:CH*0.84}, // 0  SF
      {x:CW*0.35,y:CH*0.84}, // 1  main straight
      {x:CW*0.58,y:CH*0.84}, // 2
      {x:CW*0.76,y:CH*0.84}, // 3  end straight
      {x:CW*0.87,y:CH*0.76}, // 4  Prima Variante entry
      {x:CW*0.89,y:CH*0.64}, // 5  PV apex
      {x:CW*0.85,y:CH*0.52}, // 6  PV exit / Curva Grande
      {x:CW*0.87,y:CH*0.41}, // 7  right up
      {x:CW*0.83,y:CH*0.30}, // 8  Roggia entry
      {x:CW*0.76,y:CH*0.19}, // 9  Roggia
      {x:CW*0.66,y:CH*0.13}, // 10 Roggia apex L
      {x:CW*0.55,y:CH*0.15}, // 11 Roggia apex R
      {x:CW*0.44,y:CH*0.12}, // 12 Lesmo entry
      {x:CW*0.35,y:CH*0.15}, // 13 Lesmo 1 apex
      {x:CW*0.28,y:CH*0.20}, // 14 Lesmo 2
      {x:CW*0.20,y:CH*0.29}, // 15 Ascari entry
      {x:CW*0.14,y:CH*0.40}, // 16 Ascari left
      {x:CW*0.16,y:CH*0.52}, // 17 Ascari right
      {x:CW*0.11,y:CH*0.62}, // 18 Parabolica entry
      {x:CW*0.09,y:CH*0.73}, // 19 Parabolica apex
      {x:CW*0.11,y:CH*0.80}, // 20 Parabolica exit
    ];

    // Start/Finish line
    _startLine={x:CW*0.17-TW*0.4, y:CH*0.84-TW*0.5, w:TW*0.8, h:TW};

    // ── CHECKPOINTS ──────────────────────────────────────────────────
    _checkpoints=[
      {x:CW*0.88,y:CH*0.64,r:TW*0.90,lbl:'CP1 Prima Variante'},
      {x:CW*0.54,y:CH*0.14,r:TW*0.90,lbl:'CP2 Lesmo'},
      {x:CW*0.15,y:CH*0.44,r:TW*0.90,lbl:'CP3 Ascari'},
    ];
    _cpHit=[false,false,false];

    // ── GRANDSTANDS ──────────────────────────────────────────────────
    // Top: wider, covering most of top section
    var topH=Math.max(TW*0.8,10);
    // Main straight: hugging track edges closely
    var sfH=Math.max(TW*0.55,7);
    standZones=[
      // Top (above Roggia/Lesmo straight)
      {x:CW*0.20,y:0,w:CW*0.65,h:topH,nx:0,ny:1,label:'STANDS'},
      // Main straight north (above reta SF) — just touching track top edge
      {x:CW*0.12,y:CH*0.84-TW*0.55-sfH,w:CW*0.64,h:sfH,nx:0,ny:1,label:'STANDS'},
      // Main straight south (below reta SF) — just below track
      {x:CW*0.12,y:CH*0.84+TW*0.55,w:CW*0.64,h:sfH,nx:0,ny:-1,label:'STANDS'},
      // Right side (along Curva Grande)
      {x:CW*0.88+TW*0.5,y:CH*0.38,w:Math.max(TW*0.5,6),h:CH*0.22,nx:-1,ny:0,label:'STANDS'},
      // Left (Parabolica outer wall) — outside Parabolica curve
      {x:0,y:CH*0.58,w:Math.max(TW*0.55,6),h:CH*0.28,nx:1,ny:0,label:'STANDS'},
    ];

    // ── CHICANE CURB ZONES (solid, extra bounce) ──────────────────────
    // Each chicane has 2 curb strips that act as solid elastic obstacles
    chicurbs=_buildChicurbs();

     // ── ROCK OBSTACLES (small, on track) ──────────────────────────
     obstacles=[
       {x:CW*0.88,y:CH*0.70,r:TW*0.07,nx:0,ny:0}, // Prima Variante exit
       {x:CW*0.74,y:CH*0.86,r:TW*0.07,nx:0,ny:0}, // main straight R
       {x:CW*0.30,y:CH*0.82,r:TW*0.07,nx:0,ny:0}, // main straight L
       {x:CW*0.52,y:CH*0.11,r:TW*0.07,nx:0,ny:0}, // top straight Roggia
       {x:CW*0.15,y:CH*0.49,r:TW*0.07,nx:0,ny:0}, // Ascari
       {x:CW*0.08,y:CH*0.76,r:TW*0.07,nx:0,ny:0}, // Parabolica
     ];

     // ── POTHOLES on track ─────────────────────────────────────────
     potholes=[
       {x:CW*0.25,y:CH*0.84,r:TW*0.16}, // main straight left
       {x:CW*0.62,y:CH*0.84,r:TW*0.14}, // main straight right
       {x:CW*0.35,y:CH*0.17,r:TW*0.14}, // top Lesmo area
     ];

    // ── PUDDLES on track ─────────────────────────────────────────────────
    puddles=[
      {x:CW*0.46,y:CH*0.84,r:TW*0.52}, // main straight center
      {x:CW*0.87,y:CH*0.58,r:TW*0.48}, // Prima Variante / Curva Grande
      {x:CW*0.52,y:CH*0.14,r:TW*0.45}, // top straight Roggia
    ];

    // ── DECORATIVE LAKES ──────────────────────────────────────────────
    lakesDecor=[
      {x:CW*0.45,y:CH*0.42,rx:CW*0.06,ry:CH*0.05},
      {x:CW*0.62,y:CH*0.38,rx:CW*0.05,ry:CH*0.04},
    ];

    // ── INNER GRASS (Royal Park) ──────────────────────────────────────
    grassInner=[
      {x:CW*0.46,y:CH*0.47,rx:CW*0.14,ry:CH*0.12},
      {x:CW*0.60,y:CH*0.60,rx:CW*0.11,ry:CH*0.10},
      {x:CW*0.36,y:CH*0.62,rx:CW*0.09,ry:CH*0.08},
      {x:CW*0.65,y:CH*0.65,rx:CW*0.08,ry:CH*0.07},
      {x:CW*0.32,y:CH*0.46,rx:CW*0.07,ry:CH*0.06},
    ];

    // ── PARKING (top-left) ────────────────────────────────────────────
    parkingZone={x:CW*0.02,y:CH*0.03,w:CW*0.18,h:CH*0.16};

    // ── GRASS BLADES (animated) ───────────────────────────────────────
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

    // ── CROWD ─────────────────────────────────────────────────────────
    crowd=[];
    standZones.forEach(function(sz){
      if(sz.h<6&&sz.w<6) return;
      var area=(sz.w||1)*(sz.h||1);
      var n=Math.floor(area/(TW*TW*0.12));
      for(var i=0;i<Math.min(n,320);i++){
        crowd.push({sz:sz,
          x:sz.x+4+Math.random()*Math.max(sz.w-8,1),
          y:sz.y+3+Math.random()*Math.max(sz.h-6,1),
          r:2.2+Math.random()*2.2,
          color:['#FF2A2A','#FFD700','#00E5FF','#FF9900','#FFFFFF','#FF88FF','#44FF88'][Math.floor(Math.random()*7)],
          phase:Math.random()*Math.PI*2,
          speed:1.5+Math.random()*2.5
        });
      }
    });
  }

  // ── BUILD CHICANE CURBS ───────────────────────────────────────────
  function _buildChicurbs(){
    var curbs=[];
    // Prima Variante (pts 4-5-6), Roggia (9-10-11), Ascari (15-16-17)
    var chicIdx=[[4,5,1],[5,6,-1],[9,10,1],[10,11,-1],[15,16,1],[16,17,-1]];
    chicIdx.forEach(function(ci){
      var a=pts[ci[0]],b=pts[ci[1]],side=ci[2];
      if(!a||!b) return;
      var dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
      var nx=-dy/len,ny=dx/len;
      var hw=TW*0.50;
      // Curb center point and normal
      curbs.push({
        x1:a.x+nx*hw*side,y1:a.y+ny*hw*side,
        x2:b.x+nx*hw*side,y2:b.y+ny*hw*side,
        nx:-nx*side, ny:-ny*side, // normal pointing inward
        w:TW*0.18 // curb width
      });
    });
    return curbs;
  }

  // ── SPATIAL UTILS ────────────────────────────────────────────────
  function _distSeg(px,py,ax,ay,bx,by){
    var dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;
    if(l2<.001)return Math.hypot(px-ax,py-ay);
    var t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l2));
    return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));
  }
  function _nearSeg(pos){
    var best=Infinity;
    for(var i=0;i<pts.length;i++){var a=pts[i],b=pts[(i+1)%pts.length];var d=_distSeg(pos.x,pos.y,a.x,a.y,b.x,b.y);if(d<best)best=d;}
    return best;
  }
  function isOnTrack(pos){return _nearSeg(pos)<TW*0.55;}
  function detectInner(pos){
    if(isOnTrack(pos))return false;
    var cx=CW*0.50,cy=CH*0.50,rx=CW*0.40,ry=CH*0.35;
    return ((pos.x-cx)/rx)**2+((pos.y-cy)/ry)**2<1.0;
  }
  function detectPuddle(pos){for(var i=0;i<puddles.length;i++){var p=puddles[i];if(Math.hypot(pos.x-p.x,pos.y-p.y)<p.r)return true;}return false;}
  function detectSand(pos){return false;}
  function detectGrassOnTrack(pos){for(var i=0;i<grassInner.length;i++){var g=grassInner[i];if(((pos.x-g.x)/g.rx)**2+((pos.y-g.y)/g.ry)**2<1)return true;}return false;}
  function checkPothole(pos,r){for(var i=0;i<potholes.length;i++){var h=potholes[i];if(Math.hypot(pos.x-h.x,pos.y-h.y)<h.r+r*0.5)return h;}return null;}
  function checkObstacles(pos,r){
    for(var i=0;i<obstacles.length;i++){var o=obstacles[i],dx=pos.x-o.x,dy=pos.y-o.y,d=Math.hypot(dx,dy);if(d<r+o.r)return{obs:o,nx:dx/d,ny:dy/d};}
    // Chicane curb check (extra elastic bounce)
    for(var j=0;j<chicurbs.length;j++){
      var c=chicurbs[j];
      var d2=_distSeg(pos.x,pos.y,c.x1,c.y1,c.x2,c.y2);
      if(d2<r+c.w) return{obs:c,nx:c.nx,ny:c.ny,elastic:true};
    }
    return null;
  }
  function checkStands(pos,r){for(var i=0;i<standZones.length;i++){var s=standZones[i];if(pos.x+r>s.x&&pos.x-r<s.x+s.w&&pos.y+r>s.y&&pos.y-r<s.y+s.h)return{nx:s.nx,ny:s.ny};}return null;}
  function checkPaddock(pos,r){return null;}
  function checkCP(pos,cb){for(var i=0;i<_checkpoints.length;i++){if(_cpHit[i])continue;var c=_checkpoints[i];if(Math.hypot(pos.x-c.x,pos.y-c.y)<c.r){_cpHit[i]=true;if(cb)cb(c);return c;}}return null;}
  function checkLap(pos){if(!_startLine)return false;var sl=_startLine;return pos.x>sl.x&&pos.x<sl.x+sl.w&&pos.y>sl.y&&pos.y<sl.y+sl.h;}
  function resetCPs(){_cpHit=[false,false,false];_checkpoints.forEach(function(c){delete c.ok;});}
  function getStartPos(){return _startLine?{x:_startLine.x+TW*0.5,y:_startLine.y+_startLine.h/2}:{x:CW*0.22,y:CH*0.84};}

  // ── RENDER ────────────────────────────────────────────────────────
  function render(ctx,cw,ch,t){
    if(!pts.length)init(cw,ch);

    // BG
    ctx.fillStyle='#0C1A0C';ctx.fillRect(0,0,cw,ch);
    var bg=ctx.createRadialGradient(cw*.5,ch*.5,cw*.05,cw*.5,ch*.5,cw*.9);
    bg.addColorStop(0,'rgba(28,55,18,.55)');bg.addColorStop(1,'rgba(4,12,4,.0)');
    ctx.fillStyle=bg;ctx.fillRect(0,0,cw,ch);
    for(var ly=0;ly<ch;ly+=20){ctx.fillStyle='rgba(255,255,255,.012)';ctx.fillRect(0,ly,cw,1);}

    // ── TRACK ─────────────────────────────────────────────────────
    ctx.strokeStyle='rgba(255,200,120,.20)';ctx.lineWidth=TW*1.40;ctx.lineJoin='round';ctx.lineCap='round';
    ctx.beginPath();pts.forEach(function(p,i){i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);});ctx.closePath();ctx.stroke();
    var aGrad=ctx.createLinearGradient(0,ch*.2,0,ch*.9);
    aGrad.addColorStop(0,'#302820');aGrad.addColorStop(.5,'#3A3020');aGrad.addColorStop(1,'#2C2418');
    ctx.strokeStyle=aGrad;ctx.lineWidth=TW*1.10;
    ctx.beginPath();pts.forEach(function(p,i){i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);});ctx.closePath();ctx.stroke();
    // Center dashes
    ctx.strokeStyle='rgba(255,255,255,.10)';ctx.lineWidth=TW*0.06;ctx.setLineDash([TW*.5,TW*.45]);
    ctx.beginPath();pts.forEach(function(p,i){i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y);});ctx.closePath();ctx.stroke();
    ctx.setLineDash([]);

    // ── CHICANE CURBS (red/white, solid) ─────────────────────────
    chicurbs.forEach(function(c,ci){
      var N=8,dx=c.x2-c.x1,dy=c.y2-c.y1;
      for(var k=0;k<N;k++){
        var t0=k/N,t1=(k+1)/N;
        var x0=c.x1+t0*dx,y0=c.y1+t0*dy,x1=c.x1+t1*dx,y1=c.y1+t1*dy;
        ctx.fillStyle=k%2===0?'rgba(235,25,25,.92)':'rgba(255,255,255,.92)';
        var ex=-dy/Math.hypot(dx,dy)*c.w,ey=dx/Math.hypot(dx,dy)*c.w;
        ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.lineTo(x1+ex,y1+ey);ctx.lineTo(x0+ex,y0+ey);ctx.closePath();ctx.fill();
      }
    });

    // ── DECORATIVE LAKES ─────────────────────────────────────────
    lakesDecor.forEach(function(l){
      var r=Math.max(l.rx,l.ry)*(0.96+Math.sin(t*.7+l.x)*0.04);
      var lg=ctx.createRadialGradient(l.x-l.rx*.2,l.y-l.ry*.2,l.rx*.05,l.x,l.y,r);
      lg.addColorStop(0,'rgba(80,150,210,.60)');lg.addColorStop(1,'rgba(40,90,160,.25)');
      ctx.fillStyle=lg;ctx.beginPath();ctx.ellipse(l.x,l.y,l.rx,l.ry,0,0,Math.PI*2);ctx.fill();
      // ripples
      for(var ri=0;ri<3;ri++){
        var rph=(t*0.8+ri*1.1)%(Math.PI*2);
        ctx.strokeStyle='rgba(180,220,255,'+(0.18+ri*0.04*Math.sin(rph))+')';ctx.lineWidth=1;
        ctx.beginPath();ctx.ellipse(l.x,l.y,l.rx*(0.5+ri*0.25),l.ry*(0.5+ri*0.25),0,0,Math.PI*2);ctx.stroke();
      }
    });

    // ── PUDDLES ──────────────────────────────────────────────────
    puddles.forEach(function(p){
      var r=p.r*(0.92+Math.sin(t*.9+p.x)*0.08);
      var g=ctx.createRadialGradient(p.x-r*.2,p.y-r*.2,r*.1,p.x,p.y,r);
      g.addColorStop(0,'rgba(100,165,235,.62)');g.addColorStop(1,'rgba(55,100,190,.25)');
      ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.5,0,0,Math.PI*2);ctx.fill();
      for(var ri=0;ri<2;ri++){ctx.strokeStyle='rgba(180,220,255,'+(0.25-ri*.08)+')';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.x,p.y,r*(.65+ri*.3),r*.33*(.65+ri*.3),0,0,Math.PI*2);ctx.stroke();}
    });

    // ── INNER GRASS + ANIMATED BLADES ────────────────────────────
    grassInner.forEach(function(g){
      var gGrd=ctx.createRadialGradient(g.x,g.y,0,g.x,g.y,Math.max(g.rx,g.ry));
      gGrd.addColorStop(0,'rgba(25,78,15,.70)');gGrd.addColorStop(1,'rgba(15,52,8,.0)');
      ctx.fillStyle=gGrd;ctx.beginPath();ctx.ellipse(g.x,g.y,g.rx,g.ry,0,0,Math.PI*2);ctx.fill();
      // Trees
      var seed=Math.round(g.x+g.y*999);
      for(var ti=0;ti<12;ti++){
        var tx=g.x+(((seed*ti*127+31)%((g.rx*2)|0))-(g.rx))*0.78;
        var ty=g.y+(((seed*ti*73+11)%((g.ry*2)|0))-(g.ry))*0.78;
        var tr=TW*0.13+Math.sin(t*.6+ti)*TW*0.012;
        ctx.shadowColor='rgba(0,0,0,.4)';ctx.shadowBlur=4;
        ctx.fillStyle='#1A5C0A';ctx.beginPath();ctx.arc(tx,ty,tr,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='rgba(40,125,16,.55)';ctx.beginPath();ctx.arc(tx-tr*.2,ty-tr*.3,tr*.62,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;
      }
    });
    // Animated grass blades
    grassBlades.forEach(function(b){
      var sway=Math.sin(t*2.2+b.phase)*2.5;
      ctx.strokeStyle=b.color;ctx.lineWidth=1.2;ctx.globalAlpha=0.45;
      ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+sway,b.y-b.len);ctx.stroke();
      ctx.globalAlpha=1;
    });

    // ── ROCK OBSTACLES ────────────────────────────────────────────
    obstacles.forEach(function(o){
      ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=5;
      var og=ctx.createRadialGradient(o.x-o.r*.3,o.y-o.r*.3,o.r*.1,o.x,o.y,o.r);
      og.addColorStop(0,'#887060');og.addColorStop(1,'#3C3025');
      ctx.fillStyle=og;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
      ctx.strokeStyle='rgba(255,200,150,.18)';ctx.lineWidth=1;
      ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.stroke();
    });

    // ── POTHOLES ─────────────────────────────────────────────────
    potholes.forEach(function(h){
      var pg=ctx.createRadialGradient(h.x,h.y,0,h.x,h.y,h.r);
      pg.addColorStop(0,'rgba(0,0,0,.95)');pg.addColorStop(0.7,'rgba(20,15,10,.85)');pg.addColorStop(1,'rgba(60,45,30,.0)');
      ctx.fillStyle=pg;ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill();
      // Danger ring
      ctx.strokeStyle='rgba(255,80,0,'+(0.5+Math.sin(t*4+h.x)*.25)+')';ctx.lineWidth=1.5;ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.arc(h.x,h.y,h.r+2,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    });

    // ── GRANDSTANDS ───────────────────────────────────────────────
    standZones.forEach(function(sz){
      if(sz.h<2&&sz.w<2)return;
      var isVert=sz.w<sz.h;
      var sg=isVert?
        ctx.createLinearGradient(sz.x,sz.y,sz.x+sz.w,sz.y):
        ctx.createLinearGradient(sz.x,sz.y,sz.x,sz.y+sz.h);
      sg.addColorStop(0,'#D07830');sg.addColorStop(.5,'#A85C20');sg.addColorStop(1,'#783410');
      ctx.fillStyle=sg;ctx.fillRect(sz.x,sz.y,sz.w,sz.h);
      // Sand grain
      var sd=Math.round(sz.x+sz.y),area=(sz.w||1)*(sz.h||1);
      for(var gi=0;gi<Math.min(area*.08,550);gi++){
        var gx=sz.x+((sd*gi*179+17)%Math.max(sz.w,1));
        var gy=sz.y+((sd*gi*137+31)%Math.max(sz.h,1));
        ctx.globalAlpha=.45;ctx.fillStyle=['#E09050','#8A4820','#B06428'][gi%3];
        ctx.beginPath();ctx.arc(gx,gy,[1.2,1.0,1.1][gi%3],0,Math.PI*2);ctx.fill();
      }
      ctx.globalAlpha=1;
      // Animated crowd (denser)
      crowd.forEach(function(c){
        if(c.sz!==sz)return;
        var wave=Math.sin(t*c.speed+c.phase)*3.5;
        var clap=Math.sin(t*c.speed*1.3+c.phase)*1.5;
        ctx.fillStyle=c.color;ctx.fillRect(c.x-1.5,c.y-wave-2,3,6);
        // Arms clapping
        ctx.strokeStyle=c.color;ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(c.x-3,c.y-wave+clap);ctx.lineTo(c.x,c.y-wave);ctx.lineTo(c.x+3,c.y-wave-clap);ctx.stroke();
        // Head glow
        ctx.shadowColor=c.color;ctx.shadowBlur=6;
        ctx.strokeStyle=c.color;ctx.lineWidth=.8;
        ctx.beginPath();ctx.arc(c.x,c.y,c.r*(1+Math.sin(t*3.5+c.phase)*.14),0,Math.PI*2);ctx.stroke();
        ctx.shadowBlur=0;
      });
      ctx.strokeStyle='rgba(255,215,0,.15)';ctx.lineWidth=1;ctx.setLineDash([5,3]);
      ctx.strokeRect(sz.x+.5,sz.y+.5,sz.w-1,sz.h-1);ctx.setLineDash([]);
    });

    // ── HELIPAD (center) ──────────────────────────────────────────
    var hx=CW*0.50, hy=CH*0.50, hr=TW*0.55;
    ctx.fillStyle='rgba(50,50,60,.80)';ctx.beginPath();ctx.arc(hx,hy,hr,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(hx,hy,hr,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(hx,hy,hr*0.75,0,Math.PI*2);ctx.stroke();
    // H symbol
    ctx.fillStyle='rgba(255,255,255,.80)';
    ctx.font='bold '+Math.floor(hr*1.1)+'px Bebas Neue,Arial Black';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('H',hx,hy);
    // Blinking light
    ctx.fillStyle='rgba(255,80,0,'+(0.6+Math.sin(t*5)*.4)+')';
    ctx.beginPath();ctx.arc(hx+hr*.7,hy,4,0,Math.PI*2);ctx.fill();

    // ── PARKING (top-left) ────────────────────────────────────────
    if(parkingZone){
      var pz=parkingZone;
      var pGrd=ctx.createLinearGradient(pz.x,pz.y,pz.x,pz.y+pz.h);
      pGrd.addColorStop(0,'#1E1E24');pGrd.addColorStop(1,'#151518');
      ctx.fillStyle=pGrd;ctx.fillRect(pz.x,pz.y,pz.w,pz.h);
      ctx.strokeStyle='rgba(255,215,0,.18)';ctx.lineWidth=1.2;ctx.strokeRect(pz.x+.75,pz.y+.75,pz.w-1.5,pz.h-1.5);
      ctx.font='bold '+Math.floor(pz.w*.14)+'px Bebas Neue,Arial';ctx.fillStyle='rgba(0,229,255,.65)';
      ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText('P',pz.x+5,pz.y+4);
      ctx.strokeStyle='rgba(255,255,255,.06)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(pz.x,pz.y+pz.h*.5);ctx.lineTo(pz.x+pz.w,pz.y+pz.h*.5);ctx.stroke();
      var pc2=['#00E5FF','#FF9900','#FF2A2A','#44FF88','#FFCC00','#CC44FF','#FF44AA','#44CCFF','#FF8844','#88FF44'];
      var cols2=4,rows2=2,sw2=(pz.w-10)/cols2,sh2=(pz.h-24)/rows2;
      for(var pr=0;pr<rows2;pr++){for(var pc3=0;pc3<cols2;pc3++){
        var pi2=pr*cols2+pc3,psx=pz.x+5+pc3*sw2,psy=pz.y+20+pr*sh2;
        ctx.strokeStyle='rgba(255,255,255,.09)';ctx.lineWidth=1;ctx.strokeRect(psx+1,psy+1,sw2-2,sh2-2);
        if(typeof CapSprite!=='undefined'){
          var pcx=psx+sw2/2,pcy=psy+sh2/2;
          ctx.save();ctx.globalAlpha=.20;ctx.fillStyle='#000';
          ctx.beginPath();ctx.ellipse(pcx+1.5,pcy+2,6,3,0,0,Math.PI*2);ctx.fill();ctx.restore();
          CapSprite.drawCap(ctx,pcx,pcy,7,pc2[pi2%pc2.length],pc2[pi2%pc2.length],String.fromCharCode(65+pi2),pi2*.6,0,.4,false);
        }
      }}
    }

    // ── START/FINISH ──────────────────────────────────────────────
    if(_startLine){
      var sl=_startLine,sq=5;
      for(var si=0;si<Math.floor(sl.w/sq)+1;si++){
        for(var sj=0;sj<Math.floor(sl.h/sq)+1;sj++){
          ctx.fillStyle=(si+sj)%2===0?'rgba(255,255,255,.90)':'rgba(0,0,0,.60)';
          ctx.fillRect(sl.x+si*sq,sl.y+sj*sq,sq,sq);
        }
      }
      ctx.save();ctx.translate(sl.x-4,sl.y+sl.h/2);ctx.rotate(-Math.PI/2);
      ctx.font='bold '+Math.floor(TW*.16)+'px Rajdhani,Arial';ctx.fillStyle='rgba(255,215,0,.70)';
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('START / FINISH',0,0);ctx.restore();
    }

    // ── CHECKPOINT RINGS ─────────────────────────────────────────
    _checkpoints.forEach(function(c){
      if(c.ok)return;
      var alpha=.28+Math.sin(t*3)*.14;
      ctx.strokeStyle='rgba(0,229,255,'+alpha+')';ctx.lineWidth=2;ctx.setLineDash([8,4]);
      ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='rgba(0,229,255,.07)';ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fill();
    });
  }

  // ── PUBLIC API ────────────────────────────────────────────────
  return {
    init,render,isOnTrack,detectInner,detectPuddle,detectSand,detectGrassOnTrack,
    checkObstacles,checkStands,checkPaddock,checkCP,checkLap,resetCPs,getStartPos,
    checkPothole,META,
    get TW(){return TW;},
    get checkpoints(){return _checkpoints;}
  };
})();
