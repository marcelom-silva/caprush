#!/usr/bin/env python3
# server.py - Backend CapRush | Flask + SQLite
# pip install flask flask-cors
# python server.py
from flask import Flask,request,jsonify
from flask_cors import CORS
import sqlite3,os,time
app=Flask(__name__)
CORS(app)
DB=os.path.join(os.path.dirname(__file__),'caprush.db')
def db():
    c=sqlite3.connect(DB);c.row_factory=sqlite3.Row;return c
def init():
    with db() as c:
        c.execute("CREATE TABLE IF NOT EXISTS scores(id INTEGER PRIMARY KEY AUTOINCREMENT,piloto TEXT,pista TEXT,tempo REAL,ts INTEGER DEFAULT(strftime('%s','now')))");c.commit()
    print('DB ok:',DB)
@app.route('/api/scores',methods=['GET'])
def ls():
    p=request.args.get('pista','Terra e Cascalho')
    with db() as c:
        rows=c.execute('SELECT piloto,pista,tempo,ts FROM scores WHERE pista=? ORDER BY tempo LIMIT 20',(p,)).fetchall()
    return jsonify([dict(r) for r in rows])
@app.route('/api/scores',methods=['POST'])
def add():
    d=request.get_json(force=True)
    pi=str(d.get('piloto','?'))[:32];pi2=str(d.get('pista','Terra e Cascalho'))[:64]
    t=float(d.get('tempo',0))
    if t<=0:return jsonify({'error':'tempo invalido'}),400
    with db() as c:
        c.execute('INSERT INTO scores(piloto,pista,tempo) VALUES(?,?,?)',(pi,pi2,t));c.commit()
    print('Score:',pi,pi2,round(t,2),'s')
    return jsonify({'ok':True}),201
@app.route('/api/scores/<p>',methods=['GET'])
def best(p):
    with db() as c:
        r=c.execute('SELECT MIN(tempo) as m FROM scores WHERE piloto=?',(p,)).fetchone()
    return jsonify({'piloto':p,'melhor':r['m'] if r else None})
@app.route('/api/health')
def health():return jsonify({'ok':True,'ts':int(time.time())})
if __name__=='__main__':
    init();print('CapRush Server -> http://localhost:5000')
    app.run(host='0.0.0.0',port=5000,debug=True)
