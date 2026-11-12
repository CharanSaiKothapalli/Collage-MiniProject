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
  Info,
  Sparkles,
  Keyboard,
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
  const [verificationMode, setVerificationMode] = useState<"natural" | "calibration">("natural");
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
        <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-[#F8FAFC]">Enrollment Incomplete</h2>
        <p className="text-sm text-[#94A3B8] max-w-md">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#263B5E]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge variant="blue">Verification Workspace</Badge>
            {activeSessionId ? (
              <Badge variant="match">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                Session Active
              </Badge>
            ) : (
              <Badge variant="neutral">Standby</Badge>
            )}
            {statusData?.isModelBuilt ? (
              <Badge variant="blue" className="hidden sm:inline-flex">
                <HardDrive className="w-3 h-3 mr-1 text-[#38BDF8]" />
                Hybrid Model Serialized (.joblib)
              </Badge>
            ) : (
              <Badge variant="review" className="hidden sm:inline-flex">
                <Cpu className="w-3 h-3 mr-1 text-[#F59E0B]" />
                Statistical Baseline
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Continuous Natural Verification
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Authenticate seamlessly through your natural typing cadence without copying fixed sentences.
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
              <Play className="w-4 h-4 text-[#0B1220]" /> Start Verification
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
        <div className="p-4 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 text-xs text-[#EF4444] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Behavioral Deviation Context Callout */}
      <div className="p-4 rounded-2xl bg-[#111B2E] border border-[#263B5E] flex items-start gap-3 text-xs text-[#94A3B8] leading-relaxed">
        <Info className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#F8FAFC] block mb-0.5">
            Behavioral Biometric Deviation Interpretation
          </span>
          Continuous verification measures neuromuscular key-hold timing and cognitive flight intervals. A{" "}
          <span className="text-[#F59E0B] font-semibold">REVIEW</span> decision indicates natural behavioral drift (e.g. fatigue, typing posture change, distraction, or pause variation) rather than definitive proof of an imposter. The system applies sequential hysteresis before escalating risk.
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Typing Window & Latest Result */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {activeSessionId ? (
            <Card elevated className="p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#263B5E]/60">
                <div>
                  <span className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider">
                    Active Verification Window #{evaluationHistory.length + 1}
                  </span>
                  <h3 className="text-base font-semibold text-[#F8FAFC] mt-0.5">
                    {verificationMode === "natural"
                      ? "Natural Free-Typing Verification"
                      : "Prompted Reference Verification"}
                  </h3>
                </div>

                {/* Mode Selector Toggle */}
                <div className="flex items-center p-1 bg-[#0B1220] rounded-xl border border-[#263B5E]">
                  <button
                    type="button"
                    onClick={() => setVerificationMode("natural")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      verificationMode === "natural"
                        ? "bg-[#1A2A44] text-[#38BDF8] border border-[#38BDF8]/30 shadow-sm"
                        : "text-[#94A3B8] hover:text-[#F8FAFC]"
                    }`}
                  >
                    <Sparkles className="w-3 h-3" /> Natural Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerificationMode("calibration")}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                      verificationMode === "calibration"
                        ? "bg-[#1A2A44] text-[#FF6A00] border border-[#FF6A00]/30 shadow-sm"
                        : "text-[#94A3B8] hover:text-[#F8FAFC]"
                    }`}
                  >
                    <Keyboard className="w-3 h-3" /> Fixed Prompt
                  </button>
                </div>
              </div>

              <KeystrokeCaptureField
                key={verificationMode}
                mode={verificationMode}
                targetPromptText="Continuous keystroke dynamics verifies behavioural identity by evaluating sequential windows of key-hold durations and flight intervals."
                buttonLabel="Evaluate Window"
                isSubmitting={evaluateMutation.isPending}
                onSessionComplete={async (payload) => {
                  await evaluateMutation.mutateAsync(payload);
                }}
              />
            </Card>
          ) : (
            <Card elevated className="p-12 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#0B1220] border border-[#263B5E] flex items-center justify-center text-[#F8FAFC]">
                <Shield className="w-6 h-6 text-[#38BDF8]" />
              </div>
              <h3 className="text-lg font-semibold text-[#F8FAFC]">
                Verification Session Inactive
              </h3>
              <p className="text-xs text-[#94A3B8] max-w-md leading-relaxed">
                Click "Start Verification" above to initialize a monitored verification workspace.
                You can then type naturally or follow prompt windows to observe live biometric authentication.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={() => startSessionMutation.mutate()}
                isLoading={startSessionMutation.isPending}
              >
                <Play className="w-4 h-4 text-[#0B1220]" /> Start Session Now
              </Button>
            </Card>
          )}

          {/* Latest Result Card */}
          {latestResult && (
            <Card elevated className="p-6 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#263B5E]/60 pb-4">
                <div>
                  <span className="text-xs text-[#94A3B8] font-medium">
                    Most Recent Evaluation Result
                  </span>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <DecisionBadge decision={latestResult.decision} />
                    <span className="text-xs text-[#94A3B8] font-mono">
                      Event: {latestResult.eventId.slice(-8)}
                    </span>
                    {latestResult.modelSource === "saved_model" ? (
                      <Badge variant="blue" className="text-[10px]">
                        Saved Model (.joblib)
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
                    <span className="text-[#94A3B8] block text-[11px]">Distance (d)</span>
                    <span
                      className={`text-lg font-semibold ${
                        latestResult.decision === VERIFICATION_DECISION.MATCH
                          ? "text-[#22C55E]"
                          : "text-[#F59E0B]"
                      }`}
                    >
                      {latestResult.score !== null ? latestResult.score.toFixed(3) : "—"}
                    </span>
                  </div>
                  <div className="w-[1px] h-8 bg-[#263B5E]" />
                  <div>
                    <span className="text-[#94A3B8] block text-[11px]">Threshold (τ)</span>
                    <span className="text-lg font-semibold text-[#F8FAFC]">
                      {latestResult.threshold.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason Codes */}
              {latestResult.reasonCodes && latestResult.reasonCodes.length > 0 && (
                <div className="flex flex-col gap-1.5 text-xs">
                  <span className="font-semibold text-[#F8FAFC]">Diagnostic Assessment:</span>
                  <ul className="space-y-1.5 text-[#94A3B8]">
                    {latestResult.reasonCodes.map((r: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 10-Feature Deviations Telemetry Grid */}
              {latestResult.featureDeviations && (
                <div className="flex flex-col gap-2.5 pt-3 border-t border-[#263B5E]/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#F8FAFC]">
                      Ten-Dimensional Behavioral Feature Z-Scores:
                    </span>
                    <span className="text-[11px] text-[#94A3B8] font-mono">&lt; 2.50 = Conforming</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
                    {Object.entries(latestResult.featureDeviations).map(([feat, zVal]: [string, any]) => {
                      const isHigh = zVal > 2.8;
                      const meta = FEATURE_METADATA[feat as FeatureName];
                      return (
                        <div
                          key={feat}
                          className={`p-2.5 rounded-xl border flex flex-col gap-1 ${
                            isHigh
                              ? "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]"
                              : "bg-[#0B1220]/70 border-[#263B5E]/60 text-[#94A3B8]"
                          }`}
                        >
                          <span className="text-[10px] truncate text-[#94A3B8]" title={meta?.label || feat}>
                            {meta?.label || feat.replace(/_/g, " ")}
                          </span>
                          <span className="font-semibold text-[#F8FAFC]">{Number(zVal).toFixed(2)} σ</span>
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
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#F8FAFC]">
              <Activity className="w-4 h-4 text-[#38BDF8]" /> Active Session Metrics
            </CardTitle>

            <div className="grid grid-cols-2 gap-3 text-center text-xs">
              <div className="p-3 rounded-xl bg-[#0B1220]/80 border border-[#263B5E]/60">
                <span className="text-[#94A3B8] block text-[11px]">Evaluations</span>
                <span className="text-xl font-mono font-semibold text-[#F8FAFC] mt-0.5 block">
                  {latestResult?.sessionSummary?.totalEvaluations || evaluationHistory.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B1220]/80 border border-[#263B5E]/60">
                <span className="text-[#94A3B8] block text-[11px]">Matches</span>
                <span className="text-xl font-mono font-semibold text-[#22C55E] mt-0.5 block">
                  {latestResult?.sessionSummary?.matchCount ||
                    evaluationHistory.filter((e) => e.decision === VERIFICATION_DECISION.MATCH).length}
                </span>
              </div>
            </div>

            <div className="text-xs text-[#94A3B8] p-3 rounded-xl bg-[#0B1220]/60 border border-[#263B5E]/50 leading-relaxed">
              <span className="font-medium text-[#F8FAFC] block mb-1">Adaptive Hysteresis</span>
              Spontaneous natural typing pauses do not compromise continuous authentication. A risk advisory triggers only when consecutive evaluation windows diverge.
            </div>
          </Card>

          {/* Session Timeline Stream */}
          <Card elevated className="flex flex-col gap-3 p-5 flex-1">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 border-b border-[#263B5E]/60 pb-2 text-[#F8FAFC]">
              <Clock className="w-4 h-4 text-[#FF6A00]" /> Evaluation History
            </CardTitle>

            <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
              {evaluationHistory.length > 0 ? (
                evaluationHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#0B1220]/80 border border-[#263B5E]/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <DecisionBadge decision={item.decision} />
                    </div>
                    <div className="text-right font-mono">
                      <span className="font-semibold text-[#F8FAFC]">
                        {item.score !== null ? item.score.toFixed(2) : "—"}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] block">
                        τ: {item.threshold}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-[#94A3B8]">
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
