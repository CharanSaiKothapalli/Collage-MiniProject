import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { api } from "../lib/api.js";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Input } from "../components/ui/Input.js";
import { Button } from "../components/ui/Button.js";
import { Badge } from "../components/ui/Badge.js";
import {
  Lock,
  Download,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  User,
  KeyRound,
} from "lucide-react";

export function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Data management state
  const [isExporting, setIsExporting] = useState(false);
  const [dataMsg, setDataMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setPasswordMsg({ type: "success", text: "Password changed successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setDataMsg(null);
    try {
      const blob = await api.data.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `keytrace-export-${user?.username || "user"}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setDataMsg({ type: "success", text: "Data export successfully downloaded." });
    } catch (err: any) {
      setDataMsg({ type: "error", text: err.message || "Failed to export data." });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete your behavioral typing profile? All enrolled samples will be permanently destroyed."
      )
    ) {
      return;
    }

    try {
      await api.data.deleteProfile();
      await refreshUser();
      setDataMsg({
        type: "success",
        text: "Behavioral typing profile and samples permanently deleted.",
      });
    } catch (err: any) {
      setDataMsg({ type: "error", text: err.message || "Failed to delete profile." });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      `To permanently delete your account and all associated data, please type your username "${user?.username}":`
    );

    if (confirmation !== user?.username) {
      alert("Account deletion canceled: username did not match.");
      return;
    }

    try {
      await api.data.deleteAccount();
      await logout();
      navigate("/");
    } catch (err: any) {
      alert(err.message || "Failed to delete account.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 flex flex-col gap-8">
      <div className="pb-5 border-b border-white/[0.08]">
        <Badge variant="cyan" className="mb-2">
          User Settings
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Account &amp; Data Management
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Manage your credentials, exercise your privacy rights, and export or delete biometric data.
        </p>
      </div>

      {dataMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs backdrop-blur-md shadow-sm ${
            dataMsg.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {dataMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span className="font-medium">{dataMsg.text}</span>
        </div>
      )}

      {/* Profile Overview */}
      <Card elevated className="p-6 flex flex-col gap-4">
        <CardTitle className="text-base flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-400" /> Account Identity
        </CardTitle>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
            <span className="text-zinc-500 block text-[11px] font-sans">Username</span>
            <span className="text-sm font-semibold text-zinc-100 mt-1 block font-mono">{user?.username}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
            <span className="text-zinc-500 block text-[11px] font-sans">Email Address</span>
            <span className="text-sm font-semibold text-zinc-100 mt-1 block truncate font-mono">{user?.email}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-white/[0.06]">
            <span className="text-zinc-500 block text-[11px] font-sans">System Role</span>
            <span className="text-sm font-semibold text-amber-400 mt-1 block uppercase font-mono">{user?.role}</span>
          </div>
        </div>
      </Card>

      {/* Change Password Card */}
      <Card elevated className="p-6 flex flex-col gap-5">
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-400" /> Change Password
        </CardTitle>

        {passwordMsg && (
          <div
            className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
              passwordMsg.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-rose-500/10 border-rose-500/30 text-rose-400"
            }`}
          >
            <span>{passwordMsg.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Current Password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <Input
            label="New Password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            label="Confirm New Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <div className="sm:col-span-3 flex justify-end mt-2">
            <Button type="submit" variant="primary" size="md" isLoading={isChangingPassword}>
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Privacy & Data Controls Card */}
      <Card elevated className="p-6 flex flex-col gap-5">
        <CardTitle className="text-base flex items-center gap-2">
          <Download className="w-4 h-4 text-indigo-400" /> Export Personal Telemetry (GDPR Art. 20)
        </CardTitle>
        <CardDescription className="text-xs">
          Download a machine-readable JSON archive of your account metadata, consent records, enrolled timing feature vectors, and verification history.
        </CardDescription>

        <div className="flex justify-start">
          <Button
            variant="secondary"
            size="md"
            onClick={handleExportData}
            isLoading={isExporting}
          >
            <Download className="w-4 h-4" /> Download JSON Archive
          </Button>
        </div>
      </Card>

      {/* Danger Zone Card */}
      <Card elevated className="p-6 flex flex-col gap-5 border-rose-500/20 bg-rose-500/5">
        <div className="flex items-center gap-2 text-rose-400">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="text-base font-semibold">Danger Zone</h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-rose-500/20">
          <div>
            <span className="text-sm font-semibold text-white block">
              Delete Behavioral Profile
            </span>
            <span className="text-xs text-zinc-400">
              Purges all 10 enrolled timing samples while keeping your login credentials.
            </span>
          </div>
          <Button variant="danger" size="sm" onClick={handleDeleteProfile}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Purge Profile
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-rose-500/20">
          <div>
            <span className="text-sm font-semibold text-white block">
              Permanently Delete Account
            </span>
            <span className="text-xs text-zinc-400">
              Completely erases your user account, consent records, and authentication audit logs.
            </span>
          </div>
          <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Erase Account
          </Button>
        </div>
      </Card>
    </div>
  );
}
