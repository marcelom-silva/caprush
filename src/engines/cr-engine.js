// cr-engine.js v1.0 — CapRush $CR Economy Engine
// Handles: balance, earning, achievements, retroactive award, transactions
// Uses Supabase REST directly — no SDK required

var CREngine = (function () {
  'use strict';

  var SURL  = 'https://rigghudagbzrzadsbeml.supabase.co/rest/v1/';
  var SKEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZ2dodWRhZ2J6cnphZHNiZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzk4OTUsImV4cCI6MjA5MTk1NTg5NX0.2fXODjCXc7IjsF7KS5cAMC-jt9ovxturuQUKmiApO9A';
  var HDRS  = { 'Content-Type': 'application/json', 'apikey': SKEY, 'Authorization': 'Bearer ' + SKEY };

  // ── CR EARNING RULES ───────────────────────────────────────────
  var RULES = {
    solo_complete:    1.0,   // any completed solo run
    multi_win:        3.0,   // win in 1v1 local or online
    personal_record:  0.5,   // beat your own best time
    achievement:      null,  // varies per achievement
  };

  // ── ACHIEVEMENTS CATALOG ───────────────────────────────────────
  var ACHIEVEMENTS = [
    { id: 'first_race',    label: 'Primeira Corrida',   cr: 2,   desc: 'Complete sua primeira corrida',          check: function(stats){ return stats.total_runs >= 1; } },
    { id: 'first_win',     label: 'Primeira Vitoria',   cr: 5,   desc: 'Complete a Volta 1 no modo Solo',        check: function(stats){ return stats.laps_completed >= 1; } },
    { id: 'runs_10',       label: '10 Corridas',        cr: 5,   desc: 'Complete 10 corridas',                   check: function(stats){ return stats.total_runs >= 10; } },
    { id: 'runs_50',       label: '50 Corridas',        cr: 15,  desc: 'Complete 50 corridas',                   check: function(stats){ return stats.total_runs >= 50; } },
    { id: 'runs_100',      label: '100 Corridas',       cr: 30,  desc: 'Complete 100 corridas',                  check: function(stats){ return stats.total_runs >= 100; } },
    { id: 'multi_first',   label: 'Primeiro 1v1',       cr: 5,   desc: 'Complete um modo 1v1',                   check: function(stats){ return stats.multi_runs >= 1; } },
    { id: 'multi_10',      label: '10 Batalhas',        cr: 10,  desc: 'Complete 10 corridas 1v1',               check: function(stats){ return stats.multi_runs >= 10; } },
    { id: 'sub5',          label: 'Sub 5 Minutos',      cr: 10,  desc: 'Termine Solo em menos de 5 minutos',     check: function(stats){ return stats.best_solo_ms > 0 && stats.best_solo_ms < 300000; } },
    { id: 'sub4',          label: 'Sub 4 Minutos',      cr: 20,  desc: 'Termine Solo em menos de 4 minutos',     check: function(stats){ return stats.best_solo_ms > 0 && stats.best_solo_ms < 240000; } },
    { id: 'veteran',       label: 'Veterano',           cr: 50,  desc: 'Jogue por 7 dias diferentes',            check: function(stats){ return stats.active_days >= 7; } },
  ];

  // ── INTERNAL HELPERS ───────────────────────────────────────────
  function _get(table, params) {
    var url = SURL + table + (params ? '?' + params : '');
    return fetch(url, { headers: HDRS }).then(function(r){ return r.json(); });
  }

  function _post(table, body) {
    return fetch(SURL + table, {
      method: 'POST',
      headers: Object.assign({}, HDRS, { 'Prefer': 'return=representation' }),
      body: JSON.stringify(body)
    }).then(function(r){ return r.json(); });
  }

  function _patch(table, filterParam, body) {
    return fetch(SURL + table + '?' + filterParam, {
      method: 'PATCH',
      headers: Object.assign({}, HDRS, { 'Prefer': 'return=representation' }),
      body: JSON.stringify(body)
    }).then(function(r){ return r.json(); });
  }

  function _upsert(table, body) {
    return fetch(SURL + table, {
      method: 'POST',
      headers: Object.assign({}, HDRS, { 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(body)
    }).then(function(r){ return r.json(); });
  }

  // ── GET CURRENT USER ID ────────────────────────────────────────
  function _getUser() {
    var wallet   = localStorage.getItem('caprush_wallet') || localStorage.getItem('caprush_google_sub') || '';
    var nickname = localStorage.getItem('caprush_nick')   || 'Jogador';
    return { wallet: wallet, nickname: nickname };
  }

  // ── GET OR CREATE LEDGER ENTRY ─────────────────────────────────
  function getLedger(wallet, nickname) {
    return _get('cr_ledger', 'wallet=eq.' + encodeURIComponent(wallet)).then(function(rows) {
      if (rows && rows.length > 0) return rows[0];
      // Create new entry
      return _upsert('cr_ledger', {
        wallet: wallet, nickname: nickname,
        cr_balance: 0, cr_total_earned: 0, cr_staked: 0, retroactive_done: false
      }).then(function(res){ return (res && res[0]) || { wallet: wallet, cr_balance: 0, cr_total_earned: 0, cr_staked: 0, retroactive_done: false }; });
    });
  }

  // ── AWARD CR ───────────────────────────────────────────────────
  function _award(wallet, nickname, amount, type, description) {
    if (!wallet || amount <= 0) return Promise.resolve(null);
    // Log transaction
    _post('cr_transactions', { wallet: wallet, nickname: nickname, amount: amount, type: type, description: description, season: 'T1' });
    // Update ledger
    return getLedger(wallet, nickname).then(function(ledger) {
      var newBalance = (ledger.cr_balance || 0) + amount;
      var newTotal   = (ledger.cr_total_earned || 0) + amount;
      return _patch('cr_ledger', 'wallet=eq.' + encodeURIComponent(wallet), {
        cr_balance: Math.round(newBalance * 10) / 10,
        cr_total_earned: Math.round(newTotal * 10) / 10,
        nickname: nickname,
        updated_at: new Date().toISOString()
      });
    });
  }

  // ── RETROACTIVE AWARD FOR EXISTING USERS ───────────────────────
  function _doRetroactive(wallet, nickname) {
    return _get('runs', 'wallet=eq.' + encodeURIComponent(wallet) + '&select=time_ms,mode,created_at&order=created_at.asc').then(function(runs) {
      if (!runs || runs.length === 0) return null;
      var totalCR = 0;
      runs.forEach(function(run) {
        if (run.time_ms && run.time_ms > 0) {
          totalCR += (run.mode === 'local' || run.mode === 'online') ? 2 : 1;
        }
      });
      if (totalCR <= 0) return null;
      // Log as single retroactive transaction
      _post('cr_transactions', {
        wallet: wallet, nickname: nickname,
        amount: totalCR, type: 'retroactive',
        description: 'Retroativo: ' + runs.length + ' corridas anteriores ao Marco 1',
        season: 'T1'
      });
      return _patch('cr_ledger', 'wallet=eq.' + encodeURIComponent(wallet), {
        cr_balance: totalCR, cr_total_earned: totalCR,
        retroactive_done: true, updated_at: new Date().toISOString()
      }).then(function(){ return totalCR; });
    });
  }

  // ── CHECK AND UNLOCK ACHIEVEMENTS ─────────────────────────────
  function _checkAchievements(wallet, nickname, stats) {
    return _get('achievements_unlocked', 'wallet=eq.' + encodeURIComponent(wallet)).then(function(unlocked) {
      var doneIds = (unlocked || []).map(function(a){ return a.achievement_id; });
      var newOnes = [];
      ACHIEVEMENTS.forEach(function(ach) {
        if (doneIds.indexOf(ach.id) < 0 && ach.check(stats)) {
          newOnes.push(ach);
        }
      });
      var promises = newOnes.map(function(ach) {
        return _post('achievements_unlocked', { wallet: wallet, achievement_id: ach.id }).then(function() {
          return _award(wallet, nickname, ach.cr, 'achievement', 'Conquista: ' + ach.label);
        });
      });
      return Promise.all(promises).then(function(){ return newOnes; });
    });
  }

  // ── COMPUTE PLAYER STATS FROM RUNS ───────────────────────────
  function _getStats(wallet) {
    return _get('runs', 'wallet=eq.' + encodeURIComponent(wallet) + '&select=time_ms,mode,pilot,launches,created_at').then(function(runs) {
      runs = runs || [];
      var stats = {
        total_runs: runs.length,
        solo_runs: 0, multi_runs: 0,
        laps_completed: 0,
        best_solo_ms: 0, best_multi_ms: 0,
        total_launches: 0,
        active_days: 0,
      };
      var days = {};
      runs.forEach(function(r) {
        if (!r.time_ms || r.time_ms <= 0) return;
        var isSolo = r.mode === 'solo' || !r.mode;
        if (isSolo) {
          stats.solo_runs++;
          stats.laps_completed++;
          if (!stats.best_solo_ms || r.time_ms < stats.best_solo_ms) stats.best_solo_ms = r.time_ms;
        } else {
          stats.multi_runs++;
          if (!stats.best_multi_ms || r.time_ms < stats.best_multi_ms) stats.best_multi_ms = r.time_ms;
        }
        stats.total_launches += (r.launches || 0);
        var day = (r.created_at || '').slice(0, 10);
        if (day) days[day] = true;
      });
      stats.active_days = Object.keys(days).length;
      return stats;
    });
  }

  // ── PUBLIC API ─────────────────────────────────────────────────

  // Initialize: load or create ledger, handle retroactive, check achievements
  function init(onReady) {
    var user = _getUser();
    if (!user.wallet) { if (onReady) onReady(null); return; }

    getLedger(user.wallet, user.nickname).then(function(ledger) {
      // Retroactive for existing users
      var retroP = ledger.retroactive_done
        ? Promise.resolve(0)
        : _doRetroactive(user.wallet, user.nickname);

      retroP.then(function(retroCR) {
        _getStats(user.wallet).then(function(stats) {
          _checkAchievements(user.wallet, user.nickname, stats).then(function(newAch) {
            getLedger(user.wallet, user.nickname).then(function(fresh) {
              if (onReady) onReady({ ledger: fresh, stats: stats, newAchievements: newAch, retroCR: retroCR });
            });
          });
        });
      });
    }).catch(function(){ if (onReady) onReady(null); });
  }

  // Get current balance (quick call)
  function getBalance(cb) {
    var user = _getUser();
    if (!user.wallet) { if (cb) cb(0); return; }
    getLedger(user.wallet, user.nickname).then(function(l){ if (cb) cb(l.cr_balance || 0); }).catch(function(){ if (cb) cb(0); });
  }

  // Award CR for race result — call from GameLoop after finish
  function awardRace(opts) {
    // opts: { mode, time_ms, won, previous_best_ms }
    var user = _getUser();
    if (!user.wallet) return;

    var isSolo  = opts.mode === 'solo' || !opts.mode;
    var isMulti = opts.mode === 'local' || opts.mode === 'online';
    var promises = [];

    if (isSolo && opts.time_ms > 0) {
      promises.push(_award(user.wallet, user.nickname, RULES.solo_complete, 'race_win', 'Corrida Solo completa'));
    }
    if (isMulti && opts.won) {
      promises.push(_award(user.wallet, user.nickname, RULES.multi_win, 'race_win', 'Vitoria 1v1 ' + (opts.mode === 'online' ? 'Online' : 'Local')));
    }
    if (opts.previous_best_ms && opts.time_ms > 0 && opts.time_ms < opts.previous_best_ms) {
      promises.push(_award(user.wallet, user.nickname, RULES.personal_record, 'personal_record', 'Recorde pessoal!'));
    }

    // Re-check achievements after race
    Promise.all(promises).then(function() {
      _getStats(user.wallet).then(function(stats) {
        _checkAchievements(user.wallet, user.nickname, stats).then(function(newAch) {
          if (newAch && newAch.length > 0 && window._onNewAchievement) {
            window._onNewAchievement(newAch);
          }
        });
      });
    });
  }

  // Get full transaction history
  function getHistory(wallet, limit, cb) {
    _get('cr_transactions', 'wallet=eq.' + encodeURIComponent(wallet) + '&order=created_at.desc&limit=' + (limit || 30)).then(function(rows){ if (cb) cb(rows || []); }).catch(function(){ if (cb) cb([]); });
  }

  // Get unlocked achievements
  function getAchievements(wallet, cb) {
    _get('achievements_unlocked', 'wallet=eq.' + encodeURIComponent(wallet) + '&order=unlocked_at.desc').then(function(rows){ if (cb) cb(rows || []); }).catch(function(){ if (cb) cb([]); });
  }

  // ── SPEND CR (Marco 2.5) ───────────────────────────────────────────────────
  // Debita $CR do saldo do jogador — usado para reset de stats e apostas
  function spendCR(amount, type, description, cb) {
    var user = _getUser();
    if (!user.wallet) { if (cb) cb(false); return; }
    if (amount <= 0)  { if (cb) cb(false); return; }

    getLedger(user.wallet, user.nickname).then(function (ledger) {
      var balance = ledger.cr_balance || 0;
      if (balance < amount) { if (cb) cb(false, 'insufficient'); return; }

      var newBalance = Math.round((balance - amount) * 10) / 10;

      // Log da transação (valor negativo)
      _post('cr_transactions', {
        wallet: user.wallet, nickname: user.nickname,
        amount: -amount, type: type || 'spend',
        description: description || 'Gasto de $CR', season: 'T1'
      });

      // Atualiza ledger
      _patch('cr_ledger', 'wallet=eq.' + encodeURIComponent(user.wallet), {
        cr_balance: newBalance, updated_at: new Date().toISOString()
      }).then(function () {
        if (cb) cb(true, newBalance);
      }).catch(function () { if (cb) cb(false, 'db_error'); });

    }).catch(function () { if (cb) cb(false, 'ledger_error'); });
  }

  // Marco 2.9.2: função genérica de crédito de $CR (usada pelo daily-streak,
  // missions, badges e qualquer outro engine que precise creditar valor avulso).
  // Espelha spendCR mas com valor positivo e sem checagem de saldo.
  // Assinatura: earnCR(amount, type, description, cb)
  //   cb(success: bool, newBalance: number | errorCode: string)
  function earnCR(amount, type, description, cb) {
    var user = _getUser();
    if (!user.wallet) { if (cb) cb(false, 'no_wallet'); return; }
    if (amount <= 0)  { if (cb) cb(false, 'invalid_amount'); return; }

    getLedger(user.wallet, user.nickname).then(function (ledger) {
      var newBalance = Math.round(((ledger.cr_balance || 0) + amount) * 10) / 10;
      var newTotal   = Math.round(((ledger.cr_total_earned || 0) + amount) * 10) / 10;

      // Log da transação (valor positivo)
      _post('cr_transactions', {
        wallet: user.wallet, nickname: user.nickname,
        amount: amount, type: type || 'earn',
        description: description || 'Crédito de $CR', season: 'T1'
      });

      // Atualiza ledger (saldo + total acumulado)
      _patch('cr_ledger', 'wallet=eq.' + encodeURIComponent(user.wallet), {
        cr_balance: newBalance, cr_total_earned: newTotal,
        nickname: user.nickname,
        updated_at: new Date().toISOString()
      }).then(function () {
        if (cb) cb(true, newBalance);
      }).catch(function () { if (cb) cb(false, 'db_error'); });

    }).catch(function () { if (cb) cb(false, 'ledger_error'); });
  }

  return {
    init: init,
    getBalance: getBalance,
    awardRace: awardRace,
    earnCR: earnCR,
    spendCR: spendCR,
    getHistory: getHistory,
    getAchievements: getAchievements,
    ACHIEVEMENTS: ACHIEVEMENTS,
    RULES: RULES,
  };
})();
