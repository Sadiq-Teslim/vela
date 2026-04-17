import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId } = await request.json();

    // Fetch the invoice
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select("*, contracts(*)")
      .eq("id", invoiceId)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Update invoice status to SENT
    const { error: updateError } = await supabase
      .from("invoices")
      .update({
        status: "SENT",
        sent_at: new Date().toISOString(),
      })
      .eq("id", invoiceId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update invoice" },
        { status: 500 }
      );
    }

    // Send email via Resend if API key is configured
    if (process.env.RESEND_API_KEY && invoice.client_email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const paymentUrl = `${appUrl}/pay/${invoiceId}`;

      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);

        await resend.emails.send({
          from: process.env.FROM_EMAIL || "invoices@vela.so",
          to: invoice.client_email,
          subject: `Invoice ${invoice.number} — $${invoice.total} ${invoice.currency}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Invoice ${invoice.number}</h2>
              <p>You have a new invoice for <strong>$${invoice.total} ${invoice.currency}</strong>.</p>
              <p>Due date: ${new Date(invoice.due_date).toLocaleDateString()}</p>
              <br/>
              <a href="${paymentUrl}" style="background: #00e5ff; color: #040812; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold;">
                View & Pay Invoice
              </a>
              <br/><br/>
              <p style="color: #999; font-size: 12px;">Powered by Vela — get paid. on-chain.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
        // Don't fail the request if email fails — invoice is still marked as sent
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send invoice error:", err);
    return NextResponse.json(
      { error: "Failed to send invoice" },
      { status: 500 }
    );
  }
}
