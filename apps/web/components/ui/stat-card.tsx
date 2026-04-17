type AccentColor = "cyan" | "gold" | "mint" | "violet";

const accentBorder: Record<AccentColor, string> = {
  cyan: "border-t-vela-cyan",
  gold: "border-t-vela-gold",
  mint: "border-t-vela-mint",
  violet: "border-t-vela-violet",
};

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: AccentColor;
  className?: string;
}

export function StatCard({ label, value, sub, accent, className = "" }: StatCardProps) {
  return (
    <div
      className={`bg-vela-panel border-t-2 ${accentBorder[accent]} rounded-xl p-4 ${className}`}
    >
      <p className="text-vela-muted text-xs font-body uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-vela-primary font-mono text-2xl font-medium">{value}</p>
      {sub && (
        <p className="text-vela-muted text-xs font-mono mt-1">{sub}</p>
      )}
    </div>
  );
}
