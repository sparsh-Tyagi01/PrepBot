"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Users, Search, Mail, Calendar } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email: string;
  department: string | null;
  yearOfStudy: number | null;
  createdAt: string;
  _count: { interviewSessions: number };
}

export default function InstitutionStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/institution/students")
      .then((r) => r.json())
      .then((d) => {
        setStudents(d.students ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Students</h1>
        <p className="text-slate-400 mt-1">Students enrolled in your institution</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={18} className="text-blue-400" />
            Enrolled Students
            {!loading && (
              <Badge variant="outline" className="border-slate-600 text-slate-400 ml-2">
                {filtered.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Users size={40} className="mx-auto mb-3 opacity-30" />
              <p>{search ? "No students match your search." : "No students enrolled yet."}</p>
              <p className="text-sm mt-1">
                Share your institution code with students so they can link their account.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{student.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail size={10} />
                        {student.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    {student.department && (
                      <span className="text-xs text-slate-400 hidden sm:block">{student.department}</span>
                    )}
                    <div className="text-center">
                      <p className="text-sm font-semibold text-white">{student._count.interviewSessions}</p>
                      <p className="text-xs text-slate-500">interviews</p>
                    </div>
                    <div className="text-xs text-slate-500 items-center gap-1 hidden md:flex">
                      <Calendar size={10} />
                      {new Date(student.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
