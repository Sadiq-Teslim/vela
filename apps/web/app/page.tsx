"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ParallaxBackground,
  Reveal,
  Stagger,
  StaggerItem,
  Typewriter,
} from "@/components/motion";
import { ThemeToggle } from "@/components/theme";

// Explicit class maps — Tailwind can't compile dynamic strings
const ACCENT_TEXT = {
  cyan: "text-vela-cyan",
  violet: "text-violet-400",
  gold: "text-vela-gold",
  mint: "text-vela-mint",
  primary: "text-vela-primary",
} as const;

const ACCENT_BOX = {
  cyan: "bg-vela-cyan/10 border-vela-cyan/20 text-vela-cyan",
  violet: "bg-vela-violet/15 border-vela-violet/25 text-violet-400",
  gold: "bg-vela-gold/10 border-vela-gold/20 text-vela-gold",
  mint: "bg-vela-mint/10 border-vela-mint/20 text-vela-mint",
} as const;

type Accent = keyof typeof ACCENT_TEXT;
type BoxAccent = keyof typeof ACCENT_BOX;

const STEPS: { num: string; color: BoxAccent; title: string; body: string }[] = [
  {
    num: "01",
    color: "violet",
    title: "Describe the job",
    body: "One sentence in plain English. No forms, no dropdowns.",
  },
  {
    num: "02",
    color: "cyan",
    title: "AI drafts everything",
    body: "Invoice, contract, payment terms, follow-up schedule.",
  },
  {
    num: "03",
    color: "gold",
    title: "Client pays USDC",
    body: "Solana Pay QR code, Phantom, Backpack, or direct transfer.",
  },
  {
    num: "04",
    color: "mint",
    title: "Funds settle to Raenest",
    body: "USDC → USD → NGN in your Nigerian bank.",
  },
];

const FEATURES: { icon: string; color: BoxAccent; title: string; body: string }[] = [
  {
    icon: "◇",
    color: "cyan",
    title: "AI Invoice Parser",
    body: "Plain-English job descriptions become structured line items, due dates, and totals — instantly.",
  },
  {
    icon: "§",
    color: "violet",
    title: "Smart Contracts",
    body: "Scope, kill fee, revision policy, IP ownership, governing law — auto-generated and editable.",
  },
  {
    icon: "◈",
    color: "gold",
    title: "Solana Payment Links",
    body: "QR codes for Phantom & Backpack. USDC or USDT. Verified on-chain before you ship.",
  },
  {
    icon: "⟳",
    color: "mint",
    title: "Agentic Follow-ups",
    body: "AI drafts contextual reminders at T-3d, due date, and T+3d. You approve or auto-send.",
  },
  {
    icon: "◫",
    color: "cyan",
    title: "Beautiful PDF Export",
    body: "Invoice + contract bundled into a Vela-branded PDF. Email to your client in one click.",
  },
  {
    icon: "✓",
    color: "gold",
    title: "Raenest Settlement",
    body: "Paste your Raenest Solana wallet. USDC arrives, converts to USD, lands in your NGN bank.",
  },
];

const STACK: { name: string; accent: Accent }[] = [
  { name: "Solana", accent: "cyan" },
  { name: "Raenest", accent: "gold" },
  { name: "Groq AI", accent: "violet" },
  { name: "Next.js", accent: "primary" },
  { name: "Supabase", accent: "mint" },
  { name: "Resend", accent: "primary" },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <ParallaxBackground />

      {/* Nav — fixed, blurs on scroll */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-vela-void/80 backdrop-blur-xl border-b border-vela-border"
      >
        <div className="flex items-center gap-2.5">
          <Image
            src="/logos/vela-mark-bare.svg"
            alt="Vela"
            width={32}
            height={38}
            priority
          />
          <span className="font-display font-extrabold text-2xl text-vela-primary">
            vela
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a
            href="#how-it-works"
            className="text-vela-muted hover:text-vela-primary text-sm font-body transition"
          >
            How it works
          </a>
          <a
            href="#features"
            className="text-vela-muted hover:text-vela-primary text-sm font-body transition"
          >
            Features
          </a>
          <a
            href="#stack"
            className="text-vela-muted hover:text-vela-primary text-sm font-body transition"
          >
            Stack
          </a>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden sm:inline-flex text-vela-muted hover:text-vela-primary text-sm font-body px-4 py-2 rounded-lg transition"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-vela-cyan text-vela-void font-display font-bold px-4 py-2 rounded-lg text-sm hover:brightness-110 transition"
          >
            Get Started
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative z-10 px-6 md:px-10 pt-32 md:pt-40 pb-24">
        <div className="max-w-5xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-extrabold text-4xl sm:text-5xl md:text-7xl leading-[1.05] tracking-tight text-vela-primary mb-6"
          >
            Get paid{" "}
            <span className="inline-block relative">
              <span className="relative z-10 bg-gradient-to-r from-vela-cyan via-vela-mint to-vela-cyan bg-clip-text text-transparent animate-gradient">
                on-chain
              </span>
              <span className="absolute inset-x-0 bottom-2 h-3 bg-vela-cyan/20 blur-xl -z-0" />
            </span>
            .
            <br />
            In under 60 seconds.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="text-vela-muted font-body text-base md:text-xl max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Describe your job in plain English. Vela handles the invoice,
            contract, and on-chain payment.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          >
            <Link
              href="/signup"
              className="relative group bg-vela-cyan text-vela-void font-display font-bold px-8 py-3.5 rounded-xl text-sm hover:brightness-110 transition shadow-lg shadow-vela-cyan/30 animate-pulse-glow"
            >
              <span className="relative z-10">Start Invoicing Free</span>
            </Link>
            <Link
              href="/login"
              className="border border-vela-border text-vela-primary font-display font-bold px-8 py-3.5 rounded-xl text-sm hover:bg-vela-panel hover:border-vela-muted/30 transition backdrop-blur-sm"
            >
              I already have an account
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-vela-muted font-mono uppercase tracking-wider"
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-vela-mint" />
              USDC on Solana
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-vela-gold" />
              Settles to Raenest
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-vela-violet" />
              AI-drafted contracts
            </span>
          </motion.div>
        </div>
      </section>

      {/* Example invoice showcase */}
      <section className="relative z-10 px-6 md:px-10 pb-24">
        <div className="max-w-4xl mx-auto">
          <Reveal direction="up" duration={0.8}>
            <div className="relative animate-float">
              {/* Glow behind */}
              <div className="absolute inset-0 bg-gradient-to-r from-vela-cyan/25 via-vela-violet/25 to-vela-mint/25 blur-3xl opacity-70" />

              {/* Card */}
              <div className="relative bg-vela-surface/80 backdrop-blur-xl border border-vela-border rounded-2xl p-6 md:p-8 shadow-2xl">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Left: typing input */}
                  <div>
                    <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-2">
                      You type
                    </p>
                    <div className="bg-vela-panel border border-vela-border rounded-xl p-4 font-body text-sm text-vela-primary/90 leading-relaxed min-h-[140px]">
                      <Typewriter
                        text="I built a landing page for a UK client, Teslimcodes. $800, due in 14 days."
                        speed={30}
                        delay={400}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-vela-violet animate-pulse" />
                      <p className="text-violet-400 text-xs font-mono">
                        AI is drafting your invoice...
                      </p>
                    </div>
                  </div>

                  {/* Right: output */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, delay: 2.8, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="text-vela-muted text-xs font-mono uppercase tracking-wider mb-2">
                      Vela generates
                    </p>
                    <div className="bg-vela-panel border border-vela-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3 pb-3 border-b border-vela-border">
                        <span className="text-vela-primary font-mono text-xs">
                          VLA-0042
                        </span>
                        <span className="bg-vela-violet/15 text-violet-400 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                          AI Draft
                        </span>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-vela-primary">Landing page</span>
                          <span className="text-vela-muted font-mono">$800</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-vela-muted">Due date</span>
                          <span className="text-vela-muted font-mono">01/05/26</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-vela-border">
                        <span className="text-vela-muted text-xs font-display font-bold">
                          Total
                        </span>
                        <span className="text-vela-cyan font-mono text-lg font-medium">
                          $800 USDC
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <span className="bg-vela-mint/10 text-vela-mint font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                        ✓ Contract bundled
                      </span>
                      <span className="bg-vela-cyan/10 text-vela-cyan font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Payment link ready
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 px-6 md:px-10 pb-24 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="text-vela-cyan text-xs font-mono uppercase tracking-widest mb-3">
              How it works
            </p>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-vela-primary">
              Four steps from idea to paid.
            </h2>
          </Reveal>

          <Stagger stagger={0.12} className="grid md:grid-cols-4 gap-4">
            {STEPS.map((step) => (
              <StaggerItem key={step.num}>
                <motion.div
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="relative group bg-vela-surface/60 backdrop-blur-sm border border-vela-border rounded-2xl p-6 hover:border-vela-muted/30 transition h-full cursor-default"
                >
                  <div
                    className={`text-[11px] font-mono mb-4 tracking-wider ${ACCENT_TEXT[step.color]}`}
                  >
                    / {step.num}
                  </div>
                  <h3 className="font-display font-bold text-lg text-vela-primary mb-2">
                    {step.title}
                  </h3>
                  <p className="text-vela-muted text-sm font-body leading-relaxed">
                    {step.body}
                  </p>
                  {/* Hover glow */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition pointer-events-none bg-gradient-to-br from-white/5 to-transparent" />
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 md:px-10 pb-24 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-14">
            <p className="text-vela-mint text-xs font-mono uppercase tracking-widest mb-3">
              Features
            </p>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-vela-primary">
              Everything a freelancer
              <br className="hidden md:block" />
              actually needs.
            </h2>
          </Reveal>

          <Stagger stagger={0.08} className="grid md:grid-cols-3 gap-4">
            {FEATURES.map((feat) => (
              <StaggerItem key={feat.title}>
                <motion.div
                  whileHover={{ y: -6, transition: { duration: 0.25 } }}
                  className="bg-vela-surface/60 backdrop-blur-sm border border-vela-border rounded-2xl p-6 hover:border-vela-muted/30 transition h-full cursor-default"
                >
                  <motion.div
                    whileHover={{ rotate: 6, scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`w-10 h-10 rounded-lg border flex items-center justify-center text-xl font-bold mb-4 ${ACCENT_BOX[feat.color]}`}
                  >
                    {feat.icon}
                  </motion.div>
                  <h3 className="font-display font-bold text-lg text-vela-primary mb-2">
                    {feat.title}
                  </h3>
                  <p className="text-vela-muted text-sm font-body leading-relaxed">
                    {feat.body}
                  </p>
                </motion.div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Stack section */}
      <section id="stack" className="relative z-10 px-6 md:px-10 pb-24 scroll-mt-20">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="bg-gradient-to-br from-vela-cyan/10 via-vela-violet/5 to-vela-mint/10 border border-vela-border rounded-3xl p-10 md:p-14 backdrop-blur-sm">
              <div className="grid md:grid-cols-2 gap-10 items-center">
                <div>
                  <p className="text-vela-cyan text-xs font-mono uppercase tracking-widest mb-3">
                    Built on
                  </p>
                  <h2 className="font-display font-bold text-3xl md:text-4xl text-vela-primary mb-4">
                    Infrastructure you can verify.
                  </h2>
                  <p className="text-vela-muted font-body leading-relaxed">
                    Every payment is an on-chain Solana transaction. Every
                    invoice is stored in Postgres with row-level security.
                    Every AI call is auditable. No black boxes, no custody
                    risk.
                  </p>
                </div>
                <Stagger stagger={0.06} className="grid grid-cols-3 gap-3">
                  {STACK.map((t) => (
                    <StaggerItem key={t.name}>
                      <motion.div
                        whileHover={{ scale: 1.06, y: -2 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="bg-vela-panel/60 backdrop-blur border border-vela-border rounded-xl py-4 px-3 text-center"
                      >
                        <p
                          className={`font-display font-bold text-sm ${ACCENT_TEXT[t.accent]}`}
                        >
                          {t.name}
                        </p>
                      </motion.div>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 px-6 md:px-10 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <Reveal>
            <h2 className="font-display font-extrabold text-3xl md:text-5xl text-vela-primary mb-4">
              Stop chasing invoices.
              <br />
              <span className="bg-gradient-to-r from-vela-cyan via-vela-mint to-vela-cyan bg-clip-text text-transparent animate-gradient">
                Start getting paid.
              </span>
            </h2>
            <p className="text-vela-muted font-body text-base md:text-lg mb-8 max-w-xl mx-auto">
              Join the freelancers ditching Google Docs for on-chain
              invoicing. No subscription. No setup fee. Pay only when you get
              paid.
            </p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} className="inline-block">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-vela-cyan text-vela-void font-display font-bold px-8 py-3.5 rounded-xl text-sm hover:brightness-110 transition shadow-xl shadow-vela-cyan/30"
              >
                Create your first invoice
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  →
                </motion.span>
              </Link>
            </motion.div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-vela-border px-6 md:px-10 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logos/vela-mark-bare.svg"
              alt="Vela"
              width={24}
              height={28}
            />
            <span className="font-display font-bold text-vela-primary">
              vela
            </span>
            <span className="text-vela-muted text-xs font-mono">
              — get paid. on-chain.
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs text-vela-muted font-mono">
            <a href="#how-it-works" className="hover:text-vela-primary transition">
              How it works
            </a>
            <a href="#features" className="hover:text-vela-primary transition">
              Features
            </a>
            <Link href="/login" className="hover:text-vela-primary transition">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
