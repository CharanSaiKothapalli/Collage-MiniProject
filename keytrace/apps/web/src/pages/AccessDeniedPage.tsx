import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.js";
import { Lock, ArrowLeft } from "lucide-react";

export function AccessDeniedPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 py-16">
      <div className="w-16 h-16 rounded-2xl bg-[#FF647C]/10 border border-[#FF647C]/30 flex items-center justify-center text-[#FF647C] mb-2 shadow-lg">
        <Lock className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold font-mono tracking-tight text-[#F4F7FC]">403</h1>
      <h2 className="text-xl font-bold text-[#F4F7FC]">Access Denied</h2>
      <p className="text-xs text-[#94A3B8] max-w-sm">
        You do not have the required administrative or role permissions to view this resource.
      </p>
      <Link to="/dashboard" className="mt-4">
        <Button variant="secondary" size="md">
          <ArrowLeft className="w-4 h-4 mr-1 text-[#35D6E8]" /> Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
