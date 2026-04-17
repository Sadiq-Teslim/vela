"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
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
            Welcome back
          </h2>
          <p className="text-vela-muted text-sm mb-6">
            Sign in to manage your invoices
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <p className="text-vela-red text-xs font-mono">{error}</p>
            )}

            <Button type="submit" loading={loading} className="w-full mt-2">
              Sign In
            </Button>
          </form>

          <p className="text-vela-muted text-sm text-center mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-vela-cyan hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
