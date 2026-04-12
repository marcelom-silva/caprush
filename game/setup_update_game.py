# -*- coding: utf-8 -*-

html_code = """<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>CapRush Prototype</title>
<style>
body { margin: 0; background: #000; }
</style>
</head>
<body>

<script src="./node_modules/phaser/dist/phaser.js"></script>

<script>
(function () {

let sceneRef;
let caps = [];
let checkpoints = [];
let obstacles = [];
let trackPoints = [];
let aimLine;
let powerBar;
let turnText;
let audioCtx;

let currentPlayer = 0;
let isMoving = false;
let activeCap = null;

// 🔊 som
function playSound(freq,d=0.05){
 if(!audioCtx) return;
 let o=audioCtx.createOscillator();
 let g=audioCtx.createGain();
 o.connect(g); g.connect(audioCtx.destination);
 o.frequency.value=freq;
 g.gain.value=0.05;
 o.start(); o.stop(audioCtx.currentTime+d);
}

// 🛣️ pista curva
function createTrack(){
 for(let t=0;t<=1;t+=0.02){
  let x=(1-t)*(1-t)*100+2*(1-t)*t*300+t*t*600;
  let y=(1-t)*(1-t)*300+2*(1-t)*t*120+t*t*200;
  trackPoints.push({x,y});
 }
 for(let t=0;t<=1;t+=0.02){
  let x=(1-t)*(1-t)*600+2*(1-t)*t*800+t*t*600;
  let y=(1-t)*(1-t)*200+2*(1-t)*t*300+t*t*450;
  trackPoints.push({x,y});
 }
 for(let t=0;t<=1;t+=0.02){
  let x=(1-t)*(1-t)*600+2*(1-t)*t*300+t*t*100;
  let y=(1-t)*(1-t)*450+2*(1-t)*t*520+t*t*300;
  trackPoints.push({x,y});
 }
}

// pista check
function isOnTrack(x,y){
 for(let p of trackPoints){
  let d=Phaser.Math.Distance.Between(x,y,p.x,p.y);
  if(d<85) return true;
 }
 return false;
}

const config={
 type:Phaser.AUTO,
 width:900,
 height:600,
 backgroundColor:'#000',
 scene:{create,update}
};

new Phaser.Game(config);

function create(){

 sceneRef=this;

 createTrack();
 drawTrack();

 aimLine=this.add.graphics();
 powerBar=this.add.graphics();

 caps=[
  createCap(120,300,0xff4444,0),
  createCap(160,320,0x4488ff,1)
 ];

 createCheckpoints();
 createFinish();
 createObstacles();

 turnText=this.add.text(20,20,"",{fontSize:"20px",fill:"#00ffff"});
 updateUI();

 this.input.on('pointerdown',(p)=>{
  if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  if(isMoving) return;

  let c=getPlayerCap(p);
  if(!c) return;

  activeCap=c;
  c.dragStart={x:p.x,y:p.y};
 });

 this.input.on('pointermove',(p)=>{
  if(!activeCap) return;

  aimLine.clear();
  powerBar.clear();

  let dx=activeCap.x-p.x;
  let dy=activeCap.y-p.y;

  let dist=Math.sqrt(dx*dx+dy*dy);
  let power=Math.min(dist*0.04,6);
  let a=Math.atan2(dy,dx);

  let ex=activeCap.x+Math.cos(a)*power*30;
  let ey=activeCap.y+Math.sin(a)*power*30;

  aimLine.lineStyle(4,0x00ffff);
  aimLine.beginPath();
  aimLine.moveTo(activeCap.x,activeCap.y);
  aimLine.lineTo(ex,ey);
  aimLine.strokePath();

  powerBar.fillStyle(0x00ffcc);
  powerBar.fillRect(20,60,power*30,10);
 });

 this.input.on('pointerup',(p)=>{
  if(!activeCap||isMoving) return;

  shoot(activeCap,p);

  aimLine.clear();
  powerBar.clear();

  activeCap=null;
  isMoving=true;
 });
}

function update(){

 let moving=false;

 caps.forEach(cap=>{

  cap.x+=cap.vx;
  cap.y+=cap.vy;

  // som terreno
  if(Math.abs(cap.vx)>0.5||Math.abs(cap.vy)>0.5){
   playSound(300,0.02);
  }

  // fora pista
  if(!isOnTrack(cap.x,cap.y)){
   playSound(120);
   cap.vx*=-0.6;
   cap.vy*=-0.6;
  }

  // obstáculos
  obstacles.forEach(o=>{
   let d=Phaser.Math.Distance.Between(cap.x,cap.y,o.x,o.y);
   if(d<30){
    playSound(200);
    cap.vx*=-0.7;
    cap.vy*=-0.7;
   }
  });

  // rastro
  if(Math.abs(cap.vx)>0.5||Math.abs(cap.vy)>0.5){
   let t=sceneRef.add.circle(cap.x,cap.y,8,cap.fillColor,0.1);
   sceneRef.tweens.add({
    targets:t,alpha:0,duration:300,onComplete:()=>t.destroy()
   });
  }

  cap.vx*=0.97;
  cap.vy*=0.97;

  checkCheckpoint(cap);
  checkFinish(cap);

  if(Math.abs(cap.vx)>0.02||Math.abs(cap.vy)>0.02) moving=true;
 });

 handleCollisions();

 if(isMoving&&!moving){
  isMoving=false;
  nextTurn();
 }
}

// colisão
function handleCollisions(){
 for(let i=0;i<caps.length;i++){
  for(let j=i+1;j<caps.length;j++){
   let a=caps[i],b=caps[j];
   let dx=b.x-a.x,dy=b.y-a.y;
   let dist=Math.sqrt(dx*dx+dy*dy);

   if(dist<40){
    let nx=dx/dist,ny=dy/dist;
    let overlap=40-dist;

    a.x-=nx*overlap/2;
    a.y-=ny*overlap/2;
    b.x+=nx*overlap/2;
    b.y+=ny*overlap/2;

    let tx=a.vx;
    a.vx=b.vx;
    b.vx=tx;
   }
  }
 }
}

// desenho
function drawTrack(){
 let g=sceneRef.add.graphics();

 g.fillStyle(0x050505,1);
 g.fillRect(0,0,900,600);

 g.lineStyle(60,0x222222);
 g.beginPath();
 g.moveTo(trackPoints[0].x,trackPoints[0].y);
 trackPoints.forEach(p=>g.lineTo(p.x,p.y));
 g.closePath();
 g.strokePath();

 g.lineStyle(4,0x00ffff);
 g.beginPath();
 g.moveTo(trackPoints[0].x,trackPoints[0].y);
 trackPoints.forEach(p=>g.lineTo(p.x,p.y));
 g.closePath();
 g.strokePath();
}

// chegada
let finish;

function createFinish(){
 finish={x:trackPoints[0].x,y:trackPoints[0].y};
 sceneRef.add.circle(finish.x,finish.y,15,0xffffff);
}

// checkpoints
function createCheckpoints(){
 checkpoints=[
  {x:300,y:200},
  {x:700,y:300},
  {x:300,y:480}
 ];

 checkpoints.forEach(cp=>{
  sceneRef.add.circle(cp.x,cp.y,10,0xffff00);
 });
}

// obstáculos
function createObstacles(){
 obstacles=[
  {x:500,y:260},
  {x:400,y:400}
 ];

 obstacles.forEach(o=>{
  sceneRef.add.circle(o.x,o.y,12,0xff0000);
 });
}

function checkCheckpoint(cap){
 let cp=checkpoints[cap.checkpoint];
 if(!cp) return;

 let d=Phaser.Math.Distance.Between(cap.x,cap.y,cp.x,cp.y);
 if(d<25){
  playSound(800);
  cap.checkpoint++;
 }
}

function checkFinish(cap){
 if(cap.checkpoint<checkpoints.length) return;

 let d=Phaser.Math.Distance.Between(cap.x,cap.y,finish.x,finish.y);
 if(d<30){
  alert("🏁 Jogador "+(cap.owner+1)+" venceu!");
  location.reload();
 }
}

// tampinha
function createCap(x,y,color,owner){
 let c=sceneRef.add.circle(x,y,20,color);
 c.vx=0;c.vy=0;
 c.owner=owner;
 c.checkpoint=0;
 return c;
}

// tiro
function shoot(cap,p){
 let dx=cap.dragStart.x-p.x;
 let dy=cap.dragStart.y-p.y;

 let power=Math.min(Math.sqrt(dx*dx+dy*dy)*0.04,6);
 let a=Math.atan2(dy,dx);

 cap.vx=Math.cos(a)*power;
 cap.vy=Math.sin(a)*power;
}

// utils
function getClosestCap(p){
 let min=9999,sel=null;
 caps.forEach(c=>{
  let d=Phaser.Math.Distance.Between(p.x,p.y,c.x,c.y);
  if(d<min){min=d;sel=c;}
 });
 return sel;
}

function getPlayerCap(p){
 let c=getClosestCap(p);
 return c&&c.owner===currentPlayer?c:null;
}

function nextTurn(){
 currentPlayer=(currentPlayer+1)%2;
 updateUI();
}

function updateUI(){
 turnText.setText("Turno: Jogador "+(currentPlayer+1));
}

})();
</script>

</body>
</html>
"""

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html_code)

print("🔥 V10.6 BASE RESTAURADA COM FEATURES!")
