// state.rs
// =========
// Estruturas de dados armazenadas on-chain no CapRush.

use anchor_lang::prelude::*;

/// Configuracao global do programa (PDA: "cr_config")
#[account]
pub struct CrConfig {
    pub authority:    Pubkey,  // quem pode mintar $CR
    pub cr_mint:      Pubkey,  // endereco do mint do token $CR
    pub total_minted: u64,     // total de $CR mintado (tracking)
    pub bump:         u8,
}
impl CrConfig {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 1;
}

/// Raridade de uma tampinha NFT
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum Raridade {
    Comum,
    Rara,
    Epica,
    Lendaria,
    Mitica,
}
impl Raridade {
    /// Retorna a raridade superior a maior das 3 fornecidas
    pub fn upgrade_from(arr: &[&Raridade]) -> Raridade {
        let max = arr.iter().map(|r| r.tier()).max().unwrap_or(0);
        match max {
            0 => Raridade::Rara,
            1 => Raridade::Epica,
            2 => Raridade::Lendaria,
            3 => Raridade::Mitica,
            _ => Raridade::Mitica,
        }
    }
    pub fn tier(&self) -> u8 {
        match self {
            Raridade::Comum    => 0,
            Raridade::Rara     => 1,
            Raridade::Epica    => 2,
            Raridade::Lendaria => 3,
            Raridade::Mitica   => 4,
        }
    }
}

/// Tampinha NFT (PDA: "cap" + mint_pubkey)
/// Atributos armazenados on-chain afetam diretamente a fisica do jogo.
#[account]
pub struct CapNft {
    pub owner:        Pubkey,   // dono atual
    pub velocidade:   u8,       // 0-100: afeta velocidade maxima de lancamento
    pub controle:     u8,       // 0-100: afeta precisao angular
    pub aerodinamica: u8,       // 0-100: afeta resistencia ao arrasto
    pub nome:         String,   // nome da tampinha (max 32 chars)
    pub raridade:     Raridade,
    pub corridas:     u32,      // historico de corridas
    pub staked:       bool,     // se esta travada no vault
    pub criado_em:    i64,      // unix timestamp
    pub bump:         u8,
}
impl CapNft {
    // 8 discriminator + 32 owner + 3 attrs + 4+32 nome + 1 raridade + 4 corridas + 1 staked + 8 ts + 1 bump
    pub const LEN: usize = 8 + 32 + 3 + 36 + 1 + 4 + 1 + 8 + 1 + 16;
}

/// Conta de staking (PDA: "stake" + cap_nft_pubkey)
#[account]
pub struct StakeAccount {
    pub owner:       Pubkey, // quem stakeou
    pub cap_nft:     Pubkey, // qual tampinha
    pub staked_at:   i64,    // timestamp do inicio do stake
    pub accumulated: u64,    // $CR acumulado antes do ultimo claim
    pub bump:        u8,
}
impl StakeAccount {
    pub const LEN: usize = 8 + 32 + 32 + 8 + 8 + 1;
}
