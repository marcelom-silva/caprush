// =============================================================================
// privy-auth.js  --  Marco 2: Privy Embedded Wallet (vanilla JS, sem framework)
// Caminho no repo: caprush/privy-auth.js
// =============================================================================
//
// ANTES DE USAR:
//  1. Crie um app em https://dashboard.privy.io
//  2. Em "Login methods" habilite: Google
//  3. Em "Embedded wallets" habilite Solana + "Create on login" = ON
//  4. Em "Allowed domains" adicione: caprush.vercel.app  e  localhost
//  5. Copie o App ID e o Client ID e cole abaixo
//  6. Em "Allowed OAuth redirect URLs" adicione: https://caprush.vercel.app
//
// =============================================================================

const PRIVY_APP_ID    = 'cmoi3fpo900ot0cl70ndu4ids';
const PRIVY_CLIENT_ID = 'client-WY6YfV5FxxAFNEnbeJChmb15z4NT7GU1Fdhca4cvGj2wr'; 

const SUPABASE_URL = 'https://rigghudagbzrzadsbeml.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpZ2dodWRhZ2J6cnphZHNiZW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNzk4OTUsImV4cCI6MjA5MTk1NTg5NX0.2fXODjCXc7IjsF7KS5cAMC-jt9ovxturuQUKmiApO9A';

// ---- Carrega Privy via ESM CDN (sem npm, sem build) ------------------------
// esm.sh transpile o pacote npm para uso direto no browser
import Privy, { LocalStorage } from 'https://esm.sh/@privy-io/js-sdk-core@latest';

// ---- Estado interno --------------------------------------------------------
let _privy = null;
let _iframeReady = false;
let _resolveReady = null;
const _readyPromise = new Promise(r => { _resolveReady = r; });

// ============================================================================
// INICIALIZACAO
// ============================================================================

function _boot() {
  if (_privy) return;

  _privy = new Privy({
    appId:    PRIVY_APP_ID,
    clientId: PRIVY_CLIENT_ID,
    storage:  new LocalStorage(),
  });

  // Iframe necessario para o secure context das embedded wallets
  const iframeSrc = _privy.embeddedWallet.getURL();
  const iframe = document.createElement('iframe');
  iframe.id = 'privy-wallet-frame';
  iframe.src = iframeSrc;
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'display:none;position:fixed;width:0;height:0;top:0;left:0;border:0;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  iframe.addEventListener('load', () => {
    _privy.setMessagePoster(iframe.contentWindow);
    window.addEventListener('message', (evt) => {
      // Privy usa postMessage para comunicar com o iframe de wallet
      _privy.embeddedWallet.onMessage(evt.data);
    });
    _iframeReady = true;
    _resolveReady();
    console.log('[PrivyAuth] iframe pronto');
  });

  // Fallback: se o iframe demorar > 10s, resolve mesmo assim
  setTimeout(() => { if (!_iframeReady) { _iframeReady = true; _resolveReady(); } }, 10000);
}

// ============================================================================
// HELPERS SUPABASE
// ============================================================================

async function _sbFetch(path, opts) {
  const res = await fetch(SUPABASE_URL + path, {
    ...opts,
    headers: {
      'apikey':        SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type':  'application/json',
      ...(opts && opts.headers),
    },
  });
  return res;
}

// Garante que o wallet esta na tabela cr_ledger (upsert sem sobrescrever saldo)
async function _upsertLedger(walletAddress, nickname, email) {
  if (!walletAddress) return;
  // Verifica se ja existe
  const check = await _sbFetch(
    '/rest/v1/cr_ledger?wallet=eq.' + encodeURIComponent(walletAddress) + '&select=wallet,cr_balance',
    { method: 'GET' }
  );
  const existing = await check.json().catch(() => []);

  if (existing && existing.length > 0) {
    // Apenas atualiza nickname e timestamp, preserva saldo
    await _sbFetch('/rest/v1/cr_ledger?wallet=eq.' + encodeURIComponent(walletAddress), {
      method: 'PATCH',
      body: JSON.stringify({
        nickname:   nickname,
        updated_at: new Date().toISOString(),
      }),
    });
  } else {
    // Insere novo registro
    await _sbFetch('/rest/v1/cr_ledger', {
      method: 'POST',
      headers: { 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        wallet:           walletAddress,
        nickname:         nickname,
        cr_balance:       0,
        cr_total_earned:  0,
        cr_staked:        0,
        cr_staked_until:  null,
        retroactive_done: false,
        updated_at:       new Date().toISOString(),
      }),
    });
  }
}

// ============================================================================
// EXTRATOR DE WALLET SOLANA (util interno)
// ============================================================================

function _getSolanaWallet(user) {
  if (!user || !user.linkedAccounts) return null;
  return user.linkedAccounts.find(
    (a) => a.type === 'wallet'
         && a.walletClientType === 'privy'
         && a.chainType === 'solana'
  ) || null;
}

function _getGoogleAccount(user) {
  if (!user || !user.linkedAccounts) return null;
  return user.linkedAccounts.find((a) => a.type === 'google_oauth') || null;
}

// ============================================================================
// LOGIN  (Google OAuth via Privy)
// ============================================================================

// ============================================================================
// OAUTH REDIRECT FLOW
// generateURL do SDK funciona sem iframe (cálculo local).
// Callback: Privy retorna privy_oauth_code (não "code" padrão OAuth).
// loginWithCode com parâmetros corretos → getAccessToken() para obter sessão.
// ============================================================================

function _getRedirectUri() {
  return window.location.origin + window.location.pathname;
}

// ── LOGIN: usa generateURL do SDK (não faz chamada API) ───────────────────────

async function login() {
  await _readyPromise;

  try {
    const redirectUri = _getRedirectUri();
    console.log('[PrivyAuth] Gerando URL OAuth via SDK. redirectUri:', redirectUri);

    const result = await _privy.auth.oauth.generateURL('google', redirectUri);
    console.log('[PrivyAuth] URL gerada. keys:', Object.keys(result));

    if (!result.url) throw new Error('generateURL não retornou url: ' + JSON.stringify(result));

    localStorage.setItem('_privy_oauth_pending',  '1');
    localStorage.setItem('_privy_redirect_uri',   redirectUri);

    window.location.href = result.url;

  } catch (err) {
    console.error('[PrivyAuth] Falha no login:', err.message);
    window.dispatchEvent(new CustomEvent('privyAuthError', {
      detail: { message: err.message || 'Erro ao iniciar login' }
    }));
    throw err;
  }
}

// ── CALLBACK: detecta retorno do Google com privy_oauth_code ─────────────────

async function _checkOAuthCallback() {
  const params     = new URLSearchParams(window.location.search);
  // Privy usa privy_oauth_code e privy_oauth_state (não os nomes OAuth padrão)
  const oauthCode  = params.get('privy_oauth_code');
  const oauthState = params.get('privy_oauth_state');
  const isPending  = localStorage.getItem('_privy_oauth_pending');

  if (!oauthCode && !isPending) return;

  // Limpa URL e flags
  window.history.replaceState({}, document.title, window.location.pathname);
  localStorage.removeItem('_privy_oauth_pending');
  const savedRedir = localStorage.getItem('_privy_redirect_uri') || _getRedirectUri();
  localStorage.removeItem('_privy_redirect_uri');

  if (!oauthCode) {
    console.warn('[PrivyAuth] Retorno OAuth sem privy_oauth_code');
    return;
  }

  console.log('[PrivyAuth] privy_oauth_code detectado — chamando loginWithCode...');

  await _readyPromise;

  try {
    // loginWithCode com os parâmetros privy-específicos
    let loginResult;
    try {
      loginResult = await _privy.auth.oauth.loginWithCode({
        privy_oauth_code:  oauthCode,
        privy_oauth_state: oauthState,
        redirect_to:       savedRedir,
      });
      console.log('[PrivyAuth] loginWithCode OK. keys:', Object.keys(loginResult || {}));
    } catch (e1) {
      console.warn('[PrivyAuth] loginWithCode (obj) falhou:', e1.message);
      // Tenta posicional
      loginResult = await _privy.auth.oauth.loginWithCode(oauthCode, oauthState, savedRedir);
      console.log('[PrivyAuth] loginWithCode (posicional) OK. keys:', Object.keys(loginResult || {}));
    }

    // Após loginWithCode, tenta obter o access token (mesmo que iframe bloqueado,
    // o token fica em memória por alguns segundos)
    let accessToken = null;
    for (let i = 0; i < 8; i++) {
      try {
        accessToken = await _privy.getAccessToken();
        if (accessToken) { console.log('[PrivyAuth] getAccessToken OK após', i, 'tentativas'); break; }
      } catch(_) {}
      await new Promise(r => setTimeout(r, 400));
    }

    if (accessToken) {
      await _finalizeFromToken(accessToken, loginResult);
      return;
    }

    // Fallback: usa dados do loginResult diretamente
    const user = (loginResult && loginResult.user) ? loginResult.user : loginResult;
    console.log('[PrivyAuth] Usando user do loginResult. keys:', Object.keys(user || {}));
    if (user && (user.id || user.sub || user.did)) {
      await _finalizeFromUser(user);
    } else {
      throw new Error('Sessão não obtida após loginWithCode. user: ' + JSON.stringify(user));
    }

  } catch (err) {
    console.error('[PrivyAuth] Falha no callback:', err.message);
    window.dispatchEvent(new CustomEvent('privyAuthError', {
      detail: { message: 'Erro ao completar login: ' + err.message }
    }));
  }
}

// ── Finaliza sessão a partir do access token (JWT) ────────────────────────────

async function _finalizeFromToken(token, loginResult) {
  // Usa o user completo do loginResult (tem linkedAccounts com wallet)
  const fullUser = loginResult && loginResult.user;
  const privyToken = loginResult && (loginResult.privy_access_token || loginResult.token);
  const accessToken = token || privyToken;

  if (accessToken) localStorage.setItem('caprush_access_token', accessToken);

  if (fullUser) {
    console.log('[PrivyAuth] Usando user completo do loginResult. linkedAccounts:', (fullUser.linkedAccounts || []).length);
    return await _finalizeSession(fullUser, accessToken);
  }

  // Fallback: decodifica JWT
  let email = '', name = '', picture = '', userId = '';
  try {
    const parts = accessToken.split('.');
    const payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
    userId  = payload.sub || payload.user_id || '';
    email   = payload.email   || '';
    name    = payload.name    || '';
    picture = payload.picture || '';
    console.log('[PrivyAuth] JWT decoded. sub:', userId.slice(0,15));
  } catch(e) { console.warn('[PrivyAuth] JWT decode falhou:', e.message); }

  return await _finalizeSession({ id: userId, email, name, picture }, accessToken);
}

async function _finalizeFromUser(user) {
  return await _finalizeSession(user, localStorage.getItem('caprush_access_token'));
}

// ============================================================================
// FINALIZACAO DE SESSAO  (cria wallet se necessario, persiste dados)
// ============================================================================

async function _finalizeSession(user, accessToken) {
  if (!user) throw new Error('[PrivyAuth] usuario nulo apos login');

  const userId  = user.id || user.did || user.sub || user.userId || '';
  console.log('[PrivyAuth] _finalizeSession. userId:', userId.slice(0,20));

  const googleAcc = (user.linkedAccounts || []).find(a => a.type === 'google_oauth');
  const email     = googleAcc?.email   || user.email   || '';
  const name      = googleAcc?.name    || user.name    || '';
  const picture   = googleAcc?.profilePictureUrl || googleAcc?.picture || user.picture || '';

  // Wallet: usa endereço Solana se disponível, senão DID como placeholder
  // (wallet real Solana será configurada no Marco 3 via backend)
  const existingWallet = (user.linkedAccounts || []).find(
    a => (a.type === 'wallet') && (a.chain_type === 'solana' || a.chainType === 'solana')
  );
  const walletAddress = existingWallet?.address || userId;

  const existingNick = localStorage.getItem('caprush_nickname');
  const nickname = existingNick || name.split(' ')[0] || email.split('@')[0] || 'Player';

  const session = { id: userId, email, name, picture, walletAddress, nickname, loginAt: Date.now() };
  _saveSession(session);

  try { await _upsertLedger(walletAddress, nickname, email); } catch(e) { console.warn('[PrivyAuth] Supabase upsert falhou:', e.message); }

  window.dispatchEvent(new CustomEvent('privyAuthLogin', { detail: session }));
  console.log('[PrivyAuth] Login OK. id:', userId.slice(0,20), '| wallet:', walletAddress.slice(0,20));
  return session;
}

// ============================================================================
// RESTORE DE SESSAO  (ao carregar a pagina)
// ============================================================================

async function restoreSession() {
  await _readyPromise;

  // Verifica se é retorno de OAuth
  const params = new URLSearchParams(window.location.search);
  if (params.get('privy_oauth_code') || localStorage.getItem('_privy_oauth_pending')) {
    await _checkOAuthCallback();
    return _loadSession();
  }

  // Tenta sessão ativa via SDK
  try {
    const token = await _privy.getAccessToken();
    if (token) {
      await _finalizeFromToken(token, null);
      return _loadSession();
    }
  } catch (_) {}

  // Fallback localStorage
  const stored = _loadSession();
  if (stored && stored.id) return stored;
  return null;
}

// ============================================================================
// LOGOUT
// ============================================================================

async function logout() {
  try { await _privy.auth.logout(); } catch (_) {}
  localStorage.removeItem('caprush_privy_session');
  localStorage.removeItem('caprush_wallet');
  localStorage.removeItem('caprush_user_email');
  localStorage.removeItem('caprush_user_name');
  localStorage.removeItem('caprush_user_picture');
  localStorage.removeItem('caprush_user');
  localStorage.removeItem('caprush_custom_nickname');
  localStorage.removeItem('caprush_access_token');
  window.dispatchEvent(new CustomEvent('privyAuthLogout'));
  console.log('[PrivyAuth] Logout OK');
}

// ============================================================================
// GETTERS PUBLICOS
// ============================================================================

function getSession() {
  return _loadSession();
}

function isAuthenticated() {
  const s = _loadSession();
  return !!(s && s.id);
}

function getWalletAddress() {
  return localStorage.getItem('caprush_wallet') || '';
}

function getNickname() {
  return localStorage.getItem('caprush_nickname') || 'Player';
}

// ============================================================================
// PERSISTENCIA LOCAL (interno)
// ============================================================================

function _saveSession(session) {
  try {
    localStorage.setItem('caprush_privy_session', JSON.stringify(session));
    localStorage.setItem('caprush_wallet',       session.walletAddress || '');
    localStorage.setItem('caprush_user_email',   session.email || '');
    localStorage.setItem('caprush_user_name',    session.name || '');
    localStorage.setItem('caprush_user_picture', session.picture || '');
    if (!localStorage.getItem('caprush_nickname') && session.nickname) {
      localStorage.setItem('caprush_nickname', session.nickname);
    }
  } catch (_) { /* localStorage indisponivel */ }
}

function _loadSession() {
  try {
    const raw = localStorage.getItem('caprush_privy_session');
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

// ============================================================================
// BOOT + EXPORT GLOBAL
// ============================================================================

// Inicializa ao carregar o modulo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _boot);
} else {
  _boot();
}

// Verifica callback OAuth imediatamente (URL pode ter privy_oauth_code)
_checkOAuthCallback();

// Expoe API global para scripts nao-modulo poderem chamar window.PrivyAuth.*
window.PrivyAuth = {
  login,
  logout,
  restoreSession,
  getSession,
  isAuthenticated,
  getWalletAddress,
  getNickname,
};

window.dispatchEvent(new CustomEvent('privyAuthReady'));
console.log('[PrivyAuth] Modulo carregado. Aguardando iframe...');
