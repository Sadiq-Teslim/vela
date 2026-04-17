"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Badge, Card } from "@/components/ui";

interface ContractContent {
  scope_of_work: string;
  payment_schedule: string;
  revision_policy: string;
  kill_fee: string;
  ip_ownership: string;
  governing_law: string;
  confidentiality: string;
}

const SECTION_LABELS: Record<keyof ContractContent, string> = {
  scope_of_work: "Scope of Work",
  payment_schedule: "Payment Schedule",
  revision_policy: "Revision Policy",
  kill_fee: "Kill Fee",
  ip_ownership: "IP Ownership",
  governing_law: "Governing Law",
  confidentiality: "Confidentiality",
};

export default function ContractPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contract, setContract] = useState<ContractContent | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<keyof ContractContent | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchContract() {
      const supabase = createClient();

      const { data: inv } = await supabase
        .from("invoices")
        .select("number")
        .eq("id", id)
        .single();
      if (inv) setInvoiceNumber(inv.number);

      const { data } = await supabase
        .from("contracts")
        .select("content")
        .eq("invoice_id", id)
        .single();

      if (data) setContract(data.content as ContractContent);
      setLoading(false);
    }
    fetchContract();
  }, [id]);

  async function handleSaveSection(field: keyof ContractContent, value: string) {
    if (!contract) return;
    const updated = { ...contract, [field]: value };
    setContract(updated);
    setEditingField(null);

    const supabase = createClient();
    await supabase
      .from("contracts")
      .update({ content: updated })
      .eq("invoice_id", id);
  }

  async function handleSendInvoice() {
    setSending(true);
    try {
      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: id }),
      });
      if (res.ok) {
        router.push("/dashboard");
      }
    } catch {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-vela-violet border-t-transparent rounded-full animate-spin" />
          <p className="text-vela-muted font-mono text-sm">Loading contract...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-vela-red font-mono">Contract not found</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display font-bold text-2xl text-vela-primary">
                Contract — {invoiceNumber}
              </h1>
              <Badge variant="ai-draft" />
            </div>
            <p className="text-vela-muted text-sm">
              Review AI-generated contract sections. Click any section to edit.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {(Object.keys(SECTION_LABELS) as (keyof ContractContent)[]).map(
            (field) => (
              <ContractSection
                key={field}
                label={SECTION_LABELS[field]}
                value={contract[field]}
                editing={editingField === field}
                onEdit={() => setEditingField(field)}
                onSave={(val) => handleSaveSection(field, val)}
                onCancel={() => setEditingField(null)}
              />
            )
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 mt-8">
          <Button
            variant="secondary"
            onClick={() => router.push(`/invoice/${id}/preview`)}
          >
            ← Back to Invoice
          </Button>
          <Button onClick={handleSendInvoice} loading={sending}>
            Send Invoice & Contract →
          </Button>
        </div>
      </div>
    </div>
  );
}

function ContractSection({
  label,
  value,
  editing,
  onEdit,
  onSave,
  onCancel,
}: {
  label: string;
  value: string;
  editing: boolean;
  onEdit: () => void;
  onSave: (val: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState(value);

  useEffect(() => {
    setText(value);
  }, [value]);

  return (
    <Card
      className="border-l-2 border-l-vela-violet/50 cursor-pointer hover:border-l-vela-violet transition"
      onClick={() => !editing && onEdit()}
    >
      <div className="flex items-center gap-2 mb-2">
        <p className="text-vela-muted text-xs font-mono uppercase tracking-wider">
          {label}
        </p>
        <Badge variant="ai-draft" label="AI" />
      </div>
      {editing ? (
        <div onClick={(e) => e.stopPropagation()}>
          <textarea
            className="w-full bg-vela-panel border border-white/10 rounded-lg px-3 py-2 text-vela-primary font-body text-sm focus:outline-none focus:border-vela-violet/50 resize-none"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={() => onSave(text)}>Save</Button>
          </div>
        </div>
      ) : (
        <p className="text-vela-primary font-body text-sm leading-relaxed">
          {value}
        </p>
      )}
    </Card>
  );
}
