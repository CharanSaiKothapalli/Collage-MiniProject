import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../lib/api.js";
import { Card, CardHeader, CardTitle } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge, DecisionBadge } from "../components/ui/Badge.js";
import { LiveBehaviouralMonitor } from "../components/dashboard/LiveBehaviouralMonitor.js";
import {
  Shield,
  Activity,
  UserCheck,
  TrendingUp,
  Cpu,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  Zap,
  Radio,
  FileCode2,
  Sliders,
} from "lucide-react";
import { PROFILE_STATUS } from "@keytrace/shared";

export function DashboardPage() {
  const { user } = useAuth();
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  useEffect(() => {
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  }, []);

  // Fetch enrollment status
  const { data: enrollmentData } = useQuery({
    queryKey: ["enrollment-status"],
    queryFn: () => api.enrollment.getStatus(),
  });

  // Fetch analytics overview
  const { data: analyticsData } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: () => api.analytics.getOverview(),
  });

  // Fetch recent history events
  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["recent-history"],
    queryFn: () => api.history.getEvents(1, 6),
  });

  const sampleCount = enrollmentData?.count ?? user?.sampleCount ?? 0;
  const isEnrolled = sampleCount >= 10;
  const progressPercent = Math.min(100, Math.round((sampleCount / 10) * 100));

  const totalEvents = analyticsData?.stats?.totalEvents ?? 0;
  const hasEvaluationData = totalEvents > 0 && analyticsData?.stats?.matchRate !== undefined;
  const matchRateDisplay = hasEvaluationData ? `${analyticsData.stats.matchRate}%` : "N/A";
  const riskEventsCount = analyticsData?.stats?.reviewCount ?? 0;
  const activeSessionsCount = analyticsData?.stats?.totalSessions ?? 0;

  const scrollToLiveMonitor = () => {
    const el = document.getElementById("live-monitor");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* 1. COMMAND CENTER HERO SECTION */}
      <div className="relative rounded-2xl bg-[#111927] border border-[#243247] p-6 sm:p-8 overflow-hidden shadow-2xl">
        {/* Subtle radial ambient highlight */}
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 bg-[#35D6E8]/[0.05] rounded-full blur-[100px]" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#35D6E8] bg-[#35D6E8]/10 border border-[#35D6E8]/20 px-2.5 py-0.5 rounded-full font-semibold">
                COMMAND CENTER
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#32D6A0] bg-[#32D6A0]/10 border border-[#32D6A0]/20 px-2.5 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#32D6A0] animate-pulse" />
                SYSTEM OPERATIONAL
              </div>
              <span className="text-[11px] text-[#94A3B8] font-mono">
                Operator: <strong className="text-[#F4F7FC]">{user?.username}</strong> ({user?.role})
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F7FC]">
              Welcome back, <span className="text-[#35D6E8]">{user?.username}</span>
            </h1>

            {/* Status Strip */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#94A3B8] mt-2 font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-[#94A3B8]">Baseline Status:</span>
                {isEnrolled ? (
                  <span className="text-[#32D6A0] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 10/10 READY
                  </span>
                ) : (
                  <span className="text-[#FFBF55] font-semibold">
                    {sampleCount}/10 ENROLLING
                  </span>
                )}
              </div>
              <span className="text-[#243247]">•</span>
              <div>
                Last Synchronization: <span className="text-[#F4F7FC]">{lastSyncTime || "Realtime"}</span>
              </div>
              <span className="text-[#243247]">•</span>
              <div>
                Engine: <span className="text-[#8B7CFF]">Mahalanobis D_M (τ=2.80)</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={scrollToLiveMonitor}
              className="text-[#F4F7FC] border-[#243247] hover:border-[#35D6E8]/40"
            >
              <Zap className="w-3.5 h-3.5 text-[#35D6E8] mr-1.5" />
              Live Monitor
            </Button>
            <Link to="/verification">
              <Button variant="primary" size="sm">
                <Shield className="w-3.5 h-3.5 mr-1.5 text-[#080B12]" />
                Start Verification
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. TOP 4 METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Profile Baseline */}
        <Card elevated className="flex flex-col justify-between hover:border-[#344560] transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#94A3B8] font-medium uppercase font-mono">
                Profile Baseline
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-[#F4F7FC] font-mono">
                  {sampleCount} / 10
                </span>
                <span className="text-xs text-[#94A3B8]">samples</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#35D6E8]">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#243247] flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#94A3B8]">Status</span>
              {isEnrolled ? (
                <Badge variant="match">Ready</Badge>
              ) : (
                <Badge variant="review">{progressPercent}% Enrolled</Badge>
              )}
            </div>
            <div className="w-full h-1.5 bg-[#0D1320] rounded-full overflow-hidden border border-[#243247]">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isEnrolled ? "bg-[#32D6A0]" : "bg-[#35D6E8]"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Metric 2: Match Consistency */}
        <Card elevated className="flex flex-col justify-between hover:border-[#344560] transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#94A3B8] font-medium uppercase font-mono">
                Match Consistency
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-[#F4F7FC] font-mono">
                  {matchRateDisplay}
                </span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#32D6A0]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#243247] flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Evaluations</span>
            <span className="text-[#F4F7FC] font-semibold font-mono">
              {hasEvaluationData ? `${analyticsData?.stats?.matchCount} matches` : "Pending Data"}
            </span>
          </div>
        </Card>

        {/* Metric 3: Risk Events */}
        <Card elevated className="flex flex-col justify-between hover:border-[#344560] transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#94A3B8] font-medium uppercase font-mono">
                Risk Events
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span
                  className={`text-2xl font-extrabold font-mono ${
                    riskEventsCount > 0 ? "text-[#FFBF55]" : "text-[#F4F7FC]"
                  }`}
                >
                  {riskEventsCount}
                </span>
                <span className="text-xs text-[#94A3B8]">anomalies</span>
              </div>
            </div>
            <div
              className={`w-9 h-9 rounded-xl bg-[#0D1320] border border-[#243247] flex items-center justify-center ${
                riskEventsCount > 0 ? "text-[#FFBF55]" : "text-[#94A3B8]"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#243247] flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Threshold (τ)</span>
            <span className="text-[#F4F7FC] font-semibold font-mono">
              2.80 Cutoff
            </span>
          </div>
        </Card>

        {/* Metric 4: Active Sessions */}
        <Card elevated className="flex flex-col justify-between hover:border-[#344560] transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#94A3B8] font-medium uppercase font-mono">
                Active Sessions
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-extrabold text-[#F4F7FC] font-mono">
                  {activeSessionsCount}
                </span>
                <span className="text-xs text-[#94A3B8]">telemetry streams</span>
              </div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#8B7CFF]">
              <Radio className="w-4 h-4" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#243247] flex items-center justify-between text-xs text-[#94A3B8]">
            <span>Continuous Auth</span>
            <span className="text-[#32D6A0] font-semibold font-mono">Active</span>
          </div>
        </Card>
      </div>

      {/* 3. LIVE BEHAVIOURAL MONITORING SECTION */}
      <LiveBehaviouralMonitor
        baselineProfile={analyticsData?.stats?.cadenceProfile}
        isEnrolled={isEnrolled}
        sampleCount={sampleCount}
      />

      {/* 4. SPLIT: CONTINUOUS RISK ASSESSMENT & RECENT ACTIVITY TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Continuous Risk Assessment Overview */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <Card elevated className="p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between pb-4 border-b border-[#243247]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-[#35D6E8]" />
                  <span className="text-[10px] uppercase font-mono text-[#35D6E8] tracking-wider">
                    SECURITY ARCHITECTURE
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#F4F7FC]">
                  Continuous Risk Assessment Engine
                </h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  Real-time sliding window evaluation using regularized Mahalanobis distance with Ledoit-Wolf shrinkage.
                </p>
              </div>
              <Link to="/docs">
                <Button variant="ghost" size="xs" className="text-[#35D6E8] hover:bg-[#35D6E8]/10">
                  <FileCode2 className="w-3.5 h-3.5 mr-1" /> Formula Docs
                </Button>
              </Link>
            </div>

            {/* Risk Threshold & Formula Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-[#0D1320] border border-[#243247] flex flex-col gap-1">
                <span className="text-[10px] text-[#94A3B8] uppercase font-mono">Decision Threshold</span>
                <span className="text-xl font-extrabold text-[#35D6E8] font-mono">τ = 2.80</span>
                <span className="text-[11px] text-[#94A3B8]">
                  Hysteresis tolerance: [2.50 - 2.80]
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#0D1320] border border-[#243247] flex flex-col gap-1">
                <span className="text-[10px] text-[#94A3B8] uppercase font-mono">Feature Vector</span>
                <span className="text-xl font-extrabold text-[#8B7CFF] font-mono">10 Dimensions</span>
                <span className="text-[11px] text-[#94A3B8]">
                  Hold, flight, jitter & pause metrics
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#0D1320] border border-[#243247] flex flex-col gap-1">
                <span className="text-[10px] text-[#94A3B8] uppercase font-mono">Covariance Estimator</span>
                <span className="text-xl font-extrabold text-[#32D6A0] font-mono">Ledoit-Wolf</span>
                <span className="text-[11px] text-[#94A3B8]">
                  Robust inversion against singularity
                </span>
              </div>
            </div>

            {/* Severity Threshold Classification Bar */}
            <div className="p-4 rounded-xl bg-[#0D1320]/60 border border-[#243247] flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-[#F4F7FC] flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#35D6E8]" /> Dynamic Classification Spectrum
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#32D6A0]/10 border border-[#32D6A0]/20 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#32D6A0]">MATCH</span>
                    <span className="font-mono text-[10px] text-[#32D6A0]">D_M ≤ 2.80</span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8] mt-1">Rhythm matches genuine operator profile.</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#FFBF55]/10 border border-[#FFBF55]/20 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#FFBF55]">REVIEW</span>
                    <span className="font-mono text-[10px] text-[#FFBF55]">2.80 &lt; D_M ≤ 4.0</span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8] mt-1">Deviations detected; step-up verification needed.</span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#FF647C]/10 border border-[#FF647C]/20 flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#FF647C]">ALERT</span>
                    <span className="font-mono text-[10px] text-[#FF647C]">D_M &gt; 4.00</span>
                  </div>
                  <span className="text-[10px] text-[#94A3B8] mt-1">Severe rhythm mismatch or imposter activity.</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Col: Recent Activity Timeline */}
        <div className="flex flex-col gap-4">
          <Card elevated className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3 mb-2 border-b border-[#243247]">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-[#F4F7FC] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#35D6E8]" /> Recent Activity Log
              </CardTitle>
              <Link to="/history" className="text-xs text-[#35D6E8] hover:underline font-mono">
                View all &rarr;
              </Link>
            </CardHeader>

            <div className="flex flex-col gap-2.5 flex-1 p-2">
              {isHistoryLoading ? (
                <div className="text-xs text-[#94A3B8] py-8 text-center font-mono">
                  Loading telemetry stream...
                </div>
              ) : historyData?.events && historyData.events.length > 0 ? (
                historyData.events.map((ev: any) => (
                  <div
                    key={ev._id}
                    className="p-3 rounded-xl bg-[#0D1320] border border-[#243247] hover:border-[#344560] transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <DecisionBadge decision={ev.decision} />
                        <span className="text-[10px] font-mono text-[#94A3B8] truncate">
                          #{ev._id.slice(-6)}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#94A3B8] font-mono">
                        {new Date(ev.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="flex flex-col items-end shrink-0 pl-2">
                      <span className="text-[#F4F7FC] font-mono font-bold text-xs">
                        {ev.score !== null ? `D_M: ${Number(ev.score).toFixed(2)}` : "N/A"}
                      </span>
                      <span className="text-[10px] text-[#94A3B8] font-mono">
                        τ: {ev.threshold || 2.8}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-[#94A3B8] flex flex-col items-center gap-2">
                  <Activity className="w-8 h-8 text-[#243247]" />
                  <span>No verification events recorded yet.</span>
                  <Link
                    to="/verification"
                    className="text-[#35D6E8] hover:underline font-medium mt-1 font-mono text-xs"
                  >
                    Launch first test &rarr;
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
