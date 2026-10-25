import React from "react";
import { ACADEMIC_TITLE, APPLICATION_NAME } from "@keytrace/shared";
import { Shield, Lock, FileText, ExternalLink, BookOpen, Terminal } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-[#06080e]/90 backdrop-blur-xl mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Identity & Academic Context */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-amber-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-cyan-400 bg-clip-text text-transparent font-mono text-base">{APPLICATION_NAME}</span>
            </div>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              {ACADEMIC_TITLE}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">
              Research Platform: Continuous Biometric Behavioral Authentication.
            </p>
          </div>

          {/* Privacy & Responsible Use Statement */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" /> Responsible Biometric Policy
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              Keystroke dynamics authentication generates an active confidence signal based on physical rhythm similarity.
              It is designed as an auxiliary defense layer and does not represent infallible proof of physical identity.
            </p>
          </div>

          {/* Links & Resources */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-cyan-400" /> Technical Resources
            </span>
            <ul className="text-xs font-mono text-slate-300 space-y-2">
              <li>
                <Link to="/docs" className="text-amber-400 hover:text-amber-300 flex items-center gap-1.5 font-bold transition-colors">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" /> In-App Technical Documentation (Manual)
                </Link>
              </li>
              <li>
                <Link to="/consent" className="hover:text-cyan-300 transition-colors">
                  Informed Consent Policy (v1.0)
                </Link>
              </li>
              <li>
                <a
                  href="/api/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  Swagger OpenAPI Interactive Docs <ExternalLink className="w-3 h-3 text-cyan-400" />
                </a>
              </li>
              <li>
                <a
                  href="/health/ready"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  Container Health Diagnostic Probe <ExternalLink className="w-3 h-3 text-cyan-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-3">
          <span>&copy; {new Date().getFullYear()} KEYTRACE. MIT Licensed Research Demonstration.</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              <span className="text-emerald-300 font-semibold">ZERO KEYLOGGING</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              <span className="text-cyan-300 font-semibold">DETERMINISTIC 10-D</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
              <span className="text-amber-300 font-semibold">ROBUST DISTANCE</span>
            </span>
          </span>
        </div>
      </div>
    </footer>
  );
}
