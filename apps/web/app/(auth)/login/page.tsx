"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, PasswordInput } from "@/components/ui";
import { ParallaxBackground } from "@/components/motion";
import { validateEmail, validateLoginPassword } from "@/lib/validation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    // Client-side validation
    const emailErr = validateEmail(email);
    const pwErr = validateLoginPassword(password);
    setEmailError(emailErr);
    setPasswordError(pwErr);
    if (emailErr || pwErr) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // Map supabase messages to something friendlier
      const msg = error.message.toLowerCase();
      if (msg.includes("invalid login") || msg.includes("credentials")) {
        setFormError("Email or password is incorrect.");
      } else if (msg.includes("email not confirmed")) {
        setFormError(
          "Please confirm your email first — check your inbox for the verification link."
        );
      } else {
        setFormError(error.message);
      }
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      <ParallaxBackground />

      {/* Back to home */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 px-4 sm:px-8 py-5"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-vela-muted hover:text-vela-primary text-sm font-body transition"
        >
          <span className="text-lg leading-none">&larr;</span> Back to home
        </Link>
      </motion.div>

      {/* Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2.5 mb-8 justify-center"
          >
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
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-vela-cyan/15 via-transparent to-vela-violet/10 blur-2xl opacity-60 pointer-events-none" />

            <div className="relative bg-vela-surface/80 backdrop-blur-xl border border-vela-border rounded-2xl p-5 sm:p-7 shadow-2xl">
              <h2 className="font-display font-bold text-2xl text-vela-primary mb-1">
                Welcome back
              </h2>
              <p className="text-vela-muted text-sm mb-6">
                Sign in to manage your invoices
              </p>

              <form onSubmit={handleLogin} noValidate className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  onBlur={() => setEmailError(validateEmail(email))}
                  error={emailError || undefined}
                  autoComplete="email"
                  inputMode="email"
                  required
                />
                <PasswordInput
                  label="Password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  onBlur={() => setPasswordError(validateLoginPassword(password))}
                  error={passwordError || undefined}
                  autoComplete="current-password"
                  required
                />

                {formError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-vela-red text-xs font-mono bg-vela-red/10 border border-vela-red/20 rounded-lg px-3 py-2"
                  >
                    {formError}
                  </motion.p>
                )}

                <Button type="submit" loading={loading} className="w-full mt-2">
                  Sign In
                </Button>
              </form>

              <div className="flex items-center gap-3 my-5">
                <span className="flex-1 h-px bg-vela-border" />
                <span className="text-vela-muted text-[10px] font-mono uppercase tracking-wider">
                  New to Vela?
                </span>
                <span className="flex-1 h-px bg-vela-border" />
              </div>

              <Link
                href="/signup"
                className="block text-center w-full border border-vela-border text-vela-primary font-display font-bold px-6 py-3 rounded-[10px] text-sm hover:bg-vela-panel hover:border-vela-muted/30 transition"
              >
                Create an account
              </Link>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-vela-muted text-xs font-mono text-center mt-6"
          >
            get paid. on-chain.
          </motion.p>
        </div>
      </main>
    </div>
  );
}
