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
  const { user, refreshUser, setConsent } = useAuth();
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
      setSuccessMsg("Consent recorded. Proceeding to enrolment...");
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
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="cyan" glow>Policy Version {CURRENT_CONSENT_VERSION}</Badge>
          {consentDetails?.hasConsent ? (
            <Badge variant="match" glow>Consent Active</Badge>
          ) : (
            <Badge variant="review" glow>Consent Required</Badge>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-cyan-300">
          Informed Behavioral Biometrics Consent
        </h1>
        <p className="text-sm text-foreground-muted">
          Please review the technical disclosures regarding how your keystroke timing observations are captured, processed, and safeguarded.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2 shadow-lg shadow-red-500/5 backdrop-blur-md">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 shadow-lg shadow-emerald-500/5 backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      <Card elevated className="flex flex-col gap-6 p-6 sm:p-8 border-border/80 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/40 via-amber-500/40 to-emerald-500/40" />
        
        {/* Core Principles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-surface/70 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors flex flex-col gap-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <EyeOff className="w-4 h-4 text-cyan-400" /> 1. Zero Text Logging
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              We never capture, log, or transmit typed characters, passwords, messages, or text content. The browser discards the text locally and records only millisecond intervals.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface/70 border border-sky-500/20 hover:border-sky-500/40 transition-colors flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <Clock className="w-4 h-4 text-sky-400" /> 2. Timing Metrics Only
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Only two physical measurements are gathered: key-hold duration (press-to-release) and inter-key flight time (press-to-press).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface/70 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <Sliders className="w-4 h-4 text-emerald-400" /> 3. Dedicated Input Only
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Keystrokes are captured exclusively while you actively interact with the designated typing input component. There are no global keyboard listeners or background monitors.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-surface/70 border border-amber-500/20 hover:border-amber-500/40 transition-colors flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Lock className="w-4 h-4 text-amber-400" /> 4. Full Control &amp; Deletion
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              You retain the right to withdraw consent, delete individual training samples, export your data in JSON format, or permanently purge your profile at any time.
            </p>
          </div>
        </div>

        {/* Limitations Disclosure */}
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/30 flex flex-col gap-2 text-xs text-amber-200/80">
          <span className="font-semibold text-amber-300 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" /> Technical Limitations Notice
          </span>
          <p className="leading-relaxed">
            Browser event timestamps do not equal laboratory hardware instrumentation. Operating system scheduling, input methods, and virtual mobile keyboards introduce timing jitter.
            Keystroke similarity scores represent a probabilistic risk indicator and must not be interpreted as absolute biometric identification.
          </p>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <label className="flex items-center gap-3 cursor-pointer text-xs text-foreground select-none">
            <input
              type="checkbox"
              checked={hasAgreed}
              onChange={(e) => setHasAgreed(e.target.checked)}
              className="w-4 h-4 rounded border-border bg-slate-900 text-amber-500 focus:ring-amber-500/40 accent-amber-500"
            />
            <span className="text-foreground-muted font-medium">I explicitly consent to the collection of anonymized keystroke timing durations.</span>
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
                <Trash2 className="w-3.5 h-3.5" /> Withdraw Consent
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
              <ShieldCheck className="w-4 h-4" /> Accept Terms &amp; Continue
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
