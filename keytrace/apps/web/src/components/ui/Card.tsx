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
        "rounded-[14px] border p-6 transition-colors duration-150 relative overflow-hidden",
        elevated
          ? "bg-[#1A2A44] border-[#263B5E] shadow-[0_12px_36px_-6px_rgba(0,0,0,0.6)] hover:border-[#38BDF8]/40"
          : "bg-[#111B2E] border-[#263B5E] shadow-[0_4px_20px_-2px_rgba(0,0,0,0.45)] hover:border-[#38BDF8]/30",
        accentBar && "before:absolute before:top-0 before:left-0 before:right-0 before:h-[2px] before:bg-gradient-to-r before:from-[#FF6A00] before:via-[#38BDF8] before:to-[#FF6A00]",
        className
      )}
      {...props}
    >
      {/* Specular Top Subtle Light Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-4 flex flex-col gap-1 border-b border-[#263B5E] pb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-base font-semibold text-[#F8FAFC] tracking-tight flex items-center justify-between", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-[#94A3B8] font-normal leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-4 pt-3 border-t border-[#263B5E] flex items-center justify-between", className)} {...props}>
      {children}
    </div>
  );
}
