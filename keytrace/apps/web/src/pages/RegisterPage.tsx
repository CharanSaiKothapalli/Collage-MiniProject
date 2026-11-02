import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Input } from "../components/ui/Input.js";
import { Button } from "../components/ui/Button.js";
import { Shield, ArrowRight, AlertCircle, Eye, EyeOff, Check, X } from "lucide-react";

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect
  useEffect(() => {
    if (user) {
      navigate(user.hasConsent ? "/dashboard" : "/consent", { replace: true });
    }
  }, [user, navigate]);

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!isPasswordValid) {
      setError("Please ensure your password satisfies all security criteria.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await register({ username: cleanUsername, email: cleanEmail, password });
      navigate("/consent", { replace: true });
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh] py-8 relative">
      {/* Ambient background cyber glow */}
      <div className="absolute w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none -z-10" />

      <Card elevated accentBar className="w-full max-w-md p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border-slate-700/80 cyber-glass">
        <CardHeader className="text-center items-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/25 via-orange-500/15 to-cyan-500/25 border border-amber-500/60 flex items-center justify-center text-amber-300 mb-3 shadow-[0_0_25px_rgba(245,158,11,0.4)] relative">
            <div className="absolute inset-0 rounded-2xl border border-amber-400/40 animate-ping opacity-25 pointer-events-none" />
            <Shield className="w-8 h-8 text-amber-300" />
          </div>
          <CardTitle className="text-2xl font-extrabold font-tech text-white">Create KEYTRACE Account</CardTitle>
          <CardDescription className="text-slate-300 font-sans mt-1 text-xs">
            Begin continuous behavioural keystroke authentication enrolment
          </CardDescription>
        </CardHeader>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-950/60 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Username"
            name="username"
            type="text"
            required
            autoComplete="username"
            placeholder="e.g. j_doe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            helperText="3–32 alphanumeric characters, dashes, or underscores"
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="name@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
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

          {/* Password Quality Indicator */}
          {password.length > 0 && (
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono grid grid-cols-2 gap-1.5">
              <span className={`flex items-center gap-1 ${hasMinLength ? "text-emerald-400" : "text-slate-500"}`}>
                {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} 8+ Characters
              </span>
              <span className={`flex items-center gap-1 ${hasUppercase ? "text-emerald-400" : "text-slate-500"}`}>
                {hasUppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Uppercase Letter
              </span>
              <span className={`flex items-center gap-1 ${hasLowercase ? "text-emerald-400" : "text-slate-500"}`}>
                {hasLowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Lowercase Letter
              </span>
              <span className={`flex items-center gap-1 ${hasNumber ? "text-emerald-400" : "text-slate-500"}`}>
                {hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Number (0-9)
              </span>
            </div>
          )}

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex={-1}
                className="text-slate-400 hover:text-slate-200 p-1 focus:outline-none transition-colors"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            helperText={
              confirmPassword.length > 0
                ? isMatch
                  ? "✓ Passwords match"
                  : "Passwords do not match"
                : undefined
            }
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            disabled={!isPasswordValid || (confirmPassword.length > 0 && !isMatch)}
            className="mt-2 w-full"
          >
            Register Account <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold transition-colors">
            Sign In here
          </Link>
        </div>
      </Card>
    </div>
  );
}
