pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("5oYCMpmb2QkCjYtMX5vLseoYpDF62sbgkVyeLHyu1r7c");

#[program]
pub mod staking {
    use super::*;

    pub fn init_config(ctx: Context<InitConfig>, args: InitConfigArgs) -> Result<()> {
        InitConfig::init_config(ctx, args)
    }

    pub fn register_user(ctx: Context<RegisterUser>) -> Result<()> {
        RegisterUser::register_user(ctx)
    }

    pub fn add_stake(ctx: Context<AddStake>) -> Result<()> {
        AddStake::add_stake(ctx)
    }
}
