use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::{Config, CONFIG_SEED, REWARDS_MINT_SEED};

#[derive(AnchorSerialize, AnchorDeserialize)]
pub struct InitConfigArgs {
    pub points_per_stake: u8,
    pub max_stake: u8,
    pub freeze_period: i64,
}

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = Config::DISCRIMINATOR.len() + Config::INIT_SPACE,
        seeds = [CONFIG_SEED],
        bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        init,
        payer = admin,
        seeds = [REWARDS_MINT_SEED, config.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority = admin,
    )]
    pub rewards_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl InitConfig<'_> {
    pub fn handler(ctx: Context<InitConfig>, args: InitConfigArgs) -> Result<()> {
        ctx.accounts.config.set_inner(Config {
            bump: ctx.bumps.config,
            rewards_bump: ctx.bumps.rewards_mint,
            points_per_stake: args.points_per_stake,
            max_stake: args.max_stake,
            freeze_period: args.freeze_period,
            admin: ctx.accounts.admin.key(),
        });

        Ok(())
    }
}
