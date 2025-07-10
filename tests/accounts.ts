import { PublicKey } from "@solana/web3.js";
import { Staking } from "../target/types/staking";
import { Program } from "@coral-xyz/anchor";

export async function fetchConfigAcc(
  program: Program<Staking>,
  configPda: PublicKey,
) {
  return await program.account.config.fetchNullable(configPda);
}

export async function fetchUserAcc(
  program: Program<Staking>,
  userPda: PublicKey,
) {
  return await program.account.user.fetchNullable(userPda);
}

export async function fetchStakeAcc(
  program: Program<Staking>,
  stakePda: PublicKey,
) {
  return await program.account.stake.fetchNullable(stakePda);
}
