// =============================================================================
// daily-streak.js — Marco 2.9: Daily login (engagement progressivo 30 dias)
// Tabela Supabase: daily_streak
// Recompensas (somam 720 $CR no ciclo de 30 dias):
//   1-6: 10/d (60), 7: 50, 8-13: 15/d (90), 14: 75, 15-20: 20/d (120),
//   21: 100, 22-29: 25/d (200), 30: 200 + Badge DEDICADO + 1 troca grátis garagem
// Streak quebra após 36h sem login.
// =============================================================================

var DailyStreak = (function () {
  'use strict';

  var SURL = 'https://rigghudagbzrzadsbeml.supabase.co/rest/v1/';
  var SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZ2dodWRhZ2J6cnphZHNiZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzk4OTUsImV4cCI6MjA5MTk1NTg5NX0.2fXODjCXc7IjsF7KS5cAMC-jt9ovxturuQUKmiApO9A';
  var HDRS = { 'Content-Type': 'application/json', 'apikey': SKEY, 'Authorization': 'Bearer ' + SKEY };

  var REWARDS = (function(){
    var r = [0];
    for (var i=1;  i<=6;  i++) r.push(10);
    r.push(50);
    for (var j=8;  j<=13; j++) r.push(15);
    r.push(75);
    for (var k=15; k<=20; k++) r.push(20);
    r.push(100);
    for (var m=22; m<=29; m++) r.push(25);
    r.push(200);
    return r;
  })();

  var MILESTONE_DAYS = [7, 14, 21, 30];

  function _wallet() {
    var w = localStorage.getItem('caprush_wallet') || '';
    if (!w) {
      try { w = (JSON.parse(localStorage.getItem('caprush_privy_session') || '{}')).id || ''; } catch (e) {}
    }
    return w;
  }

  function _todayStr(){
    var d = new Date();
    return d.getUTCFullYear() + '-' +
           String(d.getUTCMonth()+1).padStart(2,'0') + '-' +
           String(d.getUTCDate()).padStart(2,'0');
  }

  function _hoursSince(isoDate){
    if(!isoDate) return Infinity;
    var d = new Date(isoDate);
    return (Date.now() - d.getTime()) / (1000*60*60);
  }

  function _getLocal(){
    try { return JSON.parse(localStorage.getItem('caprush_daily_streak') || 'null') || {
      current_streak: 0, longest_streak: 0, last_login_date: null,
      total_claimed_cr: 0, last_claimed_day: 0
    }; }
    catch(e){ return { current_streak: 0, longest_streak: 0, last_login_date: null, total_claimed_cr: 0, last_claimed_day: 0 }; }
  }

  function _setLocal(d){ localStorage.setItem('caprush_daily_streak', JSON.stringify(d)); }

  function _sbUpsert(body){
    return fetch(SURL + 'daily_streak', {
      method: 'POST',
      headers: Object.assign({}, HDRS, { 'Prefer': 'resolution=merge-duplicates,return=representation' }),
      body: JSON.stringify(body)
    }).then(function(r){ return r.json(); });
  }

  function _sbGet(){
    var w = _wallet();
    if(!w) return Promise.resolve([]);
    return fetch(SURL + 'daily_streak?user_id=eq.' + encodeURIComponent(w),
                 { headers: HDRS }).then(function(r){ return r.json(); });
  }

  function load(onDone){
    _sbGet().then(function(rows){
      if(rows && rows[0]){
        var r = rows[0];
        _setLocal({
          current_streak: r.current_streak || 0,
          longest_streak: r.longest_streak || 0,
          last_login_date: r.last_login_date || null,
          total_claimed_cr: r.total_claimed_cr || 0,
          last_claimed_day: r.last_claimed_day || 0
        });
      }
      if(onDone) onDone(getCurrent());
    }).catch(function(){ if(onDone) onDone(getCurrent()); });
  }

  function getCurrent(){
    var d = _getLocal();
    var today = _todayStr();
    var hoursAgo = _hoursSince(d.last_login_date);
    var isBroken = d.last_login_date && hoursAgo > 36;
    if(isBroken){ d.current_streak = 0; d.last_claimed_day = 0; }
    var canClaimToday = (d.last_login_date !== today);
    var nextDay = ((d.current_streak) % 30) + 1;
    return {
      current_streak: d.current_streak,
      longest_streak: d.longest_streak,
      last_login_date: d.last_login_date,
      total_claimed_cr: d.total_claimed_cr,
      next_day: nextDay,
      next_reward: REWARDS[nextDay] || 0,
      can_claim_today: canClaimToday,
      is_broken: isBroken
    };
  }

  function claim(onDone){
    var d = _getLocal();
    var today = _todayStr();
    var hoursAgo = _hoursSince(d.last_login_date);

    if(d.last_login_date === today){
      if(onDone) onDone({ ok:false, err:'already_claimed_today' });
      return;
    }

    if(d.last_login_date && hoursAgo > 36){
      d.current_streak = 0;
      d.last_claimed_day = 0;
    }

    d.current_streak = (d.current_streak || 0) + 1;
    var dayInCycle = ((d.current_streak - 1) % 30) + 1;
    var reward = REWARDS[dayInCycle] || 0;

    d.last_login_date = today;
    d.last_claimed_day = dayInCycle;
    d.longest_streak = Math.max(d.longest_streak || 0, d.current_streak);
    d.total_claimed_cr = (d.total_claimed_cr || 0) + reward;
    _setLocal(d);

    var badgeUnlocked = (dayInCycle === 30);

    var w = _wallet();
    if(w){
      _sbUpsert({
        user_id: w,
        current_streak: d.current_streak,
        longest_streak: d.longest_streak,
        last_login_date: d.last_login_date,
        total_claimed_cr: d.total_claimed_cr,
        last_claimed_day: d.last_claimed_day,
        updated_at: new Date().toISOString()
      }).catch(function(){});
    }

    function _creditAndDone(){
      if(typeof CREngine !== 'undefined'){
        CREngine.earnCR(reward, 'daily_login', 'Daily login dia ' + dayInCycle, function(){
          if(onDone) onDone({
            ok:true, day:dayInCycle, reward:reward,
            streak:d.current_streak, longest:d.longest_streak,
            badgeUnlocked: badgeUnlocked,
            isMilestone: MILESTONE_DAYS.indexOf(dayInCycle) !== -1
          });
        });
      } else {
        if(onDone) onDone({
          ok:true, day:dayInCycle, reward:reward,
          streak:d.current_streak, longest:d.longest_streak,
          badgeUnlocked: badgeUnlocked,
          isMilestone: MILESTONE_DAYS.indexOf(dayInCycle) !== -1
        });
      }
    }

    if(badgeUnlocked && typeof BadgesEngine !== 'undefined'){
      BadgesEngine.grant('DEDICADO', function(){ _creditAndDone(); });
    } else {
      _creditAndDone();
    }
  }

  return {
    REWARDS: REWARDS, MILESTONE_DAYS: MILESTONE_DAYS,
    load: load, getCurrent: getCurrent, claim: claim
  };
})();
