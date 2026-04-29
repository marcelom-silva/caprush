# CapRush — Overdrive! v0.7

Jogo de corrida de tampinhas (bottle caps) · Solo vs IA · 1v1 Local · 1v1 Online  
Canvas 2D · Web Audio API · **Privy OAuth Login** · **Token $CR off-chain** · Supabase · PeerJS WebRTC

## Marcos Concluídos
- ✅ **Marco 1** — Motor $CR off-chain (`cr-engine.js` · `dashboard.html` · Supabase `cr_ledger`)
- ✅ **Marco 2** — Privy Wallet Solana (`privy-auth.js` · OAuth PKCE redirect · DID Solana)

## Fluxo de Jogo

```
index.html (Privy Login → Google OAuth → DID Solana)
  └── JOGAR → personagens.html (escolha piloto: YUKI ou KENTA)
        ├── SOLO vs IA   → caprush-game.html (TrackV3) → +1 $CR
        └── 2P LOCAL     → client/game-multi-local.html (TrackMonza) → +3 $CR (vencedor)
        └── 2P ONLINE    → client/game-multi-online.html (TrackMonza, PeerJS) → +3 $CR (vencedor local)
  └── DASHBOARD → dashboard.html (saldo $CR · histórico · conquistas)
  └── RANKING   → ranking.html (Supabase — 3 abas: Solo / Local / Online)
  └── GARAGEM   (Marco 5 — em breve)
  └── MARCA     → caprush-brand.html (Investor Deck)
```

## Pilotos

| Piloto  | Raridade  | Vel | Ctrl | Aero | Status        |
|---------|-----------|-----|------|------|---------------|
| YUKI    | Lendário  | 82  | 91   | 75   | ✅ Disponível |
| KENTA   | Épico     | 88  | 76   | 83   | ✅ Disponível |
| BRUNA   | Rara      | 78  | 95   | 71   | 🔒 Em breve   |
| DUO     | Mítica    | 90  | 85   | 92   | 🔒 Em breve   |
| TAPZ    | Mítica    | 94  | 80   | 97   | 🔒 Em breve   |
| RACER-D | Boss IA   | ??? | ???  | ???  | não jogável   |

## Estrutura do Repositório

```
caprush/                       ← RAIZ (servir daqui)
  index.html                   ← Landing + Privy Login + Órbita de caps
  caprush-game.html            ← Solo vs Racer-D (IA Boss) na TrackV3
  personagens.html             ← Seleção de piloto
  dashboard.html               ← ✅ Marco 1: Carteira $CR (saldo, histórico, conquistas)
  ranking.html                 ← Ranking Supabase (3 modos)
  manual.html                  ← Manual do jogador
  arquitetura.html             ← Documentação técnica
  caprush-brand.html           ← Investor Deck / Brand
  erros.html                   ← Página de erro 404/genérico
  i18n.js                      ← Traduções PT/EN/ES (300+ chaves)
  cr-engine.js                 ← ✅ Marco 1: Motor $CR off-chain
  privy-auth.js                ← ✅ Marco 2: Privy OAuth PKCE redirect flow
  audio.js                     ← Smart audio router (lepiten/watertide/martini)
  background.js                ← Background animado Tron (tampinhas laranja)
  vercel.json                  ← Deploy config
  Whisk_2_transparent.png      ← Logo central
  tokenCR.png                  ← Logo token $CR (fundo transparente)
  tampinha-asa.png             ← Tampinha de lado com aerofólio (dashboard)

  client/
    game-multi.html            ← Menu de modos multiplayer
    game-multi-local.html      ← 1v1 Local (Monza, Yuki vs Kenta) + $CR
    game-multi-online.html     ← 1v1 Online PeerJS (beta) + $CR

    src/core/
      Vector2D.js              ← Álgebra vetorial
      Physics.js               ← Motor de física (drag, bounce, superfícies)
      SoundEngine.js           ← Web Audio API (BGM + SFX)
      CapSprite.js             ← Render das tampinhas
      GameLoop.js              ← Game loop principal (Solo + IA + $CR)

    src/entities/
      Yuki.js                  ← Config piloto Yuki
      Kenta.js                 ← Config piloto Kenta
      RacerX.js                ← Config IA Racer-D (Boss)

    src/scenes/
      TrackV3.js               ← Pista principal (areia, grama, poças)
      TrackMonza.js            ← Circuito Monza F1 (chicanes, buracos, helipad)

  game/
    assets/audio/music/
      lepiten.ogg              ← BGM padrão (todas as páginas)
      watertide.ogg            ← BGM Solo + Online
      martini.ogg              ← BGM 1v1 Local
    assets/images/
      kenta-piloto.png         ← Foto piloto Kenta
      yuki-piloto.png          ← Foto piloto Yuki
      bruna-piloto.png         ← Foto piloto Bruna
      duo-collie-piloto.png    ← Foto piloto Duo
      tapz-piloto.png          ← Foto piloto Tapz
```

## Stack v0.7

| Camada       | Tecnologia                                          |
|--------------|-----------------------------------------------------|
| Frontend     | HTML5 Canvas 2D + Vanilla JS                        |
| Física       | Motor próprio (sem libs)                            |
| Áudio        | Web Audio API 148 BPM + 3 OGGs                      |
| Login        | **Privy OAuth** (Google → PKCE redirect → DID Solana) |
| Wallet       | Privy Embedded Wallet (DID → endereço Base58 no Marco 3) |
| Token $CR    | **cr-engine.js** off-chain (Marco 1) → on-chain no Marco 3 |
| Ranking      | Supabase Postgres (REST direto)                     |
| Multiplayer  | PeerJS WebRTC P2P                                   |
| i18n         | PT / EN / ES (300+ chaves)                          |
| Deploy       | Vercel CDN                                          |

## Banco de Dados (Supabase)

```sql
-- ✅ Marco 0: Tabela de corridas
CREATE TABLE runs (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet       text,
  nickname     text,
  pilot        text,          -- 'YUKI' | 'KENTA'
  time_ms      integer,
  launches     integer DEFAULT 0,
  mode         text,          -- 'solo' | 'local' | 'online'
  solana_address text,        -- Marco 2: DID Privy ou endereço Solana
  privy_user_id  text,        -- Marco 2: did:privy:...
  created_at   timestamptz DEFAULT now()
);

-- ✅ Marco 1: Ledger de tokens $CR
CREATE TABLE cr_ledger (
  wallet           text PRIMARY KEY,
  nickname         text,
  email            text,
  privy_user_id    text,
  cr_balance       numeric DEFAULT 0,
  cr_total_earned  numeric DEFAULT 0,
  cr_staked        numeric DEFAULT 0,
  cr_staked_until  timestamptz,
  retroactive_done boolean DEFAULT false,
  updated_at       timestamptz DEFAULT now()
);

-- ✅ Marco 1: Histórico de transações $CR
CREATE TABLE cr_transactions (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet      text,
  type        text,   -- 'race_win' | 'personal_record' | 'achievement' | 'retroactive'
  amount      numeric,
  description text,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

-- ✅ Marco 1: Conquistas desbloqueadas
CREATE TABLE achievements_unlocked (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet       text,
  achievement  text,
  cr_awarded   numeric,
  unlocked_at  timestamptz DEFAULT now()
);
```

## Mudanças v0.7 (Marcos 1 + 2)

- [x] **Marco 1:** `cr-engine.js` — motor $CR off-chain completo
- [x] **Marco 1:** `dashboard.html` — carteira $CR com saldo, histórico e conquistas
- [x] **Marco 1:** `CREngine.awardRace()` integrado nos 3 modos (Solo +1, 1v1 +3)
- [x] **Marco 1:** Tabelas Supabase: `cr_ledger`, `cr_transactions`, `achievements_unlocked`
- [x] **Marco 1:** Saldo retroativo para corridas anteriores
- [x] **Marco 2:** `privy-auth.js` — Privy OAuth PKCE redirect flow (sem SDK iframe)
- [x] **Marco 2:** Login Google via Privy → DID Solana (`did:privy:...`) como identificador
- [x] **Marco 2:** Logout funcionando (limpa tudo, sem re-login automático)
- [x] **Marco 2:** Pill da wallet no nav do `index.html`
- [x] **Marco 2:** Upsert automático em `cr_ledger` ao fazer login
- [x] **Marco 2:** `tokenCR.png` e `tampinha-asa.png` adicionados
- [x] 5 pilotos com fotos no `caprush-brand.html` (YUKI, KENTA, BRUNA, DUO, TAPZ)
- [x] Grid de largada 1v1 baseado em `getStartPos()` da pista
- [x] Kanji RACER-D corrigido `?` → `X`
- [ ] Endereço Solana Base58 real (Marco 3 — via Vercel Function)
- [ ] Mint NFT pilotos on-chain
- [ ] Garagem com upgrades

## Como Rodar Localmente


python -m http.server 8080
# Abrir: http://localhost:8080/index.html


## Deploy (Vercel)

Conecte o repo GitHub ao Vercel. Zero config — estático puro.


https://github.com/marcelom-silva/caprush

