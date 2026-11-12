import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth.js";
import { api } from "../../lib/api.js";
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
  ChevronDown,
  Lock,
  User,
  ExternalLink,
} from "lucide-react";
import { PROFILE_STATUS } from "@keytrace/shared";

interface NavItem {
  name: string;
  shortName?: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

interface NavbarProps {
  onOpenPalette?: () => void;
}

export function Navbar({ onOpenPalette }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Live profile & baseline status from backend
  const { data: enrollmentStatus } = useQuery({
    queryKey: ["enrollment-status"],
    queryFn: () => api.enrollment.getStatus(),
    enabled: !!user,
    staleTime: 5000,
  });

  // Calculate live verified status
  const isBaselineReady =
    enrollmentStatus?.isReady ||
    enrollmentStatus?.status === PROFILE_STATUS.READY_FOR_TESTING ||
    user?.profileStatus === PROFILE_STATUS.READY_FOR_TESTING;

  const currentCount =
    enrollmentStatus?.count ??
    (enrollmentStatus && typeof enrollmentStatus.calibrationCount === "number" && typeof enrollmentStatus.naturalCount === "number"
      ? enrollmentStatus.calibrationCount + enrollmentStatus.naturalCount
      : null) ??
    user?.sampleCount ??
    0;

  const currentStatus = enrollmentStatus?.status || user?.profileStatus || PROFILE_STATUS.NOT_ENROLLED;

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserDropdownOpen(false);
        setMobileDrawerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileDrawerOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname, location.hash]);

  // Reliable scroll offset when navigating or reloading to #live-monitor
  useEffect(() => {
    if (location.pathname === "/dashboard" && location.hash === "#live-monitor") {
      const timer = setTimeout(() => {
        const el = document.getElementById("live-monitor");
        if (el) {
          const headerEl = headerRef.current || document.querySelector("header");
          const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 116;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - (headerHeight + 20);
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: "smooth",
          });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileDrawerOpen(false);
    await logout();
    navigate("/login");
  };

  const handleCommandPaletteClick = () => {
    if (onOpenPalette) {
      onOpenPalette();
    } else {
      window.dispatchEvent(new CustomEvent("open-command-palette"));
    }
  };

  // Smooth scroll handler for Live Monitor anchor with dynamic measured navbar offset
  const handleLiveMonitorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileDrawerOpen(false);
    const scrollWithOffset = () => {
      const el = document.getElementById("live-monitor");
      if (el) {
        const headerEl = headerRef.current || document.querySelector("header");
        const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : 116;
        const elementPosition = el.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - (headerHeight + 20);
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: "smooth",
        });
        navigate("/dashboard#live-monitor");
      }
    };

    if (location.pathname !== "/dashboard") {
      navigate("/dashboard#live-monitor");
      setTimeout(scrollWithOffset, 200);
    } else {
      scrollWithOffset();
    }
  };

  const handleDashboardClick = (e: React.MouseEvent) => {
    if (location.pathname === "/dashboard" && location.hash === "#live-monitor") {
      e.preventDefault();
      navigate("/dashboard");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Primary 7 navigation items
  const primaryNavItems: NavItem[] = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: Activity,
      isActive: location.pathname === "/dashboard" && location.hash !== "#live-monitor",
      onClick: handleDashboardClick,
    },
    {
      name: "Live Monitor",
      path: "/dashboard#live-monitor",
      icon: Zap,
      isActive: location.pathname === "/dashboard" && location.hash === "#live-monitor",
      onClick: handleLiveMonitorClick,
    },
    {
      name: "Enrollment",
      path: "/enrollment",
      icon: UserCheck,
      isActive: location.pathname.startsWith("/enrollment"),
    },
    {
      name: "Verification",
      path: "/verification",
      icon: Shield,
      isActive: location.pathname.startsWith("/verification"),
    },
    {
      name: "History",
      path: "/history",
      icon: History,
      isActive: location.pathname.startsWith("/history"),
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: BarChart3,
      isActive: location.pathname.startsWith("/analytics"),
    },
    {
      name: "Documentation",
      shortName: "Docs",
      path: "/docs",
      icon: BookOpen,
      isActive: location.pathname.startsWith("/docs"),
    },
  ];

  // Public items for unauthenticated users
  const publicNavItems: NavItem[] = [
    {
      name: "Overview",
      path: "/#how-it-works",
      icon: Activity,
      isActive: location.pathname === "/" && location.hash !== "#architecture",
    },
    {
      name: "Architecture",
      path: "/#architecture",
      icon: Shield,
      isActive: location.hash === "#architecture",
    },
    {
      name: "Documentation",
      shortName: "Docs",
      path: "/docs",
      icon: BookOpen,
      isActive: location.pathname.startsWith("/docs"),
    },
    {
      name: "Informed Consent",
      path: "/consent",
      icon: Lock,
      isActive: location.pathname.startsWith("/consent"),
    },
  ];

  const userInitials = user?.username ? user.username.slice(0, 2).toUpperCase() : "KT";

  return (
    <header ref={headerRef} className="sticky top-0 z-40 w-full select-none shadow-md">
      {/* ======================================================== */}
      {/* LEVEL 1 — BRAND AND UTILITY BAR (approx 64px)            */}
      {/* ======================================================== */}
      <div className="h-16 bg-[#0B1220] border-b border-[#263B5E] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
          {/* Left section: Brand Emblem, Wordmark, Subtitle & Operational Dot */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to={user ? "/dashboard" : "/"}
              className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]/50 rounded-[10px]"
            >
              <div className="w-8 h-8 rounded-[9px] bg-[#111B2E] border border-[#263B5E] flex items-center justify-center text-[#FF6A00] group-hover:border-[#FF6A00]/50 group-hover:shadow-[0_0_12px_rgba(255,106,0,0.25)] transition-all">
                <Shield className="w-4 h-4 text-[#FF6A00]" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold tracking-tight text-[#F8FAFC] text-sm">
                    KEYTRACE
                  </span>
                </div>
                <span className="text-[11px] text-[#64748B] font-mono leading-none tracking-tight hidden sm:inline">
                  Behavioural Security Platform
                </span>
              </div>
            </Link>

            {/* Subtle System Operational Indicator (Compact, Non-Competing) */}
            <div className="hidden sm:flex items-center ml-3 pl-3 border-l border-[#263B5E]">
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20 text-[10px] font-mono font-medium text-[#22C55E]"
                title="Continuous Biometric Engine Operational"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                <span>OPERATIONAL</span>
              </div>
            </div>
          </div>

          {/* Right section: Global Search, User Avatar & Dropdown */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Global Search / Command Palette (⌘K) */}
            <button
              type="button"
              onClick={handleCommandPaletteClick}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-[8px] bg-[#111B2E] hover:bg-[#1A2A44] border border-[#263B5E] hover:border-[#38BDF8]/40 text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]/50"
              title="Search commands (⌘K / Ctrl+K)"
              aria-label="Open command palette"
            >
              <Search className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="hidden md:inline text-xs">Search commands...</span>
              <span className="hidden sm:inline md:hidden text-xs">Search</span>
              <kbd className="font-mono text-[10px] bg-[#0B1220] px-1.5 py-0.5 rounded border border-[#263B5E] text-[#64748B] hidden sm:inline-block">
                ⌘K
              </kbd>
            </button>

            {/* User Dropdown / Authenticated State */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 pl-1 pr-1.5 sm:pr-2 py-1 rounded-[8px] hover:bg-[#1A2A44] border border-transparent hover:border-[#263B5E] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]/50"
                >
                  <div className="w-7 h-7 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/30 flex items-center justify-center text-[11px] font-mono font-semibold text-[#FF6A00]">
                    {userInitials}
                  </div>
                  <span className="text-xs font-medium text-[#F8FAFC] max-w-[120px] truncate hidden md:inline">
                    {user.username}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-150 ${
                      userDropdownOpen ? "rotate-180 text-[#FF6A00]" : ""
                    }`}
                  />
                </button>

                {/* Floating User Dropdown Card */}
                {userDropdownOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-64 bg-[#111B2E] border border-[#263B5E] rounded-[12px] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {/* User Profile Overview */}
                    <div className="px-3 py-2.5 bg-[#0B1220] rounded-[8px] border border-[#263B5E] mb-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#F8FAFC] truncate">
                          {user.username}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded capitalize font-medium ${
                            user.role === "admin"
                              ? "bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/20"
                              : "bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20"
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#64748B] truncate block mt-0.5">
                        {user.email}
                      </span>
                      <div className="mt-2 pt-1.5 border-t border-[#263B5E] flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
                        <span>Baseline:</span>
                        <span
                          className={
                            isBaselineReady
                              ? "text-[#22C55E]"
                              : currentCount > 0
                              ? "text-[#F59E0B]"
                              : "text-[#64748B]"
                          }
                        >
                          {isBaselineReady
                            ? "Active Ready"
                            : currentCount > 0
                            ? `${currentCount}/10 Enrolling`
                            : "Not Enrolled"}
                        </span>
                      </div>
                    </div>

                    {/* Admin Console Action (Separate & Non-Competing) */}
                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#FF6A00] hover:bg-[#FF6A00]/10 transition-colors my-0.5"
                      >
                        <Cpu className="w-4 h-4 text-[#FF6A00]" />
                        <span>Administration Console</span>
                      </Link>
                    )}

                    {/* Settings & Profile */}
                    <Link
                      to="/settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2A44] transition-colors my-0.5"
                    >
                      <Settings className="w-4 h-4 text-[#64748B]" />
                      <span>Account & Security</span>
                    </Link>

                    {/* Technical Documentation */}
                    <Link
                      to="/docs"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2A44] transition-colors my-0.5"
                    >
                      <BookOpen className="w-4 h-4 text-[#64748B]" />
                      <span>Documentation</span>
                    </Link>

                    {/* Divider */}
                    <div className="h-px bg-[#263B5E] my-1.5" />

                    {/* Sign Out Action */}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs font-medium text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-[#64748B] hover:text-[#EF4444]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
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

            {/* Mobile Hamburger Drawer Trigger */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="p-2 rounded-[8px] bg-[#111B2E] border border-[#263B5E] text-[#94A3B8] hover:text-[#F8FAFC] lg:hidden transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]/50"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileDrawerOpen}
            >
              {mobileDrawerOpen ? <X className="w-5 h-5 text-[#F8FAFC]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* LEVEL 2 — PRIMARY NAVIGATION ROW (approx 52px)           */}
      {/* ======================================================== */}
      <div className="hidden lg:block h-[52px] bg-[#111B2E] border-b border-[#263B5E] px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-2 xl:gap-4 overflow-x-auto no-scrollbar flex-nowrap">
          {/* Primary Navigation Items List */}
          <nav className="flex items-center gap-0.5 xl:gap-1.5 h-full shrink-0" aria-label="Main Navigation">
            {(user ? primaryNavItems : publicNavItems).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={item.onClick}
                  className={`group flex items-center gap-1 xl:gap-2 h-9 px-2 xl:px-3 rounded-[8px] text-xs font-medium transition-all relative select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]/50 ${
                    item.isActive
                      ? "bg-[#FF6A00]/[0.08] text-[#FF6A00] font-semibold"
                      : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1A2A44]/70"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 xl:w-[18px] xl:h-[18px] shrink-0 transition-colors ${
                      item.isActive
                        ? "text-[#FF6A00]"
                        : "text-[#64748B] group-hover:text-[#94A3B8]"
                    }`}
                  />
                  <span>
                    <span className="hidden xl:inline">{item.name}</span>
                    <span className="xl:hidden">{item.shortName || item.name}</span>
                  </span>
                  {/* Vibrant Orange Active Indicator */}
                  {item.isActive && (
                    <span className="absolute -bottom-[7.5px] inset-x-2 h-[2px] bg-[#FF6A00] rounded-full shadow-[0_0_8px_rgba(255,106,0,0.5)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Section: Refined Admin Console Button & Live Verified Biometric Badge */}
          {user && (
            <div className="flex items-center gap-2 xl:gap-3 shrink-0">
              {/* Refined Admin Console Button */}
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]/50 ${
                    location.pathname.startsWith("/admin")
                      ? "bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/30 shadow-sm"
                      : "text-[#94A3B8] hover:text-[#FF6A00] border border-[#263B5E] hover:border-[#FF6A00]/30 hover:bg-[#FF6A00]/[0.08]"
                  }`}
                  title="Administrator Management Console"
                >
                  <Cpu
                    className={`w-3.5 h-3.5 transition-colors ${
                      location.pathname.startsWith("/admin")
                        ? "text-[#FF6A00]"
                        : "text-[#FF6A00]/70 group-hover:text-[#FF6A00]"
                    }`}
                  />
                  <span className="hidden xl:inline">Admin Console</span>
                  <span className="xl:hidden">Admin</span>
                </Link>
              )}

              {/* Live Baseline Telemetry Status Tag */}
              {isBaselineReady ? (
                <div
                  className="flex items-center gap-1.5 text-[11px] font-mono text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded-full shrink-0"
                  title="Biometric baseline compiled and ready for continuous evaluation"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                  <span className="hidden xl:inline">Baseline Active</span>
                  <span className="xl:hidden">Active</span>
                </div>
              ) : currentStatus === PROFILE_STATUS.ENROLLING || (currentCount > 0 && currentCount < 10) ? (
                <div
                  className="flex items-center gap-1.5 text-[11px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2 py-0.5 rounded-full shrink-0"
                  title="Biometric baseline enrollment in progress"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
                  <span className="hidden xl:inline">{currentCount}/10 Enrolled</span>
                  <span className="xl:hidden">{currentCount}/10</span>
                </div>
              ) : currentStatus === PROFILE_STATUS.NEEDS_MORE_DATA ? (
                <div
                  className="flex items-center gap-1.5 text-[11px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-2 py-0.5 rounded-full shrink-0"
                  title="Additional typing samples required for baseline compilation"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                  <span className="hidden xl:inline">Needs More Data</span>
                  <span className="xl:hidden">Needs Data</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 text-[11px] font-mono text-[#64748B] bg-[#0B1220] border border-[#263B5E] px-2 py-0.5 rounded-full shrink-0"
                  title="No biometric baseline profile found"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
                  <span className="hidden xl:inline">Not Enrolled</span>
                  <span className="xl:hidden">No Profile</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE / TABLET SLIDE-OUT NAVIGATION DRAWER             */}
      {/* ======================================================== */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop Blur Overlay */}
          <div
            className="fixed inset-0 bg-[#0B1220]/80 backdrop-blur-md transition-opacity duration-200"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Slide-out Drawer Panel */}
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-[#0B1220] border-l border-[#263B5E] shadow-2xl p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex flex-col gap-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#263B5E]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-[8px] bg-[#111B2E] border border-[#263B5E] flex items-center justify-center text-[#FF6A00]">
                    <Shield className="w-3.5 h-3.5 text-[#FF6A00]" />
                  </div>
                  <span className="font-semibold tracking-tight text-[#F8FAFC] text-sm">
                    KEYTRACE
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-[6px] text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111B2E]"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Overview (If Authenticated) */}
              {user && (
                <div className="p-3 bg-[#111B2E] rounded-[10px] border border-[#263B5E]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#FF6A00]/10 border border-[#FF6A00]/30 flex items-center justify-center text-xs font-mono font-semibold text-[#FF6A00]">
                      {userInitials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-[#F8FAFC] truncate">
                        {user.username}
                      </span>
                      <span className="text-[10px] text-[#64748B] font-mono truncate">
                        {user.email}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#263B5E] flex items-center justify-between">
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded capitalize ${
                        user.role === "admin"
                          ? "bg-[#FF6A00]/10 text-[#FF6A00] border border-[#FF6A00]/20"
                          : "bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20"
                      }`}
                    >
                      {user.role}
                    </span>
                    <span
                      className={`text-[10px] font-mono ${
                        isBaselineReady
                          ? "text-[#22C55E]"
                          : currentCount > 0
                          ? "text-[#F59E0B]"
                          : "text-[#64748B]"
                      }`}
                    >
                      {isBaselineReady
                        ? "Active Ready"
                        : currentCount > 0
                        ? `${currentCount}/10 Enrolled`
                        : "Not Enrolled"}
                    </span>
                  </div>
                </div>
              )}

              {/* Vertical Navigation Links */}
              <nav className="flex flex-col gap-1">
                {(user ? primaryNavItems : publicNavItems).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={(e) => {
                        if (item.onClick) item.onClick(e);
                        setMobileDrawerOpen(false);
                      }}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-xs font-medium transition-all ${
                        item.isActive
                          ? "bg-[#FF6A00]/[0.08] text-[#FF6A00] font-semibold border-l-2 border-[#FF6A00]"
                          : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111B2E]"
                      }`}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 ${
                          item.isActive ? "text-[#FF6A00]" : "text-[#64748B]"
                        }`}
                      />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {/* Mobile Admin Console Entry */}
                {user && user.role === "admin" && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-xs font-medium transition-all ${
                      location.pathname.startsWith("/admin")
                        ? "bg-[#FF6A00]/10 text-[#FF6A00] font-semibold border-l-2 border-[#FF6A00]"
                        : "text-[#FF6A00] hover:bg-[#FF6A00]/10"
                    }`}
                  >
                    <Cpu className="w-[18px] h-[18px] shrink-0 text-[#FF6A00]" />
                    <span>Administration Console</span>
                  </Link>
                )}

                {/* Mobile Settings */}
                {user && (
                  <Link
                    to="/settings"
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-xs font-medium transition-all ${
                      location.pathname.startsWith("/settings")
                        ? "bg-[#FF6A00]/[0.08] text-[#FF6A00] font-semibold border-l-2 border-[#FF6A00]"
                        : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111B2E]"
                    }`}
                  >
                    <Settings className="w-[18px] h-[18px] shrink-0 text-[#64748B]" />
                    <span>Account & Security</span>
                  </Link>
                )}
              </nav>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="pt-4 border-t border-[#263B5E] mt-6 flex flex-col gap-2">
              {user ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-center"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  <span>Sign Out</span>
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link to="/login" onClick={() => setMobileDrawerOpen(false)}>
                    <Button variant="ghost" size="md" className="w-full justify-center">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileDrawerOpen(false)}>
                    <Button variant="primary" size="md" className="w-full justify-center">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
