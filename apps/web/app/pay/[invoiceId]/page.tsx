"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@/lib/supabase/client";

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
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [autoCheckEnabled, setAutoCheckEnabled] = useState(true);
  const [verifyError, setVerifyError] = useState("");
  const [lastAutoCheck, setLastAutoCheck] = useState<string | null>(null);

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

  // Keep payment page in sync if the freelancer edits an unpaid invoice.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`invoice-live:${invoiceId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "invoices",
          filter: `id=eq.${invoiceId}`,
        },
        (payload) => {
          const updated = payload.new as Partial<Invoice>;
          setInvoice((prev) => {
            if (!prev) return prev;
            return { ...prev, ...updated } as Invoice;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invoiceId]);

  // Fallback polling for environments where realtime is unavailable.
  useEffect(() => {
    if (paid) return;

    const interval = setInterval(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("invoices")
        .select(
          "id, number, client_name, client_email, total, currency, due_date, status, user_id, line_items",
        )
        .eq("id", invoiceId)
        .single();

      if (data) {
        setInvoice((prev) =>
          prev ? ({ ...prev, ...(data as Partial<Invoice>) } as Invoice) : prev,
        );
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [invoiceId, paid]);

  const solanaPayUrl = useMemo(() => {
    if (!wallet || !invoice) return "";
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
    const networkKey: keyof typeof USDC_MINT =
      network === "mainnet" ? "mainnet" : "devnet";
    const mint = USDC_MINT[networkKey];
    if (!mint) return "";
    return `solana:${wallet}?amount=${invoice.total}&spl-token=${mint}&label=Vela-${invoice.number}&message=Payment%20for%20invoice%20${invoice.number}`;
  }, [wallet, invoice]);

  const phantomDeepLink = useMemo(() => {
    if (!wallet || !invoice) return "";
    const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
    const networkKey: keyof typeof USDC_MINT =
      network === "mainnet" ? "mainnet" : "devnet";
    const mint = USDC_MINT[networkKey];
    if (!mint) return "";
    return `https://phantom.app/ul/v1/transfer?recipient=${encodeURIComponent(wallet)}&amount=${encodeURIComponent(String(invoice.total))}&splToken=${encodeURIComponent(mint)}&label=${encodeURIComponent(`Vela-${invoice.number}`)}&message=${encodeURIComponent(`Payment for invoice ${invoice.number}`)}`;
  }, [wallet, invoice]);

  function clickOpen(link: string) {
    const a = document.createElement("a");
    a.href = link;
    a.target = "_self";
    a.rel = "noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function openPhantom() {
    if (!phantomDeepLink) {
      setVerifyError(
        "Phantom link is unavailable. Please try Open Wallet & Pay.",
      );
      return;
    }
    setVerifyError("");
    clickOpen(phantomDeepLink);
  }

  function openSolanaWallet() {
    if (!solanaPayUrl) {
      setVerifyError(
        "Payment URL is unavailable. Please refresh and try again.",
      );
      return;
    }
    setVerifyError("");
    clickOpen(solanaPayUrl);
  }

  function launchWallet() {
    if (!solanaPayUrl && !phantomDeepLink) {
      setVerifyError(
        "Could not build payment link. Please refresh and try again.",
      );
      return;
    }

    setVerifyError("");
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const primary =
      (isMobile ? phantomDeepLink : solanaPayUrl) ||
      phantomDeepLink ||
      solanaPayUrl;
    const secondary =
      (isMobile ? solanaPayUrl : phantomDeepLink) ||
      solanaPayUrl ||
      phantomDeepLink;

    if (!primary) {
      setVerifyError(
        "Could not open wallet link. Please copy and paste the pay URL.",
      );
      return;
    }

    try {
      sessionStorage.setItem(`vela:wallet-launched:${invoiceId}`, "1");
    } catch {
      // Ignore storage errors in restricted browser modes.
    }

    clickOpen(primary);

    // If browser blocks the first scheme, try the alternate link quickly.
    const secondaryTimer = window.setTimeout(() => {
      if (
        document.visibilityState === "visible" &&
        secondary &&
        secondary !== primary
      ) {
        clickOpen(secondary);
      }
    }, 900);

    // Show guidance if both launch attempts were blocked.
    const hintTimer = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        setVerifyError(
          "Wallet did not open automatically. Tap Copy Pay URL and paste it inside Phantom browser.",
        );
      }
    }, 2200);

    window.setTimeout(() => {
      clearTimeout(secondaryTimer);
      clearTimeout(hintTimer);
    }, 2600);
  }

  async function autoDetectPayment() {
    if (paid || autoVerifying || verifying) return;
    setAutoVerifying(true);
    try {
      const res = await fetch(`/api/verify-payment/${invoiceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.verified) {
        setPaid(true);
      }
      setLastAutoCheck(new Date().toISOString());
    } catch {
      // Keep silent here; manual verify and polling are still available.
    }
    setAutoVerifying(false);
  }

  // Try launching wallet automatically once per session for this invoice.
  useEffect(() => {
    if (!solanaPayUrl || paid) return;
    const t = setTimeout(() => {
      launchWallet();
      window.setTimeout(() => {
        autoDetectPayment();
      }, 3500);
    }, 700);

    return () => clearTimeout(t);
  }, [solanaPayUrl, paid, invoiceId]);

  // Detect payment after users return from wallet app / extension.
  useEffect(() => {
    if (paid) return;

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        autoDetectPayment();
      }
    };

    const onFocus = () => {
      autoDetectPayment();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [paid, invoiceId, autoVerifying, verifying]);

  // Background auto-check while payment is pending.
  useEffect(() => {
    if (paid || !autoCheckEnabled) return;
    const interval = setInterval(() => {
      autoDetectPayment();
    }, 6000);
    return () => clearInterval(interval);
  }, [paid, invoiceId, autoVerifying, verifying, autoCheckEnabled]);

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

  /* --------------------------------------------------------------- */
  /* Loading                                                          */
  /* --------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 border-2 border-[#0097a7] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 font-mono text-sm">
            Loading payment details...
          </p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <p className="text-red-500 font-mono">Invoice not found</p>
      </div>
    );
  }

  /* --------------------------------------------------------------- */
  /* Paid                                                             */
  /* --------------------------------------------------------------- */

  if (paid) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center px-4">
        {/* Subtle background decoration */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#ecfdf5] to-transparent pointer-events-none" />

        <motion.div
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6 shadow-lg shadow-emerald-200/50"
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#059669"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display font-bold text-3xl text-emerald-600 mb-2"
        >
          Payment Received
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 font-body text-center max-w-sm mb-6"
        >
          Invoice{" "}
          <span className="text-gray-900 font-medium">{invoice.number}</span>{" "}
          has been paid. The funds are being settled to the freelancer&apos;s
          wallet.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-gray-400 font-mono"
        >
          Powered by Vela
        </motion.p>
      </div>
    );
  }

  /* --------------------------------------------------------------- */
  /* Main                                                             */
  /* --------------------------------------------------------------- */

  const freelancerName =
    invoice.profiles?.business_name || invoice.profiles?.name || "Freelancer";

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Header bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logos/vela-logo-light.svg"
              alt="Vela"
              width={90}
              height={24}
              priority
            />
          </div>
          <span className="text-gray-400 text-xs font-mono hidden sm:inline">
            Secure payment
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Intro */}
          <p className="text-sm text-gray-500 mb-1">
            You have received an invoice from
          </p>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-gray-900 mb-8">
            {freelancerName}
          </h1>

          {/* Invoice summary */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-0.5">
                  Invoice
                </p>
                <p className="text-gray-900 font-mono text-sm font-medium">
                  {invoice.number}
                </p>
              </div>
              <span className="bg-amber-50 text-amber-700 font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full border border-amber-200">
                Pending
              </span>
            </div>

            <div className="space-y-2.5 mb-5">
              {invoice.line_items.map((item, i) => (
                <div key={i} className="flex justify-between items-start gap-4">
                  <span className="text-gray-900 font-body text-sm">
                    {item.label}
                    {item.qty > 1 && (
                      <span className="text-gray-400 ml-2 text-xs">
                        × {item.qty}
                      </span>
                    )}
                  </span>
                  <span className="text-gray-600 font-mono text-sm whitespace-nowrap">
                    ${(item.amount * item.qty).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 flex justify-between items-end">
              <div>
                <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-0.5">
                  Total due
                </p>
                <p className="text-gray-400 text-xs font-mono">
                  By {new Date(invoice.due_date).toLocaleDateString()}
                </p>
              </div>
              <p className="text-[#0097a7] font-mono text-3xl font-bold tracking-tight">
                ${invoice.total.toLocaleString()}
                <span className="text-gray-500 text-sm font-normal ml-1.5">
                  {invoice.currency}
                </span>
              </p>
            </div>
          </div>

          {/* Payment section */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900">
                  Pay with {invoice.currency}
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  Instant on-chain transfer via Solana
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-mono bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Secure
              </div>
            </div>

            {wallet ? (
              <div className="space-y-5">
                {/* QR Code */}
                {solanaPayUrl && (
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.15, duration: 0.4 }}
                      className="bg-white p-4 rounded-xl border-2 border-gray-100"
                    >
                      <QRCodeSVG
                        value={solanaPayUrl}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#0d1830"
                        level="M"
                      />
                    </motion.div>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Scan with Phantom, Backpack, or any Solana wallet
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="flex-1 h-px bg-gray-200" />
                  <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                    or pay manually
                  </span>
                  <span className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Wallet address */}
                <div>
                  <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-1.5">
                    Send {invoice.currency} to
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-xs text-gray-900 break-all">
                    {wallet}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <p className="text-xs text-gray-400 font-mono uppercase tracking-wider mb-1.5">
                    Exactly
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm text-gray-900">
                    {invoice.total} {invoice.currency}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={openPhantom}
                    className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-900 font-display font-bold px-4 py-2.5 rounded-lg text-sm transition"
                  >
                    Open Phantom
                  </button>
                  <button
                    onClick={openSolanaWallet}
                    className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-900 font-display font-bold px-4 py-2.5 rounded-lg text-sm transition"
                  >
                    Open Wallet URI
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={launchWallet}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-display font-bold px-4 py-2.5 rounded-lg text-sm transition shadow-sm"
                  >
                    Open Wallet & Pay
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => copyToClipboard(wallet, "address")}
                    className="flex-1 border border-gray-200 hover:border-gray-300 text-gray-900 font-display font-bold px-4 py-2.5 rounded-lg text-sm transition"
                  >
                    {copied === "address" ? "✓ Copied!" : "Copy Address"}
                  </button>
                  <button
                    onClick={() => copyToClipboard(solanaPayUrl, "url")}
                    className="flex-1 bg-[#0097a7] hover:bg-[#007e8c] text-white font-display font-bold px-4 py-2.5 rounded-lg text-sm transition shadow-sm"
                  >
                    {copied === "url" ? "✓ Copied!" : "Copy Pay URL"}
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 font-mono">
                  {autoVerifying
                    ? "Checking blockchain for your payment..."
                    : lastAutoCheck
                      ? `Auto-check active. Last check: ${new Date(lastAutoCheck).toLocaleTimeString()}`
                      : "Auto-check active. We will detect payment after wallet confirmation."}
                </p>

                {verifyError && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    {verifyError}
                  </div>
                )}

                {/* Manual verification */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4">
                  <p className="text-xs text-gray-600 font-medium mb-1">
                    Already paid?
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    Paste your transaction signature to confirm
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      placeholder="Transaction signature..."
                      value={txInput}
                      onChange={(e) => setTxInput(e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-900 font-mono text-xs placeholder:text-gray-400 focus:outline-none focus:border-[#0097a7] focus:ring-1 focus:ring-[#0097a7]/20"
                    />
                    <button
                      onClick={handleVerifyTx}
                      disabled={verifying || !txInput.trim()}
                      className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-display font-bold px-4 py-2 rounded-lg text-xs transition"
                    >
                      {verifying ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                  {verifyError && (
                    <p className="text-red-600 text-xs mt-2 font-mono">
                      {verifyError}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm font-body">
                  Payment wallet not configured yet. Please contact the
                  freelancer.
                </p>
              </div>
            )}
          </div>

          {/* Trust footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400 font-mono">
              Payments are verified on-chain. Vela never holds your funds.
            </p>
          </div>
        </motion.div>
      </main>

      <footer className="py-8 border-t border-gray-200 mt-8 bg-white">
        <div className="max-w-2xl mx-auto px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logos/vela-mark-bare.svg"
              alt=""
              width={16}
              height={18}
              style={{ filter: "grayscale(1) brightness(0.3)" }}
            />
            <span className="text-xs text-gray-500 font-mono">
              Powered by Vela — get paid. on-chain.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
