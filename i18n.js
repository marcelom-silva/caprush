// CapRush i18n v1.3 - com manual completo
window.I18N = (function(){
const dict = {
  pt: {
    play:"JOGAR", pilots:"PILOTOS", ranking:"RANKING", manual:"MANUAL", arch:"ARQUITETURA", lobby:"Lobby",
    "index-play":"JOGAR AGORA",
    "arch-title":"ARQUITETURA v0.4b", "arch-desc":"Documentação técnica do CapRush Overdrive! — Fase 1 (Protótipo Jogável).", "arch-files":"ESTRUTURA DE ARQUIVOS", "arch-changes":"MUDANÇAS v0.4b", "arch-tech":"TECNOLOGIAS", "arch-multi":"MULTIPLAYER ONLINE",
    "manual-title":"MANUAL DO JOGADOR",
    "manual-intro":"Bem-vindo ao CapRush Overdrive! — o jogo de corrida de tampinhas mais eletrizante do universo digital.",
    "manual-how":"COMO JOGAR",
    "manual-how-desc":"O controle é simples: clique e arraste para mirar, solte para lançar. A força depende de quanto você puxou.",
    "manual-step1":"<strong>Clique sobre a sua tampinha</strong> — um círculo pulsante indica qual é a sua.",
    "manual-step2":"<strong>Arraste para trás</strong> em relação ao destino. Quanto mais longe, mais força.",
    "manual-step3":"<strong>Solte o mouse</strong> para disparar. A tampinha parte na direção oposta ao arrasto.",
    "manual-step4":"<strong>Passe pelos Checkpoints</strong> em ordem (CP1 → CP2 → CP3) e cruze a linha para completar a volta.",
    "manual-tip-force":"ℹ A barra de Força no painel direito mostra a potência atual em tempo real.",
    "manual-surfaces":"SUPERFÍCIES DA PISTA",
    "manual-th-surface":"Superfície", "manual-th-effect":"Efeito", "manual-th-tip":"Dica",
    "manual-surf-asphalt":"Asfalto", "manual-surf-asphalt-e":"Normal, sem bônus", "manual-surf-asphalt-t":"Linha ideal de corrida",
    "manual-surf-water":"Água", "manual-surf-water-e":"Mais aderência", "manual-surf-water-t":"Use para curvas fechadas",
    "manual-surf-grass":"Grama", "manual-surf-grass-e":"Menos aderência", "manual-surf-grass-t":"Evite ou use para desviar",
    "manual-surf-obs":"Obstáculos", "manual-surf-obs-e":"Reflete a tampinha", "manual-surf-obs-t":"Use estrategicamente",
    "manual-modes":"MODOS DE JOGO",
    "manual-mode-solo":"SOLO", "manual-mode-solo-d":"Corra contra o tempo. Complete 2 voltas no menor tempo possível.",
    "manual-mode-1v1":"1v1 LOCAL", "manual-mode-1v1-d":"Dois jogadores se alternam no mesmo PC. YUKI vs KENTA disputam 2 voltas.",
    "manual-mode-online":"ONLINE (Beta)", "manual-mode-online-d":"Desafie amigos via WebRTC. Um cria a sala, o outro entra com o código.",
    "manual-online-tip":"ℹ Se o jogo estiver no Vercel ou GitHub Pages, qualquer pessoa com o link pode jogar.",
    "manual-audio":"MÚSICA E EFEITOS", "manual-audio-d":"O botão ♬ liga/desliga a música. O botão ▶▶ controla os efeitos.", "manual-audio-w":"⚠ Alguns navegadores bloqueiam áudio automático. Clique no jogo para ativar.",
    "manual-pilots-d":"Cada piloto tem atributos que afetam a tampinha.",
    "manual-tips":"DICAS AVANÇADAS", "manual-tips-d":"Use as bordas como guia. Tampinhas fora da pista voltam ao último checkpoint. Planeje a trajetória.",
    "pilots-title":"ESCOLHA SEU PILOTO", "pilots-sub":"Cada tampinha é um NFT com atributos reais — Velocidade, Controle e Aerodinâmica",
    "rank-title":"Ranking Global T1", "rank-season":"TEMPORADA ATUAL",
    turn:"TURNO", force:"FORÇA", power:"Potência", waiting:"AGUARDANDO...", connection:"CONEXÃO", disconnected:"DESCONECTADO"
  },
  en: {
    play:"PLAY", pilots:"PILOTS", ranking:"LEADERBOARD", manual:"MANUAL", arch:"ARCHITECTURE", lobby:"Lobby",
    "index-play":"PLAY NOW",
    "arch-title":"ARCHITECTURE v0.4b", "arch-desc":"CapRush Overdrive technical documentation — Phase 1 (Playable Prototype).", "arch-files":"FILE STRUCTURE", "arch-changes":"CHANGES v0.4b", "arch-tech":"TECHNOLOGIES", "arch-multi":"ONLINE MULTIPLAYER",
    "manual-title":"PLAYER MANUAL",
    "manual-intro":"Welcome to CapRush Overdrive! — the most electrifying bottle cap racing game in the digital universe.",
    "manual-how":"HOW TO PLAY",
    "manual-how-desc":"Control is simple: click and drag to aim, release to launch. Power depends on pull distance.",
    "manual-step1":"<strong>Click your cap</strong> — a pulsing circle shows which is yours.",
    "manual-step2":"<strong>Drag backwards</strong> from your target. The farther, the more power.",
    "manual-step3":"<strong>Release</strong> to shoot. The cap flies opposite to the drag.",
    "manual-step4":"<strong>Hit Checkpoints</strong> in order (CP1 → CP2 → CP3) then cross the line.",
    "manual-tip-force":"ℹ The Power bar on the right shows current launch power in real time.",
    "manual-surfaces":"TRACK SURFACES",
    "manual-th-surface":"Surface", "manual-th-effect":"Effect", "manual-th-tip":"Tip",
    "manual-surf-asphalt":"Asphalt", "manual-surf-asphalt-e":"Normal, no bonus", "manual-surf-asphalt-t":"Ideal racing line",
    "manual-surf-water":"Water", "manual-surf-water-e":"More grip", "manual-surf-water-t":"Use for tight corners",
    "manual-surf-grass":"Grass", "manual-surf-grass-e":"Less grip", "manual-surf-grass-t":"Avoid or use to drift",
    "manual-surf-obs":"Obstacles", "manual-surf-obs-e":"Bounces cap", "manual-surf-obs-t":"Use strategically",
    "manual-modes":"GAME MODES",
    "manual-mode-solo":"SOLO", "manual-mode-solo-d":"Race against time. Complete 2 laps as fast as possible.",
    "manual-mode-1v1":"1v1 LOCAL", "manual-mode-1v1-d":"Two players alternate on same PC. YUKI vs KENTA race 2 laps.",
    "manual-mode-online":"ONLINE (Beta)", "manual-mode-online-d":"Challenge friends via WebRTC. One hosts, other joins with code.",
    "manual-online-tip":"ℹ If hosted on Vercel or GitHub Pages, anyone with the link can play.",
    "manual-audio":"MUSIC & SFX", "manual-audio-d":"♬ toggles music. ▶▶ toggles sound effects.", "manual-audio-w":"⚠ Some browsers block autoplay. Click in-game to enable audio.",
    "manual-pilots-d":"Each pilot has attributes that affect the cap.",
    "manual-tips":"ADVANCED TIPS", "manual-tips-d":"Use edges as guides. Off-track caps respawn at last checkpoint. Plan your path.",
    "pilots-title":"CHOOSE YOUR PILOT", "pilots-sub":"Each cap is an NFT with real attributes — Speed, Control and Aerodynamics",
    "rank-title":"Global Ranking S1", "rank-season":"CURRENT SEASON",
    turn:"TURN", force:"POWER", power:"Power", waiting:"WAITING...", connection:"CONNECTION", disconnected:"DISCONNECTED"
  },
  es: {
    play:"JUGAR", pilots:"PILOTOS", ranking:"CLASIFICACIÓN", manual:"MANUAL", arch:"ARQUITECTURA", lobby:"Lobby",
    "index-play":"JUGAR AHORA",
    "arch-title":"ARQUITECTURA v0.4b", "arch-desc":"Documentación técnica de CapRush Overdrive — Fase 1 (Prototipo Jugable).", "arch-files":"ESTRUCTURA DE ARCHIVOS", "arch-changes":"CAMBIOS v0.4b", "arch-tech":"TECNOLOGÍAS", "arch-multi":"MULTIJUGADOR ONLINE",
    "manual-title":"MANUAL DEL JUGADOR",
    "manual-intro":"¡Bienvenido a CapRush Overdrive! — el juego de carreras de tapas más electrizante del universo digital.",
    "manual-how":"CÓMO JUGAR",
    "manual-how-desc":"Control simple: haz clic y arrastra para apuntar, suelta para lanzar. La fuerza depende de la distancia.",
    "manual-step1":"<strong>Haz clic en tu tapa</strong> — un círculo pulsante indica cuál es.",
    "manual-step2":"<strong>Arrastra hacia atrás</strong>. Cuanto más lejos, más fuerza.",
    "manual-step3":"<strong>Suelta</strong> para disparar. La tapa va en dirección opuesta.",
    "manual-step4":"<strong>Pasa por los Checkpoints</strong> en orden (CP1 → CP2 → CP3) y cruza la meta.",
    "manual-tip-force":"ℹ La barra de Fuerza muestra la potencia actual en tiempo real.",
    "manual-surfaces":"SUPERFICIES DE LA PISTA",
    "manual-th-surface":"Superficie", "manual-th-effect":"Efecto", "manual-th-tip":"Consejo",
    "manual-surf-asphalt":"Asfalto", "manual-surf-asphalt-e":"Normal, sin bonus", "manual-surf-asphalt-t":"Línea ideal",
    "manual-surf-water":"Agua", "manual-surf-water-e":"Más agarre", "manual-surf-water-t":"Usa en curvas cerradas",
    "manual-surf-grass":"Césped", "manual-surf-grass-e":"Menos agarre", "manual-surf-grass-t":"Evita o úsalo para desviar",
    "manual-surf-obs":"Obstáculos", "manual-surf-obs-e":"Rebota la tapa", "manual-surf-obs-t":"Úsalos estratégicamente",
    "manual-modes":"MODOS DE JUEGO",
    "manual-mode-solo":"SOLO", "manual-mode-solo-d":"Corre contra el tiempo. Completa 2 vueltas lo más rápido posible.",
    "manual-mode-1v1":"1v1 LOCAL", "manual-mode-1v1-d":"Dos jugadores alternan en la misma PC. YUKI vs KENTA.",
    "manual-mode-online":"ONLINE (Beta)", "manual-mode-online-d":"Desafía amigos vía WebRTC. Uno crea sala, otro entra con código.",
    "manual-online-tip":"ℹ Si está en Vercel o GitHub Pages, cualquiera con el link puede jugar.",
    "manual-audio":"MÚSICA Y EFECTOS", "manual-audio-d":"♬ activa música. ▶▶ controla efectos.", "manual-audio-w":"⚠ Algunos navegadores bloquean audio. Haz clic para activar.",
    "manual-pilots-d":"Cada piloto tiene atributos que afectan la tapa.",
    "manual-tips":"CONSEJOS AVANZADOS", "manual-tips-d":"Usa los bordes como guía. Fuera de pista reapareces en el último checkpoint.",
    "pilots-title":"ELIGE TU PILOTO", "pilots-sub":"Cada tapa es un NFT con atributos reales — Velocidad, Control y Aerodinámica",
    "rank-title":"Ranking Global T1", "rank-season":"TEMPORADA ACTUAL",
    turn:"TURNO", force:"FUERZA", power:"Potencia", waiting:"ESPERANDO...", connection:"CONEXIÓN", disconnected:"DESCONECTADO"
  }
};
function getLang(){ return localStorage.getItem('lang') || 'pt'; }
function setLang(l){ localStorage.setItem('lang', l); apply(); }
function t(k){ const l=getLang(); return (dict[l]&&dict[l][k]) || dict.pt[k] || k; }
function apply(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k = el.getAttribute('data-i18n');
    el.innerHTML = t(k);
  });
  document.documentElement.lang = getLang();
  const fc = document.getElementById('flag-container');
  if(fc &&!fc.hasChildNodes()){
    fc.innerHTML = `<button class="flag-btn flag-pt" onclick="setLang('pt')" title="Português"></button>
      <button class="flag-btn flag-us" onclick="setLang('en')" title="English"></button>
      <button class="flag-btn flag-es" onclick="setLang('es')" title="Español"></button>`;
  }
  document.querySelectorAll('.flag-btn').forEach(b=>{
    b.classList.toggle('flag-active',
      (b.classList.contains('flag-pt') && getLang()==='pt') ||
      (b.classList.contains('flag-us') && getLang()==='en') ||
      (b.classList.contains('flag-es') && getLang()==='es'));
  });
}
document.addEventListener('DOMContentLoaded', apply);
window.setLang = setLang;
return { t, setLang, apply, getLang };
})();