import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { InvoicePDF } from "@/lib/pdf/invoice-pdf";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;
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

    // Fetch freelancer profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, business_name, email")
      .eq("id", invoice.user_id)
      .single();

    // Fetch contract if exists
    const { data: contractRow } = await supabase
      .from("contracts")
      .select("content")
      .eq("invoice_id", invoiceId)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const paymentUrl = `${appUrl}/pay/${invoiceId}`;

    const buffer = await renderToBuffer(
      <InvoicePDF
        invoice={invoice}
        freelancer={{
          name: profile?.name || "Freelancer",
          business_name: profile?.business_name,
          email: profile?.email || "",
        }}
        contract={contractRow?.content || null}
        paymentUrl={paymentUrl}
      />
    );

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.number}.pdf"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    return NextResponse.json(
      { error: "Failed to generate PDF", message, stack },
      { status: 500 }
    );
  }
}
