// PilotRenderer.js — Renderer genérico do PLAYER (era Yuki.js).
// Renomeado no Marco 2.9.1 (refactor de organização). A render lê dinamicamente
// o piloto selecionado e a customização de tampinha (garagem) via PilotsData
// + GarageEngine. window.Yuki é mantido como alias por retrocompatibilidade.
//
// Fallback hierárquico de COR:
//   1) window._capColor (cor escolhida na garagem para o piloto atual)
//   2) PilotsData.getSelected().color (cor padrão do NFT)
//   3) '#00E5FF' (cor da Yuki original)

var PilotRenderer = (function(){
  // ── Estado padrão (Yuki como fallback histórico) ──
  var FALLBACK = {
    nome:'YUKI', raridade:'Mitica',
    velocidade:92, controle:94, aerodinamica:90,
    color:'#00E5FF', accentColor:'#0a5a7a', kanji:'\u96EA'
  };

  var A = Object.assign({}, FALLBACK);
  var M = { spd:A.velocidade/100, ctrl:A.controle/100 };
  var anim = { rot:0, glow:0, gdir:1, trail:[], glowAlpha:0 };

  function _resolveColors(){
    if (typeof window !== 'undefined' && window._capColor){
      return { color: window._capColor, accent: window._capAccent || _shade(window._capColor, -40) };
    }
    if (typeof PilotsData !== 'undefined'){
      var p = PilotsData.getSelected();
      if(p) return { color: p.color, accent: p.accent };
    }
    return { color: FALLBACK.color, accent: FALLBACK.accentColor };
  }

  function _resolveKanji(){
    if (typeof PilotsData !== 'undefined'){
      var p = PilotsData.getSelected();
      if(p && p.kanji) return p.kanji;
    }
    return FALLBACK.kanji;
  }

  // Marco 2.9: lê template (formato F-Zero) escolhido na Garagem
  function _resolveTemplate(){
    if (typeof window !== 'undefined' && window._capTemplate){
      return window._capTemplate;
    }
    if (typeof GarageEngine !== 'undefined' && typeof PilotsData !== 'undefined'){
      var p = PilotsData.getSelected();
      if(p){
        var g = GarageEngine.get(p.id);
        if(g && g.template) return g.template;
      }
    }
    return 'CT-06';
  }

  function _shade(hex, pct){
    if(!hex || hex.charAt(0) !== '#') return '#888888';
    var n = parseInt(hex.replace('#',''),16);
    var r = Math.max(0,Math.min(255,((n>>16)&0xFF)+pct));
    var g = Math.max(0,Math.min(255,((n>>8)&0xFF)+pct));
    var b = Math.max(0,Math.min(255,(n&0xFF)+pct));
    return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }

  function render(ctx, ph, dt){
    var spd = ph.speed || (ph.vel && ph.vel.magnitude && ph.vel.magnitude()) || 0;
    anim.rot     += spd * dt * 0.006;
    anim.glow    += 0.03 * anim.gdir;
    if(anim.glow>=1||anim.glow<=0) anim.gdir*=-1;
    anim.trail.push({x:ph.pos.x, y:ph.pos.y});
    if(anim.trail.length>20) anim.trail.shift();

    var c = _resolveColors();
    var k = _resolveKanji();
    var tpl = _resolveTemplate();

    CapSprite.drawTrail(ctx, anim.trail, c.color, spd);
    CapSprite.drawCap(
      ctx,
      ph.pos.x, ph.pos.y,
      16,
      c.color, c.accent,
      k,
      anim.rot, spd, anim.glow,
      true,
      tpl
    );
  }

  function resetAnim(){ anim.rot=0; anim.trail=[]; anim.glow=0; }

  return { A:A, M:M, render:render, resetAnim:resetAnim };
})();

// ─── Alias retrocompat — qualquer código antigo que chamar Yuki.* continua funcionando ───
if (typeof window !== 'undefined') window.Yuki = PilotRenderer;
