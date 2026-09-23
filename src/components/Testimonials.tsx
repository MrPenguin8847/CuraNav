"use client";

import { Search, BarChart3, ShieldCheck, IndianRupee, Database, HeartPulse } from "lucide-react";
import { usePlatformStats } from "@/hooks/usePlatformStats";

const capabilities = [
  {
    icon: Search,
    title: "Natural-Language Search",
    description:
      "Describe your medical need in plain language — our AI parses your intent, extracts specialty, budget, and location, then matches you with the right hospitals.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: BarChart3,
    title: "Side-by-Side Comparison",
    description:
      "Compare hospitals on cost (private & PM-JAY), outcomes, procedure volumes, certifications, and facilities — all in one dashboard view.",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: ShieldCheck,
    title: "Transparent Data Labels",
    description:
      "Every data point is labeled by source and verification status. You always know what's officially verified vs. estimated.",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: IndianRupee,
    title: "Dual Cost Breakdown",
    description:
      "See both private/uninsured cost ranges and PM-JAY government rates for every hospital, so you can plan your budget accurately.",
    color: "text-amber-600 bg-amber-50",
  },
];

export function Testimonials() {
  const { stats, loading } = usePlatformStats();

  return (
    <section className="section-padding bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest rounded-full mb-4">
            Platform Capabilities
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Built for <span className="gradient-text">Real Healthcare Decisions</span>
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Every feature is designed to give you transparent, actionable information — not
            marketing fluff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {capabilities.map((c) => (
            <div
              key={c.title}
              className="group p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${c.color}`}
              >
                <c.icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {c.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {c.description}
              </p>
            </div>
          ))}
        </div>

        {/* Live data proof strip */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">
            Live Database Snapshot
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Database className="w-4 h-4 text-primary" />
                <span className="text-2xl font-bold text-foreground">
                  {loading ? "..." : stats.totalHospitals}
                </span>
              </div>
              <p className="text-xs text-slate-500">Total Hospitals</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <HeartPulse className="w-4 h-4 text-green-600" />
                <span className="text-2xl font-bold text-foreground">
                  {loading ? "..." : stats.withOutcomes}
                </span>
              </div>
              <p className="text-xs text-slate-500">With Outcome Data</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span className="text-2xl font-bold text-foreground">
                  {loading ? "..." : stats.withAccreditation}
                </span>
              </div>
              <p className="text-xs text-slate-500">With Accreditations</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <IndianRupee className="w-4 h-4 text-amber-600" />
                <span className="text-2xl font-bold text-foreground">
                  {loading ? "..." : stats.withCostData}
                </span>
              </div>
              <p className="text-xs text-slate-500">With Cost Data</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
