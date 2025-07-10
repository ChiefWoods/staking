import { beforeEach, describe, expect, test } from "bun:test";
import { Staking } from "../../target/types/staking";
import { BN, Program } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getConfigPda } from "../pda";
import { fetchConfigAcc } from "../accounts";
import { LiteSVM } from "litesvm";
import { LiteSVMProvider } from "anchor-litesvm";
import { fundedSystemAccountInfo, getSetup } from "../setup";

describe("initConfig", () => {
  let { litesvm, provider, program } = {} as {
    litesvm: LiteSVM;
    provider: LiteSVMProvider;
    program: Program<Staking>;
  };

  const adminKeypair = Keypair.generate();

  beforeEach(async () => {
    ({ litesvm, provider, program } = await getSetup([
      {
        pubkey: adminKeypair.publicKey,
        account: fundedSystemAccountInfo(),
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

    const configPda = getConfigPda();
    const configAcc = await fetchConfigAcc(program, configPda);

    expect(configAcc.pointsPerStake).toEqual(pointsPerStake);
    expect(configAcc.maxStake).toEqual(maxStake);
    expect(configAcc.freezePeriod.toNumber()).toEqual(freezePeriod.toNumber());
    expect(configAcc.admin).toStrictEqual(adminKeypair.publicKey);
  });
});
