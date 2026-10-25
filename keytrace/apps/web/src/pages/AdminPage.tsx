import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge } from "../components/ui/Badge.js";
import { formatDate } from "../lib/utils.js";
import {
  Cpu,
  Users,
  ShieldCheck,
  Activity,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Lock,
} from "lucide-react";
import { USER_ROLE } from "@keytrace/shared";

export function AdminPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"users" | "models" | "audit">("users");

  // Admin queries
  const { data: overviewData, isLoading: isOverviewLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => api.admin.getOverview(),
  });

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.admin.getUsers(1, 50),
    enabled: activeTab === "users",
  });

  const { data: modelsData, isLoading: isModelsLoading } = useQuery({
    queryKey: ["admin-models"],
    queryFn: () => api.admin.getModels(),
    enabled: activeTab === "models",
  });

  const { data: auditData, isLoading: isAuditLoading } = useQuery({
    queryKey: ["admin-audit-events"],
    queryFn: () => api.admin.getAuditEvents(1, 50),
    enabled: activeTab === "audit",
  });

  // Role toggle mutation
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.admin.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });

  if (user?.role !== USER_ROLE.ADMIN) {
    return (
      <div className="max-w-md mx-auto py-16 text-center flex flex-col items-center gap-4">
        <Lock className="w-12 h-12 text-red-400" />
        <h2 className="text-2xl font-bold text-foreground">Administrative Access Restricted</h2>
        <p className="text-sm text-foreground-muted">
          This portal requires administrator privileges. Your current role is <strong>{user?.role}</strong>.
        </p>
      </div>
    );
  }

  const stats = overviewData?.stats;

  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col gap-8">
      <div>
        <Badge variant="accent" className="mb-1">
          Operations &amp; Governance
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          System Administration Console
        </h1>
        <p className="text-sm text-foreground-muted mt-1">
          Operational monitoring, user management, machine-learning models, and centralized audit ledger.
        </p>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card elevated className="p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs text-foreground-muted font-medium">Total Registered Users</span>
            <Users className="w-4 h-4 text-accent" />
          </div>
          <span className="text-2xl font-bold font-mono text-foreground mt-2">
            {stats?.totalUsers ?? "—"}
          </span>
          <span className="text-[11px] text-foreground-subtle mt-1">
            {stats?.enrolledUsers ?? 0} profiles ready
          </span>
        </Card>

        <Card elevated className="p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs text-foreground-muted font-medium">Enrolled Samples</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {stats?.totalEnrollmentSamples ?? "—"}
          </span>
          <span className="text-[11px] text-foreground-subtle mt-1">10-dim timing vectors</span>
        </Card>

        <Card elevated className="p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs text-foreground-muted font-medium">Verification Events</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-sky-400 mt-2">
            {stats?.totalVerificationEvents ?? "—"}
          </span>
          <span className="text-[11px] text-foreground-subtle mt-1">
            {stats?.recentVerificationDecisions?.match ?? 0} matches recorded
          </span>
        </Card>

        <Card elevated className="p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-xs text-foreground-muted font-medium">ML Service Runtime</span>
            <Cpu className="w-4 h-4 text-orange-400" />
          </div>
          <div className="mt-2">
            {stats?.mlServiceStatus === "healthy" ? (
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                HEALTHY
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                STANDALONE
              </span>
            )}
          </div>
          <span className="text-[11px] text-foreground-subtle mt-1 font-mono truncate">
            {stats?.activeModelVersion || "v1.2.0-robust"}
          </span>
        </Card>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-border pb-2 text-sm font-medium">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "users"
              ? "bg-surface-elevated text-accent border border-border"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" /> Users Directory
        </button>
        <button
          onClick={() => setActiveTab("models")}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "models"
              ? "bg-surface-elevated text-accent border border-border"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          <Cpu className="w-4 h-4" /> Model Registry
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "audit"
              ? "bg-surface-elevated text-accent border border-border"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          <Activity className="w-4 h-4" /> Audit Ledger
        </button>
      </div>

      {/* Tab 1: Users Directory */}
      {activeTab === "users" && (
        <Card elevated className="p-0 overflow-hidden">
          {isUsersLoading ? (
            <div className="py-12 text-center text-xs text-foreground-muted">Loading user directory...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-surface-elevated border-b border-border text-foreground-muted font-medium">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Profile Status</th>
                    <th className="py-3 px-4 font-mono">Samples</th>
                    <th className="py-3 px-4 text-right">Role Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {usersData?.users?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-foreground">{u.username}</td>
                      <td className="py-3 px-4 text-foreground-muted font-mono">{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            u.role === "admin"
                              ? "bg-orange-500/10 text-orange-400 border border-orange-500/30 font-bold"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-foreground-muted font-mono">
                          {u.profileStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-foreground">
                        {u.sampleCount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              roleMutation.mutate({
                                userId: u.id,
                                role: u.role === "admin" ? "user" : "admin",
                              })
                            }
                            isLoading={roleMutation.isPending}
                            className="text-[11px]"
                          >
                            <ArrowUpDown className="w-3 h-3 mr-1" />
                            {u.role === "admin" ? "Demote" : "Make Admin"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 2: Model Registry */}
      {activeTab === "models" && (
        <Card elevated className="p-0 overflow-hidden">
          {isModelsLoading ? (
            <div className="py-12 text-center text-xs text-foreground-muted">Loading model artifacts...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-surface-elevated border-b border-border text-foreground-muted font-medium">
                    <th className="py-3 px-4">Model Version</th>
                    <th className="py-3 px-4">Deployment Status</th>
                    <th className="py-3 px-4 font-mono">EER</th>
                    <th className="py-3 px-4 font-mono">FAR / FRR</th>
                    <th className="py-3 px-4 font-mono">ROC-AUC</th>
                    <th className="py-3 px-4">Evaluated Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-mono">
                  {modelsData?.models?.map((m: any) => (
                    <tr key={m._id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-accent">{m.modelVersion}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase font-bold">
                          {m.deploymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {m.evaluationMetrics ? `${(m.evaluationMetrics.eer * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="py-3 px-4 text-foreground-muted">
                        {m.evaluationMetrics
                          ? `${(m.evaluationMetrics.far * 100).toFixed(1)}% / ${(m.evaluationMetrics.frr * 100).toFixed(1)}%`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-sky-400">
                        {m.evaluationMetrics?.rocAuc?.toFixed(3) || "—"}
                      </td>
                      <td className="py-3 px-4 text-foreground-subtle">
                        {formatDate(m.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: Audit Ledger */}
      {activeTab === "audit" && (
        <Card elevated className="p-0 overflow-hidden">
          {isAuditLoading ? (
            <div className="py-12 text-center text-xs text-foreground-muted">Loading audit ledger...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-surface-elevated border-b border-border text-foreground-muted font-medium">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4 font-mono">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-mono text-[11px]">
                  {auditData?.events?.map((ev: any) => (
                    <tr key={ev._id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-2.5 px-4 text-foreground-subtle whitespace-nowrap">
                        {formatDate(ev.timestamp)}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-accent">{ev.action}</td>
                      <td className="py-2.5 px-4 text-foreground">{ev.actorUsername || "system"}</td>
                      <td className="py-2.5 px-4 text-foreground-muted">{ev.resourceType}</td>
                      <td className="py-2.5 px-4 text-foreground-subtle">{ev.ipAddress || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
