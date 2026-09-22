import { Building2, Stethoscope, CheckCircle, Sparkles } from "lucide-react";

const stats = [
  {
    icon: Building2,
    value: "25+",
    label: "Hospitals Listed",
    color: "text-primary bg-primary/10",
  },
  {
    icon: Stethoscope,
    value: "50+",
    label: "Expert Doctors",
    color: "text-blue-600 bg-blue-100",
  },
  {
    icon: CheckCircle,
    value: "100%",
    label: "Transparent Data",
    color: "text-green-600 bg-green-100",
  },
  {
    icon: Sparkles,
    value: "AI",
    label: "Powered Search",
    color: "text-amber-600 bg-amber-100",
  },
];

export function StatStrip() {
  return (
    <section className="py-6 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ icon: Icon, value, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-4 py-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground tracking-tight leading-none">
                  {value}
                </p>
                <p className="text-sm text-muted font-medium mt-0.5">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
