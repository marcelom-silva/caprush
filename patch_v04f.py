p = 'client/src/scenes/TrackV3.js'
s = open(p, 'r', encoding='utf-8').read()

# estado atual (do último ajuste)
atual = """puddleZones = [
      { x: CW*0.22, y: CH*0.66, r: TW*0.55 },
      { x: CW*0.85, y: CH*0.38, r: TW*0.55 },
    ];"""

# novo - só move as 2 marcadas para o centro da faixa
novo = """puddleZones = [
      { x: CW*0.19, y: CH*0.63, r: TW*0.55 },  // esquerda - centralizada na pista
      { x: CW*0.88, y: CH*0.40, r: TW*0.55 },  // direita - em cima do asfalto
    ];"""

s = s.replace(atual, novo)
open(p, 'w', encoding='utf-8').write(s)
print("✓ 2 poças alinhadas na pista")
