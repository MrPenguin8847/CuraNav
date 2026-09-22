import { ShieldCheck, Cpu, ClipboardCheck, BarChart3 } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Transparent Data",
    description:
      "Every data point is labeled by source and verification status — you always know what's confirmed and what's estimated.",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: Cpu,
    title: "AI-Powered Search",
    description:
      "Our AI understands plain-language queries to extract your intent and surface the best hospital matches instantly.",
    color: "text-primary bg-primary/10",
  },
  {
    icon: ClipboardCheck,
    title: "Verified Hospitals",
    description:
      "We verify hospital information including facilities, specialties, and accreditation to ensure accurate results.",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: BarChart3,
    title: "Easy Comparison",
    description:
      "Compare hospitals side-by-side on cost, distance, facilities, and ratings to make confident decisions.",
    color: "text-amber-600 bg-amber-50",
  },
];

export function WhyChooseUs() {
  return (
    <section className="section-padding section-alt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <div>
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest rounded-full mb-4">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose{" "}
              <span className="gradient-text">CuraNav</span>
            </h2>
            <p className="text-slate-500 mb-10 max-w-lg">
              Built on responsible AI principles, CuraNav puts transparency and
              trust at the center of your healthcare decision-making.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {features.map(({ icon: Icon, title, description, color }) => (
                <div
                  key={title}
                  className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${color}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-1.5">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Visual */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative">
              <div className="w-80 h-80 rounded-3xl bg-gradient-to-br from-primary/10 via-primary-light to-secondary/10 flex items-center justify-center border border-primary/10">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-white shadow-lg flex items-center justify-center mb-4">
                    <ShieldCheck className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    Responsible AI
                  </h3>
                  <p className="text-sm text-slate-500">
                    No diagnosis. No treatment advice. Just transparent
                    information.
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
