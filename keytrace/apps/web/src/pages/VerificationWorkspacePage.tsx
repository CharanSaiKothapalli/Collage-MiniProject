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
  Cpu,
  Clock,
  HardDrive,
} from "lucide-react";
import {
  KeystrokeSessionPayload,
  VERIFICATION_DECISION,
} from "@keytrace/shared";

export function VerificationWorkspacePage() {
  const { user } = useAuth();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [evaluationHistory, setEvaluationHistory] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: statusData } = useQuery({
    queryKey: ["enrollment-status"],
    queryFn: () => api.enrollment.getStatus(),
  });

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

  const sampleCount = statusData?.count ?? user?.sampleCount ?? 0;
  const isEnrolled = sampleCount >= 1;

  if (!isEnrolled) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white">Enrollment Incomplete</h2>
        <p className="text-sm text-zinc-400 max-w-md">
          Continuous behavioural authentication requires an enrolled baseline profile to compare typing sessions against.
        </p>
        <Link to="/enrollment" className="mt-2">
          <Button variant="primary" size="md">
            Enroll Typing Profile <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="cyan">Verification Workspace</Badge>
            {activeSessionId ? (
              <Badge variant="match">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Session Active
              </Badge>
            ) : (
              <Badge variant="neutral">Standby</Badge>
            )}
            {statusData?.isModelBuilt ? (
              <Badge variant="accent" className="hidden sm:inline-flex">
                <HardDrive className="w-3 h-3 mr-1 text-indigo-400" />
                Model Ready
              </Badge>
            ) : (
              <Badge variant="review" className="hidden sm:inline-flex">
                <Cpu className="w-3 h-3 mr-1 text-amber-400" />
                Statistical Baseline
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Continuous Behavioral Verification
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
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
              <Play className="w-4 h-4 text-zinc-950" /> Start Verification
            </Button>
          ) : (
            <Button
              variant="danger"
              size="md"
              onClick={() => endSessionMutation.mutate()}
              isLoading={endSessionMutation.isPending}
            >
              <Square className="w-3.5 h-3.5" /> End Active Session
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Typing Window & Latest Result */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {activeSessionId ? (
            <Card elevated className="p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <span className="text-xs font-medium text-indigo-400">
                    Active Verification Window
                  </span>
                  <h3 className="text-base font-semibold text-white mt-0.5">
                    Type naturally to test behavioural match
                  </h3>
                </div>
                <span className="text-xs text-zinc-500 font-mono">
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
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white">
                <Shield className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                Verification Session Inactive
              </h3>
              <p className="text-xs text-zinc-400 max-w-md leading-relaxed">
                Click "Start Verification" above to initialize a monitored verification workspace.
                You can then submit successive windows of typing to observe live pattern matching.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => startSessionMutation.mutate()}
                isLoading={startSessionMutation.isPending}
              >
                <Play className="w-4 h-4 text-zinc-950" /> Start Session Now
              </Button>
            </Card>
          )}

          {/* Latest Result Card */}
          {latestResult && (
            <Card elevated className="p-6 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">
                    Most Recent Evaluation Result
                  </span>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <DecisionBadge decision={latestResult.decision} />
                    <span className="text-xs text-zinc-500 font-mono">
                      Event: {latestResult.eventId.slice(-8)}
                    </span>
                    {latestResult.modelSource === "saved_model" ? (
                      <Badge variant="cyan" className="text-[10px]">
                        Saved Model
                      </Badge>
                    ) : (
                      <Badge variant="neutral" className="text-[10px]">
                        Statistical Baseline
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Distance</span>
                    <span
                      className={`text-lg font-semibold ${
                        latestResult.decision === VERIFICATION_DECISION.MATCH
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {latestResult.score !== null ? latestResult.score.toFixed(3) : "—"}
                    </span>
                  </div>
                  <div className="w-[1px] h-8 bg-zinc-800" />
                  <div>
                    <span className="text-zinc-500 block text-[11px]">Threshold</span>
                    <span className="text-lg font-semibold text-zinc-200">
                      {latestResult.threshold.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason Codes */}
              {latestResult.reasonCodes && latestResult.reasonCodes.length > 0 && (
                <div className="flex flex-col gap-1.5 text-xs">
                  <span className="font-medium text-zinc-300">Assessment:</span>
                  <ul className="space-y-1 text-zinc-400">
                    {latestResult.reasonCodes.map((r: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 10-Feature Deviations Telemetry Grid */}
              {latestResult.featureDeviations && (
                <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                  <span className="text-xs font-medium text-zinc-300 flex items-center justify-between">
                    <span>Feature Z-Score Deviations:</span>
                    <span className="text-[11px] text-zinc-500 font-mono">&lt; 2.50 = Normal</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                    {Object.entries(latestResult.featureDeviations).map(([feat, zVal]: [string, any]) => {
                      const isHigh = zVal > 2.8;
                      return (
                        <div
                          key={feat}
                          className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                            isHigh
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              : "bg-zinc-950/60 border-white/[0.06] text-zinc-400"
                          }`}
                        >
                          <span className="text-[10px] truncate text-zinc-500" title={feat}>
                            {feat.replace(/_/g, " ")}
                          </span>
                          <span className="font-semibold text-zinc-200">{Number(zVal).toFixed(2)}</span>
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
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Active Session Stats
            </CardTitle>

            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
                <span className="text-zinc-500 block text-[11px]">Evaluations</span>
                <span className="text-xl font-mono font-semibold text-white mt-0.5 block">
                  {latestResult?.sessionSummary?.totalEvaluations || evaluationHistory.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
                <span className="text-zinc-500 block text-[11px]">Matches</span>
                <span className="text-xl font-mono font-semibold text-emerald-400 mt-0.5 block">
                  {latestResult?.sessionSummary?.matchCount ||
                    evaluationHistory.filter((e) => e.decision === VERIFICATION_DECISION.MATCH).length}
                </span>
              </div>
            </div>

            <div className="text-xs text-zinc-400 p-3 rounded-xl bg-zinc-950/40 border border-white/[0.06] leading-relaxed">
              <span className="font-medium text-zinc-200 block mb-1">Hysteresis Risk Policy</span>
              Single unusual pauses do not automatically compromise sessions. A risk advisory is triggered when multiple successive windows diverge.
            </div>
          </Card>

          {/* Session Timeline Stream */}
          <Card elevated className="flex flex-col gap-3 p-5 flex-1">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 border-b border-white/[0.06] pb-2">
              <Clock className="w-4 h-4 text-sky-400" /> Evaluation Stream
            </CardTitle>

            <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
              {evaluationHistory.length > 0 ? (
                evaluationHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-zinc-950/60 border border-white/[0.06] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <DecisionBadge decision={item.decision} />
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-semibold text-zinc-200">
                        {item.score !== null ? item.score.toFixed(2) : "—"}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        τ: {item.threshold}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500">
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
