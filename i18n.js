
/* CapRush i18n — PT-BR / EN-US / ES — v1.0 */
(function(w){
'use strict';

var LANGS = {
  pt: {
    /* NAV */
    'nav.jogar':'JOGAR','nav.pilotos':'PILOTOS','nav.ranking':'RANKING',
    'nav.manual':'MANUAL','nav.arquitetura':'ARQUITETURA','nav.lobby':'LOBBY',
    /* INDEX hero */
    'hero.proto':'Prototype v0.2 · Fogo SVM · Devnet',
    'cap.jogar.lbl':'JOGAR','cap.pilotos.lbl':'PILOTOS',
    'cap.ranking.lbl':'RANKING','cap.arq.lbl':'ARQT.',
    'cap.manual.lbl':'MANUAL',
    'cap.jogar.name':'JOGAR','cap.pilotos.name':'PILOTOS',
    'cap.ranking.name':'RANKING','cap.arq.name':'ARQUITETURA',
    'cap.manual.name':'MANUAL',
    /* PERSONAGENS */
    'pg.hero.title':'ESCOLHA SEU PILOTO',
    'pg.hero.sub':'Cada tampinha é um NFT com atributos reais — velocidade, controle e aerodinâmica',
    'pg.kenta.title':'Maine Coon Brown Tabby / Especialidade: Velocidade',
    'pg.yuki.title':'Samoeida / Especialidade: Controle',
    'pg.bruna.title':'SRD Marrom / Especialidade: Versatilidade',
    'pg.tapz.title':'Golden Retriever Angelical / Especialidade: Força Máxima',
    'pg.abl.kenta':'Bônus de +18% de velocidade no primeiro lançamento de cada volta. Ideal para abrir vantagem na largada.',
    'pg.abl.yuki':'Reduz o erro angular em 9% — a mira fica mais precisa. Perfeita para chicanes e curvas fechadas.',
    'pg.abl.bruna':'Bônus +5% em todos os atributos ao completar uma volta sem errar nenhum checkpoint.',
    'pg.abl.tapz':'Ignora 40% do arrasto de qualquer superfície. A mais veloz em linha reta — quase impossível de controlar.',
    'pg.sel':'SELECIONAR','pg.play':'JOGAR AGORA',
    'pg.locked':'BLOQUEADA','pg.next':'Próxima Fase','pg.nft':'Via Marketplace NFT',
    'attr.vel':'Velocidade','attr.ctrl':'Controle','attr.aero':'Aerodin.',
    /* GAME UI */
    'hud.volta':'Volta','hud.cp':'Checkpoint','hud.tempo':'Tempo','hud.melhor':'Melhor',
    'ui.forca':'FORCA','ui.potencia':'Potencia','ui.piloto':'PILOTO',
    'ui.pista':'PISTA','ui.eventos':'EVENTOS',
    'surf.asfalto':'Asfalto (normal)','surf.agua':'Água (mais aderente)',
    'surf.grama':'Grama (desliza mais)','surf.obs':'Obstáculos',
    'overlay.ready':'PRONTO?','overlay.click':'Clique aqui para começar',
    'overlay.hint':'Clique e arraste a tampinha para mirar',
    'overlay.start':'▶ CLIQUE PARA COMEÇAR',
    'lobby':'← LOBBY','multi.btn':'2P →',
    /* RANKING */
    'rk.title':'RANKING GLOBAL','rk.sub':'Top pilotos de todas as pistas',
    'rk.pos':'POS','rk.piloto':'PILOTO','rk.pista':'PISTA',
    'rk.tempo':'TEMPO','rk.data':'DATA',
    /* ONLINE */
    'online.title':'ONLINE 1v1','online.sub':'Duelo via internet (Beta)',
    'online.criar':'CRIAR SALA','online.criar.btn':'CRIAR SALA E AGUARDAR',
    'online.entrar':'ENTRAR EM SALA','online.entrar.btn':'ENTRAR NA SALA',
    'online.nick.c':'Seu nickname','online.nick.j':'Seu nickname',
    'online.code.ph':'Código da sala (5 letras)',
    'online.connecting':'Conectando ao servidor...',
    'online.offline':'Servidor offline. Veja o Manual → Online 1v1.',
    'online.guide.title':'Como jogar Online',
    /* MANUAL */
    'man.title':'MANUAL DO JOGADOR',
  },
  en: {
    'nav.jogar':'PLAY','nav.pilotos':'PILOTS','nav.ranking':'RANKING',
    'nav.manual':'MANUAL','nav.arquitetura':'ARCHITECTURE','nav.lobby':'LOBBY',
    'hero.proto':'Prototype v0.2 · Fogo SVM · Devnet',
    'cap.jogar.lbl':'PLAY','cap.pilotos.lbl':'PILOTS',
    'cap.ranking.lbl':'RANKING','cap.arq.lbl':'ARCH.',
    'cap.manual.lbl':'MANUAL',
    'cap.jogar.name':'PLAY','cap.pilotos.name':'PILOTS',
    'cap.ranking.name':'RANKING','cap.arq.name':'ARCHITECTURE',
    'cap.manual.name':'MANUAL',
    'pg.hero.title':'CHOOSE YOUR PILOT',
    'pg.hero.sub':'Each bottle cap is an NFT with real attributes — speed, control and aerodynamics',
    'pg.kenta.title':'Maine Coon Brown Tabby / Specialty: Speed',
    'pg.yuki.title':'Samoyed / Specialty: Control',
    'pg.bruna.title':'Mixed Breed Brown / Specialty: Versatility',
    'pg.tapz.title':'Angelic Golden Retriever / Specialty: Max Power',
    'pg.abl.kenta':'+18% speed bonus on first launch of each lap. Great for gaining early advantage.',
    'pg.abl.yuki':'Reduces angular error by 9% — aiming is more precise. Perfect for chicanes and tight curves.',
    'pg.abl.bruna':'+5% to all attributes when completing a lap without missing any checkpoint.',
    'pg.abl.tapz':'Ignores 40% of drag from any surface. Fastest in a straight line — almost impossible to control.',
    'pg.sel':'SELECT','pg.play':'PLAY NOW',
    'pg.locked':'LOCKED','pg.next':'Next Phase','pg.nft':'Via NFT Marketplace',
    'attr.vel':'Speed','attr.ctrl':'Control','attr.aero':'Aerodyn.',
    'hud.volta':'Lap','hud.cp':'Checkpoint','hud.tempo':'Time','hud.melhor':'Best',
    'ui.forca':'POWER','ui.potencia':'Power','ui.piloto':'PILOT',
    'ui.pista':'TRACK','ui.eventos':'EVENTS',
    'surf.asfalto':'Asphalt (normal)','surf.agua':'Water (more grip)',
    'surf.grama':'Grass (slides more)','surf.obs':'Obstacles',
    'overlay.ready':'READY?','overlay.click':'Click here to start',
    'overlay.hint':'Click and drag the cap to aim',
    'overlay.start':'▶ CLICK TO START',
    'lobby':'← LOBBY','multi.btn':'2P →',
    'rk.title':'GLOBAL RANKING','rk.sub':'Top pilots across all tracks',
    'rk.pos':'POS','rk.piloto':'PILOT','rk.pista':'TRACK',
    'rk.tempo':'TIME','rk.data':'DATE',
    'online.title':'ONLINE 1v1','online.sub':'Internet duel (Beta)',
    'online.criar':'CREATE ROOM','online.criar.btn':'CREATE ROOM & WAIT',
    'online.entrar':'JOIN ROOM','online.entrar.btn':'JOIN ROOM',
    'online.nick.c':'Your nickname','online.nick.j':'Your nickname',
    'online.code.ph':'Room code (5 letters)',
    'online.connecting':'Connecting to server...',
    'online.offline':'Server offline. See Manual → Online 1v1.',
    'online.guide.title':'How to play Online',
    'man.title':'PLAYER MANUAL',
  },
  es: {
    'nav.jogar':'JUGAR','nav.pilotos':'PILOTOS','nav.ranking':'RANKING',
    'nav.manual':'MANUAL','nav.arquitetura':'ARQUITECTURA','nav.lobby':'LOBBY',
    'hero.proto':'Prototipo v0.2 · Fogo SVM · Devnet',
    'cap.jogar.lbl':'JUGAR','cap.pilotos.lbl':'PILOTOS',
    'cap.ranking.lbl':'RANKING','cap.arq.lbl':'ARQ.',
    'cap.manual.lbl':'MANUAL',
    'cap.jogar.name':'JUGAR','cap.pilotos.name':'PILOTOS',
    'cap.ranking.name':'RANKING','cap.arq.name':'ARQUITECTURA',
    'cap.manual.name':'MANUAL',
    'pg.hero.title':'ELIGE TU PILOTO',
    'pg.hero.sub':'Cada tapita es un NFT con atributos reales — velocidad, control y aerodinámica',
    'pg.kenta.title':'Maine Coon Tabby Marrón / Especialidad: Velocidad',
    'pg.yuki.title':'Samoyedo / Especialidad: Control',
    'pg.bruna.title':'Mezcla Marrón / Especialidad: Versatilidad',
    'pg.tapz.title':'Golden Retriever Angelical / Especialidad: Fuerza Máxima',
    'pg.abl.kenta':'+18% de velocidad en el primer lanzamiento de cada vuelta. Ideal para ganar ventaja al inicio.',
    'pg.abl.yuki':'Reduce el error angular en 9% — la puntería es más precisa. Perfecta para curvas cerradas.',
    'pg.abl.bruna':'+5% en todos los atributos al completar una vuelta sin fallar ningún checkpoint.',
    'pg.abl.tapz':'Ignora el 40% del arrastre de cualquier superficie. La más rápida en línea recta — casi imposible de controlar.',
    'pg.sel':'SELECCIONAR','pg.play':'JUGAR AHORA',
    'pg.locked':'BLOQUEADO','pg.next':'Próxima Fase','pg.nft':'Vía Marketplace NFT',
    'attr.vel':'Velocidad','attr.ctrl':'Control','attr.aero':'Aerodín.',
    'hud.volta':'Vuelta','hud.cp':'Checkpoint','hud.tempo':'Tiempo','hud.melhor':'Mejor',
    'ui.forca':'FUERZA','ui.potencia':'Potencia','ui.piloto':'PILOTO',
    'ui.pista':'PISTA','ui.eventos':'EVENTOS',
    'surf.asfalto':'Asfalto (normal)','surf.agua':'Agua (más adherencia)',
    'surf.grama':'Hierba (desliza más)','surf.obs':'Obstáculos',
    'overlay.ready':'¿LISTO?','overlay.click':'Haz clic aquí para empezar',
    'overlay.hint':'Haz clic y arrastra la tapita para apuntar',
    'overlay.start':'▶ CLIC PARA EMPEZAR',
    'lobby':'← LOBBY','multi.btn':'2J →',
    'rk.title':'RANKING GLOBAL','rk.sub':'Top pilotos de todas las pistas',
    'rk.pos':'POS','rk.piloto':'PILOTO','rk.pista':'PISTA',
    'rk.tempo':'TIEMPO','rk.data':'FECHA',
    'online.title':'ONLINE 1v1','online.sub':'Duelo por internet (Beta)',
    'online.criar':'CREAR SALA','online.criar.btn':'CREAR SALA Y ESPERAR',
    'online.entrar':'ENTRAR EN SALA','online.entrar.btn':'ENTRAR EN SALA',
    'online.nick.c':'Tu apodo','online.nick.j':'Tu apodo',
    'online.code.ph':'Código de sala (5 letras)',
    'online.connecting':'Conectando al servidor...',
    'online.offline':'Servidor offline. Ver Manual → Online 1v1.',
    'online.guide.title':'Cómo jugar Online',
    'man.title':'MANUAL DEL JUGADOR',
  }
};

var cur = localStorage.getItem('caprush_lang') || 'pt';

function t(k){ return (LANGS[cur] && LANGS[cur][k]) || (LANGS.pt[k]) || k; }

function apply(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var k = el.getAttribute('data-i18n');
    el.textContent = t(k);
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el){
    el.placeholder = t(el.getAttribute('data-i18n-ph'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function(el){
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  /* propagate to iframes */
  document.querySelectorAll('iframe').forEach(function(fr){
    try{ fr.contentWindow.i18n && fr.contentWindow.i18n.apply(); }catch(e){}
  });
}

function setLang(lang){
  if(!LANGS[lang]) return;
  cur = lang;
  localStorage.setItem('caprush_lang', lang);
  apply();
  document.querySelectorAll('.lang-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  /* propagate to parent */
  try{ window.parent !== window && window.parent.i18n && window.parent.i18n.setLang(lang); }catch(e){}
}

/* Render flag buttons */
function renderFlags(container){
  if(!container) return;
  var flags = [
    { lang:'pt', flag:'🇧🇷', label:'PT' },
    { lang:'en', flag:'🇺🇸', label:'EN' },
    { lang:'es', flag:'🇪🇸', label:'ES' },
  ];
  container.innerHTML = '';
  flags.forEach(function(f){
    var btn = document.createElement('button');
    btn.className = 'lang-btn' + (cur===f.lang?' active':'');
    btn.dataset.lang = f.lang;
    btn.innerHTML = '<span style="font-size:1.1em;line-height:1">' + f.flag + '</span>';
    btn.title = f.label;
    btn.style.cssText = [
      'background:none','border:1px solid rgba(255,255,255,.18)','border-radius:4px',
      'padding:2px 5px','cursor:pointer','font-size:.75rem','letter-spacing:1px',
      'color:#CCC','display:flex','align-items:center','gap:2px','transition:all .15s'
    ].join(';');
    btn.onmouseenter = function(){ this.style.borderColor='rgba(255,215,0,.6)'; this.style.background='rgba(255,215,0,.08)'; };
    btn.onmouseleave = function(){ this.style.borderColor='rgba(255,255,255,.18)'; this.style.background='none'; };
    btn.onclick = function(){ setLang(f.lang); };
    container.appendChild(btn);
  });
}

/* Auto-init on DOMContentLoaded */
document.addEventListener('DOMContentLoaded', function(){
  /* inject flag container into nav if found */
  var nav = document.querySelector('nav, #topbar, #hud, .nlinks, .tlinks');
  if(nav){
    var fc = document.createElement('div');
    fc.id = 'flag-container';
    fc.style.cssText = 'display:flex;gap:4px;align-items:center;margin-left:auto;';
    nav.appendChild(fc);
    renderFlags(fc);
  }
  apply();
  /* listen for lang change from iframe parent */
  window.addEventListener('message', function(e){
    if(e.data && e.data.type === 'caprush_lang') setLang(e.data.lang);
  });
});

w.i18n = { t:t, apply:apply, setLang:setLang, renderFlags:renderFlags,
            get lang(){ return cur; } };
})(window);
