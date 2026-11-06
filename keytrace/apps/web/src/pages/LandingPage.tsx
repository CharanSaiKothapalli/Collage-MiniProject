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
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none -z-10" />

        <div className="flex items-center gap-2">
          <Badge variant="accent" className="px-3 py-1 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Continuous Behavioral Authentication
          </Badge>
          <Badge variant="neutral" className="text-xs">
            v1.2.0
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.1]">
          Continuous Authentication via{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-indigo-300 bg-clip-text text-transparent">
            Keystroke Dynamics
          </span>
        </h1>

        <p className="text-base sm:text-lg text-zinc-300 max-w-2xl leading-relaxed font-sans">
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
              <BookOpen className="w-4 h-4 text-zinc-400" /> Technical Documentation
            </Button>
          </Link>
        </div>

        {/* Quick Testing Callout */}
        <div className="p-3 px-4.5 rounded-2xl bg-zinc-900/60 border border-white/10 text-xs text-zinc-300 flex flex-wrap items-center justify-center gap-2.5 shadow-sm backdrop-blur-xl">
          <span className="text-indigo-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Instant Evaluation Demo:
          </span>
          <span className="text-zinc-400">Pre-seeded accounts:</span>
          <span className="px-2.5 py-0.5 rounded-md bg-zinc-800/80 border border-white/10 text-zinc-200 font-mono text-[11px]">admin</span>
          <span className="px-2.5 py-0.5 rounded-md bg-zinc-800/80 border border-white/10 text-zinc-200 font-mono text-[11px]">alice_genuine</span>
          <span className="px-2.5 py-0.5 rounded-md bg-zinc-800/80 border border-white/10 text-zinc-200 font-mono text-[11px]">bob_impostor</span>
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5 ml-1 transition-colors">
            Sign In with 1-Click <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Live metric preview highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-3xl pt-6 border-t border-white/[0.06] mt-2">
          <div className="flex flex-col items-center p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] hover:border-white/10 transition-all backdrop-blur-xl">
            <span className="text-2xl sm:text-3xl font-semibold text-white">0%</span>
            <span className="text-xs text-zinc-400 mt-1 font-medium">Text Stored/Sent</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] hover:border-white/10 transition-all backdrop-blur-xl">
            <span className="text-2xl sm:text-3xl font-semibold text-white">10-Dim</span>
            <span className="text-xs text-zinc-400 mt-1 font-medium">Feature Vector</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] hover:border-white/10 transition-all backdrop-blur-xl">
            <span className="text-2xl sm:text-3xl font-semibold text-white">&lt; 18ms</span>
            <span className="text-xs text-zinc-400 mt-1 font-medium">ML Inference</span>
          </div>
          <div className="flex flex-col items-center p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.06] hover:border-white/10 transition-all backdrop-blur-xl">
            <span className="text-2xl sm:text-3xl font-semibold text-white">τ = 2.80</span>
            <span className="text-xs text-zinc-400 mt-1 font-medium">Decision Cutoff</span>
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
          <Badge variant="accent" className="self-center">Physical Biometrics</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            The Biomechanics of Keystroke Dynamics
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Typing cadence is governed by neuromuscular motor memory. While attackers can steal a static password,
            replicating the microsecond timing of physical key transitions is mathematically complex.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card elevated className="hover:border-white/20 transition-all">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 mb-4 text-xs font-semibold">
              01
            </div>
            <CardTitle className="text-white text-base">Key-Hold Duration (H)</CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed text-zinc-400">
              The duration in milliseconds that an individual key remains depressed between physical keydown and keyup events.
              Mean, median, and variance capture individualized press weight.
            </CardDescription>
            <div className="mt-4 p-3 rounded-xl bg-zinc-950/80 border border-white/[0.06] font-mono text-xs text-indigo-300">
              Hold = keyup.time - keydown.time
            </div>
          </Card>

          <Card elevated className="hover:border-white/20 transition-all">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 mb-4 text-xs font-semibold">
              02
            </div>
            <CardTitle className="text-white text-base">Flight Latency (F)</CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed text-zinc-400">
              The inter-key transition time elapsed between consecutive keydown events.
              Reflects cognitive cadence, hand ergonomics, and linguistic rhythm.
            </CardDescription>
            <div className="mt-4 p-3 rounded-xl bg-zinc-950/80 border border-white/[0.06] font-mono text-xs text-sky-300">
              Flight = keydown[i].time - keydown[i-1].time
            </div>
          </Card>

          <Card elevated className="hover:border-white/20 transition-all">
            <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-300 mb-4 text-xs font-semibold">
              03
            </div>
            <CardTitle className="text-white text-base">Robust Statistical Scoring</CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed text-zinc-400">
              Standardized robust distance based on Median and Median Absolute Deviation (MAD) with variance floor
              mitigates outliers and calculates calibrated similarity.
            </CardDescription>
            <div className="mt-4 p-3 rounded-xl bg-zinc-950/80 border border-white/[0.06] font-mono text-xs text-emerald-300">
              z = |x - median| / max(MAD, floor)
            </div>
          </Card>
        </div>
      </section>

      {/* System Architecture Section */}
      <section id="architecture" className="flex flex-col gap-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <Badge variant="cyan" className="self-center">Decoupled Topology</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Enterprise Architecture
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            The browser never touches MongoDB directly. All operations pass hardened Express routes, while ML inference runs on an internal FastAPI service.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-900/30 border border-white/[0.08] backdrop-blur-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06] hover:border-white/10 transition-all flex flex-col items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-200 text-xs font-semibold">
                UI
              </span>
              <span className="font-semibold text-sm text-white">React 18 + Vite</span>
              <span className="text-xs text-zinc-400">Tailwind CSS • Zod • Lucide</span>
              <span className="text-[11px] text-indigo-400 mt-1 font-medium">Keystroke Engine</span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06] hover:border-white/10 transition-all flex flex-col items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-200 text-xs font-semibold">
                API
              </span>
              <span className="font-semibold text-sm text-white">Node.js Express</span>
              <span className="text-xs text-zinc-400">TypeScript • Bcrypt • JWT</span>
              <span className="text-[11px] text-sky-400 mt-1 font-medium">CSRF • Rate Limits</span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06] hover:border-white/10 transition-all flex flex-col items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-200 text-xs font-semibold">
                ML
              </span>
              <span className="font-semibold text-sm text-white">Python FastAPI</span>
              <span className="text-xs text-zinc-400">scikit-learn • NumPy • Pydantic</span>
              <span className="text-[11px] text-emerald-400 mt-1 font-medium">Robust Distance & IF</span>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06] hover:border-white/10 transition-all flex flex-col items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center text-zinc-200 text-xs font-semibold">
                DB
              </span>
              <span className="font-semibold text-sm text-white">MongoDB Mongoose</span>
              <span className="text-xs text-zinc-400">Atlas & In-Memory Fallback</span>
              <span className="text-[11px] text-purple-400 mt-1 font-medium">Strict User Isolation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Principles */}
      <section id="privacy" className="flex flex-col gap-8 scroll-mt-20">
        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-white/[0.08] backdrop-blur-xl">
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-2.5 pb-4 border-b border-white/[0.06]">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Informed Consent &amp; Privacy By Design
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] flex flex-col gap-1.5">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Zero Keylogging
                </span>
                <span className="text-zinc-400 leading-relaxed">We never log, store, or transmit characters or text content entered by users.</span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] flex flex-col gap-1.5">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Affirmative Consent
                </span>
                <span className="text-zinc-400 leading-relaxed">Timing collection is strictly gated behind an explicit, versioned agreement.</span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] flex flex-col gap-1.5">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Granular Deletion
                </span>
                <span className="text-zinc-400 leading-relaxed">Users can inspect enrolled samples, delete individual sessions, or purge their profile anytime.</span>
              </div>
              <div className="p-4 rounded-xl bg-zinc-950/60 border border-white/[0.06] flex flex-col gap-1.5">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> GDPR Data Export
                </span>
                <span className="text-zinc-400 leading-relaxed">Export all account, consent, sample, and verification records with a single click.</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-950/80 border border-white/[0.08] flex items-start gap-3 text-xs text-zinc-400">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Browser timestamps are subject to operating system scheduling and hardware key switches. KEYTRACE treats classification scores as probabilistic risk signals, not absolute physical identity.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center py-12 px-6 rounded-2xl bg-zinc-900/40 border border-white/[0.08] flex flex-col items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Ready to test continuous behavioural authentication?
        </h2>
        <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
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
