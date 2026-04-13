# CapRush – Guia do Modo Online 1v1

## Pré-requisitos

- **Node.js** instalado: https://nodejs.org (versão 18+)
- Ambos na **mesma rede local** (Wi-Fi ou cabo), OU usando ngrok para jogar pela internet

---

## Passo a Passo — Jogador 1 (HOST)

### 1. Abra 2 terminais na pasta do projeto

**Terminal A — servidor do jogo:**
```
cd C:\Users\User\Cryptos\projects\caprush
python -m http.server 8080
```

**Terminal B — servidor WebSocket:**
```
cd C:\Users\User\Cryptos\projects\caprush\server
npm install ws        ← apenas na primeira vez
node ws-server.js
```

O Terminal B mostrará os IPs disponíveis. Exemplo:
```
╔══════════════════════════════════════════════════════╗
║  CapRush – Servidor Online                           ║
║  Porta: 3001  (HTTP + WebSocket)                     ║
╠══════════════════════════════════════════════════════╣
║  🎮 COMPARTILHE ESTE LINK COM SEU AMIGO:             ║
║  🌐 http://192.168.1.105:8080/client/caprush-game-v2.html ║
╚══════════════════════════════════════════════════════╝
```

### 2. Abra o jogo

```
http://localhost:8080/client/caprush-game-v2.html
```

1. Clique em **1 x 1 ONLINE**
2. Escolha seu personagem
3. O jogo detecta automaticamente seu IP e mostra um **banner com o link**
4. Copie o link com o botão **📋 Copiar Link** e envie ao amigo

---

## Passo a Passo — Jogador 2 (GUEST)

1. Abra o link recebido no navegador (ex: `http://192.168.1.105:8080/client/caprush-game-v2.html`)
2. Clique em **1 x 1 ONLINE**
3. Escolha seu personagem
4. Clique em **JOGAR** — a conexão é automática

---

## Jogando pela Internet (ngrok)

Se os jogadores estão em redes diferentes:

```bash
# Instale ngrok: https://ngrok.com
ngrok http 8080    # no Terminal C
ngrok tcp 3001     # no Terminal D
```

- Jogador 2 usa a URL HTTP do ngrok para acessar o jogo
- Edite `ws://localhost:3001` no HTML para a URL TCP do ngrok

---

## Regras do Modo Online

| Regra | Detalhe |
|-------|---------|
| Turnos | Cada jogador lança, espera parar, passa a vez |
| Paddock | Perde 1 turno |
| Colisão | Física elástica real |
| 2 voltas | Primeiro a completar 2 voltas com os 3 CPs vence |

---

## Solução de Problemas

| Problema | Solução |
|----------|---------|
| "Servidor offline" no jogo | Execute `node ws-server.js` na pasta `server/` |
| Jogador 2 não carrega a página | Verifique se o IP está correto e o firewall permite porta 8080 |
| Jogador 2 não conecta ao WS | Firewall: libere porta 3001 para entrada |
| `ws` não instalado | Execute `npm install ws` na pasta `server/` |
| Node.js não encontrado | Instale em https://nodejs.org |
