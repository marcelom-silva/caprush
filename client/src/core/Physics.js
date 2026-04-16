// Physics.js v3 — CapRush
// CORRECAO: agua aumenta atrito (freia), grama diminui (desliza/acelera)
// NOVO: setVel(), bounce() para ricochete correto
var Physics = (function(){
  var BASE_DRAG = 1.8;
  var MAX_PX    = 165;
  var MAX_SPD   = 620;
  var REST      = 0.72;
  var MIN_SPD   = 6;

  // FIX v3: valores corrigidos (estavam invertidos!)
  // agua:  MAIS atrito  = dragCoeff MAIOR = tampinha FREIA na agua
  // grama: MENOS atrito = dragCoeff MENOR = tampinha DESLIZA e ACELERA na grama
  var DRAG_MULT = {
    asfalto: 1.0,
    agua:    1.95,  // +95% de arrasto — freia significativamente
    grama:   0.42,  // -58% de arrasto — desliza e ganha velocidade
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

  // NOVO v3: define velocidade diretamente (para ricochete)
  function setVel(vx, vy){
    s.vel    = new Vector2D(vx, vy);
    s.moving = s.vel.magnitude() > MIN_SPD;
  }

  // NOVO v3: reflexao vetorial correta — n deve ser vetor unitario
  // Uso: bounce(nx, ny, restitution)
  // Aplica: v = v - 2*(v.n)*n  depois multiplica por restituicao
  function bounce(nx, ny, restitution){
    var r   = (restitution !== undefined) ? restitution : REST;
    var dot = s.vel.x * nx + s.vel.y * ny;
    if(dot >= 0) return;  // ja se afastando, nao ricocheta
    s.vel.x = (s.vel.x - 2 * dot * nx) * r;
    s.vel.y = (s.vel.y - 2 * dot * ny) * r;
    s.moving = s.vel.magnitude() > MIN_SPD;
  }

  function flick(from, to, charMult){
    var drag = from.sub(to);
    var len  = Math.min(drag.magnitude(), MAX_PX);
    var t    = len / MAX_PX;
    s.vel    = drag.normalize().scale(t * MAX_SPD * (charMult || 1));
    s.moving = true;
    function collide(aPos,aVel,bPos,bVel){var dx=bPos.x-aPos.x,dy=bPos.y-aPos.y,d=Math.sqrt(dx*dx+dy*dy);if(d>28||d<0.1)return null;var nx=dx/d,ny=dy/d,rvx=bVel.x-aVel.x,rvy=bVel.y-aVel.y,va=rvx*nx+rvy*ny;if(va>0)return null;var j=-(1+REST)*va/2;return{ax:aVel.x-j*nx,ay:aVel.y-j*ny,bx:bVel.x+j*nx,by:bVel.y+j*ny};}
 return { collide:collide, forcePct: Math.round(t*100),
             angle: Math.atan2(drag.y, drag.x) * 180 / Math.PI };
  }

  function step(dt, bounds){
    if(!s.moving) return snap();

    var dragCoeff = BASE_DRAG * (DRAG_MULT[s.surf] || 1.0);
    var spd       = s.vel.magnitude();
    var newSpd    = Math.max(0, spd - dragCoeff * spd * dt);

    if(newSpd < MIN_SPD){
      s.vel    = new Vector2D(0, 0);
      s.moving = false;
      return snap();
    }

    s.vel = s.vel.normalize().scale(newSpd);
    s.pos = s.pos.add(s.vel.scale(dt));
 if(s.moving) SoundEngine.drag(s.surf, s.vel.magnitude());

    // bordas do canvas
    var r = 14;
    if(s.pos.x - r < bounds.x)         { s.pos.x = bounds.x + r;           s.vel.x =  Math.abs(s.vel.x) * REST; }
    if(s.pos.x + r > bounds.x+bounds.w){ s.pos.x = bounds.x+bounds.w - r;  s.vel.x = -Math.abs(s.vel.x) * REST; }
    if(s.pos.y - r < bounds.y)         { s.pos.y = bounds.y + r;           s.vel.y =  Math.abs(s.vel.y) * REST; }
    if(s.pos.y + r > bounds.y+bounds.h){ s.pos.y = bounds.y+bounds.h - r;  s.vel.y = -Math.abs(s.vel.y) * REST; }

    return snap();
  }

  function snap(){
    function collide(aPos,aVel,bPos,bVel){var dx=bPos.x-aPos.x,dy=bPos.y-aPos.y,d=Math.sqrt(dx*dx+dy*dy);if(d>28||d<0.1)return null;var nx=dx/d,ny=dy/d,rvx=bVel.x-aVel.x,rvy=bVel.y-aVel.y,va=rvx*nx+rvy*ny;if(va>0)return null;var j=-(1+REST)*va/2;return{ax:aVel.x-j*nx,ay:aVel.y-j*ny,bx:bVel.x+j*nx,by:bVel.y+j*ny};}
 return { collide:collide,
      pos:    s.pos.clone(),
      vel:    s.vel.clone(),
      speed:  s.vel.magnitude(),
      moving: s.moving,
      surf:   s.surf
    };
  }

  function collide(aPos,aVel,bPos,bVel){var dx=bPos.x-aPos.x,dy=bPos.y-aPos.y,d=Math.sqrt(dx*dx+dy*dy);if(d>28||d<0.1)return null;var nx=dx/d,ny=dy/d,rvx=bVel.x-aVel.x,rvy=bVel.y-aVel.y,va=rvx*nx+rvy*ny;if(va>0)return null;var j=-(1+REST)*va/2;return{ax:aVel.x-j*nx,ay:aVel.y-j*ny,bx:bVel.x+j*nx,by:bVel.y+j*ny};}
 return { collide:collide,
    reset:reset, flick:flick, step:step,
    setSurface:setSurface, setVel:setVel, bounce:bounce,
    MAX_PX:MAX_PX, MAX_SPD:MAX_SPD, REST:REST,
    get pos(){ return s.pos.clone(); }
  };
})();
