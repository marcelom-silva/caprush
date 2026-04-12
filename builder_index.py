"""
builder_index.py
================
CapRush - Fase 1 Final
Gera:
  client/index.html         - Lobby com tampinhas-menu
  personagens.html          - Pilotos NFT atualizados (Kenta/Yuki/Bruna/Tapz)
  manual.html               - Manual do usuario
  client/game.html          - game.html atualizado com link de volta ao index
  caprush-game.html         - frame do jogo com nav atualizada
Execute: python builder_index.py
"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))
def w(rel, txt):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f: f.write(txt)
    print("  OK  " + rel)

# ─────────────────────────────────────────────────────────────────
# INDEX.HTML — tampinhas flutuantes como menu
# ─────────────────────────────────────────────────────────────────
INDEX = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush – Overdrive!</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#060610;--acc:#00E5FF;}
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;background:var(--dark);font-family:'Rajdhani',sans-serif;color:#E8E8F0;}

/* ── FUNDO INTERATIVO ── */
#bg-canvas{position:fixed;inset:0;z-index:0;}

/* ── LOGO ── */
.logo-wrap{
  position:fixed;top:50%;left:50%;
  transform:translate(-50%,-50%);
  z-index:10;text-align:center;
  pointer-events:none;
  user-select:none;
}
.logo-main{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(3.5rem,10vw,8rem);
  line-height:.85;
  letter-spacing:6px;
  background:linear-gradient(160deg,#FF0000 0%,#FF6B00 30%,#FFD700 60%,#FF2A2A 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  filter:drop-shadow(0 0 30px rgba(255,100,0,.6));
  animation:logoBreath 3s ease-in-out infinite;
}
.logo-sub{
  font-family:'Bebas Neue',sans-serif;
  font-size:clamp(1rem,3vw,2rem);
  letter-spacing:14px;
  color:#00E5FF;
  text-shadow:0 0 20px rgba(0,229,255,.5);
  margin-top:.3rem;
}
.logo-proto{
  font-size:.75rem;letter-spacing:4px;color:rgba(255,255,255,.3);
  text-transform:uppercase;margin-top:.6rem;
}
@keyframes logoBreath{
  0%,100%{filter:drop-shadow(0 0 30px rgba(255,100,0,.6));}
  50%{filter:drop-shadow(0 0 60px rgba(255,215,0,.9));}
}

/* ── TAMPINHAS-MENU ── */
.cap{
  position:fixed;
  width:100px;height:100px;
  border-radius:50%;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  cursor:pointer;
  z-index:20;
  text-decoration:none;
  animation:floatCap var(--dur,4s) ease-in-out var(--delay,0s) infinite;
  transition:transform .2s,box-shadow .2s;
  border:3px solid rgba(255,255,255,.25);
}
.cap:hover{
  transform:scale(1.18) !important;
  z-index:30;
}
.cap-inner{
  width:72px;height:72px;border-radius:50%;
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  background:rgba(0,0,0,.35);
  border:2px solid rgba(255,255,255,.3);
}
.cap-icon{font-size:1.5rem;line-height:1;}
.cap-lbl{
  font-family:'Bebas Neue',sans-serif;
  font-size:.72rem;letter-spacing:2px;
  margin-top:.2rem;
  text-shadow:0 1px 4px rgba(0,0,0,.9);
}
.cap-name{
  position:absolute;bottom:-28px;left:50%;transform:translateX(-50%);
  font-family:'Bebas Neue',sans-serif;font-size:.85rem;letter-spacing:3px;
  white-space:nowrap;color:rgba(255,255,255,.8);
  text-shadow:0 0 10px rgba(0,0,0,1);
  pointer-events:none;
  opacity:0;transition:opacity .2s;
}
.cap:hover .cap-name{opacity:1;}

/* posições fixas */
.cap-jogar    {top:22%;left:12%; --dur:3.8s; --delay:0s;}
.cap-pilotos  {top:20%;right:12%; --dur:4.2s; --delay:.5s;}
.cap-ranking  {bottom:22%;left:14%; --dur:4.5s; --delay:1s;}
.cap-arq      {bottom:22%;right:14%; --dur:3.6s; --delay:1.5s;}
.cap-manual   {bottom:10%;left:50%;transform:translateX(-50%); --dur:4s; --delay:.3s; animation-name:floatCapC;}

/* cores */
.cap-jogar   {background:radial-gradient(circle at 35% 35%,#FF6B6B,#A00);box-shadow:0 0 30px rgba(255,42,42,.5);}
.cap-pilotos {background:radial-gradient(circle at 35% 35%,#6BFFC8,#00774A);box-shadow:0 0 30px rgba(0,255,160,.4);}
.cap-ranking {background:radial-gradient(circle at 35% 35%,#6BC5FF,#0055AA);box-shadow:0 0 30px rgba(0,150,255,.4);}
.cap-arq     {background:radial-gradient(circle at 35% 35%,#FFD76B,#AA7700);box-shadow:0 0 30px rgba(255,200,0,.4);}
.cap-manual  {background:radial-gradient(circle at 35% 35%,#D46BFF,#660099);box-shadow:0 0 30px rgba(180,0,255,.4);}

@keyframes floatCap{
  0%,100%{transform:translateY(0) rotate(-4deg);}
  50%{transform:translateY(-18px) rotate(4deg);}
}
@keyframes floatCapC{
  0%,100%{transform:translateX(-50%) translateY(0) rotate(-3deg);}
  50%{transform:translateX(-50%) translateY(-14px) rotate(3deg);}
}

/* reflexo na tampinha */
.cap::after{
  content:'';position:absolute;
  top:12%;left:18%;
  width:30%;height:20%;
  background:rgba(255,255,255,.35);
  border-radius:50%;
  transform:rotate(-35deg);
  pointer-events:none;
}
</style>
</head>
<body>

<canvas id="bg-canvas"></canvas>

<!-- LOGO -->
<div class="logo-wrap">
  <div class="logo-main">CAP<br>RUSH</div>
  <div class="logo-sub">— OVERDRIVE! —</div>
  <div class="logo-proto">Prototype v0.2 &middot; Fogo SVM &middot; Devnet</div>
</div>

<!-- TAMPINHAS-MENU -->
<a href="caprush-game.html" class="cap cap-jogar">
  <div class="cap-inner">
    <div class="cap-icon">&#9654;</div>
    <div class="cap-lbl">JOGAR</div>
  </div>
  <span class="cap-name">JOGAR</span>
</a>

<a href="personagens.html" class="cap cap-pilotos">
  <div class="cap-inner">
    <div class="cap-icon">&#128100;</div>
    <div class="cap-lbl">PILOTOS</div>
  </div>
  <span class="cap-name">PILOTOS</span>
</a>

<a href="ranking.html" class="cap cap-ranking">
  <div class="cap-inner">
    <div class="cap-icon">&#127942;</div>
    <div class="cap-lbl">RANKING</div>
  </div>
  <span class="cap-name">RANKING</span>
</a>

<a href="arquitetura.html" class="cap cap-arq">
  <div class="cap-inner">
    <div class="cap-icon">&#9881;</div>
    <div class="cap-lbl">ARQT.</div>
  </div>
  <span class="cap-name">ARQUITETURA</span>
</a>

<a href="manual.html" class="cap cap-manual">
  <div class="cap-inner">
    <div class="cap-icon">&#128218;</div>
    <div class="cap-lbl">MANUAL</div>
  </div>
  <span class="cap-name">MANUAL</span>
</a>

<script>
// Fundo interativo com partículas que reagem ao mouse
(function(){
  var cv=document.getElementById('bg-canvas');
  var cx=cv.getContext('2d');
  var W,H,mx=0,my=0,pts=[];

  function resize(){ W=cv.width=innerWidth; H=cv.height=innerHeight; }
  window.addEventListener('resize',resize); resize();

  document.addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;});

  // Criar partículas/estrelas
  for(var i=0;i<120;i++){
    pts.push({
      x:Math.random()*2000-1000, y:Math.random()*2000-1000,
      vx:(Math.random()-.5)*.4, vy:(Math.random()-.5)*.4,
      r:Math.random()*1.8+.4,
      hue:Math.random()*60+10, // laranja-vermelho-dourado
      a:Math.random()*.7+.2
    });
  }

  var hue=0;
  function frame(){
    requestAnimationFrame(frame);
    // Gradiente radial que segue o mouse
    cx.fillStyle='rgba(6,6,16,.18)';
    cx.fillRect(0,0,W,H);

    // Brilho radial seguindo o mouse
    var grd=cx.createRadialGradient(mx,my,0,mx,my,350);
    grd.addColorStop(0,'rgba(255,100,0,.06)');
    grd.addColorStop(.5,'rgba(255,42,42,.02)');
    grd.addColorStop(1,'rgba(0,0,0,0)');
    cx.fillStyle=grd;
    cx.fillRect(0,0,W,H);

    // Grade animada
    hue=(hue+.3)%360;
    cx.strokeStyle='rgba('+(80+Math.sin(hue*.02)*40)+','+(20)+','+(10)+',0.06)';
    cx.lineWidth=.5;
    var gs=50;
    for(var x=0;x<W;x+=gs){cx.beginPath();cx.moveTo(x,0);cx.lineTo(x,H);cx.stroke();}
    for(var y=0;y<H;y+=gs){cx.beginPath();cx.moveTo(0,y);cx.lineTo(W,y);cx.stroke();}

    // Partículas
    pts.forEach(function(p){
      // Atração suave ao mouse
      var dx=mx-W/2-p.x, dy=my-H/2-p.y;
      var dist=Math.sqrt(dx*dx+dy*dy)+1;
      p.vx+=dx/dist*.003; p.vy+=dy/dist*.003;
      p.vx*=.98; p.vy*=.98;
      p.x+=p.vx; p.y+=p.vy;
      if(Math.abs(p.x)>1200){p.vx*=-.8;}
      if(Math.abs(p.y)>1200){p.vy*=-.8;}
      var sx=W/2+p.x, sy=H/2+p.y;
      if(sx<-5||sx>W+5||sy<-5||sy>H+5) return;
      cx.save();
      cx.globalAlpha=p.a;
      cx.fillStyle='hsl('+(p.hue+hue*.1)+',90%,70%)';
      cx.beginPath();cx.arc(sx,sy,p.r,0,Math.PI*2);cx.fill();
      cx.restore();
    });
  }
  // Limpar com fade inicial
  cx.fillStyle='#060610';
  cx.fillRect(0,0,W||1920,H||1080);
  requestAnimationFrame(frame);
})();
</script>
</body>
</html>
"""

# ─────────────────────────────────────────────────────────────────
# PERSONAGENS.HTML — Kenta / Yuki / Bruna (bloq) / Tapz (bloq)
# ─────────────────────────────────────────────────────────────────
PERS = r"""<!DOCTYPE html>
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
.nlogo{font-family:'Bebas Neue',sans-serif;font-size:1.6rem;letter-spacing:4px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none;cursor:pointer;}
.nlinks{display:flex;gap:1.6rem;align-items:center;}
.nlinks a{color:var(--muted);font-size:.8rem;letter-spacing:2px;text-decoration:none;text-transform:uppercase;transition:color .2s;}
.nlinks a:hover,.nlinks a.active{color:var(--gold);}
.nbadge{background:var(--red);color:#fff;font-size:.63rem;padding:2px 8px;border-radius:2px;letter-spacing:2px;text-transform:uppercase;}
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

/* avatar anime SVG */
.avatar-wrap{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
.avatar-svg{width:140px;height:140px;z-index:1;filter:drop-shadow(0 0 18px currentColor);}
.ring{position:absolute;border-radius:50%;border:2px solid;animation:spin 8s linear infinite;}
.ring1{width:70%;height:70%;animation-duration:8s;}
.ring2{width:55%;height:55%;animation-duration:5s;animation-direction:reverse;}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes breathe{0%,100%{transform:scale(1);}50%{transform:scale(1.06);}}

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
    <a href="caprush-game.html">Jogar</a>
    <a href="personagens.html" class="active">Pilotos</a>
    <a href="ranking.html">Ranking</a>
    <a href="manual.html">Manual</a>
    <span class="nbadge">Prototype v0.2</span>
  </div>
</nav>
<div class="hero">
  <h1>ESCOLHA SEU PILOTO</h1>
  <p>Cada tampinha &eacute; um NFT com atributos reais &mdash; velocidade, controle e aerodin&acirc;mica</p>
</div>
<div class="grid">

<!-- ─── KENTA ─── Maine Coon Brown Tabby -->
<div class="card">
  <div class="rarity r-epica">&#9670; &Eacute;PICA</div>
  <div class="avatar-wrap" style="background:radial-gradient(circle at 50% 40%,rgba(123,97,255,.22),transparent 70%);">
    <div class="ring ring1" style="border-color:rgba(123,97,255,.4);"></div>
    <div class="ring ring2" style="border-color:rgba(123,97,255,.25);"></div>
    <svg class="avatar-svg" style="color:#A78BFF;animation:breathe 3s ease-in-out infinite;" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Maine Coon Brown Tabby anime -->
      <!-- corpo/fur base marrom tabby -->
      <ellipse cx="70" cy="90" rx="38" ry="32" fill="#6B3A1F"/>
      <ellipse cx="70" cy="90" rx="32" ry="26" fill="#8B5A2B"/>
      <!-- listras tabby -->
      <path d="M45 80 Q55 72 65 80 Q75 72 85 80 Q90 88 85 95 Q75 88 65 95 Q55 88 45 95Z" fill="#5C2E0A" opacity=".5"/>
      <!-- cabeça -->
      <ellipse cx="70" cy="52" rx="28" ry="26" fill="#8B5A2B"/>
      <!-- orelhas grandes (Maine Coon) com tufos -->
      <polygon points="46,30 38,10 56,26" fill="#8B5A2B"/>
      <polygon points="40,28 34,12 50,24" fill="#D4956A" opacity=".8"/>
      <line x1="38" y1="8" x2="36" y2="4" stroke="#6B3A1F" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="40" y1="7" x2="39" y2="3" stroke="#6B3A1F" stroke-width="1.5" stroke-linecap="round"/>
      <polygon points="94,30 102,10 84,26" fill="#8B5A2B"/>
      <polygon points="100,28 106,12 90,24" fill="#D4956A" opacity=".8"/>
      <line x1="102" y1="8" x2="104" y2="4" stroke="#6B3A1F" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="100" y1="7" x2="101" y2="3" stroke="#6B3A1F" stroke-width="1.5" stroke-linecap="round"/>
      <!-- face -->
      <ellipse cx="70" cy="56" rx="22" ry="20" fill="#A0693A"/>
      <!-- listras na testa -->
      <path d="M60 38 Q70 34 80 38" stroke="#5C2E0A" stroke-width="1.5" fill="none" opacity=".7"/>
      <path d="M63 36 Q70 32 77 36" stroke="#5C2E0A" stroke-width="1" fill="none" opacity=".5"/>
      <!-- olhos grandes anime verde -->
      <ellipse cx="61" cy="54" rx="9" ry="10" fill="#1A1A2E"/>
      <ellipse cx="79" cy="54" rx="9" ry="10" fill="#1A1A2E"/>
      <ellipse cx="61" cy="54" rx="7" ry="8" fill="#2ECC71"/>
      <ellipse cx="79" cy="54" rx="7" ry="8" fill="#2ECC71"/>
      <ellipse cx="61" cy="54" rx="4" ry="6" fill="#111"/>
      <ellipse cx="79" cy="54" rx="4" ry="6" fill="#111"/>
      <circle cx="63" cy="51" r="2" fill="white"/>
      <circle cx="81" cy="51" r="2" fill="white"/>
      <!-- nariz/boca -->
      <ellipse cx="70" cy="63" rx="3" ry="2" fill="#D4956A"/>
      <path d="M67 66 Q70 69 73 66" stroke="#8B5A2B" stroke-width="1.5" fill="none"/>
      <!-- bigodes -->
      <line x1="50" y1="63" x2="64" y2="65" stroke="#EEE" stroke-width="1" opacity=".8"/>
      <line x1="48" y1="66" x2="63" y2="67" stroke="#EEE" stroke-width="1" opacity=".8"/>
      <line x1="90" y1="63" x2="76" y2="65" stroke="#EEE" stroke-width="1" opacity=".8"/>
      <line x1="92" y1="66" x2="77" y2="67" stroke="#EEE" stroke-width="1" opacity=".8"/>
      <!-- rabo peludo Maine Coon -->
      <path d="M108 92 Q130 80 128 60 Q126 45 118 50 Q115 70 100 85" stroke="#8B5A2B" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M108 92 Q130 80 128 60 Q126 45 118 50 Q115 70 100 85" stroke="#A07850" stroke-width="5" fill="none" stroke-linecap="round"/>
      <!-- capacete de corrida -->
      <path d="M44 46 Q44 28 70 26 Q96 28 96 46" fill="#7B61FF" opacity=".85"/>
      <path d="M46 43 Q70 30 94 43" fill="none" stroke="#A78BFF" stroke-width="2"/>
      <text x="70" y="42" text-anchor="middle" font-family="Bebas Neue,sans-serif" font-size="10" fill="white" letter-spacing="1">KENTA</text>
    </svg>
  </div>
  <div class="info">
    <div class="name" style="color:#A78BFF;">KENTA</div>
    <div class="title">Maine Coon Brown Tabby / Especialidade: Velocidade</div>
    <div class="attrs">
      <div class="attr-row"><span class="attr-lbl">Velocidade</span><div class="attr-bar"><div class="attr-fill" style="width:95%;background:linear-gradient(90deg,#7B61FF,#A78BFF);"></div></div><span class="attr-val" style="color:#A78BFF;">95</span></div>
      <div class="attr-row"><span class="attr-lbl">Controle</span><div class="attr-bar"><div class="attr-fill" style="width:68%;background:linear-gradient(90deg,#7B61FF,#A78BFF);"></div></div><span class="attr-val" style="color:#A78BFF;">68</span></div>
      <div class="attr-row"><span class="attr-lbl">Aerodin.</span><div class="attr-bar"><div class="attr-fill" style="width:80%;background:linear-gradient(90deg,#7B61FF,#A78BFF);"></div></div><span class="attr-val" style="color:#A78BFF;">80</span></div>
    </div>
    <div class="ability" style="border-color:#7B61FF;"><div class="abl-name" style="color:#A78BFF;">TURBO BURST</div><div class="abl-desc">B&ocirc;nus de +18% de velocidade no primeiro lan&ccedil;amento de cada volta. Ideal para abrir vantagem na largada.</div></div>
    <div class="nft-row"><div class="nft-id">Token ID<span>#CR-0001</span></div><a href="caprush-game.html" class="btn-select" style="color:#A78BFF;border-color:#7B61FF;">SELECIONAR</a></div>
  </div>
</div>

<!-- ─── YUKI ─── Samoeida -->
<div class="card">
  <div class="rarity r-lendaria">&#9670; LEND&Aacute;RIA</div>
  <div class="avatar-wrap" style="background:radial-gradient(circle at 50% 40%,rgba(0,229,255,.18),transparent 70%);">
    <div class="ring ring1" style="border-color:rgba(0,229,255,.35);"></div>
    <div class="ring ring2" style="border-color:rgba(0,229,255,.2);"></div>
    <svg class="avatar-svg" style="color:#00E5FF;animation:breathe 3s ease-in-out infinite .5s;" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Samoeida branco neve -->
      <ellipse cx="70" cy="92" rx="38" ry="30" fill="#E8EDF5"/>
      <!-- pelo fofo -->
      <ellipse cx="70" cy="92" rx="42" ry="32" fill="none" stroke="#CDD6E8" stroke-width="4" stroke-dasharray="6 4"/>
      <!-- cabeça -->
      <ellipse cx="70" cy="52" rx="27" ry="25" fill="#F0F4FF"/>
      <!-- orelhas pontudas -->
      <polygon points="52,34 46,14 62,30" fill="#E8EDF5"/>
      <polygon points="54,33 50,18 62,29" fill="#D4DCF0"/>
      <polygon points="88,34 94,14 78,30" fill="#E8EDF5"/>
      <polygon points="86,33 90,18 78,29" fill="#D4DCF0"/>
      <!-- face -->
      <ellipse cx="70" cy="56" rx="22" ry="20" fill="#F5F8FF"/>
      <!-- olhos pretos amendoados anime -->
      <ellipse cx="61" cy="52" rx="8" ry="9" fill="#1A1A2E"/>
      <ellipse cx="79" cy="52" rx="8" ry="9" fill="#1A1A2E"/>
      <ellipse cx="61" cy="52" rx="6" ry="7" fill="#00BFFF"/>
      <ellipse cx="79" cy="52" rx="6" ry="7" fill="#00BFFF"/>
      <ellipse cx="61" cy="52" rx="3.5" ry="5" fill="#0A0A18"/>
      <ellipse cx="79" cy="52" rx="3.5" ry="5" fill="#0A0A18"/>
      <circle cx="63" cy="49" r="2" fill="white"/>
      <circle cx="81" cy="49" r="2" fill="white"/>
      <!-- nariz preto triangular Samoeida -->
      <polygon points="70,61 67,65 73,65" fill="#1A1A2E"/>
      <!-- "sorriso" Samoeida - cantos da boca levantados -->
      <path d="M62 66 Q70 71 78 66" stroke="#CDD6E8" stroke-width="1.5" fill="none"/>
      <circle cx="62" cy="66" r="1.5" fill="#FFB6C1" opacity=".7"/>
      <circle cx="78" cy="66" r="1.5" fill="#FFB6C1" opacity=".7"/>
      <!-- bigodes longos -->
      <line x1="48" y1="62" x2="64" y2="64" stroke="#AAB8CC" stroke-width="1.2"/>
      <line x1="46" y1="65" x2="63" y2="66" stroke="#AAB8CC" stroke-width="1.2"/>
      <line x1="92" y1="62" x2="76" y2="64" stroke="#AAB8CC" stroke-width="1.2"/>
      <line x1="94" y1="65" x2="77" y2="66" stroke="#AAB8CC" stroke-width="1.2"/>
      <!-- rabo esponjoso -->
      <path d="M32 95 Q20 80 22 65 Q24 52 34 58 Q38 75 45 88" stroke="#E8EDF5" stroke-width="12" fill="none" stroke-linecap="round"/>
      <path d="M32 95 Q20 80 22 65 Q24 52 34 58 Q38 75 45 88" stroke="#F5F8FF" stroke-width="6" fill="none" stroke-linecap="round"/>
      <!-- neve -->
      <circle cx="55" cy="30" r="2" fill="#00E5FF" opacity=".6"/>
      <circle cx="85" cy="25" r="1.5" fill="#00E5FF" opacity=".5"/>
      <circle cx="40" cy="55" r="1.5" fill="#00E5FF" opacity=".4"/>
      <!-- capacete ciano -->
      <path d="M44 44 Q44 26 70 24 Q96 26 96 44" fill="#00A5C8" opacity=".85"/>
      <path d="M46 41 Q70 28 94 41" fill="none" stroke="#00E5FF" stroke-width="2"/>
      <text x="70" y="40" text-anchor="middle" font-family="Bebas Neue,sans-serif" font-size="10" fill="white" letter-spacing="1">YUKI</text>
    </svg>
  </div>
  <div class="info">
    <div class="name" style="color:#00E5FF;">YUKI</div>
    <div class="title">Samoeida / Especialidade: Controle</div>
    <div class="attrs">
      <div class="attr-row"><span class="attr-lbl">Velocidade</span><div class="attr-bar"><div class="attr-fill" style="width:82%;background:linear-gradient(90deg,#0088AA,#00E5FF);"></div></div><span class="attr-val" style="color:#00E5FF;">82</span></div>
      <div class="attr-row"><span class="attr-lbl">Controle</span><div class="attr-bar"><div class="attr-fill" style="width:91%;background:linear-gradient(90deg,#0088AA,#00E5FF);"></div></div><span class="attr-val" style="color:#00E5FF;">91</span></div>
      <div class="attr-row"><span class="attr-lbl">Aerodin.</span><div class="attr-bar"><div class="attr-fill" style="width:75%;background:linear-gradient(90deg,#0088AA,#00E5FF);"></div></div><span class="attr-val" style="color:#00E5FF;">75</span></div>
    </div>
    <div class="ability" style="border-color:#00E5FF;"><div class="abl-name" style="color:#00E5FF;">TRAJET&Oacute;RIA GELADA</div><div class="abl-desc">Reduz o erro angular em 9% &mdash; a mira fica mais precisa. Perfeita para chicanes e curvas fechadas.</div></div>
    <div class="nft-row"><div class="nft-id">Token ID<span>#CR-0002</span></div><a href="caprush-game.html" class="btn-select" style="color:#00E5FF;border-color:#00E5FF;">JOGAR AGORA</a></div>
  </div>
</div>

<!-- ─── BRUNA ─── SRD marrom escuro c/ laço — BLOQUEADA -->
<div class="card locked">
  <div class="rarity r-rara">&#9670; RARA</div>
  <div class="avatar-wrap" style="background:radial-gradient(circle at 50% 40%,rgba(255,215,0,.12),transparent 70%);">
    <div class="ring ring1" style="border-color:rgba(255,215,0,.3);"></div>
    <div class="ring ring2" style="border-color:rgba(255,215,0,.18);"></div>
    <svg class="avatar-svg" style="color:#FFD700;" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Vira-lata marrom escuro -->
      <ellipse cx="70" cy="92" rx="36" ry="28" fill="#5C2E0A"/>
      <ellipse cx="70" cy="95" rx="40" ry="22" fill="#4A2208"/>
      <!-- cabeça -->
      <ellipse cx="70" cy="52" rx="26" ry="24" fill="#6B3A1F"/>
      <!-- orelhas caídas -->
      <ellipse cx="50" cy="38" rx="10" ry="16" fill="#5C2E0A" transform="rotate(20 50 38)"/>
      <ellipse cx="90" cy="38" rx="10" ry="16" fill="#5C2E0A" transform="rotate(-20 90 38)"/>
      <!-- face -->
      <ellipse cx="70" cy="56" rx="21" ry="19" fill="#7A4525"/>
      <!-- focinho mais claro -->
      <ellipse cx="70" cy="64" rx="12" ry="9" fill="#A0693A" opacity=".7"/>
      <!-- olhos grandes anime castanhos -->
      <ellipse cx="61" cy="51" rx="8" ry="9" fill="#1A0A00"/>
      <ellipse cx="79" cy="51" rx="8" ry="9" fill="#1A0A00"/>
      <ellipse cx="61" cy="51" rx="6" ry="7" fill="#8B4513"/>
      <ellipse cx="79" cy="51" rx="6" ry="7" fill="#8B4513"/>
      <ellipse cx="61" cy="51" rx="3" ry="4.5" fill="#1A0A00"/>
      <ellipse cx="79" cy="51" rx="3" ry="4.5" fill="#1A0A00"/>
      <circle cx="63" cy="48" r="2" fill="white"/>
      <circle cx="81" cy="48" r="2" fill="white"/>
      <!-- nariz -->
      <ellipse cx="70" cy="62" rx="3.5" ry="2.5" fill="#1A0A00"/>
      <path d="M67 65 Q70 68 73 65" stroke="#5C2E0A" stroke-width="1.5" fill="none"/>
      <!-- laço rosa na cabeça -->
      <ellipse cx="85" cy="30" rx="9" ry="6" fill="#FF69B4" transform="rotate(-30 85 30)"/>
      <ellipse cx="94" cy="26" rx="9" ry="6" fill="#FF69B4" transform="rotate(30 94 26)"/>
      <circle cx="89" cy="28" r="4" fill="#FF1493"/>
      <!-- pontinhos do laço -->
      <circle cx="83" cy="26" r="1.5" fill="#FFB6C1"/>
      <circle cx="95" cy="24" r="1.5" fill="#FFB6C1"/>
      <!-- rabinho -->
      <path d="M108 90 Q120 80 118 68 Q116 56 108 62 Q108 72 100 82" stroke="#5C2E0A" stroke-width="7" fill="none" stroke-linecap="round"/>
      <!-- capacete dourado -->
      <path d="M46 44 Q46 27 70 25 Q94 27 94 44" fill="#AA8800" opacity=".85"/>
      <path d="M48 41 Q70 28 92 41" fill="none" stroke="#FFD700" stroke-width="2"/>
      <text x="70" y="40" text-anchor="middle" font-family="Bebas Neue,sans-serif" font-size="10" fill="white" letter-spacing="1">BRUNA</text>
    </svg>
  </div>
  <div class="info">
    <div class="name" style="color:#FFD700;">BRUNA</div>
    <div class="title">SRD Marrom / Especialidade: Vers&atilde;o</div>
    <div class="attrs">
      <div class="attr-row"><span class="attr-lbl">Velocidade</span><div class="attr-bar"><div class="attr-fill" style="width:78%;background:linear-gradient(90deg,#AA8800,#FFD700);"></div></div><span class="attr-val" style="color:#FFD700;">78</span></div>
      <div class="attr-row"><span class="attr-lbl">Controle</span><div class="attr-bar"><div class="attr-fill" style="width:79%;background:linear-gradient(90deg,#AA8800,#FFD700);"></div></div><span class="attr-val" style="color:#FFD700;">79</span></div>
      <div class="attr-row"><span class="attr-lbl">Aerodin.</span><div class="attr-bar"><div class="attr-fill" style="width:78%;background:linear-gradient(90deg,#AA8800,#FFD700);"></div></div><span class="attr-val" style="color:#FFD700;">78</span></div>
    </div>
    <div class="ability" style="border-color:#FFD700;"><div class="abl-name" style="color:#FFD700;">INSTINTO DA PACK</div><div class="abl-desc">B&ocirc;nus +5% em todos os atributos ao completar uma volta sem errar nenhum checkpoint.</div></div>
    <div class="nft-row"><div class="nft-id">Token ID<span>#CR-0003</span></div><span class="btn-select" style="color:#FFD700;border-color:#FFD700;opacity:.5;cursor:not-allowed;">BLOQUEADA</span></div>
  </div>
  <div class="lock-badge"><div class="lock-icon">&#128274;</div><p>BLOQUEADA</p><p style="font-size:.7rem;color:#666;margin-top:.3rem;letter-spacing:1px;">Pr&oacute;xima Fase</p></div>
</div>

<!-- ─── TAPZ ─── Golden Retriever c/ laço + asinha + arola — BLOQUEADA -->
<div class="card locked">
  <div class="rarity r-mitica">&#9670; M&Iacute;TICA</div>
  <div class="avatar-wrap" style="background:radial-gradient(circle at 50% 40%,rgba(255,42,42,.15),transparent 70%);">
    <div class="ring ring1" style="border-color:rgba(255,107,107,.3);"></div>
    <div class="ring ring2" style="border-color:rgba(255,107,107,.18);"></div>
    <svg class="avatar-svg" style="color:#FF6B6B;" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Golden Retriever dourada -->
      <ellipse cx="70" cy="92" rx="38" ry="28" fill="#C8860A"/>
      <ellipse cx="70" cy="95" rx="42" ry="20" fill="#B87808"/>
      <!-- pelo dourado detalhes -->
      <path d="M35 85 Q30 75 35 65 Q40 55 45 65 Q40 75 38 85Z" fill="#DBA025" opacity=".6"/>
      <path d="M105 85 Q110 75 105 65 Q100 55 95 65 Q100 75 102 85Z" fill="#DBA025" opacity=".6"/>
      <!-- cabeça -->
      <ellipse cx="70" cy="52" rx="27" ry="25" fill="#D4950C"/>
      <!-- orelhas caídas Golden -->
      <ellipse cx="48" cy="42" rx="12" ry="18" fill="#C8860A" transform="rotate(15 48 42)"/>
      <ellipse cx="92" cy="42" rx="12" ry="18" fill="#C8860A" transform="rotate(-15 92 42)"/>
      <!-- face -->
      <ellipse cx="70" cy="56" rx="22" ry="20" fill="#DBA025"/>
      <ellipse cx="70" cy="65" rx="13" ry="9" fill="#C8860A" opacity=".6"/>
      <!-- olhos grandes anime mel -->
      <ellipse cx="61" cy="51" rx="9" ry="10" fill="#1A0A00"/>
      <ellipse cx="79" cy="51" rx="9" ry="10" fill="#1A0A00"/>
      <ellipse cx="61" cy="51" rx="7" ry="8" fill="#C8860A"/>
      <ellipse cx="79" cy="51" rx="7" ry="8" fill="#C8860A"/>
      <ellipse cx="61" cy="51" rx="4" ry="6" fill="#0A0800"/>
      <ellipse cx="79" cy="51" rx="4" ry="6" fill="#0A0800"/>
      <circle cx="63" cy="48" r="2.5" fill="white"/>
      <circle cx="81" cy="48" r="2.5" fill="white"/>
      <!-- brilho extra nos olhos -->
      <circle cx="64" cy="53" r="1" fill="white" opacity=".6"/>
      <circle cx="82" cy="53" r="1" fill="white" opacity=".6"/>
      <!-- nariz preto -->
      <ellipse cx="70" cy="63" rx="4" ry="3" fill="#1A0A00"/>
      <path d="M66 67 Q70 71 74 67" stroke="#A07010" stroke-width="1.5" fill="none"/>
      <!-- laço dourado -->
      <ellipse cx="85" cy="28" rx="10" ry="7" fill="#FFD700" transform="rotate(-25 85 28)"/>
      <ellipse cx="95" cy="23" rx="10" ry="7" fill="#FFD700" transform="rotate(25 95 23)"/>
      <circle cx="90" cy="25" r="4.5" fill="#FFA500"/>
      <!-- asas de anjo -->
      <path d="M30 60 Q15 50 18 38 Q22 28 32 36 Q28 48 30 60Z" fill="white" opacity=".85"/>
      <path d="M110 60 Q125 50 122 38 Q118 28 108 36 Q112 48 110 60Z" fill="white" opacity=".85"/>
      <!-- penas das asas -->
      <path d="M20 44 Q22 38 28 40" stroke="#DDD" stroke-width="1.5" fill="none"/>
      <path d="M18 50 Q20 44 26 46" stroke="#DDD" stroke-width="1.5" fill="none"/>
      <path d="M120 44 Q118 38 112 40" stroke="#DDD" stroke-width="1.5" fill="none"/>
      <path d="M122 50 Q120 44 114 46" stroke="#DDD" stroke-width="1.5" fill="none"/>
      <!-- aréola dourada -->
      <ellipse cx="70" cy="22" rx="16" ry="5" fill="none" stroke="#FFD700" stroke-width="2.5"/>
      <ellipse cx="70" cy="22" rx="16" ry="5" fill="none" stroke="#FFA500" stroke-width="1" opacity=".5"/>
      <!-- brilho na aréola -->
      <path d="M56 21 Q63 18 70 21 Q77 18 84 21" stroke="#FFFACD" stroke-width="1" fill="none" opacity=".7"/>
      <!-- capacete vermelho mítico -->
      <path d="M44 44 Q44 26 70 24 Q96 26 96 44" fill="#AA0000" opacity=".85"/>
      <path d="M46 41 Q70 28 94 41" fill="none" stroke="#FF6B6B" stroke-width="2"/>
      <text x="70" y="40" text-anchor="middle" font-family="Bebas Neue,sans-serif" font-size="10" fill="white" letter-spacing="1">TAPZ</text>
    </svg>
  </div>
  <div class="info">
    <div class="name" style="color:#FF6B6B;">TAPZ</div>
    <div class="title">Golden Retriever Angelical / Especialidade: For&ccedil;a M&aacute;xima</div>
    <div class="attrs">
      <div class="attr-row"><span class="attr-lbl">Velocidade</span><div class="attr-bar"><div class="attr-fill" style="width:70%;background:linear-gradient(90deg,#880000,#FF6B6B);"></div></div><span class="attr-val" style="color:#FF6B6B;">70</span></div>
      <div class="attr-row"><span class="attr-lbl">Controle</span><div class="attr-bar"><div class="attr-fill" style="width:55%;background:linear-gradient(90deg,#880000,#FF6B6B);"></div></div><span class="attr-val" style="color:#FF6B6B;">55</span></div>
      <div class="attr-row"><span class="attr-lbl">Aerodin.</span><div class="attr-bar"><div class="attr-fill" style="width:99%;background:linear-gradient(90deg,#880000,#FF6B6B);"></div></div><span class="attr-val" style="color:#FF6B6B;">99</span></div>
    </div>
    <div class="ability" style="border-color:#FF6B6B;"><div class="abl-name" style="color:#FF6B6B;">GRACE OF HEAVEN</div><div class="abl-desc">Ignora 40% do arrasto de qualquer superf&iacute;cie. A mais veloz em linha reta &mdash; quase imposs&iacute;vel de controlar.</div></div>
    <div class="nft-row"><div class="nft-id">Token ID<span>#CR-0004</span></div><span class="btn-select" style="color:#FF6B6B;border-color:#FF6B6B;opacity:.5;cursor:not-allowed;">BLOQUEADA</span></div>
  </div>
  <div class="lock-badge"><div class="lock-icon">&#128274;</div><p>BLOQUEADA</p><p style="font-size:.7rem;color:#666;margin-top:.3rem;letter-spacing:1px;">Via Marketplace NFT</p></div>
</div>

</div>
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
"""

# ─────────────────────────────────────────────────────────────────
# MANUAL.HTML
# ─────────────────────────────────────────────────────────────────
MANUAL = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CapRush – Manual</title>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rajdhani:wght@400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--red:#FF2A2A;--gold:#FFD700;--dark:#0A0A0F;--panel:#0E0E1A;--acc:#00E5FF;--muted:#666680;}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--dark);color:#E8E8F0;font-family:'Rajdhani',sans-serif;min-height:100vh;line-height:1.7;}
body::before{content:'';position:fixed;inset:0;background-image:linear-gradient(rgba(255,42,42,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,42,42,.03) 1px,transparent 1px);background-size:40px 40px;z-index:0;pointer-events:none;}
nav{position:sticky;top:0;z-index:100;display:flex;justify-content:space-between;align-items:center;padding:10px 32px;background:rgba(8,8,18,.97);border-bottom:2px solid var(--red);}
.nlogo{font-family:'Bebas Neue',sans-serif;font-size:1.6rem;letter-spacing:4px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none;}
.nlinks{display:flex;gap:1.6rem;align-items:center;}
.nlinks a{color:var(--muted);font-size:.8rem;letter-spacing:2px;text-decoration:none;text-transform:uppercase;transition:color .2s;}
.nlinks a:hover,.nlinks a.active{color:var(--gold);}
.nbadge{background:var(--red);color:#fff;font-size:.63rem;padding:2px 8px;border-radius:2px;letter-spacing:2px;text-transform:uppercase;}
.content{max-width:820px;margin:3rem auto 6rem;padding:0 2rem;position:relative;z-index:1;}
h1{font-family:'Bebas Neue',sans-serif;font-size:3.5rem;letter-spacing:6px;background:linear-gradient(135deg,var(--red),var(--gold));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:.5rem;}
h2{font-family:'Bebas Neue',sans-serif;font-size:1.8rem;letter-spacing:4px;color:var(--gold);margin:2.5rem 0 1rem;border-bottom:1px solid rgba(255,215,0,.2);padding-bottom:.5rem;}
h3{font-family:'Bebas Neue',sans-serif;font-size:1.2rem;letter-spacing:3px;color:var(--acc);margin:1.5rem 0 .5rem;}
p{color:#B0B0C0;margin-bottom:.8rem;font-size:1rem;}
.card-box{background:var(--panel);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:1.5rem;margin-bottom:1.5rem;}
.card-box.red{border-left:3px solid var(--red);}
.card-box.gold{border-left:3px solid var(--gold);}
.card-box.cyan{border-left:3px solid var(--acc);}
.card-box.green{border-left:3px solid #00FF88;}
table{width:100%;border-collapse:collapse;margin-bottom:1.5rem;}
th{background:rgba(255,42,42,.15);color:var(--red);font-family:'Bebas Neue',sans-serif;letter-spacing:2px;padding:10px 14px;text-align:left;font-size:.9rem;}
td{padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.05);color:#B0B0C0;font-size:.9rem;}
tr:hover td{background:rgba(255,255,255,.03);}
.badge{display:inline-block;background:rgba(0,229,255,.15);color:var(--acc);font-size:.75rem;letter-spacing:2px;padding:2px 8px;border-radius:4px;border:1px solid rgba(0,229,255,.3);}
.badge.gold{background:rgba(255,215,0,.15);color:var(--gold);border-color:rgba(255,215,0,.3);}
.badge.red{background:rgba(255,42,42,.15);color:var(--red);border-color:rgba(255,42,42,.3);}
kbd{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);border-radius:4px;padding:2px 8px;font-family:monospace;font-size:.85rem;color:#E8E8F0;}
</style>
</head>
<body>
<nav>
  <a href="index.html" class="nlogo">CAP RUSH</a>
  <div class="nlinks">
    <a href="caprush-game.html">Jogar</a>
    <a href="personagens.html">Pilotos</a>
    <a href="ranking.html">Ranking</a>
    <a href="manual.html" class="active">Manual</a>
    <span class="nbadge">Prototype v0.2</span>
  </div>
</nav>

<div class="content">
<h1>MANUAL DO PILOTO</h1>
<p style="color:var(--muted);letter-spacing:3px;font-size:.9rem;text-transform:uppercase;margin-bottom:2rem;">CapRush &ndash; Overdrive! &middot; Prototype v0.2</p>

<h2>O QUE &Eacute; CAPRUSH?</h2>
<div class="card-box gold">
<p>CapRush &eacute; um jogo de corrida de tampinhas com f&iacute;sica estilo <strong style="color:var(--gold)">Angry Birds + Sinuca</strong>. Cada tampinha &eacute; um NFT com atributos reais que afetam diretamente como ela se comporta na pista: velocidade m&aacute;xima, precis&atilde;o de mira e resist&ecirc;ncia ao arrasto.</p>
<p>A corrida &eacute; disputada por <strong style="color:var(--gold)">turnos de peteleco</strong>: voc&ecirc; mira, define a for&ccedil;a e solta. A tampinha desliza pela pista at&eacute; parar, e a&iacute; voc&ecirc; mira novamente. Complete as voltas mais r&aacute;pido que seu oponente.</p>
</div>

<h2>CONTROLES</h2>
<div class="card-box cyan">
<table>
<tr><th>A&ccedil;&atilde;o</th><th>Mouse</th><th>Touch</th></tr>
<tr><td>Iniciar jogo</td><td>Clique em qualquer lugar na tela de espera</td><td>Toque em qualquer lugar</td></tr>
<tr><td>Mirar</td><td>Clique e segure sobre a tampinha</td><td>Toque e segure na tampinha</td></tr>
<tr><td>Definir for&ccedil;a</td><td>Arraste para tr&aacute;s (oposto &agrave; dire&ccedil;&atilde;o desejada)</td><td>Arraste para tr&aacute;s</td></tr>
<tr><td>Lan&ccedil;ar</td><td>Solte o bot&atilde;o do mouse</td><td>Levante o dedo</td></tr>
</table>
<p><strong style="color:var(--acc)">Dica de mira:</strong> a linha tracejada azul aponta na dire&ccedil;&atilde;o do lan&ccedil;amento. O c&iacute;rculo dourado ao redor da tampinha indica a for&ccedil;a (quanto maior, mais r&aacute;pido).</p>
</div>

<h2>F&Iacute;SICA DA PISTA</h2>
<div class="card-box">
<table>
<tr><th>Superf&iacute;cie</th><th>Efeito</th><th>Som</th></tr>
<tr><td><span class="badge">Terra/Cascalho</span></td><td>Arrasto normal (1.0x)</td><td>Silencioso</td></tr>
<tr><td><span class="badge" style="background:rgba(0,150,255,.15);color:#5AAEFF;border-color:rgba(0,150,255,.3);">&#128167; &Aacute;gua</span></td><td>Reduz velocidade em 35% gradualmente (1.35x arrasto)</td><td>Som de salpico</td></tr>
<tr><td><span class="badge" style="background:rgba(0,200,0,.15);color:#5FFF5F;border-color:rgba(0,200,0,.3);">&#127807; Grama</span></td><td>Aumenta deslizamento &mdash; tampinha escorrega mais (0.75x atrito)</td><td>Som de grama</td></tr>
<tr><td><span class="badge gold">&#129522; Obst&aacute;culo</span></td><td>Ricochete el&aacute;stico (coef. 0.85)</td><td>Som de batida</td></tr>
<tr><td><span class="badge red">Zona interna</span></td><td>Volta ao &uacute;ltimo checkpoint (ou largada)</td><td>&mdash;</td></tr>
</table>
</div>

<h2>CHECKPOINTS E VOLTAS</h2>
<div class="card-box green">
<p>A pista possui <strong style="color:#00FF88">3 checkpoints</strong> (manchas brancas). Passe por eles em ordem para completar uma volta.</p>
<p>&#128276; Um <strong style="color:#00FF88">bip</strong> &eacute; emitido ao cruzar cada checkpoint &mdash; como os postos de combust&iacute;vel do River Raid.</p>
<p>Se a tampinha sair para a <strong style="color:var(--red)">parte interna da pista</strong> (paddock, arquibancada, grama ou lago), ela volta automaticamente ao &uacute;ltimo checkpoint j&aacute; registrado. Se nenhum checkpoint tiver sido ativado ainda, volta &agrave; <strong style="color:var(--gold)">linha de largada</strong>.</p>
<p>&#127941; Ao cruzar a linha de chegada (xadrez preto e branco), um <strong style="color:var(--gold)">som de vit&oacute;ria</strong> &eacute; tocado.</p>
</div>

<h2>ZONAS ESPECIAIS</h2>
<div class="card-box">
<h3>&#127970; Paddock (amarelo)</h3>
<p>Zona de boxes &agrave; esquerda da pista. Tampinha volta ao &uacute;ltimo checkpoint se entrar aqui.</p>
<h3>&#127881; Arquibancadas (laranja)</h3>
<p>Torcedores anim&aacute;veis na lateral. Tampinha volta ao &uacute;ltimo checkpoint se entrar aqui.</p>
<h3>&#127795; Grama interna (verde)</h3>
<p>Grama e &aacute;rvores no interior da pista. Tampinha volta ao &uacute;ltimo checkpoint se entrar aqui.</p>
<h3>&#128167; Lago (azul)</h3>
<p>Lago no interior da pista. Tampinha volta ao &uacute;ltimo checkpoint se entrar aqui.</p>
<h3>&#127774; Ponte (estreitamento)</h3>
<p>Pequeno estreitamento antes da chegada com duas guias laterais. A tampinha pode passar normalmente, mas colide com as guias se desviada.</p>
</div>

<h2>PILOTOS E NFTs</h2>
<div class="card-box red">
<table>
<tr><th>Piloto</th><th>Animal</th><th>Raridade</th><th>Especialidade</th><th>Status</th></tr>
<tr><td style="color:#A78BFF">KENTA</td><td>Maine Coon Brown Tabby</td><td><span class="badge" style="color:#A78BFF;background:rgba(123,97,255,.15);border-color:rgba(123,97,255,.3);">&Eacute;pica</span></td><td>Velocidade (95)</td><td>&#9989; Dispon&iacute;vel</td></tr>
<tr><td style="color:#00E5FF">YUKI</td><td>Samoeida</td><td><span class="badge">Lend&aacute;ria</span></td><td>Controle (91)</td><td>&#9989; Dispon&iacute;vel</td></tr>
<tr><td style="color:#FFD700">BRUNA</td><td>SRD Marrom c/ la&ccedil;o</td><td><span class="badge gold">Rara</span></td><td>Equilibrada</td><td>&#128274; Pr&oacute;xima fase</td></tr>
<tr><td style="color:#FF6B6B">TAPZ</td><td>Golden Retriever Angelical</td><td><span class="badge red">M&iacute;tica</span></td><td>Aerodin&acirc;mica (99)</td><td>&#128274; Marketplace NFT</td></tr>
</table>
</div>

<h2>MULTIPLAYER (1v1)</h2>
<div class="card-box cyan">
<p>O modo multiplayer permite duelos locais de 2 jogadores no mesmo dispositivo.</p>
<p><strong style="color:var(--acc)">Jogador 1 (Yuki):</strong> usa o lado esquerdo da tela &mdash; arraste normalmente.</p>
<p><strong style="color:var(--gold)">Jogador 2 (Kenta):</strong> usa o lado direito da tela &mdash; mesma mec&acirc;nica, mas com a tampinha dourada.</p>
<p>A corrida &eacute; por <strong style="color:var(--acc)">turnos alternados</strong>: J1 joga, a tampinha para, depois J2 joga, e assim por diante. Vence quem completar as voltas em menor tempo total.</p>
</div>

<h2>ECONOMY $CR</h2>
<div class="card-box gold">
<p>Ap&oacute;s completar uma corrida, o servidor local registra o tempo e distribui <strong style="color:var(--gold)">tokens $CR</strong> baseados na performance.</p>
<table>
<tr><th>A&ccedil;&atilde;o</th><th>Recompensa $CR</th></tr>
<tr><td>Corrida completada</td><td>0.1 $CR</td></tr>
<tr><td>Volta abaixo de 60s</td><td>+0.05 $CR b&ocirc;nus</td></tr>
<tr><td>Staking de tampinha/hora</td><td>3.6 $CR</td></tr>
</table>
</div>

<h2>COMO RODAR LOCALMENTE</h2>
<div class="card-box">
<p><kbd>Terminal 1</kbd> &rarr; <kbd>cd server &amp;&amp; python server.py</kbd></p>
<p><kbd>Terminal 2</kbd> &rarr; <kbd>python -m http.server 8080</kbd> (na raiz do projeto)</p>
<p><kbd>Chrome</kbd> &rarr; <kbd>http://localhost:8080/index.html</kbd></p>
</div>
</div>
</body>
</html>
"""

def build():
    print()
    print("="*55)
    print("  CapRush – builder_index.py")
    print("="*55)
    print("Raiz:", ROOT)
    print()
    w("index.html",       INDEX)
    w("personagens.html", PERS)
    w("manual.html",      MANUAL)
    print()
    print("  GERADO! Abra index.html para ver o lobby.")
    print()

if __name__=="__main__":
    build()
