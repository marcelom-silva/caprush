# CapRush - Arquitetura Fase 1

## Modulos

  GameLoop.js  <- Orquestrador (loop, input, HUD)
      |
      +-- Physics.js   <- Fisica pura (sem canvas)
      |       +-- Vector2D.js
      +-- Yuki.js      <- Sprite + atributos NFT
      +-- TrackTest.js <- Pista + checkpoints

## Principios

- Physics.js nao toca no canvas
- TrackTest.render() nao calcula fisica
- Cada modulo tem uma unica responsabilidade

## Servidor

- Flask + SQLite (caprush.db)
- POST /api/scores -> salva tempo
- GET  /api/scores -> ranking top 20
