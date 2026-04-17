import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`bg-vela-surface border border-white/10 rounded-2xl p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
