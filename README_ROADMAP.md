# CapRush — Development Roadmap

## Fase 1 — MVP Jogável ✅ (Q1–Q2 2026)
- [x] Motor de física próprio (Vector2D, Physics, GameLoop)
- [x] Pista procedural TrackV3 (areia, grama, poças, buracos, obstáculos)
- [x] Pista inspirada em Monza F1 (TrackMonza) com chicanes elásticas
- [x] Solo vs IA Boss (Racer-D) — turn-based
- [x] 1v1 Local (mesmo dispositivo, Yuki vs Kenta)
- [x] 1v1 Online Beta (PeerJS WebRTC P2P)
- [x] Login Google One Tap + Nickname
- [x] Ranking Supabase (3 modos: Solo, Local, Online)
- [x] i18n PT/EN/ES (300+ chaves)
- [x] Web Audio API (148 BPM + SFX + 3 trilhas OGG)
- [x] Background animado Tron (tampinhas laranja)
- [x] Faíscas no impacto entre tampinhas
- [x] Cards de piloto padronizados com foto e animação
- [x] Investor Deck (caprush-brand.html)
- [x] Vercel deploy (CDN estático)

## Fase 2 — Blockchain & Economia 🔄 (Q3 2026)
- [ ] TipLink Wallet Adapter (Google → Solana)
- [ ] Token $CR na Solana (mint genesis)
- [ ] Mint NFT pilotos (YUKI, KENTA, BRUNA, TAPZ)
- [ ] Metadata on-chain com atributos (Vel/Ctrl/Aero)
- [ ] 1v1 com aposta em $CR
- [ ] Marketplace de tampinhas NFT
- [ ] Ranking on-chain por temporada
- [ ] Garagem (upgrade de atributos de tampinha)

## Fase 3 — Escala & Torneios ⏳ (Q4 2026)
- [ ] Deploy Fogo SVM (EVM-compatível)
- [ ] Torneios patrocinados com prize pool em $CR
- [ ] Mobile PWA (Progressive Web App)
- [ ] Novos pilotos jogáveis: BRUNA, TAPZ
- [ ] Nova pista (2 disponíveis → 3+)
- [ ] Sistema de replay de corridas
- [ ] Leaderboard global em tempo real

## Fase 4 — Ecossistema Completo 🔮 (2027)
- [ ] DAO de governança com $CR
- [ ] Staking de $CR (yield em temporadas)
- [ ] Campeonatos globais com transmissão ao vivo
- [ ] Licenciamento de IP (tampinhas de marcas parceiras)
- [ ] Parcerias com marcas de bebidas
- [ ] Modo espectador
- [ ] 10+ pilotos e pistas

## Stack Atual

```
Canvas 2D + Vanilla JS
Physics: Vector2D, Physics.js, GameLoop.js
Audio: Web Audio API + 3x OGG (lepiten, watertide, martini)
Login: Google Sign-In One Tap
DB: Supabase Postgres (REST direto)
Multiplayer: PeerJS WebRTC
Deploy: Vercel
```
