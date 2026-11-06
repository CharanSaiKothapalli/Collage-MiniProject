import React, { useState } from "react";
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
  Menu,
  X,
  Search,
  Zap,
} from "lucide-react";
import { PROFILE_STATUS } from "@keytrace/shared";

interface NavbarProps {
  onOpenPalette?: () => void;
}

export function Navbar({ onOpenPalette }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLiveMonitorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname !== "/dashboard") {
      navigate("/dashboard#live-monitor");
      setTimeout(() => {
        const el = document.getElementById("live-monitor");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } else {
      const el = document.getElementById("live-monitor");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#243247] bg-[#080B12]/85 backdrop-blur-xl select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          to={user ? "/dashboard" : "/"}
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-3 group shrink-0"
        >
          <div className="w-8 h-8 rounded-xl bg-[#111927] border border-[#243247] flex items-center justify-center text-[#35D6E8] shadow-sm group-hover:border-[#35D6E8]/40 transition-all">
            <Shield className="w-4 h-4 text-[#35D6E8]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-[#F4F7FC] text-sm">
                KEYTRACE
              </span>
              <span className="text-[10px] text-[#32D6A0] bg-[#32D6A0]/10 border border-[#32D6A0]/20 rounded-full px-2 py-0.5 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#32D6A0] animate-pulse" />
                SYSTEM OPERATIONAL
              </span>
            </div>
            <span className="text-[10px] text-[#94A3B8] hidden sm:inline leading-none font-mono">
              Continuous Biometric Defense
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        {user ? (
          <nav className="hidden xl:flex items-center gap-1 text-xs font-medium">
            <Link
              to="/dashboard"
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                isActive("/dashboard") && location.hash !== "#live-monitor"
                  ? "bg-[#172235] text-[#35D6E8] border border-[#243247]"
                  : "text-[#94A3B8] hover:text-[#F4F7FC] hover:bg-[#111927]"
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Dashboard
            </Link>

            <a
              href="#live-monitor"
              onClick={handleLiveMonitorClick}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                location.hash === "#live-monitor"
                  ? "bg-[#172235] text-[#35D6E8] border border-[#243247]"
                  : "text-[#94A3B8] hover:text-[#F4F7FC] hover:bg-[#111927]"
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-[#35D6E8]" /> Live Monitor
            </a>

            <Link
              to="/enrollment"
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                isActive("/enrollment")
                  ? "bg-[#172235] text-[#35D6E8] border border-[#243247]"
                  : "text-[#94A3B8] hover:text-[#F4F7FC] hover:bg-[#111927]"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" /> Enrollment
            </Link>

            <Link
              to="/verification"
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                isActive("/verification")
                  ? "bg-[#172235] text-[#35D6E8] border border-[#243247]"
                  : "text-[#94A3B8] hover:text-[#F4F7FC] hover:bg-[#111927]"
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Verification
            </Link>

            <Link
              to="/history"
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                isActive("/history")
                  ? "bg-[#172235] text-[#35D6E8] border border-[#243247]"
                  : "text-[#94A3B8] hover:text-[#F4F7FC] hover:bg-[#111927]"
              }`}
            >
              <History className="w-3.5 h-3.5" /> History
            </Link>

            <Link
              to="/analytics"
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                isActive("/analytics")
                  ? "bg-[#172235] text-[#35D6E8] border border-[#243247]"
                  : "text-[#94A3B8] hover:text-[#F4F7FC] hover:bg-[#111927]"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Analytics
            </Link>

            <Link
              to="/docs"
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                isActive("/docs")
                  ? "bg-[#172235] text-[#35D6E8] border border-[#243247]"
                  : "text-[#94A3B8] hover:text-[#F4F7FC] hover:bg-[#111927]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Docs
            </Link>

            {user.role === "admin" && (
              <Link
                to="/admin"
                className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive("/admin")
                    ? "bg-[#FFBF55]/10 text-[#FFBF55] border border-[#FFBF55]/30"
                    : "text-[#FFBF55]/80 hover:text-[#FFBF55] hover:bg-[#FFBF55]/10"
                }`}
              >
                <Cpu className="w-3.5 h-3.5" /> Admin
              </Link>
            )}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-6 text-xs text-[#94A3B8]">
            <Link to="/#how-it-works" className="hover:text-[#F4F7FC] transition-colors">
              How It Works
            </Link>
            <Link to="/#architecture" className="hover:text-[#F4F7FC] transition-colors">
              Architecture
            </Link>
            <Link to="/docs" className="hover:text-[#F4F7FC] transition-colors flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Documentation
            </Link>
          </nav>
        )}

        {/* Right action group (Desktop) */}
        <div className="hidden sm:flex items-center gap-2.5">
          {/* Quick Command Palette Button (Cmd+K) */}
          <button
            type="button"
            onClick={onOpenPalette || (() => window.dispatchEvent(new CustomEvent("open-command-palette")))}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#111927] hover:bg-[#172235] border border-[#243247] hover:border-[#344560] text-xs text-[#94A3B8] hover:text-[#F4F7FC] transition-all"
            title="Search commands (⌘K / Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#35D6E8]" />
            <span className="hidden md:inline">Search</span>
            <kbd className="font-mono text-[10px] bg-[#080B12] px-1.5 py-0.5 rounded border border-[#243247] text-[#94A3B8]">
              ⌘K
            </kbd>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              {/* Profile status pill */}
              <div className="hidden lg:flex items-center">
                {user.profileStatus === PROFILE_STATUS.READY_FOR_TESTING ? (
                  <Badge variant="match">Profile Baseline Ready</Badge>
                ) : user.profileStatus === PROFILE_STATUS.ENROLLING ? (
                  <Badge variant="review">{user.sampleCount}/10 Baseline Enrolling</Badge>
                ) : (
                  <Badge variant="neutral">Not Enrolled</Badge>
                )}
              </div>

              <Link
                to="/settings"
                className="p-2 rounded-lg bg-[#111927] hover:bg-[#172235] text-[#94A3B8] hover:text-[#F4F7FC] border border-[#243247] transition-all"
                title="Profile & Biometric Settings"
              >
                <Settings className="w-4 h-4" />
              </Link>

              <Button
                variant="ghost"
                size="xs"
                onClick={handleLogout}
                className="text-[#94A3B8] hover:text-[#FF647C] hover:bg-[#FF647C]/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
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

        {/* Mobile Hamburger Toggle Button */}
        <div className="flex xl:hidden items-center gap-2">
          <button
            type="button"
            onClick={onOpenPalette || (() => window.dispatchEvent(new CustomEvent("open-command-palette")))}
            className="p-2 rounded-lg bg-[#111927] border border-[#243247] text-[#94A3B8] hover:text-[#F4F7FC]"
            aria-label="Open command palette"
          >
            <Search className="w-4 h-4 text-[#35D6E8]" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-[#111927] border border-[#243247] text-[#F4F7FC]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-[#243247] bg-[#080B12]/98 backdrop-blur-2xl px-4 py-4 shadow-2xl flex flex-col gap-2 text-sm animate-in slide-in-from-top-2 duration-150">
          {user ? (
            <>
              <div className="pb-3 border-b border-[#243247] flex items-center justify-between text-[#94A3B8]">
                <div className="flex flex-col">
                  <span className="text-[#F4F7FC] font-medium text-xs">{user.username}</span>
                  <span className="text-[10px] text-[#35D6E8] font-mono capitalize">{user.role}</span>
                </div>
                {user.profileStatus === PROFILE_STATUS.READY_FOR_TESTING ? (
                  <Badge variant="match">Baseline Ready</Badge>
                ) : (
                  <Badge variant="review">{user.sampleCount}/10 Samples</Badge>
                )}
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs ${
                  isActive("/dashboard") ? "bg-[#172235] text-[#35D6E8] font-medium" : "text-[#94A3B8] hover:text-[#F4F7FC]"
                }`}
              >
                <Activity className="w-4 h-4" /> Dashboard
              </Link>
              <a
                href="#live-monitor"
                onClick={handleLiveMonitorClick}
                className="px-3 py-2 rounded-lg flex items-center gap-2 text-xs text-[#94A3B8] hover:text-[#F4F7FC]"
              >
                <Zap className="w-4 h-4 text-[#35D6E8]" /> Live Monitor
              </a>
              <Link
                to="/enrollment"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs ${
                  isActive("/enrollment") ? "bg-[#172235] text-[#35D6E8] font-medium" : "text-[#94A3B8] hover:text-[#F4F7FC]"
                }`}
              >
                <UserCheck className="w-4 h-4" /> Enrollment
              </Link>
              <Link
                to="/verification"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs ${
                  isActive("/verification") ? "bg-[#172235] text-[#35D6E8] font-medium" : "text-[#94A3B8] hover:text-[#F4F7FC]"
                }`}
              >
                <Shield className="w-4 h-4" /> Verification
              </Link>
              <Link
                to="/history"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs ${
                  isActive("/history") ? "bg-[#172235] text-[#35D6E8] font-medium" : "text-[#94A3B8] hover:text-[#F4F7FC]"
                }`}
              >
                <History className="w-4 h-4" /> History
              </Link>
              <Link
                to="/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs ${
                  isActive("/analytics") ? "bg-[#172235] text-[#35D6E8] font-medium" : "text-[#94A3B8] hover:text-[#F4F7FC]"
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Analytics
              </Link>
              <Link
                to="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs ${
                  isActive("/docs") ? "bg-[#172235] text-[#35D6E8] font-medium" : "text-[#94A3B8] hover:text-[#F4F7FC]"
                }`}
              >
                <BookOpen className="w-4 h-4" /> Documentation
              </Link>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs ${
                    isActive("/admin") ? "bg-[#FFBF55]/10 text-[#FFBF55] font-medium" : "text-[#FFBF55]"
                  }`}
                >
                  <Cpu className="w-4 h-4" /> Administration
                </Link>
              )}
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg flex items-center gap-2 text-xs ${
                  isActive("/settings") ? "bg-[#172235] text-[#35D6E8] font-medium" : "text-[#94A3B8] hover:text-[#F4F7FC]"
                }`}
              >
                <Settings className="w-4 h-4" /> Settings & Privacy
              </Link>
              <div className="pt-2 border-t border-[#243247]">
                <Button variant="danger" size="sm" onClick={handleLogout} className="w-full justify-center">
                  <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign Out
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-[#94A3B8] hover:text-[#F4F7FC] flex items-center gap-2 text-xs"
              >
                <BookOpen className="w-4 h-4 text-[#35D6E8]" /> Documentation
              </Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="md" className="w-full justify-center">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="md" className="w-full justify-center">
                  Create Account
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
