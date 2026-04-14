#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace") if hasattr(sys.stdout, "reconfigure") else None
# -*- coding: utf-8 -*-
"""
CapRush v0.3 — Builder Parte 1
Gera: i18n.js, index.html (logo+bandeiras), personagens.html (SVGs manga)
"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))

def w(rel, txt):
    path = os.path.join(ROOT, *rel.split('/'))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(txt)
    print(f'  [OK]  {rel}')

# ═══════════════════════════════════════════════════════════════
# i18n.js — Sistema de tradução PT-BR / EN-US / ES
# ═══════════════════════════════════════════════════════════════
w('i18n.js', r"""
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
""")

# ═══════════════════════════════════════════════════════════════
# index.html — Logo imagem + efeito metálico + bandeiras
# ═══════════════════════════════════════════════════════════════
w('index.html', r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush - Overdrive!</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#060610;--acc:#00E5FF;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;background:var(--dark);font-family:'Rajdhani',sans-serif;color:#E8E8F0;}
#bg-canvas{position:fixed;inset:0;z-index:0;}
/* ── Logo imagem ── */
.logo-wrap{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;text-align:center;pointer-events:none;user-select:none;}
.logo-img-box{position:relative;display:inline-block;cursor:default;}
.logo-img{max-height:clamp(140px,22vh,260px);max-width:90vw;object-fit:contain;filter:drop-shadow(0 0 28px rgba(255,80,0,.55));animation:logoBreath 3s ease-in-out infinite;}
/* Brilho metálico APENAS no arco vermelho (parte sup. central da tampinha) */
.logo-shine{
  position:absolute;
  /* Arco vermelho fica ~40-55% do topo, ~25-75% da largura */
  top:38%;left:24%;width:52%;height:18%;
  border-radius:50%;
  pointer-events:none;
  opacity:0;
  background:radial-gradient(ellipse at 50% 40%,
    rgba(255,255,255,0.95) 0%,
    rgba(255,160,120,0.75) 25%,
    rgba(255,60,30,0.35) 55%,
    transparent 75%);
  mix-blend-mode:screen;
}
.logo-img-box:hover .logo-shine{
  animation:metalShine .55s ease-out forwards;
}
@keyframes metalShine{
  0%  {opacity:0;transform:translateX(-60%) scaleX(.4);}
  30% {opacity:1;}
  80% {opacity:.6;}
  100%{opacity:0;transform:translateX(120%) scaleX(1.3);}
}
.logo-sub{font-family:'Bebas Neue',sans-serif;font-size:clamp(.9rem,2.5vw,1.8rem);letter-spacing:14px;color:#00E5FF;text-shadow:0 0 20px rgba(0,229,255,.5);margin-top:.4rem;}
.logo-proto{font-size:.7rem;letter-spacing:4px;color:rgba(255,255,255,.3);text-transform:uppercase;margin-top:.5rem;}
@keyframes logoBreath{0%,100%{filter:drop-shadow(0 0 28px rgba(255,80,0,.55));}50%{filter:drop-shadow(0 0 52px rgba(255,200,0,.85));}}
/* ── Tampinhas flutuantes ── */
.cap{position:fixed;width:100px;height:100px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;z-index:20;text-decoration:none;animation:floatCap var(--dur,4s) ease-in-out var(--delay,0s) infinite;transition:transform .2s;border:3px solid rgba(255,255,255,.25);}
.cap:hover{transform:scale(1.18)!important;z-index:30;}
.cap-inner{width:72px;height:72px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,.3);border:2px solid rgba(255,255,255,.25);}
.cap-icon{font-size:1.5rem;line-height:1;color:#FFF;}
.cap-lbl{font-family:'Bebas Neue',sans-serif;font-size:.72rem;letter-spacing:2px;margin-top:.2rem;color:#FFF;text-shadow:0 1px 4px rgba(0,0,0,.9);}
.cap-name{position:absolute;bottom:-28px;left:50%;transform:translateX(-50%);font-family:'Bebas Neue',sans-serif;font-size:.85rem;letter-spacing:3px;white-space:nowrap;color:rgba(255,255,255,.85);text-shadow:0 0 10px #000;pointer-events:none;opacity:0;transition:opacity .2s;}
.cap:hover .cap-name{opacity:1;}
.cap-jogar {top:22%;left:12%;--dur:3.8s;--delay:0s;}
.cap-pilotos{top:20%;right:12%;--dur:4.2s;--delay:.5s;}
.cap-ranking{bottom:22%;left:14%;--dur:4.5s;--delay:1s;}
.cap-arq    {bottom:22%;right:14%;--dur:3.6s;--delay:1.5s;}
.cap-manual {bottom:10%;left:50%;transform:translateX(-50%);--dur:4s;--delay:.3s;animation-name:floatCapC;}
.cap-jogar  {background:radial-gradient(circle at 35% 35%,#FF6B6B,#A00);box-shadow:0 0 30px rgba(255,42,42,.5);}
.cap-pilotos{background:radial-gradient(circle at 35% 35%,#6BFFC8,#00774A);box-shadow:0 0 30px rgba(0,255,160,.4);}
.cap-ranking{background:radial-gradient(circle at 35% 35%,#6BC5FF,#0055AA);box-shadow:0 0 30px rgba(0,150,255,.4);}
.cap-arq    {background:radial-gradient(circle at 35% 35%,#FFD76B,#AA7700);box-shadow:0 0 30px rgba(255,200,0,.4);}
.cap-manual {background:radial-gradient(circle at 35% 35%,#D46BFF,#660099);box-shadow:0 0 30px rgba(180,0,255,.4);}
@keyframes floatCap{0%,100%{transform:translateY(0) rotate(-4deg);}50%{transform:translateY(-18px) rotate(4deg);}}
@keyframes floatCapC{0%,100%{transform:translateX(-50%) translateY(0) rotate(-3deg);}50%{transform:translateX(-50%) translateY(-14px) rotate(3deg);}}
.cap::after{content:'';position:absolute;top:12%;left:18%;width:30%;height:20%;background:rgba(255,255,255,.3);border-radius:50%;transform:rotate(-35deg);pointer-events:none;}
/* ── Bandeiras (injetadas pelo i18n.js) ── */
#flag-container{position:fixed;top:14px;right:18px;z-index:100;display:flex;gap:5px;}
.lang-btn.active{border-color:rgba(255,215,0,.8)!important;background:rgba(255,215,0,.15)!important;}
</style>
</head>
<body>
<canvas id="bg-canvas"></canvas>

<!-- Bandeiras fixas no canto -->
<div id="flag-container"></div>

<!-- Logo -->
<div class="logo-wrap">
  <div class="logo-img-box">
    <img src="Whisk_2.png" class="logo-img" alt="CapRush Overdrive!" onerror="this.style.display='none';document.getElementById('logo-fallback').style.display='block'"/>
    <div class="logo-shine"></div>
  </div>
  <!-- Fallback caso imagem não carregue -->
  <div id="logo-fallback" style="display:none">
    <div style="font-family:'Bebas Neue',sans-serif;font-size:clamp(3.5rem,10vw,8rem);line-height:.85;letter-spacing:6px;background:linear-gradient(160deg,#FF0000 0%,#FF6B00 30%,#FFD700 60%,#FF2A2A 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 30px rgba(255,100,0,.6));animation:logoBreath 3s ease-in-out infinite">CAP<br>RUSH</div>
  </div>
  <div class="logo-sub">&#8212; OVERDRIVE! &#8212;</div>
  <div class="logo-proto" data-i18n="hero.proto">Prototype v0.2 · Fogo SVM · Devnet</div>
</div>

<!-- Tampinhas menu -->
<a href="caprush-game.html" class="cap cap-jogar">
  <div class="cap-inner"><div class="cap-icon">&#9654;</div><div class="cap-lbl" data-i18n="cap.jogar.lbl">JOGAR</div></div>
  <span class="cap-name" data-i18n="cap.jogar.name">JOGAR</span>
</a>
<a href="personagens.html" class="cap cap-pilotos">
  <div class="cap-inner"><div class="cap-icon">&#128100;</div><div class="cap-lbl" data-i18n="cap.pilotos.lbl">PILOTOS</div></div>
  <span class="cap-name" data-i18n="cap.pilotos.name">PILOTOS</span>
</a>
<a href="ranking.html" class="cap cap-ranking">
  <div class="cap-inner"><div class="cap-icon">&#127942;</div><div class="cap-lbl" data-i18n="cap.ranking.lbl">RANKING</div></div>
  <span class="cap-name" data-i18n="cap.ranking.name">RANKING</span>
</a>
<a href="arquitetura.html" class="cap cap-arq">
  <div class="cap-inner"><div class="cap-icon">&#9881;</div><div class="cap-lbl" data-i18n="cap.arq.lbl">ARQT.</div></div>
  <span class="cap-name" data-i18n="cap.arq.name">ARQUITETURA</span>
</a>
<a href="manual.html" class="cap cap-manual">
  <div class="cap-inner"><div class="cap-icon">&#128218;</div><div class="cap-lbl" data-i18n="cap.manual.lbl">MANUAL</div></div>
  <span class="cap-name" data-i18n="cap.manual.name">MANUAL</span>
</a>

<script>
(function(){
var cv=document.getElementById('bg-canvas');
var cx=cv.getContext('2d');
var W,H,mx=0,my=0,pts=[];
function resize(){W=cv.width=innerWidth;H=cv.height=innerHeight;}
window.addEventListener('resize',resize);resize();
document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;});
for(var i=0;i<120;i++) pts.push({x:Math.random()*2000-1000,y:Math.random()*2000-1000,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,r:Math.random()*1.8+.4,hue:Math.random()*60+10,a:Math.random()*.7+.2});
var hue=0;
function frame(){
  requestAnimationFrame(frame);
  cx.fillStyle='rgba(6,6,16,.18)';cx.fillRect(0,0,W,H);
  var grd=cx.createRadialGradient(mx,my,0,mx,my,350);
  grd.addColorStop(0,'rgba(255,100,0,.06)');grd.addColorStop(.5,'rgba(255,42,42,.02)');grd.addColorStop(1,'rgba(0,0,0,0)');
  cx.fillStyle=grd;cx.fillRect(0,0,W,H);
  hue=(hue+.3)%360;
  cx.strokeStyle='rgba('+(80+Math.sin(hue*.02)*40)+',20,10,0.05)';cx.lineWidth=.5;
  var gs=50;
  for(var x=0;x<W;x+=gs){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,H);cx.stroke();}
  for(var y=0;y<H;y+=gs){cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke();}
  pts.forEach(function(p){
    var dx=mx-W/2-p.x,dy=my-H/2-p.y,dist=Math.sqrt(dx*dx+dy*dy)+1;
    p.vx+=dx/dist*.003;p.vy+=dy/dist*.003;p.vx*=.98;p.vy*=.98;
    p.x+=p.vx;p.y+=p.vy;
    if(Math.abs(p.x)>1200)p.vx*=-.8;if(Math.abs(p.y)>1200)p.vy*=-.8;
    var sx=W/2+p.x,sy=H/2+p.y;
    if(sx<-5||sx>W+5||sy<-5||sy>H+5)return;
    cx.save();cx.globalAlpha=p.a;cx.fillStyle='hsl('+(p.hue+hue*.1)+',90%,70%)';
    cx.beginPath();cx.arc(sx,sy,p.r,0,Math.PI*2);cx.fill();cx.restore();
  });
}
cx.fillStyle='#060610';cx.fillRect(0,0,W||1920,H||1080);
requestAnimationFrame(frame);
})();
</script>
<!-- Init flags from fixed div -->
<script src="i18n.js"></script>
<script>
document.addEventListener('DOMContentLoaded',function(){
  var fc=document.getElementById('flag-container');
  if(fc && window.i18n) window.i18n.renderFlags(fc);
});
</script>
</body>
</html>
""")

# ═══════════════════════════════════════════════════════════════
# personagens.html — SVGs manga/anime melhorados
# ═══════════════════════════════════════════════════════════════
w('personagens.html', r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush – Pilotos</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--panel:#0E0E1A;--acc:#00E5FF;--muted:#666680;}
*{margin:0;padding:0;box-sizing:border-box;}html{scroll-behavior:smooth;}
body{background:var(--dark);color:#E8E8F0;font-family:'Rajdhani',sans-serif;min-height:100vh;}
body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(255,42,42,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,42,42,.03) 1px,transparent 1px);background-size:40px 40px;z-index:0;pointer-events:none;}
nav{position:sticky;top:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:10px 32px;background:rgba(8,8,18,.97);border-bottom:2px solid var(--red);}
.nlogo{font-family:'Bebas Neue',sans-serif;font-size:1.6rem;letter-spacing:4px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none;}
.nlinks{display:flex;gap:1.4rem;align-items:center;}
.nlinks a{color:var(--muted);font-size:.78rem;letter-spacing:2px;text-decoration:none;text-transform:uppercase;transition:color .2s;}
.nlinks a:hover,.nlinks a.active{color:var(--gold);}
.nbadge{background:var(--red);color:#fff;font-size:.63rem;padding:2px 8px;border-radius:2px;letter-spacing:2px;text-transform:uppercase;}
#flag-container{display:flex;gap:4px;margin-left:8px;}
.lang-btn{background:none;border:1px solid rgba(255,255,255,.18);border-radius:4px;padding:2px 5px;cursor:pointer;font-size:1.05rem;transition:all .15s;}
.lang-btn:hover,.lang-btn.active{border-color:rgba(255,215,0,.7);background:rgba(255,215,0,.1);}
.hero{position:relative;z-index:1;text-align:center;padding:4rem 2rem 2rem;}
.hero h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.5rem,8vw,5rem);letter-spacing:6px;line-height:1;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.hero p{color:var(--muted);letter-spacing:3px;font-size:.9rem;margin-top:.8rem;text-transform:uppercase;}
.grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem;max-width:1200px;margin:3rem auto 6rem;padding:0 2rem;}
.card{background:var(--panel);border-radius:16px;border:1px solid rgba(255,255,255,.07);overflow:hidden;transition:transform .3s,box-shadow .3s;cursor:pointer;position:relative;}
.card:hover{transform:translateY(-8px);box-shadow:0 24px 60px rgba(0,0,0,.6);}
.card.locked{opacity:.55;cursor:not-allowed;}.card.locked:hover{transform:none;box-shadow:none;}
.rarity{position:absolute;top:16px;right:16px;font-family:'Bebas Neue',sans-serif;font-size:.7rem;letter-spacing:3px;padding:3px 10px;border-radius:4px;z-index:2;}
.r-epica{background:rgba(123,97,255,.3);color:#A78BFF;border:1px solid #A78BFF;}
.r-lendaria{background:rgba(0,229,255,.2);color:#00E5FF;border:1px solid #00E5FF;}
.r-rara{background:rgba(255,215,0,.2);color:#FFD700;border:1px solid #FFD700;}
.r-mitica{background:rgba(255,42,42,.2);color:#FF6B6B;border:1px solid #FF6B6B;}
.avatar-wrap{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
.avatar-svg{width:150px;height:150px;z-index:1;}
.ring{position:absolute;border-radius:50%;border:2px solid;animation:spin 8s linear infinite;}
.ring1{width:70%;height:70%;animation-duration:8s;}
.ring2{width:55%;height:55%;animation-duration:5s;animation-direction:reverse;}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.05);}}
.info{padding:20px;}
.info .name{font-family:'Bebas Neue',sans-serif;font-size:2rem;letter-spacing:4px;line-height:1;margin-bottom:2px;}
.info .title{font-size:.78rem;letter-spacing:3px;color:var(--muted);text-transform:uppercase;margin-bottom:16px;}
.attrs{display:flex;flex-direction:column;gap:8px;margin-bottom:16px;}
.attr-row{display:flex;align-items:center;gap:10px;}
.attr-lbl{font-size:.7rem;letter-spacing:2px;color:var(--muted);text-transform:uppercase;width:90px;flex-shrink:0;}
.attr-bar{flex:1;height:6px;background:#1A1A2E;border-radius:3px;overflow:hidden;}
.attr-fill{height:100%;border-radius:3px;transition:width .8s ease;}
.attr-val{font-family:'Bebas Neue',sans-serif;font-size:.9rem;width:28px;text-align:right;flex-shrink:0;}
.ability{background:rgba(255,255,255,.04);border-radius:8px;padding:10px 12px;margin-bottom:16px;border-left:3px solid;}
.ability .abl-name{font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:2px;margin-bottom:2px;}
.ability .abl-desc{font-size:.75rem;color:var(--muted);line-height:1.5;}
.nft-row{display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,.07);padding-top:14px;}
.nft-id{font-size:.68rem;color:var(--muted);letter-spacing:1px;}
.nft-id span{display:block;font-family:'Bebas Neue',sans-serif;font-size:.9rem;color:#E8E8F0;}
.btn-select{font-family:'Bebas Neue',sans-serif;font-size:.85rem;letter-spacing:3px;padding:6px 18px;border-radius:4px;border:1px solid;cursor:pointer;text-decoration:none;transition:all .2s;}
.lock-badge{position:absolute;inset:0;background:rgba(0,0,0,.5);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:10;border-radius:16px;}
.lock-badge .lock-icon{font-size:3rem;margin-bottom:.5rem;}
.lock-badge p{font-family:'Bebas Neue',sans-serif;font-size:1rem;letter-spacing:3px;color:#888;}
</style>
</head>
<body>
<nav>
  <a href="index.html" class="nlogo">CAP RUSH</a>
  <div class="nlinks">
    <a href="caprush-game.html" data-i18n="nav.jogar">Jogar</a>
    <a href="personagens.html" class="active" data-i18n="nav.pilotos">Pilotos</a>
    <a href="ranking.html" data-i18n="nav.ranking">Ranking</a>
    <a href="manual.html" data-i18n="nav.manual">Manual</a>
    <span class="nbadge">Prototype v0.2</span>
    <div id="flag-container"></div>
  </div>
</nav>

<div class="hero">
  <h1 data-i18n="pg.hero.title">ESCOLHA SEU PILOTO</h1>
  <p data-i18n="pg.hero.sub">Cada tampinha é um NFT com atributos reais &mdash; velocidade, controle e aerodinâmica</p>
</div>

<div class="grid">

<!-- ─── KENTA ─── Maine Coon Brown Tabby - manga/anime style -->
<div class="card">
  <div class="rarity r-epica">&#9670; <span data-i18n="r.epica">&Eacute;PICA</span></div>
  <div class="avatar-wrap" style="background:radial-gradient(circle at 50% 40%,rgba(123,97,255,.25),transparent 70%);">
    <div class="ring ring1" style="border-color:rgba(123,97,255,.45);"></div>
    <div class="ring ring2" style="border-color:rgba(123,97,255,.28);"></div>
    <svg class="avatar-svg" style="animation:breathe 3s ease-in-out infinite;filter:drop-shadow(0 0 14px rgba(123,97,255,.7))" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Corpo -->
      <ellipse cx="75" cy="98" rx="40" ry="30" fill="#7A4422"/>
      <ellipse cx="75" cy="98" rx="33" ry="23" fill="#9B5E2E"/>
      <!-- Listras tabby escuras -->
      <path d="M48 88 Q62 78 75 88 Q88 78 102 88 Q98 98 88 103 Q75 95 62 103 Q52 98 48 88Z" fill="#5A2E0A" opacity=".55"/>
      <path d="M52 96 Q60 90 68 96" stroke="#4A2208" stroke-width="1.5" fill="none" opacity=".6"/>
      <path d="M82 96 Q90 90 98 96" stroke="#4A2208" stroke-width="1.5" fill="none" opacity=".6"/>
      <!-- Cabeça grande anime -->
      <ellipse cx="75" cy="55" rx="30" ry="28" fill="#9B5E2E"/>
      <!-- Orelhas pontudas Maine Coon com tufos -->
      <polygon points="50,32 41,10 62,27" fill="#9B5E2E"/>
      <polygon points="52,31 45,14 62,27" fill="#C4845A" opacity=".9"/>
      <line x1="43" y1="9" x2="40" y2="4" stroke="#7A4422" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="46" y1="8" x2="44" y2="3" stroke="#7A4422" stroke-width="1.5" stroke-linecap="round"/>
      <polygon points="100,32 109,10 88,27" fill="#9B5E2E"/>
      <polygon points="98,31 105,14 88,27" fill="#C4845A" opacity=".9"/>
      <line x1="107" y1="9" x2="110" y2="4" stroke="#7A4422" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="104" y1="8" x2="106" y2="3" stroke="#7A4422" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Face mais clara -->
      <ellipse cx="75" cy="59" rx="24" ry="22" fill="#B07040"/>
      <!-- Listras testa -->
      <path d="M64 39 Q75 35 86 39" stroke="#5A2E0A" stroke-width="1.5" fill="none" opacity=".7"/>
      <path d="M66 37 Q75 33 84 37" stroke="#5A2E0A" stroke-width="1" fill="none" opacity=".5"/>
      <!-- OLHOS grandes anime - característica principal manga -->
      <!-- Olho Esquerdo -->
      <ellipse cx="63" cy="56" rx="10" ry="11.5" fill="#0D0D1E"/>
      <ellipse cx="63" cy="56" rx="8.5" ry="10" fill="#2ECC71"/>
      <ellipse cx="63" cy="56" rx="4.5" ry="6.5" fill="#111827"/>
      <!-- Highlights múltiplos - estilo manga -->
      <circle cx="65.5" cy="50.5" r="2.8" fill="white" opacity=".95"/>
      <circle cx="59.5" cy="60.5" r="1.4" fill="white" opacity=".7"/>
      <ellipse cx="66" cy="57" rx="1.2" ry=".7" fill="rgba(255,255,255,.5)"/>
      <!-- Brilho íris -->
      <ellipse cx="63" cy="53" rx="4" ry="2.5" fill="#4AE88A" opacity=".45"/>
      <!-- Olho Direito -->
      <ellipse cx="87" cy="56" rx="10" ry="11.5" fill="#0D0D1E"/>
      <ellipse cx="87" cy="56" rx="8.5" ry="10" fill="#2ECC71"/>
      <ellipse cx="87" cy="56" rx="4.5" ry="6.5" fill="#111827"/>
      <circle cx="89.5" cy="50.5" r="2.8" fill="white" opacity=".95"/>
      <circle cx="83.5" cy="60.5" r="1.4" fill="white" opacity=".7"/>
      <ellipse cx="90" cy="57" rx="1.2" ry=".7" fill="rgba(255,255,255,.5)"/>
      <ellipse cx="87" cy="53" rx="4" ry="2.5" fill="#4AE88A" opacity=".45"/>
      <!-- Cílios superiores -->
      <path d="M54 48 Q58 44 63 47" stroke="#1A0A00" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <path d="M78 48 Q82 44 87 47" stroke="#1A0A00" stroke-width="1.5" fill="none" stroke-linecap="round"/>
      <!-- Nariz pequeno anime -->
      <ellipse cx="75" cy="67" rx="2.5" ry="1.8" fill="#C4845A"/>
      <!-- Bocão leve sorriso -->
      <path d="M70 71 Q75 75 80 71" stroke="#9B5E2E" stroke-width="1.5" fill="none"/>
      <!-- Bochechas rosadas -->
      <ellipse cx="53" cy="65" rx="7" ry="4" fill="#FF8C69" opacity=".3"/>
      <ellipse cx="97" cy="65" rx="7" ry="4" fill="#FF8C69" opacity=".3"/>
      <!-- Bigodes longos -->
      <line x1="46" y1="65" x2="65" y2="68" stroke="#EEE" stroke-width="1.2"/>
      <line x1="44" y1="69" x2="63" y2="70" stroke="#EEE" stroke-width="1.2"/>
      <line x1="104" y1="65" x2="85" y2="68" stroke="#EEE" stroke-width="1.2"/>
      <line x1="106" y1="69" x2="87" y2="70" stroke="#EEE" stroke-width="1.2"/>
      <!-- Rabo peludo Maine Coon -->
      <path d="M115 96 Q132 82 130 62 Q128 46 120 52 Q117 70 104 85" stroke="#9B5E2E" stroke-width="11" fill="none" stroke-linecap="round"/>
      <path d="M115 96 Q132 82 130 62 Q128 46 120 52 Q117 70 104 85" stroke="#B87040" stroke-width="5" fill="none" stroke-linecap="round"/>
      <!-- Capacete racing roxo -->
      <path d="M47 49 Q47 29 75 27 Q103 29 103 49" fill="#6B4FCC" opacity=".9"/>
      <path d="M50 45 Q75 31 100 45" fill="none" stroke="#9A78FF" stroke-width="2.5"/>
      <path d="M50 45 Q75 31 100 45" fill="none" stroke="rgba(200,180,255,.3)" stroke-width="5"/>
      <text x="75" y="43" text-anchor="middle" font-family="Bebas Neue,sans-serif" font-size="11" fill="white" letter-spacing="1.5">KENTA</text>
    </svg>
  </div>
  <div class="info">
    <div class="name" style="color:#A78BFF;">KENTA</div>
    <div class="title" data-i18n="pg.kenta.title">Maine Coon Brown Tabby / Especialidade: Velocidade</div>
    <div class="attrs">
      <div class="attr-row"><span class="attr-lbl" data-i18n="attr.vel">Velocidade</span><div class="attr-bar"><div class="attr-fill" style="width:95%;background:linear-gradient(90deg,#7B61FF,#A78BFF);"></div></div><span class="attr-val" style="color:#A78BFF;">95</span></div>
      <div class="attr-row"><span class="attr-lbl" data-i18n="attr.ctrl">Controle</span><div class="attr-bar"><div class="attr-fill" style="width:68%;background:linear-gradient(90deg,#7B61FF,#A78BFF);"></div></div><span class="attr-val" style="color:#A78BFF;">68</span></div>
      <div class="attr-row"><span class="attr-lbl" data-i18n="attr.aero">Aerodin.</span><div class="attr-bar"><div class="attr-fill" style="width:80%;background:linear-gradient(90deg,#7B61FF,#A78BFF);"></div></div><span class="attr-val" style="color:#A78BFF;">80</span></div>
    </div>
    <div class="ability" style="border-color:#7B61FF;"><div class="abl-name" style="color:#A78BFF;">TURBO BURST</div><div class="abl-desc" data-i18n="pg.abl.kenta">Bônus de +18% de velocidade no primeiro lançamento de cada volta. Ideal para abrir vantagem na largada.</div></div>
    <div class="nft-row"><div class="nft-id">Token ID<span>#CR-0001</span></div><a href="caprush-game.html" class="btn-select" style="color:#A78BFF;border-color:#7B61FF;" data-i18n="pg.sel">SELECIONAR</a></div>
  </div>
</div>

<!-- ─── YUKI ─── Samoeida - manga/anime style -->
<div class="card">
  <div class="rarity r-lendaria">&#9670; LEND&Aacute;RIA</div>
  <div class="avatar-wrap" style="background:radial-gradient(circle at 50% 40%,rgba(0,229,255,.2),transparent 70%);">
    <div class="ring ring1" style="border-color:rgba(0,229,255,.4);"></div>
    <div class="ring ring2" style="border-color:rgba(0,229,255,.22);"></div>
    <svg class="avatar-svg" style="animation:breathe 3s ease-in-out infinite .5s;filter:drop-shadow(0 0 14px rgba(0,229,255,.65))" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Pelo fofo corpo - samoeida volumoso -->
      <ellipse cx="75" cy="98" rx="42" ry="32" fill="#E8EDF8"/>
      <ellipse cx="75" cy="98" rx="36" ry="26" fill="#F0F5FF"/>
      <!-- Pelagem extra fofa (puffs) -->
      <circle cx="44" cy="98" r="16" fill="#EDF2FF" opacity=".85"/>
      <circle cx="106" cy="98" r="16" fill="#EDF2FF" opacity=".85"/>
      <circle cx="60" cy="115" r="14" fill="#EDF2FF" opacity=".8"/>
      <circle cx="90" cy="115" r="14" fill="#EDF2FF" opacity=".8"/>
      <!-- Cabeça redonda fofa -->
      <ellipse cx="75" cy="54" rx="30" ry="28" fill="#F2F6FF"/>
      <!-- Orelhas pontudas com pelo -->
      <polygon points="53,33 44,11 65,29" fill="#E8EDF8"/>
      <polygon points="55,32 48,15 64,29" fill="#D8E2F5" opacity=".9"/>
      <circle cx="50" cy="26" r="5" fill="#E8EDF8"/>
      <polygon points="97,33 106,11 85,29" fill="#E8EDF8"/>
      <polygon points="95,32 102,15 86,29" fill="#D8E2F5" opacity=".9"/>
      <circle cx="100" cy="26" r="5" fill="#E8EDF8"/>
      <!-- Face -->
      <ellipse cx="75" cy="57" rx="25" ry="23" fill="#F8FBFF"/>
      <!-- OLHOS grandes manga - samoeida tem olhos amendoados espertos -->
      <!-- Olho Esquerdo -->
      <ellipse cx="63" cy="54" rx="10" ry="11" fill="#0A0A1A"/>
      <ellipse cx="63" cy="54" rx="8.5" ry="9.5" fill="#1A90FF"/>
      <ellipse cx="63" cy="54" rx="5" ry="6.5" fill="#0D3A8C"/>
      <!-- Iris gradient azul gelo -->
      <ellipse cx="63" cy="51" rx="5" ry="3" fill="#4DC8FF" opacity=".5"/>
      <circle cx="65.5" cy="49" r="2.8" fill="white" opacity=".95"/>
      <circle cx="59.5" cy="58.5" r="1.4" fill="white" opacity=".65"/>
      <ellipse cx="66" cy="55" rx="1.1" ry=".65" fill="rgba(255,255,255,.5)"/>
      <!-- Olho Direito -->
      <ellipse cx="87" cy="54" rx="10" ry="11" fill="#0A0A1A"/>
      <ellipse cx="87" cy="54" rx="8.5" ry="9.5" fill="#1A90FF"/>
      <ellipse cx="87" cy="54" rx="5" ry="6.5" fill="#0D3A8C"/>
      <ellipse cx="87" cy="51" rx="5" ry="3" fill="#4DC8FF" opacity=".5"/>
      <circle cx="89.5" cy="49" r="2.8" fill="white" opacity=".95"/>
      <circle cx="83.5" cy="58.5" r="1.4" fill="white" opacity=".65"/>
      <ellipse cx="90" cy="55" rx="1.1" ry=".65" fill="rgba(255,255,255,.5)"/>
      <!-- Nariz preto triangular - característico samoeida -->
      <polygon points="75,63 72,67 78,67" fill="#1A1A2E"/>
      <!-- SORRISO samoeida - cantos levantados característico -->
      <path d="M63 68 Q75 74 87 68" stroke="#C8D6EC" stroke-width="1.8" fill="none"/>
      <circle cx="63" cy="68" r="2" fill="#FFB6C1" opacity=".75"/>
      <circle cx="87" cy="68" r="2" fill="#FFB6C1" opacity=".75"/>
      <!-- Bochechas -->
      <ellipse cx="52" cy="63" rx="8" ry="5" fill="#B8D4FF" opacity=".35"/>
      <ellipse cx="98" cy="63" rx="8" ry="5" fill="#B8D4FF" opacity=".35"/>
      <!-- Bigodes platina -->
      <line x1="48" y1="63" x2="65" y2="65" stroke="#B0BCCC" stroke-width="1.3"/>
      <line x1="46" y1="66.5" x2="63.5" y2="67.5" stroke="#B0BCCC" stroke-width="1.3"/>
      <line x1="102" y1="63" x2="85" y2="65" stroke="#B0BCCC" stroke-width="1.3"/>
      <line x1="104" y1="66.5" x2="86.5" y2="67.5" stroke="#B0BCCC" stroke-width="1.3"/>
      <!-- Rabo esponjoso enorme -->
      <path d="M34 100 Q20 84 22 66 Q24 50 35 57 Q39 74 46 88" stroke="#E8EDF8" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M34 100 Q20 84 22 66 Q24 50 35 57 Q39 74 46 88" stroke="#F5F8FF" stroke-width="7" fill="none" stroke-linecap="round"/>
      <!-- Flocos de neve -->
      <circle cx="56" cy="29" r="2.2" fill="#00E5FF" opacity=".7"/>
      <circle cx="88" cy="24" r="1.7" fill="#00E5FF" opacity=".6"/>
      <circle cx="38" cy="54" r="1.6" fill="#00E5FF" opacity=".5"/>
      <circle cx="112" cy="48" r="1.5" fill="#00E5FF" opacity=".5"/>
      <!-- Estrela neve -->
      <path d="M76 20 L77.5 24 L81 24 L78.5 26.5 L79.5 30 L76 28 L72.5 30 L73.5 26.5 L71 24 L74.5 24Z" fill="#00E5FF" opacity=".6"/>
      <!-- Capacete ciano -->
      <path d="M46 46 Q46 27 75 25 Q104 27 104 46" fill="#007EA0" opacity=".9"/>
      <path d="M49 43 Q75 29 101 43" fill="none" stroke="#00E5FF" stroke-width="2.5"/>
      <path d="M49 43 Q75 29 101 43" fill="none" stroke="rgba(0,229,255,.25)" stroke-width="6"/>
      <text x="75" y="40" text-anchor="middle" font-family="Bebas Neue,sans-serif" font-size="11" fill="white" letter-spacing="1.5">YUKI</text>
    </svg>
  </div>
  <div class="info">
    <div class="name" style="color:#00E5FF;">YUKI</div>
    <div class="title" data-i18n="pg.yuki.title">Samoeida / Especialidade: Controle</div>
    <div class="attrs">
      <div class="attr-row"><span class="attr-lbl" data-i18n="attr.vel">Velocidade</span><div class="attr-bar"><div class="attr-fill" style="width:82%;background:linear-gradient(90deg,#0088AA,#00E5FF);"></div></div><span class="attr-val" style="color:#00E5FF;">82</span></div>
      <div class="attr-row"><span class="attr-lbl" data-i18n="attr.ctrl">Controle</span><div class="attr-bar"><div class="attr-fill" style="width:91%;background:linear-gradient(90deg,#0088AA,#00E5FF);"></div></div><span class="attr-val" style="color:#00E5FF;">91</span></div>
      <div class="attr-row"><span class="attr-lbl" data-i18n="attr.aero">Aerodin.</span><div class="attr-bar"><div class="attr-fill" style="width:75%;background:linear-gradient(90deg,#0088AA,#00E5FF);"></div></div><span class="attr-val" style="color:#00E5FF;">75</span></div>
    </div>
    <div class="ability" style="border-color:#00E5FF;"><div class="abl-name" style="color:#00E5FF;">TRAJET&Oacute;RIA GELADA</div><div class="abl-desc" data-i18n="pg.abl.yuki">Reduz o erro angular em 9% &mdash; a mira fica mais precisa. Perfeita para chicanes e curvas fechadas.</div></div>
    <div class="nft-row"><div class="nft-id">Token ID<span>#CR-0002</span></div><a href="caprush-game.html" class="btn-select" style="color:#00E5FF;border-color:#00E5FF;" data-i18n="pg.play">JOGAR AGORA</a></div>
  </div>
</div>

<!-- ─── BRUNA ─── SRD marrom + laço - manga/anime style - BLOQUEADA -->
<div class="card locked">
  <div class="rarity r-rara">&#9670; RARA</div>
  <div class="avatar-wrap" style="background:radial-gradient(circle at 50% 40%,rgba(255,215,0,.14),transparent 70%);">
    <div class="ring ring1" style="border-color:rgba(255,215,0,.32);"></div>
    <div class="ring ring2" style="border-color:rgba(255,215,0,.2);"></div>
    <svg class="avatar-svg" style="color:#FFD700;" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Corpo -->
      <ellipse cx="75" cy="100" rx="38" ry="28" fill="#6B3A1A"/>
      <ellipse cx="75" cy="103" rx="42" ry="22" fill="#5A2E0A"/>
      <!-- Cabeça arredondada kawaii -->
      <ellipse cx="75" cy="55" rx="30" ry="28" fill="#7A4422"/>
      <!-- Orelhas caídas - floppy ears -->
      <ellipse cx="51" cy="40" rx="12" ry="17" fill="#6B3A1A" transform="rotate(18 51 40)"/>
      <ellipse cx="51" cy="40" rx="9" ry="13" fill="#5A2E0A" transform="rotate(18 51 40)" opacity=".7"/>
      <ellipse cx="99" cy="40" rx="12" ry="17" fill="#6B3A1A" transform="rotate(-18 99 40)"/>
      <ellipse cx="99" cy="40" rx="9" ry="13" fill="#5A2E0A" transform="rotate(-18 99 40)" opacity=".7"/>
      <!-- Face mais clara -->
      <ellipse cx="75" cy="59" rx="23" ry="21" fill="#8B5230"/>
      <!-- Focinho mais claro -->
      <ellipse cx="75" cy="67" rx="12" ry="9" fill="#A06040" opacity=".65"/>
      <!-- OLHOS GRANDES manga - expressivos, castanhos cálidos -->
      <!-- Olho Esquerdo -->
      <ellipse cx="63" cy="53" rx="10.5" ry="12" fill="#0D0400"/>
      <ellipse cx="63" cy="53" rx="9" ry="10.5" fill="#8B3A0A"/>
      <ellipse cx="63" cy="53" rx="5.5" ry="7" fill="#1A0800"/>
      <ellipse cx="63" cy="50" rx="5" ry="3" fill="#D4700A" opacity=".5"/>
      <circle cx="65.8" cy="47" r="3" fill="white" opacity=".96"/>
      <circle cx="59.5" cy="58" r="1.5" fill="white" opacity=".7"/>
      <ellipse cx="66.5" cy="55" rx="1.2" ry=".7" fill="rgba(255,255,255,.5)"/>
      <!-- Olho Direito -->
      <ellipse cx="87" cy="53" rx="10.5" ry="12" fill="#0D0400"/>
      <ellipse cx="87" cy="53" rx="9" ry="10.5" fill="#8B3A0A"/>
      <ellipse cx="87" cy="53" rx="5.5" ry="7" fill="#1A0800"/>
      <ellipse cx="87" cy="50" rx="5" ry="3" fill="#D4700A" opacity=".5"/>
      <circle cx="89.8" cy="47" r="3" fill="white" opacity=".96"/>
      <circle cx="83.5" cy="58" r="1.5" fill="white" opacity=".7"/>
      <ellipse cx="90.5" cy="55" rx="1.2" ry=".7" fill="rgba(255,255,255,.5)"/>
      <!-- Nariz pequeno e fofo -->
      <ellipse cx="75" cy="64" rx="3.5" ry="2.5" fill="#0D0400"/>
      <path d="M71 67 Q75 71 79 67" stroke="#6B3A1A" stroke-width="1.5" fill="none"/>
      <!-- Bochechas fofas -->
      <ellipse cx="52" cy="63" rx="9" ry="5.5" fill="#CC6040" opacity=".35"/>
      <ellipse cx="98" cy="63" rx="9" ry="5.5" fill="#CC6040" opacity=".35"/>
      <!-- LAÇO ROSA GRANDE de menina -->
      <ellipse cx="85" cy="28" rx="11" ry="7" fill="#FF69B4" transform="rotate(-28 85 28)"/>
      <ellipse cx="96" cy="23" rx="11" ry="7" fill="#FF69B4" transform="rotate(28 96 23)"/>
      <circle cx="90" cy="26" r="5.5" fill="#FF1493"/>
      <!-- Brilho laço -->
      <ellipse cx="83" cy="24" rx="3" ry="2" fill="rgba(255,255,255,.4)" transform="rotate(-28 83 24)"/>
      <circle cx="87" cy="23" r="1.5" fill="rgba(255,255,255,.5)"/>
      <!-- Rabinho curto -->
      <path d="M113 96 Q126 84 123 70 Q120 58 112 64 Q112 74 104 85" stroke="#6B3A1A" stroke-width="8" fill="none" stroke-linecap="round"/>
      <!-- Capacete dourado -->
      <path d="M47 47 Q47 29 75 27 Q103 29 103 47" fill="#AA7800" opacity=".9"/>
      <path d="M50 44 Q75 30 100 44" fill="none" stroke="#FFD700" stroke-width="2.5"/>
      <path d="M50 44 Q75 30 100 44" fill="none" stroke="rgba(255,215,0,.25)" stroke-width="6"/>
      <text x="75" y="41" text-anchor="middle" font-family="Bebas Neue,sans-serif" font-size="11" fill="white" letter-spacing="1.5">BRUNA</text>
    </svg>
  </div>
  <div class="info">
    <div class="name" style="color:#FFD700;">BRUNA</div>
    <div class="title" data-i18n="pg.bruna.title">SRD Marrom / Especialidade: Versatilidade</div>
    <div class="attrs">
      <div class="attr-row"><span class="attr-lbl" data-i18n="attr.vel">Velocidade</span><div class="attr-bar"><div class="attr-fill" style="width:78%;background:linear-gradient(90deg,#AA8800,#FFD700);"></div></div><span class="attr-val" style="color:#FFD700;">78</span></div>
      <div class="attr-row"><span class="attr-lbl" data-i18n="attr.ctrl">Controle</span><div class="attr-bar"><div class="attr-fill" style="width:79%;background:linear-gradient(90deg,#AA8800,#FFD700);"></div></div><span class="attr-val" style="color:#FFD700;">79</span></div>
      <div class="attr-row"><span class="attr-lbl" data-i18n="attr.aero">Aerodin.</span><div class="attr-bar"><div class="attr-fill" style="width:78%;background:linear-gradient(90deg,#AA8800,#FFD700);"></div></div><span class="attr-val" style="color:#FFD700;">78</span></div>
    </div>
    <div class="ability" style="border-color:#FFD700;"><div class="abl-name" style="color:#FFD700;">INSTINTO DA PACK</div><div class="abl-desc" data-i18n="pg.abl.bruna">Bônus +5% em todos os atributos ao completar uma volta sem errar nenhum checkpoint.</div></div>
    <div class="nft-row"><div class="nft-id">Token ID<span>#CR-0003</span></div><span class="btn-select" style="color:#FFD700;border-color:#FFD700;opacity:.5;cursor:not-allowed;" data-i18n="pg.locked">BLOQUEADA</span></div>
  </div>
  <div class="lock-badge"><div class="lock-icon">&#128274;</div><p data-i18n="pg.locked">BLOQUEADA</p><p style="font-size:.7rem;color:#666;margin-top:.3rem;letter-spacing:1px;" data-i18n="pg.next">Pr&oacute;xima Fase</p></div>
</div>

<!-- ─── TAPZ ─── Golden Retriever Angelical + laço - manga/anime - BLOQUEADA -->
<div class="card locked">
  <div class="rarity r-mitica">&#9670; M&Iacute;TICA</div>
  <div class="avatar-wrap" style="background:radial-gradient(circle at 50% 40%,rgba(255,42,42,.18),transparent 70%);">
    <div class="ring ring1" style="border-color:rgba(255,107,107,.35);"></div>
    <div class="ring ring2" style="border-color:rgba(255,107,107,.2);"></div>
    <svg class="avatar-svg" style="color:#FF6B6B;" viewBox="0 0 150 150" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- ASAS DE ANJO - camada mais atrás -->
      <!-- Asa esquerda -->
      <path d="M28 65 Q10 50 12 34 Q15 20 28 28 Q24 44 26 60Z" fill="white" opacity=".9"/>
      <path d="M26 72 Q8 60 10 44 Q12 32 24 38 Q20 52 24 68Z" fill="white" opacity=".75"/>
      <path d="M30 80 Q15 72 16 60 Q18 50 27 55 Q24 65 28 76Z" fill="white" opacity=".65"/>
      <!-- Penas asa esq -->
      <path d="M14 34 Q18 28 24 32" stroke="#DDD" stroke-width="1.5" fill="none"/>
      <path d="M11 42 Q16 36 22 40" stroke="#DDD" stroke-width="1.5" fill="none"/>
      <path d="M10 50 Q15 44 21 48" stroke="#DDD" stroke-width="1.5" fill="none"/>
      <!-- Asa direita -->
      <path d="M122 65 Q140 50 138 34 Q135 20 122 28 Q126 44 124 60Z" fill="white" opacity=".9"/>
      <path d="M124 72 Q142 60 140 44 Q138 32 126 38 Q130 52 126 68Z" fill="white" opacity=".75"/>
      <path d="M120 80 Q135 72 134 60 Q132 50 123 55 Q126 65 122 76Z" fill="white" opacity=".65"/>
      <path d="M136 34 Q132 28 126 32" stroke="#DDD" stroke-width="1.5" fill="none"/>
      <path d="M139 42 Q134 36 128 40" stroke="#DDD" stroke-width="1.5" fill="none"/>
      <path d="M140 50 Q135 44 129 48" stroke="#DDD" stroke-width="1.5" fill="none"/>
      <!-- Corpo Golden (pelagem dourada) -->
      <ellipse cx="75" cy="100" rx="39" ry="28" fill="#C8860A"/>
      <ellipse cx="75" cy="100" rx="32" ry="22" fill="#D9950C"/>
      <!-- Detalhe pelo dourado -->
      <path d="M38 90 Q32 78 37 66 Q42 55 48 66 Q42 78 40 90Z" fill="#DBA025" opacity=".65"/>
      <path d="M112 90 Q118 78 113 66 Q108 55 102 66 Q108 78 110 90Z" fill="#DBA025" opacity=".65"/>
      <!-- Cabeça arredondada golden -->
      <ellipse cx="75" cy="55" rx="30" ry="28" fill="#D4950C"/>
      <!-- Orelhas caídas golden -->
      <ellipse cx="50" cy="44" rx="13" ry="19" fill="#C8860A" transform="rotate(14 50 44)"/>
      <ellipse cx="100" cy="44" rx="13" ry="19" fill="#C8860A" transform="rotate(-14 100 44)"/>
      <!-- Face golden mais clara -->
      <ellipse cx="75" cy="59" rx="24" ry="22" fill="#DBA025"/>
      <ellipse cx="75" cy="68" rx="14" ry="9" fill="#C8860A" opacity=".55"/>
      <!-- AUREOLA DOURADA animada -->
      <ellipse cx="75" cy="20" rx="18" ry="5.5" fill="none" stroke="#FFD700" stroke-width="3"/>
      <ellipse cx="75" cy="20" rx="18" ry="5.5" fill="none" stroke="#FFA500" stroke-width="1.2" opacity=".55"/>
      <!-- brilho aréola -->
      <path d="M60 19 Q67.5 16 75 19 Q82.5 16 90 19" stroke="#FFFACD" stroke-width="1.5" fill="none" opacity=".8"/>
      <!-- OLHOS grandes manga - mel/ambra angelical -->
      <!-- Olho Esquerdo -->
      <ellipse cx="63" cy="54" rx="10.5" ry="12" fill="#0A0400"/>
      <ellipse cx="63" cy="54" rx="9" ry="10.5" fill="#C8860A"/>
      <ellipse cx="63" cy="54" rx="5" ry="7" fill="#0A0800"/>
      <ellipse cx="63" cy="51" rx="5" ry="3" fill="#E8A020" opacity=".55"/>
      <!-- Estrela highlight - estilo celestial -->
      <circle cx="65.8" cy="48" r="3" fill="white" opacity=".97"/>
      <circle cx="59.5" cy="59" r="1.6" fill="white" opacity=".72"/>
      <ellipse cx="66.5" cy="55.5" rx="1.3" ry=".75" fill="rgba(255,255,255,.55)"/>
      <!-- Olho Direito -->
      <ellipse cx="87" cy="54" rx="10.5" ry="12" fill="#0A0400"/>
      <ellipse cx="87" cy="54" rx="9" ry="10.5" fill="#C8860A"/>
      <ellipse cx="87" cy="54" rx="5" ry="7" fill="#0A0800"/>
      <ellipse cx="87" cy="51" rx="5" ry="3" fill="#E8A020" opacity=".55"/>
      <circle cx="89.8" cy="48" r="3" fill="white" opacity=".97"/>
      <circle cx="83.5" cy="59" r="1.6" fill="white" opacity=".72"/>
      <ellipse cx="90.5" cy="55.5" rx="1.3" ry=".75" fill="rgba(255,255,255,.55)"/>
      <!-- Nariz preto fofo -->
      <ellipse cx="75" cy="65" rx="4" ry="3" fill="#0A0400"/>
      <path d="M70 69 Q75 73.5 80 69" stroke="#A07010" stroke-width="1.5" fill="none"/>
      <!-- Bochechas rosadas angelicais -->
      <ellipse cx="52" cy="63" rx="9" ry="5.5" fill="#FFB0A0" opacity=".4"/>
      <ellipse cx="98" cy="63" rx="9" ry="5.5" fill="#FFB0A0" opacity=".4"/>
      <!-- LAÇO DOURADO grande de menina -->
      <ellipse cx="86" cy="27" rx="12" ry="8" fill="#FFD700" transform="rotate(-24 86 27)"/>
      <ellipse cx="98" cy="21" rx="12" ry="8" fill="#FFD700" transform="rotate(24 98 21)"/>
      <circle cx="92" cy="24" r="5.5" fill="#FFA500"/>
      <ellipse cx="84" cy="23" rx="3.5" ry="2.2" fill="rgba(255,255,255,.45)" transform="rotate(-24 84 23)"/>
      <!-- Capacete vermelho mítico -->
      <path d="M46 47 Q46 29 75 27 Q104 29 104 47" fill="#AA0000" opacity=".9"/>
      <path d="M49 44 Q75 30 101 44" fill="none" stroke="#FF6B6B" stroke-width="2.5"/>
      <path d="M49 44 Q75 30 101 44" fill="none" stroke="rgba(255,107,107,.25)" stroke-width="6"/>
      <text x="75" y="41" text-anchor="middle" font-family="Bebas Neue,sans-serif" font-size="11" fill="white" letter-spacing="1.5">TAPZ</text>
      <!-- Sparkles angelicais -->
      <path d="M35 38 L36.5 42 L40 42 L37.5 44.5 L38.5 48 L35 46 L31.5 48 L32.5 44.5 L30 42 L33.5 42Z" fill="#FFE566" opacity=".8" transform="scale(.7) translate(18 12)"/>
      <path d="M120 30 L121 33 L124 33 L122 35 L122.5 38 L120 36.5 L117.5 38 L118 35 L116 33 L119 33Z" fill="#FFE566" opacity=".75" transform="scale(.65) translate(60 8)"/>
    </svg>
  </div>
  <div class="info">
    <div class="name" style="color:#FF6B6B;">TAPZ</div>
    <div class="title" data-i18n="pg.tapz.title">Golden Retriever Angelical / Especialidade: For&ccedil;a M&aacute;xima</div>
    <div class="attrs">
      <div class="attr-row"><span class="attr-lbl" data-i18n="attr.vel">Velocidade</span><div class="attr-bar"><div class="attr-fill" style="width:70%;background:linear-gradient(90deg,#880000,#FF6B6B);"></div></div><span class="attr-val" style="color:#FF6B6B;">70</span></div>
      <div class="attr-row"><span class="attr-lbl" data-i18n="attr.ctrl">Controle</span><div class="attr-bar"><div class="attr-fill" style="width:55%;background:linear-gradient(90deg,#880000,#FF6B6B);"></div></div><span class="attr-val" style="color:#FF6B6B;">55</span></div>
      <div class="attr-row"><span class="attr-lbl" data-i18n="attr.aero">Aerodin.</span><div class="attr-bar"><div class="attr-fill" style="width:99%;background:linear-gradient(90deg,#880000,#FF6B6B);"></div></div><span class="attr-val" style="color:#FF6B6B;">99</span></div>
    </div>
    <div class="ability" style="border-color:#FF6B6B;"><div class="abl-name" style="color:#FF6B6B;">GRACE OF HEAVEN</div><div class="abl-desc" data-i18n="pg.abl.tapz">Ignora 40% do arrasto de qualquer superf&iacute;cie. A mais veloz em linha reta &mdash; quase imposs&iacute;vel de controlar.</div></div>
    <div class="nft-row"><div class="nft-id">Token ID<span>#CR-0004</span></div><span class="btn-select" style="color:#FF6B6B;border-color:#FF6B6B;opacity:.5;cursor:not-allowed;" data-i18n="pg.locked">BLOQUEADA</span></div>
  </div>
  <div class="lock-badge"><div class="lock-icon">&#128274;</div><p data-i18n="pg.locked">BLOQUEADA</p><p style="font-size:.7rem;color:#666;margin-top:.3rem;letter-spacing:1px;" data-i18n="pg.nft">Via Marketplace NFT</p></div>
</div>

</div><!-- end grid -->

<script src="i18n.js"></script>
<script>
(function(){
  var fills=document.querySelectorAll('.attr-fill');
  fills.forEach(function(f){f._t=f.style.width;f.style.width='0%';});
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.querySelectorAll('.attr-fill').forEach(function(f){setTimeout(function(){f.style.width=f._t;},200);});
        obs.unobserve(e.target);
      }
    });
  },{threshold:0.3});
  document.querySelectorAll('.card').forEach(function(c){obs.observe(c);});
})();
</script>
</body>
</html>
""")

print('\n[v]  Parte 1 concluida: i18n.js, index.html, personagens.html\n')
