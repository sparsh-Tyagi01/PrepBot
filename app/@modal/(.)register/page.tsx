"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Mail, Lock, User, ArrowRight, Github, GraduationCap, Briefcase, Building2, CheckCircle } from "lucide-react";

export default function RegisterModal() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "student" | "professional",
    institutionCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [institutionPreview, setInstitutionPreview] = useState<{ name: string } | null>(null);
  const [codeError, setCodeError] = useState("");
  const [codeChecking, setCodeChecking] = useState(false);
  const codeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 6);
    setFormData((f) => ({ ...f, institutionCode: val }));
    setInstitutionPreview(null);
    setCodeError("");
    if (codeTimerRef.current) clearTimeout(codeTimerRef.current);
    if (val.length === 6) {
      setCodeChecking(true);
      codeTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/institution/join?code=${val}`);
          const data = await res.json();
          if (res.ok && data.institution) {
            setInstitutionPreview(data.institution);
          } else {
            setCodeError("Invalid institution code.");
          }
        } catch {
          setCodeError("Could not verify code.");
        } finally {
          setCodeChecking(false);
        }
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Register the user
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, institutionCode: formData.institutionCode || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      // Auto sign in after registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but login failed. Please try logging in.");
        setLoading(false);
        return;
      }

      // Hard redirect — clears the intercepting modal slot entirely
      window.location.href = "/dashboard";
    } catch (error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    try {
      await signIn("github", { callbackUrl: "/dashboard" });
    } catch (error) {
      setError("Failed to sign in with GitHub");
    }
  };

  return (
    <div className="w-full max-w-md max-h-[90vh] overflow-y-auto">
      {/* Logo */}
      <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
        <div className="w-12 h-12 rounded-xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300">
          <Brain className="text-white" size={28} />
        </div>
        <span className="text-3xl font-bold bg-linear-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          InterviewMatrix
        </span>
      </Link>

      <Card>
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="text-3xl">Create Your Account</CardTitle>
          <CardDescription className="text-base">
            Start your journey to interview success
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-300">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-slate-500">Must be at least 8 characters</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "student" })}
                  className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                    formData.role === "student"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                  }`}
                >
                  <GraduationCap className="mx-auto mb-2 text-purple-400" size={24} />
                  <div className="text-sm font-medium text-white">Student</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: "professional" })}
                  className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                    formData.role === "professional"
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-slate-700 bg-slate-900/50 hover:border-slate-600"
                  }`}
                >
                  <Briefcase className="mx-auto mb-2 text-blue-400" size={24} />
                  <div className="text-sm font-medium text-white">Professional</div>
                </button>
              </div>
            </div>

            {/* Optional: Institution Code (students only) */}
            {formData.role === "student" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Institution Code{" "}
                  <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <Input
                    type="text"
                    placeholder="e.g. X7K4RM"
                    value={formData.institutionCode}
                    onChange={handleCodeChange}
                    className="pl-10 uppercase tracking-widest"
                    maxLength={6}
                  />
                </div>
                {codeChecking && (
                  <p className="text-xs text-slate-400">Verifying code...</p>
                )}
                {institutionPreview && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle size={12} /> Joining: {institutionPreview.name}
                  </div>
                )}
                {codeError && <p className="text-xs text-red-400">{codeError}</p>}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"} <ArrowRight size={18} />
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-400">Or continue with</span>
            </div>
          </div>

          <Button variant="secondary" size="lg" className="w-full" onClick={handleGithubSignIn} type="button">
            <Github size={18} />
            Sign up with GitHub
          </Button>
        </CardContent>

        <CardFooter className="flex-col space-y-3">
          <div className="text-sm text-center text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
              Sign in
            </Link>
          </div>
          <div className="w-full border-t border-slate-800 pt-3 text-sm text-center text-slate-500">
            Registering an institution?{" "}
            <a href="/institution/register" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Institution Sign Up
            </a>
          </div>
        </CardFooter>
      </Card>

      <p className="text-center text-xs text-slate-500 mt-6">
        By signing up, you agree to our{" "}
        <Link href="/terms" className="text-purple-400 hover:text-purple-300">Terms of Service</Link>
        {" "}and{" "}
        <Link href="/privacy" className="text-purple-400 hover:text-purple-300">Privacy Policy</Link>
      </p>
    </div>
  );
}
