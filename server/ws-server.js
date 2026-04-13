/**
 * CapRush – ws-server.js
 * ─────────────────────────────────────────────────────────────────
 * Servidor WebSocket + HTTP para modo Online 1v1
 *
 * COMO EXECUTAR:
 *   cd server
 *   npm install ws   (apenas na primeira vez)
 *   node ws-server.js
 *
 * PORTA: 3001  (WebSocket + HTTP na mesma porta)
 *
 * ENDPOINTS HTTP:
 *   GET /info   → JSON com IPs locais (usado pelo jogo)
 *   GET /health → "OK"
 *
 * ─────────────────────────────────────────────────────────────────
 */

const WebSocket = require('ws');
const http      = require('http');
const os        = require('os');

const PORT = 3001;

// ── Detectar IPs locais da máquina ──────────────────────────────
function getLocalIPs() {
  const ifaces = os.networkInterfaces();
  const result = [];
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        result.push({ name, address: iface.address });
      }
    }
  }
  return result;
}

// ── HTTP server (para endpoint /info e WebSocket compartilhado) ──
const httpServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/info') {
    const ips = getLocalIPs();
    res.writeHead(200);
    res.end(JSON.stringify({ ips, port: PORT, status: 'online' }));
  } else if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'not found' }));
  }
});

// ── WebSocket server (na mesma porta HTTP) ───────────────────────
const wss = new WebSocket.Server({ server: httpServer });

const rooms = {};

function genCode() {
  return Math.random().toString(36).substr(2, 5).toUpperCase();
}

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

wss.on('connection', (ws) => {
  ws._room = null;
  ws._role = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case 'create_room': {
        const code = genCode();
        rooms[code] = { host: ws, guest: null, state: 'waiting', turn: 'host' };
        ws._room = code;
        ws._role = 'host';
        send(ws, { type: 'room_created', code });
        console.log(`[SALA] Criada: ${code}`);
        break;
      }

      case 'join_room': {
        const code = (msg.code || '').toUpperCase();
        const room = rooms[code];
        if (!room || room.state !== 'waiting') {
          send(ws, { type: 'error', msg: 'Sala não encontrada ou cheia.' });
          return;
        }
        room.guest = ws;
        room.state = 'playing';
        ws._room = code;
        ws._role = 'guest';
        send(ws,        { type: 'room_joined', code });
        send(room.host, { type: 'start', first: 'host' });
        send(room.guest,{ type: 'start', first: 'host' });
        console.log(`[SALA] ${code} — iniciado!`);
        break;
      }

      case 'launch': {
        const room = rooms[ws._room];
        if (!room) return;
        const opp = ws._role === 'host' ? room.guest : room.host;
        send(opp, { type: 'launch', from: msg.from, to: msg.to });
        send(opp, { type: 'pass_turn' });
        console.log(`[${ws._room}] ${ws._role} lançou.`);
        break;
      }

      case 'pos': {
        const room = rooms[ws._room];
        if (!room) return;
        const opp = ws._role === 'host' ? room.guest : room.host;
        send(opp, { type: 'pos', x: msg.x, y: msg.y, vx: msg.vx, vy: msg.vy });
        break;
      }

      case 'finish': {
        const room = rooms[ws._room];
        if (!room) return;
        const opp = ws._role === 'host' ? room.guest : room.host;
        send(opp, { type: 'opponent_finished', charId: msg.charId });
        break;
      }
    }
  });

  ws.on('close', () => {
    const code = ws._room;
    if (!code || !rooms[code]) return;
    const opp = ws._role === 'host' ? rooms[code].guest : rooms[code].host;
    send(opp, { type: 'opponent_disconnected' });
    delete rooms[code];
    console.log(`[SALA] ${code} — encerrada.`);
  });
});

// ── Start ────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  const ips = getLocalIPs();
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  CapRush – Servidor Online                           ║');
  console.log(`║  Porta: ${PORT}  (HTTP + WebSocket)                    ║`);
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log('║  🎮 COMPARTILHE ESTE LINK COM SEU AMIGO:             ║');
  ips.forEach(ip => {
    const url = `http://${ip.address}:8080/client/caprush-game-v2.html`;
    console.log(`║  🌐 ${url.padEnd(51)}║`);
  });
  console.log('║                                                      ║');
  console.log('║  ✅ Aguardando conexões...                           ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');
});
