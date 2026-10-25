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
        "rounded-lg border p-5.5 transition-all duration-300 relative backdrop-blur-md overflow-hidden",
        elevated
          ? "bg-[#111827]/80 border-[#283958]/80 shadow-[0_12px_36px_rgba(0,0,0,0.45)] hover:border-cyan-500/40 hover:shadow-[0_12px_36px_rgba(6,182,212,0.12)]"
          : "bg-[#0c1220]/75 border-[#1e2a40]/80 shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:border-slate-600 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
        cornerTicks && "corner-ticks",
        accentBar && "before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-amber-400 before:via-orange-500 before:to-cyan-400 before:shadow-[0_0_12px_rgba(245,158,11,0.5)]",
        className
      )}
      {...props}
    >
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
