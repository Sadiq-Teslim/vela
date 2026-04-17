"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input, Card } from "@/components/ui";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [raenestWallet, setRaenestWallet] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [followUpEnabled, setFollowUpEnabled] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3);
  const [overdueAfterDays, setOverdueAfterDays] = useState(3);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        setName(profile.name || "");
        setBusinessName(profile.business_name || "");
        setRaenestWallet(profile.raenest_wallet || "");
        setEmail(profile.email);
      }
      setLoading(false);
    }
    fetchProfile();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast("Not signed in", "error");
      setSaving(false);
      return;
    }

    // Use upsert so this works even if the profile row doesn't exist
    // (in case the auth trigger didn't fire)
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email || "",
          name,
          business_name: businessName || null,
          raenest_wallet: raenestWallet || null,
        },
        { onConflict: "id" }
      );

    if (!error) {
      toast("Settings saved", "success");
    } else {
      console.error("Save error:", error);
      toast(`Failed to save: ${error.message}`, "error");
    }
    setSaving(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-vela-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8 px-4 md:px-8">
      <div className="max-w-lg mx-auto">
        <h1 className="font-display font-bold text-2xl text-vela-primary mb-8">
          Settings
        </h1>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile */}
          <Card>
            <h2 className="font-display font-bold text-lg text-vela-primary mb-4">
              Profile
            </h2>
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Optional — shown on invoices"
              />
              <Input label="Email" value={email} disabled />
            </div>
          </Card>

          {/* Raenest Wallet */}
          <Card>
            <h2 className="font-display font-bold text-lg text-vela-primary mb-2">
              Raenest Wallet
            </h2>
            <p className="text-vela-muted text-xs mb-4">
              Your Solana USDC wallet address from Raenest. Client payments land here.
            </p>
            <Input
              label="Solana Wallet Address"
              value={raenestWallet}
              onChange={(e) => setRaenestWallet(e.target.value)}
              placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
              className="font-mono text-xs"
            />
            {raenestWallet && (
              <div className="mt-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-vela-mint" />
                <span className="text-vela-mint text-xs font-mono">Wallet configured</span>
              </div>
            )}
          </Card>

          {/* Follow-up Preferences */}
          <Card>
            <h2 className="font-display font-bold text-lg text-vela-primary mb-2">
              Follow-up Preferences
            </h2>
            <p className="text-vela-muted text-xs mb-4">
              Configure how Vela&apos;s AI agent follows up on unpaid invoices.
            </p>

            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-vela-primary text-sm font-body">
                    Automatic follow-ups
                  </p>
                  <p className="text-vela-muted text-xs">
                    AI drafts and sends payment reminders
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFollowUpEnabled(!followUpEnabled)}
                  className={`w-11 h-6 rounded-full transition relative ${
                    followUpEnabled ? "bg-vela-cyan" : "bg-vela-panel"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      followUpEnabled ? "translate-x-[22px]" : "translate-x-[2px]"
                    }`}
                  />
                </button>
              </div>

              {followUpEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-vela-muted text-xs font-mono uppercase tracking-wider block mb-1.5">
                        Remind before due
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={14}
                          value={reminderDaysBefore}
                          onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
                          className="w-16 bg-vela-panel border border-white/10 rounded-lg px-3 py-2 text-vela-primary font-mono text-sm text-center focus:outline-none focus:border-vela-cyan/50"
                        />
                        <span className="text-vela-muted text-xs">days</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-vela-muted text-xs font-mono uppercase tracking-wider block mb-1.5">
                        Overdue escalation
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={14}
                          value={overdueAfterDays}
                          onChange={(e) => setOverdueAfterDays(Number(e.target.value))}
                          className="w-16 bg-vela-panel border border-white/10 rounded-lg px-3 py-2 text-vela-primary font-mono text-sm text-center focus:outline-none focus:border-vela-cyan/50"
                        />
                        <span className="text-vela-muted text-xs">days after</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-vela-panel rounded-lg p-3">
                    <p className="text-vela-muted text-xs font-mono leading-relaxed">
                      Schedule: Reminder at T-{reminderDaysBefore}d → Due date → Overdue at T+{overdueAfterDays}d
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3">
            <Button variant="danger" type="button" onClick={handleSignOut}>
              Sign Out
            </Button>
            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
