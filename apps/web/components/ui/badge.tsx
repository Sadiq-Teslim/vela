type BadgeVariant = "paid" | "pending" | "overdue" | "on-chain" | "ai-draft" | "draft";

const variantStyles: Record<BadgeVariant, string> = {
  paid: "bg-vela-mint/10 text-vela-mint",
  pending: "bg-vela-gold/10 text-vela-gold",
  overdue: "bg-vela-red/10 text-vela-red",
  "on-chain": "bg-vela-cyan/10 text-vela-cyan",
  "ai-draft": "bg-vela-violet/15 text-violet-400",
  draft: "bg-vela-panel text-vela-muted",
};

const variantLabels: Record<BadgeVariant, string> = {
  paid: "Paid",
  pending: "Pending",
  overdue: "Overdue",
  "on-chain": "On-chain",
  "ai-draft": "AI Draft",
  draft: "Draft",
};

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

export function Badge({ variant, label, className = "" }: BadgeProps) {
  return (
    <span
      className={`${variantStyles[variant]} font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full inline-flex items-center ${className}`}
    >
      {label || variantLabels[variant]}
    </span>
  );
}
