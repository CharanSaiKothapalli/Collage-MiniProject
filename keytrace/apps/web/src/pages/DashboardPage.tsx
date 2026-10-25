import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../lib/api.js";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge, DecisionBadge } from "../components/ui/Badge.js";
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
} from "lucide-react";
import { PROFILE_STATUS } from "@keytrace/shared";

export function DashboardPage() {
  const { user } = useAuth();

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

  const sampleCount = enrollmentData?.count || user?.sampleCount || 0;
  const isEnrolled = sampleCount >= 10;
  const progressPercent = Math.min(100, Math.round((sampleCount / 10) * 100));

  return (
    <div className="flex flex-col gap-6 py-4">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="cyan" className="shadow-[0_0_12px_rgba(6,182,212,0.25)]">[ TELEMETRY COMMAND CONSOLE ]</Badge>
            <span className="text-[11px] font-mono text-slate-400 uppercase font-semibold">SYS-ID: {user?.id?.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono flex items-center gap-2">
            OPERATOR: <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-cyan-400 bg-clip-text text-transparent">{user?.username}</span>
          </h1>
          <p className="text-xs text-slate-300 font-mono mt-0.5">
            Continuous behavioural biometric telemetry, risk event logging, and active baseline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/docs">
            <Button variant="secondary" size="sm">
              <BookOpen className="w-3.5 h-3.5" /> Documentation
            </Button>
          </Link>
          <Link to="/verification">
            <Button variant="primary" size="sm">
              <Shield className="w-3.5 h-3.5" /> Live Verification Terminal
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profile Enrolment Card */}
        <Card elevated cornerTicks className="flex flex-col justify-between hover:border-amber-500/50 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-medium">Profile Baseline</span>
              <div className="flex items-center gap-2 mt-1">
                {isEnrolled ? (
                  <Badge variant="match">BASELINE READY</Badge>
                ) : (
                  <Badge variant="review">{sampleCount}/10 ENROLLING</Badge>
                )}
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col gap-1.5">
            <div className="flex justify-between text-[11px] font-mono text-slate-300 font-medium">
              <span>Required Samples</span>
              <span className="text-white font-bold">{sampleCount} / 10</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Verification Match Rate */}
        <Card elevated cornerTicks className="flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-medium">Match Consistency</span>
              <span className="text-2xl font-bold font-mono text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.3)] mt-1">
                {analyticsData?.stats?.matchRate !== undefined ? `${analyticsData.stats.matchRate}%` : "—"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-300 flex items-center justify-between">
            <span>Matches / Reviews</span>
            <span className="text-white font-bold">
              {analyticsData?.stats?.matchCount || 0} / {analyticsData?.stats?.reviewCount || 0}
            </span>
          </div>
        </Card>

        {/* Verification Events */}
        <Card elevated cornerTicks className="flex flex-col justify-between hover:border-cyan-500/50 hover:shadow-[0_8px_30px_rgba(6,182,212,0.15)] transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-medium">Evaluations Recorded</span>
              <span className="text-2xl font-bold font-mono text-cyan-300 drop-shadow-[0_0_12px_rgba(6,182,212,0.3)] mt-1">
                {analyticsData?.stats?.totalEvents ?? 0}
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-300 flex items-center justify-between">
            <span>Active Sessions</span>
            <span className="text-white font-bold">
              {analyticsData?.stats?.totalSessions ?? 0}
            </span>
          </div>
        </Card>

        {/* Active Model Version */}
        <Card elevated cornerTicks className="flex flex-col justify-between hover:border-amber-500/50 hover:shadow-[0_8px_30px_rgba(245,158,11,0.15)] transition-all">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-medium">ML Model Engine</span>
              <span className="text-xs font-mono font-bold text-amber-300 mt-1 truncate max-w-[140px]">
                v1.2.0-robust
              </span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-mono text-slate-300 flex items-center justify-between">
            <span>Formula</span>
            <span className="text-white font-bold">Median + MAD</span>
          </div>
        </Card>
      </div>

      {/* Main Content Split: Enrolment Banner + Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Enrolment Callout / Workflow status */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {!isEnrolled ? (
            <Card elevated cornerTicks className="p-6 border-amber-500/40 bg-[#0d1222]/85 flex flex-col gap-4 shadow-[0_12px_36px_rgba(245,158,11,0.1)]">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                  <UserCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-mono font-bold text-white uppercase flex items-center gap-2">
                    Biometric Enrolment Incomplete ({sampleCount}/10 samples)
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-1 leading-relaxed">
                    To reliably establish your behavioral typing baseline, KEYTRACE requires at least 10 valid typing sessions.
                    Each session takes less than 20 seconds.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
                <Link to="/enrollment">
                  <Button variant="primary" size="sm">
                    Continue Enrolment <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            <Card elevated cornerTicks className="p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between pb-4 border-b border-slate-800/80">
                <div>
                  <h3 className="text-base font-mono font-bold text-white flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    BEHAVIOURAL PROFILE OPERATIONAL
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-1">
                    Your baseline is built from {sampleCount} enrolled samples. Continuous verification is active.
                  </p>
                </div>
                <Link to="/verification">
                  <Button variant="primary" size="sm">
                    Start Test Session
                  </Button>
                </Link>
              </div>

              {/* Cadence Telemetry Summary */}
              {analyticsData?.stats?.cadenceProfile && (
                <div className="grid grid-cols-3 gap-3 p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-center text-xs font-mono shadow-inner">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mean Hold</span>
                    <span className="font-bold text-amber-400 text-base">
                      {analyticsData.stats.cadenceProfile.avgHoldMs} ms
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mean Flight</span>
                    <span className="font-bold text-cyan-400 text-base">
                      {analyticsData.stats.cadenceProfile.avgFlightMs} ms
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Cadence</span>
                    <span className="font-bold text-emerald-400 text-base">
                      {analyticsData.stats.cadenceProfile.avgCharsPerSecond} chars/s
                    </span>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Quick Guidance Card */}
          <Card className="p-5 flex flex-col gap-2.5 bg-[#090d18]/80 border-slate-800">
            <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> Continuous Risk Assessment Overview
            </h4>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              Conventional login checks identity once at gate entry. In continuous verification, successive typing windows evaluate ongoing rhythm.
              If the physical cadence deviates past threshold τ = 2.80, a <strong className="text-amber-300">REVIEW</strong> risk event is flagged.
            </p>
          </Card>
        </div>

        {/* Right Col: Recent Verification Activity */}
        <div className="flex flex-col gap-4">
          <Card elevated cornerTicks className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3 mb-2 border-b border-slate-800/80">
              <CardTitle className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Recent Activity Log
              </CardTitle>
              <Link to="/history" className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:underline font-bold">
                [ VIEW ALL ]
              </Link>
            </CardHeader>

            <div className="flex flex-col gap-2.5 flex-1">
              {isHistoryLoading ? (
                <div className="text-xs font-mono text-slate-400 py-6 text-center">Loading event stream...</div>
              ) : historyData?.events && historyData.events.length > 0 ? (
                historyData.events.map((ev: any) => (
                  <div
                    key={ev._id}
                    className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex flex-col gap-1">
                      <DecisionBadge decision={ev.decision} />
                      <span className="text-[10px] text-slate-400">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-slate-100 font-bold">
                        DIST: {ev.score !== null ? Number(ev.score).toFixed(2) : "—"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        τ: {ev.threshold}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs font-mono text-slate-400 flex flex-col items-center gap-2">
                  <Activity className="w-7 h-7 text-slate-600 stroke-1" />
                  <span>No verification events recorded yet.</span>
                  <Link to="/verification" className="text-cyan-400 hover:text-cyan-300 hover:underline mt-1 font-semibold">
                    Launch first verification test &rarr;
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
