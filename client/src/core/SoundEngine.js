// SoundEngine.js v4 — CapRush Overdrive!
// BGM procedural: sintetizador Web Audio API
//   Inspirado em Top Gear SNES (melodia quadrada, arpejos) + NFS Underground (baixo pesado, batidas)
//   Loop de 8 compassos, La menor, 148 BPM
// SFX: hit, splash, grass, checkpoint, victory (todos respeitam _sfxOn)
// API: init, resume, startBGM, stopBGM, toggleBGM, toggleSFX, isBGMOn, isSFXOn
var SoundEngine = (function(){
  'use strict';
  var _ctx = null;
  var _master = null;  // gain master
  var _bgmBus = null;  // gain do BGM
  var _sfxBus = null;  // gain dos SFX
  var _bgmOn  = true;
  var _sfxOn  = true;
  var _loopTimer = null;
  var _loopEvents = null; // eventos pre-computados do loop

  // ── Parametros musicais ─────────────────────────────────
  var BPM  = 148;
  var BEAT = 60.0 / BPM;   // ~0.405s por tempo
  var BAR  = BEAT * 4;     // ~1.621s por compasso
  var LOOP_BARS = 8;        // 8 compassos por loop
  var LOOP_DUR  = BAR * LOOP_BARS;

  // Frequencias (La menor)
  var F = {
    A1:55, B1:61.74,
    E2:82.41, G2:98.00, A2:110.00, B2:123.47, D2:73.42,
    E3:164.81, G3:196.00, A3:220.00, B3:246.94, C3:130.81, D3:146.83,
    C4:261.63, D4:293.66, E4:329.63, G4:392.00, A4:440.00, B4:493.88,
    E5:659.25
  };

  // Eventos do loop: {t, type, f, d, v}
  // type: 'mel' | 'bas' | 'kick' | 'snare' | 'hat' | 'arp'
  function _buildLoop(){
    var evs = [];
    function mel(t,f,d,v){ if(f)evs.push({t:t*BEAT,type:'mel',f:f,d:d*BEAT,v:v||0.7}); }
    function bas(t,f,d,v){ if(f)evs.push({t:t*BEAT,type:'bas',f:f,d:d*BEAT,v:v||0.85}); }
    function arp(t,f,d,v){ if(f)evs.push({t:t*BEAT,type:'arp',f:f,d:d*BEAT,v:v||0.55}); }
    function kick(t){  evs.push({t:t*BEAT,type:'kick'}); }
    function snare(t){ evs.push({t:t*BEAT,type:'snare'}); }
    function hat(t){   evs.push({t:t*BEAT,type:'hat'}); }

    // ── MELODIA principal (Top Gear SNES vibe - square wave) ──
    // Frase A (compassos 1-2): abertura ascendente
    mel(0,    F.E4, .5, .78); mel(.5,  F.G4,.25,.68); mel(.75, F.A4,.25,.68);
    mel(1,    F.G4, .5, .72); mel(1.5, F.E4, .5, .78);
    mel(2,    F.D4,.25, .68); mel(2.25,F.E4,.25,.68); mel(2.5, F.B3, 1.5,.62);
    mel(4,    F.A3, .5, .72); mel(4.5, F.C4,.25,.66); mel(4.75,F.D4,.25,.66);
    mel(5,    F.E4, .5, .78); mel(5.5, F.D4, .5, .72);
    mel(6,    F.C4,.25, .66); mel(6.25,F.A3,.25,.60); mel(6.5, F.E3, 1.5,.58);
    // Frase B (compassos 3-4): tensao / NFS vibe
    mel(8,    F.E4, .5, .82); mel(8.5, F.G4,.25,.76); mel(8.75,F.A4,.25,.76);
    mel(9,    F.B4, .5, .88); mel(9.5, F.A4,.25,.82); mel(9.75,F.G4,.25,.76);
    mel(10,   F.E4,.25, .76); mel(10.25,F.D4,.25,.70);mel(10.5,F.B3, 1.5,.65);
    mel(12,   F.A4, .5, .88); mel(12.5,F.G4,.25,.82); mel(12.75,F.E4,.25,.76);
    mel(13,   F.D4, .5, .72); mel(13.5,F.E4, .5, .76);
    mel(14,   F.A3, 1, .65); mel(15,  F.E3, .5, .70); mel(15.5,F.A2, .5,.78);

    // ── ARPEJOS (contramelodica, triangle) ──
    // Compassos 1-2
    arp(0,F.A3,.25,.5);arp(.25,F.E3,.25,.5);arp(.5,F.A3,.25,.5);arp(.75,F.C4,.25,.5);
    arp(1,F.G3,.25,.5);arp(1.25,F.E3,.25,.5);arp(1.5,F.G3,.25,.5);arp(1.75,F.B3,.25,.5);
    arp(2,F.A3,.25,.5);arp(2.25,F.E3,.25,.5);arp(2.5,F.A3,.25,.5);arp(2.75,F.C4,.25,.5);
    arp(3,F.B3,.25,.5);arp(3.25,F.G3,.25,.5);arp(3.5,F.B3,.25,.5);arp(3.75,F.D4,.25,.5);
    // Compasso 5-6
    arp(4,F.A3,.25,.5);arp(4.25,F.E3,.25,.5);arp(4.5,F.C4,.25,.5);arp(4.75,F.A3,.25,.5);
    arp(5,F.D3,.25,.5);arp(5.25,F.A3,.25,.5);arp(5.5,F.D4,.25,.5);arp(5.75,F.A3,.25,.5);
    arp(6,F.E3,.25,.5);arp(6.25,F.A3,.25,.5);arp(6.5,F.G3,.25,.5);arp(6.75,F.E3,.25,.5);
    arp(7,F.A2,.25,.5);arp(7.25,F.E3,.25,.5);arp(7.5,F.A3,.25,.5);arp(7.75,F.C4,.25,.5);

    // ── BAIXO (NFS Underground heavy bass - sawtooth) ──
    // Padrao de 2 compassos repetido x4
    for(var rep=0;rep<4;rep++){
      var b0=rep*4;
      bas(b0,    F.A2,.5,.92); bas(b0+.5, F.A2,.25,.76); bas(b0+.75,F.E2,.25,.72);
      bas(b0+1,  F.A2,.5,.88); bas(b0+1.5,F.E2,.5,.82);
      bas(b0+2,  F.E2,.5,.88); bas(b0+2.5,F.B1,.5,.92);
      bas(b0+3,  F.A2,.5,.88); bas(b0+3.5,F.G2,.5,.82);
    }
    // Variacao nos compassos 5-8 (mais pesado)
    bas(16,F.A2,.5,.95);bas(16.5,F.A2,.25,.78);bas(16.75,F.G2,.25,.74);
    bas(17,F.A2,.5,.92);bas(17.5,F.E2,.5,.86);
    bas(18,F.D2,.5,.92);bas(18.5,F.A2,.25,.78);bas(18.75,F.E2,.25,.74);
    bas(19,F.A2,.5,.88);bas(19.5,F.D2,.5,.85);
    bas(20,F.E2,.5,.95);bas(20.5,F.G2,.5,.85);
    bas(21,F.A2,.5,.92);bas(21.5,F.E2,.5,.88);
    bas(22,F.D2,.5,.92);bas(22.5,F.A2,.5,.85);
    bas(23,F.E2,.5,.95);bas(23.5,F.B1,.5,.98);

    // ── BATERIA (NFS vibe) ──
    // 8 compassos x 16 subdivisions (semicolcheias)
    for(var bar=0;bar<LOOP_BARS;bar++){
      for(var step=0;step<16;step++){
        var st = (bar*4 + step*0.25);
        // Kick: 1 e 3 (+ variacao no 4o compasso de cada frase)
        if(step===0||step===8) kick(st);
        if((bar===3||bar===7)&&step===14) kick(st); // fill
        // Snare: 2 e 4 (+ ghost notes)
        if(step===4||step===12) snare(st);
        if((step===2||step===10)&&(bar%2===1)) evs.push({t:st*BEAT,type:'ghost'});
        // Hi-hat: every 8th
        if(step%2===0) hat(st);
        // Open hat no offbeat de cada 2o compasso
        if(step===6&&bar%2===1) evs.push({t:st*BEAT,type:'ohat'});
      }
    }

    evs.sort(function(a,b){return a.t-b.t;});
    return evs;
  }

  // ── Reproduce um evento ──────────────────────────────────
  function _playEvent(ev, when){
    if(!_ctx||!_bgmOn) return;
    var t = when + ev.t;
    if(t < _ctx.currentTime) return; // ja passou

    if(ev.type==='mel'){
      var osc=_ctx.createOscillator(), g=_ctx.createGain();
      osc.type='square';
      osc.frequency.value=ev.f;
      osc.detune.value=-18; // ligeiro detune SNES
      g.gain.setValueAtTime(0,t);
      g.gain.linearRampToValueAtTime(ev.v*0.13,t+0.012);
      g.gain.setValueAtTime(ev.v*0.13,t+ev.d-0.045);
      g.gain.linearRampToValueAtTime(0,t+ev.d);
      osc.connect(g);g.connect(_bgmBus);
      osc.start(t);osc.stop(t+ev.d+0.05);

    } else if(ev.type==='arp'){
      var osc=_ctx.createOscillator(), g=_ctx.createGain();
      osc.type='triangle';
      osc.frequency.value=ev.f*2; // oitava acima
      g.gain.setValueAtTime(0,t);
      g.gain.linearRampToValueAtTime(ev.v*0.08,t+0.008);
      g.gain.setValueAtTime(ev.v*0.08,t+ev.d-0.03);
      g.gain.linearRampToValueAtTime(0,t+ev.d);
      osc.connect(g);g.connect(_bgmBus);
      osc.start(t);osc.stop(t+ev.d+0.05);

    } else if(ev.type==='bas'){
      var osc=_ctx.createOscillator(), flt=_ctx.createBiquadFilter(), g=_ctx.createGain();
      osc.type='sawtooth';
      osc.frequency.value=ev.f;
      flt.type='lowpass'; flt.frequency.value=900; flt.Q.value=2.5;
      // Sub-oscillator uma oitava abaixo
      var osc2=_ctx.createOscillator(), g2=_ctx.createGain();
      osc2.type='sine'; osc2.frequency.value=ev.f*.5;
      g2.gain.setValueAtTime(ev.v*0.12,t); g2.gain.linearRampToValueAtTime(0,t+ev.d);
      osc2.connect(g2);g2.connect(_bgmBus);osc2.start(t);osc2.stop(t+ev.d+0.05);
      g.gain.setValueAtTime(0,t);
      g.gain.linearRampToValueAtTime(ev.v*0.22,t+0.018);
      g.gain.setValueAtTime(ev.v*0.22,t+ev.d-0.05);
      g.gain.linearRampToValueAtTime(0,t+ev.d);
      osc.connect(flt);flt.connect(g);g.connect(_bgmBus);
      osc.start(t);osc.stop(t+ev.d+0.05);

    } else if(ev.type==='kick'){
      var osc=_ctx.createOscillator(), g=_ctx.createGain();
      osc.type='sine';
      osc.frequency.setValueAtTime(160,t);
      osc.frequency.exponentialRampToValueAtTime(38,t+0.14);
      g.gain.setValueAtTime(0.62,t);
      g.gain.exponentialRampToValueAtTime(0.001,t+0.28);
      osc.connect(g);g.connect(_bgmBus);
      osc.start(t);osc.stop(t+0.32);

    } else if(ev.type==='snare'){
      var buf=_mkNoise(0.14), src=_ctx.createBufferSource();
      var flt=_ctx.createBiquadFilter(), g=_ctx.createGain();
      src.buffer=buf; flt.type='bandpass'; flt.frequency.value=1300; flt.Q.value=0.9;
      g.gain.setValueAtTime(0.34,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.14);
      src.connect(flt);flt.connect(g);g.connect(_bgmBus);src.start(t);

    } else if(ev.type==='ghost'){
      var buf=_mkNoise(0.04), src=_ctx.createBufferSource();
      var flt=_ctx.createBiquadFilter(), g=_ctx.createGain();
      src.buffer=buf; flt.type='bandpass'; flt.frequency.value=1400; flt.Q.value=1;
      g.gain.setValueAtTime(0.08,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.04);
      src.connect(flt);flt.connect(g);g.connect(_bgmBus);src.start(t);

    } else if(ev.type==='hat'){
      var buf=_mkNoise(0.055), src=_ctx.createBufferSource();
      var flt=_ctx.createBiquadFilter(), g=_ctx.createGain();
      src.buffer=buf; flt.type='highpass'; flt.frequency.value=9000;
      g.gain.setValueAtTime(0.11,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.055);
      src.connect(flt);flt.connect(g);g.connect(_bgmBus);src.start(t);

    } else if(ev.type==='ohat'){
      var buf=_mkNoise(0.18), src=_ctx.createBufferSource();
      var flt=_ctx.createBiquadFilter(), g=_ctx.createGain();
      src.buffer=buf; flt.type='highpass'; flt.frequency.value=7000;
      g.gain.setValueAtTime(0.14,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.18);
      src.connect(flt);flt.connect(g);g.connect(_bgmBus);src.start(t);
    }
  }

  function _mkNoise(dur){
    var len=Math.ceil(_ctx.sampleRate*dur);
    var buf=_ctx.createBuffer(1,len,_ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<len;i++) d[i]=Math.random()*2-1;
    return buf;
  }

  function _scheduleLoop(loopStart){
    if(!_bgmOn||!_ctx) return;
    if(!_loopEvents) _loopEvents=_buildLoop();
    _loopEvents.forEach(function(ev){ _playEvent(ev,loopStart); });
    var nextStart=loopStart+LOOP_DUR;
    var delay=Math.max(0,(nextStart-_ctx.currentTime-0.35)*1000);
    _loopTimer=setTimeout(function(){
      if(_bgmOn) _scheduleLoop(nextStart);
    }, delay);
  }

  // ── API publica ─────────────────────────────────────────
  function init(){
    if(_ctx) return;
    try{
      _ctx=new(window.AudioContext||window.webkitAudioContext)();
      _master=_ctx.createGain(); _master.gain.value=1.0; _master.connect(_ctx.destination);
      _bgmBus=_ctx.createGain(); _bgmBus.gain.value=0.85; _bgmBus.connect(_master);
      _sfxBus=_ctx.createGain(); _sfxBus.gain.value=1.0;  _sfxBus.connect(_master);
    }catch(e){ _ctx=null; console.warn('SoundEngine: AudioContext failed',e); }
  }
  function resume(){
    if(_ctx&&_ctx.state==='suspended') _ctx.resume();
  }
  function startBGM(){
    if(!_ctx||!_bgmOn) return;
    stopBGM();
    _scheduleLoop(_ctx.currentTime+0.12);
  }
  function stopBGM(){
    if(_loopTimer){ clearTimeout(_loopTimer); _loopTimer=null; }
  }
  function toggleBGM(){
    _bgmOn=!_bgmOn;
    if(_bgmOn){ if(_ctx)startBGM(); }
    else stopBGM();
    _updBtns();
    return _bgmOn;
  }
  function toggleSFX(){
    _sfxOn=!_sfxOn;
    if(_sfxBus) _sfxBus.gain.value=_sfxOn?1.0:0.0;
    _updBtns();
    return _sfxOn;
  }
  function isBGMOn(){ return _bgmOn; }
  function isSFXOn(){ return _sfxOn; }
  function _updBtns(){
    var bBgm=document.getElementById('btn-bgm');
    var bSfx=document.getElementById('btn-sfx');
    if(bBgm) bBgm.classList.toggle('off',!_bgmOn);
    if(bSfx) bSfx.classList.toggle('off',!_sfxOn);
  }

  // ── SFX (respeitam _sfxOn) ──────────────────────────────
  function _sfx(fn){ if(_ctx&&_sfxOn) fn(); }

  function hit(){_sfx(function(){
    var o=_ctx.createOscillator(),g=_ctx.createGain();
    o.type='square';o.frequency.setValueAtTime(320,_ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(80,_ctx.currentTime+0.08);
    g.gain.setValueAtTime(0.35,_ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,_ctx.currentTime+0.12);
    o.connect(g);g.connect(_sfxBus);o.start();o.stop(_ctx.currentTime+0.14);
  });}
  function splash(){_sfx(function(){
    var b=_mkNoise(0.22),src=_ctx.createBufferSource();
    var f=_ctx.createBiquadFilter(),g=_ctx.createGain();
    src.buffer=b;f.type='bandpass';f.frequency.value=800;f.Q.value=0.5;
    g.gain.setValueAtTime(0.28,_ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,_ctx.currentTime+0.22);
    src.connect(f);f.connect(g);g.connect(_sfxBus);src.start();
  });}
  function grass(){_sfx(function(){
    var b=_mkNoise(0.16),src=_ctx.createBufferSource();
    var f=_ctx.createBiquadFilter(),g=_ctx.createGain();
    src.buffer=b;f.type='bandpass';f.frequency.value=400;f.Q.value=0.8;
    g.gain.setValueAtTime(0.14,_ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,_ctx.currentTime+0.16);
    src.connect(f);f.connect(g);g.connect(_sfxBus);src.start();
  });}
  function checkpoint(){_sfx(function(){
    [[523,0],[659,.1],[784,.2],[1047,.32]].forEach(function(p){
      var o=_ctx.createOscillator(),g=_ctx.createGain(),t=_ctx.currentTime+p[1];
      o.type='sine';o.frequency.value=p[0];
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.35,t+0.02);
      g.gain.setValueAtTime(0.35,t+0.08);g.gain.linearRampToValueAtTime(0,t+0.14);
      o.connect(g);g.connect(_sfxBus);o.start(t);o.stop(t+0.18);
    });
  });}
  function victory(){_sfx(function(){
    [[523,0,0.4],[659,.15,0.4],[784,.3,0.4],[1047,.5,0.5],[1319,.7,0.5],[1568,.95,0.6]].forEach(function(p){
      var o=_ctx.createOscillator(),g=_ctx.createGain(),t=_ctx.currentTime+p[0+1];
      o.type='sine';o.frequency.value=p[0];
      g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(p[2],t+0.02);
      g.gain.setValueAtTime(p[2],t+0.2);g.gain.linearRampToValueAtTime(0,t+0.35);
      o.connect(g);g.connect(_sfxBus);o.start(t);o.stop(t+0.4);
    });
  });}

  return {
    init:init, resume:resume,
    startBGM:startBGM, stopBGM:stopBGM,
    toggleBGM:toggleBGM, toggleSFX:toggleSFX,
    isBGMOn:isBGMOn, isSFXOn:isSFXOn,
    hit:hit, splash:splash, grass:grass,
    checkpoint:checkpoint, victory:victory
  };
})();
