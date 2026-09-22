import { Building2, FlaskConical, CheckCircle, Sparkles } from "lucide-react";

const stats = [
  {
    icon: Building2,
    value: "25+",
    label: "Hospitals Listed",
  },
  {
    icon: FlaskConical,
    value: "6",
    label: "Conditions Covered",
  },
  {
    icon: CheckCircle,
    value: "100%",
    label: "Transparent Data Labeling",
  },
  {
    icon: Sparkles,
    value: "AI",
    label: "Assisted Search",
  },
];

export function StatStrip() {
  return (
    <section className="py-10 bg-white border-y border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y-2 md:divide-y-0 md:divide-x divide-slate-100">
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center text-center py-4 md:py-0 md:px-6 first:pt-0 last:pb-0"
            >
              <div className="w-8 h-8 mb-2 flex items-center justify-center text-primary/70">
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-extrabold text-foreground tracking-tight">
                {value}
              </p>
              <p className="text-xs text-muted font-medium mt-0.5 max-w-[120px]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
