import { ShieldCheck } from "lucide-react";

export function TrustBanner() {
  return (
    <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-start gap-6">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Built on Responsible AI — Transparent by Design
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
            CuraNav uses AI to understand your search — not to diagnose or recommend treatment.
            All hospital data is labeled by source and verification status, so you always know
            what&rsquo;s confirmed and what&rsquo;s simulated for this prototype. Our AI extracts
            your intent and surfaces matches; the decision to contact or visit a hospital
            is always yours.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {["No diagnosis or treatment advice", "Source-labeled data", "AI intent extraction only", "Prototype — not clinical"].map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
