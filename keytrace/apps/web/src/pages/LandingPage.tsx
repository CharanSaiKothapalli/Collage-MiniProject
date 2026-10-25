import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.js";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Badge } from "../components/ui/Badge.js";
import {
  Shield,
  Activity,
  Cpu,
  Lock,
  Layers,
  ArrowRight,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Terminal,
} from "lucide-react";

export function LandingPage() {
  return (
    <div className="flex flex-col gap-24 py-8">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center max-w-4xl mx-auto gap-6 pt-6 relative">
        <div className="flex items-center gap-2.5">
          <Badge variant="cyan" className="shadow-[0_0_15px_rgba(6,182,212,0.3)]">[ BIOMETRIC RESEARCH PLATFORM ]</Badge>
          <Badge variant="accent">v1.2.0-STABLE</Badge>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-mono leading-[1.15]">
          Continuous Authentication via{" "}
          <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(245,158,11,0.35)]">
            Keystroke Dynamics
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed font-sans">
          KEYTRACE characterizes an authorized user's physical typing cadence and evaluates active sessions
          in real time. Robust timing statistics and machine-learning models provide continuous behavioural assurance without logging or transmitting typed characters.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-3">
          <Link to="/register">
            <Button size="lg" variant="primary">
              Begin Enrolment <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">
              Sign In to Workspace
            </Button>
          </Link>
          <Link to="/docs">
            <Button size="lg" variant="terminal">
              <BookOpen className="w-4 h-4" /> Technical Documentation
            </Button>
          </Link>
        </div>

        {/* Live metric preview highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 w-full max-w-3xl pt-8 border-t border-slate-800/80 mt-2">
          <div className="flex flex-col items-center p-3.5 rounded-lg bg-slate-900/75 border border-slate-700/70 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all backdrop-blur-md">
            <span className="text-2xl font-mono font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">0%</span>
            <span className="text-[11px] font-mono uppercase text-slate-400 mt-1 font-semibold">Text Stored/Sent</span>
          </div>
          <div className="flex flex-col items-center p-3.5 rounded-lg bg-slate-900/75 border border-slate-700/70 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all backdrop-blur-md">
            <span className="text-2xl font-mono font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">10-Dim</span>
            <span className="text-[11px] font-mono uppercase text-slate-400 mt-1 font-semibold">Feature Space</span>
          </div>
          <div className="flex flex-col items-center p-3.5 rounded-lg bg-slate-900/75 border border-slate-700/70 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all backdrop-blur-md">
            <span className="text-2xl font-mono font-bold bg-gradient-to-r from-cyan-400 to-sky-300 bg-clip-text text-transparent">&lt; 18ms</span>
            <span className="text-[11px] font-mono uppercase text-slate-400 mt-1 font-semibold">ML Inference</span>
          </div>
          <div className="flex flex-col items-center p-3.5 rounded-lg bg-slate-900/75 border border-slate-700/70 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all backdrop-blur-md">
            <span className="text-2xl font-mono font-bold bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">τ = 2.80</span>
            <span className="text-[11px] font-mono uppercase text-slate-400 mt-1 font-semibold">Decision Cutoff</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="flex flex-col gap-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2.5">
          <Badge variant="cyan" className="self-center">[ PHYSICAL BIOMETRICS ]</Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono uppercase">
            The Biomechanics of Keystroke Dynamics
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
            Typing cadence is governed by neuromuscular motor memory. While attackers can steal a static password,
            replicating the microsecond timing of physical key transitions is mathematically complex.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card elevated cornerTicks className="hover:border-amber-500/60 hover:shadow-[0_8px_32px_rgba(245,158,11,0.15)] transition-all">
            <div className="w-9 h-9 rounded-md bg-amber-500/15 border border-amber-500/50 flex items-center justify-center text-amber-300 mb-3.5 font-mono text-xs font-bold shadow-[0_0_12px_rgba(245,158,11,0.25)]">
              01
            </div>
            <CardTitle className="font-mono text-white text-base">Key-Hold Duration (H)</CardTitle>
            <CardDescription className="mt-2 text-xs leading-relaxed font-sans text-slate-300">
              The duration in milliseconds that an individual key remains depressed between physical keydown and keyup events.
              Mean, median, and variance capture individualized press weight.
            </CardDescription>
            <div className="mt-3.5 p-2.5 rounded-md bg-slate-950/80 border border-amber-500/40 font-mono text-xs text-amber-300 shadow-inner">
              Hold = keyup.time - keydown.time
            </div>
          </Card>

          <Card elevated cornerTicks className="hover:border-cyan-500/60 hover:shadow-[0_8px_32px_rgba(6,182,212,0.15)] transition-all">
            <div className="w-9 h-9 rounded-md bg-cyan-500/15 border border-cyan-500/50 flex items-center justify-center text-cyan-300 mb-3.5 font-mono text-xs font-bold shadow-[0_0_12px_rgba(6,182,212,0.25)]">
              02
            </div>
            <CardTitle className="font-mono text-white text-base">Flight Duration (F)</CardTitle>
            <CardDescription className="mt-2 text-xs leading-relaxed font-sans text-slate-300">
              The inter-key transition time elapsed between consecutive keydown events.
              Reflects cognitive cadence, hand ergonomics, and linguistic rhythm.
            </CardDescription>
            <div className="mt-3.5 p-2.5 rounded-md bg-slate-950/80 border border-cyan-500/40 font-mono text-xs text-cyan-300 shadow-inner">
              Flight = keydown[i].time - keydown[i-1].time
            </div>
          </Card>

          <Card elevated cornerTicks className="hover:border-emerald-500/60 hover:shadow-[0_8px_32px_rgba(16,185,129,0.15)] transition-all">
            <div className="w-9 h-9 rounded-md bg-emerald-500/15 border border-emerald-500/50 flex items-center justify-center text-emerald-300 mb-3.5 font-mono text-xs font-bold shadow-[0_0_12px_rgba(16,185,129,0.25)]">
              03
            </div>
            <CardTitle className="font-mono text-white text-base">Robust Statistical Scoring</CardTitle>
            <CardDescription className="mt-2 text-xs leading-relaxed font-sans text-slate-300">
              Standardized robust distance based on Median and Median Absolute Deviation (MAD) with variance floor
              mitigates outliers and calculates calibrated similarity.
            </CardDescription>
            <div className="mt-3.5 p-2.5 rounded-md bg-slate-950/80 border border-emerald-500/40 font-mono text-xs text-emerald-300 shadow-inner">
              z = |x - median| / max(MAD, floor)
            </div>
          </Card>
        </div>
      </section>

      {/* System Architecture Section */}
      <section id="architecture" className="flex flex-col gap-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2.5">
          <Badge variant="cyan" className="self-center">
            [ SEPARATION OF CONCERNS ]
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono uppercase">
            Decoupled Enterprise Topology
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
            The browser never touches MongoDB directly. All operations pass hardened Express routes, while ML inference runs on an internal FastAPI service.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-gradient-to-b from-[#0e1424]/90 to-[#090d18]/90 border border-slate-700/70 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-lg bg-slate-900/80 border border-amber-500/30 hover:border-amber-400/60 transition-all flex flex-col items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.08)]">
              <span className="w-8 h-8 rounded-md bg-amber-500/15 border border-amber-500/50 flex items-center justify-center text-amber-300 font-mono text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                UI
              </span>
              <span className="font-mono font-bold text-sm text-white">React + Vite</span>
              <span className="text-[11px] text-slate-300">Tailwind CSS &bull; Zod &bull; Lucide</span>
              <span className="text-[10px] text-amber-400 mt-1 font-mono uppercase font-semibold">KeystrokeCapture Engine</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400/60 transition-all flex flex-col items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.08)]">
              <span className="w-8 h-8 rounded-md bg-cyan-500/15 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-mono text-xs font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]">
                API
              </span>
              <span className="font-mono font-bold text-sm text-white">Node.js Express</span>
              <span className="text-[11px] text-slate-300">TypeScript &bull; Bcrypt &bull; JWT</span>
              <span className="text-[10px] text-cyan-400 mt-1 font-mono uppercase font-semibold">CSRF &bull; Rate Limits &bull; Helmet</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/80 border border-emerald-500/30 hover:border-emerald-400/60 transition-all flex flex-col items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
              <span className="w-8 h-8 rounded-md bg-emerald-500/15 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-mono text-xs font-bold shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                ML
              </span>
              <span className="font-mono font-bold text-sm text-white">Python FastAPI</span>
              <span className="text-[11px] text-slate-300">scikit-learn &bull; NumPy &bull; Pydantic</span>
              <span className="text-[10px] text-emerald-400 mt-1 font-mono uppercase font-semibold">Robust Distance &bull; IF Forest</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/80 border border-indigo-500/30 hover:border-indigo-400/60 transition-all flex flex-col items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.08)]">
              <span className="w-8 h-8 rounded-md bg-indigo-500/15 border border-indigo-500/50 flex items-center justify-center text-indigo-300 font-mono text-xs font-bold shadow-[0_0_10px_rgba(99,102,241,0.25)]">
                DB
              </span>
              <span className="font-mono font-bold text-sm text-white">MongoDB Mongoose</span>
              <span className="text-[11px] text-slate-300">Atlas &bull; Memory Server Fallback</span>
              <span className="text-[10px] text-indigo-400 mt-1 font-mono uppercase font-semibold">Strict User Isolation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Principles */}
      <section id="privacy" className="flex flex-col gap-8 scroll-mt-20">
        <div className="p-7 rounded-xl bg-[#0c1220]/80 border border-emerald-500/30 shadow-[0_12px_40px_rgba(16,185,129,0.08)] backdrop-blur-md">
          <div className="max-w-3xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="w-8 h-8 rounded-md bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white font-mono uppercase">
                Informed Consent &amp; Privacy By Design
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-emerald-500/30 flex flex-col gap-1.5 shadow-sm">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> [ 01 // ZERO KEYLOGGING ]
                </span>
                <span className="text-slate-300 font-sans leading-relaxed">We never log, store, or transmit characters or text content entered by users.</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-emerald-500/30 flex flex-col gap-1.5 shadow-sm">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> [ 02 // AFFIRMATIVE CONSENT ]
                </span>
                <span className="text-slate-300 font-sans leading-relaxed">Timing collection is strictly gated behind an explicit, versioned agreement.</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-emerald-500/30 flex flex-col gap-1.5 shadow-sm">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> [ 03 // GRANULAR DELETION ]
                </span>
                <span className="text-slate-300 font-sans leading-relaxed">Users can inspect enrolled samples, delete individual sessions, or purge their profile anytime.</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900/80 border border-emerald-500/30 flex flex-col gap-1.5 shadow-sm">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> [ 04 // GDPR EXPORT ]
                </span>
                <span className="text-slate-300 font-sans leading-relaxed">Export all account, consent, sample, and verification records with a single click.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/80 border border-amber-500/40 flex items-start gap-3 text-xs text-slate-300 font-mono shadow-inner">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                [RESPONSIBLE BIOMETRICS] Browser timestamps are subject to operating system scheduling and hardware key switches. KEYTRACE treats classification scores as probabilistic risk signals, not absolute physical identity.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center py-12 px-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono uppercase">
          Ready to test continuous behavioural authentication?
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg font-mono leading-relaxed">
          Create an account, enroll 10 short typing samples, and verify your typing pattern in the live verification terminal.
        </p>
        <div className="flex flex-wrap justify-center gap-3.5 pt-2">
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
