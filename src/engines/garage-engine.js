// =============================================================================
// garage-engine.js — Marco 2.9.2: Garagem com 4 tampinhas PNG (sem paleta de cores)
// Tabela Supabase: cap_customization (user_id, pilot_id, template, color, last_change_at)
// Custos:
//   - 1ª customização (por piloto): grátis
//   - Trocar tampinha: 200 $CR
// Cor fixa por tampinha (vem do CAPS abaixo). O campo 'color' do banco vira
// 'auto' a partir deste marco — preservado pra retrocompat com registros antigos.
// =============================================================================

var GarageEngine = (function () {
  'use strict';

  var SURL = 'https://rigghudagbzrzadsbeml.supabase.co/rest/v1/';
  var SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZ2dodWRhZ2J6cnphZHNiZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzk4OTUsImV4cCI6MjA5MTk1NTg5NX0.2fXODjCXc7IjsF7KS5cAMC-jt9ovxturuQUKmiApO9A';
  var HDRS = { 'Content-Type': 'application/json', 'apikey': SKEY, 'Authorization': 'Bearer ' + SKEY };

  // ── 4 TAMPINHAS NFT (Marco 2.9.2) ────────────────────────────────────────
  // hex/accent = cor da tampinha (usada no canvas vetorial durante a corrida)
  // img        = PNG renderizado, usado em vitrines (Garagem, Dashboard, Card)
  // stats      = decorativo neste marco; afetará física no Marco 4 (OFICINA)
  // tagline_key= chave i18n da tagline ("Velocidade extrema", etc)
  var CAPS = [
    {
      id:'AETHERION', code:'CR-01', name:'AETHERION',
      hex:'#E62A2A', accent:'#7a0000', icon:'⚡',
      img:'/assets/images/caps/aetherion.png',
      stats:{ velocidade:90, aceleracao:88, controle:60, aderencia:55 },
      tagline_key:'cap_aetherion_tag'
    },
    {
      id:'SOLARA', code:'CR-02', name:'SOLARA',
      hex:'#1E90FF', accent:'#0a3a6e', icon:'❄',
      img:'/assets/images/caps/solara.png',
      stats:{ velocidade:70, aceleracao:65, controle:88, aderencia:90 },
      tagline_key:'cap_solara_tag'
    },
    {
      id:'VERDANTCORE', code:'CR-03', name:'VERDANTCORE',
      hex:'#3DB838', accent:'#1a4810', icon:'🌿',
      img:'/assets/images/caps/verdantcore.png',
      stats:{ velocidade:78, aceleracao:78, controle:78, aderencia:78 },
      tagline_key:'cap_verdantcore_tag'
    },
    {
      id:'NOVAFLUX', code:'CR-04', name:'NOVAFLUX',
      hex:'#9D4EDD', accent:'#4a1a5a', icon:'★',
      img:'/assets/images/caps/novaflux.png',
      stats:{ velocidade:82, aceleracao:90, controle:75, aderencia:70 },
      tagline_key:'cap_novaflux_tag'
    }
  ];

  // ── COMPAT LEGACY ────────────────────────────────────────────────────────
  // Mapeia IDs antigos (CT-01..CT-06) para os novos para registros já salvos.
  var LEGACY_MAP = {
    'CT-01':'AETHERION',
    'CT-02':'SOLARA',
    'CT-03':'VERDANTCORE',
    'CT-04':'NOVAFLUX',
    'CT-05':'AETHERION',
    'CT-06':'VERDANTCORE'
  };

  var COSTS = { change:200 };

  function _wallet() {
    var w = localStorage.getItem('caprush_wallet') || '';
    if (!w) {
      try { w = (JSON.parse(localStorage.getItem('caprush_privy_session') || '{}')).id || ''; } catch (e) {}
    }
    return w;
  }

  function _key(pid){ return 'caprush_garage_' + pid; }
  function _default(){ return { template:'AETHERION', last_change_at:null, is_first:true }; }

  function _normalize(id){
    if(!id) return 'AETHERION';
    if(LEGACY_MAP[id]) return LEGACY_MAP[id];
    var ok = false;
    for(var i=0;i<CAPS.length;i++){ if(CAPS[i].id === id){ ok = true; break; } }
    return ok ? id : 'AETHERION';
  }

  function _getLocal(pilotId){
    var raw;
    try { raw = JSON.parse(localStorage.getItem(_key(pilotId)) || 'null') || _default(); }
    catch(e){ raw = _default(); }
    raw.template = _normalize(raw.template);
    return raw;
  }
  function _setLocal(pilotId, data){ localStorage.setItem(_key(pilotId), JSON.stringify(data)); }

  function _sbUpsert(table, body) {
    return fetch(SURL + table, {
      method: 'POST',
      headers: Object.assign({}, HDRS, { 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }
  function _sbGet(table, params) {
    return fetch(SURL + table + (params ? '?' + params : ''), { headers: HDRS })
      .then(function (r) { return r.json(); });
  }

  // ── API pública ──────────────────────────────────────────────────────────

  function getCap(id){
    var nid = _normalize(id);
    for(var i=0;i<CAPS.length;i++){ if(CAPS[i].id === nid) return CAPS[i]; }
    return CAPS[0];
  }

  function get(pilotId){
    var d = _getLocal(pilotId);
    var cap = getCap(d.template);
    return {
      template: d.template,
      hex: cap.hex,
      accent: cap.accent,
      img: cap.img,
      name: cap.name,
      code: cap.code,
      stats: cap.stats,
      isFirst: !!d.is_first,
      lastChangeAt: d.last_change_at
    };
  }

  function getCurrent(){
    if(typeof PilotsData === 'undefined') return null;
    var p = PilotsData.getSelected();
    if(!p) return null;
    return get(p.id);
  }

  function calcCost(pilotId, newTemplate){
    var cur = _getLocal(pilotId);
    if(cur.is_first) return 0;
    if(_normalize(newTemplate) === cur.template) return 0;
    return COSTS.change;
  }

  function apply(pilotId, newTemplate, onDone){
    var nid = _normalize(newTemplate);
    var validTpl = false;
    for(var i=0;i<CAPS.length;i++){ if(CAPS[i].id === nid){ validTpl = true; break; } }
    if(!validTpl){ if(onDone) onDone({ ok:false, err:'invalid_template' }); return; }

    var cost = calcCost(pilotId, nid);

    function _save(){
      var data = {
        template: nid,
        last_change_at: new Date().toISOString(),
        is_first: false
      };
      _setLocal(pilotId, data);
      var w = _wallet();
      if(w){
        _sbUpsert('cap_customization', {
          user_id: w, pilot_id: pilotId,
          template: nid, color: 'auto',
          last_change_at: data.last_change_at
        }).catch(function(){});
      }
      if(onDone) onDone({ ok:true, cost:cost });
    }

    if(cost === 0){ _save(); return; }
    if(typeof CREngine === 'undefined'){ if(onDone) onDone({ ok:false, err:'no_cr_engine' }); return; }
    CREngine.getBalance(function(balance){
      if(balance < cost){ if(onDone) onDone({ ok:false, err:'insufficient_cr', cost:cost, balance:balance }); return; }
      CREngine.spendCR(cost, 'garage_change',
        'Garagem ' + pilotId + ' → ' + nid,
        function(ok){
          if(!ok){ if(onDone) onDone({ ok:false, err:'spend_failed' }); return; }
          _save();
        });
    });
  }

  function loadAll(onDone){
    var w = _wallet();
    if(!w){ if(onDone) onDone({}); return; }
    _sbGet('cap_customization', 'user_id=eq.' + encodeURIComponent(w)).then(function(rows){
      var result = {};
      (rows || []).forEach(function(r){
        var data = {
          template: _normalize(r.template),
          last_change_at: r.last_change_at,
          is_first: false
        };
        _setLocal(r.pilot_id, data);
        result[r.pilot_id] = data;
      });
      if(onDone) onDone(result);
    }).catch(function(){ if(onDone) onDone({}); });
  }

  // ── COMPAT LEGACY (não quebra código antigo) ─────────────────────────────
  function getColor(/*ignored*/){
    return { id:'auto', name:'Auto', hex:'#FFFFFF', accent:'#888888' };
  }
  function getTemplate(id){
    var c = getCap(id);
    return { id: c.id, name: c.name, inspiration: c.code, desc: c.name };
  }

  return {
    CAPS: CAPS, COSTS: COSTS,
    get: get, getCap: getCap, getCurrent: getCurrent,
    apply: apply, calcCost: calcCost, loadAll: loadAll,
    TEMPLATES: CAPS, COLORS: [],
    getColor: getColor, getTemplate: getTemplate
  };
})();
