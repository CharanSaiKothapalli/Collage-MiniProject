import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.js";
import { Card, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Badge } from "../components/ui/Badge.js";
import {
  Shield,
  Activity,
  Cpu,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Sparkles,
} from "lucide-react";

import { LiveKeystrokePlayground } from "../components/keystroke/LiveKeystrokePlayground.js";

export function LandingPage() {
  return (
    <div className="flex flex-col gap-24 py-6">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center max-w-4xl mx-auto gap-6 pt-4 relative">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] rounded-full bg-[#38BDF8]/5 blur-[130px] pointer-events-none -z-10" />

        <div className="flex items-center gap-2">
          <Badge variant="blue" className="px-3 py-1 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A00] animate-pulse" />
            Continuous Behavioral Authentication
          </Badge>
          <Badge variant="neutral" className="text-xs">
            v1.2.0
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[#F8FAFC] leading-[1.1]">
          Continuous Authentication via{" "}
          <span className="bg-gradient-to-r from-[#FF6A00] via-[#38BDF8] to-[#FF6A00] bg-clip-text text-transparent">
            Keystroke Dynamics
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[#94A3B8] max-w-2xl leading-relaxed font-sans">
          KEYTRACE characterizes an authorized user's physical typing cadence and evaluates active sessions
          in real time. Robust timing statistics and machine-learning models provide continuous behavioural assurance without logging or storing typed text.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link to="/register">
            <Button size="lg" variant="primary">
              Begin Enrollment <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">
              Sign In to Workspace
            </Button>
          </Link>
          <Link to="/docs">
            <Button size="lg" variant="outline">
              <BookOpen className="w-4 h-4 text-[#94A3B8]" /> Technical Documentation
            </Button>
          </Link>
        </div>

        {/* Quick Testing Callout */}
        <div className="p-3 px-4.5 rounded-2xl bg-[#0B1220] border border-[#263B5E] text-xs text-[#94A3B8] flex flex-wrap items-center justify-center gap-2.5 shadow-sm backdrop-blur-xl">
          <span className="text-[#38BDF8] font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Instant Evaluation Demo:
          </span>
          <span className="text-[#94A3B8]">Pre-seeded accounts:</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#1A2A44] border border-[#263B5E] text-[#F8FAFC] font-mono text-[11px]">admin</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#1A2A44] border border-[#263B5E] text-[#F8FAFC] font-mono text-[11px]">alice_genuine</span>
          <span className="px-2.5 py-0.5 rounded-md bg-[#1A2A44] border border-[#263B5E] text-[#F8FAFC] font-mono text-[11px]">bob_impostor</span>
          <Link to="/login" className="text-[#38BDF8] hover:text-[#38BDF8] font-medium flex items-center gap-0.5 ml-1 transition-colors">
            Sign In with 1-Click <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Live metric preview highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-3xl pt-6 border-t border-[#263B5E] mt-2">
          <div className="flex flex-col items-center p-4 rounded-2xl bg-[#0B1220] border border-[#263B5E] hover:border-[#263B5E] transition-all backdrop-blur-xl">
            <span className="text-2xl sm:text-3xl font-semibold text-[#F8FAFC]">0%</span>
            <span className="text-xs text-[#94A3B8] mt-1 font-medium">Text Stored/Sent</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-[#0B1220] border border-[#263B5E] hover:border-[#263B5E] transition-all backdrop-blur-xl">
            <span className="text-2xl sm:text-3xl font-semibold text-[#F8FAFC]">10-Dim</span>
            <span className="text-xs text-[#94A3B8] mt-1 font-medium">Feature Vector</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-[#0B1220] border border-[#263B5E] hover:border-[#263B5E] transition-all backdrop-blur-xl">
            <span className="text-2xl sm:text-3xl font-semibold text-[#F8FAFC]">&lt; 18ms</span>
            <span className="text-xs text-[#94A3B8] mt-1 font-medium">ML Inference</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-[#0B1220] border border-[#263B5E] hover:border-[#263B5E] transition-all backdrop-blur-xl">
            <span className="text-2xl sm:text-3xl font-semibold text-[#F8FAFC]">τ = 2.80</span>
            <span className="text-xs text-[#94A3B8] mt-1 font-medium">Decision Cutoff</span>
          </div>
        </div>

        {/* Embedded Interactive Live Keystroke Biometric Sandbox */}
        <div className="w-full pt-8">
          <LiveKeystrokePlayground />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="flex flex-col gap-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <Badge variant="blue" className="self-center">Physical Biometrics</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            The Biomechanics of Keystroke Dynamics
          </h2>
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            Typing cadence is governed by neuromuscular motor memory. While attackers can steal a static password,
            replicating the microsecond timing of physical key transitions is mathematically complex.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card elevated className="hover:border-[#38BDF8]/40 transition-all">
            <div className="w-8 h-8 rounded-xl bg-[#0B1220] border border-[#263B5E] flex items-center justify-center text-[#94A3B8] mb-4 text-xs font-semibold">
              01
            </div>
            <CardTitle className="text-[#F8FAFC] text-base">Key-Hold Duration (H)</CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
              The duration in milliseconds that an individual key remains depressed between physical keydown and keyup events.
              Mean, median, and variance capture individualized press weight.
            </CardDescription>
            <div className="mt-4 p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] font-mono text-xs text-[#38BDF8]">
              Hold = keyup.time - keydown.time
            </div>
          </Card>

          <Card elevated className="hover:border-[#38BDF8]/40 transition-all">
            <div className="w-8 h-8 rounded-xl bg-[#0B1220] border border-[#263B5E] flex items-center justify-center text-[#94A3B8] mb-4 text-xs font-semibold">
              02
            </div>
            <CardTitle className="text-[#F8FAFC] text-base">Flight Latency (F)</CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
              The inter-key transition time elapsed between consecutive keydown events.
              Reflects cognitive cadence, hand ergonomics, and linguistic rhythm.
            </CardDescription>
            <div className="mt-4 p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] font-mono text-xs text-[#FF6A00]">
              Flight = keydown[i].time - keydown[i-1].time
            </div>
          </Card>

          <Card elevated className="hover:border-[#38BDF8]/40 transition-all">
            <div className="w-8 h-8 rounded-xl bg-[#0B1220] border border-[#263B5E] flex items-center justify-center text-[#94A3B8] mb-4 text-xs font-semibold">
              03
            </div>
            <CardTitle className="text-[#F8FAFC] text-base">Robust Statistical Scoring</CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed text-[#94A3B8]">
              Standardized robust distance based on Median and Median Absolute Deviation (MAD) with variance floor
              mitigates outliers and calculates calibrated similarity.
            </CardDescription>
            <div className="mt-4 p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] font-mono text-xs text-[#22C55E]">
              z = |x - median| / max(MAD, floor)
            </div>
          </Card>
        </div>
      </section>

      {/* System Architecture Section */}
      <section id="architecture" className="flex flex-col gap-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <Badge variant="blue" className="self-center">Decoupled Topology</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Enterprise Architecture
          </h2>
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            The browser never touches MongoDB directly. All operations pass hardened Express routes, while ML inference runs on an internal FastAPI service.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#111B2E] border border-[#263B5E] backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] hover:border-[#263B5E] transition-all flex flex-col items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#0B1220] border border-[#263B5E] flex items-center justify-center text-[#F8FAFC] text-xs font-semibold">
                UI
              </span>
              <span className="font-semibold text-sm text-[#F8FAFC]">React 18 + Vite</span>
              <span className="text-xs text-[#94A3B8]">Tailwind CSS • Zod • Lucide</span>
              <span className="text-[11px] text-[#38BDF8] mt-1 font-medium">Keystroke Engine</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] hover:border-[#263B5E] transition-all flex flex-col items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#0B1220] border border-[#263B5E] flex items-center justify-center text-[#F8FAFC] text-xs font-semibold">
                API
              </span>
              <span className="font-semibold text-sm text-[#F8FAFC]">Node.js Express</span>
              <span className="text-xs text-[#94A3B8]">TypeScript • Bcrypt • JWT</span>
              <span className="text-[11px] text-[#FF6A00] mt-1 font-medium">CSRF • Rate Limits</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] hover:border-[#263B5E] transition-all flex flex-col items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#0B1220] border border-[#263B5E] flex items-center justify-center text-[#F8FAFC] text-xs font-semibold">
                ML
              </span>
              <span className="font-semibold text-sm text-[#F8FAFC]">Python FastAPI</span>
              <span className="text-xs text-[#94A3B8]">scikit-learn • NumPy • Pydantic</span>
              <span className="text-[11px] text-[#22C55E] mt-1 font-medium">Robust Distance & IF</span>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] hover:border-[#263B5E] transition-all flex flex-col items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-[#0B1220] border border-[#263B5E] flex items-center justify-center text-[#F8FAFC] text-xs font-semibold">
                DB
              </span>
              <span className="font-semibold text-sm text-[#F8FAFC]">MongoDB Mongoose</span>
              <span className="text-xs text-[#94A3B8]">Atlas & In-Memory Fallback</span>
              <span className="text-[11px] text-[#38BDF8] mt-1 font-medium">Strict User Isolation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Principles */}
      <section id="privacy" className="flex flex-col gap-8 scroll-mt-20">
        <div className="p-8 rounded-2xl bg-[#0B1220] border border-[#263B5E] backdrop-blur-xl">
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#263B5E]">
              <div className="w-8 h-8 rounded-xl bg-[#22C55E]/10 border border-[#22C55E]/20 flex items-center justify-center text-[#22C55E]">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
                Informed Consent &amp; Privacy By Design
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col gap-1.5">
                <span className="text-[#22C55E] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> Zero Keylogging
                </span>
                <span className="text-[#94A3B8] leading-relaxed">We never log, store, or transmit characters or text content entered by users.</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col gap-1.5">
                <span className="text-[#22C55E] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> Affirmative Consent
                </span>
                <span className="text-[#94A3B8] leading-relaxed">Timing collection is strictly gated behind an explicit, versioned agreement.</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col gap-1.5">
                <span className="text-[#22C55E] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> Granular Deletion
                </span>
                <span className="text-[#94A3B8] leading-relaxed">Users can inspect enrolled samples, delete individual sessions, or purge their profile anytime.</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col gap-1.5">
                <span className="text-[#22C55E] font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" /> GDPR Data Export
                </span>
                <span className="text-[#94A3B8] leading-relaxed">Export all account, consent, sample, and verification records with a single click.</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] flex items-start gap-3 text-xs text-[#94A3B8]">
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Browser timestamps are subject to operating system scheduling and hardware key switches. KEYTRACE treats classification scores as probabilistic risk signals, not absolute physical identity.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center py-12 px-6 rounded-2xl bg-[#0B1220] border border-[#263B5E] flex flex-col items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
          Ready to test continuous behavioural authentication?
        </h2>
        <p className="text-sm text-[#94A3B8] max-w-lg leading-relaxed">
          Create an account, enroll 10 short typing samples, and verify your typing pattern in the live verification terminal.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link to="/register">
            <Button size="lg" variant="primary">
              Create Your Account
            </Button>
          </Link>
          <Link to="/docs">
            <Button size="lg" variant="secondary">
              Read Documentation
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
