import { BN, Program } from "@coral-xyz/anchor";
import { beforeEach, describe, expect, test } from "bun:test";
import { Staking } from "../../target/types/staking";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  ACCOUNT_SIZE,
  AccountLayout,
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { collectionAddress, mintAddress } from "../constants";
import { getConfigPda, getStakePda, getUserPda } from "../pda";
import { fetchConfigAcc, fetchUserAcc } from "../accounts";
import { Clock, LiteSVM } from "litesvm";
import { LiteSVMProvider } from "anchor-litesvm";
import { expectAnchorError, fundedSystemAccountInfo, getSetup } from "../setup";

describe("removeStake", () => {
  let { litesvm, provider, program } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    program: Program<Staking>;
  };

  const [adminKeypair, walletKeypair] = Array.from(
    { length: 2 },
    Keypair.generate,
  );

  const walletAta = getAssociatedTokenAddressSync(
    mintAddress,
    walletKeypair.publicKey,
    false,
    TOKEN_PROGRAM_ID,
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
      walletAtaData,
    );

    ({ litesvm, provider, program } = await getSetup([
      ...[adminKeypair, walletKeypair].map((kp) => ({
        pubkey: kp.publicKey,
        account: fundedSystemAccountInfo(),
      })),
      {
        pubkey: walletAta,
        account: {
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
    } = litesvm.getClock();
    const minimumStakeTime = 60 * 60 * 24 * 1; // 1 day
    litesvm.setClock(
      new Clock(
        slot,
        epochStartTimestamp,
        epoch,
        leaderScheduleEpoch,
        unixTimestamp + BigInt(minimumStakeTime),
      ),
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

    const stakePda = getStakePda(walletKeypair.publicKey);
    const stakeAcc = litesvm.getAccount(stakePda);

    expect(stakeAcc).toBeNull();

    const userPda = getUserPda(walletKeypair.publicKey);
    const userAcc = await fetchUserAcc(program, userPda);

    expect(userAcc.amountStaked).toEqual(0);

    const configPda = getConfigPda();
    const configAcc = await fetchConfigAcc(program, configPda);

    expect(userAcc.points).toEqual(configAcc.pointsPerStake);

    const walletAtaAcc = await getAccount(
      provider.connection,
      walletAta,
      "processed",
      TOKEN_PROGRAM_ID,
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
      expectAnchorError(err, "FreezePeriodNotOver");
    }
  });
});
