"use client";

import { useState } from "react";
import { Button, Textarea } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";

export default function NewInvoicePage() {
  const { user, loading: authLoading } = useAuth();
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-vela-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!jobDescription.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate invoice");
      }

      const { invoiceId } = await res.json();
      router.push(`/invoice/${invoiceId}/preview`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 py-8">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-display font-bold text-xl md:text-2xl text-vela-primary">
            New Invoice
          </h1>
        </div>
        <p className="text-vela-muted text-sm mb-8">
          Describe your job in plain English. AI will generate a professional
          invoice and contract.
        </p>

        <form onSubmit={handleGenerate}>
          <div className="bg-vela-surface border border-white/10 rounded-2xl p-6">
            <Textarea
              placeholder='e.g. "I built a landing page for a UK client, $800, due in 14 days. Client email: john@acme.com"'
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              className="w-full text-base"
              required
            />

            {error && (
              <p className="text-vela-red text-xs font-mono mt-3">{error}</p>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-6">
              <p className="text-vela-muted text-xs font-mono">
                {loading
                  ? "AI is drafting your invoice..."
                  : "Include: client name, email, amount, deadline, scope"}
              </p>
              <Button type="submit" loading={loading} className="w-full sm:w-auto">
                Generate Invoice & Contract
              </Button>
            </div>
          </div>
        </form>

        {loading && (
          <div className="mt-6 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-vela-violet animate-pulse" />
            <p className="text-violet-400 text-sm font-mono">
              Parsing job description with AI...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
