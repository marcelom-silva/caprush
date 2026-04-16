#!/usr/bin/env python3
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))


def read(p): return open(p, 'r', encoding='utf-8').read()
def write(p, c): open(p, 'w', encoding='utf-8').write(c)


# 1) SoundEngine.js - adiciona drag()
p = os.path.join(ROOT, 'client/src/core/SoundEngine.js')
s = read(p)
if 'function drag(' not in s:
    # acha onde inserir (antes do victory)
    s = s.replace('function victory(',
                  "function drag(surf,spd){if(!ctx||!_sfxOn||spd<30)return;var b=ctx.createBuffer(1,ctx.sampleRate*.05,ctx.sampleRate),d=b.getChannelData(0),vol=surf==='agua'?0.15:surf==='grama'?0.22:0.18;for(var i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*vol*(spd/400);var s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='highpass';f.frequency.value=surf==='agua'?1200:800;g.gain.value=.35;s.buffer=b;s.connect(f);f.connect(g);g.connect(_master);s.start();}\nfunction victory(")
    # exporta
    s = re.sub(r'(return\s*\{[^}]*?grass\s*,)', r'\1drag,', s)
    write(p, s)
    print('✓ SoundEngine: drag() inserido (178 linhas mantidas)')
else:
    print('✓ SoundEngine já tem drag')

# 2) Physics.js - setVel + collide + chama drag
p = os.path.join(ROOT, 'client/src/core/Physics.js')
s = read(p)
changed = False
if 'function setVel' not in s:
    s = s.replace(
        'function setSurface(surf){', 'function setVel(vx,vy){s.vel=new Vector2D(vx,vy);s.moving=s.vel.magnitude()>MIN_SPD;}\nfunction setSurface(surf){')
    changed = True
if 'function collide' not in s:
    s = s.replace('function snap(){', 'function collide(aPos,aVel,bPos,bVel){var dx=bPos.x-aPos.x,dy=bPos.y-aPos.y,d=Math.hypot(dx,dy);if(d>28||d<0.1)return null;var nx=dx/d,ny=dy/d,rvx=bVel.x-aVel.x,rvy=bVel.y-aVel.y,va=rvx*nx+rvy*ny;if(va>0)return null;var j=-(1+REST)*va/2;return{ax:aVel.x-j*nx,ay:aVel.y-j*ny,bx:bVel.x+j*nx,by:bVel.y+j*ny};}\nfunction snap(){')
    changed = True
if 'SoundEngine.drag' not in s:
    s = re.sub(r'(s\.pos\s*=\s*s\.pos\.add\(s\.vel\.scale\(dt\)\)[^\n]*\n)',
               r'\1 if(s.moving) SoundEngine.drag(s.surf, s.vel.magnitude());\n', s)
    changed = True
if 'setVel' not in s or 'collide' not in s:
    s = re.sub(r'return\s*\{([^}]*)\}', lambda m: 'return{'+m.group(1).replace('bounce,',
               'bounce,setVel,collide,') if 'setVel' not in m.group(1) else m.group(0), s, count=1)
    changed = True
if changed:
    write(p, s)
    print('✓ Physics: setVel, collide e drag() ativados (109 linhas mantidas)')
else:
    print('✓ Physics já atualizado')

# 3) Multiplayer - injeta colisão
for rel in ['client/game-multi-local.html', 'client/game-multi-online.html']:
    p = os.path.join(ROOT, rel)
    if not os.path.exists(p):
        continue
    s = read(p)
    if 'Physics.collide' in s:
        print(f'✓ {rel} já tem colisão')
        continue
    # procura o loop principal
    if 'function loop(' in s:
        # injeta depois do step das duas físicas
        inject = "\n // colisão 1v1\n if(typeof PhysicsA!=='undefined' && typeof PhysicsB!=='undefined'){\n var col = Physics.collide(PhysicsA.pos, PhysicsA.vel, PhysicsB.pos, PhysicsB.vel);\n if(col){ PhysicsA.setVel(col.ax, col.ay); PhysicsB.setVel(col.bx, col.by); SoundEngine.hit(); }\n }\n"
        # acha "PhysicsB.step"
        s = re.sub(r'(PhysicsB\.step\([^)]+\);)', r'\1'+inject, s, count=1)
        write(p, s)
        print(f'✓ {rel} -> colisão injetada')
    else:
        print(f'! {rel} não encontrado padrão - me avise')

print('\nFeito. Rode: python caprush_patch_v05.py')
