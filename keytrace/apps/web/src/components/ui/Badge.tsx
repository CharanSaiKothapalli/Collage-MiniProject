import React from "react";
import { cn } from "../../lib/utils.js";
import { VERIFICATION_DECISION, VerificationDecisionType } from "@keytrace/shared";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "match" | "review" | "alert" | "neutral" | "accent" | "cyan";
  glow?: boolean;
}

export function Badge({ className, variant = "default", glow = false, children, ...props }: BadgeProps) {
  const styles = {
    default: "bg-slate-900/80 text-slate-200 border-slate-700/80",
    match: "bg-emerald-950/60 text-emerald-300 border-emerald-500/50 shadow-[0_0_14px_rgba(16,185,129,0.25)]",
    review: "bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-[0_0_14px_rgba(245,158,11,0.25)]",
    alert: "bg-rose-950/60 text-rose-300 border-rose-500/50 shadow-[0_0_14px_rgba(244,63,94,0.25)]",
    neutral: "bg-slate-900/80 text-slate-400 border-slate-800",
    accent: "bg-amber-950/60 text-amber-300 border-amber-500/50 shadow-[0_0_14px_rgba(245,158,11,0.25)]",
    cyan: "bg-cyan-950/60 text-cyan-300 border-cyan-500/50 shadow-[0_0_14px_rgba(6,182,212,0.25)]",
  };

  const glowStyles = {
    default: "shadow-[0_0_12px_rgba(148,163,184,0.3)]",
    match: "shadow-[0_0_16px_rgba(16,185,129,0.5)] border-emerald-400/80",
    review: "shadow-[0_0_16px_rgba(245,158,11,0.5)] border-amber-400/80",
    alert: "shadow-[0_0_16px_rgba(244,63,94,0.5)] border-rose-400/80",
    neutral: "",
    accent: "shadow-[0_0_16px_rgba(245,158,11,0.5)] border-amber-400/80",
    cyan: "shadow-[0_0_16px_rgba(6,182,212,0.5)] border-cyan-400/80",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-mono uppercase tracking-wider border backdrop-blur-sm transition-all duration-150",
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
      <Badge variant="match" className="glow-match font-bold">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
        PATTERN MATCH
      </Badge>
    );
  }
  if (decision === VERIFICATION_DECISION.REVIEW) {
    return (
      <Badge variant="review" className="glow-review font-bold">
        <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
        NEEDS REVIEW
      </Badge>
    );
  }
  if (decision === VERIFICATION_DECISION.INSUFFICIENT_DATA) {
    return (
      <Badge variant="neutral">
        <span className="w-2 h-2 rounded-full bg-slate-500" />
        INSUFFICIENT DATA
      </Badge>
    );
  }
  if (decision === VERIFICATION_DECISION.SERVICE_UNAVAILABLE) {
    return (
      <Badge variant="alert" className="glow-alert font-bold">
        <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#fb7185] animate-pulse" />
        SERVICE DEGRADED
      </Badge>
    );
  }
  return <Badge variant="default">{decision}</Badge>;
}
