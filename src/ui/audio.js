// audio.js — CapRush Overdrive! Smart Audio Router v2
// lepiten.ogg  → todas as páginas (default)
// watertide.ogg→ caprush-game.html e game-multi-online.html
// martini.ogg  → game-multi-local.html
(function(){
  'use strict';

  var BASE = '/game/assets/audio/music/';

  var TRACK_MAP = {
    'caprush-game': 'watertide.ogg',   // Solo vs IA
    'game-multi':   'martini.ogg',     // 1v1 Local AND Online (ambos usam martini)
  };

  function getTrackSrc(){
    var path = window.location.pathname;
    for(var key in TRACK_MAP){
      if(path.indexOf(key) !== -1) return BASE + TRACK_MAP[key];
    }
    return BASE + 'lepiten.ogg';
  }

  var bgAudio   = null;
  var currentSrc = '';
  var _enabled  = localStorage.getItem('audioEnabled') !== 'false';

  function createAudio(src){
    var a = new Audio(src);
    a.loop    = true;
    a.volume  = 0.40;
    a.preload = 'auto';
    return a;
  }

  function initAudio(){
    var newSrc = getTrackSrc();
    if(bgAudio && currentSrc === newSrc) return;
    if(bgAudio){ bgAudio.pause(); bgAudio = null; }
    bgAudio    = createAudio(newSrc);
    currentSrc = newSrc;
    window.bgAudio = bgAudio; // expose globally
  }

  function updateBtn(playing){
    var btn = document.getElementById('soundBtn');
    if(btn) btn.textContent = playing ? '🔊' : '🔇';
  }

  // Public API ─────────────────────────────────────────────────────────
  window.playAudio = function(){
    initAudio();
    if(!_enabled) return;
    bgAudio.play()
      .then(function(){ updateBtn(true); })
      .catch(function(){
        // Autoplay blocked — resolve on next click
        document.addEventListener('click', function once(){
          if(_enabled && bgAudio && bgAudio.paused)
            bgAudio.play().then(function(){ updateBtn(true); }).catch(function(){});
        }, { once: true });
      });
  };

  window.toggleAudio = function(){
    initAudio();
    if(bgAudio.paused){
      bgAudio.play().then(function(){ _enabled=true; localStorage.setItem('audioEnabled','true'); updateBtn(true); }).catch(function(){});
    } else {
      bgAudio.pause(); _enabled=false; localStorage.setItem('audioEnabled','false'); updateBtn(false);
    }
  };

  // Alias used by some pages
  window.toggleBGM = window.toggleAudio;

  // ── Auto-start ───────────────────────────────────────────────────────
  window.addEventListener('load', function(){
    updateBtn(_enabled);
    if(_enabled){
      initAudio();
      bgAudio.play()
        .then(function(){ updateBtn(true); })
        .catch(function(){
          // Fallback: play on first user gesture anywhere on page
          document.addEventListener('click', function once(){
            if(_enabled && bgAudio && bgAudio.paused)
              bgAudio.play().then(function(){ updateBtn(true); }).catch(function(){});
          }, { once: true });
        });
    }
  });

  // Handle page transitions (same-origin SPA style) — keep music going
  window.addEventListener('pageshow', function(){
    if(_enabled && bgAudio && bgAudio.paused && !bgAudio.ended){
      bgAudio.play().catch(function(){});
    }
  });
})();
