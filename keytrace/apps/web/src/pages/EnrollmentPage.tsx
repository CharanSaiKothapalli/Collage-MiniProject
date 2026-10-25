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
  HelpCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { KeystrokeSessionPayload, ENROLLMENT_THRESHOLDS, PROFILE_STATUS } from "@keytrace/shared";

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
  const { data: statusData, isLoading: isStatusLoading } = useQuery({
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
      // Advance to next prompt
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

  // Finalize mutation
  const finalizeMutation = useMutation({
    mutationFn: () => api.enrollment.finalize(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["enrollment-status"] });
      refreshUser();
      setFeedback({ type: "success", message: "Profile finalized and ready for verification!" });
    },
  });

  const sampleCount = statusData?.count || 0;
  const isEnrolled = sampleCount >= ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED;
  const progressPercent = Math.min(100, Math.round((sampleCount / ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED) * 100));

  if (!user?.hasConsent) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center flex flex-col items-center gap-4">
        <AlertCircle className="w-12 h-12 text-amber-400" />
        <h2 className="text-2xl font-bold text-foreground">Informed Consent Required</h2>
        <p className="text-sm text-foreground-muted">
          Under our privacy-by-design policy, keystroke timing collection requires your explicit agreement before recording any sessions.
        </p>
        <Link to="/consent" className="mt-2">
          <Button variant="primary" size="md">
            Review &amp; Accept Consent Terms
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="cyan" glow>Enrolment Console</Badge>
            {isEnrolled ? (
              <Badge variant="match" glow>Profile Complete ({sampleCount} samples)</Badge>
            ) : (
              <Badge variant="review" glow>
                {sampleCount} / {ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED} Samples
              </Badge>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-cyan-300">
            Behavioural Profile Enrolment
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Record at least 10 sessions typing at your normal rhythm to construct a high-entropy biometric baseline.
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
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs animate-fadeIn backdrop-blur-md shadow-lg ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10"
              : "bg-red-500/10 border-red-500/40 text-red-300 shadow-red-500/10"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Progress Card */}
      <Card elevated className="p-5 flex flex-col gap-3.5 border-border/70 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500/40 via-cyan-500/40 to-emerald-500/40" />
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-foreground-muted flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            Overall Baseline Progress
          </span>
          <span className="font-mono text-cyan-300 font-bold tracking-wider">
            {sampleCount} of {ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED} required samples ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-3 bg-slate-900/90 rounded-full overflow-hidden border border-border-subtle p-0.5">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              isEnrolled
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.7)]"
                : "bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      {/* Typing Capture Component */}
      <Card elevated className="p-6 sm:p-8 flex flex-col gap-6 border-cyan-500/20 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Session Sample #{sampleCount + 1}
            </span>
            <h3 className="text-lg font-bold text-foreground mt-0.5">
              Type the prompt at your natural cadence
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPromptIndex((prev) => (prev + 1) % ENROLLMENT_PROMPTS.length)}
            className="text-xs text-foreground-muted hover:text-cyan-400"
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
      <Card elevated className="p-6 flex flex-col gap-4 border-border/80">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" /> Enrolled Timing Samples ({samplesData?.samples?.length || 0})
          </CardTitle>
          <span className="text-xs text-foreground-subtle hidden sm:inline">
            Numeric feature vectors stored securely without raw text
          </span>
        </div>

        {isSamplesLoading ? (
          <div className="py-8 text-center text-xs text-foreground-subtle">Loading samples...</div>
        ) : samplesData?.samples && samplesData.samples.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-foreground-muted font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3 font-semibold">Recorded</th>
                  <th className="py-2.5 px-3 font-semibold">Mean Hold</th>
                  <th className="py-2.5 px-3 font-semibold">Mean Flight</th>
                  <th className="py-2.5 px-3 font-semibold">Typing Speed</th>
                  <th className="py-2.5 px-3 font-semibold">Quality</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 font-mono">
                {samplesData.samples.map((s: any, idx: number) => (
                  <tr key={s.id} className="hover:bg-cyan-500/5 transition-colors">
                    <td className="py-3 px-3 text-foreground-muted">
                      #{samplesData.samples.length - idx} &bull; {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-3 text-amber-400 font-semibold">
                      {s.featureVector?.mean_hold} ms
                    </td>
                    <td className="py-3 px-3 text-cyan-400 font-semibold">
                      {s.featureVector?.mean_flight} ms
                    </td>
                    <td className="py-3 px-3 text-foreground">
                      {s.featureVector?.chars_per_second} chars/s
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
                        {s.qualityStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => deleteMutation.mutate(s.id)}
                        disabled={deleteMutation.isPending}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
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
          <div className="py-8 text-center text-xs text-foreground-muted">
            No enrolment samples recorded yet. Type the prompt above to add your first sample.
          </div>
        )}
      </Card>
    </div>
  );
}
