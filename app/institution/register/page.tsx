"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Mail, Lock, User, ArrowRight, Globe, BookOpen } from "lucide-react";

const INSTITUTION_TYPES = [
  { value: "university", label: "University" },
  { value: "college", label: "College" },
  { value: "organization", label: "Organization" },
  { value: "company", label: "Company" },
];

export default function InstitutionRegisterPage() {
  const [formData, setFormData] = useState({
    adminName: "",
    adminEmail: "",
    password: "",
    institutionName: "",
    institutionType: "university",
    institutionEmail: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/institution/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: formData.adminEmail,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Institution registered! Please log in via Institution Login.");
        setLoading(false);
        return;
      }

      window.location.href = "/institution/dashboard";
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.12),transparent_50%)]" />

      <div className="w-full max-w-lg relative z-10">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all duration-300">
            <Building2 className="text-white" size={28} />
          </div>
          <div className="text-left">
            <div className="text-xl font-bold text-white">InterviewMatrix</div>
            <div className="text-xs text-blue-400">Institution Portal</div>
          </div>
        </Link>

        <Card>
          <CardHeader className="space-y-3 text-center">
            <CardTitle className="text-2xl">Register Your Institution</CardTitle>
            <CardDescription>
              Create an institution account to build custom interview programmes for your students
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Institution Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Building2 size={16} className="text-blue-400" />
                  Institution Details
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Institution Name</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <Input
                      placeholder="MIT, Stanford, Acme Corp..."
                      value={formData.institutionName}
                      onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Institution Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <Input
                      type="email"
                      placeholder="info@institution.edu"
                      value={formData.institutionEmail}
                      onChange={(e) => setFormData({ ...formData, institutionEmail: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {INSTITUTION_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, institutionType: type.value })}
                        className={`p-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          formData.institutionType === type.value
                            ? "border-blue-500 bg-blue-500/10 text-blue-300"
                            : "border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Admin Account */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 pt-2">
                  <User size={16} className="text-purple-400" />
                  Admin Account
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <Input
                      placeholder="Dr. Jane Smith"
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <Input
                      type="email"
                      placeholder="admin@institution.edu"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full bg-blue-600 hover:bg-blue-500" disabled={loading}>
                {loading ? "Creating Institution..." : "Create Institution"} <ArrowRight size={18} />
              </Button>
            </form>
          </CardContent>

          <CardFooter>
            <div className="text-sm text-center text-slate-400 w-full">
              Already registered?{" "}
              <Link href="/institution/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                Institution Login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
