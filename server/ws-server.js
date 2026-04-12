// server/ws-server.js
// Servidor WebSocket para multiplayer online do CapRush
// Instalar: npm install ws
// Rodar: node ws-server.js
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8765 });

const rooms = {}; // { code: { p1, p2 } }

function genCode(){
  return Math.random().toString(36).substr(2,4).toUpperCase();
}

wss.on('connection', function(ws){
  ws.on('message', function(raw){
    let d;
    try{ d=JSON.parse(raw); }catch(e){ return; }

    if(d.type==='create'){
      const code=genCode();
      rooms[code]={ p1:ws, p2:null, nick1:d.nick, nick2:null };
      ws.roomCode=code; ws.role='p1';
      ws.send(JSON.stringify({type:'room_created', room:code, nick:d.nick}));
      console.log('[ROOM] Criada:', code, 'por', d.nick);
    }

    if(d.type==='join'){
      const room=rooms[d.room];
      if(!room){ ws.send(JSON.stringify({type:'error',msg:'Sala nao encontrada'})); return; }
      if(room.p2){ ws.send(JSON.stringify({type:'error',msg:'Sala cheia'})); return; }
      room.p2=ws; room.nick2=d.nick;
      ws.roomCode=d.room; ws.role='p2';
      // Notifica ambos
      const start=JSON.stringify({type:'game_start', room:d.room, nick1:room.nick1, nick2:d.nick});
      room.p1.send(start);
      room.p2.send(start);
      console.log('[ROOM]', d.room, '- P2 entrou:', d.nick, '- Jogo iniciado!');
    }

    // Relay de movimentos (lances, posicoes)
    if(d.type==='move' || d.type==='state'){
      const room=rooms[ws.roomCode];
      if(!room) return;
      const other = ws.role==='p1' ? room.p2 : room.p1;
      if(other && other.readyState===WebSocket.OPEN){
        other.send(JSON.stringify(d));
      }
    }
  });

  ws.on('close', function(){
    if(ws.roomCode && rooms[ws.roomCode]){
      const room=rooms[ws.roomCode];
      const other = ws.role==='p1' ? room.p2 : room.p1;
      if(other && other.readyState===WebSocket.OPEN){
        other.send(JSON.stringify({type:'opponent_left'}));
      }
      delete rooms[ws.roomCode];
    }
  });
});

console.log('CapRush WS Server rodando na porta 8765');
