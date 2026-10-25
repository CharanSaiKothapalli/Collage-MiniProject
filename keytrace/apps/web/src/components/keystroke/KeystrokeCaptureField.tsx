import React, { useState, useRef, useCallback } from "react";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/Button.js";
import {
  KeystrokeObservation,
  KeystrokeSessionPayload,
  ENROLLMENT_THRESHOLDS,
  CURRENT_CONSENT_VERSION,
} from "@keytrace/shared";
import { ShieldCheck, AlertCircle, RefreshCw, Activity, Terminal, Clock, Hash, Zap } from "lucide-react";

interface KeystrokeCaptureFieldProps {
  onSessionComplete: (payload: KeystrokeSessionPayload) => Promise<void> | void;
  targetPromptText?: string;
  minObservations?: number;
  isSubmitting?: boolean;
  buttonLabel?: string;
  placeholder?: string;
}

export function KeystrokeCaptureField({
  onSessionComplete,
  targetPromptText = "The quick brown fox jumps over the lazy dog to verify behavioral biometric typing dynamics.",
  minObservations = ENROLLMENT_THRESHOLDS.MIN_OBSERVATIONS_PER_SAMPLE,
  isSubmitting = false,
  buttonLabel = "Submit Sample",
  placeholder = "Click here and type the prompt above at your natural cadence...",
}: KeystrokeCaptureFieldProps) {
  const [typedDisplay, setTypedDisplay] = useState("");
  const [observations, setObservations] = useState<KeystrokeObservation[]>([]);
  const [pasteWarning, setPasteWarning] = useState(false);
  const [, setSessionStartTime] = useState<number | null>(null);

  // Live telemetry metrics
  const [currentHoldMs, setCurrentHoldMs] = useState<number | null>(null);
  const [currentFlightMs, setCurrentFlightMs] = useState<number | null>(null);

  // Transient buffers
  const downTimes = useRef<Map<string, number>>(new Map());
  const lastDownTime = useRef<number | null>(null);
  const observationsRef = useRef<KeystrokeObservation[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  // Reset buffers
  const resetSession = useCallback(() => {
    downTimes.current.clear();
    lastDownTime.current = null;
    observationsRef.current = [];
    startTimeRef.current = null;
    sessionIdRef.current = crypto.randomUUID();
    setTypedDisplay("");
    setObservations([]);
    setPasteWarning(false);
    setSessionStartTime(null);
    setCurrentHoldMs(null);
    setCurrentFlightMs(null);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Ignore auto-repeat events caused by holding a key down
    if (e.repeat) return;

    // 2. Ignore non-timing modifier triggers if standalone
    if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;

    const now = performance.now();

    if (startTimeRef.current === null) {
      startTimeRef.current = now;
      setSessionStartTime(now);
    }

    // Flight time: interval between previous keydown and current keydown
    if (lastDownTime.current !== null) {
      const flight = Math.max(1, Math.min(now - lastDownTime.current, ENROLLMENT_THRESHOLDS.MAX_FLIGHT_MS));
      setCurrentFlightMs(Math.round(flight));
    }
    lastDownTime.current = now;

    // Store keydown timestamp indexed by hardware physical code
    downTimes.current.set(e.code, now);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;

    const now = performance.now();
    const start = downTimes.current.get(e.code);

    if (start !== undefined) {
      const hold = Math.max(1, Math.min(now - start, ENROLLMENT_THRESHOLDS.MAX_HOLD_MS));
      downTimes.current.delete(e.code);
      setCurrentHoldMs(Math.round(hold));

      // Calculate corresponding flight time or fallback
      const flight = currentFlightMs || 120;

      const newObs: KeystrokeObservation = {
        holdMs: Math.round(hold),
        flightMs: Math.round(flight),
      };

      observationsRef.current.push(newObs);
      setObservations([...observationsRef.current]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Prevent pasted text from counting as valid typing samples
    e.preventDefault();
    setPasteWarning(true);
    setTimeout(() => setPasteWarning(false), 4000);
  };

  const handleSubmit = async () => {
    if (observations.length < minObservations) return;

    const elapsedMs = startTimeRef.current !== null ? Math.round(performance.now() - startTimeRef.current) : 3000;

    const payload: KeystrokeSessionPayload = {
      schemaVersion: 1,
      sessionId: sessionIdRef.current,
      elapsedMs: Math.max(elapsedMs, ENROLLMENT_THRESHOLDS.MIN_ELAPSED_MS),
      observations: [...observations],
      inputMethod: "keyboard",
      consentVersion: CURRENT_CONSENT_VERSION,
    };

    try {
      await onSessionComplete(payload);
      resetSession();
    } catch {
      // Keep state so user can retry or reset
    }
  };

  const progressPercent = Math.min(100, Math.round((observations.length / minObservations) * 100));
  const isReady = observations.length >= minObservations;

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Target prompt guidance box */}
      <div className="bg-[#0b1120]/80 border border-slate-700/80 rounded-lg p-4 relative backdrop-blur-md shadow-sm">
        <div className="flex items-center justify-between mb-2.5 pb-2.5 border-b border-slate-800/80">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-amber-400" /> Reference Biometric Text
          </span>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold">
            Type naturally at your normal speed
          </span>
        </div>
        <p className="text-sm font-mono text-slate-100 leading-relaxed bg-slate-950/80 p-3.5 rounded-md border border-slate-800/80 select-none shadow-inner">
          {targetPromptText}
        </p>
      </div>

      {/* Paste warning banner */}
      {pasteWarning && (
        <div className="p-3.5 bg-rose-950/50 border border-rose-500/50 rounded-lg flex items-center gap-2 text-xs font-mono text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>[ALERT] Pasting is disallowed. Behavioural dynamics requires physical keystroke transitions.</span>
        </div>
      )}

      {/* Dedicated timing capture input */}
      <div className="relative">
        <textarea
          rows={3}
          value={typedDisplay}
          onChange={(e) => setTypedDisplay(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onPaste={handlePaste}
          placeholder={placeholder}
          className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 rounded-lg p-4 text-sm font-mono text-slate-100 placeholder:text-slate-500 outline-none transition-all resize-none shadow-inner"
        />

        {/* Live Keystroke Telemetry HUD Bar */}
        <div className="absolute right-3 bottom-3 flex items-center gap-3 bg-slate-900/95 px-3 py-1.5 rounded-md border border-cyan-500/40 text-xs font-mono text-slate-200 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.25)] pointer-events-none select-none">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 font-semibold">HOLD:</span>
            <span className={cn(currentHoldMs ? "text-amber-300 font-bold" : "text-slate-500")}>
              {currentHoldMs ? `${currentHoldMs}ms` : "—"}
            </span>
          </div>
          <div className="w-[1px] h-3.5 bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-semibold">FLIGHT:</span>
            <span className={cn(currentFlightMs ? "text-cyan-300 font-bold" : "text-slate-500")}>
              {currentFlightMs ? `${currentFlightMs}ms` : "—"}
            </span>
          </div>
          <div className="w-[1px] h-3.5 bg-slate-700" />
          <div className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400 font-semibold">OBS:</span>
            <span className="text-emerald-300 font-bold">{observations.length}</span>
          </div>
        </div>
      </div>

      {/* Sharp Progress Bar & Actions */}
      <div className="bg-[#0b101d]/80 border border-slate-800/80 rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md">
        <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-medium">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> Sample Observations
            </span>
            <span className="text-slate-200 font-bold">
              {observations.length} / {minObservations} min required
            </span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-200 rounded-full",
                isReady
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  : "bg-gradient-to-r from-amber-500 to-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetSession}
            disabled={observations.length === 0 || isSubmitting}
            className="text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Clear
          </Button>

          <Button
            type="button"
            variant={isReady ? "primary" : "secondary"}
            size="sm"
            onClick={handleSubmit}
            disabled={!isReady || isSubmitting}
            isLoading={isSubmitting}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> {buttonLabel}
          </Button>
        </div>
      </div>

      {/* Security Privacy Assurance */}
      <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] shrink-0 animate-pulse" />
        <span>
          [PRIVACY GUARANTEE] Typed characters are discarded locally. Only millisecond hold/flight durations are transmitted.
        </span>
      </div>
    </div>
  );
}
