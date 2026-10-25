import React from "react";
import { cn } from "../../lib/utils.js";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "terminal";
  size?: "xs" | "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-md tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-40 disabled:pointer-events-none hover:-translate-y-0.5 active:translate-y-0 select-none cursor-pointer";

    const sizeStyles = {
      xs: "px-2.5 py-1 text-[11px] gap-1 font-mono uppercase",
      sm: "px-3.5 py-1.5 text-xs gap-1.5 font-mono uppercase tracking-wider",
      md: "px-5 py-2.5 text-sm gap-2 font-medium",
      lg: "px-6 py-3 text-base gap-2.5 font-semibold",
    };

    const variantStyles = {
      primary:
        "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 text-slate-950 font-bold border border-amber-300/50 shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:shadow-[0_0_28px_rgba(245,158,11,0.55)]",
      secondary:
        "bg-slate-900/90 hover:bg-slate-800/90 text-slate-100 border border-slate-700/80 hover:border-slate-500 shadow-sm backdrop-blur-md",
      outline:
        "bg-transparent hover:bg-cyan-950/30 text-slate-200 border border-slate-700/80 hover:border-cyan-500/70 hover:text-cyan-300 transition-colors",
      danger:
        "bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/50 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)]",
      ghost:
        "bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-100 border border-transparent",
      terminal:
        "bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 font-mono text-xs border border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
