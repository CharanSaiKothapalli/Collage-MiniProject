import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge } from "../components/ui/Badge.js";
import { KeystrokeCaptureField } from "../components/keystroke/KeystrokeCaptureField.js";
import {
  UserCheck,
  Shield,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Cpu,
  Save,
  Sparkles,
  Keyboard,
  Layers,
  Activity,
  Zap,
} from "lucide-react";
import { KeystrokeSessionPayload, ENROLLMENT_THRESHOLDS } from "@keytrace/shared";

const ENROLLMENT_PROMPTS = [
  "The quick brown fox jumps over the lazy dog to record behavioral dynamics.",
  "Keystroke timing provides an auxiliary risk signal without recording text.",
  "Security and privacy require transparent consent and data minimization.",
  "Continuous verification evaluates sequential windows of user typing rhythm.",
  "Biometric motor patterns reflect neuromuscular habits and cognitive cadence.",
  "Behavioral authentication prevents unauthorized session hijacking.",
  "Typing hold time measures physical duration between key down and key up.",
  "Inter-key flight intervals capture finger transit speed across the keyboard.",
  "Robust statistical distance uses median and median absolute deviation.",
  "Consistent natural typing speed produces the most reliable biometric profile.",
];

export function EnrollmentPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [promptIndex, setPromptIndex] = useState(0);
  const [selectedStage, setSelectedStage] = useState<"calibration" | "natural">("calibration");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Queries
  const { data: statusData } = useQuery({
    queryKey: ["enrollment-status"],
    queryFn: () => api.enrollment.getStatus(),
  });

  const { data: samplesData, isLoading: isSamplesLoading } = useQuery({
    queryKey: ["enrollment-samples"],
    queryFn: () => api.enrollment.getSamples(),
  });

  const calibrationCount = statusData?.calibrationCount ?? 0;
  const naturalCount = statusData?.naturalCount ?? 0;
  const totalSamples = statusData?.count ?? (calibrationCount + naturalCount);
  const isCalibrationComplete = calibrationCount >= ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES;
  const isNaturalComplete = naturalCount >= ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES;
  const isEnrolled = isCalibrationComplete && isNaturalComplete;
  const isModelBuilt = !!statusData?.isModelBuilt;

  // Auto-switch to natural stage if calibration is fulfilled and natural is still pending
  useEffect(() => {
    if (isCalibrationComplete && !isNaturalComplete) {
      setSelectedStage("natural");
    }
  }, [isCalibrationComplete, isNaturalComplete]);

  // Record sample mutation
  const recordMutation = useMutation({
    mutationFn: (payload: KeystrokeSessionPayload) => api.enrollment.recordSample(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["enrollment-status"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment-samples"] });
      refreshUser();
      setFeedback({ type: "success", message: data.message || "Sample recorded successfully." });
      setPromptIndex((prev) => (prev + 1) % ENROLLMENT_PROMPTS.length);
      setTimeout(() => setFeedback(null), 4500);
    },
    onError: (err: any) => {
      setFeedback({ type: "error", message: err.message || "Failed to record sample." });
    },
  });

  // Delete sample mutation
  const deleteMutation = useMutation({
    mutationFn: (sampleId: string) => api.enrollment.deleteSample(sampleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment-status"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment-samples"] });
      refreshUser();
      setFeedback({ type: "success", message: "Sample deleted." });
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  // Build & Save Model mutation
  const buildModelMutation = useMutation({
    mutationFn: () => api.enrollment.buildModel(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["enrollment-status"] });
      refreshUser();
      setFeedback({
        type: "success",
        message: data.message || "Hybrid biometric model compiled and saved successfully.",
      });
      setTimeout(() => setFeedback(null), 5000);
    },
    onError: (err: any) => {
      setFeedback({ type: "error", message: err.message || "Failed to build model." });
    },
  });

  const overallProgressPercent = Math.min(
    100,
    Math.round((totalSamples / ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED) * 100)
  );

  const calibProgressPercent = Math.min(
    100,
    Math.round((calibrationCount / ENROLLMENT_THRESHOLDS.MIN_CALIBRATION_SAMPLES) * 100)
  );

  const naturalProgressPercent = Math.min(
    100,
    Math.round((naturalCount / ENROLLMENT_THRESHOLDS.MIN_NATURAL_SAMPLES) * 100)
  );

  if (!user?.hasConsent) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-[#F8FAFC]">Informed Consent Required</h2>
        <p className="text-sm text-[#94A3B8] max-w-md">
          Under our privacy-by-design policy, keystroke timing collection requires your explicit agreement before recording any sessions.
        </p>
        <Link to="/consent" className="mt-2">
          <Button variant="primary" size="md">
            Review Consent Terms
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
            <Badge variant="blue">Hybrid Enrollment System</Badge>
            {isEnrolled ? (
              <Badge variant="match">Hybrid Profile Ready ({totalSamples} samples)</Badge>
            ) : (
              <Badge variant="review">
                {totalSamples} / {ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED} Samples
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Hybrid Behavioral Biometric Enrollment
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Combines controlled reference calibration (hold motor dynamics) with natural free-typing (cadence & cognitive pauses) for reliable everyday authentication.
          </p>
        </div>

        {isEnrolled && (
          <Link to="/verification">
            <Button variant="primary" size="md">
              Proceed to Verification <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        )}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs animate-fadeIn backdrop-blur-md shadow-sm ${
            feedback.type === "success"
              ? "bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]"
              : "bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#22C55E]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#EF4444]" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Three-Stage Architectural Pipeline Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stage 1 Card */}
        <div
          onClick={() => setSelectedStage("calibration")}
          className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            selectedStage === "calibration"
              ? "bg-[#1A2A44] border-[#FF6A00] shadow-[0_0_15px_rgba(255,106,0,0.15)] ring-1 ring-[#FF6A00]/30"
              : "bg-[#111B2E] border-[#263B5E] hover:border-[#FF6A00]/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#FF6A00] uppercase flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" /> Stage 01
            </span>
            {isCalibrationComplete ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-medium">
                Calibrated ({calibrationCount}/5)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/30 font-mono">
                {calibrationCount} / 5
              </span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#F8FAFC]">Reference Calibration</h4>
            <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
              Controlled phrase transcription anchoring neuromuscular physical finger-hold durations.
            </p>
          </div>
          <div className="w-full h-1.5 bg-[#0B1220] rounded-full border border-[#263B5E]/60 overflow-hidden">
            <div
              className="h-full bg-[#FF6A00] transition-all duration-300 rounded-full"
              style={{ width: `${calibProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Stage 2 Card */}
        <div
          onClick={() => setSelectedStage("natural")}
          className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
            selectedStage === "natural"
              ? "bg-[#1A2A44] border-[#38BDF8] shadow-[0_0_15px_rgba(56,189,248,0.15)] ring-1 ring-[#38BDF8]/30"
              : "bg-[#111B2E] border-[#263B5E] hover:border-[#38BDF8]/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#38BDF8] uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Stage 02
            </span>
            {isNaturalComplete ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-medium">
                Enrolled ({naturalCount}/5)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/30 font-mono">
                {naturalCount} / 5
              </span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#F8FAFC]">Natural Typing Mode</h4>
            <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
              Spontaneous free-text capturing natural cadence, flight variance, and cognitive pause patterns.
            </p>
          </div>
          <div className="w-full h-1.5 bg-[#0B1220] rounded-full border border-[#263B5E]/60 overflow-hidden">
            <div
              className="h-full bg-[#38BDF8] transition-all duration-300 rounded-full"
              style={{ width: `${naturalProgressPercent}%` }}
            />
          </div>
        </div>

        {/* Stage 3 Card: Model Compilation */}
        <div className="p-4.5 rounded-2xl bg-[#111B2E] border border-[#263B5E] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-wider text-[#22C55E] uppercase flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> Stage 03
            </span>
            {isModelBuilt ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#22C55E]/15 text-[#22C55E] border border-[#22C55E]/30 font-medium">
                Model Serialized
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#94A3B8]/10 text-[#94A3B8] border border-[#263B5E] font-mono">
                Pending Build
              </span>
            )}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[#F8FAFC]">Hybrid Baseline Compilation</h4>
            <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
              Statistically fuses motor anchors and natural flight distributions into a persistent .joblib model.
            </p>
          </div>
          <div className="w-full h-1.5 bg-[#0B1220] rounded-full border border-[#263B5E]/60 overflow-hidden">
            <div
              className="h-full bg-[#22C55E] transition-all duration-300 rounded-full"
              style={{ width: isModelBuilt ? "100%" : `${overallProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Biometric Model Serialization Telemetry Banner */}
      <Card elevated className="p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B1220] border border-[#263B5E] flex items-center justify-center text-[#F8FAFC]">
              <Cpu className="w-5 h-5 text-[#38BDF8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#F8FAFC]">
                  Hybrid Biometric Model Pipeline
                </h3>
                {isModelBuilt ? (
                  <Badge variant="match">Model Active</Badge>
                ) : isEnrolled ? (
                  <Badge variant="review">Ready to Compile</Badge>
                ) : (
                  <Badge variant="neutral">Collecting Baseline ({totalSamples}/10)</Badge>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {isModelBuilt
                  ? "Trained model artifact (.joblib) is persisted to disk and cached in memory for zero-retraining inference."
                  : "Complete 5 calibration samples and 5 natural typing samples to compile your hybrid model."}
              </p>
            </div>
          </div>

          <div>
            {isModelBuilt ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => buildModelMutation.mutate()}
                isLoading={buildModelMutation.isPending}
                className="text-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1" /> Re-compile Hybrid Model
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => buildModelMutation.mutate()}
                disabled={!isEnrolled || buildModelMutation.isPending}
                isLoading={buildModelMutation.isPending}
                className="text-xs"
              >
                <Cpu className="w-3.5 h-3.5 mr-1" /> Compile Hybrid Model
              </Button>
            )}
          </div>
        </div>

        {/* Model Telemetry Chips */}
        {isModelBuilt && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-[#263B5E]/60 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-[#0B1220]/80 border border-[#263B5E]/60 flex flex-col gap-0.5">
              <span className="text-[10px] text-[#94A3B8] uppercase">Algorithm</span>
              <span className="text-xs font-semibold text-[#F8FAFC]">Median + MAD Z-Score</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0B1220]/80 border border-[#263B5E]/60 flex flex-col gap-0.5">
              <span className="text-[10px] text-[#94A3B8] uppercase">Secondary ML</span>
              <span className="text-xs font-semibold text-[#38BDF8]">Isolation Forest</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0B1220]/80 border border-[#263B5E]/60 flex flex-col gap-0.5">
              <span className="text-[10px] text-[#94A3B8] uppercase">Stability Index</span>
              <span className="text-xs font-semibold text-[#F59E0B]">
                {statusData?.stabilityScore ? `${statusData.stabilityScore}% stability` : "Calibrated"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#0B1220]/80 border border-[#263B5E]/60 flex flex-col gap-0.5">
              <span className="text-[10px] text-[#94A3B8] uppercase">Decision Threshold</span>
              <span className="text-xs font-semibold text-[#22C55E]">
                τ = {statusData?.calibratedThreshold ? statusData.calibratedThreshold.toFixed(2) : "2.80"}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Dynamic Main Workspace: Completion Summary vs Ready to Compile vs Typing Capture */}
      {isEnrolled && isModelBuilt ? (
        <Card elevated className="p-6 sm:p-8 flex flex-col gap-6 border-[#22C55E]/30 bg-gradient-to-b from-[#111B2E] to-[#0B1220]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#263B5E]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/25 flex items-center justify-center text-[#22C55E] shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#22C55E] uppercase tracking-wider">
                    Enrollment Complete • Baseline Verified
                  </span>
                  <Badge variant="match">Profile Active</Badge>
                </div>
                <h3 className="text-lg font-bold text-[#F8FAFC] mt-0.5">
                  Behavioral Biometric Profile Successfully Initialized
                </h3>
              </div>
            </div>

            {/* Primary Action */}
            <Link to="/verification">
              <Button variant="primary" size="md">
                Proceed to Verification <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>

          {/* Completed Enrollment Summary Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col gap-1.5">
              <span className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider flex items-center justify-between">
                Stage 1 Calibration
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              </span>
              <span className="text-sm font-semibold text-[#F8FAFC]">
                Reference Calibration: 5/5 Complete
              </span>
              <span className="text-[11px] text-[#94A3B8]">
                Motor hold duration baseline established
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col gap-1.5">
              <span className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider flex items-center justify-between">
                Stage 2 Natural Typing
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              </span>
              <span className="text-sm font-semibold text-[#F8FAFC]">
                Natural Typing: 5/5 Complete
              </span>
              <span className="text-[11px] text-[#94A3B8]">
                Cognitive cadence & flight profile captured
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col gap-1.5">
              <span className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider flex items-center justify-between">
                Hybrid Compilation
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              </span>
              <span className="text-sm font-semibold text-[#F8FAFC]">
                Hybrid Model: Successfully Compiled
              </span>
              <span className="text-[11px] text-[#94A3B8]">
                Median + MAD + Isolation Forest serialized
              </span>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col gap-1.5">
              <span className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider flex items-center justify-between">
                Operational State
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
                </span>
              </span>
              <span className="text-sm font-semibold text-[#22C55E]">
                Model Status: Active
              </span>
              <span className="text-[11px] text-[#94A3B8]">
                τ = {statusData?.calibratedThreshold ? statusData.calibratedThreshold.toFixed(2) : "2.20"} threshold ready
              </span>
            </div>
          </div>

          {/* Secondary Action & Notice */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-[#263B5E]/60 text-xs text-[#94A3B8]">
            <p>
              Your typing profile baseline is complete. You can test continuous authentication on the Verification page, or re-compile if needed.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => buildModelMutation.mutate()}
                isLoading={buildModelMutation.isPending}
                className="text-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1" /> Re-compile Hybrid Model
              </Button>
            </div>
          </div>
        </Card>
      ) : isEnrolled && !isModelBuilt ? (
        <Card elevated className="p-6 sm:p-8 flex flex-col gap-6 border-[#38BDF8]/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#263B5E]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/25 flex items-center justify-center text-[#38BDF8]">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider">
                    All Baseline Samples Collected (10/10)
                  </span>
                  <Badge variant="blue">Ready to Compile</Badge>
                </div>
                <h3 className="text-lg font-bold text-[#F8FAFC] mt-0.5">
                  Compile Your Personalized Hybrid Model
                </h3>
                <p className="text-xs text-[#94A3B8] mt-1">
                  5 reference calibration samples and 5 natural typing samples are recorded. Click below to compile and serialize your hybrid model.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={() => buildModelMutation.mutate()}
              isLoading={buildModelMutation.isPending}
            >
              <Cpu className="w-4 h-4 mr-1.5" /> Compile Hybrid Model
            </Button>
          </div>
        </Card>
      ) : (
        /* Regular Typing Capture Card when samples are still needed */
        <Card elevated className="p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#263B5E]/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#FF6A00] uppercase tracking-wider">
                  {selectedStage === "calibration"
                    ? calibrationCount >= 5
                      ? "Stage 1: Reference Calibration • Complete (5/5)"
                      : `Stage 1: Reference Calibration • Sample #${calibrationCount + 1} of 5`
                    : naturalCount >= 5
                    ? "Stage 2: Natural Typing Enrollment • Complete (5/5)"
                    : `Stage 2: Natural Typing Enrollment • Sample #${naturalCount + 1} of 5`}
                </span>
              </div>
              <h3 className="text-base font-semibold text-[#F8FAFC] mt-0.5">
                {selectedStage === "calibration"
                  ? calibrationCount >= 5
                    ? "Stage 1 calibration fulfilled. Proceed to Stage 2 Natural Typing."
                    : "Type the prompt at your natural cadence"
                  : naturalCount >= 5
                  ? "Stage 2 natural typing fulfilled. Compile your hybrid baseline model."
                  : "Type freely about any topic at your natural rhythm"}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {selectedStage === "calibration" && calibrationCount < 5 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPromptIndex((prev) => (prev + 1) % ENROLLMENT_PROMPTS.length)}
                  className="text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  Change Prompt
                </Button>
              ) : null}

              {/* Stage toggle tabs */}
              <div className="flex items-center p-1 bg-[#0B1220] rounded-xl border border-[#263B5E]">
                <button
                  type="button"
                  onClick={() => setSelectedStage("calibration")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedStage === "calibration"
                      ? "bg-[#1A2A44] text-[#FF6A00] border border-[#FF6A00]/30 shadow-sm"
                      : "text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                >
                  Stage 1 ({calibrationCount}/5)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStage("natural")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedStage === "natural"
                      ? "bg-[#1A2A44] text-[#38BDF8] border border-[#38BDF8]/30 shadow-sm"
                      : "text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                >
                  Stage 2 ({naturalCount}/5)
                </button>
              </div>
            </div>
          </div>

          <KeystrokeCaptureField
            key={selectedStage}
            mode={selectedStage}
            targetPromptText={ENROLLMENT_PROMPTS[promptIndex]}
            buttonLabel={
              selectedStage === "calibration"
                ? `Submit Calibration Sample #${calibrationCount + 1}`
                : `Capture Natural Sample #${naturalCount + 1}`
            }
            isSubmitting={recordMutation.isPending}
            onSessionComplete={async (payload) => {
              await recordMutation.mutateAsync(payload);
            }}
          />
        </Card>
      )}

      {/* Enrolled Samples Table */}
      <Card elevated className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#263B5E]/60 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#38BDF8]" /> Enrolled Baseline Samples ({samplesData?.samples?.length || 0})
          </CardTitle>
          <span className="text-xs text-[#94A3B8] hidden sm:inline">
            Stage 1 Calibration ({calibrationCount}) • Stage 2 Natural ({naturalCount})
          </span>
        </div>

        {isSamplesLoading ? (
          <div className="py-8 text-center text-xs text-[#94A3B8]">Loading samples...</div>
        ) : samplesData?.samples && samplesData.samples.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#263B5E]/60 text-[#94A3B8] font-mono text-[11px]">
                  <th className="py-2.5 px-3 font-medium">Recorded</th>
                  <th className="py-2.5 px-3 font-medium">Enrollment Stage</th>
                  <th className="py-2.5 px-3 font-medium">Mean Hold</th>
                  <th className="py-2.5 px-3 font-medium">Mean Flight</th>
                  <th className="py-2.5 px-3 font-medium">Cadence</th>
                  <th className="py-2.5 px-3 font-medium">Quality</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263B5E]/40 font-mono">
                {samplesData.samples.map((s: any, idx: number) => {
                  const isNat = s.sampleType === "natural";
                  return (
                    <tr key={s.id} className="hover:bg-[#1A2A44]/30 transition-colors">
                      <td className="py-3 px-3 text-[#94A3B8]">
                        #{samplesData.samples.length - idx} •{" "}
                        {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            isNat
                              ? "bg-[#38BDF8]/15 text-[#38BDF8] border-[#38BDF8]/30"
                              : "bg-[#FF6A00]/15 text-[#FF6A00] border-[#FF6A00]/30"
                          }`}
                        >
                          {isNat ? "Stage 2: Natural" : "Stage 1: Calibration"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#F8FAFC]">
                        {s.featureVector?.mean_hold} ms
                      </td>
                      <td className="py-3 px-3 text-[#F8FAFC]">
                        {s.featureVector?.mean_flight} ms
                      </td>
                      <td className="py-3 px-3 text-[#F8FAFC]">
                        {s.featureVector?.chars_per_second} c/s
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20">
                          {s.qualityStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => deleteMutation.mutate(s.id)}
                          disabled={deleteMutation.isPending}
                          className="text-[#94A3B8] hover:text-[#EF4444] p-1 rounded transition-colors cursor-pointer"
                          title="Delete sample"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#94A3B8]">
            No enrollment samples recorded yet. Complete Stage 1 calibration above to begin.
          </div>
        )}
      </Card>
    </div>
  );
}
