# CapRush – Documentação de Física

## Constantes

| Constante        | Valor | Descrição                              |
|------------------|-------|----------------------------------------|
| MAX_DRAG_PX      | 165   | Distância máxima de arraste (pixels)   |
| BASE_LAUNCH_SPEED| 740   | Velocidade base com power=1.0 (px/s)   |
| DRAG_RETAIN      | 0.52  | Velocidade retida por segundo (0–1)    |
| BOUNCE           | 0.30  | Coeficiente de ricochete               |
| SPIN_FACTOR      | 0.022 | Rotação por pixel de velocidade        |
| MIN_SPEED_STOP   | 14    | Limiar de parada (px/s)                |

## Fórmula de Lançamento

```
dragVec  = capPos - dragEnd
dragDist = clamp(|dragVec|, 0, MAX_DRAG_PX)
power    = (dragDist / MAX_DRAG_PX) × char.power
speed    = power × BASE_LAUNCH_SPEED
velocity = normalize(dragVec) × speed
```

## Fórmula de Arrasto (por frame)

```
retainPerSec = DRAG_RETAIN × SURFACE[type] × char.friction_resistance
retain       = retainPerSec ^ Δt
velocity    *= retain
position    += velocity × Δt
```

## Atrito por Superfície

| Superfície | Fator  | Resultado com Yuki (friction_res=0.9) |
|------------|--------|---------------------------------------|
| ASPHALT    | 0.92   | 0.52 × 0.92 × 0.9 = 0.430/s          |
| DIRT       | 0.68   | 0.52 × 0.68 × 0.9 = 0.318/s          |
| SAND       | 0.55   | 0.52 × 0.55 × 0.9 = 0.257/s          |
| WET        | 0.45   | 0.52 × 0.45 × 0.9 = 0.210/s          |
