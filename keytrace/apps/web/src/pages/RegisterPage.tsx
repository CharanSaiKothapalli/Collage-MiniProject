import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Card, CardHeader, CardTitle, CardDescription } from "../components/ui/Card.js";
import { Input } from "../components/ui/Input.js";
import { Button } from "../components/ui/Button.js";
import { Shield, Lock, User, Mail, ArrowRight, AlertCircle } from "lucide-react";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await register({ username, email, password });
      navigate("/consent");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh] py-8">
      <Card elevated accentBar className="w-full max-w-md p-6 sm:p-8 shadow-[0_12px_45px_rgba(0,0,0,0.5)] border-slate-700/80">
        <CardHeader className="text-center items-center mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/20 via-amber-500/10 to-indigo-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-300 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.35)]">
            <Shield className="w-7 h-7" />
          </div>
          <CardTitle className="text-2xl font-extrabold font-mono text-white">Create KEYTRACE Account</CardTitle>
          <CardDescription className="text-slate-300 font-sans mt-1">
            Begin continuous behavioural keystroke authentication enrolment
          </CardDescription>
        </CardHeader>

        {error && (
          <div className="mb-5 p-3.5 rounded-lg bg-rose-950/50 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
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
            placeholder="e.g. j_doe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            helperText="3–32 alphanumeric characters or underscores"
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            required
            placeholder="name@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            helperText="Minimum 8 characters with uppercase, lowercase, and a number"
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="mt-3 w-full">
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
