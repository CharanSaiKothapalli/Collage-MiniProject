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
    default: "bg-[#172235] text-[#F4F7FC] border-[#243247]",
    match: "bg-[#32D6A0]/10 text-[#32D6A0] border-[#32D6A0]/25",
    review: "bg-[#FFBF55]/10 text-[#FFBF55] border-[#FFBF55]/25",
    warning: "bg-[#FFBF55]/10 text-[#FFBF55] border-[#FFBF55]/25",
    alert: "bg-[#FF647C]/10 text-[#FF647C] border-[#FF647C]/25",
    danger: "bg-[#FF647C]/10 text-[#FF647C] border-[#FF647C]/25",
    neutral: "bg-[#0D1320] text-[#94A3B8] border-[#243247]",
    accent: "bg-[#35D6E8]/10 text-[#35D6E8] border-[#35D6E8]/25",
    cyan: "bg-[#35D6E8]/10 text-[#35D6E8] border-[#35D6E8]/25",
  };

  const glowStyles: Record<BadgeVariant, string> = {
    default: "shadow-[0_0_10px_rgba(255,255,255,0.06)]",
    match: "shadow-[0_0_12px_rgba(50,214,160,0.25)] border-[#32D6A0]/35",
    review: "shadow-[0_0_12px_rgba(255,191,85,0.25)] border-[#FFBF55]/35",
    warning: "shadow-[0_0_12px_rgba(255,191,85,0.25)] border-[#FFBF55]/35",
    alert: "shadow-[0_0_12px_rgba(255,100,124,0.25)] border-[#FF647C]/35",
    danger: "shadow-[0_0_12px_rgba(255,100,124,0.25)] border-[#FF647C]/35",
    neutral: "",
    accent: "shadow-[0_0_12px_rgba(53,214,232,0.25)] border-[#35D6E8]/35",
    cyan: "shadow-[0_0_12px_rgba(53,214,232,0.25)] border-[#35D6E8]/35",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border backdrop-blur-sm transition-all duration-150 font-mono",
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
        <span className="w-1.5 h-1.5 rounded-full bg-[#32D6A0] animate-pulse" />
        PATTERN MATCH
      </Badge>
    );
  }
  if (decision === VERIFICATION_DECISION.REVIEW) {
    return (
      <Badge variant="review" className="glow-review font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FFBF55] animate-pulse" />
        NEEDS REVIEW
      </Badge>
    );
  }
  if (decision === "ALERT" || decision === "IMPOSTOR") {
    return (
      <Badge variant="alert" className="glow-alert font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF647C] animate-ping" />
        RISK ALERT
      </Badge>
    );
  }
  if (decision === VERIFICATION_DECISION.PROFILE_NOT_READY) {
    return (
      <Badge variant="review">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FFBF55]" />
        PROFILE NOT READY
      </Badge>
    );
  }
  if (decision === VERIFICATION_DECISION.INSUFFICIENT_DATA) {
    return (
      <Badge variant="neutral">
        <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
        INSUFFICIENT DATA
      </Badge>
    );
  }
  if (decision === VERIFICATION_DECISION.SERVICE_UNAVAILABLE) {
    return (
      <Badge variant="alert" className="glow-alert font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF647C] animate-pulse" />
        SERVICE DEGRADED
      </Badge>
    );
  }
  return <Badge variant="default">{decision}</Badge>;
}
