import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";
import { Button } from "../ui/Button.js";
import { Badge } from "../ui/Badge.js";
import {
  Shield,
  Activity,
  UserCheck,
  History,
  BarChart3,
  Settings,
  LogOut,
  Cpu,
  BookOpen,
} from "lucide-react";
import { PROFILE_STATUS } from "@keytrace/shared";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan-500/20 bg-[#07090e]/85 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.5)] select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 via-amber-500/10 to-indigo-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] group-hover:shadow-[0_0_22px_rgba(6,182,212,0.55)] group-hover:border-cyan-400 transition-all">
            <Shield className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight font-mono text-base leading-none flex items-center gap-2">
              <span className="bg-gradient-to-r from-amber-400 via-orange-300 to-cyan-400 bg-clip-text text-transparent font-extrabold">
                KEYTRACE
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)] font-semibold">
                v1.2
              </span>
            </span>
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest hidden sm:inline mt-0.5">
              Biometric Dynamics
            </span>
          </div>
        </Link>

        {/* Navigation items */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1.5 text-xs font-mono uppercase">
            <Link
              to="/dashboard"
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 border ${
                isActive("/dashboard")
                  ? "bg-cyan-950/50 text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-semibold"
                  : "border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> Dashboard
            </Link>

            <Link
              to="/enrollment"
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 border ${
                isActive("/enrollment")
                  ? "bg-cyan-950/50 text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-semibold"
                  : "border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Enrolment
            </Link>

            <Link
              to="/verification"
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 border ${
                isActive("/verification")
                  ? "bg-amber-950/50 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-semibold"
                  : "border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" /> Verification
            </Link>

            <Link
              to="/history"
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 border ${
                isActive("/history")
                  ? "bg-cyan-950/50 text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-semibold"
                  : "border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <History className="w-3.5 h-3.5 text-cyan-400" /> History
            </Link>

            <Link
              to="/analytics"
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 border ${
                isActive("/analytics")
                  ? "bg-cyan-950/50 text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] font-semibold"
                  : "border-transparent text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-cyan-400" /> Analytics
            </Link>

            <Link
              to="/docs"
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 border ${
                isActive("/docs")
                  ? "bg-sky-950/50 text-sky-300 border-sky-500/60 shadow-[0_0_12px_rgba(56,189,248,0.25)] font-semibold"
                  : "border-transparent text-slate-300 hover:text-sky-300 hover:bg-slate-800/60"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" /> Docs
            </Link>

            {user.role === "admin" && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 border ${
                  isActive("/admin")
                    ? "bg-amber-950/50 text-amber-300 border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)] font-semibold"
                    : "border-transparent text-amber-400/90 hover:text-amber-300 hover:bg-amber-950/20"
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-amber-400" /> Admin
              </Link>
            )}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-5 text-xs font-mono uppercase text-slate-300">
            <Link to="/#how-it-works" className="hover:text-cyan-400 transition-colors">
              [ 01 // HOW IT WORKS ]
            </Link>
            <Link to="/#architecture" className="hover:text-cyan-400 transition-colors">
              [ 02 // ARCHITECTURE ]
            </Link>
            <Link to="/docs" className="hover:text-amber-400 text-slate-200 transition-colors flex items-center gap-1.5 font-bold">
              <BookOpen className="w-3.5 h-3.5 text-amber-400" /> [ 03 // DOCUMENTATION ]
            </Link>
          </nav>
        )}

        {/* Right action group */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              {/* Profile status pill */}
              <div className="hidden lg:flex items-center">
                {user.profileStatus === PROFILE_STATUS.READY_FOR_TESTING ? (
                  <Badge variant="match">PROFILE READY</Badge>
                ) : user.profileStatus === PROFILE_STATUS.ENROLLING ? (
                  <Badge variant="review">{user.sampleCount}/10 ENROLLING</Badge>
                ) : (
                  <Badge variant="neutral">NOT ENROLLED</Badge>
                )}
              </div>

              <Link
                to="/settings"
                className="p-2 rounded-md bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-cyan-300 border border-slate-700/80 hover:border-cyan-500/50 transition-all shadow-sm"
                title="Settings & Privacy"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>

              <Button
                variant="ghost"
                size="xs"
                onClick={handleLogout}
                className="text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
