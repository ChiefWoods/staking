import { BN, Program } from "@coral-xyz/anchor";
import { BankrunProvider } from "anchor-bankrun";
import { beforeEach, describe, expect, test } from "bun:test";
import { Clock, ProgramTestContext } from "solana-bankrun";
import { Staking } from "../../target/types/staking";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { collectionAddress, mintAddress } from "../constants";
import { getBankrunSetup } from "../setup";
import { getStakePdaAndBump, getUserPdaAndBump } from "../pda";
import { getStakeAcc, getUserAcc } from "../accounts";

describe("addStake", () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<Staking>;
  };

  const [adminKeypair, walletKeypair] = Array.from(
    { length: 2 },
    Keypair.generate
  );

  const walletAta = getAssociatedTokenAddressSync(
    mintAddress,
    walletKeypair.publicKey,
    false,
    TOKEN_PROGRAM_ID
  );

  beforeEach(async () => {
    const walletAtaData = Buffer.alloc(ACCOUNT_SIZE);
    AccountLayout.encode(
      {
        mint: mintAddress,
        owner: walletKeypair.publicKey,
        amount: 1n,
        delegateOption: 0,
        delegate: PublicKey.default,
        delegatedAmount: 0n,
        state: 1,
        isNativeOption: 0,
        isNative: 0n,
        closeAuthorityOption: 0,
        closeAuthority: PublicKey.default,
      },
      walletAtaData
    );

    ({ context, provider, program } = await getBankrunSetup([
      {
        address: adminKeypair.publicKey,
        info: {
          lamports: LAMPORTS_PER_SOL * 5,
          data: Buffer.alloc(0),
          owner: SystemProgram.programId,
          executable: false,
        },
      },
      {
        address: walletKeypair.publicKey,
        info: {
          lamports: LAMPORTS_PER_SOL * 5,
          data: Buffer.alloc(0),
          owner: SystemProgram.programId,
          executable: false,
        },
      },
      {
        address: walletAta,
        info: {
          lamports: LAMPORTS_PER_SOL,
          data: walletAtaData,
          owner: TOKEN_PROGRAM_ID,
          executable: false,
        },
      },
    ]));

    await program.methods
      .initConfig({
        pointsPerStake: 100,
        maxStake: 32,
        freezePeriod: new BN(60 * 60 * 24 * 1),
      })
      .accounts({
        admin: adminKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([adminKeypair])
      .rpc();

    await program.methods
      .registerUser()
      .accounts({
        authority: walletKeypair.publicKey,
      })
      .signers([walletKeypair])
      .rpc();
  });

  test("add a stake", async () => {
    const startStake = Number(
      (await context.banksClient.getClock()).unixTimestamp
    );

    await program.methods
      .addStake()
      .accounts({
        authority: walletKeypair.publicKey,
        mint: mintAddress,
        collectionMint: collectionAddress,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([walletKeypair])
      .rpc();

    const [stakePda, stakeBump] = getStakePdaAndBump(mintAddress);
    const stakeAcc = await getStakeAcc(program, stakePda);

    expect(stakeAcc.bump).toEqual(stakeBump);
    expect(stakeAcc.startStake.toNumber()).toEqual(startStake);
    expect(stakeAcc.authority).toStrictEqual(walletKeypair.publicKey);
    expect(stakeAcc.mint).toStrictEqual(mintAddress);

    const [userPda] = getUserPdaAndBump(walletKeypair.publicKey);
    const userAcc = await getUserAcc(program, userPda);

    expect(userAcc.amountStaked).toEqual(1);

    const walletAtaAcc = await getAccount(
      provider.connection,
      walletAta,
      "processed",
      TOKEN_PROGRAM_ID
    );

    expect(walletAtaAcc.delegate).toStrictEqual(stakePda);
    expect(Number(walletAtaAcc.delegatedAmount)).toEqual(1);
    expect(walletAtaAcc.isFrozen).toBeTrue();
  });
});
