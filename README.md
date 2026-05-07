# CapRush — Overdrive! v0.11.2

Jogo de corrida de tampinhas (bottle caps) · Solo vs IA · 1v1 Local · 1v1 Online
Canvas 2D · **Privy OAuth** · **Token $CR off-chain** · **Evolução RPG** · **Clãs** · **11 Pilotos NFT** · **Garagem 4 Tampinhas PNG** · **Daily Login** · **Badges**

## Marcos Concluídos
- ✅ Marco 1 — Motor $CR off-chain
- ✅ Marco 2 — Privy Wallet Solana (OAuth PKCE → DID)
- ✅ Marco 2.5 — Evolução de Pilotos + Apostas 1v1
- ✅ Marco 2.7 — Sistema de Clãs
- ✅ Marco 2.8 — TrackV3 visual top-down + obstáculos novos
- ✅ Marco 2.9 — 11 Pilotos NFT, Garagem inicial, Daily Login 30 dias, 6 Badges
- ✅ Marco 2.9.1 — Refactor de organização (raiz limpa, src/ modular)
- ✅ Marco 2.9.2 — Garagem reformulada (4 tampinhas PNG fixas), fluxo JOGAR
                  inteligente, IA Racer-D mais robusta, Monza overhaul (canhões
                  funcionais, buracos visíveis, chicanes nas bordas, heliponto,
                  CPs menores), som de derrapagem por tampinha
- ✅ **Marco 6 Fase A** — Lances simultâneos encriptados (commit-reveal SHA-256 + árbitro Supabase)
                  no modo 1v1 Online. Candidatura ao RTG Hidden-Information Games da Arcium.

## Estrutura do Repositório

```
caprush/                          ← raiz limpa
├── index.html                    ← landing pública
├── dashboard.html                ← home logada
├── README.md / README_ROADMAP.md / CLAUDE.md
├── package.json / package-lock.json / vercel.json / favicon.ico
├── marco29.sql                   ← migração Supabase referência
│
├── pages/                        ← todas as outras páginas
│   ├── personagens.html
│   ├── garagem.html
│   ├── manual.html
│   ├── ranking.html
│   ├── clans.html
│   ├── arquitetura.html
│   ├── caprush-brand.html
│   ├── erros.html
│   └── game/
│       ├── caprush-game.html     ← Solo vs Racer-D
│       ├── game-multi.html       ← menu multiplayer
│       ├── game-multi-local.html
│       └── game-multi-online.html
│
├── src/                          ← todo JS modular
│   ├── auth/privy-auth.js
│   ├── core/Vector2D.js · Physics.js · SoundEngine.js · CapSprite.js · GameLoop.js
│   ├── entities/PilotRenderer.js (era Yuki.js) · Kenta.js · RacerX.js
│   ├── scenes/TrackV3.js · TrackMonza.js
│   ├── engines/cr-engine.js · pilot-evolution.js · missions.js · clan-engine.js
│   │            garage-engine.js · daily-streak.js · badges-engine.js · pilots-data.js
│   └── ui/audio.js · background.js · i18n.js · pregame-anim.js
│
├── assets/images/
│   ├── pilots/    (12 PNGs)
│   └── ui/        (tokenCR · tampinha-asa · Whisk_2_transparent)
│
├── docs/          (documentação)
├── game/          (audio assets — caminho absoluto preservado)
├── server/        (servidor Python — uso opcional)
└── anchor/        (Solana protótipo Marco 4)
```

## Pilotos (Marco 2.9)

| Piloto       | Raridade  | Custo     | Vel | Ctrl | Aero | Status        |
|--------------|-----------|----------:|----:|-----:|-----:|---------------|
| CAL          | Comum     |        0  |  80 |   82 |   78 | ✅ default    |
| JOÃO         | Comum     |        0  |  78 |   78 |   84 | ✅ default    |
| SHERLOCK     | Comum     |        0  |  78 |   84 |   78 | ✅ default    |
| PLUSH        | Incomum   |      400  |  82 |   86 |   84 | 🔒 desbloq.   |
| URUBU MENGÃO | Incomum   |      400  |  84 |   82 |   86 | 🔒 desbloq.   |
| DUO          | Rara      |    1.200  |  88 |   88 |   88 | 🔒 desbloq.   |
| BITKONG      | Rara      |    2.000  |  90 |   86 |   88 | 🔒 desbloq.   |
| BRUNA        | Mítica    |    3.500  |  90 |   94 |   92 | 🔒 desbloq.   |
| KENTA        | Mítica    |    3.500  |  94 |   90 |   92 | 🔒 desbloq.   |
| YUKI         | Mítica    |    3.500  |  92 |   94 |   90 | 🔒 desbloq.   |
| TAPZ         | Lendária  |    5.500  |  97 |   95 |   96 | 🔒 desbloq.   |
| RACER-D      | Boss      |        —  |  99 |   99 |   99 | IA não joga.  |

## Garagem (Marco 2.9.2)

**4 tampinhas PNG fixas, cada uma com cor própria, perfil estatístico decorativo e timbre sonoro próprio.** Substitui o sistema antigo de 6 templates × 8 cores.

| Código | Nome         | Cor        | Perfil                | Vel | Acel | Ctrl | Aderência |
|--------|--------------|------------|-----------------------|----:|-----:|-----:|----------:|
| CR-01  | AETHERION    | `#E62A2A`  | Velocidade extrema    |  90 |   88 |   60 |        55 |
| CR-02  | SOLARA       | `#1E90FF`  | Estabilidade total    |  70 |   65 |   88 |        90 |
| CR-03  | VERDANTCORE  | `#3DB838`  | Equilíbrio perfeito   |  78 |   78 |   78 |        78 |
| CR-04  | NOVAFLUX     | `#9D4EDD`  | Manobras radicais     |  82 |   90 |   75 |        70 |

Stats são **decorativos** neste marco — afetarão física no Marco 4 (Oficina). PNGs ficam em `assets/images/caps/{aetherion,solara,verdantcore,novaflux}.png` e aparecem em vitrines (Garagem, Dashboard, cards laterais). **Na pista a renderização continua vetorial**, usando a cor da tampinha selecionada (rastro, dash e glow seguem a cor automaticamente).

**Som de derrapagem por tampinha** — cada modelo tem perfil sônico único:
- AETHERION → bandpass 1800Hz, metálico agressivo
- SOLARA → lowpass 600Hz, grave abafado
- VERDANTCORE → highpass 800Hz, neutro
- NOVAFLUX → bandpass 2400Hz Q=5, sintético/buzz

**Custos:** 1ª aplicação grátis · trocas posteriores 200 $CR.

## Fluxo de Início (Marco 2.9.2)

O botão JOGAR no menu detecta o estado da seleção e roteia automaticamente:
1. Sem piloto selecionado → vai pra `pages/personagens.html`
2. Piloto OK mas tampinha não aplicada → vai pra `pages/garagem.html`
3. Tudo OK → abre o último modo escolhido (`caprush_lastmode` em localStorage; default Solo)

> **OFICINA** (botão bloqueado no index) — futuro Marco 4: upgrades **funcionais** da tampinha (peso, aderência, aero) que afetam física. Diferente da Garagem, que é só visual.

## Daily Login

720 $CR/mês total. Streak quebra após 36h. Marcos: dia 7 (50), dia 14 (75), dia 21 (100), dia 30 (200 + Badge DEDICADO + 1 troca grátis).

## Badges

DEDICADO 🔥 (30 dias) · BOSS_SLAYER 👑 (vencer Hard Solo) · FIRST_BLOOD ⚔️ (1ª PVP) · GARAGE_RAT 🔧 (1ª customização) · SPEED_DEMON ⚡ (50 wins Solo) · CLAN_FOUNDER 🏰 (fundar clã).

## Stack v0.11

| Camada      | Tecnologia                                                        |
|-------------|-------------------------------------------------------------------|
| Frontend    | HTML5 Canvas 2D + Vanilla JS (zero framework)                    |
| Física      | Motor próprio + setMults() (aero/ctrl dinâmico)                  |
| Áudio       | Web Audio API 148 BPM + 3x OGG                                    |
| Login       | Privy OAuth (Google → PKCE → DID Solana)                          |
| Token $CR   | cr-engine.js off-chain → on-chain no Marco 3                      |
| Multiplayer | PeerJS WebRTC P2P + **Arcium Commit-Reveal** (lances encriptados no 1v1 Online)                                                 |
| i18n        | PT / EN / ES (600+ chaves)                                        |
| Deploy      | Vercel CDN                                                        |

## Banco de Dados (Supabase)

```
runs · cr_ledger · cr_transactions · achievements_unlocked
pilot_evolution · missions_completed · bet_matches
clans · clan_members · clan_invites · clan_activity
user_pilots_owned · cap_customization · daily_streak · badges_earned
**mpc_rounds** · hash_a · hash_b · lance revelado · árbitro Arcium Fase A
```

## Como Rodar Localmente

```bash
python -m http.server 8080
# http://localhost:8080/
```

## Deploy

```
https://caprush.vercel.app
https://github.com/marcelom-silva/caprush
```
