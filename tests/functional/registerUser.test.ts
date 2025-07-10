import { beforeEach, describe, expect, test } from "bun:test";
import { Staking } from "../../target/types/staking";
import { Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { getUserPda } from "../pda";
import { fetchUserAcc } from "../accounts";
import { LiteSVM } from "litesvm";
import { LiteSVMProvider } from "anchor-litesvm";
import { fundedSystemAccountInfo, getSetup } from "../setup";

describe("registerUser", () => {
  let { litesvm, provider, program } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    program: Program<Staking>;
  };

  const walletKeypair = Keypair.generate();

  beforeEach(async () => {
    ({ litesvm, provider, program } = await getSetup([
      {
        pubkey: walletKeypair.publicKey,
        account: fundedSystemAccountInfo(),
      },
    ]));
  });

  test("registers user", async () => {
    await program.methods
      .registerUser()
      .accounts({
        authority: walletKeypair.publicKey,
      })
      .signers([walletKeypair])
      .rpc();

    const userPda = getUserPda(walletKeypair.publicKey);
    const userAcc = await fetchUserAcc(program, userPda);

    expect(userAcc.points).toEqual(0);
    expect(userAcc.amountStaked).toEqual(0);
  });
});
