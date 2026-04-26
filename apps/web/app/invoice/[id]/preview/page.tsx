"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Badge, Card, Input } from "@/components/ui";

interface LineItem {
  label: string;
  amount: number;
  qty: number;
}

interface Invoice {
  id: string;
  number: string;
  client_name: string;
  client_email: string;
  job_description: string;
  line_items: LineItem[];
  total: number;
  currency: string;
  due_date: string;
  status: string;
}

export default function InvoicePreviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function fetchInvoice() {
      const supabase = createClient();
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();

      if (data) setInvoice(data as Invoice);
      setLoading(false);
    }
    fetchInvoice();
  }, [id]);

  async function handleSave() {
    if (!invoice) return;
    if (invoice.status === "PAID") return;
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("invoices")
      .update({
        client_name: invoice.client_name,
        client_email: invoice.client_email,
        line_items: invoice.line_items,
        total: invoice.total,
        due_date: invoice.due_date,
      })
      .eq("id", id);

    if (!error) setEditing(false);
    setSaving(false);
  }

  async function handleGenerateContract() {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: id }),
      });
      if (res.ok) {
        router.push(`/invoice/${id}/contract`);
      }
    } catch {
      setGenerating(false);
    }
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    if (!invoice) return;
    const items = [...invoice.line_items];
    const current = items[index]!;
    if (field === "label") {
      items[index] = { label: value, amount: current.amount, qty: current.qty };
    } else {
      items[index] = {
        label: current.label,
        amount: current.amount,
        qty: current.qty,
        [field]: parseFloat(value) || 0,
      };
    }
    const total = items.reduce((sum, item) => sum + item.amount * item.qty, 0);
    setInvoice({ ...invoice, line_items: items, total });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-vela-cyan border-t-transparent rounded-full animate-spin" />
          <p className="text-vela-muted font-mono text-sm">
            Loading invoice...
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-vela-red font-mono">Invoice not found</p>
      </div>
    );
  }

  const canEdit = invoice.status !== "PAID";

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display font-bold text-xl md:text-2xl text-vela-primary">
                Invoice {invoice.number}
              </h1>
              <Badge variant="ai-draft" />
            </div>
            <p className="text-vela-muted text-sm">
              {canEdit
                ? "Review and edit. Changes sync to your payment link."
                : "Invoice has been paid and is now locked."}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canEdit && editing ? (
              <>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} loading={saving}>
                  Save Changes
                </Button>
              </>
            ) : canEdit ? (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                Edit Fields
              </Button>
            ) : (
              <Button variant="secondary" disabled>
                Paid Invoice
              </Button>
            )}
          </div>
        </div>

        <Card className="mb-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-1">
                Client
              </p>
              {editing ? (
                <Input
                  value={invoice.client_name}
                  onChange={(e) =>
                    setInvoice({ ...invoice, client_name: e.target.value })
                  }
                />
              ) : (
                <p className="text-vela-primary font-body">
                  {invoice.client_name}
                </p>
              )}
            </div>
            <div>
              <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-1">
                Client Email
              </p>
              {editing ? (
                <Input
                  value={invoice.client_email}
                  onChange={(e) =>
                    setInvoice({ ...invoice, client_email: e.target.value })
                  }
                />
              ) : (
                <p className="text-vela-primary font-body">
                  {invoice.client_email || "Not provided"}
                </p>
              )}
            </div>
            <div>
              <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-1">
                Due Date
              </p>
              {editing ? (
                <Input
                  type="date"
                  value={invoice.due_date.split("T")[0]}
                  onChange={(e) =>
                    setInvoice({
                      ...invoice,
                      due_date: new Date(e.target.value).toISOString(),
                    })
                  }
                />
              ) : (
                <p className="text-vela-primary font-mono">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <div>
              <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-1">
                Currency
              </p>
              <p className="text-vela-cyan font-mono">{invoice.currency}</p>
            </div>
          </div>

          {/* Line items */}
          <div className="border-t border-vela-border pt-4">
            <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-3">
              Line Items
            </p>
            <div className="space-y-2">
              {invoice.line_items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-vela-panel rounded-lg p-3"
                >
                  {editing ? (
                    <>
                      <input
                        className="flex-1 bg-transparent text-vela-primary font-body text-sm border-b border-vela-border focus:border-vela-cyan/50 outline-none pb-1"
                        value={item.label}
                        onChange={(e) =>
                          updateLineItem(i, "label", e.target.value)
                        }
                      />
                      <input
                        className="w-16 bg-transparent text-vela-primary font-mono text-sm text-right border-b border-vela-border focus:border-vela-cyan/50 outline-none pb-1"
                        type="number"
                        value={item.qty}
                        onChange={(e) =>
                          updateLineItem(i, "qty", e.target.value)
                        }
                      />
                      <span className="text-vela-muted text-xs">x</span>
                      <input
                        className="w-24 bg-transparent text-vela-primary font-mono text-sm text-right border-b border-vela-border focus:border-vela-cyan/50 outline-none pb-1"
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          updateLineItem(i, "amount", e.target.value)
                        }
                      />
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-vela-primary font-body text-sm">
                        {item.label}
                      </span>
                      <span className="text-vela-muted font-mono text-sm">
                        {item.qty} x
                      </span>
                      <span className="text-vela-primary font-mono text-sm">
                        ${item.amount.toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-vela-border mt-4 pt-4 flex justify-between items-center">
            <p className="text-vela-muted font-display font-bold text-sm">
              Total
            </p>
            <p className="text-vela-cyan font-mono text-2xl font-medium">
              ${invoice.total.toLocaleString()} {invoice.currency}
            </p>
          </div>
        </Card>

        {/* Job description reference */}
        <Card className="mb-6 opacity-70">
          <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-2">
            Original Description
          </p>
          <p className="text-vela-primary/70 text-sm font-body">
            {invoice.job_description}
          </p>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => window.open(`/api/generate-pdf/${id}`, "_blank")}
          >
            Download PDF
          </Button>
          <Button variant="secondary" onClick={() => router.push("/dashboard")}>
            Save as Draft
          </Button>
          <Button onClick={handleGenerateContract} loading={generating}>
            Generate Contract →
          </Button>
        </div>
      </div>
    </div>
  );
}
