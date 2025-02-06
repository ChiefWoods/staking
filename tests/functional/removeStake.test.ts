import { AnchorError, BN, Program } from "@coral-xyz/anchor";
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
import {
  getConfigPdaAndBump,
  getStakePdaAndBump,
  getUserPdaAndBump,
} from "../pda";
import { getConfigAcc, getStakeAcc, getUserAcc } from "../accounts";

describe("removeStake", () => {
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
  });

  test("remove a stake", async () => {
    const {
      epoch,
      epochStartTimestamp,
      leaderScheduleEpoch,
      slot,
      unixTimestamp,
    } = await context.banksClient.getClock();
    const minimumStakeTime = 60 * 60 * 24 * 1; // 1 day
    context.setClock(
      new Clock(
        slot,
        epochStartTimestamp,
        epoch,
        leaderScheduleEpoch,
        unixTimestamp + BigInt(minimumStakeTime)
      )
    );

    await program.methods
      .removeStake()
      .accounts({
        authority: walletKeypair.publicKey,
        mint: mintAddress,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([walletKeypair])
      .rpc();

    const [stakePda] = getStakePdaAndBump(walletKeypair.publicKey);
    const stakeAcc = await context.banksClient.getAccount(stakePda);

    expect(stakeAcc).toBeNull();

    const [userPda] = getUserPdaAndBump(walletKeypair.publicKey);
    const userAcc = await getUserAcc(program, userPda);

    expect(userAcc.amountStaked).toEqual(0);

    const [configPda] = getConfigPdaAndBump();
    const configAcc = await getConfigAcc(program, configPda);

    expect(userAcc.points).toEqual(configAcc.pointsPerStake);

    const walletAtaAcc = await getAccount(
      provider.connection,
      walletAta,
      "processed",
      TOKEN_PROGRAM_ID
    );

    expect(walletAtaAcc.delegate).toBeNull();
    expect(Number(walletAtaAcc.delegatedAmount)).toEqual(0);
    expect(walletAtaAcc.isFrozen).toBeFalse();
  });

  test("throws if removing a stake before freeze period expires", async () => {
    try {
      await program.methods
        .removeStake()
        .accounts({
          authority: walletKeypair.publicKey,
          mint: mintAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([walletKeypair])
        .rpc();
    } catch (err) {
      expect(err).toBeInstanceOf(AnchorError);
      expect(err.error.errorCode.code).toEqual("FreezePeriodNotOver");
      expect(err.error.errorCode.number).toEqual(6001);
    }
  });
});
