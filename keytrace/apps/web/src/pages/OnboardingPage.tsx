import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { Badge } from "../components/ui/Badge.js";
import { KeystrokeCaptureField } from "../components/keystroke/KeystrokeCaptureField.js";
import { Shield, Sparkles, CheckCircle2, ArrowRight, Keyboard, Activity } from "lucide-react";

export function OnboardingPage() {
  const navigate = useNavigate();
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [practiceFeatures, setPracticeFeatures] = useState<any>(null);

  const handlePracticeSession = (payload: any) => {
    setPracticeCompleted(true);
    // Mock calculate client display metrics
    const holds = payload.observations.map((o: any) => o.holdMs);
    const flights = payload.observations.map((o: any) => o.flightMs);
    const avgH = Math.round(holds.reduce((a: number, b: number) => a + b, 0) / holds.length);
    const avgF = Math.round(flights.reduce((a: number, b: number) => a + b, 0) / flights.length);
    setPracticeFeatures({ avgH, avgF, count: observationsCount(payload) });
  };

  const observationsCount = (payload: any) => payload.observations.length;

  return (
    <div className="max-w-4xl mx-auto py-6 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Badge variant="accent" className="self-start">
          <Sparkles className="w-3.5 h-3.5" /> First-Time Orientation
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome to KEYTRACE Behavioral Security
        </h1>
        <p className="text-sm text-foreground-muted">
          Follow this 3-step walkthrough to understand how your typing baseline is built and practice typing with live cadence metrics.
        </p>
      </div>

      {/* 3 Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card elevated className="flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-accent font-bold text-sm">
            1
          </div>
          <CardTitle className="text-base">Understand Timing</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Your typing pattern is characterized by millisecond durations of key holds and flight transitions between letters.
          </CardDescription>
        </Card>

        <Card elevated className="flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm">
            2
          </div>
          <CardTitle className="text-base">Enrol 10 Sessions</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            A single session has natural variance. Completing 10 short typing sessions builds a statistically robust profile.
          </CardDescription>
        </Card>

        <Card elevated className="flex flex-col gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
            3
          </div>
          <CardTitle className="text-base">Continuous Check</CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            During active verification sessions, KEYTRACE periodically evaluates typing windows against your baseline.
          </CardDescription>
        </Card>
      </div>

      {/* Interactive Practice Component */}
      <Card elevated className="p-6 sm:p-8 flex flex-col gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5 mb-1">
            <Keyboard className="w-4 h-4" /> Interactive Practice Sandbox
          </span>
          <h2 className="text-xl font-bold text-foreground">
            Test Your Cadence Before Enrolment
          </h2>
          <p className="text-xs text-foreground-muted">
            Type the prompt below to see your live hold and flight durations. This sample is for practice and is not saved to your profile.
          </p>
        </div>

        <KeystrokeCaptureField
          onSessionComplete={handlePracticeSession}
          buttonLabel="Evaluate Practice Cadence"
          targetPromptText="Continuous behavioural keystroke dynamics provides invisible, unobtrusive security protection."
          placeholder="Click here and practice typing naturally..."
        />

        {practiceCompleted && practiceFeatures && (
          <div className="p-4 rounded-xl bg-surface-subtle border border-border flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <span className="text-sm font-semibold text-foreground">
                  Practice Sample Registered!
                </span>
                <p className="text-xs text-foreground-muted">
                  Mean Hold: <span className="font-mono text-accent">{practiceFeatures.avgH}ms</span> &bull; Mean Flight:{" "}
                  <span className="font-mono text-sky-400">{practiceFeatures.avgF}ms</span> &bull; Observations:{" "}
                  <span className="font-mono text-foreground">{practiceFeatures.count}</span>
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/enrollment")}
              className="w-full sm:w-auto"
            >
              Start Official Enrolment <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Button variant="ghost" size="md" onClick={() => navigate("/enrollment")}>
          Skip directly to enrolment <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
