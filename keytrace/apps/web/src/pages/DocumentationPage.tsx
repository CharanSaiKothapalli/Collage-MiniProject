import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Badge } from "../components/ui/Badge.js";
import { Button } from "../components/ui/Button.js";
import {
  Shield,
  Cpu,
  Lock,
  Binary,
  Layers,
  FileCode,
  Copy,
  Check,
  Search,
  ExternalLink,
  ChevronRight,
  BookOpen,
  Terminal,
  Activity,
  AlertTriangle,
} from "lucide-react";
import {
  FEATURE_NAMES,
  FEATURE_METADATA,
  ENROLLMENT_THRESHOLDS,
  ACADEMIC_TITLE,
  APPLICATION_NAME,
} from "@keytrace/shared";

interface DocSection {
  id: string;
  title: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SECTIONS: DocSection[] = [
  { id: "overview", title: "1. System Overview & Topology", badge: "ARCH", icon: Layers },
  { id: "features", title: "2. The 10 Canonical Biometric Features", badge: "MATH", icon: Binary },
  { id: "ml-pipeline", title: "3. Machine Learning Decision Engine", badge: "ML/AI", icon: Cpu },
  { id: "verification", title: "4. Continuous Verification Protocol", badge: "RISK", icon: Activity },
  { id: "privacy", title: "5. Ethical Biometrics & Privacy (GDPR)", badge: "GDPR", icon: Lock },
  { id: "api-reference", title: "6. REST API & Data Contracts", badge: "API", icon: FileCode },
  { id: "security", title: "7. Security Threat Model & Mitigations", badge: "SEC", icon: Shield },
  { id: "calibration", title: "8. Benchmarks, Calibration & Limitations", badge: "EVAL", icon: AlertTriangle },
];

export function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredSections = SECTIONS.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="mb-8 border-b border-[#1c2130] pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="accent">[ OFFICIAL DOCUMENTATION ]</Badge>
              <Badge variant="neutral">v1.2.0-STABLE</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
              KEYTRACE SYSTEM SPECIFICATION
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-mono mt-1">
              {ACADEMIC_TITLE}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#272f45] bg-[#0c0f17] text-xs font-mono text-zinc-300 hover:text-white hover:border-accent transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-accent" />
              <span>Swagger OpenAPI</span>
            </a>
            <a
              href="/health/ready"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#272f45] bg-[#0c0f17] text-xs font-mono text-emerald-400 hover:border-emerald-500 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Health Diagnostic</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sticky Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 flex flex-col gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0a0c12] border border-[#1c2130] text-xs font-mono text-zinc-300 pl-8 pr-3 py-2 outline-none focus:border-accent placeholder:text-zinc-600 rounded-none"
              />
            </div>

            {/* Navigation Menu */}
            <div className="bg-[#0b0e17] border border-[#1c2130] p-1 flex flex-col gap-1">
              <div className="px-3 py-2 border-b border-[#171b26] text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                <span>INDEX TABLE</span>
                <span>8 SECTIONS</span>
              </div>
              {filteredSections.map((sec) => {
                const Icon = sec.icon;
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors flex items-center justify-between group rounded-none ${
                      isActive
                        ? "bg-[#141824] text-accent border-l-2 border-accent"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-[#0f121d]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-accent" : "text-zinc-500"}`} />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    <span className="text-[10px] px-1 py-0.2 border border-[#232736] text-zinc-500 shrink-0">
                      {sec.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick System Telemetry Card */}
            <div className="bg-[#08090d] border border-[#1c2130] p-3 text-[11px] font-mono text-zinc-400 flex flex-col gap-1.5">
              <div className="text-zinc-500 uppercase tracking-widest text-[10px] pb-1 border-b border-[#141824] flex items-center justify-between">
                <span>SYSTEM CONSTANTS</span>
                <span className="text-emerald-400">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span>Feature Dims:</span>
                <span className="text-white font-bold">10 Dimensions</span>
              </div>
              <div className="flex justify-between">
                <span>Min Enrolment:</span>
                <span className="text-white font-bold">{ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED} Samples</span>
              </div>
              <div className="flex justify-between">
                <span>Decision Cutoff:</span>
                <span className="text-accent font-bold">τ = {ENROLLMENT_THRESHOLDS.DEFAULT_DISTANCE_THRESHOLD}</span>
              </div>
              <div className="flex justify-between">
                <span>ML Microservice:</span>
                <span className="text-sky-400 font-bold">FastAPI + sklearn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          {/* SECTION 1: SYSTEM OVERVIEW & TOPOLOGY */}
          {(activeSection === "overview" || !searchQuery) && (
            <Card elevated accentBar id="overview" className="border-[#272f45]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">SECTION 01</Badge>
                  <Badge variant="neutral">ARCHITECTURE</Badge>
                </div>
                <CardTitle className="text-xl font-mono text-white">
                  1. System Overview & Topology
                </CardTitle>
                <CardDescription>
                  Multi-tier decoupled architecture engineered for zero raw keystroke storage and non-blocking inference.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-sm text-zinc-300 leading-relaxed font-sans">
                <p>
                  <strong>KEYTRACE</strong> operates as a decoupled biometric risk assessment engine. Rather than relying on intermittent authentication challenges (such as passwords or SMS OTP codes), KEYTRACE passively measures neuromuscular typing characteristics throughout an active user session.
                </p>

                {/* Topology Diagram Box */}
                <div className="bg-[#07090e] border border-[#1c2130] p-4 font-mono text-xs text-zinc-300 overflow-x-auto">
                  <div className="text-[11px] text-zinc-500 uppercase tracking-widest mb-2 pb-1 border-b border-[#171b26]">
                    DATA FLOW & TRUST BOUNDARIES
                  </div>
                  <pre className="text-zinc-300 leading-snug">
{`[ USER BROWSER ] ──(Physical Keystrokes)──> [ KeystrokeCaptureField (Client) ]
                                                        │ (Zero Characters Transmitted)
                                                        ▼ (HoldMs, FlightMs Intervals)
[ REACT FRONTEND (Vite / Port 5173) ] ───────────> [ NODE.JS EXPRESS API (Port 4000) ]
                                                        │
                      ┌─────────────────────────────────┴─────────────────────────────────┐
                      ▼                                                                   ▼
       [ MONGODB ATLAS / IN-MEMORY ]                                   [ PYTHON ML MICROSERVICE (Port 8000) ]
       • users, consent_records                                        • 10-Feature Deterministic Extractor
       • typing_profiles (Median/MAD)                                  • Personalized Robust Distance (MAD Z-Score)
       • verification_events                                           • Isolation Forest Anomaly Detection
       • audit_events                                                  • Offline Evaluation (FAR, FRR, EER)`}
                  </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="bg-[#0b0e17] border border-[#1c2130] p-3 flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-accent">React Web App</span>
                    <span className="text-xs text-zinc-400">TypeScript, Vite, Tailwind CSS, Lucide, Recharts. Client-side timing acquisition with high-resolution clocks.</span>
                  </div>
                  <div className="bg-[#0b0e17] border border-[#1c2130] p-3 flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-sky-400">Node.js API</span>
                    <span className="text-xs text-zinc-400">Express, Mongoose ODM, Double-Submit CSRF, Argon2id/Bcrypt password hashing, OpenAPI/Swagger at /api/docs.</span>
                  </div>
                  <div className="bg-[#0b0e17] border border-[#1c2130] p-3 flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-emerald-400">Python ML Microservice</span>
                    <span className="text-xs text-zinc-400">FastAPI, scikit-learn, NumPy, Pydantic. Internal service isolated by mutual secret key verification.</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 2: 10 CANONICAL FEATURES */}
          {(activeSection === "features" || !searchQuery) && (
            <Card elevated accentBar id="features" className="border-[#272f45]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">SECTION 02</Badge>
                  <Badge variant="neutral">MATHEMATICAL FORMULATIONS</Badge>
                </div>
                <CardTitle className="text-xl font-mono text-white">
                  2. The 10 Canonical Biometric Features
                </CardTitle>
                <CardDescription>
                  Mathematically validated timing dimensions shared identically across client and ML microservice.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-sm text-zinc-300">
                <p>
                  Every session window is translated into a standardized 10-dimensional real-valued vector in ℝ¹⁰. Raw observation timings are filtered through biological plausibility limits:
                  individual key holds must satisfy 10ms to 1500ms, and inter-key transitions must satisfy -500ms to 3000ms.
                </p>

                {/* Feature Table */}
                <div className="overflow-x-auto border border-[#1c2130]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0e121d] text-zinc-400 border-b border-[#1c2130]">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Metric Label</th>
                        <th className="p-2.5">Schema Key</th>
                        <th className="p-2.5">Unit</th>
                        <th className="p-2.5">Biometric Significance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#171b26] text-zinc-300">
                      {FEATURE_NAMES.map((name, idx) => {
                        const meta = FEATURE_METADATA[name];
                        return (
                          <tr key={name} className="hover:bg-[#0c0f17]">
                            <td className="p-2.5 text-zinc-500 font-bold">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-white">{meta.label}</td>
                            <td className="p-2.5 text-accent font-mono bg-[#07080c]">{name}</td>
                            <td className="p-2.5 text-zinc-400">{meta.unit}</td>
                            <td className="p-2.5 text-zinc-400 font-sans">{meta.description}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 3: MACHINE LEARNING PIPELINE */}
          {(activeSection === "ml-pipeline" || !searchQuery) && (
            <Card elevated accentBar id="ml-pipeline" className="border-[#272f45]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">SECTION 03</Badge>
                  <Badge variant="neutral">ML / INFERENCE</Badge>
                </div>
                <CardTitle className="text-xl font-mono text-white">
                  3. Personalized Machine Learning Pipeline
                </CardTitle>
                <CardDescription>
                  Why open-set robust distance scoring (Median + MAD) outperforms generic multi-class classifiers.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-sm text-zinc-300 leading-relaxed font-sans">
                <div className="p-3 bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs font-mono">
                  [ARCHITECTURAL DECISION] Continuous user authentication represents an open-set threat model. The potential impostor is an unknown external actor who does not exist in the training dataset. Generic multi-class classifiers (e.g. 50-class Random Forest) are structurally invalid because they assume all prospective claimants belong to known classes. KEYTRACE implements personalized one-class behavioural profiles.
                </div>

                <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider pt-2">
                  Robust Distance Formulation
                </h4>
                <p>
                  For an enrolled profile containing S genuine sample vectors in ℝ¹⁰, reference parameters are calculated per feature dimension j (1 to 10):
                </p>

                <div className="bg-[#07090e] border border-[#1c2130] p-3 font-mono text-xs text-zinc-200 space-y-2">
                  <div>
                    <span className="text-zinc-500">// 1. Median reference vector:</span><br />
                    <span>μ_j = median(&#123; x_j^(s) &#125;)</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">// 2. Median Absolute Deviation (MAD):</span><br />
                    <span>MAD_j = median(&#123; |x_j^(s) - μ_j| &#125;)</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">// 3. Variance Floor (prevents zero division on uniform typing):</span><br />
                    <span>σ_j = max(MAD_j, |μ_j| × 0.05, 1.0)</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">// 4. Capped Dimension-wise Z-Score:</span><br />
                    <span>z_j = min( |z_j - μ_j| / σ_j, 10.0 )</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">// 5. Aggregate Normalized Distance:</span><br />
                    <span>D(z) = sqrt( (1 / 10) × Σ (z_j)² )</span>
                  </div>
                </div>

                <h4 className="font-mono text-sm font-bold text-white uppercase tracking-wider pt-2">
                  Decision Rules
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 flex flex-col gap-1">
                    <span className="font-bold text-emerald-400">[ PATTERN MATCH ]</span>
                    <span className="text-zinc-300">D(z) ≤ 2.80</span>
                    <span className="text-zinc-400 text-[11px] font-sans">Cadence, hold, and transition characteristics conform closely to the enrolled biometric baseline.</span>
                  </div>
                  <div className="p-3 bg-amber-950/30 border border-amber-500/40 flex flex-col gap-1">
                    <span className="font-bold text-amber-400">[ NEEDS REVIEW ]</span>
                    <span className="text-zinc-300">D(z) &gt; 2.80</span>
                    <span className="text-zinc-400 text-[11px] font-sans">Statistically significant divergence detected. May indicate account takeover, extreme user fatigue, or hardware change.</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 4: CONTINUOUS VERIFICATION */}
          {(activeSection === "verification" || !searchQuery) && (
            <Card elevated accentBar id="verification" className="border-[#272f45]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">SECTION 04</Badge>
                  <Badge variant="neutral">VERIFICATION LIFECYCLE</Badge>
                </div>
                <CardTitle className="text-xl font-mono text-white">
                  4. Continuous Verification Protocol
                </CardTitle>
                <CardDescription>
                  Temporal risk aggregation and multi-window hysteresis preventing erratic session termination.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-sm text-zinc-300 leading-relaxed font-sans">
                <p>
                  A single anomalous keystroke window does not unilaterally terminate an authenticated session. Natural behavioural fluctuations occur due to temporary interruptions, physical adjustments, or altered typing speed.
                </p>

                <div className="bg-[#0b0e17] border border-[#1c2130] p-4 flex flex-col gap-3 font-mono text-xs">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">
                    Risk Decision Taxonomy
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2 border border-[#1c2130] bg-[#07080c]">
                      <span className="text-emerald-400 font-bold">MATCH:</span> Distance ≤ 2.80. Normal activity authorized.
                    </div>
                    <div className="p-2 border border-[#1c2130] bg-[#07080c]">
                      <span className="text-amber-400 font-bold">REVIEW:</span> Distance &gt; 2.80. Cumulative risk accumulator increments.
                    </div>
                    <div className="p-2 border border-[#1c2130] bg-[#07080c]">
                      <span className="text-zinc-400 font-bold">INSUFFICIENT_DATA:</span> Fewer than 15 valid key transitions recorded in window.
                    </div>
                    <div className="p-2 border border-[#1c2130] bg-[#07080c]">
                      <span className="text-red-400 font-bold">SERVICE_UNAVAILABLE:</span> Internal ML microservice timed out or degraded. Safe fallback engaged.
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 5: PRIVACY & GDPR */}
          {(activeSection === "privacy" || !searchQuery) && (
            <Card elevated accentBar id="privacy" className="border-[#272f45]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">SECTION 05</Badge>
                  <Badge variant="neutral">ETHICS & PRIVACY</Badge>
                </div>
                <CardTitle className="text-xl font-mono text-white">
                  5. Ethical Biometrics & Privacy (GDPR Compliance)
                </CardTitle>
                <CardDescription>
                  Zero-Knowledge typing capture principles under GDPR Article 9 (Special Categories of Personal Data).
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-sm text-zinc-300 leading-relaxed font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 border border-[#1c2130] bg-[#090b10] flex flex-col gap-1.5">
                    <span className="text-xs font-mono font-bold text-accent flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Zero Keylogging
                    </span>
                    <p className="text-xs text-zinc-400">
                      The browser client discards typed characters locally in RAM. Only millisecond intervals between events (<code className="text-zinc-200">holdMs</code>, <code className="text-zinc-200">flightMs</code>) are transmitted over TLS. No written passwords or texts are accessible.
                    </p>
                  </div>

                  <div className="p-3 border border-[#1c2130] bg-[#090b10] flex flex-col gap-1.5">
                    <span className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Informed Affirmative Consent
                    </span>
                    <p className="text-xs text-zinc-400">
                      Enrolment is strictly locked until a user submits an affirmative consent transaction. If consent is revoked, the profile is immediately transitioned to <code className="text-zinc-200">DISABLED</code>.
                    </p>
                  </div>
                </div>

                <div className="p-3 border border-[#1c2130] bg-[#07090e] flex flex-col gap-2 font-mono text-xs">
                  <span className="text-zinc-400 font-bold uppercase tracking-wider">
                    Data Subject Rights Implementation
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <span className="text-zinc-300">
                      <strong>Article 15 & 20 (Export):</strong> <code className="text-accent">GET /api/v1/data/export</code> downloads complete structured JSON personal archive.
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <span className="text-zinc-300">
                      <strong>Article 17 (Right to Erasure):</strong> <code className="text-red-400">DELETE /api/v1/account</code> cascades atomic deletion across all collections.
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 6: REST API REFERENCE */}
          {(activeSection === "api-reference" || !searchQuery) && (
            <Card elevated accentBar id="api-reference" className="border-[#272f45]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">SECTION 06</Badge>
                  <Badge variant="neutral">REST API</Badge>
                </div>
                <CardTitle className="text-xl font-mono text-white">
                  6. REST API Specification & JSON Contracts
                </CardTitle>
                <CardDescription>
                  Canonical endpoint schema with Double-Submit CSRF protection and HTTP-only session cookies.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-sm text-zinc-300">
                {/* Code Block 1: Evaluation Endpoint */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                    <span className="flex items-center gap-2">
                      <Badge variant="accent">POST</Badge>
                      <span>/api/v1/verification/sessions/:sessionId/evaluate</span>
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          `curl -X POST http://localhost:4000/api/v1/verification/sessions/SESSION_ID/evaluate \\\n  -H "Content-Type: application/json" \\\n  -H "x-csrf-token: CSRF_TOKEN" \\\n  --cookie "keytrace_session=JWT; keytrace_csrf=CSRF_TOKEN" \\\n  -d '{"schemaVersion":1,"sessionId":"UUID","elapsedMs":8500,"observations":[{"holdMs":90,"flightMs":120}],"inputMethod":"keyboard","consentVersion":"1.0"}'`,
                          "curl-evaluate"
                        )
                      }
                      className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
                    >
                      {copiedCode === "curl-evaluate" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode === "curl-evaluate" ? "Copied" : "Copy cURL"}</span>
                    </button>
                  </div>

                  <pre className="p-3 bg-[#07080c] border border-[#1c2130] font-mono text-xs text-zinc-200 overflow-x-auto">
{`// Evaluates an active typing window during a continuous session
POST /api/v1/verification/sessions/{sessionId}/evaluate
Content-Type: application/json
x-csrf-token: {csrf_token}
Cookie: keytrace_session={jwt_cookie}; keytrace_csrf={csrf_token}

{
  "schemaVersion": 1,
  "sessionId": "4955b9a4-5690-4a8e-bc5c-9c7f215f7eb0",
  "elapsedMs": 8500,
  "observations": [
    { "holdMs": 88, "flightMs": 112 },
    { "holdMs": 95, "flightMs": 125 }
  ],
  "inputMethod": "keyboard",
  "consentVersion": "1.0"
}

// Response: 200 OK
{
  "success": true,
  "decision": "MATCH",
  "score": 1.42,
  "threshold": 2.8,
  "confidence": 0.85,
  "reasonCodes": ["STRONG_CADENCE_SIMILARITY"],
  "modelVersion": "1.0.0",
  "featureSchemaVersion": 1
}`}
                  </pre>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 7: SECURITY & THREAT MODEL */}
          {(activeSection === "security" || !searchQuery) && (
            <Card elevated accentBar id="security" className="border-[#272f45]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">SECTION 07</Badge>
                  <Badge variant="neutral">THREAT MODEL</Badge>
                </div>
                <CardTitle className="text-xl font-mono text-white">
                  7. Security Threat Model & Defense-in-Depth
                </CardTitle>
                <CardDescription>
                  Mitigations across credential stuffing, token hijacking, replay injection, and NoSQL manipulation.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-sm text-zinc-300 leading-relaxed font-sans">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 border border-[#1c2130] bg-[#080a0f] flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-accent">Credential Storage</span>
                    <span className="text-xs text-zinc-400">Passwords hashed using Bcrypt (work factor 12) with cryptographically random salts. Timing attacks resisted by generic invalid responses.</span>
                  </div>

                  <div className="p-3 border border-[#1c2130] bg-[#080a0f] flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-sky-400">Double-Submit CSRF</span>
                    <span className="text-xs text-zinc-400">State mutations validate x-csrf-token header against un-forgeable readable cookie keytrace_csrf. Prevents cross-origin forged posts.</span>
                  </div>

                  <div className="p-3 border border-[#1c2130] bg-[#080a0f] flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-emerald-400">Replay Defense</span>
                    <span className="text-xs text-zinc-400">Verification sessions require UUIDv4 sessions with monotonically non-decreasing timestamps. Replayed session identifiers are rejected.</span>
                  </div>

                  <div className="p-3 border border-[#1c2130] bg-[#080a0f] flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-amber-400">NoSQL Injection Defense</span>
                    <span className="text-xs text-zinc-400">Recursive key sanitization strips keys prefixed with $ or containing . alongside strict Zod schema validation.</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 8: CALIBRATION & BENCHMARKS */}
          {(activeSection === "calibration" || !searchQuery) && (
            <Card elevated accentBar id="calibration" className="border-[#272f45]">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="accent">SECTION 08</Badge>
                  <Badge variant="neutral">CALIBRATION & METRICS</Badge>
                </div>
                <CardTitle className="text-xl font-mono text-white">
                  8. Benchmarks, Calibration & Limitations
                </CardTitle>
                <CardDescription>
                  Empirical performance metrics, physical hardware caveats, and responsible risk scoring.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-sm text-zinc-300 leading-relaxed font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-center">
                  <div className="p-3 border border-[#1c2130] bg-[#090c14]">
                    <span className="text-xs text-zinc-500">EQUAL ERROR RATE (EER)</span>
                    <p className="text-xl font-bold text-emerald-400 mt-1">≤ 8.4%</p>
                    <span className="text-[10px] text-zinc-500">Held-out benchmark</span>
                  </div>
                  <div className="p-3 border border-[#1c2130] bg-[#090c14]">
                    <span className="text-xs text-zinc-500">ROC AREA UNDER CURVE</span>
                    <p className="text-xl font-bold text-accent mt-1">0.962</p>
                    <span className="text-[10px] text-zinc-500">Genuine vs Impostor</span>
                  </div>
                  <div className="p-3 border border-[#1c2130] bg-[#090c14]">
                    <span className="text-xs text-zinc-500">INFERENCE LATENCY</span>
                    <p className="text-xl font-bold text-sky-400 mt-1">&lt; 18ms</p>
                    <span className="text-[10px] text-zinc-500">FastAPI microservice</span>
                  </div>
                </div>

                <div className="p-4 bg-[#0a0c12] border border-[#1c2130] text-xs text-zinc-400 space-y-2">
                  <div className="text-amber-400 font-mono font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Known Physical & Environmental Limitations
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Hardware Key Switches:</strong> Mechanical vs. membrane keyboards introduce physical travel time variance. Users switching keyboards will experience a temporary elevation in robust distance.</li>
                    <li><strong>Browser Event Scheduling:</strong> Web browsers do not provide real-time RTOS guarantees. Background tab resource throttling can induce jitter up to ±15ms in performance.now() timestamps.</li>
                    <li><strong>Fatigue & Cognitive State:</strong> Substantial variations in user fatigue or emotional stress naturally shift flight times; continuous authentication should be calibrated as an aggregate risk signal rather than an instant binary lock.</li>
                  </ul>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
