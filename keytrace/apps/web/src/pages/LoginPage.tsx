import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Input } from "../components/ui/Input.js";
import { Button } from "../components/ui/Button.js";
import { Shield, ArrowRight, AlertCircle, Eye, EyeOff, UserCheck, ShieldAlert, Cpu, Sparkles } from "lucide-react";

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
      {/* Ambient background glow */}
      <div className="absolute w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none -z-10" />

      <Card elevated className="w-full max-w-md p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6)] border-white/[0.08] bg-zinc-950/70 backdrop-blur-xl">
        <CardHeader className="text-center items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white mb-3 shadow-sm">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Sign In to KEYTRACE</CardTitle>
          <CardDescription className="text-zinc-400 font-sans mt-1 text-xs">
            Enter your credentials to access your behavioural workspace
          </CardDescription>
        </CardHeader>

        {/* Quick Demo Pre-fill Chips */}
        <div className="mb-6 p-3.5 rounded-xl bg-zinc-900/60 border border-white/[0.06] text-xs">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] text-zinc-300 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> 1-Click Evaluation Accounts
            </span>
            <span className="text-[10px] text-zinc-500">Click to fill</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo("admin", "Admin1234!")}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer font-medium"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" /> Admin
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo("alice_genuine", "Password123!")}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer font-medium"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Alice (Genuine)
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo("bob_impostor", "Password123!")}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 text-zinc-200 text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer font-medium"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Bob (Impostor)
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
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
                className="text-zinc-500 hover:text-zinc-300 p-1 focus:outline-none transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="mt-2 w-full">
            Sign In <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-white/[0.06] text-center text-xs text-zinc-400 flex flex-col gap-2">
          <div>
            Need an account?{" "}
            <Link to="/register" className="text-white hover:underline font-medium transition-colors">
              Create an account
            </Link>
          </div>
          <div className="text-[11px] text-zinc-500">
            Biometric credentials are encrypted and verified in real time.
          </div>
        </div>
      </Card>
    </div>
  );
}
