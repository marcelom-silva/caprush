# CapRush — Development Roadmap

## Fase 1 — MVP Jogável ✅ (Q1–Q2 2026 — CONCLUÍDO)
- [x] Motor de física próprio (Vector2D, Physics, GameLoop)
- [x] Pista procedural TrackV3 (areia, grama, poças, buracos, obstáculos)
- [x] Pista inspirada em Monza F1 (TrackMonza) com chicanes elásticas
- [x] Solo vs IA Boss (Racer-D) — turn-based
- [x] 1v1 Local (mesmo dispositivo, Yuki vs Kenta)
- [x] 1v1 Online Beta (PeerJS WebRTC P2P)
- [x] Ranking Supabase (3 modos: Solo, Local, Online)
- [x] i18n PT/EN/ES (300+ chaves)
- [x] Web Audio API (148 BPM + SFX + 3 trilhas OGG)
- [x] Background animado Tron (tampinhas laranja)
- [x] Faíscas no impacto entre tampinhas
- [x] Cards de piloto padronizados com foto e animação
- [x] Investor Deck (caprush-brand.html)
- [x] Vercel deploy (CDN estático)
- [x] 5 pilotos com fotos (YUKI, KENTA, BRUNA, DUO, TAPZ) no brand

## ✅ Marco 1 — Motor $CR Off-Chain (Abril 2026 — CONCLUÍDO)
- [x] `cr-engine.js` — motor completo: saldo, transações, conquistas, retroativo
- [x] `dashboard.html` — carteira do jogador com saldo $CR e histórico
- [x] Tabela Supabase `cr_ledger` (saldo por wallet/DID)
- [x] Tabela Supabase `cr_transactions` (histórico de ganhos)
- [x] Tabela Supabase `achievements_unlocked` (conquistas desbloqueadas)
- [x] `CREngine.awardRace()` integrado nos 3 modos de jogo:
  - Solo completo → +1 $CR
  - Vitória 1v1 Local → +3 $CR
  - Vitória 1v1 Online → +3 $CR (jogador local)
- [x] Recorde pessoal → +0.5 $CR
- [x] Conquistas → +2 a +50 $CR
- [x] Saldo retroativo para corridas anteriores ao Marco 1

## ✅ Marco 2 — Privy Wallet Solana (Abril 2026 — CONCLUÍDO)
- [x] `privy-auth.js` — Privy OAuth PKCE redirect flow (sem SDK iframe, sem CORS)
- [x] Login Google via Privy → DID Solana (`did:privy:...`) como identificador único
- [x] `loginWithCode` posicional com `privy_oauth_code` e `privy_oauth_state`
- [x] `getAccessToken()` para JWT do usuário após login
- [x] Logout completo (limpa `caprush_user`, `caprush_privy_session`, `caprush_wallet`)
- [x] Pill da wallet no nav do `index.html`
- [x] Wallet bar no `dashboard.html`
- [x] Upsert automático em `cr_ledger` ao fazer login
- [x] Supabase `runs` com `solana_address` e `privy_user_id`
- [x] `tokenCR.png` visível nos 3 pontos: TOKEN $CR h2, Utilidade $CR, Ranking rows
- [x] `tampinha-asa.png` no dashboard (estado não logado)
- [x] Grid de largada 1v1 baseado em `getStartPos()` da pista (não porcentagem de canvas)
- [x] Kanji RACER-D corrigido `?` → `X` no preview do painel lateral
- **Pendência Marco 3:** Endereço Solana Base58 real (CORS impede do browser; virá via Vercel Function)

## 🔄 Marco 3 — SPL Token $CR On-Chain (Q3 2026 — PRÓXIMO)
- [ ] Mint do SPL Token $CR (100 milhões, deflacionário)
- [ ] Vercel Function/Edge Function para wallet Solana real (resolve CORS do Privy)
- [ ] Endereço Base58 substituindo DID como identificador
- [ ] Migração dos saldos off-chain (`cr_ledger`) para on-chain
- [ ] Airdrop dos $CR acumulados pelos jogadores
- [ ] Mint NFT pilotos (YUKI, KENTA) via Metaplex

## ⏳ Marco 4 — Apostas Smart Contract Anchor (Q4 2026)
- [ ] Deploy Fogo SVM (EVM-compatível)
- [ ] Smart contract Anchor (Rust) na Solana
- [ ] 1v1 com aposta em $CR — escrow on-chain
- [ ] 10% burn automático por corrida com aposta
- [ ] Garagem + upgrades de atributos (Vel/Ctrl/Aero)

## ⏳ Marco 5 — Garagem + Marketplace NFT (2027)
- [ ] Marketplace P2P de pilotos NFT
- [ ] Novos pilotos: BRUNA, DUO, TAPZ (Metaplex)
- [ ] Torneios patrocinados com prize pool em $CR
- [ ] Mobile PWA (Progressive Web App)
- [ ] Nova pista (3+)

## 🔮 Marco 6 — Ecossistema Completo (2027)
- [ ] Arcium — lances secretos encriptados
- [ ] DAO de governança com $CR
- [ ] Staking de $CR (yield em temporadas)
- [ ] Campeonatos globais com transmissão ao vivo
- [ ] Licenciamento de IP (tampinhas de marcas parceiras)

## Stack Atual (Marco 2)
Canvas 2D + Vanilla JS
Physics: Vector2D, Physics.js, GameLoop.js
Audio: Web Audio API + 3x OGG (lepiten, watertide, martini)
Login: Privy OAuth PKCE redirect (Google → DID Solana)
Token: cr-engine.js off-chain → SPL Token on-chain no Marco 3
DB: Supabase Postgres (REST direto)
  Tables: runs, cr_ledger, cr_transactions, achievements_unlocked
Multiplayer: PeerJS WebRTC
Deploy: Vercel

