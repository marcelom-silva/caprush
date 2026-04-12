// Yuki.js - Piloto Lendario de CONTROLE
// Atributos NFT + modificadores fisicos + renderizacao sprite
var Yuki=(function(){
  var A={nome:'YUKI',raridade:'Lendario',velocidade:82,controle:91,aerodinamica:75,
         cor:'#00E5FF',anel:'#FFD700',kanji:'雪'};
  var M={spd:A.velocidade/100,ctrl:A.controle/100,drag:1-(A.aerodinamica-50)/200};
  var an={rot:0,glow:0,gdir:1,trail:[]};
  function render(ctx,ph,dt){
    var p=ph.pos,spd=ph.speed;
    an.rot+=spd*dt*0.005;
    an.glow+=0.03*an.gdir;if(an.glow>=1||an.glow<=0)an.gdir*=-1;
    an.trail.push({x:p.x,y:p.y});if(an.trail.length>18)an.trail.shift();
    for(var i=0;i<an.trail.length;i++){
      var t=an.trail[i],a=(i/an.trail.length)*0.3;
      ctx.save();ctx.globalAlpha=a;
      ctx.beginPath();ctx.arc(t.x,t.y,13*(i/an.trail.length),0,Math.PI*2);
      ctx.fillStyle=A.cor;ctx.fill();ctx.restore();
    }
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(an.rot);
    if(spd>50){ctx.shadowColor=A.cor;ctx.shadowBlur=18+an.glow*12;}
    var g=ctx.createRadialGradient(-5,-5,2,0,0,16);
    g.addColorStop(0,'#FFF');g.addColorStop(0.3,A.cor);g.addColorStop(1,'#003A50');
    ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
    ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.strokeStyle=A.anel;ctx.lineWidth=2.5;ctx.stroke();
    ctx.rotate(-an.rot);ctx.shadowBlur=0;ctx.fillStyle='#FFF';
    ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(A.kanji,0,0);ctx.restore();
  }
  function resetAnim(){an.rot=0;an.trail=[];an.glow=0;}
  return{A:A,M:M,render:render,resetAnim:resetAnim};
})();
