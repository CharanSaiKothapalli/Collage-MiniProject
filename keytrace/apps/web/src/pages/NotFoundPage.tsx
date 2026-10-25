import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.js";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center gap-4 py-16">
      <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center text-accent mb-2">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-bold font-mono tracking-tight text-foreground">404</h1>
      <h2 className="text-xl font-semibold text-foreground">Resource Not Found</h2>
      <p className="text-sm text-foreground-muted max-w-sm">
        The requested endpoint or view does not exist on this KEYTRACE platform instance.
      </p>
      <Link to="/" className="mt-4">
        <Button variant="secondary" size="md">
          <ArrowLeft className="w-4 h-4 mr-1" /> Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
