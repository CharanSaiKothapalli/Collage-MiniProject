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
      {/* Ambient background glow */}
      <div className="absolute w-96 h-96 rounded-full bg-[#38BDF8]/5 blur-[120px] pointer-events-none -z-10" />

      <Card elevated className="w-full max-w-md p-6 sm:p-8 shadow-2xl border-[#263B5E] bg-[#111B2E]">
        <CardHeader className="text-center items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0B1220] border border-[#263B5E] flex items-center justify-center text-[#F8FAFC] mb-3 shadow-sm">
            <Shield className="w-6 h-6 text-[#38BDF8]" />
          </div>
          <CardTitle className="text-2xl font-bold text-[#F8FAFC]">Create Account</CardTitle>
          <CardDescription className="text-[#94A3B8] font-sans mt-1 text-xs">
            Begin continuous behavioural keystroke authentication enrollment
          </CardDescription>
        </CardHeader>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-start gap-2.5 text-xs text-[#EF4444]">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
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
                className="text-[#64748B] hover:text-[#94A3B8] p-1 focus:outline-none transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {/* Password Quality Indicator */}
          {password.length > 0 && (
            <div className="p-3 rounded-xl bg-[#0B1220] border border-[#263B5E] text-xs grid grid-cols-2 gap-2">
              <span className={`flex items-center gap-1.5 ${hasMinLength ? "text-[#22C55E]" : "text-[#64748B]"}`}>
                {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} 8+ Characters
              </span>
              <span className={`flex items-center gap-1.5 ${hasUppercase ? "text-[#22C55E]" : "text-[#64748B]"}`}>
                {hasUppercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Uppercase Letter
              </span>
              <span className={`flex items-center gap-1.5 ${hasLowercase ? "text-[#22C55E]" : "text-[#64748B]"}`}>
                {hasLowercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Lowercase Letter
              </span>
              <span className={`flex items-center gap-1.5 ${hasNumber ? "text-[#22C55E]" : "text-[#64748B]"}`}>
                {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} Number (0-9)
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
                className="text-[#64748B] hover:text-[#94A3B8] p-1 focus:outline-none transition-colors cursor-pointer"
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
            Register Account <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#263B5E] text-center text-xs text-[#94A3B8]">
          Already have an account?{" "}
          <Link to="/login" className="text-[#38BDF8] hover:underline font-medium transition-colors">
            Sign In here
          </Link>
        </div>
      </Card>
    </div>
  );
}
