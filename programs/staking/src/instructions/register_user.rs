use anchor_lang::{prelude::*, Discriminator};

use crate::{constants::*, state::*};

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = User::DISCRIMINATOR.len() + User::INIT_SPACE,
        seeds = [USER_SEED, authority.key().as_ref()],
        bump,
    )]
    pub user: Account<'info, User>,
    pub system_program: Program<'info, System>,
}

impl RegisterUser<'_> {
    pub fn register_user(ctx: Context<RegisterUser>) -> Result<()> {
        ctx.accounts.user.set_inner(User {
            bump: ctx.bumps.user,
            points: 0,
            amount_staked: 0,
        });

        Ok(())
    }
}
