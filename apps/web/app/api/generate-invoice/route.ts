import { NextResponse } from "next/server";
import { getGroq, AI_MODEL, parseAIJson } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";

type ParsedInvoice = {
  clientName: string;
  clientEmail: string | null;
  lineItems: { label: string; amount: number; qty: number }[];
  total: number;
  currency: "USDC" | "USDT";
  dueDate: string;
  paymentTerms: string;
  notes: string | null;
};

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

function buildFallbackInvoice(jobDescription: string): ParsedInvoice {
  const text = jobDescription.trim();
  const lower = text.toLowerCase();

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);

  const clientMatch = text.match(
    /(?:client\s*[:\-]?|for\s+)([A-Za-z][A-Za-z\s'.-]{1,60})/i
  );
  const rawClientName = clientMatch?.[1]?.trim() ?? "Client";
  const clientName = rawClientName.replace(/[.,;:!?]$/, "");

  const usdAmountMatch = text.match(/\$\s*(\d+(?:\.\d{1,2})?)/);
  const genericAmountMatch = text.match(
    /(?:amount|total|price|budget)\s*[:=\-]?\s*(\d+(?:\.\d{1,2})?)/i
  );
  const firstNumberMatch = text.match(/\b(\d+(?:\.\d{1,2})?)\b/);
  const parsedAmount = Number(
    usdAmountMatch?.[1] ?? genericAmountMatch?.[1] ?? firstNumberMatch?.[1] ?? 0
  );
  const amount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;

  const currency: "USDC" | "USDT" = lower.includes("usdt") ? "USDT" : "USDC";

  const daysMatch = text.match(/(\d{1,3})\s*(day|days|week|weeks)/i);
  const unit = daysMatch?.[2]?.toLowerCase();
  const rawDays = Number(daysMatch?.[1] ?? 14);
  const days = unit?.startsWith("week") ? rawDays * 7 : rawDays;
  const dueDate = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

  const label = text.split(/[.!?\n]/)[0]?.trim().slice(0, 100) || "Freelance services";

  return {
    clientName,
    clientEmail: emailMatch?.[0] ?? null,
    lineItems: [
      {
        label,
        amount,
        qty: 1,
      },
    ],
    total: amount,
    currency,
    dueDate,
    paymentTerms: `Net ${days}`,
    notes: null,
  };
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

    let parsed: ParsedInvoice;

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is missing. Falling back to deterministic parser.");
      parsed = buildFallbackInvoice(jobDescription);
    } else {
      try {
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
          throw new Error("AI returned empty content");
        }

        parsed = parseAIJson<ParsedInvoice>(aiResponse);
      } catch (aiError) {
        console.error("AI parse/generation error. Falling back:", aiError);
        parsed = buildFallbackInvoice(jobDescription);
      }
    }

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
        line_items: Array.isArray(parsed.lineItems) ? parsed.lineItems : [],
        total: Number(parsed.total) || 0,
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
