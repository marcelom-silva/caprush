# CapRush — Overdrive! v0.4b

Jogo de corrida de tampinhas (bottle caps) para 1-4 jogadores.
Canvas 2D, Web Audio API, PeerJS WebRTC online.

## Estrutura

```
caprush/                     <- RAIZ do projeto (servir daqui)
  index.html                 <- Landing page
  personagens.html           <- Galeria de pilotos
  manual.html                <- Manual do jogador (PT/EN/ES)
  arquitetura.html           <- Documentacao tecnica
  ranking.html               <- Ranking
  caprush-game.html          <- Wrapper -> client/game.html
  i18n.js                    <- Internacionalizacao
  Whisk_2.png                <- Logo

  client/
    game.html                <- Solo
    game-multi.html          <- Menu modos
    game-multi-local.html    <- 1v1 Local (turnos)
    game-multi-online.html   <- 1v1 Online (PeerJS - Beta)
    src/core/                <- Motor: Vector2D, Physics, SoundEngine, CapSprite, GameLoop
    src/scenes/TrackV3.js    <- Pista v4b
```

## Como rodar localmente

```bash
# Python 3
python -m http.server 8080
# Acessar: http://localhost:8080/index.html
```

## Builders v0.4b

Execute na raiz do projeto:

```bash
python build_v04b_p1.py   # index.html + i18n.js + personagens.html
python build_v04b_p2.py   # SoundEngine.js + TrackV3.js
python build_v04b_p3.py   # game.html + game-multi-local.html + manual.html + arquitetura.html
# OU tudo de uma vez:
python builder_v04b_run.py
```

## Mudancas v0.4b

- **Start/Finish**: Faixa fina (14px), sem bloqueio fisico. Tampinhas passam livremente.
- **Pocas**: Reposicionadas dentro da pista (cotovelo do chicane + reta direita).
- **BGM**: Inicia automaticamente. Sem overlap ao toggle rapido (session-ID).
- **Painel lateral**: Incluido no modo 1v1 Local.
- **i18n.js**: Flags sem duplicacao.

## Deploy (Vercel)

Conecte o repositorio GitHub ao Vercel. O `vercel.json` ja esta configurado.
Com URL publica, qualquer pessoa pode jogar online sem configuracao.

## Fase 1 — Prototipo Jogavel

- [x] Motor de fisica (drag, bounce, superficies)
- [x] Pista procedural (TrackV3) com checkpoints, pocas, grama
- [x] Modo Solo com timer e voltas
- [x] Modo 1v1 Local (turnos alternados)
- [x] Modo Online Beta (PeerJS WebRTC)
- [x] Audio procedural + BGM 148 BPM
- [x] 4 pilotos com SVG + atributos
- [x] Internacionalizacao PT/EN/ES
