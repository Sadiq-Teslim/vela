import { NextResponse } from "next/server";
import { getGroq, AI_MODEL, parseAIJson } from "@/lib/groq";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are Vela's contract assistant. Generate a professional but concise freelance contract from the invoice data. Return ONLY valid JSON:
{
  "scope_of_work": string,
  "payment_schedule": string,
  "revision_policy": string,
  "kill_fee": string,
  "ip_ownership": string,
  "governing_law": "Nigerian Law",
  "confidentiality": string
}
Keep each field to 1-3 sentences. Professional, enforceable tone.
Never include markdown or explanation — return ONLY the JSON object.`;

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
      .select("*")
      .eq("id", invoiceId)
      .single();

    if (fetchError || !invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Call Groq to generate contract
    const completion = await getGroq().chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Invoice data: ${JSON.stringify(invoice)}\nJob description: ${invoice.job_description}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      return NextResponse.json(
        { error: "AI failed to generate contract" },
        { status: 500 }
      );
    }

    const parsed = parseAIJson<Record<string, string>>(aiResponse);

    // Save contract
    const { data: contract, error: dbError } = await supabase
      .from("contracts")
      .upsert(
        {
          invoice_id: invoiceId,
          content: parsed,
        },
        { onConflict: "invoice_id" }
      )
      .select("id")
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      return NextResponse.json(
        { error: "Failed to save contract" },
        { status: 500 }
      );
    }

    return NextResponse.json({ contractId: contract.id, content: parsed });
  } catch (err) {
    console.error("Generate contract error:", err);
    return NextResponse.json(
      { error: "Failed to generate contract" },
      { status: 500 }
    );
  }
}
