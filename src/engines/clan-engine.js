// =============================================================================
// clan-engine.js — Marco 2.7: Sistema de Clãs CapRush
// Fica na raiz do projeto. Sem dependências.
// =============================================================================

var ClanEngine = (function () {
  'use strict';

  var SURL = 'https://rigghudagbzrzadsbeml.supabase.co/rest/v1/';
  var SRPC = 'https://rigghudagbzrzadsbeml.supabase.co/rest/v1/rpc/';
  var SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZ2dodWRhZ2J6cnphZHNiZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzk4OTUsImV4cCI6MjA5MTk1NTg5NX0.2fXODjCXc7IjsF7KS5cAMC-jt9ovxturuQUKmiApO9A';
  var H = { 'Content-Type': 'application/json', 'apikey': SKEY, 'Authorization': 'Bearer ' + SKEY };

  // Símbolos disponíveis para o clã
  var SYMBOLS = ['🏎','⚡','🔥','💀','🐺','🦁','🐯','🦊','🦅','🐉','⚔️','🛡️','💎','🏆','🎯','🌊','🌪️','☄️','🚀','🎭'];

  // ── Helpers ────────────────────────────────────────────────────────────────
  function _wallet() {
    var w = localStorage.getItem('caprush_wallet') || '';
    if (!w) { try { w = JSON.parse(localStorage.getItem('caprush_privy_session') || '{}').id || ''; } catch (e) {} }
    return w;
  }
  function _nick() {
    return localStorage.getItem('caprush_nickname') || localStorage.getItem('caprush_nick') || 'Player';
  }
  function _get(path, params) {
    var url = SURL + path + (params ? '?' + params : '');
    return fetch(url, { headers: H }).then(function (r) { return r.json(); });
  }
  function _rpc(fn, body) {
    return fetch(SRPC + fn, { method: 'POST', headers: H, body: JSON.stringify(body) }).then(function (r) { return r.json(); });
  }
  function _post(table, body, prefer) {
    return fetch(SURL + table, {
      method: 'POST',
      headers: Object.assign({}, H, { 'Prefer': prefer || 'return=representation' }),
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); });
  }
  function _patch(table, params, body) {
    return fetch(SURL + table + '?' + params, {
      method: 'PATCH', headers: Object.assign({}, H, { 'Prefer': 'return=minimal' }),
      body: JSON.stringify(body)
    });
  }

  // ── Cache local ────────────────────────────────────────────────────────────
  function _cacheSet(k, v) { try { localStorage.setItem('clan_' + k, JSON.stringify(v)); } catch (e) {} }
  function _cacheGet(k)    { try { return JSON.parse(localStorage.getItem('clan_' + k) || 'null'); } catch (e) { return null; } }
  function clearCache()    { ['my', 'list', 'invites'].forEach(function (k) { localStorage.removeItem('clan_' + k); }); }

  // ── API ────────────────────────────────────────────────────────────────────

  /**
   * Busca o clã do jogador atual (cached).
   * onDone(clan | null)
   */
  function getMyClan(onDone) {
    var w = _wallet();
    if (!w) { if (onDone) onDone(null); return; }
    _get('clan_members', 'wallet=eq.' + encodeURIComponent(w) + '&select=clan_id,role').then(function (rows) {
      if (!rows || !rows.length) { _cacheSet('my', null); if (onDone) onDone(null); return; }
      var cid = rows[0].clan_id;
      var role = rows[0].role;
      _get('clans', 'id=eq.' + cid + '&select=*').then(function (clans) {
        var clan = clans && clans[0] ? Object.assign({}, clans[0], { my_role: role }) : null;
        _cacheSet('my', clan);
        if (onDone) onDone(clan);
      });
    }).catch(function () { if (onDone) onDone(null); });
  }

  /** Alias síncrono do cache (para UI rápida antes do fetch) */
  function getMyClanCached() { return _cacheGet('my'); }

  /**
   * Lista todos os clãs (para a página de busca)
   * onDone(array)
   */
  function listClans(onDone) {
    _get('clans', 'order=cr_pool.desc&limit=50&select=id,name,tag,symbol,description,cr_pool,member_count,is_open,created_at')
      .then(function (rows) {
        _cacheSet('list', rows || []);
        if (onDone) onDone(rows || []);
      }).catch(function () { if (onDone) onDone([]); });
  }

  /**
   * Cria um clã novo.
   * onDone({ ok, clan_id, err })
   */
  function createClan(name, tag, symbol, description, isOpen, onDone) {
    var w = _wallet(); var n = _nick();
    if (!w) { if (onDone) onDone({ ok: false, err: 'not_logged' }); return; }
    _rpc('create_clan', {
      p_wallet: w, p_nickname: n, p_name: name.trim(), p_tag: tag.trim().toUpperCase(),
      p_symbol: symbol || '🏎', p_description: description || '', p_is_open: !!isOpen
    }).then(function (res) {
      if (res && res.ok) {
        clearCache(); getMyClan(function () {});
        // Marco 2.9: badge CLAN_FOUNDER
        try {
          if (typeof BadgesEngine !== 'undefined' && !BadgesEngine.has('CLAN_FOUNDER')) {
            BadgesEngine.grant('CLAN_FOUNDER');
          }
        } catch(e){}
      }
      if (onDone) onDone(res || { ok: false, err: 'unknown' });
    }).catch(function (e) { if (onDone) onDone({ ok: false, err: e.message }); });
  }

  /**
   * Entra em clã aberto (sem convite)
   */
  function joinClan(clanId, onDone) {
    var w = _wallet(); var n = _nick();
    if (!w) { if (onDone) onDone({ ok: false, err: 'not_logged' }); return; }
    _rpc('join_clan', { p_clan_id: clanId, p_wallet: w, p_nickname: n })
      .then(function (res) {
        if (res && res.ok) { clearCache(); getMyClan(function () {}); }
        if (onDone) onDone(res || { ok: false });
      }).catch(function (e) { if (onDone) onDone({ ok: false, err: e.message }); });
  }

  /**
   * Sai do clã atual
   */
  function leaveClan(onDone) {
    var w = _wallet(); var n = _nick();
    if (!w) { if (onDone) onDone({ ok: false, err: 'not_logged' }); return; }
    _rpc('leave_clan', { p_wallet: w, p_nickname: n, p_target_wallet: null })
      .then(function (res) {
        if (res && res.ok) { clearCache(); }
        if (onDone) onDone(res || { ok: false });
      }).catch(function (e) { if (onDone) onDone({ ok: false, err: e.message }); });
  }

  /**
   * Expulsa um membro (requer líder ou oficial)
   */
  function kickMember(targetWallet, targetNick, onDone) {
    var w = _wallet(); var n = _nick();
    if (!w) { if (onDone) onDone({ ok: false, err: 'not_logged' }); return; }
    _rpc('leave_clan', { p_wallet: w, p_nickname: targetNick || 'Player', p_target_wallet: targetWallet })
      .then(function (res) { if (onDone) onDone(res || { ok: false }); })
      .catch(function (e) { if (onDone) onDone({ ok: false, err: e.message }); });
  }

  /**
   * Convida um jogador pelo wallet/DID
   */
  function invitePlayer(targetWallet, onDone) {
    var w = _wallet();
    if (!w) { if (onDone) onDone({ ok: false, err: 'not_logged' }); return; }
    var clan = getMyClanCached();
    if (!clan) { if (onDone) onDone({ ok: false, err: 'not_in_clan' }); return; }
    _post('clan_invites', { clan_id: clan.id, invited_wallet: targetWallet, invited_by: w })
      .then(function (res) {
        var ok = Array.isArray(res) && res.length > 0;
        if (onDone) onDone({ ok: ok, err: ok ? null : 'db_error' });
      }).catch(function (e) { if (onDone) onDone({ ok: false, err: e.message }); });
  }

  /**
   * Lista convites pendentes para o jogador atual
   */
  function getMyInvites(onDone) {
    var w = _wallet();
    if (!w) { if (onDone) onDone([]); return; }
    _get('clan_invites',
      'invited_wallet=eq.' + encodeURIComponent(w) + '&status=eq.pending' +
      '&select=id,clan_id,invited_by,created_at,clans(name,tag,symbol,cr_pool,member_count)'
    ).then(function (rows) {
      _cacheSet('invites', rows || []);
      if (onDone) onDone(rows || []);
    }).catch(function () { if (onDone) onDone([]); });
  }

  /**
   * Aceita um convite
   */
  function acceptInvite(inviteId, onDone) {
    var w = _wallet(); var n = _nick();
    if (!w) { if (onDone) onDone({ ok: false, err: 'not_logged' }); return; }
    _rpc('accept_clan_invite', { p_invite_id: inviteId, p_wallet: w, p_nickname: n })
      .then(function (res) {
        if (res && res.ok) { clearCache(); getMyClan(function () {}); }
        if (onDone) onDone(res || { ok: false });
      }).catch(function (e) { if (onDone) onDone({ ok: false, err: e.message }); });
  }

  /**
   * Recusa um convite
   */
  function declineInvite(inviteId, onDone) {
    _patch('clan_invites', 'id=eq.' + inviteId, { status: 'declined' })
      .then(function () { if (onDone) onDone({ ok: true }); })
      .catch(function (e) { if (onDone) onDone({ ok: false, err: e.message }); });
  }

  /**
   * Lista membros de um clã
   */
  function getClanMembers(clanId, onDone) {
    _get('clan_members', 'clan_id=eq.' + clanId + '&select=wallet,role,joined_at')
      .then(function (rows) { if (onDone) onDone(rows || []); })
      .catch(function () { if (onDone) onDone([]); });
  }

  /**
   * Feed de atividade de um clã (últimos 30)
   */
  function getClanActivity(clanId, onDone) {
    _get('clan_activity',
      'clan_id=eq.' + clanId + '&order=created_at.desc&limit=30&select=*'
    ).then(function (rows) { if (onDone) onDone(rows || []); })
     .catch(function () { if (onDone) onDone([]); });
  }

  /**
   * Promove membro a oficial (requer líder)
   */
  function promoteToOfficer(targetWallet, onDone) {
    var w = _wallet();
    if (!w) { if (onDone) onDone({ ok: false, err: 'not_logged' }); return; }
    var clan = getMyClanCached();
    if (!clan || clan.my_role !== 'leader') { if (onDone) onDone({ ok: false, err: 'no_permission' }); return; }
    _patch('clan_members', 'clan_id=eq.' + clan.id + '&wallet=eq.' + encodeURIComponent(targetWallet), { role: 'officer' })
      .then(function () { if (onDone) onDone({ ok: true }); })
      .catch(function (e) { if (onDone) onDone({ ok: false, err: e.message }); });
  }

  /**
   * Contribui $CR para o pool do clã (chamado automaticamente após corridas)
   */
  function contributeToPool(amount, reason, onDone) {
    var w = _wallet(); var n = _nick();
    if (!w || !amount || amount <= 0) { if (onDone) onDone({ ok: false }); return; }
    _rpc('clan_add_cr', { p_wallet: w, p_nickname: n, p_amount: amount, p_reason: reason || '' })
      .then(function (res) {
        if (res && res.ok) { var c = getMyClanCached(); if (c) { c.cr_pool += amount; _cacheSet('my', c); } }
        if (onDone) onDone(res || { ok: false });
      }).catch(function () { if (onDone) onDone({ ok: false }); });
  }

  /**
   * Atualiza descrição/símbolo do clã (requer líder)
   */
  function updateClan(updates, onDone) {
    var w = _wallet();
    var clan = getMyClanCached();
    if (!clan || clan.my_role !== 'leader' || !w) {
      if (onDone) onDone({ ok: false, err: 'no_permission' }); return;
    }
    _patch('clans', 'id=eq.' + clan.id, updates)
      .then(function () { clearCache(); getMyClan(function () {}); if (onDone) onDone({ ok: true }); })
      .catch(function (e) { if (onDone) onDone({ ok: false, err: e.message }); });
  }

  /**
   * Ranking geral de clãs por cr_pool
   */
  function getClanRanking(onDone) {
    _get('clans', 'order=cr_pool.desc&limit=20&select=id,name,tag,symbol,cr_pool,member_count')
      .then(function (rows) { if (onDone) onDone(rows || []); })
      .catch(function () { if (onDone) onDone([]); });
  }

  // Expõe
  return {
    getMyClan: getMyClan,
    getMyClanCached: getMyClanCached,
    listClans: listClans,
    createClan: createClan,
    joinClan: joinClan,
    leaveClan: leaveClan,
    kickMember: kickMember,
    invitePlayer: invitePlayer,
    getMyInvites: getMyInvites,
    acceptInvite: acceptInvite,
    declineInvite: declineInvite,
    getClanMembers: getClanMembers,
    getClanActivity: getClanActivity,
    promoteToOfficer: promoteToOfficer,
    contributeToPool: contributeToPool,
    updateClan: updateClan,
    getClanRanking: getClanRanking,
    clearCache: clearCache,
    SYMBOLS: SYMBOLS,
  };
})();
