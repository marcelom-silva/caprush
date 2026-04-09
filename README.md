# CapRush – Overdrive! 🏁

> Corrida de tampinhas com física estilo Angry Birds, traço anime cinematográfico e economia blockchain na Fogo SVM.

**Site:** [marcelom-silva.github.io/caprush](https://marcelom-silva.github.io/caprush)

---

## O Jogo

CapRush é um jogo de corrida de tampinhas inspirado em Screamer (PlayStation) onde cada jogada usa um sistema de força + direção estilo Angry Birds + sinuca. Tampinhas são NFTs funcionais com atributos reais que afetam a corrida.

**Modos de jogo:** Solo · 1v1 · 1v1v1 · 2v2  
**Blockchain:** Fogo SVM (compatível com Solana)  
**Token:** $CapRush ($CR)  
**Marketplace:** Metaplex

---

## Estrutura do Repositório

```
caprush/
├── index.html            ← Landing page principal
├── caprush-game.html     ← Protótipo jogável (Phaser.js)
├── caprush-brand.html    ← Kit de identidade visual
├── personagens.html      ← Seleção de personagens (4 pilotos anime)
├── ranking.html          ← Ranking global e ligas
├── marketplace.html      ← Marketplace NFT (em breve)
└── README.md             ← Este arquivo
```

---

## Personagens

| Piloto | Especialidade | Raridade NFT | Status |
|--------|--------------|-------------|--------|
| KAITO | Velocidade | Épica | ✅ Disponível |
| YUKI | Controle | Lendária | ✅ Disponível |
| RYU | Equilibrado | Rara | ✅ Disponível |
| NEKO | Caos / Alta força | Mítica | 🔒 Desbloqueável |

---

## Mecânica de Jogo

1. **Mira:** Clique e arraste para trás da tampinha
2. **Força:** Distância do arraste define a potência (máx 165px → 740px/s)
3. **Física:** Arrasto real (`DRAG = 0.52/s`), ricochetes, atrito de pista
4. **Objetivo:** Passe pelos 3 checkpoints e complete 2 voltas

### Atributos NFT das Tampinhas
- `velocidade` — velocidade máxima de lançamento
- `controle` — precisão de ângulo e curvas
- `aerodinamica` — resistência ao arrasto

---

## Arquitetura

| Camada | Tecnologia | Função |
|--------|-----------|--------|
| Frontend | Phaser.js / Unity WebGL | Motor de jogo, física, UI |
| Backend | Rust + Anchor | API, jogadas, progressão |
| Blockchain | Fogo SVM / Solana | NFTs, $CR, conquistas |
| Banco de dados | SQLite | Ranking, inventário, histórico |
| Auth | Google OAuth + TipLink + Phantom | Login híbrido |
| Marketplace | Metaplex | Mint, compra, venda, upgrades |
| Hospedagem | GitHub Pages + Render/Railway | Free tier, escalável |

---

## Pistas

| # | Pista | Dificuldade | Modificador |
|---|-------|------------|-------------|
| 01 | Terra & Cascalho | ⭐ | Atrito alto, curvas técnicas |
| 02 | Areia do Deserto | ⭐⭐ | Deslizamento, vento |
| 03 | Floresta | ⭐⭐ | Buracos, neblina |
| 04 | Chuva Intensa | ⭐⭐⭐ | Aquaplaning dinâmico |
| 05 | Corrida Mortal | ⭐⭐⭐⭐ | Rampas, gravidade variável |
| 06 | Futurista | ⭐⭐⭐⭐⭐ | Anti-gravidade, loops |
| 07 | Estilo Mario K. | ⭐⭐⭐ | Items, armadilhas |
| 08 | Enduro | ⭐⭐⭐⭐ | 10 voltas, resistência |

---

## Roadmap

- [x] **Fase 1** — Conceito, brand identity, arquitetura
- [x] **Fase 2** — Protótipo jogável Phaser.js, landing page, personagens, ranking
- [ ] **Fase 3** — Smart contracts Anchor (NFTs de tampinhas, $CR token)
- [ ] **Fase 4** — Login híbrido Google + TipLink + Phantom
- [ ] **Fase 5** — Arte anime final, efeitos visuais, trilha sonora, campanha
- [ ] **Fase 6** — Marketplace Metaplex (mint, compra, venda, upgrades)
- [ ] **Fase 7** — Multiplayer 1v1 / 1v1v1 / 2v2, temporadas, ligas
- [ ] **Fase 8** — Dashboard, exportação PDF/CSV, replays, pistas da comunidade

---

## Token $CapRush ($CR)

- Ganho por completar corridas, voltas e checkpoints
- Usado para desbloquear personagens, upgrades e entrada em torneios
- Certos upgrades exigem combinação de itens anteriores
- Integrado com TipLink para usuários sem carteira cripto

---

## Hospedagem

**Frontend:** GitHub Pages (free)  
**Backend:** Render / Railway (free tier → pago conforme cresce)  
**Blockchain:** Fogo Devnet → Mainnet após validação

---

## Stack Técnica

```
Frontend      Phaser.js 3.60 · HTML5 · CSS3 · Vanilla JS
Backend       Rust · Anchor Framework
Blockchain    Fogo SVM (Solana Virtual Machine)
Banco         SQLite
Auth          Google OAuth 2.0 · TipLink · Phantom Wallet
Marketplace   Metaplex
Deploy        GitHub Pages · Render · Railway
```

---

## Contribuição

Projeto em desenvolvimento ativo. Issues e Pull Requests são bem-vindos.

**Contato:** Abra uma issue neste repositório.

---

*CapRush – Overdrive! · Prototype v0.1 · 2025*
