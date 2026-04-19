import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { InvoicePDF } from "@/lib/pdf/invoice-pdf";
import { generateSolanaPayUrl } from "@/lib/solana";
import type { PdfTheme } from "@/types/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;
    const url = new URL(request.url);
    // Allow overriding theme per-request via ?theme=dark or ?theme=light
    const themeOverride = url.searchParams.get("theme") as PdfTheme | null;

    const supabase = await createClient();

    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, business_name, email, raenest_wallet, pdf_theme")
      .eq("id", invoice.user_id)
      .single();

    const { data: contractRow } = await supabase
      .from("contracts")
      .select("content")
      .eq("invoice_id", invoiceId)
      .single();

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const paymentUrl = `${appUrl}/pay/${invoiceId}`;

    // Prefer Solana Pay URL in the QR if wallet is configured — native wallets
    // will auto-open. Otherwise fall back to the hosted payment page URL.
    const qrTarget = profile?.raenest_wallet
      ? generateSolanaPayUrl(
          profile.raenest_wallet,
          invoice.total,
          invoice.number,
          (invoice.currency as "USDC" | "USDT") || "USDC"
        )
      : paymentUrl;

    const qrDataUrl = await QRCode.toDataURL(qrTarget, {
      width: 256,
      margin: 1,
      color: {
        dark: "#040812",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    });

    const theme: PdfTheme =
      themeOverride === "dark" || themeOverride === "light"
        ? themeOverride
        : (profile?.pdf_theme as PdfTheme) || "light";

    const buffer = await renderToBuffer(
      <InvoicePDF
        theme={theme}
        invoice={invoice}
        freelancer={{
          name: profile?.name || "Freelancer",
          business_name: profile?.business_name,
          email: profile?.email || "",
        }}
        contract={contractRow?.content || null}
        paymentUrl={paymentUrl}
        qrDataUrl={qrDataUrl}
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
