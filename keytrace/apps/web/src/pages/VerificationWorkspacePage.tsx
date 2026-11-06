import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { Card, CardTitle } from "../components/ui/Card.js";
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
      <div className="max-w-md mx-auto py-16 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FFBF55]/10 border border-[#FFBF55]/20 flex items-center justify-center text-[#FFBF55]">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#F4F7FC]">Enrollment Incomplete</h2>
        <p className="text-xs text-[#94A3B8] max-w-sm">
          Continuous behavioural authentication requires an enrolled baseline profile to compare typing sessions against.
        </p>
        <Link to="/enrollment" className="mt-2">
          <Button variant="primary" size="md">
            Enroll Baseline Profile <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-4 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#243247]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="cyan">Verification Workspace</Badge>
            {activeSessionId ? (
              <Badge variant="match">
                <span className="w-1.5 h-1.5 rounded-full bg-[#32D6A0] animate-pulse" />
                Active Session
              </Badge>
            ) : (
              <Badge variant="neutral">Standby</Badge>
            )}
            {statusData?.isModelBuilt ? (
              <Badge variant="accent" className="hidden sm:inline-flex">
                <HardDrive className="w-3 h-3 mr-1 text-[#35D6E8]" />
                Model Ready
              </Badge>
            ) : (
              <Badge variant="review" className="hidden sm:inline-flex">
                <Cpu className="w-3 h-3 mr-1 text-[#FFBF55]" />
                Statistical Baseline
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#F4F7FC]">
            Continuous Behavioral Verification
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Evaluate consecutive typing windows against your enrolled baseline in real time.
          </p>
        </div>

        {/* Start / Stop Session Controls */}
        <div>
          {!activeSessionId ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => startSessionMutation.mutate()}
              isLoading={startSessionMutation.isPending}
            >
              <Play className="w-4 h-4 text-[#080B12] mr-1.5" /> Start Verification
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => endSessionMutation.mutate()}
              isLoading={endSessionMutation.isPending}
            >
              <Square className="w-3.5 h-3.5 mr-1" /> End Session
            </Button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-[#FF647C]/10 border border-[#FF647C]/20 text-xs text-[#FF647C] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#FF647C]" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Typing Window & Latest Result */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {activeSessionId ? (
            <Card elevated className="p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#243247]">
                <div>
                  <span className="text-xs font-semibold text-[#35D6E8] block">
                    Active Verification Window
                  </span>
                  <h3 className="text-sm font-semibold text-[#F4F7FC] mt-0.5">
                    Type naturally to test rhythm matching
                  </h3>
                </div>
                <span className="text-xs text-[#94A3B8] font-mono">
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
            <Card elevated className="p-10 text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#35D6E8]">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#F4F7FC]">
                Verification Session Inactive
              </h3>
              <p className="text-xs text-[#94A3B8] max-w-sm leading-relaxed">
                Click &ldquo;Start Verification&rdquo; to begin a continuous session and test whether your typing rhythm is recognized.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => startSessionMutation.mutate()}
                isLoading={startSessionMutation.isPending}
                className="mt-1"
              >
                <Play className="w-3.5 h-3.5 mr-1 text-[#080B12]" /> Start Session
              </Button>
            </Card>
          )}

          {/* Latest Result Card */}
          {latestResult && (
            <Card elevated className="p-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#243247] pb-3">
                <div>
                  <span className="text-xs text-[#94A3B8] block">Evaluation Outcome</span>
                  <div className="flex items-center gap-2 mt-1">
                    <DecisionBadge decision={latestResult.decision} />
                    <span className="text-xs text-[#94A3B8] font-mono">
                      #{latestResult.eventId.slice(-6)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[#94A3B8] block text-[10px] uppercase">Distance</span>
                    <span
                      className={`text-base font-bold ${
                        latestResult.decision === VERIFICATION_DECISION.MATCH
                          ? "text-[#32D6A0]"
                          : "text-[#FFBF55]"
                      }`}
                    >
                      {latestResult.score !== null ? latestResult.score.toFixed(3) : "—"}
                    </span>
                  </div>
                  <div className="w-[1px] h-6 bg-[#243247]" />
                  <div>
                    <span className="text-[#94A3B8] block text-[10px] uppercase">Threshold</span>
                    <span className="text-base font-bold text-[#F4F7FC]">
                      {latestResult.threshold.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason Codes */}
              {latestResult.reasonCodes && latestResult.reasonCodes.length > 0 && (
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-semibold text-[#F4F7FC]">Assessment:</span>
                  <ul className="space-y-1 text-[#94A3B8]">
                    {latestResult.reasonCodes.map((r: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#32D6A0] shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Col: Active Session Telemetry & Activity Stream */}
        <div className="flex flex-col gap-4">
          {/* Running Session Stats */}
          <Card elevated className="flex flex-col gap-3 p-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#F4F7FC] flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#35D6E8]" /> Session Summary
            </CardTitle>

            <div className="grid grid-cols-2 gap-2.5 text-center text-xs">
              <div className="p-3 rounded-xl bg-[#0D1320] border border-[#243247]">
                <span className="text-[#94A3B8] block text-[10px] uppercase">Evaluations</span>
                <span className="text-lg font-mono font-bold text-[#F4F7FC] mt-0.5 block">
                  {latestResult?.sessionSummary?.totalEvaluations || evaluationHistory.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#0D1320] border border-[#243247]">
                <span className="text-[#94A3B8] block text-[10px] uppercase">Matches</span>
                <span className="text-lg font-mono font-bold text-[#32D6A0] mt-0.5 block">
                  {latestResult?.sessionSummary?.matchCount ||
                    evaluationHistory.filter((e) => e.decision === VERIFICATION_DECISION.MATCH).length}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#94A3B8] p-2.5 rounded-lg bg-[#0D1320] border border-[#243247] leading-relaxed">
              <strong>Hysteresis Policy:</strong> A single pause does not terminate your session. Risk accumulates only when multiple successive windows diverge.
            </p>
          </Card>

          {/* Session Timeline Stream */}
          <Card elevated className="flex flex-col gap-3 p-4 flex-1">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#F4F7FC] flex items-center gap-2 border-b border-[#243247] pb-2">
              <Clock className="w-3.5 h-3.5 text-[#35D6E8]" /> Window Stream
            </CardTitle>

            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {evaluationHistory.length > 0 ? (
                evaluationHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#0D1320] border border-[#243247] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <DecisionBadge decision={item.decision} />
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-bold text-[#F4F7FC] text-xs">
                        {item.score !== null ? Number(item.score).toFixed(2) : "—"}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] block">
                        τ: {item.threshold}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-[#94A3B8]">
                  Awaiting first typing window...
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
