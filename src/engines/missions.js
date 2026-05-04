// =============================================================================
// missions.js — Marco 2.5: Sistema de Missões e Recompensas de Evolução
// Fica na raiz do projeto. Depende de: pilot-evolution.js
// =============================================================================

var Missions = (function () {
  'use strict';

  var SURL = 'https://rigghudagbzrzadsbeml.supabase.co/rest/v1/';
  var SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZ2dodWRhZ2J6cnphZHNiZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzk4OTUsImV4cCI6MjA5MTk1NTg5NX0.2fXODjCXc7IjsF7KS5cAMC-jt9ovxturuQUKmiApO9A';
  var HDRS = { 'Content-Type': 'application/json', 'apikey': SKEY, 'Authorization': 'Bearer ' + SKEY };

  // ==========================================================================
  // Definição completa das 19 missões
  // trigger: evento que dispara a verificação
  // once:    true = missão única; false = repetível
  // max:     máximo de vezes que pode completar (para missões repetíveis)
  // check:   função que verifica os contadores
  // ==========================================================================
  var DEFS = [
    {
      id: 'first_solo',   pts: 2,  once: true,  trigger: 'solo_race',
      name_key: 'miss_first_solo', desc_key: 'miss_first_solo_d',
      check: function (c) { return c.solo_races >= 1; }
    },
    {
      id: 'first_win',    pts: 3,  once: true,  trigger: 'multi_win',
      name_key: 'miss_first_win', desc_key: 'miss_first_win_d',
      check: function (c) { return c.multi_wins >= 1; }
    },
    {
      id: 'solo_10',      pts: 5,  once: true,  trigger: 'solo_race',
      name_key: 'miss_solo_10', desc_key: 'miss_solo_10_d',
      check: function (c) { return c.solo_races >= 10; }
    },
    {
      id: 'solo_25',      pts: 8,  once: true,  trigger: 'solo_race',
      name_key: 'miss_solo_25', desc_key: 'miss_solo_25_d',
      check: function (c) { return c.solo_races >= 25; }
    },
    {
      id: 'solo_50',      pts: 12, once: true,  trigger: 'solo_race',
      name_key: 'miss_solo_50', desc_key: 'miss_solo_50_d',
      check: function (c) { return c.solo_races >= 50; }
    },
    {
      id: 'win_5',        pts: 6,  once: true,  trigger: 'multi_win',
      name_key: 'miss_win_5', desc_key: 'miss_win_5_d',
      check: function (c) { return c.multi_wins >= 5; }
    },
    {
      id: 'win_10',       pts: 10, once: true,  trigger: 'multi_win',
      name_key: 'miss_win_10', desc_key: 'miss_win_10_d',
      check: function (c) { return c.multi_wins >= 10; }
    },
    {
      id: 'record_1',     pts: 1,  once: false, max: 10, trigger: 'personal_record',
      name_key: 'miss_record_1', desc_key: 'miss_record_1_d',
      check: function () { return true; }   // qualquer recorde dispara
    },
    {
      id: 'record_5',     pts: 4,  once: true,  trigger: 'personal_record',
      name_key: 'miss_record_5', desc_key: 'miss_record_5_d',
      check: function (c) { return c.records >= 5; }
    },
    {
      id: 'streak_3',     pts: 5,  once: true,  trigger: 'multi_win',
      name_key: 'miss_streak_3', desc_key: 'miss_streak_3_d',
      check: function (c) { return c.win_streak >= 3; }
    },
    {
      id: 'streak_5',     pts: 8,  once: true,  trigger: 'multi_win',
      name_key: 'miss_streak_5', desc_key: 'miss_streak_5_d',
      check: function (c) { return c.win_streak >= 5; }
    },
    {
      id: 'use_kenta',    pts: 3,  once: true,  trigger: 'solo_race',
      name_key: 'miss_use_kenta', desc_key: 'miss_use_kenta_d',
      check: function (c) { return c.kenta_races >= 5; }
    },
    {
      id: 'use_yuki',     pts: 3,  once: true,  trigger: 'solo_race',
      name_key: 'miss_use_yuki', desc_key: 'miss_use_yuki_d',
      check: function (c) { return c.yuki_races >= 5; }
    },
    {
      id: 'all_pilots',   pts: 6,  once: true,  trigger: 'solo_race',
      name_key: 'miss_all_pilots', desc_key: 'miss_all_pilots_d',
      check: function (c) { return c.yuki_races >= 1 && c.kenta_races >= 1; }
    },
    {
      id: 'bet_first',    pts: 5,  once: true,  trigger: 'bet_win',
      name_key: 'miss_bet_first', desc_key: 'miss_bet_first_d',
      check: function (c) { return c.bet_wins >= 1; }
    },
    {
      id: 'bet_10',       pts: 12, once: true,  trigger: 'bet_win',
      name_key: 'miss_bet_10', desc_key: 'miss_bet_10_d',
      check: function (c) { return c.bet_wins >= 10; }
    },
    {
      id: 'cr_100',       pts: 8,  once: true,  trigger: 'cr_milestone',
      name_key: 'miss_cr_100', desc_key: 'miss_cr_100_d',
      check: function (c) { return c.cr_total_ever >= 100; }
    },
    {
      id: 'top3_week',    pts: 10, once: false, max: 99, trigger: 'ranking',
      name_key: 'miss_top3_week', desc_key: 'miss_top3_week_d',
      check: function () { return true; }
    },
    {
      id: 'top1_week',    pts: 15, once: false, max: 99, trigger: 'ranking',
      name_key: 'miss_top1_week', desc_key: 'miss_top1_week_d',
      check: function () { return true; }
    },
  ];

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _wallet() {
    var w = localStorage.getItem('caprush_wallet') || '';
    if (!w) { try { w = (JSON.parse(localStorage.getItem('caprush_privy_session') || '{}')).id || ''; } catch (e) {} }
    return w;
  }
  function _cKey() { return 'miss_counters_' + _wallet(); }
  function _dKey() { return 'miss_done_' + _wallet(); }

  function _getCounters() {
    try { return JSON.parse(localStorage.getItem(_cKey()) || '{}'); } catch (e) { return {}; }
  }
  function _saveCounters(c) { localStorage.setItem(_cKey(), JSON.stringify(c)); }
  function _getDone() {
    try { return JSON.parse(localStorage.getItem(_dKey()) || '{}'); } catch (e) { return {}; }
  }
  function _markDone(id) {
    var done = _getDone(); done[id] = (done[id] || 0) + 1;
    localStorage.setItem(_dKey(), JSON.stringify(done));
  }

  function _sbPost(table, body) {
    return fetch(SURL + table, {
      method: 'POST',
      headers: Object.assign({}, HDRS, { 'Prefer': 'return=minimal' }),
      body: JSON.stringify(body)
    });
  }

  function _saveToSupabase(missionId, pilot, pts) {
    var w = _wallet(); if (!w) return;
    _sbPost('missions_completed', {
      wallet: w, mission_id: missionId, pilot: pilot || '', pts_awarded: pts
    }).catch(function () {});
  }

  // ── API pública ────────────────────────────────────────────────────────────

  /**
   * checkAfterEvent(eventType, pilot, extraData, onDone)
   *
   * Chame no fim de cada corrida. Retorna array de missões recém completadas.
   * eventType: 'solo_race' | 'multi_win' | 'multi_loss' | 'personal_record'
   *            | 'bet_win' | 'cr_milestone' | 'ranking'
   * pilot: 'YUKI' | 'KENTA'
   * extraData: { cr_total_ever, position } (conforme o tipo)
   * onDone(awarded): chamado com lista de { def, pilot }
   */
  function checkAfterEvent(eventType, pilot, extraData, onDone) {
    var c    = _getCounters();
    var done = _getDone();
    pilot    = pilot || localStorage.getItem('caprush_pilot') || 'YUKI';
    extraData = extraData || {};

    // ── Incrementa contadores ─────────────────────────────────────────────
    if (eventType === 'solo_race') {
      c.solo_races  = (c.solo_races  || 0) + 1;
      if (pilot === 'YUKI')  c.yuki_races  = (c.yuki_races  || 0) + 1;
      if (pilot === 'KENTA') c.kenta_races = (c.kenta_races || 0) + 1;
    }
    if (eventType === 'multi_win') {
      c.multi_wins = (c.multi_wins || 0) + 1;
      c.win_streak = (c.win_streak || 0) + 1;
    }
    if (eventType === 'multi_loss') {
      c.win_streak = 0;
    }
    if (eventType === 'personal_record') {
      c.records = (c.records || 0) + 1;
    }
    if (eventType === 'bet_win') {
      c.bet_wins   = (c.bet_wins   || 0) + 1;
      c.multi_wins = (c.multi_wins || 0) + 1;
      c.win_streak = (c.win_streak || 0) + 1;
    }
    if (eventType === 'cr_milestone' && extraData.cr_total_ever) {
      c.cr_total_ever = extraData.cr_total_ever;
    }
    _saveCounters(c);

    // ── Verifica missões ──────────────────────────────────────────────────
    var awarded = [];
    DEFS.forEach(function (def) {
      // Só verifica missões cujo trigger bate (bet_win também dispara multi_win)
      var triggerMatch = def.trigger === eventType
        || (eventType === 'bet_win' && def.trigger === 'multi_win');
      if (!triggerMatch) return;

      var completedCount = done[def.id] || 0;
      if (def.once && completedCount > 0) return;          // única já feita
      if (!def.once && def.max && completedCount >= def.max) return; // repetível esgotada

      if (!def.check(c)) return; // condição não satisfeita

      awarded.push({ def: def, pilot: pilot });
      _markDone(def.id);
      _saveToSupabase(def.id, pilot, def.pts);
    });

    // ── Aplica pontos async ───────────────────────────────────────────────
    if (awarded.length === 0) {
      if (onDone) onDone([]);
      return;
    }

    var pending = awarded.length;
    awarded.forEach(function (item) {
      PilotEvolution.awardPoints(item.pilot, item.def.pts, function () {
        pending--;
        if (pending === 0 && onDone) onDone(awarded);
      });
    });
  }

  /**
   * Lista todas as missões com status atual — para exibir no dashboard
   */
  function getList() {
    var c    = _getCounters();
    var done = _getDone();
    return DEFS.map(function (def) {
      var count     = done[def.id] || 0;
      var completed = def.once ? count > 0 : (def.max ? count >= def.max : false);
      // Progresso para missões únicas com contadores conhecidos
      var progress  = null;
      var target    = null;
      if      (def.id === 'solo_10')   { progress = Math.min(c.solo_races  || 0, 10);  target = 10; }
      else if (def.id === 'solo_25')   { progress = Math.min(c.solo_races  || 0, 25);  target = 25; }
      else if (def.id === 'solo_50')   { progress = Math.min(c.solo_races  || 0, 50);  target = 50; }
      else if (def.id === 'win_5')     { progress = Math.min(c.multi_wins  || 0, 5);   target = 5; }
      else if (def.id === 'win_10')    { progress = Math.min(c.multi_wins  || 0, 10);  target = 10; }
      else if (def.id === 'record_5')  { progress = Math.min(c.records     || 0, 5);   target = 5; }
      else if (def.id === 'streak_3')  { progress = Math.min(c.win_streak  || 0, 3);   target = 3; }
      else if (def.id === 'streak_5')  { progress = Math.min(c.win_streak  || 0, 5);   target = 5; }
      else if (def.id === 'use_kenta') { progress = Math.min(c.kenta_races || 0, 5);   target = 5; }
      else if (def.id === 'use_yuki')  { progress = Math.min(c.yuki_races  || 0, 5);   target = 5; }
      else if (def.id === 'bet_10')    { progress = Math.min(c.bet_wins    || 0, 10);  target = 10; }
      else if (def.id === 'cr_100')    { progress = Math.min(c.cr_total_ever || 0, 100); target = 100; }
      else if (def.id === 'record_1')  { progress = count; target = def.max; }
      return {
        id: def.id, pts: def.pts, once: def.once,
        name_key: def.name_key, desc_key: def.desc_key,
        completed: completed, count: count, progress: progress, target: target,
      };
    });
  }

  /**
   * Carrega missões completadas do Supabase e sincroniza cache local
   */
  function loadFromSupabase(onDone) {
    var w = _wallet(); if (!w) { if (onDone) onDone(); return; }
    fetch(SURL + 'missions_completed?wallet=eq.' + encodeURIComponent(w) + '&select=mission_id', {
      headers: HDRS
    }).then(function (r) { return r.json(); }).then(function (rows) {
      if (!rows || !rows.length) { if (onDone) onDone(); return; }
      var done = {};
      rows.forEach(function (r) { done[r.mission_id] = (done[r.mission_id] || 0) + 1; });
      localStorage.setItem(_dKey(), JSON.stringify(done));
      if (onDone) onDone(done);
    }).catch(function () { if (onDone) onDone(); });
  }

  // Expõe
  return { checkAfterEvent: checkAfterEvent, getList: getList, loadFromSupabase: loadFromSupabase, DEFS: DEFS };
})();
