import React from "react";
import { ACADEMIC_TITLE, APPLICATION_NAME } from "@keytrace/shared";
import { Shield, Lock, FileText, ExternalLink, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-[#243247] bg-[#080B12]/90 backdrop-blur-xl mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Identity & Academic Context */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-[#111927] border border-[#243247] flex items-center justify-center text-[#35D6E8]">
                <Shield className="w-3.5 h-3.5 text-[#35D6E8]" />
              </div>
              <span className="font-bold text-[#F4F7FC] tracking-tight text-base font-mono">
                {APPLICATION_NAME}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              {ACADEMIC_TITLE}
            </p>
            <p className="text-[11px] text-[#94A3B8] font-mono">
              OBSIDIAN PULSE • Continuous Biometric Behavioral Defense
            </p>
          </div>

          {/* Privacy & Responsible Use Statement */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-[#F4F7FC] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#35D6E8]" /> Responsible Biometric Policy
            </span>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Keystroke dynamics authentication evaluates neuromuscular timing patterns as a continuous risk signal without capturing typed text or characters.
            </p>
          </div>

          {/* Links & Resources */}
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-semibold text-[#F4F7FC] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#35D6E8]" /> Technical Resources
            </span>
            <ul className="text-xs text-[#94A3B8] space-y-2 font-mono">
              <li>
                <Link to="/docs" className="hover:text-[#35D6E8] flex items-center gap-1.5 transition-colors">
                  <BookOpen className="w-3.5 h-3.5 text-[#94A3B8]" /> Technical Documentation
                </Link>
              </li>
              <li>
                <Link to="/consent" className="hover:text-[#35D6E8] transition-colors">
                  Informed Consent Policy (v1.0)
                </Link>
              </li>
              <li>
                <a
                  href="/api/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#35D6E8] transition-colors flex items-center gap-1"
                >
                  Swagger OpenAPI Interactive Docs <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
                </a>
              </li>
              <li>
                <a
                  href="/health/ready"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#35D6E8] transition-colors flex items-center gap-1"
                >
                  Health Diagnostic Probe <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#243247] flex flex-col sm:flex-row items-center justify-between text-xs text-[#94A3B8] gap-3 font-mono">
          <span>&copy; {new Date().getFullYear()} KEYTRACE. MIT Licensed Research Demonstration.</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#32D6A0] animate-pulse" />
              <span className="text-[#F4F7FC] font-medium">Zero Keylogging</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#35D6E8]" />
              <span className="text-[#F4F7FC] font-medium">Deterministic 10D</span>
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B7CFF]" />
              <span className="text-[#F4F7FC] font-medium">Mahalanobis D_M</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
