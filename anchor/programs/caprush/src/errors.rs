// errors.rs
// ==========
// Erros customizados do programa CapRush.

use anchor_lang::prelude::*;

#[error_code]
pub enum CapRushError {
    #[msg("Atributo fora do intervalo 0-100")]
    AtributoInvalido,

    #[msg("Nome da tampinha excede 32 caracteres")]
    NomeMuitoLongo,

    #[msg("Esta tampinha ja esta stakeada")]
    JaStakado,

    #[msg("Nenhum $CR para resgatar")]
    SemRecompensa,

    #[msg("Uma ou mais tampinhas estao stakeadas - desstake antes do crafting")]
    CapStakada,

    #[msg("Tampinha nao pertence a este usuario")]
    DonoDiferente,

    #[msg("Assinatura do servidor invalida")]
    AssinaturaInvalida,
}
