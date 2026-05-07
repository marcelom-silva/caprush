// =============================================================================
// arcium-engine.js — Marco 6 (Fase A) — Lances Simultâneos Encriptados
// =============================================================================
// FILOSOFIA:
//   Substitui o modelo atual onde P2 vê o lance de P1 antes de atirar.
//   Usa esquema commit-reveal via Supabase como árbitro centralizado:
//
//   1. COMMIT: cada jogador encripta seu lance (força + ângulo + salt aleatório)
//              com SHA-256 e publica só o HASH. Ninguém sabe o lance real.
//
//   2. REVEAL: quando AMBOS publisharam seus hashes, cada um revela lance + salt.
//              O árbitro (Supabase) valida: SHA-256(lance+salt) == hash publicado.
//              Se bateu, aceita. Se não bateu, descarta (tentativa de trapaça).
//
//   3. APPLY:  com os dois lances validados e revelados, o jogo aplica ambos
//              simultaneamente — ninguém teve vantagem de ver o outro primeiro.
//
// NOTA ARCIUM:
//   Esta é a Fase A (PoC). Usa SHA-256 local + Supabase como árbitro.
//   Na Fase B (Marco 6 completo), o commit vai pra rede Arcium MPC real:
//   https://rtg.arcium.com/rtg/dev-hidden-games
//   A API pública será idêntica — só o backend de encriptação muda.
// =============================================================================

var ArciumEngine = (function(){
  'use strict';

  var SURL = 'https://rigghudagbzrzadsbeml.supabase.co/rest/v1/';
  var SKEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZ2dodWRhZ2J6cnphZHNiZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzk4OTUsImV4cCI6MjA5MTk1NTg5NX0.2fXODjCXc7IjsF7KS5cAMC-jt9ovxturuQUKmiApO9A';
  var HDRS  = { 'Content-Type':'application/json', 'apikey':SKEY, 'Authorization':'Bearer '+SKEY };

  // Tempo máximo esperando o oponente revelar antes de timeout (ms)
  var REVEAL_TIMEOUT_MS = 30000;
  // Intervalo de polling pra verificar se oponente commitou/revelou (ms)
  var POLL_INTERVAL_MS  = 800;

  // ── HELPERS ──────────────────────────────────────────────────────────────

  // Gera salt aleatório de 32 bytes como hex string
  function _randomSalt(){
    var arr = new Uint8Array(32);
    window.crypto.getRandomValues(arr);
    return Array.from(arr).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
  }

  // SHA-256 de uma string, retorna hex string
  async function _sha256(str){
    var buf  = new TextEncoder().encode(str);
    var hash = await window.crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash)).map(function(b){ return b.toString(16).padStart(2,'0'); }).join('');
  }

  // Encoda lance como string canônica pra hash (ordem fixa de campos)
  // lance: { forcePct: number, angle: number }
  function _encodeLance(lance, salt){
    // Arredonda pra 4 casas — evita diferenças de float entre plataformas
    var fp = Math.round(lance.forcePct * 10000) / 10000;
    var ag = Math.round(lance.angle    * 10000) / 10000;
    return 'caprush:lance:fp=' + fp + ':ag=' + ag + ':salt=' + salt;
  }

  // ── SUPABASE CRUD ────────────────────────────────────────────────────────

  function _get(params){
    return fetch(SURL + 'mpc_rounds?' + params, { headers: HDRS })
      .then(function(r){ return r.ok ? r.json() : []; })
      .catch(function(){ return []; });
  }

  function _patch(roomCode, roundNum, body){
    return fetch(SURL + 'mpc_rounds?room_code=eq.' + encodeURIComponent(roomCode) + '&round_num=eq.' + roundNum, {
      method: 'PATCH',
      headers: Object.assign({}, HDRS, { 'Prefer':'return=representation' }),
      body: JSON.stringify(body)
    }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
  }

  function _insert(body){
    return fetch(SURL + 'mpc_rounds', {
      method: 'POST',
      headers: Object.assign({}, HDRS, { 'Prefer':'return=representation' }),
      body: JSON.stringify(body)
    }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
  }

  // ── ESTADO INTERNO DA RODADA ────────────────────────────────────────────

  var _state = {
    roomCode:   null,
    roundNum:   0,
    mySlot:     null,   // 'a' ou 'b' (quem é o jogador local)
    myWallet:   null,
    mySalt:     null,
    myLance:    null,   // { forcePct, angle }
    myHash:     null,
    committed:  false,
    revealed:   false,
    resolved:   false,
    _pollTimer: null,
    _timeoutTimer: null
  };

  // ── API PÚBLICA ──────────────────────────────────────────────────────────

  /**
   * Inicializa uma nova rodada ArciumEngine.
   * @param {string} roomCode - código da sala (mesmo usado no PeerJS)
   * @param {number} roundNum - número da rodada atual (incrementa a cada turno)
   * @param {'a'|'b'} mySlot  - qual slot é o jogador local
   * @param {string} myWallet - wallet/DID do jogador local
   */
  function init(roomCode, roundNum, mySlot, myWallet){
    _clearTimers();
    _state.roomCode   = roomCode;
    _state.roundNum   = roundNum;
    _state.mySlot     = mySlot;
    _state.myWallet   = myWallet;
    _state.mySalt     = null;
    _state.myLance    = null;
    _state.myHash     = null;
    _state.committed  = false;
    _state.revealed   = false;
    _state.resolved   = false;
    _state._pollTimer = null;
    _state._timeoutTimer = null;
    console.log('[Arcium] Rodada', roundNum, '| Slot:', mySlot, '| Room:', roomCode);
  }

  /**
   * FASE 1 — Commita o lance (publica só o hash, não o lance real).
   * @param {{ forcePct:number, angle:number }} lance
   * @param {function(boolean)} onDone — chamado com true se commitou com sucesso
   */
  async function commit(lance, onDone){
    if(!_state.roomCode){ if(onDone) onDone(false); return; }
    if(_state.committed){ if(onDone) onDone(true); return; }

    _state.myLance = lance;
    _state.mySalt  = _randomSalt();
    var encoded = _encodeLance(lance, _state.mySalt);
    _state.myHash  = await _sha256(encoded);

    var slot   = _state.mySlot;
    var update = {};
    update['hash_'      + slot] = _state.myHash;
    update['wallet_'    + slot] = _state.myWallet;
    update['committed_' + slot] = true;
    update['updated_at']        = new Date().toISOString();

    // Tenta PATCH primeiro (row já existe), se falhar faz INSERT
    var rows = await _get('room_code=eq.' + encodeURIComponent(_state.roomCode) + '&round_num=eq.' + _state.roundNum);
    if(rows && rows.length > 0){
      await _patch(_state.roomCode, _state.roundNum, update);
    } else {
      var insertBody = Object.assign({
        room_code:  _state.roomCode,
        round_num:  _state.roundNum,
        status:     'committing',
        created_at: new Date().toISOString()
      }, update);
      await _insert(insertBody);
    }

    _state.committed = true;
    console.log('[Arcium] Commit enviado. Hash:', _state.myHash.slice(0,16) + '...');
    if(onDone) onDone(true);
  }

  /**
   * FASE 2 — Aguarda o oponente commitar e então revela o lance real.
   * Faz polling no Supabase até ver hash do oponente.
   * @param {function({ ok:boolean, myLance:object, opponentLance:object|null, err:string })} onResult
   */
  function waitAndReveal(onResult){
    if(!_state.committed){ if(onResult) onResult({ ok:false, err:'not_committed' }); return; }
    var oppSlot = _state.mySlot === 'a' ? 'b' : 'a';

    var pollCount = 0;
    var maxPolls  = Math.ceil(REVEAL_TIMEOUT_MS / POLL_INTERVAL_MS);

    _state._pollTimer = setInterval(async function(){
      pollCount++;
      if(pollCount > maxPolls){
        _clearTimers();
        console.warn('[Arcium] Timeout: oponente não commitou a tempo.');
        if(onResult) onResult({ ok:false, err:'timeout_commit' });
        return;
      }

      var rows = await _get(
        'room_code=eq.' + encodeURIComponent(_state.roomCode) +
        '&round_num=eq.' + _state.roundNum
      );
      var row = rows && rows[0];
      if(!row) return;

      // Oponente commitou?
      if(!row['committed_' + oppSlot]) return;

      // Oponente commitou — agora revelamos nosso lance
      _clearTimers();
      console.log('[Arcium] Oponente commitou. Revelando lance...');

      var revUpdate = {};
      revUpdate['lance_fp_'   + _state.mySlot] = _state.myLance.forcePct;
      revUpdate['lance_ag_'   + _state.mySlot] = _state.myLance.angle;
      revUpdate['salt_'       + _state.mySlot] = _state.mySalt;
      revUpdate['revealed_'   + _state.mySlot] = true;
      revUpdate['updated_at']                   = new Date().toISOString();
      revUpdate['status']                       = 'revealing';

      await _patch(_state.roomCode, _state.roundNum, revUpdate);
      _state.revealed = true;

      // Agora aguarda oponente revelar
      _waitForOpponentReveal(onResult, oppSlot);

    }, POLL_INTERVAL_MS);
  }

  // Aguarda oponente revelar e então valida + resolve
  function _waitForOpponentReveal(onResult, oppSlot){
    var pollCount = 0;
    var maxPolls  = Math.ceil(REVEAL_TIMEOUT_MS / POLL_INTERVAL_MS);

    _state._pollTimer = setInterval(async function(){
      pollCount++;
      if(pollCount > maxPolls){
        _clearTimers();
        console.warn('[Arcium] Timeout: oponente não revelou a tempo.');
        if(onResult) onResult({ ok:false, err:'timeout_reveal' });
        return;
      }

      var rows = await _get(
        'room_code=eq.' + encodeURIComponent(_state.roomCode) +
        '&round_num=eq.' + _state.roundNum
      );
      var row = rows && rows[0];
      if(!row || !row['revealed_' + oppSlot]) return;

      _clearTimers();

      // Valida integridade do lance do oponente
      var oppFp   = row['lance_fp_' + oppSlot];
      var oppAg   = row['lance_ag_' + oppSlot];
      var oppSalt = row['salt_'     + oppSlot];
      var oppHash = row['hash_'     + oppSlot];

      var oppLance   = { forcePct: oppFp, angle: oppAg };
      var oppEncoded = _encodeLance(oppLance, oppSalt);

      var validHash = await _sha256(oppEncoded);
      if(validHash !== oppHash){
        console.error('[Arcium] Hash inválido! Oponente pode ter trapaceado.');
        // Marca no banco como fraude (pra auditoria)
        await _patch(_state.roomCode, _state.roundNum, { status: 'fraud_detected', updated_at: new Date().toISOString() });
        if(onResult) onResult({ ok:false, err:'hash_mismatch', cheater: oppSlot });
        return;
      }

      // Tudo certo — resolve a rodada
      await _patch(_state.roomCode, _state.roundNum, { status: 'resolved', updated_at: new Date().toISOString() });
      _state.resolved = true;

      console.log('[Arcium] Rodada', _state.roundNum, 'resolvida com sucesso.');
      console.log('  Meu lance  :', _state.myLance);
      console.log('  Lance opon.:', oppLance);

      if(onResult) onResult({
        ok:             true,
        myLance:        _state.myLance,
        opponentLance:  oppLance,
        roundNum:       _state.roundNum
      });

    }, POLL_INTERVAL_MS);
  }

  function _clearTimers(){
    if(_state._pollTimer)    { clearInterval(_state._pollTimer);    _state._pollTimer    = null; }
    if(_state._timeoutTimer) { clearTimeout(_state._timeoutTimer);  _state._timeoutTimer = null; }
  }

  /**
   * Cancela qualquer polling em andamento (ex: usuário desistiu da sala).
   */
  function cancel(){
    _clearTimers();
    console.log('[Arcium] Rodada cancelada.');
  }

  /**
   * Retorna o estado atual da rodada (pra debug ou HUD).
   */
  function getState(){
    return {
      roomCode:  _state.roomCode,
      roundNum:  _state.roundNum,
      mySlot:    _state.mySlot,
      committed: _state.committed,
      revealed:  _state.revealed,
      resolved:  _state.resolved
    };
  }

  return {
    init:          init,
    commit:        commit,
    waitAndReveal: waitAndReveal,
    cancel:        cancel,
    getState:      getState
  };
})();
