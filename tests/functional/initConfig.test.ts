import { BankrunProvider } from "anchor-bankrun";
import { beforeEach, describe, expect, test } from "bun:test";
import { ProgramTestContext } from "solana-bankrun";
import { Staking } from "../../target/types/staking";
import { BN, Program } from "@coral-xyz/anchor";
import { getBankrunSetup } from "../setup";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getConfigPdaAndBump, getRewardsMintPdaAndBump } from "../pda";
import { getConfigAcc } from "../accounts";

describe("initConfig", () => {
  let { context, provider, program } = {} as {
    context: ProgramTestContext;
    provider: BankrunProvider;
    program: Program<Staking>;
  };

  const adminKeypair = Keypair.generate();

  beforeEach(async () => {
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
    ]));
  });

  test("initializes config", async () => {
    const pointsPerStake = 100;
    const maxStake = 32;
    const freezePeriod = new BN(60 * 60 * 24 * 1); // 1 day

    await program.methods
      .initConfig({
        pointsPerStake,
        maxStake,
        freezePeriod,
      })
      .accounts({
        admin: adminKeypair.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([adminKeypair])
      .rpc();

    const [configPda, configBump] = getConfigPdaAndBump();
    const configAcc = await getConfigAcc(program, configPda);

    expect(configAcc.bump).toEqual(configBump);
    expect(configAcc.pointsPerStake).toEqual(pointsPerStake);
    expect(configAcc.maxStake).toEqual(maxStake);
    expect(configAcc.freezePeriod.toNumber()).toEqual(freezePeriod.toNumber());
    expect(configAcc.admin).toStrictEqual(adminKeypair.publicKey);

    const rewardsBump = getRewardsMintPdaAndBump(configPda)[1];

    expect(configAcc.rewardsBump).toEqual(rewardsBump);
  });
});
