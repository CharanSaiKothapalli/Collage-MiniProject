import React, { useState } from "react";
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

  // Record sample mutation
  const recordMutation = useMutation({
    mutationFn: (payload: KeystrokeSessionPayload) => api.enrollment.recordSample(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["enrollment-status"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment-samples"] });
      refreshUser();
      setFeedback({ type: "success", message: data.message || "Sample recorded successfully." });
      setPromptIndex((prev) => (prev + 1) % ENROLLMENT_PROMPTS.length);
      setTimeout(() => setFeedback(null), 4000);
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
        message: data.message || "Model built and cached successfully.",
      });
      setTimeout(() => setFeedback(null), 5000);
    },
    onError: (err: any) => {
      setFeedback({ type: "error", message: err.message || "Failed to build model." });
    },
  });

  const sampleCount = statusData?.count || 0;
  const isEnrolled = sampleCount >= ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED;
  const isModelBuilt = !!statusData?.isModelBuilt;
  const progressPercent = Math.min(100, Math.round((sampleCount / ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED) * 100));

  if (!user?.hasConsent) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-white">Informed Consent Required</h2>
        <p className="text-sm text-zinc-400 max-w-md">
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
    <div className="max-w-4xl mx-auto py-6 flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="cyan">Enrollment Console</Badge>
            {isEnrolled ? (
              <Badge variant="match">Profile Complete ({sampleCount} samples)</Badge>
            ) : (
              <Badge variant="review">
                {sampleCount} / {ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED} Samples
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Behavioral Profile Enrollment
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Record at least 10 sessions typing at your normal rhythm to construct a reliable biometric baseline.
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
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Progress Card */}
      <Card elevated className="p-5 flex flex-col gap-3.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-zinc-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Overall Baseline Progress
          </span>
          <span className="font-mono text-zinc-200">
            {sampleCount} of {ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED} required samples ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isEnrolled
                ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                : "bg-indigo-500"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      {/* Biometric Model Serialization Card */}
      <Card elevated className="p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  Personal Biometric Model Pipeline
                </h3>
                {isModelBuilt ? (
                  <Badge variant="match">Model Active</Badge>
                ) : sampleCount >= ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED ? (
                  <Badge variant="review">Ready to Compile</Badge>
                ) : (
                  <Badge variant="neutral">Pending Samples</Badge>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isModelBuilt
                  ? "Trained model artifact (.joblib) is persisted to disk and cached in memory for zero-retraining inference."
                  : "Collect at least 10 baseline samples to compile and save your biometric model."}
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
                <Save className="w-3.5 h-3.5 mr-1" /> Re-compile Model
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => buildModelMutation.mutate()}
                disabled={sampleCount < 1 || buildModelMutation.isPending}
                isLoading={buildModelMutation.isPending}
                className="text-xs"
              >
                <Cpu className="w-3.5 h-3.5 mr-1 text-zinc-950" /> Compile Model
              </Button>
            )}
          </div>
        </div>

        {/* Model Telemetry Chips */}
        {isModelBuilt && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-white/[0.06] text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-white/[0.06] flex flex-col gap-0.5">
              <span className="text-[10px] text-zinc-500 uppercase">Artifact</span>
              <span className="text-xs font-semibold text-zinc-200">Joblib Binary</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-white/[0.06] flex flex-col gap-0.5">
              <span className="text-[10px] text-zinc-500 uppercase">Inference Mode</span>
              <span className="text-xs font-semibold text-emerald-400">Zero Retraining</span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-white/[0.06] flex flex-col gap-0.5">
              <span className="text-[10px] text-zinc-500 uppercase">Stability</span>
              <span className="text-xs font-semibold text-amber-400">
                {statusData?.stabilityScore ? `${statusData.stabilityScore}% index` : "Calibrated"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-white/[0.06] flex flex-col gap-0.5">
              <span className="text-[10px] text-zinc-500 uppercase">Threshold</span>
              <span className="text-xs font-semibold text-zinc-200">
                τ = {statusData?.calibratedThreshold ? statusData.calibratedThreshold.toFixed(2) : "2.80"}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Typing Capture Component */}
      <Card elevated className="p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div>
            <span className="text-xs font-medium text-indigo-400">
              Sample #{sampleCount + 1}
            </span>
            <h3 className="text-base font-semibold text-white mt-0.5">
              Type the prompt at your natural cadence
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPromptIndex((prev) => (prev + 1) % ENROLLMENT_PROMPTS.length)}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Change Prompt
          </Button>
        </div>

        <KeystrokeCaptureField
          targetPromptText={ENROLLMENT_PROMPTS[promptIndex]}
          buttonLabel={`Submit Sample #${sampleCount + 1}`}
          isSubmitting={recordMutation.isPending}
          onSessionComplete={async (payload) => {
            await recordMutation.mutateAsync(payload);
          }}
        />
      </Card>

      {/* Enrolled Samples Table */}
      <Card elevated className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-400" /> Enrolled Timing Samples ({samplesData?.samples?.length || 0})
          </CardTitle>
          <span className="text-xs text-zinc-500 hidden sm:inline">
            Numeric feature vectors stored securely without raw text
          </span>
        </div>

        {isSamplesLoading ? (
          <div className="py-8 text-center text-xs text-zinc-500">Loading samples...</div>
        ) : samplesData?.samples && samplesData.samples.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.06] text-zinc-500 font-mono text-[11px]">
                  <th className="py-2.5 px-3 font-medium">Recorded</th>
                  <th className="py-2.5 px-3 font-medium">Mean Hold</th>
                  <th className="py-2.5 px-3 font-medium">Mean Flight</th>
                  <th className="py-2.5 px-3 font-medium">Cadence</th>
                  <th className="py-2.5 px-3 font-medium">Quality</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] font-mono">
                {samplesData.samples.map((s: any, idx: number) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 text-zinc-400">
                      #{samplesData.samples.length - idx} • {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-3 text-zinc-200">
                      {s.featureVector?.mean_hold} ms
                    </td>
                    <td className="py-3 px-3 text-zinc-200">
                      {s.featureVector?.mean_flight} ms
                    </td>
                    <td className="py-3 px-3 text-zinc-200">
                      {s.featureVector?.chars_per_second} c/s
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {s.qualityStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(s.id)}
                        disabled={deleteMutation.isPending}
                        className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                        title="Delete sample"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-zinc-500">
            No enrollment samples recorded yet. Type the prompt above to add your first sample.
          </div>
        )}
      </Card>
    </div>
  );
}
