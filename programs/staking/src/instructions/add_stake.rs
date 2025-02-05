use crate::{constants::*, error::StakingError, state::*};
use anchor_lang::{prelude::*, Discriminator};
use anchor_spl::{
    metadata::{
        mpl_token_metadata::instructions::FreezeDelegatedAccountCpiBuilder, MasterEditionAccount,
        Metadata, MetadataAccount,
    },
    token_interface::{approve, Approve, Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct AddStake<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = Stake::DISCRIMINATOR.len() + Stake::INIT_SPACE,
        seeds = [STAKE_SEED, mint.key().as_ref()],
        bump,
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
            mint.key().as_ref()
        ],
        seeds::program = metadata_program.key(),
        bump,
        constraint = metadata.collection.as_ref().unwrap().key.as_ref() == collection_mint.key().as_ref(),
        constraint = metadata.collection.as_ref().unwrap().verified == true,
    )]
    pub metadata: Account<'info, MetadataAccount>,
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
    #[account(mint::token_program = token_program)]
    pub collection_mint: InterfaceAccount<'info, Mint>,
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

impl AddStake<'_> {
    pub fn add_stake(ctx: Context<AddStake>) -> Result<()> {
        require!(
            ctx.accounts.user.amount_staked < ctx.accounts.config.max_stake,
            StakingError::MaxStakeLimitReached
        );

        ctx.accounts.stake.set_inner(Stake {
            bump: ctx.bumps.stake,
            start_stake: Clock::get()?.unix_timestamp,
            authority: ctx.accounts.authority.key(),
            mint: ctx.accounts.mint.key(),
        });

        let user = &mut ctx.accounts.user;
        user.amount_staked = user.amount_staked.checked_add(1).unwrap();

        approve(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Approve {
                    authority: ctx.accounts.authority.to_account_info(),
                    delegate: ctx.accounts.stake.to_account_info(),
                    to: ctx.accounts.mint_ata.to_account_info(),
                },
            ),
            1,
        )?;

        let signer_seeds: &[&[&[u8]]] = &[&[
            STAKE_SEED,
            &ctx.accounts.mint.key().to_bytes(),
            &[ctx.accounts.stake.bump],
        ]];

        FreezeDelegatedAccountCpiBuilder::new(&ctx.accounts.metadata_program.to_account_info())
            .delegate(&ctx.accounts.stake.to_account_info())
            .edition(&ctx.accounts.master_edition.to_account_info())
            .mint(&ctx.accounts.mint.to_account_info())
            .token_account(&ctx.accounts.mint_ata.to_account_info())
            .token_program(&ctx.accounts.token_program.to_account_info())
            .invoke_signed(signer_seeds)?;

        Ok(())
    }
}
