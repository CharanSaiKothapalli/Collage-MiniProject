import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge, DecisionBadge } from "../components/ui/Badge.js";
import { formatDate } from "../lib/utils.js";
import {
  History,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  List,
  Layers,
  Clock,
  Terminal,
} from "lucide-react";
import { VERIFICATION_DECISION } from "@keytrace/shared";

export function HistoryPage() {
  const [page, setPage] = useState(1);
  const [decisionFilter, setDecisionFilter] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "table">("timeline");

  const { data, isLoading } = useQuery({
    queryKey: ["history-events", page, decisionFilter],
    queryFn: () => api.history.getEvents(page, 10, decisionFilter || undefined),
  });

  const events = data?.events || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const getSeverity = (decision: string, score: number | null) => {
    if (decision === VERIFICATION_DECISION.MATCH) {
      return { label: "LOW SEVERITY", variant: "match" as const, color: "#22C55E" };
    }
    if (score !== null && score > 4.0) {
      return { label: "CRITICAL RISK", variant: "danger" as const, color: "#EF4444" };
    }
    return { label: "ELEVATED RISK", variant: "review" as const, color: "#F59E0B" };
  };

  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#263B5E]">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="blue">AUDIT LEDGER</Badge>
            <span className="text-xs text-[#94A3B8] font-mono">Immutable Telemetry Log</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
            Verification History &amp; Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
            Complete sequential log of real-time sliding window biometric evaluations and risk assessments.
          </p>
        </div>

        {/* View mode & Decision filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#111B2E] border border-[#263B5E] p-1 rounded-xl text-xs">
            <button
              onClick={() => setViewMode("timeline")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "timeline"
                  ? "bg-[#1A2A44] text-[#FF6A00] shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
              title="Timeline View"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === "table"
                  ? "bg-[#1A2A44] text-[#FF6A00] shadow-sm"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-[#111B2E] border border-[#263B5E] p-1 rounded-xl text-xs font-mono">
            <button
              onClick={() => {
                setDecisionFilter("");
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                decisionFilter === ""
                  ? "bg-[#1A2A44] text-[#FF6A00] border border-[#FF6A00]/30"
                  : "text-[#94A3B8] hover:text-[#F8FAFC]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setDecisionFilter(VERIFICATION_DECISION.MATCH);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                decisionFilter === VERIFICATION_DECISION.MATCH
                  ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30"
                  : "text-[#94A3B8] hover:text-[#22C55E]"
              }`}
            >
              Matches
            </button>
            <button
              onClick={() => {
                setDecisionFilter(VERIFICATION_DECISION.REVIEW);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                decisionFilter === VERIFICATION_DECISION.REVIEW
                  ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30"
                  : "text-[#94A3B8] hover:text-[#F59E0B]"
              }`}
            >
              Reviews
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Timeline or Table */}
      {isLoading ? (
        <Card elevated className="py-20 text-center text-xs text-[#94A3B8] font-mono">
          <Activity className="w-6 h-6 text-[#38BDF8] animate-spin mx-auto mb-2" />
          Loading audit telemetry ledger...
        </Card>
      ) : events.length === 0 ? (
        <Card elevated className="py-20 text-center text-xs text-[#94A3B8] flex flex-col items-center gap-2">
          <History className="w-9 h-9 text-[#263B5E]" />
          <span className="font-medium text-[#F8FAFC]">No verification records found</span>
          <span className="text-[11px] text-[#94A3B8]">
            Records will stream here once verification evaluations are executed.
          </span>
        </Card>
      ) : viewMode === "timeline" ? (
        /* TIMELINE VIEW */
        <div className="relative pl-6 sm:pl-8 flex flex-col gap-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-[2px] before:bg-[#263B5E]">
          {events.map((ev: any) => {
            const sev = getSeverity(ev.decision, ev.score);
            return (
              <div
                key={ev._id}
                className="relative flex flex-col sm:flex-row sm:items-center justify-between p-4.5 rounded-2xl bg-[#111B2E] border border-[#263B5E] hover:border-[#38BDF8]/40 transition-all gap-4 shadow-sm"
              >
                {/* Timeline Node Point */}
                <div
                  className="absolute -left-[22px] sm:-left-[26px] top-6 w-3 h-3 rounded-full border-2 border-[#111B2E]"
                  style={{ backgroundColor: sev.color }}
                />

                {/* Left Info */}
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-xs text-[#F8FAFC]">
                      Keystroke Window Evaluation
                    </span>
                    <span className="text-[10px] font-mono text-[#94A3B8] bg-[#0B1220] px-2 py-0.5 rounded border border-[#263B5E]">
                      ID: {ev._id.slice(0, 8)}
                    </span>
                    <Badge variant={sev.variant}>{sev.label}</Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#94A3B8] font-mono">
                    <span className="text-[#F8FAFC]">{formatDate(ev.timestamp)}</span>
                    <span>•</span>
                    <span>
                      Model: <strong className="text-[#94A3B8]">{ev.modelVersion || "v1.2.0"}</strong>
                    </span>
                    <span>•</span>
                    <span className="truncate max-w-xs">
                      {ev.reasonCodes?.join(", ") || "Standard rhythm pattern"}
                    </span>
                  </div>
                </div>

                {/* Right Metrics & Inspect */}
                <div className="flex items-center gap-4 shrink-0 sm:self-center">
                  <div className="flex flex-col items-end font-mono">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-[#94A3B8]">D_M:</span>
                      <span className="text-sm font-bold text-[#F8FAFC]">
                        {ev.score !== null ? Number(ev.score).toFixed(3) : "N/A"}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#94A3B8]">Cutoff τ: {ev.threshold || 2.8}</span>
                  </div>

                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setSelectedEvent(ev)}
                    className="text-[#38BDF8] hover:bg-[#38BDF8]/10"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <Card elevated className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#263B5E] text-[#94A3B8] font-mono text-[11px] bg-[#0B1220]/60">
                  <th className="py-3 px-4 font-medium">Timestamp</th>
                  <th className="py-3 px-4 font-medium">Event Identifier</th>
                  <th className="py-3 px-4 font-medium">Outcome Decision</th>
                  <th className="py-3 px-4 font-medium">Severity</th>
                  <th className="py-3 px-4 font-medium">Distance D_M</th>
                  <th className="py-3 px-4 font-medium">Threshold</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263B5E]/50 font-mono">
                {events.map((ev: any) => {
                  const sev = getSeverity(ev.decision, ev.score);
                  return (
                    <tr key={ev._id} className="hover:bg-[#1A2A44]/40 transition-colors">
                      <td className="py-3.5 px-4 text-[#94A3B8] whitespace-nowrap">
                        {formatDate(ev.timestamp)}
                      </td>
                      <td className="py-3.5 px-4 text-[#F8FAFC]">
                        {ev._id.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4">
                        <DecisionBadge decision={ev.decision} />
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={sev.variant}>{sev.label}</Badge>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#F8FAFC]">
                        {ev.score !== null ? Number(ev.score).toFixed(3) : "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-[#94A3B8]">{ev.threshold || 2.8}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setSelectedEvent(ev)}
                          className="text-[#38BDF8] hover:bg-[#38BDF8]/10"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="p-4 rounded-xl bg-[#111B2E] border border-[#263B5E] flex items-center justify-between text-xs text-[#94A3B8] font-mono">
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} records total)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Detailed Event Inspection Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1220]/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-2xl bg-[#111B2E] border border-[#263B5E] shadow-2xl flex flex-col gap-5 text-[#F8FAFC]">
            <div className="flex items-center justify-between border-b border-[#263B5E] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#38BDF8]" />
                <h3 className="text-base font-bold text-[#F8FAFC]">
                  Verification Event Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#94A3B8] hover:text-[#F8FAFC] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E]">
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Decision</span>
                <div className="mt-1">
                  <DecisionBadge decision={selectedEvent.decision} />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E]">
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Distance Score</span>
                <span className="text-base font-mono font-bold text-[#F8FAFC] mt-1 block">
                  {selectedEvent.score !== null ? Number(selectedEvent.score).toFixed(3) : "N/A"}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E]">
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Threshold</span>
                <span className="text-base font-mono font-bold text-[#38BDF8] mt-1 block">
                  τ: {selectedEvent.threshold || 2.8}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E]">
                <span className="text-[#94A3B8] block text-[10px] font-mono uppercase">Model Version</span>
                <span className="text-xs font-mono font-semibold text-[#FF6A00] mt-1 block truncate">
                  {selectedEvent.modelVersion || "v1.2.0"}
                </span>
              </div>
            </div>

            {/* Reason Codes */}
            {selectedEvent.reasonCodes && (
              <div className="flex flex-col gap-1.5 text-xs">
                <span className="font-semibold text-[#F8FAFC] flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#38BDF8]" /> Diagnostic Reason Codes:
                </span>
                <ul className="space-y-1.5">
                  {selectedEvent.reasonCodes.map((r: string, idx: number) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#0B1220] border border-[#263B5E] font-mono text-[11px] text-[#94A3B8]"
                    >
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Feature Deviations */}
            {selectedEvent.featureDeviations && (
              <div className="flex flex-col gap-2 pt-2 border-t border-[#263B5E]">
                <span className="text-xs font-semibold text-[#F8FAFC]">
                  Standardized Z-Score Deviations:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  {Object.entries(selectedEvent.featureDeviations).map(([k, v]: [string, any]) => (
                    <div
                      key={k}
                      className="p-2.5 rounded-xl bg-[#0B1220] border border-[#263B5E] flex justify-between"
                    >
                      <span className="text-[#94A3B8] truncate">{k}</span>
                      <span className="font-bold text-[#F8FAFC]">{Number(v).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#263B5E] flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
