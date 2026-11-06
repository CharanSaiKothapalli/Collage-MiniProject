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
      "inline-flex items-center justify-center font-medium rounded-xl tracking-tight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer";

    const sizeStyles = {
      xs: "px-2.5 py-1 text-xs gap-1 font-medium",
      sm: "px-3.5 py-1.5 text-xs gap-1.5 font-medium",
      md: "px-4.5 py-2 text-sm gap-2 font-medium",
      lg: "px-5.5 py-2.5 text-sm gap-2.5 font-semibold",
    };

    const variantStyles = {
      primary:
        "bg-white text-zinc-950 font-semibold hover:bg-zinc-200 border border-white/80 shadow-[0_1px_3px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,1)]",
      secondary:
        "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 border border-white/10 hover:border-white/20 shadow-sm backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
      outline:
        "bg-transparent hover:bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 shadow-sm transition-all",
      danger:
        "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:border-rose-500/40 shadow-sm",
      ghost:
        "bg-transparent hover:bg-zinc-800/60 text-zinc-400 hover:text-white border border-transparent",
      terminal:
        "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 font-mono text-xs border border-zinc-800 hover:border-zinc-700 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
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
