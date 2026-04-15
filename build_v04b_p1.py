# -*- coding: utf-8 -*-
"""
build_v04b_p1.py  --  CapRush Overdrive! v0.4b
Gera: index.html, i18n.js, personagens.html
ROOT = mesmo diretorio deste script (caprush/)
"""
import os, sys
if hasattr(sys.stdout,'reconfigure'):
    try: sys.stdout.reconfigure(encoding='utf-8',errors='replace')
    except: pass

ROOT = os.path.dirname(os.path.abspath(__file__))

def w(rel, txt):
    path = os.path.join(ROOT, *rel.replace('/','\\').split('\\'))
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ROOT, exist_ok=True)
    with open(path,'w',encoding='utf-8') as f:
        f.write(txt)
    print(f'  [OK]  {rel}')
    print(f'        {path}')

# ─── i18n.js ──────────────────────────────────────────────────────────────
I18N = r"""// i18n.js  v2  --  CapRush Overdrive!
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
"""

# ─── index.html ──────────────────────────────────────────────────────────
INDEX = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush - Overdrive!</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;background:#05050A;font-family:'Rajdhani',sans-serif;}

/* ─ estrelas animadas ─ */
#stars{position:fixed;inset:0;pointer-events:none;z-index:0;}
.star{position:absolute;border-radius:50%;background:#fff;animation:twinkle var(--d,3s) ease-in-out infinite var(--dl,0s);}
@keyframes twinkle{0%,100%{opacity:.15;transform:scale(1)}50%{opacity:.9;transform:scale(1.4)}}

/* ─ botoes orbitais ─ */
#orb-wrap{position:fixed;inset:0;z-index:5;}
.orb-btn{position:absolute;width:72px;height:72px;border-radius:50%;border:2px solid;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;text-decoration:none;font-family:'Bebas Neue',sans-serif;font-size:.65rem;letter-spacing:2px;transition:transform .25s,box-shadow .25s;animation:float var(--fs,4s) ease-in-out infinite var(--fd,0s);}
.orb-btn:hover{transform:scale(1.18)!important;filter:brightness(1.4);}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.orb-jogar  {top:25%;  left:12%; color:#FF2A2A;border-color:#FF2A2A;background:rgba(255,42,42,.12);box-shadow:0 0 20px rgba(255,42,42,.25);--fs:3.8s;}
.orb-pilotos{top:21%;  right:7%;  color:#00E5FF;border-color:#00E5FF;background:rgba(0,229,255,.10);box-shadow:0 0 20px rgba(0,229,255,.2);--fs:4.5s;--fd:.4s;}
.orb-ranking{top:72%;  left:11%; color:#3B82F6;border-color:#3B82F6;background:rgba(59,130,246,.10);box-shadow:0 0 20px rgba(59,130,246,.2);--fs:3.5s;--fd:.8s;}
.orb-manual {top:82%;  left:50%;transform:translateX(-50%); color:#A855F7;border-color:#A855F7;background:rgba(168,85,247,.10);box-shadow:0 0 20px rgba(168,85,247,.2);--fs:4.2s;--fd:.2s;}
.orb-arq    {top:71%;  right:6%; color:#F59E0B;border-color:#F59E0B;background:rgba(245,158,11,.10);box-shadow:0 0 20px rgba(245,158,11,.2);--fs:4.8s;--fd:.6s;}

/* ─ logo central ─ */
#logo-wrap{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;text-align:center;}
#logo-img{
  display:block;
  max-width:min(420px,80vw);
  max-height:min(280px,45vh);
  object-fit:contain;
  position:relative;
  cursor:pointer;
  filter:drop-shadow(0 0 30px rgba(255,42,42,.35));
  transition:filter .3s;
}
#logo-img:hover{filter:drop-shadow(0 0 50px rgba(255,42,42,.6)) drop-shadow(0 0 20px rgba(255,215,0,.4));}

/* ─ container do brilho metalico sobre o arco vermelho ─ */
#logo-shine-wrap{
  position:absolute;
  /* ajustado para o arco vermelho curvo no TOPO da tampinha */
  top: 32%;
  left: 18%;
  width: 64%;
  height: 22%;
  pointer-events:none;
  overflow:hidden;
  border-radius: 50% 50% 0 0 / 80% 80% 0 0;
}
#logo-shine{
  position:absolute;inset:0;
  background: linear-gradient(105deg,
    rgba(255,255,255,0) 0%,
    rgba(255,255,255,.55) 48%,
    rgba(255,255,255,0) 60%
  );
  transform:translateX(-110%);
  transition:none;
}
#logo-img-wrap{position:relative;display:inline-block;}
#logo-img-wrap:hover #logo-shine{animation:metalSweep .7s ease-in-out forwards;}
@keyframes metalSweep{0%{transform:translateX(-110%)}100%{transform:translateX(110%)}}

/* ─ flag container ─ */
#flag-pos{position:fixed;top:16px;right:18px;z-index:30;display:flex;gap:6px;}
#flag-container{display:flex;gap:6px;}
.flag-btn{background:none;border:1px solid transparent;border-radius:4px;padding:2px;cursor:pointer;opacity:.6;transition:opacity .2s,border-color .2s;}
.flag-btn:hover,.flag-btn.flag-active{opacity:1;border-color:rgba(255,215,0,.5);}
</style>
</head>
<body>

<!-- Estrelas -->
<canvas id="stars"></canvas>

<!-- Botoes orbitais -->
<div id="orb-wrap">
  <a href="caprush-game.html" class="orb-btn orb-jogar" style="--fs:3.8s">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#FF2A2A"><polygon points="5,3 19,12 5,21"/></svg>
    JOGAR
  </a>
  <a href="personagens.html" class="orb-btn orb-pilotos" style="--fs:4.5s;--fd:.4s">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4,20 Q4,14 12,14 Q20,14 20,20"/></svg>
    PILOTOS
  </a>
  <a href="ranking.html" class="orb-btn orb-ranking" style="--fs:3.5s;--fd:.8s">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2"><path d="M8,18 V10 M12,18 V6 M16,18 V14"/></svg>
    RANKING
  </a>
  <a href="manual.html" class="orb-btn orb-manual" style="--fs:4.2s;--fd:.2s">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9,7 H15 M9,11 H15 M9,15 H12"/></svg>
    MANUAL
  </a>
  <a href="arquitetura.html" class="orb-btn orb-arq" style="--fs:4.8s;--fd:.6s">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/><line x1="12" y1="3" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="21"/><line x1="3" y1="12" x2="9" y2="12"/><line x1="15" y1="12" x2="21" y2="12"/></svg>
    ARQT.
  </a>
</div>

<!-- Logo central -->
<div id="logo-wrap">
  <div id="logo-img-wrap">
    <a href="caprush-game.html">
      <img id="logo-img" src="Whisk_2.png" alt="CapRush Overdrive!"/>
    </a>
    <div id="logo-shine-wrap">
      <div id="logo-shine"></div>
    </div>
  </div>
</div>

<!-- Bandeiras -->
<div id="flag-pos">
  <div id="flag-container"></div>
</div>

<script src="i18n.js"></script>
<script>
// Estrelas procedurais
(function(){
  var c=document.getElementById('stars'),x=c.getContext('2d');
  c.width=window.innerWidth; c.height=window.innerHeight;
  var stars=[];
  for(var i=0;i<160;i++) stars.push({
    x:Math.random()*c.width, y:Math.random()*c.height,
    r:Math.random()*1.5+.3,
    a:Math.random(), da:(Math.random()-.5)*.012,
    color:Math.random()<.15?'#FFD700':Math.random()<.2?'#FF4040':'#FFFFFF'
  });
  function frame(){
    x.clearRect(0,0,c.width,c.height);
    stars.forEach(function(s){
      s.a+=s.da; if(s.a>1||s.a<.1) s.da*=-1;
      x.globalAlpha=s.a; x.fillStyle=s.color;
      x.beginPath();x.arc(s.x,s.y,s.r,0,Math.PI*2);x.fill();
    });
    x.globalAlpha=1;
    requestAnimationFrame(frame);
  }
  frame();
  window.addEventListener('resize',function(){c.width=window.innerWidth;c.height=window.innerHeight;});
})();
</script>
</body>
</html>
"""

# ─── personagens.html ─────────────────────────────────────────────────────
PERSONAGENS = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush - Pilotos</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--panel:rgba(10,10,20,.92);--acc:#00E5FF;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:var(--dark);color:#E8E8F0;font-family:'Rajdhani',sans-serif;min-height:100%;}
/* ─── NAV ─────────────────────────────────────────────── */
nav{
  display:flex;
  align-items:center;
  padding:12px 24px;
  background:rgba(5,5,12,.95);
  border-bottom:1px solid rgba(255,42,42,.25);
  gap:1.4rem;
  position:sticky;top:0;z-index:50;
}
.nav-logo{font-family:'Bebas Neue',sans-serif;font-size:1.35rem;letter-spacing:4px;
  background:linear-gradient(135deg,var(--red),var(--gold));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  text-decoration:none;white-space:nowrap;margin-right:.4rem;}
.nav-link{color:#AAA;text-decoration:none;font-size:.9rem;letter-spacing:2px;text-transform:uppercase;
  transition:color .2s;white-space:nowrap;}
.nav-link:hover,.nav-link.active{color:var(--gold);}
#flag-container{display:flex;gap:6px;margin-left:auto;}
.flag-btn{background:none;border:1px solid transparent;border-radius:4px;padding:2px;cursor:pointer;opacity:.6;transition:opacity .2s,border-color .2s;}
.flag-btn:hover,.flag-btn.flag-active{opacity:1;border-color:rgba(255,215,0,.5);}

/* ─── HERO ─────────────────────────────────────────────── */
.hero{text-align:center;padding:50px 20px 30px;}
.hero h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,7vw,4.5rem);
  letter-spacing:6px;background:linear-gradient(135deg,var(--red),var(--gold));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero p{color:#666680;letter-spacing:2px;font-size:.88rem;text-transform:uppercase;margin-top:.4rem;}

/* ─── GRID ─────────────────────────────────────────────── */
.grid{display:flex;flex-wrap:wrap;justify-content:center;gap:28px;padding:20px 30px 60px;max-width:1200px;margin:0 auto;}
.card{background:rgba(14,14,28,.95);border:1px solid rgba(255,255,255,.07);border-radius:16px;
  width:260px;overflow:hidden;transition:transform .3s,box-shadow .3s;cursor:default;}
.card:hover{transform:translateY(-8px);box-shadow:0 20px 60px rgba(0,0,0,.6);}
.card-top{position:relative;padding:20px;display:flex;justify-content:center;align-items:center;min-height:180px;}
.badge{position:absolute;top:12px;left:12px;font-size:.65rem;letter-spacing:2px;
  padding:3px 8px;border-radius:12px;border:1px solid;font-family:'Bebas Neue',sans-serif;}
.card-body{padding:14px 16px 18px;}
.card-name{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;letter-spacing:4px;margin-bottom:8px;}
.code{font-size:.65rem;color:#444;letter-spacing:2px;margin-bottom:10px;}
.stat-row{display:flex;align-items:center;gap:6px;margin:5px 0;}
.stat-label{font-size:.7rem;color:#888;letter-spacing:1px;width:80px;}
.stat-bar{flex:1;height:5px;background:#1A1A2E;border-radius:3px;overflow:hidden;}
.stat-fill{height:100%;border-radius:3px;transition:width 1s cubic-bezier(.2,1,.3,1);}
.stat-val{font-family:'Bebas Neue',sans-serif;font-size:.85rem;color:var(--gold);width:26px;text-align:right;}
.card-lore{font-size:.72rem;color:#555578;line-height:1.5;margin-top:10px;border-top:1px solid rgba(255,255,255,.05);padding-top:8px;}

/* ─── SVG CHARS ─────────────────────────────────────────── */
.char-svg{width:140px;height:140px;}
</style>
</head>
<body>
<nav>
  <a href="index.html" class="nav-logo">CAP RUSH</a>
  <a id="nav-jogar"   href="caprush-game.html" class="nav-link">JOGAR</a>
  <a id="nav-pilotos" href="personagens.html"   class="nav-link active">PILOTOS</a>
  <a id="nav-ranking" href="ranking.html"        class="nav-link">RANKING</a>
  <a id="nav-manual"  href="manual.html"         class="nav-link">MANUAL</a>
  <div id="flag-container"></div>
</nav>

<div class="hero">
  <h1 id="pilots-title">ESCOLHA SEU PILOTO</h1>
  <p id="pilots-sub">Cada tampinha e um NFT com atributos reais &ndash; Velocidade, Controle e Aerodinamica</p>
</div>

<div class="grid">

<!-- ─── KENTA (Maine Coon) ─── -->
<div class="card">
  <div class="card-top" style="background:radial-gradient(circle at 50% 60%,rgba(255,140,0,.15),transparent 70%)">
    <span class="badge" style="color:#FF8C00;border-color:#FF8C00;background:rgba(255,140,0,.1)">&#9670; EPICA</span>
    <!-- KENTA SVG: Maine Coon tabby marrom, lynx tips, olhos ambar, rabo longo -->
    <svg class="char-svg" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="kg1" cx="50%" cy="45%" r="50%"><stop offset="0%" stop-color="#C8844A"/><stop offset="100%" stop-color="#7A4A20"/></radialGradient>
        <radialGradient id="kg2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#E09050"/><stop offset="100%" stop-color="#A06030"/></radialGradient>
      </defs>
      <!-- Rabo longo curvado -->
      <path d="M 95,120 Q 125,80 115,45 Q 110,30 100,35 Q 92,40 98,55 Q 108,80 88,110 Z" fill="#8B5020" opacity=".85"/>
      <!-- Listras do rabo -->
      <path d="M 98,65 Q 108,62 105,58" stroke="#5A3010" stroke-width="2" fill="none" opacity=".6"/>
      <path d="M 102,78 Q 112,76 109,72" stroke="#5A3010" stroke-width="2" fill="none" opacity=".6"/>
      <!-- Corpo -->
      <ellipse cx="68" cy="100" rx="35" ry="28" fill="url(#kg1)"/>
      <!-- Listras tabby no corpo -->
      <path d="M 45,92 Q 65,88 85,92" stroke="#5A3010" stroke-width="2.5" fill="none" opacity=".5"/>
      <path d="M 42,100 Q 65,96 88,100" stroke="#5A3010" stroke-width="2" fill="none" opacity=".4"/>
      <path d="M 46,108 Q 65,105 85,108" stroke="#5A3010" stroke-width="1.5" fill="none" opacity=".3"/>
      <!-- Cabeca -->
      <ellipse cx="68" cy="64" rx="28" ry="26" fill="url(#kg2)"/>
      <!-- Listras tabby na testa - M marking -->
      <path d="M 52,50 L 56,42 L 60,50" stroke="#5A3010" stroke-width="2" fill="none"/>
      <path d="M 60,50 L 64,40 L 68,50" stroke="#5A3010" stroke-width="2" fill="none"/>
      <path d="M 68,50 L 72,42 L 76,50" stroke="#5A3010" stroke-width="2" fill="none"/>
      <line x1="56" y1="55" x2="80" y2="55" stroke="#5A3010" stroke-width="1.2" opacity=".5"/>
      <!-- Orelhas com lynx tips (tufos longos) -->
      <polygon points="46,46 38,22 52,38" fill="#C8844A"/>
      <polygon points="90,46 100,22 86,38" fill="#C8844A"/>
      <!-- Pelo interno da orelha -->
      <polygon points="47,44 42,28 50,38" fill="#E8B070" opacity=".7"/>
      <polygon points="89,44 96,28 88,38" fill="#E8B070" opacity=".7"/>
      <!-- Lynx tips: fios de pelo nas pontas -->
      <path d="M 42,25 L 40,18 M 43,23 L 41,16 M 40,26 L 37,19" stroke="#5A3010" stroke-width="1.2" fill="none"/>
      <path d="M 98,25 L 100,18 M 97,23 L 99,16 M 100,26 L 103,19" stroke="#5A3010" stroke-width="1.2" fill="none"/>
      <!-- Bigodes (vibrissas) -->
      <line x1="40" y1="70" x2="22" y2="66" stroke="#FFE8B0" stroke-width="1.2" opacity=".9"/>
      <line x1="40" y1="73" x2="20" y2="73" stroke="#FFE8B0" stroke-width="1.2" opacity=".9"/>
      <line x1="40" y1="76" x2="22" y2="79" stroke="#FFE8B0" stroke-width="1.2" opacity=".9"/>
      <line x1="96" y1="70" x2="114" y2="66" stroke="#FFE8B0" stroke-width="1.2" opacity=".9"/>
      <line x1="96" y1="73" x2="116" y2="73" stroke="#FFE8B0" stroke-width="1.2" opacity=".9"/>
      <line x1="96" y1="76" x2="114" y2="79" stroke="#FFE8B0" stroke-width="1.2" opacity=".9"/>
      <!-- Olhos ambar com pupila vertical -->
      <ellipse cx="57" cy="63" rx="8" ry="7" fill="#D4820A"/>
      <ellipse cx="79" cy="63" rx="8" ry="7" fill="#D4820A"/>
      <ellipse cx="57" cy="63" rx="2.5" ry="6" fill="#111"/>
      <ellipse cx="79" cy="63" rx="2.5" ry="6" fill="#111"/>
      <ellipse cx="55.5" cy="61" rx="1.2" ry="1" fill="#fff" opacity=".7"/>
      <ellipse cx="77.5" cy="61" rx="1.2" ry="1" fill="#fff" opacity=".7"/>
      <!-- Nariz -->
      <path d="M 64,72 L 68,70 L 72,72 Q 68,76 64,72 Z" fill="#C06040"/>
      <!-- Boca -->
      <path d="M 64,72 Q 60,78 56,76" stroke="#7A4020" stroke-width="1.5" fill="none"/>
      <path d="M 72,72 Q 76,78 80,76" stroke="#7A4020" stroke-width="1.5" fill="none"/>
      <!-- Patinhas -->
      <ellipse cx="50" cy="124" rx="12" ry="8" fill="#9A5828"/>
      <ellipse cx="86" cy="124" rx="12" ry="8" fill="#9A5828"/>
    </svg>
  </div>
  <div class="card-body">
    <div class="card-name" style="color:#FF8C00">KENTA</div>
    <div class="code">#CR-0001 | Maine Coon Tabby</div>
    <div class="stat-row"><span class="stat-label">Velocidade</span><div class="stat-bar"><div class="stat-fill" data-val="88" style="background:#FF8C00;width:0%"></div></div><span class="stat-val">88</span></div>
    <div class="stat-row"><span class="stat-label">Controle</span><div class="stat-bar"><div class="stat-fill" data-val="76" style="background:#FF8C00;width:0%"></div></div><span class="stat-val">76</span></div>
    <div class="stat-row"><span class="stat-label">Aerodin.</span><div class="stat-bar"><div class="stat-fill" data-val="83" style="background:#FF8C00;width:0%"></div></div><span class="stat-val">83</span></div>
    <div class="card-lore">Maine Coon selvagem das terras do norte. Seus tufos nas orelhas ajudam a sentir cada vento na pista.</div>
  </div>
</div>

<!-- ─── YUKI (Samoieda) ─── -->
<div class="card">
  <div class="card-top" style="background:radial-gradient(circle at 50% 60%,rgba(0,229,255,.12),transparent 70%)">
    <span class="badge" style="color:#00E5FF;border-color:#00E5FF;background:rgba(0,229,255,.08)">&#9670; LENDARIA</span>
    <!-- YUKI SVG: Samoieda branco, pelo espesso, sorriso samoieda, olhos entrecerrados -->
    <svg class="char-svg" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="yg1" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#C8D8E8"/></radialGradient>
        <radialGradient id="yg2" cx="50%" cy="45%" r="50%"><stop offset="0%" stop-color="#F4F8FF"/><stop offset="100%" stop-color="#B0C4D8"/></radialGradient>
        <!-- Pinceladas aquarela azul -->
        <filter id="blur2"><feGaussianBlur stdDeviation="2"/></filter>
      </defs>
      <!-- Manchas aquarela azuis de fundo -->
      <ellipse cx="30" cy="90" rx="14" ry="8" fill="rgba(100,180,255,.2)" filter="url(#blur2)"/>
      <ellipse cx="110" cy="50" rx="10" ry="6" fill="rgba(140,200,255,.2)" filter="url(#blur2)"/>
      <ellipse cx="95" cy="115" rx="12" ry="5" fill="rgba(100,160,255,.18)" filter="url(#blur2)"/>
      <!-- Respingos aquarela -->
      <circle cx="22" cy="40" r="3" fill="rgba(80,160,240,.25)"/>
      <circle cx="118" cy="90" r="4" fill="rgba(80,160,240,.2)"/>
      <circle cx="110" cy="110" r="2.5" fill="rgba(80,160,240,.22)"/>
      <!-- Rabo super esponjoso -->
      <ellipse cx="108" cy="92" rx="22" ry="20" fill="url(#yg1)" opacity=".9"/>
      <!-- Textura de pelo no rabo -->
      <path d="M 90,82 Q 108,78 122,86" stroke="#C8D8EC" stroke-width="1.5" fill="none" opacity=".7"/>
      <path d="M 88,90 Q 108,85 124,92" stroke="#C8D8EC" stroke-width="1" fill="none" opacity=".5"/>
      <path d="M 90,98 Q 110,96 126,100" stroke="#C8D8EC" stroke-width="1" fill="none" opacity=".5"/>
      <!-- Patas traseiras / corpo -->
      <ellipse cx="68" cy="106" rx="38" ry="22" fill="url(#yg1)"/>
      <!-- Pelo no corpo: linhas suaves -->
      <path d="M 40,98 Q 68,93 96,98" stroke="#C8D8EC" stroke-width="1.8" fill="none" opacity=".5"/>
      <path d="M 38,108 Q 68,103 98,108" stroke="#C8D8EC" stroke-width="1.4" fill="none" opacity=".4"/>
      <!-- Cabeca (grande e fofa) -->
      <ellipse cx="68" cy="64" rx="30" ry="28" fill="url(#yg2)"/>
      <!-- Pelo espesso ao redor da cabeca -->
      <path d="M 38,60 Q 30,50 36,40 Q 44,52 44,58" fill="#D8E8F4" opacity=".7"/>
      <path d="M 98,60 Q 108,50 102,40 Q 94,52 94,58" fill="#D8E8F4" opacity=".7"/>
      <path d="M 44,38 Q 52,26 68,28 Q 84,26 92,38 Q 80,32 68,32 Q 56,32 44,38" fill="#E8F0F8" opacity=".8"/>
      <!-- Pelo voando (carateristica samoieda) -->
      <path d="M 46,45 Q 36,35 30,28" stroke="#D0E0EE" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M 44,50 Q 32,42 25,36" stroke="#C8D8EC" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>
      <path d="M 90,45 Q 100,35 106,28" stroke="#D0E0EE" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M 92,50 Q 104,42 111,36" stroke="#C8D8EC" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/>
      <!-- Orelhas pontudas com pelo interno -->
      <polygon points="50,44 44,22 62,40" fill="#E8F0FA"/>
      <polygon points="86,44 94,22 76,40" fill="#E8F0FA"/>
      <polygon points="51,42 47,26 60,40" fill="#A0B8D0" opacity=".4"/>
      <polygon points="85,42 91,26 78,40" fill="#A0B8D0" opacity=".4"/>
      <!-- Olhos entrecerrados - sorriso samoieda (olhos em meia lua) -->
      <path d="M 54,62 Q 60,57 66,62" stroke="#2A3A4A" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M 70,62 Q 76,57 82,62" stroke="#2A3A4A" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Brilho nos olhos -->
      <ellipse cx="57" cy="60" rx="1.5" ry="1" fill="#fff" opacity=".8"/>
      <ellipse cx="79" cy="60" rx="1.5" ry="1" fill="#fff" opacity=".8"/>
      <!-- Nariz preto (pequeno, tipico samoieda) -->
      <ellipse cx="68" cy="70" rx="5" ry="3.5" fill="#2A2A30"/>
      <!-- Sorriso samoieda caracteristico - cantos levantados -->
      <path d="M 55,75 Q 68,82 81,75" stroke="#8090A0" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M 56,74 Q 53,77 55,75" stroke="#8090A0" stroke-width="1.5" fill="none"/>
      <path d="M 80,74 Q 83,77 81,75" stroke="#8090A0" stroke-width="1.5" fill="none"/>
      <!-- Bigodes finos -->
      <line x1="44" y1="71" x2="26" y2="68" stroke="#C8D8EC" stroke-width=".9" opacity=".7"/>
      <line x1="44" y1="73" x2="24" y2="73" stroke="#C8D8EC" stroke-width=".9" opacity=".7"/>
      <line x1="92" y1="71" x2="110" y2="68" stroke="#C8D8EC" stroke-width=".9" opacity=".7"/>
      <line x1="92" y1="73" x2="112" y2="73" stroke="#C8D8EC" stroke-width=".9" opacity=".7"/>
      <!-- Patas dianteiras -->
      <ellipse cx="48" cy="125" rx="11" ry="7" fill="#E0EAF5"/>
      <ellipse cx="88" cy="125" rx="11" ry="7" fill="#E0EAF5"/>
    </svg>
  </div>
  <div class="card-body">
    <div class="card-name" style="color:#00E5FF">YUKI</div>
    <div class="code">#CR-0002 | Samoieda Aquarela</div>
    <div class="stat-row"><span class="stat-label">Velocidade</span><div class="stat-bar"><div class="stat-fill" data-val="82" style="background:#00E5FF;width:0%"></div></div><span class="stat-val">82</span></div>
    <div class="stat-row"><span class="stat-label">Controle</span><div class="stat-bar"><div class="stat-fill" data-val="91" style="background:#00E5FF;width:0%"></div></div><span class="stat-val">91</span></div>
    <div class="stat-row"><span class="stat-label">Aerodin.</span><div class="stat-bar"><div class="stat-fill" data-val="75" style="background:#00E5FF;width:0%"></div></div><span class="stat-val">75</span></div>
    <div class="card-lore">Samoieda das neves eternas. Seu pelo denso e branco cria resistencia zero ao vento. O sorriso nunca some.</div>
  </div>
</div>

<!-- ─── BRUNA (Pastor Kawaii) ─── -->
<div class="card">
  <div class="card-top" style="background:radial-gradient(circle at 50% 60%,rgba(255,80,80,.12),transparent 70%)">
    <span class="badge" style="color:#FF5555;border-color:#FF5555;background:rgba(255,80,80,.08)">&#9670; RARA</span>
    <!-- BRUNA SVG: Pastor kawaii, bandana AZUL, patinha direita levantada -->
    <svg class="char-svg" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg1" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="#C4874A"/><stop offset="100%" stop-color="#7A4820"/></radialGradient>
        <radialGradient id="bg2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#D4A060"/><stop offset="100%" stop-color="#8A5028"/></radialGradient>
      </defs>
      <!-- Corpo -->
      <ellipse cx="68" cy="100" rx="34" ry="26" fill="url(#bg1)"/>
      <!-- Sela (mancha escura nas costas) -->
      <ellipse cx="68" cy="95" rx="22" ry="16" fill="#3A2010" opacity=".7"/>
      <!-- Cabeca -->
      <ellipse cx="68" cy="62" rx="28" ry="26" fill="url(#bg2)"/>
      <!-- Mancha escura na testa (pastor tipico) -->
      <ellipse cx="68" cy="54" rx="16" ry="12" fill="#3A2010" opacity=".5"/>
      <!-- Orelhas pendentes (pastor) -->
      <path d="M 42,52 Q 34,58 36,74 Q 42,70 44,58 Z" fill="#7A4820"/>
      <path d="M 94,52 Q 102,58 100,74 Q 94,70 92,58 Z" fill="#7A4820"/>
      <!-- Pelo interno das orelhas -->
      <path d="M 42,54 Q 37,60 38,70 Q 42,67 43,58 Z" fill="#C4874A" opacity=".5"/>
      <path d="M 94,54 Q 99,60 98,70 Q 94,67 93,58 Z" fill="#C4874A" opacity=".5"/>
      <!-- Olhos kawaii grandes -->
      <ellipse cx="57" cy="62" rx="9" ry="9" fill="#1A0A02"/>
      <ellipse cx="79" cy="62" rx="9" ry="9" fill="#1A0A02"/>
      <ellipse cx="57" cy="62" rx="7.5" ry="7.5" fill="#2A1505"/>
      <ellipse cx="79" cy="62" rx="7.5" ry="7.5" fill="#2A1505"/>
      <!-- Brilho kawaii -->
      <ellipse cx="53" cy="58" rx="3" ry="2.5" fill="#fff" opacity=".9"/>
      <ellipse cx="75" cy="58" rx="3" ry="2.5" fill="#fff" opacity=".9"/>
      <ellipse cx="59" cy="65" rx="1.2" ry="1" fill="#fff" opacity=".5"/>
      <ellipse cx="81" cy="65" rx="1.2" ry="1" fill="#fff" opacity=".5"/>
      <!-- Nariz -->
      <ellipse cx="68" cy="72" rx="5" ry="3.5" fill="#5A2A10"/>
      <!-- Boca soridente -->
      <path d="M 62,74 Q 68,80 74,74" stroke="#5A2A10" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <!-- Bigodes curtos -->
      <line x1="44" y1="71" x2="30" y2="68" stroke="#C4874A" stroke-width="1.2" opacity=".7"/>
      <line x1="44" y1="74" x2="28" y2="74" stroke="#C4874A" stroke-width="1.2" opacity=".7"/>
      <line x1="92" y1="71" x2="106" y2="68" stroke="#C4874A" stroke-width="1.2" opacity=".7"/>
      <line x1="92" y1="74" x2="108" y2="74" stroke="#C4874A" stroke-width="1.2" opacity=".7"/>
      <!-- BANDANA AZUL (elemento principal!) - no pescoco -->
      <path d="M 46,82 Q 68,90 90,82 Q 86,88 68,92 Q 50,88 46,82 Z" fill="#1565C0"/>
      <path d="M 68,88 L 72,100 L 68,96 L 64,100 Z" fill="#1565C0"/>
      <!-- Brilho na bandana -->
      <path d="M 52,83 Q 68,87 82,83" stroke="rgba(255,255,255,.3)" stroke-width="1.5" fill="none"/>
      <!-- Patinha DIREITA LEVANTADA (do ponto de vista do personagem = esquerda do viewer) -->
      <!-- Pata esq no chao -->
      <ellipse cx="50" cy="124" rx="12" ry="8" fill="#8A5028"/>
      <!-- Pata dir levantada - almofadinhas visiveis -->
      <g transform="rotate(-40, 92, 110)">
        <ellipse cx="92" cy="108" rx="10" ry="8" fill="#8A5028"/>
        <!-- Almofadinhas -->
        <ellipse cx="89" cy="106" rx="2.5" ry="2" fill="#5A2A10" opacity=".7"/>
        <ellipse cx="94" cy="104" rx="2" ry="1.8" fill="#5A2A10" opacity=".7"/>
        <ellipse cx="98" cy="108" rx="2" ry="1.8" fill="#5A2A10" opacity=".7"/>
        <ellipse cx="92" cy="111" rx="3" ry="2.5" fill="#5A2A10" opacity=".7"/>
      </g>
    </svg>
  </div>
  <div class="card-body">
    <div class="card-name" style="color:#FF5555">BRUNA</div>
    <div class="code">#CR-0003 | Pastor Kawaii</div>
    <div class="stat-row"><span class="stat-label">Velocidade</span><div class="stat-bar"><div class="stat-fill" data-val="78" style="background:#FF5555;width:0%"></div></div><span class="stat-val">78</span></div>
    <div class="stat-row"><span class="stat-label">Controle</span><div class="stat-bar"><div class="stat-fill" data-val="95" style="background:#FF5555;width:0%"></div></div><span class="stat-val">95</span></div>
    <div class="stat-row"><span class="stat-label">Aerodin.</span><div class="stat-bar"><div class="stat-fill" data-val="71" style="background:#FF5555;width:0%"></div></div><span class="stat-val">71</span></div>
    <div class="card-lore">Pastor leal e precisa. Sua bandana azul e amuleto de sorte. Controle incomparavel em curvas fechadas.</div>
  </div>
</div>

<!-- ─── TAPZ (Golden Anjo) ─── -->
<div class="card">
  <div class="card-top" style="background:radial-gradient(circle at 50% 60%,rgba(255,215,0,.12),transparent 70%)">
    <span class="badge" style="color:#FFD700;border-color:#FFD700;background:rgba(255,215,0,.08)">&#9670; MITICA</span>
    <!-- TAPZ SVG: Golden Retriever, asas brancas, aureola dourada, boca aberta com lingua -->
    <svg class="char-svg" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="tg1" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="#F0B03A"/><stop offset="100%" stop-color="#B07018"/></radialGradient>
        <radialGradient id="tg2" cx="50%" cy="45%" r="50%"><stop offset="0%" stop-color="#F8C050"/><stop offset="100%" stop-color="#C08020"/></radialGradient>
      </defs>
      <!-- Asas brancas (atras do corpo) -->
      <!-- Asa esquerda -->
      <path d="M 30,70 Q 10,50 15,30 Q 25,45 35,58 Q 25,40 38,34 Q 44,52 40,68 Z" fill="#F0F4FF" stroke="#C8D4E8" stroke-width="1"/>
      <path d="M 35,68 Q 18,52 22,36 Q 30,48 38,60" stroke="#D8E0F0" stroke-width="1.2" fill="none" opacity=".6"/>
      <!-- Asa direita -->
      <path d="M 110,70 Q 130,50 125,30 Q 115,45 105,58 Q 115,40 102,34 Q 96,52 100,68 Z" fill="#F0F4FF" stroke="#C8D4E8" stroke-width="1"/>
      <path d="M 105,68 Q 122,52 118,36 Q 110,48 102,60" stroke="#D8E0F0" stroke-width="1.2" fill="none" opacity=".6"/>
      <!-- Sparkles ao redor -->
      <path d="M 22,28 L 24,22 L 26,28 L 20,26 L 26,24 Z" fill="#FFD700" opacity=".8"/>
      <path d="M 115,35 L 117,29 L 119,35 L 113,33 L 119,31 Z" fill="#FFD700" opacity=".7"/>
      <path d="M 108,18 L 110,14 L 112,18 L 108,16 Z" fill="#FFE060" opacity=".6"/>
      <path d="M 30,20 L 32,16 L 34,20 L 30,18 Z" fill="#FFE060" opacity=".6"/>
      <!-- Nuvenzinhas -->
      <ellipse cx="20" cy="112" rx="12" ry="7" fill="#F8F8FF" opacity=".4"/>
      <ellipse cx="26" cy="108" rx="9" ry="6" fill="#F8F8FF" opacity=".4"/>
      <ellipse cx="118" cy="110" rx="10" ry="6" fill="#F8F8FF" opacity=".4"/>
      <ellipse cx="112" cy="107" rx="8" ry="5" fill="#F8F8FF" opacity=".4"/>
      <!-- Corpo golden -->
      <ellipse cx="68" cy="100" rx="34" ry="25" fill="url(#tg1)"/>
      <!-- Pelo no peito (mais claro) -->
      <ellipse cx="68" cy="95" rx="20" ry="14" fill="#F8C050" opacity=".5"/>
      <!-- Cabeca -->
      <ellipse cx="68" cy="64" rx="29" ry="27" fill="url(#tg2)"/>
      <!-- Pelo ao redor da cabeca (golden fluffy) -->
      <path d="M 40,58 Q 34,46 40,36 Q 48,52 46,60" fill="#E0A030" opacity=".6"/>
      <path d="M 96,58 Q 102,46 96,36 Q 88,52 90,60" fill="#E0A030" opacity=".6"/>
      <!-- Orelhas pendentes golden -->
      <path d="M 42,52 Q 34,60 36,78 Q 43,72 44,58 Z" fill="#C08020"/>
      <path d="M 94,52 Q 102,60 100,78 Q 93,72 92,58 Z" fill="#C08020"/>
      <path d="M 43,54 Q 37,62 39,74 Q 43,70 44,60 Z" fill="#E0A030" opacity=".5"/>
      <path d="M 93,54 Q 99,62 97,74 Q 93,70 92,60 Z" fill="#E0A030" opacity=".5"/>
      <!-- Aureola dourada brilhante -->
      <ellipse cx="68" cy="22" rx="18" ry="5" fill="none" stroke="#FFD700" stroke-width="3"/>
      <ellipse cx="68" cy="22" rx="18" ry="5" fill="none" stroke="#FFF8A0" stroke-width="1.5" opacity=".6"/>
      <!-- Brilho na aureola -->
      <path d="M 52,20 Q 68,16 84,20" stroke="#FFEE80" stroke-width="2" fill="none" opacity=".6"/>
      <!-- Olhos felizes (abertos, brilhantes) -->
      <ellipse cx="56" cy="63" rx="9" ry="8.5" fill="#1A0A00"/>
      <ellipse cx="80" cy="63" rx="9" ry="8.5" fill="#1A0A00"/>
      <ellipse cx="56" cy="63" rx="7" ry="6.5" fill="#2A1800"/>
      <ellipse cx="80" cy="63" rx="7" ry="6.5" fill="#2A1800"/>
      <!-- Brilhos nos olhos -->
      <ellipse cx="52" cy="59" rx="3" ry="2.5" fill="#fff" opacity=".95"/>
      <ellipse cx="76" cy="59" rx="3" ry="2.5" fill="#fff" opacity=".95"/>
      <ellipse cx="58" cy="66" rx="1.5" ry="1.2" fill="#fff" opacity=".5"/>
      <ellipse cx="82" cy="66" rx="1.5" ry="1.2" fill="#fff" opacity=".5"/>
      <!-- Nariz golden grande -->
      <ellipse cx="68" cy="73" rx="6" ry="4.5" fill="#6A3A10"/>
      <!-- Boca aberta com lingua rosa (caracteristica do golden) -->
      <path d="M 55,76 Q 68,82 81,76 Q 78,88 68,90 Q 58,88 55,76 Z" fill="#E8B080"/>
      <!-- Lingua -->
      <ellipse cx="68" cy="86" rx="8" ry="6" fill="#FF8090"/>
      <line x1="68" y1="80" x2="68" y2="92" stroke="#D06070" stroke-width="1.2"/>
      <!-- Patas dianteiras -->
      <ellipse cx="50" cy="123" rx="12" ry="7" fill="#B07018"/>
      <ellipse cx="86" cy="123" rx="12" ry="7" fill="#B07018"/>
    </svg>
  </div>
  <div class="card-body">
    <div class="card-name" style="color:#FFD700">TAPZ</div>
    <div class="code">#CR-0004 | Golden Angel</div>
    <div class="stat-row"><span class="stat-label">Velocidade</span><div class="stat-bar"><div class="stat-fill" data-val="94" style="background:#FFD700;width:0%"></div></div><span class="stat-val">94</span></div>
    <div class="stat-row"><span class="stat-label">Controle</span><div class="stat-bar"><div class="stat-fill" data-val="80" style="background:#FFD700;width:0%"></div></div><span class="stat-val">80</span></div>
    <div class="stat-row"><span class="stat-label">Aerodin.</span><div class="stat-bar"><div class="stat-fill" data-val="97" style="background:#FFD700;width:0%"></div></div><span class="stat-val">97</span></div>
    <div class="card-lore">Golden divino abencado pela velocidade. Suas asas brancas e aureola dourada elevam a aerodinamica ao limite.</div>
  </div>
</div>

</div><!-- /grid -->

<script src="i18n.js"></script>
<script>
// Anima barras de stats com IntersectionObserver
document.querySelectorAll('.stat-fill').forEach(function(b){
  var v = parseInt(b.dataset.val,10);
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        b.style.width = v+'%';
        obs.disconnect();
      }
    });
  },{threshold:.1});
  obs.observe(b);
});
</script>
</body>
</html>
"""

print("\n=== build_v04b_p1.py  --  CapRush Overdrive! v0.4b ===\n")
w('i18n.js', I18N)
w('index.html', INDEX)
w('personagens.html', PERSONAGENS)
print("\n[CONCLUIDO] Part 1: i18n.js + index.html + personagens.html\n")
