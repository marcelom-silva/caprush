// TrackTest.js - Pista Terra e Cascalho
// Responsabilidade: geometria, renderizacao, checkpoints. NAO faz fisica.
var TrackTest=(function(){
  var META={id:'01',nome:'Terra e Cascalho',superficie:'terra',voltas:2};
  var cps=[],obs=[],SP={x:0,y:0},pts=[],TW=72;
  function init(cw,ch){
    var m=60;
    pts=[
      {x:m,y:ch*.5},{x:m,y:m},
      {x:cw*.4,y:m},{x:cw*.5,y:ch*.28},
      {x:cw*.6,y:m},{x:cw-m,y:m},
      {x:cw-m,y:ch-m},{x:cw*.5,y:ch-m},
      {x:m,y:ch-m},{x:m,y:ch*.5},
    ];
    SP={x:pts[0].x+TW*.5,y:pts[0].y};
    cps=[
      {x:cw*.48,y:m+2,r:TW*.5,lbl:'CP 1',ok:false},
      {x:cw-m,y:ch*.55,r:TW*.5,lbl:'CP 2',ok:false},
      {x:cw*.25,y:ch-m-2,r:TW*.5,lbl:'CP 3',ok:false},
    ];
    obs=[{x:cw*.35,y:m+6,r:6},{x:cw*.62,y:m+8,r:8},{x:cw-m-8,y:ch*.45,r:7}];
  }
  function resetCPs(){cps.forEach(function(c){c.ok=false;});}
  function checkCP(pos){
    for(var i=0;i<cps.length;i++){
      var c=cps[i];if(c.ok)continue;
      var dx=pos.x-c.x,dy=pos.y-c.y;
      if(Math.sqrt(dx*dx+dy*dy)<c.r){c.ok=true;return c;}
    }return null;
  }
  function checkLap(pos){
    if(!pts.length)return false;
    var dx=pos.x-(pts[0].x+TW*.5),dy=pos.y-pts[0].y;
    return Math.sqrt(dx*dx+dy*dy)<28;
  }
  function drawPath(ctx,w,col){
    if(pts.length<2)return;
    ctx.save();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    for(var i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);
    ctx.closePath();ctx.stroke();ctx.restore();
  }
  function render(ctx,cw,ch){
    if(!pts.length)return;
    ctx.fillStyle='#1A1208';ctx.fillRect(0,0,cw,ch);
    ctx.fillStyle='rgba(80,60,40,0.4)';
    for(var i=0;i<220;i++)ctx.fillRect((i*137.5)%cw,(i*97.3)%ch,2,2);
    drawPath(ctx,TW+22,'#2A1F18');
    drawPath(ctx,TW,'#4A3728');
    ctx.save();ctx.strokeStyle='rgba(255,215,0,0.3)';ctx.lineWidth=2;ctx.setLineDash([12,10]);
    ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
    for(var j=1;j<pts.length;j++)ctx.lineTo(pts[j].x,pts[j].y);
    ctx.closePath();ctx.stroke();ctx.setLineDash([]);ctx.restore();
    obs.forEach(function(o){
      ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);
      ctx.fillStyle='#6B4F35';ctx.fill();ctx.strokeStyle='#3A2A1A';ctx.lineWidth=2;ctx.stroke();
    });
    for(var q=0;q<6;q++){
      ctx.fillStyle=q%2===0?'#FFF':'#111';
      ctx.fillRect(pts[0].x+4,pts[0].y-TW*.5+q*(TW/6),22,TW/6);
    }
    cps.forEach(function(c){
      ctx.save();ctx.globalAlpha=c.ok?0.25:0.9;
      ctx.strokeStyle=c.ok?'#333':'#00E5FF';ctx.lineWidth=3;ctx.setLineDash([6,4]);
      ctx.beginPath();ctx.moveTo(c.x,c.y-c.r);ctx.lineTo(c.x,c.y+c.r);
      ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=c.ok?'#333':'#00E5FF';
      ctx.font='bold 11px Rajdhani,sans-serif';ctx.textAlign='center';
      ctx.fillText(c.lbl,c.x,c.y-c.r-6);ctx.restore();
    });
  }
  return{META:META,init:init,render:render,checkCP:checkCP,checkLap:checkLap,resetCPs:resetCPs,
         get startPos(){return SP;},get cps(){return cps;}};
})();
