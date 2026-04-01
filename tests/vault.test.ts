import * as anchor from "@coral-xyz/anchor";
import { fromWorkspace, LiteSVMProvider } from "anchor-litesvm";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { BN } from "bn.js";
import * as fs from "fs";

describe("vault", () => {
  let client: any;
  let IDL: any;

  before(async () => {
    client = fromWorkspace(".");
    IDL = JSON.parse(
      fs.readFileSync("./target/idl/anchor_vault_unlimited.json", "utf8"),
    );
  });

  const getProgramForUser = async (user: Keypair) => {
    client.airdrop(user.publicKey, BigInt(10 * anchor.web3.LAMPORTS_PER_SOL));
    const provider = new LiteSVMProvider(client, new anchor.Wallet(user));
    return new anchor.Program(IDL, provider);
  };

  it("deposit", async () => {
    const user = Keypair.generate();
    const program = await getProgramForUser(user);
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

    const balance = await client.getBalance(vault);
    assert.ok(Number(balance) >= 1_000_000);
  });

  it("fails if another user tries to withdraw", async () => {
    const attacker = Keypair.generate();
    const attackerProgram = await getProgramForUser(attacker);
    const user = Keypair.generate();
    const program = await getProgramForUser(user);

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

    try {
      await attackerProgram.methods
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
    const user = Keypair.generate();
    const program = await getProgramForUser(user);
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

    const initialBalance = client.getBalance(user.publicKey);
    await program.methods
      .withdraw()
      .accounts({
        signer: user.publicKey,
        vault,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const finalBalance = client.getBalance(user.publicKey);
    assert.ok(finalBalance > initialBalance);

    const vaultBalance = client.getBalance(vault);
    assert.equal(Number(vaultBalance), 0);
  });
});
