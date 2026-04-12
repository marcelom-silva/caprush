// tests/caprush.ts
// =================
// Testes basicos dos contratos CapRush com Anchor + Mocha
// Rodar: anchor test

import * as anchor from "@coral-xyz/anchor";
import { Program }  from "@coral-xyz/anchor";
import { Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { assert } from "chai";

describe("caprush", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program  = anchor.workspace.Caprush as Program;
  const authority = provider.wallet as anchor.Wallet;

  let crMint:       anchor.web3.PublicKey;
  let nftMint:      anchor.web3.PublicKey;
  let configPda:    anchor.web3.PublicKey;
  let configBump:   number;

  before(async () => {
    // Airdrop para cobrir taxas
    const sig = await provider.connection.requestAirdrop(
      authority.publicKey, 2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    // Deriva PDA da config
    [configPda, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("cr_config")],
      program.programId
    );

    // Cria mint do $CR (6 decimais)
    crMint = await createMint(
      provider.connection, authority.payer,
      configPda, null, 6
    );

    // Cria mint do NFT (0 decimais, supply=1)
    const nftMintKp = Keypair.generate();
    nftMint = nftMintKp.publicKey;
    await createMint(
      provider.connection, authority.payer,
      configPda, null, 0, nftMintKp
    );
  });

  it("Inicializa token $CR", async () => {
    await program.methods
      .initializeCrToken(6)
      .accounts({
        authority:     authority.publicKey,
        config:        configPda,
        crMint:        crMint,
        systemProgram: SystemProgram.programId,
        tokenProgram:  TOKEN_PROGRAM_ID,
      })
      .rpc();

    const config = await program.account.crConfig.fetch(configPda);
    assert.equal(config.crMint.toString(), crMint.toString());
    console.log("  Config PDA:", configPda.toString());
  });

  it("Mintera tampinha NFT com atributos", async () => {
    const ownerAta = await getOrCreateAssociatedTokenAccount(
      provider.connection, authority.payer, nftMint, authority.publicKey
    );

    const [capPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("cap"), nftMint.toBuffer()],
      program.programId
    );

    await program.methods
      .mintCapNft(82, 91, 75, "YUKI-001", { lendaria: {} })
      .accounts({
        owner:            authority.publicKey,
        config:           configPda,
        capNft:           capPda,
        nftMint:          nftMint,
        ownerTokenAccount: ownerAta.address,
        tokenProgram:     TOKEN_PROGRAM_ID,
        systemProgram:    SystemProgram.programId,
      })
      .rpc();

    const cap = await program.account.capNft.fetch(capPda);
    assert.equal(cap.velocidade,   82);
    assert.equal(cap.controle,     91);
    assert.equal(cap.aerodinamica, 75);
    assert.equal(cap.nome,         "YUKI-001");
    console.log("  Tampinha mintada:", capPda.toString());
  });

  it("Registra resultado de corrida e distribui $CR", async () => {
    const ownerCrAta = await getOrCreateAssociatedTokenAccount(
      provider.connection, authority.payer, crMint, authority.publicKey
    );

    const [capPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("cap"), nftMint.toBuffer()],
      program.programId
    );

    await program.methods
      .recordRaceResult(45, 3, 2) // 45s, 3 CPs, 2 voltas
      .accounts({
        serverSigner:    authority.publicKey,
        config:          configPda,
        capNft:          capPda,
        crMint:          crMint,
        ownerCrAccount:  ownerCrAta.address,
        tokenProgram:    TOKEN_PROGRAM_ID,
      })
      .rpc();

    const bal = await provider.connection.getTokenAccountBalance(ownerCrAta.address);
    console.log("  $CR recebido:", bal.value.uiAmount);
    assert.isAbove(Number(bal.value.uiAmount), 0);
  });
});
