import { NextResponse } from "next/server";
import { getGroq, AI_MODEL, parseAIJson } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are Vela's follow-up agent. Draft a short, professional payment reminder email. Tone: firm but polite. Max 4 sentences.
Return ONLY valid JSON: { "subject": string, "body": string }
Never include markdown or explanation.`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId, type } = await request.json();

    // Fetch invoice
    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const dueDate = new Date(invoice.due_date);
    const now = new Date();
    const daysOverdue = Math.floor(
      (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const completion = await getGroq().chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Invoice #: ${invoice.number}
Amount: ${invoice.total} ${invoice.currency}
Due date: ${dueDate.toLocaleDateString()}
Days overdue: ${Math.max(0, daysOverdue)} (0 if not yet due)
Client name: ${invoice.client_name}
Follow-up type: ${type || "reminder_before"}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 512,
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return NextResponse.json(
        { error: "AI failed to draft email" },
        { status: 500 }
      );
    }

    const parsed = parseAIJson<{ subject: string; body: string }>(aiResponse);

    // Send email via Resend if configured
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_..." && invoice.client_email) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        await resend.emails.send({
          from: process.env.FROM_EMAIL || "invoices@vela.so",
          to: invoice.client_email,
          subject: parsed.subject,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <p>${parsed.body}</p>
              <br/>
              <a href="${appUrl}/pay/${invoiceId}" style="background: #00e5ff; color: #040812; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: bold;">
                View & Pay Invoice
              </a>
              <br/><br/>
              <p style="color: #999; font-size: 12px;">Powered by Vela — get paid. on-chain.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Follow-up email error:", emailErr);
      }
    }

    // Log the follow-up
    await supabase.from("follow_ups").insert({
      invoice_id: invoiceId,
      type: type || "reminder_before",
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Draft followup error:", err);
    return NextResponse.json(
      { error: "Failed to draft follow-up" },
      { status: 500 }
    );
  }
}
