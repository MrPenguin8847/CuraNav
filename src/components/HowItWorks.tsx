import { MessageSquareText, SlidersHorizontal, GitCompare } from "lucide-react";

const steps = [
  {
    number: 1,
    icon: MessageSquareText,
    heading: "Describe Your Need",
    description:
      "Type a plain-language sentence like 'I need heart surgery in Chandigarh under ₹2 lakh' — our AI understands your intent without medical jargon.",
  },
  {
    number: 2,
    icon: SlidersHorizontal,
    heading: "See Real Matches",
    description:
      "AI extracts your specialty, budget, and location filters, then queries our PM-JAY hospital index. Each result shows its data source and verification status.",
  },
  {
    number: 3,
    icon: GitCompare,
    heading: "Compare & Decide",
    description:
      "Side-by-side comparison of private vs PM-JAY costs, procedure volumes, outcome metrics, and accreditations — all sourced from NHA data.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest rounded-full mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How <span className="gradient-text text-gradient-brand">CuraNav</span> Works
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From a single sentence to a confident, informed decision — in three
            steps, backed by real government healthcare data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 z-0" />

          {steps.map(({ number, icon: Icon, heading, description }) => (
            <div
              key={number}
              className="relative z-10 flex flex-col items-center text-center"
            >
              {/* Number badge */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl mb-6 shadow-lg shadow-primary/25">
                {number}
              </div>

              <div className="glass rounded-2xl p-8 hover-lift w-full">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 mx-auto">
                  <Icon className="w-6 h-6 text-primary" />
                </div>

                <h3 className="text-lg font-bold text-foreground mb-3">
                  {heading}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
