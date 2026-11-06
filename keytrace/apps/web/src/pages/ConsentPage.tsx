import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../lib/api.js";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge } from "../components/ui/Badge.js";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Clock,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { CURRENT_CONSENT_VERSION } from "@keytrace/shared";

export function ConsentPage() {
  const { refreshUser, setConsent } = useAuth();
  const navigate = useNavigate();

  const [hasAgreed, setHasAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [consentDetails, setConsentDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchConsent = async () => {
    try {
      const res = await api.consent.getCurrent();
      setConsentDetails(res);
      setHasAgreed(res.hasConsent);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchConsent();
  }, []);

  const handleAccept = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await api.consent.accept(CURRENT_CONSENT_VERSION);
      setConsent(true);
      await refreshUser();
      setSuccessMsg("Consent recorded. Proceeding to enrollment...");
      setTimeout(() => navigate("/onboarding"), 1200);
    } catch (err: any) {
      setError(err.message || "Failed to record consent agreement.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!window.confirm("Are you sure you want to withdraw consent? Your typing profile will be disabled.")) {
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await api.consent.withdraw();
      setConsent(false);
      await refreshUser();
      await fetchConsent();
      setSuccessMsg("Consent has been successfully withdrawn. Keystroke collection is disabled.");
    } catch (err: any) {
      setError(err.message || "Failed to withdraw consent.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-6 flex flex-col gap-8">
      <div className="flex flex-col gap-2 pb-5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Badge variant="cyan">Policy v{CURRENT_CONSENT_VERSION}</Badge>
          {consentDetails?.hasConsent ? (
            <Badge variant="match">Consent Active</Badge>
          ) : (
            <Badge variant="review">Consent Required</Badge>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Informed Behavioral Biometrics Consent
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400">
          Please review the technical disclosures regarding how your keystroke timing observations are captured, processed, and safeguarded.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      <Card elevated className="flex flex-col gap-6 p-6 sm:p-8">
        {/* Core Principles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] hover:border-white/10 transition-colors flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <EyeOff className="w-4 h-4 text-indigo-400" /> 1. Zero Text Logging
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We never capture, log, or transmit typed characters, passwords, messages, or text content. The browser discards the text locally and records only millisecond intervals.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] hover:border-white/10 transition-colors flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Clock className="w-4 h-4 text-sky-400" /> 2. Timing Metrics Only
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Only two physical measurements are gathered: key-hold duration (press-to-release) and inter-key flight time (press-to-press).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] hover:border-white/10 transition-colors flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Sliders className="w-4 h-4 text-emerald-400" /> 3. Dedicated Input Only
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Keystrokes are captured exclusively while you actively interact with the designated typing input component. There are no global keyboard listeners or background monitors.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] hover:border-white/10 transition-colors flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Lock className="w-4 h-4 text-amber-400" /> 4. Full Control &amp; Deletion
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              You retain the right to withdraw consent, delete individual training samples, export your data in JSON format, or permanently purge your profile at any time.
            </p>
          </div>
        </div>

        {/* Limitations Disclosure */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/[0.08] flex flex-col gap-1.5 text-xs text-zinc-400">
          <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" /> Technical Limitations Notice
          </span>
          <p className="leading-relaxed">
            Browser event timestamps do not equal laboratory hardware instrumentation. Operating system scheduling, input methods, and virtual mobile keyboards introduce timing jitter.
            Keystroke similarity scores represent a probabilistic risk indicator and must not be interpreted as absolute biometric identification.
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-3 cursor-pointer text-xs select-none">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/30 accent-indigo-500 cursor-pointer"
            />
            <span className="text-zinc-300 font-medium">I explicitly consent to the collection of anonymized keystroke timing durations.</span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {consentDetails?.hasConsent && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleWithdraw}
                disabled={isLoading}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Withdraw Consent
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleAccept}
              disabled={!hasAgreed || isLoading}
              isLoading={isLoading}
            >
              <ShieldCheck className="w-4 h-4 mr-1 text-zinc-950" /> Accept Terms &amp; Continue
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
