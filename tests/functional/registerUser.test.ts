import { BankrunProvider } from "anchor-bankrun";
import { beforeEach, describe, expect, test } from "bun:test";
import { ProgramTestContext } from "solana-bankrun";
import { Staking } from "../../target/types/staking";
import { Program } from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { getBankrunSetup } from "../setup";
import { getUserPdaAndBump } from "../pda";
import { getUserAcc } from "../accounts";

describe("registerUser", () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<Staking>;
  };

  const walletKeypair = Keypair.generate();

  beforeEach(async () => {
    ({ context, provider, program } = await getBankrunSetup([
      {
        address: walletKeypair.publicKey,
        info: {
          lamports: LAMPORTS_PER_SOL * 5,
          data: Buffer.alloc(0),
          owner: SystemProgram.programId,
          executable: false,
        },
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

    const [userPda, userBump] = getUserPdaAndBump(walletKeypair.publicKey);
    const userAcc = await getUserAcc(program, userPda);

    expect(userAcc.bump).toEqual(userBump);
    expect(userAcc.points).toEqual(0);
    expect(userAcc.amountStaked).toEqual(0);
  });
});
