// Physics.js v2 - Fisica realista de asfalto
// Atrito alto (asfalto real): tampinha para em ~1.5s
// Superficie: asfalto=base, agua=desliza menos (mais atrito),
//             grama=desliza mais (menos atrito)
var Physics = (function(){
  // Coeficientes ajustados para asfalto
  var BASE_DRAG = 1.8;   // arrasto base (asfalto) - para rapido
  var MAX_PX    = 165;   // distancia maxima de arraste
  var MAX_SPD   = 620;   // velocidade maxima px/s
  var REST      = 0.65;  // ricochete (perde 35% da velocidade)
  var MIN_SPD   = 6;     // velocidade minima antes de parar

  // Multiplicadores de arrasto por superficie
  var DRAG_MULT = {
    asfalto: 1.0,  // base
    agua:    0.55, // MENOS arrasto = desliza menos (mais atrito com agua)
    grama:   1.35, // MAIS arrasto = desliza mais (menos atrito com grama)
  };

  var s = {
    pos: new Vector2D(0,0),
    vel: new Vector2D(0,0),
    moving: false,
    surf: 'asfalto'
  };

  function reset(x, y, surf){
    s.pos    = new Vector2D(x, y);
    s.vel    = new Vector2D(0, 0);
    s.moving = false;
    s.surf   = surf || 'asfalto';
  }

  function setSurface(surf){ s.surf = surf || 'asfalto'; }

  function flick(from, to, charMult){
    var drag    = from.sub(to);
    var len     = Math.min(drag.magnitude(), MAX_PX);
    var t       = len / MAX_PX;
    s.vel       = drag.normalize().scale(t * MAX_SPD * (charMult || 1));
    s.moving    = true;
    return { forcePct: Math.round(t * 100),
             angle: Math.atan2(drag.y, drag.x) * 180 / Math.PI };
  }

  function step(dt, bounds){
    if (!s.moving) return snap();

    var dragCoeff = BASE_DRAG * (DRAG_MULT[s.surf] || 1.0);
    var spd       = s.vel.magnitude();
    var newSpd    = Math.max(0, spd - dragCoeff * spd * dt);

    if (newSpd < MIN_SPD){
      s.vel    = new Vector2D(0, 0);
      s.moving = false;
      return snap();
    }

    s.vel = s.vel.normalize().scale(newSpd);
    s.pos = s.pos.add(s.vel.scale(dt));

    // bordas
    var r = 14;
    if (s.pos.x - r < bounds.x){ s.pos.x = bounds.x + r; s.vel.x =  Math.abs(s.vel.x) * REST; }
    if (s.pos.x + r > bounds.x + bounds.w){ s.pos.x = bounds.x + bounds.w - r; s.vel.x = -Math.abs(s.vel.x) * REST; }
    if (s.pos.y - r < bounds.y){ s.pos.y = bounds.y + r; s.vel.y =  Math.abs(s.vel.y) * REST; }
    if (s.pos.y + r > bounds.y + bounds.h){ s.pos.y = bounds.y + bounds.h - r; s.vel.y = -Math.abs(s.vel.y) * REST; }

    return snap();
  }

  function snap(){
    return {
      pos:    s.pos.clone(),
      vel:    s.vel.clone(),
      speed:  s.vel.magnitude(),
      moving: s.moving,
      surf:   s.surf
    };
  }

  return { reset:reset, flick:flick, step:step, setSurface:setSurface,
           MAX_PX:MAX_PX, MAX_SPD:MAX_SPD,
           get pos(){ return s.pos.clone(); } };
})();
