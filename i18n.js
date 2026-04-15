// i18n.js  v2  --  CapRush Overdrive!
// Injeta APENAS no #flag-container (sem duplicar se ja existir)
(function(){
  var langs = {
    pt: {
      nav_jogar:'JOGAR', nav_pilotos:'PILOTOS', nav_ranking:'RANKING', nav_manual:'MANUAL',
      page_title:'CapRush - Overdrive!',
      hero_sub:'Jogo de tampinhas para 1 a 4 jogadores',
      pilots_title:'ESCOLHA SEU PILOTO',
      pilots_sub:'Cada tampinha e um NFT com atributos reais - Velocidade, Controle e Aerodinamica',
      manual_title:'MANUAL DO JOGADOR',
      arch_title:'ARQUITETURA v0.4b',
    },
    en: {
      nav_jogar:'PLAY', nav_pilotos:'PILOTS', nav_ranking:'RANKING', nav_manual:'MANUAL',
      page_title:'CapRush - Overdrive!',
      hero_sub:'Bottle-cap racing game for 1 to 4 players',
      pilots_title:'CHOOSE YOUR PILOT',
      pilots_sub:'Each cap is an NFT with real attributes - Speed, Control and Aerodynamics',
      manual_title:'PLAYER MANUAL',
      arch_title:'ARCHITECTURE v0.4b',
    },
    es: {
      nav_jogar:'JUGAR', nav_pilotos:'PILOTOS', nav_ranking:'RANKING', nav_manual:'MANUAL',
      page_title:'CapRush - Overdrive!',
      hero_sub:'Juego de chapas para 1 a 4 jugadores',
      pilots_title:'ELIGE TU PILOTO',
      pilots_sub:'Cada tapa es un NFT con atributos reales - Velocidad, Control y Aerodinamica',
      manual_title:'MANUAL DEL JUGADOR',
      arch_title:'ARQUITECTURA v0.4b',
    }
  };

  var cur = localStorage.getItem('caprush_lang') || 'pt';

  function applyLang(l){
    cur = l;
    localStorage.setItem('caprush_lang', l);
    var d = langs[l] || langs.pt;
    // Textos de nav
    ['jogar','pilotos','ranking','manual'].forEach(function(k){
      var el = document.getElementById('nav-'+k);
      if(el) el.textContent = d['nav_'+k];
    });
    // Titulos de pagina
    if(d.page_title) document.title = d.page_title;
    var ht = document.getElementById('hero-title');
    if(ht) ht.textContent = d.hero_sub || '';
    var pt = document.getElementById('pilots-title');
    if(pt) pt.textContent = d.pilots_title || '';
    var ps = document.getElementById('pilots-sub');
    if(ps) ps.textContent = d.pilots_sub || '';
    var mt = document.getElementById('manual-title');
    if(mt) mt.textContent = d.manual_title || '';
    var at = document.getElementById('arch-title');
    if(at) at.textContent = d.arch_title || '';
    // Destaca bandeira ativa
    document.querySelectorAll('.flag-btn').forEach(function(b){
      b.classList.toggle('flag-active', b.dataset.lang === l);
    });
  }

  // Funcao global para onclick inline
  window.setFlagLang = function(l){ applyLang(l); };

  // Injeta bandeiras no #flag-container se estiver vazio
  function injectFlags(){
    var fc = document.getElementById('flag-container');
    if(!fc || fc.children.length > 0) return; // ja tem filhos -> nao injeta
    fc.innerHTML =
      '<button class="flag-btn" data-lang="pt" onclick="setFlagLang(\'pt\')" title="Portugues">' +
      '<svg width="28" height="19" viewBox="0 0 28 19"><rect width="28" height="19" fill="#009c3b"/>' +
      '<rect x="11" width="17" height="19" fill="#009c3b"/>' +
      '<polygon points="0,0 11,9.5 0,19" fill="#fedf00"/>' +
      '<polygon points="0,0 14,9.5 0,19" fill="#fedf00"/>' +
      '<circle cx="9" cy="9.5" r="4.2" fill="#002776"/>' +
      '<path d="M5.5,8.8 Q9,7 12.5,8.8" stroke="#fff" stroke-width=".8" fill="none"/>' +
      '</svg></button>' +
      '<button class="flag-btn" data-lang="en" onclick="setFlagLang(\'en\')" title="English">' +
      '<svg width="28" height="19" viewBox="0 0 28 19"><rect width="28" height="19" fill="#012169"/>' +
      '<path d="M0,0 L28,19 M28,0 L0,19" stroke="#fff" stroke-width="3"/>' +
      '<path d="M0,0 L28,19 M28,0 L0,19" stroke="#c8102e" stroke-width="1.5"/>' +
      '<path d="M14,0 V19 M0,9.5 H28" stroke="#fff" stroke-width="5"/>' +
      '<path d="M14,0 V19 M0,9.5 H28" stroke="#c8102e" stroke-width="3"/>' +
      '</svg></button>' +
      '<button class="flag-btn" data-lang="es" onclick="setFlagLang(\'es\')" title="Espanol">' +
      '<svg width="28" height="19" viewBox="0 0 28 19"><rect width="28" height="19" fill="#c60b1e"/>' +
      '<rect y="4.75" width="28" height="9.5" fill="#ffc400"/>' +
      '</svg></button>';
  }

  // Init
  document.addEventListener('DOMContentLoaded', function(){
    injectFlags();
    applyLang(cur);
  });
  if(document.readyState !== 'loading'){
    injectFlags();
    applyLang(cur);
  }
})();
