use anchor_lang::prelude::*;

#[error_code]
pub enum StakingError {
    #[msg("Max stake limit reached")]
    MaxStakeLimitReached,
}
