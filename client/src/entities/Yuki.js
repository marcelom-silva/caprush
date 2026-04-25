// Yuki.js - Samoeida (cachorro branco neve) piloto Lendario
var Yuki = (function(){
  var A = {
    nome:'YUKI', raridade:'Lendario',
    velocidade:82, controle:91, aerodinamica:75,
    color:'#00E5FF', accentColor:'#00A5C8', kanji:'\u96EA'
  };
  var M = { spd:A.velocidade/100, ctrl:A.controle/100 };
  var anim = { rot:0, glow:0, gdir:1, trail:[], glowAlpha:0 };

  function render(ctx, ph, dt){
    var spd = ph.speed || ph.vel && ph.vel.magnitude() || 0;
    anim.rot     += spd * dt * 0.006;
    anim.glow    += 0.03 * anim.gdir;
    if(anim.glow>=1||anim.glow<=0) anim.gdir*=-1;
    anim.trail.push({x:ph.pos.x, y:ph.pos.y});
    if(anim.trail.length>20) anim.trail.shift();

    CapSprite.drawTrail(ctx, anim.trail, A.color, spd);
    CapSprite.drawCap(
      ctx,
      ph.pos.x,
      ph.pos.y,
      16,
      A.color,
      A.accentColor,
      A.kanji,
      anim.rot,
      spd,
      anim.glow,
      true // 🔥 ativa aura
    );
  }
  function resetAnim(){ anim.rot=0; anim.trail=[]; anim.glow=0; }
  return { A:A, M:M, render:render, resetAnim:resetAnim };
})();
