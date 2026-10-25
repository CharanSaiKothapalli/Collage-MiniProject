import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { Card, CardHeader, CardTitle } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge, DecisionBadge } from "../components/ui/Badge.js";
import { formatDate } from "../lib/utils.js";
import { History, Filter, ChevronLeft, ChevronRight, Eye, X, Shield, Cpu } from "lucide-react";
import { VERIFICATION_DECISION } from "@keytrace/shared";

export function HistoryPage() {
  const [page, setPage] = useState(1);
  const [decisionFilter, setDecisionFilter] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["history-events", page, decisionFilter],
    queryFn: () => api.history.getEvents(page, 10, decisionFilter || undefined),
  });

  const events = data?.events || [];
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="cyan" glow className="mb-1.5">
            Audit Ledger
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-orange-300 to-cyan-300">
            Authentication History
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Complete historical audit trail of continuous keystroke verification assessments.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-surface/80 backdrop-blur-md border border-border/80 p-1.5 rounded-lg text-xs font-medium shadow-md">
          <button
            onClick={() => {
              setDecisionFilter("");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md transition-all font-semibold ${
              decisionFilter === ""
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                : "text-foreground-muted hover:text-foreground hover:bg-surface-elevated"
            }`}
          >
            All Outcomes
          </button>
          <button
            onClick={() => {
              setDecisionFilter(VERIFICATION_DECISION.MATCH);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md transition-all font-semibold ${
              decisionFilter === VERIFICATION_DECISION.MATCH
                ? "bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                : "text-foreground-muted hover:text-emerald-400 hover:bg-surface-elevated"
            }`}
          >
            Matches
          </button>
          <button
            onClick={() => {
              setDecisionFilter(VERIFICATION_DECISION.REVIEW);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-md transition-all font-semibold ${
              decisionFilter === VERIFICATION_DECISION.REVIEW
                ? "bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                : "text-foreground-muted hover:text-amber-400 hover:bg-surface-elevated"
            }`}
          >
            Reviews
          </button>
        </div>
      </div>

      {/* Events Table Card */}
      <Card elevated className="p-0 overflow-hidden border-border/80 relative">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500/40 via-amber-500/40 to-emerald-500/40" />
        {isLoading ? (
          <div className="py-16 text-center text-xs text-foreground-muted">Loading verification records...</div>
        ) : events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-surface-elevated/80 border-b border-border/80 text-foreground-muted font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Outcome Decision</th>
                  <th className="py-3 px-4 font-semibold font-mono">Distance Score</th>
                  <th className="py-3 px-4 font-semibold font-mono">Threshold</th>
                  <th className="py-3 px-4 font-semibold">Assessment Codes</th>
                  <th className="py-3 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle/50 font-mono">
                {events.map((ev: any) => (
                  <tr key={ev._id} className="hover:bg-cyan-500/5 transition-colors">
                    <td className="py-3.5 px-4 text-foreground-muted whitespace-nowrap">
                      {formatDate(ev.timestamp)}
                    </td>
                    <td className="py-3.5 px-4">
                      <DecisionBadge decision={ev.decision} />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                      {ev.score !== null ? Number(ev.score).toFixed(3) : "—"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-foreground-subtle">{ev.threshold}</td>
                    <td className="py-3.5 px-4 text-foreground-muted max-w-xs truncate">
                      {ev.reasonCodes?.join(", ") || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEvent(ev)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-foreground-muted flex flex-col items-center gap-2">
            <History className="w-8 h-8 text-zinc-600 stroke-1" />
            <span>No verification events match current criteria.</span>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between text-xs text-foreground-muted">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total events)
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
      </Card>

      {/* Detailed Event Inspection Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <Card elevated className="w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 flex flex-col gap-5 border-border-bright">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                <h3 className="text-lg font-bold text-foreground">
                  Verification Event Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-foreground-muted hover:text-foreground p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle">
                <span className="text-foreground-subtle block">Decision</span>
                <div className="mt-1">
                  <DecisionBadge decision={selectedEvent.decision} />
                </div>
              </div>
              <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle">
                <span className="text-foreground-subtle block">Distance Score</span>
                <span className="text-base font-bold text-foreground mt-1 block">
                  {selectedEvent.score !== null ? Number(selectedEvent.score).toFixed(3) : "—"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle">
                <span className="text-foreground-subtle block">Threshold</span>
                <span className="text-base font-bold text-foreground mt-1 block">
                  {selectedEvent.threshold}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle">
                <span className="text-foreground-subtle block">Model Version</span>
                <span className="text-xs font-bold text-accent mt-1 block truncate">
                  {selectedEvent.modelVersion}
                </span>
              </div>
            </div>

            {/* Reason Codes */}
            {selectedEvent.reasonCodes && (
              <div className="flex flex-col gap-1.5 text-xs">
                <span className="font-semibold text-foreground">Reason Codes &amp; Rationales:</span>
                <ul className="space-y-1 text-foreground-muted">
                  {selectedEvent.reasonCodes.map((r: string, idx: number) => (
                    <li key={idx} className="p-2 rounded bg-surface-subtle border border-border-subtle font-mono text-[11px]">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Feature Deviations */}
            {selectedEvent.featureDeviations && (
              <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
                <span className="text-xs font-semibold text-foreground">
                  Standardized Z-Score Deviations:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                  {Object.entries(selectedEvent.featureDeviations).map(([k, v]: [string, any]) => (
                    <div key={k} className="p-2 rounded bg-surface-subtle border border-border-subtle flex justify-between">
                      <span className="text-foreground-subtle truncate">{k}</span>
                      <span className="font-bold text-foreground">{Number(v).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-border flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
