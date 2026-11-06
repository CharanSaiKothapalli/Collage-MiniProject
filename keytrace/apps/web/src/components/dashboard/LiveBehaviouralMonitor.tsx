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
  Lock,
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
  const [waveformWave, setWaveformWave] = useState<number[]>(
    Array(24).fill(12)
  );

  // Active session tracking for continuous live evaluation
  const sessionIdRef = useRef<string | null>(null);
  const downTimes = useRef<Map<string, number>>(new Map());
  const lastDownTime = useRef<number | null>(null);
  const sessionStartTime = useRef<number | null>(null);
  const eventsRef = useRef<KeystrokeEvent[]>([]);

  // Waveform animation loop
  useEffect(() => {
    let animId: number;
    let t = 0;
    const animate = () => {
      t += 0.08;
      const isTyping = eventsRef.current.length > 0;
      const baseAmp = isTyping ? 18 : 6;
      setWaveformWave((prev) =>
        prev.map((_, i) => {
          const wave1 = Math.sin(t + i * 0.35) * baseAmp;
          const wave2 = Math.cos(t * 0.7 + i * 0.2) * (baseAmp * 0.6);
          return Math.max(4, Math.min(36, 18 + wave1 + wave2));
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

      // If user is enrolled and we reached evaluation window (>= 20 keys), trigger real verification evaluation
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

      // Initialize session if not open yet
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
    } catch (err) {
      // Keep running gracefully without crashing UI
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

    // Calculate real behavioural deviation against user's baseline
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

      // Confidence inversely mapped to deviation
      const calculatedConf = Math.max(
        10,
        Math.min(99, Math.round(100 - compositeDelta * 45))
      );
      confidencePercent = calculatedConf;
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
      className="rounded-2xl bg-[#111927] border border-[#243247] p-6 lg:p-7 shadow-2xl relative overflow-hidden transition-all scroll-mt-20"
    >
      {/* Top Specular Line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#35D6E8]/30 to-transparent pointer-events-none" />

      {/* Monitor Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#243247]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#35D6E8] shrink-0">
            <Zap className="w-4 h-4 text-[#35D6E8]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#35D6E8] bg-[#35D6E8]/10 border border-[#35D6E8]/20 px-2 py-0.5 rounded-full">
                TELEMETRY ENGINE ACTIVE
              </span>
              <span className="text-xs text-[#94A3B8] font-mono">
                {isEnrolled
                  ? `Baseline: ${sampleCount} enrolled samples`
                  : `Enrolling: ${sampleCount}/10`}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#F4F7FC] tracking-tight">
              Live Behavioural Monitoring
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Continuous physical keystroke dynamic capture, rhythm telemetry,
              and live deviation tracking.
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
              Evaluate Window
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
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Interactive Typing Sandbox Area */}
      <div className="mt-5 relative">
        <textarea
          rows={3}
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder="Click here and type continuously to test live behavioral biometric telemetry in real-time..."
          className="w-full bg-[#0D1320] border border-[#243247] focus:border-[#35D6E8] focus:ring-1 focus:ring-[#35D6E8]/30 rounded-xl p-4 text-xs font-mono text-[#F4F7FC] placeholder-[#94A3B8]/50 outline-none transition-all resize-none shadow-inner"
        />

        {/* Floating Live Telemetry HUD Bar */}
        <div className="absolute right-3 bottom-3 flex items-center gap-3 bg-[#111927]/95 px-3 py-1.5 rounded-lg border border-[#243247] text-xs font-mono backdrop-blur-md select-none pointer-events-none">
          {/* Real-time Oscillating Waveform */}
          <div className="flex items-end gap-0.5 h-4 px-1 border-r border-[#243247] pr-2.5">
            {waveformWave.slice(0, 12).map((val, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-100 ${
                  events.length > 0
                    ? idx % 2 === 0
                      ? "bg-[#35D6E8]"
                      : "bg-[#8B7CFF]"
                    : "bg-[#243247]"
                }`}
                style={{ height: `${(val / 36) * 100}%` }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[#94A3B8]">
            <Clock className="w-3 h-3 text-[#35D6E8]" />
            <span className="text-[11px]">Hold:</span>
            <span className="text-[#F4F7FC] font-semibold text-[11px]">
              {currentHold !== null ? `${currentHold}ms` : "—"}
            </span>
          </div>

          <div className="w-[1px] h-3 bg-[#243247]" />

          <div className="flex items-center gap-1.5 text-[#94A3B8]">
            <Zap className="w-3 h-3 text-[#8B7CFF]" />
            <span className="text-[11px]">Flight:</span>
            <span className="text-[#F4F7FC] font-semibold text-[11px]">
              {currentFlight !== null ? `${currentFlight}ms` : "—"}
            </span>
          </div>

          <div className="w-[1px] h-3 bg-[#243247]" />

          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-[#94A3B8]">Keys:</span>
            <span className="text-[#32D6A0] font-bold">{events.length}</span>
          </div>
        </div>
      </div>

      {/* 6 Real-Time Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5">
        {/* Metric 1: Typing Cadence */}
        <div className="p-3.5 rounded-xl bg-[#0D1320] border border-[#243247] flex flex-col justify-between">
          <span className="text-[10px] text-[#94A3B8] uppercase font-mono tracking-wider">
            Typing Cadence
          </span>
          <div className="mt-1.5">
            <span className="text-lg font-bold text-[#F4F7FC]">
              {telemetry.cadenceWpm !== null ? `${telemetry.cadenceWpm} WPM` : "N/A"}
            </span>
            <span className="text-[10px] text-[#94A3B8] block mt-0.5">
              {telemetry.kps !== null ? `${telemetry.kps} keys/sec` : "Standby"}
            </span>
          </div>
        </div>

        {/* Metric 2: Mean Key Hold Duration */}
        <div className="p-3.5 rounded-xl bg-[#0D1320] border border-[#243247] flex flex-col justify-between">
          <span className="text-[10px] text-[#94A3B8] uppercase font-mono tracking-wider">
            Mean Key Hold
          </span>
          <div className="mt-1.5">
            <span className="text-lg font-bold text-[#35D6E8]">
              {telemetry.meanHold !== null ? `${telemetry.meanHold} ms` : "N/A"}
            </span>
            <span className="text-[10px] text-[#94A3B8] block mt-0.5">
              Target: {baselineProfile?.avgHoldMs ? `${baselineProfile.avgHoldMs}ms` : "Calibrating"}
            </span>
          </div>
        </div>

        {/* Metric 3: Mean Flight Duration */}
        <div className="p-3.5 rounded-xl bg-[#0D1320] border border-[#243247] flex flex-col justify-between">
          <span className="text-[10px] text-[#94A3B8] uppercase font-mono tracking-wider">
            Mean Flight Time
          </span>
          <div className="mt-1.5">
            <span className="text-lg font-bold text-[#8B7CFF]">
              {telemetry.meanFlight !== null ? `${telemetry.meanFlight} ms` : "N/A"}
            </span>
            <span className="text-[10px] text-[#94A3B8] block mt-0.5">
              Target: {baselineProfile?.avgFlightMs ? `${baselineProfile.avgFlightMs}ms` : "Calibrating"}
            </span>
          </div>
        </div>

        {/* Metric 4: Keystrokes Per Second */}
        <div className="p-3.5 rounded-xl bg-[#0D1320] border border-[#243247] flex flex-col justify-between">
          <span className="text-[10px] text-[#94A3B8] uppercase font-mono tracking-wider">
            Keystrokes / Sec
          </span>
          <div className="mt-1.5">
            <span className="text-lg font-bold text-[#F4F7FC]">
              {telemetry.kps !== null ? `${telemetry.kps} KPS` : "N/A"}
            </span>
            <span className="text-[10px] text-[#94A3B8] block mt-0.5">
              Physical frequency
            </span>
          </div>
        </div>

        {/* Metric 5: Behavioural Deviation */}
        <div className="p-3.5 rounded-xl bg-[#0D1320] border border-[#243247] flex flex-col justify-between">
          <span className="text-[10px] text-[#94A3B8] uppercase font-mono tracking-wider">
            Deviation (D_M)
          </span>
          <div className="mt-1.5">
            <span
              className={`text-lg font-bold font-mono ${
                telemetry.deviation === null
                  ? "text-[#94A3B8]"
                  : telemetry.deviation <= 2.8
                  ? "text-[#32D6A0]"
                  : telemetry.deviation <= 4.0
                  ? "text-[#FFBF55]"
                  : "text-[#FF647C]"
              }`}
            >
              {telemetry.deviation !== null ? telemetry.deviation.toFixed(2) : "N/A"}
            </span>
            <span className="text-[10px] text-[#94A3B8] block mt-0.5 font-mono">
              Threshold τ: 2.80
            </span>
          </div>
        </div>

        {/* Metric 6: Verification Confidence */}
        <div className="p-3.5 rounded-xl bg-[#0D1320] border border-[#243247] flex flex-col justify-between">
          <span className="text-[10px] text-[#94A3B8] uppercase font-mono tracking-wider">
            Confidence
          </span>
          <div className="mt-1.5">
            <span className="text-lg font-bold text-[#32D6A0]">
              {telemetry.confidencePercent !== null
                ? `${telemetry.confidencePercent}%`
                : "N/A"}
            </span>
            <span className="text-[10px] text-[#94A3B8] block mt-0.5">
              {isEnrolled ? "Baseline active" : "Enrollment required"}
            </span>
          </div>
        </div>
      </div>

      {/* Live Status and Evaluation Banner */}
      <div className="mt-4 p-3.5 rounded-xl bg-[#0D1320]/80 border border-[#243247] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#94A3B8]">Authentication Status:</span>
            {authStatus === "MATCH" ? (
              <Badge variant="match">AUTHENTICATED • PATTERN MATCH</Badge>
            ) : authStatus === "REVIEW" ? (
              <Badge variant="review">ANOMALOUS • NEEDS REVIEW</Badge>
            ) : authStatus === "EVALUATING" ? (
              <Badge variant="cyan">EVALUATING RHYTHM...</Badge>
            ) : authStatus === "CAPTURING" ? (
              <Badge variant="neutral">STREAMING TELEMETRY ({events.length} KEYS)</Badge>
            ) : (
              <Badge variant="neutral">STANDBY • AWAITING INPUT</Badge>
            )}
          </div>
        </div>

        {backendScore !== null && (
          <div className="flex items-center gap-3 font-mono text-[11px] text-[#94A3B8]">
            <span>
              Mahalanobis Distance:{" "}
              <strong className="text-[#F4F7FC]">
                {backendScore.toFixed(2)}
              </strong>
            </span>
            <span>
              Decision:{" "}
              <strong
                className={
                  backendDecision === "MATCH"
                    ? "text-[#32D6A0]"
                    : "text-[#FFBF55]"
                }
              >
                {backendDecision}
              </strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
