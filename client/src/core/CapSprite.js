// CapSprite.js - Tampinhas de garrafa (coroa metalica) + Pilotos anime
var CapSprite = (function(){

  // Desenha uma tampinha realista (coroa de garrafa)
  // color = cor principal, pilotKanji = kanji no centro
  function drawCap(ctx, x, y, radius, color, accentColor, kanji, rotation, speed, glowAlpha, isActive){
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
