import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import {
  Activity,
  Shield,
  UserCheck,
  History,
  BarChart3,
  BookOpen,
  Cpu,
  Settings,
  LogOut,
  Search,
  Zap,
  ArrowRight,
  Terminal,
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  group: "navigation" | "actions";
  action: () => void;
  adminOnly?: boolean;
}

export function CommandPalette({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: "nav-dashboard",
      title: "Command Center Dashboard",
      description: "System overview, operational status & telemetry",
      icon: Activity,
      group: "navigation",
      action: () => {
        navigate("/dashboard");
        onClose();
      },
    },
    {
      id: "nav-live-monitor",
      title: "Live Behavioural Monitor",
      description: "Real-time keystroke cadence & waveform",
      icon: Zap,
      group: "navigation",
      action: () => {
        navigate("/dashboard#live-monitor");
        onClose();
        setTimeout(() => {
          const el = document.getElementById("live-monitor");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      },
    },
    {
      id: "nav-verification",
      title: "Continuous Verification Workspace",
      description: "Test typing dynamics against Mahalanobis baseline",
      icon: Shield,
      group: "navigation",
      action: () => {
        navigate("/verification");
        onClose();
      },
    },
    {
      id: "nav-enrollment",
      title: "Biometric Enrollment Studio",
      description: "Capture fixed-string or freeform baseline samples",
      icon: UserCheck,
      group: "navigation",
      action: () => {
        navigate("/enrollment");
        onClose();
      },
    },
    {
      id: "nav-history",
      title: "Verification Audit History",
      description: "Historical match decisions, scores & anomalous events",
      icon: History,
      group: "navigation",
      action: () => {
        navigate("/history");
        onClose();
      },
    },
    {
      id: "nav-analytics",
      title: "Behavioural Analytics & Distributions",
      description: "Hold & flight time histograms, risk timelines",
      icon: BarChart3,
      group: "navigation",
      action: () => {
        navigate("/analytics");
        onClose();
      },
    },
    {
      id: "nav-docs",
      title: "Security & API Documentation",
      description: "Mahalanobis distance formula, ROC-AUC, API endpoints",
      icon: BookOpen,
      group: "navigation",
      action: () => {
        navigate("/docs");
        onClose();
      },
    },
    {
      id: "nav-admin",
      title: "Administration Panel",
      description: "User directories, model retraining & fleet controls",
      icon: Cpu,
      group: "navigation",
      adminOnly: true,
      action: () => {
        navigate("/admin");
        onClose();
      },
    },
    {
      id: "nav-settings",
      title: "Account & Biometric Privacy Settings",
      description: "Manage credentials, GDPR consent & biometric profile",
      icon: Settings,
      group: "navigation",
      action: () => {
        navigate("/settings");
        onClose();
      },
    },
    {
      id: "action-verify",
      title: "Quick Action: Start Verification",
      description: "Direct jump to biometric evaluation workspace",
      icon: Shield,
      group: "actions",
      action: () => {
        navigate("/verification");
        onClose();
      },
    },
    {
      id: "action-logout",
      title: "Quick Action: Terminate Session",
      description: "Safely sign out and clear active auth token",
      icon: LogOut,
      group: "actions",
      action: async () => {
        onClose();
        await logout();
        navigate("/login");
      },
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    if (cmd.adminOnly && user?.role !== "admin") return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      cmd.description.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      filteredCommands[selectedIndex].action();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-[#080B12]/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#111927] border border-[#243247] rounded-2xl shadow-2xl overflow-hidden text-[#F4F7FC] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#243247] gap-3 bg-[#0D1320]/60">
          <Search className="w-5 h-5 text-[#35D6E8]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or navigate... (e.g. 'Verification', 'Live Monitor', 'Docs')"
            className="w-full bg-transparent border-0 outline-none text-[#F4F7FC] placeholder-[#94A3B8]/60 text-sm"
          />
          <kbd className="hidden sm:inline-block text-[10px] font-mono uppercase bg-[#172235] text-[#94A3B8] border border-[#243247] px-2 py-0.5 rounded-md">
            Esc
          </kbd>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#243247]/40">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#94A3B8]">
              No commands matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd, idx) => {
                const Icon = cmd.icon;
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    onClick={() => cmd.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all text-xs ${
                      isSelected
                        ? "bg-[#172235] text-[#35D6E8] border border-[#35D6E8]/30 shadow-sm"
                        : "text-[#F4F7FC] hover:bg-[#172235]/60 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg border ${
                          isSelected
                            ? "bg-[#35D6E8]/10 border-[#35D6E8]/40 text-[#35D6E8]"
                            : "bg-[#0D1320] border-[#243247] text-[#94A3B8]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div
                          className={`font-medium ${
                            isSelected ? "text-[#F4F7FC]" : "text-[#F4F7FC]"
                          }`}
                        >
                          {cmd.title}
                        </div>
                        <div className="text-[11px] text-[#94A3B8] truncate">
                          {cmd.description}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#94A3B8] shrink-0 ml-2">
                      {cmd.group === "actions" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#35D6E8]/10 text-[#35D6E8] border border-[#35D6E8]/20 font-mono">
                          Action
                        </span>
                      )}
                      <ArrowRight
                        className={`w-3.5 h-3.5 transition-transform ${
                          isSelected
                            ? "text-[#35D6E8] translate-x-0.5"
                            : "opacity-0"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-[#243247] bg-[#0D1320]/80 flex items-center justify-between text-[11px] text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#35D6E8]" />
            <span>OBSIDIAN PULSE Command Center</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
        </div>
      </div>
    </div>
  );
}

