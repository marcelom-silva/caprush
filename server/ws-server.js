/**
 * CapRush ws-server.js
 * Porta 3001 - WebSocket + HTTP
 * Executar: node ws-server.js (dentro de server/)
 */
const WebSocket=require('ws');
const http=require('http');
const os=require('os');
const PORT=3001;
function getIPs(){const r=[];for(const[,ifaces]of Object.entries(os.networkInterfaces()))for(const i of ifaces)if(i.family==='IPv4'&&!i.internal)r.push({address:i.address});return r;}
const srv=http.createServer((req,res)=>{res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Content-Type','application/json');if(req.url==='/info'){res.writeHead(200);res.end(JSON.stringify({ips:getIPs(),port:PORT}));}else{res.writeHead(200);res.end(JSON.stringify({status:'ok'}));}});
const wss=new WebSocket.Server({server:srv});
const rooms={};
function gen(){return Math.random().toString(36).substr(2,5).toUpperCase();}
function send(ws,obj){if(ws&&ws.readyState===1)ws.send(JSON.stringify(obj));}
wss.on('connection',ws=>{
  ws._room=null;ws._role=null;
  ws.on('message',raw=>{
    let m;try{m=JSON.parse(raw);}catch{return;}
    if(m.type==='create_room'){const code=gen();rooms[code]={host:ws,guest:null,state:'waiting'};ws._room=code;ws._role='host';send(ws,{type:'room_created',code});console.log('[SALA] '+code);}
    else if(m.type==='join_room'){const code=(m.code||'').toUpperCase();const rm=rooms[code];if(!rm||rm.state!=='waiting'){send(ws,{type:'error',msg:'Sala nao encontrada.'});return;}rm.guest=ws;rm.state='playing';ws._room=code;ws._role='guest';send(ws,{type:'room_joined',code});send(rm.host,{type:'start',first:'host'});send(rm.guest,{type:'start',first:'host'});console.log('[SALA] '+code+' iniciado!');}
    else if(m.type==='launch'){const rm=rooms[ws._room];if(!rm)return;const opp=ws._role==='host'?rm.guest:rm.host;send(opp,{type:'launch',from:m.from,to:m.to});send(opp,{type:'pass_turn'});}
    else if(m.type==='pos'){const rm=rooms[ws._room];if(!rm)return;const opp=ws._role==='host'?rm.guest:rm.host;send(opp,{type:'pos',x:m.x,y:m.y,vx:m.vx,vy:m.vy});}
  });
  ws.on('close',()=>{const code=ws._room;if(!code||!rooms[code])return;const opp=ws._role==='host'?rooms[code].guest:rooms[code].host;send(opp,{type:'opponent_disconnected'});delete rooms[code];console.log('[SALA] '+code+' encerrada.');});
});
srv.listen(PORT,()=>{
  const ips=getIPs();
  console.log('\n+-------------------------------------------+');
  console.log('| CapRush WebSocket Server  porta: '+PORT+'    |');
  console.log('+-------------------------------------------+');
  ips.forEach(ip=>console.log('| Link: http://'+ip.address+':8080/client/caprush-game-v2.html'));
  console.log('+-------------------------------------------+\n');
});
