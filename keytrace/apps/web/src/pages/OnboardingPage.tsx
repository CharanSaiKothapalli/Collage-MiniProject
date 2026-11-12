import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge } from "../components/ui/Badge.js";
import { KeystrokeCaptureField } from "../components/keystroke/KeystrokeCaptureField.js";
import { Sparkles, CheckCircle2, ArrowRight, Keyboard, Activity } from "lucide-react";

export function OnboardingPage() {
  const navigate = useNavigate();
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [practiceFeatures, setPracticeFeatures] = useState<any>(null);

  const handlePracticeSession = (payload: any) => {
    setPracticeCompleted(true);
    const holds = payload.observations.map((o: any) => o.holdMs);
    const flights = payload.observations.map((o: any) => o.flightMs);
    const avgH = Math.round(holds.reduce((a: number, b: number) => a + b, 0) / holds.length);
    const avgF = Math.round(flights.reduce((a: number, b: number) => a + b, 0) / flights.length);
    setPracticeFeatures({ avgH, avgF, count: payload.observations.length });
  };

  return (
    <div className="max-w-4xl mx-auto py-6 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Badge variant="blue" className="self-start">
          <Sparkles className="w-3.5 h-3.5 mr-1" /> FIRST-TIME ORIENTATION
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]">
          Welcome to KEYTRACE Behavioral Security
        </h1>
        <p className="text-xs sm:text-sm text-[#94A3B8]">
          Follow this 3-step walkthrough to understand how your typing baseline is built and practice typing with live cadence metrics.
        </p>
      </div>

      {/* 3 Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card elevated className="flex flex-col gap-3 p-5">
          <div className="w-8 h-8 rounded-xl bg-[#0B1220] border border-[#263B5E] flex items-center justify-center text-[#38BDF8] font-bold text-xs font-mono">
            01
          </div>
          <CardTitle className="text-sm font-bold text-[#F8FAFC]">Understand Timing</CardTitle>
          <CardDescription className="text-xs text-[#94A3B8] leading-relaxed">
            Your typing pattern is characterized by millisecond durations of key holds and flight transitions between letters.
          </CardDescription>
        </Card>

        <Card elevated className="flex flex-col gap-3 p-5">
          <div className="w-8 h-8 rounded-xl bg-[#0B1220] border border-[#263B5E] flex items-center justify-center text-[#FF6A00] font-bold text-xs font-mono">
            02
          </div>
          <CardTitle className="text-sm font-bold text-[#F8FAFC]">Enroll 10 Sessions</CardTitle>
          <CardDescription className="text-xs text-[#94A3B8] leading-relaxed">
            A single session has natural variance. Completing 10 short typing sessions builds a statistically robust profile.
          </CardDescription>
        </Card>

        <Card elevated className="flex flex-col gap-3 p-5">
          <div className="w-8 h-8 rounded-xl bg-[#0B1220] border border-[#263B5E] flex items-center justify-center text-[#22C55E] font-bold text-xs font-mono">
            03
          </div>
          <CardTitle className="text-sm font-bold text-[#F8FAFC]">Continuous Check</CardTitle>
          <CardDescription className="text-xs text-[#94A3B8] leading-relaxed">
            During active verification sessions, KEYTRACE periodically evaluates typing windows against your baseline.
          </CardDescription>
        </Card>
      </div>

      {/* Interactive Practice Component */}
      <Card elevated className="p-6 sm:p-8 flex flex-col gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#38BDF8] flex items-center gap-1.5 mb-1 font-mono">
            <Keyboard className="w-4 h-4" /> Interactive Practice Sandbox
          </span>
          <h2 className="text-xl font-bold text-[#F8FAFC]">
            Test Your Cadence Before Enrolment
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Type the prompt below to observe your live hold and flight durations. This sample is for practice and is not saved to your profile.
          </p>
        </div>

        <KeystrokeCaptureField
          onSessionComplete={handlePracticeSession}
          buttonLabel="Evaluate Practice Cadence"
          targetPromptText="Continuous behavioural keystroke dynamics provides invisible, unobtrusive security protection."
          placeholder="Click here and practice typing naturally..."
        />

        {practiceCompleted && practiceFeatures && (
          <div className="p-4 rounded-xl bg-[#0B1220] border border-[#263B5E] flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#22C55E] shrink-0" />
              <div>
                <span className="text-xs font-bold text-[#F8FAFC] block">
                  Practice Sample Registered!
                </span>
                <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                  Mean Hold: <span className="text-[#38BDF8]">{practiceFeatures.avgH}ms</span> &bull; Mean Flight:{" "}
                  <span className="text-[#FF6A00]">{practiceFeatures.avgF}ms</span> &bull; Keys:{" "}
                  <span className="text-[#22C55E] font-bold">{practiceFeatures.count}</span>
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/enrollment")}
              className="w-full sm:w-auto"
            >
              Start Official Enrolment <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={() => navigate("/enrollment")} className="text-[#94A3B8] hover:text-[#F8FAFC]">
          Skip directly to enrolment <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>
    </div>
  );
}
