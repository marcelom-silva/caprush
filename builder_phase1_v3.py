#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace") if hasattr(sys.stdout, "reconfigure") else None
# -*- coding: utf-8 -*-
"""
╔══════════════════════════════════════════════════════════════╗
║         CapRush — Overdrive! v0.3  —  Builder Principal      ║
║                                                              ║
║  Execute este arquivo na raiz do repositório:                ║
║    C:\\Users\\User\\Cryptos\\projects\\caprush\\                   ║
║                                                              ║
║  Uso:  python builder_phase1_v3.py                           ║
╚══════════════════════════════════════════════════════════════╝
"""
import os, sys, subprocess, time

ROOT = os.path.dirname(os.path.abspath(__file__))
PARTS = ['build_v03_part1.py', 'build_v03_part2.py', 'build_v03_part3.py']

# Verificação de dependências
missing = [p for p in PARTS if not os.path.isfile(os.path.join(ROOT, p))]
if missing:
    print('\n[X]  Arquivos de parte faltando:')
    for m in missing:
        print('     ' + m)
    print('\n  Certifique-se de que todos os 4 scripts .py estao na raiz do projeto.')
    sys.exit(1)

print('\n[CAPRUSH]  CapRush v0.3 — Aplicando todas as alteracoes...\n')
print('  Raiz do projeto: ' + ROOT)
print()

total_ok = []
errors   = []

for part in PARTS:
    part_path = os.path.join(ROOT, part)
    print(f'>>  Executando {part}...')
    t0 = time.time()
    try:
        result = subprocess.run(
            [sys.executable, part_path],
            capture_output=True, text=True, cwd=ROOT
        )
        elapsed = time.time() - t0
        if result.returncode == 0:
            # Conta checkmarks
            oks = result.stdout.count('[OK]')
            total_ok.append((part, oks))
            print(result.stdout.rstrip())
            print(f'   ({oks} arquivo(s) em {elapsed:.1f}s)\n')
        else:
            errors.append((part, result.stderr or result.stdout))
            print(f'  [X]  Erro em {part}:\n{result.stderr or result.stdout}\n')
    except Exception as e:
        errors.append((part, str(e)))
        print(f'  [X]  Excecao em {part}: {e}\n')

# ── Resumo final ─────────────────────────────────────────────
print('═' * 54)
print('  RESUMO v0.3')
print('═' * 54)
total_files = sum(n for _,n in total_ok)
print(f'  Partes executadas: {len(total_ok)}/{len(PARTS)}')
print(f'  Arquivos gerados:  {total_files}')
if errors:
    print(f'  Erros:            {len(errors)}')
    for name, msg in errors:
        print(f'    - {name}')
print()

if not errors:
    print('  [OK]  Tudo aplicado com sucesso!')
    print()
    print('  Proximos passos:')
    print('  1. Verifique que Whisk_2.png esta na raiz do projeto')
    print('  2. Abra index.html no navegador para testar o logo + bandeiras')
    print('  3. Teste o modo Solo (caprush-game.html) — fisica corrigida')
    print('  4. Teste 1v1 Local (client/game-multi-local.html) — painel + cap\xd7cap')
    print('  5. Para multiplayer online: cd server && node ws-server.js')
    print()
    print('  git add -A && git commit -m "v0.3: physics fix, stands, paddock, i18n, SVGs manga"')
else:
    print('  [!]  Algumas partes falharam. Verifique os erros acima.')
print()
print('═' * 54 + '\n')
