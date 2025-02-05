use anchor_lang::prelude::*;
use anchor_spl::metadata::mpl_token_metadata::accounts::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";
pub const REWARDS_MINT_SEED: &[u8] = b"rewards_mint";
pub const USER_SEED: &[u8] = b"user";
pub const STAKE_SEED: &[u8] = b"stake";
pub const METADATA_SEED: &[u8] = Metadata::PREFIX;
pub const EDITION_SEED: &[u8] = MasterEdition::PREFIX.1;
