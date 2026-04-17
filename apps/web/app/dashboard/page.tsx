"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatCard, Badge, Card, Button, Input } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";
import type { InvoiceStatus } from "@/types/database";

interface Invoice {
  id: string;
  number: string;
  client_name: string;
  client_email: string;
  total: number;
  currency: string;
  due_date: string;
  status: InvoiceStatus;
  created_at: string;
}

const STATUS_BADGE: Record<InvoiceStatus, "paid" | "pending" | "overdue" | "on-chain" | "ai-draft" | "draft"> = {
  DRAFT: "draft",
  SENT: "pending",
  PENDING: "pending",
  PAID: "paid",
  OVERDUE: "overdue",
};

type FilterStatus = "ALL" | InvoiceStatus;

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("ALL");
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const supabase = createClient();

    async function fetchInvoices() {
      const { data } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) setInvoices(data as Invoice[]);
      setLoading(false);
    }

    fetchInvoices();

    // Subscribe to realtime changes on invoices for this user — so the
    // dashboard updates the moment a client pays.
    const channel = supabase
      .channel(`invoices:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "invoices",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchInvoices();
        }
      )
      .subscribe();

    // Also refetch when window regains focus (fallback for clients with
    // realtime disabled at the Supabase project level).
    const onFocus = () => fetchInvoices();
    window.addEventListener("focus", onFocus);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
    };
  }, [user]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        !search ||
        inv.number.toLowerCase().includes(search.toLowerCase()) ||
        inv.client_name.toLowerCase().includes(search.toLowerCase()) ||
        inv.client_email.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === "ALL" || inv.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [invoices, search, filter]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-vela-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalEarned = invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + i.total, 0);

  const awaitingPayment = invoices
    .filter((i) => ["SENT", "PENDING"].includes(i.status))
    .reduce((sum, i) => sum + i.total, 0);

  const settled = totalEarned;

  function copyPaymentLink(invoiceId: string) {
    const url = `${window.location.origin}/pay/${invoiceId}`;
    navigator.clipboard.writeText(url);
    toast("Payment link copied", "info");
  }

  const FILTERS: { label: string; value: FilterStatus }[] = [
    { label: "All", value: "ALL" },
    { label: "Draft", value: "DRAFT" },
    { label: "Sent", value: "SENT" },
    { label: "Paid", value: "PAID" },
    { label: "Overdue", value: "OVERDUE" },
  ];

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h1 className="font-display font-bold text-2xl text-vela-primary">
            Dashboard
          </h1>
          <Link href="/invoice/new" className="hidden sm:block">
            <Button>New Invoice</Button>
          </Link>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
          <StatCard
            label="Total Earned"
            value={`$${totalEarned.toLocaleString()}`}
            sub="USDC"
            accent="cyan"
          />
          <StatCard
            label="Awaiting Payment"
            value={`$${awaitingPayment.toLocaleString()}`}
            sub="Pending invoices"
            accent="gold"
          />
          <StatCard
            label="Settled to Raenest"
            value={`$${settled.toLocaleString()}`}
            sub="USD"
            accent="mint"
          />
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Input
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex gap-1.5 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                  filter === f.value
                    ? "bg-vela-cyan/10 text-vela-cyan"
                    : "bg-vela-panel text-vela-muted hover:text-vela-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice List */}
        {loading ? (
          <Card className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-vela-cyan border-t-transparent rounded-full animate-spin" />
              <p className="text-vela-muted font-mono text-sm">Loading invoices...</p>
            </div>
          </Card>
        ) : invoices.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-vela-panel flex items-center justify-center mb-4">
              <span className="text-3xl">📄</span>
            </div>
            <p className="text-vela-primary font-display font-bold text-lg mb-1">
              No invoices yet
            </p>
            <p className="text-vela-muted text-sm mb-6">
              Describe your first job to get started.
            </p>
            <Link href="/invoice/new">
              <Button>Create Your First Invoice</Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <Card className="p-0 overflow-hidden hidden md:block">
              <div className="grid grid-cols-[1fr_1.2fr_0.8fr_0.8fr_0.7fr_1fr] gap-4 px-6 py-3 border-b border-white/5 text-vela-muted text-xs font-mono uppercase tracking-wider">
                <span>Invoice #</span>
                <span>Client</span>
                <span>Amount</span>
                <span>Due Date</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              {filtered.map((invoice) => (
                <div
                  key={invoice.id}
                  className="grid grid-cols-[1fr_1.2fr_0.8fr_0.8fr_0.7fr_1fr] gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition items-center cursor-pointer"
                  onClick={() => router.push(`/invoice/${invoice.id}/detail`)}
                >
                  <span className="text-vela-primary font-mono text-sm">
                    {invoice.number}
                  </span>
                  <span className="text-vela-primary font-body text-sm truncate">
                    {invoice.client_name}
                  </span>
                  <span className="text-vela-primary font-mono text-sm">
                    ${invoice.total.toLocaleString()}
                  </span>
                  <span className="text-vela-muted font-mono text-xs">
                    {new Date(invoice.due_date).toLocaleDateString()}
                  </span>
                  <Badge variant={STATUS_BADGE[invoice.status]} />
                  <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => copyPaymentLink(invoice.id)}
                      className="text-vela-muted hover:text-vela-cyan text-xs font-mono px-2 py-1 rounded hover:bg-white/5 transition"
                    >
                      Link
                    </button>
                    <button
                      onClick={() => window.open(`/api/generate-pdf/${invoice.id}`, "_blank")}
                      className="text-vela-muted hover:text-vela-cyan text-xs font-mono px-2 py-1 rounded hover:bg-white/5 transition"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <p className="text-vela-muted text-sm">No invoices match your filters</p>
                </div>
              )}
            </Card>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filtered.map((invoice) => (
                <Card
                  key={invoice.id}
                  className="cursor-pointer active:scale-[0.99] transition"
                  onClick={() => router.push(`/invoice/${invoice.id}/detail`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-vela-primary font-mono text-sm">{invoice.number}</span>
                    <Badge variant={STATUS_BADGE[invoice.status]} />
                  </div>
                  <p className="text-vela-primary font-body text-sm mb-1">{invoice.client_name}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-vela-cyan font-mono text-lg font-medium">
                      ${invoice.total.toLocaleString()}
                    </span>
                    <span className="text-vela-muted font-mono text-xs">
                      Due {new Date(invoice.due_date).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))}

              {filtered.length === 0 && (
                <p className="text-vela-muted text-sm text-center py-4">No invoices match your filters</p>
              )}
            </div>
          </>
        )}

        {/* Mobile FAB */}
        <Link href="/invoice/new" className="md:hidden">
          <button className="fixed bottom-20 right-4 bg-vela-cyan text-vela-void font-display font-bold w-14 h-14 rounded-2xl text-2xl shadow-lg shadow-vela-cyan/20 hover:brightness-110 transition flex items-center justify-center z-30">
            +
          </button>
        </Link>
      </div>
    </div>
  );
}
