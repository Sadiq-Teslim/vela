"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Badge, Button, StatCard } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import type { InvoiceStatus, FollowUpType } from "@/types/database";

interface Invoice {
  id: string;
  number: string;
  client_name: string;
  client_email: string;
  job_description: string;
  line_items: { label: string; amount: number; qty: number }[];
  total: number;
  currency: string;
  due_date: string;
  status: InvoiceStatus;
  payment_tx_hash: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
}

interface FollowUp {
  id: string;
  type: FollowUpType;
  sent_at: string | null;
  created_at: string;
}

const STATUS_STEPS: InvoiceStatus[] = ["DRAFT", "SENT", "PENDING", "PAID"];

const STATUS_BADGE: Record<
  InvoiceStatus,
  "paid" | "pending" | "overdue" | "on-chain" | "ai-draft" | "draft"
> = {
  DRAFT: "draft",
  SENT: "pending",
  PENDING: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
};

const FOLLOW_UP_LABELS: Record<FollowUpType, string> = {
  reminder_before: "Reminder (3 days before)",
  due_date: "Due date reminder",
  overdue: "Overdue notice",
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const { data: inv } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", id)
        .single();
      if (inv) setInvoice(inv as Invoice);

      const { data: fups } = await supabase
        .from("follow_ups")
        .select("*")
        .eq("invoice_id", id)
        .order("created_at", { ascending: false });
      if (fups) setFollowUps(fups as FollowUp[]);

      setLoading(false);
    }
    fetchData();
  }, [id]);

  async function handleResend() {
    setResending(true);
    try {
      const res = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: id }),
      });
      if (res.ok) {
        toast("Invoice resent to client", "success");
        setInvoice((prev) =>
          prev
            ? { ...prev, status: "SENT", sent_at: new Date().toISOString() }
            : prev,
        );
      }
    } catch {
      toast("Failed to resend invoice", "error");
    }
    setResending(false);
  }

  async function handleSendFollowUp(type: FollowUpType) {
    setSendingFollowUp(true);
    try {
      const res = await fetch("/api/draft-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: id, type }),
      });
      if (res.ok) {
        toast(`Follow-up email sent (${FOLLOW_UP_LABELS[type]})`, "success");
        // Refresh follow-ups
        const supabase = createClient();
        const { data: fups } = await supabase
          .from("follow_ups")
          .select("*")
          .eq("invoice_id", id)
          .order("created_at", { ascending: false });
        if (fups) setFollowUps(fups as FollowUp[]);
      }
    } catch {
      toast("Failed to send follow-up", "error");
    }
    setSendingFollowUp(false);
  }

  function copyPaymentLink() {
    const url = `${window.location.origin}/pay/${id}`;
    navigator.clipboard.writeText(url);
    toast("Payment link copied", "info");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-vela-cyan border-t-transparent rounded-full animate-spin" />
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

  const currentStep = STATUS_STEPS.indexOf(invoice.status);
  const isOverdue = invoice.status === "OVERDUE";

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display font-bold text-2xl text-vela-primary">
                {invoice.number}
              </h1>
              <Badge variant={STATUS_BADGE[invoice.status]} />
            </div>
            <p className="text-vela-muted text-sm">
              {invoice.client_name} &middot; ${invoice.total.toLocaleString()}{" "}
              {invoice.currency}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={() => window.open(`/api/generate-pdf/${id}`, "_blank")}
            >
              Download PDF
            </Button>
            <Button variant="secondary" onClick={copyPaymentLink}>
              Copy Pay Link
            </Button>
            {invoice.status !== "PAID" && (
              <Button onClick={handleResend} loading={resending}>
                Resend Invoice
              </Button>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        <Card className="mb-6">
          <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-4">
            Status Timeline
          </p>
          <div className="flex items-center gap-0">
            {STATUS_STEPS.map((step, i) => {
              const reached = isOverdue ? step === "OVERDUE" : i <= currentStep;
              const isCurrent = step === invoice.status;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition ${
                        isCurrent
                          ? "bg-vela-cyan text-vela-void ring-2 ring-vela-cyan/30"
                          : reached
                            ? "bg-vela-mint/20 text-vela-mint"
                            : "bg-vela-panel text-vela-muted"
                      }`}
                    >
                      {reached && !isCurrent ? "✓" : i + 1}
                    </div>
                    <span
                      className={`text-[10px] font-mono mt-1.5 ${
                        isCurrent ? "text-vela-cyan" : "text-vela-muted"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div
                      className={`h-[2px] flex-1 -mt-5 ${
                        i < currentStep ? "bg-vela-mint/40" : "bg-vela-panel"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Amount"
            value={`$${invoice.total.toLocaleString()}`}
            sub={invoice.currency}
            accent="cyan"
          />
          <StatCard
            label="Due Date"
            value={new Date(invoice.due_date).toLocaleDateString()}
            sub={
              isOverdue
                ? "OVERDUE"
                : invoice.status === "PAID"
                  ? "Paid"
                  : "Pending"
            }
            accent={isOverdue ? "gold" : "mint"}
          />
          <StatCard
            label="Created"
            value={new Date(invoice.created_at).toLocaleDateString()}
            sub={
              invoice.sent_at
                ? `Sent ${new Date(invoice.sent_at).toLocaleDateString()}`
                : "Not sent"
            }
            accent="violet"
          />
        </div>

        {/* Invoice details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-3">
              Line Items
            </p>
            <div className="space-y-2">
              {invoice.line_items.map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center bg-vela-panel rounded-lg p-3"
                >
                  <span className="text-vela-primary font-body text-sm">
                    {item.label}
                  </span>
                  <span className="text-vela-primary font-mono text-sm">
                    {item.qty} x ${item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-3">
              Client Details
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-vela-muted text-xs font-mono">Name</p>
                <p className="text-vela-primary font-body">
                  {invoice.client_name}
                </p>
              </div>
              <div>
                <p className="text-vela-muted text-xs font-mono">Email</p>
                <p className="text-vela-primary font-body">
                  {invoice.client_email || "N/A"}
                </p>
              </div>
              {invoice.payment_tx_hash && (
                <div>
                  <p className="text-vela-muted text-xs font-mono">
                    Transaction
                  </p>
                  <p className="text-vela-cyan font-mono text-xs break-all">
                    {invoice.payment_tx_hash}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Follow-up section */}
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-vela-muted text-xs font-mono uppercase tracking-wider">
              Follow-ups
            </p>
            {invoice.status !== "PAID" && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => handleSendFollowUp("reminder_before")}
                  loading={sendingFollowUp}
                  className="text-xs"
                >
                  Send Reminder
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => handleSendFollowUp("overdue")}
                  loading={sendingFollowUp}
                  className="text-xs"
                >
                  Send Overdue Notice
                </Button>
              </div>
            )}
          </div>

          {followUps.length === 0 ? (
            <p className="text-vela-muted text-sm text-center py-4">
              No follow-ups sent yet
            </p>
          ) : (
            <div className="space-y-2">
              {followUps.map((fu) => (
                <div
                  key={fu.id}
                  className="flex items-center justify-between bg-vela-panel rounded-lg p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-vela-violet" />
                    <span className="text-vela-primary font-body text-sm">
                      {FOLLOW_UP_LABELS[fu.type]}
                    </span>
                  </div>
                  <span className="text-vela-muted font-mono text-xs">
                    {new Date(fu.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Original description */}
        <Card className="opacity-70">
          <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-2">
            Original Job Description
          </p>
          <p className="text-vela-primary/70 text-sm font-body leading-relaxed">
            {invoice.job_description}
          </p>
        </Card>

        <div className="flex gap-3 mt-6">
          {invoice.status !== "PAID" && (
            <Button
              variant="ghost"
              onClick={() => router.push(`/invoice/${id}/preview`)}
            >
              Edit Unpaid Invoice
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => router.push(`/invoice/${id}/contract`)}
          >
            View Contract
          </Button>
        </div>
      </div>
    </div>
  );
}
