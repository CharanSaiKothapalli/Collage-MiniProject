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
        "rounded-2xl border p-6 transition-all duration-300 relative backdrop-blur-xl overflow-hidden",
        elevated
          ? "bg-zinc-900/50 border-white/[0.12] shadow-[0_16px_40px_-12px_rgba(0,0,0,0.6)] hover:border-white/[0.2]"
          : "bg-zinc-900/30 border-white/[0.08] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] hover:border-white/[0.16]",
        accentBar && "before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-indigo-500 before:via-sky-500 before:to-indigo-500",
        className
      )}
      {...props}
    >
      {/* Specular Top Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4 flex flex-col gap-1.5 border-b border-white/[0.06] pb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-zinc-100 tracking-tight flex items-center justify-between", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-zinc-400 tracking-normal leading-relaxed font-sans", className)} {...props}>
      {children}
    </p>
  );
}
