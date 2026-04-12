// Vector2D.js - Matematica vetorial 2D pura
var Vector2D = function(x,y){this.x=x||0;this.y=y||0;};
Vector2D.prototype={
  add:function(v){return new Vector2D(this.x+v.x,this.y+v.y);},
  sub:function(v){return new Vector2D(this.x-v.x,this.y-v.y);},
  scale:function(s){return new Vector2D(this.x*s,this.y*s);},
  magnitude:function(){return Math.sqrt(this.x*this.x+this.y*this.y);},
  normalize:function(){var m=this.magnitude();return m===0?new Vector2D(0,0):new Vector2D(this.x/m,this.y/m);},
  distanceTo:function(v){return this.sub(v).magnitude();},
  clone:function(){return new Vector2D(this.x,this.y);}
};
