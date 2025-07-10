import { AnchorError, Program } from "@coral-xyz/anchor";
import { Staking } from "../target/types/staking";
import idl from "../target/idl/staking.json";
import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {
  collectionAddress,
  masterEditionAddress,
  metadataAddress,
  mintAddress,
  mintAtaAddress,
} from "./constants";
import { AccountInfoBytes } from "litesvm";
import { fromWorkspace, LiteSVMProvider } from "anchor-litesvm";
import { expect } from "bun:test";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const [mintInfo, collectionInfo, masterEditionInfo, metadataInfo, mintAtaInfo] =
  await connection.getMultipleAccountsInfo([
    mintAddress,
    collectionAddress,
    masterEditionAddress,
    metadataAddress,
    mintAtaAddress,
  ]);

const addressInfoMap = new Map<PublicKey, AccountInfoBytes>([
  [mintAddress, mintInfo],
  [collectionAddress, collectionInfo],
  [masterEditionAddress, masterEditionInfo],
  [metadataAddress, metadataInfo],
  [mintAtaAddress, mintAtaInfo],
]);

export async function getSetup(
  accounts: { pubkey: PublicKey; account: AccountInfoBytes }[] = [],
) {
  const litesvm = fromWorkspace("./");
  litesvm.addProgramFromFile(
    new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID),
    "./tests/fixtures/mpl_token_metadata.so",
  );

  for (const [pubkey, accountInfo] of addressInfoMap.entries()) {
    litesvm.setAccount(pubkey, {
      data: accountInfo.data,
      executable: accountInfo.executable,
      lamports: accountInfo.lamports,
      owner: accountInfo.owner,
    });
  }

  for (const { pubkey, account } of accounts) {
    litesvm.setAccount(new PublicKey(pubkey), {
      data: account.data,
      executable: account.executable,
      lamports: account.lamports,
      owner: new PublicKey(account.owner),
    });
  }

  const provider = new LiteSVMProvider(litesvm);
  const program = new Program<Staking>(idl, provider);

  return { litesvm, provider, program };
}

export function fundedSystemAccountInfo(
  lamports: number = LAMPORTS_PER_SOL,
): AccountInfoBytes {
  return {
    lamports,
    data: Buffer.alloc(0),
    owner: SystemProgram.programId,
    executable: false,
  };
}

export async function expectAnchorError(error: Error, code: string) {
  expect(error).toBeInstanceOf(AnchorError);
  const { errorCode } = (error as AnchorError).error;
  expect(errorCode.code).toBe(code);
}
