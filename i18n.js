// CapRush i18n v1.2 - páginas estáticas
window.I18N = (function(){
const dict = {
  pt: {
    // MENU GLOBAL
    play:"JOGAR", pilots:"PILOTOS", ranking:"RANKING", manual:"MANUAL", arch:"ARQUITETURA", lobby:"Lobby",
    // INDEX
    "index-play":"JOGAR AGORA",
    // ARQUITETURA
    "arch-title":"ARQUITETURA v0.4b",
    "arch-desc":"Documentação técnica do CapRush Overdrive! — Fase 1 (Protótipo Jogável).",
    "arch-files":"ESTRUTURA DE ARQUIVOS",
    "arch-changes":"MUDANÇAS v0.4b",
    "arch-tech":"TECNOLOGIAS",
    "arch-multi":"MULTIPLAYER ONLINE",
    // MANUAL
    "manual-title":"MANUAL DO JOGADOR",
    "manual-intro":"Bem-vindo ao CapRush Overdrive! — o jogo de corrida de tampinhas mais eletrizante do universo digital.",
    "manual-how":"COMO JOGAR",
    "manual-surfaces":"SUPERFÍCIES DA PISTA",
    "manual-modes":"MODOS DE JOGO",
    // PERSONAGENS
    "pilots-title":"ESCOLHA SEU PILOTO",
    "pilots-sub":"Cada tampinha é um NFT com atributos reais — Velocidade, Controle e Aerodinâmica",
    // RANKING
    "rank-title":"Ranking Global T1",
    "rank-season":"TEMPORADA ATUAL",
    // GERAL
    turn:"TURNO", force:"FORÇA", power:"Potência", waiting:"AGUARDANDO...",
    connection:"CONEXÃO", disconnected:"DESCONECTADO"
  },
  en: {
    play:"PLAY", pilots:"PILOTS", ranking:"LEADERBOARD", manual:"MANUAL", arch:"ARCHITECTURE", lobby:"Lobby",
    "index-play":"PLAY NOW",
    "arch-title":"ARCHITECTURE v0.4b",
    "arch-desc":"CapRush Overdrive technical documentation — Phase 1 (Playable Prototype).",
    "arch-files":"FILE STRUCTURE",
    "arch-changes":"CHANGES v0.4b",
    "arch-tech":"TECHNOLOGIES",
    "arch-multi":"ONLINE MULTIPLAYER",
    "manual-title":"PLAYER MANUAL",
    "manual-intro":"Welcome to CapRush Overdrive! — the most electrifying bottle cap racing game in the digital universe.",
    "manual-how":"HOW TO PLAY",
    "manual-surfaces":"TRACK SURFACES",
    "manual-modes":"GAME MODES",
    "pilots-title":"CHOOSE YOUR PILOT",
    "pilots-sub":"Each cap is an NFT with real attributes — Speed, Control and Aerodynamics",
    "rank-title":"Global Ranking S1",
    "rank-season":"CURRENT SEASON",
    turn:"TURN", force:"POWER", power:"Power", waiting:"WAITING...",
    connection:"CONNECTION", disconnected:"DISCONNECTED"
  },
  es: {
    play:"JUGAR", pilots:"PILOTOS", ranking:"CLASIFICACIÓN", manual:"MANUAL", arch:"ARQUITECTURA", lobby:"Lobby",
    "index-play":"JUGAR AHORA",
    "arch-title":"ARQUITECTURA v0.4b",
    "arch-desc":"Documentación técnica de CapRush Overdrive — Fase 1 (Prototipo Jugable).",
    "arch-files":"ESTRUCTURA DE ARCHIVOS",
    "arch-changes":"CAMBIOS v0.4b",
    "arch-tech":"TECNOLOGÍAS",
    "arch-multi":"MULTIJUGADOR ONLINE",
    "manual-title":"MANUAL DEL JUGADOR",
    "manual-intro":"¡Bienvenido a CapRush Overdrive! — el juego de carreras de tapas más electrizante del universo digital.",
    "manual-how":"CÓMO JUGAR",
    "manual-surfaces":"SUPERFICIES DE LA PISTA",
    "manual-modes":"MODOS DE JUEGO",
    "pilots-title":"ELIGE TU PILOTO",
    "pilots-sub":"Cada tapa es un NFT con atributos reales — Velocidad, Control y Aerodinámica",
    "rank-title":"Ranking Global T1",
    "rank-season":"TEMPORADA ACTUAL",
    turn:"TURNO", force:"FUERZA", power:"Potencia", waiting:"ESPERANDO...",
    connection:"CONEXIÓN", disconnected:"DESCONECTADO"
  }
};

function getLang(){ return localStorage.getItem('lang') || 'pt'; }
function setLang(l){ localStorage.setItem('lang', l); apply(); }
function t(k){ const l=getLang(); return (dict[l]&&dict[l][k]) || dict.pt[k] || k; }

function apply(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.documentElement.lang = getLang();

  // bandeiras
  const fc = document.getElementById('flag-container');
  if(fc &&!fc.hasChildNodes()){
    fc.innerHTML = `
      <button class="flag-btn flag-pt" onclick="setLang('pt')" title="Português"></button>
      <button class="flag-btn flag-us" onclick="setLang('en')" title="English"></button>
      <button class="flag-btn flag-es" onclick="setLang('es')" title="Español"></button>`;
  }
  document.querySelectorAll('.flag-btn').forEach(b=>{
    b.classList.toggle('flag-active',
      (b.classList.contains('flag-pt') && getLang()==='pt') ||
      (b.classList.contains('flag-us') && getLang()==='en') ||
      (b.classList.contains('flag-es') && getLang()==='es')
    );
  });
}

document.addEventListener('DOMContentLoaded', apply);
window.setLang = setLang;
return { t, setLang, apply, getLang };
})();