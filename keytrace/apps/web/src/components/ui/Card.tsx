import React from "react";
import { cn } from "../../lib/utils.js";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  cornerTicks?: boolean;
  accentBar?: boolean;
}

export function Card({
  className,
  children,
  elevated = false,
  cornerTicks = false,
  accentBar = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5.5 transition-all duration-300 relative backdrop-blur-xl overflow-hidden",
        elevated
          ? "bg-gradient-to-b from-[#111827]/90 to-[#0a0f1d]/90 border-[#2d3f66]/70 shadow-[0_16px_40px_rgba(0,0,0,0.55)] hover:border-cyan-500/50 hover:shadow-[0_16px_40px_rgba(6,182,212,0.18)]"
          : "bg-gradient-to-b from-[#0d1322]/80 to-[#070b14]/85 border-[#1e2a40]/90 shadow-[0_10px_28px_rgba(0,0,0,0.4)] hover:border-slate-500/80 hover:shadow-[0_10px_35px_rgba(0,0,0,0.5)]",
        cornerTicks && "corner-ticks",
        accentBar && "before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-amber-400 before:via-orange-500 before:to-cyan-400 before:shadow-[0_0_15px_rgba(245,158,11,0.6)]",
        className
      )}
      {...props}
    >
      {/* Specular Top Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4 flex flex-col gap-1.5 border-b border-border-subtle pb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-foreground tracking-tight flex items-center justify-between", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-foreground-muted font-mono tracking-normal leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}
