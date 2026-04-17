import {
  Connection,
  PublicKey,
  type ParsedTransactionWithMeta,
} from "@solana/web3.js";

// USDC mint addresses
export const USDC_MINT = {
  mainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
};

export const USDT_MINT = {
  mainnet: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  devnet: "EJwZgeZrdC8TXTQbQBoL6bfuAnFUQYtEWEgp5FvtchZ2",
};

function getConnection() {
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.devnet.solana.com";
  return new Connection(rpcUrl, "confirmed");
}

function getNetwork(): "mainnet" | "devnet" {
  return (process.env.NEXT_PUBLIC_SOLANA_NETWORK as "mainnet" | "devnet") || "devnet";
}

export function getUsdcMint(): string {
  return USDC_MINT[getNetwork()];
}

/**
 * Generate a Solana Pay URL for USDC payment
 */
export function generateSolanaPayUrl(
  recipientWallet: string,
  amount: number,
  invoiceNumber: string,
  currency: "USDC" | "USDT" = "USDC"
): string {
  const network = getNetwork();
  const mint = currency === "USDT" ? USDT_MINT[network] : USDC_MINT[network];
  return `solana:${recipientWallet}?amount=${amount}&spl-token=${mint}&label=Vela-${invoiceNumber}&message=Payment%20for%20invoice%20${invoiceNumber}`;
}

/**
 * Verify a specific transaction matches expected payment
 */
export async function verifyTransaction(
  txSignature: string,
  expectedRecipient: string,
  expectedAmount: number,
  currency: "USDC" | "USDT" = "USDC"
): Promise<{ verified: boolean; error?: string }> {
  try {
    const connection = getConnection();
    const tx = await connection.getParsedTransaction(txSignature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return { verified: false, error: "Transaction not found" };
    }

    if (!tx.meta || tx.meta.err) {
      return { verified: false, error: "Transaction failed on-chain" };
    }

    // Check for SPL token transfer to the recipient
    const network = getNetwork();
    const expectedMint =
      currency === "USDT" ? USDT_MINT[network] : USDC_MINT[network];

    const tokenTransfer = findTokenTransfer(
      tx,
      expectedRecipient,
      expectedMint,
      expectedAmount
    );

    if (!tokenTransfer) {
      return {
        verified: false,
        error: `No matching ${expectedAmount} ${currency} transfer to ${expectedRecipient.slice(0, 6)}... found in transaction`,
      };
    }

    return { verified: true };
  } catch (err) {
    return {
      verified: false,
      error: err instanceof Error ? err.message : "Verification failed",
    };
  }
}

/**
 * Check recent transactions to a wallet for a matching payment
 */
export async function checkRecentPayments(
  recipientWallet: string,
  expectedAmount: number,
  currency: "USDC" | "USDT" = "USDC",
  afterTimestamp?: number
): Promise<{ found: boolean; txSignature?: string }> {
  try {
    const connection = getConnection();
    const recipientPubkey = new PublicKey(recipientWallet);

    const signatures = await connection.getSignaturesForAddress(
      recipientPubkey,
      { limit: 20 }
    );

    const network = getNetwork();
    const expectedMint =
      currency === "USDT" ? USDT_MINT[network] : USDC_MINT[network];

    for (const sig of signatures) {
      // Skip if before our timestamp
      if (afterTimestamp && sig.blockTime && sig.blockTime < afterTimestamp) {
        continue;
      }

      const tx = await connection.getParsedTransaction(sig.signature, {
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || !tx.meta || tx.meta.err) continue;

      const transfer = findTokenTransfer(
        tx,
        recipientWallet,
        expectedMint,
        expectedAmount
      );

      if (transfer) {
        return { found: true, txSignature: sig.signature };
      }
    }

    return { found: false };
  } catch {
    return { found: false };
  }
}

function findTokenTransfer(
  tx: ParsedTransactionWithMeta,
  recipient: string,
  mint: string,
  amount: number
): boolean {
  if (!tx.meta) return false;

  // On devnet, multiple USDC-like faucets use different mints (spl-token-faucet,
  // circle's devnet, solana's own). Accept any SPL token transfer of the right
  // amount to the recipient. On mainnet we enforce the exact USDC mint.
  const strictMintCheck = getNetwork() === "mainnet";

  const preBalances = tx.meta.preTokenBalances || [];
  const postBalances = tx.meta.postTokenBalances || [];

  for (const post of postBalances) {
    if (strictMintCheck && post.mint !== mint) continue;
    if (post.owner !== recipient) continue;

    const pre = preBalances.find(
      (p) => p.accountIndex === post.accountIndex && p.mint === post.mint
    );

    const preAmount = pre
      ? parseFloat(pre.uiTokenAmount.uiAmountString || "0")
      : 0;
    const postAmount = parseFloat(post.uiTokenAmount.uiAmountString || "0");

    const received = postAmount - preAmount;

    // Allow small floating point tolerance
    if (Math.abs(received - amount) < 0.01) {
      return true;
    }
  }

  return false;
}
