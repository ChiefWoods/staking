import { PublicKey } from "@solana/web3.js";
import idl from "../target/idl/staking.json";

export function getConfigPdaAndBump() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    new PublicKey(idl.address)
  );
}

export function getUserPdaAndBump(authority: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user"), authority.toBuffer()],
    new PublicKey(idl.address)
  );
}

export function getStakePdaAndBump(mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("stake"), mint.toBuffer()],
    new PublicKey(idl.address)
  );
}

export function getRewardsMintPdaAndBump(configPda: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rewards_mint"), configPda.toBuffer()],
    new PublicKey(idl.address)
  );
}
