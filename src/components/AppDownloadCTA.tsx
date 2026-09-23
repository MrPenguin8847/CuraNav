import { Activity, Search, GitCompare, ArrowRight } from "lucide-react";
import Link from "next/link";

export function AppDownloadCTA() {
  return (
    <section className="section-padding bg-gradient-to-br from-primary via-primary-dark to-[#3d2f66] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
              Start Making Informed Healthcare Decisions with{" "}
              <span className="text-primary-light">CuraNav</span>
            </h2>
            <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
              Search PM-JAY empanelled hospitals, compare costs and outcomes, and
              discover the right care for your needs — all powered by transparent,
              responsible AI.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 bg-white text-primary rounded-full px-8 py-3.5 font-semibold hover:bg-primary-light transition-colors shadow-lg shadow-black/10"
              >
                Try CuraNav Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white rounded-full px-8 py-3.5 font-semibold hover:bg-white/10 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Right: App-like mockup cards */}
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              {/* Main "app" card */}
              <div className="w-72 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">CuraNav</p>
                    <p className="text-white/50 text-xs">Healthcare Search</p>
                  </div>
                </div>

                {/* Mock search bar */}
                <div className="bg-white/10 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <Search className="w-4 h-4 text-white/50" />
                  <span className="text-white/50 text-xs">Search hospitals...</span>
                </div>

                {/* Mock results */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white/10 rounded-xl p-3 mb-2 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <GitCompare className="w-4 h-4 text-white/60" />
                    </div>
                    <div className="flex-1">
                      <div className="h-2 bg-white/30 rounded-full w-3/4 mb-1.5" />
                      <div className="h-1.5 bg-white/15 rounded-full w-1/2" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating accent card */}
              <div className="absolute -right-8 top-12 bg-white rounded-2xl shadow-xl p-4 animate-float border border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 text-xs font-bold">✓</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Verified</p>
                    <p className="text-[10px] text-slate-500">NABH Accredited</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
