# CapRush — Overdrive! v0.3

Jogo de corrida de tampinhas estilo turno, com física realista, gráficos Canvas 2D e suporte a NFTs Solana (Devnet).

## Novidades v0.3

- **Física corrigida** — arrasto da água e grama estavam invertidos; ricochete em obstáculos usa reflexão vetorial correta
- **Arquibancadas (amarelo)** — visual com torcida animada, ricocheteia com REST=0.72
- **Paddock (laranja)** — visual com boxes e barris; ricocheteia (solo) ou perde rodada (1v1/online)
- **Água orgânica** — poças desenhadas com blob bezier animado, não mais círculos
- **Grama texturizada** — hastes animadas nas zonas de grama
- **i18n** — PT-BR / EN-US / ES com bandeirinhas em todas as páginas
- **Logo** — imagem Whisk_2.png substituindo texto, com brilho metálico no arco vermelho ao hover
- **Personagens manga/anime** — SVGs redesenhados com olhos maiores, highlights, estilo mais expressivo
- **1v1 Local** — colisão cap×cap com troca de momento, painel lateral, stands/paddock ativo
- **Online 1v1** — guia de como jogar, display de IP ao iniciar o servidor

## Estrutura

```
caprush/
├── index.html              ← Landing page (tampinhas flutuantes + logo img)
├── personagens.html        ← Seleção de pilotos (SVGs manga/anime)
├── caprush-game.html       ← Shell iframe → client/game.html
├── manual.html             ← Manual do jogador v0.3
├── arquitetura.html        ← Documentação técnica v0.3
├── ranking.html
├── i18n.js                 ← Sistema de tradução PT/EN/ES
├── Whisk_2.png             ← Logo (coloque na raiz)
├── client/
│   ├── game.html           ← Modo Solo
│   ├── game-multi.html     ← Seletor de modo multiplayer
│   ├── game-multi-local.html   ← 1v1 Local (com painel + cap×cap)
│   ├── game-multi-online.html  ← Lobby Online
│   └── src/
│       ├── core/Physics.js     ← Motor de física v3
│       ├── core/GameLoop.js    ← Loop solo v3
│       ├── scenes/TrackV3.js   ← Pista v3 (stands, paddock, organico)
│       └── ...
└── server/
    └── ws-server.js        ← WebSocket v3 (display IP melhorado)
```

## Desenvolvimento local

```bash
# Servidor estático (qualquer um)
npx serve .
# ou
python -m http.server 8080

# Servidor WebSocket (multiplayer online)
cd server && node ws-server.js
```

## Superfícies v0.3

| Superfície | Efeito       | Visual          |
|------------|--------------|-----------------|
| Asfalto    | Normal       | Marrom          |
| Água       | Freia        | Blob azul orgânico |
| Grama      | Acelera      | Verde com hastes |
| Stands     | Ricocheteia  | Amarelo + torcida |
| Paddock    | Rico. / perde turno | Laranja + boxes |
