# -*- coding: utf-8 -*-
"""
builder_v04b_run.py  --  CapRush Overdrive! v0.4b
Runner principal: executa todos os builders em sequencia
Execute na RAIZ do projeto: python builder_v04b_run.py
"""
import os, sys, subprocess

if hasattr(sys.stdout,'reconfigure'):
    try: sys.stdout.reconfigure(encoding='utf-8',errors='replace')
    except: pass

ROOT = os.path.dirname(os.path.abspath(__file__))
PY   = sys.executable

builders = [
    'build_v04b_p1.py',   # index.html + i18n.js + personagens.html
    'build_v04b_p2.py',   # SoundEngine.js + TrackV3.js
    'build_v04b_p3.py',   # game.html + game-multi-local.html + manual + arquitetura + README
]

print("\n" + "="*60)
print("  CapRush Overdrive! v0.4b  --  Runner Principal")
print("  ROOT: " + ROOT)
print("="*60 + "\n")

ok = True
for b in builders:
    bp = os.path.join(ROOT, b)
    if not os.path.exists(bp):
        print(f"  [X]  {b} NAO ENCONTRADO! Coloque os builders na raiz do projeto.")
        ok = False
        continue
    print(f"\n--- {b} ---")
    r = subprocess.run([PY, bp], cwd=ROOT, capture_output=False)
    if r.returncode != 0:
        print(f"  [X]  {b} FALHOU (returncode={r.returncode})")
        ok = False

print("\n" + "="*60)
if ok:
    print("  [OK] TODOS OS BUILDERS CONCLUIDOS COM SUCESSO!")
    print("\n  Arquivos gerados (caminhos absolutos impressos acima).")
    print("  Reinicie o servidor local para ver as mudancas:")
    print("    python -m http.server 8080")
    print("    -> http://localhost:8080/index.html")
else:
    print("  [!]  ALGUNS BUILDERS FALHARAM. Verifique os erros acima.")
print("="*60 + "\n")
