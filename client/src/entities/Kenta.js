// Kenta.js — CapRush Overdrive!
// Piloto KENTA — Maine Coon Tabby (ÉPICA)
var Kenta = (function(){
  var A = {
    nome:       'KENTA', raridade:'Epico',
    velocidade: 88, controle:76, aerodinamica:83,
    color:      '#FF9900', accentColor:'#CC6600', kanji:'\u9B54'
  };
  var M = { spd:A.velocidade/100, ctrl:A.controle/100 };
  var anim = { rot:0, glow:0, gdir:1, trail:[] };

  function render(ctx, ph, dt){
    var spd = ph.speed || (ph.vel && ph.vel.magnitude()) || 0;
    anim.rot  += spd * dt * 0.007;    // gira mais rápido que Yuki (agressivo)
    anim.glow += 0.035 * anim.gdir;
    if(anim.glow >= 1 || anim.glow <= 0) anim.gdir *= -1;
    anim.trail.push({ x:ph.pos.x, y:ph.pos.y });
    if(anim.trail.length > 20) anim.trail.shift();
    CapSprite.drawTrail(ctx, anim.trail, A.color, spd);
    CapSprite.drawCap(
      ctx, ph.pos.x, ph.pos.y, 16,
      A.color, A.accentColor, A.kanji,
      anim.rot, spd, anim.glow,
      true  // ativa aura do jogador
    );
  }
  function resetAnim(){ anim.rot=0; anim.trail=[]; anim.glow=0; }
  return { A:A, M:M, render:render, resetAnim:resetAnim };
})();
