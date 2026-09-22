"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hospital, ReviewStatus } from "@/lib/mockHospitals";
import { Check, X, Clock, Database, AlertCircle, FileText, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function AdminDashboard() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReviewStatus | "all">("all");
  const router = useRouter();

  const fetchHospitals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/hospitals?admin=true");
      if (!res.ok) throw new Error("Failed to load hospitals");
      const data = await res.json();
      setHospitals(data.hospitals);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: ReviewStatus) => {
    // Optimistic UI update
    setHospitals((prev) =>
      prev.map((h) => (h.hospitalId === id ? { ...h, reviewStatus: newStatus } : h))
    );

    try {
      const res = await fetch(`/api/hospitals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewStatus: newStatus }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
      // Revert on failure by refetching
      fetchHospitals();
    }
  };

  const filteredHospitals = hospitals.filter(
    (h) => filter === "all" || h.reviewStatus === filter
  );

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-slate-500 mt-2">
              Review and curate hospital records before they appear in public search results.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition-colors text-sm shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(["all", "pending", "approved", "rejected"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors ${
                filter === tab
                  ? "bg-primary text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-primary/50"
              }`}
            >
              {tab}
              {tab !== "all" && (
                <span className="ml-2 text-xs opacity-75">
                  ({hospitals.filter((h) => h.reviewStatus === tab).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin mb-4" />
            <p>Loading records...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-600 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={fetchHospitals} className="ml-auto underline font-semibold">
              Retry
            </button>
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200">
            <Database className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No records found for this filter.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Hospital Name</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Data Source</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHospitals.map((hospital) => (
                    <tr key={hospital.hospitalId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">
                          {hospital.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          ID: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded">{hospital.hospitalId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {hospital.city}, {hospital.state}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 capitalize">
                          <FileText className="w-3 h-3" />
                          {hospital.sourceType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={hospital.reviewStatus} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {hospital.reviewStatus !== "approved" && (
                            <button
                              onClick={() => handleUpdateStatus(hospital.hospitalId, "approved")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success hover:bg-success/20 font-semibold rounded-lg transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                          )}
                          {hospital.reviewStatus !== "rejected" && (
                            <button
                              onClick={() => handleUpdateStatus(hospital.hospitalId, "rejected")}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 font-semibold rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

function StatusBadge({ status }: { status: ReviewStatus }) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
        <Check className="w-3.5 h-3.5" />
        Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
        <X className="w-3.5 h-3.5" />
        Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
      <Clock className="w-3.5 h-3.5" />
      Pending
    </span>
  );
}
