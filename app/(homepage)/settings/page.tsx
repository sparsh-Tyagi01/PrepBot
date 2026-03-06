"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, Lock, Crown, Check, Bell, Save, AlertCircle, Building2, CheckCircle, LogOut as LeaveIcon,
  GitBranch, Layers,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  institution?: { id: string; name: string; joinCode: string } | null;
  branch?: { id: string; name: string; code: string } | null;
  section?: { id: string; name: string; code: string } | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [passwords, setPasswords] = useState({ current: "", newPass: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: true,
    marketing: false,
  });

  // Institution join/leave state
  const [instCode, setInstCode] = useState("");
  const [instPreview, setInstPreview] = useState<{ name: string } | null>(null);
  const [instCodeError, setInstCodeError] = useState("");
  const [instCodeChecking, setInstCodeChecking] = useState(false);
  const [instLoading, setInstLoading] = useState(false);
  const [instMsg, setInstMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const instTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Branch join state
  const [branchCode, setBranchCode] = useState("");
  const [branchPreview, setBranchPreview] = useState<{ name: string } | null>(null);
  const [branchCodeError, setBranchCodeError] = useState("");
  const [branchCodeChecking, setBranchCodeChecking] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [branchMsg, setBranchMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const branchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Section join state
  const [sectionCode, setSectionCode] = useState("");
  const [sectionPreview, setSectionPreview] = useState<{ name: string } | null>(null);
  const [sectionCodeError, setSectionCodeError] = useState("");
  const [sectionCodeChecking, setSectionCodeChecking] = useState(false);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [sectionMsg, setSectionMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const sectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInstCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 6);
    setInstCode(val);
    setInstPreview(null);
    setInstCodeError("");
    if (instTimerRef.current) clearTimeout(instTimerRef.current);
    if (val.length === 6) {
      setInstCodeChecking(true);
      instTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/institution/join?code=${val}`);
          const data = await res.json();
          if (res.ok && data.institution) {
            setInstPreview(data.institution);
          } else {
            setInstCodeError("Invalid code. Check with your institution admin.");
          }
        } catch {
          setInstCodeError("Could not verify code.");
        } finally {
          setInstCodeChecking(false);
        }
      }, 500);
    }
  };

  const handleJoinInstitution = async () => {
    if (!instPreview) return;
    setInstLoading(true);
    setInstMsg(null);
    try {
      const res = await fetch("/api/institution/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: instCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join institution");
      setProfile((p) => p ? { ...p, institution: data.institution, branch: null, section: null } : p);
      setInstCode("");
      setInstPreview(null);
      setInstMsg({ type: "success", text: `Successfully joined ${data.institution.name}!` });
    } catch (err: unknown) {
      setInstMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to join." });
    } finally {
      setInstLoading(false);
    }
  };

  const handleBranchCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 8);
    setBranchCode(val);
    setBranchPreview(null);
    setBranchCodeError("");
    if (branchTimerRef.current) clearTimeout(branchTimerRef.current);
    if (val.length >= 4) {
      setBranchCodeChecking(true);
      branchTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/institution/branch/join?code=${val}`);
          const data = await res.json();
          if (res.ok && data.branch) setBranchPreview(data.branch);
          else setBranchCodeError(data.error ?? "Invalid branch code.");
        } catch {
          setBranchCodeError("Could not verify code.");
        } finally {
          setBranchCodeChecking(false);
        }
      }, 500);
    }
  };

  const handleJoinBranch = async () => {
    if (!branchPreview) return;
    setBranchLoading(true);
    setBranchMsg(null);
    try {
      const res = await fetch("/api/institution/branch/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: branchCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join branch");
      setProfile((p) => p ? { ...p, branch: data.branch, section: null } : p);
      setBranchCode("");
      setBranchPreview(null);
      setSectionCode("");
      setSectionPreview(null);
      setBranchMsg({ type: "success", text: `Joined branch: ${data.branch.name}!` });
    } catch (err: unknown) {
      setBranchMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to join branch." });
    } finally {
      setBranchLoading(false);
    }
  };

  const handleSectionCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().slice(0, 8);
    setSectionCode(val);
    setSectionPreview(null);
    setSectionCodeError("");
    if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
    if (val.length >= 4) {
      setSectionCodeChecking(true);
      sectionTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/institution/section/join?code=${val}`);
          const data = await res.json();
          if (res.ok && data.section) setSectionPreview(data.section);
          else setSectionCodeError(data.error ?? "Invalid section code.");
        } catch {
          setSectionCodeError("Could not verify code.");
        } finally {
          setSectionCodeChecking(false);
        }
      }, 500);
    }
  };

  const handleJoinSection = async () => {
    if (!sectionPreview) return;
    setSectionLoading(true);
    setSectionMsg(null);
    try {
      const res = await fetch("/api/institution/section/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: sectionCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to join section");
      setProfile((p) => p ? { ...p, section: data.section } : p);
      setSectionCode("");
      setSectionPreview(null);
      setSectionMsg({ type: "success", text: `Joined section: ${data.section.name}!` });
    } catch (err: unknown) {
      setSectionMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to join section." });
    } finally {
      setSectionLoading(false);
    }
  };

  const handleLeaveInstitution = async () => {
    if (!confirm("Are you sure you want to leave your institution?")) return;
    setInstLoading(true);
    setInstMsg(null);
    try {
      const res = await fetch("/api/institution/join", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to leave institution");
      setProfile((p) => p ? { ...p, institution: null } : p);
      setInstMsg({ type: "success", text: "You have left the institution." });
    } catch (err: unknown) {
      setInstMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to leave." });
    } finally {
      setInstLoading(false);
    }
  };

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((data) => {
        const u = data.user ?? data;
        setProfile(u);
        setNameInput(u.name ?? "");
      })
      .catch(console.error)
      .finally(() => setProfileLoading(false));
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput }),
      });
      if (!res.ok) throw new Error("Failed to save profile");
      const data = await res.json();
      const updated = data.user ?? data;
      setProfile(updated);
      setProfileMsg({ type: "success", text: "Profile updated successfully." });
    } catch {
      setProfileMsg({ type: "error", text: "Failed to save profile. Please try again." });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (passwords.newPass !== passwords.confirm) {
      setPwMsg({ type: "error", text: "New passwords do not match." });
      return;
    }
    if (passwords.newPass.length < 8) {
      setPwMsg({ type: "error", text: "New password must be at least 8 characters." });
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.newPass }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Failed to update password");
      setPwMsg({ type: "success", text: "Password updated successfully." });
      setPasswords({ current: "", newPass: "", confirm: "" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update password.";
      setPwMsg({ type: "error", text: message });
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400 text-lg">Manage your account preferences and settings</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <User className="text-purple-400" size={24} />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                <User size={40} className="text-white" />
              </div>
              <div>
                {profileLoading ? (
                  <Skeleton className="h-5 w-32" />
                ) : (
                  <p className="text-white font-semibold text-lg">{profile?.name ?? "—"}</p>
                )}
                {profileLoading ? (
                  <Skeleton className="h-4 w-48 mt-1" />
                ) : (
                  <p className="text-sm text-slate-400">{profile?.email ?? "—"}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-300">
                  Full Name
                </label>
                {profileLoading ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Input
                    id="name"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                  />
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-300">
                  Email Address
                </label>
                {profileLoading ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Input
                    id="email"
                    type="email"
                    value={profile?.email ?? ""}
                    readOnly
                    disabled
                    className="opacity-60 cursor-not-allowed"
                  />
                )}
                <p className="text-xs text-slate-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Role</label>
                {profileLoading ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Input value={profile?.role ?? "User"} readOnly disabled className="opacity-60 cursor-not-allowed" />
                )}
              </div>
            </div>

            {profileMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${profileMsg.type === "success" ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                {profileMsg.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                {profileMsg.text}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" variant="primary" size="md" disabled={profileSaving || profileLoading}>
                <Save size={18} />
                {profileSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => { setNameInput(profile?.name ?? ""); setProfileMsg(null); }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Lock className="text-blue-400" size={24} />
            Change Password
          </CardTitle>
          <CardDescription>Ensure your account is using a strong password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-sm font-medium text-slate-300">
                Current Password
              </label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium text-slate-300">
                New Password
              </label>
              <Input
                id="new-password"
                type="password"
                placeholder="Min. 8 characters"
                value={passwords.newPass}
                onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-slate-300">
                Confirm New Password
              </label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                required
              />
            </div>

            {pwMsg && (
              <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${pwMsg.type === "success" ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                {pwMsg.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                {pwMsg.text}
              </div>
            )}

            <Button type="submit" variant="primary" size="md" disabled={pwLoading}>
              {pwLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Subscription Plan */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-purple-600/10 via-blue-600/10 to-transparent" />
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Crown className="text-amber-400" size={24} />
                Subscription Plan
              </CardTitle>
              <CardDescription>Your current plan</CardDescription>
            </div>
            <Badge variant="secondary" className="text-base px-4 py-2">
              Free Plan
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
            <h3 className="text-xl font-semibold text-white mb-1">Free Plan</h3>
            <p className="text-slate-400 mb-4">Unlimited practice interviews with AI feedback.</p>
            <div className="space-y-2 mb-6">
              {[
                "Unlimited AI interviews",
                "Automated score reports",
                "Skill gap analysis",
                "Interview history",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Check size={16} className="text-green-400" />
                  <span className="text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Institution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Building2 className="text-blue-400" size={24} />
            Institution
          </CardTitle>
          <CardDescription>Join your institution, branch, and section using the codes provided by your admin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {profileLoading ? (
            <Skeleton className="h-20 w-full rounded-xl" />
          ) : profile?.institution ? (
            <div className="space-y-4">
              {/* Institution status */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Building2 size={20} className="text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm">{profile.institution.name}</p>
                  <p className="text-xs text-slate-400">Institution member</p>
                </div>
                <CheckCircle size={18} className="text-emerald-400 shrink-0" />
              </div>

              {/* Branch status + join box */}
              {profile.branch ? (
                <div className="flex items-center gap-4 p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
                    <GitBranch size={17} className="text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{profile.branch.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{profile.branch.code}</p>
                  </div>
                  <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                </div>
              ) : (
                <div className="space-y-2 border border-dashed border-slate-700 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-300 flex items-center gap-2"><GitBranch size={15} className="text-cyan-400" /> Join a Branch</p>
                  <p className="text-xs text-slate-500">Enter your branch join code provided by your institution admin.</p>
                  <div className="relative">
                    <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                    <input
                      type="text"
                      placeholder="Branch code (e.g. CSE4XR)"
                      value={branchCode}
                      onChange={handleBranchCodeChange}
                      maxLength={8}
                      className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                    />
                  </div>
                  {branchCodeChecking && <p className="text-xs text-slate-400">Verifying…</p>}
                  {branchPreview && <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={11} /> {branchPreview.name}</p>}
                  {branchCodeError && <p className="text-xs text-red-400">{branchCodeError}</p>}
                  {branchMsg && (
                    <p className={`text-xs flex items-center gap-1 ${branchMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
                      {branchMsg.type === "success" ? <Check size={12} /> : <AlertCircle size={12} />} {branchMsg.text}
                    </p>
                  )}
                  <Button
                    size="sm"
                    onClick={handleJoinBranch}
                    disabled={branchLoading || !branchPreview}
                    className="bg-cyan-600 hover:bg-cyan-700 h-8 text-xs"
                  >
                    {branchLoading ? "Joining…" : "Join Branch"}
                  </Button>
                </div>
              )}

              {/* Section status + join box (only if already in branch) */}
              {profile.branch && (
                profile.section ? (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Layers size={17} className="text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{profile.section.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{profile.section.code}</p>
                    </div>
                    <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                  </div>
                ) : (
                  <div className="space-y-2 border border-dashed border-slate-700 rounded-xl p-4">
                    <div className="text-sm font-medium text-slate-300 flex items-center gap-2"><Layers size={15} className="text-purple-400" /> Join a Section <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">Optional</Badge></div>
                    <p className="text-xs text-slate-500">Enter your section join code to be placed in a specific class section.</p>
                    <div className="relative">
                      <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                      <input
                        type="text"
                        placeholder="Section code (e.g. CSEAA4)"
                        value={sectionCode}
                        onChange={handleSectionCodeChange}
                        maxLength={8}
                        className="w-full pl-9 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                      />
                    </div>
                    {sectionCodeChecking && <p className="text-xs text-slate-400">Verifying…</p>}
                    {sectionPreview && <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle size={11} /> {sectionPreview.name}</p>}
                    {sectionCodeError && <p className="text-xs text-red-400">{sectionCodeError}</p>}
                    {sectionMsg && (
                      <p className={`text-xs flex items-center gap-1 ${sectionMsg.type === "success" ? "text-green-400" : "text-red-400"}`}>
                        {sectionMsg.type === "success" ? <Check size={12} /> : <AlertCircle size={12} />} {sectionMsg.text}
                      </p>
                    )}
                    <Button
                      size="sm"
                      onClick={handleJoinSection}
                      disabled={sectionLoading || !sectionPreview}
                      className="bg-purple-600 hover:bg-purple-700 h-8 text-xs"
                    >
                      {sectionLoading ? "Joining…" : "Join Section"}
                    </Button>
                  </div>
                )
              )}

              {instMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                  instMsg.type === "success"
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}>
                  {instMsg.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                  {instMsg.text}
                </div>
              )}
              <Button
                type="button"
                variant="ghost"
                size="md"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={handleLeaveInstitution}
                disabled={instLoading}
              >
                <LeaveIcon size={16} />
                {instLoading ? "Leaving..." : "Leave Institution"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">
                Enter the join code provided by your institution admin to link your account.
              </p>
              <div className="space-y-2">
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    placeholder="Institution code (e.g. X7K4RM)"
                    value={instCode}
                    onChange={handleInstCodeChange}
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  />
                </div>
                {instCodeChecking && <p className="text-xs text-slate-400">Verifying code...</p>}
                {instPreview && (
                  <div className="text-xs text-emerald-400 flex items-center gap-1">
                    <CheckCircle size={12} /> Joining: {instPreview.name}
                  </div>
                )}
                {instCodeError && <p className="text-xs text-red-400">{instCodeError}</p>}
              </div>
              {instMsg && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                  instMsg.type === "success"
                    ? "bg-green-500/10 border border-green-500/30 text-green-400"
                    : "bg-red-500/10 border border-red-500/30 text-red-400"
                }`}>
                  {instMsg.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                  {instMsg.text}
                </div>
              )}
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleJoinInstitution}
                disabled={instLoading || !instPreview}
              >
                <Building2 size={16} />
                {instLoading ? "Joining..." : "Join Institution"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Bell className="text-cyan-400" size={24} />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose what notifications you receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "email" as const, label: "Email Notifications", description: "Receive updates and reports via email" },
            { key: "push" as const, label: "Push Notifications", description: "Get real-time alerts in your browser" },
            { key: "weekly" as const, label: "Weekly Progress Report", description: "A summary of your weekly performance" },
            { key: "marketing" as const, label: "Marketing Emails", description: "Tips, features, and product updates" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/30">
              <div>
                <p className="font-medium text-white">{item.label}</p>
                <p className="text-sm text-slate-400">{item.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifications((n) => ({ ...n, [item.key]: !n[item.key] }))}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${notifications[item.key] ? "bg-purple-600" : "bg-slate-700"}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${notifications[item.key] ? "translate-x-6" : "translate-x-0"}`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
