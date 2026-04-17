"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-vela-cyan/20 flex items-center justify-center">
            <span className="text-vela-cyan font-display font-bold text-xl">V</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl text-vela-primary">
            vela
          </h1>
        </div>

        <div className="bg-vela-surface border border-white/10 rounded-2xl p-6">
          <h2 className="font-display font-bold text-xl text-vela-primary mb-1">
            Create your account
          </h2>
          <p className="text-vela-muted text-sm mb-6">
            Start getting paid on-chain
          </p>

          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Teslim Codes"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />

            {error && (
              <p className="text-vela-red text-xs font-mono">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2">
              Create Account
            </Button>
          </form>

          <p className="text-vela-muted text-sm text-center mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-vela-cyan hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
