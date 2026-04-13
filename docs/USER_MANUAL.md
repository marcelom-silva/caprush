# CapRush – Overdrive! | Manual do Usuário v1.1

## Idiomas Suportados

Use os botões no canto superior direito: 🇧🇷 PT | 🇺🇸 EN | 🇪🇸 ES

---

## Como Jogar

1. Clique e **segure** próximo à sua tampinha
2. **Arraste para trás** (direção oposta ao alvo)
3. **Solte** — quanto mais longe arrastar, mais força

A **trajetória prevista** aparece como pontinhos brancos enquanto você mira.

---

## Superfícies da Pista

| Superfície | Efeito na Física | Visual |
|-----------|-----------------|--------|
| Asfalto (marrom) | Normal — retain 88%/s | Cor base da pista |
| Grama (verde listrado) | **Desliza mais** — retain 97%/s | Verde com listras |
| Água (blob azul orgânico) | **Freia pesado** — retain 30%/s | Azul irregular |
| Arquibancada (amarelo) | **Bounce forte** e=0.70 | Amarelo escalonado + torcida |
| Paddock/Boxes (laranja) | **Perde 1 turno** (1v1 e online) | Laranja com garagens |

---

## Personagens

| Piloto | Espécie | Power | Precisão | Atrito |
|--------|---------|-------|----------|--------|
| **Yuki** | Samoieda ♂ | 1.4× | 0.6× | 0.9× |
| **Kenta** | Maine Coon ♂ | 0.8× | 1.4× | 1.0× |
| **Bruna** | SRD ♀ (laço) | 1.0× | 1.0× | 1.1× |
| **Tapz** | Golden ♀ (asas + halo + laço) | 0.7× | 1.2× | 1.3× |

---

## Modos de Jogo

- **Solo** — você + 2 bots com IA (turnos alternados: você, bot1, bot2)
- **1v1 Local** — dois jogadores no mesmo navegador, alternando turnos
- **1v1 Online** — via WebSocket; veja `docs/ONLINE_GUIDE.md`

---

## Comandos

```
Iniciar servidor do jogo:
  cd C:\Users\User\Cryptos\projects\caprush
  python -m http.server 8080
  Navegador: http://localhost:8080/client/caprush-game-v2.html

Iniciar servidor de ranking:
  cd server
  python server.py

Iniciar servidor online:
  cd server
  node ws-server.js
```

---

## Estrutura do Repositório

```
caprush/                          ← raiz do repositório
├── builder_phase1_complete.py    ← execute este para gerar tudo
├── client/
│   └── caprush-game-v2.html     ← JOGO PRINCIPAL
├── server/
│   ├── ws-server.js             ← Servidor modo online
│   ├── server.py                ← API de ranking
│   └── schema.sql               ← Banco SQLite
├── docs/
│   ├── USER_MANUAL.md
│   ├── ONLINE_GUIDE.md
│   ├── ARCHITECTURE.md
│   └── PHYSICS.md
└── git_commands.sh              ← Comandos Git prontos
```
