# Como Jogar CapRush - Prototype v0.2

## Passo a Passo

1) python setup_project.py    (uma vez, instala dependencias)

2) Terminal 1:
   cd server
   python server.py

3) Terminal 2:
   cd client
   python -m http.server 3000

4) Abrir no Chrome: http://localhost:3000

## Controles

- Clique na tampinha e arraste para tras da direcao que quer ir
- Solte para lancar
- Passe pelos 3 checkpoints e complete 2 voltas

## Fisica

- Arraste max: 165px -> velocidade max 740px/s
- Arrasto: Terra 1.0x | Areia 1.6x | Asfalto 0.7x
- Ricochete: coeficiente 0.72

## Observacao

O servidor e opcional. Se nao estiver rodando,
o jogo funciona mas o ranking nao sera salvo.
