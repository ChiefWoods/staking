use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub bump: u8,
    pub rewards_bump: u8,
    pub points_per_stake: u8,
    pub max_stake: u8,
    pub freeze_period: i64,
    pub admin: Pubkey,
}
