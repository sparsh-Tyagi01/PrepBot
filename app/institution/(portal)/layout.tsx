"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import {
  Building2, LayoutDashboard, PlayCircle, BookOpen,
  BarChart3, Settings, LogOut, Users, GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const institutionNav = [
  { name: "Dashboard", href: "/institution/dashboard", icon: LayoutDashboard },
  { name: "Interview Types", href: "/institution/interviews", icon: PlayCircle },
  { name: "Question Banks", href: "/institution/question-banks", icon: BookOpen },
  { name: "Branches", href: "/institution/branches", icon: GitBranch },
  { name: "Students", href: "/institution/students", icon: Users },
  { name: "Analytics", href: "/institution/analytics", icon: BarChart3 },
  { name: "Settings", href: "/institution/settings", icon: Settings },
];

export default function InstitutionLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      window.location.href = "/institution/login";
    } else if (status === "authenticated" && session?.user?.role !== "institution-admin") {
      window.location.href = "/dashboard";
    }
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "institution-admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <Link href="/institution/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white leading-tight">Institution</div>
              <div className="text-xs text-blue-400">Admin Portal</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {institutionNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-linear-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="px-3 py-2 bg-slate-800/50 rounded-xl">
            <div className="text-xs text-slate-500">Signed in as</div>
            <div className="text-sm text-slate-300 font-medium truncate">{session?.user?.name}</div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-slate-400 border-slate-700 hover:text-red-400 hover:border-red-500/50"
            onClick={() => signOut({ callbackUrl: "/institution/login" })}
          >
            <LogOut size={16} />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
