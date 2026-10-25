import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.js";
import { Lock, ArrowLeft } from "lucide-react";

export function AccessDeniedPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 py-16">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-2">
        <Lock className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-bold font-mono tracking-tight text-foreground">403</h1>
      <h2 className="text-xl font-semibold text-foreground">Access Denied</h2>
      <p className="text-sm text-foreground-muted max-w-sm">
        You do not have the required administrative or role permissions to view this resource.
      </p>
      <Link to="/dashboard" className="mt-4">
        <Button variant="secondary" size="md">
          <ArrowLeft className="w-4 h-4 mr-1" /> Return to User Dashboard
        </Button>
      </Link>
    </div>
  );
}
