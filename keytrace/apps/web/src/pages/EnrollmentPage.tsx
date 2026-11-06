import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { Card, CardTitle } from "../components/ui/Card.js";
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
      <div className="max-w-md mx-auto py-16 text-center flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#FFBF55]/10 border border-[#FFBF55]/20 flex items-center justify-center text-[#FFBF55]">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-[#F4F7FC]">Informed Consent Required</h2>
        <p className="text-xs text-[#94A3B8] max-w-sm">
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
    <div className="max-w-4xl mx-auto py-4 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#243247]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="cyan">Enrollment Studio</Badge>
            {isEnrolled ? (
              <Badge variant="match">Profile Complete ({sampleCount} samples)</Badge>
            ) : (
              <Badge variant="review">
                {sampleCount} / {ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED} Samples
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#F4F7FC]">
            Behavioral Profile Enrollment
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
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
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-[#32D6A0]/10 border-[#32D6A0]/30 text-[#32D6A0]"
              : "bg-[#FF647C]/10 border-[#FF647C]/30 text-[#FF647C]"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#32D6A0]" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-[#FF647C]" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Progress Card */}
      <Card elevated className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-[#94A3B8] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#35D6E8] animate-pulse" />
            Baseline Progress
          </span>
          <span className="font-mono text-[#F4F7FC]">
            {sampleCount} of {ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED} samples ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 bg-[#0D1320] rounded-full border border-[#243247] overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isEnrolled ? "bg-[#32D6A0]" : "bg-[#35D6E8]"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      {/* Biometric Model Serialization Card */}
      <Card elevated className="p-4 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#35D6E8]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[#F4F7FC]">
                  Machine Learning Model Engine
                </h3>
                {isModelBuilt ? (
                  <Badge variant="match">Model Active</Badge>
                ) : sampleCount >= ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED ? (
                  <Badge variant="review">Ready to Compile</Badge>
                ) : (
                  <Badge variant="neutral">Pending Samples</Badge>
                )}
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                {isModelBuilt
                  ? "Trained model artifact (.joblib) is persisted and ready for zero-latency inference."
                  : "Collect at least 10 baseline samples to compile and save your biometric model."}
              </p>
            </div>
          </div>

          <div>
            {isModelBuilt ? (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => buildModelMutation.mutate()}
                isLoading={buildModelMutation.isPending}
                className="text-xs"
              >
                <Save className="w-3.5 h-3.5 mr-1 text-[#35D6E8]" /> Re-compile Model
              </Button>
            ) : (
              <Button
                variant="primary"
                size="xs"
                onClick={() => buildModelMutation.mutate()}
                disabled={sampleCount < 1 || buildModelMutation.isPending}
                isLoading={buildModelMutation.isPending}
                className="text-xs"
              >
                <Cpu className="w-3.5 h-3.5 mr-1 text-[#080B12]" /> Compile Model
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Typing Capture Component */}
      <Card elevated className="p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#243247]">
          <div>
            <span className="text-xs font-semibold text-[#35D6E8]">
              Sample #{sampleCount + 1}
            </span>
            <h3 className="text-sm font-semibold text-[#F4F7FC] mt-0.5">
              Type the prompt at your natural cadence
            </h3>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setPromptIndex((prev) => (prev + 1) % ENROLLMENT_PROMPTS.length)}
            className="text-xs text-[#94A3B8] hover:text-[#F4F7FC]"
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
      <Card elevated className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-[#243247] pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#F4F7FC] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#35D6E8]" /> Enrolled Timing Samples ({samplesData?.samples?.length || 0})
          </CardTitle>
          <span className="text-[11px] text-[#94A3B8] hidden sm:inline font-mono">
            Zero raw text stored
          </span>
        </div>

        {isSamplesLoading ? (
          <div className="py-6 text-center text-xs text-[#94A3B8]">Loading samples...</div>
        ) : samplesData?.samples && samplesData.samples.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#243247] text-[#94A3B8] font-mono text-[11px] bg-[#0D1320]">
                  <th className="py-2.5 px-3 font-medium">Recorded</th>
                  <th className="py-2.5 px-3 font-medium">Mean Hold</th>
                  <th className="py-2.5 px-3 font-medium">Mean Flight</th>
                  <th className="py-2.5 px-3 font-medium">Cadence</th>
                  <th className="py-2.5 px-3 font-medium">Quality</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243247]/50 font-mono">
                {samplesData.samples.map((s: any, idx: number) => (
                  <tr key={s.id} className="hover:bg-[#172235]/40 transition-colors">
                    <td className="py-2.5 px-3 text-[#94A3B8]">
                      #{samplesData.samples.length - idx} • {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2.5 px-3 text-[#F4F7FC]">
                      {s.featureVector?.mean_hold} ms
                    </td>
                    <td className="py-2.5 px-3 text-[#F4F7FC]">
                      {s.featureVector?.mean_flight} ms
                    </td>
                    <td className="py-2.5 px-3 text-[#F4F7FC]">
                      {s.featureVector?.chars_per_second} c/s
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#32D6A0]/10 text-[#32D6A0] border border-[#32D6A0]/20">
                        {s.qualityStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(s.id)}
                        disabled={deleteMutation.isPending}
                        className="text-[#94A3B8] hover:text-[#FF647C] p-1 rounded transition-colors cursor-pointer"
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
          <div className="py-6 text-center text-xs text-[#94A3B8]">
            No enrollment samples recorded yet. Type the prompt above to add your first sample.
          </div>
        )}
      </Card>
    </div>
  );
}
