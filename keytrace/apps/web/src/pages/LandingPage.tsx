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
  Zap,
} from "lucide-react";
import { LiveKeystrokePlayground } from "../components/keystroke/LiveKeystrokePlayground.js";

export function LandingPage() {
  return (
    <div className="flex flex-col gap-20 py-4 max-w-5xl mx-auto">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center gap-6 pt-6 relative">
        <div className="flex items-center gap-2">
          <Badge variant="cyan" className="px-3 py-1 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#35D6E8] animate-pulse" />
            Continuous Behavioral Security
          </Badge>
          <Badge variant="neutral" className="text-xs">
            v1.2.0
          </Badge>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F4F7FC] leading-[1.15] max-w-3xl">
          Continuous Authentication Powered by{" "}
          <span className="text-gradient-cyan">
            Typing Rhythm
          </span>
        </h1>

        <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl leading-relaxed">
          KEYTRACE learns your unique physical typing cadence to continuously verify your identity in real time. 
          Zero keylogging. Zero stored text. Complete biometric assurance.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link to="/register">
            <Button size="lg" variant="primary">
              Get Started Free <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="secondary">
              Sign In to Workspace
            </Button>
          </Link>
          <Link to="/docs">
            <Button size="lg" variant="ghost" className="text-[#94A3B8] hover:text-[#F4F7FC]">
              <BookOpen className="w-4 h-4 mr-1.5 text-[#35D6E8]" /> View Docs
            </Button>
          </Link>
        </div>

        {/* 1-Click Demo Accounts Bar */}
        <div className="p-3 px-4 rounded-xl bg-[#111927] border border-[#243247] text-xs text-[#94A3B8] flex flex-wrap items-center justify-center gap-2 shadow-sm">
          <span className="text-[#35D6E8] font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Quick Demo Accounts:
          </span>
          <span className="px-2 py-0.5 rounded bg-[#0D1320] border border-[#243247] text-[#F4F7FC] font-mono text-[11px]">admin</span>
          <span className="px-2 py-0.5 rounded bg-[#0D1320] border border-[#243247] text-[#F4F7FC] font-mono text-[11px]">alice_genuine</span>
          <span className="px-2 py-0.5 rounded bg-[#0D1320] border border-[#243247] text-[#F4F7FC] font-mono text-[11px]">bob_impostor</span>
          <Link to="/login" className="text-[#35D6E8] hover:underline font-medium flex items-center gap-0.5 ml-1">
            Auto-fill on Login &rarr;
          </Link>
        </div>

        {/* 4 Clean Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl pt-4">
          <div className="flex flex-col items-center p-3.5 rounded-xl bg-[#111927] border border-[#243247]">
            <span className="text-xl sm:text-2xl font-bold text-[#F4F7FC]">0%</span>
            <span className="text-[11px] text-[#94A3B8] mt-0.5">Text Stored</span>
          </div>
          <div className="flex flex-col items-center p-3.5 rounded-xl bg-[#111927] border border-[#243247]">
            <span className="text-xl sm:text-2xl font-bold text-[#35D6E8]">10-D</span>
            <span className="text-[11px] text-[#94A3B8] mt-0.5">Biometric Vector</span>
          </div>
          <div className="flex flex-col items-center p-3.5 rounded-xl bg-[#111927] border border-[#243247]">
            <span className="text-xl sm:text-2xl font-bold text-[#32D6A0]">&lt; 18ms</span>
            <span className="text-[11px] text-[#94A3B8] mt-0.5">Inference Latency</span>
          </div>
          <div className="flex flex-col items-center p-3.5 rounded-xl bg-[#111927] border border-[#243247]">
            <span className="text-xl sm:text-2xl font-bold text-[#8B7CFF]">2.80</span>
            <span className="text-[11px] text-[#94A3B8] mt-0.5">Adaptive Cutoff</span>
          </div>
        </div>

        {/* Embedded Interactive Live Keystroke Playground */}
        <div className="w-full pt-4">
          <LiveKeystrokePlayground />
        </div>
      </section>

      {/* 3 Step Workflow */}
      <section id="how-it-works" className="flex flex-col gap-6 scroll-mt-20">
        <div className="text-center max-w-xl mx-auto flex flex-col gap-1.5">
          <Badge variant="cyan" className="self-center">HOW IT WORKS</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#F4F7FC]">
            Invisible, Continuous Protection
          </h2>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Passwords can be leaked or stolen. Your physical typing rhythm is personal and nearly impossible to imitate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card elevated className="p-5 flex flex-col gap-2 hover:border-[#344560] transition-all">
            <div className="w-8 h-8 rounded-lg bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#35D6E8] text-xs font-bold font-mono">
              01
            </div>
            <CardTitle className="text-[#F4F7FC] text-sm font-bold">1. Type Naturally</CardTitle>
            <CardDescription className="text-xs text-[#94A3B8] leading-relaxed">
              Complete 10 short typing samples. KEYTRACE records microsecond key holds and transitions between letters.
            </CardDescription>
          </Card>

          <Card elevated className="p-5 flex flex-col gap-2 hover:border-[#344560] transition-all">
            <div className="w-8 h-8 rounded-lg bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#8B7CFF] text-xs font-bold font-mono">
              02
            </div>
            <CardTitle className="text-[#F4F7FC] text-sm font-bold">2. AI Baseline Built</CardTitle>
            <CardDescription className="text-xs text-[#94A3B8] leading-relaxed">
              Machine learning models establish your personal biometric profile using robust distance metrics.
            </CardDescription>
          </Card>

          <Card elevated className="p-5 flex flex-col gap-2 hover:border-[#344560] transition-all">
            <div className="w-8 h-8 rounded-lg bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#32D6A0] text-xs font-bold font-mono">
              03
            </div>
            <CardTitle className="text-[#F4F7FC] text-sm font-bold">3. Stay Protected</CardTitle>
            <CardDescription className="text-xs text-[#94A3B8] leading-relaxed">
              Active sessions verify rhythm in the background. If an impostor takes over, access is flagged immediately.
            </CardDescription>
          </Card>
        </div>
      </section>

      {/* Privacy Principles */}
      <section id="privacy" className="p-6 sm:p-7 rounded-2xl bg-[#111927] border border-[#243247]">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#243247]">
          <div className="w-8 h-8 rounded-lg bg-[#0D1320] border border-[#243247] flex items-center justify-center text-[#32D6A0]">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#F4F7FC]">
              Privacy By Design &amp; Zero Keylogging
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Compliant with GDPR Article 9 standards for behavioral biometric data.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#0D1320] border border-[#243247] flex flex-col gap-1">
            <span className="text-[#32D6A0] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> No Character Logging
            </span>
            <span className="text-[#94A3B8] text-[11px] leading-relaxed">
              We never log, transmit, or store typed words or characters. Only millisecond intervals are processed.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0D1320] border border-[#243247] flex flex-col gap-1">
            <span className="text-[#32D6A0] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Affirmative Consent
            </span>
            <span className="text-[#94A3B8] text-[11px] leading-relaxed">
              Data collection is strictly gated behind clear, explicit consent which you can revoke anytime.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0D1320] border border-[#243247] flex flex-col gap-1">
            <span className="text-[#32D6A0] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Full Data Erasure
            </span>
            <span className="text-[#94A3B8] text-[11px] leading-relaxed">
              Delete individual typing samples, reset your profile, or completely purge your account in 1 click.
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0D1320] border border-[#243247] flex flex-col gap-1">
            <span className="text-[#32D6A0] font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> 1-Click Data Export
            </span>
            <span className="text-[#94A3B8] text-[11px] leading-relaxed">
              Download your complete personal biometric archive as structured JSON whenever you want.
            </span>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center py-10 px-6 rounded-2xl bg-[#111927] border border-[#243247] flex flex-col items-center gap-3.5">
        <h2 className="text-xl sm:text-2xl font-bold text-[#F4F7FC]">
          Ready to experience continuous behavioral authentication?
        </h2>
        <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md">
          Enroll 10 short typing samples and verify your typing pattern in the live verification terminal.
        </p>
        <div className="flex flex-wrap justify-center gap-2.5 pt-1">
          <Link to="/register">
            <Button size="md" variant="primary">
              Create Free Account
            </Button>
          </Link>
          <Link to="/docs">
            <Button size="md" variant="secondary">
              Read Documentation
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
