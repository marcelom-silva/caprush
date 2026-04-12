# CapRush – Arquitetura (Fase 1)

## Stack

| Camada      | Tecnologia          | Pasta      |
|-------------|---------------------|------------|
| Frontend    | Phaser.js 3.60      | client/    |
| Backend     | Python + SQLite     | server/    |
| Blockchain  | Rust + Anchor (Fogo)| anchor/    |
| Assets      | PNG/WAV/OGG         | assets/    |

## Separação Lógica × Renderização

```
client/src/
├── config/      ← constantes globais (sem Phaser)
├── core/        ← Physics.js, InputManager.js  (sem Phaser)
├── entities/    ← Character.js, Yuki.js, CapCoin.js
├── scenes/      ← MenuScene, LobbyScene, GameScene, ResultScene
└── ui/          ← AimRenderer.js, HUD.js
```

## Física

- Lançamento vetorial com `power × BASE_LAUNCH_SPEED`
- Arrasto por segundo: `retain = DRAG_RETAIN × surface × friction_resistance`
- Posição atualizada frame a frame com `Δt` real
- Preview de trajetória calculado em `CapBody.previewTrajectory()`

## Personagens (Fase 1 — Yuki)

| Stat               | Yuki  | Kenta | Bruna | Tapz  |
|--------------------|-------|-------|-------|-------|
| power              | 1.4   | 0.8   | 1.0   | 0.7   |
| precision          | 0.6   | 1.4   | 1.0   | 1.2   |
| friction_resistance| 0.9   | 1.0   | 1.1   | 1.3   |
| Especial           | Boost | Long  | Terra | Curva |

## Roadmap de Fases

- [x] Fase 1 — Protótipo: física + Yuki + pista de teste
- [ ] Fase 2 — SQLite schema + Anchor smart contracts
- [ ] Fase 3 — Auth híbrido (Google + TipLink + Phantom)
- [ ] Fase 4 — Arte anime dos 4 personagens + efeitos visuais
- [ ] Fase 5 — Marketplace Metaplex + crafting NFT
- [ ] Fase 6 — Multiplayer (até 4 jogadores)
- [ ] Fase 7 — Dashboard + relatórios PDF/CSV
