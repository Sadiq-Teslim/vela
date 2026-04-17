import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;
    const supabase = await createClient();

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("status, payment_tx_hash, paid_at")
      .eq("id", invoiceId)
      .single();

    if (error || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: invoice.status,
      paid: invoice.status === "PAID",
      txHash: invoice.payment_tx_hash,
      paidAt: invoice.paid_at,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
