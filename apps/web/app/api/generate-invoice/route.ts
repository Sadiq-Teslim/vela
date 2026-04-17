import { NextResponse } from "next/server";
import { getGroq, AI_MODEL, parseAIJson } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";

function buildSystemPrompt() {
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  return `You are Vela's invoice assistant. Parse the freelancer's job description and return ONLY valid JSON with this exact schema:
{
  "clientName": string,
  "clientEmail": string | null,
  "lineItems": [{ "label": string, "amount": number, "qty": number }],
  "total": number,
  "currency": "USDC" | "USDT",
  "dueDate": "ISO date string (YYYY-MM-DD)",
  "paymentTerms": string,
  "notes": string | null
}

Today's date is ${todayISO}.

Rules:
- For dueDate, if the user says "14 days" or similar, calculate from today's date.
- Use ONLY valid calendar dates. A month has 28-31 days depending on the month. Never output dates like Feb 30, Apr 31, etc.
- If no currency is specified, default to "USDC".
- If no due date is mentioned, default to 14 days from today.
- If any field cannot be inferred, set it to null.
- Never include markdown, explanation, or extra text — return ONLY the JSON object.`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobDescription } = await request.json();

    if (!jobDescription || typeof jobDescription !== "string") {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    // Call Groq to parse the job description
    const completion = await getGroq().chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: jobDescription },
      ],
      temperature: 0.1,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return NextResponse.json(
        { error: "AI failed to generate response" },
        { status: 500 }
      );
    }

    // Parse the AI response (strips markdown code fences if present)
    const parsed = parseAIJson<{
      clientName: string;
      clientEmail: string | null;
      lineItems: { label: string; amount: number; qty: number }[];
      total: number;
      currency: "USDC" | "USDT";
      dueDate: string;
      paymentTerms: string;
      notes: string | null;
    }>(aiResponse);

    // Generate invoice number
    let invoiceNumber: string;
    try {
      const { data: seqData } = await supabase.rpc("generate_invoice_number");
      invoiceNumber = seqData || `VLA-${Date.now().toString().slice(-4)}`;
    } catch {
      // Fallback if RPC function doesn't exist yet
      const count = await supabase.from("invoices").select("id", { count: "exact", head: true });
      const num = ((count.count || 0) + 1).toString().padStart(4, "0");
      invoiceNumber = `VLA-${num}`;
    }

    // Validate the date — AI sometimes hallucinates invalid dates like "2026-04-31"
    function safeDueDate(raw: string | null | undefined): string {
      const fallback = new Date(Date.now() + 14 * 86400000).toISOString();
      if (!raw) return fallback;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return fallback;
      // Reject dates too far in the past or future
      const now = Date.now();
      const oneYearMs = 365 * 86400000;
      if (d.getTime() < now - oneYearMs || d.getTime() > now + oneYearMs) return fallback;
      return d.toISOString();
    }

    // Save to database
    const { data: invoice, error: dbError } = await supabase
      .from("invoices")
      .insert({
        number: invoiceNumber,
        user_id: user.id,
        client_name: parsed.clientName || "Unknown Client",
        client_email: parsed.clientEmail || "",
        job_description: jobDescription,
        line_items: parsed.lineItems || [],
        total: parsed.total || 0,
        currency: parsed.currency || "USDC",
        due_date: safeDueDate(parsed.dueDate),
        status: "DRAFT",
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      return NextResponse.json(
        { error: "Failed to save invoice" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoiceId: invoice.id });
  } catch (err) {
    console.error("Generate invoice error:", err);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
