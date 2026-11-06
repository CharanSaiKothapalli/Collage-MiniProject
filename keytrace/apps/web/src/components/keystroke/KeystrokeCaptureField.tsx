import React, { useState, useRef, useCallback } from "react";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/Button.js";
import {
  KeystrokeObservation,
  KeystrokeSessionPayload,
  ENROLLMENT_THRESHOLDS,
  CURRENT_CONSENT_VERSION,
} from "@keytrace/shared";
import { ShieldCheck, AlertCircle, RefreshCw, Activity, Clock, Hash, Zap } from "lucide-react";

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
      <div className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl p-4.5 relative backdrop-blur-xl">
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/[0.06]">
          <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
            Reference Biometric Phrase
          </span>
          <span className="text-[11px] text-zinc-500 font-medium">
            Type naturally at your normal speed
          </span>
        </div>
        <p className="text-sm font-sans text-zinc-100 leading-relaxed bg-zinc-950/70 p-3.5 rounded-xl border border-white/[0.06] select-none shadow-inner">
          {targetPromptText}
        </p>
      </div>

      {/* Paste warning banner */}
      {pasteWarning && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-300">
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
          className="w-full bg-zinc-900/30 border border-white/10 focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 rounded-2xl p-4 text-sm font-sans text-zinc-100 placeholder:text-zinc-500 outline-none transition-all resize-none shadow-inner"
        />

        {/* Live Keystroke Telemetry HUD */}
        <div className="absolute right-3 bottom-3 flex items-center gap-3 bg-zinc-950/90 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono text-zinc-300 backdrop-blur-xl shadow-sm pointer-events-none select-none">
          {/* Animated Cadence Waveform */}
          <div className="hidden sm:flex items-end gap-1 h-4 px-1 border-r border-zinc-800 pr-2.5">
            {(observations.length > 0 ? observations.slice(-8) : [1, 2, 3, 4, 5, 6, 7, 8]).map((item, idx) => {
              const heightPercent =
                typeof item === "number"
                  ? 25 + (idx % 3) * 15
                  : Math.min(100, Math.max(20, Math.round((item.holdMs / 180) * 100)));
              return (
                <div
                  key={idx}
                  className={cn(
                    "w-1 rounded-full transition-all duration-150",
                    observations.length > 0
                      ? idx % 2 === 0
                        ? "bg-indigo-400"
                        : "bg-sky-400"
                      : "bg-zinc-800"
                  )}
                  style={{ height: `${heightPercent}%` }}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-500">Hold:</span>
            <span className={cn(currentHoldMs ? "text-zinc-100 font-semibold" : "text-zinc-600")}>
              {currentHoldMs ? `${currentHoldMs}ms` : "—"}
            </span>
          </div>
          <div className="w-[1px] h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-500">Flight:</span>
            <span className={cn(currentFlightMs ? "text-zinc-100 font-semibold" : "text-zinc-600")}>
              {currentFlightMs ? `${currentFlightMs}ms` : "—"}
            </span>
          </div>
          <div className="w-[1px] h-3.5 bg-zinc-800" />
          <div className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-500">Obs:</span>
            <span className="text-emerald-400 font-semibold">{observations.length}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Actions */}
      <div className="bg-zinc-900/40 border border-white/[0.08] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-xl">
        <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-300 font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" /> Sample Observations
            </span>
            <span className="text-zinc-400 font-mono text-[11px]">
              {observations.length} / {minObservations} min required
            </span>
          </div>
          <div className="w-full h-1.5 bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-200 rounded-full",
                isReady
                  ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                  : "bg-indigo-500"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetSession}
            disabled={observations.length === 0 || isSubmitting}
            className="text-zinc-400 hover:text-white"
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
      <div className="text-xs text-zinc-500 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span>
          Zero Keylogging: Typed characters are never logged or transmitted. Only millisecond timing intervals are processed.
        </span>
      </div>
    </div>
  );
}
