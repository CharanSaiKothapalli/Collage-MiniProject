import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Input } from "../components/ui/Input.js";
import { Button } from "../components/ui/Button.js";
import { Shield, ArrowRight, AlertCircle, Eye, EyeOff, UserCheck, ShieldAlert, Cpu } from "lucide-react";

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to appropriate workspace
  useEffect(() => {
    if (user) {
      navigate(user.hasConsent ? "/dashboard" : "/consent", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const loggedInUser = await login({
        emailOrUsername: emailOrUsername.trim(),
        password,
      });

      if (loggedInUser.hasConsent) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/consent", { replace: true });
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (usernameVal: string, passwordVal: string) => {
    setEmailOrUsername(usernameVal);
    setPassword(passwordVal);
    setError(null);
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh] py-8 relative">
      {/* Ambient background cyber glow */}
      <div className="absolute w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none -z-10" />

      <Card elevated accentBar className="w-full max-w-md p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border-slate-700/80 cyber-glass">
        <CardHeader className="text-center items-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/25 via-amber-500/15 to-indigo-500/25 border border-cyan-500/60 flex items-center justify-center text-cyan-300 mb-3 shadow-[0_0_25px_rgba(6,182,212,0.4)] relative">
            <div className="absolute inset-0 rounded-2xl border border-cyan-400/40 animate-ping opacity-25 pointer-events-none" />
            <Shield className="w-8 h-8 text-cyan-300" />
          </div>
          <CardTitle className="text-2xl font-extrabold font-tech text-white">Sign In to KEYTRACE</CardTitle>
          <CardDescription className="text-slate-300 font-sans mt-1 text-xs">
            Enter your credentials to access your behavioural workspace
          </CardDescription>
        </CardHeader>

        {/* Quick Demo Pre-fill Chips */}
        <div className="mb-5 p-3.5 rounded-xl bg-slate-900/95 border border-slate-700/80 text-xs shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
              ⚡ 1-Click Evaluation Accounts
            </span>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Click to fill</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo("admin", "Admin1234!")}
              className="px-2.5 py-1.5 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 border border-amber-500/50 text-amber-300 text-[11px] font-mono flex items-center gap-1.5 transition-all shadow-sm hover:shadow-[0_0_12px_rgba(245,158,11,0.4)] active:scale-95 cursor-pointer font-semibold"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" /> Admin
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo("alice_genuine", "Password123!")}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 text-[11px] font-mono flex items-center gap-1.5 transition-all shadow-sm hover:shadow-[0_0_12px_rgba(16,185,129,0.4)] active:scale-95 cursor-pointer font-semibold"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Alice (Genuine)
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo("bob_impostor", "Password123!")}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-500/50 text-cyan-300 text-[11px] font-mono flex items-center gap-1.5 transition-all shadow-sm hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] active:scale-95 cursor-pointer font-semibold"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> Bob (Impostor)
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-950/60 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Username or Email"
            name="emailOrUsername"
            type="text"
            required
            autoComplete="username"
            placeholder="e.g. admin or alice_genuine"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
          />

          <Input
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="text-slate-400 hover:text-slate-200 p-1 focus:outline-none transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="mt-2 w-full">
            Authenticate <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400 flex flex-col gap-2">
          <div>
            Need an account?{" "}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold transition-colors">
              Create an account
            </Link>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Biometric credentials are authenticated over encrypted, secure token transport.
          </div>
        </div>
      </Card>
    </div>
  );
}
