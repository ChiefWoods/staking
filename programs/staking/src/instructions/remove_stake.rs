use crate::{constants::*, error::StakingError, state::*};
use anchor_lang::prelude::*;
use anchor_spl::{
    metadata::{
        mpl_token_metadata::instructions::ThawDelegatedAccountCpiBuilder, MasterEditionAccount,
        Metadata,
    },
    token_interface::{revoke, Mint, Revoke, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct RemoveStake<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        close = authority,
        seeds = [STAKE_SEED, mint.key().as_ref()],
        bump = stake.bump,
    )]
    pub stake: Account<'info, Stake>,
    #[account(
        mut,
        seeds = [USER_SEED, authority.key().as_ref()],
        bump = user.bump,
    )]
    pub user: Account<'info, User>,
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,
    #[account(
        seeds = [
            METADATA_SEED,
            metadata_program.key().as_ref(),
            mint.key().as_ref(),
            EDITION_SEED,
        ],
        seeds::program = metadata_program.key(),
        bump,
    )]
    pub master_edition: Account<'info, MasterEditionAccount>,
    #[account(mint::token_program = token_program)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(
        seeds = [REWARDS_MINT_SEED, config.key().as_ref()],
        bump = config.rewards_bump,
        mint::decimals = 6,
        mint::authority = config.admin,
    )]
    pub rewards_mint: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub mint_ata: InterfaceAccount<'info, TokenAccount>,
    pub metadata_program: Program<'info, Metadata>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl RemoveStake<'_> {
    pub fn remove_stake(ctx: Context<RemoveStake>) -> Result<()> {
        require_gte!(
            Clock::get()?.unix_timestamp - ctx.accounts.stake.start_stake,
            ctx.accounts.config.freeze_period,
            StakingError::FreezePeriodNotOver
        );

        let user = &mut ctx.accounts.user;
        user.amount_staked = user.amount_staked.checked_sub(1).unwrap();
        user.points = user
            .points
            .checked_add(ctx.accounts.config.points_per_stake.into())
            .unwrap();

        let signer_seeds: &[&[&[u8]]] = &[&[
            STAKE_SEED,
            &ctx.accounts.mint.key().to_bytes(),
            &[ctx.accounts.stake.bump],
        ]];

        ThawDelegatedAccountCpiBuilder::new(&ctx.accounts.metadata_program.to_account_info())
            .delegate(&ctx.accounts.stake.to_account_info())
            .edition(&ctx.accounts.master_edition.to_account_info())
            .mint(&ctx.accounts.mint.to_account_info())
            .token_account(&ctx.accounts.mint_ata.to_account_info())
            .token_program(&ctx.accounts.token_program.to_account_info())
            .invoke_signed(signer_seeds)?;

        revoke(CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Revoke {
                authority: ctx.accounts.authority.to_account_info(),
                source: ctx.accounts.mint_ata.to_account_info(),
            },
        ))
    }
}
