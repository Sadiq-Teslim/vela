import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-vela-cyan text-vela-void font-display font-bold px-6 py-3 rounded-[10px] text-sm hover:brightness-110",
  secondary:
    "border border-vela-cyan/30 text-vela-cyan font-display font-bold px-6 py-3 rounded-[10px] text-sm hover:bg-vela-cyan/10",
  ghost:
    "text-vela-muted font-display font-bold px-6 py-3 rounded-[10px] text-sm hover:bg-vela-panel",
  danger:
    "bg-vela-red/10 text-vela-red font-display font-bold px-6 py-3 rounded-[10px] text-sm hover:bg-vela-red/20",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading, className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`${variantStyles[variant]} transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
