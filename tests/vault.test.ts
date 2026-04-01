import * as anchor from "@coral-xyz/anchor";
import { fromWorkspace, LiteSVMProvider } from "anchor-litesvm";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { BN } from "bn.js";

describe("vault", () => {
  const user = Keypair.generate();
  let program: anchor.Program;

  before(async () => {
    const client = fromWorkspace(".");
    // client ko airdrop krdo
    client.airdrop(user.publicKey, BigInt(10 * anchor.web3.LAMPORTS_PER_SOL));

    const provider = new LiteSVMProvider(client, new anchor.Wallet(user));

    anchor.setProvider(provider);
    program = anchor.workspace.AnchorVaultUnlimited;
  });

  it("deposit", async () => {
    const [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), user.publicKey.toBuffer()],
      program.programId,
    );

    await program.methods
      .deposit(new BN(1_000_000))
      .accounts({
        signer: user.publicKey,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const balance = await program.provider.connection.getBalance(vault);
    assert.ok(balance > 0);
  });

  it("fails if another user tries to withdraw", async () => {
    const attacker = Keypair.generate();
    const client = fromWorkspace(".");
    client.airdrop(
      attacker.publicKey,
      BigInt(10 * anchor.web3.LAMPORTS_PER_SOL),
    );

    const [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), user.publicKey.toBuffer()],
      program.programId,
    );

    try {
      await program.methods
        .withdraw()
        .accounts({
          signer: attacker.publicKey,
          vault,
          systemProgram: SystemProgram.programId,
        })
        .signers([attacker])
        .rpc();

      assert.fail("Should not succeed");
    } catch (err) {
      assert.ok(err);
    }
  });

  it("withdraw", async () => {
    const [vault] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), user.publicKey.toBuffer()],
      program.programId,
    );

    await program.methods
      .deposit(new BN(1_000_000))
      .accounts({
        signer: user.publicKey,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    await program.methods
      .withdraw()
      .accounts({
        signer: user.publicKey,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const balance = await program.provider.connection.getBalance(vault);
    assert.equal(balance, 0);
  });
});
