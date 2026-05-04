// =============================================================================
// badges-engine.js — Marco 2.9: Sistema de Badges/Conquistas
// Tabela Supabase: badges_earned
// =============================================================================

var BadgesEngine = (function () {
  'use strict';

  var SURL = 'https://rigghudagbzrzadsbeml.supabase.co/rest/v1/';
  var SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZ2dodWRhZ2J6cnphZHNiZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzk4OTUsImV4cCI6MjA5MTk1NTg5NX0.2fXODjCXc7IjsF7KS5cAMC-jt9ovxturuQUKmiApO9A';
  var HDRS = { 'Content-Type': 'application/json', 'apikey': SKEY, 'Authorization': 'Bearer ' + SKEY };

  var CATALOG = [
    { code:'DEDICADO',     name:'DEDICADO',     icon:'🔥', desc:'Completou 30 dias seguidos no daily login', color:'#FF6B00' },
    { code:'BOSS_SLAYER',  name:'BOSS SLAYER',  icon:'👑', desc:'Venceu Racer-D no Hard Solo',                color:'#FF2A2A' },
    { code:'FIRST_BLOOD',  name:'FIRST BLOOD',  icon:'⚔️', desc:'Primeira vitória em corrida PVP',            color:'#9D4EDD' },
    { code:'GARAGE_RAT',   name:'GARAGE RAT',   icon:'🔧', desc:'Personalizou sua primeira tampinha',         color:'#00E5FF' },
    { code:'SPEED_DEMON',  name:'SPEED DEMON',  icon:'⚡', desc:'50 vitórias acumuladas no Solo',             color:'#FFD700' },
    { code:'CLAN_FOUNDER', name:'CLAN FOUNDER', icon:'🏰', desc:'Fundou um clã no CapRush',                   color:'#3DB838' }
  ];

  var INDEX = {};
  CATALOG.forEach(function(b){ INDEX[b.code] = b; });

  function _wallet() {
    var w = localStorage.getItem('caprush_wallet') || '';
    if (!w) {
      try { w = (JSON.parse(localStorage.getItem('caprush_privy_session') || '{}')).id || ''; } catch (e) {}
    }
    return w;
  }

  function _getLocal(){
    try { return JSON.parse(localStorage.getItem('caprush_badges') || '{}'); }
    catch(e){ return {}; }
  }

  function _setLocal(map){ localStorage.setItem('caprush_badges', JSON.stringify(map)); }

  function _sbInsert(body){
    return fetch(SURL + 'badges_earned', {
      method: 'POST',
      headers: Object.assign({}, HDRS, { 'Prefer': 'resolution=ignore-duplicates' }),
      body: JSON.stringify(body)
    }).then(function(r){ return r.json(); });
  }

  function _sbGet(){
    var w = _wallet();
    if(!w) return Promise.resolve([]);
    return fetch(SURL + 'badges_earned?user_id=eq.' + encodeURIComponent(w),
                 { headers: HDRS }).then(function(r){ return r.json(); });
  }

  function load(onDone){
    _sbGet().then(function(rows){
      var map = _getLocal();
      (rows || []).forEach(function(r){
        if(!map[r.badge_code]){ map[r.badge_code] = r.earned_at || new Date().toISOString(); }
      });
      _setLocal(map);
      if(onDone) onDone(map);
    }).catch(function(){ if(onDone) onDone(_getLocal()); });
  }

  function has(code){ var m = _getLocal(); return !!m[code]; }

  function grant(code, onDone){
    if(!INDEX[code]){ if(onDone) onDone(false); return; }
    var map = _getLocal();
    if(map[code]){ if(onDone) onDone(false); return; }
    var now = new Date().toISOString();
    map[code] = now;
    _setLocal(map);
    var w = _wallet();
    if(w){
      _sbInsert({ user_id: w, badge_code: code, earned_at: now }).catch(function(){});
    }
    if(typeof window !== 'undefined' && document && document.body){
      _showToast(INDEX[code]);
    }
    if(onDone) onDone(true);
  }

  function _showToast(badge){
    var t = document.createElement('div');
    t.style.cssText = 'position:fixed;top:80px;right:20px;background:rgba(10,10,22,.96);' +
      'border:2px solid '+badge.color+';border-radius:14px;padding:14px 18px;z-index:9999;' +
      'box-shadow:0 8px 30px '+badge.color+'40;animation:badgeSlide .4s ease;' +
      'max-width:320px;font-family:Rajdhani,sans-serif;color:#EEE;';
    t.innerHTML =
      '<div style="font-size:.6rem;letter-spacing:3px;color:'+badge.color+';margin-bottom:4px;">' +
        '🏆 BADGE DESBLOQUEADA' +
      '</div>' +
      '<div style="font-family:Bebas Neue;font-size:1.2rem;letter-spacing:2px;">' +
        badge.icon + ' ' + badge.name +
      '</div>' +
      '<div style="font-size:.78rem;color:#aaa;margin-top:3px;">' + badge.desc + '</div>';
    document.body.appendChild(t);
    setTimeout(function(){ t.style.opacity='0'; t.style.transition='opacity .4s'; }, 4000);
    setTimeout(function(){ t.remove(); }, 4500);
  }

  function getAll(){
    var map = _getLocal();
    return CATALOG.map(function(b){
      return Object.assign({}, b, { earned: !!map[b.code], earned_at: map[b.code] || null });
    });
  }

  return { CATALOG: CATALOG, load: load, has: has, grant: grant, getAll: getAll };
})();
