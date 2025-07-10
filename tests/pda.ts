import { PublicKey } from "@solana/web3.js";
import idl from "../target/idl/staking.json";

const STAKING_PROGRAM_ID = new PublicKey(idl.address);

export function getConfigPda() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    STAKING_PROGRAM_ID,
  )[0];
}

export function getUserPda(authority: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user"), authority.toBuffer()],
    STAKING_PROGRAM_ID,
  )[0];
}

export function getStakePda(mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stake"), mint.toBuffer()],
    STAKING_PROGRAM_ID,
  )[0];
}

export function getRewardsMintPda(configPda: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rewards_mint"), configPda.toBuffer()],
    STAKING_PROGRAM_ID,
  )[0];
}
