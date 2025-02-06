import { Program } from "@coral-xyz/anchor";
import { BankrunProvider } from "anchor-bankrun";
import { AddedAccount, startAnchor } from "solana-bankrun";
import { Staking } from "../target/types/staking";
import idl from "../target/idl/staking.json";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import {
  collectionAddress,
  masterEditionAddress,
  metadataAddress,
  mintAddress,
  mintAtaAddress,
} from "./constants";

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

const [mintInfo, collectionInfo, masterEditionInfo, metadataInfo, mintAtaInfo] =
  await connection.getMultipleAccountsInfo([
    mintAddress,
    collectionAddress,
    masterEditionAddress,
    metadataAddress,
    mintAtaAddress,
  ]);

export async function getBankrunSetup(accounts: AddedAccount[] = []) {
  const context = await startAnchor(
    "",
    [
      {
        name: "mpl_token_metadata",
        programId: new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID),
      },
    ],
    [
      ...accounts,
      {
        address: mintAddress,
        info: mintInfo,
      },
      {
        address: collectionAddress,
        info: collectionInfo,
      },
      {
        address: masterEditionAddress,
        info: masterEditionInfo,
      },
      {
        address: metadataAddress,
        info: metadataInfo,
      },
      {
        address: mintAtaAddress,
        info: mintAtaInfo,
      },
    ]
  );
  const provider = new BankrunProvider(context);
  const program = new Program(idl as Staking, provider);

  return {
    context,
    provider,
    program,
  };
}
