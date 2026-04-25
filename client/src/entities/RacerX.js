// RacerX.js — CapRush Overdrive!
// Piloto IA Boss — Racer-X (entidade autonoma, igual a Yuki.js)
// Usa CapSprite para renderizacao — sem dependencias externas
var RacerX = (function(){

  var A = {
    nome:        'RACER-X',
    raridade:    'Boss',
    velocidade:  95,
    controle:    88,
    aerodinamica:92,
    color:       '#FF2A2A',
    accentColor: '#AA0000',
    kanji:       'X'
  };

  var M = {
    spd:  A.velocidade  / 100,
    ctrl: A.controle    / 100
  };

  var anim = { rot: 0, glow: 0, gdir: 1, trail: [] };

  // ── SOM F-ZERO (engine hover da IA) ─────────────────────────────────────
  // AudioContext separado para nao interferir no SoundEngine do jogador
  var _ac    = null;
  var _osc1  = null;
  var _osc2  = null;
  var _gain  = null;
  var _lpf   = null;

  function _initSound() {
    if (_ac) return;
    try {
      _ac   = new (window.AudioContext || window.webkitAudioContext)();
      _gain = _ac.createGain(); _gain.gain.value = 0;
      _lpf  = _ac.createBiquadFilter();
      _lpf.type = 'bandpass'; _lpf.frequency.value = 380; _lpf.Q.value = 2.5;
      _lpf.connect(_gain); _gain.connect(_ac.destination);
      _osc1 = _ac.createOscillator(); _osc1.type = 'sawtooth'; _osc1.frequency.value = 80;
      _osc1.connect(_lpf); _osc1.start();
      _osc2 = _ac.createOscillator(); _osc2.type = 'square'; _osc2.frequency.value = 162;
      _osc2.connect(_lpf); _osc2.start();
    } catch(e) {}
  }

  function _setEngineSound(speed) {
    if (!_ac) return;
    if (_ac.state === 'suspended') { try { _ac.resume(); } catch(e) {} }
    var t    = _ac.currentTime;
    var base = 50 + speed * 0.38;
    if (speed > 20) {
      _osc1.frequency.setTargetAtTime(base,          t, 0.08);
      _osc2.frequency.setTargetAtTime(base * 2.05,   t, 0.08);
      _lpf.frequency.setTargetAtTime(180 + speed,    t, 0.10);
      _gain.gain.setTargetAtTime(0.055, t, 0.06);
    } else {
      _gain.gain.setTargetAtTime(0, t, 0.14);
    }
  }

  // ── RENDER ────────────────────────────────────────────────────────────────
  // Recebe um snapshot de fisica: { pos, vel, speed, moving }
  function render(ctx, eph, dt) {
    var spd = eph.speed || 0;

    // Animacao
    anim.rot  += spd * dt * 0.008;   // gira mais rapido que Yuki (agressivo)
    anim.glow += 0.04 * anim.gdir;
    if (anim.glow >= 1 || anim.glow <= 0) anim.gdir *= -1;

    // Trail
    anim.trail.push({ x: eph.pos.x, y: eph.pos.y });
    if (anim.trail.length > 18) anim.trail.shift();
    CapSprite.drawTrail(ctx, anim.trail, A.color, spd);

    // Tampinha
    CapSprite.drawCap(
      ctx,
      eph.pos.x, eph.pos.y,
      16,
      A.color, A.accentColor, A.kanji,
      anim.rot,
      spd,
      anim.glow,
      false   // sem aura do jogador
    );

    // Som F-Zero proporcional a velocidade
    _setEngineSound(spd);
  }

  function resetAnim() {
    anim.rot   = 0;
    anim.trail = [];
    anim.glow  = 0;
  }

  function initSound() { _initSound(); }

  return { A: A, M: M, render: render, resetAnim: resetAnim, initSound: initSound };
})();
