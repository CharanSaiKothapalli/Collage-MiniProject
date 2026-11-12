import React, { useState, useRef, useCallback } from "react";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/Button.js";
import { Badge } from "../ui/Badge.js";
import {
  Clock,
  Zap,
  Hash,
  RefreshCw,
  Layers,
  Sparkles,
} from "lucide-react";

interface PlayKeystroke {
  code: string;
  holdMs: number;
  flightMs: number;
}

export function LiveKeystrokePlayground() {
  const [typedText, setTypedText] = useState("");
  const [observations, setObservations] = useState<PlayKeystroke[]>([]);
  const [currentHold, setCurrentHold] = useState<number | null>(null);
  const [currentFlight, setCurrentFlight] = useState<number | null>(null);

  // Transient timing
  const downTimes = useRef<Map<string, number>>(new Map());
  const lastDownTime = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const obsRef = useRef<PlayKeystroke[]>([]);

  const resetPlayground = useCallback(() => {
    downTimes.current.clear();
    lastDownTime.current = null;
    startTime.current = null;
    obsRef.current = [];
    setTypedText("");
    setObservations([]);
    setCurrentHold(null);
    setCurrentFlight(null);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.repeat) return;
    if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(e.key)) return;

    const now = performance.now();
    if (startTime.current === null) {
      startTime.current = now;
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
    const start = downTimes.current.get(e.code);

    if (start !== undefined) {
      const hold = Math.max(1, Math.min(now - start, 1500));
      downTimes.current.delete(e.code);
      setCurrentHold(Math.round(hold));

      const flight = currentFlight || 120;
      const newObs: PlayKeystroke = {
        code: e.code,
        holdMs: Math.round(hold),
        flightMs: Math.round(flight),
      };

      obsRef.current.push(newObs);
      setObservations([...obsRef.current]);
    }
  };

  // Compute live 10-D feature metrics on the fly
  const computeMetrics = () => {
    if (observations.length === 0) {
      return {
        meanHold: 0,
        medianHold: 0,
        stdHold: 0,
        meanFlight: 0,
        medianFlight: 0,
        stdFlight: 0,
        p90Flight: 0,
        charsPerSec: 0,
        pauseRatio: 0,
        holdFlightRatio: 0,
      };
    }

    const holds = observations.map((o) => o.holdMs).sort((a, b) => a - b);
    const flights = observations.map((o) => o.flightMs).sort((a, b) => a - b);

    const mean = (arr: number[]) => arr.reduce((acc, val) => acc + val, 0) / arr.length;
    const median = (arr: number[]) => {
      const mid = Math.floor(arr.length / 2);
      return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    };
    const stdDev = (arr: number[], m: number) => {
      if (arr.length < 2) return 0;
      const variance = arr.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / (arr.length - 1);
      return Math.sqrt(variance);
    };

    const meanH = mean(holds);
    const medianH = median(holds);
    const stdH = stdDev(holds, meanH);

    const meanF = mean(flights);
    const medianF = median(flights);
    const stdF = stdDev(flights, meanF);

    const p90Idx = Math.min(flights.length - 1, Math.floor(flights.length * 0.9));
    const p90F = flights[p90Idx];

    const elapsedSec = startTime.current !== null ? Math.max(0.5, (performance.now() - startTime.current) / 1000) : 1;
    const cps = Number((observations.length / elapsedSec).toFixed(1));

    const pauses = flights.filter((f) => f > 250).length;
    const pauseR = Number((pauses / Math.max(1, flights.length)).toFixed(2));
    const hfR = Number((meanH / Math.max(1, meanF)).toFixed(2));

    return {
      meanHold: Math.round(meanH),
      medianHold: Math.round(medianH),
      stdHold: Math.round(stdH),
      meanFlight: Math.round(meanF),
      medianFlight: Math.round(medianF),
      stdFlight: Math.round(stdF),
      p90Flight: Math.round(p90F),
      charsPerSec: cps,
      pauseRatio: pauseR,
      holdFlightRatio: hfR,
    };
  };

  const metrics = computeMetrics();

  return (
    <div className="w-full max-w-4xl mx-auto rounded-2xl bg-[#111B2E] border border-[#263B5E] p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
      {/* Top Specular Glow */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#38BDF8]/40 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#263B5E]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
            <Badge variant="blue">Live Playground</Badge>
            <span className="text-xs text-[#64748B] hidden sm:inline">
              Zero Keylogging • Computed Client-Side
            </span>
          </div>
          <h3 className="text-xl font-semibold text-[#F8FAFC] tracking-tight">
            Interactive Cadence Sandbox
          </h3>
          <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
            Type anything below at your natural rhythm to observe real-time millisecond timing and 10D feature extraction.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="xs"
          onClick={resetPlayground}
          disabled={observations.length === 0}
          className="self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Reset
        </Button>
      </div>

      {/* Interactive Typing Zone */}
      <div className="mt-5 relative">
        <textarea
          rows={3}
          value={typedText}
          onChange={(e) => setTypedText(e.target.value)}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          placeholder="Click here and type anything (e.g. 'Security begins with continuous behavioral typing rhythm')..."
          className="w-full bg-[#0B1220] border border-[#263B5E] focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]/30 rounded-xl p-4 text-sm font-sans text-[#F8FAFC] placeholder:text-[#64748B] outline-none transition-all resize-none shadow-inner"
        />

        {/* Real-time HUD pill floating inside input */}
        <div className="absolute right-3 bottom-3 flex items-center gap-3 bg-[#111B2E]/95 px-3 py-1.5 rounded-lg border border-[#263B5E] text-xs font-mono text-[#94A3B8] backdrop-blur-md shadow-sm select-none pointer-events-none">
          {/* Animated Spectrum Waveform */}
          <div className="flex items-end gap-1 h-4 px-1 border-r border-[#263B5E] pr-2.5">
            {(observations.length > 0 ? observations.slice(-8) : [25, 45, 60, 35, 75, 50, 40, 65]).map((item, idx) => {
              const heightPercent =
                typeof item === "number"
                  ? item
                  : Math.min(100, Math.max(20, Math.round((item.holdMs / 180) * 100)));
              return (
                <div
                  key={idx}
                  className={cn(
                    "w-1 rounded-full transition-all duration-150",
                    observations.length > 0
                      ? idx % 2 === 0
                        ? "bg-[#38BDF8]"
                        : "bg-[#FF6A00]"
                      : "bg-[#263B5E]"
                  )}
                  style={{ height: `${heightPercent}%` }}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-[#64748B]">Hold:</span>
            <span className={cn(currentHold ? "text-[#F8FAFC] font-semibold" : "text-[#64748B]")}>
              {currentHold ? `${currentHold}ms` : "—"}
            </span>
          </div>
          <div className="w-[1px] h-3.5 bg-[#263B5E]" />
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#FF6A00]" />
            <span className="text-[#64748B]">Flight:</span>
            <span className={cn(currentFlight ? "text-[#F8FAFC] font-semibold" : "text-[#64748B]")}>
              {currentFlight ? `${currentFlight}ms` : "—"}
            </span>
          </div>
          <div className="w-[1px] h-3.5 bg-[#263B5E]" />
          <div className="flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-[#22C55E]" />
            <span className="text-[#64748B]">Samples:</span>
            <span className="text-[#22C55E] font-semibold">{observations.length}</span>
          </div>
        </div>
      </div>

      {/* Real-time 10D Biometric Vector Live Readout */}
      <div className="mt-5 pt-5 border-t border-[#263B5E]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-[#94A3B8] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#38BDF8]" /> 10-Dimensional Feature Vector
          </span>
          <span className="text-[11px] text-[#64748B]">
            Updated in real-time
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col hover:border-[#38BDF8]/40 transition-colors">
            <span className="text-[10px] text-[#64748B] uppercase">Mean Hold</span>
            <span className="text-sm font-semibold text-[#F8FAFC] mt-1">
              {metrics.meanHold > 0 ? `${metrics.meanHold}ms` : "—"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col hover:border-[#38BDF8]/40 transition-colors">
            <span className="text-[10px] text-[#64748B] uppercase">Median Hold</span>
            <span className="text-sm font-semibold text-[#F8FAFC] mt-1">
              {metrics.medianHold > 0 ? `${metrics.medianHold}ms` : "—"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col hover:border-[#38BDF8]/40 transition-colors">
            <span className="text-[10px] text-[#64748B] uppercase">Std Hold</span>
            <span className="text-sm font-semibold text-[#F8FAFC] mt-1">
              {metrics.stdHold > 0 ? `±${metrics.stdHold}ms` : "—"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col hover:border-[#38BDF8]/40 transition-colors">
            <span className="text-[10px] text-[#64748B] uppercase">Mean Flight</span>
            <span className="text-sm font-semibold text-[#F8FAFC] mt-1">
              {metrics.meanFlight > 0 ? `${metrics.meanFlight}ms` : "—"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col hover:border-[#38BDF8]/40 transition-colors">
            <span className="text-[10px] text-[#64748B] uppercase">Median Flight</span>
            <span className="text-sm font-semibold text-[#F8FAFC] mt-1">
              {metrics.medianFlight > 0 ? `${metrics.medianFlight}ms` : "—"}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col hover:border-[#38BDF8]/40 transition-colors">
            <span className="text-[10px] text-[#64748B] uppercase">Std Flight</span>
            <span className="text-sm font-semibold text-[#F8FAFC] mt-1">
              {metrics.stdFlight > 0 ? `±${metrics.stdFlight}ms` : "—"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col hover:border-[#38BDF8]/40 transition-colors">
            <span className="text-[10px] text-[#64748B] uppercase">90th %ile Flight</span>
            <span className="text-sm font-semibold text-[#F8FAFC] mt-1">
              {metrics.p90Flight > 0 ? `${metrics.p90Flight}ms` : "—"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col hover:border-[#38BDF8]/40 transition-colors">
            <span className="text-[10px] text-[#64748B] uppercase">Cadence (CPS)</span>
            <span className="text-sm font-semibold text-[#F8FAFC] mt-1">
              {metrics.charsPerSec > 0 ? `${metrics.charsPerSec} c/s` : "—"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col hover:border-[#38BDF8]/40 transition-colors">
            <span className="text-[10px] text-[#64748B] uppercase">Pause Ratio</span>
            <span className="text-sm font-semibold text-[#F8FAFC] mt-1">
              {metrics.pauseRatio > 0 ? `${metrics.pauseRatio}` : "—"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col hover:border-[#38BDF8]/40 transition-colors">
            <span className="text-[10px] text-[#64748B] uppercase">Hold / Flight</span>
            <span className="text-sm font-semibold text-[#F8FAFC] mt-1">
              {metrics.holdFlightRatio > 0 ? `${metrics.holdFlightRatio}` : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
