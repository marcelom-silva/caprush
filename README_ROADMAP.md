# CapRush — Development Roadmap

## ✅ Marcos 1 → 2.9.2 (Q1–Q2 2026)

- **Marco 1** — Motor $CR off-chain (cr-engine.js · cr_ledger Supabase)
- **Marco 2** — Privy OAuth PKCE → DID Solana
- **Marco 2.5** — Evolução RPG + Apostas 1v1 (19 missões · settle_bet RPC)
- **Marco 2.7** — Sistema de Clãs (4 tabelas · 5 RPCs · Líder/Oficial/Membro)
- **Marco 2.8** — TrackV3 visual top-down + obstáculos (boost/oil/spin) + multi com voltas configuráveis
- **Marco 2.9** — Pilotos NFT (5 raridades) + Garagem inicial + Daily 30 dias + 6 Badges
- **Marco 2.9.1** — Refactor de organização: raiz limpa, src/ modular, Yuki→PilotRenderer
- **Marco 2.9.2** — Garagem reformulada (4 PNGs fixas), fluxo JOGAR inteligente,
  IA Racer-D mais robusta, Monza overhaul (canhões funcionais com projéteis,
  buracos visíveis e detectáveis, chicanes nas bordas, heliponto restaurado,
  CPs menores), som de derrapagem distinto por tampinha

## 🔄 Marco 3 — SPL Token On-Chain (Q3 2026 — PRÓXIMO)
- [ ] Mint SPL Token $CR (100M supply)
- [ ] Vercel Function pra wallet Solana real
- [ ] Endereço Base58 substituindo DID
- [ ] Migração saldos off-chain → on-chain
- [ ] Mint NFT pilotos via Metaplex
- [ ] Marketplace simples P2P

## ⏳ Marco 4 — Smart Contract Anchor + OFICINA (Q4 2026)
- [ ] Smart contract Anchor (Rust) na Solana
- [ ] Apostas on-chain com escrow
- [ ] **OFICINA**: upgrades **funcionais** da tampinha (peso/aderência/aero) — diferente da Garagem visual
- [ ] Mobile PWA, novas pistas

## ⏳ Marco 5 — Marketplace NFT Avançado (2027)
- [ ] Marketplace P2P maduro (filtros · busca · leilões)
- [ ] Torneios patrocinados com prize pool
- [ ] Sistema de leilões para NFTs raras

## 🔮 Marco 6 — Ecossistema (2027)
- [ ] Arcium — lances secretos encriptados
- [ ] DAO de governança com $CR
- [ ] Staking $CR (yield em temporadas)
- [ ] Campeonatos globais
- [ ] Licenciamento de IP (marcas de bebidas)

## Stack Atual (Marco 2.9.1)

```
Canvas 2D + Vanilla JS (sem framework)
Frontend modular: src/{auth,core,entities,scenes,engines,ui}
Backend: Supabase Postgres (REST + RPCs) + Vercel CDN
Multiplayer: PeerJS WebRTC P2P (sem servidor)
Login: Privy OAuth → DID Solana → Base58 (Marco 3)
i18n: PT/EN/ES (600+ chaves)
```
