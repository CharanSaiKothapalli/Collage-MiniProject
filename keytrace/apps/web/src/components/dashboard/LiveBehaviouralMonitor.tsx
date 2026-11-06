import React, { useState, useRef, useEffect, useCallback } from "react";
import { Badge, DecisionBadge } from "../ui/Badge.js";
import { Button } from "../ui/Button.js";
import {
  Zap,
  Activity,
  Clock,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api } from "../../lib/api.js";
import { KeystrokeSessionPayload } from "@keytrace/shared";

interface LiveBehaviouralMonitorProps {
  baselineProfile?: {
    avgHoldMs?: number;
    avgFlightMs?: number;
    avgCharsPerSecond?: number;
  };
  isEnrolled: boolean;
  sampleCount: number;
}

interface KeystrokeEvent {
  key: string;
  code: string;
  pressTime: number;
  releaseTime: number;
  holdTimeMs: number;
  flightTimeMs: number;
}

export function LiveBehaviouralMonitor({
  baselineProfile,
  isEnrolled,
  sampleCount,
}: LiveBehaviouralMonitorProps) {
  const [typedText, setTypedText] = useState("");
  const [events, setEvents] = useState<KeystrokeEvent[]>([]);
  const [currentHold, setCurrentHold] = useState<number | null>(null);
  const [currentFlight, setCurrentFlight] = useState<number | null>(null);
  const [authStatus, setAuthStatus] = useState<
    "STANDBY" | "CAPTURING" | "EVALUATING" | "MATCH" | "REVIEW" | "INSUFFICIENT"
  >("STANDBY");
  const [backendDecision, setBackendDecision] = useState<string | null>(null);
  const [backendScore, setBackendScore] = useState<number | null>(null);
  const [backendThreshold, setBackendThreshold] = useState<number | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [waveformWave, setWaveformWave] = useState<number[]>(Array(20).fill(10));

  // Active session tracking for continuous live evaluation
  const sessionIdRef = useRef<string | null>(null);
  const downTimes = useRef<Map<string, number>>(new Map());
  const lastDownTime = useRef<number | null>(null);
  const sessionStartTime = useRef<number | null>(null);
  const eventsRef = useRef<KeystrokeEvent[]>([]);

  // Smooth waveform animation loop
  useEffect(() => {
    let animId: number;
    let t = 0;
    const animate = () => {
      t += 0.08;
      const isTyping = eventsRef.current.length > 0;
      const baseAmp = isTyping ? 16 : 5;
      setWaveformWave((prev) =>
        prev.map((_, i) => {
          const wave1 = Math.sin(t + i * 0.35) * baseAmp;
          const wave2 = Math.cos(t * 0.7 + i * 0.2) * (baseAmp * 0.5);
          return Math.max(3, Math.min(32, 16 + wave1 + wave2));
        })
      );
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, []);

  const resetTelemetry = useCallback(() => {
    downTimes.current.clear();
    lastDownTime.current = null;
    sessionStartTime.current = null;
    eventsRef.current = [];
    sessionIdRef.current = null;
    setTypedText("");
    setEvents([]);
    setCurrentHold(null);
    setCurrentFlight(null);
    setAuthStatus("STANDBY");
    setBackendDecision(null);
    setBackendScore(null);
    setBackendThreshold(null);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.repeat) return;
    if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;

    const now = performance.now();
    if (sessionStartTime.current === null) {
      sessionStartTime.current = now;
      setAuthStatus("CAPTURING");
    }

    if (lastDownTime.current !== null) {
      const flight = Math.max(1, Math.min(now - lastDownTime.current, 2000));
      setCurrentFlight(Math.round(flight));
    }
    lastDownTime.current = now;
    downTimes.current.set(e.code, now);
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;

    const now = performance.now();
    const pressTime = downTimes.current.get(e.code);

    if (pressTime !== undefined) {
      const holdTimeMs = Math.round(Math.max(1, Math.min(now - pressTime, 1500)));
      downTimes.current.delete(e.code);
      setCurrentHold(holdTimeMs);

      const flightTimeMs = currentFlight ?? 120;
      const ev: KeystrokeEvent = {
        key: e.key,
        code: e.code,
        pressTime,
        releaseTime: now,
        holdTimeMs,
        flightTimeMs,
      };

      eventsRef.current.push(ev);
      setEvents([...eventsRef.current]);

      // If user is enrolled and we reached evaluation window (>= 25 keys), trigger real verification evaluation
      if (isEnrolled && eventsRef.current.length >= 25 && !isVerifying) {
        triggerBackendWindowEvaluation();
      }
    }
  };

  const triggerBackendWindowEvaluation = async () => {
    if (!isEnrolled || eventsRef.current.length < 10) return;
    try {
      setIsVerifying(true);
      setAuthStatus("EVALUATING");

      if (!sessionIdRef.current) {
        const sessionRes = await api.verification.startSession({
          userAgent: navigator.userAgent,
          source: "live-monitor",
        });
        sessionIdRef.current = sessionRes.sessionId;
      }

      const payload: KeystrokeSessionPayload = {
        schemaVersion: 1,
        sessionId: sessionIdRef.current,
        elapsedMs: sessionStartTime.current
          ? Math.max(1000, Math.round(performance.now() - sessionStartTime.current))
          : 5000,
        observations: eventsRef.current.map((ev) => ({
          holdMs: ev.holdTimeMs,
          flightMs: ev.flightTimeMs,
        })),
        inputMethod: "keyboard",
        consentVersion: "1.0",
      };

      const res = await api.verification.evaluateWindow(
        sessionIdRef.current,
        payload
      );

      setBackendDecision(res.decision);
      setBackendScore(res.score);
      setBackendThreshold(res.threshold);

      if (res.decision === "MATCH") {
        setAuthStatus("MATCH");
      } else if (res.decision === "REVIEW") {
        setAuthStatus("REVIEW");
      } else {
        setAuthStatus("INSUFFICIENT");
      }
    } catch {
      setAuthStatus("CAPTURING");
    } finally {
      setIsVerifying(false);
    }
  };

  // Real live telemetry calculations
  const calculateTelemetry = () => {
    if (events.length === 0) {
      return {
        meanHold: null,
        meanFlight: null,
        kps: null,
        cadenceWpm: null,
        deviation: null,
        confidencePercent: null,
      };
    }

    const totalHold = events.reduce((sum, ev) => sum + ev.holdTimeMs, 0);
    const meanHold = Math.round(totalHold / events.length);

    const totalFlight = events.reduce((sum, ev) => sum + ev.flightTimeMs, 0);
    const meanFlight = Math.round(totalFlight / events.length);

    const elapsedSec = sessionStartTime.current
      ? Math.max(0.5, (performance.now() - sessionStartTime.current) / 1000)
      : 1;
    const kps = Number((events.length / elapsedSec).toFixed(1));
    const cadenceWpm = Math.round((events.length / 5) / (elapsedSec / 60));

    let deviation: number | null = null;
    let confidencePercent: number | null = null;

    if (baselineProfile?.avgHoldMs && baselineProfile?.avgFlightMs) {
      const holdDiffRatio =
        Math.abs(meanHold - baselineProfile.avgHoldMs) /
        baselineProfile.avgHoldMs;
      const flightDiffRatio =
        Math.abs(meanFlight - baselineProfile.avgFlightMs) /
        baselineProfile.avgFlightMs;
      const compositeDelta = (holdDiffRatio + flightDiffRatio) / 2;
      deviation = Number((compositeDelta * 2.8).toFixed(2));

      confidencePercent = Math.max(
        10,
        Math.min(99, Math.round(100 - compositeDelta * 45))
      );
    } else if (backendScore !== null && backendThreshold !== null) {
      deviation = Number(backendScore.toFixed(2));
      const ratio = backendScore / backendThreshold;
      confidencePercent = Math.max(
        15,
        Math.min(98, Math.round((1 - Math.min(1, ratio * 0.45)) * 100))
      );
    }

    return {
      meanHold,
      meanFlight,
      kps,
      cadenceWpm,
      deviation,
      confidencePercent,
    };
  };

  const telemetry = calculateTelemetry();

  return (
    <div
      id="live-monitor"
      className="rounded-2xl bg-[#111927] border border-[#243247] p-5 sm:p-6 shadow-xl relative overflow-hidden transition-all scroll-mt-20"
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#243247]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#35D6E8] shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#F4F7FC]">
              Live Typing Sandbox
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Type below to observe your physical typing cadence and test continuous rhythm matching.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {events.length >= 10 && isEnrolled && (
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={triggerBackendWindowEvaluation}
              isLoading={isVerifying}
              disabled={isVerifying}
              className="text-[#35D6E8] border-[#35D6E8]/30 hover:bg-[#35D6E8]/10"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Evaluate Now
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={resetTelemetry}
            disabled={events.length === 0}
            className="text-[#94A3B8] hover:text-[#F4F7FC]"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {/* Typing Input */}
      <div className="mt-4 relative">
        <textarea
          rows={3}
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder="Click here and type naturally (e.g. 'Security begins with unique typing cadence')..."
          className="w-full bg-[#0D1320] border border-[#243247] focus:border-[#35D6E8] focus:ring-1 focus:ring-[#35D6E8]/30 rounded-xl p-3.5 text-xs text-[#F4F7FC] placeholder-[#94A3B8]/40 outline-none transition-all resize-none shadow-inner"
        />

        {/* Floating Mini HUD */}
        <div className="absolute right-3 bottom-3 flex items-center gap-2.5 bg-[#111927]/95 px-2.5 py-1 rounded-lg border border-[#243247] text-[11px] font-mono backdrop-blur-md select-none pointer-events-none">
          {/* Animated Waveform */}
          <div className="flex items-end gap-0.5 h-3.5 px-0.5 border-r border-[#243247] pr-2">
            {waveformWave.slice(0, 10).map((val, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-100 ${
                  events.length > 0 ? (idx % 2 === 0 ? "bg-[#35D6E8]" : "bg-[#8B7CFF]") : "bg-[#243247]"
                }`}
                style={{ height: `${(val / 32) * 100}%` }}
              />
            ))}
          </div>

          <span className="text-[#94A3B8]">
            Keys: <strong className="text-[#32D6A0]">{events.length}</strong>
          </span>
        </div>
      </div>

      {/* 3 Simple, Clear Primary Meters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
        {/* Speed */}
        <div className="p-3 rounded-xl bg-[#0D1320] border border-[#243247] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#94A3B8] block">Typing Speed</span>
            <span className="text-base font-bold text-[#F4F7FC]">
              {telemetry.cadenceWpm !== null ? `${telemetry.cadenceWpm} WPM` : "—"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#94A3B8] font-mono">
              {telemetry.kps !== null ? `${telemetry.kps} keys/sec` : "Standby"}
            </span>
          </div>
        </div>

        {/* Key Press Hold */}
        <div className="p-3 rounded-xl bg-[#0D1320] border border-[#243247] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#94A3B8] block">Key Press Hold</span>
            <span className="text-base font-bold text-[#35D6E8]">
              {telemetry.meanHold !== null ? `${telemetry.meanHold} ms` : "—"}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#94A3B8] font-mono">
              {baselineProfile?.avgHoldMs ? `Target ~${baselineProfile.avgHoldMs}ms` : "Calibrating"}
            </span>
          </div>
        </div>

        {/* Verification Status */}
        <div className="p-3 rounded-xl bg-[#0D1320] border border-[#243247] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-[#94A3B8] block">Rhythm Match</span>
            <div className="mt-0.5">
              {authStatus === "MATCH" ? (
                <Badge variant="match">MATCH • GENUINE</Badge>
              ) : authStatus === "REVIEW" ? (
                <Badge variant="review">NEEDS REVIEW</Badge>
              ) : authStatus === "EVALUATING" ? (
                <Badge variant="cyan">EVALUATING...</Badge>
              ) : authStatus === "CAPTURING" ? (
                <Badge variant="neutral">TYPING...</Badge>
              ) : (
                <Badge variant="neutral">STANDBY</Badge>
              )}
            </div>
          </div>
          {telemetry.confidencePercent !== null && (
            <span className="text-sm font-bold text-[#32D6A0] font-mono">
              {telemetry.confidencePercent}%
            </span>
          )}
        </div>
      </div>

      {/* Advanced Diagnostics Toggle */}
      <div className="mt-3 pt-3 border-t border-[#243247]/60 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between text-xs text-[#94A3B8] hover:text-[#F4F7FC] transition-colors py-1 cursor-pointer"
        >
          <span className="font-mono text-[11px] flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#35D6E8]" />
            {showAdvanced ? "Hide Technical Diagnostics" : "View Technical Diagnostics (Flight Time, Deviation & Scores)"}
          </span>
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 animate-in fade-in duration-150">
            <div className="p-2.5 rounded-lg bg-[#0D1320]/80 border border-[#243247]">
              <span className="text-[10px] text-[#94A3B8] block uppercase font-mono">Flight Transition</span>
              <span className="text-xs font-bold text-[#8B7CFF] font-mono mt-0.5 block">
                {telemetry.meanFlight !== null ? `${telemetry.meanFlight} ms` : "N/A"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0D1320]/80 border border-[#243247]">
              <span className="text-[10px] text-[#94A3B8] block uppercase font-mono">Deviation (D_M)</span>
              <span className="text-xs font-bold text-[#F4F7FC] font-mono mt-0.5 block">
                {telemetry.deviation !== null ? telemetry.deviation.toFixed(2) : "N/A"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0D1320]/80 border border-[#243247]">
              <span className="text-[10px] text-[#94A3B8] block uppercase font-mono">Threshold (τ)</span>
              <span className="text-xs font-bold text-[#35D6E8] font-mono mt-0.5 block">
                {backendThreshold ?? 2.80}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0D1320]/80 border border-[#243247]">
              <span className="text-[10px] text-[#94A3B8] block uppercase font-mono">Algorithm</span>
              <span className="text-xs font-bold text-[#32D6A0] font-mono mt-0.5 block">
                Robust MAD
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
