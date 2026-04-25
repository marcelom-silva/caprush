# CapRush — Overdrive! v0.5

Jogo de corrida de tampinhas (bottle caps) · Solo vs IA · 1v1 Local · 1v1 Online  
Canvas 2D · Web Audio API · Google Login · Supabase Ranking · PeerJS WebRTC

## Fluxo de Jogo

```
index.html (login Google + nickname)
  └── JOGAR → personagens.html (escolha piloto: YUKI ou KENTA)
        ├── SOLO vs IA   → caprush-game.html (TrackV3)
        └── 2P LOCAL     → client/game-multi-local.html (TrackMonza)
        └── 2P ONLINE    → client/game-multi-online.html (TrackMonza, PeerJS)
  └── RANKING → ranking.html (Supabase — 3 abas: Solo / Local / Online)
  └── GARAGEM (em breve)
  └── MARCA   → caprush-brand.html (Investor Deck)
```

## Pilotos

| Piloto  | Raridade  | Vel | Ctrl | Aero | Status        |
|---------|-----------|-----|------|------|---------------|
| YUKI    | Lendário  | 82  | 91   | 75   | ✅ Disponível |
| KENTA   | Épico     | 88  | 76   | 83   | ✅ Disponível |
| BRUNA   | Rara      | 78  | 95   | 71   | 🔒 Em breve   |
| TAPZ    | Mítica    | 94  | 80   | 97   | 🔒 Em breve   |
| RACER-D | Boss IA   | ??? | ???  | ???  | não jogável   |

## Estrutura do Repositório

```
caprush/                       ← RAIZ (servir daqui)
  index.html                   ← Landing + Login Google + Órbita de caps
  caprush-game.html            ← Solo vs Racer-D (IA Boss) na TrackV3
  personagens.html             ← Seleção de piloto
  ranking.html                 ← Ranking Supabase (3 modos)
  manual.html                  ← Manual do jogador
  arquitetura.html             ← Documentação técnica
  caprush-brand.html           ← Investor Deck / Brand
  erros.html                   ← Página de erro 404/genérico
  i18n.js                      ← Traduções PT/EN/ES (300+ chaves)
  audio.js                     ← Smart audio router (lepiten/watertide/martini)
  background.js                ← Background animado Tron (tampinhas laranja)
  vercel.json                  ← Deploy config
  Whisk_2_transparent.png      ← Logo central

  client/
    game-multi.html            ← Menu de modos multiplayer
    game-multi-local.html      ← 1v1 Local (Monza, Yuki vs Kenta)
    game-multi-online.html     ← 1v1 Online PeerJS (beta)

    src/core/
      Vector2D.js              ← Álgebra vetorial
      Physics.js               ← Motor de física (drag, bounce, areia)
      SoundEngine.js           ← Web Audio API (BGM + SFX)
      CapSprite.js             ← Render das tampinhas
      GameLoop.js              ← Game loop principal (Solo + IA)

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
```

## Como Rodar Localmente

```bash
python -m http.server 8080
# Abrir: http://localhost:8080/index.html
```

## Deploy (Vercel)

Conecte o repo GitHub ao Vercel. Zero config — estático puro.

```
https://github.com/marcelom-silva/caprush
```

## Stack v0.5

| Camada       | Tecnologia                          |
|--------------|-------------------------------------|
| Frontend     | HTML5 Canvas 2D + Vanilla JS        |
| Física       | Motor próprio (sem libs)            |
| Áudio        | Web Audio API 148 BPM + 3 OGGs      |
| Login        | Google Sign-In One Tap + localStorage |
| Ranking      | Supabase Postgres (REST direto)     |
| Multiplayer  | PeerJS WebRTC P2P                   |
| i18n         | PT / EN / ES (manual)               |
| Deploy       | Vercel CDN                          |

## Banco de Dados (Supabase)

```sql
-- Tabela runs
CREATE TABLE runs (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet     text,
  nickname   text,
  pilot      text,   -- 'YUKI' | 'KENTA'
  time_ms    integer,
  launches   integer DEFAULT 0,
  mode       text,   -- 'solo' | 'local' | 'online'
  created_at timestamptz DEFAULT now()
);

-- Coluna nickname (adicionar se não existir)
ALTER TABLE runs ADD COLUMN IF NOT EXISTS nickname text;
```

## Mudanças v0.5

- [x] Motor física completo: areia, grama, poças, buracos, chicane elástica
- [x] Faíscas no impacto entre tampinhas (Solo + 1v1 Local)
- [x] 2 Pistas: TrackV3 (original) + TrackMonza (Monza F1)
- [x] 3 Modos: Solo vs IA, 1v1 Local, 1v1 Online (beta)
- [x] Cards de piloto padronizados (foto + canvas tampinha + stats)
- [x] Login Google + Nickname + Ranking Supabase (3 abas)
- [x] PT/EN/ES i18n (300+ chaves)
- [x] Background animado Tron (tampinhas laranja com rastros)
- [x] Smart audio router (3 músicas por modo)
- [x] Investor Deck (caprush-brand.html)
- [ ] TipLink wallet (aguardando credenciais)
- [ ] Mint NFT pilotos on-chain
- [ ] Garagem com upgrades
