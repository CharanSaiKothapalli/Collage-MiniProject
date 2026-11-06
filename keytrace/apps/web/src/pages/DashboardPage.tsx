import React, { useState } from "react";
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
  Clock,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Zap,
  Radio,
  ChevronDown,
  ChevronUp,
  FileCode2,
  Sliders,
} from "lucide-react";

export function DashboardPage() {
  const { user } = useAuth();
  const [showTechSpecs, setShowTechSpecs] = useState(false);

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
    queryFn: () => api.history.getEvents(1, 5),
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
    <div className="flex flex-col gap-6 py-2">
      {/* 1. HERO: CLEAN, REASSURING STATUS */}
      <div className="relative rounded-2xl bg-[#111927] border border-[#243247] p-6 sm:p-7 overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#32D6A0] animate-pulse" />
              <span className="text-xs font-semibold text-[#32D6A0]">SYSTEM OPERATIONAL</span>
              <span className="text-xs text-[#94A3B8]">•</span>
              <span className="text-xs text-[#94A3B8]">Logged in as <strong className="text-[#F4F7FC]">{user?.username}</strong></span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[#F4F7FC]">
              {isEnrolled ? (
                <span>Biometric Protection is <span className="text-[#32D6A0]">Active</span></span>
              ) : (
                <span>Enrollment in Progress (<span className="text-[#35D6E8]">{sampleCount}/10</span>)</span>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 max-w-xl">
              {isEnrolled
                ? "Your baseline typing rhythm is calibrated. KEYTRACE continuously verifies your identity without logging typed characters."
                : `Complete ${10 - sampleCount} more short typing samples to establish your personalized biometric baseline.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {!isEnrolled ? (
              <Link to="/enrollment">
                <Button variant="primary" size="sm">
                  Continue Enrollment ({sampleCount}/10) <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            ) : (
              <Link to="/verification">
                <Button variant="primary" size="sm">
                  <Shield className="w-3.5 h-3.5 mr-1 text-[#080B12]" />
                  Verify Rhythm
                </Button>
              </Link>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={scrollToLiveMonitor}
              className="text-[#F4F7FC] border-[#243247] hover:border-[#35D6E8]/40"
            >
              <Zap className="w-3.5 h-3.5 text-[#35D6E8] mr-1" />
              Try Live Sandbox
            </Button>
          </div>
        </div>
      </div>

      {/* 2. FOUR CLEAN, FOCUSED STATUS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Baseline */}
        <Card elevated className="p-4 flex flex-col justify-between hover:border-[#344560] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-[#94A3B8] block">Profile Baseline</span>
              <span className="text-xl font-bold text-[#F4F7FC] mt-0.5 block font-mono">
                {sampleCount} / 10
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#35D6E8]">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#243247]/60 flex items-center justify-between text-[11px]">
            <span className="text-[#94A3B8]">Status</span>
            {isEnrolled ? (
              <Badge variant="match">Ready</Badge>
            ) : (
              <span className="text-[#FFBF55] font-semibold">{progressPercent}%</span>
            )}
          </div>
        </Card>

        {/* Card 2: Match Consistency */}
        <Card elevated className="p-4 flex flex-col justify-between hover:border-[#344560] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-[#94A3B8] block">Match Consistency</span>
              <span className="text-xl font-bold text-[#F4F7FC] mt-0.5 block font-mono">
                {matchRateDisplay}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#32D6A0]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#243247]/60 flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span>Evaluations</span>
            <span className="text-[#F4F7FC] font-semibold">
              {hasEvaluationData ? `${analyticsData?.stats?.matchCount} matches` : "Pending tests"}
            </span>
          </div>
        </Card>

        {/* Card 3: Security Flags */}
        <Card elevated className="p-4 flex flex-col justify-between hover:border-[#344560] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-[#94A3B8] block">Security Alerts</span>
              <span
                className={`text-xl font-bold mt-0.5 block font-mono ${
                  riskEventsCount > 0 ? "text-[#FFBF55]" : "text-[#F4F7FC]"
                }`}
              >
                {riskEventsCount}
              </span>
            </div>
            <div
              className={`w-8 h-8 rounded-lg bg-[#0D1320] border border-[#243247] flex items-center justify-center ${
                riskEventsCount > 0 ? "text-[#FFBF55]" : "text-[#94A3B8]"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#243247]/60 flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span>Condition</span>
            <span className={riskEventsCount > 0 ? "text-[#FFBF55] font-semibold" : "text-[#32D6A0] font-semibold"}>
              {riskEventsCount > 0 ? "Needs Review" : "Normal"}
            </span>
          </div>
        </Card>

        {/* Card 4: Active Protection */}
        <Card elevated className="p-4 flex flex-col justify-between hover:border-[#344560] transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] text-[#94A3B8] block">Active Protection</span>
              <span className="text-xl font-bold text-[#F4F7FC] mt-0.5 block font-mono">
                {activeSessionsCount > 0 ? `${activeSessionsCount} Live` : "Active"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#8B7CFF]">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#243247]/60 flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span>Zero-Keylogging</span>
            <span className="text-[#32D6A0] font-semibold">Enabled</span>
          </div>
        </Card>
      </div>

      {/* 3. INTERACTIVE LIVE MONITORING */}
      <LiveBehaviouralMonitor
        baselineProfile={analyticsData?.stats?.cadenceProfile}
        isEnrolled={isEnrolled}
        sampleCount={sampleCount}
      />

      {/* 4. RECENT ACTIVITY TIMELINE */}
      <Card elevated className="p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-3 border-b border-[#243247]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#35D6E8]" />
            <span className="text-xs font-bold text-[#F4F7FC] uppercase tracking-wider">
              Recent Verification Activity
            </span>
          </div>
          <Link to="/history" className="text-xs text-[#35D6E8] hover:underline font-mono">
            View full history &rarr;
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {isHistoryLoading ? (
            <div className="text-xs text-[#94A3B8] py-6 text-center font-mono">
              Loading recent activity...
            </div>
          ) : historyData?.events && historyData.events.length > 0 ? (
            historyData.events.slice(0, 4).map((ev: any) => (
              <div
                key={ev._id}
                className="p-3 rounded-xl bg-[#0D1320] border border-[#243247] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <DecisionBadge decision={ev.decision} />
                  <span className="text-[11px] text-[#94A3B8] font-mono">
                    {new Date(ev.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-[#94A3B8]">
                  <span>Score: <strong className="text-[#F4F7FC]">{ev.score !== null ? Number(ev.score).toFixed(2) : "—"}</strong></span>
                  <span className="hidden sm:inline">Cutoff: {ev.threshold || 2.8}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-[#94A3B8] flex flex-col items-center gap-1.5">
              <Activity className="w-7 h-7 text-[#243247]" />
              <span>No verification tests recorded yet.</span>
              <Link to="/verification" className="text-[#35D6E8] hover:underline text-xs mt-1">
                Start your first verification test &rarr;
              </Link>
            </div>
          )}
        </div>
      </Card>

      {/* 5. COLLAPSIBLE TECHNICAL ARCHITECTURE & MATHEMATICAL FORMULATION */}
      <div className="rounded-xl border border-[#243247] bg-[#111927]/60 p-4 transition-all">
        <button
          type="button"
          onClick={() => setShowTechSpecs(!showTechSpecs)}
          className="w-full flex items-center justify-between text-left text-xs font-medium text-[#94A3B8] hover:text-[#F4F7FC] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-[#35D6E8]" />
            <span className="font-semibold text-[#F4F7FC]">
              {showTechSpecs ? "Hide Technical Specifications" : "View Security Architecture & Mathematical Formulation"}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#35D6E8]">
            <span>{showTechSpecs ? "Collapse" : "Expand"}</span>
            {showTechSpecs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showTechSpecs && (
          <div className="mt-4 pt-4 border-t border-[#243247] flex flex-col gap-4 animate-in fade-in duration-150 text-xs">
            <p className="text-[#94A3B8] leading-relaxed">
              KEYTRACE calculates continuous verification decisions using regularized Mahalanobis distance with Ledoit-Wolf shrinkage across a 10-dimensional feature space (hold times, flight latencies, jitter, and pause ratios).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-[#0D1320] border border-[#243247]">
                <span className="text-[10px] text-[#94A3B8] block uppercase font-mono">Cutoff Threshold</span>
                <span className="text-sm font-bold text-[#35D6E8] font-mono mt-0.5 block">τ = 2.80</span>
                <span className="text-[10px] text-[#94A3B8]">Tolerance band: [2.50 – 2.80]</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0D1320] border border-[#243247]">
                <span className="text-[10px] text-[#94A3B8] block uppercase font-mono">Biometric Dimensions</span>
                <span className="text-sm font-bold text-[#8B7CFF] font-mono mt-0.5 block">10 Features</span>
                <span className="text-[10px] text-[#94A3B8]">Hold, flight &amp; pause timings</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0D1320] border border-[#243247]">
                <span className="text-[10px] text-[#94A3B8] block uppercase font-mono">Covariance Estimator</span>
                <span className="text-sm font-bold text-[#32D6A0] font-mono mt-0.5 block">Ledoit-Wolf</span>
                <span className="text-[10px] text-[#94A3B8]">Singularity-resistant shrinkage</span>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/docs" className="text-xs text-[#35D6E8] hover:underline flex items-center gap-1 font-mono">
                <FileCode2 className="w-3.5 h-3.5" /> Read full mathematical documentation &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
