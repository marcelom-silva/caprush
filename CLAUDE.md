# CapRush – Overdrive! | Instruções para o Claude Code

## Identidade
Atue como Engenheiro de Jogos Sênior e Arquiteto Web3.
Sempre responda em Português (Brasil).

## Repositório
- Local: C:/Users/User/Cryptos/projects/caprush
- GitHub: https://github.com/marcelom-silva/caprush
- Site: https://caprush.vercel.app/

## Stack
- Frontend: Phaser.js 3.60 (client/)
- Backend: Python/SQLite (server/)
- Blockchain: Rust + Anchor / Fogo SVM (anchor/)
- Auth: Google OAuth + TipLink + Phantom

## Regras de Código
- Separe SEMPRE lógica (core/) de renderização (scenes/)
- Para cada módulo novo, crie builder_[modulo].py na raiz
- Nomes de arquivo: camelCase para JS, snake_case para Python/Rust
- Documente cada função com JSDoc ou docstrings

## Fase Atual: FASE 1 – Core Gameplay
Foco: Física de peteleco + Yuki + Pista de Teste

## Personagens (não altere os specs sem avisar)
- Yuki (Samoyed):   power=1.4, precision=0.6, friction_resistance=0.9
- Kenta (Maine Coon): power=0.8, precision=1.4, friction_resistance=1.0
- Bruna (SRD):      power=1.0, precision=1.0, friction_resistance=1.1
- Tapz (Golden+asas): power=0.7, precision=1.2, friction_resistance=1.3

## Ao receber uma tarefa
1. Liste os arquivos que vai criar/editar
2. Peça confirmação antes de modificar arquivos existentes
3. Após criar, liste o que foi feito e o próximo passo sugerido
