import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge, DecisionBadge } from "../components/ui/Badge.js";
import { KeystrokeCaptureField } from "../components/keystroke/KeystrokeCaptureField.js";
import {
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  BarChart2,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  KeystrokeSessionPayload,
  VERIFICATION_DECISION,
  FEATURE_METADATA,
  FeatureName,
} from "@keytrace/shared";

export function VerificationWorkspacePage() {
  const { user } = useAuth();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [evaluationHistory, setEvaluationHistory] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Start session mutation
  const startSessionMutation = useMutation({
    mutationFn: () => api.verification.startSession({ userAgent: navigator.userAgent }),
    onSuccess: (data) => {
      setActiveSessionId(data.sessionId);
      setEvaluationHistory([]);
      setLatestResult(null);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Failed to start verification session.");
    },
  });

  // Evaluate window mutation
  const evaluateMutation = useMutation({
    mutationFn: (payload: KeystrokeSessionPayload) =>
      api.verification.evaluateWindow(activeSessionId!, payload),
    onSuccess: (data) => {
      setLatestResult(data);
      setEvaluationHistory((prev) => [data, ...prev]);
    },
    onError: (err: any) => {
      setErrorMsg(err.message || "Evaluation failed.");
    },
  });

  // End session mutation
  const endSessionMutation = useMutation({
    mutationFn: () => api.verification.endSession(activeSessionId!),
    onSuccess: () => {
      setActiveSessionId(null);
    },
  });

  const isEnrolled = (user?.sampleCount || 0) >= 1;

  if (!isEnrolled) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center flex flex-col items-center gap-4">
        <AlertTriangle className="w-12 h-12 text-amber-400" />
        <h2 className="text-2xl font-bold text-foreground">Enrolment Profile Incomplete</h2>
        <p className="text-sm text-foreground-muted">
          Continuous behavioural authentication requires an enrolled profile to compare typing sessions against.
        </p>
        <Link to="/enrollment" className="mt-2">
          <Button variant="primary" size="md">
            Enrol Typing Profile <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="cyan" className="shadow-[0_0_12px_rgba(6,182,212,0.25)]">Verification Telemetry</Badge>
            {activeSessionId ? (
              <Badge variant="match">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                SESSION ACTIVE
              </Badge>
            ) : (
              <Badge variant="neutral">STANDBY</Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
            Continuous Behavioural Verification
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1">
            Evaluate consecutive typing windows against your enrolled baseline in real time.
          </p>
        </div>

        {/* Start / Stop Session Controls */}
        <div>
          {!activeSessionId ? (
            <Button
              variant="primary"
              size="lg"
              onClick={() => startSessionMutation.mutate()}
              isLoading={startSessionMutation.isPending}
            >
              <Play className="w-4 h-4 fill-slate-950" /> Start Continuous Session
            </Button>
          ) : (
            <Button
              variant="danger"
              size="md"
              onClick={() => endSessionMutation.mutate()}
              isLoading={endSessionMutation.isPending}
            >
              <Square className="w-3.5 h-3.5 fill-rose-400" /> End Active Session
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Typing Window & Latest Result */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {activeSessionId ? (
            <Card elevated className="p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                    Active Verification Window
                  </span>
                  <h3 className="text-lg font-bold text-foreground">
                    Type naturally to test behavioural match
                  </h3>
                </div>
                <span className="text-xs font-mono text-foreground-subtle">
                  Window #{evaluationHistory.length + 1}
                </span>
              </div>

              <KeystrokeCaptureField
                targetPromptText="The system measures key-hold and flight durations to evaluate whether this typing pattern matches your enrolled identity."
                buttonLabel="Evaluate Window"
                isSubmitting={evaluateMutation.isPending}
                onSessionComplete={async (payload) => {
                  await evaluateMutation.mutateAsync(payload);
                }}
              />
            </Card>
          ) : (
            <Card elevated className="p-12 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                Continuous Session Inactive
              </h3>
              <p className="text-xs text-foreground-muted max-w-md leading-relaxed">
                Click "Start Continuous Session" above to initialize a monitored verification workspace.
                You can then submit successive windows of typing to observe live pattern matching.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => startSessionMutation.mutate()}
                isLoading={startSessionMutation.isPending}
              >
                <Play className="w-4 h-4 fill-white" /> Start Session Now
              </Button>
            </Card>
          )}

          {/* Latest Result Card */}
          {latestResult && (
            <Card elevated className="p-6 flex flex-col gap-5 animate-fadeIn border-border-bright">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <span className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider">
                    Most Recent Evaluation Result
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <DecisionBadge decision={latestResult.decision} />
                    <span className="text-xs text-foreground-muted font-mono">
                      Event ID: {latestResult.eventId.slice(-8)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-foreground-subtle block">Distance Score</span>
                    <span
                      className={`text-lg font-bold ${
                        latestResult.decision === VERIFICATION_DECISION.MATCH
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {latestResult.score !== null ? latestResult.score.toFixed(3) : "—"}
                    </span>
                  </div>
                  <div className="w-[1px] h-8 bg-border" />
                  <div>
                    <span className="text-foreground-subtle block">Threshold</span>
                    <span className="text-lg font-bold text-foreground">
                      {latestResult.threshold.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason Codes */}
              {latestResult.reasonCodes && latestResult.reasonCodes.length > 0 && (
                <div className="flex flex-col gap-1.5 text-xs">
                  <span className="font-semibold text-foreground">Inference Assessment:</span>
                  <ul className="space-y-1 text-foreground-muted">
                    {latestResult.reasonCodes.map((r: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 10-Feature Deviations Telemetry Grid */}
              {latestResult.featureDeviations && (
                <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
                  <span className="text-xs font-semibold text-foreground flex items-center justify-between">
                    <span>Feature Z-Score Deviations (|x - median| / scale):</span>
                    <span className="text-[11px] text-foreground-subtle font-mono">&lt; 2.5 = normal</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                    {Object.entries(latestResult.featureDeviations).map(([feat, zVal]: [string, any]) => {
                      const isHigh = zVal > 2.8;
                      return (
                        <div
                          key={feat}
                          className={`p-2 rounded-lg border flex flex-col gap-1 ${
                            isHigh
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : "bg-surface-subtle border-border-subtle text-foreground-muted"
                          }`}
                        >
                          <span className="text-[10px] truncate text-foreground-subtle" title={feat}>
                            {feat.replace(/_/g, " ")}
                          </span>
                          <span className="font-bold">{Number(zVal).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Col: Active Session Telemetry & Activity Stream */}
        <div className="flex flex-col gap-6">
          {/* Running Session Stats */}
          <Card elevated className="flex flex-col gap-4 p-5">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-accent" /> Active Session Stats
            </CardTitle>

            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle">
                <span className="text-foreground-subtle block">Evaluations</span>
                <span className="text-xl font-mono font-bold text-foreground">
                  {latestResult?.sessionSummary?.totalEvaluations || evaluationHistory.length}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle">
                <span className="text-foreground-subtle block">Matches</span>
                <span className="text-xl font-mono font-bold text-emerald-400">
                  {latestResult?.sessionSummary?.matchCount ||
                    evaluationHistory.filter((e) => e.decision === VERIFICATION_DECISION.MATCH).length}
                </span>
              </div>
            </div>

            <div className="text-xs text-foreground-subtle p-3 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="font-semibold text-foreground block mb-1">Hysteresis Risk Policy</span>
              Single unusual pauses do not automatically compromise sessions. A risk advisory is triggered when multiple successive windows diverge.
            </div>
          </Card>

          {/* Session Timeline Stream */}
          <Card elevated className="flex flex-col gap-3 p-5 flex-1">
            <CardTitle className="text-sm flex items-center gap-2 border-b border-border-subtle pb-2">
              <Clock className="w-4 h-4 text-sky-400" /> Evaluation Stream
            </CardTitle>

            <div className="flex flex-col gap-2.5 max-h-[380px] overflow-y-auto pr-1">
              {evaluationHistory.length > 0 ? (
                evaluationHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-surface-subtle border border-border-subtle flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <DecisionBadge decision={item.decision} />
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground">
                        {item.score !== null ? item.score.toFixed(2) : "—"}
                      </span>
                      <span className="text-[10px] text-foreground-subtle block">
                        thresh {item.threshold}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-foreground-muted">
                  Awaiting first typing window in this session.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
