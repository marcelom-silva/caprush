// =============================================================================
// pilots-data.js — Marco 2.9: Catálogo único de pilotos (source-of-truth)
// Marco 2.9.1 (refactor): paths das imagens atualizados pra assets/images/pilots/
// =============================================================================

var PilotsData = (function () {
  'use strict';

  var PILOTS = [
    // ── COMUNS (3 jogáveis desde o início, custo 0) ──────────────────────────
    {
      id:'CAL', code:'#CR-0001', rarity:'comum', cost:0, locked:false, playable:true,
      name:'CAL', species:'Pug Onyx',
      color:'#BBBBBB', accent:'#888888', kanji:'\u5929',
      img:'/assets/images/pilots/cal-piloto.png',
      stats:{ speed:80, ctrl:82, aero:78 },
      lore:'Pug anjo de pelagem onyx. Auréola dourada flutua acima — protege quem segura o turbo até o último segundo.'
    },
    {
      id:'JOAO', code:'#CR-0002', rarity:'comum', cost:0, locked:false, playable:true,
      name:'JOÃO', species:'Gato Anjinho',
      color:'#FF3333', accent:'#7a0000', kanji:'\u7FFC',
      img:'/assets/images/pilots/joao-piloto.png',
      stats:{ speed:78, ctrl:78, aero:84 },
      lore:'Gato angelical de óculos de aviador. Asa única — voa nas curvas inclinadas e plana com o vento de cauda.'
    },
    {
      id:'SHERLOCK', code:'#CR-0003', rarity:'comum', cost:0, locked:false, playable:true,
      name:'SHERLOCK', species:'Shih-tzu Detective',
      color:'#5A8AD8', accent:'#1a3a5a', kanji:'\u8B0E',
      img:'/assets/images/pilots/sherlock-piloto.png',
      stats:{ speed:78, ctrl:84, aero:78 },
      lore:'Shih-tzu detetive com cachimbo e boina. Lê a pista antes de cada lance — adversário traçado, decifrado.'
    },

    // ── INCOMUNS (bloqueados — 400 $CR) ──────────────────────────────────────
    {
      id:'PLUSH', code:'#CR-0004', rarity:'incomum', cost:400, locked:true, playable:true,
      name:'PLUSH', species:'Poodle Aristocrata',
      color:'#DDDDDD', accent:'#888888', kanji:'\u96EA',
      img:'/assets/images/pilots/plush-piloto.png',
      stats:{ speed:82, ctrl:86, aero:84 },
      lore:'Poodle aristocrata de macacão e gola alta. Não molha as patas em poças e conhece o melhor traçado.'
    },
    {
      id:'URUBU_MENGAO', code:'#CR-0005', rarity:'incomum', cost:400, locked:true, playable:true,
      name:'URUBU MENGÃO', species:'Mascote Rubro-Negro',
      color:'#DC143C', accent:'#1a1a1a', kanji:'\u9CE5',
      img:'/assets/images/pilots/urubu-mengao-piloto.png',
      stats:{ speed:84, ctrl:82, aero:86 },
      lore:'Urubu rubro-negro de macacão Mengão. Asas estendidas dão velocidade aerodinâmica em retas longas.'
    },

    // ── RARAS (bloqueados — 1.200 / 2.000 $CR) ───────────────────────────────
    {
      id:'DUO', code:'#CR-0006', rarity:'rara', cost:1200, locked:true, playable:true,
      name:'DUO', species:'Border Collie Fusion',
      color:'#9D4EDD', accent:'#4a1a5a', kanji:'\u96D9',
      img:'/assets/images/pilots/duo-collie-piloto.png',
      stats:{ speed:88, ctrl:88, aero:88 },
      lore:'Fusão dos Border Collies. Dois cérebros, uma tampinha. Sincronia perfeita nas curvas.'
    },
    {
      id:'BITKONG', code:'#CR-0007', rarity:'rara', cost:2000, locked:true, playable:true,
      name:'BITKONG', species:'Macaco Viking',
      color:'#F7931A', accent:'#7a3a00', kanji:'\u632F',
      img:'/assets/images/pilots/bitkong-piloto.png',
      stats:{ speed:90, ctrl:86, aero:88 },
      lore:'Macaco viking com elmo dourado e símbolo Bitcoin no peito. Resiliente — não para mesmo após colisões pesadas.'
    },

    // ── MÍTICAS (bloqueados — 3.500 $CR) ─────────────────────────────────────
    {
      id:'BRUNA', code:'#CR-0008', rarity:'mitica', cost:3500, locked:true, playable:true,
      name:'BRUNA', species:'SRD',
      color:'#FF5555', accent:'#7a0000', kanji:'\u308A',
      img:'/assets/images/pilots/bruna-piloto.png',
      stats:{ speed:90, ctrl:94, aero:92 },
      lore:'Macacão vermelho e lacinho azul. Rainha das curvas fechadas.'
    },
    {
      id:'KENTA', code:'#CR-0009', rarity:'mitica', cost:3500, locked:true, playable:true,
      name:'KENTA', species:'Maine Coon Tabby',
      color:'#FF8C00', accent:'#7a3a00', kanji:'\u9B54',
      img:'/assets/images/pilots/kenta-piloto.png',
      stats:{ speed:94, ctrl:90, aero:92 },
      lore:'Piloto veterano do norte. Capacete customizado deixa os tufos das orelhas de fora para sentir o vento.'
    },
    {
      id:'YUKI', code:'#CR-0010', rarity:'mitica', cost:3500, locked:true, playable:true,
      name:'YUKI', species:'Samoieda',
      color:'#00E5FF', accent:'#0a5a7a', kanji:'\u96EA',
      img:'/assets/images/pilots/yuki-piloto.png',
      stats:{ speed:92, ctrl:94, aero:90 },
      lore:'Óculos retrô dos anos 60 e cachecol ao vento. Foco em controle nas curvas.'
    },

    // ── LENDÁRIA (bloqueada — 5.500 $CR) ─────────────────────────────────────
    {
      id:'TAPZ', code:'#CR-0011', rarity:'lendaria', cost:5500, locked:true, playable:true,
      name:'TAPZ', species:'Lebre Aerodinâmica',
      color:'#FFD700', accent:'#7a5a00', kanji:'\u91D1',
      img:'/assets/images/pilots/tapz-piloto.png',
      stats:{ speed:97, ctrl:95, aero:96 },
      lore:'Lebre de macacão dourado. Velocidade pura, aerodinâmica imbatível em retas longas.'
    },

    // ── BOSS (não jogável — apenas IA do Solo) ───────────────────────────────
    {
      id:'RACER_D', code:'#CR-BOSS', rarity:'boss', cost:-1, locked:true, playable:false,
      name:'RACER-D', species:'???',
      color:'#FF2A2A', accent:'#7a0000', kanji:'\u9B3C',
      img:'/assets/images/pilots/racer-x-piloto.png',
      stats:{ speed:99, ctrl:99, aero:99 },
      lore:'O piloto fantasma. Aparece apenas nos tempos lendários. Ninguém venceu ainda.'
    }
  ];

  var INDEX = {};
  PILOTS.forEach(function(p){ INDEX[p.id] = p; });

  function _key(suffix){ return 'caprush_' + suffix; }

  function getUnlocked(){
    var unlocked = [];
    PILOTS.forEach(function(p){ if(!p.locked && p.playable) unlocked.push(p.id); });
    try {
      var bought = JSON.parse(localStorage.getItem(_key('owned_pilots')) || '[]');
      bought.forEach(function(id){
        if(INDEX[id] && unlocked.indexOf(id) === -1) unlocked.push(id);
      });
    } catch(e){}
    return unlocked;
  }

  function isUnlocked(id){ return getUnlocked().indexOf(id) !== -1; }

  function unlock(id){
    if(!INDEX[id]) return false;
    var bought;
    try { bought = JSON.parse(localStorage.getItem(_key('owned_pilots')) || '[]'); }
    catch(e){ bought = []; }
    if(bought.indexOf(id) === -1){
      bought.push(id);
      localStorage.setItem(_key('owned_pilots'), JSON.stringify(bought));
    }
    return true;
  }

  function getSelected(){
    var pid = localStorage.getItem(_key('pilot'));
    if(!pid) return null;
    if(!INDEX[pid] || !INDEX[pid].playable){
      localStorage.removeItem(_key('pilot'));
      return null;
    }
    if(!isUnlocked(pid)){
      localStorage.removeItem(_key('pilot'));
      return null;
    }
    return INDEX[pid];
  }

  function select(id){
    if(!INDEX[id] || !INDEX[id].playable) return false;
    if(!isUnlocked(id)) return false;
    localStorage.setItem(_key('pilot'), id);
    return true;
  }

  function loadOwnedFromSupabase(SURL, HDRS, wallet, onDone){
    if(!wallet){ if(onDone) onDone([]); return; }
    fetch(SURL + 'user_pilots_owned?user_id=eq.' + encodeURIComponent(wallet),
          { headers: HDRS })
      .then(function(r){ return r.json(); })
      .then(function(rows){
        var ids = (rows || []).map(function(r){ return r.pilot_id; });
        try {
          var current = JSON.parse(localStorage.getItem(_key('owned_pilots')) || '[]');
          ids.forEach(function(id){ if(current.indexOf(id) === -1) current.push(id); });
          localStorage.setItem(_key('owned_pilots'), JSON.stringify(current));
        } catch(e){}
        if(onDone) onDone(ids);
      })
      .catch(function(){ if(onDone) onDone([]); });
  }

  return {
    all:           function(){ return PILOTS.slice(); },
    byId:          function(id){ return INDEX[id] || null; },
    byRarity:      function(r){ return PILOTS.filter(function(p){ return p.rarity === r; }); },
    rarityOrder:   ['comum','incomum','rara','mitica','lendaria','boss'],
    rarityLabels:  { comum:'COMUM', incomum:'INCOMUM', rara:'RARA', mitica:'MÍTICA', lendaria:'LENDÁRIA', boss:'BOSS' },
    rarityColors:  { comum:'#BBBBBB', incomum:'#3DB838', rara:'#9D4EDD', mitica:'#FF44AA', lendaria:'#FFD700', boss:'#FF2A2A' },
    getUnlocked:   getUnlocked,
    isUnlocked:    isUnlocked,
    unlock:        unlock,
    getSelected:   getSelected,
    select:        select,
    loadOwnedFromSupabase: loadOwnedFromSupabase
  };
})();
