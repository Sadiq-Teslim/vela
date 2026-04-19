import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-vela-muted text-xs font-mono uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`bg-vela-panel border border-vela-border rounded-[10px] px-4 py-3 text-vela-primary font-body text-sm placeholder:text-vela-muted/50 focus:outline-none focus:border-vela-cyan/50 focus:ring-1 focus:ring-vela-cyan/20 transition ${error ? "border-vela-red/50" : ""} ${className}`}
          {...props}
        />
        {error ? (
          <p className="text-vela-red text-xs font-mono">{error}</p>
        ) : hint ? (
          <p className="text-vela-muted text-xs font-body">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
