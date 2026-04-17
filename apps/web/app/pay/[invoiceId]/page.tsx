"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, Badge, Button, Input } from "@/components/ui";
import { QRCodeSVG } from "qrcode.react";

interface Invoice {
  id: string;
  number: string;
  client_name: string;
  client_email: string;
  total: number;
  currency: string;
  due_date: string;
  status: string;
  user_id: string;
  line_items: { label: string; amount: number; qty: number }[];
  profiles?: { name: string; business_name: string | null };
}

const USDC_MINT: Record<string, string> = {
  mainnet: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  devnet: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
};

export default function PaymentPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [wallet, setWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [txInput, setTxInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  useEffect(() => {
    async function fetchInvoice() {
      const supabase = createClient();
      const { data } = await supabase
        .from("invoices")
        .select("*, profiles(name, business_name)")
        .eq("id", invoiceId)
        .single();

      if (data) {
        setInvoice(data as unknown as Invoice);
        if (data.status === "PAID") setPaid(true);

        const { data: profile } = await supabase
          .from("profiles")
          .select("raenest_wallet")
          .eq("id", data.user_id)
          .single();
        if (profile?.raenest_wallet) setWallet(profile.raenest_wallet);
      }
      setLoading(false);
    }
    fetchInvoice();
  }, [invoiceId]);

  // Poll for payment status every 5s
  useEffect(() => {
    if (paid || !invoice) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/payment-status/${invoiceId}`);
      const data = await res.json();
      if (data.paid) {
        setPaid(true);
        clearInterval(interval);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [invoiceId, paid, invoice]);

  const solanaPayUrl = useMemo(() => {
    if (!wallet || !invoice) return "";
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
    const mint = USDC_MINT[network] || USDC_MINT.devnet;
    return `solana:${wallet}?amount=${invoice.total}&spl-token=${mint}&label=Vela-${invoice.number}&message=Payment%20for%20invoice%20${invoice.number}`;
  }, [wallet, invoice]);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleVerifyTx() {
    if (!txInput.trim()) return;
    setVerifying(true);
    setVerifyError("");
    try {
      const res = await fetch(`/api/verify-payment/${invoiceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txSignature: txInput.trim() }),
      });
      const data = await res.json();
      if (data.verified) {
        setPaid(true);
      } else {
        setVerifyError(data.error || "Payment not verified");
      }
    } catch {
      setVerifyError("Verification failed");
    }
    setVerifying(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-vela-cyan border-t-transparent rounded-full animate-spin" />
          <p className="text-vela-muted font-mono text-sm">Loading payment details...</p>
        </div>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-vela-red font-mono">Invoice not found</p>
      </main>
    );
  }

  if (paid) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-20 h-20 rounded-full bg-vela-mint/20 flex items-center justify-center mb-6">
          <span className="text-vela-mint text-4xl">&#10003;</span>
        </div>
        <h1 className="font-display font-bold text-3xl text-vela-mint mb-2">
          Payment Received
        </h1>
        <p className="text-vela-muted font-body text-center max-w-sm">
          Invoice <span className="text-vela-primary">{invoice.number}</span>{" "}
          has been paid. The funds are being settled to the freelancer&apos;s
          Raenest wallet.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center gap-2 justify-center mb-4">
            <div className="w-8 h-8 rounded-lg bg-vela-cyan/20 flex items-center justify-center">
              <span className="text-vela-cyan font-display font-bold text-sm">V</span>
            </div>
            <span className="font-display font-bold text-lg text-vela-primary">vela</span>
          </div>
          <p className="text-vela-muted text-sm">
            Invoice from{" "}
            <span className="text-vela-primary">
              {invoice.profiles?.business_name || invoice.profiles?.name || "Freelancer"}
            </span>
          </p>
        </div>

        {/* Invoice summary */}
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-vela-muted font-mono text-xs">{invoice.number}</span>
            <Badge variant="pending" />
          </div>

          <div className="space-y-2 mb-4">
            {invoice.line_items.map((item, i) => (
              <div key={i} className="flex justify-between items-center">
                <span className="text-vela-primary font-body text-sm">{item.label}</span>
                <span className="text-vela-muted font-mono text-sm">
                  ${(item.amount * item.qty).toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-3 flex justify-between items-center">
            <span className="text-vela-muted font-display font-bold text-sm">Total</span>
            <span className="text-vela-cyan font-mono text-2xl font-medium">
              ${invoice.total.toLocaleString()} {invoice.currency}
            </span>
          </div>

          <p className="text-vela-muted text-xs font-mono mt-2">
            Due: {new Date(invoice.due_date).toLocaleDateString()}
          </p>
        </Card>

        {/* Payment section */}
        <Card>
          <h3 className="font-display font-bold text-lg text-vela-primary mb-4">
            Pay with {invoice.currency}
          </h3>

          {wallet ? (
            <div className="space-y-4">
              {/* QR Code */}
              {solanaPayUrl && (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-xl">
                    <QRCodeSVG
                      value={solanaPayUrl}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#040812"
                      level="M"
                    />
                  </div>
                </div>
              )}

              <p className="text-vela-muted text-xs text-center">
                Scan with Phantom, Backpack, or any Solana wallet
              </p>

              {/* Wallet address */}
              <div className="bg-vela-panel rounded-lg p-3">
                <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-1">
                  Send {invoice.currency} to
                </p>
                <p className="text-vela-primary font-mono text-xs break-all">
                  {wallet}
                </p>
              </div>

              {/* Amount */}
              <div className="bg-vela-panel rounded-lg p-3">
                <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-1">
                  Amount
                </p>
                <p className="text-vela-cyan font-mono text-lg">
                  {invoice.total} {invoice.currency}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => copyToClipboard(wallet, "address")}
                >
                  {copied === "address" ? "Copied!" : "Copy Address"}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => copyToClipboard(solanaPayUrl, "url")}
                >
                  {copied === "url" ? "Copied!" : "Copy Pay URL"}
                </Button>
              </div>

              {/* Manual verification */}
              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-2">
                  Already paid? Paste your transaction signature
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Transaction signature..."
                    value={txInput}
                    onChange={(e) => setTxInput(e.target.value)}
                    className="flex-1 font-mono text-xs"
                  />
                  <Button
                    variant="secondary"
                    onClick={handleVerifyTx}
                    loading={verifying}
                  >
                    Verify
                  </Button>
                </div>
                {verifyError && (
                  <p className="text-vela-red text-xs font-mono mt-2">
                    {verifyError}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-vela-gold text-sm font-body">
                Payment wallet not configured yet. Please contact the freelancer.
              </p>
            </div>
          )}
        </Card>

        <p className="text-center text-vela-muted text-xs font-mono mt-6">
          Powered by Vela — get paid. on-chain.
        </p>
      </div>
    </main>
  );
}
