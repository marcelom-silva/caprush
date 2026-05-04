// Physics.js v4 — CapRush
// v4 (Marco 2.8): adiciona efeitos de OBS-BOOST, OBS-OIL, OBS-SPIN
//   applyBoost(duration_ms): +50% velocidade temporária
//   applyOil(duration_ms):   reduz drag (derrapa por mais tempo)
//   applyRedirect(angle):    redireciona vetor mantendo magnitude
//   getEffects():            retorna estado dos efeitos (HUD/render)
// v3 (Marco 2.5): setMults() para evolução de pilotos
//   água:  MAIS atrito  → freia
//   grama: MENOS atrito → desliza
//   areia: meio termo
var Physics = (function(){
  var BASE_DRAG = 1.8;
  var MAX_PX    = 165;
  var MAX_SPD   = 620;
  var REST      = 0.72;
  var MIN_SPD   = 6;

  var DRAG_MULT = {
    asfalto: 1.0,
    agua:    1.95,  // +95% de arrasto — freia significativamente
    grama:   0.42,  // -58% de arrasto — desliza e ganha velocidade
    areia:   1.55,  // +55% de arrasto — entre asfalto e água
  };

  var s = {
    pos: new Vector2D(0,0),
    vel: new Vector2D(0,0),
    moving: false,
    surf: 'asfalto',
    aeroMult: 1.0,  // Marco 2.5: reduz drag (mais aero = desliza mais)
    ctrlMult: 1.0,  // Marco 2.5: aumenta MAX_PX efetivo (mira mais longa)
  };

  // Marco 2.8: efeitos temporários de obstáculos
  var fx = {
    boostUntil: 0,
    oilUntil:   0,
    spinFlash:  0,
  };

  function reset(x, y, surf){
    s.pos    = new Vector2D(x, y);
    s.vel    = new Vector2D(0, 0);
    s.moving = false;
    s.surf   = surf || 'asfalto';
    fx.boostUntil = 0;
    fx.oilUntil   = 0;
    fx.spinFlash  = 0;
    // Mantém aeroMult/ctrlMult ao reiniciar
  }

  function setSurface(surf){ s.surf = surf || 'asfalto'; }

  // Marco 2.5: define multiplicadores de evolução do piloto
  function setMults(mults) {
    s.aeroMult = (mults && mults.aeroMult) ? Math.max(1, mults.aeroMult) : 1.0;
    s.ctrlMult = (mults && mults.ctrlMult) ? Math.max(1, mults.ctrlMult) : 1.0;
  }

  function setVel(vx, vy){
    s.vel    = new Vector2D(vx, vy);
    s.moving = s.vel.magnitude() > MIN_SPD;
  }

  function bounce(nx, ny, restitution){
    var r   = (restitution !== undefined) ? restitution : REST;
    var dot = s.vel.x * nx + s.vel.y * ny;
    if(dot >= 0) return;
    s.vel.x = (s.vel.x - 2 * dot * nx) * r;
    s.vel.y = (s.vel.y - 2 * dot * ny) * r;

    if(Math.abs(dot) > 80){
      if(window.onImpact){
        window.onImpact(s.pos.x, s.pos.y, Math.abs(dot));
      }
    }
    s.moving = s.vel.magnitude() > MIN_SPD;
  }

  // ─── MARCO 2.8: EFEITOS DE OBSTÁCULOS ─────────────────────────────────
  /**
   * OBS-BOOST: rampa de impulso. +50% velocidade instantânea + drag reduzido.
   * @param {number} duration_ms - tempo do efeito (default 1500ms)
   */
  function applyBoost(duration_ms){
    var dur = duration_ms || 1500;
    fx.boostUntil = Date.now() + dur;
    var spd = s.vel.magnitude();
    if(spd > MIN_SPD){
      s.vel = s.vel.normalize().scale(Math.min(MAX_SPD * 1.3, spd * 1.5));
      s.moving = true;
    } else {
      // Se quase parado, dá um empurrão na direção atual
      var ang = Math.atan2(s.vel.y, s.vel.x);
      if(spd < 1) ang = Math.random() * Math.PI * 2;
      var v = MAX_SPD * 0.7;
      s.vel = new Vector2D(Math.cos(ang)*v, Math.sin(ang)*v);
      s.moving = true;
    }
  }

  /**
   * OBS-OIL: derrapagem. Reduz drag (-60%) por X ms — tampinha "patina"
   * e segue a inércia por muito mais tempo.
   * @param {number} duration_ms - default 2000ms
   */
  function applyOil(duration_ms){
    var dur = duration_ms || 2000;
    fx.oilUntil = Date.now() + dur;
  }

  /**
   * OBS-SPIN: redireciona vetor mantendo magnitude.
   * @param {number} angleRad - ângulo radianos (omitido = aleatório)
   */
  function applyRedirect(angleRad){
    var spd = s.vel.magnitude();
    if(spd < MIN_SPD) return;
    var ang = (typeof angleRad === 'number')
      ? angleRad
      : (Math.random() * Math.PI * 2);
    s.vel = new Vector2D(Math.cos(ang)*spd, Math.sin(ang)*spd);
    s.moving = true;
    fx.spinFlash = Date.now() + 250;
  }

  function getEffects(){
    var now = Date.now();
    return {
      boostActive: now < fx.boostUntil,
      boostRemain: Math.max(0, fx.boostUntil - now),
      oilActive:   now < fx.oilUntil,
      oilRemain:   Math.max(0, fx.oilUntil - now),
      spinFlash:   now < fx.spinFlash,
    };
  }

  function flick(from, to, charMult){
    var drag = from.sub(to);
    // Marco 2.5: ctrlMult expande o raio de mira efetivo
    var effectiveMaxPx = MAX_PX * (s.ctrlMult || 1.0);
    var len  = Math.min(drag.magnitude(), effectiveMaxPx);
    var t    = len / effectiveMaxPx;
    s.vel    = drag.normalize().scale(t * MAX_SPD * (charMult || 1));
    s.moving = true;

    function collide(aPos,aVel,bPos,bVel){var dx=bPos.x-aPos.x,dy=bPos.y-aPos.y,d=Math.sqrt(dx*dx+dy*dy);if(d>28||d<0.1)return null;var nx=dx/d,ny=dy/d,rvx=bVel.x-aVel.x,rvy=bVel.y-aVel.y,va=rvx*nx+rvy*ny;if(va>0)return null;var j=-(1+REST)*va/2;return{ax:aVel.x-j*nx,ay:aVel.y-j*ny,bx:bVel.x+j*nx,by:bVel.y+j*ny};}
    return { collide:collide, forcePct: Math.round(t*100),
             angle: Math.atan2(drag.y, drag.x) * 180 / Math.PI };
  }

  function step(dt, bounds){
    if(!s.moving) return snap();

    var now = Date.now();
    var inOil   = now < fx.oilUntil;
    var inBoost = now < fx.boostUntil;

    // Marco 2.5: aeroMult divide o dragCoeff (mais aero = desliza mais)
    var dragCoeff = BASE_DRAG * (DRAG_MULT[s.surf] || 1.0) / (s.aeroMult || 1.0);

    // Marco 2.8: óleo reduz drag em 60% — tampinha patina
    if(inOil) dragCoeff *= 0.4;
    // Marco 2.8: boost reduz drag em 40% — mantém velocidade alta
    if(inBoost) dragCoeff *= 0.6;

    var spd    = s.vel.magnitude();
    var newSpd = Math.max(0, spd - dragCoeff * spd * dt);

    if(newSpd < MIN_SPD){
      s.vel    = new Vector2D(0, 0);
      s.moving = false;
      return snap();
    }

    s.vel = s.vel.normalize().scale(newSpd);
    s.pos = s.pos.add(s.vel.scale(dt));
    if(s.moving) SoundEngine.drag(s.surf, s.vel.magnitude());

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
    setSurface:setSurface, setVel:setVel, bounce:bounce, setMults:setMults,
    applyBoost:applyBoost, applyOil:applyOil, applyRedirect:applyRedirect,
    getEffects:getEffects,
    MAX_PX:MAX_PX, MAX_SPD:MAX_SPD, REST:REST,
    get pos(){ return s.pos.clone(); }
  };
})();
