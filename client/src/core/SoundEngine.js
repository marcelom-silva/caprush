// SoundEngine.js – sons procedurais via Web Audio API
var SoundEngine = (function(){
  var ctx = null;
  function init(){
    if(ctx) return;
    try{ ctx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){}
  }
  function resume(){ if(ctx && ctx.state==='suspended') ctx.resume(); }

  // Tom curto tipo beep
  function beep(freq, dur, vol, type){
    if(!ctx) return;
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.type=type||'square'; o.frequency.value=freq||880;
    g.gain.setValueAtTime(vol||0.3, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+(dur||0.12));
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime+(dur||0.12));
  }

  // Checkpoint: bip duplo ascendente (River Raid style)
  function checkpoint(){
    if(!ctx) return;
    beep(660,0.08,0.4,'square');
    setTimeout(function(){ beep(880,0.1,0.4,'square'); },90);
  }

  // Batida em obstáculo: ruído/crash curto
  function hit(){
    if(!ctx) return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*0.15,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
    var s=ctx.createBufferSource(), g=ctx.createGain();
    g.gain.value=0.5; s.buffer=buf;
    s.connect(g); g.connect(ctx.destination); s.start();
  }

  // Água: salpico (noise rápido filtrado)
  function splash(){
    if(!ctx) return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*0.2,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.3*Math.pow(1-i/d.length,1.5);
    var s=ctx.createBufferSource();
    var f=ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1800;
    var g=ctx.createGain(); g.gain.value=0.7;
    s.buffer=buf; s.connect(f); f.connect(g); g.connect(ctx.destination); s.start();
  }

  // Grama: ruído baixo suave
  function grass(){
    if(!ctx) return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*0.18,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*0.15*Math.pow(1-i/d.length,1.2);
    var s=ctx.createBufferSource();
    var f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=400;
    var g=ctx.createGain(); g.gain.value=0.6;
    s.buffer=buf; s.connect(f); f.connect(g); g.connect(ctx.destination); s.start();
  }

  // Vitória: fanfarra simples
  function victory(){
    if(!ctx) return;
    var notes=[523,659,784,1047];
    notes.forEach(function(n,i){
      setTimeout(function(){
        beep(n, 0.18, 0.35, 'triangle');
      }, i*120);
    });
    setTimeout(function(){ beep(1047,0.4,0.4,'triangle'); },500);
  }

  return { init:init, resume:resume, checkpoint:checkpoint, hit:hit, splash:splash, grass:grass, victory:victory };
})();
