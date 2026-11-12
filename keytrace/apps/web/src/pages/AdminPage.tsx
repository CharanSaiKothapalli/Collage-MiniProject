import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api.js";
import { useAuth } from "../hooks/useAuth.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge } from "../components/ui/Badge.js";
import { formatDate } from "../lib/utils.js";
import {
  Cpu,
  Users,
  ShieldCheck,
  Activity,
  ArrowUpDown,
  Lock,
  Layers,
  Database,
  Terminal,
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
        <Lock className="w-12 h-12 text-[#EF4444]" />
        <h2 className="text-2xl font-bold text-[#F8FAFC]">Administrative Access Restricted</h2>
        <p className="text-sm text-[#94A3B8]">
          This portal requires administrator privileges. Your current role is <strong>{user?.role}</strong>.
        </p>
      </div>
    );
  }

  const stats = overviewData?.stats;

  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col gap-8">
      {/* Header */}
      <div className="pb-5 border-b border-[#263B5E]">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="warning">ADMINISTRATION</Badge>
          <span className="text-xs text-[#94A3B8] font-mono">Governance &amp; Fleet Operations</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
          System Administration Console
        </h1>
        <p className="text-xs sm:text-sm text-[#94A3B8] mt-1">
          Operational monitoring, user management, machine-learning models, and centralized audit ledger.
        </p>
      </div>

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card elevated className="p-4 flex flex-col justify-between hover:border-[#38BDF8]/40] transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs text-[#94A3B8] font-medium font-mono uppercase">
              Total Users
            </span>
            <Users className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <span className="text-2xl font-extrabold font-mono text-[#F8FAFC] mt-2">
            {stats?.totalUsers ?? "—"}
          </span>
          <span className="text-[11px] text-[#94A3B8] mt-1">
            {stats?.enrolledUsers ?? 0} profiles ready
          </span>
        </Card>

        <Card elevated className="p-4 flex flex-col justify-between hover:border-[#38BDF8]/40] transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs text-[#94A3B8] font-medium font-mono uppercase">
              Enrolled Samples
            </span>
            <Activity className="w-4 h-4 text-[#22C55E]" />
          </div>
          <span className="text-2xl font-extrabold font-mono text-[#22C55E] mt-2">
            {stats?.totalEnrollmentSamples ?? "—"}
          </span>
          <span className="text-[11px] text-[#94A3B8] mt-1">10D feature vectors</span>
        </Card>

        <Card elevated className="p-4 flex flex-col justify-between hover:border-[#38BDF8]/40] transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs text-[#94A3B8] font-medium font-mono uppercase">
              Evaluations
            </span>
            <ShieldCheck className="w-4 h-4 text-[#FF6A00]" />
          </div>
          <span className="text-2xl font-extrabold font-mono text-[#FF6A00] mt-2">
            {stats?.totalVerificationEvents ?? "—"}
          </span>
          <span className="text-[11px] text-[#94A3B8] mt-1">
            {stats?.recentVerificationDecisions?.match ?? 0} matches recorded
          </span>
        </Card>

        <Card elevated className="p-4 flex flex-col justify-between hover:border-[#38BDF8]/40] transition-all">
          <div className="flex items-start justify-between">
            <span className="text-xs text-[#94A3B8] font-medium font-mono uppercase">
              ML Engine
            </span>
            <Cpu className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="mt-2">
            {stats?.mlServiceStatus === "healthy" ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                HEALTHY
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
                STANDALONE
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#94A3B8] mt-1 font-mono truncate">
            {stats?.activeModelVersion || "v1.2.0-robust"}
          </span>
        </Card>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-[#263B5E] pb-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "users"
              ? "bg-[#1A2A44] text-[#FF6A00] border border-[#FF6A00]/30 shadow-sm font-semibold"
              : "text-[#94A3B8] hover:text-[#F8FAFC]"
          }`}
        >
          <Users className="w-3.5 h-3.5" /> Users Directory
        </button>
        <button
          onClick={() => setActiveTab("models")}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "models"
              ? "bg-[#1A2A44] text-[#FF6A00] border border-[#FF6A00]/30 shadow-sm font-semibold"
              : "text-[#94A3B8] hover:text-[#F8FAFC]"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" /> Model Registry
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === "audit"
              ? "bg-[#1A2A44] text-[#FF6A00] border border-[#FF6A00]/30 shadow-sm font-semibold"
              : "text-[#94A3B8] hover:text-[#F8FAFC]"
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Audit Ledger
        </button>
      </div>

      {/* Tab 1: Users Directory */}
      {activeTab === "users" && (
        <Card elevated className="p-0 overflow-hidden">
          {isUsersLoading ? (
            <div className="py-12 text-center text-xs text-[#94A3B8]">Loading user directory...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#0B1220] border-b border-[#263B5E] text-[#94A3B8] font-mono font-medium">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Profile Status</th>
                    <th className="py-3 px-4 font-mono">Samples</th>
                    <th className="py-3 px-4 text-right">Role Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263B5E]/50">
                  {usersData?.users?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-[#1A2A44]/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-[#F8FAFC]">{u.username}</td>
                      <td className="py-3 px-4 text-[#94A3B8] font-mono">{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                            u.role === "admin"
                              ? "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 font-bold"
                              : "bg-[#0B1220] text-[#94A3B8] border border-[#263B5E]"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-[#94A3B8] font-mono">
                          {u.profileStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-[#F8FAFC]">
                        {u.sampleCount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {u.id !== user?.id && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() =>
                              roleMutation.mutate({
                                userId: u.id,
                                role: u.role === "admin" ? "user" : "admin",
                              })
                            }
                            isLoading={roleMutation.isPending}
                            className="text-[11px] text-[#38BDF8] hover:bg-[#38BDF8]/10"
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
            <div className="py-12 text-center text-xs text-[#94A3B8]">Loading model artifacts...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#0B1220] border-b border-[#263B5E] text-[#94A3B8] font-mono font-medium">
                    <th className="py-3 px-4">Model Version</th>
                    <th className="py-3 px-4">Deployment Status</th>
                    <th className="py-3 px-4 font-mono">EER</th>
                    <th className="py-3 px-4 font-mono">FAR / FRR</th>
                    <th className="py-3 px-4 font-mono">ROC-AUC</th>
                    <th className="py-3 px-4">Evaluated Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263B5E]/50 font-mono">
                  {modelsData?.models?.map((m: any) => (
                    <tr key={m._id} className="hover:bg-[#1A2A44]/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#38BDF8]">{m.modelVersion}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30 uppercase font-bold">
                          {m.deploymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#F8FAFC]">
                        {m.evaluationMetrics ? `${(m.evaluationMetrics.eer * 100).toFixed(1)}%` : "—"}
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8]">
                        {m.evaluationMetrics
                          ? `${(m.evaluationMetrics.far * 100).toFixed(1)}% / ${(m.evaluationMetrics.frr * 100).toFixed(1)}%`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-[#FF6A00]">
                        {m.evaluationMetrics?.rocAuc?.toFixed(3) || "—"}
                      </td>
                      <td className="py-3 px-4 text-[#94A3B8]">
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
            <div className="py-12 text-center text-xs text-[#94A3B8]">Loading audit ledger...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#0B1220] border-b border-[#263B5E] text-[#94A3B8] font-mono font-medium">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Resource</th>
                    <th className="py-3 px-4 font-mono">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#263B5E]/50 font-mono text-[11px]">
                  {auditData?.events?.map((ev: any) => (
                    <tr key={ev._id} className="hover:bg-[#1A2A44]/40 transition-colors">
                      <td className="py-2.5 px-4 text-[#94A3B8] whitespace-nowrap">
                        {formatDate(ev.timestamp)}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[#38BDF8]">{ev.action}</td>
                      <td className="py-2.5 px-4 text-[#F8FAFC]">{ev.actorUsername || "system"}</td>
                      <td className="py-2.5 px-4 text-[#94A3B8]">{ev.resourceType}</td>
                      <td className="py-2.5 px-4 text-[#94A3B8]">{ev.ipAddress || "—"}</td>
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
