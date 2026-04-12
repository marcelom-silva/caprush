// lib.rs
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
