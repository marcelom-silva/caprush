// SoundEngine.js  v4b  --  CapRush Overdrive!
// BGM procedural com session-ID (sem overlap ao toggle rapido)
var SoundEngine = (function(){
  var ctx = null;
  var _bgmOn = true, _sfxOn = true;
  var _session = 0;      // incrementado a cada startBGM/stopBGM
  var _masterGain = null;
  var _bgmGain = null;

  function init(){
    if(ctx) return;
    try{
      ctx = new (window.AudioContext||window.webkitAudioContext)();
      _masterGain = ctx.createGain();
      _masterGain.gain.value = 1;
      _masterGain.connect(ctx.destination);
      _bgmGain = ctx.createGain();
      _bgmGain.gain.value = 0.22;
      _bgmGain.connect(_masterGain);
    }catch(e){}
  }
  function resume(){
    if(ctx && ctx.state==='suspended') ctx.resume();
  }
  function beep(freq,dur,vol,type){
    if(!ctx||!_sfxOn) return;
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.type = type||'square';
    o.frequency.value = freq||880;
    g.gain.setValueAtTime(vol||0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+(dur||0.12));
    o.connect(g); g.connect(_masterGain||ctx.destination);
    o.start(); o.stop(ctx.currentTime+(dur||0.12));
  }
  function checkpoint(){
    if(!ctx||!_sfxOn) return;
    beep(660,.08,.35,'square');
    setTimeout(function(){ beep(880,.1,.35,'square'); }, 90);
  }
  function hit(){
    if(!ctx||!_sfxOn) return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*.12,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2)*.8;
    var s=ctx.createBufferSource(), g=ctx.createGain();
    g.gain.value=0.5;
    s.buffer=buf; s.connect(g); g.connect(_masterGain||ctx.destination); s.start();
  }
  function splash(){
    if(!ctx||!_sfxOn) return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*.18,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*.25*Math.pow(1-i/d.length,1.5);
    var s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain();
    f.type='bandpass'; f.frequency.value=1800; g.gain.value=.7;
    s.buffer=buf; s.connect(f); f.connect(g); g.connect(_masterGain||ctx.destination); s.start();
  }
  // Marco 2.9.2 (E3): som de TWISTER (ventania) — ruído + filtro bandpass que
  // varre frequências altas pra dar sensação de tornado sugando a tampinha.
  function twister(){
    if(!ctx||!_sfxOn) return;
    var dur = 0.35;
    var buf = ctx.createBuffer(1, ctx.sampleRate*dur, ctx.sampleRate);
    var d = buf.getChannelData(0);
    var L = d.length;
    for(var i=0;i<L;i++){
      // ruído amplificado nas pontas, atenuado no meio (envelope cresce-decresce)
      var phase = i/L;
      var env = Math.sin(phase*Math.PI); // 0 → 1 → 0
      d[i] = (Math.random()*2-1) * 0.7 * env;
    }
    var s = ctx.createBufferSource();
    var f = ctx.createBiquadFilter();
    var g = ctx.createGain();
    f.type='bandpass'; f.frequency.value=900; if(f.Q) f.Q.value=2.5;
    g.gain.value=0.7;
    // varredura de frequência (whoosh ascendente)
    f.frequency.setValueAtTime(700, ctx.currentTime);
    f.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + dur*0.7);
    f.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + dur);
    s.buffer = buf; s.connect(f); f.connect(g); g.connect(_masterGain||ctx.destination); s.start();
  }
  // Marco 2.9.2: perfis sônicos de derrapagem por tampinha NFT.
  // Cada tampinha tem timbre próprio: filtro, frequência base, ressonância e ganho.
  // Lido de window._capSoundProfile (string id da tampinha) — opcional, fallback OK.
  // NB: vol = amplitude do ruído fonte; gain = gain final (audibilidade).
  var _CAP_DRAG_PROFILES = {
    'AETHERION':  { filter:'bandpass', freq:1800, q:2.5, gain:0.55, vol:0.30 }, // metálico agressivo
    'SOLARA':     { filter:'lowpass',  freq:600,  q:1.0, gain:0.50, vol:0.28 }, // grave abafado
    'VERDANTCORE':{ filter:'highpass', freq:800,  q:1.0, gain:0.45, vol:0.26 }, // neutro padrão
    'NOVAFLUX':   { filter:'bandpass', freq:2400, q:5.0, gain:0.50, vol:0.28 }  // sintético/buzz
  };

  function drag(surf,spd,capId){
    if(!ctx||!_sfxOn||spd<30) return;
    // Throttle: no máximo 10x/segundo — evita acúmulo de AudioSources (som alto)
    var _now = Date.now();
    if(_now - drag._cd < 90) return;
    drag._cd = _now;
    // Resolve perfil da tampinha (passado direto OU via window._capSoundProfile)
    var pid = capId || (typeof window !== 'undefined' && window._capSoundProfile) || null;
    var prof = (pid && _CAP_DRAG_PROFILES[pid]) || null;
    var v = surf==='agua' ? 0.18 : surf==='grama' ? 0.22 : (prof ? prof.vol : 0.18);
    // Buffer mais longo (0.08s) para sustentar entre disparos throttled
    var b = ctx.createBuffer(1, ctx.sampleRate*0.08, ctx.sampleRate);
    var d = b.getChannelData(0);
    // Envelope suave nas bordas para evitar clicks
    var L = d.length;
    for(var i=0;i<L;i++){
      var env = Math.min(i, L-i, L*0.1) / (L*0.1);
      if(env > 1) env = 1;
      d[i] = (Math.random()*2-1) * v * (spd/500) * env;
    }
    var s = ctx.createBufferSource();
    var f = ctx.createBiquadFilter();
    var g = ctx.createGain();
    if(surf === 'agua'){
      // Água sempre soa "molhado" (highpass agudo) — preserva comportamento antigo
      f.type = 'highpass'; f.frequency.value = 1200;
      g.gain.value = 0.40;
    } else if(surf === 'areia'){
      // Marco 2.9.2 (E2): areia tem timbre próprio (granular áspero) —
      // NÃO usa perfil da tampinha, pra ficar perceptivelmente diferente.
      f.type = 'bandpass'; f.frequency.value = 3200;
      if(f.Q) f.Q.value = 0.7;
      g.gain.value = 0.55;
    } else if(surf === 'grama'){
      // Grama: timbre médio neutro (também sem perfil tampinha)
      f.type = 'highpass'; f.frequency.value = 600;
      g.gain.value = 0.42;
    } else if(prof){
      // ASFALTO com perfil da tampinha (Aetherion/Solara/Verdantcore/Novaflux)
      f.type = prof.filter; f.frequency.value = prof.freq;
      if(f.Q) f.Q.value = prof.q;
      g.gain.value = prof.gain;
    } else {
      // Asfalto fallback (sem tampinha resolvida)
      f.type = 'highpass'; f.frequency.value = 800;
      g.gain.value = 0.40;
    }
    s.buffer = b; s.connect(f); f.connect(g); g.connect(_masterGain||ctx.destination); s.start();
  }
  drag._cd = 0;
 function grass(){
    if(!ctx||!_sfxOn) return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*.15,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*.12*Math.pow(1-i/d.length,1.2);
    var s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain();
    f.type='lowpass'; f.frequency.value=350; g.gain.value=.6;
    s.buffer=buf; s.connect(f); f.connect(g); g.connect(_masterGain||ctx.destination); s.start();
  }

  // v8: óleo — derrapagem aguda com pitch decrescente (sugere skid)
  function oil(){
    if(!ctx||!_sfxOn) return;
    var dur = 0.42;
    var osc = ctx.createOscillator();
    var f   = ctx.createBiquadFilter();
    var g   = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(820, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + dur);
    f.type = 'bandpass';
    f.frequency.value = 1100;
    f.Q.value = 4;
    g.gain.setValueAtTime(0.01, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.32, ctx.currentTime + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(f); f.connect(g); g.connect(_masterGain||ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  }

  // v9: areia — som granular médio-grave (chocalho denso, mais perceptível)
  function sand(){
    if(!ctx||!_sfxOn) return;
    var dur = 0.32;
    var buf=ctx.createBuffer(1,ctx.sampleRate*dur,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++){
      // ruído com modulação granular (grãos de areia)
      var grain = Math.sin(i*0.21)*0.5 + 0.5;
      var grain2 = Math.sin(i*0.07)*0.3 + 0.7;
      var env = Math.pow(1-i/d.length, 0.7);
      d[i]=(Math.random()*2-1)*.32*grain*grain2*env;
    }
    var s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain();
    f.type='bandpass'; f.frequency.value=850; f.Q.value=1.2;
    g.gain.value=.95;
    s.buffer=buf; s.connect(f); f.connect(g); g.connect(_masterGain||ctx.destination); s.start();
  }
  function victory(){
    if(!ctx) return;
    [523,659,784,1047].forEach(function(n,i){
      setTimeout(function(){ beep(n,.18,.32,'triangle'); }, i*115);
    });
    setTimeout(function(){ beep(1047,.4,.38,'triangle'); }, 480);
  }

  // ── BGM PROCEDURAL 148 BPM Am ──────────────────────────────────────────
  // Session ID garante que loops antigos param ao fazer toggle rapido
  var AM_BASS  = [110, 98,  98,  110, 131, 131, 110, 98 ]; // A2 G2 G2 A2 C3 C3 A2 G2
  var AM_CHORD = [220, 196, 247, 220, 262, 247, 220, 196]; // A3 G3 B3 A3 C4 B3 A3 G3
  var AM_LEAD  = [440, 392, 330, 440, 523, 494, 440, 392]; // A4 G4 E4 A4 C5 B4 A4 G4
  var BEAT_MS  = (60/148/2)*1000; // 8a note
  var BEAT_IDX = 0;

  function _scheduleBeat(session){
    if(session !== _session || !_bgmOn) return;
    if(!ctx){ setTimeout(function(){ _scheduleBeat(session); }, BEAT_MS); return; }
    var now = ctx.currentTime;
    var dur = (BEAT_MS/1000) * 0.85;
    var bi  = BEAT_IDX % 8;

    // Bass sinc
    var ob=ctx.createOscillator(), gb=ctx.createGain();
    ob.type='sawtooth'; ob.frequency.value=AM_BASS[bi];
    gb.gain.setValueAtTime(.28, now);
    gb.gain.exponentialRampToValueAtTime(.001, now+dur);
    ob.connect(gb); gb.connect(_bgmGain); ob.start(now); ob.stop(now+dur);

    // Chord pad (triangle)
    if(bi%2===0){
      var oc=ctx.createOscillator(), gc=ctx.createGain(), lp=ctx.createBiquadFilter();
      oc.type='triangle'; oc.frequency.value=AM_CHORD[bi];
      lp.type='lowpass'; lp.frequency.value=600;
      gc.gain.setValueAtTime(.12, now);
      gc.gain.exponentialRampToValueAtTime(.001, now+dur*1.4);
      oc.connect(lp); lp.connect(gc); gc.connect(_bgmGain);
      oc.start(now); oc.stop(now+dur*1.4);
    }

    // Lead (cada 4 beats)
    if(bi%4===0){
      var ol=ctx.createOscillator(), gl=ctx.createGain();
      ol.type='square'; ol.frequency.value=AM_LEAD[bi];
      gl.gain.setValueAtTime(.07, now);
      gl.gain.exponentialRampToValueAtTime(.001, now+dur*.9);
      ol.connect(gl); gl.connect(_bgmGain);
      ol.start(now); ol.stop(now+dur*.9);
    }

    // Hi-hat noise (beat 0 e 4)
    if(bi===0||bi===4){
      var buf=ctx.createBuffer(1,Math.floor(ctx.sampleRate*.04),ctx.sampleRate);
      var bd=buf.getChannelData(0);
      for(var i=0;i<bd.length;i++) bd[i]=(Math.random()*2-1)*.18;
      var sn=ctx.createBufferSource(), hf=ctx.createBiquadFilter(), hg=ctx.createGain();
      hf.type='highpass'; hf.frequency.value=4000;
      hg.gain.setValueAtTime(.15,now); hg.gain.exponentialRampToValueAtTime(.001,now+.04);
      sn.buffer=buf; sn.connect(hf); hf.connect(hg); hg.connect(_bgmGain);
      sn.start(now);
    }

    BEAT_IDX++;
    var drift = BEAT_MS - (BEAT_IDX * BEAT_MS % 20);
    setTimeout(function(){ _scheduleBeat(session); }, Math.max(10, drift || BEAT_MS));
  }

  function startBGM(){
    // BGM agora gerenciado pelo audio.js (arquivos OGG)
    // Esta função é no-op — não iniciar sintetizador
  }

  function stopBGM(){
    // No-op — BGM controlado pelo audio.js
    _session++; // Invalida beats pendentes
  }

  function toggleBGM(){
    // Delega ao audio.js que controla o OGG
    if(typeof toggleAudio === 'function') toggleAudio();
    return _bgmOn;
  }

  function toggleSFX(){
    _sfxOn = !_sfxOn;
    return _sfxOn;
  }

  function launch(power){
    if(!ctx||!_sfxOn) return;
    beep(200 + power*2, .12, .4, 'sawtooth');
  }

  return {
    init:init, resume:resume,
    checkpoint:checkpoint, hit:hit, splash:splash, twister:twister, grass:grass, drag:drag, victory:victory,
    oil:oil, sand:sand,  // v8: novos sons distintos
    launch:launch, // 🔥 ADICIONE ISSO
    startBGM:startBGM, stopBGM:stopBGM, toggleBGM:toggleBGM, toggleSFX:toggleSFX,
    get bgmOn(){ return _bgmOn; },
    get sfxOn(){ return _sfxOn; }
  };
})();
