import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTransaction, checkRecentPayments } from "@/lib/solana";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;
    const body = await request.json();
    const { txSignature } = body;

    const supabase = await createClient();

    // Fetch invoice
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    if (invoice.status === "PAID") {
      return NextResponse.json({ status: "already_paid", txHash: invoice.payment_tx_hash });
    }

    // Get freelancer wallet
    const { data: profile } = await supabase
      .from("profiles")
      .select("raenest_wallet")
      .eq("id", invoice.user_id)
      .single();

    if (!profile?.raenest_wallet) {
      return NextResponse.json(
        { error: "Freelancer wallet not configured" },
        { status: 400 }
      );
    }

    let verified = false;
    let finalTxHash = txSignature;

    if (txSignature) {
      // Verify a specific transaction
      const result = await verifyTransaction(
        txSignature,
        profile.raenest_wallet,
        invoice.total,
        invoice.currency as "USDC" | "USDT"
      );
      verified = result.verified;
      if (!verified) {
        return NextResponse.json(
          { verified: false, error: result.error },
          { status: 400 }
        );
      }
    } else {
      // Check recent transactions for matching payment
      const sentTimestamp = invoice.sent_at
        ? Math.floor(new Date(invoice.sent_at).getTime() / 1000)
        : undefined;

      const result = await checkRecentPayments(
        profile.raenest_wallet,
        invoice.total,
        invoice.currency as "USDC" | "USDT",
        sentTimestamp
      );

      verified = result.found;
      finalTxHash = result.txSignature;
    }

    if (verified && finalTxHash) {
      // Use SECURITY DEFINER RPC so public payment pages can mark invoice paid
      // without the freelancer's session (RLS would otherwise block the update).
      const { error: rpcError } = await supabase.rpc("mark_invoice_paid", {
        p_invoice_id: invoiceId,
        p_tx_hash: finalTxHash,
      });

      if (rpcError) {
        console.error("mark_invoice_paid RPC error:", rpcError);
      }

      return NextResponse.json({
        verified: true,
        txHash: finalTxHash,
        status: "PAID",
      });
    }

    return NextResponse.json({ verified: false, status: invoice.status });
  } catch (err) {
    console.error("Verify payment error:", err);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
