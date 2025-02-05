use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Stake {
    pub bump: u8,
    pub start_stake: i64,
    pub authority: Pubkey,
    pub mint: Pubkey,
}
