import React from "react";
import { cn } from "../../lib/utils.js";
import { VERIFICATION_DECISION, VerificationDecisionType } from "@keytrace/shared";

export type BadgeVariant =
  | "default"
  | "match"
  | "review"
  | "alert"
  | "neutral"
  | "accent"
  | "cyan"
  | "blue"
  | "orange"
  | "violet"
  | "warning"
  | "danger";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  glow?: boolean;
}

export function Badge({
  className,
  variant = "default",
  glow = false,
  children,
  ...props
}: BadgeProps) {
  const styles: Record<BadgeVariant, string> = {
    default: "bg-[#1A2A44] text-[#F8FAFC] border-[#263B5E]",
    match: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/25",
    review: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/25",
    warning: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/25",
    alert: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/25",
    danger: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/25",
    neutral: "bg-[#111B2E] text-[#94A3B8] border-[#263B5E]",
    accent: "bg-[#FF6A00]/10 text-[#FF6A00] border-[#FF6A00]/25",
    orange: "bg-[#FF6A00]/10 text-[#FF6A00] border-[#FF6A00]/25",
    blue: "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/25",
    cyan: "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/25",
    violet: "bg-[#38BDF8]/10 text-[#38BDF8] border-[#38BDF8]/25",
  };

  const glowStyles: Record<BadgeVariant, string> = {
    default: "shadow-[0_0_10px_rgba(255,255,255,0.04)]",
    match: "shadow-[0_0_10px_rgba(34,197,94,0.2)] border-[#22C55E]/40",
    review: "shadow-[0_0_10px_rgba(245,158,11,0.2)] border-[#F59E0B]/40",
    warning: "shadow-[0_0_10px_rgba(245,158,11,0.2)] border-[#F59E0B]/40",
    alert: "shadow-[0_0_10px_rgba(239,68,68,0.2)] border-[#EF4444]/40",
    danger: "shadow-[0_0_10px_rgba(239,68,68,0.2)] border-[#EF4444]/40",
    neutral: "",
    accent: "shadow-[0_0_10px_rgba(255,106,0,0.25)] border-[#FF6A00]/40",
    orange: "shadow-[0_0_10px_rgba(255,106,0,0.25)] border-[#FF6A00]/40",
    blue: "shadow-[0_0_10px_rgba(56,189,248,0.25)] border-[#38BDF8]/40",
    cyan: "shadow-[0_0_10px_rgba(56,189,248,0.25)] border-[#38BDF8]/40",
    violet: "shadow-[0_0_10px_rgba(56,189,248,0.25)] border-[#38BDF8]/40",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border backdrop-blur-sm transition-all duration-150 motion-reduce:transition-none font-mono",
        styles[variant],
        glow && glowStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: VerificationDecisionType | string }) {
  if (decision === VERIFICATION_DECISION.MATCH) {
    return (
      <Badge variant="match" className="glow-match font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
        PATTERN MATCH
      </Badge>
    );
  }
  if (decision === VERIFICATION_DECISION.REVIEW) {
    return (
      <Badge variant="review" className="glow-review font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
        NEEDS REVIEW
      </Badge>
    );
  }
  if (decision === "ALERT" || decision === "IMPOSTOR") {
    return (
      <Badge variant="alert" className="glow-alert font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping" />
        RISK ALERT
      </Badge>
    );
  }
  if (decision === VERIFICATION_DECISION.PROFILE_NOT_READY) {
    return (
      <Badge variant="review">
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
        PROFILE NOT READY
      </Badge>
    );
  }
  if (decision === VERIFICATION_DECISION.INSUFFICIENT_DATA) {
    return (
      <Badge variant="neutral">
        <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
        INSUFFICIENT DATA
      </Badge>
    );
  }
  if (decision === VERIFICATION_DECISION.SERVICE_UNAVAILABLE) {
    return (
      <Badge variant="alert" className="glow-alert font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
        SERVICE DEGRADED
      </Badge>
    );
  }
  return <Badge variant="default">{decision}</Badge>;
}
