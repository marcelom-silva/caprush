// =============================================================================
// pilot-evolution.js — Marco 2.5+ atualizado para Marco 2.9
// =============================================================================

var PilotEvolution = (function () {
  'use strict';

  var SURL = 'https://rigghudagbzrzadsbeml.supabase.co/rest/v1/';
  var SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZ2dodWRhZ2J6cnphZHNiZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzk4OTUsImV4cCI6MjA5MTk1NTg5NX0.2fXODjCXc7IjsF7KS5cAMC-jt9ovxturuQUKmiApO9A';
  var HDRS = { 'Content-Type': 'application/json', 'apikey': SKEY, 'Authorization': 'Bearer ' + SKEY };

  var CAP_PTS         = 25;
  var RESET_COST_CR   = 5;
  var FREE_RESET_DAYS = 30;

  var PILOTS_BASE = {
    CAL:          { speed:80, ctrl:82, aero:78 },
    JOAO:         { speed:78, ctrl:78, aero:84 },
    SHERLOCK:     { speed:78, ctrl:84, aero:78 },
    PLUSH:        { speed:82, ctrl:86, aero:84 },
    URUBU_MENGAO: { speed:84, ctrl:82, aero:86 },
    DUO:          { speed:88, ctrl:88, aero:88 },
    BITKONG:      { speed:90, ctrl:86, aero:88 },
    BRUNA:        { speed:90, ctrl:94, aero:92 },
    KENTA:        { speed:94, ctrl:90, aero:92 },
    YUKI:         { speed:92, ctrl:94, aero:90 },
    TAPZ:         { speed:97, ctrl:95, aero:96 }
  };

  function _getBaseStats(pilot){
    if(typeof PilotsData !== 'undefined'){
      var p = PilotsData.byId(pilot);
      if(p && p.stats) return p.stats;
    }
    return PILOTS_BASE[pilot] || { speed: 80, ctrl: 80, aero: 80 };
  }

  function _wallet() {
    var w = localStorage.getItem('caprush_wallet') || '';
    if (!w) {
      try { w = (JSON.parse(localStorage.getItem('caprush_privy_session') || '{}')).id || ''; } catch (e) {}
    }
    return w;
  }

  function _cacheKey(pilot) { return 'evo_' + _wallet() + '_' + pilot; }
  function _default() {
    return { speed_pts: 0, ctrl_pts: 0, aero_pts: 0, pts_available: 0, pts_total_ever: 0, last_free_reset: new Date().toISOString() };
  }
  function _getLocal(pilot) {
    try { return JSON.parse(localStorage.getItem(_cacheKey(pilot)) || 'null') || _default(); }
    catch (e) { return _default(); }
  }
  function _setLocal(pilot, data) { localStorage.setItem(_cacheKey(pilot), JSON.stringify(data)); }
  function _sbGet(table, params) {
    return fetch(SURL + table + (params ? '?' + params : ''), { headers: HDRS }).then(function (r) { return r.json(); });
  }
  function _sbUpsert(table, body) {
    return fetch(SURL + table, {
      method: 'POST',
      headers: Object.assign({}, HDRS, { 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }

  function getMultipliers(pilot) {
    var evo = _getLocal(pilot);
    return {
      speedMult: 1 + Math.min(evo.speed_pts, CAP_PTS) * 0.008,
      ctrlMult:  1 + Math.min(evo.ctrl_pts,  CAP_PTS) * 0.008,
      aeroMult:  1 + Math.min(evo.aero_pts,  CAP_PTS) * 0.006,
    };
  }

  function getFinalStats(pilot) {
    var base = _getBaseStats(pilot);
    var evo  = _getLocal(pilot);
    var spts = Math.min(evo.speed_pts, CAP_PTS);
    var cpts = Math.min(evo.ctrl_pts,  CAP_PTS);
    var apts = Math.min(evo.aero_pts,  CAP_PTS);
    return {
      speed: Math.round(base.speed * (1 + spts * 0.008)),
      ctrl:  Math.round(base.ctrl  * (1 + cpts * 0.008)),
      aero:  Math.round(base.aero  * (1 + apts * 0.006)),
      speed_base: base.speed, ctrl_base: base.ctrl, aero_base: base.aero,
      speed_pts: evo.speed_pts, ctrl_pts: evo.ctrl_pts, aero_pts: evo.aero_pts,
      pts_available: evo.pts_available, pts_total_ever: evo.pts_total_ever,
      pts_used: (evo.speed_pts + evo.ctrl_pts + evo.aero_pts),
      last_free_reset: evo.last_free_reset,
    };
  }

  function loadAll(onDone) {
    var w = _wallet();
    if (!w) { if (onDone) onDone({}); return; }
    _sbGet('pilot_evolution', 'wallet=eq.' + encodeURIComponent(w)).then(function (rows) {
      var result = {};
      (rows || []).forEach(function (row) { _setLocal(row.pilot, row); result[row.pilot] = row; });
      if (onDone) onDone(result);
    }).catch(function () { if (onDone) onDone({}); });
  }

  function awardPoints(pilot, pts, onDone) {
    var evo = _getLocal(pilot);
    evo.pts_available  = (evo.pts_available  || 0) + pts;
    evo.pts_total_ever = (evo.pts_total_ever || 0) + pts;
    _setLocal(pilot, evo);
    var w = _wallet();
    if (!w) { if (onDone) onDone(true); return; }
    _sbUpsert('pilot_evolution', {
      wallet: w, pilot: pilot,
      speed_pts: evo.speed_pts, ctrl_pts: evo.ctrl_pts, aero_pts: evo.aero_pts,
      pts_available: evo.pts_available, pts_total_ever: evo.pts_total_ever,
      last_free_reset: evo.last_free_reset, updated_at: new Date().toISOString()
    }).then(function () { if (onDone) onDone(true); }).catch(function () { if (onDone) onDone(false); });
  }

  function distribute(pilot, speedPts, ctrlPts, aeroPts, onDone) {
    speedPts = Math.max(0, Math.min(speedPts, CAP_PTS));
    ctrlPts  = Math.max(0, Math.min(ctrlPts,  CAP_PTS));
    aeroPts  = Math.max(0, Math.min(aeroPts,  CAP_PTS));
    var evo = _getLocal(pilot);
    var total = speedPts + ctrlPts + aeroPts;
    if (total > evo.pts_total_ever) {
      if (onDone) onDone({ ok: false, err: 'insufficient', available: evo.pts_total_ever });
      return;
    }
    evo.speed_pts = speedPts; evo.ctrl_pts = ctrlPts; evo.aero_pts = aeroPts;
    evo.pts_available = evo.pts_total_ever - total;
    _setLocal(pilot, evo);
    var w = _wallet();
    if (!w) { if (onDone) onDone({ ok: true, evo: evo }); return; }
    _sbUpsert('pilot_evolution', {
      wallet: w, pilot: pilot,
      speed_pts: evo.speed_pts, ctrl_pts: evo.ctrl_pts, aero_pts: evo.aero_pts,
      pts_available: evo.pts_available, pts_total_ever: evo.pts_total_ever,
      last_free_reset: evo.last_free_reset, updated_at: new Date().toISOString()
    }).then(function () { if (onDone) onDone({ ok: true, evo: evo }); })
      .catch(function () { if (onDone) onDone({ ok: false, err: 'db_error' }); });
  }

  function reset(pilot, paid, onDone) {
    var evo = _getLocal(pilot);
    var now = new Date();
    var lastReset = new Date(evo.last_free_reset || 0);
    var daysSince = (now - lastReset) / (1000 * 60 * 60 * 24);
    if (!paid && daysSince < FREE_RESET_DAYS) {
      var daysLeft = Math.ceil(FREE_RESET_DAYS - daysSince);
      if (onDone) onDone({ ok: false, err: 'too_soon', days_left: daysLeft });
      return;
    }
    function _doReset() {
      evo.speed_pts = 0; evo.ctrl_pts = 0; evo.aero_pts = 0;
      evo.pts_available = evo.pts_total_ever;
      if (!paid) evo.last_free_reset = now.toISOString();
      _setLocal(pilot, evo);
      var w = _wallet();
      if (!w) { if (onDone) onDone({ ok: true, evo: evo }); return; }
      _sbUpsert('pilot_evolution', {
        wallet: w, pilot: pilot, speed_pts: 0, ctrl_pts: 0, aero_pts: 0,
        pts_available: evo.pts_total_ever, pts_total_ever: evo.pts_total_ever,
        last_free_reset: evo.last_free_reset, updated_at: now.toISOString()
      }).then(function () { if (onDone) onDone({ ok: true, evo: evo }); })
        .catch(function () { if (onDone) onDone({ ok: false, err: 'db_error' }); });
    }
    if (paid) {
      if (typeof CREngine === 'undefined') { if (onDone) onDone({ ok: false, err: 'no_cr_engine' }); return; }
      CREngine.getBalance(function (balance) {
        if (balance < RESET_COST_CR) {
          if (onDone) onDone({ ok: false, err: 'insufficient_cr', cost: RESET_COST_CR, balance: balance });
          return;
        }
        CREngine.spendCR(RESET_COST_CR, 'pilot_reset', 'Reset de stats: ' + pilot, function (ok) {
          if (!ok) { if (onDone) onDone({ ok: false, err: 'spend_failed' }); return; }
          _doReset();
        });
      });
    } else { _doReset(); }
  }

  function daysUntilFreeReset(pilot) {
    var evo = _getLocal(pilot);
    var daysSince = (Date.now() - new Date(evo.last_free_reset || 0)) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.ceil(FREE_RESET_DAYS - daysSince));
  }
  function canFreeReset(pilot) { return daysUntilFreeReset(pilot) === 0; }

  return {
    loadAll: loadAll, getMultipliers: getMultipliers, getFinalStats: getFinalStats,
    awardPoints: awardPoints, distribute: distribute, reset: reset,
    canFreeReset: canFreeReset, daysUntilFreeReset: daysUntilFreeReset,
    PILOTS_BASE: PILOTS_BASE, CAP_PTS: CAP_PTS, RESET_COST_CR: RESET_COST_CR
  };
})();
