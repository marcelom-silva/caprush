/**
 * CapRush ws-server.js v3
 * Porta 3001 — WebSocket + HTTP
 * Executar: node ws-server.js   (dentro de server/)
 */
const WebSocket = require('ws');
const http      = require('http');
const os        = require('os');
const PORT      = 3001;

function getIPs(){
  const ips = [];
  for(const [,ifaces] of Object.entries(os.networkInterfaces()))
    for(const i of ifaces)
      if(i.family==='IPv4'&&!i.internal) ips.push(i.address);
  return ips;
}

const srv = http.createServer((req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Content-Type','application/json');
  if(req.url==='/info'){
    res.writeHead(200);
    res.end(JSON.stringify({ips:getIPs().map(a=>({address:a})),port:PORT}));
  } else {
    res.writeHead(200);
    res.end(JSON.stringify({status:'ok'}));
  }
});

const wss   = new WebSocket.Server({server:srv});
const rooms = {};

function gen(){ return Math.random().toString(36).substr(2,5).toUpperCase(); }
function send(ws,obj){ if(ws&&ws.readyState===1) ws.send(JSON.stringify(obj)); }

wss.on('connection', ws=>{
  ws._room=null; ws._role=null; ws._nick='?';
  ws.on('message', raw=>{
    let m; try{ m=JSON.parse(raw); }catch{ return; }
    if(m.type==='create_room'){
      const code=gen();
      rooms[code]={host:ws,guest:null,state:'waiting'};
      ws._room=code; ws._role='host'; ws._nick=m.nick||'HOST';
      send(ws,{type:'room_created',code});
      console.log(`\n  [+] Sala criada: ${code} | host: ${ws._nick}`);
    }
    else if(m.type==='join_room'){
      const code=(m.code||'').toUpperCase();
      const rm=rooms[code];
      if(!rm||rm.state!=='waiting'){ send(ws,{type:'error',msg:'Sala nao encontrada.'}); return; }
      rm.guest=ws; rm.state='playing';
      ws._room=code; ws._role='guest'; ws._nick=m.nick||'GUEST';
      send(ws, {type:'room_joined',code});
      send(rm.host, {type:'start',first:'host'});
      send(rm.guest,{type:'start',first:'host'});
      console.log(`  [>] Sala ${code} iniciada: ${rm.host._nick} vs ${ws._nick}`);
    }
    else if(m.type==='launch'){
      const rm=rooms[ws._room]; if(!rm) return;
      const opp=ws._role==='host'?rm.guest:rm.host;
      send(opp,{type:'launch',from:m.from,to:m.to});
      send(opp,{type:'pass_turn'});
    }
    else if(m.type==='pos'){
      const rm=rooms[ws._room]; if(!rm) return;
      const opp=ws._role==='host'?rm.guest:rm.host;
      send(opp,{type:'pos',x:m.x,y:m.y,vx:m.vx,vy:m.vy});
    }
  });
  ws.on('close',()=>{
    const code=ws._room;
    if(!code||!rooms[code]) return;
    const rm=rooms[code];
    const opp=ws._role==='host'?rm.guest:rm.host;
    send(opp,{type:'opponent_disconnected'});
    console.log(`  [-] Sala ${code} encerrada.`);
    delete rooms[code];
  });
});

srv.listen(PORT, ()=>{
  const ips=getIPs();
  const w=50;
  const line='+'+'-'.repeat(w)+'+';
  console.log('\n'+line);
  console.log('|'+' CapRush WebSocket Server v3'.padEnd(w)+'|');
  console.log('|'+('  Porta: '+PORT).padEnd(w)+'|');
  console.log(line);
  if(ips.length===0){
    console.log('|  (apenas localhost — sem rede externa)'.padEnd(w+1)+'|');
  } else {
    ips.forEach(ip=>{
      const url='  http://'+ip+':8080/client/game-multi-online.html';
      console.log('| '+url.substring(0,w-1).padEnd(w-1)+'|');
    });
    console.log(line);
    console.log('|  Compartilhe um dos links acima com o oponente  |');
    console.log('|  (ambos precisam estar na mesma rede Wi-Fi)     |');
  }
  console.log(line+'\n');
});
