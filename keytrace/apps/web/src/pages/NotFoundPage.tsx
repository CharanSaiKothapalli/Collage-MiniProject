import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.js";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 py-16">
      <div className="w-16 h-16 rounded-2xl bg-[#111B2E] border border-[#263B5E] flex items-center justify-center text-[#38BDF8] mb-2 shadow-lg">
        <ShieldAlert className="w-8 h-8 text-[#38BDF8]" />
      </div>
      <h1 className="text-4xl font-extrabold font-mono tracking-tight text-[#F8FAFC]">404</h1>
      <h2 className="text-xl font-bold text-[#F8FAFC]">Resource Not Found</h2>
      <p className="text-xs text-[#94A3B8] max-w-sm">
        The requested endpoint or view does not exist on this KEYTRACE platform instance.
      </p>
      <Link to="/" className="mt-4">
        <Button variant="secondary" size="md">
          <ArrowLeft className="w-4 h-4 mr-1 text-[#38BDF8]" /> Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
