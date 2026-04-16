import os

ROOT = os.path.dirname(os.path.abspath(__file__))

PHYSICS_FACTORY = """function makePhysics(){
  var BASE_DRAG=1.8,MAX_PX=165,MAX_SPD=620,REST=0.72,MIN=6;
  var DRAG_MULT={asfalto:1.0,agua:1.95,grama:0.42};
  var s={pos:new Vector2D(0,0),vel:new Vector2D(0,0),moving:false,surf:'asfalto'};
  return {
    reset:function(x,y,sf){s.pos=new Vector2D(x,y);s.vel=new Vector2D(0,0);s.moving=false;s.surf=sf||'asfalto';},
    setSurface:function(sf){s.surf=sf||'asfalto';},
    setVel:function(vx,vy){s.vel=new Vector2D(vx,vy);s.moving=s.vel.magnitude()>MIN;},
    flick:function(from,to,mult){
      var d=from.sub(to),len=Math.min(d.magnitude(),MAX_PX),t=len/MAX_PX;
      s.vel=d.normalize().scale(t*MAX_SPD*(mult||1));s.moving=true;
      var pct=Math.round(t*100);
      var fv=document.getElementById('force-value'); if(fv) fv.textContent=pct+'%';
      var fb=document.getElementById('force-bar-fill'); if(fb) fb.style.height=pct+'%';
      return{forcePct:pct};
    },
    bounce:function(nx,ny,r){r=r||REST;var d=s.vel.x*nx+s.vel.y*ny;if(d>=0)return;s.vel.x=(s.vel.x-2*d*nx)*r;s.vel.y=(s.vel.y-2*d*ny)*r;s.moving=s.vel.magnitude()>MIN;},
    step:function(dt,b){
      if(!s.moving) return this.snap();
      var dc=BASE_DRAG*(DRAG_MULT[s.surf]||1),spd=s.vel.magnitude();
      var ns=Math.max(0,spd-dc*spd*dt);
      if(ns<MIN){s.vel=new Vector2D(0,0);s.moving=false;return this.snap();}
      s.vel=s.vel.normalize().scale(ns);s.pos=s.pos.add(s.vel.scale(dt));
      if(s.moving && typeof SoundEngine!=='undefined') SoundEngine.drag(s.surf, ns);
      var r=14;
      if(s.pos.x-r<b.x){s.pos.x=b.x+r;s.vel.x=Math.abs(s.vel.x)*REST;}
      if(s.pos.x+r>b.x+b.w){s.pos.x=b.x+b.w-r;s.vel.x=-Math.abs(s.vel.x)*REST;}
      if(s.pos.y-r<b.y){s.pos.y=b.y+r;s.vel.y=Math.abs(s.vel.y)*REST;}
      if(s.pos.y+r>b.y+b.h){s.pos.y=b.y+b.h-r;s.vel.y=-Math.abs(s.vel.y)*REST;}
      return this.snap();
    },
    snap:function(){return{pos:s.pos.clone(),vel:s.vel.clone(),speed:s.vel.magnitude(),moving:s.moving};},
    get pos(){return s.pos.clone();},
    get vel(){return s.vel.clone();},
    MAX_PX:MAX_PX
  };
}"""


def patch_local():
    p = os.path.join(ROOT, 'client/game-multi-local.html')
    s = open(p, 'r', encoding='utf-8').read()

    # 1) substitui makePhysics inteiro
    start = s.find('function makePhysics(){')
    end = s.find('}\nfunction cloneCPs', start) + 1
    s = s[:start] + PHYSICS_FACTORY + s[end:]

    # 2) troca tratamento de obstáculo (reset+flick -> bounce)
    s = s.replace(
        "var obs=TrackV3.checkObstacles(ph.pos,CAP_R);\n if(obs){\n var dot=ph.vel.x*obs.nx+ph.vel.y*obs.ny;\n var nvx=(ph.vel.x-2*dot*obs.nx)*.78, nvy=(ph.vel.y-2*dot*obs.ny)*.78;\n p.phys.reset(ph.pos.x,ph.pos.y,'asfalto');\n var tf=new Vector2D(ph.pos.x-nvx*.05,ph.pos.y-nvy*.05);\n var tt=new Vector2D(ph.pos.x+nvx*.05,ph.pos.y+nvy*.05);\n p.phys.flick(tf,tt,1); SoundEngine.hit(); ph=p.phys.snap();\n }",
        "var obs=TrackV3.checkObstacles(ph.pos,CAP_R);\n if(obs){ p.phys.bounce(obs.nx, obs.ny); SoundEngine.hit(); ph=p.phys.snap(); }"
    )

    # 3) faz loop andar as duas tampinhas e colidir
    s = s.replace(
        "if(phase==='MOVING'){\n var p=P[cur];\n var ph=p.phys.step(dt,bnd());",
        "if(phase==='MOVING'){\n P[0].phys.step(dt,bnd()); P[1].phys.step(dt,bnd());\n var p=P[cur];\n var ph=p.phys.snap();"
    )

    # 4) injeta colisão
    if 'COLISÃO TAMPINHA' not in s:
        s = s.replace(
            "if(TrackV3.detectPuddle(ph.pos)){ p.phys.setSurface('agua');",
            """// colisão tampinha vs tampinha
    var a=P[0], b=P[1], pa=a.phys.snap(), pb=b.phys.snap();
    var dx=pb.pos.x-pa.pos.x, dy=pb.pos.y-pa.pos.y, d=Math.hypot(dx,dy);
    if(d<28 && d>0.1){
      var nx=dx/d, ny=dy/d, rvx=pb.vel.x-pa.vel.x, rvy=pb.vel.y-pa.vel.y, va=rvx*nx+rvy*ny;
      if(va<0){ var j=-(1+0.72)*va/2; a.phys.setVel(pa.vel.x-j*nx, pa.vel.y-j*ny); b.phys.setVel(pb.vel.x+j*nx, pb.vel.y+j*ny); SoundEngine.hit(); }
    }
    if(TrackV3.detectPuddle(ph.pos)){ p.phys.setSurface('agua');"""
        )

    open(p, 'w', encoding='utf-8').write(s)
    print('✓ local unificado com SOLO')


def patch_online():
    p = os.path.join(ROOT, 'client/game-multi-online.html')
    s = open(p, 'r', encoding='utf-8').read()

    # substitui makePhysics (online tem versão diferente)
    start = s.find('function makePhysics(){')
    end = s.find('}\nfunction cloneCPs', start)
    if end == -1:
        end = s.find('}\nvar P=null', start)
    s = s[:start] + PHYSICS_FACTORY + s[end:]

    # garante drag no step (já está no factory)

    # colisão
    if 'COLISÃO ONLINE' not in s:
        s = s.replace(
            "P.forEach(function(p){\n if(p.finished)return;\n var ph=p.phys.step(dt,bnd());",
            """P.forEach(function(p){ if(p.finished)return; p.phys.step(dt,bnd()); });
  // COLISÃO ONLINE
  if(P.length===2){ var a=P[0],b=P[1],pa=a.phys.snap(),pb=b.phys.snap(),dx=pb.pos.x-pa.pos.x,dy=pb.pos.y-pa.pos.y,d=Math.hypot(dx,dy); if(d<28&&d>0.1){ var nx=dx/d,ny=dy/d,rvx=pb.vel.x-pa.vel.x,rvy=pb.vel.y-pa.vel.y,va=rvx*nx+rvy*ny; if(va<0){ var j=-(1+0.72)*va/2; a.phys.setVel(pa.vel.x-j*nx,pa.vel.y-j*ny); b.phys.setVel(pb.vel.x+j*nx,pb.vel.y+j*ny); SoundEngine.hit(); } } }
  P.forEach(function(p){ if(p.finished)return; var ph=p.phys.snap();"""
        )

    open(p, 'w', encoding='utf-8').write(s)
    print('✓ online unificado com SOLO')


patch_local()
patch_online()
print('\nFeito. Agora os 3 modos usam a mesma física.')
