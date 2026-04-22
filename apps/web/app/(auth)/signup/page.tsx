"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, PasswordInput } from "@/components/ui";
import { ParallaxBackground } from "@/components/motion";
import {
  checkPassword,
  validateEmail,
  validateName,
  validateSignupPassword,
} from "@/lib/validation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const passwordState = useMemo(() => checkPassword(password), [password]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const pwErr = validateSignupPassword(password);
    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(pwErr);
    if (nameErr || emailErr || pwErr) return;

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("user already")) {
        setFormError(
          "An account with this email already exists. Sign in instead.",
        );
      } else if (msg.includes("rate limit")) {
        setFormError("Too many attempts. Please try again in a minute.");
      } else {
        setFormError(error.message);
      }
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  const showChecklist = passwordFocused || password.length > 0;

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      <ParallaxBackground />

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

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-sm">
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

          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.7,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-vela-mint/15 via-transparent to-vela-cyan/10 blur-2xl opacity-60 pointer-events-none" />

            <div className="relative bg-vela-surface/80 backdrop-blur-xl border border-vela-border rounded-2xl p-5 sm:p-7 shadow-2xl">
              <h2 className="font-display font-bold text-2xl text-vela-primary mb-1">
                Create your account
              </h2>
              <p className="text-vela-muted text-sm mb-6">
                Start getting paid on-chain
              </p>

              <form
                onSubmit={handleSignup}
                noValidate
                className="flex flex-col gap-4"
              >
                <Input
                  label="Full Name"
                  type="text"
                  placeholder="Teslim Codes"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  onBlur={() => setNameError(validateName(name))}
                  error={nameError || undefined}
                  autoComplete="name"
                  required
                />

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

                <div>
                  <PasswordInput
                    label="Password"
                    placeholder="Min 8 characters, 1 uppercase, 1 number"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => {
                      setPasswordFocused(false);
                      setPasswordError(validateSignupPassword(password));
                    }}
                    error={passwordError || undefined}
                    autoComplete="new-password"
                    required
                  />

                  <AnimatePresence>
                    {showChecklist && !passwordError && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col gap-1 mt-2 overflow-hidden"
                      >
                        {passwordState.rules.map((rule) => (
                          <li
                            key={rule.label}
                            className="flex items-center gap-2 text-[11px] font-mono"
                          >
                            <span
                              className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full transition-colors ${
                                rule.ok
                                  ? "bg-vela-mint/20 text-vela-mint"
                                  : "bg-vela-border text-vela-muted"
                              }`}
                            >
                              {rule.ok ? (
                                <svg
                                  width="9"
                                  height="9"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="2.5 6 5 8.5 9.5 3.5" />
                                </svg>
                              ) : (
                                <span className="w-1 h-1 rounded-full bg-current" />
                              )}
                            </span>
                            <span
                              className={
                                rule.ok ? "text-vela-mint" : "text-vela-muted"
                              }
                            >
                              {rule.label}
                            </span>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

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
                  Create Account
                </Button>
              </form>

              <p className="text-vela-muted text-[11px] text-center mt-4 leading-relaxed">
                By signing up you agree to receive transactional emails related
                to your account.
              </p>

              <div className="flex items-center gap-3 my-5">
                <span className="flex-1 h-px bg-vela-border" />
                <span className="text-vela-muted text-[10px] font-mono uppercase tracking-wider">
                  Already on Vela?
                </span>
                <span className="flex-1 h-px bg-vela-border" />
              </div>

              <Link
                href="/login"
                className="block text-center w-full border border-vela-border text-vela-primary font-display font-bold px-6 py-3 rounded-[10px] text-sm hover:bg-vela-panel hover:border-vela-muted/30 transition"
              >
                Sign in instead
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
