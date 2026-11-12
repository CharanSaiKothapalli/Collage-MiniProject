import React, { useState, useRef, useCallback, useMemo } from "react";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/Button.js";
import {
  KeystrokeObservation,
  KeystrokeSessionPayload,
  ENROLLMENT_THRESHOLDS,
  CURRENT_CONSENT_VERSION,
} from "@keytrace/shared";
import {
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Activity,
  Clock,
  Hash,
  Zap,
  Pause,
  Play,
  Sparkles,
  Gauge,
} from "lucide-react";

interface KeystrokeCaptureFieldProps {
  onSessionComplete: (payload: KeystrokeSessionPayload) => Promise<void> | void;
  mode?: "calibration" | "natural";
  targetPromptText?: string;
  minObservations?: number;
  isSubmitting?: boolean;
  buttonLabel?: string;
  placeholder?: string;
}

export function KeystrokeCaptureField({
  onSessionComplete,
  mode = "calibration",
  targetPromptText = "The quick brown fox jumps over the lazy dog to verify behavioral biometric typing dynamics.",
  minObservations,
  isSubmitting = false,
  buttonLabel,
  placeholder,
}: KeystrokeCaptureFieldProps) {
  // Determine effective minimum observations based on mode
  const effectiveMinObs =
    minObservations ??
    (mode === "natural"
      ? ENROLLMENT_THRESHOLDS.MIN_OBSERVATIONS_PER_NATURAL
      : ENROLLMENT_THRESHOLDS.MIN_OBSERVATIONS_PER_SAMPLE);

  const defaultPlaceholder =
    mode === "natural"
      ? "Type naturally about anything you like (e.g. your day, thoughts, hobbies, or recent work)... There is no predefined text. Don't worry about spelling."
      : "Click here and type the prompt above at your natural cadence...";

  const effectivePlaceholder = placeholder ?? defaultPlaceholder;
  const effectiveButtonLabel = buttonLabel ?? (mode === "natural" ? "Capture Natural Sample" : "Submit Sample");

  const [typedDisplay, setTypedDisplay] = useState("");
  const [observations, setObservations] = useState<KeystrokeObservation[]>([]);
  const [pasteWarning, setPasteWarning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Live telemetry metrics
  const [currentHoldMs, setCurrentHoldMs] = useState<number | null>(null);
  const [currentFlightMs, setCurrentFlightMs] = useState<number | null>(null);

  // Transient buffers
  const downTimes = useRef<Map<string, number>>(new Map());
  const lastDownTime = useRef<number | null>(null);
  const observationsRef = useRef<KeystrokeObservation[]>([]);
  const startTimeRef = useRef<number | null>(null);
  const pauseStartTimeRef = useRef<number | null>(null);
  const totalPausedDurationRef = useRef<number>(0);
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  // Reset buffers
  const resetSession = useCallback(() => {
    downTimes.current.clear();
    lastDownTime.current = null;
    observationsRef.current = [];
    startTimeRef.current = null;
    pauseStartTimeRef.current = null;
    totalPausedDurationRef.current = 0;
    sessionIdRef.current = crypto.randomUUID();
    setTypedDisplay("");
    setObservations([]);
    setPasteWarning(false);
    setIsPaused(false);
    setCurrentHoldMs(null);
    setCurrentFlightMs(null);
  }, []);

  // Toggle pause/resume
  const togglePause = useCallback(() => {
    if (isPaused) {
      // Resume
      if (pauseStartTimeRef.current !== null) {
        totalPausedDurationRef.current += performance.now() - pauseStartTimeRef.current;
        pauseStartTimeRef.current = null;
      }
      setIsPaused(false);
    } else {
      // Pause
      pauseStartTimeRef.current = performance.now();
      setIsPaused(true);
    }
  }, [isPaused]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isPaused) return;

    // 1. Ignore auto-repeat events caused by holding a key down
    if (e.repeat) return;

    // 2. Ignore non-timing modifier triggers if standalone
    if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;

    const now = performance.now();

    if (startTimeRef.current === null) {
      startTimeRef.current = now;
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
    if (isPaused) return;
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
    e.preventDefault();
    setPasteWarning(true);
    setTimeout(() => setPasteWarning(false), 4000);
  };

  const handleSubmit = async () => {
    if (observations.length < effectiveMinObs || isPaused) return;

    const now = performance.now();
    const rawElapsed = startTimeRef.current !== null ? now - startTimeRef.current : 3000;
    const netElapsedMs = Math.round(rawElapsed - totalPausedDurationRef.current);

    const payload: KeystrokeSessionPayload = {
      schemaVersion: 1,
      sessionId: sessionIdRef.current,
      sampleType: mode,
      elapsedMs: Math.max(netElapsedMs, ENROLLMENT_THRESHOLDS.MIN_ELAPSED_MS),
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

  // Derived live statistics
  const stats = useMemo(() => {
    if (observations.length === 0) {
      return { avgHold: null, avgFlight: null, cps: null };
    }
    const sumHold = observations.reduce((acc, curr) => acc + curr.holdMs, 0);
    const sumFlight = observations.reduce((acc, curr) => acc + curr.flightMs, 0);
    const avgHold = Math.round(sumHold / observations.length);
    const avgFlight = Math.round(sumFlight / observations.length);

    const rawElapsed = startTimeRef.current !== null ? performance.now() - startTimeRef.current : 0;
    const netElapsedSec = Math.max(1, (rawElapsed - totalPausedDurationRef.current) / 1000);
    const cps = Number((observations.length / netElapsedSec).toFixed(1));

    return { avgHold, avgFlight, cps };
  }, [observations, isPaused]);

  const progressPercent = Math.min(100, Math.round((observations.length / effectiveMinObs) * 100));
  const isReady = observations.length >= effectiveMinObs && !isPaused;

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Mode-specific guidance header */}
      {mode === "calibration" ? (
        <div className="bg-[#111B2E] border border-[#263B5E] rounded-2xl p-4.5 relative backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#263B5E]/60">
            <span className="text-xs font-semibold text-[#FF6A00] flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" /> Stage 1: Reference Biometric Phrase
            </span>
            <span className="text-[11px] text-[#94A3B8] font-medium">
              Calibrates baseline neuromuscular motor reflex
            </span>
          </div>
          <p className="text-sm font-sans text-[#F8FAFC] leading-relaxed bg-[#0B1220]/80 p-3.5 rounded-xl border border-[#263B5E]/50 select-none shadow-inner">
            {targetPromptText}
          </p>
        </div>
      ) : (
        <div className="bg-[#111B2E] border border-[#263B5E] rounded-2xl p-4.5 relative backdrop-blur-xl">
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#263B5E]/60">
            <div>
              <span className="text-xs font-bold text-[#FF6A00] flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#FF6A00]" /> NATURAL TYPING MODE
              </span>
              <p className="text-xs text-[#94A3B8] mt-0.5 font-medium">
                Build your behavioural identity through your natural typing rhythm.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/30">
              Stage 2: Free-Text
            </span>
          </div>
          <p className="text-xs font-sans text-[#94A3B8] leading-relaxed bg-[#0B1220]/80 p-3 rounded-xl border border-[#263B5E]/50">
            Type naturally about anything you like. You can write about your day, studies, hobbies, or interests. There is no predefined sentence. Don’t worry about spelling or speed.
          </p>
        </div>
      )}

      {/* Paste warning banner */}
      {pasteWarning && (
        <div className="p-3.5 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl flex items-center gap-2 text-xs text-[#EF4444]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>[ALERT] Pasting is disallowed. Behavioural dynamics requires physical keystroke transitions.</span>
        </div>
      )}

      {/* Dedicated timing capture input container */}
      <div className="relative">
        <textarea
          rows={mode === "natural" ? 5 : 3}
          value={typedDisplay}
          onChange={(e) => setTypedDisplay(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onPaste={handlePaste}
          disabled={isPaused}
          placeholder={isPaused ? "Capture paused. Click 'Resume' to continue typing." : effectivePlaceholder}
          className={cn(
            "w-full bg-[#0B1220] border rounded-2xl p-4 text-sm font-sans text-[#F8FAFC] placeholder:text-[#64748B] outline-none transition-all resize-none shadow-inner",
            isPaused
              ? "border-[#F59E0B]/40 opacity-70 cursor-not-allowed bg-[#0B1220]"
              : "border-[#263B5E] focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20"
          )}
        />

        {/* Paused Overlay Indicator */}
        {isPaused && (
          <div className="absolute inset-0 bg-[#0B1220]/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center gap-2 pointer-events-none">
            <div className="px-3 py-1.5 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-xs font-medium text-[#F59E0B] flex items-center gap-2">
              <Pause className="w-3.5 h-3.5" />
              <span>Capture Paused — Click Resume to continue your natural cadence</span>
            </div>
          </div>
        )}

        {/* Live Keystroke Telemetry HUD */}
        <div className="absolute right-3 bottom-3 flex items-center gap-2.5 bg-[#111B2E]/95 px-3 py-1.5 rounded-xl border border-[#263B5E] text-xs font-mono text-[#F8FAFC] backdrop-blur-xl shadow-md pointer-events-none select-none">
          {/* Animated Cadence Waveform */}
          <div className="hidden sm:flex items-end gap-1 h-4 px-1 border-r border-[#263B5E] pr-2.5">
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
                        ? "bg-[#FF6A00]"
                        : "bg-[#38BDF8]"
                      : "bg-[#263B5E]"
                  )}
                  style={{ height: `${heightPercent}%` }}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-[#94A3B8]">Hold:</span>
            <span className={cn(currentHoldMs ? "text-[#F8FAFC] font-semibold" : "text-[#64748B]")}>
              {currentHoldMs ? `${currentHoldMs}ms` : "—"}
            </span>
          </div>
          <div className="w-[1px] h-3.5 bg-[#263B5E]" />
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span className="text-[#94A3B8]">Flight:</span>
            <span className={cn(currentFlightMs ? "text-[#F8FAFC] font-semibold" : "text-[#64748B]")}>
              {currentFlightMs ? `${currentFlightMs}ms` : "—"}
            </span>
          </div>
          <div className="w-[1px] h-3.5 bg-[#263B5E]" />
          <div className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-[#94A3B8]">Obs:</span>
            <span className={cn("font-semibold", observations.length >= effectiveMinObs ? "text-[#22C55E]" : "text-[#FF6A00]")}>
              {observations.length}
            </span>
          </div>
        </div>
      </div>

      {/* Live Sample Progress & Natural Typing Metrics Card */}
      <div className="bg-[#111B2E] border border-[#263B5E] rounded-2xl p-4 flex flex-col gap-3.5 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="w-full sm:w-1/2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#F8FAFC] font-medium flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#FF6A00]" /> Keystroke Observations
              </span>
              <span className="text-[#94A3B8] font-mono text-[11px]">
                {observations.length} / {effectiveMinObs} min required ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#0B1220] rounded-full border border-[#263B5E]/60 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-200 rounded-full",
                  isReady
                    ? "bg-[#22C55E] shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                    : "bg-[#FF6A00]"
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Action buttons: Pause/Resume, Clear, Submit/Capture */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {observations.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={togglePause}
                disabled={isSubmitting}
                className={cn(
                  "text-xs px-2.5",
                  isPaused
                    ? "border-[#F59E0B]/50 text-[#F59E0B] hover:bg-[#F59E0B]/10"
                    : "border-[#263B5E] text-[#94A3B8] hover:text-[#F8FAFC]"
                )}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 mr-1 text-[#F59E0B]" /> Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                  </>
                )}
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetSession}
              disabled={observations.length === 0 || isSubmitting}
              className="text-[#94A3B8] hover:text-[#F8FAFC] text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Clear
            </Button>

            <Button
              type="button"
              variant={isReady ? "primary" : "secondary"}
              size="sm"
              onClick={handleSubmit}
              disabled={!isReady || isSubmitting}
              isLoading={isSubmitting}
              className="text-xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" /> {effectiveButtonLabel}
            </Button>
          </div>
        </div>

        {/* Live Aggregated Statistics Row */}
        {observations.length > 0 && (
          <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-[#263B5E]/60 text-xs font-mono">
            <div className="p-2 rounded-xl bg-[#0B1220]/60 border border-[#263B5E]/50 flex flex-col gap-0.5">
              <span className="text-[10px] text-[#94A3B8] uppercase">Mean Hold</span>
              <span className="text-xs font-semibold text-[#F8FAFC]">
                {stats.avgHold !== null ? `${stats.avgHold} ms` : "—"}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#0B1220]/60 border border-[#263B5E]/50 flex flex-col gap-0.5">
              <span className="text-[10px] text-[#94A3B8] uppercase">Mean Flight</span>
              <span className="text-xs font-semibold text-[#F8FAFC]">
                {stats.avgFlight !== null ? `${stats.avgFlight} ms` : "—"}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-[#0B1220]/60 border border-[#263B5E]/50 flex flex-col gap-0.5">
              <span className="text-[10px] text-[#94A3B8] uppercase">Cadence</span>
              <span className="text-xs font-semibold text-[#38BDF8]">
                {stats.cps !== null ? `${stats.cps} chars/s` : "—"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Security Privacy Assurance */}
      <div className="text-xs text-[#94A3B8] flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse shrink-0" />
        <span>
          Zero Keylogging: Typed characters are never logged or stored. Only millisecond timing intervals are processed.
        </span>
      </div>
    </div>
  );
}
