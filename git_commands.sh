#!/bin/bash
# CapRush – Comandos Git para Fase 1 Complete
# ─────────────────────────────────────────────────────
# Execute na RAIZ do repositório:
#   bash git_commands.sh
# ─────────────────────────────────────────────────────

set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  CapRush – Git Push Fase 1 Complete      ║"
echo "╚══════════════════════════════════════════╝"
echo ""

git add client/caprush-game-v2.html
git add server/ws-server.js
git add docs/ONLINE_GUIDE.md
git add docs/USER_MANUAL.md
git add builder_phase1_complete.py
git add git_commands.sh

git commit -m "feat(phase1-complete): i18n PT/EN/ES + IP detection + fisica + visuais

- Internacionalização completa (PT-BR, EN-US, ES-LA) em todo o jogo
- ws-server.js agora detecta IPs locais e expõe endpoint /info
- Jogo detecta IP automaticamente e exibe banner com link para copiar
- Física de ricochete restaurada (reflexão vetorial, e=0.65)
- Água com forma orgânica (blob) + atrito pesado (retain=0.30/s)
- Grama com textura listrada + deslizamento (retain=0.97/s)
- Arquibancada com torcida animada + bounce forte (e=0.70)
- Paddock com garagens + skip de turno em 1v1/online
- Colisão elástica entre tampinhas (e=0.75)
- Painel lateral sempre visível: Força, Piloto, Pista, Eventos
- Arte dos 4 personagens: Yuki, Kenta, Bruna(laço♀), Tapz(asas+halo+laço♀)
- Documentação atualizada: ONLINE_GUIDE.md, USER_MANUAL.md"

git push origin main

echo ""
echo "✅ Push concluído com sucesso!"
echo ""
echo "🌐 Verifique em: https://marcelom-silva.github.io/caprush"
echo "🎮 Jogo:         client/caprush-game-v2.html"
echo ""
