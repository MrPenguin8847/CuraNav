import { ShieldCheck, Cpu, ClipboardCheck, BarChart3 } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Source-Labeled Data",
    description:
      "Every hospital record includes its source (NHA, self-reported, or synthetic) and verification status — no hidden data.",
    color: "text-emerald-400 bg-emerald-500/10",
  },
  {
    icon: Cpu,
    title: "AI-Powered Search",
    description:
      "Our AI extracts intent from plain-language queries — mapping your words to specialties, budget filters, and location automatically.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: ClipboardCheck,
    title: "PM-JAY Empanelled",
    description:
      "All hospitals in our index are sourced from NHA's Health Empanelment Module — real PM-JAY empanelled facilities with verified data.",
    color: "text-blue-400 bg-blue-500/10",
  },
  {
    icon: BarChart3,
    title: "Cost & Outcome Comparison",
    description:
      "Compare hospitals side-by-side on private vs PM-JAY costs, procedure volumes, outcome metrics, and accreditations.",
    color: "text-amber-400 bg-amber-500/10",
  },
];

export function WhyChooseUs() {
  return (
    <section className="section-padding py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest rounded-full mb-4">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose{" "}
              <span className="gradient-text text-gradient-brand">CuraNav</span>
            </h2>
            <p className="text-muted-foreground mb-10 max-w-lg">
              Built on responsible AI principles with real NHA/PM-JAY data, CuraNav
              puts transparency and trust at the center of healthcare discovery.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {features.map(({ icon: Icon, title, description, color }) => (
                <div
                  key={title}
                  className="p-5 glass rounded-2xl hover-lift"
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1.5">
                    {title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              <div className="w-80 h-80 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-white/5">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto rounded-2xl glass flex items-center justify-center mb-4">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    Responsible AI
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    No diagnosis. No treatment advice. Just transparent, verified
                    hospital data.
                  </p>
                </div>
              </div>

              {/* Floating decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 rounded-2xl bg-primary/10 border border-primary/10 animate-float" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-secondary/10 border border-secondary/10 animate-float" style={{ animationDelay: "3s" }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
