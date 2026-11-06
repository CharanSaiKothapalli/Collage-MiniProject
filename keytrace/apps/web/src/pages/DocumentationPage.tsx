import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Badge } from "../components/ui/Badge.js";
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
      <div className="mb-8 border-b border-[#243247] pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="cyan">OFFICIAL DOCUMENTATION</Badge>
              <Badge variant="neutral">v1.2.0-STABLE</Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F4F7FC]">
              KEYTRACE SYSTEM SPECIFICATION
            </h1>
            <p className="text-xs sm:text-sm text-[#94A3B8] font-mono mt-1">
              {ACADEMIC_TITLE}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#243247] bg-[#111927] text-xs font-mono text-[#94A3B8] hover:text-[#F4F7FC] hover:border-[#35D6E8] rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#35D6E8]" />
              <span>Swagger OpenAPI</span>
            </a>
            <a
              href="/health/ready"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#243247] bg-[#111927] text-xs font-mono text-[#32D6A0] hover:border-[#32D6A0] rounded-lg transition-colors"
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
              <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#111927] border border-[#243247] text-xs font-mono text-[#F4F7FC] pl-8 pr-3 py-2 outline-none focus:border-[#35D6E8] placeholder-[#94A3B8]/60 rounded-xl"
              />
            </div>

            {/* Navigation Menu */}
            <div className="bg-[#111927] border border-[#243247] p-1.5 rounded-xl flex flex-col gap-1">
              <div className="px-3 py-2 border-b border-[#243247] text-[10px] font-mono uppercase tracking-widest text-[#94A3B8] flex items-center justify-between">
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
                    className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors flex items-center justify-between group rounded-lg ${
                      isActive
                        ? "bg-[#172235] text-[#35D6E8] border-l-2 border-[#35D6E8]"
                        : "text-[#94A3B8] hover:text-[#F4F7FC] hover:bg-[#172235]/60"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#35D6E8]" : "text-[#94A3B8]"}`} />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 border border-[#243247] text-[#94A3B8] rounded bg-[#0D1320] shrink-0">
                      {sec.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick System Telemetry Card */}
            <div className="bg-[#0D1320] border border-[#243247] p-4 rounded-xl text-[11px] font-mono text-[#94A3B8] flex flex-col gap-2">
              <div className="text-[#94A3B8] uppercase tracking-widest text-[10px] pb-1 border-b border-[#243247] flex items-center justify-between">
                <span>SYSTEM CONSTANTS</span>
                <span className="text-[#32D6A0]">ACTIVE</span>
              </div>
              <div className="flex justify-between">
                <span>Feature Dims:</span>
                <span className="text-[#F4F7FC] font-bold">10 Dimensions</span>
              </div>
              <div className="flex justify-between">
                <span>Min Enrolment:</span>
                <span className="text-[#F4F7FC] font-bold">{ENROLLMENT_THRESHOLDS.MIN_SAMPLES_REQUIRED} Samples</span>
              </div>
              <div className="flex justify-between">
                <span>Decision Cutoff:</span>
                <span className="text-[#35D6E8] font-bold">τ = {ENROLLMENT_THRESHOLDS.DEFAULT_DISTANCE_THRESHOLD}</span>
              </div>
              <div className="flex justify-between">
                <span>ML Microservice:</span>
                <span className="text-[#8B7CFF] font-bold">FastAPI + sklearn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="lg:col-span-3 flex flex-col gap-8">
          {/* SECTION 1: SYSTEM OVERVIEW & TOPOLOGY */}
          {(activeSection === "overview" || !searchQuery) && (
            <Card elevated id="overview">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="cyan">SECTION 01</Badge>
                  <Badge variant="neutral">ARCHITECTURE</Badge>
                </div>
                <CardTitle className="text-xl font-bold text-[#F4F7FC]">
                  1. System Overview &amp; Topology
                </CardTitle>
                <CardDescription className="text-xs text-[#94A3B8]">
                  Multi-tier decoupled architecture engineered for zero raw keystroke storage and non-blocking inference.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-xs text-[#94A3B8] leading-relaxed">
                <p className="text-[#F4F7FC]">
                  <strong className="text-[#35D6E8]">KEYTRACE</strong> operates as a continuous biometric risk assessment engine. Rather than relying on intermittent authentication challenges (such as passwords or SMS OTP codes), KEYTRACE passively measures neuromuscular typing characteristics throughout an active user session.
                </p>

                {/* Topology Diagram Box */}
                <div className="bg-[#0D1320] border border-[#243247] p-4 rounded-xl font-mono text-xs text-[#F4F7FC] overflow-x-auto">
                  <div className="text-[10px] text-[#94A3B8] uppercase tracking-widest mb-2 pb-1 border-b border-[#243247]">
                    DATA FLOW &amp; TRUST BOUNDARIES
                  </div>
                  <pre className="text-[#94A3B8] leading-snug">
{`[ USER BROWSER ] ──(Physical Keystrokes)──> [ KeystrokeCaptureField (Client) ]
                                                        │ (Zero Characters Transmitted)
                                                        ▼ (HoldMs, FlightMs Intervals)
[ REACT FRONTEND (Vite / Port 5174) ] ───────────> [ NODE.JS EXPRESS API (Port 5000) ]
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
                  <div className="bg-[#0D1320] border border-[#243247] p-3.5 rounded-xl flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-[#35D6E8]">React Web App</span>
                    <span className="text-[11px] text-[#94A3B8]">TypeScript, Vite, Tailwind CSS, Lucide, Recharts. Client-side timing acquisition with high-resolution clocks.</span>
                  </div>
                  <div className="bg-[#0D1320] border border-[#243247] p-3.5 rounded-xl flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-[#8B7CFF]">Node.js API</span>
                    <span className="text-[11px] text-[#94A3B8]">Express, Mongoose ODM, Double-Submit CSRF, Argon2id/Bcrypt password hashing, OpenAPI/Swagger at /api/docs.</span>
                  </div>
                  <div className="bg-[#0D1320] border border-[#243247] p-3.5 rounded-xl flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-[#32D6A0]">Python ML Service</span>
                    <span className="text-[11px] text-[#94A3B8]">FastAPI, scikit-learn, NumPy, Pydantic. Internal service isolated by mutual secret key verification.</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 2: 10 CANONICAL FEATURES */}
          {(activeSection === "features" || !searchQuery) && (
            <Card elevated id="features">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="cyan">SECTION 02</Badge>
                  <Badge variant="neutral">MATHEMATICAL FORMULATIONS</Badge>
                </div>
                <CardTitle className="text-xl font-bold text-[#F4F7FC]">
                  2. The 10 Canonical Biometric Features
                </CardTitle>
                <CardDescription className="text-xs text-[#94A3B8]">
                  Mathematically validated timing dimensions shared identically across client and ML microservice.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-xs text-[#94A3B8]">
                <p className="text-[#F4F7FC]">
                  Every session window is translated into a standardized 10-dimensional real-valued vector in ℝ¹⁰. Raw observation timings are filtered through biological plausibility limits:
                  individual key holds must satisfy 10ms to 1500ms, and inter-key transitions must satisfy -500ms to 3000ms.
                </p>

                {/* Feature Table */}
                <div className="overflow-x-auto border border-[#243247] rounded-xl">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0D1320] text-[#94A3B8] border-b border-[#243247]">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Metric Label</th>
                        <th className="p-3">Schema Key</th>
                        <th className="p-3">Unit</th>
                        <th className="p-3">Biometric Significance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#243247]/50 text-[#F4F7FC]">
                      {FEATURE_NAMES.map((name, idx) => {
                        const meta = FEATURE_METADATA[name];
                        return (
                          <tr key={name} className="hover:bg-[#172235]/40 transition-colors">
                            <td className="p-3 text-[#94A3B8] font-bold">{idx + 1}</td>
                            <td className="p-3 font-bold text-[#F4F7FC]">{meta.label}</td>
                            <td className="p-3 text-[#35D6E8] font-mono bg-[#0D1320]">{name}</td>
                            <td className="p-3 text-[#94A3B8]">{meta.unit}</td>
                            <td className="p-3 text-[#94A3B8] font-sans">{meta.description}</td>
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
            <Card elevated id="ml-pipeline">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="cyan">SECTION 03</Badge>
                  <Badge variant="neutral">ML / INFERENCE</Badge>
                </div>
                <CardTitle className="text-xl font-bold text-[#F4F7FC]">
                  3. Personalized Machine Learning Pipeline
                </CardTitle>
                <CardDescription className="text-xs text-[#94A3B8]">
                  Why open-set robust distance scoring (Median + MAD) outperforms generic multi-class classifiers.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-xs text-[#94A3B8] leading-relaxed">
                <div className="p-3.5 bg-[#FFBF55]/10 border border-[#FFBF55]/20 rounded-xl text-[#FFBF55] font-mono text-xs">
                  [ARCHITECTURAL DECISION] Continuous user authentication represents an open-set threat model. The potential impostor is an unknown external actor who does not exist in the training dataset. Generic multi-class classifiers are structurally invalid because they assume all prospective claimants belong to known classes. KEYTRACE implements personalized one-class behavioural profiles.
                </div>

                <h4 className="font-mono text-xs font-bold text-[#F4F7FC] uppercase tracking-wider pt-2">
                  Robust Distance Formulation
                </h4>
                <p>
                  For an enrolled profile containing S genuine sample vectors in ℝ¹⁰, reference parameters are calculated per feature dimension j (1 to 10):
                </p>

                <div className="bg-[#0D1320] border border-[#243247] p-4 rounded-xl font-mono text-xs text-[#F4F7FC] space-y-2">
                  <div>
                    <span className="text-[#94A3B8]">// 1. Median reference vector:</span><br />
                    <span>μ_j = median(&#123; x_j^(s) &#125;)</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8]">// 2. Median Absolute Deviation (MAD):</span><br />
                    <span>MAD_j = median(&#123; |x_j^(s) - μ_j| &#125;)</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8]">// 3. Variance Floor (prevents zero division on uniform typing):</span><br />
                    <span>σ_j = max(MAD_j, |μ_j| × 0.05, 1.0)</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8]">// 4. Capped Dimension-wise Z-Score:</span><br />
                    <span>z_j = min( |z_j - μ_j| / σ_j, 10.0 )</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8]">// 5. Aggregate Normalized Distance:</span><br />
                    <span>D(z) = sqrt( (1 / 10) × Σ (z_j)² )</span>
                  </div>
                </div>

                <h4 className="font-mono text-xs font-bold text-[#F4F7FC] uppercase tracking-wider pt-2">
                  Decision Rules
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div className="p-3.5 bg-[#32D6A0]/10 border border-[#32D6A0]/20 rounded-xl flex flex-col gap-1">
                    <span className="font-bold text-[#32D6A0]">[ PATTERN MATCH ]</span>
                    <span className="text-[#F4F7FC]">D(z) ≤ 2.80</span>
                    <span className="text-[#94A3B8] text-[11px] font-sans">Cadence, hold, and transition characteristics conform closely to the enrolled biometric baseline.</span>
                  </div>
                  <div className="p-3.5 bg-[#FFBF55]/10 border border-[#FFBF55]/20 rounded-xl flex flex-col gap-1">
                    <span className="font-bold text-[#FFBF55]">[ NEEDS REVIEW ]</span>
                    <span className="text-[#F4F7FC]">D(z) &gt; 2.80</span>
                    <span className="text-[#94A3B8] text-[11px] font-sans">Statistically significant divergence detected. May indicate account takeover, extreme user fatigue, or hardware change.</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 4: CONTINUOUS VERIFICATION */}
          {(activeSection === "verification" || !searchQuery) && (
            <Card elevated id="verification">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="cyan">SECTION 04</Badge>
                  <Badge variant="neutral">VERIFICATION LIFECYCLE</Badge>
                </div>
                <CardTitle className="text-xl font-bold text-[#F4F7FC]">
                  4. Continuous Verification Protocol
                </CardTitle>
                <CardDescription className="text-xs text-[#94A3B8]">
                  Temporal risk aggregation and multi-window hysteresis preventing erratic session termination.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-xs text-[#94A3B8] leading-relaxed">
                <p className="text-[#F4F7FC]">
                  A single anomalous keystroke window does not unilaterally terminate an authenticated session. Natural behavioural fluctuations occur due to temporary interruptions, physical adjustments, or altered typing speed.
                </p>

                <div className="bg-[#0D1320] border border-[#243247] p-4 rounded-xl flex flex-col gap-3 font-mono text-xs">
                  <span className="text-xs font-bold text-[#35D6E8] uppercase tracking-wider">
                    Risk Decision Taxonomy
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-2.5 border border-[#243247] bg-[#111927] rounded-lg">
                      <span className="text-[#32D6A0] font-bold">MATCH:</span> Distance ≤ 2.80. Normal activity authorized.
                    </div>
                    <div className="p-2.5 border border-[#243247] bg-[#111927] rounded-lg">
                      <span className="text-[#FFBF55] font-bold">REVIEW:</span> Distance &gt; 2.80. Cumulative risk accumulator increments.
                    </div>
                    <div className="p-2.5 border border-[#243247] bg-[#111927] rounded-lg">
                      <span className="text-[#94A3B8] font-bold">INSUFFICIENT_DATA:</span> Fewer than 15 valid key transitions recorded in window.
                    </div>
                    <div className="p-2.5 border border-[#243247] bg-[#111927] rounded-lg">
                      <span className="text-[#FF647C] font-bold">SERVICE_UNAVAILABLE:</span> Internal ML microservice timed out or degraded. Safe fallback engaged.
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 5: PRIVACY & GDPR */}
          {(activeSection === "privacy" || !searchQuery) && (
            <Card elevated id="privacy">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="cyan">SECTION 05</Badge>
                  <Badge variant="neutral">ETHICS &amp; PRIVACY</Badge>
                </div>
                <CardTitle className="text-xl font-bold text-[#F4F7FC]">
                  5. Ethical Biometrics &amp; Privacy (GDPR Compliance)
                </CardTitle>
                <CardDescription className="text-xs text-[#94A3B8]">
                  Zero-Knowledge typing capture principles under GDPR Article 9 (Special Categories of Personal Data).
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-xs text-[#94A3B8] leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 border border-[#243247] bg-[#0D1320] rounded-xl flex flex-col gap-1.5">
                    <span className="text-xs font-mono font-bold text-[#35D6E8] flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Zero Keylogging
                    </span>
                    <p className="text-[11px] text-[#94A3B8]">
                      The browser client discards typed characters locally in RAM. Only millisecond intervals between events (<code className="text-[#F4F7FC]">holdMs</code>, <code className="text-[#F4F7FC]">flightMs</code>) are transmitted over TLS. No written passwords or texts are accessible.
                    </p>
                  </div>

                  <div className="p-3.5 border border-[#243247] bg-[#0D1320] rounded-xl flex flex-col gap-1.5">
                    <span className="text-xs font-mono font-bold text-[#32D6A0] flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Informed Affirmative Consent
                    </span>
                    <p className="text-[11px] text-[#94A3B8]">
                      Enrolment is strictly locked until a user submits an affirmative consent transaction. If consent is revoked, the profile is immediately transitioned to <code className="text-[#F4F7FC]">DISABLED</code>.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 border border-[#243247] bg-[#0D1320] rounded-xl flex flex-col gap-2 font-mono text-xs">
                  <span className="text-[#94A3B8] font-bold uppercase tracking-wider">
                    Data Subject Rights Implementation
                  </span>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <span className="text-[#F4F7FC]">
                      <strong>Article 15 &amp; 20 (Export):</strong> <code className="text-[#35D6E8]">GET /api/v1/data/export</code> downloads complete structured JSON personal archive.
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <span className="text-[#F4F7FC]">
                      <strong>Article 17 (Right to Erasure):</strong> <code className="text-[#FF647C]">DELETE /api/v1/account</code> cascades atomic deletion across all collections.
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 6: REST API REFERENCE */}
          {(activeSection === "api-reference" || !searchQuery) && (
            <Card elevated id="api-reference">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="cyan">SECTION 06</Badge>
                  <Badge variant="neutral">REST API</Badge>
                </div>
                <CardTitle className="text-xl font-bold text-[#F4F7FC]">
                  6. REST API Specification &amp; JSON Contracts
                </CardTitle>
                <CardDescription className="text-xs text-[#94A3B8]">
                  Canonical endpoint schema with Double-Submit CSRF protection and HTTP-only session cookies.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-xs text-[#94A3B8]">
                {/* Code Block 1: Evaluation Endpoint */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
                    <span className="flex items-center gap-2">
                      <Badge variant="cyan">POST</Badge>
                      <span className="text-[#F4F7FC]">/api/v1/verification/sessions/:sessionId/evaluate</span>
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          `curl -X POST http://localhost:5000/api/v1/verification/sessions/SESSION_ID/evaluate \\\n  -H "Content-Type: application/json" \\\n  -H "x-csrf-token: CSRF_TOKEN" \\\n  --cookie "keytrace_session=JWT; keytrace_csrf=CSRF_TOKEN" \\\n  -d '{"schemaVersion":1,"sessionId":"UUID","elapsedMs":8500,"observations":[{"holdMs":90,"flightMs":120}],"inputMethod":"keyboard","consentVersion":"1.0"}'`,
                          "curl-evaluate"
                        )
                      }
                      className="flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-[#F4F7FC]"
                    >
                      {copiedCode === "curl-evaluate" ? <Check className="w-3.5 h-3.5 text-[#32D6A0]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedCode === "curl-evaluate" ? "Copied" : "Copy cURL"}</span>
                    </button>
                  </div>

                  <pre className="p-4 bg-[#0D1320] border border-[#243247] rounded-xl font-mono text-xs text-[#F4F7FC] overflow-x-auto">
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
            <Card elevated id="security">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="cyan">SECTION 07</Badge>
                  <Badge variant="neutral">THREAT MODEL</Badge>
                </div>
                <CardTitle className="text-xl font-bold text-[#F4F7FC]">
                  7. Security Threat Model &amp; Defense-in-Depth
                </CardTitle>
                <CardDescription className="text-xs text-[#94A3B8]">
                  Mitigations across credential stuffing, token hijacking, replay injection, and NoSQL manipulation.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-xs text-[#94A3B8] leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3.5 border border-[#243247] bg-[#0D1320] rounded-xl flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-[#35D6E8]">Credential Storage</span>
                    <span className="text-[11px] text-[#94A3B8]">Passwords hashed using Bcrypt (work factor 12) with cryptographically random salts. Timing attacks resisted by generic invalid responses.</span>
                  </div>

                  <div className="p-3.5 border border-[#243247] bg-[#0D1320] rounded-xl flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-[#8B7CFF]">Double-Submit CSRF</span>
                    <span className="text-[11px] text-[#94A3B8]">State mutations validate x-csrf-token header against un-forgeable readable cookie keytrace_csrf. Prevents cross-origin forged posts.</span>
                  </div>

                  <div className="p-3.5 border border-[#243247] bg-[#0D1320] rounded-xl flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-[#32D6A0]">Replay Defense</span>
                    <span className="text-[11px] text-[#94A3B8]">Verification sessions require UUIDv4 sessions with monotonically non-decreasing timestamps. Replayed session identifiers are rejected.</span>
                  </div>

                  <div className="p-3.5 border border-[#243247] bg-[#0D1320] rounded-xl flex flex-col gap-1">
                    <span className="text-xs font-mono font-bold text-[#FFBF55]">NoSQL Injection Defense</span>
                    <span className="text-[11px] text-[#94A3B8]">Recursive key sanitization strips keys prefixed with $ or containing . alongside strict Zod schema validation.</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* SECTION 8: CALIBRATION & BENCHMARKS */}
          {(activeSection === "calibration" || !searchQuery) && (
            <Card elevated id="calibration">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="cyan">SECTION 08</Badge>
                  <Badge variant="neutral">CALIBRATION &amp; METRICS</Badge>
                </div>
                <CardTitle className="text-xl font-bold text-[#F4F7FC]">
                  8. Benchmarks, Calibration &amp; Limitations
                </CardTitle>
                <CardDescription className="text-xs text-[#94A3B8]">
                  Empirical performance metrics, physical hardware caveats, and responsible risk scoring.
                </CardDescription>
              </CardHeader>

              <div className="flex flex-col gap-4 text-xs text-[#94A3B8] leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-center">
                  <div className="p-3.5 border border-[#243247] bg-[#0D1320] rounded-xl">
                    <span className="text-[10px] text-[#94A3B8] uppercase">EQUAL ERROR RATE (EER)</span>
                    <p className="text-xl font-bold text-[#32D6A0] mt-1">≤ 8.4%</p>
                    <span className="text-[10px] text-[#94A3B8]">Held-out benchmark</span>
                  </div>
                  <div className="p-3.5 border border-[#243247] bg-[#0D1320] rounded-xl">
                    <span className="text-[10px] text-[#94A3B8] uppercase">ROC AREA UNDER CURVE</span>
                    <p className="text-xl font-bold text-[#35D6E8] mt-1">0.962</p>
                    <span className="text-[10px] text-[#94A3B8]">Genuine vs Impostor</span>
                  </div>
                  <div className="p-3.5 border border-[#243247] bg-[#0D1320] rounded-xl">
                    <span className="text-[10px] text-[#94A3B8] uppercase">INFERENCE LATENCY</span>
                    <p className="text-xl font-bold text-[#8B7CFF] mt-1">&lt; 18ms</p>
                    <span className="text-[10px] text-[#94A3B8]">FastAPI microservice</span>
                  </div>
                </div>

                <div className="p-4 bg-[#0D1320] border border-[#243247] rounded-xl text-xs text-[#94A3B8] space-y-2">
                  <div className="text-[#FFBF55] font-mono font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Known Physical &amp; Environmental Limitations
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Hardware Key Switches:</strong> Mechanical vs. membrane keyboards introduce physical travel time variance. Users switching keyboards will experience a temporary elevation in robust distance.</li>
                    <li><strong>Browser Event Scheduling:</strong> Web browsers do not provide real-time RTOS guarantees. Background tab resource throttling can induce jitter up to ±15ms in performance.now() timestamps.</li>
                    <li><strong>Fatigue &amp; Cognitive State:</strong> Substantial variations in user fatigue or emotional stress naturally shift flight times; continuous authentication should be calibrated as an aggregate risk signal rather than an instant binary lock.</li>
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
