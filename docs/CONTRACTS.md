# CapRush - Smart Contracts (Fase 2)

## Stack

- Solana / Fogo SVM (compativel com Solana Virtual Machine)
- Anchor Framework 0.29
- Rust 1.75+

## Contratos

### 1. NFT de Tampinha (CapNft)

PDA: `["cap", mint_pubkey]`

Atributos armazenados on-chain:
| Campo         | Tipo | Descricao                              |
|---------------|------|----------------------------------------|
| velocidade    | u8   | 0-100. Multiplica velocidade de lancamento |
| controle      | u8   | 0-100. Reduz erro angular              |
| aerodinamica  | u8   | 0-100. Reduz arrasto                   |
| raridade      | enum | Comum/Rara/Epica/Lendaria/Mitica       |
| corridas      | u32  | Historico de corridas completas        |
| staked        | bool | Se esta no vault de staking            |

### 2. Token $CR

- Decimais: 6
- Mintagem: controlada pelo programa (PDA como authority)
- Ganho por: corridas (0.1 $CR), staking (0.001 $CR/s), bônus de lap rapido

### 3. Staking

- Vault PDA: `["stake", cap_nft_pubkey]`
- Fluxo: stake_cap -> claim_cr (opcional) -> unstake_cap
- NFT transferido para vault enquanto stakeado

### 4. Crafting Deflacionario

- Combina 3 tampinhas -> 1 nova de raridade superior
- 2 tampinhas sao queimadas (deflacao de supply)
- Atributos da nova = media dos 3 + 10% de bonus

## Deploy (Devnet)

```bash
# Instalar Anchor CLI
npm install -g @coral-xyz/anchor-cli

# Instalar Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Configurar Solana CLI para Devnet
solana config set --url devnet

# Compilar
cd anchor
anchor build

# Testar
anchor test

# Deploy
anchor deploy --provider.cluster devnet
```

## Integracao com o Jogo

O GameLoop.js chama `postScore()` ao fim de cada corrida.
O backend Python valida e assina a transacao `record_race_result`.
O $CR e mintado diretamente na carteira do jogador on-chain.
