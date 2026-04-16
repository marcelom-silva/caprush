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
  function drag(surf,spd){if(!ctx||!_sfxOn||spd<30)return;var b=ctx.createBuffer(1,ctx.sampleRate*.05,ctx.sampleRate),d=b.getChannelData(0),v=surf==='agua'?0.15:surf==='grama'?0.22:0.18;for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*v*(spd/400);var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='highpass';f.frequency.value=surf==='agua'?1200:800;g.gain.value=.35;s.buffer=b;s.connect(f);f.connect(g);g.connect(_masterGain||ctx.destination);s.start();}
 function grass(){
    if(!ctx||!_sfxOn) return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*.15,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*.12*Math.pow(1-i/d.length,1.2);
    var s=ctx.createBufferSource(), f=ctx.createBiquadFilter(), g=ctx.createGain();
    f.type='lowpass'; f.frequency.value=350; g.gain.value=.6;
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
    if(!_bgmOn) return;
    init(); resume();
    _session++;
    var s = _session;
    // Fade in suave
    if(_bgmGain){
      _bgmGain.gain.cancelScheduledValues(ctx.currentTime);
      _bgmGain.gain.setValueAtTime(0, ctx.currentTime);
      _bgmGain.gain.linearRampToValueAtTime(.22, ctx.currentTime+.5);
    }
    setTimeout(function(){ _scheduleBeat(s); }, 10);
  }

  function stopBGM(){
    _session++; // invalida todos os loops ativos
    if(_bgmGain && ctx){
      _bgmGain.gain.cancelScheduledValues(ctx.currentTime);
      _bgmGain.gain.setValueAtTime(_bgmGain.gain.value, ctx.currentTime);
      _bgmGain.gain.linearRampToValueAtTime(0, ctx.currentTime+.3);
    }
  }

  function toggleBGM(){
    _bgmOn = !_bgmOn;
    if(_bgmOn){ startBGM(); }
    else{ stopBGM(); }
    return _bgmOn;
  }

  function toggleSFX(){
    _sfxOn = !_sfxOn;
    return _sfxOn;
  }

  return {
    init:init, resume:resume,
    checkpoint:checkpoint, hit:hit, splash:splash, grass:grass, drag:drag,victory:victory,
    startBGM:startBGM, stopBGM:stopBGM, toggleBGM:toggleBGM, toggleSFX:toggleSFX,
    get bgmOn(){ return _bgmOn; },
    get sfxOn(){ return _sfxOn; }
  };
})();
