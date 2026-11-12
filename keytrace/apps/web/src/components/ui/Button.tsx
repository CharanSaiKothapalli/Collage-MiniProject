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
      "inline-flex items-center justify-center font-medium rounded-[10px] tracking-tight transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220] disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] motion-reduce:transform-none select-none cursor-pointer";

    const sizeStyles = {
      xs: "h-7 px-2.5 text-xs gap-1 font-medium",
      sm: "h-8 px-3 text-xs gap-1.5 font-medium",
      md: "h-10 px-4 text-sm gap-2 font-medium",
      lg: "h-11 px-5 text-sm gap-2.5 font-semibold",
    };

    const variantStyles = {
      primary:
        "bg-[#FF6A00] hover:bg-[#E55F00] text-white font-semibold border border-[#FF6A00]/80 shadow-[0_1px_3px_rgba(255,106,0,0.35)] focus-visible:ring-[#FF6A00]",
      secondary:
        "bg-[#1A2A44] hover:bg-[#223656] text-[#F8FAFC] border border-[#263B5E] hover:border-[#38BDF8]/40 shadow-sm backdrop-blur-md focus-visible:ring-[#38BDF8]",
      outline:
        "bg-transparent hover:bg-[#111B2E] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#263B5E] hover:border-[#38BDF8]/40 shadow-sm",
      danger:
        "bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/30 hover:border-[#EF4444]/50 shadow-sm focus-visible:ring-[#EF4444]",
      ghost:
        "bg-transparent hover:bg-[#111B2E] text-[#94A3B8] hover:text-[#F8FAFC] border border-transparent",
      terminal:
        "bg-[#111B2E] hover:bg-[#1A2A44] text-[#94A3B8] hover:text-[#F8FAFC] font-mono text-xs border border-[#263B5E] hover:border-[#38BDF8]/30",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
