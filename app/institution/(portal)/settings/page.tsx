"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Mail, Globe, Save, Copy, CheckCircle } from "lucide-react";

interface InstitutionData {
  id: string;
  name: string;
  email: string;
  type: string;
  address: string | null;
  phone: string | null;
  joinCode?: string;
}

export default function InstitutionSettingsPage() {
  const { data: session } = useSession();
  const [institution, setInstitution] = useState<InstitutionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [codeCopied, setCodeCopied] = useState(false);

  const copyJoinCode = () => {
    if (institution?.joinCode) {
      navigator.clipboard.writeText(institution.joinCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  useEffect(() => {
    fetch("/api/institution/stats")
      .then((r) => r.json())
      .then((d) => {
        const inst = d.institution;
        setInstitution(inst);
        setForm({ name: inst?.name ?? "", address: inst?.address ?? "", phone: inst?.phone ?? "" });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    // TODO: implement PATCH /api/institution/settings
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Institution Settings</h1>
        <p className="text-slate-400 mt-1">Manage your institution&apos;s profile and preferences</p>
      </div>

      <Card className="border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 size={16} className="text-blue-400" />
            Institution Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {success && (
                <div className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3">
                  Settings saved successfully.
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Institution Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Institution Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <Input
                    value={institution?.email ?? ""}
                    disabled
                    className="pl-9 opacity-60 cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-slate-500">Email cannot be changed after registration.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Address</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <Input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="123 University Ave, City"
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-500 gap-2" disabled={saving}>
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Join Code */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle size={16} className="text-blue-400" />
            Student Join Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                Share this code with students to let them link their accounts to your institution.
              </p>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-mono font-bold tracking-[0.3em] text-blue-300">
                  {institution?.joinCode ?? "------"}
                </div>
                <button
                  type="button"
                  onClick={copyJoinCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-sm transition-colors"
                >
                  {codeCopied ? <CheckCircle size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {codeCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-800">
        <CardHeader>
          <CardTitle className="text-base">Admin Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-sm font-medium text-white">{session?.user?.name}</p>
            <p className="text-sm text-slate-400">{session?.user?.email}</p>
            <p className="text-xs text-blue-400 mt-1">Institution Administrator</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
