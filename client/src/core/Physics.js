// Physics.js - Motor de fisica da tampinha
// Modelo: velocidade inicial pelo arraste, arrasto linear, ricochete elastico
var Physics=(function(){
  var DRAG=0.52,MAX_PX=165,MAX_SPD=740,REST=0.72,MIN=4;
  var s={pos:new Vector2D(0,0),vel:new Vector2D(0,0),moving:false,drag:1.0};
  function dragOf(surf){return{terra:1.0,areia:1.6,asfalto:0.7}[surf]||1.0;}
  function reset(x,y,surf){s.pos=new Vector2D(x,y);s.vel=new Vector2D(0,0);s.moving=false;s.drag=dragOf(surf||'terra');}
  function flick(from,to,mult){
    var d=from.sub(to),len=Math.min(d.magnitude(),MAX_PX),t=len/MAX_PX;
    s.vel=d.normalize().scale(t*MAX_SPD*(mult||1));s.moving=true;
    return{forcePct:Math.round(t*100),angle:Math.atan2(d.y,d.x)*180/Math.PI};
  }
  function step(dt,b){
    if(!s.moving)return snap();
    var spd=s.vel.magnitude(),ns=Math.max(0,spd-DRAG*s.drag*spd*dt);
    if(ns<MIN){s.vel=new Vector2D(0,0);s.moving=false;return snap();}
    s.vel=s.vel.normalize().scale(ns);s.pos=s.pos.add(s.vel.scale(dt));
    var r=16;
    if(s.pos.x-r<b.x){s.pos.x=b.x+r;s.vel.x=Math.abs(s.vel.x)*REST;}
    if(s.pos.x+r>b.x+b.w){s.pos.x=b.x+b.w-r;s.vel.x=-Math.abs(s.vel.x)*REST;}
    if(s.pos.y-r<b.y){s.pos.y=b.y+r;s.vel.y=Math.abs(s.vel.y)*REST;}
    if(s.pos.y+r>b.y+b.h){s.pos.y=b.y+b.h-r;s.vel.y=-Math.abs(s.vel.y)*REST;}
    return snap();
  }
  function snap(){return{pos:s.pos.clone(),vel:s.vel.clone(),speed:s.vel.magnitude(),moving:s.moving};}
  return{reset:reset,flick:flick,step:step,MAX_PX:MAX_PX};
})();
