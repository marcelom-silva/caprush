"""
builder_contracts.py
====================
CapRush - Overdrive! | FASE 2 - Smart Contracts Anchor (Solana/Fogo SVM)

Gera:
  anchor/programs/caprush/src/lib.rs          - Programa principal Anchor
  anchor/programs/caprush/src/state.rs        - Estruturas de estado on-chain
  anchor/programs/caprush/src/errors.rs       - Erros customizados
  anchor/programs/caprush/Cargo.toml          - Dependencias Rust
  anchor/Anchor.toml                          - Config Anchor
  anchor/tests/caprush.ts                     - Testes basicos TypeScript
  docs/CONTRACTS.md                           - Documentacao dos contratos

Contratos implementados:
  1. NFT de Tampinha     - mint com atributos funcionais (vel, ctrl, aero)
  2. Token $CR           - token fungivel de recompensa
  3. Staking             - trava tampinha NFT, ganha $CR por tempo
  4. Crafting deflacionario - combina 3 tampinhas -> 1 superior (queima 2)

Execute: python builder_contracts.py
"""
import os
ROOT = os.path.dirname(os.path.abspath(__file__))

def w(rel, txt):
    p = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(txt)
    print("  OK  " + rel)

def d(rel):
    os.makedirs(os.path.join(ROOT, rel), exist_ok=True)
    print("  DIR " + rel)

# ---------------------------------------------------------------------------
LIB_RS = """// lib.rs
// =======
// Programa principal CapRush na Solana/Fogo SVM via Anchor Framework.
//
// Instrucoes:
//   initialize_cr_token  - Cria o mint do token $CR (uma vez)
//   mint_cap_nft         - Mintera uma tampinha NFT com atributos
//   stake_cap            - Trava uma tampinha para ganhar $CR
//   claim_cr             - Resgata $CR acumulado no staking
//   unstake_cap          - Destrava a tampinha
//   craft_cap            - Combina 3 tampinhas -> 1 superior (queima 2)
//   record_race_result   - Registra resultado de corrida e distribui $CR

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, MintTo, Burn};
use anchor_spl::associated_token::AssociatedToken;

pub mod state;
pub mod errors;
use state::*;
use errors::CapRushError;

declare_id!("CAPRush1111111111111111111111111111111111111");

// Recompensa por segundo de staking (em lamports de $CR, 6 decimais)
const CR_PER_SECOND: u64 = 1_000; // 0.001 $CR por segundo
// Recompensa por corrida completada
const CR_PER_RACE: u64   = 100_000; // 0.1 $CR
// Bonus por volta rapida (sub 60s)
const CR_FAST_LAP: u64   = 50_000; // 0.05 $CR bonus

#[program]
pub mod caprush {
    use super::*;

    /// Cria o mint do token $CR. Deve ser chamado uma vez pelo deployer.
    pub fn initialize_cr_token(
        ctx: Context<InitializeCrToken>,
        decimals: u8,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority   = ctx.accounts.authority.key();
        config.cr_mint     = ctx.accounts.cr_mint.key();
        config.total_minted = 0;
        config.bump        = ctx.bumps.config;
        msg!("$CR Token inicializado: {}", config.cr_mint);
        Ok(())
    }

    /// Mintera uma tampinha NFT com atributos funcionais.
    /// Os atributos sao armazenados on-chain e afetam a fisica do jogo.
    pub fn mint_cap_nft(
        ctx: Context<MintCapNft>,
        velocidade:   u8,  // 0-100
        controle:     u8,  // 0-100
        aerodinamica: u8,  // 0-100
        nome:         String,
        raridade:     Raridade,
    ) -> Result<()> {
        require!(velocidade   <= 100, CapRushError::AtributoInvalido);
        require!(controle     <= 100, CapRushError::AtributoInvalido);
        require!(aerodinamica <= 100, CapRushError::AtributoInvalido);
        require!(nome.len()   <= 32,  CapRushError::NomeMuitoLongo);

        let cap = &mut ctx.accounts.cap_nft;
        cap.owner        = ctx.accounts.owner.key();
        cap.velocidade   = velocidade;
        cap.controle     = controle;
        cap.aerodinamica = aerodinamica;
        cap.nome         = nome.clone();
        cap.raridade     = raridade;
        cap.corridas     = 0;
        cap.staked       = false;
        cap.criado_em    = Clock::get()?.unix_timestamp;
        cap.bump         = ctx.bumps.cap_nft;

        // Mintera 1 NFT (supply = 1, sem decimais)
        let seeds = &[b"cr_config".as_ref(), &[ctx.accounts.config.bump]];
        let signer = &[&seeds[..]];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint:      ctx.accounts.nft_mint.to_account_info(),
                    to:        ctx.accounts.owner_token_account.to_account_info(),
                    authority: ctx.accounts.config.to_account_info(),
                },
                signer,
            ),
            1,
        )?;

        msg!("NFT mintado: {} | vel:{} ctrl:{} aero:{}", nome, velocidade, controle, aerodinamica);
        Ok(())
    }

    /// Trava a tampinha NFT para comecar a acumular $CR.
    pub fn stake_cap(ctx: Context<StakeCap>) -> Result<()> {
        let cap = &mut ctx.accounts.cap_nft;
        require!(!cap.staked, CapRushError::JaStakado);

        let stake = &mut ctx.accounts.stake_account;
        stake.owner       = ctx.accounts.owner.key();
        stake.cap_nft     = cap.key();
        stake.staked_at   = Clock::get()?.unix_timestamp;
        stake.accumulated = 0;
        stake.bump        = ctx.bumps.stake_account;

        cap.staked = true;

        // Transfere NFT para o vault do programa
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from:      ctx.accounts.owner_nft_account.to_account_info(),
                    to:        ctx.accounts.vault_nft_account.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            1,
        )?;

        msg!("Tampinha stakeada. Acumulando $CR...");
        Ok(())
    }

    /// Resgata $CR acumulado sem desstakar a tampinha.
    pub fn claim_cr(ctx: Context<ClaimCr>) -> Result<()> {
        let now    = Clock::get()?.unix_timestamp;
        let stake  = &mut ctx.accounts.stake_account;
        let elapsed = (now - stake.staked_at) as u64;
        let earned  = elapsed * CR_PER_SECOND + stake.accumulated;

        require!(earned > 0, CapRushError::SemRecompensa);

        // Mintera $CR para o jogador
        let config = &ctx.accounts.config;
        let seeds  = &[b"cr_config".as_ref(), &[config.bump]];
        let signer = &[&seeds[..]];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint:      ctx.accounts.cr_mint.to_account_info(),
                    to:        ctx.accounts.owner_cr_account.to_account_info(),
                    authority: config.to_account_info(),
                },
                signer,
            ),
            earned,
        )?;

        // Reseta contador
        stake.staked_at   = now;
        stake.accumulated = 0;

        msg!("$CR resgatado: {}", earned);
        Ok(())
    }

    /// Destrava a tampinha, para de acumular $CR e devolve o NFT.
    pub fn unstake_cap(ctx: Context<UnstakeCap>) -> Result<()> {
        let now    = Clock::get()?.unix_timestamp;
        let stake  = &ctx.accounts.stake_account;
        let cap    = &mut ctx.accounts.cap_nft;
        let elapsed = (now - stake.staked_at) as u64;
        let earned  = elapsed * CR_PER_SECOND + stake.accumulated;

        // Mintera $CR acumulado antes de desstakar
        if earned > 0 {
            let config = &ctx.accounts.config;
            let seeds  = &[b"cr_config".as_ref(), &[config.bump]];
            let signer = &[&seeds[..]];
            token::mint_to(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    MintTo {
                        mint:      ctx.accounts.cr_mint.to_account_info(),
                        to:        ctx.accounts.owner_cr_account.to_account_info(),
                        authority: config.to_account_info(),
                    },
                    signer,
                ),
                earned,
            )?;
        }

        // Devolve o NFT
        let vault_seeds = &[b"vault".as_ref(), cap.key().as_ref(), &[ctx.bumps.vault_nft_account]];
        let vault_signer = &[&vault_seeds[..]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from:      ctx.accounts.vault_nft_account.to_account_info(),
                    to:        ctx.accounts.owner_nft_account.to_account_info(),
                    authority: ctx.accounts.vault_nft_account.to_account_info(),
                },
                vault_signer,
            ),
            1,
        )?;

        cap.staked = false;
        msg!("Unstake completo. $CR mintado: {}", earned);
        Ok(())
    }

    /// Crafting deflacionario: combina 3 tampinhas -> 1 superior.
    /// As 2 tampinhas de menor raridade sao queimadas (deflacao).
    /// A tampinha resultante tem atributos medios + bonus de 10%.
    pub fn craft_cap(
        ctx: Context<CraftCap>,
        novo_nome: String,
    ) -> Result<()> {
        let cap1 = &ctx.accounts.cap_nft_1;
        let cap2 = &ctx.accounts.cap_nft_2;
        let cap3 = &ctx.accounts.cap_nft_3;

        require!(!cap1.staked && !cap2.staked && !cap3.staked, CapRushError::CapStakada);

        // Atributos da nova tampinha = media + 10% de bonus
        let nova_vel   = ((cap1.velocidade   as u16 + cap2.velocidade   as u16 + cap3.velocidade   as u16) / 3 * 11 / 10).min(100) as u8;
        let nova_ctrl  = ((cap1.controle     as u16 + cap2.controle     as u16 + cap3.controle     as u16) / 3 * 11 / 10).min(100) as u8;
        let nova_aero  = ((cap1.aerodinamica as u16 + cap2.aerodinamica as u16 + cap3.aerodinamica as u16) / 3 * 11 / 10).min(100) as u8;

        // Determina raridade da nova tampinha (superior a maior das 3)
        let nova_raridade = Raridade::upgrade_from(&[&cap1.raridade, &cap2.raridade, &cap3.raridade]);

        // Queima os NFTs 1 e 2 (deflacao)
        token::burn(
            CpiContext::new(ctx.accounts.token_program.to_account_info(),
                Burn { mint: ctx.accounts.nft_mint_1.to_account_info(),
                       from: ctx.accounts.owner_nft_1.to_account_info(),
                       authority: ctx.accounts.owner.to_account_info() }), 1)?;
        token::burn(
            CpiContext::new(ctx.accounts.token_program.to_account_info(),
                Burn { mint: ctx.accounts.nft_mint_2.to_account_info(),
                       from: ctx.accounts.owner_nft_2.to_account_info(),
                       authority: ctx.accounts.owner.to_account_info() }), 1)?;

        // Cria a nova tampinha on-chain
        let nova_cap = &mut ctx.accounts.new_cap_nft;
        nova_cap.owner        = ctx.accounts.owner.key();
        nova_cap.velocidade   = nova_vel;
        nova_cap.controle     = nova_ctrl;
        nova_cap.aerodinamica = nova_aero;
        nova_cap.nome         = novo_nome.clone();
        nova_cap.raridade     = nova_raridade;
        nova_cap.corridas     = 0;
        nova_cap.staked       = false;
        nova_cap.criado_em    = Clock::get()?.unix_timestamp;
        nova_cap.bump         = ctx.bumps.new_cap_nft;

        msg!("Crafting! Nova tampinha: {} | vel:{} ctrl:{} aero:{}", novo_nome, nova_vel, nova_ctrl, nova_aero);
        Ok(())
    }

    /// Registra resultado de corrida e distribui $CR ao vencedor.
    /// Chamado pelo backend apos validar a corrida (assinatura do servidor).
    pub fn record_race_result(
        ctx: Context<RecordRaceResult>,
        tempo_segundos: u32,
        checkpoints:    u8,
        voltas:         u8,
    ) -> Result<()> {
        let cap = &mut ctx.accounts.cap_nft;
        cap.corridas += 1;

        let mut recompensa = CR_PER_RACE;

        // Bonus por corrida rapida (sub 60s)
        if tempo_segundos < 60 {
            recompensa += CR_FAST_LAP;
        }

        // Bonus por voltas extras
        recompensa += (voltas as u64).saturating_sub(1) * 20_000;

        let config = &ctx.accounts.config;
        let seeds  = &[b"cr_config".as_ref(), &[config.bump]];
        let signer = &[&seeds[..]];
        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint:      ctx.accounts.cr_mint.to_account_info(),
                    to:        ctx.accounts.owner_cr_account.to_account_info(),
                    authority: config.to_account_info(),
                },
                signer,
            ),
            recompensa,
        )?;

        msg!("Corrida #{} | Tempo:{}s | $CR: {}", cap.corridas, tempo_segundos, recompensa);
        Ok(())
    }
}

// ─────────────────────────────────────────────────────────
// CONTEXTOS (accounts de cada instrucao)
// ─────────────────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeCrToken<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    #[account(
        init, payer = authority,
        space = CrConfig::LEN,
        seeds = [b"cr_config"], bump
    )]
    pub config:   Account<'info, CrConfig>,
    #[account(mut)] pub cr_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program:  Program<'info, Token>,
    pub rent:           Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(velocidade: u8, controle: u8, aerodinamica: u8, nome: String)]
pub struct MintCapNft<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    #[account(seeds = [b"cr_config"], bump = config.bump)]
    pub config: Account<'info, CrConfig>,
    #[account(
        init, payer = owner,
        space = CapNft::LEN,
        seeds = [b"cap", nft_mint.key().as_ref()], bump
    )]
    pub cap_nft: Account<'info, CapNft>,
    #[account(mut)] pub nft_mint: Account<'info, Mint>,
    #[account(mut)] pub owner_token_account: Account<'info, TokenAccount>,
    pub token_program:   Program<'info, Token>,
    pub system_program:  Program<'info, System>,
    pub rent:            Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct StakeCap<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    #[account(mut, has_one = owner)] pub cap_nft: Account<'info, CapNft>,
    #[account(
        init, payer = owner, space = StakeAccount::LEN,
        seeds = [b"stake", cap_nft.key().as_ref()], bump
    )]
    pub stake_account: Account<'info, StakeAccount>,
    #[account(mut)] pub owner_nft_account:  Account<'info, TokenAccount>,
    #[account(mut)] pub vault_nft_account:  Account<'info, TokenAccount>,
    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent:           Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct ClaimCr<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    #[account(seeds = [b"cr_config"], bump = config.bump)]
    pub config: Account<'info, CrConfig>,
    #[account(mut, has_one = owner, seeds = [b"stake", stake_account.cap_nft.as_ref()], bump = stake_account.bump)]
    pub stake_account:    Account<'info, StakeAccount>,
    #[account(mut)] pub cr_mint:          Account<'info, Mint>,
    #[account(mut)] pub owner_cr_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UnstakeCap<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    #[account(seeds = [b"cr_config"], bump = config.bump)]
    pub config: Account<'info, CrConfig>,
    #[account(mut, has_one = owner)] pub cap_nft: Account<'info, CapNft>,
    #[account(mut, close = owner, has_one = owner,
              seeds = [b"stake", cap_nft.key().as_ref()], bump = stake_account.bump)]
    pub stake_account:    Account<'info, StakeAccount>,
    #[account(mut)] pub cr_mint:           Account<'info, Mint>,
    #[account(mut)] pub owner_cr_account:  Account<'info, TokenAccount>,
    #[account(mut)] pub owner_nft_account: Account<'info, TokenAccount>,
    #[account(mut, seeds = [b"vault", cap_nft.key().as_ref()], bump)]
    pub vault_nft_account: Account<'info, TokenAccount>,
    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CraftCap<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    #[account(mut, has_one = owner)] pub cap_nft_1: Account<'info, CapNft>,
    #[account(mut, has_one = owner)] pub cap_nft_2: Account<'info, CapNft>,
    #[account(mut, has_one = owner)] pub cap_nft_3: Account<'info, CapNft>,
    #[account(mut)] pub nft_mint_1: Account<'info, Mint>,
    #[account(mut)] pub nft_mint_2: Account<'info, Mint>,
    #[account(mut)] pub owner_nft_1: Account<'info, TokenAccount>,
    #[account(mut)] pub owner_nft_2: Account<'info, TokenAccount>,
    #[account(
        init, payer = owner, space = CapNft::LEN,
        seeds = [b"cap", new_nft_mint.key().as_ref()], bump
    )]
    pub new_cap_nft:  Account<'info, CapNft>,
    #[account(mut)] pub new_nft_mint: Account<'info, Mint>,
    pub token_program:  Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent:           Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct RecordRaceResult<'info> {
    #[account(mut)] pub server_signer: Signer<'info>, // backend assina
    #[account(seeds = [b"cr_config"], bump = config.bump)]
    pub config: Account<'info, CrConfig>,
    #[account(mut)] pub cap_nft:          Account<'info, CapNft>,
    #[account(mut)] pub cr_mint:          Account<'info, Mint>,
    #[account(mut)] pub owner_cr_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}
"""

STATE_RS = """// state.rs
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
"""

ERRORS_RS = """// errors.rs
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
"""

CARGO_TOML = """[package]
name    = "caprush"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "caprush"

[features]
no-entrypoint  = []
no-idl         = []
no-log-ix-name = []
cpi            = ["no-entrypoint"]
default        = []

[dependencies]
anchor-lang = { version = "0.29.0", features = ["init-if-needed"] }
anchor-spl  = { version = "0.29.0", features = ["token", "associated_token"] }
"""

ANCHOR_TOML = """[features]
seeds      = true
skip-lint  = false

[programs.localnet]
caprush = "CAPRush1111111111111111111111111111111111111"

[programs.devnet]
caprush = "CAPRush1111111111111111111111111111111111111"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Devnet"
wallet   = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"
"""

TEST_TS = """// tests/caprush.ts
// =================
// Testes basicos dos contratos CapRush com Anchor + Mocha
// Rodar: anchor test

import * as anchor from "@coral-xyz/anchor";
import { Program }  from "@coral-xyz/anchor";
import { Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { assert } from "chai";

describe("caprush", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program  = anchor.workspace.Caprush as Program;
  const authority = provider.wallet as anchor.Wallet;

  let crMint:       anchor.web3.PublicKey;
  let nftMint:      anchor.web3.PublicKey;
  let configPda:    anchor.web3.PublicKey;
  let configBump:   number;

  before(async () => {
    // Airdrop para cobrir taxas
    const sig = await provider.connection.requestAirdrop(
      authority.publicKey, 2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Deriva PDA da config
    [configPda, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("cr_config")],
      program.programId
    );

    // Cria mint do $CR (6 decimais)
    crMint = await createMint(
      provider.connection, authority.payer,
      configPda, null, 6
    );

    // Cria mint do NFT (0 decimais, supply=1)
    const nftMintKp = Keypair.generate();
    nftMint = nftMintKp.publicKey;
    await createMint(
      provider.connection, authority.payer,
      configPda, null, 0, nftMintKp
    );
  });

  it("Inicializa token $CR", async () => {
    await program.methods
      .initializeCrToken(6)
      .accounts({
        authority:     authority.publicKey,
        config:        configPda,
        crMint:        crMint,
        systemProgram: SystemProgram.programId,
        tokenProgram:  TOKEN_PROGRAM_ID,
      })
      .rpc();

    const config = await program.account.crConfig.fetch(configPda);
    assert.equal(config.crMint.toString(), crMint.toString());
    console.log("  Config PDA:", configPda.toString());
  });

  it("Mintera tampinha NFT com atributos", async () => {
    const ownerAta = await getOrCreateAssociatedTokenAccount(
      provider.connection, authority.payer, nftMint, authority.publicKey
    );

    const [capPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("cap"), nftMint.toBuffer()],
      program.programId
    );

    await program.methods
      .mintCapNft(82, 91, 75, "YUKI-001", { lendaria: {} })
      .accounts({
        owner:            authority.publicKey,
        config:           configPda,
        capNft:           capPda,
        nftMint:          nftMint,
        ownerTokenAccount: ownerAta.address,
        tokenProgram:     TOKEN_PROGRAM_ID,
        systemProgram:    SystemProgram.programId,
      })
      .rpc();

    const cap = await program.account.capNft.fetch(capPda);
    assert.equal(cap.velocidade,   82);
    assert.equal(cap.controle,     91);
    assert.equal(cap.aerodinamica, 75);
    assert.equal(cap.nome,         "YUKI-001");
    console.log("  Tampinha mintada:", capPda.toString());
  });

  it("Registra resultado de corrida e distribui $CR", async () => {
    const ownerCrAta = await getOrCreateAssociatedTokenAccount(
      provider.connection, authority.payer, crMint, authority.publicKey
    );

    const [capPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("cap"), nftMint.toBuffer()],
      program.programId
    );

    await program.methods
      .recordRaceResult(45, 3, 2) // 45s, 3 CPs, 2 voltas
      .accounts({
        serverSigner:    authority.publicKey,
        config:          configPda,
        capNft:          capPda,
        crMint:          crMint,
        ownerCrAccount:  ownerCrAta.address,
        tokenProgram:    TOKEN_PROGRAM_ID,
      })
      .rpc();

    const bal = await provider.connection.getTokenAccountBalance(ownerCrAta.address);
    console.log("  $CR recebido:", bal.value.uiAmount);
    assert.isAbove(Number(bal.value.uiAmount), 0);
  });
});
"""

CONTRACTS_MD = """# CapRush - Smart Contracts (Fase 2)

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
"""

def build():
    print()
    print("="*60)
    print("  CapRush - builder_contracts.py")
    print("  FASE 2 - Smart Contracts Anchor/Solana")
    print("="*60)
    print()
    print("Raiz:", ROOT)
    print()
    print("Pastas...")
    d("anchor/programs/caprush/src")
    d("anchor/tests")
    print()
    print("Arquivos...")
    w("anchor/programs/caprush/src/lib.rs",    LIB_RS)
    w("anchor/programs/caprush/src/state.rs",  STATE_RS)
    w("anchor/programs/caprush/src/errors.rs", ERRORS_RS)
    w("anchor/programs/caprush/Cargo.toml",    CARGO_TOML)
    w("anchor/Anchor.toml",                    ANCHOR_TOML)
    w("anchor/tests/caprush.ts",               TEST_TS)
    w("docs/CONTRACTS.md",                     CONTRACTS_MD)
    print()
    print("="*60)
    print("  GERADO COM SUCESSO!")
    print("="*60)
    print()
    print("  Para compilar e testar os contratos:")
    print("  1) Instale Rust: https://rustup.rs")
    print("  2) Instale Anchor CLI: npm install -g @coral-xyz/anchor-cli")
    print("  3) cd anchor && anchor build && anchor test")
    print()
    print("  Documentacao: docs/CONTRACTS.md")
    print()

if __name__=="__main__":
    build()
