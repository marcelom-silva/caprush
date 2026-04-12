// SoundEngine.js
var SoundEngine = (function(){
  var ctx = null;
  function init(){ if(ctx) return; try{ ctx=new(window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
  function resume(){ if(ctx&&ctx.state==='suspended') ctx.resume(); }
  function beep(freq,dur,vol,type){
    if(!ctx)return;
    var o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type||'square'; o.frequency.value=freq||880;
    g.gain.setValueAtTime(vol||0.3,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+(dur||0.12));
    o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+(dur||0.12));
  }
  function checkpoint(){ if(!ctx)return; beep(660,.08,.35,'square'); setTimeout(function(){beep(880,.1,.35,'square');},90); }
  function hit(){
    if(!ctx)return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*.12,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2)*.8;
    var s=ctx.createBufferSource(),g=ctx.createGain(); g.gain.value=0.5;
    s.buffer=buf; s.connect(g);g.connect(ctx.destination);s.start();
  }
  function splash(){
    if(!ctx)return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*.18,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*.25*Math.pow(1-i/d.length,1.5);
    var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    f.type='bandpass';f.frequency.value=1800;g.gain.value=.7;
    s.buffer=buf;s.connect(f);f.connect(g);g.connect(ctx.destination);s.start();
  }
  function grass(){
    if(!ctx)return;
    var buf=ctx.createBuffer(1,ctx.sampleRate*.15,ctx.sampleRate);
    var d=buf.getChannelData(0);
    for(var i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*.12*Math.pow(1-i/d.length,1.2);
    var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    f.type='lowpass';f.frequency.value=350;g.gain.value=.6;
    s.buffer=buf;s.connect(f);f.connect(g);g.connect(ctx.destination);s.start();
  }
  function victory(){
    if(!ctx)return;
    [523,659,784,1047].forEach(function(n,i){setTimeout(function(){beep(n,.18,.32,'triangle');},i*115);});
    setTimeout(function(){beep(1047,.4,.38,'triangle');},480);
  }
  return {init:init,resume:resume,checkpoint:checkpoint,hit:hit,splash:splash,grass:grass,victory:victory};
})();
