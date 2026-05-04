// CapSprite.js - Tampinhas de garrafa (coroa metalica) + Pilotos anime
var CapSprite = (function(){

  // ── Overlay de template ────────────────────────────────────────────
  // Desenha o "estilo" da tampinha (CT-01 a CT-06) sobre o disco metalico.
  // Roda dentro do contexto ja rotacionado/transladado de drawCap.
  // Os formatos sao inspirados nas 6 naves do F-Zero (SNES).
  function _drawTemplate(ctx, radius, template, color, accentColor){
    var R = radius * 0.78; // raio "util" dentro da face da tampinha
    var dark  = shadeColor(color, -55);
    var light = lightenColor(color, 40);
    ctx.save();

    if(template === 'CT-01'){
      // FALCON - aerofolio em V invertido + bico fino
      // V invertido na frente (apontando "pra cima" no ref local)
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(0, -R*0.95);
      ctx.lineTo(R*0.55, -R*0.05);
      ctx.lineTo(R*0.18, -R*0.20);
      ctx.lineTo(0,      -R*0.55);
      ctx.lineTo(-R*0.18,-R*0.20);
      ctx.lineTo(-R*0.55,-R*0.05);
      ctx.closePath();
      ctx.fill();
      // contorno claro
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = light;
      ctx.stroke();
      // dois "flap" traseiros pequenos
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(-R*0.55, R*0.55);
      ctx.lineTo(-R*0.20, R*0.30);
      ctx.lineTo(-R*0.20, R*0.85);
      ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo( R*0.55, R*0.55);
      ctx.lineTo( R*0.20, R*0.30);
      ctx.lineTo( R*0.20, R*0.85);
      ctx.closePath(); ctx.fill();

    } else if(template === 'CT-02'){
      // STINGRAY - asas largas laterais, perfil baixo
      // Faixa horizontal larga (corpo da arraia)
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.ellipse(0, 0, R*0.95, R*0.42, 0, 0, Math.PI*2);
      ctx.fill();
      // ponta dianteira
      ctx.beginPath();
      ctx.moveTo(0, -R*0.85);
      ctx.lineTo(R*0.30, -R*0.15);
      ctx.lineTo(-R*0.30,-R*0.15);
      ctx.closePath();
      ctx.fill();
      // detalhe central claro (cockpit)
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.ellipse(0, -R*0.10, R*0.18, R*0.30, 0, 0, Math.PI*2);
      ctx.fill();

    } else if(template === 'CT-03'){
      // GOOSE - forma robusta, traseira reforcada
      // Quadrilatero trapezoidal robusto (mais largo atras)
      ctx.fillStyle = dark;
      ctx.beginPath();
      ctx.moveTo(-R*0.50, -R*0.75);
      ctx.lineTo( R*0.50, -R*0.75);
      ctx.lineTo( R*0.85,  R*0.75);
      ctx.lineTo(-R*0.85,  R*0.75);
      ctx.closePath();
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = light;
      ctx.stroke();
      // duas faixas militares (rebites)
      ctx.fillStyle = light;
      for(var k=-1;k<=1;k+=2){
        ctx.fillRect(k*R*0.55 - R*0.04, -R*0.55, R*0.08, R*0.55);
      }
      // traseira reforcada (barra horizontal)
      ctx.fillStyle = light;
      ctx.fillRect(-R*0.70, R*0.50, R*1.40, R*0.10);

    } else if(template === 'CT-04'){
      // FOX - anel/turbina central
      // Anel grosso central
      ctx.lineWidth   = R*0.16;
      ctx.strokeStyle = dark;
      ctx.beginPath();
      ctx.arc(0, 0, R*0.62, 0, Math.PI*2);
      ctx.stroke();
      // turbina (mini-anel claro interno)
      ctx.lineWidth   = R*0.06;
      ctx.strokeStyle = light;
      ctx.beginPath();
      ctx.arc(0, 0, R*0.62, 0, Math.PI*2);
      ctx.stroke();
      // 4 "flaps" em cruz fora do anel
      ctx.fillStyle = dark;
      for(var f=0; f<4; f++){
        ctx.save();
        ctx.rotate((f * Math.PI) / 2);
        ctx.beginPath();
        ctx.moveTo(0, -R*0.90);
        ctx.lineTo( R*0.14, -R*0.70);
        ctx.lineTo(-R*0.14, -R*0.70);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

    } else if(template === 'CT-05'){
      // HORNET - listras radiais tipo abelha
      // 8 cunhas alternando dark/transparente
      var slices = 8;
      for(var s=0; s<slices; s++){
        if(s % 2 !== 0) continue;
        var a0 = (s    /slices)*Math.PI*2 - Math.PI/2;
        var a1 = ((s+1)/slices)*Math.PI*2 - Math.PI/2;
        ctx.fillStyle = dark;
        ctx.beginPath();
        ctx.moveTo(0,0);
        ctx.arc(0, 0, R*0.92, a0, a1);
        ctx.closePath();
        ctx.fill();
      }
      // anel claro fino externo
      ctx.lineWidth   = 1.2;
      ctx.strokeStyle = light;
      ctx.beginPath();
      ctx.arc(0, 0, R*0.88, 0, Math.PI*2);
      ctx.stroke();

    } else {
      // CT-06 CLASSIC - padrao neutro de raias finas (default)
      ctx.lineWidth   = 0.8;
      ctx.strokeStyle = shadeColor(color, -30);
      var rays = 12;
      for(var r=0; r<rays; r++){
        var ang = (r/rays)*Math.PI*2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang)*R*0.30, Math.sin(ang)*R*0.30);
        ctx.lineTo(Math.cos(ang)*R*0.85, Math.sin(ang)*R*0.85);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  // Desenha uma tampinha realista (coroa de garrafa)
  // color = cor principal, pilotKanji = kanji no centro
  // template = identificador visual ('CT-01' a 'CT-06'), default 'CT-06' (classico)
  function drawCap(ctx, x, y, radius, color, accentColor, kanji, rotation, speed, glowAlpha, isActive, template){
    template = template || 'CT-06';
    if(isActive){
  var auraPulse = 0.7 + Math.sin(Date.now()*0.01)*0.3;

  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.25 * auraPulse;
  ctx.fillStyle = color;

  ctx.beginPath();
  ctx.arc(0,0,radius*2.2,0,Math.PI*2);
  ctx.fill();

  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 2;
  ctx.strokeStyle = accentColor;

  ctx.beginPath();
  ctx.arc(0,0,radius*1.6,0,Math.PI*2);
  ctx.stroke();

  ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Glow de velocidade
    if(speed > 80){
      ctx.shadowColor  = color;
      ctx.shadowBlur   = 10 + glowAlpha * 14;
    }

    // ── Corpo da tampinha (disco metalico) ──
    // Sombra projetada
    ctx.fillStyle='rgba(0,0,0,.35)';
    ctx.beginPath();
    ctx.ellipse(3,4,radius,radius*.4,0,0,Math.PI*2);
    ctx.fill();

    // Aba ondulada da coroa (fundo mais escuro)
    var crownColor = shadeColor(color, -35);
    ctx.fillStyle = crownColor;
    ctx.beginPath();
    var n = 21; // dentes da coroa
    for(var i=0;i<n*2;i++){
      var ang = (i/n)*Math.PI;
      var r2  = i%2===0 ? radius : radius*.84;
      if(i===0) ctx.moveTo(Math.cos(ang)*r2, Math.sin(ang)*r2);
      else ctx.lineTo(Math.cos(ang)*r2, Math.sin(ang)*r2);
    }
    ctx.closePath();
    ctx.fill();

    // Disco principal (face da tampinha)
    var grad = ctx.createRadialGradient(-radius*.25,-radius*.25, radius*.05, 0,0, radius*.95);
    grad.addColorStop(0, lightenColor(color, 60));
    grad.addColorStop(0.4, color);
    grad.addColorStop(0.85, shadeColor(color,-20));
    grad.addColorStop(1, shadeColor(color,-40));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0,0,radius*.82,0,Math.PI*2);
    ctx.fill();

    // Anel metalico interno (borda impressa)
    ctx.strokeStyle = shadeColor(color,-25);
    ctx.lineWidth   = 1.8;
    ctx.beginPath();
    ctx.arc(0,0,radius*.72,0,Math.PI*2);
    ctx.stroke();

    // Area central (impressao)
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath();
    ctx.arc(0,0,radius*.60,0,Math.PI*2);
    ctx.fill();

    // Reflexo (brilho metalico)
    var refGrad = ctx.createRadialGradient(-radius*.3,-radius*.32,1,-radius*.2,-radius*.2,radius*.45);
    refGrad.addColorStop(0,'rgba(255,255,255,.55)');
    refGrad.addColorStop(0.5,'rgba(255,255,255,.12)');
    refGrad.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = refGrad;
    ctx.beginPath();
    ctx.arc(0,0,radius*.82,0,Math.PI*2);
    ctx.fill();

    // ── Overlay do template (formato/estilo da tampinha) ──
    // Desenhado dentro do contexto rotacionado, gira junto com a tampinha
    _drawTemplate(ctx, radius, template, color, accentColor);

    // Kanji do piloto (nao rotaciona com a tampinha)
    ctx.rotate(-rotation);
    ctx.fillStyle   = '#FFF';
    ctx.font        = 'bold '+(radius*.55)+'px sans-serif';
    ctx.textAlign   = 'center';
    ctx.textBaseline= 'middle';
    ctx.shadowBlur  = 0;
    ctx.fillText(kanji || '?', 0, 1);

    ctx.restore();
  }

  // Rastro / efeito dash de velocidade
  function drawTrail(ctx, trail, color, speed){
    if(!trail || trail.length<2) return;
    // Dash lines (linhas de velocidade)
    if(speed > 120){
      var dashCount = Math.min(5, Math.floor(speed/120));
      for(var d=0;d<dashCount;d++){
        var idx1 = Math.max(0, trail.length-2-d*2);
        var idx2 = Math.max(0, trail.length-4-d*2);
        if(idx1===idx2) break;
        var pt1=trail[idx1], pt2=trail[idx2];
        var dx=pt2.x-pt1.x, dy=pt2.y-pt1.y;
        var len=Math.sqrt(dx*dx+dy*dy);
        if(len<2) break;
        // perp offset para linhas de dash
        var px=-dy/len*3, py=dx/len*3;
        ctx.save();
        ctx.globalAlpha=(0.5-d*.08)*Math.min(1,speed/300);
        ctx.strokeStyle=color;
        ctx.lineWidth=1.5-d*.2;
        ctx.beginPath();
        ctx.moveTo(pt1.x+px,pt1.y+py);
        ctx.lineTo(pt2.x+px,pt2.y+py);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pt1.x-px,pt1.y-py);
        ctx.lineTo(pt2.x-px,pt2.y-py);
        ctx.stroke();
        ctx.restore();
      }
    }
    // Trilha de desvanecimento
    for(var i=0;i<trail.length-1;i++){
      var t=trail[i];
      var a=(i/trail.length)*0.28;
      ctx.save();
      ctx.globalAlpha=a;
      ctx.beginPath();
      ctx.arc(t.x,t.y,11*(i/trail.length)+1,0,Math.PI*2);
      ctx.fillStyle=color;
      ctx.fill();
      ctx.restore();
    }
  }

  // Helpers de cor
  function shadeColor(hex, pct){
    var n=parseInt(hex.replace('#',''),16);
    var r=Math.max(0,Math.min(255,((n>>16)&0xFF)+pct));
    var g=Math.max(0,Math.min(255,((n>>8)&0xFF)+pct));
    var b=Math.max(0,Math.min(255,(n&0xFF)+pct));
    return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
  }
  function lightenColor(hex,pct){ return shadeColor(hex,pct); }

  // 🌊 ripple simples (usar na render da água)
  function drawWaterFX(ctx, x, y, radius, time){
    ctx.save();

    ctx.globalAlpha = 0.15;

    for(let i=0;i<3;i++){
      let r = radius + Math.sin(time*2 + i)*5 + i*6;

      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI*2);
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawGrassFX(ctx, x, y, radius, time){
  ctx.save();

  ctx.globalAlpha = 0.2;

  for(let i=0;i<6;i++){
    let angle = (i/6)*Math.PI*2 + time;
    let dx = Math.cos(angle)*radius*0.6;
    let dy = Math.sin(angle)*radius*0.6;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x+dx, y+dy);
    ctx.strokeStyle = "rgba(0,255,100,0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.restore();
}

  return { drawCap:drawCap, drawTrail:drawTrail, drawWaterFX:drawWaterFX, drawGrassFX:drawGrassFX };
})();
