# CapRush - Guia Modo Online 1v1

## Requisitos
- Node.js instalado (nodejs.org, versao 18+)
- Dois computadores na mesma rede Wi-Fi

## Como executar no PowerShell (Windows)
Use comandos separados (nao use &&):

Terminal 1 - Servidor do jogo:
  cd C:\Users\User\Cryptos\projects\caprush
  python -m http.server 8080

Terminal 2 - Servidor multiplayer:
  cd C:\Users\User\Cryptos\projects\caprush\server
  node ws-server.js

## Como jogar
1. HOST: abre http://localhost:8080/client/caprush-game-v2.html
2. HOST: clica 1x1 ONLINE, escolhe personagem
3. HOST: o jogo detecta o IP e exibe um banner com o link e botao Copiar
4. HOST: envia o link ao amigo via WhatsApp/Discord
5. GUEST: abre o link recebido, clica 1x1 ONLINE, escolhe personagem, joga
